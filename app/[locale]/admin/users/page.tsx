import { requireOwner } from "@/lib/server/requireAdmin";
import { redirect } from "next/navigation";

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
            <header className="max-w-7xl mx-auto">
                <h1 className="text-4xl font-extrabold tracking-tight">Users</h1>
                <p className="text-muted-foreground mt-2">Coming soon...</p>
            </header>

            <main className="max-w-7xl mx-auto">
                <div className="bg-card border border-border border-dashed rounded-3xl p-20 flex flex-col items-center justify-center text-center">
                    <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center text-2xl mb-4">
                        👥
                    </div>
                    <h2 className="text-xl font-bold text-muted-foreground">User Management</h2>
                    <p className="text-sm text-muted-foreground/60 max-w-xs mt-2">
                        We are working on bringing full user management capabilities to the admin panel.
                    </p>
                </div>
            </main>
        </div>
    );
}
