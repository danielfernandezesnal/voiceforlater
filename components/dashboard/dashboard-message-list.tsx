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
                <h2 className="font-serif font-light text-lg text-foreground mb-4">
                    {dict.dashboard.sectionTitle}
                </h2>
                
                {messages.length === 0 ? (
                    <div className="border border-dashed border-border/50 py-16 px-6 text-center flex flex-col items-center gap-4" style={{ borderRadius: '4px' }}>
                        <div className="w-12 h-12 flex items-center justify-center" style={{ background: 'rgba(196,98,58,0.06)', borderRadius: '10px' }}>
                            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#C4623A" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                            </svg>
                        </div>
                        <div>
                            <p className="font-serif font-light text-xl text-foreground mb-1">
                                {dict.dashboard.empty.title}
                            </p>
                            <p className="text-sm text-muted-foreground max-w-xs leading-relaxed font-light">
                                {dict.dashboard.empty.description}
                            </p>
                        </div>
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
