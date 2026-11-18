// 카피 농장 — 놀이터 왼쪽 '농장 가는 길' 팻말로 들어가는 따로 된 공간. 사람마다 밭 5칸(처음엔 1칸만 열림)
// 씨앗 심기 → 물 주기·잡초 뽑기(컨디션) → 다 자라면 수확(S·A·B·C·F). 상대 농장은 구경하고 물만 줄 수 있다
// 앱을 오래 꺼 둬도 괜찮게: 물은 자라는 시간의 절반 동안 버티고, 잡초는 한 번만 나고, 다 자란 뒤로는 컨디션이 줄지 않는다(3일 넘게 안 거두면 시든다)
import { h, toast, modal } from './ui.js';
import { capy } from './capy.js';
import { sfx } from './sound.js';

// 작물 30종: [id, 이름, 등급(농기구 단계), 자라는 분, 씨앗 값, 한 개 기본값]
const C = [
  ['lettuce', '상추', 1, 10, 30, 12], ['radish', '무', 1, 15, 40, 15], ['potato', '감자', 1, 20, 50, 18], ['carrot', '당근', 1, 20, 50, 18], ['spinach', '시금치', 1, 25, 60, 22],
  ['sweetpotato', '고구마', 1, 30, 70, 25], ['onion', '양파', 1, 30, 70, 25], ['cabbage', '배추', 1, 35, 80, 28], ['pea', '완두콩', 1, 40, 90, 32], ['tomato', '토마토', 1, 40, 90, 32],
  ['corn', '옥수수', 2, 60, 200, 70], ['cucumber', '오이', 2, 70, 220, 75], ['eggplant', '가지', 2, 80, 240, 80], ['chili', '고추', 2, 90, 260, 88], ['squash', '단호박', 2, 100, 280, 95],
  ['strawberry', '딸기', 2, 110, 300, 100], ['broccoli', '브로콜리', 2, 120, 320, 108], ['paprika', '파프리카', 2, 140, 340, 115], ['garlic', '마늘', 2, 160, 360, 122], ['scallion', '대파', 2, 180, 380, 130],
  ['watermelon', '수박', 3, 240, 800, 260], ['melon', '멜론', 3, 270, 850, 275], ['grape', '포도', 3, 300, 900, 290], ['pineapple', '파인애플', 3, 330, 950, 305], ['blueberry', '블루베리', 3, 360, 1000, 320],
  ['ginseng', '인삼', 3, 420, 1100, 350], ['matsutake', '송이버섯', 3, 480, 1200, 380], ['apple', '사과', 3, 520, 1250, 395], ['banana', '바나나', 3, 560, 1300, 410], ['yuzu', '황금유자', 3, 600, 1400, 440],
];
export const CROPS = C.map(([id, name, t, min, seed, base]) => ({ id, name, t, ms: min * 60000, seed, base }));
export const cropOf = id => CROPS.find(c => c.id === id);
export const cropImg = id => `img/farm/crop/${id}.webp`;
export const TOOLS = [null, { t: 1, name: '초급 농기구', price: 0, note: '호미·물뿌리개 · 처음부터 있어요' }, { t: 2, name: '중급 농기구', price: 1500, note: '쇠 호미·큰 물뿌리개 · 중급 작물을 심어요' }, { t: 3, name: '고급 농기구', price: 4000, note: '황금 낫·스프링클러 · 고급 작물을 심어요' }];
export const TIER_NAME = ['', '초급', '중급', '고급'];
export const DEEDS = [300, 700, 1400, 2000]; // 2~5번째 밭 땅 문서
export const PLOTS = 5, YIELD = 6, ROT_MS = 3 * 86400000;
export const GRADE_X = { S: 2, A: 1.5, B: 1.2, C: 1, F: 0 };
export const cropPrice = (id, g) => Math.round((cropOf(id) || { base: 0 }).base * (GRADE_X[g] || 0));

