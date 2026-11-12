// 차례대로 두는 게임 3종: 오목, 유자 사목, 짝 맞추기
import { h, toast, ask } from './ui.js';
import { capy, yuzuSvg } from './capy.js';

const stone = who => who === 0 ? capy({ color: 'brown', face: 'smile', head: true }) : yuzuSvg;
const who = (ctx, i) => ctx.order[i] ? ctx.nameOf(ctx.order[i]) : '상대';

function statusLine(ctx, s, solo, names = ['카피 돌', '유자 돌']) {
  if (s.win === 2) return '비겼어요!';
  if (s.win === 0 || s.win === 1) return solo ? `${names[s.win]} 승리!` : (s.win === ctx.idx ? '이겼다! 🎉' : `${who(ctx, s.win)} 승리`);
  return solo ? `${names[s.turn]} 차례 (혼자 두는 중)` : (s.turn === ctx.idx ? '내 차례' : `${who(ctx, s.turn)} 차례`);
}
function lineWin(b, w, hgt, i, p, need) {
  const x = i % w, y = (i - x) / w;
  for (const [dx, dy] of [[1, 0], [0, 1], [1, 1], [1, -1]]) {
    let n = 1;
    for (const sg of [1, -1]) for (let k = 1; k < need; k++) { const nx = x + dx * k * sg, ny = y + dy * k * sg; if (nx < 0 || ny < 0 || nx >= w || ny >= hgt || b[ny * w + nx] !== String(p)) break; n++; }
    if (n >= need) return true;
  }
  return false;
}
function frame(el, ctx, path, fresh, drawBoard, legend) {
  const status = h('div', { class: 'g-status' }), board = h('div', { class: 'g-board' });
  const solo = () => ctx.order.length < 2;
  let s = null;
  const reset = () => ctx.store.set(path, fresh(s ? 1 - (s.first || 0) : 0));
  el.append(status, board, h('div', { class: 'g-foot' }, h('span', { class: 'dim' }, legend(ctx)),
    h('button', { class: 'btn', onClick: () => (s && s.win < 0 && s.n > 0 ? ask('지금 판을 버리고 새로 할까요?', '새 게임') : Promise.resolve(true)).then(y => y && reset()) }, '새 게임')));
  const off = ctx.store.on(path, v => {
    if (!v) { s = s && !s.n && s.win < 0 ? s : fresh(0); ctx.store.tx(path, c => c || s); } else s = v;
    status.textContent = statusLine(ctx, s, solo());
    status.className = 'g-status' + (s.win >= 0 ? ' end' : (solo() || s.turn === ctx.idx) ? ' my' : '');
    drawBoard(board, s, solo());
  });
  return () => off();
}
const myTurn = (ctx, s, solo) => s.win < 0 && (solo || s.turn === ctx.idx);
const legend2 = ctx => ctx.order.length < 2 ? '상대가 들어오면 둘이 둘 수 있어요' : `나는 ${ctx.idx === 0 ? '카피 돌' : '유자 돌'}`;
const legendOmok = ctx => legend2(ctx) + ' · 쌍삼 금지';

/* ----- 오목 ----- */
// 쌍삼: 한 수로 '열린 삼'이 두 줄 이상 생기는 자리. 다섯이 되는 수는 예외로 둘 수 있다.
const ON = 15;
const at = (b, x, y) => (x < 0 || y < 0 || x >= ON || y >= ON) ? '#' : b[y * ON + x];
function runEnds(b, x, y, dx, dy, p) { let a = 1, c = 1; while (at(b, x + dx * a, y + dy * a) === p) a++; while (at(b, x - dx * c, y - dy * c) === p) c++; return [a + c - 1, at(b, x + dx * a, y + dy * a), at(b, x - dx * c, y - dy * c)]; }
function openThree(b, x, y, dx, dy, p) {
  if (runEnds(b, x, y, dx, dy, p)[0] >= 4) return false;
  for (let k = -4; k <= 4; k++) {
    const ex = x + dx * k, ey = y + dy * k; if (!k || at(b, ex, ey) !== '.') continue;
    const j = ey * ON + ex, b2 = b.slice(0, j) + p + b.slice(j + 1), [n, e1, e2] = runEnds(b2, x, y, dx, dy, p);
    if (n === 4 && e1 === '.' && e2 === '.') return true; // 한 수 더 두면 양쪽이 열린 넷이 된다
  }
  return false;
}
export function doubleThree(b, i, who) {
  if (b[i] !== '.') return false;
  const p = String(who), x = i % ON, y = (i - x) / ON, b2 = b.slice(0, i) + p + b.slice(i + 1);
  if (lineWin(b2, ON, ON, i, who, 5)) return false;
  return [[1, 0], [0, 1], [1, 1], [1, -1]].filter(([dx, dy]) => openThree(b2, x, y, dx, dy, p)).length >= 2;
}

