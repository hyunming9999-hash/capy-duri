// 오늘 무슨 날이지? — 달력, 일정/예약/기념일, 둘의 일기
import { h, toast, ask, ymd, pad, parseYmd, dayDiff, niceDate } from './ui.js';
import { capyEl } from './capy.js';

const KINDS = ['일정', '예약', '기념일'];
const MOODS = ['happy', 'smile', 'love', 'sleepy', 'sad'];

export function mount(el, ctx) {
  const offs = []; let diaryOff = null;
  const cur = new Date(); cur.setDate(1);
  let sel = ymd(), events = {}, diary = {}, start = null, kind = '일정', draftFor = null;

  const calEl = h('div', { class: 'cal' }), panel = h('div', { class: 'day-panel' }), soon = h('div', { class: 'soon' });
  el.append(soon, calEl, panel);

  const ym = () => `${cur.getFullYear()}-${pad(cur.getMonth() + 1)}`;
  const eventsOn = d => Object.entries(events).filter(([, e]) => e.date === d || (e.yearly && e.date.slice(5) === d.slice(5) && e.date <= d)).map(([id, e]) => ({ id, ...e }))
    .sort((a, b) => (a.time || '99').localeCompare(b.time || '99'));
  const milestone = d => {
    if (!start || d < start) return null;
    const n = dayDiff(d, start) + 1;
    if (n > 1 && n % 100 === 0) return n + '일';
    if (d.slice(5) === start.slice(5) && d !== start) return (Number(d.slice(0, 4)) - Number(start.slice(0, 4))) + '주년';
    return null;
  };

  function subDiary() { diaryOff && diaryOff(); diary = {}; diaryOff = ctx.store.on('diary/' + ym(), v => { diary = v || {}; drawCal(); drawPanel(true); }); }

  function drawSoon() {
    const t = ymd(), list = [];
    for (const e of Object.values(events)) {
      let d = e.date;
      if (e.yearly && d < t) { d = t.slice(0, 4) + d.slice(4); if (d < t) d = (Number(t.slice(0, 4)) + 1) + d.slice(4); }
      if (d >= t) list.push({ d, label: e.title, kind: e.kind });
    }
    if (start) {
      const n = dayDiff(t, start) + 1, next = Math.ceil((n + 0.5) / 100) * 100, dd = parseYmd(start); dd.setDate(dd.getDate() + next - 1);
      list.push({ d: ymd(dd), label: next + '일', kind: '기념일' });
      let y = Number(t.slice(0, 4)); let a = y + start.slice(4); if (a <= t) a = (y + 1) + start.slice(4);
      list.push({ d: a, label: (Number(a.slice(0, 4)) - Number(start.slice(0, 4))) + '주년', kind: '기념일' });
    }
    list.sort((a, b) => a.d.localeCompare(b.d));
    soon.replaceChildren(...list.slice(0, 3).map(x => { const n = dayDiff(x.d, t); return h('button', { class: 'soon-chip', onClick: () => jump(x.d) }, h('b', null, n === 0 ? 'D-DAY' : 'D-' + n), ' ', x.label); }));
    soon.hidden = !list.length;
  }
  function jump(d) { sel = d; const p = parseYmd(d); const changed = p.getMonth() !== cur.getMonth() || p.getFullYear() !== cur.getFullYear(); cur.setFullYear(p.getFullYear(), p.getMonth(), 1); changed ? subDiary() : null; drawCal(); drawPanel(); }
  function move(n) { cur.setMonth(cur.getMonth() + n); subDiary(); drawCal(); }

  function drawCal() {
    const y = cur.getFullYear(), m = cur.getMonth(), first = new Date(y, m, 1).getDay(), days = new Date(y, m + 1, 0).getDate(), t = ymd();
    const cells = [];
    for (let i = 0; i < first; i++) cells.push(h('span', { class: 'cell blank' }));
    for (let d = 1; d <= days; d++) {
      const ds = `${y}-${pad(m + 1)}-${pad(d)}`, evs = eventsOn(ds), ms = milestone(ds), wd = (first + d - 1) % 7;
      cells.push(h('button', { class: 'cell' + (ds === t ? ' today' : '') + (ds === sel ? ' sel' : '') + (wd === 0 ? ' sun' : wd === 6 ? ' sat' : ''), onClick: () => { sel = ds; drawCal(); drawPanel(); } },
        h('span', { class: 'num' }, d),
        h('span', { class: 'dots' }, ms && h('i', { class: 'd-heart' }, '♥'), [...new Set(evs.map(e => e.kind))].slice(0, 3).map(k => h('i', { class: 'dot k-' + k })), diary['d' + pad(d)] && h('i', { class: 'd-pen' }, '✎'))));
    }
    calEl.replaceChildren(
      h('div', { class: 'cal-head' }, h('button', { class: 'nav', onClick: () => move(-1), 'aria-label': '이전 달' }, '‹'), h('b', null, `${y}년 ${m + 1}월`), h('button', { class: 'nav', onClick: () => move(1), 'aria-label': '다음 달' }, '›'),
        h('button', { class: 'chip', onClick: () => jump(ymd()) }, '오늘')),
      h('div', { class: 'cal-grid wd' }, ['일', '월', '화', '수', '목', '금', '토'].map(w => h('span', null, w))),
      h('div', { class: 'cal-grid' }, cells));
  }

  // keepDraft: 내용이 바뀌어 다시 그릴 때 내가 쓰던 일기 글을 지우지 않기
  function drawPanel(keepDraft) {
    const prevTa = panel.querySelector('textarea.mine'), draft = keepDraft && draftFor === sel && prevTa ? prevTa.value : null, focused = prevTa && document.activeElement === prevTa;
    const evs = eventsOn(sel), ms = milestone(sel), dd = 'd' + sel.slice(8), ent = (sel.slice(0, 7) === ym() && diary[dd]) || {}, mine = ent[ctx.uid] || {}, pid = ctx.partnerId, theirs = pid && ent[pid];
    let mood = mine.mood || 'smile';
    const title = h('input', { class: 'inp', placeholder: kind === '예약' ? '예: 7시 파스타집 예약' : '무슨 날이야?', maxLength: 40 });
    const time = h('input', { class: 'inp time', type: 'time' });
    const add = async () => {
      const t = title.value.trim(); if (!t) return toast('내용을 적어 주세요');
      await ctx.store.push('events', { date: sel, time: time.value || '', title: t, kind, yearly: kind === '기념일', by: ctx.uid, ts: ctx.store.now() });
      toast('추가했어요');
    };
    const kinds = h('div', { class: 'chips' }, KINDS.map(k => { const b = h('button', { class: 'chip k-' + k + (k === kind ? ' on' : ''), onClick: () => { kind = k; kinds.querySelectorAll('.chip').forEach(x => x.classList.remove('on')); b.classList.add('on'); title.placeholder = k === '예약' ? '예: 7시 파스타집 예약' : '무슨 날이야?'; } }, k); return b; }));
    const ta = h('textarea', { class: 'inp mine', rows: 4, placeholder: '오늘 하루 어땠어?', value: draft != null ? draft : (mine.text || ''), maxLength: 1000 });
    draftFor = sel;
    const moods = h('div', { class: 'moods' }, MOODS.map(f => { const b = h('button', { class: 'mood' + (f === mood ? ' on' : ''), onClick: () => { mood = f; moods.querySelectorAll('.mood').forEach(x => x.classList.remove('on')); b.classList.add('on'); } }, capyEl(ctx.capyOf(ctx.uid, { face: f, head: true }))); return b; }));
    const saveDiary = async () => {
      const text = ta.value.trim(), path = `diary/${sel.slice(0, 7)}/${dd}/${ctx.uid}`;
      text ? await ctx.store.set(path, { text, mood, ts: ctx.store.now() }) : await ctx.store.remove(path);
      toast(text ? '일기를 저장했어요' : '일기를 지웠어요');
    };
    const n = start ? dayDiff(sel, start) + 1 : null;
    panel.replaceChildren(
      h('h3', null, niceDate(sel), n > 0 && h('small', null, ` · ${n}일째`)),
      h('ul', { class: 'ev-list' }, ms && h('li', null, h('em', { class: 'kind k-기념일' }, '♥'), h('span', { class: 'grow' }, '우리 ' + ms)),
        evs.map(e => h('li', null, h('em', { class: 'kind k-' + e.kind }, e.kind), h('span', { class: 'grow' }, e.time && h('b', null, e.time + ' '), e.title, e.yearly && e.date !== sel && h('small', null, ` (${e.date.slice(0, 4)}년부터)`)),
          h('small', { class: 'dim' }, ctx.nameOf(e.by)), h('button', { class: 'x', 'aria-label': '삭제', onClick: () => ask(`"${e.title}" 지울까요?`, '지우기').then(y => y && ctx.store.remove('events/' + e.id)) }, '×'))),
        !evs.length && !ms && h('li', { class: 'dim' }, '등록된 일정이 없어요')),
      h('div', { class: 'add-box' }, kinds, h('div', { class: 'row' }, title, time), h('button', { class: 'btn primary', onClick: add }, sel === ymd() ? '오늘에 추가' : '이 날에 추가')),
      h('h3', null, '일기'),
      h('div', { class: 'diary' },
        h('div', { class: 'diary-mine' }, moods, ta, h('button', { class: 'btn primary', onClick: saveDiary }, '일기 저장')),
        pid && h('div', { class: 'diary-theirs' }, capyEl(ctx.capyOf(pid, { face: theirs ? theirs.mood : 'sleepy', head: true })),
          h('div', { class: 'bubble' }, h('b', null, ctx.nameOf(pid)), h('p', null, theirs ? theirs.text : '아직 안 썼어요')))));
    if (focused) { const nt = panel.querySelector('textarea.mine'); nt.focus(); nt.setSelectionRange(nt.value.length, nt.value.length); }
  }

  offs.push(ctx.store.on('events', v => { events = v || {}; drawSoon(); drawCal(); drawPanel(true); }));
  offs.push(ctx.store.on('meta/start', v => { start = v; drawSoon(); drawCal(); drawPanel(true); }));
  subDiary(); drawCal(); drawPanel();
  return () => { offs.forEach(f => f()); diaryOff && diaryOff(); };
}
