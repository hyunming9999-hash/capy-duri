// 카피요리교실 — 카피수퍼 옆. 동물들이 주문한 요리는 여기서만 만든다
// 하루 주문 3개(동물·요리·익힘 취향) → 재료 고르기(생선은 손질된 살) → 냄비에 넣고 끓이기/찌기 → 원하는 익힘에서 불 끄기
import { h, toast, modal, ymd } from './ui.js';
import { sfx } from './sound.js';

export const DISHES = {
  fish: { name: '생선찜', img: 'img/cook/fishdish.webp', need: '물고기 1마리', base: 140, ms: 9000 },
  soup: { name: '채소 수프', img: 'img/cook/soup.webp', need: '작물 아무거나 2개', base: 90, ms: 7500 },
  steam: { name: '감자옥수수찜', img: 'img/cook/steam.webp', need: '감자·고구마·옥수수 중 2개', base: 110, ms: 8000 },
};
// 익힘: 냄비 게이지 0~100. 덜 익힘 30~50 · 알맞게 50~70 · 푹 익힘 70~88. 30 아래는 날것, 88 넘으면 탐
export const DONE = [{ k: 'rare', n: '덜 익혀서', lo: 30, hi: 50, c: '#F2B84B' }, { k: 'mid', n: '알맞게', lo: 50, hi: 70, c: '#6CC04A' }, { k: 'well', n: '푹 익혀서', lo: 70, hi: 88, c: '#D9822B' }];
const doneAt = v => (v < 30 ? 'raw' : v > 88 ? 'burnt' : DONE.find(d => v >= d.lo && v < d.hi).k);
const SOUP_OK = () => true, STEAM_OK = id => ['potato', 'sweetpotato', 'corn'].includes(id);
const GRADE_ADD = { S: 1, A: 0.6, B: 0.35, C: 0.15, D: 0, F: 0 };
// 날마다 같은 주문이 나오게(그날·사람마다 고정)
const rnd = seed => () => { seed = (seed * 9301 + 49297) % 233280; return seed / 233280; };
const hash = s => [...s].reduce((a, c) => (a * 31 + c.charCodeAt(0)) % 2147483647, 7);

// 생선은 머리 없이 손질된 살로만 보여 준다. 이름 속 낱말로 곁들임 소품을 고른다
const FIL_KEY = [['흑진주','bpearl'],['흑요석','bpearl'],['심해등불','firefly'],['심해등대','firefly'],['반딧불','firefly'],['비눗방울','drop'],['물방울','drop'],['은방울','pearl'],['방울','drop'],['민트','mint'],['붕어빵','bungeo'],['호박엿','caramel'],['청동','metal'],['흑철갑','metal'],['성게','acorn'],['불가사리','shell'],['망치','hammer'],['얼음','ice'],['빙하','ice'],['쇄빙','ice'],['서리','ice'],['유리','ice'],
  ['젤리','jelly'],['무지개','jelly'],['오로라','jelly'],['해파리','jelly'],['솜사탕','cotton'],['솜방망이','cotton'],['구름','cotton'],['마시멜로','ghost'],['몽글','ghost'],['유령','ghost'],['해골','ghost'],['가면','ghost'],['별','star'],['은하','star'],['유성','star'],
  ['딸기','c:strawberry'],['콩','c:pea'],['유자','c:yuzu'],['감귤','c:yuzu'],['포도','c:grape'],['보라','c:grape'],['토끼귀','c:carrot'],['호박','c:squash'],['노을','c:chili'],['석양','c:chili'],['불꽃','c:chili'],['화산','c:chili'],['용암','c:chili'],['마그마','c:chili'],['열수구','c:chili'],
  ['달','moon'],['초승달','moon'],['그믐','moon'],['월식','moon'],['밤하늘','moon'],['새벽','moon'],['호두','walnut'],['레몬','lemon'],['노랑','lemon'],['단추','button'],['얼룩','button'],['솜털','feather'],['깃털','feather'],['깨소금','cookie'],['쿠키','cookie'],['풍선','balloon'],['하늘','balloon'],
  ['조약돌','pebble'],['모래','pebble'],['진흙','pebble'],['바위','pebble'],['꿀벌','honey'],['도토리','acorn'],['밤송이','acorn'],['우유','milk'],['초코','choco'],['마카롱','macaron'],['푸딩','pudding'],['카라멜','caramel'],['체리','cherry'],['팝콘','popcorn'],['바닐라','vanilla'],
  ['구슬','pearl'],['진주','pearl'],['리본','ribbon'],['줄무늬','ribbon'],['비단','ribbon'],['꽃잎','petal'],['꽃무늬','petal'],['나비','petal'],['보리차','tea'],['청자','tea'],['솔잎','pine'],['솔방울','pine'],['가시','pine'],['천년','pine'],['방긋','sunflower'],['해바라기','sunflower'],
  ['조개','shell'],['자개','shell'],['꽃게','shell'],['산호','coral'],['바람','pinwheel'],['회오리','pinwheel'],['소용돌이','pinwheel'],['폭풍','pinwheel'],['대나무','bamboo'],['갈대','bamboo'],['파도','seaweed'],['해초','seaweed'],['해마','seaweed'],['산갈치','seaweed'],['안개','drop'],['물보라','drop'],['거품','drop'],
  ['나팔','flute'],['피리','flute'],['북소리','drum'],['장구','drum'],['번개','bolt'],['천둥','bolt'],['황금','coin'],['수정','gem'],['크리스탈','gem'],['비늘','gem'],['단풍','maple'],['은행잎','ginkgo'],['강철','metal'],['무쇠','metal'],['톱날','metal'],['창날','metal'],['도끼','hammer'],
  ['그림자','ink'],['먹물','ink'],['먹구름','ink'],['심해','ink'],['왕관','crown'],['왕','crown'],['킹','crown'],['고래','shell']];
