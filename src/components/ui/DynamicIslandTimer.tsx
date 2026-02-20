import { useState, useEffect, useCallback, useRef } from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface DynamicIslandTimerProps {
    initialSeconds: number;
    onComplete?: () => void;
    onDismiss?: () => void;
    isRunning: boolean;
}

export default function DynamicIslandTimer({
    initialSeconds,
    onComplete,
    onDismiss,
    isRunning
}: DynamicIslandTimerProps) {
    const [remaining, setRemaining] = useState(initialSeconds);
    const [isExpanded, setIsExpanded] = useState(false);
    const [isOvertime, setIsOvertime] = useState(false);
    const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

    // Reset timer when initialSeconds changes or isRunning becomes true
    useEffect(() => {
        if (isRunning) {
            setRemaining(initialSeconds);
            setIsOvertime(false);
        }
    }, [initialSeconds, isRunning]);

    useEffect(() => {
        if (!isRunning) return;

        intervalRef.current = setInterval(() => {
            setRemaining((prev) => {
                if (prev <= 1 && !isOvertime) {
                    // Timer completed natural countdown
                    if (navigator.vibrate) navigator.vibrate([300, 100, 300]);
                    setIsOvertime(true);
                    onComplete?.();
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => {
            if (intervalRef.current) clearInterval(intervalRef.current);
        };
    }, [isRunning, isOvertime, onComplete]);

    if (!isRunning) return null;

    const absRemaining = Math.abs(remaining);
    const mins = Math.floor(absRemaining / 60);
    const secs = absRemaining % 60;
    const timeDisplay = `${mins}:${String(secs).padStart(2, '0')}`;

    return (
        <div
            className="fixed left-1/2 -translate-x-1/2 z-[100] transition-all duration-300 ease-smooth"
            style={{ top: 'max(env(safe-area-inset-top), 16px)' }}
        >
            <div
                onClick={() => setIsExpanded(!isExpanded)}
                className={cn(
                    "relative flex items-center justify-between bg-black/90 backdrop-blur-xl border border-white/10 shadow-2xl transition-all duration-300 curve-smooth overflow-hidden cursor-pointer",
                    isExpanded ? "w-[200px] h-[56px] rounded-[28px] px-5" : "w-[120px] h-[40px] rounded-full px-4",
                    isOvertime ? "border-mb-error/50 shadow-mb-error/20" : "",
                    "animate-slide-down"
                )}
            >
                {/* Main Content (Collapsed & Expanded) */}
                <div className="flex items-center gap-2.5 mx-auto">
                    <div className={cn(
                        "w-2 h-2 rounded-full transition-colors duration-500",
                        isOvertime ? "bg-mb-error animate-pulse" : "bg-mb-success"
                    )} />

                    <span className={cn(
                        "font-mono font-medium tabular-nums text-white tracking-widest transition-all",
                        isExpanded ? "text-2xl" : "text-sm",
                        isOvertime && "text-mb-error"
                    )}>
                        {timeDisplay}
                    </span>
                </div>

                {/* Expanded Controls */}
                <div className={cn(
                    "absolute right-2 top-1/2 -translate-y-1/2 flex items-center transition-all duration-200",
                    isExpanded ? "opacity-100 scale-100" : "opacity-0 scale-90 pointer-events-none"
                )}>
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            onDismiss?.();
                        }}
                        className="w-10 h-10 flex items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 active:scale-95 transition-all"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Overtime Background Pulse */}
                {isOvertime && (
                    <div className="absolute inset-0 bg-mb-error/10 animate-pulse pointer-events-none" />
                )}
            </div>
        </div>
    );
}
