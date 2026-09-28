"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ChevronDown, Search, ArrowLeft, GraduationCap } from "lucide-react";
import { ThemeSwitcher, PushSubscribe } from "@/components/ui";
import { Button } from "@/components/ui";
import { Footer } from "@/components/layout";
import { PhysicalEducationBlock } from "@/components/schedule";

interface ScheduleItem {
  id: string;
  dayOfWeek: string;
  pairNumber: number;
  timeStart: string;
  timeEnd: string;
  subject: string | null;
  teacher: string | null;
  room: string | null;
}

interface ScheduleData {
  groupId: string;
  groupName: string;
  versionId?: string;
  uploadedAt?: string;
  schedule: ScheduleItem[];
}

interface Group {
  id: string;
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

export default function DashboardPage() {
  const [groups, setGroups] = useState<Group[]>([]);
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
  const [selectedGroupName, setSelectedGroupName] = useState<string>("");
  const [scheduleData, setScheduleData] = useState<ScheduleData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isGroupsOpen, setIsGroupsOpen] = useState(false);
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

  // Load groups
  useEffect(() => {
    loadGroups();
    const days = ["Вс", "Пн", "Вт", "Ср", "Чт", "Пт", "Сб"];
    setCurrentDay(days[new Date().getDay()]);
  }, []);

  // Load saved group
  useEffect(() => {
    const savedGroupId = localStorage.getItem("selectedGroupId");
    const savedGroupName = localStorage.getItem("selectedGroupName");
    if (savedGroupId && savedGroupName) {
      setSelectedGroupId(savedGroupId);
      setSelectedGroupName(savedGroupName);
    }
  }, []);

  // Load schedule when group selected
  useEffect(() => {
    if (selectedGroupId) {
      loadSchedule(selectedGroupId);
    }
  }, [selectedGroupId]);

  const loadGroups = async () => {
    try {
      const response = await fetch("/api/groups");
      const data = await response.json();
      if (data.success) {
        setGroups(data.data);
      }
    } catch (error) {
      console.error("Error loading groups:", error);
    }
  };