const FIL_ANY = ['lemon', 'mint', 'seaweed', 'shell'];
const RED = ['참치', '연어', '방어', '삼치', '고등어', '청새치', '황새치', '돛새치'];
export const isRed = f => RED.some(k => f.name.includes(k)) && !f.name.includes('참돔');
export function garnishOf(f) { const hit = FIL_KEY.find(([k]) => f.name.includes(k)); const g = hit ? hit[1] : FIL_ANY[[...f.name].reduce((a, c) => a + c.charCodeAt(0), 0) % FIL_ANY.length];
  return g.startsWith('c:') ? `img/farm/crop/${g.slice(2)}.webp` : `img/cook/g/${g}.webp`; }
export const filName = f => `${f.name}의 ${isRed(f) ? '붉은살' : '흰살'}생선`;
export const filGlow = (f, v) => !!(f.rare || f.king || (f.tier || 1) >= 3 || (v && (v.g === 'A' || v.g === 'S')));
export function filletEl(f, v, big) { return h('div', { class: 'ck-fil' + (big ? ' big' : '') + (filGlow(f, v) ? ' glow' : '') }, h('img', { class: 'ck-plate', src: `img/cook/fillet-${isRed(f) ? 'red' : 'white'}.webp`, alt: '' }), h('img', { class: 'ck-gar', src: garnishOf(f), alt: '' })); }

