// 오늘 어디야? — 버튼을 누를 때만 내 위치를 "핑"으로 찍어 서로 지도에서 확인 (자동으로 따라다니지 않음)
import { h, toast, ask, josa } from './ui.js';
import { capy } from './capy.js';

let leafletReady = null;
function loadLeaflet() {
  if (!leafletReady) leafletReady = new Promise((res, rej) => {
    if (window.L) return res(window.L);
    document.head.append(h('link', { rel: 'stylesheet', href: 'css/leaflet.css' }));
    const s = h('script', { src: 'js/vendor/leaflet.js' });
    s.onload = () => res(window.L); s.onerror = () => { leafletReady = null; rej(new Error('지도를 불러오지 못했어요')); };
    document.head.append(s);
  });
  return leafletReady;
}
export function distM(a, b) {
  const R = 6371000, r = x => x * Math.PI / 180, dLat = r(b.lat - a.lat), dLng = r(b.lng - a.lng);
  const s = Math.sin(dLat / 2) ** 2 + Math.cos(r(a.lat)) * Math.cos(r(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(s));
}
const nice = m => m < 1000 ? `${Math.round(m / 10) * 10}m` : `${(m / 1000).toFixed(m < 10000 ? 1 : 0)}km`;
const ago = (ts, now) => { const s = Math.max(0, (now - ts) / 1000); return s < 60 ? '방금' : s < 3600 ? `${Math.floor(s / 60)}분 전` : s < 86400 ? `${Math.floor(s / 3600)}시간 전` : `${Math.floor(s / 86400)}일 전`; };
const QUICK = ['여기야', '가는 중', '도착!', '5분 늦어'];

export function mount(el, ctx) {
  let alive = true, map = null, L = null, pings = {}, layers = [], fitted = false, lastId = '', busy = false;
  const mapEl = h('div', { class: 'map' }, h('p', { class: 'map-wait' }, '지도 불러오는 중…'));
  const info = h('div', { class: 'loc-info' }), hist = h('ul', { class: 'ping-list' });
  const msg = h('input', { class: 'inp', placeholder: '한마디 (없어도 됨)', maxLength: 30 });
  const pingBtn = h('button', { class: 'btn primary big', onClick: ping }, '📍 지금 내 위치 핑 찍기');
  const chips = h('div', { class: 'chips' }, QUICK.map(q => h('button', { class: 'chip', onClick: () => { msg.value = q; } }, q)));

  function ping() {
    if (busy) return;
    if (!navigator.geolocation) return toast('이 기기에서는 위치를 알 수 없어요');
    busy = true; pingBtn.disabled = true; pingBtn.textContent = '위치 찾는 중…';
    const done = () => { busy = false; pingBtn.disabled = false; pingBtn.textContent = '📍 지금 내 위치 핑 찍기'; };
    navigator.geolocation.getCurrentPosition(async p => {
      try { await ctx.store.push('loc/pings', { by: ctx.uid, lat: +p.coords.latitude.toFixed(6), lng: +p.coords.longitude.toFixed(6), acc: Math.round(p.coords.accuracy || 0), msg: msg.value.trim(), ts: ctx.store.now() }); msg.value = ''; toast('핑을 찍었어요'); } catch {}
      done();
    }, e => { done(); toast(e.code === 1 ? '위치 권한이 꺼져 있어요. 브라우저 설정에서 이 사이트의 위치를 허용해 주세요' : e.code === 3 ? '위치를 찾는 데 너무 오래 걸려요. 밖이나 창가에서 다시 해보세요' : '위치를 찾지 못했어요', 4000); },
    { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 });
  }
  const latest = () => { const out = {}; for (const id of Object.keys(pings).sort()) out[pings[id].by] = { id, ...pings[id] }; return out; };
  const pinEl = uid => h('div', { class: 'pin-in' + (uid === ctx.uid ? ' me' : '') }, h('span', { class: 'pin-face', html: capy(ctx.capyOf(uid, { head: true, face: 'happy' })) }), h('b', null, ctx.nameOf(uid)));

  function draw(move) {
    const now = ctx.store.now(), last = latest(), ids = Object.keys(pings).sort().reverse(), mine = last[ctx.uid], pid = ctx.partnerId, theirs = pid && last[pid];
    info.replaceChildren(...[
      mine && theirs && h('p', { class: 'between' }, '둘 사이 ', h('b', null, nice(distM(mine, theirs))), h('small', { class: 'dim' }, ' (각자 마지막 핑 기준)')),
      ...ctx.order.map(u => { const p = last[u], nm = ctx.nameOf(u);
        return h('div', { class: 'loc-row' }, h('span', { class: 'capy mini', html: capy(ctx.capyOf(u, { head: true })) }),
          h('div', { class: 'grow' }, h('b', null, nm), p ? h('small', null, ` ${ago(p.ts, now)}${p.msg ? ' · “' + p.msg + '”' : ''}`) : h('small', { class: 'dim' }, ' 아직 핑이 없어요')),
          p && h('button', { class: 'chip', onClick: () => map && map.setView([p.lat, p.lng], 16) }, '보기'),
          p && h('a', { class: 'chip', href: `https://map.kakao.com/link/map/${encodeURIComponent(nm + ' 위치')},${p.lat},${p.lng}`, target: '_blank', rel: 'noopener' }, '카카오맵'),
          p && h('a', { class: 'chip', href: `nmap://place?lat=${p.lat}&lng=${p.lng}&name=${encodeURIComponent(nm + ' 위치')}&appname=hyunming9999-hash.github.io` }, '네이버앱')); })].filter(Boolean));
    hist.replaceChildren(...(ids.length ? ids.slice(0, 10).map(id => { const p = pings[id]; return h('li', { onClick: () => map && map.setView([p.lat, p.lng], 16) }, h('b', null, ctx.nameOf(p.by)), h('small', null, ' ' + ago(p.ts, now)), p.msg && h('span', null, ' · ' + p.msg), h('small', { class: 'dim' }, p.acc ? ` (오차 약 ${p.acc}m)` : '')); })
      : [h('li', { class: 'dim' }, '아직 찍은 핑이 없어요')]));
    if (!map) return;
    layers.forEach(l => l.remove()); layers = [];
    const pts = [];
    for (const [u, p] of Object.entries(last)) {
      if (!ctx.members[u]) continue; pts.push([p.lat, p.lng]);
      if (p.acc > 25) layers.push(L.circle([p.lat, p.lng], { radius: Math.min(p.acc, 500), color: u === ctx.uid ? '#D9960F' : '#E8567A', weight: 1, fillOpacity: 0.12 }).addTo(map));
      layers.push(L.marker([p.lat, p.lng], { icon: L.divIcon({ className: 'pin', html: pinEl(u), iconSize: [56, 64], iconAnchor: [28, 60] }), zIndexOffset: u === ctx.uid ? 0 : 100 }).addTo(map));
    }
    const newest = ids[0] || '';
    if (pts.length && (!fitted || (move && newest !== lastId))) {
      if (pts.length > 1) map.fitBounds(pts, { padding: [60, 60], maxZoom: 16 }); else map.setView(pts[0], Math.max(map.getZoom(), 15)); // 둘 다 찍었으면 둘이 한 화면에 보이게
      fitted = true;
    }
    lastId = newest;
  }

  el.append(mapEl, info,
    h('section', { class: 'box' }, msg, chips, pingBtn,
      h('p', { class: 'dim' }, '위치는 이 버튼을 누를 때만 한 번 전송돼요. 계속 따라다니지 않아요.')),
    h('div', { class: 'row loc-acts' },
      h('button', { class: 'btn', onClick: () => ctx.call('where', `${josa(ctx.me.name, '가', '이')} 어디냐고 물어봐요. 위치 핑을 찍어 주세요`) }, '어디야? 물어보기'),
      h('button', { class: 'btn ghost', onClick: () => ask('둘의 핑 기록을 모두 지울까요?', '지우기').then(y => y && ctx.store.remove('loc/pings')) }, '핑 기록 지우기')),
    h('h3', null, '최근 핑'), hist);

  loadLeaflet().then(lib => {
    if (!alive) return; L = lib; mapEl.replaceChildren();
    map = L.map(mapEl, { zoomControl: true, attributionControl: true }).setView([36.4, 127.9], 7);
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19, attribution: '© OpenStreetMap' }).addTo(map);
    draw(true);
  }).catch(e => { mapEl.replaceChildren(h('p', { class: 'map-wait' }, e.message)); });

  const off = ctx.store.on('loc/pings', v => { pings = v || {}; draw(true); }, { limit: 30 });
  const tick = setInterval(() => draw(false), 30000);
  return () => { alive = false; off(); clearInterval(tick); try { map && map.remove(); } catch {} };
}
