"use client";

import { useState, useCallback } from "react";
import { Upload, FileSpreadsheet, CheckCircle, X } from "lucide-react";
import { Button } from "@/components/ui";

interface UploadResult {
  versionId: string;
  fileName: string;
  groupsCount: number;
  groups: string[];
  scheduleItemsCount: number;
}

interface PreviewResult {
  fileName: string;
  groupsCount: number;
  groups: string[];
}

interface FileUploadProps {
  onSuccess?: () => void;
}

export function FileUpload({ onSuccess }: FileUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<PreviewResult | null>(null);
  const [uploadResult, setUploadResult] = useState<UploadResult | null>(null);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [loadingState, setLoadingState] = useState<"preview" | "upload" | null>(null);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) {
      handleFileSelect(droppedFile);
    }
  }, []);

  const handleFileSelect = async (selectedFile: File) => {
    setError("");
    setPreview(null);
    setUploadResult(null);

    if (!selectedFile.name.endsWith(".xlsx") && !selectedFile.name.endsWith(".xls")) {
      setError("Поддерживаются только файлы Excel (.xlsx, .xls)");
      return;
    }

    setFile(selectedFile);
    await loadPreview(selectedFile);
  };

  const loadPreview = async (selectedFile: File) => {
    setIsLoading(true);
    setLoadingState("preview");
    setError("");

    try {
      const formData = new FormData();
      formData.append("file", selectedFile);

      const response = await fetch("/api/admin/upload", {
        method: "PUT",
        body: formData,
      });

      const data = await response.json();

      if (data.success) {
        setPreview(data.data);
      } else {
        setError(data.error || "Ошибка при чтении файла");
      }
    } catch {
      setError("Ошибка соединения с сервером");
    } finally {
      setIsLoading(false);
      setLoadingState(null);
    }
  };

  const handleUpload = async () => {
    if (!file) return;

    setIsLoading(true);
    setLoadingState("upload");
    setError("");

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/admin/upload", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (data.success) {
        setUploadResult(data.data);
        setPreview(null);
        onSuccess?.();
      } else {
        setError(data.error || "Ошибка при загрузке файла");
      }
    } catch {
      setError("Ошибка соединения с сервером");
    } finally {
      setIsLoading(false);
      setLoadingState(null);
    }
  };

  const resetForm = () => {
    setFile(null);
    setPreview(null);
    setUploadResult(null);
    setError("");
  };

  return (
    <div className="space-y-6">
      {/* Upload zone */}
      {!uploadResult && !preview && (
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`glass rounded-2xl p-12 text-center transition-all duration-300 cursor-pointer ${
            isDragging
              ? "border-neon-cyan bg-neon-cyan/5 shadow-neon-cyan/20"
              : "hover:border-glass-border/50"
          }`}
        >
          <input
            type="file"
            accept=".xlsx,.xls"
            onChange={(e) => {
              const selectedFile = e.target.files?.[0];
              if (selectedFile) handleFileSelect(selectedFile);
            }}
            className="hidden"
            id="file-upload"
          />
          <label htmlFor="file-upload" className="cursor-pointer">
            <div
              className={`w-16 h-16 mx-auto mb-6 rounded-2xl flex items-center justify-center transition-all duration-300 ${
                isDragging ? "bg-neon-cyan/20" : "bg-dark-200"
              }`}
            >
              <Upload
                className={`w-8 h-8 transition-all duration-300 ${
                  isDragging
                    ? "text-neon-cyan drop-shadow-[0_0_8px_rgba(0,240,255,0.5)]"
                    : "text-text-muted"
                }`}
              />
            </div>
            <h3 className="text-lg font-semibold text-text-primary mb-2">
              Перетащите файл сюда
            </h3>
            <p className="text-text-secondary text-sm mb-4">
              или нажмите для выбора файла
            </p>
            <p className="text-text-muted text-xs">
              Поддерживаемые форматы: .xlsx, .xls
            </p>
          </label>
        </div>
      )}

      {/* Preview */}
      {preview && !uploadResult && (
        <div className="glass rounded-2xl overflow-hidden animate-fade-in">
          <div className="px-6 py-4 border-b border-glass-border flex items-center justify-between">
            <h3 className="font-semibold text-text-primary">Предпросмотр</h3>
            <button
              onClick={resetForm}
              className="text-text-muted hover:text-text-primary transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="p-6 space-y-4">
            <div className="flex items-center gap-4 p-4 bg-dark-100 rounded-xl">
              <FileSpreadsheet className="w-10 h-10 text-neon-green" />
              <div>
                <p className="font-medium text-text-primary">{preview.fileName}</p>
                <p className="text-sm text-text-secondary">
                  Найдено групп: {preview.groupsCount}
                </p>
              </div>
            </div>

            <div>
              <p className="text-sm text-text-secondary mb-3">Группы для загрузки:</p>
              <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto p-3 bg-dark-100 rounded-xl">
                {preview.groups.map((group) => (
                  <span
                    key={group}
                    className="px-3 py-1 bg-dark-200 rounded-lg text-sm text-text-primary"
                  >
                    {group}
                  </span>
                ))}
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <Button
                onClick={handleUpload}
                isLoading={loadingState === "upload"}
                disabled={isLoading}
              >
                <CheckCircle className="w-4 h-4" />
                Загрузить
              </Button>
              <Button variant="ghost" onClick={resetForm} disabled={isLoading}>
                Отмена
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Success */}
      {uploadResult && (
        <div className="glass rounded-2xl overflow-hidden border-neon-green/30 animate-fade-in">
          <div className="px-6 py-4 border-b border-glass-border bg-neon-green/5">
            <h3 className="font-semibold text-neon-green flex items-center gap-2">
              <CheckCircle className="w-5 h-5" />
              Расписание загружено
            </h3>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="p-4 bg-dark-100 rounded-xl">
                <p className="text-2xl font-bold text-neon-cyan">{uploadResult.groupsCount}</p>
                <p className="text-sm text-text-secondary">Групп</p>
              </div>
              <div className="p-4 bg-dark-100 rounded-xl">
                <p className="text-2xl font-bold text-neon-cyan">
                  {uploadResult.scheduleItemsCount}
                </p>
                <p className="text-sm text-text-secondary">Записей</p>
              </div>
            </div>
            <Button variant="secondary" onClick={resetForm}>
              Загрузить ещё файл
            </Button>
          </div>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="p-4 rounded-xl bg-neon-pink/10 border border-neon-pink/30 text-neon-pink">
          {error}
        </div>
      )}

      {/* Loading overlay */}
      {isLoading && (
        <div className="fixed inset-0 bg-dark/80 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="glass rounded-2xl p-8 flex items-center gap-4">
            <div className="w-6 h-6 border-2 border-neon-cyan border-t-transparent rounded-full animate-spin" />
            <span className="text-text-primary">
              {loadingState === "preview" ? "Чтение файла..." : "Загрузка расписания..."}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
