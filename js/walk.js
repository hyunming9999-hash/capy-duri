// 카피바라 산책시키실? — 도트 느낌의 공원을 옷 입은 카피바라로 돌아다니며 실시간 음성 대화(WebRTC)
import { h, toast, holdBtn, loadImg, josa } from './ui.js';
import { capyUrl } from './capy.js';

/* ---------- 공원 그림 (192×144 저해상도로 그려 크게 늘려 보여 준다) ---------- */
const W = 192, H = 144, SW = 24, SH = 32;
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
    toggleMute() { if (stream) { const t = stream.getAudioTracks()[0]; t.enabled = !t.enabled; } },
    destroy() { this.leave(); off(); try { ac && ac.close(); } catch {} },
    _pc: () => pc,
  };
}

export function mount(el, ctx) {
  let alive = true, raf = 0, last = 0, sendT = 0, dirty = true;
  const canvas = h('canvas', { class: 'park', width: W, height: H }), g = canvas.getContext('2d'); g.imageSmoothingEnabled = false;
  const bg = drawPark(), tags = h('div', { class: 'park-tags' }), wrap = h('div', { class: 'park-wrap' }, canvas, tags);
  const me = { x: ctx.idx ? 104 : 84, y: 118, v: 'front', f: false, m: false };
  const others = {}, sprites = {}, tagEls = {}, level = {};
  const keys = new Set();

  // 옷 입은 카피바라 그림을 작게 줄여 도트처럼 쓴다
  function sprite(uid, view) {
    const k = uid + view; if (sprites[k]) return sprites[k].c;
    const c = h('canvas', { width: SW, height: SH }); sprites[k] = { c };
    loadImg(capyUrl(ctx.capyOf(uid, { view, face: 'happy' }))).then(im => { const x = c.getContext('2d'); x.imageSmoothingEnabled = true; x.imageSmoothingQuality = 'high'; x.clearRect(0, 0, SW, SH); x.drawImage(im, 0, 0, SW, SH); }).catch(() => {});
    return c;
  }
  const tag = uid => { if (!tagEls[uid]) { tagEls[uid] = h('span', { class: 'park-tag' + (uid === ctx.uid ? ' me' : '') }, h('i', { class: 'mic' }, '🔊'), ctx.nameOf(uid)); tags.append(tagEls[uid]); } return tagEls[uid]; };

  /* 음성 */
  const vStatus = h('span', { class: 'v-status' }, '음성 꺼짐');
  const vBtn = h('button', { class: 'btn primary' }, '🎤 음성 켜기'), mBtn = h('button', { class: 'btn', hidden: true }, '음소거');
  let vState = 'off', peerOn = false;
  const TEXT = { off: '음성 꺼짐', waiting: '상대가 음성을 켜길 기다리는 중…', connecting: '연결하는 중…', new: '연결하는 중…', connected: '연결됨 · 말해 보세요', disconnected: '연결이 잠깐 끊겼어요…', failed: '연결하지 못했어요. 와이파이·데이터를 바꾸거나 다시 켜 보세요', closed: '연결이 끝났어요' };
  const drawVoice = () => {
    vStatus.textContent = (TEXT[vState] || vState) + (vState === 'off' && peerOn && ctx.partnerId ? ` · ${josa(ctx.nameOf(ctx.partnerId), '는', '은')} 음성을 켜 두었어요` : '');
    vStatus.className = 'v-status ' + vState; vBtn.textContent = voice.on ? '음성 끄기' : '🎤 음성 켜기'; vBtn.classList.toggle('primary', !voice.on);
    mBtn.hidden = !voice.on; mBtn.textContent = voice.muted ? '🔇 음소거 풀기' : '음소거';
  };
  const voice = makeVoice(ctx, { state: s => { vState = s; drawVoice(); }, peer: on => { if (on !== peerOn) { peerOn = on; drawVoice(); } }, level: (u, v) => { level[u] = v; } });
  vBtn.onclick = async () => { if (voice.on) { voice.leave(); drawVoice(); return; } if (ctx.order.length < 2) return toast('상대가 들어와야 음성 대화를 할 수 있어요'); vBtn.disabled = true; try { await voice.join(); } catch (e) { toast(e.message, 4500); } vBtn.disabled = false; drawVoice(); };
  mBtn.onclick = () => { voice.toggleMute(); drawVoice(); };

  /* 이동 */
  const KEY = { ArrowUp: 'U', ArrowDown: 'D', ArrowLeft: 'L', ArrowRight: 'R', w: 'U', s: 'D', a: 'L', d: 'R' };
  const kd = e => { const k = KEY[e.key]; if (!k || /INPUT|TEXTAREA/.test(document.activeElement?.tagName || '')) return; e.preventDefault(); keys.add(k); };
  const ku = e => { const k = KEY[e.key]; if (k) keys.delete(k); };
  window.addEventListener('keydown', kd); window.addEventListener('keyup', ku);
  const pad = h('div', { class: 'dpad' }, [['U', '▲'], ['L', '◀'], ['D', '▼'], ['R', '▶']].map(([k, t]) => { const b = h('button', { class: 'dp dp-' + k, 'aria-label': k }, t); holdBtn(b, () => keys.add(k), () => keys.delete(k)); return b; }));
  function send(t, force) {
    if (!force && (!dirty || t - sendT < 100)) return; sendT = t; dirty = false;
    ctx.store.set('rt/park/' + ctx.uid, { x: Math.round(me.x * 10) / 10, y: Math.round(me.y * 10) / 10, v: me.v, f: me.f, m: me.m }).catch(() => {});
  }
  function loop(t) {
    if (!alive) return; raf = requestAnimationFrame(loop);
    const dt = Math.min(0.05, (t - (last || t)) / 1000); last = t;
    const dx = (keys.has('R') ? 1 : 0) - (keys.has('L') ? 1 : 0), dy = (keys.has('D') ? 1 : 0) - (keys.has('U') ? 1 : 0), was = me.m;
    me.m = !!(dx || dy);
    if (me.m) {
      const n = Math.hypot(dx, dy), sp = 46 * dt, nx = Math.max(8, Math.min(W - 8, me.x + dx / n * sp)), ny = Math.max(22, Math.min(H - 3, me.y + dy / n * sp));
      if (!blocked(nx, me.y)) me.x = nx; if (!blocked(me.x, ny)) me.y = ny;
      me.v = dy < 0 ? 'back' : 'front'; if (dx) me.f = dx < 0; dirty = true;
    } else if (was) dirty = true;
    send(t);
    // 그리기: 배경 → y 순서대로 나무·벤치·카피바라
    g.drawImage(bg, 0, 0);
    const list = [...TREES.map(([x, y]) => ({ y, d: () => drawTree(g, x, y) })), ...BENCH.map(([x, y]) => ({ y, d: () => drawBench(g, x, y) }))];
    const all = { [ctx.uid]: me, ...others };
    for (const [u, p] of Object.entries(all)) {
      if (!ctx.members[u]) continue;
      if (u !== ctx.uid) { p.x += (p.tx - p.x) * Math.min(1, dt * 12); p.y += (p.ty - p.y) * Math.min(1, dt * 12); }
      const bob = p.m && Math.floor(t / 140) % 2 ? 1 : 0, px = Math.round(p.x), py = Math.round(p.y);
      list.push({ y: p.y, d: () => { g.fillStyle = 'rgba(0,0,0,.16)'; g.fillRect(px - 7, py - 1, 14, 2); const s = sprite(u, p.v); g.save(); g.translate(px, 0); if (p.f) g.scale(-1, 1); g.drawImage(s, -SW / 2, py - SH + 1 - bob); g.restore(); } });
      const el = tag(u); el.style.left = (p.x / W * 100) + '%'; el.style.top = ((p.y - SH - 1) / H * 100) + '%'; el.classList.toggle('talk', (level[u] || 0) > 0.045);
    }
    list.sort((a, b) => a.y - b.y).forEach(o => o.d());
  }

  const offs = [];
  offs.push(ctx.store.on('rt/park', v => {
    for (const [u, p] of Object.entries(v || {})) { if (u === ctx.uid || !p) continue; const o = others[u] || (others[u] = { x: p.x, y: p.y }); Object.assign(o, { tx: p.x, ty: p.y, v: p.v || 'front', f: !!p.f, m: !!p.m }); }
    for (const u of Object.keys(others)) if (!(v || {})[u]) { delete others[u]; tagEls[u] && tagEls[u].remove(); delete tagEls[u]; }
  }));
  offs.push(ctx.store.on('dress', () => { for (const k of Object.keys(sprites)) delete sprites[k]; })); // 옷을 갈아입으면 그림을 다시 만든다
  ctx.store.ephemeral('rt/park/' + ctx.uid, { x: me.x, y: me.y, v: me.v, f: false, m: false }).catch(() => {});

  el.append(wrap,
    h('div', { class: 'voice-bar' }, vStatus, h('div', { class: 'row' }, vBtn, mBtn)),
    h('div', { class: 'watch-ctl' }, pad, h('div', { class: 'grow' },
      h('p', { class: 'dim' }, '방향키나 ▲◀▼▶ 로 공원을 걸어요. 둘 다 "음성 켜기"를 누르면 서로 목소리가 들려요. 이어폰을 끼면 울림이 줄어요.'),
      h('p', { class: 'dim' }, '목소리는 둘 사이에 바로 전달되고 저장되지 않아요. 이 화면을 나가면 마이크가 꺼져요.'))));
  drawVoice(); raf = requestAnimationFrame(loop);
  if (typeof window !== 'undefined') window.__capyVoice = voice; // 연결 상태 점검용
  return () => { alive = false; cancelAnimationFrame(raf); offs.forEach(f => f()); voice.destroy(); window.__capyVoice = null; window.removeEventListener('keydown', kd); window.removeEventListener('keyup', ku); ctx.store.remove('rt/park/' + ctx.uid).catch(() => {}); };
}
