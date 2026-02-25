import { getDictionary, type Locale, isValidLocale, defaultLocale } from "@/lib/i18n";
import { Metadata } from "next";

export async function generateMetadata(): Promise<Metadata> {
    return { title: "Terms of Service | Carry My Words" };
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
