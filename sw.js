/* PIXELBEAT service worker — app-shell caching (network-first, offline boot) */
const VER = 'pb-v1';
const SHELL = [
  './', './index.html', './styles.css',
  './js/store.js', './js/player.js', './js/api.js', './js/ui.js',
  './manifest.web', './icon.svg'
];

self.addEventListener('install', function (e) {
  e.waitUntil(
    caches.open(VER).then(function (c) { return c.addAll(SHELL); })
      .then(function () { return self.skipWaiting(); })
  );
});

self.addEventListener('activate', function (e) {
  e.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(keys.filter(function (k) { return k !== VER; })
        .map(function (k) { return caches.delete(k); }));
    }).then(function () { return self.clients.claim(); })
  );
});

self.addEventListener('fetch', function (e) {
  if (e.request.method !== 'GET') return;
  const url = new URL(e.request.url);

  /* app shell: network-first, cache fallback (fresh in dev, offline-capable) */
  if (url.origin === location.origin) {
    e.respondWith(
      fetch(e.request).then(function (res) {
        const copy = res.clone();
        caches.open(VER).then(function (c) { c.put(e.request, copy); });
        return res;
      }).catch(function () {
        return caches.match(e.request, { ignoreSearch: true }).then(function (r) { return r || Response.error(); });
      })
    );
    return;
  }

  /* fonts: stale-while-revalidate */
  if (/(^|\.)fonts\.(googleapis|gstatic)\.com$/.test(url.hostname)) {
    e.respondWith(
      caches.match(e.request).then(function (hit) {
        const net = fetch(e.request).then(function (res) {
          const copy = res.clone();
          caches.open(VER + '-fonts').then(function (c) { c.put(e.request, copy); });
          return res;
        }).catch(function () { return hit; });
        return hit || net;
      })
    );
  }
  /* youtube + googleapis traffic: never intercepted */
});
