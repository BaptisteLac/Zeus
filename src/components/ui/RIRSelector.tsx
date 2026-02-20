import React from 'react';
import { cn } from '@/lib/utils';

// Standard RIR options for hypertrophy training
const RIR_OPTIONS = ['0', '1', '1-2', '2', '2-3', '3+'];

interface RIRSelectorProps {
    value: string;
    onChange: (value: string) => void;
    className?: string;
    options?: string[];
}

export const RIRSelector = ({
    value,
    onChange,
    className,
    options = RIR_OPTIONS,
}: RIRSelectorProps) => {
    return (
        <div className={cn("flex flex-wrap gap-2", className)}>
            {options.map((option) => {
                const isSelected = value === option;

                return (
                    <button
                        key={option}
                        onClick={() => onChange(option)}
                        className={cn(
                            "flex-1 min-w-[3rem] py-2.5 px-3 rounded-lg font-mono text-sm font-medium transition-all duration-200",
                            isSelected
                                ? "bg-mb-primary text-white shadow-sm ring-1 ring-mb-primary"
                                : "bg-mb-surface border border-white/5 text-mb-muted hover:bg-mb-surface-raised hover:text-mb-fg active:scale-95"
                        )}
                        type="button"
                    >
                        {option}
                    </button>
                );
            })}
        </div>
    );
};
