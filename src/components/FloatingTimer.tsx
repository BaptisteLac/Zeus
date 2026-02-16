import { X } from "lucide-react";

interface FloatingTimerProps {
    remaining: number;
    total: number; // Added total prop
    onSkip: () => void;
    onAdjust?: (delta: number) => void;
}

export default function FloatingTimer({ remaining, total, onSkip, onAdjust }: FloatingTimerProps) {
    const mins = Math.floor(remaining / 60);
    const secs = remaining % 60;

    // Calculate progress for the circle (100% full at start, 0% at end)
    const progress = Math.min(100, Math.max(0, (remaining / total) * 100));

    // SVG params
    const radius = 18;
    const circumference = 2 * Math.PI * radius;
    const strokeDashoffset = circumference - (progress / 100) * circumference;

    if (remaining < 0) return null;

    return (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-charcoal text-warm-white rounded-full shadow-2xl flex items-center p-2 pr-6 gap-4 z-50 border border-stone/30 backdrop-blur-md animate-slide-down">
            {/* Circular Progress + Time */}
            <div className="relative w-12 h-12 flex items-center justify-center">
                {/* Background track */}
                <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 44 44">
                    <circle
                        cx="22" cy="22" r={radius}
                        className="stroke-stone/30 fill-none"
                        strokeWidth="3"
                    />
                    <circle
                        cx="22" cy="22" r={radius}
                        className="stroke-terracotta fill-none transition-all duration-1000 ease-linear"
                        strokeWidth="3"
                        strokeDasharray={circumference}
                        strokeDashoffset={strokeDashoffset}
                        strokeLinecap="round"
                    />
                </svg>
                <div className="relative z-10 flex flex-col items-center justify-center leading-none">
                    <span className="font-mono text-xs font-bold tabular-nums tracking-tighter">
                        {mins}:{String(secs).padStart(2, '0')}
                    </span>
                </div>
            </div>

            {/* Controls */}
            <div className="flex items-center gap-1">
                {onAdjust && (
                    <button
                        onClick={() => onAdjust(-15)}
                        className="w-10 h-10 flex items-center justify-center font-mono text-xs text-stone hover:text-warm-white active:scale-90 transition-all rounded-full hover:bg-white/5 touch-manipulation"
                    >
                        -15
                    </button>
                )}

                {onAdjust && (
                    <button
                        onClick={() => onAdjust(15)}
                        className="w-10 h-10 flex items-center justify-center font-mono text-xs text-stone hover:text-warm-white active:scale-90 transition-all rounded-full hover:bg-white/5 touch-manipulation"
                    >
                        +15
                    </button>
                )}
            </div>

            <div className="w-[1px] h-6 bg-stone/40 mx-2"></div>

            <button
                onClick={onSkip}
                className="font-sans text-xs uppercase tracking-wider font-medium text-stone hover:text-warm-white transition-colors"
            >
                PASSER
            </button>
        </div>
    );
}
