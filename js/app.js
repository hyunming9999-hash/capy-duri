import { $, h, toast, modal, ask, ymd, dayDiff, niceDate } from './ui.js';
import { openStore, isMock, setErrorHandler } from './store.js';
import { capyEl, COLORS, ACCS } from './capy.js';
import * as day from './day.js';
import * as wear from './wear.js';
import * as eat from './eat.js';
import * as game from './game.js';
import * as chat from './chat.js';
import * as watch from './watch.js';

// 연습 모드(?mock=이름)에서는 한 브라우저에서 두 사람 흉내를 낼 수 있게 저장 칸을 나눈다
const NS = 'capy.' + (isMock ? (new URLSearchParams(location.search).get('mock') || '') + '.' : '');
const LS = {
  get(k) { try { return localStorage.getItem(NS + k); } catch { return null; } },
  set(k, v) { try { localStorage.setItem(NS + k, v); } catch {} },
  del(k) { try { localStorage.removeItem(NS + k); } catch {} },
};
const rnd = n => { const a = new Uint8Array(n); crypto.getRandomValues(a); return [...a].map(x => 'abcdefghjkmnpqrstuvwxyz23456789'[x % 31]).join(''); };

const MENU = [
  { id: 'day', mod: day, title: '오늘 무슨 날이지?', sub: '일정 · 예약 · 일기', face: 'smile', acc: 'leaf', tint: '#FFE3A6' },
  { id: 'wear', mod: wear, title: '오늘 뭐 입지?', sub: '서로 옷 봐주기', face: 'wink', acc: 'ribbon', tint: '#FFD0D6' },
  { id: 'eat', mod: eat, title: '오늘 뭐 먹지?', sub: '맛집 찾기 · 룰렛', face: 'wow', acc: 'yuzu', tint: '#CDEBB5' },
  { id: 'game', mod: game, title: '오늘 무슨 게임하지?', sub: '카피바라 게임 5종', face: 'happy', acc: 'none', tint: '#C9E4F7' },
  { id: 'chat', mod: chat, title: '오늘 얘기나 하지?', sub: '톡 · 사진 · 스티커', face: 'love', acc: 'flower', tint: '#F6D3EE' },
  { id: 'watch', mod: watch, title: '오늘 뭐 보실?', sub: '카피바라 영화관', face: 'sleepy', acc: 'towel', tint: '#D9D2F5' },
];

