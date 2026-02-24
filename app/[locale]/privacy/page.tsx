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

    return (
        <div className="min-h-screen bg-background text-foreground py-24 px-6">
            <div className="max-w-3xl mx-auto prose prose-neutral dark:prose-invert">
                <h1 className="text-4xl font-serif font-light tracking-tight mb-8">
                    Privacy Policy
                </h1>
                <p>Last updated: February 2026</p>

                <h2>1. Information We Collect</h2>
                <p>We collect essential data to operate our service: your email address, billing information (via Stripe), profile metadata, and the contents of any messages you store with us.</p>

                <h2>2. How We Use It</h2>
                <p>Your stored messages are encrypted at rest and solely used to deliver them at your requested date or after your check-ins stop.</p>

                <h2>3. Sharing of Information</h2>
                <p>We never sell your personal data. We only share information with critical service providers (e.g. database hosting, payment gateways) necessary to run the service.</p>

                <h2>4. Data Deletion</h2>
                <p>You can request full deletion of your account and all associated messages at any time from your settings or by contacting us.</p>

                <h2>5. Cookies</h2>
                <p>We use essential cookies to keep you logged in and ensure security.</p>
            </div>
        </div>
    );
}
