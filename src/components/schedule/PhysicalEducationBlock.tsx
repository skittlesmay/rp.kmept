"use client";

import { useState, useEffect } from "react";
import { Dumbbell, Timer, Calendar } from "lucide-react";

interface ScheduleItem {
  id: string;
  dayOfWeek: string;
  timeStart: string;
  timeEnd: string;
  sortOrder: number;
}

export function PhysicalEducationBlock() {
  const [schedule, setSchedule] = useState<ScheduleItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadSchedule();
  }, []);

  const loadSchedule = async () => {
    try {
      const response = await fetch("/api/physical-education");
      const data = await response.json();
      if (data.success) {
        setSchedule(data.data);
      }
    } catch (error) {
      console.error("Error loading physical education schedule:", error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return null; // Не показываем лоадер, чтобы не отвлекать
  }

  if (schedule.length === 0) {
    return null; // Не показываем блок, если расписание не настроено
  }

  return (
    <div className="mt-8 glass rounded-2xl overflow-hidden">
      <div className="bg-gradient-to-r from-neon-cyan/10 to-neon-purple/10 p-6 border-b border-glass-border">
        <h3 className="text-xl font-semibold text-text-primary flex items-center gap-3">
          <Dumbbell className="w-6 h-6 text-neon-cyan" />
          Расписание физической культуры
        </h3>
        <p className="text-sm text-text-muted mt-1">
          Общее расписание для всех групп
        </p>
      </div>
      
      <div className="p-6">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {schedule.map((item) => (
            <div
              key={item.id}
              className="flex items-center gap-4 p-4 rounded-xl bg-white/[0.02] border border-glass-border hover:border-neon-cyan/30 transition-colors"
            >
              <div className="flex-shrink-0 w-12 h-12 rounded-full bg-neon-cyan/10 flex items-center justify-center">
                <Timer className="w-5 h-5 text-neon-cyan" />
              </div>
              <div>
                <div className="font-semibold text-neon-cyan">
                  {item.dayOfWeek}
                </div>
                <div className="text-text-secondary">
                  {item.timeStart}—{item.timeEnd}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
