// 카피두리 알림 배달부 (Cloudflare Worker)
// 앱이 "누구에게 이런 알림을 보내 줘"라고 부탁하면, 그 사람 폰의 알림 주소로 암호화해서 전달한다.
// 비밀번호·설정이 필요 없다: 알림 열쇠와 받는 주소는 모두 그 커플 방(Firebase) 안에 있고, 방 코드를 아는 사람만 부탁할 수 있다.
const DB = 'https://capy-duri-default-rtdb.firebaseio.com';
const ALLOW = ['https://hyunming9999-hash.github.io'];
const SUBJECT = 'https://hyunming9999-hash.github.io/capy-duri/';

const enc = new TextEncoder();
const b64u = buf => btoa(String.fromCharCode(...new Uint8Array(buf))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
const unb64u = s => Uint8Array.from(atob(s.replace(/-/g, '+').replace(/_/g, '/')), c => c.charCodeAt(0));
const cat = (...a) => { const o = new Uint8Array(a.reduce((n, x) => n + x.length, 0)); let i = 0; for (const x of a) { o.set(x, i); i += x.length; } return o; };
async function hkdf(salt, ikm, info, len) {
  const k = await crypto.subtle.importKey('raw', ikm, 'HKDF', false, ['deriveBits']);
  return new Uint8Array(await crypto.subtle.deriveBits({ name: 'HKDF', hash: 'SHA-256', salt, info }, k, len * 8));
}

// RFC 8291 (aes128gcm): 받는 폰만 풀 수 있게 알림 내용을 암호화
export async function encrypt(sub, text) {
  const uaPub = unb64u(sub.keys.p256dh), auth = unb64u(sub.keys.auth);
  const eph = await crypto.subtle.generateKey({ name: 'ECDH', namedCurve: 'P-256' }, true, ['deriveBits']);
  const asPub = new Uint8Array(await crypto.subtle.exportKey('raw', eph.publicKey));
  const uaKey = await crypto.subtle.importKey('raw', uaPub, { name: 'ECDH', namedCurve: 'P-256' }, false, []);
  const shared = new Uint8Array(await crypto.subtle.deriveBits({ name: 'ECDH', public: uaKey }, eph.privateKey, 256));
  const ikm = await hkdf(auth, shared, cat(enc.encode('WebPush: info\0'), uaPub, asPub), 32);
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const cek = await hkdf(salt, ikm, enc.encode('Content-Encoding: aes128gcm\0'), 16);
  const nonce = await hkdf(salt, ikm, enc.encode('Content-Encoding: nonce\0'), 12);
  const key = await crypto.subtle.importKey('raw', cek, 'AES-GCM', false, ['encrypt']);
  const body = new Uint8Array(await crypto.subtle.encrypt({ name: 'AES-GCM', iv: nonce }, key, cat(enc.encode(text), new Uint8Array([2]))));
  return cat(salt, new Uint8Array([0, 0, 16, 0]), new Uint8Array([asPub.length]), asPub, body);
}

// VAPID: "이 알림은 카피두리 방에서 보낸 것"이라는 서명
export async function vapidHeader(endpoint, vapid) {
  const key = await crypto.subtle.importKey('jwk', vapid.priv, { name: 'ECDSA', namedCurve: 'P-256' }, false, ['sign']);
  const head = b64u(enc.encode(JSON.stringify({ typ: 'JWT', alg: 'ES256' })));
  const body = b64u(enc.encode(JSON.stringify({ aud: new URL(endpoint).origin, exp: Math.floor(Date.now() / 1000) + 12 * 3600, sub: SUBJECT })));
  const sig = await crypto.subtle.sign({ name: 'ECDSA', hash: 'SHA-256' }, key, enc.encode(head + '.' + body));
  return `vapid t=${head}.${body}.${b64u(sig)}, k=${vapid.pub}`;
}

// 알림 주소는 실제 푸시 서비스(구글·애플·모질라·MS)만 허용
const PUSH_HOSTS = /(^|\.)(googleapis\.com|push\.apple\.com|mozilla\.com|mozaws\.net|notify\.windows\.com)$/;
const okEndpoint = u => { try { const x = new URL(u); return x.protocol === 'https:' && PUSH_HOSTS.test(x.hostname); } catch { return false; } };

export default {
  async fetch(req) {
    const origin = req.headers.get('Origin') || '';
    const cors = { 'Access-Control-Allow-Origin': ALLOW.includes(origin) ? origin : ALLOW[0], 'Access-Control-Allow-Methods': 'POST, OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type', 'Vary': 'Origin' };
    const json = (o, status = 200) => new Response(JSON.stringify(o), { status, headers: { 'Content-Type': 'application/json', ...cors } });
    if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors });
    if (req.method !== 'POST') return json({ ok: true, name: 'capy-push' });
    if (origin && !ALLOW.includes(origin)) return json({ error: 'origin' }, 403);
    let m; try { m = JSON.parse((await req.text()).slice(0, 4000)); } catch { return json({ error: 'json' }, 400); }
    const room = String(m.room || ''), to = String(m.to || '');
    if (!/^[A-Za-z0-9_-]{20,80}$/.test(room) || !/^[A-Za-z0-9_-]{4,60}$/.test(to)) return json({ error: 'bad request' }, 400);
    const base = `${DB}/rooms/${room}`;
    const [vapid, subs] = await Promise.all([fetch(`${base}/meta/vapid.json`).then(r => r.json()), fetch(`${base}/push/${to}.json`).then(r => r.json())]);
    if (!vapid || !vapid.pub || !vapid.priv || !subs) return json({ sent: 0, gone: 0 });
    const text = JSON.stringify({ title: String(m.title || '카피두리').slice(0, 60), body: String(m.body || '').slice(0, 180), tag: String(m.tag || 'capy').slice(0, 30), go: String(m.go || '').slice(0, 30) });
    let sent = 0, gone = 0; const errs = [];
    await Promise.all(Object.entries(subs).slice(0, 6).map(async ([id, sub]) => {
      try {
        if (!sub || !sub.keys || !okEndpoint(sub.endpoint)) return;
        const r = await fetch(sub.endpoint, { method: 'POST', headers: { 'Content-Encoding': 'aes128gcm', 'Content-Type': 'application/octet-stream', TTL: '86400', Urgency: 'high', Authorization: await vapidHeader(sub.endpoint, vapid) }, body: await encrypt(sub, text) });
        if (r.status === 404 || r.status === 410) { gone++; await fetch(`${base}/push/${to}/${id}.json`, { method: 'DELETE' }); } // 앱을 지운 폰의 주소는 정리
        else if (r.ok) sent++; else errs.push(r.status);
      } catch (e) { errs.push(String(e && e.message || e).slice(0, 60)); }
    }));
    return json({ sent, gone, errs });
  },
};
