// 동물 친목회 — 놀이터에서 동물 30마리와 말하고, 선물하고, 거래한다. 친밀도와 기억은 사람마다 따로다
import { h, toast, modal, gameFx } from './ui.js';
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
  let alive = true, mine = {}, theirs = {}, bag = {}, scroller, meEl, lastX = 0, walkT = 0;
  const pid = () => ctx.partnerId, A = i => (mine[i] && mine[i].a) || 0;
  const H = Math.round(Math.min(innerHeight * 0.62, 470)), TILE = Math.round(H * 1213 / 520), TILES = 3, WIDTH = TILE * TILES;
  // 놀이기구 자리: [종류, 그림 속 가로 위치(0~1), 바닥에서 높이(0~1)]
  const SPOT_DEFS = [['slide', 0.243, 0.385], ['swing', 0.292, 0.4], ['swing', 0.327, 0.4], ['seeL', 0.405, 0.42], ['seeR', 0.478, 0.46], ['sand', 0.555, 0.41], ['gym', 0.675, 0.4], ['bench', 0.768, 0.435]];
  const spots = []; for (let k = 0; k < TILES; k++) SPOT_DEFS.forEach(([type, fx, fb]) => spots.push({ type, x: (k + (k % 2 ? 1 - fx : fx)) * TILE, b: fb, dir: k % 2 ? -1 : 1, by: -1 }));
  const moodOf = v => (v <= -30 ? 'mad' : v < 0 ? 'angry' : '');
  let actors = [], held = -1, raf = 0, lastT = 0;
  const setRel = (i, patch) => { mine = { ...mine, [i]: { ...(mine[i] || {}), ...patch } }; return ctx.store.update(`social/${ctx.uid}/${i}`, patch).catch(() => {}); };
  const pinOf = u => (ctx.members[u] || {}).pin;

  function scene() {
    const top = h('div', { class: 'so-top' }, h('span', { class: 'coin-chip', 'data-coins': 1 }, won(ctx.coins())), h('span', { class: 'so-sp' }),
      h('button', { class: 'btn sm', onClick: openBag }, '🎒 가방'), h('button', { class: 'btn sm', onClick: openShop }, '🏪 카피수퍼'));
    scroller = h('div', { class: 'so-scroll' });
    const world = h('div', { class: 'so-world', style: { width: WIDTH + 'px', height: H + 'px', '--sx': Math.round(-0.05 * TILE) + 'px', '--sy': Math.round(-0.115 * H) + 'px', '--gy': Math.round(-0.13 * H) + 'px', '--pv': Math.round(-0.07 * H) + 'px' } },
      ...Array.from({ length: TILES }, (_, k) => h('i', { class: 'so-bg' + (k % 2 ? ' flip' : ''), style: { left: k * TILE + 'px', width: TILE + 1 + 'px' } })));
    actors = ANIMALS.map((a, i) => { const x = 60 + (i + 0.5) * (WIDTH - 120) / ANIMALS.length;
      const e = h('button', { class: 'so-an' + (i % 2 ? ' back' : ''), 'data-i': i, style: { left: x + 'px' }, onClick: () => openAnimal(i) }, h('span', { class: 'so-score' }), h('span', { class: 'so-hearts' }), h('span', { class: 'so-body', html: animalSvg(i, true) }), h('small', null, a.name));
      world.append(e); return { e, x, st: 'idle', until: performance.now() + 400 + Math.random() * 3500, tx: x, spot: null, sp: 24 + Math.random() * 16 }; });
    meEl = h('div', { class: 'so-me', html: capy(ctx.capyOf(ctx.uid, { face: 'happy' })) }); world.append(meEl);
    scroller.append(world);
    scroller.addEventListener('scroll', () => { const x = scroller.scrollLeft + scroller.clientWidth / 2; meEl.style.left = x + 'px'; meEl.classList.toggle('left', x < lastX); meEl.classList.add('walk'); lastX = x; clearTimeout(walkT); walkT = setTimeout(() => meEl.classList.remove('walk'), 160); }, { passive: true });
    el.replaceChildren(top, scroller, h('p', { class: 'dim center' }, '옆으로 밀어서 놀이터를 돌아다녀요. 돌아다니는 동물을 누르면 멈춰서 말을 걸 수 있어요.'));
    requestAnimationFrame(() => { meEl.style.left = scroller.clientWidth / 2 + 'px'; }); scores(); lastT = performance.now(); raf = requestAnimationFrame(step);
  }
  // 동물들이 걸어 다니다가 가까운 놀이기구가 비면 가서 탄다. 말을 걸고 있는 동물(held)은 그 자리에 멈춘다
  function leave(o) { if (!o.spot) return; o.e.className = o.e.className.replace(/ ride r-\w+/g, '').replace(' rev', ''); o.e.style.bottom = ''; o.spot.by = -1; o.spot = null; }
  function decide(o, i, now) {
    const free = Math.random() < 0.25 ? spots.filter(s => s.by < 0 && Math.abs(s.x - o.x) < 520) : [];
    if (free.length) { const s = pick(free); s.by = i; o.spot = s; o.tx = s.x; } else o.tx = Math.max(50, Math.min(WIDTH - 50, o.x + (Math.random() * 2 - 1) * 240));
    o.st = 'walk'; o.e.classList.add('walk'); o.e.classList.toggle('left', o.tx < o.x);
  }
  function step(now) {
    if (!alive) return; const dt = Math.min(0.1, (now - lastT) / 1000); lastT = now;
    actors.forEach((o, i) => { if (i === held) return;
      if (o.st === 'walk') { const d = o.tx - o.x, mv = o.sp * dt;
        if (Math.abs(d) <= mv) { o.x = o.tx; o.e.classList.remove('walk', 'left');
          if (o.spot) { o.st = 'ride'; o.until = now + 9000 + Math.random() * 7000; o.e.className += ' ride r-' + o.spot.type + (o.spot.dir < 0 ? ' rev' : ''); o.e.style.bottom = o.spot.b * 100 + '%'; }
          else { o.st = 'idle'; o.until = now + 900 + Math.random() * 3600; } }
        else o.x += Math.sign(d) * mv;
        o.e.style.left = o.x + 'px'; }
      else if (now > o.until) { if (o.st === 'ride') { leave(o); o.st = 'idle'; o.until = now + 700; } else decide(o, i, now); } });
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
    const say = (t, cls = '') => { bubble.className = 'so-bubble ' + cls; bubble.textContent = t; };
    const drawMeter = () => { const v = A(i), lv = levelOf(v), nx = LEVELS.find(l => l[0] > v); if (moodOf(v) !== faceMood) { faceMood = moodOf(v); faceEl.innerHTML = animalSvg(i, true, faceMood); } meter.replaceChildren(h('b', null, `${lv[2]} ${lv[1]}`), h('i', null, h('u', { style: { width: (v + 100) / 2 + '%', background: v < 0 ? '#E5484D' : v >= PIN_AT ? '#FF7FA8' : '#57C26B' } })), h('span', null, `${v}점${nx ? ` · ${nx[1]}까지 ${nx[0] - v}` : ''}`)); scores(); };
    const drawQuick = () => quick.replaceChildren(...[pick(QUICK.good), pick(QUICK.flat), pick(QUICK.bad)].map((t, k) => h('button', { class: 'so-q q' + k, onClick: () => talk(t) }, t)));
    // 친밀도가 바뀐 뒤: 선물로 받는 액세서리, 사이가 나쁠 때 삥 뜯기
    async function after(d, was) {
      const v = A(i), rel = mine[i] || {};
      if (d) { sfx(d > 0 ? 'coin' : 'bad'); const f = h('em', { class: 'so-float ' + (d > 0 ? 'up' : 'down') }, (d > 0 ? '+' : '') + d); meter.append(f); setTimeout(() => f.remove(), 1200); }
      if (v >= PIN_AT && !rel.got) { await setRel(i, { got: true }); await ctx.store.update('bag/' + ctx.uid + '/pins', { [i]: true }).catch(() => {}); bag = { ...bag, pins: { ...(bag.pins || {}), [i]: true } };
        setTimeout(() => { gameFx('win', `${a.name}의 ${p.pin} 받음`); say(`우리 이제 친한 친구지? 내 상징 ${p.pin} 줄게. 가방에서 달아 봐!`, 'gift'); }, 500); }
      else if (v <= ROB_AT && d < 0 && Math.random() < 0.4) { // 사이가 나쁘면 준 액세서리를 뺏거나 돈을 뜯는다
        if ((bag.pins || {})[i]) { await ctx.store.update('bag/' + ctx.uid + '/pins', { [i]: null }).catch(() => {}); bag = { ...bag, pins: { ...(bag.pins || {}), [i]: null } }; if (pinOf(ctx.uid) === i) ctx.store.update('members/' + ctx.uid, { pin: null }).catch(() => {}); await setRel(i, { got: null }); setTimeout(() => { sfx('hit'); say(`내가 준 ${p.pin} 도로 내놔! 너한텐 아까워!`, 'angry'); }, 600); }
        else { const take = Math.min(ctx.coins(), 20 + Math.floor(Math.random() * 41)); if (take > 0) { await ctx.spend(take); setTimeout(() => { sfx('hit'); say(`까불지 마! 가진 돈 ${take}🪙 내놔!`, 'angry'); toast(`${a.name}에게 ${take} 🪙 뜯겼어요`, 2000); }, 600); } } }
      drawMeter();
    }
    async function talk(text) {
      text = text.trim().slice(0, 60); if (!text || busy) return; busy = true; input.value = ''; said = text; sfx('tock');
      const rel = mine[i] || {}, day = today(), n = rel.day === day ? rel.n || 0 : 0, mem = Array.isArray(rel.mem) ? rel.mem : Object.values(rel.mem || {});
      if (n >= TALKS) { say(pick(LINES.tired)); busy = false; return; }
      say('…', 'wait');
      let r = await askAI(ctx.room, { name: a.name, trait: p.trait, likes: p.likes.join(', '), hates: p.hates.join(', '), user: ctx.me.name, a: A(i), mem: mem.slice(-4).map(m => `${ctx.me.name}: "${m.s}" → 나: "${m.r}"`).join('\n'), text });
      if (!r) { r = judgeLocal(text, p); const old = mem.length && Math.random() < 0.35 ? pick(mem) : null; // AI를 못 쓰면 낱말로 판정하고, 가끔 예전 말을 꺼낸다
        if (A(i) < -10 && r.delta <= 0) r.reply = pick(LINES.cold); else if (old && old.d < 0) r.reply += ` …그리고 저번에 "${old.s}"라고 한 거, 아직 안 잊었어.`; else if (old && old.d > 0) r.reply += ` 저번에 "${old.s}"라고 해 줘서 기뻤어.`; }
      if (!alive) return; const d = r.delta, v = Math.max(-100, Math.min(100, A(i) + d));
      await setRel(i, { a: v, day, n: n + 1, mem: [...mem.slice(-5), { s: text, r: r.reply.slice(0, 120), d, t: ctx.store.now() }] });
      say(r.reply, d > 0 ? 'glad' : d < 0 ? 'angry' : ''); busy = false; drawQuick(); after(d);
    }
    function give() {
      const have = Object.keys(GIFTS).filter(k => (bag[k] || 0) > 0);
      if (!have.length) return modal({ title: '🎁 줄 선물이 없어요', body: h('p', { class: 'center' }, '카피수퍼에서 선물을 살 수 있어요.'), actions: [{ label: '닫기' }, { label: '🏪 카피수퍼 가기', primary: true, onClick: c => { c(); openShop(); } }] });
      const cl = modal({ title: `🎁 ${a.name}에게 선물하기`, body: h('div', { class: 'so-list' }, have.map(k => { const [ic, nm, , up] = GIFTS[k]; return h('button', { class: 'so-row', onClick: async () => { cl(); const bonus = p.fav === k ? Math.ceil(up * 0.5) : 0, v = Math.min(100, A(i) + up + bonus);
        await ctx.store.update('bag/' + ctx.uid, { [k]: (bag[k] || 0) - 1 }).catch(() => {}); bag = { ...bag, [k]: (bag[k] || 0) - 1 }; await setRel(i, { a: v });
        say(bonus ? `우와, ${nm}! 내가 제일 좋아하는 거야! 고마워!` : `${nm} 주는 거야? 고마워, 잘 쓸게!`, 'glad'); after(up + bonus); } }, h('span', null, ic), h('b', null, nm), h('small', null, `${bag[k]}개 · 친밀도 +${up}`)); })), actions: [{ label: '닫기' }] });
    }
    function trade() {
      const v = A(i), ware = wareOf(i), disc = v >= 50 ? 0.5 : v >= 20 ? 0.75 : 1, wp = Math.round(priceOf(ware.id) * disc), hasPin = (bag.pins || {})[i];
      if (v < 0) return say('너한텐 아무것도 안 팔아. 저리 가!', 'angry');
      const row = (ic, nm, sub, price, owned, fn) => h('button', { class: 'so-row', disabled: owned, onClick: fn }, h('span', null, ic), h('b', null, nm), h('small', null, owned ? '이미 갖고 있어요' : `${won(price)} · ${sub}`));
      const cl = modal({ title: `🤝 ${a.name}와 거래`, body: h('div', { class: 'so-list' },
        row(p.pin, `${a.name}의 상징 액세서리`, v >= 10 ? '친해지면(50점) 그냥 줘요' : '아는 사이(10점)부터 팔아요', 500, hasPin, async () => { if (v < 10) return toast('아직 그 정도로 친하지 않대요'); if (!(await ctx.spend(500))) return; await ctx.store.update('bag/' + ctx.uid + '/pins', { [i]: true }).catch(() => {}); bag = { ...bag, pins: { ...(bag.pins || {}), [i]: true } }; await setRel(i, { got: true }); cl(); say(`자, ${p.pin} 여기. 잘 달고 다녀!`, 'glad'); }),
        row('👕', `${a.name}의 옷: ${ware.name}`, disc < 1 ? `친구 할인 ${Math.round((1 - disc) * 100)}%` : '친해지면 깎아 줘요', wp, ctx.owns(ware.id), async () => { if (!(await ctx.spend(wp))) return; await ctx.store.set(`owned/${ctx.uid}/${ware.id}`, true).catch(() => {}); ctx.owned[ctx.uid] = { ...(ctx.owned[ctx.uid] || {}), [ware.id]: true }; cl(); say(`${ware.name}, 너한테 잘 어울릴 거야. 옷놀이에서 입어 봐!`, 'glad'); })), actions: [{ label: '닫기' }] });
    }
    const memBtn = () => { const mem = Array.isArray((mine[i] || {}).mem) ? mine[i].mem : Object.values((mine[i] || {}).mem || {}); modal({ title: `📜 ${a.name}가 기억하는 말`, body: mem.length ? h('div', { class: 'so-mem' }, mem.slice().reverse().map(m => h('p', null, h('b', null, `나: ${m.s}`), h('span', null, `${a.name}: ${m.r}`), h('em', { class: m.d > 0 ? 'up' : m.d < 0 ? 'down' : '' }, (m.d > 0 ? '+' : '') + m.d)))) : h('p', { class: 'center' }, '아직 나눈 말이 없어요.'), actions: [{ label: '닫기', primary: true }] }); };
    input.addEventListener('keydown', e => { if (e.key === 'Enter') talk(input.value); });
    close = modal({ title: `${a.name} · ${p.trait}`, body: h('div', { class: 'so-meet' },
      h('div', { class: 'so-face' }, faceEl, bubble), meter, quick,
      h('div', { class: 'so-say' }, input, h('button', { class: 'btn primary', onClick: () => talk(input.value) }, '말하기')),
      h('div', { class: 'so-acts' }, h('button', { class: 'btn', onClick: give }, '🎁 선물'), h('button', { class: 'btn', onClick: trade }, '🤝 거래'), h('button', { class: 'btn', onClick: memBtn }, '📜 기억'))), actions: [{ label: '닫기' }], onClose: () => { if (held === i) held = -1; const o = actors[i]; if (o && o.st === 'walk') o.e.classList.add('walk'); } });
    const v = A(i); say(v <= ROB_AT ? pick(LINES.cold) : v >= PIN_AT ? `${ctx.me.name}! 왔구나, 보고 싶었어!` : v >= 10 ? `안녕, ${ctx.me.name}! 또 만났네.` : `안녕? 난 ${a.name}야. ${p.likes[0]} 좋아해.`); drawMeter(); drawQuick();
  }

  // ----- 카피수퍼·가방 -----
  function openShop() {
    const body = h('div', { class: 'so-list' }), draw = () => body.replaceChildren(h('p', { class: 'center' }, '내 돈 ', h('b', { 'data-coins': 1 }, won(ctx.coins()))),
      ...Object.entries(GIFTS).map(([k, [ic, nm, price, up]]) => h('button', { class: 'so-row', onClick: async () => { if (!(await ctx.spend(price))) return; bag = { ...bag, [k]: (bag[k] || 0) + 1 }; await ctx.store.update('bag/' + ctx.uid, { [k]: bag[k] }).catch(() => {}); toast(`${nm} 샀어요`); draw(); } }, h('span', null, ic), h('b', null, nm), h('small', null, `${won(price)} · 친밀도 +${up} · 가진 것 ${bag[k] || 0}개`))),
      h('p', { class: 'dim center' }, '동물마다 제일 좋아하는 선물이 있어요. 그걸 주면 친밀도가 1.5배 올라요.'));
    draw(); modal({ title: '🏪 카피수퍼', body, actions: [{ label: '닫기', primary: true }] });
  }
  function openBag() {
    const pins = Object.keys(bag.pins || {}).filter(k => bag.pins[k]).map(Number), worn = pinOf(ctx.uid), body = h('div', { class: 'so-list' });
    const wear = async i => { await ctx.store.update('members/' + ctx.uid, { pin: i }).catch(() => {}); ctx.members[ctx.uid] = { ...(ctx.members[ctx.uid] || {}), pin: i }; toast(i == null ? '액세서리를 뺐어요' : `${ANIMALS[i].name}의 상징 ${PERSONA[i].pin} 달았어요`); cl(); scores(); };
    body.replaceChildren(h('p', { class: 'center' }, Object.entries(GIFTS).map(([k, [ic, nm]]) => `${ic} ${nm} ${bag[k] || 0}개`).join(' · ')),
      h('b', null, `동물에게 받은 액세서리 ${pins.length} / ${ANIMALS.length}`),
      pins.length ? h('div', { class: 'so-pins' }, pins.map(i => h('button', { class: 'so-pin' + (worn === i ? ' on' : ''), onClick: () => wear(worn === i ? null : i) }, h('span', null, PERSONA[i].pin), h('small', null, ANIMALS[i].name)))) : h('p', { class: 'dim center' }, `동물과 ${PIN_AT}점까지 친해지면 그 동물의 상징을 선물로 받아요.`),
      pins.length > 0 && h('p', { class: 'dim center' }, '눌러서 달거나 빼요. 달면 내 카피바라 머리 옆에 보여요.'));
    const cl = modal({ title: '🎒 가방', body, actions: [{ label: '닫기', primary: true }] });
  }

  const offs = [
    ctx.store.on('social', v => { v = v || {}; mine = v[ctx.uid] || {}; theirs = (pid() && v[pid()]) || {}; scores(); }),
    ctx.store.on('bag/' + ctx.uid, v => { bag = v || {}; }),
  ];
  scene();
  return () => { alive = false; cancelAnimationFrame(raf); offs.forEach(f => f()); };
}
