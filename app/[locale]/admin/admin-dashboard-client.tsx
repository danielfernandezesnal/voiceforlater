'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import type { Dictionary } from '@/lib/i18n';
import { getTodayInChicago, getDateDaysAgoInChicago, getMonthRangeInChicago } from '@/lib/admin/date-utils';

interface KPIs {
    total_users: number;
    paid_users: number;
    storage_mb: number;
    emails_sent: number;
}

interface User {
    id: string;
    email: string;
    plan: string;
    status: string; // 'plan (status)' format from API
    messages_count: number;
    contacts_count: number;
    storage_mb: number;
    emails_sent: number;
    created_at: string;
}


interface AnalyticsData {
    counts: Record<string, number>;
    funnel: {
        signups: number;
        activations: number;
        checkouts: number;
        conversions: number;
    };
    rates: {
        activation: number;
        conversion: number;
    };
}

interface AdminDashboardClientProps {
    initialFrom?: string;
    initialTo?: string;
    initialSearch?: string;
    initialOffset?: number;
    initialTab?: string;
    dict: Dictionary;
}

type SortCol = 'created_at' | 'emails_sent' | 'storage_mb';
type Tab = 'kpis' | 'analytics';

const DEBOUNCE_DELAY = 500;

export default function AdminDashboardClient({
    initialFrom, initialTo, initialSearch, initialOffset, initialTab, dict
}: AdminDashboardClientProps) {
    const router = useRouter();
    const t = dict.admin;
    const searchParams = useSearchParams();

    // State managed by URL mostly, but local state for inputs
    const [dateFrom, setDateFrom] = useState(initialFrom || getDateDaysAgoInChicago(30));
    const [dateTo, setDateTo] = useState(initialTo || getTodayInChicago());
    const [search, setSearch] = useState(initialSearch || '');
    const [debouncedSearch, setDebouncedSearch] = useState(initialSearch || '');
    const [activeTab, setActiveTab] = useState<Tab>((initialTab as Tab) || 'kpis');

    // UI State
    const [kpis, setKpis] = useState<KPIs | null>(null);
    const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [lastUpdated, setLastUpdated] = useState<string | null>(null);
    const [exporting, setExporting] = useState(false);
    const [selectedUser, setSelectedUser] = useState<User | null>(null);
    const [copiedId, setCopiedId] = useState<string | null>(null);

    // Sorting State (Client-side)
    const [sortCol, setSortCol] = useState<SortCol>('created_at');
    const [sortAsc, setSortAsc] = useState(false);

    // Request Abort Controller
    const abortControllerRef = useRef<AbortController | null>(null);

    // Debounce Search
    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedSearch(search);
        }, DEBOUNCE_DELAY);
        return () => clearTimeout(handler);
    }, [search]);

    // Formatters
    const fmtNum = (n: number) => new Intl.NumberFormat('en-US').format(n);
    const fmtDate = (d: string) => new Date(d).toLocaleDateString();

    const fetchAllData = useCallback(async (from: string, to: string, q: string) => {
        // Abort previous request if any
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
        }
        const ac = new AbortController();
        abortControllerRef.current = ac;

        setError(null);
        setLoading(true);

        const kpiQuery = new URLSearchParams({ from, to });
        const usersQuery = new URLSearchParams({ from, to, limit: '25', search: q });
        const analyticsQuery = new URLSearchParams({ from, to });

        try {
            const requests = [
                fetch(`/api/admin/kpis?${kpiQuery}`, { signal: ac.signal }),
                fetch(`/api/admin/users?${usersQuery}`, { signal: ac.signal })
            ];

            if (activeTab === 'analytics') {
                requests.push(fetch(`/api/admin/analytics?${analyticsQuery}`, { signal: ac.signal }));
            }

            const responses = await Promise.all(requests);

            // Check auth on critical endpoints
            if (responses.some(r => r.status === 403)) {
                setError("Authorized Access Required");
                setKpis(null);
                setUsers([]);
                setAnalytics(null);
                return;
            }

            if (responses.some(r => !r.ok)) throw new Error('Failed to fetch data');

            const kpiData = await responses[0].json();
            const userData = await responses[1].json();

            setKpis(kpiData);
            setUsers(userData);

            if (activeTab === 'analytics' && responses[2]) {
                const analyticsDataBuffer = await responses[2].json();
                setAnalytics(analyticsDataBuffer);
            }

            setLastUpdated(new Date().toLocaleTimeString());
        } catch (err: unknown) {
            if (err instanceof Error && err.name === 'AbortError') return;
            console.error(err);
            const msg = err instanceof Error ? err.message : 'Error occurred';
            setError(msg);
        } finally {
            if (!ac.signal.aborted) {
                setLoading(false);
                abortControllerRef.current = null;
            }
        }
    }, [activeTab]);

    // Effect: Update URL and Fetch
    useEffect(() => {
        const params = new URLSearchParams();
        if (dateFrom) params.set('from', dateFrom);
        if (dateTo) params.set('to', dateTo);
        if (debouncedSearch) params.set('search', debouncedSearch);
        if (activeTab !== 'kpis') params.set('tab', activeTab);

        router.push(`?${params.toString()}`, { scroll: false });
        // Don't trigger fetch here, fetchAllData dependency handles it if we included it?
        // Actually fetchAllData depends on activeTab.
        // And this effect depends on activeTab.
        // So safe to call.
        fetchAllData(dateFrom, dateTo, debouncedSearch);
    }, [dateFrom, dateTo, debouncedSearch, activeTab, fetchAllData, router]);


    // Sorting Logic
    const sortedUsers = [...users].sort((a, b) => {
        let valA: string | number = a[sortCol];
        let valB: string | number = b[sortCol];

        if (sortCol === 'storage_mb') {
            valA = parseFloat(String(a.storage_mb));
            valB = parseFloat(String(b.storage_mb));
        }

        if (valA < valB) return sortAsc ? -1 : 1;
        if (valA > valB) return sortAsc ? 1 : -1;
        return 0;
    });

    const handleSort = (col: SortCol) => {
        if (sortCol === col) setSortAsc(!sortAsc);
        else {
            setSortCol(col);
            setSortAsc(false); // Default desc
        }
    };

    const handleCopy = (text: string, id: string) => {
        navigator.clipboard.writeText(text);
        setCopiedId(id);
        setTimeout(() => setCopiedId(null), 2000);
    };

    const handleExport = () => {
        if (exporting) return;
        setExporting(true);
        const params = new URLSearchParams({ from: dateFrom, to: dateTo, search: debouncedSearch });
        // Use window.location for download
        window.location.href = `/api/admin/users/export?${params.toString()}`;
        // Simulate loading end after a delay, as we can't track download completion easily
        setTimeout(() => setExporting(false), 2000);
    };

    const applyPreset = (days?: number, type?: 'month' | 'lastMonth') => {
        let from = getTodayInChicago();
        let to = getTodayInChicago();

        if (type === 'month') {
            const range = getMonthRangeInChicago('thisMonth');
            from = range.from;
            to = range.to;
        } else if (type === 'lastMonth') {
            const range = getMonthRangeInChicago('lastMonth');
            from = range.from;
            to = range.to;
        } else if (days !== undefined) {
            if (days === 0) {
                // Today
                from = getTodayInChicago();
                to = getTodayInChicago();
            } else {
                from = getDateDaysAgoInChicago(days);
                to = getTodayInChicago();
            }
        }

        setDateFrom(from);
        setDateTo(to);
    };

    const handleReset = () => {
        setDateFrom(getDateDaysAgoInChicago(30));
        setDateTo(getTodayInChicago());
        setSearch('');
        setDebouncedSearch('');
    };

    if (error === "Authorized Access Required") {
        return (
            <div className="flex flex-col items-center justify-center min-h-[50vh] text-center">
                <h1 className="text-2xl font-bold text-destructive mb-2">{t.accessDenied.title}</h1>
                <p className="text-muted-foreground">{t.accessDenied.message}</p>
            </div>
        );
    }

    return (
        <div className="container mx-auto px-4 py-8 space-y-8 max-w-7xl">
            {/* Header & Actions */}
            <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-foreground">{t.title}</h1>
                    {lastUpdated && (
                        <p className="text-xs text-muted-foreground mt-1">Updated: {lastUpdated}</p>
                    )}
                </div>

                <div className="flex flex-col md:flex-row gap-4 w-full xl:w-auto">
                    {/* Date Presets & Filter */}
                    <div className="flex flex-col sm:flex-row gap-2 items-start sm:items-center bg-card border border-border p-2 rounded-lg shadow-sm">
                        <div className="flex gap-1 text-xs overflow-x-auto max-w-[300px] sm:max-w-none pb-1 sm:pb-0">
                            <button onClick={() => applyPreset(0)} className="px-2 py-1 bg-muted/50 hover:bg-muted rounded text-foreground whitespace-nowrap">{t.presets.today}</button>
                            <button onClick={() => applyPreset(7)} className="px-2 py-1 bg-muted/50 hover:bg-muted rounded text-foreground whitespace-nowrap">{t.presets.last7}</button>
                            <button onClick={() => applyPreset(30)} className="px-2 py-1 bg-muted/50 hover:bg-muted rounded text-foreground whitespace-nowrap">{t.presets.last30}</button>
                            <button onClick={() => applyPreset(undefined, 'month')} className="px-2 py-1 bg-muted/50 hover:bg-muted rounded text-foreground whitespace-nowrap">{t.presets.thisMonth}</button>
                        </div>
                        <div className="h-4 w-px bg-border hidden sm:block"></div>
                        <div className="flex items-center gap-2">
                            <input
                                type="date"
                                value={dateFrom}
                                onChange={e => setDateFrom(e.target.value)}
                                className="bg-transparent text-sm px-2 py-1 focus:outline-none w-32"
                            />
                            <span className="text-muted-foreground">-</span>
                            <input
                                type="date"
                                value={dateTo}
                                onChange={e => setDateTo(e.target.value)}
                                className="bg-transparent text-sm px-2 py-1 focus:outline-none w-32"
                            />
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-2">
                        <button
                            onClick={handleReset}
                            className="px-3 py-2 text-sm border border-border rounded-lg hover:bg-muted transition-colors"
                        >
                            {t.actions.reset}
                        </button>
                        <button
                            onClick={() => fetchAllData(dateFrom, dateTo, debouncedSearch)}
                            className="px-3 py-2 text-sm border border-border rounded-lg hover:bg-muted transition-colors"
                        >
                            {t.actions.refresh}
                        </button>
                        <button
                            onClick={handleExport}
                            disabled={exporting}
                            className="px-3 py-2 text-sm bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-70 flex items-center gap-2"
                        >
                            {/* Simple generic download icon */}
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                            {exporting ? '...' : t.actions.export}
                        </button>
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-4 border-b border-border">
                <button
                    onClick={() => setActiveTab('kpis')}
                    className={`px-4 py-2 border-b-2 transition-colors ${activeTab === 'kpis' ? 'border-primary text-primary font-medium' : 'border-transparent text-muted-foreground hover:text-foreground'}`}
                >
                    KPIs & Users
                </button>
                <button
                    onClick={() => setActiveTab('analytics')}
                    className={`px-4 py-2 border-b-2 transition-colors ${activeTab === 'analytics' ? 'border-primary text-primary font-medium' : 'border-transparent text-muted-foreground hover:text-foreground'}`}
                >
                    {t.analytics.title}
                </button>
            </div>

            {/* Analytics Tab */}
            {activeTab === 'analytics' && analytics && (
                <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <KPICard title={t.analytics.rates.activation} value={analytics.rates.activation + '%'} loading={loading} />
                        <KPICard title={t.analytics.rates.conversion} value={analytics.rates.conversion + '%'} loading={loading} highlight />
                        <KPICard title={t.analytics.steps.signup} value={analytics.funnel.signups} loading={loading} />
                        <KPICard title={t.analytics.steps.conversion} value={analytics.funnel.conversions} loading={loading} />
                    </div>

                    <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
                        <h3 className="text-lg font-semibold mb-4">{t.analytics.events}</h3>
                        <div className="space-y-2">
                            {Object.entries(analytics.counts).sort((a, b) => b[1] - a[1]).map(([key, val]) => (
                                <div key={key} className="flex justify-between items-center py-2 border-b border-border/50 last:border-0 hover:bg-muted/50 px-2 rounded transition-colors">
                                    <span className="text-sm font-medium">{key}</span>
                                    <span className="text-sm font-mono bg-muted px-2 py-0.5 rounded">{new Intl.NumberFormat().format(val)}</span>
                                </div>
                            ))}
                            {Object.keys(analytics.counts).length === 0 && (
                                <p className="text-muted-foreground text-sm italic py-4 text-center">No events found in this range.</p>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* KPI Tab */}
            {activeTab === 'kpis' && (
                <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
                    {/* KPI Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <KPICard title={t.kpis.totalUsers} value={kpis?.total_users} loading={loading} />
                        <KPICard title={t.kpis.paidUsers} value={kpis?.paid_users} loading={loading} highlight />
                        <KPICard title={t.kpis.storageUsed} value={kpis ? `${kpis.storage_mb} MB` : undefined} loading={loading} />
                        <KPICard title={t.kpis.emailsSent} value={kpis?.emails_sent} loading={loading} />
                    </div>

                    {/* User List */}
                    <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
                        <div className="p-4 border-b border-border flex flex-col sm:flex-row justify-between items-center bg-muted/30 gap-4">
                            <h2 className="font-semibold text-lg">{t.users.title}</h2>
                            <input
                                type="text"
                                placeholder={t.users.searchPlaceholder}
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                                className="px-3 py-1.5 text-sm border border-border rounded-md bg-background focus:ring-1 focus:ring-primary outline-none w-full sm:w-64 transition cursor-text placeholder:text-muted-foreground"
                            />
                        </div>

                        <div className="overflow-x-auto min-h-[300px]">
                            <table className="w-full text-sm text-left">
                                <thead className="text-xs uppercase bg-muted/50 text-muted-foreground sticky top-0">
                                    <tr>
                                        <th className="px-6 py-3 font-medium">{t.users.table.email}</th>
                                        <th className="px-6 py-3 font-medium cursor-pointer hover:text-foreground" onClick={() => handleSort('created_at')}>
                                            {t.users.table.joined} {sortCol === 'created_at' && (sortAsc ? '↑' : '↓')}
                                        </th>
                                        <th className="px-6 py-3 font-medium center">{t.users.table.plan}</th>
                                        <th className="px-6 py-3 font-medium text-right">{t.users.table.messages}</th>
                                        <th className="px-6 py-3 font-medium text-right cursor-pointer hover:text-foreground" onClick={() => handleSort('storage_mb')}>
                                            {t.users.table.storage} {sortCol === 'storage_mb' && (sortAsc ? '↑' : '↓')}
                                        </th>
                                        <th className="px-6 py-3 font-medium text-right cursor-pointer hover:text-foreground" onClick={() => handleSort('emails_sent')}>
                                            {t.users.table.emails} {sortCol === 'emails_sent' && (sortAsc ? '↑' : '↓')}
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border">
                                    {loading ? (
                                        Array(5).fill(0).map((_, i) => (
                                            <tr key={i} className="animate-pulse">
                                                <td className="px-6 py-4"><div className="h-4 bg-muted rounded w-32"></div></td>
                                                <td className="px-6 py-4"><div className="h-4 bg-muted rounded w-24"></div></td>
                                                <td className="px-6 py-4"><div className="h-4 bg-muted rounded w-16"></div></td>
                                                <td className="px-6 py-4 text-right"><div className="h-4 bg-muted rounded w-8 ml-auto"></div></td>
                                                <td className="px-6 py-4 text-right"><div className="h-4 bg-muted rounded w-12 ml-auto"></div></td>
                                                <td className="px-6 py-4 text-right"><div className="h-4 bg-muted rounded w-8 ml-auto"></div></td>
                                            </tr>
                                        ))
                                    ) : sortedUsers.length === 0 ? (
                                        <tr>
                                            <td colSpan={6} className="px-6 py-8 text-center text-muted-foreground">
                                                {t.users.noResults}
                                            </td>
                                        </tr>
                                    ) : (
                                        sortedUsers.map(user => (
                                            <tr
                                                key={user.id}
                                                onClick={() => setSelectedUser(user)}
                                                className="hover:bg-muted/5 transition-colors cursor-pointer group"
                                            >
                                                <td className="px-6 py-3 font-medium text-foreground relative">
                                                    {user.email}
                                                    <div
                                                        className="text-[10px] text-muted-foreground font-mono group-hover:text-primary transition-colors"
                                                        onClick={(e) => { e.stopPropagation(); handleCopy(user.id, `id-${user.id}`); }}
                                                        title={t.actions.copy}
                                                    >
                                                        {user.id} {copiedId === `id-${user.id}` && <span className="text-success ml-1">{t.actions.copied}</span>}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-3 text-muted-foreground tabular-nums">{fmtDate(user.created_at)}</td>
                                                <td className="px-6 py-3">
                                                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium capitalize ${user.plan?.includes('pro') ? 'bg-indigo-100 text-indigo-800' : 'bg-gray-100 text-gray-800'
                                                        }`}>
                                                        {user.plan}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-3 text-right tabular-nums">{fmtNum(user.messages_count)}</td>
                                                <td className="px-6 py-3 text-right tabular-nums">{user.storage_mb} MB</td>
                                                <td className="px-6 py-3 text-right tabular-nums">{fmtNum(user.emails_sent)}</td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}

            {/* Drilldown Modal (Simple Overlay) */}
            {selectedUser && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setSelectedUser(null)}>
                    <div className="bg-card w-full max-w-lg rounded-xl shadow-lg border border-border p-6 space-y-4" onClick={e => e.stopPropagation()}>
                        <div className="flex justify-between items-start">
                            <h2 className="text-xl font-bold">{t.userDetail.title}</h2>
                            <button onClick={() => setSelectedUser(null)} className="text-muted-foreground hover:text-foreground">✕</button>
                        </div>

                        <div className="space-y-3">
                            <div>
                                <label className="text-xs text-muted-foreground block mb-1 uppercase">{t.userDetail.email}</label>
                                <div className="flex items-center gap-2">
                                    <span className="font-medium text-lg">{selectedUser.email}</span>
                                    <button onClick={() => handleCopy(selectedUser.email, 'email')} className="text-primary text-xs hover:underline">
                                        {copiedId === 'email' ? t.actions.copied : t.actions.copy}
                                    </button>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs text-muted-foreground block mb-1 uppercase">{t.userDetail.id}</label>
                                    <span className="text-xs font-mono bg-muted p-1 rounded block truncate" title={selectedUser.id}>{selectedUser.id}</span>
                                </div>
                                <div>
                                    <label className="text-xs text-muted-foreground block mb-1 uppercase">{t.userDetail.created}</label>
                                    <span>{fmtDate(selectedUser.created_at)}</span>
                                </div>
                                <div>
                                    <label className="text-xs text-muted-foreground block mb-1 uppercase">{t.userDetail.plan}</label>
                                    <span className="capitalize">{selectedUser.plan}</span>
                                </div>
                                <div>
                                    <label className="text-xs text-muted-foreground block mb-1 uppercase">{t.userDetail.status}</label>
                                    <span className="capitalize">{selectedUser.status}</span>
                                </div>
                            </div>

                            <hr className="border-border" />
                            <h3 className="font-semibold text-sm text-foreground">{t.userDetail.stats}</h3>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="bg-muted/30 p-3 rounded">
                                    <span className="block text-2xl font-bold">{selectedUser.messages_count}</span>
                                    <span className="text-xs text-muted-foreground">{t.userDetail.messages}</span>
                                </div>
                                <div className="bg-muted/30 p-3 rounded">
                                    <span className="block text-2xl font-bold">{selectedUser.contacts_count}</span>
                                    <span className="text-xs text-muted-foreground">{t.userDetail.contacts}</span>
                                </div>
                                <div className="bg-muted/30 p-3 rounded">
                                    <span className="block text-2xl font-bold">{selectedUser.storage_mb} <span className="text-sm font-normal">MB</span></span>
                                    <span className="text-xs text-muted-foreground">{t.userDetail.storage}</span>
                                </div>
                                <div className="bg-muted/30 p-3 rounded">
                                    <span className="block text-2xl font-bold">{selectedUser.emails_sent}</span>
                                    <span className="text-xs text-muted-foreground">{t.userDetail.emails}</span>
                                </div>
                            </div>
                        </div>

                        <div className="flex justify-end pt-2">
                            <button
                                onClick={() => setSelectedUser(null)}
                                className="px-4 py-2 border border-border rounded hover:bg-muted text-sm"
                            >
                                {t.actions.close}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

function KPICard({ title, value, loading, highlight }: { title: string, value?: string | number, loading: boolean, highlight?: boolean }) {
    return (
        <div className={`p-6 rounded-xl border shadow-sm transition-all ${highlight ? 'bg-primary/5 border-primary/20' : 'bg-card border-border'
            }`}>
            <h3 className="text-sm font-medium text-muted-foreground mb-1 uppercase tracking-wide">{title}</h3>
            {loading ? (
                <div className="h-8 w-24 bg-muted animate-pulse rounded"></div>
            ) : (
                <div className={`text-3xl font-bold ${highlight ? 'text-primary' : 'text-foreground'}`}>
                    {typeof value === 'number' ? new Intl.NumberFormat('en-US').format(value) : (value ?? '-')}
                </div>
            )}
        </div>
    );
}
