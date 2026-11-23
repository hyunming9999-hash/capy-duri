// 🎰 카피도박(트리플 세븐): 50·100·500코인을 걸고 레버를 당기면 릴 세 개가 돌다 왼쪽부터 멈춘다. 가운데 한 줄만 본다
// 릴마다 그림이 나올 비율(SYM의 w, 합 100)과 배당표(PAY)는 실제 릴 슬롯머신의 방식(가중 릴·고정 배당)을 따랐다. 하루 제한 없음
import { h, toast, modal } from './ui.js';
import { sfx } from './sound.js';

const SYM = [['seven', 8, 200, '세븐'], ['gem', 8, 50, '보석'], ['melon', 12, 25, '수박'], ['bell', 15, 12, '종'], ['yuzu', 25, 6, '유자'], ['cherry', 32, 4, '체리']]; // [그림, 릴 비율, 세 개 배당, 이름]
const TWO = { seven: 6, cherry: 2 }, BETS = [50, 100, 500], CELL = 100 / 3; // 딱 두 개만 맞아도 주는 그림
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
  const msg = h('div', { class: 'sl-msg' }, '레버를 당겨요!'), have = h('b', { class: 'sl-have' });
  const cab = h('div', { class: 'sl-cab' }, sign, h('div', { class: 'sl-win' }, ...reels), h('img', { class: 'sl-stick', src: 'img/slot/stick.webp', alt: '' }), h('img', { class: 'sl-ball', src: 'img/slot/ball.webp', alt: '' }), lever, h('i', { class: 'sl-touch' }, '터치!'), h('div', { class: 'sl-btns' }, ...betBtns), msg);
  const drawHave = () => { have.textContent = `🪙 ${ctx.coins().toLocaleString('ko-KR')}코인`; }; drawHave(); const iv = setInterval(drawHave, 800);
  const row = (ks, x, note) => h('div', { class: 'sl-row' }, h('span', null, ...ks.map(k => (k ? h('img', { src: img(k), alt: '' }) : h('i', null, '?')))), note && h('small', null, note), h('b', null, `×${x}`), h('em', null, BETS.map(n => `${n} → ${(n * x).toLocaleString('ko-KR')}`).join(' · ')));
  const tablePane = h('div', { class: 'sl-table', hidden: true }, h('p', { class: 'sl-th' }, '가운데 한 줄에 아래 그림이 나오면, 건 돈 × 배당만큼 받아요'),
    ...SYM.map(([k, , x, n]) => row([k, k, k], x, `${n} 3개`)), row(['seven', 'seven', null], TWO.seven, '세븐 딱 2개 (자리 무관)'), row(['cherry', 'cherry', null], TWO.cherry, '체리 딱 2개 (자리 무관)'));
  const tabs = [['play', '🎰 게임'], ['table', '📋 배당표']].map(([k, l]) => h('button', { class: 'so-tab' + (k === 'play' ? ' on' : ''), onClick: () => { tabs.forEach(t => t.classList.toggle('on', t === tb[k])); cab.hidden = k !== 'play'; tablePane.hidden = k !== 'table'; sfx('tock'); } }, l)), tb = { play: tabs[0], table: tabs[1] };
  el.append(h('div', { class: 'sl-top' }, have, h('div', { class: 'sl-tabs' }, ...tabs)), cab, tablePane,
    h('div', { class: 'sl-how' }, h('b', null, '🎰 게임 방법'), h('ol', null, h('li', null, '50 · 100 · 500 버튼으로 걸 돈을 골라요'), h('li', null, '오른쪽 빨간 레버를 터치해서 돌려요 (당길 때마다 건 돈이 빠져요)'), h('li', null, '가운데 한 줄에 같은 그림 3개면 당첨! 건 돈 × 배당을 받아요'), h('li', null, '세븐·체리는 2개만 나와도 당첨 · 자세한 건 배당표 탭에서'))),
    h('p', { class: 'dim center sl-note' }, '가운데 한 줄에 같은 그림 3개! · 실제 카지노 슬롯머신의 방식과 비율을 근거로 만든 게임이에요'));
  // 릴 하나 돌리기: 아무 그림 n장 뒤에 결과 그림을 붙여 아래로 흘려보낸다
  const run = (i, k, n, ms) => new Promise(res => { const s = strips[i], cur = s.lastChild.src, list = [k, ...Array.from({ length: n }, roll)];
    s.style.transition = 'none'; s.replaceChildren(...list.map(x => h('img', { src: img(x), alt: '' })), h('img', { src: cur, alt: '' })); s.style.transform = `translateY(-${(list.length) * CELL / (list.length + 1) * 3}%)`; void s.offsetWidth;
    s.style.transition = `transform ${ms}ms cubic-bezier(.15,.6,.25,1.04)`; s.style.transform = 'translateY(0)';
    setTimeout(() => { if (!alive) return res(); s.style.transition = 'none'; s.replaceChildren(h('img', { src: img(k), alt: '' })); reels[i].classList.add('stop'); setTimeout(() => reels[i].classList.remove('stop'), 260); sfx('tock'); res(); }, ms); });
  async function spin() { if (busy || !alive) return; if (ctx.coins() < bet) return toast(`돈이 모자라요 · ${bet}코인이 필요해요`, 1800);
    busy = true; cab.classList.remove('win', 'big'); cab.classList.remove('pull'); void cab.offsetWidth; cab.classList.add('pull'); setTimeout(() => cab.classList.remove('pull'), 700);
    if (!(await ctx.spend(bet))) { busy = false; return; } sfx('swing'); drawHave(); msg.textContent = '두근두근…'; msg.className = 'sl-msg';
    const ks = [roll(), roll(), roll()], x = payOf(ks), win = bet * x;
    await Promise.all(ks.map((k, i) => run(i, k, 14 + i * 8, 1100 + i * 650))); if (!alive) return;
    if (win) { await ctx.store.tx('money/' + ctx.uid, c => ({ ...(c || {}), c: ((c && c.c) || 0) + win, total: ((c && c.total) || 0) + win })).catch(() => {}); drawHave();
      const big = x >= 25; cab.classList.add('win'); if (big) cab.classList.add('big'); sfx(big ? 'fanfare' : x >= 6 ? 'bigfish' : 'coin'); msg.textContent = `${x >= 200 ? '🎉 트리플 세븐!! ' : big ? '🎉 대박! ' : ''}×${x} · +${win.toLocaleString('ko-KR')}코인`; msg.className = 'sl-msg ok';
      if (big) for (let n = 0; n < 26; n++) { const c = h('i', { class: 'sl-coin', style: { left: 20 + Math.random() * 60 + '%', animationDelay: (Math.random() * 0.9).toFixed(2) + 's' } }, '🪙'); cab.append(c); setTimeout(() => c.remove(), 2400); } }
    else { msg.textContent = '아깝다… 한 번 더!'; }
    busy = false; }
  return () => { alive = false; clearInterval(iv); };
}
