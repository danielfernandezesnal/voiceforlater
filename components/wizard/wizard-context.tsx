'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { saveAudioDraft, getAudioDraft, clearAudioDraft } from '@/lib/indexed-db'

export type MessageType = 'text' | 'audio' | 'video'
export type DeliveryMode = 'date' | 'checkin'

export interface WizardData {
    // Step 1: Type
    messageType: MessageType | null

    // Step 2: Content
    textContent: string
    audioBlob: Blob | null
    existingAudioUrl?: string | null
    audioDuration: number

    // Step 3: Recipient
    recipientName: string
    recipientEmail: string

    // Step 4: Delivery
    deliveryMode: DeliveryMode | null
    deliverAt: string // ISO date string
    checkinIntervalDays: 30 | 60 | 90
    trustedContactIds: string[]
}

interface WizardContextType {
    step: number
    data: WizardData
    setStep: (step: number) => void
    updateData: (updates: Partial<WizardData>) => void
    canProceed: boolean
    reset: () => void
    clearDrafts: () => Promise<void>
    clearStorageOnly: () => Promise<void>
}

const initialData: WizardData = {
    messageType: null,
    textContent: '',
    audioBlob: null,
    existingAudioUrl: null,
    audioDuration: 0,
    recipientName: '',
    recipientEmail: '',
    deliveryMode: null,
    deliverAt: '',
    checkinIntervalDays: 30, // Default to 30
    trustedContactIds: [],
}

const STORAGE_KEY = 'voiceforlater_wizard_draft'

const WizardContext = createContext<WizardContextType | null>(null)

export function WizardProvider({ children, initialData: propInitialData }: { children: ReactNode; initialData?: Partial<WizardData> }) {
    // If editing, start at Step 2 (Content) or Step 5 (Review), skipping Step 1 (Type)
    const [step, setStep] = useState(propInitialData?.messageType ? 2 : 1)
    const [data, setData] = useState<WizardData>({ ...initialData, ...propInitialData })
    // If editing, we consider it loaded immediately (server data), otherwise wait for client hydration
    const [isLoaded, setIsLoaded] = useState(!!propInitialData)

    // Load drafts on mount
    useEffect(() => {
        const loadDrafts = async () => {
            if (propInitialData) {
                // If provided props changed later? Usually not the case for initialData.
                // Just ensure data stays synced if needed, but for now logic is fine.
                // We mainly want to avoid overwriting with local storage.
                return
            }

            try {
                // 1. Load text/meta from LocalStorage
                const savedMeta = localStorage.getItem(STORAGE_KEY)
                let loadedData = initialData
                let loadedStep = 1

                if (savedMeta) {
                    const parsed = JSON.parse(savedMeta)
                    loadedData = { ...initialData, ...parsed.data }
                    loadedStep = parsed.step || 1
                }

                // 2. Load audio from IndexedDB
                const audioBlob = await getAudioDraft()
                if (audioBlob) {
                    loadedData.audioBlob = audioBlob
                    // If we have audio but data says text, correct it or vice-versa
                    if (loadedData.messageType === 'text') {
                        // User might have switched types, let's respect the type
                    }
                }

                setData(loadedData)
                setStep(loadedStep)
            } catch (err) {
                console.error('Failed to load drafts:', err)
            } finally {
                setIsLoaded(true)
            }
        }

        loadDrafts()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    // Save text/meta to LocalStorage whenever it changes
    useEffect(() => {
        if (!isLoaded) return

        const stateToSave = {
            step,
            // Exclude Blob from LocalStorage
            data: {
                ...data,
                audioBlob: null
            }
        }
        localStorage.setItem(STORAGE_KEY, JSON.stringify(stateToSave))
    }, [step, data, isLoaded])

    // Save audio to IndexedDB whenever it changes
    useEffect(() => {
        if (!isLoaded) return

        if (data.audioBlob) {
            saveAudioDraft(data.audioBlob).catch(err => console.error('Failed to save audio draft:', err))
        } else {
            // Only clear if we explicitly set it to null AND it's not the initial load
            // (But here we just save what we have. If null, we might want to clear, 
            // but usually we rely on clearDrafts to wipe everything)
        }
    }, [data.audioBlob, isLoaded])

    const updateData = (updates: Partial<WizardData>) => {
        setData((prev) => ({ ...prev, ...updates }))
    }

    const clearDrafts = async () => {
        localStorage.removeItem(STORAGE_KEY)
        await clearAudioDraft()
        setStep(1)
        setData(initialData)
    }

    const clearStorageOnly = async () => {
        localStorage.removeItem(STORAGE_KEY)
        await clearAudioDraft()
        // Do NOT reset state to avoid UI flash before navigation
    }

    const reset = () => {
        // This is just in-memory reset, for full cleanup use clearDrafts
        setStep(1)
        setData(initialData)
    }

    // Validate current step
    const canProceed = (() => {
        switch (step) {
            case 1:
                return data.messageType !== null
            case 2:
                if (data.messageType === 'text') {
                    return data.textContent.trim().length > 0
                }
                return data.audioBlob !== null || (!!data.existingAudioUrl && data.messageType === 'audio')
            case 3:
                return data.recipientName.trim().length > 0 &&
                    data.recipientEmail.includes('@')
            case 4:
                if (data.deliveryMode === 'date') {
                    return data.deliverAt !== ''
                }
                return data.deliveryMode === 'checkin'
            case 5:
                return true // Review step
            default:
                return false
        }
    })()

    if (!isLoaded) {
        // Optional: Render nothing or a loader while hydrating
        return null
    }

    return (
        <WizardContext.Provider value={{ step, data, setStep, updateData, canProceed, reset, clearDrafts, clearStorageOnly }}>
            {children}
        </WizardContext.Provider>
    )
}

export function useWizard() {
    const context = useContext(WizardContext)
    if (!context) {
        throw new Error('useWizard must be used within a WizardProvider')
    }
    return context
}
