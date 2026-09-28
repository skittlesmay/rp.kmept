import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

/**
 * GET /api/teacher-schedule
 * Получение расписания для преподавателя
 * Query params:
 * - teacherName: ФИО преподавателя
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const teacherName = searchParams.get("teacherName");

    if (!teacherName) {
      return NextResponse.json(
        { success: false, error: "Необходимо указать teacherName" },
        { status: 400 }
      );
    }

    // Находим активную версию расписания
    const activeVersion = await prisma.scheduleVersion.findFirst({
      where: { isActive: true },
    });

    if (!activeVersion) {
      return NextResponse.json({
        success: true,
        data: {
          teacherName,
          schedule: [],
          message: "Расписание ещё не загружено",
        },
      });
    }

    // Получаем все записи расписания где есть этот преподаватель
    // Ищем в поле teacher или в поле subject (в скобках)
    const schedules = await prisma.schedule.findMany({
      where: {
        versionId: activeVersion.id,
        OR: [
          {
            teacher: {
              contains: teacherName,
            },
          },
          {
            subject: {
              contains: teacherName,
            },
          },
        ],
      },
      include: {
        group: {
          select: {
            name: true,
          },
        },
      },
      orderBy: [
        { dayOfWeek: "asc" },
        { pairNumber: "asc" },
      ],
    });

    // Сортируем по дням недели правильно
    const dayOrder: Record<string, number> = {
      "Пн": 1,
      "Вт": 2,
      "Ср": 3,
      "Чт": 4,
      "Пт": 5,
      "Сб": 6,
    };

    const sortedSchedule = schedules.sort((a, b) => {
      const dayDiff = (dayOrder[a.dayOfWeek] || 7) - (dayOrder[b.dayOfWeek] || 7);
      if (dayDiff !== 0) return dayDiff;
      return a.pairNumber - b.pairNumber;
    });

    // Фильтруем только те записи, где преподаватель действительно участвует
    // (для случаев подгрупп нужно проверить точное совпадение)
    const filteredSchedule = sortedSchedule.filter((item) => {
      // Проверяем поле teacher
      if (item.teacher) {
        const teachers = item.teacher.split(",").map((t) => t.trim());
        if (teachers.some((t) => t === teacherName)) {
          return true;
        }
      }
      
      // Проверяем поле subject (преподаватель в скобках)
      if (item.subject) {
        const pattern = new RegExp(`\\(${escapeRegex(teacherName)}\\)`, "i");
        if (pattern.test(item.subject)) {
          return true;
        }
      }
      
      return false;
    });

    return NextResponse.json({
      success: true,
      data: {
        teacherName,
        versionId: activeVersion.id,
        uploadedAt: activeVersion.uploadedAt,
        schedule: filteredSchedule.map((item) => ({
          id: item.id,
          dayOfWeek: item.dayOfWeek,
          pairNumber: item.pairNumber,
          timeStart: item.timeStart,
          timeEnd: item.timeEnd,
          subject: cleanSubjectForTeacher(item.subject, teacherName),
          room: item.room,
          groupName: item.group.name,
        })),
      },
    });
  } catch (error) {
    console.error("Ошибка при получении расписания преподавателя:", error);

    return NextResponse.json(
      { success: false, error: "Ошибка сервера" },
      { status: 500 }
    );
  }
}

/**
 * Экранирует специальные символы для использования в RegExp
 */
function escapeRegex(string: string): string {
  return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Очищает название предмета для отображения преподавателю
 * Убирает ФИО преподавателя из скобок, оставляя только название предмета
 * Для подгрупп оставляет только релевантную часть
 */
function cleanSubjectForTeacher(subject: string | null, teacherName: string): string | null {
  if (!subject) return null;
  
  // Если есть подгруппы (формат: "1. Предмет (Препод) / 2. Предмет (Препод)")
  if (subject.includes(" / ")) {
    const parts = subject.split(" / ");
    const relevantParts = parts.filter((part) => part.includes(teacherName));
    
    if (relevantParts.length > 0) {
      // Убираем ФИО преподавателя из скобок
      return relevantParts
        .map((part) => part.replace(/\s*\([А-ЯЁ][а-яё]+\s+[А-ЯЁ]\.\s?[А-ЯЁ]\.?\)/g, "").trim())
        .join(" / ");
    }
  }
  
  // Убираем ФИО преподавателя из скобок
  return subject.replace(/\s*\([А-ЯЁ][а-яё]+\s+[А-ЯЁ]\.\s?[А-ЯЁ]\.?\)/g, "").trim();
}
