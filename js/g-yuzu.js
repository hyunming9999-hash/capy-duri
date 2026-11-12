// 유자 받기 — 30초 동안 떨어지는 유자를 받는 점수 대결 (각자 하고 최고 기록을 겨룸)
import { h, loadImg, ymd } from './ui.js';
import { capyUrl, yuzuUrl } from './capy.js';

const W = 360, H = 460, TIME = 30;

export function mount(el, ctx) {
  let alive = true, raf = 0, best = {}, st = 'idle', score = 0, left = TIME, items = [], px = W / 2, tx = W / 2, lastT = 0, spawn = 0, pops = [], hurt = 0;
  const canvas = h('canvas', { class: 'yuzu-game', width: W, height: H }), g = canvas.getContext('2d');
  const board = h('div', { class: 'g-status' });
  const btn = h('button', { class: 'btn primary big', onClick: start }, '시작');
  el.append(board, canvas, h('div', { class: 'center' }, btn), h('p', { class: 'dim center' }, '화면을 끌거나 ← → 로 움직여요. 유자 +1, 큰 유자 +3, 돌멩이 −2'));
  let me = null, sad = null; const yz = new Image(); yz.src = yuzuUrl;
  loadImg(capyUrl(ctx.capyOf(ctx.uid, { face: 'happy' }))).then(i => { me = i; });
  loadImg(capyUrl(ctx.capyOf(ctx.uid, { face: 'sad' }))).then(i => { sad = i; });

  const keys = { l: false, r: false };
  const kd = e => { if (e.key === 'ArrowLeft') { keys.l = true; e.preventDefault(); } if (e.key === 'ArrowRight') { keys.r = true; e.preventDefault(); } };
  const ku = e => { if (e.key === 'ArrowLeft') keys.l = false; if (e.key === 'ArrowRight') keys.r = false; };
  window.addEventListener('keydown', kd); window.addEventListener('keyup', ku);
  const ptr = e => { if (e.buttons || e.pointerType === 'touch') { const r = canvas.getBoundingClientRect(); tx = (e.clientX - r.left) / r.width * W; } };
  canvas.addEventListener('pointerdown', ptr); canvas.addEventListener('pointermove', ptr);

  function drawBoard() {
    const t = ymd();
    board.replaceChildren(...ctx.order.map(u => { const b = best[u]; return h('span', { class: 'rec' }, ctx.nameOf(u), ' 최고 ', h('b', null, b ? b.s : '-'), b && b.d === t ? ' (오늘)' : ''); }));
  }
  function start() { st = 'play'; score = 0; left = TIME; items = []; pops = []; spawn = 0; btn.hidden = true; }
  function end() {
    st = 'over'; btn.hidden = false; btn.textContent = '다시 하기';
    const b = best[ctx.uid];
    if (!b || score > b.s) ctx.store.set('games/yuzu/best/' + ctx.uid, { s: score, d: ymd(), ts: ctx.store.now() }).catch(() => {});
  }
  function loop(t) {
    if (!alive) return; raf = requestAnimationFrame(loop);
    const dt = Math.min(0.05, (t - (lastT || t)) / 1000); lastT = t;
    if (keys.l) tx = px - 40; if (keys.r) tx = px + 40;
    tx = Math.max(34, Math.min(W - 34, tx)); px += (tx - px) * Math.min(1, dt * 14);
    if (st === 'play') {
      left -= dt; spawn -= dt; hurt = Math.max(0, hurt - dt);
      if (spawn <= 0) { const prog = 1 - left / TIME, r = Math.random(); spawn = 0.62 - prog * 0.3; items.push({ x: 26 + Math.random() * (W - 52), y: -30, v: 150 + prog * 150 + Math.random() * 60, k: r < 0.2 ? 'rock' : r < 0.3 ? 'big' : 'yz', rot: Math.random() * 6 }); }
      for (const it of items) {
        it.y += it.v * dt; it.rot += dt * 2;
        const rr = it.k === 'big' ? 26 : 18;
        if (!it.hit && Math.abs(it.x - px) < 34 + rr * 0.6 && it.y > H - 118 - rr && it.y < H - 60) { it.hit = true; const d = it.k === 'rock' ? -2 : it.k === 'big' ? 3 : 1; score = Math.max(0, score + d); if (d < 0) hurt = 0.5; pops.push({ x: it.x, y: H - 130, t: 0.7, s: (d > 0 ? '+' : '') + d, c: d > 0 ? '#E08A00' : '#777' }); }
      }
      items = items.filter(it => !it.hit && it.y < H + 40);
      if (left <= 0) { left = 0; end(); }
    }
    const bg = g.createLinearGradient(0, 0, 0, H); bg.addColorStop(0, '#CDEBB5'); bg.addColorStop(1, '#FFF3D6'); g.fillStyle = bg; g.fillRect(0, 0, W, H);
    g.fillStyle = '#9BD0C7'; g.beginPath(); g.ellipse(W / 2, H - 14, W * 0.62, 40, 0, 0, 7); g.fill();
    for (const it of items) {
      g.save(); g.translate(it.x, it.y); g.rotate(it.rot);
      if (it.k === 'rock') { g.fillStyle = '#8D8D93'; g.beginPath(); g.ellipse(0, 0, 18, 15, 0, 0, 7); g.fill(); g.fillStyle = '#A9A9B0'; g.beginPath(); g.ellipse(-5, -5, 7, 4, 0, 0, 7); g.fill(); }
      else { const s = it.k === 'big' ? 56 : 38; if (yz.complete && yz.naturalWidth) g.drawImage(yz, -s / 2, -s / 2, s, s); }
      g.restore();
    }
    const im = hurt > 0 || (st === 'over' && score === 0) ? sad : me;
    if (im) g.drawImage(im, px - 40, H - 128, 80, 105);
    g.textAlign = 'center'; g.font = '700 20px Jua, sans-serif';
    pops = pops.filter(p => (p.t -= dt) > 0); for (const p of pops) { g.globalAlpha = Math.min(1, p.t * 2); g.fillStyle = p.c; g.fillText(p.s, p.x, p.y - (0.7 - p.t) * 40); } g.globalAlpha = 1;
    g.fillStyle = '#5F3F2B'; g.font = '700 26px Jua, sans-serif'; g.textAlign = 'left'; g.fillText('🍊 ' + score, 14, 34); g.textAlign = 'right'; g.fillText(Math.ceil(left) + '초', W - 14, 34);
    if (st !== 'play') { g.textAlign = 'center'; g.fillStyle = 'rgba(255,255,255,.88)'; g.beginPath(); g.roundRect(50, 150, W - 100, 96, 24); g.fill(); g.fillStyle = '#5F3F2B'; g.font = '700 28px Jua, sans-serif'; g.fillText(st === 'over' ? `${score}점!` : '유자 받기', W / 2, 192); g.font = '16px Jua, sans-serif'; g.fillText(st === 'over' ? (best[ctx.uid] && score >= best[ctx.uid].s && score > 0 ? '내 최고 기록!' : '다시 도전해 봐요') : '30초 동안 많이 받기', W / 2, 224); }
  }
  const off = ctx.store.on('games/yuzu/best', v => { best = v || {}; drawBoard(); });
  drawBoard(); raf = requestAnimationFrame(loop);
  return () => { alive = false; cancelAnimationFrame(raf); off(); window.removeEventListener('keydown', kd); window.removeEventListener('keyup', ku); };
}
