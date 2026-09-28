"use client";

import { useState, useEffect, useCallback } from "react";
import { Bell, BellOff, Loader2 } from "lucide-react";
import { Button } from "./Button";

interface PushSubscribeProps {
  groupId: string | null;
  groupName?: string;
}

type SupportStatus = "loading" | "supported" | "not-secure" | "not-supported";

export function PushSubscribe({ groupId, groupName }: PushSubscribeProps) {
  const [supportStatus, setSupportStatus] = useState<SupportStatus>("loading");
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [subscribedGroupName, setSubscribedGroupName] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission>("default");
  const [error, setError] = useState<string | null>(null);

  // Проверка поддержки Push API (только на клиенте)
  useEffect(() => {
    const checkSupport = () => {
      // Проверяем secure context (HTTPS или localhost)
      if (!window.isSecureContext) {
        setSupportStatus("not-secure");
        return;
      }
      
      // Проверяем поддержку API
      const supported = 
        "serviceWorker" in navigator && 
        "PushManager" in window &&
        "Notification" in window;
      
      if (supported) {
        setSupportStatus("supported");
        setPermission(Notification.permission);
      } else {
        setSupportStatus("not-supported");
      }
    };
    
    checkSupport();
  }, []);

  // Проверка текущей подписки
  const checkSubscription = useCallback(async () => {
    if (supportStatus !== "supported") return;

    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      
      if (subscription) {
        // Проверяем статус на сервере
        const response = await fetch("/api/notifications/push/status", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ endpoint: subscription.endpoint }),
        });
        
        const data = await response.json();
        
        if (data.success && data.data.isSubscribed) {
          setIsSubscribed(true);
          setSubscribedGroupName(data.data.groupName);
        } else {
          setIsSubscribed(false);
          setSubscribedGroupName(null);
        }
      } else {
        setIsSubscribed(false);
        setSubscribedGroupName(null);
      }
    } catch (err) {
      console.error("Ошибка проверки подписки:", err);
    }
  }, [supportStatus]);

  // Регистрация Service Worker и проверка подписки при монтировании
  useEffect(() => {
    const init = async () => {
      if (supportStatus !== "supported") return;
      
      try {
        await navigator.serviceWorker.register("/sw.js");
        await checkSubscription();
      } catch (err) {
        console.error("Ошибка регистрации Service Worker:", err);
      }
    };
    
    init();
  }, [supportStatus, checkSubscription]);

  // Подписка на уведомления
  const subscribe = async () => {
    if (!groupId) {
      setError("Сначала выберите группу");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Запрашиваем разрешение
      const permissionResult = await Notification.requestPermission();
      setPermission(permissionResult);

      if (permissionResult !== "granted") {
        setError("Разрешение на уведомления не получено");
        setIsLoading(false);
        return;
      }

      // Получаем регистрацию Service Worker
      const registration = await navigator.serviceWorker.ready;

      // Подписываемся на push
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(
          process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!
        ),
      });

      // Отправляем подписку на сервер
      const response = await fetch("/api/notifications/push/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subscription: subscription.toJSON(),
          groupId,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setIsSubscribed(true);
        setSubscribedGroupName(data.data.groupName);
      } else {
        setError(data.error || "Ошибка подписки");
      }
    } catch (err: any) {
      console.error("Ошибка подписки:", err);
      setError("Не удалось подписаться на уведомления");
    } finally {
      setIsLoading(false);
    }
  };

  // Отписка от уведомлений
  const unsubscribe = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();

      if (subscription) {
        // Отписываемся на сервере
        await fetch("/api/notifications/push/unsubscribe", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ endpoint: subscription.endpoint }),
        });

        // Отписываемся в браузере
        await subscription.unsubscribe();
      }

      setIsSubscribed(false);
      setSubscribedGroupName(null);
    } catch (err) {
      console.error("Ошибка отписки:", err);
      setError("Не удалось отписаться");
    } finally {
      setIsLoading(false);
    }
  };

  // Состояние загрузки (пока определяем поддержку)
  if (supportStatus === "loading") {
    return (
      <div className="h-10 w-48 bg-dark-200 animate-pulse rounded-lg" />
    );
  }

  // Не HTTPS
  if (supportStatus === "not-secure") {
    return (
      <div className="text-sm text-yellow-500 bg-yellow-500/10 px-3 py-2 rounded-lg">
        🔒 Push-уведомления доступны только через HTTPS
      </div>
    );
  }

  // Браузер не поддерживает Push API
  if (supportStatus === "not-supported") {
    return (
      <div className="text-sm text-text-muted">
        ⚠️ Ваш браузер не поддерживает push-уведомления
      </div>
    );
  }

  // Если разрешение заблокировано
  if (permission === "denied") {
    return (
      <div className="text-sm text-text-muted">
        🔕 Уведомления заблокированы в браузере
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      {isSubscribed ? (
        <Button
          onClick={unsubscribe}
          disabled={isLoading}
          variant="outline"
          className="gap-2"
        >
          {isLoading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <BellOff className="w-4 h-4" />
          )}
          <span className="hidden sm:inline">
            Отписаться {subscribedGroupName && `(${subscribedGroupName})`}
          </span>
          <span className="sm:hidden">Отписаться</span>
        </Button>
      ) : (
        <Button
          onClick={subscribe}
          disabled={isLoading || !groupId}
          variant="primary"
          className="gap-2"
        >
          {isLoading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Bell className="w-4 h-4" />
          )}
          <span className="hidden sm:inline">Подписаться на уведомления</span>
          <span className="sm:hidden">Подписаться</span>
        </Button>
      )}
      
      {error && (
        <p className="text-sm text-red-500">{error}</p>
      )}
      
      {isSubscribed && subscribedGroupName && (
        <p className="text-xs text-text-muted">
          Вы получите уведомление при обновлении расписания группы {subscribedGroupName}
        </p>
      )}
    </div>
  );
}

// Утилита для конвертации VAPID ключа
function urlBase64ToUint8Array(base64String: string): ArrayBuffer {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, "+")
    .replace(/_/g, "/");

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }

  return outputArray.buffer as ArrayBuffer;
}
