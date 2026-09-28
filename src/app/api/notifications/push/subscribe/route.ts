import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

/**
 * POST /api/notifications/push/subscribe
 * Подписка на push-уведомления для группы
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { subscription, groupId } = body;

    if (!subscription || !subscription.endpoint || !subscription.keys) {
      return NextResponse.json(
        { success: false, error: 'Неверные данные подписки' },
        { status: 400 }
      );
    }

    if (!groupId) {
      return NextResponse.json(
        { success: false, error: 'Не указана группа' },
        { status: 400 }
      );
    }

    // Проверяем существование группы
    const group = await prisma.group.findUnique({
      where: { id: groupId },
    });

    if (!group) {
      return NextResponse.json(
        { success: false, error: 'Группа не найдена' },
        { status: 404 }
      );
    }

    // Создаём или обновляем подписку
    const pushSubscription = await prisma.pushSubscription.upsert({
      where: { endpoint: subscription.endpoint },
      update: {
        p256dh: subscription.keys.p256dh,
        auth: subscription.keys.auth,
        groupId,
      },
      create: {
        endpoint: subscription.endpoint,
        p256dh: subscription.keys.p256dh,
        auth: subscription.keys.auth,
        groupId,
      },
    });

    console.log(`Push-подписка создана для группы ${group.name}`);

    return NextResponse.json({
      success: true,
      data: {
        id: pushSubscription.id,
        groupName: group.name,
      },
    });
  } catch (error) {
    console.error('Ошибка при создании push-подписки:', error);
    return NextResponse.json(
      { success: false, error: 'Ошибка сервера' },
      { status: 500 }
    );
  }
}
