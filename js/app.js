import { $, h, toast, modal, ask, ymd, dayDiff, niceDate, banner, josa } from './ui.js';
import { openStore, isMock, setErrorHandler } from './store.js';
import { capy, capyEl, COLORS, ACCS } from './capy.js';
import { openArcade, fromArcade, leaveArcade, bindCredit } from './arcade.js';
import { enablePush, sendPush } from './push.js';
import * as day from './day.js';
import * as wear from './wear.js';
import * as eat from './eat.js';
import * as game from './game.js';
import * as chat from './chat.js';
import * as watch from './watch.js';
import * as where from './where.js';
import * as dress from './dress.js';
import * as walk from './walk.js';
import * as gallery from './gallery.js';
import * as social from './social.js';
import { GAMES } from './game.js';
import { capySound, soundOn, setSound, bgm, fxOn, setFx } from './sound.js';
import { setupMoney, won } from './money.js';

// 연습 모드(?mock=이름)에서는 한 브라우저에서 두 사람 흉내를 낼 수 있게 저장 칸을 나눈다
const NS = 'capy.' + (isMock ? (new URLSearchParams(location.search).get('mock') || '') + '.' : '');
const LS = {
  get(k) { try { return localStorage.getItem(NS + k); } catch { return null; } },
  set(k, v) { try { localStorage.setItem(NS + k, v); } catch {} },
  del(k) { try { localStorage.removeItem(NS + k); } catch {} },
};
const rnd = n => { const a = new Uint8Array(n); crypto.getRandomValues(a); return [...a].map(x => 'abcdefghjkmnpqrstuvwxyz23456789'[x % 31]).join(''); };

const MENU = [
  { id: 'chat', mod: chat, title: '오늘 얘기나 하지?', short: '톡', sub: '톡 · 사진 · 스티커', face: 'love', acc: 'flower', tint: '#F6D3EE' },
  { id: 'dress', mod: dress, title: '👗 카피클로', short: '옷놀이', sub: '상의 50 · 하의 50', face: 'happy', acc: 'ribbon', tint: '#FFDDB8' },
  { id: 'day', mod: day, title: '오늘 무슨 날이지?', short: '일정', sub: '일정 · 예약 · 일기', face: 'smile', acc: 'leaf', tint: '#FFE3A6' },
  { id: 'wear', hide: true, mod: wear, title: '오늘 뭐 입지?', short: '코디', sub: '서로 옷 봐주기', face: 'wink', acc: 'ribbon', tint: '#FFD0D6' },
  { id: 'eat', mod: eat, title: '오늘 뭐 먹지?', short: '맛집', sub: '맛집 찾기 · 룰렛', face: 'wow', acc: 'yuzu', tint: '#CDEBB5' },
  { id: 'game', hide: true, mod: game, title: '오늘 무슨 게임하지?', short: '게임', sub: '카피바라 게임 8종', face: 'happy', acc: 'none', tint: '#C9E4F7' },
  { id: 'where', mod: where, title: '오늘 어디야?', short: '어디야', sub: '위치 핑 찍기', face: 'wow', acc: 'leaf', tint: '#BFE8E0' },
  { id: 'watch', mod: watch, title: '오늘 뭐 보실?', short: '영화관', sub: '카피바라 영화관', face: 'sleepy', acc: 'towel', tint: '#D9D2F5' },
  { id: 'walk', mod: walk, title: '카피바라 목욕하실?', short: '목욕탕', sub: '히노끼탕 · 음성 대화', face: 'sleepy', acc: 'towel', tint: '#F3DDB8' },
  { id: 'gallery', mod: gallery, title: '오늘 전시회가실?', short: '전시회', sub: '둘만의 전시실', face: 'wow', acc: 'flower', tint: '#ECECF4' },
  { id: 'social', mod: social, title: '동물 친목회 가실?', short: '친목회', sub: '동물 30마리와 친구 되기', face: 'love', acc: 'leaf', tint: '#D6F0C2' },
];

