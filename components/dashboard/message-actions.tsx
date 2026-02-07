'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface MessageActionsProps {
    messageId: string;
    locale: string;
    status: 'draft' | 'scheduled' | 'delivered';
    labels: {
        edit: string;
        delete: string;
        view: string;
    };
}

export function MessageActions({ messageId, locale, status, labels }: MessageActionsProps) {
    const router = useRouter();
    const [isPending, startTransition] = useTransition();
    const [isDeleting, setIsDeleting] = useState(false);

    const handleDelete = async () => {
        // Simple confirmation using the label
        // In a real app, use a proper modal
        if (!window.confirm(`${labels.delete}?`)) return;

        setIsDeleting(true);
        try {
            const res = await fetch(`/api/messages?id=${messageId}`, {
                method: 'DELETE',
            });

            if (!res.ok) {
                throw new Error('Failed to delete');
            }

            startTransition(() => {
                router.refresh();
                // We don't reset isDeleting because the item will disappear or we want to prevent interaction
            });
        } catch (error) {
            console.error('Delete error:', error);
            setIsDeleting(false);
            alert('Failed to delete message');
        }
    };

    const isLoading = isDeleting || isPending;
    const isDelivered = status === 'delivered';

    return (
        <div className="flex flex-col gap-2 mt-2 sm:mt-0 sm:ml-4">
            <Link
                href={`/${locale}/messages/${messageId}/edit${isDelivered ? '?readonly=true' : ''}`}
                className="inline-flex items-center justify-center px-4 py-2 text-sm font-medium text-foreground bg-card border border-input rounded-lg shadow-sm hover:bg-accent hover:text-accent-foreground transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50"
            >
                {isDelivered ? (
                    <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                ) : (
                    <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                )}
                {isDelivered ? labels.view : labels.edit}
            </Link>

            <button
                onClick={handleDelete}
                disabled={isLoading}
                className="inline-flex items-center justify-center px-4 py-2 text-sm font-medium text-destructive bg-destructive/5 border border-destructive/20 rounded-lg shadow-sm hover:bg-destructive/10 transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50"
            >
                {isLoading ? (
                    <svg className="w-4 h-4 mr-2 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                ) : (
                    <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                )}
                {labels.delete}
            </button>
        </div>
    );
}
