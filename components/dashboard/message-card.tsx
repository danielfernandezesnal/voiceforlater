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
            <div className="border border-[#E3DDD6] rounded-[4px] bg-[#FDFAF6] h-[180px] animate-pulse" style={{ boxShadow: '0 4px 0 rgba(204,199,191,0.75)' }} />
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
    let scheduledDateOnly = '';
    let scheduledTime = '';

    if (isDelivered) {
        // Para mensajes enviados, mostrar la fecha real de envío
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
        scheduledDate = formatDateTime(deliverAt);
        const d = new Date(deliverAt);
        scheduledDateOnly = d.toLocaleDateString(locale === 'es' ? 'es-ES' : 'en-US', { day: 'numeric', month: 'short', year: 'numeric' });
        scheduledTime = d.toLocaleTimeString(locale === 'es' ? 'es-ES' : 'en-US', { hour: '2-digit', minute: '2-digit' });
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
                <span className={`inline-flex items-center px-2 py-1 text-xs rounded-full ${status === 'scheduled' ? 'bg-primary/10 text-primary' : 'bg-secondary text-muted-foreground'}`}>
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
        <div className="message-card w-full flex items-stretch gap-0" style={{ background: '#FDFAF6', border: '1px solid #E3DDD6', borderRadius: '4px', overflow: 'hidden', boxShadow: '0 4px 0 rgba(204,199,191,0.75)', transition: 'transform 200ms ease-out, box-shadow 200ms ease-out' }}>
            {/* Borde izquierdo de color */}
            <div style={{ width: '3px', flexShrink: 0, background: isDelivered ? '#34d399' : '#c4622a' }} />

            {/* Contenido */}
            <div className="flex-1 flex items-start justify-between gap-4 p-5 min-w-0">
                <div className="flex-1 min-w-0 flex flex-col gap-2">

                    {/* Fila 1: destinatarios + badges */}
                    <div className="flex flex-wrap items-center gap-2">
                        <div className="flex flex-wrap gap-x-1.5 items-baseline">
                            {visibleRecipients.map((r: any, i: number) => (
                                <span key={i} style={{ fontFamily: 'var(--font-serif)', fontSize: '1.2rem', fontWeight: 400, color: 'hsl(var(--ink))', lineHeight: 1.1 }}>
                                    {formatName(r.name)}
                                </span>
                            ))}
                            {extraCount > 0 && (
                                <span className="text-sm text-muted-foreground">+{extraCount}</span>
                            )}
                        </div>
                        {/* Badge tipo */}
                        <span style={{ fontSize: '10px', fontWeight: 500, letterSpacing: '0.08em', textTransform: 'uppercase', padding: '3px 8px', borderRadius: '100px', background: '#f0ece4', color: '#9a8070' }}>
                            {type === 'text' && dict.dashboard.messageCard.type.text}
                            {type === 'audio' && dict.dashboard.messageCard.type.audio}
                            {type === 'video' && dict.dashboard.messageCard.type.video}
                        </span>
                        {/* Badge status */}
                        {isSent ? (
                            <span style={{ fontSize: '10px', fontWeight: 500, letterSpacing: '0.08em', textTransform: 'uppercase', padding: '3px 8px', borderRadius: '100px', background: 'rgba(52,211,153,0.12)', color: '#059669', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                                <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" /></svg>
                                {dict.dashboard.messageCard.status.delivered}
                            </span>
                        ) : (
                            <span style={{ fontSize: '10px', fontWeight: 500, letterSpacing: '0.08em', textTransform: 'uppercase', padding: '3px 8px', borderRadius: '100px', background: status === 'scheduled' ? 'rgba(196,98,58,0.1)' : '#f0ece4', color: status === 'scheduled' ? '#c4622a' : '#9a8070' }}>
                                {dict.dashboard.messageCard.status[status as 'draft' | 'scheduled' | 'delivered']}
                            </span>
                        )}
                    </div>

                    {/* Fila 2: título o preview */}
                    <div style={{ fontSize: '13px', color: hasTitle ? '#4a3728' : '#9a8070', fontStyle: hasTitle ? 'normal' : 'italic', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {hasTitle ? message.title : contentFallback}
                    </div>

                    {/* Fila 3: metadata */}
                    <div className="flex flex-wrap gap-x-4 gap-y-1">
                        {scheduledDateOnly ? (
                            <>
                                <span style={{ fontSize: '12px', color: '#9a8070', fontWeight: 300 }}>
                                    {scheduledLabel}: <strong style={{ color: '#4a3728', fontWeight: 400 }}>{scheduledDateOnly} · {scheduledTime}</strong>
                                </span>
                            </>
                        ) : (
                            <span style={{ fontSize: '12px', color: '#9a8070', fontWeight: 300 }}>
                                {scheduledLabel}: <strong style={{ color: '#4a3728', fontWeight: 400 }}>{scheduledDate}</strong>
                            </span>
                        )}
                        {deliveryMode === 'checkin' && hasTrusted && (
                            <span style={{ fontSize: '12px', color: '#9a8070', fontWeight: 300 }}>
                                {labels?.contact}: <strong style={{ color: '#4a3728', fontWeight: 400 }}>{trustedList.map((c: any) => formatName(c.name)).join(', ')}</strong>
                            </span>
                        )}
                        <span style={{ fontSize: '12px', color: '#9a8070', fontWeight: 300 }}>
                            {labels?.created}: <strong style={{ color: '#4a3728', fontWeight: 400 }}>{createdDate}</strong>
                        </span>
                    </div>

                    <ContactAlert />
                </div>

                {/* Acciones */}
                <div className="flex flex-col gap-1 shrink-0">
                    <Link
                        href={`/${locale}/messages/${message.id}/edit${isDelivered ? '?readonly=true' : ''}`}
                        style={{ fontSize: '12px', fontWeight: 400, padding: '5px 12px', borderRadius: '2px', border: '1px solid #e8e0d0', background: 'transparent', color: '#6b5040', textDecoration: 'none', display: 'block', textAlign: 'center', whiteSpace: 'nowrap' }}
                    >
                        {isDelivered ? dict.common.view : dict.common.edit}
                    </Link>
                    {!isDelivered && (
                        <button
                            onClick={handleDelete}
                            disabled={isLoading}
                            style={{ fontSize: '12px', fontWeight: 400, padding: '5px 12px', borderRadius: '2px', border: '1px solid transparent', background: 'transparent', color: '#c4622a', cursor: 'pointer', whiteSpace: 'nowrap' }}
                        >
                            {isLoading ? '...' : dict.common.delete}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}

