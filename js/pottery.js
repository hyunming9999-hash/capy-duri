// 해피도자기: 핫똑랜드 마을의 도자기 공방(주인 · 스승 삽살개 도암)
// 재료(흙 · 유약 · 안료)는 부메랑상회에서 산다. 하루 3번 빚는다.
// 흙 빚기(1분 물레) → 유약 → 가마(꺼내는 때) → 안료(무늬는 운) → 최종 등급 → 게시(5분 안에 팔릴 확률)
import { h, toast, modal } from './ui.js';
import { sfx } from './sound.js';

const IMG = 'img/hd/', PI = `${IMG}pot/`;
export const POT_MAT = { clayW: ['백자토', 10000], clayC: ['청자토', 8500], clayB: ['분청토', 6000], glaze: ['유약', 1000], pigment: ['안료', 2000] };
const LABOR = 3000, DAY_MAX = 3, SHAPE_SEC = 60;
// 목표 모양: 그림(무늬 없는 도자기)의 윤곽에서 뽑은 반지름(위 → 아래, 최대 1) · ar = 높이 / 최대 너비
const PROF = {"c":{"r":[0.292,0.292,0.277,0.331,0.546,0.677,0.754,0.823,0.877,0.915,0.946,0.969,0.985,0.992,1.0,1.0,0.992,0.977,0.965,0.946,0.923,0.896,0.869,0.838,0.808,0.769,0.738,0.708,0.669,0.638,0.615,0.585,0.562,0.538,0.523,0.508,0.496,0.485,0.477,0.477,0.477,0.477,0.485,0.492,0.512,0.531,0.538,0.412],"ar":1.615},"w":{"r":[0.312,0.336,0.28,0.248,0.232,0.224,0.216,0.216,0.216,0.216,0.224,0.232,0.24,0.248,0.264,0.28,0.304,0.336,0.368,0.424,0.48,0.552,0.608,0.672,0.732,0.784,0.828,0.872,0.904,0.936,0.96,0.976,0.992,1.0,1.0,0.992,0.984,0.968,0.944,0.92,0.88,0.832,0.784,0.712,0.624,0.528,0.516,0.384],"ar":1.68},"b":{"r":[0.442,0.592,0.624,0.618,0.611,0.621,0.661,0.712,0.762,0.799,0.831,0.868,0.893,0.918,0.937,0.95,0.969,0.975,0.987,0.994,1.0,1.0,1.0,1.0,0.994,0.987,0.981,0.969,0.956,0.937,0.925,0.906,0.887,0.868,0.843,0.818,0.787,0.755,0.724,0.687,0.643,0.605,0.555,0.498,0.467,0.455,0.429,0.304],"ar":0.959}};
// 도자기 종류: 이름 · 흙 · 흙 빛깔 · 유약 빛깔 · 가마에서 꺼낼 칸(%) · 무늬 [그림, 이름, 등급(0 하 · 1 중 · 2 최상), 확률]
const KINDS = {
  b: { name: '분청사기', clay: 'clayB', c0: '#9C8A78', c1: '#D8CFC2', zone: [36, 54], pats: [['b1', '물고기 무늬', 2, 0.3], ['b0', '무늬 없음', 1, 0.7]] },
  c: { name: '청자', clay: 'clayC', c0: '#8E9A8A', c1: '#8FCBB3', zone: [54, 71], pats: [['c2', '고려청자 상감무늬', 2, 0.2], ['c1', '구름 학 무늬', 1, 0.3], ['c0', '무늬 없음', 0, 0.5]] },
  w: { name: '백자', clay: 'clayW', c0: '#C9C2B6', c1: '#F7F6F1', zone: [70, 86], pats: [['w2', '까치와 호랑이 무늬', 2, 0.2], ['w1', '난초 무늬', 1, 0.3], ['w0', '무늬 없음', 0, 0.5]] },
};
const ORDER = ['b', 'c', 'w'];
const SHAPE_G = [[90, '수', 5], [80, '우', 4], [70, '미', 3], [60, '양', 2.5], [50, '가', 2], [40, '현', 1.5], [0, '황', 1.2]];
const FIRE = [['하', 2000, 30], ['중', 3000, 65], ['상', 5000, 100]];
const PAT_BONUS = [5000, 7000, 15000], PAT_PT = [30, 65, 100], PAT_NAME = ['하급', '중급', '최상급'];
const FINAL = [[90, 'S', 1], [80, 'A', 0.9], [70, 'B', 0.8], [60, 'C', 0.7], [50, 'D', 0.6], [40, 'E', 0.5], [0, 'F', 0.4]];
const won = n => `${Math.round(n).toLocaleString()}코인`;
const dayNo = t => Math.floor((t + 9 * 3600e3) / 86400e3);
const lerp = (a, b, t) => a + (b - a) * t;
const resample = (arr, n) => Array.from({ length: n }, (_, i) => { const f = (i / (n - 1)) * (arr.length - 1), a = Math.floor(f), b = Math.min(arr.length - 1, a + 1); return lerp(arr[a], arr[b], f - a); });

