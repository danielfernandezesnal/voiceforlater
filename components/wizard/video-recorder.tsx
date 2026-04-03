'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { v4 as uuidv4 } from 'uuid'

interface VideoRecorderProps {
    dictionary: {
        start: string
        stop: string
        preview: string
        delete: string
        timeLimit: string
        timer: string
        errorCamera: string
        errorStart: string
        loadingCamera: string
    }
    maxSeconds: number
    videoBlob: Blob | null
    existingVideoUrl?: string | null
    onRecordingComplete: (blob: Blob, duration: number) => void
    onUploadComplete: (path: string) => void
    onDelete: () => void
    locale?: string
}

const ACCEPTED_VIDEO_FORMATS = ['video/mp4', 'video/quicktime', 'video/webm']
const ACCEPTED_VIDEO_EXTENSIONS = '.mp4,.mov,.webm'
const MAX_VIDEO_MB = 50
const MAX_VIDEO_BYTES = MAX_VIDEO_MB * 1024 * 1024

export function VideoRecorder({
    dictionary,
    maxSeconds,
    videoBlob,
    existingVideoUrl,
    onRecordingComplete,
    onUploadComplete,
    onDelete,
    locale,
}: VideoRecorderProps) {
    const [isRecording, setIsRecording] = useState(false)
    const [recordingTime, setRecordingTime] = useState(0)
    const [videoUrl, setVideoUrl] = useState<string | null>(null)
    const [error, setError] = useState<string | null>(null)
    const [isStreamReady, setIsStreamReady] = useState(false)
    const [mode, setMode] = useState<null | 'record' | 'upload'>(null)
    const [uploadedFile, setUploadedFile] = useState<File | null>(null)
    const [uploadError, setUploadError] = useState<string | null>(null)
    const [isUploading, setIsUploading] = useState(false)
    const [thumbnailUrl, setThumbnailUrl] = useState<string | null>(null)

    const mediaRecorderRef = useRef<MediaRecorder | null>(null)
    const chunksRef = useRef<Blob[]>([])
    const timerRef = useRef<NodeJS.Timeout | null>(null)
    const videoPreviewRef = useRef<HTMLVideoElement | null>(null)
    const streamRef = useRef<MediaStream | null>(null)

    // Generate video URL from blob
    useEffect(() => {
        if (videoBlob) {
            const url = URL.createObjectURL(videoBlob)
            // eslint-disable-next-line
            setVideoUrl(url)
            return () => URL.revokeObjectURL(url)
        } else {
            setVideoUrl(null)
        }
    }, [videoBlob])

    const [isInitializing, setIsInitializing] = useState(false)

    // Memoize initCamera so it can be called safely from effects and buttons
    const initCamera = useCallback(async () => {
        // If we already have a blob (reviewing), don't start camera
        if (videoBlob || existingVideoUrl) return

        setIsInitializing(true)
        setError(null)
        try {
            if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
                throw new Error("navigator.mediaDevices no está disponible. ¿Estás usando HTTP sin localhost?")
            }

            // Stop any existing tracks first
            if (streamRef.current) {
                streamRef.current.getTracks().forEach(track => track.stop())
            }

            const stream = await navigator.mediaDevices.getUserMedia({
                video: { width: { ideal: 1280 }, height: { ideal: 720 } }, // Request HD if possible
                audio: true
            })

            streamRef.current = stream

            if (videoPreviewRef.current) {
                videoPreviewRef.current.srcObject = stream
                // Mute preview to prevent feedback loop
                videoPreviewRef.current.muted = true
                try {
                    await videoPreviewRef.current.play()
                } catch (e) {
                    console.error('Error playing preview:', e)
                }
            }

            setIsStreamReady(true)
            setError(null)
            setIsInitializing(false)
        } catch (err) {
            console.error('Error accessing camera/microphone:', err)
            const msg = err instanceof Error ? err.message : String(err)
            setError(`Error de dispositivos: ${msg}`)
            setIsStreamReady(false)
            // Delay so 'Cargando...' is visible when clicked again
            setTimeout(() => setIsInitializing(false), 800)
        }
    }, [dictionary.errorCamera, existingVideoUrl, videoBlob])

    // Initialize camera when mode is record
    useEffect(() => {
        if (mode !== 'record') return
        initCamera()

        // Cleanup function
        return () => {
            if (streamRef.current) {
                streamRef.current.getTracks().forEach(track => track.stop())
                streamRef.current = null
            }
            if (timerRef.current) {
                clearInterval(timerRef.current)
            }
        }
    }, [mode, initCamera])

    // Re-attach stream to video element if ref changes or state updates
    useEffect(() => {
        if (isStreamReady && streamRef.current && videoPreviewRef.current && !videoPreviewRef.current.srcObject) {
            videoPreviewRef.current.srcObject = streamRef.current
            videoPreviewRef.current.muted = true
            videoPreviewRef.current.play().catch(console.error)
        }
    }, [isStreamReady, videoBlob, existingVideoUrl])


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
            // Do NOT stop the stream here, we want to keep the preview alive
            // until we successfully created the blob (handled in onstop)
        }
    }, [isRecording])

    const startRecording = async () => {
        try {
            setError(null)

            let stream = streamRef.current

            // If for some reason stream is lost, try to get it again
            if (!stream || !stream.active) {
                stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true })
                streamRef.current = stream
                if (videoPreviewRef.current) {
                    videoPreviewRef.current.srcObject = stream
                    videoPreviewRef.current.muted = true
                    videoPreviewRef.current.play().catch(console.error)
                }
            }

            // Let browser decide best mime type instead of forcing it
            const mediaRecorder = new MediaRecorder(stream!)

            mediaRecorderRef.current = mediaRecorder
            chunksRef.current = []

            mediaRecorder.ondataavailable = (e) => {
                if (e.data.size > 0) {
                    chunksRef.current.push(e.data)
                }
            }

            mediaRecorder.onstop = () => {
                const blob = new Blob(chunksRef.current, { type: 'video/webm' })
                onRecordingComplete(blob, recordingTime)

                // NOW we can stop the camera because we are showing the recorded video
                if (streamRef.current) {
                    streamRef.current.getTracks().forEach(track => track.stop())
                    streamRef.current = null
                }
                setIsStreamReady(false)
                setIsRecording(false)
            }

            mediaRecorder.start()
            setIsRecording(true)
            setRecordingTime(0)

            // Start timer
            if (timerRef.current) clearInterval(timerRef.current)
            timerRef.current = setInterval(() => {
                setRecordingTime((prev) => {
                    const next = prev + 1
                    if (next >= maxSeconds) {
                        stopRecording()
                    }
                    return next
                })
            }, 1000)
        } catch (err) {
            console.error('Error starting recording:', err)
            const msg = err instanceof Error ? err.message : String(err)
            setError(`Error iniciando grabación: ${msg}`)
            setIsRecording(false)
        }
    }


    const generateThumbnail = (file: File): Promise<string> => {
        return new Promise((resolve) => {
            const video = document.createElement('video')
            video.preload = 'metadata'
            video.src = URL.createObjectURL(file)
            video.onloadeddata = () => { video.currentTime = 0.5 }
            video.onseeked = () => {
                const canvas = document.createElement('canvas')
                canvas.width = 320
                canvas.height = 180
                const ctx = canvas.getContext('2d')
                ctx?.drawImage(video, 0, 0, canvas.width, canvas.height)
                const thumb = canvas.toDataURL('image/jpeg', 0.7)
                URL.revokeObjectURL(video.src)
                resolve(thumb)
            }
        })
    }

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        setUploadError(null)
        const file = e.target.files?.[0]
        if (!file) return

        const isValidFormat = ACCEPTED_VIDEO_FORMATS.includes(file.type) ||
            ACCEPTED_VIDEO_EXTENSIONS.split(',').some(ext => file.name.toLowerCase().endsWith(ext.replace('.', '')))
        
        if (!isValidFormat) {
            setUploadError(locale === 'es' ? 'Formato no válido. Usá MP4, MOV o WEBM.' : 'Invalid format. Use MP4, MOV or WEBM.')
            return
        }
        if (file.size > MAX_VIDEO_BYTES) {
            setUploadError(locale === 'es' ? `El archivo supera el límite de ${MAX_VIDEO_MB}MB.` : `File exceeds the ${MAX_VIDEO_MB}MB limit.`)
            return
        }

        setIsUploading(true)
        try {
            const supabase = createClient()
            const { data: { user } } = await supabase.auth.getUser()
            
            if (!user) {
                throw new Error("No authenticated user")
            }

            const ext = file.name.split('.').pop() || 'mp4'
            const path = `${user.id}/${uuidv4()}.${ext}`

            const { error } = await supabase.storage
                .from('audio')
                .upload(path, file, { 
                    contentType: file.type,
                    upsert: false
                })

            if (error) throw error

            setUploadedFile(file)
            const thumb = await generateThumbnail(file)
            setThumbnailUrl(thumb)
            onUploadComplete(path)
        } catch (err) {
            console.error('Video upload error:', err)
            setUploadError(locale === 'es' ? 'Error al subir el video.' : 'Upload failed.')
        } finally {
            setIsUploading(false)
        }
    }

    // Has existing recording
    const finalVideoUrl = videoUrl || existingVideoUrl

    if (finalVideoUrl) {
        return (
            <div className="p-6 bg-card border border-border rounded-xl space-y-4">
                <div className="aspect-video bg-black rounded-lg overflow-hidden">
                    <video src={finalVideoUrl} controls className="w-full h-full" />
                </div>

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
            {/* Selector de modo — solo se muestra si no eligió nada todavía */}
            {mode === null && (
                <div className="flex flex-col gap-3">
                    {/* Card: Grabar */}
                    <button
                        type="button"
                        onClick={() => setMode('record')}
                        className="w-full flex items-center gap-5 p-5 bg-card border border-border/70 rounded-xl hover:border-primary/60 hover:bg-accent/5 transition-all text-left group"
                    >
                        <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(196,98,58,0.08)' }}>
                            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#C4623A" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                            </svg>
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-foreground">
                                {locale === 'es' ? 'Grabar desde la plataforma' : 'Record from the platform'}
                            </p>
                            <p className="text-xs text-muted-foreground mt-0.5 font-light">
                                {locale === 'es' ? 'Usá tu cámara para grabar un video directo desde el navegador' : 'Use your camera to record a video directly from the browser'}
                            </p>
                        </div>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-muted-foreground group-hover:text-primary transition-colors flex-shrink-0"><path d="M9 18l6-6-6-6" /></svg>
                    </button>

                    {/* Divider */}
                    <div className="flex items-center gap-3">
                        <div className="flex-1 h-px bg-border/50" />
                        <span className="text-xs text-muted-foreground">
                            {locale === 'es' ? 'o' : 'or'}
                        </span>
                        <div className="flex-1 h-px bg-border/50" />
                    </div>

                    {/* Card: Subir */}
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
                                {locale === 'es' ? 'Subir un video desde tu dispositivo' : 'Upload a video from your device'}
                            </p>
                            <p className="text-xs text-muted-foreground mt-0.5 font-light">
                                {locale === 'es' ? `MP4, MOV, WEBM · Máx. ${MAX_VIDEO_MB}MB` : `MP4, MOV, WEBM · Max. ${MAX_VIDEO_MB}MB`}
                            </p>
                        </div>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-muted-foreground group-hover:text-primary transition-colors flex-shrink-0"><path d="M9 18l6-6-6-6" /></svg>
                    </button>
                </div>
            )}

            {/* Botón volver — aparece cuando ya eligió un modo */}
            {mode !== null && (
                <button
                    type="button"
                    onClick={() => {
                        setMode(null)
                        if (streamRef.current) {
                            streamRef.current.getTracks().forEach(track => track.stop())
                            streamRef.current = null
                            setIsStreamReady(false)
                        }
                    }}
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
                                onClick={() => initCamera()}
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

                    {/* Camera Preview */}
                    <div className="aspect-video bg-black rounded-lg overflow-hidden relative">
                        <video
                            ref={videoPreviewRef}
                            muted
                            playsInline
                            className={`w-full h-full object-cover transition-opacity duration-300 ${isStreamReady ? 'opacity-100' : 'opacity-0'}`}
                        />

                        {/* Loading State */}
                        {!isStreamReady && !error && (
                            <div className="absolute inset-0 flex items-center justify-center bg-muted text-muted-foreground">
                                <div className="flex flex-col items-center gap-2">
                                    <svg className="w-8 h-8 animate-spin" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    <span>{dictionary.loadingCamera}</span>
                                </div>
                            </div>
                        )}

                        {/* Recording Indicator */}
                        {isRecording && (
                            <div className="absolute top-4 right-4 flex items-center gap-2 bg-black/50 px-2 py-1 rounded-full backdrop-blur-sm">
                                <div className="w-3 h-3 bg-error rounded-full animate-pulse" />
                                <span className="text-white text-xs font-medium">REC</span>
                            </div>
                        )}
                    </div>

                    {/* Record Button */}
                    <div className="flex justify-center">
                        {isRecording ? (
                            <button
                                onClick={stopRecording}
                                className="w-20 h-20 rounded-full bg-error hover:bg-error/90 text-white flex items-center justify-center transition-all shadow-lg shadow-error/25 scale-100 hover:scale-105 active:scale-95"
                            >
                                <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
                                    <rect x="6" y="6" width="12" height="12" rx="2" />
                                </svg>
                            </button>
                        ) : (
                            <button
                                onClick={startRecording}
                                disabled={!isStreamReady}
                                className={`w-20 h-20 rounded-full flex items-center justify-center transition-all shadow-lg ${isStreamReady
                                    ? 'bg-primary hover:bg-primary/90 text-primary-foreground shadow-primary/25 scale-100 hover:scale-105 active:scale-95'
                                    : 'bg-muted text-muted-foreground cursor-not-allowed opacity-50'
                                    }`}
                            >
                                <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
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
                    {!uploadedFile ? (
                        <label
                            htmlFor="video-upload"
                            className="flex flex-col items-center justify-center gap-3 border-2 border-dashed border-border rounded-xl p-8 cursor-pointer hover:border-primary/50 hover:bg-accent/5 transition-all"
                        >
                            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-muted-foreground">
                                <polygon points="23 7 16 12 23 17 23 7" /><rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
                            </svg>
                            <div className="text-center">
                                <p className="text-sm font-medium text-foreground">
                                    {locale === 'es' ? 'Seleccionar video' : 'Select video'}
                                </p>
                                <p className="text-xs text-muted-foreground mt-1">
                                    {locale === 'es' ? `MP4, MOV, WEBM · Máx. ${MAX_VIDEO_MB}MB` : `MP4, MOV, WEBM · Max. ${MAX_VIDEO_MB}MB`}
                                </p>
                            </div>
                            <input
                                id="video-upload"
                                type="file"
                                accept={ACCEPTED_VIDEO_EXTENSIONS}
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
                    ) : (
                        <div className="space-y-3">
                            {thumbnailUrl && (
                                <div className="relative rounded-xl overflow-hidden aspect-video bg-black">
                                    <img src={thumbnailUrl} alt="preview" className="w-full h-full object-cover opacity-90" />
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <div className="w-12 h-12 rounded-full bg-black/50 flex items-center justify-center">
                                            <svg width="20" height="20" viewBox="0 0 24 24" fill="white"><polygon points="5 3 19 12 5 21 5 3" /></svg>
                                        </div>
                                    </div>
                                </div>
                            )}
                            <div className="flex items-center gap-3 p-3 bg-accent/10 rounded-lg border border-border">
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-primary flex-shrink-0">
                                    <polygon points="23 7 16 12 23 17 23 7" /><rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
                                </svg>
                                <span className="text-sm text-foreground truncate flex-1">{uploadedFile.name}</span>
                                <span className="text-xs text-muted-foreground flex-shrink-0">
                                    {(uploadedFile.size / (1024 * 1024)).toFixed(1)}MB
                                </span>
                                <button
                                    onClick={() => { setUploadedFile(null); setThumbnailUrl(null); onDelete() }}
                                    className="text-muted-foreground hover:text-destructive transition-colors flex-shrink-0"
                                >
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                                    </svg>
                                </button>
                            </div>
                        </div>
                    )}
                    {uploadError && <p className="text-sm text-destructive text-center">{uploadError}</p>}
                </div>
            )}
        </div>
    )
}
