// 카피 버거 — 카피바라 손님 주문(익힘·빼기·추가·소스)대로 패티를 굽고 재료를 쌓아 파는 하루 단위 버거 가게
import { h } from './ui.js';
import { capy } from './capy.js';
import { HATS } from './clothes.js';
import { sfx } from './sound.js';

// ---------- 재료·메뉴 ----------
const TOPS = ['cheese', 'lettuce', 'tomato', 'onion', 'pickle', 'bacon', 'egg', 'jalapeno', 'avocado'];
const SAUCES = ['ketchup', 'mustard', 'mayo', 'bulgogi', 'sriracha'];
const FRIED = { chicken: 1, shrimp: 1 };
const isPatty = k => k === 'beef' || !!FRIED[k], isSauce = k => SAUCES.includes(k);
const NAME = { beef: '패티', chicken: '치킨', shrimp: '새우', potato: '감자', fries: '감자튀김', cheese: '치즈', lettuce: '양상추', tomato: '토마토', onion: '양파', pickle: '피클', bacon: '베이컨', egg: '계란',
  jalapeno: '할라피뇨', avocado: '아보카도', ketchup: '케첩', mustard: '머스터드', mayo: '마요', bulgogi: '불고기소스', sriracha: '매운소스', bun_b: '아랫빵', bun_t: '윗빵' };
export const MENUS = [
  { n: '카피 버거', day: 1, price: 30, L: ['beef', 'ketchup', 'pickle', 'onion'] },
  { n: '치즈 버거', day: 2, price: 36, L: ['beef', 'cheese', 'ketchup', 'pickle'] },
  { n: '불고기 버거', day: 3, price: 44, L: ['beef', 'bulgogi', 'lettuce', 'mayo'] },
  { n: '베이컨 버거', day: 4, price: 54, L: ['beef', 'cheese', 'bacon', 'lettuce', 'tomato', 'mayo'] },
  { n: '더블치즈 버거', day: 5, price: 64, L: ['beef', 'cheese', 'beef', 'cheese', 'ketchup', 'pickle', 'onion'] },
  { n: '에그 버거', day: 6, price: 58, L: ['beef', 'egg', 'cheese', 'lettuce', 'mayo'] },
  { n: '새우 버거', day: 7, price: 68, fry: 1, L: ['shrimp', 'lettuce', 'tomato', 'mayo'] },
  { n: '치킨 버거', day: 8, price: 68, fry: 1, L: ['chicken', 'pickle', 'lettuce', 'mayo'] },
  { n: '할라피뇨 버거', day: 9, price: 74, L: ['beef', 'cheese', 'jalapeno', 'onion', 'sriracha'] },
  { n: '아보카도 버거', day: 11, price: 84, L: ['beef', 'avocado', 'tomato', 'lettuce', 'mayo'] },
  { n: '온천 스페셜', day: 13, price: 108, L: ['beef', 'cheese', 'bacon', 'egg', 'onion', 'bulgogi'] },
  { n: '카피 타워', day: 15, price: 190, L: ['beef', 'cheese', 'beef', 'cheese', 'beef', 'cheese', 'bacon', 'egg', 'lettuce', 'tomato', 'onion', 'pickle', 'ketchup', 'mayo'] },
];
const ZONE = { rare: [0.45, 0.75], medium: [0.75, 1.05], well: [1.05, 1.35], fry: [0.75, 1.25] }, BURN = 1.5, GMAX = 1.7;
const DONE = { rare: ['레어', '#E8788A'], medium: ['미디엄', '#E8922E'], well: ['웰던', '#8A5A3A'] };
const UPS = [
  { id: 'grill', ic: '🔥', n: '그릴 칸', d: '한 번에 굽는 패티 수', cost: [180, 550, 1400, 3500] },
  { id: 'heat', ic: '♨️', n: '화력', d: '더 빨리 익어요', cost: [220, 700, 1800, 4200, 9000] },
  { id: 'fryer', ic: '🍟', n: '튀김기', d: '감자튀김·새우·치킨 메뉴', cost: [800] },
  { id: 'basket', ic: '🧺', n: '튀김 바구니', d: '한 번에 두 개 튀기기', cost: [1600], req: 'fryer' },
  { id: 'wait', ic: '🪑', n: '대기석', d: '손님이 더 오래 기다려요', cost: [280, 850, 2100, 5000, 11000] },
  { id: 'sign', ic: '🪧', n: '간판', d: '버거 값을 더 받아요', cost: [450, 1400, 3600, 8500, 18000] },
];
const RANKS = ['온천 노점', '골목 버거집', '수제버거 가게', '버거 맛집', '카피 버거 명가'], RANK_AT = [0, 2500, 10000, 35000, 100000];
const WORDS = ['', '별로예요', '그럭저럭', '좋아요', '맛있어요!', '최고예요!'];
const HELLO = ['안녕하세요!', '배고파요', '하나 주세요', '맛있게 해 주세요'];
const rnd = n => Math.floor(Math.random() * n), pick = a => a[rnd(a.length)];
const josaRo = w => { const c = (w.charCodeAt(w.length - 1) - 0xAC00) % 28; return w + (c && c !== 8 ? '으로' : '로'); };
const josaEun = w => w + ((w.charCodeAt(w.length - 1) - 0xAC00) % 28 ? '은' : '는');
export const fresh = () => ({ coin: 0, total: 0, day: 1, rank: 0, best: MENUS.map(() => 0), seen: [], up: { grill: 0, heat: 0, fryer: 0, basket: 0, wait: 0, sign: 0 }, played: 0 });
export const rankOf = total => RANK_AT.reduce((r, at, i) => (total >= at ? i : r), 0);

