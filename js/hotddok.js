// 핫똑랜드 — 비행기로만 가는 강아지 섬. 한옥 공항 → 공항 안(입국 심사대) → 기와 마을(진돌카이막 장군 동상 · 상점 · 옷가게 · 훈련소 · 진돌카이저 궁 · 어두운 바다)
// 지금은 예시판: 내리면 입국장(여권 제출) → 활주로 광장 → 왼쪽 끝 마을 문 → 넓은 마을(상점가 · 훈련소 · 연못 공원 · 궁 · 나루터) → 궁 안. 상점 · 퀘스트는 다음 차례
import { h, toast, modal, holdBtn } from './ui.js';
import { capy } from './capy.js';
import { sfx, bgm } from './sound.js';
import { askAI } from './social.js';

const BG_W = 1344, BG_H = 576, TOWN_W = 6480, AIR_W = 2628, IMG = 'img/hd/', V = '?v=3';
// [이름, 견종, 상징품, 한마디]
export const DOGS = [
  ['몽실', '말티즈 · 승무원', '🎀 복주머니', '핫똑랜드에 오신 것을 환영하옵니다, 폐하!'], ['송이', '말티즈 · 승무원', '🪭 부채', '폐하, 짐은 저희가 들겠사옵니다!'], ['곱슬', '푸들 · 기장', '🧭 나침반', '폐하를 모신 비행, 일생의 영광이었사옵니다!'],
  ['바둑이', '얼룩귀 강아지', '🦴 뼈다귀', '카피랜드에 제 사촌이 산다던데요!'], ['삽살이', '삽살개', '🥁 북', '둥둥! 귀한 손님 오셨다~'], ['풍산이', '풍산개', '🐯 호랑이 가죽', '호랑이도 제 앞에선 꼬리를 내리지요.'],
  ['동경이', '경주개 동경이', '🏺 기와 조각', '꼬리가 짧은 건 천 년 내력이랍니다.'], ['귤돌이', '제주개', '🍊 귤 바구니', '귤 하나 드셔 보시겠어요?'], ['떡순이', '시바', '🍡 떡', '방금 찐 떡이에요, 말랑말랑!'],
  ['엿가락', '웰시코기', '🍬 엿', '다리는 짧아도 달리기는 일등!'], ['노리', '포메라니안', '🪢 노리개', '이 노리개, 예쁘지요?'], ['솜이', '비숑', '☁️ 솜사탕', '제 머리가 솜사탕 같대요.'],
  ['가래', '닥스훈트', '🍢 가래떡', '길~게 뽑은 가래떡 같다고들 해요.'], ['장군이', '불도그', '♟️ 장기알', '장이야! 한 판 두실래요?'], ['호떡이', '퍼그', '🥞 호떡', '호떡은 뜨거울 때 먹어야 제맛!'],
  ['고추', '치와와', '🌶️ 고추', '작은 고추가 맵다고요!'], ['연이', '골든리트리버', '🪁 방패연', '바람 좋은 날엔 연을 날려요.'], ['윷돌이', '래브라도', '🎲 윷', '모 아니면 도! 윷놀이 하실래요?'],
  ['빙수', '허스키', '🍧 팥빙수', '여긴 좀 덥네요… 빙수 드실래요?'], ['눈꽃', '사모예드', '❄️ 눈꽃 부채', '웃는 얼굴이 제 자랑이에요!'], ['나팔이', '비글', '🎺 나팔', '뿌우~! 폐하 납시오~!'],
  ['먹보', '슈나우저', '🖌️ 붓', '한 글자 써 드릴까요?'], ['댕기', '요크셔테리어', '🎗️ 댕기', '댕기 머리, 오늘 새로 맸어요.'], ['비단이', '시추', '🧶 비단 방석', '방석 위가 제일 좋아요…'],
  ['부메랑', '보더콜리', '🪃 부메랑', '던지면 제가 제일 먼저 물어 와요!'], ['벼루', '달마시안', '⚫ 먹물 벼루', '이 점들, 먹물 튄 거 아니에요!'], ['짚신', '그레이하운드', '🩴 짚신', '짚신 신고 십 리도 한달음!'],
  ['교관', '셰퍼드 · 훈련소 교관', '📯 호루라기', '차렷! …아, 폐하셨군요. 충성!'], ['사자', '차우차우', '🦁 사자 갈기', '사자 아니고 강아지예요.'], ['매화', '스피츠', '🌸 매화 비녀', '매화 비녀, 잘 어울리나요?']];
