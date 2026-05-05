'use client';

import { useState, useEffect } from 'react';
import { AudioPlayer, VideoPlayer } from "@/components/messages/MediaPlayers";
import { getMessageAvailability } from "@/lib/message-availability";

// Inline SVG Icons (Lucide-style)
const FileTextIcon = ({ size = 16, className = "" }: { size?: number, className?: string }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
        <polyline points="14 2 14 8 20 8" />
        <line x1="16" y1="13" x2="8" y2="13" />
        <line x1="16" y1="17" x2="8" y2="17" />
        <line x1="10" y1="9" x2="8" y2="9" />
    </svg>
);

const MicIcon = ({ size = 16, className = "" }: { size?: number, className?: string }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
        <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
        <line x1="12" y1="19" x2="12" y2="22" />
    </svg>
);

const VideoIcon = ({ size = 16, className = "" }: { size?: number, className?: string }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <path d="m22 8-6 4 6 4V8Z" />
        <rect width="14" height="12" x="2" y="6" rx="2" ry="2" />
    </svg>
);

const DownloadIcon = ({ size = 16, className = "" }: { size?: number, className?: string }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
        <polyline points="7 10 12 15 17 10" />
        <line x1="12" y1="15" x2="12" y2="3" />
    </svg>
);

const CloseIcon = ({ size = 20, className = "" }: { size?: number, className?: string }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <line x1="18" y1="6" x2="6" y2="18" />
        <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
);

interface ReceivedMessageCardProps {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    message: any;
    locale: string;
    dict: any;
    autoOpen?: boolean;
}

