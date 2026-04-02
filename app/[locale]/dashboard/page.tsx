import { createClient } from "@/lib/supabase/server";
import { getDictionary, type Locale, isValidLocale, defaultLocale } from "@/lib/i18n";
import { Suspense } from "react";
import { CheckinStatusWidget } from "@/components/dashboard/checkin-status";
import { CreateMessageButton } from "@/components/dashboard/create-message-button";
import { DashboardMessageList } from "@/components/dashboard/dashboard-message-list";

import { AutoCheckin } from "@/components/dashboard/auto-checkin";
import { UpgradeSuccessModal } from "@/components/dashboard/upgrade-success-modal";
import { SuccessBanner } from "@/components/dashboard/success-banner";
import { getEffectivePlan } from "@/lib/plan-resolver";
import { type Plan } from "@/lib/plans";

export const dynamic = 'force-dynamic';
export const revalidate = 0;

interface MessageWithRecipient {
    id: string;
    type: 'text' | 'audio' | 'video';
    status: 'draft' | 'scheduled' | 'delivered';
    title: string | null;
    text_content: string | null;
    created_at: string;
    recipients: { name: string; email: string }[];
    delivery_rules: { mode: 'date' | 'checkin'; deliver_at: string | null } | { mode: 'date' | 'checkin'; deliver_at: string | null }[] | null;
    message_trusted_contacts: {
        trusted_contacts: {
            id: string;
            name: string;
            email: string;
        } | null
    }[];
}

