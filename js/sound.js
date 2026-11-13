// 톡 알림음 "카피~": 짧은 두 음(카-피~) 차임을 내고, 기기에 한국어 음성이 있으면 귀여운 목소리로 "카피~"도 읽어 준다.
// 브라우저는 화면을 한 번이라도 누른 뒤에만 소리를 낼 수 있어서, 첫 터치 때 소리를 낼 준비를 해 둔다.
let ac = null, ready = false;
const KEY = 'capy.soundOff';
export const soundOn = () => { try { return localStorage.getItem(KEY) !== '1'; } catch { return true; } };
export const setSound = on => { try { on ? localStorage.removeItem(KEY) : localStorage.setItem(KEY, '1'); } catch {} };

function unlock() {
  try { if (!ac) ac = new (window.AudioContext || window.webkitAudioContext)(); if (ac.state === 'suspended') ac.resume(); } catch {}
  if (ready) return; ready = true;
  try { if ('speechSynthesis' in window) { const u = new SpeechSynthesisUtterance(' '); u.volume = 0; window.speechSynthesis.speak(u); window.speechSynthesis.getVoices(); } } catch {}
}
if (typeof window !== 'undefined') ['pointerdown', 'keydown', 'touchend'].forEach(ev => window.addEventListener(ev, unlock, { passive: true }));

function note(f0, f1, at, dur, vol) {
  const o = ac.createOscillator(), g = ac.createGain();
  o.type = 'triangle'; o.frequency.setValueAtTime(f0, at); o.frequency.exponentialRampToValueAtTime(f1, at + dur * 0.6);
  g.gain.setValueAtTime(0.0001, at); g.gain.exponentialRampToValueAtTime(vol, at + 0.015); g.gain.exponentialRampToValueAtTime(0.0001, at + dur);
  o.connect(g).connect(ac.destination); o.start(at); o.stop(at + dur + 0.02);
}
function chime() {
  if (!ac) return false;
  try { if (ac.state === 'suspended') ac.resume(); const t = ac.currentTime + 0.02; note(784, 784, t, 0.13, 0.22); note(1175, 1319, t + 0.14, 0.42, 0.2); return true; } catch { return false; }
}
function say() {
  try {
    const ss = window.speechSynthesis; if (!ss) return false;
    const vs = ss.getVoices(), ko = vs.find(v => /^ko/i.test(v.lang));
    if (vs.length && !ko) return false; // 한국어 음성이 없는 기기는 차임만
    const u = new SpeechSynthesisUtterance('카피~'); u.lang = 'ko-KR'; if (ko) u.voice = ko; u.pitch = 1.9; u.rate = 1.05; u.volume = 1;
    ss.cancel(); ss.speak(u); return true;
  } catch { return false; }
}
// force: 꺼 둔 상태에서도 들어보기
export function capySound(force) {
  if (!force && !soundOn()) return;
  if (typeof window !== 'undefined') window.__capySounds = (window.__capySounds || 0) + 1;
  const c = chime(); setTimeout(say, c ? 180 : 0);
}

/* ---------- 효과음 + 배경음 (히노끼탕·전시실·게임) ----------
   음원 파일 없이 브라우저가 직접 소리를 만든다(직접 지은 짧은 가락). 톡 알림음과 따로 켜고 끌 수 있다. */
