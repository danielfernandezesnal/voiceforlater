import Link from "next/link";
import Image from "next/image";
import { getDictionary, type Locale, isValidLocale, defaultLocale } from "@/lib/i18n";
import { Metadata } from "next";

export async function generateMetadata({
    params,
}: {
    params: Promise<{ locale: string }>;
}): Promise<Metadata> {
    const { locale: localeParam } = await params;
    const locale: Locale = isValidLocale(localeParam) ? localeParam : defaultLocale;

    return {
        title: "Carry My Words",
        description: locale === 'es'
            ? "Un espacio para dejar mensajes que viajen en el tiempo, para quienes más quieres."
            : "A space to leave messages that travel through time, for those you love most.",
    };
}

export default async function LocaleHomePage({
    params,
}: {
    params: Promise<{ locale: string }>;
}) {
    const { locale: localeParam } = await params;
    const locale: Locale = isValidLocale(localeParam) ? localeParam : defaultLocale;
    const dict = await getDictionary(locale);

    return (
        <div className="min-h-screen flex flex-col bg-background text-foreground">
            {/* Navbar */}
            <nav className="p-6 flex justify-between items-center max-w-6xl mx-auto w-full">
                <div className="font-serif font-bold text-2xl tracking-tight text-primary">
                    Carry My Words
                </div>
                <div className="flex gap-6 items-center">
                    <div className="flex items-center gap-2 text-sm font-medium">
                        <Link href="/en" className={locale === 'en' ? 'text-primary' : 'text-muted-foreground hover:text-foreground transition-colors'}>EN</Link>
                        <span className="text-border">/</span>
                        <Link href="/es" className={locale === 'es' ? 'text-primary' : 'text-muted-foreground hover:text-foreground transition-colors'}>ES</Link>
                    </div>
                    <Link
                        href={`/${locale}/auth/login`}
                        className="text-sm font-medium px-4 py-2 border border-border/50 rounded-sm hover:bg-white/10 transition-colors"
                    >
                        {dict.auth.login}
                    </Link>
                </div>
            </nav>

            {/* Hero Section - Editorial Rebrand */}
            <section className="relative w-full h-[60vh] md:h-[70vh] min-h-[500px] flex flex-col items-center justify-center px-6">
                <Image
                    src="/assets/rebrand/hero-editorial.png"
                    alt="Carry My Words - Editorial Hero"
                    fill
                    priority
                    className="object-cover object-center"
                />
                <div className="absolute inset-0 bg-black/10"></div>
                <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent"></div>
                <div className="absolute inset-0 bg-gradient-to-b from-background/20 via-transparent to-transparent"></div>

                <div className="relative z-10 text-center max-w-5xl mx-auto transition-all duration-1000">
                    <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-serif font-light tracking-tight mb-6 text-foreground leading-[1.1] md:whitespace-nowrap animate-in fade-in slide-in-from-bottom-8 duration-1000">
                        {dict.landing.hero.title}
                    </h1>
                    <p className="max-w-2xl mx-auto text-xl md:text-2xl text-muted-foreground leading-relaxed animate-in fade-in slide-in-from-bottom-4 duration-1000 delay-200">
                        {dict.landing.hero.subtitle}
                    </p>
                    <div className="mt-10 flex flex-col items-center gap-4 animate-in fade-in slide-in-from-bottom-4 duration-1000 delay-400">
                        <Link
                            href={`/${locale}/auth/login`}
                            className="btn-cta"
                        >
                            {dict.landing.hero.cta}
                        </Link>
                        <p className="text-sm text-muted-foreground/70 max-w-xs md:max-w-none text-center">
                            {dict.landing.hero.microcopy}
                        </p>
                    </div>
                </div>
            </section>

            {/* Editorial Section - 3 Columns */}
            <section className="py-24 px-6 max-w-6xl mx-auto w-full">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-12 md:gap-16">
                    {/* Column 1 - Tiempo y futuro */}
                    <div className="flex flex-col gap-6">
                        {(locale === 'es'
                            ? [
                                "Un mensaje para tu hijo o hija cuando sea mayor",
                                "Palabras para una fecha importante",
                                "Un mensaje para vos mismo en el futuro (cápsula del tiempo)"
                            ] : [
                                "A message for your children when they are older",
                                "Words for an important date",
                                "A message for your future self (time capsule)"
                            ]
                        ).map((text, idx) => (
                            <p key={idx} className="text-xl md:text-2xl font-serif font-light leading-relaxed text-muted-foreground">
                                {text}
                            </p>
                        ))}
                    </div>
                    {/* Column 2 - Lo que hoy no se puede decir */}
                    <div className="flex flex-col gap-6">
                        {(locale === 'es'
                            ? [
                                "Algo que querés decir, pero no ahora",
                                "Algo que te cuesta decir en persona",
                                "Algo que no querés olvidar decir"
                            ] : [
                                "Something you want to say, but not now",
                                "Something that's hard to say in person",
                                "Something you don't want to forget to say"
                            ]
                        ).map((text, idx) => (
                            <p key={idx} className="text-xl md:text-2xl font-serif font-light leading-relaxed text-muted-foreground">
                                {text}
                            </p>
                        ))}
                    </div>
                    {/* Column 3 - Distancia y ausencia */}
                    <div className="flex flex-col gap-6">
                        {(locale === 'es'
                            ? [
                                "Un mensaje de apoyo para alguien que sabés que lo va a necesitar más adelante",
                                "Un mensaje para alguien con quien hoy no podés hablar",
                                "Un mensaje que solo debería enviarse si vos no respondés más"
                            ] : [
                                "A supportive message for someone who will need it later",
                                "A message for someone you can't talk to today",
                                "A message that should only be sent if you no longer respond"
                            ]
                        ).map((text, idx) => (
                            <p key={idx} className="text-xl md:text-2xl font-serif font-light leading-relaxed text-muted-foreground">
                                {text}
                            </p>
                        ))}
                    </div>
                </div>


            </section>




            {/* How It Works */}
            <section id="how-it-works" className="py-20 px-6 bg-white/50 border-y border-border/50">
                <div className="max-w-6xl mx-auto">
                    <h2 className="text-4xl font-serif font-light text-center mb-20">{dict.landing.howItWorks.title}</h2>
                    <div className="grid md:grid-cols-3 gap-12">
                        {[
                            { step: "01", ...dict.landing.howItWorks.step1 },
                            { step: "02", ...dict.landing.howItWorks.step2 },
                            { step: "03", ...dict.landing.howItWorks.step3 }
                        ].map((item, i) => (
                            <div key={i} className="flex flex-col items-center text-center">
                                <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-lg mb-6">
                                    {item.step}
                                </div>
                                <h3 className="text-xl font-bold mb-3">{item.title}</h3>
                                <p className="text-muted-foreground leading-relaxed">{item.description}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Delivery Options */}
            <section className="pt-20 pb-0 px-6 max-w-6xl mx-auto w-full">
                <h2 className="text-4xl font-serif font-light text-center mb-20">{dict.landing.delivery.title}</h2>
                <div className="grid md:grid-cols-2 gap-8 mb-20">
                    <div className="bg-card p-10 rounded-2xl border border-border/50 shadow-sm hover:shadow-md transition-all">
                        <div className="w-12 h-12 bg-blue-100/50 text-blue-600 rounded-lg flex items-center justify-center mb-8 text-2xl">
                            📅
                        </div>
                        <h3 className="text-2xl font-serif font-light mb-4">{dict.landing.delivery.date.title}</h3>
                        <p className="text-lg text-muted-foreground leading-relaxed">{dict.landing.delivery.date.description}</p>
                    </div>
                    <div className="bg-card p-10 rounded-2xl border border-border/50 shadow-sm hover:shadow-md transition-all">
                        <div className="w-12 h-12 bg-green-100/50 text-green-600 rounded-lg flex items-center justify-center mb-8 text-2xl">
                            ⏱️
                        </div>
                        <h3 className="text-2xl font-serif font-light mb-4">{dict.landing.delivery.checkin.title}</h3>
                        <p className="text-lg text-muted-foreground leading-relaxed">{dict.landing.delivery.checkin.description}</p>
                    </div>
                </div>

                {/* Central CTA - ONLY ONE HERE */}
                <div className="flex justify-center py-12">
                    <Link
                        href={`/${locale}/auth/login`}
                        className="btn-secondary"
                    >
                        {dict.common.getStarted}
                    </Link>
                </div>
            </section>

            {/* Audio Section - Warm Image & Integrated CTA */}
            <section className="pt-20 pb-24 px-6 bg-secondary/30">
                <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-16 items-center">
                    <div className="order-1">
                        <h2 className="text-4xl md:text-5xl font-serif font-light mb-8">{dict.landing.audio.title}</h2>
                        <p className="text-xl text-muted-foreground leading-relaxed">
                            {dict.landing.audio.description}
                        </p>
                    </div>
                    <div className="order-2">
                        <div className="aspect-video w-full rounded-2xl overflow-hidden shadow-2xl border border-white/50 relative group">
                            <Image
                                src="/assets/media-recording.png"
                                alt="Recording a message"
                                fill
                                className="object-cover transform scale-100 group-hover:scale-105 transition-transform duration-700"
                            />
                            <div className="absolute inset-0 bg-primary/5 pointer-events-none"></div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Trust & Privacy */}
            <section className="py-20 px-6">
                <div className="max-w-4xl mx-auto text-center">
                    <h2 className="text-4xl font-serif font-light mb-12">{dict.landing.trust.title}</h2>
                    <ul className="grid md:grid-cols-3 gap-8">
                        <li className="flex flex-col items-center gap-3">
                            <span className="text-2xl">🔒</span>
                            <span className="font-medium">{dict.landing.trust.item1}</span>
                        </li>
                        <li className="flex flex-col items-center gap-3">
                            <span className="text-2xl">🤝</span>
                            <span className="font-medium">{dict.landing.trust.item2}</span>
                        </li>
                        <li className="flex flex-col items-center gap-3">
                            <span className="text-2xl">⚡</span>
                            <span className="font-medium">{dict.landing.trust.item3}</span>
                        </li>
                    </ul>
                </div>
            </section>

            {/* What VoiceForLater is NOT */}
            <section className="py-20 px-6 bg-white/50 border-y border-border/50">
                <div className="max-w-4xl mx-auto">
                    <h2 className="text-4xl font-serif font-light text-center mb-16">{dict.landing.notWhat.title}</h2>
                    <ul className="grid md:grid-cols-2 gap-6 mb-8">
                        {dict.landing.notWhat.items.map((item, i) => (
                            <li key={i} className="flex items-start gap-3 bg-card p-4 rounded-lg border border-border/50">
                                <span className="text-muted-foreground mt-1">✗</span>
                                <span className="text-muted-foreground">{item}</span>
                            </li>
                        ))}
                    </ul>
                    <p className="text-center text-lg text-foreground font-medium max-w-2xl mx-auto">
                        {dict.landing.notWhat.clarification}
                    </p>
                </div>
            </section>

            {/* Pricing */}
            <section className="py-20 px-6 bg-white/50 border-y border-border/50">
                <div className="max-w-5xl mx-auto text-center">
                    <h2 className="text-5xl font-serif font-light mb-6">{dict.landing.pricing.title}</h2>
                    <p className="text-muted-foreground mb-16">{dict.landing.pricing.justification}</p>

                    <div className="grid md:grid-cols-2 gap-8 max-w-3xl mx-auto">
                        {/* Free Plan */}
                        <div className="bg-card p-8 rounded-2xl border border-border shadow-sm flex flex-col">
                            <h3 className="text-xl font-bold mb-1">{dict.landing.pricing.free.title}</h3>
                            <p className="text-xs text-muted-foreground italic mb-4">{(dict.landing.pricing.free as { tagline?: string }).tagline}</p>
                            <div className="text-3xl font-bold mb-6">{dict.landing.pricing.free.price}</div>
                            <ul className="space-y-4 mb-8 text-left flex-1">
                                {dict.landing.pricing.free.features.map((f, i) => (
                                    <li key={i} className="flex items-center gap-2 text-sm text-muted-foreground">
                                        <span className="text-foreground">✓</span> {f}
                                    </li>
                                ))}
                            </ul>
                        </div>
                        {/* Pro Plan */}
                        <div className="bg-card p-8 rounded-2xl border-2 border-primary shadow-xl relative flex flex-col">
                            <div className="absolute top-0 right-0 bg-primary text-primary-foreground text-xs font-bold px-3 py-1 rounded-bl-lg rounded-tr-lg">
                                {dict.landing.pricing.recommended}
                            </div>
                            <h3 className="text-xl font-bold mb-1 text-primary">{dict.landing.pricing.pro.title}</h3>
                            <p className="text-xs text-primary/60 italic mb-4">{(dict.landing.pricing.pro as { tagline?: string }).tagline}</p>
                            <div className="text-3xl font-bold mb-6">{dict.common.price.replace('{amount}', '10')}</div>
                            <ul className="space-y-4 mb-8 text-left flex-1">
                                {dict.landing.pricing.pro.features.map((f, i) => (
                                    <li key={i} className="flex items-center gap-2 text-sm">
                                        <span className="text-primary font-bold">✓</span> {f}
                                    </li>
                                ))}
                            </ul>
                            <Link
                                href={`/${locale}/auth/login`}
                                className="btn-secondary w-full py-3 text-base"
                            >
                                {/* Force redeploy trigger */}
                                {dict.landing.pricing.pro.cta}
                            </Link>
                        </div>
                    </div>
                </div>
            </section>

            {/* Closing */}
            <section className="py-32 px-6 text-center">
                <p className="text-2xl md:text-4xl font-serif italic text-muted-foreground leading-relaxed max-w-4xl mx-auto mb-12">
                    &quot;{dict.landing.final_thought}&quot;
                </p>
                <Link
                    href={`/${locale}/auth/login`}
                    className="btn-secondary"
                >
                    {dict.landing.cta_final}
                </Link>
            </section>

            {/* Footer */}
            <footer className="py-12 px-6 border-t border-border mt-auto bg-card text-muted-foreground text-sm">
                <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
                    <div className="font-serif font-bold text-foreground text-lg">Carry My Words</div>
                    <div className="flex gap-6">
                        <span>{dict.landing.footer.privacy}</span>
                        <span>{dict.landing.footer.terms}</span>
                        <span>{dict.landing.footer.contact}</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <Link href="/en" className={locale === 'en' ? 'text-primary font-bold' : 'hover:text-foreground'}>EN</Link>
                        <span>/</span>
                        <Link href="/es" className={locale === 'es' ? 'text-primary font-bold' : 'hover:text-foreground'}>ES</Link>
                    </div>
                </div>
            </footer>
        </div>
    );
}
