'use client';

import { useEffect, useRef, useState } from 'react';

interface ConfirmDialogProps {
    open: boolean;
    onClose: () => void;
    onConfirm: () => void | Promise<void>;
    title: string;
    description: string;
    confirmText: string;
    cancelText: string;
    loadingText?: string;
    isLoading?: boolean;
    variant?: 'destructive' | 'neutral';
}

export function ConfirmDialog({
    open,
    onClose,
    onConfirm,
    title,
    description,
    confirmText,
    cancelText,
    loadingText,
    isLoading = false,
    variant = 'destructive',
}: ConfirmDialogProps) {
    const cancelRef = useRef<HTMLButtonElement>(null);
    const [confirming, setConfirming] = useState(false);

    const isDisabled = isLoading || confirming;

    useEffect(() => {
        if (!open) return;
        cancelRef.current?.focus();

        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && !isDisabled) onClose();
        };
        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [open, isDisabled, onClose]);

    if (!open) return null;

    const handleConfirm = async () => {
        if (isDisabled) return;
        setConfirming(true);
        try {
            await onConfirm();
        } finally {
            setConfirming(false);
        }
    };

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center"
            role="dialog"
            aria-modal="true"
            aria-labelledby="confirm-dialog-title"
            aria-describedby="confirm-dialog-description"
        >
            {/* Overlay */}
            <div className="absolute inset-0 backdrop-blur-sm" style={{ background: 'rgba(43,37,33,0.6)' }} />

            {/* Modal */}
            <div
                className="relative mx-4 w-full max-w-[520px] rounded-2xl border px-6 py-8 sm:px-10 sm:py-9"
                style={{
                    background: '#FDFCFB',
                    borderColor: '#E8DDD0',
                    boxShadow: '0 20px 60px rgba(43,37,33,0.22)',
                }}
            >
                <h2
                    id="confirm-dialog-title"
                    className="font-serif text-2xl sm:text-3xl italic font-semibold text-center"
                    style={{ color: '#2C2C2C' }}
                >
                    {title}
                </h2>

                <p
                    id="confirm-dialog-description"
                    className="mt-4 text-center text-base leading-relaxed"
                    style={{ color: '#4A4A4A' }}
                >
                    {description}
                </p>

                <div className="mt-8 flex flex-col sm:flex-row gap-3 sm:justify-center">
                    <button
                        ref={cancelRef}
                        onClick={onClose}
                        disabled={isDisabled}
                        className="h-12 rounded-lg px-6 text-base font-medium transition-colors sm:min-w-[150px] border disabled:opacity-50"
                        style={{
                            borderColor: '#E8DDD0',
                            background: '#FDFCFB',
                            color: '#4A4A4A',
                        }}
                        onMouseEnter={e => { if (!isDisabled) (e.currentTarget as HTMLButtonElement).style.background = '#F5F0E8'; }}
                        onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = '#FDFCFB'; }}
                    >
                        {cancelText}
                    </button>

                    <button
                        onClick={handleConfirm}
                        disabled={isDisabled}
                        className="h-12 rounded-lg px-6 text-base font-medium transition-colors sm:min-w-[150px] inline-flex items-center justify-center gap-2 text-white disabled:opacity-70"
                        style={{
                            background: variant === 'destructive' ? '#C4623A' : '#6B6B6B',
                        }}
                        onMouseEnter={e => { if (!isDisabled) (e.currentTarget as HTMLButtonElement).style.background = variant === 'destructive' ? '#B3571F' : '#555'; }}
                        onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = variant === 'destructive' ? '#C4623A' : '#6B6B6B'; }}
                    >
                        {isDisabled && (
                            <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                            </svg>
                        )}
                        {isDisabled && loadingText ? loadingText : confirmText}
                    </button>
                </div>
            </div>
        </div>
    );
}
