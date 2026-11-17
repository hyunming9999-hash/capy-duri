// 동물 마작 — 같은 동물 패 두 장을 골라 없앤다(사천성: 두 번까지 꺾이는 길로 이어져야 한다). 번갈아 한 쌍씩, 점수 대결
import { h, toast, modal, gameFx } from './ui.js';
import { sfx } from './sound.js';
import { ANIMALS, animalSvg } from './animals.js';
import { PAY } from './money.js';

const PATH = 'games/mahjong';
const LEVELS = { e: { name: '하', sub: '6×6 · 6초', cols: 6, rows: 6, sec: 6, cpu: [0.55, 2600] }, m: { name: '중', sub: '7×8 · 4초', cols: 7, rows: 8, sec: 4, cpu: [0.78, 2000] }, h: { name: '상', sub: '8×9 · 2초', cols: 8, rows: 9, sec: 2, cpu: [0.95, 700] } };
function rng(a) { return () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
const shuffle = (a, r) => { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };

// ----- 규칙(화면과 상관없이) -----
// 두 칸을 잇는 길(꺾임 2번 이하)을 찾는다. 판 바깥 한 줄로 돌아갈 수 있다. 길이 있으면 지나는 점들을 돌려준다
export function linkPath(cells, cols, rows, a, b) {
  if (a === b || cells[a] < 0 || cells[a] !== cells[b]) return null;
  const W = cols + 2, at = (x, y) => (x < 1 || y < 1 || x > cols || y > rows ? -1 : cells[(y - 1) * cols + (x - 1)]);
  const A = [a % cols + 1, Math.floor(a / cols) + 1], B = [b % cols + 1, Math.floor(b / cols) + 1];
  const free = (x, y) => (x === A[0] && y === A[1]) || (x === B[0] && y === B[1]) || at(x, y) < 0;
  const clearLine = (p, q) => { // 같은 줄(가로나 세로)에서 사이가 다 비었나
    if (p[0] === q[0]) { for (let y = Math.min(p[1], q[1]) + 1; y < Math.max(p[1], q[1]); y++) if (!free(p[0], y)) return false; return true; }
    if (p[1] === q[1]) { for (let x = Math.min(p[0], q[0]) + 1; x < Math.max(p[0], q[0]); x++) if (!free(x, p[1])) return false; return true; }
    return false; };
  if (clearLine(A, B)) return [A, B];
  for (const c of [[A[0], B[1]], [B[0], A[1]]]) if (free(c[0], c[1]) && at(c[0], c[1]) < 0 && clearLine(A, c) && clearLine(c, B)) return [A, c, B];
  for (let x = 0; x < W; x++) { const p = [x, A[1]], q = [x, B[1]]; if (x !== A[0] && x !== B[0] && at(p[0], p[1]) < 0 && at(q[0], q[1]) < 0 && clearLine(A, p) && clearLine(p, q) && clearLine(q, B)) return [A, p, q, B]; }
  for (let y = 0; y < rows + 2; y++) { const p = [A[0], y], q = [B[0], y]; if (y !== A[1] && y !== B[1] && at(p[0], p[1]) < 0 && at(q[0], q[1]) < 0 && clearLine(A, p) && clearLine(p, q) && clearLine(q, B)) return [A, p, q, B]; }
  return null;
}
export function anyMove(cells, cols, rows) {
  const by = {}; cells.forEach((k, i) => { if (k >= 0) (by[k] = by[k] || []).push(i); });
  for (const k in by) { const l = by[k]; for (let i = 0; i < l.length; i++) for (let j = i + 1; j < l.length; j++) if (linkPath(cells, cols, rows, l[i], l[j])) return [l[i], l[j]]; }
  return null;
}
// 없앨 수 있는 쌍이 하나도 없으면 남은 패를 제자리에서 섞는다
export function ensureMove(cells, cols, rows, r) {
  let n = 0; while (cells.some(k => k >= 0) && !anyMove(cells, cols, rows) && n++ < 200) { const idx = cells.map((k, i) => (k >= 0 ? i : -1)).filter(i => i >= 0), vals = shuffle(idx.map(i => cells[i]), r); idx.forEach((i, j) => { cells[i] = vals[j]; }); }
  return n > 0;
}
export function makeBoard(seed, diff) {
  const L = LEVELS[diff], r = rng(seed), n = L.cols * L.rows, kinds = shuffle(ANIMALS.map((_, i) => i), r).slice(0, n / 4), cells = shuffle(kinds.flatMap(k => [k, k, k, k]), r);
  ensureMove(cells, L.cols, L.rows, r); return cells;
}

export function mount(el, ctx) {
  let alive = true, remote = null, mine = null, S = null, best = {}, mode = 'cpu', diff = 'e', dismissed = '', seenId = '', fxDone = '', sel = -1, timer = 0, cpuT = 0, line = null, lastTurnKey = '';
  try { const m = localStorage.getItem('capy.mjMode'); if (m === 'vs' || m === 'cpu') mode = m; const d = localStorage.getItem('capy.mjDiff'); if (LEVELS[d]) diff = d; } catch {}
  const pid = () => ctx.partnerId, now = () => ctx.store.now(), box = h('div', { class: 'mj' }); el.append(box);
  const pickS = () => { S = mine && mine.id !== dismissed ? mine : remote && remote.id !== dismissed ? remote : null; };
  const cellsOf = s => (Array.isArray(s.cells) ? s.cells : Object.assign([], s.cells || {})).map(v => (v == null ? -1 : v));
  const left = s => cellsOf(s).filter(k => k >= 0).length, over = s => left(s) === 0;
  const myI = () => (S.kind === 'cpu' ? 0 : S.p && S.p[0] === ctx.uid ? 0 : 1), myTurn = () => S.turn === myI();
  const names = () => (S.kind === 'cpu' ? ['나', '🤖 컴퓨터'] : (S.p || []).map(u => (u === ctx.uid ? '나' : ctx.nameOf(u))));
  const phase = () => (!S || S.id !== seenId ? 'lobby' : over(S) ? 'result' : 'play');

  function lobby() {
    const chip = (on, label, fn, sub) => h('button', { class: 'bg-chip' + (on ? ' on' : ''), onClick: fn }, h('b', null, label), sub && h('small', null, sub));
    const save = () => { try { localStorage.setItem('capy.mjMode', mode); localStorage.setItem('capy.mjDiff', diff); } catch {} }, b = best[`${diff}-${ctx.uid}`];
    box.replaceChildren(...[
      h('div', { class: 'tt-hero' }, h('span', { class: 'mj-hero', html: animalSvg(4) }), h('div', null, h('b', null, '동물 마작'), h('small', null, '같은 동물 두 장을 찾아 없애요'))),
      h('label', { class: 'lbl' }, '모드'),
      h('div', { class: 'bg-row' }, chip(mode === 'vs', '⚔️ 경쟁', () => { mode = 'vs'; save(); lobby(); }, '둘이 번갈아'), chip(mode === 'cpu', '🤖 컴퓨터랑', () => { mode = 'cpu'; save(); lobby(); }, '컴퓨터와 번갈아')),
      h('label', { class: 'lbl' }, '난이도'),
      h('div', { class: 'bg-row' }, Object.entries(LEVELS).map(([k, v]) => chip(diff === k, v.name, () => { diff = k; save(); lobby(); }, v.sub))),
      h('p', { class: 'dim bg-note' + (mode === 'vs' && !pid() ? ' warn' : '') }, mode === 'vs' && !pid() ? '상대가 아직 방에 없어요. 컴퓨터랑 하기를 골라 주세요' : '내 차례에 같은 동물 패 두 장을 눌러요. 두 패 사이가 두 번까지만 꺾이는 빈 길로 이어져야 없어져요(판 바깥으로 돌아가도 돼요). 한 쌍에 10점, 빨리 찾을수록 가산점(남은 시간만큼 최대 +10점). 틀린 짝을 누르면 -3점. 시간 안에 못 찾으면 차례가 넘어가요.'),
      h('button', { class: 'btn primary big', onClick: start }, '시작'),
      b && h('p', { class: 'dim center' }, `내 최고 ${b.s}점`)].filter(Boolean));
  }
  function start() {
    const run = { id: Math.random().toString(36).slice(2, 9), kind: mode, diff, seed: Math.floor(Math.random() * 1e6), turn: 0, turnAt: now() + 1500, sc: [0, 0], by: ctx.uid, n: 0 };
    run.cells = makeBoard(run.seed, diff); dismissed = ''; sel = -1;
    if (mode === 'vs') { if (!pid()) return toast('상대가 없어요'); run.p = Math.random() < 0.5 ? [ctx.uid, pid()] : [pid(), ctx.uid]; mine = null; ctx.store.set(PATH, run).catch(() => toast('시작하지 못했어요')); return; }
    mine = run; seenId = run.id; pickS(); paint();
  }
  // 한 수: who가 a·b를 없앤다(pair가 없으면 차례만 넘긴다). 경쟁은 방에 적고, 컴퓨터 판은 내 폰에서만 바꾼다
  function apply(s, who, pair, quick) {
    const L = LEVELS[s.diff], cells = cellsOf(s), sc = (s.sc || [0, 0]).slice(); let last = { who, at: now() };
    if (pair) { const path = linkPath(cells, L.cols, L.rows, pair[0], pair[1]); if (!path) return null; const pts = 10 + Math.max(0, Math.min(10, Math.round(+quick || 0))); sc[who] += pts; last = { ...last, a: pair[0], b: pair[1], k: cells[pair[0]], path: path.flat(), pts }; cells[pair[0]] = -1; cells[pair[1]] = -1;
      if (ensureMove(cells, L.cols, L.rows, rng(s.seed + s.n * 97 + 5))) last.mix = true; }
    return { ...s, cells, sc, turn: 1 - who, turnAt: now() + (pair ? 700 : 300), n: (s.n || 0) + 1, last };
  }
  function move(who, pair, quick) {
    if (S.kind === 'cpu') { const nx = apply(S, who, pair, quick); if (!nx) return false; mine = nx; pickS(); onChange(); return true; }
    const id = S.id, n = S.n || 0; ctx.store.tx(PATH, cur => { if (!cur || cur.id !== id || (cur.n || 0) !== n || cur.turn !== who) return; return apply(cur, who, pair, quick) || undefined; }).catch(() => {}); return true;
  }
  // 빨리 찾을수록 가산점: 남은 시간에 비례해 최대 +10점. 틀린 짝을 누르면 -3점(0점 밑으로는 안 내려간다)
  const WRONG = 3, speedBonus = s => Math.round(10 * Math.max(0, 1 - (now() - s.turnAt) / (LEVELS[s.diff].sec * 1000)));
  function miss(who) {
    const dock = s => { const sc = (s.sc || [0, 0]).slice(); sc[who] = Math.max(0, (sc[who] || 0) - WRONG); return { ...s, sc }; };
    toast(`틀렸어요 -${WRONG}점`, 700);
    if (S.kind === 'cpu') { mine = dock(S); pickS(); drawTop && drawTop(); return; }
    const id = S.id; ctx.store.tx(PATH, cur => (cur && cur.id === id ? dock(cur) : undefined)).catch(() => {});
  }
  function tapTile(i) {
    if (phase() !== 'play' || !myTurn() || now() < S.turnAt) return; const cells = cellsOf(S), L = LEVELS[S.diff]; if (cells[i] < 0) return;
    if (sel < 0 || sel === i) { sel = sel === i ? -1 : i; sfx('tock'); return drawBoard(); }
    if (cells[sel] === cells[i] && linkPath(cells, L.cols, L.rows, sel, i)) { const a = sel; sel = -1; move(myI(), [a, i], speedBonus(S)); }
    else { miss(myI()); sfx('miss'); const e = box.querySelector(`.mj-t[data-i="${i}"]`); if (e) { e.classList.remove('shake'); void e.offsetWidth; e.classList.add('shake'); } sel = -1; setTimeout(drawBoard, 250); }
  }

  let grid, topEl;
  function drawTop() {
    const nm = names(), sc = S.sc || [0, 0], me = myI(), L = LEVELS[S.diff], rest = Math.max(0, L.sec - Math.max(0, now() - S.turnAt) / 1000);
    topEl.replaceChildren(...[0, 1].map(i => h('div', { class: 'mj-p' + (S.turn === i ? ' on' : '') + (i === me ? ' me' : '') }, h('small', null, nm[i] || '상대'), h('b', null, String(sc[i] || 0)))),
      h('div', { class: 'mj-turn' }, h('span', null, myTurn() ? '내 차례' : `${nm[1 - me] || '상대'} 차례`), h('i', null, h('u', { style: { width: rest / L.sec * 100 + '%' } }))),
      h('button', { class: 'bg-book quit', 'aria-label': '그만하기', onClick: giveUp }, '🏳️'));
  }
  function drawBoard() {
    const L = LEVELS[S.diff], cells = cellsOf(S);
    grid.style.gridTemplateColumns = `repeat(${L.cols},1fr)`; grid.classList.toggle('mine', myTurn());
    grid.replaceChildren(...cells.map((k, i) => (k < 0 ? h('span', { class: 'mj-e' }) : h('button', { class: 'mj-t' + (sel === i ? ' on' : ''), 'data-i': i, 'data-k': k, title: ANIMALS[k].name, onPointerdown: e => { e.preventDefault(); tapTile(i); }, html: animalSvg(k) }))));
    if (line) { const w = grid.clientWidth / L.cols, hh = grid.clientHeight / L.rows, pts = []; for (let i = 0; i < line.length; i += 2) pts.push(`${(line[i] - 0.5) * w},${(line[i + 1] - 0.5) * hh}`);
      grid.append(h('span', { class: 'mj-line', html: `<svg viewBox="0 0 ${grid.clientWidth} ${grid.clientHeight}" style="overflow:visible"><polyline points="${pts.join(' ')}" fill="none" stroke="#FF8A3C" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/></svg>` })); }
  }
  function giveUp() { modal({ title: '🏳️ 여기서 그만할까요?', body: h('p', { class: 'center' }, '이 판을 끝내고 나가요.'), actions: [{ label: '계속하기' }, { label: '그만하기', danger: true, onClick: c => { c(); dismissed = S.id; if (mine && mine.id === S.id) mine = null; else if (S.kind === 'vs') ctx.store.update(PATH, { quit: ctx.uid, cells: null }).catch(() => {}); pickS(); paint(); } }] }); }
  function result() {
    const sc = S.sc || [0, 0], me = myI(), my = sc[me] || 0, op = sc[1 - me] || 0, key = `${S.diff}-${ctx.uid}`, prev = best[key], nm = names();
    if (fxDone !== S.id) { fxDone = S.id; ctx.earnMatch(PAY.mahjong(my) + (my > op ? 20 : 0), '동물 마작', [`내 점수 ${my}점 ÷ 3 = ${PAY.mahjong(my)}코인`, ...(my > op ? ['승리 보너스 +20코인'] : [])], my > op ? 'win' : my < op ? 'lose' : 'draw', 'mahjong', S.kind === 'vs'); gameFx(my > op ? 'win' : my < op ? 'lose' : 'draw', `${my} : ${op}`);
      if (my > 0 && (!prev || my > prev.s)) ctx.store.tx('games/mahjongBest/' + key, c => (c && c.s >= my ? undefined : { s: my, at: now() })).catch(() => {}); }
    box.replaceChildren(h('div', { class: 'bg-end' }, h('span', { class: 'mj-hero', html: animalSvg(4) }), h('b', null, my > op ? '이겼어요!' : my < op ? '졌어요…' : '비겼어요'),
      h('p', { class: 'bg-big' }, `${my} : ${op}`), h('p', { class: 'dim' }, `${nm[me]} ${my}점 · ${nm[1 - me] || '상대'} ${op}점 · ${LEVELS[S.diff].name}`),
      h('button', { class: 'btn primary big', onClick: () => { dismissed = S.id; if (mine && mine.id === S.id) mine = null; pickS(); paint(); } }, '다시 하기')));
  }
  // 판이 바뀌었을 때(누가 한 쌍을 없앴거나 차례가 넘어갔을 때)
  function onChange() {
    const l = S && S.last; if (l && l.at && `${S.id}|${S.n}` !== lastTurnKey) { lastTurnKey = `${S.id}|${S.n}`;
      if (l.path) { line = l.path; sfx(l.pts > 10 ? 'pair' : 'pop'); setTimeout(() => { line = null; if (alive && phase() === 'play') drawBoard(); }, 480); if (l.mix) setTimeout(() => toast('없앨 수 있는 쌍이 없어서 패를 섞었어요', 1400), 500); } else sfx('tock');
      sel = -1; }
    paint(); scheduleCpu();
  }
  function scheduleCpu() {
    clearTimeout(cpuT); if (!S || S.kind !== 'cpu' || S.turn !== 1 || over(S)) return; const L = LEVELS[S.diff], lv = ctx.streakLv('mahjong'), p = Math.min(0.97, L.cpu[0] + 0.1 * lv), ms = L.cpu[1] * (1 - 0.15 * lv), id = S.id, n = S.n; // 연승할수록 컴퓨터가 더 잘 찾고 빨라진다
    cpuT = setTimeout(() => { if (!alive || !S || S.id !== id || S.n !== n) return; const cells = cellsOf(S), mv = Math.random() < p ? anyMove(cells, L.cols, L.rows) : null; if (!mv) toast('🤖 못 찾았어요', 900); move(1, mv, mv ? speedBonus(S) : 0); }, ms * (0.7 + Math.random() * 0.6) + 800);
  }
  function tick() {
    if (!alive || phase() !== 'play' || !topEl || !topEl.isConnected) return; const L = LEVELS[S.diff], el2 = (now() - S.turnAt) / 1000, u = topEl.querySelector('.mj-turn u');
    if (u) { const rest = Math.max(0, L.sec - Math.max(0, el2)); u.style.width = rest / L.sec * 100 + '%'; u.style.background = rest < 3 ? '#E5484D' : '#57C26B'; }
    // 시간이 다 되면 차례를 넘긴다. 경쟁에서는 차례인 사람이 넘기고, 그 사람이 없으면 3초 뒤 상대가 대신 넘긴다
    if (el2 > L.sec && (S.kind === 'cpu' ? S.turn === 0 : myTurn() || el2 > L.sec + 3)) { if (myTurn()) { sfx('bad'); toast('시간 끝! 차례가 넘어가요', 900); } sel = -1; move(S.turn, null, false); }
  }
  function paint() {
    if (!alive) return; pickS();
    if (S && S.kind === 'vs' && S.id !== seenId) { if (S.cells && now() - (S.turnAt || 0) < 60000 && (S.p || []).includes(ctx.uid)) seenId = S.id; else { dismissed = S.id; pickS(); } } // 한참 전에 멈춘 판에는 끼어들지 않는다
    const ph = phase();
    if (ph === 'lobby') { topEl = null; return lobby(); }
    if (ph === 'result') { topEl = null; return result(); }
    if (!topEl || !topEl.isConnected) { topEl = h('div', { class: 'mj-top' }); grid = h('div', { class: 'mj-grid' }); box.replaceChildren(topEl, grid, h('p', { class: 'dim center mj-left' })); }
    drawTop(); drawBoard(); box.querySelector('.mj-left').textContent = `남은 패 ${left(S)}장 · ${LEVELS[S.diff].name}`;
  }

  const offs = [
    ctx.store.on(PATH, v => { remote = v && v.kind === 'vs' && v.cells ? v : null; const was = S; pickS(); if (S && S.kind === 'vs' && (!was || was.id !== S.id || was.n !== S.n)) return onChange(); paint(); }),
    ctx.store.on('games/mahjongBest', v => { best = v || {}; if (phase() === 'lobby') lobby(); }),
  ];
  timer = setInterval(tick, 200); paint();
  return () => { alive = false; clearInterval(timer); clearTimeout(cpuT); offs.forEach(f => f()); };
}
