import Link from "next/link";
import { getDictionary, type Locale, isValidLocale, defaultLocale } from "@/lib/i18n";
import { LoginForm } from "@/components/auth/login-form";

// Force dynamic rendering - this page uses client-side auth
export const dynamic = 'force-dynamic'

export default async function LoginPage({
    params,
}: {
    params: Promise<{ locale: string }>;
}) {
    const { locale: localeParam } = await params;
    const locale: Locale = isValidLocale(localeParam) ? localeParam : defaultLocale;
    const dict = await getDictionary(locale);

    return (
        <div className="min-h-screen flex flex-col items-center justify-center p-8">
            <div className="w-full max-w-md">
                {/* Back Link */}
                <Link
                    href={`/${locale}`}
                    className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-8 transition-colors"
                >
                    <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                    {locale === 'en' ? 'Back' : 'Volver'}
                </Link>

                {/* Login Card */}
                <div className="bg-card border border-border rounded-2xl p-8 shadow-xl">
                    <LoginForm dictionary={dict.auth} locale={locale} />
                </div>

                {/* Language Switcher */}
                <div className="mt-8 flex items-center justify-center gap-4 text-sm text-muted-foreground">
                    <Link
                        href="/en/auth/login"
                        className={`hover:text-foreground transition-colors ${locale === 'en' ? 'text-foreground font-medium' : ''}`}
                    >
                        English
                    </Link>
                    <span className="text-border">|</span>
                    <Link
                        href="/es/auth/login"
                        className={`hover:text-foreground transition-colors ${locale === 'es' ? 'text-foreground font-medium' : ''}`}
                    >
                        Español
                    </Link>
                </div>
            </div>
        </div>
    );
}
