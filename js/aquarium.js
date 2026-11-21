// 카피수족관: 잡은 물고기를 실제 크기(cm) 그대로 넣어 구경한다. 물고기는 꼬리를 흔들고, 방향을 틀고, 돌진하고, 잠도 자고, 서로 부딪히면 비켜 간다.
// 관람석(A안): 동물 친구들이 벤치에 앉아 귀한 물고기(S급·초희귀·이로치)가 지나가면 감탄하고 관람료 1코인을 낸다(동물마다 하루 3번까지)
import { h } from './ui.js';
import { FISH, fishSvg, SHINY_IDS } from './fishing.js';
import { ANIMALS, animalBackSvg } from './animals.js';
import { sfx } from './sound.js';

export const TANKS = [null, { n: '초급 수족관', w: 3, h: 1.5, v: 1.5, max: 20, cap: 40, price: 2000 }, { n: '중급 수족관', w: 24, h: 10, v: 6, max: 40, cap: 0, price: 6000 }, { n: '고급 수족관', w: 24, h: 10, v: 6, max: 60, cap: 0, price: 10000 }]; // cap: 넣을 수 있는 몸길이(cm), 0은 제한 없음
export const FEE_MAX = 3; // 관람료: 동물 한 마리당 하루 최대 3번, 한 번에 1코인
const FISH_FILL = 0.86; // 물고기 그림에서 몸이 차지하는 가로 비율
const rnd = (a, b) => a + Math.random() * (b - a), pick = a => a[Math.floor(Math.random() * a.length)];
// 바다 진주: 물고기처럼 풀어넣되 헤엄치지 않고 바닥에 놓여 반짝인다(귀한 물고기로 친다)
const PEARL0 = { id: 'pearl', name: '바다 진주', pearl: true, tier: 4 }, F0 = id => (id === 'pearl' ? PEARL0 : FISH.find(x => x.id === id));
export const isRare = f => f.g === 'S' || f.tier >= 4 || f.shiny; // 관람료를 받는 귀한 물고기
const glowOf = f => (f.shiny && (f.tier >= 4 || f.g === 'S') ? 'ss' : f.shiny ? 's' : f.g === 'S' || f.tier >= 4 ? 'g' : '');
// 수족관 용품 30종: [이름, 값, 가로 길이(m, 중급·고급 기준), 물고기 반응]. 그림은 img/aqua/d/번호.webp
// 반응: peck 콕콕 쪼기 · hide 뒤로 숨기 · circle 빙글빙글 돌기 · bubble 거품 타고 오르기 · glow 몸이 반짝 · heart 하트 뿅 · startle 깜짝 흩어지기 · slide 미끄럼
export const DECO = [['조약돌 더미', 300, 0.9, 'peck'], ['수초', 400, 0.9, 'hide'], ['분홍 산호', 600, 1.2, 'hide'], ['불가사리', 400, 0.6, 'peck'], ['조개', 700, 0.9, 'startle'], ['소라', 800, 1, 'hide'], ['기포석', 900, 0.8, 'bubble'], ['돌다리', 1000, 1.8, 'slide'], ['알록달록 모래밭', 500, 1.4, 'peck'], ['이끼 바위', 600, 1.2, 'hide'],
  ['풍차', 1500, 1.8, 'circle'], ['난파선', 2000, 3, 'hide'], ['보물상자', 2200, 1.6, 'startle'], ['등대', 1800, 1.4, 'circle'], ['잠수부 카피', 2500, 1.6, 'circle'], ['카피 모래성', 1600, 1.8, 'hide'], ['바위 동굴', 1400, 2.4, 'hide'], ['해파리 램프', 2000, 1.3, 'glow'], ['진주 조개', 3000, 1.4, 'glow'], ['물고기 우체통', 1200, 1.1, 'heart'],
  ['용궁', 4000, 3.6, 'hide'], ['거북선', 3500, 3.2, 'bubble'], ['물레방아', 3000, 2.4, 'circle'], ['미끄럼틀', 2800, 2, 'slide'], ['무지개 산호', 3200, 2, 'glow'], ['해저 회전목마', 3800, 2.4, 'circle'], ['하트 바위', 2500, 1.8, 'heart'], ['별빛 산호', 3000, 2, 'glow'], ['해저 온천', 3500, 2.4, 'bubble'], ['황금 카피 동상', 5000, 1.8, 'circle']];
