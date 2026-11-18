// 카피백반 — 카피수퍼 옆 백반집. 하루 세 번 장사, 한 번에 손님 한 명(원테이블 식당). 퀘스트 요리도 여기서 만든다
// 재료(생선 살·작물·밥·양념)를 도마에 올리고 → 도마(날것)·냄비·프라이팬·튀김기 중 하나로 조리 → 원하는 익힘에서 꺼내 → 손님에게 바로 판다
import { h, toast, modal, ymd } from './ui.js';
import { sfx } from './sound.js';
import { FISH, TIERS } from './fishing.js';
import { cropOf } from './farm.js';

const RENT = 100, SESSIONS = 3, PER = 1; // 원테이블 식당: 한 번 장사에 손님 한 명
// 가게 평점: 날마다 5점 만점에서 시작(하루가 지나면 회복). 손님 요청을 1개 못 맞추면 -0.5, 2개 이상(또는 다른 요리·날것·탄 것)은 -1, 다 맞추면 +0.1. 3점 이하가 되면 하루 영업정지, 풀리면 다시 5점
const RATE_MAX = 5, RATE_MISS = 0.5, RATE_MISS2 = 1, RATE_GOOD = 0.1, RATE_BAN = 3, RATE_BACK = 5, BAN_MS = 86400000;
// 생선은 머리 없이 손질된 살로만 보여 준다. 이름 속 낱말로 곁들임 소품을 고른다
const FIL_KEY = [['흑진주','bpearl'],['흑요석','bpearl'],['심해등불','firefly'],['심해등대','firefly'],['반딧불','firefly'],['비눗방울','drop'],['물방울','drop'],['은방울','pearl'],['방울','drop'],['민트','mint'],['붕어빵','bungeo'],['호박엿','caramel'],['청동','metal'],['흑철갑','metal'],['성게','acorn'],['불가사리','shell'],['망치','hammer'],['얼음','ice'],['빙하','ice'],['쇄빙','ice'],['서리','ice'],['유리','ice'],
  ['젤리','jelly'],['무지개','jelly'],['오로라','jelly'],['해파리','jelly'],['솜사탕','cotton'],['솜방망이','cotton'],['구름','cotton'],['마시멜로','ghost'],['몽글','ghost'],['유령','ghost'],['해골','ghost'],['가면','ghost'],['별','star'],['은하','star'],['유성','star'],
  ['딸기','c:strawberry'],['콩','c:pea'],['유자','c:yuzu'],['감귤','c:yuzu'],['포도','c:grape'],['보라','c:grape'],['토끼귀','c:carrot'],['호박','c:squash'],['노을','c:chili'],['석양','c:chili'],['불꽃','c:chili'],['화산','c:chili'],['용암','c:chili'],['마그마','c:chili'],['열수구','c:chili'],
  ['달','moon'],['초승달','moon'],['그믐','moon'],['월식','moon'],['밤하늘','moon'],['새벽','moon'],['호두','walnut'],['레몬','lemon'],['노랑','lemon'],['단추','button'],['얼룩','button'],['솜털','feather'],['깃털','feather'],['깨소금','cookie'],['쿠키','cookie'],['풍선','balloon'],['하늘','balloon'],
  ['조약돌','pebble'],['모래','pebble'],['진흙','pebble'],['바위','pebble'],['꿀벌','honey'],['도토리','acorn'],['밤송이','acorn'],['우유','milk'],['초코','choco'],['마카롱','macaron'],['푸딩','pudding'],['카라멜','caramel'],['체리','cherry'],['팝콘','popcorn'],['바닐라','vanilla'],
  ['구슬','pearl'],['진주','pearl'],['리본','ribbon'],['줄무늬','ribbon'],['비단','ribbon'],['꽃잎','petal'],['꽃무늬','petal'],['나비','petal'],['보리차','tea'],['청자','tea'],['솔잎','pine'],['솔방울','pine'],['가시','pine'],['천년','pine'],['방긋','sunflower'],['해바라기','sunflower'],
  ['조개','shell'],['자개','shell'],['꽃게','shell'],['산호','coral'],['바람','pinwheel'],['회오리','pinwheel'],['소용돌이','pinwheel'],['폭풍','pinwheel'],['대나무','bamboo'],['갈대','bamboo'],['파도','seaweed'],['해초','seaweed'],['해마','seaweed'],['산갈치','seaweed'],['안개','drop'],['물보라','drop'],['거품','drop'],
  ['나팔','flute'],['피리','flute'],['북소리','drum'],['장구','drum'],['번개','bolt'],['천둥','bolt'],['황금','coin'],['수정','gem'],['크리스탈','gem'],['비늘','gem'],['단풍','maple'],['은행잎','ginkgo'],['강철','metal'],['무쇠','metal'],['톱날','metal'],['창날','metal'],['도끼','hammer'],
  ['그림자','ink'],['먹물','ink'],['먹구름','ink'],['심해','ink'],['왕관','crown'],['왕','crown'],['킹','crown'],['고래','shell']];
const FIL_ANY = ['lemon', 'mint', 'seaweed', 'shell'];
const RED = ['참치', '연어', '방어', '삼치', '고등어', '청새치', '황새치', '돛새치'];
export const isRed = f => RED.some(k => f.name.includes(k)) && !f.name.includes('참돔');
export function garnishOf(f) { const hit = FIL_KEY.find(([k]) => f.name.includes(k)); const g = hit ? hit[1] : FIL_ANY[[...f.name].reduce((a, c) => a + c.charCodeAt(0), 0) % FIL_ANY.length];
  return g.startsWith('c:') ? `img/farm/crop/${g.slice(2)}.webp` : `img/cook/g/${g}.webp`; }
export const filName = f => `${f.name}의 ${isRed(f) ? '붉은살' : '흰살'}생선`;
export const filGlow = (f, v) => !!(f.rare || f.king || (f.tier || 1) >= 3 || (v && (v.g === 'A' || v.g === 'S')));
export function filletEl(f, v, big) { return h('div', { class: 'ck-fil' + (big ? ' big' : '') + (filGlow(f, v) ? ' glow' : '') }, h('img', { class: 'ck-plate', src: `img/cook/fillet-${isRed(f) ? 'red' : 'white'}.webp`, alt: '' }), h('img', { class: 'ck-gar', src: garnishOf(f), alt: '' })); }


// 양념·소스: 카피수퍼에서 3번 쓸 만큼씩 판다
export const SAUCES = { salt: ['🧂', '소금', 15], soy: ['🫙', '간장', 30], doenjang: ['🫘', '된장', 30], ssamjang: ['🥬', '쌈장', 30], gochu: ['🌶️', '고춧가루', 45], pepper: ['⚫', '후추', 45], chojang: ['🥫', '초고추장', 45], herb: ['🌿', '허브', 60], butter: ['🧈', '버터', 75], tartar: ['🥚', '타르타르', 75], honey: ['🍯', '조청', 60] };
export const SAUCE_PACK = 3;
// 그림이 있는 양념은 그림으로, 없으면 이모지로
export const SAUCE_IMG = { doenjang: 'img/cook/s-doenjang.webp', ssamjang: 'img/cook/s-ssamjang.webp', gochu: 'img/cook/s-gochu.webp' };
export const sauceIc = (id, cls = '') => SAUCE_IMG[id] ? h('img', { class: 'kb-sic ' + cls, src: SAUCE_IMG[id], alt: SAUCES[id][1] }) : h('span', { class: cls }, SAUCES[id][0]);
const SWAP = ['salt', 'soy', 'gochu', 'pepper', 'herb', 'butter'];
// 조리도구: 도마(날것) · 냄비 · 프라이팬 · 튀김기. best 는 맛이 제일 좋은 불(1 약 · 2 중 · 3 강)
export const STATIONS = { board: { n: '도마', ic: '🔪', img: 'img/cook/st-board.webp', job: '날것 · 썰어 담기' }, pot: { n: '냄비', ic: '🍲', img: 'img/cook/st-pot.webp', job: '끓이기·찌기·조림', ms: 12000, best: 1 },
  pan: { n: '프라이팬', ic: '🍳', img: 'img/cook/st-pan.webp', job: '굽기·볶기·부치기', ms: 8000, best: 3 }, fry: { n: '튀김기', ic: '🍤', img: 'img/burger/fryer-big.webp', job: '튀기기', ms: 7000, best: 2, fixed: 2 } };
