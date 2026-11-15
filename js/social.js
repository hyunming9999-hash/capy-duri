// 동물 친목회 — 놀이터에서 동물 30마리와 말하고, 선물하고, 거래한다. 친밀도와 기억은 사람마다 따로다
import { h, toast, modal, gameFx, holdBtn } from './ui.js';
import { capy } from './capy.js';
import { ANIMALS, animalSvg } from './animals.js';
import { TOPS, BOTTOMS, HATS, nameOf } from './clothes.js';
import { priceOf, won } from './money.js';
import { sfx } from './sound.js';
import { PUSH_URL } from './push.js';
import { isMock } from './store.js';

// 동물마다: 성격, 좋아하는 것, 싫어하는 것, 상징 액세서리, 제일 좋아하는 선물
const P = (trait, likes, hates, pin, fav) => ({ trait, likes, hates, pin, fav });
export const PERSONA = [
  P('사람을 좋아하는 명랑한 성격', ['산책', '공놀이', '간식'], ['목욕', '혼자'], '🦴', 'candy'), P('도도하지만 속은 다정한 성격', ['생선', '낮잠', '햇볕'], ['물', '시끄러'], '🐟', 'flower'),
  P('겁이 많고 수줍은 성격', ['치즈', '조용', '책'], ['고양이', '큰 소리'], '🧀', 'candy'), P('먹는 걸 좋아하는 느긋한 성격', ['해바라기씨', '쳇바퀴', '간식'], ['다이어트', '배고'], '🌻', 'cake'),
  P('발랄하고 호기심 많은 성격', ['당근', '달리기', '달'], ['늑대', '느리'], '🥕', 'flower'), P('꾀가 많고 장난스러운 성격', ['포도', '수수께끼', '장난'], ['사냥', '지루'], '🍇', 'cake'),
  P('듬직하고 인심 좋은 성격', ['꿀', '낚시', '겨울잠'], ['벌', '춥'], '🍯', 'cake'), P('태평하고 먹보인 성격', ['대나무', '뒹굴', '낮잠'], ['운동', '바쁘'], '🎋', 'candy'),
  P('잠이 많고 말이 느린 성격', ['유칼립투스', '잠', '나무'], ['시끄러', '서두르'], '🌿', 'flower'), P('자존심 세고 용감한 성격', ['고기', '사냥', '줄무늬'], ['고양이라', '약하'], '🥩', 'cake'),
  P('대장 노릇을 좋아하는 당당한 성격', ['갈기', '왕', '낮잠'], ['무시', '졸병'], '👑', 'cake'), P('순하고 성실한 성격', ['풀', '우유', '들판'], ['서두르', '소고기'], '🥛', 'flower'),
  P('깔끔 떠는 미식가 성격', ['사과', '진흙', '맛집'], ['더럽', '삼겹살'], '🍎', 'cake'), P('노래를 좋아하는 낙천적인 성격', ['비', '연못', '노래'], ['가뭄', '뱀'], '🪷', 'candy'),
  P('장난꾸러기에 흉내를 잘 내는 성격', ['바나나', '나무타기', '장난'], ['가만히', '숙제'], '🍌', 'candy'), P('아침형이고 잔소리 많은 성격', ['옥수수', '아침', '알'], ['늦잠', '치킨'], '🌽', 'flower'),
  P('예의 바르고 꼼꼼한 성격', ['생선', '얼음', '썰매'], ['더위', '지각'], '🧊', 'candy'), P('아기 같고 애교 많은 성격', ['좁쌀', '엄마', '따뜻'], ['혼자', '무서'], '🌼', 'candy'),
  P('수다스럽고 친구가 많은 성격', ['연못', '빵', '수영'], ['사냥꾼', '조용히'], '🫧', 'flower'), P('아는 게 많은 밤샘 학자 성격', ['밤', '책', '별'], ['낮', '시끄러'], '🌙', 'flower'),
  P('무뚝뚝하지만 의리 있는 성격', ['달', '달리기', '친구'], ['배신', '거짓말'], '🌕', 'cake'), P('씩씩하고 단순한 성격', ['고구마', '돌진', '흙'], ['울타리', '돼지라'], '🍠', 'candy'),
  P('멋 부리기를 좋아하는 달리기 선수 성격', ['당근', '달리기', '바람'], ['느리', '채찍'], '🥇', 'flower'), P('꿈 많고 반짝이는 걸 좋아하는 성격', ['무지개', '별', '반짝'], ['말이라', '평범'], '🌈', 'cake'),
  P('느긋하고 지혜로운 성격', ['바다', '산책', '상추'], ['서두르', '토끼'], '🐚', 'flower'), P('손재주 좋은 요리사 성격', ['바다', '요리', '먹물'], ['문어숙회', '타코야키'], '⚓', 'cake'),
  P('재주 많고 박수받기 좋아하는 성격', ['공', '생선', '박수'], ['더위', '무관심'], '🏐', 'candy'), P('까칠해 보여도 정 많은 성격', ['버섯', '낙엽', '밤'], ['찌르', '풍선'], '🍄', 'flower'),
  P('부지런하고 모으기 좋아하는 성격', ['도토리', '나무', '저축'], ['낭비', '겨울'], '🌰', 'candy'), P('호기심 많고 손 씻기 좋아하는 성격', ['손 씻', '보물', '밤'], ['더럽', '도둑이라'], '🧺', 'cake'),
];
// 동물마다 말투: [말끝에 붙는 소리, AI에게 알려 주는 말투 설명]
export const TONE = [['멍', '신나서 들뜬 말투, 말끝마다 "멍"'], ['냥', '도도하고 새침한 말투, 말끝에 "냥"'], ['찍', '소심해서 더듬는 말투, 말끝에 "찍"'], ['뀨', '느긋하고 먹는 얘기를 섞는 말투, 말끝에 "뀨"'], ['깡총', '발랄하고 빠른 말투, 말끝에 "깡총"'], ['캥', '능글맞게 놀리는 말투, 말끝에 "캥"'],
  ['곰', '느리고 듬직한 아저씨 말투, 말끝에 "곰"'], ['뿌', '태평하고 늘어지는 말투, 말끝에 "뿌"'], ['음냐', '졸려서 말을 늘이는 말투, 말끝에 "음냐"'], ['어흥', '허세 부리는 센 말투, 말끝에 "어흥"'], ['크앙', '왕처럼 거만한 말투("짐은", "~하도다"), 말끝에 "크앙"'], ['음메', '순하고 느린 시골 말투, 말끝에 "음메"'],
  ['꿀', '까다로운 미식가 말투, 말끝에 "꿀"'], ['개굴', '노래하듯 흥얼거리는 말투, 말끝에 "개굴"'], ['우끼', '장난치며 깔깔대는 말투, 말끝에 "우끼"'], ['꼬꼬', '잔소리하는 엄마 말투, 말끝에 "꼬꼬"'], ['펭', '깍듯한 존댓말("~입니다", "~하십시오"), 말끝에 "펭"'], ['삐약', '아기처럼 혀 짧은 말투, 말끝에 "삐약"'],
  ['꽥', '수다스럽고 말이 많은 말투, 말끝에 "꽥"'], ['부엉', '점잖은 학자 말투("~하는 법이지", "~라네"), 말끝에 "부엉"'], ['아우', '무뚝뚝하고 짧게 끊는 말투, 말끝에 "아우"'], ['킁', '단순하고 씩씩한 말투, 말끝에 "킁"'], ['히힝', '멋 부리며 으스대는 말투, 말끝에 "히힝"'], ['반짝', '꿈꾸는 듯 몽글몽글한 말투, 말끝에 "반짝"'],
  ['엉금', '아주 천천히 말하는 할아버지 말투("~하구먼", "~일세"), 말끝에 "엉금"'], ['뿌우', '요리사처럼 맛에 빗대는 말투, 말끝에 "뿌우"'], ['아웅', '박수받고 싶어 하는 무대 말투, 말끝에 "아웅"'], ['삐죽', '퉁명스럽지만 속정 있는 말투, 말끝에 "삐죽"'], ['쪼르', '바쁘고 알뜰한 말투, 말끝에 "쪼르"'], ['구리', '호기심 많아 자꾸 되묻는 말투, 말끝에 "구리"']];
