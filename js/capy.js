// 2등신 카피바라 캐릭터 (직접 그린 SVG)
import { wearSvg } from './clothes.js';
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

// opts: {color, acc, face, view:'front'|'back', head:true(머리만), top/bottom: 옷 id}
export function capy(o = {}) {
  const c = COLORS[o.color] || COLORS.brown;
  const back = o.view === 'back';
  const ears = `<ellipse cx="22" cy="21" rx="8" ry="7.5" fill="${c.dark}"/><ellipse cx="98" cy="21" rx="8" ry="7.5" fill="${c.dark}"/>${back ? '' : `<ellipse cx="22.5" cy="22" rx="3.8" ry="3.4" fill="${c.light}"/><ellipse cx="97.5" cy="22" rx="3.8" ry="3.4" fill="${c.light}"/>`}`;
  const head = `${ears}<rect x="9" y="15" width="102" height="69" rx="25" fill="${c.body}"/>${back ? `<path d="M40 30 q20 -7 40 0" fill="none" stroke="${c.dark}" stroke-width="2" opacity=".35" stroke-linecap="round"/>` : face(o.face, c)}${acc(o.acc)}`;
  if (o.head) return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 -22 120 112">${head}</svg>`;
  const cl = o.top || o.bottom ? wearSvg(o.top, o.bottom) : { under: '', top: '', over: '' };
  const body = `<ellipse cx="45" cy="128" rx="12" ry="6.5" fill="${c.dark}"/><ellipse cx="75" cy="128" rx="12" ry="6.5" fill="${c.dark}"/>
    <rect x="31" y="76" width="58" height="50" rx="24" fill="${c.body}"/>
    ${back ? `<ellipse cx="60" cy="118" rx="6" ry="5" fill="${c.dark}"/>` : `<ellipse cx="60" cy="105" rx="17" ry="15" fill="${c.light}"/>`}${cl.under}
    <ellipse cx="29" cy="99" rx="8" ry="12" fill="${c.body}" transform="rotate(14 29 99)"/><ellipse cx="91" cy="99" rx="8" ry="12" fill="${c.body}" transform="rotate(-14 91 99)"/>${cl.top}${cl.over}`;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 -22 120 158">${body}${head}</svg>`;
}

export function capyEl(o = {}, cls = '') {
  const d = document.createElement('span');
  d.className = 'capy ' + cls; d.innerHTML = capy(o); return d;
}
export const capyUrl = o => 'data:image/svg+xml;utf8,' + encodeURIComponent(capy(o));
export const yuzuSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 60 60"><circle cx="30" cy="33" r="23" fill="#FFC93C" stroke="#E0A21C" stroke-width="3"/><path d="M30 11 q-13 -12 -23 -3 q11 9 23 3z" fill="#6FB24F" stroke="#4E8E36" stroke-width="2"/><circle cx="22" cy="27" r="2" fill="#E0A21C"/><circle cx="38" cy="39" r="2" fill="#E0A21C"/><circle cx="26" cy="43" r="1.6" fill="#E0A21C"/><ellipse cx="22" cy="22" rx="5" ry="3" fill="#fff" opacity=".45" transform="rotate(-30 22 22)"/></svg>`;
export const yuzuUrl = 'data:image/svg+xml;utf8,' + encodeURIComponent(yuzuSvg);
