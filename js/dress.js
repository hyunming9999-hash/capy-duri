// 옷입히기 놀이하실? — 카피바라에게 상의 50벌·하의 50벌·모자 50개를 입혀 보고, 서로의 카피바라에게도 입혀 준다
import { h, toast, josa } from './ui.js';
import { capy } from './capy.js';
import { TOPS, BOTTOMS, HATS, nameOf } from './clothes.js';
const SETS = { top: TOPS, bottom: BOTTOMS, hat: HATS };

export function mount(el, ctx) {
  let who = ctx.uid, tab = 'top', sex = 'all', sel = { top: '', bottom: '', hat: '', ...(ctx.dress[ctx.uid] || {}) }, saved = ctx.dress;
  const stage = h('div', { class: 'dress-stage' }), grid = h('div', { class: 'dress-grid' }), ctl = h('div', { class: 'dress-ctl' });
  const list = () => SETS[tab].filter(x => sex === 'all' || x.sex === sex || x.sex === 'u');
  const pickWho = u => { who = u; const s = saved[u] || {}; sel = { top: s.top || '', bottom: s.bottom || '', hat: s.hat || '' }; draw(); };
  const save = async () => {
    try { await ctx.store.set('dress/' + who, { top: sel.top || '', bottom: sel.bottom || '', hat: sel.hat || '', by: ctx.uid, ts: ctx.store.now() }); toast(who === ctx.uid ? '갈아입었어요' : `${ctx.nameOf(who)}에게 입혀 줬어요`); } catch {}
  };
  const random = () => { const r = a => a[Math.floor(Math.random() * a.length)].id; const f = k => SETS[k].filter(x => sex === 'all' || x.sex === sex || x.sex === 'u'); sel = { top: r(f('top')), bottom: r(f('bottom')), hat: Math.random() < 0.7 ? r(f('hat')) : '' }; draw(); };

  function draw() {
    const m = ctx.members[who] || {}, s = saved[who] || {}, same = (s.top || '') === (sel.top || '') && (s.bottom || '') === (sel.bottom || '') && (s.hat || '') === (sel.hat || '');
    stage.replaceChildren(...[
      ctx.order.length > 1 && h('div', { class: 'chips' }, ctx.order.map(u => h('button', { class: 'chip' + (who === u ? ' on' : ''), onClick: () => pickWho(u) }, u === ctx.uid ? '내 카피바라' : ctx.nameOf(u) + ' 카피바라'))),
      h('div', { class: 'dress-capy', html: capy({ color: m.color, acc: m.acc, face: 'happy', top: sel.top, bottom: sel.bottom, hat: sel.hat }) }),
      h('p', { class: 'dress-name' }, h('b', null, nameOf(sel.top) || '상의 없음'), ' + ', h('b', null, nameOf(sel.bottom) || '하의 없음'), ' + ', h('b', null, nameOf(sel.hat) || '모자 없음')),
      s.by && s.by !== who && (s.top || s.bottom || s.hat) && h('small', { class: 'dim' }, `지금 입은 옷은 ${josa(ctx.nameOf(s.by), '가', '이')} 입혀 준 옷이에요`)].filter(Boolean));
    ctl.replaceChildren(
      h('button', { class: 'btn', onClick: random }, '🎲 아무거나'),
      h('button', { class: 'btn', onClick: () => { sel = { top: '', bottom: '', hat: '' }; draw(); } }, '다 벗기'),
      h('button', { class: 'btn primary', disabled: same, onClick: save }, same ? '입고 있어요' : who === ctx.uid ? '이 옷 입기' : '이 옷 입혀 주기'));
    const items = list();
    grid.replaceChildren(...items.map(it => h('button', { class: 'dress-item' + (sel[tab] === it.id ? ' on' : ''), title: it.name, 'aria-label': it.name, onClick: () => { sel[tab] = sel[tab] === it.id ? '' : it.id; draw(); } },
      h('span', { html: tab === 'hat' ? capy({ color: m.color, hat: it.id, head: true }).replace('viewBox="0 -22 120 112"', 'viewBox="0 -24 120 76"') : capy({ color: m.color, [tab]: it.id }).replace('viewBox="0 -22 120 158"', 'viewBox="16 80 88 56"') }), h('small', null, it.name))));
    tabs.replaceChildren(
      h('div', { class: 'tabs' }, [['top', `상의 ${TOPS.length}`], ['bottom', `하의 ${BOTTOMS.length}`], ['hat', `모자 ${HATS.length}`]].map(([k, t]) => h('button', { class: 'tab' + (tab === k ? ' on' : ''), onClick: () => { tab = k; draw(); } }, t))),
      h('div', { class: 'chips' }, [['all', '전체'], ['m', '남자 옷'], ['f', '여자 옷']].map(([k, t]) => h('button', { class: 'chip' + (sex === k ? ' on' : ''), onClick: () => { sex = k; draw(); } }, t)), h('small', { class: 'dim' }, ` ${items.length}${tab === 'hat' ? '개' : '벌'}`)));
  }
  const tabs = h('div');
  el.append(stage, ctl, tabs, grid);
  const off = ctx.store.on('dress', v => { saved = v || {}; draw(); });
  draw();
  return () => off();
}
