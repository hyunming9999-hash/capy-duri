// 바닷가 낚시 — 카피바라들의 주요 경제활동. 낚시터는 배를 타야만 갈 수 있고, 초급·중급·고급 세 구역으로 나뉜다
// 던지기(힘 조절) → 입질 기다리기 → 챔질 → 밀고 당기기(줄 팽팽함을 조절하며 감기). 물고기는 클수록 값이 나간다
import { h, toast } from './ui.js';
import { capy } from './capy.js';
import { sfx } from './sound.js';

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
  if (isPearl) return { f: PEARL, cm: 0, price: PEARL_PRICE, d: 14 };
  if (Math.random() < [0, 0.12, 0.08, 0.05][zone]) { const t = pick(TRASH); return { f: t, cm: 0, price: -t.lose, d: 1 }; }
  const under = rodT < zone, pool = FISH.filter(f => f.z === zone && !(under && (f.rare || f.king)));
  const w = pool.map(f => (f.king ? 0.25 : f.rare ? 0.45 : 1)), tot = w.reduce((a, b) => a + b, 0); let r = Math.random() * tot, f = pool[0]; for (let i = 0; i < pool.length; i++) { r -= w[i]; if (r <= 0) { f = pool[i]; break; } }
  const t = Math.min(1, Math.pow(Math.random(), 1.6 - power * 0.6)), cm = Math.round((f.cm[0] + (f.cm[1] - f.cm[0]) * t) * 10) / 10; // 멀리 던질수록 큰 놈이 잘 문다
  const price = Math.round(f.price[0] + (f.price[1] - f.price[0]) * Math.pow(t, 1.3));
  const d = (zone === 1 ? 1 + t * 2 : zone === 2 ? 4 + t * 2 + (f.rare ? 1.5 : 0) : 7 + t * 2 + (f.king ? 1.5 : 0)) + (under ? 2 : 0);
  return { f, cm, price, d };
}
export const weightOf = (f, cm) => (f.pearl || f.icon ? 0 : Math.max(0.01, Math.pow(cm, 3) * (f.name === '고래킹' ? 0.00003 : 0.000013)));
const kg = w => (w >= 1000 ? (w / 1000).toFixed(2) + 't' : w >= 1 ? w.toFixed(1) + 'kg' : Math.round(w * 1000) + 'g');

