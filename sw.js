const CACHE_NAME = 'qr-pwa-v2';

// 初回から確実に必要なファイルをキャッシュ
const ASSETS = [
  './',
  './index.html',
  './manifest.webmanifest',
  './qrcode.min.js',        // ← ローカルQRライブラリ
  './icons/icon-192.png',
  './icons/icon-512.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.map(k => (k !== CACHE_NAME) && caches.delete(k)));
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', (event) => {
  event.respondWith((async () => {
    try {
      // ネット優先
      const network = await fetch(event.request);
      if (event.request.method === 'GET') {
        const cache = await caches.open(CACHE_NAME);
        cache.put(event.request, network.clone());
      }
      return network;
    } catch {
      // オフライン時はキャッシュ
      const cached = await caches.match(event.request, { ignoreSearch: true });
      if (cached) return cached;
      if (event.request.mode === 'navigate') {
        return caches.match('./index.html');
      }
      return new Response('Offline', { status: 503 });
    }
  })());
});
