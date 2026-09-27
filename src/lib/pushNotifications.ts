import { Capacitor } from '@capacitor/core';

let initialized = false;
let isNative = false;

try {
  isNative = Capacitor.isNativePlatform();
} catch {
  isNative = false;
}

export const initPushNotifications = async () => {
  if (initialized) return;
  initialized = true;

  if (isNative) {
    try {
      const { PushNotifications } = await import('@capacitor/push-notifications');
      const { LocalNotifications } = await import('@capacitor/local-notifications');

      const permResult = await PushNotifications.requestPermissions();
      if (permResult.receive !== 'granted') {
        console.warn('Push notification permission not granted');
        return;
      }

      await PushNotifications.register();

      PushNotifications.addListener('registration', (token) => {
        console.log('Push registration token:', token.value);
        localStorage.setItem('push_token', token.value);
      });

      PushNotifications.addListener('registrationError', (err) => {
        console.error('Push registration error:', err.error);
      });

      PushNotifications.addListener('pushNotificationReceived', (notification) => {
        console.log('Push notification received:', notification);
      });

      PushNotifications.addListener('pushNotificationActionPerformed', (notification) => {
        console.log('Push notification action:', notification);
        const data = notification.notification.data;
        if (data?.type === 'order') {
          window.location.href = '/fastadmin';
        } else if (data?.type === 'chat') {
          window.location.href = '/fastadmin';
        }
      });
    } catch (e) {
      console.warn('Native push not available:', e);
    }
  } else {
    // PWA / Web — request browser notification permission
    if ('Notification' in window && Notification.permission === 'default') {
      await Notification.requestPermission();
    }
  }
};

/**
 * Show a local notification (works on native & web/PWA)
 */
export const showLocalNotification = async (title: string, body: string, data?: Record<string, string>) => {
  if (isNative) {
    try {
      const { LocalNotifications } = await import('@capacitor/local-notifications');
      await LocalNotifications.schedule({
        notifications: [
          {
            id: Date.now(),
            title,
            body,
            extra: data,
            sound: 'default',
            smallIcon: 'ic_notification',
          },
        ],
      });
    } catch (e) {
      console.warn('Local notification failed:', e);
    }
  } else {
    // Web / PWA notification
    if ('Notification' in window && Notification.permission === 'granted') {
      // Use service worker registration for PWA notifications (works in background)
      if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
        const reg = await navigator.serviceWorker.ready;
        await reg.showNotification(title, {
          body,
          icon: '/logo.png',
          badge: '/logo.png',
          data,
        } as NotificationOptions);
      } else {
        new Notification(title, { body, icon: '/logo.png' });
      }
    } else if ('Notification' in window && Notification.permission !== 'denied') {
      const perm = await Notification.requestPermission();
      if (perm === 'granted') {
        new Notification(title, { body, icon: '/logo.png' });
      }
    }
  }
};
