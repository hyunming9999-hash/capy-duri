// 구글 Gemini 이미지 모델로 "옷 입혀보기". API 키는 코드에 넣지 않고 둘의 방 데이터(meta/gemini)에만 저장한다.
import { h, loadImg } from './ui.js';

const API = 'https://generativelanguage.googleapis.com/v1beta';
export const MODELS = [
  ['gemini-2.5-flash-image', '기본', '장당 약 0.04달러'],
  ['gemini-3.1-flash-image', '최신', '장당 약 0.05~0.07달러'],
];
export const KEY_PAGE = 'https://aistudio.google.com/apikey';

function fail(status, j) {
  const raw = (j && j.error && j.error.message) || '';
  let msg = raw || `요청이 실패했어요 (${status})`;
  if (status === 400 && /API key/i.test(raw)) msg = 'API 키가 올바르지 않아요. 다시 복사해서 넣어 주세요.';
  else if (status === 403) msg = '이 키로는 사용할 수 없어요. 키가 맞는지, Gemini API가 켜져 있는지 확인해 주세요.';
  else if (status === 404) msg = '선택한 모델을 찾을 수 없어요. AI 설정에서 다른 모델을 골라 주세요.';
  else if (status === 429) msg = '사용 한도에 걸렸어요. 이미지 모델은 결제(카드) 등록이 된 키에서만 동작해요. 구글 AI Studio에서 결제 설정을 확인해 주세요.';
  const e = new Error(msg); e.status = status; e.raw = raw; return e;
}
async function call(path, key, body) {
  let r;
  try { r = await fetch(API + path, { method: body ? 'POST' : 'GET', headers: { 'x-goog-api-key': key, ...(body ? { 'Content-Type': 'application/json' } : {}) }, body: body ? JSON.stringify(body) : undefined }); }
  catch { throw new Error('구글 서버에 연결하지 못했어요. 인터넷 연결을 확인해 주세요.'); }
  const j = await r.json().catch(() => ({}));
  if (!r.ok) throw fail(r.status, j);
  return j;
}

// 이 키로 쓸 수 있는 이미지 모델 이름들 (키 확인 겸용)
export async function listImageModels(key) {
  const j = await call('/models?pageSize=200', key);
  return (j.models || []).filter(m => /image/.test(m.name) && !/imagen/.test(m.name) && (m.supportedGenerationMethods || []).includes('generateContent')).map(m => m.name.replace('models/', ''));
}

// 사진을 JPEG base64로 (투명 배경은 흰색으로 채움)
async function toPart(dataUrl, maxSide) {
  const im = await loadImg(dataUrl), s = Math.min(1, maxSide / Math.max(im.naturalWidth, im.naturalHeight));
  const c = h('canvas', { width: Math.round(im.naturalWidth * s), height: Math.round(im.naturalHeight * s) }), x = c.getContext('2d');
  x.fillStyle = '#fff'; x.fillRect(0, 0, c.width, c.height); x.drawImage(im, 0, 0, c.width, c.height);
  return { inline_data: { mime_type: 'image/jpeg', data: c.toDataURL('image/jpeg', 0.9).split(',')[1] } };
}

const PROMPT = n => `The first image is a full-body photo of a person. The next ${n > 1 ? n + ' images each show a clothing item' : 'image shows a clothing item'}. `
  + `Edit the first image so the person is wearing ${n > 1 ? 'these clothing items' : 'this clothing item'}, fitted naturally to their body and pose with realistic folds and shadows. `
  + 'Keep the person\'s face, hair, skin tone, body shape and pose exactly the same. Keep the background, lighting, camera angle and framing exactly the same. '
  + 'Replace only the garments that the new items would cover and leave everything else the person is wearing unchanged. Return a single photorealistic image.';

// base: 전신 사진 dataURL, garments: 옷 사진 dataURL 배열 → 결과 사진 dataURL
export async function tryOn({ key, model, base, garments }) {
  const parts = [{ text: PROMPT(garments.length) }, await toPart(base, 1024)];
  for (const g of garments.slice(0, 3)) parts.push(await toPart(g, 768));
  const j = await call(`/models/${encodeURIComponent(model)}:generateContent`, key, { contents: [{ parts }], generationConfig: { responseModalities: ['TEXT', 'IMAGE'] } });
  const out = ((j.candidates || [])[0] || {}).content, ps = (out && out.parts) || [];
  const img = ps.filter(p => !p.thought && (p.inlineData || p.inline_data)).pop();
  if (!img) {
    const why = (j.promptFeedback && j.promptFeedback.blockReason) || ((j.candidates || [])[0] || {}).finishReason || '';
    const said = ps.filter(p => p.text && !p.thought).map(p => p.text).join(' ').slice(0, 160);
    throw new Error('AI가 사진을 만들지 못했어요.' + (why && why !== 'STOP' ? ` (사유: ${why})` : '') + (said ? ' ' + said : ' 다른 사진으로 다시 해보세요.'));
  }
  const d = img.inlineData || img.inline_data;
  return `data:${d.mimeType || d.mime_type || 'image/png'};base64,${d.data}`;
}
