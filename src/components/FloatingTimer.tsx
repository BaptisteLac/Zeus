interface FloatingTimerProps {
    remaining: number;
    onSkip: () => void;
}

export default function FloatingTimer({ remaining, onSkip }: FloatingTimerProps) {
    const mins = Math.floor(remaining / 60);
    const secs = remaining % 60;

    if (remaining < 0) return null;

    return (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-charcoal text-warm-white px-6 py-3 rounded-full shadow-lg flex items-center gap-4 z-50 border border-stone/30 backdrop-blur-md">
            <div className="w-2 h-2 rounded-full bg-terracotta animate-pulse"></div>
            <span className="font-mono text-xl font-light tabular-nums tracking-tight">
                {String(mins).padStart(2, '0')}:{String(secs).padStart(2, '0')}
            </span>
            <div className="w-[1px] h-6 bg-stone/40 mx-2"></div>
            <button
                onClick={onSkip}
                className="font-sans text-xs uppercase tracking-wider text-stone hover:text-warm-white transition-colors"
            >
                Passer
            </button>
        </div>
    );
}
