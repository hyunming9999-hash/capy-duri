// 수하물 검사 연출: 캐리어가 컨베이어를 따라 엑스레이 검색대를 지나가고, 결과를 초록(통과) · 빨강(거부)으로 크게 알린다
import { h } from './ui.js';
import { sfx } from './sound.js';

export function bagScan(ok, items = []) {
  return new Promise(res => {
    const icons = (items.length ? items : ['🐟', '🌾', '🥕']).slice(0, 4);
    const bag = h('div', { class: 'bs-bag' }, h('img', { src: 'img/air/suitcase.webp?v=1', alt: '' }));
    const xr = h('div', { class: 'bs-xr' }, ...icons.map((t, k) => h('i', { style: { left: 18 + k * 18 + '%', animationDelay: (0.55 + k * 0.08) + 's' } }, t)));
    const res0 = h('div', { class: 'bs-res' }, h('b', null, ok ? '✅ 수하물 통과' : '⛔ 출국 거부'), h('small', null, ok ? '짐이 기준 안이에요' : '짐이 기준을 넘었어요'));
    let el; el = h('div', { class: 'bs' }, h('p', { class: 'bs-t' }, '🧳 수하물 검사 중…'),
      h('div', { class: 'bs-stage' }, h('div', { class: 'bs-belt' }), bag, h('div', { class: 'bs-arch' }, h('span', { class: 'bs-lamp' }), xr, h('em', { class: 'bs-beam' }))), res0);
    document.body.append(el); sfx('pop');
    setTimeout(() => sfx('tock'), 500); setTimeout(() => sfx('tock'), 900);
    setTimeout(() => { el.classList.add(ok ? 'ok' : 'no'); el.querySelector('.bs-t').textContent = ok ? '🧳 수하물 검사 끝 · 통과!' : '🧳 수하물 검사 끝 · 기준 초과!'; sfx(ok ? 'fanfare' : 'bad'); try { if (!ok && navigator.vibrate) navigator.vibrate([120, 60, 160]); } catch (e) {} }, 1700);
    setTimeout(() => { el.classList.add('out'); setTimeout(() => { el.remove(); res(); }, 260); }, ok ? 2700 : 3000);
  });
}
