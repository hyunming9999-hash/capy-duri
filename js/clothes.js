// 카피바라 옷장: 상의 50벌 + 하의 50벌 + 모자 50개 (종류 10가지 × 색 5가지씩). 전부 직접 그린 SVG 조각.
// 좌표는 capy.js 의 전신 그림(viewBox 0 -22 120 158) 기준: 몸통 x31~89 / y76~126, 머리 아랫선 y84.
const shade = (hex, f) => '#' + [1, 3, 5].map(i => Math.max(0, Math.min(255, Math.round(parseInt(hex.slice(i, i + 2), 16) * f))).toString(16).padStart(2, '0')).join('');
let uid = 0;
const BODY = '<rect x="31" y="76" width="58" height="50" rx="24"/>';
// 몸통 모양으로 잘라 그리기
const inBody = inner => { const id = 'cb' + (++uid); return `<clipPath id="${id}">${BODY}</clipPath><g clip-path="url(#${id})">${inner}</g>`; };
const sleeve = (c, long, d = shade(c, 0.78)) => [[29, 14], [91, -14]].map(([x, r]) =>
  `<ellipse cx="${x}" cy="${long ? 97.5 : 93.5}" rx="8.8" ry="${long ? 11 : 7.6}" fill="${c}" stroke="${d}" stroke-width="1" transform="rotate(${r} ${x} 99)"/>`).join('');
const torso = (c, d = shade(c, 0.78)) => inBody(`<rect x="29" y="74" width="62" height="34.5" fill="${c}"/>`) + `<path d="M33 108.5 H87" stroke="${d}" stroke-width="1.6" stroke-linecap="round"/>`;
const neck = c => `<path d="M50 85.5 q10 7 20 0" fill="none" stroke="${c}" stroke-width="2.6" stroke-linecap="round"/>`;
const MOTIF = {
  heart: c => `<path d="M60 102 l-5.5 -5.5 a3.1 3.1 0 0 1 5.5 -2.8 a3.1 3.1 0 0 1 5.5 2.8z" fill="${c}"/>`,
  star: c => `<path d="M60 91.5 l1.9 4 4.4 .5 -3.3 3 .9 4.3 -3.9 -2.2 -3.9 2.2 .9 -4.3 -3.3 -3 4.4 -.5z" fill="${c}"/>`,
  yuzu: () => `<circle cx="60" cy="98" r="5" fill="#FFC93C" stroke="#D9960F"/><path d="M60 93 q-4 -3 -6 0 q3 2 6 0z" fill="#6FB24F"/>`,
  paw: c => `<ellipse cx="60" cy="99.5" rx="4" ry="3.2" fill="${c}"/><circle cx="55.3" cy="95.3" r="1.7" fill="${c}"/><circle cx="60" cy="93.6" r="1.7" fill="${c}"/><circle cx="64.7" cy="95.3" r="1.7" fill="${c}"/>`,
  smile: c => `<circle cx="56.5" cy="95" r="1.4" fill="${c}"/><circle cx="63.5" cy="95" r="1.4" fill="${c}"/><path d="M55 99 q5 4.5 10 0" fill="none" stroke="${c}" stroke-width="1.8" stroke-linecap="round"/>`,
};

