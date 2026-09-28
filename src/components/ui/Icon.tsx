"use client";

import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

export interface IconProps {
  icon: LucideIcon;
  size?: "sm" | "md" | "lg" | "xl";
  variant?: "default" | "neon" | "muted";
  className?: string;
}

const sizeMap = {
  sm: 16,
  md: 20,
  lg: 24,
  xl: 32,
};

export function Icon({ icon: LucideIcon, size = "md", variant = "default", className }: IconProps) {
  const variants = {
    default: "text-text-primary",
    neon: "text-neon-cyan icon-neon",
    muted: "text-text-muted",
  };

  return (
    <LucideIcon
      size={sizeMap[size]}
      className={cn(variants[variant], "transition-all duration-300", className)}
    />
  );
}

// Neon icon wrapper for hover effects
export interface NeonIconProps {
  icon: LucideIcon;
  size?: "sm" | "md" | "lg" | "xl";
  active?: boolean;
  className?: string;
}

export function NeonIcon({ icon: LucideIcon, size = "md", active = false, className }: NeonIconProps) {
  return (
    <LucideIcon
      size={sizeMap[size]}
      className={cn(
        "transition-all duration-300",
        active 
          ? "text-neon-cyan drop-shadow-[0_0_6px_rgba(0,240,255,0.5)]" 
          : "text-text-secondary hover:text-neon-cyan hover:drop-shadow-[0_0_6px_rgba(0,240,255,0.5)]",
        className
      )}
    />
  );
}
