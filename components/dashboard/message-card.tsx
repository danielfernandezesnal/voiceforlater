'use client';

import { useState, useEffect, useTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import type { Dictionary } from "@/lib/i18n";
import type { MessageWithRecipient } from "@/components/dashboard/dashboard-message-list";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";

interface MessageCardProps {
    message: MessageWithRecipient;
    locale: string;
    dict: Dictionary;
}

export function MessageCard({ message, locale, dict }: MessageCardProps) {
    const router = useRouter();
    const [hydrated, setHydrated] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);
    const [isPending, startTransition] = useTransition();

    useEffect(() => {
        setHydrated(true);
    }, []);

    const handleDeleteConfirm = async () => {
        setIsDeleting(true);
        try {
            const res = await fetch(`/api/messages?id=${message.id}`, { method: 'DELETE' });
            if (!res.ok) throw new Error('Failed to delete');
            setShowDeleteDialog(false);
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
    const isLoading = isPending;

    const formatName = (name: string) => name || 'Unknown';
    const formatDate = (dateString: string) =>
        new Date(dateString).toLocaleDateString(locale === 'es' ? 'es-ES' : 'en-US', { day: 'numeric', month: 'short', year: 'numeric' });

    const allRecipients = recipients || [];
    const visibleRecipients = allRecipients.slice(0, 3);
    const createdDate = formatDate(created_at);

    const primaryRecipient = visibleRecipients[0];
    const hasTitle = Boolean(message.title && message.title.trim().length > 0);
    const contentFallback = type === 'text' && text_content
        ? text_content.substring(0, 60) + (text_content.length > 60 ? '…' : '')
        : (type === 'video' ? dict.dashboard.messageCard.type.video : dict.dashboard.messageCard.type.audio);
    const primaryName = primaryRecipient
        ? formatName(primaryRecipient.name)
        : (hasTitle ? message.title : contentFallback);
    const extraTotal = allRecipients.length > 1 ? allRecipients.length - 1 : 0;

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
        <>
        <div
            className="message-card relative w-full rounded-xl overflow-hidden transition-all duration-[250ms] ease-out hover:-translate-y-0.5 shadow-[0_1px_2px_rgba(196,98,58,0.04),0_4px_12px_rgba(0,0,0,0.06)] hover:shadow-[0_2px_4px_rgba(196,98,58,0.08),0_8px_20px_rgba(0,0,0,0.10)]"
            style={{ background: '#FDFCFB', border: '1px solid #E8DDD0' }}
        >
            {/* Left accent bar */}
            <div className="absolute left-0 top-0 bottom-0 w-1" style={{ background: accentColor }} />

            <div className="pl-4 pr-5 py-5 md:pr-6 md:py-6">
                <div className="flex flex-col md:flex-row md:items-stretch gap-4">

                    {/* Left column */}
                    <div className="flex-1 min-w-0 flex flex-col gap-2">

                        {/* Header: Para + primary recipient */}
                        <p className="font-serif text-xl leading-snug" style={{ color: '#2C2C2C' }}>
                            <span className="font-normal" style={{ color: '#9a8070' }}>{labels?.to}:&nbsp;</span>
                            <span className="font-semibold">
                                {primaryName}
                                {extraTotal > 0 && (
                                    <span className="font-normal text-base" style={{ color: '#9a8070' }}> +{extraTotal}</span>
                                )}
                            </span>
                        </p>
                        <div className="w-16 h-px bg-[#C4623A]/30 mt-2 mb-2.5" />

                        {/* Type badge — mobile only */}
                        <div className="md:hidden">
                            <span
                                className="inline-flex items-center rounded-lg px-2.5 py-1 text-sm font-medium"
                                style={{ border: '1px solid rgba(196,98,58,0.2)', background: 'rgba(196,98,58,0.08)', color: '#C4623A' }}
                            >
                                {type === 'text' && dict.dashboard.messageCard.type.text}
                                {type === 'audio' && dict.dashboard.messageCard.type.audio}
                                {type === 'video' && dict.dashboard.messageCard.type.video}
                            </span>
                        </div>

                        {/* Metadata */}
                        <div className="flex flex-col gap-1.5 mt-0.5">
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
                            {scheduledDate && (
                                <span className="text-sm" style={{ color: '#6B6B6B' }}>
                                    <span style={{ color: '#9a8070' }}>{scheduledLabel}:</span>{' '}
                                    <span style={{ color: '#4A4A4A', fontWeight: 500 }}>
                                        {scheduledDateOnly ? `${scheduledDateOnly} · ${scheduledTime}` : scheduledDate}
                                    </span>
                                </span>
                            )}
                            {/* Status badge */}
                            <div>
                                {isSent ? (
                                    <span
                                        className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-sm font-medium"
                                        style={{ background: 'rgba(52,211,153,0.12)', color: '#059669' }}
                                    >
                                        <svg className="w-3 h-3" viewBox="0 0 24 24" fill="currentColor"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" /></svg>
                                        {dict.dashboard.messageCard.status.delivered}
                                    </span>
                                ) : (
                                    <span
                                        className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-sm font-medium"
                                        style={{
                                            background: status === 'scheduled' ? 'rgba(196,98,58,0.08)' : '#f0ece4',
                                            color: status === 'scheduled' ? '#C4623A' : '#9a8070',
                                        }}
                                    >
                                        {dict.dashboard.messageCard.status[status as 'draft' | 'scheduled' | 'delivered']}
                                    </span>
                                )}
                            </div>
                        </div>

                        <ContactAlert />

                        {/* Actions — mobile */}
                        <div className="flex md:hidden gap-2 pt-1">
                            <Link
                                href={`/${locale}/messages/${message.id}/edit${isDelivered ? '?readonly=true' : ''}`}
                                className="flex-1 inline-flex items-center justify-center border border-[#C4623A]/70 text-[#C4623A] rounded-md px-4 py-2 text-sm hover:bg-[#C4623A]/[0.05] transition-colors duration-[250ms]"
                            >
                                {isDelivered ? dict.common.view : dict.common.edit}
                            </Link>
                            {!isDelivered && (
                                <button
                                    onClick={() => setShowDeleteDialog(true)}
                                    disabled={isLoading}
                                    className="flex-1 inline-flex items-center justify-center border border-red-200 text-red-400/80 rounded-md px-4 py-2 text-sm hover:bg-red-50 transition-colors duration-[250ms] disabled:opacity-50"
                                >
                                    {dict.common.delete}
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Right column — desktop only */}
                    <div className="hidden md:flex flex-col justify-between items-end gap-4 shrink-0">
                        {/* Type badge at top */}
                        <span
                            className="inline-flex items-center rounded-lg px-2.5 py-1 text-sm font-medium"
                            style={{ border: '1px solid rgba(196,98,58,0.2)', background: 'rgba(196,98,58,0.08)', color: '#C4623A' }}
                        >
                            {type === 'text' && dict.dashboard.messageCard.type.text}
                            {type === 'audio' && dict.dashboard.messageCard.type.audio}
                            {type === 'video' && dict.dashboard.messageCard.type.video}
                        </span>
                        {/* Actions at bottom, stacked */}
                        <div className="flex flex-col gap-1.5 items-end">
                            <Link
                                href={`/${locale}/messages/${message.id}/edit${isDelivered ? '?readonly=true' : ''}`}
                                className="inline-flex items-center justify-center border border-[#C4623A]/70 text-[#C4623A] rounded-md px-4 py-2 text-sm hover:bg-[#C4623A]/[0.05] transition-colors duration-[250ms] w-[96px]"
                            >
                                {isDelivered ? dict.common.view : dict.common.edit}
                            </Link>
                            {!isDelivered && (
                                <button
                                    onClick={() => setShowDeleteDialog(true)}
                                    disabled={isLoading}
                                    className="inline-flex items-center justify-center border border-red-200 text-red-400/80 rounded-md px-4 py-2 text-sm hover:bg-red-50 transition-colors duration-[250ms] disabled:opacity-50 w-[96px]"
                                >
                                    {dict.common.delete}
                                </button>
                            )}
                        </div>
                    </div>

                </div>
            </div>
        </div>

        <ConfirmDialog
            open={showDeleteDialog}
            onClose={() => { if (!isDeleting) setShowDeleteDialog(false); }}
            onConfirm={handleDeleteConfirm}
            title={(dict.common as any).confirmDialog.deleteMessage.title}
            description={(dict.common as any).confirmDialog.deleteMessage.description}
            confirmText={(dict.common as any).confirmDialog.deleteMessage.confirm}
            cancelText={(dict.common as any).confirmDialog.deleteMessage.cancel}
            loadingText={(dict.common as any).confirmDialog.deleteMessage.deleting}
            isLoading={isDeleting}
            variant="destructive"
        />
        </>
    );
}
