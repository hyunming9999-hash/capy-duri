// 오늘 뭐 먹지? — 지도 검색으로 넘기기, 둘의 찜 목록(1~7순위, 가게 링크), 룰렛
import { h, toast, ask, ymd, josa, pickImage, fileToCanvas, jpeg } from './ui.js';
import { capyEl } from './capy.js';
import { putBlob, getBlob, delBlob } from './store.js';

// 가게 링크의 대표 사진·이름을 무료 미리보기 서비스(microlink, 키 없이 하루 수십 건)로 한 번 가져와 방에 저장해 둔다.
// 네이버 지도 공유 링크는 첫 화면이 "네이버 지도"뿐이라, 가게 번호가 보이면 네이버 플레이스 모바일 페이지로 한 번 더 물어본다.
const GENERIC = /^(네이버\s*지도|naver\s*map|카카오맵|kakaomap|kakao\s*map)$/i;
async function mlink(url) {
  const r = await fetch('https://api.microlink.io/?url=' + encodeURIComponent(url));
  const j = await r.json().catch(() => ({}));
  if (j.status !== 'success') throw new Error(j.code === 'ERATE' ? '오늘 미리보기 횟수를 다 썼어요' : '미리보기를 가져오지 못했어요');
  return j.data || {};
}
export async function linkPreview(url) {
  let d = await mlink(url);
  const id = ((d.url || '') + ' ' + url).match(/place\/(\d{5,})/);
  if (id && (!d.image || GENERIC.test((d.title || '').trim()))) { try { const d2 = await mlink(`https://m.place.naver.com/place/${id[1]}/home`); if (d2.image || d2.title) d = d2; } catch {} }
  const img = d.image && d.image.url, title = (d.title || '').trim();
  if (!img && (!title || GENERIC.test(title))) throw new Error('이 링크에는 가게 사진 정보가 없어요');
  return { img: img || '', title: GENERIC.test(title) ? '' : title.slice(0, 60), desc: (d.description || '').trim().slice(0, 90) };
}

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
    const id = await ctx.store.push('eat/places', { name: n, memo: memo.value.trim(), link: url, by: ctx.uid, ts: ctx.store.now(), ord: last + 1, done: false });
    name.value = ''; memo.value = ''; link.value = ''; toast(`${ids.length + 1}순위로 넣었어요`);
    if (url) loadPreview(id, url);
  }
  // 순위 바꾸기: 위아래 두 가게의 순번을 맞바꾼다
  const move = (ids, i, d) => { const a = ids[i], b = ids[i + d]; if (!b) return; ctx.store.update('eat/places', { [a + '/ord']: i + d + 1, [b + '/ord']: i + 1 }); ids.forEach((id, k) => { if (id !== a && id !== b && places[id].ord !== k + 1) ctx.store.update('eat/places/' + id, { ord: k + 1 }); }); };
  const list = h('ol', { class: 'place-list' });
  const wheel = h('div', { class: 'wheel' });

  const trying = new Set();
  async function loadPreview(id, url, manual) {
    if (trying.has(id)) return; trying.add(id); drawList();
    try { const pv = await linkPreview(url); await ctx.store.set(`eat/places/${id}/pv`, pv); if (manual) toast('가게 화면을 불러왔어요'); }
    catch (e) { await ctx.store.set(`eat/places/${id}/pv`, { fail: 1 }).catch(() => {}); if (manual) toast(e.message + '. 📷 사진으로 직접 넣을 수 있어요', 3500); }
    trying.delete(id); drawList();
  }
  async function setPhoto(id) {
    const f = await pickImage(); if (!f) return;
    try { const c = await fileToCanvas(f, 900); const k = await putBlob(ctx.store, jpeg(c, 0.78)); const old = places[id].photo; await ctx.store.set(`eat/places/${id}/photo`, k); old && delBlob(ctx.store, old); toast('사진을 넣었어요'); } catch (e) { toast(e.message || '사진을 넣지 못했어요'); }
  }
  // 대표 사진: 직접 넣은 사진 > 링크 미리보기 사진 > 없으면 그림
  function cover(id, p, i) {
    const box = h('div', { class: 'pimg' }, h('span', { class: 'rank' }, i + 1));
    const show = src => { const im = h('img', { alt: p.name + ' 사진', referrerPolicy: 'no-referrer', loading: 'lazy' }); im.onerror = () => { im.remove(); box.classList.add('empty'); }; im.src = src; box.prepend(im); };
    if (p.photo) getBlob(ctx.store, p.photo).then(u => u ? show(u) : box.classList.add('empty'));
    else if (p.pv && p.pv.img) show(p.pv.img);
    else box.classList.add('empty'), box.prepend(h('span', { class: 'pimg-ph', style: trying.has(id) ? { fontSize: '15px' } : null }, trying.has(id) ? '가게 화면 불러오는 중…' : '🍽️'));
    return box;
  }
  function drawList() {
    const ids = sorted();
    count.textContent = `${ids.length} / ${MAX}`; addBtn.disabled = ids.length >= MAX;
    list.replaceChildren(...(ids.length ? ids.map((id, i) => { const p = places[id];
      if (p.link && !p.pv && !p.photo && !trying.has(id)) setTimeout(() => loadPreview(id, p.link), 0); // 예전에 넣은 가게도 한 번 불러 본다
      const open = p.link ? h('a', { class: 'pbtn main', href: p.link, target: '_blank', rel: 'noopener noreferrer' }, '가게 화면 열기') : h('a', { class: 'pbtn main', href: naverUrl([area, p.name].filter(Boolean).join(' ')), target: '_blank', rel: 'noopener' }, '지도에서 찾기');
      return h('li', { class: 'pcard' + (p.done ? ' done' : '') },
        cover(id, p, i),
        h('div', { class: 'pbody' }, h('b', { class: 'pname' }, p.name), p.pv && p.pv.title && p.pv.title !== p.name && h('small', { class: 'pv-title' }, p.pv.title), p.memo && h('p', { class: 'pmemo' }, p.memo),
          h('small', { class: 'dim' }, ctx.nameOf(p.by) + (p.done ? ' · 다녀옴' : ''))),
        h('div', { class: 'pact' }, open,
          h('button', { class: 'pbtn', onClick: () => setPhoto(id) }, '📷 사진'),
          p.link && p.pv && p.pv.fail && !p.photo && h('button', { class: 'pbtn', onClick: () => loadPreview(id, p.link, true) }, '다시 불러오기'),
          h('button', { class: 'check' + (p.done ? ' on' : ''), 'aria-label': '다녀옴', title: '다녀옴', onClick: () => ctx.store.update('eat/places/' + id, { done: !p.done }) }, p.done ? '✓' : ''),
          h('span', { class: 'ord' }, h('button', { 'aria-label': '순위 올리기', disabled: i === 0, onClick: () => move(ids, i, -1) }, '▲'), h('button', { 'aria-label': '순위 내리기', disabled: i === ids.length - 1, onClick: () => move(ids, i, 1) }, '▼')),
          h('button', { class: 'x', 'aria-label': '삭제', onClick: () => ask(`"${p.name}" 지울까요?`, '지우기').then(y => { if (y) { ctx.store.remove('eat/places/' + id); p.photo && delBlob(ctx.store, p.photo); } }) }, '×')));
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