/* ---------- 상의 ---------- */
const TOP_DRAW = {
  tee: (c, a, m) => torso(c) + sleeve(c) + neck(shade(c, 0.78)) + (MOTIF[m] ? MOTIF[m](a) : ''),
  stripe: (c, a) => torso(c) + inBody([88, 94.5, 101].map(y => `<rect x="29" y="${y}" width="62" height="3.2" fill="${a}"/>`).join('')) + sleeve(c) + neck(a),
  hoodie: (c, a) => { const d = shade(c, 0.8); return torso(c) + sleeve(c, true) + `<rect x="47.5" y="98" width="25" height="8.5" rx="4" fill="${d}"/><path d="M42 84 q18 15 36 0 l3.5 3 q-21.5 18 -43 0z" fill="${d}"/><path d="M55 91 v8 M65 91 v8" stroke="${a}" stroke-width="1.6" stroke-linecap="round"/><circle cx="55" cy="100" r="1.5" fill="${a}"/><circle cx="65" cy="100" r="1.5" fill="${a}"/>`; },
  shirt: (c, a) => { const d = shade(c, 0.75); return torso(c) + sleeve(c) + `<path d="M60 88 V108" stroke="${d}" stroke-width="1.3"/><path d="M60 88.5 L49 84.5 L52.5 94z M60 88.5 L71 84.5 L67.5 94z" fill="${a}" stroke="${d}" stroke-width="1" stroke-linejoin="round"/>${[94, 99.5, 105].map(y => `<circle cx="60" cy="${y}" r="1.15" fill="${d}"/>`).join('')}`; },
  cardigan: (c, a) => { const d = shade(c, 0.78); return torso('#FFFDF7', d) + inBody(`<path d="M29 74 H56 L53.5 110 H29z M91 74 H64 L66.5 110 H91z" fill="${c}"/><path d="M56 82 L53.5 110 M64 82 L66.5 110" stroke="${d}" stroke-width="1.2"/>`) + sleeve(c, true) + [92, 98, 104].map(y => `<circle cx="${69 + (y - 92) * 0.05}" cy="${y}" r="1.3" fill="${a}"/>`).join(''); },
  vest: (c, a) => { const d = shade(c, 0.78); return torso(c) + sleeve('#FFFDF7', true, '#D9D2C3') + `<path d="M51 84.5 L60 96 L69 84.5z" fill="#FFFDF7" stroke="${d}" stroke-width="1"/><path d="M52 101 l4 -4.5 l4 4.5 l-4 4.5z M60 101 l4 -4.5 l4 4.5 l-4 4.5z" fill="${a}"/>`; },
  sailor: (c, a) => torso('#FFFDF7', '#D9D2C3') + sleeve('#FFFDF7', false, '#D9D2C3') + `<path d="M44.5 84 L60 100 L75.5 84 L80 87.5 L60 106 L40 87.5z" fill="${c}"/><path d="M43.5 86.6 L60 102.6 L76.5 86.6" fill="none" stroke="#fff" stroke-width="1.1"/><path d="M60 101 l-6.5 -3.2 v7z M60 101 l6.5 -3.2 v7z" fill="${a}"/><circle cx="60" cy="101.3" r="1.9" fill="${shade(a, 0.8)}"/>`,
  blouse: (c, a) => { const d = shade(c, 0.8); return torso(c) + [[28.5, 14], [91.5, -14]].map(([x, r]) => `<circle cx="${x}" cy="92.5" r="8.6" fill="${c}" stroke="${d}" stroke-width="1" transform="rotate(${r} ${x} 99)"/>`).join('') + [46, 51.5, 57, 63, 68.5, 74].map((x, i) => `<circle cx="${x}" cy="${86.6 + [0, 1.6, 2.4, 2.4, 1.6, 0][i]}" r="3.3" fill="#FFFDF7" stroke="${d}" stroke-width=".8"/>`).join('') + `<path d="M60 93 l-5 -2.4 v5.6z M60 93 l5 -2.4 v5.6z" fill="${a}"/><circle cx="60" cy="93.2" r="1.5" fill="${shade(a, 0.8)}"/>`; },
  jumper: (c, a) => { const d = shade(c, 0.78); return torso(c) + inBody(`<rect x="29" y="104.5" width="62" height="4" fill="${a}"/>`) + sleeve(a, true) + `<path d="M60 86 V108" stroke="${d}" stroke-width="1.4"/><path d="M50 85 q10 6.5 20 0" fill="none" stroke="${a}" stroke-width="3.2" stroke-linecap="round"/><circle cx="48" cy="97" r="4.2" fill="#FFFDF7" stroke="${d}" stroke-width=".8"/><path d="M49.8 95.4 a2.4 2.4 0 1 0 0 3.2" fill="none" stroke="${d}" stroke-width="1.3" stroke-linecap="round"/>`; },
  jeogori: (c, a) => { const d = shade(c, 0.78); return torso(c) + sleeve(c, true) + [[27.2, 14], [92.8, -14]].map(([x, r]) => `<ellipse cx="${x}" cy="105.5" rx="7.4" ry="2.6" fill="${a}" transform="rotate(${r} ${x} 99)"/>`).join('') + `<path d="M47 84 L61.5 99.5 L58 103 L43.5 87z" fill="#FFFDF7" stroke="${d}" stroke-width=".9"/><path d="M73 84 L58.5 99.5 L62 103 L76.5 87z" fill="#FFFDF7" stroke="${d}" stroke-width=".9"/><path d="M60 100.5 q-7 5 -5.5 13 M60 100.5 q4.5 6 3 12" fill="none" stroke="${a}" stroke-width="3.4" stroke-linecap="round"/><circle cx="60" cy="100.5" r="2.4" fill="${a}"/>`; },
};
// [종류, 이름, 성별(m 남자 / f 여자 / u 같이), [[색 이름, 주색, 포인트색, 무늬]...]]
const TOP_SETS = [
  ['tee', '티셔츠', 'u', [['노랑', '#FFD75E', '#E8567A', 'heart'], ['하늘', '#9AD0F5', '#FFF3B0', 'star'], ['흰', '#FFFDF7', '#000', 'yuzu'], ['민트', '#A8E6CF', '#7A5236', 'paw'], ['분홍', '#FFB3C7', '#7A3B4E', 'smile']]],
  ['stripe', '줄무늬 티', 'u', [['빨강', '#FFFDF7', '#E5484D'], ['남색', '#FFFDF7', '#3B5BA9'], ['초록', '#F3FBE8', '#5BA65B'], ['노랑', '#FFF8D6', '#F0A500'], ['분홍', '#FFF0F4', '#F06A93']]],
  ['hoodie', '후드티', 'm', [['회색', '#C9CCD3', '#FFFFFF'], ['남색', '#4F6DB8', '#FFFFFF'], ['초록', '#7DBE7D', '#FFFDF7'], ['주황', '#FFA95E', '#FFFDF7'], ['보라', '#B39AE8', '#FFFDF7']]],
  ['shirt', '셔츠', 'm', [['하늘', '#BFE0FA', '#FFFFFF'], ['흰', '#FFFFFF', '#E8EEF5'], ['연두', '#D6EFB8', '#FFFFFF'], ['살구', '#FFD9BF', '#FFFFFF'], ['라벤더', '#DCD2F7', '#FFFFFF']]],
  ['cardigan', '가디건', 'f', [['크림', '#F6E3B4', '#C98A3B'], ['분홍', '#FFC2D1', '#E8567A'], ['연보라', '#D6C8F5', '#8B6FE8'], ['민트', '#BDEBD8', '#3F9E7C'], ['하늘', '#BFE0FA', '#3E7FC1']]],
  ['vest', '니트 조끼', 'm', [['남색', '#4F6DB8', '#FFD75E'], ['밤색', '#A8744B', '#F6E3B4'], ['초록', '#5BA65B', '#FFF3B0'], ['빨강', '#D9534F', '#FFE1A8'], ['회색', '#9AA0AB', '#FFB3C7']]],
  ['sailor', '세일러', 'f', [['남색', '#3B5BA9', '#E5484D'], ['하늘', '#7CBFEF', '#FFD75E'], ['분홍', '#F58FB0', '#FFFDF7'], ['초록', '#5BA65B', '#FFD75E'], ['검정', '#4A4A55', '#E5484D']]],
  ['blouse', '프릴 블라우스', 'f', [['분홍', '#FFC2D1', '#E8567A'], ['흰', '#FFFDF7', '#7CBFEF'], ['노랑', '#FFE99A', '#F0A500'], ['라벤더', '#DCD2F7', '#8B6FE8'], ['민트', '#BDEBD8', '#3F9E7C']]],
  ['jumper', '야구 점퍼', 'm', [['빨강', '#D9534F', '#FFFDF7'], ['남색', '#3B5BA9', '#FFFDF7'], ['초록', '#3F8F5F', '#FFE99A'], ['검정', '#4A4A55', '#FFD75E'], ['하늘', '#7CBFEF', '#FFFDF7']]],
  ['jeogori', '저고리', 'u', [['연노랑', '#FFE99A', '#E5484D'], ['분홍', '#FFC2D1', '#8B4FB8'], ['옥색', '#B5E3DA', '#3B5BA9'], ['흰', '#FFFDF7', '#3B5BA9'], ['연두', '#D6EFB8', '#E8567A']]],
];

