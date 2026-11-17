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
export const RATE = { burger: '8점당 1코인', tetris: '하 20점·중 14점·상 10점당 1코인 (최대 200·350·500) · 이기면 +30', yuzu: '1점당 2코인', mahjong: '3점당 1코인 · 이기면 +20', omok: '승 50 · 무 25 · 패 15 · 혼자 10코인', four: '승 50 · 무 25 · 패 15 · 혼자 10코인', match: '승 50 · 무 25 · 패 15 · 혼자 10코인', volley: '승 50 · 패 15코인 (컴퓨터전은 60%)' };
export const won = n => '🪙 ' + Math.round(n).toLocaleString('ko-KR');
// 테트리스는 난이도마다 점수 값과 상한이 다르다(하·중·상)
export const TETRIS_PAY = { e: { base: 10, per: 20, max: 200 }, m: { base: 15, per: 14, max: 350 }, h: { base: 20, per: 10, max: 500 } };
// 게임 결과 → 돈
export const PAY = { burger: s => Math.floor(Math.max(0, s) / 8), tetris: (s, d) => { const t = TETRIS_PAY[d] || TETRIS_PAY.e; return Math.min(t.max, t.base + Math.floor(Math.max(0, s) / t.per)); }, yuzu: s => Math.max(0, s) * 2, board: r => ({ win: 50, draw: 25, lose: 15, solo: 10 })[r] || 0, volley: w => (w ? 50 : 15), mahjong: s => Math.floor(Math.max(0, s) / 3) };

export function setupMoney(ctx, onChange) {
  ctx.money = {}; ctx.owned = {};
  ctx.coins = (u = ctx.uid) => ((ctx.money[u] || {}).c) || 0;
  ctx.owns = id => !id || FREE.has(id) || !!((ctx.owned[ctx.uid] || {})[id]);
  // 게임이 끝나면: 점수가 얼마로 환산됐고 얼마가 쌓였는지 카드로 보여 준다. lines = 환산 내역(글 줄들)
  ctx.earn = (n, why, lines = []) => { n = Math.max(0, Math.round(n)); const before = ctx.coins();
    const show = after => { document.querySelectorAll('.earn-card').forEach(e => e.remove());
      const card = h('div', { class: 'earn-card', onClick: () => card.remove() }, h('b', null, `🪙 ${why || '게임'} 적립`), ...lines.map(t => h('p', null, t)), h('p', { class: 'sum' }, n > 0 ? `+${n.toLocaleString('ko-KR')}코인 적립` : '이번 판은 적립 없음'), h('small', null, `내 돈 ${before.toLocaleString('ko-KR')} → ${after.toLocaleString('ko-KR')}코인 · 누르면 닫혀요`));
      document.body.append(card); setTimeout(() => card.remove(), 7000); };
    if (!(n > 0)) { show(before); return Promise.resolve(0); }
    return ctx.store.tx('money/' + ctx.uid, c => ({ ...(c || {}), c: ((c && c.c) || 0) + n, total: ((c && c.total) || 0) + n })).then(() => { show(before + n); return n; }).catch(() => 0); };
  // 돈이 모자라면 false. 쓴 뒤에 무엇을 얻는지는 부르는 쪽에서 적는다
  ctx.spend = async n => { n = Math.round(n); if (n <= 0) return true; let ok = false;
    try { await ctx.store.tx('money/' + ctx.uid, c => { const have = (c && c.c) || 0; if (have < n) { ok = false; return undefined; } ok = true; return { ...(c || {}), c: have - n }; }); } catch { ok = false; }
    if (ok) sfx('coin'); else toast('돈이 모자라요. 게임을 하면 돈을 벌 수 있어요', 1800); return ok; };
  ctx.buy = async id => { if (ctx.owns(id)) return true; if (!(await ctx.spend(priceOf(id)))) return false; await ctx.store.set(`owned/${ctx.uid}/${id}`, true).catch(() => {}); ctx.owned[ctx.uid] = { ...(ctx.owned[ctx.uid] || {}), [id]: true }; return true; };
  const offs = [
    ctx.store.on('money', v => { ctx.money = v || {}; document.querySelectorAll('[data-coins]').forEach(e => { e.textContent = won(ctx.coins()); }); onChange && onChange(); }),
    ctx.store.on('owned', v => { ctx.owned = v || {};
      const me = ctx.owned[ctx.uid] || {}; if (!me._init) { const d = ctx.dress[ctx.uid] || {}, keep = { _init: true }; [d.top, d.bottom, d.hat].forEach(id => { if (id) keep[id] = true; }); ctx.store.update('owned/' + ctx.uid, keep).catch(() => {}); } // 돈이 생기기 전에 입고 있던 옷은 그대로 내 것
      onChange && onChange(); }),
  ];
  return () => offs.forEach(f => f());
}
