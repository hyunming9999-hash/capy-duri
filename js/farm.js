// 카피 농장 — 놀이터 왼쪽 '농장 가는 길' 팻말로 들어가는 따로 된 공간. 사람마다 밭 5칸(처음엔 1칸만 열림)
// 씨앗 심기 → 물 주기·잡초 뽑기(컨디션) → 다 자라면 수확(S·A·B·C·F). 상대 농장은 구경하고 물만 줄 수 있다
// 앱을 오래 꺼 둬도 괜찮게: 물은 자라는 시간의 70%(최소 30분) 동안 버티고, 잡초는 한 번만 나고, 다 자란 뒤로는 컨디션이 줄지 않는다(3일 넘게 안 거두면 시든다)
import { h, toast, modal, holdBtn } from './ui.js';
import { capy } from './capy.js';
import { FLUFFY } from './fluffy.js';
import { sfx } from './sound.js';

// 작물 30종: [id, 이름, 등급(농기구 단계), 자라는 분, 씨앗 값, 한 개 기본값]
const C = [
  ['lettuce', '상추', 1, 10, 30, 12], ['radish', '무', 1, 15, 40, 15], ['potato', '감자', 1, 20, 50, 18], ['carrot', '당근', 1, 20, 50, 18], ['spinach', '시금치', 1, 25, 60, 22],
  ['sweetpotato', '고구마', 1, 30, 70, 25], ['onion', '양파', 1, 30, 70, 25], ['cabbage', '배추', 1, 35, 80, 28], ['pea', '완두콩', 1, 40, 90, 32], ['tomato', '토마토', 1, 40, 90, 32], ['cucumber', '오이', 1, 40, 90, 32],
  ['corn', '옥수수', 2, 30, 200, 70], ['eggplant', '가지', 2, 40, 240, 80], ['chili', '고추', 2, 45, 260, 88], ['squash', '단호박', 2, 50, 280, 95],
  ['strawberry', '딸기', 2, 55, 300, 100], ['broccoli', '브로콜리', 2, 60, 320, 108], ['paprika', '파프리카', 2, 70, 340, 115], ['garlic', '마늘', 2, 80, 360, 122], ['scallion', '대파', 2, 90, 380, 130],
  ['watermelon', '수박', 3, 95, 800, 260], ['melon', '멜론', 3, 110, 850, 275], ['grape', '포도', 3, 120, 900, 290], ['pineapple', '파인애플', 3, 130, 950, 305], ['blueberry', '블루베리', 3, 145, 1000, 320],
  ['ginseng', '인삼', 3, 170, 1100, 350], ['matsutake', '송이버섯', 3, 190, 1200, 380], ['apple', '사과', 3, 210, 1250, 395], ['banana', '바나나', 3, 225, 1300, 410], ['yuzu', '황금유자', 3, 240, 1400, 440],
];
export const CROPS = C.map(([id, name, t, min, seed, base]) => ({ id, name, t, ms: min * 60000, seed: Math.max(15, Math.round(seed / 2 / 5) * 5), base })); // 씨앗값: 물가에 맞춰 예전의 1.5배 // 씨앗 하나 = 이랑 한 줄(밭 한 칸은 3줄)
export const cropOf = id => CROPS.find(c => c.id === id);
export const cropImg = id => `img/${FLUFFY ? 'fl' : 'farm'}/crop/${id}.webp`;
export const TOOLS = [null, { t: 1, name: '초급 농기구', price: 0, note: '구리 호미·구리 물뿌리개 · 물은 한 번에 1이랑 · 처음부터 있어요' }, { t: 2, name: '중급 농기구', price: 2500, note: '은 호미·은 물뿌리개 · 물은 한 번에 2이랑 · 중급 작물을 심어요' }, { t: 3, name: '고급 농기구', price: 6000, note: '황금 낫·황금 물뿌리개 · 물은 한 번에 밭 전체(3이랑) · 고급 작물을 심어요' }];
export const TIER_NAME = ['', '초급', '중급', '고급'];
// 농기구 그림: 상점은 세트(tool), 들고 다니는 것·잡초 베기는 hoe(고급은 낫), 물 주기는 can(고급은 스프링클러). 물 주기 한 번에 적시는 이랑 수 = 농기구 등급
export const toolImg = (t, k = 'tool') => `img/farm/${k}${Math.max(1, Math.min(3, t || 1))}.webp`;
// 앞발이 잡는 자리(그림을 좌우로 뒤집은 뒤 기준, 가로·세로 0~1)와 크기, 물뿌리개 주둥이 끝. 호미·물뿌리개는 바깥(오른쪽)을 보게 뒤집는다
const GRIP = { hoe1: [0.28, 0.68, 72], hoe2: [0.38, 0.72, 72], hoe3: [0.42, 0.7, 72], can1: [0.2, 0.45, 58, 0.97, 0.36], can2: [0.15, 0.45, 58, 0.98, 0.3], can3: [0.5, 0.78, 72, 0.5, 0.1] };
const FL_PAW = { brown: '#8A4019', cream: '#A67D62', choco: '#5C2C1B', peach: '#A05A5A' }; // 보송 그림체의 앞발 색
const PX = 94, PY = 107; // 캐릭터 그림(120×158)에서 오른쪽 앞발 끝
export function holdSvg(svg, k, t) {
  const id = k + Math.max(1, Math.min(3, t || 1)), [gx, gy, S, sx, sy] = GRIP[id], x = PX - gx * S, y = PY - gy * S, flc = svg.match(/img\/fl\/c-(brown|cream|choco|peach)-/), fur = flc ? FL_PAW[flc[1]] : (svg.match(/<ellipse cx="91" cy="99" rx="8" ry="12" fill="([^"]+)"/) || [])[1] || '#B07A4E';
  const drops = k === 'can' ? `<g class="fm-drops">${[0, 1, 2, 3, 4].map(i => `<circle cx="${(x + sx * S + (id === 'can3' ? (i - 2) * 6 : 2 + i * 2)).toFixed(1)}" cy="${(y + sy * S + (id === 'can3' ? -4 : 2)).toFixed(1)}" r="3.2" fill="#6EC3F7" stroke="#fff" stroke-width=".8" style="animation-delay:${i * 0.12}s"/>`).join('')}</g>` : '';
  const g = `<g class="fm-tg ${k} ${id}" style="transform-origin:${PX}px ${PY}px"><g transform="translate(${(x + S).toFixed(1)} ${y.toFixed(1)}) scale(-1 1)"><image href="${toolImg(t, k)}" width="${S}" height="${S}"/></g>${drops}</g>`;
  const paw = `<ellipse cx="${PX}" cy="${PY}" rx="7.5" ry="6.5" fill="${fur}"/><path d="M${PX - 4} ${PY - 2} q4 -3 8 0" fill="none" stroke="rgba(0,0,0,.25)" stroke-width="1.2" stroke-linecap="round"/>`;
  return svg.replace(/<\/svg>$/, `<g class="fm-hand">${g}${paw}</g></svg>`).replace('<svg ', '<svg style="overflow:visible" ');
}
export const DEEDS = [500, 1000, 2000, 3000]; // 2~5번째 밭 땅 문서
export const PLOTS = 5, YIELD_ROW = 9, ROT_MS = 3 * 86400000; // 이랑 한 줄에서 9개(밭 한 칸 3줄이면 27개)
const BAD = [null, [1, 3], [0, 2], [0, 1]]; // 이랑마다 불량 개수: 초급 1~3 · 중급 0~2 · 고급 0~1 (그 이랑을 처음 거둘 때 든 농기구로 정한다)
export const GRADE_X = { S: 2, A: 1.5, B: 1.2, C: 1, F: 0 };
// 카피수퍼 매입가(A급 1개): 같은 등급이면 시간당 버는 돈이 비슷하게(오래 걸리는 작물이 최대 20% 더), 등급이 높을수록 조금 더.
// 이랑 9개 중 불량을 뺀 평균(초급 7 · 중급 8 · 고급 8.5)으로 맞춘다. 요리 원가는 base 그대로라 팔기보다 요리가 이득
const SELL_RATE = [0, 120, 150, 180], SELL_AVG = [0, 7, 8, 8.5];
const SELL_A = (() => { const rg = {}; CROPS.forEach(c => { const r = rg[c.t] || (rg[c.t] = [1e9, 0]); r[0] = Math.min(r[0], c.ms); r[1] = Math.max(r[1], c.ms); });
  return Object.fromEntries(CROPS.map(c => { const [lo, hi] = rg[c.t], pos = hi > lo ? (c.ms - lo) / (hi - lo) : 0, prof = SELL_RATE[c.t] * (1 + 0.2 * pos) * c.ms / 3600000; return [c.id, Math.max(1, Math.round((prof + c.seed) / SELL_AVG[c.t]))]; })); })();
const SELL_UP = 1.5; // 동물 물건 값이 오른 만큼 작물 매입가도 1.5배
export const cropPrice = (id, g) => (GRADE_X[g] && SELL_A[id] ? Math.max(1, Math.round(SELL_A[id] * SELL_UP * GRADE_X[g] / GRADE_X.A)) : 0);

