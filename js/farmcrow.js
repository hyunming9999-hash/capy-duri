// 농장 까마귀: 하루 한 번, 친목회 육지나 농장에 있을 때 아무 때나 나타난다.
// 나타나면 1분 안에 농장에 가서 새총으로 쫓아내야 한다. 못 쫓아내면 자라는 이랑 하나를 통째로 가져간다.
import { h, toast, modal, ymd } from './ui.js';
import { sfx } from './sound.js';
import { cropOf, cropImg } from './farm.js';

const LIMIT = 60000;
const LV = [null, { n: '초급', need: 2, sp: 150, turn: 1.6, dash: 0, r: 46 }, { n: '중급', need: 2, sp: 230, turn: 1.0, dash: 0.15, r: 40 }, { n: '고급', need: 2, sp: 320, turn: 0.55, dash: 0.35, r: 34 }];
const GAME_S = 20;

export function farmCrow(ctx, { goFarm }) {
  const ref = 'farm/' + ctx.uid; let data = {}, ready = false, stay = 0, last = 0, game = null, banner = null, dead = false, busy = false;
  const off = ctx.store.on(ref, v => { data = v || {}; ready = true; });
  const cw = () => data.crow || {}, today = () => ymd();
  const liveRows = () => { const out = []; Object.entries(data.plots || {}).forEach(([k, p]) => { if (!p) return; if (p.c) { if (!p.lost) out.push({ k, i: null, r: p }); return; } Object.entries(p.rows || {}).forEach(([i, r]) => { if (r && r.c && !r.lost) out.push({ k, i, r }); }); }); return out; };
  const put = patch => ctx.store.update(ref, Object.fromEntries(Object.entries(patch).map(([key, v]) => ['crow/' + key, v]))).catch(() => {});

  // 하루 계획: 육지·농장에 머문 시간이 at 을 넘는 순간 나타난다(40초 ~ 6분 사이 아무 때나)
  function plan() { const c = cw(); if (c.day === today()) return c; const at = Math.round((40 + Math.random() * 320) * 1000), lv = 1 + Math.floor(Math.random() * 3); data = { ...data, crow: { day: today(), at, lv } }; put({ day: today(), at, lv, until: null, res: null, arrived: null }); return data.crow; }

  async function steal(why) { if (busy) return; busy = true; const L = liveRows(), c = cw(); put({ res: 'lost' }); data = { ...data, crow: { ...c, res: 'lost' } }; hideBanner();
    if (!L.length) { busy = false; return; }
    const v = L[Math.floor(Math.random() * L.length)], path = v.i == null ? `plots/${v.k}/lost` : `plots/${v.k}/rows/${v.i}/lost`;
    await ctx.store.update(ref, { [path]: true }).catch(() => {}); sfx('bad'); const cr = cropOf(v.r.c) || { name: '작물' };
    modal({ title: '🐦‍⬛ 까마귀가 가져갔어요…', body: [h('div', { class: 'fc-lost' }, h('img', { src: 'img/crow/crow.webp', alt: '' }), h('img', { class: 'fc-loot', src: cropImg(v.r.c), alt: '' })),
      h('p', { class: 'center' }, `${why} ${Number(v.k) + 1}번 밭의 ${cr.name} 이랑 하나를 통째로 물고 날아갔어요.`), h('p', { class: 'center dim' }, '까마귀는 하루에 한 번 와요. 나타나면 1분 안에 농장으로!')], actions: [{ label: '확인', primary: true }] });
    busy = false; }

  function showBanner() { if (banner) return; const tm = h('b', { class: 'fc-t' }), go = h('button', { class: 'fc-go', onClick: () => goFarm() }, '🌾 농장으로 가기');
    banner = h('div', { class: 'fc-banner' }, h('img', { src: 'img/crow/crow.webp', alt: '' }), h('div', null, h('strong', null, '까마귀가 내 밭에 나타났어요!'), h('small', null, '1분 안에 농장에 가서 새총으로 쫓아내요'), tm), go); banner.tm = tm; document.body.append(banner); sfx('bad'); }
  function hideBanner() { if (banner) { banner.remove(); banner = null; } }

  // 연습 모드: 주소 끝에 ?crowtest (또는 ?crowtest=2·3 단계) 를 붙이고 농장에 들어가면 바로 새총 놀이를 한다. 기록·작물에는 아무 영향 없음
  const TEST = (() => { try { const v = new URLSearchParams(location.search).get('crowtest'); return v == null ? 0 : Math.max(1, Math.min(3, +v || 1)); } catch { return 0; } })(); let testOn = false;
  function tick(now, where) {
    if (dead || !ready) return;
    if (TEST && where !== 'farm') testOn = false;
    if (TEST && where === 'farm' && !game && !testOn && !document.querySelector('.modal-wrap')) { testOn = true; startGame(TEST, true); return; } const dt = last ? Math.min(1000, now - last) : 0; last = now; const c = plan(), t = ctx.store.now();
    if (c.res) return hideBanner();
    if (game) return;
    if (c.until) { // 나타난 상태
      if (where === 'farm' && !c.arrived && t <= c.until) { data = { ...data, crow: { ...c, arrived: 1 } }; put({ arrived: 1 }); }
      if (cw().arrived) { hideBanner(); if (where === 'farm' && !document.querySelector('.modal-wrap')) startGame(c.lv || 1); return; }
      if (t > c.until) return steal('1분 안에 오지 못해서');
      showBanner(); const s = Math.max(0, Math.ceil((c.until - t) / 1000)); banner.tm.textContent = `⏰ 0:${String(s).padStart(2, '0')}`; banner.classList.toggle('hurry', s <= 15); return; }
    if (!where) return; if (!liveRows().length) return; // 자라는 작물이 없으면 오지 않는다
    stay += dt; if (stay < c.at) return;
    const until = t + LIMIT; data = { ...data, crow: { ...c, until, arrived: where === 'farm' ? 1 : null } }; put({ until, arrived: where === 'farm' ? 1 : null });
    if (where !== 'farm') showBanner(); }

  // 새총 놀이: 화면을 누르면 그쪽으로 돌을 쏜다. 제한 시간 안에 정해진 만큼 맞히면 까마귀가 도망간다
  function startGame(lvN, test) { const lv = LV[lvN] || LV[1]; let hits = 0, shots = [], reload = 0, t0 = performance.now(), lastF = t0, raf = 0, over = false;
    const crowEl = h('img', { class: 'fc-crow', src: 'img/crow/crow.webp', alt: '까마귀' }), arena = h('div', { class: 'fc-arena' }, crowEl);
    const dots = h('span', { class: 'fc-dots' }), bar = h('i', { class: 'fc-bar' }), msg = h('div', { class: 'fc-msg' }, '까마귀를 눌러서 새총을 쏘세요!');
    // 새총: 누르면 고무줄이 뒤로 쭉 늘어났다가(0.14초) 놓으면 탁 튕기며 돌이 주머니에서 날아간다
    const sling = h('div', { class: 'fc-sling', html: '<svg viewBox="0 -10 80 110" style="overflow:visible"><path d="M40 98 V56 M40 58 L16 14 M40 58 L64 14" stroke="#8B5A2B" stroke-width="10" stroke-linecap="round" fill="none"/><path class="fc-band" d="M16 16 Q40 46 64 16" stroke="#C2410C" stroke-width="4.5" fill="none" stroke-linecap="round"/><circle class="fc-pouch" cx="40" cy="31" r="8" fill="#9CA3AF" stroke="#4B5563" stroke-width="2"/></svg>' });
    let pull = 0, pullTo = null; // pull: 0(그대로)~1(끝까지 당김). pullTo = 당기는 중인 한 발
    const drawSling = () => { const band = sling.querySelector('.fc-band'), pouch = sling.querySelector('.fc-pouch'), y = 31 + pull * 52; band.setAttribute('d', `M16 16 Q40 ${(46 + pull * 70).toFixed(1)} 64 16`); pouch.setAttribute('cy', y.toFixed(1)); pouch.setAttribute('r', pull > 0.05 ? 8 : 8); pouch.style.display = pull > 0.02 || !pullTo ? '' : ''; };
    const el = h('div', { class: 'fc lv' + lvN }, h('div', { class: 'fc-top' }, h('b', null, `🐦‍⬛ 까마귀 쫓아내기 · ${lv.n}${test ? ' (연습)' : ''}`), dots, h('div', { class: 'fc-time' }, bar)), arena, msg, sling);
    document.body.append(el); game = { el };
    const W = () => arena.clientWidth, H = () => arena.clientHeight, CS = 92;
    const cr = { x: W() * 0.5, y: H() * 0.3, vx: 1, vy: 0.4, turn: 0, flash: 0 };
    const aim = () => { const a = Math.random() * Math.PI * 2; cr.vx = Math.cos(a); cr.vy = Math.sin(a) * 0.7; };
    const drawDots = () => { dots.textContent = '●'.repeat(hits) + '○'.repeat(Math.max(0, lv.need - hits)); }; drawDots(); aim();
    arena.addEventListener('pointerdown', e => { if (over || reload > performance.now()) return; e.preventDefault(); const r = arena.getBoundingClientRect(), tx = e.clientX - r.left, ty = e.clientY - r.top;
      const sr = sling.getBoundingClientRect(), sx = sr.left + sr.width / 2 - r.left, sy = sr.top + sr.height * 0.37 - r.top; // 새총 주머니 자리(화면 기준)에서 쏜다
      sling.style.transform = `rotate(${Math.max(-25, Math.min(25, Math.atan2(tx - sx, sy - ty) * 57))}deg)`; // 겨눈 쪽으로 새총을 살짝 기울인다
      pullTo = { sx, sy, tx, ty, t: performance.now() }; reload = performance.now() + 420; sfx('tock'); });
    function end(win) { if (over) return; over = true; cancelAnimationFrame(raf);
      if (test) { crowEl.classList.add(win ? 'flee' : 'grab'); msg.textContent = win ? '연습 성공! 까마귀가 도망갔어요 🎉' : '연습 실패… (진짜였다면 이랑 하나를 뺏겼어요)'; sfx(win ? 'bigfish' : 'bad'); setTimeout(() => { el.remove(); game = null; toast('연습 끝 · 다시 하려면 농장에서 나갔다가 다시 들어와요', 2600); }, 1700); return; }
      if (win) { crowEl.classList.add('flee'); msg.textContent = '까마귀가 도망갔어요! 밭을 지켰어요 🎉'; sfx('bigfish'); put({ res: 'win' }); data = { ...data, crow: { ...cw(), res: 'win' } }; setTimeout(() => { el.remove(); game = null; toast('오늘 까마귀는 다시 오지 않아요', 2200); }, 1700); }
      else { msg.textContent = '놓쳤어요… 까마귀가 이랑을 노려요!'; crowEl.classList.add('grab'); setTimeout(() => { el.remove(); game = null; steal('새총을 피한 까마귀가'); }, 1400); } }
    function frame(now) { if (dead) return; const dt = Math.min(0.05, (now - lastF) / 1000); lastF = now; const el2 = (now - t0) / 1000, w = W(), hh = H();
      bar.style.width = Math.max(0, 100 - el2 / GAME_S * 100) + '%';
      cr.turn -= dt; if (cr.turn <= 0) { aim(); cr.turn = lv.turn * (0.6 + Math.random() * 0.8); cr.dash = Math.random() < lv.dash ? 0.45 : 0; }
      const sp = lv.sp * (cr.dash > 0 ? 2.1 : 1) * (cr.flash > 0 ? 1.5 : 1); if (cr.dash > 0) cr.dash -= dt; if (cr.flash > 0) cr.flash -= dt;
      cr.x += cr.vx * sp * dt; cr.y += cr.vy * sp * dt;
      if (cr.x < CS / 2) { cr.x = CS / 2; cr.vx = Math.abs(cr.vx); } if (cr.x > w - CS / 2) { cr.x = w - CS / 2; cr.vx = -Math.abs(cr.vx); }
      if (cr.y < CS / 2) { cr.y = CS / 2; cr.vy = Math.abs(cr.vy); } if (cr.y > hh * 0.72) { cr.y = hh * 0.72; cr.vy = -Math.abs(cr.vy); }
      crowEl.style.transform = `translate(${cr.x - CS / 2}px, ${cr.y - CS / 2}px) scaleX(${cr.vx < 0 ? -1 : 1})`; crowEl.classList.toggle('hit', cr.flash > 0.25);
      if (pullTo) { const k = (now - pullTo.t) / 140; pull = Math.min(1, k); if (k >= 1) { const q = pullTo, d = Math.hypot(q.tx - q.sx, q.ty - q.sy), dur = Math.max(260, Math.min(560, d * 0.85)); const st = h('i', { class: 'fc-stone' }); arena.append(st);
          shots.push({ st, sx: q.sx, sy: q.sy, tx: q.tx, ty: q.ty, at: now, dur, tr: 0 }); pullTo = null; sfx('swing'); sling.classList.remove('snap'); void sling.offsetWidth; sling.classList.add('snap'); } }
      else if (pull > 0) pull = Math.max(0, pull - dt * 14); // 놓으면 고무줄이 탁 돌아온다
      drawSling();
      shots = shots.filter(s => { const u = Math.min(1, (now - s.at) / s.dur), x = s.sx + (s.tx - s.sx) * u, y = s.sy + (s.ty - s.sy) * u - Math.sin(u * Math.PI) * 40; s.st.style.transform = `translate(${x - 9}px, ${y - 9}px) scale(${1.15 - u * 0.5})`;
        if (now - s.tr > 28 && u < 1) { s.tr = now; const tr = h('i', { class: 'fc-trail', style: { transform: `translate(${x - 5}px, ${y - 5}px)` } }); arena.append(tr); setTimeout(() => tr.remove(), 280); } // 날아가는 길에 잔상
        if (u < 1) return true; s.st.remove();
        if (Math.hypot(cr.x - s.tx, cr.y - s.ty) < lv.r) { hits++; cr.flash = 0.5; aim(); cr.turn = lv.turn; drawDots(); sfx('hit'); const p = h('b', { class: 'fc-pow', style: { left: s.tx + 'px', top: s.ty + 'px' } }, '퍽!'); arena.append(p); setTimeout(() => p.remove(), 600); msg.textContent = hits >= lv.need ? '' : `맞혔다! ${lv.need - hits}번 더!`; if (hits >= lv.need) end(true); }
        else sfx('miss');
        return false; });
      if (!over && el2 >= GAME_S) end(false);
      if (!over) raf = requestAnimationFrame(frame); }
    sfx('bad'); raf = requestAnimationFrame(frame); }

  // 앱을 껐다 켜는 사이 1분이 지났으면 그때 가져간다(tick 에서 처리)
  return { tick, dispose: () => { dead = true; off && off(); hideBanner(); if (game) { game.el.remove(); game = null; } },
    debug: () => { stay = 1e9; const c = plan(); data = { ...data, crow: { ...c, at: 0, until: null, res: null, arrived: null } }; put({ at: 0, until: null, res: null, arrived: null }); } };
}
