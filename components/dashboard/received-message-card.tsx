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
}

export function ReceivedMessageCard({ message, locale, dict }: ReceivedMessageCardProps) {
    const [mounted, setMounted] = useState(false);
    const [isOpen, setIsOpen] = useState(false);
    const [mediaUrls, setMediaUrls] = useState<{ audio: string | null; photos: string[] } | null>(null);
    const [loadingMedia, setLoadingMedia] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    const date = new Date(message.created_at).toLocaleDateString(locale === 'es' ? 'es-ES' : 'en-US', {
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
             // For download only, we use the download endpoint directly
             window.location.href = `/api/messages/download?token=${message.token}`;
             return;
        }

        setIsOpen(true);
        // Fetch media URLs if needed (audio/video or if it has photos)
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

    const t = dict.messageVisualizer;

    return (
        <>
            <div className="bg-card border border-border/60 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:border-border transition-all hover:shadow-sm">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full border border-border/40 bg-muted/30 flex items-center justify-center text-[#C4623A] text-lg font-serif italic shrink-0">
                        {senderName.charAt(0).toUpperCase()}
                    </div>
                    <div>
                        <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">
                            {(dict.dashboard as any).receivedMessages?.from?.replace('{name}', '') || 'DE: '}
                            <span className="text-foreground">{senderName}</span>
                        </p>
                        <div className="flex flex-wrap items-center gap-2 mt-0.5">
                            <h3 className="font-serif font-medium text-base text-foreground">
                                {message.title || typeLabel}
                            </h3>
                            <span 
                                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium whitespace-nowrap"
                                style={{ background: 'rgba(196,98,58,0.1)', color: '#C4623A' }}
                            >
                                {status === 'expired' && mounted ? null : <Icon size={10} />}
                                {typeLabel}
                            </span>
                        </div>
                        <p className="text-[10px] text-muted-foreground mt-1">
                            {(dict.dashboard as any).receivedMessages?.delivered || 'Delivered on'} {mounted ? date : '...'}
                        </p>
                    </div>
                </div>
                
                <div className="flex flex-col items-center gap-2 sm:w-auto w-full min-h-[52px] justify-center">
                    {mounted ? (
                        status === 'expired' ? (
                            <div className="text-center px-4 py-2 bg-muted/30 rounded-full border border-border/40">
                                <p className="text-xs font-medium text-muted-foreground">
                                    {dict.dashboard.receivedMessages?.expired}
                                </p>
                            </div>
                        ) : (
                            <>
                                <button 
                                    onClick={handleOpen}
                                    className="inline-flex items-center justify-center gap-1.5 px-5 py-2.5 text-sm font-medium text-white rounded-full whitespace-nowrap transition-all hover:opacity-90 active:scale-95 shadow-sm sm:w-auto w-full"
                                    style={{ background: '#C4623A' }}
                                >
                                    <Icon size={16} />
                                    {buttonText}
                                </button>
                                <p className={`text-[10px] font-medium text-center ${status === 'download_only' ? 'text-orange-600' : 'text-[#C4623A]/70'}`}>
                                    {status === 'available' 
                                        ? dict.dashboard.receivedMessages?.availableDays?.replace('{days}', daysRemaining.toString())
                                        : dict.dashboard.receivedMessages?.downloadOnly?.replace('{days}', daysRemaining.toString())
                                    }
                                </p>
                            </>
                        )
                    ) : (
                        <div className="h-10 w-32 bg-muted/20 animate-pulse rounded-full" />
                    )}
                </div>
            </div>

            {/* Modal de Visualización */}
            {isOpen && mounted && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-300">
                    <div 
                        className="absolute inset-0 bg-black/60 backdrop-blur-md" 
                        onClick={() => setIsOpen(false)}
                    />
                    
                    <div className="relative w-full max-w-2xl bg-[#FAF7F2] rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 slide-in-from-bottom-5 duration-500 max-h-[90vh] flex flex-col">
                        
                        {/* Header del Modal */}
                        <div className="flex items-center justify-between px-6 py-4 border-b border-black/[0.05] bg-white/50 backdrop-blur-sm sticky top-0 z-20">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xs font-serif italic">
                                    {senderName.charAt(0).toUpperCase()}
                                </div>
                                <div>
                                    <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold leading-none">
                                        {senderName}
                                    </p>
                                    <p className="text-[9px] text-muted-foreground/60 font-medium">
                                        {date}
                                    </p>
                                </div>
                            </div>
                            <button 
                                onClick={() => setIsOpen(false)}
                                className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-black/5 transition-colors text-muted-foreground"
                            >
                                <CloseIcon size={18} />
                            </button>
                        </div>

                        {/* Contenido del Modal */}
                        <div className="flex-1 overflow-y-auto custom-scrollbar">
                            {loadingMedia ? (
                                <div className="flex flex-col items-center justify-center py-24 gap-4">
                                    <div className="w-10 h-10 border-2 border-primary/20 border-t-primary rounded-full animate-spin" />
                                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-widest">
                                        {dict.common.loading || 'Cargando contenido...'}
                                    </p>
                                </div>
                            ) : (
                                <div className="p-0">
                                    {/* Video Player (Full Width at Top) */}
                                    {message.type === 'video' && mediaUrls?.audio && (
                                        <div className="w-full">
                                             <VideoPlayer src={mediaUrls.audio} overlayText={t?.videoOverlay || 'Toca para ver'} />
                                        </div>
                                    )}

                                    <div className="p-8 sm:p-12 space-y-10">
                                        {/* Photos Grid */}
                                        {mediaUrls?.photos && mediaUrls.photos.length > 0 && (
                                            <div className={`grid gap-4 ${mediaUrls.photos.length === 1 ? 'grid-cols-1' : 'grid-cols-2'}`}>
                                                {mediaUrls.photos.map((url: string, i: number) => (
                                                    <div key={i} className="aspect-square sm:aspect-video rounded-3xl overflow-hidden border border-black/[0.05] shadow-sm">
                                                        <img src={url} alt="" className="w-full h-full object-cover" />
                                                    </div>
                                                ))}
                                            </div>
                                        )}

                                        {/* Text Content */}
                                        {message.type === 'text' && (
                                            <div className="space-y-8 text-center relative max-w-lg mx-auto">
                                                <div className="text-primary/10 text-8xl font-serif absolute -top-8 left-1/2 -translate-x-1/2 z-0 leading-none select-none italic">“</div>
                                                <h3 className="font-serif font-medium text-2xl text-[#1A1510] relative z-10">
                                                    {message.title}
                                                </h3>
                                                <p className="font-lora italic text-lg sm:text-xl text-[#2A2520] leading-[1.8] whitespace-pre-wrap relative z-10 antialiased font-light">
                                                    {message.text_content}
                                                </p>
                                                <div className="flex flex-col items-center gap-4 relative z-10 pt-4">
                                                    <div className="h-px w-8 bg-primary/20"></div>
                                                    <div className="text-[11px] tracking-[0.2em] text-[#9C9088] uppercase font-bold">
                                                        {senderName}
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                        {/* Audio Content */}
                                        {message.type === 'audio' && mediaUrls?.audio && (
                                            <div className="space-y-10 py-4 max-w-md mx-auto">
                                                <div className="text-center space-y-2">
                                                    <p className="text-[10px] tracking-[0.2em] text-primary/80 font-bold uppercase">
                                                        {t?.voiceLabel || 'Mensaje de voz'}
                                                    </p>
                                                    <h3 className="font-serif font-medium text-2xl text-[#1A1510]">
                                                        {message.title}
                                                    </h3>
                                                </div>
                                                <div className="bg-white rounded-[2.5rem] p-8 border border-black/[0.03] shadow-[0_4px_20px_rgba(0,0,0,0.02)]">
                                                    <AudioPlayer src={mediaUrls.audio} />
                                                </div>
                                                <div className="flex flex-col items-center gap-4 pt-4">
                                                    <div className="h-px w-8 bg-primary/20"></div>
                                                    <div className="text-[11px] tracking-[0.2em] text-[#9C9088] uppercase font-bold text-center">
                                                        {t?.metaSaved || 'Guardado para este momento'}
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                        {/* Video Meta (only if video) */}
                                        {message.type === 'video' && (
                                             <div className="space-y-6 pt-4 text-center max-w-md mx-auto">
                                                <h3 className="font-serif font-medium text-2xl text-[#1A1510]">
                                                    {message.title}
                                                </h3>
                                                <div className="flex flex-col items-center gap-4">
                                                    <div className="h-px w-8 bg-primary/20"></div>
                                                    <div className="text-[11px] tracking-[0.2em] text-[#9C9088] uppercase font-bold">
                                                        {senderName}
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Modal Footer / CTA */}
                        {message.type === 'text' && (
                             <div className="px-8 py-6 bg-white/40 border-t border-black/[0.05] text-center">
                                <a 
                                    href={`/api/messages/download?token=${message.token}`}
                                    className="text-xs font-bold text-primary/80 hover:text-primary transition-colors tracking-widest uppercase flex items-center justify-center gap-2"
                                >
                                    <DownloadIcon size={14} />
                                    {dict.dashboard.receivedMessages?.downloadButton || 'Descargar mensaje'}
                                </a>
                             </div>
                        )}
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
