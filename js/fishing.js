// 바닷가 낚시 — 카피바라들의 주요 경제활동. 낚시터는 배를 타야만 갈 수 있고, 초급·중급·고급 세 구역으로 나뉜다
// 던지기(힘 조절) → 입질 기다리기 → 챔질 → 밀고 당기기(줄 팽팽함을 조절하며 감기). 물고기는 클수록 값이 나간다
import { h, toast, holdBtn, ask, modal } from './ui.js';
import { capy } from './capy.js';
import { sfx } from './sound.js';
import { gullSvg } from './animals.js';
import { FLUFFY, shipImg } from './fluffy.js';

export const PIRATE_EVERY = 10, PIRATE_LOOT = 600, FLEE_FEE = 250, BOAT_FIX = 1500, CBOAT_FIX = 300, CBOAT_HIT = 10, PIRATE_HIT = 10; // 흰 배 수리 1500 · 카피보트 수리 300 · 풍랑 한 번에 타고 있는 배 내구도 -10 · 해적선 포탄에 맞을 때마다 -10
export const ZONES = ['', '초급 낚시터', '중급 낚시터', '고급 낚시터'];
export const RODS = [null, { t: 1, name: '초급 낚싯대', price: 500, dur: 50, fix: 150 }, { t: 2, name: '중급 낚싯대', price: 1500, dur: 100, fix: 450 }, { t: 3, name: '고급 낚싯대', price: 4000, dur: 200, fix: 1000 }];
// 미끼: 바다마다 따로(초급 1개 10코인 · 중급 10개 300코인 · 고급 10개 600코인). 색으로 구분(분홍·파랑·금색)
export const BAIT2 = 30, BAIT3 = 60, BAIT_KEY = ['', 'bait', 'bait2', 'bait3'], BAIT_NAME = ['', '미끼', '중급 미끼', '고급 미끼'];
const BAIT_COL = [null, ['#F28BA8', '#B4466A'], ['#5EB8FF', '#1E5E92'], ['#FFD24A', '#B07A00']];
export const baitIc = t => { const [f, d] = BAIT_COL[t] || BAIT_COL[1]; return `<svg viewBox="0 0 48 48"><path d="M10 34 C4 26 12 18 20 22 C28 26 32 14 40 18 C46 21 44 30 38 30" fill="none" stroke="${d}" stroke-width="11" stroke-linecap="round"/><path d="M10 34 C4 26 12 18 20 22 C28 26 32 14 40 18 C46 21 44 30 38 30" fill="none" stroke="${f}" stroke-width="7.5" stroke-linecap="round"/><path d="M15 22 v6 M22 22.5 v6 M29 19 v6 M35 16.5 v6" stroke="${d}" stroke-width="1.6" stroke-linecap="round" opacity=".6"/><circle cx="38.5" cy="29" r="1.6" fill="#3A2210"/>${t === 3 ? '<path d="M41 8 l1.4 3 3 1.4 -3 1.4 -1.4 3 -1.4 -3 -3 -1.4 3 -1.4z" fill="#FFF3B0"/>' : ''}</svg>`; };
export const BAIT = 10, BALL = 50, CANNON = 1500, CANNON2 = 3500, WBOAT = 3000, PEARL_PRICE = 50000, PEARL_P = 0.002; // 진주: 고급 바다에서 던질 때마다 0.2% · 진주부적(3장)을 쓰면 10번 안에 한 번 걸리고 90%로 낚는다

// 물고기 80종: [이름, 최소cm, 최대cm, 최소값, 최대값, 표시(r=귀한 것, k=대장)]
// 값은 가게 시세에 맞췄다(옷 한 벌 200~310, 게임 한 판 50쯤, 한 번 던지는 데 미끼·낚싯대 값 13쯤): 초급 평균 85, 중급 165, 고급 300쯤
const Z1 = [['방울붕어', 6, 14, 45, 95], ['젤리멸치', 4, 9, 45, 80], ['솜사탕돔', 10, 22, 70, 140], ['별사탕피라미', 5, 11, 45, 90], ['무지개송사리', 3, 7, 45, 80], ['딸기망둥어', 7, 15, 50, 105], ['민트정어리', 9, 18, 50, 115], ['콩알복어', 5, 12, 60, 130], ['달빛은어', 12, 24, 75, 160],
  ['호두쥐치', 9, 19, 60, 130], ['레몬전어', 10, 20, 60, 120], ['꼬마해마치', 4, 10, 70, 150], ['구름빙어', 6, 13, 45, 95], ['단추가자미', 11, 23, 75, 160], ['유자고등어', 14, 28, 80, 175], ['솜털아귀', 8, 17, 70, 150], ['깨소금멸치', 3, 8, 45, 70], ['풍선개복치', 13, 26, 80, 175],
  ['조약돌망둑', 6, 12, 45, 90], ['물방울청어', 10, 21, 60, 130], ['꿀벌자리돔', 7, 14, 60, 120], ['도토리복어', 6, 13, 60, 120], ['우유갈치', 16, 30, 80, 175], ['초코미꾸리', 8, 16, 50, 105], ['반딧불전갱이', 11, 22, 75, 165]];
const Z2 = [['줄무늬방어', 30, 60, 85, 220], ['얼음연어', 35, 70, 105, 255], ['산호농어', 28, 55, 75, 205], ['호박민어', 32, 66, 95, 240], ['모래넙치', 26, 52, 65, 185], ['바람삼치', 34, 72, 105, 270], ['은하고등어', 25, 48, 65, 170], ['대나무장어', 40, 90, 115, 290], ['솔방울쏨뱅이', 22, 44, 65, 180], ['노을도미', 28, 58, 95, 255],
  ['파도숭어', 30, 62, 75, 205], ['안개대구', 36, 78, 115, 300], ['진흙메기', 30, 68, 85, 230], ['유리날치', 24, 46, 75, 195], ['가시복어', 20, 42, 85, 240], ['보라우럭', 26, 54, 85, 220], ['쌍무지개놀래기', 22, 46, 95, 255], ['나팔고기', 30, 64, 75, 210], ['꽃무늬쥐가오리', 45, 95, 135, 325], ['북소리민어', 34, 70, 105, 280],
  ['번개참치', 60, 120, 330, 420, 'r'], ['황금잉어', 50, 100, 330, 420, 'r'], ['수정돛새치', 70, 140, 340, 420, 'r'], ['달무리가오리', 65, 130, 330, 410, 'r'], ['불꽃도미', 48, 96, 330, 420, 'r']];
const Z3 = [['심해등불아귀', 70, 140, 190, 400], ['용비늘장어', 110, 220, 210, 450], ['천둥청새치', 130, 260, 230, 500], ['유령가오리', 120, 240, 210, 475], ['강철참치', 120, 230, 230, 500], ['화산돔', 80, 150, 190, 400], ['얼음이빨상어', 140, 280, 250, 500], ['왕관개복치', 150, 300, 230, 500], ['그림자곰치', 100, 200, 190, 425], ['별똥철갑상어', 130, 270, 230, 500],
  ['은빛리본갈치', 140, 300, 210, 450], ['폭풍돛새치', 150, 290, 250, 500], ['망치머리대왕', 140, 270, 230, 490], ['크리스탈해룡', 90, 180, 210, 475], ['흑진주농어', 80, 160, 190, 410], ['불가사리왕도미', 75, 150, 190, 400], ['번개뱀장어', 120, 250, 210, 450], ['해골복어', 60, 120, 190, 390], ['무쇠턱바라쿠다', 110, 210, 210, 460], ['달그림자만새기', 100, 200, 200, 440],
  ['거대산갈치', 200, 400, 250, 500], ['용암쏠배감펭', 70, 140, 195, 410], ['톱날상어', 150, 300, 250, 500], ['안개고래치', 180, 340, 250, 500], ['황금비늘피라루쿠', 160, 320, 250, 500], ['심연먹물치', 90, 190, 195, 430], ['천년잉어', 100, 200, 210, 475], ['오로라만타', 180, 360, 250, 500],
  ['고래킹', 500, 900, 900, 1000, 'k'], ['상어킹', 380, 650, 900, 1000, 'k']];
// 상상의 물고기 추가분(구역마다 30종). 뒤에 붙여서 원래 물고기 번호(도감)는 그대로다
Z1.push(...[['마카롱복어', 5, 11, 50, 110], ['푸딩망둥어', 6, 13, 50, 115], ['감귤송사리', 3, 8, 45, 80], ['체리피라미', 4, 9, 45, 85], ['솜방망이빙어', 5, 12, 50, 105], ['카라멜쥐치', 9, 19, 60, 135], ['팝콘멸치', 3, 7, 45, 75], ['바닐라가자미', 11, 22, 70, 150], ['쿠키돔', 10, 21, 65, 145], ['민트초코붕어', 7, 15, 55, 120], ['구슬전갱이', 8, 17, 55, 125], ['리본해마', 4, 10, 65, 145], ['비눗방울복어', 6, 12, 60, 130], ['포도알청어', 8, 16, 55, 120], ['무지개젤리고기', 5, 11, 50, 115], ['꽃잎놀래기', 7, 14, 55, 120], ['보리차가자미', 12, 24, 75, 160], ['꼬마고래고기', 14, 28, 80, 175], ['토끼귀쏨뱅이', 8, 17, 60, 130], ['딸기우유정어리', 9, 18, 55, 125], ['연두콩멸치', 3, 8, 45, 75], ['구름마시멜로돔', 11, 23, 70, 155], ['별가루송사리', 3, 7, 45, 80], ['호박엿고등어', 13, 27, 80, 170], ['몽글몽글개복치', 12, 25, 75, 165], ['단팥붕어빵고기', 10, 20, 65, 145], ['하늘색우럭', 9, 19, 60, 135], ['솔잎갈치', 15, 30, 80, 175], ['방긋자리돔', 6, 13, 55, 115], ['조개껍질빙어', 5, 11, 50, 105]]);
Z2.push(...[['파란불꽃방어', 30, 62, 85, 230], ['은방울연어', 34, 70, 100, 255], ['해바라기농어', 28, 56, 80, 210], ['청록비늘민어', 32, 66, 95, 240], ['갈대넙치', 26, 52, 70, 190], ['회오리삼치', 34, 74, 105, 275], ['밤하늘고등어', 25, 50, 70, 180], ['자개장어', 40, 92, 115, 295], ['바위솔쏨뱅이', 22, 46, 65, 180], ['단풍도미', 28, 58, 95, 255], ['물보라숭어', 30, 64, 80, 210], ['새벽대구', 36, 78, 110, 295], ['해초메기', 30, 68, 85, 230], ['비단날치', 24, 48, 75, 200], ['밤송이복어', 20, 42, 85, 240], ['노랑우럭', 26, 54, 85, 220], ['꽃게놀래기', 22, 46, 90, 250], ['피리고기', 30, 62, 75, 210], ['구름무늬가오리', 44, 94, 130, 320], ['장구민어', 34, 70, 100, 275], ['석양방어', 32, 66, 90, 235], ['진주빛연어', 36, 72, 105, 260], ['소용돌이참돔', 30, 60, 95, 250], ['은행잎넙치', 26, 50, 70, 195], ['파도소리고등어', 26, 52, 70, 185], ['초승달갈치', 40, 88, 110, 285], ['얼룩말쥐치', 24, 48, 75, 205], ['물안개숭어', 30, 62, 80, 215], ['청자빛도미', 28, 58, 100, 265], ['반딧불이장어', 38, 86, 115, 300]]);
Z3.push(...[['별빛낚시아귀', 70, 140, 190, 400], ['산호뿔장어', 110, 230, 215, 460], ['유성황새치', 130, 260, 235, 500], ['그믐가오리', 120, 240, 210, 470], ['청동방어왕', 120, 230, 230, 495], ['열수구도미', 80, 150, 195, 410], ['서리지느러미상어', 140, 280, 250, 500], ['거품개복치', 150, 300, 230, 495], ['얼룩무늬곰치', 100, 200, 195, 430], ['은하뿔상어', 130, 270, 230, 500], ['깃털갈치', 140, 300, 215, 455], ['돌개바람돛고기', 150, 290, 250, 500], ['도끼머리상어', 140, 270, 230, 490], ['수정나비고기', 90, 180, 210, 470], ['흑요석우럭', 80, 160, 195, 415], ['성게왕도치', 75, 150, 190, 405], ['천둥바다뱀', 120, 250, 210, 455], ['가면쏨뱅이', 60, 120, 190, 395], ['창날꼬치고기', 110, 210, 215, 465], ['월식참치', 100, 200, 200, 445], ['심해긴꼬리고기', 200, 400, 250, 500], ['마그마복어', 70, 140, 195, 415], ['고래상어왕', 150, 300, 250, 500], ['빙하고래', 180, 340, 250, 500], ['흑철갑피라냐왕', 100, 200, 210, 460], ['먹구름오징어치', 90, 190, 195, 430], ['심해등대잉어', 100, 200, 210, 470], ['별자리만타', 180, 360, 250, 500], ['유령해파리고기', 80, 170, 200, 440], ['쇄빙상어', 140, 280, 245, 500]]);
// 2026-11-21 추가분(중급 20종·고급 30종): 급을 따로 정해 두어 원래 물고기들의 급·값·이로치는 그대로다
Z2.push(...[['무지개방어', 30, 62, 85, 230, '', 1], ['꽃잎가자미', 26, 52, 70, 195, '', 1], ['솜사탕복어', 20, 42, 85, 240, '', 2], ['별사탕쏨뱅이', 22, 46, 65, 185, '', 1], ['오로라연어', 36, 72, 105, 265, '', 2], ['호박엿장어', 40, 90, 115, 295, '', 1], ['유리구슬해마', 18, 36, 90, 250, '', 3], ['레몬줄돔', 28, 58, 95, 255, '', 1], ['은방패쥐치', 24, 48, 75, 205, '', 2], ['모래시계민어', 32, 66, 95, 245, '', 1], ['등대불빛참돔', 30, 60, 100, 260, '', 2], ['비취날치', 24, 50, 80, 210, '', 1], ['구름빵숭어', 30, 62, 80, 215, '', 1], ['은하수가오리', 44, 96, 130, 325, '', 3], ['리본돌돔', 28, 56, 90, 240, '', 2], ['바다딸기우럭', 26, 54, 85, 225, '', 2], ['종이배넙치', 26, 50, 70, 195, '', 1], ['풍선나비고기', 22, 44, 90, 245, '', 2], ['파랑새삼치', 34, 74, 105, 280, '', 1], ['황금비늘잉어', 50, 100, 330, 420, '', 4]]);
Z3.push(...[['극광고래상어', 200, 400, 250, 500, '', 2], ['심해별가오리', 150, 300, 230, 495, '', 2], ['용왕수염메기', 140, 280, 220, 480, '', 3], ['은하해룡', 90, 180, 220, 470, '', 1], ['흑진주곰치', 110, 220, 210, 460, '', 2], ['불꽃청새치', 140, 280, 240, 500, '', 2], ['얼음왕관연어', 100, 200, 210, 450, '', 1], ['달빛투명고기', 80, 160, 200, 430, '', 2], ['화산돌돔', 80, 160, 200, 420, '', 1], ['천년거북복', 90, 170, 210, 450, '', 2], ['폭포장어', 120, 250, 215, 460, '', 1], ['무쇠망둥이왕', 70, 140, 190, 400, '', 1], ['유령초롱아귀', 80, 160, 200, 430, '', 2], ['번개가오리왕', 150, 300, 240, 500, '', 3], ['산호왕관도미', 80, 150, 200, 420, '', 1], ['밤바다돛새치', 150, 290, 250, 500, '', 2], ['수정뿔외뿔고기', 160, 320, 240, 500, '', 2], ['해적깃발상어', 150, 300, 240, 495, '', 1], ['구름고래치', 180, 350, 240, 500, '', 2], ['비단잉어왕', 90, 170, 215, 460, '', 1], ['심연눈알고기', 70, 140, 195, 410, '', 1], ['황혼참치왕', 130, 260, 235, 495, '', 2], ['진주목걸이장어', 120, 240, 220, 470, '', 1], ['별자리개복치', 150, 300, 230, 495, '', 2], ['얼음송곳니대구', 110, 220, 215, 460, '', 1], ['태양물결방어', 120, 230, 225, 490, '', 1], ['은빛갑옷철갑상어', 140, 280, 230, 490, '', 2], ['오팔비늘농어', 100, 200, 210, 455, '', 1], ['폭풍눈상어', 150, 300, 245, 500, '', 3], ['무지개용고기', 180, 360, 340, 430, '', 4]]);
export const FISH = [Z1, Z2, Z3].flatMap((list, zi) => list.map(([name, c0, c1, p0, p1, tag, fixT], k) => ({ id: `f${zi + 1}-${k}`, z: zi + 1, k, name, cm: [c0, c1], price: [p0, p1], rare: tag === 'r', king: tag === 'k', ...(fixT ? { fixT } : {}) })));
// 희귀도 4단계: 같은 낚시터 안에서도 종의 절반은 흔한 물고기, 40%는 보기 힘든, 8%는 희귀한, 2%는 초희귀(대장 포함).
// 대장 → 원래 귀한 물고기 → 원래 값이 비싼 순서로 위쪽 급에 앉힌다. 급이 오를수록 잘 안 물고(w), 값이 비싸진다(x)
export const TIERS = [null, { n: '매우 흔한 물고기', s: '매우 흔함', w: 1, x: 1 }, { n: '보통 물고기', s: '보통', w: 0.45, x: 1.4 }, { n: '희귀한 물고기', s: '희귀', w: 0.4, x: 2.2 }, { n: '초희귀 물고기', s: '초희귀', w: 0.06, x: 4 }];
FISH.filter(f => f.fixT).forEach(f => { f.tier = f.fixT; const x = TIERS[f.tier].x; f.price = [Math.round(f.price[0] * x), Math.round(f.price[1] * x)]; if (f.tier >= 3) f.rare = true; });
for (const z of [1, 2, 3]) { const list = FISH.filter(f => f.z === z && !f.fixT), n = list.length, kings = list.filter(f => f.king).length;
  const n4 = Math.max(1, kings, Math.round(n * 0.02)), n3 = Math.round(n * 0.08), n2 = Math.round(n * 0.4);
  [...list].sort((a, b) => (b.king - a.king) || (b.rare - a.rare) || (b.price[1] - a.price[1]) || (a.k - b.k)).forEach((f, i) => {
    f.tier = i < n4 ? 4 : i < n4 + n3 ? 3 : i < n4 + n3 + n2 ? 2 : 1; const x = TIERS[f.tier].x; f.price = [Math.round(f.price[0] * x), Math.round(f.price[1] * x)]; if (f.tier >= 3 && !f.king) f.rare = true; }); }
