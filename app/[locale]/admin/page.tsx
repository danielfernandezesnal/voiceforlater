import { redirect } from "next/navigation";
import { requireOwner } from "@/lib/server/requireAdmin";

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
        <div className="min-h-screen bg-background flex items-center justify-center p-4">
            <div className="max-w-md w-full text-center space-y-4">
                <h1 className="text-3xl font-bold tracking-tight text-foreground">
                    Admin Dashboard
                </h1>
                <p className="text-muted-foreground">
                    Coming soon. This area is restricted to system owners.
                </p>
                <div className="pt-4">
                    <a
                        href={`/${locale}/dashboard`}
                        className="text-primary hover:underline text-sm"
                    >
                        Back to User Dashboard
                    </a>
                </div>
            </div>
        </div>
    );
}
