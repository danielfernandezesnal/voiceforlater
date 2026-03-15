import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getDictionary, type Locale, isValidLocale, defaultLocale } from "@/lib/i18n";
import { SideNav } from "@/components/dashboard/side-nav";
import { LocaleSyncer } from "@/components/profile/sync-locale";
import { LocaleSwitcher } from "@/components/profile/locale-switcher";
import { MobileNav } from "@/components/dashboard/mobile-nav";

import { getEffectivePlan } from "@/lib/plan-resolver";

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
    
    // Fetch profile and effective plan in parallel for better performance
    const [profileResult, currentPlan] = await Promise.all([
        supabase
            .from('profiles')
            .select('auth_password_set, locale')
            .eq('id', user.id)
            .single(),
        getEffectivePlan(supabase, user.id)
    ]);

    const profile = profileResult.data;

    if (profile && profile.auth_password_set === false) {
        redirect(`/${locale}/auth/set-password`);
    }

    // --- Locale Syncing ---
    // We trust the URL locale for the current render (SSR), 
    // and let LocaleSyncer ensure the cookie/profile match on the client.
    const profileLocale: Locale = (profile?.locale && isValidLocale(profile.locale)) ? profile.locale : defaultLocale;

    const dict = await getDictionary(locale);

    const labels = {
        dashboard: dict.nav.dashboard || 'Enviados',
        received: dict.nav.received || 'Recibidos',
        contacts: dict.nav.contacts || 'Contactos',
        profile: locale === 'es' ? 'Perfil' : 'Profile',
        plan: locale === 'es' ? 'Plan' : 'Plan',
        workspace: locale === 'es' ? 'Mi espacio' : 'My workspace',
        tagline: (dict.dashboard as any).sidebarTagline || ''
    }

    // Prepare user object for client component
    const userForNav = {
        email: user.email,
        full_name: user.user_metadata?.full_name
    }


    return (
        <div className="min-h-screen flex flex-col bg-background">
            {/* Sync Cookie and Profile Client Side */}
            <LocaleSyncer locale={locale} />

            {/* Topbar */}
            <header className="h-16 border-b border-border/40 fixed top-0 w-full z-50 bg-background/80 backdrop-blur-md transition-all">
                <div className="flex items-center justify-between h-full px-4 sm:px-6">
                    <div className="flex items-center">
                        {/* Logo Desktop */}
                        <div className="hidden md:flex flex-col items-start justify-center">
                            <Link href={`/${locale}/dashboard`} className="font-serif italic text-xl leading-none hover:opacity-80 transition-opacity" style={{ color: '#C4623A' }}>
                                Carry My Words
                            </Link>
                            <p className="text-[0.55rem] font-medium uppercase tracking-widest mt-0.5" style={{ color: '#C4623A' }}>
                                {labels.tagline}
                            </p>
                        </div>

                        {/* Logo Mobile */}
                        <div className="flex md:hidden items-center">
                            <Link href={`/${locale}/dashboard`} className="font-serif italic text-lg leading-none hover:opacity-80 transition-opacity" style={{ color: '#C4623A' }}>
                                Carry My Words
                            </Link>
                        </div>
                    </div>

                    {/* Right Actions & Mobile Hamburger */}
                    <div className="flex items-center gap-2 sm:gap-4">
                        <MobileNav locale={locale} labels={labels} />
                        {/* Language Switcher */}
                        <div className="hidden md:block">
                            <LocaleSwitcher currentLocale={locale} />
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
