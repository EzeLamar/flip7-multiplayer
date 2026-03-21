const CACHE_NAME = 'flip7-v2';

// These paths are content-hashed by Next.js — safe to cache aggressively
const isStaticAsset = (url) =>
  url.pathname.startsWith('/_next/static/') ||
  url.pathname.startsWith('/icons/') ||
  url.pathname.startsWith('/sounds/');

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin) return;

  if (isStaticAsset(url)) {
    // Cache-first: hashed assets never change, safe to serve from cache
    event.respondWith(
      caches.match(event.request).then((cached) => {
        if (cached) return cached;
        return fetch(event.request).then((response) => {
          if (response && response.status === 200 && response.type === 'basic') {
            const clone = response.clone();
            event.waitUntil(
              caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone))
            );
          }
          return response;
        });
      })
    );
  } else if (event.request.mode === 'navigate') {
    // Network-first: only for HTML navigation requests so new deploys are picked up immediately
    const networkFirst = fetch(event.request).then((response) => {
      if (response && response.status === 200 && response.type === 'basic') {
        const clone = response.clone();
        event.waitUntil(
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone))
        );
      }
      return response;
    });

    event.respondWith(networkFirst.catch(() => caches.match(event.request)));
  }
  // All other same-origin requests are not intercepted — browser handles them normally
});
