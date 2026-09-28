"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ChevronDown, Search, ArrowLeft, Users } from "lucide-react";
import { ThemeSwitcher } from "@/components/ui";
import { Button } from "@/components/ui";
import { Footer } from "@/components/layout";

interface TeacherScheduleItem {
  id: string;
  dayOfWeek: string;
  pairNumber: number;
  timeStart: string;
  timeEnd: string;
  subject: string | null;
  room: string | null;
  groupName: string;
}

interface TeacherScheduleData {
  teacherName: string;
  versionId?: string;
  uploadedAt?: string;
  schedule: TeacherScheduleItem[];
}

interface Teacher {
  name: string;
}

const DAYS = [
  { short: "Пн", full: "Понедельник" },
  { short: "Вт", full: "Вторник" },
  { short: "Ср", full: "Среда" },
  { short: "Чт", full: "Четверг" },
  { short: "Пт", full: "Пятница" },
  { short: "Сб", full: "Суббота" },
];

export default function TeacherPage() {
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [selectedTeacher, setSelectedTeacher] = useState<string | null>(null);
  const [scheduleData, setScheduleData] = useState<TeacherScheduleData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isTeachersOpen, setIsTeachersOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentDay, setCurrentDay] = useState<string>("");
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

  // Load teachers
  useEffect(() => {
    loadTeachers();
    const days = ["Вс", "Пн", "Вт", "Ср", "Чт", "Пт", "Сб"];
    setCurrentDay(days[new Date().getDay()]);
  }, []);

  // Load saved teacher
  useEffect(() => {
    const savedTeacher = localStorage.getItem("selectedTeacher");
    if (savedTeacher) {
      setSelectedTeacher(savedTeacher);
    }
  }, []);

  // Load schedule when teacher selected
  useEffect(() => {
    if (selectedTeacher) {
      loadSchedule(selectedTeacher);
    }
  }, [selectedTeacher]);

  const loadTeachers = async () => {
    try {
      const response = await fetch("/api/teachers");
      const data = await response.json();
      if (data.success) {
        setTeachers(data.data);
      }
    } catch (error) {
      console.error("Error loading teachers:", error);
    }
  };

  const loadSchedule = async (teacherName: string) => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/teacher-schedule?teacherName=${encodeURIComponent(teacherName)}`);
      const data = await response.json();
      if (data.success) {
        setScheduleData(data.data);
      }
    } catch (error) {
      console.error("Error loading schedule:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleTeacherSelect = (teacher: Teacher) => {
    setSelectedTeacher(teacher.name);
    setIsTeachersOpen(false);
    setSearchTerm("");
    localStorage.setItem("selectedTeacher", teacher.name);
  };

  const filteredTeachers = teachers.filter((t) =>
    t.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getScheduleForDay = (day: string): TeacherScheduleItem[] => {
    if (!scheduleData) return [];
    return scheduleData.schedule
      .filter((item) => item.dayOfWeek === day)
      .sort((a, b) => a.pairNumber - b.pairNumber);
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 border-b border-glass-border backdrop-blur-xl" style={{ background: theme === 'dark' ? 'rgba(10, 10, 10, 0.85)' : 'rgba(255, 255, 255, 0.85)' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/" className="flex items-center gap-2 sm:gap-3 group">
              <img
                src={theme === "dark" ? "/stylesKmept/blackLogo.jpg" : "/stylesKmept/whiteLogo.png"}
                alt="КМЭПТ"
                className="h-7 w-auto rounded object-contain"
              />
              <span className="hidden sm:inline text-lg font-semibold tracking-tight text-text-primary group-hover:text-neon-cyan transition-colors duration-300">
                КМЭПТ
              </span>
            </Link>

            <div className="flex items-center gap-2 sm:gap-4">
              <ThemeSwitcher />
              <Link href="/dashboard">
                <Button variant="ghost" size="sm" className="px-2 sm:px-3">
                  <Users className="w-4 h-4" />
                  <span className="hidden sm:inline">Для студентов</span>
                </Button>
              </Link>
              <Link href="/">
                <Button variant="ghost" size="sm" className="px-2 sm:px-3">
                  <ArrowLeft className="w-4 h-4" />
                  <span className="hidden sm:inline">На главную</span>
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="flex-1 pt-24 pb-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Teacher selector */}
          <div className="mb-8">
            <label className="block text-sm font-medium text-text-secondary mb-2">
              Выберите преподавателя
            </label>
            <div className="relative max-w-md">
              <button
                onClick={() => setIsTeachersOpen(!isTeachersOpen)}
                className="w-full flex items-center justify-between px-4 py-3 glass rounded-xl hover:border-neon-purple/30 transition-all duration-300 text-left"
              >
                <span className={selectedTeacher ? "text-text-primary" : "text-text-muted"}>
                  {selectedTeacher || "Выберите преподавателя..."}
                </span>
                <ChevronDown
                  className={`w-5 h-5 text-text-muted transition-transform duration-300 ${
                    isTeachersOpen ? "rotate-180" : ""
                  }`}
                />
              </button>

              {isTeachersOpen && (
                <>
                  <div
                    className="fixed inset-0 z-10"
                    onClick={() => setIsTeachersOpen(false)}
                  />
                  <div className="absolute top-full left-0 right-0 mt-2 rounded-xl overflow-hidden z-20 max-h-80 border border-glass-border backdrop-blur-xl" style={{ background: theme === 'dark' ? 'rgba(15, 15, 15, 0.95)' : 'rgba(255, 255, 255, 0.95)' }}>
                    <div className="p-3 border-b border-glass-border">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                        <input
                          type="text"
                          placeholder="Поиск преподавателя..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="w-full pl-10 pr-4 py-2 bg-dark-100 border border-glass-border rounded-lg text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-neon-purple/50"
                          autoFocus
                        />
                      </div>
                    </div>
                    <div className="max-h-60 overflow-y-auto">
                      {filteredTeachers.length === 0 ? (
                        <div className="p-4 text-center text-text-muted text-sm">
                          Преподаватели не найдены
                        </div>
                      ) : (
                        filteredTeachers.map((teacher) => (
                          <button
                            key={teacher.name}
                            onClick={() => handleTeacherSelect(teacher)}
                            className={`w-full px-4 py-3 text-left hover:bg-white/5 transition-colors ${
                              selectedTeacher === teacher.name
                                ? "text-neon-purple bg-neon-purple/5"
                                : "text-text-primary"
                            }`}
                          >
                            {teacher.name}
                          </button>
                        ))
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Schedule */}
          {selectedTeacher && (
            <div className="animate-fade-in">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold tracking-tight text-text-primary">
                  Расписание: {selectedTeacher}
                </h2>
                {scheduleData?.uploadedAt && (
                  <span className="text-sm text-text-muted">
                    Обновлено: {new Date(scheduleData.uploadedAt).toLocaleDateString("ru-RU")}
                  </span>
                )}
              </div>

              {isLoading ? (
                <div className="flex justify-center py-20">
                  <div className="w-8 h-8 border-2 border-neon-purple border-t-transparent rounded-full animate-spin" />
                </div>
              ) : scheduleData && scheduleData.schedule.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {DAYS.map(({ short, full }) => {
                    const daySchedule = getScheduleForDay(short);
                    const isToday = currentDay === short;

                    return (
                      <TeacherDayCard
                        key={short}
                        day={full}
                        schedule={daySchedule}
                        isToday={isToday}
                      />
                    );
                  })}
                </div>
              ) : (
                <div className="glass rounded-2xl p-12 text-center">
                  <p className="text-text-muted">Расписание для этого преподавателя не найдено</p>
                </div>
              )}
            </div>
          )}

          {/* Empty state */}
          {!selectedTeacher && (
            <div className="glass rounded-2xl p-12 text-center animate-fade-in">
              <div className="text-5xl mb-4">👨‍🏫</div>
              <h3 className="text-xl font-semibold text-text-primary mb-2">
                Выберите преподавателя
              </h3>
              <p className="text-text-secondary">
                Выберите преподавателя из списка выше, чтобы увидеть его расписание
              </p>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}

interface TeacherDayCardProps {
  day: string;
  schedule: TeacherScheduleItem[];
  isToday: boolean;
}

function TeacherDayCard({ day, schedule, isToday }: TeacherDayCardProps) {
  if (schedule.length === 0) {
    return (
      <div className="glass rounded-2xl overflow-hidden opacity-50">
        <div className="px-4 py-3 border-b border-glass-border">
          <h3 className="font-semibold text-text-primary">{day}</h3>
        </div>
        <div className="p-4 text-center text-text-muted text-sm">
          Нет занятий
        </div>
      </div>
    );
  }

  return (
    <div
      className={`glass rounded-2xl overflow-hidden transition-all duration-300 ${
        isToday ? "border-neon-purple/50 shadow-neon-purple/20" : ""
      }`}
    >
      <div
        className={`px-4 py-3 border-b border-glass-border flex items-center justify-between ${
          isToday ? "bg-neon-purple/10" : ""
        }`}
      >
        <h3 className={`font-semibold ${isToday ? "text-neon-purple" : "text-text-primary"}`}>
          {day}
        </h3>
        {isToday && (
          <span className="text-xs font-medium text-neon-purple px-2 py-0.5 bg-neon-purple/10 rounded-full">
            Сегодня
          </span>
        )}
      </div>
      <div className="divide-y divide-glass-border">
        {schedule.map((item) => (
          <div key={item.id} className="p-4 hover:bg-white/[0.02] transition-colors">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-20 text-center">
                <div className="text-lg font-bold text-neon-purple">{item.pairNumber}</div>
                <div className="text-xs text-text-muted">
                  {item.timeStart} - {item.timeEnd}
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-text-primary text-sm leading-snug mb-1">
                  {item.subject || "—"}
                </p>
                {/* Группа */}
                <p className="text-xs text-neon-cyan mb-1">
                  👥 {item.groupName}
                </p>
                {/* Аудитория */}
                {item.room && (
                  <span
                    className={`inline-block text-xs px-2 py-0.5 rounded-full ${
                      item.room.toLowerCase() === "zoom" || item.room.toLowerCase().includes("онлайн")
                        ? "bg-neon-purple/20 text-neon-purple"
                        : "bg-white/5 text-text-muted"
                    }`}
                  >
                    {item.room.toLowerCase() === "zoom" || item.room.toLowerCase().includes("онлайн") 
                      ? "🌐 Онлайн" 
                      : `📍 ${item.room}`}
                  </span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
