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
    }
}

export function Step3Recipient({ dictionary }: Step3Props) {
    const { data, updateData } = useWizard()

    return (
        <div className="space-y-6">
            <div className="text-center">
                <h2 className="text-2xl font-bold">{dictionary.title}</h2>
                <p className="text-muted-foreground mt-2">{dictionary.subtitle}</p>
            </div>

            <div className="max-w-md mx-auto space-y-4">
                <div>
                    <label htmlFor="recipientName" className="block text-sm font-medium mb-2">
                        {dictionary.nameLabel}
                    </label>
                    <input
                        id="recipientName"
                        type="text"
                        value={data.recipientName}
                        onChange={(e) => updateData({ recipientName: e.target.value })}
                        placeholder={dictionary.namePlaceholder}
                        className="w-full px-4 py-3 bg-input border border-border rounded-lg focus:ring-2 focus:ring-ring focus:border-transparent transition-all placeholder:text-muted-foreground"
                    />
                </div>

                <div>
                    <label htmlFor="recipientEmail" className="block text-sm font-medium mb-2">
                        {dictionary.emailLabel}
                    </label>
                    <input
                        id="recipientEmail"
                        type="email"
                        value={data.recipientEmail}
                        onChange={(e) => updateData({ recipientEmail: e.target.value })}
                        placeholder={dictionary.emailPlaceholder}
                        className="w-full px-4 py-3 bg-input border border-border rounded-lg focus:ring-2 focus:ring-ring focus:border-transparent transition-all placeholder:text-muted-foreground"
                    />
                </div>
            </div>
        </div>
    )
}
