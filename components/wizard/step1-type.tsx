'use client'

import { useWizard, MessageType } from './wizard-context'
import { useRouter } from 'next/navigation'
import { trackEventClient } from '@/lib/analytics/client'

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
    const { data, updateData, setStep } = useWizard()
    const router = useRouter()

    const handleTypeSelect = async (type: MessageType) => {
        if (type === 'video' && userPlan !== 'pro') {
            trackEventClient('conversion.video_attempt_free');
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
        // Use a small timeout to ensure state update propagates before navigation
        setTimeout(() => setStep(4), 50)
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
                <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
            ),
        },
        {
            type: 'audio',
            title: dictionary.audio.title,
            description: dictionary.audio.description,
            icon: (
                <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
                <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
            ),
        },
    ]

    return (
        <div className="space-y-8">
            <div className="text-center">
                <h2 className="font-serif text-2xl sm:text-3xl font-semibold" style={{ color: '#2C2C2C' }}>
                    {dictionary.title}
                </h2>
                <p className="mt-2 text-base leading-relaxed" style={{ color: '#6B6B6B' }}>
                    {dictionary.subtitle}
                </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-5 max-w-3xl mx-auto">
                {options.map((option) => {
                    const isLocked = option.isPro && userPlan !== 'pro'
                    const isSelected = data.messageType === option.type

                    return (
                        <button
                            key={option.type}
                            onClick={() => handleTypeSelect(option.type)}
                            className={`relative flex flex-col items-center text-center p-8 rounded-xl transition-all duration-200 overflow-hidden ${
                                isSelected
                                    ? 'border-2 border-[#C4623A] bg-[#F9F5F0] shadow-[0_2px_12px_rgba(196,98,58,0.15)]'
                                    : isLocked
                                    ? 'border border-[#E8DDD0] bg-[#FDFCFB] opacity-60 cursor-not-allowed'
                                    : 'border border-[#E8DDD0] bg-[#FDFCFB] hover:border-[#D4C4B0] hover:shadow-[0_2px_8px_rgba(0,0,0,0.08)] cursor-pointer'
                            }`}
                        >
                            {/* Checkmark — selected */}
                            {isSelected && (
                                <div className="absolute top-3 right-3 w-6 h-6 rounded-full bg-[#C4623A] flex items-center justify-center">
                                    <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                    </svg>
                                </div>
                            )}

                            {/* PRO badge — locked */}
                            {isLocked && (
                                <div className="absolute top-3 right-3 bg-[#C4623A] text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                                    PRO
                                </div>
                            )}

                            {/* Icon */}
                            <div className="mb-5" style={{ color: '#C4623A' }}>
                                {option.icon}
                            </div>

                            {/* Title */}
                            <h3 className="font-serif text-xl font-semibold mb-2" style={{ color: '#2C2C2C' }}>
                                {option.title}
                            </h3>

                            {/* Description */}
                            <p className="text-sm leading-relaxed" style={{ color: '#6B6B6B' }}>
                                {option.description}
                            </p>

                            {/* Upgrade prompt — locked video */}
                            {isLocked && (
                                <div className="mt-5 pt-4 border-t w-full" style={{ borderColor: '#E8DDD0' }}>
                                    <span className="flex items-center justify-center gap-2 text-sm font-semibold" style={{ color: '#C4623A' }}>
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
