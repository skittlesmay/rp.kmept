"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Calendar, Bell, Smartphone, Zap } from "lucide-react";
import { Button, ThemeSwitcher } from "@/components/ui";
import { Footer } from "@/components/layout";

export default function Home() {
  const [theme, setTheme] = useState<"dark" | "light">("dark");

  // Listen for theme changes
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

  // Dynamic logo based on theme
  const logoSrc = theme === "dark" ? "/stylesKmept/blackLogo.jpg" : "/stylesKmept/whiteLogo.png";

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header 
        className="fixed top-0 left-0 right-0 z-50 border-b border-glass-border backdrop-blur-xl transition-colors duration-300" 
        style={{ background: theme === 'dark' ? 'rgba(10, 10, 10, 0.85)' : 'rgba(255, 255, 255, 0.85)' }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/" className="flex items-center gap-3 group">
              <img
                src={logoSrc}
                alt="КМЭПТ"
                className="h-7 w-auto rounded object-contain"
              />
              <span className="text-lg font-semibold tracking-tight text-text-primary group-hover:text-neon-cyan transition-colors duration-300">
                КМЭПТ
              </span>
            </Link>

            <ThemeSwitcher />
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        {/* Background gradient */}
        <div className="absolute inset-0 bg-gradient-radial" />
        
        {/* Content */}
        <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
          {/* Logo */}
          <div className="animate-fade-in-down mb-8">
            <img
              src={logoSrc}
              alt="КМЭПТ"
              className="w-48 h-auto mx-auto mb-6 rounded-xl object-contain shadow-lg"
            />
          </div>

          {/* Heading */}
          <div className="animate-fade-in-up">
            <h1 className="text-5xl md:text-7xl font-bold tracking-tighter text-text-primary mb-4">
              Расписание
            </h1>
            <h2 className="text-2xl md:text-3xl font-medium text-text-secondary mb-6">
              Колледж мировой экономики и передовых технологий
            </h2>
            <p className="text-lg text-text-muted max-w-2xl mx-auto mb-12 leading-relaxed">
              Удобный сервис для просмотра актуального расписания занятий. 
              Быстро. Просто. Всегда под рукой.
            </p>

            {/* CTA Button */}
            <Link href="/dashboard">
              <Button variant="primary" size="lg" className="animate-glow-pulse">
                <Calendar className="w-5 h-5" />
                Смотреть расписание
              </Button>
            </Link>
          </div>

          {/* Scroll indicator */}
          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
            <div className="w-6 h-10 rounded-full border-2 border-text-muted flex items-start justify-center p-2">
              <div className="w-1 h-2 bg-text-muted rounded-full animate-pulse" />
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 bg-dark-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h3 className="text-3xl md:text-4xl font-bold tracking-tighter text-text-primary mb-4">
              Почему наш сервис?
            </h3>
            <p className="text-text-secondary max-w-2xl mx-auto">
              Мы создали удобный инструмент для студентов и преподавателей
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <FeatureCard
              icon={<Zap className="w-6 h-6" />}
              title="Актуальность"
              description="Расписание обновляется администратором колледжа"
            />
            <FeatureCard
              icon={<Bell className="w-6 h-6" />}
              title="Уведомления"
              description="Получайте уведомления об изменениях через ВКонтакте"
            />
            <FeatureCard
              icon={<Smartphone className="w-6 h-6" />}
              title="Адаптивность"
              description="Удобный просмотр на любом устройстве"
            />
            <FeatureCard
              icon={<Calendar className="w-6 h-6" />}
              title="Быстрый доступ"
              description="Ваш выбор группы сохраняется автоматически"
            />
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-radial opacity-50" />
        <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h3 className="text-3xl md:text-4xl font-bold tracking-tighter text-text-primary mb-6">
            Готовы начать?
          </h3>
          <p className="text-text-secondary mb-8 max-w-xl mx-auto">
            Выберите свою группу и получите доступ к актуальному расписанию прямо сейчас
          </p>
          <Link href="/dashboard">
            <Button variant="primary" size="lg">
              Перейти к расписанию →
            </Button>
          </Link>
        </div>
      </section>

      <Footer />
    </div>
  );
}

interface FeatureCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
}

function FeatureCard({ icon, title, description }: FeatureCardProps) {
  return (
    <div className="glass rounded-2xl p-6 card-hover group">
      <div className="w-12 h-12 rounded-xl bg-neon-cyan/10 flex items-center justify-center mb-4 group-hover:bg-neon-cyan/20 transition-colors duration-300">
        <div className="text-neon-cyan group-hover:drop-shadow-[0_0_8px_rgba(0,240,255,0.5)] transition-all duration-300">
          {icon}
        </div>
      </div>
      <h4 className="text-lg font-semibold text-text-primary mb-2 tracking-tight">
        {title}
      </h4>
      <p className="text-text-secondary text-sm leading-relaxed">
        {description}
      </p>
    </div>
  );
}
