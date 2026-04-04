import { getDictionary, type Locale, isValidLocale, defaultLocale } from "@/lib/i18n";
import { Metadata } from "next";
import Link from "next/link";

export async function generateMetadata(): Promise<Metadata> {
    return { title: "Terms of Service | Carry my Words" };
}

type LegalSection = { heading: string; body: string };
type LegalDoc = { title: string; version: string; lastUpdated: string; sections: LegalSection[] };
type LegalDict = { legal: { terms: LegalDoc; privacy: LegalDoc } };

export default async function TermsPage({
    params,
}: {
    params: Promise<{ locale: string }>;
}) {
    const { locale: localeParam } = await params;
    const locale: Locale = isValidLocale(localeParam) ? localeParam : defaultLocale;
    const dict = await getDictionary(locale);
    const { title, version, lastUpdated, sections } = (dict as unknown as LegalDict).legal.terms;

    return (
        <section className="min-h-screen bg-background py-24 px-6">
            <div className="mx-auto max-w-3xl">
                <Link
                    href={`/${locale}`}
                    className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-8"
                >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="15 18 9 12 15 6" />
                    </svg>
                    {locale === 'es' ? 'Volver al inicio' : 'Back to home'}
                </Link>
            </div>
            <div className="mx-auto max-w-3xl prose">
                <h1>{title}</h1>
                <p className="text-sm italic text-muted-foreground">
                    {version} · {lastUpdated}
                </p>

                {sections.map((section: LegalSection, index: number) => (
                    <div key={index}>
                        <h2>{section.heading}</h2>
                        <p>{section.body}</p>
                    </div>
                ))}
            </div>
        </section>
    );
}
