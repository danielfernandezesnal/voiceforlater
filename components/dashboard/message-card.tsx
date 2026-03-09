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

    const recipientName = formatName(recipients[0]?.name);
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
                className="text-sm font-medium px-3 py-2 rounded-lg bg-foreground/[0.06] hover:bg-foreground/10 transition-colors flex items-center justify-center gap-1.5 w-full"
            >
                ✏️ {isDelivered ? dict.common.view : dict.common.edit}
            </Link>
            <button
                onClick={handleDelete}
                disabled={isLoading}
                className="text-sm font-medium px-3 py-2 rounded-lg bg-destructive/[0.07] text-destructive hover:bg-destructive/[0.13] transition-colors flex items-center justify-center gap-1.5 w-full"
            >
                {isLoading ? '...' : `🗑️ ${dict.common.delete}`}
            </button>
        </>
    );

    const ActionButtonsMobile = () => (
        <>
            <button
                onClick={handleDelete}
                disabled={isLoading}
                className="text-sm font-medium px-4 py-[10px] rounded-lg bg-destructive/[0.07] text-destructive hover:bg-destructive/[0.13] transition-colors flex items-center gap-1.5"
            >
                {isLoading ? '...' : `🗑️ ${dict.common.delete}`}
            </button>
            <Link
                href={`/${locale}/messages/${message.id}/edit${isDelivered ? '?readonly=true' : ''}`}
                className="text-sm font-medium px-4 py-[10px] rounded-lg bg-foreground/[0.06] hover:bg-foreground/10 transition-colors flex items-center gap-1.5"
            >
                ✏️ {isDelivered ? dict.common.view : dict.common.edit}
            </Link>
        </>
    );

    // Desktop Layout Block
    const DesktopLayout = (
        <div className="hidden md:flex flex-row items-stretch border border-border/60 rounded-2xl bg-card shadow-sm w-full">
            {/* Columna Izquierda - Metadata */}
            <div className="w-[190px] shrink-0 border-r border-border/50 py-5 pr-5 pl-5 flex flex-col justify-center gap-0">
                <div className="flex flex-col gap-[3px]">
                    <span className="text-[0.62rem] font-medium uppercase tracking-widest text-muted-foreground">{labels?.to}</span>
                    <span className="text-sm font-medium text-foreground">{recipientName}</span>
                </div>
                <div className="border-t border-border/40 my-3" />
                <div className="flex flex-col gap-[3px]">
                    <span className="text-[0.62rem] font-medium uppercase tracking-widest text-muted-foreground">{labels?.created}</span>
                    <span className="text-sm font-medium text-foreground">{createdDate}</span>
                </div>
                <div className="border-t border-border/40 my-3" />
                <div className="flex flex-col gap-[3px]">
                    <span className="text-[0.62rem] font-medium uppercase tracking-widest text-muted-foreground">{scheduledLabel}</span>
                    <span className="text-sm font-medium text-foreground">{scheduledDate}</span>
                </div>
            </div>

            {/* Columna Central - Contenido */}
            <div className="flex-1 px-6 py-5 flex flex-col justify-center gap-2">
                <BadgesRow />
                <div className={`truncate max-w-[380px] mt-1 ${hasTitle ? 'font-serif font-semibold text-base text-foreground' : 'text-sm italic text-muted-foreground'}`}>
                    {hasTitle ? message.title : contentFallback}
                </div>
                <ContactAlert />
            </div>

            {/* Columna Derecha - Acciones */}
            <div className="w-[100px] shrink-0 border-l border-border/50 py-5 px-4 flex flex-col justify-between items-end gap-3">
                <ActionButtonsDesktop />
            </div>
        </div>
    );

    // Mobile Layout Block
    const MobileLayout = (
        <div className="flex md:hidden flex-col border border-border/60 rounded-2xl bg-card shadow-sm w-full">
            {/* Bloque 1 - Header */}
            <div className="p-4 flex flex-col gap-2">
                <BadgesRow />
                <div className={`truncate max-w-[380px] mt-1 ${hasTitle ? 'font-serif font-semibold text-base text-foreground' : 'text-sm italic text-muted-foreground'}`}>
                    {hasTitle ? message.title : contentFallback}
                </div>
            </div>

            {/* Bloque 2 - Metadatos */}
            <div className="px-4 py-3 flex flex-col gap-2 border-t border-border/50 bg-secondary/20">
                <div className="flex items-baseline gap-2">
                    <span className="text-[0.62rem] font-medium uppercase tracking-widest text-muted-foreground min-w-[72px]">{labels?.to}</span>
                    <span className="text-sm font-medium text-foreground">{recipientName}</span>
                </div>
                <div className="flex items-baseline gap-2">
                    <span className="text-[0.62rem] font-medium uppercase tracking-widest text-muted-foreground min-w-[72px]">{labels?.created}</span>
                    <span className="text-sm font-medium text-foreground">{createdDate}</span>
                </div>
                <div className="flex items-baseline gap-2">
                    <span className="text-[0.62rem] font-medium uppercase tracking-widest text-muted-foreground min-w-[72px]">{scheduledLabel}</span>
                    <span className="text-sm font-medium text-foreground">{scheduledDate}</span>
                </div>
            </div>

            {/* Bloque 3 - Alerta (Condicional) */}
            {!hasTrusted && (
                <div className="px-4 py-3 bg-[#FFF8E6] flex flex-col gap-1 border-t border-border/50">
                    <div className="text-sm font-medium text-[#8A6A00] flex items-center gap-1">
                        ⚠️ {(dict.dashboard.messageCard as any).noContactAssigned}
                    </div>
                    <div className="text-xs text-[#8A6A00] opacity-80">
                        {(dict.dashboard.messageCard as any).noContactAssignedDesc}
                    </div>
                    <Link href={`/${locale}/messages/${message.id}/edit${isDelivered ? '?readonly=true' : ''}`} className="text-xs font-semibold text-primary underline cursor-pointer mt-1 w-fit">
                        {(dict.dashboard.messageCard as any).addContactLong}
                    </Link>
                </div>
            )}

            {/* Bloque 4 - Acciones */}
            <div className="px-4 py-3 flex justify-end gap-2 border-t border-border/50">
                <ActionButtonsMobile />
            </div>
        </div>
    );

    return (
        <>
            {DesktopLayout}
            {MobileLayout}
        </>
    );
}

