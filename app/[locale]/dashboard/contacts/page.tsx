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

    // Fetch contacts server-side (auth works here)
    const { data: contacts, error: contactsError } = await supabase
        .from('trusted_contacts')
        .select('*')
        .eq('user_id', user.id);

    if (contactsError) {
        console.error('[ContactsPage] Error fetching contacts:', contactsError.message);
    }

    return (
        <div className="max-w-4xl mx-auto space-y-8 w-full max-w-full box-border">
            <div className="bg-card border border-border rounded-xl p-4 sm:p-8 shadow-sm w-full box-border">
                {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                <h1 className="text-3xl font-bold mb-6">{dict.trustedContact?.pageTitle || 'Contactos de confianza'}</h1>
                <div className="mb-8 leading-relaxed">
                    <p className="font-medium text-foreground">
                        {dict.trustedContact?.pageDescription1}
                    </p>
                    <p className="text-muted-foreground mt-2 text-sm">
                        {dict.trustedContact?.pageDescription2}
                    </p>
                </div>

                <TrustedContactList
                    dictionary={dict}
                    locale={locale}
                    plan={currentPlan}
                    initialContacts={contacts || []}
                    userEmail={user.email ?? ''}
                />
            </div>
        </div>
    );
}
