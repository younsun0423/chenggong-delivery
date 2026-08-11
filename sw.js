const CACHE_NAME = 'chenggong-xiaomifeng-v1';
const APP_SHELL = [
  './',
  './index.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png'
];

// 安裝：預先快取 App 殼子
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(APP_SHELL))
  );
  self.skipWaiting();
});

// 啟用：清除舊版快取
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key))
      )
    ).then(() => self.clients.claim())
  );
});

// 攔截請求
self.addEventListener('fetch', event => {
  const request = event.request;

  // 只處理 GET
  if (request.method !== 'GET') return;

  const url = new URL(request.url);

  // 跨域（Google Apps Script 下單/查詢等）→ 完全不干涉，讓瀏覽器自己處理
  // 離線時這些請求自然會失敗，前端會擋下「送出」
  if (url.origin !== self.location.origin) return;

  // 同源：網路優先，失敗才用快取（離線時仍可開啟頁面、填表）
  event.respondWith(
    fetch(request)
      .then(response => {
        if (response && response.status === 200) {
          const copy = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(request, copy));
        }
        return response;
      })
      .catch(() =>
        caches.match(request).then(cached => cached || caches.match('./index.html'))
      )
  );
});
