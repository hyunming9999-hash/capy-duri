// 화면 파일은 항상 새 것을 먼저 받고, 인터넷이 안 될 때만 저장해 둔 것을 쓴다
const CACHE = 'capy-v1';
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', e => e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim())));
self.addEventListener('fetch', e => {
  const u = new URL(e.request.url);
  if (e.request.method !== 'GET' || u.origin !== location.origin) return;
  e.respondWith(fetch(e.request).then(r => { if (r.ok) { const c = r.clone(); caches.open(CACHE).then(x => x.put(e.request, c)); } return r; }).catch(() => caches.match(e.request, { ignoreSearch: true }).then(r => r || caches.match('./'))));
});
// 알림을 누르면 열려 있는 앱 화면으로 돌아간다
self.addEventListener('notificationclick', e => { e.notification.close(); e.waitUntil(self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(cs => cs.length ? cs[0].focus() : self.clients.openWindow('./'))); });

// 폰 상단 알림(푸시): 앱이 닫혀 있어도 온다. 앱을 화면에 띄워 놓고 있으면 앱 안 알림이 뜨므로 건너뛴다.
self.addEventListener('push', e => {
  let d = {}; try { d = e.data ? e.data.json() : {}; } catch {}
  e.waitUntil(self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(cs => {
    if (cs.some(c => c.visibilityState === 'visible')) return;
    // 알림을 하나씩 따로 쌓아서, 앱 아이콘에 안 읽은 개수가 숫자로 보이게 한다(앱을 열면 모두 지워진다)
    return self.registration.showNotification(d.title || '카피두리', { body: d.body || '', icon: 'icons/icon-192.png', badge: 'icons/icon-192.png', tag: (d.tag || 'capy') + '-' + Date.now() })
      .then(() => self.registration.getNotifications()).then(ns => { if (self.navigator && navigator.setAppBadge) return navigator.setAppBadge(ns.length).catch(() => {}); });
  }));
});
