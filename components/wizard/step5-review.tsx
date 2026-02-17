'use client'

import { useWizard } from './wizard-context'

interface Step5Props {
    dictionary: {
        title: string
        subtitle: string
        messageType: string
        content: string
        recipient: string
        deliveryRule: string
        deliveryDate: string
        deliveryCheckin: string
        submit: string
        editMessage: string
        submitting: string
    }
    typeDictionary: {
        text: { title: string }
        audio: { title: string }
    }
    onSubmit: () => Promise<void>
    isSubmitting: boolean
    isReadOnly?: boolean // Added prop
}

export function Step5Review({ dictionary, typeDictionary, onSubmit, isSubmitting, isReadOnly = false }: Step5Props) {
    const { data, setStep } = useWizard()

    const formatDate = (dateString: string) => {
        if (!dateString) return ''
        return new Date(dateString).toLocaleDateString(undefined, {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        })
    }

    const getDeliveryText = () => {
        if (data.deliveryMode === 'date') {
            return dictionary.deliveryDate.replace('{date}', formatDate(data.deliverAt))
        }
        return dictionary.deliveryCheckin.replace('{days}', String(data.checkinIntervalDays))
    }

    const reviewItems = [
        {
            label: dictionary.messageType,
            value: data.messageType === 'text' ? typeDictionary.text.title : typeDictionary.audio.title,
            step: 1
        },
        {
            label: dictionary.content,
            value: data.messageType === 'text'
                ? (data.textContent.substring(0, 100) + (data.textContent.length > 100 ? '...' : ''))
                : `🎤 ${Math.round(data.audioDuration)}s audio`,
            step: 2
        },
        {
            label: dictionary.recipient,
            value: `${data.recipientName} (${data.recipientEmail})`,
            step: 3
        },
        {
            label: dictionary.deliveryRule,
            value: getDeliveryText(),
            step: 4
        },
    ]

    return (
        <div className="space-y-6">
            <div className="text-center">
                <h2 className="text-2xl font-bold">{dictionary.title}</h2>
                <p className="text-muted-foreground mt-2">{dictionary.subtitle}</p>
            </div>

            <div className="max-w-md mx-auto bg-card border border-border rounded-xl overflow-hidden">
                {reviewItems.map((item, index) => (
                    <div
                        key={item.label}
                        className={`p-4 flex items-center justify-between group ${index !== reviewItems.length - 1 ? 'border-b border-border' : ''}`}
                    >
                        <div>
                            <div className="text-sm text-muted-foreground">{item.label}</div>
                            <div className="mt-1 font-medium">{item.value}</div>
                        </div>
                        {!isReadOnly && (
                            <button
                                onClick={() => setStep(item.step)}
                                className="p-2 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-full transition-colors"
                                aria-label="Edit"
                            >
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                </svg>
                            </button>
                        )}
                    </div>
                ))}
                {data.deliveryMode === 'checkin' && data.trustedContactIds.length === 0 && (
                    <div className="max-w-md mx-auto mb-6 p-3 bg-amber-50 border border-amber-200 rounded-lg text-amber-800 text-sm flex gap-2 animate-in fade-in">
                        <span className="text-base">⚠️</span>
                        <span>Este mensaje no se enviará automáticamente hasta que asignes un contacto de confianza.</span>
                    </div>
                )}
            </div>

            {
                !isReadOnly && (
                    <div className="flex flex-col sm:flex-row justify-center gap-3">
                        <button
                            onClick={() => setStep(2)} // Go to Content step
                            disabled={isSubmitting}
                            className="px-8 py-3 bg-card border border-border text-foreground rounded-lg font-medium hover:bg-secondary/50 disabled:opacity-50 transition-all"
                        >
                            {dictionary.editMessage}
                        </button>
                        <button
                            onClick={onSubmit}
                            disabled={isSubmitting}
                            className="px-8 py-3 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-primary/25"
                        >
                            {isSubmitting ? dictionary.submitting : dictionary.submit}
                        </button>
                    </div>
                )
            }
        </div >
    )
}
