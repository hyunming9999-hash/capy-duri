// 돈(🪙): 게임에서 번 점수가 돈이 되고, 옷·선물을 사는 데 쓴다. 지갑과 산 물건은 사람마다 따로다
import { toast, h } from './ui.js';
import { TOPS, BOTTOMS, HATS, ZOO_HATS } from './clothes.js';
import { sfx } from './sound.js';

const FREE_N = 10; // 종류마다 앞의 10벌은 처음부터 갖고 있다
const FREE = new Set([TOPS, BOTTOMS, HATS].flatMap(a => a.slice(0, FREE_N).map(x => x.id)));
const PRICES = {}; // 게임 한 판에 50쯤 벌어서, 다섯 판쯤 하면 한 벌
[[TOPS, 250], [BOTTOMS, 250], [HATS, 200]].forEach(([a, p]) => a.forEach((x, i) => { PRICES[x.id] = p + (i % 3) * 30; }));
ZOO_HATS.forEach(x => { PRICES[x.id] = 300; }); // 친목회 전용 모자: 동물에게서만 산다
export const priceOf = id => (FREE.has(id) ? 0 : PRICES[id] || 0);
// 게임별 환산 규칙(게임 목록과 적립 카드에 그대로 보여 준다)
export const RATE = { burger: '8점당 1코인', bubble: '기록 하 40점·중 28점·상 20점당 1코인 · 스테이지 클리어 35~270', tetris: '하 20점·중 14점·상 10점당 1코인 (최대 200·350·500) · 이기면 +30', yuzu: '1점당 2코인', mahjong: '3점당 1코인 · 이기면 +20', omok: '승 50 · 무 25 · 패 15 · 혼자 10코인', four: '승 50 · 무 25 · 패 15 · 혼자 10코인', match: '승 50 · 무 25 · 패 15 · 혼자 10코인', volley: '승 50 · 패 15코인 (컴퓨터전은 60%)' };
export const won = n => '🪙 ' + Math.round(n).toLocaleString('ko-KR');
// 테트리스는 난이도마다 점수 값과 상한이 다르다(하·중·상)
export const TETRIS_PAY = { e: { base: 10, per: 20, max: 200 }, m: { base: 15, per: 14, max: 350 }, h: { base: 20, per: 10, max: 500 } };
// 게임 결과 → 돈
export const PAY = { burger: s => Math.floor(Math.max(0, s) / 8), bubble: (s, d) => { const t = TETRIS_PAY[d] || TETRIS_PAY.e; return Math.min(t.max, t.base + Math.floor(Math.max(0, s) / (t.per * 2))); }, bubbleStage: n => Math.round((30 + n * 5) * (n >= 15 ? 1.5 : 1)), tetris: (s, d) => { const t = TETRIS_PAY[d] || TETRIS_PAY.e; return Math.min(t.max, t.base + Math.floor(Math.max(0, s) / t.per)); }, yuzu: s => Math.max(0, s) * 2, board: r => ({ win: 50, draw: 25, lose: 15, solo: 10 })[r] || 0, volley: w => (w ? 50 : 15), mahjong: s => Math.floor(Math.max(0, s) / 3) };

