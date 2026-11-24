// 2등신 카피바라 캐릭터 (직접 그린 SVG)
import { wearSvg, hatSvg, shoeSvg } from './clothes.js';
import { FLUFFY, capyBody, capyWear, capyRare, SHADOW, inlineSvg, dollBadge, capyPaw } from './fluffy.js';
export const COLORS = {
  brown: { name: '밤색', body: '#BC8C60', dark: '#85593A', light: '#E6C7A1' },
  cream: { name: '크림', body: '#E3C79C', dark: '#AC8656', light: '#F7EBD3' },
  choco: { name: '초코', body: '#94694A', dark: '#5F3F2B', light: '#C9A07C' },
  peach: { name: '복숭아', body: '#E9B3A0', dark: '#B67B68', light: '#FADFD4' },
};
export const ACCS = { yuzu: '유자', flower: '꽃', ribbon: '리본', towel: '수건', leaf: '새싹', none: '없음' };
export const FACES = ['smile', 'happy', 'sleepy', 'wow', 'sad', 'love', 'wink'];

const INK = '#3B2618';

function acc(a) {
  switch (a) {
    case 'yuzu': return `<g><circle cx="60" cy="5" r="12" fill="#FFC93C" stroke="#E0A21C" stroke-width="2"/><path d="M60 -7 q-9 -8 -16 -2 q8 6 16 2z" fill="#6FB24F" stroke="#4E8E36" stroke-width="1.5"/><circle cx="55" cy="2" r="1.2" fill="#E0A21C"/><circle cx="64" cy="8" r="1.2" fill="#E0A21C"/></g>`;
    case 'flower': return `<g transform="translate(90 14)">${[0, 72, 144, 216, 288].map(r => `<ellipse cx="0" cy="-8" rx="5.5" ry="7" fill="#FF9EB5" stroke="#E86F8E" stroke-width="1.2" transform="rotate(${r})"/>`).join('')}<circle r="4.5" fill="#FFD75E"/></g>`;
    case 'ribbon': return `<g transform="translate(60 9)"><path d="M0 0 L-17 -10 Q-21 0 -17 10 Z" fill="#FF7E8E" stroke="#D9566A" stroke-width="1.5"/><path d="M0 0 L17 -10 Q21 0 17 10 Z" fill="#FF7E8E" stroke="#D9566A" stroke-width="1.5"/><circle r="5" fill="#FF5E74" stroke="#D9566A" stroke-width="1.5"/></g>`;
    case 'towel': return `<g><rect x="38" y="2" width="44" height="15" rx="6" fill="#fff" stroke="#BFD9EE" stroke-width="2"/><path d="M46 3v13M54 3v13" stroke="#8EC5F0" stroke-width="2.5"/></g>`;
    case 'leaf': return `<g><path d="M60 14 v-12" stroke="#4E8E36" stroke-width="2.5" stroke-linecap="round"/><path d="M60 3 q-14 -12 -20 0 q10 8 20 0z" fill="#7CC45B" stroke="#4E8E36" stroke-width="1.5"/><path d="M60 3 q12 -13 19 -3 q-9 9 -19 3z" fill="#8FD46B" stroke="#4E8E36" stroke-width="1.5"/></g>`;
    default: return '';
  }
}