const root = $('#app');
const ctx = { uid: null, room: null, store: null, members: {}, presence: {}, order: [], idx: 0, dress: {}, partnerWhere: null, battery: {} };
// 우리 방(밍땅꾸리·두두)인지: 두 사람만을 위해 넣은 지급·이벤트는 이 방에서만 돈다(다른 사람이 같은 닉네임을 써도 안 받게)
ctx.ours = () => { const n = Object.values(ctx.members || {}).map(m => m && m.name); return n.includes('밍땅꾸리') && n.includes('두두'); };
Object.defineProperties(ctx, {
  me: { get() { return ctx.members[ctx.uid] || {}; } },
  partnerId: { get() { return ctx.order.find(u => u !== ctx.uid) || null; } },
  partner: { get() { return ctx.members[ctx.partnerId] || null; } },
});
ctx.go = r => { location.hash = r; };
ctx.openArcade = () => openArcade(ctx, GAMES); bindCredit(ctx, GAMES); // 친목회 카피오락 건물 · 동전(크레딧)
ctx.nameOf = uid => (ctx.members[uid] || {}).name || '카피';
// 황금 장비 입어 보기 링크(?goldtest 또는 ?goldtest=10,3,17): 내 화면에서만 입혀 보고 저장하지 않는다
const GOLD_TEST = (() => { try { const v = new URLSearchParams(location.search).get('goldtest'); if (v == null) return null; const l = v.split(',').filter(x => x.trim() !== '').map(Number).filter(n => Number.isInteger(n) && n >= 0); return l.length ? l : [10, 3, 17, 2, 0, 9, 18, 12]; } catch { return null; } })();
ctx.goldTest = GOLD_TEST;
ctx.capyOf = (uid, extra = {}) => { const m0 = ctx.members[uid] || {}, m = GOLD_TEST && uid === ctx.uid ? { ...m0, rare: GOLD_TEST } : m0, d = ctx.dress[uid] || {}, blk = social.goldBlocks(GOLD_TEST && uid === ctx.uid ? GOLD_TEST : social.rareList(m.rare)), dv = k => (blk.has(k) ? '' : d[k]); return { color: m.color, acc: m.acc, top: dv('top'), bottom: dv('bottom'), hat: dv('hat'), shoe: dv('shoe'), pin: m.pin != null && social.PERSONA[m.pin] ? social.PERSONA[m.pin].pin : '', doll: Number.isInteger(m.doll) && m.doll >= 0 && m.doll < 30 ? m.doll : null, rare: GOLD_TEST && uid === ctx.uid ? { ...(social.rareOf(GOLD_TEST.slice(0, 1)) || {}), list: GOLD_TEST } : social.rareOf(m.rare), ...extra, ...(FACES[m.face] && (!extra.face || extra.face === 'happy') && extra.view !== 'back' ? { face: m.face } : {}) }; };
// 표정 고르기: 평소 얼굴(예전에는 늘 웃는 얼굴)을 내가 고른 표정으로 보여 준다. 졸음·기절처럼 상황에 따라 바뀌는 표정은 그대로
const FACES = { happy: '활짝', smile: '방긋', wink: '윙크', love: '하트', shy: '수줍', wow: '깜짝', sleepy: '졸려', sad: '시무룩', cry: '엉엉', angry: '뾰로통' };
ctx.faceOf = uid => { const f = (ctx.members[uid] || {}).face; return FACES[f] ? f : 'happy'; };
ctx.pickFace = done => { const cur = ctx.faceOf(ctx.uid), m = ctx.members[ctx.uid] || {}; let shut;
  const pick = async f => { ctx.members[ctx.uid] = { ...m, face: f }; try { await ctx.store.update('members/' + ctx.uid, { face: f }); toast(`표정을 바꿨어요: ${FACES[f]}`); } catch { toast('저장하지 못했어요'); } shut && shut(); done && done(); };
  shut = modal({ title: '😊 표정 고르기', body: h('div', { class: 'face-grid' }, Object.keys(FACES).map(f => h('button', { class: 'face-b' + (f === cur ? ' on' : ''), onClick: () => pick(f) }, h('span', { html: capy({ color: m.color, face: f, head: true }) }), h('small', null, FACES[f])))) }); };
const fullRoute = () => location.hash.slice(1) || 'home';
const titleOf = r => { const [n, sub] = (r || '').split('-'); const g = n === 'game' && GAMES.find(x => x.id === sub); return g ? g.title : (MENU.find(x => x.id === n) || {}).title || '홈'; };

/* ---------- 배터리 ---------- */
// 각자 휴대폰의 배터리를 방에 올려 두고 홈 화면 캐릭터 옆에 보여 준다. 브라우저가 배터리 정보를 주지 않으면(아이폰 등) lv: -1 로 표시만 남긴다.
function shareBattery() {
  const put = v => ctx.store.set('battery/' + ctx.uid, { ...v, at: ctx.store.now() }).catch(() => {});
  if (!navigator.getBattery) return put({ lv: -1 });
  navigator.getBattery().then(b => {
    const up = () => put({ lv: Math.round(b.level * 100), ch: !!b.charging });
    up(); b.addEventListener('levelchange', up); b.addEventListener('chargingchange', up);
    document.addEventListener('visibilitychange', () => { if (!document.hidden) up(); });
  }).catch(() => put({ lv: -1 }));
}
function drawBatt(el) {
  const uid = el.dataset.batt, b = ctx.battery[uid], known = b && b.lv >= 0, name = uid === ctx.uid ? '내 휴대폰' : ctx.nameOf(uid) + ' 휴대폰';
  const away = uid !== ctx.uid && !ctx.presence[uid] && b && b.at; // 상대가 앱을 닫았으면 마지막 값을 그대로 두고, 언제 값인지 같이 보여 준다
  el.className = 'batt' + (!known ? ' none' : b.lv <= 20 && !b.ch ? ' low' : '') + (known && b.ch ? ' ch' : '');
  el.title = !b ? name + ' 배터리: 아직 모름' : !known ? name + ': 이 기기는 배터리 정보를 알려 주지 않아요' : `${name} 배터리 ${b.lv}%${b.ch ? ' (충전 중)' : ''}${away ? ` (${agoText(b.at)} 마지막 확인)` : ''}`;
  el.setAttribute('aria-label', el.title);
  el.replaceChildren(...[h('span', { class: 'batt-body' }, h('i', { style: { height: (known ? Math.max(6, b.lv) : 0) + '%' } }), known && b.ch && h('em', null, '⚡')), h('b', null, known ? b.lv + '%' : '–'), away && known && h('small', { class: 'batt-ago' }, agoText(b.at))].filter(Boolean));
}
const agoText = ts => { const s = Math.max(0, (ctx.store.now() - ts) / 1000); return s < 90 ? '방금' : s < 3600 ? `${Math.round(s / 60)}분 전` : s < 86400 ? `${Math.floor(s / 3600)}시간 전` : `${Math.floor(s / 86400)}일 전`; };
setInterval(() => document.querySelectorAll('[data-batt]').forEach(drawBatt), 60000);
const battEl = uid => { const el = h('span', { 'data-batt': uid, role: 'img' }); drawBatt(el); return el; };