  const loadSchedule = async (groupId: string) => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/schedule?groupId=${groupId}`);
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

  const handleGroupSelect = (group: Group) => {
    setSelectedGroupId(group.id);
    setSelectedGroupName(group.name);
    setIsGroupsOpen(false);
    setSearchTerm("");
    localStorage.setItem("selectedGroupId", group.id);
    localStorage.setItem("selectedGroupName", group.name);
  };

  const filteredGroups = groups.filter((g) =>
    g.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getScheduleForDay = (day: string): ScheduleItem[] => {
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
          {/* Group selector */}
          <div className="mb-8">
            <label className="block text-sm font-medium text-text-secondary mb-2">
              Выберите группу
            </label>
            <div className="flex flex-col sm:flex-row gap-4 items-start">
              <div className="relative max-w-md flex-1 w-full">
                <button
                  onClick={() => setIsGroupsOpen(!isGroupsOpen)}
                  className="w-full flex items-center justify-between px-4 py-3 glass rounded-xl hover:border-neon-cyan/30 transition-all duration-300 text-left"
                >
                  <span className={selectedGroupName ? "text-text-primary" : "text-text-muted"}>
                    {selectedGroupName || "Выберите группу..."}
                  </span>
                  <ChevronDown
                    className={`w-5 h-5 text-text-muted transition-transform duration-300 ${
                      isGroupsOpen ? "rotate-180" : ""
                    }`}
                  />
                </button>

                {isGroupsOpen && (
                  <>
                    <div
                      className="fixed inset-0 z-10"
                      onClick={() => setIsGroupsOpen(false)}
                    />
                    <div className="absolute top-full left-0 right-0 mt-2 rounded-xl overflow-hidden z-20 max-h-80 border border-glass-border backdrop-blur-xl" style={{ background: theme === 'dark' ? 'rgba(15, 15, 15, 0.95)' : 'rgba(255, 255, 255, 0.95)' }}>
                      <div className="p-3 border-b border-glass-border">
                        <div className="relative">
                          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                          <input
                            type="text"
                            placeholder="Поиск группы..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 bg-dark-100 border border-glass-border rounded-lg text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-neon-cyan/50"
                            autoFocus
                          />
                        </div>
                      </div>
                      <div className="max-h-60 overflow-y-auto">
                        {filteredGroups.length === 0 ? (
                          <div className="p-4 text-center text-text-muted text-sm">
                            Группы не найдены
                          </div>
                        ) : (
                          filteredGroups.map((group) => (
                            <button
                              key={group.id}
                              onClick={() => handleGroupSelect(group)}
                              className={`w-full px-4 py-3 text-left hover:bg-white/5 transition-colors ${
                                selectedGroupId === group.id
                                  ? "text-neon-cyan bg-neon-cyan/5"
                                  : "text-text-primary"
                              }`}
                            >
                              {group.name}
                            </button>
                          ))
                        )}
                      </div>
                    </div>
                  </>
                )}
              </div>
              
              {/* Push уведомления */}
              <PushSubscribe groupId={selectedGroupId} groupName={selectedGroupName || undefined} />
            </div>
          </div>

          {/* Schedule */}
          {selectedGroupId && (
            <div className="animate-fade-in">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold tracking-tight text-text-primary">
                  Расписание: {selectedGroupName}
                </h2>
                {scheduleData?.uploadedAt && (
                  <span className="text-sm text-text-muted">
                    Обновлено: {new Date(scheduleData.uploadedAt).toLocaleDateString("ru-RU")}
                  </span>
                )}
              </div>

              {isLoading ? (
                <div className="flex justify-center py-20">
                  <div className="w-8 h-8 border-2 border-neon-cyan border-t-transparent rounded-full animate-spin" />
                </div>
              ) : scheduleData && scheduleData.schedule.length > 0 ? (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {DAYS.map(({ short, full }) => {
                      const daySchedule = getScheduleForDay(short);
                      const isToday = currentDay === short;

                      return (
                        <DayCard
                          key={short}
                          day={full}
                          schedule={daySchedule}
                          isToday={isToday}
                        />
                      );
                    })}
                  </div>
                  
                  {/* Блок расписания физкультуры */}
                  <PhysicalEducationBlock />
                  
                  {/* Кнопка для преподавателей */}
                  <div className="mt-8 flex justify-center">
                    <Link href="/teacher">
                      <Button variant="outline" size="lg" className="gap-2">
                        <GraduationCap className="w-5 h-5" />
                        Расписание для преподавателей
                      </Button>
                    </Link>
                  </div>
                </>
              ) : (
                <div className="glass rounded-2xl p-12 text-center">
                  <p className="text-text-muted">Расписание для этой группы не найдено</p>
                </div>
              )}
            </div>
          )}

          {/* Empty state */}
          {!selectedGroupId && (
            <div className="glass rounded-2xl p-12 text-center animate-fade-in">
              <div className="text-5xl mb-4">📚</div>
              <h3 className="text-xl font-semibold text-text-primary mb-2">
                Выберите группу
              </h3>
              <p className="text-text-secondary">
                Выберите вашу группу из списка выше, чтобы увидеть расписание
              </p>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}

interface DayCardProps {
  day: string;
  schedule: ScheduleItem[];
  isToday: boolean;
}

function DayCard({ day, schedule, isToday }: DayCardProps) {
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
        isToday ? "border-neon-cyan/50 shadow-neon-cyan/20" : ""
      }`}
    >
      <div
        className={`px-4 py-3 border-b border-glass-border flex items-center justify-between ${
          isToday ? "bg-neon-cyan/10" : ""
        }`}
      >
        <h3 className={`font-semibold ${isToday ? "text-neon-cyan" : "text-text-primary"}`}>
          {day}
        </h3>
        {isToday && (
          <span className="text-xs font-medium text-neon-cyan px-2 py-0.5 bg-neon-cyan/10 rounded-full">
            Сегодня
          </span>
        )}
      </div>
      <div className="divide-y divide-glass-border">
        {schedule.map((item) => {
          const isPhysicalEducation = item.subject?.toLowerCase().includes("физическая культура");
          
          return (
            <div key={item.id} className="p-4 hover:bg-white/[0.02] transition-colors">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-20 text-center">
                  <div className="text-lg font-bold text-neon-cyan">{item.pairNumber}</div>
                  <div className="text-xs text-text-muted">
                    {item.timeStart} - {item.timeEnd}
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-text-primary text-sm leading-snug mb-1">
                    {item.subject || "—"}
                  </p>
                  {isPhysicalEducation && (
                    <p className="text-xs text-neon-cyan italic mb-1">
                      ↓ Смотреть расписание физкультуры ниже
                    </p>
                  )}
                  {item.teacher && !isPhysicalEducation && (
                    <p className="text-xs text-text-secondary mb-1">{item.teacher}</p>
                  )}
                  {item.room && !isPhysicalEducation && (
                    <span
                      className={`inline-block text-xs px-2 py-0.5 rounded-full ${
                        item.room.toLowerCase() === "zoom"
                          ? "bg-neon-purple/20 text-neon-purple"
                          : "bg-white/5 text-text-muted"
                      }`}
                    >
                      {item.room.toLowerCase() === "zoom" ? "🌐 Онлайн" : `📍 ${item.room}`}
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
