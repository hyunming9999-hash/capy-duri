// 카피바라 목욕하실? — 도트 느낌의 히노끼탕을 옷 입은 카피바라로 돌아다니며 실시간 음성 대화(WebRTC)
// 배경·소품은 도트 그림 그대로 크게 늘리고, 카피바라는 메인 화면처럼 또렷한 그림으로 그 위에 그린다. 탕 안에 들어가면 몸이 물에 잠긴다.
import { h, toast, holdBtn, loadImg, josa } from './ui.js';
import { capy } from './capy.js';

/* ---------- 히노끼탕 그림 (192×144 저해상도로 그려 크게 늘려 보여 준다) ---------- */
const W = 192, H = 144, SW = 28, SH = 36.9;
const TUB = { x0: 34, y0: 46, x1: 158, y1: 108, rim: 5, face: 12 }; // 바깥 테두리, 테두리 두께, 앞면 높이
const WATER = { x0: TUB.x0 + TUB.rim, y0: TUB.y0 + TUB.rim, x1: TUB.x1 - TUB.rim, y1: TUB.y1 - TUB.rim };
const inWater = (x, y) => x > WATER.x0 + 3 && x < WATER.x1 - 3 && y > WATER.y0 + 8 && y < WATER.y1 + 1;
const rnd = (() => { let s = 20261113; return () => (s = (s * 1664525 + 1013904223) >>> 0) / 4294967296; })();
const px = (g, c, x, y, w = 1, hh = 1) => { g.fillStyle = c; g.fillRect(x, y, w, hh); };
function drawBath() {
  const c = h('canvas', { width: W, height: H }), g = c.getContext('2d');
  // 뒷벽: 대나무 울타리 + 처마
  px(g, '#5E8C3A', 0, 0, W, 34);
  for (let x = 0; x < W; x += 6) { px(g, '#7DB24F', x, 4, 5, 30); px(g, '#9BCB67', x + 1, 4, 1, 30); px(g, '#4E7A30', x + 4, 4, 1, 30); for (const y of [12, 23]) px(g, '#5E8C3A', x, y + (x % 12 ? 2 : 0), 5, 1); }
  px(g, '#6B4A33', 0, 0, W, 4); px(g, '#8A6347', 0, 3, W, 1); px(g, '#3E2C20', 0, 30, W, 1); px(g, '#8A6347', 0, 31, W, 3);
  // 바닥: 히노끼 나무판
  for (let y = 34; y < H; y++) for (let x = 0; x < W; x++) { const row = Math.floor((y - 34) / 7), seam = (y - 34) % 7 === 6, joint = (x + row * 23) % 48 === 0; px(g, seam || joint ? '#C9A274' : (x * 3 + y * 7) % 37 === 0 ? '#E2C08F' : '#ECD3A6', x, y); }
  // 탕: 그림자 → 앞면 → 테두리 → 물
  px(g, 'rgba(0,0,0,.12)', TUB.x0 + 3, TUB.y1 + TUB.face, TUB.x1 - TUB.x0, 3);
  for (let x = TUB.x0; x < TUB.x1; x++) for (let y = TUB.y1; y < TUB.y1 + TUB.face; y++) px(g, (x - TUB.x0) % 8 === 0 ? '#B98653' : y === TUB.y1 ? '#C9965F' : '#D8A86E', x, y);
  px(g, '#8E5E31', TUB.x0, TUB.y1 + 3, TUB.x1 - TUB.x0, 2); px(g, '#8E5E31', TUB.x0, TUB.y1 + TUB.face - 4, TUB.x1 - TUB.x0, 2); // 테 두른 띠
  px(g, '#A9763F', TUB.x0 - 1, TUB.y0 - 1, TUB.x1 - TUB.x0 + 2, TUB.y1 - TUB.y0 + 2);
  px(g, '#E9C08A', TUB.x0, TUB.y0, TUB.x1 - TUB.x0, TUB.y1 - TUB.y0);
  for (let x = TUB.x0; x < TUB.x1; x += 9) px(g, '#D3A56D', x, TUB.y0, 1, TUB.rim);
  px(g, '#F6D8A8', TUB.x0, TUB.y0, TUB.x1 - TUB.x0, 1);
  for (let y = WATER.y0; y < WATER.y1; y++) for (let x = WATER.x0; x < WATER.x1; x++) { const edge = y < WATER.y0 + 2; px(g, edge ? '#6FB9C9' : '#8FD3DF', x, y); }
  for (let i = 0; i < 26; i++) { const x = WATER.x0 + 4 + Math.floor(rnd() * (WATER.x1 - WATER.x0 - 12)), y = WATER.y0 + 5 + Math.floor(rnd() * (WATER.y1 - WATER.y0 - 8)); px(g, '#C3EDF2', x, y, 4 + Math.floor(rnd() * 5), 1); }
  // 발 매트
  px(g, '#7FA9C9', 82, 124, 30, 12); for (let x = 83; x < 111; x += 3) px(g, '#A8C8E0', x, 125, 1, 10);
  return c;
}
// 소품: [그림 함수, x, 바닥 y, 폭(절반), 깊이(절반)]
const PROPS = [
  [(g) => { px(g, 'rgba(0,0,0,.15)', 1, 15, 16, 2); px(g, '#C98F55', 2, 4, 14, 12); for (let x = 2; x < 16; x += 3) px(g, '#B07A45', x, 4, 1, 12); px(g, '#6E6E78', 2, 6, 14, 1); px(g, '#6E6E78', 2, 13, 14, 1); px(g, '#8FD3DF', 3, 4, 12, 2); px(g, '#E3B57A', 2, 3, 14, 1); }, 18, 128, 7, 3, 18, 18], // 나무 바가지통
  [(g) => { px(g, 'rgba(0,0,0,.15)', 0, 11, 18, 2); px(g, '#D8A86E', 1, 3, 16, 3); px(g, '#B98653', 2, 6, 2, 6); px(g, '#B98653', 14, 6, 2, 6); px(g, '#F0CC93', 1, 3, 16, 1); px(g, '#FFFDF7', 4, 0, 9, 3); px(g, '#8FC1E8', 6, 0, 1, 3); px(g, '#8FC1E8', 9, 0, 1, 3); }, 36, 136, 8, 3, 18, 14], // 목욕 의자 + 수건
  [(g) => { px(g, 'rgba(0,0,0,.15)', 1, 27, 14, 2); px(g, '#9C9AA0', 5, 18, 6, 9); px(g, '#B9B7BC', 2, 14, 12, 4); px(g, '#FFE9A8', 4, 9, 8, 5); px(g, '#FFC93C', 6, 10, 4, 3); px(g, '#9C9AA0', 3, 9, 1, 5); px(g, '#9C9AA0', 12, 9, 1, 5); px(g, '#B9B7BC', 1, 5, 14, 4); px(g, '#D6D4D8', 4, 2, 8, 3); px(g, '#B9B7BC', 7, 0, 2, 2); }, 176, 60, 6, 3, 16, 29], // 석등
  [(g) => { px(g, 'rgba(0,0,0,.15)', 0, 23, 14, 2); px(g, '#A0603A', 2, 15, 10, 8); px(g, '#C27A4C', 2, 15, 10, 2); for (const [x, hh] of [[4, 14], [7, 15], [10, 12]]) { px(g, '#5BA65B', x, 15 - hh, 1, hh); px(g, '#7CC45B', x - 2, 15 - hh + 2, 2, 1); px(g, '#7CC45B', x + 1, 15 - hh + 5, 2, 1); } }, 14, 64, 6, 3, 14, 25], // 화분 대나무
  [(g) => { px(g, 'rgba(0,0,0,.12)', 0, 6, 16, 2); px(g, '#FFB3C7', 0, 1, 16, 5); px(g, '#FFD0DC', 0, 1, 16, 1); px(g, '#F58FB0', 0, 3, 16, 1); }, 178, 130, 8, 2, 16, 8], // 개어 둔 수건
].map(([draw, x, y, hw, hd, cw, ch]) => { const c = h('canvas', { width: cw, height: ch }); draw(c.getContext('2d')); return { c, x, y, hw, hd }; });
const blocked = (x, y) => (x > TUB.x0 - 2 && x < TUB.x1 + 2 && y > TUB.y1 - 1 && y < TUB.y1 + TUB.face + 3) || PROPS.some(p => Math.abs(x - p.x) < p.hw + 4 && Math.abs(y - p.y) < p.hd + 2);

