import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

/**
 * GET /api/groups
 * Получение списка групп, у которых есть расписание в активной версии
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

    // Получаем только группы, у которых есть расписание в активной версии
    const groups = await prisma.group.findMany({
      where: {
        schedules: {
          some: {
            versionId: activeVersion.id,
          },
        },
      },
      orderBy: { name: "asc" },
      select: {
        id: true,
        name: true,
        _count: {
          select: {
            schedules: {
              where: {
                versionId: activeVersion.id,
              },
            },
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: groups.map((group) => ({
        id: group.id,
        name: group.name,
        schedulesCount: group._count.schedules,
      })),
    });
  } catch (error) {
    console.error("Ошибка при получении списка групп:", error);

    return NextResponse.json(
      { success: false, error: "Ошибка сервера" },
      { status: 500 }
    );
  }
}
