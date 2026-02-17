import { ProfileForm } from "@/components/dashboard/profile-form";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export const dynamic = 'force-dynamic';

export default async function ProfilePage({
    params,
    searchParams,
}: {
    params: Promise<{ locale: string }>;
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
    const { locale } = await params;
    const query = await searchParams;
    const showOnboarding = query.onboarding === '1';

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        redirect(`/${locale}/auth/login`);
    }

    // Fetch profile data
    const { data: profile } = await supabase
        .from('profiles')
        .select('first_name, last_name, country, city, phone')
        .eq('id', user.id)
        .single();

    // ... initialData logic ...

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

            {showOnboarding && (
                <div className="bg-primary/5 border border-primary/20 text-primary-800 p-4 rounded-lg flex items-start gap-3 animate-in fade-in slide-in-from-top-2">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mt-0.5 text-primary"><circle cx="12" cy="12" r="10"></circle><line x1="12" x2="12" y1="8" y2="12"></line><line x1="12" x2="12.01" y1="16" y2="16"></line></svg>
                    <div>
                        <p className="font-medium text-primary-900">Completá tu perfil para comenzar</p>
                        <p className="text-sm mt-1 text-primary-700/80">
                            Para crear tu primer mensaje, necesitamos conocerte un poco mejor. Por favor, completá los campos obligatorios.
                        </p>
                    </div>
                </div>
            )}

            <ProfileForm initialData={initialData} />
        </div>
    );
}