// o = { ctx, animals:[{i,name,svg}], A(i), affinity(i, d), toned(i, t), fish: () => [[key, v, f]], useFish(key), coins(n), cropName(id), cropImg(id), fishSvg(f, big), onClose }
export function openCook(o) {
  const { ctx } = o, day = ymd(), ref = `cook/${ctx.uid}/${day}`; let st = {}, alive = true, raf = 0, order = null, pick = [], phase = 'orders', heat = 0, t0 = 0, cut = false;
  const R = rnd(hash(ctx.uid + day)), pool = o.animals.filter(a => o.A(a.i) >= 0);
  const orders = Array.from({ length: 3 }, (_, k) => { const a = pool.length ? pool[Math.floor(R() * pool.length)] : o.animals[k], dish = ['fish', 'soup', 'steam'][Math.floor(R() * 3)], pref = DONE[Math.floor(R() * 3)].k; return { k, a, dish, pref }; });
  const coinsEl = h('span', { class: 'ck-coins' }), stage = h('div', { class: 'ck-stage' }), panel = h('div', { class: 'ck-panel' });
  const wrap = h('div', { class: 'ck' }, h('div', { class: 'ck-top' }, h('button', { class: 'btn sm', onClick: () => close() }, '✕'), h('b', null, '👩‍🍳 카피요리교실'), coinsEl), stage, panel);
  document.body.append(wrap);
  const off = ctx.store.on(ref, v => { st = v || {}; if (phase === 'orders') draw(); });
  const prefOf = k => DONE.find(d => d.k === k);
  const fishList = () => o.fish().filter(([, v, f]) => f && !f.pearl && !f.icon);
  const barn = () => Object.entries(o.barn() || {}).filter(([, n]) => n > 0).map(([key, n]) => { const [id, g] = key.split('|'); return { key, id, g, n }; });

  function draw() {
    coinsEl.textContent = '🪙 ' + ctx.coins().toLocaleString('ko-KR');
    // 무대: 주방 그림 위에 도마·화구·냄비
    const potCls = 'ck-pot' + (phase === 'cook' ? ' boil' : '');
    stage.replaceChildren(...[h('img', { class: 'ck-bg', src: 'img/cook/kitchen.webp', alt: '' }),
      h('div', { class: 'ck-board' }, h('img', { src: 'img/cook/board.webp', alt: '' }), order && order.dish === 'fish' && pick[0] ? h('div', { class: 'ck-fish' }, filletEl(pick[0][2], pick[0][1], true)) : null),
      h('div', { class: potCls }, h('img', { class: 'ck-potimg', src: 'img/cook/pot.webp', alt: '' }), phase === 'cook' && h('img', { class: 'ck-lid', src: 'img/cook/lid.webp', alt: '' }), phase === 'cook' && h('i', { class: 'ck-steam' }, '♨️'), h('img', { class: 'ck-fire', src: 'img/cook/stove.webp', alt: '' }))].filter(Boolean));
    if (phase === 'orders') return drawOrders();
    if (phase === 'prep') return drawPrep();
  }
  function drawOrders() {
    const done = st.done || {};
    panel.replaceChildren(h('b', { class: 'ck-h' }, '📋 오늘의 주문'), ...orders.map(od => { const d = DISHES[od.dish], p = prefOf(od.pref), fin = done[od.k];
      return h('button', { class: 'ck-order' + (fin ? ' done' : ''), onClick: () => fin ? toast('이미 만들어 준 주문이에요') : start(od) }, h('span', { class: 'ck-an', html: od.a.svg }),
        h('div', null, h('b', null, `${od.a.name} · ${d.name}`), h('small', null, fin ? (fin === 'ok' ? '완성! 맛있게 먹었어요 😋' : '만들어 줬어요') : `"${o.toned(od.a.i, `${d.name} ${p.n} 부탁해!`)}"`), !fin && h('em', null, `재료: ${d.need}`)),
        h('img', { src: d.img, alt: '' })); }),
      h('p', { class: 'dim ck-tip' }, '주문은 하루에 3개, 날마다 바뀌어요. 원하는 익힘에 딱 맞추면 돈과 친밀도를 더 받아요. 생선은 낚시로 잡은 물고기, 채소는 농장에서 거둔 작물을 써요.'));
  }
  function start(od) { order = od; pick = []; cut = false; phase = 'prep'; draw(); }
  function drawPrep() {
    const d = DISHES[order.dish], p = prefOf(order.pref), kids = [h('b', { class: 'ck-h' }, `${order.a.name}의 주문 · ${d.name} (${p.n})`)];
    if (order.dish === 'fish') {
      const L = fishList();
      if (!pick[0]) { kids.push(h('p', { class: 'dim' }, '낚시로 잡은 물고기는 손질된 살로 나와요. 하나를 골라요. 등급이 좋을수록 보상이 커요.'), L.length ? h('div', { class: 'ck-ings' }, ...L.map(x => { const [key, v, f] = x; return h('button', { class: 'ck-ing', onClick: () => { pick = [x]; draw(); } }, filletEl(f, v), h('small', null, `${filName(f)}${v.g ? ' ' + v.g + '급' : ''}`)); })) : h('p', { class: 'dim' }, '가방에 물고기가 없어요. 낚시로 잡아 오세요.')); }
      else kids.push(h('p', null, `${filName(pick[0][2])}을 도마에 올렸어요. 냄비에 넣고 뚜껑을 덮어 쪄요.`), h('div', { class: 'ck-row' }, h('button', { class: 'btn', onClick: () => { pick = []; draw(); } }, '다른 생선'), h('button', { class: 'btn primary', onClick: cook }, '🍲 냄비에 넣고 불 켜기')));
    } else {
      const ok = order.dish === 'soup' ? SOUP_OK : STEAM_OK, L = barn().filter(b => ok(b.id)), n = id => pick.filter(x => x.key === id).length;
      kids.push(h('p', { class: 'dim' }, `헛간 작물 2개를 골라요 (${pick.length}/2).`), L.length ? h('div', { class: 'ck-ings' }, ...L.map(b => h('button', { class: 'ck-ing' + (n(b.key) ? ' on' : ''), onClick: () => { if (n(b.key)) pick = pick.filter(x => x.key !== b.key); else if (pick.length < 2) pick = [...pick, b]; else if (b.n >= 2 && n(b.key) < 2) pick = [...pick.slice(1), b]; draw(); } }, h('img', { src: o.cropImg(b.id), alt: '' }), h('small', null, `${o.cropName(b.id)} ${b.g}급 ×${b.n}`))))
        : h('p', { class: 'dim' }, order.dish === 'soup' ? '헛간에 작물이 없어요. 농장에서 거둬 오세요.' : '감자·고구마·옥수수가 없어요. 농장에서 길러 오세요.'),
        h('div', { class: 'ck-row' }, h('button', { class: 'btn', onClick: () => { phase = 'orders'; order = null; draw(); } }, '← 주문 목록'), h('button', { class: 'btn primary', disabled: pick.length < 2, onClick: cook }, '🍲 냄비에 넣고 불 켜기')));
    }
    if (order.dish === 'fish' && !pick[0]) kids.push(h('div', { class: 'ck-row' }, h('button', { class: 'btn', onClick: () => { phase = 'orders'; order = null; draw(); } }, '← 주문 목록')));
    panel.replaceChildren(...kids.filter(Boolean));
  }
  // 끓이기: 게이지가 올라가다가 '불 끄기'로 멈춘다. 원하는 익힘 칸에 맞추기
  function cook() { phase = 'cook'; heat = 0; t0 = performance.now(); sfx('splash'); draw();
    const p = prefOf(order.pref), bar = h('div', { class: 'ck-gauge' }, h('i', { class: 'z raw' }), ...DONE.map(d => h('i', { class: 'z', style: { left: d.lo + '%', width: d.hi - d.lo + '%', background: d.c + (d.k === order.pref ? '' : '66') } }, d.k === order.pref ? '★' : '')), h('i', { class: 'z burnt' }), h('b', { class: 'ck-needle' }));
    panel.replaceChildren(h('b', { class: 'ck-h' }, `${p.n}! ★ 칸에서 불을 끄세요`), bar, h('p', { class: 'dim ck-tip' }, '왼쪽부터 날것 · 덜 익힘 · 알맞게 · 푹 익힘 · 탐'), h('button', { class: 'btn primary ck-off', onClick: stop }, '🔥 불 끄기'));
    const needle = bar.querySelector('.ck-needle'), ms = DISHES[order.dish].ms;
    const loop = t => { if (!alive || phase !== 'cook') return; const u = (t - t0) / ms; heat = Math.min(100, u * 100 * (1 + 0.25 * Math.sin(u * 7))); needle.style.left = heat + '%'; if (heat >= 100) return stop(); raf = requestAnimationFrame(loop); };
    raf = requestAnimationFrame(loop); }
  async function stop() { if (phase !== 'cook') return; phase = 'serve'; cancelAnimationFrame(raf); const at = doneAt(heat), d = DISHES[order.dish], a = order.a, p = prefOf(order.pref);
    // 재료는 불을 끄는 순간 쓴 것으로 친다
    let g = 0;
    if (order.dish === 'fish') { const [key, v] = pick[0]; o.useFish(key); g = GRADE_ADD[v.g] || 0; }
    else { const use = {}; pick.forEach(b => { use[b.key] = (use[b.key] || 0) + 1; g += (GRADE_ADD[b.g] || 0) / 2; }); await o.useCrops(use); }
    const hit = at === order.pref, ok = at !== 'raw' && at !== 'burnt';
    const coins = hit ? Math.round(d.base * (1 + g)) : ok ? Math.round(d.base * 0.5) : 0, aff = hit ? 6 + Math.round(g * 4) : ok ? 2 : 0;
    if (coins) o.coins(coins); if (aff) o.affinity(a.i, aff);
    await ctx.store.update(ref, { [`done/${order.k}`]: hit ? 'ok' : ok ? 'meh' : 'bad' }).catch(() => {});
    sfx(hit ? 'bigfish' : ok ? 'coin' : 'bad');
    const say = hit ? `와! 딱 ${p.n} 만든 ${d.name}이야. 최고야!` : at === 'raw' ? '으앗, 아직 날것이잖아…' : at === 'burnt' ? '콜록콜록… 다 타 버렸어…' : `음… 난 ${p.n} 먹고 싶었는데. 그래도 고마워.`;
    modal({ title: hit ? `${d.name} 완성! 🎉` : ok ? `${d.name} 완성` : '요리 실패…', body: [h('div', { class: 'ck-res' + (ok ? '' : ' bad') }, h('img', { src: d.img, alt: '' }), h('span', { class: 'ck-an', html: a.svg })),
      h('p', { class: 'center' }, h('b', null, `${a.name}: "${o.toned(a.i, say)}"`)),
      h('p', { class: 'center dim' }, coins ? `+${coins.toLocaleString('ko-KR')}코인 · 친밀도 +${aff}` : '재료만 쓰고 보상은 없어요.')], actions: [{ label: '확인', primary: true }] });
    phase = 'orders'; order = null; pick = []; cut = false; draw(); }
  function close() { if (!alive) return; alive = false; cancelAnimationFrame(raf); off(); wrap.remove(); o.onClose && o.onClose(); }
  draw();
  return { close };
}
