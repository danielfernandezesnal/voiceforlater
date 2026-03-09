'use client'

import { useState, useRef, useEffect } from 'react';

export function AudioPlayer({ src }: { src: string }) {
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const audioRef = useRef<HTMLAudioElement | null>(null);

    const togglePlay = () => {
        if (!audioRef.current) return;
        if (isPlaying) {
            audioRef.current.pause();
        } else {
            audioRef.current.play();
        }
        setIsPlaying(!isPlaying);
    };

    const handleTimeUpdate = () => {
        if (!audioRef.current) return;
        setCurrentTime(audioRef.current.currentTime);
    };

    const handleLoadedMetadata = () => {
        if (!audioRef.current) return;
        setDuration(audioRef.current.duration);
    };

    const handleEnded = () => {
        setIsPlaying(false);
        setCurrentTime(0);
    };

    const formatTime = (time: number) => {
        const minutes = Math.floor(time / 60);
        const seconds = Math.floor(time % 60);
        return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    };

    const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

    return (
        <div className="space-y-6">
            <audio
                ref={audioRef}
                src={src}
                onTimeUpdate={handleTimeUpdate}
                onLoadedMetadata={handleLoadedMetadata}
                onEnded={handleEnded}
                hidden
            />

            {/* Waveform Visualization (Simulated with bars) */}
            <div className="flex items-center justify-center gap-1 sm:gap-1.5 h-16 w-full max-w-sm mx-auto">
                {[...Array(24)].map((_, i) => (
                    <div
                        key={i}
                        className={`w-1 sm:w-1.5 rounded-full transition-all duration-300 ${isPlaying ? 'animate-pulse' : ''}`}
                        style={{
                            height: `${20 + Math.sin(i * 0.5) * 15 + Math.random() * 20}%`,
                            animationDelay: `${i * 0.05}s`,
                            backgroundColor: (currentTime / duration) > (i / 24) ? '#C4623A' : '#E0D8CC'
                        }}
                    />
                ))}
            </div>

            <div className="flex items-center gap-4">
                <button
                    onClick={togglePlay}
                    className="w-14 h-14 bg-primary rounded-full flex items-center justify-center text-white shadow-lg shadow-primary/20 hover:scale-105 active:scale-95 transition-all outline-none flex-shrink-0"
                    aria-label={isPlaying ? "Pause" : "Play"}
                >
                    {isPlaying ? (
                        <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
                        </svg>
                    ) : (
                        <svg className="w-6 h-6 ml-1" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M8 5v14l11-7z" />
                        </svg>
                    )}
                </button>

                <div className="flex-1 space-y-2">
                    <div className="relative h-1.5 bg-black/[0.06] rounded-full overflow-hidden">
                        <div
                            className="absolute inset-y-0 left-0 bg-primary transition-all duration-100 ease-linear"
                            style={{ width: `${progress}%` }}
                        />
                    </div>
                    <div className="flex justify-between text-[11px] font-medium font-sans text-muted-foreground/60 tabular-nums">
                        <span>{formatTime(currentTime)}</span>
                        <span>{formatTime(duration)}</span>
                    </div>
                </div>
            </div>
        </div>
    );
}

export function VideoPlayer({ src, overlayText }: { src: string, overlayText: string }) {
    const [isPlaying, setIsPlaying] = useState(false);
    const videoRef = useRef<HTMLVideoElement | null>(null);

    const togglePlay = () => {
        if (!videoRef.current) return;
        if (isPlaying) {
            videoRef.current.pause();
        } else {
            videoRef.current.play();
        }
        setIsPlaying(!isPlaying);
    };

    return (
        <div
            className="aspect-video relative bg-black group cursor-pointer overflow-hidden rounded-t-3xl"
            onClick={togglePlay}
        >
            <video
                ref={videoRef}
                src={src}
                className="w-full h-full object-cover"
                playsInline
                onEnded={() => setIsPlaying(false)}
                onClick={(e) => {
                    e.stopPropagation();
                    togglePlay();
                }}
            />

            {/* Custom Overlay */}
            {!isPlaying && (
                <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px] flex flex-col items-center justify-center gap-4 transition-all duration-700 group-hover:bg-black/50">
                    <div className="w-20 h-20 bg-white/20 backdrop-blur-md rounded-full border border-white/30 flex items-center justify-center scale-90 group-hover:scale-100 transition-transform duration-500">
                        <svg className="w-8 h-8 text-white ml-1" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M8 5v14l11-7z" />
                        </svg>
                    </div>
                    <div className="text-white font-sans text-sm font-medium tracking-wide uppercase opacity-90">
                        {overlayText}
                    </div>
                </div>
            )}
        </div>
    );
}

