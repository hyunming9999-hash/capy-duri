// 카피 테트리스 — 기록(혼자 최고 점수) · 경쟁(같은 블록, 여러 줄을 지우면 상대에게 방해 줄)
import { h, toast, modal, gameFx } from './ui.js';
import { sfx } from './sound.js';
import { PAY, TETRIS_PAY } from './money.js';

const W = 10, H = 20, PATH = 'games/tetris';
// 블록 모양(정사각 행렬)과 색. 색은 동물 손님들 털색에서 가져왔다
const SHAPES = {
  I: [[0, 0, 0, 0], [1, 1, 1, 1], [0, 0, 0, 0], [0, 0, 0, 0]], O: [[1, 1], [1, 1]], T: [[0, 1, 0], [1, 1, 1], [0, 0, 0]],
  S: [[0, 1, 1], [1, 1, 0], [0, 0, 0]], Z: [[1, 1, 0], [0, 1, 1], [0, 0, 0]], J: [[1, 0, 0], [1, 1, 1], [0, 0, 0]], L: [[0, 0, 1], [1, 1, 1], [0, 0, 0]],
};
const KINDS = Object.keys(SHAPES);
const COLOR = { I: '#8FCB5C', O: '#FFE06B', T: '#E88BB0', S: '#F6B66A', Z: '#F08A3C', J: '#8E97A6', L: '#C9A27A', G: '#B9B2A6' };
const LEVELS = { e: { name: '하', sub: '느긋하게', ms: 850, junk: 0 }, m: { name: '중', sub: '보통 빠르기', ms: 520, junk: 0 }, h: { name: '상', sub: '빠르고 바닥에 방해 줄', ms: 300, junk: 4 } };
const LINE_PTS = [0, 100, 300, 500, 800], ATTACK = [0, 0, 1, 2, 4]; // 한 번에 지운 줄 수 → 점수, 상대에게 보내는 방해 줄
const rot = m => m[0].map((_, c) => m.map(r => r[c]).reverse());
function rng(a) { return () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }

// 판 하나의 규칙(화면과 상관없이 돌아간다)
export function makeGame(seed, diff) {
  const r = rng(seed), LV = LEVELS[diff], g = { board: Array.from({ length: H }, () => new Array(W).fill(0)), score: 0, lines: 0, level: 1, over: false, cur: null, next: [], hold: null, held: false, sent: 0, combo: 0 };
  let bag = [];
  const draw7 = () => { if (!bag.length) { bag = KINDS.slice(); for (let i = bag.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [bag[i], bag[j]] = [bag[j], bag[i]]; } } return bag.pop(); };
  const fits = (m, x, y) => m.every((row, dy) => row.every((v, dx) => !v || (x + dx >= 0 && x + dx < W && y + dy < H && (y + dy < 0 || !g.board[y + dy][x + dx]))));
  const junkRow = hole => { const row = new Array(W).fill('G'); row[hole] = 0; return row; };
  for (let i = 0; i < LV.junk; i++) { g.board.shift(); g.board.push(junkRow(Math.floor(r() * W))); }
  function spawn(k) { const m = SHAPES[k].map(x => x.slice()); g.cur = { k, m, x: Math.floor((W - m[0].length) / 2), y: k === 'I' ? -1 : 0 }; if (!fits(m, g.cur.x, g.cur.y)) g.over = true; }
  while (g.next.length < 3) g.next.push(draw7());
  const take = () => { const k = g.next.shift(); g.next.push(draw7()); return k; };
  spawn(take());
  // 진행될수록 조금씩 빨라진다: 지운 줄 수만큼(10줄에 14%) + 버틴 시간만큼(30초에 4%)
  g.t = 0; g.speed = () => Math.max(70, LV.ms * Math.pow(0.86, g.lines / 10) * Math.pow(0.96, g.t / 30000));
  g.move = dx => { if (g.over || !fits(g.cur.m, g.cur.x + dx, g.cur.y)) return false; g.cur.x += dx; return true; };
  g.rotate = () => { if (g.over) return false; const m = rot(g.cur.m); for (const [dx, dy] of [[0, 0], [-1, 0], [1, 0], [-2, 0], [2, 0], [0, -1]]) if (fits(m, g.cur.x + dx, g.cur.y + dy)) { g.cur.m = m; g.cur.x += dx; g.cur.y += dy; return true; } return false; };
  g.ghostY = () => { let y = g.cur.y; while (fits(g.cur.m, g.cur.x, y + 1)) y++; return y; };
  g.swap = () => { if (g.over || g.held) return false; const k = g.cur.k; spawn(g.hold || take()); g.hold = k; g.held = true; return true; };
  g.garbage = (n, hole) => { for (let i = 0; i < n; i++) { if (g.board[0].some(Boolean)) g.over = true; g.board.shift(); g.board.push(junkRow(hole)); } if (g.cur && !fits(g.cur.m, g.cur.x, g.cur.y)) g.cur.y = Math.max(-2, g.cur.y - n); };
  // 한 칸 내리기. 못 내리면 굳히고 줄을 지운다. 돌려주는 값: 지운 줄 수(굳지 않았으면 -1)
  g.step = soft => {
    if (g.over) return -1;
    if (fits(g.cur.m, g.cur.x, g.cur.y + 1)) { g.cur.y++; if (soft) g.score += 1; return -1; }
    g.cur.m.forEach((row, dy) => row.forEach((v, dx) => { if (v && g.cur.y + dy >= 0) g.board[g.cur.y + dy][g.cur.x + dx] = g.cur.k; }));
    if (g.cur.m.some((row, dy) => row.some(v => v) && g.cur.y + dy < 0)) g.over = true;
    const keep = g.board.filter(row => row.some(v => !v)), n = H - keep.length;
    while (keep.length < H) keep.unshift(new Array(W).fill(0)); g.board = keep;
    if (n) { g.combo++; g.lines += n; g.score += LINE_PTS[n] * g.level + (g.combo > 1 ? 50 * (g.combo - 1) : 0); g.sent += ATTACK[n]; g.level = 1 + Math.floor(g.lines / 10); } else g.combo = 0;
    g.held = false; if (!g.over) spawn(take());
    return n;
  };
  g.drop = () => { if (g.over) return -1; let d = 0; while (fits(g.cur.m, g.cur.x, g.cur.y + 1)) { g.cur.y++; d++; } g.score += d * 2; return g.step(); };
  return g;
}

