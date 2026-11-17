// 옷입히기 놀이하실? — 카피바라에게 상의 50벌·하의 50벌·모자 50개를 입혀 보고, 서로의 카피바라에게도 입혀 준다
import { h, toast, josa } from './ui.js';
import { capy } from './capy.js';
import { TOPS, BOTTOMS, HATS, ZOO_HATS, SHOES, nameOf } from './clothes.js';
import { priceOf, won } from './money.js';
const SETS = { top: TOPS, bottom: BOTTOMS, hat: HATS, shoe: SHOES };

export function mount(el, ctx) {
  let who = ctx.uid, tab = 'top', sex = 'all', sel = { top: '', bottom: '', hat: '', shoe: '', ...(ctx.dress[ctx.uid] || {}) }, saved = ctx.dress;
  const stage = h('div', { class: 'dress-stage' }), grid = h('div', { class: 'dress-grid' }), ctl = h('div', { class: 'dress-ctl' });
  // 친목회 전용 모자는 상점에서 팔지 않고, 동물에게 사서 가진 것만 맨 앞에 보인다
  const list = () => [...(tab === 'hat' ? ZOO_HATS.filter(x => ctx.owns(x.id)) : []), ...SETS[tab].filter(x => sex === 'all' || x.sex === sex || x.sex === 'u')];
  const pickWho = u => { who = u; const s = saved[u] || {}; sel = { top: s.top || '', bottom: s.bottom || '', hat: s.hat || '', shoe: s.shoe || '' }; draw(); };
  const need = () => ['top', 'bottom', 'hat', 'shoe'].filter(k => sel[k] && !ctx.owns(sel[k]) && (saved[who] || {})[k] !== sel[k]).map(k => sel[k]), // 그 카피바라가 이미 입고 있는 옷은 다시 살 필요가 없다(하나만 벗기려 해도 옷값을 내라고 하던 문제)
    bare = () => !sel.top && !sel.bottom && !sel.hat && !sel.shoe, cost = () => need().reduce((a, id) => a + priceOf(id), 0);
  const save = async () => {
    if (who !== ctx.uid) return toast('상대 카피바라의 옷은 바꾸거나 벗기거나 입힐 수 없어요');
    if (cost() > ctx.coins()) return toast(`돈이 모자라요 (${won(cost())} 필요, 지금 ${won(ctx.coins())}). 게임을 하면 돈을 벌어요`);
    for (const id of need()) if (!(await ctx.buy(id))) return; // 아직 없는 옷은 사서 입는다
    try { await ctx.store.set('dress/' + who, { top: sel.top || '', bottom: sel.bottom || '', hat: sel.hat || '', shoe: sel.shoe || '', by: ctx.uid, ts: ctx.store.now() }); toast(bare() ? (who === ctx.uid ? '다 벗었어요' : `${ctx.nameOf(who)}의 옷을 벗겼어요`) : who === ctx.uid ? '갈아입었어요' : `${ctx.nameOf(who)}에게 입혀 줬어요`); } catch { toast('저장하지 못했어요. 잠시 뒤 다시 해 보세요'); }
  };
  const random = () => { const r = a => a[Math.floor(Math.random() * a.length)].id; const f = k => SETS[k].filter(x => (sex === 'all' || x.sex === sex || x.sex === 'u') && ctx.owns(x.id)); sel = { top: r(f('top')), bottom: r(f('bottom')), hat: Math.random() < 0.7 ? r(f('hat')) : '', shoe: f('shoe').length && Math.random() < 0.7 ? r(f('shoe')) : '' }; draw(); };

  function draw() {
    const m = ctx.members[who] || {}, s = saved[who] || {}, same = (s.top || '') === (sel.top || '') && (s.bottom || '') === (sel.bottom || '') && (s.hat || '') === (sel.hat || '') && (s.shoe || '') === (sel.shoe || '');
    stage.replaceChildren(...[
      ctx.order.length > 1 && h('div', { class: 'chips' }, ctx.order.map(u => h('button', { class: 'chip' + (who === u ? ' on' : ''), onClick: () => pickWho(u) }, u === ctx.uid ? '내 카피바라' : ctx.nameOf(u) + ' 카피바라 구경'))),
      h('div', { class: 'dress-capy', html: capy({ color: m.color, acc: m.acc, face: 'happy', top: sel.top, bottom: sel.bottom, hat: sel.hat, shoe: sel.shoe }) }),
      h('p', { class: 'dress-name' }, h('b', null, nameOf(sel.top) || '상의 없음'), ' + ', h('b', null, nameOf(sel.bottom) || '하의 없음'), ' + ', h('b', null, nameOf(sel.hat) || '모자 없음'), ' + ', h('b', null, nameOf(sel.shoe) || '신발 없음')),
      s.by && s.by !== who && (s.top || s.bottom || s.hat || s.shoe) && h('small', { class: 'dim' }, `지금 입은 옷은 ${josa(ctx.nameOf(s.by), '가', '이')} 입혀 준 옷이에요`)].filter(Boolean));
    // 상대 카피바라는 구경만: 옷을 바꾸거나 벗기거나 입힐 수 없다
    const view = who !== ctx.uid; ctl.hidden = grid.hidden = tabs.hidden = view;
    if (view) stage.append(h('p', { class: 'dress-only' }, `👀 ${josa(ctx.nameOf(who), '가', '이')} 지금 입은 옷이에요. ${ctx.nameOf(who)}의 옷은 ${ctx.nameOf(who)}만 바꿀 수 있어요`));
    ctl.replaceChildren(
      h('button', { class: 'btn', onClick: random }, '🎲 아무거나'),
      who === ctx.uid ? h('button', { class: 'btn', onClick: () => { sel = { top: '', bottom: '', hat: '', shoe: '' }; draw(); } }, '다 벗기') : '',
      h('button', { class: 'btn primary', disabled: same, onClick: save }, same ? (bare() ? '벗고 있어요' : '입고 있어요') : bare() ? (who === ctx.uid ? '옷 벗기' : '옷 벗기기') : cost() ? `${won(cost())} 사서 ${who === ctx.uid ? '입기' : '입혀 주기'}` : who === ctx.uid ? '이 옷 입기' : '이 옷 입혀 주기'),
      h('small', { class: 'dress-wallet' }, '내 돈 ', h('b', { 'data-coins': 1 }, won(ctx.coins()))));
    const items = list();
    grid.replaceChildren(...items.map(it => h('button', { class: 'dress-item' + (sel[tab] === it.id ? ' on' : '') + (ctx.owns(it.id) ? '' : ' lock'), 'data-price': ctx.owns(it.id) ? '' : won(priceOf(it.id)), title: it.name, 'aria-label': it.name, onClick: () => { if (who !== ctx.uid) return toast('상대 카피바라의 옷은 바꿀 수 없어요'); sel[tab] = sel[tab] === it.id ? '' : it.id; draw(); } },
      h('span', { html: tab === 'hat' ? capy({ color: m.color, hat: it.id, head: true }).replace('viewBox="0 -22 120 112"', 'viewBox="0 -24 120 76"') : tab === 'shoe' ? capy({ color: m.color, shoe: it.id }).replace('viewBox="0 -22 120 158"', 'viewBox="24 108 72 30"') : capy({ color: m.color, [tab]: it.id }).replace('viewBox="0 -22 120 158"', 'viewBox="16 80 88 56"') }), h('small', null, it.name))));
    tabs.replaceChildren(
      h('div', { class: 'tabs' }, [['top', `상의 ${TOPS.length}`], ['bottom', `하의 ${BOTTOMS.length}`], ['hat', `모자 ${HATS.length}`], ['shoe', `신발 ${SHOES.length}`]].map(([k, t]) => h('button', { class: 'tab' + (tab === k ? ' on' : ''), onClick: () => { tab = k; draw(); } }, t))),
      h('div', { class: 'chips' }, [['all', '전체'], ['m', '남자 옷'], ['f', '여자 옷']].map(([k, t]) => h('button', { class: 'chip' + (sex === k ? ' on' : ''), onClick: () => { sex = k; draw(); } }, t)), h('small', { class: 'dim' }, ` ${items.length}${tab === 'hat' ? '개' : tab === 'shoe' ? '켤레' : '벌'}`)));
  }
  const tabs = h('div');
  el.append(stage, ctl, tabs, grid);
  const off = ctx.store.on('dress', v => { saved = v || {}; draw(); });
  draw();
  return () => off();
}