/* ---------- 하의 ---------- */
const band = (c, y = 104) => inBody(`<rect x="29" y="${y}" width="62" height="3.4" fill="${c}"/>`);
const pants = (c, yEnd) => inBody(`<rect x="29" y="104" width="62" height="${yEnd - 104}" fill="${c}"/>`) + `<path d="M60 110 V${Math.min(yEnd, 126)}" stroke="${shade(c, 0.72)}" stroke-width="1.4" stroke-linecap="round"/>`;
const skirt = (c, w = 37, y2 = 123.5) => `<path d="M34.5 104 H85.5 L${60 + w} ${y2} Q60 ${y2 + 7.5} ${60 - w} ${y2}z" fill="${c}" stroke="${shade(c, 0.78)}" stroke-width="1.1" stroke-linejoin="round"/>`;
const BOTTOM_DRAW = {
  shorts: (c, a) => ({ under: pants(c, 118.5) + band(shade(c, 0.82)) + inBody(`<rect x="29" y="116.6" width="62" height="2" fill="${a}"/>`) }),
  jeans: c => { const d = shade(c, 0.72); return { under: pants(c, 130) + band(d) + inBody(`<rect x="29" y="122.6" width="62" height="3.6" fill="${shade(c, 1.18)}"/>`) + `<path d="M40 109 q3.5 3.5 7 0 M73 109 q3.5 3.5 7 0" fill="none" stroke="${d}" stroke-width="1.1"/>` }; },
  flare: (c, a) => ({ under: skirt(c) + `<path d="M35 106.2 H85" stroke="${a}" stroke-width="2.6" stroke-linecap="round"/><path d="M26.5 121.3 Q60 128.5 93.5 121.3" fill="none" stroke="${a}" stroke-width="1.6"/>` }),
  pleats: (c, a) => ({ under: skirt(c, 35, 122.5) + [-24, -14, -5, 5, 14, 24].map(x => `<path d="M${60 + x * 0.72} 107 L${60 + x * 1.3} ${125 - Math.abs(x) * 0.07}" stroke="${shade(c, 0.74)}" stroke-width="1.1"/>`).join('') + `<path d="M35 105.6 H85" stroke="${a}" stroke-width="3" stroke-linecap="round"/>` }),
  overalls: (c, a) => { const d = shade(c, 0.74); return { under: pants(c, 130) + inBody(`<rect x="29" y="122.6" width="62" height="3.6" fill="${shade(c, 1.16)}"/>`),
    over: `<path d="M50 91 L45.5 84.5 M70 91 L74.5 84.5" stroke="${c}" stroke-width="4.2" stroke-linecap="round"/><rect x="47" y="89.5" width="26" height="17" rx="3.5" fill="${c}" stroke="${d}" stroke-width="1"/><rect x="54" y="95.5" width="12" height="7.5" rx="2" fill="none" stroke="${d}" stroke-width="1"/><circle cx="50.2" cy="92.4" r="1.7" fill="${a}"/><circle cx="69.8" cy="92.4" r="1.7" fill="${a}"/>` }; },
  track: (c, a) => ({ under: pants(c, 130) + inBody(`<rect x="34.5" y="104" width="2.3" height="26" fill="${a}"/><rect x="38.3" y="104" width="2.3" height="26" fill="${a}"/><rect x="79.4" y="104" width="2.3" height="26" fill="${a}"/><rect x="83.2" y="104" width="2.3" height="26" fill="${a}"/>`) + band(shade(c, 0.8)) + `<path d="M57.5 108 v4 M62.5 108 v4" stroke="${a}" stroke-width="1.3" stroke-linecap="round"/>` }),
  tutu: (c, a) => { const d = shade(c, 0.82); return { under: `<ellipse cx="60" cy="114" rx="38" ry="9.5" fill="${shade(c, 0.9)}" stroke="${d}" stroke-width="1"/>${[-30, -20, -10, 0, 10, 20, 30].map(x => `<circle cx="${60 + x}" cy="${119 - Math.abs(x) * 0.1}" r="6.2" fill="${c}" stroke="${d}" stroke-width=".8"/>`).join('')}<ellipse cx="60" cy="109.5" rx="30" ry="6.5" fill="${c}"/><path d="M36 105.6 H84" stroke="${a}" stroke-width="3" stroke-linecap="round"/><path d="M60 105.6 l-4.6 -2.2 v4.6z M60 105.6 l4.6 -2.2 v4.6z" fill="${a}" stroke="${shade(a, 0.8)}" stroke-width=".6"/>` }; },
  plaid: (c, a) => ({ under: pants(c, 118.5) + inBody([36, 44, 52, 68, 76, 84].map(x => `<rect x="${x}" y="104" width="1.6" height="14.5" fill="${a}" opacity=".85"/>`).join('') + [109.5, 114.5].map(y => `<rect x="29" y="${y}" width="62" height="1.6" fill="${a}" opacity=".85"/>`).join('')) + band(shade(c, 0.8)) }),
  chima: (c, a) => ({ under: `<path d="M35 101.5 H85 L99.5 126 Q60 135 20.5 126z" fill="${c}" stroke="${shade(c, 0.78)}" stroke-width="1.1" stroke-linejoin="round"/>${[-22, -11, 0, 11, 22].map(x => `<path d="M${60 + x * 0.6} 106 Q${60 + x * 1.1} 116 ${60 + x * 1.45} ${129 - Math.abs(x) * 0.12}" fill="none" stroke="${shade(c, 0.82)}" stroke-width="1"/>`).join('')}<path d="M35.5 103.4 H84.5" stroke="#FFFDF7" stroke-width="4" stroke-linecap="round"/><path d="M24 122.6 Q60 130.6 96 122.6" fill="none" stroke="${a}" stroke-width="2"/>` }),
  baji: (c, a) => { const d = shade(c, 0.78); return { under: `<path d="M33 104 H87 Q95 114 90 124.5 Q77 129.5 63.5 125 L60 113 L56.5 125 Q43 129.5 30 124.5 Q25 114 33 104z" fill="${c}" stroke="${d}" stroke-width="1.1" stroke-linejoin="round"/><path d="M33 124.2 q10 3.4 21.5 0 M65.5 124.2 q11.5 3.4 21.5 0" fill="none" stroke="${a}" stroke-width="2.6" stroke-linecap="round"/><path d="M34 105.8 H86" stroke="${a}" stroke-width="3" stroke-linecap="round"/>` }; },
};
const BOTTOM_SETS = [
  ['shorts', '반바지', 'u', [['카키', '#C9B27C', '#FFFDF7'], ['하늘', '#9AD0F5', '#FFFFFF'], ['빨강', '#E5686B', '#FFFDF7'], ['초록', '#7DBE7D', '#FFF3B0'], ['회색', '#B4B8C2', '#FFFFFF']]],
  ['jeans', '청바지', 'u', [['진청', '#4F6DB8'], ['연청', '#9DB9E8'], ['검정', '#55555F'], ['흰', '#F4F1EA'], ['밤색', '#A8744B']]],
  ['flare', '플레어 치마', 'f', [['분홍', '#FFB3C7', '#FFFDF7'], ['노랑', '#FFD75E', '#FFFDF7'], ['하늘', '#9AD0F5', '#FFFFFF'], ['빨강', '#E5686B', '#FFE1A8'], ['보라', '#B39AE8', '#FFFDF7']]],
  ['pleats', '주름 치마', 'f', [['남색', '#4F6DB8', '#FFFDF7'], ['회색', '#B4B8C2', '#E5484D'], ['베이지', '#E6CFA3', '#A8744B'], ['초록', '#6FAF7A', '#FFF3B0'], ['검정', '#55555F', '#FFB3C7']]],
  ['overalls', '멜빵바지', 'u', [['청', '#6F8FD6', '#FFD75E'], ['카키', '#B7A26B', '#7A5236'], ['분홍', '#F7A8BE', '#FFFDF7'], ['노랑', '#FFD75E', '#E5484D'], ['초록', '#7DBE7D', '#FFFDF7']]],
  ['track', '츄리닝 바지', 'm', [['검정', '#4A4A55', '#FFFFFF'], ['남색', '#3B5BA9', '#FFFFFF'], ['빨강', '#D9534F', '#FFFFFF'], ['회색', '#9AA0AB', '#3B5BA9'], ['초록', '#3F8F5F', '#FFE99A']]],
  ['tutu', '튜튜', 'f', [['분홍', '#FFC2D1', '#E8567A'], ['흰', '#FFFDF7', '#FFB3C7'], ['라벤더', '#DCD2F7', '#8B6FE8'], ['민트', '#BDEBD8', '#3F9E7C'], ['노랑', '#FFEFA6', '#F0A500']]],
  ['plaid', '체크 반바지', 'm', [['빨강', '#D9534F', '#FFE1A8'], ['남색', '#3B5BA9', '#9AD0F5'], ['초록', '#3F8F5F', '#FFE99A'], ['밤색', '#A8744B', '#F6E3B4'], ['회색', '#9AA0AB', '#FFFFFF']]],
  ['chima', '한복 치마', 'f', [['다홍', '#F0626A', '#FFD75E'], ['남색', '#3B5BA9', '#FFD75E'], ['분홍', '#FFB3C7', '#8B4FB8'], ['연두', '#B9E08A', '#E8567A'], ['보라', '#9B7FD9', '#FFE99A']]],
  ['baji', '한복 바지', 'm', [['옥색', '#B5E3DA', '#3B5BA9'], ['회색', '#C9CCD3', '#4A4A55'], ['연보라', '#D6C8F5', '#6A4FC9'], ['흰', '#F7F3EA', '#3B5BA9'], ['연분홍', '#FBD3DC', '#8B4FB8']]],
];

