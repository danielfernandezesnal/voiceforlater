import { ProfileForm } from "@/components/dashboard/profile-form";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export const dynamic = 'force-dynamic';

export default async function ProfilePage({
    params,
}: {
    params: Promise<{ locale: string }>;
}) {
    const { locale } = await params;

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        redirect(`/${locale}/auth/login`);
    }

    // Fetch profile data
    const { data: profile } = await supabase
        .from('profiles')
        .select('first_name, last_name, country, city, phone, plan')
        .eq('id', user.id)
        .single();

    const initialData = {
        first_name: profile?.first_name || '',
        last_name: profile?.last_name || '',
        email: user.email || '',
        country: profile?.country || '',
        city: profile?.city || '',
        phone: profile?.phone || '',
    };

    return (
        <div className="max-w-2xl mx-auto space-y-8">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Mi Perfil</h1>
                <p className="text-muted-foreground mt-2">
                    Configuración de tu cuenta y datos personales.
                </p>
            </div>

            <ProfileForm initialData={initialData} />
        </div>
    );
}
