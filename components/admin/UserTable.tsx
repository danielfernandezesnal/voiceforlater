'use client';

import { useState, useEffect, useCallback } from 'react';

interface UserData {
    user_id: string;
    email: string;
    created_at: string;
    plan: string;
    status: string;
    messages_count: number;
    contacts_count: number;
    storage_mb: number;
    emails_sent: number;
}

export default function UserTable() {
    const [users, setUsers] = useState<UserData[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);

    // Filters
    const [search, setSearch] = useState('');
    const [plan, setPlan] = useState('');
    const [statusFilter, setStatusFilter] = useState('');

    const fetchUsers = useCallback(async (pageNum: number, currentSearch: string, currentPlan: string, currentStatus: string) => {
        setLoading(true);
        try {
            const params = new URLSearchParams({
                page: pageNum.toString(),
                limit: '50',
                search: currentSearch,
                plan: currentPlan,
                status: currentStatus
            });

            const res = await fetch(`/api/admin/users?${params.toString()}`);
            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || 'Failed to fetch users');
            }
            const data = await res.json();

            if (pageNum === 1) {
                setUsers(data);
            } else {
                setUsers(prev => [...prev, ...data]);
            }

            // If we got less than 50, there are no more users
            if (data.length < 50) {
                setHasMore(false);
            } else {
                setHasMore(true);
            }
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : 'An unknown error occurred');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        setPage(1);
        fetchUsers(1, search, plan, statusFilter);
    }, [search, plan, statusFilter, fetchUsers]);

    const loadMore = () => {
        const nextPage = page + 1;
        setPage(nextPage);
        fetchUsers(nextPage, search, plan, statusFilter);
    };

    if (error) {
        return (
            <div className="bg-destructive/10 border border-destructive/20 rounded-2xl p-6 text-destructive text-center">
                <p className="font-bold">Error loading users</p>
                <p className="text-sm opacity-80">{error}</p>
                <button
                    onClick={() => { setError(null); setPage(1); fetchUsers(1, search, plan, statusFilter); }}
                    className="mt-4 px-4 py-2 bg-destructive text-destructive-foreground rounded-lg text-sm font-medium"
                >
                    Retry
                </button>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Filter Bar */}
            <div className="flex flex-col md:flex-row gap-4 bg-card border border-border p-4 rounded-2xl shadow-sm">
                <div className="flex-1 relative">
                    <input
                        type="text"
                        placeholder="Search by email..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 bg-muted/50 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                    />
                    <div className="absolute left-3 top-2.5 text-muted-foreground">
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
                    </div>
                </div>

                <div className="flex flex-wrap gap-4">
                    <select
                        value={plan}
                        onChange={(e) => setPlan(e.target.value)}
                        className="px-4 py-2 bg-muted/50 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all cursor-pointer"
                    >
                        <option value="">All Plans</option>
                        <option value="free">Free</option>
                        <option value="pro">Pro</option>
                    </select>

                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="px-4 py-2 bg-muted/50 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all cursor-pointer"
                    >
                        <option value="">All Status</option>
                        <option value="active">Active</option>
                        <option value="trialing">Trialing</option>
                        <option value="past_due">Past Due</option>
                        <option value="canceled">Canceled</option>
                        <option value="inactive">Inactive</option>
                    </select>
                </div>
            </div>

            <div className="overflow-x-auto bg-card border border-border rounded-3xl shadow-sm">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="border-b border-border bg-muted/30">
                            <th className="px-6 py-4 text-xs font-bold uppercase tracking-widest text-muted-foreground">Email</th>
                            <th className="px-6 py-4 text-xs font-bold uppercase tracking-widest text-muted-foreground">Created</th>
                            <th className="px-6 py-4 text-xs font-bold uppercase tracking-widest text-muted-foreground text-center">Plan</th>
                            <th className="px-6 py-4 text-xs font-bold uppercase tracking-widest text-muted-foreground text-center">Status</th>
                            <th className="px-6 py-4 text-xs font-bold uppercase tracking-widest text-muted-foreground text-center">Stats</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                        {users.map((user) => (
                            <tr key={user.user_id} className="hover:bg-muted/30 transition-colors group">
                                <td className="px-6 py-4">
                                    <div className="flex flex-col">
                                        <span className="font-medium text-foreground">{user.email}</span>
                                        <span className="text-[10px] text-muted-foreground/60 font-mono tracking-tighter uppercase group-hover:text-muted-foreground transition-colors">
                                            {user.user_id}
                                        </span>
                                    </div>
                                </td>
                                <td className="px-6 py-4 text-sm text-muted-foreground whitespace-nowrap">
                                    {new Date(user.created_at).toLocaleDateString(undefined, {
                                        year: 'numeric',
                                        month: 'short',
                                        day: 'numeric'
                                    })}
                                </td>
                                <td className="px-6 py-4 text-center">
                                    <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider ${user.plan === 'pro'
                                        ? 'bg-primary/10 text-primary border border-primary/20'
                                        : 'bg-muted text-muted-foreground border border-border'
                                        }`}>
                                        {user.plan}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-center">
                                    <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider ${user.status === 'active' || user.status === 'trialing'
                                        ? 'bg-green-100/50 text-green-700 border border-green-200'
                                        : 'bg-yellow-100/50 text-yellow-700 border border-yellow-200'
                                        }`}>
                                        {user.status}
                                    </span>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="flex items-center justify-center gap-4 text-xs">
                                        <div className="flex flex-col items-center group/stat" title="Messages">
                                            <span className="font-bold text-foreground">{user.messages_count}</span>
                                            <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-tighter">msgs</span>
                                        </div>
                                        <div className="w-px h-6 bg-border"></div>
                                        <div className="flex flex-col items-center group/stat" title="Storage">
                                            <span className="font-bold text-foreground">{user.storage_mb}</span>
                                            <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-tighter">mb</span>
                                        </div>
                                        <div className="w-px h-6 bg-border"></div>
                                        <div className="flex flex-col items-center group/stat" title="Emails Sent">
                                            <span className="font-bold text-foreground">{user.emails_sent}</span>
                                            <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-tighter">logs</span>
                                        </div>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                {loading && users.length === 0 && (
                    <div className="p-20 flex flex-col items-center justify-center gap-4">
                        <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
                        <p className="text-sm text-muted-foreground font-medium animate-pulse">Loading users...</p>
                    </div>
                )}

                {!loading && users.length === 0 && (
                    <div className="p-20 text-center">
                        <p className="text-muted-foreground font-medium">No users found.</p>
                    </div>
                )}
            </div>

            {hasMore && !loading && users.length > 0 && (
                <div className="flex justify-center pt-4">
                    <button
                        onClick={loadMore}
                        className="px-8 py-3 bg-card border border-border rounded-xl text-sm font-bold shadow-sm hover:bg-muted transition-all active:scale-[0.98]"
                    >
                        Load More Users
                    </button>
                </div>
            )}

            {loading && users.length > 0 && (
                <div className="flex justify-center pt-4">
                    <div className="flex items-center gap-2 text-muted-foreground">
                        <div className="w-4 h-4 border-2 border-muted-foreground/20 border-t-muted-foreground rounded-full animate-spin"></div>
                        <span className="text-xs font-bold uppercase tracking-widest">Loading more...</span>
                    </div>
                </div>
            )}
        </div>
    );
}