const FIRE = [0, 0.6, 1, 1.7], FIRE_N = ['', '약불', '중불', '강불'], DO_V = { pot: '끓인', pan: '구운' };
// 메뉴 19종: [이름, 도구, 생선(0 없음·1 초급 바다·2 중급 바다), 작물, 밥, 양념, 기본가]
const R = (id, n, st, fz, crops, rice, sauce, base) => ({ id, n, st, fz, crops, rice, sauce, base, img: `img/cook/menu/${id}.webp`, veg: !fz });
export const RECIPES = [
  R('mulhoe', '오이 물회', 'board', 2, ['cucumber'], 0, 'chojang', 480), R('sushi', '생선 초밥', 'board', 1, [], 1, 'soy', 200), R('hoedeop', '회덮밥', 'board', 2, ['lettuce', 'cucumber'], 1, 'chojang', 450),
  R('jorim', '생선 무조림', 'pot', 1, ['radish', 'onion'], 0, 'soy', 230), R('doenjang', '생선 된장국', 'pot', 1, ['spinach', 'cabbage'], 0, 'doenjang', 220), R('stew', '토마토 생선스튜', 'pot', 1, ['tomato', 'onion'], 0, 'herb', 260),
  R('maeun', '매운탕', 'pot', 2, ['chili', 'radish', 'scallion'], 0, 'gochu', 620), R('hobak', '단호박 생선찜', 'pot', 2, ['squash', 'broccoli'], 0, 'soy', 600), R('chowder', '옥수수 차우더', 'pot', 2, ['corn', 'potato', 'onion'], 0, 'butter', 580),
  R('jjin', '감자옥수수찜', 'pot', 0, ['potato', 'corn'], 0, 'salt', 170), R('hobakjuk', '단호박죽', 'pot', 0, ['squash', 'pea'], 0, 'honey', 240),
  R('ssam', '생선 상추쌈', 'pan', 1, ['lettuce'], 0, 'ssamjang', 180), R('gui', '대파 생선구이', 'pan', 2, ['scallion', 'garlic'], 0, 'salt', 520), R('gamjajeon', '감자전', 'pan', 0, ['potato', 'onion'], 0, 'soy', 120), R('gaji', '가지 대파볶음', 'pan', 0, ['eggplant', 'scallion'], 0, 'soy', 360),
  R('croq', '생선 고로케', 'fry', 1, ['potato'], 0, 'tartar', 250), R('kkaseu', '생선까스', 'fry', 1, ['cabbage'], 0, 'tartar', 210), R('mattang', '고구마 맛탕', 'fry', 0, ['sweetpotato'], 0, 'honey', 130), R('tempura', '채소튀김', 'fry', 0, ['carrot', 'sweetpotato', 'onion'], 0, 'soy', 150)];
// 메뉴 값 = 기본 600 + (생선 시세 + 작물 시세 + 양념 1번 값 + 인건비 + 조리 시간 값) × 1.6. 생선 시세는 그 바다 흔한 물고기 평균값, 작물은 B급 값(기본값 ×1.2)
const LABOR = { board: 40, pot: 70, pan: 60, fry: 70 }, TIME = { board: 20, pot: 50, pan: 40, fry: 40 }, MARGIN = 1.6, BASE_FEE = 600;
const fishAvg = z => { const L = FISH.filter(f => f.z === z && !f.king && !f.pearl && !f.icon && (f.tier || 1) <= 2); return L.length ? Math.round(L.reduce((t, f) => t + (f.price[0] + f.price[1]) / 2, 0) / L.length) : 0; };
RECIPES.forEach(r => { const fish = r.fz ? fishAvg(r.fz) : 0, crop = Math.round(r.crops.reduce((t, id) => t + ((cropOf(id) || {}).base || 0) * 1.2, 0)), sauce = Math.round(SAUCES[r.sauce][2] / SAUCE_PACK), labor = LABOR[r.st], time = TIME[r.st];
  r.cost = { fish, crop, sauce, labor, time, sum: fish + crop + sauce + labor + time }; r.base = BASE_FEE + Math.round(r.cost.sum * MARGIN / 10) * 10; });
// 요청을 다 맞췄을 때 받을 값(재료 등급 C 기준): 익힘 ×1.2 · 양념 ×1.1 · 불 조절 ×1.1. 도마(날것) 요리는 양념만
export const bestPrice = r => Math.round(r.base * (r.st === 'board' ? 1.1 : 1.2 * 1.1 * 1.1) / 10) * 10;
export const recOf = id => RECIPES.find(r => r.id === id);
// 동물 입맛(실제 식성 기준): 생선파 · 채소파 · 나머지는 잡식
export const FISHY = [1, 6, 9, 10, 16, 18, 19, 20, 24, 25, 26, 29], VEGGY = [2, 3, 4, 7, 8, 11, 12, 14, 15, 17, 22, 23, 28];
export const tasteOf = i => (FISHY.includes(i) ? 'fish' : VEGGY.includes(i) ? 'veg' : 'omni');
const TASTE_TAG = { fish: '🐟 생선파', veg: '🥕 채소파', omni: '🍽 잡식' };
const CARD = [29, 5]; // 계산할 때 카드 할부 농담을 하는 동물: 너구리 · 여우
// 익힘: 0~100+. 덜익힘 30~50 · 알맞게 50~70 · 바싹 70~88. 30 아래 날것, 88 넘으면 탐
const ZONES = [{ k: 'rare', n: '덜익힘', lo: 30, hi: 50, c: '#F2B84B' }, { k: 'mid', n: '알맞게', lo: 50, hi: 70, c: '#6CC04A' }, { k: 'well', n: '바싹', lo: 70, hi: 88, c: '#D9822B' }];
const zoneAt = v => (v < 30 ? 'raw' : v > 88 ? 'burnt' : ZONES.find(z => v >= z.lo && v < z.hi).k);
const ZN = { raw: '날것', rare: '덜익힘', mid: '알맞게', well: '바싹', burnt: '탐' };
const GRADE_X = { S: 2, A: 1.5, B: 1.2, C: 1, D: 0.9, F: 0.5 }, TIER_X = [1, 1, 1.3, 1.8, 2.5];
const pick = a => a[Math.floor(Math.random() * a.length)];
const won = n => `${Math.round(n).toLocaleString('ko-KR')}코인`;

