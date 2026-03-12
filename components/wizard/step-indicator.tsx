'use client'

interface StepIndicatorProps {
    currentStep: number
    maxStep: number
    steps: string[]
    onStepClick?: (stepNumber: number) => void
}

export function StepIndicator({ currentStep, maxStep, steps, onStepClick }: StepIndicatorProps) {
    return (
        <nav className="w-full mb-8 sm:mb-10 px-2 sm:px-0">
            <div className="flex items-start justify-between w-full relative">
                {steps.map((label, index) => {
                    const stepNumber = index + 1
                    const isActive = stepNumber === currentStep
                    const isCompleted = stepNumber < currentStep
                    const isClickable = stepNumber <= maxStep
                    const isLast = index === steps.length - 1

                    return (
                        <div key={label} className={`flex ${isLast ? '' : 'flex-1'}`}>
                            {/* Step Container - Button for accessibility and large hit area */}
                            <div className="flex flex-col items-center relative w-full">
                                <button
                                    onClick={() => isClickable && onStepClick?.(stepNumber)}
                                    disabled={!isClickable}
                                    className={`group flex flex-col items-center relative focus:outline-none transition-all z-10 ${isClickable ? 'cursor-pointer' : 'cursor-default'
                                        }`}
                                    title={isClickable ? `Ir al paso ${stepNumber}: ${label}` : undefined}
                                >
                                    {/* Hit area enlargement for mobile (min 44px) */}
                                    <div className="absolute inset-0 -top-2 -bottom-6 -left-2 -right-2 sm:-inset-4 z-0" />

                                    <div
                                        className={`relative z-10 w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center text-xs sm:text-sm font-bold transition-all duration-300 ${isActive
                                            ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/30 scale-110'
                                            : isCompleted
                                                ? 'bg-success/15 text-success border-2 border-success/20'
                                                : isClickable
                                                    ? 'bg-primary/10 text-primary border-2 border-primary/20 hover:bg-primary/20'
                                                    : 'bg-secondary text-muted-foreground opacity-60'
                                            }`}
                                    >
                                        {isCompleted ? (
                                            <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                            </svg>
                                        ) : (
                                            stepNumber
                                        )}
                                    </div>
                                    <span
                                        className={`relative z-10 mt-2 sm:mt-3 text-[9px] sm:text-xs uppercase tracking-tight sm:tracking-widest whitespace-nowrap transition-colors duration-300 ${isActive
                                            ? 'text-foreground font-bold'
                                            : isClickable
                                                ? 'text-muted-foreground hover:text-primary'
                                                : 'text-muted-foreground/40'
                                            }`}
                                    >
                                        {label}
                                    </span>
                                </button>
                                
                                {/* Connector Line that spans the rest of the flex-1 space */}
                                {!isLast && (
                                    <div
                                        className={`absolute top-[18px] sm:top-5 left-[50%] right-[-50%] h-[2px] transition-colors duration-500 z-0 ${stepNumber < currentStep ? 'bg-success/40' : 'bg-border/20'
                                            }`}
                                    />
                                )}
                            </div>
                        </div>
                    )
                })}
            </div>
        </nav>
    )
}

