import React, { useRef, useState } from 'react';
import { Minus, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ChargeStepperProps {
    value: number;
    onChange: (value: number) => void;
    step?: number;
    min?: number;
    max?: number;
    label?: string;
    suffix?: string;
    className?: string;
}

export const ChargeStepper = ({
    value,
    onChange,
    step = 0.5,
    min = 0,
    max = 999,
    label,
    suffix = 'kg',
    className,
}: ChargeStepperProps) => {
    const inputRef = useRef<HTMLInputElement>(null);
    const [isFocused, setIsFocused] = useState(false);

    const handleIncrement = (e: React.MouseEvent) => {
        e.preventDefault();
        const newValue = Math.min(max, value + step);
        // Round to avoid floating point errors (e.g. 10.5 + 0.5 = 11.0)
        onChange(Number(newValue.toFixed(1)));
    };

    const handleDecrement = (e: React.MouseEvent) => {
        e.preventDefault();
        const newValue = Math.max(min, value - step);
        onChange(Number(newValue.toFixed(1)));
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const inputValue = e.target.value;

        // Allow empty string for better typing experience
        if (inputValue === '') {
            onChange(min); // Or handle as empty/null if component supported it, currently fallback to min
            return;
        }

        const parsedValue = parseFloat(inputValue);
        if (!isNaN(parsedValue)) {
            // Don't clamp while typing to allow typing "100" without getting stuck at max if max is small (though max is 999)
            // But for safety on blur we might clamp. For now just standard update.
            onChange(parsedValue);
        }
    };

    return (
        <div className={cn("flex flex-col gap-2", className)}>
            {label && (
                <label className="font-sans text-xs uppercase tracking-wider text-mb-muted block text-center">
                    {label}
                </label>
            )}
            <div
                className={cn(
                    "relative flex items-center bg-mb-surface border rounded-xl transition-all h-14 overflow-hidden",
                    isFocused
                        ? "border-mb-primary ring-1 ring-mb-primary shadow-[0_0_10px_-2px_rgba(var(--mb-primary),0.2)]"
                        : "border-white/5 hover:border-white/10"
                )}
            >
                {/* Decrement */}
                <button
                    type="button"
                    onClick={handleDecrement}
                    disabled={value <= min}
                    className="flex shrink-0 items-center justify-center h-full w-10 sm:w-14 text-mb-muted hover:text-mb-fg hover:bg-white/5 active:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                    <Minus className="w-5 h-5" />
                </button>

                {/* Input Area */}
                <div className="flex-1 flex items-center justify-center relative h-full border-x border-white/5 bg-mb-surface-raised/50">
                    <div className="flex items-baseline gap-1">
                        <input
                            ref={inputRef}
                            type="number"
                            inputMode="decimal"
                            step={step}
                            min={min}
                            max={max}
                            value={value} // You might want to handle controlled state better for typing e.g. "1."
                            onChange={handleInputChange}
                            onFocus={() => setIsFocused(true)}
                            onBlur={() => {
                                setIsFocused(false);
                                // Clamp on blur
                                onChange(Math.min(max, Math.max(min, value)));
                            }}
                            className="w-12 sm:w-16 bg-transparent text-center font-mono text-xl sm:text-2xl font-bold text-mb-fg outline-none p-0 appearance-none bg-none"
                        />
                        {suffix && (
                            <span className="text-sm text-mb-muted font-medium select-none pointer-events-none">
                                {suffix}
                            </span>
                        )}
                    </div>
                </div>

                {/* Increment */}
                <button
                    type="button"
                    onClick={handleIncrement}
                    disabled={value >= max}
                    className="flex shrink-0 items-center justify-center h-full w-10 sm:w-14 text-mb-muted hover:text-mb-fg hover:bg-white/5 active:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                    <Plus className="w-5 h-5" />
                </button>
            </div>
        </div>
    );
};
