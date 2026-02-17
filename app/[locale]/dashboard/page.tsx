import { createClient } from "@/lib/supabase/server";
import { getDictionary, type Locale, isValidLocale, defaultLocale } from "@/lib/i18n";
import { CheckinStatusWidget } from "@/components/dashboard/checkin-status";

import { CreateMessageButton } from "@/components/dashboard/create-message-button";
import { MessageStatus } from "@/components/dashboard/message-status";
import { MessageActions } from "@/components/dashboard/message-actions";
import { UpgradeButton } from "@/components/stripe";
import { type Plan } from "@/lib/plans";

interface MessageWithRecipient {
    id: string;
    type: 'text' | 'audio';
    status: 'draft' | 'scheduled' | 'delivered';
    text_content: string | null;
    created_at: string;
    recipients: { name: string; email: string }[];
    delivery_rules: { mode: 'date' | 'checkin'; deliver_at: string | null } | { mode: 'date' | 'checkin'; deliver_at: string | null }[] | null;
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
                delivery_rules (mode, deliver_at)
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
            {messages.length === 0 ? (
                <div className="text-center py-16 px-4">
                    <div className="max-w-md mx-auto">
                        {/* Empty State Illustration */}
                        <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-gradient-to-br from-primary/20 to-purple-500/20 flex items-center justify-center">
                            <svg className="w-12 h-12 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                            </svg>
                        </div>

                        <h2 className="text-xl font-semibold mb-2">{dict.dashboard.empty.title}</h2>
                        <p className="text-muted-foreground mb-8">{dict.dashboard.empty.description}</p>

                        <CreateMessageButton
                            isLimitReached={isLimitReached}
                            dictionary={dict}
                            locale={locale}
                            className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors shadow-lg shadow-primary/25"
                        />
                    </div>
                </div>
            ) : (
                <div className="grid gap-4">
                    {messages.map((message) => {
                        const deliveryRule = Array.isArray(message.delivery_rules)
                            ? message.delivery_rules[0]
                            : message.delivery_rules;
                        const deliverAt = deliveryRule?.deliver_at;

                        return (
                            <div
                                key={message.id}
                                className="p-4 bg-card border border-border rounded-xl hover:border-primary/50 transition-colors"
                            >
                                <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                        {/* Recipient */}
                                        <div className="text-sm text-muted-foreground mb-1">
                                            {dict.dashboard.messageCard.recipient.replace(
                                                '{name}',
                                                message.recipients[0]?.name || 'Unknown'
                                            )}
                                        </div>

                                        {/* Message Preview */}
                                        <div className="font-medium mb-2">
                                            {message.type === 'text' && message.text_content
                                                ? message.text_content.substring(0, 80) + (message.text_content.length > 80 ? '...' : '')
                                                : dict.dashboard.messageCard.type.audio
                                            }
                                        </div>

                                        {/* Type and Status badges */}
                                        <MessageStatus
                                            status={message.status}
                                            deliverAt={deliverAt || null}
                                            deliveryMode={deliveryRule?.mode || null}
                                            type={message.type}
                                            locale={locale}
                                            dict={dict}
                                        />
                                    </div>

                                    {/* Date */}
                                    {/* Date & Actions */}
                                    <div className="flex flex-col items-end gap-3 ml-4">
                                        <div className="text-xs text-muted-foreground">
                                            {new Date(message.created_at).toLocaleDateString()}
                                        </div>
                                        <MessageActions
                                            messageId={message.id}
                                            locale={locale}
                                            status={message.status}
                                            labels={{
                                                edit: dict.common.edit,
                                                delete: dict.common.delete,
                                                view: dict.common.view
                                            }}
                                        />
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
