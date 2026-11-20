// 인형뽑기 — 집게를 좌우로 옮겨 내려서 동물 인형을 뽑는다. 인형끼리는 물리로 밀리고 쌓인다
// 일곱 번을 한 묶음으로, 그중 무작위 한 번은 집게가 꽉 잡는다(반드시 한 번). 나머지는 힘이 약해 올리다 놓친다
// 뽑은 인형은 가방(bag/<uid>/dolls)에 모인다: 친목회에서 동물에게 선물하거나 가슴에 배지로 단다
import { h, toast, modal, loadImg, gameFx } from './ui.js';
import { sfx } from './sound.js';
import { ANIMALS, animalSvg } from './animals.js';
import { FLUFFY } from './fluffy.js';
import { hasCredit, needCoin } from './arcade.js';

const W = 320, H = 340, FLOOR = H - 8, CHUTE = 74, DIV_TOP = H - 84, RAIL = 16, REST = 44, N_DOLL = 10, G = 1500, PACK = 7;
const dollSrc = i => (FLUFFY ? `img/fl/a${i}-base.webp` : 'data:image/svg+xml;utf8,' + encodeURIComponent(animalSvg(i, true)));
export const dollImg = i => `<img src="${dollSrc(i)}" alt="" loading="lazy">`;

export function mount(el, ctx) {
  let alive = true, raf = 0, lastT = 0, dolls = [], imgs = {}, mine = {}, pity = null, busy = false, dir = 0, lucky = false, held = null, slip = null, startX = 200, target = null, shake = 0;
  const claw = { x: 200, y: REST, open: 1, st: 'idle', t: 0 };
  const me = { id: 'claw', title: '인형뽑기', face: 'wow', acc: 'ribbon' };
  const canvas = h('canvas', { class: 'claw-cv', width: W * 2, height: H * 2 }), g = canvas.getContext('2d');
  const tries = h('small', { class: 'claw-try' }), shelf = h('div', { class: 'claw-shelf' });
  const hold = d => ({ onPointerDown: e => { e.preventDefault(); dir = d; }, onPointerUp: () => { dir = 0; }, onPointerLeave: () => { dir = 0; }, onPointerCancel: () => { dir = 0; } });
  const bL = h('button', { class: 'claw-arrow', 'aria-label': '왼쪽', ...hold(-1) }, '◀'), bR = h('button', { class: 'claw-arrow', 'aria-label': '오른쪽', ...hold(1) }, '▶');
  const bGo = h('button', { class: 'claw-go', onClick: () => drop() }, '잡기');
  el.append(h('div', { class: 'claw' },
    h('div', { class: 'claw-top' }, h('b', null, '인형뽑기'), tries),
    h('div', { class: 'claw-box' }, canvas, h('i', { class: 'claw-out' }, '⬇ 나오는 곳')),
    h('div', { class: 'claw-pad' }, bL, bR, bGo)),
    h('p', { class: 'dim center claw-tip' }, '◀ ▶ 로 집게를 옮기고 잡기를 눌러요. 한 번에 50코인'),
    h('b', { class: 'claw-h' }, '🧸 내가 뽑은 인형'), shelf);

  const rnd = (a, b) => a + Math.random() * (b - a);
  const img = i => { if (!imgs[i]) { imgs[i] = { im: null }; loadImg(dollSrc(i)).then(im => { imgs[i].im = im; }).catch(() => {}); } return imgs[i].im; };
  const spawnDoll = (x, y) => { const i = Math.floor(Math.random() * ANIMALS.length); img(i); dolls.push({ i, x: x == null ? rnd(CHUTE + 40, W - 34) : x, y: y == null ? rnd(-140, 20) : y, vx: rnd(-20, 20), vy: 0, r: rnd(23, 26.5), a: rnd(-0.3, 0.3), va: 0 }); };
  for (let k = 0; k < N_DOLL; k++) spawnDoll(CHUTE + 34 + (k % 5) * 44 + rnd(-6, 6), 120 + Math.floor(k / 5) * 70 + rnd(-10, 10));

  // 가방의 인형·보장 묶음 상태
  const P = 'bag/' + ctx.uid;
  const offs = [ctx.store.on(P + '/dolls', v => { mine = v || {}; drawShelf(); }), ctx.store.on(P + '/claw', v => { pity = v && typeof v.n === 'number' ? v : null; drawTries(); })];
  const drawTries = () => { tries.textContent = '한 번 50코인'; }; // 확률(묶음 몇 번째인지)은 화면에 보이지 않는다
  const myDoll = () => (ctx.members[ctx.uid] || {}).doll;
  const wear = async i => { ctx.members[ctx.uid] = { ...(ctx.members[ctx.uid] || {}), doll: i }; await ctx.store.update('members/' + ctx.uid, { doll: i }).catch(() => {}); drawShelf(); toast(i == null ? '인형 배지를 뗐어요' : `${ANIMALS[i].name} 인형을 가슴에 달았어요`); };
  function drawShelf() { const list = Object.entries(mine).filter(([k, n]) => n > 0 && ANIMALS[k]).map(([k, n]) => [+k, n]), on = myDoll();
    shelf.replaceChildren(...(list.length ? list.map(([i, n]) => h('button', { class: 'claw-my' + (on === i ? ' on' : ''), onClick: () => { const c = modal({ title: `🧸 ${ANIMALS[i].name} 인형 ${n}개`, body: h('div', { class: 'claw-info' }, h('span', { html: dollImg(i) }), h('p', null, '친목회에서 동물에게 🎁 선물로 줄 수 있어요(친밀도 +6, 그 동물 본인 인형이면 +12). 가슴에 배지로 달 수도 있어요.')), actions: [{ label: '닫기' }, { label: on === i ? '배지 떼기' : '🎀 가슴에 달기', primary: true, onClick: x => { x(); wear(on === i ? null : i); } }] }); } },
      h('span', { html: dollImg(i) }), h('small', null, on === i ? '착용 중' : `${ANIMALS[i].name} ×${n}`))) : [h('p', { class: 'dim center' }, '아직 없어요. 집게로 뽑아 보세요!')])); }
  drawShelf(); drawTries();

  // ---- 물리: 인형은 원. 인형끼리·벽·칸막이·집게와 부딪힌다
  const fixed = []; // 이번 스텝의 움직이지 않는 원(집게 발·잡힌 인형)
  function step(dt) {
    for (const d of dolls) { if (d === held) continue; d.vy += G * dt; d.x += d.vx * dt; d.y += d.vy * dt; d.a += d.va * dt; }
    for (let it = 0; it < 3; it++) {
      for (let a = 0; a < dolls.length; a++) { const p = dolls[a];
        for (let b = a + 1; b < dolls.length; b++) { const q = dolls[b]; hit(p, q, p === held ? 0 : 1, q === held ? 0 : 1); }
        if (p === held) continue;
        for (const f of fixed) hit(p, f, 1, 0);
        // 벽·바닥
        if (p.x > W - p.r) { p.x = W - p.r; if (p.vx > 0) p.vx *= -0.2; }
        if (p.x < p.r) { p.x = p.r; if (p.vx < 0) p.vx *= -0.2; }
        if (p.x > CHUTE && p.y > FLOOR - p.r) { p.y = FLOOR - p.r; if (p.vy > 0) p.vy *= -0.12; p.vx *= 0.9; p.va = p.va * 0.85 + (p.vx / p.r) * 0.15; } // 나오는 곳(왼쪽 칸)에는 바닥이 없다
        // 칸막이(나오는 곳과 인형 더미 사이의 세로 벽): 선분과 원
        { const cy = Math.max(DIV_TOP, Math.min(FLOOR, p.y)), dx = p.x - CHUTE, dy = p.y - cy, dd = Math.hypot(dx, dy), min = p.r + 3;
          if (dd < min && dd > 0.001) { const nx = dx / dd, ny = dy / dd, pen = min - dd; p.x += nx * pen; p.y += ny * pen; const vn = p.vx * nx + p.vy * ny; if (vn < 0) { p.vx -= 1.15 * vn * nx; p.vy -= 1.15 * vn * ny; } } }
      } }
    for (const d of dolls) { d.vx *= 0.992; d.va *= 0.97; }
  }
  function hit(p, q, mp, mq) { const dx = q.x - p.x, dy = q.y - p.y, min = p.r + q.r, d2 = dx * dx + dy * dy; if (d2 >= min * min || d2 < 0.0001) return; const d = Math.sqrt(d2), nx = dx / d, ny = dy / d, pen = (min - d) * 0.6, tot = mp + mq; if (!tot) return;
    p.x -= nx * pen * (mp / tot); p.y -= ny * pen * (mp / tot); if (mq) { q.x += nx * pen * (mq / tot); q.y += ny * pen * (mq / tot); }
    const rvx = (q.vx || 0) - (p.vx || 0), rvy = (q.vy || 0) - (p.vy || 0), vn = rvx * nx + rvy * ny; if (vn >= 0) return;
    const j = -(1.12) * vn / tot, tx = -ny, ty = nx, vt = rvx * tx + rvy * ty;
    if (mp) { p.vx -= j * mp * nx - vt * 0.04 * tx; p.vy -= j * mp * ny - vt * 0.04 * ty; p.va -= vt * 0.004; }
    if (mq) { q.vx += j * mq * nx - vt * 0.04 * tx; q.vy += j * mq * ny - vt * 0.04 * ty; q.va += vt * 0.004; } }

  // ---- 집게
  const gap = () => 9 + 19 * claw.open; // 두 발 사이 반 너비
  const under = () => { let best = null, bd = 1e9; for (const d of dolls) { const dd = Math.hypot(d.x - claw.x, d.y - (claw.y + 8)); if (dd < bd) { bd = dd; best = d; } } return [best, bd]; };
  async function drop() {
    if (busy || claw.st !== 'idle') return;
    if (!hasCredit()) return needCoin(ctx, me);
    busy = true; dir = 0; startX = claw.x; bGo.disabled = true;
    // 일곱 번 묶음: 새 묶음이면 꽉 잡는 차례(k)를 무작위로 정한다
    let p = pity && pity.n < PACK ? { ...pity } : { n: 0, k: Math.floor(Math.random() * PACK) };
    lucky = p.n === p.k; p.n += 1; pity = p; drawTries(); claw._p = p;
    ctx.store.set(P + '/claw', p).catch(() => {});
    claw.st = 'down'; sfx('tock');
  }
  function moveClaw(dt) {
    const c = claw; fixed.length = 0;
    if (c.st === 'idle') { c.x = Math.max(CHUTE + 22, Math.min(W - 22, c.x + dir * 150 * dt)); return; }
    const tip = c.y + 22;
    if (c.st === 'down') { c.y += 190 * dt; const [d, dd] = under(); if ((d && dd < d.r + 5) || tip >= FLOOR - 2) { c.st = 'close'; c.t = 0; target = null;
        if (lucky) { if (d && dd < 95) target = d; } else if (d && Math.abs(d.x - c.x) < d.r * 0.62 && d.y - c.y > 0 && dd < d.r + 16) target = d; } }
    else if (c.st === 'close') { c.t += dt; c.open = Math.max(0, 1 - c.t / 0.4); if (target && lucky) c.x += (target.x - c.x) * Math.min(1, dt * 9);
      if (c.t >= 0.5) { if (target) { held = target; sfx('pair'); // 약한 손: 올리다가(또는 옮기다가) 놓친다. 위에 인형이 얹혀 있으면 더 빨리 놓친다
            if (!lucky) { const load = dolls.filter(o => o !== held && o.y < held.y - 4 && Math.hypot(o.x - held.x, o.y - held.y) < o.r + held.r + 3).length, far = Math.random() < 0.25 && !load && c.x > CHUTE + held.r + 70;
              slip = far ? { x: Math.max(CHUTE + held.r + 14, c.x - (c.x - 36) * rnd(0.25, 0.6)) } : { y: REST + (c.y - REST) * (load ? rnd(0.7, 0.92) : rnd(0.2, 0.8)) }; } else slip = null; }
          else if (lucky && claw._p) { const p = { ...claw._p, n: claw._p.n - 1 }; pity = p; drawTries(); ctx.store.set(P + '/claw', p).catch(() => {}); } // 꽉 잡는 차례인데 닿은 인형이 없으면 그 차례를 다음으로 넘긴다
          c.st = 'up'; } }
    else if (c.st === 'up') { c.y -= 150 * dt; if (held && slip && slip.y != null && c.y <= slip.y) letGo(false); if (c.y <= REST) { c.y = REST; c.st = held ? 'carry' : 'back'; } }
    else if (c.st === 'carry') { c.x -= 130 * dt; if (held && slip && slip.x != null && c.x <= slip.x) { letGo(false); c.st = 'back'; } else if (c.x <= 38) { c.x = 38; c.st = 'release'; c.t = 0; } }
    else if (c.st === 'release') { c.t += dt; c.open = Math.min(1, c.t / 0.25); if (held && c.t > 0.12) letGo(true); if (c.t > 0.7) c.st = 'back'; }
    else if (c.st === 'back') { c.open = Math.min(1, c.open + dt * 3); const dx = startX - c.x; c.x += Math.sign(dx) * Math.min(Math.abs(dx), 170 * dt); if (Math.abs(dx) < 1 && c.open >= 1) { c.st = 'idle'; done(); } }
    if (held) { held.x = c.x; held.y = c.y + 12 + held.r * 0.78; held.vx = 0; held.vy = 0; held.va = 0; held.a *= 0.9; }
    // 집게 발: 내려가거나 오므릴 때 주변 인형을 밀어낸다
    if (c.st === 'down' || c.st === 'close' || (c.st === 'up' && !held)) { const gp = gap(); fixed.push({ x: c.x - gp, y: c.y + 18, r: 5 }, { x: c.x + gp, y: c.y + 18, r: 5 }); }
  }
  let won = null;
  function letGo(win) { const d = held; held = null; slip = null; if (!d) return; d.vx = win ? -10 : rnd(-40, 40); d.vy = 0; d.va = rnd(-2, 2); if (win) won = d; else { sfx('bad'); shake = 0.25; } }
  function done() { busy = false; bGo.disabled = false; lucky = false; target = null; ctx.useCredit && ctx.useCredit(); }
  function prize(d) { dolls.splice(dolls.indexOf(d), 1); won = null; const i = d.i; sfx('win'); gameFx('win', `${ANIMALS[i].name} 인형`);
    ctx.store.tx(`${P}/dolls/${i}`, c => (c || 0) + 1).catch(() => {}); setTimeout(() => alive && spawnDoll(), 900); }

  function draw() {
    g.setTransform(2, 0, 0, 2, 0, 0); g.clearRect(0, 0, W, H);
    const bg = g.createLinearGradient(0, 0, 0, H); bg.addColorStop(0, '#2B1B5C'); bg.addColorStop(1, '#4A2A8A'); g.fillStyle = bg; g.fillRect(0, 0, W, H);
    g.fillStyle = 'rgba(120,220,255,.08)'; for (let k = 0; k < 7; k++) g.fillRect(k * 52 - 10, 0, 18, H);
    // 바닥·나오는 곳·칸막이
    g.fillStyle = '#7B5CD6'; g.fillRect(CHUTE, FLOOR, W - CHUTE, H - FLOOR); g.fillStyle = '#120A2B'; g.fillRect(0, DIV_TOP + 26, CHUTE - 3, H); g.fillStyle = '#FF6BD6'; g.fillRect(CHUTE - 3, DIV_TOP, 6, H - DIV_TOP);
    g.strokeStyle = '#35E0FF'; g.lineWidth = 2; g.strokeRect(3, DIV_TOP + 26, CHUTE - 9, H - DIV_TOP - 30);
    // 인형
    for (const d of dolls) { const im = img(d.i); g.save(); g.translate(d.x + (d === held ? 0 : 0), d.y); g.rotate(d.a);
      if (im) { const s = d.r * 2.5 / 262, w = im.width * s * (262 / (FLUFFY ? 262 : im.height)), hh = im.height * s * (262 / (FLUFFY ? 262 : im.height)); g.drawImage(im, -w / 2, -hh * (FLUFFY ? 0.62 : 0.5), w, hh); } else { g.fillStyle = '#F6C98A'; g.beginPath(); g.arc(0, 0, d.r, 0, 7); g.fill(); }
      g.restore(); }
    // 레일·집게
    const c = claw, sx = shake > 0 ? Math.sin(performance.now() / 18) * 2 : 0;
    g.fillStyle = '#B9C4E8'; g.fillRect(0, RAIL - 4, W, 7); g.fillStyle = '#8E9BD0'; g.fillRect(c.x - 15 + sx, RAIL - 8, 30, 14);
    g.strokeStyle = '#D5DCF5'; g.lineWidth = 3; g.beginPath(); g.moveTo(c.x + sx, RAIL + 4); g.lineTo(c.x + sx, c.y - 6); g.stroke();
    g.fillStyle = '#E9EDFB'; g.beginPath(); g.arc(c.x + sx, c.y - 2, 9, 0, 7); g.fill(); g.fillStyle = '#35E0FF'; g.beginPath(); g.arc(c.x + sx, c.y - 2, 3.5, 0, 7); g.fill();
    const gp = gap(); g.strokeStyle = '#E9EDFB'; g.lineWidth = 5; g.lineCap = 'round'; g.lineJoin = 'round';
    for (const s of [-1, 1]) { g.beginPath(); g.moveTo(c.x + sx + s * 5, c.y + 2); g.quadraticCurveTo(c.x + sx + s * (gp + 12), c.y + 6, c.x + sx + s * gp, c.y + 22); g.stroke(); }
    // 유리 반짝임
    g.fillStyle = 'rgba(255,255,255,.07)'; g.beginPath(); g.moveTo(18, 0); g.lineTo(70, 0); g.lineTo(20, H); g.lineTo(-30, H); g.fill();
  }
  function frame(t) { if (!alive) return; const dt = Math.min(0.033, (t - (lastT || t)) / 1000); lastT = t; shake = Math.max(0, shake - dt);
    for (let k = 0; k < 4; k++) { moveClaw(dt / 4); step(dt / 4); }
    for (const d of [...dolls]) { if (d.y > H + 40) { if (d.x < CHUTE + 6) prize(d); else { d.y = -40; d.vy = 0; d.x = rnd(CHUTE + 40, W - 34); } } }
    draw(); raf = requestAnimationFrame(frame); }
  raf = requestAnimationFrame(frame);
  const key = e => { if (e.repeat) return; const dn = e.type === 'keydown'; if (e.key === 'ArrowLeft') dir = dn ? -1 : dir === -1 ? 0 : dir; else if (e.key === 'ArrowRight') dir = dn ? 1 : dir === 1 ? 0 : dir; else if (dn && (e.key === ' ' || e.key === 'Enter' || e.key === 'ArrowDown')) { e.preventDefault(); drop(); } };
  addEventListener('keydown', key); addEventListener('keyup', key);
  if (new URLSearchParams(location.search).get('mock')) window.__claw = { claw, dolls, drop, setPity: p => { pity = p; }, state: () => ({ st: claw.st, lucky, pity, n: dolls.length, mine }) };
  return () => { alive = false; cancelAnimationFrame(raf); removeEventListener('keydown', key); removeEventListener('keyup', key); offs.forEach(f => f && f()); };
}