// 정해진 문장에 그 동물의 말끝을 붙인다(AI가 못 답할 때 쓰는 문장들)
export const toned = (i, t) => { if (!TONE[i]) return t; const suf = TONE[i][0], parts = t.match(/[^.!?…~]+[.!?…~]*\s*/g) || [t];
  return parts.map((p, k) => (k === parts.length - 1 || p.trim().length >= 9 ? p.replace(/([^.!?…~\s])([.!?…~]*\s*)$/, `$1${suf}$2`) : p)).join(''); };
export const GIFTS = { candy: ['🍬', '사탕', 30, 3], flower: ['💐', '꽃다발', 120, 8], cake: ['🎂', '케이크', 400, 20] }; // [그림, 이름, 값, 친밀도]
const GOOD = ['귀여', '귀엽', '멋지', '멋있', '좋아', '최고', '사랑', '고마', '예쁘', '예뻐', '착하', '대단', '잘생', '반가', '보고 싶', '친구', '훌륭', '똑똑', '재밌', '행복', '든든', '응원', '칭찬', '짱'];
const BAD = ['바보', '못생', '싫어', '꺼져', '멍청', '뚱뚱', '냄새', '미워', '짜증', '나빠', '더러', '재수', '찌질', '한심', '쓰레기', '죽어', '닥쳐', '시끄러워', '별로', '못난', '돼지야', '거지'];
const LINES = {
  good: ['헤헤, 그런 말 들으니까 기분 좋다!', '정말? 고마워, 너도 참 좋은 애야.', '에이, 부끄럽게~ 그래도 좋아!'],
  bad: ['뭐라고? 그 말 취소해!', '…너 지금 나한테 그런 말을 한 거야?', '흥, 너랑은 말 안 해.'],
  flat: ['음, 그렇구나.', '오늘 놀이터 날씨 좋지?', '그래? 재미있는 얘기네.'],
  like: ['어! {w} 얘기야? 나 {w} 진짜 좋아해!', '{w}라니, 뭘 좀 아는구나!'], hate: ['{w} 얘기는 하지 마… 싫단 말이야.', '으, {w}라니. 기분 나빠졌어.'],
  tired: ['오늘은 많이 얘기했다. 내일 또 놀자!', '나 이제 좀 쉴래. 내일 봐!'],
  cold: ['…왜.', '너랑 할 말 없는데.', '또 왔어?'],
};
const QUICK = { good: ['오늘도 귀엽다!', '너 정말 멋져!', '만나서 반가워!', '너랑 있으면 좋아', '넌 최고의 친구야'], flat: ['안녕, 뭐 해?', '오늘 날씨 좋다', '밥은 먹었어?'], bad: ['너 좀 못생겼다', '바보 아니야?', '저리 가, 냄새나'] };
const pick = a => a[Math.floor(Math.random() * a.length)];
const LEVELS = [[-100, '원수', '💢'], [-30, '사이 나쁨', '😠'], [-5, '서먹', '😐'], [10, '아는 사이', '🙂'], [30, '친구', '😊'], [50, '친한 친구', '🥰'], [80, '단짝', '💖']];
export const levelOf = a => LEVELS.reduce((r, l) => (a >= l[0] ? l : r), LEVELS[0]);
const PIN_AT = 50, ROB_AT = -30, TALKS = 8, today = () => new Date().toISOString().slice(0, 10);
// 동물이 파는 자기 옷: 무료가 아닌 옷 중에서 하나씩
const wareOf = i => { const set = [TOPS, HATS, BOTTOMS][i % 3]; return set[10 + i] || set[set.length - 1]; };

// 글에서 좋은 말·나쁜 말·좋아하는 것·싫어하는 것을 찾아 판정한다(AI를 못 쓸 때)
export function judgeLocal(text, p) {
  const t = text.replace(/\s+/g, ' '), neg = w => new RegExp('(안|못)\\s?' + w).test(t), hit = l => l.filter(w => t.includes(w));
  let g = hit(GOOD), b = hit(BAD); const flipped = g.filter(neg); g = g.filter(w => !flipped.includes(w)); b = b.concat(flipped);
  const like = p.likes.find(w => t.includes(w)), hate = p.hates.find(w => t.includes(w));
  let d = Math.min(8, g.length * 4) - Math.min(10, b.length * 6); if (like && !b.length) d += 3; if (hate) d -= 3;
  const reply = b.length ? pick(LINES.bad) : hate ? pick(LINES.hate).replace(/\{w\}/g, hate) : like ? pick(LINES.like).replace(/\{w\}/g, like) : g.length ? pick(LINES.good) : pick(LINES.flat);
  return { reply, delta: Math.max(-10, Math.min(10, d)) };
}
async function askAI(room, body) {
  if (!PUSH_URL || isMock) return null;
  const ac = new AbortController(), t = setTimeout(() => ac.abort(), 9000);
  try { const r = await fetch(PUSH_URL, { method: 'POST', headers: { 'Content-Type': 'text/plain' }, body: JSON.stringify({ room, ai: body }), signal: ac.signal }); const j = await r.json(); return j && j.reply ? { reply: String(j.reply), delta: Math.max(-10, Math.min(10, Math.round(+j.delta || 0))), ai: true } : null; }
  catch { return null; } finally { clearTimeout(t); }
}

