// 카피바라 배구 — 유자 공으로 하는 1:1 배구(가로 화면). 둘이 온라인으로 하거나 컴퓨터와 연습.
// 내가 친 공을 상대 진영으로 3번 넘기면 스파이크 1번: 점프해서 공에 닿을 때 스파이크를 누르면 상대 코트로 내리꽂는다.
// 온라인 방식: 각자 자기 카피바라를 움직이고, 공은 "공이 있는 쪽" 사람이 계산해서 상대에게 알려 준다.
import { PAY } from './money.js';
import { h, holdBtn, loadImg, josa, gameFx } from './ui.js';
import { sfx } from './sound.js';
import { capyUrl, yuzuUrl } from './capy.js';

const W = 800, H = 450, GROUND = 400, NETX = 400, NETW = 12, NETTOP = 268, PR = 40, FOOT = 71, BR = 28, WIN = 7;
// HIT: 공이 맞는 범위(그림보다 넉넉하게), GB: 공 중력(작을수록 천천히 떨어짐), FALL: 공이 떨어지는 최고 속도
const HIT = 50, GB = 0.24, FALL = 8, GP = 0.9, SPEED = 6.8, CPU_SPEED = 4.2, JUMP = -15.5;
const standY = GROUND - FOOT;
const SKY = 210; // 공이 이만큼 화면 위로 나갔다가 돌아올 수 있다(가로 화면에서는 화살표로 위치를 알려 준다)
export const VOLLEY = { W, GROUND, NETX, BR, standY, SPEED, CPU_SPEED };

// onHit(i, p): 선수 i가 공을 쳤을 때 불린다. 'spike'를 돌려주면 공을 상대 코트로 내리꽂는다
export function stepBall(b, ps, onHit) {
  if (b.cd) b.cd = b.cd.map(v => Math.max(0, v - 1)); else b.cd = [0, 0];
  if (b.spike) b.spike--;
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
  ps.forEach((p, pi) => { let hit = false; if (b.cd[pi]) return; // 방금 친 선수는 잠깐 다시 닿지 않는다(스파이크가 머리에 또 맞아 튕기지 않게)
    for (const [cy, r] of [[0, HIT], [46, 36]]) {
    dx = b.x - p.x; dy = b.y - (p.y + cy); d = Math.hypot(dx, dy);
    if (d < BR + r && d > 0) {
      const ux = dx / d, uy = dy / d, sp = Math.max(8.5, Math.hypot(b.vx, b.vy) * 0.8);
      b.x = p.x + ux * (BR + r); b.y = p.y + cy + uy * (BR + r);
      b.vx = ux * sp * 0.85 + p.vx * 0.45; b.vy = uy * sp + p.vy * 0.3 - 2.5;
      if (dy < 12 && b.vy > -7) b.vy = -7; // 머리 위쪽에 맞으면 항상 넉넉히 떠오른다
      const v = Math.hypot(b.vx, b.vy); if (v > 13) { b.vx *= 13 / v; b.vy *= 13 / v; }
      hit = true;
    }
  }
    if (hit && !b.cd[pi]) { b.cd[pi] = 14; const r = onHit && onHit(pi, p); if (r === 'spike') { const dir = pi ? -1 : 1, t1 = Math.max(1, Math.abs(NETX - b.x) / 15.5); b.vx = dir * 15.5; b.vy = Math.max(-6, Math.min(7.5, (NETTOP - BR - 16 - b.y - 0.5 * GB * t1 * t1) / t1)); b.spike = 40; } } }); // 스파이크: 네트 위를 스치듯 넘겨 상대 코트로 내리꽂는다
  return b.y >= GROUND - BR;
}
export function stepPlayer(p, i, inp, speed = SPEED) {
  if (inp) { p.vx = (inp.r ? speed : 0) - (inp.l ? speed : 0); if (inp.j && p.y >= standY) p.vy = JUMP; }
  p.vy += GP; p.x += p.vx; p.y += p.vy;
  if (p.y > standY) { p.y = standY; p.vy = 0; }
  const lo = i ? NETX + NETW / 2 + PR : PR, hi = i ? W - PR : NETX - NETW / 2 - PR;
  p.x = Math.max(lo, Math.min(hi, p.x));
}

