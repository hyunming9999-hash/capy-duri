// 카피백반 — 카피수퍼 옆 백반집. 하루 세 번 장사, 한 번에 손님 둘. 퀘스트 요리도 여기서 만든다
// 재료(생선 살·작물·밥·양념)를 도마에 올리고 → 도마(날것)·냄비·프라이팬·튀김기 중 하나로 조리 → 원하는 익힘에서 꺼내 → 손님에게 바로 판다
import { h, toast, modal, ymd } from './ui.js';
import { sfx } from './sound.js';

const RENT = 100, SESSIONS = 3, PER = 2;
// 가게 평점: 날마다 5점 만점에서 시작(하루가 지나면 회복). 손님 요청을 못 맞추면 -0.5, 다 맞추면 +0.1. 3점 이하가 되면 하루 영업정지, 풀리면 다시 5점
const RATE_MAX = 5, RATE_MISS = 0.5, RATE_GOOD = 0.1, RATE_BAN = 3, RATE_BACK = 5, BAN_MS = 86400000;
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
export const SAUCE_IMG = { doenjang: 'img/cook/s-doenjang.webp', ssamjang: 'img/cook/s-ssamjang.webp' };
export const sauceIc = (id, cls = '') => SAUCE_IMG[id] ? h('img', { class: 'kb-sic ' + cls, src: SAUCE_IMG[id], alt: SAUCES[id][1] }) : h('span', { class: cls }, SAUCES[id][0]);
const SWAP = ['salt', 'soy', 'gochu', 'pepper', 'herb', 'butter'];
// 조리도구: 도마(날것) · 냄비 · 프라이팬 · 튀김기. best 는 맛이 제일 좋은 불(1 약 · 2 중 · 3 강)
export const STATIONS = { board: { n: '도마', ic: '🔪', img: 'img/cook/st-board.webp', job: '날것 · 썰어 담기' }, pot: { n: '냄비', ic: '🍲', img: 'img/cook/st-pot.webp', job: '끓이기·찌기·조림', ms: 12000, best: 1 },
  pan: { n: '프라이팬', ic: '🍳', img: 'img/cook/st-pan.webp', job: '굽기·볶기·부치기', ms: 8000, best: 3 }, fry: { n: '튀김기', ic: '🍤', img: 'img/burger/fryer-big.webp', job: '튀기기', ms: 7000, best: 2, fixed: 2 } };