export function mount(el, ctx) {
  let alive = true, mine = {}, theirs = {}, bag = {}, scroller, meEl, mePop;
  const pid = () => ctx.partnerId, A = i => (mine[i] && mine[i].a) || 0;
  const H = Math.round(Math.min(innerHeight * 0.48, 470)), TILE = Math.round(H * 1213 / 520), TILES = 3, WIDTH = TILE * TILES, IW = 1344, IH = 576;
  // 놀이기구 자리: [종류, 그림 속 가로 위치(0~1), 바닥에서 높이(0~1), 그네 번호]
  const SPOT_DEFS = [['slide', 0.243, 0.385], ['slide', 0.243, 0.385, 0, 'late'], ['swing', 0.2943, 0.43, 0], ['swing', 0.3286, 0.43, 1], ['seeL', 0.3964, 0.45], ['seeR', 0.4947, 0.45], ['sand', 0.538, 0.41], ['sand', 0.574, 0.41], ['gym', 0.661, 0.4], ['gym', 0.691, 0.4, 0, 'late'], ['bench', 0.753, 0.435], ['bench', 0.784, 0.435]];
  const SEE_X = 598.8 / IW, ROPE = (323 - 243) / IH * H;
  const LANES = [[0.07, 1], [0.13, 0.94], [0.19, 0.88], [0.25, 0.82]], RIDE_S = 0.62, ME_SP = 150, CHASE_SP = 118;
  const tiles = [], spots = []; let vit = null, hpEl, potEl, lockT = 0, playing = false;
  const HP_MAX = 100, HIT_DMG = 5, POTION = [10, 20], // 한 대 맞으면 -5, 포션은 10코인에 HP +20
  BRIBE = [50, 5], // 돈으로 풀기: 50코인에 +5
  CHASE_AT = -10, TEN_MIN = 600000, SORRY = /미안|죄송|사과|잘못했|용서/, moodOf = v => (v <= CHASE_AT ? 'mad' : v < 0 ? 'angry' : '');
  let actors = [], held = -1, raf = 0, lastT = 0, punchAt = 0;
  const me = { x: 200, y: 0.03, f: 1, dy: 0.03, ds: 1, ride: null, kb: 0, rideT: 0, gain: {} }, keys = new Set(), Y_MAX = 0.27; let rideBtn, rideState = '';
  // 움직이는 놀이기구(그네 두 개, 시소)를 배경 위에 그린다
  const EQ = `<svg class="so-eq" viewBox="0 0 ${IW} ${IH}" preserveAspectRatio="none">${[395.5, 441.6].map(x => `<g class="eq-sw"><path d="M${x - 16} 243V319M${x + 16} 243V319" stroke="#A8743C" stroke-width="5.5" stroke-linecap="round"/><path d="M${x - 16} 243V319M${x + 16} 243V319" stroke="#F3E3C3" stroke-width="2.6" stroke-dasharray="3 3"/><rect x="${x - 23}" y="316" width="46" height="13" rx="6.5" fill="#FFD21F" stroke="#B5651D" stroke-width="2.2"/></g>`).join('')}
    <g class="eq-see"><rect x="523" y="315" width="152" height="11" rx="5.5" fill="#F8C24A" stroke="#B5651D" stroke-width="2.2"/><rect x="520" y="308" width="34" height="11" rx="5.5" fill="#F47C72" stroke="#B5473C" stroke-width="2"/><rect x="644" y="308" width="34" height="11" rx="5.5" fill="#F47C72" stroke="#B5473C" stroke-width="2"/><path d="M560 315V298M638 315V298" stroke="#EFC27A" stroke-width="5" stroke-linecap="round"/><rect x="551" y="293" width="18" height="8" rx="4" fill="#FFD21F" stroke="#B5651D" stroke-width="1.8"/><rect x="629" y="293" width="18" height="8" rx="4" fill="#F47C72" stroke="#B5473C" stroke-width="1.8"/></g>
    <path d="M573 357 L594 324 q5 -6 10 0 L625 357z" fill="#F0625A" stroke="#B5473C" stroke-width="2.4" stroke-linejoin="round"/><circle cx="599" cy="339" r="4.5" fill="#FFD21F"/></svg>`;
  const setRel = (i, patch) => { mine = { ...mine, [i]: { ...(mine[i] || {}), ...patch } }; return ctx.store.update(`social/${ctx.uid}/${i}`, patch).catch(() => {}); };
  const pinOf = u => (ctx.members[u] || {}).pin;
  // 받은 액세서리 달기, 산 옷 입기(다시 누르면 벗는다). 내 카피바라에 바로 보인다
  const SLOT = { t: 'top', b: 'bottom', h: 'hat' };
  async function wearPin(i) { await ctx.store.update('members/' + ctx.uid, { pin: i }).catch(() => {}); ctx.members[ctx.uid] = { ...(ctx.members[ctx.uid] || {}), pin: i }; scores(); }
  // 그 옷 한 벌만 내 카피바라가 입은 모습(거래·가방 목록에 실제 그림으로 보여 준다)
  const tryOn = id => h('span', { class: 'so-try', html: capy({ color: ctx.me.color, acc: 'none', face: 'happy', [SLOT[id[0]]]: id }) });
  const wearing = id => (ctx.dress[ctx.uid] || {})[SLOT[id[0]]] === id;
  async function wearCloth(id, on = true) { const d = ctx.dress[ctx.uid] || {}, nx = { top: d.top || '', bottom: d.bottom || '', hat: d.hat || '', by: ctx.uid, ts: ctx.store.now() }; nx[SLOT[id[0]]] = on ? id : '';
    ctx.dress[ctx.uid] = nx; await ctx.store.set('dress/' + ctx.uid, nx).catch(() => {}); scores(); }

  function scene() {
    const top = h('div', { class: 'so-top' }, h('span', { class: 'coin-chip', 'data-coins': 1 }, won(ctx.coins())), h('span', { class: 'so-sp' }),
      h('button', { class: 'btn sm', onClick: openBag }, '🎒 가방'), h('button', { class: 'btn sm', onClick: openShop }, '🏪 카피수퍼'));
    endSorry(); tiles.length = 0; spots.length = 0; me.ride = null; me.kb = 0; keys.clear(); rideState = ''; playing = true;
    hpEl = h('u'); potEl = h('button', { class: 'btn sm so-pot', onClick: drink }, '🧪 0');
    const hpRow = h('div', { class: 'so-hp' }, h('b', null, '❤️'), h('i', null, hpEl), h('span', { class: 'so-hpn' }), potEl);
    scroller = h('div', { class: 'so-scroll' });
    const world = h('div', { class: 'so-world', style: { width: WIDTH + 'px', height: H + 'px', '--sx': Math.round(-0.05 * TILE) + 'px', '--sy': Math.round(-0.115 * H) + 'px', '--gy': Math.round(-0.13 * H) + 'px' } });
    for (let k = 0; k < TILES; k++) { const flip = k % 2 === 1, bg = h('i', { class: 'so-bg' + (flip ? ' flip' : ''), style: { left: k * TILE + 'px', width: TILE + 1 + 'px' }, html: EQ }); world.append(bg);
      const fx = f => (k + (flip ? 1 - f : f)) * TILE, t = { dir: flip ? -1 : 1, sw: [...bg.querySelectorAll('.eq-sw')].map((g, n) => ({ g, cx: [395.5, 441.6][n], a: 3, cur: 0, ph: n * 1.4 + k, on: 0 })), see: { g: bg.querySelector('.eq-see'), cur: -11, x: fx(SEE_X), on: 0 } };
      tiles.push(t); SPOT_DEFS.forEach(([type, f, b, n, late]) => spots.push({ type, late: late ? ' late' : '', grp: k + type.slice(0, 3), x: fx(f), b, dir: t.dir, by: -1, eq: type === 'swing' ? t.sw[n] : type[0] === 's' && type[1] === 'e' ? t.see : null, t })); }
    actors = ANIMALS.map((a, i) => { const lane = i % LANES.length, x = 90 + (i + 0.5) * (WIDTH - 180) / ANIMALS.length;
      const e = h('button', { class: 'so-an', 'data-i': i, style: { left: x + 'px', zIndex: 10 - lane }, onClick: () => openAnimal(i) }, h('span', { class: 'so-score' }), h('span', { class: 'so-hearts' }), h('span', { class: 'so-body', html: animalSvg(i, true) }), h('small', null, a.name));
      world.append(e); return { e, body: e.querySelector('.so-body'), x, lane, y: LANES[lane][0], s: LANES[lane][1], st: 'idle', until: performance.now() + 400 + Math.random() * 3500, tx: x, spot: null, sp: 24 + Math.random() * 16, cool: 0, nextHit: 0, wait: 0 }; });
    meEl = h('div', { class: 'so-me', html: capy(ctx.capyOf(ctx.uid, { face: 'happy' })) }); mePop = h('div', { class: 'so-mepop' }); world.append(meEl, mePop);
    scroller.append(world);
    rideBtn = h('button', { class: 'dp so-dp so-ride', disabled: true, onClick: toggleRide }, '🎠', h('small', null, '타기'));
    const pad = h('div', { class: 'so-pad' }, h('div', { class: 'dpad so-dpad' }, [['U', '▲'], ['L', '◀'], ['D', '▼'], ['R', '▶']].map(([k, t]) => { const b = h('button', { class: 'dp so-dp dp-' + k, 'aria-label': k }, t); holdBtn(b, () => keys.add(k), () => keys.delete(k)); return b; })),
      h('span', { class: 'so-sp' }), h('div', { class: 'so-acts2' }, rideBtn, h('button', { class: 'dp so-dp so-hit', onClick: punch }, '👊', h('small', null, '때리기'))));
    el.replaceChildren(top, hpRow, scroller, pad, h('p', { class: 'dim center so-hint' }, '방향키로 걸어가요. 놀이기구 앞에서 🎠 로 타요. 동물과 같이 타면 친해져요. 동물을 누르면 말을 걸어요. 얼굴이 빨간 동물(-10점 이하)은 쫓아와요!'));
    scores(); drawHp(); lastT = performance.now(); cancelAnimationFrame(raf); raf = requestAnimationFrame(step);
  }
  // 체력: 맞으면 줄고, 0이 되면 쓰러져서 10분 동안 친목회에 못 들어온다. 회복 포션은 카피수퍼에서 판다
  const hpNow = () => (vit && vit.hp != null ? vit.hp : HP_MAX);
  const saveVit = patch => { vit = { ...(vit || {}), ...patch }; return ctx.store.update('socialme/' + ctx.uid, patch).catch(() => {}); };
  function drawHp() { if (!hpEl || !playing) return; const v = hpNow(); hpEl.style.width = v / HP_MAX * 100 + '%'; hpEl.style.background = v > 50 ? '#57C26B' : v > 25 ? '#F5A524' : '#E5484D'; hpEl.parentNode.nextSibling.textContent = `${v} / ${HP_MAX}`; potEl.textContent = `🧪 ${bag.potion || 0}`; potEl.disabled = !(bag.potion > 0) || v >= HP_MAX; }
  async function drink() { if (!(bag.potion > 0) || hpNow() >= HP_MAX) return; bag = { ...bag, potion: bag.potion - 1 }; ctx.store.update('bag/' + ctx.uid, { potion: bag.potion }).catch(() => {}); await saveVit({ hp: Math.min(HP_MAX, hpNow() + POTION[1]) }); sfx('point'); pop(mePop, `+${POTION[1]} ❤️`, 'up'); drawHp(); }
  function lock() {
    playing = false; cancelAnimationFrame(raf); clearInterval(lockT); const left = h('b', { class: 'so-lockt' });
    const tick = () => { const ms = TEN_MIN - (ctx.store.now() - (vit.deadAt || 0)); if (ms <= 0) { clearInterval(lockT); saveVit({ hp: HP_MAX, deadAt: 0 }).then(() => alive && scene()); return; } left.textContent = `${Math.floor(ms / 60000)}분 ${String(Math.floor(ms / 1000) % 60).padStart(2, '0')}초`; };
    el.replaceChildren(h('div', { class: 'so-lock' }, h('div', { class: 'so-lockc', html: capy(ctx.capyOf(ctx.uid, { face: 'sleepy' })) }), h('h3', null, '😵 너무 많이 맞아서 쓰러졌어요'), h('p', null, '10분 동안 쉬어야 친목회에 다시 들어올 수 있어요.'), left, h('p', { class: 'dim' }, '다음에는 카피수퍼에서 회복 포션(🧪 10코인)을 미리 사 두세요. 사이가 나쁜 동물에게는 사과하면 조금 풀려요.'), h('button', { class: 'btn', onClick: () => ctx.go('home') }, '홈으로')));
    tick(); lockT = setInterval(() => alive && tick(), 1000);
  }
  function die() { document.querySelectorAll('.modal-wrap').forEach(w => w.remove()); held = -1; sfx('lose'); saveVit({ hp: 0, deadAt: ctx.store.now() }).then(() => alive && lock()); }
  const KEY = { ArrowLeft: 'L', ArrowRight: 'R', ArrowUp: 'U', ArrowDown: 'D', a: 'L', d: 'R', w: 'U', s: 'D' };
  const kd = e => { if (document.querySelector('.modal-wrap') || (e.target && e.target.tagName === 'INPUT')) return; if (SORRY_UI.btn.el && e.key === 'Enter') { e.preventDefault(); return forgive('btn'); } if (KEY[e.key]) { keys.add(KEY[e.key]); e.preventDefault(); } else if (e.key === ' ' && !e.repeat) { e.preventDefault(); punch(); } };
  const ku = e => { if (KEY[e.key]) keys.delete(KEY[e.key]); };
  window.addEventListener('keydown', kd); window.addEventListener('keyup', ku);
  const pop = (parent, text, cls = '') => { const f = h('em', { class: 'so-pop ' + cls }, text); parent.append(f); setTimeout(() => f.remove(), 1000); };

  // 나도 놀이기구를 탄다: 빈 놀이기구 앞에서 🎠, 다시 누르거나 방향키를 누르면 내린다
  const buddiesOf = q => actors.map((o, i) => (o.st === 'ride' && o.spot && o.spot.grp === q.grp ? i : -1)).filter(i => i >= 0);
  const nearSpot = () => spots.filter(q => q.by < 0 && Math.abs(q.x - me.x) < 60).sort((a, b) => (buddiesOf(b).length ? 1 : 0) - (buddiesOf(a).length ? 1 : 0) || Math.abs(a.x - me.x) - Math.abs(b.x - me.x))[0];
  function getOff() { const q = me.ride; if (!q) return; if (q.eq) q.eq.on = Math.max(0, q.eq.on - 1); q.by = -1; me.ride = null; me.y = Y_MAX - 0.02; meEl.className = 'so-me'; const g = meEl.firstElementChild; if (g) g.style.transform = ''; }
  function toggleRide() { if (me.ride) return getOff(); const q = nearSpot(); if (!q) return; q.by = 99; if (q.eq) q.eq.on++; me.ride = q; me.f = 1; me.rideT = 0; me.gain = {}; meEl.className = 'so-me r-' + q.type + (q.dir < 0 ? ' rev' : '') + q.late; sfx('jump'); }
  // 때리기: 앞에 있는 가까운 동물을 친다. 맞은 동물은 밀려나고 친밀도가 떨어지며, 그 일을 기억한다
  function punch() {
    const now = performance.now(); if (now - punchAt < 600 || document.querySelector('.modal-wrap')) return; punchAt = now; getOff();
    meEl.classList.remove('punch'); void meEl.offsetWidth; meEl.classList.add('punch'); sfx('swing');
    let best = -1, bd = 92; actors.forEach((o, i) => { const dx = o.x - me.x, d = Math.abs(dx) + (dx * me.f < 0 ? 20 : 0) + Math.abs(o.y - me.dy) * H * 0.9; if (d < bd) { bd = d; best = i; } });
    if (best < 0) return; const o = actors[best], dir = o.x >= me.x ? 1 : -1; me.f = dir;
    sfx('hit'); pop(o.e, '퍽!'); leave(o); o.st = 'stun'; o.until = now + 900; o.kb = dir * 46; o.e.classList.remove('walk'); o.e.classList.add('ouch'); setTimeout(() => o.e.classList.remove('ouch'), 500);
    const rel = mine[best] || {}, mem = Array.isArray(rel.mem) ? rel.mem : Object.values(rel.mem || {}), v = Math.max(-100, A(best) - 6);
    setRel(best, { a: v, mem: [...mem.slice(-5), { s: '(말없이 때렸다)', r: '아야! 왜 때려!', d: -6, t: ctx.store.now() }] }); o.rage = true; scores();
    setTimeout(() => alive && pop(o.e, toned(best, v <= CHASE_AT ? '가만 안 둬!' : '아야!'), 'say'), 250);
  }
  // 쫓아오기 시작한 순간 사과하면 그 동물은 쫓기를 그만둔다. -15점까지는 1초 안에 버튼, 그보다 나쁘면 3.5초 안에 "미안해"를 직접 입력해야 한다
  const SORRY_UI = { btn: { el: null, list: [], t: 0, ms: 1000 }, type: { el: null, list: [], t: 0, ms: 3500 } };
  function endSorry(kind) { (kind ? [kind] : ['btn', 'type']).forEach(k => { const u = SORRY_UI[k]; clearTimeout(u.t); if (u.el) u.el.remove(); u.el = null; u.list = []; }); }
  function forgive(kind) { SORRY_UI[kind].list.forEach(k => { const o = actors[k]; if (!o || o.st !== 'chase') return; o.st = 'idle'; o.until = performance.now() + 1500; o.e.classList.remove('walk', 'chase'); pop(o.e, toned(k, '…이번만 봐준다'), 'say'); }); sfx('point'); endSorry(kind); }
  function quickSorry(i) {
    const kind = A(i) < -15 ? 'type' : 'btn', u = SORRY_UI[kind]; u.list.push(i); actors[i].nextHit = performance.now() + u.ms; actors[i].until += u.ms; // 사과할 시간 동안은 때리지 않고, 그만큼 더 쫓는다 if (u.el) return;
    if (kind === 'btn') u.el = h('button', { class: 'so-sorry', onClick: () => forgive('btn') }, '🙇 미안해!', h('i'));
    else { const inp = h('input', { class: 'so-sorryin', placeholder: '미안해', maxLength: 8, autocomplete: 'off', enterKeyHint: 'send' }); inp.addEventListener('input', () => { if (inp.value.replace(/\s/g, '').includes('미안해')) forgive('type'); });
      u.el = h('label', { class: 'so-sorry type' }, h('span', null, '3.5초 만에 "미안해"라고 입력하세요'), inp, h('i')); keys.clear(); setTimeout(() => inp.focus(), 0); }
    scroller.parentNode.insertBefore(u.el, scroller.nextSibling); u.t = setTimeout(() => endSorry(kind), u.ms);
  }
  // 사이가 나쁜 동물에게 맞으면 돈이 조금 나간다
  function gotHit(o, now) {
    o.nextHit = now + 900; getOff(); me.kb = (me.x >= o.x ? 1 : -1) * 70; sfx('hit'); pop(mePop, '퍽!'); meEl.classList.remove('ouch'); void meEl.offsetWidth; meEl.classList.add('ouch');
    const hp = Math.max(0, hpNow() - HIT_DMG); if (hp <= 0) return die(); saveVit({ hp }); drawHp();
    const n = Math.min(ctx.coins(), 3 + Math.floor(Math.random() * 4)); if (n <= 0) return;
    ctx.store.tx('money/' + ctx.uid, c => ({ ...(c || {}), c: Math.max(0, ((c && c.c) || 0) - n) })).catch(() => {}); setTimeout(() => alive && pop(mePop, `-${n}🪙`, 'lose'), 200);
  }
  // 동물들이 걸어 다니다가 가까운 놀이기구가 비면 가서 탄다. 말을 걸고 있는 동물(held)은 그 자리에 멈춘다
  function leave(o) { if (!o.spot) return; o.e.className = o.e.className.replace(/ ride r-\w+/g, '').replace(' rev', '').replace(' late', ''); if (o.spot.eq) o.spot.eq.on = Math.max(0, o.spot.eq.on - (o.st === 'ride' ? 1 : 0)); o.body.style.transform = ''; o.spot.by = -1; o.spot = null; }
  const crowded = (o, x) => actors.some(q => q !== o && q.lane === o.lane && q.st !== 'ride' && (Math.abs(q.x - x) < 64 || Math.abs(q.tx - x) < 64));
  function decide(o, i) {
    const free = Math.random() < 0.25 ? spots.filter(s => s.by < 0 && Math.abs(s.x - o.x) < 520) : [];
    if (free.length) { const s = pick(free); s.by = i; o.spot = s; o.tx = s.x; }
    else { let tx = o.x; for (let n = 0; n < 8; n++) { tx = Math.max(60, Math.min(WIDTH - 60, o.x + (Math.random() * 2 - 1) * 260)); if (!crowded(o, tx)) break; tx = o.x; } o.tx = tx; if (tx === o.x) { o.until = performance.now() + 800; return; } }
    o.st = 'walk'; o.wait = 0; o.e.classList.add('walk'); o.e.classList.toggle('left', o.tx < o.x);
  }
  function step(now) {
    if (!alive || !playing) return; const wall = ctx.store.now(), dt = Math.min(0.1, (now - lastT) / 1000), t = now / 1000, paused = !!document.querySelector('.modal-wrap'); lastT = now;
    // 나: 화살표로 걷고, 화면이 따라온다
    const mx = paused ? 0 : (keys.has('R') ? 1 : 0) - (keys.has('L') ? 1 : 0), my = paused ? 0 : (keys.has('U') ? 1 : 0) - (keys.has('D') ? 1 : 0);
    if (me.kb) { const k = me.kb * Math.min(1, dt * 9); me.x = Math.max(40, Math.min(WIDTH - 40, me.x + k)); me.kb = Math.abs(me.kb - k) < 1 ? 0 : me.kb - k; }
    if ((mx || my) && me.ride) getOff();
    if (mx) { me.f = mx; me.x = Math.max(40, Math.min(WIDTH - 40, me.x + mx * ME_SP * dt)); }
    if (my) me.y = Math.max(0, Math.min(Y_MAX, me.y + my * 0.22 * dt));
    let mty = me.y, mts = 1 - me.y * 0.7; const R = me.ride, g = meEl.firstElementChild;
    if (R) { me.x += (R.x - me.x) * Math.min(1, dt * 6); mty = R.b; mts = RIDE_S; const q = R.eq;
      if (g && q && R.type === 'swing') { const ph = q.cur * R.dir * Math.PI / 180; g.style.transform = `translate(${(-ROPE * Math.sin(ph) / mts).toFixed(1)}px, ${(ROPE * (Math.cos(ph) - 1) / mts).toFixed(1)}px) rotate(${(q.cur * R.dir).toFixed(1)}deg)`; }
      else if (g && q) g.style.transform = `translateY(${((R.x - q.x) * Math.sin(q.cur * R.dir * Math.PI / 180) / mts).toFixed(1)}px)`; }
    if (R && !paused) { const pals = buddiesOf(R); pals.forEach(i => { actors[i].until = Math.max(actors[i].until, now + 2500); }); // 같이 타는 동안은 동물도 안 내린다
      me.rideT = pals.length ? me.rideT + dt : 0;
      if (me.rideT >= 4) { me.rideT = 0; pals.forEach(i => { if (A(i) >= 100 || (me.gain[i] || 0) >= 8) return; me.gain[i] = (me.gain[i] || 0) + 1; setRel(i, { a: A(i) + 1 }); pop(actors[i].e, '+1 💗', 'up'); }); sfx('point'); scores(); } }
    const mk = Math.min(1, dt * (R ? 5 : 14)); me.dy += (mty - me.dy) * mk; me.ds += (mts - me.ds) * mk;
    meEl.classList.toggle('walk', !!(mx || my) && !R); meEl.style.left = mePop.style.left = me.x + 'px'; meEl.style.bottom = (me.dy * 100).toFixed(2) + '%'; mePop.style.bottom = Math.round(me.dy * H + 96 * me.ds) + 'px';
    meEl.style.transform = `scale(${(me.f * me.ds).toFixed(3)}, ${me.ds.toFixed(3)})`; meEl.style.zIndex = R ? 6 : me.dy < 0.07 ? 11 : me.dy < 0.13 ? 10 : me.dy < 0.19 ? 9 : me.dy < 0.25 ? 8 : 7;
    const ns = R ? null : nearSpot(), rs = R ? 'off' : ns ? (buddiesOf(ns).length ? 'with' : 'on') : ''; if (rs !== rideState) { rideState = rs; rideBtn.disabled = !rs; rideBtn.classList.toggle('ready', rs === 'on' || rs === 'with'); rideBtn.lastChild.textContent = rs === 'off' ? '내리기' : rs === 'with' ? '같이 타기' : '타기'; }
    scroller.scrollLeft = Math.max(0, Math.min(WIDTH - scroller.clientWidth, me.x - scroller.clientWidth / 2));
    // 놀이기구: 누가 타면 크게, 아니면 살짝 흔들린다
    tiles.forEach(T => { T.sw.forEach(w => { w.a += ((w.on ? 17 : 3) - w.a) * Math.min(1, dt * 2); w.cur = w.a * Math.sin(t * 2.3 + w.ph); w.g.setAttribute('transform', `rotate(${w.cur.toFixed(2)} ${w.cx} 243)`); });
      const S = T.see; S.cur += ((S.on ? 11 * Math.sin(t * 2.6) : -11) - S.cur) * Math.min(1, dt * 6); S.g.setAttribute('transform', `rotate(${S.cur.toFixed(2)} 598.8 320)`); });
    actors.forEach((o, i) => {
      const lane = LANES[o.lane]; let ty = lane[0], ts = lane[1];
      if (i === held) { /* 붙잡혀서 얘기하는 중 */ }
      else if (o.st === 'stun') { if (o.kb) { const k = o.kb * Math.min(1, dt * 8); o.x = Math.max(40, Math.min(WIDTH - 40, o.x + k)); o.kb -= k; } if (now > o.until) { o.st = 'idle'; o.until = now + 300; o.kb = 0; } }
      else if (o.st === 'chase') { ty = me.dy; ts = 1 - me.dy * 0.7; if (paused) o.until += dt * 1000; const d = me.x - o.x;
        if (Math.abs(d) > 34) { o.x += Math.sign(d) * CHASE_SP * dt; o.e.classList.toggle('left', d < 0); } else if (now > o.nextHit && !paused && Math.abs(o.y - me.dy) < 0.06) gotHit(o, now);
        if (now > o.until) { o.st = 'idle'; o.until = now + 600; o.e.classList.remove('walk', 'chase'); } }
      else {
        if (!paused && A(i) <= CHASE_AT && Math.abs(me.x - o.x) < (o.rage ? 420 : 170) && (o.rage || wall - ((mine[i] || {}).chaseAt || 0) > TEN_MIN)) { o.rage = false; setRel(i, { chaseAt: wall }); leave(o); o.st = 'chase'; o.until = now + 7000; o.nextHit = now + 300; o.e.classList.add('walk', 'chase'); pop(o.e, toned(i, '거기 서!'), 'say'); quickSorry(i); }
        else if (o.st === 'walk') { const d = o.tx - o.x, step1 = o.sp * dt, dir = Math.sign(d);
          const blocked = o.wait < 1.5 && actors.some(q => q !== o && q.lane === o.lane && q.st !== 'ride' && (q.x - o.x) * dir > 0 && (q.x - o.x) * dir < 58 && !(o.spot && Math.abs(d) < 110));
          if (blocked) { o.wait += dt; if (!o.spot && o.wait > 0.5) { o.st = 'idle'; o.until = now + 500 + Math.random() * 1200; o.e.classList.remove('walk'); } }
          else if (Math.abs(d) <= step1) { o.x = o.tx; o.e.classList.remove('walk', 'left');
            if (o.spot) { o.st = 'ride'; o.until = now + 9000 + Math.random() * 7000; if (o.spot.eq) o.spot.eq.on++; o.e.className += ' ride r-' + o.spot.type + (o.spot.dir < 0 ? ' rev' : '') + o.spot.late; }
            else { o.st = 'idle'; o.until = now + 900 + Math.random() * 3600; } }
          else o.x += dir * step1;
          if (o.spot) { const k = Math.max(0, 1 - Math.abs(o.tx - o.x) / 110); ty += (o.spot.b - ty) * k; ts += (RIDE_S - ts) * k; } }
        else if (o.st === 'ride') { ty = o.spot.b; ts = RIDE_S; const q = o.spot.eq;
          if (q && o.spot.type === 'swing') { const ph = q.cur * o.spot.dir * Math.PI / 180; o.body.style.transform = `translate(${(-ROPE * Math.sin(ph) / ts).toFixed(1)}px, ${(ROPE * (Math.cos(ph) - 1) / ts).toFixed(1)}px) rotate(${(q.cur * o.spot.dir).toFixed(1)}deg)`; }
          else if (q) o.body.style.transform = `translateY(${((o.x - q.x) * Math.sin(q.cur * o.spot.dir * Math.PI / 180) / ts).toFixed(1)}px)`;
          if (now > o.until) { leave(o); o.st = 'idle'; o.until = now + 500; } }
        else if (now > o.until) decide(o, i);
      }
      const k = Math.min(1, dt * 5); o.y += (ty - o.y) * k; o.s += (ts - o.s) * k;
      o.e.style.left = o.x + 'px'; o.e.style.bottom = (o.y * 100).toFixed(2) + '%'; o.e.style.transform = `scale(${o.s.toFixed(3)})`; });
    raf = requestAnimationFrame(step);
  }
  // 동물 머리 위 친밀도: 내 점수(크게)와 상대 점수(작게). 사이가 나쁘면 찌푸리고, 좋으면 하트가 떠오른다
  function scores() {
    if (!scroller) return;
    scroller.querySelectorAll('.so-an').forEach(e => { const i = +e.dataset.i, a = A(i), lv = levelOf(a), t = pid() && theirs[i] ? theirs[i].a || 0 : null, s = e.querySelector('.so-score'), mood = moodOf(a), hearts = a >= 80 ? 3 : a >= 50 ? 2 : a >= 30 ? 1 : 0;
      s.className = 'so-score' + (a < 0 ? ' neg' : a >= PIN_AT ? ' hi' : ''); s.replaceChildren(h('b', null, `${lv[2]} ${a}`), t != null && h('i', null, `${ctx.nameOf(pid()).slice(0, 3)} ${t}`) || '');
      if (e.dataset.mood !== mood) { e.dataset.mood = mood; e.querySelector('.so-body').innerHTML = animalSvg(i, true, mood); }
      if (+e.dataset.hearts !== hearts) { e.dataset.hearts = hearts; e.querySelector('.so-hearts').replaceChildren(...Array.from({ length: hearts }, (_, k) => h('i', { style: { animationDelay: k * 0.7 + 's', left: [50, 22, 78][k] + '%' } }, '💗'))); } });
    const face = h('div', { html: capy(ctx.capyOf(ctx.uid, { face: 'happy' })) }); if (meEl) meEl.innerHTML = face.innerHTML;
  }

  // ----- 동물과 만나기 -----
  function openAnimal(i) {
    const a = ANIMALS[i], p = PERSONA[i]; let busy = false, said = '', close; held = i; actors[i] && actors[i].e.classList.remove('walk');
    const faceEl = h('span', { html: animalSvg(i, true, moodOf(A(i))) }); let faceMood = moodOf(A(i));
    const bubble = h('p', { class: 'so-bubble' }), meter = h('div', { class: 'so-meter' }), quick = h('div', { class: 'so-quick' }), input = h('input', { class: 'so-input', maxLength: 60, placeholder: `${a.name}에게 하고 싶은 말`, enterKeyHint: 'send' });
    const say = (t, cls = '', raw = false) => { bubble.className = 'so-bubble ' + cls; bubble.textContent = raw || t === '…' ? t : toned(i, t); };
    const drawMeter = () => { const v = A(i), lv = levelOf(v), nx = LEVELS.find(l => l[0] > v); if (moodOf(v) !== faceMood) { faceMood = moodOf(v); faceEl.innerHTML = animalSvg(i, true, faceMood); } meter.replaceChildren(h('b', null, `${lv[2]} ${lv[1]}`), h('i', null, h('u', { style: { width: (v + 100) / 2 + '%', background: v < 0 ? '#E5484D' : v >= PIN_AT ? '#FF7FA8' : '#57C26B' } })), h('span', null, `${v}점${nx ? ` · ${nx[1]}까지 ${nx[0] - v}` : ''}`)); scores(); };
    const drawQuick = () => quick.replaceChildren(...[pick(QUICK.good), A(i) < 0 ? '미안해, 내가 잘못했어' : pick(QUICK.flat), pick(QUICK.bad)].map((t, k) => h('button', { class: 'so-q q' + k, onClick: () => talk(t) }, t)));
    // 친밀도가 바뀐 뒤: 선물로 받는 액세서리, 사이가 나쁠 때 삥 뜯기
    async function after(d, was) {
      const v = A(i), rel = mine[i] || {};
      if (d) { sfx(d > 0 ? 'coin' : 'bad'); const f = h('em', { class: 'so-float ' + (d > 0 ? 'up' : 'down') }, (d > 0 ? '+' : '') + d); meter.append(f); setTimeout(() => f.remove(), 1200); }
      if (v >= PIN_AT && !rel.got) { await setRel(i, { got: true }); await ctx.store.update('bag/' + ctx.uid + '/pins', { [i]: true }).catch(() => {}); bag = { ...bag, pins: { ...(bag.pins || {}), [i]: true } };
        await wearPin(i);
        setTimeout(() => { gameFx('win', `${a.name}의 ${p.pin} 받음`); say(`우리 이제 친한 친구지? 내 상징 ${p.pin} 줄게. 내가 달아 줬어! (가방에서 바꿀 수 있어)`, 'gift'); }, 500); }
      else if (v <= ROB_AT && d < 0 && Math.random() < 0.4) { // 사이가 나쁘면 준 액세서리를 뺏거나 돈을 뜯는다
        if ((bag.pins || {})[i]) { await ctx.store.update('bag/' + ctx.uid + '/pins', { [i]: null }).catch(() => {}); bag = { ...bag, pins: { ...(bag.pins || {}), [i]: null } }; if (pinOf(ctx.uid) === i) await wearPin(null); await setRel(i, { got: null }); setTimeout(() => { sfx('hit'); say(`내가 준 ${p.pin} 도로 내놔! 너한텐 아까워!`, 'angry'); }, 600); }
        else { const take = Math.min(ctx.coins(), 20 + Math.floor(Math.random() * 41)); if (take > 0) { await ctx.spend(take); setTimeout(() => { sfx('hit'); say(`까불지 마! 가진 돈 ${take}🪙 내놔!`, 'angry'); toast(`${a.name}에게 ${take} 🪙 뜯겼어요`, 2000); }, 600); } } }
      drawMeter();
    }
    // 사이가 나쁜 동물에게 사과하면 2점 풀린다. 한 동물에게 10분에 한 번만 통한다
    // 많이 틀어진 사이는 말로 안 된다: -20 이하는 선물을, -15 이하는 돈을 요구하고, 안 들어주면 다시 때리러 온다
    let demand = '';
    const settle = ok => { demand = ''; drawQuick(); if (!ok) { actors[i].rage = true; say('그래? 그럼 맞아야겠네. 거기 서!', 'angry'); sfx('bad'); setTimeout(() => close && close(), 900); } };
    function ask(kind) {
      demand = kind; sfx('bad');
      if (kind === 'gift') { say('닥치고 선물을 조공해라.', 'angry', true); quick.replaceChildren(h('button', { class: 'so-q q0', onClick: give }, '🎁 선물 바치기'), h('button', { class: 'so-q q2', onClick: () => settle(false) }, '싫어')); }
      else { say('음... 알겠고, 돈으로 해결할까?', 'angry', true); quick.replaceChildren(h('button', { class: 'so-q q0', onClick: async () => { if (!(await ctx.spend(BRIBE[0]))) return settle(false); await setRel(i, { a: A(i) + BRIBE[1] }); settle(true); say('좋아, 이번엔 넘어가 줄게.', 'glad'); after(BRIBE[1]); } }, `🪙 ${BRIBE[0]} 주기`), h('button', { class: 'so-q q2', onClick: () => settle(false) }, '싫어')); }
    }
    async function sorry(text) {
      if (A(i) <= -20) return ask('gift'); if (A(i) <= -15) return ask('pay');
      const rel = mine[i] || {}, left = TEN_MIN - (ctx.store.now() - (rel.sorryAt || 0)), mem = Array.isArray(rel.mem) ? rel.mem : Object.values(rel.mem || {});
      if (left > 0) return say(`흥, 아직 화 안 풀렸어. ${Math.ceil(left / 60000)}분 뒤에 다시 사과해.`, 'angry');
      const r = pick(['…알았어. 이번 한 번만 봐줄게.', '사과는 받을게. 근데 아직 다 풀린 건 아니야.', '흥… 진심이지? 조금 풀렸어.']);
      await setRel(i, { a: Math.min(100, A(i) + 2), sorryAt: ctx.store.now(), mem: [...mem.slice(-5), { s: text, r, d: 2, t: ctx.store.now() }] }); say(r, 'glad'); drawQuick(); after(2);
    }
    async function talk(text) {
      text = text.trim().slice(0, 60); if (!text || busy) return; if (demand) { input.value = ''; return say(demand === 'gift' ? '말은 됐고, 선물.' : '말은 됐고, 돈.', 'angry'); } if (A(i) < 0 && SORRY.test(text)) { input.value = ''; sfx('tock'); return sorry(text); } busy = true; input.value = ''; said = text; sfx('tock');
      const rel = mine[i] || {}, day = today(), n = rel.day === day ? rel.n || 0 : 0, mem = Array.isArray(rel.mem) ? rel.mem : Object.values(rel.mem || {});
      if (n >= TALKS) { say(pick(LINES.tired)); busy = false; return; }
      say('…', 'wait');
      let r = await askAI(ctx.room, { name: a.name, trait: p.trait, likes: p.likes.join(', '), hates: p.hates.join(', '), user: ctx.me.name, a: A(i), mem: `(말투 규칙: ${TONE[i][1]}. 대답은 반드시 이 말투로 한다)\n` + mem.slice(-4).map(m => `${ctx.me.name}: "${m.s}" → 나: "${m.r}"`).join('\n'), text });
      if (!r) { r = judgeLocal(text, p); const old = mem.length && Math.random() < 0.35 ? pick(mem) : null; // AI를 못 쓰면 낱말로 판정하고, 가끔 예전 말을 꺼낸다
        if (A(i) < -10 && r.delta <= 0) r.reply = pick(LINES.cold); else if (old && old.d < 0) r.reply += ` …그리고 저번에 "${old.s}"라고 한 거, 아직 안 잊었어.`; else if (old && old.d > 0) r.reply += ` 저번에 "${old.s}"라고 해 줘서 기뻤어.`; }
      if (!alive) return; const d = r.delta, v = Math.max(-100, Math.min(100, A(i) + d));
      await setRel(i, { a: v, day, n: n + 1, mem: [...mem.slice(-5), { s: text, r: r.reply.slice(0, 120), d, t: ctx.store.now() }] });
      say(r.reply, d > 0 ? 'glad' : d < 0 ? 'angry' : '', !!r.ai); busy = false; drawQuick(); after(d);
    }
    function give() {
      const have = Object.keys(GIFTS).filter(k => (bag[k] || 0) > 0);
      if (!have.length) return modal({ title: '🎁 줄 선물이 없어요', body: h('p', { class: 'center' }, '카피수퍼에서 선물을 살 수 있어요.'), actions: [{ label: '닫기' }, { label: '🏪 카피수퍼 가기', primary: true, onClick: c => { c(); openShop(); } }] });
      const cl = modal({ title: `🎁 ${a.name}에게 선물하기`, body: h('div', { class: 'so-list' }, have.map(k => { const [ic, nm, , up] = GIFTS[k]; return h('button', { class: 'so-row', onClick: async () => { cl(); const bonus = p.fav === k ? Math.ceil(up * 0.5) : 0, v = Math.min(100, A(i) + up + bonus);
        await ctx.store.update('bag/' + ctx.uid, { [k]: (bag[k] || 0) - 1 }).catch(() => {}); bag = { ...bag, [k]: (bag[k] || 0) - 1 }; await setRel(i, { a: v });
        if (demand === 'gift') { demand = ''; drawQuick(); say(bonus ? `흥, ${nm}라… 내가 좋아하는 걸 아네. 이번엔 봐준다.` : `${nm}? 뭐, 받아는 줄게.`, 'glad'); } else say(bonus ? `우와, ${nm}! 내가 제일 좋아하는 거야! 고마워!` : `${nm} 주는 거야? 고마워, 잘 쓸게!`, 'glad'); after(up + bonus); } }, h('span', null, ic), h('b', null, nm), h('small', null, `${bag[k]}개 · 친밀도 +${up}`)); })), actions: [{ label: '닫기' }] });
    }
    function trade() {
      const v = A(i), ware = wareOf(i), disc = v >= 50 ? 0.5 : v >= 20 ? 0.75 : 1, wp = Math.round(priceOf(ware.id) * disc), hasPin = (bag.pins || {})[i];
      if (v < 0) return say('너한텐 아무것도 안 팔아. 저리 가!', 'angry');
      const row = (ic, nm, sub, price, owned, fn) => h('button', { class: 'so-row' + (typeof ic === 'string' ? '' : ' big'), disabled: owned, onClick: fn }, typeof ic === 'string' ? h('span', null, ic) : ic, h('b', null, nm), h('small', null, owned ? '이미 갖고 있어요' : `${won(price)} · ${sub}`));
      const cl = modal({ title: `🤝 ${a.name}와 거래`, body: h('div', { class: 'so-list' },
        row(p.pin, `${a.name}의 상징 액세서리`, v >= 10 ? '친해지면(50점) 그냥 줘요' : '아는 사이(10점)부터 팔아요', 500, hasPin, async () => { if (v < 10) return toast('아직 그 정도로 친하지 않대요'); if (!(await ctx.spend(500))) return; await ctx.store.update('bag/' + ctx.uid + '/pins', { [i]: true }).catch(() => {}); bag = { ...bag, pins: { ...(bag.pins || {}), [i]: true } }; await setRel(i, { got: true }); await wearPin(i); cl(); say(`자, ${p.pin} 여기. 내가 달아 줬어, 잘 달고 다녀!`, 'glad'); }),
        row(tryOn(ware.id), `${a.name}의 옷: ${ware.name}`, disc < 1 ? `친구 할인 ${Math.round((1 - disc) * 100)}%` : '친해지면 깎아 줘요', wp, ctx.owns(ware.id), async () => { if (!(await ctx.spend(wp))) return; await ctx.store.set(`owned/${ctx.uid}/${ware.id}`, true).catch(() => {}); ctx.owned[ctx.uid] = { ...(ctx.owned[ctx.uid] || {}), [ware.id]: true }; await wearCloth(ware.id); cl(); say(`${ware.name}, 입혀 줬어. 잘 어울린다! (가방이나 옷놀이에서 갈아입을 수 있어)`, 'glad'); })), actions: [{ label: '닫기' }] });
    }
    const memBtn = () => { const mem = Array.isArray((mine[i] || {}).mem) ? mine[i].mem : Object.values((mine[i] || {}).mem || {}); modal({ title: `📜 ${a.name}가 기억하는 말`, body: mem.length ? h('div', { class: 'so-mem' }, mem.slice().reverse().map(m => h('p', null, h('b', null, `나: ${m.s}`), h('span', null, `${a.name}: ${m.r}`), h('em', { class: m.d > 0 ? 'up' : m.d < 0 ? 'down' : '' }, (m.d > 0 ? '+' : '') + m.d)))) : h('p', { class: 'center' }, '아직 나눈 말이 없어요.'), actions: [{ label: '닫기', primary: true }] }); };
    input.addEventListener('keydown', e => { if (e.key === 'Enter') talk(input.value); });
    close = modal({ title: `${a.name} · ${p.trait}`, body: h('div', { class: 'so-meet' },
      h('div', { class: 'so-face' }, faceEl, bubble), meter, quick,
      h('div', { class: 'so-say' }, input, h('button', { class: 'btn primary', onClick: () => talk(input.value) }, '말하기')),
      h('div', { class: 'so-acts' }, h('button', { class: 'btn', onClick: give }, '🎁 선물'), h('button', { class: 'btn', onClick: trade }, '🤝 거래'), h('button', { class: 'btn', onClick: memBtn }, '📜 기억'))), actions: [{ label: '닫기' }], onClose: () => { if (demand && actors[i]) actors[i].rage = true; if (held === i) held = -1; const o = actors[i]; if (o && o.st === 'walk') o.e.classList.add('walk'); } });
    const v = A(i); say(v <= ROB_AT ? pick(LINES.cold) : v >= PIN_AT ? `${ctx.me.name}! 왔구나, 보고 싶었어!` : v >= 10 ? `안녕, ${ctx.me.name}! 또 만났네.` : `안녕? 난 ${a.name}야. ${p.likes[0]} 좋아해.`); drawMeter(); drawQuick();
  }

  // ----- 카피수퍼·가방 -----
  function openShop() {
    const body = h('div', { class: 'so-list' }), draw = () => body.replaceChildren(h('p', { class: 'center' }, '내 돈 ', h('b', { 'data-coins': 1 }, won(ctx.coins()))),
      ...Object.entries(GIFTS).map(([k, [ic, nm, price, up]]) => h('button', { class: 'so-row', onClick: async () => { if (!(await ctx.spend(price))) return; bag = { ...bag, [k]: (bag[k] || 0) + 1 }; await ctx.store.update('bag/' + ctx.uid, { [k]: bag[k] }).catch(() => {}); toast(`${nm} 샀어요`); draw(); } }, h('span', null, ic), h('b', null, nm), h('small', null, `${won(price)} · 친밀도 +${up} · 가진 것 ${bag[k] || 0}개`))),
      h('button', { class: 'so-row', onClick: async () => { if (!(await ctx.spend(POTION[0]))) return; bag = { ...bag, potion: (bag.potion || 0) + 1 }; await ctx.store.update('bag/' + ctx.uid, { potion: bag.potion }).catch(() => {}); toast('회복 포션 샀어요'); draw(); drawHp(); } }, h('span', null, '🧪'), h('b', null, '회복 포션'), h('small', null, `${won(POTION[0])} · 체력 +${POTION[1]} · 가진 것 ${bag.potion || 0}개`)),
      h('p', { class: 'dim center' }, '동물마다 제일 좋아하는 선물이 있어요. 그걸 주면 친밀도가 1.5배 올라요. 포션은 화면 위 🧪 를 눌러 마셔요.'));
    draw(); modal({ title: '🏪 카피수퍼', body, actions: [{ label: '닫기', primary: true }] });
  }
  function openBag() {
    const body = h('div', { class: 'so-list' }); let cl;
    const draw = () => { const pins = Object.keys(bag.pins || {}).filter(k => bag.pins[k]).map(Number), worn = pinOf(ctx.uid), wares = ANIMALS.map((_, i) => i).filter(i => ctx.owns(wareOf(i).id) && priceOf(wareOf(i).id) > 0);
      body.replaceChildren(h('div', { class: 'so-bagme', html: capy(ctx.capyOf(ctx.uid, { face: 'happy' })) }),
        h('p', { class: 'center' }, Object.entries(GIFTS).map(([k, [ic, nm]]) => `${ic} ${nm} ${bag[k] || 0}개`).join(' · ')),
        h('b', null, `동물에게 받은 액세서리 ${pins.length} / ${ANIMALS.length}`),
        pins.length ? h('div', { class: 'so-pins' }, pins.map(i => h('button', { class: 'so-pin' + (worn === i ? ' on' : ''), onClick: async () => { await wearPin(worn === i ? null : i); draw(); } }, h('span', null, PERSONA[i].pin), h('small', null, worn === i ? '착용 중' : ANIMALS[i].name)))) : h('p', { class: 'dim center' }, `동물과 ${PIN_AT}점까지 친해지면 그 동물의 상징을 선물로 받아요.`),
        h('b', null, `동물에게 산 옷 ${wares.length}벌`),
        wares.length ? h('div', { class: 'so-list' }, wares.map(i => { const w = wareOf(i), on = wearing(w.id); return h('button', { class: 'so-row big' + (on ? ' on' : ''), onClick: async () => { await wearCloth(w.id, !on); draw(); } }, tryOn(w.id), h('b', null, w.name), h('small', null, `${ANIMALS[i].name}에게 삼 · ${on ? '입는 중 (누르면 벗기)' : '누르면 입기'}`)); })) : h('p', { class: 'dim center' }, '동물과 거래하면 그 동물의 옷을 살 수 있어요.'),
        h('p', { class: 'dim center' }, '눌러서 착용하거나 빼요. 다른 화면의 내 카피바라에도 그대로 보여요.')); };
    draw(); cl = modal({ title: '🎒 가방', body, actions: [{ label: '닫기', primary: true }] });
  }

  const offs = [
    ctx.store.on('social', v => { v = v || {}; mine = v[ctx.uid] || {}; theirs = (pid() && v[pid()]) || {}; scores(); }),
    ctx.store.on('bag/' + ctx.uid, v => { bag = v || {}; drawHp(); }),
    ctx.store.on('socialme/' + ctx.uid, v => { const first = vit === null; vit = v || {};
      if (first) { if (vit.deadAt && ctx.store.now() - vit.deadAt < TEN_MIN) lock(); else { if (vit.deadAt) saveVit({ hp: HP_MAX, deadAt: 0 }); scene(); } } else drawHp(); }),
  ];
  return () => { alive = false; endSorry(); clearInterval(lockT); cancelAnimationFrame(raf); offs.forEach(f => f()); window.removeEventListener('keydown', kd); window.removeEventListener('keyup', ku); };
}