// 2026-11-21: 물고기 값 전부 2배, 고래킹은 2.5배(대장 중의 대장). 예전 값으로 가방에 담긴 물고기는 팔 때 같은 배수로 쳐 준다(PRICE_V)
export const PRICE_V = 2, priceUp = f => (f && f.name === '고래킹' ? 2.5 : 2);
FISH.forEach(f => { const m = priceUp(f); f.price = [Math.round(f.price[0] * m), Math.round(f.price[1] * m)]; });
// 바다 쓰레기(F등급): 어느 바다에서나 10~20% 확률. 클수록 처리 비용이 커진다(50~250코인)
export const TRASH = [['스티로폼 박스', '📦', 30, 90], ['페트병', '🧴', 12, 35], ['헌 옷', '👕', 40, 110], ['타이어', '🛞', 50, 120], ['축구공', '⚽', 18, 30]].map(([name, icon, c0, c1], k) => ({ id: 't' + k, name, icon, img: `img/fish/trash${k}.webp`, cm: [c0, c1] }));
const PEARL = { id: 'pearl', name: '바다 진주', pearl: true };
// 산호 조각: 중급 바다에서만 낚이는 보물(초희귀 한 종만큼 드물게). 7개 모으면 카피수퍼에서 진주부적 1장
// ♨️ 카피온센 휴식: 탕 안에 있던 시간 10분마다 희귀 등급 물고기만 +3% 더 잘 문다. 30분(+9%)까지. 효과는 10분당 2분씩 유지(30분 쉬면 6분, 이 기기 기준)
export const ONSEN_STEP = 600000, ONSEN_MAX = 3, ONSEN_KEEP = 120000, ONSEN_UP = 0.03; // ONSEN_KEEP: 한 단계당 유지 시간
export const onsenRead = () => { try { const v = JSON.parse(localStorage.getItem('capy-onsen') || '{}') || {}; return v.until > Date.now() ? { ms: Math.min(ONSEN_STEP * ONSEN_MAX, v.ms || 0), until: v.until } : { ms: 0, until: 0 }; } catch { return { ms: 0, until: 0 }; } };
export const onsenStacks = () => Math.min(ONSEN_MAX, Math.floor(onsenRead().ms / ONSEN_STEP));
export const CORAL = { id: 'coral', name: '산호 조각', coral: true }, CORAL_PER = 7, KING_DEX = 40, ULTRA_DEX = 42; // ULTRA_DEX: 중급 바다 초희귀(번개참치·황금비늘잉어)는 초급 도감을 이만큼 채워야 문다
// 오늘의 어종: 매일(한국 날짜) 중급 바다 물고기 3종. 그날 잡은 것만 값 2배
export const kstDay = () => new Date(Date.now() + 9 * 3600e3).toISOString().slice(0, 10);
export function todayFish(day = kstDay()) { let x = [...('fish' + day)].reduce((a, ch) => (a * 31 + ch.charCodeAt(0)) >>> 0, 11); const rnd = () => { x = (x * 1103515245 + 12345) >>> 0; return x / 4294967296; };
  const l = FISH.filter(f => f.z === 2 && !f.king).slice(); for (let i = l.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [l[i], l[j]] = [l[j], l[i]]; } return l.slice(0, 3); }

// 상상의 물고기 그림: 이름마다 몸 모양·색·무늬가 정해진다
const PAL = [['#FF8FA3', '#FFD6DE'], ['#7FD1F5', '#D9F2FF'], ['#FFD166', '#FFF1C2'], ['#9BE28A', '#DFF7D6'], ['#C5A3FF', '#EADFFF'], ['#FFA56B', '#FFE0C8'], ['#6FE0C8', '#D2F7EE'], ['#F5C2E7', '#FFE9F7'], ['#8FA8FF', '#DCE4FF'], ['#F2E36B', '#FFF8C4'], ['#FF7B6B', '#FFD2CB'], ['#58C7B5', '#C9F0E9']];
const DEEP = [['#5B6CFF', '#C9CFFF'], ['#7A3FC9', '#D9C2FF'], ['#D9364A', '#FFC2CA'], ['#1F8FA8', '#B8E8F2'], ['#3E4A66', '#B7C0D6'], ['#C98A00', '#FFE49A'], ['#0FA37F', '#B5F0DF'], ['#B03A8C', '#F5C2E3']];
// 새로 늘린 물고기는 기존 물고기와 색·몸·꼬리·무늬 조합이 겹치지 않게 그림 번호를 고른다(기존 물고기 그림은 그대로)
const OLD_N = { 1: 25, 2: 25, 3: 30 }, BASE_COMMON = { 1: 25, 2: 20, 3: 28 };
const sigOf = (z, n) => `${(z === 3 ? DEEP[n % DEEP.length] : z === 2 ? (n % 3 ? PAL[(n * 5) % PAL.length] : DEEP[n % DEEP.length]) : PAL[n % PAL.length])[0]}|${n % 5}|${n % 3}|${(n >> 1) % 4}`;
{ const used = new Set(); FISH.forEach(f => { if (f.k < OLD_N[f.z]) used.add(sigOf(f.z, f.k * 7 + f.z * 13)); });
  FISH.forEach(f => { if (f.k < OLD_N[f.z]) return; let n = f.k * 7 + f.z * 13; while (used.has(sigOf(f.z, n))) n++; f.seed = n; used.add(sigOf(f.z, n)); }); }
// 물고기 그림: 힉스필드로 새로 그린 그림(img/fish/<id>.webp). 그림이 없으면 예전 손그림으로 그린다
const FISH_IMG = true, OLD_LOOK = new Set();
// 이로치(색이 다른 물고기): 바다마다 정해진 흔한 물고기만(초급 10·중급 7·고급 5종). 한 종이 희귀 물고기 한 종만큼 드물게 나오고, 색이 바뀌고 작은 장신구를 단다
export const SHINY_N = { 1: 10, 2: 7, 3: 5 }, SHINY_LIST = { 1: [], 2: [], 3: [] }, SHINY_X = TIERS[3].x / TIERS[1].x;
for (const z of [1, 2, 3]) { const l = FISH.filter(f => f.z === z && f.tier === 1 && !f.fixT); for (let i = 0; i < SHINY_N[z]; i++) SHINY_LIST[z].push(l[Math.floor(i * l.length / SHINY_N[z])].id); }
export const SHINY_IDS = new Set(Object.values(SHINY_LIST).flat());
const SH_AT = { 'f1-0': [34, 14], 'f1-3': [28, 30], 'f1-6': [28, 27], 'f1-16': [28, 30], 'f1-21': [34, 14], 'f1-26': [28, 15], 'f1-28': [28, 39], 'f1-34': [28, 20], 'f1-40': [28, 15], 'f1-47': [28, 28], 'f2-0': [28, 25], 'f2-8': [29, 9], 'f2-14': [30, 14], 'f2-27': [28, 17], 'f2-33': [28, 17], 'f2-39': [30, 16], 'f2-48': [28, 13], 'f3-0': [34, 14], 'f3-14': [28, 24], 'f3-21': [28, 8], 'f3-40': [28, 11], 'f3-49': [28, 24] };
const ACC = ['<path d="M-8 0L-8-9-4-4 0-11 4-4 8-9 8 0z" fill="#FFD84D" stroke="#B8860B" stroke-width="1.2" stroke-linejoin="round"/><circle cx="0" cy="-3" r="1.6" fill="#FF5C8A"/>', // 왕관
  '<path d="M0-4L-9-10-9 2zM0-4L9-10 9 2z" fill="#FF6FA5" stroke="#C2185B" stroke-width="1.1" stroke-linejoin="round"/><circle cx="0" cy="-4" r="2.6" fill="#FF9EC4" stroke="#C2185B" stroke-width="1"/>', // 리본
  '<g fill="#FFFFFF" stroke="#E58FB0" stroke-width="1"><circle cx="0" cy="-10" r="3.2"/><circle cx="4.6" cy="-6.6" r="3.2"/><circle cx="2.8" cy="-1.4" r="3.2"/><circle cx="-2.8" cy="-1.4" r="3.2"/><circle cx="-4.6" cy="-6.6" r="3.2"/></g><circle cx="0" cy="-5.6" r="2.4" fill="#FFD84D"/>', // 꽃
  '<path d="M0-12L2.6-6.4 8.6-5.8 4-1.8 5.4 4 0 1 -5.4 4 -4-1.8 -8.6-5.8 -2.6-6.4z" fill="#FFE066" stroke="#C99A1E" stroke-width="1.1" stroke-linejoin="round"/>', // 별핀
  '<rect x="-6" y="-13" width="12" height="11" rx="1.5" fill="#3B3355"/><rect x="-6" y="-5.5" width="12" height="2.6" fill="#E94B6A"/><rect x="-9.5" y="-2.8" width="19" height="3" rx="1.5" fill="#3B3355"/>', // 모자
  '<path d="M0 0C-9-5-9-12-4.5-12-2-12 0-10 0-8 0-10 2-12 4.5-12 9-12 9-5 0 0z" fill="#FF4F6E" stroke="#B3123A" stroke-width="1.1"/><circle cx="-4" cy="-8.5" r="1.3" fill="#fff" opacity=".8"/>']; // 하트핀
const shinyHue = f => 110 + ((f.k * 53 + f.z * 31) % 140);
export function fishSvg(f, big, shiny) { if (f.img) return `<img src="${shiny && f.imgS ? f.imgS : f.img}" alt="" style="width:100%;height:100%;object-fit:contain">`; const sv = fishSvg0(f, big); if (!shiny) return sv;
  const id = 'shy-' + f.id, i = sv.indexOf('>') + 1, j = sv.lastIndexOf('</svg>'), [x, y] = SH_AT[f.id] || [30, 16], n = [...SHINY_IDS].indexOf(f.id);
  const acc = n < 0 ? '' : `<g transform="translate(${x} ${y + 3})">${ACC[n % ACC.length]}</g>`; // 정해진 이로치만 장신구를 단다(예전에 잡은 다른 이로치는 색만)
  return sv.slice(0, i) + `<defs><filter id="${id}" color-interpolation-filters="sRGB"><feColorMatrix type="hueRotate" values="${shinyHue(f)}"/><feColorMatrix type="saturate" values="1.35"/></filter></defs><g filter="url(#${id})">` + sv.slice(i, j) + '</g>' + acc
    + '<g fill="#fff" stroke="#FFE066" stroke-width="1"><path d="M14 8l2 5 5 2-5 2-2 5-2-5-5-2 5-2z"/><path d="M104 60l1.5 3.5 3.5 1.5-3.5 1.5-1.5 3.5-1.5-3.5-3.5-1.5 3.5-1.5z"/></g></svg>'; }
