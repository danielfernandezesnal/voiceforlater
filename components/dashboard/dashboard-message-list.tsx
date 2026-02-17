'use client';

import { useState, useEffect } from 'react';
import { CreateMessageButton } from "@/components/dashboard/create-message-button";
import { MessageStatus } from "@/components/dashboard/message-status";
import { MessageActions } from "@/components/dashboard/message-actions";
import type { Dictionary } from "@/lib/i18n";
import type { Plan } from "@/lib/plans";

interface MessageWithRecipient {
    id: string;
    type: 'text' | 'audio';
    status: 'draft' | 'scheduled' | 'delivered';
    text_content: string | null;
    created_at: string;
    recipients: { name: string; email: string }[];
    delivery_rules: { mode: 'date' | 'checkin'; deliver_at: string | null } | { mode: 'date' | 'checkin'; deliver_at: string | null }[] | null;
    message_contacts: {
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
                const deliveryRule = Array.isArray(message.delivery_rules)
                    ? message.delivery_rules[0]
                    : message.delivery_rules;
                const deliverAt = deliveryRule?.deliver_at;

                return (
                    <div
                        key={message.id}
                        className="p-4 bg-card border border-border rounded-xl hover:border-primary/50 transition-colors"
                    >
                        <div className="flex items-start justify-between">
                            <div className="flex-1">
                                {/* Recipient */}
                                <div className="text-sm text-muted-foreground mb-1">
                                    {dict.dashboard.messageCard.recipient.replace(
                                        '{name}',
                                        message.recipients[0]?.name || 'Unknown'
                                    )}
                                </div>

                                {/* Message Preview */}
                                <div className="font-medium mb-2">
                                    {message.type === 'text' && message.text_content
                                        ? message.text_content.substring(0, 80) + (message.text_content.length > 80 ? '...' : '')
                                        : dict.dashboard.messageCard.type.audio
                                    }
                                </div>

                                <MessageStatus
                                    status={message.status}
                                    deliverAt={deliverAt || null}
                                    deliveryMode={deliveryRule?.mode || null}
                                    type={message.type}
                                    locale={locale}
                                    dict={dict}
                                />

                                {/* Trusted Contacts Logic */}
                                <div className="mt-2 text-xs text-muted-foreground flex items-center gap-1.5" title="Contactos de confianza asignados">
                                    {(() => {
                                        const trusted = message.message_contacts?.map(mc => mc.trusted_contacts).filter(Boolean) || [];

                                        if (trusted.length === 0) {
                                            return (
                                                <div className="flex flex-col gap-1 mt-1">
                                                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-amber-100 text-amber-800 border border-amber-200 w-fit">
                                                        ⚠️ {locale === 'es' ? 'Sin contacto asignado' : 'No contact assigned'}
                                                    </span>
                                                    <span className="text-xs text-muted-foreground italic">
                                                        {locale === 'es' ? 'No se enviará automáticamente hasta que agregues uno.' : 'Will not send automatically until you add one.'}
                                                    </span>
                                                </div>
                                            );
                                        }

                                        if (trusted.length === 1) {
                                            const tc = trusted[0]!;
                                            return (
                                                <>
                                                    <svg className="w-3.5 h-3.5 text-primary/70" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                                    </svg>
                                                    <span className="font-medium text-foreground/80">
                                                        {locale === 'es' ? 'Contacto de confianza: ' : 'Trusted Contact: '}
                                                        <span className="font-normal text-muted-foreground">{tc.name || tc.email}</span>
                                                    </span>
                                                </>
                                            );
                                        }

                                        // Multiple
                                        return (
                                            <>
                                                <svg className="w-3.5 h-3.5 text-primary/70" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                                                </svg>
                                                <span className="font-medium text-foreground/80">
                                                    {locale === 'es' ? `Contactos de confianza (${trusted.length}): ` : `Trusted Contacts (${trusted.length}): `}
                                                    <span className="font-normal text-muted-foreground">
                                                        {trusted.map(t => t!.name || t!.email).join(' · ')}
                                                    </span>
                                                </span>
                                            </>
                                        );
                                    })()}
                                </div>
                            </div>

                            {/* Date & Actions */}
                            <div className="flex flex-col items-end gap-3 ml-4">
                                <div className="text-xs text-muted-foreground">
                                    {new Date(message.created_at).toLocaleDateString()}
                                </div>
                                <MessageActions
                                    messageId={message.id}
                                    locale={locale}
                                    status={message.status}
                                    labels={{
                                        edit: dict.common.edit,
                                        delete: dict.common.delete,
                                        view: dict.common.view
                                    }}
                                />
                            </div>
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
