import { ProfileForm } from "@/components/dashboard/profile-form";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { getDictionary, type Locale, isValidLocale, defaultLocale } from "@/lib/i18n";

export const dynamic = 'force-dynamic';

export default async function ProfilePage({
    params,
    searchParams,
}: {
    params: Promise<{ locale: string }>;
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
    const { locale: localeParam } = await params;
    const locale: Locale = isValidLocale(localeParam) ? localeParam : defaultLocale;
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

    const initialData = {
        first_name: profile?.first_name || '',
        last_name: profile?.last_name || '',
        email: user.email || '',
        country: profile?.country || '',
        city: profile?.city || '',
        phone: profile?.phone || '',
    };

    const dict = await getDictionary(locale);
    const t = dict.profile;

    return (
        <div className="max-w-2xl mx-auto space-y-8">
            <div>
                <h1 className="font-serif font-semibold text-[1.9rem] leading-tight text-foreground">{t.title}</h1>
                <p className="text-muted-foreground mt-2">
                    {t.subtitle}
                </p>
            </div>

            {showOnboarding && (
                <div className="bg-primary/5 border border-primary/20 text-primary-800 p-4 rounded-lg flex items-start gap-3 animate-in fade-in slide-in-from-top-2">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mt-0.5 text-primary"><circle cx="12" cy="12" r="10"></circle><line x1="12" x2="12" y1="8" y2="12"></line><line x1="12" x2="12.01" y1="16" y2="16"></line></svg>
                    <div>
                        <p className="font-medium text-primary-900">{t.onboardingBanner.heading}</p>
                        <p className="text-sm mt-1 text-primary-700/80">
                            {t.onboardingBanner.body}
                        </p>
                    </div>
                </div>
            )}

            <ProfileForm initialData={initialData} dictionary={dict} onboarding={showOnboarding} locale={locale} />
        </div>
    );
}
