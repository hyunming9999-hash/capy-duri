// 보송 그림체(새 스킨): 카피·동물을 그림 파일로 바꿔 그린다. 시험판: 주소에 ?fluffy=1 이면 켜지고(기억됨), ?fluffy=0 이면 꺼진다
const Q = new URLSearchParams(location.search).get('fluffy');
try { if (Q === '1') localStorage.setItem('capy-fluffy', '1'); if (Q === '0') localStorage.removeItem('capy-fluffy'); } catch (e) { /* 저장 못 하면 이번만 */ }
let on = Q === '1'; try { on = on || (Q !== '0' && localStorage.getItem('capy-fluffy') === '1'); } catch (e) { /* 무시 */ }
export const FLUFFY = on;
if (on && typeof document !== 'undefined') document.documentElement.classList.add('fluffy'); // 배경 그림은 CSS에서 이 표시를 보고 바꾼다
const DIR = 'img/fl/';
// 그림 틀(320×360, 발끝이 아래에서 6px)을 예전 캐릭터 자리(viewBox 0 -22 120 158, 발끝 y≈135)에 맞춘다
const S = 122 / 267, W = 320 * S, H = 360 * S, X = 60 - W / 2, Y = 135 - 354 * S;
const FOOT = Y + 333 * S; // 이 선 아래가 발: 걸을 때 따로 움직인다
// 캔버스·img 로 따로 띄우는 그림(data: 주소)은 바깥 파일을 못 읽어서, 미리 받아 둔 내용을 그림 안에 넣는다
const inl = new Map();
function inline(name) {
  if (inl.has(name)) return inl.get(name);
  inl.set(name, null);
  fetch(DIR + name).then(r => r.blob()).then(b => new Promise(ok => { const fr = new FileReader(); fr.onload = () => ok(fr.result); fr.readAsDataURL(b); })).then(u => inl.set(name, u)).catch(() => inl.delete(name));
  return null;
}
const src = (name, own) => (own && inline(name)) || DIR + name;
const img = (name, own) => `<image href="${src(name, own)}" x="${X.toFixed(2)}" y="${Y.toFixed(2)}" width="${W.toFixed(2)}" height="${H.toFixed(2)}"/>`;
const CAPY_FACE = new Set(['smile', 'happy', 'sleepy', 'wow', 'sad', 'love', 'wink', 'cry', 'angry', 'shy']);
const CAPY_COL = new Set(['brown', 'cream', 'choco', 'peach']);
export const capyFile = (color, face, back) => `c-${CAPY_COL.has(color) ? color : 'brown'}-${back ? 'back' : CAPY_FACE.has(face) ? face : 'smile'}.webp`;
// 몸통(발 위)과 두 발을 따로 잘라 그린다. 발은 예전처럼 cf-l·cf-r 무리라 걸을 때 번갈아 움직인다
let clipN = 0; // 안쪽에 <svg>를 또 넣으면 화면 쪽 CSS(.so-me svg 등)가 같이 걸려 어긋난다 → 잘라내기는 clipPath로 한다
const crop = (name, own, x, y, w, h) => { const id = 'flc' + (++clipN); return `<defs><clipPath id="${id}" clipPathUnits="userSpaceOnUse"><rect x="${x}" y="${y.toFixed(2)}" width="${w}" height="${h.toFixed(2)}"/></clipPath></defs><g clip-path="url(#${id})">${img(name, own)}</g>`; };
export function capyBody(color, face, back, own) {
  const f = capyFile(color, face, back);
  return { feet: `<g class="cf-l">${crop(f, own, -20, FOOT, 80, 40)}</g><g class="cf-r">${crop(f, own, 60, FOOT, 80, 40)}</g>`, body: crop(f, own, -20, -30, 160, FOOT + 30 + 0.4), whole: img(f, own) };
}
// 옷: 몸에 입힌 채로 그린 그림(같은 틀)을 그대로 겹친다. 신발은 발처럼 좌우로 잘라 걸을 때 함께 움직인다
const HAT_UP = -10; // 모자는 마네킹보다 머리가 낮게 그려져 있어 조금 올려 씌운다(눈을 가리지 않게)
const wimg = (id, own, back) => img((back ? 'wb/' : 'w/') + id + '.webp', own);
export function capyWear(o, own, back) {
  const ok = (id, ch) => (typeof id === 'string' && id[0] === ch ? id : '');
  const top = ok(o.top, 't'), bot = ok(o.bottom, 'b'), hat = ok(o.hat, 'h'), sh = ok(o.shoe, 's'), over = bot.startsWith('b-overalls');
  const f = sh ? (back ? 'wb/' : 'w/') + sh + '.webp' : '';
  return { shoe: f ? `<g class="cf-l">${crop(f, own, -20, FOOT - 14, 80, 54)}</g><g class="cf-r">${crop(f, own, 60, FOOT - 14, 80, 54)}</g>` : '',
    body: (bot && !over ? wimg(bot, own, back) : '') + (top ? wimg(top, own, back) : '') + (over ? wimg(bot, own, back) : ''), hat: hat ? `<g transform="translate(0 ${HAT_UP})">${wimg(hat, own, back)}</g>` : '' };
}
const MOOD = new Set(['happy', 'love', 'sad', 'cry', 'wow', 'smug', 'think', 'shy', 'angry']);
export const animalImg = (i, mood, own) => img(`a${i}-${mood === 'mad' ? 'angry' : MOOD.has(mood) ? mood : 'base'}.webp`, own);
export const animalSitImg = i => img(`a${i}-sit.webp`);
// 처음 화면에서 자주 쓰는 그림은 미리 받아 둔다(작은 게임 캔버스용)
export function warm(color) { if (on) ['happy', 'sad', 'smile'].forEach(f => inline(capyFile(color, f))); }
// 옷가게·옷장 목록의 작은 그림: 옷만 크게 보여 준다(종류마다 보이는 자리가 다르다)
const ICON_BOX = { h: '-12 -24 144 96', t: '8 70 104 62', b: '8 76 104 62', s: '20 106 80 32' };
export const clothIcon = id => (on && typeof id === 'string' && ICON_BOX[id[0]] ? `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${ICON_BOX[id[0]]}">${id[0] === 'h' ? `<g transform="translate(0 ${HAT_UP})">${wimg(id)}</g>` : wimg(id)}</svg>` : '');
export const gullImg = boss => img(boss ? 'gull-boss.webp' : 'gull-crew.webp');
// 황금 장비: 몸에 걸친 채로 그린 그림이라 그대로 겹치면 된다(몸 뒤로 가는 부분은 그림에서 이미 가려져 있다)
// 날개·꼬리처럼 옆으로 넓은 것이 잘리지 않게 황금 장비 그림은 틀이 더 넓다(480×360, 가운데가 몸)
const wide = (name, own) => `<image href="${src(name, own)}" x="${(60 - 240 * S).toFixed(2)}" y="${Y.toFixed(2)}" width="${(480 * S).toFixed(2)}" height="${H.toFixed(2)}"/>`;
const R_HEAD = new Set([1, 6, 10, 11, 15, 21, 23]), R_SHOE = new Set([12, 13]);
export function capyRare(list, own) {
  let over = '', shoe = '';
  list.forEach(k => { const f = 'r/' + k + '.webp';
    if (R_SHOE.has(k)) shoe = `<g class="cf-l">${crop(f, own, -20, FOOT - 14, 80, 54)}</g><g class="cf-r">${crop(f, own, 60, FOOT - 14, 80, 54)}</g>`;
    else over += R_HEAD.has(k) ? `<g transform="translate(0 ${HAT_UP})">${wide(f, own)}</g>` : wide(f, own); });
  return { over, shoe };
}
export const rareIcon = i => (on ? `img/fl/r/ic/${i}.webp` : `img/rare/ic/${i}.webp`);
export const rarePic = i => (on ? `img/fl/r/ic/${i}.webp` : `img/rare/${i}.webp`);
// 배·대포·해적선: 예전 그림과 같은 틀(배 170×120, 해적선 170×130)에 그림을 맞춰 넣는다. 포신은 gun-b 무리라 예전처럼 돌아간다
const O = 'img/fl/o/', WAVE = y => `<path d="M-2 ${y} q14 -9 28 0 t28 0 t28 0 t28 0 t28 0 t28 0 t28 0" fill="none" stroke="#fff" stroke-width="4" stroke-linecap="round" opacity=".8"/>`;
export function boatImg(kind, pin) { // kind: 'wood' | 'white' | 'gun' | 'gun2'
  const hull = `<image href="${O}${kind === 'wood' ? 'boat' : 'wboat'}.webp" x="15" y="-1" width="140" height="111"/>`;
  const gun = kind === 'gun2' ? `<g class="gun-b" style="transform-origin:128px 50px"><image href="${O}gun2.webp" x="112" y="33" width="58" height="31"/></g><image href="${O}wheel2.webp" x="113" y="48" width="26" height="26"/>`
    : kind === 'gun' ? `<g class="gun-b" style="transform-origin:128px 50px"><image href="${O}gun.webp" x="114" y="36" width="56" height="24"/></g><image href="${O}wheel.webp" x="117" y="48" width="26" height="26"/>` : '';
  return `<svg viewBox="0 0 170 120">${hull}<text x="97" y="39" font-size="13" text-anchor="middle">${pin || ''}</text>${gun}${WAVE(110)}</svg>`;
}
export const shipImg = () => `<svg viewBox="0 0 170 130"><image href="${O}ship.webp" x="24" y="0" width="123" height="118"/><g class="gun-b" style="transform-origin:42px 56px"><image href="${O}gun.webp" x="-54" y="44" width="52" height="22" transform="scale(-1 1)"/></g><image href="${O}wheel.webp" x="28" y="55" width="24" height="24"/>${WAVE(118)}</svg>`;
// 발밑 그림자(물에 들어가거나 배를 타면 CSS로 숨긴다)
export const SHADOW = '<ellipse class="fl-sh" cx="60" cy="133.5" rx="31" ry="5.5" fill="rgba(60,32,10,.4)"/>';

// 상점 선물·포션 그림(예전에는 이모지)
const ITEM = { '🍬': 'candy', '💐': 'flower', '🎂': 'cake', '🧪': 'potion' };
export const itemIcon = e => (on && ITEM[e] ? `<img class="fl-item" src="img/fl/o/${ITEM[e]}.webp" alt="${e}">` : '');
