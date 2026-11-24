// 카피궁 시안 고르기: 핫똑랜드에서 돌아온 폐하를 부엉이가 불러 궁전 시안 네 가지를 보여 준다.
// 고른 시안은 농장처럼 사람마다 따로 palace/<uid> 에 적는다. 지금은 고르기만 하고 코인은 지을 때 낸다(시중 · 관리 뽑기는 나중).
import { h, toast, modal } from './ui.js';
import { sfx } from './sound.js';
import { won } from './money.js';

export const PALACES = [
  { id: 1, name: '앙코르 황금궁', price: 800000, tag: '연못 위 황금 사원 궁전' },
  { id: 2, name: '크렘린 별궁', price: 800000, tag: '눈 내리는 붉은 성과 양파 지붕' },
  { id: 3, name: '히메지 금각궁', price: 780000, tag: '벚꽃 속 하얀 천수각과 금각' },
  { id: 4, name: '카피궁', price: 750000, tag: '유자 온천이 흐르는 카피바라 궁전' }];
export const PALTEST = /[?&]palacetest/.test(location.search); // 시험 주소: 바로 부엉이가 부르고, 골라도 저장하지 않는다
const LINES = ['핫똑랜드에서 무사히 돌아오셨구먼, 폐하. 먼 길 고생 많으셨네.', '우리 카피랜드도 이제 폐하국의 위엄을 되찾아야 하는 법이라네.', '공항 너머 언덕에 우리만의 궁전을 세우세. 시안 네 가지를 그려 왔다네.', '미리 말씀해 주시면 재료는 소신이 준비해 두겠네.'];

// 아직 시안을 안 골랐고, 핫똑랜드에 다녀온 적이 있으면(또는 시험 주소면) true
export async function palaceDue(ctx) { if (PALTEST) return true; try { const p = await ctx.store.get('palace/' + ctx.uid); if (p && p.pick) return false; const a = await ctx.store.get('air/' + ctx.uid); return !!(a && a.home); } catch { return false; } }

export function openPalace({ ctx, owl, toned, onDone }) {
  if (document.querySelector('.pl')) return; const say = t => t.replace(/[.!?…]*$/, m => ' 부엉' + (m || '.')); /* 말끝 '부엉' */ let i = 0, shown = {};
  const face = h('span', { class: 'pl-owl', html: owl }), bub = h('p', { class: 'pl-bub' }), next = h('button', { class: 'btn primary', onClick: () => step() }, '다음'), body = h('div', { class: 'pl-body' });
  const el = h('div', { class: 'pl' }, h('div', { class: 'pl-top' }, h('b', null, '🦉 부엉이의 궁전 시안'), h('button', { class: 'top-x', 'aria-label': '닫기', onClick: () => close() }, '✕')), h('div', { class: 'pl-talk' }, face, bub), body);
  const close = () => { el.remove(); onDone && onDone(); };
  function step() { if (i < LINES.length) { bub.textContent = `“${say(LINES[i++])}”`; sfx('pop'); body.replaceChildren(h('div', { class: 'pl-next' }, next)); next.textContent = i < LINES.length ? '다음' : '시안 보기'; return; } cards(); }
  function cards() { bub.textContent = `“${say('그림을 누르면 안쪽 모습도 볼 수 있다네. 마음에 드는 시안을 골라 주시게.')}”`;
    body.replaceChildren(h('div', { class: 'pl-cards' }, PALACES.map(p => { const img = h('img', { src: `img/palace/ext${p.id}.webp`, alt: p.name, loading: 'lazy' }), lab = h('i', null, '외관 · 눌러서 실내 보기');
      const pic = h('button', { class: 'pl-pic', 'aria-label': `${p.name} 외관 · 실내 바꿔 보기`, onClick: () => { shown[p.id] = !shown[p.id]; img.src = `img/palace/${shown[p.id] ? 'in' : 'ext'}${p.id}.webp`; lab.textContent = shown[p.id] ? '실내 · 눌러서 외관 보기' : '외관 · 눌러서 실내 보기'; sfx('pop'); } }, img, lab);
      return h('div', { class: 'pl-card' }, pic, h('div', { class: 'pl-info' }, h('div', null, h('b', null, `${p.id}. ${p.name}`), h('small', null, p.tag)), h('em', null, won(p.price))), h('button', { class: 'btn primary', onClick: () => pick(p) }, '이 시안으로 정하기')); }))); body.scrollTop = 0; }
  function pick(p) { modal({ title: '🏯 시안 정하기', body: h('p', { class: 'center' }, h('b', null, p.name), '(으)로 정할까요?', h('br'), h('small', null, `짓는 값 ${won(p.price)} · 코인은 지을 때 내요`)), actions: [{ label: '더 볼게요' }, { label: '정하기', primary: true, onClick: async c => { if (typeof c === 'function') c();
    if (!PALTEST) { try { await ctx.store.update('palace/' + ctx.uid, { pick: p.id, name: p.name, price: p.price, at: ctx.store.now ? ctx.store.now() : Date.now() }); } catch { return toast('저장하지 못했어요. 잠시 뒤 다시 해 보세요'); } }
    sfx('fanfare'); bub.textContent = `“${say(`${p.name}이라… 훌륭한 안목이시네. 재료 준비해 두겠네, 시중·관리는 그다음에 뽑으세.`)}”`;
    body.replaceChildren(h('div', { class: 'pl-done' }, h('img', { src: `img/palace/ext${p.id}.webp`, alt: '' }), h('b', null, `🏯 ${p.name}`), PALTEST && h('small', null, '🧪 시험 주소라 저장하지 않았어요'), h('button', { class: 'btn primary', onClick: () => close() }, '확인'))); } }] }); }
  document.body.append(el); step();
}
