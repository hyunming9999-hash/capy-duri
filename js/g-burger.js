// 카피 버거 — 동물 손님 30종의 주문(포장/매장 → 음료·사이드 → 버거)대로 준비하는 게임
// 협동: 메인(버거·포장)과 보조(음료·사이드)로 역할을 나눠 한 쟁반을 같이 채운다. 경쟁: 같은 손님 순서로 각자 만들어 총점 대결
import { h, toast, modal, gameFx } from './ui.js';
import { sfx } from './sound.js';

const ANIMALS = [['🐶', '강아지'], ['🐱', '고양이'], ['🐭', '생쥐'], ['🐹', '햄스터'], ['🐰', '토끼'], ['🦊', '여우'], ['🐻', '곰'], ['🐼', '판다'], ['🐨', '코알라'], ['🐯', '호랑이'],
  ['🦁', '사자'], ['🐮', '소'], ['🐷', '돼지'], ['🐸', '개구리'], ['🐵', '원숭이'], ['🐔', '닭'], ['🐧', '펭귄'], ['🐤', '병아리'], ['🦆', '오리'], ['🦉', '부엉이'],
  ['🐺', '늑대'], ['🐗', '멧돼지'], ['🐴', '말'], ['🦄', '유니콘'], ['🐢', '거북이'], ['🐙', '문어'], ['🦭', '물개'], ['🦔', '고슴도치'], ['🐿️', '다람쥐'], ['🦝', '너구리']];

