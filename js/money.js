// 돈(🪙): 게임에서 번 점수가 돈이 되고, 옷·선물을 사는 데 쓴다. 지갑과 산 물건은 사람마다 따로다
import { toast, h, modal } from './ui.js';
import { TOPS, BOTTOMS, HATS, ZOO_HATS, SHOES, HD_SETS } from './clothes.js';
import { sfx } from './sound.js';

const FREE_N = 10; // 종류마다 앞의 10벌은 처음부터 갖고 있다
const FREE = new Set([TOPS, BOTTOMS, HATS].flatMap(a => a.slice(0, FREE_N).map(x => x.id)));
const PRICES = {}; // 물가 기준: 미니게임 2~4판 또는 낚시 15~20분이면 한 벌(상의·하의 800~1,100 · 모자 600~900 · 신발 900~1,300)
[[TOPS, 800], [BOTTOMS, 800], [HATS, 600]].forEach(([a, p]) => a.forEach((x, i) => { PRICES[x.id] = p + (i % 4) * 100; }));
SHOES.forEach((x, i) => { PRICES[x.id] = [1000, 1000, 1000, 1300, 1300, 1300, 1100, 900, 1100][i]; }); // 신발 9켤레: 처음부터 주는 건 없고 전부 사야 한다
// 핫똑랜드 한복(2026-11-25 2차 물가 조정): 카피랜드 옷값의 2.5배의 2.5배(약 6배 · 상의·하의 5,000~6,900 · 모자 3,750~5,600 · 신발 5,600~8,100 · 안경 5,600). 개량한복 · 왕실 예복은 그 칸 최고값
const HD_ROYAL = new Set(['t-hd-2', 't-hd-13', 't-hd-14', 't-hd-15', 't-hd-25', 'b-hd-4', 'h-hd-1', 'h-hd-21', 'h-hd-22', 'h-hd-23']);
[['top', 5000, 6900], ['bottom', 5000, 6900], ['hat', 3750, 5600], ['shoe', 5600, 8100], ['eye', 5600, 5600]].forEach(([k, lo, hi]) => HD_SETS[k].forEach((x, i, arr) => { const n = i + 1, gaeryang = k === 'shoe' ? n >= 7 : n >= 27;
  PRICES[x.id] = HD_ROYAL.has(x.id) || gaeryang ? hi : Math.round((lo + (hi - lo) * i / Math.max(1, arr.length - 1)) / 50) * 50; }));
ZOO_HATS.forEach((x, i) => { PRICES[x.id] = 2500 + ((i * 5 + 2) % 6) * 100; }); // 친목회 전용 모자: 동물에게서만 산다
export const priceOf = id => (FREE.has(id) ? 0 : PRICES[id] || 0);
// 게임별 환산 규칙(게임 목록과 적립 카드에 그대로 보여 준다)
// 물가 반영(2026-11): 옷값이 약 3.5~4배 오른 만큼 게임 보상도 4배
export const RATE = { burger: '2점당 1코인', bubble: '기록 하 10점·중 7점·상 5점당 1코인 · 스테이지 클리어 140~1,080', tetris: '하 20점·중 14점·상 10점당 1코인 (최대 300·450·600) · 이기면 +120', yuzu: '1점당 8코인 (한 판 최대 400)', mahjong: '3점당 4코인 · 이기면 +80', omok: '승 200 · 무 100 · 패 60 · 혼자 40코인', four: '승 200 · 무 100 · 패 60 · 혼자 40코인', match: '승 200 · 무 100 · 패 60 · 혼자 40코인', volley: '승 200 · 패 60코인 (컴퓨터전은 60%)' };
export const won = n => '🪙 ' + Math.round(n).toLocaleString('ko-KR');
// 테트리스는 난이도마다 점수 값과 상한이 다르다(하·중·상)
// 2026-11-20 하향: 몇 분만 쌓아도 한 판에 800~2,000코인이 나와 다른 게임(한 판 200 안팎)보다 너무 쉽게 벌렸다 → 잘한 판이 300~600코인
export const TETRIS_PAY = { e: { base: 40, per: 20, max: 300 }, m: { base: 50, per: 14, max: 450 }, h: { base: 60, per: 10, max: 600 } };
const BUBBLE_PAY = { e: { base: 40, per: 5, max: 800 }, m: { base: 60, per: 3.5, max: 1400 }, h: { base: 80, per: 2.5, max: 2000 } }; // 버블은 그대로
// 게임 결과 → 돈
export const PAY = { burger: s => Math.floor(Math.max(0, s) / 2), bubble: (s, d) => { const t = BUBBLE_PAY[d] || BUBBLE_PAY.e; return Math.min(t.max, t.base + Math.floor(Math.max(0, s) / (t.per * 2))); }, bubbleStage: n => Math.round((120 + n * 20) * (n >= 15 ? 1.5 : 1)), tetris: (s, d) => { const t = TETRIS_PAY[d] || TETRIS_PAY.e; return Math.min(t.max, t.base + Math.floor(Math.max(0, s) / t.per)); }, yuzu: s => Math.min(400, Math.max(0, s) * 8), /* 끝없이 하는 판이라 한 판 최대 400 */ board: r => ({ win: 200, draw: 100, lose: 60, solo: 40 })[r] || 0, volley: w => (w ? 200 : 60), mahjong: s => Math.floor(Math.max(0, s) * 4 / 3) };

