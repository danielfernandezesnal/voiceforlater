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
        invalidScheduleDate?: string
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
    error?: string | null
    errorCode?: string | null
}

export function Step5Review({
    dictionary,
    typeDictionary,
    onSubmit,
    isSubmitting,
    tosAccepted,
    onTosChange,
    locale,
    isReadOnly = false,
    error,
    errorCode
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
        if (data.deliveryMode === 'date' && data.deliverAt) {
            return dictionary.deliveryDate.replace('{date}', formatDate(data.deliverAt))
        }
        if (data.deliveryMode === 'checkin') {
            return dictionary.deliveryCheckin
        }
        return '—'
    }

    const reviewItems = [
        {
            label: dictionary.deliveryRule,
            value: getDeliveryText(),
            step: 1  // Cuando
        },
        {
            label: dictionary.recipient,
            value: data.recipients.map(r => `${r.name} (${r.email})`).join('\n'),
            step: 2  // A quién
        },
        {
            label: dictionary.messageType,
            value: data.messageType === 'text'
                ? dictionary.formatText
                : data.messageType === 'audio'
                    ? `🎤 ${dictionary.formatAudio}${data.audioDuration > 0 ? ` (${Math.round(data.audioDuration)}s)` : ''}`
                    : `📹 ${dictionary.formatVideo}${data.audioDuration > 0 ? ` (${Math.round(data.audioDuration)}s)` : ''}`,
            step: 3  // Formato
        },
        {
            label: dictionary.titleLabel,
            value: data.title,
            step: 4  // Contenido
        },
        ...(data.messageType === 'text' && !isReadOnly ? [{
            label: dictionary.content,
            value: data.textContent.substring(0, 100) + (data.textContent.length > 100 ? '...' : ''),
            step: 4  // Contenido
        }] : []),
    ]

    // ── Vista de mensaje ya enviado (readonly) ──────────────────────────────
    if (isReadOnly) {
        const audioUrl = data.existingAudioUrl || null
        const isAudio = data.messageType === 'audio'
        const isVideo = data.messageType === 'video'
        const isText = data.messageType === 'text'

        const labelPlay = locale === 'es' ? 'Reproducir' : 'Play'
        const labelDownload = locale === 'es' ? 'Descargar' : 'Download'
        const labelMessage = locale === 'es' ? 'Mensaje' : 'Message'
        const labelSentTo = locale === 'es' ? 'Enviado a' : 'Sent to'
        const labelSentOn = locale === 'es' ? 'Enviado el' : 'Sent on'
        const labelDelivery = locale === 'es' ? 'Entrega' : 'Delivery'

        // Metadata items for the info card
        const metaItems = [
            {
                label: dictionary.messageType,
                value: isText
                    ? `📝 ${dictionary.formatText}`
                    : isAudio
                        ? `🎤 ${dictionary.formatAudio}`
                        : `📹 ${dictionary.formatVideo}`,
            },
            {
                label: dictionary.titleLabel,
                value: data.title || '—',
            },
            {
                label: labelSentTo,
                value: data.recipients.map(r => `${r.name} (${r.email})`).join(', '),
            },
            {
                label: labelDelivery,
                value: getDeliveryText(),
            },
        ]

        return (
            <div className="space-y-6 max-w-lg mx-auto">
                {/* Info card */}
                <div style={{ background: '#fffdf9', border: '1px solid #e8e0d0', borderRadius: '8px', overflow: 'hidden' }}>
                    {metaItems.map((item, index) => (
                        <div
                            key={item.label}
                            style={{
                                padding: '14px 18px',
                                borderBottom: index !== metaItems.length - 1 ? '1px solid #e8e0d0' : 'none',
                            }}
                        >
                            <div style={{ fontSize: '11px', fontWeight: 500, letterSpacing: '0.06em', textTransform: 'uppercase', color: '#9a8070', marginBottom: '3px' }}>
                                {item.label}
                            </div>
                            <div style={{ fontSize: '14px', color: '#4a3728' }}>
                                {item.value}
                            </div>
                        </div>
                    ))}
                </div>

                {/* Contenido del mensaje */}
                <div style={{ background: '#fffdf9', border: '1px solid #e8e0d0', borderRadius: '8px', overflow: 'hidden' }}>
                    <div style={{ padding: '14px 18px', borderBottom: '1px solid #e8e0d0' }}>
                        <div style={{ fontSize: '11px', fontWeight: 500, letterSpacing: '0.06em', textTransform: 'uppercase', color: '#9a8070' }}>
                            {labelMessage}
                        </div>
                    </div>

                    <div style={{ padding: '18px' }}>
                        {isText && (
                            <p style={{ fontSize: '15px', color: '#4a3728', lineHeight: 1.7, whiteSpace: 'pre-wrap', margin: 0 }}>
                                {data.textContent || '—'}
                            </p>
                        )}

                        {(isAudio || isVideo) && audioUrl && (
                            <div className="space-y-4">
                                {isVideo ? (
                                    <video
                                        controls
                                        src={audioUrl}
                                        style={{ width: '100%', borderRadius: '6px', background: '#000' }}
                                    />
                                ) : (
                                    <audio
                                        controls
                                        src={audioUrl}
                                        style={{ width: '100%' }}
                                    />
                                )}
                                <a
                                    href={audioUrl}
                                    download
                                    style={{
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: '6px',
                                        fontSize: '13px',
                                        color: '#c4622a',
                                        textDecoration: 'none',
                                        padding: '7px 14px',
                                        border: '1px solid #e8d8c8',
                                        borderRadius: '4px',
                                        background: 'rgba(196,98,42,0.04)',
                                    }}
                                >
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                                        <polyline points="7 10 12 15 17 10" />
                                        <line x1="12" y1="15" x2="12" y2="3" />
                                    </svg>
                                    {labelDownload}
                                </a>
                            </div>
                        )}

                        {(isAudio || isVideo) && !audioUrl && (
                            <p style={{ fontSize: '14px', color: '#9a8070', fontStyle: 'italic', margin: 0 }}>
                                {locale === 'es' ? 'El archivo de audio/video no está disponible.' : 'The audio/video file is not available.'}
                            </p>
                        )}
                    </div>
                </div>

                {/* Fotos adjuntas */}
                {data.photos && data.photos.length > 0 && (
                    <div style={{ background: '#fffdf9', border: '1px solid #e8e0d0', borderRadius: '8px', overflow: 'hidden' }}>
                        <div style={{ padding: '14px 18px', borderBottom: '1px solid #e8e0d0' }}>
                            <div style={{ fontSize: '11px', fontWeight: 500, letterSpacing: '0.06em', textTransform: 'uppercase', color: '#9a8070' }}>
                                {locale === 'es' ? `Fotos adjuntas (${data.photos.length})` : `Attached photos (${data.photos.length})`}
                            </div>
                        </div>
                        <div style={{ padding: '18px' }}>
                            <div className={`grid gap-4 ${data.photos.length === 1 ? 'grid-cols-1' : 'grid-cols-2'}`}>
                                {data.photos.map((photo, i) => (
                                    <div key={i}>
                                        <div className="rounded-xl overflow-hidden aspect-[4/3] bg-muted">
                                            <img src={photo.previewUrl} alt={photo.caption} className="w-full h-full object-cover" />
                                        </div>
                                        {photo.caption && (
                                            <p className="text-xs text-muted-foreground mt-1 truncate">{photo.caption}</p>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        )
    }

    // ── Vista de revisión antes de guardar (modo normal) ────────────────────
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
                        <button
                            onClick={() => setStep(item.step)}
                            className="p-2 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-full transition-colors"
                            aria-label="Edit"
                        >
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                        </button>
                    </div>
                ))}
            </div>

            {data.photos && data.photos.length > 0 && (
                <div className="max-w-md mx-auto space-y-2 mt-6">
                    <p className="text-sm text-muted-foreground font-medium">
                        {locale === 'es' ? `Fotos adjuntas (${data.photos.length})` : `Attached photos (${data.photos.length})`}
                    </p>
                    <div className={`grid gap-4 ${data.photos.length === 1 ? 'grid-cols-1' : 'grid-cols-2'}`}>
                        {data.photos.map((photo, i) => (
                            <div key={i}>
                                <div className="rounded-xl overflow-hidden aspect-[4/3] bg-muted">
                                    <img src={photo.previewUrl} alt={photo.caption} className="w-full h-full object-cover" />
                                </div>
                                {photo.caption && (
                                    <p className="text-xs text-muted-foreground mt-1 truncate">{photo.caption}</p>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            )}

            <div className="max-w-md mx-auto py-2">
                <label className="flex items-center gap-3 cursor-pointer group">
                    <div className="relative flex items-center justify-center">
                        <input
                            type="checkbox"
                            checked={tosAccepted}
                            onChange={(e) => onTosChange(e.target.checked)}
                            className="peer appearance-none w-5 h-5 rounded border-2 border-[#c4622a] bg-card checked:bg-primary checked:border-primary transition-all cursor-pointer"
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

            {error && (
                <div className="max-w-md mx-auto mb-4 p-4 bg-error/10 border border-error/20 rounded-lg text-error text-center text-sm">
                    {error}
                </div>
            )}

            <div className="flex flex-col sm:flex-row justify-center gap-3">
                <button
                    onClick={() => setStep(errorCode === 'INVALID_SCHEDULE' ? 1 : 4)} // Go to When step if date error, else Content
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
        </div>
    )
}
