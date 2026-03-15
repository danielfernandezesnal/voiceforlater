"use client";
import { useState, useRef, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";

const LOCALES = [
  { code: "es", label: "Español" },
  { code: "en", label: "English" },
];

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
        className="flex items-center justify-center w-9 h-9 rounded-full hover:bg-muted/50 transition-colors text-muted-foreground hover:text-foreground"
        aria-label="Seleccionar idioma"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.75"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="12" cy="12" r="10" />
          <line x1="2" y1="12" x2="22" y2="12" />
          <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
        </svg>
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-36 bg-background border border-border rounded-xl shadow-lg z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150">
          {LOCALES.map((locale) => (
            <button
              key={locale.code}
              onClick={() => {
                router.push(getPathForLocale(locale.code));
                setOpen(false);
              }}
              className={`w-full text-left px-4 py-2.5 text-sm transition-colors hover:bg-muted/50 flex items-center gap-2 ${
                currentLocale === locale.code
                  ? "text-primary font-semibold"
                  : "text-muted-foreground"
              }`}
            >
              {currentLocale === locale.code && (
                <span className="w-1.5 h-1.5 rounded-full bg-primary inline-block" />
              )}
              {currentLocale !== locale.code && (
                <span className="w-1.5 h-1.5 inline-block" />
              )}
              {locale.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
