// 오늘 얘기나 하지? — 둘만의 톡 (글, 사진, 카피바라 스티커)
import { h, toast, modal, ask, pickImage, pickImages, fileToCanvas, jpeg, hm, niceDate, ymd } from './ui.js';
import { putBlob, getBlob, delBlob } from './store.js';

const MAX_PHOTOS = 20;
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
  // 카메라는 한 장, 사진첩은 한꺼번에 최대 20장(한 묶음으로 간다)
  const sendPhoto = async camera => {
    const files = camera ? [await pickImage(true)].filter(Boolean) : await pickImages(MAX_PHOTOS); if (!files.length) return;
    if (files.over) toast(`한 번에 ${MAX_PHOTOS}장까지만 보내요. 앞의 ${MAX_PHOTOS}장을 보낼게요`, 3000);
    const keys = []; let failed = 0, why = '';
    for (let i = 0; i < files.length; i++) {
      toast(files.length > 1 ? `사진 보내는 중… ${i + 1}/${files.length}` : '사진 보내는 중…', 60000);
      try { const c = await fileToCanvas(files[i], 1000); keys.push(await putBlob(ctx.store, jpeg(c, 0.7))); } catch (e) { failed++; why = e.message || ''; }
    }
    if (keys.length) await send(keys.length > 1 ? { img: keys[0], imgs: keys } : { img: keys[0] });
    toast(failed ? (keys.length ? `${keys.length}장 보냈어요. ${failed}장은 못 보냈어요` : why || '사진을 보내지 못했어요') : keys.length > 1 ? `사진 ${keys.length}장을 보냈어요` : '사진을 보냈어요', failed ? 3500 : 1400);
  };
  // 삭제: 내가 보낸 말만 지울 수 있다(상대 화면에서도 사라진다). 묶음 사진은 한 장씩도 지울 수 있다
  const keysOf = m => m.imgs ? Object.values(m.imgs) : m.img ? [m.img] : [];
  const delMsg = async id => { const m = msgs[id]; if (!m || m.by !== ctx.uid) return; if (!await ask('이 메시지를 지울까요? 상대 화면에서도 사라져요', '지우기', '취소')) return;
    try { await ctx.store.remove('chat/' + id); keysOf(m).forEach(k => delBlob(ctx.store, k).catch(() => {})); toast('지웠어요'); } catch { toast('지우지 못했어요'); } };
  const delPhoto = async (id, key) => { const m = msgs[id]; if (!m || m.by !== ctx.uid) return false; const rest = keysOf(m).filter(k => k !== key);
    if (!rest.length) { await delMsg(id); return !msgs[id]; }
    if (!await ask('이 사진만 지울까요?', '지우기', '취소')) return false;
    try { await ctx.store.update('chat/' + id, { img: rest[0], imgs: rest.length > 1 ? rest : null }); delBlob(ctx.store, key).catch(() => {}); toast('지웠어요'); return true; } catch { toast('지우지 못했어요'); return false; } };
  const copyText = async t => { try { await navigator.clipboard.writeText(t); } catch { const ta = h('textarea', { style: { position: 'fixed', opacity: 0 } }); ta.value = t; document.body.append(ta); ta.select(); try { document.execCommand('copy'); } catch {} ta.remove(); } toast('복사했어요', 1200); };
  // 길게 누르면(또는 마우스 오른쪽 버튼) 메뉴: 글은 복사, 내가 보낸 것은 삭제
  const holdMenu = (id, row) => { const m = msgs[id]; if (!m) return; const mine = m.by === ctx.uid;
    if (!m.t) { if (mine) delMsg(id); return; }
    modal({ body: h('p', { class: 'hold-quote' }, m.t.length > 120 ? m.t.slice(0, 119) + '…' : m.t),
      actions: [{ label: '📋 복사', primary: true, onClick: close => { close(); copyText(m.t); } }, mine && { label: '삭제', danger: true, onClick: close => { close(); delMsg(id); } }, { label: '닫기' }].filter(Boolean) }); };
  const holdToDelete = (row, id) => { let t = 0, sx = 0, sy = 0;
    const fire = () => { t = 0; row.dataset.held = '1'; setTimeout(() => { delete row.dataset.held; }, 700); holdMenu(id, row); };
    row.addEventListener('pointerdown', e => { sx = e.clientX; sy = e.clientY; clearTimeout(t); t = setTimeout(fire, 550); });
    row.addEventListener('pointermove', e => { if (t && Math.abs(e.clientX - sx) + Math.abs(e.clientY - sy) > 10) { clearTimeout(t); t = 0; } });
    ['pointerup', 'pointercancel', 'pointerleave'].forEach(n => row.addEventListener(n, () => { clearTimeout(t); t = 0; }));
    row.addEventListener('contextmenu', e => { e.preventDefault(); if (!row.dataset.held) { clearTimeout(t); fire(); } });
  };
  const openPhoto = (id, key, src, row) => { if (row.dataset.held) return; const mine = msgs[id] && msgs[id].by === ctx.uid;
    const m = modal({ body: h('img', { class: 'photo-full', src, alt: '사진' }), actions: [mine && { label: '삭제', danger: true, onClick: async close => { if (await delPhoto(id, key)) close(); } }, { label: '닫기' }].filter(Boolean) }); return m; };
  inp.addEventListener('keydown', e => { if (e.key === 'Enter' && !e.shiftKey && !e.isComposing) { e.preventDefault(); sendText(); } });
  inp.addEventListener('input', () => { inp.style.height = ''; inp.style.height = Math.min(110, inp.scrollHeight) + 'px'; });

  function draw() {
    const ids = Object.keys(msgs).sort();
    const sig = ids.map(i => i + ':' + keysOf(msgs[i]).length).join() + '|' + theirRead; if (sig === drawn) return; drawn = sig;
    const nearEnd = list.scrollHeight - list.scrollTop - list.clientHeight < 120;
    let lastDay = ''; const out = [];
    for (const id of ids) {
      const m = msgs[id], mine = m.by === ctx.uid, d = ymd(new Date(m.ts));
      if (d !== lastDay) { out.push(h('div', { class: 'day-sep' }, niceDate(d))); lastDay = d; }
      let body;
      if (m.st) body = h('div', { class: 'st' }, capyEl(ctx.capyOf(m.by, { face: m.st })), h('small', null, (STICKERS.find(s => s[0] === m.st) || [])[1] || ''));
      else if (m.img) {
        const ks = keysOf(m), many = ks.length > 1, follow = im => { im.onload = () => { if (Date.now() < stick || list.scrollHeight - list.scrollTop - list.clientHeight < im.height + 200) list.scrollTop = list.scrollHeight; }; };
        const pic = k => { const im = h('img', { class: many ? 'ph' : 'photo', alt: '사진', draggable: false, onClick: () => im.src && openPhoto(id, k, im.src, im.closest('.msg')) }); follow(im); getBlob(ctx.store, k).then(u => { if (u) im.src = u; }); return im; };
        body = many ? h('div', { class: 'photos n' + (ks.length >= 10 ? 4 : Math.min(ks.length, 3)) }, ks.map(pic)) : pic(ks[0]);
      }
      else body = h('div', { class: 'bubble' }, m.t);
      // 카톡처럼: 상대가 아직 안 읽은 내 말 옆에 노란 1, 읽으면 사라진다
      const unread = mine && ctx.partnerId && m.ts > theirRead;
      const row = h('div', { class: 'msg' + (mine ? ' mine' : ''), 'data-id': id }, !mine && capyEl(ctx.capyOf(m.by, { head: true }), 'mini'), body, h('span', { class: 'meta' }, unread && h('b', { class: 'unread', 'aria-label': '안 읽음' }, '1'), h('small', { class: 'time' }, hm(m.ts))));
      if (mine || m.t) holdToDelete(row, id);
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
  /* 검색: 지난 대화 전체에서 글을 찾는다. 결과를 누르면 그 말로 이동하고, 화면에 없는 옛 대화는 그때 앞뒤 대화를 따로 보여 준다 */
  const dateOf = ts => { const d = new Date(ts); return `${d.getFullYear() !== new Date().getFullYear() ? d.getFullYear() + '년 ' : ''}${niceDate(ymd(d))} ${hm(ts)}`; };
  const mark = (t, q) => { const out = [], low = t.toLowerCase(); let i = 0, k; while ((k = low.indexOf(q, i)) >= 0) { if (k > i) out.push(t.slice(i, k)); out.push(h('mark', null, t.slice(k, k + q.length))); i = k + q.length; } if (i < t.length) out.push(t.slice(i)); return out; };
  const around = (all, ids, id) => { const at = ids.indexOf(id), part = ids.slice(Math.max(0, at - 8), at + 9);
    const body = h('div', { class: 'srch-ctx' }, part.map(i => { const m = all[i]; return h('p', { class: (m.by === ctx.uid ? 'mine' : '') + (i === id ? ' hit' : '') }, h('b', null, ctx.nameOf(m.by)), h('span', null, m.t || (m.img ? '📷 사진' : '🧡 스티커')), h('small', null, hm(m.ts))); }));
    modal({ title: dateOf(all[id].ts), body, actions: [{ label: '닫기', primary: true }] }); setTimeout(() => body.querySelector('.hit')?.scrollIntoView({ block: 'center' }), 60); };
  ctx.chatSearch = async () => {
    const inp = h('input', { class: 'inp', type: 'search', placeholder: '찾을 말 (예: 맛집, 주소, 몇 시)', maxLength: 40, autocomplete: 'off', enterKeyHint: 'search' });
    const info = h('small', { class: 'dim' }, '대화를 불러오는 중…'), res = h('div', { class: 'srch-list' });
    const m = modal({ title: '대화 검색', body: h('div', { class: 'srch' }, inp, info, res), actions: [{ label: '닫기' }] });
    setTimeout(() => inp.focus(), 60);
    let all = {}; try { all = await ctx.store.get('chat') || {}; } catch { info.textContent = '대화를 불러오지 못했어요'; return; }
    const ids = Object.keys(all).sort((a, b) => all[a].ts - all[b].ts || (a < b ? -1 : 1)), texts = ids.filter(i => all[i].t);
    const run = () => {
      const q = inp.value.trim().toLowerCase(); if (!q) { info.textContent = `글로 보낸 말 ${texts.length}개에서 찾아요`; res.replaceChildren(); return; }
      const hits = texts.filter(i => all[i].t.toLowerCase().includes(q)).reverse(); // 최근 것부터
      info.textContent = hits.length ? `${hits.length}개 찾았어요${hits.length > 60 ? ' (최근 60개만 보여요)' : ''}` : '찾는 말이 없어요';
      res.replaceChildren(...hits.slice(0, 60).map(i => h('button', { class: 'srch-hit', onClick: () => {
        const row = list.querySelector(`.msg[data-id="${i}"]`);
        if (!row) return around(all, ids, i); // 화면에 없는 옛 대화
        m(); row.scrollIntoView({ block: 'center' }); row.classList.remove('found'); void row.offsetWidth; row.classList.add('found');
      } }, h('small', null, `${ctx.nameOf(all[i].by)} · ${dateOf(all[i].ts)}`), h('span', null, mark(all[i].t.length > 90 ? all[i].t.slice(0, 89) + '…' : all[i].t, q)))));
    };
    let deb = 0; inp.addEventListener('input', () => { clearTimeout(deb); deb = setTimeout(run, 120); }); run();
  };
  return () => { offs.forEach(f => f()); document.removeEventListener('visibilitychange', markRead); ctx.chatSearch = null; };
}
