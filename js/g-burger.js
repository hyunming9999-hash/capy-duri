// 카피 버거 — 동물 손님 30종의 주문(포장/매장 → 음료·사이드 → 버거)대로 준비하는 게임
// 협동: 메인(버거·포장)과 보조(음료·사이드)로 역할을 나눠 한 쟁반을 같이 채운다. 경쟁: 같은 손님 순서로 각자 만들어 총점 대결
import { h, toast, modal, gameFx } from './ui.js';
import { sfx, sizzle } from './sound.js';
import { ANIMALS as ZOO, animalSvg } from './animals.js';

const ANIMALS = ZOO.map((a, i) => [animalSvg(i, true), a.name]); // [그림, 이름]

/* ---------- 그림 ---------- */
const O = '#5F3F2B';
const DRINK = { cola: ['콜라', '#4A2A22', '#E5484D'], cider: ['사이다', '#E3F6E6', '#3FAE5A'], fanta: ['환타', '#FF9D2E', '#F0641A'], dew: ['마운틴듀', '#CBEA4E', '#3F9E3A'], pepper: ['닥터페퍼', '#6A1B2A', '#B8324A'] };
for (const k of Object.keys(DRINK)) DRINK['z' + k] = ['제로' + DRINK[k][0], DRINK[k][1], DRINK[k][2], true];
const IMG = 'img/burger/', pic = f => `<img src="${IMG}${f}.webp" alt="" draggable="false">`;
// 음료 컵: 제로는 같은 컵에 검은 '0' 딱지
const drinkPic = k => `<span class="bg-dp${k[0] === 'z' ? ' zero' : ''}">${pic('d-' + k.replace(/^z/, ''))}</span>`;
const SIDE = {
  fries: ['감튀', pic('s-fries')],
  cstick: ['치즈스틱', pic('s-cstick')],
  hash: ['해쉬브라운', pic('s-hash')],
  lstick: ['롱치즈스틱', pic('s-lstick')],
  churros: ['츄러스', pic('s-churros')],
  wrap: ['휠랩', pic('s-wrap')],
  pie: ['애플파이', pic('s-pie')],
  rings: ['양파튀김', pic('s-rings')],
  sfries: ['시즈닝감튀', pic('s-sfries')],
};
// 버거 한 층: [높이, y를 받아 그리는 함수] (너비 96 기준). 색 번짐(그라디언트)은 화면에 한 번 넣어 둔 DEFS를 같이 쓴다
export const DEFS = `<svg width="0" height="0" style="position:absolute" aria-hidden="true"><defs>
<linearGradient id="bgBun" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#F8CF8E"/><stop offset=".55" stop-color="#E9A95A"/><stop offset="1" stop-color="#C98338"/></linearGradient>
<linearGradient id="bgBunB" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#F3C583"/><stop offset="1" stop-color="#CE8A3F"/></linearGradient>
<linearGradient id="bgBeef" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#8A5236"/><stop offset=".5" stop-color="#6A3B25"/><stop offset="1" stop-color="#472516"/></linearGradient>
<linearGradient id="bgChk" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#F7C45E"/><stop offset="1" stop-color="#D98A22"/></linearGradient>
<linearGradient id="bgSea" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FBE0A8"/><stop offset="1" stop-color="#E3A95C"/></linearGradient>
<linearGradient id="bgChz" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FFE266"/><stop offset="1" stop-color="#F7B91E"/></linearGradient>
<linearGradient id="bgTom" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#F4625F"/><stop offset="1" stop-color="#C92E33"/></linearGradient>
<linearGradient id="bgLet" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#B5E77C"/><stop offset="1" stop-color="#63B546"/></linearGradient>
</defs></svg>`;
const wave = (y, amp, n = 8) => { let d = `M6 ${y}`; for (let i = 0; i < n; i++) d += `q${42 / n} ${i % 2 ? amp : -amp} ${84 / n} 0`; return d; };
const frill = (y, n, amp, down) => { let d = `M5 ${y}`; const w = 86 / n; for (let i = 0; i < n; i++) d += `q${w / 2} ${-amp} ${w} 0`; d += `v${down}`; for (let i = 0; i < n; i++) d += `q${-w / 2} ${amp + 1.5} ${-w} 0`; return d + 'z'; };
const LAY = {
  bunB: [14, y => `<path d="M8 ${y}h80v6a8 8 0 0 1-8 8H16a8 8 0 0 1-8-8z" fill="url(#bgBunB)" stroke="#9A6226" stroke-width="1.6"/><path d="M12 ${y + 2.5}h72" stroke="#FBE2B5" stroke-width="2" stroke-linecap="round" opacity=".8"/>`],
  bunT: [27, y => `<path d="M7 ${y + 27}Q5 ${y + 1} 48 ${y + 1}Q91 ${y + 1} 89 ${y + 27}z" fill="url(#bgBun)" stroke="#9A6226" stroke-width="1.6"/><path d="M19 ${y + 13}Q30 ${y + 5} 46 ${y + 4.5}" fill="none" stroke="#FFF1D2" stroke-width="3.4" stroke-linecap="round" opacity=".75"/>${[[32, 11, -18], [45, 7.5, 6], [58, 10, 20], [39, 17, 10], [53, 16.5, -12], [67, 17.5, 16], [26, 19, -8], [74, 22, 4], [47, 22.5, 0]].map(([x, d, r]) => `<ellipse cx="${x}" cy="${y + d}" rx="2.5" ry="1.4" fill="#FFF8E1" stroke="#D9A45A" stroke-width=".6" transform="rotate(${r} ${x} ${y + d})"/>`).join('')}`],
  beef: [12, y => `<rect x="6" y="${y}" width="84" height="12" rx="6" fill="url(#bgBeef)" stroke="#3A1E12" stroke-width="1.5"/>${[18, 32, 46, 60, 74].map(x => `<path d="M${x} ${y + 9}l6 -6" stroke="#2E170D" stroke-width="2" stroke-linecap="round" opacity=".75"/>`).join('')}<path d="M12 ${y + 2.6}h72" stroke="#B37B5A" stroke-width="1.4" stroke-linecap="round" opacity=".7"/>`],
  chicken: [13, y => `<path d="${frill(y + 3.5, 11, 3, 6.5)}" fill="url(#bgChk)" stroke="#9E6312" stroke-width="1.5" stroke-linejoin="round"/>${[[16, 7], [27, 5.5], [39, 8], [50, 5.5], [62, 8], [73, 5.5], [82, 7.5], [33, 10], [56, 10.5]].map(([x, d]) => `<circle cx="${x}" cy="${y + d}" r="1.3" fill="#FFE7A6"/>`).join('')}`],
  lettuce: [9, y => `<path d="${frill(y + 4.5, 9, 4.5, 2)}" fill="#4F9A38" stroke="#3B7A2A" stroke-width="1"/><path d="${frill(y + 3.5, 12, 3.6, 1.5)}" fill="url(#bgLet)" stroke="#3F8A2E" stroke-width="1.2" stroke-linejoin="round"/>`],
  onion: [7, y => `<rect x="9" y="${y + 0.5}" width="78" height="6" rx="3" fill="#FBF3FB" stroke="#A96FB8" stroke-width="1.3"/>${[20, 36, 52, 68, 82].map(x => `<ellipse cx="${x}" cy="${y + 3.5}" rx="6.5" ry="1.6" fill="none" stroke="#C79AD2" stroke-width="1.1"/>`).join('')}`],
  cheese: [8, y => `<path d="M5 ${y + 0.5}h86v3.5l-9 0q-3 5.5-6 0h-24q-3.5 6.5-7 0h-14q-2.5 4-5 0H5z" fill="url(#bgChz)" stroke="#C98F0A" stroke-width="1.3" stroke-linejoin="round"/><path d="M10 ${y + 2}h70" stroke="#FFF3B0" stroke-width="1.2" stroke-linecap="round" opacity=".9"/>`],
  tomato: [8, y => [[9, 38], [49, 38]].map(([x, w]) => `<rect x="${x}" y="${y + 0.5}" width="${w}" height="7" rx="3.5" fill="url(#bgTom)" stroke="#8E1F24" stroke-width="1.3"/><path d="M${x + 5} ${y + 3}h${w - 10}" stroke="#FF9C96" stroke-width="1.2" stroke-linecap="round" opacity=".85"/>${[8, 16, 24, 31].map(d => `<ellipse cx="${x + d}" cy="${y + 5.2}" rx="1.1" ry=".7" fill="#FFE39A"/>`).join('')}`).join('')],
  seafood: [12, y => `<rect x="6" y="${y}" width="84" height="12" rx="6" fill="url(#bgSea)" stroke="#B07A2C" stroke-width="1.5"/>${[[16, 5, '#FF8E99'], [27, 8, '#fff'], [39, 4.5, '#FF8E99'], [50, 8, '#8FD06A'], [61, 5, '#FF8E99'], [72, 8, '#fff'], [82, 5.5, '#FF8E99']].map(([x, d, c]) => `<circle cx="${x}" cy="${y + d}" r="1.8" fill="${c}"/>`).join('')}`],
  shrimp: [11, y => [15, 35, 55, 75].map(x => `<path d="M${x - 7} ${y + 9}a8 7 0 1 1 15 0" fill="none" stroke="#D5484A" stroke-width="6" stroke-linecap="round"/><path d="M${x - 7} ${y + 9}a8 7 0 1 1 15 0" fill="none" stroke="#FFA98F" stroke-width="3.6" stroke-linecap="round"/><path d="M${x - 5.5} ${y + 5.5}a6 5 0 0 1 11 -1" fill="none" stroke="#FFE0D2" stroke-width="1" stroke-linecap="round"/>`).join('')],
  chili: [6, y => `<path d="${wave(y + 3, 2.4, 12)}" fill="none" stroke="#9E141C" stroke-width="5.4" stroke-linecap="round"/><path d="${wave(y + 3, 2.4, 12)}" fill="none" stroke="#E5343D" stroke-width="3.6" stroke-linecap="round"/><path d="${wave(y + 2.2, 2.4, 12)}" fill="none" stroke="#FF9A9E" stroke-width=".9" stroke-linecap="round" opacity=".8"/>`],
  sweet: [6, y => `<path d="${wave(y + 3, 2.4, 12)}" fill="none" stroke="#B5720A" stroke-width="5.4" stroke-linecap="round"/><path d="${wave(y + 3, 2.4, 12)}" fill="none" stroke="#F7B02A" stroke-width="3.6" stroke-linecap="round"/><path d="${wave(y + 2.2, 2.4, 12)}" fill="none" stroke="#FFE7A6" stroke-width=".9" stroke-linecap="round" opacity=".9"/>`],
};
const FILL = { beef: '고기패티', chicken: '치킨패티', lettuce: '상추', onion: '양파', cheese: '치즈', tomato: '토마토', seafood: '씨푸드패티', shrimp: '새우', chili: '칠리소스', sweet: '스윗소스' };
// st: 아래에서 위 순서. 맨 아래 'bun'은 아래 빵, 그 뒤의 'bun'은 위 빵
function stackSvg(st, cls = '') {
  const keys = st.map((k, i) => (k === 'bun' ? (i ? 'bunT' : 'bunB') : k)); let H = 2; for (const k of keys) H += LAY[k][0] - 1;
  let y = H, out = ''; for (const k of keys) { y -= LAY[k][0] - 1; out += LAY[k][1](y - 1); }
  return `<svg class="bg-stack ${cls}" viewBox="0 0 96 ${Math.max(H, 14)}" style="aspect-ratio:96/${Math.max(H, 14)}">${out}</svg>`;
}
const one = k => `<svg viewBox="0 0 96 ${LAY[k][0] + 2}">${LAY[k][1](1)}</svg>`;

