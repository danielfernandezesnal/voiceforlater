'use client'

interface StepIndicatorProps {
    currentStep: number
    steps: string[]
}

export function StepIndicator({ currentStep, steps }: StepIndicatorProps) {
    return (
        <div className="flex items-center justify-center mb-8">
            {steps.map((label, index) => {
                const stepNumber = index + 1
                const isActive = stepNumber === currentStep
                const isCompleted = stepNumber < currentStep

                return (
                    <div key={label} className="flex items-center">
                        {/* Step Circle */}
                        <div className="flex flex-col items-center">
                            <div
                                className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium transition-all ${isActive
                                    ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/20'
                                    : isCompleted
                                        ? 'bg-success/10 text-success'
                                        : 'bg-secondary text-muted-foreground'
                                    }`}
                            >
                                {isCompleted ? (
                                    <svg className="w-5 h-5 font-bold" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                    </svg>
                                ) : (
                                    stepNumber
                                )}
                            </div>
                            <span
                                className={`mt-2 text-xs uppercase tracking-wider ${isActive ? 'text-foreground font-semibold' : 'text-muted-foreground'
                                    }`}
                            >
                                {label}
                            </span>
                        </div>

                        {/* Connector Line */}
                        {index < steps.length - 1 && (
                            <div
                                className={`w-12 h-px mx-2 ${isCompleted ? 'bg-success/30' : 'bg-secondary'
                                    }`}
                            />
                        )}
                    </div>
                )
            })}
        </div>
    )
}
