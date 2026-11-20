// 🕹️ 카피오락: 친목회 놀이터의 건물을 누르면 게임을 고르고, 50코인을 넣는 모션 뒤에 게임으로 들어간다. 홈의 게임 메뉴로 들어가도 동전부터 넣는다
import { h, toast, modal } from './ui.js';
import { capy } from './capy.js';
import { sfx } from './sound.js';
import { ENTRY } from './money.js';

export const ARCADE_TEST = true; // 이제 모두에게 보인다(예전 시험판 표시)
// 오락실에서 들어간 게임은 뒤로 가기를 누르면 친목회로 돌아온다
export const fromArcade = () => { try { return sessionStorage.getItem('capy-arcade') === '1'; } catch { return false; } };
export const leaveArcade = () => { try { sessionStorage.removeItem('capy-arcade'); } catch {} };

// 동전(크레딧): 넣으면 1, 지거나 기록 판이 끝나면 0. 새로 고쳐도 남도록 이 창에만 적어 둔다
const CK = 'capy-credit';
export const hasCredit = () => { try { return sessionStorage.getItem(CK) === '1'; } catch { return false; } };
const setCredit = on => { try { on ? sessionStorage.setItem(CK, '1') : sessionStorage.removeItem(CK); } catch {} };
export const outOfGame = ctx => { if (fromArcade()) { leaveArcade(); ctx.go('social'); } else ctx.go('game'); };

// 판 수를 골라 넣는 게임(인형뽑기): [값, 판 수]. 이런 게임은 판 수를 게임이 따로 세고, 들어갈 때의 동전 창은 건너뛴다
export const PLANS = { claw: [[50, 1], [150, 3], [200, 5]] };
// 동전 넣기: "50코인을 넣으세요" 창 → 누르면 내 돈에서 바로 50코인이 빠지고, 동전이 투입구로 들어가며 CREDIT 1 → done()
// again: 진 뒤에 다시 넣는 창. 넣지 않고 닫으면 cancel()
export function coinGate(ctx, game, done, cancel, again) {
  const plans = PLANS[game.id], have = ctx.coins(), ok = !ctx.money[ctx.uid] || have >= ENTRY; let busy = false, paid = false, close;
  const coin = h('i', { class: 'arc-coin' }, h('b', null, '50')), credit = h('em', { class: 'arc-credit' }, 'INSERT COIN');
  const slot = h('div', { class: 'arc-machine' }, h('div', { class: 'arc-screen' }, h('span', { html: capy({ color: (ctx.members[ctx.uid] || {}).color, face: again ? 'cry' : game.face, acc: game.acc, head: true }) }), h('b', null, game.title), credit), h('div', { class: 'arc-panel' }, h('div', { class: 'arc-slot' }, h('u')), h('small', null, `${ENTRY}`)), coin);
  const have$ = h('b', null, `${have.toLocaleString('ko-KR')}코인`);
  const pay = async (price, n, btns) => { if (busy) return; busy = true; btns.forEach(b => { b.disabled = true; });
    if (!(await ctx.spend(price))) { busy = false; btns.forEach(b => { b.disabled = !!b._no; }); return; }
    paid = true; if (!plans) setCredit(true); have$.textContent = `${Math.max(0, have - price).toLocaleString('ko-KR')}코인`; coin.firstChild.textContent = price; slot.classList.add('in');
    setTimeout(() => { sfx('point'); credit.textContent = 'CREDIT ' + n; slot.classList.add('paid'); }, 800);
    setTimeout(() => { close && close(); done && done(n); }, 1700); };
  const btn = plans ? h('div', { class: 'arc-plans' }, plans.map(([price, n]) => { const no = !!ctx.money[ctx.uid] && have < price, b = h('button', { class: 'btn primary arc-plan', disabled: no, onClick: () => pay(price, n, [...btn.children]) }, h('b', null, `${n}판`), h('small', null, `🪙 ${price}코인`)); b._no = no; return b; }))
    : h('button', { class: 'btn primary big arc-go', disabled: !ok, onClick: () => pay(ENTRY, 1, [btn]) }, ok ? `🪙 ${ENTRY}코인 넣기` : '코인이 모자라요');
  close = modal({ title: plans ? (again ? '🪙 판을 다 썼어요! 동전을 넣으세요' : '🪙 동전을 넣으세요') : again ? `🪙 한 판 더? ${ENTRY}코인을 넣으세요` : `🪙 ${ENTRY}코인을 넣으세요`, onClose: () => { if (!paid) cancel && cancel(); },
    body: h('div', { class: 'arc-gate' }, slot, h('p', { class: 'arc-have' }, '내 돈 ', have$, plans ? ' · 몇 판 할지 골라요' : ok ? (again ? ' · 넣지 않으면 게임에서 나가요' : ` · 이기면 그대로 한 판 더`) : ` · ${ENTRY}코인이 있어야 해요`), btn) });
}

// 게임 화면에 들어올 때: 동전이 없으면 넣는 창부터. 넣지 않고 닫으면 나간다
export function needCoin(ctx, game) { if (PLANS[game.id] || hasCredit()) return; coinGate(ctx, game, null, () => outOfGame(ctx)); }
// 정산에서 부른다: 지거나 기록 판이 끝나면 동전을 다 쓴 것. 정산 카드를 읽을 틈을 주고 다시 넣는 창을 띄운다
export function bindCredit(ctx, GAMES) {
  ctx.useCredit = () => { if (!hasCredit()) return; setCredit(false); const id = (location.hash.match(/^#game-(\w+)/) || [])[1], g = GAMES.find(x => x.id === id); if (!g) return;
    setTimeout(() => { if (location.hash.startsWith('#game-' + id) && !hasCredit() && !document.querySelector('.arc-gate')) coinGate(ctx, g, null, () => outOfGame(ctx), true); }, 2200); };
}

export function openArcade(ctx, GAMES) {
  let close;
  const pick = g => { close && close(); const go = () => { try { sessionStorage.setItem('capy-arcade', '1'); } catch {} ctx.go('game-' + g.id); }; if (PLANS[g.id] || hasCredit()) go(); else coinGate(ctx, g, go); };
  close = modal({ title: '🕹️ 카피오락', body: h('div', { class: 'arc-list' },
    h('p', { class: 'arc-tip' }, `게임을 고르고 ${ENTRY}코인을 넣으면 시작해요 · 이기면 그대로 한 판 더`),
    GAMES.map((g, i) => h('button', { class: 'arc-card', onClick: () => pick(g) },
      h('span', { html: capy({ color: ['brown', 'cream', 'choco', 'peach'][i % 4], acc: g.acc, face: g.face, head: true }) }), h('b', null, g.title), h('small', null, g.sub)))) });
}
