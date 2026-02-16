'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

interface SideNavProps {
    locale: string
    labels: {
        dashboard: string
        contacts: string
        profile: string
        plan: string
        workspace: string // "Mi espacio"
    }
    user: {
        email?: string
        full_name?: string
    }
    plan: string
}

export function SideNav({ locale, labels, user, plan }: SideNavProps) {
    const pathname = usePathname()

    const navItems = [
        {
            href: `/${locale}/dashboard`,
            label: labels.dashboard,
            icon: (props: any) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>
        },
        {
            href: `/${locale}/dashboard/contacts`,
            label: labels.contacts,
            icon: (props: any) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M22 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
        },
        {
            href: `/${locale}/dashboard/profile`,
            label: labels.profile,
            icon: (props: any) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
        },
        {
            href: `/${locale}/dashboard/plan`,
            label: labels.plan,
            icon: (props: any) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="14" x="2" y="5" rx="2"></rect><line x1="2" x2="22" y1="10" y2="10"></line></svg>
        }
    ]

    return (
        <aside className="hidden md:flex flex-col w-64 fixed inset-y-0 z-40 bg-card/30 border-r border-border/40 pt-16 transition-all duration-300">
            <div className="flex-1 px-4 py-6 space-y-1 overflow-y-auto scrollbar-none">
                <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4 px-3 opacity-70">
                    {labels.workspace || 'Mi espacio'}
                </div>
                {navItems.map((item) => {
                    const isActive = pathname === item.href
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={`flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200 group ${isActive
                                    ? 'bg-primary/10 text-primary'
                                    : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground'
                                }`}
                        >
                            <item.icon className={`h-4 w-4 transition-colors ${isActive ? 'text-primary' : 'text-muted-foreground group-hover:text-foreground'}`} />
                            {item.label}
                        </Link>
                    )
                })}
            </div>

            <div className="p-4 border-t border-border/30 bg-card/10 backdrop-blur-[1px]">
                <div className="flex items-center gap-3 px-2">
                    <div className="h-9 w-9 rounded-full bg-muted/50 flex items-center justify-center ring-1 ring-border/50">
                        <svg className="h-5 w-5 text-muted-foreground" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
                    </div>
                    <div className="flex flex-col overflow-hidden">
                        <span className="text-sm font-medium truncate text-foreground/90">
                            {user.full_name || (user.email ? user.email.split('@')[0] : 'Usuario')}
                        </span>
                        <span className="text-xs text-muted-foreground capitalize flex items-center gap-1">
                            {plan === 'pro' && <span className="inline-block w-1.5 h-1.5 rounded-full bg-primary mb-0.5"></span>}
                            Plan {plan}
                        </span>
                    </div>
                </div>
            </div>
        </aside>
    )
}
