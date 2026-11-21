// 카피공항 여권 발급 퀘스트 · 「폐하의 첫 외교」 예시판(?passdemo)
// 저장·보상 없이 처음부터 끝까지 이야기와 미니게임을 그대로 해 본다. 물고기·유자·요리처럼 시간이 걸리는 단계는 "했다고 치고" 넘어간다.
import { h, toast, modal } from './ui.js';
import { FISH } from './fishing.js';
import { sfx } from './sound.js';
import { slingGame } from './farmcrow.js';

const LION = 10, OWL = 19, OCTO = 25, DOG = 0, PIG = 12, COW = 11, RACC = 29, BEAR = 6, TURTLE = 24;
export const TAIL_N = 30, TAIL_SEC = 5; // 꼬리땐스: 좌우 번갈아 30번을 5초 안에

export async function passDemo(q, d) {
  const host = d.host(); if (!host) return;
  ['bg-lot', 'bg-wrap', 'bg-wrap2', 'bg-class', 'bg-plaza-happy', 'letter', 'dog-bark', 'bottle', 'throw', 'current', 'gull-idle', 'gull-look', 'ship-q', 'badge', 'passport'].forEach(n => { new Image().src = `img/quest/${n}.webp`; }); new Image().src = 'img/fl/a0-back.webp'; // 장면이 바뀔 때 그림이 늦게 뜨지 않게 미리 받아 둔다
  let n = 0; const TOTAL = 39;
  const S = (lines, who, ch, bg, extra, buttons, deco) => { n++; return q.scene(lines, who, `🛂 ${ch} · ${Math.min(n, TOTAL)}/${TOTAL}`, extra, buttons, bg, deco); };
  const card = (src, cls) => { const el = h('img', { class: 'pq-deco ' + cls, src, alt: '' }); return () => el; }; // 대사 내내 화면 가운데에 그림 한 장
  const sub = t => h('p', { class: 'vn-sub' }, t);
  const fake = (lines, who, ch, what, bg) => S(lines, who, ch, bg, [sub(`🧪 예시판: 실제로는 ${what} 진행돼요`)], [{ label: '했다고 치고 넘어가기 ▶', value: 1, primary: true }]);
  const go = async (...a) => { const v = await S(...a); if (v == null) throw 0; return v; };
  const goF = async (...a) => { const v = await fake(...a); if (v == null) throw 0; return v; };
  try {
    // ── 프롤로그 · 바다에서 온 편지
    const P = '프롤로그 · 바다에서 온 편지';
    await go(['{wow}폐, 폐하! 황금 장비 여섯 개를 두르시니 눈이 부셔서 못 보겠사옵니다!', '{think}그런데 바닷가에 뭔가 반짝이는 게 떠밀려 왔다는구먼요.', '{smile}가 보시지요!'], LION, P);
    if (!(await findBottle(host))) throw 0; n++;
    await go(['{think}어디 보자… 발도장이 찍혀 있군. 핫똑랜드에서 온 편지일세.', '{smug}"황금 전사가 탄생했다는 소문이 바다 건너까지 들립니다. 진짜입니까? 진짜라면 꼭 와 주십시오. — 핫똑랜드 일동 (멍)"'], OWL, P, '', [], undefined, card('img/quest/letter.webp', 'letter'));
    await go(['{think}고급 바다부터는 갈맥 해적단 패악질 때문에 위험해.', '{smug}우리를 보증해 줄 황금 용사가 직접 가는 게 제일 확실하지.', '{smile}그러려면 여권이 필요하고… 가기 전에 준비할 게 산더미야!'], OCTO, P);
    // ── 1장 · 형제의 꼬리땐스
    const C1 = '1장 · 형제의 꼬리땐스';
    await go(['{smile}핫똑랜드랑 친해지려면 땐스를 배워야 해.', '{happy}강아지한테는 형제애를 느끼는 아주 중요한 땐스거든.', '{shy}근데… 이건 아무한테나 보여 주는 게 아닌데.'], DOG, C1);
    await go(['{think}(두리번두리번)', '{shy}…따라와.'], DOG, C1);
    await go(['{shy}여기라면 아무도 없겠지.', '(휘이잉… 바람에 덤불 하나가 굴러간다)', '{think}…', '{happy}(갑자기 꼬리를 미친 듯이 좌우로 흔든다! 엉덩이까지 같이 흔들린다!)', '{smug}…봤지? 이게 꼬리 땐스야.'], DOG, C1, 'lot', [], undefined, (() => { const dd = h('div', { class: 'pq-deco dogdance', 'data-nopf': '1' }, h('img', { src: 'img/fl/a0-back.webp', alt: '' }), h('i', { class: 'pq-wh' })); return k => (k >= 3 ? dd : null); })());
    if (!(await tailDance(host, d))) throw 0; n++;
    { const bark = h('img', { class: 'pq-deco bark', src: 'img/quest/dog-bark.webp', alt: '', 'data-nopf': '1' }); await go(['{cry}멍멍 멍멍!! (강아지 방언)', '{shy}할아버지랑 해 보고서… 오랜만에 해 봐.'], DOG, C1, 'lot', [], undefined, k => (k === 0 ? bark : null)); }
    // ── 2장 · 고급 입맛
    const C2 = '2장 · 고급 입맛';
    await go(['{smug}핫똑랜드 녀석들 입이 아주 고급이야.', '{think}평범한 생선 들고 가면 코웃음 친다고.'], PIG, C2);
    await goF(['{think}음, 나쁘지 않네.'], PIG, C2 + ' · 희귀 물고기 1/3', '퀘스트를 받은 뒤 중급 바다에서 희귀 등급 이상을 잡으면');
    await goF(['{love}오, 이건 좀 땡기는데? (침 줄줄)'], PIG, C2 + ' · 희귀 물고기 2/3', '중급 바다 희귀 물고기를 한 마리 더 잡으면');
    await goF(['{wow}이거다! 이거면 강아지들 방언 터진다!', '{happy}강아지 방언 들어 본 적 있어? 나도 한번 만들어 보고 싶다.'], PIG, C2 + ' · 희귀 물고기 3/3', '세 번째 희귀 물고기를 잡으면');
    const eat = await go(['{shy}한 마리만 맛보면 안 될까…?'], PIG, C2, '', [], [{ label: '안 돼', value: 'no' }, { label: '그래, 먹어', value: 'yes', primary: true }]);
    if (eat === 'no') await go(['{sad}아… 역시 안 되겠지?'], PIG, C2);
    else await go(['{smug}농담이야! 외교 물품은 손대면 안 되지.', '{smug}너는 황금 폐하잖아! 식욕을 절제하고 체통을 지켜야 해.', '@{sad}(……)'], PIG, C2);
    // ── 3장 · 외교선물 황금유자
    const C3 = '3장 · 외교선물 황금유자';
    await go(['{smile}외교선물엔 뭐니 뭐니 해도 황금유자지. 300년 전에도 장터에서 제일 귀했던 과일이야.', '{think}근데 키우기도 힘들고… 까마귀 악당을 조심해야 해.'], COW, C3);
    await goF(['{happy}황금유자가 주렁주렁 열렸어!'], COW, C3, '농장 밭 3줄에 황금유자를 길러 다 익으면');
    if (!(await crowShoot())) throw 0; n++;
    await go(['{happy}자, 내가 보자기로 예쁘게 싸 줄게!', '(끙차끙차 열심히 묶는다)'], RACC, C3, 'wrap');
    { const mk = h('i', { class: 'pq-deco', 'data-nopf': '1', 'data-top': '1' }); await go(['{wow}어이쿠… 내 꼬리까지 같이 묶었네. 이것 좀 잠시 풀어 줄래?', '@{smile}…완전 허당이네.'], RACC, C3, 'wrap2', [], undefined, () => mk); }
    await go(['{happy}이 정도면 바다 건너에서도 향기가 나겠어. 고생했어 황금 폐하!', '{shy}근데… 혹시 우유 필요해?', '@{smile}아니, 괜찮을 거 같아…', '{happy}음메~~~ 외교선물 상자 완성!'], COW, C3);
    // ── 4장 · 감동의 요리 3종
    const C4 = '4장 · 감동의 요리 3종';
    await go(['{smile}핫똑랜드에 가면 폐하가 직접 요리를 대접하는 거야. 그게 진짜 감동이지.', '{smug}중급 물고기 세 마리로 요리 세 가지를 완벽하게 해 와.'], BEAR, C4);
    await goF(['{happy}오이 물회, 손질도 양념도 딱이야!'], BEAR, C4 + ' · 오이 물회', '카피백반에서 중급 물고기로 오이 물회를 완벽하게 만들면');
    await goF(['{wow}매운탕 국물이 끝내주는데?'], BEAR, C4 + ' · 매운탕', '익힘·양념·불 조절을 모두 완벽하게 해서 매운탕을 만들면');
    await goF(['{love}대파 생선구이 냄새 봐…'], BEAR, C4 + ' · 대파 생선구이', '익힘·양념·불 조절을 모두 완벽하게 해서 생선구이를 만들면');
    await go(['(앞치마로 눈물을 훔친다)', '{cry}…합격. 우리는 두두 보유국이다!'], BEAR, C4);
    // ── 5장 · 역사 교육
    const C5 = '5장 · 카피랜드 역사 교육';
    await go(['{smile}그래도 내가 여기서 오래 살았으니, 우리 아빠한테 들은 걸 토대로 역사 교육을 해 주겠네.', '{think}역사를 바로 알아야 핫똑랜드도 안심을 할 거야. 이 얘기를 꼭 잘 기억했다가 핫똑랜드에 알려 줘야 해.'], TURTLE, C5, 'class');
    await go(['{smug}1교시! 300년 전 갈매기 국의 침입을 크게 막은 장군의 이름은 카피맥스웰이었다.', '{smile}이 장군은 핫똑 집성촌 군사들과 아주 유대감이 깊었지.', '{happy}특히 맥스웰 장군이 원반을 던져서 물어 오라고 하면, 강아지 수십 명이 꼬리땐스를 추며 달려가는 게 장관이었다지.', '{smug}갈매기 해적단을 크게 이긴 작전은 이랬네. 갈매기가 육지에 상륙하자마자 원반 80개를 던졌고, 강아지들은 얼떨결에 출격해서 갈매기 군대를 크게 깨뜨렸어.', '{think}이 트라우마로 갈매기 해적단은 그렇게 많은 함선을 갖고도 카피랜드 바닷가에는 얼씬도 못 하는 거란다.', '{smug}특히 원반을 던질 때 가장 앞장서 나가던 전설의 강아지, 진돌카이막이라는 병사가 있었는데…', '{smile}지금 핫똑랜드의 시조 격으로 아주 유명해. 이 이름은 꼭 외워 두게.'], TURTLE, C5, 'class');
    if (!(await quiz(S, C5))) throw 0;
    // ── 6장 · 갈매기 몰래 답장
    const C6 = '6장 · 갈매기 몰래 답장';
    await go(['{happy}자, 이제 다 갖췄어! 마지막으로 답장을 보내야 하는데…', '{think}고급 바다부터 갈매기 정찰병이 깔렸어. 들키면 편지를 뺏겨.'], OCTO, C6);
    if (!(await gullThrow(host))) throw 0; n++;
    await cutins(host, [['img/quest/throw.webp', '휙~!'], ['img/quest/current.webp', '해류를 타고 핫똑랜드로…']]);
    await go(['{smug}(병이 해류를 타고 멀리 떠내려간다)', '{happy}"황금 용사, 곧 갑니다." 이 정도면 충분하지.'], OCTO, C6);
    // ── 피날레
    await passportFx(d);
    await go(['{cry}300년 만에 바다를 건널 여권이 나왔습니다, 폐하…!'], LION, '피날레 · 여권 발급', 'plaza-happy');
    await go(['{think}(혼잣말) …그 일은 바다 건너에서 듣게 되실 겁니다.'], TURTLE, '피날레 · 여권 발급', '', [sub('🛫 카피공항은 보수 중이에요 · 빠른 시일 안에 열려요')]);
    d.showDip && d.showDip(); toast('🎖 가슴에 외교관 배지를 달았어요! (예시판이라 새로고침하면 사라져요)', 4200);
  } catch (e) { if (e !== 0) throw e; toast('예시판을 닫았어요', 1600); }
}

