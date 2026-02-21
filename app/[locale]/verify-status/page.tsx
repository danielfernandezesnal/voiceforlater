
"use client";

import { useSearchParams } from "next/navigation";
import { useState, Suspense } from "react";

function VerifyStatusContent() {
    const searchParams = useSearchParams();
    const token = searchParams.get("token");
    const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
    const [message, setMessage] = useState("");

    const handleDecision = async (decision: 'confirm' | 'deny') => {
        if (!token) return;
        setStatus('loading');

        try {
            const response = await fetch('/api/verify-status', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ token, decision })
            });

            const data = await response.json();

            if (!response.ok) {
                setStatus('error');
                setMessage(data.error || "Something went wrong.");
            } else {
                setStatus('success');
                if (decision === 'confirm') {
                    setMessage("Messages have been released. Notifications will be sent shortly.");
                } else {
                    setMessage("Thank you. The check-in status has been reset (false alarm).");
                }
            }
        } catch (error) {
            setStatus('error');
            setMessage("Network error. Please try again.");
        }
    };

    if (!token) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-gray-50">
                <div className="max-w-md w-full bg-white p-8 rounded-lg shadow-md text-center">
                    <h1 className="text-xl font-bold text-red-600 mb-4">Invalid Link</h1>
                    <p>No token provided. Please check the link in your email.</p>
                </div>
            </div>
        );
    }

    if (status === 'success') {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-gray-50">
                <div className="max-w-md w-full bg-white p-8 rounded-lg shadow-md text-center">
                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                    </div>
                    <h1 className="text-xl font-bold text-gray-900 mb-2">Action Confirmed</h1>
                    <p className="text-gray-600">{message}</p>
                </div>
            </div>
        );
    }

    if (status === 'error') {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-gray-50">
                <div className="max-w-md w-full bg-white p-8 rounded-lg shadow-md text-center">
                    <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </div>
                    <h1 className="text-xl font-bold text-gray-900 mb-2">Error</h1>
                    <p className="text-gray-600 mb-6">{message}</p>
                    <button
                        onClick={() => setStatus('idle')}
                        className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300 transition-colors"
                    >
                        Try Again
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-gray-50">
            <div className="max-w-lg w-full bg-white p-8 rounded-lg shadow-lg">
                <div className="border-l-4 border-red-500 pl-4 mb-6">
                    <h1 className="text-2xl font-bold text-gray-900">Verify Status</h1>
                    <p className="text-gray-500 mt-1">Please confirm if the user is unavailable.</p>
                </div>

                <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4 mb-8">
                    <div className="flex">
                        <div className="flex-shrink-0">
                            <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                            </svg>
                        </div>
                        <div className="ml-3">
                            <h3 className="text-sm font-medium text-yellow-800">Use with caution</h3>
                            <div className="mt-2 text-sm text-yellow-700">
                                <p>This action will release any pending messages scheduled by the user for this event. <strong>This cannot be undone.</strong></p>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="space-y-4">
                    <button
                        onClick={() => handleDecision('confirm')}
                        disabled={status === 'loading'}
                        className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50"
                    >
                        {status === 'loading' ? 'Processing...' : 'Yes, Confirm & Release Messages'}
                    </button>

                    <button
                        onClick={() => handleDecision('deny')}
                        disabled={status === 'loading'}
                        className="w-full flex justify-center py-3 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50"
                    >
                        No, it's a False Alarm
                    </button>
                </div>

                <p className="mt-6 text-center text-xs text-gray-400">
                    Carry My Words Verification System &bull; Secure Link
                </p>
            </div>
        </div>
    );
}

export default function VerifyStatusPage() {
    return (
        <Suspense fallback={<div className="min-h-screen flex items-center justify-center text-gray-500">Loading...</div>}>
            <VerifyStatusContent />
        </Suspense>
    );
}
