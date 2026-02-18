export function getTodayInChicago(): string {
    return new Intl.DateTimeFormat('en-CA', {
        timeZone: 'America/Chicago',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
    }).format(new Date());
}

export function getDateDaysAgoInChicago(days: number): string {
    const d = new Date();
    // Adjust to Chicago time first? 
    // Actually, we want "30 days ago in Chicago".
    // 1. Get Chicago current time
    // 2. Subtract days
    // 3. Format

    // Simplest: Get current timestamp, subtract X ms, then format to Chicago.
    // But DST? Subtracting 24h*30 might land on wrong hour but date should be correct mostly.
    // Better: use Date object manipulation after conversion? native Date is hard with TZ.

    // Hybrid: 
    // Get YYYY-MM-DD of Chicago today. Parse it as UTC. Subtract days. Format as YYYY-MM-DD.
    const todayChicago = getTodayInChicago();
    const date = new Date(todayChicago + 'T00:00:00Z'); // Interact as UTC to avoid local timezone offsets logic
    date.setUTCDate(date.getUTCDate() - days);
    return date.toISOString().split('T')[0];
}

export function getMonthRangeInChicago(mode: 'thisMonth' | 'lastMonth'): { from: string, to: string } {
    const todayChicago = getTodayInChicago();
    const date = new Date(todayChicago + 'T00:00:00Z');

    let year = date.getUTCFullYear();
    let month = date.getUTCMonth(); // 0-11

    if (mode === 'lastMonth') {
        month -= 1;
        if (month < 0) {
            month = 11;
            year -= 1;
        }
    }

    const start = new Date(Date.UTC(year, month, 1));
    const end = new Date(Date.UTC(year, month + 1, 0)); // Last day of month

    return {
        from: start.toISOString().split('T')[0],
        to: end.toISOString().split('T')[0]
    };
}