// 무대: 게임 화면 위에 미니게임 한 장면을 띄운다
function stage(host, bg, title, hint) { host.querySelectorAll('.pq').forEach(e => e.remove());
  const el = h('div', { class: 'pq', style: bg ? { backgroundImage: `url(${bg})` } : {} }, h('i', { class: 'vn-ch' }, title), hint && h('p', { class: 'pq-hint' }, hint)); host.append(el); return el; }
const close = (el, res) => v => { el.remove(); res(v); };
const xBtn = done => h('button', { class: 'vn-x vn-quit pq-x', 'aria-label': '퀘스트 취소', onClick: e => { e.stopPropagation(); done(false); } }, '퀘스트 취소');

// 해변 물병 찾기
function findBottle(host) { return new Promise(res => { const el = stage(host, 'img/fl/bg/beach.webp', '🛂 프롤로그 · 해변에서 물병 찾기', '모래사장 어딘가에 반짝이는 게 있어요. 찾아서 눌러요!'), done = close(el, res);
  const b = h('button', { class: 'pq-bottle float', style: { left: 30 + Math.random() * 44 + '%', top: 66 + Math.random() * 16 + '%' }, 'aria-label': '물병', html: '<i class="pq-rip"></i><i class="pq-rip r2"></i><i class="pq-spl"></i><img src="img/quest/bottle.webp" alt="">',
    onClick: e => { e.stopPropagation(); sfx('bigfish'); b.classList.add('got'); setTimeout(() => done(true), 900); } });
  el.append(b, xBtn(done)); }); }