// o = { ctx, animals:[{i,name,svg}], A(i), affinity(i,d), toned(i,t), fish(), useFish(key), barn(), useCrops(map), sauces(), useSauce(map), coins(n), cropName(id), cropImg(id),
//       quests(): [{q, i, rec}] 진행 중인 요리 퀘스트, questDone(q), onClose }
export function openCook(o) {
  const { ctx } = o, day = ymd(), ref = `cook/${ctx.uid}/${day}`; let st = {}, rate = {}, alive = true, raf = 0;
  let sess = null; // { cs:[주문], i, quest } 지금 장사 중인 손님들
  let board = [], tray = [], prep = [], selT = -1, selP = -1, tab = 'fish'; // prep = 손질해서 보관칸에 둔 재료(최대 3)
  const stn = { board: null, pot: null, pan: null, fry: null }, fire = { pot: 2, pan: 2, fry: 2 };
  let first = true; const off = ctx.store.on(ref, v => { st = v || {}; if (first) { first = false; if (!sess && st.cur && (st.cur.i || 0) < PER) sess = { ...st.cur }; } draw(); }); // 이어 하기는 처음 열 때만
  const offR = ctx.store.on(`cook/${ctx.uid}/rate`, v => { rate = v || {}; if (rate.ban && ctx.store.now() >= rate.ban) { rate = { v: RATE_BACK, day: ymd() }; ctx.store.set(`cook/${ctx.uid}/rate`, rate).catch(() => {}); } drawTop(); if (!sess) draw(); });
  const cropName = id => o.cropName(id), A = i => o.A(i), an = i => o.animals[i];

  // 가진 재료(도마에 올린 만큼은 빼고 센다)
  const onBoard = (t, key) => board.filter(b => b.t === t && b.key === key).length;
  const fishLeft = () => o.fish().filter(([k]) => !onBoard('fish', k));
  const barnLeft = () => Object.entries(o.barn() || {}).filter(([, n]) => n > 0).map(([key, n]) => ({ key, id: key.split('|')[0], g: key.split('|')[1], n: n - onBoard('crop', key) })).filter(c => c.n > 0);
  const sauceLeft = id => ((o.sauces() || {})[id] || 0) - onBoard('sauce', id);
  const haveCrop = id => barnLeft().some(c => c.id === id), haveFish = z => fishLeft().some(([, , f]) => f && (f.z || 1) >= z);
  const canMake = (r, no) => (!r.fz || haveFish(r.fz)) && r.crops.every(c => c === no || haveCrop(c)) && sauceLeft(r.sauce) > 0;

  // 손님 주문 만들기: 입맛대로 고르고, 절반쯤은 지금 만들 수 있는 메뉴로
  function makeOrder(i, quest) {
    if (quest) { const r = recOf(quest.rec); return { a: i, rec: r.id, pref: r.st === 'board' ? 'raw' : 'mid', sauce: r.sauce, sn: 1, no: null, quest: quest.q }; }
    const t = tasteOf(i), want = t === 'fish' ? Math.random() < 0.85 : t === 'veg' ? Math.random() < 0.3 : Math.random() < 0.5;
    let pool = RECIPES.filter(r => !!r.fz === want); const ok = pool.filter(r => canMake(r)); if (ok.length && Math.random() < 0.5) pool = ok;
    const r = pick(pool), pref = r.st === 'board' ? 'raw' : pick(['rare', 'mid', 'mid', 'well']);
    let sauce = r.sauce, sn = 1; const x = Math.random(); if (x < 0.2) sauce = pick(SWAP.filter(s => s !== r.sauce)); else if (x < 0.45) sn = 2;
    const no = r.crops.length >= 2 && Math.random() < 0.3 ? pick(r.crops) : null;
    // 생선 요리는 생선 이름까지 콕 집어 주문한다: 그 바다의 흔한·귀한 물고기 중에서(대장·진주 빼고), 절반쯤은 내가 가진 물고기로
    let fid = null, fany = 0; if (r.fz && Math.random() < 0.4) { const zs = [1, 1, 1, 2, 2, 3].filter(z => z >= r.fz); fany = zs.length ? pick(zs) : r.fz; } // 10명 중 4명은 '초급(중급·고급) 물고기면 다 돼'
    else if (r.fz) { const cand = FISH.filter(f => f.z === r.fz && !f.king && !f.pearl && !f.icon && (f.tier || 1) <= 2), mine = cand.filter(f => o.fish().some(([, , g]) => g && g.id === f.id)); const src = mine.length && Math.random() < 0.6 ? mine : cand; fid = src.length ? pick(src).id : null; }
    const fr = (r.st === 'pot' || r.st === 'pan') && Math.random() < 0.4 ? pick([1, 2, 3]) : 0; // 10명 중 4명은 '약불로·중불로·강불로' 콕 집어 주문
    return { a: i, rec: r.id, pref, sauce, sn, no, fid, fany, fire: fr }; }
  const ro = w => { const c = (w || '').charCodeAt(w.length - 1) - 0xAC00, j = c >= 0 && c <= 11171 ? c % 28 : 0; return w + (j && j !== 8 ? '으로' : '로'); }; // 받침 있으면 '으로'(ㄹ 받침은 '로')
  const fishOf = id => FISH.find(f => f.id === id), fishCnt = id => o.fish().filter(([k, , g]) => g && g.id === id && !onBoard('fish', k)).length, zoneCnt = z => o.fish().filter(([k, , g]) => g && (g.z || 1) >= z && !onBoard('fish', k)).length, ZNM = ['', '초급', '중급', '고급'];
  const fishNeed = od => { const r = recOf(od.rec); return !r.fz ? 0 : od.fid ? fishCnt(od.fid) : zoneCnt(od.fany || r.fz); }, fishLabel = od => { const r = recOf(od.rec); return od.fid && fishOf(od.fid) ? fishOf(od.fid).name : `${ZNM[od.fany || r.fz]} 물고기`; };
  const reqTags = od => { const r = recOf(od.rec), S = SAUCES[od.sauce], out = []; if (od.fid && fishOf(od.fid)) out.push(['fish', `🐟 ${ro(fishOf(od.fid).name)}`]); else if (od.fany) out.push(['fish', `🐟 ${ZNM[od.fany]} 물고기면 다 돼`]);
    out.push(['', od.pref === 'raw' ? '🧊 날것 그대로' : `🔥 ${ZN[od.pref]}`]);
    if (od.fire) out.push(['fire', `${['', '🕯️', '🔥', '🌋'][od.fire]} ${FIRE_N[od.fire]}로 ${DO_V[r.st] || '익힌'} 게 좋아`]);
    if (od.sauce !== r.sauce) out.push(['hot', `${S[0]} ${ro(S[1])} 바꿔`]); else out.push(['', `${S[0]} ${S[1]}${od.sn > 1 ? ' 듬뿍(×2)' : ''}`]);
    if (od.no) out.push(['no', `✕ ${cropName(od.no)} 빼기`]);
    return out; };

  // 화면
  const coinsEl = h('span', { class: 'kb-coins' }), rateEl = h('span', { class: 'kb-rate' });
  const top = h('div', { class: 'kb-top' }, h('b', null, '🍚 카피백반'), rateEl, coinsEl, h('button', { class: 'top-x', 'aria-label': '닫기', onClick: () => close() }, '✕'));
  const body = h('div', { class: 'kb-body' });
  const wrap = h('div', { class: 'kb' }, top, body);
  document.body.append(wrap);
  const banned = () => rate.ban && ctx.store.now() < rate.ban, rateV = () => (rate.v == null || (!banned() && rate.day !== ymd()) ? RATE_MAX : rate.v); // 날이 바뀌면 5점으로
  function drawTop() { coinsEl.textContent = '🪙 ' + ctx.coins().toLocaleString('ko-KR'); rateEl.textContent = banned() ? '🚫 영업정지' : `★ ${rateV().toFixed(1)} / 5`; rateEl.classList.toggle('low', rateV() <= 3.5); }
  // 평점 바꾸기: 3점 이하가 되면 그 자리에서 영업정지(장사 중이면 바로 문 닫음)
  async function rateBy(dv) { const v = Math.max(0, Math.min(RATE_MAX, Math.round((rateV() + dv) * 10) / 10)), ban = v <= RATE_BAN ? ctx.store.now() + BAN_MS : null;
    rate = { ...rate, v, day: ymd(), ...(ban ? { ban } : {}) }; await ctx.store.set(`cook/${ctx.uid}/rate`, rate).catch(() => {}); drawTop(); return !!ban; }

  function draw() { if (!alive) return; drawTop(); if (sess) drawKitchen(); else drawLobby(); }

  // 로비: 가게 문 열기 · 장사 시작 · 퀘스트 요리 · 레시피북
  function drawLobby() {
    const open = !!st.rent, n = st.n || 0, qs = (o.quests ? o.quests() : []);
    const stage = h('div', { class: 'kb-cust lobby' }, h('span', { class: 'kb-sign' }, '카피백반'), h('div', { class: 'kb-counter' }));
    const kids = [stage];
    kids.push(h('div', { class: 'ck-rent' + (open ? ' paid' : '') }, h('span', null, '🏪'), h('div', null, h('b', null, open ? `오늘 장사 중 · ${n}/${SESSIONS}번 했어요` : '오늘 가게 문 열기'), h('small', null, open ? `오늘 매출 ${won(st.sales || 0)}` : `장사를 하려면 하루 임대료 ${RENT}코인을 내야 해요.`)),
      !open && h('button', { class: 'btn primary sm', onClick: payRent }, `${RENT}코인 내기`)));
    if (banned()) { const left = Math.max(0, rate.ban - ctx.store.now()), tm = Math.ceil(left / 60000), hh = Math.floor(tm / 60), mm = tm % 60;
      kids.push(h('div', { class: 'kb-ban' }, h('span', null, '🚫'), h('div', null, h('b', null, '영업정지 중'), h('small', null, `가게 평점이 ${RATE_BAN}점 이하로 떨어졌어요. ${hh ? hh + '시간 ' : ''}${mm ? mm + '분 ' : ''}뒤에 평점 5점으로 회복되고 다시 열어요.`)))); }
    else kids.push(h('button', { class: 'btn primary big kb-start', disabled: !open || n >= SESSIONS, onClick: startSession }, n >= SESSIONS ? '오늘 장사는 끝! 내일 또 와요' : `🔔 장사 시작 (${n + 1}번째 · 손님 ${PER}명)`));
    if (!banned() && n < SESSIONS) { ensureNext(); const nx = Array.isArray(st.next) ? st.next.slice(0, PER) : [];
      if (nx.length) stage.append(h('div', { class: 'kb-wq' }, ...nx.map(od => h('div', { class: 'kb-wqa', html: an(od.a).svg }, h('i', null, '💭')))));
      if (nx.length) kids.push(h('b', { class: 'kb-h' }, `⏳ 기다리는 손님 · ${n + 1}번째 장사`), h('p', { class: 'dim kb-wtip' }, '장사를 시작하면 이 손님들이 와요. 재료를 미리 준비하세요! 눌러서 레시피 보기'),
        ...nx.map(od => { const r = recOf(od.rec), a = an(od.a), fishN = fishNeed(od), cropN = id => Object.entries(o.barn() || {}).filter(([k, v]) => k.split('|')[0] === id && v > 0).reduce((t, [, v]) => t + v, 0), sN = ((o.sauces() || {})[od.sauce] || 0);
          const need = [r.fz && h('i', { class: fishN ? 'ok' : 'no' }, od.fid && fishOf(od.fid) ? `🐟 ${fishOf(od.fid).name} (${r.fz >= 2 ? '중급' : '초급'})` : `🐟 ${fishLabel(od)} 아무거나`), ...r.crops.filter(c => c !== od.no).map(c => h('i', { class: cropN(c) ? 'ok' : 'no' }, h('img', { src: o.cropImg(c), alt: '' }), cropName(c))), r.rice && h('i', { class: 'ok' }, '🍚 밥'), h('i', { class: sN >= od.sn ? 'ok' : 'no' }, sauceIc(od.sauce), `${SAUCES[od.sauce][1]}${od.sn > 1 ? ' ×2' : ''}`)].filter(Boolean);
          const ready = (!r.fz || fishN) && r.crops.every(c => c === od.no || cropN(c)) && sN >= od.sn;
          return h('button', { class: 'kb-wait' + (ready ? ' ready' : ''), onClick: () => recipeFor(od) }, h('div', { class: 'kb-wan', html: a.svg }), h('div', { class: 'kb-wbody' }, h('b', null, `${a.name} · ${r.n}`), h('div', { class: 'kb-tags' }, ...reqTags(od).map(([c, t]) => h('i', { class: c }, t))), h('div', { class: 'kb-need' }, ...need), h('small', { class: ready ? 'ok' : 'no' }, ready ? '✅ 준비 완료' : '❌ 재료가 모자라요')), h('div', { class: 'kb-wpr' }, h('img', { class: 'kb-wimg', src: r.img, alt: '' }), h('b', null, `💰 ${won(bestPrice(r))}`), h('small', null, '요청을 다 맞추면'))); }),
        h('button', { class: 'btn sm kb-skip', onClick: skipNext }, `🔄 이 손님 넘기기 · 장사 기회 1번 써요 (남은 기회 ${SESSIONS - n}번)`)); }
    if (qs.length) kids.push(h('b', { class: 'kb-h' }, '🔍 퀘스트 요리'), ...qs.map(q => { const r = recOf(q.rec); return h('button', { class: 'kb-qrow', onClick: () => startQuest(q) }, h('img', { src: r.img, alt: '' }), h('div', null, h('b', null, `${an(q.i).name}에게 ${r.n}`), h('small', null, '임대료 없이 만들 수 있어요 · 다 만들면 그 동물에게 가서 퀘스트 완료')), h('span', null, '만들기 ›')); }));
    kids.push(h('div', { class: 'kb-row2' }, h('button', { class: 'btn', onClick: recipeBook }, '📖 레시피북'), h('button', { class: 'btn', onClick: pantry }, '🧂 내 양념')));
    kids.push(h('p', { class: 'dim kb-tip' }, `가게 평점은 5점 만점이고 하루가 지나면 회복돼요. 손님 요청을 1개 못 맞추면 -${RATE_MISS}, 2개 이상 못 맞추면 -${RATE_MISS2}(0코인), 다 맞추면 +${RATE_GOOD}. ${RATE_BAN}점 이하가 되면 하루 영업정지예요. 손님마다 원하는 익힘·양념·뺄 재료가 달라요.` + ' 생선은 낚시로, 작물은 농장에서, 양념은 카피수퍼에서 구해요. 재료가 없으면 "다음에 다시 오세요"로 돌려보내요(평점은 그대로).'));
    body.replaceChildren(...kids); }
  async function payRent() { if (st.rent) return; if (!(await ctx.spend(RENT))) return toast(`돈이 모자라요 (${RENT}코인 필요)`); st = { ...st, rent: ctx.store.now() }; await ctx.store.update(ref, { rent: st.rent }).catch(() => {}); sfx('coin'); toast('가게 문을 열었어요! 🍚', 1600); draw(); }
  // 다음 장사에 올 손님을 미리 정해 둔다(로비에서 메뉴·재료를 보고 미리 준비할 수 있게). 장사를 시작하면 이 손님들이 그대로 온다
  const newCust = () => { const all = o.animals.map(a => a.i).filter(i => A(i) > -30), cs = []; while (cs.length < PER) { const i = pick(all); if (!cs.some(c => c.a === i)) cs.push(makeOrder(i)); } return cs; };
  let nextBusy = false; function ensureNext() { if (nextBusy || st.next || banned() || (st.n || 0) >= SESSIONS) return; nextBusy = true; st = { ...st, next: newCust() }; ctx.store.update(ref, { next: st.next }).catch(() => {}).finally(() => { nextBusy = false; }); }
  // 주문이 마음에 안 들면 다음 손님으로 넘긴다: 그 대신 오늘 장사 기회 1번을 쓴다
  function skipNext() { const n = st.n || 0; if (n >= SESSIONS) return;
    modal({ title: '🔄 다음 손님으로 넘길까요?', body: [h('p', { class: 'center' }, `이 손님을 돌려보내고 다음 손님을 불러요.`), h('p', { class: 'center' }, h('b', null, `오늘 장사 기회 1번을 써요 (${SESSIONS - n}번 → ${SESSIONS - n - 1}번)`)), h('p', { class: 'center dim' }, '평점과 친밀도는 그대로예요.')],
      actions: [{ label: '그만두기' }, { label: '넘기기', primary: true, onClick: c => { c(); const nn = n + 1; st = { ...st, n: nn, next: null }; ctx.store.update(ref, { n: nn, next: null }).catch(() => {}); sfx('pop'); toast(nn >= SESSIONS ? '오늘 장사 기회를 다 썼어요' : `다음 손님이 왔어요 · 남은 기회 ${SESSIONS - nn}번`, 1800); draw(); } }] }); }
  function startSession() { if (banned()) return toast('영업정지 중이에요'); if (!st.rent) return toast('먼저 임대료를 내요'); if ((st.n || 0) >= SESSIONS) return;
    const cs = Array.isArray(st.next) && st.next.length ? st.next.slice(0, PER) : newCust(); st = { ...st, next: null }; ctx.store.update(ref, { next: null }).catch(() => {});
    sess = { cs, i: 0 }; resetKitchen(); ctx.store.update(ref, { cur: { ...sess } }).catch(() => {}); sfx('point'); draw(); }
  function startQuest(q) { sess = { cs: [makeOrder(q.i, q)], i: 0, quest: 1 }; resetKitchen(); draw(); }
  function resetKitchen() { board = []; tray = []; prep = []; selT = -1; selP = -1; Object.keys(stn).forEach(k => { stn[k] = null; }); }

  // 조리실
  const stEls = {};
  function drawKitchen() {
    const od = sess.cs[sess.i]; if (!od) { setTimeout(endSession); return; } const r = recOf(od.rec), a = an(od.a);
    const cust = h('div', { class: 'kb-cust' }, h('div', { class: 'kb-an', html: a.svg }), h('span', { class: 'kb-nm' }, `${a.name} ${TASTE_TAG[tasteOf(od.a)].split(' ')[0]}`),
      h('button', { class: 'kb-bub', onClick: () => recipeFor(od) }, h('i', { class: 'kb-bubhint' }, '📖 눌러서 레시피'), h('img', { src: r.img, alt: '' }), h('div', null, h('b', null, r.n), h('div', { class: 'kb-tags' }, ...reqTags(od).map(([c, t]) => h('i', { class: c }, t))))),
      !od.quest && h('button', { class: 'kb-nope', onClick: () => noStock() }, '🙇 다음에 다시 오세요'), h('div', { class: 'kb-counter' }));
    const status = h('div', { class: 'kb-status' }, h('span', null, sess.quest ? '🔍 퀘스트 요리' : `🔔 ${(st.n || 0) + 1}번째 장사 · 손님 ${sess.i + 1}/${sess.cs.length}`), h('button', { class: 'kb-mini', onClick: recipeBook }, '📖'));
    const trayEl = h('div', { class: 'kb-tray', onClick: () => { if (selP >= 0) putPrep(selP, 'tray'); } }, ...[0, 1, 2].map(k => { const d = tray[k]; return d ? h('button', { class: 'kb-dish' + (selT === k ? ' on' : ''), onClick: () => { selT = selT === k ? -1 : k; draw(); } }, h('img', { src: d.img, alt: '' }), h('small', null, `${d.name}${d.rec && d.zone !== 'raw' ? ' · ' + ZN[d.zone] : ''}`)) : h('div', { class: 'kb-slot' }, k ? '' : '완성 요리'); }));
    const grid = h('div', { class: 'kb-st' }, ...Object.keys(STATIONS).map(stationEl));
    const prepEl = h('div', { class: 'kb-prep' }, h('small', null, '🔪 손질한 재료 · 끌어서 냄비·팬·튀김기에 넣거나, 날것 요리는 위 완성 칸에 담아요'), h('div', { class: 'kb-prow' }, ...[0, 1, 2].map(k => { const p = prep[k];
      return p ? h('div', { class: 'kb-pi2' + (selP === k ? ' on' : ''), 'data-p': k, onPointerdown: e => dragPrep(e, k) }, h('div', { class: 'kb-pimgs' }, ...p.pics.slice(0, 4).map((src, j) => h('span', { class: 'kb-cutp', style: { transform: `rotate(${[-14, 9, -4, 15][j]}deg) translateY(${[2, -3, 1, -2][j]}px)` } }, h('img', { src, alt: '', draggable: 'false', class: 'l' }), h('img', { src, alt: '', draggable: 'false', class: 'r' })))), h('small', null, p.label)) : h('div', { class: 'kb-pslot' }, k ? '' : '손질 칸'); })));
    const tabs = h('div', { class: 'kb-tabs' }, ...[['fish', '🐟 생선'], ['crop', '🥕 채소·밥'], ['sauce', '🧂 양념']].map(([k, t]) => h('button', { class: tab === k ? 'on' : '', onClick: () => { tab = k; draw(); } }, t)));
    const items = h('div', { class: 'kb-items' }, ...itemList());
    const btns = h('div', { class: 'kb-btns' }, h('button', { class: 'sm', title: '도마 비우기', onClick: () => { board = []; draw(); } }, '↩'), h('button', { class: 'sm', title: '고른 요리 버리기', onClick: trash }, '🗑'),
      h('button', { class: 'go', onClick: serve }, sess.quest ? '🍽 완성! 건네기' : '🍽 손님에게 팔기'));
    body.replaceChildren(status, cust, trayEl, grid, prepEl, tabs, items, btns); tick(); }
  function stationEl(k) { const S = STATIONS[k], s = stn[k], od = (sess && sess.cs[sess.i]) || {}, r = od.rec ? recOf(od.rec) : {};
    const kids = [h('img', { class: 'kb-stimg', src: S.img, alt: '' })];
    if (k === 'board') { // 도마: 재료 그림을 그대로 올려 둔다(누르면 내린다) · 손질하기 버튼
      if (board.length) kids.push(h('div', { class: 'kb-on' }, ...board.map((b, j) => { const [x, y, r] = SPOT[j % SPOT.length]; return h('span', { class: 'kb-raw', style: { left: x + '%', top: y + '%', transform: `translate(-50%, -50%) rotate(${r}deg)` }, onClick: e => { e.stopPropagation(); board.splice(j, 1); draw(); } }, rawFace(b)); })));
      kids.push(board.length ? h('span', { class: 'kb-cut', onClick: e => { e.stopPropagation(); prepBoard(); } }, '🔪 손질하기') : h('span', { class: 'kb-lb' }, '🔪 도마 · 아래에서 재료를 눌러 올려요')); }
    else { if (s) kids.push(h('img', { class: 'kb-cooking', src: s.dish.img, alt: '' }), h('i', { class: 'kb-gauge' }, h('em', { class: 'kb-want', style: { left: wantAt(k) + '%' } }, '▼'), h('b')));
      if (!S.fixed) kids.push(h('span', { class: 'kb-fire' }, ...[1, 2, 3].map(f => h('button', { class: (fire[k] === f ? 'on' : '') + (sess && sess.cs[sess.i] && sess.cs[sess.i].fire === f && recOf(sess.cs[sess.i].rec).st === k ? ' want' : ''), onClick: e => { e.stopPropagation(); fire[k] = f; draw(); } }, FIRE_N[f][0]))));
      kids.push(h('span', { class: 'kb-lb' }, s ? h('b', { class: 'kb-z' }) : `${S.ic} ${S.n} · ${S.job}${od.fire && r.st === k ? ` · 손님은 ${FIRE_N[od.fire]}!` : S.best ? ` · ${FIRE_N[S.best]} 추천` : ''}`)); }
    const el = h('button', { class: 'kb-s ' + k + (s ? ' busy' : ''), onClick: () => useStation(k) }, ...kids); stEls[k] = el; return el; }
  const SPOT = [[30, 34, -8], [58, 30, 6], [42, 56, 4], [70, 54, -5], [24, 62, 10], [54, 72, -3], [78, 30, 8], [36, 22, -4]]; // 도마 위 재료 자리
  const rawFace = b => b.t === 'fish' ? h('img', { class: 'kb-rawi fish', src: `img/cook/fil-${isRed(b.f) ? 'red' : 'white'}.webp`, alt: '', draggable: 'false' }) : b.t === 'crop' ? h('img', { class: 'kb-rawi', src: o.cropImg(b.id), alt: '', draggable: 'false' }) : b.t === 'rice' ? h('b', { class: 'kb-rawe' }, '🍚') : (SAUCE_IMG[b.key] ? h('img', { class: 'kb-rawi', src: SAUCE_IMG[b.key], alt: '', draggable: 'false' }) : h('b', { class: 'kb-rawe' }, SAUCES[b.key][0]));
  const wantAt = k => { const od = sess && sess.cs[sess.i], z = od && ZONES.find(x => x.k === od.pref); return z ? (z.lo + z.hi) / 2 : -99; };
  const chipFace = b => b.t === 'fish' ? h('img', { src: `img/cook/fillet-${isRed(b.f) ? 'red' : 'white'}.webp`, alt: '' }) : b.t === 'crop' ? h('img', { src: o.cropImg(b.id), alt: '' }) : b.t === 'rice' ? h('span', null, '🍚') : sauceIc(b.key);
  function itemList() {
    if (tab === 'fish') { const L = fishLeft(); return L.length ? L.map(([key, v, f]) => h('button', { class: 'kb-it' + (filGlow(f, v) ? ' glow' : ''), onClick: () => add({ t: 'fish', key, v, f }) }, filletEl(f, v), h('small', null, `${f.name}${v.g ? ' ' + v.g : ''}`), h('em', null, f.z >= 2 ? '중급 바다' : '초급 바다'))) : [h('p', { class: 'dim kb-empty' }, '가방에 물고기가 없어요. 낚시로 잡아 오세요.')]; }
    if (tab === 'crop') return [h('button', { class: 'kb-it', onClick: () => add({ t: 'rice', key: 'rice' }) }, h('span', { class: 'kb-emo' }, '🍚'), h('small', null, '공깃밥'), h('em', null, '무료')),
      ...barnLeft().map(c => h('button', { class: 'kb-it', onClick: () => add({ t: 'crop', key: c.key, id: c.id, g: c.g }) }, h('img', { src: o.cropImg(c.id), alt: '' }), h('small', null, `${cropName(c.id)} ${c.g}`), h('em', null, `×${c.n}`)))];
    return Object.entries(SAUCES).map(([id, [ic, nm]]) => { const n = sauceLeft(id); return h('button', { class: 'kb-it' + (n > 0 ? '' : ' off'), onClick: () => n > 0 ? add({ t: 'sauce', key: id }) : toast(`${nm}이(가) 없어요. 카피수퍼에서 사 와요`) }, sauceIc(id, 'kb-emo'), h('small', null, nm), h('em', null, `×${Math.max(0, n)}`)); }); }
  function add(b) { if (board.length >= 8) return toast('도마가 꽉 찼어요'); if (b.t === 'fish' && board.some(x => x.t === 'fish')) return toast('생선은 한 번에 하나만 올려요'); if (b.t === 'rice' && board.some(x => x.t === 'rice')) return toast('밥은 한 공기면 돼요');
    if (b.t === 'crop' && board.some(x => x.t === 'crop' && x.id === b.id)) return toast('같은 작물은 하나만 올려요'); board.push(b); sfx('tock'); draw(); }

  // 도마의 재료로 무슨 요리가 되는지 맞춘다. 손님이 뺀 재료 하나는 없어도 그 요리로 친다
  function identifyFrom(ing, stk) { const fish = ing.fish ? { f: ing.fish } : null, crops = ing.crops, rice = ing.rice;
    let best = null; RECIPES.filter(r => r.st === stk).forEach(r => { if (!!r.fz !== !!fish || (fish && (fish.f.z || 1) < r.fz) || !!r.rice !== rice) return; if (crops.some(c => !r.crops.includes(c))) return;
      const miss = r.crops.filter(c => !crops.includes(c)); if (miss.length > 1 || (!crops.length && r.crops.length)) return; if (!best || miss.length < best.miss.length) best = { r, miss }; });
    return best; }
  // 조리도구 누르기: 익고 있으면 꺼낸다. 손질한 재료를 골라 두었으면(selP) 그걸 넣는다
  function useStation(k) {
    const s = stn[k];
    if (k !== 'board' && s) { // 꺼내기
      if (tray.length >= 3) return toast('완성 칸이 꽉 찼어요. 먼저 내거나 버려요');
      const z = zoneAt(s.d), tot = s.fireT[1] + s.fireT[2] + s.fireT[3], good = tot > 0 && s.fireT[STATIONS[k].best] / tot >= 0.6, share = [0, 1, 2, 3].map(f => tot > 0 && f ? s.fireT[f] / tot : 0); tray.push({ ...s.dish, zone: z, fireGood: good, share }); stn[k] = null; selT = tray.length - 1; sfx(z === 'burnt' ? 'bad' : 'pop'); draw(); doneFx(s.dish, z); return; }
    if (selP >= 0) return putPrep(selP, k);
    if (k === 'board') return toast(board.length ? '🔪 손질하기를 눌러요' : '아래에서 재료를 눌러 도마에 올려요');
    toast(prep.length ? '손질한 재료를 끌어서 넣어요' : '도마에서 재료를 먼저 손질해요'); }
  // 손질하기: 도마 재료를 실제로 쓰고(가방·헛간·양념에서 뺀다) 손질 칸에 담는다
  async function prepBoard() { if (!board.length) return; if (prep.length >= 3) return toast('손질 칸이 꽉 찼어요. 먼저 조리해요');
    const fish = board.find(b => b.t === 'fish'), crops = board.filter(b => b.t === 'crop'), rice = board.some(b => b.t === 'rice'), sauce = {};
    board.filter(b => b.t === 'sauce').forEach(b => { sauce[b.key] = (sauce[b.key] || 0) + 1; });
    if (fish) o.useFish(fish.key); if (crops.length) await o.useCrops(Object.fromEntries(crops.map(c => [c.key, 1]))); if (Object.keys(sauce).length) await o.useSauce(sauce);
    const ing = { fish: fish ? fish.f : null, crops: crops.map(c => c.id), rice }, grades = [fish && fish.v.g, ...crops.map(c => c.g)].filter(Boolean), gx = grades.length ? grades.reduce((t, g) => t + (GRADE_X[g] || 1), 0) / grades.length : 1;
    const guess = ['pot', 'pan', 'fry', 'board'].map(st => identifyFrom(ing, st)).find(Boolean);
    const pics = [...(fish ? [`img/cook/fil-${isRed(fish.f) ? 'red' : 'white'}.webp`] : []), ...crops.map(c => o.cropImg(c.id))];
    prep.push({ ing, sauce, gx, tx: fish ? TIER_X[fish.f.tier || 1] : 1, pics: pics.length ? pics : ['img/cook/fishdish.webp'], label: guess ? `${guess.r.n} 재료` : '손질한 재료' });
    board = []; selP = prep.length - 1; sfx('tock'); setTimeout(() => sfx('tock'), 120); draw(); }
  // 손질한 재료를 조리도구에 넣는다(날것 요리는 완성 칸에 바로 담는다)
  function putPrep(i, k) { const p = prep[i]; if (!p) return;
    if (k === 'tray') { if (tray.length >= 3) return toast('완성 칸이 꽉 찼어요'); const m = identifyFrom(p.ing, 'board'); const dd = dishOf(p, m); tray.push({ ...dd, zone: 'raw', fireGood: true }); prep.splice(i, 1); selP = -1; selT = tray.length - 1; sfx('pop'); draw(); doneFx(dd, 'raw'); return; }
    if (k === 'board') return toast('날것 요리는 위 완성 칸에 끌어 담아요');
    if (stn[k]) return toast(`${STATIONS[k].n}에서 아직 익는 중이에요`);
    const m = identifyFrom(p.ing, k); stn[k] = { dish: dishOf(p, m), d: 0, fireT: { 1: 0, 2: 0, 3: 0 } }; prep.splice(i, 1); selP = -1; sfx(k === 'fry' ? 'sear' : 'splash'); draw(); }
  // 요리 완성 연출: 화면 가운데에 완성된 요리가 빛줄기·반짝이와 함께 튀어나온다
  function doneFx(dish, z) { const bad = z === 'burnt' || (!dish.rec), fx = h('div', { class: 'kb-done' + (bad ? ' bad' : '') }, h('i', { class: 'kb-rays' }), h('img', { src: dish.img, alt: '' }), h('b', null, bad ? (z === 'burnt' ? '앗, 탔어요…' : '정체불명 요리…') : `${dish.name} 완성!`), h('small', null, z === 'raw' ? '날것 그대로' : ZN[z]),
      ...(bad ? [] : Array.from({ length: 12 }, (_, k) => h('em', { class: 'kb-spark', style: { '--a': (k * 30) + 'deg', animationDelay: (k % 3) * 0.08 + 's' } }, k % 3 ? '✦' : '✨'))));
    document.body.append(fx); sfx(bad ? 'bad' : 'bigfish'); setTimeout(() => fx.classList.add('out'), 1300); setTimeout(() => fx.remove(), 1750); }
  const dishOf = (p, m) => { const r = m && m.r; return { rec: r ? r.id : null, name: r ? r.n : '정체불명 요리', img: r ? r.img : 'img/cook/fishdish.webp', miss: m ? m.miss : [], crops: p.ing.crops, fid: p.ing.fish ? p.ing.fish.id : null, fz: p.ing.fish ? p.ing.fish.z || 1 : 0, sauce: p.sauce, gx: p.gx, tx: p.tx }; };
  // 끌어다 넣기: 손질 칸 재료를 누른 채 조리도구(또는 완성 칸) 위로 끌어 놓는다. 그냥 누르면 골라 두기
  function dragPrep(e, i) { e.preventDefault(); const src = e.currentTarget, x0 = e.clientX, y0 = e.clientY; let ghost = null;
    const move = ev => { if (!ghost && Math.hypot(ev.clientX - x0, ev.clientY - y0) > 8) { ghost = src.querySelector('.kb-pimgs').cloneNode(true); ghost.classList.add('kb-ghost'); document.body.append(ghost); src.classList.add('lift'); }
      if (ghost) { ghost.style.left = ev.clientX + 'px'; ghost.style.top = ev.clientY + 'px'; const t = document.elementFromPoint(ev.clientX, ev.clientY), st = t && t.closest('.kb-s, .kb-tray'); document.querySelectorAll('.kb-drop').forEach(x => x.classList.remove('kb-drop')); if (st) st.classList.add('kb-drop'); } };
    const up = ev => { window.removeEventListener('pointermove', move); window.removeEventListener('pointerup', up); window.removeEventListener('pointercancel', up); document.querySelectorAll('.kb-drop').forEach(x => x.classList.remove('kb-drop'));
      if (!ghost) { selP = selP === i ? -1 : i; draw(); if (selP >= 0) toast('넣을 조리도구를 눌러요', 1100); return; }
      ghost.remove(); src.classList.remove('lift'); const t = document.elementFromPoint(ev.clientX, ev.clientY), st = t && t.closest('.kb-s, .kb-tray'); if (!st) return; const k = st.classList.contains('kb-tray') ? 'tray' : ['board', 'pot', 'pan', 'fry'].find(x => st.classList.contains(x)); if (k) putPrep(i, k); };
    window.addEventListener('pointermove', move); window.addEventListener('pointerup', up); window.addEventListener('pointercancel', up); }
  function trash() { if (selT >= 0 && tray[selT]) { tray.splice(selT, 1); selT = -1; sfx('bad'); draw(); } else toast('버릴 완성 요리를 먼저 골라요'); }

  // 익히기: 불 세기에 따라 빨리 익는다. 0.25초마다 고리와 글씨만 고친다
  let last = performance.now();
  function loop(t) { if (!alive) return; const dt = Math.min(0.2, (t - last) / 1000); last = t;
    Object.entries(stn).forEach(([k, s]) => { if (!s || k === 'board') return; const S = STATIONS[k], f = S.fixed || fire[k]; s.d += dt * 1000 / S.ms * 100 * FIRE[f]; s.fireT[f] += dt; });
    tick(); raf = requestAnimationFrame(loop); }
  function tick() { Object.entries(stn).forEach(([k, s]) => { const el = stEls[k]; if (!s || !el || !el.isConnected) return; const gb = el.querySelector('.kb-gauge b'), z = el.querySelector('.kb-z'), zone = zoneAt(s.d);
    if (gb) gb.style.left = Math.min(100, s.d).toFixed(1) + '%'; if (z) z.textContent = `${s.dish.name} · ${ZN[zone]}${zone === 'burnt' ? ' 💨' : ''} · 눌러서 꺼내기`; el.classList.toggle('smoke', zone === 'burnt'); }); }

  // 손님에게 내기: 맞는 요리인지, 익힘·양념·뺀 재료를 보고 값과 별점을 매긴다
  async function serve() {
    const od = sess.cs[sess.i]; if (!od) return; const d = tray[selT >= 0 ? selT : 0]; if (!d) return toast('완성된 요리가 없어요. 조리도구에서 꺼내 와요');
    tray.splice(selT >= 0 ? selT : 0, 1); selT = -1; const r = recOf(od.rec), a = an(od.a); let mul = 1; const why = [], bill = [];
    const wrong = d.rec !== od.rec, ruined = !wrong && r.st !== 'board' && (d.zone === 'raw' || d.zone === 'burnt');
    if (!wrong && !ruined) {
      if (r.st !== 'board') { if (d.zone === od.pref) { mul *= 1.2; bill.push([`🔥 ${ZN[od.pref]} 익힘 딱 맞음`, 1.2]); } else { mul *= 0.8; why.push(`${ZN[od.pref]} 원했는데 ${ZN[d.zone]}`); bill.push([`🔥 익힘이 달라요 (${ZN[d.zone]})`, 0.8]); } }
      const want = { [od.sauce]: od.sn }, same = Object.keys(want).length === Object.keys(d.sauce).length && Object.entries(want).every(([k, n]) => d.sauce[k] === n);
      if (same) { mul *= 1.1; bill.push([`${SAUCES[od.sauce][0]} 양념 딱 맞음`, 1.1]); } else { mul *= 0.85; why.push(Object.keys(d.sauce).length ? '양념이 달라' : '양념이 없어'); bill.push(['🧂 양념이 달라요', 0.85]); }
      const noOk = od.no ? d.miss.length === 1 && d.miss[0] === od.no : !d.miss.length; if (!noOk) { mul *= 0.7; why.push(od.no && !d.miss.length ? `${cropName(od.no)} 빼 달라고 했는데` : '재료가 하나 빠졌어'); bill.push([od.no && !d.miss.length ? `✕ ${cropName(od.no)} 안 뺐어요` : '재료가 하나 빠졌어요', 0.7]); }
      if (od.fany && (d.fz || 0) < od.fany) { mul *= 0.85; why.push(`${ZNM[od.fany]} 물고기로 해 달라고 했는데`); bill.push([`🐟 ${ZNM[od.fany]} 물고기가 아니에요`, 0.85]); }
      if (od.fid && d.fid !== od.fid) { mul *= 0.85; why.push(`${ro(fishOf(od.fid) ? fishOf(od.fid).name : '그 생선')} 해 달라고 했는데`); bill.push([`🐟 ${fishOf(od.fid) ? fishOf(od.fid).name : '그 생선'}이 아니에요`, 0.85]); }
      if (od.fire && r.st !== 'board') { const f = FIRE_N[od.fire]; if ((d.share || [])[od.fire] >= 0.6) { mul *= 1.1; bill.push([`🔥 ${f}로 딱 맞게`, 1.1]); } else { mul *= 0.85; why.push(`${ro(f)} 해 달라고 했는데`); bill.push([`🔥 ${f}이 아니에요`, 0.85]); } }
      else if (d.fireGood && r.st !== 'board') { mul *= 1.1; bill.push(['👨‍🍳 불 조절 완벽', 1.1]); } }
    // 요청을 2개 이상 못 맞추면(또는 다른 요리·날것·탄 것) 0원
    const fail = wrong || ruined || why.length >= 2, stars = fail ? (wrong ? 1 : 2) : why.length ? 4 : 5;
    const price = fail ? 0 : Math.round(r.base * d.gx * d.tx * mul);
    if (d.gx !== 1) bill.unshift([`🥇 재료 등급`, Math.round(d.gx * 100) / 100]); if (d.tx !== 1) bill.unshift([`🐟 귀한 생선`, d.tx]);
    const aff = fail ? (A(od.a) >= 60 ? 0 : -1) : 5;
    const quest = sess.quest, ok = !wrong && !ruined;
    if (quest) { if (ok) { await o.questDone(od.quest); sfx('bigfish'); } else sfx('bad');
      modal({ title: ok ? `${r.n} 완성! 🔍` : '다시 만들어야 해요', body: [h('div', { class: 'ck-res' + (ok ? '' : ' bad') }, h('img', { src: d.img, alt: '' }), h('span', { class: 'ck-an', html: a.svg })),
        h('p', { class: 'center' }, h('b', null, `${a.name}: "${o.toned(od.a, ok ? `고마워! ${r.n} 잘 받았어. 이따 나한테 와 줘!` : wrong ? `이건 ${r.n}이(가) 아닌데…?` : '앗, 제대로 익지 않았어…')}"`)),
        h('p', { class: 'center dim' }, ok ? '퀘스트 요리를 완성했어요. 동물에게 가서 퀘스트를 완료하세요.' : '맞는 요리를, 날것이나 타지 않게 다시 만들어 주세요.')], actions: [{ label: '다음', primary: true }], onClose: () => nextCust(!ok) }); return; }
    const dv = fail ? -RATE_MISS2 : why.length ? -RATE_MISS : RATE_GOOD, ban = await rateBy(dv);
    if (aff) o.affinity(od.a, aff);
    const rateLine = h('p', { class: 'center kb-rd' + (dv < 0 ? ' down' : '') }, dv < 0 ? `${fail ? (why.length >= 2 ? `요청을 ${why.length}개 못 맞췄어요` : '요리를 망쳤어요') : '요청을 1개 못 맞췄어요'} · 가게 평점 ${dv} → ★ ${rateV().toFixed(1)}` : `요청을 다 맞췄어요 · 가게 평점 +${RATE_GOOD} → ★ ${rateV().toFixed(1)}`);
    const after = () => (ban ? closeShop() : nextCust(false));
    if (fail) { sfx('bad'); const say = wrong ? `이건 ${r.n}이(가) 아닌데…?` : ruined ? (d.zone === 'burnt' ? '콜록콜록… 다 탔잖아…' : '으앗, 아직 날것이잖아…') : `음… ${why.join(', ')}. 이건 돈 못 내겠어.`;
      modal({ title: `${'★'.repeat(stars)}${'☆'.repeat(5 - stars)}`, body: [h('div', { class: 'ck-res bad' }, h('img', { src: d.img, alt: '' }), h('span', { class: 'ck-an', html: o.svgFull ? o.svgFull(od.a, 'sad') : a.svg })), h('p', { class: 'center' }, h('b', null, `${a.name}: "${o.toned(od.a, say)}"`)), rateLine,
        h('p', { class: 'center kb-zero' }, `💸 0코인 · ${why.length >= 2 ? '요청을 2개 넘게 못 맞췄어요' : '다른 요리이거나 날것·탄 요리예요'}${aff < 0 ? ' · 친밀도 -1' : ''}`)], actions: [{ label: '다음', primary: true }], onClose: after }); return; }
    // 1) 맛있게 먹는 모습 + 칭찬 + 친밀도 +5
    sfx('pop'); const praise = why.length ? `맛있어! 근데… ${why[0]}. 그래도 잘 먹었어!` : pick([`와! 딱 내가 원하던 ${r.n}이야!`, '이 맛이야! 너 요리 천재구나!', '최고의 한 끼였어! 또 올게!', `${r.n} 진짜 끝내준다…!`]);
    const eat = h('div', { class: 'kb-eat' }, h('div', { class: 'kb-eatan', html: o.svgFull ? o.svgFull(od.a, 'love') : a.svg }), h('img', { class: 'kb-eatdish', src: d.img, alt: '' }), h('b', { class: 'kb-nyam' }, '냠냠'), ...[0, 1, 2].map(k => h('i', { class: 'kb-heart', style: { left: 30 + k * 20 + '%', animationDelay: k * 0.35 + 's' } }, '💗')));
    modal({ title: `${'★'.repeat(stars)}${'☆'.repeat(5 - stars)} 냠냠 냠냠`, body: [eat, h('p', { class: 'center' }, h('b', null, `${a.name}: "${o.toned(od.a, praise)}"`)), h('p', { class: 'center kb-aff' }, `💗 ${a.name} 친밀도 +5`), rateLine],
      actions: [{ label: '다 먹었어요 →', primary: true }], onClose: () => {
        // 2) "자, 계산할게!" — 영수증을 보고 최종 금액을 받는다
        const joke = CARD.includes(od.a) && Math.random() < 0.7 ? pick(['계산은 카드로… 36개월 할부 되죠? …농담이야! 현금으로 낼게', '사장님, 이거 12개월 무이자 할부 되나요? 히히, 농담이고 여기 현금!', '카드 긁을게요~ 할부는 60개월로! …에이, 농담이야 농담']) : null;
        const rows = [[`${r.n} 기본`, won(r.base)], ...bill.map(([t, x]) => [t, `×${x}`])];
        modal({ title: '🧾 자, 계산할게!', body: [h('div', { class: 'kb-pay' }, h('span', { class: 'kb-payan', html: a.svg }), h('b', null, `${a.name}: "${o.toned(od.a, joke || '자, 계산할게! 잘 먹었어~')}"`)),
          h('div', { class: 'kb-bill' }, ...rows.map(([t, v]) => h('div', { class: 'kb-bl' }, h('span', null, t), h('em', { class: /×0\./.test(v) ? 'down' : '' }, v))), h('div', { class: 'kb-bl total' }, h('span', null, '받을 돈'), h('b', null, won(price))))],
          actions: [{ label: `💰 ${won(price)} 받기`, primary: true }], onClose: () => { o.coins(price); st = { ...st, sales: (st.sales || 0) + price }; ctx.store.update(ref, { sales: st.sales }).catch(() => {}); sfx('coin'); toast(`+${won(price)} 💰`, 1400); after(); } }); } }); }
  // "다음에 다시 오세요": 재료가 없을 때 손님을 정중히 돌려보낸다. 평점은 깎이지 않는다(친하지 않으면 친밀도만 -1)
  function noStock() { const od = sess.cs[sess.i], a = an(od.a), r = recOf(od.rec), fond = A(od.a) >= 60;
    if (!fond) o.affinity(od.a, -1); sfx('pop');
    const say = fond ? pick([`에이… ${r.n}이(가) 안 된다고? 아쉽다. 다음엔 꼭 해 줘…`, '재료가 없구나… 괜찮아, 다음에 또 올게. 조금 아쉽긴 하다…']) : pick([`뭐? ${r.n}이(가) 안 된다고? 쳇, 다음에 올게.`, '헛걸음했네… 다음엔 꼭 준비해 둬!', '알겠어, 다음에 다시 올게. 흥!']);
    modal({ title: '🙇 다음에 다시 오세요', body: [h('div', { class: 'ck-res bad' }, h('span', { class: 'ck-an', html: a.svg })), h('p', { class: 'center' }, h('b', null, `${a.name}: "${o.toned(od.a, say)}"`)), h('p', { class: 'center dim' }, fond ? '친한 사이라 살짝 아쉬워만 하고 갔어요. 가게 평점은 그대로예요.' : '친밀도 -1 · 가게 평점은 그대로예요.')], actions: [{ label: '다음', primary: true }], onClose: () => nextCust() }); }
  let banNow = false;
  // 평점 3점 이하: 하루 영업정지. 장사 중이던 손님은 돌려보낸다
  function closeShop() { banNow = false; sess = null; resetKitchen(); st = { ...st, cur: null }; ctx.store.update(ref, { cur: null }).catch(() => {}); sfx('bad'); draw();
    modal({ title: '🚫 영업정지!', body: [h('p', { class: 'center' }, h('b', null, `가게 평점이 ${RATE_BAN}점 이하로 떨어졌어요.`)), h('p', { class: 'center' }, '손님들 불만이 쌓여서 하루 동안 장사를 할 수 없어요. 하루가 지나면 평점이 5점으로 회복되고 다시 문을 열어요.'), h('p', { class: 'center dim' }, '퀘스트 요리는 영업정지 중에도 만들 수 있어요.')], actions: [{ label: '확인', primary: true }] }); }
  function nextCust(stay) { if (stay || !sess) return draw(); sess.i++; if (sess.quest) { sess = null; resetKitchen(); return draw(); } if (sess.i >= sess.cs.length) return endSession(); ctx.store.update(ref, { cur: { ...sess } }).catch(() => {}); draw(); }
  function endSession() { if (!sess) return; sess = null; resetKitchen(); const n = (st.n || 0) + 1; st = { ...st, n, cur: null }; ctx.store.update(ref, { n, cur: null }).catch(() => {}); sfx('point');
    modal({ title: `${n}번째 장사 끝! 🍚`, body: h('p', { class: 'center' }, `오늘 매출 ${won(st.sales || 0)} · 오늘 남은 장사 ${SESSIONS - n}번`), actions: [{ label: '확인', primary: true }] }); draw(); }

  // 손님 주문 레시피: 손님 요청(익힘·양념·뺄 재료)을 반영하고, 지금 가진 재료도 보여 준다
  // 요리 순서: 재료 올리기 → 손질 → 조리도구 → 꺼내기 → 팔기 (화살표로 잇는다)
  function flowOf(r, od) { const S = STATIONS[r.st], zone = od && ZONES.find(z => z.k === od.pref), sn = od ? od.sn : 1, sauce = od ? od.sauce : r.sauce;
    const out = [];
    if (r.fz) out.push(['🐟', od && od.fid && fishOf(od.fid) ? fishOf(od.fid).name : `${ZNM[(od && od.fany) || r.fz]} 생선`, '도마에 올리기']);
    const cr = r.crops.filter(c => !od || c !== od.no); if (cr.length) out.push(['🥕', cr.map(cropName).join('·'), '도마에 올리기']);
    if (r.rice) out.push(['🍚', '공깃밥', '도마에 올리기']);
    out.push([SAUCES[sauce][0], `${SAUCES[sauce][1]}${sn > 1 ? ` ×${sn}` : ''}`, '도마에 올리기']);
    out.push(['🔪', '손질하기', '도마의 버튼']);
    if (r.st === 'board') out.push(['🍽️', '완성 칸에 담기', '손질 칸에서 끌어 놓기']);
    else { out.push([S.ic, `${S.n}에 넣기`, `끌어 놓기${od && od.fire ? ` · ${FIRE_N[od.fire]}(손님 요청)` : S.best ? ` · ${FIRE_N[S.best]}` : ''}`]); out.push(['⏱', `${zone ? zone.n : '알맞게'}에서 꺼내기`, '게이지 ▼ 자리에서 누르기']); }
    out.push(['💰', '손님에게 팔기', '']); return out; }
  const flowEl = steps => h('div', { class: 'kb-flow' }, ...steps.flatMap(([ic, t, sub], k) => [k ? h('i', { class: 'kb-arrow' }, '➜') : null, h('div', { class: 'kb-fs' }, h('span', null, ic), h('b', null, t), sub && h('small', null, sub))]).filter(Boolean));
  function recipeFor(od) { const r = recOf(od.rec), S = STATIONS[r.st], sauceN = sauceLeft(od.sauce);
    const fishN = r.fz ? fishLeft().filter(([, , f]) => f && (f.z || 1) >= r.fz).length : 0, cropN = id => barnLeft().filter(c => c.id === id).reduce((t, c) => t + c.n, 0);
    const row = (ic, name, have, need, note, cls = '') => h('div', { class: 'kb-rr ' + cls }, ic, h('b', null, name), note && h('em', null, note), h('span', { class: have >= need ? 'ok' : 'no' }, have >= need ? `있어요 ${have}` : `없어요`));
    const rows = [];
    if (r.fz && od.fany) rows.push(row(h('span', null, '🐟'), `${ZNM[od.fany]} 물고기 아무거나`, zoneCnt(od.fany), 1, `${ZNM[od.fany]} 바다${od.fany < 3 ? ' 이상' : ''}에서 잡은 물고기면 다 돼요`));
    else if (r.fz) rows.push(od.fid && fishOf(od.fid) ? row(h('span', null, '🐟'), `${fishOf(od.fid).name} 살`, fishCnt(od.fid), 1, `${r.fz >= 2 ? '중급' : '초급'} 바다에서 잡아요 · 손님이 콕 집었어요`) : row(h('span', null, '🐟'), `${r.fz >= 2 ? '중급' : '초급'} 바다 생선 살`, fishN, 1, r.fz >= 2 ? '흰 배로 중급 바다에서' : ''));
    r.crops.forEach(c => rows.push(od.no === c ? h('div', { class: 'kb-rr skip' }, h('img', { src: o.cropImg(c), alt: '' }), h('b', null, cropName(c)), h('em', null, '손님이 빼 달래요'), h('span', { class: 'no' }, '넣지 마세요')) : row(h('img', { src: o.cropImg(c), alt: '' }), cropName(c), cropN(c), 1)));
    if (r.rice) rows.push(row(h('span', null, '🍚'), '공깃밥', 99, 1, '무료'));
    rows.push(row(sauceIc(od.sauce), `${SAUCES[od.sauce][1]} ×${od.sn}`, sauceN, od.sn, od.sauce !== r.sauce ? `원래 ${SAUCES[r.sauce][1]} → 손님이 바꿔 달래요` : od.sn > 1 ? '손님이 듬뿍 달래요' : ''));
    const zone = ZONES.find(z => z.k === od.pref);
    const steps = flowOf(r, od);
    const can = (!r.fz || fishNeed(od)) && r.crops.every(c => c === od.no || cropN(c)) && sauceN >= od.sn;
    modal({ title: `📖 ${r.n} · ${an(od.a).name}의 주문`, body: [h('div', { class: 'kb-rhead' }, h('img', { src: r.img, alt: '' }), h('div', null, h('b', null, `${S.ic} ${S.n} · ${S.job}`), h('div', { class: 'kb-tags' }, ...reqTags(od).map(([c, t]) => h('i', { class: c }, t))), h('small', null, `💰 요청을 다 맞추면 ${won(bestPrice(r))}`), h('small', { class: 'kb-cost' }, `원가 ${r.cost.fish ? `생선 ${r.cost.fish} + ` : ''}작물 ${r.cost.crop} + 양념 ${r.cost.sauce} + 인건비 ${r.cost.labor} + 조리 시간 ${r.cost.time} = ${r.cost.sum}코인 → 기본 ${BASE_FEE} + 원가×${MARGIN}`))),
      h('div', { class: 'kb-rlist' }, ...rows), h('b', { class: 'kb-fh' }, '👩‍🍳 요리 순서'), flowEl(steps),
      h('p', { class: 'center kb-can ' + (can ? 'ok' : 'no') }, can ? '✅ 지금 가진 재료로 만들 수 있어요!' : '❌ 재료가 모자라요. 못 만들면 "🙇 다음에 다시 오세요"로 돌려보내요(평점은 그대로).')], actions: [{ label: '닫기', primary: true }] }); }
  // 재료 등급별 가격(열고 닫는 탭): 등급 배수 · 생선 분류 배수 · 메뉴별 C/B/A/S 가격(요청 다 맞춘 값)
  function gradeTab() { const G = ['C', 'B', 'A', 'S'], p = (r, g) => won(Math.round(bestPrice(r) * GRADE_X[g] / 10) * 10);
    return h('details', { class: 'kb-gtab' }, h('summary', null, '📊 재료 등급별 가격 보기'),
      h('div', { class: 'kb-gx' }, h('b', null, '재료 등급'), ...['S', 'A', 'B', 'C', 'D', 'F'].map(g => h('span', { class: 'g' + g }, `${g} ×${GRADE_X[g]}`)), h('small', null, '재료가 여러 개면 등급 배수의 평균이에요')),
      h('div', { class: 'kb-gx' }, h('b', null, '생선 분류'), ...[1, 2, 3, 4].map(t => h('span', null, `${TIERS[t].s} ×${TIER_X[t]}`)), h('small', null, '귀한 생선일수록 값이 더 올라요')),
      h('table', { class: 'kb-gt' }, h('tr', null, h('th', null, '메뉴'), ...G.map(g => h('th', { class: 'g' + g }, g + '급'))), ...RECIPES.slice().sort((a, b) => bestPrice(b) - bestPrice(a)).map(r => h('tr', null, h('td', null, r.n), ...G.map(g => h('td', null, p(r, g)))))),
      h('small', { class: 'dim' }, '요청을 다 맞췄을 때 · 흔한 생선 기준 값이에요')); }
  function recipeBook() { modal({ title: '📖 카피백반 레시피북', body: h('div', { class: 'kb-book' }, h('p', { class: 'kb-bnote' }, '🐟 물고기·🥕 재료 등급에 따라 가격이 상승합니다.'), gradeTab(), ...Object.entries(STATIONS).map(([k, S]) => h('div', null, h('b', { class: 'kb-bh' }, `${S.ic} ${S.n} · ${S.job}${S.best ? ` · ${FIRE_N[S.best]}이 맛있어요` : ''}`),
    ...RECIPES.filter(r => r.st === k).map(r => h('div', { class: 'kb-bi' }, h('img', { src: r.img, alt: '' }), h('div', null, h('b', null, `${r.n} · ${won(bestPrice(r))}`), h('small', null, [r.fz ? (r.fz >= 2 ? '중급 바다 생선' : '초급 바다 생선') : '', ...r.crops.map(cropName), r.rice ? '공깃밥' : ''].filter(Boolean).join(' + ') + ` · 양념 ${SAUCES[r.sauce][0]} ${SAUCES[r.sauce][1]}`), h('small', { class: 'kb-bflow' }, flowOf(r, null).map(([ic, t]) => `${ic} ${t}`).join(' ➜ ')))))))),
    actions: [{ label: '닫기', primary: true }] }); }
  function pantry() { const s = o.sauces() || {}; modal({ title: '🧂 내 양념', body: [h('div', { class: 'kb-pan' }, ...Object.entries(SAUCES).map(([id, [ic, nm]]) => h('div', { class: 'kb-pi' + (s[id] ? '' : ' off') }, sauceIc(id), h('b', null, nm), h('small', null, `${s[id] || 0}번`)))), h('p', { class: 'dim center' }, '양념은 카피수퍼 구매 탭에서 사요.')], actions: [{ label: '닫기', primary: true }] }); }

  function close() { if (!alive) return; alive = false; cancelAnimationFrame(raf); off(); offR(); wrap.remove(); o.onClose && o.onClose(); }
  draw(); raf = requestAnimationFrame(loop);
  return { close };
}
