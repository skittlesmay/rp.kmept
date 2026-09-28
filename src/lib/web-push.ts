import webPush from 'web-push';
import prisma from './prisma';

// Настройка VAPID ключей
const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY;
const vapidSubject = process.env.VAPID_SUBJECT || 'mailto:admin@kmept.ru';

// Проверка наличия ключей
const pushEnabled = !!(vapidPublicKey && vapidPrivateKey);

if (pushEnabled) {
  webPush.setVapidDetails(vapidSubject, vapidPublicKey, vapidPrivateKey);
} else {
  console.warn('⚠️ VAPID ключи не настроены. Push-уведомления отключены.');
  console.warn('   Установите NEXT_PUBLIC_VAPID_PUBLIC_KEY и VAPID_PRIVATE_KEY в .env');
}

interface PushPayload {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  url?: string;
}

/**
 * Отправляет push-уведомление одному подписчику
 */
async function sendPushToSubscription(
  subscription: { endpoint: string; p256dh: string; auth: string },
  payload: PushPayload
): Promise<boolean> {
  if (!pushEnabled) {
    console.warn('[Push] Пропускаем — VAPID ключи не настроены');
    return false;
  }
  const pushSubscription = {
    endpoint: subscription.endpoint,
    keys: {
      p256dh: subscription.p256dh,
      auth: subscription.auth,
    },
  };

  try {
    console.log(`[Push] Отправляем на endpoint: ${subscription.endpoint.substring(0, 50)}...`);
    await webPush.sendNotification(pushSubscription, JSON.stringify(payload));
    console.log(`[Push] ✅ Успешно отправлено!`);
    return true;
  } catch (error: any) {
    console.error('[Push] ❌ Ошибка отправки:', error.message, error.statusCode);
    
    // Если подписка недействительна (410 Gone или 404) - удаляем её
    if (error.statusCode === 410 || error.statusCode === 404) {
      console.log('Удаляем недействительную подписку:', subscription.endpoint);
      await prisma.pushSubscription.delete({
        where: { endpoint: subscription.endpoint },
      }).catch(() => {});
    }
    
    return false;
  }
}

/**
 * Отправляет уведомления всем подписчикам определённой группы
 */
export async function notifyGroupSubscribers(
  groupId: string,
  groupName: string
): Promise<{ sent: number; failed: number }> {
  console.log(`[Push] Ищем подписчиков для группы ${groupName} (${groupId})`);
  
  const subscriptions = await prisma.pushSubscription.findMany({
    where: { groupId },
  });

  console.log(`[Push] Найдено подписчиков: ${subscriptions.length}`);

  if (subscriptions.length === 0) {
    return { sent: 0, failed: 0 };
  }

  const payload: PushPayload = {
    title: 'Расписание обновлено',
    body: `Расписание для группы ${groupName} обновлено. Проверьте изменения!`,
    icon: '/stylesKmept/whiteLogo.png',
    badge: '/stylesKmept/whiteLogo.png',
    url: '/dashboard',
  };

  let sent = 0;
  let failed = 0;

  await Promise.all(
    subscriptions.map(async (sub) => {
      const success = await sendPushToSubscription(sub, payload);
      if (success) {
        sent++;
      } else {
        failed++;
      }
    })
  );

  return { sent, failed };
}

/**
 * Отправляет уведомления подписчикам всех указанных групп
 */
export async function notifyMultipleGroupsSubscribers(
  groupIds: string[]
): Promise<{ totalSent: number; totalFailed: number }> {
  let totalSent = 0;
  let totalFailed = 0;

  // Получаем все группы с их именами
  const groups = await prisma.group.findMany({
    where: { id: { in: groupIds } },
    select: { id: true, name: true },
  });

  for (const group of groups) {
    const result = await notifyGroupSubscribers(group.id, group.name);
    totalSent += result.sent;
    totalFailed += result.failed;
  }

  return { totalSent, totalFailed };
}

/**
 * Проверяет, подписан ли endpoint на уведомления для группы
 */
export async function isSubscribed(endpoint: string, groupId: string): Promise<boolean> {
  const subscription = await prisma.pushSubscription.findFirst({
    where: { endpoint, groupId },
  });
  return !!subscription;
}

/**
 * Получает подписку по endpoint
 */
export async function getSubscriptionByEndpoint(endpoint: string) {
  return prisma.pushSubscription.findUnique({
    where: { endpoint },
    include: { group: true },
  });
}
