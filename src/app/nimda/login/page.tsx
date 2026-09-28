"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Lock, User } from "lucide-react";
import { Button, Input } from "@/components/ui";

export default function AdminLoginPage() {
  const router = useRouter();
  const [login, setLogin] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/admin/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ login, password }),
      });

      const data = await response.json();

      if (data.success) {
        router.push("/nimda");
        router.refresh();
      } else {
        setError(data.error || "Ошибка авторизации");
      }
    } catch {
      setError("Ошибка соединения с сервером");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-radial" />

      {/* Card */}
      <div className="relative z-10 w-full max-w-md">
        <div className="glass rounded-3xl p-8 animate-fade-in">
          {/* Logo */}
          <div className="flex justify-center mb-8">
            <img
              src="/stylesKmept/blackLogo.jpg"
              alt="КМЭПТ"
              className="w-32 h-auto rounded-xl object-contain"
            />
          </div>

          {/* Title */}
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold tracking-tight text-text-primary mb-2">
              Админ-панель
            </h1>
            <p className="text-text-secondary text-sm">
              Войдите для управления расписанием
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            <Input
              label="Логин"
              type="text"
              value={login}
              onChange={(e) => setLogin(e.target.value)}
              placeholder="Введите логин"
              required
              autoComplete="username"
              icon={<User className="w-5 h-5" />}
            />

            <Input
              label="Пароль"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Введите пароль"
              required
              autoComplete="current-password"
              icon={<Lock className="w-5 h-5" />}
            />

            {error && (
              <div className="p-4 rounded-xl bg-neon-pink/10 border border-neon-pink/30 text-neon-pink text-sm">
                {error}
              </div>
            )}

            <Button
              type="submit"
              className="w-full"
              isLoading={isLoading}
              disabled={!login || !password}
            >
              Войти
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
