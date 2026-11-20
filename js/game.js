// 오늘 무슨 게임하지? — 카피바라 게임 9종
import { h, modal, toast, josa } from './ui.js';
import { capyEl } from './capy.js';
import { omok, four, match } from './g-board.js';
import * as volley from './g-volley.js';
import * as yuzu from './g-yuzu.js';
import * as burger from './g-burger.js';
import * as tetris from './g-tetris.js';
import * as mahjong from './g-mahjong.js';
import * as claw from './g-claw.js';
import * as bubble from './g-bubble.js';
import { RATE, ENTRY } from './money.js';
import { needCoin, hasCredit, PLANS } from './arcade.js';

const HOTTEOK = 'https://hyunming9999-hash.github.io/hotteok-tekken/';

export const GAMES = [
  { id: 'omok', mod: omok, title: '카피바라 오목', sub: '다섯 알을 먼저 이으면 승리', face: 'smile', acc: 'leaf' },
  { id: 'volley', mod: volley, title: '카피바라 배구', sub: '유자 공으로 한 판 · 실시간', face: 'happy', acc: 'towel' },
  { id: 'match', mod: match, title: '짝 맞추기', sub: '같은 카피바라 찾기', face: 'wink', acc: 'flower' },
  { id: 'four', mod: four, title: '유자 사목', sub: '네 알을 먼저 이으면 승리', face: 'wow', acc: 'yuzu' },
  { id: 'yuzu', mod: yuzu, title: '유자 받기', sub: '30초 점수 대결', face: 'love', acc: 'ribbon' },
  { id: 'burger', mod: burger, title: '카피 버거', sub: '굽고 튀기고 쌓기 · 경쟁·기록·컴퓨터', face: 'happy', acc: 'yuzu' },
  { id: 'tetris', mod: tetris, title: '카피 테트리스', sub: '줄 지우기 · 경쟁·기록', face: 'wow', acc: 'leaf' },
  { id: 'bubble', mod: bubble, title: '카피 버블', sub: '같은 동물 구슬 3개 펑! · 기록·스테이지·경쟁', face: 'love', acc: 'ribbon' },
  { id: 'mahjong', mod: mahjong, title: '동물 마작', sub: '같은 동물 짝 없애기 · 경쟁·컴퓨터', face: 'smile', acc: 'flower' },
  { id: 'claw', mod: claw, title: '인형뽑기', sub: '집게로 동물 인형 뽑기 · 1판 50 · 3판 150 · 5판 200', face: 'wow', acc: 'ribbon' },
];

// 💰 내기: 사람끼리 하는 경쟁 판에만. 걸지 않아도 된다(선택)
const PVP = new Set(['omok', 'four', 'match', 'volley', 'burger', 'tetris', 'mahjong', 'bubble']);
function betBar(ctx, g) {
  const el = h('div', { class: 'bet-bar' }), pn = () => ctx.nameOf(ctx.partnerId), pj = (a, b) => josa(pn(), a, b);
  const draw = () => { const b = ctx.betOf(g.id), me = ctx.uid;
    if (!ctx.partnerId) return el.replaceChildren();
    if (!b) return el.replaceChildren(h('span', null, '💰 내기 없음'), h('button', { class: 'btn sm', onClick: offer }, '💰 내기 걸기'));
    if (b.state === 'offer' && b.by === me) return el.replaceChildren(h('span', null, `💰 ${b.amount}코인 내기 신청 · 기다리는 중`), h('small', null, `${pj('가', '이')} 받으면 성사돼요`), h('button', { class: 'btn sm', onClick: () => ctx.cancelBet(g.id) }, '취소'));
    if (b.state === 'offer') return el.replaceChildren(h('span', { class: 'hot' }, `💰 ${pj('가', '이')} ${b.amount}코인 내기!`), h('small', null, `받으면 나도 ${b.amount}코인을 걸고, 다음 경쟁 판 승자가 ${b.amount * 2}코인을 가져가요`), h('div', { class: 'bet-acts' }, h('button', { class: 'btn sm', onClick: () => ctx.cancelBet(g.id) }, '거절'), h('button', { class: 'btn sm primary', onClick: () => ctx.acceptBet(g.id) }, '받기')));
    const old = ctx.store.now() - (b.at || 0) > 30 * 60000;
    el.replaceChildren(h('span', { class: 'hot' }, `🔥 ${b.amount}코인 내기 중 · 이기면 +${b.amount * 2}`), h('small', null, `다음 경쟁 판에서 이긴 사람이 판돈 ${b.amount * 2}코인을 가져가요 · 비기면 돌려받아요`), ...(old ? [h('button', { class: 'btn sm', onClick: () => ctx.cancelBet(g.id) }, '무르기')] : [])); };
  const offer = () => { let v = 100; const amt = h('b', { class: 'bet-amt' }, '100코인'), set = n => { v = Math.max(10, Math.min(n, ctx.coins())); amt.textContent = `${v}코인`; };
    modal({ title: `💰 ${g.title} 내기`, body: h('div', { class: 'bet-pick' }, h('p', null, `${pj('와', '과')} 같은 돈을 걸어요(1:1). 다음 경쟁 판에서 이긴 사람이 둘이 건 돈을 모두 가져가요.`), amt,
      h('div', { class: 'bet-chips' }, [200, 500, 1000, 2000, 5000].map(n => h('button', { class: 'chip', onClick: () => set(n) }, String(n)))), h('input', { class: 'inp', type: 'number', min: 10, step: 10, placeholder: '직접 입력', onInput: e => set(+e.target.value || 0) }),
      h('small', { class: 'dim' }, `내 돈 ${ctx.coins().toLocaleString('ko-KR')}코인 · 걸 때 바로 빠지고, 상대가 거절하거나 취소하면 돌려받아요`)),
      actions: [{ label: '그만두기' }, { label: '내기 걸기', primary: true, onClick: async c => { if (await ctx.offerBet(g.id, v)) { c(); toast(`${pn()}에게 ${v}코인 내기를 신청했어요`); } } }] }); };
  ctx.betWatch = [...(ctx.betWatch || []), draw]; draw();
  return { el, stop: () => { ctx.betWatch = (ctx.betWatch || []).filter(f => f !== draw); } };
}