const root = $('#app');
const ctx = { uid: null, room: null, store: null, members: {}, presence: {}, order: [], idx: 0 };
Object.defineProperties(ctx, {
  me: { get() { return ctx.members[ctx.uid] || {}; } },
  partnerId: { get() { return ctx.order.find(u => u !== ctx.uid) || null; } },
  partner: { get() { return ctx.members[ctx.partnerId] || null; } },
});
ctx.go = r => { location.hash = r; };
ctx.nameOf = uid => (ctx.members[uid] || {}).name || '카피';
ctx.capyOf = (uid, extra = {}) => { const m = ctx.members[uid] || {}; return { color: m.color, acc: m.acc, ...extra }; };

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
  const draw = () => prev.replaceChildren(capyEl({ ...cur, face: 'happy' }, 'bob'));
  const name = h('input', { class: 'inp', maxLength: 8, placeholder: '별명 (8자까지)', value: cur.name });
  const chips = (obj, key, label) => h('div', { class: 'chips' }, Object.entries(obj).map(([k, v]) => {
    const b = h('button', { class: 'chip' + (cur[key] === k ? ' on' : ''), onClick: () => { cur[key] = k; b.parentNode.querySelectorAll('.chip').forEach(x => x.classList.remove('on')); b.classList.add('on'); draw(); } }, label(k, v));
    return b;
  }));
  const save = async () => {
    cur.name = name.value.trim() || '카피';
    try {
      await ctx.store.update('members/' + ctx.uid, { name: cur.name, color: cur.color, acc: cur.acc, at: ctx.me.at || ctx.store.now() });
      if (!first) { toast('바꿨어요'); ctx.go('home'); }
    } catch {}
  };
  draw();
  root.replaceChildren(h('div', { class: 'welcome' }, h('h2', null, first ? '내 카피바라 만들기' : '내 카피바라 바꾸기'), prev, name,
    h('label', { class: 'lbl' }, '털 색'), chips(COLORS, 'color', (k, v) => [h('i', { class: 'dot', style: { background: v.body } }), v.name]),
    h('label', { class: 'lbl' }, '머리 장식'), chips(ACCS, 'acc', (k, v) => v),
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

function enter() {
  entered = true;
  ctx.store.presence(ctx.uid);
  ctx.store.on('presence', p => { ctx.presence = p || {}; document.querySelectorAll('[data-online]').forEach(el => el.classList.toggle('on', !!ctx.presence[el.dataset.online])); });
  window.addEventListener('hashchange', render);
  if (!location.hash || location.hash.startsWith('#join')) location.hash = 'home'; else render();
}

const curRoute = () => (location.hash.slice(1) || 'home').split('-')[0];

function render() {
  if (!entered) return;
  if (cleanup) { try { cleanup(); } catch (e) { console.error(e); } cleanup = null; }
  const [name, sub] = (location.hash.slice(1) || 'home').split('-');
  window.scrollTo(0, 0);
  if (name === 'profile') return profile(false);
  const item = MENU.find(x => x.id === name);
  if (!item) return home();
  const body = h('div', { class: 'page-body' });
  const title = h('h2', null, item.title);
  root.replaceChildren(h('div', { class: 'page page-' + name },
    h('header', { class: 'bar' }, h('button', { class: 'back', 'aria-label': '뒤로', onClick: () => ctx.go(sub ? name : 'home') }, '‹'), title, partnerBadge()), body));
  ctx.setTitle = t => { title.textContent = t; };
  cleanup = item.mod.mount(body, ctx, sub) || null;
}

function partnerBadge() {
  const p = ctx.partnerId;
  if (!p) return h('span', { class: 'who' });
  return h('span', { class: 'who', title: ctx.nameOf(p) }, capyEl(ctx.capyOf(p, { head: true }), 'mini'), h('i', { class: 'online' + (ctx.presence[p] ? ' on' : ''), 'data-online': p }));
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
      h('div', { class: 'duo' },
        h('button', { class: 'me', onClick: () => ctx.go('profile') }, capyEl(ctx.capyOf(ctx.uid, { face: 'happy' }), 'bob'), h('b', null, ctx.me.name)),
        h('span', { class: 'heart beat' }, '♥'),
        pid ? h('div', { class: 'me' }, capyEl(ctx.capyOf(pid, { face: 'happy' }), 'bob late'), h('b', null, ctx.nameOf(pid), h('i', { class: 'online' + (ctx.presence[pid] ? ' on' : ''), 'data-online': pid })))
          : h('button', { class: 'me empty', onClick: invite }, h('span', { class: 'ghost-capy' }, '?'), h('b', null, '초대하기'))),
      dday),
    today,
    h('nav', { class: 'menu' }, MENU.map((m, i) => h('button', { class: 'card', style: { '--tint': m.tint, animationDelay: i * 50 + 'ms' }, onClick: () => ctx.go(m.id) },
      capyEl({ color: i % 2 ? ctx.capyOf(pid || ctx.uid).color : ctx.me.color, acc: m.acc, face: m.face, head: true }), h('b', null, m.title), h('small', null, m.sub), m.id === 'chat' && badge))),
    h('footer', { class: 'foot' },
      h('button', { class: 'link', onClick: invite }, '초대 링크'), h('button', { class: 'link', onClick: installHelp }, '앱으로 추가'),
      h('button', { class: 'link', onClick: () => ask('이 기기에서 방을 나갈까요? (데이터는 남아 있고, 초대 링크로 다시 들어올 수 있어요)', '나가기').then(y => y && leave()) }, '방 나가기'),
      isMock && h('span', { class: 'dim' }, ' · 연습 모드'))));
  cleanup = () => offs.forEach(f => f());
}

if ('serviceWorker' in navigator && location.protocol === 'https:') navigator.serviceWorker.register('sw.js').catch(() => {});
boot();
