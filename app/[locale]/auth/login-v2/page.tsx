import Link from "next/link";
import { getDictionary, type Locale, isValidLocale, defaultLocale } from "@/lib/i18n";
import { LoginForm } from "@/components/auth/login-form";

// New page - force dynamic
export const dynamic = 'force-dynamic'

export default async function LoginV2Page({
    params,
}: {
    params: Promise<{ locale: string }>;
}) {
    const { locale: localeParam } = await params;
    const locale: Locale = isValidLocale(localeParam) ? localeParam : defaultLocale;
    const dict = await getDictionary(locale);

    return (
        <div className="min-h-screen flex flex-col items-center justify-center p-8 bg-blue-50/20">
            <div className="w-full max-w-md">
                {/* Back Link */}
                <Link
                    href={`/${locale}`}
                    className="inline-flex items-center text-sm text-primary hover:text-primary/80 mb-8 transition-colors"
                >
                    <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                    {locale === 'en' ? 'Back (V2 Test)' : 'Volver (Prueba V2)'}
                </Link>

                <div className="mb-4 p-4 border border-blue-200 bg-blue-50 text-blue-800 rounded-lg text-sm">
                    Esta es la versión V2 de prueba para verificar despliegue.
                </div>

                {/* Login Card */}
                <div className="bg-card border border-border rounded-2xl p-8 shadow-xl">
                    <LoginForm dictionary={dict.auth} locale={locale} />
                </div>
            </div>
        </div>
    );
}
