"use client";

import { cn } from "@/lib/utils";

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

interface ScheduleTableProps {
  schedule: ScheduleItem[];
  currentDay?: string;
  currentPair?: number | null;
}

const DAYS = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб"];
const PAIRS = [1, 2, 3, 4, 5, 6];

const PAIR_TIMES: Record<number, { start: string; end: string }> = {
  1: { start: "8:30", end: "10:00" },
  2: { start: "10:10", end: "11:40" },
  3: { start: "12:10", end: "13:40" },
  4: { start: "13:50", end: "15:20" },
  5: { start: "15:30", end: "17:00" },
  6: { start: "17:10", end: "18:40" },
};

export function ScheduleTable({ schedule, currentDay, currentPair }: ScheduleTableProps) {
  // Группируем расписание по дням и парам
  const scheduleMap = new Map<string, ScheduleItem>();
  
  schedule.forEach((item) => {
    const key = `${item.dayOfWeek}-${item.pairNumber}`;
    scheduleMap.set(key, item);
  });

  const getScheduleItem = (day: string, pair: number): ScheduleItem | undefined => {
    return scheduleMap.get(`${day}-${pair}`);
  };

  return (
    <div className="overflow-x-auto">
      {/* Desktop версия */}
      <table className="hidden md:table w-full border-collapse">
        <thead>
          <tr>
            <th className="p-3 text-left text-sm font-semibold text-gray-600 bg-gray-50 border-b border-gray-200 w-20">
              Пара
            </th>
            {DAYS.map((day) => (
              <th
                key={day}
                className={cn(
                  "p-3 text-center text-sm font-semibold border-b border-gray-200",
                  currentDay === day
                    ? "bg-primary-100 text-primary-700"
                    : "bg-gray-50 text-gray-600"
                )}
              >
                {day}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {PAIRS.map((pair) => (
            <tr key={pair}>
              <td className="p-3 text-center border-b border-gray-100 bg-gray-50">
                <div className="font-semibold text-gray-700">{pair}</div>
                <div className="text-xs text-gray-500">
                  {PAIR_TIMES[pair].start} - {PAIR_TIMES[pair].end}
                </div>
              </td>
              {DAYS.map((day) => {
                const item = getScheduleItem(day, pair);
                const isCurrentCell = currentDay === day && currentPair === pair;
                
                return (
                  <td
                    key={`${day}-${pair}`}
                    className={cn(
                      "p-2 border-b border-gray-100 align-top min-w-[140px]",
                      isCurrentCell && "bg-primary-50 ring-2 ring-primary-500 ring-inset",
                      currentDay === day && !isCurrentCell && "bg-primary-50/30"
                    )}
                  >
                    {item ? (
                      <ScheduleCell item={item} isHighlighted={isCurrentCell} />
                    ) : (
                      <div className="h-16 flex items-center justify-center text-gray-300 text-sm">
                        —
                      </div>
                    )}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>

      {/* Mobile версия */}
      <div className="md:hidden space-y-4">
        {DAYS.map((day) => {
          const daySchedule = PAIRS.map((pair) => ({
            pair,
            item: getScheduleItem(day, pair),
          })).filter(({ item }) => item !== undefined);

          if (daySchedule.length === 0) return null;

          return (
            <div
              key={day}
              className={cn(
                "rounded-xl overflow-hidden border",
                currentDay === day
                  ? "border-primary-300 bg-primary-50"
                  : "border-gray-200 bg-white"
              )}
            >
              <div
                className={cn(
                  "px-4 py-2 font-semibold",
                  currentDay === day
                    ? "bg-primary-500 text-white"
                    : "bg-gray-100 text-gray-700"
                )}
              >
                {getDayFullName(day)}
                {currentDay === day && (
                  <span className="ml-2 text-sm font-normal opacity-80">
                    (сегодня)
                  </span>
                )}
              </div>
              <div className="divide-y divide-gray-100">
                {daySchedule.map(({ pair, item }) => (
                  <div
                    key={pair}
                    className={cn(
                      "p-3",
                      currentDay === day && currentPair === pair && "bg-primary-100"
                    )}
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 w-16 text-center">
                        <div className="font-bold text-primary-600">{pair} пара</div>
                        <div className="text-xs text-gray-500">
                          {PAIR_TIMES[pair].start} - {PAIR_TIMES[pair].end}
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <ScheduleCell item={item!} isHighlighted={currentDay === day && currentPair === pair} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

interface ScheduleCellProps {
  item: ScheduleItem;
  isHighlighted?: boolean;
}

function ScheduleCell({ item, isHighlighted }: ScheduleCellProps) {
  const isOnline = item.room?.toLowerCase() === "zoom";
  
  // Извлекаем название предмета без преподавателя
  const subjectName = extractSubjectName(item.subject || "");
  const teacherName = item.teacher || extractTeacherFromSubject(item.subject || "");

  return (
    <div className="space-y-1">
      <div
        className={cn(
          "font-medium text-sm leading-tight",
          isHighlighted ? "text-primary-700" : "text-gray-800"
        )}
      >
        {subjectName || item.subject}
      </div>
      {teacherName && (
        <div className="text-xs text-gray-500">
          👤 {teacherName}
        </div>
      )}
      {item.room && (
        <div
          className={cn(
            "inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full",
            isOnline
              ? "bg-blue-100 text-blue-700"
              : "bg-gray-100 text-gray-600"
          )}
        >
          {isOnline ? "🌐 Онлайн" : `📍 ${item.room}`}
        </div>
      )}
    </div>
  );
}

function getDayFullName(day: string): string {
  const names: Record<string, string> = {
    "Пн": "Понедельник",
    "Вт": "Вторник",
    "Ср": "Среда",
    "Чт": "Четверг",
    "Пт": "Пятница",
    "Сб": "Суббота",
  };
  return names[day] || day;
}

function extractSubjectName(subject: string): string {
  // Убираем ФИО преподавателя из названия предмета
  return subject.replace(/\s+[А-ЯЁ][а-яё]+\s+[А-ЯЁ]\.\s?[А-ЯЁ]\.?$/, "").trim();
}

function extractTeacherFromSubject(subject: string): string | null {
  const match = subject.match(/([А-ЯЁ][а-яё]+\s+[А-ЯЁ]\.\s?[А-ЯЁ]\.?)$/);
  return match ? match[1] : null;
}
