// 오늘 전시회가실? — 흰 대리석 전시실. 벽에 액자(소·중·대, 가로·세로)를 걸고 제목을 붙인다. 액자를 누르면 크게 보고 제목·설명을 읽는다.
import { h, toast, modal, ask, pickImage, fileToCanvas, jpeg } from './ui.js';
import { putBlob, getBlob, delBlob } from './store.js';
import { capyEl } from './capy.js';

const WALL_W = 1600, WALL_H = 330;
const LONG = { s: 92, m: 136, l: 188 }, SIZE_NAME = { s: '소', m: '중', l: '대' };
const dims = f => { const L = LONG[f.size] || LONG.m, S = Math.round(L * 0.74); return f.ori === 'v' ? [S, L] : [L, S]; };

export function mount(el, ctx) {
  let frames = {}, moving = false;
  const wall = h('div', { class: 'g-wall', style: { width: WALL_W + 'px', height: WALL_H + 'px' } });
  const floor = h('div', { class: 'g-floor', style: { width: WALL_W + 'px' } },
    ctx.order.map((u, i) => h('span', { class: 'g-visitor', style: { left: 120 + i * 90 + 'px' } }, capyEl(ctx.capyOf(u, { face: 'wow', view: 'front' })))));
  const room = h('div', { class: 'g-room' }, h('div', { class: 'g-in' }, wall, floor));
  const moveBtn = h('button', { class: 'btn', onClick: () => { moving = !moving; draw(); toast(moving ? '액자를 끌어서 옮기세요. 다 되면 "배치 끝"을 눌러요' : '배치를 저장했어요'); } }, '배치 바꾸기');
  const count = h('small', { class: 'dim' });

  const chipsRow = (obj, cur, set) => { const row = h('div', { class: 'chips' }, Object.entries(obj).map(([k, t]) => { const b = h('button', { class: 'chip' + (cur() === k ? ' on' : ''), onClick: () => { set(k); row.querySelectorAll('.chip').forEach(x => x.classList.remove('on')); b.classList.add('on'); } }, t); return b; })); return row; };
  // 액자 정보 입력창 (새로 걸기 / 고치기 공용)
  function form(title, init, onSave, extra = []) {
    const v = { size: 'm', ori: 'h', title: '', desc: '', ...init };
    const t = h('input', { class: 'inp', placeholder: '제목', maxLength: 30, value: v.title }), d = h('textarea', { class: 'inp', rows: 3, placeholder: '설명 (없어도 됨)', maxLength: 300, value: v.desc });
    modal({ title, body: h('div', null, t, h('label', { class: 'lbl' }, '크기'), chipsRow(SIZE_NAME, () => v.size, k => { v.size = k; }), h('label', { class: 'lbl' }, '방향'), chipsRow({ h: '가로', v: '세로' }, () => v.ori, k => { v.ori = k; }), h('label', { class: 'lbl' }, '설명'), d),
      actions: [...extra, { label: '취소' }, { label: '저장', primary: true, onClick: c => { c(); onSave({ size: v.size, ori: v.ori, title: t.value.trim(), desc: d.value.trim() }); } }] });
  }
  async function addFrame() {
    const f = await pickImage(); if (!f) return;
    let c; try { c = await fileToCanvas(f, 1000); } catch (e) { return toast(e.message); }
    form('액자 걸기', { ori: c.height > c.width ? 'v' : 'h' }, async v => {
      try { const img = await putBlob(ctx.store, jpeg(c, 0.8)); const x = Math.round(Math.min(WALL_W - 120, Math.max(120, room.scrollLeft + room.clientWidth / 2)));
        await ctx.store.push('gallery/frames', { ...v, img, x, y: 140, by: ctx.uid, ts: ctx.store.now() }); toast('액자를 걸었어요. "배치 바꾸기"로 옮길 수 있어요'); } catch {}
    });
  }
  const edit = (id, f) => form('액자 고치기', f, v => ctx.store.update('gallery/frames/' + id, v), [{ label: '떼기', danger: true, onClick: c => { c(); ask(`"${f.title || '이 액자'}"를 뗄까요?`, '떼기').then(y => { if (y) { ctx.store.remove('gallery/frames/' + id); delBlob(ctx.store, f.img); } }); } }]);
  function view(id, f, src) {
    modal({ body: h('div', { class: 'g-view' }, h('div', { class: 'g-view-frame' }, h('img', { src, alt: f.title || '전시 사진' })), h('h3', null, f.title || '무제'), f.desc && h('p', null, f.desc), h('small', { class: 'dim' }, `${ctx.nameOf(f.by)} 전시 · ${SIZE_NAME[f.size] || '중'} · ${f.ori === 'v' ? '세로' : '가로'}`)),
      actions: [{ label: '고치기', onClick: c => { c(); edit(id, f); } }, { label: '닫기', primary: true }] });
  }
  function draw() {
    const ids = Object.keys(frames).sort();
    count.textContent = ids.length ? `액자 ${ids.length}점 · 벽을 옆으로 밀어 보세요` : '';
    moveBtn.textContent = moving ? '✓ 배치 끝' : '배치 바꾸기'; moveBtn.classList.toggle('primary', moving); room.classList.toggle('moving', moving);
    wall.replaceChildren(h('div', { class: 'g-rail' }), ...(ids.length ? ids.map(id => {
      const f = frames[id], [w, hh] = dims(f), im = h('img', { alt: f.title || '', draggable: false });
      getBlob(ctx.store, f.img).then(u => { if (u) im.src = u; });
      const box = h('div', { class: 'g-frame', style: { left: f.x + 'px', top: f.y + 'px' } }, h('i', { class: 'g-light' }), h('div', { class: 'g-pic', style: { width: w + 'px', height: hh + 'px' } }, im), h('div', { class: 'g-plate' }, f.title || '무제'));
      let st = null;
      box.addEventListener('pointerdown', e => { st = { x: e.clientX, y: e.clientY, fx: f.x, fy: f.y, moved: false }; if (moving) { e.preventDefault(); box.setPointerCapture(e.pointerId); } });
      box.addEventListener('pointermove', e => { if (!st || !moving) return; const dx = e.clientX - st.x, dy = e.clientY - st.y; if (Math.abs(dx) + Math.abs(dy) > 4) st.moved = true;
        f.x = Math.round(Math.max(w / 2 + 24, Math.min(WALL_W - w / 2 - 24, st.fx + dx))); f.y = Math.round(Math.max(hh / 2 + 36, Math.min(WALL_H - hh / 2 - 50, st.fy + dy))); box.style.left = f.x + 'px'; box.style.top = f.y + 'px'; });
      box.addEventListener('pointerup', () => { const s = st; st = null; if (!s) return; if (moving && s.moved) return void ctx.store.update('gallery/frames/' + id, { x: f.x, y: f.y });
        if (moving) edit(id, f); else if (im.src) view(id, f, im.src); });
      box.addEventListener('pointercancel', () => { st = null; });
      return box;
    }) : [h('p', { class: 'g-empty' }, '아직 빈 벽이에요. 아래 "액자 걸기"로 첫 작품을 걸어 보세요')]));
  }
  el.append(room, h('div', { class: 'row g-acts' }, h('button', { class: 'btn primary', onClick: addFrame }, '🖼️ 액자 걸기'), moveBtn), count,
    h('p', { class: 'dim' }, '액자를 누르면 크게 보고 제목·설명을 읽을 수 있어요. 크기(소·중·대)와 방향(가로·세로)은 걸 때 고르고, 나중에 "고치기"로 바꿀 수 있어요.'));
  const off = ctx.store.on('gallery/frames', v => { const drag = room.querySelector('.g-frame:active'); frames = v || {}; if (!(moving && drag)) draw(); });
  draw();
  return () => off();
}
