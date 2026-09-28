import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getAdminSession } from "@/lib/auth";

/**
 * GET /api/admin/versions
 * Получение истории загрузок расписания
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
    const versions = await prisma.scheduleVersion.findMany({
      orderBy: { uploadedAt: "desc" },
      include: {
        _count: {
          select: { schedules: true },
        },
      },
    });

    // Получаем количество уникальных групп для каждой версии
    const versionsWithGroups = await Promise.all(
      versions.map(async (version) => {
        const groups = await prisma.schedule.findMany({
          where: { versionId: version.id },
          select: { groupId: true },
          distinct: ["groupId"],
        });

        return {
          id: version.id,
          fileName: version.fileName,
          uploadedAt: version.uploadedAt,
          uploadedBy: version.uploadedBy,
          isActive: version.isActive,
          schedulesCount: version._count.schedules,
          groupsCount: groups.length,
        };
      })
    );

    return NextResponse.json({
      success: true,
      data: versionsWithGroups,
    });
  } catch (error) {
    console.error("Ошибка при получении версий расписания:", error);

    return NextResponse.json(
      { success: false, error: "Ошибка сервера" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/versions
 * Активация определённой версии расписания
 */
export async function POST(request: NextRequest) {
  try {
    // Проверка авторизации администратора
    const admin = await getAdminSession();
    if (!admin) {
      return NextResponse.json(
        { success: false, error: "Не авторизован" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { versionId } = body;

    if (!versionId) {
      return NextResponse.json(
        { success: false, error: "Необходимо указать versionId" },
        { status: 400 }
      );
    }

    // Проверяем существование версии
    const version = await prisma.scheduleVersion.findUnique({
      where: { id: versionId },
    });

    if (!version) {
      return NextResponse.json(
        { success: false, error: "Версия не найдена" },
        { status: 404 }
      );
    }

    // Деактивируем все версии
    await prisma.scheduleVersion.updateMany({
      where: { isActive: true },
      data: { isActive: false },
    });

    // Активируем выбранную версию
    await prisma.scheduleVersion.update({
      where: { id: versionId },
      data: { isActive: true },
    });

    return NextResponse.json({
      success: true,
      data: { message: "Версия активирована", versionId },
    });
  } catch (error) {
    console.error("Ошибка при активации версии:", error);

    return NextResponse.json(
      { success: false, error: "Ошибка сервера" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/versions
 * Удаление версии расписания
 */
export async function DELETE(request: NextRequest) {
  try {
    // Проверка авторизации администратора
    const admin = await getAdminSession();
    if (!admin) {
      return NextResponse.json(
        { success: false, error: "Не авторизован" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const versionId = searchParams.get("versionId");

    if (!versionId) {
      return NextResponse.json(
        { success: false, error: "Необходимо указать versionId" },
        { status: 400 }
      );
    }

    const version = await prisma.scheduleVersion.findUnique({
      where: { id: versionId },
    });

    if (!version) {
      return NextResponse.json(
        { success: false, error: "Версия не найдена" },
        { status: 404 }
      );
    }

    if (version.isActive) {
      return NextResponse.json(
        { success: false, error: "Нельзя удалить активную версию расписания" },
        { status: 400 }
      );
    }

    // Удаляем версию (каскадно удалятся и записи расписания)
    await prisma.scheduleVersion.delete({
      where: { id: versionId },
    });

    return NextResponse.json({
      success: true,
      data: { message: "Версия удалена", versionId },
    });
  } catch (error) {
    console.error("Ошибка при удалении версии:", error);

    return NextResponse.json(
      { success: false, error: "Ошибка сервера" },
      { status: 500 }
    );
  }
}
