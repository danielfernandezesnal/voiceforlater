import { redirect } from "next/navigation";
import { requireOwner } from "@/lib/server/requireAdmin";
import AdminDashboardClient from "./admin-dashboard-client";

export const runtime = 'nodejs';

interface PageProps {
    params: Promise<{ locale: string }>;
}

export default async function AdminDashboard({
    params,
}: PageProps) {
    const { locale } = await params;

    // Strict owner-only access
    try {
        await requireOwner();
    } catch (error) {
        redirect(`/${locale}`);
    }

    return (
        <AdminDashboardClient locale={locale} />
    );
}
