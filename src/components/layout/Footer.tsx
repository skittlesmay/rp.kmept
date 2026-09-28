"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

export function Footer() {
  const [theme, setTheme] = useState<"dark" | "light">("dark");

  useEffect(() => {
    const updateTheme = () => {
      const currentTheme = document.documentElement.getAttribute("data-theme") as "dark" | "light" | null;
      setTheme(currentTheme || "dark");
    };
    
    updateTheme();
    
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.attributeName === "data-theme") {
          updateTheme();
        }
      });
    });
    
    observer.observe(document.documentElement, { attributes: true });
    return () => observer.disconnect();
  }, []);

  const logoSrc = theme === "dark" ? "/stylesKmept/blackLogo.jpg" : "/stylesKmept/whiteLogo.png";

  return (
    <footer className="border-t border-glass-border bg-dark-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
        {/* Main row */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          {/* Logo + description */}
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-2">
              <img
                src={logoSrc}
                alt="КМЭПТ"
                className="h-6 w-auto rounded object-contain"
              />
              <span className="font-semibold tracking-tight text-text-primary">
                КМЭПТ
              </span>
            </Link>
            <span className="hidden sm:inline text-text-muted">—</span>
            <span className="hidden sm:inline text-text-secondary text-sm">
              Колледж мировой экономики и передовых технологий
            </span>
          </div>

          {/* Links as icons */}
          <div className="flex items-center gap-3">
            <a
              href="https://kmept.ru"
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 rounded-lg hover:bg-white/5 transition-all duration-300 hover:scale-110"
              title="Официальный сайт"
            >
              <img src="/icons/kmeptIcon.jpg" alt="КМЭПТ" className="w-6 h-6 rounded" />
            </a>
            <a
              href="https://vk.com/kmept"
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 rounded-lg hover:bg-white/5 transition-all duration-300 hover:scale-110"
              title="ВКонтакте"
            >
              <img src="/icons/vkontakteIcon.png" alt="ВКонтакте" className="w-6 h-6 rounded" />
            </a>
          </div>
        </div>

        {/* Copyright */}
        <div className="mt-4 pt-4 border-t border-glass-border">
          <p className="text-center text-xs text-text-muted">
            © {new Date().getFullYear()} КМЭПТ
          </p>
        </div>
      </div>
    </footer>
  );
}
