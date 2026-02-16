import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getDictionary, type Locale, isValidLocale, defaultLocale } from "@/lib/i18n";
import { SideNav } from "@/components/dashboard/side-nav";

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
        .select('auth_password_set, plan')
        .eq('id', user.id)
        .single();

    if (profile && profile.auth_password_set === false) {
        redirect(`/${locale}/auth/set-password`);
    }

    const dict = await getDictionary(locale);

    const labels = {
        dashboard: dict.nav.dashboard || 'Mensajes',
        contacts: 'Contactos',
        profile: 'Perfil',
        plan: 'Plan',
        workspace: 'Mi espacio'
    }

    // Prepare user object for client component
    const userForNav = {
        email: user.email,
        full_name: user.user_metadata?.full_name
    }

    const currentPlan = profile?.plan || 'free';

    return (
        <div className="min-h-screen flex flex-col bg-background/50">
            {/* Topbar */}
            <header className="h-16 border-b border-border/40 fixed top-0 w-full z-50 bg-background/80 backdrop-blur-md transition-all">
                <div className="flex items-center justify-between h-full px-4 sm:px-6">
                    {/* Brand */}
                    <div className="flex items-center gap-2">
                        <Link href={`/${locale}/dashboard`} className="font-bold text-lg tracking-tight hover:opacity-80 transition-opacity">
                            {dict.common.appName}
                        </Link>
                    </div>

                    {/* Mobile Nav Links (Visible only on small screens) */}
                    <nav className="flex items-center gap-4 md:hidden">
                        <Link href={`/${locale}/dashboard`} className="text-sm font-medium text-muted-foreground hover:text-primary">
                            {labels.dashboard}
                        </Link>
                        <Link href={`/${locale}/dashboard/contacts`} className="text-sm font-medium text-muted-foreground hover:text-primary">
                            {labels.contacts}
                        </Link>
                    </nav>

                    {/* Right Actions */}
                    <div className="flex items-center gap-4">
                        {/* Language Switcher */}
                        <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                            <Link
                                href={`/en/dashboard`}
                                className={`hover:text-foreground transition-colors ${locale === 'en' ? 'text-foreground font-bold' : ''}`}
                            >
                                EN
                            </Link>
                            <span className="opacity-30">/</span>
                            <Link
                                href={`/es/dashboard`}
                                className={`hover:text-foreground transition-colors ${locale === 'es' ? 'text-foreground font-bold' : ''}`}
                            >
                                ES
                            </Link>
                        </div>

                        {/* Logout */}
                        <form action={`/${locale}/auth/signout`} method="POST">
                            <button
                                type="submit"
                                className="text-sm font-medium text-muted-foreground hover:text-destructive transition-colors flex items-center gap-2"
                            >
                                <span className="hidden sm:inline">{dict.auth.logout}</span>
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" x2="9" y1="12" y2="12"></line></svg>
                            </button>
                        </form>
                    </div>
                </div>
            </header>

            {/* Layout Body */}
            <div className="flex flex-1 pt-16">
                {/* Sidebar (Desktop) */}
                <SideNav
                    locale={locale}
                    labels={labels}
                    user={userForNav}
                    plan={currentPlan}
                />

                {/* Main Content */}
                <main className="flex-1 md:pl-64 w-full transition-all duration-300">
                    <div className="max-w-5xl mx-auto px-4 sm:px-8 py-8 md:py-10 animate-in fade-in duration-500 slide-in-from-bottom-2">
                        {children}
                    </div>
                </main>
            </div>
        </div>
    );
}
