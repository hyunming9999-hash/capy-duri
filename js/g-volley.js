// 카피바라 배구 — 유자 공으로 하는 1:1 배구. 둘이 온라인으로 하거나 컴퓨터와 연습.
// 온라인 방식: 각자 자기 카피바라를 움직이고, 공은 "공이 있는 쪽" 사람이 계산해서 상대에게 알려 준다.
import { h, holdBtn, loadImg, josa } from './ui.js';
import { capyUrl, yuzuUrl } from './capy.js';

const W = 800, H = 450, GROUND = 400, NETX = 400, NETW = 12, NETTOP = 268, PR = 40, FOOT = 71, BR = 28, WIN = 7;
// HIT: 공이 맞는 범위(그림보다 넉넉하게), GB: 공 중력(작을수록 천천히 떨어짐), FALL: 공이 떨어지는 최고 속도
const HIT = 50, GB = 0.24, FALL = 8, GP = 0.9, SPEED = 6.8, CPU_SPEED = 4.2, JUMP = -15.5;
const standY = GROUND - FOOT;
const SKY = 210; // 화면 위로 더 보여 주는 하늘 높이(공이 높이 떠도 보인다)
export const VOLLEY = { W, GROUND, NETX, BR, standY, SPEED, CPU_SPEED };

export function stepBall(b, ps) {
  b.vy = Math.min(FALL, b.vy + GB); b.x += b.vx; b.y += b.vy; b.rot += b.vx * 0.03;
  if (b.x < BR) { b.x = BR; b.vx = Math.abs(b.vx) * 0.9; }
  if (b.x > W - BR) { b.x = W - BR; b.vx = -Math.abs(b.vx) * 0.9; }
  if (b.y < BR - SKY) { b.y = BR - SKY; b.vy = Math.abs(b.vy) * 0.9; }
  const nx = Math.max(NETX - NETW / 2, Math.min(b.x, NETX + NETW / 2)), ny = Math.max(NETTOP, Math.min(b.y, GROUND));
  let dx = b.x - nx, dy = b.y - ny, d = Math.hypot(dx, dy);
  if (d < BR) {
    if (b.y < NETTOP) { if (!d) { dx = 0; dy = -1; d = 1; } b.x = nx + dx / d * BR; b.y = ny + dy / d * BR; b.vy = -Math.abs(b.vy) * 0.75; b.vx += dx / d * 1.5; }
    else { const s = b.x < NETX ? -1 : 1; b.x = NETX + s * (NETW / 2 + BR); b.vx = s * Math.abs(b.vx) * 0.75; }
  }
  for (const p of ps) for (const [cy, r] of [[0, HIT], [46, 36]]) {
    dx = b.x - p.x; dy = b.y - (p.y + cy); d = Math.hypot(dx, dy);
    if (d < BR + r && d > 0) {
      const ux = dx / d, uy = dy / d, sp = Math.max(8.5, Math.hypot(b.vx, b.vy) * 0.8);
      b.x = p.x + ux * (BR + r); b.y = p.y + cy + uy * (BR + r);
      b.vx = ux * sp * 0.85 + p.vx * 0.45; b.vy = uy * sp + p.vy * 0.3 - 2.5;
      if (dy < 12 && b.vy > -7) b.vy = -7; // 머리 위쪽에 맞으면 항상 넉넉히 떠오른다
      const v = Math.hypot(b.vx, b.vy); if (v > 13) { b.vx *= 13 / v; b.vy *= 13 / v; }
    }
  }
  return b.y >= GROUND - BR;
}
export function stepPlayer(p, i, inp, speed = SPEED) {
  if (inp) { p.vx = (inp.r ? speed : 0) - (inp.l ? speed : 0); if (inp.j && p.y >= standY) p.vy = JUMP; }
  p.vy += GP; p.x += p.vx; p.y += p.vy;
  if (p.y > standY) { p.y = standY; p.vy = 0; }
  const lo = i ? NETX + NETW / 2 + PR : PR, hi = i ? W - PR : NETX - NETW / 2 - PR;
  p.x = Math.max(lo, Math.min(hi, p.x));
}

