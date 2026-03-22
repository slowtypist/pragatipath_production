/**
 * sw.js — Service Worker for PragatiPath
 * Cache-first strategy for shell, network-first for API calls.
 * Enables full offline use of the app UI.
 */

const CACHE_NAME = 'pragatipath-v1';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/src/main.tsx',
  // Leaflet tiles cached on first load
];

// ── Install: pre-cache app shell ──────────────────────────────────
self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(STATIC_ASSETS))
  );
  self.skipWaiting();
});

// ── Activate: clean old caches ────────────────────────────────────
self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// ── Fetch: cache-first for static, network-first for API ─────────
self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url);

  // Skip non-GET and chrome-extension requests
  if (e.request.method !== 'GET') return;
  if (url.protocol === 'chrome-extension:') return;

  // API calls: network-first, fall back to cached response
  if (url.pathname.startsWith('/api/')) {
    e.respondWith(
      fetch(e.request)
        .then(res => {
          const clone = res.clone();
          caches.open(CACHE_NAME).then(c => c.put(e.request, clone));
          return res;
        })
        .catch(() => caches.match(e.request))
    );
    return;
  }

  // Firestore/Firebase: always network (Firebase SDK handles its own persistence)
  if (url.hostname.includes('firestore.googleapis.com') ||
      url.hostname.includes('firebase') ||
      url.hostname.includes('googleapis.com')) {
    return;
  }

  // Map tiles (OpenStreetMap): cache aggressively for offline navigation
  if (url.hostname.includes('tile.openstreetmap.org') ||
      url.hostname.includes('cdnjs.cloudflare.com')) {
    e.respondWith(
      caches.match(e.request).then(cached => {
        if (cached) return cached;
        return fetch(e.request).then(res => {
          const clone = res.clone();
          caches.open(CACHE_NAME).then(c => c.put(e.request, clone));
          return res;
        }).catch(() => new Response('', { status: 503 }));
      })
    );
    return;
  }

  // Everything else: cache-first (app shell, JS, CSS, fonts)
  e.respondWith(
    caches.match(e.request).then(cached => {
      if (cached) return cached;
      return fetch(e.request).then(res => {
        if (res.ok) {
          const clone = res.clone();
          caches.open(CACHE_NAME).then(c => c.put(e.request, clone));
        }
        return res;
      }).catch(() => caches.match('/index.html')); // SPA fallback
    })
  );
});

// ── Background sync: flush outbox when connectivity returns ──────
self.addEventListener('sync', (e) => {
  if (e.tag === 'outbox-flush') {
    e.waitUntil(
      self.clients.matchAll().then(clients => {
        clients.forEach(client => client.postMessage({ type: 'FLUSH_OUTBOX' }));
      })
    );
  }
});

// ── Push notifications for ASHA alerts (future) ──────────────────
self.addEventListener('push', (e) => {
  if (!e.data) return;
  const { title, body } = e.data.json();
  e.waitUntil(
    self.registration.showNotification(title, {
      body,
      icon: '/icon-192.png',
      badge: '/icon-72.png',
      tag: 'pragatipath-alert',
    })
  );
});