// ---------- 그림 ----------
const mixHex = (a, b, t) => '#' + [1, 3, 5].map(i => Math.round(parseInt(a.slice(i, i + 2), 16) * (1 - t) + parseInt(b.slice(i, i + 2), 16) * t).toString(16).padStart(2, '0')).join('');
const ramp = stops => v => { for (let i = 1; i < stops.length; i++) if (v <= stops[i][0]) return mixHex(stops[i - 1][1], stops[i][1], Math.max(0, (v - stops[i - 1][0]) / (stops[i][0] - stops[i - 1][0]))); return stops[stops.length - 1][1]; };
const beefCol = ramp([[0, '#F0A0A6'], [0.45, '#CB8068'], [0.9, '#8E5C3B'], [1.3, '#5C3B27'], [1.7, '#1E1613']]);
const fryCol = ramp([[0, '#F4E6BE'], [0.75, '#EDB851'], [1.25, '#C98727'], [1.7, '#33241A']]);
const SAUCE_COL = { ketchup: '#D8322B', mustard: '#F2C230', mayo: '#FFF6DC', bulgogi: '#6B3A22', sriracha: '#F0642D' };
const svg = (w, hh, body) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${hh}">${body}</svg>`;
const pattyCol = L => (L.k === 'beef' ? beefCol : fryCol)(L.s ? (L.s[0] + L.s[1]) / 2 : 0.9);
// 옆에서 본 한 겹: [그림, 그림 높이, 쌓이는 두께]
function layer(L) {
  const k = L.k;
  if (k === 'bun_b') return [svg(84, 17, '<path d="M5 2h74a4 4 0 0 1 4 4v2a8 8 0 0 1-8 8H9a8 8 0 0 1-8-8V6a4 4 0 0 1 4-4z" fill="#E3A557" stroke="#A66E2C" stroke-width="1.5"/><rect x="5" y="3" width="74" height="4" rx="2" fill="#F8E2AE"/>'), 17, 11];
  if (k === 'bun_t') return [svg(84, 31, '<path d="M2 27C2 11 18 2 42 2s40 9 40 25c0 2-2 3-4 3H6c-2 0-4-1-4-3z" fill="#E9A450" stroke="#A66E2C" stroke-width="1.5"/><path d="M10 20c4-9 16-14 30-14" fill="none" stroke="#F7D08D" stroke-width="3" stroke-linecap="round"/>' + [[24, 12], [38, 8], [52, 11], [63, 17], [33, 17], [47, 19]].map(([x, y]) => `<ellipse cx="${x}" cy="${y}" rx="2.3" ry="1.3" fill="#FFF3D0"/>`).join('')), 31, 23];
  if (k === 'beef') { const c = pattyCol(L); return [svg(84, 14, `<rect x="3" y="1" width="78" height="12" rx="6" fill="${c}" stroke="${mixHex(c, '#000000', 0.35)}" stroke-width="1.5"/>` + [16, 32, 48, 64].map(x => `<path d="M${x} 5l6 4" stroke="${mixHex(c, '#000000', 0.3)}" stroke-width="1.6" stroke-linecap="round"/>`).join('')), 14, 10]; }
  if (FRIED[k]) { const c = pattyCol(L), d = mixHex(c, '#000000', 0.3); return [svg(84, 15, [8, 19, 30, 41, 52, 63, 74].map(x => `<circle cx="${x}" cy="5.5" r="4.6" fill="${c}" stroke="${d}" stroke-width="1.2"/>`).join('') + `<rect x="3" y="4" width="78" height="10" rx="5" fill="${c}" stroke="${d}" stroke-width="1.5"/>` + (k === 'shrimp' ? [14, 34, 54, 70].map(x => `<circle cx="${x}" cy="9" r="1.6" fill="#F59A7A"/>`).join('') : [12, 28, 44, 60, 72].map(x => `<circle cx="${x}" cy="9" r="1.2" fill="#FFF0C0"/>`).join(''))), 15, 10]; }
  if (k === 'cheese') return [svg(84, 12, '<path d="M1 1h82v4h-9l-4 6-4-6H44l-3 4-3-4H18l-5 6-4-6H1z" fill="#FFCB3E" stroke="#D69A1C" stroke-width="1.2" stroke-linejoin="round"/>'), 12, 3];
  if (k === 'lettuce') return [svg(84, 10, '<path d="M1 7q5-8 10 0t10 0 10 0 10 0 10 0 10 0 10 0 10 0q2 2-1 2H2q-3 0-1-2z" fill="#7CC95B" stroke="#4A9735" stroke-width="1.2"/>'), 10, 4];
  if (k === 'tomato') return [svg(84, 8, [3, 30, 57].map(x => `<rect x="${x}" y="1" width="24" height="6" rx="3" fill="#E5484D" stroke="#A82E33" stroke-width="1.2"/><rect x="${x + 5}" y="3" width="14" height="1.6" rx=".8" fill="#FF9C8F"/>`).join('')), 8, 4];
  if (k === 'onion') return [svg(84, 7, [14, 42, 70].map(x => `<ellipse cx="${x}" cy="3.5" rx="12" ry="2.6" fill="#FBF3FF" stroke="#B57AD0" stroke-width="1.4"/>`).join('')), 7, 3];
  if (k === 'pickle') return [svg(84, 7, [5, 24, 43, 62].map(x => `<rect x="${x}" y="1" width="17" height="5" rx="2.5" fill="#9CC23E" stroke="#5E8A1F" stroke-width="1.2"/>`).join('')), 7, 3];
  if (k === 'bacon') return [svg(84, 9, '<path d="M2 5q5-5 10 0t10 0 10 0 10 0 10 0 10 0 10 0 10 0" fill="none" stroke="#B5382E" stroke-width="6" stroke-linecap="round"/><path d="M2 5q5-5 10 0t10 0 10 0 10 0 10 0 10 0 10 0 10 0" fill="none" stroke="#F3B4A4" stroke-width="1.6" stroke-linecap="round"/>'), 9, 4];
  if (k === 'egg') return [svg(84, 11, '<path d="M6 9q-4-4 6-5 8-3 30-3t30 3q10 1 6 5-2 2-36 2T6 9z" fill="#FFFDF5" stroke="#D9CFB4" stroke-width="1.2"/><ellipse cx="42" cy="4.5" rx="10" ry="4" fill="#FFB52E" stroke="#DB8A12" stroke-width="1.2"/>'), 11, 5];
  if (k === 'jalapeno') return [svg(84, 7, [10, 26, 42, 58, 74].map(x => `<ellipse cx="${x}" cy="3.5" rx="6.5" ry="2.6" fill="#D7EFA8" stroke="#3E8E3A" stroke-width="2"/>`).join('')), 7, 3];
  if (k === 'avocado') return [svg(84, 8, [4, 24, 44, 64].map(x => `<path d="M${x} 6q8-9 16 0z" fill="#CDE08A" stroke="#6E9A3A" stroke-width="1.3"/>`).join('')), 8, 4];
  const c = SAUCE_COL[k] || '#888', w = (L.n || 1) > 1 ? 4.6 : 3;
  return [svg(84, 9, `<path d="M4 3q5 4 10 0t10 0 10 0 10 0 10 0 10 0 10 0 6 0" fill="none" stroke="${c}" stroke-width="${w}" stroke-linecap="round"/>` + ((L.n || 1) > 1 ? `<path d="M14 4v4M40 4v5M66 4v4" stroke="${c}" stroke-width="3" stroke-linecap="round"/>` : '') + (k === 'mayo' ? '<path d="M4 3q5 4 10 0t10 0 10 0 10 0 10 0 10 0 10 0 6 0" fill="none" stroke="#D9C9A0" stroke-width=".8"/>' : '')), 9, 2];
}
// 위에서 본 작은 그림(주문표·재료통)
const ICON = {
  bun_b: '<path d="M3 9h18a1 1 0 0 1 1 1v2a5 5 0 0 1-5 5H7a5 5 0 0 1-5-5v-2a1 1 0 0 1 1-1z" fill="#E3A557" stroke="#A66E2C" stroke-width="1.3"/><rect x="4" y="9.6" width="16" height="2.4" rx="1.2" fill="#F8E2AE"/>',
  bun_t: '<path d="M2 16c0-7 4-11 10-11s10 4 10 11c0 1-1 2-2 2H4c-1 0-2-1-2-2z" fill="#E9A450" stroke="#A66E2C" stroke-width="1.3"/><ellipse cx="8" cy="11" rx="1.3" ry=".8" fill="#FFF3D0"/><ellipse cx="13" cy="9" rx="1.3" ry=".8" fill="#FFF3D0"/><ellipse cx="16" cy="13" rx="1.3" ry=".8" fill="#FFF3D0"/>',
  beef: '<ellipse cx="12" cy="12" rx="10" ry="8" fill="#8E5C3B" stroke="#5C3B27" stroke-width="1.4"/><path d="M7 9l4 6M12 8l4 7" stroke="#5C3B27" stroke-width="1.5" stroke-linecap="round"/>',
  rawbeef: '<ellipse cx="12" cy="12" rx="10" ry="8" fill="#F0A0A6" stroke="#C9606E" stroke-width="1.4"/><circle cx="8" cy="10" r="1.2" fill="#FBD5D8"/><circle cx="14" cy="14" r="1.4" fill="#FBD5D8"/><circle cx="15" cy="9" r="1" fill="#FBD5D8"/>',
  chicken: '<path d="M4 13c-2-5 3-9 8-8s10 3 8 8-6 7-9 6-6-2-7-6z" fill="#EDB851" stroke="#B57A22" stroke-width="1.4"/><circle cx="9" cy="10" r="1" fill="#FFF0C0"/><circle cx="14" cy="13" r="1" fill="#FFF0C0"/><circle cx="13" cy="8.5" r=".9" fill="#FFF0C0"/>',
  shrimp: '<path d="M17 6a7 7 0 1 0 2 9" fill="none" stroke="#F58A66" stroke-width="5" stroke-linecap="round"/><path d="M17 6a7 7 0 1 0 2 9" fill="none" stroke="#FFD2BF" stroke-width="1.2" stroke-dasharray="1.5 3"/><path d="M19 15l3 3M19 15l0 4" stroke="#E0603A" stroke-width="1.6" stroke-linecap="round"/>',
  potato: '<ellipse cx="12" cy="12.5" rx="9.5" ry="7" fill="#D9B26A" stroke="#9A7434" stroke-width="1.4"/><circle cx="8" cy="11" r=".9" fill="#9A7434"/><circle cx="14" cy="14" r=".9" fill="#9A7434"/><circle cx="15" cy="10" r=".8" fill="#9A7434"/>',
  fries: '<path d="M7 3v9M10.5 2v10M14 3v9M17 4v8" stroke="#F4C542" stroke-width="2.6" stroke-linecap="round"/><path d="M5 10h14l-2 11H7z" fill="#E5484D" stroke="#A82E33" stroke-width="1.3" stroke-linejoin="round"/><circle cx="12" cy="15.5" r="2.2" fill="#FFD75E"/>',
  cheese: '<path d="M12 3l9 9-9 9-9-9z" fill="#FFCB3E" stroke="#D69A1C" stroke-width="1.4" stroke-linejoin="round"/><circle cx="10" cy="11" r="1.4" fill="#F0A91C"/><circle cx="14" cy="14" r="1.1" fill="#F0A91C"/>',
  lettuce: '<path d="M4 13c-3-5 2-8 5-7 1-3 6-3 7 0 4-1 7 3 4 7 1 4-4 6-7 4-3 2-8 0-9-4z" fill="#7CC95B" stroke="#4A9735" stroke-width="1.3"/><path d="M12 8v9M8 11l4 3 4-3" fill="none" stroke="#4A9735" stroke-width="1"/>',
  tomato: '<circle cx="12" cy="12" r="9" fill="#E5484D" stroke="#A82E33" stroke-width="1.4"/><circle cx="12" cy="12" r="5.6" fill="none" stroke="#FF9C8F" stroke-width="1.3"/><path d="M12 6.4v11.2M6.4 12h11.2" stroke="#FF9C8F" stroke-width="1.1"/>',
  onion: '<circle cx="12" cy="12" r="9" fill="#FBF3FF" stroke="#B57AD0" stroke-width="1.6"/><circle cx="12" cy="12" r="5.5" fill="none" stroke="#B57AD0" stroke-width="1.3"/><circle cx="12" cy="12" r="2.2" fill="none" stroke="#B57AD0" stroke-width="1.1"/>',
  pickle: '<circle cx="8.5" cy="13.5" r="6" fill="#9CC23E" stroke="#5E8A1F" stroke-width="1.3"/><circle cx="16" cy="9.5" r="5.2" fill="#AFD24E" stroke="#5E8A1F" stroke-width="1.3"/><circle cx="8.5" cy="13.5" r="2.4" fill="#D3E88E"/><circle cx="16" cy="9.5" r="2" fill="#D3E88E"/>',
  bacon: '<path d="M4 7q3-3 6 0t6 0 4 0M4 12q3-3 6 0t6 0 4 0M4 17q3-3 6 0t6 0 4 0" fill="none" stroke="#B5382E" stroke-width="3.6" stroke-linecap="round"/><path d="M4 12q3-3 6 0t6 0 4 0" fill="none" stroke="#F3B4A4" stroke-width="1.1"/>',
  egg: '<path d="M4 13c-2-5 3-9 7-8 4-2 10 1 9 6 1 5-4 8-8 7-4 1-7-1-8-5z" fill="#FFFDF5" stroke="#D9CFB4" stroke-width="1.3"/><circle cx="12" cy="12" r="4" fill="#FFB52E" stroke="#DB8A12" stroke-width="1.2"/>',
  jalapeno: '<circle cx="12" cy="12" r="8.5" fill="#D7EFA8" stroke="#3E8E3A" stroke-width="2.6"/><circle cx="9.5" cy="10.5" r="1.1" fill="#F3E9B0"/><circle cx="14" cy="10" r="1.1" fill="#F3E9B0"/><circle cx="12" cy="14.5" r="1.1" fill="#F3E9B0"/>',
  avocado: '<path d="M12 2c4 0 6 5 7 9s-1 10-7 10-8-6-7-10 3-9 7-9z" fill="#CDE08A" stroke="#4E7A2A" stroke-width="1.8"/><circle cx="12" cy="14" r="3.6" fill="#8A5A34" stroke="#5E3B1E" stroke-width="1"/>',
};
SAUCES.forEach(k => { ICON[k] = `<path d="M12 3c4 6 7 9 7 12a7 7 0 0 1-14 0c0-3 3-6 7-12z" fill="${SAUCE_COL[k]}" stroke="${mixHex(SAUCE_COL[k], '#000000', 0.35)}" stroke-width="1.4"/><path d="M9 15a3 3 0 0 0 3 3" fill="none" stroke="#fff" stroke-width="1.3" stroke-linecap="round" opacity=".7"/>`; });
const icon = k => svg(24, 24, ICON[k] || '');
const bottle = k => svg(26, 86, `<path d="M11 2h4l1 12h-6z" fill="${mixHex(SAUCE_COL[k], '#ffffff', 0.25)}" stroke="#3B2618" stroke-width="1.2"/><rect x="7" y="13" width="12" height="7" rx="2" fill="#FFFDF7" stroke="#3B2618" stroke-width="1.2"/><path d="M5 26q0-6 8-6t8 6v52q0 6-8 6t-8-6z" fill="${SAUCE_COL[k]}" stroke="#3B2618" stroke-width="1.4"/><rect x="7" y="40" width="12" height="22" rx="3" fill="#FFFDF7" opacity=".9"/><path d="M8 28v46" stroke="#fff" stroke-width="1.6" opacity=".35" stroke-linecap="round"/><g transform="translate(7 45) scale(.5)">${ICON[k]}</g>`);
const stackEl = (layers, scale = 1) => { let y = 0; const box = h('div', { class: 'kb-stack' }); layers.forEach((L, i) => { const [s, , th] = layer(L); box.append(h('i', { class: 'kb-lay' + (L.fresh ? ' drop' : ''), style: { bottom: y * scale + 'px', zIndex: i + 1 }, html: s })); L.fresh = 0; y += th; }); box.dataset.h = y; return box; };
const stars = n => '★'.repeat(n) + '☆'.repeat(5 - n);