// 👀 관전: 내가 게임을 하는 동안 상대가 보고 있으면(관전 신호가 5초 안에 왔으면) 게임 화면을 0.7초마다 찍어 보낸다
// 그림판(canvas)은 작은 사진으로 바꾸고, 나머지 화면은 그대로 글(HTML)로 보낸다. 상대 화면에서는 같은 모양으로만 보이고 누를 수 없다
function caster(el, ctx, g, eye) {
  let last = '', watched = 0;
  const offW = ctx.store.on('watchers/' + ctx.uid, v => { watched = v && v.at ? v.at : 0; });
  const snap = () => {
    const on = ctx.partnerId && ctx.store.now() - watched < 6000; eye.hidden = !on; if (!on) return;
    const live = [...el.querySelectorAll('canvas')], c = el.cloneNode(true); c.querySelectorAll('.bet-bar, .spect-eye, .earn-card, .modal-wrap').forEach(n => n.remove());
    c.querySelectorAll('canvas').forEach((cv, i) => { const src = live[i]; if (!src || !src.width) return cv.remove(); try { const w = Math.min(360, src.width), t = document.createElement('canvas'); t.width = w; t.height = Math.round(src.height * w / src.width); t.getContext('2d').drawImage(src, 0, 0, t.width, t.height);
      const im = document.createElement('img'); im.src = t.toDataURL('image/jpeg', 0.6); im.className = cv.className; im.style.cssText = cv.style.cssText; im.style.width = (src.getBoundingClientRect().width || t.width) + 'px'; cv.replaceWith(im); } catch { cv.remove(); } });
    const html = c.innerHTML; if (html === last || html.length > 600000) return; last = html;
    ctx.store.set('spect/' + ctx.uid, { g: g.id, title: g.title, html, at: ctx.store.now() }).catch(() => {}); };
  const iv = setInterval(snap, 700);
  return () => { clearInterval(iv); offW(); ctx.store.set('spect/' + ctx.uid, null).catch(() => {}); };
}
function watchView(el, ctx) {
  const pid = ctx.partnerId; ctx.setTitle(`👀 ${ctx.nameOf(pid)} 관전`);
  const info = h('p', { class: 'spect-info' }, '연결하는 중…'), view = h('div', { class: 'spect-view' }); el.append(info, view);
  const beat = () => pid && ctx.store.set('watchers/' + pid, { by: ctx.uid, at: ctx.store.now() }).catch(() => {}); beat(); const iv = setInterval(beat, 2000);
  let at = 0; const tick = setInterval(() => { const w = ctx.partnerWhere || ''; if (!w.startsWith('game-') || w === 'game-watch') info.textContent = `${josa(ctx.nameOf(pid), '가', '이')} 지금 게임을 하고 있지 않아요`; else if (ctx.store.now() - at > 5000) info.textContent = `${titleOfGame(w)} 화면을 기다리는 중…`; }, 1000);
  const off = ctx.store.on('spect/' + pid, v => { if (!v || !v.html) return; at = v.at || ctx.store.now(); info.textContent = `🎮 ${ctx.nameOf(pid)}의 「${v.title}」 실시간 관전 중`; view.className = 'spect-view game-' + v.g; view.innerHTML = v.html; });
  return () => { clearInterval(iv); clearInterval(tick); off(); if (pid) ctx.store.set('watchers/' + pid, null).catch(() => {}); };
}
const titleOfGame = w => (GAMES.find(x => 'game-' + x.id === w) || { title: '게임' }).title;
// 게임 목록 맨 위: 상대가 지금 무슨 게임을 하는지
function partnerPlaying(ctx) {
  const el = h('div', { class: 'p-playing', hidden: true }), draw = () => { const pid = ctx.partnerId, w = (pid && ctx.presence[pid] && ctx.partnerWhere) || '';
    if (!w.startsWith('game-') || w === 'game-watch') { el.hidden = true; return; } el.hidden = false;
    el.replaceChildren(h('span', null, `🎮 ${josa(ctx.nameOf(pid), '는', '은')} 지금 「${titleOfGame(w)}」 하는 중`), h('button', { class: 'btn sm primary', onClick: () => ctx.go('game-watch') }, '👀 관전하기')); };
  draw(); const iv = setInterval(draw, 1500); return { el, stop: () => clearInterval(iv) };
}

