import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getResend } from '@/lib/resend';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const supabase = await createClient();

        // Hydrate session from cookies first
        await supabase.auth.getSession();

        // Then validate securely with getUser()
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { data, error } = await supabase
            .from('trusted_contacts')
            .select('*')
            .eq('user_id', user.id);

        if (error) {
            console.error('[GET /api/trusted-contacts] DB error:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json(data);
    } catch (e: any) {
        console.error('[GET /api/trusted-contacts] Error:', e);
        return NextResponse.json({ error: e.message || 'Internal Server Error' }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    const supabase = await createClient();
    await supabase.auth.getSession();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const { name, email, locale } = await request.json();

        if (!email) {
            return NextResponse.json({ error: 'Email is required' }, { status: 400 });
        }

        // 1. Get user plan and check limit
        const { data: profile } = await supabase
            .from('profiles')
            .select('plan')
            .eq('id', user.id)
            .single();

        const userPlan = profile?.plan || 'free';
        const maxContacts = userPlan === 'pro' ? 3 : 1;

        const { count, error: countError } = await supabase
            .from('trusted_contacts')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', user.id);

        if (countError) throw countError;

        if (count !== null && count >= maxContacts) {
            return NextResponse.json({
                error: userPlan === 'free'
                    ? 'Límite del plan Free alcanzado (1 contacto). Pasate a Pro para agregar hasta 3.'
                    : 'Máximo de 3 contactos de confianza permitidos.',
                limitReached: true
            }, { status: 403 });
        }

        // 2. Insert Contact
        const { data: contact, error: insertError } = await supabase
            .from('trusted_contacts')
            .insert({
                user_id: user.id,
                name: name || '',
                email: email
            })
            .select()
            .single();

        if (insertError) {
            if (insertError.code === '23505') { // Unique violation
                return NextResponse.json({ error: 'This contact is already in your list.' }, { status: 409 });
            }
            throw insertError;
        }

        // 3. Send Invitation Email (Requirement 6)
        const resend = getResend();
        const sender = process.env.RESEND_FROM_EMAIL || 'Carry my Words <onboarding@resend.dev>';

        let fromAddress = sender;
        if (!sender.includes('<') && !sender.toLowerCase().includes('carry my words')) {
            if (sender.includes('<')) {
                fromAddress = sender.replace(/.*</, 'Carry my Words <');
            } else {
                fromAddress = `Carry my Words <${sender}>`;
            }
        }

        const userName = user.user_metadata?.full_name || user.email;

        // Subject and Body based on Locale
        // "Fulano de tal te puso como persona de confianza para los mensajes que estableció en Carry my Words"
        const subject = locale === 'es'
            ? `${userName} te eligió como contacto de confianza en Carry my Words`
            : `${userName} chose you as a trusted contact on Carry my Words`;

        const html = locale === 'es'
            ? `
            <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                <h2>Has sido elegido como contacto de confianza</h2>
                <p>Hola ${name || ''},</p>
                <p><strong>${userName}</strong> te ha seleccionado como su "persona de confianza" en <strong>Carry my Words</strong>.</p>
                
                <div style="background: #f4f4f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
                    <h3 style="margin-top: 0;">¿Qué significa esto?</h3>
                    <p>Carry my Words permite a las personas dejar mensajes programados para el futuro. Si ${userName} deja de confirmar su actividad por un tiempo prolongado, te contactaremos para verificar su estado.</p>
                    <p>Solo en ese caso, y con tu confirmación, entregaremos los mensajes que dejó preparados.</p>
                </div>
                
                <p>No necesitas hacer nada ahora. Solo te avisamos para que estés al tanto.</p>
                <p>Gracias por ser parte de esto.</p>
            </div>
            `
            : `
            <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                <h2>You have been chosen as a trusted contact</h2>
                <p>Hello ${name || ''},</p>
                <p><strong>${userName}</strong> has selected you as their "trusted contact" on <strong>Carry my Words</strong>.</p>
                
                <div style="background: #f4f4f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
                    <h3 style="margin-top: 0;">What does this mean?</h3>
                    <p>Carry my Words allows people to leave messages scheduled for the future. If ${userName} stops confirming their activity for an extended period, we will contact you to verify their status.</p>
                    <p>Only then, and with your confirmation, will we deliver the messages they prepared.</p>
                </div>
                
                <p>You don't need to do anything right now. We just wanted to let you know.</p>
                <p>Thank you.</p>
            </div>
            `;

        await resend.emails.send({
            from: fromAddress,
            to: email,
            subject: subject,
            html: html
        });

        return NextResponse.json(contact);

    } catch (error: any) { // eslint-disable-line @typescript-eslint/no-explicit-any
        console.error('Error creating contact:', error);
        return NextResponse.json({ error: error.message || 'Internal Error' }, { status: 500 });
    }
}

export async function DELETE(request: NextRequest) {
    const supabase = await createClient();
    await supabase.auth.getSession();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');

        if (!id) {
            return NextResponse.json({ error: 'ID is required' }, { status: 400 });
        }

        const { error } = await supabase
            .from('trusted_contacts')
            .delete()
            .eq('id', id)
            .eq('user_id', user.id);

        if (error) throw error;

        return NextResponse.json({ success: true });
    } catch (error: any) { // eslint-disable-line @typescript-eslint/no-explicit-any
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
