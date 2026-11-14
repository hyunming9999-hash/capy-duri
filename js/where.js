// 오늘 어디야? — 버튼을 누를 때만 내 위치를 "핑"으로 찍어 서로 지도에서 확인 (자동으로 따라다니지 않음)
// 지도: 방에 네이버 지도 Client ID(meta/naverMapId)가 있으면 네이버 지도, 없거나 인증에 실패하면 OpenStreetMap
import { h, toast, ask, josa, modal } from './ui.js';
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
const SITE = 'https://hyunming9999-hash.github.io';
function loadNaver(id) {
  return new Promise((res, rej) => {
    if (window.__capyNaverOk && window.naver && window.naver.maps) return res(window.naver);
    let done = false; const fin = (ok, v) => { if (done) return; done = true; ok ? res(v) : rej(v); };
    window.navermap_authFailure = () => { window.__capyNaverOk = false; fin(false, new Error('네이버 지도 인증에 실패했어요. Client ID와 등록한 웹 서비스 URL을 확인해 주세요')); window.__capyNaverFail && window.__capyNaverFail(); };
    window.__capyNaverReady = () => setTimeout(() => { if (!done) window.__capyNaverOk = true; fin(true, window.naver); }, 700); // 인증 실패 통보가 조금 늦게 올 수 있어 잠깐 기다린다
    const s = h('script', { src: `https://oapi.map.naver.com/openapi/v3/maps.js?ncpKeyId=${encodeURIComponent(id)}&callback=__capyNaverReady` });
    s.onerror = () => fin(false, new Error('네이버 지도를 불러오지 못했어요'));
    document.head.append(s); setTimeout(() => fin(false, new Error('네이버 지도 응답이 없어요')), 12000);
  });
}
// 두 지도를 같은 방식으로 다루기 위한 얇은 껍데기
function osmMap(L, el) {
  const map = L.map(el, { zoomControl: true, attributionControl: true }).setView([36.4, 127.9], 7); let layers = [];
  L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19, attribution: '© OpenStreetMap' }).addTo(map);
  return { kind: 'osm',
    clear() { layers.forEach(l => l.remove()); layers = []; },
    pin(lat, lng, node, front) { layers.push(L.marker([lat, lng], { icon: L.divIcon({ className: 'pin', html: node, iconSize: [56, 64], iconAnchor: [28, 60] }), zIndexOffset: front ? 100 : 0 }).addTo(map)); },
    circle(lat, lng, r, color) { layers.push(L.circle([lat, lng], { radius: r, color, weight: 1, fillOpacity: 0.12 }).addTo(map)); },
    view(lat, lng, z) { map.setView([lat, lng], Math.max(map.getZoom(), z)); },
    fit(pts) { map.fitBounds(pts, { padding: [60, 60], maxZoom: 16 }); },
    destroy() { try { map.remove(); } catch {} } };
}
function naverMap(nv, el) {
  const N = nv.maps, ll = (a, b) => new N.LatLng(a, b); let items = [];
  const map = new N.Map(el, { center: ll(36.4, 127.9), zoom: 7, zoomControl: true, zoomControlOptions: { position: N.Position.TOP_LEFT } });
  return { kind: 'naver',
    clear() { items.forEach(i => i.setMap(null)); items = []; },
    pin(lat, lng, node, front) { items.push(new N.Marker({ position: ll(lat, lng), map, zIndex: front ? 200 : 100, icon: { content: `<div class="pin" style="width:56px;height:64px">${node.outerHTML}</div>`, anchor: new N.Point(28, 60) } })); },
    circle(lat, lng, r, color) { items.push(new N.Circle({ map, center: ll(lat, lng), radius: r, strokeColor: color, strokeWeight: 1, fillColor: color, fillOpacity: 0.12 })); },
    view(lat, lng, z) { map.setCenter(ll(lat, lng)); if (map.getZoom() < z) map.setZoom(z); },
    fit(pts) { const la = pts.map(p => p[0]), ln = pts.map(p => p[1]); map.fitBounds(new N.LatLngBounds(ll(Math.min(...la), Math.min(...ln)), ll(Math.max(...la), Math.max(...ln))), { top: 80, right: 60, bottom: 40, left: 60 }); if (map.getZoom() > 16) map.setZoom(16); },
    destroy() { try { map.destroy(); } catch {} } };
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
  let alive = true, map = null, naverId = '', pings = {}, fitted = false, lastId = '', busy = false;
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
    // 처음 잡히는 위치는 기지국 기준이라 수백~수천 m씩 틀릴 수 있다. GPS가 잡힐 때까지 최대 20초 동안 계속 받아서 가장 정확한 값을 쓴다
    const GOOD = 30, OK = 150, MAX_WAIT = 20000; let best = null, wid = 0, timer = 0, finished = false;
    const finish = async err => {
      if (finished) return; finished = true; navigator.geolocation.clearWatch(wid); clearTimeout(timer);
      if (!best) { done(); return toast(err && err.code === 1 ? '위치 권한이 꺼져 있어요. 브라우저 설정에서 이 사이트의 위치를 허용해 주세요' : '위치를 찾지 못했어요. 밖이나 창가에서 다시 해보세요', 4000); }
      const acc = Math.round(best.coords.accuracy || 0);
      try { await ctx.store.push('loc/pings', { by: ctx.uid, lat: +best.coords.latitude.toFixed(6), lng: +best.coords.longitude.toFixed(6), acc, msg: msg.value.trim(), ts: ctx.store.now() }); msg.value = '';
        if (acc > 500) modal({ title: '위치가 대략적으로만 잡혔어요', body: h('div', null, h('p', null, `오차가 약 ${acc.toLocaleString()}m예요. 핑은 찍었지만 실제 위치와 많이 다를 수 있어요.`), h('p', { class: 'dim' }, '정확하게 하려면: ① 폰 설정 → 위치를 켜고 ② 설정 → 애플리케이션 → Chrome(또는 카피두리) → 권한 → 위치에서 "정확한 위치 사용"을 켜 주세요. 아이폰은 설정 → 개인정보 보호 → 위치 서비스 → Safari 웹사이트 → "정확한 위치". 실내 깊은 곳이면 창가나 밖에서 다시 찍어 보세요.')), actions: [{ label: '확인', primary: true }] });
        else toast(acc > OK ? `핑을 찍었어요 (오차 약 ${acc}m · 창가나 밖에서 찍으면 더 정확해요)` : `핑을 찍었어요 (오차 약 ${acc}m)`, 2600);
      } catch { toast('핑을 저장하지 못했어요'); }
      done();
    };
    const t0 = Date.now();
    wid = navigator.geolocation.watchPosition(p => {
      if (!best || (p.coords.accuracy || 1e9) < (best.coords.accuracy || 1e9)) best = p;
      const acc = Math.round(best.coords.accuracy || 0); pingBtn.textContent = `위치 잡는 중… 오차 ${acc.toLocaleString()}m`;
      if (acc <= GOOD || (acc <= OK && Date.now() - t0 > 8000)) finish();
    }, e => { if (e.code === 1 || !best) finish(e); }, { enableHighAccuracy: true, timeout: MAX_WAIT, maximumAge: 0 });
    timer = setTimeout(() => finish(), MAX_WAIT);
  }
  const latest = () => { const out = {}; for (const id of Object.keys(pings).sort()) out[pings[id].by] = { id, ...pings[id] }; return out; };
  const pinEl = uid => h('div', { class: 'pin-in' + (uid === ctx.uid ? ' me' : '') }, h('span', { class: 'pin-face', html: capy(ctx.capyOf(uid, { head: true, face: 'happy' })) }), h('b', null, ctx.nameOf(uid)));

  function draw(move) {
    const now = ctx.store.now(), last = latest(), ids = Object.keys(pings).sort().reverse(), mine = last[ctx.uid], pid = ctx.partnerId, theirs = pid && last[pid];
    info.replaceChildren(...[
      mine && theirs && h('p', { class: 'between' }, '둘 사이 ', h('b', null, nice(distM(mine, theirs))), h('small', { class: 'dim' }, ' (각자 마지막 핑 기준)')),
      ...ctx.order.map(u => { const p = last[u], nm = ctx.nameOf(u);
        // 이름줄 아래에 [보기 · 네이버지도 · 카카오맵] 버튼을 한 줄로
        const pin = (fill, dot) => `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2.5c-4 0-7 3-7 6.9 0 5 7 12.1 7 12.1s7-7.1 7-12.1c0-3.9-3-6.9-7-6.9z" fill="${fill}"/><circle cx="12" cy="9.4" r="2.8" fill="${dot}"/></svg>`;
        return h('div', { class: 'loc-row' },
          h('div', { class: 'loc-who' }, h('span', { class: 'capy mini', html: capy(ctx.capyOf(u, { head: true })) }),
            h('div', { class: 'grow' }, h('b', null, nm), p ? h('small', null, ` ${ago(p.ts, now)}${p.msg ? ' · “' + p.msg + '”' : ''}`) : h('small', { class: 'dim' }, ' 아직 핑이 없어요'))),
          p && h('div', { class: 'loc-btns' },
            h('button', { class: 'lb see', onClick: () => map && map.view(p.lat, p.lng, 16) }, h('i', { html: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="10.5" cy="10.5" r="6" fill="none" stroke="#6A4A32" stroke-width="2.6"/><path d="M15 15l5 5" stroke="#6A4A32" stroke-width="2.8" stroke-linecap="round"/></svg>' }), '보기'),
            h('a', { class: 'lb naver', href: `nmap://place?lat=${p.lat}&lng=${p.lng}&name=${encodeURIComponent(nm + ' 위치')}&appname=hyunming9999-hash.github.io` }, h('i', { html: pin('#fff', '#03C75A') }), '네이버지도'),
            h('a', { class: 'lb kakao', href: `https://map.kakao.com/link/map/${encodeURIComponent(nm + ' 위치')},${p.lat},${p.lng}`, target: '_blank', rel: 'noopener' }, h('i', { html: pin('#3A1D1D', '#FEE500') }), '카카오맵'))); })].filter(Boolean));
    hist.replaceChildren(...(ids.length ? ids.slice(0, 10).map(id => { const p = pings[id]; return h('li', { onClick: () => map && map.view(p.lat, p.lng, 16) }, h('b', null, ctx.nameOf(p.by)), h('small', null, ' ' + ago(p.ts, now)), p.msg && h('span', null, ' · ' + p.msg), h('small', { class: 'dim' }, p.acc ? (p.acc > 500 ? ` (대략적인 위치 · 오차 약 ${p.acc.toLocaleString()}m)` : ` (오차 약 ${p.acc}m)`) : '')); })
      : [h('li', { class: 'dim' }, '아직 찍은 핑이 없어요')]));
    if (!map) return;
    map.clear();
    const pts = [];
    for (const [u, p] of Object.entries(last)) {
      if (!ctx.members[u]) continue; pts.push([p.lat, p.lng]);
      if (p.acc > 25) map.circle(p.lat, p.lng, Math.min(p.acc, 3000), u === ctx.uid ? '#D9960F' : '#E8567A');
      map.pin(p.lat, p.lng, pinEl(u), u !== ctx.uid);
    }
    const newest = ids[0] || '';
    if (pts.length && (!fitted || (move && newest !== lastId))) {
      if (pts.length > 1) map.fit(pts); else map.view(pts[0][0], pts[0][1], 15); // 둘 다 찍었으면 둘이 한 화면에 보이게
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

  // 지도 준비: 네이버 지도 ID가 있으면 먼저 시도하고, 안 되면 기본 지도로
  async function useOsm(why) {
    if (!alive) return; if (why) toast(why, 4500);
    try { const L = await loadLeaflet(); if (!alive) return; map && map.destroy(); mapEl.replaceChildren(); map = osmMap(L, mapEl); fitted = false; draw(true); }
    catch (e) { mapEl.replaceChildren(h('p', { class: 'map-wait' }, e.message)); }
  }
  async function startMap() {
    try { naverId = (await ctx.store.get('meta/naverMapId')) || ''; } catch { naverId = ''; }
    mapKind.textContent = naverId ? '네이버 지도 설정' : '네이버 지도 연결';
    if (!naverId) return useOsm();
    window.__capyNaverFail = () => { if (alive && map && map.kind === 'naver') useOsm('네이버 지도 인증에 실패해서 기본 지도로 보여드려요'); };
    try { const nv = await loadNaver(naverId); if (!alive) return; mapEl.replaceChildren(); map = naverMap(nv, mapEl); fitted = false; draw(true); }
    catch (e) { useOsm(e.message + ' 기본 지도로 보여드려요.'); }
  }
  function naverSetup() {
    const inp = h('input', { class: 'inp', placeholder: 'Client ID 붙여넣기', value: naverId, autocomplete: 'off', spellcheck: false, maxLength: 60 });
    modal({ title: '네이버 지도 연결', body: h('div', { class: 'help' },
      h('p', null, '네이버 클라우드 플랫폼에서 지도 Client ID를 발급받아 넣으면, 이 화면의 지도가 네이버 지도로 바뀌어요.'),
      h('p', null, h('b', null, '1. '), h('a', { href: 'https://www.ncloud.com/', target: '_blank', rel: 'noopener' }, '네이버 클라우드 플랫폼'), ' 가입 후 콘솔 → Maps → Application 등록'),
      h('p', null, h('b', null, '2. '), 'Web Dynamic Map 선택, Web 서비스 URL에 아래 주소 입력'),
      h('input', { class: 'inp code', readOnly: true, value: SITE, onClick: e => e.target.select() }),
      h('p', null, h('b', null, '3. '), '발급된 Client ID를 아래에 붙여넣기'), inp,
      h('p', { class: 'dim' }, 'ID는 둘의 방에만 저장돼요. 무료 이용량을 넘으면 요금이 나갈 수 있으니 콘솔에서 이용 한도를 걸어 두세요.')),
      actions: [naverId ? { label: '연결 끊기', danger: true, onClick: async c => { await ctx.store.remove('meta/naverMapId').catch(() => {}); c(); location.reload(); } } : { label: '취소' },
        { label: '저장', primary: true, onClick: async c => { const v = inp.value.trim(); if (!/^[\w-]{6,60}$/.test(v)) return toast('Client ID를 다시 확인해 주세요'); await ctx.store.set('meta/naverMapId', v).catch(() => {}); c(); location.reload(); } }] });
  }
  const mapKind = h('button', { class: 'link', onClick: naverSetup }, '네이버 지도 연결');
  el.append(h('div', { class: 'center' }, mapKind));
  startMap();

  const off = ctx.store.on('loc/pings', v => { pings = v || {}; draw(true); }, { limit: 30 });
  const tick = setInterval(() => draw(false), 30000);
  return () => { alive = false; off(); clearInterval(tick); window.__capyNaverFail = null; map && map.destroy(); };
}