/* ---------- 그림 ---------- */
const O = '#5F3F2B';
const cup = (c, b, zero) => `<svg viewBox="0 0 48 48"><path d="M31 3l-3 11" stroke="#E5484D" stroke-width="3" stroke-linecap="round"/><rect x="9" y="12" width="30" height="6" rx="3" fill="${zero ? '#2E2E36' : '#fff'}" stroke="${O}" stroke-width="1.5"/><path d="M12 18h24l-3 26H15z" fill="${c}" stroke="${O}" stroke-width="1.5" stroke-linejoin="round"/><path d="M13 25h22l-1.1 10H14.1z" fill="${zero ? '#2E2E36' : b}"/>${zero ? `<text x="24" y="33.5" text-anchor="middle" font-size="9" font-weight="900" font-family="sans-serif" fill="${b}">0</text>` : ''}</svg>`;
const DRINK = { cola: ['콜라', '#4A2A22', '#E5484D'], cider: ['사이다', '#E3F6E6', '#3FAE5A'], fanta: ['환타', '#FF9D2E', '#F0641A'], dew: ['마운틴듀', '#CBEA4E', '#3F9E3A'], pepper: ['닥터페퍼', '#6A1B2A', '#B8324A'] };
for (const k of Object.keys(DRINK)) DRINK['z' + k] = ['제로' + DRINK[k][0], DRINK[k][1], DRINK[k][2], true];
const friesSvg = (box, dots) => `<svg viewBox="0 0 48 48">${[[14, -14], [19, -6], [24, 0], [29, 6], [34, 14], [22, -10], [27, 10]].map(([x, r]) => `<rect x="${x - 2}" y="6" width="4.4" height="26" rx="1.5" fill="#FFD75E" stroke="#C99A1E" stroke-width="1" transform="rotate(${r} ${x} 30)"/>`).join('')}<path d="M11 24h26l-3 20H14z" fill="${box}" stroke="${O}" stroke-width="1.5" stroke-linejoin="round"/>${dots ? [[16, 14], [22, 10], [28, 15], [33, 11], [25, 19], [19, 20]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="1.5" fill="#E5484D"/>`).join('') + '<path d="M17 31h14" stroke="#FFD75E" stroke-width="3" stroke-linecap="round"/>' : '<circle cx="24" cy="34" r="4" fill="#FFD75E"/>'}</svg>`;
const SIDE = {
  fries: ['감튀', friesSvg('#E5484D')],
  cstick: ['치즈스틱', `<svg viewBox="0 0 48 48"><g transform="rotate(-20 24 24)"><rect x="8" y="12" width="32" height="10" rx="5" fill="#E3A23C" stroke="#A86F1C" stroke-width="1.4"/><rect x="8" y="27" width="32" height="10" rx="5" fill="#E3A23C" stroke="#A86F1C" stroke-width="1.4"/><path d="M38 14v6M38 29v6" stroke="#FFF6D6" stroke-width="3" stroke-linecap="round"/></g></svg>`],
  hash: ['해쉬브라운', `<svg viewBox="0 0 48 48"><ellipse cx="24" cy="25" rx="19" ry="13" fill="#E8B04A" stroke="#A86F1C" stroke-width="1.5"/>${[[14, 22], [20, 28], [26, 21], [31, 29], [34, 23], [18, 18], [25, 32]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="1.8" fill="#C98A2A"/>`).join('')}</svg>`],
  lstick: ['롱치즈스틱', `<svg viewBox="0 0 48 48"><g transform="rotate(-38 24 24)"><rect x="0" y="19" width="48" height="10" rx="5" fill="#E3A23C" stroke="#A86F1C" stroke-width="1.4"/><path d="M6 24h36" stroke="#F5C76A" stroke-width="2" stroke-dasharray="3 4" stroke-linecap="round"/><rect x="41" y="20.5" width="6" height="7" rx="3" fill="#FFF6D6"/></g></svg>`],
  churros: ['츄러스', `<svg viewBox="0 0 48 48"><path d="M10 40C4 20 20 4 30 12s-6 20-12 14" fill="none" stroke="#A86F1C" stroke-width="9.5" stroke-linecap="round"/><path d="M10 40C4 20 20 4 30 12s-6 20-12 14" fill="none" stroke="#D99A3E" stroke-width="7" stroke-linecap="round"/><path d="M10 40C4 20 20 4 30 12s-6 20-12 14" fill="none" stroke="#FFF6D6" stroke-width="1.6" stroke-dasharray="1 5" stroke-linecap="round"/></svg>`],
  wrap: ['휠랩', `<svg viewBox="0 0 48 48"><g transform="rotate(18 24 24)"><path d="M13 9h22l-3 34H16z" fill="#F4DDB0" stroke="#B5803E" stroke-width="1.5" stroke-linejoin="round"/><path d="M14.5 26h19l-1.5 17H16z" fill="#DADDE5" stroke="#8C8FA3" stroke-width="1.2" stroke-linejoin="round"/><path d="M14 10q5-6 10-1 5-5 10 1" fill="#7DBE5A" stroke="#4F8F3A" stroke-width="1.2"/><circle cx="20" cy="9" r="2.4" fill="#E5484D"/><circle cx="29" cy="8" r="2.4" fill="#E8A63C"/></g></svg>`],
  pie: ['애플파이', `<svg viewBox="0 0 48 48"><g transform="rotate(-14 24 24)"><rect x="5" y="14" width="38" height="20" rx="6" fill="#E8B04A" stroke="#A86F1C" stroke-width="1.5"/><path d="M14 20l6 8M22 20l6 8M30 20l6 8" stroke="#A86F1C" stroke-width="2" stroke-linecap="round"/><path d="M8 17h32" stroke="#F7D48A" stroke-width="2" stroke-linecap="round"/></g></svg>`],
  rings: ['양파튀김', `<svg viewBox="0 0 48 48">${[[17, 19], [31, 21], [24, 32]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="9" fill="none" stroke="#A86F1C" stroke-width="7.5"/><circle cx="${x}" cy="${y}" r="9" fill="none" stroke="#E8B04A" stroke-width="5"/>`).join('')}</svg>`],
  sfries: ['시즈닝감튀', friesSvg('#8B6FE8', true)],
};
// 버거 한 층: [높이, y를 받아 그리는 함수] (너비 96 기준)
const wave = (y, amp, n = 8) => { let d = `M6 ${y}`; for (let i = 0; i < n; i++) d += `q${42 / n} ${i % 2 ? amp : -amp} ${84 / n} 0`; return d; };
const LAY = {
  bunB: [12, y => `<path d="M9 ${y}h78v5a7 7 0 0 1-7 7H16a7 7 0 0 1-7-7z" fill="#E9B872" stroke="#B5803E" stroke-width="1.5"/>`],
  bunT: [23, y => `<path d="M8 ${y + 23}Q7 ${y + 1} 48 ${y + 1}Q89 ${y + 1} 88 ${y + 23}z" fill="#E9B872" stroke="#B5803E" stroke-width="1.5"/>${[[30, 9], [44, 6], [58, 9], [37, 15], [52, 14], [66, 15], [24, 16]].map(([x, d]) => `<ellipse cx="${x}" cy="${y + d}" rx="2.2" ry="1.2" fill="#FFF6D6"/>`).join('')}`],
  beef: [10, y => `<rect x="7" y="${y}" width="82" height="10" rx="5" fill="#6B3F2A" stroke="#44281A" stroke-width="1.3"/><path d="M16 ${y + 4}h10M36 ${y + 6}h12M60 ${y + 4}h14" stroke="#8A5A40" stroke-width="1.6" stroke-linecap="round"/>`],
  chicken: [11, y => `<path d="${wave(y + 2, 3, 10)}v7${'q-4.2 3 -8.4 0'.repeat(10)}z" fill="#E8A63C" stroke="#A86F1C" stroke-width="1.3" stroke-linejoin="round"/>`],
  lettuce: [7, y => `<path d="${wave(y + 3, 4, 9)}v2${'q-4.67 4 -9.33 0'.repeat(9)}z" fill="#8FD06A" stroke="#4F8F3A" stroke-width="1.2" stroke-linejoin="round"/>`],
  onion: [6, y => `<rect x="10" y="${y + 0.5}" width="76" height="5" rx="2.5" fill="#F7EEF7" stroke="#B48CC0" stroke-width="1.2"/>${[22, 40, 58, 76].map(x => `<ellipse cx="${x}" cy="${y + 3}" rx="6" ry="1.3" fill="none" stroke="#B48CC0" stroke-width="1"/>`).join('')}`],
  cheese: [6, y => `<path d="M6 ${y}h84v3l-10 0l-5 3l-5 -3h-22l-6 3l-6 -3H6z" fill="#FFD43B" stroke="#D9A514" stroke-width="1.2" stroke-linejoin="round"/>`],
  tomato: [7, y => `<rect x="10" y="${y + 0.5}" width="37" height="6" rx="3" fill="#E5484D" stroke="#A82A2E" stroke-width="1.2"/><rect x="49" y="${y + 0.5}" width="37" height="6" rx="3" fill="#E5484D" stroke="#A82A2E" stroke-width="1.2"/><path d="M18 ${y + 3.5}h20M57 ${y + 3.5}h20" stroke="#FFB3B5" stroke-width="1.2" stroke-dasharray="2 4" stroke-linecap="round"/>`],
  seafood: [10, y => `<rect x="7" y="${y}" width="82" height="10" rx="5" fill="#F6CE8C" stroke="#C08A3A" stroke-width="1.3"/>${[[18, 4, '#FF9FA8'], [30, 6, '#fff'], [44, 4, '#FF9FA8'], [57, 6, '#fff'], [70, 4, '#FF9FA8'], [80, 6, '#fff']].map(([x, d, c]) => `<circle cx="${x}" cy="${y + d}" r="1.7" fill="${c}"/>`).join('')}`],
  shrimp: [9, y => [16, 36, 56, 76].map(x => `<path d="M${x - 7} ${y + 7}a7 6 0 1 1 13 0" fill="none" stroke="#E86A6A" stroke-width="5" stroke-linecap="round"/><path d="M${x - 7} ${y + 7}a7 6 0 1 1 13 0" fill="none" stroke="#FFB199" stroke-width="2.6" stroke-linecap="round"/>`).join('')],
  chili: [5, y => `<path d="${wave(y + 2.5, 2.2, 12)}" fill="none" stroke="#D5202A" stroke-width="3.6" stroke-linecap="round"/>`],
  sweet: [5, y => `<path d="${wave(y + 2.5, 2.2, 12)}" fill="none" stroke="#F0A51E" stroke-width="3.6" stroke-linecap="round"/>`],
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
const LEVEL = {
  e: { name: '하', drinks: D5.slice(0, 3), sides: S5.slice(0, 2), fills: ['beef', 'tomato', 'lettuce'], btn: ['beef', 'tomato', 'lettuce'], coop: 90 },
  m: { name: '중', drinks: D5, sides: S5, fills: F6, btn: F6, coop: 100, vs: 90 },
  h: { name: '상', drinks: [...D5, ...D5.map(k => 'z' + k)], sides: [...S5, 'wrap', 'pie', 'rings', 'sfries'], fills: [...F6, 'seafood', 'shrimp', 'sauce'], btn: [...F6, 'seafood', 'shrimp', 'chili', 'sweet'], coop: 120, vs: 120 },
};
function rng(a) { return () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
// 같은 seed·번호면 누구 화면에서나 같은 손님이 온다. 어려운 단계에도 네 번에 한 번쯤은 쉬운 손님이 섞인다
export function orderOf(seed, idx, diff) {
  const r = rng(seed * 131 + idx * 7919 + 17), L = LEVEL[diff], easy = diff !== 'e' && r() < 0.25, P = easy ? LEVEL.e : L, pool = P.fills.slice();
  const n = (easy || diff === 'e') ? (r() < 0.12 ? 3 : 1 + Math.floor(r() * 2)) : diff === 'm' ? (r() < 0.07 ? 6 : 2 + Math.floor(r() * 3)) : (r() < 0.05 ? 9 : 3 + Math.floor(r() * 4)); // 전부 넣는 버거는 아주 가끔
  for (let i = pool.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [pool[i], pool[j]] = [pool[j], pool[i]]; }
  const fills = pool.slice(0, Math.min(n, pool.length)).map(k => (k === 'sauce' ? (r() < 0.5 ? 'chili' : 'sweet') : k));
  return { a: Math.floor(r() * ANIMALS.length), d: P.drinks[Math.floor(r() * P.drinks.length)], s: P.sides[Math.floor(r() * P.sides.length)], pack: r() < 0.5 ? 'out' : 'in', fills, easy };
}
// 채점: 버거 60+재료당 10, 음료 30, 사이드 30(경쟁에서는 보너스), 포장/매장 20, 전부 맞으면 +20
export function judge(o, tray, pack, vs) {
  const st = tray.st || [], want = ['bun', ...o.fills, 'bun'];
  const ok = { b: st.length === want.length && want.every((k, i) => st[i] === k), d: tray.d === o.d, s: tray.s === o.s, p: pack === o.pack };
  const perfect = ok.b && ok.d && ok.p && (vs || ok.s);
  return { ok, perfect, pts: (ok.b ? 60 + o.fills.length * 10 : 0) + (ok.d ? 30 : 0) + (ok.s ? 30 : 0) + (ok.p ? 20 : 0) + (perfect ? 20 : 0) };
}
const arr = v => (Array.isArray(v) ? v : v && typeof v === 'object' ? Object.values(v) : []);
const PATH = 'games/burger';

export function mount(el, ctx) {
  let alive = true, S = null, roles = {}, best = {}, timer = 0;
  let mode = 'coop', diff = 'e', myRole = 'main', picked = false; // 로비에서 고른 값
  let L = null;            // 경쟁 모드의 내 진행 상황 { id, idx, score, tray }
  let seenId = '', dismissed = '', fxDone = '', shownIdx = -1, shownRun = '', tab = 'd', flash = null, lastSeen = 0;
  const pid = () => ctx.partnerId, now = () => ctx.store.now();
  const box = h('div', { class: 'bg' }); el.append(box);

  const endAt = s => s.startAt + s.dur * 1000;
  const phase = () => { if (!S || S.id === dismissed) return 'lobby'; const t = now(); if (t < endAt(S)) return t < S.startAt ? 'ready' : 'play'; return S.id === seenId ? 'result' : 'lobby'; };
  const roleOf = () => (S.mode === 'vs' ? 'both' : (S.roles || {})[ctx.uid] || 'watch');
  const curIdx = () => (S.mode === 'vs' ? L.idx : S.idx || 0), curTray = () => (S.mode === 'vs' ? L.tray : { d: (S.tray || {}).d, s: (S.tray || {}).s, st: arr((S.tray || {}).st) });
  const curScore = () => (S.mode === 'vs' ? L.score : S.score || 0);

  // 메뉴판: 그림만 보고도 무엇인지 알 수 있게, 그 난이도에 나오는 음료·사이드·재료를 이름과 함께 보여 준다
  function menuBook(d) {
    const LV = LEVEL[d], cell = (svg, name) => h('div', { class: 'bg-mi' }, h('span', { html: svg }), h('small', null, name));
    modal({ title: `📖 메뉴판 (난이도 ${LV.name})`, body: h('div', { class: 'bg-menu' },
      h('b', null, '음료'), h('div', { class: 'bg-grid' }, LV.drinks.map(k => cell(cup(...DRINK[k].slice(1)), DRINK[k][0]))),
      h('b', null, '사이드'), h('div', { class: 'bg-grid' }, LV.sides.map(k => cell(SIDE[k][1], SIDE[k][0]))),
      h('b', null, '버거 재료'), h('div', { class: 'bg-grid ing' }, cell(one('bunT'), '햄버거빵'), LV.btn.map(k => cell(one(k), k === 'beef' && d === 'e' ? '패티' : FILL[k]))),
      h('p', { class: 'dim' }, '버거는 말풍선 그림의 아래 빵부터 위로 차례대로 쌓아요. 별점: 버거 ★★ · 음료 ★ · 사이드 ★ · 포장/매장 ★')), actions: [{ label: '닫기', primary: true }] });
  }

  /* ----- 로비 ----- */
  function lobby() {
    const chip = (on, label, fn, sub) => h('button', { class: 'bg-chip' + (on ? ' on' : ''), onClick: fn }, h('b', null, label), sub && h('small', null, sub));
    if (mode === 'vs' && diff === 'e') diff = 'm';
    const pr = pid() && roles[pid()], LV = LEVEL[diff];
    const bestKey = mode === 'coop' ? 'coop-' + diff : 'vs-' + diff + '-' + ctx.uid, b = best[bestKey];
    box.replaceChildren(
      h('div', { class: 'bg-hero' }, h('span', null, '🍔'), h('div', null, h('b', null, '카피 버거'), h('small', null, '동물 손님 30종이 찾아와요. 말풍선 주문대로 준비해 주세요'))),
      h('label', { class: 'lbl' }, '모드'),
      h('div', { class: 'bg-row' }, chip(mode === 'coop', '🤝 협동', () => { mode = 'coop'; lobby(); }, '역할을 나눠 한 쟁반'), chip(mode === 'vs', '⚔️ 경쟁', () => { mode = 'vs'; lobby(); }, '같은 손님, 총점 대결')),
      h('label', { class: 'lbl' }, '난이도'),
      h('div', { class: 'bg-row' }, (mode === 'coop' ? ['e', 'm', 'h'] : ['m', 'h']).map(k => chip(diff === k, LEVEL[k].name, () => { diff = k; lobby(); }, `${LEVEL[k][mode === 'coop' ? 'coop' : 'vs']}초`))),
      h('p', { class: 'dim bg-note' }, `음료 ${LV.drinks.length}종 · 사이드 ${LV.sides.length}종 · 버거 재료 ${LV.btn.length}종${diff !== 'e' ? ' · 쉬운 손님도 가끔 와요' : ''}`),
      mode === 'coop' && h('label', { class: 'lbl' }, '내 역할'),
      mode === 'coop' && h('div', { class: 'bg-row' }, [['main', '🍔 메인', '버거 · 포장'], ['aux', '🥤 보조', '음료 · 사이드'], ['both', '🙋 혼자', '전부 다']].map(([k, n, sub]) => chip(myRole === k, n, () => { myRole = k; picked = true; ctx.store.set('games/burgerRole/' + ctx.uid, k).catch(() => {}); lobby(); }, sub))),
      mode === 'coop' && h('p', { class: 'dim bg-note' }, myRole === 'both' ? '혼자서 음료·사이드·버거·포장을 모두 해요' : pid() ? `${ctx.nameOf(pid())}: ${pr === 'main' ? '메인' : pr === 'aux' ? '보조' : '아직 안 골랐어요'} · 시작하면 상대는 ${myRole === 'main' ? '보조' : '메인'}를 맡아요` : '상대가 들어오면 반대 역할을 맡아요'),
      mode === 'vs' && h('p', { class: 'dim bg-note' }, '각자 음료·버거·포장을 만들어요. 사이드는 선택(맞히면 보너스 +30)이고, 시간이 끝났을 때 총점이 높은 쪽이 이겨요'),
      h('div', { class: 'bg-row' }, h('button', { class: 'btn', onClick: () => menuBook(diff) }, '📖 메뉴판'), h('button', { class: 'btn primary big', style: { flex: 2 }, onClick: start }, '시작')),
      b && h('p', { class: 'dim center' }, `${mode === 'coop' ? '우리' : '내'} 최고 기록 ${b.s}점`));
  }
  function start() {
    const L0 = LEVEL[diff], run = { id: Math.random().toString(36).slice(2, 9), mode, diff, seed: Math.floor(Math.random() * 1e6), startAt: now() + 3600, dur: L0[mode === 'coop' ? 'coop' : 'vs'], by: ctx.uid };
    if (mode === 'coop') Object.assign(run, { idx: 0, score: 0, n: 0, roles: myRole === 'both' || !pid() ? { [ctx.uid]: 'both' } : { [ctx.uid]: myRole, [pid()]: myRole === 'main' ? 'aux' : 'main' } });
    dismissed = ''; ctx.store.set(PATH, run).catch(() => toast('시작하지 못했어요'));
  }

  /* ----- 진행 ----- */
  const iconBtn = (svg, label, on, fn, cls = '') => h('button', { class: 'bg-btn ' + cls + (on ? ' on' : ''), onClick: fn }, h('span', { html: svg }), h('small', null, label));
  function setTray(patch) {
    if (S.mode === 'vs') { Object.assign(L.tray, patch); return paint(); }
    const t = curTray(), next = { ...t, ...patch }; S.tray = next; paint(); // 먼저 내 화면에 반영
    ctx.store.update(PATH + '/tray', Object.fromEntries(Object.entries(patch).map(([k, v]) => [k, Array.isArray(v) && !v.length ? null : v]))).catch(() => {});
  }
  function serve(pack) {
    const o = orderOf(S.seed, curIdx(), S.diff);
    if (S.mode === 'vs') {
      const r = judge(o, L.tray, pack, true); L.score += r.pts; L.idx++; L.n++; L.tray = { st: [] }; tab = 'd'; feedback(r);
      ctx.store.update(`${PATH}/sc/${ctx.uid}`, { s: L.score, n: L.n }).catch(() => {}); return paint();
    }
    const id = S.id, idx = S.idx || 0;
    ctx.store.tx(PATH, cur => { if (!cur || cur.id !== id || (cur.idx || 0) !== idx) return; const t = cur.tray || {}, r = judge(o, { d: t.d, s: t.s, st: arr(t.st) }, pack, false);
      return { ...cur, idx: idx + 1, n: (cur.n || 0) + 1, score: (cur.score || 0) + r.pts, tray: null, last: { i: idx, ok: r.ok, pts: r.pts, perfect: r.perfect, at: now() } }; }).catch(() => {});
  }
  function feedback(r) { flash = { r, until: Date.now() + 1300 }; sfx(r.perfect ? 'pair' : r.pts > 0 ? 'coin' : 'bad'); }

  function play(ph) {
    const role = roleOf(), vs = S.mode === 'vs', LV = LEVEL[S.diff], idx = curIdx(), o = orderOf(S.seed, idx, S.diff), tray = curTray(), an = ANIMALS[o.a];
    const left = Math.max(0, Math.ceil((endAt(S) - now()) / 1000)), fresh = shownRun !== S.id || shownIdx !== idx;
    // 손님과 말풍선: 포장/매장 → 음료·사이드 → 버거 순서로 하나씩 나타난다
    if (fresh) { shownRun = S.id; shownIdx = idx; if (ph === 'play') sfx('flip'); box.dataset.fills = o.fills.join(' '); box.dataset.pack = o.pack;
      box.replaceChildren(h('div', { class: 'bg-top' }), h('div', { class: 'bg-cust' },
        h('div', { class: 'bg-animal' }, h('span', null, an[0]), h('small', null, an[1])),
        h('div', { class: 'bg-bubble' },
          h('div', { class: 'bg-part p1' }, h('span', { class: 'bg-emo' }, o.pack === 'out' ? '🛍️' : '🍽️'), h('small', null, o.pack === 'out' ? '포장' : '매장')),
          h('div', { class: 'bg-part p2' }, h('span', { class: 'bg-ic', html: cup(...DRINK[o.d].slice(1)) }), h('small', null, DRINK[o.d][0])),
          h('div', { class: 'bg-part p2' + (vs ? ' opt' : '') }, h('span', { class: 'bg-ic', html: SIDE[o.s][1] }), h('small', null, SIDE[o.s][0] + (vs ? ' (선택)' : ''))),
          h('div', { class: 'bg-part p3 burger', html: stackSvg(['bun', ...o.fills, 'bun']) }))),
        h('div', { class: 'bg-tray' }), h('div', { class: 'bg-ctl' })); }
    const [top, , trayEl, ctl] = box.children;
    const other = vs && pid() && (S.sc || {})[pid()];
    top.replaceChildren(h('b', { class: left <= 10 ? 'hot' : '' }, `⏱ ${left}초`), h('span', null, vs ? `나 ${L.score}점${other ? ` : ${ctx.nameOf(pid())} ${other.s}점` : ''}` : `점수 ${S.score || 0}`), h('small', null, `손님 ${idx + 1}번째 · ${LV.name}`), h('button', { class: 'bg-book', 'aria-label': '메뉴판', onClick: () => menuBook(S.diff) }, '📖'));
    const fl = flash && Date.now() < flash.until ? flash.r : null;
    trayEl.replaceChildren(...[
      h('div', { class: 'bg-slot' + (tray.d ? ' has' : '') }, tray.d ? h('span', { class: 'bg-ic', html: cup(...DRINK[tray.d].slice(1)) }) : h('i', null, '음료')),
      h('div', { class: 'bg-slot' + (tray.s ? ' has' : '') }, tray.s ? h('span', { class: 'bg-ic', html: SIDE[tray.s][1] }) : h('i', null, vs ? '사이드(선택)' : '사이드')),
      h('div', { class: 'bg-slot wide' + (tray.st.length ? ' has' : ''), html: tray.st.length ? stackSvg(tray.st) : '<i>버거</i>' }),
      fl && h('div', { class: 'bg-flash' + (fl.perfect ? ' perfect' : '') }, [['b', '버거'], ['d', '음료'], ['s', '사이드'], ['p', '포장']].map(([k, n]) => h('span', { class: fl.ok[k] ? 'ok' : 'no' }, `${n} ${fl.ok[k] ? '○' : '✕'}`)), h('em', null, '★'.repeat((fl.ok.b ? 2 : 0) + (fl.ok.d ? 1 : 0) + (fl.ok.s ? 1 : 0) + (fl.ok.p ? 1 : 0)).padEnd(5, '☆')), h('b', null, `+${fl.pts}`))].filter(Boolean));
    if (ph === 'ready') return ctl.replaceChildren(h('div', { class: 'bg-count' }, String(Math.max(1, Math.ceil((S.startAt - now()) / 1000))), h('small', null, role === 'watch' ? '구경하기' : role === 'main' ? '나는 메인: 버거 · 포장' : role === 'aux' ? '나는 보조: 음료 · 사이드' : '준비…')));
    if (role === 'watch') return ctl.replaceChildren(h('p', { class: 'dim center' }, '상대가 혼자 하는 중이에요. 구경해요 👀'));
    const drinks = () => h('div', { class: 'bg-grid' }, LV.drinks.map(k => iconBtn(cup(...DRINK[k].slice(1)), DRINK[k][0], tray.d === k, () => { sfx('tock'); if (role === 'both') tab = 's'; setTray({ d: k }); })));
    const sides = () => h('div', { class: 'bg-grid' }, LV.sides.map(k => iconBtn(SIDE[k][1], SIDE[k][0], tray.s === k, () => { sfx('tock'); if (role === 'both') tab = 'b'; setTray({ s: k }); })),
      role === 'both' && h('button', { class: 'bg-btn skip', onClick: () => { tab = 'b'; setTray({ s: null }); } }, h('span', null, '⏭'), h('small', null, vs ? '건너뛰기' : '없음')));
    const burger = () => [h('div', { class: 'bg-grid ing' }, iconBtn(one(tray.st.length ? 'bunT' : 'bunB'), '햄버거빵', false, () => { if (tray.st.length < 12) { sfx('tock'); setTray({ st: [...tray.st, 'bun'] }); } }),
      LV.btn.map(k => iconBtn(one(k), k === 'beef' && S.diff === 'e' ? '패티' : FILL[k], false, () => { if (tray.st.length < 12) { sfx('tock'); setTray({ st: [...tray.st, k] }); } }))),
      h('div', { class: 'bg-acts' }, h('button', { class: 'btn sm', onClick: () => tray.st.length && setTray({ st: tray.st.slice(0, -1) }) }, '↩ 하나 빼기'), h('button', { class: 'btn sm', onClick: () => tray.st.length && setTray({ st: [] }) }, '🗑 다시 쌓기')),
      h('div', { class: 'bg-serve' }, h('small', null, '다 됐으면 손님 주문대로 골라서 내보내기'), h('div', null, h('button', { class: 'bg-pack', onClick: () => serve('out') }, '🛍️ 포장'), h('button', { class: 'bg-pack', onClick: () => serve('in') }, '🍽️ 매장')))];
    if (role === 'aux') return ctl.replaceChildren(h('label', { class: 'lbl' }, '음료'), drinks(), h('label', { class: 'lbl' }, '사이드'), sides(), h('p', { class: 'dim center' }, '버거와 포장은 메인이 해요. 쟁반에 올리면 바로 보여요'));
    if (role === 'main') return ctl.replaceChildren(...burger(), h('p', { class: 'dim center' }, '아래 빵부터 차례로 쌓고, 마지막에 포장/매장을 누르면 손님에게 나가요'));
    ctl.replaceChildren(h('div', { class: 'bg-tabs' }, [['d', '① 음료'], ['s', vs ? '② 사이드(선택)' : '② 사이드'], ['b', '③ 버거 · 포장']].map(([k, n]) => h('button', { class: 'bg-tab' + (tab === k ? ' on' : ''), onClick: () => { tab = k; paint(); } }, n))),
      ...(tab === 'd' ? [drinks()] : tab === 's' ? [sides()] : burger()));
  }

  function result() {
    const vs = S.mode === 'vs', key = vs ? 'vs-' + S.diff + '-' + ctx.uid : 'coop-' + S.diff, mine = vs ? (L && L.id === S.id ? L.score : ((S.sc || {})[ctx.uid] || {}).s || 0) : S.score || 0;
    const other = vs && pid() ? (S.sc || {})[pid()] : null, served = vs ? (L && L.id === S.id ? L.n : 0) : S.n || 0;
    if (fxDone !== S.id) { fxDone = S.id; const prev = best[key];
      if (mine > 0 && (!prev || mine > prev.s)) ctx.store.tx('games/burgerBest/' + key, c => (c && c.s >= mine ? undefined : { s: mine, at: now() })).catch(() => {});
      setTimeout(() => { if (!alive || !S) return; const o2 = vs && pid() ? (S.sc || {})[pid()] : null;
        if (vs && o2) gameFx(mine > o2.s ? 'win' : mine < o2.s ? 'lose' : 'draw', `${mine} : ${o2.s}`); else if (mine > 0) gameFx('win', `${mine}점${prev && mine > prev.s ? ' 신기록' : ''}`); }, vs ? 1300 : 200); }
    box.replaceChildren(h('div', { class: 'bg-end' }, h('span', null, '🍔'), h('b', null, vs ? '경쟁 끝!' : '영업 끝!'),
      h('p', { class: 'bg-big' }, `${mine}점`), h('p', { class: 'dim' }, `손님 ${served}명 · 난이도 ${LEVEL[S.diff].name}`),
      vs && h('p', null, other ? `${ctx.nameOf(pid())} ${other.s}점 (손님 ${other.n || 0}명)` : '상대 점수가 아직 없어요'),
      best[key] && h('p', { class: 'dim' }, `${vs ? '내' : '우리'} 최고 기록 ${Math.max(best[key].s, mine)}점`),
      h('button', { class: 'btn primary big', onClick: () => { dismissed = S.id; shownRun = ''; paint(); } }, '다시 하기')));
  }

  function paint() {
    if (!alive) return; const ph = phase();
    if (ph === 'lobby') { shownRun = ''; return lobby(); }
    seenId = S.id;
    if (S.mode === 'vs' && (!L || L.id !== S.id)) { L = { id: S.id, idx: 0, score: 0, n: 0, tray: { st: [] } }; tab = 'd'; }
    if (ph === 'result') { shownRun = ''; return result(); }
    play(ph);
  }

  const offs = [
    ctx.store.on(PATH, v => { const was = S; S = v || null;
      if (S && was && S.id === was.id && S.mode === 'coop' && S.last && S.last.at !== lastSeen) { lastSeen = S.last.at; if ((was.idx || 0) !== (S.idx || 0)) { tab = 'd'; feedback({ ok: S.last.ok || {}, pts: S.last.pts || 0, perfect: !!S.last.perfect }); } }
      paint(); }),
    ctx.store.on('games/burgerRole', v => { roles = v || {}; const pr = pid() && roles[pid()]; if (!picked && (pr === 'main' || pr === 'aux')) myRole = pr === 'main' ? 'aux' : 'main'; if (phase() === 'lobby') lobby(); }), // 상대가 먼저 고르면 나는 반대 역할
    ctx.store.on('games/burgerBest', v => { best = v || {}; if (phase() === 'lobby') lobby(); }),
  ];
  timer = setInterval(() => { const ph = phase(); if (ph !== 'lobby') paint(); }, 250);
  paint();
  return () => { alive = false; clearInterval(timer); offs.forEach(f => f()); };
}