function face(f, c) {
  const eye = (x, r = 3.7) => `<circle cx="${x}" cy="41" r="${r}" fill="${INK}"/><circle cx="${x + 1.2}" cy="39.6" r="1.2" fill="#fff"/>`;
  const arcUp = x => `<path d="M${x - 5} 43 q5 -6.5 10 0" fill="none" stroke="${INK}" stroke-width="2.8" stroke-linecap="round"/>`;
  const arcDn = x => `<path d="M${x - 5} 40 q5 4.5 10 0" fill="none" stroke="${INK}" stroke-width="2.8" stroke-linecap="round"/>`;
  const heart = x => `<path d="M${x} 46 l-6 -6 a3.4 3.4 0 0 1 6 -3 a3.4 3.4 0 0 1 6 3z" fill="#FF5E74"/>`;
  const L = 24, R = 96;
  const open = `<path d="M52 70 q8 10 16 0z" fill="#B5544A" stroke="${c.dark}" stroke-width="2" stroke-linejoin="round"/>`;
  let eyes, mouth = `<path d="M53 70 q3.5 4 7 0 q3.5 4 7 0" fill="none" stroke="${c.dark}" stroke-width="2.2" stroke-linecap="round"/>`, extra = '';
  switch (f) {
    case 'happy': eyes = arcUp(L) + arcUp(R); mouth = open; break;
    case 'sleepy': eyes = arcDn(L) + arcDn(R); extra = `<text x="102" y="20" font-size="15" font-weight="700" fill="#8FB8DE" font-family="sans-serif">z</text><text x="111" y="9" font-size="10" font-weight="700" fill="#8FB8DE" font-family="sans-serif">z</text>`; break;
    case 'wow': eyes = eye(L, 4.8) + eye(R, 4.8); mouth = `<ellipse cx="60" cy="73" rx="4.2" ry="5" fill="#B5544A" stroke="${c.dark}" stroke-width="2"/>`; break;
    case 'sad': eyes = eye(L) + eye(R) + `<path d="M18 32 l11 3M102 32 l-11 3" stroke="${INK}" stroke-width="2.4" stroke-linecap="round"/>`; mouth = `<path d="M53 74 q7 -5 14 0" fill="none" stroke="${c.dark}" stroke-width="2.2" stroke-linecap="round"/>`; extra = `<path d="M98 47 q-4 7 0 9 q4 -2 0 -9z" fill="#8EC5F0"/>`; break;
    case 'love': eyes = heart(L) + heart(R); mouth = open; break;
    case 'wink': eyes = eye(L) + arcUp(R); break;
    default: eyes = eye(L) + eye(R);
  }
  return `<rect x="31" y="42" width="58" height="42" rx="17" fill="${c.light}"/>
    <rect x="45" y="47" width="30" height="13" rx="6.5" fill="${INK}"/><ellipse cx="52" cy="52" rx="2.2" ry="1.6" fill="#7A5A48"/><ellipse cx="68" cy="52" rx="2.2" ry="1.6" fill="#7A5A48"/>
    <path d="M60 60 v9" stroke="${c.dark}" stroke-width="2.2" stroke-linecap="round"/>
    ${mouth}${eyes}
    <ellipse cx="18.5" cy="54" rx="6" ry="4" fill="#FF8F8F" opacity=".55"/><ellipse cx="101.5" cy="54" rx="6" ry="4" fill="#FF8F8F" opacity=".55"/>${extra}`;
}

