'use client';

import { useState, useEffect, useCallback } from 'react';

interface Props {
    locale: string;
}

export default function AdminDashboardClient({ locale }: Props) {
    const [totalUsers, setTotalUsers] = useState<number | null>(null);
    const [paidUsers, setPaidUsers] = useState<number | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [dateFrom, setDateFrom] = useState<string>('');
    const [dateTo, setDateTo] = useState<string>('');

    const fetchKPI = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const params = new URLSearchParams();
            if (dateFrom) params.set('from', new Date(dateFrom).toISOString());
            if (dateTo) {
                const end = new Date(dateTo);
                // Set to end of day
                end.setHours(23, 59, 59, 999);
                params.set('to', end.toISOString());
            }

            const [resUsers, resPaid] = await Promise.all([
                fetch(`/api/admin/kpis/total-users?${params.toString()}`),
                fetch(`/api/admin/kpis/paid-users?${params.toString()}`)
            ]);

            if (!resUsers.ok) {
                const data = await resUsers.json();
                throw new Error(data.error || 'Failed to fetch Total Users KPI');
            }
            if (!resPaid.ok) {
                const data = await resPaid.json();
                throw new Error(data.error || 'Failed to fetch Paid Users KPI');
            }

            const [dataUsers, dataPaid] = await Promise.all([
                resUsers.json(),
                resPaid.json()
            ]);

            setTotalUsers(dataUsers.totalUsers);
            setPaidUsers(dataPaid.paidUsers);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, [dateFrom, dateTo]);

    useEffect(() => {
        fetchKPI();
    }, [fetchKPI]);

    const handlePreset = (preset: 'today' | 'month') => {
        const now = new Date();
        const start = new Date();
        if (preset === 'today') {
            start.setHours(0, 0, 0, 0);
        } else if (preset === 'month') {
            start.setDate(1);
            start.setHours(0, 0, 0, 0);
        }

        // Format to YYYY-MM-DD for input type="date"
        const formatDate = (d: Date) => {
            const year = d.getFullYear();
            const month = String(d.getMonth() + 1).padStart(2, '0');
            const day = String(d.getDate()).padStart(2, '0');
            return `${year}-${month}-${day}`;
        };

        setDateFrom(formatDate(start));
        setDateTo(formatDate(now));
    };

    return (
        <div className="min-h-screen bg-background text-foreground p-6 sm:p-10 space-y-10 font-sans">
            <header className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-4xl font-extrabold tracking-tight">Admin Dashboard</h1>
                    <p className="text-muted-foreground mt-2">Platform insights and key performance indicators.</p>
                </div>
                <div className="flex gap-2">
                    <a
                        href={`/${locale}/dashboard`}
                        className="px-4 py-2 text-sm border border-border rounded-lg hover:bg-muted transition-colors font-medium"
                    >
                        User View
                    </a>
                </div>
            </header>

            <main className="max-w-7xl mx-auto space-y-8">
                {/* Filters Row */}
                <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-6 bg-card border border-border rounded-2xl p-6 shadow-sm">
                    <div className="space-y-4 w-full">
                        <div className="flex justify-between items-center">
                            <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Global Filters</h3>
                            <button
                                onClick={() => { setDateFrom(''); setDateTo(''); }}
                                className="text-xs text-primary hover:underline"
                            >
                                Reset to All Time
                            </button>
                        </div>
                        <div className="flex flex-wrap gap-4 items-center">
                            <div className="flex flex-col gap-1.5">
                                <label className="text-[10px] uppercase font-bold text-muted-foreground/70 ml-1">Start Date</label>
                                <input
                                    type="date"
                                    value={dateFrom}
                                    onChange={(e) => setDateFrom(e.target.value)}
                                    className="bg-background border border-border rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all cursor-pointer"
                                />
                            </div>
                            <div className="flex flex-col gap-1.5">
                                <label className="text-[10px] uppercase font-bold text-muted-foreground/70 ml-1">End Date</label>
                                <input
                                    type="date"
                                    value={dateTo}
                                    onChange={(e) => setDateTo(e.target.value)}
                                    className="bg-background border border-border rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all cursor-pointer"
                                />
                            </div>
                            <div className="hidden sm:block h-10 w-px bg-border mx-2"></div>
                            <div className="flex flex-wrap gap-2">
                                <button
                                    onClick={() => handlePreset('today')}
                                    className="px-4 py-2 text-xs bg-muted hover:bg-muted/80 rounded-xl transition font-medium"
                                >
                                    Today
                                </button>
                                <button
                                    onClick={() => handlePreset('month')}
                                    className="px-4 py-2 text-xs bg-muted hover:bg-muted/80 rounded-xl transition font-medium"
                                >
                                    This Month
                                </button>
                            </div>
                        </div>
                    </div>
                    <button
                        onClick={fetchKPI}
                        className="w-full lg:w-auto px-8 py-3 bg-primary text-primary-foreground rounded-xl text-sm font-bold shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all"
                    >
                        Apply Filters
                    </button>
                </div>

                {/* KPIs Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <div className="relative overflow-hidden group p-8 bg-card border border-border rounded-3xl shadow-sm hover:shadow-xl hover:border-primary/20 transition-all duration-300">
                        {/* Decorative Background Element */}
                        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -mr-16 -mt-16 group-hover:bg-primary/10 transition-colors"></div>

                        <div className="relative z-10">
                            <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-widest">Total Users</h3>
                            {loading ? (
                                <div className="mt-4 flex items-baseline gap-1">
                                    <div className="h-10 w-24 bg-muted animate-pulse rounded-lg"></div>
                                </div>
                            ) : error ? (
                                <div className="mt-4 text-destructive font-medium bg-destructive/10 p-3 rounded-xl text-sm border border-destructive/20 line-clamp-2">
                                    {error}
                                </div>
                            ) : (
                                <div className="mt-2 flex flex-col">
                                    <span className="text-5xl font-black text-primary tracking-tighter">
                                        {totalUsers?.toLocaleString() ?? 0}
                                    </span>
                                    <span className="text-xs text-muted-foreground mt-1 font-medium italic">
                                        {dateFrom || dateTo ? 'Registered in period' : 'Total registered'}
                                    </span>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="relative overflow-hidden group p-8 bg-card border border-border rounded-3xl shadow-sm hover:shadow-xl hover:border-primary/20 transition-all duration-300">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -mr-16 -mt-16 group-hover:bg-primary/10 transition-colors"></div>
                        <div className="relative z-10">
                            <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-widest">Paid Users</h3>
                            {loading ? (
                                <div className="mt-4 flex items-baseline gap-1">
                                    <div className="h-10 w-24 bg-muted animate-pulse rounded-lg"></div>
                                </div>
                            ) : error ? (
                                <div className="mt-4 text-destructive font-medium bg-destructive/10 p-3 rounded-xl text-sm border border-destructive/20 line-clamp-2">
                                    {error}
                                </div>
                            ) : (
                                <div className="mt-2 flex flex-col">
                                    <span className="text-5xl font-black text-primary tracking-tighter">
                                        {paidUsers?.toLocaleString() ?? 0}
                                    </span>
                                    <span className="text-xs text-muted-foreground mt-1 font-medium italic">
                                        {dateFrom || dateTo ? 'Payer in period' : 'Current active PRO'}
                                    </span>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Placeholder Cards for Future KPIs */}
                    {[1, 2].map((i) => (
                        <div key={i} className="p-8 bg-muted/20 border border-dashed border-border rounded-3xl flex flex-col items-center justify-center text-center opacity-50">
                            <div className="w-10 h-10 bg-muted rounded-full mb-3 shadow-inner"></div>
                            <div className="h-4 w-24 bg-muted rounded mb-2"></div>
                            <div className="h-3 w-32 bg-muted rounded"></div>
                        </div>
                    ))}
                </div>
            </main>
        </div>
    );
}
