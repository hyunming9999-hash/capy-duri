// 카피공항: 놀이터 왼쪽 '카피공항으로' 팻말로 가는 따로 된 공간(농장처럼).
// 바깥: 바닷가 도로 · 통유리 터미널 · 그 뒤 활주로(비행기가 10초마다 내리고 뜬다). 터미널에 들어가면 안쪽: 카운터 · 출국 대기장 · 큰 창 너머 활주로.
// 비행기: 10분마다 한 번 내려앉아 잠시 머물다 다시 떠난다(두 사람 화면이 같은 시계로 맞춰 움직인다)
import { h, toast, modal, holdBtn } from './ui.js';
import { capy } from './capy.js';
import { sfx, bgm } from './sound.js';

const BG_W = 1344, BG_H = 576, WALK_SP = 150;
export const FLIGHT = { every: 600000, land: 10000, stay: 10000, off: 8000 }; // 10분마다: 10초 동안 왼쪽으로 들어와 출입구 앞에 서고 → 10초 안에 타야 한다 → 8초 동안 오른쪽으로 달려 나가 떠난다
export const FLIGHT_DEMO = { every: 30000, land: 10000, stay: 3000, off: 8000 }; // 예시판: 30초마다 · 10초 안에 도착 → 3초 뒤 출발
export function flightNow(t, F = FLIGHT) { const k = ((t % F.every) + F.every) % F.every, a = F.land, b = a + F.stay, c = b + F.off;
  if (k < a) return { phase: 'land', p: k / a, left: 0 }; if (k < b) return { phase: 'stay', p: (k - a) / F.stay, left: b - k }; if (k < c) return { phase: 'off', p: (k - b) / F.off, left: 0 };
  return { phase: 'none', p: 0, left: F.every - k }; }
export const TICKET = { one: 7000, round: 12000 }, DEST = '핫똑랜드';
const hhmm = t => { const d = new Date(t); return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`; };
const mmss = ms => { const s = Math.max(0, Math.ceil(ms / 1000)); return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`; };
const ease = x => x * x * (3 - 2 * x);
// 비행기 위치(창·활주로 한 칸 기준 0~1, y는 위로 갈수록 -): 들어올 때는 오른쪽 하늘에서 내려와 왼쪽(<)으로 굴러 가운데 멈추고,
// 떠날 때는 오른쪽을 보고 달려 나가 떠오르며 화면 밖으로 사라진다
function planePos(f, at = 0.5) { if (f.phase === 'land') { const p = f.p, td = Math.min(0.85, at + 0.45); if (p < 0.45) { const e = ease(p / 0.45); return { x: 1.3 - (1.3 - td) * e, y: -0.9 * (1 - e), r: -6 * (1 - e), flip: 0, on: 1 }; }
    const e = 1 - Math.pow(1 - (p - 0.45) / 0.55, 2); return { x: td - (td - at) * e, y: 0, r: 0, flip: 0, on: 1 }; }
  if (f.phase === 'stay') return { x: at, y: 0, r: 0, flip: 0, on: 1 };
  if (f.phase === 'off') { const p = f.p, e = p * p; return { x: at + (1.4 - at) * e, y: -Math.max(0, p - 0.5) * 1.6, r: -Math.min(10, Math.max(0, p - 0.45) * 30), flip: 1, on: 1 }; }
  return { on: 0 }; }

