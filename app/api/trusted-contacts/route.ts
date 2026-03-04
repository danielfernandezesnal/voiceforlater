import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getResend, DEFAULT_SENDER } from '@/lib/resend';
import { getEffectivePlan } from '@/lib/plan-resolver';
import { getPlanLimits } from '@/lib/plans';
import { trackServerEvent } from '@/lib/analytics/trackEvent';
import { getErrorMessage } from '@/lib/errors';
import { trackEmail } from '@/lib/email-tracking';
import { getDictionary, type Locale } from '@/lib/i18n';

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
            .eq('user_id', user.id)
            .order('name', { ascending: true }); // Mantener order

        if (error) {
            console.error('[GET /api/trusted-contacts] DB error:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json(data);
    } catch (e: unknown) {
        console.error('[GET /api/trusted-contacts] Error:', e);
        return NextResponse.json({ error: getErrorMessage(e) }, { status: 500 });
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

        const normalizedEmail = email.trim().toLowerCase();

        // 1. Get user plan and check limit
        const plan = await getEffectivePlan(supabase, user.id);
        const limits = getPlanLimits(plan);
        const maxContacts = limits.maxTrustedContacts;

        // 1.5 Get user profile for invitation details (name)
        const { data: profile } = await supabase
            .from('profiles')
            .select('first_name, last_name')
            .eq('id', user.id)
            .single();

        const { count, error: countError } = await supabase
            .from('trusted_contacts')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', user.id);

        if (countError) throw countError;

        if (count !== null && count >= maxContacts) {
            return NextResponse.json({
                error: 'PLAN_LIMIT',
                reason: 'MAX_TRUSTED_CONTACTS',
                details: plan === 'free'
                    ? 'Free plan is limited to 1 trusted contact. Upgrade to Pro for more.'
                    : `You have reached the limit of ${maxContacts} trusted contacts.`
            }, { status: 403 });
        }

        // Check for duplicates (case-insensitive)
        const { data: existing } = await supabase
            .from('trusted_contacts')
            .select('id')
            .eq('user_id', user.id)
            .ilike('email', normalizedEmail)
            .maybeSingle();

        if (existing) {
            return NextResponse.json({
                error: 'Este contacto ya existe.',
                code: 'CONTACT_EXISTS'
            }, { status: 409 });
        }

        // 2. Insert Contact
        const { data: contact, error: insertError } = await supabase
            .from('trusted_contacts')
            .insert({
                user_id: user.id,
                name: name || '',
                email: normalizedEmail
            })
            .select()
            .single();

        if (insertError) {
            throw insertError;
        }

        // 3. Send Invitation Email (Requirement 6)
        const resend = getResend();
        const fromAddress = DEFAULT_SENDER;

        console.log('[POST /api/trusted-contacts] Using From Address:', fromAddress);

        const fullName = profile?.first_name
            ? `${profile.first_name} ${profile.last_name || ''}`.trim()
            : user.user_metadata?.full_name;

        const userDisplayName: string = (fullName ? `${fullName} (${user.email})` : user.email) || 'User';

        // Fallback for locale from referer if not provided
        let emailLocale = locale;
        if (!emailLocale) {
            const referer = request.headers.get('referer');
            if (referer) {
                try {
                    const url = new URL(referer);
                    const firstPart = url.pathname.split('/')[1];
                    if (['en', 'es'].includes(firstPart)) {
                        emailLocale = firstPart;
                    }
                } catch (e) { }
            }
        }
        emailLocale = emailLocale || 'en';

        const dict = await getDictionary(emailLocale as Locale);
        const t = dict.checkin.contactNotification;

        // Subject and Body based on Locale
        const subject = (t.subject || '').replace('{name}', userDisplayName);

        const html = `
            <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #333;">
                <h2 style="color: #2c3e50;">${t.title || 'Fuiste elegido como contacto de confianza'}</h2>
                <p>${(t.intro || '').replace('{name}', `<strong>${userDisplayName}</strong>`)}</p>
                
                <div style="background: #f4f4f5; padding: 25px; border-radius: 12px; margin: 25px 0; border: 1px solid #e4e4e7;">
                    <h3 style="margin-top: 0; color: #18181b;">¿Qué significa esto?</h3>
                    <p style="line-height: 1.6;">${(t.explanation || '').replace('{name}', userDisplayName)}</p>
                </div>
                
                <p style="line-height: 1.6;">${(t.noAction || '').replace('{name}', userDisplayName)}</p>
                
                <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; font-size: 14px; color: #71717a;">
                    <p style="margin-bottom: 4px;"><strong>${t.signature || 'Carry My Words'}</strong></p>
                    <p style="margin-top: 0; font-style: italic;">${t.tagline || 'Para que tus palabras lleguen cuando tengan que llegar.'}</p>
                </div>
            </div>
        `;

        console.log('[POST /api/trusted-contacts] Sending email to:', email);
        const { data: emailRes, error: emailErr } = await resend.emails.send({
            from: fromAddress,
            to: email,
            subject: subject,
            html: html
        });

        if (emailErr) {
            console.error('[POST /api/trusted-contacts] Resend error:', JSON.stringify(emailErr));
            await trackEmail({
                userId: user.id,
                toEmail: email,
                emailType: 'trusted_contact_alert',
                status: 'failed',
                errorMessage: JSON.stringify(emailErr)
            });
        } else {
            console.log('[POST /api/trusted-contacts] Invitation email sent successfully. ID:', emailRes?.id);
            await trackEmail({
                userId: user.id,
                toEmail: email,
                emailType: 'trusted_contact_alert',
                providerMessageId: emailRes?.id,
                status: 'sent'
            });
        }

        // --- Product Analytics ---
        await trackServerEvent({
            event: 'contact.added',
            userId: user.id
        });

        return NextResponse.json(contact);

    } catch (error: unknown) {
        console.error('Error creating contact:', error);
        return NextResponse.json({ error: getErrorMessage(error) }, { status: 500 });
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

        console.log(`[DELETE /api/trusted-contacts] Attempting to delete contact ${id} for user ${user.id}`);

        // 1. Explicitly delete relations first (Safety against FK constraints if CASCADE isn't enough)
        const { error: relationError } = await supabase
            .from('message_trusted_contacts')
            .delete()
            .eq('trusted_contact_id', id);

        if (relationError) {
            console.error('[DELETE /api/trusted-contacts] Relation delete error:', relationError);
            // We continue anyway, as the main delete might still work
        }

        // 2. Delete the contact
        const { error } = await supabase
            .from('trusted_contacts')
            .delete()
            .eq('id', id)
            .eq('user_id', user.id);

        if (error) {
            console.error('[DELETE /api/trusted-contacts] Contact delete error:', error);
            throw error;
        }

        console.log(`[DELETE /api/trusted-contacts] Contact ${id} deleted successfully`);
        return NextResponse.json({ success: true });
    } catch (error: unknown) {
        return NextResponse.json({ error: getErrorMessage(error) }, { status: 500 });
    }
}
