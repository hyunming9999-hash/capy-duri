// 🎰 카피도박(트리플 세븐): 50·100코인을 걸고 레버를 당기면 릴 세 개가 돌다 왼쪽부터 멈춘다. 가운데 한 줄만 본다
// 릴마다 그림이 나올 비율(SYM의 w, 합 100)과 배당표(PAY)는 실제 릴 슬롯머신의 방식(가중 릴·고정 배당)을 따랐다. 하루 제한 없음
import { h, toast, modal } from './ui.js';
import { sfx } from './sound.js';

const SYM = [['seven', 5, 200, '세븐'], ['gem', 8, 50, '보석'], ['melon', 12, 25, '수박'], ['bell', 15, 12, '종'], ['yuzu', 25, 6, '유자'], ['cherry', 35, 4, '체리']]; // [그림, 릴 비율, 세 개 배당, 이름]
const TWO = { seven: 10, cherry: 2 }, BETS = [50, 100], CELL = 100 / 3; // 딱 두 개만 맞아도 주는 그림
const img = k => `img/slot/${k}.webp`;
const roll = () => { let r = Math.random() * 100; for (const s of SYM) { r -= s[1]; if (r < 0) return s[0]; } return 'cherry'; };
export const payOf = ks => { const [a, b, c] = ks; if (a === b && b === c) return SYM.find(s => s[0] === a)[2]; for (const k in TWO) if (ks.filter(x => x === k).length === 2) return TWO[k]; return 0; };

export function mount(el, ctx) {
  let alive = true, busy = false, bet = BETS[0], auto = 0;
  const strips = [0, 1, 2].map(() => h('div', { class: 'sl-strip' }, h('img', { src: img(roll()), alt: '' })));
  const reels = strips.map(s => h('div', { class: 'sl-reel' }, s));
  const sign = h('div', { class: 'sl-sign' }, h('b', null, '카피도박'), h('small', null, 'TRIPLE 7'));
  const lever = h('button', { class: 'sl-lever', 'aria-label': '레버 당기기', onClick: () => spin() });
  const betBtns = BETS.map(n => h('button', { class: 'sl-bet' + (n === bet ? ' on' : ''), onClick: () => { if (busy) return; bet = n; betBtns.forEach((b, i) => b.classList.toggle('on', BETS[i] === n)); sfx('tock'); } }, String(n)));
  const spinBtn = h('button', { class: 'sl-spin', onClick: () => spin() }, 'SPIN');
  const msg = h('div', { class: 'sl-msg' }, '레버를 당겨요!'), have = h('b', { class: 'sl-have' });
  const cab = h('div', { class: 'sl-cab' }, sign, h('div', { class: 'sl-win' }, ...reels), lever, h('div', { class: 'sl-btns' }, betBtns[0], spinBtn, betBtns[1]), msg);
  const drawHave = () => { have.textContent = `🪙 ${ctx.coins().toLocaleString('ko-KR')}코인`; }; drawHave(); const iv = setInterval(drawHave, 800);
  el.append(h('div', { class: 'sl-top' }, have, h('button', { class: 'btn sm', onClick: table }, '📋 배당표')), cab,
    h('p', { class: 'dim center sl-note' }, '가운데 한 줄에 같은 그림 3개! · 실제 카지노 슬롯머신의 방식과 비율을 근거로 만든 게임이에요'));
  function table() { modal({ title: '📋 카피도박 배당표', body: h('div', { class: 'sl-table' }, ...SYM.map(([k, , x, n]) => h('div', null, h('span', null, ...[0, 1, 2].map(() => h('img', { src: img(k), alt: n }))), h('b', null, `×${x}`))),
      h('div', null, h('span', null, h('img', { src: img('seven'), alt: '' }), h('img', { src: img('seven'), alt: '' }), h('i', null, '?')), h('b', null, `×${TWO.seven}`)), h('div', null, h('span', null, h('img', { src: img('cherry'), alt: '' }), h('img', { src: img('cherry'), alt: '' }), h('i', null, '?')), h('b', null, `×${TWO.cherry}`)),
      h('p', { class: 'dim center' }, '건 돈 × 배당만큼 받아요 · 두 개짜리는 자리와 상관없이 딱 2개일 때')), actions: [{ label: '닫기', primary: true }] }); }
  // 릴 하나 돌리기: 아무 그림 n장 뒤에 결과 그림을 붙여 아래로 흘려보낸다
  const run = (i, k, n, ms) => new Promise(res => { const s = strips[i], cur = s.lastChild.src, list = [k, ...Array.from({ length: n }, roll)];
    s.style.transition = 'none'; s.replaceChildren(...list.map(x => h('img', { src: img(x), alt: '' })), h('img', { src: cur, alt: '' })); s.style.transform = `translateY(-${(list.length) * CELL / (list.length + 1) * 3}%)`; void s.offsetWidth;
    s.style.transition = `transform ${ms}ms cubic-bezier(.15,.6,.25,1.04)`; s.style.transform = 'translateY(0)';
    setTimeout(() => { if (!alive) return res(); s.style.transition = 'none'; s.replaceChildren(h('img', { src: img(k), alt: '' })); reels[i].classList.add('stop'); setTimeout(() => reels[i].classList.remove('stop'), 260); sfx('tock'); res(); }, ms); });
  async function spin() { if (busy || !alive) return; if (ctx.coins() < bet) return toast(`돈이 모자라요 · ${bet}코인이 필요해요`, 1800);
    busy = true; cab.classList.remove('win', 'big'); lever.classList.add('pull'); setTimeout(() => lever.classList.remove('pull'), 500);
    if (!(await ctx.spend(bet))) { busy = false; return; } drawHave(); msg.textContent = '두근두근…'; msg.className = 'sl-msg';
    const ks = [roll(), roll(), roll()], x = payOf(ks), win = bet * x;
    await Promise.all(ks.map((k, i) => run(i, k, 14 + i * 8, 1100 + i * 650))); if (!alive) return;
    if (win) { await ctx.store.tx('money/' + ctx.uid, c => ({ ...(c || {}), c: ((c && c.c) || 0) + win, total: ((c && c.total) || 0) + win })).catch(() => {}); drawHave();
      const big = x >= 25; cab.classList.add('win'); if (big) cab.classList.add('big'); sfx(big ? 'fanfare' : x >= 6 ? 'bigfish' : 'coin'); msg.textContent = `${x >= 200 ? '🎉 트리플 세븐!! ' : big ? '🎉 대박! ' : ''}×${x} · +${win.toLocaleString('ko-KR')}코인`; msg.className = 'sl-msg ok';
      if (big) for (let n = 0; n < 26; n++) { const c = h('i', { class: 'sl-coin', style: { left: 20 + Math.random() * 60 + '%', animationDelay: (Math.random() * 0.9).toFixed(2) + 's' } }, '🪙'); cab.append(c); setTimeout(() => c.remove(), 2400); } }
    else { msg.textContent = '아깝다… 한 번 더!'; }
    busy = false; }
  return () => { alive = false; clearInterval(iv); };
}
