// 오늘 뭐 먹지? — 지도 검색으로 넘기기, 둘의 찜 목록, 룰렛
import { h, toast, ask, ymd, josa } from './ui.js';
import { capyEl } from './capy.js';

const QUICK = ['파스타', '고기', '초밥', '국밥', '마라탕', '떡볶이', '치킨', '카페'];
const BASIC = ['파스타', '삼겹살', '초밥', '국밥', '마라탕', '떡볶이', '치킨', '피자', '쌀국수', '돈가스', '햄버거', '칼국수'];
export const naverUrl = q => 'https://map.naver.com/p/search/' + encodeURIComponent(q);
export const kakaoUrl = q => 'https://map.kakao.com/?q=' + encodeURIComponent(q);

export function mount(el, ctx) {
  const offs = []; let places = {}, pick = null, spinning = false;
  let area = ''; try { area = localStorage.getItem('capy.area') || ''; } catch {}

  const q = h('input', { class: 'inp', placeholder: '예: 유성구 파스타 맛집', enterKeyHint: 'search' });
  const areaInp = h('input', { class: 'inp area', placeholder: '동네 (예: 유성구)', value: area, onChange: () => { area = areaInp.value.trim(); try { localStorage.setItem('capy.area', area); } catch {} } });
  const links = h('div', { class: 'row links' });
  const drawLinks = () => {
    const v = q.value.trim();
    links.replaceChildren(
      h('a', { class: 'btn naver' + (v ? '' : ' off'), href: v ? naverUrl(v) : null, target: '_blank', rel: 'noopener' }, '네이버 지도에서 찾기'),
      h('a', { class: 'btn kakao' + (v ? '' : ' off'), href: v ? kakaoUrl(v) : null, target: '_blank', rel: 'noopener' }, '카카오맵에서 찾기'));
  };
  q.addEventListener('input', drawLinks);
  const quick = h('div', { class: 'chips' }, QUICK.map(k => h('button', { class: 'chip', onClick: () => { q.value = [areaInp.value.trim(), k, k === '카페' ? '' : '맛집'].filter(Boolean).join(' '); drawLinks(); } }, k)));

  const name = h('input', { class: 'inp', placeholder: '가게 이름', maxLength: 30 });
  const memo = h('input', { class: 'inp', placeholder: '메모 (메뉴, 위치 등)', maxLength: 50 });
  const addPlace = async () => {
    const n = name.value.trim(); if (!n) return toast('가게 이름을 적어 주세요');
    await ctx.store.push('eat/places', { name: n, memo: memo.value.trim(), by: ctx.uid, ts: ctx.store.now(), done: false });
    name.value = ''; memo.value = ''; toast('찜 목록에 넣었어요');
  };
  const list = h('ul', { class: 'place-list' });
  const wheel = h('div', { class: 'wheel' });

  function drawList() {
    const ids = Object.keys(places).sort((a, b) => (places[a].done - places[b].done) || b.localeCompare(a));
    list.replaceChildren(...(ids.length ? ids.map(id => { const p = places[id];
      return h('li', { class: p.done ? 'done' : '' },
        h('button', { class: 'check' + (p.done ? ' on' : ''), 'aria-label': '다녀옴', onClick: () => ctx.store.update('eat/places/' + id, { done: !p.done }) }, p.done ? '✓' : ''),
        h('div', { class: 'grow' }, h('b', null, p.name), p.memo && h('small', null, ' ' + p.memo), h('small', { class: 'dim' }, ' · ' + ctx.nameOf(p.by))),
        h('a', { class: 'chip', href: naverUrl([area, p.name].filter(Boolean).join(' ')), target: '_blank', rel: 'noopener' }, '지도'),
        h('button', { class: 'x', 'aria-label': '삭제', onClick: () => ask(`"${p.name}" 지울까요?`, '지우기').then(y => y && ctx.store.remove('eat/places/' + id)) }, '×'));
    }) : [h('li', { class: 'dim' }, '가고 싶은 곳을 찜해 두면 룰렛이 여기서 골라 줘요')]));
  }
  function drawWheel(rolling) {
    const today = pick && ymd(new Date(pick.ts)) === ymd();
    wheel.replaceChildren(capyEl(ctx.capyOf(ctx.uid, { face: rolling ? 'wow' : today ? 'love' : 'smile', acc: 'yuzu' }), rolling ? 'spin' : 'bob'),
      h('div', { class: 'wheel-text' }, h('small', null, rolling ? '두구두구…' : today ? `${josa(ctx.nameOf(pick.by), '가', '이')} 돌린 오늘의 메뉴` : '뭐 먹을지 못 정하겠으면'),
        h('b', { class: 'result' }, rolling || (today ? pick.name : '룰렛 돌리기')),
        today && !rolling && h('a', { class: 'chip', href: naverUrl([area, pick.name, pick.menu ? '맛집' : ''].filter(Boolean).join(' ')), target: '_blank', rel: 'noopener' }, '지도에서 보기')),
      h('button', { class: 'btn primary', disabled: !!rolling, onClick: spin }, today ? '다시' : '돌리기'));
  }
  function spin() {
    if (spinning) return; spinning = true;
    const cand = Object.values(places).filter(p => !p.done).map(p => ({ name: p.name }));
    const pool = cand.length >= 2 ? cand : cand.concat(BASIC.map(n => ({ name: n, menu: true })));
    let i = 0; const t = setInterval(() => drawWheel(pool[i++ % pool.length].name), 90);
    setTimeout(() => { clearInterval(t); spinning = false; const r = pool[Math.floor(Math.random() * pool.length)]; ctx.store.set('eat/pick', { name: r.name, menu: !!r.menu, by: ctx.uid, ts: ctx.store.now() }); }, 1700);
  }

  el.append(
    h('section', { class: 'box' }, h('h3', null, '맛집 찾기'), h('div', { class: 'row' }, areaInp, q), quick, links,
      h('p', { class: 'dim' }, '검색 결과는 지도 앱에서 열려요. 마음에 드는 곳은 아래 찜 목록에 적어 두세요.')),
    h('section', { class: 'box' }, wheel),
    h('section', { class: 'box' }, h('h3', null, '둘의 찜 목록'), h('div', { class: 'row' }, name, memo), h('button', { class: 'btn primary', onClick: addPlace }, '찜하기'), list));
  drawLinks();
  offs.push(ctx.store.on('eat/places', v => { places = v || {}; drawList(); }));
  offs.push(ctx.store.on('eat/pick', v => { pick = v; if (!spinning) drawWheel(); }));
  return () => offs.forEach(f => f());
}
