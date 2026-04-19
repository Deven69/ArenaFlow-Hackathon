const CACHE_NAME = 'arenaflow-v2';

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((cacheName) => cacheName !== CACHE_NAME)
          .map((cacheName) => caches.delete(cacheName))
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // NETWORK ONLY (never cache)
  if (
    url.pathname.includes('/functions/v1/log-analytics') ||
    url.pathname.includes('/rest/v1/tickets')
  ) {
    event.respondWith(fetch(request));
    return;
  }

  // NETWORK FIRST with cache fallback & offline fallback header injection
  if (
    url.pathname.includes('/functions/v1/navigation-gate-times') ||
    url.pathname.includes('/rest/v1/venues') ||
    url.pathname.includes('/rest/v1/matches')
  ) {
    event.respondWith(
      fetch(request)
        .then(response => {
          const resClone = response.clone();
          caches.open(CACHE_NAME).then(cache => {
            cache.put(request, resClone);
          });
          return response;
        })
        .catch(async () => {
          const cachedResponse = await caches.match(request);
          if (cachedResponse) {
             if (url.pathname.includes('/functions/v1/navigation-gate-times')) {
                const headers = new Headers(cachedResponse.headers);
                headers.append('X-From-Cache', 'true');
                return new Response(cachedResponse.body, {
                  status: 200,
                  statusText: 'OK',
                  headers: headers
                });
             }
             return cachedResponse;
          }
          throw new Error('Network error and no cache fallback');
        })
    );
    return;
  }

  // CACHE FIRST (serve from cache, update in background)
  if (
    url.pathname.match(/\.(js|css|woff2)$/) ||
    url.pathname.startsWith('/assets/') ||
    url.pathname === '/index.html' || 
    url.pathname === '/'
  ) {
    event.respondWith(
      caches.match(request).then((cachedResponse) => {
        const fetchPromise = fetch(request).then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(request, networkResponse.clone());
            });
          }
          return networkResponse;
        }).catch(() => {
          // ignore network failures for background update
        });
        
        return cachedResponse || fetchPromise;
      })
    );
    return;
  }
});
