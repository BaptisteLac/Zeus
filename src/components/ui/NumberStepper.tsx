import React, { useRef, useState } from 'react';
import { Minus, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';

interface NumberStepperProps {
    value: number;
    onChange: (value: number) => void;
    step?: number;
    min?: number;
    max?: number;
    label?: string;
    suffix?: string;
    className?: string;
}

export function NumberStepper({
    value,
    onChange,
    step = 1,
    min = 0,
    max = 999,
    label,
    suffix,
    className,
}: NumberStepperProps) {
    const inputRef = useRef<HTMLInputElement>(null);
    const [isFocused, setIsFocused] = useState(false);

    const handleIncrement = (e: React.MouseEvent) => {
        e.preventDefault();
        const newValue = Math.min(max, value + step);
        onChange(Number(newValue.toFixed(1))); // Handle float precision
    };

    const handleDecrement = (e: React.MouseEvent) => {
        e.preventDefault();
        const newValue = Math.max(min, value - step);
        onChange(Number(newValue.toFixed(1)));
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newVal = e.target.value === '' ? '' : parseFloat(e.target.value);
        if (newVal === '') {
            onChange(min);
            return;
        }
        if (!isNaN(newVal)) {
            onChange(Math.min(max, Math.max(min, newVal)));
        }
    };

    return (
        <div className={cn("flex flex-col gap-1.5", className)}>
            {label && (
                <label className="font-sans text-xs uppercase tracking-wider text-stone block text-center">
                    {label}
                </label>
            )}
            <div
                className={cn(
                    "flex items-center bg-warm-white border rounded-lg transition-all min-h-[52px]",
                    isFocused ? "border-terracotta ring-1 ring-terracotta" : "border-sand"
                )}
            >
                <button
                    type="button"
                    onClick={handleDecrement}
                    className="w-12 h-full flex items-center justify-center text-stone hover:text-charcoal active:scale-90 transition-transform touch-manipulation"
                    disabled={value <= min}
                >
                    <Minus className="w-5 h-5" />
                </button>

                <div className="flex-1 text-center font-mono text-xl text-charcoal flex items-center justify-center relative border-x border-sand/10 h-[30px]">
                    <input
                        ref={inputRef}
                        type="number"
                        inputMode="decimal"
                        step={step}
                        min={min}
                        max={max}
                        value={value || ''}
                        onChange={handleInputChange}
                        onFocus={() => setIsFocused(true)}
                        onBlur={() => setIsFocused(false)}
                        className="w-full h-full text-center bg-transparent outline-none absolute inset-0 z-10"
                    />
                    <span className="pointer-events-none opacity-0">{value}</span>
                </div>

                <button
                    type="button"
                    onClick={handleIncrement}
                    className="w-12 h-full flex items-center justify-center text-stone hover:text-charcoal active:scale-90 transition-transform touch-manipulation"
                    disabled={value >= max}
                >
                    <Plus className="w-5 h-5" />
                </button>
            </div>
        </div>
    );
}
