// 2등신 카피바라 캐릭터 (직접 그린 SVG)
import { wearSvg, hatSvg } from './clothes.js';
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

// opts: {color, acc, face, view:'front'|'back', head:true(머리만), top/bottom/hat: 옷·모자 id, pin: 친목회에서 받은 상징(그림 글자), rare: 초레어 보물 {e: 그림 글자, c: 빛 색}}. 모자를 쓰면 머리 장식(acc) 대신 모자가 보인다
let rareN = 0;
// 가슴에 다는 상징(나머지는 손에 든다)
export const PIN_CHEST = new Set(['👑', '🥇', '🌈', '🌕', '🌙', '⚓', '🧊', '🫧', '🐚', '🌼', '🪷', '🌻']);
const RARE_BACK = new Set([17, 19, 27, 28]); // 등 뒤에 그리는 것(날개·가시 망토·꼬리)
const RARE_BODY = new Set([5, 8, 9, 12, 13, 18, 20, 22, 24, 26]); // 몸에 입는 것(상의·하의·한 벌): 몸 위, 얼굴 아래에 그려서 입은 것처럼 보이게 한다
const RARE_FIT = { 0: [5, 0, 1], 4: [3, 0, 1], 14: [7, 0, 1], 25: [5, 0, 1], 5: [0, 30, 0.72], 7: [0, 0, 0.72], 10: [0, -25, 0.9], 11: [0, -17, 1], 13: [0, -7, 0.86], 15: [0, -8, 1], 17: [0, -10, 1], 21: [0, -14, 1], 18: [0, -2, 0.95], 20: [0, 6, 1], 26: [0, 6, 1] };
const RARE_HOLD = new Set([0, 4, 14, 25]); // 손에 쥐는 것: 자루 위에 손을 한 번 더 그려서 쥔 것처럼 보이게 한다
export function capy(o = {}) {
  const c = COLORS[o.color] || COLORS.brown;
  const back = o.view === 'back';
  const ears = `<ellipse cx="22" cy="21" rx="8" ry="7.5" fill="${c.dark}"/><ellipse cx="98" cy="21" rx="8" ry="7.5" fill="${c.dark}"/>${back ? '' : `<ellipse cx="22.5" cy="22" rx="3.8" ry="3.4" fill="${c.light}"/><ellipse cx="97.5" cy="22" rx="3.8" ry="3.4" fill="${c.light}"/>`}`;
  const head = `${ears}<rect x="9" y="15" width="102" height="69" rx="25" fill="${c.body}"/>${back ? `<path d="M40 30 q20 -7 40 0" fill="none" stroke="${c.dark}" stroke-width="2" opacity=".35" stroke-linecap="round"/>` : face(o.face, c)}${(o.hat && hatSvg(o.hat)) || acc(o.acc)}`;
  // 친목회 상징: 배지 같은 것은 가슴에 달고, 먹을 것·물건은 손에 든다. 얼굴에는 절대 붙이지 않는다(머리만 그릴 때는 안 보인다)
  const pin = !o.pin || back || o.head ? ''
    : PIN_CHEST.has(o.pin) ? `<circle cx="44" cy="93" r="9.5" fill="#fff" stroke="#E9C46A" stroke-width="2.2"/><text x="44" y="97.6" font-size="12.5" text-anchor="middle">${o.pin}</text>`
    : `<text x="98" y="115" font-size="23" text-anchor="middle" transform="rotate(-12 98 108)">${o.pin}</text><ellipse cx="92" cy="109" rx="5.5" ry="4.5" fill="${c.body}"/>`;
  if (o.head) return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 -22 120 112">${head}</svg>`;
  const cl = o.top || o.bottom ? wearSvg(o.top, o.bottom) : { under: '', top: '', over: '' };
  const body = `<ellipse cx="45" cy="128" rx="12" ry="6.5" fill="${c.dark}"/><ellipse cx="75" cy="128" rx="12" ry="6.5" fill="${c.dark}"/>
    <rect x="31" y="76" width="58" height="50" rx="24" fill="${c.body}"/>
    ${back ? `<ellipse cx="60" cy="118" rx="6" ry="5" fill="${c.dark}"/>` : `<ellipse cx="60" cy="105" rx="17" ry="15" fill="${c.light}"/>`}${cl.under}
    <ellipse cx="29" cy="99" rx="8" ry="12" fill="${c.body}" transform="rotate(14 29 99)"/><ellipse cx="91" cy="99" rx="8" ry="12" fill="${c.body}" transform="rotate(-14 91 99)"/>${cl.top}${cl.over}`;
  // 초레어 보물(친목회 단짝 100점): 동물마다 다른 금빛 장비(모자·안경·상의·하의·한 벌·도구·날개…)를 걸친다. 몸 뒤로 은은한 금빛이 퍼지고 별이 반짝인다
  // 그림은 캐릭터 기준 틀(가로 1024 중 캐릭터 547×720)에 맞춰 그려져 있어 같은 자리에 겹치면 된다. RARE_FIT = 조금씩 어긋난 것만 [옆, 아래, 크기] 보정
  let glow = '', gem = '', wearB = '', wearM = '';
  if (o.rare && o.rare.i != null && !back) { const gid = 'rg' + (++rareN), k = o.rare.i, [dx, dy, sc] = RARE_FIT[k] || [0, 0, 1], S = 224.7 * sc, img = `<image href="img/rare/${k}.webp" x="${(60 + dx - S / 2).toFixed(1)}" y="${(57 + dy - S / 2).toFixed(1)}" width="${S.toFixed(1)}" height="${S.toFixed(1)}"/>`;
    glow = `<defs><radialGradient id="${gid}"><stop offset="0" stop-color="#FFFBD6" stop-opacity=".95"/><stop offset=".5" stop-color="#FFE066" stop-opacity=".6"/><stop offset="1" stop-color="#FFC93C" stop-opacity="0"/></radialGradient></defs><circle cx="60" cy="74" r="80" fill="url(#${gid})"><animate attributeName="r" values="72;86;72" dur="2.2s" repeatCount="indefinite"/></circle>`;
    const stars = [[4, 62, 0], [116, 50, .6], [10, 126, 1.1], [112, 120, 1.6], [60, -34, .3], [-10, 22, .9], [130, 92, 1.3], [30, -24, .5]].map(([x, y, d]) => `<path d="M${x} ${y - 10} l3 7 7 3 -7 3 -3 7 -3 -7 -7 -3 7 -3z" fill="#FFFDF0" stroke="#F0C24A" stroke-width="1"><animate attributeName="opacity" values="0.15;1;0.15" dur="1.6s" begin="${d}s" repeatCount="indefinite"/></path>`).join('');
    if (RARE_BACK.has(k)) wearB = img; else if (RARE_BODY.has(k)) wearM = img; else gem = img + (RARE_HOLD.has(k) ? `<ellipse cx="${96 + dx * 0.6}" cy="104" rx="7.5" ry="6.5" fill="${c.body}"/><path d="M${91 + dx * 0.6} 101 q5 -3 10 0" fill="none" stroke="${c.dark}" stroke-width="1.4" stroke-linecap="round" opacity=".6"/>` : ''); gem += stars; }
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 -22 120 158" style="overflow:visible">${glow}${wearB}${body}${wearM}${head}${pin}${gem}</svg>`;
}

export function capyEl(o = {}, cls = '') {
  const d = document.createElement('span');
  d.className = 'capy ' + cls; d.innerHTML = capy(o); return d;
}
export const capyUrl = o => 'data:image/svg+xml;utf8,' + encodeURIComponent(capy(o));
export const yuzuSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 60 60"><circle cx="30" cy="33" r="23" fill="#FFC93C" stroke="#E0A21C" stroke-width="3"/><path d="M30 11 q-13 -12 -23 -3 q11 9 23 3z" fill="#6FB24F" stroke="#4E8E36" stroke-width="2"/><circle cx="22" cy="27" r="2" fill="#E0A21C"/><circle cx="38" cy="39" r="2" fill="#E0A21C"/><circle cx="26" cy="43" r="1.6" fill="#E0A21C"/><ellipse cx="22" cy="22" rx="5" ry="3" fill="#fff" opacity=".45" transform="rotate(-30 22 22)"/></svg>`;
export const yuzuUrl = 'data:image/svg+xml;utf8,' + encodeURIComponent(yuzuSvg);