// 꼬리땐스: 뒷모습으로 서서 ◀ ▶ 를 번갈아 빠르게. 누를 때마다 엉덩이(아래쪽 절반)가 그쪽으로 씰룩. 같은 쪽을 연달아 누르면 세지 않는다
function tailDance(host, d) { return new Promise(res => { const el = stage(host, 'img/quest/bg-lot.webp', '🛂 1장 · 꼬리땐스 미션', `◀ ▶ 를 번갈아 빠르게! ${TAIL_SEC}초 안에 ${TAIL_N}번`), done = close(el, res);
  const svg = d.meBack ? d.meBack() : d.meSvg('happy'), body = h('div', { class: 'pq-body', html: svg }), whoosh = h('i', { class: 'pq-wh' });
  const me = h('div', { class: 'pq-me pq-rear' }, body, whoosh), bar = h('u'), cnt = h('b', { class: 'pq-cnt' }), tm = h('em', { class: 'pq-tm' });
  let k = 0, last = '', t0 = 0, raf = 0, over = false, lastHit = 0;
  const draw = () => { bar.style.width = Math.min(100, k / TAIL_N * 100) + '%'; cnt.textContent = `${k} / ${TAIL_N}`; };
  const tick = now => { if (over) return; const left = TAIL_SEC - (performance.now() - t0) / 1000; tm.textContent = t0 ? Math.max(0, left).toFixed(1) + '초' : `${TAIL_SEC}.0초`; me.classList.toggle('hot', performance.now() - lastHit < 260); if (t0 && left <= 0) return end(false); raf = requestAnimationFrame(tick); };
  const hit = dir => { if (over) return; if (!t0) t0 = performance.now(); if (dir === last) return; last = dir; k++; lastHit = performance.now(); me.classList.remove('wl', 'wr'); void me.offsetWidth; me.classList.add(dir === 'l' ? 'wl' : 'wr'); sfx('tock'); draw(); if (k >= TAIL_N) end(true); };
  const end = ok => { over = true; cancelAnimationFrame(raf); window.removeEventListener('keydown', kd); me.classList.remove('hot');
    if (ok) { sfx('bigfish'); me.classList.add('party'); el.append(h('div', { class: 'pq-msg ok' }, '🐕 폐하!!')); setTimeout(() => done(true), 1500); }
    else { sfx('bad'); el.append(h('div', { class: 'pq-msg' }, h('p', null, '🐶 "다시! 형제는 포기하지 않아!"'), h('button', { class: 'btn primary', onClick: e => { e.stopPropagation(); el.remove(); tailDance(host, d).then(res); } }, '다시 하기'))); } };
  const kd = e => { if (e.key === 'ArrowLeft') hit('l'); else if (e.key === 'ArrowRight') hit('r'); }; window.addEventListener('keydown', kd);
  const pad = (dir, t) => h('button', { class: 'pq-pad', onPointerDown: e => { e.preventDefault(); e.stopPropagation(); hit(dir); } }, t);
  el.append(me, h('div', { class: 'pq-gauge' }, bar), h('div', { class: 'pq-row' }, cnt, tm), h('div', { class: 'pq-pads' }, pad('l', '◀'), pad('r', '▶')), xBtn(v => { over = true; window.removeEventListener('keydown', kd); done(v); }));
  draw(); tick(); }); }