// 밭 한 칸의 컨디션 계산(순수 함수): 물이 마른 시간과 잡초가 자란 채로 둔 시간만큼 깎인다. 다 자란 뒤로는 셈하지 않는다
export const SPRK_OFF = 'img/farm/sprinkler-off.webp'; // 물방울 없는 그림: 작물이 없거나 쉬는 중
export const SPRK_IMG = 'img/farm/sprinkler.webp', SPRK_PRICE = 2500, SPRK_HOUR = 200, SPRK_FROM = 0, SPRK_TO = 10; // 스프링클러: 밭 1칸에 1개, 밤 12시~아침 10시 자동, 그 밖은 1시간 150코인
// 2026-11-20: 시간당 구독료(1시간 200코인)를 없앴다. 하루 사용료 SPRK_DAY코인(설치한 밭 전부 합쳐서)을 내면 그날은 24시간 완전 자동. 돈은 농장을 열 때 알아서 빠진다
export const SPRK_DAY = 100, DAYMS = 86400000, day0 = t => { const d = new Date(t); d.setHours(0, 0, 0, 0); return d.getTime(); };
// 밭 k의 스프링클러 + 농장 전체의 '사용료 낸 날'(sprkDays: { 그날 0시: 1 })을 합쳐 작동 구간 계산에 넘긴다
export const sprkOf = (farm, k) => { const sp = ((farm || {}).sprk || {})[k]; if (!sp || !sp.on) return sp; const days = Object.keys((farm || {}).sprkDays || {}).map(Number).filter(d => d > 0 && farm.sprkDays[d]); return days.length ? { ...sp, paid: [...(sp.paid || []), ...days.map(d => [d, d + DAYMS])] } : sp; };
const HR = 3600000, WIN = new WeakMap(); // 이랑 → 그 밭 스프링클러가 도는 시간들
// 밭 하나의 스프링클러 작동 구간([시작, 끝] 목록): 매일 밤 12시~아침 10시 + 돈 내고 늘린 시간
export function sprkWins(sp, a, b) { if (!sp || !sp.on) return []; const out = []; const d = new Date(a - 86400000); d.setHours(0, 0, 0, 0);
  for (let t0 = d.getTime(); t0 < b; t0 += 86400000) { const x = new Date(t0); x.setHours(SPRK_FROM, 0, 0, 0); const s0 = x.getTime(); x.setHours(SPRK_TO, 0, 0, 0); out.push([s0, x.getTime()]); }
  (sp.paid || []).forEach(w => out.push([w[0], w[1]])); out.sort((p, q) => p[0] - q[0]);
  const m = []; out.forEach(w => { if (w[1] <= a || w[0] >= b) return; const l = m[m.length - 1]; if (l && w[0] <= l[1]) l[1] = Math.max(l[1], w[1]); else m.push([w[0], w[1]]); }); return m; }
export const sprkOn = (sp, t) => sprkWins(sp, t - 1, t + 1).some(w => w[0] <= t && t < w[1]);
export const linkSprk = (rows, sp) => rows.forEach(r => { if (r) WIN.set(r, sp); }); // 이랑 계산 때 그 밭 스프링클러를 함께 본다
const WET = p => Math.max(p.ms * 0.7, 30 * 60000); // 물 한 번이면 자라는 시간의 70%(최소 30분): 30분 안에 자라는 작물은 심을 때 준 물로 끝, 나머지도 한 번만 더 주면 돼요
export function settle(p, t) {
  const end = p.at + p.ms, to = Math.min(t, end), from = Math.min(p.calc || p.at, end); if (to <= from) return p;
  const sp = WIN.get(p); let dry = 0;
  if (sp && sp.on) { let wetU = p.wet, cur = from; sprkWins(sp, from, to).forEach(([s0, e0]) => { const s1 = Math.max(s0, from), e1 = Math.min(e0, to); dry += Math.max(0, s1 - Math.max(cur, wetU)); cur = Math.max(cur, e1); wetU = Math.max(wetU, e0 + WET(p)); }); dry += Math.max(0, to - Math.max(cur, wetU)); } // 스프링클러가 도는 동안은 젖어 있고, 멈춘 뒤에도 물 한 번 준 것만큼 버틴다
  else dry = Math.max(0, to - Math.max(from, p.wet));
  const wd = p.weedAt && !p.cut ? Math.max(0, to - Math.max(from, p.weedAt)) : 0;
  return { ...p, dry: (p.dry || 0) + dry, wd: (p.wd || 0) + wd, calc: to };
}
export const scoreOf = (p, t) => { const q = settle(p, t), seen = Math.max(1, Math.min(t, p.at + p.ms) - p.at); return Math.max(0, 1 - 0.8 * (q.dry || 0) / seen - 0.4 * (q.wd || 0) / seen); }; // 한 번도 안 돌봐도 C급, 3일 넘게 안 거두면 F
export const ripe = (p, t) => p && p.c && t >= p.at + p.ms;
export const rotten = (p, t) => ripe(p, t) && t > p.at + p.ms + ROT_MS;
export const weedNow = (p, t) => p && p.weedAt && !p.cut && t >= p.weedAt && t < p.at + p.ms;
export const dryNow = (p, t) => { if (!(p && p.c && t >= p.wet && t < p.at + p.ms)) return false; const sp = WIN.get(p); if (!sp || !sp.on) return true; const ws = sprkWins(sp, t - 86400000 * 2, t + 1); return !ws.some(([a, b]) => a <= t && t < b + WET(p)); };
export function gradeOf(p, t) { if (rotten(p, t)) return 'F'; const s = scoreOf(p, t); return s >= 0.85 ? (Math.random() < 0.3 ? 'S' : 'A') : s >= 0.6 ? 'B' : s >= 0.3 ? 'C' : 'F'; }
export function plant(id, t) { const c = cropOf(id); return { c: id, at: t, ms: c.ms, wet: t + WET(c), calc: t, dry: 0, wd: 0, weedAt: t + c.ms * (0.35 + Math.random() * 0.3), cut: 0 }; }
export const water = (p, t) => { const q = settle(p, t); return { ...q, wet: t + WET(p) }; };
export const weed = (p, t) => { const q = settle(p, t); return { ...q, cut: t }; };
const left = ms => { const m = Math.ceil(ms / 60000); return m >= 60 ? `${Math.floor(m / 60)}시간 ${m % 60 ? (m % 60) + '분' : ''}`.trim() : `${m}분`; };

