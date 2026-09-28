"use client";

import { useState, useEffect } from "react";
import { Plus, Trash2, Save, GripVertical } from "lucide-react";
import { Button } from "@/components/ui";

interface ScheduleItem {
  id?: string;
  dayOfWeek: string;
  timeStart: string;
  timeEnd: string;
  sortOrder: number;
}

const DAYS_OPTIONS = [
  "ПОНЕДЕЛЬНИК",
  "ВТОРНИК",
  "СРЕДА",
  "ЧЕТВЕРГ",
  "ПЯТНИЦА",
  "СУББОТА",
];

export function PhysicalEducationEditor() {
  const [items, setItems] = useState<ScheduleItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    loadSchedule();
  }, []);

  const loadSchedule = async () => {
    try {
      const response = await fetch("/api/physical-education");
      const data = await response.json();
      if (data.success) {
        setItems(
          data.data.length > 0
            ? data.data
            : [
                { dayOfWeek: "ПОНЕДЕЛЬНИК", timeStart: "12:00", timeEnd: "13:20", sortOrder: 0 },
                { dayOfWeek: "СРЕДА", timeStart: "15:10", timeEnd: "16:50", sortOrder: 1 },
                { dayOfWeek: "ПЯТНИЦА", timeStart: "12:00", timeEnd: "13:20", sortOrder: 2 },
              ]
        );
      }
    } catch (error) {
      console.error("Error loading schedule:", error);
      setMessage({ type: "error", text: "Ошибка при загрузке расписания" });
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddItem = () => {
    setItems([
      ...items,
      {
        dayOfWeek: "ПОНЕДЕЛЬНИК",
        timeStart: "12:00",
        timeEnd: "13:30",
        sortOrder: items.length,
      },
    ]);
  };

  const handleRemoveItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const handleItemChange = (index: number, field: keyof ScheduleItem, value: string | number) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };
    setItems(newItems);
  };

  const handleSave = async () => {
    setIsSaving(true);
    setMessage(null);

    try {
      const response = await fetch("/api/physical-education", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: items.map((item, index) => ({
            ...item,
            sortOrder: index,
          })),
        }),
      });

      const data = await response.json();

      if (data.success) {
        setMessage({ type: "success", text: "Расписание сохранено!" });
        setItems(data.data);
      } else {
        setMessage({ type: "error", text: data.error || "Ошибка при сохранении" });
      }
    } catch (error) {
      console.error("Error saving schedule:", error);
      setMessage({ type: "error", text: "Ошибка при сохранении расписания" });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <div className="w-8 h-8 border-2 border-neon-cyan border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Описание */}
      <div className="glass rounded-xl p-4 border-l-4 border-neon-cyan">
        <p className="text-text-secondary text-sm">
          Здесь вы можете настроить расписание физической культуры. Это расписание будет
          отображаться для всех групп в отдельном блоке на странице расписания.
        </p>
      </div>

      {/* Список записей */}
      <div className="space-y-3">
        {items.map((item, index) => (
          <div
            key={index}
            className="glass rounded-xl p-4 flex flex-wrap items-center gap-4"
          >
            <GripVertical className="w-5 h-5 text-text-muted cursor-grab" />

            {/* День недели */}
            <div className="flex-1 min-w-[180px]">
              <label className="block text-xs text-text-muted mb-1">День недели</label>
              <select
                value={item.dayOfWeek}
                onChange={(e) => handleItemChange(index, "dayOfWeek", e.target.value)}
                className="w-full px-3 py-2 bg-dark-100 border border-glass-border rounded-lg text-text-primary focus:outline-none focus:border-neon-cyan/50"
              >
                {DAYS_OPTIONS.map((day) => (
                  <option key={day} value={day}>
                    {day}
                  </option>
                ))}
              </select>
            </div>

            {/* Время начала */}
            <div className="w-32">
              <label className="block text-xs text-text-muted mb-1">Начало</label>
              <input
                type="time"
                value={item.timeStart}
                onChange={(e) => handleItemChange(index, "timeStart", e.target.value)}
                className="w-full px-3 py-2 bg-dark-100 border border-glass-border rounded-lg text-text-primary focus:outline-none focus:border-neon-cyan/50"
              />
            </div>

            {/* Время окончания */}
            <div className="w-32">
              <label className="block text-xs text-text-muted mb-1">Окончание</label>
              <input
                type="time"
                value={item.timeEnd}
                onChange={(e) => handleItemChange(index, "timeEnd", e.target.value)}
                className="w-full px-3 py-2 bg-dark-100 border border-glass-border rounded-lg text-text-primary focus:outline-none focus:border-neon-cyan/50"
              />
            </div>

            {/* Кнопка удаления */}
            <button
              onClick={() => handleRemoveItem(index)}
              className="p-2 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-colors"
              title="Удалить"
            >
              <Trash2 className="w-5 h-5" />
            </button>
          </div>
        ))}
      </div>

      {/* Кнопка добавления */}
      <button
        onClick={handleAddItem}
        className="w-full py-3 border-2 border-dashed border-glass-border rounded-xl text-text-muted hover:text-neon-cyan hover:border-neon-cyan/50 transition-colors flex items-center justify-center gap-2"
      >
        <Plus className="w-5 h-5" />
        Добавить день
      </button>

      {/* Сообщение */}
      {message && (
        <div
          className={`p-4 rounded-xl ${
            message.type === "success"
              ? "bg-green-500/10 text-green-400 border border-green-500/30"
              : "bg-red-500/10 text-red-400 border border-red-500/30"
          }`}
        >
          {message.text}
        </div>
      )}

      {/* Кнопка сохранения */}
      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={isSaving}>
          <Save className="w-4 h-4" />
          {isSaving ? "Сохранение..." : "Сохранить расписание"}
        </Button>
      </div>

      {/* Превью */}
      <div className="glass rounded-xl p-6">
        <h4 className="text-sm font-medium text-text-muted mb-4">Предпросмотр блока:</h4>
        <div className="bg-gradient-to-r from-neon-cyan/10 to-neon-purple/10 rounded-xl p-6 border border-neon-cyan/20">
          <h3 className="text-lg font-semibold text-text-primary mb-4 flex items-center gap-2">
            🏃 Расписание физической культуры
          </h3>
          <div className="space-y-2">
            {items.map((item, index) => (
              <div key={index} className="flex items-center gap-4 text-text-secondary">
                <span className="font-medium text-neon-cyan w-36">{item.dayOfWeek}</span>
                <span>
                  {item.timeStart}—{item.timeEnd}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
