'use client';

import { useState, useEffect, useTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import type { Dictionary } from "@/lib/i18n";
import type { MessageWithRecipient } from "@/components/dashboard/dashboard-message-list";

interface MessageCardProps {
    message: MessageWithRecipient;
    locale: string;
    dict: Dictionary;
}

export function MessageCard({ message, locale, dict }: MessageCardProps) {
    const router = useRouter();
    const [hydrated, setHydrated] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [isPending, startTransition] = useTransition();

    useEffect(() => {
        setHydrated(true);
    }, []);

    const handleDelete = async () => {
        if (!window.confirm(`${dict.common.delete}?`)) return;
        setIsDeleting(true);
        try {
            const res = await fetch(`/api/messages?id=${message.id}`, { method: 'DELETE' });
            if (!res.ok) throw new Error('Failed to delete');
            startTransition(() => {
                router.refresh();
            });
        } catch (error) {
            console.error('Delete error:', error);
            setIsDeleting(false);
            alert('Failed to delete message');
        }
    };

    if (!hydrated) {
        return (
            <div className="border border-border/60 rounded-2xl bg-card shadow-sm h-[180px] animate-pulse" />
        );
    }

    const { type, status, text_content, created_at, recipients, delivery_rules, message_trusted_contacts } = message;
    const mtc = message_trusted_contacts || [];
    const trustedList = mtc.map((item: any) => item?.trusted_contacts).filter(Boolean);
    const hasTrusted = trustedList.length > 0;

    const deliveryRule = Array.isArray(delivery_rules) ? delivery_rules[0] : delivery_rules;
    const deliverAt = deliveryRule?.deliver_at;
    const deliveryMode = deliveryRule?.mode;

    const now = new Date();
    const isPastDelivery = deliverAt ? new Date(deliverAt) < now : false;
    const isSent = status === 'scheduled' && deliverAt && isPastDelivery;
    const finalStatus = isSent ? 'delivered' : status;

    const isDelivered = finalStatus === 'delivered';
    const isLoading = isDeleting || isPending;

    // Formatting Helpers
    const formatName = (name: string) => name || 'Unknown';
    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString(locale === 'es' ? 'es-ES' : 'en-US', { day: 'numeric', month: 'short', year: 'numeric' });
    };
    const formatDateTime = (dateString: string) => {
        const d = new Date(dateString);
        return `${d.toLocaleDateString(locale === 'es' ? 'es-ES' : 'en-US', { day: 'numeric', month: 'short', year: 'numeric' })} · ${d.toLocaleTimeString(locale === 'es' ? 'es-ES' : 'en-US', { hour: '2-digit', minute: '2-digit' })}`;
    };

    const allRecipients = recipients || []
    const visibleRecipients = allRecipients.slice(0, 3)
    const extraCount = allRecipients.length - 3
    const createdDate = formatDate(created_at);

    const labels = (dict.dashboard.messageCard as any).labels;
    let scheduledDate = '';
    let scheduledLabel = labels?.scheduledFor;

    if (deliveryMode === 'checkin') {
        scheduledDate = (dict.dashboard.messageCard as any).deliveryType?.checkin;
        scheduledLabel = labels?.delivery;
    } else if (deliverAt) {
        scheduledDate = formatDateTime(deliverAt);
    }

    // Badges Row
    const BadgesRow = () => (
        <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1 px-2 py-1 text-xs rounded-full bg-secondary text-muted-foreground">
                {type === 'text' && dict.dashboard.messageCard.type.text}
                {type === 'audio' && dict.dashboard.messageCard.type.audio}
                {type === 'video' && dict.dashboard.messageCard.type.video}
            </span>
            {isSent ? (
                <span className="inline-flex items-center gap-1 px-3 py-1 text-xs rounded-full bg-[#34D399] text-white font-medium shadow-sm">
                    <svg className="w-3 h-3 text-white fill-current" viewBox="0 0 24 24"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" /></svg>
                    {dict.dashboard.messageCard.status.delivered}
                </span>
            ) : (
                <span className={`inline-flex items-center px-2 py-1 text-xs rounded-full ${status === 'scheduled' ? 'bg-primary/10 text-primary' : status === 'delivered' ? 'bg-[#34D399] text-white' : 'bg-secondary text-muted-foreground'}`}>
                    {dict.dashboard.messageCard.status[status as 'draft' | 'scheduled' | 'delivered']}
                </span>
            )}
        </div>
    );

    // Title / Preview
    // Custom Title Display
    const hasTitle = Boolean(message.title && message.title.trim().length > 0);
    const contentFallback = type === 'text' && text_content
        ? text_content.substring(0, 50) + (text_content.length > 50 ? '...' : '')
        : (type === 'video' ? dict.dashboard.messageCard.type.video : dict.dashboard.messageCard.type.audio);

    // Alert Block
    const ContactAlert = () => {
        if (deliveryMode !== 'checkin') return null;
        if (hasTrusted) return null;
        return (
            <div className="bg-[#FFF8E6] border border-[#F5C842] text-[#8A6A00] text-xs font-medium px-3 py-2 rounded-xl inline-flex flex-col sm:flex-row sm:items-center gap-1 w-fit mt-1">
                <div className="flex items-center gap-1">
                    <span>⚠️</span>
                    <span>{(dict.dashboard.messageCard as any).noContactAssigned} <span className="hidden sm:inline">·</span></span>
                </div>
                <div className="flex items-center gap-1">
                    <span className="opacity-80 sm:hidden block text-[0.65rem] -mt-1 mb-1">{(dict.dashboard.messageCard as any).noContactAssignedDesc}</span>
                    <Link href={`/${locale}/messages/${message.id}/edit${isDelivered ? '?readonly=true' : ''}`} className="underline cursor-pointer text-primary">
                        <span className="sm:hidden block font-semibold">{(dict.dashboard.messageCard as any).addContactLong}</span>
                        <span className="hidden sm:block">{(dict.dashboard.messageCard as any).addContactShort}</span>
                    </Link>
                </div>
            </div>
        );
    };

    // Main Edit/Delete Actions
    const ActionButtonsDesktop = () => (
        <>
            <Link
                href={`/${locale}/messages/${message.id}/edit${isDelivered ? '?readonly=true' : ''}`}
                className="text-xs text-muted-foreground hover:text-foreground transition-colors flex items-center justify-center gap-1 px-2 py-1.5 rounded-md hover:bg-foreground/[0.04] w-full"
            >
                ✏️ {isDelivered ? dict.common.view : dict.common.edit}
            </Link>
            <button
                onClick={handleDelete}
                disabled={isLoading}
                className="text-xs text-destructive/60 hover:text-destructive transition-colors flex items-center justify-center gap-1 px-2 py-1.5 rounded-md hover:bg-destructive/[0.06] w-full"
            >
                {isLoading ? '...' : `🗑️ ${dict.common.delete}`}
            </button>
        </>
    );

    return (
        <div className="border border-border/60 rounded-2xl bg-card shadow-sm w-full p-5">
            <div className="flex items-start justify-between gap-4">
                {/* Content stack */}
                <div className="flex-1 min-w-0 flex flex-col gap-2.5">

                    {/* Row 1 — Recipient + status badge */}
                    <div className="flex flex-wrap items-center gap-2">
                        <div className="flex flex-wrap gap-x-1">
                            {visibleRecipients.map((r: any, i: number) => (
                                <span key={i} className="text-lg font-semibold text-foreground leading-snug">{formatName(r.name)}</span>
                            ))}
                            {extraCount > 0 && (
                                <span className="text-base text-muted-foreground">+{extraCount}</span>
                            )}
                        </div>
                        {isSent ? (
                            <span className="inline-flex items-center gap-1 px-3 py-1 text-xs rounded-full bg-[#34D399] text-white font-medium shadow-sm">
                                <svg className="w-3 h-3 text-white fill-current" viewBox="0 0 24 24"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" /></svg>
                                {dict.dashboard.messageCard.status.delivered}
                            </span>
                        ) : (
                            <span className={`inline-flex items-center px-2 py-1 text-xs rounded-full ${status === 'scheduled' ? 'bg-primary/10 text-primary' : status === 'delivered' ? 'bg-[#34D399] text-white' : 'bg-secondary text-muted-foreground'}`}>
                                {dict.dashboard.messageCard.status[status as 'draft' | 'scheduled' | 'delivered']}
                            </span>
                        )}
                    </div>

                    {/* Row 2 — Title */}
                    <div className={`truncate ${hasTitle ? 'font-semibold text-base text-foreground' : 'text-sm italic text-muted-foreground'}`}>
                        {hasTitle ? message.title : contentFallback}
                    </div>

                    {/* Row 3 — Delivery (prominent) */}
                    <div className="text-sm font-medium text-foreground">
                        <span className="text-muted-foreground">{scheduledLabel}:</span>{' '}
                        {scheduledDate}
                    </div>

                    {/* Row 4 — Created (subtle) */}
                    <div className="text-xs text-muted-foreground/70">
                        {labels?.created}: {createdDate}
                    </div>

                    {/* Trusted contact info */}
                    {deliveryMode === 'checkin' && hasTrusted && (
                        <div className="flex items-center gap-1 text-sm">
                            <span className="text-muted-foreground">{labels?.contact}:</span>
                            <span className="font-medium text-foreground truncate">
                                {trustedList.map((c: any) => formatName(c.name)).join(', ')}
                            </span>
                        </div>
                    )}

                    <ContactAlert />
                </div>

                {/* Actions — top-right */}
                <div className="flex flex-col gap-2 shrink-0">
                    <ActionButtonsDesktop />
                </div>
            </div>
        </div>
    );
}

