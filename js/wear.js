// 오늘 뭐 입지? — 전신 사진을 고정해 두고 옷 사진을 올려 맞춰 본 뒤 서로 평가
import { h, toast, modal, ask, pickImage, fileToCanvas, loadImg, jpeg, hm, josa } from './ui.js';
import { putBlob, getBlob, delBlob } from './store.js';
import { yuzuSvg } from './capy.js';

// 가장자리와 비슷한 색을 바깥에서부터 지워 나간다 (단색 배경용)
export function removeBg(src, tol) {
  const w = src.width, hh = src.height, out = h('canvas', { width: w, height: hh }), cx = out.getContext('2d', { willReadFrequently: true });
  cx.drawImage(src, 0, 0);
  if (tol <= 0) return out;
  const im = cx.getImageData(0, 0, w, hh), d = im.data, thr = (tol * 4.4) ** 2;
  let r = 0, g = 0, b = 0, n = 0;
  for (const [x0, y0] of [[0, 0], [w - 3, 0], [0, hh - 3], [w - 3, hh - 3]]) for (let y = y0; y < y0 + 3; y++) for (let x = x0; x < x0 + 3; x++) { const i = (y * w + x) * 4; r += d[i]; g += d[i + 1]; b += d[i + 2]; n++; }
  r /= n; g /= n; b /= n;
  const near = p => { const i = p * 4; return (d[i] - r) ** 2 + (d[i + 1] - g) ** 2 + (d[i + 2] - b) ** 2 < thr; };
  const gone = new Uint8Array(w * hh), st = [];
  const seed = p => { if (!gone[p] && near(p)) { gone[p] = 1; st.push(p); } };
  for (let x = 0; x < w; x++) { seed(x); seed((hh - 1) * w + x); }
  for (let y = 0; y < hh; y++) { seed(y * w); seed(y * w + w - 1); }
  while (st.length) {
    const p = st.pop(), x = p % w;
    if (x > 0) seed(p - 1); if (x < w - 1) seed(p + 1); if (p >= w) seed(p - w); if (p < w * (hh - 1)) seed(p + w);
  }
  for (let p = 0; p < w * hh; p++) {
    if (gone[p]) { d[p * 4 + 3] = 0; continue; }
    const x = p % w;
    if ((x > 0 && gone[p - 1]) || (x < w - 1 && gone[p + 1]) || (p >= w && gone[p - w]) || (p < w * (hh - 1) && gone[p + w])) d[p * 4 + 3] = 150;
  }
  cx.putImageData(im, 0, 0);
  return out;
}

