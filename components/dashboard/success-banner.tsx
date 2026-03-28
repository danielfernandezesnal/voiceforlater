'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';

interface SuccessBannerProps {
    dictionary: {
        title: string;
        body: string;
        emotional: string;
        dismiss: string;
    };
}

export function SuccessBanner({ dictionary }: SuccessBannerProps) {
    const searchParams = useSearchParams();
    const router = useRouter();
    const pathname = usePathname();
    const [visible, setVisible] = useState(false);
    const [isFadingOut, setIsFadingOut] = useState(false);

    useEffect(() => {
        if (searchParams.get('created') === 'true') {
            setVisible(true);
        }
    }, [searchParams]);

    function handleDismiss() {
        if (isFadingOut) return;

        setIsFadingOut(true);

        setTimeout(() => {
            setVisible(false);

            const params = new URLSearchParams(searchParams.toString());
            params.delete('created');
            const qs = params.toString();

            const newUrl = qs ? `${pathname}?${qs}` : pathname;
            window.history.replaceState(null, '', newUrl);
            router.replace(newUrl, { scroll: false });
        }, 300);
    }

    useEffect(() => {
        if (!visible) return;

        const timeout = setTimeout(() => {
            handleDismiss();
        }, 6000);

        return () => clearTimeout(timeout);
    }, [visible]);

    if (!visible) return null;

    return (
        <div
            className={`rounded-2xl border p-5 mb-7 transition-opacity duration-300 ${isFadingOut ? 'opacity-0' : 'opacity-100'}`}
            style={{ background: 'rgba(196,98,58,0.06)', borderColor: 'rgba(196,98,58,0.25)' }}
        >
            <div className="flex items-start justify-between gap-4">
                <div>
                    <p className="font-serif font-semibold text-lg text-foreground mb-1">
                        {dictionary.title}
                    </p>
                    <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">
                        {dictionary.body}
                    </p>
                    <p className="text-sm mt-3 font-medium" style={{ color: '#C4623A' }}>
                        {dictionary.emotional}
                    </p>
                </div>
                <button
                    onClick={handleDismiss}
                    className="text-muted-foreground hover:text-foreground transition-colors flex-shrink-0 mt-0.5"
                    aria-label={dictionary.dismiss}
                >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
            </div>
        </div>
    );
}
