// 오늘 얘기나 하지? — 둘만의 톡 (글, 사진, 카피바라 스티커)
import { h, toast, modal, pickImage, fileToCanvas, jpeg, hm, niceDate, ymd } from './ui.js';
import { putBlob, getBlob } from './store.js';
import { capyEl } from './capy.js';

const STICKERS = [['love', '좋아해'], ['happy', '최고야'], ['wow', '헉'], ['sleepy', '졸려'], ['sad', '미안해'], ['wink', '오케이']];

export function mount(el, ctx) {
  const offs = []; let msgs = {}, theirRead = 0, drawn = '', trayOpen = false;
  const list = h('div', { class: 'chat-list' });
  const inp = h('textarea', { class: 'inp msg-inp', rows: 1, placeholder: '메시지', maxLength: 1000, enterKeyHint: 'send' });
  const tray = h('div', { class: 'tray', hidden: true }, STICKERS.map(([f, t]) => h('button', { class: 'sticker', onClick: () => { send({ st: f }); toggleTray(false); } }, capyEl(ctx.capyOf(ctx.uid, { face: f })), h('small', null, t))));
  const toBottom = () => requestAnimationFrame(() => requestAnimationFrame(() => { list.scrollTop = list.scrollHeight; })); // 화면 크기가 바뀐 다음에 내린다
  let stick = 0; // 내가 보낸 직후 몇 초 동안은 사진이 늦게 떠도 맨 아래로 따라간다
  const toggleTray = on => { trayOpen = on ?? !trayOpen; tray.hidden = !trayOpen; toBottom(); };

  const send = async m => { stick = Date.now() + 4000; toBottom(); try { await ctx.store.push('chat', { by: ctx.uid, ts: ctx.store.now(), ...m }); } catch {} };
  const sendText = () => { const t = inp.value.trim(); if (!t) return; inp.value = ''; inp.style.height = ''; send({ t }); inp.focus(); };
  const sendPhoto = async camera => {
    const f = await pickImage(camera); if (!f) return;
    try { toast('사진 보내는 중…'); const c = await fileToCanvas(f, 1000); const img = await putBlob(ctx.store, jpeg(c, 0.7)); await send({ img }); }
    catch (e) { toast(e.message || '사진을 보내지 못했어요'); }
  };
  inp.addEventListener('keydown', e => { if (e.key === 'Enter' && !e.shiftKey && !e.isComposing) { e.preventDefault(); sendText(); } });
  inp.addEventListener('input', () => { inp.style.height = ''; inp.style.height = Math.min(110, inp.scrollHeight) + 'px'; });

  function draw() {
    const ids = Object.keys(msgs).sort();
    const sig = ids.join() + '|' + theirRead; if (sig === drawn) return; drawn = sig;
    const nearEnd = list.scrollHeight - list.scrollTop - list.clientHeight < 120;
    let lastDay = ''; const out = [];
    for (const id of ids) {
      const m = msgs[id], mine = m.by === ctx.uid, d = ymd(new Date(m.ts));
      if (d !== lastDay) { out.push(h('div', { class: 'day-sep' }, niceDate(d))); lastDay = d; }
      let body;
      if (m.st) body = h('div', { class: 'st' }, capyEl(ctx.capyOf(m.by, { face: m.st })), h('small', null, (STICKERS.find(s => s[0] === m.st) || [])[1] || ''));
      else if (m.img) { const im = h('img', { class: 'photo', alt: '사진', onClick: () => im.src && modal({ body: h('img', { class: 'photo-full', src: im.src, alt: '사진' }), actions: [{ label: '닫기' }] }) }); im.onload = () => { if (Date.now() < stick || list.scrollHeight - list.scrollTop - list.clientHeight < im.height + 200) list.scrollTop = list.scrollHeight; }; getBlob(ctx.store, m.img).then(u => { if (u) im.src = u; }); body = im; }
      else body = h('div', { class: 'bubble' }, m.t);
      // 카톡처럼: 상대가 아직 안 읽은 내 말 옆에 노란 1, 읽으면 사라진다
      const unread = mine && ctx.partnerId && m.ts > theirRead;
      const row = h('div', { class: 'msg' + (mine ? ' mine' : '') }, !mine && capyEl(ctx.capyOf(m.by, { head: true }), 'mini'), body, h('span', { class: 'meta' }, unread && h('b', { class: 'unread', 'aria-label': '안 읽음' }, '1'), h('small', { class: 'time' }, hm(m.ts))));
      out.push(row);
    }
    if (!ids.length) out.push(h('div', { class: 'empty-box' }, capyEl(ctx.capyOf(ctx.uid, { face: 'happy' }), 'bob'), h('p', null, '첫 마디를 건네 보세요')));
    list.replaceChildren(...out);
    const newest = ids.length && msgs[ids[ids.length - 1]];
    if (nearEnd || drawn.length < 3 || Date.now() < stick || (newest && newest.by === ctx.uid)) toBottom();
    markRead();
  }
  function markRead() {
    if (document.hidden) return;
    const last = Math.max(0, ...Object.values(msgs).filter(m => m.by !== ctx.uid).map(m => m.ts));
    if (last > (markRead.at || 0)) { markRead.at = last; ctx.store.set('read/' + ctx.uid, last).catch(() => {}); }
  }
  document.addEventListener('visibilitychange', markRead);

  // 카톡처럼 + 버튼 하나에 카메라·사진·스티커를 모으고, 입력칸을 넓게 쓴다
  const plus = h('button', { class: 'ic plus', 'aria-label': '더보기', 'aria-expanded': 'false', onClick: () => { const open = attach.hidden; attach.hidden = !open; plus.classList.toggle('on', open); plus.setAttribute('aria-expanded', String(open)); if (!open) toggleTray(false); toBottom(); } }, '+');
  const closeAttach = () => { attach.hidden = true; plus.classList.remove('on'); plus.setAttribute('aria-expanded', 'false'); };
  const attach = h('div', { class: 'attach', hidden: true },
    h('button', { class: 'att', 'aria-label': '카메라로 찍기', onClick: () => { closeAttach(); sendPhoto(true); } }, h('span', null, '📷'), '카메라'),
    h('button', { class: 'att', 'aria-label': '사진첩에서 고르기', onClick: () => { closeAttach(); sendPhoto(false); } }, h('span', null, '🖼️'), '사진'),
    h('button', { class: 'att', 'aria-label': '스티커', onClick: () => { closeAttach(); toggleTray(); } }, h('span', null, '🧡'), '스티커'));
  inp.addEventListener('focus', () => { closeAttach(); toBottom(); });
  el.append(list, tray, attach, h('div', { class: 'composer' }, plus, inp, h('button', { class: 'btn primary send', onClick: sendText }, '보내기')));

  let first = true;
  offs.push(ctx.store.on('chat', v => { msgs = v || {}; draw(); if (first) { first = false; requestAnimationFrame(() => { list.scrollTop = list.scrollHeight; }); } }, { limit: 80 }));
  if (ctx.partnerId) offs.push(ctx.store.on('read/' + ctx.partnerId, v => { theirRead = v || 0; draw(); }));
  return () => { offs.forEach(f => f()); document.removeEventListener('visibilitychange', markRead); };
}
