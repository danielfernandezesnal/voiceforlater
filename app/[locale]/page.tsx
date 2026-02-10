import Link from "next/link";
import Image from "next/image";
import { getDictionary, type Locale, isValidLocale, defaultLocale } from "@/lib/i18n";

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
                <div className="font-bold text-xl tracking-tight">
                    VoiceFor<span className="text-primary">Later</span>
                </div>
                <div className="flex gap-6 items-center">
                    <div className="flex items-center gap-2 text-sm font-medium">
                        <Link href="/en" className={locale === 'en' ? 'text-primary' : 'text-muted-foreground hover:text-foreground transition-colors'}>EN</Link>
                        <span className="text-border">/</span>
                        <Link href="/es" className={locale === 'es' ? 'text-primary' : 'text-muted-foreground hover:text-foreground transition-colors'}>ES</Link>
                    </div>
                    <Link href={`/${locale}/auth/login`} className="text-sm font-medium hover:text-primary transition-colors">
                        {dict.auth.login}
                    </Link>
                </div>
            </nav>

            {/* Hero Section - Subtle Visual Entry Point */}
            <section className="relative flex flex-col items-center justify-center pt-32 pb-20 px-6 text-center w-full overflow-hidden">
                {/* Subtle Background Gradient Anchor */}
                <div className="absolute inset-0 bg-gradient-to-b from-secondary/30 via-secondary/10 to-transparent pointer-events-none -z-10"></div>

                <h1 className="text-4xl md:text-6xl font-[family-name:var(--font-barlow)] font-light tracking-tight mb-8 text-foreground leading-tight max-w-4xl mx-auto">
                    {dict.landing.hero.title}
                </h1>
                <p className="max-w-2xl mx-auto text-xl text-muted-foreground leading-relaxed mb-10">
                    {dict.landing.hero.subtitle}
                </p>


                <div className="flex flex-col sm:flex-row gap-4 justify-center mb-20">
                    <Link
                        href={`/${locale}/auth/login`}
                        className="inline-flex items-center justify-center px-8 py-3.5 text-lg font-semibold text-primary-foreground bg-primary rounded-xl hover:bg-primary/90 transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5"
                    >
                        {dict.common.getStarted}
                    </Link>
                    <a
                        href="#how-it-works"
                        className="inline-flex items-center justify-center px-8 py-3.5 text-lg font-medium text-foreground bg-white/80 backdrop-blur-sm border border-border rounded-xl hover:bg-white transition-all"
                    >
                        {dict.common.seeHow}
                    </a>
                </div>

                {/* Emotional Anchoring - Simple Tags */}
                <div className="flex flex-wrap justify-center gap-4 mb-20 text-sm text-muted-foreground opacity-80">
                    {dict.landing.emotional.items.map((item, i) => (
                        <span key={i} className="px-4 py-2 bg-white/50 rounded-full border border-border/40">
                            {item}
                        </span>
                    ))}
                </div>

                {/* Full Width Image Row - Filmstrip/Gallery Feel */}
                <div className="w-full max-w-[100vw] px-4 md:px-0 mt-8">
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4 md:gap-4 lg:gap-6 w-full">

                        {/* 1. Archive/Home */}
                        <div className="aspect-[3/4] rounded-xl overflow-hidden shadow-sm border border-white/40 relative group">
                            <Image
                                src="/assets/atmosphere-home.png"
                                alt="Quiet home corner"
                                fill
                                className="object-cover transform scale-100 group-hover:scale-105 transition-transform duration-1000"
                            />
                            <div className="absolute inset-0 bg-secondary/10"></div>
                        </div>

                        {/* 2. Writing */}
                        <div className="aspect-[3/4] rounded-xl overflow-hidden shadow-sm border border-white/40 relative group mt-8 md:mt-0">
                            <Image
                                src="/assets/uses-writing.png"
                                alt="Writing a message"
                                fill
                                className="object-cover transform scale-100 group-hover:scale-105 transition-transform duration-1000"
                            />
                            <div className="absolute inset-0 bg-secondary/10"></div>
                        </div>

                        {/* 3. Hero/Anchor (Morning) */}
                        <div className="col-span-2 md:col-span-1 aspect-[3/4] rounded-xl overflow-hidden shadow-md border border-white/60 relative group -mt-8 md:mt-0 z-10">
                            <Image
                                src="/assets/hero-calm-morning.png"
                                alt="Morning reflection"
                                fill
                                className="object-cover transform scale-100 group-hover:scale-105 transition-transform duration-1000"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-30"></div>
                        </div>

                        {/* 4. Detail Tea */}
                        <div className="aspect-[3/4] rounded-xl overflow-hidden shadow-sm border border-white/40 relative group mt-8 md:mt-0">
                            <Image
                                src="/assets/detail-tea.png"
                                alt="Warmtea"
                                fill
                                className="object-cover transform scale-100 group-hover:scale-105 transition-transform duration-1000"
                            />
                            <div className="absolute inset-0 bg-secondary/10"></div>
                        </div>

                        {/* 5. Detail Book */}
                        <div className="aspect-[3/4] rounded-xl overflow-hidden shadow-sm border border-white/40 relative group hidden md:block">
                            <Image
                                src="/assets/detail-book.png"
                                alt="Reading a book"
                                fill
                                className="object-cover transform scale-100 group-hover:scale-105 transition-transform duration-1000"
                            />
                            <div className="absolute inset-0 bg-secondary/10"></div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Uses Section - Intimate Writing Moment */}
            <section className="py-24 px-6 max-w-6xl mx-auto w-full">
                <div className="grid md:grid-cols-2 gap-16 items-center">
                    <div className="order-2 md:order-1">
                        <div className="aspect-[4/5] rounded-2xl overflow-hidden shadow-xl border border-border/50 relative">
                            <Image
                                src="/assets/uses-writing.png"
                                alt="Writing a thoughtful note"
                                fill
                                className="object-cover"
                            />
                            <div className="absolute inset-0 bg-secondary/10"></div>
                        </div>
                    </div>
                    <div className="order-1 md:order-2">
                        <h2 className="text-3xl font-bold mb-6">{dict.landing.uses.title}</h2>
                        <p className="text-xl text-primary italic font-medium mb-10 opacity-80">
                            &quot;{dict.landing.uses.subtitle}&quot;
                        </p>
                        <p className="text-lg mb-6 font-medium">Ejemplos:</p>
                        <ul className="space-y-4">
                            {dict.landing.uses.items.map((item, i) => (
                                <li key={i} className="flex items-start gap-3">
                                    <span className="text-primary mt-1">•</span>
                                    <span className="text-lg text-muted-foreground leading-relaxed">
                                        {typeof item === 'string' ? item : item.title}
                                    </span>
                                </li>
                            ))}
                        </ul>
                        <p className="text-lg mt-8 font-medium">
                            No es solo para despedidas.<br />
                            Es para momentos que todavía no llegaron.
                        </p>
                    </div>
                </div>
            </section>

            {/* How It Works */}
            <section id="how-it-works" className="py-20 px-6 bg-white/50 border-y border-border/50">
                <div className="max-w-6xl mx-auto">
                    <h2 className="text-3xl font-bold text-center mb-16">{dict.landing.howItWorks.title}</h2>
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
            <section className="py-20 px-6 max-w-6xl mx-auto w-full">
                <h2 className="text-3xl font-bold text-center mb-16">{dict.landing.delivery.title}</h2>
                <div className="grid md:grid-cols-2 gap-8">
                    <div className="bg-card p-8 rounded-2xl border border-border/50 shadow-sm hover:shadow-md transition-all">
                        <div className="w-12 h-12 bg-blue-100/50 text-blue-600 rounded-lg flex items-center justify-center mb-6">
                            📅
                        </div>
                        <h3 className="text-xl font-bold mb-3">{dict.landing.delivery.date.title}</h3>
                        <p className="text-muted-foreground">{dict.landing.delivery.date.description}</p>
                    </div>
                    <div className="bg-card p-8 rounded-2xl border border-border/50 shadow-sm hover:shadow-md transition-all">
                        <div className="w-12 h-12 bg-green-100/50 text-green-600 rounded-lg flex items-center justify-center mb-6">
                            ⏱️
                        </div>
                        <h3 className="text-xl font-bold mb-3">{dict.landing.delivery.checkin.title}</h3>
                        <p className="text-muted-foreground">{dict.landing.delivery.checkin.description}</p>
                    </div>
                </div>
            </section>

            {/* Audio Section - Warm Image & Integrated CTA */}
            <section className="py-24 px-6 bg-secondary/30">
                <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-16 items-center">
                    <div className="order-1">
                        <h2 className="text-3xl md:text-4xl font-bold mb-6">{dict.landing.audio.title}</h2>
                        <p className="text-lg text-muted-foreground leading-relaxed mb-8">
                            {dict.landing.audio.description}
                        </p>
                        <Link
                            href={`/${locale}/auth/login`}
                            className="inline-flex items-center justify-center px-8 py-3 text-lg font-semibold text-white bg-primary rounded-xl hover:bg-primary/90 transition-all shadow-md"
                        >
                            {dict.common.getStarted}
                        </Link>
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
                    <h2 className="text-3xl font-bold mb-6">{dict.landing.trust.title}</h2>
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
                    <h2 className="text-3xl font-bold text-center mb-12">{dict.landing.notWhat.title}</h2>
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
                    <h2 className="text-3xl font-bold mb-4">{dict.landing.pricing.title}</h2>
                    <p className="text-muted-foreground mb-16">{dict.landing.pricing.justification}</p>

                    <div className="grid md:grid-cols-2 gap-8 max-w-3xl mx-auto">
                        {/* Free Plan */}
                        <div className="bg-card p-8 rounded-2xl border border-border shadow-sm flex flex-col">
                            <h3 className="text-xl font-bold mb-2">{dict.landing.pricing.free.title}</h3>
                            <div className="text-3xl font-bold mb-6">USD 0</div>
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
                            <h3 className="text-xl font-bold mb-2 text-primary">{dict.landing.pricing.pro.title}</h3>
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
                                className="w-full py-3 bg-primary text-primary-foreground font-semibold rounded-lg hover:bg-primary/90 transition-colors"
                            >
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
                    className="inline-flex items-center justify-center px-10 py-4 text-lg font-semibold text-primary-foreground bg-primary rounded-xl hover:bg-primary/90 transition-all shadow-xl hover:shadow-2xl"
                >
                    {dict.landing.cta_final}
                </Link>
            </section>

            {/* Footer */}
            <footer className="py-12 px-6 border-t border-border mt-auto bg-card text-muted-foreground text-sm">
                <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
                    <div className="font-bold text-foreground">VoiceForLater</div>
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