const FX_KEY = 'capy.fxOff';
export const fxOn = () => { try { return localStorage.getItem(FX_KEY) !== '1'; } catch { return true; } };
export const setFx = on => { try { on ? localStorage.removeItem(FX_KEY) : localStorage.setItem(FX_KEY, '1'); } catch {} if (on) bgm.resume(); else bgm.pause(); };
const hz = m => 440 * Math.pow(2, (m - 69) / 12);
let out = null, musicBus = null;
function bus() {
  if (!ac) return null;
  if (!out) { out = ac.createGain(); out.gain.value = 0.9; out.connect(ac.destination); musicBus = ac.createGain(); musicBus.gain.value = 0.5; musicBus.connect(out); }
  return out;
}
// 한 음: type 파형, f0→f1 주파수, 길이, 크기
function tone(dest, type, f0, f1, at, dur, vol, attack = 0.008) {
  const o = ac.createOscillator(), g = ac.createGain();
  o.type = type; o.frequency.setValueAtTime(f0, at); if (f1 !== f0) o.frequency.exponentialRampToValueAtTime(Math.max(20, f1), at + dur);
  g.gain.setValueAtTime(0.0001, at); g.gain.exponentialRampToValueAtTime(vol, at + attack); g.gain.exponentialRampToValueAtTime(0.0001, at + dur);
  o.connect(g).connect(dest); o.start(at); o.stop(at + dur + 0.03);
}
let noiseBuf = null;
function noise(dest, at, dur, vol, freq = 1200, q = 0.8, type = 'bandpass') {
  if (!noiseBuf) { noiseBuf = ac.createBuffer(1, ac.sampleRate * 0.6, ac.sampleRate); const d = noiseBuf.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1; }
  const s = ac.createBufferSource(), f = ac.createBiquadFilter(), g = ac.createGain(); s.buffer = noiseBuf; f.type = type; f.frequency.value = freq; f.Q.value = q;
  g.gain.setValueAtTime(vol, at); g.gain.exponentialRampToValueAtTime(0.0001, at + dur); s.connect(f).connect(g).connect(dest); s.start(at); s.stop(at + dur + 0.02);
}
const SFX = {
  swing: (d, t) => noise(d, t, 0.14, 0.25, 2400, 0.7),
  miss: (d, t) => { noise(d, t, 0.2, 0.22, 3000, 0.6); tone(d, 'sine', 900, 300, t, 0.18, 0.06); },
  hit: (d, t) => { tone(d, 'sine', 190, 55, t, 0.2, 0.55); noise(d, t, 0.07, 0.4, 900, 0.6); tone(d, 'square', 420, 140, t, 0.07, 0.1); },
  tock: (d, t) => { tone(d, 'triangle', 520, 300, t, 0.07, 0.3); noise(d, t, 0.03, 0.15, 3000, 1); },
  flip: (d, t) => { noise(d, t, 0.05, 0.14, 5000, 1.2); tone(d, 'triangle', 700, 1000, t + 0.02, 0.07, 0.12); },
  pair: (d, t) => [0, 4, 7].forEach((s, i) => tone(d, 'triangle', hz(76 + s), hz(76 + s), t + i * 0.07, 0.16, 0.2)),
  jump: (d, t) => tone(d, 'square', 300, 720, t, 0.14, 0.09),
  pop: (d, t) => { tone(d, 'sine', 520, 260, t, 0.09, 0.3); noise(d, t, 0.03, 0.12, 2000, 1); },
  point: (d, t) => [0, 5].forEach((s, i) => tone(d, 'triangle', hz(79 + s), hz(79 + s), t + i * 0.1, 0.18, 0.22)),
  coin: (d, t) => { tone(d, 'triangle', hz(88), hz(88), t, 0.07, 0.2); tone(d, 'triangle', hz(93), hz(93), t + 0.06, 0.16, 0.2); },
  bad: (d, t) => { tone(d, 'sawtooth', 220, 90, t, 0.25, 0.16); noise(d, t, 0.1, 0.2, 500, 0.8); },
  splash: (d, t) => { noise(d, t, 0.35, 0.3, 1500, 0.5); noise(d, t + 0.06, 0.3, 0.18, 4000, 0.8); tone(d, 'sine', 500, 180, t, 0.2, 0.1); },
  hang: (d, t) => { tone(d, 'triangle', 330, 330, t, 0.12, 0.2); tone(d, 'triangle', 495, 495, t + 0.09, 0.2, 0.18); },
  win: (d, t) => [[72, 0], [76, 0.12], [79, 0.24], [84, 0.36], [79, 0.52], [84, 0.64]].forEach(([m, at], i) => { tone(d, 'triangle', hz(m), hz(m), t + at, i === 5 ? 0.6 : 0.16, 0.26); tone(d, 'square', hz(m - 12), hz(m - 12), t + at, i === 5 ? 0.5 : 0.12, 0.05); }),
  lose: (d, t) => [[67, 0], [65, 0.22], [63, 0.44], [60, 0.7]].forEach(([m, at], i) => tone(d, 'triangle', hz(m), hz(m - (i === 3 ? 1 : 0)), t + at, i === 3 ? 0.7 : 0.26, 0.22)),
  draw: (d, t) => [[72, 0], [72, 0.18], [76, 0.36]].forEach(([m, at]) => tone(d, 'triangle', hz(m), hz(m), t + at, 0.2, 0.2)),
};
const lastFx = {};
export function sfx(name) {
  if (!fxOn() || !ac || !SFX[name]) return;
  try { if (ac.state === 'suspended') ac.resume(); const now = performance.now(); if (now - (lastFx[name] || 0) < 45) return; lastFx[name] = now; SFX[name](bus(), ac.currentTime + 0.01); } catch {}
}

