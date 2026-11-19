// Service worker: makes Câmbio installable and usable offline with the last quotes seen.
//
//  - Pages:          network first, falling back to the cached copy (or the cached home page).
//  - /_astro assets: cache first (file names are content-hashed).
//  - Fonts:          cache first.
//  - Rate APIs:      network first, falling back to the last successful response.

const VERSION = 'v2';
const SHELL = `cambio-shell-${VERSION}`;
const RUNTIME = `cambio-runtime-${VERSION}`;
const DATA = `cambio-data-${VERSION}`;
const PRECACHE = ['/', '/en/', '/manifest.webmanifest', '/favicon.svg', '/grain.png', '/icons/icon-192.png'];
const API_HOSTS = ['api.frankfurter.dev', 'economia.awesomeapi.com.br', 'data-api.binance.vision'];
const FONT_HOSTS = ['fonts.googleapis.com', 'fonts.gstatic.com'];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(SHELL)
      .then((c) => c.addAll(PRECACHE))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener('activate', (event) => {
  const keep = new Set([SHELL, RUNTIME, DATA]);
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => !keep.has(k)).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

/**
 * Cache key for API responses. The Frankfurter series URL embeds a start date that changes every day
 * (`/v1/2025-11-04..?…`), so the date is normalized away to keep yesterday's series usable offline.
 */
function dataKey(url) {
  const u = new URL(url);
  u.pathname = u.pathname.replace(/\/\d{4}-\d{2}-\d{2}\.\./, '/series..');
  return u.toString();
}

async function networkFirst(request, cacheName, key = request) {
  const cache = await caches.open(cacheName);
  try {
    const res = await fetch(request);
    if (res.ok) cache.put(key, res.clone());
    return res;
  } catch (err) {
    const hit = await cache.match(key);
    if (hit) return hit;
    throw err;
  }
}

async function cacheFirst(request, cacheName) {
  const cache = await caches.open(cacheName);
  const hit = await cache.match(request);
  if (hit) return hit;
  const res = await fetch(request);
  if (res.ok || res.type === 'opaque') cache.put(request, res.clone());
  return res;
}

async function page(request) {
  try {
    return await networkFirst(request, RUNTIME);
  } catch {
    // every page hydrates the same island and routes on the URL, so the home page in the
    // same language is a usable fallback
    const home = new URL(request.url).pathname.startsWith('/en/') ? '/en/' : '/';
    return (await caches.match(home, { cacheName: SHELL })) || Response.error();
  }
}

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);

  if (request.mode === 'navigate') {
    event.respondWith(page(request));
  } else if (API_HOSTS.includes(url.hostname)) {
    event.respondWith(networkFirst(request, DATA, dataKey(request.url)));
  } else if (FONT_HOSTS.includes(url.hostname)) {
    event.respondWith(cacheFirst(request, RUNTIME));
  } else if (url.origin === self.location.origin && url.pathname.startsWith('/_astro/')) {
    event.respondWith(cacheFirst(request, RUNTIME));
  } else if (url.origin === self.location.origin) {
    event.respondWith(networkFirst(request, RUNTIME));
  }
});
