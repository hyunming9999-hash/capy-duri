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
