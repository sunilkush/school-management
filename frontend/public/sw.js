/* ──────────────────────────────────────────────────────────────
   EduManage Service Worker — v2
   Strategy:
     • App shell (HTML/JS/CSS) → Cache-first (offline capable)
     • API calls (/api/*)       → Network-first (fresh data)
     • Static assets (images)   → Stale-while-revalidate
────────────────────────────────────────────────────────────── */

const CACHE_VERSION   = 'v2';
const SHELL_CACHE     = `app-shell-${CACHE_VERSION}`;
const STATIC_CACHE    = `static-assets-${CACHE_VERSION}`;
const API_CACHE       = `api-runtime-${CACHE_VERSION}`;
const ALL_CACHES      = [SHELL_CACHE, STATIC_CACHE, API_CACHE];

/* ── App shell: pages needed to boot offline ── */
const APP_SHELL = [
  '/',
  '/manifest.webmanifest',
  '/favicon_io/android-chrome-192x192.png',
  '/favicon_io/android-chrome-512x512.png',
];

/* ── Install: pre-cache app shell ── */
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(SHELL_CACHE)
      .then((cache) => cache.addAll(APP_SHELL))
      .then(() => self.skipWaiting())
  );
});

/* ── Activate: clean old caches ── */
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((k) => !ALL_CACHES.includes(k))
            .map((k)  => caches.delete(k))
        )
      )
      .then(() => self.clients.claim())
  );
});

/* ── Fetch strategy ── */
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  /* Skip non-GET and cross-origin */
  if (request.method !== 'GET') return;
  if (url.origin !== self.location.origin && !url.href.includes('/api/')) return;

  /* API: Network-first, fallback to cache */
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(networkFirst(request, API_CACHE, 5000));
    return;
  }

  /* Static assets: Stale-while-revalidate */
  if (
    url.pathname.match(/\.(png|jpg|jpeg|gif|webp|svg|ico|woff2?|ttf|eot)$/)
  ) {
    event.respondWith(staleWhileRevalidate(request, STATIC_CACHE));
    return;
  }

  /* HTML navigation: Network-first, fallback to shell */
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request).catch(() => caches.match('/'))
    );
    return;
  }

  /* JS/CSS bundles: Cache-first */
  if (url.pathname.match(/\.(js|css)$/)) {
    event.respondWith(cacheFirst(request, SHELL_CACHE));
    return;
  }

  /* Everything else: network */
  event.respondWith(fetch(request).catch(() => caches.match(request)));
});

/* ── Push notifications ── */
self.addEventListener('push', (event) => {
  if (!event.data) return;
  let data;
  try { data = event.data.json(); } catch { data = { title: 'EduManage', body: event.data.text() }; }

  event.waitUntil(
    self.registration.showNotification(data.title || 'EduManage', {
      body:    data.body    || '',
      icon:    data.icon    || '/favicon_io/android-chrome-192x192.png',
      badge:   data.badge   || '/favicon_io/favicon-32x32.png',
      tag:     data.tag     || 'edumanage-notification',
      renotify: true,
      data:    { url: data.url || '/' },
    })
  );
});

/* ── Notification click ── */
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const target = event.notification.data?.url || '/';
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((clients) => {
        const existing = clients.find((c) => c.url.includes(self.location.origin));
        if (existing) { existing.focus(); existing.navigate(target); }
        else           self.clients.openWindow(target);
      })
  );
});

/* ────────────────────────────────────────────────────────────
   Helper strategies
──────────────────────────────────────────────────────────── */
async function cacheFirst(request, cacheName) {
  const cached = await caches.match(request);
  if (cached) return cached;
  const response = await fetch(request);
  if (response.ok) {
    const cache = await caches.open(cacheName);
    cache.put(request, response.clone());
  }
  return response;
}

async function networkFirst(request, cacheName, timeoutMs) {
  try {
    const controller = new AbortController();
    const timer      = setTimeout(() => controller.abort(), timeoutMs);
    const response   = await fetch(request, { signal: controller.signal });
    clearTimeout(timer);
    if (response.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    const cached = await caches.match(request);
    return cached || Response.error();
  }
}

async function staleWhileRevalidate(request, cacheName) {
  const cache  = await caches.open(cacheName);
  const cached = await cache.match(request);
  const networkPromise = fetch(request).then((response) => {
    if (response.ok) cache.put(request, response.clone());
    return response;
  });
  return cached || networkPromise;
}