// 게시한 도자기 정산(5분이 지났으면 팔렸는지 굴려 본다) · 앱을 꺼도 시간은 흐른다
export function potSettle(bag, earn, save, quiet) { const P = bag.pot; if (!P || !P.posts || !P.posts.length) return; const now = Date.now(); let ch = 0;
  P.posts.forEach(p => { if (p.done || now < p.end) return; const gi = FINAL.findIndex(g => g[1] === p.grade), sold = Math.random() < (FINAL[gi] || FINAL[6])[2];
    p.done = 1; p.sold = sold ? 1 : 0; p.pay = sold ? p.price : p.grade === 'F' ? p.cost : Math.round(p.price * 0.8); p.dGrade = sold ? p.grade : (FINAL[gi + 1] || FINAL[6])[1]; ch = 1;
    earn(p.pay); if (!quiet) { sfx(sold ? 'coin' : 'bad'); toast(sold ? `🏺 ${p.nm}(${p.grade}급)이 팔렸어요! +${won(p.pay)}` : `🏺 ${p.nm}(${p.grade}급)이 안 팔려 ${p.grade === 'F' ? '재료값에' : `${p.dGrade}급 값으로`} 처분됐어요 · +${won(p.pay)}`, 3200); } });
  if (ch) { P.posts = P.posts.filter(p => !p.done || now - p.end < 6 * 3600e3).slice(-12); save(); } }

