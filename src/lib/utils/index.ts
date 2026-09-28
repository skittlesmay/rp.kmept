export { cn } from "./cn";

/**
 * Форматирование даты в русском формате
 */
export function formatDate(date: Date): string {
  return date.toLocaleDateString("ru-RU", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

/**
 * Форматирование времени
 */
export function formatTime(time: string): string {
  return time.replace("-", " – ");
}

/**
 * Получение текущего дня недели (Пн, Вт, ...)
 */
export function getCurrentDayOfWeek(): string {
  const days = ["Вс", "Пн", "Вт", "Ср", "Чт", "Пт", "Сб"];
  return days[new Date().getDay()];
}

/**
 * Проверка является ли сегодня указанным днём
 */
export function isToday(dayOfWeek: string): boolean {
  return getCurrentDayOfWeek() === dayOfWeek;
}

/**
 * Получение номера текущей пары по времени
 */
export function getCurrentPairNumber(): number | null {
  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();

  const pairTimes = [
    { pair: 1, start: 8 * 60 + 30, end: 10 * 60 },
    { pair: 2, start: 10 * 60 + 10, end: 11 * 60 + 40 },
    { pair: 3, start: 12 * 60 + 10, end: 13 * 60 + 40 },
    { pair: 4, start: 13 * 60 + 50, end: 15 * 60 + 20 },
    { pair: 5, start: 15 * 60 + 30, end: 17 * 60 },
    { pair: 6, start: 17 * 60 + 10, end: 18 * 60 + 40 },
  ];

  for (const { pair, start, end } of pairTimes) {
    if (currentMinutes >= start && currentMinutes <= end) {
      return pair;
    }
  }

  return null;
}
