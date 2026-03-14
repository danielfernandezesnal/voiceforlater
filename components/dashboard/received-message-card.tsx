'use client';

import type { MessageWithRecipient } from "./dashboard-message-list";
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

interface ReceivedMessageCardProps {
    message: MessageWithRecipient & { delivered_at?: string };
    locale: string;
    dict: any;
}

export function ReceivedMessageCard({ message, locale, dict }: ReceivedMessageCardProps) {
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

    if (status === 'download_only') {
        buttonText = dict.dashboard.receivedMessages?.downloadButton || 'Descargar mensaje';
        Icon = DownloadIcon;
    }

    const typeLabel = message.type === 'audio' ? dict.dashboard.messageCard.type.audio : message.type === 'video' ? dict.dashboard.messageCard.type.video : dict.dashboard.messageCard.type.text;

    return (
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
                            {status === 'expired' ? null : <Icon size={10} />}
                            {typeLabel}
                        </span>
                    </div>
                    <p className="text-[10px] text-muted-foreground mt-1">
                        {(dict.dashboard as any).receivedMessages?.delivered || 'Delivered on'} {date}
                    </p>
                </div>
            </div>
            
            <div className="flex flex-col items-center gap-2 sm:w-auto w-full">
                {status === 'expired' ? (
                    <div className="text-center px-4 py-2 bg-muted/30 rounded-full border border-border/40">
                        <p className="text-xs font-medium text-muted-foreground">
                            {dict.dashboard.receivedMessages?.expired}
                        </p>
                    </div>
                ) : (
                    <>
                        <a 
                            href={status === 'available' ? `/${locale}/mensaje/${message.token}` : `/api/messages/download?token=${message.token}`}
                            target={status === 'available' ? "_blank" : "_self"}
                            rel="noopener noreferrer"
                            className="inline-flex items-center justify-center gap-1.5 px-5 py-2.5 text-sm font-medium text-white rounded-full whitespace-nowrap transition-all hover:opacity-90 active:scale-95 shadow-sm sm:w-auto w-full"
                            style={{ background: '#C4623A' }}
                        >
                            <Icon size={16} />
                            {buttonText}
                        </a>
                        <p className={`text-[10px] font-medium text-center ${status === 'download_only' ? 'text-orange-600' : 'text-[#C4623A]/70'}`}>
                            {status === 'available' 
                                ? dict.dashboard.receivedMessages?.availableDays?.replace('{days}', daysRemaining.toString())
                                : dict.dashboard.receivedMessages?.downloadOnly?.replace('{days}', daysRemaining.toString())
                            }
                        </p>
                    </>
                )}
            </div>
        </div>
    );
}
