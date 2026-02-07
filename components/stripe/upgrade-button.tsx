'use client';

import { useState } from 'react';

interface UpgradeButtonProps {
    dictionary: {
        upgrade: string;
        upgrading: string;
        manageSub: string;
    };
    isPro?: boolean;
    className?: string;
}

export function UpgradeButton({ dictionary, isPro = false, className = '' }: UpgradeButtonProps) {
    const [loading, setLoading] = useState(false);

    const handleClick = async () => {
        setLoading(true);
        try {
            const endpoint = isPro ? '/api/stripe/portal' : '/api/stripe/checkout';
            const response = await fetch(endpoint, { method: 'POST' });
            const data = await response.json();

            if (data.url) {
                window.location.href = data.url;
            } else {
                console.error('No URL returned:', data);
                alert(`Error: ${data.error || 'No se pudo iniciar el pago'}`);
                setLoading(false);
            }
        } catch (error) {
            console.error('Stripe error:', error);
            alert('Error iniciando proceso de pago. Verifique su conexión.');
            setLoading(false);
        }
    };

    return (
        <button
            onClick={handleClick}
            disabled={loading}
            className={`inline-flex items-center justify-center gap-2 px-6 py-3 font-semibold rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed ${isPro
                ? 'bg-secondary border border-border text-foreground hover:bg-secondary/80'
                : 'bg-primary text-primary-foreground shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30 hover:bg-primary/90'
                } ${className}`}
        >
            {loading ? (
                <>
                    <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    {dictionary.upgrading}
                </>
            ) : (
                <>
                    {!isPro && (
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                    )}
                    {isPro ? dictionary.manageSub : dictionary.upgrade}
                </>
            )}
        </button>
    );
}
