'use client'

import { useState, useRef, useEffect, useCallback } from 'react'

interface VideoRecorderProps {
    dictionary: {
        start: string
        stop: string
        preview: string
        delete: string
        timeLimit: string
        timer: string
    }
    maxSeconds: number
    videoBlob: Blob | null
    existingVideoUrl?: string | null
    onRecordingComplete: (blob: Blob, duration: number) => void
    onDelete: () => void
}

export function VideoRecorder({
    dictionary,
    maxSeconds,
    videoBlob,
    existingVideoUrl,
    onRecordingComplete,
    onDelete,
}: VideoRecorderProps) {
    const [isRecording, setIsRecording] = useState(false)
    const [recordingTime, setRecordingTime] = useState(0)
    const [videoUrl, setVideoUrl] = useState<string | null>(null)
    const [error, setError] = useState<string | null>(null)
    const [isStreamReady, setIsStreamReady] = useState(false)

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

    // Initialize camera on mount
    useEffect(() => {
        const initCamera = async () => {
            // If we already have a blob (reviewing), don't start camera
            if (videoBlob || existingVideoUrl) return

            try {
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
            } catch (err) {
                console.error('Error accessing camera/microphone:', err)
                setError('No se pudo acceder a la cámara o micrófono. Por favor verifica los permisos.')
                setIsStreamReady(false)
            }
        }

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
    }, [videoBlob, existingVideoUrl]) // Re-run if videoBlob changes (e.g. deleted)

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

            const mediaRecorder = new MediaRecorder(stream!, {
                mimeType: MediaRecorder.isTypeSupported('video/webm;codecs=vp8,opus') ? 'video/webm;codecs=vp8,opus' : 'video/webm'
            })

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
            setError('Error al iniciar la grabación.')
            setIsRecording(false)
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
        <div className="p-6 bg-card border border-border rounded-xl space-y-6">
            {error && (
                <div className="p-3 bg-error/10 border border-error/20 rounded-lg text-error text-sm text-center">
                    {error}
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
                {/* Always show video element if we don't have a blob */}
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
                            <span>Cargando cámara...</span>
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
    )
}