export const omok = { mount(el, ctx) {
  const N = 15, path = 'games/omok', P = 10, C = 20, S = P * 2 + C * (N - 1);
  let ghost = -1, cur = null;
  const fresh = first => ({ b: '.'.repeat(N * N), turn: first, first, last: -1, win: -1, n: 0 });
  const put = i => ctx.store.tx(path, s => {
    s = s || fresh(0); if (s.win >= 0 || s.b[i] !== '.' || (ctx.order.length > 1 && s.turn !== ctx.idx) || doubleThree(s.b, i, s.turn)) return;
    const b = s.b.slice(0, i) + s.turn + s.b.slice(i + 1);
    return { ...s, b, last: i, n: s.n + 1, win: lineWin(b, N, N, i, s.turn, 5) ? s.turn : b.includes('.') ? -1 : 2, turn: 1 - s.turn };
  });
  const pos = i => [P + (i % N) * C, P + Math.floor(i / N) * C];
  const st = (i, p, extra = '') => { const [x, y] = pos(i); return p === 0
    ? `<g ${extra}><circle cx="${x}" cy="${y}" r="9" fill="#9B6B45" stroke="#5F3F2B"/><circle cx="${x - 3}" cy="${y - 1.5}" r="1.1" fill="#2a1a10"/><circle cx="${x + 3}" cy="${y - 1.5}" r="1.1" fill="#2a1a10"/><ellipse cx="${x}" cy="${y + 2.4}" rx="2.6" ry="1.7" fill="#2a1a10"/></g>`
    : `<g ${extra}><circle cx="${x}" cy="${y}" r="9" fill="#FFD04A" stroke="#D99A14"/><path d="M${x} ${y - 8}q-5 -4 -8 0q4 3 8 0z" fill="#6FB24F"/></g>`; };
  function draw() {
    const { board, s, solo } = cur;
    if (ghost >= 0 && (s.b[ghost] !== '.' || !myTurn(ctx, s, solo))) ghost = -1;
    let g = `<rect width="${S}" height="${S}" rx="8" fill="#E9C48A"/>`;
    for (let k = 0; k < N; k++) g += `<path d="M${P} ${P + k * C}H${S - P}M${P + k * C} ${P}V${S - P}" stroke="#9A7445" stroke-width=".7"/>`;
    for (const k of [3, 7, 11]) for (const j of [3, 7, 11]) g += `<circle cx="${P + k * C}" cy="${P + j * C}" r="1.6" fill="#9A7445"/>`;
    for (let i = 0; i < N * N; i++) if (s.b[i] !== '.') g += st(i, Number(s.b[i]));
    if (s.last >= 0) { const [x, y] = pos(s.last); g += `<circle cx="${x}" cy="${y}" r="11.5" fill="none" stroke="#E5484D" stroke-width="1.6"/>`; }
    if (ghost >= 0) g += st(ghost, s.turn, 'opacity=".55"');
    const svg = h('div', { class: 'omok', html: `<svg viewBox="0 0 ${S} ${S}">${g}</svg>` });
    svg.addEventListener('click', e => {
      if (!myTurn(ctx, s, solo)) return toast(s.win >= 0 ? '끝난 판이에요. 새 게임을 눌러 주세요' : '상대 차례예요');
      const r = svg.firstChild.getBoundingClientRect(), x = Math.round(((e.clientX - r.left) / r.width * S - P) / C), y = Math.round(((e.clientY - r.top) / r.height * S - P) / C);
      if (x < 0 || y < 0 || x >= N || y >= N) return; const i = y * N + x; if (s.b[i] !== '.') return;
      if (doubleThree(s.b, i, s.turn)) return toast('쌍삼 자리라 둘 수 없어요');
      if (ghost === i) { ghost = -1; return put(i); }
      ghost = i; draw();
    });
    board.replaceChildren(svg, h('div', { class: 'center' }, h('button', { class: 'btn primary', disabled: ghost < 0, onClick: () => { const i = ghost; ghost = -1; put(i); } }, ghost < 0 ? '놓을 자리를 눌러 주세요' : '여기에 놓기')));
  }
  return frame(el, ctx, path, fresh, (board, s, solo) => { cur = { board, s, solo }; draw(); }, legendOmok);
} };

