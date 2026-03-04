'use client'

import { useEffect, useRef } from 'react'

type ScenarioStrings = {
    eyebrow: string
    title: string
    titleEm: string
    s1: { tag: string; question: string; heading: string; body: string }
    s2: { tag: string; question: string; heading: string; body: string }
    s3: { tag: string; question: string; heading: string; body: string }
}

export function LandingScenarios({ t }: { t: ScenarioStrings }) {
    const sectionRef = useRef<HTMLElement>(null)

    useEffect(() => {
        const scenarios = sectionRef.current?.querySelectorAll('.cmw-scenario')
        if (!scenarios) return

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('visible')
                    observer.unobserve(entry.target)
                }
            })
        }, { threshold: 0.15 })

        scenarios.forEach(s => observer.observe(s))
        return () => observer.disconnect()
    }, [])

    return (
        <section className="cmw-scenarios-section" ref={sectionRef}>

            <p className="cmw-eyebrow">{t.eyebrow}</p>
            <h2 className="cmw-section-title">{t.title} <em>{t.titleEm}</em></h2>

            {/* Escenario 01 */}
            <div className="cmw-scenario">
                <div>
                    <div className="cmw-visual-card cmw-visual-card--1">
                        <span className="cmw-visual-number">01</span>
                        <div className="cmw-visual-icon">
                            <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                <path d="M5 3h14M5 21h14M6 3v4.5a6 6 0 0 0 6 6 6 6 0 0 0 6-6V3M6 21v-4.5a6 6 0 0 1 6-6 6 6 0 0 1 6 6V21"
                                    strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                        </div>
                        <p className="cmw-visual-question">&ldquo;{t.s1.question}&rdquo;</p>
                    </div>
                </div>

                <div className="cmw-scenario-text">
                    <span className="cmw-tag">
                        <span className="cmw-tag-line"></span>
                        {t.s1.tag}
                    </span>
                    <h3 className="cmw-scenario-heading">{t.s1.heading}</h3>
                    <p className="cmw-scenario-body">{t.s1.body}</p>
                </div>
            </div>

            {/* Escenario 02 */}
            <div className="cmw-scenario reverse">
                <div>
                    <div className="cmw-visual-card cmw-visual-card--2">
                        <span className="cmw-visual-number">02</span>
                        <div className="cmw-visual-icon">
                            <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"
                                    strokeLinecap="round" strokeLinejoin="round" />
                                <path d="M8 10h.01M12 10h.01M16 10h.01"
                                    strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                        </div>
                        <p className="cmw-visual-question">&ldquo;{t.s2.question}&rdquo;</p>
                    </div>
                </div>

                <div className="cmw-scenario-text">
                    <span className="cmw-tag cmw-tag--gold">
                        <span className="cmw-tag-line"></span>
                        {t.s2.tag}
                    </span>
                    <h3 className="cmw-scenario-heading">{t.s2.heading}</h3>
                    <p className="cmw-scenario-body">{t.s2.body}</p>
                </div>
            </div>

            {/* Escenario 03 — bloque destacado ancho completo */}
            <div className="cmw-scenario cmw-scenario--featured">
                <span className="cmw-featured-number">03</span>

                <div className="cmw-featured-visual">
                    <div className="cmw-featured-icon">
                        <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#C4623A" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                        </svg>
                    </div>
                    <p className="cmw-featured-question">&ldquo;{t.s3.question}&rdquo;</p>
                </div>

                <div className="cmw-scenario-text">
                    <span className="cmw-tag cmw-tag--muted">
                        <span className="cmw-tag-line"></span>
                        {t.s3.tag}
                    </span>
                    <h3 className="cmw-scenario-heading">{t.s3.heading}</h3>
                    <p className="cmw-scenario-body">{t.s3.body}</p>
                </div>
            </div>

        </section>
    )
}
