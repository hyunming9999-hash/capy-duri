// 히노끼탕처럼 걸어 다니는 공간: 긴 전시실을 방향키로 걸으면 화면이 따라오고, 상대 카피바라도 실시간으로 보인다.
// 오늘 전시회가실? — 흰 대리석 전시실. 벽에 액자(소·중·대, 가로·세로)를 걸고 제목을 붙인다. 액자를 누르면 크게 보고 제목·설명을 읽는다.
import { h, toast, modal, ask, pickImage, fileToCanvas, jpeg, holdBtn } from './ui.js';
import { putBlob, getBlob, delBlob } from './store.js';
import { capy } from './capy.js';

const WALL_W = 1600, WALL_H = 270, FLOOR_H = 170;
const LONG = { s: 92, m: 136, l: 188 }, SIZE_NAME = { s: '소', m: '중', l: '대' };
const MIN_W = 44, MAX_W = 320, MIN_H = 44, MAX_H = 184;
const dims = f => { if (f.w && f.h) return [f.w, f.h]; const L = LONG[f.size] || LONG.m, S = Math.round(L * 0.74); return f.ori === 'v' ? [S, L] : [L, S]; };

// 원근감 있는 대리석 바닥: 벽 쪽 소실점으로 모이는 줄눈 + 앞으로 올수록 넓어지는 가로줄 + 대리석 결
function tilesSvg() {
  const vx = WALL_W / 2, vy = -230; let d = '';
  for (let x = -2400; x <= WALL_W + 2400; x += 150) d += `M${vx + (x - vx) * (-vy) / (FLOOR_H - vy)} 0L${x} ${FLOOR_H}`;
  for (const y of [14, 34, 62, 100, 148]) d += `M0 ${y}H${WALL_W}`;
  let veins = ''; for (let i = 0; i < 26; i++) { const x = (i * 131) % WALL_W, y = 12 + (i * 47) % (FLOOR_H - 20), w = 60 + (i * 37) % 90; veins += `<path d="M${x} ${y} q${w / 3} ${-8 + (i % 5) * 4} ${w / 2} ${4} t${w / 2} ${-6 + (i % 3) * 5}" fill="none" stroke="#9AA0B4" stroke-opacity="${0.16 + (i % 4) * 0.05}" stroke-width="${1 + (i % 3) * 0.7}" stroke-linecap="round"/>`; }
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${WALL_W} ${FLOOR_H}" preserveAspectRatio="none"><defs><linearGradient id="gfl" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#E4E3EA"/><stop offset=".35" stop-color="#F6F5F9"/><stop offset="1" stop-color="#FFFFFF"/></linearGradient></defs><rect width="${WALL_W}" height="${FLOOR_H}" fill="url(#gfl)"/>${veins}<path d="${d}" stroke="#8C8FA3" stroke-opacity=".3" stroke-width="1.4" fill="none"/></svg>`;
}

export function mount(el, ctx) {
  let frames = {}, moving = false;
  const wall = h('div', { class: 'g-wall', style: { width: WALL_W + 'px', height: WALL_H + 'px' } });
  const floor = h('div', { class: 'g-floor', style: { width: WALL_W + 'px', height: FLOOR_H + 'px' } }, h('div', { class: 'g-tiles', html: tilesSvg() }),
    [300, 800, 1300].map(x => h('i', { class: 'g-bench', style: { left: x + 'px' } })), [40, 560, 1060, 1560].map(x => h('i', { class: 'g-plant', style: { left: x + 'px' } }, '🪴')));
  const inner = h('div', { class: 'g-in', style: { width: WALL_W + 'px', height: (WALL_H + FLOOR_H) + 'px' } }, wall, floor);
  const sizer = h('div', { class: 'g-size' }, inner);
  const room = h('div', { class: 'g-room' }, sizer);
  // 전시실을 남는 높이에 맞춰 통째로 줄인다(한 화면에 방향키까지 다 보이게). z = 줄인 비율
  let z = 1;
  const fitRoom = () => { const H = room.clientHeight; if (!H) return; z = Math.min(1, H / (WALL_H + FLOOR_H));
    inner.style.transform = `scale(${z})`; sizer.style.width = WALL_W * z + 'px'; sizer.style.height = (WALL_H + FLOOR_H) * z + 'px'; follow(); };
  const ro = window.ResizeObserver ? new ResizeObserver(fitRoom) : null; ro && ro.observe(room);

  /* 걸어 다니기 */
  let alive = true, raf = 0, last = 0, sendT = 0, dirty = true;
  const me = { x: 110 + ctx.idx * 80, y: 70, v: 'back', f: false }, avs = {}, keys = new Set();
  function av(uid) {
    if (!avs[uid]) { const a = { el: h('div', { class: 'g-av' + (uid === ctx.uid ? ' me' : '') }, h('span', { class: 'g-av-body' }), h('b', null, ctx.nameOf(uid))), key: '' }; avs[uid] = a; inner.append(a.el); }
    return avs[uid];
  }
  function place(uid, p) {
    const a = av(uid), key = p.v + (p.f ? 'f' : '');
    if (a.key !== key) { a.key = key; a.el.firstChild.innerHTML = capy(ctx.capyOf(uid, { view: p.v, face: 'wow' })); a.el.firstChild.style.transform = p.f ? 'scaleX(-1)' : ''; }
    const sc = 0.78 + p.y / FLOOR_H * 0.5; // 앞으로 올수록 크게
    Object.assign(a.el.style, { left: p.x + 'px', top: (WALL_H + 6 + p.y) + 'px', zIndex: 200 + Math.round(p.y), transform: `translate(-50%,-100%) scale(${sc.toFixed(3)})` });
  }
  const follow = () => { room.scrollLeft = Math.max(0, Math.min(WALL_W * z - room.clientWidth, me.x * z - room.clientWidth / 2)); };
  function loop(t) {
    if (!alive) return; raf = requestAnimationFrame(loop);
    const dt = Math.min(0.05, (t - (last || t)) / 1000); last = t;
    const dx = (keys.has('R') ? 1 : 0) - (keys.has('L') ? 1 : 0), dy = (keys.has('D') ? 1 : 0) - (keys.has('U') ? 1 : 0);
    if (dx || dy) {
      me.x = Math.max(30, Math.min(WALL_W - 30, me.x + dx * 170 * dt)); me.y = Math.max(8, Math.min(FLOOR_H - 8, me.y + dy * 100 * dt));
      me.v = dy > 0 ? 'front' : 'back'; if (dx) me.f = dx < 0; dirty = true; place(ctx.uid, me); if (!moving) follow();
    } else if (me.v !== 'back' && !keys.size && dirty && t - sendT > 600) { me.v = 'back'; me.f = false; place(ctx.uid, me); } // 멈추면 벽(작품)을 본다
    if (dirty && t - sendT > 100) { sendT = t; dirty = dx || dy ? true : me.v !== 'back'; ctx.store.set('rt/gallery/' + ctx.uid, { x: Math.round(me.x), y: Math.round(me.y), v: me.v, f: me.f }).catch(() => {}); }
  }
  const KEY = { ArrowUp: 'U', ArrowDown: 'D', ArrowLeft: 'L', ArrowRight: 'R', w: 'U', s: 'D', a: 'L', d: 'R' };
  const kd = e => { const k = KEY[e.key]; if (!k || /INPUT|TEXTAREA/.test(document.activeElement?.tagName || '') || document.querySelector('.modal-wrap')) return; e.preventDefault(); keys.add(k); };
  const ku = e => { const k = KEY[e.key]; if (k) keys.delete(k); };
  window.addEventListener('keydown', kd); window.addEventListener('keyup', ku);
  const pad = h('div', { class: 'dpad big' }, [['U', '▲'], ['L', '◀'], ['D', '▼'], ['R', '▶']].map(([k, t]) => { const b = h('button', { class: 'dp dp-' + k, 'aria-label': k }, t); holdBtn(b, () => keys.add(k), () => keys.delete(k)); return b; }));
  const offRt = ctx.store.on('rt/gallery', v => {
    for (const [u, p] of Object.entries(v || {})) if (u !== ctx.uid && ctx.members[u] && p) place(u, p);
    for (const u of Object.keys(avs)) if (u !== ctx.uid && !(v || {})[u]) { avs[u].el.remove(); delete avs[u]; }
  });
  const offDress = ctx.store.on('dress', () => { for (const a of Object.values(avs)) a.key = ''; place(ctx.uid, me); });
  const moveBtn = h('button', { class: 'btn', onClick: () => { moving = !moving; draw(); toast(moving ? '액자를 끌어 옮기고, 모서리(↘)를 끌어 모양·크기를 바꾸세요. 다 되면 "배치 끝"을 눌러요' : '배치를 저장했어요'); } }, '배치 바꾸기');
  const count = h('small', { class: 'dim' });

  const chipsRow = (obj, cur, set) => { const row = h('div', { class: 'chips' }, Object.entries(obj).map(([k, t]) => { const b = h('button', { class: 'chip' + (cur() === k ? ' on' : ''), onClick: () => { set(k); row.querySelectorAll('.chip').forEach(x => x.classList.remove('on')); b.classList.add('on'); } }, t); return b; })); return row; };
  // 액자 정보 입력창 (새로 걸기 / 고치기 공용)
  function form(title, init, onSave, extra = []) {
    const v = { size: 'm', ori: 'h', title: '', desc: '', ...init }; let preset = false;
    const t = h('input', { class: 'inp', placeholder: '제목', maxLength: 30, value: v.title }), d = h('textarea', { class: 'inp', rows: 3, placeholder: '설명 (없어도 됨)', maxLength: 300, value: v.desc });
    modal({ title, body: h('div', null, t, h('label', { class: 'lbl' }, '크기'), chipsRow(SIZE_NAME, () => v.size, k => { v.size = k; preset = true; }), h('label', { class: 'lbl' }, '방향'), chipsRow({ h: '가로', v: '세로' }, () => v.ori, k => { v.ori = k; preset = true; }), h('small', { class: 'dim' }, '걸고 나서 "배치 바꾸기"를 누르고 액자 모서리(↘)를 끌면 모양·크기를 마음대로 바꿀 수 있어요'), h('label', { class: 'lbl' }, '설명'), d),
      actions: [...extra, { label: '취소' }, { label: '저장', primary: true, onClick: c => { c(); onSave({ size: v.size, ori: v.ori, title: t.value.trim(), desc: d.value.trim(), ...(preset ? { w: null, h: null } : {}) }); } }] });
  }
  async function addFrame() {
    const f = await pickImage(); if (!f) return;
    let c; try { c = await fileToCanvas(f, 1000); } catch (e) { return toast(e.message); }
    form('액자 걸기', { ori: c.height > c.width ? 'v' : 'h' }, async v => {
      try { const img = await putBlob(ctx.store, jpeg(c, 0.8)); const x = Math.round(Math.min(WALL_W - 120, Math.max(120, me.x))); // 내 카피바라가 서 있는 자리 위에 건다
        await ctx.store.push('gallery/frames', { ...v, img, x, y: 125, by: ctx.uid, ts: ctx.store.now() }); toast('액자를 걸었어요. "배치 바꾸기"로 옮길 수 있어요'); } catch (e) { toast('액자를 걸지 못했어요: ' + (e.code || e.message || '연결을 확인해 주세요')); }
    });
  }
  const edit = (id, f) => form('액자 고치기', f, v => ctx.store.update('gallery/frames/' + id, v), [{ label: '떼기', danger: true, onClick: c => { c(); ask(`"${f.title || '이 액자'}"를 뗄까요?`, '떼기').then(y => { if (y) { ctx.store.remove('gallery/frames/' + id); delBlob(ctx.store, f.img); } }); } }]);
  function view(id, f, src) {
    modal({ body: h('div', { class: 'g-view' }, h('div', { class: 'g-view-frame' }, h('img', { src, alt: f.title || '전시 사진' })), h('h3', null, f.title || '무제'), f.desc && h('p', null, f.desc), h('small', { class: 'dim' }, `${ctx.nameOf(f.by)} 전시 · ${SIZE_NAME[f.size] || '중'} · ${f.ori === 'v' ? '세로' : '가로'}`)),
      actions: [{ label: '고치기', onClick: c => { c(); edit(id, f); } }, { label: '닫기', primary: true }] });
  }
  function draw() {
    const ids = Object.keys(frames).sort();
    count.textContent = ids.length ? `액자 ${ids.length}점 · 방향키로 전시실을 걸어 보세요` : '';
    moveBtn.textContent = moving ? '✓ 배치 끝' : '배치 바꾸기'; moveBtn.classList.toggle('primary', moving); room.classList.toggle('moving', moving);
    wall.replaceChildren(h('div', { class: 'g-rail' }), ...(ids.length ? ids.map(id => {
      const f = frames[id], [w, hh] = dims(f), im = h('img', { alt: f.title || '', draggable: false });
      getBlob(ctx.store, f.img).then(u => { if (u) im.src = u; });
      const box = h('div', { class: 'g-frame', style: { left: f.x + 'px', top: f.y + 'px' } }, h('i', { class: 'g-light' }), h('div', { class: 'g-pic', style: { width: w + 'px', height: hh + 'px' } }, im), h('div', { class: 'g-plate' }, f.title || '무제'));
      // 배치 바꾸기에서 모서리를 끌면 액자 모양·크기를 마음대로
      const pic = box.children[1], grip = h('i', { class: 'g-grip', 'aria-label': '크기 바꾸기' }); pic.append(grip);
      let rs = null, cw = w, ch = hh;
      grip.addEventListener('pointerdown', e => { if (!moving) return; e.preventDefault(); e.stopPropagation(); grip.setPointerCapture(e.pointerId); rs = { x: e.clientX, y: e.clientY, w: cw, h: ch }; });
      grip.addEventListener('pointermove', e => { if (!rs) return; e.stopPropagation();
        cw = Math.round(Math.max(MIN_W, Math.min(MAX_W, rs.w + (e.clientX - rs.x) / z * 2))); ch = Math.round(Math.max(MIN_H, Math.min(MAX_H, rs.h + (e.clientY - rs.y) / z * 2)));
        pic.style.width = cw + 'px'; pic.style.height = ch + 'px'; });
      const endRs = e => { if (!rs) return; e.stopPropagation(); rs = null; f.w = cw; f.h = ch; f.y = Math.round(Math.max(ch / 2 + 36, Math.min(WALL_H - ch / 2 - 50, f.y))); box.style.top = f.y + 'px'; ctx.store.update('gallery/frames/' + id, { w: cw, h: ch, y: f.y }); };
      grip.addEventListener('pointerup', endRs); grip.addEventListener('pointercancel', endRs);
      let st = null;
      box.addEventListener('pointerdown', e => { st = { x: e.clientX, y: e.clientY, fx: f.x, fy: f.y, moved: false }; if (moving) { e.preventDefault(); box.setPointerCapture(e.pointerId); } });
      box.addEventListener('pointermove', e => { if (!st || !moving) return; const dx = (e.clientX - st.x) / z, dy = (e.clientY - st.y) / z; if (Math.abs(dx) + Math.abs(dy) > 4) st.moved = true;
        f.x = Math.round(Math.max(cw / 2 + 24, Math.min(WALL_W - cw / 2 - 24, st.fx + dx))); f.y = Math.round(Math.max(ch / 2 + 36, Math.min(WALL_H - ch / 2 - 50, st.fy + dy))); box.style.left = f.x + 'px'; box.style.top = f.y + 'px'; });
      box.addEventListener('pointerup', () => { const s = st; st = null; if (!s) return; if (moving && s.moved) return void ctx.store.update('gallery/frames/' + id, { x: f.x, y: f.y });
        if (moving) edit(id, f); else if (im.src) view(id, f, im.src); });
      box.addEventListener('pointercancel', () => { st = null; });
      return box;
    }) : [h('p', { class: 'g-empty' }, '아직 빈 벽이에요. 아래 "액자 걸기"로 첫 작품을 걸어 보세요')]));
  }
  el.append(room, h('div', { class: 'row g-acts' }, h('button', { class: 'btn primary', onClick: addFrame }, '🖼️ 액자 걸기'), moveBtn), count,
    h('p', { class: 'dim g-hint' }, '액자를 누르면 크게 보고 제목·설명을 읽어요. 액자는 내 카피바라가 서 있는 자리 위에 걸려요. 모양·크기는 "배치 바꾸기"에서 모서리를 끌어 마음대로 바꿔요.'),
    h('div', { class: 'pad-dock g-pad' }, pad));
  // 화면을 한 장에 고정: 전시실 → 버튼 → 방향키(맨 아래)
  const vv = window.visualViewport, root = document.documentElement;
  const fit = () => { root.style.setProperty('--vvh', (vv ? vv.height : window.innerHeight) + 'px'); root.style.setProperty('--vvt', (vv ? vv.offsetTop : 0) + 'px'); };
  fit(); root.classList.add('fixed-page');
  if (vv) { vv.addEventListener('resize', fit); vv.addEventListener('scroll', fit); } window.addEventListener('resize', fit);
  place(ctx.uid, me); ctx.store.ephemeral('rt/gallery/' + ctx.uid, { x: me.x, y: me.y, v: me.v, f: false }).catch(() => {}); raf = requestAnimationFrame(loop);
  const off = ctx.store.on('gallery/frames', v => { const drag = room.querySelector('.g-frame:active'); frames = v || {}; if (!(moving && drag)) draw(); });
  draw();
  return () => { alive = false; cancelAnimationFrame(raf); off(); offRt(); offDress(); window.removeEventListener('keydown', kd); window.removeEventListener('keyup', ku); ro && ro.disconnect();
    root.classList.remove('fixed-page'); root.style.removeProperty('--vvh'); root.style.removeProperty('--vvt');
    if (vv) { vv.removeEventListener('resize', fit); vv.removeEventListener('scroll', fit); } window.removeEventListener('resize', fit);
    ctx.store.remove('rt/gallery/' + ctx.uid).catch(() => {}); };
}
