import { getAdminClient } from "@/lib/supabase/admin";
import { getDictionary, type Locale, isValidLocale, defaultLocale } from "@/lib/i18n";
import Link from 'next/link';
import { Viewport } from "next";
import { AudioPlayer, VideoPlayer } from "@/components/messages/MediaPlayers";

// Force dynamic and skip caching for token validation
export const dynamic = "force-dynamic";
export const revalidate = 0;

interface PageProps {
    params: Promise<{
        locale: string;
        token: string;
    }>;
}

export async function generateMetadata({ params }: PageProps) {
    const { locale: localeParam } = await params;
    const locale: Locale = isValidLocale(localeParam) ? localeParam : defaultLocale;
    const dict = await getDictionary(locale);

    return {
        title: dict.messageVisualizer.receivedLabel,
        description: dict.messageVisualizer.cta.subtext,
    };
}

export const viewport: Viewport = {
    themeColor: '#f7f3ee', // Warm cream matching the system visual
};

export default async function MessagePage({ params }: PageProps) {
    const { locale: localeParam, token } = await params;
    const locale: Locale = isValidLocale(localeParam) ? localeParam : defaultLocale;
    const dict = await getDictionary(locale);
    const t = dict.messageVisualizer;

    const supabase = getAdminClient();

    // Fetch token and related message/sender/recipient info
    // We cast to any to avoid complex nested typing issues for this view
    const { data: tokenData, error: tokenError }: { data: any, error: any } = await supabase
        .from("delivery_tokens")
        .select(`
            id,
            token,
            message_id,
            recipient_id,
            messages (
                id,
                type,
                text_content,
                audio_path,
                created_at,
                owner_id,
                profiles (
                   first_name,
                   last_name
                ),
                delivery_rules (
                   mode
                )
            ),
            recipients (
                name
            )
        `)
        .eq("token", token)
        .single();

    if (tokenError || !tokenData) {
        return (
            <div className="min-h-screen bg-[#F0EBE4] flex flex-col items-center justify-center p-6 text-center space-y-8">
                <div className="space-y-4">
                    <h1 className="text-3xl font-playfair italic">{t.error.title}</h1>
                    <p className="text-[#403933] font-sans max-w-md opacity-70">{t.error.text}</p>
                </div>
                <Link href={`/${locale}`} className="nav-cta-pill">
                    {t.error.button}
                </Link>
            </div>
        );
    }

    const message = tokenData.messages;
    const recipient = tokenData.recipients;
    const profile = message.profiles;
    const deliveryRule = message.delivery_rules;

    const senderName = `${profile?.first_name || ''} ${profile?.last_name || ''}`.trim();
    const recipientName = recipient?.name || '';
    const messageType = message.type; // 'text' | 'audio' | 'video'
    const isPosthumous = deliveryRule?.mode === 'checkin';
    const createdAt = new Date(message.created_at).toLocaleDateString(locale === 'es' ? 'es-ES' : 'en-US', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
    });

    let mediaUrl = '';
    if (messageType === 'audio' || messageType === 'video') {
        const { data: signedUrlData } = await supabase.storage
            .from('audio')
            .createSignedUrl(message.audio_path, 3600); // 1 hour expiry
        mediaUrl = signedUrlData?.signedUrl || '';
    }

    return (
        <div className="min-h-screen bg-[#F0EBE4] font-sans selection:bg-primary/20 overflow-x-hidden">
            <style dangerouslySetInnerHTML={{
                __html: `
                @keyframes slideUp {
                    from { opacity: 0; transform: translateY(30px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                .animate-slide-up {
                    animation: slideUp 1s ease-out forwards;
                    opacity: 0;
                }
            `}} />

            {/* Header */}
            <header className="px-6 py-8 border-b border-black/[0.04] bg-[#F0EBE4]/80 backdrop-blur-md sticky top-0 z-50 transition-all duration-700">
                <div className="max-w-4xl mx-auto flex flex-col items-center gap-1">
                    <div className="font-playfair italic text-2xl text-primary tracking-tight">
                        Carry My Words
                    </div>
                    <div className="text-[9px] font-medium tracking-[0.3em] text-primary/70 uppercase">
                        {t.cta.subtext.split(' — ')[1] || 'Messages that travel through time'}
                    </div>
                </div>
            </header>

            <main className="max-w-2xl mx-auto px-6 py-16 sm:py-24 space-y-20 relative z-10">

                {/* Intro Section */}
                <div className="text-center space-y-4 animate-slide-up" style={{ animationDelay: '0.1s' }}>
                    <div className="text-[11px] font-sans tracking-[0.2em] uppercase text-primary font-bold">
                        {isPosthumous ? t.posthumousLabel : t.specialLabel}
                    </div>
                    <h2 className="text-3xl sm:text-4xl font-playfair italic text-[#1A1510] font-normal leading-tight">
                        Para {recipientName},<br />
                        <span className="text-primary/90 opacity-90">{t.fromLabel} {senderName}</span>
                    </h2>
                </div>

                {/* Message Card container */}
                <div className="animate-slide-up" style={{ animationDelay: '0.4s' }}>
                    {messageType === 'text' && (
                        <TextCard
                            content={message.text_content}
                            senderName={senderName}
                            date={createdAt}
                            isPosthumous={isPosthumous}
                            t={t}
                        />
                    )}

                    {messageType === 'audio' && (
                        <AudioCard
                            audioUrl={mediaUrl}
                            senderName={senderName}
                            date={createdAt}
                            isPosthumous={isPosthumous}
                            t={t}
                        />
                    )}

                    {messageType === 'video' && (
                        <VideoCard
                            videoUrl={mediaUrl}
                            senderName={senderName}
                            date={createdAt}
                            t={t}
                        />
                    )}
                </div>

                {/* CTA Block */}
                <div
                    className="bg-white border border-black/[0.04] rounded-[2.5rem] p-8 sm:p-14 text-center space-y-8 shadow-[0_4px_30px_rgba(0,0,0,0.02)] animate-slide-up"
                    style={{ animationDelay: '0.7s' }}
                >
                    <div className="w-16 h-16 bg-[#F0EBE4] rounded-full flex items-center justify-center mx-auto transition-transform hover:scale-110 duration-500">
                        <svg className="w-8 h-8 text-primary/70" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                    </div>
                    <div className="space-y-4 max-w-sm mx-auto">
                        <h3 className="text-2xl sm:text-3xl font-playfair text-[#1A1510]">{t.cta.heading}</h3>
                        <p className="text-[#403933] font-sans leading-relaxed text-[0.95rem] opacity-70">
                            {t.cta.text}
                        </p>
                    </div>
                    <div className="space-y-5 pt-4">
                        <Link href={`/${locale}`} className="btn-cta inline-block w-full sm:w-auto px-10 py-5">
                            {t.cta.button}
                        </Link>
                        <div className="text-[10px] tracking-[0.2em] text-[#9C9088] uppercase font-semibold">
                            {t.cta.subtext}
                        </div>
                    </div>
                </div>
            </main>

            {/* Footer */}
            <footer className="max-w-4xl mx-auto px-6 py-24 text-center border-t border-black/[0.04] animate-slide-up" style={{ animationDelay: '0.9s' }}>
                <div className="font-playfair italic text-2xl text-primary/40 mb-8 select-none">
                    Carry My Words
                </div>
                <div className="flex flex-col items-center gap-6">
                    <p className="text-[11px] text-[#9C9088] font-sans font-medium leading-relaxed max-w-xs uppercase tracking-[0.2em]">
                        {t.cta.subtext}
                    </p>
                    <Link href={`/${locale}`} className="text-xs text-primary/60 hover:text-primary transition-colors underline underline-offset-4 decoration-primary/10 hover:decoration-primary/30 font-medium">
                        voiceforlater.vercel.app
                    </Link>
                </div>
            </footer>
        </div>
    );
}

