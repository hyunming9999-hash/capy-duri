// 오늘 뭐 먹지? — 지도 검색으로 넘기기, 둘의 찜 목록(1~7순위, 가게 링크), 룰렛
import { h, toast, ask, ymd, josa } from './ui.js';
import { capyEl } from './capy.js';

const QUICK = ['파스타', '고기', '초밥', '국밥', '마라탕', '떡볶이', '치킨', '카페'];
const BASIC = ['파스타', '삼겹살', '초밥', '국밥', '마라탕', '떡볶이', '치킨', '피자', '쌀국수', '돈가스', '햄버거', '칼국수'];
const MAX = 7;
export const naverUrl = q => 'https://map.naver.com/p/search/' + encodeURIComponent(q);
export const kakaoUrl = q => 'https://map.kakao.com/?q=' + encodeURIComponent(q);
// 붙여넣은 글에서 http(s) 주소만 꺼낸다 (지도 앱 공유 문구째로 붙여도 됨)
export function cleanLink(v) {
  v = (v || '').trim(); if (!v) return '';
  const m = v.match(/https?:\/\/[^\s"'<>]+/i); if (m) v = m[0]; else if (/^[\w-]+(\.[\w-]+)+(\/\S*)?$/.test(v)) v = 'https://' + v; else return null;
  try { const u = new URL(v); return /^https?:$/.test(u.protocol) ? u.href : null; } catch { return null; }
}

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

  const sorted = () => Object.keys(places).sort((a, b) => (places[a].ord ?? places[a].ts ?? 0) - (places[b].ord ?? places[b].ts ?? 0) || a.localeCompare(b));
  const name = h('input', { class: 'inp', placeholder: '가게 이름', maxLength: 30 });
  const memo = h('input', { class: 'inp', placeholder: '메모 (메뉴, 위치 등)', maxLength: 50 });
  const link = h('input', { class: 'inp', placeholder: '가게 링크 (지도·인스타 주소 붙여넣기, 없어도 됨)', inputMode: 'url', maxLength: 500 });
  const addBtn = h('button', { class: 'btn primary', onClick: addPlace }, '찜하기');
  const count = h('small', { class: 'dim' });
  async function addPlace() {
    const n = name.value.trim(); if (!n) return toast('가게 이름을 적어 주세요');
    const ids = sorted(); if (ids.length >= MAX) return toast(`찜 목록은 ${MAX}순위까지예요. 하나를 지우고 넣어 주세요`);
    const url = cleanLink(link.value); if (url === null) return toast('링크는 http로 시작하는 주소를 붙여넣어 주세요');
    const last = ids.length ? (places[ids[ids.length - 1]].ord ?? ids.length) : 0;
    await ctx.store.push('eat/places', { name: n, memo: memo.value.trim(), link: url, by: ctx.uid, ts: ctx.store.now(), ord: last + 1, done: false });
    name.value = ''; memo.value = ''; link.value = ''; toast(`${ids.length + 1}순위로 넣었어요`);
  }
  // 순위 바꾸기: 위아래 두 가게의 순번을 맞바꾼다
  const move = (ids, i, d) => { const a = ids[i], b = ids[i + d]; if (!b) return; ctx.store.update('eat/places', { [a + '/ord']: i + d + 1, [b + '/ord']: i + 1 }); ids.forEach((id, k) => { if (id !== a && id !== b && places[id].ord !== k + 1) ctx.store.update('eat/places/' + id, { ord: k + 1 }); }); };
  const list = h('ol', { class: 'place-list' });
  const wheel = h('div', { class: 'wheel' });

  function drawList() {
    const ids = sorted();
    count.textContent = `${ids.length} / ${MAX}`; addBtn.disabled = ids.length >= MAX;
    list.replaceChildren(...(ids.length ? ids.map((id, i) => { const p = places[id];
      return h('li', { class: p.done ? 'done' : '' },
        h('span', { class: 'rank' }, i + 1),
        h('div', { class: 'grow' }, h('b', null, p.name), p.memo && h('small', null, p.memo), h('small', { class: 'dim' }, ctx.nameOf(p.by) + (p.done ? ' · 다녀옴' : ''))),
        p.link ? h('a', { class: 'chip on', href: p.link, target: '_blank', rel: 'noopener noreferrer' }, '링크') : h('a', { class: 'chip', href: naverUrl([area, p.name].filter(Boolean).join(' ')), target: '_blank', rel: 'noopener' }, '지도'),
        h('button', { class: 'check' + (p.done ? ' on' : ''), 'aria-label': '다녀옴', onClick: () => ctx.store.update('eat/places/' + id, { done: !p.done }) }, p.done ? '✓' : ''),
        h('span', { class: 'ord' }, h('button', { 'aria-label': '순위 올리기', disabled: i === 0, onClick: () => move(ids, i, -1) }, '▲'), h('button', { 'aria-label': '순위 내리기', disabled: i === ids.length - 1, onClick: () => move(ids, i, 1) }, '▼')),
        h('button', { class: 'x', 'aria-label': '삭제', onClick: () => ask(`"${p.name}" 지울까요?`, '지우기').then(y => y && ctx.store.remove('eat/places/' + id)) }, '×'));
    }) : [h('li', { class: 'dim' }, '가고 싶은 곳을 1순위부터 7순위까지 찜해 두세요. 룰렛이 여기서 골라 줘요')]));
  }
  function drawWheel(rolling) {
    const today = pick && ymd(new Date(pick.ts)) === ymd();
    const hit = today && Object.values(places).find(p => p.name === pick.name && p.link);
    wheel.replaceChildren(capyEl(ctx.capyOf(ctx.uid, { face: rolling ? 'wow' : today ? 'love' : 'smile', acc: 'yuzu' }), rolling ? 'spin' : 'bob'),
      h('div', { class: 'wheel-text' }, h('small', null, rolling ? '두구두구…' : today ? `${josa(ctx.nameOf(pick.by), '가', '이')} 돌린 오늘의 메뉴` : '뭐 먹을지 못 정하겠으면'),
        h('b', { class: 'result' }, rolling || (today ? pick.name : '룰렛 돌리기')),
        today && !rolling && (hit ? h('a', { class: 'chip on', href: hit.link, target: '_blank', rel: 'noopener noreferrer' }, '가게 링크 열기')
          : h('a', { class: 'chip', href: naverUrl([area, pick.name, pick.menu ? '맛집' : ''].filter(Boolean).join(' ')), target: '_blank', rel: 'noopener' }, '지도에서 보기'))),
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
      h('p', { class: 'dim' }, '검색 결과는 지도 앱에서 열려요. 마음에 드는 곳은 공유 링크를 복사해 아래 찜 목록에 넣어 두세요.')),
    h('section', { class: 'box' }, wheel),
    h('section', { class: 'box' }, h('h3', null, '둘의 찜 목록 ', count), h('div', { class: 'eat-form' }, h('div', { class: 'row' }, name, memo), link, addBtn), list));
  drawLinks();
  offs.push(ctx.store.on('eat/places', v => { places = v || {}; drawList(); }));
  offs.push(ctx.store.on('eat/pick', v => { pick = v; if (!spinning) drawWheel(); }));
  return () => offs.forEach(f => f());
}
