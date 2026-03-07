import Link from "next/link";
import Image from "next/image";
import { getDictionary, type Locale, isValidLocale, defaultLocale } from "@/lib/i18n";
import { Metadata } from "next";
import { LandingContactForm } from "@/components/landing-contact-form";
import { LandingScenarios } from "@/components/landing-scenarios";
import { LandingFaq } from "@/components/landing-faq";

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

/* ── Terracota palette ── */
const TC = '#C4623A';
const TC_DARK = '#A84F2D';
const TC_BG = 'rgba(196,98,58,0.08)';

export default async function LocaleHomePage({
    params,
}: {
    params: Promise<{ locale: string }>;
}) {
    const { locale: localeParam } = await params;
    const locale: Locale = isValidLocale(localeParam) ? localeParam : defaultLocale;
    const dict = await getDictionary(locale);

    const ctaHero = (dict.landing as any).cta_hero as string;
    const ctaAfterHow = (dict.landing as any).cta_after_how as string;
    const ctaAfterDelivery = (dict.landing as any).cta_after_delivery as string;
    const ctaFinal = (dict.landing as any).cta_final as string;

    return (
        <div className="min-h-screen flex flex-col" style={{ background: 'hsl(var(--cream))' }}>
            {/* Navbar */}
            <nav className="p-6 flex justify-between items-center max-w-6xl mx-auto w-full">
                <div className="font-serif italic font-normal text-5xl tracking-tight" style={{ color: TC }}>
                    Carry My Words
                </div>
                <div className="flex gap-6 items-center">
                    <div className="flex items-center gap-2 text-sm font-medium">
                        <Link href="/en" className={locale === 'en' ? 'text-primary' : 'text-muted-foreground hover:text-foreground transition-colors'}>EN</Link>
                        <span className="text-border">/</span>
                        <Link href="/es" className={locale === 'es' ? 'text-primary' : 'text-muted-foreground hover:text-foreground transition-colors'}>ES</Link>
                    </div>
                    {/* Nav CTA — terracota pill */}
                    <Link
                        href={`/${locale}/auth/login`}
                        className="nav-cta-pill hidden md:inline-block"
                    >
                        {ctaHero}
                    </Link>
                </div>
            </nav>

            {/* Hero Section — clean 2-column grid, self-contained */}
            <section className="hero-grid">
                {/* Left: text */}
                <div className="flex flex-col justify-end px-[7%] pb-20 pt-16">
                    <h1 className="font-serif font-light tracking-tight leading-[1.06] mb-6 animate-in fade-in slide-in-from-bottom-8 duration-1000"
                        style={{ fontSize: 'clamp(3.4rem, 5.6vw, 5.6rem)', color: 'hsl(var(--ink))' }}>
                        {dict.landing.hero.title}
                    </h1>
                    <p className="font-light leading-relaxed animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-200 mb-10"
                        style={{ fontSize: 'clamp(1.1rem, 1.4vw, 1.35rem)', color: 'rgba(42, 37, 32, 0.65)', maxWidth: '500px' }}>
                        {dict.landing.hero.subtitle}
                    </p>
                    {/* Hero CTA */}
                    <div className="animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-300">
                        <Link
                            href={`/${locale}/auth/login`}
                            style={{
                                display: 'inline-block',
                                background: TC,
                                color: '#fff',
                                borderRadius: '100px',
                                padding: '16px 36px',
                                fontSize: '1rem',
                                fontWeight: 500,
                                textDecoration: 'none',
                                textAlign: 'center',
                                transition: 'background 0.2s, transform 0.2s',
                            }}
                        >
                            {ctaHero}
                        </Link>
                    </div>
                </div>

                {/* Right: image */}
                <div className="hero-img-col relative overflow-hidden">
                    <Image
                        src="/assets/rebrand/hero-editorial.png"
                        alt="Carry My Words - Editorial Hero"
                        fill
                        priority
                        quality={95}
                        className="object-cover object-center md:object-center"
                        style={{
                            objectPosition: 'center 20%',
                            filter: 'sepia(18%) saturate(0.9) brightness(1.05)'
                        }}
                    />
                    {/* Desktop: Left + Bottom gradient blend */}
                    <div className="absolute inset-0 pointer-events-none hidden md:block"
                        style={{
                            background: 'linear-gradient(to right, hsl(var(--cream)) 0%, transparent 30%), linear-gradient(to top, hsl(var(--cream)) 0%, transparent 20%)'
                        }}
                    />
                    {/* Mobile: subtle bottom gradient only */}
                    <div className="absolute inset-0 pointer-events-none md:hidden"
                        style={{
                            background: 'linear-gradient(to top, hsl(var(--cream)) 0%, transparent 40%)'
                        }}
                    />
                </div>
            </section>

            {/* Examples - Redesigned Scenarios Section */}
            <LandingScenarios t={(dict.landing.uses as any).scenarios} />

            {/* How It Works - Propuesta D Timeline */}
            <section id="how-it-works" className="py-[110px] px-[7%] bg-[hsl(var(--cream))]">
                <div className="text-center mb-[72px]">
                    <h2 className="font-serif font-normal text-[hsl(var(--ink))] mb-2.5"
                        style={{ fontSize: 'clamp(2.6rem, 4vw, 3.8rem)', lineHeight: 1.1 }}>
                        {dict.landing.howItWorks.title}
                    </h2>
                </div>

                {/* Timeline */}
                <div className="flex flex-col md:flex-row items-start justify-center max-w-[940px] mx-auto">
                    {[
                        { step: '01', ...dict.landing.howItWorks.step1 },
                        { step: '02', ...dict.landing.howItWorks.step2 },
                        { step: '03', ...dict.landing.howItWorks.step3 }
                    ].map((item, i) => (
                        <div key={i} className="tl-step flex-1 flex flex-col items-center text-center relative md:flex-col flex-row gap-5 md:gap-0">
                            {/* Node row with connecting lines */}
                            <div className="flex items-center w-full mb-7">
                                {i === 0
                                    ? <div className="flex-1 h-px bg-transparent" />
                                    : <div className="tl-line" />}
                                <div className="tl-circle">
                                    <span className="font-serif text-base font-normal tracking-[0.05em]" style={{ color: TC }}>
                                        {item.step}
                                    </span>
                                </div>
                                {i === 2
                                    ? <div className="flex-1 h-px bg-transparent" />
                                    : <div className="tl-line" />}
                            </div>
                            <div className="px-2">
                                <h3 className="font-serif font-medium text-[hsl(var(--ink))] mb-2 leading-[1.2] text-[1.25rem]">
                                    {item.title}
                                </h3>
                                <p className="tl-desc">
                                    {item.description}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>

                {/* CTA after How It Works */}
                <div className="flex justify-center mt-14">
                    <Link
                        href={`/${locale}/auth/login`}
                        style={{
                            display: 'inline-block',
                            background: TC,
                            color: '#fff',
                            borderRadius: '100px',
                            padding: '14px 36px',
                            fontSize: '1rem',
                            fontWeight: 500,
                            textDecoration: 'none',
                        }}
                    >
                        {ctaAfterHow}
                    </Link>
                </div>
            </section>

            {/* Video Testimonial */}
            <section className="py-24 px-6 md:py-32 flex flex-col items-center" style={{ background: 'hsl(var(--cream))' }}>
                <div className="w-full max-w-[360px] md:max-w-[380px] mx-auto overflow-hidden rounded-2xl shadow-md">
                    <video
                        src="https://nrbnmuqjzyghwqlzbxts.supabase.co/storage/v1/object/public/videos/testimonio.mp4"
                        className="w-full h-auto aspect-[9/16] object-cover"
                        controls
                        preload="metadata"
                        playsInline
                    />
                </div>
            </section>

            {/* Delivery Options — "Vos elegís el momento" */}
            <section className="py-32 px-6 max-w-5xl mx-auto w-full">
                <h2 className="text-3xl md:text-4xl font-serif font-light text-center mb-20 tracking-tight">{dict.landing.delivery.title}</h2>
                <div className="grid md:grid-cols-2 gap-12 md:gap-16 mb-20">
                    {/* Date delivery */}
                    <div className="flex flex-col items-center text-center gap-6 transition-colors group">
                        <div className="mb-2" style={{ width: 52, height: 52, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 14, background: TC_BG }}>
                            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke={TC} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                <rect x="3" y="4" width="18" height="18" rx="2" />
                                <line x1="3" y1="9" x2="21" y2="9" />
                                <line x1="8" y1="2" x2="8" y2="6" />
                                <line x1="16" y1="2" x2="16" y2="6" />
                            </svg>
                        </div>
                        <div>
                            <h3 className="text-xl md:text-2xl font-serif font-light mb-4">{dict.landing.delivery.date.title}</h3>
                            <p className="text-base text-muted-foreground leading-relaxed">{dict.landing.delivery.date.description}</p>
                        </div>
                    </div>
                    {/* Checkin delivery */}
                    <div className="flex flex-col items-center text-center gap-6 transition-colors group">
                        <div className="mb-2" style={{ width: 52, height: 52, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 14, background: TC_BG }}>
                            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke={TC} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M5 22h14" />
                                <path d="M5 2h14" />
                                <path d="M17 22c0-3.1-2-6-5-6s-5 2.9-5 6" />
                                <path d="M17 2c0 3.1-2 6-5 6s-5-2.9-5-6" />
                                <path d="M12 11v1" />
                            </svg>
                        </div>
                        <div>
                            <h3 className="text-xl md:text-2xl font-serif font-light mb-4">{dict.landing.delivery.checkin.title}</h3>
                            <p className="text-base text-muted-foreground leading-relaxed">{dict.landing.delivery.checkin.description}</p>
                        </div>
                    </div>
                </div>

                {/* CTA after Delivery */}
                <div className="flex justify-center py-4">
                    <Link
                        href={`/${locale}/auth/login`}
                        style={{
                            display: 'inline-block',
                            background: TC,
                            color: '#fff',
                            borderRadius: '100px',
                            padding: '16px 40px',
                            fontSize: '1.1rem',
                            fontWeight: 500,
                            textDecoration: 'none',
                        }}
                    >
                        {ctaAfterDelivery}
                    </Link>
                </div>
            </section>

            {/* Audio Section */}
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
                        {/* 🔒 → lock */}
                        <li className="flex flex-col items-center gap-4">
                            <div style={{ width: 52, height: 52, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 14, background: TC_BG }}>
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={TC} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M19 11H5a2 2 0 0 0-2 2v7a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7a2 2 0 0 0-2-2z" />
                                    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                                </svg>
                            </div>
                            <span className="font-medium">{dict.landing.trust.item1}</span>
                        </li>
                        {/* 🤝 → check-circle */}
                        <li className="flex flex-col items-center gap-4">
                            <div style={{ width: 52, height: 52, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 14, background: TC_BG }}>
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={TC} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                                    <polyline points="22 4 12 14.01 9 11.01" />
                                </svg>
                            </div>
                            <span className="font-medium">{dict.landing.trust.item2}</span>
                        </li>
                        {/* ⚡ → shield */}
                        <li className="flex flex-col items-center gap-4">
                            <div style={{ width: 52, height: 52, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 14, background: TC_BG }}>
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={TC} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                                </svg>
                            </div>
                            <span className="font-medium">{dict.landing.trust.item3}</span>
                        </li>
                    </ul>
                    <div className="mt-12 inline-flex items-center gap-3 bg-card border border-border/50 shadow-sm rounded-full px-6 py-3 max-w-3xl mx-auto text-left">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={TC} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
                            <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                        </svg>
                        <span className="font-medium text-[hsl(var(--ink))]">
                            {(dict.landing.trust as any).encryption}
                        </span>
                    </div>
                    {(dict.landing.trust as any).clarification && (
                        <p className="text-center text-sm text-muted-foreground mt-10 max-w-xl mx-auto italic">
                            {(dict.landing.trust as any).clarification}
                        </p>
                    )}
                </div>
            </section>

            {/* FAQ */}
            <LandingFaq t={(dict.landing as any).faq} />

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
                                        <span style={{ color: TC }} className="font-bold">✓</span> {f}
                                    </li>
                                ))}
                            </ul>
                        </div>
                        {/* Pro Plan */}
                        <div className="bg-card p-8 rounded-2xl shadow-xl card-hover relative flex flex-col" style={{ border: `2px solid ${TC}` }}>
                            <div className="absolute top-0 right-0 text-white text-xs font-bold px-3 py-1 rounded-bl-lg rounded-tr-lg" style={{ background: TC }}>
                                {dict.landing.pricing.recommended}
                            </div>
                            <h3 className="text-xl font-bold mb-1" style={{ color: TC }}>{dict.landing.pricing.pro.title}</h3>
                            <p className="text-xs italic mb-4" style={{ color: `${TC}99` }}>{(dict.landing.pricing.pro as { tagline?: string }).tagline}</p>
                            <div className="text-3xl font-bold mb-6">{dict.common.price.replace('{amount}', '10')}</div>
                            <ul className="space-y-4 mb-8 text-left flex-1">
                                {dict.landing.pricing.pro.features.map((f, i) => (
                                    <li key={i} className="flex items-center gap-2 text-sm">
                                        <span style={{ color: TC }} className="font-bold">✓</span> {f}
                                    </li>
                                ))}
                            </ul>
                            <Link
                                href={`/${locale}/auth/login`}
                                className="w-full py-3 text-white font-semibold text-center transition-all duration-200"
                                style={{ background: TC, borderRadius: '100px', display: 'block' }}
                            >
                                {dict.landing.pricing.pro.cta}
                            </Link>
                        </div>
                    </div>
                </div>
            </section>

            {/* Closing — dark dramatic block */}
            <section
                style={{
                    background: '#6E6862',
                    padding: '120px 24px',
                    textAlign: 'center',
                }}
            >
                <p
                    className="font-serif font-light italic"
                    style={{
                        fontSize: 'clamp(2rem, 5vw, 4rem)',
                        lineHeight: 1.2,
                        color: 'rgba(253, 248, 240, 0.92)',
                        maxWidth: '820px',
                        margin: '0 auto',
                        letterSpacing: '-0.01em',
                    }}
                >
                    &ldquo;{dict.landing.final_thought}&rdquo;
                </p>
            </section>

            {/* CTA final */}
            <section className="py-20 px-6 text-center" style={{ background: 'hsl(var(--cream))' }}>
                <Link
                    href={`/${locale}/auth/login`}
                    style={{
                        display: 'inline-block',
                        background: TC,
                        color: '#fff',
                        borderRadius: '100px',
                        padding: '18px 48px',
                        fontSize: '1.15rem',
                        fontWeight: 500,
                        textDecoration: 'none',
                        transition: 'background 0.2s, transform 0.15s',
                    }}
                >
                    {ctaFinal}
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
        </div >
    );
}
