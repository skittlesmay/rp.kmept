import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

/**
 * GET /api/teachers
 * Получение списка уникальных преподавателей из активной версии расписания
 */
export async function GET() {
  try {
    // Находим активную версию расписания
    const activeVersion = await prisma.scheduleVersion.findFirst({
      where: { isActive: true },
      select: { id: true },
    });

    // Если нет активной версии - возвращаем пустой список
    if (!activeVersion) {
      return NextResponse.json({
        success: true,
        data: [],
      });
    }

    // Получаем все записи расписания с преподавателями
    const schedules = await prisma.schedule.findMany({
      where: {
        versionId: activeVersion.id,
        teacher: {
          not: null,
        },
      },
      select: {
        teacher: true,
        subject: true,
      },
    });

    // Извлекаем уникальных преподавателей
    const teachersSet = new Set<string>();

    for (const schedule of schedules) {
      // Преподаватель может быть в поле teacher
      if (schedule.teacher) {
        // Может быть несколько преподавателей через запятую
        const teachers = schedule.teacher.split(",").map((t) => t.trim());
        teachers.forEach((t) => {
          if (t && isValidTeacherName(t)) {
            teachersSet.add(t);
          }
        });
      }

      // Также извлекаем преподавателей из поля subject (формат: "Предмет (Иванов И.И.)")
      if (schedule.subject) {
        const extractedTeachers = extractTeachersFromSubject(schedule.subject);
        extractedTeachers.forEach((t) => teachersSet.add(t));
      }
    }

    // Сортируем по алфавиту
    const sortedTeachers = Array.from(teachersSet).sort((a, b) =>
      a.localeCompare(b, "ru")
    );

    return NextResponse.json({
      success: true,
      data: sortedTeachers.map((name) => ({ name })),
    });
  } catch (error) {
    console.error("Ошибка при получении списка преподавателей:", error);

    return NextResponse.json(
      { success: false, error: "Ошибка сервера" },
      { status: 500 }
    );
  }
}

/**
 * Проверяет, является ли строка валидным ФИО преподавателя
 * Формат: "Иванов И.И." или "Иванов И. И."
 */
function isValidTeacherName(name: string): boolean {
  // ФИО должно содержать фамилию и инициалы
  const pattern = /^[А-ЯЁ][а-яё]+\s+[А-ЯЁ]\.\s?[А-ЯЁ]\.?$/;
  return pattern.test(name.trim());
}

/**
 * Извлекает ФИО преподавателей из строки предмета
 * Примеры:
 * - "Математика (Иванов И.И.)" -> ["Иванов И.И."]
 * - "1. Физика (Петров П.П.) / 2. Химия (Сидоров С.С.)" -> ["Петров П.П.", "Сидоров С.С."]
 */
function extractTeachersFromSubject(subject: string): string[] {
  const teachers: string[] = [];
  
  // Ищем все вхождения ФИО в скобках
  const pattern = /\(([А-ЯЁ][а-яё]+\s+[А-ЯЁ]\.\s?[А-ЯЁ]\.?)\)/g;
  let match;
  
  while ((match = pattern.exec(subject)) !== null) {
    teachers.push(match[1].trim());
  }
  
  return teachers;
}
