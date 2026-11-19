// 카피수족관(시험판): 잡은 물고기를 실제 크기(cm) 그대로 넣어 구경한다. 물고기는 꼬리를 흔들고, 방향을 틀고, 돌진하고, 잠도 자고, 서로 부딪히면 비켜 간다.
// 관람석(A안): 동물 친구들이 벤치에 앉아 귀한 물고기(S급·초희귀·이로치)가 지나가면 감탄하고 관람료 1코인을 낸다(동물마다 하루 3번까지)
import { h } from './ui.js';
import { FISH, fishSvg, SHINY_IDS } from './fishing.js';
import { ANIMALS, animalSvg } from './animals.js';
import { sfx } from './sound.js';

export const TANKS = [null, { n: '초급 수족관', w: 3, h: 1.5, v: 1.5, max: 20, cap: 40, price: 2000 }, { n: '중급 수족관', w: 12, h: 10, v: 6, max: 40, cap: 0, price: 6000 }, { n: '고급 수족관', w: 24, h: 10, v: 6, max: 60, cap: 0, price: 10000 }]; // cap: 넣을 수 있는 몸길이(cm), 0은 제한 없음
export const FEE_MAX = 3; // 관람료: 동물 한 마리당 하루 최대 3번, 한 번에 1코인
const FISH_FILL = 0.86; // 물고기 그림에서 몸이 차지하는 가로 비율
const rnd = (a, b) => a + Math.random() * (b - a), pick = a => a[Math.floor(Math.random() * a.length)];
export const isRare = f => f.g === 'S' || f.tier >= 4 || f.shiny; // 관람료를 받는 귀한 물고기
const glowOf = f => (f.shiny && (f.tier >= 4 || f.g === 'S') ? 'ss' : f.shiny ? 's' : f.g === 'S' || f.tier >= 4 ? 'g' : '');
const WOW = ['우와… 눈부셔!!', '저거 봐 저거!', '반짝반짝해!', '진짜 크다…!', '나 여기서 살래', '심장이 두근두근해'];

// 시험판 물고기: 수족관 등급에 맞춰 실제 물고기 자료로 채운다(귀한 물고기도 섞어서)
export function demoFish(t) {
  const T = TANKS[t], pool = FISH.filter(f => f.cm && !f.pearl && !f.icon && (t === 1 ? f.z === 1 : true)), out = [];
  const add = (f, o = {}) => { const cm = Math.round(o.cm || rnd(f.cm[0], f.cm[1])); if (T.cap && cm > T.cap) return; out.push({ id: f.id, cm, g: o.g || pick(['A', 'B', 'B', 'C', 'C', 'D']), shiny: !!o.shiny }); };
  if (t >= 2) { add(FISH.find(f => f.id === 'f3-28'), { cm: 820, shiny: true }); add(FISH.find(f => f.id === 'f3-29'), { cm: 560, g: 'S' }); }
  const shinies = pool.filter(f => SHINY_IDS.has(f.id)), ultra = pool.filter(f => f.tier >= 4 && !f.king);
  for (let k = 0; k < (t === 1 ? 2 : 3); k++) add(pick(shinies), { shiny: true });
  for (let k = 0; k < (t === 1 ? 1 : 3); k++) add(pick(ultra.length ? ultra : pool));
  add(pick(pool), { g: 'S' });
  const small = pool.filter(f => !f.king && (t === 3 ? true : f.z <= t));
  while (out.length < T.max) add(pick(small));
  return out.slice(0, T.max);
}

