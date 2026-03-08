'use client';

import { useState, useEffect } from 'react';
import { type Dictionary } from '@/lib/i18n';

interface MessageStatusProps {
    status: 'draft' | 'scheduled' | 'delivered';
    deliverAt: string | null;
    deliveryMode: 'date' | 'checkin' | null;
    type: 'text' | 'audio' | 'video';
    locale: string;
    dict: Dictionary;
}

export function MessageStatus({ status, deliverAt, deliveryMode, type, locale, dict }: MessageStatusProps) {
    const [hydrated, setHydrated] = useState(false);

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setHydrated(true);
    }, []);

    if (!hydrated) {
        return null; // or a skeleton loader
    }

    const now = new Date();
    const isPastDelivery = deliverAt ? new Date(deliverAt) < now : false;

    const isSent = status === 'scheduled' && deliverAt && isPastDelivery;

    return (
        <div className="flex flex-wrap items-center gap-2">
            {/* Type Badge */}
            <span className="inline-flex items-center gap-1 px-2 py-1 text-xs rounded-full bg-secondary text-muted-foreground">
                {type === 'text' && dict.dashboard.messageCard.type.text}
                {type === 'audio' && dict.dashboard.messageCard.type.audio}
                {type === 'video' && dict.dashboard.messageCard.type.video}
            </span>

            {/* Status Badge */}
            {isSent ? (
                // SENT STATUS VIRTUAL OVERRIDE
                <span className="inline-flex items-center gap-1 px-3 py-1 text-xs rounded-full bg-[#34D399] text-white font-medium shadow-sm">
                    <svg className="w-3 h-3 text-white fill-current" viewBox="0 0 24 24">
                        <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
                    </svg>
                    {dict.dashboard.messageCard.status.delivered}
                </span>
            ) : (
                <span className={`inline-flex items-center px-2 py-1 text-xs rounded-full ${status === 'scheduled'
                    ? 'bg-primary/10 text-primary'
                    : status === 'delivered'
                        ? 'bg-[#34D399] text-white'
                        : 'bg-secondary text-muted-foreground'
                    }`}>
                    {dict.dashboard.messageCard.status[status]}
                </span>
            )}

            {/* Scheduled Date / Sent Date Display */}
            {status === 'scheduled' && deliverAt && (
                <span className="text-xs text-muted-foreground">
                    {isSent ? (
                        // Sent date text
                        <>
                            {dict.common.sentAt}
                            {new Date(deliverAt).toLocaleDateString(locale === 'es' ? 'es-ES' : 'en-US', { day: 'numeric', month: 'long', year: 'numeric' })}
                            {locale === 'es' ? ' a las ' : ' at '}
                            {new Date(deliverAt).toLocaleTimeString(locale === 'es' ? 'es-ES' : 'en-US', { hour: '2-digit', minute: '2-digit' })}
                        </>
                    ) : (
                        // Scheduled date text
                        <>
                            {locale === 'es' ? 'para el ' : 'for '}
                            {new Date(deliverAt).toLocaleDateString(locale === 'es' ? 'es-ES' : 'en-US', { day: 'numeric', month: 'long', year: 'numeric' })}
                            {locale === 'es' ? ' a las ' : ' at '}
                            {new Date(deliverAt).toLocaleTimeString(locale === 'es' ? 'es-ES' : 'en-US', { hour: '2-digit', minute: '2-digit' })}
                        </>
                    )}
                </span>
            )}
            {status === 'scheduled' && !deliverAt && deliveryMode === 'checkin' && (
                <span className="text-xs text-muted-foreground">
                    {dict.dashboard.messageCard.checkinModeStatus}
                </span>
            )}
        </div>
    );
}
