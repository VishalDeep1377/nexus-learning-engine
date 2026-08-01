// Service Worker for Code To Career PWA
const CACHE_NAME = 'code-to-career-cache-v1';

// Assets to cache on install
const urlsToCache = [
  '/',
  '/offline',
  '/manifest.json',
  '/site.webmanifest',
  '/icons/icon-72x72.png',
  '/icons/icon-96x96.png',
  '/icons/icon-144x144.png',
  '/icons/icon-152x152.png',
  '/icons/icon-192x192.png',
  '/icons/icon-384x384.png',
  '/icons/icon-512x512.png'
];

// Dynamic cache for runtime assets
const RUNTIME_CACHE = 'runtime-cache-v1';

// Install event - cache assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Opened cache');
        return cache.addAll(urlsToCache);
      })
      .then(() => self.skipWaiting())
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  const cacheWhitelist = [CACHE_NAME, RUNTIME_CACHE];
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            return caches.delete(cacheName);
          }
          return null;
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Helper function to determine if a resource should be cached
function shouldCache(url) {
  // Cache CSS, JS, HTML, images, and fonts
  return (
    url.includes('/static/') ||
    url.includes('/_next/') ||
    url.includes('/icons/') ||  // Explicitly include all icon files
    url.endsWith('.css') ||
    url.endsWith('.js') ||
    url.endsWith('.html') ||
    url.endsWith('.png') ||
    url.endsWith('.jpg') ||
    url.endsWith('.jpeg') ||
    url.endsWith('.gif') ||
    url.endsWith('.woff2') ||
    url.endsWith('.woff') ||
    url.endsWith('.ttf') ||
    url.endsWith('/manifest.json') ||
    url.endsWith('/site.webmanifest') ||
    url === '/' ||
    url === '/offline'
  );
}

// Fetch event - serve from cache or network
self.addEventListener('fetch', (event) => {
  // Skip cross-origin requests
  if (!event.request.url.startsWith(self.location.origin)) {
    return;
  }

  // Handle navigation requests differently
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .catch(() => {
          return caches.match('/offline')
            .then(response => {
              return response || caches.match('/');
            });
        })
    );
    return;
  }

  // Cache-first strategy for static assets
  if (shouldCache(event.request.url)) {
    event.respondWith(
      caches.match(event.request)
        .then((response) => {
          // Cache hit - return response
          if (response) {
            return response;
          }

          // Clone the request
          const fetchRequest = event.request.clone();

          return fetch(fetchRequest)
            .then((response) => {
              // Check if valid response
              if (!response || response.status !== 200 || response.type !== 'basic') {
                return response;
              }

              // Clone the response
              const responseToCache = response.clone();

              // Cache the fetched response
              caches.open(RUNTIME_CACHE)
                .then((cache) => {
                  cache.put(event.request, responseToCache);
                });

              return response;
            })
            .catch(() => {
              // For non-navigation requests, return a network error
              return new Response('Network error happened', {
                status: 408,
                headers: { 'Content-Type': 'text/plain' },
              });
            });
        })
    );
  } else {
    // Network-first strategy for dynamic content
    event.respondWith(
      fetch(event.request)
        .catch(() => {
          return caches.match(event.request);
        })
    );
  }
}); 