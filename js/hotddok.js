// 핫똑랜드 — 비행기로만 가는 강아지 섬. 한옥 공항 → 공항 안(입국 심사대) → 기와 마을(진돌카이막 장군 동상 · 상점 · 옷가게 · 훈련소 · 진돌카이저 궁 · 어두운 바다)
// 지금은 예시판: 걷기 · 강아지 30종과 왕실 3마리 · 첫 반응 · 환영 그림까지. 친밀도 · 상점 · 퀘스트는 다음 차례
import { h, toast, modal, holdBtn } from './ui.js';
import { capy } from './capy.js';
import { sfx, bgm } from './sound.js';

const BG_W = 1344, BG_H = 576, IMG = 'img/hd/';
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

export function openHotddok(o) {
  const { ctx } = o, demo = !!o.demo; let alive = true, raf = 0, zone = 'air', lastT = performance.now();
  const H = Math.max(280, Math.min(Math.round(innerHeight * 0.52), 520)), W = Math.round(H * BG_W / BG_H), DH = 84;
  const Z = { air: { bg: 'air', base: 3, span: 26, title: '🐶 핫똑공항' }, in: { bg: 'inn', base: 3, span: 22, title: '🐶 핫똑공항 · 입국장' }, town: { bg: 'town', base: 11, span: 12, title: '🏯 핫똑랜드 마을' } };
  const me = { x: W * 0.78, y: 0.3 }, meEl = h('div', { class: 'fm-me ap-me', html: capy(ctx.capyOf(ctx.uid, { face: 'happy' })) });
  const npcs = { air: [], in: [], town: [] }, keys = new Set();
  const mk = (z, key, x, y, fixed) => { const royal = typeof key === 'string', src = royal ? key : 'd' + key, info = royal ? ROYAL[key] : DOGS[key];
    const el = h('img', { class: 'hd-dog' + (royal ? ' royal' : ''), src: `${IMG}${src}.webp?v=1`, alt: info[0], style: { height: (key === 'king' ? DH * 1.16 : royal ? DH * 1.1 : DH) + 'px' }, onClick: () => card(n) });
    const n = { key, info, el, src, x: W * x, y, hx: W * x, tx: W * x, ty: y, wait: Math.random() * 3, fixed, say: null, sayT: 0 }; npcs[z].push(n); return n; };
  // 공항 앞: 말티즈 승무원 둘과 푸들 기장이 맞이한다
  mk('air', 0, 0.3, 0.95, 1); mk('air', 1, 0.44, 0.95, 1); mk('air', 2, 0.52, 0.8, 1);
  mk('in', 1, 0.13, 1, 1); // 심사대의 승무원
  // 마을: 궁 앞에 왕과 좌우 호위, 나머지는 길을 오간다
  mk('town', 'gw', 0.805, 1.25, 1); mk('town', 'king', 0.86, 1.3, 1); mk('town', 'gb', 0.915, 1.25, 1); mk('town', 27, 0.63, 1.05, 1);
  { const rest = DOGS.map((_, i) => i).filter(i => i !== 27) /* 승무원·기장도 마을을 돌아다닌다 */; rest.forEach((i, k) => mk('town', i, 0.1 + 0.66 * (k + 0.5) / rest.length + (k % 2 ? 0.012 : -0.012), (k * 0.37) % 1)); }
  const worlds = {}; for (const z in Z) { worlds[z] = h('div', { class: 'fm-world ap-world hd-world', hidden: z !== zone, style: { width: W + 'px', height: H + 'px', backgroundImage: `url(${IMG}${Z[z].bg}.webp?v=1)` } }, ...npcs[z].map(n => n.el)); }
  const scroller = h('div', { class: 'fm-scroll' }, worlds.air, worlds.in, worlds.town);
  const dpad = h('div', { class: 'dpad ap-dpad' }, [['U', '▲'], ['L', '◀'], ['D', '▼'], ['R', '▶']].map(([k, t]) => { const b = h('button', { class: 'dp ap-dp ap-' + k, 'aria-label': { L: '왼쪽', R: '오른쪽', U: '위', D: '아래' }[k] }, t); holdBtn(b, () => { keys.add(k); b.classList.add('held'); }, () => { keys.delete(k); b.classList.remove('held'); }); return b; }));
  const aLab = h('small', null, '인사'), aBtn = h('button', { class: 'ap-ab ap-a', disabled: true, 'aria-label': 'A', onClick: () => { sfx('keyA'); act && act.go(); } }, aLab);
  const bBtn = h('button', { class: 'ap-ab ap-b', 'aria-label': 'B', onClick: () => { sfx('keyB'); if (zone === 'in') go('air', 0.37, 0.9); else if (zone === 'town') go('air', 0.1, 0.4); else toast('카피랜드로 돌아가려면 공항 안 심사대로 가요 ✈️', 1800); } }, h('small', null, '나가기'));
  const chatBtn = h('button', { class: 'ap-chat', 'aria-label': '말하기', onClick: () => { sfx('keyC'); npcs[zone].filter(n => Math.abs(n.x - me.x) < W * 0.2).slice(0, 4).forEach(n => say(n, n.info[3])); } });
  const scene = h('div', { class: 'fm-scene' }, scroller, h('div', { class: 'fm-pad ap-pad' }, dpad, h('div', { class: 'ap-acts' }, chatBtn, bBtn, aBtn)));
  const title = h('b', null, Z.air.title);
  const wrap = h('div', { class: 'fm ap hd' }, h('div', { class: 'fm-top' }, title, demo && h('span', { class: 'ap-flight' }, '🧪 예시판'), h('button', { class: 'top-x', 'aria-label': '닫기', onClick: () => leave() }, '✕')), scene);
  document.body.append(wrap); bgm.start('hotddok'); worlds[zone].append(meEl);
  const onKey = e => { const k = { ArrowLeft: 'L', ArrowRight: 'R', ArrowUp: 'U', ArrowDown: 'D' }[e.key] || ''; if (!k || document.querySelector('.modal-wrap')) return; e.preventDefault(); if (e.type === 'keydown') keys.add(k); else keys.delete(k); };
  window.addEventListener('keydown', onKey); window.addEventListener('keyup', onKey);
  requestAnimationFrame(() => { scroller.scrollLeft = me.x - scroller.clientWidth / 2; });

  let act = null, seenTown = false;
  function go(z, x, y) { sfx('pop'); worlds[zone].hidden = true; zone = z; worlds[z].hidden = false; me.x = W * x; me.y = y == null ? 0.3 : y; worlds[z].append(meEl); title.textContent = Z[z].title; scroller.scrollLeft = Math.max(0, me.x - scroller.clientWidth / 2);
    if (z === 'town' && !seenTown) { seenTown = true; welcome(); } }
  function say(n, t, sec = 3) { if (!n.say) { n.say = h('span', { class: 'ap-say' }); worlds[zone].append(n.say); } n.say.textContent = t; n.say.hidden = false; n.say.classList.remove('pop'); void n.say.offsetWidth; n.say.classList.add('pop'); n.sayT = sec; }
  function card(n) { sfx('pop'); say(n, n.info[3]); modal({ title: `🐶 ${n.info[0]}`, body: [h('div', { class: 'ap-cnt hd-card' }, h('img', { src: `${IMG}${n.src}.webp?v=1`, alt: '' }), h('p', null, h('b', null, n.info[1])), h('p', null, `“${n.info[3]}”`), h('p', { class: 'ap-cnt-s' }, `상징품: ${n.info[2]}`), h('p', { class: 'ap-cnt-n' }, '친밀도 · 선물 · 거래는 곧 열려요'))], actions: [{ label: '닫기' }] }); }
  const soon = t => () => toast(`${t} — 곧 문을 열어요 🚧`, 1600);
  function statue() { modal({ title: '🗿 진돌카이막 장군 동상', body: [h('div', { class: 'ap-cnt hd-card' }, h('img', { class: 'hd-gen', src: 'img/quest/bg-h2.webp', alt: '' }), h('p', null, h('b', null, '핫똑랜드를 세운 개국 장군')), h('p', null, '“팔짱을 끼고 바다를 지켜본 지 어언 백 년.”'), h('p', { class: 'ap-cnt-n' }, '마을 강아지들은 지나갈 때마다 꼬리를 한 번씩 흔들어요'))], actions: [{ label: '닫기' }] }); }
  function counter() { modal({ title: '🛂 입국 심사대', body: [h('div', { class: 'ap-cnt hd-card' }, h('img', { src: `${IMG}d1.webp?v=1`, alt: '' }), h('p', null, '폐하, 카피랜드로 돌아가시겠사옵니까?'), demo && h('p', { class: 'ap-cnt-n' }, '🧪 예시판: 누르면 바로 카피공항으로 돌아가요'))], actions: [{ label: '더 구경하기' }, { label: '✈️ 카피랜드로 돌아가기', primary: true, onClick: () => leave() }] }); }
  // 지금 자리에서 A 버튼으로 할 수 있는 일
  function findAct() { const x = me.x / W;
    if (zone === 'air') return Math.abs(x - 0.37) < 0.07 && me.y > 0.5 ? { t: '입장', go: () => go('in', 0.86, 0.3) } : x < 0.07 ? { t: '마을', go: () => go('town', 0.06, 0.4) } : near();
    if (zone === 'in') return x > 0.8 ? { t: '밖으로', go: () => go('air', 0.37, 0.9) } : x < 0.24 ? { t: '심사대', go: counter } : near();
    if (x < 0.035) return { t: '공항', go: () => go('air', 0.1, 0.4) };
    const d = near(); if (d) return d;
    return x < 0.21 ? { t: '동상', go: statue } : x < 0.37 ? { t: '상점', go: soon('🪃 특산품 상점(부메랑)') } : x < 0.56 ? { t: '옷가게', go: soon('👘 한복 옷가게') } : x < 0.72 ? { t: '훈련소', go: soon('🎯 훈련소') } : x < 0.95 ? { t: '알현', go: () => card(npcs.town[1]) } : null; }
  function near() { let best = null, bd = 46; for (const n of npcs[zone]) { const d = Math.hypot(n.x - me.x, (n.y - me.y) * 30); if (d < bd) { bd = d; best = n; } } return best ? { t: '인사', go: () => card(best) } : null; }
  // 입국 도장: 내리자마자 여권이 펼쳐지고 "입국" 도장이 쾅
  function stamp() { const bub = h('span', { class: 'apv-say' }, '폐하, 여권을 받들겠사옵니다…'), ok = h('button', { class: 'btn primary apv-ok', onClick: () => { el.remove(); npcs.air.forEach((n, i) => setTimeout(() => alive && say(n, n.info[3], 3.5), 300 + i * 700)); } }, '🐾 핫똑랜드 입국하기');
    const page = h('div', { class: 'apv-page' }, h('div', { class: 'apv-photo', html: capy(ctx.capyOf(ctx.uid, { face: 'smile' })) }), h('dl', null, h('dt', null, '국적'), h('dd', null, '카피랜드'), h('dt', null, '직위'), h('dd', null, '카피황금폐하'), h('dt', null, '도착지'), h('dd', null, '핫똑랜드')), h('div', { class: 'apv-stamp hd-in' }, h('b', null, '입국'), h('small', null, 'HOTDDOK LAND')));
    const el = h('div', { class: 'apv' }, h('p', { class: 'apv-t' }, '🛂 핫똑랜드 입국 심사'), h('div', { class: 'apv-book' }, page, h('img', { class: 'apv-cover', src: 'img/quest/passport.webp', alt: '' })), h('div', { class: 'apv-crew' }, h('img', { src: `${IMG}d0.webp?v=1`, alt: '' }), h('img', { src: `${IMG}d2.webp?v=1`, alt: '' }), h('img', { src: `${IMG}d1.webp?v=1`, alt: '' }), bub), ok);
    document.body.append(el); sfx('pop'); setTimeout(() => el.isConnected && sfx('boom'), 1950); setTimeout(() => { if (!el.isConnected) return; bub.textContent = '어서 오시옵소서, 황금폐하!!'; bub.classList.add('bow'); el.classList.add('done'); sfx('fanfare'); }, 2350); }
  // 마을 첫 입장: 진돌카이저와 강아지들이 환영하는 그림 → 닫으면 여기저기서 "와!!!"
  function welcome() { const el = h('div', { class: 'hd-wel', onClick: () => { el.remove(); wow(); } }, h('img', { src: `${IMG}welcome.webp?v=1`, alt: '' }), h('b', null, '🎉 핫똑랜드에 오신 것을 환영합니다!'), h('small', null, '진돌카이저 2세와 강아지들이 마중 나왔어요 · 눌러서 들어가기')); document.body.append(el); sfx('fanfare'); }
  function wow() { const list = npcs.town.filter(n => typeof n.key !== 'string').sort((a, b) => Math.abs(a.x - me.x) - Math.abs(b.x - me.x)); list.forEach((n, i) => { n.el.classList.add('wow'); setTimeout(() => n.el.classList.remove('wow'), 2600); if (i < WOW.length) setTimeout(() => alive && zone === 'town' && say(n, WOW[i], 2.6), i * 420); }); }

  let talkAt = 6;
  function step(t) { if (!alive) return; const dt = Math.min(0.05, (t - lastT) / 1000); lastT = t; const zz = Z[zone], modalOn = !!document.querySelector('.modal-wrap,.apv,.hd-wel');
    const dx = modalOn ? 0 : (keys.has('R') ? 1 : 0) - (keys.has('L') ? 1 : 0), dy = modalOn ? 0 : (keys.has('U') ? 1 : 0) - (keys.has('D') ? 1 : 0);
    me.x = Math.max(W * 0.02, Math.min(W * 0.98, me.x + dx * 150 * dt)); me.y = Math.max(0, Math.min(1, me.y + dy * 1.1 * dt)); meEl.classList.toggle('walk', !!(dx || dy)); if (dx) meEl.classList.toggle('left', dx < 0);
    meEl.style.left = me.x + 'px'; meEl.style.bottom = `${zz.base + me.y * zz.span}%`; meEl.style.transform = `translateX(-50%) scale(${(1 - me.y * 0.14).toFixed(3)})`; meEl.style.zIndex = String(20 - Math.round(me.y * 10));
    const want = me.x - scroller.clientWidth / 2; if (Math.abs(scroller.scrollLeft - want) > 4 && (dx || dy)) scroller.scrollLeft += (want - scroller.scrollLeft) * Math.min(1, dt * 6);
    for (const n of npcs[zone]) { if (!n.fixed) { if (n.wait > 0) { n.wait -= dt; n.el.classList.remove('go'); if (n.wait <= 0) { n.tx = Math.max(W * 0.05, Math.min(W * 0.95, n.hx + (Math.random() - 0.5) * W * 0.16)); n.ty = Math.random(); } }
        else { const ex = n.tx - n.x, ey = (n.ty - n.y) * 60, d = Math.hypot(ex, ey); if (d < 3) n.wait = 1.5 + Math.random() * 4; else { n.x += ex / d * 34 * dt; n.y += ey / d * 34 * dt / 60; n.el.classList.add('go'); } } }
      n.el.style.left = n.x + 'px'; n.el.style.bottom = `${zz.base + n.y * zz.span}%`; n.el.style.zIndex = String(20 - Math.round(n.y * 10)); n.el.style.setProperty('--s', (1 - Math.min(1, n.y) * 0.14).toFixed(3));
      if (n.say && !n.say.hidden) { if ((n.sayT -= dt) <= 0) n.say.hidden = true; else { n.say.style.left = n.x + 'px'; n.say.style.bottom = `calc(${zz.base + n.y * zz.span}% + ${n.el.offsetHeight + 4}px)`; n.say.style.zIndex = '40'; } } }
    if (!modalOn && (talkAt -= dt) <= 0) { talkAt = 4 + Math.random() * 4; const c = npcs[zone].filter(n => Math.abs(n.x - me.x) < W * 0.3); if (c.length) { const n = c[Math.floor(Math.random() * c.length)]; say(n, Math.random() < 0.5 ? n.info[3] : (zone === 'town' ? CHAT : WOW)[Math.floor(Math.random() * 6)]); } }
    act = modalOn ? null : findAct(); if (aBtn.disabled === !!act) { aBtn.disabled = !act; aBtn.classList.toggle('ready', !!act); } if (act && aLab.textContent !== act.t) aLab.textContent = act.t;
    raf = requestAnimationFrame(step); }
  raf = requestAnimationFrame(step);
  setTimeout(() => alive && stamp(), 700);
  function leave() { if (!alive) return; alive = false; window.removeEventListener('keydown', onKey); window.removeEventListener('keyup', onKey); cancelAnimationFrame(raf); document.querySelectorAll('.modal-wrap,.apv,.hd-wel').forEach(m => m.remove()); wrap.remove(); o.onClose && o.onClose(); }
  return { close: leave };
}
