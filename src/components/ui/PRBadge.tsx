import { Trophy } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PRBadgeProps {
    className?: string;
    showLabel?: boolean;
}

export const PRBadge = ({ className, showLabel = true }: PRBadgeProps) => {
    return (
        <div
            className={cn(
                "inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-mb-primary/10 border border-mb-primary/20 text-mb-primary",
                className
            )}
        >
            <Trophy className="w-3 h-3 fill-current" />
            {showLabel && (
                <span className="text-[10px] font-bold uppercase tracking-wider">
                    PR
                </span>
            )}
        </div>
    );
};
