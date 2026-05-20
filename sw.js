// ── AROGS CAMPAIGN SERVICE WORKER ──
// Handles background push notifications even when browser is closed

const CACHE_NAME = 'arogs-impact-v1';
const ASSETS = [
  '/',
  '/index.html',
  '/app.js',
  '/manifest.json'
];

// ── INSTALL: cache assets ──
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS))
  );
  self.skipWaiting();
});

// ── ACTIVATE: clean old caches ──
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// ── FETCH: serve from cache if available ──
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then(cached => cached || fetch(event.request))
  );
});

// ── PUSH: receive push notification from server ──
self.addEventListener('push', (event) => {
  let data = { title: 'Arogs — Rise With IMPACT', body: 'The movement continues!', icon: '/icon-192.png' };

  if (event.data) {
    try { data = { ...data, ...event.data.json() }; } catch(e) {}
  }

  const options = {
    body: data.body,
    icon: data.icon || '/icon-192.png',
    badge: '/icon-96.png',
    vibrate: [200, 100, 200],
    tag: 'arogs-impact',
    renotify: true,
    requireInteraction: false,
    data: { url: data.url || '/' },
    actions: [
      { action: 'open', title: '🌟 Rise With IMPACT' },
      { action: 'close', title: 'Dismiss' }
    ]
  };

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

// ── NOTIFICATION CLICK ──
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'close') return;

  const url = (event.notification.data && event.notification.data.url) || '/';
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(clientList => {
      for (const client of clientList) {
        if (client.url === url && 'focus' in client) return client.focus();
      }
      if (clients.openWindow) return clients.openWindow(url);
    })
  );
});

// ── BACKGROUND SYNC (fallback for offline queuing) ──
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-supporters') {
    event.waitUntil(syncPendingData());
  }
});

async function syncPendingData() {
  // Placeholder for syncing any offline-queued supporter data
  console.log('[SW] Background sync triggered');
}
