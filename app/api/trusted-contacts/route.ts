import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getResend, DEFAULT_SENDER } from '@/lib/resend';
import { getEffectivePlan } from '@/lib/plan-resolver';
import { getPlanLimits } from '@/lib/plans';
import { trackServerEvent } from '@/lib/analytics/trackEvent';
import { getErrorMessage } from '@/lib/errors';
import { trackEmail } from '@/lib/email-tracking';
import { getDictionary, type Locale } from '@/lib/i18n';
import { getTrustedContactInvitationTemplate } from '@/lib/email-templates';

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

        if (normalizedEmail === user.email?.toLowerCase()) {
            return NextResponse.json({
                error: 'No podés agregarte a vos mismo como contacto de confianza.',
                code: 'SELF_CONTACT'
            }, { status: 400 });
        }

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

        // Subject and Body based on Locale
        const contactFirstName = name.trim().split(' ')[0];
        const senderFirstName = profile?.first_name || 'Alguien';
        const senderFullName = profile?.first_name
            ? `${profile.first_name} ${profile.last_name || ''}`.trim()
            : user.user_metadata?.full_name || user.email;

        const { subject, html } = getTrustedContactInvitationTemplate(dict as any, {
            contactFirstName,
            senderFullName: senderFullName || '',
            senderFirstName
        });

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

        // 1. Check if assigned to any active message
        const { data: assignments, error: assignmentError } = await supabase
            .from('message_trusted_contacts')
            .select('message_id')
            .eq('trusted_contact_id', id)
            .limit(1);

        if (assignmentError) {
             console.error('[DELETE /api/trusted-contacts] Relation delete error:', assignmentError);
        } else if (assignments && assignments.length > 0) {
            return NextResponse.json({
                error: 'Este contacto esta asignado a un mensaje. Debes cargar un nuevo contacto para ese mensaje primero.',
                code: 'CONTACT_IN_USE'
            }, { status: 409 });
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

        return NextResponse.json({ success: true });
    } catch (error: unknown) {
        return NextResponse.json({ error: getErrorMessage(error) }, { status: 500 });
    }
}
