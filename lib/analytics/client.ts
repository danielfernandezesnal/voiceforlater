export async function trackEventClient(event: string, metadata?: Record<string, string | number | boolean | null>) {
    try {
        const res = await fetch('/api/events/track', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ event, metadata })
        });
        if (!res.ok) console.error(`[Analytics] API Error: ${res.status}`);
    } catch (e) {
        console.error('[Analytics] Network Error:', e);
    }
}
