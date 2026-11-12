// 오늘 무슨 게임하지? — 카피바라 게임 5종
import { h } from './ui.js';
import { capyEl } from './capy.js';
import { omok, four, match } from './g-board.js';
import * as volley from './g-volley.js';
import * as yuzu from './g-yuzu.js';

const HOTTEOK = 'https://hyunming9999-hash.github.io/hotteok-tekken/';

export const GAMES = [
  { id: 'omok', mod: omok, title: '카피바라 오목', sub: '다섯 알을 먼저 이으면 승리', face: 'smile', acc: 'leaf' },
  { id: 'volley', mod: volley, title: '카피바라 배구', sub: '유자 공으로 한 판 · 실시간', face: 'happy', acc: 'towel' },
  { id: 'match', mod: match, title: '짝 맞추기', sub: '같은 카피바라 찾기', face: 'wink', acc: 'flower' },
  { id: 'four', mod: four, title: '유자 사목', sub: '네 알을 먼저 이으면 승리', face: 'wow', acc: 'yuzu' },
  { id: 'yuzu', mod: yuzu, title: '유자 받기', sub: '30초 점수 대결', face: 'love', acc: 'ribbon' },
];

export function mount(el, ctx, sub) {
  const g = GAMES.find(x => x.id === sub);
  if (g) { ctx.setTitle(g.title); el.classList.add('game-' + g.id); return g.mod.mount(el, ctx); }
  el.append(h('div', { class: 'game-list' }, GAMES.map((x, i) => h('button', { class: 'game-card', style: { animationDelay: i * 50 + 'ms' }, onClick: () => ctx.go('game-' + x.id) },
    capyEl({ color: ['brown', 'cream', 'choco', 'peach', 'brown'][i], acc: x.acc, face: x.face, head: true }), h('div', null, h('b', null, x.title), h('small', null, x.sub)), h('span', { class: 'go' }, '›'))),
    h('a', { class: 'game-card ext', href: HOTTEOK, target: '_blank', rel: 'noopener', style: { animationDelay: '250ms' } }, h('span', { class: 'ext-ic' }, '🥊'), h('div', null, h('b', null, '호떡 철권'), h('small', null, '따로 만든 게임 · 새 창에서 열려요')), h('span', { class: 'go' }, '↗'))));
}