/* ---------- 난이도와 주문 ---------- */
const D5 = ['cola', 'cider', 'fanta', 'dew', 'pepper'], S5 = ['fries', 'cstick', 'hash', 'lstick', 'churros'], F6 = ['beef', 'chicken', 'lettuce', 'onion', 'cheese', 'tomato'];
const SKIP = 30; // 먼저 온 손님을 두고 뒤 손님 것을 먼저 내면 깎이는 점수
const LEVEL = {
  e: { name: '하', drinks: D5.slice(0, 3), sides: S5.slice(0, 2), fills: ['beef', 'tomato', 'lettuce'], btn: ['beef', 'tomato', 'lettuce'], coop: 240, win: 3600, cust: 1, fry: 4000 },
  m: { name: '중', drinks: D5, sides: S5, fills: F6, btn: F6, coop: 300, vs: 240, win: 3000, cust: 2, fry: 3000 },
  h: { name: '상', drinks: [...D5, ...D5.map(k => 'z' + k)], sides: [...S5, 'wrap', 'pie', 'rings', 'sfries'], fills: [...F6, 'seafood', 'shrimp', 'sauce'], btn: [...F6, 'seafood', 'shrimp', 'chili', 'sweet'], coop: 360, vs: 300, win: 2400, cust: 3, fry: 2000 },
};
const PATTY = { beef: 1, chicken: 1, seafood: 1 }, NOFRY = { wrap: 1 }; // 패티는 불판에 굽고, 사이드는 (휠랩만 빼고) 튀김기에 튀긴다
const HOLD = 5; // 다 익은 것을 꺼내 두는 보관함 칸 수
const GRILL = 5, FRYER = 3, COOK = 4000, TAIL = 2600; // 익는 데 걸리는 시간(ms). 그 뒤 '알맞음' 구간(win)이 지나면 탄다
const won = n => n.toLocaleString('ko-KR') + '원';
function rng(a) { return () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
// 같은 seed·번호면 누구 화면에서나 같은 손님이 온다. 어려운 단계에도 네 번에 한 번쯤은 쉬운 손님이 섞인다
export function orderOf(seed, idx, diff) {
  const r = rng(seed * 131 + idx * 7919 + 17), L = LEVEL[diff], easy = diff !== 'e' && r() < 0.25, P = easy ? LEVEL.e : L, pool = P.fills.slice();
  const n = (easy || diff === 'e') ? (r() < 0.12 ? 3 : 1 + Math.floor(r() * 2)) : diff === 'm' ? (r() < 0.07 ? 6 : 2 + Math.floor(r() * 3)) : (r() < 0.05 ? 9 : 3 + Math.floor(r() * 4)); // 전부 넣는 버거는 아주 가끔
  for (let i = pool.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [pool[i], pool[j]] = [pool[j], pool[i]]; }
  const fills = pool.slice(0, Math.min(n, pool.length)).map(k => (k === 'sauce' ? (r() < 0.5 ? 'chili' : 'sweet') : k));
  const o = { a: Math.floor(r() * ANIMALS.length), d: P.drinks[Math.floor(r() * P.drinks.length)], s: P.sides[Math.floor(r() * P.sides.length)], pack: r() < 0.5 ? 'out' : 'in', fills, easy };
  // 계산: 값은 1,000원 단위(상은 100원 단위), 손님은 그보다 큰 돈을 낸다 → 거스름돈 암산
  o.price = (4 + fills.length + Math.floor(r() * 3)) * 1000 + (diff === 'h' ? Math.floor(r() * 10) * 100 : 0);
  const pays = [...new Set([Math.ceil((o.price + 1) / 5000) * 5000, Math.ceil((o.price + 1) / 10000) * 10000, 20000, 50000])].filter(v => v > o.price);
  o.paid = pays[Math.min(pays.length - 1, Math.floor(r() * r() * pays.length * 1.6))]; // 작은 돈을 더 자주 낸다
  return o;
}
// 채점: 버거 60+재료당 10, 음료 30, 사이드 30(경쟁에서는 보너스), 포장/매장 20, 거스름돈 40(계산 모드), 전부 맞으면 +20
export function judge(o, tray, pack, vs, calc, only) {
  const st = tray.st || [], want = ['bun', ...o.fills, 'bun'];
  if (only) { const b = st.length === want.length && want.every((k, i) => st[i] === k); return { ok: { b }, perfect: b, only: true, pts: b ? 60 + o.fills.length * 10 + 20 : 0 }; } // 버거만 모드
  const ok = { b: st.length === want.length && want.every((k, i) => st[i] === k), d: tray.d === o.d, s: tray.s === o.s, p: pack === o.pack };
  if (calc) ok.c = (tray.c || 0) === o.paid - o.price;
  const perfect = ok.b && ok.d && ok.p && (vs || ok.s) && (!calc || ok.c);
  return { ok, perfect, pts: (ok.b ? 60 + o.fills.length * 10 : 0) + (ok.d ? 30 : 0) + (ok.s ? 30 : 0) + (ok.p ? 20 : 0) + (ok.c ? 40 : 0) + (perfect ? 20 : 0) };
}
const arr = v => (Array.isArray(v) ? v : v && typeof v === 'object' ? Object.values(v) : []);
const PATH = 'games/burger';

export function mount(el, ctx) {
  ['bg', 'hero', 'grill-big', 'fryer-big', ...['beef', 'chicken', 'seafood'].flatMap(k => ['p-' + k, 'p-' + k + '-raw']), ...Object.keys(SIDE).map(k => 's-' + k), ...['cola', 'cider', 'fanta', 'dew', 'pepper'].map(k => 'd-' + k)].forEach(f => { new Image().src = IMG + f + '.webp'; }); // 그림 미리 받아 두기
  let alive = true, S = null, roles = {}, best = {}, timer = 0;
  let mode = 'coop', diff = 'e', myRole = 'main', picked = false, calcOn = false, onlyOn = false; // 로비에서 고른 값
  let L = null;            // 경쟁 모드의 내 진행 상황 { id, idx, score, tray }
  let mySel = -1, selRun = '';
  let K = null;            // 내 주방(불판·튀김기). 손님이 바뀌어도 그대로 남아서 미리 구워 둘 수 있다
  let seenId = '', dismissed = '', fxDone = '', shownIdx = -1, shownRun = '', tab = 'd', flash = null, lastSeen = 0, lastPh = '';
  const pid = () => ctx.partnerId, now = () => ctx.store.now();
  const box = h('div', { class: 'bg' }); el.append(h('div', { html: DEFS }), box);

  const endAt = s => s.startAt + s.dur * 1000;
  const phase = () => { if (!S || S.id === dismissed) return 'lobby'; const t = now(); if (t < endAt(S)) return t < S.startAt ? 'ready' : 'play'; return S.id === seenId ? 'result' : 'lobby'; };
  const roleOf = () => (S.mode === 'vs' || S.only ? 'both' : (S.roles || {})[ctx.uid] || 'watch');
  // 손님 자리: q = 지금 와 있는 손님 번호들, sel = 지금 만드는 손님 자리, nx = 다음에 올 손님 번호
  const custN = () => LEVEL[S.diff].cust, fryMs = () => LEVEL[S.diff].fry;
  const Q = () => { const q = arr(S.mode === 'vs' ? L.q : S.q); return q.length ? q : [0]; }, selI = () => { if (selRun !== S.id) { selRun = S.id; mySel = -1; } const k = Q().indexOf(mySel); return k < 0 ? 0 : k; }; // q[0]이 가장 먼저 온 손님(맨 오른쪽). 누구 것을 만들지는 각자 따로 고른다
  const servedN = () => (S.mode === 'vs' ? L.n : S.n || 0);
  function pickCust(qi) { if (qi === curIdx()) return; sfx('tock'); mySel = qi; paint(); }
  const curIdx = () => Q()[selI()], trayAt = qi => { if (S.mode === 'vs') return (L.trays[qi] = L.trays[qi] || { st: [], c: 0 }); const t = (S.tr || {})[qi] || {}; return { d: t.d, s: t.s, c: t.c || 0, st: arr(t.st) }; }, curTray = () => trayAt(curIdx()); // 손님 자리마다 쟁반이 따로 있어서 여러 손님 것을 같이 준비할 수 있다

  // 메뉴판: 그림만 보고도 무엇인지 알 수 있게, 그 난이도에 나오는 음료·사이드·재료를 이름과 함께 보여 준다
  function menuBook(d) {
    const LV = LEVEL[d], cell = (svg, name) => h('div', { class: 'bg-mi' }, h('span', { html: svg }), h('small', null, name));
    modal({ title: `📖 메뉴판 (난이도 ${LV.name})`, body: h('div', { class: 'bg-menu' },
      h('b', null, '음료'), h('div', { class: 'bg-grid' }, LV.drinks.map(k => cell(drinkPic(k), DRINK[k][0]))),
      h('b', null, '사이드 (튀김기에서 알맞게 튀겨요)'), h('div', { class: 'bg-grid' }, LV.sides.map(k => cell(SIDE[k][1], SIDE[k][0]))),
      h('b', null, '버거 재료 (패티는 불판에서 구워요)'), h('div', { class: 'bg-grid ing' }, cell(one('bunT'), '햄버거빵'), LV.btn.map(k => cell(one(k), k === 'beef' && d === 'e' ? '패티' : FILL[k]))),
      h('p', { class: 'dim' }, '버거는 말풍선 그림의 아래 빵부터 위로 차례대로 쌓아요. 패티와 튀김은 바늘이 초록 칸에 있을 때 꺼내야 하고, 늦으면 타서 버려져요. 미리 구워 둘 수 있어요(불판 5칸 · 튀김기 3칸).')), actions: [{ label: '닫기', primary: true }] });
  }

  /* ----- 로비 ----- */
  function lobby() {
    const chip = (on, label, fn, sub) => h('button', { class: 'bg-chip' + (on ? ' on' : ''), onClick: fn }, h('b', null, label), sub && h('small', null, sub));
    if (mode === 'vs' && diff === 'e') diff = 'm';
    const online = !!(pid() && ctx.presence && ctx.presence[pid()]);
    if (!picked) myRole = !online ? 'both' : myRole === 'both' ? 'main' : myRole; // 상대가 접속해 있지 않으면 처음부터 '혼자'
    const pr = pid() && roles[pid()], LV = LEVEL[diff];
    const bestKey = (mode === 'coop' ? 'coop-' + diff : 'vs-' + diff + '-' + ctx.uid) + (onlyOn ? '-b' : calcOn ? '-c' : ''), b = best[bestKey];
    box.replaceChildren(...[
      h('img', { class: 'bg-hero-img', src: IMG + 'hero.webp', alt: '' }), h('div', { class: 'bg-hero' }, h('div', null, h('b', null, '카피 버거'), h('small', null, '동물 손님 30종이 찾아와요. 말풍선 주문대로 준비해 주세요'))),
      h('label', { class: 'lbl' }, '모드'),
      h('div', { class: 'bg-row' }, chip(mode === 'coop', '🤝 협동', () => { mode = 'coop'; lobby(); }, '역할을 나눠 한 쟁반'), chip(mode === 'vs', '⚔️ 경쟁', () => { mode = 'vs'; lobby(); }, '같은 손님, 총점 대결')),
      h('label', { class: 'lbl' }, '난이도'),
      h('div', { class: 'bg-row' }, (mode === 'coop' ? ['e', 'm', 'h'] : ['m', 'h']).map(k => chip(diff === k, LEVEL[k].name, () => { diff = k; lobby(); }, `${LEVEL[k][mode === 'coop' ? 'coop' : 'vs']}초`))),
      h('p', { class: 'dim bg-note' }, `손님 ${LV.cust > 1 ? '최대 ' + LV.cust + '명 동시' : '1명씩'} · 튀김 ${LV.fry / 1000}초 · 음료 ${LV.drinks.length}종 · 사이드 ${LV.sides.length}종 · 버거 재료 ${LV.btn.length}종${diff !== 'e' ? ' · 쉬운 손님도 가끔 와요' : ''}`),
      mode === 'coop' && !onlyOn && h('label', { class: 'lbl' }, '내 역할'),
      mode === 'coop' && !onlyOn && h('div', { class: 'bg-row' }, [['main', '🍔 메인', '굽기 · 버거 · 포장'], ['aux', '🥤 보조', '음료 · 튀김 · 계산'], ['both', '🙋 혼자', '전부 다']].map(([k, n, sub]) => chip(myRole === k, n, () => { myRole = k; picked = true; ctx.store.set('games/burgerRole/' + ctx.uid, k).catch(() => {}); lobby(); }, sub))),
      mode === 'coop' && onlyOn && h('p', { class: 'dim bg-note' }, '버거만 모드에서는 역할 없이 둘 다 불판과 버거를 써요'),
      mode === 'coop' && !onlyOn && h('p', { class: 'dim bg-note' + (myRole !== 'both' && !online ? ' warn' : '') }, myRole === 'both' ? '혼자서 음료·사이드·버거·포장을 모두 해요' : !online ? `⚠️ ${pid() ? ctx.nameOf(pid()) + '가 지금 접속해 있지 않아요.' : '상대가 없어요.'} 메인은 버거만, 보조는 음료·사이드만 할 수 있으니 혼자 할 땐 '혼자'를 골라 주세요` : pid() ? `${ctx.nameOf(pid())}: ${pr === 'main' ? '메인' : pr === 'aux' ? '보조' : '아직 안 골랐어요'} · 시작하면 상대는 ${myRole === 'main' ? '보조' : '메인'}를 맡아요` : '상대가 들어오면 반대 역할을 맡아요'),
      mode === 'vs' && h('p', { class: 'dim bg-note' }, '각자 음료·버거·포장을 만들어요. 사이드는 선택(맞히면 보너스 +30)이고, 시간이 끝났을 때 총점이 높은 쪽이 이겨요'),
      h('label', { class: 'lbl' }, '옵션'),
      h('div', { class: 'bg-row' }, chip(onlyOn, `🍔 버거만 굽기 ${onlyOn ? '켜짐' : '꺼짐'}`, () => { onlyOn = !onlyOn; lobby(); }, '음료·사이드·계산·포장 없이 패티 굽고 버거만 쌓아요')),
      !onlyOn && h('div', { class: 'bg-row' }, chip(calcOn, `💵 계산 모드 ${calcOn ? '켜짐' : '꺼짐'}`, () => { calcOn = !calcOn; lobby(); }, `손님이 낸 돈의 거스름돈 암산 (${diff === 'h' ? '100원 단위' : '1,000원 단위'})${mode === 'coop' ? ' · 보조가 계산' : ''}`)),
      h('div', { class: 'bg-row' }, h('button', { class: 'btn', onClick: () => menuBook(diff) }, '📖 메뉴판'), h('button', { class: 'btn primary big', style: { flex: 2 }, onClick: askGuide }, '시작')),
      b && h('p', { class: 'dim center' }, `${mode === 'coop' ? '우리' : '내'} 최고 기록 ${b.s}점`)].filter(Boolean));
  }
  // 시작 전에 설명을 들을지 묻는다
  function askGuide() {
    modal({ title: '시작하기 전에', body: h('p', { class: 'center' }, '하는 방법 설명을 들을까요?'), actions: [{ label: '바로 시작', onClick: c => { c(); start(); } }, { label: '📖 설명 듣기', primary: true, onClick: c => { c(); guide(); } }] });
  }
  function guide() {
    const LV = LEVEL[diff], coop = mode === 'coop', n = LV.cust, step = (ic, t, d) => h('div', { class: 'bg-g' }, h('span', { html: ic }), h('div', null, h('b', null, t), h('p', null, d)));
    modal({ title: `📖 카피 버거 하는 법 (${coop ? '협동' : '경쟁'} · ${LV.name}${onlyOn ? ' · 버거만' : ''})`, body: h('div', { class: 'bg-guide' }, ...[
      step(ANIMALS[0][0], '손님이 와요', n > 1 ? `손님이 왼쪽에서 걸어와 줄을 서요. 한 번에 최대 ${n}명이고, 빨간 "먼저!"가 붙은 오른쪽 손님이 가장 먼저 온 손님이에요. 먼저 온 손님을 두고 다른 손님 것을 먼저 내면 ${SKIP}점이 깎여요.` : '손님이 왼쪽에서 걸어와요. 말풍선에 포장/매장, 음료, 사이드, 버거가 그려져 있어요.'),
      n > 1 && step('<b class="bg-g-em">👆</b>', '누구 것을 만들지 고르기', '손님 카드나 그 아래 쟁반을 누르면 그 손님 쟁반에 재료가 올라가요. 손님마다 쟁반이 따로 있어서 여러 손님 것을 같이 준비할 수 있어요.'),
      !onlyOn && step(drinkPic('cola'), '음료', '음료 탭에서 손님이 주문한 음료를 눌러요.' + (diff === 'h' ? ' 검은 "0" 딱지가 붙은 건 제로 음료라 따로 골라야 해요.' : '')),
      !onlyOn && step(SIDE.fries[1], '사이드는 튀김기에', `사이드를 누르면 왼쪽 튀김기에 들어가요. ${LV.fry / 1000}초 뒤 "지금"이 뜨면 눌러서 건져요. 너무 늦으면 타서 버려져요.` + (diff === 'h' ? ' 휠랩만 튀기지 않고 바로 올라가요.' : '') + (coop ? '' : ' 경쟁에서는 사이드가 선택(맞히면 +30)이에요.')),
      step(pic('p-beef'), '패티는 불판에', '패티를 누르면 오른쪽 불판에 올라가요. 바늘이 초록 칸에 왔을 때 눌러서 꺼내요. 일찍 누르면 안 꺼내지고, 늦으면 타요. 불판 5칸이라 미리 여러 장 구워 둘 수 있어요.'),
      step('<b class="bg-g-em">🧺</b>', '보관함', '꺼낸 것은 기기 아래 보관함에 모여요. 보관함에서는 식거나 타지 않고, 눌러서 원하는 때 원하는 손님 쟁반에 올려요.'),
      step(one('bunT'), '버거 쌓기', '말풍선 그림의 아래 빵부터 위로 차례대로: 빵 → 재료 → 빵. 순서가 다르면 틀려요. ↩는 하나 빼기, 🗑는 다시 쌓기예요.'),
      calcOn && !onlyOn && step('<b class="bg-g-em">💵</b>', '계산 (맨 마지막)', `손님이 낸 돈에서 합계를 뺀 거스름돈을 단추로 맞춰요 (${diff === 'h' ? '100원 단위까지' : '1,000원 단위'}). 맞히면 +40점.`),
      step('<b class="bg-g-em">🛍️</b>', '내보내기', onlyOn ? '다 쌓았으면 "손님에게 내기"를 눌러요. 버거가 주문과 똑같아야 점수를 받아요.' : '다 됐으면 손님 주문대로 "포장"이나 "매장"을 눌러요. 버거·음료·사이드·포장이 맞을수록 점수가 높고, 전부 맞으면 보너스가 붙어요.'),
      coop && !onlyOn && step('<b class="bg-g-em">🤝</b>', '역할', myRole === 'both' ? '지금은 "혼자"라서 전부 직접 해요.' : `나는 ${myRole === 'main' ? '메인: 불판·버거·포장' : '보조: 음료·튀김' + (calcOn ? '·계산' : '')}을 맡아요. 상대가 없으면 화면 맨 아래 "혼자 다 하기"를 누르면 돼요.`),
      h('p', { class: 'dim center' }, `제한 시간 ${LV[coop ? 'coop' : 'vs'] + (calcOn && !onlyOn ? 40 : 0)}초 동안 최대한 많은 손님을 받아요. 게임 중 📖를 누르면 메뉴 그림을 다시 볼 수 있어요.`)].filter(Boolean)),
      actions: [{ label: '닫기' }, { label: '시작!', primary: true, onClick: c => { c(); start(); } }] });
  }
  function start() {
    const L0 = LEVEL[diff], run = { id: Math.random().toString(36).slice(2, 9), mode, diff, calc: (!onlyOn && calcOn) || null, only: onlyOn || null, seed: Math.floor(Math.random() * 1e6), startAt: now() + 3600, dur: L0[mode === 'coop' ? 'coop' : 'vs'] + (calcOn && !onlyOn ? 40 : 0), by: ctx.uid };
    if (mode === 'coop') Object.assign(run, { q: Array.from({ length: L0.cust }, (_, i) => i), nx: L0.cust, sel: 0, score: 0, n: 0, roles: onlyOn ? { [ctx.uid]: 'both', ...(pid() ? { [pid()]: 'both' } : {}) } : myRole === 'both' || !pid() ? { [ctx.uid]: 'both' } : { [ctx.uid]: myRole, [pid()]: myRole === 'main' ? 'aux' : 'main' } });
    dismissed = ''; ctx.store.set(PATH, run).catch(() => toast('시작하지 못했어요'));
  }

  /* ----- 진행 ----- */
  const iconBtn = (svg, label, on, fn, cls = '') => h('button', { class: 'bg-btn ' + cls + (on ? ' on' : ''), onClick: fn }, h('span', { html: svg }), h('small', null, label));
  function setTray(patch) {
    const si = curIdx();
    if (S.mode === 'vs') { Object.assign(trayAt(si), patch); return paint(); }
    S.tr = { ...(S.tr || {}), [si]: { ...curTray(), ...patch } }; paint(); // 먼저 내 화면에 반영
    ctx.store.update(PATH + '/tr/' + si, Object.fromEntries(Object.entries(patch).map(([k, v]) => [k, (Array.isArray(v) && !v.length) || v === 0 ? null : v]))).catch(() => {});
  }
  function serve(pack) {
    const o = orderOf(S.seed, curIdx(), S.diff), calc = !!S.calc;
    if (S.mode === 'vs') {
      const k = selI(), r = judge(o, curTray(), pack, true, calc, !!S.only); if (k > 0) { r.pts -= SKIP; r.skip = true; } L.score += r.pts; delete L.trays[L.q[k]]; L.q.splice(k, 1); L.q.push(L.nx++); L.n++; mySel = -1; tab = 'd'; feedback(r);
      ctx.store.update(`${PATH}/sc/${ctx.uid}`, { s: L.score, n: L.n }).catch(() => {}); return paint();
    }
    const id = S.id, idx = curIdx(); mySel = -1;
    ctx.store.tx(PATH, cur => { if (!cur || cur.id !== id) return; const q = arr(cur.q), k = q.indexOf(idx); if (k < 0) return; q.splice(k, 1); q.push(cur.nx || q.length + 1); // 줄에서 빠지고, 새 손님은 맨 뒤(왼쪽)에 선다
      const t = (cur.tr || {})[idx] || {}, r = judge(o, { d: t.d, s: t.s, c: t.c || 0, st: arr(t.st) }, pack, false, calc, !!cur.only); if (k > 0) { r.pts -= SKIP; r.skip = true; }
      return { ...cur, q, nx: (cur.nx || q.length) + 1, n: (cur.n || 0) + 1, score: (cur.score || 0) + r.pts, tr: { ...(cur.tr || {}), [idx]: null }, last: { i: idx, ok: r.ok, pts: r.pts, perfect: r.perfect, only: r.only || null, skip: r.skip || null, at: now() } }; }).catch(() => {});
  }
  function feedback(r) { flash = { r, until: Date.now() + 1400 }; sfx(r.skip ? 'bad' : r.perfect ? 'pair' : r.pts > 0 ? 'coin' : 'bad'); }

  // 불판·튀김기: 0 덜 익음 → 1 알맞음 → 2 탐
  const stage = (slot, cook) => { const e = performance.now() - slot.t0; return e < cook ? 0 : e < cook + LEVEL[S.diff].win ? 1 : 2; };
  const gaugeBg = cook => { const T = cook + LEVEL[S.diff].win + TAIL, a = cook / T * 100, b = (cook + LEVEL[S.diff].win) / T * 100; return `linear-gradient(90deg,#E9DEC8 0 ${a}%,#57C26B ${a}% ${b}%,#E5484D ${b}% 100%)`; };
  function putOn(list, k, max, full) { const i = list.findIndex(x => !x); if (i < 0) return toast(full, 1400); list[i] = { k, t0: performance.now() }; sfx(list === K.grill ? 'sear' : 'splash'); drawCtl(); }
  function takeFrom(list, i, cook, onGood, keep) {
    const sl = list[i]; if (!sl) return; const st = stage(sl, cook);
    if (st === 0) { sfx('tock'); return toast('아직 덜 익었어요', 900); }
    if (st === 1 && keep.length >= HOLD) { sfx('miss'); return toast('보관함이 꽉 찼어요. 먼저 쟁반에 올려 주세요', 1300); }
    list[i] = null;
    if (st === 2) { sfx('bad'); toast('타 버렸어요! 버렸어요', 1100); return drawCtl(); }
    sfx('pop'); keep.push(sl.k); drawCtl(); // 꺼낸 것은 보관함에 두었다가 원하는 때 원하는 쟁반에 올린다
  }
  // 보관함: 다 익은 것을 모아 두는 곳. 식거나 타지 않는다
  const holdRow = (keep, pic1, onUse, label) => h('div', { class: 'bg-hold' }, h('small', null, label), keep.map((k, i) => h('button', { class: 'bg-held', 'data-h': i, 'data-k': k, onClick: () => onUse(i), html: pic1(k) })), !keep.length && h('em', null, '익으면 눌러 꺼내 두기'));
  const cooker = (list, cook, attr, cls, onTake, icon) => h('div', { class: 'bg-cook ' + cls }, list.map((sl, i) => (sl
    ? h('button', { class: 'bg-pan', [attr]: i, onClick: () => onTake(i) }, h('span', { html: icon(sl.k) }), cls === 'fry' && h('em', { class: 'bg-sec' }), h('i', { class: 'bg-gauge', style: { background: gaugeBg(cook) } }, h('b')))
    : h('div', { class: 'bg-pan empty' }))));
  function tickCookers() {
    const n = phase() === 'play' ? K.grill.filter(Boolean).length + K.fry.filter(Boolean).length : 0; sizzle(n); if (n && Math.random() < Math.min(0.5, 0.2 * n)) sfx('crackle'); // 굽고 튀기는 동안 지글지글
    for (const [sel, list, cook] of [['[data-g]', K.grill, COOK], ['[data-f]', K.fry, fryMs()]]) for (const e of box.querySelectorAll(sel)) {
      const sl = list[+e.getAttribute(sel.slice(1, -1))]; if (!sl) continue; const T = cook + LEVEL[S.diff].win + TAIL, p = Math.min(1, (performance.now() - sl.t0) / T), st = stage(sl, cook);
      e.querySelector('.bg-gauge b').style.left = p * 100 + '%'; e.dataset.st = st;
      const done = e.querySelector('.bg-pt img:last-child'); if (done) done.style.opacity = Math.min(1, Math.max(0, (performance.now() - sl.t0) / cook * 1.15 - 0.15));
      const sec = e.querySelector('.bg-sec'); if (sec) { const el2 = performance.now() - sl.t0, txt = st === 0 ? Math.ceil((cook - el2) / 1000) + '초' : st === 1 ? '지금 ' + Math.max(1, Math.ceil((cook + LEVEL[S.diff].win - el2) / 1000)) : '탐'; if (sec.textContent !== txt) sec.textContent = txt; }
    }
  }

  // 손님이 왼쪽에서 걸어 들어와 줄을 서고(먼저 온 손님이 오른쪽), 음식을 받으면 오른쪽으로 걸어 나간다
  let walkRun = '';
  function walkOut(q) { // 다시 그리기 전: 손님마다 지금 위치를 적어 둔다
    const pos = {}, area = box.querySelector('.bg-cust'); if (!area || walkRun !== S.id) return pos; const ar = area.getBoundingClientRect();
    area.querySelectorAll('.bg-walker').forEach(e => { const r = e.getBoundingClientRect(), c = e.closest('.bg-cc'); pos[e.dataset.w] = { html: e.innerHTML, x: r.left - ar.left, y: r.top - ar.top, w: r.width, cx: c ? c.getBoundingClientRect().left : 0 }; });
    return pos;
  }
  function walkIn(q, pos, ph) {
    const area = box.querySelector('.bg-cust'), fresh = walkRun !== S.id; if (!area || ph !== 'play') { walkRun = ''; return; } walkRun = S.id;
    const ar = area.getBoundingClientRect(), ghost = (o, to, ms, delay, cls, done) => { const g = h('span', { class: 'bg-ghost ' + cls, style: { left: o.x + 'px', top: o.y + 'px', width: o.w + 'px' }, html: o.html }); area.append(g);
      const an = g.animate([{ transform: 'translateX(0)' }, { transform: `translateX(${to - o.x}px)` }], { duration: ms, delay, easing: 'linear', fill: 'both' }); an.onfinish = () => { g.remove(); done && done(); }; };
    if (!fresh) Object.keys(pos).forEach(k => { if (!q.includes(+k)) ghost(pos[k], ar.width + 10, 400 + (ar.width - pos[k].x) * 3, 0, 'behind'); }); // 음식을 받은 손님은 카드 뒤로 해서 오른쪽 밖으로
    q.forEach((qi, i) => { const e = area.querySelector(`.bg-walker[data-w="${qi}"]`); if (!e) return; const r = e.getBoundingClientRect(), x = r.left - ar.left, card = e.closest('.bg-cc') || area.querySelector('.bg-bubble'), old = !fresh && pos[qi];
      if (old) { if (card && e.closest('.bg-cc') && Math.abs(old.cx - card.getBoundingClientRect().left) > 2) card.animate([{ transform: `translateX(${old.cx - card.getBoundingClientRect().left}px)` }, { transform: 'none' }], { duration: 380, easing: 'ease-out' }); return; } // 줄이 당겨지면 카드째로 옆으로
      e.style.visibility = 'hidden'; if (card) card.classList.add('coming'); // 새 손님: 맨 왼쪽 자리까지만 걸어오니 아무도 지나치지 않는다
      ghost({ html: e.innerHTML, x: -r.width - 6, y: r.top - ar.top, w: r.width }, x, 420 + x * 3, fresh ? i * 420 : 380, '', () => { e.style.visibility = ''; if (card) card.classList.remove('coming'); }); });
  }

  let top, trayEl, ctl;
  function drawTop() {
    const vs = S.mode === 'vs', left = Math.max(0, Math.ceil((endAt(S) - now()) / 1000)), other = vs && pid() && (S.sc || {})[pid()];
    top.replaceChildren(h('b', { class: 'bg-time' + (left <= 10 ? ' hot' : '') }, `⏱ ${left}초`), h('span', null, vs ? `나 ${L.score}점${other ? ` : ${ctx.nameOf(pid())} ${other.s}점` : ''}` : `점수 ${S.score || 0}`),
      h('small', null, `손님 ${servedN() + 1}번째 · ${LEVEL[S.diff].name}`), h('button', { class: 'bg-book', 'aria-label': '메뉴판', onClick: () => menuBook(S.diff) }, '📖'));
  }
  function drawTray() {
    const vs = S.mode === 'vs', tray = curTray(), fl = flash && Date.now() < flash.until ? flash.r : null;
    const q = Q(), slots = (t, mini) => [
      !S.only && h('div', { class: 'bg-slot d' + (t.d ? ' has' : '') }, t.d ? h('span', { class: 'bg-ic', html: drinkPic(t.d) }) : h('i', null, '음료')),
      !S.only && h('div', { class: 'bg-slot s' + (t.s ? ' has' : '') }, t.s ? h('span', { class: 'bg-ic', html: SIDE[t.s][1] }) : h('i', null, vs && !mini ? '사이드(선택)' : '사이드')),
      h('div', { class: 'bg-slot wide' + (t.st.length ? ' has' : ''), html: t.st.length ? stackSvg(t.st) : '<i>버거</i>' }),
      S.calc && h('div', { class: 'bg-slot money' + (t.c ? ' has' : '') }, t.c ? h('b', null, won(t.c)) : h('i', null, '거스름돈'))].filter(Boolean);
    trayEl.classList.toggle('multi', q.length > 1); trayEl.classList.toggle('only', !!S.only);
    trayEl.replaceChildren(...[
      ...(q.length > 1 // 손님 수만큼 쟁반: 위의 손님과 같은 자리(먼저 온 손님이 오른쪽). 눌러서 고른다
        ? q.map((qi, k) => [qi, k]).reverse().map(([qi, k]) => h('button', { class: 'bg-mt' + (qi === curIdx() ? ' on' : '') + (k === 0 ? ' first' : ''), 'data-q': qi, onClick: () => pickCust(qi) }, slots(trayAt(qi), true)))
        : slots(tray)),
      fl && h('div', { class: 'bg-flash' + (fl.perfect ? ' perfect' : '') }, [['b', '버거'], ['d', '음료'], ['s', '사이드'], ['p', '포장'], ['c', '계산']].filter(([k]) => k in fl.ok).map(([k, n]) => h('span', { class: fl.ok[k] ? 'ok' : 'no' }, `${n} ${fl.ok[k] ? '○' : '✕'}`)),
        h('em', null, '★'.repeat(fl.only ? (fl.ok.b ? 5 : 0) : (fl.ok.b ? 2 : 0) + (fl.ok.d ? 1 : 0) + (fl.ok.s ? 1 : 0) + (fl.ok.p ? 1 : 0)).padEnd(5, '☆')), fl.skip && h('span', { class: 'no' }, `순서 어김 −${SKIP}`), h('b', null, `${fl.pts >= 0 ? '+' : ''}${fl.pts}`))].filter(Boolean));
  }
  function drawCtl() {
    const ph = phase(), role = roleOf(), vs = S.mode === 'vs', LV = LEVEL[S.diff], tray = curTray(), o = orderOf(S.seed, curIdx(), S.diff);
    if (ph === 'ready') return ctl.replaceChildren(h('div', { class: 'bg-count' }, String(Math.max(1, Math.ceil((S.startAt - now()) / 1000))), h('small', null, role === 'watch' ? '구경하기' : role === 'main' ? '나는 메인: 굽기 · 버거 · 포장' : role === 'aux' ? `나는 보조: 음료 · 튀김${S.calc ? ' · 계산' : ''}` : '준비…')));
    if (role === 'watch') return ctl.replaceChildren(h('p', { class: 'dim center' }, '상대가 혼자 하는 중이에요. 구경해요 👀'));
    const add = k => { if (tray.st.length >= 12) return toast('더 쌓을 수 없어요', 900); sfx('tock'); setTray({ st: [...tray.st, k] }); };
    const drinks = () => h('div', { class: 'bg-grid' }, LV.drinks.map(k => iconBtn(drinkPic(k), DRINK[k][0], tray.d === k, () => { sfx('tock'); if (role === 'both') tab = 's'; setTray({ d: k }); })));
    const fryBox = () => h('div', { class: 'bg-station fryS' }, cooker(K.fry, fryMs(), 'data-f', 'fry', i => takeFrom(K.fry, i, fryMs(), null, K.hf), k => SIDE[k][1]),
      holdRow(K.hf, k => SIDE[k][1], i => { const k = K.hf.splice(i, 1)[0]; if (tray.s && !NOFRY[tray.s] && K.hf.length < HOLD) K.hf.push(tray.s); sfx('tock'); if (role === 'both' && tab === 's') tab = 'b'; setTray({ s: k }); }, '🫕'));
    const grillBox = () => h('div', { class: 'bg-station grillS' }, cooker(K.grill, COOK, 'data-g', 'grill', i => takeFrom(K.grill, i, COOK, null, K.hg), k => `<span class="bg-pt">${pic('p-' + k + '-raw')}${pic('p-' + k)}</span>`),
      holdRow(K.hg, k => pic('p-' + k), i => { if (tray.st.length >= 12) return toast('더 쌓을 수 없어요', 900); add(K.hg.splice(i, 1)[0]); }, '🔥'));
    const kitchen = () => h('div', { class: 'bg-kitchen' + (role === 'both' && !S.only ? '' : ' one') }, role !== 'main' && !S.only && fryBox(), role !== 'aux' && grillBox());
    const sides = () => [
      h('div', { class: 'bg-grid' }, LV.sides.map(k => iconBtn(SIDE[k][1], SIDE[k][0], tray.s === k, () => (NOFRY[k] ? (sfx('tock'), role === 'both' && (tab = 'b'), setTray({ s: k })) : putOn(K.fry, k, FRYER, '튀김기가 꽉 찼어요')), NOFRY[k] ? '' : 'raw fry')),
        role === 'both' && h('button', { class: 'bg-btn skip', onClick: () => { tab = 'b'; setTray({ s: null }); } }, h('span', null, '⏭'), h('small', null, vs ? '건너뛰기' : '없음')))];
    const unstack = n => { if (!tray.st.length) return; const keepN = Math.max(0, tray.st.length - n); tray.st.slice(keepN).forEach(k => { if (PATTY[k] && K.hg.length < HOLD) K.hg.push(k); }); setTray({ st: tray.st.slice(0, keepN) }); };
    const packBtns = () => (S.only ? [h('button', { class: 'bg-pack wide2', onClick: () => serve('in') }, '🍔 손님에게 내기')] : [h('button', { class: 'bg-pack', onClick: () => serve('out') }, '🛍️ 포장'), h('button', { class: 'bg-pack', onClick: () => serve('in') }, '🍽️ 매장')]);
    const burger = () => [
      h('div', { class: 'bg-grid ing' }, iconBtn(one(tray.st.length ? 'bunT' : 'bunB'), '햄버거빵', false, () => add('bun')),
        LV.btn.map(k => (PATTY[k] ? iconBtn(one(k), k === 'beef' && S.diff === 'e' ? '패티' : FILL[k], false, () => putOn(K.grill, k, GRILL, '불판이 꽉 찼어요'), 'raw grl') : iconBtn(one(k), FILL[k], false, () => add(k))))),
      h('div', { class: 'bg-fin' }, h('button', { class: 'bg-mini', 'aria-label': '하나 빼기', onClick: () => unstack(1) }, '↩'), h('button', { class: 'bg-mini', 'aria-label': '다시 쌓기', onClick: () => unstack(99) }, '🗑'),
        ...(role === 'both' && S.calc ? [h('button', { class: 'bg-pack next', onClick: () => { tab = 'c'; drawCtl(); } }, '💵 계산하러 가기 ▶')] : packBtns()))];
    const calc = () => [h('div', { class: 'bg-calc' },
      h('p', null, h('span', null, '받은 돈 ', h('b', null, won(o.paid))), h('span', null, ' − 합계 ', h('b', null, won(o.price)))),
      h('p', { class: 'bg-change' }, '거스름돈 ', h('b', null, won(tray.c || 0)), h('button', { class: 'btn sm', onClick: () => setTray({ c: 0 }) }, '지우기')),
      h('div', { class: 'bg-bills' }, (S.diff === 'h' ? [10000, 5000, 1000, 500, 100] : [10000, 5000, 1000]).map(v => h('button', { class: 'bg-bill' + (v < 1000 ? ' coin' : ''), onClick: () => { sfx('tock'); setTray({ c: Math.min(99900, (tray.c || 0) + v) }); } }, '+' + v.toLocaleString('ko-KR')))))];
    let kids;
    if (role === 'aux') kids = [kitchen(), h('label', { class: 'lbl' }, '음료'), drinks(), h('label', { class: 'lbl' }, '사이드'), ...sides(), ...(S.calc ? [h('label', { class: 'lbl' }, '계산'), ...calc()] : []), h('p', { class: 'dim center' }, '버거와 포장은 메인이 해요. 쟁반에 올리면 바로 보여요')];
    else if (role === 'main') kids = [kitchen(), ...burger()];
    const takeAll = () => { S.roles = { ...(S.roles || {}), [ctx.uid]: 'both' }; tab = 'd'; ctx.store.update(PATH + '/roles', { [ctx.uid]: 'both' }).catch(() => {}); paint(); };
    if (role === 'aux' || role === 'main') kids.push(h('button', { class: 'bg-solo', onClick: takeAll }, role === 'main' ? '🙋 음료·사이드도 내가 하기 (혼자 다 하기)' : '🙋 버거·포장도 내가 하기 (혼자 다 하기)'));
    else if (S.only) kids = [kitchen(), ...burger()];
    else { const tabs = [['d', '① 음료'], ['s', vs ? '② 사이드(선택)' : '② 사이드'], ['b', S.calc ? '③ 버거' : '③ 버거·포장'], ...(S.calc ? [['c', '④ 계산·포장']] : [])]; // 계산은 맨 마지막
      kids = [kitchen(), h('div', { class: 'bg-tabs' }, tabs.map(([k, n]) => h('button', { class: 'bg-tab' + (tab === k ? ' on' : ''), onClick: () => { tab = k; drawCtl(); } }, n))), ...(tab === 'd' ? [drinks()] : tab === 's' ? sides() : tab === 'c' ? [...calc(), h('div', { class: 'bg-fin two' }, packBtns())] : burger())]; }
    ctl.replaceChildren(...kids.filter(Boolean)); tickCookers();
  }

  function play(ph) {
    const vs = S.mode === 'vs', idx = curIdx(), o = orderOf(S.seed, idx, S.diff), an = ANIMALS[o.a], role = roleOf();
    if (!K || K.id !== S.id) K = { id: S.id, grill: new Array(GRILL).fill(null), fry: new Array(FRYER).fill(null), hg: [], hf: [] };
    // 손님과 말풍선: 포장/매장 → 음료·사이드 → 버거 순서로 하나씩 나타난다
    const q = Q(), si = selI(), key = q.join(',') + '|' + q[si] + '|' + ph;
    if (shownRun !== S.id || shownIdx !== key || !top || !top.isConnected) { const leaving = walkOut(q); if (ph === 'play' && (shownRun !== S.id || String(shownIdx).split('|')[0] !== q.join(',') || String(shownIdx).split('|')[2] !== ph)) sfx('flip'); shownRun = S.id; shownIdx = key;
      box.dataset.only = S.only ? '1' : '';
      box.dataset.fills = o.fills.join(' '); box.dataset.pack = o.pack; box.dataset.change = o.paid - o.price;
      top = h('div', { class: 'bg-top' }); trayEl = h('div', { class: 'bg-tray' }); ctl = h('div', { class: 'bg-ctl' });
      const showPaid = S.calc && role !== 'main';
      box.replaceChildren(top, q.length > 1
        ? h('div', { class: 'bg-cust multi' }, q.map((qi, i) => [qi, i]).reverse().map(([qi, i]) => { const oo = orderOf(S.seed, qi, S.diff), a2 = ANIMALS[oo.a]; // 손님을 눌러서 누구 것을 만들지 고른다
          return h('button', { class: 'bg-cc' + (i === si ? ' on' : '') + (i === 0 ? ' first' : ''), 'data-q': qi, 'data-pos': i, 'data-pack': oo.pack, 'data-fills': oo.fills.join(' '), 'data-change': oo.paid - oo.price, onClick: () => pickCust(qi) },
            h('b', { class: 'bg-cc-n' }, i === 0 ? '먼저!' : String(i + 1)),
            !S.only && h('div', { class: 'bg-cc-h' }, h('span', { class: 'bg-cc-k' }, oo.pack === 'out' ? '🛍️' : '🍽️'), h('i', { html: drinkPic(oo.d) }), h('i', { class: vs ? 'opt' : '', html: SIDE[oo.s][1] })),
            !S.only && h('div', { class: 'bg-cc-t' }, h('b', null, oo.pack === 'out' ? '포장' : '매장'), ' · ', h('span', { class: 'bg-cc-d' }, DRINK[oo.d][0]), ' · ', h('span', { class: 'bg-cc-s' }, SIDE[oo.s][0])),
            h('div', { class: 'bg-cc-r' }, h('span', { class: 'bg-walker', 'data-w': qi, title: a2[1], html: a2[0] }), h('div', { class: 'bg-cc-b', html: stackSvg(['bun', ...oo.fills, 'bun']) })),  showPaid && h('div', { class: 'bg-cc-m' }, `💵 ${oo.paid.toLocaleString('ko-KR')} − ${oo.price.toLocaleString('ko-KR')}`)); }))
        : h('div', { class: 'bg-cust' },
        h('div', { class: 'bg-animal' }, h('span', { class: 'bg-walker', 'data-w': idx, html: an[0] }), h('small', null, an[1])),
        h('div', { class: 'bg-bubble' },
          !S.only && h('div', { class: 'bg-part p1' }, h('span', { class: 'bg-emo' }, o.pack === 'out' ? '🛍️' : '🍽️'), h('small', null, o.pack === 'out' ? '포장' : '매장')),
          !S.only && h('div', { class: 'bg-part p2' }, h('span', { class: 'bg-ic', html: drinkPic(o.d) }), h('small', null, DRINK[o.d][0])),
          !S.only && h('div', { class: 'bg-part p2' + (vs ? ' opt' : '') }, h('span', { class: 'bg-ic', html: SIDE[o.s][1] }), h('small', null, SIDE[o.s][0] + (vs ? ' (선택)' : ''))),
          h('div', { class: 'bg-part p3 burger', html: stackSvg(['bun', ...o.fills, 'bun']) }),
          showPaid && h('div', { class: 'bg-paid p3' }, `💵 ${won(o.paid)} 냈어요 · 합계 ${won(o.price)}`))),
        h('div', { class: 'bg-counter' }), trayEl, ctl); walkIn(q, leaving, ph); }
    drawTop(); drawTray(); drawCtl();
  }

  function result() {
    const vs = S.mode === 'vs', key = (vs ? 'vs-' + S.diff + '-' + ctx.uid : 'coop-' + S.diff) + (S.only ? '-b' : S.calc ? '-c' : ''), mine = vs ? (L && L.id === S.id ? L.score : ((S.sc || {})[ctx.uid] || {}).s || 0) : S.score || 0;
    const other = vs && pid() ? (S.sc || {})[pid()] : null, served = vs ? (L && L.id === S.id ? L.n : 0) : S.n || 0;
    if (fxDone !== S.id) { fxDone = S.id; const prev = best[key];
      if (mine > 0 && (!prev || mine > prev.s)) ctx.store.tx('games/burgerBest/' + key, c => (c && c.s >= mine ? undefined : { s: mine, at: now() })).catch(() => {});
      setTimeout(() => { if (!alive || !S) return; const o2 = vs && pid() ? (S.sc || {})[pid()] : null;
        if (vs && o2) gameFx(mine > o2.s ? 'win' : mine < o2.s ? 'lose' : 'draw', `${mine} : ${o2.s}`); else if (mine > 0) gameFx('win', `${mine}점${prev && mine > prev.s ? ' 신기록' : ''}`); }, vs ? 1300 : 200); }
    box.replaceChildren(h('div', { class: 'bg-end' }, ...[h('span', null, '🍔'), h('b', null, vs ? '경쟁 끝!' : '영업 끝!'),
      h('p', { class: 'bg-big' }, `${mine}점`), h('p', { class: 'dim' }, `손님 ${served}명 · 난이도 ${LEVEL[S.diff].name}${S.only ? ' · 버거만' : S.calc ? ' · 계산 모드' : ''}`),
      vs && h('p', null, other ? `${ctx.nameOf(pid())} ${other.s}점 (손님 ${other.n || 0}명)` : '상대 점수가 아직 없어요'),
      best[key] && h('p', { class: 'dim' }, `${vs ? '내' : '우리'} 최고 기록 ${Math.max(best[key].s, mine)}점`),
      h('button', { class: 'btn primary big', onClick: () => { dismissed = S.id; shownRun = ''; paint(); } }, '다시 하기')].filter(Boolean)));
  }

  function paint() {
    if (!alive) return; const ph = phase(); lastPh = ph;
    if (ph === 'lobby') { shownRun = ''; top = null; return lobby(); }
    seenId = S.id;
    if (S.mode === 'vs' && (!L || L.id !== S.id)) { const n = LEVEL[S.diff].cust; L = { id: S.id, q: Array.from({ length: n }, (_, i) => i), nx: n, sel: 0, score: 0, n: 0, trays: [] }; tab = 'd'; }
    if (ph === 'result') { shownRun = ''; top = null; return result(); }
    play(ph);
  }
  // 0.1초마다: 시간·바늘만 고친다(버튼을 다시 만들면 누르는 도중에 눌림이 사라질 수 있어서 전체를 다시 그리지 않는다)
  function tick() {
    if (!alive) return; const ph = phase(); if (ph !== 'play') sizzle(0);
    if (ph !== lastPh || ph === 'ready') return paint();
    if (ph !== 'play' || !top || !top.isConnected) return;
    const left = Math.max(0, Math.ceil((endAt(S) - now()) / 1000)), t = top.firstChild; if (t) { t.textContent = `⏱ ${left}초`; t.classList.toggle('hot', left <= 10); }
    if (flash && Date.now() >= flash.until) { flash = null; drawTray(); }
    tickCookers();
  }

  const offs = [
    ctx.store.on(PATH, v => { const was = S; S = v || null;
      const same = S && was && S.id === was.id && phase() === lastPh && lastPh === 'play' && top && top.isConnected;
      if (S && was && S.id === was.id && S.mode === 'coop' && S.last && S.last.at !== lastSeen) { lastSeen = S.last.at; if ((was.nx || 0) !== (S.nx || 0)) { tab = 'd'; feedback({ ok: S.last.ok || {}, pts: S.last.pts || 0, perfect: !!S.last.perfect, only: !!S.last.only, skip: !!S.last.skip }); } }
      if (same && (S.mode === 'vs' || (was.nx || 0) === (S.nx || 0))) { drawTop(); drawTray(); if (S.mode === 'coop' && roleOf() !== 'main') drawCtl(); return; } // 상대가 쟁반만 바꿨으면 내 버튼은 그대로 둔다
      paint(); }),
    ctx.store.on('games/burgerRole', v => { roles = v || {}; const pr = pid() && roles[pid()]; if (!picked && (pr === 'main' || pr === 'aux')) myRole = pr === 'main' ? 'aux' : 'main'; if (phase() === 'lobby') lobby(); }), // 상대가 먼저 고르면 나는 반대 역할
    ctx.store.on('games/burgerBest', v => { best = v || {}; if (phase() === 'lobby') lobby(); }),
  ];
  timer = setInterval(tick, 100);
  paint();
  return () => { alive = false; sizzle(0); clearInterval(timer); offs.forEach(f => f()); };
}
