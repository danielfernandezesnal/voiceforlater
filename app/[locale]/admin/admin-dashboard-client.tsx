'use client'

import { useState, useEffect, useCallback } from 'react'

interface KPIs {
    totalUsers: number
    usersToday: number
    paidUsers: number
    paidToday: number
    totalStorageMB: number
    emailsSent: number
    emailsToday: number
}

interface User {
    id: string
    email: string
    plan: string
    isPro: boolean
    textMessages: number
    audioMessages: number
    videoMessages: number
    storageMB: string
    createdAt: string
}

export default function AdminDashboardClient() {
    const [kpis, setKpis] = useState<KPIs | null>(null)
    const [users, setUsers] = useState<User[]>([])
    const [loading, setLoading] = useState(true)
    const [dateFrom, setDateFrom] = useState('')
    const [dateTo, setDateTo] = useState('')
    const [search, setSearch] = useState('')
    const [page, setPage] = useState(1)
    const [totalPages, setTotalPages] = useState(1)
    const [editingUser, setEditingUser] = useState<User | null>(null)
    const [newEmail, setNewEmail] = useState('')
    const [deletingUserId, setDeletingUserId] = useState<string | null>(null)

    // Load KPIs
    const loadKPIs = useCallback(async () => {
        try {
            const params = new URLSearchParams()
            if (dateFrom) params.set('from', dateFrom)
            if (dateTo) params.set('to', dateTo)

            const res = await fetch(`/api/admin/kpis?${params}`)
            if (res.ok) {
                const data = await res.json()
                setKpis(data)
            }
        } catch (error) {
            console.error('Failed to load KPIs:', error)
        }
    }, [dateFrom, dateTo])

    // Load users
    const loadUsers = useCallback(async () => {
        try {
            setLoading(true)
            const params = new URLSearchParams()
            if (search) params.set('search', search)
            if (dateFrom) params.set('from', dateFrom)
            if (dateTo) params.set('to', dateTo)
            params.set('page', page.toString())
            params.set('pageSize', '25')

            const res = await fetch(`/api/admin/users?${params}`)
            if (res.ok) {
                const data = await res.json()
                setUsers(data.users)
                setTotalPages(data.pagination.totalPages)
            }
        } catch (error) {
            console.error('Failed to load users:', error)
        } finally {
            setLoading(false)
        }
    }, [search, dateFrom, dateTo, page])

    // Delete user
    const handleDeleteUser = async (userId: string) => {
        if (!confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
            return
        }

        try {
            setDeletingUserId(userId)
            const res = await fetch(`/api/admin/users/${userId}`, {
                method: 'DELETE',
            })

            if (res.ok) {
                alert('User deleted successfully')
                loadUsers()
                loadKPIs()
            } else {
                const error = await res.json()
                alert(`Failed to delete user: ${error.error}`)
            }
        } catch (error) {
            console.error('Failed to delete user:', error)
            alert('Failed to delete user')
        } finally {
            setDeletingUserId(null)
        }
    }

    // Edit user email
    const handleEditEmail = async () => {
        if (!editingUser || !newEmail) return

        try {
            const res = await fetch('/api/admin/users/email', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId: editingUser.id,
                    newEmail,
                }),
            })

            if (res.ok) {
                alert('Email updated successfully')
                setEditingUser(null)
                setNewEmail('')
                loadUsers()
            } else {
                const error = await res.json()
                alert(`Failed to update email: ${error.error}`)
            }
        } catch (error) {
            console.error('Failed to update email:', error)
            alert('Failed to update email')
        }
    }

    useEffect(() => {
        loadKPIs()
        loadUsers()
    }, [loadKPIs, loadUsers])

    return (
        <div className="container mx-auto px-4 py-8 space-y-8">
            {/* Date Range Filter */}
            <div className="bg-card border border-border rounded-lg p-6">
                <h2 className="text-lg font-semibold mb-4">Filters</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                        <label className="block text-sm font-medium mb-2">From Date</label>
                        <input
                            type="date"
                            value={dateFrom}
                            onChange={(e) => setDateFrom(e.target.value)}
                            className="w-full px-3 py-2 border border-border rounded-lg bg-background"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-2">To Date</label>
                        <input
                            type="date"
                            value={dateTo}
                            onChange={(e) => setDateTo(e.target.value)}
                            className="w-full px-3 py-2 border border-border rounded-lg bg-background"
                        />
                    </div>
                    <div className="flex items-end">
                        <button
                            onClick={() => {
                                setDateFrom('')
                                setDateTo('')
                            }}
                            className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground"
                        >
                            Clear Dates
                        </button>
                    </div>
                </div>
            </div>

            {/* KPIs */}
            {kpis && (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <div className="bg-card border border-border rounded-lg p-6">
                        <h3 className="text-sm text-muted-foreground mb-2">Total Users</h3>
                        <p className="text-3xl font-bold">{kpis.totalUsers}</p>
                        <p className="text-sm text-muted-foreground mt-1">
                            +{kpis.usersToday} today
                        </p>
                    </div>

                    <div className="bg-card border border-border rounded-lg p-6">
                        <h3 className="text-sm text-muted-foreground mb-2">Paid Users</h3>
                        <p className="text-3xl font-bold">{kpis.paidUsers}</p>
                        <p className="text-sm text-muted-foreground mt-1">
                            +{kpis.paidToday} today
                        </p>
                    </div>

                    <div className="bg-card border border-border rounded-lg p-6">
                        <h3 className="text-sm text-muted-foreground mb-2">Storage Used</h3>
                        <p className="text-3xl font-bold">{kpis.totalStorageMB.toFixed(2)}</p>
                        <p className="text-sm text-muted-foreground mt-1">MB</p>
                    </div>

                    <div className="bg-card border border-border rounded-lg p-6">
                        <h3 className="text-sm text-muted-foreground mb-2">Emails Sent</h3>
                        <p className="text-3xl font-bold">{kpis.emailsSent}</p>
                        <p className="text-sm text-muted-foreground mt-1">
                            {kpis.emailsToday} today
                        </p>
                    </div>
                </div>
            )}

            {/* Users Table */}
            <div className="bg-card border border-border rounded-lg p-6">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-semibold">Users</h2>
                    <div className="flex gap-2">
                        <input
                            type="text"
                            placeholder="Search by email..."
                            value={search}
                            onChange={(e) => {
                                setSearch(e.target.value)
                                setPage(1)
                            }}
                            className="px-3 py-2 border border-border rounded-lg bg-background w-64"
                        />
                    </div>
                </div>

                {loading ? (
                    <div className="text-center py-8 text-muted-foreground">Loading...</div>
                ) : (
                    <>
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b border-border">
                                        <th className="text-left py-3 px-4 text-sm font-medium">#</th>
                                        <th className="text-left py-3 px-4 text-sm font-medium">Email</th>
                                        <th className="text-left py-3 px-4 text-sm font-medium">Pro?</th>
                                        <th className="text-left py-3 px-4 text-sm font-medium">Text</th>
                                        <th className="text-left py-3 px-4 text-sm font-medium">Audio</th>
                                        <th className="text-left py-3 px-4 text-sm font-medium">Video</th>
                                        <th className="text-left py-3 px-4 text-sm font-medium">Storage (MB)</th>
                                        <th className="text-left py-3 px-4 text-sm font-medium">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {users.map((user, idx) => (
                                        <tr key={user.id} className="border-b border-border hover:bg-muted/10">
                                            <td className="py-3 px-4 text-sm">{(page - 1) * 25 + idx + 1}</td>
                                            <td className="py-3 px-4 text-sm">{user.email}</td>
                                            <td className="py-3 px-4 text-sm">
                                                {user.isPro ? (
                                                    <span className="px-2 py-1 bg-success/10 text-success rounded text-xs">
                                                        Yes
                                                    </span>
                                                ) : (
                                                    <span className="px-2 py-1 bg-muted text-muted-foreground rounded text-xs">
                                                        No
                                                    </span>
                                                )}
                                            </td>
                                            <td className="py-3 px-4 text-sm">{user.textMessages}</td>
                                            <td className="py-3 px-4 text-sm">{user.audioMessages}</td>
                                            <td className="py-3 px-4 text-sm">{user.videoMessages}</td>
                                            <td className="py-3 px-4 text-sm">{user.storageMB}</td>
                                            <td className="py-3 px-4 text-sm">
                                                <div className="flex gap-2">
                                                    <button
                                                        onClick={() => {
                                                            setEditingUser(user)
                                                            setNewEmail(user.email)
                                                        }}
                                                        className="text-primary hover:underline text-xs"
                                                    >
                                                        Edit
                                                    </button>
                                                    <button
                                                        onClick={() => handleDeleteUser(user.id)}
                                                        disabled={deletingUserId === user.id}
                                                        className="text-error hover:underline text-xs disabled:opacity-50"
                                                    >
                                                        {deletingUserId === user.id ? 'Deleting...' : 'Delete'}
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Pagination */}
                        <div className="flex items-center justify-between mt-4">
                            <p className="text-sm text-muted-foreground">
                                Page {page} of {totalPages}
                            </p>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => setPage(p => Math.max(1, p - 1))}
                                    disabled={page === 1}
                                    className="px-3 py-1 border border-border rounded disabled:opacity-50"
                                >
                                    Previous
                                </button>
                                <button
                                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                                    disabled={page === totalPages}
                                    className="px-3 py-1 border border-border rounded disabled:opacity-50"
                                >
                                    Next
                                </button>
                            </div>
                        </div>
                    </>
                )}
            </div>

            {/* Edit Email Modal */}
            {editingUser && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
                    <div className="bg-card border border-border rounded-lg p-6 max-w-md w-full">
                        <h3 className="text-lg font-semibold mb-4">Edit User Email</h3>
                        <p className="text-sm text-muted-foreground mb-4">
                            Current: {editingUser.email}
                        </p>
                        <input
                            type="email"
                            value={newEmail}
                            onChange={(e) => setNewEmail(e.target.value)}
                            className="w-full px-3 py-2 border border-border rounded-lg bg-background mb-4"
                            placeholder="New email address"
                        />
                        <div className="flex gap-2 justify-end">
                            <button
                                onClick={() => {
                                    setEditingUser(null)
                                    setNewEmail('')
                                }}
                                className="px-4 py-2 text-sm hover:bg-muted rounded"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleEditEmail}
                                className="px-4 py-2 text-sm bg-primary text-primary-foreground rounded hover:bg-primary/90"
                            >
                                Save
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
