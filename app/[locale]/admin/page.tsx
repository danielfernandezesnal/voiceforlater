import { redirect } from "next/navigation";
import { requireOwner } from "@/lib/server/requireAdmin";
import AdminDashboardClient from "./admin-dashboard-client";
import { getDictionary, type Locale, isValidLocale, defaultLocale } from "@/lib/i18n";

export const runtime = 'nodejs';

interface PageProps {
    params: Promise<{ locale: string }>;
}

export default async function AdminDashboard({
    params,
}: PageProps) {
    const { locale: localeParam } = await params;
    const locale: Locale = isValidLocale(localeParam) ? localeParam : defaultLocale;
    const dict = await getDictionary(locale);

    // Strict owner-only access
    try {
        await requireOwner();
    } catch (error) {
        redirect(`/${locale}`);
    }

    return (
        <AdminDashboardClient locale={locale} dict={dict} />
    );
}
