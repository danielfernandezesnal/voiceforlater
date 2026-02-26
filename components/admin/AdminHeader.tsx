'use client';

import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

interface Props {
    locale: string;
    dict: any;
}

export default function AdminHeader({ locale, dict }: Props) {
    const router = useRouter();
    const supabase = createClient();

    const handleLogout = async () => {
        await supabase.auth.signOut();
        router.push(`/${locale}`);
        router.refresh();
    };

    return (
        <header className="h-16 border-b border-border bg-card/50 backdrop-blur-sm px-6 flex items-center justify-end sticky top-0 z-30">
            <button
                onClick={handleLogout}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-muted-foreground hover:text-destructive transition-colors rounded-lg hover:bg-destructive/10"
            >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" /></svg>
                <span>{dict.auth.logout}</span>
            </button>
        </header>
    );
}
