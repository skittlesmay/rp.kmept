import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAdminSession } from "@/lib/auth";

// GET - получить расписание физкультуры (публичный)
export async function GET() {
  try {
    const schedule = await prisma.physicalEducationSchedule.findMany({
      orderBy: { sortOrder: "asc" },
    });

    return NextResponse.json({
      success: true,
      data: schedule,
    });
  } catch (error) {
    console.error("Error fetching physical education schedule:", error);
    return NextResponse.json(
      { success: false, error: "Ошибка при получении расписания физкультуры" },
      { status: 500 }
    );
  }
}

// POST - создать/обновить расписание физкультуры (только для админа)
export async function POST(request: NextRequest) {
  try {
    // Проверка авторизации
    const admin = await getAdminSession();

    if (!admin) {
      return NextResponse.json(
        { success: false, error: "Не авторизован" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { items } = body as {
      items: Array<{
        id?: string;
        dayOfWeek: string;
        timeStart: string;
        timeEnd: string;
        sortOrder: number;
      }>;
    };

    if (!items || !Array.isArray(items)) {
      return NextResponse.json(
        { success: false, error: "Неверный формат данных" },
        { status: 400 }
      );
    }

    // Удаляем все старые записи и создаём новые
    await prisma.physicalEducationSchedule.deleteMany();

    const created = await prisma.physicalEducationSchedule.createMany({
      data: items.map((item, index) => ({
        dayOfWeek: item.dayOfWeek,
        timeStart: item.timeStart,
        timeEnd: item.timeEnd,
        sortOrder: item.sortOrder ?? index,
      })),
    });

    // Получаем созданные записи
    const schedule = await prisma.physicalEducationSchedule.findMany({
      orderBy: { sortOrder: "asc" },
    });

    return NextResponse.json({
      success: true,
      data: schedule,
      message: `Сохранено ${created.count} записей`,
    });
  } catch (error) {
    console.error("Error saving physical education schedule:", error);
    return NextResponse.json(
      { success: false, error: "Ошибка при сохранении расписания" },
      { status: 500 }
    );
  }
}

// DELETE - удалить запись (только для админа)
export async function DELETE(request: NextRequest) {
  try {
    // Проверка авторизации
    const admin = await getAdminSession();

    if (!admin) {
      return NextResponse.json(
        { success: false, error: "Не авторизован" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { success: false, error: "ID не указан" },
        { status: 400 }
      );
    }

    await prisma.physicalEducationSchedule.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: "Запись удалена",
    });
  } catch (error) {
    console.error("Error deleting physical education schedule:", error);
    return NextResponse.json(
      { success: false, error: "Ошибка при удалении записи" },
      { status: 500 }
    );
  }
}