// 밭 한 칸의 컨디션 계산(순수 함수): 물이 마른 시간과 잡초가 자란 채로 둔 시간만큼 깎인다. 다 자란 뒤로는 셈하지 않는다
const WET = p => p.ms * 0.5;
export function settle(p, t) {
  const end = p.at + p.ms, to = Math.min(t, end), from = Math.min(p.calc || p.at, end); if (to <= from) return p;
  const dry = Math.max(0, to - Math.max(from, p.wet)), wd = p.weedAt && !p.cut ? Math.max(0, to - Math.max(from, p.weedAt)) : 0;
  return { ...p, dry: (p.dry || 0) + dry, wd: (p.wd || 0) + wd, calc: to };
}
export const scoreOf = (p, t) => { const q = settle(p, t), seen = Math.max(1, Math.min(t, p.at + p.ms) - p.at); return Math.max(0, 1 - 0.8 * (q.dry || 0) / seen - 0.4 * (q.wd || 0) / seen); }; // 한 번도 안 돌봐도 C급, 3일 넘게 안 거두면 F
export const ripe = (p, t) => p && p.c && t >= p.at + p.ms;
export const rotten = (p, t) => ripe(p, t) && t > p.at + p.ms + ROT_MS;
export const weedNow = (p, t) => p && p.weedAt && !p.cut && t >= p.weedAt && t < p.at + p.ms;
export const dryNow = (p, t) => p && p.c && t >= p.wet && t < p.at + p.ms;
export function gradeOf(p, t) { if (rotten(p, t)) return 'F'; const s = scoreOf(p, t); return s >= 0.85 ? (Math.random() < 0.3 ? 'S' : 'A') : s >= 0.6 ? 'B' : s >= 0.3 ? 'C' : 'F'; }
export function plant(id, t) { const c = cropOf(id); return { c: id, at: t, ms: c.ms, wet: t + c.ms * 0.5, calc: t, dry: 0, wd: 0, weedAt: t + c.ms * (0.35 + Math.random() * 0.3), cut: 0 }; }
export const water = (p, t) => { const q = settle(p, t); return { ...q, wet: t + WET(p) }; };
export const weed = (p, t) => { const q = settle(p, t); return { ...q, cut: t }; };
const left = ms => { const m = Math.ceil(ms / 60000); return m >= 60 ? `${Math.floor(m / 60)}시간 ${m % 60 ? (m % 60) + '분' : ''}`.trim() : `${m}분`; };

