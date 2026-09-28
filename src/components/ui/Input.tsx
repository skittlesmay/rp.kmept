"use client";

import { cn } from "@/lib/utils";
import { InputHTMLAttributes, forwardRef } from "react";

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
  icon?: React.ReactNode;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, hint, icon, id, ...props }, ref) => {
    const inputId = id || label?.toLowerCase().replace(/\s/g, "-");

    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={inputId}
            className="block text-sm font-medium text-text-secondary mb-2"
          >
            {label}
          </label>
        )}
        <div className="relative">
          {icon && (
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted">
              {icon}
            </div>
          )}
          <input
            ref={ref}
            id={inputId}
            className={cn(
              "w-full px-4 py-3 rounded-xl",
              "bg-dark-100 border border-glass-border",
              "text-text-primary placeholder:text-text-muted",
              "transition-all duration-300",
              "focus:outline-none focus:border-neon-cyan/50 focus:shadow-[0_0_15px_rgba(0,240,255,0.15)]",
              "hover:border-glass-border/80",
              icon && "pl-12",
              error && "border-neon-pink/50 focus:border-neon-pink focus:shadow-[0_0_15px_rgba(255,51,102,0.15)]",
              className
            )}
            {...props}
          />
        </div>
        {error && (
          <p className="mt-2 text-sm text-neon-pink flex items-center gap-1">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {error}
          </p>
        )}
        {hint && !error && (
          <p className="mt-2 text-sm text-text-muted">{hint}</p>
        )}
      </div>
    );
  }
);

Input.displayName = "Input";

export { Input };
