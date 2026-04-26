'use client'

import { createContext, useContext, useState, useEffect, ReactNode, useCallback, useMemo } from 'react'
import { saveAudioDraft, getAudioDraft, clearAudioDraft } from '@/lib/indexed-db'

export type MessageType = 'text' | 'audio' | 'video'
export type DeliveryMode = 'date' | 'checkin'

export interface WizardData {
    // Step 1: Type
    messageType: MessageType | null

    // Step 2: Content
    title: string
    textContent: string
    audioBlob: Blob | null
    existingAudioUrl?: string | null
    audioDuration: number
    photos: Array<{ file: File; caption: string; previewUrl: string }>
    // Fotos ya guardadas en la BD (cuando se edita un mensaje existente)
    existingPhotoUrls?: Array<{ url: string; path: string; caption: string }>

    // Step 3: Recipient
    recipients: Array<{ name: string; email: string }>

    // Step 4: Delivery
    deliveryMode: DeliveryMode | null
    deliverAt: string // ISO date string
    checkinIntervalDays: 30 | 60 | 90
    trustedContactIds: string[]
    trustedContactEmails: string[]
}

interface WizardContextType {
    step: number
    data: WizardData
    setStep: (step: number) => void
    updateData: (updates: Partial<WizardData>) => void
    canProceed: boolean
    reset: () => void
    maxStep: number
    clearDrafts: () => Promise<void>
    clearStorageOnly: () => Promise<void>
}

const initialData: WizardData = {
    messageType: null,
    title: '',
    textContent: '',
    audioBlob: null,
    existingAudioUrl: null,
    audioDuration: 0,
    photos: [],
    existingPhotoUrls: [],
    recipients: [{ name: '', email: '' }],
    deliveryMode: null,
    deliverAt: '',
    checkinIntervalDays: 30, // Default to 30
    trustedContactIds: [],
    trustedContactEmails: [],
}

const STORAGE_KEY = 'voiceforlater_wizard_draft'

const WizardContext = createContext<WizardContextType | null>(null)

export function WizardProvider({ children, initialData: propInitialData }: { children: ReactNode; initialData?: Partial<WizardData> }) {
    // If editing an existing message, start at Step 5 (Review) with all steps unlocked.
    const [step, setStep] = useState(propInitialData?.messageType ? 5 : 1)
    const [maxStep, setMaxStep] = useState(step)
    const [data, setData] = useState<WizardData>({ ...initialData, ...propInitialData })
    // If editing, we consider it loaded immediately (server data), otherwise wait for client hydration
    const [isLoaded, setIsLoaded] = useState(!!propInitialData)

    // Sync maxStep with step
    useEffect(() => {
        if (step > maxStep) {
            setMaxStep(step)
        }
    }, [step, maxStep])

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

                if (savedMeta) {
                    const parsed = JSON.parse(savedMeta)
                    loadedData = { ...initialData, ...parsed.data }
                    // Step is intentionally not restored — always restart from step 1
                    // to prevent stale step numbers after wizard reorders.
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
                setStep(1)
                setMaxStep(1)
            } catch (err) {
                if (process.env.NODE_ENV !== 'production') console.error('Failed to load drafts:', err)
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
            saveAudioDraft(data.audioBlob).catch(err => { if (process.env.NODE_ENV !== 'production') console.error('Failed to save audio draft:', err) })
        } else {
            // Only clear if we explicitly set it to null AND it's not the initial load
            // (But here we just save what we have. If null, we might want to clear, 
            // but usually we rely on clearDrafts to wipe everything)
        }
    }, [data.audioBlob, isLoaded])

    const updateData = useCallback((updates: Partial<WizardData>) => {
        setData((prev) => ({ ...prev, ...updates }))
    }, [])

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
        setMaxStep(1)
        setData(initialData)
    }

    // Validate current step
    const canProceed = (() => {
        switch (step) {
            case 1: // Cuando (Delivery)
                if (data.deliveryMode === 'date') {
                    return data.deliverAt !== ''
                }
                if (data.deliveryMode === 'checkin') {
                    // Requires at least one valid trusted contact
                    return !!data.trustedContactIds && data.trustedContactIds.some(id => id && id.trim() !== '')
                }
                return false
            case 2: // A quién (Recipient)
                const isConflict = data.deliveryMode === 'checkin' && data.recipients.some(r => 
                    r.email && data.trustedContactEmails?.some(tcEmail => tcEmail.trim().toLowerCase() === r.email.trim().toLowerCase())
                );
                return !isConflict && data.recipients.length > 0 &&
                    data.recipients.every(r => r.name.trim().length > 0 && r.email.includes('@'))
            case 3: // Formato (Type) — auto-advances on click, canProceed not used for Next
                return data.messageType !== null
            case 4: // Contenido (Content)
                const validTitle = data.title.trim().length > 0 && data.title.length <= 80
                if (!validTitle) return false

                if (data.messageType === 'text') {
                    return data.textContent.trim().length > 0
                }
                return data.audioBlob !== null || !!data.existingAudioUrl
            case 5:
                return true // Review step
            default:
                return false
        }
    })()

    const contextValue = useMemo(() => ({
        step,
        data,
        setStep,
        maxStep,
        updateData,
        canProceed,
        reset,
        clearDrafts,
        clearStorageOnly
    }), [step, data, maxStep, updateData, canProceed, clearDrafts])

    if (!isLoaded) {
        // Optional: Render nothing or a loader while hydrating
        return null
    }

    return (
        <WizardContext.Provider value={contextValue}>
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
