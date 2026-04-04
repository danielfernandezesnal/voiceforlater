'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { v4 as uuidv4 } from 'uuid'

interface AudioRecorderProps {
    dictionary: {
        start: string
        stop: string
        preview: string
        delete: string
        timeLimit: string
        timer: string
        errorMicrophone: string
    }
    maxSeconds: number
    audioBlob: Blob | null
    existingAudioUrl?: string | null
    onRecordingComplete: (blob: Blob, duration: number) => void
    onUploadComplete: (path: string) => void
    onDelete: () => void
    locale?: string
}

const ACCEPTED_AUDIO_FORMATS = ['audio/mpeg', 'audio/mp4', 'audio/wav', 'audio/ogg', 'audio/m4a', 'audio/x-m4a']
const ACCEPTED_AUDIO_EXTENSIONS = '.mp3,.m4a,.wav,.ogg'
const MAX_AUDIO_MB = 25
const MAX_AUDIO_BYTES = MAX_AUDIO_MB * 1024 * 1024

export function AudioRecorder({
    dictionary,
    maxSeconds,
    audioBlob,
    existingAudioUrl,
    onRecordingComplete,
    onUploadComplete,
    onDelete,
    locale,
}: AudioRecorderProps) {
    const [isRecording, setIsRecording] = useState(false)
    const [mode, setMode] = useState<null | 'record' | 'upload'>(null)
    const [uploadedFile, setUploadedFile] = useState<File | null>(null)
    const [uploadError, setUploadError] = useState<string | null>(null)
    const [isUploading, setIsUploading] = useState(false)
    const [recordingTime, setRecordingTime] = useState(0)
    const [audioUrl, setAudioUrl] = useState<string | null>(null)
    const [error, setError] = useState<string | null>(null)
    const [isInitializing, setIsInitializing] = useState(false)

    const mediaRecorderRef = useRef<MediaRecorder | null>(null)
    const chunksRef = useRef<Blob[]>([])
    const timerRef = useRef<NodeJS.Timeout | null>(null)
    const audioRef = useRef<HTMLAudioElement | null>(null)

    // Generate audio URL from blob
    useEffect(() => {
        if (audioBlob) {
            const url = URL.createObjectURL(audioBlob)
            // eslint-disable-next-line
            setAudioUrl(url)
            return () => URL.revokeObjectURL(url)
        } else {
            setAudioUrl(null)
        }
    }, [audioBlob])

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60)
        const secs = seconds % 60
        return `${mins}:${secs.toString().padStart(2, '0')}`
    }

    const stopRecording = useCallback(() => {
        if (mediaRecorderRef.current && isRecording) {
            mediaRecorderRef.current.stop()
            setIsRecording(false)
            if (timerRef.current) {
                clearInterval(timerRef.current)
                timerRef.current = null
            }
        }
    }, [isRecording])

    const startRecording = async () => {
        setIsInitializing(true)
        setError(null)
        
        let stream: MediaStream
        try {
            if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
                throw new Error("navigator.mediaDevices no está disponible. ¿Estás usando HTTP sin localhost?")
            }
            stream = await navigator.mediaDevices.getUserMedia({ audio: true })
        } catch (err) {
            console.error('Error accessing microphone:', err)
            const msg = err instanceof Error ? err.message : String(err)
            setError(`Error de micrófono: ${msg}`)
            setTimeout(() => setIsInitializing(false), 800)
            return
        }

        try {
            // Eliminar la restricción dura de mimeType para que el navegador elija su formato nativo soportado automático
            const mediaRecorder = new MediaRecorder(stream)

            mediaRecorderRef.current = mediaRecorder
            chunksRef.current = []

            mediaRecorder.ondataavailable = (e) => {
                if (e.data.size > 0) {
                    chunksRef.current.push(e.data)
                }
            }

            mediaRecorder.onstop = () => {
                const blob = new Blob(chunksRef.current, { type: mediaRecorder.mimeType })
                onRecordingComplete(blob, recordingTime)
                stream.getTracks().forEach(track => track.stop())
            }

            mediaRecorder.start()
            setIsRecording(true)
            setRecordingTime(0)

            // Start timer
            timerRef.current = setInterval(() => {
                setRecordingTime((prev) => {
                    const next = prev + 1
                    if (next >= maxSeconds) {
                        stopRecording()
                    }
                    return next
                })
            }, 1000)
            setIsInitializing(false)
        } catch (err) {
            console.error('Error starting MediaRecorder:', err)
            const msg = err instanceof Error ? err.message : String(err)
            setError(`Error interno de grabación: ${msg}`)
            setTimeout(() => setIsInitializing(false), 800)
        }
    }

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        setUploadError(null)
        const file = e.target.files?.[0]
        if (!file) return

        const isValidFormat = ACCEPTED_AUDIO_FORMATS.includes(file.type) ||
            ACCEPTED_AUDIO_EXTENSIONS.split(',').some(ext => file.name.toLowerCase().endsWith(ext.replace('.', '')))

        if (!isValidFormat) {
            setUploadError(locale === 'es'
                ? `Formato no válido. Usa MP3, M4A, WAV u OGG.`
                : `Invalid format. Use MP3, M4A, WAV or OGG.`)
            return
        }
        if (file.size > MAX_AUDIO_BYTES) {
            setUploadError(locale === 'es'
                ? `El archivo supera el límite de ${MAX_AUDIO_MB}MB.`
                : `File exceeds the ${MAX_AUDIO_MB}MB limit.`)
            return
        }

        setIsUploading(true)
        try {
            const supabase = createClient()
            const { data: { user } } = await supabase.auth.getUser()

            if (!user) {
                throw new Error("No authenticated user")
            }

            const ext = file.name.split('.').pop() || 'mp3'
            const path = `${user.id}/${uuidv4()}.${ext}`

            const { error } = await supabase.storage
                .from('audio')
                .upload(path, file, { 
                    contentType: file.type,
                    upsert: false
                })

            if (error) throw error

            setUploadedFile(file)
            onUploadComplete(path)
        } catch (err) {
            console.error('Audio upload error:', err)
            setUploadError(locale === 'es' ? 'Error al subir el audio.' : 'Upload failed.')
        } finally {
            setIsUploading(false)
        }
    }

    // Has existing recording (either blob or existing)
    const finalAudioUrl = audioUrl || existingAudioUrl

    if (finalAudioUrl) {
        return (
            <div className="p-6 bg-card border border-border rounded-xl space-y-4">
                <div className="flex items-center justify-center">
                    <div className="w-16 h-16 rounded-full bg-success/10 flex items-center justify-center">
                        <svg className="w-8 h-8 text-success" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                    </div>
                </div>

                <audio ref={audioRef} src={finalAudioUrl} controls className="w-full" />

                <div className="flex gap-3 justify-center">
                    <button
                        onClick={onDelete}
                        className="px-4 py-2 text-sm text-error hover:bg-error/10 rounded-lg transition-colors"
                    >
                        {dictionary.delete}
                    </button>
                </div>
            </div>
        )
    }

    return (
        <div className="space-y-4">
            {/* Selector de modo */}
            {mode === null && (
                <div className="flex flex-col gap-3">
                    <button
                        type="button"
                        onClick={() => setMode('record')}
                        className="w-full flex items-center gap-5 p-5 bg-card border border-border/70 rounded-xl hover:border-primary/60 hover:bg-accent/5 transition-all text-left group"
                    >
                        <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(196,98,58,0.08)' }}>
                            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#C4623A" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M12 2a3 3 0 0 1 3 3v7a3 3 0 0 1-6 0V5a3 3 0 0 1 3-3z" />
                                <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                                <line x1="12" y1="19" x2="12" y2="23" />
                            </svg>
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-foreground">
                                {locale === 'es' ? 'Grabar desde la plataforma' : 'Record from the platform'}
                            </p>
                            <p className="text-xs text-muted-foreground mt-0.5 font-light">
                                {locale === 'es' ? 'Grabá tu voz directo desde el navegador' : 'Record your voice directly from the browser'}
                            </p>
                        </div>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-muted-foreground group-hover:text-primary transition-colors flex-shrink-0"><path d="M9 18l6-6-6-6" /></svg>
                    </button>

                    <div className="flex items-center gap-3">
                        <div className="flex-1 h-px bg-border/50" />
                        <span className="text-xs text-muted-foreground">{locale === 'es' ? 'o' : 'or'}</span>
                        <div className="flex-1 h-px bg-border/50" />
                    </div>

                    <button
                        type="button"
                        onClick={() => setMode('upload')}
                        className="w-full flex items-center gap-5 p-5 bg-card border border-border/70 rounded-xl hover:border-primary/60 hover:bg-accent/5 transition-all text-left group"
                    >
                        <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(196,98,58,0.08)' }}>
                            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#C4623A" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
                                <polyline points="17 8 12 3 7 8" />
                                <line x1="12" y1="3" x2="12" y2="15" />
                            </svg>
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-foreground">
                                {locale === 'es' ? 'Subir un audio desde tu dispositivo' : 'Upload an audio from your device'}
                            </p>
                            <p className="text-xs text-muted-foreground mt-0.5 font-light">
                                {locale === 'es' ? `MP3, M4A, WAV, OGG · Máx. ${MAX_AUDIO_MB}MB` : `MP3, M4A, WAV, OGG · Max. ${MAX_AUDIO_MB}MB`}
                            </p>
                        </div>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-muted-foreground group-hover:text-primary transition-colors flex-shrink-0"><path d="M9 18l6-6-6-6" /></svg>
                    </button>
                </div>
            )}

            {/* Botón volver */}
            {mode !== null && (
                <button
                    type="button"
                    onClick={() => setMode(null)}
                    className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary transition-colors"
                >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M15 18l-6-6 6-6" /></svg>
                    {locale === 'es' ? 'Cambiar método' : 'Change method'}
                </button>
            )}

            {/* Contenido: Grabar */}
            {mode === 'record' && (
                <div className="p-6 bg-card border border-border rounded-xl space-y-6">
                    {error && (
                        <div className="p-4 bg-error/10 border border-error/20 rounded-lg text-error text-sm text-center space-y-3 flex flex-col items-center">
                            <p className="font-medium break-words max-w-full">{error}</p>
                            <p className="text-xs opacity-90 max-w-[280px]">
                                Si bloqueaste el acceso antes, habilitalo desde el ícono del candado 🔒 en la barra de direcciones y recargá la página.
                            </p>
                            <button
                                type="button"
                                onClick={() => startRecording()}
                                disabled={isInitializing}
                                className="px-4 py-2 bg-error text-white rounded-lg hover:bg-error/90 transition-colors disabled:opacity-50 mt-1"
                            >
                                {isInitializing ? 'Intentando...' : 'Intentar de nuevo'}
                            </button>
                        </div>
                    )}

                    {/* Timer Display */}
                    <div className="text-center">
                        <div className={`text-4xl font-mono font-bold ${isRecording ? 'text-error' : 'text-foreground'}`}>
                            {formatTime(recordingTime)}
                        </div>
                        <div className="text-sm text-muted-foreground mt-2">
                            {dictionary.timeLimit.replace('{seconds}', String(maxSeconds))}
                        </div>
                    </div>

                    {/* Recording visualization */}
                    {isRecording && (
                        <div className="flex justify-center items-center gap-1 h-12">
                            {[...Array(5)].map((_, i) => (
                                <div
                                    key={i}
                                    className="w-2 bg-primary rounded-full animate-pulse"
                                    style={{
                                        height: '24px',
                                        animationDelay: `${i * 0.1}s`,
                                    }}
                                />
                            ))}
                        </div>
                    )}

                    {/* Record Button */}
                    <div className="flex justify-center">
                        {isRecording ? (
                            <button
                                onClick={stopRecording}
                                className="w-20 h-20 rounded-full bg-error hover:bg-error/90 text-white flex items-center justify-center transition-all shadow-lg shadow-error/25"
                            >
                                <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
                                    <rect x="6" y="6" width="12" height="12" rx="2" />
                                </svg>
                            </button>
                        ) : (
                            <button
                                onClick={startRecording}
                                className="w-20 h-20 rounded-full bg-primary hover:bg-primary/90 text-primary-foreground flex items-center justify-center transition-all shadow-lg shadow-primary/25"
                            >
                                <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                                </svg>
                            </button>
                        )}
                    </div>

                    <p className="text-center text-sm text-muted-foreground">
                        {isRecording ? dictionary.stop : dictionary.start}
                    </p>
                </div>
            )}

            {/* Contenido: Subir */}
            {mode === 'upload' && (
                <div className="p-6 bg-card border border-border rounded-xl space-y-4">
                    <label
                        htmlFor="audio-upload"
                        className="flex flex-col items-center justify-center gap-3 border-2 border-dashed border-border rounded-xl p-8 cursor-pointer hover:border-primary/50 hover:bg-accent/5 transition-all"
                    >
                        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-muted-foreground">
                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                            <polyline points="17 8 12 3 7 8" />
                            <line x1="12" y1="3" x2="12" y2="15" />
                        </svg>
                        <div className="text-center">
                            <p className="text-sm font-medium text-foreground">
                                {locale === 'es' ? 'Seleccionar archivo de audio' : 'Select audio file'}
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">
                                {locale === 'es'
                                    ? `MP3, M4A, WAV, OGG · Máx. ${MAX_AUDIO_MB}MB`
                                    : `MP3, M4A, WAV, OGG · Max. ${MAX_AUDIO_MB}MB`}
                            </p>
                        </div>
                        <input
                            id="audio-upload"
                            type="file"
                            accept={ACCEPTED_AUDIO_EXTENSIONS}
                            className="hidden"
                            onChange={handleFileUpload}
                            disabled={isUploading}
                        />
                        {isUploading && (
                            <div className="flex items-center gap-2 mt-2">
                                <svg className="w-4 h-4 animate-spin text-primary" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                <span className="text-xs text-muted-foreground">
                                    {locale === 'es' ? 'Subiendo contenido...' : 'Uploading content...'}
                                </span>
                            </div>
                        )}
                    </label>

                    {uploadError && (
                        <p className="text-sm text-destructive text-center">{uploadError}</p>
                    )}

                    {uploadedFile && (
                        <div className="flex items-center gap-3 p-3 bg-accent/10 rounded-lg border border-border">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-primary flex-shrink-0">
                                <path d="M9 18V5l12-2v13" />
                                <circle cx="6" cy="18" r="3" /><circle cx="18" cy="16" r="3" />
                            </svg>
                            <span className="text-sm text-foreground truncate flex-1">{uploadedFile.name}</span>
                            <span className="text-xs text-muted-foreground flex-shrink-0">
                                {(uploadedFile.size / (1024 * 1024)).toFixed(1)}MB
                            </span>
                            <button
                                onClick={() => { setUploadedFile(null); onDelete() }}
                                className="text-muted-foreground hover:text-destructive transition-colors flex-shrink-0"
                            >
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                                </svg>
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}