const BG_W = 1344, BG_H = 752;
const rc = (el, ...k) => el.replaceChildren(...k.flat().filter(x => x != null && x !== false && x !== '')); // false·빈칸은 건너뛰고 채운다
// openFarm: o = { ctx, coins, onClose } — o.coins(n)는 번 돈을 더한다
export function openFarm(o) {
  const { ctx } = o; let who = ctx.uid, data = {}, mine = {}, alive = true, sel = -1, raf = 0, off = null;
  const H = Math.max(280, Math.min(Math.round(innerHeight * 0.52), 520)), TW = Math.round(H * BG_W / BG_H);
  const PH = Math.round(H * 0.34), PW = Math.round(PH * 900 / 356), GAP = Math.round(PW * 0.08), X0 = Math.round(TW * 0.03);
  const plotX = k => X0 + k * (PW + GAP), HW = Math.round(H * 0.44), HX = plotX(PLOTS) + GAP, WIDTH = HX + Math.round(HW * 1.46) + Math.round(TW * 0.12);
  const now = () => ctx.store.now();
  const me = { x: plotX(0) + PW / 2, tx: plotX(0) + PW / 2 };
  const world = h('div', { class: 'fm-world', style: { width: WIDTH + 'px', height: H + 'px' } });
  for (let x = 0, k = 0; x < WIDTH; x += TW, k++) world.append(h('i', { class: 'fm-bg' + (k % 2 ? ' flip' : ''), style: { left: x + 'px', width: TW + 1 + 'px' } }));
  const plotEls = Array.from({ length: PLOTS }, (_, k) => { const e = h('button', { class: 'fm-plot', style: { left: plotX(k) + 'px', width: PW + 'px', height: PH + 'px' }, onClick: () => goPlot(k) }); world.append(e); return e; });
  const shop = h('button', { class: 'fm-shop', style: { left: HX + 'px', width: HW * 1.46 + 'px' }, onClick: () => { walkTo(HX + HW * 0.7, openShop); } }, h('img', { src: 'img/farm/hardware.webp', alt: '카피철물' }), h('b', { class: 'fm-shop-t' }, '카피철물'));
  const exitSign = h('button', { class: 'fm-exit', style: { left: WIDTH - Math.round(TW * 0.11) + 'px' }, onClick: () => close() }, '놀이터로 →');
  const meEl = h('div', { class: 'fm-me', html: capy(ctx.capyOf(ctx.uid, { face: 'happy' })) });
  world.append(shop, exitSign, meEl);
  const scroller = h('div', { class: 'fm-scroll' }, world);
  const title = h('b'), coinsEl = h('span', { class: 'fm-coins' }), visitBtn = h('button', { class: 'btn sm' }), barnBtn = h('button', { class: 'btn sm', onClick: () => openBarn() }, '🧺 헛간');
  const sheet = h('div', { class: 'fm-sheet' });
  const wrap = h('div', { class: 'fm' }, h('div', { class: 'fm-top' }, h('button', { class: 'btn sm', onClick: () => close() }, '✕'), title, coinsEl, barnBtn, visitBtn), scroller, sheet);
  document.body.append(wrap);

  const plotOf = k => (data.plots || {})[k] || null, isOpen = k => k < (data.open || 1), tool = () => mine.tool || 1;
  const myRef = () => 'farm/' + ctx.uid, curRef = () => 'farm/' + who;
  const save = patch => ctx.store.update(myRef(), patch).catch(() => {});
  const savePlot = (k, p) => ctx.store.set(`${curRef()}/plots/${k}`, p).catch(() => {});

  function drawPlots() {
    const t = now();
    plotEls.forEach((e, k) => { const p = plotOf(k), open = isOpen(k);
      e.className = 'fm-plot' + (sel === k ? ' on' : '');
      const st = !open ? 'locked' : !p || !p.c ? 'empty' : ripe(p, t) ? 'ripe' : 'sprout';
      e.dataset.st = st; e.dataset.dry = dryNow(p, t) ? 1 : 0; e.dataset.rot = rotten(p, t) ? 1 : 0;
      const kids = [h('img', { class: 'fm-pimg', src: `img/farm/plot-${st === 'ripe' ? 'empty' : st}.webp`, alt: '' })];
      if (st === 'ripe') { const c = cropOf(p.c); kids.push(h('div', { class: 'fm-crops' }, ...Array.from({ length: 3 * 7 }, () => h('img', { src: cropImg(c.id), alt: '' })))); }
      if (open && weedNow(p, t)) kids.push(h('img', { class: 'fm-weed', src: 'img/farm/weed.webp', alt: '잡초' }), h('img', { class: 'fm-weed w2', src: 'img/farm/weed.webp', alt: '' }));
      const lab = !open ? `🔒 땅 문서 ${DEEDS[k - 1].toLocaleString('ko-KR')}코인` : !p || !p.c ? (who === ctx.uid ? '빈 밭 · 눌러서 씨앗 심기' : '빈 밭') : ripe(p, t) ? (rotten(p, t) ? `${cropOf(p.c).name} · 시들었어요` : `${cropOf(p.c).name} · 수확!`) : `${cropOf(p.c).name} · ${left(p.at + p.ms - t)}`;
      kids.push(h('span', { class: 'fm-lab' + (st === 'ripe' ? ' ripe' : '') }, lab));
      if (open && p && p.c && !ripe(p, t)) kids.push(h('span', { class: 'fm-bub' }, [dryNow(p, t) && '💧', weedNow(p, t) && '🌿'].filter(Boolean).join('')));
      rc(e, kids); });
    coinsEl.textContent = '🪙 ' + ctx.coins().toLocaleString('ko-KR');
    const pn = ctx.nameOf(ctx.partnerId);
    title.textContent = who === ctx.uid ? '🌱 카피 농장' : `🌱 ${pn}네 농장 (구경)`;
    visitBtn.hidden = !ctx.partnerId; visitBtn.textContent = who === ctx.uid ? `${pn}네 농장` : '내 농장';
    visitBtn.onclick = () => { who = who === ctx.uid ? ctx.partnerId : ctx.uid; sel = -1; listen(); };
    barnBtn.hidden = who !== ctx.uid;
    drawSheet();
  }
  function listen() { if (off) off(); off = ctx.store.on(curRef(), v => { data = v || {}; if (who === ctx.uid) mine = data; drawPlots(); }); }
  const offMine = ctx.store.on(myRef(), v => { mine = v || {}; if (who === ctx.uid) { data = mine; drawPlots(); } }); // 내 농기구·씨앗·헛간은 상대 농장 구경 중에도 알아야 한다

  function walkTo(x, then) { me.tx = Math.max(30, Math.min(WIDTH - 30, x)); me.then = then; meEl.classList.add('walk'); meEl.classList.toggle('left', me.tx < me.x); }
  function goPlot(k) { walkTo(plotX(k) + PW / 2, () => { sel = k; drawSheet(); drawPlots(); }); }

  // 밭 아래 창: 밭 상태와 할 수 있는 일
  function drawSheet() {
    const k = sel, p = plotOf(k), t = now(), visit = who !== ctx.uid;
    if (k < 0) { // 아무 밭도 안 골랐을 때: 한눈에 보기
      const L = Array.from({ length: PLOTS }, (_, i) => { const q = plotOf(i); return !isOpen(i) ? '🔒' : !q || !q.c ? '빈 밭' : ripe(q, t) ? `${cropOf(q.c).name} 수확!` : `${cropOf(q.c).name} ${left(q.at + q.ms - t)}${dryNow(q, t) ? ' 💧' : ''}${weedNow(q, t) ? ' 🌿' : ''}`; });
      const seeds = Object.values(mine.seeds || {}).reduce((a, n) => a + (n || 0), 0), barn = Object.values(mine.barn || {}).reduce((a, n) => a + (n || 0), 0);
      rc(sheet, h('b', null, visit ? `${ctx.nameOf(who)}네 밭` : '내 밭'), h('div', { class: 'fm-list' }, ...L.map((x, i) => h('button', { class: 'fm-li', onClick: () => goPlot(i) }, h('span', null, `${i + 1}번`), h('b', null, x)))),
        visit ? h('p', { class: 'dim fm-tip' }, `구경 중이에요. 물이 마른 밭(💧)에 물을 주고 올 수 있어요.`) : h('p', { class: 'dim fm-tip' }, `씨앗 ${seeds}개 · 헛간 ${barn}개 · ${TOOLS[tool()].name} · 밭을 누르면 심기·물 주기·잡초 베기·수확을 해요. 씨앗과 농기구·땅 문서는 오른쪽 끝 카피철물에서 사요.`),
        !visit && h('div', { class: 'fm-row' }, h('button', { class: 'btn', onClick: () => walkTo(HX + HW * 0.7, openShop) }, '🔨 카피철물 가기'), h('button', { class: 'btn', onClick: () => openBarn() }, '🧺 헛간 보기')));
      return; }
    const row = (...x) => h('div', { class: 'fm-row' }, ...x), closeB = h('button', { class: 'btn sm fm-x', onClick: () => { sel = -1; drawPlots(); } }, '닫기');
    if (!isOpen(k)) { rc(sheet, closeB, h('b', null, `🔒 ${k + 1}번 밭`), h('p', { class: 'dim' }, visit ? '아직 열지 않은 밭이에요.' : `카피철물에서 땅 문서(${DEEDS[k - 1].toLocaleString('ko-KR')}코인)를 사면 열려요. 밭은 순서대로 열어요.`), !visit && row(h('button', { class: 'btn primary', onClick: () => walkTo(HX + HW * 0.7, () => openShop('deed')) }, '카피철물 가기'))); return; }
    if (!p || !p.c) { if (visit) { rc(sheet, closeB, h('b', null, `${k + 1}번 밭 · 비어 있어요`)); return; }
      const have = CROPS.filter(c => ((mine.seeds || {})[c.id] || 0) > 0);
      rc(sheet, closeB, h('b', null, `${k + 1}번 밭 · 씨앗 심기`), have.length ? h('div', { class: 'fm-seeds' }, ...have.map(c => { const can = c.t <= tool();
        return h('button', { class: 'fm-seed' + (can ? '' : ' off'), onClick: () => can ? doPlant(k, c) : toast(`${TIER_NAME[c.t]} 작물은 ${TOOLS[c.t].name}가 있어야 심어요`) }, h('img', { src: cropImg(c.id), alt: '' }), h('small', null, `${c.name} ×${mine.seeds[c.id]}`), h('em', null, left(c.ms))); }))
        : h('p', { class: 'dim' }, '가진 씨앗이 없어요. 카피철물에서 씨앗을 사 오세요.'), !have.length && row(h('button', { class: 'btn primary', onClick: () => walkTo(HX + HW * 0.7, () => openShop('seed')) }, '카피철물 가기'))); return; }
    const c = cropOf(p.c), s = scoreOf(p, t), done = ripe(p, t), wetLeft = Math.max(0, p.wet - t), wetP = Math.min(1, wetLeft / (p.ms * 0.5));
    const gauge = (label, v, cls) => h('div', { class: 'fm-g ' + cls }, h('span', null, label), h('i', null, h('u', { style: { width: Math.round(v * 100) + '%' } })), h('small', null, Math.round(v * 100) + '%'));
    const grow = Math.min(1, (t - p.at) / p.ms);
    const acts = [];
    if (done) { if (!visit) acts.push(h('button', { class: 'btn primary', onClick: () => doHarvest(k) }, rotten(p, t) ? '🗑️ 치우기 (시들었어요)' : `🧺 수확하기 (${YIELD}개)`)); }
    else {
      acts.push(h('button', { class: 'btn' + (dryNow(p, t) ? ' primary' : ''), onClick: () => doWater(k) }, h('img', { class: 'fm-ic', src: 'img/farm/can.webp', alt: '' }), visit ? '물 주고 오기' : '물 주기'));
      if (!visit && weedNow(p, t)) acts.push(h('button', { class: 'btn primary', onClick: () => doWeed(k) }, h('img', { class: 'fm-ic', src: 'img/farm/sickle.webp', alt: '' }), '잡초 베기'));
    }
    rc(sheet, closeB, h('div', { class: 'fm-head' }, h('img', { src: cropImg(c.id), alt: '' }), h('div', null, h('b', null, `${k + 1}번 밭 · ${c.name}`), h('small', null, done ? (rotten(p, t) ? '수확할 때를 놓쳐서 시들었어요 (F)' : `다 자랐어요! ${left(p.at + p.ms + ROT_MS - t)} 안에 거두면 돼요`) : `다 자라기까지 ${left(p.at + p.ms - t)}`))),
      gauge('🌱 자람', grow, 'grow'), gauge('💪 컨디션', s, s >= 0.85 ? 'good' : s >= 0.6 ? 'ok' : 'bad'), !done && gauge('💧 물', wetP, 'water'),
      h('p', { class: 'dim fm-tip' }, done ? '컨디션 85% 이상이면 A급(가끔 S급), 60% 이상 B급, 그 아래는 C급이에요. 다 자란 뒤 3일 넘게 안 거두면 시들어 F(폐기)예요.' : `물은 한 번 주면 ${left(p.ms * 0.5)} 버텨요. ${weedNow(p, t) ? (visit ? '잡초가 났어요. 잡초는 밭 주인만 벨 수 있어요.' : '잡초가 났어요! 베어 주세요.') : p.cut ? '잡초는 베었어요.' : '자라는 동안 잡초가 한 번 나요.'} 컨디션이 높을수록 좋은 등급이 나와요.`),
      row(...acts));
  }
  async function doPlant(k, c) { const t = now(), n = (mine.seeds || {})[c.id] || 0; if (n <= 0) return; sfx('pop');
    await ctx.store.update(myRef(), { [`seeds/${c.id}`]: n - 1 >= 1 ? n - 1 : null, [`plots/${k}`]: plant(c.id, t) }).catch(() => {}); toast(`${c.name}을(를) 심었어요. 물도 줬어요 💧`, 1800); }
  async function doWater(k) { const p = plotOf(k); if (!p) return; sfx('splash'); const q = water(p, now()); await savePlot(k, q);
    if (who !== ctx.uid) { ctx.store.set(`farm/${who}/note`, { by: ctx.uid, at: now(), k }).catch(() => {}); toast(`${ctx.nameOf(who)}네 ${cropOf(p.c).name}에 물을 줬어요 💧`, 2000); } else toast('물을 줬어요 💧', 1200); }
  async function doWeed(k) { const p = plotOf(k); if (!p) return; sfx('tock'); await savePlot(k, weed(p, now())); toast('잡초를 베었어요 🌿', 1200); }
  async function doHarvest(k) { const p = plotOf(k), t = now(); if (!p || !ripe(p, t)) return; const g = gradeOf(p, t), c = cropOf(p.c), n = p.lost ? YIELD - Math.round(YIELD / 3) : YIELD;
    const patch = { [`plots/${k}`]: null }; if (g !== 'F') patch[`barn/${c.id}|${g}`] = ((mine.barn || {})[`${c.id}|${g}`] || 0) + n;
    await ctx.store.update(myRef(), patch).catch(() => {}); sfx(g === 'S' ? 'bigfish' : g === 'F' ? 'bad' : 'coin');
    sel = -1; drawPlots();
    modal({ title: g === 'F' ? '시들어 버렸어요…' : `${c.name} ${n}개 수확!`, body: [h('div', { class: 'fm-harv g' + g }, h('img', { src: cropImg(c.id), alt: '' }), h('b', { class: 'fm-gr g' + g }, g === 'F' ? 'F' : g + '급')),
      h('p', { class: 'center' }, g === 'F' ? '다 자란 뒤 3일 넘게 거두지 않아 시들었어요. 이번 작물은 버려야 해요.' : `헛간에 담았어요. 하나에 ${cropPrice(c.id, g).toLocaleString('ko-KR')}코인 · 카피수퍼에서 팔 수 있어요.`)], actions: [{ label: '확인', primary: true }] }); }

  // 헛간: 거둔 작물
  function openBarn() { const L = Object.entries(mine.barn || {}).filter(([, n]) => n > 0).sort();
    modal({ title: '🧺 헛간', body: [L.length ? h('div', { class: 'fm-barn' }, ...L.map(([key, n]) => { const [id, g] = key.split('|'), c = cropOf(id); return h('div', { class: 'fm-bi' }, h('img', { src: cropImg(id), alt: '' }), h('b', null, `${c ? c.name : id} ×${n}`), h('span', { class: 'fm-gr g' + g }, g)); }))
      : h('p', { class: 'dim center' }, '아직 거둔 작물이 없어요.'), h('p', { class: 'dim center' }, '작물은 카피수퍼에서 팔 수 있어요. 나중에 요리·퀘스트 재료로도 써요.')], actions: [{ label: '닫기', primary: true }] }); }

  // 카피철물: 씨앗 · 농기구 · 땅 문서
  function openShop(tab = 'seed') {
    if (who !== ctx.uid) { who = ctx.uid; listen(); }
    const body = h('div', { class: 'fm-mart' }), tabs = h('div', { class: 'so-tabs' });
    const buy = async (price, patch, msg) => { if (price > 0 && !(await ctx.spend(price))) { toast(`돈이 모자라요 (${price.toLocaleString('ko-KR')}코인 필요)`); return; } await save(patch); sfx('coin'); toast(msg, 1800); draw(); };
    function draw() {
      rc(tabs, [['seed', '🌱 씨앗'], ['tool', '🧰 농기구'], ['deed', '📜 땅 문서']].map(([k, t]) => h('button', { class: 'chip' + (tab === k ? ' on' : ''), onClick: () => { tab = k; draw(); } }, t)));
      const rows = [h('p', { class: 'center' }, '내 돈 ', h('b', null, ctx.coins().toLocaleString('ko-KR') + '코인'))];
      if (tab === 'seed') [1, 2, 3].forEach(tr => { rows.push(h('b', { class: 'so-sellh' }, `${TIER_NAME[tr]} 작물${tr > tool() ? ` · ${TOOLS[tr].name} 필요` : ''}`));
        rows.push(h('div', { class: 'fm-sgrid' }, ...CROPS.filter(c => c.t === tr).map(c => { const lock = c.t > tool(), n = (mine.seeds || {})[c.id] || 0;
          return h('button', { class: 'fm-sbuy' + (lock ? ' off' : ''), onClick: () => lock ? toast(`${TOOLS[c.t].name}를 먼저 사야 해요`) : buy(c.seed, { [`seeds/${c.id}`]: n + 1 }, `${c.name} 씨앗을 샀어요 (가진 것 ${n + 1})`) },
            h('img', { src: cropImg(c.id), alt: '' }), h('b', null, c.name), h('small', null, `${c.seed.toLocaleString('ko-KR')}코인 · ${left(c.ms)}`), h('small', null, `하나 ${c.base}~${c.base * 2}코인${n ? ` · 가진 씨앗 ${n}` : ''}`)); }))); });
      if (tab === 'tool') TOOLS.slice(1).forEach(tl => { const have = tool() >= tl.t;
        rows.push(h('button', { class: 'so-row big' + (have ? ' off' : '') , onClick: () => have ? toast('이미 가지고 있어요') : tl.t > tool() + 1 ? toast(`${TOOLS[tl.t - 1].name}부터 사야 해요`) : buy(tl.price, { tool: tl.t }, `${tl.name}를 샀어요! ${TIER_NAME[tl.t]} 작물을 심을 수 있어요`) },
          h('span', { class: 'so-rodic' }, h('img', { src: tl.t === 3 ? 'img/farm/sickle.webp' : tl.t === 2 ? 'img/farm/can.webp' : 'img/farm/hoe.webp', alt: '', style: { width: '40px' } })), h('b', null, tl.name), h('small', null, have ? '가지고 있어요 · 한 번 사면 계속 써요' : `${tl.price.toLocaleString('ko-KR')}코인 · ${tl.note}`))); });
      if (tab === 'deed') { const n = data.open || 1; rows.push(h('p', { class: 'dim center' }, `지금 열린 밭 ${n} / ${PLOTS}칸 · 밭은 순서대로 열려요`));
        DEEDS.forEach((pr, i) => { const k = i + 1, have = n > k, next = n === k;
          rows.push(h('button', { class: 'so-row big' + (have || !next ? ' off' : ''), onClick: () => have ? toast('이미 연 밭이에요') : !next ? toast('앞의 밭부터 열어야 해요') : buy(pr, { open: k + 1 }, `${k + 1}번 밭이 열렸어요! 🌱`) },
            h('span', null, '📜'), h('b', null, `${k + 1}번 밭 땅 문서`), h('small', null, have ? '열었어요' : `${pr.toLocaleString('ko-KR')}코인`))); }); }
      rc(body, tabs, rows); }
    draw(); modal({ title: '🔨 카피철물', body: [body], actions: [{ label: '나가기', primary: true }] }); }

  // 화면: 내 카피바라가 걸어가고, 1초마다 밭 시간 표시를 고친다
  let lastT = performance.now(), tick = 0;
  function step(t) { if (!alive) return; const dt = Math.min(0.05, (t - lastT) / 1000); lastT = t;
    const d = me.tx - me.x; if (Math.abs(d) > 2) me.x += Math.sign(d) * Math.min(Math.abs(d), Math.max(320, Math.abs(d) * 2.2) * dt); else if (me.then) { const f = me.then; me.then = null; meEl.classList.remove('walk'); f(); } else meEl.classList.remove('walk');
    meEl.style.left = me.x + 'px';
    const want = me.x - scroller.clientWidth / 2; if (Math.abs(scroller.scrollLeft - want) > 4 && meEl.classList.contains('walk')) scroller.scrollLeft += (want - scroller.scrollLeft) * Math.min(1, dt * 6);
    if ((tick += dt) > 1) { tick = 0; drawPlots(); }
    raf = requestAnimationFrame(step); }
  function close() { if (!alive) return; alive = false; cancelAnimationFrame(raf); if (off) off(); offMine(); wrap.remove(); o.onClose && o.onClose(); }
  listen(); raf = requestAnimationFrame(step); scroller.scrollLeft = 0;
  // 상대가 내 밭에 물을 주고 갔으면 알려 준다
  ctx.store.get ? ctx.store.get('farm/' + ctx.uid + '/note').then(v => { if (v && v.by && v.by !== ctx.uid && v.at > ((mine.noteSeen) || 0)) { toast(`${ctx.nameOf(v.by)}가 내 밭에 물을 주고 갔어요 💧`, 2600); save({ noteSeen: v.at }); } }).catch(() => {}) : 0;
  return { close };
}
