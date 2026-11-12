// 카피바라 산책시키실? — 도트 느낌의 공원을 옷 입은 카피바라로 돌아다니며 실시간 음성 대화(WebRTC)
// 공원 배경·나무는 도트 그림 그대로 크게 늘리고, 카피바라는 메인 화면처럼 또렷한 그림으로 그 위에 그린다
import { h, toast, holdBtn, loadImg, josa } from './ui.js';
import { capy } from './capy.js';

/* ---------- 공원 그림 (192×144 저해상도로 그려 크게 늘려 보여 준다) ---------- */
const W = 192, H = 144, SW = 28, SH = 36.9;
const POND = { x: 150, y: 40, rx: 30, ry: 17 };
const TREES = [[18, 30], [52, 20], [96, 26], [14, 96], [178, 96], [120, 128], [64, 132], [176, 132]];
const BENCH = [[86, 60], [44, 100]];
const rnd = (() => { let s = 20261113; return () => (s = (s * 1664525 + 1013904223) >>> 0) / 4294967296; })();
function drawPark() {
  const c = h('canvas', { width: W, height: H }), g = c.getContext('2d');
  g.fillStyle = '#9BD46F'; g.fillRect(0, 0, W, H);
  for (let i = 0; i < 900; i++) { g.fillStyle = ['#8CC862', '#A8DE7C', '#93CE68'][i % 3]; g.fillRect(Math.floor(rnd() * W), Math.floor(rnd() * H), 2, 1); }
  // 흙길: 공원을 한 바퀴 도는 고리
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) { const d = Math.hypot((x - 92) / 62, (y - 82) / 40); if (d > 0.82 && d < 1.06) { g.fillStyle = (x * 7 + y * 13) % 11 === 0 ? '#D9B88A' : '#E8CFA4'; g.fillRect(x, y, 1, 1); } }
  // 연못
  for (let y = POND.y - POND.ry - 2; y <= POND.y + POND.ry + 2; y++) for (let x = POND.x - POND.rx - 2; x <= POND.x + POND.rx + 2; x++) { const d = Math.hypot((x - POND.x) / POND.rx, (y - POND.y) / POND.ry); if (d < 1.08) { g.fillStyle = d > 1 ? '#C9B27C' : d > 0.86 ? '#8ED3E8' : '#6FC3E0'; g.fillRect(x, y, 1, 1); } }
  g.fillStyle = '#C8EEF8'; [[140, 34, 8], [156, 44, 6], [146, 48, 5]].forEach(([x, y, w]) => g.fillRect(x, y, w, 1));
  g.fillStyle = '#7CC45B'; g.fillRect(162, 36, 5, 3); g.fillStyle = '#FF9EB5'; g.fillRect(164, 35, 2, 2); // 연잎과 꽃
  // 꽃밭
  for (let i = 0; i < 46; i++) { const x = Math.floor(rnd() * W), y = Math.floor(rnd() * H), d = Math.hypot((x - 92) / 62, (y - 82) / 40); if ((d > 0.78 && d < 1.1) || Math.hypot((x - POND.x) / POND.rx, (y - POND.y) / POND.ry) < 1.2) continue; g.fillStyle = ['#FFF3B0', '#FF9EB5', '#FFFFFF', '#FFC93C', '#C9A7F5'][i % 5]; g.fillRect(x, y, 2, 2); g.fillStyle = '#5BA65B'; g.fillRect(x, y + 2, 1, 1); }
  return c;
}
function drawTree(g, x, y) { // (x, y) = 나무 밑동
  g.fillStyle = 'rgba(0,0,0,.14)'; g.fillRect(x - 8, y - 1, 16, 3);
  g.fillStyle = '#8A5E3B'; g.fillRect(x - 2, y - 9, 4, 9); g.fillStyle = '#6E4A2E'; g.fillRect(x - 2, y - 9, 1, 9);
  g.fillStyle = '#4E9A4A'; g.fillRect(x - 9, y - 22, 18, 12); g.fillRect(x - 7, y - 26, 14, 18); g.fillRect(x - 11, y - 19, 22, 7);
  g.fillStyle = '#6BBE5E'; g.fillRect(x - 6, y - 25, 9, 6); g.fillRect(x - 9, y - 20, 6, 4); g.fillStyle = '#3F8440'; g.fillRect(x + 2, y - 13, 7, 3);
}
function drawBench(g, x, y) {
  g.fillStyle = 'rgba(0,0,0,.14)'; g.fillRect(x - 9, y, 18, 2);
  g.fillStyle = '#B9855A'; g.fillRect(x - 9, y - 9, 18, 3); g.fillRect(x - 9, y - 5, 18, 3); g.fillStyle = '#8A5E3B'; g.fillRect(x - 8, y - 2, 2, 3); g.fillRect(x + 6, y - 2, 2, 3);
}
const blocked = (x, y) => Math.hypot((x - POND.x) / (POND.rx + 3), (y - 3 - POND.y) / (POND.ry + 2)) < 1 || TREES.some(([tx, ty]) => Math.abs(x - tx) < 6 && Math.abs(y - ty) < 4) || BENCH.some(([bx, by]) => Math.abs(x - bx) < 11 && Math.abs(y - by) < 4);

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
  const bg = drawPark(), tags = h('div', { class: 'park-tags' }), wrap = h('div', { class: 'park-wrap' }, canvas, tags);
  const treeImg = h('canvas', { width: 24, height: 30 }), benchImg = h('canvas', { width: 20, height: 12 });
  drawTree(treeImg.getContext('2d'), 12, 28); drawBench(benchImg.getContext('2d'), 10, 10);
  const me = { x: ctx.idx ? 104 : 84, y: 118, v: 'front', f: false, m: false, mu: false };
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
  const kd = e => { const k = KEY[e.key]; if (!k || /INPUT|TEXTAREA/.test(document.activeElement?.tagName || '')) return; e.preventDefault(); keys.add(k); };
  const ku = e => { const k = KEY[e.key]; if (k) keys.delete(k); };
  window.addEventListener('keydown', kd); window.addEventListener('keyup', ku);
  const wake = () => voice.wake(); window.addEventListener('pointerdown', wake);
  const pad = h('div', { class: 'dpad big' }, [['U', '▲'], ['L', '◀'], ['D', '▼'], ['R', '▶']].map(([k, t]) => { const b = h('button', { class: 'dp dp-' + k, 'aria-label': k }, t); holdBtn(b, () => keys.add(k), () => keys.delete(k)); return b; }));
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
    send(t);
    // 그리기: 도트 배경 → y 순서대로 나무·벤치(도트)·카피바라(또렷하게)
    g.imageSmoothingEnabled = false; g.drawImage(bg, 0, 0, canvas.width, canvas.height);
    const list = [...TREES.map(([x, y]) => ({ y, d: () => { g.imageSmoothingEnabled = false; g.drawImage(treeImg, Math.round((x - 12) * S), Math.round((y - 28) * S), Math.round(24 * S), Math.round(30 * S)); } })),
      ...BENCH.map(([x, y]) => ({ y, d: () => { g.imageSmoothingEnabled = false; g.drawImage(benchImg, Math.round((x - 10) * S), Math.round((y - 10) * S), Math.round(20 * S), Math.round(12 * S)); } }))];
    const all = { [ctx.uid]: me, ...others };
    for (const [u, p] of Object.entries(all)) {
      if (!ctx.members[u]) continue;
      if (u !== ctx.uid) { p.x += (p.tx - p.x) * Math.min(1, dt * 12); p.y += (p.ty - p.y) * Math.min(1, dt * 12); }
      const bob = p.m ? Math.abs(Math.sin(t / 110)) * 1.6 : 0;
      list.push({ y: p.y, d: () => {
        g.fillStyle = 'rgba(0,0,0,.18)'; g.beginPath(); g.ellipse(p.x * S, (p.y - 0.5) * S, 9 * S, 2.6 * S, 0, 0, 7); g.fill();
        const im = sprite(u, p.v); if (!im) return;
        g.imageSmoothingEnabled = true; g.imageSmoothingQuality = 'high'; g.save(); g.translate(p.x * S, 0); if (p.f) g.scale(-1, 1); g.drawImage(im, -SW / 2 * S, (p.y - SH + 1.5 - bob) * S, SW * S, SH * S); g.restore();
      } });
      const el = tag(u), talking = (level[u] || 0) > 0.045 && !p.mu; el.style.left = (p.x / W * 100) + '%'; el.style.top = ((p.y - SH - 0.5) / H * 100) + '%';
      el.classList.toggle('talk', talking); el.firstChild.textContent = talking ? '🔊' : p.mu && (u === ctx.uid ? voice.on : peerOn) ? '🔇' : '';
    }
    list.sort((a, b) => a.y - b.y).forEach(o => o.d());
  }

  const offs = [];
  offs.push(ctx.store.on('rt/park', v => {
    for (const [u, p] of Object.entries(v || {})) { if (u === ctx.uid || !p) continue; const o = others[u] || (others[u] = { x: p.x, y: p.y }); Object.assign(o, { tx: p.x, ty: p.y, v: p.v || 'front', f: !!p.f, m: !!p.m, mu: !!p.mu }); }
    for (const u of Object.keys(others)) if (!(v || {})[u]) { delete others[u]; tagEls[u] && tagEls[u].remove(); delete tagEls[u]; }
  }));
  offs.push(ctx.store.on('dress', () => { for (const k of Object.keys(sprites)) delete sprites[k]; })); // 옷을 갈아입으면 그림을 다시 만든다
  me.mu = mode !== 'on';
  ctx.store.ephemeral('rt/park/' + ctx.uid, { x: me.x, y: me.y, v: me.v, f: false, m: false, mu: me.mu }).catch(() => {});

  // 화면을 한 장에 고정: 공원 → 음성 → 방향키(맨 아래)
  const vv = window.visualViewport, root = document.documentElement;
  const fit = () => { root.style.setProperty('--vvh', (vv ? vv.height : window.innerHeight) + 'px'); root.style.setProperty('--vvt', (vv ? vv.offsetTop : 0) + 'px'); };
  fit(); root.classList.add('fixed-page');
  if (vv) { vv.addEventListener('resize', fit); vv.addEventListener('scroll', fit); } window.addEventListener('resize', fit);

  el.append(wrap,
    h('div', { class: 'voice-bar' }, vStatus, seg),
    h('p', { class: 'dim walk-hint' }, '고른 음성 모드는 기억해 두고, 다음에 산책에 들어오면 그대로 켜져요. 이어폰을 끼면 울림이 줄어요. 목소리는 저장되지 않고, 이 화면을 나가면 마이크가 꺼져요.'),
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