// ---------- 채점 ----------
const zoneScore = (v, z) => (v >= z[0] && v <= z[1] ? 1 : Math.max(0, 1 - (v < z[0] ? z[0] - v : v - z[1]) / 0.2));
export function judge(o, layers, carton) {
  const want = {}, got = {}, patties = [];
  o.need.forEach(e => { want[e.k] = (want[e.k] || 0) + (isSauce(e.k) ? e.n : 1); });
  layers.forEach(L => { if (L.k === 'bun_b' || L.k === 'bun_t') return; got[L.k] = (got[L.k] || 0) + (isSauce(L.k) ? Math.min(2, L.n || 1) : 1); if (isPatty(L.k)) patties.push(L); });
  let match = 0, miss = 0, extra = 0;
  for (const k of new Set([...Object.keys(want), ...Object.keys(got)])) { const w = want[k] || 0, g = got[k] || 0; match += Math.min(w, g); miss += Math.max(0, w - g); extra += Math.max(0, g - w) * (isSauce(k) ? 0.5 : 1); }
  const content = match / Math.max(1, match + miss + extra);
  let dn = 0;
  patties.forEach(L => { const z = L.k === 'beef' ? ZONE[o.done || 'medium'] : ZONE.fry, a = zoneScore(L.s[0], z), b = zoneScore(L.s[1], z); dn += Math.min(a, b) * 0.6 + (a + b) * 0.2; }); // 한쪽만 익히면 크게 깎인다
  dn = patties.length ? dn / patties.length : 0;
  let score = o.fries ? content * 0.55 + dn * 0.35 + (carton ? zoneScore(carton.q, ZONE.fry) : 0) * 0.1 : content * 0.6 + dn * 0.4;
  (o.mods || []).forEach(m => { // 손님이 콕 집어 말한 것을 어기면 더 깎는다
    const bad = m.t === 'no' ? (got[m.k] || 0) > 0 : m.t === 'add' || m.t === 'sauce' ? !(got[m.k] > 0) : m.t === 'lots' ? (got[m.k] || 0) < 2 : m.t === 'patty' ? (got.beef || 0) < (want.beef || 0) : false;
    if (bad) score -= 0.15;
  });
  score = Math.max(0, score) * (0.88 + 0.12 * Math.min(1, (o.pt / o.pat) * 2.5));
  return { score, stars: score >= 0.93 ? 5 : score >= 0.8 ? 4 : score >= 0.62 ? 3 : score >= 0.42 ? 2 : 1 };
}
// 주문표에서 어디까지 쌓았는지: need 순서대로 채워졌는지 표시
function progress(o, layers) {
  const got = {}; layers.forEach(L => { got[L.k] = (got[L.k] || 0) + (isSauce(L.k) ? (L.n || 1) : 1); });
  return o.need.map(e => { const n = isSauce(e.k) ? e.n : 1; if ((got[e.k] || 0) >= n) { got[e.k] -= n; return true; } return false; });
}

