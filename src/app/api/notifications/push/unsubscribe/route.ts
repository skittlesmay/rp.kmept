import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

/**
 * POST /api/notifications/push/unsubscribe
 * Отписка от push-уведомлений
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { endpoint } = body;

    if (!endpoint) {
      return NextResponse.json(
        { success: false, error: 'Не указан endpoint' },
        { status: 400 }
      );
    }

    // Удаляем подписку
    const deleted = await prisma.pushSubscription.delete({
      where: { endpoint },
    }).catch(() => null);

    if (!deleted) {
      return NextResponse.json(
        { success: false, error: 'Подписка не найдена' },
        { status: 404 }
      );
    }

    console.log('Push-подписка удалена:', endpoint);

    return NextResponse.json({
      success: true,
      message: 'Подписка успешно отменена',
    });
  } catch (error) {
    console.error('Ошибка при удалении push-подписки:', error);
    return NextResponse.json(
      { success: false, error: 'Ошибка сервера' },
      { status: 500 }
    );
  }
}
