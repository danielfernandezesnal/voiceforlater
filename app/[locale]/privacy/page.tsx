import { getDictionary, type Locale, isValidLocale, defaultLocale } from "@/lib/i18n";
import { Metadata } from "next";

export async function generateMetadata(): Promise<Metadata> {
    return { title: "Privacy Policy | Carry My Words" };
}

export default async function PrivacyPage({
    params,
}: {
    params: Promise<{ locale: string }>;
}) {
    const { locale: localeParam } = await params;
    const locale: Locale = isValidLocale(localeParam) ? localeParam : defaultLocale;
    const dict = await getDictionary(locale);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { title, version, lastUpdated, sections } = (dict as any).legal.privacy;

    return (
        <section className="min-h-screen bg-background py-24 px-6">
            <div className="mx-auto max-w-3xl prose">
                <h1>{title}</h1>
                <p className="text-sm italic text-muted-foreground">
                    {version} · {lastUpdated}
                </p>

                {sections.map((section: { heading: string; body: string }, index: number) => (
                    <div key={index}>
                        <h2>{section.heading}</h2>
                        <p>{section.body}</p>
                    </div>
                ))}
            </div>
        </section>
    );
}
