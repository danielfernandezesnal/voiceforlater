import { redirect } from 'next/navigation';
import { isAdmin } from '@/lib/admin';

export default async function AdminLayout({
    children,
    params,
}: {
    children: React.ReactNode;
    params: Promise<{ locale: string }>;
}) {
    const adminStatus = await isAdmin();
    const { locale } = await params;

    if (!adminStatus) {
        // Redirect non-admin users to dashboard
        redirect(`/${locale}/dashboard`);
    }

    return (
        <div className="min-h-screen bg-background">
            <div className="border-b border-border bg-card">
                <div className="container mx-auto px-4 py-4">
                    <div className="flex items-center justify-between">
                        <h1 className="text-2xl font-bold text-foreground">
                            Admin Dashboard
                        </h1>
                        <a
                            href={`/${locale}/dashboard`}
                            className="text-sm text-primary hover:underline"
                        >
                            Back to User Dashboard
                        </a>
                    </div>
                </div>
            </div>
            {children}
        </div>
    );
}