// 까마귀 새총: 농장 까마귀 쫓기와 똑같은 새총 놀이(초급). 놓치면 다시
function crowShoot() { return new Promise(res => { const run = () => slingGame(1, { tag: ' · 황금유자를 지켜라', end: (win, { el, crowEl, msg }) => {
    if (win) { crowEl.classList.add('flee'); msg.textContent = '까마귀가 도망갔어요! 황금유자 수확 완료 🍊'; sfx('bigfish'); setTimeout(() => { el.remove(); res(true); }, 1700); }
    else { crowEl.classList.add('grab'); msg.textContent = '놓쳤어요… 다시 해 봐요!'; sfx('bad'); setTimeout(() => { el.remove(); run(); }, 1500); } } }); run(); }); }

// 역사 퀴즈: 거북이 수업에서 들은 내용. 틀리면 다시
const QUIZ = [
  ['300년 전 갈매기 국의 침입을 크게 막은 장군의 이름은?', ['카피맥스웰', '카피나폴레옹', '진돌카이막', '카피세종'], 0],
  ['맥스웰 장군이 강아지들에게 던지던 것은?', ['뼈다귀', '원반', '공', '황금유자'], 1],
  ['갈매기 해적단을 크게 이긴 작전에서 던진 원반은 몇 개?', ['30개', '50개', '80개', '300개'], 2],
  ['원반을 던질 때 가장 앞장서 나가던 전설의 강아지, 지금 핫똑랜드의 시조는?', ['진돌카이막', '카피맥스웰', '멍멍대장', '바둑이'], 0],
  ['갈매기 해적단이 카피랜드 바닷가에 얼씬도 못 하는 까닭은?', ['바다가 너무 차가워서', '원반 작전의 트라우마 때문에', '사자가 무서워서', '물고기가 없어서'], 1]];
async function quiz(S, ch) { let k = 0;
  while (k < QUIZ.length) { const [qq, opts, ans] = QUIZ[k];
    const v = await S([`{smug}${k + 1}번 문제! ${qq}`], 24, `${ch} · 퀴즈 ${k + 1}/${QUIZ.length}`, 'class', [], opts.map((o, i) => ({ label: o, value: 'a' + i, primary: false })));
    if (v == null) return false;
    if (v === 'a' + ans) { sfx('point'); k++; if (k < QUIZ.length) toast('⭕ 정답!', 900); }
    else { sfx('bad'); if ((await S(['{think}흐음… 다시 잘 생각해 보게.'], 24, `${ch} · 오답`, 'class')) == null) return false; } }
  return (await S(['{happy}다 맞혔군! 이제 핫똑랜드에 가서도 부끄럽지 않겠어.'], 24, `${ch} · 합격`, 'class')) != null; }

// 갈매기 몰래 병 던지기: 해적선 망루의 갈매기가 딴 데를 볼 때만 [병 투척]을 꾹 눌러 3초를 채운다
// 딴청(하품) → "흠…?"(고개 갸웃·느낌표 조짐) → 홱 돌아서 망원경으로 이쪽을 본다(빨간 경보·탐조등). 보는 동안 누르고 있으면 들킨다
function gullThrow(host, opt = {}) { return new Promise(res => { const el = stage(host, 'img/fl/bg/sea.webp', '🛂 6장 · 갈매기 몰래 투척', '망루의 갈매기가 딴 데를 볼 때 [병 투척]을 꾹! "흠…?" 하면 바로 손을 떼요'), done = close(el, res);
  const gull = h('img', { class: 'pq-gull', src: 'img/quest/gull-idle.webp', alt: '갈매기 정찰병' }), beam = h('i', { class: 'pq-beam' }), alarm = h('i', { class: 'pq-alarm' });
  const shipW = h('div', { class: 'pq-shipw' }, h('img', { class: 'pq-ship2', src: 'img/quest/ship-q.webp', alt: '해적선' }), gull, beam);
  const say = h('b', { class: 'pq-say' }); shipW.append(say); const bar = h('u'), btn = h('button', { class: 'btn primary pq-hold' }, '🍾 병 투척 (꾹)');
  new Image().src = 'img/quest/gull-look.webp';
  let st = 'back', tSt = performance.now(), dur = 1600, held = false, prog = 0, last = performance.now(), over = false, raf = 0, caught = opt.caught || 0; const lives = h('b', { class: 'pq-cnt pq-lives' }, `🚨 ${caught} / 3`);
  const setSt = s => { st = s; tSt = performance.now(); dur = s === 'back' ? 1400 + Math.random() * 1800 : s === 'hmm' ? 750 : 1400;
    el.dataset.st = s; say.textContent = s === 'hmm' ? '흠…?' : s === 'look' ? '‼ 거기 누구냐!' : ''; say.className = 'pq-say ' + s;
    if (s === 'look') { gull.classList.add('turn'); setTimeout(() => { if (st === 'look') { gull.src = 'img/quest/gull-look.webp'; gull.classList.remove('turn'); gull.classList.add('spot'); } }, 170); sfx('bad'); }
    else if (s === 'back') { gull.classList.remove('spot'); gull.classList.add('turn'); setTimeout(() => { gull.src = 'img/quest/gull-idle.webp'; gull.classList.remove('turn'); }, 170); } };
  const loop = now => { if (over) return; const dt = (now - last) / 1000; last = now;
    if (now - tSt > dur) setSt(st === 'back' ? 'hmm' : st === 'hmm' ? 'look' : 'back');
    if (held) { if (st === 'look') { held = false; prog = 0; btn.classList.remove('on'); caught++; lives.textContent = `🚨 ${caught} / 3`; sfx('bad'); opt.onCaught && opt.onCaught(caught);
        if (caught >= 3) { over = true; el.append(h('div', { class: 'pq-msg' }, h('p', null, '🚨 세 번이나 들켰다!'), h('p', { class: 'pq-msg-s' }, '갈매기 경계가 삼엄해졌어요. 내일 다시 도전해요'), opt.real ? h('button', { class: 'btn primary', onClick: e => { e.stopPropagation(); el.remove(); res(false); } }, '확인') : [h('small', { class: 'pq-msg-t' }, '🧪 예시판이라 바로 다시 해 볼 수 있어요'), h('button', { class: 'btn primary', onClick: e => { e.stopPropagation(); el.remove(); gullThrow(host).then(res); } }, '다시 하기')])); return; }
        toast(`🚨 들켰다! 처음부터 (${caught}/3)`, 1200); } else prog += dt / 3; }
    bar.style.width = Math.min(100, prog * 100) + '%';
    if (prog >= 1) { over = true; sfx('bigfish'); return setTimeout(() => done(true), 300); }
    raf = requestAnimationFrame(loop); };
  const down = e => { e.preventDefault(); e.stopPropagation(); if (over) return; if (st === 'look') { sfx('bad'); toast('지금은 보고 있어요!', 900); return; } held = true; btn.classList.add('on'); };
  const up = () => { held = false; btn.classList.remove('on'); };
  btn.addEventListener('pointerdown', down); btn.addEventListener('pointerup', up); btn.addEventListener('pointerleave', up); btn.addEventListener('pointercancel', up);
  el.append(alarm, shipW, h('div', { class: 'pq-row top' }, lives), h('div', { class: 'pq-gauge low' }, bar), btn, xBtn(v => { over = true; cancelAnimationFrame(raf); done(v); })); setSt('back'); raf = requestAnimationFrame(loop); }); }