// 배경음: 장소마다 다른 짧은 가락을 조용히 되풀이한다. step = 한 칸 길이(초), mel/bass = 칸마다 음(미디 번호, 0은 쉼)
const TUNES = {
  bath: { step: 0.42, type: 'sine', vol: 0.11, rel: 1.5, bvol: 0.09, // 느긋한 5음 가락 + 물방울
    mel: [69, 0, 72, 0, 76, 0, 74, 72, 69, 0, 67, 0, 69, 0, 0, 0, 72, 0, 74, 0, 79, 0, 76, 74, 72, 0, 69, 0, 67, 0, 0, 0],
    bass: [45, 0, 0, 0, 0, 0, 0, 0, 41, 0, 0, 0, 0, 0, 0, 0, 43, 0, 0, 0, 0, 0, 0, 0, 45, 0, 0, 0, 0, 0, 0, 0], drip: true },
  gallery: { step: 0.3, type: 'triangle', vol: 0.085, rel: 0.9, bvol: 0.07, // 잔잔한 왈츠
    mel: [76, 0, 0, 79, 0, 0, 77, 0, 76, 74, 0, 0, 72, 0, 0, 76, 0, 0, 74, 0, 72, 71, 0, 0, 69, 0, 0, 72, 0, 0, 76, 0, 74, 72, 0, 0, 74, 0, 0, 71, 0, 0, 72, 0, 0, 0, 0, 0],
    bass: [48, 0, 55, 0, 55, 0, 48, 0, 55, 0, 55, 0, 45, 0, 52, 0, 52, 0, 43, 0, 50, 0, 50, 0, 41, 0, 48, 0, 48, 0, 48, 0, 55, 0, 55, 0, 43, 0, 50, 0, 50, 0, 48, 0, 55, 0, 52, 0] },
  game: { step: 0.2, type: 'triangle', vol: 0.085, rel: 0.28, bvol: 0.085, // 통통 튀는 가락
    mel: [72, 0, 76, 79, 0, 76, 79, 84, 81, 0, 79, 76, 0, 72, 74, 0, 77, 0, 81, 84, 0, 81, 77, 0, 79, 0, 76, 72, 74, 0, 67, 0],
    bass: [48, 0, 0, 55, 48, 0, 55, 0, 45, 0, 0, 52, 45, 0, 52, 0, 41, 0, 0, 48, 41, 0, 48, 0, 43, 0, 0, 50, 43, 0, 47, 0] },
};
let cur = null, timer = 0, nextT = 0, idx = 0, wantKind = '', ducked = false;
function tickBgm() {
  if (!ac || !cur || ac.state !== 'running') return;
  if (nextT < ac.currentTime) nextT = ac.currentTime + 0.05;
  while (nextT < ac.currentTime + 0.35) {
    const T = cur, i = idx % T.mel.length, m = T.mel[i], b = T.bass[i % T.bass.length];
    if (m) tone(musicBus, T.type, hz(m), hz(m), nextT, T.rel, T.vol, 0.02);
    if (b) tone(musicBus, 'sine', hz(b), hz(b), nextT, Math.max(0.5, T.rel), T.bvol, 0.03);
    if (T.drip && i % 16 === 11) tone(musicBus, 'sine', hz(96), hz(88), nextT + 0.1, 0.25, 0.05, 0.004);
    nextT += T.step; idx++;
  }
}
export const bgm = {
  start(kind) { wantKind = kind; if (!fxOn() || !TUNES[kind]) return this.pause(); if (cur === TUNES[kind] && timer) return; this.pause(); cur = TUNES[kind]; idx = 0; nextT = 0; if (ac) { bus(); musicBus.gain.value = ducked ? 0.12 : 0.5; } timer = setInterval(() => { if (ac && !out) bus(); if (out) tickBgm(); }, 120); },
  stop() { wantKind = ''; this.pause(); },
  pause() { clearInterval(timer); timer = 0; cur = null; },
  resume() { if (wantKind) this.start(wantKind); },
  // 음성 대화 중에는 배경음을 아주 작게
  duck(on) { ducked = !!on; if (musicBus) try { musicBus.gain.setTargetAtTime(ducked ? 0.12 : 0.5, ac.currentTime, 0.3); } catch {} },
};
if (typeof document !== 'undefined') document.addEventListener('visibilitychange', () => { if (document.hidden) { clearInterval(timer); timer = 0; cur = null; } else bgm.resume(); });
