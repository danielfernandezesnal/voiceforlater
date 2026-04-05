"use client";
import { useState, useRef, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";

import { locales, localeNames, localeFlags, localeCodes, type Locale } from "@/lib/i18n/config";

const LOCALES = locales.map(code => ({
  code,
  label: localeNames[code],
  flag: localeFlags[code],
  iso: localeCodes[code]
}));

export function LocaleSwitcher({ currentLocale }: { currentLocale: string }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const pathname = usePathname();
  const router = useRouter();

  const getPathForLocale = (newLocale: string) => {
    const segments = pathname.split("/");
    if (segments.length >= 2) {
      segments[1] = newLocale;
      return segments.join("/");
    }
    return `/${newLocale}`;
  };

  // Cerrar al hacer click afuera
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 h-9 px-2 rounded-full hover:bg-muted/50 transition-colors text-muted-foreground hover:text-foreground border border-transparent hover:border-border"
        aria-label="Seleccionar idioma"
      >
        <span className="text-sm font-semibold tracking-tight">{localeCodes[currentLocale as Locale]}</span>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={`transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
        >
          <path d="m6 9 6 6 6-6" />
        </svg>
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-48 bg-card border border-border rounded-xl shadow-xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150">
          <div className="px-3 py-2 text-[10px] uppercase tracking-wider font-bold text-muted-foreground bg-muted/30 border-b border-border">
            Idioma / Language
          </div>
          {LOCALES.map((locale) => (
            <button
              key={locale.code}
              onClick={() => {
                router.push(getPathForLocale(locale.code));
                setOpen(false);
              }}
              className={`w-full text-left px-4 py-3 text-sm transition-colors hover:bg-primary/5 flex items-center gap-3 ${
                currentLocale === locale.code
                  ? "text-primary font-bold bg-primary/5"
                  : "text-muted-foreground/80 hover:text-foreground"
              }`}
            >
              <div className="flex items-center gap-2 min-w-[70px]">
                <span className="text-lg grayscale-0 drop-shadow-sm">{locale.flag}</span>
                <span className="font-bold text-[11px] uppercase opacity-70">{locale.iso}</span>
              </div>
              <span className="font-semibold">{locale.iso}</span>
              <span className="flex-1 text-xs opacity-60 text-right">{locale.label}</span>
              {currentLocale === locale.code && (
                <div className="w-1.5 h-1.5 rounded-full bg-primary" />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
