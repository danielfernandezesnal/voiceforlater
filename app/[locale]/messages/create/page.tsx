import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getDictionary, type Locale, isValidLocale, defaultLocale } from "@/lib/i18n";
import { WizardClient } from "@/components/wizard/wizard-client";

export const dynamic = 'force-dynamic'

export default async function CreateMessagePage({
    params,
}: {
    params: Promise<{ locale: string }>;
}) {
    const { locale: localeParam } = await params;
    const locale: Locale = isValidLocale(localeParam) ? localeParam : defaultLocale;

    // Check auth
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        redirect(`/${locale}/auth/login`);
    }

    // Get user plan
    const { data: profile } = await supabase
        .from('profiles')
        .select('plan')
        .eq('id', user.id)
        .single();

    const userPlan = (profile?.plan as 'free' | 'pro') || 'free';
    const dict = await getDictionary(locale);

    return (
        <div className="container max-w-3xl mx-auto px-4">
            <WizardClient locale={locale} dictionary={dict} userPlan={userPlan} />
        </div>
    );
}
