import { X, Minus, Plus, SkipForward } from "lucide-react";

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
    const radius = 20;
    const circumference = 2 * Math.PI * radius;
    const strokeDashoffset = circumference - (progress / 100) * circumference;

    if (remaining <= 0) return null;

    return (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-app/90 backdrop-blur-md rounded-full border border-input shadow-2xl flex items-center p-1.5 gap-4 z-50 animate-slide-down pr-6 ring-1 ring-white/5">
            {/* Circular Progress + Time */}
            <div className="relative w-14 h-14 flex items-center justify-center bg-surface/50 rounded-full border border-white/5">
                {/* Background track */}
                <svg className="absolute inset-0 w-full h-full -rotate-90 p-1" viewBox="0 0 44 44">
                    <circle
                        cx="22" cy="22" r={radius}
                        className="stroke-input fill-none"
                        strokeWidth="3"
                    />
                    <circle
                        cx="22" cy="22" r={radius}
                        className="stroke-brand fill-none transition-all duration-1000 ease-linear"
                        strokeWidth="3"
                        strokeDasharray={circumference}
                        strokeDashoffset={strokeDashoffset}
                        strokeLinecap="round"
                    />
                </svg>
                <div className="relative z-10 flex flex-col items-center justify-center leading-none">
                    <span className="font-mono text-sm font-bold text-primary tabular-nums tracking-tighter">
                        {mins}:{String(secs).padStart(2, '0')}
                    </span>
                </div>
            </div>

            {/* Controls */}
            <div className="flex items-center gap-1">
                {onAdjust && (
                    <button
                        onClick={() => onAdjust(-15)}
                        className="w-10 h-10 flex items-center justify-center text-muted-foreground hover:text-primary active:scale-90 transition-all rounded-full hover:bg-surface"
                    >
                        <span className="font-mono text-xs font-medium">-15</span>
                    </button>
                )}

                <div className="w-[1px] h-4 bg-white/10 mx-1"></div>

                {onAdjust && (
                    <button
                        onClick={() => onAdjust(15)}
                        className="w-10 h-10 flex items-center justify-center text-muted-foreground hover:text-primary active:scale-90 transition-all rounded-full hover:bg-surface"
                    >
                        <span className="font-mono text-xs font-medium">+15</span>
                    </button>
                )}
            </div>

            <button
                onClick={onSkip}
                className="ml-2 flex items-center gap-2 px-3 py-1.5 rounded-full bg-surface hover:bg-surface/80 text-primary transition-all active:scale-95 group border border-white/5"
            >
                <SkipForward className="w-4 h-4 text-brand" />
                <span className="font-sans text-[10px] uppercase tracking-widest font-semibold text-muted-foreground group-hover:text-primary">Skip</span>
            </button>
        </div>
    );
}
