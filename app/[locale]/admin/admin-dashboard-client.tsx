'use client';

import { useState, useEffect, useCallback } from 'react';

interface Props {
    locale: string;
    dict: any;
}

interface DeliveryAlert {
    type: 'low_success_rate' | 'finalize_failure' | 'system_stall' | 'reclaim_detected';
    severity: 'warning' | 'critical';
    value: number | null;
}

interface DeliveryMetricSet {
    processed_count: number;
    delivered_count: number;
    send_failed_count: number;
    finalize_failed_count: number;
    stale_reclaim_count: number;
    success_rate: number;
}

interface DeliveryMetricsResponse {
    total: DeliveryMetricSet;
    date: DeliveryMetricSet;
    checkin: DeliveryMetricSet;
    alerts?: DeliveryAlert[];
    health_status: 'healthy' | 'warning' | 'critical';
}

const EMPTY_METRICS: DeliveryMetricSet = {
    processed_count: 0,
    delivered_count: 0,
    send_failed_count: 0,
    finalize_failed_count: 0,
    stale_reclaim_count: 0,
    success_rate: 0
};

export default function AdminDashboardClient({ locale, dict }: Props) {
    const [totalUsers, setTotalUsers] = useState<number | null>(null);
    const [paidUsers, setPaidUsers] = useState<number | null>(null);
    const [storageMB, setStorageMB] = useState<number | null>(null);
    const [deliveryMetrics, setDeliveryMetrics] = useState<DeliveryMetricsResponse | null>(null);
    const [activeTab, setActiveTab] = useState<'total' | 'date' | 'checkin'>('total');
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

            const [resUsers, resPaid, resStorage, resDelivery] = await Promise.all([
                fetch(`/api/admin/kpis/total-users?${params.toString()}`),
                fetch(`/api/admin/kpis/paid-users?${params.toString()}`),
                fetch(`/api/admin/kpis/storage-used?${params.toString()}`),
                fetch(`/api/admin/kpis/delivery?${params.toString()}`)
            ]);

            if (!resUsers.ok) throw new Error('Failed to fetch Total Users KPI');
            if (!resPaid.ok) throw new Error('Failed to fetch Paid Users KPI');
            if (!resStorage.ok) throw new Error('Failed to fetch Storage KPI');

            const [dataUsers, dataPaid, dataStorage] = await Promise.all([
                resUsers.json(),
                resPaid.json(),
                resStorage.json()
            ]);

            setTotalUsers(dataUsers.totalUsers);
            setPaidUsers(dataPaid.paidUsers);
            setStorageMB(dataStorage.storageMB);

            if (resDelivery.ok) {
                const dataDelivery = await resDelivery.json();
                setDeliveryMetrics(dataDelivery);
            } else {
                setDeliveryMetrics(null);
                console.warn('Failed to fetch Delivery Metrics');
            }
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : 'Unknown error');
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

    const activeData = deliveryMetrics ? deliveryMetrics[activeTab] : EMPTY_METRICS;

    return (
        <div className="min-h-screen bg-background text-foreground p-6 sm:p-10 space-y-10 font-sans">
            <header className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-4xl font-extrabold tracking-tight">{dict.admin.title}</h1>
                    <p className="text-muted-foreground mt-2">{dict.admin.users.title}</p>
                </div>
                <div></div>
            </header>

            <main className="max-w-7xl mx-auto space-y-12">
                {/* Filters Row */}
                <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-6 bg-card border border-border rounded-2xl p-6 shadow-sm">
                    <div className="space-y-4 w-full">
                        <div className="flex justify-between items-center">
                            <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">{dict.admin.filters.title}</h3>
                            <button
                                onClick={() => { setDateFrom(''); setDateTo(''); }}
                                className="text-xs text-primary hover:underline"
                            >
                                {dict.admin.filters.clear}
                            </button>
                        </div>
                        <div className="flex flex-wrap gap-4 items-center">
                            <div className="flex flex-col gap-1.5">
                                <label className="text-[10px] uppercase font-bold text-muted-foreground/70 ml-1">{dict.admin.filters.fromDate}</label>
                                <input
                                    type="date"
                                    value={dateFrom}
                                    onChange={(e) => setDateFrom(e.target.value)}
                                    className="bg-background border border-border rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all cursor-pointer"
                                />
                            </div>
                            <div className="flex flex-col gap-1.5">
                                <label className="text-[10px] uppercase font-bold text-muted-foreground/70 ml-1">{dict.admin.filters.toDate}</label>
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
                                    {dict.admin.presets.today}
                                </button>
                                <button
                                    onClick={() => handlePreset('month')}
                                    className="px-4 py-2 text-xs bg-muted hover:bg-muted/80 rounded-xl transition font-medium"
                                >
                                    {dict.admin.presets.thisMonth}
                                </button>
                            </div>
                        </div>
                    </div>
                    <button
                        onClick={fetchKPI}
                        className="w-full lg:w-auto px-8 py-3 bg-primary text-primary-foreground rounded-xl text-sm font-bold shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all"
                    >
                        {dict.admin.actions.refresh}
                    </button>
                </div>

                {/* Main KPIs Section */}
                <div className="space-y-6">
                    <h2 className="text-xl font-bold tracking-tight px-1 flex items-center gap-2">
                        <span className="w-1.5 h-6 bg-primary rounded-full"></span>
                        {dict.admin.sidebar.dashboard}
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        <KPICard title={dict.admin.kpis.totalUsers} value={totalUsers} loading={loading} error={error} subtext={dateFrom || dateTo ? dict.admin.kpis.inRange : dict.admin.kpis.today} />
                        <KPICard title={dict.admin.kpis.paidUsers} value={paidUsers} loading={loading} error={error} subtext={dateFrom || dateTo ? dict.admin.kpis.inRange : dict.admin.kpis.active} />
                        <KPICard title={`${dict.admin.kpis.storageUsed} (MB)`} value={storageMB} loading={loading} error={error} subtext={dateFrom || dateTo ? dict.admin.kpis.inRange : dict.admin.kpis.today} />
                    </div>
                </div>

                {/* Delivery Health Block */}
                {deliveryMetrics && (
                    <div className="pt-4 px-1">
                        <div className={`flex items-center justify-between p-4 rounded-2xl border shadow-sm ${
                            deliveryMetrics.health_status === 'critical' ? 'bg-destructive/10 border-destructive/20 text-destructive' :
                            deliveryMetrics.health_status === 'warning' ? 'bg-amber-500/10 border-amber-500/20 text-amber-600 dark:text-amber-500' :
                            'bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-500'
                        }`}>
                            <div className="flex items-center gap-3">
                                {deliveryMetrics.health_status === 'critical' && (
                                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                    </svg>
                                )}
                                {deliveryMetrics.health_status === 'warning' && (
                                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                    </svg>
                                )}
                                {deliveryMetrics.health_status === 'healthy' && (
                                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                )}
                                <div>
                                    <h3 className="text-xs font-bold uppercase tracking-widest opacity-80">{dict.admin.delivery.health.title}</h3>
                                    <p className="text-lg font-extrabold">{dict.admin.delivery.health[deliveryMetrics.health_status]}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Delivery Alerts Section */}
                {deliveryMetrics?.alerts && deliveryMetrics.alerts.length > 0 && (
                    <div className="space-y-4 pt-4">
                        <h3 className="text-sm font-bold tracking-widest text-muted-foreground uppercase px-1">{dict.admin.delivery.alerts.title}</h3>
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                            {deliveryMetrics.alerts.map((alert, idx) => (
                                <div key={idx} className={`p-5 rounded-2xl border flex items-start gap-4 shadow-sm ${
                                    alert.severity === 'critical' ? 'bg-destructive/10 border-destructive/20 text-destructive' : 'bg-amber-500/10 border-amber-500/20 text-amber-600 dark:text-amber-500'
                                }`}>
                                    <div className="mt-0.5">
                                        {alert.severity === 'critical' ? (
                                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                            </svg>
                                        ) : (
                                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                            </svg>
                                        )}
                                    </div>
                                    <div className="flex flex-col gap-1">
                                        <span className="font-bold text-xs uppercase tracking-wider opacity-90">
                                            {alert.severity}
                                        </span>
                                        <p className="text-sm font-medium leading-snug">
                                            {dict.admin.delivery.alerts[alert.type].replace('{value}', String(alert.value ?? 0))}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Delivery Metrics Section */}
                <div className="space-y-6 pt-4">
                    <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 px-1">
                        <h2 className="text-xl font-bold tracking-tight flex items-center gap-2">
                            <span className="w-1.5 h-6 bg-primary rounded-full"></span>
                            {dict.admin.delivery.title}
                        </h2>
                        {/* Tabs Navigation */}
                        <div className="flex bg-muted p-1 rounded-xl w-fit">
                            {(['total', 'date', 'checkin'] as const).map((tab) => (
                                <button
                                    key={tab}
                                    onClick={() => setActiveTab(tab)}
                                    className={`px-4 py-1.5 text-xs font-bold transition-all rounded-lg ${
                                        activeTab === tab 
                                        ? "bg-card text-foreground shadow-sm" 
                                        : "text-muted-foreground hover:text-foreground"
                                    }`}
                                >
                                    {dict.admin.delivery.tabs[tab]}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
                        <DeliveryStatCard label={dict.admin.delivery.stats.processed} value={activeData.processed_count} loading={loading} />
                        <DeliveryStatCard label={dict.admin.delivery.stats.delivered} value={activeData.delivered_count} variant="success" loading={loading} />
                        <DeliveryStatCard label={dict.admin.delivery.stats.sendFailed} value={activeData.send_failed_count} variant="danger" loading={loading} />
                        <DeliveryStatCard label={dict.admin.delivery.stats.finalizeFailed} value={activeData.finalize_failed_count} variant="warning" loading={loading} />
                        <DeliveryStatCard label={dict.admin.delivery.stats.staleReclaims} value={activeData.stale_reclaim_count} loading={loading} />
                        <DeliveryStatCard label={dict.admin.delivery.stats.successRate} value={`${activeData.success_rate}%`} variant="highlight" loading={loading} />
                    </div>
                </div>
            </main>
        </div>
    );
}

function KPICard({ title, value, loading, error, subtext }: { title: string, value: number | null, loading: boolean, error: string | null, subtext: string }) {
    return (
        <div className="relative overflow-hidden group p-8 bg-card border border-border rounded-3xl shadow-sm hover:shadow-xl hover:border-primary/20 transition-all duration-300">
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -mr-16 -mt-16 group-hover:bg-primary/10 transition-colors"></div>
            <div className="relative z-10">
                <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-widest">{title}</h3>
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
                            {value?.toLocaleString() ?? 0}
                        </span>
                        <span className="text-xs text-muted-foreground mt-1 font-medium italic">
                            {subtext}
                        </span>
                    </div>
                )}
            </div>
        </div>
    );
}

function DeliveryStatCard({ label, value, loading, variant = 'default' }: { label: string, value: string | number, loading: boolean, variant?: 'default' | 'success' | 'danger' | 'warning' | 'highlight' }) {
    const variants = {
        default: "text-foreground",
        success: "text-emerald-500",
        danger: "text-rose-500",
        warning: "text-amber-500",
        highlight: "text-primary"
    };

    return (
        <div className="bg-card border border-border rounded-2xl p-6 shadow-sm flex flex-col justify-between min-h-[120px] group hover:border-primary/20 transition-all">
            <h4 className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">{label}</h4>
            {loading ? (
                <div className="h-6 w-16 bg-muted animate-pulse rounded-md mt-2"></div>
            ) : (
                <span className={`text-2xl font-black tracking-tight mt-1 ${variants[variant]}`}>
                    {value}
                </span>
            )}
        </div>
    );
}

