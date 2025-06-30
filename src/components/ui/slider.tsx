"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

interface SliderProps {
  value?: number[];
  onValueChange?: (value: number[]) => void;
  max?: number;
  min?: number;
  step?: number;
  disabled?: boolean;
  className?: string;
}

const Slider = React.forwardRef<HTMLInputElement, SliderProps>(
  ({ className, value = [0], onValueChange, max = 100, min = 0, step = 1, disabled = false, ...props }, ref) => {
    const currentValue = value[0] || 0;
    const percentage = ((currentValue - min) / (max - min)) * 100;

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const newValue = parseFloat(e.target.value);
      if (onValueChange) {
        onValueChange([newValue]);
      }
    };

    return (
      <div className={cn("relative flex w-full touch-none select-none items-center", className)}>
        <div className="relative h-2 w-full grow overflow-hidden rounded-full bg-secondary">
          <div 
            className="absolute h-full bg-primary transition-all duration-200" 
            style={{ width: `${percentage}%` }}
          />
        </div>
        <input
          ref={ref}
          type="range"
          value={currentValue}
          onChange={handleChange}
          max={max}
          min={min}
          step={step}
          disabled={disabled}
          className="absolute inset-0 w-full h-2 opacity-0 cursor-pointer disabled:cursor-not-allowed"
          {...props}
        />
        <div 
          className="absolute block h-5 w-5 rounded-full border-2 border-primary bg-background ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 -translate-x-1/2"
          style={{ left: `${percentage}%` }}
        />
      </div>
    );
  }
);

Slider.displayName = "Slider";

export { Slider }