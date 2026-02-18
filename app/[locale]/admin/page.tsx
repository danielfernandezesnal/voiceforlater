import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/server/requireAdmin";
import { redirect } from "next/navigation";
import AdminDashboardClient from "./admin-dashboard-client";
import { getDictionary, type Locale } from "@/lib/i18n";

export const runtime = 'nodejs';

interface PageProps {
    params: Promise<{ locale: string }>;
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function AdminDashboard({
    params,
    searchParams,
}: PageProps) {
    const { locale } = await params;
    const sp = await searchParams;
    const dict = await getDictionary(locale as Locale);

    // Parse initial state from URL (if present) to pass to client
    const initialFrom = typeof sp.from === 'string' ? sp.from : undefined;
    const initialTo = typeof sp.to === 'string' ? sp.to : undefined;
    const initialSearch = typeof sp.search === 'string' ? sp.search : undefined;

    try {
        await requireAdmin();
    } catch (error) {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            redirect(`/${locale}/auth/login`);
        }
        redirect(`/${locale}/dashboard`);
    }

    return (
        <div className="min-h-screen bg-background">
            <AdminDashboardClient
                initialFrom={initialFrom}
                initialTo={initialTo}
                initialSearch={initialSearch}
                dict={dict}
            />
        </div>
    );
}