const LV = (() => { try { const v = +new URLSearchParams(location.search).get('lift'); return v >= 1 ? 1 : 0; } catch { return 0; } })(); // 예시 링크 ?lift=1: 열자마자 이륙 장면부터 보기
export function openAirport(o) {
  const { ctx } = o; let alive = true, raf = 0, inside = false;
  const now = () => (ctx.store && ctx.store.now ? ctx.store.now() : Date.now());
  const F = o.demo ? FLIGHT_DEMO : FLIGHT;
  const demo = !!o.demo, TK = 'air/' + ctx.uid; let tk = { one: 0, round: 0, ret: 0 }, pp = demo, freeFly = 0; if (!demo && ctx.store.get) ctx.store.get('bag/' + ctx.uid).then(v => { pp = !!(v && v.passport); freeFly = (v && v.flight) || 0; }).catch(() => {});
  if (!demo && ctx.me && ctx.me.name === '두두' && ctx.store.tx) { let got = false; ctx.store.tx(TK, v => { if (v && v.gift1) return undefined; got = true; return { ...(v || {}), round: ((v && v.round) || 0) + 1, gift1: 1 }; }).then(() => { if (got) { sfx('fanfare'); toast('🎁 무료 왕복 탑승권 1장이 도착했어요!', 3200); } }).catch(() => {}); } // 두두에게 왕복권 한 장(한 번만) // 가진 핫똑랜드 탑승권(편도·왕복). 예시판은 저장하지 않는다
  const offTk = !demo && ctx.store.on ? ctx.store.on(TK, v => { tk = { one: (v && v.one) || 0, round: (v && v.round) || 0, ret: (v && v.ret) || 0 }; }) : null;
  const H = Math.max(280, Math.min(Math.round(innerHeight * 0.52), 520)), W = Math.round(H * BG_W / BG_H);
  const me = { x: W * 0.62, tx: W * 0.62, y: 0 }; // y: 실내에서 안쪽(위)으로 들어간 정도 0~1
  const sc = o.scoot ? o.scoot() : null, meEl = h('div', { class: 'fm-me ap-me' + (sc ? ' scoot' : ''), html: sc || capy(ctx.capyOf(ctx.uid, { face: 'happy' })) });
  // 바깥
  const TX = W * 0.14, TWD = W * 0.3, doorX = TX + TWD * 0.42;
  const outPlane = h('img', { class: 'ap-plane out', src: 'img/air/plane.webp?v=4', alt: '' });
  const parked = [0.035, 0.105].map(x => h('img', { class: 'ap-parked', src: 'img/air/plane.webp?v=4', alt: '', style: { left: W * x + 'px' } })); // 터미널 왼쪽 계류장: 두 대가 나란히
  const term = h('button', { class: 'ap-term', 'aria-label': '카피공항 들어가기', style: { left: TX + 'px', width: TWD + 'px' }, onClick: () => walkTo(doorX, goIn) }, h('img', { src: 'img/air/terminal.webp', alt: '' }), h('b', { class: 'ap-term-t' }, '카피공항'));
  const front = h('img', { class: 'ap-front', src: 'img/air/front.webp?v=4', alt: '' }); // 활주로 앞 야자수·난간: 비행기보다 앞에 보이게
  const exitSign = h('button', { class: 'fm-exit', style: { left: W - Math.round(W * 0.13) + 'px' }, onClick: () => close() }, '놀이터로 →');
  const outWorld = h('div', { class: 'fm-world ap-world', style: { width: W + 'px', height: H + 'px', backgroundImage: 'url(img/air/out.webp?v=4)' } }, h('div', { class: 'ap-runway' }, outPlane), h('img', { class: 'ap-boat', src: 'img/air/boat.webp?v=2', alt: '' }), ...parked, front, term, exitSign);
  // 안쪽
  const counter = h('button', { class: 'ap-counter', 'aria-label': '공항 카운터', onClick: () => walkTo(W * 0.13, atCounter) });
  const inAtt = h('img', { class: 'ap-crew in tap', src: 'img/air/att.webp', alt: '카피승무원', style: { left: W * 0.115 + 'px' }, onClick: () => walkTo(W * 0.13, atCounter) }), inPilot = h('img', { class: 'ap-crew in plt', src: 'img/air/pilot.webp', alt: '카피기장', style: { left: W * 0.392 + 'px' } }); // 기장: 카운터 옆 출입구(탑승구) 바로 곁
  const inPlane = h('img', { class: 'ap-plane in', src: 'img/air/plane.webp?v=4', alt: '' });
  const boardEl = h('div', { class: 'ap-board' }), boardRows = h('div', { class: 'ap-brows' }); boardEl.append(h('span', null, `🛫 출발 안내 · ${DEST}행`), boardRows);
  const walker = h('img', { class: 'ap-crew in wk', src: 'img/air/att-walk.webp', alt: '카피승무원' }), wk = { x: W * 0.8, y: 0.3, tx: W * 0.5, ty: 0.5, d: -1, wait: 0 }; // 캐리어를 끌고 대기장을 오가는 승무원
  const cntT = h('b', { class: 'ap-cnt-t', style: { fontSize: Math.round(H * 0.052) + 'px' } }, '카운터');
  const outBtn = h('button', { class: 'fm-exit ap-out', style: { left: W * 0.338 + 'px' }, onClick: () => goOut() }, '← 밖으로');
  const inWorld = h('div', { class: 'fm-world ap-world in', hidden: true, style: { width: W + 'px', height: H + 'px', backgroundImage: 'url(img/air/in.webp)' } }, h('div', { class: 'ap-window' }, inPlane, h('img', { class: 'ap-mull', src: 'img/air/mullion.webp', alt: '' })), boardEl, counter, inAtt, h('img', { class: 'ap-desk', src: 'img/air/desk.webp?v=3', alt: '' }), inPilot, walker, cntT);
  const scroller = h('div', { class: 'fm-scroll' }, outWorld, inWorld);
  const keys = new Set(), padBtn = (k, t) => { const b = h('button', { class: 'dp fm-dp' + (k === 'U' || k === 'D' ? ' ap-v' : ''), 'aria-label': { L: '왼쪽', R: '오른쪽', U: '위', D: '아래' }[k] }, t); holdBtn(b, () => keys.add(k), () => keys.delete(k)); return b; };
  const enterBtn = h('button', { class: 'fm-enter', hidden: true, onClick: () => (!inside ? goIn() : atGate() ? board() : atCounter()) });
  const ud = h('button', { class: 'ap-exit', hidden: true, onClick: () => { sfx('keyB'); goOut(); } }, '🚪 나가기'); // (예전 위아래 버튼 자리)
  const dpad = h('div', { class: 'dpad ap-dpad' }, [['U', '▲'], ['L', '◀'], ['D', '▼'], ['R', '▶']].map(([k, t]) => { const b = h('button', { class: 'dp ap-dp ap-' + k, 'aria-label': { L: '왼쪽', R: '오른쪽', U: '위', D: '아래' }[k] }, t); holdBtn(b, () => { keys.add(k); b.classList.add('held'); }, () => { keys.delete(k); b.classList.remove('held'); }); return b; })); // 동물친목회와 같은 십자 방향키
  // 오른쪽 버튼: 놀이터와 같은 말하기·A·B. A = 지금 할 수 있는 일(입장·구매·탑승), B = 나가기
  const aLab = h('small', null, '입장'), aBtn = h('button', { class: 'ap-ab ap-a', disabled: true, 'aria-label': 'A', onClick: () => { sfx('keyA'); enterBtn.click(); } }, aLab);
  const bBtn = h('button', { class: 'ap-ab ap-b', 'aria-label': 'B', onClick: () => { sfx('keyB'); inside ? goOut() : close(); } }, h('small', null, '나가기'));
  const chatBtn = h('button', { class: 'ap-chat', 'aria-label': '말하기', onClick: () => { sfx('keyC'); if (inside) { const f = flightNow(now(), F); say('cnt', f); say('pl', f); say('wk', f); } else toast('바닷바람이 시원해요 🌊', 1200); } });
  const scene = h('div', { class: 'fm-scene' }, scroller, ud, h('div', { class: 'fm-pad ap-pad' }, dpad, h('div', { class: 'ap-acts' }, chatBtn, bBtn, aBtn)));
  const title = h('b', null, '✈️ 카피공항'), flightEl = h('span', { class: 'ap-flight' });
  const wrap = h('div', { class: 'fm ap' }, h('div', { class: 'fm-top' }, title, flightEl, h('button', { class: 'top-x', 'aria-label': '닫기', onClick: () => close() }, '✕')), scene);
  document.body.append(wrap); if (o.resume && !demo) wrap.style.visibility = 'hidden'; /* 핫똑랜드로 바로 돌아갈 땐 공항을 보이지 않는다 */ bgm.start('airport'); if (o.resume && !demo) import('./hotddok.js').then(m => m.openHotddok({ ctx, demo, onMenu: () => { close(); location.hash = 'home'; }, resume: true, onClose: () => { wrap.style.visibility = ''; bgm.start('airport'); goIn(); owlNote(); } })).catch(() => { wrap.style.visibility = ''; }); /* 핫똑랜드에 있다가 새로 연 경우 */ if (demo && /[?&]town(&|=|$)/.test(location.search)) import('./hotddok.js').then(m => m.openHotddok({ ctx, demo, onMenu: () => { close(); location.hash = 'home'; }, start: 'town', onClose: () => { bgm.start('airport'); goIn(); } })).catch(() => {}); /* 예시 링크 ?airdemo&town: 비행 · 환영식 없이 바로 마을 */ else if (demo && LV) setTimeout(() => alive && ride(), 900); // ?lift=1: 열자마자 바로 이륙
  const onKey = e => { const k = { ArrowLeft: 'L', ArrowRight: 'R', ArrowUp: 'U', ArrowDown: 'D' }[e.key] || ''; if (!k || document.querySelector('.modal-wrap')) return; e.preventDefault(); if (e.type === 'keydown') keys.add(k); else keys.delete(k); };
  window.addEventListener('keydown', onKey); window.addEventListener('keyup', onKey);
  const world = () => (inside ? inWorld : outWorld);
  function place() { world().append(meEl); }
  place(); requestAnimationFrame(() => { scroller.scrollLeft = me.x - scroller.clientWidth / 2; });

  function walkTo(x, then) { me.tx = x; me.then = then; meEl.classList.add('walk'); meEl.classList.toggle('left', x < me.x); }
  function goIn() { if (inside) return; inside = true; sfx('pop'); outWorld.hidden = true; inWorld.hidden = false; me.x = me.tx = W * 0.3; me.y = 0; me.then = null; place(); ud.hidden = false; fitCrew(); title.textContent = '✈️ 카피공항 · 출국장'; scroller.scrollLeft = 0; }
  function goOut() { if (!inside) return; inside = false; sfx('pop'); inWorld.hidden = true; outWorld.hidden = false; me.x = me.tx = doorX; me.y = 0; me.then = null; place(); ud.hidden = true; title.textContent = '✈️ 카피공항'; scroller.scrollLeft = Math.max(0, me.x - scroller.clientWidth / 2); }
  const canBoard = f => f.phase === 'stay'; // 비행기가 출입구 앞에 다 서고 나서 10초 안에만 탈 수 있다
  const atGate = () => inside && me.x > W * 0.27 && me.x < W * 0.56; // 카운터 옆 출입구 앞
  function fitCrew() { const hh = 84; inPilot.style.height = hh + 'px'; walker.style.height = Math.round(hh * 1.22) + 'px'; inAtt.style.height = hh + 'px'; inAtt.style.bottom = Math.round(0.417 * H - 0.5 * hh) + 'px'; } // 카피바라(밍땅꾸리·두두)와 같은 키 + 모자. 카운터 승무원은 허리까지 책상 뒤에 · 기장은 조금 안쪽(작게)
  // 여권 확인: 탑승권을 사기 전에 카운터에서 먼저 받는다 — 여권이 펼쳐지고 출국 도장이 쾅, 직원들이 "폐하 망극하옵니다"
  let passOK = false; const atCounter = () => (passOK ? openTicket() : passCheck());
  // 핫똑랜드에서 돌아왔다: 다녀온 표시를 남기고, 아직 궁전 시안을 안 골랐으면 부엉이가 찾는다고 알린다
  async function owlNote() { if (demo) return; try { await ctx.store.update(TK, { home: 1 }); const p = await ctx.store.get('palace/' + ctx.uid); if (!(p && p.pick)) setTimeout(() => alive && toast('🦉 부엉이가 폐하를 찾고 있어요! 놀이터로 돌아가 보세요', 4200), 1200); } catch { /* 알림은 없어도 된다 */ } }
  function passCheck() { if (document.querySelector('.apv')) return; if (!pp) return modal({ title: '🛂 여권이 없어요', body: [h('div', { class: 'ap-cnt' }, h('img', { src: 'img/air/att.webp', alt: '' }), h('p', null, '폐하, 송구하오나 여권이 있어야 출국하실 수 있사옵니다.'), h('p', { class: 'ap-cnt-n' }, '동물친목회의 「카피랜드 여권 발급」 이야기를 먼저 마쳐 주세요'))], actions: [{ label: '확인', primary: true }] });
    const bub = h('span', { class: 'apv-say' }, '폐하, 여권을 살펴보겠사옵니다…'), ok = h('button', { class: 'btn primary apv-ok', onClick: () => { el.remove(); openTicket(); } }, '🎫 탑승권 사러 가기');
    const page = h('div', { class: 'apv-page' }, h('div', { class: 'apv-photo', html: capy(ctx.capyOf(ctx.uid, { face: 'smile' })) }),
      h('dl', null, h('dt', null, '국적'), h('dd', null, '카피랜드'), h('dt', null, '직위'), h('dd', null, '카피황금폐하'), h('dt', null, '행선지'), h('dd', null, DEST)),
      h('div', { class: 'apv-stamp' }, h('b', null, '출국'), h('small', null, 'CAPY AIRPORT')));
    const el = h('div', { class: 'apv' }, h('p', { class: 'apv-t' }, '🛂 여권 확인'), h('div', { class: 'apv-book' }, page, h('img', { class: 'apv-cover', src: 'img/quest/passport.webp', alt: '' })),
      h('div', { class: 'apv-crew' }, h('img', { src: 'img/air/att.webp', alt: '' }), h('img', { src: 'img/air/pilot.webp', alt: '' }), h('img', { src: 'img/air/att-walk.webp', alt: '' }), bub), ok);
    document.body.append(el); sfx('pop'); setTimeout(() => el.isConnected && sfx('keyB'), 800);
    setTimeout(() => { if (!el.isConnected) return; sfx('boom'); passOK = true; }, 1950);
    setTimeout(() => { if (!el.isConnected) return; bub.textContent = '폐하, 망극하옵니다!!'; bub.classList.add('bow'); el.classList.add('done'); sfx('fanfare'); for (const k in says) sayText(k, '폐하, 망극하옵니다!'); }, 2350); }
  function openTicket() { const f = flightNow(now(), F), dep = depAt(now());
    const row = (k, name, desc) => h('button', { class: 'ap-tk', onClick: () => confirmBuy(k, name) }, h('b', null, `🎫 ${DEST} ${name}`), h('small', null, desc), h('em', null, `${TICKET[k].toLocaleString()}코인`));
    modal({ title: `🎫 ${DEST} 탑승권`, body: [h('div', { class: 'ap-cnt' }, h('img', { src: 'img/air/att.webp', alt: '' }),
      h('p', null, `어서 오세요, 카피공항입니다! ✈️`, h('br'), `${DEST}행 카피 오픈카 비행기는 10분마다 한 대씩 떠나요.`),
      h('p', { class: 'ap-cnt-s' }, canBoard(f) ? `지금 탑승할 수 있어요 · ${mmss(f.left)} 뒤 마감` : `다음 비행기 ${hhmm(dep)} 출발 · 출입구 앞에 선 뒤 10초 안에 타야 해요`),
      demo && h('p', { class: 'ap-cnt-n' }, '🧪 예시판이라 코인은 빠지지 않아요'),
      freeFly > 0 && h('button', { class: 'ap-tk', onClick: async () => { document.querySelectorAll('.modal-wrap').forEach(m => m.remove()); freeFly = 0; await ctx.store.update('bag/' + ctx.uid, { flight: null }).catch(() => {}); await ctx.store.update(TK, { round: (tk.round || 0) + 1 }).catch(() => {}); sfx('fanfare'); toast('🎫 첫 비행 무료 항공권을 왕복 탑승권으로 바꿨어요!', 2400); } }, h('b', null, '🎁 첫 비행 무료 항공권 쓰기'), h('small', null, '여권과 함께 받은 항공권 · 왕복 한 번'), h('em', null, '무료')),
      row('one', '편도', '가는 비행기 한 번'), row('round', '왕복', '갔다가 돌아오는 비행기 · 더 싸요'),
      h('p', { class: 'ap-cnt-n' }, `가진 탑승권: 편도 ${tk.one}장 · 왕복 ${tk.round}장`))], actions: [{ label: '닫기' }] }); }
  function confirmBuy(k, name) { document.querySelectorAll('.modal-wrap').forEach(m => m.remove());
    modal({ title: '🎫 구매 확인', body: [h('div', { class: 'ap-cnt' }, h('p', null, h('b', null, `${DEST} ${name} 탑승권`), h('br'), `${TICKET[k].toLocaleString()}코인에 살까요?`), demo && h('p', { class: 'ap-cnt-n' }, '🧪 예시판이라 코인은 빠지지 않아요'))], actions: [{ label: '취소' }, { label: '구매', primary: true, onClick: () => buy(k, name) }] }); }
  async function buy(k, name) { const cost = TICKET[k]; document.querySelectorAll('.modal-wrap').forEach(m => m.remove());
    if (!demo) { if (!(await ctx.spend(cost))) return; await ctx.store.update(TK, { [k]: (tk[k] || 0) + 1 }).catch(() => {}); } else tk = { ...tk, [k]: (tk[k] || 0) + 1 };
    sfx('coin'); toast(`🎫 ${DEST} ${name} 탑승권을 샀어요!${demo ? ' (예시판)' : ''}`, 1800); }
  function board() { const f = flightNow(now(), F); if (!canBoard(f)) return toast(f.phase === 'land' ? '비행기가 출입구 앞에 다 설 때까지 기다려 주세요!' : `탑승 시간이 아니에요 · 다음 출발 ${hhmm(depAt(now()))} (도착 뒤 10초 안에 타요)`, 2200);
    if (!tk.one && !tk.round) return toast('🎫 탑승권이 없어요. 승무원에게서 먼저 사 주세요!', 1800);
    if (tk.round > 0) { tk = { ...tk, round: tk.round - 1, ret: (tk.ret || 0) + 1 }; if (!demo) ctx.store.update(TK, { round: tk.round, ret: tk.ret }).catch(() => {}); } else { tk = { ...tk, one: tk.one - 1 }; if (!demo) ctx.store.update(TK, { one: tk.one }).catch(() => {}); } /* 왕복권은 돌아오는 표가 남는다 */
    sfx('pop'); ride(); }
  // 출발 시각: 이번(또는 다음) 비행기가 떠나는 때
  function depAt(t) { const blk = Math.floor(t / F.every) * F.every, d = blk + F.land + F.stay; return t < d ? d : d + F.every; }

  // 말풍선: 승무원·기장·카운터 직원이 비행기 상황에 맞춰 한마디씩 한다
  const LINES = { cnt: { none: ['폐하, 핫똑랜드행 탑승권은 이쪽이옵니다~', '폐하, 편도 7,000 · 왕복 12,000코인이옵니다', '폐하께서 오시니 공항이 다 환해졌사옵니다!', '폐하의 왕관은 오늘도 눈이 부시옵니다 ✨', '폐하 같은 손님은 개항 이래 처음이옵니다!'], land: ['폐하, 비행기가 들어오고 있사옵니다!', '폐하를 모시러 비행기가 달려오옵니다!'], stay: ['폐하, 지금 탑승하시옵소서!', '폐하, 마감이 얼마 안 남았사옵니다!'], off: ['폐하, 방금 떠났사옵니다… 다음 편을 대령하겠나이다', '폐하 없는 비행기라니, 허전했을 것이옵니다'] },
    pl: { none: ['폐하, 오늘 하늘은 폐하의 덕으로 맑사옵니다', '폐하를 모시는 것이 소신 평생의 영광이옵니다', '폐하, 핫똑랜드까지 한달음에 모시겠나이다', '폐하의 위엄에 구름도 비켜 갈 것이옵니다'], land: ['폐하, 착륙 자세가 좋사옵니다!', '폐하, 비행기 들어오니 한 걸음만 물러나 주시옵소서'], stay: ['폐하, 탑승권을 확인하겠사옵니다!', '폐하, 이쪽 문으로 오르시옵소서!'], off: ['폐하, 이륙하옵니다! 만수무강하시옵소서!', '다음엔 꼭 폐하를 모시고 날겠사옵니다'] },
    wk: { none: ['폐하 납시오~!', '폐하, 걸음걸이마저 기품이 넘치시옵니다', '폐하의 캐리어라면 백 개도 끌겠사옵니다!', '폐하, 오늘따라 털결이 고우시옵니다', '바쁘다 바빠~ 앗, 폐하!'], land: ['폐하, 비행기가 왔사옵니다!', '폐하 납시니 비행기도 서둘러 오옵니다~'], stay: ['폐하, 어서 오르시옵소서~!', '폐하 먼저! 소인은 그다음이옵니다!'], off: ['아이고 폐하, 놓치셨사옵니다…', '폐하를 두고 가다니, 저 비행기 벌 받을 것이옵니다'] } };
  const says = { cnt: h('span', { class: 'ap-say', hidden: true }), pl: h('span', { class: 'ap-say', hidden: true }), wk: h('span', { class: 'ap-say', hidden: true }) }, npc = { cnt: inAtt, pl: inPilot, wk: walker }, sayT = { cnt: 0, pl: 0, wk: 0 }; inWorld.append(says.cnt, says.pl, says.wk);
  let talkAt = 2, lastPh = '';
  function say(k, f) { const a = LINES[k][f.phase] || LINES[k].none; sayText(k, a[Math.floor(Math.random() * a.length)]); }
  function sayText(k, t) { says[k].textContent = t; says[k].hidden = false; says[k].classList.remove('pop'); void says[k].offsetWidth; says[k].classList.add('pop'); sayT[k] = 3.2; }
  function talk(dt, f) { if (f.phase !== lastPh) { lastPh = f.phase; if (f.phase !== 'none') { say('cnt', f); say('pl', f); say('wk', f); talkAt = 5; } } if ((talkAt -= dt) <= 0) { talkAt = 3.5 + Math.random() * 3; say(['cnt', 'pl', 'wk'][Math.floor(Math.random() * 3)], f); }
    for (const k in says) { if (sayT[k] > 0 && (sayT[k] -= dt) <= 0) says[k].hidden = true; if (!says[k].hidden) { const e = npc[k]; says[k].style.left = e.style.left; says[k].style.bottom = `calc(${getComputedStyle(e).bottom} + ${e.offsetHeight * (k === 'wk' ? 1 - wk.y * 0.12 : 1) + 4}px)`; } } }
  // 탑승: 바닷가 활주로 시작점에 선 비행기에 내 카피바라가 앉아 → 쪽을 본다
  function ride() { const cap = h('div', { class: 'ap-ride-me', html: capy(ctx.capyOf(ctx.uid, { face: 'happy' })) }), cpt = h('img', { class: 'ap-ride-cpt', src: 'img/air/pilot-seat.webp?v=1', alt: '' }); // 좌석 3개: 맨 앞은 기장, 나는 가운데
    const rig = h('div', { class: 'ap-ride-rig' }, h('img', { class: 'ap-ride-pl', src: 'img/air/plane.webp?v=4', alt: '' }), cpt, cap, h('img', { class: 'ap-ride-hull', src: 'img/air/plane-hull.webp?v=4', alt: '' }));
    const msg = h('b'), sub = h('small'), offBtn = h('button', { class: 'btn sm', onClick: () => { end(); if (demo && LV) setTimeout(ride, 250); } }, demo && LV ? '↻ 이륙 다시 보기' : demo ? '내리기 (예시판)' : '내리기'), box = h('div', { class: 'ap-ride-t' }, msg, sub, demo && offBtn);
    const sky = h('div', { class: 'ap-sky wait', style: { '--skyw': Math.round(H * 2688 / 576) + 'px' } }, h('i', { class: 'ap-sky-bg' }), ...Array.from({ length: 5 }, (_, i) => h('img', { class: 'ap-cloud', src: `img/air/cloud${i % 3 + 1}.webp?v=3`, alt: '', style: { top: 6 + i * 15 + (i % 2) * 5 + '%', width: 22 + (i * 13) % 22 + '%', animationDuration: 2.4 + (i * 0.53) % 1.6 + 's', animationDelay: -(i * 0.71) + 's', opacity: 0.85 + (i % 3) * 0.07, zIndex: i === 3 ? 3 : 1 } })));
    // 1) 바깥 풍경 그대로: 활주로를 달리며 화면이 따라간다(1.5초 뒤 돛단배 · 다시 1.5초 뒤 등대) → 등대 앞에서 떠오른다
    const layer = h('div', { class: 'ap-ride-w', style: { width: W + 'px', height: H + 'px' } }, h('img', { class: 'ap-boat', src: 'img/air/boat.webp?v=2', alt: '' }), rig, h('img', { class: 'ap-front', src: 'img/air/front.webp?v=4', alt: '' }));
    const el = h('div', { class: 'ap-ride', style: { height: H + 'px' } }, sky, layer, box); let timer = 0, raf2 = 0, t0 = performance.now(); const FLY = 180000;
    const end = () => { clearInterval(timer); cancelAnimationFrame(raf2); el.remove(); bgm.start('airport'); };
    msg.textContent = `✈️ ${DEST}행 출발!`; sub.textContent = '활주로를 달려요…'; scene.append(el); sfx('pop');
    const vw = el.clientWidth || 360, c0 = W * 0.52, c1 = W * 0.675, c2 = Math.min(W * 0.87, W - vw / 2), RY = H * 0.585, rw = W * 0.19; rig.style.width = rw + 'px';
    // 이륙: 바깥 활주로에서 뜨는 비행기(drawOut)와 같은 움직임 — 점점 빨라지며 달리다 중간쯤 기수를 10도까지 들고, 낮고 곧게 떠서 오른쪽으로 나간다
    const run = now2 => { if (!el.isConnected) return; const T = 6, t = (now2 - t0) / 1000, p = Math.min(1, t / T);
      const x0 = c0 - vw * 0.12, X = x0 + (W + rw * 0.7 - x0) * p * p, py = RY - Math.max(0, p - 0.55) * 2 * rw * 0.61, rot = -Math.min(10, Math.max(0, p - 0.5) * 30);
      const cmax = W - vw / 2, kk = vw * 0.12, cam = -kk * Math.log(Math.exp(-(X + vw * 0.12) / kk) + Math.exp(-cmax / kk)); // 화면 끝에서 카메라가 부드럽게 멈춘다
      layer.style.opacity = String(Math.max(0, Math.min(1, (T - t) / 0.35)));
      layer.style.transform = `translateX(${-(Math.max(vw / 2, Math.min(W - vw / 2, cam)) - vw / 2).toFixed(1)}px)`; rig.style.left = X + 'px'; rig.style.top = py + 'px'; rig.style.rotate = rot + 'deg';
      if (t < T) raf2 = requestAnimationFrame(run); else fly(); };
    // 2) 하늘: 위아래로 흔들리며 구름이 빠르게 스친다(3분)
    const fly = () => { layer.remove(); rig.removeAttribute('style'); rig.classList.add('air'); el.classList.add('fly'); sky.classList.remove('wait'); sky.append(rig); if (demo) box.append(landBtn); const f0 = Date.now(); bgm.start('flight');
      const tick = () => { const left = FLY - (Date.now() - f0); if (left <= 0) { land(); return; }
        msg.textContent = `✈️ ${DEST}로 가는 중`; sub.textContent = `도착까지 ${mmss(left)}`; };
      tick(); timer = setInterval(tick, 500); };
    // 3) 착륙: 구름이 걷히고 핫똑공항이 서서히 나타난다 → 활주로에 내려앉으면 핫똑랜드로
    let landed = false; const land = () => { if (landed || !el.isConnected) return; landed = true; clearInterval(timer); offBtn.remove(); landBtn.remove(); msg.textContent = `🛬 ${DEST} 도착!`; sub.textContent = '착륙하고 있어요…';
      const bg = h('i', { class: 'ap-landbg' }); sky.prepend(bg); sky.classList.add('landing'); void bg.offsetWidth; bg.classList.add('on'); rig.classList.add('small'); void rig.offsetWidth; setTimeout(() => rig.classList.add('go'), 500); // 처음부터 작은 크기로 나타나 활주로에 내려 멈춘다
      setTimeout(() => { if (!el.isConnected) return; sfx('pop'); el.remove(); import('./hotddok.js').then(m => m.openHotddok({ ctx, demo, onMenu: () => { close(); location.hash = 'home'; }, onClose: () => { bgm.start('airport'); goIn(); owlNote(); } })).catch(() => bgm.start('airport')); }, 5200); };
    const landBtn = h('button', { class: 'btn sm', onClick: () => land() }, '🛬 바로 착륙 (예시판)');
    raf2 = requestAnimationFrame(run); }
  let lastT = performance.now(), tick = 0;
  // 바깥 비행기(25초마다): 4초 동안 내려앉고 → 10초 동안 왼쪽으로 천천히 굴러 터미널 뒤로 들어가고 → 3초 뒤 → 8초 동안 터미널 뒤에서 나와 오른쪽(→)으로 달려 떠오른다
  function drawOut(t) { const k = t % 25000, el = outPlane; let x, y = 0, r = 0, flip = 0;
    if (k < 4000) { const e = ease(k / 4000); x = 1.15 - 0.3 * e; y = -0.9 * (1 - e); r = -6 * (1 - e); }
    else if (k < 14000) { const e = (k - 4000) / 10000; x = 0.85 - 0.65 * (1 - Math.pow(1 - e, 1.6)); }
    else if (k < 17000) x = 0.2;
    else { const p = (k - 17000) / 8000, e = p * p; flip = 1; x = 0.2 + 1.05 * e; y = -Math.max(0, p - 0.55) * 2; r = -Math.min(10, Math.max(0, p - 0.5) * 30); }
    el.style.opacity = x < 0.22 ? String(Math.max(0, (x - 0.18) / 0.04)) : '1'; el.style.left = x * 100 + '%'; el.style.transform = `translate(-50%, ${(y * 100 - 100).toFixed(1)}%) rotate(${r.toFixed(1)}deg)${flip ? ' scaleX(-1)' : ''}`; }
  function drawPlane(el, f, at) { const q = planePos(f, at); if (!q.on) { el.style.opacity = '0'; return; } el.style.opacity = '1'; el.style.left = q.x * 100 + '%'; el.style.transform = `translate(-50%, ${(q.y * 100 - 100).toFixed(1)}%) rotate(${q.r.toFixed(1)}deg)${q.flip ? ' scaleX(-1)' : ''}`; }
  function drawBoard(f) { const t = now(), d0 = depAt(t), rows = [0, 1, 2].map(i => { const d = d0 + i * F.every, st = i ? '예정' : canBoard(f) ? `탑승 마감 ${mmss(f.left)}` : f.phase === 'land' ? '도착 중 · 곧 탑승' : f.phase === 'off' ? '출발' : `${mmss(d - F.stay - F.land - t)} 뒤 도착`; return [demo ? hhmm(d) + ':' + String(new Date(d).getSeconds()).padStart(2, '0') : hhmm(d), st, !i && canBoard(f)]; });
    const key = rows.map(r => r.join('|')).join('/'); if (key !== boardRows.dataset.k) { boardRows.dataset.k = key; boardRows.replaceChildren(...rows.map(([tm, st, on]) => h('div', { class: 'ap-brow' + (on ? ' on' : '') }, h('b', null, tm), h('span', null, DEST), h('em', null, st)))); }
    flightEl.textContent = canBoard(f) ? `✈️ 탑승 마감 ${mmss(f.left)}` : f.phase === 'land' ? '✈️ 도착 중' : `✈️ 다음 ${hhmm(d0)}`; }
  function step(t) { if (!alive) return; const dt = Math.min(0.05, (t - lastT) / 1000); lastT = t;
    const dir = (keys.has('R') ? 1 : 0) - (keys.has('L') ? 1 : 0), lo = inside ? W * 0.05 : 30, hi = W - 30;
    if (dir && !document.querySelector('.modal-wrap')) { me.x = Math.max(lo, Math.min(hi, me.x + dir * WALK_SP * (sc ? 1.8 : 1) * dt)); me.tx = me.x; me.then = null; meEl.classList.add('walk'); meEl.classList.toggle('left', dir < 0); }
    const d = me.tx - me.x; if (Math.abs(d) > 2) me.x += Math.sign(d) * Math.min(Math.abs(d), WALK_SP * (sc ? 1.8 : 1) * dt); else if (me.then) { const f = me.then; me.then = null; meEl.classList.remove('walk'); f(); } else if (!dir) meEl.classList.remove('walk');
    const vy = !document.querySelector('.modal-wrap') ? (keys.has('U') ? 1 : 0) - (keys.has('D') ? 1 : 0) : 0; if (vy) { me.y = Math.max(0, Math.min(1, me.y + vy * 0.9 * dt)); meEl.classList.add('walk'); }
    meEl.style.left = me.x + 'px'; meEl.style.bottom = `${1 + me.y * (inside ? 22 : 16)}%`; meEl.style.transform = `translateX(-50%) scale(${(1 - me.y * 0.14).toFixed(3)})`; meEl.style.zIndex = String(6 - Math.round(me.y * 3)); // 도로·실내 모두 위아래로도 걷는다
    const want = me.x - scroller.clientWidth / 2; if (Math.abs(scroller.scrollLeft - want) > 4 && (meEl.classList.contains('walk') || dir)) scroller.scrollLeft += (want - scroller.scrollLeft) * Math.min(1, dt * 6);
    const gate = atGate(), near = inside ? me.x < W * 0.24 || gate : Math.abs(me.x - doorX) < TWD * 0.55, lab = !inside ? '✈️ 공항 들어가기' : gate ? '✈️ 탑승하기' : '🎫 탑승권 사기';
    if (enterBtn.hidden === near) enterBtn.hidden = !near; if (enterBtn.textContent !== lab) enterBtn.textContent = lab; if (aBtn.disabled === near) { aBtn.disabled = !near; aBtn.classList.toggle('ready', near); } { const t = !inside ? '입장' : gate ? '탑승' : '탑승권'; if (aLab.textContent !== t) aLab.textContent = t; }
    const f = flightNow(now(), F); if (inside) drawPlane(inPlane, f, 0.2); else drawOut(now()); // 바깥: 내려앉아 터미널 뒤로 들어갔다가, 3초 뒤 다시 나와 오른쪽으로 떠나기를 되풀이
    if (inside) { if (wk.wait > 0) { wk.wait -= dt; walker.classList.remove('go'); if (wk.wait <= 0) { wk.tx = W * (0.07 + Math.random() * 0.87); wk.ty = Math.random(); } }
      else { const dx = wk.tx - wk.x, dy = wk.ty - wk.y, d = Math.hypot(dx, dy * 60); if (d < 3) wk.wait = 1 + Math.random() * 2.5; else { wk.x += dx / d * 42 * dt; wk.y += dy * 60 / d * 42 * dt / 60; if (Math.abs(dx) > 2) wk.d = Math.sign(dx); walker.classList.add('go'); } }
      walker.style.left = wk.x + 'px'; walker.style.bottom = `${2 + wk.y * 16}%`; walker.style.zIndex = String(6 - Math.round(wk.y * 3)); walker.style.transform = `translateX(-50%) scale(${(1 - wk.y * 0.12).toFixed(3)})${wk.d > 0 ? ' scaleX(-1)' : ''}`;
      talk(dt, f); }
    if ((tick += dt) > 0.5) { tick = 0; drawBoard(f); }
    raf = requestAnimationFrame(step); }
  raf = requestAnimationFrame(step);
  function close() { if (!alive) return; alive = false; window.removeEventListener('keydown', onKey); window.removeEventListener('keyup', onKey); cancelAnimationFrame(raf); if (offTk) offTk(); wrap.remove(); bgm.start('social'); o.onClose && o.onClose(); }
  return { close };
}
