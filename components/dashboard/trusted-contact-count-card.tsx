'use client';

import { useState, useEffect } from 'react';

interface Props {
    label: string;
    subtext: string;
}

export function TrustedContactCountCard({ label, subtext }: Props) {
    const [count, setCount] = useState<number | null>(null);

    useEffect(() => {
        const controller = new AbortController();
        fetch('/api/trusted-contacts', {
            headers: { 'Cache-Control': 'no-cache' },
            signal: controller.signal
        })
            .then(res => {
                if (res.ok) return res.json();
                throw new Error('Failed to fetch trusted contacts');
            })
            .then(data => {
                if (Array.isArray(data)) {
                    setCount(data.length);
                }
            })
            .catch(err => {
                if (err.name !== 'AbortError') {
                    console.error('Error fetching trusted contacts:', err);
                    setCount(0);
                }
            });

        return () => controller.abort();
    }, []);

    return (
        <>
            <p className="text-[0.65rem] font-[600] uppercase tracking-widest mb-1 truncate" style={{ color: 'rgba(255,255,255,0.75)' }}>
                {label}
            </p>
            <p className="font-serif text-[1.9rem] font-semibold leading-none" style={{ color: 'white' }}>
                {count === null ? '·' : count}
            </p>
            <p className="text-xs mt-1.5 truncate" style={{ color: 'rgba(255,255,255,0.75)' }}>
                {subtext}
            </p>
        </>
    );
}
