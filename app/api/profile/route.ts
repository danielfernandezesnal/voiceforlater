import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { data: profile, error } = await supabase
            .from("profiles")
            .select("*")
            .eq("id", user.id)
            .single();

        if (error) {
            console.error("GET /api/profile error:", error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ ...profile, email: user.email });
    } catch (e) {
        console.error("GET /api/profile exception:", e);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

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
                first_name: first_name && typeof first_name === 'string' ? first_name.trim() || null : null,
                last_name: last_name && typeof last_name === 'string' ? last_name.trim() || null : null,
                country: country.trim(),
                city: city && typeof city === 'string' ? city.trim() || null : null,
                phone: (() => {
                    if (!phone || typeof phone !== 'string') return null;
                    // Remove all non-dial characters (allow +, digits, spaces)
                    const cleaned = phone.replace(/[^+\d\s]/g, '').replace(/\s+/g, ' ').trim();

                    if (!cleaned) return null;

                    // Enforce international format (start with +)
                    if (!cleaned.startsWith('+')) {
                        throw new Error('El teléfono debe incluir el código de país (ej: +598 ...).');
                    }

                    // Simple length check: +XX N... (min 6 chars to include dial and at least 1-2 digits)
                    if (cleaned.length < 6) return null;

                    return cleaned;
                })(),
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
