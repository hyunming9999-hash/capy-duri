// 🕹️ 카피 오락실(시험판: 주소에 ?arcadetest): 친목회 놀이터의 건물을 누르면 게임을 고르고, 50코인을 넣는 모션 뒤에 게임으로 들어간다
import { h, toast, modal } from './ui.js';
import { capy } from './capy.js';
import { sfx } from './sound.js';
import { ENTRY } from './money.js';

export const ARCADE_TEST = (() => { try { return new URLSearchParams(location.search).has('arcadetest'); } catch { return false; } })();
// 오락실에서 들어간 게임은 뒤로 가기를 누르면 친목회로 돌아온다
export const fromArcade = () => { try { return sessionStorage.getItem('capy-arcade') === '1'; } catch { return false; } };
export const leaveArcade = () => { try { sessionStorage.removeItem('capy-arcade'); } catch {} };

// 동전 넣기: "50코인을 넣으세요" 창 → 누르면 동전이 투입구로 들어가고 CREDIT 1 → done()
export function coinGate(ctx, game, done) {
  const have = ctx.coins(), ok = !ctx.money[ctx.uid] || have >= ENTRY; let busy = false, close;
  const coin = h('i', { class: 'arc-coin' }, h('b', null, '50')), credit = h('em', { class: 'arc-credit' }, 'INSERT COIN');
  const slot = h('div', { class: 'arc-machine' }, h('div', { class: 'arc-screen' }, h('span', { html: capy({ color: (ctx.members[ctx.uid] || {}).color, face: game.face, acc: game.acc, head: true }) }), h('b', null, game.title), credit), h('div', { class: 'arc-panel' }, h('div', { class: 'arc-slot' }, h('u')), h('small', null, `${ENTRY}`)), coin);
  const btn = h('button', { class: 'btn primary big arc-go', disabled: !ok, onClick: () => { if (busy) return; busy = true; btn.disabled = true; slot.classList.add('in'); sfx('tock');
    setTimeout(() => { sfx('point'); credit.textContent = 'CREDIT 1'; slot.classList.add('paid'); }, 800);
    setTimeout(() => { close && close(); done(); }, 1700); } }, ok ? `🪙 ${ENTRY}코인 넣기` : '코인이 모자라요');
  close = modal({ title: `🪙 ${ENTRY}코인을 넣으세요`, body: h('div', { class: 'arc-gate' }, slot, h('p', { class: 'arc-have' }, '내 돈 ', h('b', null, `${have.toLocaleString('ko-KR')}코인`), ok ? ` · 한 판에 ${ENTRY}코인` : ` · ${ENTRY}코인이 있어야 해요`), btn) });
}

export function openArcade(ctx, GAMES) {
  let close;
  const pick = g => { close && close(); coinGate(ctx, g, () => { try { sessionStorage.setItem('capy-arcade', '1'); } catch {} ctx.go('game-' + g.id); }); };
  close = modal({ title: '🕹️ 카피 오락실', body: h('div', { class: 'arc-list' },
    h('p', { class: 'arc-tip' }, `게임을 고르고 ${ENTRY}코인을 넣으면 시작해요`),
    GAMES.map((g, i) => h('button', { class: 'arc-card', onClick: () => pick(g) },
      h('span', { html: capy({ color: ['brown', 'cream', 'choco', 'peach'][i % 4], acc: g.acc, face: g.face, head: true }) }), h('b', null, g.title), h('small', null, g.sub)))) });
}
