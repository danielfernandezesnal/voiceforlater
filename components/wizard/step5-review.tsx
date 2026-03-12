'use client'

import { useWizard } from './wizard-context'

interface Step5Props {
    dictionary: {
        title: string
        subtitle: string
        messageType: string
        formatText: string
        formatAudio: string
        formatVideo: string
        titleLabel: string
        content: string
        recipient: string
        deliveryRule: string
        deliveryDate: string
        deliveryCheckin: string
        submit: string
        editMessage: string
        submitting: string
        audioContent: string
        videoContent: string
        noContactWarning: string
        posthumousSaveWarning?: string
        agreeTerms: string
        termsLink: string
    }
    typeDictionary: {
        text: { title: string }
        audio: { title: string }
        video: { title: string }
    }
    onSubmit: () => Promise<void>
    isSubmitting: boolean
    tosAccepted: boolean
    onTosChange: (accepted: boolean) => void
    locale: string
    isReadOnly?: boolean
}

export function Step5Review({
    dictionary,
    typeDictionary,
    onSubmit,
    isSubmitting,
    tosAccepted,
    onTosChange,
    locale,
    isReadOnly = false
}: Step5Props) {
    const { data, setStep } = useWizard()

    const formatDate = (dateString: string) => {
        if (!dateString) return ''
        const date = new Date(dateString)
        const isES = locale === 'es'

        // Date segment
        const dateOptions: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short', year: 'numeric' }
        let datePart = new Intl.DateTimeFormat(locale, dateOptions).format(date)
        if (isES) {
            datePart = datePart.toLowerCase()
        }

        // Time segment
        const timeOptions: Intl.DateTimeFormatOptions = { hour: 'numeric', minute: '2-digit', hour12: !isES }
        let timePart = new Intl.DateTimeFormat(locale, timeOptions).format(date)
        if (isES) {
            const h24 = date.getHours().toString().padStart(2, '0')
            const m = date.getMinutes().toString().padStart(2, '0')
            timePart = `${h24}:${m}hs`
        }

        return `${datePart} · ${timePart}`
    }

    const getDeliveryText = () => {
        if (data.deliveryMode === 'date') {
            return dictionary.deliveryDate.replace('{date}', formatDate(data.deliverAt))
        }
        return dictionary.deliveryCheckin
    }

    const reviewItems = [
        {
            label: dictionary.messageType,
            value: data.messageType === 'text'
                ? dictionary.formatText
                : data.messageType === 'audio'
                    ? `🎤 ${dictionary.formatAudio} (${Math.round(data.audioDuration)}s)`
                    : `📹 ${dictionary.formatVideo} (${Math.round(data.audioDuration)}s)`,
            step: 1
        },
        {
            label: dictionary.titleLabel,
            value: data.title,
            step: 2
        },
        ...(data.messageType === 'text' ? [{
            label: dictionary.content,
            value: data.textContent.substring(0, 100) + (data.textContent.length > 100 ? '...' : ''),
            step: 2
        }] : []),
        {
            label: dictionary.recipient,
            value: data.recipients.map(r => `${r.name} (${r.email})`).join('\n'),
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
            </div>


            {!isReadOnly && (
                <div className="max-w-md mx-auto py-2">
                    <label className="flex items-center gap-3 cursor-pointer group">
                        <div className="relative flex items-center justify-center">
                            <input
                                type="checkbox"
                                checked={tosAccepted}
                                onChange={(e) => onTosChange(e.target.checked)}
                                className="peer appearance-none w-5 h-5 rounded border border-border bg-card checked:bg-primary checked:border-primary transition-all cursor-pointer"
                            />
                            <svg
                                className="absolute w-3 h-3 text-primary-foreground opacity-0 peer-checked:opacity-100 transition-opacity pointer-events-none"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                                strokeWidth={4}
                            >
                                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                            </svg>
                        </div>
                        <span className="text-sm text-foreground/80 selection:bg-transparent">
                            {dictionary.agreeTerms}
                            <a
                                href={`/${locale}/terms`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-primary hover:underline font-medium"
                                onClick={(e) => e.stopPropagation()}
                            >
                                {dictionary.termsLink}
                            </a>
                        </span>
                    </label>
                </div>
            )}

            {!isReadOnly && (
                <div className="flex flex-col sm:flex-row justify-center gap-3">
                    <button
                        onClick={() => setStep(2)} // Go to Content step
                        disabled={isSubmitting}
                        className="px-8 py-3 bg-card border border-border text-foreground rounded-lg font-medium hover:bg-secondary/50 disabled:opacity-50 transition-all font-sans"
                    >
                        {dictionary.editMessage}
                    </button>
                    <button
                        onClick={onSubmit}
                        disabled={isSubmitting || !tosAccepted}
                        className="px-8 py-3 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-primary/25 font-sans"
                    >
                        {isSubmitting ? dictionary.submitting : dictionary.submit}
                    </button>
                </div>
            )}
        </div>
    )
}
