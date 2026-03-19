'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';

interface UpgradeSuccessModalProps {
    dictionary: {
        title: string;
        description: string;
        cta: string;
    };
}

export function UpgradeSuccessModal({ dictionary }: UpgradeSuccessModalProps) {
    const searchParams = useSearchParams();
    const router = useRouter();
    const pathname = usePathname();
    const [open, setOpen] = useState(false);

    useEffect(() => {
        if (searchParams.get('upgrade') === 'success') {
            setOpen(true);
        }
    }, [searchParams]);

    function handleClose() {
        setOpen(false);
        // Remove query param without adding to history
        router.replace(pathname, { scroll: false });
    }

    if (!open) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-card w-full max-w-md p-8 rounded-2xl shadow-2xl border border-border animate-in zoom-in-95 duration-200">
                <div className="flex flex-col items-center text-center space-y-4">
                    {/* Icon */}
                    <div className="w-16 h-16 rounded-full flex items-center justify-center mb-2" style={{ background: 'rgba(196,98,58,0.12)' }}>
                        <svg className="w-8 h-8" style={{ color: '#C4623A' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
                        </svg>
                    </div>

                    {/* Title */}
                    <h3 className="font-serif text-2xl font-bold text-foreground">
                        {dictionary.title}
                    </h3>

                    {/* Description */}
                    <p className="text-muted-foreground text-base leading-relaxed">
                        {dictionary.description}
                    </p>

                    {/* CTA */}
                    <button
                        onClick={handleClose}
                        className="mt-4 w-full py-3 px-6 rounded-xl font-semibold text-base text-primary-foreground transition-all hover:opacity-90 active:scale-95"
                        style={{ background: '#C4623A' }}
                    >
                        {dictionary.cta}
                    </button>
                </div>
            </div>
        </div>
    );
}
