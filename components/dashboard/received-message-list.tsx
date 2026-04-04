'use client';

import { useState } from 'react';
import { ReceivedMessageCard } from '@/components/dashboard/received-message-card';
import type { Dictionary, Locale } from '@/lib/i18n';

type SortKey = 'created_at' | 'deliver_at' | 'recipient';

interface ReceivedMessage {
    id: string;
    type: string;
    status: string;
    title: string | null;
    created_at: string;
    delivered_at: string;
    sender_name: string | null;
    token: string | null;
    [key: string]: unknown;
}

function sortMessages(msgs: ReceivedMessage[], key: SortKey): ReceivedMessage[] {
    return [...msgs].sort((a, b) => {
        if (key === 'created_at') {
            return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        }
        if (key === 'deliver_at') {
            return new Date(b.delivered_at).getTime() - new Date(a.delivered_at).getTime();
        }
        if (key === 'recipient') {
            const ra = (a.sender_name ?? '').toLowerCase();
            const rb = (b.sender_name ?? '').toLowerCase();
            return ra.localeCompare(rb);
        }
        return 0;
    });
}

interface Props {
    messages: ReceivedMessage[];
    locale: Locale;
    dict: Dictionary;
}

export function ReceivedMessageList({ messages, locale, dict }: Props) {
    const [sortKey, setSortKey] = useState<SortKey>('created_at');

    const sortLabels: Record<SortKey, string> = {
        created_at: locale === 'es' ? 'Fecha de creación' : 'Date created',
        deliver_at: locale === 'es' ? 'Fecha de entrega' : 'Delivery date',
        recipient: locale === 'es' ? 'Remitente' : 'Sender',
    };

    const sorted = sortMessages(messages, sortKey);

    return (
        <>
            {messages.length > 1 && (
                <div className="flex justify-end mb-4">
                    <select
                        value={sortKey}
                        onChange={(e) => setSortKey(e.target.value as SortKey)}
                        className="text-xs text-muted-foreground bg-card border border-border/60 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-ring cursor-pointer"
                    >
                        {(Object.keys(sortLabels) as SortKey[]).map(key => (
                            <option key={key} value={key}>{sortLabels[key]}</option>
                        ))}
                    </select>
                </div>
            )}
            <div className="grid gap-4">
                {sorted.map((msg) => (
                    <ReceivedMessageCard
                        key={msg.id}
                        message={msg as any}
                        locale={locale}
                        dict={dict}
                    />
                ))}
            </div>
        </>
    );
}
