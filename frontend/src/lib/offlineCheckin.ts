export const openCheckinDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open('arenaflow-offline', 1);
    req.onupgradeneeded = (e) => {
      (e.target as IDBOpenDBRequest).result
        .createObjectStore('checkin-queue', { keyPath: 'id', autoIncrement: true });
    };
    req.onsuccess = (e) => resolve((e.target as IDBOpenDBRequest).result);
    req.onerror = () => reject(req.error);
  });
};

export const queueCheckinForSync = async (
  qrValue: string, 
  token: string
): Promise<void> => {
  const db = await openCheckinDB();
  const tx = db.transaction('checkin-queue', 'readwrite');
  tx.objectStore('checkin-queue').add({ 
    qrValue, 
    token,
    queuedAt: new Date().toISOString() 
  });
  const registration = await navigator.serviceWorker.ready;
  if ('sync' in registration) {
    await (registration as ServiceWorkerRegistration & { 
      sync: { register: (tag: string) => Promise<void> } 
    }).sync.register('checkin-sync');
  }
};
