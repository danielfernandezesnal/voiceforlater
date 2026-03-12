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
    title: string | null;
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
    sender_name?: string | null;
    token?: string | null;
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
                if (data && typeof data === 'object') {
                    if (Array.isArray(data.sent)) {
                        setMessages(data.sent);
                    }
                } else if (Array.isArray(data)) {
                    // Fallback for old API format
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

    return (
        <div className="mt-8">
            {/* Sent Messages Section */}
            <div>
                <h2 className="font-serif font-semibold text-lg text-foreground mb-4">
                    {dict.dashboard.sectionTitle}
                </h2>
                
                {messages.length === 0 ? (
                    <div className="bg-card border-2 border-dashed border-border/40 rounded-2xl py-12 px-6 text-center flex flex-col items-center gap-3">
                        <div className="w-12 h-12 rounded-[14px] flex items-center justify-center text-xl"
                            style={{ background: 'rgba(196,98,58,0.08)' }}>
                            ✉️
                        </div>
                        <p className="font-serif font-semibold text-lg text-foreground">
                            {dict.dashboard.empty.title}
                        </p>
                        <p className="text-sm text-muted-foreground max-w-xs leading-relaxed">
                            {dict.dashboard.empty.description}
                        </p>
                    </div>
                ) : (
                    <div className="grid gap-4">
                        {messages.map((message) => (
                            <MessageCard
                                key={message.id}
                                message={message}
                                locale={locale}
                                dict={dict}
                            />
                        ))}
                    </div>
                )}
            </div>

            {/* Mobile floating CTA */}
            <div className="flex md:hidden justify-center mt-8 mb-4">
                <CreateMessageButton
                    isLimitReached={isLimitReached}
                    dictionary={dict}
                    locale={locale}
                    className="inline-flex items-center gap-2 px-6 py-3 text-sm bg-primary text-primary-foreground rounded-full font-medium hover:bg-primary/90 transition-colors shadow-lg shadow-primary/25"
                />
            </div>

            {/* Quote strip */}
            <div className="mt-10 rounded-2xl p-5 flex items-center gap-4"
                style={{ background: 'rgba(196,98,58,0.06)', border: '1px solid rgba(196,98,58,0.15)' }}>
                <div className="w-[3px] h-10 rounded-full flex-shrink-0" style={{ background: '#C4623A' }} />
                <p className="font-serif italic text-[0.95rem] text-foreground leading-relaxed">
                    {dict.dashboard.quote}
                </p>
            </div>
        </div>
    );
}
