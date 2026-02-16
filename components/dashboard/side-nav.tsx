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
            // MessageSquare — stroke 1.5
            icon: (props: any) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>
        },
        {
            href: `/${locale}/dashboard/contacts`,
            label: labels.contacts,
            // Users — stroke 1.5
            icon: (props: any) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M22 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
        },
        {
            href: `/${locale}/dashboard/profile`,
            label: labels.profile,
            // CircleUser — unisex, stroke 1.5
            icon: (props: any) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><circle cx="12" cy="10" r="3"></circle><path d="M7 20.662V19a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v1.662"></path></svg>
        },
        {
            href: `/${locale}/dashboard/plan`,
            label: labels.plan,
            // Sparkles (más cálido que CreditCard) — stroke 1.5
            icon: (props: any) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.582a.5.5 0 0 1 0 .963L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z"></path><path d="M20 3v4"></path><path d="M22 5h-4"></path></svg>
        }
    ]

    return (
        <aside
            className="hidden md:flex flex-col w-64 fixed inset-y-0 z-40 pt-16 transition-all duration-300"
            style={{ backgroundColor: '#FBFAF7', borderRight: '1px solid rgba(94,111,100,0.08)' }}
        >
            <div className="flex-1 px-5 py-8 overflow-y-auto scrollbar-none">
                {/* Título cálido, sin gritar */}
                <p
                    className="text-[11px] font-medium tracking-wide mb-6 px-3"
                    style={{ color: '#5E6F64', opacity: 0.55 }}
                >
                    {labels.workspace || 'Mi espacio'}
                </p>

                {/* Items de navegación */}
                <nav className="space-y-1.5">
                    {navItems.map((item) => {
                        const isActive = pathname === item.href
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={`flex items-center gap-3 px-3 py-2.5 text-[13.5px] font-medium rounded-xl transition-all duration-200 group ${isActive
                                    ? 'text-foreground'
                                    : 'text-muted-foreground hover:text-foreground'
                                    }`}
                                style={isActive ? { backgroundColor: 'rgba(94,111,100,0.07)' } : undefined}
                            >
                                <item.icon
                                    className="h-[18px] w-[18px] transition-colors duration-200 flex-shrink-0"
                                    style={{ color: isActive ? '#5E6F64' : undefined }}
                                />
                                {item.label}
                            </Link>
                        )
                    })}
                </nav>
            </div>

            {/* Pie del sidebar — perfil del usuario */}
            <div
                className="px-5 py-5"
                style={{ borderTop: '1px solid rgba(94,111,100,0.06)' }}
            >
                <div className="flex items-center gap-3 px-1">
                    {/* Avatar unisex — círculo cálido */}
                    <div
                        className="h-9 w-9 rounded-full flex items-center justify-center flex-shrink-0"
                        style={{ backgroundColor: 'rgba(94,111,100,0.08)' }}
                    >
                        <svg className="h-[18px] w-[18px]" style={{ color: '#5E6F64' }} xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="12" cy="12" r="10"></circle>
                            <circle cx="12" cy="10" r="3"></circle>
                            <path d="M7 20.662V19a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v1.662"></path>
                        </svg>
                    </div>
                    <div className="flex flex-col overflow-hidden">
                        <span className="text-sm font-medium truncate text-foreground/85">
                            {user.full_name || (user.email ? user.email.split('@')[0] : 'Usuario')}
                        </span>
                        <span className="text-[11px] capitalize flex items-center gap-1.5" style={{ color: '#5E6F64', opacity: 0.6 }}>
                            {plan === 'pro' && (
                                <span
                                    className="inline-block w-1.5 h-1.5 rounded-full"
                                    style={{ backgroundColor: '#5E6F64' }}
                                ></span>
                            )}
                            Plan {plan}
                        </span>
                    </div>
                </div>
            </div>
        </aside>
    )
}
