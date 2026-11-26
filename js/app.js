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
  { id: 'dress', hide: true, mod: dress, title: '👗 카피클로', short: '옷놀이', sub: '상의 50 · 하의 50', face: 'happy', acc: 'ribbon', tint: '#FFDDB8' },
  { id: 'day', mod: day, title: '오늘 무슨 날이지?', short: '일정', sub: '일정 · 예약 · 일기', face: 'smile', acc: 'leaf', tint: '#FFE3A6' },
  { id: 'wear', hide: true, mod: wear, title: '오늘 뭐 입지?', short: '코디', sub: '서로 옷 봐주기', face: 'wink', acc: 'ribbon', tint: '#FFD0D6' },
  { id: 'eat', mod: eat, title: '오늘 뭐 먹지?', short: '맛집', sub: '맛집 찾기 · 룰렛', face: 'wow', acc: 'yuzu', tint: '#CDEBB5' },
  { id: 'game', hide: true, mod: game, title: '오늘 무슨 게임하지?', short: '게임', sub: '카피바라 게임 8종', face: 'happy', acc: 'none', tint: '#C9E4F7' },
  { id: 'where', mod: where, title: '오늘 어디야?', short: '어디야', sub: '위치 핑 찍기', face: 'wow', acc: 'leaf', tint: '#BFE8E0' },
  { id: 'watch', hide: true, mod: watch, title: '🎬 카피영화관', short: '영화관', sub: '카피바라 영화관', face: 'sleepy', acc: 'towel', tint: '#D9D2F5' },
  { id: 'walk', hide: true, mod: walk, title: '♨️ 카피온센', short: '목욕탕', sub: '히노끼탕 · 음성 대화', face: 'sleepy', acc: 'towel', tint: '#F3DDB8' },
  { id: 'gallery', hide: true, mod: gallery, title: '🖼️ 카피박람회', short: '전시회', sub: '둘만의 전시실', face: 'wow', acc: 'flower', tint: '#ECECF4' },
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
ctx.capyOf = (uid, extra = {}) => { const m0 = ctx.members[uid] || {}, m = GOLD_TEST && uid === ctx.uid ? { ...m0, rare: GOLD_TEST } : m0, d = ctx.dress[uid] || {}, blk = social.goldBlocks(GOLD_TEST && uid === ctx.uid ? GOLD_TEST : social.rareList(m.rare)), dv = k => (blk.has(k) && !(typeof d[k] === 'string' && d[k].includes('-hd-')) ? '' : d[k]); /* 핫똑 한복은 황금 장비 위에 걸친다 */ return { hdw: (ctx.hdw || {})[uid], color: m.color, acc: m.acc, top: dv('top'), bottom: dv('bottom'), hat: dv('hat'), shoe: dv('shoe'), eye: d.eye || '', pin: m.pin != null && social.PERSONA[m.pin] ? social.PERSONA[m.pin].pin : '', doll: Number.isInteger(m.doll) && m.doll >= 0 && m.doll < 30 ? m.doll : null, rare: GOLD_TEST && uid === ctx.uid ? { ...(social.rareOf(GOLD_TEST.slice(0, 1)) || {}), list: GOLD_TEST } : social.rareOf(m.rare), ...(m.dip || (uid === ctx.uid && window.__capyDip) ? { dip: 1 } : {}), ...extra, ...(FACES[m.face] && (!extra.face || extra.face === 'happy') && extra.view !== 'back' ? { face: m.face } : {}) }; };
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
  { at: '2026-11-26T21:50:00+09:00', until: '2026-11-28T13:00:00+09:00', head: '📜 히든능력견 엿가락 · 순신의 주문서', sub: '11/26 업데이트 · 핫똑랜드 솔숲탕', img: 'img/patch-scroll.webp?v=1', li: [
    ['🐕', '엿가락은 솔숲탕 붙박이', '웰시코기 엿가락이 이제 늘 솔숲탕 탕 안에 있어요 · 마을에선 안 보여요'],
    ['🗣️', '사회생활하기 · 10분', '탕 안에서 엿가락을 눌러 「사회생활하기」 → 10분 동안 엿가락이 주저리주저리 떠들어요 · 탕 밖으로 나가면 끊겨요'],
    ['📜', '순신(瞬迅)의 주문서 · 하루 한 번', '순간 순(瞬) · 빠를 신(迅) · 10분을 다 들어 주면 주문서 1장이 가방에 들어와요 · 최대 2장까지 보관'],
    ['✨', '순간이동', '가방에서 주문서를 눌러 사용 → 카피랜드나 핫똑랜드를 골라 비행기 없이 바로 가요 · 카피랜드 가방에서도 써요']] },
  { at: '2026-11-25T23:20:00+09:00', until: '2026-11-28T13:00:00+09:00', head: '⚔️ 에픽 퀘스트 · 작은아빠의 가마', sub: '11/25 업데이트 · 핫똑랜드 복실이', img: 'img/patch-potquest.webp?v=1', li: [
    ['🐶', '복실이의 부탁', '복실이의 작은아빠는 해피도자기의 도공 도암 · 후계자가 없대요 · 손이 뭉뚝한 복실이 대신 섬세한 손으로 도와줘요'],
    ['💰', '재료 자금 40,000코인', '퀘스트를 받으면 바로 받아요 · 나중에 부자가 되면 복실이에게 갚아요'],
    ['🏺', '분청사기 D급 이상 · 기회 3번', '도암 스승에게 도전을 받고, D급 이상을 3분 안에 팔면 판매가 + 성공 수당 10,000코인'],
    ['🤝', '40,000코인 갚으면 완료', '복실이에게 돌아가 빌린 돈을 갚으면 퀘스트 끝 · 복실이 친밀도 +3'],
    ['🐦‍⬛', '까마귀 · 황충', '핫똑랜드에 있는 동안엔 카피랜드 밭에 까마귀가, 카피랜드로 떠나면 핫똑 논에 황충이 오지 않아요'],
    ['🪧', '해피도자기 간판', '훈련소와 같은 붓글씨로 바꿨어요']] },
  { at: '2026-11-25T22:55:00+09:00', until: '2026-11-28T13:00:00+09:00', head: '🏺 핫똑랜드 해피도자기', sub: '11/25 업데이트 · 연못 가는 길, 옛 개집 자리', img: 'img/patch-pottery.webp?v=2', li: [
    ['🐶', '스승 삽살개 도암', '도자기를 굽고 파는 공방이에요 · 섬세한 손의 황금폐하를 수제자로 들여요'],
    ['🧱', '재료는 부메랑상회', '백자토 10,000 · 청자토 8,500 · 분청토 6,000 · 유약 1,000 · 안료 2,000 · 흙·유약·안료 하나씩이면 도자기 1개'],
    ['🌀', '하루 3번 · 1분 물레', '빠르게 도는 흙을 손끝으로 깎아 본보기 모양에 맞춰요 · 살짝만 닿아도 깎여요 · 수~황 7등급'],
    ['🔥', '가마 · 안료', '알맞은 온도 칸에서 꺼내면 상급 · 무늬는 붓는 순간 운으로 정해져요(고려청자 · 까치호랑이 · 물고기 무늬)'],
    ['🪧', '게시하고 3분', 'S~F 최종 등급에 따라 3분 안에 팔릴 확률이 달라요 · 안 팔리면 두 등급 아래 값으로 처분']] },
  { at: '2026-11-25T18:15:00+09:00', head: '🌾 카피랜드 벼 도매상', sub: '11/25 업데이트 · 카피백반 옆', img: 'img/patch-ricepig.webp?v=1', li: [
    ['🐷', '벼 도매상 복돈이 아저씨', '하루 세 번 아무 때나 카피백반 앞에 5분 동안 와요 · 오면 알림이 떠요'],
    ['💰', '핫똑 곡식 1.5배', '핫똑랜드 값의 1.5배로 사요 · 30단마다 수수료 3,300 · 비행기 운임 10,000을 얹어 줘요'],
    ['✈️', '곡식 30단까지 들고 와요', '핫똑랜드에서 카피랜드로 곡식을 종류 상관없이 30단까지 가져올 수 있어요'],
    ['🎒', '공항 · 농장에서 가방', '위쪽 ✕ 대신 가방이 열려요 · 나갈 때는 길 끝까지 걸어서(퀵보드로) 가요']] },
  { at: '2026-11-25T13:25:00+09:00', head: '💰 핫똑랜드 물가 조정', sub: '11/25 업데이트 · 카피랜드 기준으로 다시 매겼어요', li: [
    ['👘', '한복', '상의·하의 5,000~6,900 · 모자 3,750~5,600 · 신발 5,600~8,100'],
    ['🐟', '핫똑 물고기 · 미끼 · 찻집', '카피랜드의 1.8배 · 미끼 한 세트(10개) 540 · 차 430~1,440'],
    ['🌾', '핫똑 논 곡식', '한 단 값이 황금유자 3배 기준 · 자광도 1,180 ~ 보리 470'],
    ['🧺', '보부상 봇짐이', '올 때마다 시세 3~5배 · 나타나면 알림에 이번 배율이 떠요']] },
  { at: '2026-11-24T22:40:00+09:00', head: '🐟 핫똑 물고기 46종 · ✨ 이로치', sub: '11/24 업데이트 · 핫똑 나루터', img: 'img/patch-fish46.webp?v=1', li: [
    ['🐟', '물고기 46종으로 늘었어요', '매우 흔함 25 · 보통 15 · 희귀 5 · 초희귀 1 · 송편망둑, 장구개복치, 거북선거북복, 봉황꼬리산천어, 금관황복…'],
    ['✨', '이로치 8종', '반짝이는 색다른 물고기가 가끔 걸려요 · 값은 3배'],
    ['📏', '큰 물고기', '황금비늘 이무기 최대 250cm · 거북선거북복 최대 230cm'],
    ['👻', '블랙귀신아귀', '보통 물고기처럼 잡혀요 · 그런데 다 잡고 나면… 저주받은 물고기예요 · 팔 수도, 핫똑랜드 밖으로 가져갈 수도, 수족관에 넣을 수도 없어요'],
    ['🧧', '저주 푸는 법', '저주퇴치부적(20,000코인)을 붙여 나루터에서 방생하거나, 카피수족관 희귀 물고기 2마리를 바쳐요 · 24시간 안에 안 하면 2마리를 빼앗아 가요'],
    ['📖', '가방에서 핫똑 물고기 도감', '🎒 가방을 열면 언제든 도감을 볼 수 있어요'],
    ['🛺', '파트라슈', '마을 초입에서 오른쪽을 보고 기다리며 손님을 불러요']] },
  { at: '2026-11-24T21:55:00+09:00', head: '🛺 인력거 · 🦗 황충', sub: '11/24 업데이트 · 핫똑랜드', img: 'img/patch-rick.webp?v=1', li: [
    ['🛺', '인력거꾼 파트라슈', '마을에서 파트라슈 곁에서 A · 미터기가 1초에 75코인씩 올라 내릴 때 내요 · 내린 자리에 그대로 기다려요'],
    ['🦗', '황충 재난', '하루 한 번 올 수도 있어요 · 경보가 울리면 논 앞에서 쑥불을 피우고 부채를 연타해 5칸을 지키세요 · 잃은 칸마다 벼 6단'],
    ['🐟', '물고기 골라 팔기 · 새 물고기 그림', '부메랑상회에서 팔 물고기만 골라 팔아요 · 미끼는 한 세트 10개, 소모품은 개수를 골라 사요']] },
  { at: '2026-11-24T17:05:00+09:00', head: '🌾 핫똑 논 개방!', sub: '11/24 업데이트 · 핫똑랜드 논농사', img: 'img/patch-rice-1124.webp?v=1', li: [
    ['🪧', '마을 맨 왼쪽 「핫똑 논」 표지판에서 B', '논 세 배미 · 한 배미는 기본, 2번 논 20,000 · 3번 논 50,000코인'],
    ['🌱', '밭갈이 → 모내기 → 물 주기 → 수확', '벼 5종(자광도 · 북흑조 · 다마금 · 녹토미 · 붉은차나락)과 보리 · 밀 · 한 번에 30단'],
    ['🥣', '표주박으로 물을 줄수록 등급이 올라요', '곡식 등급 D~S · 허수아비를 세워야만 S등급'],
    ['🐕', '소작농 바둑이', '볍씨만 건네주면 처음부터 끝까지 다 해 줘요 · 대신 1/5은 일당'],
    ['📦', '부메랑상회 창고', '카피랜드엔 곡식 3종 1단씩 · 물고기 5마리 · 나머지는 창고에 한 번에']] }];
