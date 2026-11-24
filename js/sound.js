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
function mkNoise() { if (!noiseBuf) { noiseBuf = ac.createBuffer(1, ac.sampleRate * 0.6, ac.sampleRate); const d = noiseBuf.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1; } }
// 지글지글: 굽거나 튀기는 동안 계속 나는 소리. n = 익히는 개수(0이면 끔)
let siz = null;
export function sizzle(n) {
  try {
    if (!ac || !fxOn()) n = 0;
    if (!siz) { if (!n || !bus()) return; mkNoise(); const src = ac.createBufferSource(), f = ac.createBiquadFilter(), g = ac.createGain(); src.buffer = noiseBuf; src.loop = true; f.type = 'highpass'; f.frequency.value = 4200; g.gain.value = 0.0001; src.connect(f).connect(g).connect(out); src.start(); siz = { g }; }
    if (n && ac.state === 'suspended') ac.resume();
    siz.g.gain.setTargetAtTime(n ? Math.min(0.1, 0.04 + 0.018 * n) : 0.0001, ac.currentTime, 0.12);
  } catch {}
}
function noise(dest, at, dur, vol, freq = 1200, q = 0.8, type = 'bandpass') {
  mkNoise();
  const s = ac.createBufferSource(), f = ac.createBiquadFilter(), g = ac.createGain(); s.buffer = noiseBuf; f.type = type; f.frequency.value = freq; f.Q.value = q;
  g.gain.setValueAtTime(vol, at); g.gain.exponentialRampToValueAtTime(0.0001, at + dur); s.connect(f).connect(g).connect(dest); s.start(at); s.stop(at + dur + 0.02);
}
const SFX = {
  // 게임기 버튼: 방향키(폭신한 딸깍), A(높게 통), B(낮게 통), 말하기(뾱)
  key: (d, t) => { noise(d, t, 0.03, 0.1, 1800, 0.8); tone(d, 'sine', 300, 210, t, 0.06, 0.1); },
  keyA: (d, t) => { noise(d, t, 0.02, 0.07, 3000, 0.8); tone(d, 'triangle', 880, 660, t, 0.09, 0.12); },
  keyB: (d, t) => { noise(d, t, 0.02, 0.07, 2400, 0.8); tone(d, 'triangle', 620, 440, t, 0.09, 0.12); },
  keyC: (d, t) => { tone(d, 'sine', 700, 1050, t, 0.07, 0.1); tone(d, 'sine', 1050, 1400, t + 0.06, 0.06, 0.07); },
  // 낚시: 휘두르기, 풍덩, 입질, 릴 감기, 줄 끊김, 큰 물고기, 대포
  cast: (d, t) => { noise(d, t, 0.22, 0.3, 1600, 0.6); tone(d, 'sine', 500, 1500, t, 0.2, 0.07); tone(d, 'triangle', 2400, 3200, t + 0.2, 0.5, 0.025); },
  splash: (d, t) => { noise(d, t, 0.09, 0.32, 900, 0.5); noise(d, t + 0.05, 0.32, 0.22, 2600, 0.5); tone(d, 'sine', 420, 130, t, 0.22, 0.2); tone(d, 'sine', 1300, 1900, t + 0.2, 0.07, 0.05); },
  bite: (d, t) => { tone(d, 'sine', 300, 110, t, 0.16, 0.26); noise(d, t, 0.12, 0.16, 700, 0.6); tone(d, 'square', hz(88), hz(88), t + 0.03, 0.07, 0.07); tone(d, 'square', hz(93), hz(93), t + 0.11, 0.13, 0.07); },
  hookset: (d, t) => { noise(d, t, 0.07, 0.3, 3000, 0.8); tone(d, 'triangle', hz(76), hz(76), t, 0.08, 0.2); tone(d, 'triangle', hz(81), hz(81), t + 0.07, 0.08, 0.2); tone(d, 'triangle', hz(88), hz(88), t + 0.14, 0.2, 0.22); },
  reel: (d, t) => { noise(d, t, 0.018, 0.2, 4200, 3); tone(d, 'square', 1900, 1700, t, 0.02, 0.04); },
  strain: (d, t) => { tone(d, 'sawtooth', 620, 760, t, 0.16, 0.05); tone(d, 'sawtooth', 930, 1140, t, 0.16, 0.03); },
  snap: (d, t) => { noise(d, t, 0.05, 0.4, 5200, 1.5); tone(d, 'sawtooth', 1500, 160, t, 0.22, 0.16); tone(d, 'sine', 200, 70, t + 0.1, 0.3, 0.2); },
  bigfish: (d, t) => { [72, 76, 79, 84, 88].forEach((m, k) => tone(d, 'triangle', hz(m), hz(m), t + k * 0.09, k === 4 ? 0.5 : 0.14, 0.2)); tone(d, 'sine', hz(60), hz(60), t + 0.36, 0.5, 0.14); noise(d, t + 0.36, 0.3, 0.1, 6000, 0.6); },
  cannon: (d, t) => { noise(d, t, 0.35, 0.45, 260, 0.5); tone(d, 'sine', 170, 38, t, 0.4, 0.4); noise(d, t, 0.05, 0.3, 2400, 0.7); },
  boom: (d, t) => { noise(d, t, 0.5, 0.4, 420, 0.4); tone(d, 'sine', 120, 30, t, 0.5, 0.36); },
  sear: (d, t) => { noise(d, t, 0.55, 0.4, 5200, 0.5, 'highpass'); noise(d, t, 0.14, 0.3, 2400, 0.7); },
  crackle: (d, t) => noise(d, t, 0.035, 0.22, 3200 + Math.random() * 3000, 2.5),
  swing: (d, t) => noise(d, t, 0.14, 0.25, 2400, 0.7),
  miss: (d, t) => { noise(d, t, 0.2, 0.22, 3000, 0.6); tone(d, 'sine', 900, 300, t, 0.18, 0.06); },
  hit: (d, t) => { tone(d, 'sine', 190, 55, t, 0.2, 0.55); noise(d, t, 0.07, 0.4, 900, 0.6); tone(d, 'square', 420, 140, t, 0.07, 0.1); },
  tock: (d, t) => { tone(d, 'triangle', 520, 300, t, 0.07, 0.3); noise(d, t, 0.03, 0.15, 3000, 1); },
  flip: (d, t) => { noise(d, t, 0.05, 0.14, 5000, 1.2); tone(d, 'triangle', 700, 1000, t + 0.02, 0.07, 0.12); },
  pair: (d, t) => [0, 4, 7].forEach((s, i) => tone(d, 'triangle', hz(76 + s), hz(76 + s), t + i * 0.07, 0.16, 0.2)),
  jump: (d, t) => tone(d, 'square', 300, 720, t, 0.14, 0.09),
  // 카피 버블: 구슬 터지는 '뽁뽁', 쏘는 '슝', 우수수 떨어지는 소리, 천장이 '쿵'
  bpop: (d, t) => [0, 4, 7, 12].forEach((s2, k) => { tone(d, 'sine', hz(84 + s2), hz(91 + s2), t + k * 0.045, 0.09, 0.22, 0.003); noise(d, t + k * 0.045, 0.03, 0.12, 6000, 2); }),
  bshoot: (d, t) => { noise(d, t, 0.16, 0.18, 2400, 0.7); tone(d, 'triangle', 380, 900, t, 0.14, 0.16); },
  bdrop: (d, t) => [0, 3, 5, 8, 12, 15, 17, 20].forEach((s2, k) => tone(d, 'triangle', hz(96 - s2), hz(96 - s2), t + k * 0.055, 0.12, 0.13, 0.004)),
  bceil: (d, t) => { tone(d, 'sine', 140, 60, t, 0.25, 0.4); noise(d, t, 0.18, 0.25, 500, 0.6); },
  bstick: (d, t) => { tone(d, 'triangle', 660, 520, t, 0.07, 0.22); noise(d, t, 0.03, 0.1, 3500, 1); },
  janggu: (d, t) => { tone(d, 'sine', 118, 52, t, 0.26, 0.5, 0.004); tone(d, 'triangle', 176, 70, t, 0.12, 0.2, 0.003); noise(d, t, 0.05, 0.16, 320, 0.7, 'lowpass'); },
  janggu2: (d, t) => { tone(d, 'sine', 150, 78, t, 0.16, 0.36, 0.003); noise(d, t, 0.04, 0.2, 700, 1.2); },
  pop: (d, t) => { tone(d, 'sine', 520, 260, t, 0.09, 0.3); noise(d, t, 0.03, 0.12, 2000, 1); },
  point: (d, t) => [0, 5].forEach((s, i) => tone(d, 'triangle', hz(79 + s), hz(79 + s), t + i * 0.1, 0.18, 0.22)),
  coin: (d, t) => { tone(d, 'triangle', hz(88), hz(88), t, 0.07, 0.2); tone(d, 'triangle', hz(93), hz(93), t + 0.06, 0.16, 0.2); },
  alarm: (d, t) => [0, 0.32, 0.64].forEach(k => { tone(d, 'square', 880, 660, t + k, 0.14, 0.16); tone(d, 'square', 660, 880, t + k + 0.15, 0.14, 0.16); }), /* 황충 경보 */
  bad: (d, t) => { tone(d, 'sawtooth', 220, 90, t, 0.25, 0.16); noise(d, t, 0.1, 0.2, 500, 0.8); },
  splash: (d, t) => { noise(d, t, 0.35, 0.3, 1500, 0.5); noise(d, t + 0.06, 0.3, 0.18, 4000, 0.8); tone(d, 'sine', 500, 180, t, 0.2, 0.1); },
  hang: (d, t) => { tone(d, 'triangle', 330, 330, t, 0.12, 0.2); tone(d, 'triangle', 495, 495, t + 0.09, 0.2, 0.18); },
  win: (d, t) => [[72, 0], [76, 0.12], [79, 0.24], [84, 0.36], [79, 0.52], [84, 0.64]].forEach(([m, at], i) => { tone(d, 'triangle', hz(m), hz(m), t + at, i === 5 ? 0.6 : 0.16, 0.26); tone(d, 'square', hz(m - 12), hz(m - 12), t + at, i === 5 ? 0.5 : 0.12, 0.05); }),
  lose: (d, t) => [[67, 0], [65, 0.22], [63, 0.44], [60, 0.7]].forEach(([m, at], i) => tone(d, 'triangle', hz(m), hz(m - (i === 3 ? 1 : 0)), t + at, i === 3 ? 0.7 : 0.26, 0.22)),
  draw: (d, t) => [[72, 0], [72, 0.18], [76, 0.36]].forEach(([m, at]) => tone(d, 'triangle', hz(m), hz(m), t + at, 0.2, 0.2)),
  // 카피백반 주방: 칼질(탁탁탁) · 보글보글 · 팬에 지지기 · 튀김기에 풍덩 · 완성 팡파레
  chop: (d, t) => [0, 0.11, 0.22, 0.31].forEach((at, k) => { tone(d, 'triangle', 340 - k * 20, 150, t + at, 0.06, 0.32, 0.002); noise(d, t + at, 0.035, 0.28, 2600, 1.4); }),
  bubble: (d, t) => [0, 0.09, 0.2].forEach(at => { const f = 260 + Math.random() * 260; tone(d, 'sine', f, f * 2.2, t + at + Math.random() * 0.05, 0.07, 0.12, 0.004); }),
  panin: (d, t) => { noise(d, t, 0.9, 0.42, 4800, 0.5, 'highpass'); noise(d, t, 0.2, 0.3, 2000, 0.7); for (let k = 0; k < 6; k++) noise(d, t + 0.1 + k * 0.11, 0.03, 0.2, 3000 + Math.random() * 3000, 2.5); },
  fryin: (d, t) => { tone(d, 'sine', 300, 110, t, 0.18, 0.18); noise(d, t + 0.05, 1.2, 0.5, 3600, 0.4, 'highpass'); for (let k = 0; k < 10; k++) noise(d, t + 0.12 + k * 0.09, 0.03, 0.24, 2500 + Math.random() * 4000, 2.5); },
  potin: (d, t) => { noise(d, t, 0.3, 0.28, 1100, 0.5); tone(d, 'sine', 380, 140, t, 0.2, 0.16); [0.25, 0.38, 0.5].forEach(at => tone(d, 'sine', 300, 700, t + at, 0.06, 0.1, 0.004)); },
  fanfare: (d, t) => { [[67, 0, 0.12], [67, 0.13, 0.12], [67, 0.26, 0.12], [72, 0.4, 0.5], [76, 0.95, 0.14], [79, 1.1, 0.7]].forEach(([m, at, du]) => { tone(d, 'square', hz(m), hz(m), t + at, du, 0.09); tone(d, 'triangle', hz(m + 12), hz(m + 12), t + at, du, 0.12); }); [48, 55, 60].forEach(m => tone(d, 'triangle', hz(m), hz(m), t + 0.4, 1.3, 0.1)); noise(d, t + 0.4, 0.5, 0.12, 6000, 0.6, 'highpass'); },
};
// 동물 30마리의 고유한 소리. 한 줄 = 한 마리, 조각 하나 = [파형, 시작 주파수, 끝 주파수, 시작 시각, 길이, 크기] 또는 ['n', 시작 시각, 길이, 크기, 걸러낼 주파수]
const S = 'sine', T3 = 'triangle', W = 'sawtooth', Q = 'square';
const VOICE = [
  [[W, 430, 250, 0, .11, .16], [W, 460, 260, .17, .12, .17]],                                  // 강아지: 멍멍
  [[T3, 520, 920, 0, .17, .14], [T3, 920, 470, .17, .3, .14]],                                 // 고양이: 야옹
  [[S, 2400, 3000, 0, .06, .09], [S, 2600, 3200, .1, .06, .09], [S, 2500, 3100, .2, .06, .08]], // 생쥐: 찍찍찍
  [[Q, 1500, 1750, 0, .05, .05], [Q, 1650, 1400, .09, .07, .05]],                              // 햄스터: 뀨
  [[S, 190, 85, 0, .09, .22], [S, 190, 85, .14, .09, .22], [S, 1700, 2100, .3, .06, .06]],     // 토끼: 발 구르기
  [[W, 900, 1500, 0, .08, .1], [W, 1350, 650, .08, .17, .1]],                                  // 여우: 캥
  [[W, 115, 78, 0, .5, .17], ['n', 0, .5, .08, 220]],                                          // 곰: 크르릉
  [[T3, 390, 350, 0, .12, .13], [T3, 410, 330, .13, .2, .13]],                                 // 판다: 메에
  [[Q, 145, 105, 0, .32, .08], ['n', .02, .3, .05, 400]],                                      // 코알라: 그르륵
  [[W, 170, 88, 0, .6, .18], ['n', 0, .6, .12, 320]],                                          // 호랑이: 어흥
  [[W, 135, 66, 0, .85, .2], ['n', 0, .85, .14, 260]],                                         // 사자: 크아앙
  [[W, 150, 195, 0, .25, .14], [W, 195, 128, .25, .6, .14]],                                   // 소: 음메
  [[Q, 310, 200, 0, .1, .08], ['n', 0, .1, .1, 800], [Q, 330, 210, .16, .11, .08], ['n', .16, .1, .1, 800]], // 돼지: 꿀꿀
  [[Q, 220, 440, 0, .09, .08], [Q, 300, 540, .12, .13, .08]],                                  // 개구리: 개굴
  [[S, 500, 720, 0, .09, .13], [S, 520, 740, .13, .09, .13], [S, 900, 1150, .27, .13, .13]],   // 원숭이: 우끼끼
  [[Q, 700, 500, 0, .05, .07], [Q, 720, 510, .09, .05, .07], [Q, 900, 1350, .19, .26, .07]],   // 닭: 꼬꼬댁
  [[W, 510, 420, 0, .16, .1], [W, 530, 430, .22, .18, .1]],                                    // 펭귄: 꾸욱
  [[S, 2800, 3400, 0, .07, .09], [S, 2900, 3500, .13, .07, .09]],                              // 병아리: 삐약
  [[Q, 620, 380, 0, .13, .08], [Q, 640, 390, .19, .14, .08]],                                  // 오리: 꽥꽥
  [[S, 420, 380, 0, .22, .16], [S, 385, 335, .34, .38, .16]],                                  // 부엉이: 부엉
  [[S, 300, 630, 0, .4, .14], [S, 630, 540, .4, .55, .14]],                                    // 늑대: 아우
  [['n', 0, .14, .16, 500], ['n', .2, .14, .16, 450], [Q, 185, 120, 0, .34, .06]],             // 멧돼지: 킁킁
  [[W, 1100, 900, 0, .1, .09], [W, 950, 700, .1, .12, .09], [W, 760, 500, .22, .14, .09], [W, 560, 380, .36, .2, .09]], // 말: 히히힝
  [[S, 1047, 1047, 0, .13, .1], [S, 1319, 1319, .09, .13, .1], [S, 1568, 1568, .18, .13, .1], [S, 2093, 2093, .27, .3, .1]], // 유니콘: 반짝
  [[S, 205, 168, 0, .55, .16]],                                                                // 거북이: 음
  [[S, 300, 900, 0, .09, .11], [S, 380, 1000, .13, .09, .11], [S, 460, 1200, .26, .1, .11]],   // 문어: 뽀글
  [[W, 360, 280, 0, .15, .12], [W, 380, 285, .22, .17, .12]],                                  // 물개: 아웅
  [['n', 0, .05, .1, 3200], ['n', .09, .05, .1, 3200], ['n', .18, .05, .1, 3200], [S, 1600, 1500, .27, .08, .05]], // 고슴도치: 킁
  [[Q, 1800, 2200, 0, .04, .05], [Q, 1900, 2300, .07, .04, .05], [Q, 1800, 2200, .14, .04, .05], [Q, 2000, 2400, .21, .05, .05]], // 다람쥐: 쪼르르
  [[T3, 1000, 760, 0, .07, .1], [T3, 900, 680, .1, .07, .1], [T3, 800, 600, .2, .1, .1]],      // 너구리: 끼리릭
];
export function animalVoice(i) {
  if (!fxOn() || !ac || !VOICE[i]) return;
  try { if (ac.state === 'suspended') ac.resume(); const d = bus(), t = ac.currentTime + 0.01; VOICE[i].forEach(v => (v[0] === 'n' ? noise(d, t + v[1], v[2], v[3], v[4], 1.2) : tone(d, v[0], v[1], v[2], t + v[3], v[4], v[5]))); } catch {}
}
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
  social: { step: 0.23, type: 'triangle', vol: 0.08, rel: 0.34, bvol: 0.075, bird: true, // 산뜻한 놀이터: 가볍게 뛰는 장조 가락 + 새소리
    mel: [79, 0, 76, 79, 84, 0, 83, 79, 81, 0, 77, 81, 79, 0, 0, 0, 76, 0, 72, 76, 79, 0, 77, 74, 76, 0, 79, 0, 72, 0, 0, 0,
      79, 0, 76, 79, 84, 0, 86, 88, 86, 0, 84, 81, 79, 0, 0, 0, 77, 0, 81, 84, 83, 0, 79, 74, 76, 0, 74, 0, 72, 0, 0, 0],
    bass: [48, 0, 55, 0, 52, 0, 55, 0, 53, 0, 57, 0, 55, 0, 59, 0, 45, 0, 52, 0, 48, 0, 52, 0, 43, 0, 50, 0, 48, 0, 55, 0] },
  sea: { step: 0.115, type: 'square', vol: 0.04, rel: 0.15, bvol: 0.1, drum: true, // 낚시터: 빠르게 몰아치는 단조 뱃노래
    mel: [69, 0, 72, 76, 81, 0, 76, 72, 69, 0, 72, 76, 81, 79, 76, 72, 65, 0, 69, 72, 77, 0, 72, 69, 65, 0, 69, 72, 77, 76, 72, 69,
      67, 0, 71, 74, 79, 0, 74, 71, 67, 0, 71, 74, 79, 81, 83, 79, 76, 0, 80, 83, 88, 0, 83, 80, 76, 76, 0, 76, 80, 83, 88, 0,
      81, 0, 81, 84, 83, 0, 81, 79, 81, 0, 76, 0, 72, 76, 81, 0, 77, 0, 77, 81, 79, 0, 77, 76, 77, 0, 72, 0, 69, 72, 77, 0,
      79, 0, 79, 83, 81, 0, 79, 77, 79, 0, 74, 0, 71, 74, 79, 0, 80, 0, 83, 0, 88, 0, 86, 83, 84, 83, 80, 76, 81, 0, 0, 0],
    bass: [45, 0, 45, 0, 52, 0, 45, 0, 45, 0, 45, 0, 52, 0, 57, 0, 41, 0, 41, 0, 48, 0, 41, 0, 41, 0, 41, 0, 48, 0, 53, 0,
      43, 0, 43, 0, 50, 0, 43, 0, 43, 0, 43, 0, 50, 0, 55, 0, 40, 0, 40, 0, 47, 0, 40, 0, 40, 0, 40, 0, 47, 0, 52, 0] },
  carnival: { step: 0.15, type: 'square', vol: 0.04, rel: 0.17, bvol: 0.07, organ: true, // 놀이공원 회전목마: 손풍금 같은 3박자 왈츠 + 반짝이는 종소리
    mel: [79, 0, 78, 79, 0, 84, 83, 0, 81, 79, 0, 0, 77, 0, 76, 77, 0, 81, 79, 0, 77, 76, 0, 0, 74, 0, 73, 74, 0, 79, 77, 0, 76, 74, 0, 72, 76, 0, 79, 84, 0, 79, 81, 0, 83, 84, 0, 0,
      84, 0, 83, 84, 0, 88, 86, 0, 84, 83, 0, 0, 81, 0, 79, 81, 0, 84, 83, 0, 81, 79, 0, 0, 77, 0, 79, 81, 0, 77, 76, 0, 77, 79, 0, 74, 72, 0, 76, 79, 0, 76, 72, 0, 0, 0, 0, 0],
    bass: [48, 0, 60, 0, 64, 0, 43, 0, 59, 0, 62, 0, 41, 0, 57, 0, 60, 0, 48, 0, 60, 0, 64, 0, 43, 0, 59, 0, 62, 0, 43, 0, 59, 0, 65, 0, 48, 0, 60, 0, 64, 0, 43, 0, 59, 0, 60, 0,
      48, 0, 60, 0, 64, 0, 43, 0, 59, 0, 62, 0, 41, 0, 57, 0, 60, 0, 48, 0, 60, 0, 64, 0, 41, 0, 57, 0, 60, 0, 43, 0, 59, 0, 62, 0, 48, 0, 55, 0, 64, 0, 48, 0, 55, 0, 60, 0] },
  airport: { step: 0.27, type: 'triangle', vol: 0.075, rel: 0.9, bvol: 0.06, chime: true, // 카피공항: 하늘 마을처럼 맑고 느긋한 6/8 오르골 가락
    mel: [77, 0, 81, 84, 0, 81, 79, 0, 76, 79, 0, 84, 81, 0, 77, 74, 0, 77, 82, 0, 77, 74, 0, 0, 84, 0, 81, 77, 0, 81, 82, 0, 79, 74, 0, 79, 76, 0, 79, 84, 0, 82, 81, 0, 0, 77, 0, 0, 89, 0, 84, 81, 0, 84, 88, 0, 84, 81, 0, 76, 86, 0, 82, 77, 0, 82, 84, 0, 79, 76, 0, 0, 81, 0, 86, 89, 0, 86, 82, 0, 86, 89, 0, 86, 88, 0, 84, 79, 0, 76, 77, 0, 0, 0, 0, 0],
    bass: [41, 0, 48, 53, 0, 48, 40, 0, 48, 55, 0, 48, 38, 0, 45, 53, 0, 45, 34, 0, 46, 53, 0, 46, 41, 0, 48, 53, 0, 48, 43, 0, 50, 58, 0, 50, 36, 0, 48, 52, 0, 48, 41, 0, 48, 53, 0, 0, 41, 0, 48, 53, 0, 48, 45, 0, 52, 57, 0, 52, 34, 0, 46, 53, 0, 46, 36, 0, 48, 52, 0, 48, 38, 0, 45, 53, 0, 45, 34, 0, 46, 53, 0, 46, 36, 0, 48, 52, 0, 48, 41, 0, 48, 53, 0, 0] },
  hotddok: { step: 0.24, type: 'triangle', vol: 0.08, rel: 0.6, bvol: 0.07, chime: true, // 핫똑랜드: 굿거리장단 느낌의 5음 가락
    mel: [74, 0, 76, 74, 0, 72, 69, 0, 72, 74, 0, 0, 76, 0, 79, 76, 0, 74, 72, 0, 69, 67, 0, 0, 69, 0, 72, 74, 0, 76, 79, 0, 76, 74, 0, 72, 74, 0, 72, 69, 0, 67, 69, 0, 0, 0, 0, 0, 81, 0, 79, 76, 0, 79, 81, 0, 84, 81, 0, 0, 79, 0, 76, 74, 0, 76, 79, 0, 76, 72, 0, 0, 74, 0, 76, 79, 0, 81, 79, 0, 76, 74, 0, 72, 69, 0, 72, 74, 0, 72, 74, 0, 0, 0, 0, 0],
    bass: [43, 0, 0, 50, 0, 43, 45, 0, 0, 52, 0, 45, 48, 0, 0, 55, 0, 48, 43, 0, 0, 50, 0, 43, 45, 0, 0, 52, 0, 45, 48, 0, 0, 55, 0, 48, 50, 0, 0, 45, 0, 43, 45, 0, 0, 52, 0, 0, 45, 0, 0, 52, 0, 45, 48, 0, 0, 55, 0, 48, 43, 0, 0, 50, 0, 43, 48, 0, 0, 55, 0, 48, 43, 0, 0, 50, 0, 43, 45, 0, 0, 52, 0, 45, 41, 0, 0, 48, 0, 41, 43, 0, 0, 50, 0, 0] },
  flight: { step: 0.13, type: 'square', vol: 0.038, rel: 0.16, bvol: 0.1, drum: true, // 비행: 산뜻하게 내달리는 씩씩한 가락
    mel: [81, 0, 81, 84, 88, 0, 84, 81, 88, 0, 86, 84, 86, 0, 83, 0, 81, 0, 81, 84, 89, 0, 84, 81, 89, 0, 88, 86, 84, 0, 81, 0, 84, 0, 84, 88, 91, 0, 88, 84, 91, 0, 89, 88, 86, 0, 84, 0, 83, 0, 86, 91, 0, 86, 83, 86, 88, 0, 86, 0, 83, 86, 91, 0],
    bass: [45, 0, 45, 0, 52, 0, 45, 0, 45, 0, 45, 0, 52, 0, 45, 0, 41, 0, 41, 0, 48, 0, 41, 0, 41, 0, 41, 0, 48, 0, 41, 0, 48, 0, 48, 0, 55, 0, 48, 0, 48, 0, 48, 0, 55, 0, 48, 0, 43, 0, 43, 0, 50, 0, 43, 0, 43, 0, 43, 0, 50, 0, 43, 0] },
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
    if (T.bird && i % 32 === 14) { tone(musicBus, 'sine', 2600, 3300, nextT + 0.05, 0.07, 0.03, 0.004); tone(musicBus, 'sine', 3000, 3700, nextT + 0.16, 0.07, 0.03, 0.004); tone(musicBus, 'sine', 2700, 3400, nextT + 0.27, 0.09, 0.028, 0.004); }
    if (T.drum) { if (i % 8 === 0 || i % 16 === 6) tone(musicBus, 'sine', 130, 42, nextT, 0.12, 0.22, 0.003); if (i % 8 === 4) noise(musicBus, nextT, 0.09, 0.13, 1900, 0.6); if (i % 2 === 0) noise(musicBus, nextT, 0.025, i % 4 === 2 ? 0.05 : 0.03, 7000, 1.2, 'highpass'); if (i % 64 === 60) [0, 1, 2].forEach(k => noise(musicBus, nextT + k * T.step, 0.06, 0.11, 1500 - k * 250, 0.6)); }
    if (T.chime && m) tone(musicBus, 'sine', hz(m + 12), hz(m + 12), nextT, 1.2, T.vol * 0.45, 0.005);
    if (T.organ && m) tone(musicBus, 'triangle', hz(m + 12), hz(m + 12), nextT, T.rel, T.vol * 0.9, 0.01);
    if (T.organ && i % 24 === 0) tone(musicBus, 'sine', hz(96), hz(96), nextT, 0.5, 0.035, 0.003);
    if (T.organ && i % 6 === 2) noise(musicBus, nextT, 0.04, 0.035, 6500, 1.5);
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