export function openPottery({ bag, save, earn, demo, onClose }) {
  const P = bag.pot || (bag.pot = { day: 0, n: 0, posts: [] }); P.posts = P.posts || [];
  const today = dayNo(Date.now()); if (P.day !== today) { P.day = today; P.n = 0; }
  const fast = demo && /[?&]potfast\b/.test(location.search);
  const root = h('div', { class: 'pt' }), body = h('div', { class: 'pt-body' });
  const close = () => { clearInterval(tk); root.remove(); save(); onClose && onClose(); };
  const head = h('div', { class: 'pt-head' }, h('b', null, '🏺 해피도자기'), h('button', { class: 'top-x', 'aria-label': '닫기', onClick: () => (busy ? modal({ title: '🏺 그만둘까요?', body: h('p', { class: 'center' }, '지금 만들던 도자기는 깨져서 없어져요.', h('br'), '(쓴 재료와 오늘 횟수는 돌아오지 않아요)'), actions: [{ label: '계속 만들기' }, { label: '그만두기', primary: true, onClick: c => { if (typeof c === 'function') c(); busy = false; close(); } }] }) : close()) }, '✕'));
  root.append(head, body); document.body.append(root); let busy = false;
  const tk = setInterval(() => { potSettle(bag, earn, save); if (scr === 'home' && postBox) postBox.replaceChildren(...postsEl()); }, 1000); let scr = '';
  const say = t => h('div', { class: 'pt-say' }, h('b', null, '도암 스승'), h('span', null, t));
  const has = k => (bag[k] || 0) > 0;

  let postBox = null;
  const postsEl = () => { const now = Date.now(); return P.posts.length ? [h('b', null, '🪧 게시한 도자기'), ...P.posts.slice().reverse().map(p => { const s = Math.max(0, Math.ceil((p.end - now) / 1000));
        return h('div', { class: 'pt-post' + (p.done ? (p.sold ? ' sold' : ' cut') : '') }, h('img', { src: `${PI}${p.img}.webp?v=1`, alt: '' }), h('div', null, h('b', null, `${p.nm} · ${p.grade}급`), h('small', null, p.done ? (p.sold ? `✅ 팔렸어요 · +${won(p.pay)}` : `처분(${p.dGrade}급 값) · +${won(p.pay)}`) : `⏳ ${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')} · 팔리면 ${won(p.price)} · 팔릴 확률 ${Math.round(FINAL.find(g => g[1] === p.grade)[2] * 100)}%`))); })] : []; };
  function home() { scr = 'home'; const now = Date.now(), left = DAY_MAX - P.n; postBox = h('div', { class: 'pt-posts' }, ...postsEl());
    body.replaceChildren(
      h('div', { class: 'pt-keeper' }, h('img', { src: `${IMG}k-pottery.webp?v=1`, alt: '' }), h('i', null, '도암')),
      say(P.met ? ['흙은 손을 기억하오. 오늘도 정성껏 빚어 보시오.', '서두르면 흙이 먼저 알아차리지요. 허허.', '가마는 거짓말을 하지 않소이다.'][now % 3] : '오호… 그 손끝, 보통 섬세한 손이 아니시구려. 손이 섬세한 황제폐하라면 최고의 제자가 될 수 있겠소. 오늘부터 내 수제자로 들이겠소이다!'),
      h('div', { class: 'pt-mats' }, ...Object.entries(POT_MAT).map(([k, [n]]) => h('span', { class: has(k) ? '' : 'no' }, h('img', { src: `${IMG}i-${k}.webp?v=1`, alt: '' }), `${n} ${bag[k] || 0}`))),
      h('small', { class: 'pt-dim' }, '재료는 부메랑상회에서 사요 · 도자기 하나에 흙 1 · 유약 1 · 안료 1'),
      h('button', { class: 'btn primary pt-go', disabled: left <= 0, onClick: pick }, left > 0 ? `🏺 도자기 빚기 (오늘 ${left}번 남음)` : '오늘은 다 빚었어요 · 내일 다시 와요'),
      postBox,
      h('details', { class: 'pt-rule' }, h('summary', null, '📜 값 매기는 법'), h('p', null, '판매가 = 흙값 × 빚기 배율(수5 · 우4 · 미3 · 양2.5 · 가2 · 현1.5 · 황1.2) + 소성(하 2,000 · 중 3,000 · 상 5,000) + 무늬(하급 5,000 · 중급 7,000 · 최상급 15,000) + 인건비 3,000'), h('p', null, '최종 등급 = 빚기 60% · 소성 25% · 무늬 15% 점수로 S~F. F급은 재료값의 1.45배.'), h('p', null, '게시하면 5분 안에 팔릴 확률: S 100% · A 90% · B 80% · C 70% · D 60% · E 50% · F 40%. 안 팔리면 한 등급 아래 값(×0.8)으로 처분되고, F는 재료값만 돌려받아요.')));
    if (!P.met) { P.met = 1; save(); } }

  function pick() { scr = 'pick';
    body.replaceChildren(say('무엇을 빚겠소? 흙에 따라 도자기가 달라지오.'), h('div', { class: 'pt-kinds' }, ...ORDER.map(k => { const K = KINDS[k], ok = has(K.clay) && has('glaze') && has('pigment');
      return h('button', { class: 'pt-kind', disabled: !ok, onClick: () => start(k) }, h('img', { src: `${PI}${k}0.webp?v=1`, alt: '' }), h('b', null, K.name), h('small', null, `${POT_MAT[K.clay][0]} ${bag[K.clay] || 0} · 유약 ${bag.glaze || 0} · 안료 ${bag.pigment || 0}`), !ok && h('em', null, '재료 부족')); })), h('button', { class: 'btn', onClick: home }, '← 돌아가기')); }

  function start(k) { const K = KINDS[k]; if (!(has(K.clay) && has('glaze') && has('pigment'))) return toast('재료가 모자라요 · 부메랑상회에서 사요', 2000); if (P.n >= DAY_MAX) return toast('오늘은 3번 다 빚었어요', 1800);
    bag[K.clay]--; bag.glaze--; bag.pigment--; P.n++; save(); busy = true;
    const job = { k, cost: POT_MAT[K.clay][1] + POT_MAT.glaze[1] + POT_MAT.pigment[1], clay: POT_MAT[K.clay][1] }; shape(job); }

  // ───── 1. 흙 빚기: 1분 동안 빠르게 도는 흙덩이를 손끝으로 깎아 위쪽 본보기 모양에 맞춘다 ─────
  function shape(job) { scr = 'shape'; const K = KINDS[job.k], pr = PROF[job.k], N = 96, tgt = resample(pr.r, N);
    const cv = h('canvas', { class: 'pt-cv' }), time = h('b', { class: 'pt-time' }, `${SHAPE_SEC}`), note = h('small', { class: 'pt-note' }, '본보기 모양을 잘 봐 두세요…'), done = h('button', { class: 'btn primary', disabled: true }, '✋ 다 빚었어요');
    body.replaceChildren(h('div', { class: 'pt-shapetop' }, h('div', { class: 'pt-ex' }, h('img', { src: `${PI}${job.k}0.webp?v=1`, alt: '' }), h('small', null, '본보기')), h('div', null, h('b', null, `${K.name} 빚기`), note), time), cv, done);
    const dpr = Math.min(2, window.devicePixelRatio || 1), CW = Math.min(380, body.clientWidth - 8), CH = Math.round(Math.min(window.innerHeight * 0.56, 470)); cv.width = CW * dpr; cv.height = CH * dpr; cv.style.width = CW + 'px'; cv.style.height = CH + 'px'; const g = cv.getContext('2d'); g.scale(dpr, dpr);
    const top = 26, bot = CH - 58, Hc = bot - top, maxR = Math.min(CW * 0.42, Hc / (2 * pr.ar)), rowH = Hc / N, R0 = maxR * 1.14, minR = 4, tip = 5.5;
    const r = Array.from({ length: N }, (_, i) => R0 * (i < 2 ? 0.97 : 1)), T = tgt.map(v => v * maxR);
    let t0 = performance.now(), phase = 0 /* 0 본보기 보기 · 1 빚기 · 2 끝 */, startAt = t0 + 2600, raf = 0, ang = 0, down = null, chips = [], last = t0;
    const cxAt = t => CW / 2 + Math.sin(t * 0.017) * 1.6 + Math.sin(t * 0.0053) * 1.2; /* 물레가 미세하게 흔들려 손이 떨리는 느낌 */
    const carve = (px, py) => { const cx = cxAt(performance.now()), d = Math.abs(px - cx); let hit = 0;
      for (let i = Math.max(0, Math.floor((py - top - tip) / rowH)); i <= Math.min(N - 1, Math.ceil((py - top + tip) / rowH)); i++) { const yc = top + (i + 0.5) * rowH, dy = Math.abs(yc - py); if (dy > tip) continue; const lim = Math.max(minR, d - Math.sqrt(tip * tip - dy * dy)); if (lim < r[i]) { r[i] = lim; hit = 1; } }
      if (hit) { if (chips.length < 60) chips.push({ x: px, y: py, vx: (px < cx ? -1 : 1) * (1 + Math.random() * 2), vy: -1 - Math.random() * 2, a: 1 }); if (Math.random() < 0.25) sfx('tock'); if (navigator.vibrate && Math.random() < 0.15) navigator.vibrate(6); } };
    const pos = e => { const b = cv.getBoundingClientRect(); return [e.clientX - b.left, e.clientY - b.top]; };
    cv.addEventListener('pointerdown', e => { if (phase !== 1) return; e.preventDefault(); cv.setPointerCapture(e.pointerId); down = pos(e); carve(...down); });
    cv.addEventListener('pointermove', e => { if (phase !== 1 || !down) return; e.preventDefault(); const p = pos(e), steps = Math.ceil(Math.hypot(p[0] - down[0], p[1] - down[1]) / 2); for (let s = 1; s <= steps; s++) carve(lerp(down[0], p[0], s / steps), lerp(down[1], p[1], s / steps)); down = p; });
    const up = () => { down = null; }; cv.addEventListener('pointerup', up); cv.addEventListener('pointercancel', up);
    const path = (rs, cx) => { const p = new Path2D(); p.moveTo(cx - rs[0], top); for (let i = 0; i < N; i++) p.lineTo(cx - rs[i], top + (i + 0.5) * rowH); p.lineTo(cx - rs[N - 1], bot); p.lineTo(cx + rs[N - 1], bot); for (let i = N - 1; i >= 0; i--) p.lineTo(cx + rs[i], top + (i + 0.5) * rowH); p.lineTo(cx + rs[0], top); p.closePath(); return p; };
    const draw = now => { const cx = cxAt(now), dt = Math.min(0.05, (now - last) / 1000); last = now; ang += dt * 13; g.clearRect(0, 0, CW, CH);
      // 물레
      g.fillStyle = '#5B3A22'; g.beginPath(); g.ellipse(CW / 2, bot + 14, maxR * 1.45, 18, 0, 0, Math.PI * 2); g.fill(); g.fillStyle = '#8A5A34'; g.beginPath(); g.ellipse(CW / 2, bot + 6, maxR * 1.4, 15, 0, 0, Math.PI * 2); g.fill();
      for (let k = 0; k < 10; k++) { const a = ang + (k * Math.PI) / 5, x = CW / 2 + Math.cos(a) * maxR * 1.3; if (Math.sin(a) > 0) { g.fillStyle = 'rgba(255,230,190,.35)'; g.fillRect(x - 2, bot + 2 + Math.sin(a) * 9, 4, 3); } }
      // 흙덩이(돌아가는 결)
      const p = path(r, cx), gr = g.createLinearGradient(cx - R0, 0, cx + R0, 0); gr.addColorStop(0, K.c0); gr.addColorStop(0.32, '#fff8ee'); gr.addColorStop(0.42, K.c1); gr.addColorStop(1, K.c0); g.fillStyle = K.c0; g.fill(p); g.save(); g.clip(p); g.globalAlpha = 0.9; g.fillStyle = gr; g.fillRect(0, 0, CW, CH); g.globalAlpha = 1;
      for (let i = 0; i < N; i += 2) { const y = top + (i + 0.5) * rowH; for (let k = 0; k < 4; k++) { const a = ang * 1.3 + k * 1.57 + i * 0.04, s = Math.sin(a); if (Math.cos(a) < 0) continue; g.fillStyle = 'rgba(80,50,30,.16)'; g.fillRect(cx + s * r[i] - 1, y - rowH, 2, rowH * 2.1); } }
      g.restore(); g.strokeStyle = 'rgba(70,40,20,.55)'; g.lineWidth = 1.4; g.stroke(p);
      // 시작 전: 본보기 윤곽을 잠깐 보여 준다
      if (phase === 0) { g.save(); g.setLineDash([6, 5]); g.strokeStyle = '#E8473B'; g.lineWidth = 2.2; g.stroke(path(T, CW / 2)); g.restore(); }
      if (phase === 2) { g.save(); g.setLineDash([6, 5]); g.strokeStyle = '#E8473B'; g.lineWidth = 2; g.stroke(path(T, CW / 2)); g.restore(); }
      chips = chips.filter(c => (c.x += c.vx, c.y += c.vy, c.vy += 0.25, c.a -= 0.03) > 0); chips.forEach(c => { g.globalAlpha = c.a; g.fillStyle = K.c0; g.fillRect(c.x, c.y, 3, 3); }); g.globalAlpha = 1;
      if (down && phase === 1) { g.fillStyle = 'rgba(255,255,255,.65)'; g.beginPath(); g.arc(down[0], down[1], tip, 0, Math.PI * 2); g.fill(); } };
    const score = () => { let e = 0, w = 0; for (let i = 0; i < N; i++) { const wi = i < 4 || i > N - 4 ? 0.5 : 1; e += (Math.abs(r[i] - T[i]) / maxR) * wi; w += wi; } return Math.max(0, Math.min(100, Math.round(100 * (1 - e / w / 0.4)))); };
    const finish = () => { if (phase === 2) return; phase = 2; done.disabled = true; const pct = score(), sg = SHAPE_G.find(s => pct >= s[0]); job.pct = pct; job.sg = sg; job.r = r.map(v => v / maxR); job.ar = pr.ar; sfx(pct >= 80 ? 'fanfare' : pct >= 50 ? 'coin' : 'bad');
      note.textContent = `일치율 ${pct}% · 빚기 「${sg[1]}」 (흙값 ×${sg[2]})`; time.textContent = sg[1]; time.className = 'pt-time g'; setTimeout(() => { cancelAnimationFrame(raf); draw(performance.now()); body.append(say(pct >= 90 ? '허허! 내 평생 이런 손은 처음 보오!' : pct >= 70 ? '제법이오. 흙이 폐하를 따르는구려.' : pct >= 50 ? '나쁘지 않소. 손이 조금 급했소이다.' : '흙이 울고 있소… 다음엔 천천히 깎아 보시오.'), h('button', { class: 'btn primary', onClick: () => glaze(job) }, '다음: 유약 칠하기 →')); }, 400); };
    done.onclick = finish;
    const loop = now => { if (!root.isConnected) return; if (phase === 0 && now >= startAt) { phase = 1; t0 = now; done.disabled = false; note.textContent = '물레가 돌아요! 손끝으로 흙을 깎아 본보기처럼 다듬어요 · 살짝만 닿아도 깎여요'; sfx('pop'); }
      if (phase === 1) { const left = SHAPE_SEC - (now - t0) / 1000; time.textContent = `${Math.max(0, Math.ceil(left))}`; time.classList.toggle('low', left < 10); if (left <= 0) finish(); }
      if (phase === 0) time.textContent = `${Math.ceil((startAt - now) / 1000)}`;
      draw(now); if (phase !== 2) raf = requestAnimationFrame(loop); };
    raf = requestAnimationFrame(loop); }

  // 빚은 모양 그림(유약 · 가마 · 결과에 쓴다)
  const shapeSvg = (job, fill, gloss) => { const N = job.r.length, W = 120, Hh = Math.round(W * job.ar * 0.5) * 2, top = 2, rowH = (Hh - 4) / N, m = W / 2 - 2; let L = '', Rr = '';
    for (let i = 0; i < N; i++) { const y = (top + (i + 0.5) * rowH).toFixed(1); L += `L${(W / 2 - job.r[i] * m).toFixed(1)},${y} `; Rr = `L${(W / 2 + job.r[i] * m).toFixed(1)},${y} ` + Rr; }
    return `<svg viewBox="0 0 ${W} ${Hh}" xmlns="http://www.w3.org/2000/svg"><defs><linearGradient id="pg" x1="0" x2="1"><stop offset="0" stop-color="${fill[0]}"/><stop offset=".35" stop-color="${gloss ? '#ffffff' : fill[1]}"/><stop offset=".5" stop-color="${fill[1]}"/><stop offset="1" stop-color="${fill[0]}"/></linearGradient></defs><path d="M${(W / 2 - job.r[0] * m).toFixed(1)},${top} ${L}${Rr}L${(W / 2 + job.r[0] * m).toFixed(1)},${top}Z" fill="url(#pg)" stroke="#5a3a22" stroke-width="1.2"/></svg>`; };

  // ───── 2. 유약: 한 번에 끝 ─────
  function glaze(job) { scr = 'glaze'; const K = KINDS[job.k], pot = h('div', { class: 'pt-pot', html: shapeSvg(job, [K.c0, K.c1]) }), btn = h('button', { class: 'btn primary pt-go' }, '🫙 유약 칠하기');
    body.replaceChildren(say('유약은 도자기의 옷이오. 고루 입혀 주시오.'), pot, btn);
    btn.onclick = () => { btn.disabled = true; sfx('splash'); pot.classList.add('glazing'); setTimeout(() => { pot.innerHTML = shapeSvg(job, [K.c0, K.c1], true); pot.classList.add('glossy'); sfx('point'); btn.replaceWith(h('button', { class: 'btn primary pt-go', onClick: () => kiln(job) }, '🔥 가마에 넣기 →')); }, 900); }; }

  // ───── 3. 가마: 온도 게이지가 오르는 동안 알맞은 칸에서 꺼낸다 ─────
  function kiln(job) { scr = 'kiln'; const K = KINDS[job.k], [z0, z1] = K.zone, mid = (z0 + z1) / 2, sweet = 1.6;
    const fill = h('i', { class: 'pt-gfill' }), needle = h('i', { class: 'pt-gneedle' }), zone = h('i', { class: 'pt-gzone', style: { left: z0 + '%', width: z1 - z0 + '%' } }, h('i', { class: 'pt-gsweet', style: { left: ((mid - sweet - z0) / (z1 - z0)) * 100 + '%', width: ((sweet * 2) / (z1 - z0)) * 100 + '%' } }));
    const glow = h('div', { class: 'pt-kilnglow' }), temp = h('b', { class: 'pt-temp' }, '800℃'), btn = h('button', { class: 'btn primary pt-go pt-out', disabled: true }, '🧤 꺼내기!');
    body.replaceChildren(say(`${K.name}는 노란 칸에서, 한가운데 빨간 줄에 맞춰 꺼내면 최고요!`), h('div', { class: 'pt-kiln' }, h('img', { src: `${PI}kiln.webp?v=1`, alt: '' }), glow, temp), h('div', { class: 'pt-gauge' }, zone, fill, needle), h('small', { class: 'pt-dim' }, '게이지가 오르는 동안 한 번만 누를 수 있어요 · 너무 늦거나 이르면 하급'), btn);
    let v = 0, go = false, t0 = 0, raf = 0, end = false; const DUR = 5200;
    const stop = () => { if (end) return; end = true; cancelAnimationFrame(raf); btn.disabled = true; const inZ = v >= z0 && v <= z1, hit = Math.abs(v - mid) <= sweet, fi = hit ? 2 : inZ ? 1 : 0; job.fi = fi; sfx(fi === 2 ? 'fanfare' : fi === 1 ? 'coin' : 'bad'); needle.classList.add('stop');
      setTimeout(() => { body.append(h('p', { class: 'pt-res' }, h('b', null, `소성 「${FIRE[fi][0]}급」`), ` · +${won(FIRE[fi][1])}`, h('br'), h('small', null, fi === 2 ? '불을 정확히 읽었소!' : fi === 1 ? '칸은 맞혔지만 한가운데는 아니오.' : v > z1 ? '너무 오래 구웠소… 빛이 탁해졌구려.' : '덜 구워졌소…')), h('button', { class: 'btn primary', onClick: () => paint(job) }, '다음: 안료 붓기 →')); }, 500); };
    btn.onclick = stop;
    setTimeout(() => { if (!root.isConnected) return; go = true; btn.disabled = false; t0 = performance.now(); sfx('crackle'); const loop = now => { if (end || !root.isConnected) return; const x = Math.min(1, (now - t0) / DUR); v = 100 * (x * x * 0.45 + x * 0.55); fill.style.width = v + '%'; needle.style.left = v + '%'; temp.textContent = `${Math.round(800 + v * 6)}℃`; glow.style.opacity = (0.25 + v / 120).toFixed(2); if (x >= 1) return stop(); raf = requestAnimationFrame(loop); }; raf = requestAnimationFrame(loop); }, 1200); }

  // ───── 4. 안료: 무늬는 순전히 운 ─────
  function paint(job) { scr = 'paint'; const K = KINDS[job.k], img = h('img', { class: 'pt-final', src: `${PI}${job.k}0.webp?v=1`, alt: '' }), btn = h('button', { class: 'btn primary pt-go' }, '🎨 안료 붓기');
    body.replaceChildren(say('안료는 붓는 순간 하늘이 정하오. 마음을 비우시오.'), img, btn);
    btn.onclick = () => { btn.disabled = true; let x = Math.random(), pat = K.pats[K.pats.length - 1]; for (const p of K.pats) { if (x < p[3]) { pat = p; break; } x -= p[3]; } job.pat = pat; let n = 0; const iv = setInterval(() => { img.src = `${PI}${K.pats[n++ % K.pats.length][0]}.webp?v=1`; sfx('tock'); }, 140);
      setTimeout(() => { clearInterval(iv); img.src = `${PI}${pat[0]}.webp?v=1`; img.classList.add('pop'); sfx(pat[2] === 2 ? 'fanfare' : 'coin'); result(job); }, 1900); }; }

  // ───── 5. 최종 등급 · 게시 ─────
  function result(job) { const K = KINDS[job.k], sg = job.sg, fi = job.fi, pat = job.pat, score = Math.round(job.pct * 0.6 + FIRE[fi][2] * 0.25 + PAT_PT[pat[2]] * 0.15), fg = FINAL.find(g => score >= g[0]);
    const calc = Math.round(job.clay * sg[2] + FIRE[fi][1] + PAT_BONUS[pat[2]] + LABOR), price = fg[1] === 'F' ? Math.round(job.cost * 1.45) : calc, nm = `${K.name}${pat[2] ? ` · ${pat[1]}` : ''}`;
    const rows = [['🏺 빚기', `${job.pct}% · ${sg[1]} (흙값 ${won(job.clay)} ×${sg[2]})`, won(job.clay * sg[2])], ['🔥 소성', `${FIRE[fi][0]}급`, `+${won(FIRE[fi][1])}`], ['🎨 무늬', `${pat[1]} (${PAT_NAME[pat[2]]})`, `+${won(PAT_BONUS[pat[2]])}`], ['🤲 인건비', '', `+${won(LABOR)}`]];
    body.append(h('div', { class: 'pt-card g' + fg[1] }, h('div', { class: 'pt-grade' }, h('b', null, fg[1]), h('small', null, `${score}점`)), h('b', { class: 'pt-nm' }, nm),
      h('table', null, ...rows.map(r => h('tr', null, h('td', null, r[0]), h('td', null, r[1]), h('td', null, r[2])))),
      h('p', { class: 'pt-price' }, fg[1] === 'F' ? `F급 · 재료값 ${won(job.cost)} × 1.45 = ` : '판매가 ', h('b', null, won(price))), h('small', { class: 'pt-dim' }, `재료값 ${won(job.cost)} · 5분 안에 팔릴 확률 ${Math.round(fg[2] * 100)}% · 안 팔리면 ${fg[1] === 'F' ? `재료값 ${won(job.cost)}` : `한 등급 아래 값 ${won(price * 0.8)}`}`),
      h('button', { class: 'btn primary pt-go', onClick: e => { e.target.disabled = true; P.posts.push({ id: Date.now(), k: job.k, img: pat[0], nm, grade: fg[1], price, cost: job.cost, end: Date.now() + (fast ? 20000 : 300000) }); busy = false; save(); sfx('coin'); toast(`🪧 ${nm}(${fg[1]}급)을 게시했어요! 5분 안에 팔리면 ${won(price)}`, 2600); home(); } }, '🪧 게시하기')));
    setTimeout(() => body.lastChild && body.lastChild.scrollIntoView({ behavior: 'smooth', block: 'center' }), 200); }

  home();
  return close; }