export const STREAK_X = [1, 1.5, 1.8, 2.3]; // 연승 배율(4연승까지)
export function setupMoney(ctx, onChange) {
  ctx.money = {}; ctx.owned = {};
  ctx.coins = (u = ctx.uid) => ((ctx.money[u] || {}).c) || 0;
  ctx.owns = id => !id || FREE.has(id) || !!((ctx.owned[ctx.uid] || {})[id]);
  // 게임이 끝나면: 점수가 얼마로 환산됐고 얼마가 쌓였는지 카드로 보여 준다. lines = 환산 내역(글 줄들)
  ctx.earn = (n, why, lines = [], opt = {}) => { n = Math.max(0, Math.round(n)); const lose = Math.max(0, Math.round(opt.lose || 0)), before = ctx.coins();
    const show = after => { document.querySelectorAll('.earn-card').forEach(e => e.remove());
      const sum = n > 0 || lose ? [n > 0 && `+${n.toLocaleString('ko-KR')}코인`, lose && `-${lose.toLocaleString('ko-KR')}코인`].filter(Boolean).join(' ') : '이번 판은 적립 없음';
      const stop = opt.stop && h('button', { class: 'btn sm primary', onClick: e => { e.stopPropagation(); ctx.stopStreak(opt.stop); card.remove(); } }, '💰 연승 그만하고 챙기기');
      const card = h('div', { class: 'earn-card' + (lose ? ' lost' : opt.stop ? ' hot' : ''), onClick: () => card.remove() }, h('b', null, `🪙 ${why || '게임'} 정산`), ...lines.map(t => h('p', null, t)), h('p', { class: 'sum' }, sum), stop, h('small', null, `내 돈 ${before.toLocaleString('ko-KR')} → ${after.toLocaleString('ko-KR')}코인 · 누르면 닫혀요`));
      document.body.append(card); setTimeout(() => card.remove(), opt.stop || lose ? 11000 : 7000); };
    if (!(n > 0) && !lose) { show(before); return Promise.resolve(0); }
    let after = before;
    return ctx.store.tx('money/' + ctx.uid, c => { const have = (c && c.c) || 0; after = Math.max(0, have + n - lose); return { ...(c || {}), c: after, total: ((c && c.total) || 0) + n }; }).then(() => { show(after); return n - lose; }).catch(() => 0); };
  // 연승: 컴퓨터전·경쟁전에서 이기면 1승 ×1, 2연승 ×1.5, 3연승 ×1.8, 4연승 ×2.3(4연승에서 끝, 확정). 연승 중에 지면 연승으로 번 돈의 2/3를 잃는다. 비기면 그대로
  ctx.streak = {};
  ctx.streakOf = g => ({ n: 0, won: 0, ...((ctx.streak || {})[g] || {}) });
  ctx.streakLv = g => ctx.streakOf(g).n; // 컴퓨터가 강해지는 단계(0~3)
  const setStreak = (g, v) => { ctx.streak = { ...ctx.streak, [g]: v }; return ctx.store.set(`streak/${ctx.uid}/${g}`, v).catch(() => {}); };
  ctx.stopStreak = g => { const s = ctx.streakOf(g); setStreak(g, null); if (s.n) toast(`${s.n}연승에서 멈췄어요. 번 돈 ${s.won.toLocaleString('ko-KR')}코인은 안전해요`, 2600); };
  ctx.earnMatch = (base, why, lines, res, g) => { base = Math.max(0, Math.round(base)); const s = ctx.streakOf(g);
    if (res === 'win') { const n = s.n + 1, x = STREAK_X[n - 1], pay = Math.round(base * x), won = s.won + pay, done = n >= STREAK_X.length;
      setStreak(g, done ? null : { n, won });
      return ctx.earn(pay, why, [...lines, n > 1 ? `🔥 ${n}연승! ×${x} = ${pay}코인` : '🔥 1승! 다음 판부터 연승 보너스 ×1.5 → ×1.8 → ×2.3',
        done ? '🏆 4연승 달성! 번 돈이 모두 확정됐어요. 다음 판부터 새로 시작해요' : `연승으로 번 돈 ${won}코인 · 다음 판에 지면 ${Math.round(won * 2 / 3)}코인을 잃어요${g === 'mahjong' || g === 'volley' || g === 'burger' ? ' · 컴퓨터도 더 강해져요' : ''}`], done ? {} : { stop: g }); }
    if (res === 'lose' && s.n > 0) { const lose = Math.round(s.won * 2 / 3); setStreak(g, null);
      return ctx.earn(base, why, [...lines, `💥 ${s.n}연승 끝! 연승으로 번 ${s.won}코인의 2/3를 잃었어요`], { lose }); }
    return ctx.earn(base, why, lines); };
  // 돈이 모자라면 false. 쓴 뒤에 무엇을 얻는지는 부르는 쪽에서 적는다
  ctx.spend = async n => { n = Math.round(n); if (n <= 0) return true; let ok = false;
    try { await ctx.store.tx('money/' + ctx.uid, c => { const have = (c && c.c) || 0; if (have < n) { ok = false; return undefined; } ok = true; return { ...(c || {}), c: have - n }; }); } catch { ok = false; }
    if (ok) sfx('coin'); else toast('돈이 모자라요. 게임을 하면 돈을 벌 수 있어요', 1800); return ok; };
  ctx.buy = async id => { if (ctx.owns(id)) return true; if (!(await ctx.spend(priceOf(id)))) return false; await ctx.store.set(`owned/${ctx.uid}/${id}`, true).catch(() => {}); ctx.owned[ctx.uid] = { ...(ctx.owned[ctx.uid] || {}), [id]: true }; return true; };
  const offs = [
    ctx.store.on('streak/' + ctx.uid, v => { ctx.streak = v || {}; }),
    ctx.store.on('money', v => { ctx.money = v || {}; document.querySelectorAll('[data-coins]').forEach(e => { e.textContent = won(ctx.coins()); }); onChange && onChange(); }),
    ctx.store.on('owned', v => { ctx.owned = v || {};
      const me = ctx.owned[ctx.uid] || {}; if (!me._init) { const d = ctx.dress[ctx.uid] || {}, keep = { _init: true }; [d.top, d.bottom, d.hat].forEach(id => { if (id) keep[id] = true; }); ctx.store.update('owned/' + ctx.uid, keep).catch(() => {}); } // 돈이 생기기 전에 입고 있던 옷은 그대로 내 것
      onChange && onChange(); }),
  ];
  return () => offs.forEach(f => f());
}
