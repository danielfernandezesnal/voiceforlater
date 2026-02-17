import { createClient } from "@/lib/supabase/server";
import { getDictionary, type Locale, isValidLocale, defaultLocale } from "@/lib/i18n";
import { CheckinStatusWidget } from "@/components/dashboard/checkin-status";

import { CreateMessageButton } from "@/components/dashboard/create-message-button";
import { DashboardMessageList } from "@/components/dashboard/dashboard-message-list";
import { UpgradeButton } from "@/components/stripe";
import { type Plan } from "@/lib/plans";

export const dynamic = 'force-dynamic';
export const revalidate = 0;

interface MessageWithRecipient {
    id: string;
    type: 'text' | 'audio';
    status: 'draft' | 'scheduled' | 'delivered';
    text_content: string | null;
    created_at: string;
    recipients: { name: string; email: string }[];
    delivery_rules: { mode: 'date' | 'checkin'; deliver_at: string | null } | { mode: 'date' | 'checkin'; deliver_at: string | null }[] | null;
    message_contacts: {
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

    if (user) {
        // Get user profile for plan
        const { data: profile } = await supabase
            .from('profiles')
            .select('plan')
            .eq('id', user.id)
            .single();

        userPlan = (profile?.plan as Plan) || 'free';

        const { data } = await supabase
            .from('messages')
            .select(`
                id,
                type,
                status,
                text_content,
                created_at,
                recipients (name, email),
                delivery_rules (mode, deliver_at),
                message_contacts (
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

    return (
        <div>
            {/* Page Header */}
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-3xl font-bold">{dict.dashboard.title}</h1>
                    <p className="text-muted-foreground mt-1">{dict.dashboard.subtitle}</p>
                </div>
                <CreateMessageButton
                    isLimitReached={isLimitReached}
                    dictionary={dict}
                    locale={locale}
                    className="inline-flex items-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors shadow-lg shadow-primary/25"
                />
            </div>

            {/* Upgrade Banner for Free users */}
            {userPlan === 'free' && (
                <div className="mb-8 p-4 rounded-xl border border-primary/10 bg-gradient-to-r from-primary/5 to-purple-500/5 hover:border-primary/20 transition-colors">
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                                <svg className="w-5 h-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                </svg>
                            </div>
                            <div>
                                <p className="font-semibold">{dict.stripe.proFeatures}</p>
                                <p className="text-sm text-muted-foreground">{dict.stripe.proPrice}</p>
                            </div>
                        </div>
                        <UpgradeButton dictionary={dict.stripe} isPro={false} />
                    </div>
                </div>
            )}

            {/* Plan Badge for Pro users */}
            {userPlan === 'pro' && (
                <div className="mb-8 flex items-center justify-between p-4 rounded-xl border border-success/10 bg-success/5">
                    <div className="flex items-center gap-3">
                        <span className="px-3 py-1 text-sm font-semibold rounded-full bg-success/10 text-success">
                            {dict.stripe.proBadge}
                        </span>
                        <span className="text-muted-foreground text-sm">
                            {locale === 'es' ? 'Tu plan Pro te permite enviar mensajes ilimitados.' : 'Your Pro plan allows unlimited messages.'}
                        </span>
                    </div>
                    {/* Manage subscription moved to /dashboard/plan */}
                </div>
            )}

            {/* Check-in status widget (only show if user has check-in messages AND is Pro) */}
            {hasCheckinMessages && userPlan === 'pro' && (
                <div className="mb-8">
                    <CheckinStatusWidget dictionary={dict.checkin} />
                </div>
            )}

            {/* Messages List or Empty State */}
            {/* Messages List or Empty State */}
            <DashboardMessageList
                initialMessages={messages}
                userPlan={userPlan}
                locale={locale}
                dict={dict}
            />
        </div>
    );
}
