// 카피 버블 — 같은 동물 구슬을 3개 이상 붙이면 터지고, 매달린 데가 없어진 구슬은 우수수 떨어진다(퍼즐 버블처럼)
// 모드: 🏆 기록(하·중·상, 시간이 갈수록 위에서 줄이 더 빨리 밀려 내려온다) · 🗺️ 스테이지(30단계, 15단계부터 진짜 어렵다) · ⚔️ 경쟁(나와 상대 둘이서만)
import { h, toast, modal, gameFx } from './ui.js';
import { sfx } from './sound.js';
import { PAY } from './money.js';
import { animalSvg } from './animals.js';
import { capyUrlReady, svgUrl } from './capy.js';

const COLS = 8, R = 20, ROWH = R * Math.sqrt(3), LIMIT = 12, W = COLS * R * 2, LINE_Y = R + (LIMIT - 1) * ROWH + R, H = Math.round(LINE_Y + 96), GUN = { x: W / 2, y: LINE_Y + 40 };
const PATH = 'games/bubble', STAGES = 30;
// 구슬 색과 그 안의 동물 얼굴(색으로도, 얼굴로도 구별된다)
const COLORS = [['#FF6B6B', 4], ['#FFD43B', 17], ['#4DABF7', 16], ['#69DB7C', 13], ['#B197FC', 25], ['#FFA94D', 5], ['#F783AC', 12], ['#CED4DA', 7]];
const LEVELS = { e: { name: '하', sub: '느긋하게', colors: 5, ms: 15000, guide: 1 }, m: { name: '중', sub: '보통', colors: 6, ms: 11500, guide: 0.6 }, h: { name: '상', sub: '빠르게', colors: 7, ms: 8500, guide: 0.35 } };
function rng(a) { return () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }

// 스테이지 설계: 단계가 오를수록 색이 늘고, 줄이 많아지고, 같은 색끼리 덜 뭉치고, 천장이 더 자주 내려온다. 15단계부터 확 어려워진다
export function stageInfo(s) {
  const hard = s >= 15;
  return { colors: s <= 3 ? 3 : s <= 7 ? 4 : s <= 14 ? 5 : s <= 20 ? 6 : 7, rows: hard ? 7 + Math.floor((s - 15) / 6) : 4 + Math.floor(s / 3),
    clump: hard ? Math.max(0.1, 0.3 - (s - 15) * 0.013) : 0.7 - s * 0.02, every: s <= 4 ? 9 : s <= 9 ? 8 : s <= 14 ? 7 : s <= 22 ? 6 : 5, guide: s <= 6 ? 1 : s <= 14 ? 0.6 : 0.3, hard };
}
const MASKS = [
  () => true,
  (r, c, n, w) => r < n - Math.abs(c - (w - 1) / 2) * 0.9, // 역삼각형
  (r, c, n, w) => !(r > 1 && c > 1 && c < w - 2 && r < n - 1), // 테두리
  (r, c) => (r + c) % 3 !== 2, // 구멍 숭숭
  (r, c, n, w) => c < 3 || c > w - 4 || r < 2, // 두 기둥
  (r, c, n, w) => Math.abs(c - (w - 1) / 2) + r * 0.6 < w / 2 + 0.5, // 다이아몬드 꼴
  (r, c, n, w) => r % 3 !== 2 || c % 2 === 0, // 가로 줄무늬
];

