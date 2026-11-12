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

export function pickImage() {
  return new Promise(res => {
    const inp = h('input', { type: 'file', accept: 'image/*', style: { display: 'none' } });
    inp.onchange = () => { res(inp.files[0] || null); inp.remove(); };
    document.body.append(inp); inp.click();
  });
}
export function loadImg(src) {
  return new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = () => rej(new Error('이미지를 열 수 없어요')); i.src = src; });
}
export async function fileToCanvas(file, maxSide) {
  const url = URL.createObjectURL(file);
  try {
    const img = await loadImg(url);
    const s = Math.min(1, maxSide / Math.max(img.naturalWidth, img.naturalHeight));
    const c = h('canvas', { width: Math.round(img.naturalWidth * s), height: Math.round(img.naturalHeight * s) });
    c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
    return c;
  } finally { URL.revokeObjectURL(url); }
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