/* ----- 유자 사목 ----- */
export const four = { mount(el, ctx) {
  const W = 7, H = 6, path = 'games/four';
  const fresh = first => ({ b: '.'.repeat(W * H), turn: first, first, last: -1, win: -1, n: 0 });
  const drop = c => ctx.store.tx(path, s => {
    s = s || fresh(0); if (s.win >= 0 || (ctx.order.length > 1 && s.turn !== ctx.idx)) return;
    let r = H - 1; while (r >= 0 && s.b[r * W + c] !== '.') r--; if (r < 0) return;
    const i = r * W + c, b = s.b.slice(0, i) + s.turn + s.b.slice(i + 1);
    return { ...s, b, last: i, n: s.n + 1, win: lineWin(b, W, H, i, s.turn, 4) ? s.turn : b.includes('.') ? -1 : 2, turn: 1 - s.turn };
  });
  return frame(el, ctx, path, fresh, (board, s, solo) => {
    board.replaceChildren(h('div', { class: 'four' }, [...s.b].map((ch, i) => h('button', { class: 'slot' + (i === s.last ? ' last' : ''), 'aria-label': (i % W + 1) + '번 줄',
      onClick: () => myTurn(ctx, s, solo) ? drop(i % W) : toast(s.win >= 0 ? '끝난 판이에요. 새 게임을 눌러 주세요' : '상대 차례예요') }, ch !== '.' && h('span', { class: 'pc drop', html: stone(Number(ch), ctx) })))));
  }, legend2);
} };

/* ----- 짝 맞추기 ----- */
const CARDS = [['brown', 'yuzu', 'smile'], ['cream', 'flower', 'happy'], ['choco', 'ribbon', 'wink'], ['peach', 'towel', 'sleepy'], ['brown', 'leaf', 'love'], ['cream', 'none', 'wow'], ['choco', 'yuzu', 'happy'], ['peach', 'flower', 'sad']];
export const match = { mount(el, ctx) {
  const path = 'games/match'; let timer = null;
  const fresh = first => { const a = [...'0011223344556677']; for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return { cards: a.join(''), got: '.'.repeat(16), o1: -1, o2: -1, turn: first, first, win: -1, n: 0 }; };
  const flip = i => ctx.store.tx(path, s => {
    if (!s || s.win >= 0 || s.o2 >= 0 || s.got[i] !== '.' || i === s.o1 || (ctx.order.length > 1 && s.turn !== ctx.idx)) return;
    if (s.o1 < 0) return { ...s, o1: i, n: s.n + 1 };
    if (s.cards[s.o1] !== s.cards[i]) return { ...s, o2: i, n: s.n + 1 };
    const g = [...s.got]; g[s.o1] = g[i] = String(s.turn); const got = g.join('');
    const c0 = g.filter(x => x === '0').length, c1 = g.filter(x => x === '1').length;
    return { ...s, got, o1: -1, o2: -1, n: s.n + 1, win: got.includes('.') ? -1 : c0 === c1 ? 2 : c0 > c1 ? 0 : 1 };
  });
  const off = frame(el, ctx, path, fresh, (board, s, solo) => {
    clearTimeout(timer);
    if (s.o2 >= 0) { const n = s.n; timer = setTimeout(() => ctx.store.tx(path, c => c && c.n === n && c.o2 >= 0 ? { ...c, o1: -1, o2: -1, turn: 1 - c.turn, n: c.n + 1 } : undefined), 1100); }
    const cnt = p => [...s.got].filter(x => x === String(p)).length / 2;
    board.replaceChildren(
      h('div', { class: 'match-score' }, [0, 1].map(p => h('span', { class: s.turn === p && s.win < 0 ? 'on' : '' }, ctx.order[p] ? ctx.nameOf(ctx.order[p]) : (p ? '둘째' : '첫째'), ' ', h('b', null, cnt(p))))),
      h('div', { class: 'match' }, [...s.cards].map((c, i) => { const up = s.got[i] !== '.' || i === s.o1 || i === s.o2, [color, acc, face] = CARDS[Number(c)];
        return h('button', { class: 'mcard' + (up ? ' up' : '') + (s.got[i] !== '.' ? ' got p' + s.got[i] : ''), 'aria-label': '카드 ' + (i + 1), onClick: () => !up && (myTurn(ctx, s, solo) ? flip(i) : toast(s.win >= 0 ? '끝난 판이에요. 새 게임을 눌러 주세요' : '상대 차례예요')) },
          h('span', { class: 'mface', html: up ? capy({ color, acc, face, head: true }) : '' }), h('span', { class: 'mback', html: yuzuSvg })); })));
  }, ctx => ctx.order.length < 2 ? '상대가 들어오면 둘이 할 수 있어요' : '같은 카피바라 두 장을 찾으면 한 번 더');
  return () => { clearTimeout(timer); off(); };
} };
