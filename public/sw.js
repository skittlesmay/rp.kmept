// Service Worker для Push-уведомлений

self.addEventListener('install', (event) => {
  console.log('Service Worker установлен');
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  console.log('Service Worker активирован');
  event.waitUntil(clients.claim());
});

// Обработка входящих push-уведомлений
self.addEventListener('push', (event) => {
  console.log('Получено push-уведомление');
  
  let data = {
    title: 'Расписание обновлено',
    body: 'Проверьте изменения в расписании',
    icon: '/stylesKmept/whiteLogo.png',
    badge: '/stylesKmept/whiteLogo.png',
    url: '/dashboard'
  };

  try {
    if (event.data) {
      data = { ...data, ...event.data.json() };
    }
  } catch (e) {
    console.error('Ошибка парсинга данных push:', e);
  }

  const options = {
    body: data.body,
    icon: data.icon,
    badge: data.badge,
    vibrate: [100, 50, 100],
    data: {
      url: data.url || '/dashboard'
    },
    actions: [
      {
        action: 'open',
        title: 'Открыть расписание'
      },
      {
        action: 'close',
        title: 'Закрыть'
      }
    ]
  };

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

// Обработка клика по уведомлению
self.addEventListener('notificationclick', (event) => {
  console.log('Клик по уведомлению:', event.action);
  
  event.notification.close();

  if (event.action === 'close') {
    return;
  }

  // Открываем страницу расписания
  const urlToOpen = event.notification.data?.url || '/dashboard';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // Если уже есть открытое окно - фокусируемся на нём
      for (const client of clientList) {
        if (client.url.includes('/dashboard') && 'focus' in client) {
          return client.focus();
        }
      }
      // Иначе открываем новое окно
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});
