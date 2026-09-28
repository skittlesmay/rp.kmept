"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Upload, History, BarChart3, LogOut, Dumbbell } from "lucide-react";
import { Button } from "@/components/ui";
import { FileUpload } from "@/components/admin/FileUpload";
import { VersionHistory } from "@/components/admin/VersionHistory";
import { StatsPanel } from "@/components/admin/StatsPanel";
import { PhysicalEducationEditor } from "@/components/admin/PhysicalEducationEditor";

interface AdminUser {
  id: string;
  login: string;
  name: string;
}

type TabType = "upload" | "history" | "stats" | "physical-education";

const TABS = [
  { id: "upload" as TabType, label: "Загрузка", icon: Upload },
  { id: "history" as TabType, label: "История", icon: History },
  { id: "stats" as TabType, label: "Статистика", icon: BarChart3 },
  { id: "physical-education" as TabType, label: "Физкультура", icon: Dumbbell },
];

export default function AdminPage() {
  const router = useRouter();
  const [admin, setAdmin] = useState<AdminUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabType>("upload");
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const response = await fetch("/api/admin/auth");
      const data = await response.json();

      if (data.success) {
        setAdmin(data.data);
      } else {
        router.push("/nimda/login");
      }
    } catch {
      router.push("/nimda/login");
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    await fetch("/api/admin/auth", { method: "DELETE" });
    router.push("/nimda/login");
  };

  const handleUploadSuccess = () => {
    setRefreshKey((prev) => prev + 1);
    setActiveTab("history");
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-neon-cyan border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!admin) {
    return null;
  }

  return (
    <div className="min-h-screen flex">
      {/* Sidebar */}
      <aside className="fixed left-0 top-0 bottom-0 w-64 glass border-r border-glass-border flex flex-col">
        {/* Logo */}
        <div className="p-6 border-b border-glass-border">
          <div className="flex items-center gap-3">
            <img
              src="/stylesKmept/blackLogo.jpg"
              alt="КМЭПТ"
              className="h-8 w-auto rounded object-contain"
            />
            <div>
              <h1 className="font-semibold text-text-primary tracking-tight">
                КМЭПТ
              </h1>
              <p className="text-xs text-text-muted">Админ-панель</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4">
          <ul className="space-y-2">
            {TABS.map(({ id, label, icon: Icon }) => (
              <li key={id}>
                <button
                  onClick={() => setActiveTab(id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 ${
                    activeTab === id
                      ? "bg-neon-cyan/10 text-neon-cyan"
                      : "text-text-secondary hover:text-text-primary hover:bg-white/5"
                  }`}
                >
                  <Icon
                    className={`w-5 h-5 transition-all duration-300 ${
                      activeTab === id
                        ? "drop-shadow-[0_0_6px_rgba(0,240,255,0.5)]"
                        : ""
                    }`}
                  />
                  <span className="font-medium">{label}</span>
                </button>
              </li>
            ))}
          </ul>
        </nav>

        {/* User & Logout */}
        <div className="p-4 border-t border-glass-border">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-neon-cyan/20 flex items-center justify-center">
                <span className="text-sm font-medium text-neon-cyan">
                  {admin.name.charAt(0)}
                </span>
              </div>
              <div>
                <p className="text-sm font-medium text-text-primary">{admin.name}</p>
                <p className="text-xs text-text-muted">{admin.login}</p>
              </div>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start"
            onClick={handleLogout}
          >
            <LogOut className="w-4 h-4" />
            Выйти
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 ml-64 p-8">
        <div className="max-w-5xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h2 className="text-3xl font-bold tracking-tight text-text-primary">
              {activeTab === "upload" && "Загрузка расписания"}
              {activeTab === "history" && "История загрузок"}
              {activeTab === "stats" && "Статистика"}
              {activeTab === "physical-education" && "Расписание физкультуры"}
            </h2>
            <p className="text-text-secondary mt-1">
              {activeTab === "upload" && "Загрузите Excel файл с расписанием"}
              {activeTab === "history" && "Управление версиями расписания"}
              {activeTab === "stats" && "Общая статистика системы"}
              {activeTab === "physical-education" && "Настройка расписания физической культуры"}
            </p>
          </div>

          {/* Content */}
          <div className="animate-fade-in">
            {activeTab === "upload" && (
              <FileUpload onSuccess={handleUploadSuccess} />
            )}
            {activeTab === "history" && (
              <VersionHistory
                key={refreshKey}
                onUpdate={() => setRefreshKey((prev) => prev + 1)}
              />
            )}
            {activeTab === "stats" && <StatsPanel key={refreshKey} />}
            {activeTab === "physical-education" && <PhysicalEducationEditor />}
          </div>
        </div>
      </main>
    </div>
  );
}