export default async function DashboardPage({
    params,
}: {
    params: Promise<{ locale: string }>;
}) {
    const { locale: localeParam } = await params;
    const locale: Locale = isValidLocale(localeParam) ? localeParam : defaultLocale;
    const dict = await getDictionary(locale);

    // Fetch messages from Supabase
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    let messages: MessageWithRecipient[] = [];
    let hasCheckinMessages = false;
    let userPlan: Plan = 'free';
    let userFirstName = '';

    if (user) {
        // Parallel fetch for profile and plan
        const [profileResult, effectivePlan] = await Promise.all([
            supabase
                .from('profiles')
                .select('first_name')
                .eq('id', user.id)
                .single(),
            getEffectivePlan(supabase, user.id)
        ]);

        const profile = profileResult.data;
        userPlan = effectivePlan as Plan;
        userFirstName = profile?.first_name || '';

        const { data } = await supabase
            .from('messages')
            .select(`
                id,
                title,
                status,
                text_content,
                created_at,
                recipients (name, email),
                delivery_rules (mode, deliver_at),
                message_trusted_contacts (
                    trusted_contacts (
                        id,
                        name,
                        email
                    )
                )
            `)
            .eq('owner_id', user.id)
            .order('created_at', { ascending: false });

        messages = (data as unknown as MessageWithRecipient[]) || [];

        // Check if user has any checkin-based delivery rules
        const { count } = await supabase
            .from('delivery_rules')
            .select('*', { count: 'exact', head: true })
            .eq('mode', 'checkin');

        hasCheckinMessages = (count || 0) > 0;
    }

    const isLimitReached = userPlan === 'free' && messages.length >= 1;
    const userName = userFirstName || user?.user_metadata?.first_name || user?.email?.split('@')[0] || '';
    const messageCount = messages.length;
    const maxTrustedContacts = userPlan === 'free' ? 1 : 3;

    // Next delivery calculation
    let nextDeliveryDateStr = '—';
    let nextDeliveryRecipient = '';

    if (messageCount > 0) {
        // Collect specific delivery dates
        const dateMessages = messages.filter(msg => {
            if (Array.isArray(msg.delivery_rules)) return false; 
            return msg.delivery_rules && msg.delivery_rules.mode === 'date' && msg.delivery_rules.deliver_at;
        });

        if (dateMessages.length > 0) {
            // Sort by nearest date
            dateMessages.sort((a, b) => {
                const dateA = new Date((a.delivery_rules as any).deliver_at).getTime();
                const dateB = new Date((b.delivery_rules as any).deliver_at).getTime();
                return dateA - dateB;
            });

            const nextMsg = dateMessages[0];
            const deliverAt = (nextMsg.delivery_rules as any).deliver_at;

            const date = new Date(deliverAt);
            const formatter = new Intl.DateTimeFormat(locale, {
                day: 'numeric',
                month: 'short',
                year: 'numeric'
            });

            nextDeliveryDateStr = formatter.format(date).toLowerCase();
            if (locale === 'en') {
                nextDeliveryDateStr = formatter.format(date)
            }

            if (nextMsg.recipients && nextMsg.recipients[0]) {
                nextDeliveryRecipient = `${dict.dashboard.messageCard.labels.to} ${nextMsg.recipients[0].name.split(' ')[0]}`
            }

        } else if (hasCheckinMessages) {
            nextDeliveryDateStr = (dict.dashboard.messageCard as any).deliveryType?.checkin || 'When no longer present';
        }
    }

    // Dynamic strings processing
    const greetingText = dict.dashboard.greeting.replace('{name}', userName);
    const statusText = dict.dashboard.status
        .replace('{count}', messageCount.toString())
        .replace('{plan}', userPlan === 'free' ? 'Free' : 'Pro')
        .replace('(s)', messageCount !== 1 ? 's' : '')
        .replace('(s)', messageCount !== 1 ? 's' : '');
        
    const savedMsgSubtext = userPlan === 'free' ? dict.dashboard.stats.ofOne : dict.dashboard.stats.ofUnlimited;


    return (
        <div>
            <Suspense>
                <UpgradeSuccessModal dictionary={dict.dashboard.upgradeSuccess} />
            </Suspense>
            <Suspense>
                <SuccessBanner dictionary={dict.dashboard.success} />
            </Suspense>

            {/* New Header */}
            <div className="flex justify-between items-start mb-7">
                <div>
                    <p className="text-[0.72rem] font-medium uppercase tracking-widest mb-1" style={{ color: '#C4623A' }}>
                        {greetingText}
                    </p>
                    <h1 className="font-serif font-light text-[1.9rem] leading-tight text-foreground">
                        {dict.dashboard.title}
                    </h1>
                    <p className="text-sm text-muted-foreground mt-1.5">
                        {statusText}
                    </p>
                </div>
                <CreateMessageButton
                    isLimitReached={isLimitReached}
                    dictionary={dict}
                    locale={locale}
                    className="inline-flex items-center gap-1.5 md:gap-2 px-4 py-2 md:px-5 md:py-2.5 text-xs md:text-sm bg-primary text-primary-foreground rounded-full font-medium hover:bg-primary/90 transition-colors"
                />
            </div>

            {/* Stats Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                {/* Card 1: Saved messages */}
                <div className="rounded-2xl p-5" style={{ background: '#C4623A' }}>
                    <p className="text-[0.65rem] font-[600] uppercase tracking-widest mb-1" style={{ color: 'rgba(255,255,255,0.75)' }}>
                        {dict.dashboard.stats.savedMessages}
                    </p>
                    <p className="font-serif text-[1.9rem] font-semibold leading-none" style={{ color: 'white' }}>
                        {messageCount}
                    </p>
                    <p className="text-xs mt-1.5" style={{ color: 'rgba(255,255,255,0.75)' }}>
                        {savedMsgSubtext}
                    </p>
                </div>

                {/* Card 2: Next delivery */}
                <div className="bg-card border border-border/60 p-5 overflow-hidden flex flex-col justify-between" style={{ borderRadius: '4px' }}>
                    <div className="flex items-center gap-2 mb-3">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#C4623A" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                            <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="16" y1="2" x2="16" y2="6"/>
                        </svg>
                        <p className="text-[0.65rem] font-medium uppercase tracking-widest text-muted-foreground truncate">
                            {dict.dashboard.stats.nextDelivery}
                        </p>
                    </div>
                    <p className="font-serif font-light text-xl text-foreground leading-snug truncate">
                        {nextDeliveryDateStr}
                    </p>
                    {nextDeliveryRecipient && (
                        <p className="text-xs text-muted-foreground mt-1.5 truncate" style={{ color: '#C4623A', opacity: 0.7 }}>
                            {nextDeliveryRecipient}
                        </p>
                    )}
                </div>
            </div>

            {/* Check-in status widget (only show if user has check-in messages AND is Pro) */}
            {hasCheckinMessages && userPlan === 'pro' && (
                <div className="mb-8">
                    <CheckinStatusWidget dictionary={dict.checkin} />
                </div>
            )}

            {/* Messages List or Empty State */}
            <DashboardMessageList
                initialMessages={messages}
                userPlan={userPlan}
                locale={locale}
                dict={dict}
            />
            {user && <AutoCheckin />}
        </div>
    );
}
