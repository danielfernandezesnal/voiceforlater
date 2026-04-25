import { getDictionary, type Locale, isValidLocale, defaultLocale } from "@/lib/i18n";
import { SetPasswordForm } from "@/components/auth/set-password-form";

export const dynamic = 'force-dynamic'

export default async function SetPasswordPage({
    params,
    searchParams,
}: {
    params: Promise<{ locale: string }>;
    searchParams: Promise<{ next?: string }>;
}) {
    const { locale: localeParam } = await params;
    const locale: Locale = isValidLocale(localeParam) ? localeParam : defaultLocale;
    const dict = await getDictionary(locale);
    
    const resolvedSearch = await searchParams;
    const next = resolvedSearch?.next ?? null;

    // --- TEMPORARY INSTRUMENTATION LOGS ---
    console.log(`[received-flow:set-password-page] START`);
    console.log(`[received-flow:set-password-page] locale: ${locale}`);
    console.log(`[received-flow:set-password-page] next received: ${!!next}`);
    console.log(`[received-flow:set-password-page] next value (truncated): ${next ? next.substring(0, 30) + '...' : 'none'}`);
    console.log(`[received-flow:set-password-page] END`);

    return (
        <div className="min-h-screen flex flex-col items-center justify-center p-8 bg-background">
            <div className="w-full max-w-md">
                <SetPasswordForm dictionary={dict.auth} locale={locale} next={next} />
            </div>
        </div>
    );
}