// o = { tank: 1~3, fish: [{id, cm, g, shiny}], animals: [동물 번호], test, onClose }
export function openAquarium(o) {
  let tank = o.tank || 3, zoom = 1, raf = 0, last = performance.now(), alive = true, fee = 0, reactAt = 0;
  const seats = o.animals || shuffle(ANIMALS.map((_, i) => i)).slice(0, 5), feeN = {};
  const view = h('div', { class: 'aq-view' }), world = h('div', { class: 'aq-world' }), bg = h('div', { class: 'aq-bg' }), layer = h('div', { class: 'aq-fishes' });
  world.append(bg, layer); view.append(world);
  const tip = h('div', { class: 'aq-tip', hidden: true }), info = h('div', { class: 'aq-info' });
  const room = h('div', { class: 'aq-room' }), zoomL = h('b', null, '');
  const tabs = h('div', { class: 'aq-tabs' }, ...[1, 2, 3].map(t => h('button', { class: 'aq-tab', 'data-t': t, onClick: () => { tank = t; build(o.test ? demoFish(t) : o.fish); } }, TANKS[t].n.replace(' 수족관', ''))));
  const root = h('div', { class: 'aq' },
    h('div', { class: 'aq-top' }, h('button', { class: 'aq-x', onClick: close, 'aria-label': '닫기' }, '✕'), h('div', { class: 'aq-title' }, h('b', null, '🐠 카피수족관'), o.test && h('small', null, '시험판 · 저장되지 않아요')),
      h('div', { class: 'aq-zoom' }, h('button', { onClick: () => setZoom(zoom / 1.5) }, '－'), zoomL, h('button', { onClick: () => setZoom(zoom * 1.5) }, '＋'))),
    h('div', { class: 'aq-frame' }, view, tip), room);
  root.querySelector('.aq-title').append(info); if (o.test) root.querySelector('.aq-top').insertBefore(tabs, root.querySelector('.aq-zoom'));
  document.body.append(root);
  let fish = [], W = 1, H = 1, ppm = 1; // ppm: 1m당 픽셀

  function shuffle(a) { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }
  // 화면 가로에 6m(작은 수족관은 전체)가 들어오는 비율이 기본(×1). －로 줄이면 수족관 전체, ＋로 키우면 작은 물고기까지 또렷하게
  let base = 60, zMin = 1;
  function layout(keep) { const T = TANKS[tank], vw = Math.max(200, root.clientWidth - 16 - 18), cx = keep ? (view.scrollLeft + view.clientWidth / 2) / (W * ppm) : 0.5, cy = keep ? (view.scrollTop + view.clientHeight / 2) / (H * ppm) : 0.5;
    // 가로 화면 전용: 수족관 높이를 화면 높이에 맞춘다(작은 수족관은 작게 보여서 크기 차이가 그대로 느껴진다)
    const avail = Math.max(140, root.clientHeight - 24 - room.clientHeight + 10); view.style.height = avail + 'px'; // 위 버튼줄 자리까지 전부 수족관
    W = T.w; H = T.h; base = Math.min(avail / T.v, vw / Math.min(W, 2.2)); zMin = Math.min(1, avail / (H * base)); // 화면에는 v미터 높이가 보이고 그 위는 위로 밀어서 본다. 가장 작게 줄이면 높이 전체가 한눈에
    ppm = base * zoom; world.style.width = W * ppm + 'px'; world.style.height = H * ppm + 'px'; world.style.marginTop = Math.max(0, view.clientHeight - H * ppm) + 'px'; view.parentNode.style.width = Math.min(vw, W * ppm) + 18 + 'px'; // 작은 수족관은 유리도 작게
    const seg = H * ppm * (456 / 362), side = H * ppm * (360 / 362), n = Math.max(1, Math.round((W * ppm - 2 * side) / seg)), mids = n % 2 ? n : n + 1;
    // 물 배경: 가운데는 이음매 없이 이어지는 물 그림을 옆으로 반복, 양 끝에 산호 그림을 겹쳐 스르르 이어 붙인다
    if (W * ppm < 2 * side + seg) bg.replaceChildren(h('img', { src: 'img/aqua/full.webp', alt: '', class: 'one' }));
    else bg.replaceChildren(h('div', { class: 'aq-tile' }), h('img', { src: 'img/aqua/l.webp', alt: '', class: 'endl' }), h('img', { src: 'img/aqua/r.webp', alt: '', class: 'endr' }));
    zoomL.textContent = zoom <= zMin + 0.01 && zMin < 1 ? '전체' : `×${zoom.toFixed(zoom < 2 ? 1 : 0)}`;
    fish.forEach(f => { f.lw = 0; }); view.scrollLeft = cx * W * ppm - view.clientWidth / 2; view.scrollTop = keep ? cy * H * ppm - view.clientHeight / 2 : H * ppm; }
  function setZoom(z) { zoom = Math.max(zMin, Math.min(6, z)); if (Math.abs(zoom - 1) < 0.08) zoom = 1; layout(true); }
  // 원근: 깊이 z(0 앞 ~ 1 뒤)만큼 작고 흐리게. 크기가 바뀔 때만 다시 잰다
  const scOf = f => 1 - 0.5 * f.z, hOf = f => f.len * 0.62 * scOf(f);
  function sizeFish(f) { const w = f.len * ppm / FISH_FILL * scOf(f); if (Math.abs(w - (f.lw || 0)) < 0.6) return; f.lw = w; f.el.style.width = w + 'px'; f.el.style.height = w * 2 / 3 + 'px'; f.zz.style.fontSize = Math.max(12, Math.min(40, w * 0.18)) + 'px'; }
  function build(list) {
    layer.replaceChildren(); [...tabs.children].forEach(b => b.classList.toggle('on', +b.dataset.t === tank)); zoom = 1;
    const T = TANKS[tank]; W = T.w; H = T.h;
    fish = list.map(d => { const f0 = FISH.find(x => x.id === d.id); if (!f0) return null; const len = d.cm / 100, f = { d, f0, len, hgt: len * 0.45, tier: f0.tier || 1, g: d.g, shiny: d.shiny, x: rnd(len / 2, Math.max(len / 2 + 0.01, W - len / 2)), y: rnd(H * 0.15, H * 0.7), dir: Math.random() < 0.5 ? -1 : 1, vy: 0, ty: 0, st: 'swim', stT: rnd(2, 6), sp: 1, turnT: 0 };
      f.base = 0.12 + 0.3 * Math.sqrt(len); f.ty = f.y; f.z = f.tz = Math.random(); f.dq = -1;
      f.body = h('div', { class: 'aq-fb', html: fishSvg(f0, false, d.shiny), style: { animationDuration: rnd(0.45, 0.7) + 's' } });
      f.zz = h('span', { class: 'aq-zz' }, 'Z z'); f.el = h('div', { class: 'aq-f ' + glowOf(f) }, f.body, f.zz);
      f.el.onclick = e => { e.stopPropagation(); showTip(f); }; layer.append(f.el); return f; }).filter(Boolean);
        layout(false); drawRoom(); drawInfo(); }
  function showTip(f) { const T = ['', '흔함', '보기 힘듦', '희귀', '초희귀'][f.tier] || ''; tip.innerHTML = `${f.shiny ? '✨ 이로치 ' : ''}<b>${f.f0.name}</b> · ${f.g}급 · ${f.d.cm}cm <small>${T}${f.st === 'sleep' ? ' · 쿨쿨 자는 중' : ''}</small>`; tip.hidden = false; clearTimeout(showTip.t); showTip.t = setTimeout(() => { tip.hidden = true; }, 2600); }
  view.onclick = () => { tip.hidden = true; };

  // ----- 관람석: 벤치 두 개에 동물이 앉는다(왼쪽 벤치 10~29%, 오른쪽 71~90%) -----
  const SEAT_X = [13, 20.5, 28, 0, 76.5, 84];
  function drawRoom() { room.replaceChildren(...seats.slice(0, 5).map((i, k) => { const e = h('div', { class: 'aq-an', style: { left: SEAT_X[k + (k >= 3 ? 1 : 0)] + '%' } }, h('span', { class: 'aq-anf', html: animalSvg(i, false) })); e.dataset.i = i; return e; })); }
  function react() { const rare = fish.filter(f => isRare(f) && inView(f)); if (!rare.length) return; const f = pick(rare), seatsEl = [...room.children]; if (!seatsEl.length) return;
    const e = pick(seatsEl), i = +e.dataset.i, face = e.querySelector('.aq-anf'); face.innerHTML = animalSvg(i, false, Math.random() < 0.5 ? 'wow' : 'love'); e.classList.remove('wow'); void e.offsetWidth; e.classList.add('wow');
    const say = h('div', { class: 'aq-say' }, Math.random() < 0.5 ? `${f.shiny ? '이로치 ' : ''}${f.f0.name}다!!` : pick(WOW)); e.append(say);
    if ((feeN[i] || 0) < FEE_MAX) { feeN[i] = (feeN[i] || 0) + 1; fee++; const c = h('div', { class: 'aq-coin' }, '+1🪙'); e.append(c); setTimeout(() => c.remove(), 1500); sfx('coin'); drawInfo(); }
    setTimeout(() => { say.remove(); face.innerHTML = animalSvg(i, false); e.classList.remove('wow'); }, 2200); }
  function inView(f) { const x = f.x * ppm, y = f.y * ppm; return x > view.scrollLeft - 20 && x < view.scrollLeft + view.clientWidth + 20 && y > view.scrollTop - 20 && y < view.scrollTop + view.clientHeight + 20; }
  function drawInfo() { const rare = fish.filter(isRare).length, T = TANKS[tank]; info.innerHTML = `${T.n} ${T.w}m×${T.h}m · ${fish.length}/${T.max}마리${T.cap ? ` · ${T.cap}cm까지` : ''} · 귀한 물고기 ${rare} · 관람료 ${fee}🪙${o.test ? ' (시험판)' : ''}`; }

  // ----- 물고기 움직임: 헤엄 → 가끔 방향 틀기·돌진·잠 · 벽에서 돌아서고 · 서로 겹치면 작은 쪽이 비켜 간다 -----
  function step(dt) {
    for (const f of fish) {
      f.stT -= dt; f.turnT = Math.max(0, f.turnT - dt);
      if (f.stT <= 0) { const r = Math.random();
        if (f.st !== 'swim') setSt(f, 'swim', rnd(3, 8));
        else if (r < 0.12) setSt(f, 'dash', rnd(0.5, 0.9));
        else if (r < 0.2) setSt(f, 'sleep', rnd(6, 12));
        else if (r < 0.42) { turn(f); f.stT = rnd(2, 6); }
        else if (r < 0.7) { f.tz = rnd(0, 1); f.stT = rnd(3, 7); } // 앞뒤로 오가기
        else { f.ty = rnd(H * 0.05, H * 0.85); f.stT = rnd(2, 6); } }
      const sp = f.base * (f.st === 'dash' ? 3.4 : f.st === 'sleep' ? 0.08 : 1);
      f.x += f.dir * sp * dt;
      f.z += (f.tz - f.z) * Math.min(1, dt * 0.35); const hg = hOf(f), lo = hg / 2 + H * 0.03, hi = H * (0.9 - 0.12 * f.z) - hg / 2, ty = f.st === 'sleep' ? hi - hg * 0.1 : f.ty;
      f.vy += ((Math.max(lo, Math.min(hi, ty)) - f.y) * 0.6 - f.vy) * Math.min(1, dt * 2); f.y += f.vy * dt;
      if (f.x < f.len / 2 && f.dir < 0 || f.x > W - f.len / 2 && f.dir > 0) turn(f, true);
      f.x = Math.max(f.len / 2 - 0.01, Math.min(W - f.len / 2 + 0.01, f.x)); }
    // 부딪힘: 몸통 상자가 겹치면 작은 물고기가 위아래로 비키고, 마주 보고 오면 방향을 튼다
    for (let a = 0; a < fish.length; a++) for (let b = a + 1; b < fish.length; b++) { const A = fish[a], B = fish[b], dx = B.x - A.x, dy = B.y - A.y;
      if (Math.abs(A.z - B.z) < 0.22 && Math.abs(dx) < (A.len * scOf(A) + B.len * scOf(B)) * 0.4 && Math.abs(dy) < (hOf(A) + hOf(B)) * 0.4) { const s = A.len < B.len ? A : B, big = s === A ? B : A, away = s.y < big.y ? -1 : 1;
        s.ty = Math.max(H * 0.05, Math.min(H * 0.85, big.y + away * (hOf(big) * 0.6 + hOf(s)))); if (Math.random() < 0.01) s.tz = Math.max(0, Math.min(1, s.z + (s.z < big.z ? -0.3 : 0.3))); s.vy += away * 0.4 * s.base;
        if (s.dir !== big.dir && Math.sign(big.x - s.x) === s.dir && !s.turnT && Math.random() < 0.02) turn(s);
        if (s.st === 'sleep') setSt(s, 'swim', rnd(2, 4)); } } }
  function setSt(f, st, t) { f.st = st; f.stT = t; f.el.classList.toggle('dash', st === 'dash'); f.el.classList.toggle('sleep', st === 'sleep'); if (st === 'dash') bubbles(f); }
  // 방향 바꾸기: 종이처럼 뒤집지 않고, 예전 방향 모습이 스르르 사라지면서 새 방향 모습이 나타나고 몸이 살짝 기울며 돈다
  function turn(f, wall) { if (f.turnT && !wall) return; f.turnT = 0.9;
    const g = f.body.cloneNode(true); g.classList.add('aq-ghost'); f.el.append(g); setTimeout(() => g.remove(), 650);
    f.dir *= -1; f.body.classList.remove('aq-in'); void f.body.offsetWidth; f.body.classList.add('aq-in'); f.el.classList.remove('turn'); void f.el.offsetWidth; f.el.classList.add('turn'); }
  function bubbles(f) { for (let k = 0; k < 4; k++) { const b = h('i', { class: 'aq-bub', style: { zIndex: f.el.style.zIndex, left: (f.x - f.dir * f.len * scOf(f) * 0.45) * ppm + 'px', top: (f.y + rnd(-0.1, 0.1) * hOf(f)) * ppm + 'px', animationDelay: k * 0.08 + 's' } }); layer.append(b); setTimeout(() => b.remove(), 1400); } }
  function draw() { for (const f of fish) { sizeFish(f); const w = f.lw; const q = Math.round(f.z * 20); if (q !== f.dq) { f.dq = q; const z = q / 20; f.el.style.zIndex = 100 + Math.round((1 - z) * 800); f.el.style.opacity = (1 - 0.3 * z).toFixed(2); f.el.style.setProperty('--dz', `brightness(${(1 - 0.12 * z).toFixed(2)}) saturate(${(1 - 0.35 * z).toFixed(2)}) hue-rotate(${(z * 12).toFixed(0)}deg)`); } f.el.style.transform = `translate(${(f.x * ppm - w / 2).toFixed(1)}px, ${(f.y * ppm - w / 3).toFixed(1)}px)`; f.body.style.transform = f.dir > 0 ? 'scaleX(-1)' : ''; } }
  function loop(t) { if (!alive) return; const dt = Math.min(0.05, (t - last) / 1000); last = t; step(dt); draw(); if (t > reactAt) { reactAt = t + rnd(2500, 5000); react(); } raf = requestAnimationFrame(loop); }
  // 두 손가락으로 확대·축소
  let pinch = null; view.addEventListener('touchstart', e => { if (e.touches.length === 2) pinch = { d: Math.hypot(e.touches[0].clientX - e.touches[1].clientX, e.touches[0].clientY - e.touches[1].clientY), z: zoom }; }, { passive: true });
  view.addEventListener('touchmove', e => { if (pinch && e.touches.length === 2) { const d = Math.hypot(e.touches[0].clientX - e.touches[1].clientX, e.touches[0].clientY - e.touches[1].clientY); const z = Math.max(zMin, Math.min(6, pinch.z * d / pinch.d)); if (Math.abs(z - zoom) > 0.05) { zoom = z; layout(true); } } }, { passive: true });
  view.addEventListener('touchend', () => { pinch = null; });
  const orient = () => { const port = window.innerHeight > window.innerWidth; root.classList.toggle('rot', port); root.style.width = (port ? window.innerHeight : window.innerWidth) + 'px'; root.style.height = (port ? window.innerWidth : window.innerHeight) + 'px'; };
  const onResize = () => { orient(); layout(true); }; window.addEventListener('resize', onResize);
  function close() { try { screen.orientation && screen.orientation.unlock && screen.orientation.unlock(); } catch {} alive = false; cancelAnimationFrame(raf); window.removeEventListener('resize', onResize); root.remove(); o.onClose && o.onClose(); }
  orient(); try { if (screen.orientation && screen.orientation.lock) screen.orientation.lock('landscape').catch(() => {}); } catch {} // 폰이 세로여도 화면을 눕혀서 가로로 보여 준다
  requestAnimationFrame(() => { build(o.test ? demoFish(tank) : o.fish || []); raf = requestAnimationFrame(loop); });
  return { close };
}
