import { SetPasswordForm } from "@/components/auth/set-password-form";
import { getDictionary, type Locale, isValidLocale, defaultLocale } from "@/lib/i18n";
import { createClient } from "@/lib/supabase/server";

export const dynamic = 'force-dynamic'

export default async function SetPasswordPage({
    params,
}: {
    params: Promise<{ locale: string }>;
}) {
    const { locale: localeParam } = await params;
    const locale: Locale = isValidLocale(localeParam) ? localeParam : defaultLocale;
    const dict = await getDictionary(locale);

    return (
        <div className="min-h-screen flex flex-col items-center justify-center p-8 bg-background">
            <SetPasswordForm dictionary={dict.auth} locale={locale} />
        </div>
    );
}
