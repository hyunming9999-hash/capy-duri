// 핫똑랜드 — 비행기로만 가는 강아지 섬. 한옥 공항 → 공항 안(입국 심사대) → 기와 마을(진돌카이막 장군 동상 · 상점 · 옷가게 · 훈련소 · 진돌카이저 궁 · 어두운 바다)
// 지금은 예시판: 내리면 입국 심사대 앞 → 공항 안에서 마을 출구로 → 카피랜드만큼 넓은 마을(3장) → 진돌카이저 궁 안. 상점 · 퀘스트는 다음 차례
import { h, toast, modal, holdBtn } from './ui.js';
import { capy } from './capy.js';
import { sfx, bgm } from './sound.js';

const BG_W = 1344, BG_H = 576, TOWN_W = 3912, IMG = 'img/hd/', V = '?v=2';
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
export function openHotddok(o) {
  const { ctx } = o, demo = !!o.demo; let alive = true, raf = 0, zone = 'in', lastT = performance.now();
  const H = Math.max(280, Math.min(Math.round(innerHeight * 0.52), 520)), W1 = Math.round(H * BG_W / BG_H), DH = 84;
  const Z = { air: { bg: 'air', w: W1, base: 3, span: 26, title: '🐶 핫똑공항 · 활주로' }, in: { bg: 'inn', w: W1, base: 3, span: 22, title: '🐶 핫똑공항 · 입국장' }, town: { bg: 'town', w: Math.round(H * TOWN_W / BG_H), base: 13, span: 10, title: '🏯 핫똑랜드 마을' }, pal: { bg: 'pal', w: W1, base: 3, span: 22, title: '👑 진돌카이저 궁' } };
  const me = { x: Z.in.w * 0.2, y: 0.55 }, meEl = h('div', { class: 'fm-me ap-me', html: capy(ctx.capyOf(ctx.uid, { face: 'happy' })) });
  const npcs = { air: [], in: [], town: [], pal: [] }, keys = new Set(), rel = {}, mem = {}; // 친밀도 · 나눈 말(예시판은 이번 방문 동안만)
  const mk = (z, key, x, y, fixed, b) => { const royal = typeof key === 'string', src = royal ? key : 'd' + key, info = royal ? ROYAL[key] : DOGS[key], W = Z[z].w;
    const n = { key, info, src, x: W * x, y, hx: W * x, tx: W * x, ty: y, wait: Math.random() * 3, fixed, b, say: null, sayT: 0 };
    n.el = h('img', { class: 'hd-dog' + (royal ? ' royal' : ''), src: `${IMG}${src}.webp?v=1`, alt: info[0], style: { height: (key === 'king' ? DH * 1.2 : royal ? DH * 1.1 : DH) + 'px' }, onClick: () => meet(n) }); npcs[z].push(n); return n; };
  mk('air', 2, 0.6, 0.85, 1); mk('in', 1, 0.13, 1, 1); mk('in', 0, 0.3, 0.9, 1); // 활주로 쪽엔 기장, 심사대엔 승무원 둘
  DOGS.forEach((_, i) => i === 27 ? mk('town', 27, 0.455, 1.02, 1) : mk('town', i, 0.04 + 0.87 * ((i * 7) % 30 + 0.5) / 30, (i * 0.37) % 1)); // 30마리가 넓은 마을을 돌아다닌다(교관은 훈련소 앞)
  mk('pal', 'king', 0.5, 0, 1, 37); mk('pal', 'gw', 0.39, 0.95, 1); mk('pal', 'gb', 0.61, 0.95, 1); // 왕은 궁 안 옥좌에, 좌우에 백구 · 흑구
  const sign = (z, x, t, b) => h('span', { class: 'hd-sign', style: { left: Z[z].w * x + 'px', bottom: (b != null ? b : z === 'town' ? 1.5 : Z[z].base + Z[z].span + 21) + '%' } }, t); // 마을은 길 아래 꽃밭에, 실내는 머리 위에
  const SIGNS = { in: [[0.2, '🛂 입국 심사대'], [0.54, '⬆ 마을로 가는 길'], [0.9, '활주로로 가는 길 ➡']], air: [[0.37, '⬆ 공항 안으로 가는 길'], [0.8, '✈️ 타고 온 비행기']], pal: [[0.92, '마을로 나가는 길 ➡'], [0.5, '👑 옥좌', 62]],
    town: [[0.012, '⬅ 핫똑공항 가는 길'], [0.085, '마을 입구 · 상점가 ➡'], [0.335, '⬅ 상점가 · 훈련소 ➡'], [0.58, '⬅ 훈련소 · 진돌카이저 궁 ➡'], [0.78, '진돌카이저 궁 ➡'], [0.837, '⬆ 궁 안으로 가는 길'], [0.91, '⬅ 궁 · 바다 ➡']] };
  const plane = z => h('img', { class: 'hd-plane ' + z, src: 'img/air/plane.webp?v=4', alt: '' }); // 타고 온 비행기: 활주로에 그대로 서 있다
  const worlds = {}; for (const z in Z) { worlds[z] = h('div', { class: 'fm-world ap-world hd-world', hidden: z !== zone, style: { width: Z[z].w + 'px', height: H + 'px', backgroundImage: `url(${IMG}${Z[z].bg}.webp${V})` } }, (z === 'air' || z === 'in') && plane(z), ...SIGNS[z].map(a => sign(z, ...a)), ...npcs[z].map(n => n.el)); }
  const scroller = h('div', { class: 'fm-scroll' }, ...Object.values(worlds));
  const dpad = h('div', { class: 'dpad ap-dpad' }, [['U', '▲'], ['L', '◀'], ['D', '▼'], ['R', '▶']].map(([k, t]) => { const b = h('button', { class: 'dp ap-dp ap-' + k, 'aria-label': { L: '왼쪽', R: '오른쪽', U: '위', D: '아래' }[k] }, t); holdBtn(b, () => { keys.add(k); b.classList.add('held'); }, () => { keys.delete(k); b.classList.remove('held'); }); return b; }));
  const aLab = h('small', null, '인사'), aBtn = h('button', { class: 'ap-ab ap-a', disabled: true, 'aria-label': 'A', onClick: () => { sfx('keyA'); act && act.go(); } }, aLab);
  const bBtn = h('button', { class: 'ap-ab ap-b', 'aria-label': 'B', onClick: () => { sfx('keyB'); if (zone === 'pal') go('town', 0.837, 0.9); else if (zone === 'town' || zone === 'air') go('in', zone === 'town' ? 0.54 : 0.86, 0.6); else toast('카피랜드로 돌아가려면 심사대에서 말해요 ✈️', 1800); } }, h('small', null, '나가기'));
  const chatBtn = h('button', { class: 'ap-chat', 'aria-label': '말하기', onClick: () => { sfx('keyC'); npcs[zone].filter(n => Math.abs(n.x - me.x) < 260).slice(0, 4).forEach(n => say(n, n.info[3])); } });
  const scene = h('div', { class: 'fm-scene' }, scroller, h('div', { class: 'fm-pad ap-pad' }, dpad, h('div', { class: 'ap-acts' }, chatBtn, bBtn, aBtn)));
  const title = h('b', null, Z[zone].title);
  const wrap = h('div', { class: 'fm ap hd' }, h('div', { class: 'fm-top' }, title, demo && h('span', { class: 'ap-flight' }, '🧪 예시판'), h('button', { class: 'top-x', 'aria-label': '닫기', onClick: () => leave() }, '✕')), scene);
  document.body.append(wrap); bgm.start('hotddok'); worlds[zone].append(meEl);
  const onKey = e => { const k = { ArrowLeft: 'L', ArrowRight: 'R', ArrowUp: 'U', ArrowDown: 'D' }[e.key] || ''; if (!k || document.querySelector('.modal-wrap')) return; e.preventDefault(); if (e.type === 'keydown') keys.add(k); else keys.delete(k); };
  window.addEventListener('keydown', onKey); window.addEventListener('keyup', onKey);
  requestAnimationFrame(() => { scroller.scrollLeft = me.x - scroller.clientWidth / 2; });

  let act = null, seenTown = false, seenKing = false;
  function go(z, x, y) { sfx('pop'); worlds[zone].hidden = true; zone = z; worlds[z].hidden = false; me.x = Z[z].w * x; me.y = y == null ? 0.3 : y; worlds[z].append(meEl); title.textContent = Z[z].title; scroller.scrollLeft = Math.max(0, me.x - scroller.clientWidth / 2);
    if (z === 'town' && !seenTown) { seenTown = true; welcome(); } if (z === 'pal' && !seenKing) { seenKing = true; setTimeout(() => alive && zone === 'pal' && say(npcs.pal[0], '오오! 전설의 카피랜드 황금폐하가 아니시오!', 4), 600); } }
  function say(n, t, sec = 3) { if (!n.say) { n.say = h('span', { class: 'ap-say' }); worlds[zone].append(n.say); } n.say.textContent = t; n.say.hidden = false; n.say.classList.remove('pop'); void n.say.offsetWidth; n.say.classList.add('pop'); n.sayT = sec; }
  // 강아지를 누르면: 카피랜드 동물과 같은 구성(얼굴 · 말풍선 · 친밀도 · 빠른 말 세 가지 · 말하기 · 선물/거래/기억)
  function meet(n) { sfx('pop'); const k = n.src, A = () => rel[k] || 0, lvOf = v => LEVELS.filter(l => l[0] <= v).pop() || LEVELS[0];
    const bubble = h('p', { class: 'so-bubble' }), meter = h('div', { class: 'so-meter' }), quick = h('div', { class: 'so-quick' }), input = h('input', { class: 'so-input', maxLength: 60, placeholder: `${n.info[0]}에게 하고 싶은 말`, enterKeyHint: 'send' });
    const tell = (t, cls = '') => { bubble.className = 'so-bubble ' + cls; bubble.textContent = t; };
    const draw = () => { const v = A(), lv = lvOf(v), nx = LEVELS.find(l => l[0] > v); meter.replaceChildren(h('b', null, `${lv[2]} ${lv[1]}`), h('i', null, h('u', { style: { width: (v + 100) / 2 + '%', background: v < 0 ? '#E5484D' : v >= 50 ? '#FF7FA8' : '#57C26B' } })), h('span', null, `${v}점${nx ? ` · ${nx[1]}까지 ${nx[0] - v}` : ''}`)); };
    const talk = (t, kind) => { t = String(t || '').trim(); if (!t) return; input.value = ''; const d = kind === 'good' ? 2 : kind === 'bad' ? -3 : 1, r = pick(REPLY[kind || 'flat']); rel[k] = Math.max(-100, Math.min(100, A() + d)); (mem[k] = mem[k] || []).push({ s: t, r, d }); tell(r, d > 0 ? 'glad' : 'angry'); sfx(d > 0 ? 'coin' : 'bad'); const f = h('em', { class: 'so-float ' + (d > 0 ? 'up' : 'down') }, (d > 0 ? '+' : '') + d); meter.append(f); setTimeout(() => f.remove(), 1200); draw(); meter.append(f); drawQuick(); };
    const drawQuick = () => quick.replaceChildren(...['good', 'flat', 'bad'].map((kd, i) => { const t = pick(QUICK[kd]); return h('button', { class: 'so-q q' + i, onClick: () => talk(t, kd) }, t); }));
    const soon = t => () => toast(`${t}는 곧 열려요 🚧`, 1500);
    const memBtn = () => { const m = mem[k] || []; modal({ title: `📜 ${n.info[0]}가 기억하는 말`, body: m.length ? h('div', { class: 'so-mem' }, m.slice().reverse().map(x => h('p', null, h('b', null, `나: ${x.s}`), h('span', null, `${n.info[0]}: ${x.r}`), h('em', { class: x.d > 0 ? 'up' : 'down' }, (x.d > 0 ? '+' : '') + x.d)))) : h('p', { class: 'center' }, '아직 나눈 말이 없어요.'), actions: [{ label: '닫기', primary: true }] }); };
    modal({ title: `${n.info[0]} · ${n.info[1]}`, body: h('div', { class: 'so-meet hd-meet' }, h('div', { class: 'so-face' }, h('span', null, h('img', { src: `${IMG}${k}.webp?v=1`, alt: '' })), bubble), meter, h('p', { class: 'so-fed' }, `상징품 ${n.info[2]} · 친한 친구(50점)가 되면 받아요`), quick,
      h('div', { class: 'so-say' }, input, h('button', { class: 'btn primary', onClick: () => talk(input.value) }, '말하기')),
      h('div', { class: 'so-acts' }, h('button', { class: 'btn', onClick: soon('🔍 퀘스트') }, '🔍 퀘스트'), h('button', { class: 'btn', onClick: soon('🎁 선물') }, '🎁 선물'), h('button', { class: 'btn', onClick: soon('🤝 거래') }, '🤝 거래'), h('button', { class: 'btn', onClick: memBtn }, '📜 기억'))), actions: [{ label: '닫기' }] });
    tell(n.info[3]); draw(); drawQuick(); }
  const soon = t => () => toast(`${t} — 곧 문을 열어요 🚧`, 1600);
  function statue() { modal({ title: '🗿 진돌카이막 장군 동상', body: [h('div', { class: 'ap-cnt hd-card' }, h('img', { class: 'hd-gen', src: 'img/quest/bg-h2.webp', alt: '' }), h('p', null, h('b', null, '핫똑랜드를 세운 개국 장군')), h('p', null, '“팔짱을 끼고 바다를 지켜본 지 어언 백 년.”'), h('p', { class: 'ap-cnt-n' }, '마을 강아지들은 지나갈 때마다 꼬리를 한 번씩 흔들어요'))], actions: [{ label: '닫기' }] }); }
  function counter() { modal({ title: '🛂 입국 심사대', body: [h('div', { class: 'ap-cnt hd-card' }, h('img', { src: `${IMG}d1.webp?v=1`, alt: '' }), h('p', null, '폐하, 카피랜드로 돌아가시겠사옵니까?'), demo && h('p', { class: 'ap-cnt-n' }, '🧪 예시판: 누르면 바로 카피공항으로 돌아가요'))], actions: [{ label: '더 구경하기' }, { label: '✈️ 카피랜드로 돌아가기', primary: true, onClick: () => leave() }] }); }
  // 지금 자리에서 A 버튼으로 할 수 있는 일
  function findAct() { const x = me.x / Z[zone].w, up = me.y > 0.5;
    if (zone === 'air') return Math.abs(x - 0.37) < 0.07 && up ? { t: '입장', go: () => go('in', 0.86, 0.5) } : near();
    if (zone === 'in') return x > 0.8 ? { t: '활주로', go: () => go('air', 0.37, 0.9) } : Math.abs(x - 0.54) < 0.08 && up ? { t: '마을', go: () => go('town', 0.03, 0.5) } : x < 0.26 && up ? { t: '심사대', go: counter } : near();
    if (zone === 'pal') return x > 0.86 ? { t: '마을', go: () => go('town', 0.837, 0.9) } : Math.abs(x - 0.5) < 0.09 && up ? { t: '알현', go: () => meet(npcs.pal[0]) } : near();
    if (x < 0.012) return { t: '공항', go: () => go('in', 0.54, 0.6) };
    if (up) { const b = [[0.1, 0.16, '동상', statue], [0.156, 0.196, '상점', soon('🪃 부메랑상회')], [0.21, 0.256, '옷가게', soon('👘 비단옷집')], [0.276, 0.318, '찻집', soon('🍵 솔향찻집')], [0.35, 0.396, '떡집', soon('🍡 꿀떡방')], [0.41, 0.51, '훈련소', soon('🎯 훈련소')], [0.815, 0.86, '입궁', () => go('pal', 0.84, 0.3)]].find(r => x >= r[0] && x <= r[1]); if (b) return { t: b[2], go: b[3] }; }
    return near(); }
  function near() { let best = null, bd = 46; for (const n of npcs[zone]) { const d = Math.hypot(n.x - me.x, (n.y - me.y) * 30); if (d < bd) { bd = d; best = n; } } return best ? { t: '인사', go: () => meet(best) } : null; }
  // 입국 도장: 내리자마자 여권이 펼쳐지고 "입국" 도장이 쾅
  function stamp() { const bub = h('span', { class: 'apv-say' }, '폐하, 여권을 받들겠사옵니다…'), ok = h('button', { class: 'btn primary apv-ok', onClick: () => { el.remove(); npcs.in.forEach((n, i) => setTimeout(() => alive && zone === 'in' && say(n, n.info[3], 3.5), 300 + i * 700)); } }, '🐾 핫똑랜드 입국하기');
    const page = h('div', { class: 'apv-page' }, h('div', { class: 'apv-photo', html: capy(ctx.capyOf(ctx.uid, { face: 'smile' })) }), h('dl', null, h('dt', null, '국적'), h('dd', null, '카피랜드'), h('dt', null, '직위'), h('dd', null, '카피황금폐하'), h('dt', null, '도착지'), h('dd', null, '핫똑랜드')), h('div', { class: 'apv-stamp hd-in' }, h('b', null, '입국'), h('small', null, 'HOTDDOK LAND')));
    const el = h('div', { class: 'apv' }, h('p', { class: 'apv-t' }, '🛂 핫똑랜드 입국 심사'), h('div', { class: 'apv-book' }, page, h('img', { class: 'apv-cover', src: 'img/quest/passport.webp', alt: '' })), h('div', { class: 'apv-crew' }, h('img', { src: `${IMG}d0.webp?v=1`, alt: '' }), h('img', { src: `${IMG}d2.webp?v=1`, alt: '' }), h('img', { src: `${IMG}d1.webp?v=1`, alt: '' }), bub), ok);
    document.body.append(el); sfx('pop'); setTimeout(() => el.isConnected && sfx('boom'), 1950); setTimeout(() => { if (!el.isConnected) return; bub.textContent = '어서 오시옵소서, 황금폐하!!'; bub.classList.add('bow'); el.classList.add('done'); sfx('fanfare'); }, 2350); }
  // 마을 첫 입장: 진돌카이저와 강아지들이 환영하는 그림 → 닫으면 여기저기서 "와!!!"
  function welcome() { const el = h('div', { class: 'hd-wel', onClick: () => { el.remove(); wow(); } }, h('img', { src: `${IMG}welcome.webp?v=1`, alt: '' }), h('b', null, '🎉 핫똑랜드에 오신 것을 환영합니다!'), h('small', null, '진돌카이저 2세와 강아지들이 마중 나왔어요 · 눌러서 들어가기')); document.body.append(el); sfx('fanfare'); }
  function wow() { const list = npcs.town.slice().sort((a, b) => Math.abs(a.x - me.x) - Math.abs(b.x - me.x)); list.forEach((n, i) => { n.el.classList.add('wow'); setTimeout(() => n.el.classList.remove('wow'), 2600); if (i < WOW.length) setTimeout(() => alive && zone === 'town' && say(n, WOW[i], 2.6), i * 420); }); }

  let talkAt = 6;
  function step(t) { if (!alive) return; const dt = Math.min(0.05, (t - lastT) / 1000); lastT = t; const zz = Z[zone], modalOn = !!document.querySelector('.modal-wrap,.apv,.hd-wel');
    const dx = modalOn ? 0 : (keys.has('R') ? 1 : 0) - (keys.has('L') ? 1 : 0), dy = modalOn ? 0 : (keys.has('U') ? 1 : 0) - (keys.has('D') ? 1 : 0);
    const W = zz.w; me.x = Math.max(W * 0.005, Math.min(W * 0.99, me.x + dx * 150 * dt)); me.y = Math.max(0, Math.min(1, me.y + dy * 1.1 * dt)); meEl.classList.toggle('walk', !!(dx || dy)); if (dx) meEl.classList.toggle('left', dx < 0);
    meEl.style.left = me.x + 'px'; meEl.style.bottom = `${zz.base + me.y * zz.span}%`; meEl.style.transform = `translateX(-50%) scale(${(1 - me.y * 0.14).toFixed(3)})`; meEl.style.zIndex = String(20 - Math.round(me.y * 10));
    const want = me.x - scroller.clientWidth / 2; if (Math.abs(scroller.scrollLeft - want) > 4 && (dx || dy)) scroller.scrollLeft += (want - scroller.scrollLeft) * Math.min(1, dt * 6);
    for (const n of npcs[zone]) { if (!n.fixed) { if (n.wait > 0) { n.wait -= dt; n.el.classList.remove('go'); if (n.wait <= 0) { n.tx = Math.max(W * 0.03, Math.min(W * 0.925, n.hx + (Math.random() - 0.5) * 520)); n.ty = Math.random(); } }
        else { const ex = n.tx - n.x, ey = (n.ty - n.y) * 60, d = Math.hypot(ex, ey); if (d < 3) n.wait = 1.5 + Math.random() * 4; else { n.x += ex / d * 34 * dt; n.y += ey / d * 34 * dt / 60; n.el.classList.add('go'); } } }
      n.el.style.left = n.x + 'px'; n.el.style.bottom = `${n.b != null ? n.b : zz.base + n.y * zz.span}%`; n.el.style.zIndex = String(20 - Math.round(n.y * 10)); n.el.style.setProperty('--s', (1 - Math.min(1, n.y) * 0.14).toFixed(3));
      if (n.say && !n.say.hidden) { if ((n.sayT -= dt) <= 0) n.say.hidden = true; else { n.say.style.left = n.x + 'px'; n.say.style.bottom = `calc(${n.b != null ? n.b : zz.base + n.y * zz.span}% + ${n.el.offsetHeight + 4}px)`; n.say.style.zIndex = '40'; } } }
    if (!modalOn && (talkAt -= dt) <= 0) { talkAt = 4 + Math.random() * 4; const c = npcs[zone].filter(n => Math.abs(n.x - me.x) < 300); if (c.length) { const n = c[Math.floor(Math.random() * c.length)]; say(n, Math.random() < 0.5 ? n.info[3] : (zone === 'town' ? CHAT : WOW)[Math.floor(Math.random() * 6)]); } }
    act = modalOn ? null : findAct(); if (aBtn.disabled === !!act) { aBtn.disabled = !act; aBtn.classList.toggle('ready', !!act); } if (act && aLab.textContent !== act.t) aLab.textContent = act.t;
    raf = requestAnimationFrame(step); }
  raf = requestAnimationFrame(step);
  setTimeout(() => alive && stamp(), 700);
  function leave() { if (!alive) return; alive = false; window.removeEventListener('keydown', onKey); window.removeEventListener('keyup', onKey); cancelAnimationFrame(raf); document.querySelectorAll('.modal-wrap,.apv,.hd-wel').forEach(m => m.remove()); wrap.remove(); o.onClose && o.onClose(); }
  return { close: leave };
}
