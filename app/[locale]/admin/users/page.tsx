import { requireOwner } from "@/lib/server/requireAdmin";
import { redirect } from "next/navigation";
import UserTable from "@/components/admin/UserTable";

interface PageProps {
    params: Promise<{ locale: string }>;
}

export default async function AdminUsersPage({
    params,
}: PageProps) {
    const { locale } = await params;

    // Strict owner-only access
    try {
        await requireOwner();
    } catch {
        redirect(`/${locale}`);
    }

    return (
        <div className="p-6 sm:p-10 space-y-10">
            <header className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-4xl font-extrabold tracking-tight">User Management</h1>
                    <p className="text-muted-foreground mt-2">View and monitor account status across the platform.</p>
                </div>
                <div className="flex bg-card border border-border p-1 rounded-xl">
                    <div className="px-4 py-2 text-xs font-bold uppercase tracking-widest text-primary bg-primary/10 rounded-lg">
                        List View
                    </div>
                </div>
            </header>

            <main className="max-w-7xl mx-auto">
                <UserTable />
            </main>
        </div>
    );
}