const ROYAL = { king: ['진돌카이저 2세', '진돗개 호구 · 핫똑랜드의 왕', '👑 옥새', '오오, 전설의 카피랜드 황금폐하! 먼 길 오셨소. 핫똑랜드가 그대를 환영하오!'], gw: ['백구', '진돗개 백구 · 좌호위', '🗡️ 청룡도', '폐하 곁은 제가 지킵니다.'], gb: ['흑구', '진돗개 흑구 · 우호위', '🛡️ 방패', '수상한 자는 없군. 통과!'] };
const WOW = ['와! 설마 전설의 카피랜드 황금폐하?', '와!!!', '진짜야? 털에서 빛이 나!', '황금폐하가 오셨다~!', '꺄아, 실물이 더 귀여우셔!', '폐하, 여기 좀 봐 주세요!', '멍멍! 환영합니다!!', '세상에, 전설이 걸어 다녀…'];
const CHAT = ['오늘은 소나무 향이 좋네요.', '기와 위에 햇볕이 따끈해요.', '폐하, 마을 구경은 하셨어요?', '바다 쪽은 물빛이 깊어요.', '훈련소 교관님은 무서워요…', '궁 앞에선 조용히 해야 해요.'];

const QUICK = { good: ['오늘도 귀엽다!', '너 정말 멋져!', '만나서 반가워!', '털결이 곱다!', '넌 최고의 강아지야'], flat: ['안녕, 뭐 해?', '소나무 향 좋다', '밥은 먹었어?'], bad: ['너 좀 못생겼다', '저리 가, 냄새나', '멍청이 아니야?'] };
const REPLY = { good: ['헤헤, 폐하께 칭찬받았다! 꼬리가 멈추질 않아요!', '황금폐하가 그렇게 말씀해 주시다니… 멍!', '오늘 일기에 꼭 쓸 거예요!'], flat: ['네, 폐하! 마을은 마음에 드세요?', '소나무 그늘에서 쉬다 가세요.', '방금 뼈다귀국 먹었어요!'], bad: ['끼잉… 폐하, 너무하세요.', '으르르… 아무리 폐하라도 그건 좀.', '귀가 축 처져요…'] };
const LEVELS = [[-100, '원수', '💢'], [-30, '사이 나쁨', '😠'], [-5, '서먹', '😐'], [10, '아는 사이', '🙂'], [30, '친구', '😊'], [50, '친한 친구', '🥰'], [80, '단짝', '💖']];
const pick = a => a[Math.floor(Math.random() * a.length)];
// 강아지마다 성격 · 싫어하는 것 · 말투 (AI 대답용). 좋아하는 것은 상징품
const PERS = [['상냥하고 싹싹한 승무원', '무례한 손님', '극존칭 사극 말투(~하옵니다)'], ['꼼꼼하고 다정한 승무원', '지각', '극존칭 사극 말투(~하옵니다)'], ['듬직하고 허풍기 있는 기장', '난기류', '씩씩한 군인 말투(~입니다!)'],
  ['천진난만한 막내', '혼자 있기', '아이 같은 반말'], ['흥 많은 풍물꾼', '조용한 것', '추임새 섞인 구수한 말투(얼쑤~)'], ['용맹하고 과묵한 사냥개', '겁쟁이', '짧고 굵은 말투'],
  ['점잖은 양반', '경박한 것', '옛 선비 말투(~하오, ~이외다)'], ['넉살 좋은 귤 장수', '추위', '제주 사투리 섞인 말투(~수다, ~마씸)'], ['새침한 떡집 딸', '딱딱한 떡', '새침한 존댓말'],
  ['명랑한 달리기 선수', '계단', '숨찬 듯 빠른 말투'], ['공주병 있는 멋쟁이', '헝클어진 털', '도도한 말투(~거든요?)'], ['순하고 느긋한 솜뭉치', '비 오는 날', '느릿느릿한 말투(~해요오)'],
  ['호기심 많은 수다쟁이', '좁은 구멍', '말끝을 늘이는 말투(~라니까요~)'], ['우직한 장기 고수', '훈수 두는 것', '무뚝뚝한 아저씨 말투(~구먼)'], ['먹보 낙천가', '다이어트', '먹는 얘기로 새는 말투'],
  ['작지만 성질 급한 싸움닭', '덩치 큰 개', '톡 쏘는 반말'], ['다정한 동네 형', '싸움', '따뜻하고 푸근한 말투'], ['장난꾸러기 놀이 대장', '심심한 것', '신난 말투(~하자!)'],
  ['쿨하고 시크한 북쪽 개', '더위', '시큰둥한 반말'], ['항상 웃는 긍정왕', '찡그린 얼굴', '밝고 높은 말투(~예요!)'], ['시끄러운 나팔수', '조용히 하라는 말', '큰 소리로 외치는 말투(!!가 많다)'],
  ['깐깐한 서예가', '삐뚤빼뚤한 글씨', '훈장님 말투(~하거라)'], ['수줍음 많은 아가씨', '큰 소리', '수줍은 존댓말(…을 자주 쓴다)'], ['잠 많은 귀부인', '방해받는 낮잠', '졸린 듯 나른한 말투'],
  ['영리한 부메랑 명수', '멍하니 있기', '똑 부러지는 말투'], ['멋 부리는 선비', '얼룩이라는 말', '점잔 빼는 말투'], ['발 빠른 심부름꾼', '느림보', '급하게 줄여 말하는 말투'],
  ['엄격하지만 속정 깊은 교관', '게으름', '군대 교관 말투(~한다, 실시!)'], ['점잖고 느긋한 어르신', '사자라고 놀리는 것', '느긋한 어르신 말투(~허허)'], ['단정한 새침데기', '흙탕물', '또박또박한 존댓말']];
