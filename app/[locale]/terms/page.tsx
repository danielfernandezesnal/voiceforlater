import { getDictionary, type Locale, isValidLocale, defaultLocale } from "@/lib/i18n";
import { Metadata } from "next";

export async function generateMetadata(): Promise<Metadata> {
    return { title: "Terms of Service | Carry My Words" };
}

export default async function TermsPage({
    params,
}: {
    params: Promise<{ locale: string }>;
}) {
    const { locale: localeParam } = await params;
    const locale: Locale = isValidLocale(localeParam) ? localeParam : defaultLocale;
    const dict = await getDictionary(locale);

    return (
        <div className="min-h-screen bg-background text-foreground py-24 px-6">
            <div className="max-w-3xl mx-auto prose prose-neutral dark:prose-invert">
                <h1 className="text-4xl font-serif font-light tracking-tight mb-8">
                    Terms of Service
                </h1>
                <p>Last updated: February 2026</p>

                <h2>1. Introduction</h2>
                <p>Welcome to Carry My Words. By accessing our service, you agree to be bound by these terms.</p>

                <h2>2. User Content</h2>
                <p>You retain full ownership of all messages and content you upload. We only store your content for the purpose of delivering it according to your delivery rules.</p>

                <h2>3. Message Delivery</h2>
                <p>We make best efforts to deliver your time-delayed messages, but do not guarantee delivery if external factors (e.g. email bounces, user deletions) intervene.</p>

                <h2>4. Prohibited Use</h2>
                <p>You may not use Carry My Words to send illicit, harmful, or spam content.</p>

                <h2>5. Account Termination</h2>
                <p>We reserve the right to suspend or terminate accounts that violate these Terms.</p>
            </div>
        </div>
    );
}