function fishSvg0(f, big) {
  if (f.id && !f.pearl && !f.icon && !OLD_LOOK.has(f.id) && FISH_IMG) return `<svg viewBox="0 0 120 80"><image href="img/fish/${f.id}.webp" x="0" y="0" width="120" height="80" preserveAspectRatio="xMidYMid meet"/></svg>`;
  if (f.pearl) return `<svg viewBox="0 0 120 80"><image href="img/fish/pearl.webp" x="0" y="0" width="120" height="80" preserveAspectRatio="xMidYMid meet"/></svg>`; // 힉스필드로 그린 바다 진주
  if (f.pearl) return `<svg viewBox="0 0 120 80"><ellipse cx="60" cy="58" rx="40" ry="14" fill="#F3D9E4" stroke="#C99AB0" stroke-width="2.5"/><path d="M22 54 Q60 8 98 54" fill="#FFEAF2" stroke="#C99AB0" stroke-width="2.5"/><circle cx="60" cy="50" r="15" fill="#fff" stroke="#E9C46A" stroke-width="2.5"/><circle cx="54" cy="44" r="5" fill="#FFF6D6"/><path d="M96 14l3 7 7 3-7 3-3 7-3-7-7-3 7-3z" fill="#FFE066"/></svg>`;
  if (f.img) return `<svg viewBox="0 0 120 80"><image href="${f.img}" x="0" y="0" width="120" height="80" preserveAspectRatio="xMidYMid meet"/></svg>`;
  if (f.icon) return `<svg viewBox="0 0 120 80"><text x="60" y="58" font-size="52" text-anchor="middle">${f.icon}</text></svg>`;
  const seed = f.seed != null ? f.seed : f.k * 7 + f.z * 13, [c, l] = f.z === 3 ? DEEP[seed % DEEP.length] : f.z === 2 ? (seed % 3 ? PAL[(seed * 5) % PAL.length] : DEEP[seed % DEEP.length]) : PAL[seed % PAL.length], d = 'rgba(0,0,0,.28)';
  const eye = (x, y, r = 4.6) => `<circle cx="${x}" cy="${y}" r="${r}" fill="#fff" stroke="${d}" stroke-width="1"/><circle cx="${x + 1}" cy="${y}" r="${r * 0.55}" fill="#2E2A33"/>`;
  if (f.name === '고래킹') return `<svg viewBox="0 0 120 80"><path d="M10 44 Q12 16 52 16 Q92 16 100 40 L114 28 Q118 44 112 58 L100 50 Q88 68 52 68 Q14 68 10 44z" fill="#4C6FD9" stroke="${d}" stroke-width="2.4" stroke-linejoin="round"/><path d="M14 50 Q40 70 90 56 Q70 68 52 68 Q24 68 14 50z" fill="#DCE6FF"/>${eye(30, 40, 5)}<path d="M20 52 q10 6 20 0" fill="none" stroke="#22315F" stroke-width="2.2" stroke-linecap="round"/><path d="M44 6 l5 8 6-9 6 9 5-8 v12 h-22z" fill="#FFD75E" stroke="#C99A1E" stroke-width="1.6" stroke-linejoin="round"/><path d="M58 -2 q-8 -8 -12 0 M62 -2 q8 -8 12 0" fill="none" stroke="#9AD0F5" stroke-width="3" stroke-linecap="round"/></svg>`;
  if (f.name === '상어킹') return `<svg viewBox="0 0 120 80"><path d="M6 44 Q30 22 62 26 L72 6 L80 28 Q98 34 104 42 L116 26 Q118 46 114 62 L104 48 Q84 62 56 60 Q26 60 6 44z" fill="#6E7F99" stroke="${d}" stroke-width="2.4" stroke-linejoin="round"/><path d="M10 46 Q40 62 96 48 Q76 60 56 60 Q28 60 10 46z" fill="#EEF2F8"/>${eye(28, 38, 4.4)}<path d="M12 48 l5 6 5-6 5 6 5-6 5 6 5-6" fill="#fff" stroke="#3A4558" stroke-width="1.6" stroke-linejoin="round"/><path d="M52 36 v10 M58 37 v10 M64 38 v10" stroke="#3A4558" stroke-width="2" stroke-linecap="round"/><path d="M30 12 l5 8 6-9 6 9 5-8 v12 h-22z" fill="#FFD75E" stroke="#C99A1E" stroke-width="1.6" stroke-linejoin="round"/></svg>`;
  const shape = seed % 5, body = ['M14 40 Q34 14 68 22 Q88 28 92 40 Q88 52 68 58 Q34 66 14 40z', 'M8 40 Q30 26 76 30 Q94 34 96 40 Q94 46 76 50 Q30 54 8 40z', 'M20 40 Q22 12 56 12 Q88 12 90 40 Q88 68 56 68 Q22 68 20 40z', 'M12 40 Q40 8 74 30 Q90 36 92 40 Q90 44 74 50 Q40 72 12 40z', 'M6 40 Q22 30 44 34 Q66 24 84 34 Q94 38 96 40 Q94 44 84 46 Q66 56 44 46 Q22 50 6 40z'][shape];
  const tail = [`M90 40 L112 22 Q106 40 112 58z`, `M92 40 L114 28 L108 40 L114 52z`, `M88 40 Q104 20 114 26 Q104 40 114 54 Q104 60 88 40z`][seed % 3];
  const pat = [`<path d="M40 22 v36 M54 20 v40 M68 22 v36" stroke="${d}" stroke-width="3.4" stroke-linecap="round" opacity=".5"/>`, `${[[40, 34], [54, 46], [66, 32], [50, 28], [70, 46]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="3.2" fill="#fff" opacity=".7"/>`).join('')}`, `<path d="M22 44 Q50 58 86 44 Q60 62 40 58z" fill="${l}"/>`, `<path d="M36 26 q8 14 0 28 M52 24 q8 16 0 32 M68 26 q8 14 0 28" fill="none" stroke="#fff" stroke-width="2.6" opacity=".6"/>`][(seed >> 1) % 4];
  const fin = `<path d="M46 ${shape === 2 ? 14 : 24} q10 -16 24 -${shape === 2 ? 2 : 0} " fill="${c}" stroke="${d}" stroke-width="2" stroke-linejoin="round"/><path d="M48 50 q4 12 14 8" fill="${l}" stroke="${d}" stroke-width="1.6"/>`;
  const extra = f.rare ? `<path d="M100 10l2.500 6 6 2.500-6 2.500-2.500 6-2.500-6-6-2.500 6-2.500z" fill="#FFE066" stroke="#C99A1E" stroke-width="1"/>` : f.z === 3 ? `<path d="M16 46 l4 5 4-5 4 5 4-5" fill="#fff" stroke="${d}" stroke-width="1.2"/><path d="M30 20 l4 -10 4 9" fill="${c}" stroke="${d}" stroke-width="1.6" stroke-linejoin="round"/>` : (seed % 4 === 1 ? `<path d="M14 42 q-8 4 -8 12" fill="none" stroke="${d}" stroke-width="1.6" stroke-linecap="round"/>` : '');
  return `<svg viewBox="0 0 120 80"><path d="${tail}" fill="${c}" stroke="${d}" stroke-width="2.2" stroke-linejoin="round"/>${fin}<path d="${body}" fill="${c}" stroke="${d}" stroke-width="2.4" stroke-linejoin="round"/>${pat}${eye(26 + (shape === 1 || shape === 4 ? -4 : 0), 36)}<path d="M${shape === 4 || shape === 1 ? 10 : 16} 44 q5 3 9 0" fill="none" stroke="${d}" stroke-width="1.8" stroke-linecap="round"/>${extra}</svg>`.replace(/\.500/g, '.5');
}
const pick = a => a[Math.floor(Math.random() * a.length)], rnd = (a, b) => a + Math.random() * (b - a);
// 무엇이 물었나: 진주 차례면 진주, 가끔 쓰레기, 아니면 그 구역 물고기(귀한 것은 드물게). 한 단계 낮은 낚싯대로는 귀한 것·대장은 안 문다
// 다른 바다(핫똑 나루터)의 어종 목록에서 고른다: tier 1~4가 드물수록 덜 물고, 멀리 던지면 귀한 것이 조금 더 문다
function rollPool(pool, power, aUp = 0) { const w = pool.map(f => [46, 33, 16, 5][f.tier - 1] / (f.ghost ? 1 : pool.filter(x => x.tier === f.tier && !x.ghost).length) * (f.tier >= 3 ? 1 + power * 0.8 : 1)), /* 귀신아귀(ghost)는 희귀 등급 전체와 같은 확률로 나온다 */ tot = w.reduce((a, b) => a + b, 0); let r = Math.random() * tot, f = pool[0]; for (let i = 0; i < pool.length; i++) { r -= w[i]; if (r <= 0) { f = pool[i]; break; } }
  const g = aUp > 0 && Math.random() < aUp ? 'A' : rollGrade(power), [b0, b1] = GRADE[g].band, t = b0 + (b1 - b0) * Math.random(); const sh = !!(f.imgS && Math.random() < 0.03 * (1 + power)); /* 이로치: 걸린 물고기의 3%쯤, 값 3배 */ return { f, cm: Math.round((f.cm[0] + (f.cm[1] - f.cm[0]) * t) * 10) / 10, g, price: (sh ? 3 : 1) * Math.round((f.price[0] + (f.price[1] - f.price[0]) * Math.pow(t, 1.3)) * GRADE[g].x / 10) * 10, d: 3.5 + f.tier * 0.8 + t * 1.5, p: power, shiny: sh }; }
export function rollCatch(zone, rodT, isPearl, power, forceShiny, kingOk = true, ultraOk = true, rareUp = 0) {
  if (isPearl) return { f: PEARL, cm: 0, price: PEARL_PRICE, d: 9.5, p: power };
  if (!forceShiny && power < TRASH_FAR && Math.random() < trashP(power)) { const t = pick(TRASH), k = Math.random(), cm = Math.round((t.cm[0] + (t.cm[1] - t.cm[0]) * k) * 10) / 10; return { f: t, cm, g: 'F', price: -Math.round(50 + 200 * k), d: 1, p: power }; }
  const under = rodT < zone, pool = forceShiny ? SHINY_LIST[zone].map(id => FISH.find(f => f.id === id)) : FISH.filter(f => f.z === zone && !(under && (f.rare || f.king)) && !(f.king && !kingOk) && !(zone === 2 && f.tier === 4 && !ultraOk)); // 대장(고래킹·상어킹)은 중급 도감 40종을 채워야 만난다
  const w = pool.map(f => TIERS[f.tier || 1].w * (f.tier >= 3 ? 1 + power * 1.2 : 1));
  if (rareUp > 0) { const all = w.reduce((a, b) => a + b, 0), R = pool.reduce((t, f, i) => t + (f.tier === 3 ? w[i] : 0), 0); /* 온센: 희귀 등급이 걸릴 확률 자체를 rareUp(%p)만큼 더한다 */
    if (R > 0 && R < all) { const s1 = Math.min(0.9, R / all + rareUp), k = s1 * (all - R) / (R * (1 - s1)); pool.forEach((f, i) => { if (f.tier === 3) w[i] *= k; }); } }
  const tot = w.reduce((a, b) => a + b, 0); if (zone === 2 && !forceShiny && !under) { const cw = TIERS[3].w * (1 + power * 1.2); /* 산호 조각: 희귀 등급 한 종과 같은 비율 */ if (Math.random() < cw / (tot + cw)) return { f: CORAL, cm: 0, price: 0, d: 4 + Math.random() * 2 + 1, p: power }; } // 산호 조각 = 초희귀 한 종만큼
  let r = Math.random() * tot, f = pool[0]; for (let i = 0; i < pool.length; i++) { r -= w[i]; if (r <= 0) { f = pool[i]; break; } }
  // 등급(크기): 같은 물고기라도 D~S. S일수록 드물고 크고 비싸다. 멀리 던질수록 높은 등급이 조금 더 잘 문다
  const g = rollGrade(power), [b0, b1] = GRADE[g].band, t = b0 + (b1 - b0) * Math.random(), cm = Math.round((f.cm[0] + (f.cm[1] - f.cm[0]) * t) * 10) / 10;
  const price = Math.round((f.price[0] + (f.price[1] - f.price[0]) * Math.pow(t, 1.3)) * GRADE[g].x);
  const d = zone === 1 ? 1 + t * 2 : zone === 2 ? 4 + t * 2 + (f.rare ? 1 : 0) : 6.5 + t * 2 + (f.king ? 1 : 0); // 낚싯대 차이는 '끊어짐 칸을 몇 번 버티나'로 따로 매긴다
  const shiny = !!forceShiny || SHINY_IDS.has(f.id) && Math.random() < TIERS[3].w * (1 + power * 1.2) / TIERS[f.tier || 1].w; // 이로치 한 종 = 희귀 물고기 한 종만큼 드물게
  return { f, cm, g, price: shiny ? Math.round(price * SHINY_X) : price, d, p: power, shiny };
}
// 등급 확인하기: 이 물고기가 몇 등급인지, 등급표(확률·크기·값)에서 어디쯤인지 보여 준다
export function gradeInfo(f, cm, g) {
  const L = { S: '전설의 대물!', A: '엄청 큰 녀석!', B: '꽤 큼직해요', C: '보통 크기', D: '아담한 녀석' }, cmOf = t => Math.round((f.cm[0] + (f.cm[1] - f.cm[0]) * t) * 10) / 10;
  modal({ title: '등급 확인', body: h('div', { class: 'gi' },
    h('div', { class: 'gi-top' }, h('span', { class: 'fs-grade big g' + g }, g), h('div', null, h('b', null, `${f.name} · ${cm}cm`), h('small', null, `${L[g]} 이 물고기는 ${f.cm[0]}~${f.cm[1]}cm까지 자라요`))),
    f.tier && h('div', { class: 'gi-tier' }, h('div', { class: 'gi-th' }, h('span', null, '분류'), h('b', { class: 't' + f.tier }, TIERS[f.tier].n)), h('div', { class: 'gi-seg' }, ...[1, 2, 3, 4].map(k => h('span', { class: 'gi-tc t' + k + (k === f.tier ? ' on' : '') }, TIERS[k].s)))),
    h('table', { class: 'gi-t' }, h('tr', null, h('th', null, '등급'), h('th', null, '나올 확률'), h('th', null, '크기'), h('th', null, '값')),
      ...Object.entries(GRADE).map(([k, v]) => h('tr', { class: k === g ? 'on' : '' }, h('td', null, h('span', { class: 'fs-grade g' + k }, k)), h('td', null, v.p + '%'), h('td', null, `${cmOf(v.band[0])}~${cmOf(v.band[1])}cm`), h('td', null, v.x === 1 ? '기본' : `×${v.x}`)))),
    h('p', { class: 'dim center' }, 'S에 가까울수록 드물고, 크고, 비싸요. 멀리 던질수록 S·A가 조금 더 잘 물어요.')),
    actions: [{ label: '확인', primary: true }] });
}
// 쓰레기: 던지는 힘 85 이상(10칸 중 8.5칸)이면 안 걸리고, 못 미치면 15~20%(가까이 던질수록 20%에 가깝다)
const STORM_LOSS = [0, 120, 180, 1500]; // 풍랑을 만나면 거센 파도에 돈을 빠뜨린다(초급·중급·고급 바다)
const TRASH_FAR = 0.85, trashP = power => 0.2 - 0.05 * Math.min(1, power / TRASH_FAR);
// 풍랑: 바다마다 15번 던질 때 1번. 15번 묶음마다 몇 번째에 불지 미리 정하고, 그 판에 못 불었으면(진주였거나 일찍 끝나서) 다음 판으로 미룬다
const STORM_EVERY = 15, stormPlan = () => [1 + Math.floor(Math.random() * STORM_EVERY)];
// 등급표: 확률(기본) · 크기 구간(물고기 크기 범위 안에서) · 값 배수
export const GRADE = { S: { p: 3, band: [0.9, 1], x: 2 }, A: { p: 9, band: [0.75, 0.9], x: 1.5 }, B: { p: 18, band: [0.55, 0.75], x: 1.25 }, C: { p: 30, band: [0.3, 0.55], x: 1.1 }, D: { p: 40, band: [0, 0.3], x: 1 } };
function rollGrade(power) { const w = Object.entries(GRADE).map(([k, v]) => [k, v.p * (k === 'S' || k === 'A' ? 1 + power * 0.6 : 1)]), tot = w.reduce((a, [, x]) => a + x, 0); let r = Math.random() * tot; for (const [k, x] of w) { r -= x; if (r <= 0) return k; } return 'D'; }
const josaUl = w => { const c = (w || '').charCodeAt(w.length - 1) - 0xAC00; return w + (c >= 0 && c <= 11171 && c % 28 !== 0 ? '을' : '를'); };
// 물고기가 화내며 팔짝 뛸 때: 줄이 한순간에 확 팽팽해진다(누르고 있으면 그대로, 손을 뗐으면 절반). [초급, 중급, 고급]
const SPIKE = [0, 14, 20, 26], SPIKE_GAP = [[0, 0], [5, 8], [4, 6.5], [3, 5]], TELE = 400;
// 난이도 맞춤(2026-11-18 가상 플레이 /tmp/vb/fsim3.mjs, 보통 솜씨 기준): 낚싯대와 바다가 같은 등급이면 어느 바다든 73%.
// 바다가 낚싯대보다 쉬우면 90%(한 단계)·97%(두 단계), 주황 칸 +3·+6칸. 어려우면 초급대→중급 바다 30%·고급 바다 10%, 중급대→고급 바다 30%
// BAND_LO = 이 값부터 끊어짐 칸(80) 전까지가 '주황 칸'. 줄이 주황 칸에 있을 때 감아야 끌려온다. ZONE_TEN = 바다별로 줄이 팽팽해지는 빠르기, ZONE_REEL = 감기는 빠르기, PATIENCE = 물고기 인내심(초)
const BAND_LO = [0, 57.3, 60.2, 60.8], ZONE_TEN = [0, 1.3, 0.97, 0.87], ZONE_REEL = [0, 1, 1.4, 2.3], PATIENCE = [0, 15, 16, 16];
// 낚싯대 등급 - 바다 등급(-2 ~ +2)에 따라 [-2, -1, 0, +1, +2]: 쉬운 바다일수록 주황 칸이 넓어지고, 어려운 바다일수록 좁아진다(그 밖의 차이는 작게)
// D_BAND = 주황 칸이 넓어지는 정도, D_TEN = 줄 팽팽해지는 빠르기, D_REEL = 감기는 빠르기, D_PAT = 인내심 더하기(초), D_BRK = 끊어짐 칸 시작, D_BITE = 챔질 여유(ms)
const D_BAND = [-6, -3.8, 0, 3, 6], D_TEN = [1.1, 1.05, 1, 1, 1], D_REEL = [0.95, 0.97, 1, 1, 1], D_PAT = [-1, -1, 0, 0, 0], D_BRK = [80, 80, 80, 80, 80], D_BITE = [-200, -130, 0, 150, 260];
export const strikesOf = () => 2;
export const weightOf = (f, cm) => (f.pearl || f.icon ? 0 : Math.max(0.01, Math.pow(cm, 3) * (f.name === '고래킹' ? 0.00003 : 0.000013)));
const kg = w => (w >= 1000 ? (w / 1000).toFixed(2) + 't' : w >= 1 ? w.toFixed(1) + 'kg' : Math.round(w * 1000) + 'g');

// ----- 낚시 화면 -----
// o = { ctx, zone, bag(), save(patch), coins(n), dex(id, cm), onClose() }
export function openFishing(o) {
  let gEye = 0, gHit = 0, gYank = 0, gYank0 = 0, c0 = 0, castTo = 60, flew = false, clickAt = 0, creakAt = 0, pressAt = 0, eyeAt = 0, taps = 0, pat = 0, pat0 = 1, nextSpike = 0, tele = 0;
  let gift = false, spk2 = false, pboosted = false, stormAt = 0, stormIn = false, armed = true, ptrDown = false, alive = true, raf = 0, last = 0, phase = 'ready', power = 0, pdir = 1, t0 = 0, biteAt = 0, biteEnd = 0, nibAt = 0, cur = null, dist = 100, ten = 30, hold = false, burst = 0, nextBurst = 0, slack = 0, shown = false;
  const zone = o.zone, rodT = () => o.bag().rod || 0, rod = () => RODS[rodT()], kingOk = () => !o.midDex || o.midDex() >= KING_DEX, ultraOk = () => !o.lowDex || o.lowDex() >= ULTRA_DEX, tdIds = zone === 2 && !o.pool ? new Set(todayFish().map(f => f.id)) : null;
  const float = h('i', { class: 'fs-float' }), hook = h('i', { class: 'fs-hook' }), rl = h('div', { class: 'fs-rl', html: '<svg viewBox="0 0 100 100" preserveAspectRatio="none"><path d="" fill="none" stroke="#fff" stroke-width="1.6" vector-effect="non-scaling-stroke"/></svg>' }), fishEl = h('div', { class: 'fs-fish' }), mark = h('b', { class: 'fs-mark' });
  const me = h('div', { class: 'fs-me', html: capy(o.ctx.capyOf(o.ctx.uid, { face: 'happy' })) }), rodTip = h('b', { class: 'fs-tip' }), rodEl = h('i', { class: 'fs-rod' }, rodTip);
  // 위: 타고 온 배가 그대로 물 위에 떠 있다. 아래: 물속(구역마다 그림이 다르다)
  const surf = h('div', { class: 'fs-surf' }, rl, h('div', { class: 'fs-boat' }, me, h('div', { class: 'fs-hull', html: o.boat || '' }), rodEl), float, mark), under = h('div', { class: 'fs-under z' + zone }, hook, fishEl), msg = h('p', { class: 'fs-msg' }), bar = h('div', { class: 'fs-bar' }, h('u'), h('i')), info = h('div', { class: 'fs-info' });
  const pearlTxt = h('b', { class: 'fs-pearltxt', hidden: true }), sparks = h('div', { class: 'fs-sparks' }, ...Array.from({ length: 14 }, (_, k) => h('i', { style: { left: (6 + (k * 37) % 88) + '%', top: (8 + (k * 53) % 80) + '%', animationDelay: (k % 7) * 0.17 + 's' } }, '✦'))), patEl = h('div', { class: 'fs-pat', hidden: true }, h('u'), h('span', null, '🐟 물고기 인내심')), pipsEl = h('span', { class: 'fs-pips' }), gl = h('div', { class: 'fs-gl' }, h('b'), h('span')), btn = h('button', { class: 'fs-btn' }), quit = h('button', { class: 'top-x fs-quit', 'aria-label': '그만하기', onClick: () => close() }, '✕');
  const charmB = h('button', { class: 'fs-charmb', hidden: true, onClick: () => useCharm() }, h('img', { src: 'img/crow/pearl-win.webp', alt: '' }), '진주부적 쓰기');
  const wrap = h('div', { class: 'fs' }, h('div', { class: 'fs-top' }, h('b', null, `🎣 ${o.title || ZONES[zone]}`), info, quit), h('div', { class: 'fs-view z' + zone + (o.cls ? ' ' + o.cls : '') }, surf, under, sparks, pearlTxt, patEl, charmB, tdIds && h('div', { class: 'fs-today' }, h('b', null, '⭐ 오늘의 어종 · 값 2배'), h('span', null, todayFish().map(f => f.name).join(' · ')))), msg, h('div', { class: 'fs-deck' }, h('div', { class: 'fs-gauge' }, gl, bar, h('div', { class: 'fs-ticks' }, h('small'), pipsEl, h('small'))), btn));
  // 낚싯줄은 매 프레임 낚싯대 끝(배가 흔들리고 낚싯대가 휘둘려도 그 끝)에서 찌까지 이어 그린다 → 낚싯대와 줄이 한 몸처럼 움직인다
  const tipAt = () => { const r = rl.getBoundingClientRect(), t = rodTip.getBoundingClientRect(); return r.width ? [(t.left - r.left) / r.width * 100, (t.top - r.top) / r.height * 100] : [34, 34]; };
  let fx = 60, fb = 10, ftaut = false; const drawLine = () => { if (rl.style.display === 'none') return; const [sx, sy] = tipAt(), x = fx, y = 92 - fb, sag = ftaut ? 2 : 10 + Math.abs(x - sx) * 0.22; rl.firstChild.firstChild.setAttribute('d', `M${sx.toFixed(2)} ${sy.toFixed(2)} Q${((sx + x) / 2).toFixed(2)} ${((sy + y) / 2 + sag).toFixed(2)} ${x} ${y}`); };
  const setFloat = (x, b = 10, taut = false) => { fx = x; fb = b; ftaut = taut; float.style.left = hook.style.left = mark.style.left = x + '%'; float.style.bottom = b + '%'; drawLine(); };
  const shadow = () => { const rx = cur.f.pearl ? 20 : 34 + Math.min(20, cur.d * 2), ry = cur.f.pearl ? 16 : 14 + cur.d, fill = zone === 3 || o.pool ? 'rgba(170,215,255,.42)' : 'rgba(20,40,80,.55)', tx = 60 + rx - 3; // 그림자에 꼬리지느러미(진주는 꼬리 없음)
    return `<svg viewBox="0 0 120 80" style="overflow:visible"><ellipse cx="60" cy="40" rx="${rx}" ry="${ry}" fill="${fill}"/>${cur.f.pearl ? '' : `<path class="fs-tail" style="transform-origin:${tx}px 40px" d="M${tx} 40 q${rx * 0.25} -${ry * 0.2} ${rx * 0.55} -${ry * 1.05} q-${rx * 0.12} ${ry * 1.05} 0 ${ry * 2.1} q-${rx * 0.3} -${ry * 0.85} -${rx * 0.55} -${ry * 1.05}z" fill="${fill}"/>`}</svg>`; };
  const K = () => Math.max(0, Math.min(4, rodT() - zone + 2)), BRK = () => D_BRK[K()]; let strikes = 0; const lim = () => strikesOf(rodT(), zone), drawPips = on => { pipsEl.replaceChildren(...(on ? Array.from({ length: lim() }, (_, k) => h('i', { class: k < lim() - strikes ? '' : 'off' })) : [])); };
  const say = (t, cls = '') => { msg.className = 'fs-msg ' + cls; msg.textContent = t; };
  const drawInfo = () => { if (o.info) { info.textContent = o.info(); if (charmB) charmB.hidden = true; return; } const b = o.bag(), r = rod(), pb = zone === 3 && b.pboost && b.pboost.at ? b.pboost : null; info.textContent = r ? `${r.name.slice(0, 2)} ${b.rodD || 0}/${r.dur} · ${BAIT_NAME[zone]} ${b[BAIT_KEY[zone]] || 0}${pb ? ` · 🦪 ${pb.at - (pb.k || 0) <= 1 ? '다음에 진주' : `${pb.at - (pb.k || 0)}번 안에 진주`}` : ''}${zone === 3 && !kingOk() ? ` · 👑 대장은 중급 도감 ${KING_DEX}종부터(${o.midDex()}종)` : ''}${zone === 2 && !ultraOk() ? ` · ✨ 초희귀는 초급 도감 ${ULTRA_DEX}종부터(${o.lowDex()}종)` : ''}${!o.trial && onsenStacks() ? ` · ♨️ 희귀 +${onsenStacks() * 3}%` : ''}` : '낚싯대 없음'; if (charmB) charmB.hidden = true; /* 진주부적은 고급 바다에서 가방을 열어 쓴다 */ };
  const setBar = (v, cls = '') => { v = Math.max(0, Math.min(100, v)); const pow = cls.startsWith('pow'), ten = cls.startsWith('ten'); bar.className = 'fs-bar ' + cls; bar.firstChild.style.width = v + '%'; bar.lastChild.style.left = v + '%'; gl.firstChild.textContent = pow ? '던지는 힘' : ten ? '줄 팽팽함' : '낚싯대'; gl.lastChild.textContent = pow || ten ? Math.round(v) : ''; const tk = bar.nextSibling; tk.firstChild.textContent = pow ? '가까이' : ten ? '느슨(안 끌려옴)' : ''; tk.lastChild.textContent = pow ? '멀리 ★' : ten ? '끊어짐!' : ''; };
  function close() { if (!alive) return; if (phase === 'fight' && cur && cur.f.icon && cur.price < 0) o.coins(cur.price); alive = false; cancelAnimationFrame(raf); window.removeEventListener('keydown', kd); window.removeEventListener('keyup', ku); window.removeEventListener('pointerup', pu); window.removeEventListener('pointercancel', pu); wrap.remove(); o.onClose && o.onClose(); }
  function ready(text) {
    phase = 'ready'; hold = false; strikes = 0; stormAt = 0; armed = !ptrDown; patEl.hidden = true; tele = 0; wrap.classList.remove('pearl', 'whale'); pearlTxt.hidden = true; wrap.classList.remove('reel'); rodEl.className = 'fs-rod'; rodEl.dataset.t = rodT(); hook.classList.remove('up'); fishEl.className = 'fs-fish'; fishEl.innerHTML = ''; mark.textContent = ''; float.style.display = rl.style.display = hook.style.display = 'none'; setBar(0); wrap.classList.remove('fight'); drawInfo();
    const b = o.bag(), r = rod();
    if (!r) { say('낚싯대가 없어요. 카피수퍼에서 사 오세요.', 'warn'); btn.textContent = '닫기'; btn.onclick = close; return; }
    if (!(b.rodD > 0)) { say('낚싯대가 다 닳았어요. 카피수퍼에서 수리하세요.', 'warn'); btn.textContent = '닫기'; btn.onclick = close; return; }
    if (!(b[BAIT_KEY[zone]] > 0)) { say(zone === 1 ? '미끼가 없어요. 카피수퍼에서 사 오세요(1개 10코인).' : `${BAIT_NAME[zone]}가 없어요. 이 바다는 ${BAIT_NAME[zone]}만 먹혀요. 카피수퍼에서 사 오세요(10개 ${zone === 2 ? 300 : 600}코인).`, 'warn'); btn.textContent = '닫기'; btn.onclick = close; return; }
    drawPips(true); say(text || (r.t < zone ? `낚싯대보다 깊은 바다예요. 귀한 물고기는 안 물어요. 끊어짐 칸을 ${lim()}번 건드리면 놓쳐요.` : `끊어짐 칸을 ${lim()}번 건드리면 놓쳐요. 릴을 눌러 힘을 모으고 한 번 더 눌러 던지세요.`)); btn.textContent = '던질\n준비'; btn.onclick = () => { if (!armed) return; phase = 'power'; power = 0; pdir = 1; say('멀리 던질수록 큰 물고기·귀한 물고기가 잘 물고, 줄도 덜 끊어져요. 85 넘게 던지면 쓰레기도 안 걸려요!'); btn.textContent = '던지기!'; btn.onclick = cast; };
  }
  function cast() {
    if (power >= 95) power = 100; // 95~100%는 최대로 친다
    const b = o.bag(), deep = zone === 3, n = (b.casts3 || 0) + (deep ? 1 : 0), boost = deep && b.pboost && b.pboost.at ? b.pboost : null, bk = boost ? (boost.k || 0) + 1 : 0;
    // 갈매기 해적단(중급·고급): 낚시 10번 묶음마다 0~1번. 묶음이 바뀔 때 나올지(절반 확률)·몇 번째에 나올지 미리 정해 둔다
    if (zone >= 2 && o.onPirate) { const pn = (b.pcasts || 0) + 1, blk = Math.floor((pn - 1) / PIRATE_EVERY), fresh = b.pirBlk !== blk, at = fresh ? (Math.random() < 0.5 ? blk * PIRATE_EVERY + 1 + Math.floor(Math.random() * PIRATE_EVERY) : -1) : b.pirNext, hit = pn === at; o.save({ pcasts: pn, pirBlk: blk, pirNext: hit ? -1 : at }); if (hit) { close(); return o.onPirate(); } }
    // 진주는 고급 바다에서만: 평소엔 던질 때마다 0.2%, 진주부적을 썼으면 10번 안의 정해진 한 번에 문다
    // 선물(2026-11-21 하루, 한 사람에 한 번): 그날 고급 바다 첫 낚시에 진주가 문다. 싸움은 보통 고급 물고기와 같은 난이도(놓칠 수 있다)
    gift = deep && !o.trial && !!(o.ctx && o.ctx.ours && o.ctx.ours()) && b.pgift !== '20261121' && new Date(Date.now() + 9 * 3600e3).toISOString().slice(0, 10) === '2026-11-21';
    if (deep && o.trial && !b.pgift && new URLSearchParams(location.search).has('pearltest')) { gift = true; b.pgift = 1; } // 진주 연습 링크(?fishtest=3&pearltest): 첫 낚시에 진주
    const isPearl = deep && (gift || (boost ? bk >= boost.at : Math.random() < PEARL_P)); o.save({ [BAIT_KEY[zone]]: b[BAIT_KEY[zone]] - 1, rodD: b.rodD - 1, casts: (b.casts || 0) + 1, ...(deep ? { casts3: n, ...(boost ? { pboost: isPearl ? null : { k: bk, at: boost.at } } : {}) } : {}) }); pboosted = !!(boost && isPearl && !gift); if (gift) o.save({ pgift: '20261121', ...(boost ? { pboost: { k: boost.k || 0, at: boost.at } } : {}) }); // 선물 진주: 기회는 이 한 번(던질 때 표시) · 부적 차례는 쓰지 않는다
    cur = o.pool ? rollPool(o.pool, power / 100, o.aUp ? o.aUp() : 0) : rollCatch(zone, rodT(), isPearl, power / 100, o.shinyTest, kingOk(), ultraOk(), o.trial ? 0 : onsenStacks() * ONSEN_UP); if (window.__whaleNext && o.trial) { const wn = window.__whaleNext(); if (wn) cur = wn; }
    if (o.trial && zone === 3 && !isPearl && new URLSearchParams(location.search).has('ultratest')) for (let k = 0; k < 20000; k++) { const u = rollCatch(zone, 3, false, Math.max(0.6, power / 100), false, true, true, 0); if (u.f && u.f.tier === 4) { cur = u; break; } } // 초희귀 연습 링크(?fishtest=3&ultratest): 던질 때마다 초희귀
    // 오늘 한정(2026-11-23, 두두 한 번): 고급 바다 첫 낚시에 초희귀 물고기가 문다. 던질 때 표시(ugift)해서 놓쳐도 다시 오지 않는다
    if (deep && !isPearl && !o.trial && o.ultraGift && o.ultraGift() && b.ugift !== '20261123' && new Date(Date.now() + 9 * 3600e3).toISOString().slice(0, 10) === '2026-11-23') { o.save({ ugift: '20261123' }); for (let k = 0; k < 20000; k++) { const u = rollCatch(zone, 3, false, Math.max(0.6, power / 100), false, kingOk(), true, 0); if (u.f && u.f.tier === 4) { cur = u; break; } } }
    if (gift) { for (let k = 0; k < 8; k++) { const n = rollCatch(zone, rodT(), false, 1, false); if (n.f && !n.f.king && !n.f.icon) { cur.d = n.d; break; } } } // 선물 진주는 보통 고급 물고기와 같은 힘으로 버틴다
    { const key = 'sp' + zone, sp = (o.bag()[key]) || {}, n = (sp.n || 0) % STORM_EVERY + 1, at = n === 1 || !Array.isArray(sp.at) || sp.at.length !== 1 ? stormPlan() : sp.at, due = !!sp.due || at.includes(n); stormIn = due && !cur.f.pearl && !o.noStorm; o.save({ [key]: { n, at, due } }); }
    stormAt = 0; phase = 'cast'; c0 = performance.now(); castTo = 48 + power * 0.44; flew = false; shown = false; setBar(power, 'pow'); drawInfo();
    rodEl.className = 'fs-rod back'; float.className = 'fs-float fly'; hook.classList.add('up'); say(power >= 85 ? '아주 멀리! 큰 물고기가 잘 물고 줄도 덜 끊어져요.' : power >= 55 ? '꽤 멀리 던졌어요.' : '가까이 떨어졌어요. 멀리 던질수록 유리해요.'); btn.textContent = '…'; btn.onclick = null;
  }
  // 찌가 물에 닿았다: 물이 튀고, 줄이 가라앉고, 그때부터 입질을 기다린다
  function splash(x, big) { const r = h('i', { class: 'fs-splash' + (big ? ' big' : ''), style: { left: x + '%' } }); surf.append(r); setTimeout(() => r.remove(), 700); }
  function touch() {
    const p = cur.p; phase = 'wait'; t0 = performance.now(); biteAt = t0 + rnd(1400, 4200) * (1 - p * 0.35); nibAt = Math.random() < 0.6 ? t0 + rnd(400, Math.max(450, biteAt - t0 - 450)) : 0;
    stormAt = stormIn ? t0 + rnd(900, 2600) : 0; // 풍랑은 입질 오기 전후에 분다(챔질 전에 대부분 불어서 끝까지 못 버틴다)
    if (cur.f.pearl) { wrap.classList.add('pearl'); sfx('bigfish'); pearlTxt.hidden = false; pearlTxt.textContent = '✨ 물속에서 뭔가 반짝여요! ✨'; }
    setFloat(castTo); float.className = 'fs-float'; hook.style.display = ''; hook.classList.remove('up'); rodEl.className = 'fs-rod'; splash(castTo, true); sfx('splash');
    fishEl.className = 'fs-fish on far'; fishEl.innerHTML = shadow(); fishEl.style.left = '125%'; setBar(0);
    say('찌가 쑥 들어가면 바로 챔질!'); btn.textContent = '챔질!'; btn.onclick = strike;
    // 진주가 걸리면 "앗, 진주 같아!" 그리고 진주부적 3장이 있으면 쓸지 묻는다(쓰면 90% 확률로 낚고 부적 3장이 사라진다)
    if (cur.f.name === '고래킹') { say('심상치 않다… 설마? 고래킹?'); wrap.classList.add('whale'); sfx('bigfish'); pearlTxt.hidden = false; pearlTxt.textContent = '🌊 거대한 그림자가… 🌊'; } // 대장 중의 대장
    if (cur.f.pearl) { say(gift ? '엇? 진주 아니야?' : '앗, 진주 같아!'); if (pboosted) { phase = 'ask'; btn.textContent = '…'; btn.onclick = null; setTimeout(() => alive && usePearlSet(), 700); } } // 부적으로 불러낸 진주는 바로 부적이 끌어올린다(90%)
  }
  // 진주부적 쓰기(고급 바다, 3장): 다음에 던지면 진주가 나타나고, 부적이 끌어올린다(90%)
  async function useCharm() { const b = o.bag(); if (zone !== 3 || o.trial || (b.pcharm || 0) < 3 || (b.pboost && b.pboost.at) || phase !== 'ready') return;
    const yes = await ask('🦪 진주부적 3장을 쓸까요? 다음에 던지면 진주가 나타나요. 부적이 끌어올리지만 100%는 아니에요(90%).', '쓰기', '안 쓸래'); if (!yes || !alive) return;
    o.save({ pcharm: Math.max(0, (o.bag().pcharm || 0) - 3), pboost: { k: 0, at: 1 } }); sfx('point'); pearlTxt.hidden = false; pearlTxt.textContent = '🦪 진주부적 발동! 🦪'; setTimeout(() => { if (alive) pearlTxt.hidden = true; }, 1600); say('부적이 빛나요… 다음에 던지면 진주가 찾아와요!'); drawInfo(); }
  async function usePearlSet() {
    if (!alive || phase !== 'ask') return; sfx('point'); pearlTxt.hidden = false; pearlTxt.textContent = '🦪 진주부적 발동! 🦪'; say('부적이 빛나요… 진주를 끌어올리는 중!');
    phase = 'charm'; wrap.classList.add('fight', 'reel'); fishEl.className = 'fs-fish on'; fishEl.innerHTML = shadow();
    setTimeout(() => { if (!alive) return; wrap.classList.remove('reel'); if (Math.random() < 0.9) landed(); else fail('앗… 진주가 마지막에 빠져나갔어요. (부적은 사용됐어요)'); }, 1800);
  }
  function strike() {
    const now = performance.now();
    if (phase !== 'wait') return;
    if (now < biteAt) { sfx('miss'); return ready('너무 빨랐어요. 물고기가 놀라 달아났어요. (미끼 1개 사용)'); }
    if (shown && now > biteEnd) return;
    pat0 = pat = cur.f.icon ? 99 : PATIENCE[zone] + (cur.f.king || (cur.f.pearl && !gift) ? 4 : 0) + D_PAT[K()]; bar.style.setProperty('--lo', (BAND_LO[zone] - D_BAND[K()]) + '%'); bar.style.setProperty('--hi', BRK() + '%'); tele = 0; spk2 = false; nextSpike = cur.f.icon ? Infinity : now + rnd(...SPIKE_GAP[zone]) * 1000; taps = 0; patEl.hidden = !!cur.f.icon;
    if (cur.f.pearl) { pearlTxt.textContent = '✨ 바다 진주다! ✨'; sfx('bigfish'); }
    if (false) { phase = 'intro'; wrap.classList.add('ghost'); sfx('bigfish'); const card = h('div', { class: 'fs-ghostcard' }, h('img', { src: cur.f.img, alt: '' }), h('b', null, '👻 블랙귀신아귀 출현!'), h('p', null, '바다 밑에 사는 낚싯대 사냥꾼이에요.'), h('ul', null, h('li', null, '🎣 보통 물고기처럼 꾹 눌러 주황 칸에서 감아요.'), h('li', null, '💢 화나면 두 번 연달아 튀어 올라요.'), h('li', null, '💥 빨간 칸에 두 번 닿으면 낚싯대가 부서져 버려야 해요.'), h('li', null, '❓ 끝까지 끌어올리면… 무슨 일이 생길까요?')), h('button', { class: 'btn primary', onClick: () => { card.remove(); if (!alive) return; phase = 'wait'; shown = true; biteEnd = Infinity; strike(); } }, '알겠어요! 싸운다')); wrap.append(card); return; } wrap.classList.remove('ghost', 'geye'); sfx('hookset'); strikes = 0; drawPips(true); phase = 'fight'; dist = 100; ten = 35; burst = 0; slack = 0; nextBurst = now + rnd(900, 1800); wrap.classList.add('fight'); const ultra = ((cur.f.tier || 1) === 4 || cur.f.coral) && !cur.f.pearl && !cur.f.icon; fishEl.className = 'fs-fish on' + (ultra ? ' ultra' : ''); fishEl.innerHTML = shadow(); // 초희귀는 그림자부터 빛난다
    const tip = cur.f.icon ? '누르고 있으면 감아요.' : `줄을 주황 칸에 맞춰야 끌려와요! 빨간 칸은 ${lim()}번 닿으면 끝이에요.`; if (ultra) { say('어? 심상치 않은데?? ✨', 'warn'); sfx('bigfish'); setTimeout(() => { if (alive && phase === 'fight') say(tip); }, 1800); } else say(tip); btn.textContent = '꾹 눌러\n감기'; btn.onclick = null;
  }
  // 풍랑: 하늘이 어두워지고 비바람이 치며 배가 크게 흔들리다가 줄이 풀려 물고기가 달아난다
  function storm() { stormAt = 0; phase = 'storm'; { const key = 'sp' + zone, sp = o.bag()[key] || {}; o.save({ [key]: { ...sp, due: false } }); } hold = false; o.coins(-STORM_LOSS[zone]); const hit = o.boatHit ? o.boatHit(CBOAT_HIT) : null, cbd = hit ? hit.d : -1; // 타고 있는 배(카피보트·흰 배)가 상한다. 0이 되면 가라앉는다 wrap.classList.remove('reel'); wrap.classList.add('storm'); sfx('splash'); setTimeout(() => sfx('bad'), 500); // 이번 풍랑을 썼다(위) · 화면이 어두워지고 비바람이 친다(아래)
    // 풍랑 연출: 먹구름이 몰려오고 하늘이 어두워지며, 장대비 · 번개 번쩍 · 높은 파도가 친다
    const view = wrap.querySelector('.fs-view'), fx = h('div', { class: 'fs-stormfx' }, h('div', { class: 'fs-clouds' }, ...[0, 1, 2, 3, 4].map(k => h('i', { style: { left: (k * 22 - 6) + '%', animationDelay: (k * 0.12) + 's' } }))), h('div', { class: 'fs-rain' }), h('div', { class: 'fs-rain far' }), h('div', { class: 'fs-waves' }, h('i'), h('i')), h('div', { class: 'fs-flash' }), h('b', { class: 'fs-bolt', html: '<svg viewBox="0 0 40 100"><path d="M24 0 L6 52 H20 L10 100 L36 40 H22 L32 0z" fill="#FFF6B0" stroke="#FFD43B" stroke-width="2.5" stroke-linejoin="round"/></svg>' }));
    if (view) view.append(fx); [700, 1700, 2500].forEach((ms, k) => setTimeout(() => { if (!alive || !fx.isConnected) return; fx.classList.remove('zap'); void fx.offsetWidth; fx.style.setProperty('--bx', (20 + Math.random() * 60).toFixed(0) + '%'); fx.classList.add('zap'); sfx(k === 1 ? 'snap' : 'splash'); }, ms)); say('🌊 풍랑이다! 배가 크게 흔들려요…', 'warn'); btn.textContent = '…'; btn.onclick = null;
    setTimeout(() => { if (!alive) return; wrap.classList.remove('storm'); fx.remove(); sfx('snap'); phase = 'done'; mark.textContent = ''; float.style.display = rl.style.display = hook.style.display = 'none'; fishEl.className = 'fs-fish'; patEl.hidden = true; wrap.classList.remove('fight', 'reel'); say('');
      // 카드로 알려 주고, 확인을 눌러야 닫힌다(뜬 직후 1.2초는 안 눌려서 연타로 바로 닫히지 않는다)
      const at = performance.now(), card = h('div', { class: 'fs-card storm-card wait' }, h('div', { class: 'storm-pic' }, '⛈️', h('span', null, '🌊')), h('b', null, '풍랑 때문에 놓쳤어요'), h('p', { class: 'storm-loss' }, `💸 -${STORM_LOSS[zone]}코인`), hit && h('p', { class: 'storm-loss boat' }, `🛶 ${hit.name} 내구도 -${CBOAT_HIT} (남은 ${cbd}/100)`), hit && cbd === 0 && h('small', { class: 'storm-warn' }, `${hit.name}가 버티지 못하고 가라앉아요! 확인을 누르면 마을로 떠밀려 가요.`), hit && cbd > 0 && cbd < 20 && h('small', { class: 'storm-warn' }, `${hit.name}가 많이 상했어요. 카피수퍼에서 수리해야 다시 나갈 수 있어요.`),
        h('p', null, '거센 파도에 갖고 있던 돈을 빠뜨려 버렸어요! 줄도 풀려서 물고기가 달아났어요.'), h('small', null, `풍랑은 어느 바다에서나 가끔 불어요. 운이 나빴을 뿐이에요! (미끼 1개 · ${STORM_LOSS[zone]}코인 잃음)`),
        h('div', { class: 'fs-acts' }, h('button', { class: 'btn primary', onClick: () => { if (performance.now() - at < 1200) return; card.remove(); if (hit && cbd === 0) { close(); if (o.sunk) o.sunk('풍랑에'); return; } ready(); } }, '확인')));
      wrap.append(card); setTimeout(() => card.classList.remove('wait'), 1200); }, 3200); } // 3.2초 동안 비바람이 친 뒤 카드
  function fail(text) { sfx(/끊어|부러/.test(text) ? 'snap' : 'bad'); ready(text); }
  function landed() {
    if (cur.f.ghost) { /* 블랙귀신아귀를 다 잡고 나서: 화면이 꺼지고 붉은 번개 속에 아귀 얼굴이 덮쳐 온다 */ const sc = h('div', { class: 'fs-scare' }, h('i', { class: 'fs-scare-bolt' }), h('img', { src: cur.f.img, alt: '' }), h('b', null, '…저주받았다')); wrap.append(sc); setTimeout(() => sc.remove(), 1900); sfx('alarm'); try { navigator.vibrate && navigator.vibrate([90, 50, 200, 60, 120]); } catch (e) {} }
    const { f, cm, shiny } = cur, today = !!(tdIds && tdIds.has(f.id)), price = today ? cur.price * 2 : cur.price; sfx(f.coral ? 'bigfish' : price <= 0 && !o.pool ? 'bad' : f.king || f.rare || f.pearl ? 'bigfish' : shiny ? 'fanfare' : 'coin'); if (price > 0 || o.pool) splash(34, true); phase = 'done'; patEl.hidden = true; pearlTxt.hidden = true; if (!f.pearl) wrap.classList.remove('pearl'); wrap.classList.remove('fight', 'reel'); float.style.display = rl.style.display = hook.style.display = 'none'; fishEl.className = 'fs-fish';
    const isNew = !f.icon && !f.pearl && !f.coral && !!o.seen && !o.seen(f.id); if (f.coral && o.coral) o.coral(1);
    const keep = price > 0 && o.keep; if (keep) o.keep({ id: f.id, cm, p: price, x: 1, pv: PRICE_V, ...(cur.g ? { g: cur.g } : {}), ...(shiny ? { shiny: 1 } : {}), ...(today ? { td: kstDay() } : {}) }); else if (!f.coral) o.coins(price); if (!f.icon && !f.coral) o.dex(f.id, cm, shiny); // 물고기는 바로 돈이 아니라 가방에 담아 카피마켓에 판다
    // 릴을 연타하다가 결과 창 버튼이 눌려 바로 닫히지 않게: 창이 뜨고 1.2초 동안은 버튼이 안 먹는다. 창은 버튼을 누르기 전까지 그대로 있다
    const shownAt = performance.now(), safe = () => performance.now() - shownAt > 1200;
    const g = cur.g; let gEl = null; // 등급은 '등급 확인하기'를 누르기 전까지 ?로 가려 둔다
    const w = weightOf(f, cm), card = h('div', { class: 'fs-card' + (f.ghost ? ' cursed' : '') + (f.pearl ? ' pearl' : f.king ? ' king' : f.rare || shiny || f.coral ? ' rare' : f.icon ? ' trash' : '') + (shiny ? ' shiny' : '') }, h('div', { class: 'fs-pic' + (shiny ? ' shy' : ''), html: fishSvg(f, true, shiny) }), shiny && h('em', { class: 'fs-shiny' }, `✨ 이로치! 색이 다른 귀한 녀석 · 값 ${SHINY_X.toFixed(1)}배 ✨`),
      h('b', null, f.pearl ? '✨ 바다 진주! ✨' : f.coral ? '🪸 산호 조각!' : f.king ? `👑 ${f.name}` : f.name), today && h('em', { class: 'fs-todayb' }, '⭐ 오늘의 어종 · 값 2배'), f.coral && h('p', { class: 'fs-won kept' }, `🧺 가방에 담았어요 · ${CORAL_PER}개 모으면 카피수퍼에서 진주부적 1장`), cur.g && (gEl = h('span', { class: g === 'F' ? 'fs-grade gF' : 'fs-grade hide' }, g === 'F' ? 'F등급' : '?등급')), !f.pearl && cm > 0 && h('p', null, f.icon ? `${cm}cm` : `${cm}cm · ${kg(w)}`), f.coral ? '' : keep ? h('p', { class: 'fs-won kept' }, f.ghost ? '👻 가방 속으로 스며들었어요… 팔 수 없는 저주받은 물고기예요' : o.keepText || '🧺 가방에 담았어요 · 카피수퍼 물고기 판매에서 팔아요') : h('p', { class: 'fs-won' }, price > 0 ? `+${price.toLocaleString('ko-KR')} 🪙` : `${price} 🪙`), o.trial && h('small', null, '체험 중이라 돈과 도감은 저장되지 않아요.'),
      f.icon && h('small', null, '바다 쓰레기가 걸려서 수거했어요. 한번 걸리면 놓아줄 수 없고, 클수록 처리 비용이 커요(50~250코인).'),
      cur.g && g !== 'F' && h('button', { class: 'btn sm fs-gbtn', onClick: () => { if (gEl.classList.contains('hide')) { gEl.className = 'fs-grade pop g' + g; gEl.textContent = `${g}등급` + (f.tier ? ` · ${TIERS[f.tier].n}` : ''); sfx(g === 'S' || g === 'A' ? 'bigfish' : 'point'); setTimeout(() => gradeInfo(f, cm, g), 650); } else gradeInfo(f, cm, g); } }, h('i', { class: 'fs-gico', html: '<svg viewBox="0 0 20 20"><circle cx="8.5" cy="8.5" r="5.5" fill="none" stroke="currentColor" stroke-width="2.4"/><path d="M12.6 12.6 L17 17" stroke="currentColor" stroke-width="2.6" stroke-linecap="round"/></svg>' }), '등급 확인하기'),
      h('div', { class: 'fs-acts' }, h('button', { class: 'btn primary', onClick: () => { if (safe()) { card.remove(); ready(); } } }, '또 던지기'), h('button', { class: 'btn', onClick: () => { if (safe()) { card.remove(); close(); } } }, '그만하기')));
    wrap.append(card); say(''); btn.textContent = '…'; btn.onclick = null; card.classList.add('wait'); setTimeout(() => card.classList.remove('wait'), 1200);
    // 바다 진주: 역대급 연출 — 화면 전체가 하얗게 번쩍, 금빛 햇살이 돌고, 진주가 솟아오르며 폭죽·꽃가루·반짝이가 쏟아진다
    const whale = f.name === '고래킹'; wrap.classList.remove('whale');
    if (f.pearl || whale) { card.classList.add('wait'); setTimeout(() => card.classList.remove('wait'), 4200); const fx = h('div', { class: 'pfx' + (whale ? ' whale' : '') }, h('div', { class: 'pfx-flash' }), h('div', { class: 'pfx-rays' }), h('div', { class: 'pfx-ring' }), h('div', { class: 'pfx-ring r2' }),
        h('div', { class: 'pfx-pearl', html: fishSvg(f, false, shiny) }), h('div', { class: 'pfx-title' }, h('b', null, whale ? '고래킹' : '바다 진주'), h('small', null, whale ? `👑 대장 중의 대장! ${cm}cm 👑` : '✦ LEGENDARY ✦ 평생 한 번 볼까 말까!')));
      const C = whale ? ['#7FD4FF', '#FFE066', '#FFFFFF', '#4DA3FF', '#B8F3FF', '#FFC94D'] : ['#FFE066', '#FF9AC7', '#B8F3FF', '#FFFFFF', '#C9A2FF', '#FFC94D'];
      for (let k = 0; k < 60; k++) fx.append(h('i', { class: 'pfx-conf', style: { left: Math.random() * 100 + '%', background: C[k % C.length], animationDelay: (0.4 + Math.random() * 4.2).toFixed(2) + 's', animationDuration: (2.4 + Math.random() * 2).toFixed(2) + 's', '--r': (Math.random() * 720 - 360).toFixed(0) + 'deg', width: 6 + Math.random() * 6 + 'px', height: 10 + Math.random() * 8 + 'px' } }));
      for (let k = 0; k < 28; k++) fx.append(h('i', { class: 'pfx-spark', style: { '--a': (k / 36 * 360) + 'deg', '--d': (140 + Math.random() * 260).toFixed(0) + 'px', animationDelay: (0.5 + (k % 4) * 0.35).toFixed(2) + 's', color: C[k % C.length] } }, k % 3 ? '✦' : '✨'));
      for (let k = 0; k < 10; k++) fx.append(h('b', { class: 'pfx-boom', style: { left: 4 + Math.random() * 92 + '%', top: 4 + Math.random() * 80 + '%', animationDelay: (0.6 + k * 0.5).toFixed(2) + 's', color: C[k % C.length], transform: `scale(${(0.8 + Math.random() * 1.4).toFixed(2)})` } }));
      fx.prepend(h('div', { class: 'pfx-beam b1' }), h('div', { class: 'pfx-beam b2' }), h('div', { class: 'pfx-beam b3' }), h('div', { class: 'pfx-beam b4' }));
      fx.append(h('div', { class: 'pfx-frame' }));
      for (let k = 0; k < 20; k++) fx.append(h('i', { class: 'pfx-rain', style: { left: Math.random() * 100 + '%', animationDelay: (0.4 + Math.random() * 3.6).toFixed(2) + 's', animationDuration: (1.8 + Math.random() * 1.6).toFixed(2) + 's', fontSize: 14 + Math.random() * 18 + 'px' } }, (whale ? ['🐳', '💦', '👑', '🌟', '🪙', '🌊'] : ['🦪', '✨', '💎', '🌟', '🪙', '💖'])[k % 6]));
      for (let k = 0; k < 14; k++) fx.append(h('i', { class: 'pfx-twk', style: { left: Math.random() * 100 + '%', top: Math.random() * 100 + '%', animationDelay: (Math.random() * 3).toFixed(2) + 's', color: C[k % C.length] } }, '✦'));

      document.body.append(fx); sfx('fanfare'); setTimeout(() => sfx('bigfish'), 500); [900, 1500, 2100, 2700].forEach(t => setTimeout(() => alive && sfx('coin'), t));
      try { navigator.vibrate && navigator.vibrate([80, 60, 80, 60, 200]); } catch {}
      [3000, 3400, 3800].forEach(t => setTimeout(() => alive && sfx('fanfare'), t));
      // 폰에서 아래 화면(낚시터·친목회) 조각이 연출 위로 비쳐 나오던 문제: 연출 동안 아래 화면을 아예 숨겼다가, 확인을 누르면 되돌린다
      const app = document.getElementById('app'), hid = [wrap, app].filter(Boolean); hid.forEach(e => { e.style.visibility = 'hidden'; }); // 하얗게 번쩍이는 순간 바로 숨긴다
      const end = () => { hid.forEach(e => { e.style.visibility = ''; }); fx.remove(); }; // 서서히 사라지게 하면 폰에서 겹친 화면이 깨져 보여서, 한 번에 닫는다 // 확인 버튼을 눌러야만 꺼진다(화면을 눌러도, 시간이 지나도 그대로)
      // 확인 버튼은 3초 뒤에야 생긴다: 릴을 연타하던 손가락에 눌려 바로 꺼지지 않게(그 전에는 버튼이 아예 없다)
      setTimeout(() => { if (!fx.isConnected) return; const born = performance.now(); fx.append(h('button', { class: 'btn primary pfx-ok', onClick: e => { e.stopPropagation(); if (performance.now() - born > 600) end(); } }, '✨ 확인')); }, 3000); }
    // 와! ○○○을 잡았다! — 화면 가득 터지는 글자, 그 아래 등급
    if (!f.icon && shiny) { // 이로치: 화면이 무지갯빛으로 번쩍이고 반짝이가 터진다
      const fl = h('div', { class: 'fs-shyflash' }); (wrap.querySelector('.fs-view') || wrap).append(fl); setTimeout(() => fl.remove(), 1600);
      const wow = h('div', { class: 'fs-wow shy' }, h('b', null, '✨ 이로치다! ✨'), h('small', null, `색이 다른 ${f.name} · 📖 이로치 도감에 기록`));
      for (let k = 0; k < 20; k++) wow.append(h('i', { class: 'fs-spark', style: { '--a': (k / 20 * 360) + 'deg', '--d': (70 + Math.random() * 90).toFixed(0) + 'px', color: ['#FF7EB6', '#8F7CFF', '#5ED3F3', '#FFE066'][k % 4] } }, k % 2 ? '✦' : '✨'));
      (wrap.querySelector('.fs-view') || wrap).append(wow); setTimeout(() => wow.classList.add('out'), 2600); setTimeout(() => wow.remove(), 3100); }
    else if (!f.icon && !f.pearl && !whale) { const wow = h('div', { class: 'fs-wow' + (isNew ? ' new' : f.pearl || f.king ? ' gold' : '') }, h('b', null, isNew ? '앗! 처음 보는 물고기다!' : `와! ${josaUl(f.pearl ? '바다 진주' : f.name)} 잡았다!`), isNew ? h('small', null, `📖 ${f.name} · 도감에 등록해야지!`) : cur.g && h('small', null, '몇 등급일까? 등급 확인하기를 눌러 보세요'));
      if (isNew) { sfx('bigfish'); for (let k = 0; k < 14; k++) wow.append(h('i', { class: 'fs-spark', style: { '--a': (k / 14 * 360) + 'deg', '--d': (60 + Math.random() * 70).toFixed(0) + 'px' } }, '✨')); }
      (wrap.querySelector('.fs-view') || wrap).append(wow); setTimeout(() => wow.classList.add('out'), 1900); setTimeout(() => wow.remove(), 2400); }
  }
  if (o.trial && new URLSearchParams(location.search).has('whaletest')) { const W = FISH.find(x => x.name === '고래킹'), mk = () => ({ f: W, cm: 880, g: 'S', price: 39750, d: 8, p: 1, shiny: false }); let used = false; window.__fsWhale = () => { cur = mk(); landed(); }; window.__whaleNext = () => { if (used) return null; used = true; return mk(); }; } // 고래킹 연습 링크(?fishtest=3&whaletest): 첫 낚시에 고래킹
  if (o.trial && new URLSearchParams(location.search).has('pearltest')) window.__fsPearl = () => { cur = rollCatch(zone, rodT(), true, 0.5, false); landed(); }; // 진주 연출 확인용
  if (o.pool && o.landTest) window.__fsLand = () => { cur = rollPool(o.pool, 0.8, 0); landed(); }; // 결과 창 확인용
  if (o.shinyTest) window.__fsLand = () => { cur = rollCatch(zone, rodT(), false, 0.5, true); landed(); }; // 이로치 결과 화면 확인용(?fishtest=1&shiny)
  // 찔끔찔끔 누르기: 0.3초도 안 되게 눌렀다 떼면 물고기가 눈치채고 인내심이 깎인다(깊은 바다일수록 많이)
  const down = () => { if (!hold) pressAt = performance.now(); hold = true; };
  const up = () => { if (hold && phase === 'fight' && !cur.f.icon && performance.now() - pressAt < 300) { taps++; pat -= [0, 0.7, 1.2, 1.8][zone] + (cur.f.king || cur.f.pearl ? 0.6 : 0); eyeAt = performance.now() + 700; if (taps === 2 || taps % 5 === 0) say('찔끔찔끔 감으면 물고기가 눈치채고 떠나요! 길게 감으세요.', 'warn'); } hold = false; };
  const press = e => { if (phase === 'fight') { e.preventDefault(); down(); } }, lift = up;
  // 감고 있던 손가락을 놓칠 때 떼면 그 클릭이 '던질 준비'로 넘어가 버리던 문제: 끝날 때 누르고 있었다면 그 한 번의 클릭은 무시
  const pd = () => { ptrDown = true; }, pu = () => { ptrDown = false; if (!armed) setTimeout(() => { armed = true; }, 0); };
  btn.addEventListener('pointerdown', pd); window.addEventListener('pointerup', pu); window.addEventListener('pointercancel', pu);
  btn.addEventListener('pointerdown', press); ['pointerup', 'pointercancel', 'pointerleave'].forEach(n => btn.addEventListener(n, lift));
  const kd = e => { if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); if (phase === 'fight') { if (!e.repeat) down(); } else if (!e.repeat && btn.onclick) btn.onclick(); } }, ku = e => { if (e.key === ' ' || e.key === 'Enter') up(); };
  window.addEventListener('keydown', kd); window.addEventListener('keyup', ku);
  function step(now) {
    if (!alive) return; raf = requestAnimationFrame(step); const dt = Math.min(0.05, (now - last) / 1000); last = now; drawLine(); // 다음 프레임을 먼저 예약: 놓침·풍랑으로 중간에 return 해도 루프가 멈추지 않는다
    if (phase === 'cast') { const u = (now - c0) / 1000; // 낚싯대를 뒤로 젖혔다가(0.25초) 휘두르면 찌가 포물선으로 날아간다(0.6초)
      if (u >= 0.25 && !flew) { flew = true; rodEl.className = 'fs-rod cast'; sfx('cast'); float.style.display = rl.style.display = ''; hook.style.display = 'none'; }
      if (flew) { const k = Math.min(1, (u - 0.25) / 0.6), e = k * (2 - k) * 0.35 + k * 0.65, [tx, ty] = tipAt(), tb = 92 - ty; setFloat(tx + (castTo - tx) * e, tb * (1 - e) + 10 * e + 34 * Math.sin(Math.PI * k) * (0.5 + power / 200), true); if (k >= 1) touch(); } }
    else if (phase === 'power') { power += pdir * dt * (150 + zone * 25); if (power >= 100) { power = 100; pdir = -1; } if (power <= 0) { power = 0; pdir = 1; } setBar(power, 'pow'); }
    else if (phase === 'wait') {
      float.classList.toggle('nib', !!nibAt && now > nibAt && now < nibAt + 350);
      if (now >= biteAt && !shown) { shown = true; biteEnd = now + [0, 900, 700, 520][zone] + D_BITE[K()] + cur.p * 260 - (cur.f.pearl ? 180 : 0); float.classList.add('bite'); mark.textContent = '!'; splash(fx); sfx('bite'); }
      if (!shown) fishEl.style.left = fx + (1 - Math.min(1, (now - t0) / (biteAt - t0))) * 65 + (nibAt && now > nibAt && now < nibAt + 350 ? -3 : 4) + '%'; else fishEl.style.left = fx + '%';
      if (stormAt && now > stormAt) return void storm();
      if (shown && now > biteEnd) fail('놓쳤어요. 미끼만 먹고 갔어요.');
    } else if (phase === 'fight') {
      if (stormAt && now > stormAt) return void storm();
      const d = cur.d;
      if (!burst && now > nextBurst) { burst = now + (450 + d * 50); } if (burst && now > burst) { burst = 0; nextBurst = now + Math.max(1100, 3000 - d * 150) * rnd(0.7, 1.3); }
      const B = !!burst, TM = ZONE_TEN[zone] * D_TEN[K()], LO = cur.f.icon ? 0 : BAND_LO[zone] - D_BAND[K()]; pat -= dt; patEl.firstChild.style.width = Math.max(0, pat / pat0 * 100) + '%'; patEl.classList.toggle('low', pat < pat0 * 0.3);
      if (pat <= 0) { delete fishEl.dataset.rev; return void fail(taps >= 4 ? '물고기가 눈치채고 떠났어요. 찔끔찔끔 감으면 안 돼요.' : '너무 오래 끌었어요. 물고기가 바늘을 털고 떠났어요.'); }
      wrap.classList.toggle('reel', hold); if (hold && now > clickAt) { clickAt = now + (B ? 150 : 75); sfx('reel'); } if (ten > BRK() - 6 && now > creakAt) { creakAt = now + 260; sfx('strain'); }
      // 화내기: 0.4초 동안 빨갛게 부르르 떨다가(신호) 팔짝 뛰면서 줄이 확 팽팽해진다
      if (!tele && now > nextSpike) { tele = now + TELE; fishEl.classList.add('mad'); sfx('tock'); }
      if (tele && now >= tele) { tele = 0; const two = zone === 3 && cur.f.tier === 4 && !spk2; spk2 = two; nextSpike = now + (two ? 1100 : rnd(...SPIKE_GAP[zone]) * 1000); /* 고급 바다 초희귀: 짧은 간격으로 두 번 연달아 튄다 */ ten += SPIKE[zone] * TM * (hold ? 1 : 0.5); fishEl.classList.remove('mad'); fishEl.classList.add('jump'); setTimeout(() => fishEl.classList.remove('jump'), 520); splash(fx, true); sfx('splash'); bar.classList.add('spike'); setTimeout(() => bar.classList.remove('spike'), 300); }
      if (hold) { dist -= (cur.f.icon ? 34 : Math.max(7, 27 - d * 1.5) * ZONE_REEL[zone] * (ten >= LO ? 1 : 0.15)) * (1 + cur.p * 0.2) * D_REEL[K()] * dt * (B ? 0.5 : 1); ten += (25 + d * 1.1) * 1.12 * TM * (1 - cur.p * 0.25) * (B ? 1.35 : 1) * dt; } // 멀리 던졌으면 더 잘 감기고 줄이 덜 팽팽해진다
      else { ten -= (50 - d * 0.8) * dt; dist += (0.8 + d * 0.42) * 1.2 * (B ? 1.4 : 1) * dt; }
      // 끊어짐 칸(BREAK)을 건드리면 한 번으로 센다. 줄이 튕기며 물고기가 조금 달아나고, 정해진 횟수를 다 쓰면 놓친다
      if (ten >= BRK()) { strikes++; drawPips(true); if (strikes >= lim()) { delete fishEl.dataset.rev; return void (cur.f.icon ? landed() : fail(`줄이 끊어졌어요! 끊어짐 칸을 ${lim()}번 건드렸어요.`)); }
        ten = Math.max(LO + 2, BRK() - 22); dist += 6; hold = false; sfx('strain'); wrap.classList.add('jolt'); setTimeout(() => wrap.classList.remove('jolt'), 300); say(lim() - strikes === 1 ? '줄이 끊어질 뻔! 한 번만 더 건드리면 놓쳐요. 손을 뗐다가 다시 감으세요.' : `줄이 끊어질 뻔! ${lim() - strikes}번 더 건드리면 놓쳐요.`, 'warn'); }
      ten = Math.max(0, ten); slack = ten < 6 && !B ? slack + dt : 0;
      setBar(ten, 'ten' + (ten >= LO ? ' hot' : '') + (B ? ' burst' : '')); setFloat(34 + Math.max(0, Math.min(130, dist)) * 0.45, 8, true); fishEl.style.left = fx + '%'; fishEl.classList.toggle('burst', B); mark.textContent = tele ? '💥' : B ? '💢' : now < eyeAt ? '👀' : '';
      if (dist < 45 && cur.f.icon && !fishEl.dataset.rev) { fishEl.dataset.rev = 1; fishEl.innerHTML = fishSvg(cur.f); say('어… 쓰레기 같아요. 걸린 이상 꼭 수거해야 해요!', 'warn'); }
      if (cur.f.icon && (dist >= 130 || strikes >= lim() || slack > 2.4 - Math.min(1.2, d * 0.1))) { delete fishEl.dataset.rev; return void landed(); } // 쓰레기는 걸리면 놓아줄 수 없다: 놓치려 해도 그대로 끌어올려 수거(돈이 빠진다)
      if (dist >= 130) { delete fishEl.dataset.rev; return void fail('물고기가 멀리 달아났어요.'); }
      if (slack > 2.4 - Math.min(1.2, d * 0.1)) { delete fishEl.dataset.rev; return void fail('줄이 느슨해져서 바늘이 빠졌어요.'); }
      if (dist <= 0) { delete fishEl.dataset.rev; landed(); }
    }
  }
  document.body.append(wrap); ready(); last = performance.now(); raf = requestAnimationFrame(step);
  return { close };
}

// ----- 갈매기 해적단: 항해하던 바다 위에서 그대로, 멀리 떨어져 포를 번갈아 쏜다 -----
// 서로 4방이면 끝난다. 내가 빗나갈 때마다 해적단의 정확도가 오르고, 연달아 두 번 빗나가면 해적단의 다음 포는 반드시 맞는다
// e = { world, stage, panel, zone, meEl, boatEl, shout(t), me:{x, y(바닥에서 px), s}, foeX, balls(), useBall(), cam(x), onEnd(win) }
const SHIP_SVG = `<svg viewBox="0 0 170 130"><path d="M96 74 V8" stroke="#5A3B22" stroke-width="5" stroke-linecap="round"/><path d="M93 12 L44 38 L93 62z" fill="#3A3A44" stroke="#1F1F26" stroke-width="2" stroke-linejoin="round"/><circle cx="74" cy="36" r="7" fill="#fff"/><circle cx="71.6" cy="35" r="1.6" fill="#1F1F26"/><circle cx="76.4" cy="35" r="1.6" fill="#1F1F26"/><path d="M66 43 l16 5M82 43 l-16 5" stroke="#fff" stroke-width="2.4" stroke-linecap="round"/><path d="M96 8 h20 q-4 6 0 12 h-20z" fill="#1F1F26"/><path d="M6 72 H164 Q160 112 132 116 H40 Q12 112 6 72z" fill="#6B4A32" stroke="#2E1E12" stroke-width="2.4" stroke-linejoin="round"/><path d="M9 86 H161" stroke="#C0392B" stroke-width="7"/><circle cx="60" cy="100" r="5" fill="#2E1E12"/><circle cx="90" cy="100" r="5" fill="#2E1E12"/><circle cx="120" cy="100" r="5" fill="#2E1E12"/><g class="gun-b" style="transform-origin:42px 56px"><rect x="2" y="45" width="52" height="21" rx="9" fill="#3E3E48" stroke="#1F1F26" stroke-width="2"/><rect x="1" y="42" width="9" height="27" rx="4" fill="#2A2A33" stroke="#1F1F26" stroke-width="1.5"/></g><circle cx="40" cy="67" r="11" fill="#3A2A1E" stroke="#1F140C" stroke-width="2"/><path d="M-2 118 q14 -9 28 0 t28 0 t28 0 t28 0 t28 0 t28 0 t28 0" fill="none" stroke="#fff" stroke-width="4" stroke-linecap="round" opacity=".8"/></svg>`;
export function seaBattle(e) {
  const G = 520, me = e.me, dir = e.foeX > me.x ? 1 : -1, D0 = Math.abs(e.foeX - me.x), VMAX = Math.sqrt((D0 + 400) * G), // 서로 멀어져도 힘 100이면 닿는다
     HITR = 68 * me.s, HITH = 80 * me.s, HITS = 4, FOE_HITS = e.gun2 ? 2 : HITS, // 신형 대포(카피 별빛포)는 2방이면 해적선이 가라앉는다. 배 반 너비와 높이: 포탄이 배나 캐릭터에 닿으면 무조건 맞은 것이다
     BALL_PX = Math.round(20 * me.s), A0 = 45, P0 = 60;
  const PX = 41 * me.s, PY = 46 * me.s, BL = 36 * me.s, DROP = 16 * me.s; // 포신 축(배 가운데에서)과 포신 길이, 배 바닥이 기준선보다 내려간 만큼
  const my0 = me.x, foe0 = e.foeX, BUDGET = 160, RANGE = 240, NEAR = 320; let foeX = e.foeX, foeTo = foeX, moved = 0;
  // 배 움직이기: 한 차례에 40m, 처음 자리에서 앞뒤 60m까지, 해적선과 80m보다 가까이는 못 간다
  const dist = () => Math.abs(foeX - me.x);
  // 배가 파도에 흔들리는 만큼(기울기·높이) 포구와 쏘는 각도도 같이 움직인다
  const sway = el => { const cs = getComputedStyle(el), r = parseFloat(cs.rotate) || 0, t = cs.translate && cs.translate !== 'none' ? parseFloat(cs.translate.split(' ')[1]) || 0 : 0; return { r, up: -t }; };
  const muzzle = (el, x0, d, a) => { const w = sway(el), ph = -w.r * Math.PI / 180, rx = d * (PX + BL * Math.cos(a)), ry = PY + DROP + BL * Math.sin(a); return { x: x0 + rx * Math.cos(ph) - ry * Math.sin(ph), y: -DROP + rx * Math.sin(ph) + ry * Math.cos(ph) + w.up, a: a - w.r * d * Math.PI / 180 }; };
  let alive = true, raf = 0, last = 0, turn = 'intro', shot = null, wind = 0, myHp = HITS, foeHp = FOE_HITS, camX = me.x, camTo = me.x, timer = 0, next = null, round = 0, still = 0, sailing = 0;
  const pips = n => h('div', { class: 'sb-hp' }, ...Array.from({ length: n }, () => h('i')));
  const foeEl = h('div', { class: 'so-boat sb-foe hv' + e.zone, style: { left: foeX + 'px', bottom: me.y + 'px', transform: `scale(${(dir * me.s).toFixed(3)}, ${me.s.toFixed(3)})`, zIndex: 12 } }, h('div', { class: 'sb-crew a', html: gullSvg(true) }), h('div', { class: 'sb-crew b', html: gullSvg(false) }), h('div', { class: 'sb-ship', html: FLUFFY ? shipImg() : SHIP_SVG }));
  const fHp = pips(FOE_HITS), mHp = pips(HITS), ball = h('i', { class: 'sb-ball', style: { display: 'none', width: BALL_PX + 'px', height: BALL_PX + 'px', margin: `0 0 ${-BALL_PX / 2}px ${-BALL_PX / 2}px` } }), dots = [0, 1, 2, 3, 4, 5].map(() => h('i', { class: 'sb-dot' }));
  fHp.style.bottom = me.y + 132 * me.s + 'px'; mHp.style.bottom = me.y + 122 * me.s + 'px'; e.world.append(foeEl, fHp, mHp, ball, ...dots);
  if (e.gun2 && /[?&]sbtest/.test(location.search)) window.__sbHit = () => { starHit(foeX, 20); foeHp--; hp(); }; // 별빛포 명중 이펙트 확인용
  const place = () => { foeEl.style.left = fHp.style.left = foeX + 'px'; mHp.style.left = me.x + 'px'; };
  const myGun = () => e.boatEl.querySelector('.gun-b'), foeGun = foeEl.querySelector('.gun-b'), setGun = (g, deg, sgn = 1) => { if (g) g.style.transform = `rotate(${-deg * sgn}deg)`; }; // 해적 포신은 왼쪽을 보고 있어서 반대로 돌린다
  const ang = h('input', { type: 'range', min: 10, max: 80, value: A0 }), pow = h('input', { type: 'range', min: 20, max: 100, value: P0 }), aV = h('b'), pV = h('b'), msg = h('p', { class: 'sb-msg' }), info = h('span', { class: 'sb-info' }), fire = h('button', { class: 'sb-fire', onClick: shoot }, h('span', null, '💣'), h('b', null, '발사'));
  const fleeB = h('button', { class: 'sb-flee', onClick: async () => { if (!alive || fled) return; fled = true; fleeB.disabled = true; if (!(await e.flee())) { fled = false; fleeB.disabled = false; return; } alive = false; clean(); e.onEnd('flee'); } }, h('span', null, '🏳️ 도망'), h('small', null, `${FLEE_FEE}코인`)); let fled = false;
  const nudge = (inp, d) => h('button', { class: 'sb-nd', onClick: () => { inp.value = +inp.value + d; lab(); } }, d < 0 ? '−' : '+');
  const row = (ic, nm, inp, val, cls) => h('div', { class: 'sb-row ' + cls }, h('div', { class: 'sb-rl' }, h('span', null, ic + ' ' + nm), val), h('div', { class: 'sb-sl' }, nudge(inp, -1), inp, nudge(inp, 1)));
  const mvL = h('span', { class: 'sb-mvl' }), mvB = h('button', { class: 'sb-mv' }, dir > 0 ? '◀ 뒤로' : '◀ 앞으로'), mvF = h('button', { class: 'sb-mv' }, dir > 0 ? '앞으로 ▶' : '뒤로 ▶'); holdBtn(mvB, () => { sailing = -dir; }, () => { sailing = 0; }); holdBtn(mvF, () => { sailing = dir; }, () => { sailing = 0; }); // 버튼 화살표 방향 = 화면에서 움직이는 방향(해적선이 왼쪽에 있으면 왼쪽이 '앞으로')
  e.panel.replaceChildren(h('div', { class: 'sb-move' }, mvB, h('div', { class: 'sb-mid' }, info, mvL), mvF), h('div', { class: 'sb-mrow' }, msg, fleeB), h('div', { class: 'sb-deck' }, h('div', { class: 'sb-ctl' }, row('📐', '각도', ang, aV, 'ang'), row('💪', '힘', pow, pV, 'pow')), fire)); e.panel.hidden = false;
  // 명중률: 차례가 거듭될수록 조금씩 오른다. 중급은 낮게, 고급은 조금 높게, 너무 높아지지 않게 위를 막는다
  const acc = () => (e.zone === 3 ? Math.min(0.55, 0.12 + round * 0.06) : Math.min(0.4, 0.06 + round * 0.05));
  const windTxt = () => (wind ? `바람 ${wind * dir > 0 ? '뒤에서' : '앞에서'} ${Math.abs(wind)}` : '바람 없음');
  const fill = inp => { inp.style.setProperty('--p', (inp.value - inp.min) / (inp.max - inp.min) * 100 + '%'); };
  function lab() { aV.textContent = ang.value + '°'; pV.textContent = pow.value; fill(ang); fill(pow); info.textContent = `포탄 ${e.balls()} · 거리 ${Math.round(dist() / 4)}m · ${windTxt()}`; if (turn === 'me' || turn === 'intro') setGun(myGun(), +ang.value); const on = turn === 'me' && alive && !shot; mvB.disabled = !on || moved >= BUDGET; mvF.disabled = !on || moved >= BUDGET; mvL.textContent = `꾹 눌러 배 움직이기 · 이번 차례 ${Math.max(0, Math.round((BUDGET - moved) / 4))}m 남음`; } ang.oninput = pow.oninput = lab;
  const hp = () => { [...fHp.children].forEach((n, k) => n.classList.toggle('off', k >= foeHp)); [...mHp.children].forEach((n, k) => n.classList.toggle('off', k >= myHp)); };
  const fly = (x, y, vx, vy, t) => { for (let k = 0; k < t / 0.016; k++) { vx += wind * 0.016; vy -= G * 0.016; x += vx * 0.016; y += vy * 0.016; if (y <= 0) break; } return { x, y }; };
  function aim() { const on = turn === 'me' && alive && !shot; if (!on) return dots.forEach(d => { d.style.display = 'none'; }); const v = pow.value / 100 * VMAX, m = muzzle(e.boatEl, me.x + 3, dir, ang.value * Math.PI / 180); dots.forEach((d, k) => { d.style.display = ''; const q = fly(m.x, m.y, dir * Math.cos(m.a) * v, Math.sin(m.a) * v, 0.07 * (k + 1)); d.style.left = q.x + 'px'; d.style.bottom = me.y + q.y + 'px'; }); } // 조준 도움선은 앞부분만, 배가 흔들리면 같이 흔들린다
  // 내 차례에는 버튼을 누르고 있는 동안 배가 앞뒤로 미끄러지듯 움직인다(한 차례에 40m까지). 5m 넘게 움직이면 해적단이 재던 거리가 흐트러진다
  function sail(sgn, dt) { if (turn !== 'me' || shot || !alive || moved >= BUDGET) return; const lo = Math.max(e.minX, my0 - RANGE), hi = Math.min(e.maxX, my0 + RANGE); let nx = Math.max(lo, Math.min(hi, me.x + sgn * dir * Math.min(95 * dt, BUDGET - moved))); if (Math.abs(foeX - nx) < NEAR) nx = foeX - dir * NEAR; if (nx === me.x || (nx - me.x) * sgn * dir < 0) return;
    const was = moved; moved += Math.abs(nx - me.x); me.x = nx; e.move(nx); place(); camTo = me.x + dir * 90; if (was < 20 && moved >= 20) { if (still) msg.textContent = '배를 움직였어요! 해적단이 거리를 다시 재야 해요.'; still = 0; sfx('point'); } lab(); }
  const clean = () => { cancelAnimationFrame(raf); [foeEl, fHp, mHp, ball, ...dots].forEach(n => n.remove()); e.world.querySelectorAll('.sb-fx').forEach(n => n.remove()); setGun(myGun(), 0); e.panel.hidden = true; e.panel.replaceChildren(); e.cam(null); };
  function end(win, text) { if (!alive) return; alive = false; aim(); lab(); msg.textContent = text; fire.lastChild.textContent = '확인'; fire.firstChild.textContent = win ? '🏆' : '🏳️'; fire.disabled = false; fire.classList.add('done'); camTo = me.x; fire.onclick = () => { clean(); e.onEnd(win); }; }
  function myTurn() { turn = 'me'; moved = 0; ang.value = A0; pow.value = P0; wind = Math.round(rnd(-60, 60)); camTo = me.x + dir * 90; lab(); if (e.balls() <= 0) return end(false, '포탄이 떨어졌어요! 해적단에게 당했어요.'); msg.textContent = still >= 1 ? '⚠️ 가만히 있으면 해적단의 다음 포는 반드시 맞아요! 배를 움직이세요.' : '내 차례! 각도와 힘을 맞춰 쏘세요.'; fire.disabled = false; }
  function puff(x, y) { const f = h('i', { class: 'sb-fx sb-puff', style: { left: x + 'px', bottom: me.y + y + 'px' } }); e.world.append(f); setTimeout(() => f.remove(), 500); }
  const kick = (...els) => { els.forEach(n => n.classList.add('sb-kick')); setTimeout(() => els.forEach(n => n.classList.remove('sb-kick')), 260); };
  function shoot() { if (turn !== 'me' || shot || !alive || fled) return; fleeB.hidden = true; e.useBall(); sfx('cannon'); const v = pow.value / 100 * VMAX, m = muzzle(e.boatEl, me.x + 3, dir, ang.value * Math.PI / 180); shot = { x: m.x, y: m.y, vx: dir * Math.cos(m.a) * v, vy: Math.sin(m.a) * v, by: 'me' }; puff(m.x, m.y); ball.classList.toggle('star', !!e.gun2); if (e.gun2) starMuzzle(m.x, m.y); kick(e.boatEl, e.meEl); fire.disabled = true; turn = 'fly'; lab(); aim(); msg.textContent = '날아갑니다…'; }
  function foeShoot() { turn = 'foe'; wind = Math.round(rnd(-60, 60)); lab(); camTo = foeX - dir * 90;
    // 맞힐지 빗나갈지 먼저 정하고, 그 자리에 떨어지는 각도와 힘을 찾는다 빗나갈 때는 내 앞에 떨어지거나 머리 위로 넉넉히 넘어간다(배에 스치면 맞은 것이 되므로)
    still++; const sure = still >= 2, hitNow = sure || Math.random() < acc(), want = me.x + (hitNow ? rnd(-14, 14) : Math.random() < 0.5 ? dir * rnd(HITR + 25, HITR + 150) : -dir * rnd(HITR + 120, HITR + 240)); if (sure) still = 0; round++;
    msg.textContent = sure ? '가만히 있었더니 해적단이 거리를 다 쟀어요! 피할 수 없어요!' : '갈매기 해적단이 포를 겨눠요!'; let best = { e: 1e9, a: 0.8, v: VMAX * 0.7 };
    for (let a = 0.72; a < 1.15; a += 0.05) for (let v = VMAX * 0.45; v <= VMAX * 1.15; v += VMAX / 90) { const q = fly(foeX - dir * (PX + BL * Math.cos(a)), PY + BL * Math.sin(a), -dir * Math.cos(a) * v, Math.sin(a) * v, 9), er = Math.abs(q.x - want); if (er < best.e) best = { e: er, a, v }; }
    setGun(foeGun, best.a * 180 / Math.PI, -1);
    timer = 1.2; next = () => { sfx('cannon'); const mx = foeX - dir * (PX + BL * Math.cos(best.a)), my = PY + BL * Math.sin(best.a); shot = { x: mx, y: my, vx: -dir * Math.cos(best.a) * best.v, vy: Math.sin(best.a) * best.v, by: 'foe' }; puff(mx, my); ball.classList.remove('star'); kick(foeEl); turn = 'fly'; }; }
  // 한 발 쏘고 난 틈에 해적선이 앞뒤로 조금 움직일 수 있다. 움직이면 화면이 해적선을 비춘다
  function foeDrift(then) { if (Math.random() > 0.55) return then(); const to = Math.max(Math.min(foe0 - 140, foe0 + 140), Math.min(Math.max(foe0 - 140, foe0 + 140), Math.max(e.minX, Math.min(e.maxX, foeX + (Math.random() < 0.5 ? -1 : 1) * rnd(50, 130))))); if (Math.abs(to - foeX) < 20 || Math.abs(to - me.x) < NEAR + 40) return then();
    const closer = Math.abs(to - me.x) < dist(); foeTo = to; turn = 'drift'; camTo = to - dir * 60; setGun(foeGun, 0, -1); msg.textContent = `해적선이 ${closer ? '다가와요' : '물러나요'}! (${Math.round(Math.abs(to - foeX) / 4)}m)`; next = then; timer = 0; }
  // 카피 별빛포 명중: 분홍 번쩍 + 충격파 → 큰 불꽃·별빛 조각·나무 파편·깃털·"명중!" → 맞은 자리에 구멍과 연기·불씨가 남고 갈매기가 펄쩍
  // 별빛포: 쏠 때 별 불꽃, 날아가는 동안 별 꼬리, 맞으면 겹겹이 퍼지는 고리·빛살·별 폭죽·별비
  let trailAt = 0; const STARC = ['#FF9BE0', '#C9A0FF', '#FFE066', '#9BE7FF', '#fff'];
  function starTrail(x, y) { const t = performance.now(); if (t - trailAt < 26) return; trailAt = t; const n = h('i', { class: 'sb-fx sb-trail', style: { left: x + 'px', bottom: me.y + Math.max(0, y) + 'px', '--r': rnd(-50, 50).toFixed(0) + 'deg', '--x': rnd(-10, 10).toFixed(0) + 'px', color: STARC[Math.floor(rnd(0, 4.99))] } }, Math.random() < 0.3 ? '★' : '✦'); e.world.append(n); setTimeout(() => n.remove(), 700); }
  function starMuzzle(x, y) { const f = h('div', { class: 'sb-fx sb-smuz', style: { left: x + 'px', bottom: me.y + y + 'px' } }, ...Array.from({ length: 10 }, (_, k) => h('i', { style: { '--a': (k * 36).toFixed(0) + 'deg', color: STARC[k % 5] } }, '✦'))); e.world.append(f); setTimeout(() => f.remove(), 650); }
  function starHit(x, y) {
    const fl = h('div', { class: 'sb-starflash' }); e.stage.append(fl); setTimeout(() => fl.remove(), 700);
    const fl2 = h('div', { class: 'sb-starflash f2' }); e.stage.append(fl2); setTimeout(() => fl2.remove(), 1300);
    setTimeout(() => { if (!alive) return; e.stage.classList.remove('sb-quake'); void e.stage.offsetWidth; e.stage.classList.add('sb-quake'); setTimeout(() => e.stage.classList.remove('sb-quake'), 420); sfx('point'); }, 260);
    const at = (cls, kids = []) => { const n = h('div', { class: 'sb-fx ' + cls, style: { left: x + 'px', bottom: me.y + y + 'px' } }, ...kids); e.world.append(n); setTimeout(() => n.remove(), 1900); return n; };
    at('sb-rays'); at('sb-ring'); at('sb-ring r2'); at('sb-ring r3'); at('sb-boom2');
    at('sb-rain', Array.from({ length: 16 }, (_, k) => h('i', { style: { '--x': rnd(-120, 120).toFixed(0) + 'px', '--h': rnd(70, 150).toFixed(0) + 'px', '--t': rnd(0.15, 0.6).toFixed(2) + 's', color: STARC[k % 5] } }, k % 3 ? '✦' : '★')));
    const bits = [...Array.from({ length: 22 }, (_, k) => h('i', { class: 'st' + (k % 3 === 0 ? ' big' : ''), style: { '--a': (k * 16.4 + rnd(-8, 8)).toFixed(0) + 'deg', '--d': rnd(55, 150).toFixed(0) + 'px', color: STARC[k % 5] } }, k % 4 === 0 ? '★' : '✦')),
      ...Array.from({ length: 6 }, (_, k) => h('i', { class: 'ch', style: { '--a': (k * 60 + rnd(-20, 20)).toFixed(0) + 'deg', '--d': rnd(50, 90).toFixed(0) + 'px', '--r': rnd(-300, 300).toFixed(0) + 'deg' } })),
      ...Array.from({ length: 3 }, (_, k) => h('i', { class: 'fe', style: { '--a': (240 + k * 30).toFixed(0) + 'deg', '--d': rnd(50, 80).toFixed(0) + 'px', '--r': rnd(-90, 90).toFixed(0) + 'deg' } }))];
    at('sb-bits', bits); at('sb-hitword', [h('b', null, '명중!')]);
    foeEl.classList.remove('sb-tilt'); void foeEl.offsetWidth; foeEl.classList.add('sb-tilt'); setTimeout(() => foeEl.classList.remove('sb-tilt'), 900);
    foeEl.querySelectorAll('.sb-crew').forEach(c => { c.classList.remove('sb-jump'); void c.offsetWidth; c.classList.add('sb-jump'); });
    const ship = foeEl.querySelector('.sb-ship'); setTimeout(() => { if (!alive) return; ship.append(h('i', { class: 'sb-hole', style: { left: rnd(28, 62).toFixed(0) + '%', bottom: rnd(14, 28).toFixed(0) + '%', rotate: rnd(-30, 30).toFixed(0) + 'deg' } }, h('i', { class: 'sm' }), h('i', { class: 'em' }))); }, 350); }
  function fx(cls, x, n, y = 0) { const f = h('div', { class: 'sb-fx ' + cls, style: { left: x + 'px', bottom: me.y + y + 'px' } }, ...Array.from({ length: n }, (_, k) => h('i', { style: { '--a': (k / n * 360 + rnd(-12, 12)).toFixed(0) + 'deg', '--d': rnd(26, 62).toFixed(0) + 'px', '--t': rnd(0, 0.12).toFixed(2) + 's' } }))); e.world.append(f); setTimeout(() => f.remove(), 1100); }
  function land(s, touched) { let hurtD = null; const mine = s.by === 'me', tx = mine ? foeX : me.x, d = Math.abs(s.x - tx), hit = !!touched || d < HITR; ball.style.display = 'none'; const ix = s.x;
    if (hit) { sfx('boom'); fx('sb-bang', ix, 10, Math.max(0, s.y - 20)); e.stage.classList.add('sb-quake'); setTimeout(() => e.stage.classList.remove('sb-quake'), 420); const els = mine ? [foeEl] : [e.boatEl, e.meEl]; els.forEach(n => n.classList.add('sb-hit')); setTimeout(() => els.forEach(n => n.classList.remove('sb-hit')), 600);
      if (mine && e.gun2) starHit(ix, Math.max(0, s.y - 20));
      if (mine) foeHp--; else { myHp--; hurtD = e.onHurt ? e.onHurt() : null; } hp(); }
    else { sfx('splash'); fx('sb-water', ix, 9); }
    const off = Math.round(d / 4), short = (s.x - tx) * dir < 0;
    msg.textContent = mine ? (hit ? `명중! 앞으로 ${foeHp}방!` : `${off}m ${short ? '짧았어요' : '넘어갔어요'}. (해적단 명중률 ${Math.round(acc() * 100)}%)`) : (hit ? `으악, 맞았어요! 내 배는 앞으로 ${myHp}방…${hurtD != null ? ` (배 내구도 -${PIRATE_HIT}, 남은 ${hurtD})` : ''}` : '해적단의 포가 빗나갔어요.');
    shot = null; if (foeHp <= 0) return end(true, '갈매기 해적단을 물리쳤어요! 보물을 챙겼어요.'); if (myHp <= 0) return end(false, '배가 크게 부서졌어요…');
    timer = 1.4; next = () => foeDrift(mine ? foeShoot : myTurn); }
  function step(now) { const dt = Math.min(0.033, (now - last) / 1000); last = now;
    if (alive) { if (timer > 0) { timer -= dt; if (timer <= 0 && next) { const f = next; next = null; f(); } }
      if (turn === 'drift') { const d = foeTo - foeX, st = 70 * dt; if (Math.abs(d) <= st) { foeX = foeTo; place(); turn = 'wait'; lab(); msg.textContent += ` 이제 거리 ${Math.round(dist() / 4)}m`; timer = 0.9; } else { foeX += Math.sign(d) * st; place(); } }
      if (turn === 'me') { if (sailing) sail(sailing, dt); aim(); }
      if (shot) { shot.vx += wind * dt; shot.vy -= G * dt; shot.x += shot.vx * dt; shot.y += shot.vy * dt; ball.style.display = ''; ball.style.left = shot.x + 'px'; ball.style.bottom = me.y + Math.max(0, shot.y) + 'px'; if (e.gun2 && shot.by === 'me') starTrail(shot.x, shot.y); camTo = shot.x; const tx = shot.by === 'me' ? foeX : me.x; if (Math.abs(shot.x - tx) < HITR && shot.y < HITH && shot.y > 0) land(shot, true); else if (shot.y <= 0) land(shot); } }
    camX += (camTo - camX) * Math.min(1, dt * 5); e.cam(camX); raf = requestAnimationFrame(step); }
  // 등장: 먼저 외치고, 화면이 해적선 위치를 보여 준 다음 다시 내 보트로 돌아와 내 차례
  place(); hp(); lab(); fire.disabled = true; e.shout('앗! 해적선이다!'); sfx('bad'); msg.textContent = '앗! 해적선이다!'; timer = 1.1; next = () => { camTo = foeX - dir * 60; msg.textContent = '갈매기 해적단이 나타났어요! 서로 4방이면 끝나요.'; timer = 2.2; next = () => { camTo = me.x + dir * 90; timer = 0.9; next = myTurn; }; };
  last = performance.now(); raf = requestAnimationFrame(step);
  return { stop() { alive = false; clean(); } };
}
