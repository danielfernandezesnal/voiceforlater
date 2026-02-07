'use client'

import { useState, useRef, useEffect, useCallback } from 'react'

interface AudioRecorderProps {
    dictionary: {
        start: string
        stop: string
        preview: string
        delete: string
        timeLimit: string
        timer: string
    }
    maxSeconds: number
    audioBlob: Blob | null
    existingAudioUrl?: string | null
    onRecordingComplete: (blob: Blob, duration: number) => void
    onDelete: () => void
}

export function AudioRecorder({
    dictionary,
    maxSeconds,
    audioBlob,
    existingAudioUrl,
    onRecordingComplete,
    onDelete,
}: AudioRecorderProps) {
    const [isRecording, setIsRecording] = useState(false)
    const [recordingTime, setRecordingTime] = useState(0)
    const [audioUrl, setAudioUrl] = useState<string | null>(null)
    const [error, setError] = useState<string | null>(null)

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
        try {
            setError(null)
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true })

            const mediaRecorder = new MediaRecorder(stream, {
                mimeType: MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : 'audio/mp4'
            })

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
        } catch (err) {
            console.error('Error accessing microphone:', err)
            setError('Could not access microphone. Please check permissions.')
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

            {/* Recording visualization */}
            {isRecording && (
                <div className="flex justify-center items-center gap-1 h-12">
                    {[...Array(5)].map((_, i) => (
                        <div
                            key={i}
                            className="w-2 bg-primary rounded-full animate-pulse"
                            style={{
                                height: '24px', // Static height or use CSS animation for height
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
    )
}