// 컷신: 그림을 한 장씩 천천히 다가가며 보여 준다(누르면 다음)
function cutins(host, list) { return list.reduce((p, [src, cap]) => p.then(() => new Promise(res => {
  const el = h('div', { class: 'pq pq-cut' }, h('img', { class: 'pq-cutimg', src, alt: '' }), h('p', { class: 'pq-cap' }, cap)); host.append(el); sfx('tock');
  let gone = false; const go = () => { if (gone) return; gone = true; el.classList.add('out'); setTimeout(() => { el.remove(); res(); }, 280); };
  setTimeout(go, 2600); el.addEventListener('pointerdown', e => { e.stopPropagation(); go(); }); })), Promise.resolve()); }

// 여권 발급 연출: 화면을 덮고(아래 화면은 숨김) 여권이 돌며 나타나 펼쳐지고, 도장이 쾅 → 외교관 배지가 날아와 가슴에 착. 확인은 그 뒤에
function passportFx(d) { return new Promise(res => { const app = document.getElementById('app'); if (app) app.style.visibility = 'hidden';
  const conf = h('div', { class: 'pfx-conf' }); for (let i = 0; i < 46; i++) conf.append(h('i', { style: { left: Math.random() * 100 + '%', animationDelay: (1.6 + Math.random() * 1.6).toFixed(2) + 's', animationDuration: (2.2 + Math.random() * 1.8).toFixed(2) + 's', background: ['#FFD54A', '#FFF3B0', '#FF8FB1', '#9BE1FF', '#FFB347'][i % 5] } }));
  const page = h('div', { class: 'pp-page' }, h('div', { class: 'pp-photo', html: d.meSvg('smile') }, h('img', { class: 'pp-pin', src: 'img/quest/badge.webp', alt: '' })),
    h('dl', null, h('dt', null, '이름'), h('dd', null, d.meName), h('dt', null, '국적'), h('dd', null, '카피랜드'), h('dt', null, '직위'), h('dd', null, '카피황금폐하'), h('dt', null, '자격'), h('dd', null, '외교관')),
    h('div', { class: 'pp-stamp' }, h('b', null, '外交官'), h('small', null, 'KAPYLAND')));
  const badge = h('div', { class: 'pp-badge' }, h('i', { class: 'pp-shine' }), h('img', { src: 'img/quest/badge.webp', alt: '외교관 배지' }), h('p', null, '🎖 외교관 배지 획득!'), h('small', null, '가슴에 달았어요'));
  const ok = h('button', { class: 'btn primary pp-ok' }, '확인');
  const el = h('div', { class: 'ppfx' }, h('div', { class: 'pp-rays' }), conf, h('img', { class: 'pp-cover', src: 'img/quest/passport.webp', alt: '' }), page, h('p', { class: 'pp-title' }, '🛂 카피랜드 여권 발급!'), badge);
  document.body.append(el); sfx('fanfare'); setTimeout(() => sfx('boom'), 2300); setTimeout(() => sfx('coin'), 2500); setTimeout(() => sfx('fanfare'), 3900); setTimeout(() => sfx('point'), 5600);
  setTimeout(() => { el.append(ok); ok.onclick = () => { el.remove(); if (app) app.style.visibility = ''; res(true); }; }, 6600); }); }