// Layout Subcomponents

function TextCard({ content, senderName, date, isPosthumous, t }: { content: string, senderName: string, date: string, isPosthumous: boolean, t: any }) {
    return (
        <div className="bg-white rounded-[2rem] overflow-hidden shadow-[0_12px_44px_rgba(0,0,0,0.04)] border border-black/[0.04] flex flex-col">
            <div className={`px-8 py-5 flex items-center justify-between border-b border-white/5 ${isPosthumous ? 'bg-[#3D2C1E]' : 'bg-[#C4623A]'}`}>
                <div className="text-[10px] tracking-[0.2em] uppercase text-white/70 font-bold">
                    {isPosthumous ? t.posthumousLabel : t.specialLabel}
                </div>
                <div className="text-[9px] text-white/50 font-medium tracking-widest uppercase">
                    {date}
                </div>
            </div>
            <div className="px-8 py-16 sm:px-16 sm:py-24 space-y-12 text-center relative overflow-hidden">
                <div className="text-primary/10 text-8xl font-serif absolute top-4 left-1/2 -translate-x-1/2 z-0 leading-none select-none italic">“</div>
                <div className="font-lora italic text-xl sm:text-2xl text-[#2A2520] leading-[1.8] whitespace-pre-wrap relative z-10 antialiased">
                    {content}
                </div>
                <div className="flex flex-col items-center gap-4 relative z-10 pt-4">
                    <div className="h-px w-8 bg-primary/20"></div>
                    <div className="text-[11px] tracking-[0.2em] text-[#9C9088] uppercase font-bold">
                        {senderName}
                    </div>
                </div>
            </div>
        </div>
    );
}

