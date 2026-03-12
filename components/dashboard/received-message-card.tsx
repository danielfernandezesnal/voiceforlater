'use client';

import type { MessageWithRecipient } from "./dashboard-message-list";

interface ReceivedMessageCardProps {
    message: MessageWithRecipient;
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

    return (
        <div className="bg-card border border-border/60 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:border-border transition-colors">
            <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary text-sm font-bold">
                    {senderName.charAt(0).toUpperCase()}
                </div>
                <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">
                        {(dict.dashboard as any).receivedMessages?.from?.replace('{name}', '') || 'From: '}
                        <span className="text-foreground">{senderName}</span>
                    </p>
                    <h3 className="font-serif font-medium text-base text-foreground mt-0.5">
                        {message.title || (message.type === 'audio' ? dict.dashboard.messageCard.type.audio : message.type === 'video' ? dict.dashboard.messageCard.type.video : dict.dashboard.messageCard.type.text)}
                    </h3>
                    <p className="text-[10px] text-muted-foreground mt-1">
                        {(dict.dashboard as any).receivedMessages?.delivered || 'Delivered on'} {date}
                    </p>
                </div>
            </div>
            
            {message.token && (
                <a 
                    href={`/${locale}/mensaje/${message.token}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center px-4 py-2 text-xs font-semibold bg-primary/10 text-primary rounded-lg hover:bg-primary/20 transition-colors whitespace-nowrap"
                >
                    {(dict.dashboard as any).receivedMessages?.view || 'View Message'}
                </a>
            )}
        </div>
    );
}