// ───────────── 진짜 퀘스트 ─────────────
// 황금 장비 여섯 개를 다 두르면 시작. 단계(s)와 미션 진행은 passq/<uid> 에 저장한다
// s: 0 시작 전(프롤로그~꼬리땐스) · 1 희귀 물고기 3마리 · 2 황금유자 3줄 · 3 요리 3종 · 4 고급 바다 답장 · 5 끝
export const PP_COOK = [['mulhoe', '오이 물회'], ['maeun', '매운탕'], ['gui', '대파 생선구이']];
export function createPassQuest(q, d) {
  const ref = 'passq/' + d.uid; let st = {}, ready = false, busy = false;
  const off = d.store.on(ref, v => { st = v || {}; ready = true; d.changed && d.changed(); });
  const save = patch => { st = { ...st, ...patch }; d.changed && d.changed(); return d.store.update(ref, patch).catch(() => {}); };
  const S = (lines, who, ch, bg, extra, buttons, deco) => q.scene(lines, who, `🛂 ${ch}`, extra, buttons, bg, deco);
  const sub = t => h('p', { class: 'vn-sub' }, t);
  const go = async (...a) => { const v = await S(...a); if (v == null) throw 0; return v; };
  const card = (src, cls) => { const el = h('img', { class: 'pq-deco ' + cls, src, alt: '' }); return () => el; };
  const s = () => st.s || 0, eligible = () => d.golds() >= 6, started = () => st.s != null, done = () => s() >= 5;
  const cookDone = () => PP_COOK.filter(([k]) => (st.ck || {})[k]).length;
  const gTries = () => (st.gday === d.ymd() ? st.gfail || 0 : 0);
  const ready2 = () => (s() === 1 ? (st.fish || 0) >= 3 : s() === 2 ? (st.yuzu || 0) >= 3 : s() === 3 ? cookDone() >= 3 : false); // 미션을 다 채워 이야기를 이어 갈 수 있음
  const visible = () => ready && (started() || eligible());
  const mark = () => (!visible() ? '' : done() ? '' : !started() || ready2() ? '!' : '…');
  const goal = () => s() === 1 ? `🎣 중급 바다 희귀 물고기 ${Math.min(3, st.fish || 0)} / 3마리` : s() === 2 ? `🍊 농장에서 황금유자 이랑 ${Math.min(3, st.yuzu || 0)} / 3줄 수확` : s() === 3 ? `🍳 카피백반에서 요리 완벽하게 ${cookDone()} / 3 (${PP_COOK.map(([k, n]) => ((st.ck || {})[k] ? '✔' : '·') + n).join(' ')})` : s() === 4 ? (gTries() >= 3 ? '🌙 오늘은 세 번 들켰어요 · 내일 고급 바다에서 다시' : '⛵ 배를 타고 고급 바다에서 낚시를 시작하면 갈매기 몰래 답장 던지기') : '';
  function preload() { ['bg-lot', 'bg-wrap', 'bg-wrap2', 'bg-class', 'bg-plaza-happy', 'letter', 'dog-bark', 'bottle', 'throw', 'current', 'gull-idle', 'gull-look', 'ship-q', 'badge', 'passport'].forEach(n => { new Image().src = `img/quest/${n}.webp`; }); new Image().src = 'img/fl/a0-back.webp'; }
  async function run(fn) { if (busy) return; const host = d.host(); if (!host) return; busy = true; preload(); try { await fn(host); } catch (e) { if (e !== 0) throw e; toast('퀘스트를 멈췄어요 · 🛂 버튼으로 이어서 할 수 있어요', 2400); } finally { busy = false; d.changed && d.changed(); } }
  const statusLine = (who, ch, line) => S([line], who, ch, '', [h('div', { class: 'qw-goal' }, h('b', null, '목표'), h('span', null, goal()))]);
  // 🛂 버튼·자동 시작
  function open() { if (!ready) return; if (!started() && !eligible()) return toast('황금 장비 여섯 개를 모두 두르면 시작돼요', 2200);
    if (done()) return run(() => S(['{happy}폐하의 여권은 준비 완료! 카피공항이 열리면 바로 떠나시지요.'], LION, '여권 발급 완료', '', [sub('🛫 카피공항은 보수 중이에요 · 빠른 시일 안에 열려요')]));
    return run(async host => { const k = s();
      if (k === 0) return seg0(host);
      if (k === 1) return (st.fish || 0) >= 3 ? seg1() : statusLine(PIG, '2장 · 고급 입맛', '{think}중급 바다에서 희귀한 녀석으로 세 마리! 잡은 물고기는 그대로 가져도 돼, 확인만 할게.');
      if (k === 2) return (st.yuzu || 0) >= 3 ? seg2() : statusLine(COW, '3장 · 외교선물 황금유자', '{smile}농장에 황금유자를 심어서 이랑 세 줄을 다 거둬 와. 까마귀 조심하고!');
      if (k === 3) return cookDone() >= 3 ? seg3() : statusLine(BEAR, '4장 · 감동의 요리 3종', '{smug}카피백반 로비에 🔍 퀘스트 요리가 떠 있을 거야. 익힘·양념·불까지 완벽하게!');
      if (k === 4) return statusLine(OCTO, '6장 · 갈매기 몰래 답장', gTries() >= 3 ? '{sad}오늘은 갈매기들 눈이 시뻘게. 내일 다시 가자.' : '{think}배를 타고 고급 바다로 나가서 낚싯대를 드리우면, 그때 몰래 던지는 거야.'); }); }
  function auto() { if (!ready || started() || !eligible() || busy) return false; open(); return true; }
  // 프롤로그 ~ 1장 꼬리땐스 ~ 2장 부탁
  async function seg0(host) { const P = '프롤로그 · 바다에서 온 편지';
    await go(['{wow}폐, 폐하! 황금 장비 여섯 개를 두르시니 눈이 부셔서 못 보겠사옵니다!', '{think}그런데 바닷가에 뭔가 반짝이는 게 떠밀려 왔다는구먼요.', '{smile}가 보시지요!'], LION, P);
    if (!(await findBottle(host))) throw 0;
    await go(['{think}어디 보자… 발도장이 찍혀 있군. 핫똑랜드에서 온 편지일세.', '{smug}"황금 전사가 탄생했다는 소문이 바다 건너까지 들립니다. 진짜입니까? 진짜라면 꼭 와 주십시오. — 핫똑랜드 일동 (멍)"'], OWL, P, '', [], undefined, card('img/quest/letter.webp', 'letter'));
    await go(['{think}고급 바다부터는 갈맥 해적단 패악질 때문에 위험해.', '{smug}우리를 보증해 줄 황금 용사가 직접 가는 게 제일 확실하지.', '{smile}그러려면 여권이 필요하고… 가기 전에 준비할 게 산더미야!'], OCTO, P);
    const C1 = '1장 · 형제의 꼬리땐스';
    await go(['{smile}핫똑랜드랑 친해지려면 땐스를 배워야 해.', '{happy}강아지한테는 형제애를 느끼는 아주 중요한 땐스거든.', '{shy}근데… 이건 아무한테나 보여 주는 게 아닌데.'], DOG, C1);
    await go(['{think}(두리번두리번)', '{shy}…따라와.'], DOG, C1);
    await go(['{shy}여기라면 아무도 없겠지.', '(휘이잉… 바람에 덤불 하나가 굴러간다)', '{think}…', '{happy}(갑자기 꼬리를 미친 듯이 좌우로 흔든다! 엉덩이까지 같이 흔들린다!)', '{smug}…봤지? 이게 꼬리 땐스야.'], DOG, C1, 'lot', [], undefined, (() => { const dd = h('div', { class: 'pq-deco dogdance', 'data-nopf': '1' }, h('img', { src: 'img/fl/a0-back.webp', alt: '' }), h('i', { class: 'pq-wh' })); return k => (k >= 3 ? dd : null); })());
    if (!(await tailDance(host, d))) throw 0;
    { const bark = h('img', { class: 'pq-deco bark', src: 'img/quest/dog-bark.webp', alt: '', 'data-nopf': '1' }); await go(['{cry}멍멍 멍멍!! (강아지 방언)', '{shy}할아버지랑 해 보고서… 오랜만에 해 봐.'], DOG, C1, 'lot', [], undefined, k => (k === 0 ? bark : null)); }
    await go(['{smug}핫똑랜드 녀석들 입이 아주 고급이야.', '{think}평범한 생선 들고 가면 코웃음 친다고.', '{smile}중급 바다에서 희귀한 녀석으로 세 마리 잡아 와. 잡은 건 네가 가져도 돼, 확인만 할게.'], PIG, '2장 · 고급 입맛');
    await save({ s: 1, fish: 0 }); sfx('point'); toast('🛂 다음 목표 · 중급 바다에서 희귀 물고기 3마리', 3200); }
  async function seg1() { const C2 = '2장 · 고급 입맛';
    await go(['{think}음, 나쁘지 않네.', '{love}오, 이건 좀 땡기는데? (침 줄줄)', '{wow}이거다! 이거면 강아지들 방언 터진다!', '{happy}강아지 방언 들어 본 적 있어? 나도 한번 만들어 보고 싶다.'], PIG, C2);
    const eat = await go(['{shy}한 마리만 맛보면 안 될까…?'], PIG, C2, '', [], [{ label: '안 돼', value: 'no' }, { label: '그래, 먹어', value: 'yes', primary: true }]);
    if (eat === 'no') await go(['{sad}아… 역시 안 되겠지?'], PIG, C2);
    else await go(['{smug}농담이야! 외교 물품은 손대면 안 되지.', '{smug}너는 황금 폐하잖아! 식욕을 절제하고 체통을 지켜야 해.', '@{sad}(……)'], PIG, C2);
    await go(['{smile}외교선물엔 뭐니 뭐니 해도 황금유자지. 300년 전에도 장터에서 제일 귀했던 과일이야.', '{think}근데 키우기도 힘들고… 까마귀 악당을 조심해야 해.', '{smile}농장에 황금유자를 심어서 이랑 세 줄을 다 거둬 와.'], COW, '3장 · 외교선물 황금유자');
    await save({ s: 2, yuzu: 0 }); sfx('point'); toast('🛂 다음 목표 · 황금유자 이랑 3줄 수확', 3200); }
  async function seg2() { const C3 = '3장 · 외교선물 황금유자';
    await go(['{happy}황금유자가 주렁주렁 열렸어!', '{wow}앗, 저기! 까마귀가 노리고 있어!'], COW, C3);
    if (!(await crowShoot())) throw 0;
    await go(['{happy}자, 내가 보자기로 예쁘게 싸 줄게!', '(끙차끙차 열심히 묶는다)'], RACC, C3, 'wrap');
    { const mk = h('i', { class: 'pq-deco', 'data-nopf': '1', 'data-top': '1' }); await go(['{wow}어이쿠… 내 꼬리까지 같이 묶었네. 이것 좀 잠시 풀어 줄래?', '@{smile}…완전 허당이네.'], RACC, C3, 'wrap2', [], undefined, () => mk); }
    await go(['{happy}이 정도면 바다 건너에서도 향기가 나겠어. 고생했어 황금 폐하!', '{shy}근데… 혹시 우유 필요해?', '@{smile}아니, 괜찮을 거 같아…', '{happy}음메~~~ 외교선물 상자 완성!'], COW, C3);
    await go(['{smile}핫똑랜드에 가면 폐하가 직접 요리를 대접하는 거야. 그게 진짜 감동이지.', '{smug}중급 물고기로 오이 물회·매운탕·대파 생선구이, 세 가지를 완벽하게 해 와.', '{think}카피백반 로비에 🔍 퀘스트 요리로 올려 둘게.'], BEAR, '4장 · 감동의 요리 3종');
    await save({ s: 3, ck: {} }); sfx('point'); toast('🛂 다음 목표 · 카피백반 퀘스트 요리 3종', 3200); }
  async function seg3() { const C4 = '4장 · 감동의 요리 3종';
    await go(['{happy}오이 물회, 손질도 양념도 딱이야!', '{wow}매운탕 국물이 끝내주는데?', '{love}대파 생선구이 냄새 봐…', '(앞치마로 눈물을 훔친다)', '{cry}…합격. 우리는 두두 보유국이다!'], BEAR, C4);
    const C5 = '5장 · 카피랜드 역사 교육';
    await go(['{smile}그래도 내가 여기서 오래 살았으니, 우리 아빠한테 들은 걸 토대로 역사 교육을 해 주겠네.', '{think}역사를 바로 알아야 핫똑랜드도 안심을 할 거야. 이 얘기를 꼭 잘 기억했다가 핫똑랜드에 알려 줘야 해.'], TURTLE, C5, 'class');
    await go(['{smug}1교시! 300년 전 갈매기 국의 침입을 크게 막은 장군의 이름은 카피맥스웰이었다.', '{smile}이 장군은 핫똑 집성촌 군사들과 아주 유대감이 깊었지.', '{happy}특히 맥스웰 장군이 원반을 던져서 물어 오라고 하면, 강아지 수십 명이 꼬리땐스를 추며 달려가는 게 장관이었다지.', '{smug}갈매기 해적단을 크게 이긴 작전은 이랬네. 갈매기가 육지에 상륙하자마자 원반 80개를 던졌고, 강아지들은 얼떨결에 출격해서 갈매기 군대를 크게 깨뜨렸어.', '{think}이 트라우마로 갈매기 해적단은 그렇게 많은 함선을 갖고도 카피랜드 바닷가에는 얼씬도 못 하는 거란다.', '{smug}특히 원반을 던질 때 가장 앞장서 나가던 전설의 강아지, 진돌카이막이라는 병사가 있었는데…', '{smile}지금 핫똑랜드의 시조 격으로 아주 유명해. 이 이름은 꼭 외워 두게.'], TURTLE, C5, 'class');
    if (!(await quiz(S, C5))) throw 0;
    await go(['{happy}자, 이제 다 갖췄어! 마지막으로 답장을 보내야 하는데…', '{think}고급 바다부터 갈매기 정찰병이 깔렸어. 들키면 편지를 뺏겨.', '{smile}배를 타고 고급 바다로 나가서 낚싯대를 드리우면, 그때 몰래 던지는 거야. 세 번 들키면 그날은 끝!'], OCTO, '6장 · 갈매기 몰래 답장');
    await save({ s: 4 }); sfx('point'); toast('🛂 다음 목표 · 고급 바다에서 갈매기 몰래 답장 던지기', 3200); }
  // 고급 바다에서 낚시를 시작하려 할 때 부른다: 답장 차례면 먼저 갈매기 몰래 던지기
  function beforeFish(zone) { if (!ready || s() !== 4 || zone !== 3 || busy || gTries() >= 3) return Promise.resolve(); return run(gullNow); }
  async function gullNow(host) { const ok = await gullThrow(host, { real: true, caught: gTries(), onCaught: n => { save({ gday: d.ymd(), gfail: n }); } });
      if (!ok) { if (gTries() >= 3) toast('🌙 오늘은 갈매기 경계가 삼엄해요 · 내일 다시 도전!', 3000); return; }
      await cutins(host, [['img/quest/throw.webp', '휙~!'], ['img/quest/current.webp', '해류를 타고 핫똑랜드로…']]);
      await S(['{smug}(병이 해류를 타고 멀리 떠내려간다)', '{happy}"황금 용사, 곧 갑니다." 이 정도면 충분하지.'], OCTO, '6장 · 갈매기 몰래 답장');
      await finish(); }
  async function finish() { await d.reward(); await save({ s: 5, at: Date.now() });
    await passportFx({ ...d, meSvg: f => d.meSvg(f) });
    await S(['{cry}300년 만에 바다를 건널 여권이 나왔습니다, 폐하…!'], LION, '피날레 · 여권 발급', 'plaza-happy');
    await S(['{think}(혼잣말) …그 일은 바다 건너에서 듣게 되실 겁니다.'], TURTLE, '피날레 · 여권 발급', '', [sub('🛫 카피공항은 보수 중이에요 · 빠른 시일 안에 열려요')]);
    modal({ title: '🛂 여권 퀘스트 보상', body: [h('div', { class: 'rw-pop' }, ...[['🛂', '카피랜드 여권', '가방에 넣었어요 · 카피공항 입장권'], ['🎖', '외교관 배지', '가슴에 달았어요'], ['🎫', '첫 비행 무료 항공권 1장', '카피공항이 열리는 날 바로 써요']].map(([ic, t, sb]) => h('div', { class: 'rw-it' }, h('span', null, ic), h('div', null, h('b', null, t), h('small', null, sb)))))], actions: [{ label: '고마워요!', primary: true }] }); }
  // 미션 진행을 세는 곳(친목회가 부른다)
  function onFish(id) { if (!ready || s() !== 1 || (st.fish || 0) >= 3) return; const f = FISH.find(x => x.id === id); if (!f || f.z !== 2 || (f.tier || 1) < 3) return;
    const n = (st.fish || 0) + 1; save({ fish: n }); toast(n >= 3 ? '🛂 희귀 물고기 3마리! 🛂 버튼을 눌러 돼지에게 보여 줘요' : `🛂 희귀 물고기 ${n} / 3`, 2600); }
  function onRow(c, g) { if (!ready || s() !== 2 || c !== 'yuzu' || g === 'F' || (st.yuzu || 0) >= 3) return; const n = (st.yuzu || 0) + 1; save({ yuzu: n }); toast(n >= 3 ? '🛂 황금유자 3줄 수확! 🛂 버튼을 눌러 소에게 가요' : `🛂 황금유자 이랑 ${n} / 3줄`, 2600); }
  const cooks = () => (ready && s() === 3 ? PP_COOK.filter(([k]) => !(st.ck || {})[k]).map(([k]) => ({ q: 'pp-' + k, i: BEAR, rec: k })) : []);
  function cooked(qk) { const k = String(qk).slice(3); if (!ready || s() !== 3) return; const ck = { ...(st.ck || {}), [k]: 1 }; save({ ck }); const n = PP_COOK.filter(([x]) => ck[x]).length; toast(n >= 3 ? '🛂 요리 3종 완성! 🛂 버튼을 눌러 곰에게 가요' : `🛂 퀘스트 요리 ${n} / 3`, 2600); }
  const wantGull = () => ready && s() === 4 && gTries() < 3 && !busy;
  return { open, auto, mark, visible, goal, onFish, onRow, cooks, cooked, beforeFish, wantGull, done, ping: () => d.changed && d.changed(), dispose: () => off && off() };
}
