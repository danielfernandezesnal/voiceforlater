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
            startTransition(() => { router.refresh(); });
        } catch (error) {
            console.error('Delete error:', error);
            setIsDeleting(false);
            alert('Failed to delete message');
        }
    };

    if (!hydrated) {
        return (
            <div
                className="rounded-xl border border-[#E8DDD0] bg-[#FDFCFB] h-[140px] animate-pulse"
                style={{ boxShadow: '0 1px 2px rgba(196,98,58,0.04), 0 4px 12px rgba(0,0,0,0.06)' }}
            />
        );
    }

    const { type, status, text_content, created_at, delivery_claimed_at, recipients, delivery_rules, message_trusted_contacts } = message;
    const mtc = message_trusted_contacts || [];
    const trustedList = mtc.map((item: any) => item?.trusted_contacts).filter(Boolean);
    const hasTrusted = trustedList.length > 0;

    const deliveryRule = Array.isArray(delivery_rules) ? delivery_rules[0] : delivery_rules;
    const deliverAt = deliveryRule?.deliver_at;
    const deliveryMode = deliveryRule?.mode;

    const isDelivered = status === 'delivered';
    const isSent = isDelivered;
    const isLoading = isDeleting || isPending;

    const formatName = (name: string) => name || 'Unknown';
    const formatDate = (dateString: string) =>
        new Date(dateString).toLocaleDateString(locale === 'es' ? 'es-ES' : 'en-US', { day: 'numeric', month: 'short', year: 'numeric' });

    const allRecipients = recipients || [];
    const visibleRecipients = allRecipients.slice(0, 3);
    const extraCount = allRecipients.length - 3;
    const createdDate = formatDate(created_at);

    const labels = (dict.dashboard.messageCard as any).labels;
    let scheduledDate = '';
    let scheduledLabel = labels?.scheduledFor;
    let scheduledDateOnly = '';
    let scheduledTime = '';

    if (isDelivered) {
        const sentDate = delivery_claimed_at || created_at;
        scheduledLabel = labels?.sentAt;
        const d = new Date(sentDate);
        scheduledDateOnly = d.toLocaleDateString(locale === 'es' ? 'es-ES' : 'en-US', { day: 'numeric', month: 'short', year: 'numeric' });
        scheduledTime = d.toLocaleTimeString(locale === 'es' ? 'es-ES' : 'en-US', { hour: '2-digit', minute: '2-digit' });
        scheduledDate = `${scheduledDateOnly} · ${scheduledTime}`;
    } else if (deliveryMode === 'checkin') {
        scheduledDate = (dict.dashboard.messageCard as any).deliveryType?.checkin;
        scheduledLabel = labels?.delivery;
    } else if (deliverAt) {
        const d = new Date(deliverAt);
        scheduledDateOnly = d.toLocaleDateString(locale === 'es' ? 'es-ES' : 'en-US', { day: 'numeric', month: 'short', year: 'numeric' });
        scheduledTime = d.toLocaleTimeString(locale === 'es' ? 'es-ES' : 'en-US', { hour: '2-digit', minute: '2-digit' });
        scheduledDate = `${scheduledDateOnly} · ${scheduledTime}`;
    }

    const hasTitle = Boolean(message.title && message.title.trim().length > 0);
    const contentFallback = type === 'text' && text_content
        ? text_content.substring(0, 60) + (text_content.length > 60 ? '…' : '')
        : (type === 'video' ? dict.dashboard.messageCard.type.video : dict.dashboard.messageCard.type.audio);

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
                    <Link
                        href={`/${locale}/messages/${message.id}/edit${isDelivered ? '?readonly=true' : ''}`}
                        className="underline cursor-pointer text-primary"
                    >
                        <span className="sm:hidden block font-semibold">{(dict.dashboard.messageCard as any).addContactLong}</span>
                        <span className="hidden sm:block">{(dict.dashboard.messageCard as any).addContactShort}</span>
                    </Link>
                </div>
            </div>
        );
    };

    const accentColor = isSent ? '#34d399' : '#C4623A';

    return (
        <div
            className="message-card relative w-full rounded-xl overflow-hidden transition-all duration-[250ms] ease-out hover:-translate-y-0.5 shadow-[0_1px_2px_rgba(196,98,58,0.04),0_4px_12px_rgba(0,0,0,0.06)] hover:shadow-[0_2px_4px_rgba(196,98,58,0.08),0_8px_20px_rgba(0,0,0,0.10)]"
            style={{ background: '#FDFCFB', border: '1px solid #E8DDD0' }}
        >
            {/* Left accent bar */}
            <div className="absolute left-0 top-0 bottom-0 w-1" style={{ background: accentColor }} />

            {/* Content */}
            <div className="pl-4 pr-5 py-5 md:pr-6 md:py-6 flex flex-col gap-3">

                {/* Row 1: title + status badge */}
                <div className="flex items-start justify-between gap-3">
                    <h3
                        className="font-serif text-xl font-semibold leading-snug flex-1 min-w-0"
                        style={{ color: '#2C2C2C', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' } as React.CSSProperties}
                    >
                        {hasTitle ? message.title : contentFallback}
                    </h3>
                    {isSent ? (
                        <span
                            className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-sm font-medium shrink-0 mt-0.5"
                            style={{ background: 'rgba(52,211,153,0.12)', color: '#059669' }}
                        >
                            <svg className="w-3 h-3" viewBox="0 0 24 24" fill="currentColor"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" /></svg>
                            {dict.dashboard.messageCard.status.delivered}
                        </span>
                    ) : (
                        <span
                            className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-sm font-medium shrink-0 mt-0.5"
                            style={{
                                background: status === 'scheduled' ? 'rgba(196,98,58,0.08)' : '#f0ece4',
                                color: status === 'scheduled' ? '#C4623A' : '#9a8070',
                            }}
                        >
                            {dict.dashboard.messageCard.status[status as 'draft' | 'scheduled' | 'delivered']}
                        </span>
                    )}
                </div>

                {/* Row 2: type badge + delivery info */}
                <div className="flex flex-wrap items-center gap-x-2 gap-y-1.5">
                    <span
                        className="inline-flex items-center rounded-lg px-2.5 py-1 text-sm font-medium"
                        style={{ border: '1px solid rgba(196,98,58,0.2)', background: 'rgba(196,98,58,0.08)', color: '#C4623A' }}
                    >
                        {type === 'text' && dict.dashboard.messageCard.type.text}
                        {type === 'audio' && dict.dashboard.messageCard.type.audio}
                        {type === 'video' && dict.dashboard.messageCard.type.video}
                    </span>
                    {scheduledDate && (
                        <>
                            <span aria-hidden="true" style={{ color: '#d0c8be' }}>·</span>
                            <span className="text-sm" style={{ color: '#6B6B6B' }}>
                                {scheduledLabel}:{' '}
                                <span style={{ color: '#4A4A4A', fontWeight: 500 }}>
                                    {scheduledDateOnly ? `${scheduledDateOnly} · ${scheduledTime}` : scheduledDate}
                                </span>
                            </span>
                        </>
                    )}
                </div>

                {/* Row 3: metadata grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1.5">
                    {visibleRecipients.length > 0 && (
                        <span className="text-sm font-medium" style={{ color: '#4A4A4A' }}>
                            {visibleRecipients.map((r: any) => formatName(r.name)).join(', ')}
                            {extraCount > 0 && ` +${extraCount}`}
                        </span>
                    )}
                    {deliveryMode === 'checkin' && hasTrusted && (
                        <span className="text-sm" style={{ color: '#6B6B6B' }}>
                            <span style={{ color: '#9a8070' }}>{labels?.contact}:</span>{' '}
                            <span style={{ color: '#4A4A4A', fontWeight: 500 }}>
                                {trustedList.map((c: any) => formatName(c.name)).join(', ')}
                            </span>
                        </span>
                    )}
                    <span className="text-sm" style={{ color: '#6B6B6B' }}>
                        <span style={{ color: '#9a8070' }}>{labels?.created}:</span>{' '}
                        <span style={{ color: '#4A4A4A', fontWeight: 500 }}>{createdDate}</span>
                    </span>
                </div>

                <ContactAlert />

                {/* Actions */}
                <div className="flex sm:justify-end gap-2 pt-1">
                    <Link
                        href={`/${locale}/messages/${message.id}/edit${isDelivered ? '?readonly=true' : ''}`}
                        className="flex-1 sm:flex-none inline-flex items-center justify-center border border-[#C4623A]/70 text-[#C4623A] rounded-md px-4 py-2 text-sm hover:bg-[#C4623A]/[0.05] transition-colors duration-[250ms]"
                    >
                        {isDelivered ? dict.common.view : dict.common.edit}
                    </Link>
                    {!isDelivered && (
                        <button
                            onClick={handleDelete}
                            disabled={isLoading}
                            className="flex-1 sm:flex-none inline-flex items-center justify-center border border-red-200 text-red-400/80 rounded-md px-4 py-2 text-sm hover:bg-red-50 transition-colors duration-[250ms] disabled:opacity-50"
                        >
                            {isLoading ? '···' : dict.common.delete}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
