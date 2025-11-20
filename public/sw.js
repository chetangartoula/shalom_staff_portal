/**
 * Custom service worker for Shalom Staff Portal PWA
 */

// Cache name
const CACHE_NAME = 'shalom-staff-portal-v1.0';
const DATA_CACHE_NAME = 'shalom-staff-portal-data-v1.0';

// Files to cache
const urlsToCache = [
  '/',
  '/dashboard',
  '/assignments',
  '/travelers',
  '/guides',
  '/porters',
  '/payments',
  '/reports',
  '/settings',
  '/offline.html'
];

// Install event - cache static assets
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Opened cache');
        return cache.addAll(urlsToCache);
      })
  );
  self.skipWaiting();
});

// Fetch event - serve cached content when offline
self.addEventListener('fetch', event => {
  // Check if this is a navigation request
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .catch(() => {
          // If fetch fails, try to serve the offline page
          return caches.match('/offline.html');
        })
    );
    return;
  }

  // For API requests, try network first, then cache
  if (event.request.url.includes('/api/')) {
    event.respondWith(
      fetch(event.request)
        .then(response => {
          // Clone the response to put in cache
          const responseClone = response.clone();
          
          // Cache the response for future use
          caches.open(DATA_CACHE_NAME)
            .then(cache => {
              cache.put(event.request, responseClone);
            });
            
          return response;
        })
        .catch(() => {
          // If network fails, try cache
          return caches.match(event.request);
        })
    );
    return;
  }

  // For other requests, try cache first, then network
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Return cached version or fetch from network
        return response || fetch(event.request);
      })
      .catch(() => {
        // If both fail and it's a resource request, return a fallback
        if (event.request.destination === 'image') {
          return caches.match('/logo/pwa.png');
        }
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', event => {
  const cacheWhitelist = [CACHE_NAME, DATA_CACHE_NAME];
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  return self.clients.claim();
});

// Push notification event
self.addEventListener('push', function(event) {
  if (event.data) {
    const data = event.data.json();
    const options = {
      body: data.body,
      icon: '/logo/pwa.png',
      badge: '/logo/pwa.png',
      vibrate: [100, 50, 100],
      data: {
        dateOfArrival: Date.now(),
        primaryKey: '2',
      },
    };
    
    event.waitUntil(
      self.registration.showNotification(data.title, options)
    );
  }
});

// Notification click event
self.addEventListener('notificationclick', function(event) {
  console.log('Notification click received.');
  event.notification.close();
  event.waitUntil(
    clients.openWindow('/')
  );
});