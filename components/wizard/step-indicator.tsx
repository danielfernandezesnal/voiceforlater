'use client'

interface StepIndicatorProps {
    currentStep: number
    maxStep: number
    steps: string[]
    onStepClick?: (stepNumber: number) => void
}

export function StepIndicator({ currentStep, maxStep, steps, onStepClick }: StepIndicatorProps) {
    return (
        <nav className="flex items-center justify-center mb-10 overflow-x-hidden sm:overflow-x-visible pb-4 sm:pb-0">
            <div className="flex items-center gap-1 sm:gap-0">
                {steps.map((label, index) => {
                    const stepNumber = index + 1
                    const isActive = stepNumber === currentStep
                    const isCompleted = stepNumber < currentStep
                    const isClickable = stepNumber <= maxStep
                    const isLast = index === steps.length - 1

                    return (
                        <div key={label} className="flex items-center">
                            {/* Step Container - Button for accessibility and large hit area */}
                            <button
                                onClick={() => isClickable && onStepClick?.(stepNumber)}
                                disabled={!isClickable}
                                className={`group flex flex-col items-center relative focus:outline-none transition-all ${isClickable ? 'cursor-pointer' : 'cursor-default'
                                    }`}
                                title={isClickable ? `Ir al paso ${stepNumber}: ${label}` : undefined}
                            >
                                {/* Hit area enlargement for mobile (min 44px) */}
                                <div className="absolute inset-0 -top-2 -bottom-6 -left-2 -right-2 sm:-inset-4 z-0" />

                                <div
                                    className={`relative z-10 w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-300 ${isActive
                                        ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/30 scale-110'
                                        : isCompleted
                                            ? 'bg-success/15 text-success border-2 border-success/20'
                                            : isClickable
                                                ? 'bg-primary/10 text-primary border-2 border-primary/20 hover:bg-primary/20'
                                                : 'bg-secondary text-muted-foreground opacity-60'
                                        }`}
                                >
                                    {isCompleted ? (
                                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                        </svg>
                                    ) : (
                                        stepNumber
                                    )}
                                </div>
                                <span
                                    className={`relative z-10 mt-3 text-[10px] sm:text-xs uppercase tracking-normal sm:tracking-widest whitespace-nowrap transition-colors duration-300 ${isActive
                                        ? 'text-foreground font-bold'
                                        : isClickable
                                            ? 'text-muted-foreground hover:text-primary'
                                            : 'text-muted-foreground/40'
                                        }`}
                                >
                                    {label}
                                </span>
                            </button>

                            {/* Connector Line */}
                            {!isLast && (
                                <div
                                    className={`hidden sm:block w-10 h-[2px] mx-2 rounded-full transition-colors duration-500 ${stepNumber < currentStep ? 'bg-success/40' : 'bg-border/20'
                                        }`}
                                />
                            )}
                        </div>
                    )
                })}
            </div>
        </nav>
    )
}