export function ReceivedMessageCard({ message, locale, dict, autoOpen }: ReceivedMessageCardProps) {
    const [mounted, setMounted] = useState(false);
    const [isOpen, setIsOpen] = useState(false);
    const [mediaUrls, setMediaUrls] = useState<{ audio: string | null; photos: string[] } | null>(null);
    const [loadingMedia, setLoadingMedia] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    const date = new Date(message.delivered_at || message.created_at).toLocaleDateString(locale === 'es' ? 'es-ES' : 'en-US', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
    });

    const senderName = message.sender_name || (dict.dashboard as any).receivedMessages?.someoneSpecial || 'Someone special';

    // Availability logic
    const { status, daysRemaining } = getMessageAvailability(message.delivered_at || message.created_at);

    // Determine button text and icon based on message type
    let buttonText = message.type === 'audio'
        ? dict.dashboard.receivedMessages?.viewAudio || 'Escuchar mensaje'
        : message.type === 'video'
        ? dict.dashboard.receivedMessages?.viewVideo || 'Ver video'
        : dict.dashboard.receivedMessages?.view || 'Ver mensaje';

    let Icon = message.type === 'audio' ? MicIcon : message.type === 'video' ? VideoIcon : FileTextIcon;

    if (mounted && status === 'download_only') {
        buttonText = dict.dashboard.receivedMessages?.downloadButton || 'Descargar mensaje';
        Icon = DownloadIcon;
    }

    const typeLabel = message.type === 'audio' ? dict.dashboard.messageCard.type.audio : message.type === 'video' ? dict.dashboard.messageCard.type.video : dict.dashboard.messageCard.type.text;

    const handleOpen = async () => {
        if (status === 'download_only') {
             window.location.href = `/api/messages/download?token=${message.token}`;
             return;
        }

        setIsOpen(true);
        if (message.type !== 'text' || (message.photo_paths && message.photo_paths.length > 0)) {
            if (!mediaUrls) {
                setLoadingMedia(true);
                try {
                    const res = await fetch(`/api/messages/${message.id}/media`);
                    if (res.ok) {
                        const data = await res.json();
                        setMediaUrls(data);
                    }
                } catch (err) {
                    console.error("Error fetching media:", err);
                } finally {
                    setLoadingMedia(false);
                }
            }
        }
    };

    useEffect(() => {
        if (mounted && autoOpen && status !== 'expired' && !isOpen) {
            handleOpen();
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [mounted, autoOpen, status]);

    const t = dict.messageVisualizer;

    const borderColor = mounted
        ? (status === 'available' ? '#34d399' : status === 'download_only' ? '#f59e0b' : '#9ca3af')
        : '#e8e0d0';

    return (
        <>
            <div
                className="received-message-card relative w-full rounded-xl overflow-hidden transition-all duration-[250ms] ease-out hover:-translate-y-0.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.5),0_1px_2px_rgba(196,98,58,0.04),0_4px_12px_rgba(0,0,0,0.06)] hover:shadow-[0_2px_4px_rgba(196,98,58,0.08),0_8px_20px_rgba(0,0,0,0.10)]"
                style={{ background: '#FDFCFB', border: '1px solid #E8DDD0' }}
            >
                {/* Left accent bar (availability status color) */}
                <div className="absolute left-0 top-0 bottom-0 w-1" style={{ background: borderColor }} />

                {/* Content */}
                <div className="pl-4 pr-5 py-5 md:pr-6 md:py-6">
                    <div className="flex flex-col md:flex-row md:items-stretch gap-4 md:gap-6">

                        {/* Left column */}
                        <div className="flex-1 min-w-0 flex flex-col gap-2">

                            {/* Sender */}
                            <span
                                className="font-serif text-lg font-semibold leading-snug"
                                style={{ color: '#2C2C2C' }}
                            >
                                {senderName}
                            </span>

                            {/* Type badge */}
                            <div>
                                <span
                                    className="inline-flex items-center rounded-lg px-2.5 py-1 text-sm font-medium w-fit"
                                    style={{ border: '1px solid rgba(196,98,58,0.2)', background: 'rgba(196,98,58,0.08)', color: '#C4623A' }}
                                >
                                    {typeLabel}
                                </span>
                            </div>

                            {/* Title if present */}
                            {message.title && (
                                <p
                                    className="font-serif text-base italic font-normal leading-snug"
                                    style={{ color: '#4A4A4A', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' } as React.CSSProperties}
                                >
                                    {message.title}
                                </p>
                            )}

                            {/* Metadata */}
                            <div className="flex flex-col gap-1.5 mt-0.5">
                                <span className="text-sm" style={{ color: '#6B6B6B' }}>
                                    {(dict.dashboard as any).receivedMessages?.delivered || 'Delivered on'}:{' '}
                                    <span style={{ color: '#4A4A4A', fontWeight: 500 }}>
                                        {mounted ? date : '···'}
                                    </span>
                                </span>
                                {/* Availability badge */}
                                {mounted && (
                                    <div>
                                        {status === 'available' ? (
                                            <span
                                                className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-sm font-medium"
                                                style={{ background: 'rgba(52,211,153,0.12)', color: '#059669' }}
                                            >
                                                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                                                {(dict.dashboard as any).receivedMessages?.badgeAvailable}
                                            </span>
                                        ) : status === 'download_only' ? (
                                            <span
                                                className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-sm font-medium"
                                                style={{ background: 'rgba(245,158,11,0.12)', color: '#b45309' }}
                                            >
                                                <DownloadIcon size={10} />
                                                {(dict.dashboard as any).receivedMessages?.badgeDownloadOnly}
                                            </span>
                                        ) : (
                                            <span
                                                className="inline-flex items-center rounded-lg px-2.5 py-1 text-sm font-medium"
                                                style={{ background: '#f0ece4', color: '#9a8070' }}
                                            >
                                                {(dict.dashboard as any).receivedMessages?.badgeExpired}
                                            </span>
                                        )}
                                    </div>
                                )}
                                {/* Days remaining */}
                                {mounted && daysRemaining > 0 && (
                                    <span
                                        className="text-sm"
                                        style={{ color: status === 'download_only' ? '#b45309' : '#9a8070' }}
                                    >
                                        {status === 'available'
                                            ? (dict.dashboard as any).receivedMessages?.availableDays?.replace('{days}', daysRemaining.toString())
                                            : (dict.dashboard as any).receivedMessages?.downloadOnly?.replace('{days}', daysRemaining.toString())
                                        }
                                    </span>
                                )}
                            </div>

                            {/* CTA — mobile */}
                            <div className="md:hidden pt-1">
                                {mounted ? (
                                    status !== 'expired' && (
                                        <button
                                            onClick={handleOpen}
                                            className="w-full inline-flex items-center justify-center gap-2 rounded-lg px-6 py-2.5 text-sm font-medium transition-colors duration-200 hover:bg-[#B3571F]"
                                            style={{ background: '#C4623A', color: '#F5F0E8' }}
                                        >
                                            <Icon size={14} />
                                            {buttonText}
                                        </button>
                                    )
                                ) : (
                                    <div className="h-10 rounded-lg bg-[#f0ece4] animate-pulse" />
                                )}
                            </div>
                        </div>

                        {/* Right column — desktop CTA */}
                        <div className="hidden md:flex flex-col justify-end shrink-0">
                            {mounted ? (
                                status !== 'expired' && (
                                    <button
                                        onClick={handleOpen}
                                        className="inline-flex items-center justify-center gap-2 rounded-lg px-6 py-2.5 text-sm font-medium transition-colors duration-200 hover:bg-[#B3571F]"
                                        style={{ background: '#C4623A', color: '#F5F0E8' }}
                                    >
                                        <Icon size={14} />
                                        {buttonText}
                                    </button>
                                )
                            ) : (
                                <div className="h-10 w-32 rounded-lg bg-[#f0ece4] animate-pulse" />
                            )}
                        </div>

                    </div>
                </div>
            </div>

                {/* Modal de Visualización */}
            {isOpen && mounted && (
                <div className="fixed inset-0 z-[100]">
                    {/* Backdrop */}
                    <div
                        className="absolute inset-0 bg-[#ccc7be]/70 backdrop-blur-sm"
                        onClick={() => setIsOpen(false)}
                    />

                    {/* Scroll container */}
                    <div className="absolute inset-0 overflow-y-auto modal-scrollbar flex items-start sm:items-center justify-center p-4 py-10">
                        {/* Card */}
                        <div
                            className="relative w-full max-w-md bg-[#f5f0e8] rounded-3xl overflow-hidden shadow-2xl"
                            onClick={(e) => e.stopPropagation()}
                        >
                            {/* Logo */}
                            <div className="text-center pt-6 pb-5 px-6">
                                <div className="font-playfair italic text-xl text-[#C4623A] leading-none">
                                    Carry my Words
                                </div>
                            </div>

                            {/* Divider */}
                            <div className="h-px bg-[#ddd5c8]" />

                            {/* Header */}
                            <div className="px-5 py-4">
                                <div className="flex items-center gap-3">
                                    {/* Avatar */}
                                    <div
                                        className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-semibold shrink-0"
                                        style={{ background: '#e8ddd0', color: '#9a7060' }}
                                    >
                                        {senderName.charAt(0).toUpperCase()}
                                    </div>
                                    {/* Sender info */}
                                    <div className="flex-1 min-w-0">
                                        <div
                                            className="text-[9px] uppercase tracking-[0.15em] font-semibold"
                                            style={{ color: '#C4623A' }}
                                        >
                                            {t?.fromLabel}
                                        </div>
                                        <div className="text-sm font-semibold text-[#2C2018] mt-0.5 leading-snug">
                                            {senderName}
                                        </div>
                                    </div>
                                    {/* Close */}
                                    <button
                                        onClick={() => setIsOpen(false)}
                                        className="w-7 h-7 flex items-center justify-center rounded-lg border border-[#d9d0c4] text-[#9a8070] hover:bg-[#e8e0d0] transition-colors shrink-0"
                                    >
                                        <CloseIcon size={14} />
                                    </button>
                                </div>

                                {/* Title + date row */}
                                <div className="flex items-baseline justify-between mt-4 pt-3 border-t border-[#e4ddd4]">
                                    {message.title && (
                                        <span className="text-sm text-[#4a4040] flex-1 min-w-0 truncate pr-4">
                                            {message.title}
                                        </span>
                                    )}
                                    <span className={`text-sm text-[#9a8070] shrink-0 ${!message.title ? 'ml-auto' : ''}`}>
                                        {date}
                                    </span>
                                </div>
                            </div>

                            {/* Content */}
                            <div className="px-5 pb-6 space-y-3">
                                {loadingMedia ? (
                                    <div className="flex items-center justify-center py-8">
                                        <div className="w-6 h-6 border-2 border-[#C4623A]/20 border-t-[#C4623A] rounded-full animate-spin" />
                                    </div>
                                ) : (
                                    <>
                                        {/* Photos — only rendered when present, no placeholder */}
                                        {mediaUrls?.photos && mediaUrls.photos.length > 0 && (
                                            <div className={`grid gap-2 ${mediaUrls.photos.length === 1 ? 'grid-cols-1' : 'grid-cols-2'}`}>
                                                {mediaUrls.photos.map((url: string, i: number) => (
                                                    <div
                                                        key={i}
                                                        className="rounded-xl overflow-hidden w-full"
                                                        style={{ height: '160px' }}
                                                    >
                                                        <img src={url} alt="" className="w-full h-full object-cover" />
                                                    </div>
                                                ))}
                                            </div>
                                        )}

                                        {/* Video */}
                                        {message.type === 'video' && mediaUrls?.audio && (
                                            <div className="rounded-xl overflow-hidden border border-black/[0.06] bg-black">
                                                <VideoPlayer src={mediaUrls.audio} overlayText={t?.videoOverlay || 'Toca para ver'} />
                                            </div>
                                        )}

                                        {/* Audio */}
                                        {message.type === 'audio' && mediaUrls?.audio && (
                                            <div
                                                className="rounded-2xl border border-[#e4ddd4] p-4 space-y-3"
                                                style={{ background: 'rgba(255,255,255,0.75)' }}
                                            >
                                                <div
                                                    className="text-[9px] uppercase tracking-[0.18em] font-semibold"
                                                    style={{ color: 'rgba(196,98,58,0.8)' }}
                                                >
                                                    {t?.voiceLabel || 'Mensaje de voz'}
                                                </div>
                                                <AudioPlayer src={mediaUrls.audio} />
                                            </div>
                                        )}

                                        {/* Text */}
                                        {message.type === 'text' && (
                                            <div
                                                className="rounded-2xl border border-[#e4ddd4] p-5"
                                                style={{ background: 'rgba(255,255,255,0.75)' }}
                                            >
                                                <p className="font-lora italic text-base text-[#2A2520] leading-[1.8] whitespace-pre-wrap font-light">
                                                    {message.text_content}
                                                </p>
                                            </div>
                                        )}

                                        {/* Footer */}
                                        <div className="flex items-center justify-between pt-2">
                                            <div className="flex items-center gap-2">
                                                <div className="h-px w-4 bg-[#C4623A]/40" />
                                                <span className="text-xs italic text-[#9a8070]">
                                                    {message.type === 'audio'
                                                        ? (t?.metaSaved || 'Guardado para este momento')
                                                        : senderName
                                                    }
                                                </span>
                                            </div>
                                            <a
                                                href={`/api/messages/download?token=${message.token}`}
                                                className="px-4 py-1.5 rounded-full border border-[#2C2018]/60 text-[#2C2018] text-xs font-medium hover:bg-[#2C2018]/5 transition-colors"
                                            >
                                                {dict.dashboard.receivedMessages?.downloadButton || 'Descargar mensaje'}
                                            </a>
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}

<style jsx global>{`
                .modal-scrollbar::-webkit-scrollbar { width: 6px; }
                .modal-scrollbar::-webkit-scrollbar-track { background: transparent; }
                .modal-scrollbar::-webkit-scrollbar-thumb { background: rgba(0,0,0,0.08); border-radius: 10px; }
            `}</style>
        </>
    );
}
