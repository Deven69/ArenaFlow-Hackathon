const FCM_SERVER_KEY = import.meta.env.VITE_FCM_SERVER_KEY;

export const requestNotificationPermission = async (): Promise<string | null> => {
  if (!('Notification' in window)) return null;
  const permission = await Notification.requestPermission();
  if (permission !== 'granted') return null;
  
  // Register service worker for FCM
  const registration = await navigator.serviceWorker.ready;
  // FCM token would be obtained here in production
  // For demo: return a mock token
  return 'fcm-token-' + Math.random().toString(36).slice(2);
};

export const sendLocalNotification = (title: string, body: string) => {
  if (Notification.permission === 'granted') {
    new Notification(title, { 
      body, 
      icon: '/icons/icon-192.png',
      badge: '/icons/badge-72.png'
    });
  }
};