const FIRE = [0, 0.6, 1, 1.7], FIRE_N = ['', '약불', '중불', '강불'];
// 메뉴 19종: [이름, 도구, 생선(0 없음·1 초급 바다·2 중급 바다), 작물, 밥, 양념, 기본가]
const R = (id, n, st, fz, crops, rice, sauce, base) => ({ id, n, st, fz, crops, rice, sauce, base, img: `img/cook/menu/${id}.webp`, veg: !fz });
export const RECIPES = [
  R('mulhoe', '오이 물회', 'board', 2, ['cucumber'], 0, 'chojang', 480), R('sushi', '생선 초밥', 'board', 1, [], 1, 'soy', 200), R('hoedeop', '회덮밥', 'board', 2, ['lettuce', 'cucumber'], 1, 'chojang', 450),
  R('jorim', '생선 무조림', 'pot', 1, ['radish', 'onion'], 0, 'soy', 230), R('doenjang', '생선 된장국', 'pot', 1, ['spinach', 'cabbage'], 0, 'doenjang', 220), R('stew', '토마토 생선스튜', 'pot', 1, ['tomato', 'onion'], 0, 'herb', 260),
  R('maeun', '매운탕', 'pot', 2, ['chili', 'radish', 'scallion'], 0, 'gochu', 620), R('hobak', '단호박 생선찜', 'pot', 2, ['squash', 'broccoli'], 0, 'soy', 600), R('chowder', '옥수수 차우더', 'pot', 2, ['corn', 'potato', 'onion'], 0, 'butter', 580),
  R('jjin', '감자옥수수찜', 'pot', 0, ['potato', 'corn'], 0, 'salt', 170), R('hobakjuk', '단호박죽', 'pot', 0, ['squash', 'pea'], 0, 'honey', 240),
  R('ssam', '생선 상추쌈', 'pan', 1, ['lettuce'], 0, 'ssamjang', 180), R('gui', '대파 생선구이', 'pan', 2, ['scallion', 'garlic'], 0, 'salt', 520), R('gamjajeon', '감자전', 'pan', 0, ['potato', 'onion'], 0, 'soy', 120), R('gaji', '가지 대파볶음', 'pan', 0, ['eggplant', 'scallion'], 0, 'soy', 360),
  R('croq', '생선 고로케', 'fry', 1, ['potato'], 0, 'tartar', 250), R('kkaseu', '생선까스', 'fry', 1, ['cabbage'], 0, 'tartar', 210), R('mattang', '고구마 맛탕', 'fry', 0, ['sweetpotato'], 0, 'honey', 130), R('tempura', '채소튀김', 'fry', 0, ['carrot', 'sweetpotato', 'onion'], 0, 'soy', 150)];
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
  let board = [], tray = [], selT = -1, tab = 'fish';
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
    return { a: i, rec: r.id, pref, sauce, sn, no }; }
  const reqTags = od => { const r = recOf(od.rec), S = SAUCES[od.sauce], out = [];
    out.push(['', od.pref === 'raw' ? '🧊 날것 그대로' : `🔥 ${ZN[od.pref]}`]);
    if (od.sauce !== r.sauce) out.push(['hot', `${S[0]} ${S[1]}로 바꿔`]); else out.push(['', `${S[0]} ${S[1]}${od.sn > 1 ? ' 듬뿍(×2)' : ''}`]);
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
    if (qs.length) kids.push(h('b', { class: 'kb-h' }, '📜 퀘스트 요리'), ...qs.map(q => { const r = recOf(q.rec); return h('button', { class: 'kb-qrow', onClick: () => startQuest(q) }, h('img', { src: r.img, alt: '' }), h('div', null, h('b', null, `${an(q.i).name}에게 ${r.n}`), h('small', null, '임대료 없이 만들 수 있어요 · 다 만들면 그 동물에게 가서 퀘스트 완료')), h('span', null, '만들기 ›')); }));
    kids.push(h('div', { class: 'kb-row2' }, h('button', { class: 'btn', onClick: recipeBook }, '📖 레시피북'), h('button', { class: 'btn', onClick: pantry }, '🧂 내 양념')));
    kids.push(h('p', { class: 'dim kb-tip' }, `가게 평점은 5점 만점이고 하루가 지나면 회복돼요. 손님 요청을 못 맞추면 -${RATE_MISS}, 다 맞추면 +${RATE_GOOD}. ${RATE_BAN}점 이하가 되면 하루 영업정지예요. 손님마다 원하는 익힘·양념·뺄 재료가 달라요.` + ' 생선은 낚시로, 작물은 농장에서, 양념은 카피수퍼에서 구해요. 재료가 없으면 "다음에 다시 오세요"로 돌려보내요(평점은 그대로).'));
    body.replaceChildren(...kids); }
  async function payRent() { if (st.rent) return; if (!(await ctx.spend(RENT))) return toast(`돈이 모자라요 (${RENT}코인 필요)`); st = { ...st, rent: ctx.store.now() }; await ctx.store.update(ref, { rent: st.rent }).catch(() => {}); sfx('coin'); toast('가게 문을 열었어요! 🍚', 1600); draw(); }
  function startSession() { if (banned()) return toast('영업정지 중이에요'); if (!st.rent) return toast('먼저 임대료를 내요'); if ((st.n || 0) >= SESSIONS) return;
    const all = o.animals.map(a => a.i).filter(i => A(i) > -30), cs = []; while (cs.length < PER) { const i = pick(all); if (!cs.some(c => c.a === i)) cs.push(makeOrder(i)); }
    sess = { cs, i: 0 }; resetKitchen(); ctx.store.update(ref, { cur: { ...sess } }).catch(() => {}); sfx('point'); draw(); }
  function startQuest(q) { sess = { cs: [makeOrder(q.i, q)], i: 0, quest: 1 }; resetKitchen(); draw(); }
  function resetKitchen() { board = []; tray = []; selT = -1; Object.keys(stn).forEach(k => { stn[k] = null; }); }

  // 조리실
  const stEls = {};
  function drawKitchen() {
    const od = sess.cs[sess.i]; if (!od) { setTimeout(endSession); return; } const r = recOf(od.rec), a = an(od.a);
    const cust = h('div', { class: 'kb-cust' }, h('div', { class: 'kb-an', html: a.svg }), h('span', { class: 'kb-nm' }, `${a.name} ${TASTE_TAG[tasteOf(od.a)].split(' ')[0]}`),
      h('button', { class: 'kb-bub', onClick: () => recipeFor(od) }, h('i', { class: 'kb-bubhint' }, '📖 눌러서 레시피'), h('img', { src: r.img, alt: '' }), h('div', null, h('b', null, r.n), h('div', { class: 'kb-tags' }, ...reqTags(od).map(([c, t]) => h('i', { class: c }, t))))),
      !od.quest && h('button', { class: 'kb-nope', onClick: () => noStock() }, '🙇 다음에 다시 오세요'), h('div', { class: 'kb-counter' }));
    const status = h('div', { class: 'kb-status' }, h('span', null, sess.quest ? '📜 퀘스트 요리' : `🔔 ${(st.n || 0) + 1}번째 장사 · 손님 ${sess.i + 1}/${sess.cs.length}`), h('button', { class: 'kb-mini', onClick: recipeBook }, '📖'));
    const trayEl = h('div', { class: 'kb-tray' }, ...[0, 1, 2].map(k => { const d = tray[k]; return d ? h('button', { class: 'kb-dish' + (selT === k ? ' on' : ''), onClick: () => { selT = selT === k ? -1 : k; draw(); } }, h('img', { src: d.img, alt: '' }), h('small', null, `${d.name}${d.rec && d.zone !== 'raw' ? ' · ' + ZN[d.zone] : ''}`)) : h('div', { class: 'kb-slot' }, k ? '' : '완성 요리'); }));
    const grid = h('div', { class: 'kb-st' }, ...Object.keys(STATIONS).map(stationEl));
    const tabs = h('div', { class: 'kb-tabs' }, ...[['fish', '🐟 생선'], ['crop', '🥕 채소·밥'], ['sauce', '🧂 양념']].map(([k, t]) => h('button', { class: tab === k ? 'on' : '', onClick: () => { tab = k; draw(); } }, t)));
    const items = h('div', { class: 'kb-items' }, ...itemList());
    const btns = h('div', { class: 'kb-btns' }, h('button', { class: 'sm', title: '도마 비우기', onClick: () => { board = []; draw(); } }, '↩'), h('button', { class: 'sm', title: '고른 요리 버리기', onClick: trash }, '🗑'),
      h('button', { class: 'go', onClick: serve }, sess.quest ? '🍽 완성! 건네기' : '🍽 손님에게 팔기'));
    body.replaceChildren(status, cust, trayEl, grid, tabs, items, btns); tick(); }
  function stationEl(k) { const S = STATIONS[k], s = stn[k];
    const kids = [h('img', { class: 'kb-stimg', src: S.img, alt: '' })];
    if (k === 'board') { if (board.length) kids.push(h('div', { class: 'kb-on' }, ...board.map((b, j) => h('button', { class: 'kb-chip', onClick: e => { e.stopPropagation(); board.splice(j, 1); draw(); } }, chipFace(b)))));
      kids.push(h('span', { class: 'kb-lb' }, board.length ? `🔪 도마 · 재료 ${board.length}개 · 조리도구를 눌러 넣기` : '🔪 도마 · 재료를 올려요')); }
    else { if (s) kids.push(h('img', { class: 'kb-cooking', src: s.dish.img, alt: '' }), h('span', { class: 'kb-ring' }, h('i')));
      if (!S.fixed) kids.push(h('span', { class: 'kb-fire' }, ...[1, 2, 3].map(f => h('button', { class: fire[k] === f ? 'on' : '', onClick: e => { e.stopPropagation(); fire[k] = f; draw(); } }, FIRE_N[f][0]))));
      kids.push(h('span', { class: 'kb-lb' }, s ? h('b', { class: 'kb-z' }) : `${S.ic} ${S.n} · ${S.job}${S.best ? ` · ${FIRE_N[S.best]} 추천` : ''}`)); }
    const el = h('button', { class: 'kb-s ' + k + (s ? ' busy' : ''), onClick: () => useStation(k) }, ...kids); stEls[k] = el; return el; }
  const chipFace = b => b.t === 'fish' ? h('img', { src: `img/cook/fillet-${isRed(b.f) ? 'red' : 'white'}.webp`, alt: '' }) : b.t === 'crop' ? h('img', { src: o.cropImg(b.id), alt: '' }) : b.t === 'rice' ? h('span', null, '🍚') : sauceIc(b.key);
  function itemList() {
    if (tab === 'fish') { const L = fishLeft(); return L.length ? L.map(([key, v, f]) => h('button', { class: 'kb-it' + (filGlow(f, v) ? ' glow' : ''), onClick: () => add({ t: 'fish', key, v, f }) }, filletEl(f, v), h('small', null, `${f.name}${v.g ? ' ' + v.g : ''}`), h('em', null, f.z >= 2 ? '중급 바다' : '초급 바다'))) : [h('p', { class: 'dim kb-empty' }, '가방에 물고기가 없어요. 낚시로 잡아 오세요.')]; }
    if (tab === 'crop') return [h('button', { class: 'kb-it', onClick: () => add({ t: 'rice', key: 'rice' }) }, h('span', { class: 'kb-emo' }, '🍚'), h('small', null, '공깃밥'), h('em', null, '무료')),
      ...barnLeft().map(c => h('button', { class: 'kb-it', onClick: () => add({ t: 'crop', key: c.key, id: c.id, g: c.g }) }, h('img', { src: o.cropImg(c.id), alt: '' }), h('small', null, `${cropName(c.id)} ${c.g}`), h('em', null, `×${c.n}`)))];
    return Object.entries(SAUCES).map(([id, [ic, nm]]) => { const n = sauceLeft(id); return h('button', { class: 'kb-it' + (n > 0 ? '' : ' off'), onClick: () => n > 0 ? add({ t: 'sauce', key: id }) : toast(`${nm}이(가) 없어요. 카피수퍼에서 사 와요`) }, sauceIc(id, 'kb-emo'), h('small', null, nm), h('em', null, `×${Math.max(0, n)}`)); }); }
  function add(b) { if (board.length >= 8) return toast('도마가 꽉 찼어요'); if (b.t === 'fish' && board.some(x => x.t === 'fish')) return toast('생선은 한 번에 하나만 올려요'); if (b.t === 'rice' && board.some(x => x.t === 'rice')) return toast('밥은 한 공기면 돼요');
    if (b.t === 'crop' && board.some(x => x.t === 'crop' && x.id === b.id)) return toast('같은 작물은 하나만 올려요'); board.push(b); sfx('tock'); draw(); }

  // 도마의 재료로 무슨 요리가 되는지 맞춘다. 손님이 뺀 재료 하나는 없어도 그 요리로 친다
  function identify(stk) { const fish = board.find(b => b.t === 'fish'), crops = board.filter(b => b.t === 'crop').map(b => b.id), rice = board.some(b => b.t === 'rice');
    let best = null; RECIPES.filter(r => r.st === stk).forEach(r => { if (!!r.fz !== !!fish || (fish && (fish.f.z || 1) < r.fz) || !!r.rice !== rice) return; if (crops.some(c => !r.crops.includes(c))) return;
      const miss = r.crops.filter(c => !crops.includes(c)); if (miss.length > 1 || (!crops.length && r.crops.length)) return; if (!best || miss.length < best.miss.length) best = { r, miss }; });
    return best; }
  async function useStation(k) {
    const s = stn[k];
    if (s) { // 꺼내기
      if (tray.length >= 3) return toast('완성 칸이 꽉 찼어요. 먼저 내거나 버려요');
      const z = zoneAt(s.d), tot = s.fireT[1] + s.fireT[2] + s.fireT[3], good = tot > 0 && s.fireT[STATIONS[k].best] / tot >= 0.6; tray.push({ ...s.dish, zone: z, fireGood: good }); stn[k] = null; selT = tray.length - 1; sfx(z === 'burnt' ? 'bad' : 'pop'); draw(); return; }
    if (!board.length) return toast('도마에 재료를 먼저 올려요');
    if (k === 'board') { // 날것 그대로 담기
      if (tray.length >= 3) return toast('완성 칸이 꽉 찼어요'); const m = identify('board'), dish = await takeBoard(m); tray.push({ ...dish, zone: 'raw', fireGood: true }); selT = tray.length - 1; sfx('pop'); draw(); return; }
    const m = identify(k), dish = await takeBoard(m); stn[k] = { dish, d: 0, fireT: { 1: 0, 2: 0, 3: 0 } }; sfx(k === 'fry' ? 'sear' : 'splash'); draw(); }
  // 도마에 올린 재료를 실제로 쓴다(가방·헛간·양념에서 뺀다)
  async function takeBoard(m) { const fish = board.find(b => b.t === 'fish'), crops = board.filter(b => b.t === 'crop'), sauce = {};
    board.filter(b => b.t === 'sauce').forEach(b => { sauce[b.key] = (sauce[b.key] || 0) + 1; });
    if (fish) o.useFish(fish.key); if (crops.length) await o.useCrops(Object.fromEntries(crops.map(c => [c.key, 1]))); if (Object.keys(sauce).length) await o.useSauce(sauce);
    const r = m && m.r, grades = [fish && fish.v.g, ...crops.map(c => c.g)].filter(Boolean), gx = grades.length ? grades.reduce((t, g) => t + (GRADE_X[g] || 1), 0) / grades.length : 1;
    const dish = { rec: r ? r.id : null, name: r ? r.n : '정체불명 요리', img: r ? r.img : 'img/cook/fishdish.webp', miss: m ? m.miss : [], crops: crops.map(c => c.id), sauce, gx, tx: fish ? TIER_X[fish.f.tier || 1] : 1 };
    board = []; return dish; }
  function trash() { if (selT >= 0 && tray[selT]) { tray.splice(selT, 1); selT = -1; sfx('bad'); draw(); } else toast('버릴 완성 요리를 먼저 골라요'); }

  // 익히기: 불 세기에 따라 빨리 익는다. 0.25초마다 고리와 글씨만 고친다
  let last = performance.now();
  function loop(t) { if (!alive) return; const dt = Math.min(0.2, (t - last) / 1000); last = t;
    Object.entries(stn).forEach(([k, s]) => { if (!s || k === 'board') return; const S = STATIONS[k], f = S.fixed || fire[k]; s.d += dt * 1000 / S.ms * 100 * FIRE[f]; s.fireT[f] += dt; });
    tick(); raf = requestAnimationFrame(loop); }
  function tick() { Object.entries(stn).forEach(([k, s]) => { const el = stEls[k]; if (!s || !el || !el.isConnected) return; const ring = el.querySelector('.kb-ring'), z = el.querySelector('.kb-z'), zone = zoneAt(s.d);
    if (ring) ring.style.setProperty('--p', Math.min(100, s.d).toFixed(1)); if (ring) ring.dataset.z = zone; if (z) z.textContent = `${s.dish.name} · ${ZN[zone]}${zone === 'burnt' ? ' 💨' : ''} · 눌러서 꺼내기`; el.classList.toggle('smoke', zone === 'burnt'); }); }

  // 손님에게 내기: 맞는 요리인지, 익힘·양념·뺀 재료를 보고 값과 별점을 매긴다
  async function serve() {
    const od = sess.cs[sess.i]; if (!od) return; const d = tray[selT >= 0 ? selT : 0]; if (!d) return toast('완성된 요리가 없어요. 조리도구에서 꺼내 와요');
    tray.splice(selT >= 0 ? selT : 0, 1); selT = -1; const r = recOf(od.rec), a = an(od.a); let stars = 5, mul = 1; const why = [];
    const wrong = d.rec !== od.rec, ruined = !wrong && r.st !== 'board' && (d.zone === 'raw' || d.zone === 'burnt');
    if (!wrong && !ruined) {
      if (r.st !== 'board') { if (d.zone === od.pref) mul *= 1.2; else { mul *= 0.8; stars--; why.push(`${ZN[od.pref]} 원했는데 ${ZN[d.zone]}`); } }
      const want = { [od.sauce]: od.sn }, same = Object.keys(want).length === Object.keys(d.sauce).length && Object.entries(want).every(([k, n]) => d.sauce[k] === n);
      if (same) mul *= 1.1; else { mul *= 0.85; stars--; why.push(Object.keys(d.sauce).length ? '양념이 달라' : '양념이 없어'); }
      const noOk = od.no ? d.miss.length === 1 && d.miss[0] === od.no : !d.miss.length; if (!noOk) { mul *= 0.7; stars--; why.push(od.no && !d.miss.length ? `${cropName(od.no)} 빼 달라고 했는데` : '재료가 하나 빠졌어'); }
      if (d.fireGood && r.st !== 'board') mul *= 1.1; }
    else stars = wrong ? 1 : 2;
    const price = wrong || ruined ? 0 : Math.round(r.base * d.gx * d.tx * mul);
    const taste = tasteOf(od.a), fan = (taste === 'fish' && !r.veg) || (taste === 'veg' && r.veg);
    const aff = stars >= 5 ? 4 + (fan ? 2 : 0) : stars === 4 ? 2 + (fan ? 1 : 0) : stars === 3 ? 1 : A(od.a) >= 60 ? 0 : -1;
    const say = wrong ? `이건 ${r.n}이(가) 아닌데…?` : ruined ? (d.zone === 'burnt' ? '콜록콜록… 다 탔잖아…' : '으앗, 아직 날것이잖아…') : stars >= 5 ? pick([`와! 딱 내가 원하던 ${r.n}이야!`, '이 맛이야! 또 올게!', '최고의 한 끼였어!']) : stars === 4 ? `맛있어! 근데… ${why[0]}.` : `음… ${why.join(', ')}.`;
    let joke = null; if (price > 0 && !sess.quest && CARD.includes(od.a) && Math.random() < 0.7) joke = pick(['계산은 카드로… 36개월 할부 되죠? …농담이야! 현금으로 낼게', '사장님, 이거 12개월 무이자 할부 되나요? 히히, 농담이고 여기 현금!', '카드 긁을게요~ 할부는 60개월로! …에이, 농담이야 농담']);
    if (sess.quest) { if (!wrong && !ruined) { await o.questDone(od.quest); sfx('bigfish'); } else sfx('bad'); }
    else { if (price) { o.coins(price); st = { ...st, sales: (st.sales || 0) + price }; ctx.store.update(ref, { sales: st.sales }).catch(() => {}); }
      sfx(stars >= 4 ? 'coin' : stars >= 3 ? 'point' : 'bad'); }
    const dv = sess.quest ? 0 : stars >= 5 ? RATE_GOOD : -RATE_MISS, ban = dv ? await rateBy(dv) : false;
    if (aff) o.affinity(od.a, aff);
    const quest = sess.quest, ok = !wrong && !ruined;
    modal({ title: quest ? (ok ? `${r.n} 완성! 📜` : '다시 만들어야 해요') : `${'★'.repeat(stars)}${'☆'.repeat(5 - stars)}`, body: [h('div', { class: 'ck-res' + (ok ? '' : ' bad') }, h('img', { src: d.img, alt: '' }), h('span', { class: 'ck-an', html: a.svg })),
      h('p', { class: 'center' }, h('b', null, `${a.name}: "${o.toned(od.a, quest && ok ? `고마워! ${r.n} 잘 받았어. 이따 나한테 와 줘!` : say)}"`)), joke && h('p', { class: 'center kb-joke' }, `💳 ${a.name}: "${o.toned(od.a, joke)}"`),
      !quest && h('p', { class: 'center kb-rd' + (dv < 0 ? ' down' : '') }, dv < 0 ? `손님 요청을 못 맞췄어요 · 가게 평점 -${RATE_MISS} → ★ ${rateV().toFixed(1)}` : `요청을 다 맞췄어요 · 가게 평점 +${RATE_GOOD} → ★ ${rateV().toFixed(1)}`),
      h('p', { class: 'center dim' }, quest ? (ok ? '퀘스트 요리를 완성했어요. 동물에게 가서 퀘스트를 완료하세요.' : '맞는 요리를, 날것이나 타지 않게 다시 만들어 주세요.') : price ? `+${won(price)}${aff ? ` · 친밀도 ${aff > 0 ? '+' : ''}${aff}` : ''}` : `재료만 쓰고 돈은 못 받았어요${aff < 0 ? ' · 친밀도 -1' : ''}.`)].filter(Boolean),
      actions: [{ label: '다음', primary: true }], onClose: () => (ban ? closeShop() : nextCust(quest && !ok)) }); }
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
  function recipeFor(od) { const r = recOf(od.rec), S = STATIONS[r.st], sauceN = sauceLeft(od.sauce);
    const fishN = r.fz ? fishLeft().filter(([, , f]) => f && (f.z || 1) >= r.fz).length : 0, cropN = id => barnLeft().filter(c => c.id === id).reduce((t, c) => t + c.n, 0);
    const row = (ic, name, have, need, note, cls = '') => h('div', { class: 'kb-rr ' + cls }, ic, h('b', null, name), note && h('em', null, note), h('span', { class: have >= need ? 'ok' : 'no' }, have >= need ? `있어요 ${have}` : `없어요`));
    const rows = [];
    if (r.fz) rows.push(row(h('span', null, '🐟'), `${r.fz >= 2 ? '중급' : '초급'} 바다 생선 살`, fishN, 1, r.fz >= 2 ? '흰 배로 중급 바다에서' : ''));
    r.crops.forEach(c => rows.push(od.no === c ? h('div', { class: 'kb-rr skip' }, h('img', { src: o.cropImg(c), alt: '' }), h('b', null, cropName(c)), h('em', null, '손님이 빼 달래요'), h('span', { class: 'no' }, '넣지 마세요')) : row(h('img', { src: o.cropImg(c), alt: '' }), cropName(c), cropN(c), 1)));
    if (r.rice) rows.push(row(h('span', null, '🍚'), '공깃밥', 99, 1, '무료'));
    rows.push(row(sauceIc(od.sauce), `${SAUCES[od.sauce][1]} ×${od.sn}`, sauceN, od.sn, od.sauce !== r.sauce ? `원래 ${SAUCES[r.sauce][1]} → 손님이 바꿔 달래요` : od.sn > 1 ? '손님이 듬뿍 달래요' : ''));
    const zone = ZONES.find(z => z.k === od.pref);
    const steps = [`재료를 모두 도마에 올려요${od.sn > 1 ? ` (양념은 ${od.sn}번 눌러요)` : ''}`, r.st === 'board' ? '도마를 눌러 날것 그대로 담아요' : `${S.ic} ${S.n}을(를) 눌러 조리를 시작해요${S.best ? ` · ${FIRE_N[S.best]}이 맛있어요` : ''}`,
      r.st === 'board' ? '완성 칸의 요리를 골라 손님에게 팔아요' : `고리가 ${zone ? `${zone.n}(${zone.lo}~${zone.hi}%)` : ''}일 때 눌러서 꺼내요`, '🍽 손님에게 팔기'];
    const can = (!r.fz || fishN) && r.crops.every(c => c === od.no || cropN(c)) && sauceN >= od.sn;
    modal({ title: `📖 ${r.n} · ${an(od.a).name}의 주문`, body: [h('div', { class: 'kb-rhead' }, h('img', { src: r.img, alt: '' }), h('div', null, h('b', null, `${S.ic} ${S.n} · ${S.job}`), h('div', { class: 'kb-tags' }, ...reqTags(od).map(([c, t]) => h('i', { class: c }, t))), h('small', null, `기본가 ${won(r.base)}`))),
      h('div', { class: 'kb-rlist' }, ...rows), h('ol', { class: 'kb-steps' }, ...steps.map(t => h('li', null, t))),
      h('p', { class: 'center kb-can ' + (can ? 'ok' : 'no') }, can ? '✅ 지금 가진 재료로 만들 수 있어요!' : '❌ 재료가 모자라요. 못 만들면 "🙇 다음에 다시 오세요"로 돌려보내요(평점은 그대로).')], actions: [{ label: '닫기', primary: true }] }); }
  function recipeBook() { modal({ title: '📖 카피백반 레시피북', body: h('div', { class: 'kb-book' }, ...Object.entries(STATIONS).map(([k, S]) => h('div', null, h('b', { class: 'kb-bh' }, `${S.ic} ${S.n} · ${S.job}${S.best ? ` · ${FIRE_N[S.best]}이 맛있어요` : ''}`),
    ...RECIPES.filter(r => r.st === k).map(r => h('div', { class: 'kb-bi' }, h('img', { src: r.img, alt: '' }), h('div', null, h('b', null, `${r.n} · ${won(r.base)}`), h('small', null, [r.fz ? (r.fz >= 2 ? '중급 바다 생선' : '초급 바다 생선') : '', ...r.crops.map(cropName), r.rice ? '공깃밥' : ''].filter(Boolean).join(' + ') + ` · 양념 ${SAUCES[r.sauce][0]} ${SAUCES[r.sauce][1]}`))))))),
    actions: [{ label: '닫기', primary: true }] }); }
  function pantry() { const s = o.sauces() || {}; modal({ title: '🧂 내 양념', body: [h('div', { class: 'kb-pan' }, ...Object.entries(SAUCES).map(([id, [ic, nm]]) => h('div', { class: 'kb-pi' + (s[id] ? '' : ' off') }, sauceIc(id), h('b', null, nm), h('small', null, `${s[id] || 0}번`)))), h('p', { class: 'dim center' }, '양념은 카피수퍼 구매 탭에서 사요.')], actions: [{ label: '닫기', primary: true }] }); }

  function close() { if (!alive) return; alive = false; cancelAnimationFrame(raf); off(); offR(); wrap.remove(); o.onClose && o.onClose(); }
  draw(); raf = requestAnimationFrame(loop);
  return { close };
}