// 판 하나의 규칙(화면과 상관없이 돌아간다)
export function makeGame(seed, o) {
  const r = rng(seed), g = { rows: [], odd0: 0, drop: 0, score: 0, shots: 0, pushes: 0, popped: 0, dropped: 0, over: false, clear: false, fly: null, fx: [], sent: 0, ncol: o.colors };
  g.off = rr => (rr + g.odd0) % 2 === 1;
  g.len = rr => (g.off(rr) ? COLS - 1 : COLS);
  g.row = rr => { while (g.rows.length <= rr) { const k = g.rows.length; g.rows.push(new Array(g.len(k)).fill(-1)); } return g.rows[rr]; };
  g.at = (rr, c) => (rr < 0 || rr >= g.rows.length || c < 0 || c >= g.len(rr) ? -1 : g.rows[rr][c]);
  g.xy = (rr, c) => ({ x: R + c * R * 2 + (g.off(rr) ? R : 0), y: R + (rr + g.drop) * ROWH });
  g.nb = (rr, c) => { const o2 = g.off(rr); return [[rr, c - 1], [rr, c + 1], [rr - 1, o2 ? c : c - 1], [rr - 1, o2 ? c + 1 : c], [rr + 1, o2 ? c : c - 1], [rr + 1, o2 ? c + 1 : c]].filter(([a, b]) => a >= 0 && b >= 0 && b < g.len(a)); };
  g.each = fn => g.rows.forEach((row, rr) => row.forEach((v, c) => v >= 0 && fn(rr, c, v)));
  g.count = () => { let n = 0; g.each(() => n++); return n; };
  const randRow = k => { const row = new Array(g.len(k)).fill(0).map(() => Math.floor(r() * g.ncol)); for (let c = 1; c < row.length; c++) if (r() < 0.45) row[c] = row[c - 1]; return row; };
  // 맨 위에 새 줄을 밀어 넣는다(기록·경쟁). 밑에 있던 줄은 한 칸씩 내려간다
  g.push = () => { g.odd0 = 1 - g.odd0; g.rows.unshift(null); g.rows[0] = randRow(0); g.pushes++; g.checkOver(); };
  g.checkOver = () => { if (g.lowest() + g.drop > LIMIT - 1) g.over = true; };
  g.lowest = () => { let m = -1; g.each(rr => { if (rr > m) m = rr; }); return m; };
  if (o.stage) { const S = stageInfo(o.stage), mask = MASKS[(o.stage * 3) % MASKS.length], n = S.rows;
    for (let rr = 0; rr < n; rr++) { const row = g.row(rr); for (let c = 0; c < row.length; c++) if (o.stage <= 2 || mask(rr, c, n, row.length)) {
      const nbc = g.nb(rr, c).map(([a, b]) => g.at(a, b)).filter(v => v >= 0); row[c] = nbc.length && r() < S.clump ? nbc[Math.floor(r() * nbc.length)] : Math.floor(r() * S.colors); } }
    if (!g.rows[0].some(v => v >= 0)) g.rows[0].fill(0);
  } else for (let k = 0; k < 5; k++) { g.row(k); g.rows[k] = randRow(k); }
  // 공중에 뜬 구슬(위와 이어지지 않은 것)을 찾는다
  g.floating = () => { const seen = new Set(), q = []; (g.rows[0] || []).forEach((v, c) => { if (v >= 0) { seen.add('0,' + c); q.push([0, c]); } });
    while (q.length) { const [a, b] = q.pop(); g.nb(a, b).forEach(([x, y]) => { const k = x + ',' + y; if (!seen.has(k) && g.at(x, y) >= 0) { seen.add(k); q.push([x, y]); } }); }
    const out = []; g.each((rr, c) => { if (!seen.has(rr + ',' + c)) out.push([rr, c]); }); return out; };
  { const fl = g.floating(); fl.forEach(([a, b]) => { g.rows[a][b] = -1; }); }
  const present = () => { const s = new Set(); g.each((a, b, v) => s.add(v)); return [...s]; };
  g.pick = () => { const p = present(); return p.length ? p[Math.floor(r() * p.length)] : Math.floor(r() * g.ncol); };
  g.cur = g.pick(); g.next = g.pick();
  // 쏘기: 각도(라디안, 0 = 위쪽)
  g.shoot = ang => { if (g.fly || g.over || g.clear) return false; const sp = 13; g.fly = { x: GUN.x, y: GUN.y, vx: Math.sin(ang) * sp, vy: -Math.cos(ang) * sp, c: g.cur }; g.cur = g.next; g.next = g.pick(); g.shots++; return true; };
  // 날아가는 구슬을 한 프레임 움직인다. 붙으면 결과({pop, drop})를 돌려준다
  g.step = () => { const f = g.fly; if (!f) return null; const n = 4;
    for (let k = 0; k < n; k++) { f.x += f.vx / n; f.y += f.vy / n;
      if (f.x < R) { f.x = 2 * R - f.x; f.vx = -f.vx; } if (f.x > W - R) { f.x = 2 * (W - R) - f.x; f.vx = -f.vx; }
      let hit = f.y <= R + g.drop * ROWH;
      if (!hit) g.each((rr, c) => { if (hit) return; const p = g.xy(rr, c); if ((p.x - f.x) ** 2 + (p.y - f.y) ** 2 < (R * 1.75) ** 2) hit = true; });
      if (hit) return g.land(); }
    if (f.y > H) g.fly = null; return null; };
  g.land = () => { const f = g.fly; g.fly = null; let best = null, bd = 1e9; const r0 = Math.max(0, Math.round((f.y - R) / ROWH - g.drop));
    for (let rr = Math.max(0, r0 - 1); rr <= r0 + 1; rr++) { const len = g.len(rr); for (let c = 0; c < len; c++) { if (g.at(rr, c) >= 0 && rr < g.rows.length) continue;
      if (rr > 0 && !g.nb(rr, c).some(([a, b]) => g.at(a, b) >= 0)) continue; const p = g.xy(rr, c), d = (p.x - f.x) ** 2 + (p.y - f.y) ** 2; if (d < bd) { bd = d; best = [rr, c]; } } }
    if (!best) best = [0, Math.max(0, Math.min(COLS - 1, Math.round((f.x - R) / (2 * R))))];
    const [br, bc] = best; g.row(br)[bc] = f.c;
    // 같은 색 무리
    const grp = [[br, bc]], seen = new Set([br + ',' + bc]); for (let i = 0; i < grp.length; i++) g.nb(...grp[i]).forEach(([a, b]) => { const k = a + ',' + b; if (!seen.has(k) && g.at(a, b) === f.c) { seen.add(k); grp.push([a, b]); } });
    let pop = 0, drop = 0;
    if (grp.length >= 3) { grp.forEach(([a, b]) => { const p = g.xy(a, b); g.fx.push({ k: 'pop', x: p.x, y: p.y, c: g.rows[a][b], t: 0 }); g.rows[a][b] = -1; }); pop = grp.length;
      const fl = g.floating(); fl.forEach(([a, b]) => { const p = g.xy(a, b); g.fx.push({ k: 'drop', x: p.x, y: p.y, c: g.rows[a][b], t: 0, vx: (Math.random() - 0.5) * 3, vy: -2 - Math.random() * 2 }); g.rows[a][b] = -1; }); drop = fl.length; }
    while (g.rows.length && !g.rows[g.rows.length - 1].some(v => v >= 0)) g.rows.pop();
    g.score += pop * 10 + (drop ? 10 * Math.pow(2, Math.min(drop, 7)) : 0); g.popped += pop; g.dropped += drop;
    if (drop >= 3 || pop >= 7) g.sent += (drop >= 3 ? 1 + Math.floor((drop - 3) / 4) : 0) + (pop >= 7 ? 1 : 0);
    if (o.stage && !g.count()) { g.clear = true; return { pop, drop, at: f }; }
    if (o.stage && g.shots % stageInfo(o.stage).every === 0) { g.drop++; g.dropNow = true; }
    g.checkOver(); return { pop, drop, at: f }; };
  return g;
}