/* ---------- 알림 ---------- */
// 앱이 열려 있으면 화면 위 알림 띠로, 열어 둔 채 다른 앱을 보고 있으면(허용한 경우) 기기 알림으로도 알려 준다. 앱을 완전히 닫으면 오지 않는다.
function askNotify() { try { if ('Notification' in window && Notification.permission === 'default') Notification.requestPermission().then(() => enablePush(ctx)).catch(() => {}); } catch {} }
function notify(text, label, go) {
  banner(text, label, go);
  try { if (document.hidden && 'Notification' in window && Notification.permission === 'granted' && navigator.serviceWorker) navigator.serviceWorker.ready.then(r => r.showNotification('카피두리', { body: text, icon: 'icons/icon2-192.png', badge: 'icons/badge-96.png', tag: 'capy', renotify: true })).catch(() => {}); } catch {}
}
// 상대를 지금 화면(또는 where)으로 부른다. 10분 안에 상대가 앱을 열면 알림이 뜬다.
// 전화 걸기: 상대 번호를 방에 한 번 저장해 두고, 누르면 폰의 전화 앱으로 건다
const telOf = v => String(v || '').replace(/[^0-9+]/g, '').slice(0, 20);
const prettyTel = n => /^01\d{8,9}$/.test(n) ? n.replace(/^(\d{3})(\d{3,4})(\d{4})$/, '$1-$2-$3') : n;
ctx.phone = () => {
  const pid = ctx.partnerId; if (!pid) return toast('아직 상대가 들어오지 않았어요');
  const name = ctx.nameOf(pid), cur = telOf((ctx.phones || {})[pid]);
  const edit = () => {
    const inp = h('input', { class: 'inp', type: 'tel', inputMode: 'tel', placeholder: '010-1234-5678', value: cur ? prettyTel(cur) : '', maxLength: 20, autocomplete: 'off' });
    modal({ title: `${name} 전화번호`, body: h('div', null, h('p', { class: 'dim' }, '한 번 저장해 두면 다음부터는 바로 걸 수 있어요. 번호는 둘만의 방에만 저장돼요.'), inp),
      actions: [{ label: '취소' }, { label: '저장', primary: true, onClick: async close => { const n = telOf(inp.value); if (n.replace(/\D/g, '').length < 8) return toast('전화번호를 다시 확인해 주세요');
        try { await ctx.store.set('phones/' + pid, n); ctx.phones = { ...(ctx.phones || {}), [pid]: n }; close(); toast('저장했어요. 📞를 누르면 전화를 걸어요'); } catch { toast('저장하지 못했어요'); } } }] });
    setTimeout(() => inp.focus(), 50);
  };
  if (!cur) return edit();
  modal({ title: `${josa(name, '에게', '에게')} 전화할까요?`, body: h('p', { class: 'tel-num' }, prettyTel(cur)),
    actions: [{ label: '번호 바꾸기', onClick: close => { close(); edit(); } }, { label: '취소' }, { label: '📞 전화 걸기', primary: true, onClick: close => { close(); location.href = 'tel:' + cur; } }] });
};
ctx.call = (where, msg) => {
  const pid = ctx.partnerId; if (!pid) return toast('아직 상대가 들어오지 않았어요');
  askNotify();
  ctx.store.set('invite', { from: ctx.uid, to: pid, where: where || fullRoute(), msg: msg || '', ts: ctx.store.now() }).catch(() => {});
  sendPush(ctx, { body: `${josa(ctx.nameOf(ctx.uid), '가', '이')} 불러요: ${msg || titleOf(where || fullRoute())}`, tag: 'capy-call', go: where || fullRoute() });
  toast(ctx.presence[pid] ? `${josa(ctx.nameOf(pid), '를', '을')} 불렀어요` : `${josa(ctx.nameOf(pid), '는', '은')} 지금 접속해 있지 않아요. 10분 안에 들어오면 알림이 떠요`, 3200);
};

let cleanup = null, entered = false, rulesShown = false;

setErrorHandler(e => {
  const msg = String(e && (e.code || e.message) || e);
  if (/permission/i.test(msg)) showRulesHelp(); else toast('연결 오류: ' + msg);
});

