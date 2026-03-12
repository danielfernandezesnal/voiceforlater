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
    initialReceivedMessages?: MessageWithRecipient[];
    userPlan: Plan;
    locale: string;
    dict: Dictionary;
}

export function DashboardMessageList({ initialMessages, initialReceivedMessages = [], userPlan, locale, dict }: Props) {
    const [messages, setMessages] = useState<MessageWithRecipient[]>(initialMessages);
    const [receivedMessages, setReceivedMessages] = useState<MessageWithRecipient[]>(initialReceivedMessages);

    // Sync state with props when router.refresh() is called
    useEffect(() => {
        setMessages(initialMessages);
        setReceivedMessages(initialReceivedMessages);
    }, [initialMessages, initialReceivedMessages]);

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
                    if (Array.isArray(data.received)) {
                        setReceivedMessages(data.received);
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

            {/* Received Messages Section */}
            {receivedMessages.length > 0 && (
                <div className="mt-12 pt-12 border-t border-border/40">
                    <h2 className="font-serif font-semibold text-lg text-foreground mb-4">
                        {(dict.dashboard as any).receivedMessages?.title || 'Received Messages'}
                    </h2>
                    <div className="grid gap-4">
                        {receivedMessages.map((msg) => (
                            <ReceivedMessageCard
                                key={msg.id}
                                message={msg}
                                locale={locale}
                                dict={dict}
                            />
                        ))}
                    </div>
                </div>
            )}

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

function ReceivedMessageCard({ message, locale, dict }: { message: MessageWithRecipient, locale: string, dict: any }) {
    const date = new Date(message.created_at).toLocaleDateString(locale === 'es' ? 'es-ES' : 'en-US', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
    });

    const senderName = message.sender_name || (dict.dashboard as any).receivedMessages?.someoneSpecial || 'Someone special';

    return (
        <div className="bg-card border border-border/60 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:border-border transition-colors">
            <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary text-sm font-bold">
                    {senderName.charAt(0).toUpperCase()}
                </div>
                <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">
                        {(dict.dashboard as any).receivedMessages?.from.replace('{name}', '') || 'From: '}
                        <span className="text-foreground">{senderName}</span>
                    </p>
                    <h3 className="font-serif font-medium text-base text-foreground mt-0.5">
                        {message.title || (message.type === 'audio' ? dict.dashboard.messageCard.type.audio : message.type === 'video' ? dict.dashboard.messageCard.type.video : dict.dashboard.messageCard.type.text)}
                    </h3>
                    <p className="text-[10px] text-muted-foreground mt-1">
                        {(dict.dashboard as any).receivedMessages?.delivered || 'Delivered on'} {date}
                    </p>
                </div>
            </div>
            
            {message.token && (
                <a 
                    href={`/${locale}/mensaje/${message.token}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center px-4 py-2 text-xs font-semibold bg-primary/10 text-primary rounded-lg hover:bg-primary/20 transition-colors whitespace-nowrap"
                >
                    {(dict.dashboard as any).receivedMessages?.view || 'View Message'}
                </a>
            )}
        </div>
    );
}
