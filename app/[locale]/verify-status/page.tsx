import { Suspense } from "react";
import { getDictionary, type Locale, isValidLocale, defaultLocale } from "@/lib/i18n";
import { VerifyStatusClient } from "./verify-status-client";

export default async function VerifyStatusPage({
    params,
}: {
    params: Promise<{ locale: string }>;
}) {
    const { locale: localeParam } = await params;
    const locale: Locale = isValidLocale(localeParam) ? localeParam : defaultLocale;
    const dict = await getDictionary(locale);

    return (
        <Suspense
            fallback={
                <div className="min-h-screen flex items-center justify-center bg-[#F0EBE3]">
                    <div className="w-8 h-8 border-2 border-[#C4623A]/30 border-t-[#C4623A] rounded-full animate-spin" />
                </div>
            }
        >
            <VerifyStatusClient dictionary={dict} />
        </Suspense>
    );
}
