import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { getResend } from '@/lib/resend';
import { ADMIN_EMAIL } from '@/lib/constants';
import { getDictionary } from '@/lib/i18n/dictionaries';
import { getResetPasswordTemplate, EmailDictionary } from '@/lib/email-templates';

export const dynamic = 'force-dynamic';

function generatePassword(length = 10) {
    const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let pass = '';
    for (let i = 0; i < length; i++) {
        const randomValues = new Uint32Array(1);
        crypto.getRandomValues(randomValues);
        pass += chars[randomValues[0] % chars.length];
    }
    return pass;
}

export async function POST(request: NextRequest) {
    try {
        const { email, locale = 'es' } = await request.json();

        if (!email) {
            return NextResponse.json({ error: 'Email is required' }, { status: 400 });
        }

        const supabase = createAdminClient();

        // 1. Efficient user lookup via RPC
        const { data: userId, error: rpcError } = await supabase.rpc('get_user_id_by_email', {
            email_to_find: email
        });

        let finalUserId: string;

        if (rpcError) {
            console.error('RPC Error searching user:', rpcError);
            // Fallback to listUsers if RPC fails (e.g. not yet deployed in all envs)
            const { data: { users }, error: listError } = await supabase.auth.admin.listUsers();
            if (listError) throw listError;
            const user = users.find(u => u.email?.toLowerCase() === email.toLowerCase());
            if (!user) return NextResponse.json({ success: true });
            finalUserId = user.id;
        } else {
            if (!userId) return NextResponse.json({ success: true });
            finalUserId = userId;
        }

        // 2. Generate new password
        const newPassword = generatePassword(10);

        // 3. Update user password
        const { error: updateError } = await supabase.auth.admin.updateUserById(
            finalUserId,
            { password: newPassword, user_metadata: { auth_password_set: true } }
        );

        if (updateError) {
            console.error('Failed to update password:', updateError);
            throw updateError;
        }

        // 4. Update profile flag
        await supabase.from('profiles').update({ auth_password_set: true }).eq('id', finalUserId);

        // 5. Send Email with Terracotta Design
        const dict = await getDictionary(locale) as unknown as EmailDictionary;
        const { subject, html } = getResetPasswordTemplate(dict, { password: newPassword });

        const resend = getResend();
        const sender = 'Carry My Words <hola@carrymywords.com>'; // Standardized sender
        const recipientEmail = email === ADMIN_EMAIL ? 'danielfernandezesnal@gmail.com' : email;

        await resend.emails.send({
            from: sender,
            to: recipientEmail,
            subject,
            html
        });

        return NextResponse.json({ success: true });

    } catch (error) {
        console.error('Reset password error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

