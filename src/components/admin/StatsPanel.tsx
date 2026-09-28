"use client";

import { useEffect, useState } from "react";
import { FolderOpen, FileSpreadsheet, Calendar } from "lucide-react";

interface Stats {
  groups: {
    total: number;
  };
  schedule: {
    versionsCount: number;
    activeVersion: {
      id: string;
      fileName: string;
      uploadedAt: string;
      schedulesCount: number;
    } | null;
  };
}

export function StatsPanel() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const response = await fetch("/api/admin/stats");
      const data = await response.json();

      if (data.success) {
        setStats(data.data);
      } else {
        setError(data.error || "Ошибка загрузки статистики");
      }
    } catch {
      setError("Ошибка соединения с сервером");
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("ru-RU", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  if (isLoading) {
    return (
      <div className="glass rounded-2xl p-12 flex justify-center">
        <div className="w-8 h-8 border-2 border-neon-cyan border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 rounded-xl bg-neon-pink/10 border border-neon-pink/30 text-neon-pink">
        {error}
      </div>
    );
  }

  if (!stats) return null;

  return (
    <div className="space-y-6">
      {/* Stats cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard
          icon={<FolderOpen className="w-6 h-6" />}
          label="Групп"
          value={stats.groups.total}
          color="cyan"
        />
        <StatCard
          icon={<Calendar className="w-6 h-6" />}
          label="Записей расписания"
          value={stats.schedule.activeVersion?.schedulesCount || 0}
          color="purple"
        />
        <StatCard
          icon={<FileSpreadsheet className="w-6 h-6" />}
          label="Версий расписания"
          value={stats.schedule.versionsCount}
          color="pink"
        />
      </div>

      {/* Active schedule */}
      <div className="glass rounded-2xl overflow-hidden">
        <div className="px-6 py-4 border-b border-glass-border">
          <h3 className="font-semibold text-text-primary">Активное расписание</h3>
        </div>
        <div className="p-6">
          {stats.schedule.activeVersion ? (
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-neon-cyan/10 flex items-center justify-center">
                <FileSpreadsheet className="w-6 h-6 text-neon-cyan" />
              </div>
              <div>
                <p className="font-medium text-text-primary">
                  {stats.schedule.activeVersion.fileName}
                </p>
                <p className="text-sm text-text-secondary">
                  Загружено: {formatDate(stats.schedule.activeVersion.uploadedAt)}
                </p>
                <p className="text-sm text-text-muted">
                  {stats.schedule.activeVersion.schedulesCount} записей расписания
                </p>
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-text-muted">Расписание не загружено</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: number;
  color: "cyan" | "purple" | "pink";
}

function StatCard({ icon, label, value, color }: StatCardProps) {
  const colors = {
    cyan: "text-neon-cyan bg-neon-cyan/10",
    purple: "text-neon-purple bg-neon-purple/10",
    pink: "text-neon-pink bg-neon-pink/10",
  };

  const textColors = {
    cyan: "text-neon-cyan",
    purple: "text-neon-purple",
    pink: "text-neon-pink",
  };

  return (
    <div className="glass rounded-2xl p-6">
      <div className={`w-12 h-12 rounded-xl ${colors[color]} flex items-center justify-center mb-4`}>
        <div className={textColors[color]}>{icon}</div>
      </div>
      <p className={`text-3xl font-bold ${textColors[color]} mb-1`}>{value}</p>
      <p className="text-sm text-text-secondary">{label}</p>
    </div>
  );
}
