'use client';

import { useState, useEffect, useRef } from 'react';
import { VideoPlayer } from "@/components/messages/MediaPlayers";
import { getMessageAvailability } from "@/lib/message-availability";

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
    const [audioPlaying, setAudioPlaying] = useState(false);
    const [audioCurrent, setAudioCurrent] = useState(0);
    const [audioDuration, setAudioDuration] = useState(0);
    const audioPlayerRef = useRef<HTMLAudioElement | null>(null);

    const toggleAudio = () => {
        if (!audioPlayerRef.current) return;
        if (audioPlaying) { audioPlayerRef.current.pause(); } else { audioPlayerRef.current.play(); }
        setAudioPlaying(!audioPlaying);
    };

    const fmtTime = (s: number) => `${Math.floor(s / 60)}:${Math.floor(s % 60).toString().padStart(2, '0')}`;

    useEffect(() => { setMounted(true); }, []);

    useEffect(() => {
        if (!isOpen) {
            if (audioPlayerRef.current) {
                audioPlayerRef.current.pause();
                audioPlayerRef.current.currentTime = 0;
            }
            setAudioPlaying(false);
            setAudioCurrent(0);
        }
    }, [isOpen]);

    const date = new Date(message.delivered_at || message.created_at).toLocaleDateString(locale === 'es' ? 'es-ES' : 'en-US', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
    });

    const senderName = message.sender_name || (dict.dashboard as any).receivedMessages?.someoneSpecial || 'Someone special';

    const { status, daysRemaining } = getMessageAvailability(message.delivered_at || message.created_at);

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

    const audioProgress = audioDuration > 0 ? (audioCurrent / audioDuration) * 100 : 0;

    return (
        <>
            {/* ── List card ────────────────────────────────────────────────── */}
            <div
                className="received-message-card relative w-full rounded-xl overflow-hidden transition-all duration-[250ms] ease-out hover:-translate-y-0.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.5),0_1px_2px_rgba(196,98,58,0.04),0_4px_12px_rgba(0,0,0,0.06)] hover:shadow-[0_2px_4px_rgba(196,98,58,0.08),0_8px_20px_rgba(0,0,0,0.10)]"
                style={{ background: '#FDFCFB', border: '1px solid #E8DDD0' }}
            >
                <div className="absolute left-0 top-0 bottom-0 w-1" style={{ background: borderColor }} />
                <div className="pl-4 pr-5 py-5 md:pr-6 md:py-6">
                    <div className="flex flex-col md:flex-row md:items-stretch gap-4 md:gap-6">
                        <div className="flex-1 min-w-0 flex flex-col gap-2">
                            <span className="font-serif text-lg font-semibold leading-snug" style={{ color: '#2C2C2C' }}>
                                {senderName}
                            </span>
                            <div>
                                <span
                                    className="inline-flex items-center rounded-lg px-2.5 py-1 text-sm font-medium w-fit"
                                    style={{ border: '1px solid rgba(196,98,58,0.2)', background: 'rgba(196,98,58,0.08)', color: '#C4623A' }}
                                >
                                    {typeLabel}
                                </span>
                            </div>
                            {message.title && (
                                <p
                                    className="font-serif text-base italic font-normal leading-snug"
                                    style={{ color: '#4A4A4A', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' } as React.CSSProperties}
                                >
                                    {message.title}
                                </p>
                            )}
                            <div className="flex flex-col gap-1.5 mt-0.5">
                                <span className="text-sm" style={{ color: '#6B6B6B' }}>
                                    {(dict.dashboard as any).receivedMessages?.delivered || 'Delivered on'}:{' '}
                                    <span style={{ color: '#4A4A4A', fontWeight: 500 }}>{mounted ? date : '···'}</span>
                                </span>
                                {mounted && (
                                    <div>
                                        {status === 'available' ? (
                                            <span className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-sm font-medium" style={{ background: 'rgba(52,211,153,0.12)', color: '#059669' }}>
                                                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                                                {(dict.dashboard as any).receivedMessages?.badgeAvailable}
                                            </span>
                                        ) : status === 'download_only' ? (
                                            <span className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-sm font-medium" style={{ background: 'rgba(245,158,11,0.12)', color: '#b45309' }}>
                                                <DownloadIcon size={10} />
                                                {(dict.dashboard as any).receivedMessages?.badgeDownloadOnly}
                                            </span>
                                        ) : (
                                            <span className="inline-flex items-center rounded-lg px-2.5 py-1 text-sm font-medium" style={{ background: '#f0ece4', color: '#9a8070' }}>
                                                {(dict.dashboard as any).receivedMessages?.badgeExpired}
                                            </span>
                                        )}
                                    </div>
                                )}
                                {mounted && daysRemaining > 0 && (
                                    <span className="text-sm" style={{ color: status === 'download_only' ? '#b45309' : '#9a8070' }}>
                                        {status === 'available'
                                            ? (dict.dashboard as any).receivedMessages?.availableDays?.replace('{days}', daysRemaining.toString())
                                            : (dict.dashboard as any).receivedMessages?.downloadOnly?.replace('{days}', daysRemaining.toString())
                                        }
                                    </span>
                                )}
                            </div>
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

            {/* ── Modal ────────────────────────────────────────────────────── */}
            {isOpen && mounted && (
                <div className="fixed inset-0 z-[100]">

                    {/* Desktop background: blurred photo or flat cream */}
                    <div className="absolute inset-0 hidden md:block" onClick={() => setIsOpen(false)}>
                        {mediaUrls?.photos?.[0] ? (
                            <>
                                <div style={{
                                    position: 'absolute', inset: 0,
                                    backgroundImage: `url(${mediaUrls.photos[0]})`,
                                    backgroundSize: 'cover',
                                    backgroundPosition: 'center',
                                    filter: 'blur(14px)',
                                    transform: 'scale(1.05)',
                                }} />
                                <div style={{ position: 'absolute', inset: 0, background: 'rgba(249,245,240,0.80)' }} />
                            </>
                        ) : (
                            <div style={{ position: 'absolute', inset: 0, background: '#EFE9E0' }} />
                        )}
                    </div>

                    {/* Mobile backdrop */}
                    <div
                        className="absolute inset-0 md:hidden"
                        style={{ background: 'rgba(43,37,33,0.40)' }}
                        onClick={() => setIsOpen(false)}
                    />

                    {/* Scroll + center */}
                    <div className="absolute inset-0 overflow-y-auto ag-scrollbar flex items-start md:items-center justify-center md:p-5 md:py-16">

                        {/* Content */}
                        <div
                            className="relative z-10 ag-msg-card"
                            style={{ maxWidth: '1000px', width: '90%' }}
                            onClick={(e) => e.stopPropagation()}
                        >
                            {/* Logo */}
                            <div style={{ textAlign: 'center', marginBottom: '14px' }}>
                                <div style={{ fontFamily: 'Georgia, serif', fontStyle: 'italic', fontSize: '15px', color: '#C4623A' }}>
                                    Carry my Words
                                </div>
                                <div style={{ fontSize: '9px', fontWeight: 500, letterSpacing: '0.13em', textTransform: 'uppercase', color: 'rgba(196,98,58,0.6)', marginTop: '4px' }}>
                                    {t?.cta?.subtext?.split(' — ')[1] || 'Mensajes que viajan en el tiempo'}
                                </div>
                            </div>

                            {/* Divider */}
                            <div style={{ height: '0.5px', background: 'rgba(43,37,33,0.09)', marginBottom: '14px' }} />

                            {/* Header remitente */}
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                                <div style={{
                                    width: '35px', height: '35px', borderRadius: '50%',
                                    background: 'rgba(196,98,58,0.10)', border: '0.5px solid rgba(196,98,58,0.22)',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    fontSize: '13px', color: '#C4623A', fontWeight: 500, flexShrink: 0,
                                }}>
                                    {senderName.charAt(0).toUpperCase()}
                                </div>
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <div style={{ fontSize: '9px', textTransform: 'uppercase', letterSpacing: '0.10em', color: '#9A9088' }}>
                                        {t?.fromLabel}
                                    </div>
                                    <div style={{ fontSize: '15px', fontWeight: 500, color: '#2B2521', marginTop: '2px' }}>
                                        {senderName}
                                    </div>
                                </div>
                                <button
                                    onClick={() => setIsOpen(false)}
                                    style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px', color: '#9A9088', opacity: 0.5, flexShrink: 0 }}
                                >
                                    <CloseIcon size={18} />
                                </button>
                            </div>

                            {/* Meta line: subject + date */}
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                                <span style={{ fontSize: '11px', color: '#9A9088', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>
                                    {message.title}
                                </span>
                                <span style={{ fontSize: '11px', color: '#9A9088', flexShrink: 0, marginLeft: '8px' }}>
                                    {date}
                                </span>
                            </div>

                            {/* Divider */}
                            <div style={{ height: '0.5px', background: 'rgba(43,37,33,0.09)', marginBottom: '14px' }} />

                            {/* Loading */}
                            {loadingMedia && (
                                <div style={{ display: 'flex', justifyContent: 'center', padding: '28px 0' }}>
                                    <div className="w-6 h-6 border-2 border-[#C4623A]/20 border-t-[#C4623A] rounded-full animate-spin" />
                                </div>
                            )}

                            {!loadingMedia && (
                                <>
                                    {/* Image block — only when photos exist, no placeholder */}
                                    {mediaUrls?.photos && mediaUrls.photos.length > 0 && (
                                        <div style={{ marginBottom: '10px' }}>
                                            {mediaUrls.photos.length === 1 ? (
                                                <div style={{ height: '130px', borderRadius: '10px', overflow: 'hidden', width: '100%' }}>
                                                    <img src={mediaUrls.photos[0]} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                                </div>
                                            ) : (
                                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
                                                    {mediaUrls.photos.map((url: string, i: number) => (
                                                        <div key={i} style={{ height: '130px', borderRadius: '10px', overflow: 'hidden' }}>
                                                            <img src={url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {/* Video */}
                                    {message.type === 'video' && mediaUrls?.audio && (
                                        <div style={{ borderRadius: '10px', overflow: 'hidden', marginBottom: '10px' }}>
                                            <VideoPlayer src={mediaUrls.audio} overlayText={t?.videoOverlay || 'Toca para ver'} />
                                        </div>
                                    )}

                                    {/* Audio player */}
                                    {message.type === 'audio' && mediaUrls?.audio && (
                                        <div style={{
                                            background: 'rgba(249,245,240,0.72)',
                                            border: '0.5px solid rgba(43,37,33,0.10)',
                                            borderRadius: '14px',
                                            padding: '0.9rem 1.1rem',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '12px',
                                            marginBottom: '10px',
                                        }}>
                                            <audio
                                                ref={audioPlayerRef}
                                                src={mediaUrls.audio}
                                                onTimeUpdate={() => setAudioCurrent(audioPlayerRef.current?.currentTime || 0)}
                                                onLoadedMetadata={() => setAudioDuration(audioPlayerRef.current?.duration || 0)}
                                                onEnded={() => { setAudioPlaying(false); setAudioCurrent(0); }}
                                            />
                                            {/* Play button — circle */}
                                            <button
                                                onClick={toggleAudio}
                                                style={{
                                                    width: '44px', height: '44px', borderRadius: '50%',
                                                    background: '#C4623A', border: 'none', cursor: 'pointer',
                                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                    flexShrink: 0,
                                                }}
                                            >
                                                {audioPlaying ? (
                                                    <svg width="16" height="16" fill="#F9F5F0" viewBox="0 0 24 24"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" /></svg>
                                                ) : (
                                                    <svg width="16" height="16" fill="#F9F5F0" viewBox="0 0 24 24" style={{ marginLeft: '2px' }}><path d="M8 5v14l11-7z" /></svg>
                                                )}
                                            </button>

                                            {/* Track */}
                                            <div style={{ flex: 1, minWidth: 0 }}>
                                                <div style={{ fontSize: '9px', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.09em', color: '#C4623A', marginBottom: '8px' }}>
                                                    {t?.voiceLabel || 'Mensaje de voz'}
                                                </div>
                                                <div style={{ position: 'relative', height: '3px', background: 'rgba(43,37,33,0.15)', borderRadius: '2px', marginBottom: '6px' }}>
                                                    <div style={{
                                                        position: 'absolute', top: 0, left: 0, bottom: 0,
                                                        background: '#C4623A', borderRadius: '2px',
                                                        width: audioProgress + '%',
                                                    }} />
                                                    <div style={{
                                                        position: 'absolute', top: '50%',
                                                        width: '11px', height: '11px', borderRadius: '50%',
                                                        background: '#C4623A', border: '2px solid #F9F5F0',
                                                        left: audioProgress + '%',
                                                        transform: 'translate(-50%, -50%)',
                                                    }} />
                                                </div>
                                                <div className="tabular-nums flex justify-between" style={{ fontSize: '10px', color: '#9A9088' }}>
                                                    <span>{fmtTime(audioCurrent)}</span>
                                                    <span>{fmtTime(audioDuration)}</span>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* Text */}
                                    {message.type === 'text' && (
                                        <div style={{
                                            background: 'rgba(249,245,240,0.72)',
                                            border: '0.5px solid rgba(43,37,33,0.10)',
                                            borderRadius: '14px',
                                            padding: '1.1rem',
                                            marginBottom: '10px',
                                        }}>
                                            <p style={{ fontSize: '15px', color: '#2B2521', lineHeight: 1.75, whiteSpace: 'pre-wrap', margin: 0, fontStyle: 'italic' }}>
                                                {message.text_content}
                                            </p>
                                        </div>
                                    )}

                                    {/* Footer */}
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '4px' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            <div style={{ width: '18px', height: '0.5px', background: 'rgba(196,98,58,0.4)', flexShrink: 0 }} />
                                            <span style={{ fontSize: '11px', fontStyle: 'italic', color: '#9A9088' }}>
                                                {message.type === 'audio' ? (t?.metaSaved || 'Guardado para este momento') : senderName}
                                            </span>
                                        </div>
                                        <a
                                            href={`/api/messages/download?token=${message.token}`}
                                            style={{
                                                borderRadius: '20px',
                                                border: '0.5px solid rgba(43,37,33,0.18)',
                                                background: 'rgba(249,245,240,0.6)',
                                                color: '#4A4643',
                                                fontSize: '11px',
                                                padding: '5px 14px',
                                                textDecoration: 'none',
                                                flexShrink: 0,
                                                marginLeft: '8px',
                                            }}
                                        >
                                            {dict.dashboard.receivedMessages?.downloadButton || 'Descargar mensaje'}
                                        </a>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            )}

<style jsx global>{`
    .ag-scrollbar::-webkit-scrollbar { width: 5px; }
    .ag-scrollbar::-webkit-scrollbar-track { background: transparent; }
    .ag-scrollbar::-webkit-scrollbar-thumb { background: rgba(43,37,33,0.10); border-radius: 10px; }

    .ag-msg-card {
        padding: 3.5rem 3rem;
    }
    @media (max-width: 767px) {
        .ag-msg-card {
            max-width: 100% !important;
            width: 100% !important;
            background: #F9F5F0;
            border: none;
            border-radius: 0;
            padding: 1.5rem 1.25rem;
            min-height: 100vh;
        }
    }
`}</style>
        </>
    );
}
