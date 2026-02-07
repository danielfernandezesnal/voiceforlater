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
            updateData({ messageType: 'video' }) // We treat video as 'audio' type internally for now, or need to expand types
            // Wait for data update then set step?
            // Actually, the request said "Mensaje de Video" card.
            // If I set messageType to 'video', I need to ensure the rest of the app handles it.
            // The prompt said: "Add 'Video Message' card... same flow as 'Better to Pro'".
            // BUT, if they upgrade, they should be able to record video.
            // Current types are 'text' | 'audio'. 
            // I should probably map 'video' to 'audio' with a flag or extend the type.
            // Let's stick to the requested UX: "Video Message" card.
            // If I use 'audio' type but show video recorder, that works.
            // However, let's assume 'video' is a distinct type in the UI, but maybe backend treats it similar to audio (blob).
            // Let's defer type expansion decision. The user asked for "Video Message" option.
            // For now, I will map it to 'audio' logic in step 2 but maybe show video UI.
            // Wait, step 2 has 'Step2Content'. I need to see if it supports video.
            // The implementation plan had `messageType: 'video'` in redirect.
            // I'll need to update `wizard-context` type to include 'video' if I truly want 'video'.
            // Let's update `wizard-context.tsx` first to allow 'video' type.
            // Wait, I already added 'video' to MessageType in `wizard-context.tsx`.
            // So I can set messageType to 'video'.
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
        setIsSubmitting(true)
        setError(null)

        try {
            const formData = new FormData()
            if (messageId) {
                formData.append('id', messageId)
            }
            formData.append('type', data.messageType!)

            formData.append('recipientName', data.recipientName)
            formData.append('recipientEmail', data.recipientEmail)
            formData.append('deliveryMode', data.deliveryMode!)

            if (data.messageType === 'text') {
                formData.append('textContent', data.textContent)
            } else if (data.audioBlob) {
                const filename = 'recording.webm'
                // Use correct key: "video" for video messages, "audio" for audio messages
                const fileKey = data.messageType === 'video' ? 'video' : 'audio'
                formData.append(fileKey, data.audioBlob, filename)
            }

            if (data.deliveryMode === 'date') {
                formData.append('deliverAt', data.deliverAt)
            } else {
                formData.append('checkinIntervalDays', String(data.checkinIntervalDays))
            }

            // Log payload for debugging
            console.log('Submitting message:', {
                type: data.messageType,
                recipientName: data.recipientName,
                recipientEmail: data.recipientEmail,
                deliveryMode: data.deliveryMode,
                hasAudioBlob: !!data.audioBlob,
                textContent: data.messageType === 'text' ? data.textContent?.substring(0, 50) : null,
                deliverAt: data.deliverAt,
                checkinIntervalDays: data.checkinIntervalDays
            })

            const response = await fetch('/api/messages', {
                method: messageId ? 'PUT' : 'POST',
                body: formData,
            })

            if (!response.ok) {
                let errorMessage = 'Failed to create message'
                try {
                    const result = await response.json()
                    console.error('API error response:', result)
                    errorMessage = result.error || errorMessage
                    if (result.details) {
                        errorMessage += `: ${result.details}`
                    }
                    if (result.code) {
                        errorMessage += ` (code: ${result.code})`
                    }
                } catch (e) {
                    console.error('Failed to parse error response:', e)
                }
                throw new Error(errorMessage)
            }

            await clearStorageOnly()
            router.push(`/${locale}/dashboard`)
            router.refresh()
            // Keep isSubmitting true during navigation to prevent UI interaction
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
                <div className="w-20" /> {/* Spacer for centering */}
            </div>

            {/* Step Indicator - Hide in read-only mode */}
            {!isReadOnly && <StepIndicator currentStep={step} steps={steps} />}

            {/* Error Display */}
            {error && (
                <div className="max-w-md mx-auto mb-6 p-4 bg-error/10 border border-error/20 rounded-lg text-error text-center">
                    {error}
                </div>
            )}

            {/* Step Content */}
            <div className="mb-8">
                {!isReadOnly && step === 1 && <Step1TypeSelect dictionary={dictionary.wizard.step1} userPlan={userPlan} />}
                {!isReadOnly && step === 2 && (
                    <Step2Content
                        dictionary={dictionary.wizard.step2}
                        maxTextChars={maxTextChars}
                        maxAudioSeconds={maxAudioSeconds}
                    />
                )}
                {!isReadOnly && step === 3 && <Step3Recipient dictionary={dictionary.wizard.step3} />}
                {!isReadOnly && step === 4 && <Step4Delivery dictionary={dictionary.wizard.step4} userPlan={userPlan} />}
                {/* Always show step 5 content if readonly or step 5 */}
                {(step === 5 || isReadOnly) && (
                    <Step5Review
                        dictionary={dictionary.wizard.step5}
                        typeDictionary={dictionary.wizard.step1}
                        onSubmit={handleSubmit}
                        isSubmitting={isSubmitting}
                        isReadOnly={isReadOnly}
                    />
                )}
            </div>

            {/* Navigation Buttons */}
            {!isReadOnly && step < 5 && (
                <div className="flex justify-center gap-4">
                    {step > 1 && (
                        <button
                            onClick={handleBack}
                            className="px-6 py-2.5 text-muted-foreground hover:text-foreground transition-colors"
                        >
                            {dictionary.common.back}
                        </button>
                    )}
                    <button
                        onClick={handleNext}
                        disabled={!canProceed}
                        className="px-8 py-2.5 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-primary/20"
                    >
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
