import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

/**
 * POST /api/notifications/push/status
 * Проверка статуса подписки по endpoint
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

    // Ищем подписку
    const subscription = await prisma.pushSubscription.findUnique({
      where: { endpoint },
      include: { group: true },
    });

    if (!subscription) {
      return NextResponse.json({
        success: true,
        data: {
          isSubscribed: false,
          groupId: null,
          groupName: null,
        },
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        isSubscribed: true,
        groupId: subscription.groupId,
        groupName: subscription.group.name,
      },
    });
  } catch (error) {
    console.error('Ошибка при проверке статуса подписки:', error);
    return NextResponse.json(
      { success: false, error: 'Ошибка сервера' },
      { status: 500 }
    );
  }
}
