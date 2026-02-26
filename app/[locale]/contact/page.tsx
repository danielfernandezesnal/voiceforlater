import Link from "next/link";
import { getDictionary, type Locale, isValidLocale, defaultLocale } from "@/lib/i18n";
import { LandingContactForm } from "@/components/landing-contact-form";
import { Metadata } from "next";

export async function generateMetadata({
    params,
}: {
    params: Promise<{ locale: string }>;
}): Promise<Metadata> {
    const { locale: localeParam } = await params;
    const locale: Locale = isValidLocale(localeParam) ? localeParam : defaultLocale;
    const dict = await getDictionary(locale);

    return {
        title: `${dict.contact.title} | Carry My Words`,
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
            {/* Navbar */}
            <nav className="p-6 flex justify-between items-center max-w-6xl mx-auto w-full">
                <div className="font-serif font-bold text-2xl tracking-tight text-primary">
                    <Link href={`/${locale}`}>Carry My Words</Link>
                </div>
                <div className="flex gap-6 items-center">
                    <div className="flex items-center gap-2 text-sm font-medium">
                        <Link href="/en/contact" className={locale === 'en' ? 'text-primary' : 'text-muted-foreground hover:text-foreground transition-colors'}>EN</Link>
                        <span className="text-border">/</span>
                        <Link href="/es/contact" className={locale === 'es' ? 'text-primary' : 'text-muted-foreground hover:text-foreground transition-colors'}>ES</Link>
                    </div>
                    <Link
                        href={`/${locale}/auth/login`}
                        className="text-sm font-medium px-4 py-2 border border-border/50 rounded-sm hover:bg-white/10 transition-colors"
                    >
                        {dict.auth.login}
                    </Link>
                </div>
            </nav>

            <main className="flex-grow py-24 px-6 flex flex-col items-center justify-center">
                <div className="max-w-xl mx-auto w-full">
                    <h1 className="text-4xl md:text-5xl font-serif font-light text-center mb-12">
                        {dict.contact.title}
                    </h1>
                    <LandingContactForm />
                </div>
            </main>

            {/* Footer */}
            <footer className="py-12 px-6 border-t border-border mt-auto bg-card text-muted-foreground text-sm">
                <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
                    <div className="font-serif font-bold text-foreground text-lg">
                        <Link href={`/${locale}`}>Carry My Words</Link>
                    </div>
                    <div className="flex gap-6">
                        <Link href={`/${locale}/privacy`} className="hover:text-foreground transition-colors">{dict.landing.footer.privacy}</Link>
                        <Link href={`/${locale}/terms`} className="hover:text-foreground transition-colors">{dict.landing.footer.terms}</Link>
                        <Link href={`/${locale}/contact`} className="text-foreground font-medium">{dict.landing.footer.contact}</Link>
                    </div>
                    <div className="flex items-center gap-2">
                        <Link href="/en" className={locale === 'en' ? 'text-primary font-bold' : 'hover:text-foreground'}>EN</Link>
                        <span>/</span>
                        <Link href="/es" className={locale === 'es' ? 'text-primary font-bold' : 'hover:text-foreground'}>ES</Link>
                    </div>
                </div>
            </footer>
        </div>
    );
}
