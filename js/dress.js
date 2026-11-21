// 옷입히기 놀이하실? — 카피바라에게 상의 50벌·하의 50벌·모자 50개를 입혀 보고, 서로의 카피바라에게도 입혀 준다
import { h, toast, josa } from './ui.js';
import { clothIcon } from './fluffy.js';
import { capy } from './capy.js';
import { TOPS, BOTTOMS, HATS, ZOO_HATS, SHOES, nameOf } from './clothes.js';
import { priceOf, won } from './money.js';
import { eqBoard, eqInv, wearGold, rareList, rareOf, goldBlocks, goldIn, rareName } from './social.js';
const SETS = { top: TOPS, bottom: BOTTOMS, hat: HATS, shoe: SHOES };

export function mount(el, ctx) {
  let who = ctx.uid, tab = 'top', sex = 'all', sel = { top: '', bottom: '', hat: '', shoe: '', ...(ctx.dress[ctx.uid] || {}) }, saved = ctx.dress;
  let goldOwned = [], invTab = 'gold'; const inv = h('div', { class: 'dress-inv' });
  const stage = h('div', { class: 'dress-stage' }), grid = h('div', { class: 'dress-grid' }), ctl = h('div', { class: 'dress-ctl' });
  // 친목회 전용 모자는 상점에서 팔지 않고, 동물에게 사서 가진 것만 맨 앞에 보인다
  const list = () => [...(tab === 'hat' ? ZOO_HATS.filter(x => ctx.owns(x.id)) : []), ...SETS[tab].filter(x => sex === 'all' || x.sex === sex || x.sex === 'u')];
  const pickWho = u => { who = u; const s = saved[u] || {}; sel = { top: s.top || '', bottom: s.bottom || '', hat: s.hat || '', shoe: s.shoe || '' }; draw(); };
  const need = () => ['top', 'bottom', 'hat', 'shoe'].filter(k => sel[k] && !ctx.owns(sel[k]) && (saved[who] || {})[k] !== sel[k]).map(k => sel[k]), // 그 카피바라가 이미 입고 있는 옷은 다시 살 필요가 없다(하나만 벗기려 해도 옷값을 내라고 하던 문제)
    bare = () => !sel.top && !sel.bottom && !sel.hat && !sel.shoe, cost = () => need().reduce((a, id) => a + priceOf(id), 0);
  const save = async () => {
    if (who !== ctx.uid) return toast('상대 카피바라의 옷은 바꾸거나 벗기거나 입힐 수 없어요');
    if (cost() > ctx.coins()) return toast(`돈이 모자라요 (${won(cost())} 필요, 지금 ${won(ctx.coins())}). 게임을 하면 돈을 벌어요`);
    if (need().length && cost() > 0 && !(await ctx.askBuy(need().map(nameOf).join(', '), cost()))) return;
    for (const id of need()) if (!(await ctx.buy(id))) return; // 아직 없는 옷은 사서 입는다
    try { await ctx.store.set('dress/' + who, { top: sel.top || '', bottom: sel.bottom || '', hat: sel.hat || '', shoe: sel.shoe || '', by: ctx.uid, ts: ctx.store.now() }); toast(bare() ? (who === ctx.uid ? '다 벗었어요' : `${ctx.nameOf(who)}의 옷을 벗겼어요`) : who === ctx.uid ? '갈아입었어요' : `${ctx.nameOf(who)}에게 입혀 줬어요`); } catch { toast('저장하지 못했어요. 잠시 뒤 다시 해 보세요'); }
  };
  const pickCloth = async (k, id) => { sel[k] = id; if (id) { const g = goldIn(rareList((ctx.members[ctx.uid] || {}).rare), k); for (const i of g) await wearGold(ctx, i); if (g.length) toast(`같은 자리라서 ${g.map(rareName).join(', ')}을(를) 벗었어요`, 2400); } draw(); };
  // 황금 장비를 걸치면 그 자리의 일반 옷은 벗고 바로 저장한다
  const wearG = async i => { const was = rareList((ctx.members[ctx.uid] || {}).rare).includes(i); await wearGold(ctx, i);
    if (!was) { const blk = [...goldBlocks([i])].filter(k => sel[k] || (saved[ctx.uid] || {})[k]); if (blk.length) { const names = blk.map(k => nameOf(sel[k] || (saved[ctx.uid] || {})[k])).filter(Boolean); blk.forEach(k => { sel[k] = ''; }); const d = { ...(saved[ctx.uid] || {}) }; blk.forEach(k => { d[k] = ''; }); saved = { ...saved, [ctx.uid]: d }; await ctx.store.update('dress/' + ctx.uid, Object.fromEntries(blk.map(k => [k, '']))).catch(() => {}); if (names.length) toast(`같은 자리라서 ${names.join(', ')}을(를) 벗었어요`, 2400); } }
    draw(); };
  const buyOne = async id => { const p = priceOf(id); if (p > ctx.coins()) return toast(`돈이 모자라요 (${won(p)} 필요, 지금 ${won(ctx.coins())})`); if (!(await ctx.askBuy(nameOf(id), p))) return; if (await ctx.buy(id)) { toast(`${nameOf(id)}을(를) 샀어요! 가진 장비 > 일반 장비에 담겼어요`, 2400); draw(); } };
  const random = () => { const r = a => a[Math.floor(Math.random() * a.length)].id; const f = k => SETS[k].filter(x => (sex === 'all' || x.sex === sex || x.sex === 'u') && ctx.owns(x.id)); sel = { top: r(f('top')), bottom: r(f('bottom')), hat: Math.random() < 0.7 ? r(f('hat')) : '', shoe: f('shoe').length && Math.random() < 0.7 ? r(f('shoe')) : '' }; draw(); };

  function draw() {
    const m = ctx.members[who] || {}, s = saved[who] || {}, same = (s.top || '') === (sel.top || '') && (s.bottom || '') === (sel.bottom || '') && (s.hat || '') === (sel.hat || '') && (s.shoe || '') === (sel.shoe || '');
    stage.replaceChildren(...[
      ctx.order.length > 1 && h('div', { class: 'chips' }, ctx.order.map(u => h('button', { class: 'chip' + (who === u ? ' on' : ''), onClick: () => pickWho(u) }, u === ctx.uid ? '내 카피바라' : ctx.nameOf(u) + ' 카피바라 구경'))),
      // 장비창: 가운데 카피바라(고른 옷 + 걸친 황금 장비), 양옆에 황금 장비 자리 칸
      eqBoard(ctx, { worn: rareList(m.rare), dip: !!(ctx.capyOf && ctx.capyOf(who).dip), readOnly: who !== ctx.uid, wear: wearG, cloth: sel, unCloth: k => pickCloth(k, ''),
        center: capy({ ...(ctx.capyOf ? ctx.capyOf(who) : { color: m.color, acc: m.acc }), face: ctx.faceOf(who), ...(b => ({ top: b.has('top') ? '' : sel.top, bottom: b.has('bottom') ? '' : sel.bottom, hat: b.has('hat') ? '' : sel.hat, shoe: b.has('shoe') ? '' : sel.shoe }))(goldBlocks(rareList(m.rare))), rare: rareOf(m.rare) }) }),
      h('p', { class: 'dress-name' }, h('b', null, nameOf(sel.top) || '상의 없음'), ' + ', h('b', null, nameOf(sel.bottom) || '하의 없음'), ' + ', h('b', null, nameOf(sel.hat) || '모자 없음'), ' + ', h('b', null, nameOf(sel.shoe) || '신발 없음')),
      s.by && s.by !== who && (s.top || s.bottom || s.hat || s.shoe) && h('small', { class: 'dim' }, `지금 입은 옷은 ${josa(ctx.nameOf(s.by), '가', '이')} 입혀 준 옷이에요`)].filter(Boolean));
    // 상대 카피바라는 구경만: 옷을 바꾸거나 벗기거나 입힐 수 없다
    const view = who !== ctx.uid; ctl.hidden = grid.hidden = tabs.hidden = inv.hidden = view;
    if (!view) { const SL = { top: '상의', bottom: '하의', hat: '모자', shoe: '신발' }, slotIdOf = id => Object.keys(SETS).find(k => SETS[k].some(x => x.id === id)) || (ZOO_HATS.some(x => x.id === id) ? 'hat' : '');
      const mine = [...ZOO_HATS, ...TOPS, ...BOTTOMS, ...HATS, ...SHOES].filter(x => ctx.owns(x.id) && (priceOf(x.id) > 0 || ZOO_HATS.includes(x)));
      const tabsEl = h('div', { class: 'inv-tabs' }, [['gold', `✨ 황금 장비 ${goldOwned.length}`], ['cloth', `👕 일반 장비 ${mine.length}`]].map(([k, t]) => h('button', { class: invTab === k ? 'on' : '', onClick: () => { invTab = k; draw(); } }, t)));
      const cloth = h('div', { class: 'eq eq-invw' }, h('div', { class: 'eq-inv-h' }, h('b', null, `👕 산 옷·모자·신발 ${mine.length}벌`), h('small', null, '누르면 입어 보기 · 다시 누르면 벗기 · 저장은 아래 입기 버튼')),
        mine.length ? h('div', { class: 'eq-inv' }, mine.map(x => { const k = slotIdOf(x.id), on = sel[k] === x.id;
          return h('button', { class: 'eq-item cloth' + (on ? ' on' : ''), title: x.name, onClick: () => pickCloth(k, on ? '' : x.id) },
            h('span', { html: clothIcon(x.id) || (k === 'hat' ? capy({ color: m.color, hat: x.id, head: true }).replace('viewBox="0 -22 120 112"', 'viewBox="0 -24 120 76"') : k === 'shoe' ? capy({ color: m.color, shoe: x.id }).replace('viewBox="0 -22 120 158"', 'viewBox="24 108 72 30"') : capy({ color: m.color, [k]: x.id }).replace('viewBox="0 -22 120 158"', 'viewBox="16 80 88 56"')) }),
            h('em', null, SL[k] || ''), on && h('i', null, '입는 중'), h('small', null, x.name)); }))
          : h('p', { class: 'eq-empty' }, '아직 산 옷이 없어요. 아래 옷 목록에서 유료 옷을 눌러 구매하기를 누르면 여기에 담겨요.'));
      inv.replaceChildren(tabsEl, invTab === 'gold' ? eqInv({ owned: goldOwned, worn: rareList(m.rare), wear: wearG }) : cloth); }
    if (view) stage.append(h('p', { class: 'dress-only' }, `👀 ${josa(ctx.nameOf(who), '가', '이')} 지금 입은 옷이에요. ${ctx.nameOf(who)}의 옷은 ${ctx.nameOf(who)}만 바꿀 수 있어요`));
    ctl.replaceChildren(
      h('button', { class: 'btn', onClick: random }, '🎲 아무거나'),
      who === ctx.uid ? h('button', { class: 'btn', onClick: () => ctx.pickFace(draw) }, '😊 표정') : '',
      who === ctx.uid ? h('button', { class: 'btn', onClick: () => { sel = { top: '', bottom: '', hat: '', shoe: '' }; draw(); } }, '다 벗기') : '',
      h('button', { class: 'btn primary', disabled: same, onClick: save }, same ? (bare() ? '벗고 있어요' : '입고 있어요') : bare() ? (who === ctx.uid ? '옷 벗기' : '옷 벗기기') : cost() ? `${won(cost())} 사서 ${who === ctx.uid ? '입기' : '입혀 주기'}` : who === ctx.uid ? '이 옷 입기' : '이 옷 입혀 주기'),
      h('small', { class: 'dress-wallet' }, '내 돈 ', h('b', { 'data-coins': 1 }, won(ctx.coins()))));
    const items = list();
    grid.replaceChildren(...items.map(it => h('button', { class: 'dress-item' + (sel[tab] === it.id ? ' on' : '') + (ctx.owns(it.id) ? '' : ' lock'), 'data-price': ctx.owns(it.id) ? '' : won(priceOf(it.id)), title: it.name, 'aria-label': it.name, onClick: () => { if (who !== ctx.uid) return toast('상대 카피바라의 옷은 바꿀 수 없어요'); pickCloth(tab, sel[tab] === it.id ? '' : it.id); } },
      sel[tab] === it.id && !ctx.owns(it.id) && who === ctx.uid && h('b', { class: 'dress-buy', onClick: e => { e.stopPropagation(); buyOne(it.id); } }, '구매하기'),
      h('span', { html: clothIcon(it.id) || (tab === 'hat' ? capy({ color: m.color, hat: it.id, head: true }).replace('viewBox="0 -22 120 112"', 'viewBox="0 -24 120 76"') : tab === 'shoe' ? capy({ color: m.color, shoe: it.id }).replace('viewBox="0 -22 120 158"', 'viewBox="24 108 72 30"') : capy({ color: m.color, [tab]: it.id }).replace('viewBox="0 -22 120 158"', 'viewBox="16 80 88 56"')) }), h('small', null, it.name))));
    tabs.replaceChildren(
      h('div', { class: 'tabs' }, [['top', `상의 ${TOPS.length}`], ['bottom', `하의 ${BOTTOMS.length}`], ['hat', `모자 ${HATS.length}`], ['shoe', `신발 ${SHOES.length}`]].map(([k, t]) => h('button', { class: 'tab' + (tab === k ? ' on' : ''), onClick: () => { tab = k; draw(); } }, t))),
      h('div', { class: 'chips' }, [['all', '전체'], ['m', '남자 옷'], ['f', '여자 옷']].map(([k, t]) => h('button', { class: 'chip' + (sex === k ? ' on' : ''), onClick: () => { sex = k; draw(); } }, t)), h('small', { class: 'dim' }, ` ${items.length}${tab === 'hat' ? '개' : tab === 'shoe' ? '켤레' : '벌'}`)));
  }
  const tabs = h('div');
  el.append(stage, ctl, inv, tabs, grid);
  const off = ctx.store.on('dress', v => { const prev = saved[ctx.uid] || {}; saved = v || {}; // 아직 손대지 않았으면 저장된 옷으로 맞춘다(다른 화면에서 바꾼 것도 반영)
    if (who === ctx.uid && ['top', 'bottom', 'hat', 'shoe'].every(k => (sel[k] || '') === (prev[k] || ''))) { const d = saved[ctx.uid] || {}; sel = { top: d.top || '', bottom: d.bottom || '', hat: d.hat || '', shoe: d.shoe || '' }; } draw(); });
  const offG = ctx.store.on('bag/' + ctx.uid + '/rares', v => { goldOwned = Object.keys(v || {}).filter(k => v[k]).map(Number); draw(); }); // 가진 황금 장비
  draw();
  return () => { off(); offG(); };
}