export const ENTRY = 50; // 게임 참가비: 시작할 때 50코인을 동전으로 넣는다(바로 빠진다). 이기거나 비기면 그대로 한 판 더, 지면 다시 넣는다
export const STREAK_X = [1, 1.5, 1.8, 2.3]; // 연승 배율(4연승까지)
export function setupMoney(ctx, onChange) {
  ctx.money = {}; ctx.owned = {};
  ctx.coins = (u = ctx.uid) => ((ctx.money[u] || {}).c) || 0;
  ctx.owns = id => !id || FREE.has(id) || !!((ctx.owned[ctx.uid] || {})[id]);
  // 게임이 끝나면: 점수가 얼마로 환산됐고 얼마가 쌓였는지 카드로 보여 준다. lines = 환산 내역(글 줄들)
  ctx.earn = (n, why, lines = [], opt = {}) => { n = Math.max(0, Math.round(n)); const fee = 0, lose0 = Math.max(0, Math.round(opt.lose || 0)), lose = lose0 + fee, bonus = Math.max(0, Math.round(opt.bonus || 0)), before = ctx.coins();
    const show = after => { document.querySelectorAll('.earn-card').forEach(e => e.remove());
      const sum = n > 0 || lose || bonus ? [n > 0 && `+${n.toLocaleString('ko-KR')}코인`, bonus && `내기 +${bonus.toLocaleString('ko-KR')}코인`, lose0 && `-${lose0.toLocaleString('ko-KR')}코인`, fee && `참가비 -${fee}코인`].filter(Boolean).join(' ') : '이번 판은 적립 없음';
      const stop = opt.stop && h('button', { class: 'btn sm primary', onClick: e => { e.stopPropagation(); ctx.stopStreak(opt.stop); card.remove(); } }, '💰 연승 그만하고 챙기기');
      const card = h('div', { class: 'earn-card' + (location.hash.startsWith('#game-') ? ' neon' : '') + (lose0 ? ' lost' : opt.stop ? ' hot' : ''), onClick: () => card.remove() }, h('b', null, `🪙 ${why || '게임'} 정산`), ...lines.map(t => h('p', null, t)), h('p', { class: 'sum' }, sum), stop, h('small', null, `내 돈 ${before.toLocaleString('ko-KR')} → ${after.toLocaleString('ko-KR')}코인 · 누르면 닫혀요`));
      document.body.append(card); setTimeout(() => card.remove(), opt.stop || lose0 ? 11000 : 7000);
      // 동전(크레딧): 이기거나 비기면 그대로 한 판 더, 지거나 기록 판이 끝나면 다 쓴 것 → 다시 넣어야 이어 할 수 있다
      if (opt.res !== 'win' && opt.res !== 'draw' && !opt.keep) ctx.useCredit && ctx.useCredit(); };
    if (!(n > 0) && !lose && !bonus) { show(before); return Promise.resolve(0); }
    let after = before;
    return ctx.store.tx('money/' + ctx.uid, c => { const have = (c && c.c) || 0; after = Math.max(0, have + n + bonus - lose); return { ...(c || {}), c: after, total: ((c && c.total) || 0) + n }; }).then(() => { show(after); return n - lose; }).catch(() => 0); };
  // 연승: 컴퓨터전·경쟁전에서 이기면 1승 ×1, 2연승 ×1.5, 3연승 ×1.8, 4연승 ×2.3(4연승에서 끝, 확정). 연승 중에 지면 연승으로 번 돈의 2/3를 잃는다. 비기면 그대로
  ctx.streak = {};
  ctx.streakOf = g => ({ n: 0, won: 0, ...((ctx.streak || {})[g] || {}) });
  ctx.streakLv = g => ctx.streakOf(g).n; // 컴퓨터가 강해지는 단계(0~3)
  const setStreak = (g, v) => { ctx.streak = { ...ctx.streak, [g]: v }; return ctx.store.set(`streak/${ctx.uid}/${g}`, v).catch(() => {}); };
  ctx.stopStreak = g => { const s = ctx.streakOf(g); setStreak(g, null); if (s.n) toast(`${s.n}연승에서 멈췄어요. 번 돈 ${s.won.toLocaleString('ko-KR')}코인은 안전해요`, 2600); };
  // 내기(사람끼리 경쟁할 때만, 선택): 둘이 같은 돈을 걸고(1:1) 다음 경쟁 판의 승자가 모두 가져간다. 비기면 각자 돌려받는다
  // bets/<게임> = { id, amount, by, state: offer(신청) | on(성사) | off(취소) | done(끝), at, paid: {uid: 건 돈}, back: {uid: 환불함}, res: {uid: 내 결과} }
  ctx.bets = {};
  const give = n => (n > 0 ? ctx.store.tx('money/' + ctx.uid, c => ({ ...(c || {}), c: ((c && c.c) || 0) + n })).catch(() => {}) : Promise.resolve());
  const refundCheck = () => Object.entries(ctx.bets || {}).forEach(([g, b]) => { if (b && b.state === 'off' && (b.paid || {})[ctx.uid] && !(b.back || {})[ctx.uid]) { ctx.store.update(`bets/${g}/back`, { [ctx.uid]: true }).catch(() => {}); give(b.paid[ctx.uid]); toast(`💰 내기가 취소돼서 ${b.paid[ctx.uid]}코인을 돌려받았어요`, 2600); } });
  ctx.betOf = g => { const b = (ctx.bets || {})[g]; return b && (b.state === 'offer' || b.state === 'on') ? b : null; };
  ctx.offerBet = async (g, amount) => { amount = Math.round(amount); if (!(amount > 0)) return false; if (ctx.betOf(g)) { toast('이미 걸린 내기가 있어요'); return false; } if (!ctx.partnerId) { toast('상대가 없어요'); return false; }
    if (!(await ctx.spend(amount))) return false; await ctx.store.set(`bets/${g}`, { id: Math.random().toString(36).slice(2, 9), amount, by: ctx.uid, state: 'offer', at: ctx.store.now(), paid: { [ctx.uid]: amount } }).catch(() => {}); return true; };
  ctx.acceptBet = async g => { const b = ctx.betOf(g); if (!b || b.state !== 'offer' || b.by === ctx.uid) return false; if (!(await ctx.spend(b.amount))) return false;
    await ctx.store.update(`bets/${g}`, { state: 'on', at: ctx.store.now(), [`paid/${ctx.uid}`]: b.amount }).catch(() => {}); return true; };
  ctx.cancelBet = g => { const b = ctx.betOf(g); if (b) return ctx.store.update(`bets/${g}`, { state: 'off' }).catch(() => {}); };
  ctx.settleBet = (g, res) => { const b = (ctx.bets || {})[g]; if (!b || (b.state !== 'on' && b.state !== 'done') || (b.res || {})[ctx.uid] || !(b.paid || {})[ctx.uid]) return null;
    const pot = b.amount * 2, got = res === 'win' ? pot : res === 'draw' ? b.amount : 0; ctx.bets = { ...ctx.bets, [g]: { ...b, res: { ...(b.res || {}), [ctx.uid]: res } } };
    ctx.store.update(`bets/${g}`, { state: 'done', [`res/${ctx.uid}`]: res }).catch(() => {});
    return { got, line: res === 'win' ? `💰 내기 승리! 판돈 +${pot}코인` : res === 'draw' ? `💰 무승부라 건 돈 ${b.amount}코인을 돌려받았어요` : `💸 내기에서 졌어요. 건 돈 ${b.amount}코인은 상대에게` }; };
  ctx.earnMatch = (base, why, lines, res, g, pvp) => { base = Math.max(0, Math.round(base)); const s = ctx.streakOf(g); const bet = pvp ? ctx.settleBet(g, res) : null; if (bet) lines = [...lines, bet.line]; const bonus = bet ? bet.got : 0; // 내기 판돈은 연승 배율 없이 그대로 더한다
    if (res === 'win') { const n = s.n + 1, x = STREAK_X[n - 1], pay = Math.round(base * x), won = s.won + pay, done = n >= STREAK_X.length;
      setStreak(g, done ? null : { n, won });
      return ctx.earn(pay, why, [...lines, n > 1 ? `🔥 ${n}연승! ×${x} = ${pay}코인` : '🔥 1승! 다음 판부터 연승 보너스 ×1.5 → ×1.8 → ×2.3',
        done ? '🏆 4연승 달성! 번 돈이 모두 확정됐어요. 다음 판부터 새로 시작해요' : `연승으로 번 돈 ${won}코인 · 다음 판에 지면 ${Math.round(won * 2 / 3)}코인을 잃어요${g === 'mahjong' || g === 'volley' || g === 'burger' ? ' · 컴퓨터도 더 강해져요' : ''}`], done ? { bonus, res } : { stop: g, bonus, res }); }
    if (res === 'lose' && s.n > 0) { const lose = Math.round(s.won * 2 / 3); setStreak(g, null);
      return ctx.earn(base, why, [...lines, `💥 ${s.n}연승 끝! 연승으로 번 ${s.won}코인의 2/3를 잃었어요`], { lose, bonus, res }); }
    return ctx.earn(base, why, lines, { bonus, res }); };
  // 돈이 모자라면 false. 쓴 뒤에 무엇을 얻는지는 부르는 쪽에서 적는다
  // 구매하기 창: 물건을 살 때는 꼭 이 창에서 [구매하기]를 눌러야 거래된다
  // 구매 확인 창. opt.qty 가 있으면 수량을 고르는 창이 되고, 고른 수량(숫자)을 돌려준다(취소면 false). 수량이 없으면 예전처럼 true/false
  ctx.askBuy = function (name, price, opt) { const me = this && this.coins ? this : ctx; if (opt && opt.qty) return new Promise(res => { let done = false, n = 1; const have = me.coins(), won = v => Math.round(v).toLocaleString('ko-KR'), cap = Math.max(1, opt.sell ? (opt.max || 1) : Math.min(opt.max || 999, Math.floor(have / price) || 1)), S = !!opt.sell; // sell: 파는 창(가진 만큼까지, 돈 제한 없음)
      const nEl = h('b', { class: 'qty-n' }), pEl = h('p', { class: 'buy-price' }), mEl = h('small'), okB = h('button', { class: 'btn primary' });
      const set = v => { n = Math.max(1, Math.min(cap, v)); const t = price * n, short = !S && t > have; nEl.textContent = n + (opt.unit || '개'); pEl.textContent = `🪙 ${won(t)}코인`; mEl.textContent = S ? `가진 것 ${cap}${opt.unit || '개'} · 팔고 나면 내 돈 ${won(have + t)}코인` : short ? `돈이 모자라요 · 내 돈 ${won(have)}코인` : `내 돈 ${won(have)}코인 → 사고 나면 ${won(have - t)}코인`; okB.textContent = short ? '돈이 모자라요' : `${n}${opt.unit || '개'} ${S ? '팔기' : '구매하기'}`; okB.disabled = short; };
      const st = d => h('button', { class: 'btn sm', onClick: () => set(n + d) }, (d > 0 ? '+' : '−') + Math.abs(d));
      const close = modal({ title: S ? '💰 팔기' : '🛒 구매하기', onClose: () => { if (!done) res(false); }, body: [h('div', { class: 'buy-ask' }, h('b', null, name), h('div', { class: 'qty-row' }, st(-10), st(-1), nEl, st(1), st(10)), h('div', { class: 'qty-row sm' }, h('button', { class: 'btn sm', onClick: () => set(1) }, '1개'), h('button', { class: 'btn sm', onClick: () => set(5) }, '5개'), S && h('button', { class: 'btn sm', onClick: () => set(Math.ceil(cap / 2)) }, '절반'), h('button', { class: 'btn sm', onClick: () => set(cap) }, S ? '전부' : `최대 ${cap}${opt.unit || '개'}`)), pEl, mEl)],
        actions: [{ label: '취소' }] });
      okB.onclick = () => { if (okB.disabled) return; done = true; close(); res(n); }; const W = [...document.querySelectorAll('.modal-wrap')].pop(); W && W.querySelector('.modal-actions').append(okB); set(1); });
    return new Promise(res => { let done = false; const have = me.coins(), won = n => Math.round(n).toLocaleString('ko-KR'), short = price > have;
    modal({ title: '🛒 구매하기', onClose: () => { if (!done) res(false); }, body: [h('div', { class: 'buy-ask' }, h('b', null, name), h('p', { class: 'buy-price' }, `🪙 ${won(price)}코인`), h('small', null, short ? `돈이 모자라요 · 내 돈 ${won(have)}코인 (${won(price - have)}코인 부족)` : `내 돈 ${won(have)}코인 → 사고 나면 ${won(have - price)}코인`))],
      actions: [{ label: '취소' }, { label: short ? '돈이 모자라요' : '구매하기', primary: true, onClick: c => { if (short) return; done = true; c(); res(true); } }] }); }); };
  ctx.spend = async n => { n = Math.round(n); if (n <= 0) return true; let ok = false;
    try { await ctx.store.tx('money/' + ctx.uid, c => { const have = (c && c.c) || 0; if (have < n) { ok = false; return undefined; } ok = true; return { ...(c || {}), c: have - n }; }); } catch { ok = false; }
    if (ok) sfx('coin'); else toast('돈이 모자라요. 게임을 하면 돈을 벌 수 있어요', 1800); return ok; };
  ctx.buy = async id => { if (ctx.owns(id)) return true; if (!(await ctx.spend(priceOf(id)))) return false; await ctx.store.set(`owned/${ctx.uid}/${id}`, true).catch(() => {}); ctx.owned[ctx.uid] = { ...(ctx.owned[ctx.uid] || {}), [id]: true }; return true; };
  // 한 번만 주는 지급: 밍땅꾸리에게 10,000코인(2026-11-20). 표시(g1120)가 있으면 다시 주지 않는다
  // 오류 보상(한 번만): 두두에게 350코인(2026-11-21, 카피배구 서버 오류). 표시(g1121)가 있으면 다시 주지 않는다. 지급되면 사과 창을 띄운다
  let sorrying = false; const sorryOnce = () => { const me = ctx.members[ctx.uid] || {}; if (!(ctx.ours && ctx.ours()) || sorrying || me.name !== '두두' || (ctx.money[ctx.uid] || {}).g1121) return; sorrying = true;
    ctx.store.tx('money/' + ctx.uid, c => ((c && c.g1121) ? undefined : { ...(c || {}), c: ((c && c.c) || 0) + 350, g1121: true })).then(r => { if (r && r.committed === false) return; try { modal({ title: '🙇 오류 보상금', body: [h('p', { class: 'center', style: { fontWeight: 800, wordBreak: 'keep-all' } }, '서버 오류로 불편을 드려 죄송합니다.'), h('p', { class: 'center' }, '보상금 ', h('b', null, '🪙 350코인'), '을 지급해 드렸어요.')], actions: [{ label: '확인', primary: true }] }); } catch {} }).catch(() => { sorrying = false; }); };
  // 한 번만 주는 지급 ②: 밍땅꾸리에게 8,000코인(2026-11-21). 표시(g1121m)
  let granting2 = false; const grantOnce2 = () => { const me = ctx.members[ctx.uid] || {}; if (!(ctx.ours && ctx.ours()) || granting2 || me.name !== '밍땅꾸리' || (ctx.money[ctx.uid] || {}).g1121m) return; granting2 = true;
    ctx.store.tx('money/' + ctx.uid, c => ((c && c.g1121m) ? undefined : { ...(c || {}), c: ((c && c.c) || 0) + 8000, g1121m: true })).catch(() => { granting2 = false; }); };
  let granting = false; const grantOnce = () => { const me = ctx.members[ctx.uid] || {}; if (!(ctx.ours && ctx.ours()) || granting || me.name !== '밍땅꾸리' || (ctx.money[ctx.uid] || {}).g1120) return; granting = true;
    ctx.store.tx('money/' + ctx.uid, c => ((c && c.g1120) ? undefined : { ...(c || {}), c: ((c && c.c) || 0) + 10000, g1120: true })).catch(() => { granting = false; }); };
  // 한 번만 주는 지급 ⑥: 밍땅꾸리에게 30,000코인(2026-11-23 아침). 표시(g1123a)
  let granting6 = false; const grantOnce6 = () => { const me = ctx.members[ctx.uid] || {}; if (!(ctx.ours && ctx.ours()) || granting6 || me.name !== '밍땅꾸리' || (ctx.money[ctx.uid] || {}).g1123a) return; granting6 = true;
    ctx.store.tx('money/' + ctx.uid, c => ((c && c.g1123a) ? undefined : { ...(c || {}), c: ((c && c.c) || 0) + 30000, g1123a: true })).then(r => { if (r && r.committed === false) return; toast('🎁 30,000코인이 들어왔어요', 3000); }).catch(() => { granting6 = false; }); };
  // 한 번만 주는 지급 ⑤: 밍땅꾸리에게 50,000코인 한 번 더(2026-11-22 19시). 표시(g1122d)
  let granting5 = false; const grantOnce5 = () => { const me = ctx.members[ctx.uid] || {}; if (!(ctx.ours && ctx.ours()) || granting5 || me.name !== '밍땅꾸리' || (ctx.money[ctx.uid] || {}).g1122d) return; granting5 = true;
    ctx.store.tx('money/' + ctx.uid, c => ((c && c.g1122d) ? undefined : { ...(c || {}), c: ((c && c.c) || 0) + 50000, g1122d: true })).then(r => { if (r && r.committed === false) return; toast('🎁 50,000코인이 들어왔어요', 3000); }).catch(() => { granting5 = false; }); };
  // 한 번만 주는 지급 ④: 밍땅꾸리에게 50,000코인(2026-11-22 14시). 표시(g1122c)
  let granting4 = false; const grantOnce4 = () => { const me = ctx.members[ctx.uid] || {}; if (!(ctx.ours && ctx.ours()) || granting4 || me.name !== '밍땅꾸리' || (ctx.money[ctx.uid] || {}).g1122c) return; granting4 = true;
    ctx.store.tx('money/' + ctx.uid, c => ((c && c.g1122c) ? undefined : { ...(c || {}), c: ((c && c.c) || 0) + 50000, g1122c: true })).then(r => { if (r && r.committed === false) return; toast('🎁 50,000코인이 들어왔어요', 3000); }).catch(() => { granting4 = false; }); };
  // 한 번만 주는 지급 ③: 밍땅꾸리에게 고추·무 1개씩(2026-11-22, B급, 헛간으로). 표시(g1122v)
  let granting3 = false; const grantOnce3 = () => { const me = ctx.members[ctx.uid] || {}; if (!(ctx.ours && ctx.ours()) || granting3 || me.name !== '밍땅꾸리' || (ctx.money[ctx.uid] || {}).g1122v) return; granting3 = true;
    ctx.store.tx('money/' + ctx.uid, c => ((c && c.g1122v) ? undefined : { ...(c || {}), g1122v: true })).then(r => { if (r && r.committed === false) return;
      ['chili|B', 'radish|B'].forEach(k => ctx.store.tx(`farm/${ctx.uid}/barn/${k}`, n => (n || 0) + 1).catch(() => {})); toast('🎁 고추·무 1개씩 헛간에 넣었어요', 3000); }).catch(() => { granting3 = false; }); };
  const offs = [
    ctx.store.on('streak/' + ctx.uid, v => { ctx.streak = v || {}; }),
    ctx.store.on('bets', v => { ctx.bets = v || {}; refundCheck(); (ctx.betWatch || []).forEach(f => f()); }),
    ctx.store.on('money', v => { ctx.money = v || {}; grantOnce(); grantOnce2(); grantOnce3(); grantOnce4(); grantOnce5(); grantOnce6(); sorryOnce(); document.querySelectorAll('[data-coins]').forEach(e => { e.textContent = won(ctx.coins()); }); onChange && onChange(); }),
    ctx.store.on('owned', v => { ctx.owned = v || {};
      const me = ctx.owned[ctx.uid] || {}; if (!me._init) { const d = ctx.dress[ctx.uid] || {}, keep = { _init: true }; [d.top, d.bottom, d.hat, d.shoe].forEach(id => { if (id) keep[id] = true; }); ctx.store.update('owned/' + ctx.uid, keep).catch(() => {}); } // 돈이 생기기 전에 입고 있던 옷은 그대로 내 것
      onChange && onChange(); }),
  ];
  return () => offs.forEach(f => f());
}
