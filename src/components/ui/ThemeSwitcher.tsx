"use client";

import { useState, useEffect } from "react";
import { Sun, Moon } from "lucide-react";

export function ThemeSwitcher() {
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const savedTheme = localStorage.getItem("theme") as "dark" | "light" | null;
    if (savedTheme) {
      setTheme(savedTheme);
      document.documentElement.setAttribute("data-theme", savedTheme);
    }
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === "dark" ? "light" : "dark";
    setTheme(newTheme);
    localStorage.setItem("theme", newTheme);
    document.documentElement.setAttribute("data-theme", newTheme);
  };

  // Prevent hydration mismatch
  if (!mounted) {
    return (
      <div className="w-14 h-8 rounded-full bg-white/10" />
    );
  }

  return (
    <button
      onClick={toggleTheme}
      className="relative w-14 h-8 rounded-full transition-all duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-neon-cyan/50"
      style={{
        background: theme === "dark" 
          ? "rgba(255, 255, 255, 0.1)" 
          : "rgba(0, 0, 0, 0.1)"
      }}
      aria-label={theme === "dark" ? "Включить светлую тему" : "Включить тёмную тему"}
    >
      {/* Track icons */}
      <span className="absolute inset-0 flex items-center justify-between px-1.5">
        <Sun 
          className={`w-4 h-4 transition-all duration-300 ${
            theme === "light" 
              ? "text-amber-500 opacity-100" 
              : "text-white/30 opacity-50"
          }`} 
        />
        <Moon 
          className={`w-4 h-4 transition-all duration-300 ${
            theme === "dark" 
              ? "text-neon-cyan opacity-100" 
              : "text-black/30 opacity-50"
          }`} 
        />
      </span>
      
      {/* Thumb */}
      <span
        className={`absolute top-1 w-6 h-6 rounded-full shadow-md transition-all duration-300 ${
          theme === "dark" 
            ? "left-7 bg-dark-100 border border-neon-cyan/30" 
            : "left-1 bg-white border border-amber-200"
        }`}
        style={{
          boxShadow: theme === "dark" 
            ? "0 0 8px rgba(0, 240, 255, 0.3)" 
            : "0 2px 4px rgba(0, 0, 0, 0.1)"
        }}
      />
    </button>
  );
}
