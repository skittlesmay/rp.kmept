// Типы для расписания
export interface ScheduleItem {
  id: string;
  dayOfWeek: string;
  pairNumber: number;
  timeStart: string;
  timeEnd: string;
  subject: string | null;
  teacher: string | null;
  room: string | null;
}

export interface GroupSchedule {
  groupId: string;
  groupName: string;
  schedule: ScheduleItem[];
}

// Типы для пользователей
export interface User {
  id: string;
  collegeId: string;
  name: string;
  groupId: string;
  groupName?: string;
  isSubscribed: boolean;
  vkId?: string | null;
}

export interface Admin {
  id: string;
  login: string;
  name: string;
}

// Типы для API ответов
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

// Типы для парсинга Excel
export interface ParsedScheduleRow {
  dayOfWeek: string;
  pairNumber: number;
  timeStart: string;
  timeEnd: string;
  subject: string | null;
  teacher: string | null;
  room: string | null;
}

export interface ParsedGroupSchedule {
  groupName: string;
  schedule: ParsedScheduleRow[];
}

// Типы для расписания преподавателей
export interface TeacherScheduleItem {
  id: string;
  dayOfWeek: string;
  pairNumber: number;
  timeStart: string;
  timeEnd: string;
  subject: string | null;
  room: string | null;
  groupName: string; // Название группы, у которой ведёт пару
}

export interface TeacherSchedule {
  teacherName: string;
  versionId?: string;
  uploadedAt?: string;
  schedule: TeacherScheduleItem[];
}

export interface Teacher {
  name: string;
}

// Дни недели
export const DAYS_OF_WEEK = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб"] as const;
export type DayOfWeek = (typeof DAYS_OF_WEEK)[number];

// Время пар
export const PAIR_TIMES: Record<number, { start: string; end: string }> = {
  1: { start: "8:30", end: "10:00" },
  2: { start: "10:10", end: "11:40" },
  3: { start: "12:10", end: "13:40" },
  4: { start: "13:50", end: "15:20" },
  5: { start: "15:30", end: "17:00" },
  6: { start: "17:10", end: "18:40" },
};
