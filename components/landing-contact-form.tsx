'use client';

import { useState } from 'react';

export function LandingContactForm({ dict }: { dict: any }) {
    const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error' | 'invalid' | 'rateLimit'>('idle');

    return (
        <form
            className="space-y-6 bg-card p-8 rounded-2xl border border-border/50 shadow-sm"
            onSubmit={async (e) => {
                e.preventDefault();
                setStatus('loading');

                const form = e.target as HTMLFormElement;
                const formData = new FormData(form);
                try {
                    const res = await fetch('/api/contact', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(Object.fromEntries(formData)),
                    });
                    if (res.ok) {
                        setStatus('success');
                        form.reset();
                    } else {
                        const errorData = await res.json().catch(() => ({}));
                        if (errorData.error === 'invalid') setStatus('invalid');
                        else if (errorData.error === 'rate_limit') setStatus('rateLimit');
                        else setStatus('error');
                    }
                } catch (error) {
                    setStatus('error');
                }
            }}
        >
            {/* Honeypot field for spam prevention */}
            <div className="hidden" aria-hidden="true" style={{ display: 'none' }}>
                <input
                    type="text"
                    name="bot_field"
                    tabIndex={-1}
                    autoComplete="off"
                />
            </div>
            <div>
                <label className="block text-sm font-medium mb-2 text-foreground/80">{dict.contact.emailLabel}</label>
                <input
                    type="email"
                    name="email"
                    required
                    className="form-input"
                    placeholder={dict.contact.emailPlaceholder}
                />
            </div>
            <div>
                <label className="block text-sm font-medium mb-2 text-foreground/80">{dict.contact.subjectLabel}</label>
                <input
                    type="text"
                    name="subject"
                    className="form-input"
                    placeholder={dict.contact.subjectPlaceholder}
                />
            </div>
            <div>
                <label className="block text-sm font-medium mb-2 text-foreground/80">{dict.contact.messageLabel}</label>
                <textarea
                    name="message"
                    required
                    rows={4}
                    className="form-input h-auto resize-none"
                    placeholder={dict.contact.messagePlaceholder}
                ></textarea>
            </div>

            {status === 'success' && (
                <div className="p-4 bg-green-500/10 border border-green-500/20 text-green-600 rounded-md text-sm">
                    {dict.contact.success}
                </div>
            )}

            {status === 'error' && (
                <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-600 rounded-md text-sm">
                    {dict.contact.error}
                </div>
            )}

            {status === 'invalid' && (
                <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-600 rounded-md text-sm">
                    {dict.contact.invalid}
                </div>
            )}

            {status === 'rateLimit' && (
                <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-600 rounded-md text-sm">
                    {dict.contact.rateLimit}
                </div>
            )}

            <button
                type="submit"
                className="btn-primary w-full disabled:opacity-50"
                disabled={status === 'loading'}
            >
                {status === 'loading' ? dict.contact.sending : dict.contact.submit}
            </button>
        </form>
    );
}
