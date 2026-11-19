// 카피수족관(시험판): 잡은 물고기를 실제 크기(cm) 그대로 넣어 구경한다. 물고기는 꼬리를 흔들고, 방향을 틀고, 돌진하고, 잠도 자고, 서로 부딪히면 비켜 간다.
// 관람석(A안): 동물 친구들이 벤치에 앉아 귀한 물고기(S급·초희귀·이로치)가 지나가면 감탄하고 관람료 1코인을 낸다(동물마다 하루 3번까지)
import { h } from './ui.js';
import { FISH, fishSvg, SHINY_IDS } from './fishing.js';
import { ANIMALS, animalBackSvg } from './animals.js';
import { sfx } from './sound.js';

export const TANKS = [null, { n: '초급 수족관', w: 3, h: 1.5, v: 1.5, max: 20, cap: 40, price: 2000 }, { n: '중급 수족관', w: 24, h: 10, v: 6, max: 40, cap: 0, price: 6000 }, { n: '고급 수족관', w: 24, h: 10, v: 6, max: 60, cap: 0, price: 10000 }]; // cap: 넣을 수 있는 몸길이(cm), 0은 제한 없음
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
  while (out.length < T.max - 8) add(pick(small)); // 시험판: 풀어넣기를 해 볼 수 있게 8자리 비워 둔다
  return out.slice(0, T.max - 8);
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
  // 놀러가기: 내 수족관 ↔ 상대 수족관. 상대 수족관은 구경만(풀어넣기·이름 붙이기 없음)
  let mode = 'me'; const meName = o.me || '나', palName = o.partner || '두두', titleB = root.querySelector('.aq-title b');
  const visit = h('div', { class: 'aq-visit' }, ...[['me', `🏠 내 수족관`], ['pal', `🐾 ${palName}네 놀러가기`]].map(([k, l]) => h('button', { class: 'aq-vt' + (k === 'me' ? ' on' : ''), 'data-k': k, onClick: () => goMode(k) }, l)));
  root.querySelector('.aq-top').append(visit);
  async function goMode(k) { if (k === mode) return; mode = k; [...visit.children].forEach(b => b.classList.toggle('on', b.dataset.k === k)); panel.hidden = true; tip.hidden = true;
    root.classList.toggle('pal', k === 'pal'); titleB.textContent = k === 'pal' ? `🐾 ${palName}의 수족관` : `🐠 ${meName}의 수족관`;
    if (k === 'pal') { const pd = o.test ? { tank: 3, fish: demoFish(3).map(d => ({ ...d, name: Math.random() < 0.15 ? pick(['콩이', '뽀삐', '두부', '별님', '방울']) : '' })) } : await (o.loadPartner ? o.loadPartner() : null); if (!pd) { titleB.textContent = `${palName}는 아직 수족관이 없어요`; fish = []; layer.replaceChildren(); return; } myTank = tank; tank = pd.tank; build(pd.fish); }
    else { tank = myTank; build(o.test ? demoFish(tank) : o.fish); } }
  let myTank = tank; titleB.textContent = `🐠 ${meName}의 수족관`;
  // 수족관 크기 버튼(시험판)과 확대·축소는 유리 오른쪽 아래 구석에
  root.querySelector('.aq-title').append(info); const bot = h('div', { class: 'aq-bot' }); if (o.test) bot.append(tabs); bot.append(root.querySelector('.aq-zoom')); root.querySelector('.aq-frame').append(bot);
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
  const scOf = f => (f.z >= 0 ? 1 - 0.5 * f.z : 1 - f.z * (f.near - 1)), // z: -1(유리 바로 앞) ~ 0 ~ 1(맨 뒤). 작은 물고기일수록 앞으로 오면 많이 커진다
    hOf = f => f.len * 0.62 * scOf(f);
  // 렉 줄이기: 크기는 수족관 비율이 바뀔 때만 한 번 정하고, 앞뒤 크기 변화는 transform scale로만(다시 그리지 않음)
  function sizeFish(f) { const w = f.len * ppm / FISH_FILL; if (Math.abs(w - (f.lw || 0)) < 0.6) return; f.lw = w; f.el.style.width = w + 'px'; f.el.style.height = w * 2 / 3 + 'px'; f.zz.style.fontSize = Math.max(12, Math.min(40, w * 0.18)) + 'px'; f.tag.style.fontSize = Math.max(10, Math.min(18, w * 0.12)) + 'px'; }
  function build(list) {
    layer.replaceChildren(); [...tabs.children].forEach(b => b.classList.toggle('on', +b.dataset.t === tank)); zoom = 1;
    const T = TANKS[tank]; W = T.w; H = T.h;
    fish = list.map(d => makeFish(d)).filter(Boolean);
        layout(false); drawRoom(); drawInfo(); if (o.test) bag = demoBag(tank); drawBag(); }
  function makeFish(d, drop) { const f0 = FISH.find(x => x.id === d.id); if (!f0) return null; const len = d.cm / 100, f = { d, f0, len, hgt: len * 0.45, tier: f0.tier || 1, g: d.g, shiny: d.shiny, x: rnd(len / 2, Math.max(len / 2 + 0.01, W - len / 2)), y: rnd(H * 0.15, H * 0.7), dir: Math.random() < 0.5 ? -1 : 1, vy: 0, ty: 0, st: 'swim', stT: rnd(2, 6), sp: 1, turnT: 0 };
    f.base = 0.12 + 0.3 * Math.sqrt(len); f.ty = f.y; f.near = Math.min(3, Math.max(1.25, 0.9 / Math.sqrt(len))); f.z = f.tz = drop ? 0.1 : rnd(-0.8, 1); f.dq = -1; f.zT = rnd(1, 8);
    f.body = h('div', { class: 'aq-fb', html: fishSvg(f0, false, d.shiny), style: { animationDuration: rnd(0.45, 0.7) + 's' } });
    f.zz = h('span', { class: 'aq-zz' }, 'Z z'); f.tag = h('span', { class: 'aq-name', hidden: !d.name }, d.name || ''); f.el = h('div', { class: 'aq-f ' + glowOf(f) }, f.body, f.zz, f.tag);
    f.el.onclick = e => { e.stopPropagation(); showTip(f); }; layer.append(f.el);
    if (drop) { const vx = (view.scrollLeft + view.clientWidth / 2) / ppm, vy = view.scrollTop / ppm; f.x = Math.max(len / 2, Math.min(W - len / 2, vx + rnd(-1, 1))); f.y = Math.max(0, vy) + 0.1; f.ty = f.y + rnd(1, 2.5); f.vy = 1.5;
      const sp = h('div', { class: 'aq-splash', style: { left: f.x * ppm + 'px', top: Math.max(0, vy) * ppm + 'px' } }); layer.append(sp); setTimeout(() => sp.remove(), 1200); sfx('splash'); }
    return f; }
  // ----- 가방 물고기 풀어넣기 · 이름 붙이기 -----
  let bag = [];
  function demoBag(t) { return demoFish(3).filter(d => !(TANKS[t].cap && d.cm > TANKS[t].cap) || Math.random() < 0.3).slice(0, 9).map((d, k) => ({ ...d, key: 'b' + k })); }
  const panel = h('div', { class: 'aq-panel', hidden: true }), listEl = h('div', { class: 'aq-plist' });
  panel.append(h('div', { class: 'aq-phead' }, h('b', null, '🎒 내 물고기'), h('button', { class: 'aq-px', onClick: () => { panel.hidden = true; } }, '✕')), listEl);
  root.append(panel);
  const relBtn = h('button', { class: 'aq-rel', onClick: () => { panel.hidden = !panel.hidden; drawBag(); } }, '🐟 풀어넣기');
  root.querySelector('.aq-top').append(relBtn);
  function drawBag() { const T = TANKS[tank], full = fish.length >= T.max; relBtn.textContent = `🐟 풀어넣기 ${bag.length}`;
    listEl.replaceChildren(...(bag.length ? bag.map(d => { const f0 = FISH.find(x => x.id === d.id); if (!f0) return ''; const big = T.cap && d.cm > T.cap, no = full ? '수족관이 꽉 찼어요' : big ? `너무 커요 (${T.cap}cm까지)` : '';
      return h('div', { class: 'aq-prow' + (no ? ' off' : '') }, h('span', { class: 'aq-pic', html: fishSvg(f0, false, d.shiny) }), h('div', { class: 'aq-pn' }, h('b', null, `${d.shiny ? '✨ ' : ''}${d.name ? d.name + ' · ' : ''}${f0.name}`), h('small', null, `${d.g}급 · ${d.cm}cm${f0.tier >= 4 ? ' · 초희귀' : ''}`)),
        h('button', { class: 'aq-pbtn', disabled: !!no, onClick: () => release(d) }, no || '풀어넣기')); }) : [h('p', { class: 'aq-pnone' }, '가방에 물고기가 없어요. 낚시터에서 잡아 오세요.')])); }
  async function release(d) { if (o.release && !(await o.release(d))) return; bag = bag.filter(x => x !== d); const f = makeFish(d, true); if (f) { fish.push(f); sizeFish(f); } drawBag(); drawInfo(); }
  async function rename(f) { tip.replaceChildren(); const inp = h('input', { class: 'aq-nin', maxlength: 8, value: f.d.name || '', placeholder: `${f.f0.name} 이름` });
    const save = async () => { const nm = inp.value.trim().slice(0, 8); if (o.rename && !(await o.rename(f.d, nm))) return; f.d.name = nm; f.tag.textContent = nm; f.tag.hidden = !nm; tip.hidden = true; };
    inp.addEventListener('keydown', e => { if (e.key === 'Enter') save(); }); tip.append(h('span', null, '✏️ '), inp, h('button', { class: 'aq-nbtn', onClick: e => { e.stopPropagation(); save(); } }, '저장')); clearTimeout(showTip.t); tip.hidden = false; inp.focus(); }
  tip.onclick = e => e.stopPropagation();
  function showTip(f) { const T = ['', '흔함', '보기 힘듦', '희귀', '초희귀'][f.tier] || ''; tip.innerHTML = `${f.d.name ? `<b class="nm">「${f.d.name}」</b> ` : ''}${f.shiny ? '✨ 이로치 ' : ''}<b>${f.f0.name}</b> · ${f.g}급 · ${f.d.cm}cm <small>${T}${f.st === 'sleep' ? ' · 쿨쿨 자는 중' : ''}</small> `; if (mode === 'me') tip.append(h('button', { class: 'aq-nbtn', onClick: e => { e.stopPropagation(); rename(f); } }, f.d.name ? '✏️ 이름 바꾸기' : '✏️ 이름 붙이기')); tip.hidden = false; clearTimeout(showTip.t); showTip.t = setTimeout(() => { tip.hidden = true; }, 4000); }
  view.onclick = () => { tip.hidden = true; };

  // ----- 관람석: 벤치 두 개에 동물이 앉는다(왼쪽 벤치 10~29%, 오른쪽 71~90%) -----
  const SEAT_X = [13, 20.5, 28, 0, 76.5, 84];
  function drawRoom() { room.replaceChildren(...seats.slice(0, 5).map((i, k) => { const e = h('div', { class: 'aq-an', style: { left: SEAT_X[k + (k >= 3 ? 1 : 0)] + '%' } }, h('span', { class: 'aq-anf', html: animalBackSvg(i) })); e.dataset.i = i; return e; })); }
  function react() { const rare = fish.filter(f => isRare(f) && inView(f)); if (!rare.length) return; const f = pick(rare), seatsEl = [...room.children]; if (!seatsEl.length) return;
    const e = pick(seatsEl), i = +e.dataset.i; e.classList.remove('wow'); void e.offsetWidth; e.classList.add('wow'); const em = h('i', { class: 'aq-em' }, pick(['💖', '✨', '❗', '😍', '⭐'])); e.append(em); setTimeout(() => em.remove(), 1600);
    const say = h('div', { class: 'aq-say' }, Math.random() < 0.5 ? `${f.shiny ? '이로치 ' : ''}${f.f0.name}다!!` : pick(WOW)); e.append(say);
    if ((feeN[i] || 0) < FEE_MAX) { feeN[i] = (feeN[i] || 0) + 1; fee++; const c = h('div', { class: 'aq-coin' }, '+1🪙'); e.append(c); setTimeout(() => c.remove(), 1500); sfx('coin'); drawInfo(); }
    setTimeout(() => { say.remove(); e.classList.remove('wow'); }, 2200); }
  function inView(f) { const x = f.x * ppm, y = f.y * ppm; return x > view.scrollLeft - 20 && x < view.scrollLeft + view.clientWidth + 20 && y > view.scrollTop - 20 && y < view.scrollTop + view.clientHeight + 20; }
  function drawInfo() { const rare = fish.filter(isRare).length, T = TANKS[tank]; info.innerHTML = `${T.n} ${T.w}m×${T.h}m · ${fish.length}/${T.max}마리${T.cap ? ` · ${T.cap}cm까지` : ''} · 귀한 물고기 ${rare} · 관람료 ${fee}🪙${mode === 'pal' ? ' · 구경만 할 수 있어요' : ''}${o.test ? ' (시험판)' : ''}`; }

  // ----- 물고기 움직임: 헤엄 → 가끔 방향 틀기·돌진·잠 · 벽에서 돌아서고 · 서로 겹치면 작은 쪽이 비켜 간다 -----
  function step(dt) {
    for (const f of fish) {
      f.stT -= dt; f.turnT = Math.max(0, f.turnT - dt);
      if (f.stT <= 0) { const r = Math.random();
        if (f.st !== 'swim') setSt(f, 'swim', rnd(3, 8));
        else if (r < 0.12) setSt(f, 'dash', rnd(0.5, 0.9));
        else if (r < 0.2) setSt(f, 'sleep', rnd(6, 12));
        else if (r < 0.42) { turn(f); f.stT = rnd(2, 6); }
        else { f.ty = rnd(H * 0.05, H * 0.85); f.stT = rnd(2, 6); } }
      const sp = f.base * (f.st === 'dash' ? 3.4 : f.st === 'sleep' ? 0.08 : 1);
      f.x += f.dir * sp * dt;
      f.zT -= dt; if (f.zT <= 0) { f.zT = rnd(6, 14); f.tz = Math.random() < 0.65 ? (f.z < 0.2 ? rnd(0.45, 1) : rnd(-1, -0.15)) : rnd(-1, 1); } // 앞뒤로 오가기: 뒤에 있던 물고기는 앞으로, 앞에 있던 물고기는 뒤로
      { const dz = f.tz - f.z, vz = 0.12 + 0.08 * Math.min(1, f.base); f.z += Math.sign(dz) * Math.min(Math.abs(dz), vz * dt * (0.4 + Math.min(1, Math.abs(dz) * 3))); } const hg = hOf(f), lo = hg / 2 + H * 0.03, hi = Math.max(lo, H * Math.min(0.94, 0.9 - 0.12 * f.z) - hg / 2), ty = f.st === 'sleep' ? hi - hg * 0.1 : f.ty;
      f.vy += ((Math.max(lo, Math.min(hi, ty)) - f.y) * 0.6 - f.vy) * Math.min(1, dt * 2); f.y += f.vy * dt;
      if (f.x < f.len / 2 && f.dir < 0 || f.x > W - f.len / 2 && f.dir > 0) turn(f, true);
      f.x = Math.max(f.len / 2 - 0.01, Math.min(W - f.len / 2 + 0.01, f.x)); }
    // 부딪힘: 몸통 상자가 겹치면 작은 물고기가 위아래로 비키고, 마주 보고 오면 방향을 튼다
    for (let a = 0; a < fish.length; a++) for (let b = a + 1; b < fish.length; b++) { const A = fish[a], B = fish[b], dx = B.x - A.x, dy = B.y - A.y;
      if (Math.abs(A.z - B.z) < 0.3 && Math.abs(dx) < (A.len * scOf(A) + B.len * scOf(B)) * 0.4 && Math.abs(dy) < (hOf(A) + hOf(B)) * 0.4) { const s = A.len < B.len ? A : B, big = s === A ? B : A, away = s.y < big.y ? -1 : 1;
        s.ty = Math.max(H * 0.05, Math.min(H * 0.85, big.y + away * (hOf(big) * 0.6 + hOf(s)))); if (Math.random() < 0.01) s.tz = Math.max(-1, Math.min(1, s.z + (s.z < big.z ? -0.4 : 0.4))); s.vy += away * 0.4 * s.base;
        if (s.dir !== big.dir && Math.sign(big.x - s.x) === s.dir && !s.turnT && Math.random() < 0.02) turn(s);
        if (s.st === 'sleep') setSt(s, 'swim', rnd(2, 4)); } } }
  function setSt(f, st, t) { f.st = st; f.stT = t; f.el.classList.toggle('dash', st === 'dash'); f.el.classList.toggle('sleep', st === 'sleep'); if (st === 'dash') bubbles(f); }
  // 방향 바꾸기: 종이처럼 뒤집지 않고, 예전 방향 모습이 스르르 사라지면서 새 방향 모습이 나타나고 몸이 살짝 기울며 돈다
  function turn(f, wall) { if (f.turnT && !wall) return; f.turnT = 0.9;
    const g = f.body.cloneNode(true); g.classList.add('aq-ghost'); f.el.append(g); setTimeout(() => g.remove(), 650);
    f.dir *= -1; f.body.classList.remove('aq-in'); void f.body.offsetWidth; f.body.classList.add('aq-in'); f.el.classList.remove('turn'); void f.el.offsetWidth; f.el.classList.add('turn'); }
  function bubbles(f) { for (let k = 0; k < 4; k++) { const b = h('i', { class: 'aq-bub', style: { zIndex: f.el.style.zIndex, left: (f.x - f.dir * f.len * scOf(f) * 0.45) * ppm + 'px', top: (f.y + rnd(-0.1, 0.1) * hOf(f)) * ppm + 'px', animationDelay: k * 0.08 + 's' } }); layer.append(b); setTimeout(() => b.remove(), 1400); } }
  // 앞에 있는 물고기가 뒤 물고기를 가린다(반투명 없이 그대로 덮는다)
  // 화면 밖 물고기는 위치만 계산하고 그리지 않는다(꼬리 흔들기도 멈춤)
  function draw() { const L = view.scrollLeft - 60, Rr = view.scrollLeft + view.clientWidth + 60, T0 = view.scrollTop - 60, B0 = view.scrollTop + view.clientHeight + 60;
    for (const f of fish) { sizeFish(f); const sc = scOf(f), w = f.lw * sc, px = f.x * ppm, py = f.y * ppm, on = px + w / 2 > L && px - w / 2 < Rr && py + w / 3 > T0 && py - w / 3 < B0;
      if (on !== f.on) { f.on = on; f.el.classList.toggle('off', !on); } if (!on) continue;
      const q = Math.round(f.z * 20); if (q !== f.dq) { f.dq = q; f.el.style.zIndex = 500 - q * 20; }
      f.el.style.transform = `translate(${(px - w / 2).toFixed(1)}px, ${(py - w / 3).toFixed(1)}px) scale(${sc.toFixed(3)})`; const fl = f.dir > 0 ? 'scaleX(-1)' : ''; if (fl !== f.fl) { f.fl = fl; f.body.style.transform = fl; } } }
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
