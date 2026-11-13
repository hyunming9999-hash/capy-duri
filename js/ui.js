// 공용 도구: DOM 만들기, 토스트, 모달, 이미지 줄이기
if (typeof CanvasRenderingContext2D !== 'undefined' && !CanvasRenderingContext2D.prototype.roundRect) CanvasRenderingContext2D.prototype.roundRect = function (x, y, w, h) { this.rect(x, y, w, h); };
export const $ = (s, r = document) => r.querySelector(s);

export function h(tag, attrs, ...kids) {
  const el = document.createElement(tag);
  if (attrs) for (const [k, v] of Object.entries(attrs)) {
    if (v == null || v === false) continue;
    if (k === 'class') el.className = v;
    else if (k === 'html') el.innerHTML = v;
    else if (k === 'style' && typeof v === 'object') { for (const [sk, sv] of Object.entries(v)) sk.startsWith('--') ? el.style.setProperty(sk, sv) : (el.style[sk] = sv); }
    else if (k.startsWith('on')) el.addEventListener(k.slice(2).toLowerCase(), v);
    else if (k in el && k !== 'list') { try { el[k] = v; } catch { el.setAttribute(k, v); } }
    else el.setAttribute(k, v);
  }
  for (const kid of kids.flat(9)) {
    if (kid == null || kid === false) continue;
    el.append(kid.nodeType ? kid : document.createTextNode(String(kid)));
  }
  return el;
}

// 화면 위쪽에 잠깐 뜨는 알림 띠 (버튼을 누르면 해당 화면으로 이동)
export function banner(text, label, onGo) {
  document.querySelectorAll('.banner').forEach(b => b.remove());
  const el = h('div', { class: 'banner', role: 'status' }, h('span', { class: 'grow' }, text),
    label && h('button', { class: 'btn sm primary', onClick: () => { el.remove(); onGo && onGo(); } }, label),
    h('button', { class: 'x', 'aria-label': '닫기', onClick: () => el.remove() }, '×'));
  document.body.append(el); setTimeout(() => el.remove(), 10000);
  return el;
}

let toastT;
export function toast(msg, ms = 2200) {
  let t = $('#toast');
  if (!t) { t = h('div', { id: 'toast' }); document.body.append(t); }
  t.textContent = msg; t.classList.add('on');
  clearTimeout(toastT); toastT = setTimeout(() => t.classList.remove('on'), ms);
}

// actions: [{label, primary, danger, onClick(close)}]
export function modal({ title, body, actions = [], onClose }) {
  const close = () => { wrap.remove(); onClose && onClose(); };
  const wrap = h('div', { class: 'modal-wrap', onClick: e => { if (e.target === wrap) close(); } },
    h('div', { class: 'modal' },
      title && h('h3', null, title),
      h('div', { class: 'modal-body' }, body),
      actions.length > 0 && h('div', { class: 'modal-actions' }, actions.map(a =>
        h('button', { class: 'btn' + (a.primary ? ' primary' : '') + (a.danger ? ' danger' : ''), onClick: () => a.onClick ? a.onClick(close) : close() }, a.label)))));
  document.body.append(wrap);
  return close;
}

export const ask = (msg, yes = '응', no = '아니') => new Promise(res =>
  modal({ body: h('p', { class: 'center' }, msg), onClose: () => res(false),
    actions: [{ label: no, onClick: c => { c(); } }, { label: yes, primary: true, onClick: c => { res(true); c(); } }] }));

export const pad = n => String(n).padStart(2, '0');
export const ymd = (d = new Date()) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
export const parseYmd = s => { const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d); };
export const dayDiff = (a, b) => Math.round((parseYmd(a) - parseYmd(b)) / 864e5);
const WD = ['일', '월', '화', '수', '목', '금', '토'];
export const niceDate = s => { const d = parseYmd(s); return `${d.getMonth() + 1}월 ${d.getDate()}일 (${WD[d.getDay()]})`; };
export const hm = ts => { const d = new Date(ts); return `${d.getHours() < 12 ? '오전' : '오후'} ${d.getHours() % 12 || 12}:${pad(d.getMinutes())}`; };