const BG_W = 1344, BG_H = 752, WALK_SP = 150; // 걷는 빠르기: 친목회 육지(ME_SP)와 같다. 스쿠터면 1.8배
const rc = (el, ...k) => el.replaceChildren(...k.flat().filter(x => x != null && x !== false && x !== '')); // false·빈칸은 건너뛰고 채운다
// openFarm: o = { ctx, coins, onClose } — o.coins(n)는 번 돈을 더한다
export function openFarm(o) {
  const { ctx } = o; let who = ctx.uid, data = {}, mine = {}, alive = true, sel = -1, raf = 0, off = null;
  const H = Math.max(280, Math.min(Math.round(innerHeight * 0.52), 520)), TW = Math.round(H * BG_W / BG_H);
  const PH = Math.round(H * 0.34), PW = Math.round(PH * 900 / 356), GAP = Math.round(PW * 0.08), X0 = Math.round(TW * 0.03);
  const HW = Math.round(H * 0.44), SW = Math.round(HW * 1.46), HX = X0, plotX = k => HX + SW + GAP * 2 + k * (PW + GAP), WIDTH = plotX(PLOTS) + Math.round(TW * 0.14); // 카피철물은 첫 밭 왼쪽
  const now = () => ctx.store.now();
  const me = { x: plotX(0) + PW / 2, tx: plotX(0) + PW / 2 };
  const world = h('div', { class: 'fm-world', style: { width: WIDTH + 'px', height: H + 'px' } });
  for (let x = 0, k = 0; x < WIDTH; x += TW, k++) world.append(h('i', { class: 'fm-bg' + (k % 2 ? ' flip' : ''), style: { left: x + 'px', width: TW + 1 + 'px' } }));
  const plotEls = Array.from({ length: PLOTS }, (_, k) => { const e = h('button', { class: 'fm-plot', style: { left: plotX(k) + 'px', width: PW + 'px', height: PH + 'px' }, onClick: () => goPlot(k) }); world.append(e); return e; });
  const shop = h('button', { class: 'fm-shop', style: { left: HX + 'px', width: HW * 1.46 + 'px' }, onClick: () => { walkTo(HX + HW * 0.7, openShop); } }, h('img', { src: FLUFFY ? 'img/fl/bg/hardware.webp' : 'img/farm/hardware.webp', alt: '카피철물' }), h('b', { class: 'fm-shop-t' }, '카피철물'));
  const exitSign = h('button', { class: 'fm-exit', style: { left: WIDTH - Math.round(TW * 0.11) + 'px' }, onClick: () => close() }, '놀이터로 →');
  const sc = o.scoot ? o.scoot() : null, meSvg = (back = false) => capy(ctx.capyOf(ctx.uid, back ? { view: 'back' } : { face: 'happy' })), meEl = h('div', { class: 'fm-me' + (sc ? ' scoot' : ''), html: sc || meSvg() }); // 스쿠터를 타고 왔으면 농장에서도 탄 채로, 1.8배 빠르게
  // 손에 든 농기구: 캐릭터 그림(svg) 안에 직접 그려 넣고 오른손(앞발)으로 감싸 쥔다 → 걷고 뒤집혀도 손에서 안 떨어진다
  let heldK = 'hoe', heldBack = false, heldUse = 0, heldT = 0; const drawHeld = () => { if (sc) return; const t = tool(), id = heldK + (heldBack ? 'b' : ''); if (t === heldT && meEl.dataset.k === id) return; heldT = t; meEl.dataset.k = id; meEl.innerHTML = holdSvg(meSvg(heldBack), heldK, t); meEl.classList.toggle('turned', heldBack); }; // 물 주기·잡초 베기는 밭 쪽으로 돌아서서(뒷모습) 한다
  const useHeld = (k, back = k === 'can') => { if (sc) return; clearTimeout(heldUse); heldK = k; heldBack = back; drawHeld(); meEl.classList.remove('use'); void meEl.offsetWidth; meEl.classList.add('use'); heldUse = setTimeout(() => { heldUse = 0; meEl.classList.remove('use'); heldK = 'hoe'; heldBack = false; drawHeld(); }, k === 'can' ? 1500 : 1100); };
  world.append(shop, exitSign, meEl);
  const scroller = h('div', { class: 'fm-scroll' }, world);
  // 방향키(◀ ▶)로 걷는다. 밭 앞에 서면 그 밭이 열리고, 카피철물 앞에 서면 들어가기 버튼이 뜬다
  const keys = new Set(), padBtn = (k, t) => { const b = h('button', { class: 'dp fm-dp', 'aria-label': k === 'L' ? '왼쪽' : '오른쪽' }, t); holdBtn(b, () => keys.add(k), () => keys.delete(k)); return b; };
  const enterBtn = h('button', { class: 'fm-enter', hidden: true, onClick: () => openShop() }, '🔨 카피철물 들어가기');
  // 밭 앞에 서면 화면 아래에 💧 물 주기·🧺 수확 버튼이 뜬다(농기구 등급만큼 한 번에)
  const quickEl = h('div', { class: 'fm-quick' }); let quickKey = '', quickAt = 0;
  // 물 주기 안내: 초급은 'N번 이랑 차례에요'(물이 가장 먼저 마를 이랑부터 한 줄씩), 중급은 2줄씩·남으면 '한 번 더', 고급은 밭 전체
  // 물 줄 차례(밭마다): 다음에 줄 이랑 번호를 기억해 두고, 자라는 이랑만 그 번호부터 차례로 돈다
  const turnKey = k => `capy-wturn-${who}-${k}`, getTurn = k => { try { return +localStorage.getItem(turnKey(k)) || 0; } catch { return 0; } }, setTurn = (k, v) => { try { localStorage.setItem(turnKey(k), String(v % 3)); } catch {} };
  const turnOrder = (k, idx) => { const st = getTurn(k), a = idx.filter(i => i >= st), b = idx.filter(i => i < st); return [...a, ...b]; };
  function waterHint(k) { const t = now(), cur = rowsOf(k), idx = cur.map((r, i) => i).filter(i => live(cur[i]) && !ripe(cur[i], t)); if (!idx.length) return '';
    const T = tool(); if (T >= 3) return '한 번에 밭을 적셔요';
    const order = turnOrder(k, idx), lw = lastWater[k];
    if (T === 1) return `${order[0] + 1}번 이랑 차례에요`;
    return lw && lw.left > 0 && t - lw.t < 300000 ? '한 번 더 줘요' : '한 번에 2이랑씩 물줘요'; }
  const lastWater = {}; // 밭마다 방금 물 준 때와 아직 못 적신 이랑 수(중급 '한 번 더' 안내용)
  function drawQuick() { const t = now(), k = meEl.classList.contains('walk') ? -1 : plotEls.findIndex((_, i) => Math.abs(me.x - (plotX(i) + PW / 2)) < PW / 2), open = k >= 0 && isOpen(k), rs = open ? rowsOf(k).filter(live) : [], grow = rs.filter(r => !ripe(r, t)), rip = who === ctx.uid ? rs.filter(r => ripe(r, t)) : [], dry = grow.some(r => dryNow(r, t)), wd = who === ctx.uid ? grow.filter(r => weedNow(r, t)).length : 0;
    const wh = k >= 0 ? waterHint(k) : '', inv = mine.sprkInv || 0, canSp = open && who === ctx.uid && inv > 0 && !((data.sprk || {})[k] || {}).on, key = `${k}|${grow.length}|${rip.length}|${dry}|${tool()}|${wh}|${wd}|${canSp}|${inv}`; if (key === quickKey) return; quickKey = key;
    rc(quickEl, canSp && h('button', { class: 'fm-qb sprk on', onClick: () => installSprk(k) }, h('img', { src: SPRK_IMG, alt: '' }), h('span', null, '스프링클러 설치'), h('small', null, `가방에 ${inv}개`)),
      wd > 0 && h('button', { class: 'fm-qb weed on', onClick: () => doWeed(k) }, h('img', { src: toolImg(tool(), 'hoe'), alt: '' }), h('span', null, '잡초 베기'), h('small', null, `잡초 ${wd}개 · ${tool() >= 3 ? '밭 전체' : `${tool()}이랑씩`}`)),
      grow.length > 0 && h('button', { class: 'fm-qb water' + (dry ? ' on' : ''), onClick: () => doWater(k) }, h('img', { src: toolImg(tool(), 'can'), alt: '' }), h('span', null, '물 주기'), h('small', null, wh)),
      rip.length > 0 && h('button', { class: 'fm-qb harv on', onClick: () => harvestTap(k) }, h('b', null, '🧺'), h('span', null, '수확'), h('small', null, ['', '하나씩', '한 이랑', '밭 전체'][tool()]))); }
  const scene = h('div', { class: 'fm-scene' }, scroller, h('div', { class: 'fm-pad' }, padBtn('L', '◀'), enterBtn, quickEl, padBtn('R', '▶')));
  const onKey = e => { const k = e.key === 'ArrowLeft' ? 'L' : e.key === 'ArrowRight' ? 'R' : ''; if (!k || document.querySelector('.modal-wrap')) return; e.preventDefault(); if (e.type === 'keydown') keys.add(k); else keys.delete(k); };
  window.addEventListener('keydown', onKey); window.addEventListener('keyup', onKey);
  const title = h('b'), coinsEl = h('span', { class: 'fm-coins' }), visitBtn = h('button', { class: 'btn sm' }), barnBtn = h('button', { class: 'btn sm', onClick: () => openBarn() }, '🧺 헛간');
  const sheet = h('div', { class: 'fm-sheet' });
  const wrap = h('div', { class: 'fm' }, h('div', { class: 'fm-top' }, title, coinsEl, barnBtn, visitBtn, h('button', { class: 'top-x', 'aria-label': '닫기', onClick: () => close() }, '✕')), scene, sheet);
  document.body.append(wrap);

  const plotOf = k => (data.plots || {})[k] || null, isOpen = k => k < (data.open || 1), tool = () => mine.tool || 1;
  const myRef = () => 'farm/' + ctx.uid, curRef = () => 'farm/' + who;
  const save = patch => ctx.store.update(myRef(), patch).catch(() => {});
  const savePlot = (k, p) => ctx.store.set(`${curRef()}/plots/${k}`, p).catch(() => {});

  // 밭 한 칸 = 이랑 3줄. 씨앗 하나로 한 이랑을 채운다(이랑마다 다른 작물도 된다)
  const rowsOf = k => { const p = plotOf(k), sp = sprkOf(data, k); let out; if (!p) out = [null, null, null]; else if (p.c) out = [p, null, null]; else { const r = p.rows || {}; out = [0, 1, 2].map(i => r[i] || null); } linkSprk(out, sp); return out; };
  const live = r => r && r.c && !r.lost;
  const ROWBOX = [{ t: 2, h: 24, l: 13, r: 13, n: 7 }, { t: 20, h: 27, l: 10, r: 10, n: 8 }, { t: 40, h: 29, l: 8, r: 8, n: 9 }];
  const SPROUT = '<svg viewBox="0 0 40 40"><path d="M20 38 V20" stroke="#4E8A2E" stroke-width="3" stroke-linecap="round"/><path d="M20 22 C10 22 6 14 7 8 C14 8 20 13 20 22Z" fill="#7BC74D" stroke="#4E8A2E" stroke-width="2"/><path d="M20 20 C29 20 34 13 33 6 C25 6 20 11 20 20Z" fill="#8FD45A" stroke="#4E8A2E" stroke-width="2"/></svg>';
  function drawPlots() {
    const t = now();
    plotEls.forEach((e, k) => { const open = isOpen(k), rows = rowsOf(k), any = rows.some(live);
      e.className = 'fm-plot' + (sel === k ? ' on' : '');
      e.dataset.dry = rows.some(r => live(r) && dryNow(r, t)) ? 1 : 0;
      const kids = [h('img', { class: 'fm-pimg', src: `img/farm/plot-${open ? 'empty' : 'locked'}.webp`, alt: '' })];
      if (open) rows.forEach((r, i) => { if (!live(r)) return; const b = ROWBOX[i], rp = ripe(r, t), c = cropOf(r.c);
        const shownN = rp ? Math.max(1, Math.ceil(b.n * (YIELD_ROW - (r.got || 0)) / YIELD_ROW)) : b.n;
        kids.push(h('div', { class: 'fm-rowc' + (rp ? ' ripe' : ' grow') + (rotten(r, t) ? ' rot' : '') + (rp && who === ctx.uid ? ' tap' : !rp ? ' tapw' : ''), style: { top: b.t + '%', height: b.h + '%', left: b.l + '%', right: b.r + '%', gridTemplateColumns: `repeat(${b.n}, 1fr)` },
            onClick: rp && who === ctx.uid ? e => { e.stopPropagation(); walkTo(plotX(k) + PW / 2, () => harvestTap(k, i)); } : !rp ? e => { e.stopPropagation(); walkTo(plotX(k) + PW / 2, () => doWater(k, i)); } : null }, // 자라는 이랑을 누르면 그 이랑에 물을 준다
          ...Array.from({ length: b.n }, (_, j) => rp ? (j < shownN ? h('img', { src: cropImg(c.id), alt: '' }) : h('i')) : h('span', { html: SPROUT, style: { transform: `scale(${(0.45 + 0.55 * Math.min(1, (t - r.at) / r.ms)).toFixed(2)})` } }))));
        if (weedNow(r, t)) kids.push(h('img', { class: 'fm-weed', src: 'img/farm/weed.webp', alt: '잡초', style: { top: b.t + 4 + '%', left: 22 + i * 22 + '%' } }), h('small', { class: 'fm-weedt', style: { top: b.t + 1 + '%', left: 22 + i * 22 + 6.5 + '%' } }, '잡초')); });
      const ripeN = rows.filter(r => live(r) && ripe(r, t)).length, growing = rows.filter(r => live(r) && !ripe(r, t)), emptyN = rows.filter(r => !live(r)).length;
      const soon = growing.length ? Math.min(...growing.map(r => r.at + r.ms - t)) : 0;
      const lab = !open ? `🔒 땅 문서 ${DEEDS[k - 1].toLocaleString('ko-KR')}코인` : !any ? (who === ctx.uid ? '빈 밭 · 눌러서 씨앗 심기' : '빈 밭') : ripeN ? `수확! ${ripeN}이랑` : emptyN && who === ctx.uid ? `빈 이랑 ${emptyN}` : ''; // 남은 시간은 아래 밭 현황에서 본다
      kids.push(h('span', { class: 'fm-lab' + (ripeN ? ' ripe' : '') + (open ? '' : ' lock') }, `${k + 1}밭${open ? '' : ' 🔒'}`)); // 알약은 밭 번호만(남은 시간·상태는 아래 밭 현황에서)
      if (open) ROWBOX.forEach((b, i) => kids.push(h('small', { class: 'fm-rlab', style: { top: b.t + b.h / 2 + '%', right: Math.max(1, b.r - 7) + '%' } }, `${i + 1}번 이랑`)));
      const sp = sprkOf(data, k); if (open && sp && sp.on) { const on = sprkOn(sp, t) && any; kids.push(h('div', { class: 'fm-sprk' + (on ? ' on' : '') }, h('img', { class: 'fm-spimg', src: on ? SPRK_IMG : SPRK_OFF, alt: '' }), ...(on ? Array.from({ length: 10 }, (_, j) => h('em', { style: { '--a': (j * 36) + 'deg', animationDelay: (j % 5) * 0.16 + 's' } })) : []))); }
      if (open && growing.length) kids.push(h('span', { class: 'fm-bub' }, [growing.some(r => dryNow(r, t)) && '💧', growing.some(r => weedNow(r, t)) && '🌿'].filter(Boolean).join('')));
      rc(e, kids); });
    coinsEl.textContent = '🪙 ' + ctx.coins().toLocaleString('ko-KR');
    const pn = ctx.nameOf(ctx.partnerId);
    title.textContent = who === ctx.uid ? '🌱 카피 농장' : `🌱 ${pn}네 농장 (구경)`;
    visitBtn.hidden = !ctx.partnerId; visitBtn.textContent = who === ctx.uid ? `${pn}네 농장` : '내 농장';
    visitBtn.onclick = () => { who = who === ctx.uid ? ctx.partnerId : ctx.uid; sel = -1; listen(); };
    barnBtn.hidden = who !== ctx.uid;
    drawSheet();
  }
  function listen() { if (off) off(); off = ctx.store.on(curRef(), v => { data = v || {}; if (who === ctx.uid) mine = data; drawPlots(); }); }
  const offMine = ctx.store.on(myRef(), v => { mine = v || {}; sprkAutoPay(); drawHeld(); if (who === ctx.uid) { data = mine; drawPlots(); } }); // 내 농기구·씨앗·헛간은 상대 농장 구경 중에도 알아야 한다

  function walkTo(x, then) { me.tx = Math.max(30, Math.min(WIDTH - 30, x)); me.then = then; meEl.classList.add('walk'); meEl.classList.toggle('left', me.tx < me.x); }
  function goPlot(k) { walkTo(plotX(k) + PW / 2, () => { sel = k; pickRow = -1; drawPlots(); }); }
  let pickRow = -1;

  // 밭 아래 창
  function drawSheet() { const ae = document.activeElement; if (ae && (ae.type === 'time' || ae.tagName === 'SELECT') && sheet.contains(ae)) return; // 시간 고르는 중엔 다시 그리지 않는다
    const k = sel, t = now(), visit = who !== ctx.uid;
    if (k < 0) { // 한눈에 보기: 밭마다 카드 한 장(이랑 3칸 미리보기 + 상태 + 바로 하기 버튼)
      const seeds = Object.values(mine.seeds || {}).reduce((a, n) => a + (n || 0), 0), barn = Object.values(mine.barn || {}).reduce((a, n) => a + (n || 0), 0);
      const card = i => { if (!isOpen(i)) return h('button', { class: 'fm-pc lock', onClick: () => goPlot(i) }, h('span', { class: 'fm-pn' }, i + 1), h('div', { class: 'fm-pmid' }, h('b', null, '🔒 잠긴 밭'), h('small', null, visit ? '아직 열지 않았어요' : `땅 문서 ${DEEDS[i - 1].toLocaleString('ko-KR')}코인 · 카피철물`)));
        const rs = rowsOf(i), lv = rs.filter(live), grow = lv.filter(r => !ripe(r, t)), rip = lv.filter(r => ripe(r, t)), dry = grow.some(r => dryNow(r, t)), wd = grow.some(r => weedNow(r, t));
        const st = rip.length ? ['ripe', `🧺 수확 가능 ${rip.length}이랑`] : dry ? ['dry', '💧 물이 필요해요'] : wd ? ['weed', '🌿 잡초가 났어요'] : grow.length ? ['grow', `🌱 ${left(Math.min(...grow.map(r => r.at + r.ms - t)))} 남음`] : ['empty', visit ? '빈 밭' : '빈 밭 · 씨앗을 심어요'];
        const slot = (r, n) => { if (!live(r)) return h('span', { class: 'fm-ps empty' }, h('i', null, '+'), h('small', null, `${n + 1}`));
          const c = cropOf(r.c), rp = ripe(r, t), pr = Math.min(1, (t - r.at) / r.ms);
          return h('span', { class: 'fm-ps' + (rp ? ' ripe' : '') + (!rp && dryNow(r, t) ? ' dry' : '') }, h('img', { src: cropImg(c.id), alt: '', style: rp ? null : { opacity: (0.35 + 0.65 * pr).toFixed(2), transform: `scale(${(0.6 + 0.4 * pr).toFixed(2)})` } }), h('u', null, h('em', { style: { width: Math.round(pr * 100) + '%' } }))); };
        const quick = []; if (grow.length) quick.push(h('button', { class: 'fm-pq water' + (dry ? ' on' : ''), 'aria-label': '물 주기', onClick: e => { e.stopPropagation(); walkTo(plotX(i) + PW / 2, () => doWater(i)); } }, h('img', { src: toolImg(tool(), 'can'), alt: '' })));
        if (rip.length > 0 && !visit) quick.push(h('button', { class: 'fm-pq harv on', 'aria-label': '수확', onClick: e => { e.stopPropagation(); walkTo(plotX(i) + PW / 2, () => harvestTap(i)); } }, '🧺'));
        return h('button', { class: 'fm-pc ' + st[0], onClick: () => goPlot(i) }, h('span', { class: 'fm-pn' }, i + 1), h('div', { class: 'fm-pmid' }, h('div', { class: 'fm-pslots' }, ...rs.map(slot)), h('small', { class: 'fm-pst' }, st[1])), quick.length ? h('div', { class: 'fm-pqs' }, ...quick) : null); };
      rc(sheet, h('div', { class: 'fm-ohead' }, h('b', null, visit ? `🌾 ${ctx.nameOf(who)}네 밭` : '🌾 내 밭'), !visit && h('span', { class: 'fm-chips' }, h('i', null, `🌱 씨앗 ${seeds}`), h('i', null, `🧺 헛간 ${barn}`), h('i', null, h('img', { src: toolImg(tool()), alt: '' }), TOOLS[tool()].name))),
        h('div', { class: 'fm-plist' }, ...Array.from({ length: PLOTS }, (_, i) => card(i))),
        h('p', { class: 'dim fm-tip' }, visit ? '구경 중이에요. 💧 버튼으로 물을 주고 올 수 있어요.' : `밭 한 칸은 이랑 3줄, 씨앗 1세트로 이랑 1줄. 💧·🧺 버튼을 누르면 그 밭으로 걸어가서 바로 해요. ${TOOLS[tool()].name}: 물 ${tool() >= 3 ? '밭 전체' : `${tool()}이랑`}씩 · 수확 ${['', '하나씩', '한 이랑씩', '밭 전체'][tool()]}`),
        !visit && h('div', { class: 'fm-row' }, h('button', { class: 'btn', onClick: () => walkTo(HX + HW * 0.7, openShop) }, '🔨 카피철물 가기'), h('button', { class: 'btn', onClick: () => openBag() }, '🎒 가방'), h('button', { class: 'btn', onClick: () => openBarn() }, '🧺 헛간 보기')));
      return; }
    const closeB = h('button', { class: 'btn sm fm-x', onClick: () => { sel = -1; drawPlots(); } }, '닫기');
    if (!isOpen(k)) { rc(sheet, closeB, h('b', null, `🔒 ${k + 1}번 밭`), h('p', { class: 'dim' }, visit ? '아직 열지 않은 밭이에요.' : `카피철물에서 땅 문서(${DEEDS[k - 1].toLocaleString('ko-KR')}코인)를 사면 열려요. 밭은 순서대로 열어요.`), !visit && h('div', { class: 'fm-row' }, h('button', { class: 'btn primary', onClick: () => walkTo(HX + HW * 0.7, () => openShop('deed')) }, '카피철물 가기'))); return; }
    const rows = rowsOf(k), growing = rows.filter(r => live(r) && !ripe(r, t)), ripeRows = rows.filter(r => live(r) && ripe(r, t));
    if (pickRow >= 0 && !visit) { // 빈 이랑에 심을 씨앗 고르기
      const have = CROPS.filter(c => ((mine.seeds || {})[c.id] || 0) > 0);
      rc(sheet, closeB, h('b', null, `${k + 1}번 밭 ${pickRow + 1}번째 이랑 · 씨앗 고르기`), have.length ? h('div', { class: 'fm-seeds' }, ...have.map(c => { const can = c.t <= tool();
        return h('button', { class: 'fm-seed' + (can ? '' : ' off'), onClick: () => can ? doPlant(k, pickRow, c) : toast(`${TIER_NAME[c.t]} 작물은 ${TOOLS[c.t].name}가 있어야 심어요`) }, h('img', { src: cropImg(c.id), alt: '' }), h('small', null, `${c.name} ×${mine.seeds[c.id]}`), h('em', null, left(c.ms))); }))
        : h('p', { class: 'dim' }, '가진 씨앗이 없어요. 카피철물에서 씨앗을 사 오세요.'), h('div', { class: 'fm-row' }, h('button', { class: 'btn', onClick: () => { pickRow = -1; drawSheet(); } }, '← 이랑 목록'), !have.length && h('button', { class: 'btn primary', onClick: () => walkTo(HX + HW * 0.7, () => openShop('seed')) }, '카피철물 가기'))); return; }
    const gauge = (label, v, cls) => h('div', { class: 'fm-g ' + cls }, h('span', null, label), h('i', null, h('u', { style: { width: Math.round(v * 100) + '%' } })), h('small', null, Math.round(v * 100) + '%'));
    const rowCard = (r, i) => { if (!live(r)) return h('div', { class: 'fm-rcard empty' }, h('span', { class: 'fm-rn' }, `${i + 1}`), h('b', null, r && r.lost ? '까마귀가 가져갔어요 🐦‍⬛' : '빈 이랑'), !visit && h('button', { class: 'btn sm primary', onClick: () => { pickRow = i; drawSheet(); } }, '🌱 심기'));
      const c = cropOf(r.c), rp = ripe(r, t), s = scoreOf(r, t);
      return h('div', { class: 'fm-rcard' }, h('span', { class: 'fm-rn' }, `${i + 1}`), h('img', { src: cropImg(c.id), alt: '' }), h('div', { class: 'fm-rbody' }, h('b', null, `${c.name} · ${rp ? (rotten(r, t) ? '시들었어요' : '수확!') : left(r.at + r.ms - t) + ' 남음'}`),
        rp ? [h('small', null, rotten(r, t) ? '3일 넘게 안 거둬서 F' : `컨디션 ${Math.round(s * 100)}% · ${left(r.at + r.ms + ROT_MS - t)} 안에 거두기${r.got ? ` · ${YIELD_ROW - r.got}개 남음` : ''}`), !visit && tool() < 3 && h('button', { class: 'btn sm primary fm-rharv', onClick: () => harvestTap(k, i) }, tool() === 2 ? '🧺 이 이랑 거두기' : '🧺 하나 거두기')] : [gauge('자람', Math.min(1, (t - r.at) / r.ms), 'grow'), gauge('컨디션', s, s >= 0.85 ? 'good' : s >= 0.6 ? 'ok' : 'bad'), (sprkOn(sprkOf(data, k), t) ? gauge('💦 물', 1, 'water') : gauge('물', Math.min(1, Math.max(0, r.wet - t) / WET(r)), 'water')), h('button', { class: 'btn sm fm-rwater' + (dryNow(r, t) ? ' dry' : ''), onClick: e => { e.stopPropagation(); walkTo(plotX(k) + PW / 2, () => doWater(k, i)); } }, h('img', { src: toolImg(tool(), 'can'), alt: '' }), tool() >= 3 ? '💧 밭 전체 물 주기' : tool() === 2 ? `💧 ${i + 1}번부터 2이랑 물 주기` : `💧 ${i + 1}번 이랑 물 주기`), !visit && weedNow(r, t) && h('button', { class: 'btn sm fm-rwater weed', onClick: e => { e.stopPropagation(); walkTo(plotX(k) + PW / 2, () => doWeed(k, i)); } }, h('img', { src: toolImg(tool(), 'hoe'), alt: '' }), tool() >= 3 ? '🌿 밭 전체 잡초 베기' : tool() === 2 ? `🌿 ${i + 1}번부터 2이랑 잡초 베기` : `🌿 ${i + 1}번 이랑 잡초 베기`)])); };
    const acts = [];
    if (growing.length) { acts.push(h('button', { class: 'btn' + (growing.some(r => dryNow(r, t)) ? ' primary' : ''), onClick: () => doWater(k) }, h('img', { class: 'fm-ic', src: toolImg(tool(), 'can'), alt: '' }), (visit ? '물 주고 오기' : '물 주기') + ` · ${waterHint(k)}`));
      if (!visit && growing.some(r => weedNow(r, t))) acts.push(h('button', { class: 'btn primary', onClick: () => doWeed(k) }, h('img', { class: 'fm-ic', src: toolImg(tool(), 'hoe'), alt: '' }), `잡초 베기 · ${tool() >= 3 ? '밭 전체' : `${tool()}이랑씩`}`)); }
    if (ripeRows.length && !visit) { const left1 = ripeRows.reduce((a, r) => a + (rotten(r, t) ? 1 : YIELD_ROW - (r.got || 0)), 0); acts.push(h('button', { class: 'btn primary', onClick: () => harvestTap(k) }, tool() >= 3 ? '🧺 밭 전체 수확' : tool() === 2 ? `🧺 한 이랑 수확 (${ripeRows.length}이랑 남음)` : `🧺 하나 수확 (${left1}개 남음)`)); }
    rc(sheet, closeB, h('b', null, `${k + 1}번 밭`), ...rows.map(rowCard), sprkPanel(k, visit),
      h('p', { class: 'dim fm-tip' }, `물은 한 번 주면 자라는 시간의 70%(최소 30분) 동안 버텨요. 30분 안에 자라는 작물은 심을 때 준 물로 충분하고, 나머지도 한 번만 더 주면 돼요(물은 농기구 등급만큼 이랑을 적셔요: 초급 1줄·중급 2줄·고급 밭 전체). 이랑마다 잡초가 한 번 나요${visit ? '(잡초는 밭 주인만 벨 수 있어요)' : ''}. 컨디션 85% 이상 A급(가끔 S), 60% 이상 B급, 그 아래 C급, 다 자란 뒤 3일 넘게 안 거두면 F.`),
      h('div', { class: 'fm-row' }, acts));
  }
  const setRows = (k, rows) => ctx.store.set(`${curRef()}/plots/${k}`, rows.some(Boolean) ? { rows: Object.fromEntries(rows.map((r, i) => [i, r]).filter(([, r]) => r)) } : null).catch(() => {});
  async function doPlant(k, i, c) { const t = now(), n = (mine.seeds || {})[c.id] || 0; if (n <= 0) return; sfx('pop'); const rows = rowsOf(k); rows[i] = plant(c.id, t);
    await ctx.store.update(myRef(), { [`seeds/${c.id}`]: n - 1 >= 1 ? n - 1 : null }).catch(() => {}); await setRows(k, rows); pickRow = -1; toast(`${c.name}을(를) ${i + 1}번째 이랑에 심었어요. 물도 줬어요 💧`, 1800); }
  async function doWater(k, from) { const t = now(), cur = rowsOf(k), n = Math.min(3, tool()); if (from != null) setTurn(k, from); // 이랑을 골라서 주면 그 이랑부터
    // 농기구 등급만큼 이랑을 적신다: 1→2→3번 이랑 차례대로, 물을 주면 무조건 다음 이랑으로 넘어간다
    const order = turnOrder(k, cur.map((r, i) => i).filter(i => live(cur[i]) && !ripe(cur[i], t))), pick = order.slice(0, n);
    if (!pick.length) return; setTurn(k, pick[pick.length - 1] + 1); const rows = cur.map((r, i) => (pick.includes(i) ? water(r, t) : r)); sfx('splash'); useHeld('can'); await setRows(k, rows);
    const more = order.length - pick.length; lastWater[k] = { t, left: lastWater[k] && lastWater[k].left > 0 ? 0 : more }; const what = n >= 3 ? '밭 전체에' : `${pick.map(i => i + 1).join('·')}번째 이랑에`;
    if (who !== ctx.uid) { ctx.store.set(`farm/${who}/note`, { by: ctx.uid, at: t, k }).catch(() => {}); toast(`${ctx.nameOf(who)}네 ${k + 1}번 밭 ${what} 물을 줬어요 💧`, 2000); } else toast(`${what} 물을 줬어요 💧${more > 0 ? ` (남은 이랑 ${more}줄은 한 번 더)` : ''}`, 1600); }
  // 잡초 베기도 물 주기와 같은 넓이: 초급 1이랑 · 중급 2이랑 · 고급 밭 전체(잡초 난 이랑을 1번부터 차례로)
  async function doWeed(k, from) { const t = now(), cur = rowsOf(k), n = Math.min(3, tool()), idx = cur.map((r, i) => i).filter(i => live(cur[i]) && weedNow(cur[i], t)), st = from != null ? from : 0, order = [...idx.filter(i => i >= st), ...idx.filter(i => i < st)], pick = order.slice(0, n);
    if (!pick.length) return; const rows = cur.map((r, i) => (pick.includes(i) ? weed(r, t) : r)); sfx('tock'); useHeld('hoe', true); await setRows(k, rows);
    const more = idx.length - pick.length; toast(`${n >= 3 ? '밭 전체' : pick.map(i => i + 1).join('·') + '번 이랑'} 잡초를 베었어요 🌿${more > 0 ? ` (남은 잡초 ${more}곳은 한 번 더)` : ''}`, 1600); }
  // 수확: 초급 농기구는 작물 하나씩(누를 때마다 1개), 중급은 한 이랑씩, 고급은 밭 전체를 한 번에. 등급은 그 이랑에서 처음 거둘 때 정해진다
  let harvBusy = false;
  async function harvestTap(k, only) { if (harvBusy || who !== ctx.uid) return; const t = now(), rows = rowsOf(k), T = tool();
    rows.forEach((r, i) => { if (r && r.lost && ripe(r, t)) rows[i] = null; });
    const ripeIdx = rows.map((r, i) => i).filter(i => live(rows[i]) && ripe(rows[i], t)); if (!ripeIdx.length) return;
    const targets = T >= 3 ? ripeIdx : [only != null && ripeIdx.includes(only) ? only : ripeIdx[0]];
    const got = [], patch = {}, add = {}; harvBusy = true;
    targets.forEach(i => { const r = rows[i], g = r.g || gradeOf(r, t), left = YIELD_ROW - (r.got || 0), take = g === 'F' ? 0 : T === 1 ? 1 : left, done = g === 'F' || (r.got || 0) + take >= YIELD_ROW;
      const bad = r.bad != null ? r.bad : BAD[T][0] + Math.floor(Math.random() * (BAD[T][1] - BAD[T][0] + 1)), badLeft = Math.max(0, bad - (r.badGot || 0)), badNow = !take ? 0 : T === 1 ? (Math.random() < badLeft / left ? 1 : 0) : Math.min(take, badLeft), good = take - badNow;
      got.push([r.c, g, good, badNow]); if (good) { const key = `${r.c}|${g}`; add[key] = (add[key] || 0) + good; } rows[i] = done ? null : { ...r, g, got: (r.got || 0) + take, bad, badGot: (r.badGot || 0) + badNow }; });
    Object.entries(add).forEach(([key, n]) => { patch[`barn/${key}`] = ((mine.barn || {})[key] || 0) + n; });
    try { if (Object.keys(patch).length) await ctx.store.update(myRef(), patch).catch(() => {}); await setRows(k, rows); } finally { harvBusy = false; }
    useHeld('hoe'); sfx(got.some(([, g]) => g === 'S') ? 'bigfish' : got.every(([, g]) => g === 'F') ? 'bad' : 'coin');
    if (T < 3) { const [id, g, n, b] = got[0]; harvPop(k, g === 'F' ? '시들었어요' : !n ? `불량이에요 🗑` : `+${n} ${cropOf(id).name} ${g}급${b ? ` (불량 ${b})` : ''}`, !n ? 'F' : g); if (!rows.some(r => live(r) && ripe(r, t))) toast(`${k + 1}번 밭 수확 끝! 헛간에 담았어요 🧺`, 1600); drawPlots(); return; }
    drawPlots();
    modal({ title: `${k + 1}번 밭 수확!`, body: [h('div', { class: 'fm-hlist' }, ...got.map(([id, g, n, b]) => h('div', { class: 'fm-harv g' + g }, h('img', { src: cropImg(id), alt: '' }), h('b', { class: 'fm-gr g' + g }, g === 'F' ? 'F' : g + '급'), h('small', null, g === 'F' ? '시들었어요' : `${cropOf(id).name} ×${n}${b ? ` · 불량 ${b}` : ''}`)))),
      h('p', { class: 'center' }, got.some(([, g]) => g !== 'F') ? '헛간에 담았어요. 카피수퍼에서 팔 수 있어요.' : '다 자란 뒤 3일 넘게 거두지 않아 시들었어요.')], actions: [{ label: '확인', primary: true }] }); }
  // 밭 위로 '+1 감자 A급'이 떠오른다
  function harvPop(k, text, g) { const e = h('b', { class: 'fm-hpop g' + g, style: { left: plotX(k) + PW / 2 + 'px' } }, text); world.append(e); setTimeout(() => e.remove(), 1300); }

  // 헛간: 거둔 작물
  function openBarn() { const L = Object.entries(mine.barn || {}).filter(([, n]) => n > 0).sort();
    modal({ title: '🧺 헛간', body: [L.length ? h('div', { class: 'fm-barn' }, ...L.map(([key, n]) => { const [id, g] = key.split('|'), c = cropOf(id); return h('div', { class: 'fm-bi' }, h('img', { src: cropImg(id), alt: '' }), h('b', null, `${c ? c.name : id} ×${n}`), h('span', { class: 'fm-gr g' + g }, g)); }))
      : h('p', { class: 'dim center' }, '아직 거둔 작물이 없어요.'), h('p', { class: 'dim center' }, '작물은 카피수퍼에서 팔 수 있어요. 나중에 요리·퀘스트 재료로도 써요.')], actions: [{ label: '닫기', primary: true }] }); }

  // 내 가방(농장): 가진 씨앗 세트와 농기구. 씨앗 1세트 = 이랑 1줄
  function bagView() { const sd = Object.entries(mine.seeds || {}).filter(([, n]) => n > 0).map(([id, n]) => [cropOf(id), n]).filter(([c]) => c).sort((a, b) => a[0].t - b[0].t || a[0].ms - b[0].ms), total = sd.reduce((a, [, n]) => a + n, 0);
    return h('div', { class: 'fm-bag' }, h('div', { class: 'fm-bagtool' }, h('img', { src: toolImg(tool()), alt: '' }), h('div', null, h('b', null, TOOLS[tool()].name), h('small', null, `${TIER_NAME[tool()]} 작물까지 심어요 · 물은 한 번에 ${tool() >= 3 ? '밭 전체' : `이랑 ${tool()}줄`}`))),
      (mine.sprkInv || 0) > 0 && h('div', { class: 'fm-bagtool' }, h('span', { class: 'fm-sprkic' }, h('img', { src: SPRK_IMG, alt: '' })), h('div', null, h('b', null, `스프링클러 ${mine.sprkInv}개`), h('small', null, '밭 앞에 서면 "스프링클러 설치" 버튼이 떠요'))),
      h('b', { class: 'so-sellh' }, `🌱 가진 씨앗 ${total}세트 · 1세트 = 이랑 1줄`),
      sd.length ? h('div', { class: 'fm-sgrid' }, ...sd.map(([c, n]) => { const can = c.t <= tool(); return h('div', { class: 'fm-sbuy have' + (can ? '' : ' off') }, h('i', { class: 'fm-have' }, `${n}세트`), h('img', { src: cropImg(c.id), alt: '' }), h('b', null, c.name), h('small', null, `${TIER_NAME[c.t]} · 이랑 ${n}줄 심을 수 있어요`), h('small', null, can ? `${left(c.ms)} 걸려요` : `${TOOLS[c.t].name}가 있어야 심어요`)); }))
        : h('p', { class: 'dim center' }, '가진 씨앗이 없어요. 카피철물에서 사 오세요.')); }
  function openBag() { modal({ title: '🎒 내 가방', body: [bagView()], actions: [{ label: '닫기', primary: true }] }); }
  // 카피철물: 씨앗 · 농기구 · 땅 문서 · 내 가방
  function openShop(tab = 'seed') {
    if (who !== ctx.uid) { who = ctx.uid; listen(); }
    const body = h('div', { class: 'fm-mart' }), tabs = h('div', { class: 'so-tabs' });
    // 씨앗 사기: 누르면 바로 사지 않고, 개수를 고른 뒤 '구매' 버튼을 눌러야 산다
    function buySeed(c) { let q = 1; const have = () => (mine.seeds || {})[c.id] || 0, num = h('b', { class: 'fm-qn' }), tot = h('b', { class: 'fm-qt' }), go = h('button', { class: 'btn primary big' });
      const upd = () => { num.textContent = q; tot.textContent = `${(c.seed * q).toLocaleString('ko-KR')}코인`; go.textContent = `🛒 ${q}세트 구매`; };
      const step = d => h('button', { class: 'btn fm-qbtn', onClick: () => { q = Math.max(1, Math.min(20, q + d)); upd(); } }, d > 0 ? '+' : '−');
      let cl; go.onclick = async () => { const n = have(); cl(); await buy(c.seed * q, { [`seeds/${c.id}`]: n + q }, `${c.name} 씨앗 ${q}세트를 샀어요 (가진 것 ${n + q})`); };
      upd(); cl = modal({ title: `🌱 ${c.name} 씨앗`, body: [h('div', { class: 'fm-bs' }, h('img', { src: cropImg(c.id), alt: '' }), h('div', null, h('b', null, `${TIER_NAME[c.t]} 작물 · ${left(c.ms)}`), h('small', null, `1세트 ${c.seed.toLocaleString('ko-KR')}코인 · 이랑 1줄`), h('small', null, `카피수퍼에서 하나 ${cropPrice(c.id, 'C')}~${cropPrice(c.id, 'S')}코인 · 가진 씨앗 ${have()}세트`))),
        h('div', { class: 'fm-qrow' }, step(-1), num, step(1)), h('p', { class: 'center' }, '합계 ', tot), go], actions: [{ label: '취소' }] }); }
    const buy = async (price, patch, msg) => { if (price > 0 && !(await ctx.spend(price))) { toast(`돈이 모자라요 (${price.toLocaleString('ko-KR')}코인 필요)`); return; } await save(patch); sfx('coin'); toast(msg, 1800); draw(); };
    function draw() {
      rc(tabs, [['seed', '🌱 씨앗'], ['tool', '🧰 농기구'], ['deed', '📜 땅 문서'], ['bag', '🎒 내 가방']].map(([k, t]) => h('button', { class: 'chip' + (tab === k ? ' on' : ''), onClick: () => { tab = k; draw(); } }, t)));
      const rows = [h('p', { class: 'center' }, '내 돈 ', h('b', null, ctx.coins().toLocaleString('ko-KR') + '코인'))];
      if (tab === 'seed') [1, 2, 3].forEach(tr => { rows.push(h('b', { class: 'so-sellh' }, `${TIER_NAME[tr]} 작물${tr > tool() ? ` · ${TOOLS[tr].name} 필요` : ''}`));
        rows.push(h('div', { class: 'fm-sgrid' }, ...CROPS.filter(c => c.t === tr).map(c => { const lock = c.t > tool(), n = (mine.seeds || {})[c.id] || 0;
          return h('button', { class: 'fm-sbuy' + (lock ? ' off' : '') + (n ? ' have' : ''), onClick: () => lock ? toast(`${TOOLS[c.t].name}를 먼저 사야 해요`) : buySeed(c) },
            n > 0 && h('i', { class: 'fm-have' }, `🎒 ${n}세트`), h('img', { src: cropImg(c.id), alt: '' }), h('b', null, c.name), h('small', null, `${c.seed.toLocaleString('ko-KR')}코인 · 1세트 = 이랑 1줄 · ${left(c.ms)}`), h('small', null, `하나 ${cropPrice(c.id, 'C')}~${cropPrice(c.id, 'S')}코인`)); }))); });
      if (tab === 'bag') rows.push(bagView());
      if (tab === 'seed') rows.unshift(h('p', { class: 'dim center fm-seednote' }, '씨앗 1세트로 이랑 1줄을 심어요. 밭 한 칸은 이랑 3줄이에요. 초록 테두리 = 가지고 있는 씨앗'));
      if (tab === 'tool') TOOLS.slice(1).forEach(tl => { const have = tool() >= tl.t;
        rows.push(h('button', { class: 'so-row big' + (have ? ' off' : '') , onClick: () => have ? toast('이미 가지고 있어요') : tl.t > tool() + 1 ? toast(`${TOOLS[tl.t - 1].name}부터 사야 해요`) : buy(tl.price, { tool: tl.t }, `${tl.name}를 샀어요! ${TIER_NAME[tl.t]} 작물을 심을 수 있어요`) },
          h('span', { class: 'so-rodic' }, h('img', { src: toolImg(tl.t), alt: '', style: { width: '48px' } })), h('b', null, tl.name), h('small', null, have ? '가지고 있어요 · 한 번 사면 계속 써요' : `${tl.price.toLocaleString('ko-KR')}코인 · ${tl.note}`))); });
      if (tab === 'tool') { const inv = mine.sprkInv || 0, put = Object.values(mine.sprk || {}).filter(x => x && x.on).length;
        rows.push(h('button', { class: 'so-row big', onClick: () => buy(SPRK_PRICE, { sprkInv: inv + 1 }, '스프링클러를 샀어요! 가방에 넣었어요. 밭 앞에 서면 설치 버튼이 떠요 💦') }, h('span', { class: 'so-rodic fm-sprkic' }, h('img', { src: SPRK_IMG, alt: '' })), h('b', null, `스프링클러${inv ? ` (가진 것 ${inv})` : ''}${put ? ` · 설치 ${put}밭` : ''}`), h('small', null, `${SPRK_PRICE.toLocaleString('ko-KR')}코인 · 밭 1칸에 1개 · 하루 사용료 ${SPRK_DAY}코인(밭 전부 합쳐서)으로 24시간 자동 물 주기 · 등급이 안 떨어져요`))); }
      if (tab === 'deed') { const n = data.open || 1; rows.push(h('p', { class: 'dim center' }, `지금 열린 밭 ${n} / ${PLOTS}칸 · 밭은 순서대로 열려요`));
        DEEDS.forEach((pr, i) => { const k = i + 1, have = n > k, next = n === k;
          rows.push(h('button', { class: 'so-row big' + (have || !next ? ' off' : ''), onClick: () => have ? toast('이미 연 밭이에요') : !next ? toast('앞의 밭부터 열어야 해요') : buy(pr, { open: k + 1 }, `${k + 1}번 밭이 열렸어요! 🌱`) },
            h('span', null, '📜'), h('b', null, `${k + 1}번 밭 땅 문서`), h('small', null, have ? '열었어요' : `${pr.toLocaleString('ko-KR')}코인`))); }); }
      rc(body, tabs, rows); }
    draw(); modal({ title: '🔨 카피철물', body: [body], actions: [{ label: '나가기', primary: true }] }); }

  // 스프링클러: 밭마다 하나. 밤 12시~아침 10시는 그냥 돌고, 그 밖의 시간은 1시간 SPRK_HOUR코인으로 늘린다(버튼으로 시간을 고른 뒤 결제)
  const sprkN = {}, hhmm = ms => { const d = new Date(ms), td = new Date(); const day = d.toDateString() === td.toDateString() ? '' : d.getDate() === new Date(td.getTime() + 86400000).getDate() ? '내일 ' : `${d.getMonth() + 1}/${d.getDate()} `; return `${day}${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`; };
  const sprkEnd = (sp, t) => { const w = sprkWins(sp, t - 1, t + 7 * 86400000).find(([a, b]) => a <= t && t < b); return w ? w[1] : 0; };
  function sprkPanel(k, visit) { const sp = sprkOf(data, k), t = now(), inv = mine.sprkInv || 0, auto = data.sprkAuto !== 0, paidToday = !!((data.sprkDays || {})[day0(t)]);
    if (!sp || !sp.on) return visit ? null : h('div', { class: 'fm-sprkp' }, h('b', { class: 'fm-sph' }, h('img', { src: SPRK_IMG, alt: '' }), '스프링클러'), h('small', null, inv ? `가진 스프링클러 ${inv}개 · 설치하면 하루 ${SPRK_DAY}코인으로 24시간 알아서 물을 줘요` : `하루 ${SPRK_DAY}코인으로 24시간 알아서 물을 줘요 · 카피철물 🧰 농기구에서 ${SPRK_PRICE.toLocaleString('ko-KR')}코인`),
      inv ? h('button', { class: 'btn primary', onClick: () => installSprk(k) }, '이 밭에 설치하기') : h('button', { class: 'btn', onClick: () => openShop('tool') }, '사러 가기'));
    const end = sprkEnd(sp, t), on = end > 0;
    return h('div', { class: 'fm-sprkp on' }, h('b', { class: 'fm-sph' }, h('img', { src: SPRK_IMG, alt: '' }), paidToday ? '스프링클러 완전 자동 · 오늘 하루 종일' : on ? `스프링클러 작동 중 · ${hhmm(end)}까지` : '스프링클러 쉬는 중'),
      h('small', null, auto ? `하루 사용료 ${SPRK_DAY}코인(설치한 밭 전부 합쳐서)이 작물이 자라는 날에만 알아서 빠져요. 물은 24시간 자동이라 등급이 안 떨어져요.` : `자동 결제를 꺼 뒀어요. 밤 12시~아침 10시에만 공짜로 물을 줘요.`),
      !visit && h('button', { class: 'btn' + (auto ? '' : ' primary'), onClick: async () => { await save({ sprkAuto: auto ? 0 : null }); toast(auto ? '자동 결제를 껐어요. 밤 12시~아침 10시에만 물을 줘요' : `자동 결제를 켰어요 💦 하루 ${SPRK_DAY}코인`, 2200); if (!auto) setTimeout(sprkAutoPay, 300); } }, auto ? '자동 결제 끄기' : `자동 결제 켜기 (하루 ${SPRK_DAY}코인)`)); }
  // 하루 사용료 자동 결제: 스프링클러 밭에 작물이 자라고 있는 날 중 아직 안 낸 날(최근 7일, 아직 셈하지 않은 날만)을 오늘부터 거꾸로 낸다. 돈이 모자라면 낼 수 있는 날까지만
  let sprkPaying = false, sprkPoor = false;
  async function sprkAutoPay() { if (sprkPaying || !alive) return; const f = mine; if (f.sprkAuto === 0) return; const ks = Object.keys(f.sprk || {}).filter(k => f.sprk[k] && f.sprk[k].on && +k < (f.open || 1)); if (!ks.length) return;
    const rows = ks.flatMap(k => { const p = (f.plots || {})[k]; return !p ? [] : p.c ? [p] : Object.values(p.rows || {}); }).filter(r => r && r.c), t = now(), td = day0(t), paid = f.sprkDays || {}, due = [];
    const since = new Date(2026, 10, 20).getTime(); // 이 방식이 시작된 날보다 앞선 날은 거슬러 받지 않는다
    for (let d = td; d >= Math.max(since, td - 6 * DAYMS); d -= DAYMS) if (!paid[d] && rows.some(r => r.at < d + DAYMS && r.at + r.ms > d && (r.calc || r.at) < d + DAYMS && r.at + r.ms > (r.calc || r.at))) due.push(d);
    if (!due.length) return; sprkPaying = true; const ok = [];
    try { for (const d of due) { if (ctx.coins() < SPRK_DAY || !(await ctx.spend(SPRK_DAY))) break; ok.push(d); }
      if (ok.length) { const patch = {}; ok.forEach(d => { patch['sprkDays/' + d] = 1; }); Object.keys(paid).forEach(d => { if (+d < td - 9 * DAYMS) patch['sprkDays/' + d] = null; }); await save(patch); sfx('coin'); toast(`💦 스프링클러 사용료 ${ok.length > 1 ? ok.length + '일치 ' : ''}${(ok.length * SPRK_DAY).toLocaleString('ko-KR')}코인 · 오늘은 하루 종일 자동이에요`, 2600); sprkPoor = false; }
      else if (!sprkPoor) { sprkPoor = true; toast(`돈이 모자라 스프링클러 사용료(${SPRK_DAY}코인)를 못 냈어요. 밤 12시~아침 10시에만 물을 줘요`, 3000); } } catch {}
    sprkPaying = false; }
  // 시간 정해서 켜기: 시작~끝 시간을 직접 고르면, 무료 시간·이미 켜 둔 시간을 뺀 만큼만 1시간 SPRK_HOUR코인
  const sprkT = {}, pad2 = n => String(n).padStart(2, '0'), hm = ms => { const d = new Date(ms); return `${pad2(d.getHours())}:${pad2(d.getMinutes())}`; };
  const atHM = (v, ref) => { const [H, M] = String(v || '00:00').split(':').map(Number), d = new Date(ref); d.setHours(H || 0, M || 0, 0, 0); return d.getTime(); };
  // 고를 수 있는 건 아침 10시 ~ 밤 12시 사이 정시만(밤 12시~아침 10시는 원래 무료). 오늘 그 시간이 다 지났으면 내일로
  function rangeOf(k, sp, t) { const nowH = new Date(t).getHours(), d0 = new Date(t); d0.setHours(0, 0, 0, 0);
    const st = sprkT[k] || (sprkT[k] = (() => { const s0 = nowH >= 10 && nowH < 23 ? nowH + 1 : 10; return { s: s0, e: Math.min(24, s0 + 2) }; })());
    let a = d0.getTime() + st.s * HR, b = d0.getTime() + st.e * HR; if (b <= t) { a += 86400000; b += 86400000; } a = Math.max(a, t);
    const cov = sprkWins(sp, a, b).reduce((x, [p, q]) => x + Math.max(0, Math.min(q, b) - Math.max(p, a)), 0), hrs = Math.ceil(Math.max(0, b - a - cov) / HR - 1e-9); return { a, b, hrs }; }
  function rangeEl(k, sp, t) { const { a, b, hrs } = rangeOf(k, sp, t), st = sprkT[k], lab = n => n === 24 ? '밤 12시' : n < 12 ? `오전 ${n}시` : n === 12 ? '낮 12시' : `오후 ${n - 12}시`;
    const sel = (key, from, to) => h('select', { class: 'fm-time', onChange: e => { const v = +e.target.value; sprkT[k] = key === 's' ? { s: v, e: Math.max(st.e, v + 1) } : { ...st, e: v }; drawSheet(); } },
      ...Array.from({ length: to - from + 1 }, (_, i) => from + i).map(n => h('option', { value: n, selected: n === st[key] }, lab(n))));
    return h('div', { class: 'fm-sprkt' }, h('b', null, '⏰ 원하는 시간 정해서 켜기 (아침 10시 ~ 밤 12시)'), h('div', { class: 'fm-sprkti' }, sel('s', 10, 23), h('span', null, '~'), sel('e', st.s + 1, 24),
        h('button', { class: 'btn primary', onClick: () => buySprkRange(k) }, hrs ? `${(hrs * SPRK_HOUR).toLocaleString('ko-KR')}코인 결제` : '이미 켜져 있어요')),
      h('small', null, `${hhmm(a)} ~ ${hhmm(b)} · ${hrs ? `이미 켜 둔 시간 빼고 ${hrs}시간` : '이 시간엔 이미 물을 줘요'}`)); }
  // 구독료 결제 전에 한 번 더: 시간과 총 비용을 보여 주고 확인·취소
  const payAsk = (k, a, b, hrs) => new Promise(res => { let done = false; modal({ title: '💦 스프링클러 구독료 결제', body: h('div', { class: 'fm-payask' }, h('img', { src: SPRK_IMG, alt: '' }),
      h('p', null, h('b', null, `${k + 1}번 밭`), ` · ${hhmm(a)} ~ ${hhmm(b)}`), h('p', null, `${hrs}시간 × ${SPRK_HOUR}코인`), h('p', { class: 'fm-paytot' }, `총 ${(hrs * SPRK_HOUR).toLocaleString('ko-KR')}코인`), h('small', null, `결제 후 남는 돈 ${(ctx.coins() - hrs * SPRK_HOUR).toLocaleString('ko-KR')}코인`)),
    noX: true, onClose: () => { if (!done) res(false); }, actions: [{ label: '취소', onClick: c => { done = true; res(false); c(); } }, { label: '확인', primary: true, onClick: c => { done = true; res(true); c(); } }] }); });
  async function buySprkRange(k) { if (who !== ctx.uid) return; const t = now(), sp = (mine.sprk || {})[k] || { on: 1 }, { a, b, hrs } = rangeOf(k, sp, t); if (!hrs) return toast('그 시간엔 이미 스프링클러가 돌아요'); if (!(await payAsk(k, a, b, hrs))) return;
    const cost = hrs * SPRK_HOUR; if (!(await ctx.spend(cost))) return toast(`돈이 모자라요 (${cost.toLocaleString('ko-KR')}코인 필요)`);
    const paid = (sp.paid || []).filter(w => w[1] > t - 2 * 86400000).concat([[a, b]]); await save({ [`sprk/${k}/paid`]: paid }); sfx('coin'); toast(`💦 ${hhmm(a)} ~ ${hhmm(b)} 예약했어요 (${cost.toLocaleString('ko-KR')}코인)`, 2000); }
  async function installSprk(k) { const inv = mine.sprkInv || 0; if (inv <= 0 || who !== ctx.uid) return; await save({ [`sprk/${k}`]: { on: 1, paid: [] }, sprkInv: inv - 1 > 0 ? inv - 1 : null }); sfx('splash'); toast(`${k + 1}번 밭에 스프링클러를 설치했어요 💦`, 1600); setTimeout(sprkAutoPay, 400); }
  async function buySprkTime(k, base, n) { if (who !== ctx.uid) return; if (!(await payAsk(k, base, base + n * HR, n))) return; const cost = n * SPRK_HOUR; if (!(await ctx.spend(cost))) return toast(`돈이 모자라요 (${cost.toLocaleString('ko-KR')}코인 필요)`); const t = now(), sp = (mine.sprk || {})[k] || { on: 1 };
    const paid = (sp.paid || []).filter(w => w[1] > t - 2 * 86400000).concat([[base, base + n * HR]]); await save({ [`sprk/${k}/paid`]: paid }); sprkN[k] = 1; sfx('coin'); toast(`💦 ${hhmm(base + n * HR)}까지 물을 줘요 (${cost.toLocaleString('ko-KR')}코인)`, 1800); }

  // 화면: 내 카피바라가 걸어가고, 1초마다 밭 시간 표시를 고친다
  let lastT = performance.now(), tick = 0;
  function step(t) { if (!alive) return; const dt = Math.min(0.05, (t - lastT) / 1000); lastT = t;
    const dir = (keys.has('R') ? 1 : 0) - (keys.has('L') ? 1 : 0);
    if (dir && !document.querySelector('.modal-wrap')) { me.x = Math.max(30, Math.min(WIDTH - 30, me.x + dir * WALK_SP * (sc ? 1.8 : 1) * dt)); me.tx = me.x; me.then = null; meEl.classList.add('walk'); meEl.classList.toggle('left', dir < 0); me.keyed = true; }
    else if (me.keyed) { me.keyed = false; meEl.classList.remove('walk'); const k = plotEls.findIndex((_, i) => Math.abs(me.x - (plotX(i) + PW / 2)) < PW / 2); if (k >= 0 && k !== sel) { sel = k; pickRow = -1; drawPlots(); } }
    const atShop = me.x < HX + SW + GAP; if (enterBtn.hidden === atShop) enterBtn.hidden = !atShop; if (t - quickAt > 250) { quickAt = t; quickEl.hidden = atShop; if (!atShop) drawQuick(); }
    const d = me.tx - me.x; if (Math.abs(d) > 2) me.x += Math.sign(d) * Math.min(Math.abs(d), WALK_SP * (sc ? 1.8 : 1) * dt); else if (me.then) { const f = me.then; me.then = null; meEl.classList.remove('walk'); f(); } else if (!dir) meEl.classList.remove('walk'); // 방향키로 걷는 중엔 걸음 모션을 끊지 않는다(매 프레임 지웠다 붙이면 뒤뚱거림이 안 보인다)
    meEl.style.left = me.x + 'px';
    const want = me.x - scroller.clientWidth / 2; if (Math.abs(scroller.scrollLeft - want) > 4 && (meEl.classList.contains('walk') || dir)) scroller.scrollLeft += (want - scroller.scrollLeft) * Math.min(1, dt * 6);
    if ((tick += dt) > 1) { tick = 0; drawPlots(); }
    raf = requestAnimationFrame(step); }
  function close() { if (!alive) return; alive = false; window.removeEventListener('keydown', onKey); window.removeEventListener('keyup', onKey); cancelAnimationFrame(raf); if (off) off(); offMine(); clearInterval(sprkTick); wrap.remove(); o.onClose && o.onClose(); }
  const sprkTick = setInterval(sprkAutoPay, 60000); // 농장을 열어 둔 채 자정이 지나도 그날 사용료를 낸다
  listen(); raf = requestAnimationFrame(step); requestAnimationFrame(() => { scroller.scrollLeft = Math.max(0, me.x - scroller.clientWidth / 2); });
  // 상대가 내 밭에 물을 주고 갔으면 알려 준다
  ctx.store.get ? ctx.store.get('farm/' + ctx.uid + '/note').then(v => { if (v && v.by && v.by !== ctx.uid && v.at > ((mine.noteSeen) || 0)) { toast(`${ctx.nameOf(v.by)}가 내 밭에 물을 주고 갔어요 💧`, 2600); save({ noteSeen: v.at }); } }).catch(() => {}) : 0;
  return { close };
}