/* ---------- 음성 대화 ---------- */
// 둘 다 "음성 켜기"를 누르면 서로 직접 연결된다(WebRTC). 연결에 필요한 정보만 방 데이터(rt/voice)로 주고받고, 목소리는 저장되지 않는다.
function makeVoice(ctx, ui) {
  let pc = null, stream = null, handled = '', state = {}, ac = null, raf = 0;
  const audio = h('audio', { autoplay: true, playsInline: true }), meters = {};
  const caller = () => ctx.idx === 0;
  const pairOf = r => { const a = r[ctx.order[0]], b = r[ctx.order[1]]; return a && b ? a + ':' + b : ''; };
  const gathered = p => new Promise(res => { if (p.iceGatheringState === 'complete') return res(); const t = setTimeout(res, 2500); p.addEventListener('icegatheringstatechange', () => { if (p.iceGatheringState === 'complete') { clearTimeout(t); res(); } }); });
  const closePc = () => { if (pc) { try { pc.ontrack = pc.onconnectionstatechange = null; pc.close(); } catch {} pc = null; } audio.srcObject = null; delete meters[ctx.partnerId]; };
  function meter(uid, s) { try { ac = ac || new (window.AudioContext || window.webkitAudioContext)(); if (ac.state === 'suspended') ac.resume(); const an = ac.createAnalyser(); an.fftSize = 256; ac.createMediaStreamSource(s).connect(an); meters[uid] = { an, buf: new Uint8Array(an.fftSize) }; } catch {} }
  function levels() { raf = requestAnimationFrame(levels); for (const [u, m] of Object.entries(meters)) { m.an.getByteTimeDomainData(m.buf); let sum = 0; for (const v of m.buf) sum += (v - 128) ** 2; ui.level(u, Math.sqrt(sum / m.buf.length) / 128); } }
  function newPc() {
    closePc();
    pc = new RTCPeerConnection({ iceServers: [{ urls: ['stun:stun.l.google.com:19302', 'stun:stun1.l.google.com:19302'] }] });
    stream.getTracks().forEach(t => pc.addTrack(t, stream));
    const p = pc;
    p.ontrack = e => { audio.srcObject = e.streams[0]; audio.play().catch(() => {}); meter(ctx.partnerId, e.streams[0]); };
    p.onconnectionstatechange = () => { if (p === pc) ui.state(p.connectionState); };
    return p;
  }
  async function onVoice(v) {
    state = v || {}; const ready = state.ready || {}, pair = pairOf(ready);
    ui.peer(!!ready[ctx.partnerId]);
    if (!stream) return;
    try {
      if (!pair) { closePc(); handled = ''; return ui.state('waiting'); }
      if (caller()) {
        if (handled !== pair) { handled = pair; const p = newPc(); ui.state('connecting'); await p.setLocalDescription(await p.createOffer()); await gathered(p); if (p !== pc) return; await ctx.store.set('rt/voice/offer', { sdp: p.localDescription.sdp, pair }); }
        else if (state.answer && state.answer.pair === pair && pc && pc.signalingState === 'have-local-offer') await pc.setRemoteDescription({ type: 'answer', sdp: state.answer.sdp });
      } else if (state.offer && state.offer.pair === pair && handled !== pair) {
        handled = pair; const p = newPc(); ui.state('connecting'); await p.setRemoteDescription({ type: 'offer', sdp: state.offer.sdp }); await p.setLocalDescription(await p.createAnswer()); await gathered(p); if (p !== pc) return; await ctx.store.set('rt/voice/answer', { sdp: p.localDescription.sdp, pair });
      } else if (!pc) ui.state('connecting');
    } catch (e) { console.warn(e); ui.state('failed'); }
  }
  const off = ctx.store.on('rt/voice', v => { onVoice(v); });
  return {
    get on() { return !!stream; },
    get muted() { return !!stream && !stream.getAudioTracks()[0].enabled; },
    async join() {
      if (stream) return;
      if (!navigator.mediaDevices || !window.RTCPeerConnection) throw new Error('이 브라우저에서는 음성 대화를 쓸 수 없어요');
      try { stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true }, video: false }); }
      catch (e) { throw new Error(e && e.name === 'NotAllowedError' ? '마이크 권한이 꺼져 있어요. 브라우저 설정에서 이 사이트의 마이크를 허용해 주세요' : '마이크를 켤 수 없어요'); }
      meter(ctx.uid, stream); if (!raf) levels();
      handled = ''; ui.state('waiting');
      await ctx.store.ephemeral('rt/voice/ready/' + ctx.uid, Math.random().toString(36).slice(2, 10));
    },
    leave() {
      closePc(); cancelAnimationFrame(raf); raf = 0;
      if (stream) { stream.getTracks().forEach(t => t.stop()); stream = null; ctx.store.remove('rt/voice/ready/' + ctx.uid).catch(() => {}); }
      for (const k of Object.keys(meters)) delete meters[k]; handled = ''; ui.state('off');
    },
    setMuted(m) { if (stream) stream.getAudioTracks()[0].enabled = !m; },
    wake() { try { if (audio.srcObject && audio.paused) audio.play().catch(() => {}); if (ac && ac.state === 'suspended') ac.resume(); } catch {} }, // 화면을 누르면 막혀 있던 소리를 다시 튼다
    destroy() { this.leave(); off(); try { ac && ac.close(); } catch {} },
    _pc: () => pc,
  };
}

