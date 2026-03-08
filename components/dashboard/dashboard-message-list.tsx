'use client';

import { useState, useEffect } from 'react';
import { CreateMessageButton } from "@/components/dashboard/create-message-button";
import { MessageCard } from "@/components/dashboard/message-card";
import type { Dictionary } from "@/lib/i18n";
import type { Plan } from "@/lib/plans";

export interface MessageWithRecipient {
    id: string;
    type: 'text' | 'audio' | 'video';
    status: 'draft' | 'scheduled' | 'delivered';
    text_content: string | null;
    created_at: string;
    recipients: { name: string; email: string }[];
    delivery_rules: { mode: 'date' | 'checkin'; deliver_at: string | null } | { mode: 'date' | 'checkin'; deliver_at: string | null }[] | null;
    message_trusted_contacts: {
        trusted_contacts: {
            id: string;
            name: string;
            email: string;
        } | null
    }[];
}

interface Props {
    initialMessages: MessageWithRecipient[];
    userPlan: Plan;
    locale: string;
    dict: Dictionary;
}

export function DashboardMessageList({ initialMessages, userPlan, locale, dict }: Props) {
    const [messages, setMessages] = useState<MessageWithRecipient[]>(initialMessages);

    // Sync state with props when router.refresh() is called
    useEffect(() => {
        setMessages(initialMessages);
    }, [initialMessages]);

    useEffect(() => {
        const controller = new AbortController();

        // Fetch fresh data on mount to guarantee GET /api/messages request
        fetch('/api/messages', {
            headers: { 'Cache-Control': 'no-cache' },
            signal: controller.signal
        })
            .then(res => {
                if (res.ok) return res.json();
                throw new Error('Failed to fetch');
            })
            .then(data => {
                if (Array.isArray(data)) {
                    // Update state only if mounted (handled by abort)
                    setMessages(data);
                }
            })
            .catch(err => {
                if (err.name !== 'AbortError') {
                    console.error('Error fetching messages:', err);
                }
            });

        return () => controller.abort();
    }, []);



    const isLimitReached = userPlan === 'free' && messages.length >= 1;

    if (messages.length === 0) {
        return (
            <div className="text-center py-16 px-4">
                <div className="max-w-md mx-auto">
                    <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-gradient-to-br from-primary/20 to-purple-500/20 flex items-center justify-center">
                        <svg className="w-12 h-12 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                        </svg>
                    </div>

                    <h2 className="text-xl font-semibold mb-2">{dict.dashboard.empty.title}</h2>
                    <p className="text-muted-foreground mb-8">{dict.dashboard.empty.description}</p>

                    <CreateMessageButton
                        isLimitReached={isLimitReached}
                        dictionary={dict}
                        locale={locale}
                        className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors shadow-lg shadow-primary/25"
                    />
                </div>
            </div>
        );
    }

    return (
        <div className="grid gap-4">
            {messages.map((message) => {
                return (
                    <MessageCard
                        key={message.id}
                        message={message}
                        locale={locale}
                        dict={dict}
                    />
                );
            })}
        </div>
    );
}
