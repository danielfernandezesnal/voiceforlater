import { TrustedContactList } from "@/components/dashboard/trusted-contact-list";
import { getDictionary, type Locale, isValidLocale, defaultLocale } from "@/lib/i18n";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

// Force dynamic rendering
export const dynamic = 'force-dynamic'

export default async function ContactsPage({
    params,
}: {
    params: Promise<{ locale: string }>;
}) {
    const { locale: localeParam } = await params;
    const locale: Locale = isValidLocale(localeParam) ? localeParam : defaultLocale;
    const dict = await getDictionary(locale);

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        redirect(`/${locale}/auth/login`);
    }

    // Fetch user plan
    const { data: profile } = await supabase
        .from('profiles')
        .select('plan')
        .eq('id', user.id)
        .single();

    const currentPlan = profile?.plan || 'free';

    return (
        <div className="max-w-4xl mx-auto space-y-8">
            <div className="bg-card border border-border rounded-xl p-8 shadow-sm">
                {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                <h1 className="text-3xl font-bold mb-6">{(dict.nav as any)?.contacts || 'Contactos'}</h1>
                <p className="text-muted-foreground mb-8">
                    {dict.trustedContact?.description || 'Gestiona las personas en las que confías para que reciban tus mensajes si tú no puedes.'}
                </p>

                <TrustedContactList dictionary={dict} locale={locale} plan={currentPlan} />
            </div>
        </div>
    );
}