/* ---------- 모자 50개 (종류 10가지 × 색 5가지) ----------
   좌표는 머리 기준: 머리 x9~111, 정수리 y15, 그림 위쪽 끝 y-22. c 주색, a 포인트색 */
const HAT_DRAW = {
  cap: (c, a) => { const d = shade(c, 0.78); return `<path d="M24 23 Q23 -9 60 -9 Q97 -9 96 23z" fill="${c}" stroke="${d}" stroke-width="1.6" stroke-linejoin="round"/><path d="M60 -9 V23 M41 -4 Q36 8 36 23 M79 -4 Q84 8 84 23" fill="none" stroke="${d}" stroke-width="1.1" opacity=".7"/><path d="M27 21 Q60 12 93 21 Q96 30 60 31 Q24 30 27 21z" fill="${a}" stroke="${shade(a, 0.78)}" stroke-width="1.5" stroke-linejoin="round"/><circle cx="60" cy="-9" r="3" fill="${a}" stroke="${shade(a, 0.78)}" stroke-width="1"/>`; },
  beanie: (c, a) => { const d = shade(c, 0.78); return `<path d="M21 20 Q20 -12 60 -12 Q100 -12 99 20z" fill="${c}" stroke="${d}" stroke-width="1.6" stroke-linejoin="round"/><path d="M38 -6 Q34 6 34 14 M60 -12 V14 M82 -6 Q86 6 86 14" fill="none" stroke="${d}" stroke-width="1.1" opacity=".6"/><rect x="17" y="12" width="86" height="13" rx="6.5" fill="${a}" stroke="${shade(a, 0.78)}" stroke-width="1.5"/>${[28, 39, 50, 61, 72, 83, 94].map(x => `<path d="M${x} 14.5 v8" stroke="${shade(a, 0.8)}" stroke-width="1.2" stroke-linecap="round"/>`).join('')}<circle cx="60" cy="-14" r="7" fill="${a}" stroke="${shade(a, 0.78)}" stroke-width="1.4"/>`; },
  straw: (c, a) => { const d = shade(c, 0.76); return `<ellipse cx="60" cy="20" rx="57" ry="9.5" fill="${c}" stroke="${d}" stroke-width="1.6"/><path d="M32 20 Q31 -11 60 -11 Q89 -11 88 20 Q60 26 32 20z" fill="${c}" stroke="${d}" stroke-width="1.6" stroke-linejoin="round"/><path d="M36 -1 Q60 4 84 -1 M33 8 Q60 14 87 8" fill="none" stroke="${d}" stroke-width=".9" opacity=".6"/><path d="M32.3 11 Q60 18 87.7 11 L88 19 Q60 25.5 32 19z" fill="${a}" stroke="${shade(a, 0.78)}" stroke-width="1"/><path d="M84 15 l9 7 l-2 -8 l8 -2z" fill="${a}" stroke="${shade(a, 0.78)}" stroke-width="1" stroke-linejoin="round"/>`; },
  beret: (c, a) => { const d = shade(c, 0.78); return `<g transform="rotate(-9 60 12)"><ellipse cx="57" cy="7" rx="43" ry="17" fill="${c}" stroke="${d}" stroke-width="1.6"/><path d="M30 2 Q52 -9 80 -3" fill="none" stroke="${shade(c, 1.18)}" stroke-width="3" stroke-linecap="round" opacity=".7"/><path d="M24 19 Q60 27 92 17" fill="none" stroke="${a}" stroke-width="4.5" stroke-linecap="round"/><path d="M57 -10 q1 -6 5 -8" fill="none" stroke="${d}" stroke-width="2.6" stroke-linecap="round"/></g>`; },
  crown: (c, a) => { const d = shade(c, 0.74); return `<path d="M27 23 L24 -5 L42 9 L60 -14 L78 9 L96 -5 L93 23z" fill="${c}" stroke="${d}" stroke-width="1.8" stroke-linejoin="round"/><rect x="26" y="15" width="68" height="9" rx="3" fill="${shade(c, 0.9)}" stroke="${d}" stroke-width="1.4"/><circle cx="24" cy="-6" r="3.4" fill="${a}" stroke="${d}" stroke-width="1"/><circle cx="60" cy="-15" r="4" fill="${a}" stroke="${d}" stroke-width="1"/><circle cx="96" cy="-6" r="3.4" fill="${a}" stroke="${d}" stroke-width="1"/><path d="M60 9 l4.5 5 l-4.5 5 l-4.5 -5z" fill="${a}" stroke="${d}" stroke-width="1"/><circle cx="40" cy="19.5" r="2.2" fill="#fff" opacity=".9"/><circle cx="80" cy="19.5" r="2.2" fill="#fff" opacity=".9"/>`; },
  party: (c, a) => { const d = shade(c, 0.76), id = 'hp' + (++uid); return `<clipPath id="${id}"><path d="M37 22 L60 -16 L83 22z"/></clipPath><path d="M37 22 L60 -16 L83 22z" fill="${c}" stroke="${d}" stroke-width="1.6" stroke-linejoin="round"/><g clip-path="url(#${id})">${[-8, 2, 12, 22].map(y => `<path d="M30 ${y + 8} L90 ${y - 6}" stroke="${a}" stroke-width="3.6"/>`).join('')}</g><path d="M37 22 L60 -16 L83 22z" fill="none" stroke="${d}" stroke-width="1.6" stroke-linejoin="round"/><ellipse cx="60" cy="22" rx="25" ry="4.5" fill="${a}" stroke="${shade(a, 0.78)}" stroke-width="1.2"/><circle cx="60" cy="-17" r="5" fill="${a}" stroke="${shade(a, 0.78)}" stroke-width="1.2"/>`; },
  chef: (c, a) => { const d = shade(c, 0.82); return `${[[40, 0, 14], [60, -7, 16], [80, 0, 14], [50, 6, 12], [70, 6, 12]].map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r}" fill="${c}" stroke="${d}" stroke-width="1.5"/>`).join('')}<circle cx="60" cy="2" r="15" fill="${c}"/><circle cx="46" cy="4" r="11" fill="${c}"/><circle cx="74" cy="4" r="11" fill="${c}"/><rect x="33" y="9" width="54" height="15" rx="4" fill="${c}" stroke="${d}" stroke-width="1.5"/><path d="M34 19.5 H86" stroke="${a}" stroke-width="3"/><path d="M45 11 v6 M60 11 v6 M75 11 v6" stroke="${d}" stroke-width="1" opacity=".6"/>`; },
  wizard: (c, a) => { const d = shade(c, 0.74); return `<ellipse cx="60" cy="20" rx="52" ry="9" fill="${c}" stroke="${d}" stroke-width="1.6"/><path d="M35 19 Q46 -2 58 -12 Q66 -19 80 -20 Q72 -12 76 -2 Q80 9 85 19 Q60 26 35 19z" fill="${c}" stroke="${d}" stroke-width="1.6" stroke-linejoin="round"/><path d="M36.5 14 Q60 21 83.5 14 L85 19 Q60 26 35 19z" fill="${a}" stroke="${shade(a, 0.78)}" stroke-width="1"/><path d="M60 -3 l1.8 3.7 4.1 .5 -3 2.8 .8 4 -3.7 -2 -3.7 2 .8 -4 -3 -2.8 4.1 -.5z" fill="${a}"/><circle cx="71" cy="-9" r="1.5" fill="${a}"/><circle cx="50" cy="6" r="1.3" fill="${a}"/>`; },
  gat: (c, a) => { const d = shade(c, 0.7); return `<ellipse cx="60" cy="19" rx="58" ry="10" fill="${c}" fill-opacity=".82" stroke="${d}" stroke-width="1.5"/><ellipse cx="60" cy="19" rx="46" ry="7" fill="none" stroke="${d}" stroke-width=".8" opacity=".5"/><path d="M39 18 L41 -11 Q60 -15 79 -11 L81 18 Q60 23 39 18z" fill="${c}" stroke="${d}" stroke-width="1.5" stroke-linejoin="round"/><ellipse cx="60" cy="-11" rx="19" ry="3.6" fill="${shade(c, 1.25)}" stroke="${d}" stroke-width="1"/><path d="M39.4 12 Q60 17 80.6 12" fill="none" stroke="${a}" stroke-width="2.6"/><path d="M40 21 q-3 10 -1 18 M80 21 q3 10 1 18" fill="none" stroke="${a}" stroke-width="1.6" stroke-linecap="round"/><circle cx="39" cy="40" r="2" fill="${a}"/><circle cx="81" cy="40" r="2" fill="${a}"/>`; },
  bunny: (c, a) => { const d = shade(c, 0.8); return `${[[40, -8], [80, 8]].map(([x, r]) => `<g transform="rotate(${r} ${x} 14)"><ellipse cx="${x}" cy="-3" rx="9" ry="19" fill="${c}" stroke="${d}" stroke-width="1.5"/><ellipse cx="${x}" cy="-1" rx="4.2" ry="13" fill="${a}"/></g>`).join('')}<path d="M19 22 Q60 6 101 22" fill="none" stroke="${d}" stroke-width="6.4" stroke-linecap="round"/><path d="M19 22 Q60 6 101 22" fill="none" stroke="${c}" stroke-width="4.2" stroke-linecap="round"/><path d="M60 12 l-7 -3.6 v8.4z M60 12 l7 -3.6 v8.4z" fill="${a}" stroke="${shade(a, 0.8)}" stroke-width=".8"/><circle cx="60" cy="12.3" r="2.2" fill="${shade(a, 0.8)}"/>`; },
};
const HAT_SETS = [
  ['cap', '야구모자', 'u', [['빨강', '#E5484D', '#FFFDF7'], ['남색', '#3B5BA9', '#FFD75E'], ['검정', '#4A4A55', '#E5484D'], ['하늘', '#9AD0F5', '#FFFFFF'], ['분홍', '#FFB3C7', '#FFFDF7']]],
  ['beanie', '방울 비니', 'u', [['빨강', '#D9534F', '#FFFDF7'], ['노랑', '#FFD75E', '#FFFDF7'], ['초록', '#5BA65B', '#FFF3B0'], ['회색', '#9AA0AB', '#FFB3C7'], ['보라', '#B39AE8', '#FFFDF7']]],
  ['straw', '밀짚모자', 'u', [['밀짚', '#F0D58C', '#E5484D'], ['밀짚 파랑띠', '#F0D58C', '#3B5BA9'], ['연한', '#FBEAB8', '#F06A93'], ['갈색', '#D9B26A', '#5BA65B'], ['흰', '#FFFDF7', '#4A4A55']]],
  ['beret', '베레모', 'u', [['빨강', '#D9534F', '#8E2F2C'], ['남색', '#3B5BA9', '#27407C'], ['겨자', '#E0A93B', '#A8741B'], ['분홍', '#F7A8BE', '#D9668A'], ['검정', '#4A4A55', '#2E2E36']]],
  ['crown', '왕관', 'u', [['금', '#FFD75E', '#E5484D'], ['은', '#DADDE5', '#5B8DEF'], ['장미금', '#F7B8A8', '#FFFDF7'], ['에메랄드', '#FFD75E', '#3FAE7C'], ['보라 보석', '#FFE28A', '#8B6FE8']]],
  ['party', '고깔모자', 'u', [['빨강', '#FF7E8E', '#FFFDF7'], ['하늘', '#7CBFEF', '#FFD75E'], ['노랑', '#FFD75E', '#E8567A'], ['초록', '#7DBE7D', '#FFFDF7'], ['보라', '#B39AE8', '#FFE99A']]],
  ['chef', '요리사 모자', 'u', [['흰', '#FFFFFF', '#E5484D'], ['흰 파랑띠', '#FFFFFF', '#3B5BA9'], ['크림', '#FFF3D6', '#C98A3B'], ['분홍', '#FFE1E8', '#E8567A'], ['민트', '#DDF5EA', '#3F9E7C']]],
  ['wizard', '마법사 모자', 'u', [['보라', '#7B5FD0', '#FFD75E'], ['남색', '#34437E', '#FFE99A'], ['검정', '#3E3E48', '#B39AE8'], ['초록', '#3F8F5F', '#FFD75E'], ['빨강', '#C74343', '#FFE99A']]],
  ['gat', '갓', 'u', [['검정', '#2E2E36', '#3B5BA9'], ['검정 붉은끈', '#2E2E36', '#E5484D'], ['밤색', '#6B4A33', '#FFD75E'], ['옥색', '#5E9C92', '#FFFDF7'], ['자주', '#7A3B5E', '#FFD75E']]],
  ['bunny', '토끼 머리띠', 'u', [['흰', '#FFFDF7', '#FFB3C7'], ['분홍', '#FFC2D1', '#FFFDF7'], ['하늘', '#BFE0FA', '#FFFDF7'], ['검정', '#55555F', '#FFB3C7'], ['노랑', '#FFE99A', '#FFFDF7']]],
];

const build = (sets, pre) => sets.flatMap(([kind, label, sex, cols]) => cols.map(([cn, c, a, m], i) => ({ id: `${pre}-${kind}-${i + 1}`, kind, sex, name: `${cn} ${label}`, c, a: a || shade(c, 0.75), m })));
export const TOPS = build(TOP_SETS, 't');
export const BOTTOMS = build(BOTTOM_SETS, 'b');
export const HATS = build(HAT_SETS, 'h');
const byId = Object.fromEntries([...TOPS, ...BOTTOMS, ...HATS].map(x => [x.id, x]));
// 머리 위에 씌울 모자 그림(없는 id면 빈 문자열)
export const hatSvg = id => { const x = byId[id]; return x && x.id[0] === 'h' ? HAT_DRAW[x.kind](x.c, x.a) : ''; };
export const nameOf = id => (byId[id] || {}).name || '';

// 몸통과 팔 사이/위에 끼워 넣을 조각들. under: 팔 아래에 깔리는 하의, top: 상의, over: 상의 위에 올라오는 멜빵 등
export function wearSvg(topId, bottomId) {
  const t = byId[topId], b = byId[bottomId];
  const bo = b && b.id[0] === 'b' ? BOTTOM_DRAW[b.kind](b.c, b.a) : {};
  return { under: bo.under || '', top: t && t.id[0] === 't' ? TOP_DRAW[t.kind](t.c, t.a, t.m) : '', over: bo.over || '' };
}
