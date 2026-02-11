import { createClient } from "@/lib/supabase/server";
import { isAdminEmail } from "@/lib/admin";
import { redirect } from "next/navigation";
import AdminDashboardClient from "./admin-dashboard-client";

export default async function AdminDashboard({
    params,
}: {
    params: Promise<{ locale: string }>;
}) {
    const { locale } = await params;
    const supabase = await createClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!isAdminEmail(user)) {
        redirect(`/${locale}/dashboard`);
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <AdminDashboardClient />
        </div>
    );
}
