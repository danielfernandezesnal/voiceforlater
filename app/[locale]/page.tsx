import Link from "next/link";
import Image from "next/image";
import { getDictionary, type Locale, isValidLocale, defaultLocale } from "@/lib/i18n";
import { Metadata } from "next";
import { LandingContactForm } from "@/components/landing-contact-form";
import { LandingScenarios } from "@/components/landing-scenarios";
import { LandingFaq } from "@/components/landing-faq";
import { LocaleSwitcher } from "@/components/profile/locale-switcher";
import { ScrollReveal } from "@/components/scroll-reveal";

export async function generateMetadata({
    params,
}: {
    params: Promise<{ locale: string }>;
}): Promise<Metadata> {
    const { locale: localeParam } = await params;
    const locale: Locale = isValidLocale(localeParam) ? localeParam : defaultLocale;

    return {
        title: "Carry my Words",
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
            <nav className="px-4 py-4 md:p-6 flex justify-between items-center max-w-6xl mx-auto w-full">
                <div className="font-serif italic font-normal text-[1.6rem] md:text-5xl tracking-tight whitespace-nowrap" style={{ color: TC }}>
                    Carry my Words
                </div>
                <div className="flex flex-row gap-3 md:gap-6 items-center">
                    <LocaleSwitcher currentLocale={locale} />
                    {/* Nav CTA */}
                    <Link
                        href={`/${locale}/auth/login`}
                        className="inline-flex items-center justify-center text-center rounded-full px-3 py-1.5 md:px-5 md:py-2 text-xs md:text-sm font-medium no-underline bg-[#C4623A] text-white md:bg-transparent md:text-[#C4623A] md:border md:border-[#C4623A] leading-tight shrink-0"
                    >
                        {(dict.landing as any).nav?.login}
                    </Link>
                </div>
            </nav>

            {/* Hero Section — Editorial Center */}
            <section className="relative min-h-[90vh] md:min-h-screen flex items-center justify-center overflow-hidden py-24 md:py-0">
                {/* Background Image */}
                <div className="absolute inset-0 z-0">
                    <Image
                        src="/assets/rebrand/hero-editorial.png"
                        alt="Carry my Words - Editorial Hero"
                        fill
                        priority
                        quality={95}
                        className="object-cover"
                        style={{
                            objectPosition: 'center 30%',
                            filter: 'sepia(18%) saturate(0.9) brightness(1.05)'
                        }}
                    />
                </div>

                {/* Overlay */}
                <div 
                    className="absolute inset-0 z-0 pointer-events-none"
                    style={{
                        background: 'radial-gradient(ellipse 120% 100% at 50% 50%, rgba(239, 233, 224, 0.45) 0%, rgba(239, 233, 224, 0.78) 70%, hsl(var(--cream)) 100%)'
                    }}
                />

                {/* Content */}
                <div className="relative z-10 max-w-[720px] w-[90%] flex flex-col items-center text-center mt-12 md:mt-0 animate-in fade-in duration-1000">
                    <p className="mb-5"
                        style={{ fontSize: '0.78rem', letterSpacing: '0.18em', textTransform: 'uppercase', fontWeight: 500, color: TC }}>
                        {dict.landing.hero.tag}
                    </p>
                    
                    <h1 className="font-serif font-light tracking-tight leading-[1.06] mb-8"
                        style={{ fontSize: 'clamp(3rem, 5vw, 5rem)', color: 'hsl(var(--ink))', letterSpacing: '-0.02em' }}>
                        {(dict.landing.hero as any).title_plain}
                        <em style={{ color: TC, fontStyle: 'italic' }}>{(dict.landing.hero as any).title_em}</em>
                    </h1>

                    {/* Divider */}
                    <div className="w-[60px] h-[1px] mb-8" style={{ background: 'rgba(42, 37, 32, 0.15)' }} />

                    <p className="font-light leading-relaxed mb-10 max-w-[500px]"
                        style={{ fontSize: 'clamp(1.1rem, 1.4vw, 1.35rem)', color: 'rgba(42, 37, 32, 0.65)' }}>
                        {dict.landing.hero.subtitle}
                    </p>

                    {/* Hero CTA */}
                    <div className="w-full sm:w-auto">
                        <Link
                            href={`/${locale}/auth/login`}
                            className="flex sm:inline-flex justify-center items-center text-center transition-opacity hover:opacity-90 w-full sm:w-auto px-8 py-4 sm:px-10 sm:py-4"
                            style={{
                                background: TC,
                                color: '#fff',
                                borderRadius: '100px',
                                fontSize: '1.05rem',
                                fontWeight: 500,
                                textDecoration: 'none',
                            }}
                        >
                            {ctaHero}
                        </Link>
                    </div>
                </div>
            </section>

            {/* Examples - Redesigned Scenarios Section */}
            <LandingScenarios t={(dict.landing.uses as any).scenarios} />

            {/* How It Works - Propuesta D Timeline */}
            <section id="how-it-works" className="py-[72px] px-[7%] bg-[hsl(var(--cream))]">
                <div className="text-center mb-[36px] md:mb-[72px]">
                    <ScrollReveal>
                        <h2 className="font-serif font-normal text-[hsl(var(--ink))] mb-2.5"
                            style={{ fontSize: 'clamp(2.6rem, 4vw, 3.8rem)', lineHeight: 1.1 }}>
                            {dict.landing.howItWorks.title}
                        </h2>
                    </ScrollReveal>
                </div>

                {/* Timeline */}
                <ScrollReveal childSelector=".tl-step" staggerMs={120}>
                    <div className="flex flex-col md:flex-row items-start justify-center max-w-[940px] mx-auto">
                        {[
                            { step: '01', ...dict.landing.howItWorks.step1 },
                            { step: '02', ...dict.landing.howItWorks.step2 },
                            { step: '03', ...dict.landing.howItWorks.step3 }
                        ].map((item, i) => (
                            <div key={i} className="tl-step sr-hidden flex-1 flex flex-col items-center text-center" data-step={String(i + 1)}>
                                {/* Node row with connecting lines */}
                                <div className="tl-node-row flex items-center w-full mb-7">
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
                                <div className="tl-content px-2">
                                    <h3 className="font-serif font-medium text-[hsl(var(--ink))] mb-2 leading-[1.2] text-2xl">
                                        {item.title}
                                    </h3>
                                    <p className="tl-desc">
                                        {item.description}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                </ScrollReveal>

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
            <section className="py-12 px-6 md:py-16 flex flex-col items-center" style={{ background: 'hsl(var(--cream))' }}>
                <div className="w-full max-w-[360px] md:max-w-[380px] mx-auto">
                    <p className="text-center mb-3" style={{ fontSize: '0.72rem', letterSpacing: '0.16em', textTransform: 'uppercase', fontWeight: 500, color: '#C4623A' }}>
                        {dict.landing.testimonial?.eyebrow ?? 'Una historia real'}
                    </p>
                    <h2 className="font-serif font-light text-center mb-6 leading-tight" style={{ fontSize: 'clamp(1.4rem, 4vw, 1.8rem)', color: 'hsl(var(--ink))' }}>
                        {dict.landing.testimonial?.title ?? 'Así lo vivió alguien como tú'}
                    </h2>
                    <div className="overflow-hidden rounded-2xl shadow-md">
                        <video
                            src="https://nrbnmuqjzyghwqlzbxts.supabase.co/storage/v1/object/public/videos/testimonio.mp4"
                            className="w-full h-auto aspect-[9/16] object-cover"
                            controls
                            preload="metadata"
                            playsInline
                        />
                    </div>
                </div>
            </section>

            {/* Delivery Options — "Tú eliges el momento" */}
            <section className="py-16 px-6 max-w-5xl mx-auto w-full">
                <ScrollReveal>
                    <p className="text-sm font-medium tracking-widest text-center uppercase mb-4" style={{ color: TC }}>
                        {(dict.landing.delivery as any).eyebrow}
                    </p>
                    <h2 className="text-3xl md:text-4xl font-serif font-light text-center mb-20 tracking-tight">
                        {dict.landing.delivery.title}<br />
                        <em style={{ color: TC }} className="italic font-serif">{(dict.landing.delivery as any).titleEm}</em>
                    </h2>
                </ScrollReveal>
                <ScrollReveal childSelector=".delivery-card" staggerMs={120}>
                    <div className="grid md:grid-cols-2 gap-8 md:gap-10 mb-20">
                        {/* Date delivery */}
                        <div className="delivery-card sr-hidden flex flex-col gap-5 p-6 md:p-10 rounded-2xl border border-border/60 transition-shadow hover:shadow-md">
                            <div style={{ width: 52, height: 52, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 14, background: TC_BG }}>
                                <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke={TC} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                    <rect x="3" y="4" width="18" height="18" rx="2" />
                                    <line x1="3" y1="9" x2="21" y2="9" />
                                    <line x1="8" y1="2" x2="8" y2="6" />
                                    <line x1="16" y1="2" x2="16" y2="6" />
                                </svg>
                            </div>
                            <h3 className="text-xl md:text-2xl font-serif font-light">{dict.landing.delivery.date.title}</h3>
                            <p className="text-base text-muted-foreground leading-relaxed">{dict.landing.delivery.date.description}</p>
                        </div>
                        {/* Checkin delivery */}
                        <div className="delivery-card sr-hidden flex flex-col gap-5 p-6 md:p-10 rounded-2xl border border-border/60 transition-shadow hover:shadow-md">
                            <div style={{ width: 52, height: 52, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 14, background: TC_BG }}>
                                <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke={TC} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M5 22h14" />
                                    <path d="M5 2h14" />
                                    <path d="M17 22c0-3.1-2-6-5-6s-5 2.9-5 6" />
                                    <path d="M17 2c0 3.1-2 6-5 6s-5-2.9-5-6" />
                                    <path d="M12 11v1" />
                                </svg>
                            </div>
                            <h3 className="text-xl md:text-2xl font-serif font-light">{dict.landing.delivery.checkin.title}</h3>
                            <p className="text-base text-muted-foreground leading-relaxed">{dict.landing.delivery.checkin.description}</p>
                        </div>
                    </div>
                </ScrollReveal>
            </section>

            {/* Audio Section */}
            {/* Formats — Texto / Audio / Video */}
            <section className="py-24 px-6 border-t border-border/50" style={{ background: 'hsl(var(--cream))' }}>
                <div className="max-w-5xl mx-auto">
                    <ScrollReveal>
                        <p className="text-center mb-4" style={{ fontSize: '0.72rem', letterSpacing: '0.16em', textTransform: 'uppercase', fontWeight: 500, color: TC }}>
                            {dict.landing.audio.eyebrow}
                        </p>
                        <h2 className="font-serif font-light text-center mb-4" style={{ fontSize: 'clamp(2rem, 4vw, 2.8rem)', color: 'hsl(var(--ink))', lineHeight: 1.15 }}>
                            {dict.landing.audio.title}
                        </h2>
                        <p className="text-center mb-16" style={{ fontSize: '14px', color: '#6b5040', fontWeight: 300, lineHeight: 1.75, maxWidth: '520px', margin: '0 auto 56px' }}>
                            {dict.landing.audio.description}
                        </p>
                    </ScrollReveal>

                    <ScrollReveal childSelector=".format-card" staggerMs={120}>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

                            <div className="format-card sr-hidden" style={{ background: '#fffdf9', border: '1px solid #e8e0d0', borderRadius: '4px', overflow: 'hidden' }}>
                                <div style={{ width: '100%', aspectRatio: '4/3', position: 'relative', overflow: 'hidden' }}>
                                    <Image src="/assets/uses-writing.png" alt={dict.landing.audio.textTitle} fill style={{ objectFit: 'cover', filter: 'sepia(12%) saturate(0.9) brightness(1.02)' }} />
                                </div>
                                <div style={{ padding: '20px 22px 24px' }}>
                                    <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.35rem', fontWeight: 400, color: 'hsl(var(--ink))', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={TC} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                                            <path d="M4 6h16M4 12h12M4 18h8"/>
                                        </svg>
                                        {dict.landing.audio.textTitle}
                                    </h3>
                                    <p style={{ fontSize: '13px', color: '#6b5040', fontWeight: 300, lineHeight: 1.7, margin: 0 }}>{dict.landing.audio.textDesc}</p>
                                </div>
                            </div>

                            <div className="format-card sr-hidden" style={{ background: '#fffdf9', border: '1px solid #e8e0d0', borderRadius: '4px', overflow: 'hidden' }}>
                                <div style={{ width: '100%', aspectRatio: '4/3', position: 'relative', overflow: 'hidden' }}>
                                    <Image src="/assets/uses-moment.png" alt={dict.landing.audio.audioTitle} fill style={{ objectFit: 'cover', filter: 'sepia(12%) saturate(0.9) brightness(1.02)' }} />
                                </div>
                                <div style={{ padding: '20px 22px 24px' }}>
                                    <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.35rem', fontWeight: 400, color: 'hsl(var(--ink))', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={TC} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                                            <path d="M12 2a3 3 0 0 1 3 3v7a3 3 0 0 1-6 0V5a3 3 0 0 1 3-3z"/>
                                            <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
                                            <line x1="12" y1="19" x2="12" y2="23"/>
                                        </svg>
                                        {dict.landing.audio.audioTitle}
                                    </h3>
                                    <p style={{ fontSize: '13px', color: '#6b5040', fontWeight: 300, lineHeight: 1.7, margin: 0 }}>{dict.landing.audio.audioDesc}</p>
                                </div>
                            </div>

                            <div className="format-card sr-hidden" style={{ background: '#fffdf9', border: '1px solid #e8e0d0', borderRadius: '4px', overflow: 'hidden' }}>
                                <div style={{ width: '100%', aspectRatio: '4/3', position: 'relative', overflow: 'hidden' }}>
                                    <Image src="/assets/media-recording.png" alt={dict.landing.audio.videoTitle} fill style={{ objectFit: 'cover', filter: 'sepia(12%) saturate(0.9) brightness(1.02)' }} />
                                </div>
                                <div style={{ padding: '20px 22px 24px' }}>
                                    <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.35rem', fontWeight: 400, color: 'hsl(var(--ink))', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={TC} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                                            <polygon points="23 7 16 12 23 17 23 7"/>
                                            <rect x="1" y="5" width="15" height="14" rx="2" ry="2"/>
                                        </svg>
                                        {dict.landing.audio.videoTitle}
                                    </h3>
                                    <p style={{ fontSize: '13px', color: '#6b5040', fontWeight: 300, lineHeight: 1.7, margin: 0 }}>{dict.landing.audio.videoDesc}</p>
                                </div>
                            </div>

                        </div>
                    </ScrollReveal>
                </div>
            </section>

            {/* Trust / Seguridad */}
            <section className="py-24 px-6 border-t border-border/50">
                <div className="max-w-4xl mx-auto">
                    <ScrollReveal>
                        <p className="text-center mb-4" style={{ fontSize: '0.72rem', letterSpacing: '0.16em', textTransform: 'uppercase', fontWeight: 500, color: TC }}>
                            {dict.landing.trust.eyebrow}
                        </p>
                        <h2 className="font-serif font-light text-center mb-16" style={{ fontSize: 'clamp(2rem, 4vw, 2.8rem)', color: 'hsl(var(--ink))', lineHeight: 1.15 }}>
                            {dict.landing.trust.title.split('\n').map((line: string, i: number) => (
                                <span key={i}>{line}{i === 0 && <br />}</span>
                            ))}
                        </h2>
                    </ScrollReveal>

                    <ScrollReveal childSelector=".trust-item" staggerMs={110}>
                        <div className="grid grid-cols-1 md:grid-cols-3 trust-grid mb-10" style={{ gap: '2px', background: '#e8e0d0', border: '1px solid #e8e0d0', borderRadius: '4px', overflow: 'hidden' }}>
                            <div className="trust-item sr-hidden" style={{ background: '#fffdf9', padding: '36px 28px' }}>
                                <div style={{ fontFamily: 'var(--font-serif)', fontSize: '2rem', color: 'rgba(196,98,58,0.2)', lineHeight: 1, marginBottom: '16px' }}>1</div>
                                <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.15rem', fontWeight: 400, color: 'hsl(var(--ink))', lineHeight: 1.3, marginBottom: '10px' }}>{dict.landing.trust.item1}</h3>
                                <p style={{ fontSize: '13px', color: '#6b5040', fontWeight: 300, lineHeight: 1.72, margin: 0 }}>{dict.landing.trust.item1desc}</p>
                            </div>
                            <div className="trust-item sr-hidden" style={{ background: '#fffdf9', padding: '36px 28px' }}>
                                <div style={{ fontFamily: 'var(--font-serif)', fontSize: '2rem', color: 'rgba(196,98,58,0.2)', lineHeight: 1, marginBottom: '16px' }}>2</div>
                                <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.15rem', fontWeight: 400, color: 'hsl(var(--ink))', lineHeight: 1.3, marginBottom: '10px' }}>{dict.landing.trust.item2}</h3>
                                <p style={{ fontSize: '13px', color: '#6b5040', fontWeight: 300, lineHeight: 1.72, margin: 0 }}>{dict.landing.trust.item2desc}</p>
                            </div>
                            <div className="trust-item sr-hidden" style={{ background: '#fffdf9', padding: '36px 28px' }}>
                                <div style={{ fontFamily: 'var(--font-serif)', fontSize: '2rem', color: 'rgba(196,98,58,0.2)', lineHeight: 1, marginBottom: '16px' }}>3</div>
                                <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.15rem', fontWeight: 400, color: 'hsl(var(--ink))', lineHeight: 1.3, marginBottom: '10px' }}>{dict.landing.trust.item3}</h3>
                                <p style={{ fontSize: '13px', color: '#6b5040', fontWeight: 300, lineHeight: 1.72, margin: 0 }}>{dict.landing.trust.item3desc}</p>
                            </div>
                        </div>
                    </ScrollReveal>

                    <ScrollReveal>
                        <div style={{ background: '#2c1810', borderRadius: '4px', padding: '28px 36px', display: 'flex', alignItems: 'flex-start', gap: '20px' }}>
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="rgba(196,98,58,0.7)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginTop: '2px' }}>
                                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                            </svg>
                            <div>
                                <p style={{ fontSize: '14px', color: 'rgba(253,248,240,0.85)', fontWeight: 300, lineHeight: 1.72, margin: '0 0 8px' }}>
                                    <strong style={{ color: '#fff9f4', fontWeight: 500 }}>{dict.landing.trust.encryption}</strong>
                                    {' '}{dict.landing.trust.clarification}
                                </p>
                                <span style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic', fontSize: '13px', color: 'rgba(196,98,58,0.7)' }}>
                                    {dict.landing.trust.owasp}
                                </span>
                            </div>
                        </div>
                    </ScrollReveal>
                </div>
            </section>

            {/* FAQ */}
            <LandingFaq t={(dict.landing as any).faq} />

            {/* Closing — dark dramatic block */}
            <ScrollReveal>
                <section
                    style={{
                        background: '#6E6862',
                        padding: '80px 24px',
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
            </ScrollReveal>

            {/* Pricing */}
            <section className="py-24 px-6 border-b border-border/50">
                <div className="max-w-5xl mx-auto text-center">
                    <ScrollReveal>
                        <h2 className="text-4xl md:text-5xl font-serif font-light mb-6">{dict.landing.pricing.title}</h2>
                        <p className="text-muted-foreground mb-16">{dict.landing.pricing.justification}</p>
                    </ScrollReveal>

                    <ScrollReveal childSelector=".pricing-card" staggerMs={130}>
                        <div className="grid md:grid-cols-2 gap-8 max-w-3xl mx-auto">
                            {/* Free Plan */}
                            <div className="pricing-card sr-hidden bg-card flex flex-col" style={{ border: '1px solid #e8e0d0', borderRadius: '12px', padding: '28px 28px 24px' }}>
                                <h3 className="font-serif font-normal mb-1" style={{ fontSize: '1.6rem', color: 'hsl(var(--ink))' }}>{(dict.landing.pricing.free as any).title}</h3>
                                <p className="italic mb-5" style={{ fontSize: '12px', color: '#9a8070', fontWeight: 300 }}>{(dict.landing.pricing.free as any).tagline}</p>
                                <div className="font-serif font-normal mb-5" style={{ fontSize: '2.2rem', color: 'hsl(var(--ink))', lineHeight: 1 }}>{(dict.landing.pricing.free as any).price}</div>
                                <ul className="mb-6 text-left flex-1" style={{ listStyle: 'none', padding: 0, margin: '0 0 24px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                    {((dict.landing.pricing.free as any).features || []).map((f: string, i: number) => (
                                        <li key={i} style={{ fontSize: '13px', color: '#4a3728', fontWeight: 300, display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            <span style={{ color: TC }}>✓</span> {f}
                                        </li>
                                    ))}
                                </ul>
                                <Link href={`/${locale}/auth/login`} className="w-full py-3 text-center transition-all duration-200" style={{ background: 'transparent', color: TC, border: `1px solid ${TC}`, borderRadius: '100px', display: 'block', fontSize: '12px', fontWeight: 500, letterSpacing: '0.06em', textDecoration: 'none' }}>
                                    {(dict.landing.pricing.free as any).cta}
                                </Link>
                            </div>
                            {/* Pro Plan */}
                            <div className="pricing-card sr-hidden flex flex-col" style={{ background: '#fffdf9', border: `2px solid ${TC}`, borderRadius: '12px', padding: '28px 28px 24px', position: 'relative' }}>
                                <div style={{ position: 'absolute', top: 0, right: 0, background: TC, color: '#fff9f4', fontSize: '9px', fontWeight: 500, letterSpacing: '0.12em', textTransform: 'uppercase', padding: '5px 12px', borderRadius: '0 10px 0 6px' }}>
                                    {dict.landing.pricing.recommended}
                                </div>
                                <h3 className="font-serif font-normal mb-1" style={{ fontSize: '1.6rem', color: TC }}>{(dict.landing.pricing.pro as any).title}</h3>
                                <p className="italic mb-5" style={{ fontSize: '12px', color: `${TC}99`, fontWeight: 300 }}>{(dict.landing.pricing.pro as any).tagline}</p>
                                <div className="font-serif font-normal mb-5" style={{ fontSize: '2.2rem', color: 'hsl(var(--ink))', lineHeight: 1 }}>
                                    {dict.common.price.replace('{amount}', '10').split(' /')[0]} <span style={{ fontSize: '13px', fontWeight: 300, color: '#9a8070', fontFamily: 'sans-serif' }}>/ {dict.common.perYear}</span>
                                </div>
                                <ul className="mb-6 text-left flex-1" style={{ listStyle: 'none', padding: 0, margin: '0 0 24px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                    {((dict.landing.pricing.pro as any).features || []).map((f: string, i: number) => (
                                        <li key={i} style={{ fontSize: '13px', color: '#4a3728', fontWeight: 300, display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            <span style={{ color: TC }}>✓</span> {f}
                                        </li>
                                    ))}
                                    <li style={{ fontSize: '13px', color: '#4a3728', fontWeight: 300, display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <span style={{ color: TC }}>✓</span> {locale === 'es' ? 'Subir videos externos' : (locale === 'pt' ? 'Upload vídeos externos' : (locale === 'fr' ? 'Télécharger des vidéos externes' : 'Upload external videos'))}
                                    </li>
                                </ul>
                                <Link href={`/${locale}/auth/login`} className="w-full py-3 text-center transition-all duration-200" style={{ background: TC, color: '#fff9f4', borderRadius: '100px', display: 'block', fontSize: '12px', fontWeight: 500, letterSpacing: '0.06em', textDecoration: 'none' }}>
                                    {(dict.landing.pricing.pro as any).cta}
                                </Link>
                            </div>
                        </div>
                    </ScrollReveal>

                </div>
            </section>

            {/* Footer */}
            <footer className="py-12 px-6 border-t border-border mt-auto bg-card text-muted-foreground text-sm">
                <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
                    <div className="flex flex-col items-center">
                        <div className="font-serif font-normal italic text-2xl" style={{ color: TC }}>Carry my Words</div>
                        <p style={{ color: TC, fontSize: '0.65rem', letterSpacing: '0.14em', fontWeight: 500, marginTop: '4px', textAlign: 'center' }}>
                            {locale === 'es' ? 'MENSAJES QUE VIAJAN EN EL TIEMPO' : 'MESSAGES THAT TRAVEL THROUGH TIME'}
                        </p>
                    </div>
                    <div className="flex gap-6">
                        <Link href={`/${locale}/privacy`} className="hover:text-foreground transition-colors">{dict.landing.footer.privacy}</Link>
                        <Link href={`/${locale}/terms`} className="hover:text-foreground transition-colors">{dict.landing.footer.terms}</Link>
                        <Link href={`/${locale}/contact`} className="hover:text-foreground transition-colors">{dict.landing.footer.contact}</Link>
                    </div>
                    <div className="flex items-center">
                        <LocaleSwitcher currentLocale={locale} />
                    </div>
                </div>
            </footer>
        </div >
    );
}
