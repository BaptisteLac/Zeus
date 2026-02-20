import { twMerge } from 'tailwind-merge';
import { Check, RotateCcw } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SerieCardProps {
    setNumber: number;
    weight: number;
    reps: number;
    rir?: number | string;
    isCompleted?: boolean;
    onValidate?: () => void;
    onRest?: () => void;
    className?: string;
    previousPerformance?: {
        weight: number;
        reps: number;
        rir: number | string;
    } | null;
}

export const SerieCard = ({
    setNumber,
    weight,
    reps,
    rir,
    isCompleted = false,
    onValidate,
    onRest,
    className,
    previousPerformance,
}: SerieCardProps) => {
    return (
        <div
            className={cn(
                'group relative overflow-hidden rounded-xl border transition-all duration-300',
                isCompleted
                    ? 'bg-mb-success/5 border-mb-success/20'
                    : 'bg-mb-surface border-white/5 hover:border-white/10',
                className
            )}
        >
            <div className="flex items-center justify-between p-4">
                {/* Set Info */}
                <div className="flex items-center gap-4">
                    <div
                        className={cn(
                            'flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold font-mono',
                            isCompleted
                                ? 'bg-mb-success text-mb-bg'
                                : 'bg-mb-surface-raised text-mb-muted group-hover:bg-mb-primary/10 group-hover:text-mb-primary transition-colors'
                        )}
                    >
                        {setNumber}
                    </div>

                    <div className="flex flex-col">
                        <div className="flex items-baseline gap-1.5">
                            <span className="text-lg font-bold text-mb-fg tabular-nums tracking-tight">
                                {weight}
                                <span className="text-xs font-normal text-mb-muted ml-0.5">kg</span>
                            </span>
                            <span className="text-mb-muted/50 text-xs">×</span>
                            <span className="text-lg font-bold text-mb-fg tabular-nums tracking-tight">
                                {reps}
                                <span className="text-xs font-normal text-mb-muted ml-0.5">reps</span>
                            </span>
                        </div>

                        {(previousPerformance || rir) && (
                            <div className="flex items-center gap-2 text-xs text-mb-muted/70">
                                {previousPerformance && (
                                    <span className="tabular-nums">
                                        Préc: {previousPerformance.weight}x{previousPerformance.reps}
                                    </span>
                                )}
                                {previousPerformance && rir && <span>•</span>}
                                {rir && (
                                    <span className="tabular-nums">
                                        RIR {rir}
                                    </span>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2">
                    {onRest && (
                        <button
                            onClick={onRest}
                            className="p-2 rounded-full text-mb-muted hover:bg-mb-surface-raised hover:text-mb-primary transition-colors active:scale-95"
                            aria-label="Start Rest Timer"
                        >
                            <RotateCcw className="w-4 h-4" />
                        </button>
                    )}

                    {onValidate && (
                        <button
                            onClick={onValidate}
                            className={cn(
                                'flex items-center justify-center w-10 h-10 rounded-full transition-all duration-300 active:scale-95',
                                isCompleted
                                    ? 'bg-mb-success text-mb-bg shadow-[0_0_15px_-3px_rgba(var(--mb-success),0.4)]'
                                    : 'bg-mb-surface-raised text-mb-muted hover:bg-mb-primary hover:text-white hover:shadow-[0_0_15px_-3px_rgba(var(--mb-primary),0.4)]'
                            )}
                            aria-label={isCompleted ? "Invalidate Set" : "Validate Set"}
                        >
                            <Check className={cn("w-5 h-5", isCompleted ? "stroke-[3px]" : "stroke-2")} />
                        </button>
                    )}
                </div>
            </div>

            {/* Progress Bar (Optional decoration) */}
            {isCompleted && (
                <div className="absolute bottom-0 left-0 h-0.5 w-full bg-mb-success/20">
                    <div className="h-full bg-mb-success w-full animate-in slide-in-from-left duration-500" />
                </div>
            )}
        </div>
    );
};
