// 동물 손님 30종 — 카피바라 캐릭터와 같은 틀(둥근 네모 얼굴, 멀리 떨어진 점 눈, 볼터치)로 직접 그린 SVG
const INK = '#3B2618';
const mir = s => s + `<g transform="matrix(-1 0 0 1 120 0)">${s}</g>`; // 왼쪽 것을 오른쪽에도
const shade = (hex, t) => '#' + [1, 3, 5].map(i => Math.round(parseInt(hex.slice(i, i + 2), 16) * (1 - Math.abs(t)) + (t < 0 ? 0 : 255) * Math.abs(t)).toString(16).padStart(2, '0')).join('');
const head = c => `<rect x="9" y="15" width="102" height="69" rx="25" fill="${c}"/>`;
const eyes = (col = INK) => mir(`<circle cx="24" cy="41" r="3.7" fill="${col}"/><circle cx="25.2" cy="39.6" r="1.2" fill="#fff"/>`);
const blush = mir('<ellipse cx="18.5" cy="54" rx="6" ry="4" fill="#FF8F8F" opacity=".55"/>');
const smile = d => `<path d="M53 70 q3.5 4 7 0 q3.5 4 7 0" fill="none" stroke="${d}" stroke-width="2.2" stroke-linecap="round"/>`;
// 귀
const EAR = {
  round: (c, i, s = 1) => mir(`<ellipse cx="22" cy="19" rx="${11 * s}" ry="${10.5 * s}" fill="${c}"/><ellipse cx="22.5" cy="20.5" rx="${5.5 * s}" ry="${5 * s}" fill="${i}"/>`),
  pointy: (c, i) => mir(`<path d="M12 32 L17 -3 L43 17 Z" fill="${c}" stroke="${c}" stroke-width="5" stroke-linejoin="round"/><path d="M19 23 L21 7 L33 17 Z" fill="${i}" stroke="${i}" stroke-width="2" stroke-linejoin="round"/>`),
  long: (c, i) => mir(`<ellipse cx="33" cy="1" rx="10" ry="23" fill="${c}" transform="rotate(-9 33 1)"/><ellipse cx="33" cy="2" rx="4.6" ry="15" fill="${i}" transform="rotate(-9 33 2)"/>`),
  narrow: (c, i) => mir(`<path d="M20 26 L23 -8 L39 15 Z" fill="${c}" stroke="${c}" stroke-width="4" stroke-linejoin="round"/><path d="M25 17 L26 2 L33 13 Z" fill="${i}"/>`),
  fold: (c, i) => mir(`<path d="M12 28 L15 3 L42 13 Z" fill="${c}" stroke="${c}" stroke-width="5" stroke-linejoin="round"/><path d="M18 20 L19 9 L31 14 Z" fill="${i}"/>`),
  side: (c, i) => mir(`<ellipse cx="8" cy="44" rx="9" ry="11.5" fill="${c}"/><ellipse cx="8" cy="44" rx="4.6" ry="6.5" fill="${i}"/>`),
  tuft: c => mir(`<path d="M15 24 L16 2 L37 14 Z" fill="${c}" stroke="${c}" stroke-width="4" stroke-linejoin="round"/>`),
  none: () => '',
};
// 머리 위에 겹쳐 그리는 처진 귀
const floppy = c => mir(`<ellipse cx="11" cy="38" rx="9.5" ry="20" fill="${c}" transform="rotate(8 11 38)"/>`);
// 주둥이
const MUZ = {
  std: (l, d, nose = INK) => `<ellipse cx="60" cy="65" rx="22" ry="16" fill="${l}"/><path d="M54 54 h12 q3 0 1.4 3 l-5.2 5.4 q-2.2 2 -4.4 0 l-5.2 -5.4 q-1.6 -3 1.4 -3z" fill="${nose}"/><path d="M60 63 v6" stroke="${d}" stroke-width="2.2" stroke-linecap="round"/>${smile(d)}`,
  snout: (l, d) => `<ellipse cx="60" cy="62" rx="19" ry="13.5" fill="${l}" stroke="${d}" stroke-width="2"/>${mir(`<ellipse cx="53" cy="62" rx="3" ry="4.4" fill="${d}"/>`)}<path d="M54 79 q6 4 12 0" fill="none" stroke="${d}" stroke-width="2.2" stroke-linecap="round"/>`,
  beak: (l, d) => `<path d="M47 56 q13 -9 26 0 q-13 18 -26 0z" fill="${l}" stroke="${d}" stroke-width="2" stroke-linejoin="round"/><path d="M49 58 q11 4 22 0" fill="none" stroke="${d}" stroke-width="1.6" stroke-linecap="round"/>`,
  bill: (l, d) => `<ellipse cx="60" cy="64" rx="21" ry="10" fill="${l}" stroke="${d}" stroke-width="2"/><path d="M42 64 q18 5 36 0" fill="none" stroke="${d}" stroke-width="1.6" stroke-linecap="round"/>${mir(`<circle cx="55" cy="59" r="1.2" fill="${d}"/>`)}`,
  frog: (l, d) => `<path d="M34 62 q26 24 52 0" fill="none" stroke="${d}" stroke-width="3.6" stroke-linecap="round"/>${mir(`<circle cx="55" cy="55" r="1.4" fill="${d}"/>`)}`,
  cow: (l, d) => `<ellipse cx="60" cy="67" rx="27" ry="15" fill="${l}"/>${mir(`<ellipse cx="50" cy="64" rx="3" ry="4" fill="${d}"/>`)}<path d="M52 75 q8 5 16 0" fill="none" stroke="${d}" stroke-width="2.2" stroke-linecap="round"/>`,
  big: (l, d) => `<ellipse cx="60" cy="59" rx="9.5" ry="13" fill="${INK}"/><ellipse cx="57" cy="53" rx="2.6" ry="3.6" fill="#7A5A48"/><path d="M54 77 q6 4 12 0" fill="none" stroke="${d}" stroke-width="2.2" stroke-linecap="round"/>`,
  tiny: (l, d) => `<ellipse cx="60" cy="64" rx="5" ry="4.2" fill="#B5544A" stroke="${d}" stroke-width="1.8"/>`,
};
const whisk = d => mir(`<path d="M36 62 l-13 -3M36 67 l-13 2" stroke="${d}" stroke-width="1.5" stroke-linecap="round" opacity=".7"/>`);
// [이름, 얼굴색, 밝은색, 귀, 귀 안쪽색, 주둥이, 덧그림(머리 뒤), 덧그림(머리 위)]
const A = (name, body, light, ear, inner, muz, o = {}) => ({ name, body, light, ear, inner, muz, ...o });
export const ANIMALS = [
  A('강아지', '#E8C48E', '#FFF3DC', 'none', '', 'std', { over: c => floppy(shade(c, -0.3)) + '<ellipse cx="88" cy="38" rx="15" ry="14" fill="#C99558" opacity=".55"/>' }),
  A('고양이', '#F6B66A', '#FFF1DA', 'pointy', '#FFC7C2', 'std', { nose: '#F08A8A', over: () => whisk('#9A6A3A') + '<path d="M52 17 v9M60 16 v11M68 17 v9" stroke="#D98A38" stroke-width="3.4" stroke-linecap="round"/>' }),
  A('생쥐', '#C9CDD6', '#F4F5F8', 'round', '#FFC2CC', 'std', { es: 1.45, nose: '#F08A8A', over: () => whisk('#7C8492') }),
  A('햄스터', '#F2C078', '#FFF8EA', 'round', '#FFC7B0', 'std', { es: 0.8, nose: '#F08A8A', over: () => mir('<ellipse cx="24" cy="62" rx="15" ry="13" fill="#FFF8EA"/>') + '<ellipse cx="60" cy="24" rx="22" ry="9" fill="#FFF8EA"/>' }),
  A('토끼', '#FBF6EE', '#FFFFFF', 'long', '#FFC2CC', 'std', { nose: '#F08A8A', dark: '#C9B9A6' }),
  A('여우', '#F08A3C', '#FFF4E4', 'pointy', '#4A3226', 'std', { over: () => mir('<path d="M9 58 q14 -10 26 6 q-4 18 -20 20 q-8 -8 -6 -26z" fill="#FFF4E4"/>') }),
  A('곰', '#A9764A', '#E8CFAE', 'round', '#E8CFAE', 'std'),
  A('판다', '#FBFAF6', '#FFFFFF', 'round', '#3B3B44', 'std', { earC: '#3B3B44', dark: '#B9B4AA', eye: '#fff', pre: () => mir('<ellipse cx="25" cy="42" rx="10" ry="12" fill="#3B3B44" transform="rotate(-14 25 42)"/>') }),
  A('코알라', '#A9B0BA', '#DDE1E7', 'round', '#F3D6DA', 'big', { es: 1.5 }),
  A('호랑이', '#F5A53A', '#FFF3DC', 'round', '#FFF3DC', 'std', { over: () => '<path d="M52 16 v10M60 15 v13M68 16 v10" stroke="#4A3226" stroke-width="3.6" stroke-linecap="round"/>' + mir('<path d="M10 44 h9M10 52 h7" stroke="#4A3226" stroke-width="3.4" stroke-linecap="round"/>') }),
  A('사자', '#F3C063', '#FFF3DC', 'round', '#F3C063', 'std', { es: 0.85, back: () => [0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330].map(r => `<circle cx="60" cy="-1" r="15" fill="#C97A2E" transform="rotate(${r} 60 50)"/>`).join('') }),
  A('소', '#FBFAF6', '#F7B9B4', 'side', '#F7B9B4', 'cow', { dark: '#B46A66', back: () => mir('<path d="M30 17 q-13 -3 -13 -21 q11 4 18 17z" fill="#F4E9D0" stroke="#C9B58C" stroke-width="1.6"/>'), over: () => '<path d="M70 15 h24 q17 0 17 22 q-18 8 -30 -4 q-8 -8 -11 -18z" fill="#4A4A55"/>' }),
  A('돼지', '#FFC2CC', '#FF9FB0', 'fold', '#FF9FB0', 'snout', { dark: '#C8607A' }),
  A('개구리', '#8FCB5C', '#C9EE9E', 'none', '', 'frog', { dark: '#3F7A2C', back: () => mir('<circle cx="26" cy="20" r="14" fill="#8FCB5C"/>'), eyeY: -16, pre: () => mir('<circle cx="26" cy="23" r="8.5" fill="#fff"/>') }),
  A('원숭이', '#A8703F', '#F6D7B0', 'side', '#F6D7B0', 'std', { over: () => '<path d="M60 26 q-18 -8 -30 4 q-10 12 -4 26 q4 24 34 24 q30 0 34 -24 q6 -14 -4 -26 q-12 -12 -30 -4z" fill="#F6D7B0"/>' }),
  A('닭', '#FFFDF7', '#FFC93C', 'none', '', 'beak', { dark: '#D9960F', back: () => '<path d="M46 18 q-4 -18 8 -18 q4 -8 12 0 q12 0 8 18z" fill="#E5484D"/>', over: () => '<path d="M54 72 q6 12 12 0z" fill="#E5484D"/>' }),
  A('펭귄', '#3F4A5C', '#FFB52E', 'none', '', 'beak', { dark: '#C97F0E', over: () => '<path d="M60 30 q-16 -12 -30 0 q-12 14 -4 34 q6 20 34 20 q28 0 34 -20 q8 -20 -4 -34 q-14 -12 -30 0z" fill="#FFFDF7"/>' }),
  A('병아리', '#FFE06B', '#FF9A3C', 'none', '', 'beak', { dark: '#D9701A', back: () => '<path d="M60 16 q-10 -14 -2 -20 q2 8 8 4 q2 8 -6 16z" fill="#FFE06B" stroke="#E0B22C" stroke-width="1.5"/>' }),
  A('오리', '#FFFDF7', '#FFB52E', 'none', '', 'bill', { dark: '#C97F0E', back: () => '<path d="M58 16 q-12 -10 -6 -18 q4 6 10 2 q6 8 -4 16z" fill="#FFFDF7" stroke="#D9D2C2" stroke-width="1.5"/>' }),
  A('부엉이', '#A77B52', '#FFC93C', 'tuft', '', 'beak', { dark: '#C9820F', eye: INK, pre: () => mir('<circle cx="27" cy="42" r="15" fill="#F3E2C4"/>') }),
  A('늑대', '#8E97A6', '#EEF0F4', 'pointy', '#EEF0F4', 'std', { over: () => mir('<path d="M9 58 q14 -8 24 6 q-4 16 -18 20 q-8 -8 -6 -26z" fill="#EEF0F4"/>') }),
  A('멧돼지', '#8A6348', '#C99A78', 'fold', '#C99A78', 'snout', { dark: '#5A3A28', over: () => mir('<path d="M41 72 q-6 -2 -5 -12 q6 3 9 8z" fill="#FFFDF7" stroke="#C9B58C" stroke-width="1.2"/>') + '<path d="M52 15 l3 9 l5 -10 l5 10 l3 -9" fill="none" stroke="#5A3A28" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>' }),
  A('말', '#B98455', '#F0D9BC', 'narrow', '#F0D9BC', 'cow', { dark: '#7A5236', over: () => '<path d="M48 15 q12 -12 24 0 q-4 16 -12 20 q-8 -4 -12 -20z" fill="#5F3F2B"/>' }),
  A('유니콘', '#FFFFFF', '#FFE3EC', 'narrow', '#FFC2D4', 'cow', { dark: '#D98AA6', back: () => '<path d="M60 16 l-7 0 l7 -36 l7 36z" fill="#FFD75E" stroke="#E0A21C" stroke-width="1.6" stroke-linejoin="round"/><path d="M56 6 l8 -3M57 -3 l6 -3" stroke="#E0A21C" stroke-width="1.4"/>', over: () => '<path d="M40 15 q10 -8 20 2 q-10 4 -14 16 q-8 -6 -6 -18z" fill="#B39AE8"/><path d="M60 17 q10 -10 22 -2 q0 10 -8 16 q-4 -10 -14 -14z" fill="#8EC5F0"/>' }),
  A('거북이', '#8DC27A', '#C6E5B0', 'none', '', 'frog', { dark: '#3F7A2C', over: () => '<path d="M30 15 h60 q8 0 13 6 q-43 12 -86 0 q5 -6 13 -6z" fill="#5E9A4E"/>' + mir('<circle cx="40" cy="20" r="2.4" fill="#3F7A2C"/>') }),
  A('문어', '#E88BB0', '#FFC7DA', 'none', '', 'tiny', { dark: '#B5527E', back: () => [14, 37, 60, 83, 106].map(x => `<ellipse cx="${x}" cy="82" rx="11" ry="9" fill="#E88BB0"/>`).join(''), over: () => [26, 49, 71, 94].map(x => `<circle cx="${x}" cy="84" r="2.2" fill="#FFC7DA"/>`).join('') }),
  A('물개', '#8C99AB', '#D5DCE6', 'none', '', 'std', { over: () => whisk('#4F5A6B') + mir('<circle cx="48" cy="64" r="1.2" fill="#4F5A6B"/><circle cx="44" cy="68" r="1.2" fill="#4F5A6B"/>') }),
  A('고슴도치', '#F1D9B5', '#FFF3DC', 'round', '#F1D9B5', 'std', { es: 0.7, back: () => [-70, -50, -30, -10, 10, 30, 50, 70].map(r => `<path d="M48 10 L60 -18 L72 10z" fill="#7A5A44" stroke="#5F3F2B" stroke-width="1.5" stroke-linejoin="round" transform="rotate(${r} 60 52)"/>`).join(''), over: () => '<path d="M22 15 h76 q9 0 13 8 q-51 -4 -102 0 q4 -8 13 -8z" fill="#7A5A44"/>' }),
  A('다람쥐', '#C98448', '#FFF1DA', 'pointy', '#F6C99A', 'std', { over: () => '<path d="M56 15 h8 v24 q-4 4 -8 0z" fill="#7A4A26"/>' + mir('<ellipse cx="24" cy="63" rx="13" ry="11" fill="#FFF1DA"/>') }),
  A('너구리', '#9B8F86', '#F3EEE8', 'round', '#4A4038', 'std', { pre: () => mir('<path d="M9 36 q16 -8 30 2 q2 12 -8 16 q-16 2 -22 -4z" fill="#4A4038"/>'), eye: '#fff' }),
];
// full = true면 카피바라와 같은 2등신 몸까지 그린다
// mood: 'angry'면 눈썹을 찌푸리고, 'mad'면 화난 표시까지 붙는다
export function animalSvg(i, full, mood) {
  const a = ANIMALS[i % ANIMALS.length], d = a.dark || shade(a.body, -0.38), ey = a.eyeY || 0;
  const ear = EAR[a.ear](a.earC || a.body, a.inner, a.es || 1);
  const eyeCol = a.eye || INK, e = a.eye === '#fff' ? mir(`<circle cx="24" cy="41" r="4" fill="#fff"/><circle cx="24.6" cy="41.4" r="2.2" fill="${INK}"/>`) : eyes(eyeCol);
  const bc = a.earC && a.name === '판다' ? '#3B3B44' : a.body, bd = shade(bc, -0.3), belly = a.name === '펭귄' ? '#FFFDF7' : a.muz === 'beak' || a.muz === 'bill' ? shade(bc, a.body === '#FFFDF7' ? -0.06 : 0.45) : a.light;
  const body = full ? `<ellipse cx="45" cy="128" rx="12" ry="6.5" fill="${bd}"/><ellipse cx="75" cy="128" rx="12" ry="6.5" fill="${bd}"/><rect x="31" y="76" width="58" height="50" rx="24" fill="${bc}"/><ellipse cx="60" cy="105" rx="17" ry="15" fill="${belly}"/><ellipse cx="29" cy="99" rx="8" ry="12" fill="${bc}" transform="rotate(14 29 99)"/><ellipse cx="91" cy="99" rx="8" ry="12" fill="${bc}" transform="rotate(-14 91 99)"/>` : '';
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 -22 120 ${full ? 158 : 112}">${a.back ? a.back(a.body) : ''}${body}${ear}${head(a.body)}${a.over ? a.over(a.body) : ''}${a.pre ? a.pre(a.body) : ''}${MUZ[a.muz](a.light, d, a.nose)}<g transform="translate(0 ${ey})">${e}${mood === 'angry' || mood === 'mad' ? `<path d="M14 30 L34 37M106 30 L86 37" stroke="${INK}" stroke-width="3.6" stroke-linecap="round"/>` : ''}</g>${mood === 'mad' ? '<g stroke="#E5484D" stroke-width="3" stroke-linecap="round" fill="none"><path d="M92 -2 q5 3 4 9M104 -4 q-3 5 2 9M96 14 q5 -3 9 1M108 12 q-5 -1 -6 -6"/></g>' : ''}${mood ? '' : blush}</svg>`;
}
