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
    userEmail: string
    isLimitReached?: boolean
}

function WizardContent({ locale, dictionary, userPlan, initialData, messageId, userEmail, isLimitReached }: WizardClientProps) {
    const router = useRouter()
    const searchParams = useSearchParams()
    const isReadOnly = searchParams.get('readonly') === 'true'
    const { step, setStep, maxStep, canProceed, data, updateData, clearDrafts, clearStorageOnly } = useWizard()

    const [isSubmitting, setIsSubmitting] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [errorCode, setErrorCode] = useState<string | null>(null)
    const [tosAccepted, setTosAccepted] = useState(false)
    const [showLimitModal, setShowLimitModal] = useState(!!isLimitReached)

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
            setStep(4)
        }
    }, [searchParams, userPlan, updateData, setStep])

    // Clear stale errors when user navigates steps or specifically updates the delivery date
    useEffect(() => {
        if (error) {
            setError(null)
            setErrorCode(null)
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [step, data.deliverAt])

    const steps = [
        dictionary.wizard.steps.delivery,
        dictionary.wizard.steps.recipient,
        dictionary.wizard.steps.type,
        dictionary.wizard.steps.content,
        dictionary.wizard.steps.review,
    ]

    // Plan limits
    const maxTextChars = 5000
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
        setErrorCode(null)

        try {
            // Record ToS acceptance before creating the message — the API validates tos_accepted_at
            await fetch('/api/tos/accept', {
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

            data.recipients.forEach((r, i) => {
                formData.append(`recipients[${i}][name]`, r.name)
                formData.append(`recipients[${i}][email]`, r.email)
            })
            // Guard: deliveryMode must be a known valid value before any DB write.
            if (data.deliveryMode !== 'date' && data.deliveryMode !== 'checkin') {
                setError(dictionary.wizard.step5.invalidDeliveryMode)
                setIsSubmitting(false)
                setStep(1)
                return
            }
            formData.append('deliveryMode', data.deliveryMode)

            if (data.messageType === 'text') {
                formData.append('textContent', data.textContent)
            } else if (data.existingAudioUrl && !data.audioBlob) {
                // If we have an existing URL (e.g. uploaded directly to storage) 
                // and NO new recording blob, pass the URL/path to the server
                formData.append('existingAudioUrl', data.existingAudioUrl)
            } else if (data.audioBlob) {
                // Ensure the blob is a valid Blob instance (IndexedDB can return plain objects in some browsers/Safari iOS)
                let blobToUpload: Blob = data.audioBlob
                if (!(blobToUpload instanceof Blob)) {
                    blobToUpload = new Blob([blobToUpload as BlobPart], { type: 'video/webm' })
                }
                if (data.messageType === 'video') {
                    const filename = data.audioBlob instanceof File ? data.audioBlob.name : 'recording.webm'
                    formData.append('video', blobToUpload, filename)
                } else {
                    const filename = data.audioBlob instanceof File ? data.audioBlob.name : 'recording.webm'
                    formData.append('audio', blobToUpload, filename)
                }
            }

            // Upload photos (new files)
            if (data.photos && data.photos.length > 0) {
                data.photos.forEach((photo, i) => {
                    // Ensure file is a valid Blob instance before appending
                    const fileBlob: Blob = photo.file instanceof Blob
                        ? photo.file
                        : new Blob([photo.file as BlobPart], { type: 'image/jpeg' })
                    formData.append(`photos[${i}]`, fileBlob, photo.file?.name || `photo-${i}.jpg`)
                    formData.append(`photosCaptions[${i}]`, photo.caption || '')
                })
            }

            // Existing photos to keep (paths already in storage)
            if (data.existingPhotoUrls && data.existingPhotoUrls.length > 0) {
                data.existingPhotoUrls.forEach((p) => {
                    formData.append('keepPhotoPaths', p.path)
                })
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
                let apiErrorCode: string | null = null
                try {
                    const result = await response.json()
                    if (result.code) {
                        apiErrorCode = result.code
                    }
                    if (result.code === 'INVALID_SCHEDULE') {
                        errorMessage = dictionary.wizard.step5.invalidScheduleDate || result.error || errorMessage
                    } else if (result.code === 'INVALID_DELIVERY_MODE') {
                        errorMessage = dictionary.wizard.step5.invalidDeliveryMode || result.error || errorMessage
                    } else {
                        errorMessage = result.error || errorMessage
                        if (result.details) {
                            errorMessage += `: ${result.details}`
                        }
                    }
                } catch (e) {
                    console.error('Failed to parse error response:', e)
                }
                setErrorCode(apiErrorCode)
                throw new Error(errorMessage)
            }

            await clearStorageOnly()
            router.push(`/${locale}/dashboard?created=true`)
            router.refresh()
        } catch (err) {
            console.error('Error creating/updating message:', err)
            setError(err instanceof Error ? err.message : 'Failed to save message')
            setIsSubmitting(false)
        }
    }

    return (
        <div className="min-h-[calc(100vh-4rem)] py-8">
            {/* Limit Reached Modal */}
            {showLimitModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="w-full max-w-sm p-6 rounded-2xl shadow-2xl border border-border animate-in zoom-in-95 duration-200" style={{ background: '#F5F0E8' }}>
                        <div className="flex flex-col items-center text-center space-y-4">
                            <span className="text-3xl">🔒</span>
                            <h3 className="font-serif text-xl font-semibold text-foreground">
                                {dictionary.dashboard.limitReached.title}
                            </h3>
                            <p className="text-sm text-muted-foreground leading-relaxed">
                                {dictionary.dashboard.limitReached.description}
                            </p>
                            <div className="flex flex-col gap-3 w-full pt-2">
                                <Link
                                    href={`/${locale}/dashboard/plan`}
                                    className="w-full py-2.5 px-4 rounded-xl text-sm font-semibold text-center text-white transition-all hover:opacity-90"
                                    style={{ background: '#C4623A' }}
                                >
                                    {dictionary.dashboard.limitReached.upgrade}
                                </Link>
                                <Link
                                    href={`/${locale}/dashboard`}
                                    className="w-full py-2 text-sm text-muted-foreground hover:text-foreground transition-colors text-center"
                                >
                                    {dictionary.dashboard.limitReached.cancel}
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            )}

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

            {!isReadOnly && (
                <StepIndicator
                    currentStep={step}
                    maxStep={maxStep}
                    steps={steps}
                    onStepClick={setStep}
                />
            )}

            {error && step < 5 && (
                <div className="max-w-md mx-auto mb-6 p-4 bg-error/10 border border-error/20 rounded-lg text-error text-center">
                    {error}
                </div>
            )}

            <div className="mb-8 animate-in slide-in-from-right-4 fade-in duration-500 ease-out" key={step}>
                {!isReadOnly && step === 1 && <Step4Delivery dictionary={dictionary} userPlan={userPlan} locale={locale} userEmail={userEmail} />}
                {!isReadOnly && step === 2 && <Step3Recipient dictionary={dictionary.wizard.step3} userEmail={userEmail} />}
                {!isReadOnly && step === 3 && <Step1TypeSelect dictionary={dictionary.wizard.step1} userPlan={userPlan} />}
                {!isReadOnly && step === 4 && (
                    <Step2Content
                        dictionary={dictionary.wizard.step2}
                        maxTextChars={maxTextChars}
                        maxAudioSeconds={maxAudioSeconds}
                        locale={locale}
                    />
                )}
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
                        error={error}
                        errorCode={errorCode}
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
                    {step < 5 && step !== 3 && (
                        <button onClick={handleNext} disabled={!canProceed} className="btn-primary">
                            {dictionary.common.next}
                        </button>
                    )}
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
