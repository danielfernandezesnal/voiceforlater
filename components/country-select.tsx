'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { COUNTRIES_ES, COUNTRIES_EN, type Country } from '@/lib/countries'

interface CountrySelectProps {
    value: string // country code
    onChange: (code: string, country: Country) => void
    locale?: string
    placeholder?: string
    id?: string
    className?: string
}

export function CountrySelect({
    value,
    onChange,
    locale = 'es',
    placeholder,
    id,
    className,
}: CountrySelectProps) {
    const list = locale === 'es' ? COUNTRIES_ES : COUNTRIES_EN
    const getName = (c: Country) => locale === 'es' ? c.nameES : c.nameEN

    const selected = list.find(c => c.code === value) ?? null

    const [open, setOpen] = useState(false)
    const [search, setSearch] = useState('')
    const containerRef = useRef<HTMLDivElement>(null)
    const searchRef = useRef<HTMLInputElement>(null)
    const listRef = useRef<HTMLUListElement>(null)

    const filtered = search.trim()
        ? list.filter(c =>
            getName(c).toLowerCase().includes(search.toLowerCase()) ||
            c.code.toLowerCase().includes(search.toLowerCase())
        )
        : list

    const defaultPlaceholder = locale === 'es' ? 'Selecciona tu país' : 'Select your country'

    const close = useCallback(() => {
        setOpen(false)
        setSearch('')
    }, [])

    // Close on outside click
    useEffect(() => {
        function handleClick(e: MouseEvent) {
            if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
                close()
            }
        }
        if (open) {
            document.addEventListener('mousedown', handleClick)
        }
        return () => document.removeEventListener('mousedown', handleClick)
    }, [open, close])

    // Focus search when opened
    useEffect(() => {
        if (open) {
            setTimeout(() => searchRef.current?.focus(), 10)
        }
    }, [open])

    function handleSelect(country: Country) {
        onChange(country.code, country)
        close()
    }

    function handleKeyDown(e: React.KeyboardEvent) {
        if (e.key === 'Escape') close()
        if (e.key === 'Enter' && filtered.length === 1) {
            handleSelect(filtered[0])
        }
    }

    return (
        <div ref={containerRef} className={`relative ${className ?? ''}`}>
            {/* Trigger button */}
            <button
                type="button"
                id={id}
                onClick={() => setOpen(o => !o)}
                onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setOpen(o => !o) } }}
                className="w-full px-3 py-2 bg-input border border-border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary/40 transition-all text-left flex items-center justify-between gap-2 text-sm"
                aria-haspopup="listbox"
                aria-expanded={open}
            >
                <span className={`flex items-center gap-2 truncate ${!selected ? 'text-muted-foreground' : ''}`}>
                    {selected ? (
                        <>
                            <span className="text-base leading-none">{selected.flag}</span>
                            <span>{getName(selected)}</span>
                        </>
                    ) : (
                        placeholder ?? defaultPlaceholder
                    )}
                </span>
                <svg
                    className={`w-4 h-4 text-muted-foreground flex-shrink-0 transition-transform ${open ? 'rotate-180' : ''}`}
                    fill="none" viewBox="0 0 24 24" stroke="currentColor"
                >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
            </button>

            {/* Dropdown */}
            {open && (
                <div
                    className="absolute z-50 mt-1 w-full bg-card border border-border rounded-xl shadow-lg overflow-hidden"
                    style={{ maxHeight: '320px', display: 'flex', flexDirection: 'column' }}
                >
                    {/* Search input */}
                    <div className="p-2 border-b border-border/50">
                        <div className="relative">
                            <svg className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                            <input
                                ref={searchRef}
                                type="text"
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                                onKeyDown={handleKeyDown}
                                placeholder={locale === 'es' ? 'Buscar...' : 'Search...'}
                                className="w-full pl-7 pr-3 py-1.5 text-sm bg-input border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40"
                            />
                        </div>
                    </div>

                    {/* List */}
                    <ul
                        ref={listRef}
                        role="listbox"
                        className="overflow-y-auto flex-1"
                        style={{ maxHeight: '260px' }}
                    >
                        {filtered.length === 0 ? (
                            <li className="px-3 py-3 text-sm text-muted-foreground text-center">
                                {locale === 'es' ? 'Sin resultados' : 'No results'}
                            </li>
                        ) : (
                            filtered.map(country => (
                                <li
                                    key={country.code}
                                    role="option"
                                    aria-selected={country.code === value}
                                    onClick={() => handleSelect(country)}
                                    className={`flex items-center gap-2.5 px-3 py-2 text-sm cursor-pointer transition-colors ${
                                        country.code === value
                                            ? 'bg-primary/8 text-primary font-medium'
                                            : 'hover:bg-secondary/50'
                                    }`}
                                >
                                    <span className="text-base leading-none w-5 text-center">{country.flag}</span>
                                    <span className="truncate">{getName(country)}</span>
                                    {country.code === value && (
                                        <svg className="ml-auto w-3.5 h-3.5 text-primary flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                                        </svg>
                                    )}
                                </li>
                            ))
                        )}
                    </ul>
                </div>
            )}
        </div>
    )
}