function AudioCard({ audioUrl, senderName, date, isPosthumous, t }: { audioUrl: string, senderName: string, date: string, isPosthumous: boolean, t: any }) {
    return (
        <div className="bg-white rounded-[2rem] overflow-hidden shadow-[0_12px_44px_rgba(0,0,0,0.04)] border border-black/[0.04]">
            <div className={`px-8 py-5 flex items-center justify-between border-b border-white/5 ${isPosthumous ? 'bg-[#3D2C1E]' : 'bg-[#C4623A]'}`}>
                <div className="text-[10px] tracking-[0.2em] uppercase text-white/70 font-bold">
                    {isPosthumous ? t.posthumousLabel : t.specialLabel}
                </div>
                <div className="text-[9px] text-white/50 font-medium tracking-widest uppercase">
                    {date}
                </div>
            </div>
            <div className="p-10 sm:p-14 space-y-12">
                <div className="flex flex-col items-center text-center gap-4">
                    <div className="w-20 h-20 bg-[#F0EBE4] rounded-full flex items-center justify-center text-primary/60 font-playfair text-3xl font-bold border-4 border-white shadow-sm">
                        {senderName.charAt(0)}
                    </div>
                    <div className="space-y-1.5">
                        <div className="text-xl font-playfair text-[#1A1510] leading-tight">{senderName}</div>
                        <div className="text-[10px] tracking-[0.2em] text-primary/80 font-bold uppercase">{t.voiceLabel}</div>
                    </div>
                </div>

                <div className="bg-[#FAF7F2] rounded-3xl p-8 border border-black/[0.02]">
                    <AudioPlayer src={audioUrl} />
                </div>

                <div className="flex flex-col items-center gap-4 pt-4">
                    <div className="h-px w-8 bg-primary/20"></div>
                    <div className="text-[11px] tracking-[0.2em] text-[#9C9088] uppercase font-bold">
                        {t.metaSaved} — {date}
                    </div>
                </div>
            </div>
        </div>
    );
}

function VideoCard({ videoUrl, senderName, date, t }: { videoUrl: string, senderName: string, date: string, t: any }) {
    return (
        <div className="bg-white rounded-[2rem] overflow-hidden shadow-[0_12px_44px_rgba(0,0,0,0.04)] border border-black/[0.04]">
            <VideoPlayer src={videoUrl} overlayText={t.videoOverlay} />
            <div className="p-10 sm:p-14 space-y-10">
                <div className="flex items-center gap-6">
                    <div className="w-16 h-16 bg-[#F0EBE4] rounded-full flex items-center justify-center text-primary/60 font-playfair text-2xl font-bold border-4 border-white shadow-sm flex-shrink-0">
                        {senderName.charAt(0)}
                    </div>
                    <div className="space-y-1.5 min-w-0">
                        <div className="text-xl font-playfair text-[#1A1510] truncate">{senderName}</div>
                        <div className="text-[10px] tracking-[0.15em] text-primary/80 font-bold uppercase truncate">{t.metaSaved}</div>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    <div className="h-px flex-1 bg-black/[0.04]"></div>
                    <div className="text-[10px] tracking-[0.2em] text-[#9C9088] uppercase font-bold">
                        {date}
                    </div>
                    <div className="h-px flex-1 bg-black/[0.04]"></div>
                </div>
            </div>
        </div>
    );
}
