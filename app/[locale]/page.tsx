import Link from "next/link";
import Image from "next/image";
import { getDictionary, type Locale, isValidLocale, defaultLocale } from "@/lib/i18n";
import { Metadata } from "next";
import { LandingContactForm } from "@/components/landing-contact-form";

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
            <section className="relative w-full h-[70vh] min-h-[600px] flex flex-col items-center justify-center px-6">
                <Image
                    src="/assets/rebrand/hero-editorial.png"
                    alt="Carry My Words - Editorial Hero"
                    fill
                    priority
                    quality={95}
                    className="object-cover object-center"
                />
                <div className="absolute inset-0 bg-background/20"></div>
                <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent"></div>
                <div className="absolute inset-0 bg-gradient-to-b from-background/10 via-transparent to-transparent"></div>

                <div className="relative z-10 text-center max-w-5xl mx-auto transition-all duration-1000">
                    <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-serif font-light tracking-tight mb-10 text-foreground leading-[1.1] md:whitespace-nowrap animate-in fade-in slide-in-from-bottom-8 duration-1000">
                        {dict.landing.hero.title}
                    </h1>
                </div>
            </section>

            {/* Examples - Propuesta D card grid */}
            <section className="py-[110px] px-[7%] bg-[hsl(var(--cream))] relative">
                {/* Header: tag + title + deco num */}
                <div className="flex items-start justify-between mb-14 gap-8">
                    <div>
                        <span className="examples-tag">{dict.landing.uses.tag}</span>
                        <h2 className="font-serif font-normal text-[hsl(var(--ink))] leading-[1.1]"
                            style={{ fontSize: 'clamp(2.6rem, 4vw, 3.8rem)' }}>
                            {dict.landing.uses.title}
                        </h2>
                    </div>
                    <div className="deco-num hidden sm:block flex-shrink-0 mt-[-8px]" aria-hidden="true">09</div>
                </div>

                {/* Cards grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
                    {dict.landing.uses.items.map((text, i) => (
                        <div key={i} className={`ex-card${i === dict.landing.uses.items.length - 1 ? ' featured' : ''}`}>
                            <div className="ex-bullet" />
                            <p className="text-[13px] font-light leading-[1.7] tracking-[0.01em]" style={{ color: 'hsl(var(--ink-soft))' }}>
                                {text}
                            </p>
                        </div>
                    ))}
                </div>
            </section>
            {/* How It Works - Propuesta D Timeline */}
            <section id="how-it-works" className="py-[110px] px-[7%] bg-[hsl(var(--cream))]">
                <div className="text-center mb-[72px]">
                    <h2 className="font-serif font-normal text-[hsl(var(--ink))] mb-2.5"
                        style={{ fontSize: 'clamp(2.6rem, 4vw, 3.8rem)', lineHeight: 1.1 }}>
                        {dict.landing.howItWorks.title}
                    </h2>
                </div>

                {/* Timeline */}
                <div className="flex flex-col md:flex-row items-start justify-center max-w-[860px] mx-auto">
                    {[
                        { step: '01', ...dict.landing.howItWorks.step1 },
                        { step: '02', ...dict.landing.howItWorks.step2 },
                        { step: '03', ...dict.landing.howItWorks.step3 }
                    ].map((item, i) => (
                        <div key={i} className="tl-step flex-1 flex flex-col items-center text-center relative md:flex-col flex-row gap-5 md:gap-0">
                            {/* Node row with connecting lines */}
                            <div className="flex items-center w-full mb-7">
                                {/* Left line: invisible on first step */}
                                {i === 0
                                    ? <div className="flex-1 h-px bg-transparent" />
                                    : <div className="tl-line" />}
                                <div className="tl-circle">
                                    <span className="font-serif text-base font-normal tracking-[0.05em]" style={{ color: 'hsl(var(--rose))' }}>
                                        {item.step}
                                    </span>
                                </div>
                                {/* Right line: invisible on last step */}
                                {i === 2
                                    ? <div className="flex-1 h-px bg-transparent" />
                                    : <div className="tl-line" />}
                            </div>
                            <div className="px-4">
                                <h3 className="font-serif font-medium text-[hsl(var(--ink))] mb-2.5 leading-[1.25] text-[1.35rem]">
                                    {item.title}
                                </h3>
                                <p className="tl-desc">
                                    {item.description}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            {/* Delivery Options */}
            <section className="py-32 px-6 max-w-5xl mx-auto w-full">
                <h2 className="text-3xl md:text-4xl font-serif font-light text-center mb-20 tracking-tight">{dict.landing.delivery.title}</h2>
                <div className="grid md:grid-cols-2 gap-12 md:gap-16 mb-20">
                    <div className="flex flex-col items-start gap-6 border-l border-border/40 pl-8 transition-colors hover:border-primary/40 group">
                        <div className="text-2xl opacity-60 grayscale group-hover:grayscale-0 group-hover:opacity-100 transition-all">
                            📅
                        </div>
                        <div>
                            <h3 className="text-xl md:text-2xl font-serif font-light mb-4">{dict.landing.delivery.date.title}</h3>
                            <p className="text-base text-muted-foreground leading-relaxed">{dict.landing.delivery.date.description}</p>
                        </div>
                    </div>
                    <div className="flex flex-col items-start gap-6 border-l border-border/40 pl-8 transition-colors hover:border-primary/40 group">
                        <div className="text-2xl opacity-60 grayscale group-hover:grayscale-0 group-hover:opacity-100 transition-all">
                            ⏱️
                        </div>
                        <div>
                            <h3 className="text-xl md:text-2xl font-serif font-light mb-4">{dict.landing.delivery.checkin.title}</h3>
                            <p className="text-base text-muted-foreground leading-relaxed">{dict.landing.delivery.checkin.description}</p>
                        </div>
                    </div>
                </div>

                {/* Central CTA - ONLY ONE HERE */}
                <div className="flex justify-center py-4">
                    <Link
                        href={`/${locale}/auth/login`}
                        className="btn-cta"
                    >
                        {dict.common.getStarted}
                    </Link>
                </div>
            </section>

            {/* Audio Section - Warm Image & Integrated CTA */}
            <section className="py-24 px-6 bg-surface/50 border-t border-border/50">
                <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-16 items-center">
                    <div className="order-1">
                        <h2 className="text-4xl md:text-5xl font-serif font-light mb-8 leading-tight">{dict.landing.audio.title}</h2>
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
            <section className="py-24 px-6 border-t border-border/50">
                <div className="max-w-4xl mx-auto text-center">
                    <h2 className="text-4xl md:text-5xl font-serif font-light mb-12">{dict.landing.trust.title}</h2>
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

            {/* What Carry My Words is NOT - Minimal Version */}
            <section className="py-16 px-6 border-t border-border/30">
                <div className="max-w-3xl mx-auto">
                    <h2 className="text-xl md:text-2xl font-serif font-light text-center mb-10 opacity-80">{dict.landing.notWhat.title}</h2>
                    <div className="flex flex-wrap justify-center gap-x-8 gap-y-4 mb-8">
                        {dict.landing.notWhat.items.map((item, i) => (
                            <div key={i} className="flex items-center gap-2 text-sm text-muted-foreground/70">
                                <span className="text-xs">✕</span>
                                <span>{item}</span>
                            </div>
                        ))}
                    </div>
                    <p className="text-center text-sm text-muted-foreground max-w-xl mx-auto italic">
                        {dict.landing.notWhat.clarification}
                    </p>
                </div>
            </section>

            {/* Pricing */}
            <section className="py-24 px-6 border-b border-border/50">
                <div className="max-w-5xl mx-auto text-center">
                    <h2 className="text-4xl md:text-5xl font-serif font-light mb-6">{dict.landing.pricing.title}</h2>
                    <p className="text-muted-foreground mb-16">{dict.landing.pricing.justification}</p>

                    <div className="grid md:grid-cols-2 gap-8 max-w-3xl mx-auto">
                        {/* Free Plan */}
                        <div className="bg-card p-8 rounded-2xl border border-border shadow-sm card-hover flex flex-col">
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
                        <div className="bg-card p-8 rounded-2xl border-2 border-primary shadow-xl card-hover relative flex flex-col">
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
                                className="w-full py-3 border border-primary/20 text-primary font-semibold rounded-lg hover:bg-primary/5 transition-all duration-200 text-center"
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
                <p className="text-2xl md:text-4xl font-serif font-light italic text-muted-foreground leading-relaxed max-w-4xl mx-auto mb-16">
                    &quot;{dict.landing.final_thought}&quot;
                </p>
                <Link
                    href={`/${locale}/auth/login`}
                    className="btn-cta"
                >
                    {dict.landing.cta_final}
                </Link>
            </section>

            {/* Footer */}
            <footer className="py-12 px-6 border-t border-border mt-auto bg-card text-muted-foreground text-sm">
                <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
                    <div className="font-serif font-bold text-foreground text-lg">Carry My Words</div>
                    <div className="flex gap-6">
                        <Link href={`/${locale}/privacy`} className="hover:text-foreground transition-colors">{dict.landing.footer.privacy}</Link>
                        <Link href={`/${locale}/terms`} className="hover:text-foreground transition-colors">{dict.landing.footer.terms}</Link>
                        <Link href={`/${locale}/contact`} className="hover:text-foreground transition-colors">{dict.landing.footer.contact}</Link>
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
