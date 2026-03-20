import Link from "next/link";
import { getDictionary, type Locale, isValidLocale, defaultLocale } from "@/lib/i18n";
import { LandingContactForm } from "@/components/landing-contact-form";
import { Metadata } from "next";
import { LocaleSwitcher } from "@/components/profile/locale-switcher";

export async function generateMetadata({
    params,
}: {
    params: Promise<{ locale: string }>;
}): Promise<Metadata> {
    const { locale: localeParam } = await params;
    const locale: Locale = isValidLocale(localeParam) ? localeParam : defaultLocale;
    const dict = await getDictionary(locale);

    return {
        title: `${dict.contact.title} | Carry my Words`,
    };
}

export default async function ContactPage({
    params,
}: {
    params: Promise<{ locale: string }>;
}) {
    const { locale: localeParam } = await params;
    const locale: Locale = isValidLocale(localeParam) ? localeParam : defaultLocale;
    const dict = await getDictionary(locale);

    return (
        <div className="min-h-screen flex flex-col bg-background text-foreground">
            {/* Mobile header: centered logo + tagline only */}
            <div className="md:hidden pt-10 pb-2 flex flex-col items-center text-center px-6">
                <Link href={`/${locale}`} className="font-serif font-normal italic text-3xl tracking-tight leading-tight" style={{ color: '#C4623A' }}>
                    Carry my Words
                </Link>
                <p style={{ color: '#C4623A', fontSize: '0.65rem', letterSpacing: '0.14em', fontWeight: 500, marginTop: '6px' }}>
                    {locale === 'es' ? 'MENSAJES QUE VIAJAN EN EL TIEMPO' : 'MESSAGES THAT TRAVEL THROUGH TIME'}
                </p>
            </div>

            {/* Desktop navbar */}
            <nav className="hidden md:flex p-6 justify-between items-center max-w-6xl mx-auto w-full">
                <div className="font-serif font-bold text-2xl tracking-tight text-primary">
                    <Link href={`/${locale}`}>Carry my Words</Link>
                </div>
                <div className="flex gap-6 items-center">
                    <LocaleSwitcher currentLocale={locale} />
                    <Link
                        href={`/${locale}/auth/login`}
                        className="text-sm font-medium px-4 py-2 border border-border/50 rounded-sm hover:bg-white/10 transition-colors"
                    >
                        {dict.auth.login}
                    </Link>
                </div>
            </nav>

            <main className="flex-grow py-12 md:py-24 px-6 flex flex-col items-center justify-center">
                <div className="max-w-xl mx-auto w-full">
                    <h1 className="text-4xl md:text-5xl font-serif font-light text-center mb-12">
                        {dict.contact.title}
                    </h1>
                    <LandingContactForm dict={dict} />
                </div>
            </main>

            {/* Footer */}
            <footer className="py-12 px-6 border-t border-border mt-auto bg-card text-muted-foreground text-sm">
                <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
                    <div className="hidden md:block font-serif font-bold text-foreground text-lg">
                        <Link href={`/${locale}`}>Carry my Words</Link>
                    </div>
                    <div className="flex gap-6">
                        <Link href={`/${locale}/privacy`} className="hover:text-foreground transition-colors">{dict.landing.footer.privacy}</Link>
                        <Link href={`/${locale}/terms`} className="hover:text-foreground transition-colors">{dict.landing.footer.terms}</Link>
                        <Link href={`/${locale}/contact`} className="text-foreground font-medium">{dict.landing.footer.contact}</Link>
                    </div>
                    <LocaleSwitcher currentLocale={locale} />
                </div>
            </footer>
        </div>
    );
}