export const decoImg = k => `img/aqua/d/${k}.webp`;
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
  root.querySelector('.aq-top').append(visit); if (!o.partner && !o.test) visit.hidden = true;
  async function goMode(k) { if (k === mode) return; mode = k; [...visit.children].forEach(b => b.classList.toggle('on', b.dataset.k === k)); panel.hidden = true; tip.hidden = true;
    root.classList.toggle('pal', k === 'pal'); titleB.textContent = k === 'pal' ? `🐾 ${palName}의 수족관` : `🐠 ${meName}의 수족관`;
    if (k === 'pal') { const pd = o.test ? { tank: 3, deco: demoDeco(), fish: demoFish(3).map(d => ({ ...d, name: Math.random() < 0.15 ? pick(['콩이', '뽀삐', '두부', '별님', '방울']) : '' })) } : await (o.loadPartner ? o.loadPartner() : null); if (!pd) { titleB.textContent = `${palName}는 아직 수족관이 없어요`; fish = []; layer.replaceChildren(); return; } myTank = tank; tank = pd.tank; build(pd.fish, pd.deco || []); }
    else { tank = myTank; build(o.test ? demoFish(tank) : o.fish, o.test ? demoDeco() : o.deco); } }
  let myTank = tank; titleB.textContent = `🐠 ${meName}의 수족관`;
  // 수족관 크기 버튼(시험판)과 확대·축소는 유리 오른쪽 아래 구석에
  root.querySelector('.aq-title').append(info); const bot = h('div', { class: 'aq-bot' }); if (o.test) bot.append(tabs); bot.append(root.querySelector('.aq-zoom')); root.querySelector('.aq-frame').append(bot);
  document.body.append(root);
  let fish = [], W = 1, H = 1, ppm = 1; // ppm: 1m당 픽셀

  function shuffle(a) { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }
  // 화면 가로에 6m(작은 수족관은 전체)가 들어오는 비율이 기본(×1). －로 줄이면 수족관 전체, ＋로 키우면 작은 물고기까지 또렷하게
  let base = 60, zMin = 1, fitAll = true; // 들어오면 수족관 전체가 한눈에 보이게 시작(초급·중급·고급 모두)
  function layout(keep) { const T = TANKS[tank], vw = Math.max(200, root.clientWidth - 16 - 18), cx = keep ? (view.scrollLeft + view.clientWidth / 2) / (W * ppm) : 0.5, cy = keep ? (view.scrollTop + view.clientHeight / 2) / (H * ppm) : 0.5;
    // 가로 화면 전용: 수족관 높이를 화면 높이에 맞춘다(작은 수족관은 작게 보여서 크기 차이가 그대로 느껴진다)
    const avail = Math.max(140, root.clientHeight - 24 - room.clientHeight - 8); view.style.height = avail + 'px'; // 위 버튼줄 자리까지 전부 수족관
    W = T.w; H = T.h; base = Math.min(avail / T.v, vw / Math.min(W, 2.2)); zMin = Math.min(1, avail / (H * base)); if (fitAll) { fitAll = false; zoom = zMin; } // 화면에는 v미터 높이가 보이고 그 위는 위로 밀어서 본다. 가장 작게 줄이면 높이 전체가 한눈에
    ppm = base * zoom; world.style.width = W * ppm + 'px'; world.style.height = H * ppm + 'px'; world.style.marginTop = Math.max(0, view.clientHeight - H * ppm) + 'px'; view.parentNode.style.width = Math.min(vw, W * ppm) + 18 + 'px'; // 작은 수족관은 유리도 작게
    const seg = H * ppm * (456 / 362), side = H * ppm * (360 / 362), n = Math.max(1, Math.round((W * ppm - 2 * side) / seg)), mids = n % 2 ? n : n + 1;
    // 물 배경: 가운데는 이음매 없이 이어지는 물 그림을 옆으로 반복, 양 끝에 산호 그림을 겹쳐 스르르 이어 붙인다
    if (W * ppm < 2 * side + seg) bg.replaceChildren(h('img', { src: 'img/aqua/full.webp', alt: '', class: 'one' }));
    else bg.replaceChildren(h('div', { class: 'aq-tile' }), h('img', { src: 'img/aqua/l.webp', alt: '', class: 'endl' }), h('img', { src: 'img/aqua/r.webp', alt: '', class: 'endr' }));
    zoomL.textContent = zoom <= zMin + 0.01 && zMin < 1 ? '전체' : `×${zoom.toFixed(zoom < 2 ? 1 : 0)}`;
    fish.forEach(f => { f.lw = 0; }); decos.forEach(placeDeco); view.scrollLeft = cx * W * ppm - view.clientWidth / 2; view.scrollTop = keep ? cy * H * ppm - view.clientHeight / 2 : H * ppm; }
  function setZoom(z) { zoom = Math.max(zMin, Math.min(6, z)); if (Math.abs(zoom - 1) < 0.08) zoom = 1; layout(true); }
  // 원근: 깊이 z(0 앞 ~ 1 뒤)만큼 작고 흐리게. 크기가 바뀔 때만 다시 잰다
  const scOf = f => (f.z >= 0 ? 1 - 0.5 * f.z : 1 - f.z * (f.near - 1)), // z: -1(유리 바로 앞) ~ 0 ~ 1(맨 뒤). 작은 물고기일수록 앞으로 오면 많이 커진다
    hOf = f => f.len * 0.62 * scOf(f);
  // 렉 줄이기: 크기는 수족관 비율이 바뀔 때만 한 번 정하고, 앞뒤 크기 변화는 transform scale로만(다시 그리지 않음)
  // 물고기 크기는 실제 길이(cm) 그대로다(가운데 깊이 기준). 대신 유리 앞까지 바짝 다가올 수 있어서, 작은 물고기도 다가오면 크게 보인다
  // near: 유리 바로 앞에서 몇 배로 보이는지. 다가왔을 때 화면에서 적어도 46px, 많아도 화면 폭의 42%가 되게 물고기마다 정한다
  function sizeFish(f) { const real = f.len * ppm / FISH_FILL, base = Math.max(1.5, Math.min(4, 1.1 / Math.sqrt(f.len))), cap = Math.max(46, view.clientWidth * 0.42);
    f.near = Math.max(1.25, Math.min(14, Math.max(46, Math.min(cap, real * base)) / real)); const w = real * f.near; // 그림은 가장 가까울 때 크기로 그려 두고 멀어지면 줄인다(키우면 흐려져서)
    if (Math.abs(w - (f.lw || 0)) < 0.6) return; f.lw = w; f.el.style.width = w + 'px'; f.el.style.height = w * 2 / 3 + 'px'; f.zz.style.fontSize = Math.max(12, Math.min(40, w * 0.18)) + 'px'; f.tag.style.fontSize = Math.max(10, Math.min(18, w * 0.12)) + 'px'; }
  function build(list, dlist) {
    layer.replaceChildren(); decos = []; editing = false; root.classList.remove('edit'); [...tabs.children].forEach(b => b.classList.toggle('on', +b.dataset.t === tank)); zoom = 1; fitAll = true;
    const T = TANKS[tank]; W = T.w; H = T.h;
    fish = list.map(d => makeFish(d)).filter(Boolean);
    W = T.w; H = T.h; (dlist || []).forEach(d => makeDeco(d));
        layout(false); drawRoom(); drawInfo(); bag = o.test ? demoBag(tank) : o.bag ? o.bag() : []; drawBag(); bookRows = []; drawBook(); loadBook(); }
  function makeFish(d, drop) { const f0 = F0(d.id); if (!f0) return null; const len = f0.pearl ? 1.8 : d.cm / 100, f = { d, f0, len, hgt: len * 0.45, tier: f0.tier || 1, g: d.g, shiny: d.shiny, x: rnd(len / 2, Math.max(len / 2 + 0.01, W - len / 2)), y: rnd(H * 0.15, H * 0.7), dir: Math.random() < 0.5 ? -1 : 1, vy: 0, ty: 0, st: 'swim', stT: rnd(2, 6), sp: 1, turnT: 0 };
    f.base = 0.12 + 0.3 * Math.sqrt(len); f.ty = f.y; f.near = Math.min(3, Math.max(1.25, 0.9 / Math.sqrt(len))); f.z = f.tz = drop ? 0.1 : rnd(-0.8, 1); f.dq = -1; f.zT = rnd(1, 8);
    f.body = h('div', { class: 'aq-fb', html: fishSvg(f0, false, d.shiny), style: { animationDuration: rnd(0.45, 0.7) + 's' } });
    f.zz = h('span', { class: 'aq-zz' }, 'Z z'); f.tag = h('span', { class: 'aq-name', hidden: !d.name }, d.name || ''); f.el = h('div', { class: 'aq-f ' + glowOf(f) }, f.body, f.zz, f.tag);
    if (f0.pearl) { f.still = true; f.z = f.tz = 0.3; f.dir = 1; f.el.classList.add('pearl'); f.body.style.animation = 'none'; f.zz.hidden = true; f.el.prepend(h('i', { class: 'aq-prays' }), h('i', { class: 'aq-pglow' })); for (let k = 0; k < 7; k++) f.el.append(h('i', { class: 'aq-ptw', style: { left: 8 + (k * 41) % 84 + '%', top: 4 + (k * 29) % 70 + '%', animationDelay: (k * 0.37).toFixed(2) + 's' } }, k % 2 ? '✦' : '✧')); } // 진주: 크게, 제자리에서 빛난다
    f.el.onclick = e => { e.stopPropagation(); showTip(f); }; layer.append(f.el);
    if (drop) { const vx = (view.scrollLeft + view.clientWidth / 2) / ppm, vy = view.scrollTop / ppm; f.x = Math.max(len / 2, Math.min(W - len / 2, vx + rnd(-1, 1))); f.y = Math.max(0, vy) + 0.1; f.ty = f.y + rnd(1, 2.5); f.vy = 1.5;
      const sp = h('div', { class: 'aq-splash', style: { left: f.x * ppm + 'px', top: Math.max(0, vy) * ppm + 'px' } }); layer.append(sp); setTimeout(() => sp.remove(), 1200); sfx('splash');
      const here = h('span', { style: { position: 'absolute', left: '50%', bottom: '100%', transform: 'translateX(-50%)', font: '800 13px/1.2 var(--head, sans-serif)', color: '#fff', background: 'rgba(255,120,60,.92)', borderRadius: '10px', padding: '2px 8px', whiteSpace: 'nowrap', pointerEvents: 'none', zIndex: 5 } }, '👇 여기!'); f.el.append(here); setTimeout(() => here.remove(), 3500); }
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
    listEl.replaceChildren(...(bag.length ? bag.map(d => { const f0 = F0(d.id); if (!f0) return ''; const big = T.cap && d.cm > T.cap, no = full ? '수족관이 꽉 찼어요' : big ? `너무 커요 (${T.cap}cm까지)` : '';
      return h('div', { class: 'aq-prow' + (no ? ' off' : '') }, h('span', { class: 'aq-pic', html: fishSvg(f0, false, d.shiny) }), h('div', { class: 'aq-pn' }, h('b', null, `${d.shiny ? '✨ ' : ''}${d.name ? d.name + ' · ' : ''}${f0.name}`), h('small', null, `${d.g ? d.g + '급 · ' : ''}${d.cm}cm${f0.tier >= 4 ? ' · 초희귀' : ''}`)),
        h('button', { class: 'aq-pbtn', disabled: !!no, onClick: () => release(d) }, no || '풀어넣기')); }) : [h('p', { class: 'aq-pnone' }, '가방에 물고기가 없어요. 낚시터에서 잡아 오세요.')])); }
  async function release(d) { if (o.release && !(await o.release(d))) return; bag = bag.filter(x => x !== d); const f = makeFish(d, true); if (f) { fish.push(f); sizeFish(f); } drawBag(); drawInfo(); }
  async function takeOut(f) { if (o.takeOut && !(await o.takeOut(f.d))) return; fish = fish.filter(x => x !== f); f.el.remove(); bag = [f.d, ...bag]; tip.hidden = true; drawBag(); drawInfo(); }
  async function rename(f) { tip.replaceChildren(); const inp = h('input', { class: 'aq-nin', maxlength: 8, value: f.d.name || '', placeholder: `${f.f0.name} 이름` });
    const save = async () => { const nm = inp.value.trim().slice(0, 8); if (o.rename && !(await o.rename(f.d, nm))) return; f.d.name = nm; f.tag.textContent = nm; f.tag.hidden = !nm; tip.hidden = true; };
    inp.addEventListener('keydown', e => { if (e.key === 'Enter') save(); }); tip.append(h('span', null, '✏️ '), inp, h('button', { class: 'aq-nbtn', onClick: e => { e.stopPropagation(); save(); } }, '저장')); clearTimeout(showTip.t); tip.hidden = false; inp.focus(); }
  tip.onclick = e => e.stopPropagation();
  function showTip(f) { const T = ['', '흔함', '보기 힘듦', '희귀', '초희귀'][f.tier] || ''; tip.innerHTML = `${f.d.name ? `<b class="nm">「${f.d.name}」</b> ` : ''}${f.shiny ? '✨ 이로치 ' : ''}<b>${f.f0.name}</b> · ${f.g ? f.g + '급 · ' : ''}${f.f0.pearl ? '반짝반짝' : f.d.cm + 'cm'} <small>${T}${f.st === 'sleep' ? ' · 쿨쿨 자는 중' : ''}</small> `; if (mode === 'me') tip.append(h('button', { class: 'aq-nbtn', onClick: e => { e.stopPropagation(); rename(f); } }, f.d.name ? '✏️ 이름 바꾸기' : '✏️ 이름 붙이기'), h('button', { class: 'aq-nbtn', onClick: e => { e.stopPropagation(); takeOut(f); } }, '🎒 꺼내기')); tip.hidden = false; clearTimeout(showTip.t); showTip.t = setTimeout(() => { tip.hidden = true; }, 4000); }
  view.onclick = () => { tip.hidden = true; };

  // ----- 관람석: 벤치 두 개에 동물이 앉는다(왼쪽 벤치 10~29%, 오른쪽 71~90%) -----
  const SEAT_X = [13.4, 19.2, 25, 0, 77, 85]; // 벤치 그림 자리: 왼쪽 벤치 방석 9.9~28.4%, 오른쪽 71.7~90.3% 안에 들어오게
  function drawRoom() { room.replaceChildren(...seats.slice(0, 5).map((i, k) => { const e = h('div', { class: 'aq-an', style: { left: SEAT_X[k + (k >= 3 ? 1 : 0)] + '%' } }, h('span', { class: 'aq-anf', html: animalBackSvg(i) })); e.dataset.i = i; return e; })); }
  function react() { const rare = fish.filter(f => isRare(f) && inView(f)); if (!rare.length) return; const f = pick(rare), seatsEl = [...room.children]; if (!seatsEl.length) return;
    const e = pick(seatsEl), i = +e.dataset.i; e.classList.remove('wow'); void e.offsetWidth; e.classList.add('wow'); const em = h('i', { class: 'aq-em' }, pick(['💖', '✨', '❗', '😍', '⭐'])); e.append(em); setTimeout(() => em.remove(), 1600);
    const say = h('div', { class: 'aq-say' }, Math.random() < 0.5 ? `${f.shiny ? '이로치 ' : ''}${f.f0.name}다!!` : pick(WOW)); e.append(say);
    const amt = feeAmt(); if (mode === 'me' && (o.fee ? o.fee(i, amt) : (feeN[i] || 0) < FEE_MAX)) { feeN[i] = (feeN[i] || 0) + 1; fee += amt; const c = h('div', { class: 'aq-coin' }, `+${amt}🪙`); e.append(c); setTimeout(() => c.remove(), 1500); sfx('coin'); drawInfo(); }
    setTimeout(() => { say.remove(); e.classList.remove('wow'); }, 2200); }
  function inView(f) { const x = f.x * ppm, y = f.y * ppm; return x > view.scrollLeft - 20 && x < view.scrollLeft + view.clientWidth + 20 && y > view.scrollTop - 20 && y < view.scrollTop + view.clientHeight + 20; }
  // 관람료 한 번: 기본 1코인 + 용품을 5개 이상 놓았으면 +1 + 비싼 용품(3,500코인 이상: 용궁·거북선 등)을 놓았으면 +1. 둘 다 받을 수 있다
  const BIG_DECO = 3500, feeAmt = () => 1 + (decos.length >= 5 ? 1 : 0) + (decos.some(x => DECO[x.d.k][1] >= BIG_DECO) ? 1 : 0);
  // 제목 칸을 누르면 아래로 살짝 넓어지면서 관람료를 얼마 벌었는지 보여 준다. 다시 누르면 원래대로
  let infoOpen = false; const feeBox = h('div', { class: 'aq-fee', hidden: true });
  function drawInfo() { const rare = fish.filter(isRare).length, T = TANKS[tank]; info.innerHTML = `${T.n} ${T.w}m×${T.h}m · ${fish.length}/${T.max}마리${T.cap ? ` · ${T.cap}cm까지` : ''} · 귀한 물고기 ${rare} · 관람료 ${fee}🪙${mode === 'pal' ? ' · 구경만 할 수 있어요' : ''}${o.test ? ' (시험판)' : ''}`;
    const tl = root.querySelector('.aq-title'); if (!tl) return; if (!feeBox.parentNode) { tl.append(feeBox); tl.onclick = () => { infoOpen = !infoOpen; sfx('pop'); drawInfo(); }; }
    root.classList.toggle('tio', infoOpen); feeBox.hidden = !infoOpen; if (!infoOpen) return; const st = mode === 'me' && o.feeStat ? o.feeStat() : null;
    feeBox.replaceChildren(...(mode === 'pal' ? [h('span', null, '🐾 놀러 온 수족관이라 관람료는 주인에게만 들어가요')] : [h('span', null, `🪙 이번 관람 ${fee}코인`), st && h('span', null, `오늘 ${st.today}코인`), st && h('span', null, `지금까지 ${st.total}코인`), h('small', null, `귀한 물고기를 본 동물이 한 번에 ${feeAmt()}코인 · 동물마다 하루 3번 · 용품 5개 이상 +1${decos.length >= 5 ? ' ✔' : ''} · 비싼 용품(용궁·거북선 등) +1${decos.some(x => DECO[x.d.k][1] >= BIG_DECO) ? ' ✔' : ''}`)].filter(Boolean)), h('em', null, '▲ 누르면 접혀요')); }

  // ----- 물고기 움직임: 헤엄 → 가끔 방향 틀기·돌진·잠 · 벽에서 돌아서고 · 서로 겹치면 작은 쪽이 비켜 간다 -----
  function step(dt) {
    for (const f of fish) {
      if (f.still) { const hg = hOf(f), fl = H * 0.9 - hg / 2; if (f.y < fl) { f.vy = Math.min(1.2, (f.vy || 0) + dt * 1.5); f.y = Math.min(fl, f.y + f.vy * dt); } else f.y = fl; f.x = Math.max(f.len / 2, Math.min(W - f.len / 2, f.x)); continue; } // 진주는 가라앉아 바닥에 가만히
      f.stT -= dt; f.turnT = Math.max(0, f.turnT - dt);
      if (f.stT <= 0) { const r = Math.random();
        if (f.st !== 'swim') setSt(f, 'swim', rnd(3, 8));
        else if (r < 0.12) setSt(f, 'dash', rnd(0.5, 0.9));
        else if (r < 0.2) setSt(f, 'sleep', rnd(6, 12));
        else if (r < 0.42) { turn(f); f.stT = rnd(2, 6); }
        else if (r < 0.62 && decos.length && !editing) { f.goal = pick(decos); f.stT = rnd(6, 10); } // 용품 구경 가기
        else { f.ty = rnd(H * 0.05, H * 0.85); f.stT = rnd(2, 6); } }
      if (f.goal) visitDeco(f, dt);
      const sp = f.base * (f.st === 'dash' ? 3.4 : f.st === 'sleep' ? 0.08 : 1) * (f.slow || 1);
      f.x += f.dir * sp * dt;
      f.zT -= dt; if (f.zT <= 0) { f.zT = rnd(6, 14); f.tz = Math.random() < 0.7 ? (f.z < -0.3 ? rnd(0.3, 1) : rnd(-1, -0.55)) : rnd(-1, 1); if (f.tz < -0.5) f.zT = rnd(9, 16); } // 앞뒤로 오가기: 뒤에 있던 물고기는 앞으로, 앞에 있던 물고기는 뒤로
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
    for (const f of fish) { sizeFish(f); const sc = scOf(f) / f.near, w = f.lw * sc, px = f.x * ppm, py = f.y * ppm, on = px + w / 2 > L && px - w / 2 < Rr && py + w / 3 > T0 && py - w / 3 < B0;
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
  // ===== 수족관 용품: 놓기·옮기기·뒤집기·보관함 · 물고기 반응 =====
  let decos = [], editing = false, inv = o.test ? Object.fromEntries(DECO.map((_, k) => [k, 1])) : { ...(o.decoInv || {}) }, selD = null;
  function demoDeco() { return [[10, 4], [5, 7.5], [17, 12], [6, 15], [26, 18], [29, 21]].map(([k, x], n) => ({ key: 'd' + n, k, x: Math.min(x, TANKS[tank].w - 1), y: 0, fl: n % 2 })); }
  const dW = d => DECO[d.k][2] * (tank === 1 ? 0.4 : 1.7); // 용품 크기(가로 m): 중급·고급은 1.7배, 초급은 작은 수조에 맞춰 0.4배
  function makeDeco(d) { const el = h('div', { class: 'aq-deco' }, h('img', { src: decoImg(d.k), alt: DECO[d.k][0], draggable: false })), o2 = { d, el }; decos.push(o2); layer.append(el); placeDeco(o2);
    el.addEventListener('pointerdown', e => { if (!editing) return; e.stopPropagation(); e.preventDefault(); selectDeco(o2); const sx = e.clientX, sy = e.clientY, x0 = d.x, y0 = d.y; el.setPointerCapture(e.pointerId);
      const rot = root.classList.contains('rot'); /* 세로 폰에서는 화면을 눕혀 그리므로 손가락 방향도 같이 돌려야 한다 */
      const mv = ev => { const sdx = ev.clientX - sx, sdy = ev.clientY - sy, lx = rot ? sdy : sdx, ly = rot ? -sdx : sdy; if (Math.abs(lx) + Math.abs(ly) > 4) root.classList.add('ddrag'); d.x = Math.max(dW(d) / 2, Math.min(W - dW(d) / 2, x0 + lx / ppm)); d.y = Math.max(0, Math.min(H * 0.55, y0 - ly / ppm)); placeDeco(o2); };
      const up = () => { root.classList.remove('ddrag'); el.removeEventListener('pointermove', mv); el.removeEventListener('pointerup', up); el.removeEventListener('pointercancel', up); }; el.addEventListener('pointermove', mv); el.addEventListener('pointerup', up); el.addEventListener('pointercancel', up); });
    return o2; }
  // d.y: 바닥(모래)에서 얼마나 위로 떠 있나(m). 앞뒤는 놓은 차례로 정한다
  function placeDeco(o2) { const d = o2.d, w = dW(d) * ppm, bottom = H * 0.95 - d.y; o2.el.style.width = w + 'px'; o2.el.style.transform = `translate(${(d.x * ppm - w / 2).toFixed(1)}px, ${(bottom * ppm - w).toFixed(1)}px)`; o2.el.style.zIndex = 470 - Math.max(0, decos.indexOf(o2)); /* 먼저 놓은 용품이 맨 앞, 나중에 놓은 것은 차례대로 뒤 */ o2.el.firstChild.style.transform = d.fl ? 'scaleX(-1)' : ''; }
  const decoBtn = h('button', { class: 'aq-rel aq-decob', onClick: () => setEdit(!editing) }, '✏️ 꾸미기'); root.querySelector('.aq-top').append(decoBtn);
  // ----- 방명록: 수족관마다 한 권. 주인도 놀러 온 사람도 한 줄씩 남긴다(내 수족관·상대 수족관 모두) -----
  let bookRows = []; const bookT = h('b', null, '📖 방명록'), bookList = h('div', { class: 'aq-plist' }), bookIn = h('input', { class: 'aq-nin aq-bin', maxlength: 60, placeholder: '한 줄 남기기 (60자까지)' });
  const bookP = h('div', { class: 'aq-bookp', hidden: true }, h('div', { class: 'aq-phead' }, bookT, h('button', { class: 'aq-px', onClick: () => { bookP.hidden = true; } }, '✕')), bookList, h('div', { class: 'aq-bwrite' }, bookIn, h('button', { class: 'aq-nbtn', onClick: () => writeBook() }, '남기기')));
  // 글을 쓸 때는 화면을 진짜 가로로 돌린다(전체 화면 + 가로 고정): 그림만 눕혀 놓으면 키보드는 세로로 떠서 옆으로 누운 글을 쳐야 했다
  const goLand = () => { try { const d = document.documentElement; if (window.innerHeight <= window.innerWidth) return; const lock = () => { try { screen.orientation && screen.orientation.lock && screen.orientation.lock('landscape').catch(() => {}); } catch {} };
    if (!document.fullscreenElement && d.requestFullscreen) d.requestFullscreen({ navigationUI: 'hide' }).then(() => { wentFull = true; lock(); setTimeout(onResize, 250); }).catch(() => {}); else lock(); } catch {} };
  let wentFull = false;
  const bookBtn = h('button', { class: 'aq-bookb', onClick: () => { bookP.hidden = !bookP.hidden; if (!bookP.hidden) { panel.hidden = true; tip.hidden = true; goLand(); loadBook(); } fitBook(); } }, '📖 방명록');
  bookIn.addEventListener('pointerdown', goLand);
  // 키보드가 올라오면 방명록 창을 키보드 위 남은 자리에 맞춘다(입력 칸이 키보드에 가려지지 않게). 진짜 가로일 때만
  const vv = window.visualViewport, fitBook = () => { const kb = !!vv && !bookP.hidden && !root.classList.contains('rot') && window.innerHeight - vv.height > 70; root.classList.toggle('kb', kb);
    if (kb) { bookP.style.top = Math.round(vv.offsetTop + 4) + 'px'; bookP.style.bottom = 'auto'; bookP.style.height = Math.max(96, Math.round(vv.height - 8)) + 'px'; } else { bookP.style.top = bookP.style.bottom = bookP.style.height = ''; } };
  if (vv) { vv.addEventListener('resize', fitBook); vv.addEventListener('scroll', fitBook); }
  bookIn.addEventListener('keydown', e => { e.stopPropagation(); if (e.key === 'Enter') writeBook(); }); bookP.onclick = e => e.stopPropagation();
  if (o.book) { root.querySelector('.aq-frame').append(bookBtn); root.append(bookP); } // 위 버튼줄이 꽉 차서 유리 왼쪽 위(제목 아래)에 둔다
  async function loadBook() { if (!o.book) return; const who = mode, rows = (await o.book.list(who)) || []; if (who !== mode || !alive) return; bookRows = rows; drawBook(); }
  function drawBook() { const owner = mode === 'pal' ? palName : meName; bookT.textContent = `📖 ${owner}의 방명록 · ${bookRows.length}줄`; bookBtn.textContent = `📖 방명록${bookRows.length ? ' ' + bookRows.length : ''}`;
    bookList.replaceChildren(...(bookRows.length ? bookRows.map(r => h('div', { class: 'aq-bk' + (r.mine ? ' mine' : '') }, h('div', { class: 'aq-bkh' }, h('b', null, r.name), h('small', null, r.when), r.canDel && h('button', { class: 'aq-bdel', onClick: async () => { await o.book.del(mode, r.key); loadBook(); } }, '지우기')), h('p', null, r.text))) : [h('p', { class: 'aq-pnone' }, `아직 비어 있어요. ${owner}의 수족관에 첫 줄을 남겨 보세요!`)])); }
  async function writeBook() { const t = bookIn.value.trim().slice(0, 60); if (!t || !o.book) return; bookIn.value = ''; await o.book.add(mode, t); sfx('pop'); await loadBook(); bookList.scrollTop = 0; }
  const tray = h('div', { class: 'aq-tray', hidden: true }), dmenu = h('div', { class: 'aq-dmenu', hidden: true });
  root.querySelector('.aq-frame').append(tray, dmenu);
  function setEdit(on) { editing = on; root.classList.toggle('edit', on); tray.hidden = !on; dmenu.hidden = true; selD = null; decoBtn.textContent = on ? '✔ 꾸미기 끝' : '✏️ 꾸미기'; decos.forEach(x => x.el.classList.remove('sel')); panel.hidden = true; tip.hidden = true;
    if (on) drawTray(); else saveDeco(); }
  let trayFold = false; // 보관함 접기: 접으면 작은 단추만 남아 수조가 다 보인다
  function drawTray() { const ks = Object.keys(inv).filter(k => inv[k] > 0).map(Number); tray.classList.toggle('fold', trayFold);
    if (trayFold) return tray.replaceChildren(h('button', { class: 'aq-trayt aq-foldb', onClick: () => { trayFold = false; drawTray(); } }, `📦 보관함 ${ks.reduce((n, k) => n + inv[k], 0)}개 ▴ 펴기`));
    tray.replaceChildren(h('button', { class: 'aq-trayt aq-foldb', onClick: () => { trayFold = true; drawTray(); } }, '📦 ▾ 접기'), ...(ks.length ? ks.map(k => h('button', { class: 'aq-ti', onClick: () => putDeco(k) }, h('img', { src: decoImg(k), alt: '' }), h('small', null, `${DECO[k][0]}${inv[k] > 1 ? ' ×' + inv[k] : ''}`))) : [h('small', { class: 'aq-tnone' }, '보관함이 비었어요. 카피수퍼에서 용품을 사 오세요.')])); }
  function putDeco(k) { inv[k]--; const d = { key: 'd' + Date.now().toString(36) + Math.floor(Math.random() * 99), k, x: Math.max(dW({ k }) / 2, Math.min(W - dW({ k }) / 2, (view.scrollLeft + view.clientWidth / 2) / ppm)), y: 0, fl: 0 }; selectDeco(makeDeco(d)); drawTray(); sfx('pop'); }
  function selectDeco(o2) { selD = o2; decos.forEach(x => x.el.classList.toggle('sel', x === o2)); dmenu.replaceChildren(h('b', null, DECO[o2.d.k][0]), h('button', { onClick: () => { o2.d.fl = o2.d.fl ? 0 : 1; placeDeco(o2); } }, '↔ 뒤집기'), h('button', { onClick: () => { inv[o2.d.k] = (inv[o2.d.k] || 0) + 1; o2.el.remove(); decos = decos.filter(x => x !== o2); decos.forEach(placeDeco); dmenu.hidden = true; drawTray(); } }, '📦 보관함에 넣기')); dmenu.hidden = false; }
  function saveDeco() { if (o.saveDeco) o.saveDeco(decos.map(x => x.d), inv); }
  // 물고기가 용품을 찾아가서 반응한다
  function visitDeco(f, dt) { const g = f.goal; if (!decos.includes(g)) { f.goal = null; f.slow = 1; return; } const gw = dW(g.d), gx = g.d.x, top = H * 0.95 - g.d.y - gw * 0.8, near = Math.abs(f.x - gx) < gw * 0.6 + f.len * 0.3, act = DECO[g.d.k][3];
    if (!near) { const want = Math.sign(gx - f.x); if (want && want !== f.dir && !f.turnT) turn(f); f.ty = top + gw * 0.3; f.slow = 1; return; }
    f.slow = 0.35; f.gt = (f.gt || 0) + dt;
    if (act === 'circle') { f.ty = top + gw * 0.35 + Math.sin(f.gt * 2) * gw * 0.35; if (Math.abs(f.x - gx) > gw * 0.45 && Math.sign(gx - f.x) !== f.dir && !f.turnT) turn(f); }
    else if (act === 'hide') { f.tz = 0.9; f.ty = top + gw * 0.5; }
    else if (act === 'bubble') { f.ty = top - gw * 0.6 - f.gt * 0.4; if (Math.random() < dt * 3) bubbleAt(gx, top + gw * 0.5); }
    else if (act === 'peck') { f.ty = H * 0.95 - g.d.y - gw * 0.35; if (Math.random() < dt * 1.2) popAt(f, '·'); }
    else if (act === 'glow') { f.el.classList.add('aq-glint'); }
    else if (act === 'heart') { if (Math.random() < dt * 0.6) popAt(f, '💗'); }
    else if (act === 'startle') { if (f.gt > 1.2 && !f.scared) { f.scared = 1; popAt(f, '❗'); setSt(f, 'dash', 0.8); if (Math.sign(f.x - gx) !== f.dir) turn(f, true); f.goal = null; f.slow = 1; return; } }
    else if (act === 'slide') { f.ty = top + gw * 0.2 + Math.min(1, f.gt / 3) * gw * 0.6; }
    if (f.gt > 7) { f.goal = null; f.gt = 0; f.slow = 1; f.scared = 0; f.el.classList.remove('aq-glint'); f.zT = 0; } }
  function bubbleAt(x, y) { const b = h('i', { class: 'aq-bub', style: { zIndex: 600, left: x * ppm + rnd(-8, 8) + 'px', top: y * ppm + 'px' } }); layer.append(b); setTimeout(() => b.remove(), 1400); }
  function popAt(f, t) { const p2 = h('i', { class: 'aq-pop', style: { zIndex: 950, left: (f.x + f.dir * f.len * 0.4) * ppm + 'px', top: (f.y - f.len * 0.2) * ppm + 'px' } }, t); layer.append(p2); setTimeout(() => p2.remove(), 1200); }
  function close() { if (editing) saveDeco(); try { screen.orientation && screen.orientation.unlock && screen.orientation.unlock(); } catch {} alive = false; cancelAnimationFrame(raf); window.removeEventListener('resize', onResize); if (vv) { vv.removeEventListener('resize', fitBook); vv.removeEventListener('scroll', fitBook); } if (wentFull && document.fullscreenElement && document.exitFullscreen) document.exitFullscreen().catch(() => {}); root.remove(); o.onClose && o.onClose(); }
  orient(); try { if (screen.orientation && screen.orientation.lock) screen.orientation.lock('landscape').catch(() => {}); } catch {} // 폰이 세로여도 화면을 눕혀서 가로로 보여 준다
  requestAnimationFrame(() => { build(o.test ? demoFish(tank) : o.fish || [], o.test ? demoDeco() : o.deco || []); raf = requestAnimationFrame(loop); if (o.guest) { visit.hidden = true; goMode('pal'); } }); // guest: 내 수족관 없이 상대 수족관만 구경
  return { close };
}
