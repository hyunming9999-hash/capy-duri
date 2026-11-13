// 오늘 뭐 보실? — 유튜브를 스크린에 틀고 카피바라 둘이 객석에서 같이 보기
import { h, toast, holdBtn, modal } from './ui.js';
import { capy } from './capy.js';

let ytReady = null;
function loadYT() {
  if (!ytReady) ytReady = new Promise((res, rej) => {
    if (window.YT && window.YT.Player) return res();
    const prev = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => { prev && prev(); res(); };
    const s = h('script', { src: 'https://www.youtube.com/iframe_api' });
    s.onerror = () => { ytReady = null; rej(new Error('유튜브를 불러오지 못했어요')); };
    document.head.append(s);
  });
  return ytReady;
}
export const parseVid = u => { u = (u || '').trim(); const m = u.match(/(?:youtu\.be\/|[?&]v=|\/shorts\/|\/embed\/|\/live\/)([\w-]{11})/); return m ? m[1] : /^[\w-]{11}$/.test(u) ? u : null; };

const ROWS = [40, 64, 88], COLS = [12, 27.2, 42.4, 57.6, 72.8, 88];

export function mount(el, ctx) {
  const offs = []; let alive = true, player = null, pReady = false, st = null, quiet = 0, hintT = null;

  /* ----- 스크린 ----- */
  const slot = h('div', { class: 'yt-slot' });
  const hint = h('button', { class: 'play-hint', hidden: true, onClick: () => { hint.hidden = true; try { player.playVideo(); } catch {} } }, '▶ 눌러서 같이 보기');
  const blank = h('div', { class: 'screen-blank' }, h('div', null, h('p', null, '유튜브 영상을 고르면', h('br'), '둘의 스크린에 같이 틀어져요'), h('button', { class: 'btn primary', onClick: () => pickVideo() }, '🎬 영상 고르기')));
  const screen = h('div', { class: 'screen' }, slot, blank, hint);
  const url = h('input', { class: 'inp', placeholder: '유튜브 주소 붙여넣기', inputMode: 'url' });
  const put = s => ctx.store.set('watch/state', { ...s, at: ctx.store.now(), by: ctx.uid }).catch(() => {});
  const playUrl = () => { const v = parseVid(url.value); if (!v) { toast('유튜브 주소를 확인해 주세요'); return false; } url.value = ''; url.blur(); put({ vid: v, playing: true, pos: 0 }); return true; };
  function pickVideo() {
    const close = modal({ title: '영상 고르기', body: h('div', null, h('p', { class: 'dim' }, '유튜브 앱이나 사이트에서 공유 → 링크 복사한 주소를 붙여넣어 주세요.'), url), actions: [{ label: '취소' }, { label: '틀기', primary: true, onClick: c => { if (playUrl()) c(); } }] });
    url.onkeydown = e => { if (e.key === 'Enter' && playUrl()) close(); };
    setTimeout(() => url.focus(), 50);
  }

  function onState(e) {
    if (!st || Date.now() < quiet) return;
    const s = e.data; if (s !== 1 && s !== 2 && s !== 0) return;
    put({ vid: st.vid, playing: s === 1, pos: s === 0 ? 0 : player.getCurrentTime() || 0 });
  }
  function apply() {
    if (!st || !st.vid || !player || !pReady) return;
    quiet = Date.now() + 1500;
    const stale = st.playing && ctx.store.now() - st.at > 4 * 3600e3; // 한참 전에 틀어 둔 채 나간 영상은 멈춘 상태로 연다
    const playing = st.playing && !stale, target = Math.max(0, st.pos + (playing ? (ctx.store.now() - st.at) / 1000 : 0));
    try {
      const curVid = (player.getVideoData() || {}).video_id;
      if (curVid !== st.vid) { playing ? player.loadVideoById(st.vid, target) : player.cueVideoById(st.vid, target); }
      else {
        if (Math.abs((player.getCurrentTime() || 0) - target) > (playing ? 1 : 0.3)) player.seekTo(target, true);
        const ps = player.getPlayerState();
        if (playing && ps !== 1 && ps !== 3) player.playVideo();
        if (!playing && ps === 1) player.pauseVideo();
      }
    } catch (e) { console.warn(e); }
    clearTimeout(hintT); hint.hidden = true;
    if (playing) hintT = setTimeout(() => { try { const ps = player.getPlayerState(); hint.hidden = ps === 1 || ps === 3; } catch {} }, 2500);
  }
  offs.push(ctx.store.on('watch/state', async v => {
    st = v; blank.hidden = !!(v && v.vid);
    if (!v || !v.vid) return;
    if (!player) {
      try { await loadYT(); } catch (e) { return toast(e.message); }
      if (!alive || player) return;
      const target = h('div'); slot.replaceChildren(target);
      player = new YT.Player(target, { videoId: st.vid, width: '100%', height: '100%', playerVars: { playsinline: 1, rel: 0, start: Math.floor(st.pos || 0) },
        events: { onReady: () => { pReady = true; apply(); }, onStateChange: onState, onError: () => toast('이 영상은 여기서 재생할 수 없어요') } });
    } else apply();
  }));

  // 보는 동안 둘의 재생 위치가 1초 넘게 벌어지면 다시 맞춘다
  const driftT = setInterval(() => {
    if (!st || !st.playing || !pReady || Date.now() < quiet) return;
    try { if (player.getPlayerState() === 1 && Math.abs(player.getCurrentTime() - (st.pos + (ctx.store.now() - st.at) / 1000)) > 1) apply(); } catch {}
  }, 4000);

  /* ----- 객석 ----- */
  const hall = h('div', { class: 'hall' });
  ROWS.forEach(y => COLS.forEach(x => hall.append(h('i', { class: 'seat', style: { left: x + '%', top: y + '%', zIndex: Math.round(y * 10) + 5 } }))));
  const avs = {};
  function avatar(uid) {
    if (!avs[uid]) { const a = { el: h('div', { class: 'av' + (uid === ctx.uid ? ' me' : '') }, h('span', { class: 'av-body' }), h('b', null, ctx.nameOf(uid)), h('span', { class: 'say' }), h('span', { class: 'em' })), view: '', et: 0 }; avs[uid] = a; hall.append(a.el); }
    return avs[uid];
  }
  function place(uid, p) {
    const a = avatar(uid), key = p.v + (p.f ? 'f' : '');
    if (a.view !== key) { a.view = key; a.el.firstChild.innerHTML = capy(ctx.capyOf(uid, { view: p.v, face: 'happy' })); a.el.firstChild.style.transform = p.f ? 'scaleX(-1)' : ''; }
    Object.assign(a.el.style, { left: p.x + '%', top: p.y + '%', zIndex: Math.round(p.y * 10) });
    if (p.et && p.et !== a.et) { a.et = p.et; if (ctx.store.now() - p.et < 4000) { const e = a.el.lastChild; e.textContent = p.em; e.classList.remove('pop'); void e.offsetWidth; e.classList.add('pop'); } }
  }
  const me = { x: ctx.idx ? COLS[3] : COLS[2], y: ROWS[1], v: 'back', f: false, em: '', et: 0 };
  try { Object.assign(me, JSON.parse(sessionStorage.getItem('capy.seat') || '{}')); } catch {}
  let lastSent = 0, dirty = true, idleT = null;
  const sync = force => {
    place(ctx.uid, me);
    const now = Date.now(); if (!force && now - lastSent < 100) { dirty = true; return; }
    lastSent = now; dirty = false;
    ctx.store.set('rt/seat/' + ctx.uid, { x: +me.x.toFixed(1), y: +me.y.toFixed(1), v: me.v, f: me.f, em: me.em, et: me.et }).catch(() => {});
    try { sessionStorage.setItem('capy.seat', JSON.stringify({ x: me.x, y: me.y })); } catch {}
  };
  const keys = new Set(); let raf = 0, last = 0;
  function step(t) {
    raf = 0; if (!alive) return;
    const dt = Math.min(0.05, (t - last) / 1000 || 0.016); last = t;
    const dx = (keys.has('R') ? 1 : 0) - (keys.has('L') ? 1 : 0), dy = (keys.has('D') ? 1 : 0) - (keys.has('U') ? 1 : 0);
    if (!dx && !dy) { // 멈추면 가까운 자리에 앉아 스크린을 본다
      clearTimeout(idleT); idleT = setTimeout(() => {
        const ry = ROWS.reduce((a, b) => Math.abs(b - me.y) < Math.abs(a - me.y) ? b : a), rx = COLS.reduce((a, b) => Math.abs(b - me.x) < Math.abs(a - me.x) ? b : a);
        if (Math.abs(ry - me.y) < 10 && Math.abs(rx - me.x) < 7.7) { me.x = rx; me.y = ry; }
        me.v = 'back'; me.f = false; sync(true);
      }, 500);
      if (dirty) sync(true);
      return;
    }
    clearTimeout(idleT);
    me.x = Math.min(96, Math.max(4, me.x + dx * 46 * dt)); me.y = Math.min(96, Math.max(26, me.y + dy * 60 * dt));
    me.v = dy < 0 ? 'back' : 'front'; if (dx) me.f = dx < 0;
    sync(); raf = requestAnimationFrame(step);
  }
  const press = (k, on) => { on ? keys.add(k) : keys.delete(k); if (!raf) { last = performance.now(); raf = requestAnimationFrame(step); } };
  const KEY = { ArrowUp: 'U', ArrowDown: 'D', ArrowLeft: 'L', ArrowRight: 'R', w: 'U', s: 'D', a: 'L', d: 'R' };
  const kd = e => { const k = KEY[e.key]; if (!k || /INPUT|TEXTAREA/.test(document.activeElement?.tagName || '')) return; e.preventDefault(); press(k, true); };
  const ku = e => { const k = KEY[e.key]; if (k) press(k, false); };
  window.addEventListener('keydown', kd); window.addEventListener('keyup', ku);
  const pad = h('div', { class: 'dpad' }, [['U', '▲'], ['L', '◀'], ['D', '▼'], ['R', '▶']].map(([k, t]) => { const b = h('button', { class: 'dp dp-' + k, 'aria-label': k }, t); holdBtn(b, () => press(k, true), () => press(k, false)); return b; }));
  const emo = h('div', { class: 'emos' }, ['❤️', '😆', '👏', '🍿'].map(x => h('button', { class: 'emo', onClick: () => { me.em = x; me.et = ctx.store.now(); sync(true); } }, x)));

  // 같이 보면서 톡: '오늘 얘기나 하지?'와 같은 대화. 최근 몇 줄은 객석 위에 겹쳐 보이고, 새 말은 카피바라 머리 위에도 잠깐 뜬다
  const log = h('div', { class: 'w-log', 'aria-live': 'polite' }), since = ctx.store.now(); let lastSaid = '', readAt = 0;
  const msgInp = h('input', { class: 'inp', placeholder: '메시지 보내기', maxLength: 300, enterKeyHint: 'send', autocomplete: 'off' });
  const sendMsg = () => { const t = msgInp.value.trim(); if (!t) return; msgInp.value = ''; ctx.store.push('chat', { by: ctx.uid, ts: ctx.store.now(), t }).catch(() => {}); };
  msgInp.addEventListener('keydown', e => { if (e.key === 'Enter' && !e.isComposing) { e.preventDefault(); sendMsg(); } });
  offs.push(ctx.store.on('chat', v => {
    v = v || {}; const ids = Object.keys(v).sort();
    log.replaceChildren(...ids.slice(-3).map(id => { const m = v[id]; return h('p', { class: m.by === ctx.uid ? 'mine' : '' }, h('b', null, ctx.nameOf(m.by)), ' ', m.t || (m.img ? '📷 사진' : m.st ? '🧡 스티커' : '')); }));
    const theirs = Math.max(0, ...ids.map(i => v[i]).filter(m => m.by !== ctx.uid).map(m => m.ts));
    if (theirs > readAt && !document.hidden) { readAt = theirs; ctx.store.set('read/' + ctx.uid, theirs).catch(() => {}); }
    const id = ids[ids.length - 1], m = id && v[id];
    if (!m || id === lastSaid || m.ts < since - 2000 || !avs[m.by]) return; lastSaid = id;
    const el = avs[m.by].el.querySelector('.say'); el.textContent = m.t ? (m.t.length > 22 ? m.t.slice(0, 21) + '…' : m.t) : m.img ? '📷 사진' : '💬';
    el.classList.remove('pop'); void el.offsetWidth; el.classList.add('pop');
  }, { limit: 12 }));

  // 화면을 한 장에 고정: 영상·객석·입력칸이 항상 보이고, 키보드가 올라오면 그만큼 줄어든다
  const vv = window.visualViewport, root = document.documentElement;
  const fit = () => { root.style.setProperty('--vvh', (vv ? vv.height : window.innerHeight) + 'px'); root.style.setProperty('--vvt', (vv ? vv.offsetTop : 0) + 'px'); };
  fit(); root.classList.add('fixed-page');
  if (vv) { vv.addEventListener('resize', fit); vv.addEventListener('scroll', fit); } window.addEventListener('resize', fit);

  offs.push(ctx.store.on('rt/seat', v => { for (const [u, p] of Object.entries(v || {})) if (u !== ctx.uid && ctx.members[u] && p) place(u, p); }));
  sync(true);

  hall.append(pad, emo); // 방향키·이모티콘은 객석 위에 겹쳐 둔다
  el.append(h('div', { class: 'theater' }, h('div', { class: 'curtain' }, screen), hall), log, // 최근 톡은 맨 아래, 입력칸 바로 위
    h('div', { class: 'w-composer' }, h('button', { class: 'ic', 'aria-label': '영상 고르기', title: '영상 고르기', onClick: pickVideo }, '🎬'), msgInp, h('button', { class: 'btn primary', onClick: sendMsg }, '보내기')));

  return () => {
    alive = false; offs.forEach(f => f()); clearTimeout(hintT); clearTimeout(idleT); clearInterval(driftT);
    root.classList.remove('fixed-page'); root.style.removeProperty('--vvh'); root.style.removeProperty('--vvt');
    if (vv) { vv.removeEventListener('resize', fit); vv.removeEventListener('scroll', fit); } window.removeEventListener('resize', fit);
    window.removeEventListener('keydown', kd); window.removeEventListener('keyup', ku);
    try { player && player.destroy(); } catch {}
    ctx.store.remove('rt/seat/' + ctx.uid).catch(() => {});
  };
}
