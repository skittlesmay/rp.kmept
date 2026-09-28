import { NextRequest, NextResponse } from "next/server";
import { parseScheduleExcel, getGroupsFromExcel } from "@/lib/excel-parser";
import prisma from "@/lib/prisma";
import { notifyMultipleGroupsSubscribers } from "@/lib/web-push";
import { getAdminSession } from "@/lib/auth";

export const runtime = "nodejs";

// Максимальный размер файла: 10MB
const MAX_FILE_SIZE = 10 * 1024 * 1024;

/**
 * POST /api/admin/upload
 * Загрузка и парсинг Excel файла с расписанием
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

    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json(
        { success: false, error: "Файл не был загружен" },
        { status: 400 }
      );
    }

    // Проверяем размер файла
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { success: false, error: "Файл слишком большой. Максимальный размер: 10MB" },
        { status: 400 }
      );
    }

    // Проверяем расширение файла
    if (!file.name.endsWith(".xlsx") && !file.name.endsWith(".xls")) {
      return NextResponse.json(
        { success: false, error: "Поддерживаются только файлы Excel (.xlsx, .xls)" },
        { status: 400 }
      );
    }

    // Читаем файл в буфер
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    console.log(`Загружен файл: ${file.name}, размер: ${buffer.length} байт`);

    // Парсим расписание
    const parsedSchedule = parseScheduleExcel(buffer);

    if (parsedSchedule.length === 0) {
      return NextResponse.json(
        { success: false, error: "Не удалось найти группы в файле" },
        { status: 400 }
      );
    }

    // Деактивируем предыдущие версии расписания
    await prisma.scheduleVersion.updateMany({
      where: { isActive: true },
      data: { isActive: false },
    });

    // Создаём новую версию расписания
    const version = await prisma.scheduleVersion.create({
      data: {
        fileName: file.name,
        uploadedBy: admin.login, // Имя администратора из сессии
        isActive: true,
      },
    });

    console.log(`Создана версия расписания: ${version.id}`);

    // Создаём/обновляем группы и сохраняем расписание
    let totalScheduleItems = 0;
    const groupsCreated: string[] = [];

    for (const groupSchedule of parsedSchedule) {
      // Создаём или находим группу
      const group = await prisma.group.upsert({
        where: { name: groupSchedule.groupName },
        update: {},
        create: { name: groupSchedule.groupName },
      });

      groupsCreated.push(group.name);

      // Создаём записи расписания для группы
      if (groupSchedule.schedule.length > 0) {
        await prisma.schedule.createMany({
          data: groupSchedule.schedule.map((item) => ({
            groupId: group.id,
            dayOfWeek: item.dayOfWeek,
            pairNumber: item.pairNumber,
            timeStart: item.timeStart,
            timeEnd: item.timeEnd,
            subject: item.subject,
            teacher: item.teacher,
            room: item.room,
            versionId: version.id,
          })),
        });

        totalScheduleItems += groupSchedule.schedule.length;
      }
    }

    console.log(`Сохранено расписание: ${totalScheduleItems} записей для ${groupsCreated.length} групп`);

    // Получаем ID групп для отправки уведомлений
    const groupIds = await prisma.group.findMany({
      where: { name: { in: groupsCreated } },
      select: { id: true },
    });

    // Отправляем push-уведомления подписчикам (асинхронно)
    notifyMultipleGroupsSubscribers(groupIds.map(g => g.id))
      .then((result) => {
        console.log(`Push-уведомления отправлены: ${result.totalSent} успешно, ${result.totalFailed} ошибок`);
      })
      .catch((error) => {
        console.error("Ошибка отправки push-уведомлений:", error);
      });

    return NextResponse.json({
      success: true,
      data: {
        versionId: version.id,
        fileName: file.name,
        groupsCount: groupsCreated.length,
        groups: groupsCreated,
        scheduleItemsCount: totalScheduleItems,
      },
    });
  } catch (error) {
    console.error("Ошибка при загрузке расписания:", error);

    const errorMessage = error instanceof Error ? error.message : "Неизвестная ошибка";

    return NextResponse.json(
      { success: false, error: `Ошибка при обработке файла: ${errorMessage}` },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/admin/upload
 * Получение списка групп из файла без сохранения (предпросмотр)
 */
export async function PUT(request: NextRequest) {
  try {
    // Проверка авторизации администратора
    const admin = await getAdminSession();
    if (!admin) {
      return NextResponse.json(
        { success: false, error: "Не авторизован" },
        { status: 401 }
      );
    }

    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json(
        { success: false, error: "Файл не был загружен" },
        { status: 400 }
      );
    }

    // Проверяем размер файла
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { success: false, error: "Файл слишком большой. Максимальный размер: 10MB" },
        { status: 400 }
      );
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const groups = getGroupsFromExcel(buffer);

    return NextResponse.json({
      success: true,
      data: {
        fileName: file.name,
        groupsCount: groups.length,
        groups,
      },
    });
  } catch (error) {
    console.error("Ошибка при предпросмотре файла:", error);

    const errorMessage = error instanceof Error ? error.message : "Неизвестная ошибка";

    return NextResponse.json(
      { success: false, error: `Ошибка при чтении файла: ${errorMessage}` },
      { status: 500 }
    );
  }
}
