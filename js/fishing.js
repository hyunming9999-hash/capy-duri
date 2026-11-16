// 바닷가 낚시 — 카피바라들의 주요 경제활동. 낚시터는 배를 타야만 갈 수 있고, 초급·중급·고급 세 구역으로 나뉜다
// 던지기(힘 조절) → 입질 기다리기 → 챔질 → 밀고 당기기(줄 팽팽함을 조절하며 감기). 물고기는 클수록 값이 나간다
import { h, toast, holdBtn } from './ui.js';
import { capy } from './capy.js';
import { sfx } from './sound.js';
import { gullSvg } from './animals.js';

export const PIRATE_EVERY = 10, PIRATE_LOOT = 600, BOAT_FIX = 300;
export const ZONES = ['', '초급 낚시터', '중급 낚시터', '고급 낚시터'];
export const RODS = [null, { t: 1, name: '초급 낚싯대', price: 500, dur: 50, fix: 150 }, { t: 2, name: '중급 낚싯대', price: 1000, dur: 100, fix: 300 }, { t: 3, name: '고급 낚싯대', price: 2000, dur: 200, fix: 600 }];
export const BAIT = 10, BALL = 10, CANNON = 500, WBOAT = 1500, PEARL_PRICE = 10000;

// 물고기 80종: [이름, 최소cm, 최대cm, 최소값, 최대값, 표시(r=귀한 것, k=대장)]
const Z1 = [['방울붕어', 6, 14, 30, 55], ['젤리멸치', 4, 9, 30, 45], ['솜사탕돔', 10, 22, 45, 80], ['별사탕피라미', 5, 11, 30, 50], ['무지개송사리', 3, 7, 30, 45], ['딸기망둥어', 7, 15, 35, 60], ['민트정어리', 9, 18, 35, 65], ['콩알복어', 5, 12, 40, 75], ['달빛은어', 12, 24, 50, 90],
  ['호두쥐치', 9, 19, 40, 75], ['레몬전어', 10, 20, 40, 70], ['꼬마해마치', 4, 10, 45, 85], ['구름빙어', 6, 13, 30, 55], ['단추가자미', 11, 23, 50, 90], ['유자고등어', 14, 28, 55, 100], ['솜털아귀', 8, 17, 45, 85], ['깨소금멸치', 3, 8, 30, 40], ['풍선개복치', 13, 26, 55, 100],
  ['조약돌망둑', 6, 12, 30, 50], ['물방울청어', 10, 21, 40, 75], ['꿀벌자리돔', 7, 14, 40, 70], ['도토리복어', 6, 13, 40, 70], ['우유갈치', 16, 30, 55, 100], ['초코미꾸리', 8, 16, 35, 60], ['반딧불전갱이', 11, 22, 50, 95]];
const Z2 = [['줄무늬방어', 30, 60, 90, 260], ['얼음연어', 35, 70, 110, 300], ['산호농어', 28, 55, 80, 240], ['호박민어', 32, 66, 100, 280], ['모래넙치', 26, 52, 70, 220], ['바람삼치', 34, 72, 110, 320], ['은하고등어', 25, 48, 70, 200], ['대나무장어', 40, 90, 120, 340], ['솔방울쏨뱅이', 22, 44, 70, 210], ['노을도미', 28, 58, 100, 300],
  ['파도숭어', 30, 62, 80, 240], ['안개대구', 36, 78, 120, 350], ['진흙메기', 30, 68, 90, 270], ['유리날치', 24, 46, 80, 230], ['가시복어', 20, 42, 90, 280], ['보라우럭', 26, 54, 90, 260], ['쌍무지개놀래기', 22, 46, 100, 300], ['나팔고기', 30, 64, 80, 250], ['꽃무늬쥐가오리', 45, 95, 140, 380], ['북소리민어', 34, 70, 110, 330],
  ['번개참치', 60, 120, 400, 500, 'r'], ['황금잉어', 50, 100, 400, 500, 'r'], ['수정돛새치', 70, 140, 410, 500, 'r'], ['달무리가오리', 65, 130, 400, 490, 'r'], ['불꽃도미', 48, 96, 400, 500, 'r']];
const Z3 = [['심해등불아귀', 70, 140, 450, 800], ['용비늘장어', 110, 220, 500, 900], ['천둥청새치', 130, 260, 550, 1000], ['유령가오리', 120, 240, 500, 950], ['강철참치', 120, 230, 550, 1000], ['화산돔', 80, 150, 450, 800], ['얼음이빨상어', 140, 280, 600, 1000], ['왕관개복치', 150, 300, 550, 1000], ['그림자곰치', 100, 200, 450, 850], ['별똥철갑상어', 130, 270, 550, 1000],
  ['은빛리본갈치', 140, 300, 500, 900], ['폭풍돛새치', 150, 290, 600, 1000], ['망치머리대왕', 140, 270, 550, 980], ['크리스탈해룡', 90, 180, 500, 950], ['흑진주농어', 80, 160, 450, 820], ['불가사리왕도미', 75, 150, 450, 800], ['번개뱀장어', 120, 250, 500, 900], ['해골복어', 60, 120, 450, 780], ['무쇠턱바라쿠다', 110, 210, 500, 920], ['달그림자만새기', 100, 200, 480, 880],
  ['거대산갈치', 200, 400, 600, 1000], ['용암쏠배감펭', 70, 140, 460, 820], ['톱날상어', 150, 300, 600, 1000], ['안개고래치', 180, 340, 600, 1000], ['황금비늘피라루쿠', 160, 320, 600, 1000], ['심연먹물치', 90, 190, 470, 860], ['천년잉어', 100, 200, 500, 950], ['오로라만타', 180, 360, 600, 1000],
  ['고래킹', 500, 900, 1400, 1500, 'k'], ['상어킹', 380, 650, 1400, 1500, 'k']];
export const FISH = [Z1, Z2, Z3].flatMap((list, zi) => list.map(([name, c0, c1, p0, p1, tag], k) => ({ id: `f${zi + 1}-${k}`, z: zi + 1, k, name, cm: [c0, c1], price: [p0, p1], rare: tag === 'r', king: tag === 'k' })));
export const TRASH = [{ id: 't0', name: '찌그러진 깡통', icon: '🥫', lose: 20 }, { id: 't1', name: '낡은 장화', icon: '🥾', lose: 30 }, { id: 't2', name: '엉킨 비닐봉지', icon: '🛍️', lose: 50 }];
const PEARL = { id: 'pearl', name: '바다 진주', pearl: true };

