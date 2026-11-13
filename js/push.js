// 폰 상단 알림(푸시): 앱을 닫아도 톡·부르기가 폰 알림으로 온다.
// 흐름: 이 폰의 "알림 주소"를 방에 저장 → 상대가 톡을 보내면 상대 앱이 알림 배달부(Cloudflare Worker)에게 부탁 → 배달부가 이 폰으로 전달
import { isMock } from './store.js';

// 알림 배달부 주소. 비어 있으면 푸시 기능은 꺼진 채로 둔다.
export const PUSH_URL = 'https://capy-push.hyunming9999.workers.dev/';

const b64u = buf => btoa(String.fromCharCode(...new Uint8Array(buf))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
const unb64u = s => Uint8Array.from(atob(s.replace(/-/g, '+').replace(/_/g, '/')), c => c.charCodeAt(0));
export const pushReady = () => !!PUSH_URL && !isMock && 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;

// 방마다 하나뿐인 알림 열쇠. 처음 한 번만 만들어 방에 넣어 둔다.
async function vapidOf(store) {
  let v = await store.get('meta/vapid'); if (v && v.pub && v.priv) return v;
  const kp = await crypto.subtle.generateKey({ name: 'ECDSA', namedCurve: 'P-256' }, true, ['sign']);
  const j = await crypto.subtle.exportKey('jwk', kp.privateKey);
  const fresh = { pub: b64u(await crypto.subtle.exportKey('raw', kp.publicKey)), priv: { kty: j.kty, crv: j.crv, x: j.x, y: j.y, d: j.d } };
  await store.tx('meta/vapid', cur => (cur && cur.pub ? undefined : fresh)).catch(() => {});
  v = await store.get('meta/vapid'); return v && v.pub ? v : null;
}

// 알림을 허용한 폰이면 이 폰의 알림 주소를 방에 등록한다. 여러 번 불러도 괜찮다.
let enabling = null;
export function enablePush(ctx) {
  if (!pushReady() || Notification.permission !== 'granted' || !ctx.store || !ctx.uid) return Promise.resolve(false);
  return enabling = enabling || (async () => {
    try {
      const vapid = await vapidOf(ctx.store); if (!vapid) return false;
      const reg = await navigator.serviceWorker.ready;
      let sub = await reg.pushManager.getSubscription();
      if (sub && sub.options && sub.options.applicationServerKey && b64u(sub.options.applicationServerKey) !== vapid.pub) { await sub.unsubscribe(); sub = null; }
      sub = sub || await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: unb64u(vapid.pub) });
      const j = sub.toJSON(); if (!j.endpoint || !j.keys) return false;
      const id = [...new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(j.endpoint)))].slice(0, 10).map(b => b.toString(16).padStart(2, '0')).join('');
      await ctx.store.set(`push/${ctx.uid}/${id}`, { endpoint: j.endpoint, keys: { p256dh: j.keys.p256dh, auth: j.keys.auth }, at: ctx.store.now() });
      return true;
    } catch { return false; } finally { enabling = null; }
  })();
}

// 상대 폰으로 알림 보내기. 상대가 앱을 화면에 띄워 놓고 있으면(앱 안 알림이 뜨므로) 보내지 않는다.
export function sendPush(ctx, o) {
  const to = ctx.partnerId; if (!PUSH_URL || isMock || !to || !ctx.room) return;
  const p = ctx.presence && ctx.presence[to]; if (p && !p.hid) return;
  fetch(PUSH_URL, { method: 'POST', keepalive: true, body: JSON.stringify({ room: ctx.room, to, title: o.title || '카피두리', body: o.body || '', tag: o.tag || 'capy', go: o.go || '' }) }).catch(() => {});
}