// ----- 낚시 화면 -----
// o = { ctx, zone, bag(), save(patch), coins(n), dex(id, cm), onClose() }
export function openFishing(o) {
  let alive = true, raf = 0, last = 0, phase = 'ready', power = 0, pdir = 1, t0 = 0, biteAt = 0, biteEnd = 0, nibAt = 0, cur = null, dist = 100, ten = 30, hold = false, burst = 0, nextBurst = 0, slack = 0, shown = false;
  const zone = o.zone, rodT = () => o.bag().rod || 0, rod = () => RODS[rodT()];
  const sky = h('div', { class: 'fs-sky' }), float = h('i', { class: 'fs-float' }), line = h('i', { class: 'fs-line' }), fishEl = h('div', { class: 'fs-fish' }), mark = h('b', { class: 'fs-mark' });
  const me = h('div', { class: 'fs-me', html: capy(o.ctx.capyOf(o.ctx.uid, { face: 'happy' })) }), rodEl = h('i', { class: 'fs-rod' });
  const sea = h('div', { class: 'fs-sea z' + zone }, line, float, fishEl, mark), msg = h('p', { class: 'fs-msg' }), bar = h('div', { class: 'fs-bar' }, h('u')), info = h('div', { class: 'fs-info' });
  const btn = h('button', { class: 'fs-btn' }), quit = h('button', { class: 'btn sm fs-quit', onClick: () => close() }, '그만하기');
  const wrap = h('div', { class: 'fs' }, h('div', { class: 'fs-top' }, h('b', null, `🎣 ${ZONES[zone]}`), info, quit), h('div', { class: 'fs-view' }, sky, sea, h('div', { class: 'fs-boat' }, me, rodEl)), msg, bar, btn);
  const say = (t, cls = '') => { msg.className = 'fs-msg ' + cls; msg.textContent = t; };
  const drawInfo = () => { const b = o.bag(), r = rod(); info.textContent = r ? `${r.name.slice(0, 2)} ${b.rodD || 0}/${r.dur} · 미끼 ${b.bait || 0}` : '낚싯대 없음'; };
  const setBar = (v, cls = '') => { bar.className = 'fs-bar ' + cls; bar.firstChild.style.width = Math.max(0, Math.min(100, v)) + '%'; };
  function close() { if (!alive) return; alive = false; cancelAnimationFrame(raf); window.removeEventListener('keydown', kd); window.removeEventListener('keyup', ku); wrap.remove(); o.onClose && o.onClose(); }
  function ready(text) {
    phase = 'ready'; hold = false; fishEl.className = 'fs-fish'; fishEl.innerHTML = ''; mark.textContent = ''; float.style.display = 'none'; line.style.display = 'none'; setBar(0); wrap.classList.remove('fight'); drawInfo();
    const b = o.bag(), r = rod();
    if (!r) { say('낚싯대가 없어요. 카피수퍼에서 사 오세요.', 'warn'); btn.textContent = '닫기'; btn.onclick = close; return; }
    if (r.t < zone - 1) { say(`${ZONES[zone]}는 ${RODS[zone - 1].name} 이상이 있어야 해요.`, 'warn'); btn.textContent = '닫기'; btn.onclick = close; return; }
    if (!(b.rodD > 0)) { say('낚싯대가 다 닳았어요. 카피수퍼에서 수리하세요.', 'warn'); btn.textContent = '닫기'; btn.onclick = close; return; }
    if (!(b.bait > 0)) { say('미끼가 없어요. 카피수퍼에서 사 오세요(1개 10코인).', 'warn'); btn.textContent = '닫기'; btn.onclick = close; return; }
    say(text || (r.t < zone ? '낚싯대가 한 단계 낮아요. 솜씨로 잡아야 해서 더 어렵고, 귀한 물고기는 안 물어요.' : '버튼을 눌러 힘을 모으고, 한 번 더 눌러 던지세요.')); btn.textContent = '🎣 던질 준비'; btn.onclick = () => { phase = 'power'; power = 0; pdir = 1; say('멀리 던질수록 큰 물고기가 물어요. 지금이다 싶을 때 누르세요!'); btn.textContent = '던지기!'; btn.onclick = cast; };
  }
  function cast() {
    const b = o.bag(), n = (b.casts || 0) + 1, at = b.pearlAt || (1 + Math.floor(Math.random() * 100));
    // 100번마다 그 안의 어느 한 번에 진주가 문다
    const isPearl = ((n - 1) % 100) + 1 === at; o.save({ bait: b.bait - 1, rodD: b.rodD - 1, casts: n, pearlAt: n % 100 === 0 ? 1 + Math.floor(Math.random() * 100) : at });
    cur = rollCatch(zone, rodT(), isPearl, power / 100); sfx('swing'); phase = 'wait'; t0 = performance.now(); biteAt = t0 + rnd(1400, 4200); nibAt = zone > 1 && Math.random() < 0.5 ? t0 + rnd(500, biteAt - t0 - 500) : 0; shown = false;
    float.style.display = line.style.display = ''; float.style.left = 30 + power * 0.55 + '%'; float.className = 'fs-float'; setBar(0); drawInfo();
    say('찌가 쑥 들어가면 바로 챔질!'); btn.textContent = '챔질!'; btn.onclick = strike; rodEl.classList.add('cast'); setTimeout(() => rodEl.classList.remove('cast'), 400);
  }
  function strike() {
    const now = performance.now();
    if (phase !== 'wait') return;
    if (now < biteAt) { sfx('miss'); return ready('너무 빨랐어요. 물고기가 놀라 달아났어요. (미끼 1개 사용)'); }
    if (shown && now > biteEnd) return;
    sfx('point'); phase = 'fight'; dist = 100; ten = 35; burst = 0; slack = 0; nextBurst = now + rnd(900, 1800); wrap.classList.add('fight'); fishEl.className = 'fs-fish on'; fishEl.innerHTML = `<svg viewBox="0 0 120 80"><ellipse cx="60" cy="40" rx="${cur.f.pearl ? 20 : 34 + Math.min(20, cur.d * 2)}" ry="${cur.f.pearl ? 16 : 14 + cur.d}" fill="rgba(20,40,80,.55)"/></svg>`;
    say('누르고 있으면 감아요. 빨간 칸에 닿기 전에 손을 떼세요!'); btn.textContent = '🌀 감기 (누르고 있기)'; btn.onclick = null;
  }
  function fail(text) { sfx('bad'); ready(text); }
  function landed() {
    const { f, cm, price } = cur; sfx(price > 0 ? 'coin' : 'bad'); phase = 'done'; wrap.classList.remove('fight'); float.style.display = line.style.display = 'none'; fishEl.className = 'fs-fish';
    o.coins(price); if (!f.icon) o.dex(f.id, cm);
    const w = weightOf(f, cm), card = h('div', { class: 'fs-card' + (f.pearl ? ' pearl' : f.king ? ' king' : f.rare ? ' rare' : f.icon ? ' trash' : '') }, h('div', { class: 'fs-pic', html: fishSvg(f, true) }),
      h('b', null, f.pearl ? '✨ 바다 진주! ✨' : f.king ? `👑 ${f.name}` : f.name), !f.icon && !f.pearl && h('p', null, `${cm}cm · ${kg(w)}`), h('p', { class: 'fs-won' }, price > 0 ? `+${price.toLocaleString('ko-KR')} 🪙` : `${price} 🪙`),
      f.icon && h('small', null, '바다 쓰레기를 건졌어요. 처리 비용이 나갔어요.'),
      h('div', { class: 'fs-acts' }, h('button', { class: 'btn primary', onClick: () => { card.remove(); ready(); } }, '또 던지기'), h('button', { class: 'btn', onClick: () => { card.remove(); close(); } }, '그만하기')));
    wrap.append(card); say(''); btn.textContent = '…'; btn.onclick = null;
  }
  const press = e => { if (phase === 'fight') { e.preventDefault(); hold = true; } }, lift = () => { hold = false; };
  btn.addEventListener('pointerdown', press); ['pointerup', 'pointercancel', 'pointerleave'].forEach(n => btn.addEventListener(n, lift));
  const kd = e => { if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); if (phase === 'fight') hold = true; else if (!e.repeat && btn.onclick) btn.onclick(); } }, ku = e => { if (e.key === ' ' || e.key === 'Enter') hold = false; };
  window.addEventListener('keydown', kd); window.addEventListener('keyup', ku);
  function step(now) {
    if (!alive) return; const dt = Math.min(0.05, (now - last) / 1000); last = now;
    if (phase === 'power') { power += pdir * dt * (150 + zone * 25); if (power >= 100) { power = 100; pdir = -1; } if (power <= 0) { power = 0; pdir = 1; } setBar(power, 'pow'); }
    else if (phase === 'wait') {
      float.classList.toggle('nib', !!nibAt && now > nibAt && now < nibAt + 350);
      if (now >= biteAt && !shown) { shown = true; biteEnd = now + [0, 900, 700, 520][zone] - (rodT() < zone ? 130 : 0) - (cur.f.pearl ? 180 : 0); float.classList.add('bite'); mark.textContent = '!'; mark.style.left = float.style.left; sfx('tock'); }
      if (shown && now > biteEnd) fail('놓쳤어요. 미끼만 먹고 갔어요.');
    } else if (phase === 'fight') {
      const d = cur.d;
      if (!burst && now > nextBurst) { burst = now + (600 + d * 90); } if (burst && now > burst) { burst = 0; nextBurst = now + Math.max(650, 2700 - d * 150) * rnd(0.7, 1.3); }
      const B = !!burst;
      if (hold) { dist -= (cur.f.icon ? 34 : Math.max(7, 25 - d * 1.25)) * dt * (B ? 0.35 : 1); ten += (26 + d * 5.5) * (B ? 2.3 : 1) * dt; }
      else { ten -= (48 - d) * dt; dist += (1.5 + d * 0.85) * (B ? 2.2 : 1) * dt; }
      if (B && !hold) ten += d * 1.6 * dt;
      ten = Math.max(0, ten); slack = ten < 6 && !B ? slack + dt : 0;
      setBar(ten, 'ten' + (ten > 80 ? ' hot' : '') + (B ? ' burst' : '')); fishEl.style.left = 22 + Math.max(0, Math.min(130, dist)) * 0.5 + '%'; fishEl.classList.toggle('burst', B); float.style.left = fishEl.style.left; mark.textContent = B ? '💢' : ''; mark.style.left = fishEl.style.left;
      if (dist < 45 && cur.f.icon && !fishEl.dataset.rev) { fishEl.dataset.rev = 1; fishEl.innerHTML = fishSvg(cur.f); say('어… 쓰레기 같아요. 손을 떼고 놓아주면 돈이 안 나가요.', 'warn'); }
      if (ten >= 100) { delete fishEl.dataset.rev; return void fail('줄이 끊어졌어요! 너무 세게 감았어요.'); }
      if (dist >= 130) { delete fishEl.dataset.rev; return void fail(cur.f.icon ? '쓰레기를 놓아줬어요.' : '물고기가 멀리 달아났어요.'); }
      if (slack > 2.4 - Math.min(1.2, d * 0.1)) { delete fishEl.dataset.rev; return void fail(cur.f.icon ? '쓰레기를 놓아줬어요.' : '줄이 느슨해져서 바늘이 빠졌어요.'); }
      if (dist <= 0) { delete fishEl.dataset.rev; landed(); }
    }
    raf = requestAnimationFrame(step);
  }
  document.body.append(wrap); ready(); last = performance.now(); raf = requestAnimationFrame(step);
  return { close };
}

