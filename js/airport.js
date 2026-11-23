// 카피공항: 놀이터 왼쪽 '카피공항으로' 팻말로 가는 따로 된 공간(농장처럼).
// 바깥: 바닷가 도로 · 통유리 터미널 · 그 뒤 활주로 · 승무원 둘. 터미널에 들어가면 안쪽: 카운터 · 출국 대기장 · 큰 창 너머 활주로.
// 비행기: 10분마다 한 번 내려앉아 잠시 머물다 다시 떠난다(두 사람 화면이 같은 시계로 맞춰 움직인다)
import { h, toast, modal, holdBtn } from './ui.js';
import { capy } from './capy.js';
import { sfx } from './sound.js';

const BG_W = 1344, BG_H = 576, WALK_SP = 150;
export const FLIGHT = { every: 600000, land: 10000, stay: 90000, off: 8000 }; // 10분마다: 10초 동안 왼쪽으로 들어와 내려앉아 서고 → 1분 30초 탑승 → 8초 동안 오른쪽으로 달려 나가 떠난다
export function flightNow(t) { const k = ((t % FLIGHT.every) + FLIGHT.every) % FLIGHT.every, a = FLIGHT.land, b = a + FLIGHT.stay, c = b + FLIGHT.off;
  if (k < a) return { phase: 'land', p: k / a, left: 0 }; if (k < b) return { phase: 'stay', p: (k - a) / FLIGHT.stay, left: b - k }; if (k < c) return { phase: 'off', p: (k - b) / FLIGHT.off, left: 0 };
  return { phase: 'none', p: 0, left: FLIGHT.every - k }; }
export const TICKET = { one: 18000, round: 30000 }, DEST = '핫똑랜드';
const hhmm = t => { const d = new Date(t); return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`; };
const mmss = ms => { const s = Math.max(0, Math.ceil(ms / 1000)); return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`; };
const ease = x => x * x * (3 - 2 * x);
// 비행기 위치(창·활주로 한 칸 기준 0~1, y는 위로 갈수록 -): 들어올 때는 오른쪽 하늘에서 내려와 왼쪽(<)으로 굴러 가운데 멈추고,
// 떠날 때는 오른쪽을 보고 달려 나가 떠오르며 화면 밖으로 사라진다
function planePos(f) { if (f.phase === 'land') { const p = f.p; if (p < 0.45) { const e = ease(p / 0.45); return { x: 1.3 - 0.45 * e, y: -0.9 * (1 - e), r: -6 * (1 - e), flip: 0, on: 1 }; }
    const e = 1 - Math.pow(1 - (p - 0.45) / 0.55, 2); return { x: 0.85 - 0.35 * e, y: 0, r: 0, flip: 0, on: 1 }; }
  if (f.phase === 'stay') return { x: 0.5, y: 0, r: 0, flip: 0, on: 1 };
  if (f.phase === 'off') { const p = f.p, e = p * p; return { x: 0.5 + 1.0 * e, y: -Math.max(0, p - 0.5) * 1.6, r: -Math.min(10, Math.max(0, p - 0.45) * 30), flip: 1, on: 1 }; }
  return { on: 0 }; }

