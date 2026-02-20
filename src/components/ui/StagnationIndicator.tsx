import { TrendingFlat, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StagnationIndicatorProps {
    sessionsStalled: number;
    className?: string;
    maxStall?: number; // Threshold for warning
}

export const StagnationIndicator = ({
    sessionsStalled,
    className,
    maxStall = 3,
}: StagnationIndicatorProps) => {
    if (sessionsStalled <= 0) return null;

    const isWarning = sessionsStalled >= maxStall;

    return (
        <div
            className={cn(
                "inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full border text-[10px] font-medium uppercase tracking-wider",
                isWarning
                    ? "bg-mb-error/10 border-mb-error/20 text-mb-error"
                    : "bg-mb-surface-raised border-white/5 text-mb-muted",
                className
            )}
            title={`${sessionsStalled} séances sans progression`}
        >
            {isWarning ? (
                <AlertCircle className="w-3 h-3" />
            ) : (
                <TrendingFlat className="w-3 h-3" />
            )}
            <span>
                {sessionsStalled} séance{sessionsStalled > 1 ? 's' : ''} stable{sessionsStalled > 1 ? 's' : ''}
            </span>
        </div>
    );
};