// ----- 갈매기 해적단: 포를 번갈아 쏘는 싸움 -----
// o = { zone, balls(), useBall(), onEnd(win) }
export function openBattle(o) {
  const W = 360, Hh = 250, SEA = 190, G = 260, wrap = h('div', { class: 'fs bt' }), cv = h('canvas', { width: W * 2, height: Hh * 2 }), g = cv.getContext('2d'); g.scale(2, 2);
  let alive = true, raf = 0, last = 0, turn = 'me', shot = null, wind = 0, myHp = 100, foeHp = o.zone === 3 ? 150 : 100, boom = null, tt = 0; const foeMax = foeHp, me = { x: 46 }, foe = { x: W - 56 - Math.random() * 40 };
  const ang = h('input', { type: 'range', min: 10, max: 80, value: 45 }), pow = h('input', { type: 'range', min: 20, max: 100, value: 60 }), aL = h('b'), pL = h('b'), msg = h('p', { class: 'fs-msg' }), fire = h('button', { class: 'fs-btn', onClick: shoot }), ballsL = h('span');
  const lab = () => { aL.textContent = `각도 ${ang.value}°`; pL.textContent = `힘 ${pow.value}`; ballsL.textContent = `포탄 ${o.balls()}개`; }; ang.oninput = pow.oninput = lab;
  const newWind = () => { wind = Math.round(rnd(-40, 40)); };
  function end(win, text) { if (!alive) return; alive = false; cancelAnimationFrame(raf); msg.textContent = text; fire.textContent = '닫기'; fire.disabled = false; fire.onclick = () => { wrap.remove(); o.onEnd(win); }; draw(); }
  function myTurn() { turn = 'me'; newWind(); lab(); if (o.balls() <= 0) return end(false, '포탄이 떨어졌어요! 해적단에게 쫓겨났어요.'); msg.textContent = `내 차례! 바람 ${wind > 0 ? '→' : wind < 0 ? '←' : ''} ${Math.abs(wind)}`; fire.disabled = false; fire.textContent = '💣 발사 (포탄 1개)'; }
  function shoot() { if (turn !== 'me' || shot || !alive) return; o.useBall(); lab(); sfx('swing'); const a = ang.value * Math.PI / 180, v = pow.value * 3.3; shot = { x: me.x + 14, y: SEA - 22, vx: Math.cos(a) * v, vy: -Math.sin(a) * v, by: 'me' }; fire.disabled = true; turn = 'fly'; }
  function foeShoot() { turn = 'fly'; newWind(); msg.textContent = `갈매기 해적단 차례! 바람 ${wind > 0 ? '→' : wind < 0 ? '←' : ''} ${Math.abs(wind)}`;
    // 맞히는 값을 어림해 본 뒤 일부러 조금 빗나가게 쏜다(고급 구역 해적이 더 정확하다)
    let best = { e: 1e9, a: 0.8, v: 200 }; for (let a = 0.35; a < 1.3; a += 0.06) for (let v = 120; v < 330; v += 12) { let x = foe.x - 14, y = SEA - 22, vx = -Math.cos(a) * v, vy = -Math.sin(a) * v; for (let k = 0; k < 400 && y < SEA; k++) { vx += wind * 0.016; vy += G * 0.016; x += vx * 0.016; y += vy * 0.016; } const e = Math.abs(x - me.x); if (e < best.e) best = { e, a, v }; }
    const err = (o.zone === 3 ? 55 : 80) * (Math.random() * 2 - 1), v = best.v + err * 0.9; setTimeout(() => { if (!alive) return; sfx('swing'); shot = { x: foe.x - 14, y: SEA - 22, vx: -Math.cos(best.a) * v, vy: -Math.sin(best.a) * v, by: 'foe' }; }, 700); }
  function land(s) { const tgt = s.by === 'me' ? foe : me, d = Math.abs(s.x - tgt.x), hit = d < 30; boom = { x: s.x, y: Math.min(s.y, SEA - 4), t: 0, hit }; sfx(hit ? 'hit' : 'tock');
    if (hit) { const dmg = Math.round((d < 11 ? 50 : 34) * (s.by === 'me' ? 1 : 0.6)); if (s.by === 'me') foeHp = Math.max(0, foeHp - dmg); else myHp = Math.max(0, myHp - dmg); }
    shot = null; if (foeHp <= 0) return end(true, '갈매기 해적단을 물리쳤어요! 보물을 챙겼어요.'); if (myHp <= 0) return end(false, '배가 크게 부서졌어요… 해적단에게 쫓겨났어요.'); setTimeout(() => alive && (s.by === 'me' ? foeShoot() : myTurn()), 800); }
  function ship(x, col, sail, flag, hp, max) { const y = SEA + Math.sin(tt * 2 + x) * 2.5; g.fillStyle = col; g.beginPath(); g.moveTo(x - 26, y - 14); g.lineTo(x + 26, y - 14); g.lineTo(x + 18, y + 4); g.lineTo(x - 18, y + 4); g.closePath(); g.fill(); g.strokeStyle = 'rgba(0,0,0,.35)'; g.lineWidth = 1.5; g.stroke();
    g.fillStyle = '#7A5230'; g.fillRect(x - 1.5, y - 52, 3, 40); g.fillStyle = sail; g.beginPath(); g.moveTo(x + 2, y - 50); g.lineTo(x + 24 * (flag === '🏴‍☠️' ? -1 : 1), y - 34); g.lineTo(x + 2, y - 20); g.closePath(); g.fill(); g.stroke(); g.font = '16px serif'; g.textAlign = 'center'; g.fillText(flag, x, y - 54);
    g.fillStyle = '#333'; g.fillRect(x + (flag === '🏴‍☠️' ? -22 : 10), y - 22, 12, 6); g.fillStyle = 'rgba(0,0,0,.25)'; g.fillRect(x - 24, y - 76, 48, 6); g.fillStyle = hp > max * 0.4 ? '#57C26B' : '#E5484D'; g.fillRect(x - 24, y - 76, 48 * hp / max, 6); }
  function draw() { const sk = g.createLinearGradient(0, 0, 0, SEA); sk.addColorStop(0, '#8FD3FF'); sk.addColorStop(1, '#DDF3FF'); g.fillStyle = sk; g.fillRect(0, 0, W, SEA); g.fillStyle = o.zone === 3 ? '#1E6FA8' : '#2FA7C9'; g.fillRect(0, SEA, W, Hh - SEA);
    g.strokeStyle = 'rgba(255,255,255,.7)'; g.lineWidth = 2; g.beginPath(); for (let x = 0; x <= W; x += 6) g.lineTo(x, SEA + Math.sin(x * 0.08 + tt * 2.4) * 2.5); g.stroke();
    g.fillStyle = '#fff'; g.font = '13px sans-serif'; g.textAlign = 'center'; g.fillText(`바람 ${wind > 0 ? '→'.repeat(1 + Math.floor(wind / 15)) : wind < 0 ? '←'.repeat(1 + Math.floor(-wind / 15)) : '없음'}`, W / 2, 20);
    ship(me.x, '#FFFFFF', '#FFE9A8', '🍊', myHp, 100); ship(foe.x, '#4A3B32', '#2B2B2B', '🏴‍☠️', foeHp, foeMax); g.font = '18px serif'; g.fillText('🐦', foe.x + 4, SEA - 20 + Math.sin(tt * 2 + foe.x) * 2.5);
    if (turn === 'me' && !shot) { const a = ang.value * Math.PI / 180, v = pow.value * 3.3; g.fillStyle = 'rgba(255,255,255,.85)'; let x = me.x + 14, y = SEA - 22, vx = Math.cos(a) * v, vy = -Math.sin(a) * v; for (let k = 0; k < 9; k++) { for (let j = 0; j < 3; j++) { vx += wind * 0.016; vy += G * 0.016; x += vx * 0.016; y += vy * 0.016; } g.beginPath(); g.arc(x, y, 2, 0, 7); g.fill(); } } // 조준 도움선은 앞부분만 보여 준다
    if (shot) { g.fillStyle = '#222'; g.beginPath(); g.arc(shot.x, shot.y, 4, 0, 7); g.fill(); }
    if (boom) { g.globalAlpha = Math.max(0, 1 - boom.t * 2); g.fillStyle = boom.hit ? '#FF8A3D' : '#fff'; g.beginPath(); g.arc(boom.x, boom.y, 8 + boom.t * 50, 0, 7); g.fill(); g.globalAlpha = 1; } }
  function step(now) { if (!alive) return; const dt = Math.min(0.033, (now - last) / 1000); last = now; tt += dt;
    if (shot) { shot.vx += wind * dt; shot.vy += G * dt; shot.x += shot.vx * dt; shot.y += shot.vy * dt; if (shot.y >= SEA - 6 || shot.x < -40 || shot.x > W + 40) land(shot); }
    if (boom) { boom.t += dt; if (boom.t > 0.5) boom = null; }
    draw(); raf = requestAnimationFrame(step); }
  wrap.append(h('div', { class: 'fs-top' }, h('b', null, '🏴‍☠️ 갈매기 해적단 출현!'), ballsL), cv, msg, h('div', { class: 'bt-ctl' }, h('label', null, aL, ang), h('label', null, pL, pow)), fire);
  document.body.append(wrap); myTurn(); last = performance.now(); raf = requestAnimationFrame(step);
}
