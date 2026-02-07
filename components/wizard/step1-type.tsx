'use client'

import { useWizard, MessageType } from './wizard-context'
import { useRouter } from 'next/navigation'

interface Step1Props {
    dictionary: {
        title: string
        subtitle: string
        text: { title: string; description: string }
        audio: { title: string; description: string }
        video: { title: string; description: string; upgradeToPro: string }
    }
    userPlan: 'free' | 'pro'
}

export function Step1TypeSelect({ dictionary, userPlan }: Step1Props) {
    const { data, updateData } = useWizard()
    const router = useRouter()

    const handleTypeSelect = async (type: MessageType) => {
        if (type === 'video' && userPlan !== 'pro') {
            // Redirect to upgrade with return path
            try {
                const response = await fetch('/api/stripe/checkout', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        redirectPath: '/messages/create?type=video'
                    })
                })
                const { url } = await response.json()
                if (url) router.push(url)
            } catch (error) {
                console.error('Upgrade redirect failed', error)
            }
            return
        }

        updateData({ messageType: type })
    }

    const options: {
        type: MessageType;
        title: string;
        description: string;
        icon: React.ReactNode;
        isPro?: boolean
    }[] = [
            {
                type: 'text',
                title: dictionary.text.title,
                description: dictionary.text.description,
                icon: (
                    <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                ),
            },
            {
                type: 'audio',
                title: dictionary.audio.title,
                description: dictionary.audio.description,
                icon: (
                    <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                    </svg>
                ),
            },
            {
                type: 'video',
                title: dictionary.video.title,
                description: dictionary.video.description,
                isPro: true,
                icon: (
                    <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                ),
            },
        ]

    return (
        <div className="space-y-6">
            <div className="text-center">
                <h2 className="text-2xl font-bold">{dictionary.title}</h2>
                <p className="text-muted-foreground mt-2">{dictionary.subtitle}</p>
            </div>

            <div className="grid gap-4 sm:grid-cols-3 max-w-3xl mx-auto">
                {options.map((option) => {
                    const isLocked = option.isPro && userPlan !== 'pro'

                    return (
                        <button
                            key={option.type}
                            onClick={() => handleTypeSelect(option.type)}
                            className={`relative p-6 rounded-xl border-2 text-left transition-all group overflow-hidden ${data.messageType === option.type
                                ? 'border-primary bg-primary/5 shadow-md shadow-primary/20'
                                : 'border-border bg-card shadow-sm hover:shadow-md hover:border-primary/50'
                                }`}
                        >
                            {isLocked && (
                                <div className="absolute top-3 right-3 bg-primary text-primary-foreground text-[10px] font-bold px-2 py-0.5 rounded-full">
                                    PRO
                                </div>
                            )}

                            <div className={`mb-4 transition-colors ${data.messageType === option.type ? 'text-primary' : 'text-muted-foreground group-hover:text-primary'}`}>
                                {option.icon}
                            </div>
                            <h3 className="font-semibold mb-1">{option.title}</h3>
                            <p className="text-sm text-muted-foreground">{option.description}</p>

                            {isLocked && (
                                <div className="mt-4 pt-4 border-t border-border/50 w-full">
                                    <span className="flex items-center justify-center gap-2 text-primary text-sm font-semibold group-hover:scale-105 transition-transform">
                                        {dictionary.video.upgradeToPro}
                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                                        </svg>
                                    </span>
                                </div>
                            )}
                        </button>
                    )
                })}
            </div>
        </div>
    )
}
