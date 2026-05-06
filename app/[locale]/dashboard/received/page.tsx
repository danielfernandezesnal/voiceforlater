'use client';

import { useState, useEffect, use } from 'react';
import { createClient } from "@/lib/supabase/client";
import { getDictionary, type Locale, isValidLocale, defaultLocale } from "@/lib/i18n";
import { ReceivedMessageList } from "@/components/dashboard/received-message-list";

interface PageProps {
    params: Promise<{ locale: string }>;
    searchParams: Promise<{ open?: string }>;
}

export default function ReceivedMessagesPage({ params, searchParams }: PageProps) {
    const { locale: localeParam } = use(params);
    const search = use(searchParams);
    const openToken = search?.open;
    const locale: Locale = isValidLocale(localeParam) ? localeParam : defaultLocale;
    
    const [mounted, setMounted] = useState(false);
    const [dict, setDict] = useState<any>(null);
    const [receivedMessages, setReceivedMessages] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        setMounted(true);

        const fetchData = async () => {
            try {
                // Fetch dictionary on client
                const d = await getDictionary(locale);
                setDict(d);

                // Fetch messages on client
                const supabase = createClient();
                const { data: { user } } = await supabase.auth.getUser();

                if (user) {
                    const { data: receivedData } = await supabase
                        .from('messages')
                        .select(`
                            id,
                            type,
                            status,
                            title,
                            text_content,
                            audio_path,
                            photo_paths,
                            created_at,
                            delivery_claimed_at,
                            owner_id,
                            profiles (
                                first_name,
                                last_name
                            ),
                            delivery_tokens!left (
                                token
                            ),
                            recipients!inner (
                                email
                            )
                        `)
                        .eq('status', 'delivered')
                        .eq('recipients.email', user.email)
                        .order('created_at', { ascending: false });

                    const msgs = (receivedData || []).map((msg: any) => ({
                        ...msg,
                        sender_name: `${msg.profiles?.first_name || ''} ${msg.profiles?.last_name || ''}`.trim() || null,
                        token: msg.delivery_tokens?.[0]?.token || null,
                        delivered_at: msg.delivery_claimed_at || msg.created_at
                    }));
                    setReceivedMessages(msgs);
                }
            } catch (err) {
                console.error("Error loading received messages:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [locale]);

    // Render minimal skeleton during hydration or data loading (no bands)
    if (!mounted || loading || !dict) {
        return (
            <div className="max-w-5xl mx-auto py-8 animate-pulse space-y-3">
                <div className="h-10 w-64 bg-muted/60 rounded-xl" />
                <div className="h-4 w-32 bg-muted/40 rounded-lg" />
            </div>
        );
    }

    const title = dict.dashboard.receivedMessages?.title || 'Received Messages';
    const emptyStateText = dict.dashboard.receivedMessages?.empty || "You haven't received any messages yet.";

    return (
        <div className="animate-in fade-in duration-500 slide-in-from-bottom-2">
            <div className="mb-8">
                <h1 className="font-serif font-semibold text-[1.9rem] leading-tight text-foreground">
                    {title}
                </h1>
                <p className="text-sm text-muted-foreground mt-1.5">
                    {receivedMessages.length} {receivedMessages.length === 1
                        ? dict.dashboard.receivedMessages?.messageCount_one
                        : dict.dashboard.receivedMessages?.messageCount_other}
                </p>
            </div>

            {receivedMessages.length === 0 ? (
                <div className="bg-card border-2 border-dashed border-border/40 rounded-2xl py-12 px-6 text-center flex flex-col items-center gap-3">
                    <div className="w-12 h-12 rounded-[14px] flex items-center justify-center text-xl"
                        style={{ background: 'rgba(196,98,58,0.08)' }}>
                        📥
                    </div>
                    <p className="font-serif font-semibold text-lg text-foreground">
                        {emptyStateText}
                    </p>
                </div>
            ) : (
                <ReceivedMessageList
                    messages={receivedMessages}
                    locale={locale}
                    dict={dict}
                    openToken={openToken}
                />
            )}
            
            {/* Quote strip */}
            <div className="mt-10 rounded-2xl p-5 flex items-center gap-4"
                style={{ background: 'rgba(196,98,58,0.06)', border: '1px solid rgba(196,98,58,0.15)' }}>
                <div className="w-[3px] h-10 rounded-full flex-shrink-0" style={{ background: '#C4623A' }} />
                <p className="font-serif italic text-[0.95rem] text-foreground leading-relaxed">
                    {dict.dashboard.quote}
                </p>
            </div>
        </div>
    );
}
