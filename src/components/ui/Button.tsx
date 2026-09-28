"use client";

import { cn } from "@/lib/utils";
import { ButtonHTMLAttributes, forwardRef } from "react";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "danger" | "outline";
  size?: "sm" | "md" | "lg";
  isLoading?: boolean;
  icon?: React.ReactNode;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = "primary",
      size = "md",
      isLoading = false,
      disabled,
      children,
      icon,
      ...props
    },
    ref
  ) => {
    const baseStyles = `
      inline-flex items-center justify-center gap-2
      font-medium rounded-pill
      transition-all duration-300 ease-out
      disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none
      focus:outline-none focus-visible:ring-2 focus-visible:ring-neon-cyan/50
    `;

    const variants = {
      primary: `
        bg-neon-cyan text-dark font-semibold
        hover:shadow-neon-cyan hover:-translate-y-0.5
        active:translate-y-0
      `,
      secondary: `
        glass text-text-primary
        hover:bg-white/10 hover:-translate-y-0.5
        active:translate-y-0
      `,
      ghost: `
        text-text-secondary bg-transparent
        hover:text-text-primary hover:bg-white/5
      `,
      outline: `
        border border-glass-border text-text-primary bg-transparent
        hover:border-neon-cyan/50 hover:text-neon-cyan hover:shadow-neon-cyan/20
        hover:-translate-y-0.5
      `,
      danger: `
        bg-neon-pink/20 text-neon-pink border border-neon-pink/30
        hover:bg-neon-pink/30 hover:shadow-neon-pink
        hover:-translate-y-0.5
      `,
    };

    const sizes = {
      sm: "px-4 py-2 text-sm",
      md: "px-6 py-3 text-base",
      lg: "px-8 py-4 text-lg",
    };

    return (
      <button
        ref={ref}
        className={cn(baseStyles, variants[variant], sizes[size], className)}
        disabled={disabled || isLoading}
        {...props}
      >
        {isLoading ? (
          <>
            <svg
              className="animate-spin h-4 w-4"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            <span>Загрузка...</span>
          </>
        ) : (
          <>
            {icon && <span className="icon-neon">{icon}</span>}
            {children}
          </>
        )}
      </button>
    );
  }
);

Button.displayName = "Button";

export { Button };