export function mount(el, ctx) {
  const KEY = 'capy.burgerShop.' + ctx.uid, PATH = 'games/burgerShop';
  let alive = true, raf = 0, P = fresh(), R = null, all = {}, ov = null, world = null, E = {}, lastT = 0, sheet = null, loaded = false, hintT = 0;
  const avail = i => MENUS[i].day <= P.day && (!MENUS[i].fry || P.up.fryer);
  const unlocked = () => { const u = { beef: 1 }; MENUS.forEach((m, i) => { if (avail(i)) m.L.forEach(k => { u[k] = 1; }); }); if (P.day >= 5) u.mustard = 1; if (P.up.fryer) u.potato = 1; return u; };
  const slotN = () => 2 + P.up.grill, basketN = () => (P.up.fryer ? 1 + P.up.basket : 0), heat = () => 1 + 0.2 * P.up.heat;
  const dayCustomers = () => Math.min(16, 2 + P.day), concurrent = () => (P.day <= 1 ? 1 : P.day <= 4 ? 2 : P.day <= 9 ? 3 : 4);

  // ---------- 저장 ----------
  const clean = r => { const f = fresh(); if (!r || typeof r !== 'object') return null; for (const k in f) if (typeof r[k] === typeof f[k]) f[k] = r[k]; f.up = { ...fresh().up, ...(r.up || {}) }; f.best = MENUS.map((_, i) => (Array.isArray(r.best) && r.best[i]) || 0); f.seen = Array.isArray(r.seen) ? r.seen : []; return f; };
  function save() { try { localStorage.setItem(KEY, JSON.stringify(P)); } catch {} ctx.store.set(PATH + '/' + ctx.uid, { ...P, at: ctx.store.now() }).catch(() => {}); }
  try { P = clean(JSON.parse(localStorage.getItem(KEY) || 'null')) || P; } catch {}
  const off = ctx.store.on(PATH, v => {
    all = v || {};
    if (!loaded) { loaded = true; const r = clean(all[ctx.uid]); if (r && (r.played > P.played || (r.played === P.played && r.total > P.total))) P = r; } // 폰을 바꿔도 이어서
    if (!ov) lobby();
  });

  // ---------- 대기 화면 ----------
  function lobby() {
    const pid = ctx.partnerId, pr = pid && clean(all[pid]);
    const line = (name, p) => h('div', { class: 'kb-me' }, h('b', null, name), h('span', null, `${p.day}일차 · ${RANKS[p.rank]}`), h('small', null, `🪙 ${p.coin.toLocaleString()} · 번 돈 ${p.total.toLocaleString()}`));
    el.replaceChildren(...[
      h('div', { class: 'kb-hero' }, h('span', { class: 'kb-hero-capy', html: capy({ color: 'brown', face: 'happy', hat: (HATS.find(x => x.kind === 'chef') || HATS[0] || {}).id }) }), h('div', null, h('b', null, '카피 버거'), h('small', null, '주문대로 굽고 쌓아서 파는 버거 가게'))),
      line('내 가게', P), pr ? line(ctx.nameOf(pid) + ' 가게', pr) : null,
      h('button', { class: 'btn primary big', onClick: open }, P.played ? `${P.day}일차 영업 시작` : '가게 열기'),
      h('p', { class: 'dim center' }, '📱 폰을 가로로 눕혀서 해요'),
      h('ul', { class: 'kb-how' }, ['생패티를 눌러 그릴에 올리고, 한 번 눌러 뒤집고, 다 익으면 눌러서 도마로', '주문표 순서대로 재료·소스를 누르고 윗빵을 덮으면 손님에게 나가요', '익힘(레어·미디엄·웰던)과 빼기·추가 주문을 잘 지킬수록 별과 돈이 올라요', '번 돈으로 상점에서 그릴·화력·튀김기를 늘려요'].map(t => h('li', null, t))),
      P.played ? h('button', { class: 'btn sm kb-reset', onClick: e => { if (e.target.dataset.sure) { P = fresh(); save(); lobby(); } else { e.target.dataset.sure = 1; e.target.textContent = '정말 처음부터? 한 번 더 누르기'; } } }, '처음부터 다시') : null].filter(Boolean));
  }

  // ---------- 주문 만들기 ----------
  function makeOrder() {
    const first = P.day === 1 && R.spawned === 0, u = unlocked();
    const list = MENUS.map((m, i) => i).filter(avail), w = list.map(i => (MENUS[i].day >= P.day - 1 ? 2.2 : 1));
    let mi = 0;
    if (!first) { let x = Math.random() * w.reduce((a, b) => a + b, 0); for (let i = 0; i < list.length; i++) { x -= w[i]; if (x <= 0) { mi = list[i]; break; } } }
    const m = MENUS[mi], need = m.L.map(k => ({ k, n: 1 })), hasBeef = m.L.includes('beef'), mods = [], cut = [];
    const done = hasBeef ? (first ? 'medium' : pick(['rare', 'medium', 'medium', 'well'])) : null;
    const nMods = first ? 0 : P.day <= 1 ? +(Math.random() < 0.4) : P.day <= 3 ? +(Math.random() < 0.7) : P.day <= 7 ? 1 + +(Math.random() < 0.4) : 1 + rnd(3);
    for (let tries = 0; mods.length < nMods && tries < 20; tries++) {
      const t = pick(['no', 'add', 'sauce', 'lots', 'patty']); if (mods.some(x => x.t === t)) continue;
      const sauces = need.filter(e => isSauce(e.k)), have = new Set(need.map(e => e.k));
      if (t === 'no') { const c = need.filter(e => TOPS.includes(e.k) && !e.add); if (!c.length) continue; const e = pick(c), at = need.indexOf(e); need.splice(at, 1); cut.push({ k: e.k, at }); mods.push({ t, k: e.k }); }
      else if (t === 'add') { const c = TOPS.filter(k => u[k] && !have.has(k) && !cut.some(x => x.k === k)); if (!c.length) continue; const k = pick(c); let at = 1; need.forEach((e, j) => { if (isPatty(e.k)) at = j + 1; }); need.splice(at, 0, { k, n: 1, add: 1 }); mods.push({ t, k }); }
      else if (t === 'sauce') { const alt = SAUCES.filter(k => u[k] && !have.has(k)); if (!sauces.length || !alt.length || mods.some(x => x.t === 'lots')) continue; const k = pick(alt); sauces[0].k = k; sauces[0].swap = 1; mods.push({ t, k }); }
      else if (t === 'lots') { if (!sauces.length || mods.some(x => x.t === 'sauce')) continue; const e = pick(sauces); e.n = 2; mods.push({ t, k: e.k }); }
      else if (t === 'patty') { if (!hasBeef || P.day < 4 || need.filter(e => e.k === 'beef').length >= 3) continue; need.splice(need.findIndex(e => e.k === 'beef') + 1, 0, { k: 'beef', n: 1, add: 1 }); mods.push({ t }); }
    }
    const fries = !!P.up.fryer && !first && Math.random() < 0.4, speech = [];
    if (done && (done !== 'medium' || Math.random() < 0.5)) speech.push(josaRo(DONE[done][0]) + ' 주세요');
    mods.forEach(x => speech.push(x.t === 'no' ? josaEun(NAME[x.k]) + ' 빼 주세요' : x.t === 'add' ? NAME[x.k] + '도 넣어 주세요' : x.t === 'sauce' ? '소스는 ' + josaRo(NAME[x.k]) + ' 주세요' : x.t === 'lots' ? NAME[x.k] + ' 듬뿍이요' : '패티 하나 더요'));
    if (fries) speech.push('감자튀김도요');
    if (!speech.length) speech.push(pick(HELLO));
    const price = (m.price + mods.filter(x => x.t === 'add').length * 5 + (mods.some(x => x.t === 'patty') ? 12 : 0) + (fries ? 20 : 0)) * (1 + 0.12 * P.up.sign);
    const pat = (58 + 7 * need.length + (fries ? 12 : 0)) * (1 + 0.15 * P.up.wait) * Math.max(0.7, 1 - 0.015 * (P.day - 1));
    return { id: ++R.seq, mi, need, cut, done, fries, mods, speech: speech.join(' · '), price: Math.round(price), pat, pt: pat, st: 'wait', slot: null, bubble: 0, res: null, resT: 0,
      cu: { color: pick(['brown', 'cream', 'choco', 'peach']), hat: Math.random() < 0.6 && HATS.length ? pick(HATS).id : null, acc: pick(['yuzu', 'flower', 'ribbon', 'towel', 'leaf', 'none']) } };
  }

  // ---------- 판 ----------
  function newRun() {
    R = { phase: 'intro', t: 0, clock: 0, seq: 0, slots: [0, 1, 2, 3, 4, 5].map(() => ({ st: 'empty' })), baskets: [{ st: 'empty' }, { st: 'empty' }], warm: [],
      boards: [{ stack: [], carton: null, o: null, serveT: 0 }, { stack: [], carton: null, o: null, serveT: 0 }], act: 0, orders: [], spawned: 0, lastSpawn: -99, dayN: dayCustomers(),
      stat: { coins: 0, stars: [] }, banner: 0, bannerI: -2, newCards: [], paused: false };
    MENUS.forEach((m, i) => { if (avail(i) && !P.seen.includes(i)) { R.newCards.push(i); P.seen.push(i); } });
  }
  const BD = () => R.boards[R.act];
  const shake = e => { if (!e) return; e.classList.remove('shake'); void e.offsetWidth; e.classList.add('shake'); sfx('miss'); };
  function pop(x, y, text, cls = '') { const p = h('div', { class: 'kb-pop ' + cls, style: { left: x + 'px', top: y + 'px' } }, text); world.append(p); setTimeout(() => p.remove(), 1500); }
  function pushLayer(L) {
    const bd = BD(), st = bd.stack;
    if (bd.serveT || st.length >= 22 || (st.length && st[st.length - 1].k === 'bun_t')) { shake(E.boards[R.act]); return false; }
    if (!st.length && L.k !== 'bun_b') st.push({ k: 'bun_b', fresh: 1 });
    L.fresh = 1; st.push(L); drawBoard(R.act); drawCards(); return true;
  }
  function tapRaw(k) {
    const u = unlocked(); if (!u[k]) return shake(E.raw[k]);
    if (k === 'beef') { const i = R.slots.findIndex((s, j) => j < slotN() && s.st === 'empty'); if (i < 0) return shake(E.raw[k]); R.slots[i] = { st: 'cook', a: 0, b: 0, flipped: false, flipT: 1 }; sfx('hang'); drawSlot(i); }
    else { const i = R.baskets.findIndex((b, j) => j < basketN() && b.st === 'empty'); if (i < 0) return shake(E.raw[k]); R.baskets[i] = { st: 'cook', item: k === 'potato' ? 'fries' : k, c: 0 }; sfx('splash'); drawBasket(i); }
  }
  function tapSlot(i) {
    const s = R.slots[i]; if (s.st !== 'cook' || s.flipT < 1) return;
    if (!s.flipped) { s.flipped = true; s.flipT = 0; sfx('flip'); return drawSlot(i); }
    if (s.a > BURN || s.b > BURN) { R.slots[i] = { st: 'empty' }; sfx('bad'); pop(...E.slotXY[i], '탔어요!', 'bad'); return drawSlot(i); }
    if (pushLayer({ k: 'beef', s: [s.a, s.b] })) { R.slots[i] = { st: 'empty' }; sfx('tock'); drawSlot(i); }
  }
  function tapBasket(i) { const b = R.baskets[i]; if (b.st !== 'cook') return; b.st = 'up'; b.upT = 0; sfx('jump'); drawBasket(i); }
  function finishBasket(i) {
    const b = R.baskets[i]; R.baskets[i] = { st: 'empty' };
    if (b.c > BURN) { sfx('bad'); pop(E.basketXY[i][0], E.basketXY[i][1], '탔어요!', 'bad'); }
    else if (b.item === 'fries') { for (let k = 0; k < 3 && R.warm.length < 9; k++) R.warm.push(b.c); sfx('pop'); drawWarm(); }
    else if (!pushLayer({ k: b.item, s: [b.c, b.c] })) { R.baskets[i] = { ...b, st: 'cook' }; } // 도마에 못 올리면 그대로 둔다
    drawBasket(i);
  }
  function tapTop(k) { if (!unlocked()[k]) return shake(E.pans[k]); if (pushLayer({ k })) sfx('pop'); }
  function tapSauce(k) {
    if (!unlocked()[k]) return shake(E.bottles[k]);
    const bd = BD(), st = bd.stack, top = st[st.length - 1];
    if (top && top.k === k && (top.n || 1) < 3 && !bd.serveT) { top.n = (top.n || 1) + 1; top.fresh = 1; sfx('jump'); drawBoard(R.act); return drawCards(); }
    if (pushLayer({ k, n: 1 })) sfx('jump');
  }
  function tapBuns() {
    const bd = BD(), st = bd.stack;
    if (!st.length) { if (pushLayer({ k: 'bun_b' })) sfx('tock'); return; }
    if (st.length < 2 || st[st.length - 1].k === 'bun_t' || !(bd.o && bd.o.st === 'wait')) return shake(E.buns);
    if (pushLayer({ k: 'bun_t' })) { sfx('tock'); bd.serveT = 0.45; } // 윗빵을 덮으면 잠깐 보여 주고 나간다
  }
  function tapWarm() { const bd = BD(); if (!R.warm.length) return shake(E.warm); if (bd.carton) return; bd.carton = { q: R.warm.shift() }; sfx('pop'); drawWarm(); drawBoard(R.act); drawCards(); }
  function tapTrash() { const bd = BD(); if ((!bd.stack.length && !bd.carton) || bd.serveT) return; bd.stack = []; bd.carton = null; sfx('miss'); drawBoard(R.act); drawCards(); }
  function tapBoard(i) { if (R.act === i) return; R.act = i; sfx('tock'); drawBoards(); drawCards(); }
  function serve(bi) {
    const bd = R.boards[bi], o = bd.o; bd.serveT = 0;
    if (!o || o.st !== 'wait') { bd.stack = []; return drawBoard(bi); }
    const c = o.fries && bd.carton ? bd.carton : null, res = judge(o, bd.stack, c);
    const pay = Math.round(o.price * (0.25 + 0.15 * res.stars)) + (res.stars === 5 ? Math.round(o.price * 0.2) : 0);
    P.coin += pay; P.total += pay; R.stat.coins += pay; R.stat.stars.push(res.stars); if (res.stars > P.best[o.mi]) P.best[o.mi] = res.stars;
    o.st = 'done'; o.resT = 2; o.res = { stars: res.stars, pay }; bd.stack = []; if (c) bd.carton = null;
    pop(E.boardX[bi], 250, WORDS[res.stars], res.stars >= 4 ? 'good' : res.stars === 3 ? '' : 'bad'); pop(E.boardX[bi], 282, '+' + pay + ' 🪙', 'coin');
    sfx(res.stars >= 4 ? 'pair' : res.stars === 3 ? 'coin' : 'bad'); if (res.stars >= 3) setTimeout(() => sfx('coin'), 350);
    save(); hud(); drawBoard(bi); drawCards();
  }
  function endDay() {
    R.phase = 'end'; const day = P.day; P.day++; P.played++; const old = P.rank; P.rank = Math.max(P.rank, rankOf(P.total)); save(); sfx('win');
    const st = R.stat.stars, avg = st.length ? st.reduce((a, b) => a + b, 0) / st.length : 0;
    showSheet('end', { day, avg, coins: R.stat.coins, rankUp: P.rank > old });
  }

  function update(dt) {
    R.t += dt; const hm = heat();
    R.slots.forEach(s => { if (s.st !== 'cook') return; if (s.flipT < 1) s.flipT = Math.min(1, s.flipT + dt / 0.35); const r = 0.11 * hm * dt; if (!s.flipped) s.a += r; else if (s.flipT > 0.5) s.b += r; });
    R.baskets.forEach((b, i) => { if (b.st === 'cook') b.c += 0.1 * hm * dt; else if (b.st === 'up') { b.upT += dt; if (b.upT > 0.45) finishBasket(i); } });
    R.boards.forEach((bd, bi) => { if (bd.serveT > 0) { bd.serveT -= dt; if (bd.serveT <= 0) serve(bi); } });
    if (R.phase === 'intro') {
      R.banner += dt; const i = R.banner < 1.4 ? -1 : Math.floor((R.banner - 1.4) / 2);
      if (i !== R.bannerI) { R.bannerI = i; if (i >= R.newCards.length) { R.phase = 'play'; R.clock = 0; E.banner.replaceChildren(); E.banner.hidden = true; } else drawBanner(i); }
    }
    if (R.phase === 'play') {
      R.clock += dt;
      const active = R.orders.filter(o => o.st === 'wait').length, gap = Math.max(5, 13 - P.day * 0.45);
      if (R.spawned < R.dayN && R.orders.length < concurrent() && ((active === 0 && R.clock - R.lastSpawn > 1.2) || R.clock - R.lastSpawn > gap)) { R.orders.push(makeOrder()); R.spawned++; R.lastSpawn = R.clock; sfx('point'); hud(); drawCards(); }
    }
    let redraw = false;
    R.boards.forEach((bd, bi) => { // 빈 도마에 줄 선 손님을 앉힌다
      if (bd.o && !R.orders.includes(bd.o)) { bd.o = null; redraw = true; }
      if (bd.o) return;
      const o = R.orders.find(x => x.st === 'wait' && x.slot == null); if (o) { bd.o = o; o.slot = bi; o.bubble = 3.2 + o.speech.length * 0.07; redraw = true; }
    });
    const cur = BD().o, other = R.boards[1 - R.act].o; // 지금 도마에 손님이 없으면 손님 있는 도마로
    if ((!cur || cur.st !== 'wait') && other && other.st === 'wait' && !BD().stack.length) { R.act = 1 - R.act; drawBoards(); redraw = true; }
    for (let i = R.orders.length - 1; i >= 0; i--) {
      const o = R.orders[i];
      if (o.bubble > 0) { o.bubble -= dt; if (o.bubble <= 0) redraw = true; }
      if (o.st === 'wait') { o.pt -= o.slot != null ? dt : dt * 0.4; if (o.pt <= 0) { o.st = 'gone'; o.resT = 1.6; o.res = { stars: 0, pay: 0 }; R.stat.stars.push(0); sfx('bad'); redraw = true; } }
      else { o.resT -= dt; if (o.resT <= 0) { R.orders.splice(i, 1); hud(); redraw = true; } }
    }
    if (redraw) drawCards();
    if (R.phase === 'play' && R.spawned >= R.dayN && !R.orders.length && !R.boards.some(b => b.serveT > 0)) endDay();
  }

  // ---------- 화면 ----------
  const tap = fn => ({ onPointerdown: e => { e.preventDefault(); if (R && !R.paused && !sheet && R.phase !== 'end') fn(); } });
  const at = (x, y, w, hh) => ({ left: x + 'px', top: y + 'px', width: w + 'px', height: hh + 'px' });
  function open() {
    newRun(); E = {};
    world = h('div', { class: 'kb-world' });
    ov = h('div', { class: 'kb-ov' }, world); document.body.append(ov); document.body.classList.add('kb-on');
    scene(); fit(); window.addEventListener('resize', fit); lastT = 0; raf = requestAnimationFrame(loop);
  }
  function close() {
    cancelAnimationFrame(raf); window.removeEventListener('resize', fit); document.body.classList.remove('kb-on');
    if (ov) ov.remove(); ov = world = sheet = null; R = null; save(); if (alive) lobby();
  }
  function fit() { if (!world) return; const W = window.innerWidth, H = window.innerHeight, rot = W < H, s = rot ? Math.min(H / 800, W / 400) : Math.min(W / 800, H / 400); world.style.transform = `translate(-50%,-50%) ${rot ? 'rotate(90deg) ' : ''}scale(${s})`; }
  function scene() {
    const u = unlocked();
    E.hud = h('div', { class: 'kb-hud' }); E.cards = [0, 1].map(i => h('div', { class: 'kb-card', style: at(8, 38 + i * 50, 684, 46), ...tap(() => tapBoard(i)) })); E.queue = h('div', { class: 'kb-queue', style: at(698, 38, 94, 96) });
    E.raw = {}; const raws = ['beef', 'chicken', 'shrimp', 'potato'].map((k, i) => (E.raw[k] = h('button', { class: 'kb-tray' + (u[k] ? '' : ' off'), 'data-k': k, style: at(8, 148 + i * 62, 84, 54), ...tap(() => tapRaw(k)) },
      u[k] ? [0, 1, 2].map(() => h('i', { html: icon(k === 'beef' ? 'rawbeef' : k) })) : h('b', null, '🔒'), h('small', null, k === 'beef' ? '생패티' : NAME[k]))));
    E.fryer = h('div', { class: 'kb-fryer' + (P.up.fryer ? '' : ' off'), style: at(100, 148, 132, 164) }, P.up.fryer ? null : h('b', null, '🔒 튀김기'));
    E.baskets = [0, 1].map(i => h('button', { class: 'kb-basket', hidden: i >= basketN(), style: at(108 + i * 62, 160, 54, 140), ...tap(() => tapBasket(i)) })); E.basketXY = [[135, 150], [197, 150]];
    E.warm = h('button', { class: 'kb-warm', hidden: !P.up.fryer, style: at(100, 320, 132, 68), ...tap(tapWarm) });
    E.slots = [0, 1, 2, 3, 4, 5].map(i => h('button', { class: 'kb-slot' + (i < slotN() ? '' : ' off'), 'data-i': i, style: at(250 + (i % 3) * 66, 160 + Math.floor(i / 3) * 74, 62, 68), ...tap(() => tapSlot(i)) })); E.slotXY = E.slots.map((_, i) => [281 + (i % 3) * 66, 170 + Math.floor(i / 3) * 74]);
    E.trash = h('button', { class: 'kb-trash', style: at(246, 322, 46, 66), ...tap(tapTrash), html: svg(46, 66, '<path d="M8 20h30l-3 40a4 4 0 0 1-4 4H15a4 4 0 0 1-4-4z" fill="#AEB4BD" stroke="#5A5F68" stroke-width="2"/><path d="M16 28v28M23 28v28M30 28v28" stroke="#7C838D" stroke-width="2.4" stroke-linecap="round"/><rect x="4" y="13" width="38" height="8" rx="3" fill="#C9CED6" stroke="#5A5F68" stroke-width="2"/><rect x="17" y="7" width="12" height="7" rx="3" fill="none" stroke="#5A5F68" stroke-width="2.4"/>') });
    E.buns = h('button', { class: 'kb-buns', style: at(462, 148, 178, 58), ...tap(tapBuns) }, [0, 1, 2, 3].map(() => h('i', { html: icon('bun_t') })));
    E.boardX = [512, 604]; E.boards = [0, 1].map(i => h('button', { class: 'kb-board', 'data-i': i, style: at(E.boardX[i] - 46, 212, 92, 180), ...tap(() => tapBoard(i)) }));
    E.pans = {}; const pans = TOPS.map((k, i) => (E.pans[k] = h('button', { class: 'kb-pan' + (u[k] ? '' : ' off'), 'data-k': k, style: at(650 + (i % 3) * 48, 148 + Math.floor(i / 3) * 50, 44, 46), ...tap(() => tapTop(k)) }, u[k] ? h('i', { html: icon(k) }) : null)));
    E.bottles = {}; const bottles = SAUCES.map((k, i) => (E.bottles[k] = h('button', { class: 'kb-bottle' + (u[k] ? '' : ' off'), 'data-k': k, style: at(652 + i * 28, 304, 26, 86), ...tap(() => tapSauce(k)), html: bottle(k) })));
    E.banner = h('div', { class: 'kb-banner' }); E.pause = h('div', { class: 'kb-paused', hidden: true }, '❚❚ 잠깐 멈춤', h('small', null, '화면을 누르면 계속'));
    E.pause.addEventListener('pointerdown', () => { R.paused = false; E.pause.hidden = true; });
    world.replaceChildren(h('div', { class: 'kb-wall' }, h('span', { class: 'kb-sign' }, RANKS[P.rank])), h('div', { class: 'kb-counter' }), E.hud, ...E.cards, E.queue, ...raws, E.fryer, ...E.baskets, E.warm,
      h('div', { class: 'kb-grill', style: at(240, 148, 212, 164) }), ...E.slots, E.trash, E.buns, ...E.boards, ...pans, ...bottles, E.banner, E.pause);
    hud(); drawCards(); drawBoards(); drawWarm(); R.slots.forEach((_, i) => drawSlot(i)); R.baskets.forEach((_, i) => drawBasket(i));
  }
  function hud() {
    if (!E.hud) return;
    E.hud.replaceChildren(h('span', { class: 'kb-stat' }, '🪙 ', h('b', null, P.coin.toLocaleString())), h('span', { class: 'kb-stat' }, h('b', null, P.day + '일차')), h('span', { class: 'kb-stat' }, '👥 ', h('b', null, `${R.stat.stars.length}/${R.dayN}`)), h('span', { class: 'kb-sp' }),
      h('button', { class: 'kb-pill', onClick: () => showSheet('shop') }, '🛒 상점', UPS.some(canBuy) ? h('i', { class: 'kb-dot' }) : null), h('button', { class: 'kb-pill', onClick: () => showSheet('book') }, '📖 메뉴'),
      h('button', { class: 'kb-pill', 'aria-label': '일시정지', onClick: () => { R.paused = true; E.pause.hidden = false; } }, '❚❚'), h('button', { class: 'kb-pill', 'aria-label': '나가기', onClick: () => showSheet('quit') }, '✕'));
  }
  const faceOf = o => (o.st === 'done' ? (o.res.stars >= 4 ? 'love' : o.res.stars >= 3 ? 'happy' : 'sad') : o.st === 'gone' ? 'sad' : o.pt / o.pat < 0.3 ? 'sad' : o.pt / o.pat < 0.6 ? 'smile' : 'happy');
  const head = o => h('span', { class: 'kb-cu', html: capy({ color: o.cu.color, hat: o.cu.hat, acc: o.cu.acc, face: faceOf(o), head: true }) });
  function drawCards() {
    if (!E.cards) return;
    E.cards.forEach((c, i) => {
      const bd = R.boards[i], o = bd.o; c.className = 'kb-card' + (R.act === i ? ' act' : '') + (o ? '' : ' empty'); c._o = o;
      if (!o) return c.replaceChildren(h('b', { class: 'kb-no' }, i ? '②' : '①'));
      const m = MENUS[o.mi], kids = [h('b', { class: 'kb-no' }, i ? '②' : '①'), head(o), h('div', { class: 'kb-who' }, h('b', null, m.n), o.done ? h('em', { style: { background: DONE[o.done][1] } }, DONE[o.done][0]) : h('em', { class: 'fry' }, '튀김'), h('i', { class: 'kb-pat' }, h('u')))];
      if (o.st !== 'wait') kids.push(h('div', { class: 'kb-res' + (o.res.stars >= 4 ? ' good' : o.res.stars >= 3 ? '' : ' bad') }, o.st === 'gone' ? '너무 오래 기다렸어요…' : [h('span', null, stars(o.res.stars)), h('b', null, WORDS[o.res.stars]), h('em', null, '+' + o.res.pay + ' 🪙')]));
      else {
        const pg = progress(o, bd.stack), has = k => bd.stack.some(L => L.k === k), chips = [['bun_b', has('bun_b'), '']];
        let next = has('bun_b') ? -1 : 0;
        o.need.forEach((e, j) => { o.cut.filter(x => x.at === j).forEach(x => chips.push([x.k, false, 'cut'])); chips.push([e.k, pg[j], (e.add ? ' add' : '') + (e.swap ? ' swap' : '') + (e.n > 1 ? ' lots' : '')]); });
        o.cut.filter(x => x.at >= o.need.length).forEach(x => chips.push([x.k, false, 'cut']));
        chips.push(['bun_t', has('bun_t'), '']); if (o.fries) chips.push(['fries', !!bd.carton, ' add']);
        if (next < 0) next = chips.findIndex(([, ok, cls]) => !ok && cls !== 'cut');
        kids.push(h('div', { class: 'kb-chips' + (chips.length > 11 ? ' many' : '') }, chips.map(([k, ok, cls], j) => h('span', { class: 'kb-chip ' + cls + (ok ? ' ok' : '') + (j === next ? ' next' : '') }, h('i', { html: icon(k) }), h('small', null, NAME[k])))));
        if (o.bubble > 0) kids.push(h('div', { class: 'kb-say' }, o.speech));
      }
      c.replaceChildren(...kids);
    });
    const q = R.orders.filter(o => o.slot == null && o.st === 'wait'); E.queue.replaceChildren(...q.map(o => { const d = h('div', { class: 'kb-q' }, head(o), h('i', { class: 'kb-pat' }, h('u'))); d._o = o; return d; }));
  }
  function drawBoard(i) {
    const b = E.boards[i], bd = R.boards[i]; b.classList.toggle('act', R.act === i);
    const st = stackEl(bd.stack), hh = +st.dataset.h; if (hh > 150) st.style.transform = `scale(${150 / hh})`;
    b.replaceChildren(...[h('span', { class: 'kb-wood' }, h('b', null, i ? '②' : '①')), st, bd.carton && h('i', { class: 'kb-carton', html: icon('fries') })].filter(Boolean));
  }
  const drawBoards = () => [0, 1].forEach(drawBoard);
  function drawSlot(i) {
    const e = E.slots[i], s = R.slots[i]; if (s.st !== 'cook') return e.replaceChildren();
    e.replaceChildren(h('span', { class: 'kb-patty' + (s.flipT < 1 ? ' flip' : '') }), h('i', { class: 'kb-gz beef' }, h('u')));
  }
  function drawBasket(i) {
    const e = E.baskets[i], b = R.baskets[i]; e.className = 'kb-basket' + (b.st === 'cook' ? ' in' : b.st === 'up' ? ' up' : '');
    e.replaceChildren(...[h('span', { class: 'kb-net' }, b.st === 'empty' ? null : h('i', { html: icon(b.item) })), b.st !== 'empty' && h('i', { class: 'kb-gz fryz' }, h('u'))].filter(Boolean));
  }
  function drawWarm() { if (E.warm) E.warm.replaceChildren(h('small', null, '감자튀김'), ...R.warm.slice(0, 6).map(() => h('i', { html: icon('fries') }))); }
  function drawBanner(i) {
    E.banner.hidden = false;
    if (i < 0) return E.banner.replaceChildren(h('b', { class: 'kb-day' }, P.day + '일차'), h('small', null, `오늘 손님 ${R.dayN}명`));
    const m = MENUS[R.newCards[i]]; sfx('pair');
    E.banner.replaceChildren(h('em', null, '새 메뉴'), h('div', { class: 'kb-newburger' }, stackEl([{ k: 'bun_b' }, ...m.L.map(k => ({ k, n: 1, s: [0.9, 0.9] })), { k: 'bun_t' }])), h('b', null, m.n));
  }
  // 첫 이틀은 다음에 누를 곳을 노랗게 알려 준다
  function hint() {
    world.querySelectorAll('.hint').forEach(e => e.classList.remove('hint'));
    if (P.day > 2 || R.phase !== 'play') return; const bd = BD(), o = bd.o; if (!o || o.st !== 'wait' || bd.serveT) return;
    const pg = progress(o, bd.stack), j = pg.indexOf(false), z = ZONE[o.done || 'medium']; let t = null;
    if (j < 0) t = bd.stack.some(L => L.k === 'bun_t') ? null : E.buns;
    else { const k = o.need[j].k;
      if (k === 'beef') { const ready = R.slots.findIndex(s => s.st === 'cook' && s.flipT >= 1 && ((!s.flipped && s.a >= z[0]) || (s.flipped && s.b >= z[0]))); t = ready >= 0 ? E.slots[ready] : R.slots.some(s => s.st === 'cook') ? null : E.raw.beef; }
      else if (FRIED[k]) { const ready = R.baskets.findIndex(b => b.st === 'cook' && b.item === k && b.c >= ZONE.fry[0]); t = ready >= 0 ? E.baskets[ready] : R.baskets.some(b => b.item === k) ? null : E.raw[k]; }
      else t = E.pans[k] || E.bottles[k]; }
    if (t) t.classList.add('hint');
  }
  function paint() { // 매 프레임: 굽기 눈금·패티 색·손님 인내심
    R.slots.forEach((s, i) => { if (s.st !== 'cook') return; const e = E.slots[i], p = e.firstChild, g = e.lastChild.firstChild; if (!p) return;
      const up = s.flipped ? s.a : s.b, dn = s.flipped ? s.b : s.a; p.style.background = beefCol(up); p.style.boxShadow = `0 4px 0 ${beefCol(dn)}, 0 6px 4px rgba(0,0,0,.45)`; p.classList.toggle('flip', s.flipT < 1); g.style.left = Math.min(100, dn / GMAX * 100) + '%'; e.classList.toggle('burn', dn > 1.35); });
    R.baskets.forEach((b, i) => { if (b.st === 'empty') return; const e = E.baskets[i], g = e.querySelector('.kb-gz u'), ic = e.querySelector('.kb-net i'); if (g) g.style.left = Math.min(100, b.c / GMAX * 100) + '%'; if (ic) ic.style.filter = b.c > 1.25 ? `brightness(${Math.max(0.3, 1 - (b.c - 1.25) * 1.6)})` : b.c < 0.75 ? `saturate(${0.5 + b.c * 0.66})` : ''; e.classList.toggle('burn', b.c > 1.25); });
    world.querySelectorAll('.kb-pat').forEach(bar => { const o = (bar.closest('.kb-card') || bar.closest('.kb-q') || {})._o; if (!o) return; const r = Math.max(0, o.pt / o.pat); bar.firstChild.style.width = r * 100 + '%'; bar.firstChild.style.background = r > 0.5 ? '#57C26B' : r > 0.25 ? '#F0B429' : '#E5484D'; });
  }
  function loop(ts) {
    if (!ov) return; raf = requestAnimationFrame(loop);
    const dt = Math.min(0.1, lastT ? (ts - lastT) / 1000 : 0); lastT = ts;
    if (R.paused || sheet || R.phase === 'end' || document.hidden) return;
    update(dt); if (!R || !ov) return; paint(); hintT += dt; if (hintT > 0.25) { hintT = 0; hint(); }
  }

  // ---------- 상점·메뉴판·하루 끝 ----------
  const canBuy = up => { const lv = P.up[up.id]; return lv < up.cost.length && P.coin >= up.cost[lv] && (!up.req || P.up[up.req]); };
  function buy(up) { if (!canBuy(up)) return sfx('miss'); P.coin -= up.cost[P.up[up.id]]; P.up[up.id]++; save(); sfx('coin'); const from = sheet && sheet._from; scene(); showSheet('shop', from); }
  function hideSheet() { if (sheet) sheet.remove(); sheet = null; lastT = 0; }
  function showSheet(kind, data) {
    hideSheet(); let body;
    const closeBtn = h('button', { class: 'kb-x', onClick: () => (data && data.day ? showSheet('end', data) : hideSheet()) }, '✕'), coin = h('span', { class: 'kb-stat' }, '🪙 ', h('b', null, P.coin.toLocaleString()));
    if (kind === 'shop') {
      const nextAt = RANK_AT[P.rank + 1];
      body = [h('div', { class: 'kb-shead' }, h('h2', null, '상점'), coin, closeBtn),
        h('div', { class: 'kb-rank' }, h('span', null, '🏪'), h('div', null, h('b', null, RANKS[P.rank]), h('i', null, h('u', { style: { width: (nextAt ? Math.min(1, (P.total - RANK_AT[P.rank]) / (nextAt - RANK_AT[P.rank])) : 1) * 100 + '%' } }))), h('small', null, nextAt ? `${P.total.toLocaleString()} / ${nextAt.toLocaleString()}` : '최고 등급!')),
        h('div', { class: 'kb-list' }, UPS.filter(up => !up.req || P.up[up.req]).map(up => { const lv = P.up[up.id], max = lv >= up.cost.length;
          return h('div', { class: 'kb-up' }, h('span', null, up.ic), h('div', null, h('b', null, up.n), h('small', null, `${up.d} · ${lv} / ${up.cost.length}`)), h('button', { class: 'kb-buy' + (max ? ' max' : canBuy(up) ? '' : ' no'), 'data-id': up.id, onClick: () => buy(up) }, max ? '완료' : '🪙 ' + up.cost[lv].toLocaleString())); }),
          P.day >= 7 && !P.up.fryer ? h('p', { class: 'kb-tip' }, '튀김기를 사면 새우·치킨 버거와 감자튀김 주문이 들어와요') : null)];
    } else if (kind === 'book') {
      body = [h('div', { class: 'kb-shead' }, h('h2', null, '메뉴'), coin, closeBtn),
        h('div', { class: 'kb-book' }, MENUS.map((m, i) => (avail(i)
          ? h('div', { class: 'kb-menu' }, h('div', { class: 'kb-mb' }, stackEl([{ k: 'bun_b' }, ...m.L.map(k => ({ k, n: 1, s: [0.9, 0.9] })), { k: 'bun_t' }])), h('b', null, m.n), h('small', null, '🪙 ' + m.price), h('em', null, stars(P.best[i])), h('p', null, m.L.map(k => NAME[k]).join(' · ')))
          : h('div', { class: 'kb-menu lock' }, h('b', null, '???'), h('small', null, m.day > P.day ? m.day + '일차' : '튀김기 필요')))))];
    } else if (kind === 'quit') {
      body = [h('div', { class: 'kb-endc' }, h('h2', null, '가게를 나갈까요?'), h('p', null, R.phase === 'end' ? '' : '오늘 영업은 처음부터 다시 해야 해요. 번 돈은 그대로 남아요.'), h('div', { class: 'kb-btns' }, h('button', { onClick: hideSheet }, '계속하기'), h('button', { class: 'pri', onClick: close }, '나가기')))];
    } else {
      body = [h('div', { class: 'kb-endc' }, h('h2', null, data.day + '일차 영업 끝'), h('div', { class: 'kb-estars' }, stars(Math.round(data.avg))), h('div', { class: 'kb-ecoin' }, '+' + data.coins.toLocaleString() + ' 🪙'),
        data.rankUp ? h('div', { class: 'kb-erank' }, '🎉 ' + RANKS[P.rank] + josaRoPlain(RANKS[P.rank]) + ' 승급!') : null,
        h('div', { class: 'kb-btns' }, h('button', { onClick: close }, '나가기'), h('button', { onClick: () => showSheet('shop', data) }, '🛒 상점', UPS.some(canBuy) ? h('i', { class: 'kb-dot' }) : null), h('button', { class: 'pri', 'data-next': 1, onClick: () => { hideSheet(); newRun(); scene(); } }, '다음 날')))];
    }
    sheet = h('div', { class: 'kb-sheet k-' + kind }, h('div', { class: 'kb-wrap' }, body)); sheet._from = data; world.append(sheet);
  }
  const josaRoPlain = w => ((w.charCodeAt(w.length - 1) - 0xAC00) % 28 && (w.charCodeAt(w.length - 1) - 0xAC00) % 28 !== 8 ? '으로' : '로');

  lobby();
  return () => { alive = false; off(); if (ov) close(); };
}
