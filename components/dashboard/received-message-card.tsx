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
                <div className="fixed inset-0 z-[100] flex flex-col animate-in fade-in duration-300 overflow-y-auto custom-scrollbar bg-[#FDFCFB]">
                    {/* Atmospheric background on desktop if image exists */}
                    {mediaUrls?.photos && mediaUrls.photos.length > 0 && (
                        <div className="hidden md:block fixed inset-0 z-0 pointer-events-none opacity-30 blur-[80px]"
                             style={{
                                 backgroundImage: `url(${mediaUrls.photos[0]})`,
                                 backgroundSize: 'cover',
                                 backgroundPosition: 'center',
                             }}
                        />
                    )}
                    
                    {/* Overlay to ensure warm feeling over the blur */}
                    <div className="fixed inset-0 bg-[#FDFCFB]/80 md:bg-[#FAF7F2]/80 z-0 pointer-events-none" />

                    <div className="relative z-10 flex flex-col min-h-screen">
                        {/* Header Area (Logo & Close Button) */}
                        <div className="flex items-center justify-between px-6 py-6 md:px-12 md:py-8 w-full max-w-5xl mx-auto">
                            <div className="font-playfair italic text-xl text-[#C4623A] tracking-tight">
                                Carry my Words
                            </div>
                            <button
                                onClick={() => setIsOpen(false)}
                                className="w-10 h-10 flex items-center justify-center rounded-full bg-black/5 hover:bg-black/10 transition-colors"
                                style={{ color: '#9a8070' }}
                            >
                                <CloseIcon size={20} />
                            </button>
                        </div>

                        {/* Main Content */}
                        <div className="flex-1 flex flex-col items-center px-4 pt-4 pb-12 w-full max-w-2xl mx-auto mt-4 sm:mt-10">
                            
                            {/* Message Header */}
                            <div className="text-center mb-10 space-y-3">
                                <p style={{ fontSize: '11px', letterSpacing: '0.15em', textTransform: 'uppercase', color: '#9a8070', fontWeight: 600 }}>
                                    {t?.fromLabel || 'De'} {senderName}
                                </p>
                                {message.title && (
                                    <h1 style={{ fontFamily: 'var(--font-playfair)', fontSize: '32px', color: '#2A2018', fontWeight: 500, fontStyle: 'italic', lineHeight: 1.2 }}>
                                        {message.title}
                                    </h1>
                                )}
                                <p style={{ fontSize: '12px', color: '#9a8070', opacity: 0.8, fontWeight: 400 }}>
                                    {date}
                                </p>
                            </div>

                            {loadingMedia ? (
                                <div className="flex flex-col items-center justify-center py-24 gap-4">
                                    <div className="w-10 h-10 border-2 border-[#C4623A]/20 border-t-[#C4623A] rounded-full animate-spin" />
                                    <p className="text-xs font-medium text-[#9a8070] uppercase tracking-widest">
                                        {dict.common?.loading || 'Cargando contenido...'}
                                    </p>
                                </div>
                            ) : (
                                <div className="w-full space-y-6">
                                    {/* Conditional Image Block */}
                                    {mediaUrls?.photos && mediaUrls.photos.length > 0 && (
                                        <div className="w-full h-32 sm:h-40 rounded-2xl sm:rounded-[2rem] overflow-hidden shadow-sm border border-black/[0.04]">
                                            <img 
                                                src={mediaUrls.photos[0]} 
                                                alt="" 
                                                className="w-full h-full object-cover" 
                                            />
                                        </div>
                                    )}

                                    {/* Video Player */}
                                    {message.type === 'video' && mediaUrls?.audio && (
                                        <div className="w-full rounded-2xl sm:rounded-[2rem] overflow-hidden shadow-sm border border-black/[0.04] bg-black">
                                             <VideoPlayer src={mediaUrls.audio} overlayText={t?.videoOverlay || 'Toca para ver'} />
                                        </div>
                                    )}

                                    {/* Audio Player Unit */}
                                    {message.type === 'audio' && mediaUrls?.audio && (
                                        <div className="bg-white rounded-2xl sm:rounded-[2rem] p-6 sm:p-8 shadow-sm border border-black/[0.04] space-y-5">
                                            <p className="text-center text-[10px] tracking-[0.2em] text-[#C4623A]/80 font-bold uppercase">
                                                {t?.voiceLabel || 'Mensaje de voz'}
                                            </p>
                                            <div className="max-w-xs mx-auto w-full">
                                                <AudioPlayer src={mediaUrls.audio} />
                                            </div>
                                        </div>
                                    )}

                                    {/* Text Content */}
                                    {message.type === 'text' && (
                                        <div className="bg-white rounded-2xl sm:rounded-[2rem] p-8 sm:p-12 shadow-sm border border-black/[0.04] relative mt-8">
                                            <div className="text-[#C4623A]/10 text-6xl font-serif absolute top-4 left-1/2 -translate-x-1/2 leading-none select-none italic">“</div>
                                            <p className="font-lora italic text-lg sm:text-xl text-[#2A2520] leading-[1.8] whitespace-pre-wrap text-center relative z-10 font-light">
                                                {message.text_content}
                                            </p>
                                        </div>
                                    )}

                                    {/* Footer Actions */}
                                    <div className="pt-10 flex flex-col items-center gap-6">
                                        <div className="flex flex-col items-center gap-3">
                                            <div className="h-px w-6 bg-[#C4623A]/20"></div>
                                            <div className="text-[10px] tracking-[0.2em] text-[#9a8070] uppercase font-bold text-center">
                                                {t?.metaSaved || 'Guardado para este momento'}
                                            </div>
                                        </div>
                                        
                                        <a 
                                            href={`/api/messages/download?token=${message.token}`}
                                            className="inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-full border border-[#C4623A]/30 text-[#C4623A] text-xs font-semibold uppercase tracking-wider hover:bg-[#C4623A]/5 transition-colors"
                                        >
                                            <DownloadIcon size={14} />
                                            {dict.dashboard?.receivedMessages?.downloadButton || 'Descargar mensaje'}
                                        </a>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

<style jsx global>{`
                .custom-scrollbar::-webkit-scrollbar {
                    width: 6px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: transparent;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: rgba(0,0,0,0.05);
                    border-radius: 10px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                    background: rgba(0,0,0,0.1);
                }
            `}</style>
        </>
    );
}