export function openAirport(o) {
  const { ctx } = o; let alive = true, raf = 0, inside = false;
  const now = () => (ctx.store && ctx.store.now ? ctx.store.now() : Date.now());
  const demo = !!o.demo, TK = 'air/' + ctx.uid; let tk = { one: 0, round: 0 }; // 가진 핫똑랜드 탑승권(편도·왕복). 예시판은 저장하지 않는다
  const offTk = !demo && ctx.store.on ? ctx.store.on(TK, v => { tk = { one: (v && v.one) || 0, round: (v && v.round) || 0 }; }) : null;
  const H = Math.max(280, Math.min(Math.round(innerHeight * 0.52), 520)), W = Math.round(H * BG_W / BG_H);
  const me = { x: W * 0.62, tx: W * 0.62 };
  const sc = o.scoot ? o.scoot() : null, meEl = h('div', { class: 'fm-me ap-me' + (sc ? ' scoot' : ''), html: sc || capy(ctx.capyOf(ctx.uid, { face: 'happy' })) });
  // 바깥
  const TX = W * 0.14, TWD = W * 0.3, doorX = TX + TWD * 0.42;
  const outPlane = h('img', { class: 'ap-plane out', src: 'img/air/plane.webp', alt: '' });
  const parked = [[0.035, 1], [0.105, 0.85], [0.475, 1], [0.575, 0.9], [0.94, 1]].map(([x, k], i) => h('img', { class: 'ap-parked', src: 'img/air/plane.webp', alt: '', style: { left: W * x + 'px', width: 8.5 * k + '%', transform: `translate(-50%, -100%)${i % 2 ? ' scaleX(-1)' : ''}` } })); // 계류장에 서 있는 비행기들(터미널 양옆·활주로 끝)
  const term = h('button', { class: 'ap-term', 'aria-label': '카피공항 들어가기', style: { left: TX + 'px', width: TWD + 'px' }, onClick: () => walkTo(doorX, goIn) }, h('img', { src: 'img/air/terminal.webp', alt: '' }), h('b', { class: 'ap-term-t' }, '카피공항'));
  const att = h('img', { class: 'ap-crew tap', src: 'img/air/att.webp', alt: '카피승무원', style: { left: TX + TWD * 1.08 + 'px' }, onClick: () => walkTo(TX + TWD * 1.08 + 40, openTicket) }), pilot = h('img', { class: 'ap-crew', src: 'img/air/pilot.webp', alt: '카피기장', style: { left: TX + TWD * 1.22 + 'px' } });
  const exitSign = h('button', { class: 'fm-exit', style: { left: W - Math.round(W * 0.13) + 'px' }, onClick: () => close() }, '놀이터로 →');
  const outWorld = h('div', { class: 'fm-world ap-world', style: { width: W + 'px', height: H + 'px', backgroundImage: 'url(img/air/out.webp)' } }, h('div', { class: 'ap-runway' }, outPlane), ...parked, term, att, pilot, exitSign);
  // 안쪽
  const counter = h('button', { class: 'ap-counter', 'aria-label': '공항 카운터', onClick: () => walkTo(W * 0.13, openTicket) });
  const inAtt = h('img', { class: 'ap-crew in tap', src: 'img/air/att.webp', alt: '카피승무원', style: { left: W * 0.115 + 'px' }, onClick: () => walkTo(W * 0.13, openTicket) }), inPilot = h('img', { class: 'ap-crew in', src: 'img/air/pilot.webp', alt: '카피기장', style: { left: W * 0.9 + 'px' } });
  const inPlane = h('img', { class: 'ap-plane in', src: 'img/air/plane.webp', alt: '' });
  const boardEl = h('div', { class: 'ap-board' }), boardRows = h('div', { class: 'ap-brows' }); boardEl.append(h('span', null, `🛫 출발 안내 · ${DEST}행`), boardRows);
  const outBtn = h('button', { class: 'fm-exit ap-out', style: { left: W * 0.27 + 'px' }, onClick: () => goOut() }, '← 밖으로');
  const inWorld = h('div', { class: 'fm-world ap-world in', hidden: true, style: { width: W + 'px', height: H + 'px', backgroundImage: 'url(img/air/in.webp)' } }, h('div', { class: 'ap-window' }, inPlane, h('img', { class: 'ap-mull', src: 'img/air/mullion.webp', alt: '' })), boardEl, counter, inAtt, inPilot, outBtn);
  const scroller = h('div', { class: 'fm-scroll' }, outWorld, inWorld);
  const keys = new Set(), padBtn = (k, t) => { const b = h('button', { class: 'dp fm-dp', 'aria-label': k === 'L' ? '왼쪽' : '오른쪽' }, t); holdBtn(b, () => keys.add(k), () => keys.delete(k)); return b; };
  const enterBtn = h('button', { class: 'fm-enter', hidden: true, onClick: () => (!inside ? goIn() : me.x > W * 0.7 ? board() : openTicket()) });
  const scene = h('div', { class: 'fm-scene' }, scroller, h('div', { class: 'fm-pad' }, padBtn('L', '◀'), enterBtn, padBtn('R', '▶')));
  const title = h('b', null, '✈️ 카피공항'), flightEl = h('span', { class: 'ap-flight' });
  const wrap = h('div', { class: 'fm ap' }, h('div', { class: 'fm-top' }, title, flightEl, h('button', { class: 'top-x', 'aria-label': '닫기', onClick: () => close() }, '✕')), scene);
  document.body.append(wrap);
  const onKey = e => { const k = e.key === 'ArrowLeft' ? 'L' : e.key === 'ArrowRight' ? 'R' : ''; if (!k || document.querySelector('.modal-wrap')) return; e.preventDefault(); if (e.type === 'keydown') keys.add(k); else keys.delete(k); };
  window.addEventListener('keydown', onKey); window.addEventListener('keyup', onKey);
  const world = () => (inside ? inWorld : outWorld);
  function place() { world().append(meEl); }
  place(); requestAnimationFrame(() => { scroller.scrollLeft = me.x - scroller.clientWidth / 2; });

  function walkTo(x, then) { me.tx = x; me.then = then; meEl.classList.add('walk'); meEl.classList.toggle('left', x < me.x); }
  function goIn() { if (inside) return; inside = true; sfx('pop'); outWorld.hidden = true; inWorld.hidden = false; me.x = me.tx = W * 0.36; me.then = null; place(); title.textContent = '✈️ 카피공항 · 출국장'; scroller.scrollLeft = 0; }
  function goOut() { if (!inside) return; inside = false; sfx('pop'); inWorld.hidden = true; outWorld.hidden = false; me.x = me.tx = doorX; me.then = null; place(); title.textContent = '✈️ 카피공항'; scroller.scrollLeft = Math.max(0, me.x - scroller.clientWidth / 2); }
  const canBoard = f => f.phase === 'land' || f.phase === 'stay'; // 비행기가 들어오기 시작(내려앉기 10초 전)부터 출발 전까지 탈 수 있다
  function openTicket() { const f = flightNow(now()), dep = depAt(now());
    const row = (k, name, desc) => h('button', { class: 'ap-tk', onClick: () => buy(k, name) }, h('b', null, `🎫 ${DEST} ${name}`), h('small', null, desc), h('em', null, `${TICKET[k].toLocaleString()}코인`));
    modal({ title: `🎫 ${DEST} 탑승권`, body: [h('div', { class: 'ap-cnt' }, h('img', { src: 'img/air/att.webp', alt: '' }),
      h('p', null, `어서 오세요, 카피공항입니다! ✈️`, h('br'), `${DEST}행 카피 오픈카 비행기는 10분마다 한 대씩 떠나요.`),
      h('p', { class: 'ap-cnt-s' }, canBoard(f) ? `지금 탑승할 수 있어요 · ${hhmm(dep)} 출발` : `다음 비행기 ${hhmm(dep)} 출발 · 탑승은 도착 10초 전부터`),
      demo && h('p', { class: 'ap-cnt-n' }, '🧪 예시판이라 코인은 빠지지 않아요'),
      row('one', '편도', '가는 비행기 한 번'), row('round', '왕복', '갔다가 돌아오는 비행기 · 더 싸요'),
      h('p', { class: 'ap-cnt-n' }, `가진 탑승권: 편도 ${tk.one}장 · 왕복 ${tk.round}장`))], actions: [{ label: '닫기' }] }); }
  async function buy(k, name) { const cost = TICKET[k]; document.querySelectorAll('.modal-wrap').forEach(m => m.remove());
    if (!demo) { if (!(await ctx.spend(cost))) return; await ctx.store.update(TK, { [k]: (tk[k] || 0) + 1 }).catch(() => {}); } else tk = { ...tk, [k]: (tk[k] || 0) + 1 };
    sfx('coin'); toast(`🎫 ${DEST} ${name} 탑승권을 샀어요!${demo ? ' (예시판)' : ''}`, 1800); }
  function board() { const f = flightNow(now()); if (!canBoard(f)) return toast(`탑승은 비행기가 들어오기 시작할 때(도착 10초 전)부터 할 수 있어요 · 다음 출발 ${hhmm(depAt(now()))}`, 2200);
    if (!tk.one && !tk.round) return toast('🎫 탑승권이 없어요. 승무원에게서 먼저 사 주세요!', 1800);
    sfx('pop'); modal({ title: `✈️ ${DEST}행 탑승`, body: [h('div', { class: 'ap-cnt' }, h('img', { src: 'img/air/pilot.webp', alt: '' }), h('p', null, `${DEST}는 지금 한창 공사 중이래요! 🚧`, h('br'), '조금만 기다려 주세요. 곧 날아갈 수 있어요.'), h('p', { class: 'ap-cnt-n' }, '탑승권은 그대로 가지고 있어요.'))], actions: [{ label: '알겠어요', primary: true }] }); }
  // 출발 시각: 이번(또는 다음) 비행기가 떠나는 때
  function depAt(t) { const blk = Math.floor(t / FLIGHT.every) * FLIGHT.every, d = blk + FLIGHT.land + FLIGHT.stay; return t < d ? d : d + FLIGHT.every; }

  let lastT = performance.now(), tick = 0;
  function drawPlane(el, f) { const q = planePos(f); if (!q.on) { el.style.opacity = '0'; return; } el.style.opacity = '1'; el.style.left = q.x * 100 + '%'; el.style.transform = `translate(-50%, ${(q.y * 100 - 100).toFixed(1)}%) rotate(${q.r.toFixed(1)}deg)${q.flip ? ' scaleX(-1)' : ''}`; }
  function drawBoard(f) { const t = now(), d0 = depAt(t), rows = [0, 1, 2].map(i => { const d = d0 + i * FLIGHT.every, st = i ? '예정' : canBoard(f) ? '탑승 중' : f.phase === 'off' ? '출발' : `${mmss(d - FLIGHT.stay - FLIGHT.land - t)} 뒤 도착`; return [hhmm(d), st, !i && canBoard(f)]; });
    const key = rows.map(r => r.join('|')).join('/'); if (key !== boardRows.dataset.k) { boardRows.dataset.k = key; boardRows.replaceChildren(...rows.map(([tm, st, on]) => h('div', { class: 'ap-brow' + (on ? ' on' : '') }, h('b', null, tm), h('span', null, DEST), h('em', null, st)))); }
    flightEl.textContent = canBoard(f) ? `✈️ 탑승 중 · ${hhmm(d0)}` : `✈️ 다음 ${hhmm(d0)}`; }
  function step(t) { if (!alive) return; const dt = Math.min(0.05, (t - lastT) / 1000); lastT = t;
    const dir = (keys.has('R') ? 1 : 0) - (keys.has('L') ? 1 : 0), lo = inside ? W * 0.05 : 30, hi = W - 30;
    if (dir && !document.querySelector('.modal-wrap')) { me.x = Math.max(lo, Math.min(hi, me.x + dir * WALK_SP * (sc ? 1.8 : 1) * dt)); me.tx = me.x; me.then = null; meEl.classList.add('walk'); meEl.classList.toggle('left', dir < 0); }
    const d = me.tx - me.x; if (Math.abs(d) > 2) me.x += Math.sign(d) * Math.min(Math.abs(d), WALK_SP * (sc ? 1.8 : 1) * dt); else if (me.then) { const f = me.then; me.then = null; meEl.classList.remove('walk'); f(); } else if (!dir) meEl.classList.remove('walk');
    meEl.style.left = me.x + 'px';
    const want = me.x - scroller.clientWidth / 2; if (Math.abs(scroller.scrollLeft - want) > 4 && (meEl.classList.contains('walk') || dir)) scroller.scrollLeft += (want - scroller.scrollLeft) * Math.min(1, dt * 6);
    const gate = inside && me.x > W * 0.7, near = inside ? me.x < W * 0.24 || gate : Math.abs(me.x - doorX) < TWD * 0.55, lab = !inside ? '✈️ 공항 들어가기' : gate ? '✈️ 탑승하기' : '🎫 탑승권 사기';
    if (enterBtn.hidden === near) enterBtn.hidden = !near; if (enterBtn.textContent !== lab) enterBtn.textContent = lab;
    const f = flightNow(now()); drawPlane(inside ? inPlane : outPlane, f); if ((tick += dt) > 0.5) { tick = 0; drawBoard(f); }
    raf = requestAnimationFrame(step); }
  raf = requestAnimationFrame(step);
  function close() { if (!alive) return; alive = false; window.removeEventListener('keydown', onKey); window.removeEventListener('keyup', onKey); cancelAnimationFrame(raf); if (offTk) offTk(); wrap.remove(); o.onClose && o.onClose(); }
  return { close };
}
