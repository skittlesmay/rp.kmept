"use client";

import { useEffect, useState } from "react";
import { FileSpreadsheet, CheckCircle, Trash2, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui";

interface ScheduleVersion {
  id: string;
  fileName: string;
  uploadedAt: string;
  uploadedBy: string;
  isActive: boolean;
  schedulesCount: number;
  groupsCount: number;
}

interface VersionHistoryProps {
  onUpdate?: () => void;
}

export function VersionHistory({ onUpdate }: VersionHistoryProps) {
  const [versions, setVersions] = useState<ScheduleVersion[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    loadVersions();
  }, []);

  const loadVersions = async () => {
    try {
      const response = await fetch("/api/admin/versions");
      const data = await response.json();

      if (data.success) {
        setVersions(data.data);
      } else {
        setError(data.error || "Ошибка загрузки истории");
      }
    } catch {
      setError("Ошибка соединения с сервером");
    } finally {
      setIsLoading(false);
    }
  };

  const activateVersion = async (versionId: string) => {
    setActionLoading(versionId);
    setError("");

    try {
      const response = await fetch("/api/admin/versions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ versionId }),
      });

      const data = await response.json();

      if (data.success) {
        await loadVersions();
        onUpdate?.();
      } else {
        setError(data.error || "Ошибка активации версии");
      }
    } catch {
      setError("Ошибка соединения с сервером");
    } finally {
      setActionLoading(null);
    }
  };

  const deleteVersion = async (versionId: string) => {
    if (!confirm("Вы уверены, что хотите удалить эту версию расписания?")) {
      return;
    }

    setActionLoading(versionId);
    setError("");

    try {
      const response = await fetch(`/api/admin/versions?versionId=${versionId}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (data.success) {
        await loadVersions();
        onUpdate?.();
      } else {
        setError(data.error || "Ошибка удаления версии");
      }
    } catch {
      setError("Ошибка соединения с сервером");
    } finally {
      setActionLoading(null);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("ru-RU", {
      day: "numeric",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (isLoading) {
    return (
      <div className="glass rounded-2xl p-12 flex justify-center">
        <div className="w-8 h-8 border-2 border-neon-cyan border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {error && (
        <div className="p-4 rounded-xl bg-neon-pink/10 border border-neon-pink/30 text-neon-pink">
          {error}
        </div>
      )}

      {versions.length === 0 ? (
        <div className="glass rounded-2xl p-12 text-center">
          <div className="text-5xl mb-4">📭</div>
          <p className="text-text-secondary">Расписание ещё не загружалось</p>
        </div>
      ) : (
        <div className="space-y-3">
          {versions.map((version) => (
            <div
              key={version.id}
              className={`glass rounded-2xl p-5 transition-all duration-300 ${
                version.isActive ? "border-neon-green/30 bg-neon-green/5" : ""
              }`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-4">
                  <div
                    className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                      version.isActive ? "bg-neon-green/20" : "bg-dark-200"
                    }`}
                  >
                    <FileSpreadsheet
                      className={`w-6 h-6 ${
                        version.isActive ? "text-neon-green" : "text-text-muted"
                      }`}
                    />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-medium text-text-primary">{version.fileName}</p>
                      {version.isActive && (
                        <span className="flex items-center gap-1 text-xs font-medium text-neon-green px-2 py-0.5 bg-neon-green/10 rounded-full">
                          <CheckCircle className="w-3 h-3" />
                          Активная
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-text-secondary mb-2">
                      {formatDate(version.uploadedAt)}
                    </p>
                    <div className="flex gap-4 text-sm text-text-muted">
                      <span>{version.groupsCount} групп</span>
                      <span>{version.schedulesCount} записей</span>
                    </div>
                  </div>
                </div>

                {!version.isActive && (
                  <div className="flex gap-2">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => activateVersion(version.id)}
                      disabled={actionLoading === version.id}
                    >
                      <RotateCcw className="w-4 h-4" />
                      Активировать
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => deleteVersion(version.id)}
                      disabled={actionLoading === version.id}
                      className="text-neon-pink hover:text-neon-pink hover:bg-neon-pink/10"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
