const cacheName = 'climbing-log-v3';
const assets = ['./', './index.html', './styles.css', './app.js', './db.js', './data.js', './manifest.webmanifest', './icons/icon-192.png', './icons/icon-512.png'];
const urls = assets.map(path => new URL(path, self.registration.scope).href);
self.addEventListener('install', event => {
  event.waitUntil(caches.open(cacheName).then(cache => cache.addAll(assets)));
  // Updated workers wait for all existing app windows to close.
});
self.addEventListener('activate', event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(key => key.startsWith('climbing-log-') && key !== cacheName).map(key => caches.delete(key)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;
  const url = new URL(event.request.url);
  url.hash = '';
  if (url.origin !== self.location.origin || !urls.includes(url.href)) return;
  event.respondWith(caches.open(cacheName).then(async cache => await cache.match(url.href) || fetch(event.request)));
});
