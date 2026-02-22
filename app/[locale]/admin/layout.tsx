import { requireOwner } from "@/lib/server/requireAdmin";
import { redirect } from "next/navigation";
import AdminSidebar from "@/components/admin/AdminSidebar";

interface LayoutProps {
    children: React.ReactNode;
    params: Promise<{ locale: string }>;
}

export default async function AdminLayout({
    children,
    params,
}: LayoutProps) {
    const { locale } = await params;

    // Strict owner-only access for all /admin routes
    try {
        await requireOwner();
    } catch {
        redirect(`/${locale}`);
    }

    return (
        <div className="min-h-screen flex flex-col md:flex-row bg-background">
            <AdminSidebar locale={locale} />
            <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
                <main className="flex-1 overflow-y-auto">
                    {children}
                </main>
            </div>
        </div>
    );
}