export function mount(el, ctx) {
  const offs = [];
  let tab = 'fit', bases = {}, items = {}, looks = {}, model = ctx.uid, layers = [], selId = null, seq = 0;
  const tabs = h('div', { class: 'tabs' }), view = h('div', { class: 'wear-view' });
  el.append(tabs, view);

  const drawTabs = () => tabs.replaceChildren(...[['fit', '입혀보기'], ['closet', '옷장'], ['looks', '룩북']].map(([k, t]) => h('button', { class: 'tab' + (tab === k ? ' on' : ''), onClick: () => { tab = k; draw(); } }, t)));
  const lazyImg = (id, cls) => { const i = h('img', { class: cls || '', alt: '' }); getBlob(ctx.store, id).then(u => { if (u) i.src = u; }); return i; };
  function draw() { drawTabs(); ({ fit: drawFit, closet: drawCloset, looks: drawLooks })[tab](); }

  /* ----- 입혀보기 ----- */
  async function setBase() {
    const f = await pickImage(); if (!f) return;
    try { const c = await fileToCanvas(f, 900); const id = await putBlob(ctx.store, jpeg(c, 0.78)); const old = bases[ctx.uid]; await ctx.store.set('wear/base/' + ctx.uid, id); old && delBlob(ctx.store, old); toast('전신 사진을 저장했어요'); }
    catch (e) { toast(e.message || '사진을 올리지 못했어요'); }
  }
  function drawFit() {
    const pid = ctx.partnerId;
    const who = h('div', { class: 'chips' }, [ctx.uid, pid].filter(Boolean).map(u => h('button', { class: 'chip' + (model === u ? ' on' : ''), onClick: () => { if (model !== u) { model = u; layers = []; selId = null; drawFit(); } } }, u === ctx.uid ? '내 사진' : ctx.nameOf(u) + ' 사진')));
    if (!bases[model]) {
      view.replaceChildren(who, h('div', { class: 'empty-box' }, h('p', null, model === ctx.uid ? '전신 거울 앞에서 찍은 사진을 한 장 올려 주세요. 이 사진 위에 옷을 입혀 볼 수 있어요.' : `${josa(ctx.nameOf(model), '가', '이')} 아직 전신 사진을 안 올렸어요.`),
        model === ctx.uid && h('button', { class: 'btn primary', onClick: setBase }, '전신 사진 올리기')));
      return;
    }
    const stage = h('div', { class: 'stage' }), base = lazyImg(bases[model], 'base'), lay = h('div', { class: 'layers' });
    stage.append(base, lay);
    const ctl = h('div', { class: 'fit-ctl' });
    const strip = h('div', { class: 'strip' });
    const sel = () => layers.find(l => l.id === selId);
    const apply = l => { Object.assign(l.el.style, { left: l.x * 100 + '%', top: l.y * 100 + '%', width: l.s * 100 + '%', transform: `translate(-50%,-50%) rotate(${l.r}deg)` }); l.el.classList.toggle('sel', l.id === selId); };
    const drawCtl = () => {
      layers.forEach(apply);
      const l = sel();
      ctl.replaceChildren(l ? h('div', { class: 'ctl-row' },
        h('label', null, '크기', h('input', { type: 'range', min: 8, max: 150, value: Math.round(l.s * 100), onInput: e => { l.s = e.target.value / 100; apply(l); } })),
        h('label', null, '회전', h('input', { type: 'range', min: -180, max: 180, value: Math.round(l.r), onInput: e => { l.r = Number(e.target.value); apply(l); } })),
        h('button', { class: 'btn sm', onClick: () => { layers = layers.filter(x => x !== l).concat(l); lay.append(l.el); } }, '맨 앞으로'),
        h('button', { class: 'btn sm danger', onClick: () => { l.el.remove(); layers = layers.filter(x => x !== l); selId = null; drawCtl(); } }, '빼기'))
        : h('p', { class: 'dim center' }, layers.length ? '옷을 눌러 고르고, 끌어서 옮기세요. 두 손가락으로 크기·회전을 바꿀 수 있어요.' : '아래 옷장에서 옷을 눌러 입혀 보세요.'));
    };
    const addLayer = async itemId => {
      const url = await getBlob(ctx.store, items[itemId].img); if (!url) return;
      const l = { id: ++seq, url, x: 0.5, y: 0.42, s: 0.45, r: 0, el: h('img', { class: 'layer', src: url, draggable: false, alt: '' }) };
      l.el.dataset.id = l.id; layers.push(l); lay.append(l.el); selId = l.id; drawCtl();
    };
    // 끌기 / 두 손가락 조절
    const pts = new Map(); let g = null;
    stage.addEventListener('pointerdown', e => {
      const t = e.target.closest('.layer');
      if (!t && pts.size === 0) { selId = null; drawCtl(); return; }
      if (t && pts.size === 0) { selId = Number(t.dataset.id); drawCtl(); }
      const l = sel(); if (!l) return;
      e.preventDefault(); stage.setPointerCapture(e.pointerId); pts.set(e.pointerId, [e.clientX, e.clientY]);
      const p = [...pts.values()];
      g = { x: l.x, y: l.y, s: l.s, r: l.r, p0: p[0].slice(), d: p[1] ? Math.hypot(p[1][0] - p[0][0], p[1][1] - p[0][1]) : 0, a: p[1] ? Math.atan2(p[1][1] - p[0][1], p[1][0] - p[0][0]) : 0, cx: p[1] ? (p[0][0] + p[1][0]) / 2 : p[0][0], cy: p[1] ? (p[0][1] + p[1][1]) / 2 : p[0][1] };
    });
    stage.addEventListener('pointermove', e => {
      if (!pts.has(e.pointerId) || !g) return; const l = sel(); if (!l) return;
      pts.set(e.pointerId, [e.clientX, e.clientY]);
      const p = [...pts.values()], rc = stage.getBoundingClientRect();
      const cx = p[1] ? (p[0][0] + p[1][0]) / 2 : p[0][0], cy = p[1] ? (p[0][1] + p[1][1]) / 2 : p[0][1];
      l.x = Math.min(1.1, Math.max(-0.1, g.x + (cx - g.cx) / rc.width)); l.y = Math.min(1.1, Math.max(-0.1, g.y + (cy - g.cy) / rc.height));
      if (p[1] && g.d) { l.s = Math.min(1.5, Math.max(0.08, g.s * Math.hypot(p[1][0] - p[0][0], p[1][1] - p[0][1]) / g.d)); l.r = g.r + (Math.atan2(p[1][1] - p[0][1], p[1][0] - p[0][0]) - g.a) * 180 / Math.PI; }
      apply(l);
    });
    const up = e => { if (pts.delete(e.pointerId)) { g = null; if (pts.size) { const l = sel(), p = [...pts.values()]; if (l) g = { x: l.x, y: l.y, s: l.s, r: l.r, d: 0, a: 0, cx: p[0][0], cy: p[0][1] }; } else drawCtl(); } };
    stage.addEventListener('pointerup', up); stage.addEventListener('pointercancel', up);

    const note = h('input', { class: 'inp', placeholder: '한마디 (예: 내일 이거 어때?)', maxLength: 40 });
    const save = async () => {
      if (!layers.length) return toast('옷을 하나 이상 입혀 주세요');
      try {
        const bi = await loadImg(await getBlob(ctx.store, bases[model]));
        const W = Math.min(720, bi.naturalWidth), H = Math.round(W * bi.naturalHeight / bi.naturalWidth), c = h('canvas', { width: W, height: H }), x = c.getContext('2d');
        x.drawImage(bi, 0, 0, W, H);
        for (const l of layers) { const im = await loadImg(l.url), w = l.s * W, hh = w * im.naturalHeight / im.naturalWidth; x.save(); x.translate(l.x * W, l.y * H); x.rotate(l.r * Math.PI / 180); x.drawImage(im, -w / 2, -hh / 2, w, hh); x.restore(); }
        const img = await putBlob(ctx.store, jpeg(c, 0.8));
        await ctx.store.push('wear/looks', { by: ctx.uid, model, img, note: note.value.trim(), ts: ctx.store.now() });
        toast('룩북에 올렸어요'); tab = 'looks'; layers = []; selId = null; draw();
      } catch (e) { toast(e.message || '저장하지 못했어요'); }
    };
    const ids = Object.keys(items).sort().reverse();
    strip.replaceChildren(...ids.map(id => h('button', { class: 'thumb', onClick: () => addLayer(id) }, lazyImg(items[id].img))), h('button', { class: 'thumb plus', onClick: addItem }, '+'));
    view.replaceChildren(...[who, stage, ctl, h('div', { class: 'strip-wrap' }, strip),
      h('div', { class: 'row' }, note, h('button', { class: 'btn primary', onClick: save }, '보여주기')),
      model === ctx.uid && h('button', { class: 'link', onClick: setBase }, '전신 사진 바꾸기')].filter(Boolean));
    layers.forEach(l => lay.append(l.el)); drawCtl();
  }

  /* ----- 옷장 ----- */
  async function addItem() {
    const f = await pickImage(); if (!f) return;
    let src; try { src = await fileToCanvas(f, 440); } catch (e) { return toast(e.message); }
    let tol = 14, out = removeBg(src, tol);
    const prev = h('div', { class: 'cut-prev checker' });
    const show = () => { out = removeBg(src, tol); out.className = 'cut-canvas'; prev.replaceChildren(out); };
    show();
    modal({ title: '옷 사진 다듬기', body: h('div', null, prev,
      h('label', { class: 'slider' }, '배경 지우기 세기', h('input', { type: 'range', min: 0, max: 60, value: tol, onInput: e => { tol = Number(e.target.value); show(); } })),
      h('p', { class: 'dim' }, '흰 벽이나 쇼핑몰 상품 사진처럼 배경이 한 가지 색일 때 잘 지워져요. 0으로 두면 사진 그대로 써요.')),
      actions: [{ label: '취소' }, { label: '옷장에 넣기', primary: true, onClick: async c => { c(); try { const img = await putBlob(ctx.store, out.toDataURL('image/png')); await ctx.store.push('wear/items', { img, by: ctx.uid, ts: ctx.store.now() }); toast('옷장에 넣었어요'); } catch {} } }] });
  }
  function drawCloset() {
    const ids = Object.keys(items).sort().reverse();
    view.replaceChildren(h('p', { class: 'dim' }, '둘이 같이 쓰는 옷장이에요. 옷 사진을 넣어 두면 서로의 사진에 입혀 볼 수 있어요.'),
      h('div', { class: 'closet' }, h('button', { class: 'thumb plus big', onClick: addItem }, '+ 옷 추가'),
        ids.map(id => h('div', { class: 'thumb big checker' }, lazyImg(items[id].img),
          h('button', { class: 'x', 'aria-label': '삭제', onClick: () => ask('이 옷을 옷장에서 뺄까요?', '빼기').then(y => { if (y) { ctx.store.remove('wear/items/' + id); delBlob(ctx.store, items[id].img); } }) }, '×')))));
  }

  /* ----- 룩북 ----- */
  const yz = (n, on) => h('span', { class: 'yz' + (on ? ' on' : ''), html: yuzuSvg, 'data-n': n });
  function drawLooks() {
    const ids = Object.keys(looks).sort().reverse();
    if (!ids.length) return view.replaceChildren(h('div', { class: 'empty-box' }, h('p', null, '아직 올린 코디가 없어요. 입혀보기에서 코디를 만들어 보여주세요.')));
    const avg = u => { const s = ids.map(i => looks[i]).filter(l => l.by === u).flatMap(l => Object.values(l.rate || {}).map(r => r.s)); return s.length ? (s.reduce((a, b) => a + b, 0) / s.length).toFixed(1) : '-'; };
    view.replaceChildren(h('div', { class: 'score-bar' }, ctx.order.map(u => h('span', null, ctx.nameOf(u), ' 평균 ', h('b', null, avg(u)), ' 유자'))),
      ...ids.map(id => {
        const l = looks[id], rate = l.rate || {}, mine = rate[ctx.uid];
        let s = mine ? mine.s : 0;
        const stars = h('div', { class: 'stars' }, [1, 2, 3, 4, 5].map(n => h('button', { class: 'star', 'aria-label': n + '점', onClick: () => { s = n; stars.querySelectorAll('.yz').forEach(z => z.classList.toggle('on', Number(z.dataset.n) <= s)); } }, yz(n, n <= s))));
        const cm = h('input', { class: 'inp', placeholder: '한줄평', maxLength: 40, value: mine ? mine.c || '' : '' });
        return h('article', { class: 'look' }, lazyImg(l.img, 'look-img'),
          h('div', { class: 'look-meta' }, h('b', null, `${ctx.nameOf(l.by)}의 코디`), l.model !== l.by && h('small', null, ` (모델: ${ctx.nameOf(l.model)})`), h('small', { class: 'dim' }, ' ' + hm(l.ts)),
            l.by === ctx.uid && h('button', { class: 'x', 'aria-label': '삭제', onClick: () => ask('이 코디를 지울까요?', '지우기').then(y => { if (y) { ctx.store.remove('wear/looks/' + id); delBlob(ctx.store, l.img); } }) }, '×')),
          l.note && h('p', { class: 'note' }, '“' + l.note + '”'),
          Object.entries(rate).map(([u, r]) => h('p', { class: 'rated' }, h('b', null, ctx.nameOf(u)), ' ', [1, 2, 3, 4, 5].map(n => yz(n, n <= r.s)), r.c && ' ' + r.c)),
          l.by !== ctx.uid && h('div', { class: 'rate-box' }, stars, h('div', { class: 'row' }, cm, h('button', { class: 'btn primary', onClick: () => s ? ctx.store.set(`wear/looks/${id}/rate/${ctx.uid}`, { s, c: cm.value.trim() }).then(() => toast('평가를 보냈어요')) : toast('유자 개수를 골라 주세요') }, mine ? '고치기' : '평가'))));
      }));
  }

  offs.push(ctx.store.on('wear/base', v => { bases = v || {}; if (tab === 'fit') drawFit(); }));
  offs.push(ctx.store.on('wear/items', v => { items = v || {}; if (tab !== 'looks') draw(); }));
  offs.push(ctx.store.on('wear/looks', v => { looks = v || {}; if (tab === 'looks') drawLooks(); }, { limit: 20 }));
  draw();
  return () => offs.forEach(f => f());
}