const HD_SLOT = { chest: [75, 14, 134], head: [60, 50, 6], neck: [60, 44, 92], back: [60, 112, 124], waist: [88, 36, 122], lhand: [14, 42, 106], rhand: [106, 42, 106] }; // [가운데 x, 크기, 아래 끝 y]
// opts: {color, acc, face, view:'front'|'back', head:true(머리만), top/bottom/hat: 옷·모자 id, pin: 친목회에서 받은 상징(그림 글자), rare: 초레어 보물 {e: 그림 글자, c: 빛 색}}. 모자를 쓰면 머리 장식(acc) 대신 모자가 보인다
let rareN = 0;
// 가슴에 다는 상징(나머지는 손에 든다)
export const PIN_CHEST = new Set(['👑', '🥇', '🌈', '🌕', '🌙', '⚓', '🧊', '🫧', '🐚', '🌼', '🪷', '🌻']);
const RARE_BACK = new Set([17, 19, 27, 28]); // 등 뒤에 그리는 것(날개·가시 망토·꼬리)
const RARE_SHOE = new Set([12, 13]); // 발에 신는 것(구두): 발 위에 따로 그린다
const RARE_BODY = new Set([5, 8, 9, 18, 20, 22, 24, 26]); // 몸에 입는 것(상의·하의·한 벌): 몸 위, 얼굴 아래에 그려서 입은 것처럼 보이게 한다
const RARE_FIT = { 0: [5, 0, 1], 4: [3, 0, 1], 14: [7, 0, 1], 25: [5, 0, 1], 5: [0, 30, 0.72], 7: [0, 0, 0.72], 10: [0, -25, 0.9], 11: [0, -17, 1], 15: [0, -8, 1], 17: [0, -10, 1], 21: [0, -14, 1], 18: [0, -2, 0.95], 20: [0, 6, 1], 26: [0, 6, 1] };
const RARE_HOLD = new Set([0, 4, 14, 25]); // 손에 쥐는 것: 자루 위에 손을 한 번 더 그려서 쥔 것처럼 보이게 한다(오른손). 무기를 들면 방패(2)는 왼손 쪽으로 뒤집어 그린다
export function capy(o = {}) {
  const c = COLORS[o.color] || COLORS.brown;
  const back = o.view === 'back';
  const ears = `<ellipse cx="22" cy="21" rx="8" ry="7.5" fill="${c.dark}"/><ellipse cx="98" cy="21" rx="8" ry="7.5" fill="${c.dark}"/>${back ? '' : `<ellipse cx="22.5" cy="22" rx="3.8" ry="3.4" fill="${c.light}"/><ellipse cx="97.5" cy="22" rx="3.8" ry="3.4" fill="${c.light}"/>`}`;
  const head = `${ears}<rect x="9" y="15" width="102" height="69" rx="25" fill="${c.body}"/>${back ? `<path d="M40 30 q20 -7 40 0" fill="none" stroke="${c.dark}" stroke-width="2" opacity=".35" stroke-linecap="round"/>` : face(o.face, c)}${(o.hat && hatSvg(o.hat)) || acc(o.acc)}`;
  // 친목회 상징: 배지 같은 것은 가슴에 달고, 먹을 것·물건은 손에 든다. 얼굴에는 절대 붙이지 않는다(머리만 그릴 때는 안 보인다)
  // 가슴 배지 자리: 상징 배지 → 인형 배지 → 외교관 배지 순서로 나란히. 두 개면 양쪽 가슴, 세 개면 세 칸
  const chestL = back || o.head ? [] : [o.pin && PIN_CHEST.has(o.pin) ? 'pin' : null, o.doll != null ? 'doll' : null, o.dip ? 'dip' : null].filter(Boolean), chestX = k => (chestL.length === 3 ? [39, 60, 81] : [44, 76])[chestL.indexOf(k)];
  const pin = !o.pin || back || o.head ? ''
    : PIN_CHEST.has(o.pin) ? `<circle cx="${chestX('pin')}" cy="93" r="9.5" fill="#fff" stroke="#E9C46A" stroke-width="2.2"/><text x="${chestX('pin')}" y="97.6" font-size="12.5" text-anchor="middle">${o.pin}</text>`
    : FLUFFY ? `<text x="91" y="112" font-size="17" text-anchor="middle" transform="rotate(-12 91 106)">${o.pin}</text>${capyPaw(o, 86.5, 108.5, true, 0.46)}` // 보송 그림체: 몸이 작아서 물건을 몸 가까이 들고, 손은 털 그림으로
    : `<text x="98" y="115" font-size="23" text-anchor="middle" transform="rotate(-12 98 108)">${o.pin}</text><ellipse cx="92" cy="109" rx="5.5" ry="4.5" fill="${c.body}"/>`;
  // 외교관 배지(여권 퀘스트 보상): 가슴 한가운데
  const dipB = !o.dip || back || o.head ? '' : `<image href="img/quest/badge.webp" x="${chestX('dip') - 10.5}" y="84" width="21" height="23"/>`;
  // 인형 배지(인형뽑기에서 뽑은 인형): 가슴에 단다. 상징 배지가 왼쪽 가슴에 있으면 오른쪽에
  const dollB = o.doll == null || back || o.head ? '' : FLUFFY ? dollBadge(o.doll, chestX('doll'), 96, o.own) : `<circle cx="44" cy="93" r="9.5" fill="#fff" stroke="#FF7AD9" stroke-width="2.2"/><text x="44" y="97.6" font-size="12.5" text-anchor="middle">🧸</text>`;
  const fl = FLUFFY ? capyBody(o.color, o.face, back, o.own) : null, hdOn = fl && o.rare && o.rare.i != null && !back, isHd = id => hdOn && typeof id === 'string' && id.includes('-hd-'), noHd = id => (isHd(id) ? '' : id), flW = fl ? capyWear({ ...o, top: noHd(o.top), bottom: noHd(o.bottom), hat: noHd(o.hat), shoe: noHd(o.shoe) }, o.own, back) : { shoe: '', body: '', hat: '' }, flH = hdOn ? capyWear({ top: isHd(o.top) ? o.top : '', bottom: isHd(o.bottom) ? o.bottom : '', hat: isHd(o.hat) ? o.hat : '', shoe: isHd(o.shoe) ? o.shoe : '' }, o.own, back) : { shoe: '', body: '', hat: '' }, /* 한복은 황금 장비 위에 걸쳐 입는다 */ flTop = fl ? (flW.hat || (o.hat ? '' : acc(o.acc))) + (o.face === 'sleepy' && !back ? '<text x="102" y="20" font-size="15" font-weight="700" fill="#8FB8DE" font-family="sans-serif">z</text><text x="111" y="9" font-size="10" font-weight="700" fill="#8FB8DE" font-family="sans-serif">z</text>' : '') : ''; // 보송 그림체(시험판): 몸·얼굴은 그림 한 장, 옷·모자는 그 위에 겹친다
  if (o.head && fl) return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 -22 120 112">${fl.whole}${o.bare ? '' : flTop}</svg>`;
  if (o.head) return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 -22 120 112">${head}</svg>`;
  const cl = o.top || o.bottom ? wearSvg(o.top, o.bottom) : { under: '', top: '', over: '' };
  // 신발: 왼발 한 짝을 그리고 오른발엔 좌우로 뒤집어 신긴다. 발과 같은 무리(cf-l·cf-r)라 걸을 때 발과 함께 움직인다.
  // 신발 전체는 옷 아래에 그리고, 앞코(아래쪽)만 옷 위에 한 번 더 그려서 옷 밑으로 살짝 나오게 한다. 황금 구두가 있으면 일반 신발 대신 황금 구두를 신는다
  const shoeK = o.rare && o.rare.i != null && !back ? (o.rare.list || [o.rare.i]).slice(0, 6).find(k => RARE_SHOE.has(k)) : undefined;
  const oneShoe = shoeK != null ? `<image href="img/rare/${shoeK}f.webp" x="32" y="117" width="26" height="22" preserveAspectRatio="none"/>` : shoeSvg(o.shoe);
  const pair = oneShoe ? `<g class="cf-l">${oneShoe}</g><g class="cf-r"><g transform="matrix(-1 0 0 1 120 0)">${oneShoe}</g></g>` : '';
  const toeId = pair ? 'st' + (++rareN) : '', shoe = pair, shoeToe = pair ? `<defs><clipPath id="${toeId}" clipPathUnits="userSpaceOnUse"><rect x="-20" y="130.5" width="200" height="20"/></clipPath></defs><g clip-path="url(#${toeId})">${pair}</g>` : '';
  const body = `<g class="cf-l"><ellipse cx="45" cy="128" rx="12" ry="6.5" fill="${c.dark}"/></g><g class="cf-r"><ellipse cx="75" cy="128" rx="12" ry="6.5" fill="${c.dark}"/></g>
    <rect x="31" y="76" width="58" height="50" rx="24" fill="${c.body}"/>
    ${back ? `<ellipse cx="60" cy="118" rx="6" ry="5" fill="${c.dark}"/>` : `<ellipse cx="60" cy="105" rx="17" ry="15" fill="${c.light}"/>`}${shoe}${cl.under}
    <ellipse cx="29" cy="99" rx="8" ry="12" fill="${c.body}" transform="rotate(14 29 99)"/><ellipse cx="91" cy="99" rx="8" ry="12" fill="${c.body}" transform="rotate(-14 91 99)"/>${cl.top}${cl.over}`;
  // 초레어 보물(친목회 단짝 100점): 동물마다 다른 금빛 장비(모자·안경·상의·하의·한 벌·도구·날개…)를 걸친다. 몸 뒤로 은은한 금빛이 퍼지고 별이 반짝인다
  // 그림은 캐릭터 기준 틀(가로 1024 중 캐릭터 547×720)에 맞춰 그려져 있어 같은 자리에 겹치면 된다. RARE_FIT = 조금씩 어긋난 것만 [옆, 아래, 크기] 보정
  let glow = '', gem = '', wearB = '', wearM = '';
  if (o.rare && o.rare.i != null && !back) { const gid = 'rg' + (++rareN), list = (o.rare.list || [o.rare.i]).slice(0, 6), n = list.length; // 여섯 개까지 함께 걸친다. 많이 걸칠수록 빛이 커진다
    glow = `<defs><radialGradient id="${gid}"><stop offset="0" stop-color="#FFFBD6" stop-opacity=".95"/><stop offset=".5" stop-color="#FFE066" stop-opacity="${Math.min(0.95, 0.5 + n * 0.08)}"/><stop offset="1" stop-color="#FFC93C" stop-opacity="0"/></radialGradient></defs><circle cx="60" cy="74" r="${72 + n * 4}" fill="url(#${gid})"><animate attributeName="r" values="${64 + n * 4};${78 + n * 4};${64 + n * 4}" dur="2.2s" repeatCount="indefinite"/></circle>`;
    if (!fl) list.forEach(k => { const [dx, dy, sc] = RARE_FIT[k] || [0, 0, 1], S = 224.7 * sc, img = `<image href="img/rare/${k}.webp" x="${(60 + dx - S / 2).toFixed(1)}" y="${(57 + dy - S / 2).toFixed(1)}" width="${S.toFixed(1)}" height="${S.toFixed(1)}"/>`;
      if (RARE_SHOE.has(k)) return; if (RARE_BACK.has(k)) wearB += img; else if (RARE_BODY.has(k)) wearM += img; else if (k === 2 && list.some(x => RARE_HOLD.has(x))) gem += `<g transform="matrix(-1 0 0 1 120 0)">${img}</g>`; else gem += img + (RARE_HOLD.has(k) ? `<ellipse cx="${96 + dx * 0.6}" cy="104" rx="7.5" ry="6.5" fill="${c.body}"/><path d="M${91 + dx * 0.6} 101 q5 -3 10 0" fill="none" stroke="${c.dark}" stroke-width="1.4" stroke-linecap="round" opacity=".6"/>` : ''); });
    gem += [[4, 62, 0], [116, 50, .6], [10, 126, 1.1], [112, 120, 1.6], [60, -34, .3], [-10, 22, .9], [130, 92, 1.3], [30, -24, .5]].map(([x, y, d]) => `<path d="M${x} ${y - 10} l3 7 7 3 -7 3 -3 7 -3 -7 -7 -3 7 -3z" fill="#FFFDF0" stroke="#F0C24A" stroke-width="1"><animate attributeName="opacity" values="0.15;1;0.15" dur="1.6s" begin="${d}s" repeatCount="indefinite"/></path>`).join(''); }
  const flR = fl && o.rare && o.rare.i != null && !back ? capyRare((o.rare.list || [o.rare.i]).slice(0, 6), o.own, o) : { over: '', shoe: '', back: '' };
  const hdS = sl => { const i = o.hdw && o.hdw[sl]; if (i == null || o.head) return ''; const [cx, w, yb] = HD_SLOT[sl], hh = sl === 'chest' ? w * 3.8 : w; return `<image href="img/hd/y${i}.webp" x="${cx - w / 2}" y="${yb - hh}" width="${w}" height="${hh}" preserveAspectRatio="xMidYMax meet"/>`; } /* chest: 송이의 노리개처럼 가슴에 다는 것(세로로 긴 그림) */, hdB = (back ? '' : hdS('back')) + (o.hdw && o.hdw.chest === 'nori' && !o.head ? '<defs><radialGradient id="noriG"><stop offset="0" stop-color="#C9A2FF" stop-opacity=".95"/><stop offset=".55" stop-color="#A070F0" stop-opacity=".5"/><stop offset="1" stop-color="#A070F0" stop-opacity="0"/></radialGradient></defs><ellipse cx="60" cy="74" rx="60" ry="64" fill="url(#noriG)"><animate attributeName="opacity" values=".45;1;.45" dur="2.6s" repeatCount="indefinite"/></ellipse>' : ''), /* 송이의 노리개를 차면 은은한 보랏빛 */ hdF = (back ? ['back'] : ['neck', 'chest', 'waist', 'lhand', 'rhand']).map(hdS).join('') + hdS('head'); // 핫똑랜드 상징품(자리마다 하나)
  if (fl) return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 -22 120 158"${glow ? ' style="overflow:visible"' : ''}>${glow}${hdB}${o.noShadow ? '' : SHADOW}${flR.back}${fl.feet}${fl.body}${flR.shoe || flW.shoe}${flW.body}${flTop}${flR.over}${flH.shoe}${flH.body}${flH.hat}${pin}${dollB}${dipB}${gem}${hdF}</svg>`;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 -22 120 158"${glow ? ' style="overflow:visible"' : ''}>${glow}${wearB}${body}${wearM}${shoeToe}${head}${pin}${dollB}${dipB}${gem}${hdF}</svg>`;
}

export function capyEl(o = {}, cls = '') {
  const d = document.createElement('span');
  d.className = 'capy ' + cls; d.innerHTML = capy(o); return d;
}
export const capyUrl = o => 'data:image/svg+xml;utf8,' + encodeURIComponent(capy(FLUFFY ? { ...o, own: true } : o));
// 캔버스에 그릴 캐릭터 그림 주소: 몸·옷 그림 파일을 모두 안에 넣은 뒤에 돌려준다(바로 만들면 그림이 비어 캐릭터가 안 보인다)
export const svgUrl = async svg => 'data:image/svg+xml;utf8,' + encodeURIComponent(await inlineSvg(svg));
export const capyUrlReady = o => svgUrl(capy(o));
export const yuzuSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 60 60"><circle cx="30" cy="33" r="23" fill="#FFC93C" stroke="#E0A21C" stroke-width="3"/><path d="M30 11 q-13 -12 -23 -3 q11 9 23 3z" fill="#6FB24F" stroke="#4E8E36" stroke-width="2"/><circle cx="22" cy="27" r="2" fill="#E0A21C"/><circle cx="38" cy="39" r="2" fill="#E0A21C"/><circle cx="26" cy="43" r="1.6" fill="#E0A21C"/><ellipse cx="22" cy="22" rx="5" ry="3" fill="#fff" opacity=".45" transform="rotate(-30 22 22)"/></svg>`;
export const yuzuUrl = 'data:image/svg+xml;utf8,' + encodeURIComponent(yuzuSvg);
