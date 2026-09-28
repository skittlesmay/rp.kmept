import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getAdminSession } from "@/lib/auth";

/**
 * GET /api/admin/stats
 * Получение статистики системы
 */
export async function GET() {
  try {
    // Проверка авторизации администратора
    const admin = await getAdminSession();
    if (!admin) {
      return NextResponse.json(
        { success: false, error: "Не авторизован" },
        { status: 401 }
      );
    }
    // Сначала получаем активную версию
    const activeVersion = await prisma.scheduleVersion.findFirst({
      where: { isActive: true },
    });

    // Собираем статистику
    const versionsCount = await prisma.scheduleVersion.count();

    // Получаем количество групп и записей расписания из активной версии
    let activeGroupsCount = 0;
    let activeSchedulesCount = 0;
    
    if (activeVersion) {
      // Считаем уникальные группы в активной версии
      const groupsInActiveVersion = await prisma.schedule.groupBy({
        by: ['groupId'],
        where: { versionId: activeVersion.id },
      });
      activeGroupsCount = groupsInActiveVersion.length;

      activeSchedulesCount = await prisma.schedule.count({
        where: { versionId: activeVersion.id },
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        groups: {
          total: activeGroupsCount,
        },
        schedule: {
          versionsCount,
          activeVersion: activeVersion
            ? {
                id: activeVersion.id,
                fileName: activeVersion.fileName,
                uploadedAt: activeVersion.uploadedAt,
                schedulesCount: activeSchedulesCount,
              }
            : null,
        },
      },
    });
  } catch (error) {
    console.error("Ошибка при получении статистики:", error);

    return NextResponse.json(
      { success: false, error: "Ошибка сервера" },
      { status: 500 }
    );
  }
}
