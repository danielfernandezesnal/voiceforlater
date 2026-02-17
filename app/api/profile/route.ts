import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export async function PUT(request: NextRequest) {
    try {
        const supabase = await createClient();
        await supabase.auth.getSession();
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { first_name, last_name, country, city, phone, email } = body;

        // Validate country is required
        if (typeof country !== 'string' || country.trim() === '') {
            return NextResponse.json({ error: 'El país es obligatorio.' }, { status: 400 });
        }

        // 1. Update profile fields
        const { error: profileError } = await supabase
            .from('profiles')
            .update({
                first_name: first_name?.trim() || null,
                last_name: last_name?.trim() || null,
                country: country.trim(),
                city: city?.trim() || null,
                phone: phone?.trim() || null,
            })
            .eq('id', user.id);

        if (profileError) {
            console.error('[PUT /api/profile] Profile update error:', profileError);
            return NextResponse.json({ error: profileError.message }, { status: 500 });
        }

        // 2. Update email if changed
        let emailUpdated = false;
        let emailConfirmationRequired = false;

        if (email && email !== user.email) {
            const { error: emailError } = await supabase.auth.updateUser({ email });
            if (emailError) {
                return NextResponse.json({
                    error: `Perfil guardado, pero el email no pudo actualizarse: ${emailError.message}`,
                    profileSaved: true,
                }, { status: 400 });
            }
            emailUpdated = true;
            emailConfirmationRequired = true; // Supabase sends confirmation email by default
        }

        return NextResponse.json({
            success: true,
            emailUpdated,
            emailConfirmationRequired,
        });
    } catch (e: any) { // eslint-disable-line @typescript-eslint/no-explicit-any
        console.error('[PUT /api/profile] Error:', e);
        return NextResponse.json({ error: e.message || 'Internal Server Error' }, { status: 500 });
    }
}
