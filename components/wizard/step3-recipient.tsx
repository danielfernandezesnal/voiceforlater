'use client'

import { useWizard } from './wizard-context'

interface Step3Props {
    dictionary: {
        title: string
        subtitle: string
        nameLabel: string
        namePlaceholder: string
        emailLabel: string
        emailPlaceholder: string
        addRecipient?: string
        recipientN?: string
        posthumousContactWarning?: string
    }
}

export function Step3Recipient({ dictionary }: Step3Props) {
    const { data, updateData } = useWizard()
    const recipients = data.recipients

    const updateRecipient = (index: number, field: 'name' | 'email', value: string) => {
        const updated = [...recipients]
        updated[index] = { ...updated[index], [field]: value }
        updateData({ recipients: updated })
    }

    const addRecipient = () => {
        if (recipients.length < 10) {
            updateData({ recipients: [...recipients, { name: '', email: '' }] })
        }
    }

    const removeRecipient = (index: number) => {
        if (recipients.length > 1) {
            updateData({ recipients: recipients.filter((_, i) => i !== index) })
        }
    }

    return (
        <div className="space-y-6">
            <div className="text-center">
                <h2 className="text-2xl font-bold">{dictionary.title}</h2>
                <p className="text-muted-foreground mt-2">{dictionary.subtitle}</p>
            </div>
            <div className="max-w-md mx-auto space-y-6">
                {recipients.map((recipient, index) => (
                    <div key={index} className="space-y-3 p-4 border border-border/60 rounded-xl bg-card relative">
                        {recipients.length > 1 && (
                            <div className="flex items-center justify-between mb-1">
                                <span className="text-[0.62rem] font-medium uppercase tracking-widest text-muted-foreground">
                                    {dictionary.recipientN?.replace('{n}', String(index + 1)) || `Destinatario ${index + 1}`}
                                </span>
                                <button
                                    onClick={() => removeRecipient(index)}
                                    className="text-destructive/70 hover:text-destructive text-xs font-medium transition-colors"
                                >
                                    ✕ Quitar
                                </button>
                            </div>
                        )}
                        <div>
                            <label className="block text-sm font-medium mb-2">{dictionary.nameLabel}</label>
                            <input
                                type="text"
                                value={recipient.name}
                                onChange={(e) => updateRecipient(index, 'name', e.target.value)}
                                placeholder={dictionary.namePlaceholder}
                                className="w-full px-4 py-3 bg-input border border-border rounded-lg focus:ring-2 focus:ring-ring focus:border-transparent transition-all placeholder:text-muted-foreground"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-2">{dictionary.emailLabel}</label>
                            <input
                                type="email"
                                value={recipient.email}
                                onChange={(e) => updateRecipient(index, 'email', e.target.value)}
                                placeholder={dictionary.emailPlaceholder}
                                className="w-full px-4 py-3 bg-input border border-border rounded-lg focus:ring-2 focus:ring-ring focus:border-transparent transition-all placeholder:text-muted-foreground"
                            />
                        </div>
                    </div>
                ))}

                {recipients.length < 10 && (
                    <button
                        onClick={addRecipient}
                        className="w-full py-3 border-2 border-dashed border-border/60 rounded-xl text-sm text-muted-foreground hover:border-primary/40 hover:text-primary transition-all"
                    >
                        + {dictionary.addRecipient || 'Agregar destinatario'}
                    </button>
                )}

                {data.deliveryMode === 'checkin' && data.trustedContactIds.length === 0 && dictionary.posthumousContactWarning && (
                    <div className="text-sm font-medium text-muted-foreground mt-4 flex items-start gap-2 max-w-md">
                        <span>{dictionary.posthumousContactWarning}</span>
                    </div>
                )}
            </div>
        </div>
    )
}