export function mount(el, ctx, sub) {
  const g = GAMES.find(x => x.id === sub);
  if (sub === 'watch') return watchView(el, ctx);
  // 참가비가 모자라면 못 들어간다. 돈 정보가 아직 안 왔을 때는 막지 않는다(정산에서 0 아래로는 안 내려감)
  if (g && !PLANS[g.id] && !hasCredit() && ctx.money[ctx.uid] && ctx.coins() < ENTRY) { toast(`게임 한 판에 참가비 ${ENTRY}코인이 들어요. 지금 ${ctx.coins()}코인이라 모자라요`, 2600); setTimeout(() => ctx.go('game'), 0); return; }
  if (g) { ctx.setTitle(g.title); el.classList.add('game-' + g.id); const bar = PVP.has(g.id) ? betBar(ctx, g) : null; if (bar) el.append(bar.el); const eye = h('div', { class: 'spect-eye', hidden: true }, `👀 ${ctx.nameOf(ctx.partnerId)} 관전 중`); el.append(eye);
    const off = g.mod.mount(el, ctx), cast = caster(el, ctx, g, eye); needCoin(ctx, g); return () => { cast(); bar && bar.stop(); off && off(); }; }
  const pp = partnerPlaying(ctx); el.append(pp.el);
  el.append(h('div', { class: 'g-streak g-fee' }, h('b', null, `🪙 한 판 ${ENTRY}코인 · 동전 넣고 시작`), h('small', null, `게임을 시작할 때 ${ENTRY}코인을 넣어요(바로 빠져요). 이기거나 비기면 그대로 한 판 더, 지거나 기록 판이 끝나면 다시 넣어요.`)));
  el.append(h('div', { class: 'g-streak' }, h('b', null, '🔥 연승 보너스'), h('small', null, '컴퓨터전·경쟁전에서 이기면 1승 ×1 → 2연승 ×1.5 → 3연승 ×1.8 → 4연승 ×2.3 (4연승에서 확정). 연승 중에 지면 연승으로 번 돈의 2/3를 잃어요. 이길 때마다 그만두고 챙길 수 있고, 컴퓨터는 연승할수록 강해져요. 기록 모드는 해당 없어요.')));
  el.append(h('div', { class: 'game-list' }, GAMES.map((x, i) => h('button', { class: 'game-card', style: { animationDelay: i * 50 + 'ms' }, onClick: () => ctx.go('game-' + x.id) },
    capyEl({ color: ['brown', 'cream', 'choco', 'peach'][i % 4], acc: x.acc, face: x.face, head: true }), h('div', null, h('b', null, x.title), h('small', null, x.sub), RATE[x.id] && h('small', { class: 'g-rate' }, '🪙 ' + RATE[x.id])), h('span', { class: 'go' }, '›'))),
    h('a', { class: 'game-card ext', href: HOTTEOK, target: '_blank', rel: 'noopener', style: { animationDelay: '300ms' } }, h('span', { class: 'ext-ic' }, '🥊'), h('div', null, h('b', null, '호떡 철권'), h('small', null, '따로 만든 게임 · 새 창에서 열려요')), h('span', { class: 'go' }, '↗'))));
  return () => pp.stop();
}
