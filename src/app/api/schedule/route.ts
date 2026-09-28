import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

/**
 * GET /api/schedule
 * Получение расписания для группы
 * Query params:
 * - groupId: ID группы
 * - groupName: Название группы (альтернатива groupId)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const groupId = searchParams.get("groupId");
    const groupName = searchParams.get("groupName");

    if (!groupId && !groupName) {
      return NextResponse.json(
        { success: false, error: "Необходимо указать groupId или groupName" },
        { status: 400 }
      );
    }

    // Находим группу
    let group;
    if (groupId) {
      group = await prisma.group.findUnique({
        where: { id: groupId },
      });
    } else if (groupName) {
      group = await prisma.group.findUnique({
        where: { name: groupName },
      });
    }

    if (!group) {
      return NextResponse.json(
        { success: false, error: "Группа не найдена" },
        { status: 404 }
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
          groupId: group.id,
          groupName: group.name,
          schedule: [],
          message: "Расписание ещё не загружено",
        },
      });
    }

    // Получаем расписание группы
    const schedule = await prisma.schedule.findMany({
      where: {
        groupId: group.id,
        versionId: activeVersion.id,
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

    const sortedSchedule = schedule.sort((a, b) => {
      const dayDiff = (dayOrder[a.dayOfWeek] || 7) - (dayOrder[b.dayOfWeek] || 7);
      if (dayDiff !== 0) return dayDiff;
      return a.pairNumber - b.pairNumber;
    });

    return NextResponse.json({
      success: true,
      data: {
        groupId: group.id,
        groupName: group.name,
        versionId: activeVersion.id,
        uploadedAt: activeVersion.uploadedAt,
        schedule: sortedSchedule.map((item) => ({
          id: item.id,
          dayOfWeek: item.dayOfWeek,
          pairNumber: item.pairNumber,
          timeStart: item.timeStart,
          timeEnd: item.timeEnd,
          subject: item.subject,
          teacher: item.teacher,
          room: item.room,
        })),
      },
    });
  } catch (error) {
    console.error("Ошибка при получении расписания:", error);

    return NextResponse.json(
      { success: false, error: "Ошибка сервера" },
      { status: 500 }
    );
  }
}
