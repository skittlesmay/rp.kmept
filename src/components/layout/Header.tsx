"use client";

import Link from "next/link";
import { Button } from "@/components/ui";

interface HeaderProps {
  showBackButton?: boolean;
  backHref?: string;
  backLabel?: string;
}

export function Header({ showBackButton = false, backHref = "/", backLabel = "Назад" }: HeaderProps) {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 glass border-b border-glass-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3 group">
            <img
              src="/stylesKmept/blackLogo.jpg"
              alt="КМЭПТ"
              className="h-8 w-auto rounded object-contain"
            />
            <span className="text-lg font-semibold tracking-tight text-text-primary group-hover:text-neon-cyan transition-colors duration-300">
              КМЭПТ
            </span>
          </Link>

          {/* Right side */}
          <div className="flex items-center gap-4">
            {showBackButton && (
              <Link href={backHref}>
                <Button variant="ghost" size="sm">
                  ← {backLabel}
                </Button>
              </Link>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