export function mount(el, ctx) {
  let alive = true, raf = 0, acc = 0, lastT = 0;
  const canvas = h('canvas', { class: 'volley', width: W, height: H + SKY }), g = canvas.getContext('2d');
  const info = h('div', { class: 'g-status' }, '불러오는 중…');
  const modeBtn = h('button', { class: 'btn' }), newBtn = h('button', { class: 'btn primary' }, '새 게임');
  const inp = { l: false, r: false, j: false };
  const pad = h('div', { class: 'vpad' }, [['l', '◀'], ['j', '점프'], ['r', '▶']].map(([k, t]) => { const b = h('button', { class: 'vp vp-' + k }, t); holdBtn(b, () => { inp[k] = true; }, () => { inp[k] = false; }); return b; }));
  // 연습·새 게임 버튼은 조작 버튼과 멀리(맨 위)에 둬서 게임 중에 잘못 누르지 않게 한다
  el.append(info, h('div', { class: 'g-foot v-top' }, modeBtn, newBtn), canvas, pad, h('p', { class: 'dim center' }, `키보드: ← → 이동, ↑ 점프 · ${WIN}점 먼저 내면 승리`));

  const KEY = { ArrowLeft: 'l', ArrowRight: 'r', ArrowUp: 'j', a: 'l', d: 'r', w: 'j', ' ': 'j' };
  const kd = e => { const k = KEY[e.key]; if (k) { e.preventDefault(); inp[k] = true; } };
  const ku = e => { const k = KEY[e.key]; if (k) inp[k] = false; };
  window.addEventListener('keydown', kd); window.addEventListener('keyup', ku);

  let mode = ctx.order.length > 1 ? 'online' : 'cpu';
  const my = () => mode === 'online' ? ctx.idx : 0;
  const ps = [{ x: 200, y: standY, vx: 0, vy: 0 }, { x: 600, y: standY, vx: 0, vy: 0 }];
  const ball = { x: 200, y: 150, vx: 0, vy: 0, rot: 0 };
  let game = { sc0: 0, sc1: 0, serve: 0, phase: 'idle', at: 0, n: 0 }, dead = false, deadMine = false, oppSeen = 0, sendT = 0, lastP = '', lastPT = 0, aiErr = 0, aiT = 0;
  const now = () => mode === 'online' ? ctx.store.now() : Date.now();
  const live = () => game.phase === 'serve' && now() >= game.at + 1000 && !dead;
  const placeBall = () => { Object.assign(ball, { x: game.serve ? 600 : 200, y: 150, vx: 0, vy: 0, rot: 0 }); dead = false; deadMine = false; };
  const sprites = [null, null], yz = new Image(); yz.src = yuzuUrl;
  const loadSprites = () => [0, 1].forEach(i => { const uid = mode === 'online' ? ctx.order[i] : (i ? null : ctx.uid); loadImg(capyUrl(uid ? ctx.capyOf(uid, { face: 'happy' }) : { color: 'choco', acc: 'towel', face: 'wink' })).then(im => { sprites[i] = im; }); });

  function setGame(v) { const fresh = !v || v.n !== game.n || v.phase !== game.phase || v.at !== game.at; game = v || { sc0: 0, sc1: 0, serve: 0, phase: 'idle', at: 0, n: 0 }; if (fresh) placeBall(); }
  function newGame() { const v = { sc0: 0, sc1: 0, serve: 0, phase: 'serve', at: now(), n: (game.n || 0) + 1 }; mode === 'online' ? ctx.store.set('games/volley', v) : setGame(v); ps[0].x = 200; ps[1].x = 600; }
  function point(loser) {
    dead = true; deadMine = true;
    const upd = s => { if (!s || s.n !== game.n || s.phase !== 'serve') return; const w = 1 - loser, sc = [s.sc0, s.sc1]; sc[w]++; return { sc0: sc[0], sc1: sc[1], serve: w, phase: sc[w] >= WIN ? 'over' : 'serve', at: now(), n: s.n + 1 }; };
    if (mode === 'online') ctx.store.tx('games/volley', upd); else { const v = upd(game); v && setTimeout(() => alive && mode === 'cpu' && setGame(v), 350); }
  }

  // 온라인 연결
  const offs = [];
  function connect() {
    offs.splice(0).forEach(f => f());
    if (mode !== 'online') return;
    const opp = 1 - ctx.idx;
    offs.push(ctx.store.on('games/volley', setGame));
    offs.push(ctx.store.on('rt/volley/p' + opp, v => { if (!v) return; oppSeen = Date.now(); Object.assign(ps[opp], { x: v.x, y: v.y, vx: v.vx, vy: v.vy }); }));
    offs.push(ctx.store.on('rt/volley/ball', v => {
      if (!v || v.side === ctx.idx || v.n !== game.n) return;
      const senderSide = (v.x < NETX ? 0 : 1) === v.side, mine = (ball.x < NETX ? 0 : 1) === ctx.idx;
      if ((!senderSide && mine) || deadMine) return;
      dead = false;
      Object.assign(ball, { x: v.x, y: v.y, vx: v.vx, vy: v.vy });
      const k = Math.max(0, Math.min(20, Math.round((ctx.store.now() - v.t) / 16.7)));
      for (let i = 0; i < k; i++) if (stepBall(ball, [])) { ball.y = GROUND - BR; break; }
    }));
  }
  function send(t) {
    if (mode !== 'online' || t - sendT < 50) return; sendT = t;
    const p = ps[ctx.idx], r = n => Math.round(n * 10) / 10;
    const pv = { x: r(p.x), y: r(p.y), vx: r(p.vx), vy: r(p.vy) }, key = JSON.stringify(pv);
    if (key !== lastP || t - lastPT > 1000) { lastP = key; lastPT = t; ctx.store.set('rt/volley/p' + ctx.idx, { ...pv, k: Math.round(t) }).catch(() => {}); }
    if (live() && (ball.x < NETX ? 0 : 1) === ctx.idx) ctx.store.set('rt/volley/ball', { x: r(ball.x), y: r(ball.y), vx: r(ball.vx), vy: r(ball.vy), side: ctx.idx, n: game.n, t: ctx.store.now() }).catch(() => {});
  }
  function ai(p) {
    if (Date.now() > aiT) { aiT = Date.now() + 900; aiErr = (Math.random() - 0.5) * 130; }
    const tx = ball.x > NETX - 20 ? ball.x + 20 + aiErr : 610, o = { l: p.x > tx + 8, r: p.x < tx - 8, j: false };
    o.j = ball.x > NETX && Math.abs(ball.x - p.x) < 70 && ball.y < p.y - 70 && ball.y > 170 && ball.vy > 0 && Math.random() < 0.15;
    return o;
  }
  function tick() {
    const me = my();
    stepPlayer(ps[me], me, inp);
    if (mode === 'online' && Date.now() - oppSeen > 300) ps[1 - me].vx = 0;
    stepPlayer(ps[1 - me], 1 - me, mode === 'cpu' ? ai(ps[1]) : null, CPU_SPEED);
    if (!live()) return;
    if (stepBall(ball, ps)) {
      ball.y = GROUND - BR; ball.vy = 0; ball.vx *= 0.5;
      const side = ball.x < NETX ? 0 : 1;
      if (mode === 'cpu' || side === ctx.idx) point(side); else dead = true;
    }
  }
  function draw() {
    g.setTransform(1, 0, 0, 1, 0, SKY); // 코트 좌표는 그대로 두고 위쪽 하늘만 넓힌다
    const sky = g.createLinearGradient(0, -SKY, 0, GROUND); sky.addColorStop(0, '#9DD6F0'); sky.addColorStop(1, '#FFF3D6');
    g.fillStyle = sky; g.fillRect(0, -SKY, W, H + SKY);
    g.fillStyle = '#fff'; g.globalAlpha = 0.7; for (const [x, y, r] of [[120, -60, 26], [150, -70, 34], [185, -56, 24], [600, 40, 22], [630, 30, 30], [665, 42, 20], [360, -150, 20], [390, -158, 28], [422, -148, 18]]) { g.beginPath(); g.arc(x, y, r, 0, 7); g.fill(); } g.globalAlpha = 1;
    g.fillStyle = '#E8C98F'; g.fillRect(0, GROUND, W, H - GROUND); g.fillStyle = '#D9B576'; g.fillRect(0, GROUND, W, 6);
    g.fillStyle = '#8A5E3B'; g.fillRect(NETX - NETW / 2, NETTOP, NETW, GROUND - NETTOP); g.fillStyle = '#fff'; g.fillRect(NETX - NETW / 2 - 2, NETTOP, NETW + 4, 8);
    g.fillStyle = 'rgba(0,0,0,.13)';
    for (const p of ps) { g.beginPath(); g.ellipse(p.x, GROUND + 3, 34, 7, 0, 0, 7); g.fill(); }
    g.beginPath(); g.ellipse(ball.x, GROUND + 3, 20, 5, 0, 0, 7); g.fill();
    ps.forEach((p, i) => { const im = sprites[i]; if (im) g.drawImage(im, p.x - 50, p.y - 59, 100, 131.7); else { g.fillStyle = '#BC8C60'; g.beginPath(); g.arc(p.x, p.y, PR, 0, 7); g.fill(); } });
    g.save(); g.translate(ball.x, ball.y); g.rotate(ball.rot); if (yz.complete && yz.naturalWidth) g.drawImage(yz, -BR - 2, -BR - 5, BR * 2 + 4, BR * 2 + 4); else { g.fillStyle = '#FFC93C'; g.beginPath(); g.arc(0, 0, BR, 0, 7); g.fill(); } g.restore();
    g.fillStyle = '#5F3F2B'; g.font = '700 44px Jua, sans-serif'; g.textAlign = 'center';
    g.fillText(game.sc0, NETX - 70, 60 - SKY); g.fillText(game.sc1, NETX + 70, 60 - SKY);
    let msg = '';
    if (game.phase === 'idle') msg = '새 게임을 눌러 시작';
    else if (game.phase === 'over') msg = (game.sc0 > game.sc1 ? 0 : 1) === my() ? '이겼다!' : mode === 'cpu' ? '컴퓨터 승리' : '졌다…';
    else if (!live() && !dead) msg = game.serve === my() ? '내 서브' : '상대 서브';
    if (msg) { g.font = '700 34px Jua, sans-serif'; g.fillStyle = 'rgba(255,255,255,.85)'; const w = g.measureText(msg).width + 48; g.beginPath(); g.roundRect(NETX - w / 2, 60, w, 60, 30); g.fill(); g.fillStyle = '#5F3F2B'; g.fillText(msg, NETX, 102); }
  }
  function loop(t) {
    if (!alive) return; raf = requestAnimationFrame(loop);
    acc += Math.min(100, t - (lastT || t)); lastT = t;
    while (acc >= 16.67) { tick(); acc -= 16.67; }
    send(t); draw();
    const here = mode !== 'online' || Date.now() - oppSeen < 3000;
    const txt = mode === 'cpu' ? '컴퓨터와 연습 중' : here ? `${josa(ctx.nameOf(ctx.order[1 - ctx.idx]), '와', '과')} 대결 중 · 나는 ${ctx.idx ? '오른쪽' : '왼쪽'}` : `${josa(ctx.nameOf(ctx.order[1 - ctx.idx]), '가', '이')} 배구에 들어오길 기다리는 중…`;
    if (info.textContent !== txt) info.textContent = txt;
  }
  function setMode(m) {
    mode = m; modeBtn.textContent = m === 'online' ? '컴퓨터와 연습하기' : '둘이 하기'; modeBtn.hidden = ctx.order.length < 2;
    ps[0].x = 200; ps[1].x = 600; setGame(null); loadSprites(); connect();
  }
  modeBtn.onclick = () => setMode(mode === 'online' ? 'cpu' : 'online');
  newBtn.onclick = newGame;
  setMode(mode); raf = requestAnimationFrame(loop);
  return () => { alive = false; cancelAnimationFrame(raf); offs.forEach(f => f()); window.removeEventListener('keydown', kd); window.removeEventListener('keyup', ku); if (mode === 'online') ctx.store.remove('rt/volley/p' + ctx.idx).catch(() => {}); };
}
