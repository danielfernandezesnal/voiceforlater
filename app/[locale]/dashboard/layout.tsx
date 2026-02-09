import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getDictionary, type Locale, isValidLocale, defaultLocale } from "@/lib/i18n";

// Force dynamic rendering - this layout checks auth on every request
export const dynamic = 'force-dynamic'

async function getUser() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    return user;
}

export default async function DashboardLayout({
    children,
    params,
}: {
    children: React.ReactNode;
    params: Promise<{ locale: string }>;
}) {
    const { locale: localeParam } = await params;
    const locale: Locale = isValidLocale(localeParam) ? localeParam : defaultLocale;
    const user = await getUser();

    if (!user) {
        redirect(`/${locale}/auth/login`);
    }

    const supabase = await createClient();
    const { data: profile } = await supabase
        .from('profiles')
        .select('auth_password_set')
        .eq('id', user.id)
        .single();

    if (profile && profile.auth_password_set === false) {
        redirect(`/${locale}/auth/set-password`);
    }

    const dict = await getDictionary(locale);

    return (
        <div className="min-h-screen flex flex-col">
            {/* Header */}
            <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-16">
                        {/* Logo */}
                        <Link href={`/${locale}/dashboard`} className="flex items-center gap-2">
                            <span className="text-xl font-bold bg-gradient-to-r from-primary to-purple-400 bg-clip-text text-transparent">
                                {dict.common.appName}
                            </span>
                        </Link>

                        {/* Nav */}
                        <nav className="flex items-center gap-6">
                            <Link
                                href={`/${locale}/dashboard`}
                                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                            >
                                {dict.nav.dashboard}
                            </Link>
                            <Link
                                href={`/${locale}/dashboard/contacts`}
                                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                            >
                                Contactos
                            </Link>
                            <div className="flex items-center gap-4">
                                {/* Language Switcher */}
                                <div className="flex items-center gap-2 text-sm">
                                    <Link
                                        href={`/en/dashboard`}
                                        className={`hover:text-foreground transition-colors ${locale === 'en' ? 'text-foreground' : 'text-muted-foreground'}`}
                                    >
                                        EN
                                    </Link>
                                    <span className="text-border">/</span>
                                    <Link
                                        href={`/es/dashboard`}
                                        className={`hover:text-foreground transition-colors ${locale === 'es' ? 'text-foreground' : 'text-muted-foreground'}`}
                                    >
                                        ES
                                    </Link>
                                </div>

                                {/* User Menu */}
                                <form action={`/${locale}/auth/signout`} method="POST">
                                    <button
                                        type="submit"
                                        className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                                    >
                                        {dict.auth.logout}
                                    </button>
                                </form>
                            </div>
                        </nav>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="flex-1">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    {children}
                </div>
            </main>
        </div>
    );
}