export function mount(el, ctx) {
  let alive = true, raf = 0, last = 0, sendT = 0, dirty = true, S = 2;
  const canvas = h('canvas', { class: 'park' }), g = canvas.getContext('2d');
  const bg = drawBath(), tags = h('div', { class: 'park-tags' }), wrap = h('div', { class: 'park-wrap' }, canvas, tags);
  // 탕에 떠 있는 유자들
  const yuzus = Array.from({ length: 6 }, (_, i) => ({ x: WATER.x0 + 12 + i * 18 + (i % 2) * 5, y: WATER.y0 + 14 + (i * 13) % 34, ph: i * 1.7, vx: (i % 2 ? 1 : -1) * 2.2 }));
  const steam = Array.from({ length: 14 }, () => ({ x: WATER.x0 + rnd() * (WATER.x1 - WATER.x0), y: WATER.y1 - rnd() * 50, r: 3 + rnd() * 4, v: 5 + rnd() * 5 }));
  const me = { x: ctx.idx ? 172 : 20, y: 100, v: 'front', f: false, m: false, mu: false };
  const others = {}, sprites = {}, tagEls = {}, level = {};
  const keys = new Set();

  // 보이는 크기 × 화면 배율만큼 큰 캔버스에 그려서 캐릭터가 깨져 보이지 않게 한다
  function resize() { const w = wrap.clientWidth || 360, dpr = Math.min(3, window.devicePixelRatio || 1); canvas.width = Math.round(w * dpr); canvas.height = Math.round(canvas.width * H / W); S = canvas.width / W; }
  const ro = 'ResizeObserver' in window ? new ResizeObserver(resize) : null; ro && ro.observe(wrap);

  // 옷 입은 카피바라 그림(메인 화면과 같은 그림)
  function sprite(uid, view) {
    const k = uid + view; if (sprites[k]) return sprites[k].im;
    const o = sprites[k] = { im: null };
    loadImg('data:image/svg+xml;utf8,' + encodeURIComponent(capy(ctx.capyOf(uid, { view, face: 'happy' })).replace('<svg ', '<svg width="480" height="632" '))).then(im => { o.im = im; }).catch(() => {});
    return null;
  }
  const tag = uid => { if (!tagEls[uid]) { tagEls[uid] = h('span', { class: 'park-tag' + (uid === ctx.uid ? ' me' : '') }, h('i', { class: 'mic' }), ctx.nameOf(uid)); tags.append(tagEls[uid]); } return tagEls[uid]; };

  /* 음성: 항상 켜기 / 음소거 / 끄기. 고른 모드는 이 기기에 기억해 두고 다음에 들어올 때 그대로 켠다 */
  const PREF = 'capy.voiceMode';
  let mode = 'off', vState = 'off', peerOn = false, joining = false;
  try { mode = localStorage.getItem(PREF) || 'off'; } catch {}
  const vStatus = h('span', { class: 'v-status' }), seg = h('div', { class: 'seg' });
  const TEXT = { off: '음성 꺼짐', waiting: '상대가 음성을 켜길 기다리는 중…', connecting: '연결하는 중…', new: '연결하는 중…', connected: '연결됨', disconnected: '연결이 잠깐 끊겼어요…', failed: '연결하지 못했어요. 와이파이·데이터를 바꾸거나 껐다 켜 보세요', closed: '연결이 끝났어요' };
  const drawVoice = () => {
    const extra = vState === 'off' && peerOn && ctx.partnerId ? ` · ${josa(ctx.nameOf(ctx.partnerId), '는', '은')} 음성을 켜 두었어요` : vState === 'connected' ? (mode === 'mute' ? ' · 내 마이크는 음소거(상대 소리는 들려요)' : ' · 말해 보세요') : '';
    vStatus.textContent = (joining ? '마이크 켜는 중…' : TEXT[vState] || vState) + extra; vStatus.className = 'v-status ' + vState;
    seg.replaceChildren(...[['on', '🎤 항상 켜기'], ['mute', '🔇 음소거'], ['off', '끄기']].map(([k, t]) => h('button', { class: 'seg-b' + (mode === k ? ' on' : ''), disabled: joining, 'aria-pressed': String(mode === k), onClick: () => setMode(k) }, t)));
  };
  const voice = makeVoice(ctx, { state: s => { vState = s; drawVoice(); }, peer: on => { if (on !== peerOn) { peerOn = on; drawVoice(); } }, level: (u, v) => { level[u] = v; } });
  async function setMode(k, quiet) {
    if (k !== 'off' && ctx.order.length < 2) { if (!quiet) toast('상대가 들어와야 음성 대화를 할 수 있어요'); k = 'off'; }
    if (k === 'off') { mode = 'off'; voice.leave(); }
    else {
      if (!voice.on) { joining = true; drawVoice(); try { await voice.join(); } catch (e) { joining = false; mode = 'off'; if (!quiet) toast(e.message, 4500); drawVoice(); return; } joining = false; if (!alive) return voice.leave(); }
      mode = k; voice.setMuted(k === 'mute');
    }
    try { localStorage.setItem(PREF, mode); } catch {}
    me.mu = mode !== 'on'; dirty = true; drawVoice();
  }

  /* 이동 */
  const KEY = { ArrowUp: 'U', ArrowDown: 'D', ArrowLeft: 'L', ArrowRight: 'R', w: 'U', s: 'D', a: 'L', d: 'R' };
  const kd = e => { if (e.key === ' ' && !/INPUT|TEXTAREA|BUTTON/.test(document.activeElement?.tagName || '')) { e.preventDefault(); if (!e.repeat) hit(); return; } const k = KEY[e.key]; if (!k || /INPUT|TEXTAREA/.test(document.activeElement?.tagName || '')) return; e.preventDefault(); keys.add(k); };
  const ku = e => { const k = KEY[e.key]; if (k) keys.delete(k); };
  window.addEventListener('keydown', kd); window.addEventListener('keyup', ku);
  const wake = () => voice.wake(); window.addEventListener('pointerdown', wake);
  const pad = h('div', { class: 'dpad big hit' }, [['U', '▲'], ['L', '◀'], ['D', '▼'], ['R', '▶']].map(([k, t]) => { const b = h('button', { class: 'dp dp-' + k, 'aria-label': k }, t); holdBtn(b, () => keys.add(k), () => keys.delete(k)); return b; }),
    h('button', { class: 'dp dp-H', 'aria-label': '때리기', onClick: () => hit() }, '👊', h('small', null, '때리기')));
  /* 때리기: 가까이 있는 상대를 치면 상대가 뒤로 밀려난다. 맞은 쪽 화면이 자기 위치를 직접 밀어서 양쪽에 똑같이 보인다 */
  const fx = []; let hitAt = 0, seenHit = '';
  function hit() {
    const now = performance.now(); if (now - hitAt < 600) return; hitAt = now;
    const pid = ctx.partnerId, o = pid && others[pid];
    const dx = o ? o.x - me.x : 0, dy = o ? o.y - me.y : 0;
    if (!o || Math.abs(dx) > 26 || Math.abs(dy) > 16) { fx.push({ x: me.x + (me.f ? -12 : 12), y: me.y - 18, t0: now, s: '휙' }); return; }
    const n = Math.hypot(dx, dy) || 1, ux = n > 1 ? dx / n : (me.f ? -1 : 1), uy = n > 1 ? dy / n : 0;
    if (dx) me.f = dx < 0; dirty = true;
    ctx.store.set('rt/parkhit', { id: Math.random().toString(36).slice(2, 9), from: ctx.uid, to: pid, ux: Math.round(ux * 100) / 100, uy: Math.round(uy * 100) / 100, ts: ctx.store.now() }).catch(() => {});
  }
  function send(t, force) {
    if (!force && (!dirty || t - sendT < 100)) return; sendT = t; dirty = false;
    ctx.store.set('rt/park/' + ctx.uid, { x: Math.round(me.x * 10) / 10, y: Math.round(me.y * 10) / 10, v: me.v, f: me.f, m: me.m, mu: me.mu }).catch(() => {});
  }
  function loop(t) {
    if (!alive) return; raf = requestAnimationFrame(loop);
    if (!canvas.width || Math.abs(canvas.width - Math.round((wrap.clientWidth || 360) * Math.min(3, window.devicePixelRatio || 1))) > 2) resize();
    const dt = Math.min(0.05, (t - (last || t)) / 1000); last = t;
    const dx = (keys.has('R') ? 1 : 0) - (keys.has('L') ? 1 : 0), dy = (keys.has('D') ? 1 : 0) - (keys.has('U') ? 1 : 0), was = me.m;
    me.m = !!(dx || dy);
    if (me.m) {
      const n = Math.hypot(dx, dy), sp = 46 * dt, nx = Math.max(10, Math.min(W - 10, me.x + dx / n * sp)), ny = Math.max(26, Math.min(H - 3, me.y + dy / n * sp));
      if (!blocked(nx, me.y)) me.x = nx; if (!blocked(me.x, ny)) me.y = ny;
      me.v = dy < 0 ? 'back' : 'front'; if (dx) me.f = dx < 0; dirty = true;
    } else if (was) dirty = true;
    if (me.kx || me.ky) { // 맞아서 밀려나는 중
      const nx = Math.max(10, Math.min(W - 10, me.x + me.kx * dt)), ny = Math.max(26, Math.min(H - 3, me.y + me.ky * dt));
      if (!blocked(nx, me.y)) me.x = nx; if (!blocked(me.x, ny)) me.y = ny;
      const d = Math.exp(-6 * dt); me.kx *= d; me.ky *= d; if (Math.hypot(me.kx, me.ky) < 4) me.kx = me.ky = 0; dirty = true;
    }
    send(t);
    // 그리기: 도트 배경 → y 순서대로 소품·유자·카피바라 → 김
    g.imageSmoothingEnabled = false; g.drawImage(bg, 0, 0, canvas.width, canvas.height);
    const list = PROPS.map(p => ({ y: p.y, d: () => { g.imageSmoothingEnabled = false; g.drawImage(p.c, Math.round((p.x - p.c.width / 2) * S), Math.round((p.y - p.c.height + 2) * S), Math.round(p.c.width * S), Math.round(p.c.height * S)); } }));
    for (const z of yuzus) {
      z.x += z.vx * dt; if (z.x < WATER.x0 + 6 || z.x > WATER.x1 - 6) z.vx *= -1;
      const zy = z.y + Math.sin(t / 700 + z.ph) * 0.8;
      list.push({ y: z.y, d: () => { g.fillStyle = 'rgba(255,255,255,.45)'; g.beginPath(); g.ellipse(z.x * S, (zy + 2.2) * S, 4.4 * S, 1.3 * S, 0, 0, 7); g.fill(); g.fillStyle = '#FFC93C'; g.beginPath(); g.arc(z.x * S, zy * S, 3 * S, 0, 7); g.fill(); g.fillStyle = '#E0A21C'; g.beginPath(); g.arc(z.x * S, (zy + 1) * S, 3 * S, 0, Math.PI); g.fill(); g.fillStyle = '#6FB24F'; g.fillRect((z.x - 0.5) * S, (zy - 4) * S, 2.2 * S, 1.2 * S); g.fillStyle = '#FFF3C4'; g.fillRect((z.x - 1.6) * S, (zy - 1.6) * S, 1.1 * S, 1.1 * S); } });
    }
    const all = { [ctx.uid]: me, ...others };
    for (const [u, p] of Object.entries(all)) {
      if (!ctx.members[u]) continue;
      if (u !== ctx.uid) { p.x += (p.tx - p.x) * Math.min(1, dt * 12); p.y += (p.ty - p.y) * Math.min(1, dt * 12); }
      const bob = p.m ? Math.abs(Math.sin(t / 110)) * 1.6 : 0;
      const wet = inWater(p.x, p.y), sink = wet ? 5 : 0, line = p.y - 6; // 탕 안이면 몸을 살짝 내리고 턱 아래부터 물에 잠기게
      list.push({ y: p.y, d: () => {
        if (!wet) { g.fillStyle = 'rgba(0,0,0,.18)'; g.beginPath(); g.ellipse(p.x * S, (p.y - 0.5) * S, 9 * S, 2.6 * S, 0, 0, 7); g.fill(); }
        const im = sprite(u, p.v); if (!im) return;
        g.imageSmoothingEnabled = true; g.imageSmoothingQuality = 'high'; g.save();
        if (wet) { g.beginPath(); g.rect(0, 0, canvas.width, line * S); g.clip(); }
        g.translate(p.x * S, 0); if (p.f) g.scale(-1, 1); g.drawImage(im, -SW / 2 * S, (p.y - SH + 1.5 - bob + sink) * S, SW * S, SH * S); g.restore();
        if (wet) { const r = 11 + Math.sin(t / 260) * 0.8; g.strokeStyle = 'rgba(255,255,255,.75)'; g.lineWidth = 0.9 * S; g.beginPath(); g.ellipse(p.x * S, line * S, r * S, 2.4 * S, 0, 0, 7); g.stroke(); g.strokeStyle = 'rgba(255,255,255,.35)'; g.beginPath(); g.ellipse(p.x * S, (line + 1.2) * S, (r + 4) * S, 3.2 * S, 0, 0, 7); g.stroke(); }
      } });
      const el = tag(u), talking = (level[u] || 0) > 0.045 && !p.mu; el.style.left = (p.x / W * 100) + '%'; el.style.top = ((p.y - SH - 0.5 + sink) / H * 100) + '%';
      el.classList.toggle('talk', talking); el.firstChild.textContent = talking ? '🔊' : p.mu && (u === ctx.uid ? voice.on : peerOn) ? '🔇' : '';
    }
    list.sort((a, b) => a.y - b.y).forEach(o => o.d());
    for (let i = fx.length - 1; i >= 0; i--) { const e = fx[i], k = (t - e.t0) / 450; if (k >= 1 || k < 0) { if (k >= 1) fx.splice(i, 1); continue; }
      g.save(); g.globalAlpha = 1 - k * k; g.font = `900 ${Math.round((e.s === '휙' ? 9 : 12 + k * 6) * S)}px sans-serif`; g.textAlign = 'center'; g.textBaseline = 'middle';
      g.lineWidth = 2.2 * S; g.strokeStyle = '#fff'; g.fillStyle = e.s === '휙' ? '#7A6A58' : '#E8412F'; g.strokeText(e.s, e.x * S, (e.y - k * 8) * S); g.fillText(e.s, e.x * S, (e.y - k * 8) * S); g.restore(); }
    // 김이 모락모락
    for (const st of steam) { st.y -= st.v * dt; st.x += Math.sin(t / 900 + st.r) * 0.08; if (st.y < 8) { st.y = WATER.y1 - 4; st.x = WATER.x0 + rnd() * (WATER.x1 - WATER.x0); } const a = Math.max(0, Math.min(0.32, (st.y - 8) / 120)); g.fillStyle = `rgba(255,255,255,${a})`; g.beginPath(); g.arc(st.x * S, st.y * S, st.r * S * (1.6 - st.y / H), 0, 7); g.fill(); }
  }

  const offs = [];
  offs.push(ctx.store.on('rt/park', v => {
    for (const [u, p] of Object.entries(v || {})) { if (u === ctx.uid || !p) continue; const o = others[u] || (others[u] = { x: p.x, y: p.y }); Object.assign(o, { tx: p.x, ty: p.y, v: p.v || 'front', f: !!p.f, m: !!p.m, mu: !!p.mu }); }
    for (const u of Object.keys(others)) if (!(v || {})[u]) { delete others[u]; tagEls[u] && tagEls[u].remove(); delete tagEls[u]; }
  }));
  offs.push(ctx.store.on('rt/parkhit', v => {
    if (!v || v.id === seenHit || Math.abs(ctx.store.now() - v.ts) > 3000) return; seenHit = v.id;
    const tgt = v.to === ctx.uid ? me : others[v.to]; if (tgt) fx.push({ x: tgt.x, y: tgt.y - 22, t0: performance.now(), s: '퍽!' });
    if (v.to === ctx.uid) { me.kx = (v.ux || 0) * 200; me.ky = (v.uy || 0) * 200; if (navigator.vibrate) try { navigator.vibrate(60); } catch {} }
  }));
  offs.push(ctx.store.on('dress', () => { for (const k of Object.keys(sprites)) delete sprites[k]; })); // 옷을 갈아입으면 그림을 다시 만든다
  me.mu = mode !== 'on';
  ctx.store.ephemeral('rt/park/' + ctx.uid, { x: me.x, y: me.y, v: me.v, f: false, m: false, mu: me.mu }).catch(() => {});

  // 화면을 한 장에 고정: 탕 → 음성 → 방향키(맨 아래)
  const vv = window.visualViewport, root = document.documentElement;
  const fit = () => { root.style.setProperty('--vvh', (vv ? vv.height : window.innerHeight) + 'px'); root.style.setProperty('--vvt', (vv ? vv.offsetTop : 0) + 'px'); };
  fit(); root.classList.add('fixed-page');
  if (vv) { vv.addEventListener('resize', fit); vv.addEventListener('scroll', fit); } window.addEventListener('resize', fit);

  el.append(wrap,
    h('div', { class: 'voice-bar' }, vStatus, seg),
    h('p', { class: 'dim walk-hint' }, '탕 안으로 걸어 들어가면 카피바라가 몸을 담가요. 고른 음성 모드는 기억해 두고 다음에 들어오면 그대로 켜져요. 목소리는 저장되지 않고, 이 화면을 나가면 마이크가 꺼져요.'),
    h('div', { class: 'pad-dock' }, pad));
  resize(); drawVoice(); raf = requestAnimationFrame(loop);
  if (mode !== 'off') setMode(mode, true); // 지난번에 켜 둔 모드 그대로
  window.__capyVoice = voice; // 연결 상태 점검용
  return () => {
    alive = false; cancelAnimationFrame(raf); offs.forEach(f => f()); voice.destroy(); window.__capyVoice = null; ro && ro.disconnect();
    window.removeEventListener('keydown', kd); window.removeEventListener('keyup', ku); window.removeEventListener('pointerdown', wake);
    root.classList.remove('fixed-page'); root.style.removeProperty('--vvh'); root.style.removeProperty('--vvt');
    if (vv) { vv.removeEventListener('resize', fit); vv.removeEventListener('scroll', fit); } window.removeEventListener('resize', fit);
    ctx.store.remove('rt/park/' + ctx.uid).catch(() => {});
  };
}
