"use client";

import { useState } from "react";

interface FaqItem {
    q: string;
    a: string;
}

export function LandingFaq({ t }: { t: any }) {
    const [openIndex, setOpenIndex] = useState<number | null>(null);
    const [showAll, setShowAll] = useState(false);

    const items: FaqItem[] = t.items || [];
    const visibleItems = showAll ? items : items.slice(0, 5);

    return (
        <section className="py-24 px-6 border-t border-border/50 bg-[hsl(var(--cream))]">
            <div className="max-w-3xl mx-auto">
                <h2 className="text-4xl md:text-5xl font-serif font-light mb-12 text-center text-[hsl(var(--ink))]">
                    {t.title}
                </h2>

                <div className="flex flex-col gap-4">
                    {visibleItems.map((item, i) => {
                        const isOpen = openIndex === i;
                        return (
                            <div
                                key={i}
                                className={[
                                    "border rounded-2xl overflow-hidden transition-colors duration-300",
                                    isOpen ? "bg-white border-border shadow-sm" : "bg-transparent border-border/60 hover:border-border"
                                ].filter(Boolean).join(" ")}
                            >
                                <button
                                    onClick={() => setOpenIndex(isOpen ? null : i)}
                                    className="w-full text-left px-6 py-5 flex justify-between items-center gap-4 text-[hsl(var(--ink))]"
                                >
                                    <span className="font-medium text-lg leading-tight pr-4">{item.q}</span>
                                    <div className={[
                                        "shrink-0 w-8 h-8 rounded-full border flex items-center justify-center transition-all duration-300",
                                        isOpen
                                            ? "bg-[#C4623A] text-white border-[#C4623A] rotate-180"
                                            : "bg-white text-muted-foreground border-border/60"
                                    ].filter(Boolean).join(" ")}>
                                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <polyline points="6 9 12 15 18 9" />
                                        </svg>
                                    </div>
                                </button>
                                <div
                                    className={[
                                        "grid transition-all duration-300 ease-in-out",
                                        isOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
                                    ].filter(Boolean).join(" ")}
                                >
                                    <div className="overflow-hidden">
                                        <div className="px-6 pb-6 pt-2 text-[#4a4a4a] leading-relaxed">
                                            {item.a}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {items.length > 5 && (
                    <div className="mt-12 flex justify-center">
                        <button
                            onClick={() => setShowAll(!showAll)}
                            className="bg-white border border-border/60 shadow-sm px-8 py-3 rounded-full text-[hsl(var(--ink))] font-medium hover:bg-gray-50 transition-colors inline-flex items-center gap-2"
                        >
                            {showAll ? t.showLess : t.showMore}
                            <svg
                                width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                                className={showAll ? "transition-transform duration-300 rotate-180" : "transition-transform duration-300"}
                            >
                                <polyline points="6 9 12 15 18 9" />
                            </svg>
                        </button>
                    </div>
                )}
            </div>
        </section>
    );
}