function patchNote() {
  const live = PATCH.filter(p => Date.now() < (p.until ? Date.parse(p.until) : Date.parse(p.at) + DAY)); /* until이 있으면 그때까지 띄운다 */ if (!live.length) return;
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
  ctx.store.on('hd', v => { const w = {}; Object.entries(v || {}).forEach(([u, d]) => { if (d && d.wear) w[u] = d.wear; }); ctx.hdw = { ...(ctx.hdw || {}), ...w }; }); // 핫똑랜드 상징품: 카피랜드에서도 그대로 달고 다닌다
  ctx.store.on('dress', v => {
    const before = ctx.dress[ctx.uid] || {}, now = (v || {})[ctx.uid] || {}; ctx.dress = v || {};
    if (!firstDress && now.by && now.by !== ctx.uid && now.ts !== before.ts && curRoute() !== 'dress') notify(`${josa(ctx.nameOf(now.by), '가', '이')} 내 카피바라에게 옷을 입혀 줬어요`, '보기', () => ctx.go('dress'));
    firstDress = false; if (curRoute() === 'home') render();
  });
  window.addEventListener('hashchange', render);
  const testQ = /[?&](fishtest|passdemo|aqtest|airdemo)=?/.test(location.search); // 연습·예시 링크는 바로 동물친목회로
  // 핫똑랜드에 있다가 앱을 다시 열면: 카피랜드가 먼저 보이지 않게 가림막을 치고 곧장 핫똑랜드로 돌아간다
  const boot = () => { if ((!location.hash || location.hash === '#home') && testQ) location.hash = 'social'; else if (!location.hash || location.hash.startsWith('#join')) location.hash = 'home'; else render(); };
  if (!testQ && !/[?&]capyland/.test(location.search) && ['home', 'social'].includes(curRoute()) && ctx.store.get) { /* ?capyland 링크: 핫똑랜드에 있어도 카피랜드를 잠깐 둘러본다 */ const key = 'capyHdAt'; let known = false, booted = false; const start = () => { if (booted) return; booted = true; boot(); }, cover = () => { /* 가림막은 따로 띄우지 않는다: 카피랜드 화면만 가려 두고 핫똑랜드가 열리면 바로 보인다 */ if (booted) return; booted = true; document.body.classList.add('hd-resume'); if (curRoute() !== 'social') location.hash = 'social'; else render(); }; /* 핫똑랜드로 돌아가는 동안 카피랜드 화면은 아예 그리지 않는 것처럼 가린다 */ /* 화면은 한 번만 그린다(두 번 그리면 핫똑랜드가 겹쳐 열려 깜빡였다) */
    try { if (localStorage.getItem(key) === ctx.uid) { known = true; cover(); } } catch { /* 저장소를 못 쓰면 아래 확인만 */ }
    ctx.store.get('air/' + ctx.uid).then(v => { const at = !!(v && v.at === 'hd'); try { at ? localStorage.setItem(key, ctx.uid) : localStorage.removeItem(key); } catch { /* 무시 */ } if (at) cover(); else { document.querySelectorAll('.hd-cover').forEach(e => e.remove()); start(); } }).catch(() => { document.querySelectorAll('.hd-cover').forEach(e => e.remove()); start(); });
    if (!known) setTimeout(start, 2500); /* 기록이 없는 기기: 확인이 끝날 때까지(길어야 2.5초) 첫 화면을 그리지 않는다 */ }
  else boot();
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
    h('header', { class: 'bar' }, h('button', { class: 'back', 'aria-label': '뒤로', onClick: () => { const bt = !sub && ['dress', 'watch', 'walk', 'gallery'].includes(name) && ctx.backTo; ctx.backTo = null; ctx.go(sub ? name : bt || 'home'); } }, '‹'), title, // 친목회 카피클로에서 들어온 옷놀이는 뒤로 가면 친목회로
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

// ♨️ 카피온센 효과 게이지: 온센에서 쉰 효과(희귀 물고기 확률 업)가 남아 있는 동안 화면 위에 남은 시간을 막대로 보여 준다
{ const STEP = 600000, MAX = 3, KEEP = 120000, UP = 3;
  const fill = h('i', { class: 'onsen-fill' }), txt = h('span', { class: 'onsen-txt' }), bar = h('div', { class: 'onsen-gauge', hidden: true, 'aria-live': 'off' }, h('b', null, '♨️'), h('div', { class: 'onsen-bar' }, fill), txt);
  document.body.append(bar);
  const tick = () => { let v = {}; try { v = JSON.parse(localStorage.getItem('capy-onsen') || '{}') || {}; } catch {}
    const st = Math.min(MAX, Math.floor((v.ms || 0) / STEP)), left = (v.until || 0) - Date.now(), inBath = location.hash.startsWith('#walk');
    if (!st || left <= 0 || inBath) { bar.hidden = true; return; }
    const s = Math.ceil(left / 1000); bar.hidden = false; fill.style.width = Math.max(0, Math.min(100, left / (st * KEEP) * 100)) + '%';
    txt.textContent = `희귀 +${st * UP}% · ${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`; };
  tick(); setInterval(tick, 1000); }
