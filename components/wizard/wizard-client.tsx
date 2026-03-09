'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import {
    WizardProvider,
    useWizard,
    StepIndicator,
    Step1TypeSelect,
    Step2Content,
    Step3Recipient,
    Step4Delivery,
    Step5Review,
    type WizardData
} from '@/components/wizard'
import type { Dictionary } from '@/lib/i18n'

interface WizardClientProps {
    locale: string
    dictionary: Dictionary
    userPlan: 'free' | 'pro'
    initialData?: Partial<WizardData>
    messageId?: string
}

function WizardContent({ locale, dictionary, userPlan, initialData, messageId }: WizardClientProps) {
    const router = useRouter()
    const searchParams = useSearchParams()
    const isReadOnly = searchParams.get('readonly') === 'true'
    const { step, setStep, canProceed, data, updateData, clearDrafts, clearStorageOnly } = useWizard()

    const [isSubmitting, setIsSubmitting] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [tosAccepted, setTosAccepted] = useState(false)

    // Handle ?new=true to reset wizard
    useEffect(() => {
        if (searchParams.get('new') === 'true') {
            clearDrafts()
            router.replace(`/${locale}/messages/create`, { scroll: false })
        }
    }, [searchParams, clearDrafts, router, locale])

    // Handle readonly mode
    useEffect(() => {
        if (isReadOnly) {
            setStep(5)
        }
    }, [isReadOnly, setStep])

    // Handle return from upgrade for Video
    useEffect(() => {
        const typeParam = searchParams.get('type')
        if (typeParam === 'video' && userPlan === 'pro') {
            updateData({ messageType: 'video' })
            setStep(2)
        }
    }, [searchParams, userPlan, updateData, setStep])

    const steps = [
        dictionary.wizard.steps.type,
        dictionary.wizard.steps.content,
        dictionary.wizard.steps.recipient,
        dictionary.wizard.steps.delivery,
        dictionary.wizard.steps.review,
    ]

    // Plan limits
    const maxTextChars = userPlan === 'pro' ? 5000 : 1000
    const maxAudioSeconds = userPlan === 'pro' ? 120 : 15

    const handleNext = () => {
        if (canProceed && step < 5) {
            setStep(step + 1)
        }
    }

    const handleBack = () => {
        if (step > 1) {
            setStep(step - 1)
        }
    }

    const handleSubmit = async () => {
        if (!tosAccepted) return

        setIsSubmitting(true)
        setError(null)

        try {
            // Also notify server about ToS acceptance if they checked it (Requirement: audit record)
            fetch('/api/tos/accept', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ version: '1.0' })
            }).catch(e => console.error("Failed to record ToS acceptance silently:", e));

            const formData = new FormData()
            if (messageId) {
                formData.append('id', messageId)
            }
            formData.append('type', data.messageType!)
            formData.append('title', data.title)

            formData.append('recipientName', data.recipientName)
            formData.append('recipientEmail', data.recipientEmail)
            formData.append('deliveryMode', data.deliveryMode!)

            if (data.messageType === 'text') {
                formData.append('textContent', data.textContent)
            } else if (data.audioBlob) {
                const filename = 'recording.webm'
                const fileKey = data.messageType === 'video' ? 'video' : 'audio'
                formData.append(fileKey, data.audioBlob, filename)
            }

            if (data.deliveryMode === 'date') {
                formData.append('deliverAt', data.deliverAt)
            } else {
                formData.append('checkinIntervalDays', String(data.checkinIntervalDays))
                if (data.trustedContactIds && data.trustedContactIds.length > 0) {
                    data.trustedContactIds.forEach(id => {
                        formData.append('trustedContactIds', id)
                    })
                }
            }

            const response = await fetch('/api/messages', {
                method: messageId ? 'PUT' : 'POST',
                body: formData,
            })

            if (!response.ok) {
                let errorMessage = 'Failed to create message'
                try {
                    const result = await response.json()
                    errorMessage = result.error || errorMessage
                    if (result.details) {
                        errorMessage += `: ${result.details}`
                    }
                } catch (e) {
                    console.error('Failed to parse error response:', e)
                }
                throw new Error(errorMessage)
            }

            await clearStorageOnly()
            router.push(`/${locale}/dashboard`)
            router.refresh()
        } catch (err) {
            console.error('Error creating/updating message:', err)
            setError(err instanceof Error ? err.message : 'Failed to save message')
            setIsSubmitting(false)
        }
    }

    return (
        <div className="min-h-[calc(100vh-4rem)] py-8">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
                <Link
                    href={`/${locale}/dashboard`}
                    className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                    <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                    {isReadOnly ? dictionary.common.back : (initialData ? dictionary.common.cancel : dictionary.common.cancel)}
                </Link>
                <h1 className="text-xl font-bold">
                    {isReadOnly
                        ? dictionary.common.view
                        : (initialData ? dictionary.common.edit || dictionary.wizard.title : dictionary.wizard.title)}
                </h1>
                <div className="w-20" />
            </div>

            {!isReadOnly && <StepIndicator currentStep={step} steps={steps} />}

            {error && (
                <div className="max-w-md mx-auto mb-6 p-4 bg-error/10 border border-error/20 rounded-lg text-error text-center">
                    {error}
                </div>
            )}

            <div className="mb-8 animate-in slide-in-from-right-4 fade-in duration-500 ease-out" key={step}>
                {!isReadOnly && step === 1 && <Step1TypeSelect dictionary={dictionary.wizard.step1} userPlan={userPlan} />}
                {!isReadOnly && step === 2 && (
                    <Step2Content
                        dictionary={dictionary.wizard.step2}
                        maxTextChars={maxTextChars}
                        maxAudioSeconds={maxAudioSeconds}
                    />
                )}
                {!isReadOnly && step === 3 && <Step3Recipient dictionary={dictionary.wizard.step3} />}
                {!isReadOnly && step === 4 && <Step4Delivery dictionary={dictionary} userPlan={userPlan} locale={locale} />}
                {(step === 5 || isReadOnly) && (
                    <Step5Review
                        dictionary={dictionary.wizard.step5}
                        typeDictionary={dictionary.wizard.step1}
                        onSubmit={handleSubmit}
                        isSubmitting={isSubmitting}
                        tosAccepted={tosAccepted}
                        onTosChange={setTosAccepted}
                        locale={locale}
                        isReadOnly={isReadOnly}
                    />
                )}
            </div>

            {!isReadOnly && step < 5 && (
                <div className="flex justify-center gap-4">
                    {step > 1 && (
                        <button onClick={handleBack} className="btn-ghost">
                            {dictionary.common.back}
                        </button>
                    )}
                    <button onClick={handleNext} disabled={!canProceed} className="btn-primary">
                        {dictionary.common.next}
                    </button>
                </div>
            )}
        </div>
    )
}

export function WizardClient(props: WizardClientProps) {
    return (
        <WizardProvider initialData={props.initialData}>
            <WizardContent {...props} />
        </WizardProvider>
    )
}
