'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

interface MobileNavProps {
  locale: string
  labels: {
    dashboard: string
    received: string
    contacts: string
    profile: string
    plan: string
  }
}

export function MobileNav({ locale, labels }: MobileNavProps) {
  const [isOpen, setIsOpen] = useState(false)
  const pathname = usePathname()

  // Close menu when route changes
  useEffect(() => {
    setIsOpen(false)
  }, [pathname])

  const links = [
    { href: `/${locale}/dashboard`, label: labels.dashboard },
    { href: `/${locale}/dashboard/received`, label: labels.received },
    { href: `/${locale}/dashboard/contacts`, label: labels.contacts },
    { href: `/${locale}/dashboard/profile`, label: labels.profile },
    { href: `/${locale}/dashboard/plan`, label: labels.plan },
  ]

  return (
    <div className="md:hidden">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 text-muted-foreground hover:text-foreground transition-colors"
        aria-label="Toggle menu"
      >
        {isOpen ? (
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
        ) : (
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>
        )}
      </button>

      {/* Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 top-16 bg-black/20 z-40 backdrop-blur-[2px]"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Dropdown Panel */}
      {isOpen && (
        <nav className="fixed top-16 left-0 w-full bg-background/95 backdrop-blur-md border-b border-border z-50 animate-in slide-in-from-top-2 duration-200">
          <div className="flex flex-col py-2">
            {links.map((link) => {
              const isActive = pathname === link.href
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`py-3.5 px-6 text-sm font-medium transition-colors hover:bg-muted/50 ${
                    isActive ? 'text-primary' : 'text-muted-foreground'
                  }`}
                  onClick={() => setIsOpen(false)}
                >
                  {link.label}
                </Link>
              )
            })}
          </div>
        </nav>
      )}
    </div>
  )
}
