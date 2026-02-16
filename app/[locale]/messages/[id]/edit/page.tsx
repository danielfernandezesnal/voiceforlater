import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getDictionary, type Locale, isValidLocale, defaultLocale } from "@/lib/i18n";
import { WizardClient } from "@/components/wizard/wizard-client";

export const dynamic = 'force-dynamic'

export default async function EditMessagePage({
    params,
}: {
    params: Promise<{ locale: string; id: string }>;
}) {
    const { locale: localeParam, id } = await params;
    const locale: Locale = isValidLocale(localeParam) ? localeParam : defaultLocale;

    // Check auth
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        redirect(`/${locale}/auth/login`);
    }

    // Fetch message
    const { data: message } = await supabase
        .from('messages')
        .select(`
            *,
            recipients (*),
            delivery_rules (*)
        `)
        .eq('id', id)
        .single();

    if (!message || message.owner_id !== user.id) {
        redirect(`/${locale}/dashboard`);
    }

    // Get user plan
    const { data: profile } = await supabase
        .from('profiles')
        .select('plan')
        .eq('id', user.id)
        .single();

    const userPlan = (profile?.plan as 'free' | 'pro') || 'free';
    const dict = await getDictionary(locale);

    // Construct initialData from message
    const recipient = message.recipients?.[0] || { name: '', email: '' };
    const deliveryRule = message.delivery_rules?.[0]; // Assuming 1 rule for now

    // Generate signed URL if audio/video exists
    let existingAudioUrl: string | null = null;
    if (message.audio_path) {
        const { data: signedUrlData } = await supabase
            .storage
            .from('audio')
            .createSignedUrl(message.audio_path, 3600); // 1 hour validity

        existingAudioUrl = signedUrlData?.signedUrl || null;
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const initialData: any = {
        messageType: message.type,
        // If type is text, use text_content. If audio/video, textContent might be empty or transcript?
        textContent: message.text_content || '',
        audioBlob: null, // Can't pre-fill blob easily
        existingAudioUrl,
        audioDuration: 0, // Unknown?
        recipientName: recipient.name,
        recipientEmail: recipient.email,
        deliveryMode: deliveryRule?.mode || null,
        deliverAt: deliveryRule?.deliver_at || '',
        checkinIntervalDays: deliveryRule?.checkin_interval_days || 30,
    };

    return (
        <div className="container max-w-3xl mx-auto px-4">
            <WizardClient
                locale={locale}
                dictionary={dict}
                userPlan={userPlan}
                initialData={initialData}
                messageId={id}
            />
        </div>
    );
}
