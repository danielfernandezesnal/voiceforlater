'use client'

import { useWizard } from './wizard-context'
import { AudioRecorder } from './audio-recorder'
import { VideoRecorder } from './video-recorder'

interface Step2Props {
    dictionary: {
        title: string
        titleAudio: string
        subtitle: string
        titleLabel: string
        titlePlaceholder: string
        textPlaceholder: string
        charLimit: string
        recording: {
            start: string
            stop: string
            preview: string
            delete: string
            timeLimit: string
            timer: string
            errorMicrophone: string
            errorCamera: string
            errorStart: string
            loadingCamera: string
        }
    }
    maxTextChars: number
    maxAudioSeconds: number
}

export function Step2Content({ dictionary, maxTextChars, maxAudioSeconds }: Step2Props) {
    const { data, updateData } = useWizard()

    if (data.messageType === 'text') {
        return (
            <div className="space-y-6">
                <div className="text-center">
                    <h2 className="text-2xl font-bold">{dictionary.title}</h2>
                    <p className="text-muted-foreground mt-2">{dictionary.subtitle}</p>
                </div>

                <div className="max-w-2xl mx-auto space-y-4">
                    <div className="space-y-2">
                        <label htmlFor="title" className="block text-sm font-medium text-foreground">
                            {dictionary.titleLabel}
                        </label>
                        <div className="relative">
                            <input
                                id="title"
                                type="text"
                                value={data.title}
                                onChange={(e) => {
                                    if (e.target.value.length <= 80) {
                                        updateData({ title: e.target.value })
                                    }
                                }}
                                placeholder={dictionary.titlePlaceholder}
                                className="w-full px-4 py-3 bg-input border border-border rounded-xl focus:ring-2 focus:ring-ring focus:border-transparent transition-all placeholder:text-muted-foreground"
                            />
                            <div className="absolute top-3 right-4 text-xs text-muted-foreground">
                                {data.title.length} / 80
                            </div>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <textarea
                            value={data.textContent}
                            onChange={(e) => {
                                if (e.target.value.length <= maxTextChars) {
                                    updateData({ textContent: e.target.value })
                                }
                            }}
                            placeholder={dictionary.textPlaceholder}
                            className="w-full h-64 p-4 bg-input border border-border rounded-xl resize-none focus:ring-2 focus:ring-ring focus:border-transparent transition-all placeholder:text-muted-foreground"
                        />
                        <div className="mt-2 text-right text-sm text-muted-foreground">
                            {dictionary.charLimit
                                .replace('{count}', String(data.textContent.length))
                                .replace('{max}', String(maxTextChars))}
                        </div>
                    </div>
                </div>
            </div>
        )
    }

    const isVideo = data.messageType === 'video'

    // Audio or Video message
    return (
        <div className="space-y-6">
            <div className="text-center">
                <h2 className="text-2xl font-bold">{dictionary.titleAudio}</h2>
                <p className="text-muted-foreground mt-2">{dictionary.subtitle}</p>
            </div>

            <div className="max-w-md mx-auto space-y-8">
                <div className="space-y-2 text-left">
                    <label htmlFor="title" className="block text-sm font-medium text-foreground">
                        {dictionary.titleLabel}
                    </label>
                    <div className="relative">
                        <input
                            id="title"
                            type="text"
                            value={data.title}
                            onChange={(e) => {
                                if (e.target.value.length <= 80) {
                                    updateData({ title: e.target.value })
                                }
                            }}
                            placeholder={dictionary.titlePlaceholder}
                            className="w-full px-4 py-3 bg-input border border-border rounded-xl focus:ring-2 focus:ring-ring focus:border-transparent transition-all placeholder:text-muted-foreground"
                        />
                        <div className="absolute top-3 right-4 text-xs text-muted-foreground">
                            {data.title.length} / 80
                        </div>
                    </div>
                </div>

                {isVideo ? (
                    <VideoRecorder
                        dictionary={dictionary.recording}
                        maxSeconds={maxAudioSeconds}
                        videoBlob={data.audioBlob} // We reuse audioBlob field for now
                        existingVideoUrl={data.existingAudioUrl}
                        onRecordingComplete={(blob, duration) => {
                            updateData({ audioBlob: blob, audioDuration: duration })
                        }}
                        onDelete={() => {
                            updateData({ audioBlob: null, audioDuration: 0, existingAudioUrl: null })
                        }}
                    />
                ) : (
                    <AudioRecorder
                        dictionary={dictionary.recording}
                        maxSeconds={maxAudioSeconds}
                        audioBlob={data.audioBlob}
                        existingAudioUrl={data.existingAudioUrl}
                        onRecordingComplete={(blob, duration) => {
                            updateData({ audioBlob: blob, audioDuration: duration })
                        }}
                        onDelete={() => {
                            updateData({ audioBlob: null, audioDuration: 0, existingAudioUrl: null })
                        }}
                    />
                )}
            </div>
        </div>
    )
}
