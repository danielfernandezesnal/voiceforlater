import { createClient } from "@/lib/supabase/server";
import { getDictionary, type Locale, isValidLocale, defaultLocale } from "@/lib/i18n";
import { ReceivedMessageCard } from "@/components/dashboard/received-message-card";

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function ReceivedMessagesPage({
    params,
}: {
    params: Promise<{ locale: string }>;
}) {
    const { locale: localeParam } = await params;
    const locale: Locale = isValidLocale(localeParam) ? localeParam : defaultLocale;
    const dict = await getDictionary(locale);

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    let receivedMessages: any[] = [];

    if (user) {
        // Fetch received messages
        const { data: receivedData } = await supabase
            .from('messages')
            .select(`
                id,
                type,
                status,
                title,
                created_at,
                owner_id,
                profiles (
                   first_name,
                   last_name
                ),
                delivery_tokens (
                    token
                ),
                recipients!inner (
                    email
                )
            `)
            .eq('status', 'delivered')
            .eq('recipients.email', user.email)
            .order('created_at', { ascending: false });

        receivedMessages = (receivedData || []).map((msg: any) => ({
            ...msg,
            sender_name: `${msg.profiles?.first_name || ''} ${msg.profiles?.last_name || ''}`.trim() || null,
            token: msg.delivery_tokens?.[0]?.token || null
        }));
    }

    const title = (dict.dashboard as any).receivedMessages?.title || 'Received Messages';
    const emptyStateText = (dict.dashboard as any).receivedMessages?.empty || "You haven't received any messages yet.";

    return (
        <div className="animate-in fade-in duration-500 slide-in-from-bottom-2">
             <div className="mb-8">
                <h1 className="font-serif font-semibold text-[1.9rem] leading-tight text-foreground">
                    {title}
                </h1>
                <p className="text-sm text-muted-foreground mt-1.5">
                    {receivedMessages.length} {receivedMessages.length === 1 ? (dict.dashboard as any).receivedMessages?.messageCount_one : (dict.dashboard as any).receivedMessages?.messageCount_other}
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
                <div className="grid gap-4">
                    {receivedMessages.map((msg) => (
                        <ReceivedMessageCard
                            key={msg.id}
                            message={msg}
                            locale={locale}
                            dict={dict}
                        />
                    ))}
                </div>
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