export function mount(el, ctx) {
  let alive = true, raf = 0, remote = null, mine = null, S = null, G = null, best = {}, mode = 'rec', diff = 'e', dismissed = '', seenId = '', fxDone = '', acc = 0, lastT = 0, applied = new Set(), pending = 0, lastSent = 0, lastSc = '', lockT = 0, paused = false;
  try { const m = localStorage.getItem('capy.tetrisMode'); if (m === 'vs' || m === 'rec') mode = m; const d = localStorage.getItem('capy.tetrisDiff'); if (LEVELS[d]) diff = d; } catch {}
  const pid = () => ctx.partnerId, now = () => ctx.store.now(), box = h('div', { class: 'tt' }); el.append(box);
  const pickS = () => { S = mine && mine.id !== dismissed ? mine : remote && remote.id !== dismissed ? remote : null; };
  const them = () => (S && S.kind === 'vs' && pid() ? (S.sc || {})[pid()] : null), meDead = () => !!(G && G.over);
  const phase = () => { if (!S) return 'lobby'; if (now() < S.startAt) return 'ready'; if (S.id !== seenId) return 'lobby'; const o = them(); return meDead() || (S.kind === 'vs' && o && o.dead) ? 'result' : 'play'; };

  function lobby() {
    const chip = (on, label, fn, sub) => h('button', { class: 'bg-chip' + (on ? ' on' : ''), onClick: fn }, h('b', null, label), sub && h('small', null, sub));
    const b = best[`${diff}-${ctx.uid}`], pb = pid() && best[`${diff}-${pid()}`], save = () => { try { localStorage.setItem('capy.tetrisMode', mode); localStorage.setItem('capy.tetrisDiff', diff); } catch {} };
    box.replaceChildren(...[
      h('div', { class: 'tt-hero' }, h('span', null, '🧱'), h('div', null, h('b', null, '카피 테트리스'), h('small', null, '줄을 가득 채워 지워요'))),
      h('label', { class: 'lbl' }, '모드'),
      h('div', { class: 'bg-row' }, chip(mode === 'vs', '⚔️ 경쟁', () => { mode = 'vs'; save(); lobby(); }, '먼저 쌓이면 져요'), chip(mode === 'rec', '🏆 기록', () => { mode = 'rec'; save(); lobby(); }, '혼자 최고 점수')),
      h('label', { class: 'lbl' }, '난이도'),
      h('div', { class: 'bg-row' }, Object.entries(LEVELS).map(([k, v]) => chip(diff === k, v.name, () => { diff = k; save(); lobby(); }, v.sub))),
      h('p', { class: 'dim bg-note' + (mode === 'vs' && !pid() ? ' warn' : '') }, mode === 'vs' ? (pid() ? `시작하면 ${ctx.nameOf(pid())} 화면에서도 같이 시작돼요. 같은 블록이 나오고, 2줄 이상 한 번에 지우면 상대 바닥에 방해 줄이 올라가요. 먼저 꼭대기까지 쌓이면 져요.` : '상대가 아직 방에 없어요. 기록 모드를 골라 주세요') : '꼭대기까지 쌓일 때까지 계속해요. 10줄마다 빨라져요.'),
      h('button', { class: 'btn primary big', onClick: start }, '시작'),
      h('p', { class: 'dim center' }, '왼쪽·오른쪽 옮기기 · 내리기 · 돌리기 · 뚝!(바로 떨어뜨리기) · 보관: 블록 바꿔 두기'),
      (b || pb) && h('p', { class: 'dim center' }, [b && `내 최고 ${b.s.toLocaleString()}점`, pb && `${ctx.nameOf(pid())} 최고 ${pb.s.toLocaleString()}점`].filter(Boolean).join(' · '))].filter(Boolean));
  }
  function start() {
    const run = { id: Math.random().toString(36).slice(2, 9), kind: mode, diff, seed: Math.floor(Math.random() * 1e6), startAt: now() + 3200, by: ctx.uid };
    dismissed = ''; G = null;
    if (mode === 'vs') { mine = null; ctx.store.set(PATH, run).catch(() => toast('시작하지 못했어요')); return; }
    mine = run; pickS(); paint();
  }

  // ----- 그리기 -----
  let cv, cx, cell = 20, side, top;
  function cellAt(g2, x, y, k, s, alpha = 1) {
    const c = COLOR[k] || '#999', px = x * s, py = y * s, rr = s * 0.24;
    g2.globalAlpha = alpha; g2.fillStyle = c; g2.beginPath(); g2.roundRect(px + 1, py + 1, s - 2, s - 2, rr); g2.fill();
    g2.fillStyle = 'rgba(255,255,255,.35)'; g2.beginPath(); g2.roundRect(px + 3, py + 2.5, s - 6, s * 0.2, rr * 0.5); g2.fill();
    if (k !== 'G' && s >= 14) { g2.fillStyle = '#3B2618'; g2.beginPath(); g2.arc(px + s * 0.34, py + s * 0.56, s * 0.065, 0, 7); g2.arc(px + s * 0.66, py + s * 0.56, s * 0.065, 0, 7); g2.fill(); g2.fillStyle = 'rgba(255,120,130,.5)'; g2.beginPath(); g2.arc(px + s * 0.22, py + s * 0.72, s * 0.07, 0, 7); g2.arc(px + s * 0.78, py + s * 0.72, s * 0.07, 0, 7); g2.fill(); } // 작은 얼굴
    g2.globalAlpha = 1;
  }
  const mini = k => { const c = h('canvas', { width: 64, height: 44 }), g2 = c.getContext('2d'); if (!k) return c; const m = SHAPES[k], rows = m.filter(r => r.some(Boolean)), w = m[0].length, s = 14, ox = (64 - w * s) / 2, oy = (44 - rows.length * s) / 2;
    g2.translate(ox, oy); rows.forEach((row, y) => row.forEach((v, x) => v && cellAt(g2, x, y, k, s))); return c; };
  function build() {
    const vw = Math.min(el.clientWidth || 360, 520), vh = window.innerHeight; cell = Math.max(14, Math.floor(Math.min((vw - 96) / W, (vh - 268) / H)));
    cv = h('canvas', { class: 'tt-board', width: W * cell, height: H * cell }); cx = cv.getContext('2d'); side = h('div', { class: 'tt-side' }); top = h('div', { class: 'tt-top' });
    const ICON = { l: '<path d="M26 8 9 20l17 12z"/>', r: '<path d="M14 8l17 12-17 12z"/>', down: '<path d="M8 13h24L20 31z"/>',
      rot: '<path d="M30.5 20a10.5 10.5 0 1 1-4-8.2" fill="none" stroke="currentColor" stroke-width="4.6" stroke-linecap="round"/><path d="M21.5 5.5 31 9l-3.5 9.5z"/>',
      drop: '<path d="M16.5 4h7v11h7L20 27 9.500 15h7z"/><rect x="7" y="30" width="26" height="5" rx="2.5"/>' };
    const hold = (fn, label, cls = '', rep = 0, ic = 'l') => { const b = h('button', { class: 'tt-key ' + cls, 'aria-label': label }, h('span', { class: 'tt-ic', html: `<svg viewBox="0 0 40 40" fill="currentColor" stroke="currentColor" stroke-width="2.4" stroke-linejoin="round">${ICON[ic]}</svg>` }), h('small', null, label)); let t = 0, iv = 0;
      const stop = () => { clearTimeout(t); clearInterval(iv); b.classList.remove('on'); }; b.addEventListener('pointerdown', e => { e.preventDefault(); b.classList.add('on'); try { navigator.vibrate && navigator.vibrate(8); } catch {} fn(); if (rep) t = setTimeout(() => { iv = setInterval(fn, rep); }, 190); });
      ['pointerup', 'pointerleave', 'pointercancel'].forEach(n => b.addEventListener(n, stop)); return b; };
    box.replaceChildren(top, h('div', { class: 'tt-play' }, cv, side),
      h('div', { class: 'tt-keys' }, hold(() => act('l'), '왼쪽', 'mv', 70, 'l'), hold(() => act('down'), '내리기', 'dn', 50, 'down'), hold(() => act('r'), '오른쪽', 'mv', 70, 'r'), h('i'), hold(() => act('rot'), '돌리기', 'rot', 0, 'rot'), hold(() => act('drop'), '뚝!', 'drop', 0, 'drop')));
  }
  function drawSide() {
    const o = them();
    side.replaceChildren(...[h('small', null, '다음'), ...G.next.slice(0, 3).map(mini), h('small', null, '보관'), h('button', { class: 'tt-hold', onClick: () => act('hold') }, mini(G.hold)),
      h('small', null, '줄'), h('b', null, String(G.lines)), h('small', null, '단계'), h('b', null, String(G.level)),
      pending > 0 && h('em', { class: 'tt-warn' }, `방해 ${pending}줄`)].filter(Boolean));
    top.replaceChildren(h('b', null, `${G.score.toLocaleString()}점`), S.kind === 'vs' ? h('span', null, o ? `${ctx.nameOf(pid())} ${(o.s || 0).toLocaleString()}점 · ${o.l || 0}줄` : '상대를 기다리는 중…') : h('span', null, `${LEVELS[S.diff].name} · 기록`),
      h('button', { class: 'bg-book', 'aria-label': '멈춤', onClick: () => { if (S.kind === 'vs') return toast('경쟁 중에는 멈출 수 없어요'); paused = !paused; drawBoard(); } }, paused ? '▶' : '⏸'),
      h('button', { class: 'bg-book quit', 'aria-label': '그만하기', onClick: giveUp }, '🏳️'));
  }
  function drawBoard() {
    const s = cell; cx.clearRect(0, 0, cv.width, cv.height); cx.fillStyle = '#3B2A22'; cx.fillRect(0, 0, cv.width, cv.height);
    cx.strokeStyle = 'rgba(255,255,255,.06)'; cx.lineWidth = 1; for (let x = 1; x < W; x++) { cx.beginPath(); cx.moveTo(x * s + .5, 0); cx.lineTo(x * s + .5, H * s); cx.stroke(); } for (let y = 1; y < H; y++) { cx.beginPath(); cx.moveTo(0, y * s + .5); cx.lineTo(W * s, y * s + .5); cx.stroke(); }
    G.board.forEach((row, y) => row.forEach((k, x) => k && cellAt(cx, x, y, k, s)));
    if (!G.over && G.cur) { const gy = G.ghostY(); G.cur.m.forEach((row, dy) => row.forEach((v, dx) => { if (!v) return; if (gy + dy >= 0) cellAt(cx, G.cur.x + dx, gy + dy, G.cur.k, s, 0.22); })); G.cur.m.forEach((row, dy) => row.forEach((v, dx) => { if (v && G.cur.y + dy >= 0) cellAt(cx, G.cur.x + dx, G.cur.y + dy, G.cur.k, s); })); }
    if (paused) { cx.fillStyle = 'rgba(30,22,18,.7)'; cx.fillRect(0, 0, cv.width, cv.height); cx.fillStyle = '#fff'; cx.font = `${s}px sans-serif`; cx.textAlign = 'center'; cx.fillText('잠깐 멈춤', cv.width / 2, cv.height / 2); }
  }

  // ----- 조작·진행 -----
  function landed(n) { // 블록이 굳은 뒤
    if (n < 0) return; lockT = 0; sfx(n >= 4 ? 'pair' : n > 0 ? 'pop' : 'tock');
    if (S.kind === 'vs') { if (n >= 2 && pid() && G.sent > lastSent) { ctx.store.push(PATH + '/atk', { to: pid(), n: G.sent - lastSent, id: S.id }).catch(() => {}); } lastSent = G.sent;
      if (n === 0 && pending > 0) { G.garbage(pending, Math.floor(Math.random() * W)); pending = 0; sfx('bad'); } } // 줄을 못 지운 차례에 방해 줄이 올라온다
    report(); drawSide();
  }
  function act(k) {
    if (!G || G.over || paused || phase() !== 'play') return;
    if (k === 'l' || k === 'r') { if (G.move(k === 'l' ? -1 : 1)) sfx('tock'); }
    else if (k === 'rot') { if (G.rotate()) sfx('flip'); }
    else if (k === 'down') { landed(G.step(true)); acc = 0; }
    else if (k === 'drop') { sfx('jump'); landed(G.drop()); acc = 0; }
    else if (k === 'hold') { if (G.swap()) { sfx('flip'); drawSide(); } }
    drawBoard(); if (G.over) paint();
  }
  function report(force) { if (!S || S.kind !== 'vs') return; const v = `${G.score}|${G.lines}|${G.over}`; if (v === lastSc && !force) return; lastSc = v; ctx.store.update(`${PATH}/sc/${ctx.uid}`, { s: G.score, l: G.lines, dead: G.over || null }).catch(() => {}); }
  function giveUp() { if (!G || G.over) return; modal({ title: '🏳️ 여기서 그만할까요?', body: h('p', { class: 'center' }, S.kind === 'vs' ? '그만하면 이 판은 져요.' : '지금 점수로 끝나요.'), actions: [{ label: '계속하기' }, { label: '그만하기', danger: true, onClick: c => { c(); if (G) { G.over = true; report(true); paint(); } } }] }); }
  function loop(ts) {
    if (!alive) return; raf = requestAnimationFrame(loop);
    const ph = phase(); if (ph !== 'play' || !G) { lastT = 0; if (ph === 'ready' && box.querySelector('.bg-count')) { const n = String(Math.max(1, Math.ceil((S.startAt - now()) / 1000))), e = box.querySelector('.bg-count'); if (e.firstChild.textContent !== n) e.firstChild.textContent = n; } if (ph !== lastPh) paint(); return; }
    if (ph !== lastPh) return paint();
    const dt = lastT ? Math.min(120, ts - lastT) : 0; lastT = ts; if (paused || document.hidden) return;
    acc += dt; G.t += dt; const sp = G.speed();
    if (acc >= sp) { acc = 0; const n = G.step(); landed(n); drawBoard(); if (G.over) { report(true); paint(); } }
  }
  let lastPh = '';
  function result() {
    const o = them(), vs = S.kind === 'vs', key = `${S.diff}-${ctx.uid}`, my = G ? G.score : ((S.sc || {})[ctx.uid] || {}).s || 0, prev = best[key], won = vs && o ? (meDead() ? false : true) : null;
    if (fxDone !== S.id) { fxDone = S.id; sfx(won === false ? 'lose' : 'win'); const pay = PAY.tetris(my, S.diff), T = TETRIS_PAY[S.diff] || TETRIS_PAY.e; ctx.earn(pay + (won ? 30 : 0), '테트리스', [`${LEVELS[S.diff].name} 단계: 기본 ${T.base} + 내 점수 ${my}점 ÷ ${T.per} = ${pay}코인${pay >= T.max ? ' (최대)' : ''}`, ...(won ? ['승리 보너스 +30코인'] : [])]);
      if (my > 0 && (!prev || my > prev.s)) ctx.store.tx('games/tetrisBest/' + key, c => (c && c.s >= my ? undefined : { s: my, at: now() })).catch(() => {});
      if (vs && o) gameFx(won ? 'win' : 'lose', `${my.toLocaleString()} : ${(o.s || 0).toLocaleString()}`); else if (my > 0) gameFx('win', `${my.toLocaleString()}점${prev && my > prev.s ? ' 신기록' : ''}`); }
    box.replaceChildren(h('div', { class: 'bg-end' }, ...[h('span', null, '🧱'), h('b', null, vs && o ? (won ? '이겼어요!' : '졌어요…') : '끝!'),
      h('p', { class: 'bg-big' }, `${my.toLocaleString()}점`), h('p', { class: 'dim' }, `${vs ? '경쟁' : '기록'} · ${LEVELS[S.diff].name} · ${G ? G.lines : 0}줄`),
      vs && h('p', null, o ? `${ctx.nameOf(pid())} ${(o.s || 0).toLocaleString()}점 · ${o.l || 0}줄` : '상대가 이 판에 들어오지 않았어요'),
      h('p', { class: 'dim' }, `내 최고 기록 ${Math.max(prev ? prev.s : 0, my).toLocaleString()}점`),
      h('button', { class: 'btn primary big', onClick: () => { dismissed = S.id; if (mine && mine.id === S.id) mine = null; G = null; pickS(); paint(); } }, '다시 하기')].filter(Boolean)));
  }
  function paint() {
    if (!alive) return; pickS(); if (S && S.kind === 'vs' && S.id !== seenId && now() - S.startAt > 4000) { dismissed = S.id; pickS(); } // 예전에 끝났거나 한참 전에 시작된 판에는 끼어들지 않는다
    if (S && (now() < S.startAt || !G || G.id !== S.id) && S.id !== seenId) { seenId = S.id; G = makeGame(S.seed, S.diff); G.id = S.id; acc = 0; pending = 0; lastSent = 0; lastSc = ''; paused = false; applied = new Set(); build(); report(true); }
    const ph = phase(); lastPh = ph;
    if (ph === 'lobby') return lobby();
    if (ph === 'result') return result();
    if (!cv || !cv.isConnected) build();
    drawSide(); drawBoard();
    const old = box.querySelector('.bg-count'); if (ph === 'ready') { if (!old) box.querySelector('.tt-play').append(h('div', { class: 'bg-count tt-count' }, String(Math.max(1, Math.ceil((S.startAt - now()) / 1000))), h('small', null, '준비…'))); } else if (old) old.remove();
  }

  const kd = e => { const k = { ArrowLeft: 'l', ArrowRight: 'r', ArrowUp: 'rot', ArrowDown: 'down', ' ': 'drop', c: 'hold', C: 'hold' }[e.key]; if (k && G && phase() === 'play') { e.preventDefault(); act(k); } };
  window.addEventListener('keydown', kd);
  const offs = [
    ctx.store.on(PATH, v => { const was = S; remote = v && v.kind === 'vs' ? v : null; pickS();
      if (S && S.kind === 'vs' && G && S.id === G.id && S.atk) Object.entries(S.atk).forEach(([k, a]) => { if (!applied.has(k)) { applied.add(k); if (a && a.to === ctx.uid && a.id === S.id) { pending += a.n || 0; sfx('hang'); } } });
      if (S && was && S.id === was.id && phase() === lastPh && lastPh === 'play') return drawSide();
      paint(); }),
    ctx.store.on('games/tetrisBest', v => { best = v || {}; if (phase() === 'lobby') lobby(); }),
  ];
  paint(); raf = requestAnimationFrame(loop);
  return () => { alive = false; cancelAnimationFrame(raf); window.removeEventListener('keydown', kd); offs.forEach(f => f()); };
}
