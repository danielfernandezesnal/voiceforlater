'use client'

import { useScrollReveal } from '@/hooks/use-scroll-reveal'

interface ScrollRevealProps {
    children: React.ReactNode
    /** If provided, observes matching child elements (staggered). Otherwise observes the wrapper itself. */
    childSelector?: string
    /** Stagger delay in ms between staggered children (default: 100) */
    staggerMs?: number
    className?: string
    /** Threshold to trigger the animation (default: 0.12) */
    threshold?: number
}

/**
 * Wraps any content and adds scroll-reveal animation via IntersectionObserver.
 * Use `childSelector` to stagger multiple children.
 *
 * Elements to animate must carry the `sr-hidden` class (either on this wrapper
 * or on each child matched by `childSelector`).
 */
export function ScrollReveal({
    children,
    childSelector,
    staggerMs = 100,
    className = '',
    threshold = 0.12,
}: ScrollRevealProps) {
    const ref = useScrollReveal<HTMLDivElement>({ childSelector, staggerMs, threshold })

    return (
        <div
            ref={ref}
            className={`${childSelector ? '' : 'sr-hidden'} ${className}`.trim()}
        >
            {children}
        </div>
    )
}