const SPK_N = 3, ARM_MS = 650; // 상대 진영으로 3번 넘기기 → 스파이크 1번 / 스파이크 버튼을 누르고 이 시간 안에 공에 닿으면 발동
export function mount(el, ctx) {
  let alive = true, raf = 0, acc = 0, lastT = 0;
  const canvas = h('canvas', { class: 'volley vb-cv', width: W, height: H }), g = canvas.getContext('2d');
  const info = h('div', { class: 'vb-info' }, '불러오는 중…');
  const modeBtn = h('button', { class: 'vb-tb' }), newBtn = h('button', { class: 'vb-start' }, h('b', null, '▶ 시작'), h('small', null, '7점 먼저 내면 승리'));
  const inp = { l: false, r: false, j: false, s: false };
  // 스파이크 충전: [나, 상대] 기본 공격 횟수(0~3). 3이면 스파이크 준비 완료
  const chg = [0, 0], armAt = [0, 0]; let flash = 0, shake = 0, spikeTxt = 0, lastHit = -1, camZ = 1, camTop = 0, ghost = null;
  const btn = (k, cls, label, sub) => { const b = h('button', { class: 'vb-btn ' + cls }, h('b', null, label), sub && h('small', null, sub)); holdBtn(b, () => { inp[k] = true; if (k === 's') armAt[my()] = performance.now(); }, () => { inp[k] = false; }); return b; };
  const spkBtn = btn('s', 'spk', '스파이크', '0/3'); spkBtn.append(h('em', { class: 'vb-now' }, '눌러!')); const pips = h('div', { class: 'vb-pips' });
  const left = h('div', { class: 'vb-pad l' }, btn('l', 'mv', '◀'), btn('r', 'mv', '▶'));
  const right = h('div', { class: 'vb-pad r' }, spkBtn, btn('j', 'jmp', '점프'));
  const exit = h('button', { class: 'vb-tb x', onClick: () => ctx.go('game') }, '✕ 나가기');
  const bar = el.querySelector('.bet-bar');
  const top = h('div', { class: 'vb-top' }, exit, info, bar || '', modeBtn);
  const spk = h('div', { class: 'vb-spk' }, pips);
  const rot = h('div', { class: 'vb-rot' }, canvas, top, spk, left, right, newBtn), wrap = h('div', { class: 'vb' }, rot);
  let VK = 1, VX = 0, VY = 0; // 화면 전체를 쓰는 캔버스 안에서 코트(800×450)를 그릴 배율과 위치
  el.append(wrap); document.body.classList.add('vb-on');
  // 세로로 들고 있으면 화면을 90도 돌려 가로로 보여 준다. 조작 버튼은 코트를 가리지 않게 양옆에 둔다
  // 가로 풀화면: 화면 전체가 캔버스. 코트는 높이에 꽉 맞추고, 남는 양옆은 배경을 이어 그린다
  const fit = () => { const pw = innerWidth, ph = innerHeight, port = ph > pw, w = port ? ph : pw, hh = port ? pw : ph, dpr = Math.min(2, devicePixelRatio || 1);
    rot.style.width = w + 'px'; rot.style.height = hh + 'px'; rot.style.transform = `translate(-50%, -50%)${port ? ' rotate(90deg)' : ''}`;
    canvas.width = Math.round(w * dpr); canvas.height = Math.round(hh * dpr); canvas.style.width = w + 'px'; canvas.style.height = hh + 'px';
    VK = Math.min(w / W, hh / H) * dpr; VX = (canvas.width - W * VK) / 2; VY = canvas.height - H * VK; spk.style.top = (VY + 64 * VK) / dpr + 'px'; };
  // 처음 화면을 누르면 진짜 전체화면(주소창까지 숨김)으로 바꾼다. 지원 안 하는 폰은 그대로
  const goFull = () => { const d = document.documentElement; if (!document.fullscreenElement && d.requestFullscreen) d.requestFullscreen({ navigationUI: 'hide' }).then(() => { try { screen.orientation.lock('landscape').catch(() => {}); } catch {} setTimeout(fit, 200); }).catch(() => {}); };
  wrap.addEventListener('pointerdown', goFull, { once: true });
  addEventListener('resize', fit); setTimeout(fit, 0); try { screen.orientation && screen.orientation.lock && screen.orientation.lock('landscape').catch(() => {}); } catch {}

  const KEY = { ArrowLeft: 'l', ArrowRight: 'r', ArrowUp: 'j', a: 'l', d: 'r', w: 'j', ' ': 'j', s: 's', ArrowDown: 's', Shift: 's' };
  const kd = e => { const k = KEY[e.key]; if (k) { e.preventDefault(); if (k === 's' && !inp.s) armAt[my()] = performance.now(); inp[k] = true; } };
  const ku = e => { const k = KEY[e.key]; if (k) inp[k] = false; };
  addEventListener('keydown', kd); addEventListener('keyup', ku);

  let mode = ctx.order.length > 1 ? 'online' : 'cpu';
  const my = () => mode === 'online' ? ctx.idx : 0;
  const ps = [{ x: 200, y: standY, vx: 0, vy: 0 }, { x: 600, y: standY, vx: 0, vy: 0 }];
  const ball = { x: 200, y: 150, vx: 0, vy: 0, rot: 0, cd: [0, 0], spike: 0 }, trail = [];
  let game = { sc0: 0, sc1: 0, serve: 0, phase: 'idle', at: 0, n: 0 }, dead = false, deadMine = false, oppSeen = 0, sendT = 0, lastP = '', lastPT = 0, aiErr = 0, aiT = 0;
  const now = () => mode === 'online' ? ctx.store.now() : Date.now();
  const live = () => game.phase === 'serve' && now() >= game.at + 1000 && !dead;
  const placeBall = () => { lastHit = -1; Object.assign(ball, { x: game.serve ? 600 : 200, y: 150, vx: 0, vy: 0, rot: 0, spike: 0 }); trail.length = 0; dead = false; deadMine = false; };
  const sprites = [null, null], yz = new Image(), bg = new Image(); yz.src = 'img/volley/ball.webp'; bg.src = 'img/volley/bg.webp';
  const yz0 = new Image(); yz0.src = yuzuUrl;
  const loadSprites = () => [0, 1].forEach(i => { const uid = mode === 'online' ? ctx.order[i] : (i ? null : ctx.uid); loadImg(capyUrl(uid ? ctx.capyOf(uid, { face: 'happy' }) : { color: 'choco', acc: 'towel', face: 'wink' })).then(im => { sprites[i] = im; }); });
  const drawPips = () => { const n = chg[my()], ready = n >= SPK_N; pips.replaceChildren(h('small', null, ready ? '스파이크 준비 완료!' : `상대 진영으로 ${SPK_N - n}번 더 넘기면`), ...Array.from({ length: SPK_N }, (_, k) => h('i', { class: k < n ? 'on' : '' }))); spkBtn.classList.toggle('ready', ready); spkBtn.querySelector('small').textContent = ready ? '점프!' : `${n}/${SPK_N}`; };

  // 공을 쳤을 때: 스파이크 준비 + 버튼을 막 눌렀고 + 공중이면 스파이크, 아니면 기본 공격 1번 충전
  function onHit(i, p) {
    const mine = i === my(), cpu = mode === 'cpu' && i === 1;
    if (!mine && !cpu) return; // 온라인에서 상대가 친 건 상대 화면이 계산한다
    const armed = performance.now() - armAt[i] < ARM_MS || (mine && inp.s), air = p.y < standY - 40;
    if (chg[i] >= SPK_N && armed && air) { chg[i] = 0; armAt[i] = 0; flash = 10; shake = 14; spikeTxt = 50; sfx('hit'); setTimeout(() => sfx('pop'), 60); drawPips(); return 'spike'; }
    lastHit = i; // 충전은 공이 내 손을 떠나 상대 진영으로 넘어갔을 때 1회(tick에서 센다)
  }

  function setGame(v) { const fresh = !v || v.n !== game.n || v.phase !== game.phase || v.at !== game.at;
    if (v && v.phase === 'over' && game.phase === 'serve') { const won = (v.sc0 > v.sc1 ? 0 : 1) === my(); ctx.earnMatch(PAY.volley(won) * (mode === 'online' ? 1 : 0.6), '배구', [`${won ? '승리' : '패배'} = ${PAY.volley(won)}코인`, ...(mode === 'online' ? [] : [`컴퓨터전 60% = ${Math.round(PAY.volley(won) * 0.6)}코인`])], won ? 'win' : 'lose', 'volley', mode === 'online'); gameFx(won ? 'win' : 'lose', `${v.sc0} : ${v.sc1}`); } // 방금 끝났을 때만
    if (v && v.n === 1 && v.phase === 'serve' && game.n !== 1) { chg[0] = chg[1] = 0; drawPips(); }
    game = v || { sc0: 0, sc1: 0, serve: 0, phase: 'idle', at: 0, n: 0 }; if (fresh) placeBall(); }
  function newGame() { const v = { sc0: 0, sc1: 0, serve: 0, phase: 'serve', at: now(), n: (game.n || 0) + 1 }; chg[0] = chg[1] = 0; drawPips(); mode === 'online' ? ctx.store.set('games/volley', v) : setGame(v); ps[0].x = 200; ps[1].x = 600; }
  function point(loser) {
    sfx('point');
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
    offs.push(ctx.store.on('rt/volley/p' + opp, v => { if (!v) return; const lag = oppSeen ? 0 : 1; oppSeen = Date.now(); ghost = { x: v.x, y: v.y, vx: v.vx, vy: v.vy }; if (lag) Object.assign(ps[opp], ghost); chg[opp] = v.c || 0; }));
    offs.push(ctx.store.on('rt/volley/ball', v => {
      if (!v || v.side === ctx.idx || v.n !== game.n) return;
      const senderSide = (v.x < NETX ? 0 : 1) === v.side, mine = (ball.x < NETX ? 0 : 1) === ctx.idx;
      if ((!senderSide && mine) || deadMine) return;
      dead = false;
      if (v.sp && !ball.spike) { flash = 8; shake = 12; spikeTxt = 50; sfx('hit'); }
      Object.assign(ball, { x: v.x, y: v.y, vx: v.vx, vy: v.vy, spike: v.sp || 0 });
      const k = Math.max(0, Math.min(20, Math.round((ctx.store.now() - v.t) / 16.7)));
      for (let i = 0; i < k; i++) if (stepBall(ball, [])) { ball.y = GROUND - BR; break; }
    }));
  }
  function send(t) {
    if (mode !== 'online' || t - sendT < 40) return; sendT = t;
    const p = ps[ctx.idx], r = n => Math.round(n * 10) / 10;
    const pv = { x: r(p.x), y: r(p.y), vx: r(p.vx), vy: r(p.vy), c: chg[ctx.idx] }, key = JSON.stringify(pv);
    if (key !== lastP || t - lastPT > 1000) { lastP = key; lastPT = t; ctx.store.set('rt/volley/p' + ctx.idx, { ...pv, k: Math.round(t) }).catch(() => {}); }
    if (live() && (ball.x < NETX ? 0 : 1) === ctx.idx) ctx.store.set('rt/volley/ball', { x: r(ball.x), y: r(ball.y), vx: r(ball.vx), vy: r(ball.vy), sp: ball.spike || 0, side: ctx.idx, n: game.n, t: ctx.store.now() }).catch(() => {});
  }
  function ai(p) {
    const lv = ctx.streakLv('volley'); // 연승할수록 컴퓨터가 공을 더 정확히 따라가고 더 자주 뛴다
    if (Date.now() > aiT) { aiT = Date.now() + 900 - lv * 120; aiErr = (Math.random() - 0.5) * 130 * (1 - lv * 0.25); }
    const tx = ball.x > NETX - 20 ? ball.x + 20 + aiErr : 610, o = { l: p.x > tx + 8, r: p.x < tx - 8, j: false };
    o.j = ball.x > NETX && Math.abs(ball.x - p.x) < 70 && ball.y < p.y - 70 && ball.y > 170 && ball.vy > 0 && Math.random() < 0.15 + lv * 0.08;
    // 스파이크가 준비되면 네트 가까이에서 뛰어올라 내리꽂으려 한다
    if (chg[1] >= SPK_N && p.y < standY - 20 && ball.x > NETX && ball.x < NETX + 200 && Math.abs(ball.x - p.x) < 80 && Math.random() < 0.5 + lv * 0.1) armAt[1] = performance.now();
    return o;
  }
  function tick() {
    const me = my();
    stepPlayer(ps[me], me, inp);
    if (mode === 'online') { // 상대: 마지막으로 받은 상태를 물리로 계속 진행시킨 '유령'을 부드럽게 따라간다(받을 때마다 순간이동하면 뚝뚝 끊겨 보인다)
      const o = ps[1 - me]; if (ghost) { if (Date.now() - oppSeen > 300) ghost.vx = 0; stepPlayer(ghost, 1 - me, null); o.x += (ghost.x - o.x) * 0.3; o.y += (ghost.y - o.y) * 0.35; o.vx = ghost.vx; o.vy = ghost.vy; } }
    else stepPlayer(ps[1], 1, ai(ps[1]), CPU_SPEED * (1 + ctx.streakLv('volley') * 0.1));
    if (inp.j && ps[me].y >= standY - 1 && ps[me].vy < 0 && !ps[me].jf) sfx('jump'); ps[me].jf = ps[me].vy < 0;
    if (flash) flash--; if (shake) shake--; if (spikeTxt) spikeTxt--;
    if (!live()) return;
    const bx0 = ball.x, bvx = ball.vx, bvy = ball.vy, landed = stepBall(ball, ps, onHit);
    // 스파이크 충전: 내가 친 공이 네트를 넘어 상대 진영으로 가면 1회(스파이크로 넘긴 건 빼고)
    if (lastHit >= 0 && (bx0 < NETX) !== (ball.x < NETX) && (ball.x < NETX ? 1 : 0) === lastHit) { const i = lastHit; lastHit = -1; if (!ball.spike && chg[i] < SPK_N && (i === my() || (mode === 'cpu' && i === 1))) { chg[i]++; if (i === my()) { drawPips(); if (chg[i] === SPK_N) sfx('point'); } } }
    if (ball.spike) { trail.push([ball.x, ball.y]); if (trail.length > 10) trail.shift(); } else if (trail.length) trail.shift();
    if (Math.abs(ball.vx - bvx) > 1.2 || ball.vy - bvy < -2) sfx('pop'); // 공이 튕길 때
    if (landed) {
      ball.y = GROUND - BR; ball.vy = 0; ball.vx *= 0.5; if (ball.spike) shake = 10;
      const side = ball.x < NETX ? 0 : 1;
      if (mode === 'cpu' || side === ctx.idx) point(side); else dead = true;
    }
  }
  function draw() {
    const sx = shake ? (Math.random() - 0.5) * shake : 0, sy = shake ? (Math.random() - 0.5) * shake : 0;
    g.setTransform(1, 0, 0, 1, 0, 0); g.fillStyle = '#5DB9EE'; g.fillRect(0, 0, canvas.width, canvas.height);
    // 카메라: 공이 높이 뜨면 부드럽게 줌 아웃해서 공과 카피바라가 한 화면에 다 보이게, 내려오면 다시 줌 인
    if (ball.vy < 0 || !live()) camTop = Math.min(0, (ball.vy < 0 ? ball.y - ball.vy * ball.vy / (2 * GB) : ball.y) - BR - 50); // 올라가는 중이면 꼭대기 높이를 미리 계산
    const want = H / (H - Math.max(-SKY - 60, camTop)); camZ += (want - camZ) * 0.06;
    const K = VK * camZ, OX = canvas.width / 2 - NETX * K, OY = canvas.height - H * K;
    g.setTransform(K, 0, 0, K, OX + sx * K, OY + sy * K);
    // 배경은 화면 가로에 꽉 맞게 키우고, 그림 속 모래선(높이의 400/450)이 코트 바닥에 오도록 맞춘다(위아래는 잘려도 된다)
    if (bg.complete && bg.naturalWidth) { const bw = canvas.width / K + 12, bh = bw * H / W, bx = -OX / K - 6, by = GROUND - bh * GROUND / H; if (by > -OY / K) { g.fillStyle = '#5DB9EE'; g.fillRect(bx, -OY / K - 4, bw, by - (-OY / K) + 8); } g.drawImage(bg, bx, by, bw, bh); } else { g.fillStyle = '#9DD6F0'; g.fillRect(0, 0, W, H); g.fillStyle = '#E8C98F'; g.fillRect(0, GROUND, W, H - GROUND); }
    // 네트: 기둥 + 그물 + 흰 띠
    g.fillStyle = '#8A5E3B'; g.fillRect(NETX - 4, NETTOP - 6, 8, GROUND - NETTOP + 6);
    g.strokeStyle = 'rgba(255,255,255,.75)'; g.lineWidth = 1.2; for (let y = NETTOP + 10; y < GROUND - 6; y += 12) { g.beginPath(); g.moveTo(NETX - NETW / 2, y); g.lineTo(NETX + NETW / 2, y); g.stroke(); }
    g.fillStyle = '#fff'; g.beginPath(); g.roundRect(NETX - NETW / 2 - 3, NETTOP - 4, NETW + 6, 10, 4); g.fill(); g.fillStyle = '#E8453C'; g.beginPath(); g.arc(NETX, NETTOP - 8, 6, 0, 7); g.fill();
    g.fillStyle = 'rgba(0,0,0,.14)';
    for (const p of ps) { g.beginPath(); g.ellipse(p.x, GROUND + 3, 34 * (1 - Math.min(.5, (standY - p.y) / 300)), 7, 0, 0, 7); g.fill(); }
    g.beginPath(); g.ellipse(ball.x, GROUND + 3, 20, 5, 0, 0, 7); g.fill();
    ps.forEach((p, i) => { const im = sprites[i];
      if (chg[i] >= SPK_N) { g.save(); g.globalAlpha = .45 + Math.sin(performance.now() / 120) * .2; const gr = g.createRadialGradient(p.x, p.y + 10, 10, p.x, p.y + 10, 70); gr.addColorStop(0, '#FFE066'); gr.addColorStop(1, 'rgba(255,224,102,0)'); g.fillStyle = gr; g.beginPath(); g.arc(p.x, p.y + 10, 70, 0, 7); g.fill(); g.restore(); }
      if (im) { if (i === 1) { g.save(); g.translate(p.x, 0); g.scale(-1, 1); g.drawImage(im, -50, p.y - 59, 100, 131.7); g.restore(); } else g.drawImage(im, p.x - 50, p.y - 59, 100, 131.7); } else { g.fillStyle = '#BC8C60'; g.beginPath(); g.arc(p.x, p.y, PR, 0, 7); g.fill(); } });
    // 스파이크 꼬리
    trail.forEach(([x, y], k) => { g.globalAlpha = (k + 1) / trail.length * 0.5; g.fillStyle = '#FF8A00'; g.beginPath(); g.arc(x, y, BR * (0.4 + k / trail.length * 0.6), 0, 7); g.fill(); }); g.globalAlpha = 1;
    { g.save(); g.translate(ball.x, ball.y); g.rotate(ball.rot); const im = yz.complete && yz.naturalWidth ? yz : yz0; if (im.complete && im.naturalWidth) g.drawImage(im, -BR - 3, -BR - 3, BR * 2 + 6, BR * 2 + 6); else { g.fillStyle = '#FFC93C'; g.beginPath(); g.arc(0, 0, BR, 0, 7); g.fill(); } g.restore(); }
    if (flash) { g.fillStyle = `rgba(255,255,255,${flash / 14})`; g.fillRect(-W * 2, -H * 3, W * 5, H * 5); }
    g.setTransform(VK, 0, 0, VK, VX, VY);
    // 점수판
    g.font = '700 40px Jua, sans-serif'; g.textAlign = 'center'; g.lineWidth = 6; g.strokeStyle = '#fff';
    [[game.sc0, NETX - 70, '#E8453C'], [game.sc1, NETX + 70, '#2B8FD6']].forEach(([v, x, c]) => { g.strokeText(v, x, 50); g.fillStyle = c; g.fillText(v, x, 50); });
    if (spikeTxt) { const k = Math.min(1, (50 - spikeTxt) / 8); g.save(); g.translate(NETX, 140); g.scale(.6 + k * .5, .6 + k * .5); g.font = '900 56px Jua, sans-serif'; g.lineWidth = 10; g.strokeStyle = '#7A2E00'; g.strokeText('스파이크!!', 0, 0); g.fillStyle = '#FFD23F'; g.fillText('스파이크!!', 0, 0); g.restore(); }
    let msg = '';
    if (game.phase === 'idle') msg = '';
    else if (game.phase === 'over') msg = (game.sc0 > game.sc1 ? 0 : 1) === my() ? '이겼다!' : mode === 'cpu' ? '컴퓨터 승리' : '졌다…';
    else if (!live() && !dead) msg = game.serve === my() ? '내 서브' : '상대 서브';
    if (msg) { g.font = '700 32px Jua, sans-serif'; g.fillStyle = 'rgba(255,255,255,.88)'; const w = g.measureText(msg).width + 48; g.beginPath(); g.roundRect(NETX - w / 2, 80, w, 56, 28); g.fill(); g.fillStyle = '#5F3F2B'; g.fillText(msg, NETX, 119); }
  }
  function loop(t) {
    if (!alive) return; raf = requestAnimationFrame(loop);
    acc += Math.min(100, t - (lastT || t)); lastT = t;
    while (acc >= 16.67) { tick(); acc -= 16.67; }
    send(t); draw();
    const showStart = game.phase !== 'serve'; if (newBtn.hidden === showStart) { newBtn.hidden = !showStart; newBtn.firstChild.textContent = game.phase === 'over' ? '▶ 한 판 더' : '▶ 시작'; }
    const pm = ps[my()], go = chg[my()] >= SPK_N && pm.y < standY - 40 && live(); if (go !== spkBtn.classList.contains('now')) spkBtn.classList.toggle('now', go); // 스파이크 준비된 채 점프하면 '눌러!'
    const here = mode !== 'online' || Date.now() - oppSeen < 3000;
    const txt = mode === 'cpu' ? '컴퓨터와 연습 중' : here ? `${josa(ctx.nameOf(ctx.order[1 - ctx.idx]), '와', '과')} 대결 · 나는 ${ctx.idx ? '오른쪽' : '왼쪽'}` : `${josa(ctx.nameOf(ctx.order[1 - ctx.idx]), '가', '이')} 들어오길 기다리는 중…`;
    if (info.textContent !== txt) info.textContent = txt;
  }
  function setMode(m) {
    mode = m; modeBtn.textContent = m === 'online' ? '컴퓨터와 연습' : '둘이 하기'; modeBtn.hidden = ctx.order.length < 2;
    ps[0].x = 200; ps[1].x = 600; chg[0] = chg[1] = 0; ghost = null; oppSeen = 0; drawPips(); setGame(null); loadSprites(); connect();
  }
  modeBtn.onclick = () => setMode(mode === 'online' ? 'cpu' : 'online');
  newBtn.onclick = newGame;
  setMode(mode); raf = requestAnimationFrame(loop);
  return () => { alive = false; cancelAnimationFrame(raf); offs.forEach(f => f()); removeEventListener('keydown', kd); removeEventListener('keyup', ku); removeEventListener('resize', fit); document.body.classList.remove('vb-on'); if (document.fullscreenElement && document.exitFullscreen) document.exitFullscreen().catch(() => {}); try { screen.orientation && screen.orientation.unlock && screen.orientation.unlock(); } catch {} if (mode === 'online') ctx.store.remove('rt/volley/p' + ctx.idx).catch(() => {}); };
}
