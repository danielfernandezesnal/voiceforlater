'use client';

import { useState } from 'react';
import Link from 'next/link';
import { UpgradeButton } from '@/components/stripe/upgrade-button';
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
                    <div className="bg-card w-full max-w-md p-6 rounded-xl shadow-2xl border border-border animate-in zoom-in-95 duration-200">
                        <div className="flex flex-col items-center text-center space-y-4">
                            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-2">
                                <svg className="w-6 h-6 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                </svg>
                            </div>

                            <h3 className="text-xl font-bold">{dictionary.dashboard.limitReached.title}</h3>
                            <p className="text-muted-foreground">
                                {dictionary.dashboard.limitReached.description}
                            </p>

                            <div className="w-full text-left space-y-3 py-2">
                                <p className="font-semibold text-base">
                                    {(dictionary.dashboard.limitReached as any).subtitle || 'Podrás:'}
                                </p>
                                <ul className="space-y-2">
                                    {dictionary.dashboard.limitReached.features && dictionary.dashboard.limitReached.features.map((feature: string, index: number) => (
                                        <li key={index} className="flex items-start gap-2 text-sm text-muted-foreground">
                                            <span className="text-primary font-bold mt-0.5">✓</span>
                                            <span>{feature}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>

                            <div className="flex flex-col gap-3 w-full pt-4">
                                <UpgradeButton
                                    dictionary={{
                                        ...dictionary.stripe,
                                        upgrade: dictionary.stripe.upgradeModal || dictionary.stripe.upgrade
                                    }}
                                    isPro={false}
                                    className="w-full justify-center"
                                />
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
