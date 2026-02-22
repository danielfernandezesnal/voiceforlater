'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface Props {
    locale: string;
}

export default function AdminSidebar({ locale }: Props) {
    const pathname = usePathname();

    const navItems = [
        {
            href: `/${locale}/admin`,
            label: 'Dashboard',
            icon: (
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="7" height="9" x="3" y="3" rx="1" /><rect width="7" height="5" x="14" y="3" rx="1" /><rect width="7" height="9" x="14" y="12" rx="1" /><rect width="7" height="5" x="3" y="15" rx="1" /></svg>
            ),
            exact: true
        },
        {
            href: `/${locale}/admin/users`,
            label: 'Users',
            icon: (
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>
            ),
            exact: false
        }
    ];

    return (
        <aside className="w-full md:w-64 bg-card border-b md:border-b-0 md:border-r border-border flex flex-col min-h-[auto] md:min-h-screen">
            <div className="p-6">
                <div className="flex items-center gap-2 px-2">
                    <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center text-primary-foreground font-bold">
                        V
                    </div>
                    <div>
                        <h2 className="text-lg font-bold tracking-tight leading-none text-foreground">Admin</h2>
                        <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold mt-1">Management</p>
                    </div>
                </div>
            </div>

            <nav className="flex-1 px-4 pb-6 flex flex-col gap-1">
                {navItems.map((item) => {
                    const isActive = item.exact
                        ? pathname === item.href
                        : pathname.startsWith(item.href);

                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={`flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-xl transition-all duration-200 ${isActive
                                ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20"
                                : "text-muted-foreground hover:bg-muted hover:text-foreground"
                                }`}
                        >
                            <span className={isActive ? "text-primary-foreground" : "text-muted-foreground"}>
                                {item.icon}
                            </span>
                            <span>{item.label}</span>
                        </Link>
                    );
                })}
            </nav>

            <div className="p-4 mt-auto border-t border-border">
                <Link
                    href={`/${locale}/dashboard`}
                    className="flex items-center gap-3 px-4 py-3 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted rounded-xl transition-all"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m12 19-7-7 7-7" /><path d="M19 12H5" /></svg>
                    <span>Back to App</span>
                </Link>
            </div>
        </aside>
    );
}