export function mount(el, ctx) {
  let alive = true, raf = 0, remote = null, mine = null, S = null, G = null, best = {}, prog = {}, mode = 'rec', diff = 'e', stage = 1, dismissed = '', seenId = '', fxDone = '', lastT = 0, paused = false, pending = 0, lastSent = 0, applied = new Set(), ang = 0, turn = 0, pushT = 0, lastSc = '';
  try { const m = localStorage.getItem('capy.bbMode'); if (['rec', 'stage', 'vs'].includes(m)) mode = m; const d = localStorage.getItem('capy.bbDiff'); if (LEVELS[d]) diff = d; } catch {}
  const pid = () => ctx.partnerId, now = () => ctx.store.now(), box = h('div', { class: 'bb' }); el.append(box);
  const pickS = () => { S = mine && mine.id !== dismissed ? mine : remote && remote.id !== dismissed ? remote : null; };
  const them = () => (S && S.kind === 'vs' && pid() ? (S.sc || {})[pid()] : null);
  const phase = () => { if (!S) return 'lobby'; if (now() < S.startAt) return 'ready'; if (S.id !== seenId) return 'lobby'; const o = them(); return (G && (G.over || G.clear)) || (S.kind === 'vs' && o && o.dead) ? 'result' : 'play'; };
  const cleared = () => (prog[ctx.uid] || 0);
  const opts = s => (s.kind === 'stage' ? { stage: s.stage, colors: stageInfo(s.stage).colors } : { colors: LEVELS[s.diff].colors });

  // 구슬 그림(색 동그라미 + 동물 얼굴 + 반짝임)을 미리 만들어 둔다
  const DPR = Math.min(3, window.devicePixelRatio || 1), sprites = COLORS.map(([col, ai]) => { const c = document.createElement('canvas'), s = Math.ceil(R * 2 * DPR); c.width = c.height = s; const g2 = c.getContext('2d'); g2.scale(DPR, DPR);
    const gr = g2.createRadialGradient(R * 0.7, R * 0.6, R * 0.2, R, R, R); gr.addColorStop(0, '#fff'); gr.addColorStop(0.25, col); gr.addColorStop(1, col);
    g2.fillStyle = gr; g2.beginPath(); g2.arc(R, R, R - 1, 0, 7); g2.fill(); g2.lineWidth = 1.6; g2.strokeStyle = 'rgba(60,40,30,.55)'; g2.stroke();
    const im = new Image(); im.onload = () => { g2.save(); g2.beginPath(); g2.arc(R, R, R - 2.5, 0, 7); g2.clip(); g2.drawImage(im, R * 0.2, R * 0.28, R * 1.6, R * 1.49); g2.restore(); g2.fillStyle = 'rgba(255,255,255,.55)'; g2.beginPath(); g2.ellipse(R * 0.62, R * 0.45, R * 0.28, R * 0.16, -0.6, 0, 7); g2.fill(); };
    svgUrl(animalSvg(ai)).then(u => { im.src = u; }); return c; });
  // 힉스필드로 그린 수정 구슬·놀이공원 배경·발사대(그림이 오기 전에는 위에서 그린 구슬을 쓴다)
  const ART = { balls: COLORS.map((_, i) => { const im = new Image(); im.src = `img/bubble/b${i}.webp`; return im; }), bg: Object.assign(new Image(), { src: 'img/bubble/bg.webp' }), gun: Object.assign(new Image(), { src: 'img/bubble/gun.webp' }) };
  const ok = im => im.complete && im.naturalWidth > 0;
  let capyIm = null; { const im = new Image(); im.onload = () => { capyIm = im; }; capyUrlReady(ctx.capyOf(ctx.uid, { face: 'happy' })).then(u => { im.src = u; }); }

  function lobby() {
    const chip = (on, label, fn, sub) => h('button', { class: 'bg-chip' + (on ? ' on' : ''), onClick: fn }, h('b', null, label), sub && h('small', null, sub));
    const save = () => { try { localStorage.setItem('capy.bbMode', mode); localStorage.setItem('capy.bbDiff', diff); } catch {} }, set = (k, v) => { if (k === 'mode') mode = v; else diff = v; save(); lobby(); };
    const key = `${diff}-${ctx.uid}`, b = best[key], pb = pid() && best[`${diff}-${pid()}`], top = cleared();
    if (stage > top + 1) stage = top + 1; if (stage > STAGES) stage = STAGES;
    box.replaceChildren(...[
      h('div', { class: 'tt-hero bb-hero' }, h('span', { class: 'bb-hero-ic' }, ...[0, 2, 3].map(i => h('canvas', { width: sprites[i].width, height: sprites[i].height, class: 'bb-dot' }))), h('div', null, h('b', null, '카피 버블'), h('small', null, '같은 동물 구슬 3개를 붙이면 펑!'))),
      h('label', { class: 'lbl' }, '모드'),
      h('div', { class: 'bg-row' }, chip(mode === 'rec', '🏆 기록', () => set('mode', 'rec'), '하·중·상'), chip(mode === 'stage', '🗺️ 스테이지', () => set('mode', 'stage'), `${Math.min(top, STAGES)} / ${STAGES} 클리어`), chip(mode === 'vs', '⚔️ 경쟁', () => set('mode', 'vs'), pid() ? ctx.nameOf(pid()) + '와 대결' : '상대 없음')),
      mode === 'rec' && h('label', { class: 'lbl' }, '난이도'),
      mode === 'rec' && h('div', { class: 'bg-row' }, Object.entries(LEVELS).map(([k, v]) => chip(diff === k, v.name, () => set('diff', k), v.sub))),
      mode === 'stage' && h('label', { class: 'lbl' }, '단계 고르기'),
      mode === 'stage' && h('div', { class: 'bb-stages' }, Array.from({ length: STAGES }, (_, i) => i + 1).map(s => h('button', { class: 'bb-st' + (s === stage ? ' on' : '') + (s > top + 1 ? ' lock' : '') + (s <= top ? ' done' : '') + (s >= 15 ? ' hard' : ''), disabled: s > top + 1, onClick: () => { stage = s; lobby(); } }, s > top + 1 ? '🔒' : String(s)))),
      h('p', { class: 'dim bg-note' + (mode === 'vs' && !pid() ? ' warn' : '') }, mode === 'vs' ? (pid() ? `시작하면 ${ctx.nameOf(pid())} 화면에서도 같이 시작돼요. 구슬을 한 번에 많이 떨어뜨리면 상대 판에 줄이 하나 더 내려가요. 먼저 선 아래까지 내려오면 져요.` : '상대가 아직 방에 없어요. 기록이나 스테이지를 골라 주세요')
        : mode === 'stage' ? `${stage}단계 · 동물 ${stageInfo(stage).colors}종 · ${stageInfo(stage).every}번 쏠 때마다 천장이 내려와요${stage >= 15 ? ' · 🔥 고난도' : ''}. 구슬을 모두 없애면 클리어!` : `시간이 갈수록 위에서 새 줄이 점점 더 빨리 내려와요. 선 아래까지 내려오면 끝!`),
      h('button', { class: 'btn primary big', disabled: mode === 'vs' && !pid(), onClick: start }, mode === 'stage' ? `${stage}단계 시작` : '시작'),
      h('p', { class: 'dim center' }, '판을 손가락으로 끌어서 겨누고, 떼면 발사! 아래 ◀ ▶ 로 겨누고 발사 버튼을 눌러도 돼요. 벽에 튕겨서 맞힐 수도 있어요.'),
      mode === 'rec' && (b || pb) && h('p', { class: 'dim center' }, [b && `내 최고 ${b.s.toLocaleString()}점`, pb && `${ctx.nameOf(pid())} 최고 ${pb.s.toLocaleString()}점`].filter(Boolean).join(' · '))].filter(Boolean));
    box.querySelectorAll('.bb-dot').forEach((c, k) => c.getContext('2d').drawImage(sprites[[0, 2, 3][k]], 0, 0));
  }
  function start() {
    const run = { id: Math.random().toString(36).slice(2, 9), kind: mode, diff: mode === 'vs' ? 'm' : diff, stage: mode === 'stage' ? stage : null, seed: Math.floor(Math.random() * 1e6), startAt: now() + (mode === 'vs' ? 3200 : 1200), by: ctx.uid };
    if (mode === 'stage') run.seed = stage * 7919 + 13;
    dismissed = ''; G = null;
    if (mode === 'vs') { if (!pid()) return toast('상대가 없어요'); mine = null; ctx.store.set(PATH, run).catch(() => toast('시작하지 못했어요')); return; }
    mine = run; pickS(); paint();
  }

  // ----- 그리기 -----
  let cv, cx, topEl, keysEl;
  function build() {
    cv = h('canvas', { class: 'bb-board', width: Math.round(W * DPR), height: Math.round(H * DPR) }); cx = cv.getContext('2d'); topEl = h('div', { class: 'tt-top' });
    const IC = { l: '<svg viewBox="0 0 40 40"><path d="M26 7 L11 20 L26 33" fill="none" stroke="currentColor" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/></svg>', r: '<svg viewBox="0 0 40 40"><path d="M14 7 L29 20 L14 33" fill="none" stroke="currentColor" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/></svg>',
      fire: '<svg viewBox="0 0 40 40"><circle cx="20" cy="22" r="13" fill="none" stroke="currentColor" stroke-width="3.5"/><circle cx="20" cy="22" r="5" fill="currentColor"/><path d="M20 2v8M20 34v4M4 22h-2M38 22h-2" stroke="currentColor" stroke-width="3.5" stroke-linecap="round"/></svg>' };
    const hold = (label, cls, fn) => { const b = h('button', { class: 'bb-key ' + cls, 'aria-label': label }, h('span', { class: 'bb-ic', html: IC[cls] })); let iv = 0; const stop = () => { clearInterval(iv); b.classList.remove('on'); };
      b.addEventListener('pointerdown', e => { e.preventDefault(); b.classList.add('on'); fn(); iv = setInterval(fn, 30); }); ['pointerup', 'pointerleave', 'pointercancel'].forEach(n => b.addEventListener(n, stop)); return b; };
    keysEl = h('div', { class: 'bb-keys' }, hold('왼쪽으로 겨누기', 'l', () => { ang = Math.max(-1.35, ang - 0.035); }), h('button', { class: 'bb-key fire', 'aria-label': '발사', onClick: fire }, h('span', { class: 'bb-ic', html: IC.fire }), h('b', null, '발사')), hold('오른쪽으로 겨누기', 'r', () => { ang = Math.min(1.35, ang + 0.035); }));
    box.replaceChildren(topEl, h('div', { class: 'bb-play' }, cv), keysEl); aimTouch(cv); drawTop(); requestAnimationFrame(fit);
  }
  // 점수칸·게임판·버튼이 한 화면에 다 들어오게 판 크기를 맞춘다
  function fit() { if (!cv || !cv.isConnected) return; window.scrollTo(0, 0); const top = cv.getBoundingClientRect().top, room = window.innerHeight - top - keysEl.offsetHeight - 14, w = Math.max(220, Math.min(box.clientWidth, 520, room * W / H)); cv.style.width = w + 'px'; keysEl.style.maxWidth = Math.max(w, 300) + 'px'; }
  window.addEventListener('resize', fit);
  // 손가락으로는 겨누기만 하고, 발사는 발사 버튼으로만 한다
  function aimTouch(c) { let on = false;
    const set = e => { const rc = c.getBoundingClientRect(), x = (e.clientX - rc.left) / rc.width * W, y = (e.clientY - rc.top) / rc.height * H; if (y > GUN.y - 8) return false; ang = Math.max(-1.35, Math.min(1.35, Math.atan2(x - GUN.x, GUN.y - y))); return true; };
    c.addEventListener('pointerdown', e => { e.preventDefault(); try { c.setPointerCapture(e.pointerId); } catch {} on = set(e); });
    c.addEventListener('pointermove', e => { if (on) set(e); });
    c.addEventListener('pointerup', e => { if (on) set(e); on = false; }); c.addEventListener('pointercancel', () => { on = false; }); }
  function fire() { if (!G || paused || phase() !== 'play') return; if (G.shoot(ang)) sfx('bshoot'); }
  const drawBall = (c, x, y, s = 1, a = 1) => { cx.globalAlpha = a; const im = ART.balls[c]; if (ok(im)) cx.drawImage(im, x - R * s * 1.04, y - R * s * 1.04, R * 2.08 * s, R * 2.08 * s); else cx.drawImage(sprites[c], x - R * s, y - R * s, R * 2 * s, R * 2 * s); cx.globalAlpha = 1; };
  function drawBoard() {
    const g = G; cx.setTransform(DPR, 0, 0, DPR, 0, 0);
    // 바탕: 연한 체크무늬 + 나무 테두리
    if (ok(ART.bg)) { const ir = ART.bg.naturalWidth / ART.bg.naturalHeight, bw = Math.max(W, H * ir); cx.drawImage(ART.bg, (W - bw) / 2, 0, bw, bw / ir); } else { cx.fillStyle = '#EFE4FF'; cx.fillRect(0, 0, W, H); cx.fillStyle = '#E4D6FA'; for (let y = 0; y < LINE_Y; y += 20) for (let x = (y / 20) % 2 * 20; x < W; x += 40) cx.fillRect(x, y, 20, 20); }
    if (g.drop) { cx.fillStyle = '#C9A27A'; cx.fillRect(0, 0, W, g.drop * ROWH); cx.fillStyle = '#B48A5E'; for (let x = 6; x < W; x += 28) cx.fillRect(x, 4, 16, g.drop * ROWH - 8); cx.fillStyle = '#8A5A2B'; cx.fillRect(0, g.drop * ROWH - 4, W, 4); }
    const warn = S.kind === 'stage' ? stageInfo(S.stage).every - (g.shots % stageInfo(S.stage).every) <= 2 : pushT > (pushMs() - 1800);
    const shake = warn && !paused ? Math.sin(performance.now() / 40) * 1.4 : 0;
    g.each((rr, c, v) => { const p = g.xy(rr, c); drawBall(v, p.x + shake, p.y); });
    // 선
    cx.strokeStyle = 'rgba(229,72,77,.6)'; cx.setLineDash([8, 6]); cx.lineWidth = 2; cx.beginPath(); cx.moveTo(0, LINE_Y); cx.lineTo(W, LINE_Y); cx.stroke(); cx.setLineDash([]);
    cx.fillStyle = 'rgba(255,246,228,.82)'; cx.fillRect(0, LINE_Y + 2, W, H - LINE_Y); cx.fillStyle = '#E2C49A'; cx.fillRect(0, LINE_Y + 2, W, 3);
    // 겨냥선: 벽에 한 번 튕기는 데까지(난이도가 높을수록 짧다)
    const guide = S.kind === 'stage' ? stageInfo(S.stage).guide : LEVELS[S.diff].guide; { let x = GUN.x, y = GUN.y, vx = Math.sin(ang), vy = -Math.cos(ang), left = 520 * guide; cx.fillStyle = 'rgba(90,60,140,.45)';
      for (let d = 0; d < left; d += 14) { x += vx * 14; y += vy * 14; if (x < R) { x = 2 * R - x; vx = -vx; } if (x > W - R) { x = 2 * (W - R) - x; vx = -vx; } if (y < R + g.drop * ROWH) break; let hitB = false; g.each((rr, c) => { if (!hitB) { const p = g.xy(rr, c); hitB = (p.x - x) ** 2 + (p.y - y) ** 2 < (R * 1.75) ** 2; } }); if (hitB) break; cx.beginPath(); cx.arc(x, y, 2.6, 0, 7); cx.fill(); } }
    // 발사대: 화살과 카피바라
    cx.save(); cx.translate(GUN.x, GUN.y); if (!ok(ART.gun)) { cx.fillStyle = '#B5793C'; cx.beginPath(); cx.arc(0, 0, 30, Math.PI, 0); cx.fill(); cx.strokeStyle = '#8A5A2B'; cx.lineWidth = 3; cx.stroke(); }
    cx.rotate(ang); cx.fillStyle = '#F2C230'; cx.strokeStyle = '#8A5A00'; cx.lineWidth = 2; cx.beginPath(); cx.moveTo(-5, 0); cx.lineTo(-5, -46); cx.lineTo(-11, -46); cx.lineTo(0, -62); cx.lineTo(11, -46); cx.lineTo(5, -46); cx.lineTo(5, 0); cx.closePath(); cx.fill(); cx.stroke(); cx.restore();
    if (ok(ART.gun)) cx.drawImage(ART.gun, GUN.x - 34, GUN.y - 13, 68, 68 * ART.gun.naturalHeight / ART.gun.naturalWidth);
    if (!g.fly && !g.over) drawBall(g.cur, GUN.x, GUN.y);
    drawBall(g.next, 34, H - 26, 0.8); cx.fillStyle = '#7A5A9A'; cx.font = '800 11px sans-serif'; cx.textAlign = 'center'; cx.fillText('다음', 34, H - 48);
    if (capyIm) cx.drawImage(capyIm, W - 76, H - 74, 62, 81);
    if (g.fly) drawBall(g.fly.c, g.fly.x, g.fly.y);
    g.fx.forEach(f => { if (f.k === 'pop') drawBall(f.c, f.x, f.y, 1 + f.t * 0.6, Math.max(0, 1 - f.t * 2.2)); else drawBall(f.c, f.x, f.y, 1, Math.max(0, 1 - f.t * 0.6)); });
    if (pending > 0) { cx.fillStyle = 'rgba(229,72,77,.9)'; cx.font = '800 13px sans-serif'; cx.textAlign = 'left'; cx.fillText(`⚠ 방해 ${pending}줄`, 8, LINE_Y + 20); }
    if (paused) { cx.fillStyle = 'rgba(40,30,60,.6)'; cx.fillRect(0, 0, W, H); cx.fillStyle = '#fff'; cx.font = '800 22px sans-serif'; cx.textAlign = 'center'; cx.fillText('잠깐 멈춤', W / 2, H / 2); }
  }
  function drawTop() { if (!topEl || !G) return; const o = them();
    topEl.replaceChildren(h('b', null, `${G.score.toLocaleString()}점`), h('span', null, S.kind === 'vs' ? (o ? `${ctx.nameOf(pid())} ${(o.s || 0).toLocaleString()}점` : '상대를 기다리는 중…') : S.kind === 'stage' ? `${S.stage}단계 · 남은 구슬 ${G.count()}` : `${LEVELS[S.diff].name} · 기록`),
      h('button', { class: 'bg-book', 'aria-label': '멈춤', onClick: () => { if (S.kind === 'vs') return toast('경쟁 중에는 멈출 수 없어요'); paused = !paused; drawBoard(); } }, paused ? '▶' : '⏸'),
      h('button', { class: 'bg-book quit', 'aria-label': '그만하기', onClick: giveUp }, '🏳️')); }
  const pushMs = () => Math.max(3500, LEVELS[S.diff || 'm'].ms * Math.pow(0.975, G.pushes));
  function report(force) { if (!S || S.kind !== 'vs' || !G) return; const v = `${G.score}|${G.over}`; if (v === lastSc && !force) return; lastSc = v; ctx.store.update(`${PATH}/sc/${ctx.uid}`, { s: G.score, dead: G.over || null }).catch(() => {}); }
  function giveUp() { if (!G || G.over) return; modal({ title: '🏳️ 여기서 그만할까요?', body: h('p', { class: 'center' }, S.kind === 'vs' ? '그만하면 이 판은 져요.' : '지금 점수로 끝나요.'), actions: [{ label: '계속하기' }, { label: '그만하기', danger: true, onClick: c => { c(); if (G) { G.over = true; report(true); paint(); } } }] }); }
  function loop(ts) {
    if (!alive) return; raf = requestAnimationFrame(loop);
    const ph = phase(); if (ph !== lastPh) return paint();
    if (ph === 'ready') { const e = box.querySelector('.bg-count'); if (e) { const n = String(Math.max(1, Math.ceil((S.startAt - now()) / 1000))); if (e.firstChild.textContent !== n) e.firstChild.textContent = n; } return; }
    if (ph !== 'play' || !G) { lastT = 0; return; }
    const dt = lastT ? Math.min(80, ts - lastT) : 0; lastT = ts; if (paused || document.hidden) return drawBoard();
    const res = G.step();
    if (res) { sfx(res.pop ? 'bpop' : 'bstick'); if (res.drop) setTimeout(() => sfx('bdrop'), 120);
      if (res.drop >= 3) toast(`우수수! ${res.drop}개 떨어뜨렸어요 +${10 * Math.pow(2, Math.min(res.drop, 7))}`, 1200);
      if (S.kind === 'vs') { if (G.sent > lastSent && pid()) ctx.store.push(PATH + '/atk', { to: pid(), n: G.sent - lastSent, id: S.id }).catch(() => {}); lastSent = G.sent;
        if (!res.pop && pending > 0) { for (let i = 0; i < pending; i++) G.push(); pending = 0; sfx('bad'); } }
      if (G.dropNow) { G.dropNow = false; sfx('bceil'); }
      drawTop(); report(); if (G.over || G.clear) { report(true); return paint(); } }
    if (S.kind !== 'stage') { pushT += dt; if (pushT >= pushMs()) { pushT = 0; G.push(); sfx('bceil'); drawTop(); if (G.over) { report(true); return paint(); } } }
    G.fx = G.fx.filter(f => { f.t += dt / 1000; if (f.k === 'drop') { f.vy += 0.5; f.x += f.vx; f.y += f.vy; } return f.t < (f.k === 'pop' ? 0.5 : 1.6) && f.y < H + R; });
    drawBoard();
  }
  let lastPh = '';
  function result() {
    const o = them(), vs = S.kind === 'vs', st = S.kind === 'stage', my = G ? G.score : 0, key = `${S.diff}-${ctx.uid}`, prev = best[key], won = vs && o ? !(G && G.over) : null, clr = st && G && G.clear;
    if (fxDone !== S.id) { fxDone = S.id; sfx(won === false || (st && !clr) ? 'lose' : 'win');
      if (st) { if (clr) { const pay = PAY.bubbleStage(S.stage); ctx.earn(pay, '카피 버블', [`${S.stage}단계 클리어 보상 ${pay}코인${S.stage >= 15 ? ' (고난도)' : ''}`]); if (S.stage > cleared()) ctx.store.set(`games/bubbleStage/${ctx.uid}`, S.stage).catch(() => {}); gameFx('win', `${S.stage}단계 클리어!`); }
        else gameFx('lose', `${S.stage}단계 실패`); }
      else { const pay = PAY.bubble(my, S.diff), bl = [`${LEVELS[S.diff].name} 단계: 내 점수 ${my}점 → ${pay}코인`];
        if (vs && o) { ctx.earnMatch(pay + (won ? 120 : 0), '카피 버블', won ? [...bl, '승리 보너스 +120코인'] : bl, won ? 'win' : 'lose', 'bubble', true); gameFx(won ? 'win' : 'lose', `${my.toLocaleString()} : ${(o.s || 0).toLocaleString()}`); }
        else { ctx.earn(pay, '카피 버블', bl); if (my > 0) gameFx('win', `${my.toLocaleString()}점${prev && my > prev.s ? ' 신기록' : ''}`); }
        if (!vs && my > 0 && (!prev || my > prev.s)) ctx.store.tx('games/bubbleBest/' + key, c => (c && c.s >= my ? undefined : { s: my, at: now() })).catch(() => {}); } }
    const again = () => { dismissed = S.id; if (mine && mine.id === S.id) mine = null; G = null; pickS(); };
    box.replaceChildren(h('div', { class: 'bg-end' }, ...[h('span', { class: 'bb-end-ic' }, '🫧'), h('b', null, st ? (clr ? `${S.stage}단계 클리어!` : `${S.stage}단계 실패…`) : vs && o ? (won ? '이겼어요!' : '졌어요…') : '끝!'),
      h('p', { class: 'bg-big' }, `${my.toLocaleString()}점`), h('p', { class: 'dim' }, `터뜨린 구슬 ${G ? G.popped : 0}개 · 떨어뜨린 구슬 ${G ? G.dropped : 0}개`),
      vs && h('p', null, o ? `${ctx.nameOf(pid())} ${(o.s || 0).toLocaleString()}점` : '상대가 이 판에 들어오지 않았어요'),
      !vs && !st && h('p', { class: 'dim' }, `내 최고 기록 ${Math.max(prev ? prev.s : 0, my).toLocaleString()}점`),
      st && clr && S.stage < STAGES && h('button', { class: 'btn primary big', onClick: () => { stage = S.stage + 1; mode = 'stage'; again(); start(); } }, `${S.stage + 1}단계로`),
      st && clr && S.stage === STAGES && h('p', null, '🏆 30단계를 모두 깼어요!'),
      st && !clr && h('button', { class: 'btn primary big', onClick: () => { stage = S.stage; again(); start(); } }, '다시 도전'),
      h('button', { class: 'btn' + (st ? '' : ' primary big'), onClick: () => { again(); paint(); } }, st ? '단계 고르기' : '다시 하기')].filter(Boolean)));
  }
  function paint() {
    if (!alive) return; pickS(); if (S && S.kind === 'vs' && S.id !== seenId && now() - S.startAt > 4000) { dismissed = S.id; pickS(); }
    if (S && (!G || G.id !== S.id) && S.id !== seenId) { seenId = S.id; G = makeGame(S.seed, opts(S)); G.id = S.id; pending = 0; lastSent = 0; lastSc = ''; paused = false; applied = new Set(); ang = 0; pushT = 0; build(); report(true); }
    const ph = phase(); lastPh = ph;
    if (ph === 'lobby') return lobby();
    if (ph === 'result') return result();
    if (!cv || !cv.isConnected) build();
    drawTop(); drawBoard();
    const old = box.querySelector('.bg-count'); if (ph === 'ready') { if (!old) box.querySelector('.bb-play').append(h('div', { class: 'bg-count tt-count' }, String(Math.max(1, Math.ceil((S.startAt - now()) / 1000))), h('small', null, S.kind === 'stage' ? `${S.stage}단계` : '준비…'))); } else if (old) old.remove();
  }

  const kd = e => { if (!G || phase() !== 'play') return; if (e.key === 'ArrowLeft') ang = Math.max(-1.35, ang - 0.06); else if (e.key === 'ArrowRight') ang = Math.min(1.35, ang + 0.06); else if (e.key === ' ' || e.key === 'ArrowUp') fire(); else return; e.preventDefault(); };
  window.addEventListener('keydown', kd);
  const offs = [
    ctx.store.on(PATH, v => { remote = v && v.kind === 'vs' ? v : null; pickS();
      if (S && S.kind === 'vs' && G && S.id === G.id && S.atk) Object.entries(S.atk).forEach(([k, a]) => { if (!applied.has(k)) { applied.add(k); if (a && a.to === ctx.uid && a.id === S.id) { pending += a.n || 0; sfx('hang'); } } });
      if (G && S && S.id === G.id && lastPh === 'play' && phase() === 'play') return drawTop();
      paint(); }),
    ctx.store.on('games/bubbleBest', v => { best = v || {}; if (phase() === 'lobby') lobby(); }),
    ctx.store.on('games/bubbleStage', v => { prog = v || {}; if (phase() === 'lobby') lobby(); }),
  ];
  paint(); raf = requestAnimationFrame(loop);
  return () => { alive = false; cancelAnimationFrame(raf); window.removeEventListener('keydown', kd); window.removeEventListener('resize', fit); offs.forEach(f => f()); };
}
