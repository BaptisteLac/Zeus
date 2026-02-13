import { useEffect } from 'react';

interface GlobalTimerProps {
    exerciseName: string;
    remaining: number;
    total: number;
    onStop: () => void;
}

export default function GlobalTimer({
    exerciseName,
    remaining,
    total,
    onStop,
}: GlobalTimerProps) {
    const mins = Math.floor(remaining / 60);
    const secs = remaining % 60;
    const progress = total > 0 ? remaining / total : 0;
    const isFinished = remaining === 0;

    // Auto-hide after 3 seconds when finished
    useEffect(() => {
        if (isFinished) {
            const timeout = setTimeout(() => {
                onStop();
            }, 3000);
            return () => clearTimeout(timeout);
        }
    }, [isFinished, onStop]);

    if (remaining < 0) return null;

    return (
        <div className="fixed top-0 left-0 right-0 z-20 px-6 pt-3 pb-2">
            <div className="mx-auto max-w-lg">
                <div className="rounded-lg backdrop-blur-md bg-card/90 border border-border shadow-lifted px-5 py-3">
                    <div className="flex items-center justify-between gap-4">
                        <div className="flex-1">
                            <div className="text-[11px] font-medium uppercase tracking-[0.08em] text-stone">
                                {exerciseName}
                            </div>
                            <div className="mt-1 font-mono text-2xl font-medium text-foreground tabular-nums">
                                {isFinished ? (
                                    <span className="text-accent">Repos terminé ✓</span>
                                ) : (
                                    <>
                                        {String(mins).padStart(2, '0')}:{String(secs).padStart(2, '0')}
                                    </>
                                )}
                            </div>
                        </div>
                        {!isFinished && (
                            <button
                                onClick={onStop}
                                className="rounded-lg border border-foreground/20 bg-transparent px-3 py-1.5 text-[12px] font-medium text-foreground transition-all duration-400 ease-smooth hover:bg-foreground/5"
                            >
                                Stop
                            </button>
                        )}
                    </div>
                    {!isFinished && (
                        <div className="mt-3 h-1 w-full rounded-full bg-border overflow-hidden">
                            <div
                                className="h-full bg-primary transition-all duration-1000 ease-linear"
                                style={{ width: `${progress * 100}%` }}
                            />
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
