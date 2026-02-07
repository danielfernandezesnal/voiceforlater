import type { Metadata } from "next";
import { Inter, Barlow } from "next/font/google";
import "../globals.css";
import { locales, type Locale, getDictionary, isValidLocale, defaultLocale } from "@/lib/i18n";

const inter = Inter({
    variable: "--font-inter",
    subsets: ["latin"],
});

const barlow = Barlow({
    variable: "--font-barlow",
    subsets: ["latin"],
    weight: ["300", "400", "500", "600"],
});

export async function generateStaticParams() {
    return locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
    params,
}: {
    params: Promise<{ locale: string }>;
}): Promise<Metadata> {
    const { locale: localeParam } = await params;
    const locale: Locale = isValidLocale(localeParam) ? localeParam : defaultLocale;
    const dict = await getDictionary(locale);

    return {
        title: {
            default: dict.common.appName,
            template: `%s | ${dict.common.appName}`,
        },
        description: locale === 'en'
            ? "Leave messages for your loved ones, delivered at the right moment."
            : "Deja mensajes para tus seres queridos, entregados en el momento indicado.",
    };
}

export default async function LocaleLayout({
    children,
    params,
}: {
    children: React.ReactNode;
    params: Promise<{ locale: string }>;
}) {
    const { locale: localeParam } = await params;
    const locale: Locale = isValidLocale(localeParam) ? localeParam : defaultLocale;

    return (
        <html lang={locale}>
            <body className={`${inter.variable} ${barlow.variable} font-sans antialiased bg-background text-foreground`}>
                {children}
            </body>
        </html>
    );
}
