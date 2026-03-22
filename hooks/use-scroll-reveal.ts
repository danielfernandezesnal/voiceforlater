import { useEffect, useRef } from 'react'

interface UseScrollRevealOptions {
    /** Root margin passed to IntersectionObserver (default: '0px 0px -60px 0px') */
    rootMargin?: string
    /** Intersection threshold (default: 0.12) */
    threshold?: number
    /** CSS selector for children to animate inside the root element. If omitted, the root element itself is observed. */
    childSelector?: string
    /** Staggered delay increment in ms between sibling children (default: 100) */
    staggerMs?: number
}

/**
 * Attaches IntersectionObserver scroll-reveal to either the root element or
 * matching descendants. Respects `prefers-reduced-motion`.
 *
 * Mark animatable elements with the `sr-hidden` CSS class (defined globally).
 * When they enter the viewport the hook adds `sr-visible`, which triggers the
 * CSS transition.
 */
export function useScrollReveal<T extends HTMLElement>(
    options: UseScrollRevealOptions = {}
) {
    const {
        rootMargin = '0px 0px -60px 0px',
        threshold = 0.12,
        childSelector,
        staggerMs = 100,
    } = options

    const ref = useRef<T>(null)

    useEffect(() => {
        // Respect OS-level reduced motion preference
        const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
        if (prefersReduced) return

        const container = ref.current
        if (!container) return

        const targets = childSelector
            ? Array.from(container.querySelectorAll<HTMLElement>(childSelector))
            : [container]

        if (targets.length === 0) return

        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        const el = entry.target as HTMLElement
                        // Reuse existing delay set by parent (stagger), or default
                        el.classList.add('sr-visible')
                        observer.unobserve(el)
                    }
                })
            },
            { rootMargin, threshold }
        )

        targets.forEach((el, i) => {
            // Apply staggered delay via inline style
            if (childSelector && i > 0) {
                el.style.transitionDelay = `${i * staggerMs}ms`
            }
            observer.observe(el)
        })

        return () => observer.disconnect()
    }, [rootMargin, threshold, childSelector, staggerMs])

    return ref
}