// camera: true 면 휴대폰에서 사진첩 대신 카메라가 바로 열린다 (PC는 파일 선택)
export function pickImage(camera) {
  return new Promise(res => {
    const inp = h('input', { type: 'file', accept: 'image/*', style: { display: 'none' } });
    if (camera) inp.setAttribute('capture', 'environment');
    inp.onchange = () => { res(inp.files[0] || null); inp.remove(); };
    document.body.append(inp); inp.click();
  });
}
export function loadImg(src) {
  return new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = () => rej(new Error('이미지를 열 수 없어요')); i.src = src; });
}
// HEIC(아이폰·갤럭시 고효율 사진)는 브라우저가 못 여는 경우가 많아, 필요할 때만 변환기를 불러와 JPG로 바꾼다
let heicLib;
function heicToBlob(file) {
  heicLib = heicLib || new Promise((res, rej) => { const sc = document.createElement('script'); sc.src = new URL('./vendor/heic2any.min.js', import.meta.url).href; sc.onload = () => res(window.heic2any); sc.onerror = () => { heicLib = null; rej(new Error('변환기를 불러오지 못했어요')); }; document.head.append(sc); });
  return heicLib.then(fn => fn({ blob: file, toType: 'image/jpeg', quality: 0.85 })).then(b => Array.isArray(b) ? b[0] : b);
}
const viaImg = async blob => { const url = URL.createObjectURL(blob); try { const img = await loadImg(url); if (img.decode) await img.decode().catch(() => {}); return [img, img.naturalWidth, img.naturalHeight]; } finally { setTimeout(() => URL.revokeObjectURL(url), 3000); } };
// 아주 큰 사진(1억 화소 등)은 줄여서 읽어 메모리 부족을 피한다
const viaBitmap = async (blob, side) => { let b; try { b = await createImageBitmap(blob, { resizeWidth: side, resizeQuality: 'medium' }); } catch { b = await createImageBitmap(blob); } return [b, b.width, b.height]; };
export async function fileToCanvas(file, maxSide) {
  if (!file || !file.size) throw new Error('사진 파일이 비어 있어요. 사진첩에서 기기에 저장된 사진을 골라 주세요');
  let head = ''; try { head = new TextDecoder('latin1').decode(await file.slice(0, 16).arrayBuffer()); } catch {}
  const isHeic = /hei[cf]/i.test(file.type + ' ' + (file.name || '')) || /ftyp(hei|hev|mif1|msf1)/.test(head);
  const tries = isHeic ? [() => heicToBlob(file).then(viaImg), () => viaImg(file), () => viaBitmap(file, maxSide)] : [() => viaImg(file), () => viaBitmap(file, maxSide), () => heicToBlob(file).then(viaImg)];
  let got = null;
  for (const t of tries) { try { const r = await t(); if (r[1] && r[2]) { got = r; break; } } catch {} }
  if (!got) throw new Error(`이 사진은 열 수 없어요 (${isHeic ? 'HEIC' : file.type || '형식 모름'}, ${(file.size / 1048576).toFixed(1)}MB). 스크린샷으로 찍어서 올려 보세요`);
  const [img, w, hh] = got, s = Math.min(1, maxSide / Math.max(w, hh));
  const c = h('canvas', { width: Math.max(1, Math.round(w * s)), height: Math.max(1, Math.round(hh * s)) });
  c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
  return c;
}
export const jpeg = (canvas, q = 0.72) => canvas.toDataURL('image/jpeg', q);

// 길게 누르는 버튼 (방향키 대용)
export function holdBtn(el, onDown, onUp) {
  const d = e => { e.preventDefault(); el.classList.add('held'); onDown(); };
  const u = e => { e.preventDefault(); el.classList.remove('held'); onUp(); };
  el.addEventListener('pointerdown', d); el.addEventListener('pointerup', u);
  el.addEventListener('pointerleave', u); el.addEventListener('pointercancel', u);
  el.addEventListener('contextmenu', e => e.preventDefault());
}

// 받침에 따라 조사 고르기: josa('유자','와','과') → '유자와'
export function josa(word, noBatchim, batchim) {
  const c = (word || '').charCodeAt((word || '').length - 1);
  const has = c >= 0xAC00 && c <= 0xD7A3 ? (c - 0xAC00) % 28 !== 0 : false;
  return word + (has ? batchim : noBatchim);
}