/* ---------- 시작 ---------- */
function boot() {
  ctx.uid = LS.get('uid') || (LS.set('uid', rnd(16)), LS.get('uid')) || rnd(16);
  const m = location.hash.match(/^#join=([a-z0-9]{20,})$/i);
  const saved = LS.get('room');
  if (m) {
    history.replaceState(null, '', location.pathname + location.search + '#home');
    if (saved && saved !== m[1]) return ask('이미 다른 방에 들어가 있어요. 초대받은 새 방으로 옮길까요?', '옮기기', '그대로').then(y => start(y ? m[1] : saved));
    return start(m[1]);
  }
  saved ? start(saved) : welcome();
}

function welcome() {
  const inp = h('input', { class: 'inp', placeholder: '초대 링크나 코드 붙여넣기' });
  root.replaceChildren(h('div', { class: 'welcome' },
    h('div', { class: 'welcome-capys' }, capyEl({ color: 'brown', acc: 'yuzu', face: 'happy' }, 'bob'), h('span', { class: 'heart' }, '♥'), capyEl({ color: 'cream', acc: 'flower', face: 'love' }, 'bob late')),
    h('h1', null, '카피두리'), h('p', { class: 'sub' }, '둘만 쓰는 카피바라 놀이터'),
    h('button', { class: 'btn primary big', onClick: () => start(rnd(24)) }, '새로 시작하기'),
    h('div', { class: 'or' }, '초대받았다면'),
    h('div', { class: 'row' }, inp, h('button', { class: 'btn', onClick: () => {
      const c = (inp.value.match(/([a-z0-9]{20,})\s*$/i) || [])[1];
      c ? start(c) : toast('초대 링크를 다시 확인해 주세요');
    } }, '들어가기'))));
}

function start(room) {
  ctx.room = room; LS.set('room', room);
  ctx.store = openStore(room);
  root.replaceChildren(h('div', { class: 'loading' }, capyEl({ face: 'sleepy', acc: 'towel' }, 'bob'), h('p', null, '온천물 데우는 중…')));
  ctx.store.on('members', m => {
    ctx.members = m || {};
    ctx.order = Object.keys(ctx.members).sort((a, b) => (ctx.members[a].at || 0) - (ctx.members[b].at || 0) || a.localeCompare(b));
    ctx.idx = Math.max(0, ctx.order.indexOf(ctx.uid));
    if (ctx.members[ctx.uid]) { if (!entered) enter(); else if (curRoute() === 'home') render(); }
    else if (!entered) ctx.order.length >= 2 ? whoAreYou() : profile(true);
  });
}

function whoAreYou() {
  root.replaceChildren(h('div', { class: 'welcome' }, h('h2', null, '누구세요?'), h('p', { class: 'sub' }, '이 방은 이미 둘이 찼어요. 본인 카피바라를 골라 주세요.'),
    h('div', { class: 'pick-row' }, ctx.order.map(u => h('button', { class: 'pick-card', onClick: () => { ctx.uid = u; LS.set('uid', u); ctx.idx = ctx.order.indexOf(u); enter(); } },
      capyEl(ctx.capyOf(u, { face: 'happy' })), h('b', null, ctx.nameOf(u))))),
    h('button', { class: 'btn ghost', onClick: leave }, '다른 방으로')));
}

function profile(first) {
  const cur = { name: '', color: 'brown', acc: 'yuzu', ...ctx.me };
  const prev = h('div', { class: 'profile-prev' });
  const draw = () => prev.replaceChildren(capyEl({ ...cur, face: FACES[cur.face] ? cur.face : 'happy' }, 'bob'));
  const name = h('input', { class: 'inp', maxLength: 8, placeholder: '별명 (8자까지)', value: cur.name });
  const chips = (obj, key, label) => h('div', { class: 'chips' }, Object.entries(obj).map(([k, v]) => {
    const b = h('button', { class: 'chip' + (cur[key] === k ? ' on' : ''), onClick: () => { cur[key] = k; b.parentNode.querySelectorAll('.chip').forEach(x => x.classList.remove('on')); b.classList.add('on'); draw(); } }, label(k, v));
    return b;
  }));
  const save = async () => {
    cur.name = name.value.trim() || '카피';
    try {
      await ctx.store.update('members/' + ctx.uid, { name: cur.name, color: cur.color, acc: cur.acc, face: FACES[cur.face] ? cur.face : 'happy', at: ctx.me.at || ctx.store.now() });
      if (!first) { toast('바꿨어요'); ctx.go('home'); }
    } catch {}
  };
  draw();
  root.replaceChildren(h('div', { class: 'welcome' }, h('h2', null, first ? '내 카피바라 만들기' : '내 카피바라 바꾸기'), prev, name,
    h('label', { class: 'lbl' }, '털 색'), chips(COLORS, 'color', (k, v) => [h('i', { class: 'dot', style: { background: v.body } }), v.name]),
    h('label', { class: 'lbl' }, '머리 장식'), chips(ACCS, 'acc', (k, v) => v),
    h('label', { class: 'lbl' }, '표정'), (cur.face = FACES[cur.face] ? cur.face : 'happy', chips(FACES, 'face', (k, v) => v)),
    h('button', { class: 'btn primary big', onClick: save }, first ? '시작하기' : '저장'),
    !first && h('button', { class: 'btn ghost', onClick: () => ctx.go('home') }, '취소')));
}

function showRulesHelp() {
  if (rulesShown) return; rulesShown = true;
  const rules = `{\n  "rules": {\n    "rooms": {\n      "$room": {\n        ".read": "$room.length >= 20",\n        ".write": "$room.length >= 20"\n      }\n    }\n  }\n}`;
  const ta = h('textarea', { class: 'inp code', rows: 10, readOnly: true, value: rules });
  modal({ title: 'Firebase 규칙을 넣어 주세요', onClose: () => { rulesShown = false; },
    body: h('div', null, h('p', null, 'Firebase 콘솔 → Realtime Database → 규칙 탭에 아래 내용을 붙여넣고 게시를 눌러 주세요.'), ta),
    actions: [{ label: '복사', onClick: () => { ta.select(); navigator.clipboard?.writeText(rules).then(() => toast('복사했어요'), () => {}); } }, { label: '다시 시도', primary: true, onClick: () => location.reload() }] });
}

function leave() { LS.del('room'); location.hash = ''; location.reload(); }

// 패치 소식
// 패치 소식: 한 장씩 옆으로 넘겨 본다. 장마다 나온 시각에서 하루가 지나면 저절로 사라진다(남은 장이 없으면 창도 안 뜬다)
const DAY = 86400000, PATCH = [
  { at: '2026-11-21T14:45:00+09:00', head: '🌊 쿠로시오 삼척해류 유입!', sub: '11/21 업데이트 · 중급·고급 바다에 새 어종', img: 'img/patch-newfish.webp?v=2', li: [
    ['🌀', '따뜻한 해류를 타고 새 물고기 50종이 왔어요', '중급·고급 바다에서 만나요'],
    ['🌊', '중급 바다 +20종', '도감 55 → 75종'],
    ['🐋', '고급 바다 +30종', '도감 60 → 90종']] },
  { at: '2026-11-21T14:20:00+09:00', head: '🪸 중급 바다가 달라졌어요', sub: '11/21 업데이트 · 중급 바다', img: 'img/patch-mid.webp', li: [
    ['⭐', '오늘의 어종', ['매일 3종 · 그날 잡으면 값 ', h('span', { class: 'red3' }, '2배')]],
    ['🪸', '산호 조각', '중급 바다에서만 · 15개 + 1,000코인 = 진주부적 1장 (카피수퍼 연성 탭)'],
    ['👑', '대장 물고기', '중급 도감 40종을 채우면 고래킹·상어킹이 나타나요'],
    ['🔮', '진주부적', '고급 바다에서 가방을 열어 3장 쓰면 다음에 던질 때 진주가 나타나요']] },
  { at: '2026-11-21T10:40:00+09:00', head: '🥕 카피수퍼에 농작물이 들어와요', sub: '11/21 업데이트 · 카피수퍼', img: 'img/patch-mart.webp', li: [
    ['🚚', '매일 새로 들어오는 농작물', '초급 작물 3종 · 중급 작물 3종을 매일 무작위로 팔아요 · 뭐가 들어올지는 그날 가 봐야 알아요'],
    ['🛣️', '운송비·톨비 포함', ['멀리서 실어 오느라 원가의 ', h('span', { class: 'red3' }, '3.5배'), ' 값이에요']],
    ['📦', '등급은 열어 봐야 알아요', '사고 나면 상자를 열어 S·A·B·C 중 등급을 확인해요 · 헛간으로 바로 들어가요']] },
  { at: '2026-11-21T10:20:00+09:00', head: '🍊 관리인에게 감귤을 주면 한눈을 팔아요', sub: '11/21 업데이트 · 농장 관리인과 서리', img: 'img/patch-tang.webp', li: [
    ['🤫', '서리는 3초면 성공', ['서리 버튼을 합쳐서 ', h('span', { class: 'red3', style: { fontSize: '1.15em' } }, '3초'), ' 누르면 성공해요 (4초 → ', h('span', { class: 'red3' }, '3초'), ')']],
    ['🍊', '감귤 던지기', ['서리할 때 🍊 버튼 · 관리인이 ', h('span', { class: 'red3' }, '3초'), ' 동안 등 돌리고 먹어요 · 다 먹어야 다음 감귤']],
    ['🐰', '감귤은 토끼에게서', '토끼와 거래 창에서 개당 100코인 · 하루 3개까지 살 수 있어요 (친척이 감귤 농사를 너무 많이 줘서 판대요)'],
    ['🕶️', '농장 관리인', '선글라스에 호루라기 · 밭을 순찰해요 · 남의 밭 출입구에서 관리인이 등 돌렸을 때만 서리'],
    ['🚨', '걸리면', '합의금 1,000코인 또는 황금 장비 담보 · 그 농장은 10분 동안 못 들어가요']] },
  { at: '2026-11-20T10:00:00+09:00', head: '🕹️ 카피오락 오픈!', sub: '11/20 업데이트 ①', img: 'img/patch-arcade.webp', li: [
    ['🕹️', '카피오락', '친목회 수족관 옆 네온 건물 · 누르면 게임을 골라 바로 한 판'],
    ['🪙', '동전 넣기', '게임 시작할 때 50코인 · 이기면 그대로 한 판 더 · 지면 다시 넣기'],
    ['🧸', '인형뽑기', '1판 50 · 3판 150 · 5판 200코인 · 뽑은 인형은 동물에게 선물하거나 가슴 배지로']] },
  { at: '2026-11-20T09:00:00+09:00', head: '😊 표정 고르기 · 새 카피바라', sub: '11/20 업데이트 ②', img: 'img/patch-face.webp', li: [
    ['😊', '표정 고르기', '옷놀이의 😊 표정 버튼 · 내 카피바라 바꾸기에서 10가지 중 선택'],
    ['🧸', '새 카피바라', '머리는 크게 · 몸은 작게 · 옷과 황금 장비도 새 몸에 맞춤'],
    ['⛵', '둘이 배 타기', '둘 다 배 안쪽에 나란히 앉아요']] },
  { at: '2026-11-20T09:00:00+09:00', head: '🎁 교환 · 방명록 · 스프링클러', sub: '11/20 업데이트 ③', img: 'img/patch-1120.webp', li: [
    ['🎁', '1:1 교환', '친목회 🎁 교환 · 가방 안 무엇이든 1개씩 · 둘 다 동의'],
    ['📖', '수족관', '방명록 · 수족관 없어도 구경 · 제목 누르면 관람료'],
    ['💦', '스프링클러', '시간당 요금 없앰 · 하루 100코인에 24시간 자동'],
    ['📜', '퀘스트 버튼', '친목회 위쪽에서 진행 현황']] },
  { at: '2026-11-20T09:00:00+09:00', head: '🛠️ 고친 것 · 밸런스', sub: '11/20 업데이트 ④', li: [
    ['🛠️', '고친 것', '배구·목욕탕 캐릭터 · 배 겹침 · 낚시할 때 배 안에 앉기'],
    ['⚖️', '밸런스', '풍랑 15번에 1번 · 해적 10번에 0~1번 · 테트리스 최대 300·450·600']] }];
function patchNote() {
  const live = PATCH.filter(p => Date.now() < Date.parse(p.at) + DAY); if (!live.length) return;
  const m = ctx.members[ctx.uid] || {};
  const pages = live.map(p => h('div', { class: 'patch patch-page' },
    p.img ? h('div', { class: 'patch-farm' }, h('img', { src: p.img, alt: p.head })) : p.faces ? h('div', { class: 'patch-faces' }, p.faces.map((f, i) => h('span', { class: i === 1 ? 'big' : '', html: capy({ color: m.color, face: f, head: true }) }))) : '',
    h('div', { class: 'patch-econ' }, h('b', null, p.head), h('small', null, p.sub)),
    h('ul', null, p.li.map(([ic, t, d]) => h('li', null, h('span', null, ic), h('div', null, h('b', null, t), h('small', null, d)))))));
  const dots = h('div', { class: 'patch-dots' }, live.map((_, i) => h('i', { class: i ? '' : 'on' }))), hint = h('small', { class: 'patch-hint' }, live.length > 1 ? '옆으로 넘겨 보세요 👉' : '');
  const rail = h('div', { class: 'patch-rail' }, pages); let at = 0, btn = null;
  const sync = () => { at = Math.max(0, Math.min(live.length - 1, Math.round(rail.scrollLeft / Math.max(1, rail.clientWidth)))); [...dots.children].forEach((d, i) => d.classList.toggle('on', i === at)); hint.style.visibility = at < live.length - 1 ? '' : 'hidden'; if (btn) btn.textContent = at < live.length - 1 ? '다음 👉' : '확인'; };
  rail.addEventListener('scroll', sync, { passive: true });
  const close = modal({ title: '✨ 패치 소식', body: h('div', null, rail, dots, hint), actions: [{ label: live.length > 1 ? '다음 👉' : '확인', primary: true, onClick: c => { if (at < live.length - 1) rail.scrollTo({ left: (at + 1) * rail.clientWidth, behavior: 'smooth' }); else c(); } }] });
  btn = document.querySelector('.modal-wrap:last-of-type .modal-actions .btn'); return close; }
function enter() {
  entered = true; setTimeout(patchNote, 900);
  ctx.store.presence(ctx.uid); shareBattery();
  ctx.store.on('battery', v => { ctx.battery = v || {}; document.querySelectorAll('[data-batt]').forEach(drawBatt); });
  const enterAt = Date.now() - 3000; let seenWhere, firstDress = true;
  ctx.store.on('presence', p => {
    ctx.presence = p || {}; document.querySelectorAll('[data-online]').forEach(el => el.classList.toggle('on', !!ctx.presence[el.dataset.online]));
    document.querySelectorAll('[data-batt]').forEach(drawBatt);
    const pid = ctx.partnerId, w = (pid && ctx.presence[pid] && ctx.presence[pid].where) || null;
    if (w === seenWhere) return;
    if (seenWhere !== undefined && w && w !== 'home' && w !== 'profile' && w !== fullRoute()) notify(`${josa(ctx.nameOf(pid), '가', '이')} 지금 '${titleOf(w)}'에 접속해 있어요`, '같이 가기', () => ctx.go(w));
    seenWhere = w; ctx.partnerWhere = w;
    if (curRoute() === 'home') render(); else document.querySelectorAll('.who').forEach(el => el.classList.toggle('here', !!w && w === fullRoute()));
  });
  enablePush(ctx); let lastPushed = '';
  ctx.store.on('phones', v => { ctx.phones = v || {}; });
  // 화면을 보고 있는지 알려 둔다: 안 보고 있을 때만 상대가 폰 알림을 보낸다
  const tellHid = () => ctx.store.update('presence/' + ctx.uid, { hid: document.hidden || null }).catch(() => {});
  // 앱을 열어 보면 쌓인 폰 알림과 아이콘 숫자를 지운다
  const clearNotes = () => { if (document.hidden) return; try { navigator.serviceWorker && navigator.serviceWorker.ready.then(r => r.getNotifications()).then(ns => ns.forEach(n => n.close())).catch(() => {}); navigator.clearAppBadge && navigator.clearAppBadge().catch(() => {}); } catch {} };
  document.addEventListener('visibilitychange', () => { tellHid(); clearNotes(); }); clearNotes();
  // 톡이 오면 "카피~" 알림음. 톡 화면·영화관이 아니면 알림 띠도 띄운다
  ctx.store.on('chat', v => {
    const id = Object.keys(v || {}).sort().pop(), m = id && v[id];
    const said = m && (m.t ? (m.t.length > 60 ? m.t.slice(0, 59) + '…' : m.t) : m.img ? '📷 사진' : '🧡 스티커');
    if (m && m.by === ctx.uid && m.ts >= enterAt && id !== lastPushed) { lastPushed = id; sendPush(ctx, { title: ctx.nameOf(ctx.uid), body: said, tag: 'capy', go: 'chat' }); } // 내가 보낸 톡 → 상대 폰 알림
    if (!m || m.by === ctx.uid || m.ts < enterAt || id === LS.get('chatSnd')) return; LS.set('chatSnd', id);
    capySound();
    const r = curRoute(), text = m.t ? (m.t.length > 30 ? m.t.slice(0, 29) + '…' : m.t) : m.img ? '📷 사진' : '🧡 스티커';
    if (r !== 'chat' && r !== 'watch' && r !== 'gallery') notify(`${ctx.nameOf(m.by)}: ${text}`, '보기', () => ctx.go('chat'));
  }, { limit: 1 });
  ctx.store.on('invite', v => {
    if (!v || v.to !== ctx.uid) return;
    if (v.ts <= Number(LS.get('inv') || 0) || ctx.store.now() - v.ts > 600000) return;
    LS.set('inv', v.ts);
    notify(v.msg || `${josa(ctx.nameOf(v.from), '가', '이')} '${titleOf(v.where)}'에서 불러요!`, v.where === fullRoute() ? null : '가기', () => ctx.go(v.where));
  });
  ctx.store.on('loc/pings', v => {
    const id = Object.keys(v || {}).sort().pop(), p = id && v[id];
    if (!p || p.by === ctx.uid || p.ts < enterAt || id === LS.get('ping')) return; LS.set('ping', id);
    if (curRoute() !== 'where') notify(`${josa(ctx.nameOf(p.by), '가', '이')} 위치 핑을 찍었어요${p.msg ? ': “' + p.msg + '”' : ''}`, '보기', () => ctx.go('where'));
  }, { limit: 1 });
  setupMoney(ctx);
  ctx.store.on('dress', v => {
    const before = ctx.dress[ctx.uid] || {}, now = (v || {})[ctx.uid] || {}; ctx.dress = v || {};
    if (!firstDress && now.by && now.by !== ctx.uid && now.ts !== before.ts && curRoute() !== 'dress') notify(`${josa(ctx.nameOf(now.by), '가', '이')} 내 카피바라에게 옷을 입혀 줬어요`, '보기', () => ctx.go('dress'));
    firstDress = false; if (curRoute() === 'home') render();
  });
  window.addEventListener('hashchange', render);
  if (!location.hash || location.hash.startsWith('#join')) location.hash = 'home'; else render();
}

const curRoute = () => (location.hash.slice(1) || 'home').split('-')[0];

function render() {
  if (!entered) return;
  if (cleanup) { try { cleanup(); } catch (e) { console.error(e); } cleanup = null; }
  bgm.stop(); bgm.duck(false);
  const [name, sub] = (location.hash.slice(1) || 'home').split('-');
  window.scrollTo(0, 0); ctx.store.setWhere(fullRoute());
  if (name === 'profile') return profile(false);
  const item = MENU.find(x => x.id === name);
  if (!item) return home();
  const body = h('div', { class: 'page-body' });
  const title = h('h2', null, item.title);
  root.replaceChildren(h('div', { class: 'page page-' + name },
    h('header', { class: 'bar' }, h('button', { class: 'back', 'aria-label': '뒤로', onClick: () => { const bt = !sub && name === 'dress' && ctx.backTo; ctx.backTo = null; ctx.go(sub ? name : bt || 'home'); } }, '‹'), title, // 친목회 카피클로에서 들어온 옷놀이는 뒤로 가면 친목회로
      SCENE[name] && sndBtn(),
      name === 'chat' && h('button', { class: 'call tel srch-btn', 'aria-label': '대화 검색', title: '대화 검색', onClick: () => ctx.chatSearch && ctx.chatSearch() }, '🔍'),
      name === 'chat' && ctx.partnerId && h('button', { class: 'call tel', 'aria-label': '전화 걸기', title: '전화 걸기', onClick: () => ctx.phone() }, '📞'),
      ctx.partnerId && h('button', { class: 'call', title: '상대를 이 화면으로 부르기', onClick: () => ctx.call() }, '📣 부르기'), partnerBadge()), body));
  ctx.setTitle = t => { title.textContent = t; };
  cleanup = item.mod.mount(body, ctx, sub) || null;
  if (SCENE[name] && (name !== 'game' || sub)) bgm.start(name === 'game' && sub === 'bubble' ? 'carnival' : SCENE[name]); // 게임 목록에서는 조용히, 게임 안에서만
}
// 배경음이 나오는 곳과 소리 켜기/끄기 버튼
const SCENE = { walk: 'bath', gallery: 'gallery', game: 'game', social: 'social' };
function sndBtn() { const b = h('button', { class: 'call snd', 'aria-label': '효과음·배경음 켜기/끄기', title: '효과음·배경음', onClick: () => { setFx(!fxOn()); b.textContent = fxOn() ? '🔊' : '🔇'; toast(fxOn() ? '효과음·배경음을 켰어요' : '효과음·배경음을 껐어요', 1300); } }, fxOn() ? '🔊' : '🔇'); return b; }

function partnerBadge() {
  const p = ctx.partnerId;
  if (!p) return h('span', { class: 'who' });
  return h('span', { class: 'who' + (ctx.partnerWhere && ctx.partnerWhere === fullRoute() ? ' here' : ''), title: ctx.nameOf(p) }, capyEl(ctx.capyOf(p, { head: true, bare: true }), 'mini'), h('i', { class: 'online' + (ctx.presence[p] ? ' on' : ''), 'data-online': p }));
}

/* ---------- 홈 ---------- */
function inviteLink() { return location.origin + location.pathname + location.search + '#join=' + ctx.room; }
function invite() {
  const link = inviteLink();
  const inp = h('input', { class: 'inp', readOnly: true, value: link, onClick: () => inp.select() });
  modal({ title: '초대 링크', body: h('div', null, h('p', null, '이 링크를 상대에게 보내면 같은 방으로 들어와요. 링크를 아는 사람은 누구나 들어올 수 있으니 둘만 가지고 있어요.'), inp),
    actions: [{ label: '닫기' }, { label: '복사', primary: true, onClick: c => { inp.select(); (navigator.clipboard ? navigator.clipboard.writeText(link) : Promise.reject()).then(() => { toast('복사했어요'); c(); }, () => toast('길게 눌러 복사해 주세요')); } }] });
}
function installHelp() {
  modal({ title: '홈 화면에 앱으로 추가', body: h('div', { class: 'help' },
    h('p', null, h('b', null, '아이폰 (Safari)'), ' 아래 공유 버튼 → "홈 화면에 추가"'),
    h('p', null, h('b', null, '안드로이드 (Chrome)'), ' 오른쪽 위 ⋮ → "홈 화면에 추가" 또는 "앱 설치"'),
    h('p', { class: 'dim' }, '추가한 뒤에는 홈 화면의 카피두리 아이콘으로 들어오면 돼요.')), actions: [{ label: '확인', primary: true }] });
}

function home() {
  const offs = [];
  const dday = h('button', { class: 'dday', onClick: setStart }, '우리 처음 만난 날 정하기');
  const today = h('div', { class: 'today-card' });
  const badge = h('i', { class: 'badge', hidden: true });
  let start = null, events = {}, pick = null;

  function setStart() {
    const inp = h('input', { class: 'inp', type: 'date', value: start || ymd(), max: ymd() });
    modal({ title: '사귀기 시작한 날', body: inp, actions: [{ label: '취소' }, { label: '저장', primary: true, onClick: c => { if (inp.value) ctx.store.set('meta/start', inp.value); c(); } }] });
  }
  function drawToday() {
    const t = ymd(), md = t.slice(5);
    const todays = Object.values(events).filter(e => e.date === t || (e.yearly && e.date.slice(5) === md)).sort((a, b) => (a.time || '').localeCompare(b.time || ''));
    today.replaceChildren(...[h('b', null, niceDate(t)),
      todays.length ? h('ul', null, todays.map(e => h('li', null, h('em', { class: 'kind k-' + e.kind }, e.kind), ' ', e.time ? e.time + ' ' : '', e.title))) : h('p', { class: 'dim' }, '오늘은 등록된 일정이 없어요'),
      pick && ymd(new Date(pick.ts)) === t && h('p', { class: 'pick' }, '오늘의 메뉴 룰렛: ', h('b', null, pick.name))].filter(Boolean));
  }
  offs.push(ctx.store.on('meta/start', v => { start = v; dday.textContent = v ? `우리 ${dayDiff(ymd(), v) + 1}일째 ♥` : '우리 처음 만난 날 정하기'; }));
  offs.push(ctx.store.on('events', v => { events = v || {}; drawToday(); }));
  offs.push(ctx.store.on('eat/pick', v => { pick = v; drawToday(); }));
  let msgs = {}, readAt = 0;
  const drawBadge = () => { const n = Object.values(msgs).filter(m => m.by !== ctx.uid && m.ts > readAt).length; badge.hidden = !n; badge.textContent = n > 29 ? '30+' : n; };
  offs.push(ctx.store.on('chat', v => { msgs = v || {}; drawBadge(); }, { limit: 30 }));
  offs.push(ctx.store.on('read/' + ctx.uid, v => { readAt = v || 0; drawBadge(); }));

  const pid = ctx.partnerId;
  root.replaceChildren(h('div', { class: 'home' },
    h('section', { class: 'hero' },
      h('div', { class: 'duo' }, battEl(ctx.uid),
        h('button', { class: 'me', onClick: () => ctx.go('profile') }, capyEl(ctx.capyOf(ctx.uid, { face: 'happy' }), 'bob'), h('b', null, ctx.me.name), h('small', { class: 'coin-chip', 'data-coins': 1 }, won(ctx.coins ? ctx.coins() : 0))),
        h('span', { class: 'heart beat' }, '♥'),
        pid ? h('div', { class: 'me' }, capyEl(ctx.capyOf(pid, { face: 'happy' }), 'bob late'), h('b', null, ctx.nameOf(pid), h('i', { class: 'online' + (ctx.presence[pid] ? ' on' : ''), 'data-online': pid })),
            h('small', { class: 'at' }, !ctx.presence[pid] ? '지금은 접속 안 함' : ctx.partnerWhere && ctx.partnerWhere !== 'home' && ctx.partnerWhere !== 'profile' ? `${titleOf(ctx.partnerWhere)} 접속 중` : '지금 홈 화면'))
          : h('button', { class: 'me empty', onClick: invite }, h('span', { class: 'ghost-capy' }, '?'), h('b', null, '초대하기')), pid ? battEl(pid) : h('span', { class: 'batt ghost', 'aria-hidden': 'true' })),
      dday),
    today,
    h('nav', { class: 'menu' }, MENU.filter(m => !m.hide).map((m, i) => h('button', { class: 'card' + (m.wide ? ' wide' : ''), style: { '--tint': m.tint, animationDelay: i * 50 + 'ms' }, 'aria-label': m.title, title: m.title, onClick: () => ctx.go(m.id) },
      capyEl({ color: i % 2 ? ctx.capyOf(pid || ctx.uid).color : ctx.me.color, acc: m.acc, face: m.face, head: true }), h('b', null, m.short), m.id === 'chat' && badge,
      pid && ctx.presence[pid] && (ctx.partnerWhere || '').split('-')[0] === m.id && h('span', { class: 'here-mark', title: ctx.nameOf(pid) + ' 접속 중' }, capyEl(ctx.capyOf(pid, { head: true }), 'mini'), '여기 있어요')))),
    h('footer', { class: 'foot' },
      h('button', { class: 'link', onClick: invite }, '초대 링크'), h('button', { class: 'link', onClick: installHelp }, '앱으로 추가'),
      h('button', { class: 'link', onClick: e => { const on = !soundOn(); setSound(on); e.target.textContent = on ? '🔔 알림음 켜짐' : '🔕 알림음 꺼짐'; if (on) capySound(true); } }, soundOn() ? '🔔 알림음 켜짐' : '🔕 알림음 꺼짐'),
      'Notification' in window && Notification.permission === 'default' && h('button', { class: 'link', onClick: e => { askNotify(); e.target.remove(); } }, '알림 켜기'),
      h('button', { class: 'link', onClick: () => ask('이 기기에서 방을 나갈까요? (데이터는 남아 있고, 초대 링크로 다시 들어올 수 있어요)', '나가기').then(y => y && leave()) }, '방 나가기'),
      isMock && h('span', { class: 'dim' }, ' · 연습 모드'))));
  cleanup = () => offs.forEach(f => f());
}

if ('serviceWorker' in navigator && location.protocol === 'https:') navigator.serviceWorker.register('sw.js').catch(() => {});
boot();