const RPERS = { king: ['위엄 있지만 손님을 반기는 왕', '무례', '임금 말투(~하오, 짐은~)'], gw: ['충직하고 과묵한 호위', '수상한 자', '짧은 무관 말투'], gb: ['날카롭고 의심 많은 호위', '거짓말', '짧은 무관 말투'] };
export function openHotddok(o) {
  const { ctx } = o, demo = !!o.demo; let alive = true, raf = 0, zone = 'in', lastT = performance.now();
  const H = Math.max(280, Math.min(Math.round(innerHeight * 0.52), 520)), W1 = Math.round(H * BG_W / BG_H), DH = 84;
  const Z = { air: { bg: 'air', w: Math.round(H * AIR_W / BG_H), base: 3, span: 26, title: '🐶 핫똑공항 · 활주로' }, in: { bg: 'inn', w: W1, base: 3, span: 22, title: '🐶 핫똑공항 · 입국장' }, town: { bg: 'town', w: Math.round(H * TOWN_W / BG_H), base: 2, span: 21, title: '🏯 핫똑랜드 마을' }, pal: { bg: 'pal', w: W1, base: 3, span: 22, title: '👑 진돌카이저 궁' } };
  const PIER = 0.764, PIER_END = 0.927; // 나루터: 길이 끝나고 바다 위로 뻗은 다리
  const me = { x: Z.in.w * 0.34, y: 0.6 }, meEl = h('div', { class: 'fm-me ap-me', html: capy(ctx.capyOf(ctx.uid, { face: 'happy' })) });
  const npcs = { air: [], in: [], town: [], pal: [] }, keys = new Set(), rel = {}, mem = {}; // 친밀도 · 나눈 말(예시판은 이번 방문 동안만)
  const mk = (z, key, x, y, fixed, b) => { const royal = typeof key === 'string', src = royal ? key : 'd' + key, info = royal ? ROYAL[key] : DOGS[key], W = Z[z].w;
    const n = { key, info, src, pers: royal ? RPERS[key] : PERS[key], x: W * x, y, hx: W * x, tx: W * x, ty: y, wait: Math.random() * 3, fixed, b, say: null, sayT: 0 };
    n.el = h('img', { class: 'hd-dog' + (royal ? ' royal' : ''), src: `${IMG}${src}.webp?v=1`, alt: info[0], style: { height: DH + 'px' }, onClick: () => meet(n) }); npcs[z].push(n); return n; }; // 왕도 밍땅꾸리 · 두두와 같은 키
  mk('air', 2, 0.8, 0.85, 1); mk('in', 1, 0.13, 1, 1); mk('in', 0, 0.27, 0.95, 1); // 활주로 쪽엔 기장, 심사대엔 승무원 둘
  DOGS.forEach((_, i) => i === 27 ? mk('town', 27, 0.292, 0.97, 1) : i === 26 ? mk('town', 26, 0.9, 0.93, 1) : mk('town', i, 0.03 + 0.72 * ((i * 7) % 30 + 0.5) / 30, (i * 0.37) % 1)); // 넓은 마을에 띄엄띄엄(교관은 훈련소 앞, 짚신은 나루터)
  mk('pal', 'king', 0.5, 0, 1, 39); mk('pal', 'gw', 0.39, 0.95, 1); mk('pal', 'gb', 0.61, 0.95, 1); // 왕은 궁 안 옥좌에, 좌우에 백구 · 흑구
  const worlds = {}; for (const z in Z) { worlds[z] = h('div', { class: 'fm-world ap-world hd-world', hidden: z !== zone, style: { width: Z[z].w + 'px', height: H + 'px', backgroundImage: `url(${IMG}${Z[z].bg}.webp${V})` } }, z === 'air' && h('img', { class: 'hd-plane air', src: 'img/air/plane.webp?v=4', alt: '' }), ...npcs[z].map(n => n.el)); } // 타고 온 비행기는 활주로에 그대로 서 있다
  const scroller = h('div', { class: 'fm-scroll' }, ...Object.values(worlds));
  const dpad = h('div', { class: 'dpad ap-dpad' }, [['U', '▲'], ['L', '◀'], ['D', '▼'], ['R', '▶']].map(([k, t]) => { const b = h('button', { class: 'dp ap-dp ap-' + k, 'aria-label': { L: '왼쪽', R: '오른쪽', U: '위', D: '아래' }[k] }, t); holdBtn(b, () => { keys.add(k); b.classList.add('held'); }, () => { keys.delete(k); b.classList.remove('held'); }); return b; }));
  const aLab = h('small', null, '인사'), aBtn = h('button', { class: 'ap-ab ap-a', disabled: true, 'aria-label': 'A', onClick: () => { sfx('keyA'); act && act.go(); } }, aLab); // 이동 · 입장은 모두 A 버튼으로
  const bBtn = h('button', { class: 'ap-ab ap-b', 'aria-label': 'B', onClick: () => { sfx('keyB'); if (zone === 'pal') go('town', 0.703, 0.95); else if (zone === 'town') go('air', 0.05, 0.5); else if (zone === 'air') go('in', 0.86, 0.6); else toast('카피랜드로 돌아가려면 심사대에서 말해요 ✈️', 1800); } }, h('small', null, '나가기'));
  const chatBtn = h('button', { class: 'ap-chat', 'aria-label': '말하기', onClick: () => { sfx('keyC'); npcs[zone].filter(n => Math.abs(n.x - me.x) < 260).slice(0, 4).forEach(n => say(n, n.info[3])); } });
  const scene = h('div', { class: 'fm-scene' }, scroller, h('div', { class: 'fm-pad ap-pad' }, dpad, h('div', { class: 'ap-acts' }, chatBtn, bBtn, aBtn)));
  const title = h('b', null, Z[zone].title);
  const wrap = h('div', { class: 'fm ap hd' }, h('div', { class: 'fm-top' }, title, demo && h('span', { class: 'ap-flight' }, '🧪 예시판'), h('button', { class: 'top-x', 'aria-label': '닫기', onClick: () => leave() }, '✕')), scene);
  document.body.append(wrap); bgm.start('hotddok'); worlds[zone].append(meEl);
  const onKey = e => { const k = { ArrowLeft: 'L', ArrowRight: 'R', ArrowUp: 'U', ArrowDown: 'D' }[e.key] || ''; if (!k) return; if (tailKey && e.type === 'keydown' && (k === 'L' || k === 'R')) { e.preventDefault(); return tailKey(k); } if (document.querySelector('.modal-wrap')) return; e.preventDefault(); if (e.type === 'keydown') keys.add(k); else keys.delete(k); };
  window.addEventListener('keydown', onKey); window.addEventListener('keyup', onKey);
  requestAnimationFrame(() => { scroller.scrollLeft = me.x - scroller.clientWidth / 2; });

  let act = null, seenTown = false, seenKing = false, passed = false, tailKey = null, guideAt = 1;
  function go(z, x, y) { sfx('pop'); worlds[zone].hidden = true; zone = z; worlds[z].hidden = false; me.x = Z[z].w * x; me.y = y == null ? 0.3 : y; worlds[z].append(meEl); title.textContent = Z[z].title; scroller.scrollLeft = Math.max(0, me.x - scroller.clientWidth / 2);
    if (z === 'town' && !seenTown) { seenTown = true; welcome(); } if (z === 'pal' && !seenKing) { seenKing = true; setTimeout(() => alive && zone === 'pal' && say(npcs.pal[0], '오오! 전설의 카피랜드 황금폐하가 아니시오!', 4), 600); } }
  function say(n, t, sec = 3) { if (!n.say) { n.say = h('span', { class: 'ap-say' }); worlds[zone].append(n.say); } n.say.textContent = t; n.say.hidden = false; n.say.classList.remove('pop'); void n.say.offsetWidth; n.say.classList.add('pop'); n.sayT = sec; }
  // 강아지를 누르면: 카피랜드 동물과 같은 구성(얼굴 · 말풍선 · 친밀도 · 빠른 말 세 가지 · 말하기 · 선물/거래/기억). 대답은 강아지마다 성격 · 말투에 맞춰 AI가 한다
  function meet(n) { sfx('pop'); const k = n.src, A = () => rel[k] || 0, lvOf = v => LEVELS.filter(l => l[0] <= v).pop() || LEVELS[0]; let busy = false;
    const bubble = h('p', { class: 'so-bubble' }), meter = h('div', { class: 'so-meter' }), quick = h('div', { class: 'so-quick' }), input = h('input', { class: 'so-input', maxLength: 60, placeholder: `${n.info[0]}에게 하고 싶은 말`, enterKeyHint: 'send' });
    const tell = (t, cls = '') => { bubble.className = 'so-bubble ' + cls; bubble.textContent = t; };
    const draw = () => { const v = A(), lv = lvOf(v), nx = LEVELS.find(l => l[0] > v); meter.replaceChildren(h('b', null, `${lv[2]} ${lv[1]}`), h('i', null, h('u', { style: { width: (v + 100) / 2 + '%', background: v < 0 ? '#E5484D' : v >= 50 ? '#FF7FA8' : '#57C26B' } })), h('span', null, `${v}점${nx ? ` · ${nx[1]}까지 ${nx[0] - v}` : ''}`)); };
    async function talk(t, kind) { t = String(t || '').trim().slice(0, 60); if (!t || busy) return; busy = true; input.value = ''; sfx('tock'); tell('…', 'wait'); const m = mem[k] = mem[k] || [], me0 = (ctx.me && ctx.me.name) || '폐하';
      let r = await askAI(ctx.room, { name: n.info[0], trait: `${n.info[1]}. ${n.pers[0]}. 핫똑랜드라는 한국풍 강아지 섬에 산다. 상대는 전설의 '카피랜드 황금폐하'라서 "폐하"라고 부르며 우러러본다`, likes: n.info[2].replace(/^\S+\s/, ''), hates: n.pers[1], user: me0, a: A(), mem: `(말투 규칙: ${n.pers[2]}. 대답은 반드시 이 말투로, 한두 문장으로 한다)\n` + m.slice(-4).map(x => `${me0}: "${x.s}" → 나: "${x.r}"`).join('\n'), text: t }).catch(() => null);
      if (!r) { const kd = kind || (/(귀엽|멋|최고|좋아|예쁘|반가|사랑|고마)/.test(t) ? 'good' : /(못생|바보|냄새|멍청|싫어|저리)/.test(t) ? 'bad' : 'flat'); r = { reply: pick(REPLY[kd]), delta: kd === 'good' ? 2 : kd === 'bad' ? -3 : 1 }; } // AI를 못 쓰면 낱말로 판정
      busy = false; const d = r.delta; rel[k] = Math.max(-100, Math.min(100, A() + d)); m.push({ s: t, r: r.reply, d }); tell(r.reply, d > 0 ? 'glad' : d < 0 ? 'angry' : ''); draw(); if (d) { sfx(d > 0 ? 'coin' : 'bad'); const f = h('em', { class: 'so-float ' + (d > 0 ? 'up' : 'down') }, (d > 0 ? '+' : '') + d); meter.append(f); setTimeout(() => f.remove(), 1200); } drawQuick(); }
    const drawQuick = () => quick.replaceChildren(...['good', 'flat', 'bad'].map((kd, i) => { const t = pick(QUICK[kd]); return h('button', { class: 'so-q q' + i, onClick: () => talk(t, kd) }, t); }));
    const soon = t => () => toast(`${t}는 곧 열려요 🚧`, 1500);
    const memBtn = () => { const m = mem[k] || []; modal({ title: `📜 ${n.info[0]}가 기억하는 말`, body: m.length ? h('div', { class: 'so-mem' }, m.slice().reverse().map(x => h('p', null, h('b', null, `나: ${x.s}`), h('span', null, `${n.info[0]}: ${x.r}`), h('em', { class: x.d > 0 ? 'up' : x.d < 0 ? 'down' : '' }, (x.d > 0 ? '+' : '') + x.d)))) : h('p', { class: 'center' }, '아직 나눈 말이 없어요.'), actions: [{ label: '닫기', primary: true }] }); };
    input.addEventListener('keydown', e => { if (e.key === 'Enter') talk(input.value); });
    modal({ title: `${n.info[0]} · ${n.info[1]}`, body: h('div', { class: 'so-meet hd-meet' }, h('div', { class: 'so-face' }, h('span', null, h('img', { src: `${IMG}${k}.webp?v=1`, alt: '' })), bubble), meter, h('p', { class: 'so-fed' }, `상징품 ${n.info[2]} · 친한 친구(50점)가 되면 받아요`), quick,
      h('div', { class: 'so-say' }, input, h('button', { class: 'btn primary', onClick: () => talk(input.value) }, '말하기')),
      h('div', { class: 'so-acts' }, h('button', { class: 'btn', onClick: soon('🔍 퀘스트') }, '🔍 퀘스트'), h('button', { class: 'btn', onClick: soon('🎁 선물') }, '🎁 선물'), h('button', { class: 'btn', onClick: soon('🤝 거래') }, '🤝 거래'), h('button', { class: 'btn', onClick: memBtn }, '📜 기억'))), actions: [{ label: '닫기' }] });
    tell(n.info[3]); draw(); drawQuick(); }
  const soon = t => () => toast(`${t} — 곧 문을 열어요 🚧`, 1600);
  function statue() { modal({ title: '🗿 진돌카이막 장군 동상', body: [h('div', { class: 'ap-cnt hd-card' }, h('img', { class: 'hd-gen', src: 'img/quest/bg-h2.webp', alt: '' }), h('p', null, h('b', null, '핫똑랜드를 세운 개국 장군')), h('p', null, '“팔짱을 끼고 바다를 지켜본 지 어언 백 년.”'), h('p', { class: 'ap-cnt-n' }, '마을 강아지들은 지나갈 때마다 꼬리를 한 번씩 흔들어요'))], actions: [{ label: '닫기' }] }); }
  function counter() { modal({ title: '🛂 입국 심사대', body: [h('div', { class: 'ap-cnt hd-card' }, h('img', { src: `${IMG}d1.webp?v=1`, alt: '' }), h('p', null, '폐하, 카피랜드로 돌아가시겠사옵니까?'), demo && h('p', { class: 'ap-cnt-n' }, '🧪 예시판: 누르면 바로 카피공항으로 돌아가요'))], actions: [{ label: '더 구경하기' }, { label: '✈️ 카피랜드로 돌아가기', primary: true, onClick: () => leave() }] }); }
  // 나루터 낚시: 곁에 있던 강아지가 한마디 한다
  function fish() { const n = npcs.town.slice().sort((a, b) => Math.abs(a.x - me.x) - Math.abs(b.x - me.x))[0]; say(n, '우리는 낚시를 하지 않아. 여기 바다에는 맛없는 생선들밖에 없어.', 4.5); toast('🎣 핫똑 나루터 낚시는 곧 열려요 🚧', 1800); }
  // 지금 자리에서 A 버튼으로 할 수 있는 일
  function findAct() { const x = me.x / Z[zone].w, up = me.y > 0.5;
    if (zone === 'air') return Math.abs(x - 0.683) < 0.035 && up ? { t: '입장', go: () => go('in', 0.86, 0.5) } : x < 0.06 ? { t: '마을', go: () => go('town', 0.012, 0.5) } : near();
    if (zone === 'in') return x > 0.8 ? (passed ? { t: '나가기', go: () => go('air', 0.683, 0.9) } : { t: '나가기', go: () => { say(npcs.in[1], '폐하, 먼저 심사대에서 여권을 제출해 주시옵소서!', 3.5); } }) : x < 0.3 && up ? (passed ? { t: '심사대', go: counter } : { t: '여권 제출', go: stamp }) : near();
    if (zone === 'pal') return x > 0.86 ? { t: '마을', go: () => go('town', 0.703, 0.95) } : Math.abs(x - 0.5) < 0.09 && up ? { t: '알현', go: () => meet(npcs.pal[0]) } : near();
    if (x < 0.006) return { t: '공항', go: () => go('air', 0.05, 0.5) };
    if (x > 0.9) return { t: '낚시', go: fish };
    if (up) { const b = [[0.07, 0.094, '동상', statue], [0.095, 0.116, '상점', soon('🪃 부메랑상회')], [0.13, 0.152, '옷가게', soon('👘 비단옷집')], [0.168, 0.19, '찻집', soon('🍵 솔향찻집')], [0.213, 0.236, '떡집', soon('🍡 꿀떡방')], [0.255, 0.305, '훈련소', soon('🎯 훈련소')], [0.44, 0.5, '정자', () => toast('🏞️ 연못 정자 — 연꽃 향기에 바람이 시원해요', 1800)], [0.61, 0.632, '목욕집', soon('♨️ 솔숲탕')], [0.69, 0.717, '입궁', () => go('pal', 0.84, 0.3)]].find(r => x >= r[0] && x <= r[1]); if (b) return { t: b[2], go: b[3] }; }
    return near(); }
  function near() { let best = null, bd = 46; for (const n of npcs[zone]) { const d = Math.hypot(n.x - me.x, (n.y - me.y) * 30); if (d < bd) { bd = d; best = n; } } return best ? { t: '인사', go: () => meet(best) } : null; }
  // 입국 도장: 심사대에서 여권을 내면 펼쳐지고 "입국" 도장이 쾅
  function stamp() { if (document.querySelector('.apv')) return; const bub = h('span', { class: 'apv-say' }, '폐하, 여권을 받들겠사옵니다…'), ok = h('button', { class: 'btn primary apv-ok', onClick: () => { el.remove(); say(npcs.in[0], '입국을 환영하옵니다, 폐하!', 3.5); setTimeout(() => alive && zone === 'in' && say(npcs.in[1], '오른쪽 문으로 나가시면 활주로이옵니다.', 4), 900); } }, '🐾 핫똑랜드 입국하기');
    const page = h('div', { class: 'apv-page' }, h('div', { class: 'apv-photo', html: capy(ctx.capyOf(ctx.uid, { face: 'smile' })) }), h('dl', null, h('dt', null, '국적'), h('dd', null, '카피랜드'), h('dt', null, '직위'), h('dd', null, '카피황금폐하'), h('dt', null, '도착지'), h('dd', null, '핫똑랜드')), h('div', { class: 'apv-stamp hd-in' }, h('b', null, '입국'), h('small', null, 'HOTDDOK LAND')));
    const el = h('div', { class: 'apv' }, h('p', { class: 'apv-t' }, '🛂 핫똑랜드 입국 심사'), h('div', { class: 'apv-book' }, page, h('img', { class: 'apv-cover', src: 'img/quest/passport.webp', alt: '' })), h('div', { class: 'apv-crew' }, h('img', { src: `${IMG}d0.webp?v=1`, alt: '' }), h('img', { src: `${IMG}d1.webp?v=1`, alt: '' }), bub), ok);
    document.body.append(el); sfx('pop'); setTimeout(() => { if (el.isConnected) { sfx('boom'); passed = true; } }, 1950); setTimeout(() => { if (!el.isConnected) return; bub.textContent = '어서 오시옵소서, 황금폐하!!'; bub.classList.add('bow'); el.classList.add('done'); sfx('fanfare'); }, 2350); }
  // 마을 첫 입장: 마중 그림 → 주인공이 망설이다 → 꼬리댄스(◀ ▶ 번갈아 연타) → 왕과 강아지들이 기뻐하는 그림 → 마을
  function welcome() { const el = h('div', { class: 'hd-wel', onClick: () => { el.remove(); tailDance(); } }, h('img', { src: `${IMG}welcome.webp?v=1`, alt: '' }), h('b', null, '🎉 진돌카이저 2세와 강아지들이 마중 나왔어요!'), h('small', null, '눌러서 계속')); document.body.append(el); sfx('fanfare'); }
  function tailDance() { let n = 0, last = '', done = false; const NEED = 26, front = capy(ctx.capyOf(ctx.uid, { face: 'shy' })), back = capy(ctx.capyOf(ctx.uid, { view: 'back' }));
    const cap = h('div', { class: 'hd-tail-me', html: front }), msg = h('b', null, '이렇게까지 반겨 주다니… 어, 어떡하지…?'), sub = h('small', null, ' '), bar = h('u'), gauge = h('i', { class: 'hd-tail-g' }, bar);
    const hit = k => { if (done || !cap.classList.contains('dance')) return; if (k !== last) { n += 1; last = k; sfx('tock'); } else n += 0.25; cap.classList.toggle('l', k === 'L'); cap.classList.toggle('r', k === 'R'); bar.style.width = Math.min(100, n / NEED * 100) + '%'; if (n >= NEED) finish(); };
    const btn = k => { const b = h('button', { class: 'hd-tail-b', 'aria-label': k === 'L' ? '왼쪽' : '오른쪽' }, k === 'L' ? '◀' : '▶'); b.addEventListener('pointerdown', e => { e.preventDefault(); hit(k); }); return b; };
    const el = h('div', { class: 'hd-tail' }, h('img', { class: 'hd-tail-bg', src: `${IMG}welcome.webp?v=1`, alt: '' }), msg, sub, cap, gauge, h('div', { class: 'hd-tail-btns' }, btn('L'), btn('R'))); document.body.append(el);
    const dec = setInterval(() => { if (done || !el.isConnected) return clearInterval(dec); n = Math.max(0, n - 0.35); bar.style.width = Math.min(100, n / NEED * 100) + '%'; }, 200);
    setTimeout(() => { if (!el.isConnected) return; cap.innerHTML = back; cap.classList.add('dance'); msg.textContent = '💃 꼬리댄스로 화답하자!'; sub.textContent = '◀ ▶ 를 번갈아 빠르게 눌러요'; el.classList.add('go'); tailKey = hit; sfx('pop'); }, 2000);
    function finish() { done = true; tailKey = null; sfx('fanfare'); cap.classList.add('win'); setTimeout(() => { el.remove(); party(); }, 700); } }
  function party() { const conf = h('div', { class: 'hd-conf' }); for (let i = 0; i < 44; i++) conf.append(h('i', { style: { left: Math.random() * 100 + '%', animationDelay: (Math.random() * 1.8).toFixed(2) + 's', animationDuration: (2 + Math.random() * 1.8).toFixed(2) + 's', background: ['#FFD54A', '#FF8FB1', '#9BE1FF', '#FFB347', '#B8F28A'][i % 5] } }));
    const el = h('div', { class: 'hd-wel party', onClick: () => close() }, conf, h('img', { src: `${IMG}party.webp?v=1`, alt: '' }), h('b', null, '🎆 핫똑랜드 모두가 폐하를 환영합니다!'), h('small', null, '“와아아! 꼬리댄스 최고!!” · 눌러서 마을로')); let t = setTimeout(() => close(), 6000);
    function close() { if (!el.isConnected) return; clearTimeout(t); el.remove(); wow(); } document.body.append(el); sfx('fanfare'); setTimeout(() => el.isConnected && sfx('coin'), 500); }
  function wow() { const list = npcs.town.slice().sort((a, b) => Math.abs(a.x - me.x) - Math.abs(b.x - me.x)); list.forEach((n, i) => { n.el.classList.add('wow'); setTimeout(() => n.el.classList.remove('wow'), 2600); if (i < WOW.length) setTimeout(() => alive && zone === 'town' && say(n, WOW[i], 2.6), i * 420); }); }

  let talkAt = 6;
  function step(t) { if (!alive) return; const dt = Math.min(0.05, (t - lastT) / 1000); lastT = t; const zz = Z[zone], W = zz.w, modalOn = !!document.querySelector('.modal-wrap,.apv,.hd-wel,.hd-tail');
    const dx = modalOn ? 0 : (keys.has('R') ? 1 : 0) - (keys.has('L') ? 1 : 0), dy = modalOn ? 0 : (keys.has('U') ? 1 : 0) - (keys.has('D') ? 1 : 0);
    me.x = Math.max(W * 0.004, Math.min(W * (zone === 'town' ? PIER_END : 0.99), me.x + dx * 150 * dt)); me.y = Math.max(0, Math.min(1, me.y + dy * 1.1 * dt)); if (zone === 'town' && me.x > W * PIER) me.y = Math.max(me.y, Math.min(0.88, 0.2 + (me.x / W - PIER) * 60)); // 나루터는 바다 위 좁은 다리
    meEl.classList.toggle('walk', !!(dx || dy)); if (dx) meEl.classList.toggle('left', dx < 0);
    meEl.style.left = me.x + 'px'; meEl.style.bottom = `${zz.base + me.y * zz.span}%`; meEl.style.transform = `translateX(-50%) scale(${(1 - me.y * 0.14).toFixed(3)})`; meEl.style.zIndex = String(20 - Math.round(me.y * 10));
    const want = me.x - scroller.clientWidth / 2; if (Math.abs(scroller.scrollLeft - want) > 4 && (dx || dy)) scroller.scrollLeft += (want - scroller.scrollLeft) * Math.min(1, dt * 6);
    for (const n of npcs[zone]) { if (!n.fixed) { if (n.wait > 0) { n.wait -= dt; n.el.classList.remove('go'); if (n.wait <= 0) { n.tx = Math.max(W * 0.015, Math.min(W * 0.755, n.hx + (Math.random() - 0.5) * 560)); n.ty = Math.random(); } }
        else { const ex = n.tx - n.x, ey = (n.ty - n.y) * 60, d = Math.hypot(ex, ey); if (d < 3) n.wait = 1.5 + Math.random() * 4; else { n.x += ex / d * 34 * dt; n.y += ey / d * 34 * dt / 60; n.el.classList.add('go'); } } }
      const bt = n.b != null ? n.b : zz.base + n.y * zz.span; n.el.style.left = n.x + 'px'; n.el.style.bottom = bt + '%'; n.el.style.zIndex = String(20 - Math.round(n.y * 10)); n.el.style.setProperty('--s', (1 - Math.min(1, n.y) * 0.14).toFixed(3));
      if (n.say && !n.say.hidden) { if ((n.sayT -= dt) <= 0) n.say.hidden = true; else { n.say.style.left = n.x + 'px'; n.say.style.bottom = `calc(${bt}% + ${n.el.offsetHeight + 4}px)`; n.say.style.zIndex = '40'; } } }
    if (zone === 'in' && !passed && !modalOn && (guideAt -= dt) <= 0) { guideAt = 5; say(npcs.in[1], '폐하, 이쪽 심사대에서 여권을 제출해 주시옵소서!', 3.6); setTimeout(() => alive && !passed && zone === 'in' && say(npcs.in[0], '심사대 앞에서 A 버튼이옵니다!', 3), 1200); } // 말티즈 승무원들이 여권 제출을 안내한다
    if (!modalOn && zone !== 'in' && (talkAt -= dt) <= 0) { talkAt = 4 + Math.random() * 4; const c = npcs[zone].filter(n => Math.abs(n.x - me.x) < 300); if (c.length) { const n = pick(c); say(n, Math.random() < 0.5 ? n.info[3] : pick(zone === 'town' ? CHAT : WOW)); } }
    act = modalOn ? null : findAct(); if (aBtn.disabled === !!act) { aBtn.disabled = !act; aBtn.classList.toggle('ready', !!act); } if (act && aLab.textContent !== act.t) aLab.textContent = act.t;
    raf = requestAnimationFrame(step); }
  raf = requestAnimationFrame(step);
  function leave() { if (!alive) return; alive = false; tailKey = null; window.removeEventListener('keydown', onKey); window.removeEventListener('keyup', onKey); cancelAnimationFrame(raf); document.querySelectorAll('.modal-wrap,.apv,.hd-wel,.hd-tail').forEach(m => m.remove()); wrap.remove(); o.onClose && o.onClose(); }
  return { close: leave };
}