// 상상의 물고기 그림: 이름마다 몸 모양·색·무늬가 정해진다
const PAL = [['#FF8FA3', '#FFD6DE'], ['#7FD1F5', '#D9F2FF'], ['#FFD166', '#FFF1C2'], ['#9BE28A', '#DFF7D6'], ['#C5A3FF', '#EADFFF'], ['#FFA56B', '#FFE0C8'], ['#6FE0C8', '#D2F7EE'], ['#F5C2E7', '#FFE9F7'], ['#8FA8FF', '#DCE4FF'], ['#F2E36B', '#FFF8C4'], ['#FF7B6B', '#FFD2CB'], ['#58C7B5', '#C9F0E9']];
const DEEP = [['#5B6CFF', '#C9CFFF'], ['#7A3FC9', '#D9C2FF'], ['#D9364A', '#FFC2CA'], ['#1F8FA8', '#B8E8F2'], ['#3E4A66', '#B7C0D6'], ['#C98A00', '#FFE49A'], ['#0FA37F', '#B5F0DF'], ['#B03A8C', '#F5C2E3']];
export function fishSvg(f, big) {
  if (f.pearl) return `<svg viewBox="0 0 120 80"><ellipse cx="60" cy="58" rx="40" ry="14" fill="#F3D9E4" stroke="#C99AB0" stroke-width="2.5"/><path d="M22 54 Q60 8 98 54" fill="#FFEAF2" stroke="#C99AB0" stroke-width="2.5"/><circle cx="60" cy="50" r="15" fill="#fff" stroke="#E9C46A" stroke-width="2.5"/><circle cx="54" cy="44" r="5" fill="#FFF6D6"/><path d="M96 14l3 7 7 3-7 3-3 7-3-7-7-3 7-3z" fill="#FFE066"/></svg>`;
  if (f.icon) return `<svg viewBox="0 0 120 80"><text x="60" y="58" font-size="52" text-anchor="middle">${f.icon}</text></svg>`;
  const seed = f.k * 7 + f.z * 13, [c, l] = f.z === 3 ? DEEP[seed % DEEP.length] : f.z === 2 ? (seed % 3 ? PAL[(seed * 5) % PAL.length] : DEEP[seed % DEEP.length]) : PAL[seed % PAL.length], d = 'rgba(0,0,0,.28)';
  const eye = (x, y, r = 4.6) => `<circle cx="${x}" cy="${y}" r="${r}" fill="#fff" stroke="${d}" stroke-width="1"/><circle cx="${x + 1}" cy="${y}" r="${r * 0.55}" fill="#2E2A33"/>`;
  if (f.name === '고래킹') return `<svg viewBox="0 0 120 80"><path d="M10 44 Q12 16 52 16 Q92 16 100 40 L114 28 Q118 44 112 58 L100 50 Q88 68 52 68 Q14 68 10 44z" fill="#4C6FD9" stroke="${d}" stroke-width="2.4" stroke-linejoin="round"/><path d="M14 50 Q40 70 90 56 Q70 68 52 68 Q24 68 14 50z" fill="#DCE6FF"/>${eye(30, 40, 5)}<path d="M20 52 q10 6 20 0" fill="none" stroke="#22315F" stroke-width="2.2" stroke-linecap="round"/><path d="M44 6 l5 8 6-9 6 9 5-8 v12 h-22z" fill="#FFD75E" stroke="#C99A1E" stroke-width="1.6" stroke-linejoin="round"/><path d="M58 -2 q-8 -8 -12 0 M62 -2 q8 -8 12 0" fill="none" stroke="#9AD0F5" stroke-width="3" stroke-linecap="round"/></svg>`;
  if (f.name === '상어킹') return `<svg viewBox="0 0 120 80"><path d="M6 44 Q30 22 62 26 L72 6 L80 28 Q98 34 104 42 L116 26 Q118 46 114 62 L104 48 Q84 62 56 60 Q26 60 6 44z" fill="#6E7F99" stroke="${d}" stroke-width="2.4" stroke-linejoin="round"/><path d="M10 46 Q40 62 96 48 Q76 60 56 60 Q28 60 10 46z" fill="#EEF2F8"/>${eye(28, 38, 4.4)}<path d="M12 48 l5 6 5-6 5 6 5-6 5 6 5-6" fill="#fff" stroke="#3A4558" stroke-width="1.6" stroke-linejoin="round"/><path d="M52 36 v10 M58 37 v10 M64 38 v10" stroke="#3A4558" stroke-width="2" stroke-linecap="round"/><path d="M30 12 l5 8 6-9 6 9 5-8 v12 h-22z" fill="#FFD75E" stroke="#C99A1E" stroke-width="1.6" stroke-linejoin="round"/></svg>`;
  const shape = seed % 5, body = ['M14 40 Q34 14 68 22 Q88 28 92 40 Q88 52 68 58 Q34 66 14 40z', 'M8 40 Q30 26 76 30 Q94 34 96 40 Q94 46 76 50 Q30 54 8 40z', 'M20 40 Q22 12 56 12 Q88 12 90 40 Q88 68 56 68 Q22 68 20 40z', 'M12 40 Q40 8 74 30 Q90 36 92 40 Q90 44 74 50 Q40 72 12 40z', 'M6 40 Q22 30 44 34 Q66 24 84 34 Q94 38 96 40 Q94 44 84 46 Q66 56 44 46 Q22 50 6 40z'][shape];
  const tail = [`M90 40 L112 22 Q106 40 112 58z`, `M92 40 L114 28 L108 40 L114 52z`, `M88 40 Q104 20 114 26 Q104 40 114 54 Q104 60 88 40z`][seed % 3];
  const pat = [`<path d="M40 22 v36 M54 20 v40 M68 22 v36" stroke="${d}" stroke-width="3.4" stroke-linecap="round" opacity=".5"/>`, `${[[40, 34], [54, 46], [66, 32], [50, 28], [70, 46]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="3.2" fill="#fff" opacity=".7"/>`).join('')}`, `<path d="M22 44 Q50 58 86 44 Q60 62 40 58z" fill="${l}"/>`, `<path d="M36 26 q8 14 0 28 M52 24 q8 16 0 32 M68 26 q8 14 0 28" fill="none" stroke="#fff" stroke-width="2.6" opacity=".6"/>`][(seed >> 1) % 4];
  const fin = `<path d="M46 ${shape === 2 ? 14 : 24} q10 -16 24 -${shape === 2 ? 2 : 0} " fill="${c}" stroke="${d}" stroke-width="2" stroke-linejoin="round"/><path d="M48 50 q4 12 14 8" fill="${l}" stroke="${d}" stroke-width="1.6"/>`;
  const extra = f.rare ? `<path d="M100 10l2.500 6 6 2.500-6 2.500-2.500 6-2.500-6-6-2.500 6-2.500z" fill="#FFE066" stroke="#C99A1E" stroke-width="1"/>` : f.z === 3 ? `<path d="M16 46 l4 5 4-5 4 5 4-5" fill="#fff" stroke="${d}" stroke-width="1.2"/><path d="M30 20 l4 -10 4 9" fill="${c}" stroke="${d}" stroke-width="1.6" stroke-linejoin="round"/>` : (seed % 4 === 1 ? `<path d="M14 42 q-8 4 -8 12" fill="none" stroke="${d}" stroke-width="1.6" stroke-linecap="round"/>` : '');
  return `<svg viewBox="0 0 120 80"><path d="${tail}" fill="${c}" stroke="${d}" stroke-width="2.2" stroke-linejoin="round"/>${fin}<path d="${body}" fill="${c}" stroke="${d}" stroke-width="2.4" stroke-linejoin="round"/>${pat}${eye(26 + (shape === 1 || shape === 4 ? -4 : 0), 36)}<path d="M${shape === 4 || shape === 1 ? 10 : 16} 44 q5 3 9 0" fill="none" stroke="${d}" stroke-width="1.8" stroke-linecap="round"/>${extra}</svg>`.replace(/\.500/g, '.5');
}
const pick = a => a[Math.floor(Math.random() * a.length)], rnd = (a, b) => a + Math.random() * (b - a);
// 무엇이 물었나: 진주 차례면 진주, 가끔 쓰레기, 아니면 그 구역 물고기(귀한 것은 드물게). 한 단계 낮은 낚싯대로는 귀한 것·대장은 안 문다
export function rollCatch(zone, rodT, isPearl, power) {
  if (isPearl) return { f: PEARL, cm: 0, price: PEARL_PRICE, d: 9.5, p: power };
  if (Math.random() < [0, 0.12, 0.08, 0.05][zone] * (1 - power * 0.6)) { const t = pick(TRASH); return { f: t, cm: 0, price: -t.lose, d: 1, p: power }; }
  const under = rodT < zone, pool = FISH.filter(f => f.z === zone && !(under && (f.rare || f.king)));
  const w = pool.map(f => (f.king ? 0.25 : f.rare ? 0.45 : 1) * (f.king || f.rare ? 1 + power * 1.2 : 1)), tot = w.reduce((a, b) => a + b, 0); let r = Math.random() * tot, f = pool[0]; for (let i = 0; i < pool.length; i++) { r -= w[i]; if (r <= 0) { f = pool[i]; break; } }
  const t = Math.min(1, Math.pow(Math.random(), 1.6 - power * 0.6)), cm = Math.round((f.cm[0] + (f.cm[1] - f.cm[0]) * t) * 10) / 10; // 멀리 던질수록 큰 놈이 잘 문다
  const price = Math.round(f.price[0] + (f.price[1] - f.price[0]) * Math.pow(t, 1.3));
  const d = zone === 1 ? 1 + t * 2 : zone === 2 ? 4 + t * 2 + (f.rare ? 1 : 0) : 6.5 + t * 2 + (f.king ? 1 : 0); // 낚싯대 차이는 '끊어짐 칸을 몇 번 버티나'로 따로 매긴다
  return { f, cm, price, d, p: power };
}
// 물고기가 화내며 팔짝 뛸 때: 줄이 한순간에 확 팽팽해진다(누르고 있으면 그대로, 손을 뗐으면 절반). [초급, 중급, 고급]
const SPIKE = [0, 14, 20, 26], SPIKE_GAP = [[0, 0], [5, 8], [4, 6.5], [3, 5]], TELE = 400;
// 난이도 맞춤(가상 플레이로 맞춘 값): 보통 솜씨로 초급 낚싯대 기준 초급 35%·중급 25%·고급 15%쯤 잡히고, 낚싯대가 한 단계 좋아질 때마다 10%p쯤 오른다
// BAND_LO = 이 값부터 끊어짐 칸(80) 전까지가 '주황 칸'. 줄이 주황 칸에 있을 때 감아야 끌려온다(깊은 바다일수록 좁다)
// ZONE_TEN = 바다별로 줄이 팽팽해지는 빠르기, ZONE_REEL = 감기는 빠르기, PATIENCE = 물고기 인내심(초, 깊을수록 짧다), ROD_TEN = 좋은 낚싯대일수록 줄이 덜 팽팽해진다
const BAND_LO = [0, 45, 56, 65], ZONE_TEN = [0, 1.18, 0.9, 0.79], ZONE_REEL = [0, 1, 1.4, 2.3], PATIENCE = [0, 18, 16, 14], ROD_TEN = [1, 1, 0.91, 0.84];
export const strikesOf = () => 2;
export const weightOf = (f, cm) => (f.pearl || f.icon ? 0 : Math.max(0.01, Math.pow(cm, 3) * (f.name === '고래킹' ? 0.00003 : 0.000013)));
const kg = w => (w >= 1000 ? (w / 1000).toFixed(2) + 't' : w >= 1 ? w.toFixed(1) + 'kg' : Math.round(w * 1000) + 'g');

// ----- 낚시 화면 -----
// o = { ctx, zone, bag(), save(patch), coins(n), dex(id, cm), onClose() }
export function openFishing(o) {
  let c0 = 0, castTo = 60, flew = false, clickAt = 0, creakAt = 0, pressAt = 0, eyeAt = 0, taps = 0, pat = 0, pat0 = 1, nextSpike = 0, tele = 0;
  let alive = true, raf = 0, last = 0, phase = 'ready', power = 0, pdir = 1, t0 = 0, biteAt = 0, biteEnd = 0, nibAt = 0, cur = null, dist = 100, ten = 30, hold = false, burst = 0, nextBurst = 0, slack = 0, shown = false;
  const zone = o.zone, rodT = () => o.bag().rod || 0, rod = () => RODS[rodT()];
  const float = h('i', { class: 'fs-float' }), hook = h('i', { class: 'fs-hook' }), rl = h('div', { class: 'fs-rl', html: '<svg viewBox="0 0 100 100" preserveAspectRatio="none"><path d="" fill="none" stroke="#fff" stroke-width="1.6" vector-effect="non-scaling-stroke"/></svg>' }), fishEl = h('div', { class: 'fs-fish' }), mark = h('b', { class: 'fs-mark' });
  const me = h('div', { class: 'fs-me', html: capy(o.ctx.capyOf(o.ctx.uid, { face: 'happy' })) }), rodEl = h('i', { class: 'fs-rod' });
  // 위: 타고 온 배가 그대로 물 위에 떠 있다. 아래: 물속(구역마다 그림이 다르다)
  const surf = h('div', { class: 'fs-surf' }, rl, h('div', { class: 'fs-boat' }, me, h('div', { class: 'fs-hull', html: o.boat || '' }), rodEl), float, mark), under = h('div', { class: 'fs-under z' + zone }, hook, fishEl), msg = h('p', { class: 'fs-msg' }), bar = h('div', { class: 'fs-bar' }, h('u'), h('i')), info = h('div', { class: 'fs-info' });
  const patEl = h('div', { class: 'fs-pat', hidden: true }, h('u'), h('span', null, '🐟 물고기 인내심')), pipsEl = h('span', { class: 'fs-pips' }), gl = h('div', { class: 'fs-gl' }, h('b'), h('span')), btn = h('button', { class: 'fs-btn' }), quit = h('button', { class: 'btn sm fs-quit', onClick: () => close() }, '그만하기');
  const wrap = h('div', { class: 'fs' }, h('div', { class: 'fs-top' }, h('b', null, `🎣 ${ZONES[zone]}`), info, quit), h('div', { class: 'fs-view z' + zone }, surf, under, patEl), msg, h('div', { class: 'fs-deck' }, h('div', { class: 'fs-gauge' }, gl, bar, h('div', { class: 'fs-ticks' }, h('small'), pipsEl, h('small'))), btn));
  let fx = 60; const setFloat = (x, b = 10, taut = false) => { fx = x; float.style.left = hook.style.left = mark.style.left = x + '%'; float.style.bottom = b + '%'; const y = 92 - b, sag = taut ? 2 : 10 + (x - 34) * 0.22; rl.firstChild.firstChild.setAttribute('d', `M34 34 Q${(34 + x) / 2} ${(34 + y) / 2 + sag} ${x} ${y}`); };
  const shadow = () => `<svg viewBox="0 0 120 80"><ellipse cx="60" cy="40" rx="${cur.f.pearl ? 20 : 34 + Math.min(20, cur.d * 2)}" ry="${cur.f.pearl ? 16 : 14 + cur.d}" fill="${zone === 3 ? 'rgba(170,215,255,.42)' : 'rgba(20,40,80,.55)'}"/></svg>`;
  let strikes = 0; const lim = () => strikesOf(rodT(), zone), drawPips = on => { pipsEl.replaceChildren(...(on ? Array.from({ length: lim() }, (_, k) => h('i', { class: k < lim() - strikes ? '' : 'off' })) : [])); };
  const say = (t, cls = '') => { msg.className = 'fs-msg ' + cls; msg.textContent = t; };
  const drawInfo = () => { const b = o.bag(), r = rod(); info.textContent = r ? `${r.name.slice(0, 2)} ${b.rodD || 0}/${r.dur} · 미끼 ${b.bait || 0}` : '낚싯대 없음'; };
  const setBar = (v, cls = '') => { v = Math.max(0, Math.min(100, v)); const pow = cls.startsWith('pow'), ten = cls.startsWith('ten'); bar.className = 'fs-bar ' + cls; bar.firstChild.style.width = v + '%'; bar.lastChild.style.left = v + '%'; gl.firstChild.textContent = pow ? '던지는 힘' : ten ? '줄 팽팽함' : '낚싯대'; gl.lastChild.textContent = pow || ten ? Math.round(v) : ''; const tk = bar.nextSibling; tk.firstChild.textContent = pow ? '가까이' : ten ? '느슨(안 끌려옴)' : ''; tk.lastChild.textContent = pow ? '멀리 ★' : ten ? '끊어짐!' : ''; };
  function close() { if (!alive) return; alive = false; cancelAnimationFrame(raf); window.removeEventListener('keydown', kd); window.removeEventListener('keyup', ku); wrap.remove(); o.onClose && o.onClose(); }
  function ready(text) {
    phase = 'ready'; hold = false; strikes = 0; patEl.hidden = true; tele = 0; wrap.classList.remove('reel'); rodEl.className = 'fs-rod'; rodEl.dataset.t = rodT(); hook.classList.remove('up'); fishEl.className = 'fs-fish'; fishEl.innerHTML = ''; mark.textContent = ''; float.style.display = rl.style.display = hook.style.display = 'none'; setBar(0); wrap.classList.remove('fight'); drawInfo();
    const b = o.bag(), r = rod();
    if (!r) { say('낚싯대가 없어요. 카피수퍼에서 사 오세요.', 'warn'); btn.textContent = '닫기'; btn.onclick = close; return; }
    if (!(b.rodD > 0)) { say('낚싯대가 다 닳았어요. 카피수퍼에서 수리하세요.', 'warn'); btn.textContent = '닫기'; btn.onclick = close; return; }
    if (!(b.bait > 0)) { say('미끼가 없어요. 카피수퍼에서 사 오세요(1개 10코인).', 'warn'); btn.textContent = '닫기'; btn.onclick = close; return; }
    drawPips(true); say(text || (r.t < zone ? `낚싯대보다 깊은 바다예요. 귀한 물고기는 안 물어요. 끊어짐 칸을 ${lim()}번 건드리면 놓쳐요.` : `끊어짐 칸을 ${lim()}번 건드리면 놓쳐요. 릴을 눌러 힘을 모으고 한 번 더 눌러 던지세요.`)); btn.textContent = '던질\n준비'; btn.onclick = () => { phase = 'power'; power = 0; pdir = 1; say('멀리 던질수록 큰 물고기·귀한 물고기가 잘 물고, 줄도 덜 끊어져요. 지금이다 싶을 때!'); btn.textContent = '던지기!'; btn.onclick = cast; };
  }
  function cast() {
    const b = o.bag(), n = (b.casts || 0) + 1, at = b.pearlAt || (1 + Math.floor(Math.random() * 100));
    // 중급·고급에서는 한 번 나타난 뒤 15~20번 던지면 다시 갈매기 해적단이 나타난다
    if (zone >= 2 && o.onPirate) { const gap = () => 15 + Math.floor(Math.random() * 6), pn = (b.pcasts || 0) + 1, at = b.pirNext > 0 ? b.pirNext : pn - 1 + gap(), hit = pn >= at; o.save({ pcasts: pn, pirNext: hit ? pn + gap() : at }); if (hit) { close(); return o.onPirate(); } }
    // 100번마다 그 안의 어느 한 번에 진주가 문다
    const isPearl = ((n - 1) % 100) + 1 === at; o.save({ bait: b.bait - 1, rodD: b.rodD - 1, casts: n, pearlAt: n % 100 === 0 ? 1 + Math.floor(Math.random() * 100) : at });
    cur = rollCatch(zone, rodT(), isPearl, power / 100); phase = 'cast'; c0 = performance.now(); castTo = 48 + power * 0.44; flew = false; shown = false; setBar(power, 'pow'); drawInfo();
    rodEl.className = 'fs-rod back'; float.className = 'fs-float fly'; hook.classList.add('up'); say(power >= 85 ? '아주 멀리! 큰 물고기가 잘 물고 줄도 덜 끊어져요.' : power >= 55 ? '꽤 멀리 던졌어요.' : '가까이 떨어졌어요. 멀리 던질수록 유리해요.'); btn.textContent = '…'; btn.onclick = null;
  }
  // 찌가 물에 닿았다: 물이 튀고, 줄이 가라앉고, 그때부터 입질을 기다린다
  function splash(x, big) { const r = h('i', { class: 'fs-splash' + (big ? ' big' : ''), style: { left: x + '%' } }); surf.append(r); setTimeout(() => r.remove(), 700); }
  function touch() {
    const p = cur.p; phase = 'wait'; t0 = performance.now(); biteAt = t0 + rnd(1400, 4200) * (1 - p * 0.35); nibAt = Math.random() < 0.6 ? t0 + rnd(400, Math.max(450, biteAt - t0 - 450)) : 0;
    setFloat(castTo); float.className = 'fs-float'; hook.style.display = ''; hook.classList.remove('up'); rodEl.className = 'fs-rod'; splash(castTo, true); sfx('splash');
    fishEl.className = 'fs-fish on far'; fishEl.innerHTML = shadow(); fishEl.style.left = '125%'; setBar(0);
    say('찌가 쑥 들어가면 바로 챔질!'); btn.textContent = '챔질!'; btn.onclick = strike;
  }
  function strike() {
    const now = performance.now();
    if (phase !== 'wait') return;
    if (now < biteAt) { sfx('miss'); return ready('너무 빨랐어요. 물고기가 놀라 달아났어요. (미끼 1개 사용)'); }
    if (shown && now > biteEnd) return;
    pat0 = pat = cur.f.icon ? 99 : PATIENCE[zone] + (cur.f.king || cur.f.pearl ? 4 : 0); bar.style.setProperty('--lo', BAND_LO[zone] + '%'); tele = 0; nextSpike = cur.f.icon ? Infinity : now + rnd(...SPIKE_GAP[zone]) * 1000; taps = 0; patEl.hidden = !!cur.f.icon;
    sfx('hookset'); strikes = 0; drawPips(true); phase = 'fight'; dist = 100; ten = 35; burst = 0; slack = 0; nextBurst = now + rnd(900, 1800); wrap.classList.add('fight'); fishEl.className = 'fs-fish on'; fishEl.innerHTML = shadow();
    say(cur.f.icon ? '누르고 있으면 감아요.' : '줄을 주황 칸에 맞춰야 끌려와요! 빨간 칸은 2번 닿으면 끝이에요.'); btn.textContent = '꾹 눌러\n감기'; btn.onclick = null;
  }
  function fail(text) { sfx(/끊어/.test(text) ? 'snap' : 'bad'); ready(text); }
  function landed() {
    const { f, cm, price } = cur; sfx(price <= 0 ? 'bad' : f.king || f.rare || f.pearl ? 'bigfish' : 'coin'); if (price > 0) splash(34, true); phase = 'done'; patEl.hidden = true; wrap.classList.remove('fight', 'reel'); float.style.display = rl.style.display = hook.style.display = 'none'; fishEl.className = 'fs-fish';
    o.coins(price); if (!f.icon) o.dex(f.id, cm);
    const w = weightOf(f, cm), card = h('div', { class: 'fs-card' + (f.pearl ? ' pearl' : f.king ? ' king' : f.rare ? ' rare' : f.icon ? ' trash' : '') }, h('div', { class: 'fs-pic', html: fishSvg(f, true) }),
      h('b', null, f.pearl ? '✨ 바다 진주! ✨' : f.king ? `👑 ${f.name}` : f.name), !f.icon && !f.pearl && h('p', null, `${cm}cm · ${kg(w)}`), h('p', { class: 'fs-won' }, price > 0 ? `+${price.toLocaleString('ko-KR')} 🪙` : `${price} 🪙`), o.trial && h('small', null, '체험 중이라 돈과 도감은 저장되지 않아요.'),
      f.icon && h('small', null, '바다 쓰레기를 건졌어요. 처리 비용이 나갔어요.'),
      h('div', { class: 'fs-acts' }, h('button', { class: 'btn primary', onClick: () => { card.remove(); ready(); } }, '또 던지기'), h('button', { class: 'btn', onClick: () => { card.remove(); close(); } }, '그만하기')));
    wrap.append(card); say(''); btn.textContent = '…'; btn.onclick = null;
  }
  // 찔끔찔끔 누르기: 0.3초도 안 되게 눌렀다 떼면 물고기가 눈치채고 인내심이 깎인다(깊은 바다일수록 많이)
  const down = () => { if (!hold) pressAt = performance.now(); hold = true; };
  const up = () => { if (hold && phase === 'fight' && !cur.f.icon && performance.now() - pressAt < 300) { taps++; pat -= [0, 0.7, 1.2, 1.8][zone] + (cur.f.king || cur.f.pearl ? 0.6 : 0); eyeAt = performance.now() + 700; if (taps === 2 || taps % 5 === 0) say('찔끔찔끔 감으면 물고기가 눈치채고 떠나요! 길게 감으세요.', 'warn'); } hold = false; };
  const press = e => { if (phase === 'fight') { e.preventDefault(); down(); } }, lift = up;
  btn.addEventListener('pointerdown', press); ['pointerup', 'pointercancel', 'pointerleave'].forEach(n => btn.addEventListener(n, lift));
  const kd = e => { if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); if (phase === 'fight') { if (!e.repeat) down(); } else if (!e.repeat && btn.onclick) btn.onclick(); } }, ku = e => { if (e.key === ' ' || e.key === 'Enter') up(); };
  window.addEventListener('keydown', kd); window.addEventListener('keyup', ku);
  function step(now) {
    if (!alive) return; const dt = Math.min(0.05, (now - last) / 1000); last = now;
    if (phase === 'cast') { const u = (now - c0) / 1000; // 낚싯대를 뒤로 젖혔다가(0.25초) 휘두르면 찌가 포물선으로 날아간다(0.6초)
      if (u >= 0.25 && !flew) { flew = true; rodEl.className = 'fs-rod cast'; sfx('cast'); float.style.display = rl.style.display = ''; hook.style.display = 'none'; }
      if (flew) { const k = Math.min(1, (u - 0.25) / 0.6), e = k * (2 - k) * 0.35 + k * 0.65; setFloat(34 + (castTo - 34) * e, 58 * (1 - e) + 10 * e + 34 * Math.sin(Math.PI * k) * (0.5 + power / 200), true); if (k >= 1) touch(); } }
    else if (phase === 'power') { power += pdir * dt * (150 + zone * 25); if (power >= 100) { power = 100; pdir = -1; } if (power <= 0) { power = 0; pdir = 1; } setBar(power, 'pow'); }
    else if (phase === 'wait') {
      float.classList.toggle('nib', !!nibAt && now > nibAt && now < nibAt + 350);
      if (now >= biteAt && !shown) { shown = true; biteEnd = now + [0, 900, 700, 520][zone] + cur.p * 260 - (rodT() < zone ? 130 : 0) - (cur.f.pearl ? 180 : 0); float.classList.add('bite'); mark.textContent = '!'; splash(fx); sfx('bite'); }
      if (!shown) fishEl.style.left = fx + (1 - Math.min(1, (now - t0) / (biteAt - t0))) * 65 + (nibAt && now > nibAt && now < nibAt + 350 ? -3 : 4) + '%'; else fishEl.style.left = fx + '%';
      if (shown && now > biteEnd) fail('놓쳤어요. 미끼만 먹고 갔어요.');
    } else if (phase === 'fight') {
      const d = cur.d;
      if (!burst && now > nextBurst) { burst = now + (450 + d * 50); } if (burst && now > burst) { burst = 0; nextBurst = now + Math.max(1100, 3000 - d * 150) * rnd(0.7, 1.3); }
      const B = !!burst, TM = ZONE_TEN[zone] * ROD_TEN[rodT()], LO = cur.f.icon ? 0 : BAND_LO[zone]; pat -= dt; patEl.firstChild.style.width = Math.max(0, pat / pat0 * 100) + '%'; patEl.classList.toggle('low', pat < pat0 * 0.3);
      if (pat <= 0) { delete fishEl.dataset.rev; return void fail(taps >= 4 ? '물고기가 눈치채고 떠났어요. 찔끔찔끔 감으면 안 돼요.' : '너무 오래 끌었어요. 물고기가 바늘을 털고 떠났어요.'); }
      wrap.classList.toggle('reel', hold); if (hold && now > clickAt) { clickAt = now + (B ? 150 : 75); sfx('reel'); } if (ten > 74 && now > creakAt) { creakAt = now + 260; sfx('strain'); }
      // 화내기: 0.4초 동안 빨갛게 부르르 떨다가(신호) 팔짝 뛰면서 줄이 확 팽팽해진다
      if (!tele && now > nextSpike) { tele = now + TELE; fishEl.classList.add('mad'); sfx('tock'); }
      if (tele && now >= tele) { tele = 0; nextSpike = now + rnd(...SPIKE_GAP[zone]) * 1000; ten += SPIKE[zone] * TM * (hold ? 1 : 0.5); fishEl.classList.remove('mad'); fishEl.classList.add('jump'); setTimeout(() => fishEl.classList.remove('jump'), 520); splash(fx, true); sfx('splash'); bar.classList.add('spike'); setTimeout(() => bar.classList.remove('spike'), 300); }
      if (hold) { dist -= (cur.f.icon ? 34 : Math.max(7, 27 - d * 1.5) * ZONE_REEL[zone] * (ten >= LO ? 1 : 0.15)) * (1 + cur.p * 0.2) * dt * (B ? 0.5 : 1); ten += (25 + d * 1.1) * 1.12 * TM * (1 - cur.p * 0.25) * (B ? 1.35 : 1) * dt; } // 멀리 던졌으면 더 잘 감기고 줄이 덜 팽팽해진다
      else { ten -= (50 - d * 0.8) * dt; dist += (0.8 + d * 0.42) * 1.2 * (B ? 1.4 : 1) * dt; }
      // 끊어짐 칸(80)을 건드리면 한 번으로 센다. 줄이 튕기며 물고기가 조금 달아나고, 정해진 횟수를 다 쓰면 놓친다
      if (ten >= 80) { strikes++; drawPips(true); if (strikes >= lim()) { delete fishEl.dataset.rev; return void fail('줄이 끊어졌어요! 끊어짐 칸을 두 번 건드렸어요.'); }
        ten = Math.max(LO + 2, 58); dist += 6; hold = false; sfx('strain'); wrap.classList.add('jolt'); setTimeout(() => wrap.classList.remove('jolt'), 300); say('줄이 끊어질 뻔! 한 번만 더 건드리면 놓쳐요. 손을 뗐다가 다시 감으세요.', 'warn'); }
      ten = Math.max(0, ten); slack = ten < 6 && !B ? slack + dt : 0;
      setBar(ten, 'ten' + (ten >= LO ? ' hot' : '') + (B ? ' burst' : '')); setFloat(34 + Math.max(0, Math.min(130, dist)) * 0.45, 8, true); fishEl.style.left = fx + '%'; fishEl.classList.toggle('burst', B); mark.textContent = tele ? '💥' : B ? '💢' : now < eyeAt ? '👀' : '';
      if (dist < 45 && cur.f.icon && !fishEl.dataset.rev) { fishEl.dataset.rev = 1; fishEl.innerHTML = fishSvg(cur.f); say('어… 쓰레기 같아요. 손을 떼고 놓아주면 돈이 안 나가요.', 'warn'); }
      if (dist >= 130) { delete fishEl.dataset.rev; return void fail(cur.f.icon ? '쓰레기를 놓아줬어요.' : '물고기가 멀리 달아났어요.'); }
      if (slack > 2.4 - Math.min(1.2, d * 0.1)) { delete fishEl.dataset.rev; return void fail(cur.f.icon ? '쓰레기를 놓아줬어요.' : '줄이 느슨해져서 바늘이 빠졌어요.'); }
      if (dist <= 0) { delete fishEl.dataset.rev; landed(); }
    }
    raf = requestAnimationFrame(step);
  }
  document.body.append(wrap); ready(); last = performance.now(); raf = requestAnimationFrame(step);
  return { close };
}

// ----- 갈매기 해적단: 항해하던 바다 위에서 그대로, 멀리 떨어져 포를 번갈아 쏜다 -----
// 서로 4방이면 끝난다. 내가 빗나갈 때마다 해적단의 정확도가 오르고, 연달아 두 번 빗나가면 해적단의 다음 포는 반드시 맞는다
// e = { world, stage, panel, zone, meEl, boatEl, shout(t), me:{x, y(바닥에서 px), s}, foeX, balls(), useBall(), cam(x), onEnd(win) }
const SHIP_SVG = `<svg viewBox="0 0 170 130"><path d="M96 74 V8" stroke="#5A3B22" stroke-width="5" stroke-linecap="round"/><path d="M93 12 L44 38 L93 62z" fill="#3A3A44" stroke="#1F1F26" stroke-width="2" stroke-linejoin="round"/><circle cx="74" cy="36" r="7" fill="#fff"/><circle cx="71.6" cy="35" r="1.6" fill="#1F1F26"/><circle cx="76.4" cy="35" r="1.6" fill="#1F1F26"/><path d="M66 43 l16 5M82 43 l-16 5" stroke="#fff" stroke-width="2.4" stroke-linecap="round"/><path d="M96 8 h20 q-4 6 0 12 h-20z" fill="#1F1F26"/><path d="M6 72 H164 Q160 112 132 116 H40 Q12 112 6 72z" fill="#6B4A32" stroke="#2E1E12" stroke-width="2.4" stroke-linejoin="round"/><path d="M9 86 H161" stroke="#C0392B" stroke-width="7"/><circle cx="60" cy="100" r="5" fill="#2E1E12"/><circle cx="90" cy="100" r="5" fill="#2E1E12"/><circle cx="120" cy="100" r="5" fill="#2E1E12"/><g class="gun-b" style="transform-origin:42px 56px"><rect x="2" y="45" width="52" height="21" rx="9" fill="#3E3E48" stroke="#1F1F26" stroke-width="2"/><rect x="1" y="42" width="9" height="27" rx="4" fill="#2A2A33" stroke="#1F1F26" stroke-width="1.5"/></g><circle cx="40" cy="67" r="11" fill="#3A2A1E" stroke="#1F140C" stroke-width="2"/><path d="M-2 118 q14 -9 28 0 t28 0 t28 0 t28 0 t28 0 t28 0 t28 0" fill="none" stroke="#fff" stroke-width="4" stroke-linecap="round" opacity=".8"/></svg>`;
export function seaBattle(e) {
  const G = 520, me = e.me, dir = e.foeX > me.x ? 1 : -1, D0 = Math.abs(e.foeX - me.x), VMAX = Math.sqrt(1.3 * D0 * G), HITR = 68 * me.s, HITH = 80 * me.s, HITS = 4, // 배 반 너비와 높이: 포탄이 배나 캐릭터에 닿으면 무조건 맞은 것이다
     BALL_PX = Math.round(20 * me.s), A0 = 45, P0 = 60;
  const PX = 41 * me.s, PY = 46 * me.s, BL = 36 * me.s, DROP = 16 * me.s; // 포신 축(배 가운데에서)과 포신 길이, 배 바닥이 기준선보다 내려간 만큼
  const my0 = me.x, foe0 = e.foeX, STEP = 16, BUDGET = 80; let foeX = e.foeX, foeTo = foeX, moved = 0;
  const dist = () => Math.abs(foeX - me.x);
  // 배가 파도에 흔들리는 만큼(기울기·높이) 포구와 쏘는 각도도 같이 움직인다
  const sway = el => { const cs = getComputedStyle(el), r = parseFloat(cs.rotate) || 0, t = cs.translate && cs.translate !== 'none' ? parseFloat(cs.translate.split(' ')[1]) || 0 : 0; return { r, up: -t }; };
  const muzzle = (el, x0, d, a) => { const w = sway(el), ph = -w.r * Math.PI / 180, rx = d * (PX + BL * Math.cos(a)), ry = PY + DROP + BL * Math.sin(a); return { x: x0 + rx * Math.cos(ph) - ry * Math.sin(ph), y: -DROP + rx * Math.sin(ph) + ry * Math.cos(ph) + w.up, a: a - w.r * d * Math.PI / 180 }; };
  let alive = true, raf = 0, last = 0, turn = 'intro', shot = null, wind = 0, myHp = HITS, foeHp = HITS, camX = me.x, camTo = me.x, timer = 0, next = null, round = 0, still = 0, sailing = 0;
  const pips = () => h('div', { class: 'sb-hp' }, ...Array.from({ length: HITS }, () => h('i')));
  const foeEl = h('div', { class: 'so-boat sb-foe hv' + e.zone, style: { left: foeX + 'px', bottom: me.y + 'px', transform: `scale(${(dir * me.s).toFixed(3)}, ${me.s.toFixed(3)})`, zIndex: 12 } }, h('div', { class: 'sb-crew a', html: gullSvg(true) }), h('div', { class: 'sb-crew b', html: gullSvg(false) }), h('div', { class: 'sb-ship', html: SHIP_SVG }));
  const fHp = pips(), mHp = pips(), ball = h('i', { class: 'sb-ball', style: { display: 'none', width: BALL_PX + 'px', height: BALL_PX + 'px', margin: `0 0 ${-BALL_PX / 2}px ${-BALL_PX / 2}px` } }), dots = [0, 1, 2, 3, 4, 5].map(() => h('i', { class: 'sb-dot' }));
  fHp.style.bottom = me.y + 132 * me.s + 'px'; mHp.style.bottom = me.y + 122 * me.s + 'px'; e.world.append(foeEl, fHp, mHp, ball, ...dots);
  const place = () => { foeEl.style.left = fHp.style.left = foeX + 'px'; mHp.style.left = me.x + 'px'; };
  const myGun = () => e.boatEl.querySelector('.gun-b'), foeGun = foeEl.querySelector('.gun-b'), setGun = (g, deg, sgn = 1) => { if (g) g.style.transform = `rotate(${-deg * sgn}deg)`; }; // 해적 포신은 왼쪽을 보고 있어서 반대로 돌린다
  const ang = h('input', { type: 'range', min: 10, max: 80, value: A0 }), pow = h('input', { type: 'range', min: 20, max: 100, value: P0 }), aV = h('b'), pV = h('b'), msg = h('p', { class: 'sb-msg' }), info = h('span', { class: 'sb-info' }), fire = h('button', { class: 'sb-fire', onClick: shoot }, h('span', null, '💣'), h('b', null, '발사'));
  const nudge = (inp, d) => h('button', { class: 'sb-nd', onClick: () => { inp.value = +inp.value + d; lab(); } }, d < 0 ? '−' : '+');
  const row = (ic, nm, inp, val, cls) => h('div', { class: 'sb-row ' + cls }, h('div', { class: 'sb-rl' }, h('span', null, ic + ' ' + nm), val), h('div', { class: 'sb-sl' }, nudge(inp, -1), inp, nudge(inp, 1)));
  const mvL = h('span', { class: 'sb-mvl' }), mvB = h('button', { class: 'sb-mv' }, '◀ 뒤로'), mvF = h('button', { class: 'sb-mv' }, '앞으로 ▶'); holdBtn(mvB, () => { sailing = -1; }, () => { sailing = 0; }); holdBtn(mvF, () => { sailing = 1; }, () => { sailing = 0; });
  e.panel.replaceChildren(h('div', { class: 'sb-move' }, mvB, h('div', { class: 'sb-mid' }, info, mvL), mvF), msg, h('div', { class: 'sb-deck' }, h('div', { class: 'sb-ctl' }, row('📐', '각도', ang, aV, 'ang'), row('💪', '힘', pow, pV, 'pow')), fire)); e.panel.hidden = false;
  // 명중률: 차례가 거듭될수록 조금씩 오른다. 중급은 낮게, 고급은 조금 높게, 너무 높아지지 않게 위를 막는다
  const acc = () => (e.zone === 3 ? Math.min(0.55, 0.12 + round * 0.06) : Math.min(0.4, 0.06 + round * 0.05));
  const windTxt = () => (wind ? `바람 ${wind * dir > 0 ? '뒤에서' : '앞에서'} ${Math.abs(wind)}` : '바람 없음');
  const fill = inp => { inp.style.setProperty('--p', (inp.value - inp.min) / (inp.max - inp.min) * 100 + '%'); };
  function lab() { aV.textContent = ang.value + '°'; pV.textContent = pow.value; fill(ang); fill(pow); info.textContent = `포탄 ${e.balls()} · 거리 ${Math.round(dist() / 4)}m · ${windTxt()}`; if (turn === 'me' || turn === 'intro') setGun(myGun(), +ang.value); const on = turn === 'me' && alive && !shot; mvB.disabled = !on || moved >= BUDGET; mvF.disabled = !on || moved >= BUDGET; mvL.textContent = `꾹 눌러 배 움직이기 · 이번 차례 ${Math.max(0, Math.round((BUDGET - moved) / 4))}m 남음`; } ang.oninput = pow.oninput = lab;
  const hp = () => { [...fHp.children].forEach((n, k) => n.classList.toggle('off', k >= foeHp)); [...mHp.children].forEach((n, k) => n.classList.toggle('off', k >= myHp)); };
  const fly = (x, y, vx, vy, t) => { for (let k = 0; k < t / 0.016; k++) { vx += wind * 0.016; vy -= G * 0.016; x += vx * 0.016; y += vy * 0.016; if (y <= 0) break; } return { x, y }; };
  function aim() { const on = turn === 'me' && alive && !shot; if (!on) return dots.forEach(d => { d.style.display = 'none'; }); const v = pow.value / 100 * VMAX, m = muzzle(e.boatEl, me.x + 3, dir, ang.value * Math.PI / 180); dots.forEach((d, k) => { d.style.display = ''; const q = fly(m.x, m.y, dir * Math.cos(m.a) * v, Math.sin(m.a) * v, 0.07 * (k + 1)); d.style.left = q.x + 'px'; d.style.bottom = me.y + q.y + 'px'; }); } // 조준 도움선은 앞부분만, 배가 흔들리면 같이 흔들린다
  // 내 차례에는 버튼을 누르고 있는 동안 배가 앞뒤로 미끄러지듯 움직인다(한 차례에 20m까지). 5m 넘게 움직이면 해적단이 재던 거리가 흐트러진다
  function sail(sgn, dt) { if (turn !== 'me' || shot || !alive || moved >= BUDGET) return; const lo = Math.max(e.minX, my0 - BUDGET), hi = Math.min(e.maxX, my0 + BUDGET), nx = Math.max(lo, Math.min(hi, me.x + sgn * dir * Math.min(64 * dt, BUDGET - moved))); if (nx === me.x) return;
    const was = moved; moved += Math.abs(nx - me.x); me.x = nx; e.move(nx); place(); camTo = me.x + dir * 90; if (was < 20 && moved >= 20) { if (still) msg.textContent = '배를 움직였어요! 해적단이 거리를 다시 재야 해요.'; still = 0; sfx('point'); } lab(); }
  const clean = () => { cancelAnimationFrame(raf); [foeEl, fHp, mHp, ball, ...dots].forEach(n => n.remove()); e.world.querySelectorAll('.sb-fx').forEach(n => n.remove()); setGun(myGun(), 0); e.panel.hidden = true; e.panel.replaceChildren(); e.cam(null); };
  function end(win, text) { if (!alive) return; alive = false; aim(); lab(); msg.textContent = text; fire.lastChild.textContent = '확인'; fire.firstChild.textContent = win ? '🏆' : '🏳️'; fire.disabled = false; fire.classList.add('done'); camTo = me.x; fire.onclick = () => { clean(); e.onEnd(win); }; }
  function myTurn() { turn = 'me'; moved = 0; ang.value = A0; pow.value = P0; wind = Math.round(rnd(-60, 60)); camTo = me.x + dir * 90; lab(); if (e.balls() <= 0) return end(false, '포탄이 떨어졌어요! 해적단에게 당했어요.'); msg.textContent = still >= 1 ? '⚠️ 가만히 있으면 해적단의 다음 포는 반드시 맞아요! 배를 움직이세요.' : '내 차례! 각도와 힘을 맞춰 쏘세요.'; fire.disabled = false; }
  function puff(x, y) { const f = h('i', { class: 'sb-fx sb-puff', style: { left: x + 'px', bottom: me.y + y + 'px' } }); e.world.append(f); setTimeout(() => f.remove(), 500); }
  const kick = (...els) => { els.forEach(n => n.classList.add('sb-kick')); setTimeout(() => els.forEach(n => n.classList.remove('sb-kick')), 260); };
  function shoot() { if (turn !== 'me' || shot || !alive) return; e.useBall(); sfx('cannon'); const v = pow.value / 100 * VMAX, m = muzzle(e.boatEl, me.x + 3, dir, ang.value * Math.PI / 180); shot = { x: m.x, y: m.y, vx: dir * Math.cos(m.a) * v, vy: Math.sin(m.a) * v, by: 'me' }; puff(m.x, m.y); kick(e.boatEl, e.meEl); fire.disabled = true; turn = 'fly'; lab(); aim(); msg.textContent = '날아갑니다…'; }
  function foeShoot() { turn = 'foe'; wind = Math.round(rnd(-60, 60)); lab(); camTo = foeX - dir * 90;
    // 맞힐지 빗나갈지 먼저 정하고, 그 자리에 떨어지는 각도와 힘을 찾는다 빗나갈 때는 내 앞에 떨어지거나 머리 위로 넉넉히 넘어간다(배에 스치면 맞은 것이 되므로)
    still++; const sure = still >= 2, hitNow = sure || Math.random() < acc(), want = me.x + (hitNow ? rnd(-14, 14) : Math.random() < 0.5 ? dir * rnd(HITR + 25, HITR + 150) : -dir * rnd(HITR + 120, HITR + 240)); if (sure) still = 0; round++;
    msg.textContent = sure ? '가만히 있었더니 해적단이 거리를 다 쟀어요! 피할 수 없어요!' : '갈매기 해적단이 포를 겨눠요!'; let best = { e: 1e9, a: 0.8, v: VMAX * 0.7 };
    for (let a = 0.72; a < 1.15; a += 0.05) for (let v = VMAX * 0.45; v <= VMAX * 1.15; v += VMAX / 90) { const q = fly(foeX - dir * (PX + BL * Math.cos(a)), PY + BL * Math.sin(a), -dir * Math.cos(a) * v, Math.sin(a) * v, 9), er = Math.abs(q.x - want); if (er < best.e) best = { e: er, a, v }; }
    setGun(foeGun, best.a * 180 / Math.PI, -1);
    timer = 1.2; next = () => { sfx('cannon'); const mx = foeX - dir * (PX + BL * Math.cos(best.a)), my = PY + BL * Math.sin(best.a); shot = { x: mx, y: my, vx: -dir * Math.cos(best.a) * best.v, vy: Math.sin(best.a) * best.v, by: 'foe' }; puff(mx, my); kick(foeEl); turn = 'fly'; }; }
  // 한 발 쏘고 난 틈에 해적선이 앞뒤로 조금 움직일 수 있다. 움직이면 화면이 해적선을 비춘다
  function foeDrift(then) { if (Math.random() > 0.55) return then(); const to = Math.max(Math.min(foe0 - 100, foe0 + 100), Math.min(Math.max(foe0 - 100, foe0 + 100), Math.max(e.minX, Math.min(e.maxX, foeX + (Math.random() < 0.5 ? -1 : 1) * rnd(36, 96))))); if (Math.abs(to - foeX) < 20 || Math.abs(to - me.x) < 380) return then();
    const closer = Math.abs(to - me.x) < dist(); foeTo = to; turn = 'drift'; camTo = to - dir * 60; setGun(foeGun, 0, -1); msg.textContent = `해적선이 ${closer ? '다가와요' : '물러나요'}! (${Math.round(Math.abs(to - foeX) / 4)}m)`; next = then; timer = 0; }
  function fx(cls, x, n, y = 0) { const f = h('div', { class: 'sb-fx ' + cls, style: { left: x + 'px', bottom: me.y + y + 'px' } }, ...Array.from({ length: n }, (_, k) => h('i', { style: { '--a': (k / n * 360 + rnd(-12, 12)).toFixed(0) + 'deg', '--d': rnd(26, 62).toFixed(0) + 'px', '--t': rnd(0, 0.12).toFixed(2) + 's' } }))); e.world.append(f); setTimeout(() => f.remove(), 1100); }
  function land(s, touched) { const mine = s.by === 'me', tx = mine ? foeX : me.x, d = Math.abs(s.x - tx), hit = !!touched || d < HITR; ball.style.display = 'none'; const ix = s.x;
    if (hit) { sfx('boom'); fx('sb-bang', ix, 10, Math.max(0, s.y - 20)); e.stage.classList.add('sb-quake'); setTimeout(() => e.stage.classList.remove('sb-quake'), 420); const els = mine ? [foeEl] : [e.boatEl, e.meEl]; els.forEach(n => n.classList.add('sb-hit')); setTimeout(() => els.forEach(n => n.classList.remove('sb-hit')), 600);
      if (mine) foeHp--; else myHp--; hp(); }
    else { sfx('splash'); fx('sb-water', ix, 9); }
    const off = Math.round(d / 4), short = (s.x - tx) * dir < 0;
    msg.textContent = mine ? (hit ? `명중! 앞으로 ${foeHp}방!` : `${off}m ${short ? '짧았어요' : '넘어갔어요'}. (해적단 명중률 ${Math.round(acc() * 100)}%)`) : (hit ? `으악, 맞았어요! 내 배는 앞으로 ${myHp}방…` : '해적단의 포가 빗나갔어요.');
    shot = null; if (foeHp <= 0) return end(true, '갈매기 해적단을 물리쳤어요! 보물을 챙겼어요.'); if (myHp <= 0) return end(false, '배가 크게 부서졌어요…');
    timer = 1.4; next = () => foeDrift(mine ? foeShoot : myTurn); }
  function step(now) { const dt = Math.min(0.033, (now - last) / 1000); last = now;
    if (alive) { if (timer > 0) { timer -= dt; if (timer <= 0 && next) { const f = next; next = null; f(); } }
      if (turn === 'drift') { const d = foeTo - foeX, st = 70 * dt; if (Math.abs(d) <= st) { foeX = foeTo; place(); turn = 'wait'; lab(); msg.textContent += ` 이제 거리 ${Math.round(dist() / 4)}m`; timer = 0.9; } else { foeX += Math.sign(d) * st; place(); } }
      if (turn === 'me') { if (sailing) sail(sailing, dt); aim(); }
      if (shot) { shot.vx += wind * dt; shot.vy -= G * dt; shot.x += shot.vx * dt; shot.y += shot.vy * dt; ball.style.display = ''; ball.style.left = shot.x + 'px'; ball.style.bottom = me.y + Math.max(0, shot.y) + 'px'; camTo = shot.x; const tx = shot.by === 'me' ? foeX : me.x; if (Math.abs(shot.x - tx) < HITR && shot.y < HITH && shot.y > 0) land(shot, true); else if (shot.y <= 0) land(shot); } }
    camX += (camTo - camX) * Math.min(1, dt * 5); e.cam(camX); raf = requestAnimationFrame(step); }
  // 등장: 먼저 외치고, 화면이 해적선 위치를 보여 준 다음 다시 내 보트로 돌아와 내 차례
  place(); hp(); lab(); fire.disabled = true; e.shout('앗! 해적선이다!'); sfx('bad'); msg.textContent = '앗! 해적선이다!'; timer = 1.1; next = () => { camTo = foeX - dir * 60; msg.textContent = '갈매기 해적단이 나타났어요! 서로 4방이면 끝나요.'; timer = 2.2; next = () => { camTo = me.x + dir * 90; timer = 0.9; next = myTurn; }; };
  last = performance.now(); raf = requestAnimationFrame(step);
  return { stop() { alive = false; clean(); } };
}
