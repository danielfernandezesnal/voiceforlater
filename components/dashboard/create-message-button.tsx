'use client';

import { useState } from 'react';
import Link from 'next/link';
import { type Dictionary } from '@/lib/i18n';

interface CreateMessageButtonProps {
    isLimitReached: boolean;
    dictionary: Dictionary;
    locale: string;
    className?: string;
}

export function CreateMessageButton({ isLimitReached, dictionary, locale, className }: CreateMessageButtonProps) {
    const [showModal, setShowModal] = useState(false);

    if (!isLimitReached) {
        return (
            <Link
                href={`/${locale}/messages/create?new=true`}
                className={className}
            >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                {dictionary.dashboard.createMessage}
            </Link>
        );
    }

    return (
        <>
            <button
                onClick={() => setShowModal(true)}
                className={className}
            >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                {dictionary.dashboard.createMessage}
            </button>

            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="w-full max-w-sm p-6 rounded-2xl shadow-2xl border border-border animate-in zoom-in-95 duration-200" style={{ background: '#F5F0E8' }}>
                        <div className="flex flex-col items-center text-center space-y-4">
                            <span className="text-3xl">🔒</span>
                            <h3 className="font-serif text-xl font-semibold text-foreground">
                                {dictionary.dashboard.limitReached.title}
                            </h3>
                            <p className="text-sm text-muted-foreground leading-relaxed">
                                {dictionary.dashboard.limitReached.description}
                            </p>
                            <div className="flex flex-col gap-3 w-full pt-2">
                                <Link
                                    href={`/${locale}/dashboard/plan`}
                                    onClick={() => setShowModal(false)}
                                    className="w-full py-2.5 px-4 rounded-xl text-sm font-semibold text-center text-white transition-all hover:opacity-90"
                                    style={{ background: '#C4623A' }}
                                >
                                    {dictionary.dashboard.limitReached.upgrade}
                                </Link>
                                <button
                                    onClick={() => setShowModal(false)}
                                    className="w-full py-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                                >
                                    {dictionary.dashboard.limitReached.cancel}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
