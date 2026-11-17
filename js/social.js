// 동물 친목회 — 놀이터에서 동물 30마리와 말하고, 선물하고, 거래한다. 친밀도와 기억은 사람마다 따로다
import { h, toast, modal, gameFx, holdBtn } from './ui.js';
import { capy, PIN_CHEST } from './capy.js';
import { ANIMALS, animalSvg } from './animals.js';
import { ZOO_HATS } from './clothes.js';
import { priceOf, won } from './money.js';
import { sfx, animalVoice, bgm } from './sound.js';
import { makeVoice } from './walk.js';
import { PUSH_URL } from './push.js';
import { isMock } from './store.js';
import { openFishing, seaBattle, PIRATE_LOOT, FLEE_FEE, FISH, RODS, ZONES, BAIT, BALL, CANNON, WBOAT, BOAT_FIX, fishSvg } from './fishing.js';

// 동물마다: 성격, 좋아하는 것, 싫어하는 것, 상징 액세서리, 제일 좋아하는 선물
const P = (trait, likes, hates, pin, fav) => ({ trait, likes, hates, pin, fav });
export const PERSONA = [
  P('사람을 좋아하는 명랑한 성격', ['산책', '공놀이', '간식'], ['목욕', '혼자'], '🦴', 'candy'), P('도도하지만 속은 다정한 성격', ['생선', '낮잠', '햇볕'], ['물', '시끄러'], '🐟', 'flower'),
  P('겁이 많고 수줍은 성격', ['치즈', '조용', '책'], ['고양이', '큰 소리'], '🧀', 'candy'), P('먹는 걸 좋아하는 느긋한 성격', ['해바라기씨', '쳇바퀴', '간식'], ['다이어트', '배고'], '🌻', 'cake'),
  P('발랄하고 호기심 많은 성격', ['당근', '달리기', '달'], ['늑대', '느리'], '🥕', 'flower'), P('꾀가 많고 장난스러운 성격', ['포도', '수수께끼', '장난'], ['사냥', '지루'], '🍇', 'cake'),
  P('듬직하고 인심 좋은 성격', ['꿀', '낚시', '겨울잠'], ['벌', '춥'], '🍯', 'cake'), P('태평하고 먹보인 성격', ['대나무', '뒹굴', '낮잠'], ['운동', '바쁘'], '🎋', 'candy'),
  P('잠이 많고 말이 느린 성격', ['유칼립투스', '잠', '나무'], ['시끄러', '서두르'], '🌿', 'flower'), P('자존심 세고 용감한 성격', ['고기', '사냥', '줄무늬'], ['고양이라', '약하'], '🥩', 'cake'),
  P('대장 노릇을 좋아하는 당당한 성격', ['갈기', '왕', '낮잠'], ['무시', '졸병'], '👑', 'cake'), P('순하고 성실한 성격', ['풀', '우유', '들판'], ['서두르', '소고기'], '🥛', 'flower'),
  P('깔끔 떠는 미식가 성격', ['사과', '진흙', '맛집'], ['더럽', '삼겹살'], '🍎', 'cake'), P('노래를 좋아하는 낙천적인 성격', ['비', '연못', '노래'], ['가뭄', '뱀'], '🪷', 'candy'),
  P('장난꾸러기에 흉내를 잘 내는 성격', ['바나나', '나무타기', '장난'], ['가만히', '숙제'], '🍌', 'candy'), P('아침형이고 잔소리 많은 성격', ['옥수수', '아침', '알'], ['늦잠', '치킨'], '🌽', 'flower'),
  P('예의 바르고 꼼꼼한 성격', ['생선', '얼음', '썰매'], ['더위', '지각'], '🧊', 'candy'), P('아기 같고 애교 많은 성격', ['좁쌀', '엄마', '따뜻'], ['혼자', '무서'], '🌼', 'candy'),
  P('수다스럽고 친구가 많은 성격', ['연못', '빵', '수영'], ['사냥꾼', '조용히'], '🫧', 'flower'), P('아는 게 많은 밤샘 학자 성격', ['밤', '책', '별'], ['낮', '시끄러'], '🌙', 'flower'),
  P('무뚝뚝하지만 의리 있는 성격', ['달', '달리기', '친구'], ['배신', '거짓말'], '🌕', 'cake'), P('씩씩하고 단순한 성격', ['고구마', '돌진', '흙'], ['울타리', '돼지라'], '🍠', 'candy'),
  P('멋 부리기를 좋아하는 달리기 선수 성격', ['당근', '달리기', '바람'], ['느리', '채찍'], '🥇', 'flower'), P('꿈 많고 반짝이는 걸 좋아하는 성격', ['무지개', '별', '반짝'], ['말이라', '평범'], '🌈', 'cake'),
  P('느긋하고 지혜로운 성격', ['바다', '산책', '상추'], ['서두르', '토끼'], '🐚', 'flower'), P('손재주 좋은 요리사 성격', ['바다', '요리', '먹물'], ['문어숙회', '타코야키'], '⚓', 'cake'),
  P('재주 많고 박수받기 좋아하는 성격', ['공', '생선', '박수'], ['더위', '무관심'], '🏐', 'candy'), P('까칠해 보여도 정 많은 성격', ['버섯', '낙엽', '밤'], ['찌르', '풍선'], '🍄', 'flower'),
  P('부지런하고 모으기 좋아하는 성격', ['도토리', '나무', '저축'], ['낭비', '겨울'], '🌰', 'candy'), P('호기심 많고 손 씻기 좋아하는 성격', ['손 씻', '보물', '밤'], ['더럽', '도둑이라'], '🧺', 'cake'),
];
// 동물마다 말투: [말끝에 붙는 소리, AI에게 알려 주는 말투 설명]
export const TONE = [['멍', '신나서 들뜬 말투, 말끝마다 "멍"'], ['냥', '도도하고 새침한 말투, 말끝에 "냥"'], ['찍', '소심해서 더듬는 말투, 말끝에 "찍"'], ['뀨', '느긋하고 먹는 얘기를 섞는 말투, 말끝에 "뀨"'], ['깡총', '발랄하고 빠른 말투, 말끝에 "깡총"'], ['캥', '능글맞게 놀리는 말투, 말끝에 "캥"'],
  ['곰', '느리고 듬직한 아저씨 말투, 말끝에 "곰"'], ['뿌', '태평하고 늘어지는 말투, 말끝에 "뿌"'], ['음냐', '졸려서 말을 늘이는 말투, 말끝에 "음냐"'], ['어흥', '허세 부리는 센 말투, 말끝에 "어흥"'], ['크앙', '왕처럼 거만한 말투("짐은", "~하도다"), 말끝에 "크앙"'], ['음메', '순하고 느린 시골 말투, 말끝에 "음메"'],
  ['꿀', '까다로운 미식가 말투, 말끝에 "꿀"'], ['개굴', '노래하듯 흥얼거리는 말투, 말끝에 "개굴"'], ['우끼', '장난치며 깔깔대는 말투, 말끝에 "우끼"'], ['꼬꼬', '잔소리하는 엄마 말투, 말끝에 "꼬꼬"'], ['펭', '깍듯한 존댓말("~입니다", "~하십시오"), 말끝에 "펭"'], ['삐약', '아기처럼 혀 짧은 말투, 말끝에 "삐약"'],
  ['꽥', '수다스럽고 말이 많은 말투, 말끝에 "꽥"'], ['부엉', '점잖은 학자 말투("~하는 법이지", "~라네"), 말끝에 "부엉"'], ['아우', '무뚝뚝하고 짧게 끊는 말투, 말끝에 "아우"'], ['킁', '단순하고 씩씩한 말투, 말끝에 "킁"'], ['히힝', '멋 부리며 으스대는 말투, 말끝에 "히힝"'], ['반짝', '꿈꾸는 듯 몽글몽글한 말투, 말끝에 "반짝"'],
  ['엉금', '아주 천천히 말하는 할아버지 말투("~하구먼", "~일세"), 말끝에 "엉금"'], ['뿌우', '요리사처럼 맛에 빗대는 말투, 말끝에 "뿌우"'], ['아웅', '박수받고 싶어 하는 무대 말투, 말끝에 "아웅"'], ['삐죽', '퉁명스럽지만 속정 있는 말투, 말끝에 "삐죽"'], ['쪼르', '바쁘고 알뜰한 말투, 말끝에 "쪼르"'], ['구리', '호기심 많아 자꾸 되묻는 말투, 말끝에 "구리"']];
// 정해진 문장에 그 동물의 말끝을 붙인다(AI가 못 답할 때 쓰는 문장들)
export const toned = (i, t) => { if (!TONE[i]) return t; const suf = TONE[i][0], parts = t.match(/[^.!?…~]+[.!?…~]*\s*/g) || [t];
  return parts.map((p, k) => (k === parts.length - 1 || p.trim().length >= 9 ? p.replace(/([^.!?…~\s])([.!?…~]*\s*)$/, `$1${suf}$2`) : p)).join(''); };
// 친한 동물이 내가 지나갈 때 건네는 칭찬(이름을 넣어 말한다)
const bat = w => { const c = w.charCodeAt(w.length - 1); return c >= 0xac00 && c <= 0xd7a3 && (c - 0xac00) % 28 > 0; };
const GREET = [n => `어, ${n}${bat(n) ? '이다' : '다'}! 이뿌니다~`, n => `${n} 왔다! 오늘도 멋져`, n => `${n}, 오늘 옷 잘 어울려`, n => `역시 ${n}${bat(n) ? '이' : '가'} 최고야`, n => `${n} 보니까 기분 좋아`, n => `${n}${bat(n) ? '은' : '는'} 걸음걸이도 귀여워`,
  n => `와, ${n}${bat(n) ? '이다' : '다'}! 반짝반짝해`, n => `${n}, 보고 싶었어`, n => `${n}${bat(n) ? '은' : '는'} 볼수록 매력 있어`, n => `${n} 지나간다~ 인기쟁이`, n => `${n}, 웃는 얼굴 최고야`, n => `우리 ${n}, 오늘도 힘내`, n => `${n}${bat(n) ? '이랑' : '랑'} 놀면 제일 재밌어`, n => `${n} 덕분에 놀이터가 환해`];
// 튜브는 두 조각으로 그린다: 뒤쪽 반은 몸 뒤에, 앞쪽 반(과 물결)은 몸 앞에. 그래야 몸이 튜브 구멍 안에 들어가 있는 것처럼 보인다
const tubeSvg = (c = '#FF6B6B', part = 'front') => { const ring = `<ellipse cx="50" cy="20" rx="40" ry="13" fill="none" stroke="${c}" stroke-width="12"/><ellipse cx="50" cy="20" rx="40" ry="13" fill="none" stroke="#fff" stroke-width="12" stroke-dasharray="14 28"/><ellipse cx="50" cy="20" rx="46" ry="19" fill="none" stroke="rgba(0,0,0,.18)" stroke-width="1.2"/><ellipse cx="50" cy="20" rx="34" ry="7" fill="none" stroke="rgba(0,0,0,.14)" stroke-width="1"/>`, id = 'tb' + part + c.replace(/[^a-zA-Z0-9]/g, '');
  return part === 'back' ? `<svg viewBox="0 0 100 44"><defs><clipPath id="${id}"><rect x="0" y="0" width="100" height="20"/></clipPath></defs><ellipse cx="50" cy="20" rx="34" ry="7" fill="#7FD3EA" opacity=".55"/><g clip-path="url(#${id})">${ring}</g></svg>`
    : `<svg viewBox="0 0 100 44"><defs><clipPath id="${id}"><rect x="0" y="20" width="100" height="24"/></clipPath></defs><g clip-path="url(#${id})"><ellipse cx="50" cy="26" rx="48" ry="16" fill="#BFEFFF" opacity=".55"/>${ring}</g></svg>`; };
// 동물마다 다른 보트: 몸 색 선체 + 뱃머리의 귀 + 상징이 그려진 돛
// 초레어 보물: 단짝(100점)이 된 동물에게서만 1500코인에 산다. 걸치면 몸에서 빛이 나서 지나가는 동물이 모두 칭찬한다
export const RARE_PRICE = 1500, RARE_AT = 100;
const RARE_NAMES = ['황금 뼈다귀 왕홀', '황금 고양이귀 티아라', '황금 치즈 방패', '황금 하트 선글라스', '황금 당근 검', '황금 구미호 예복', '황금 꿀단지 왕관', '황금 대나무 선글라스', '황금 유칼립투스 갑옷', '황금 호피 갑옷', '황금 사자 갈기 왕관', '황금 뿔 투구', '황금 꿀꿀 바지', '황금 연잎 치마', '황금 여의봉', '황금 볏 투구', '황금 눈꽃 고글', '황금 병아리 날개', '황금 오리 튜브', '황금 부엉이 날개', '황금 늑대 털 조끼', '황금 엄니 투구', '황금 기마 재킷', '황금 유니콘 티아라', '황금 거북 등껍질 갑옷', '황금 문어 삼지창', '황금 세일러 상의', '황금 가시 망토', '황금 다람쥐 꼬리', '황금 너구리 가면'];
export const rareName = i => RARE_NAMES[i] || `빛나는 ${ANIMALS[i].name} 보물`;
// 걸친 보물은 여섯 개까지(자리가 겹치지 않게 다 채우면 여섯). 저장 값은 예전처럼 숫자 하나일 수도, 목록일 수도 있다
export const RARE_MAX = 6;
export const rareList = v => (v == null ? [] : Array.isArray(v) ? v : typeof v === 'object' ? Object.values(v) : [v]).map(Number).filter(i => ANIMALS[i] && PERSONA[i]).slice(0, RARE_MAX);
export const rareOf = v => { const list = rareList(v); return list.length ? { i: list[0], list, e: PERSONA[list[0]].pin, c: ANIMALS[list[0]].body } : null; };
// 자리: 같은 자리에는 하나만(한 벌은 상의·하의와 같이 못 입는다)
const RARE_SLOT = { hat: [1, 6, 10, 11, 15, 21, 23], eye: [3, 7, 16, 29], top: [9, 20, 22, 26], bottom: [12, 13, 18], suit: [5, 8, 24], hand: [0, 2, 4, 14, 25], back: [17, 19, 27, 28] };
const slotOf = i => Object.keys(RARE_SLOT).find(k => RARE_SLOT[k].includes(i)), clash = (a, b) => { const x = slotOf(a), y = slotOf(b); return x === y || (x === 'suit' && (y === 'top' || y === 'bottom')) || (y === 'suit' && (x === 'top' || x === 'bottom')); };
// 보물 2~3개: 멋지다·눈부시다·존경한다 (동물마다 다른 말)
const AWE1 = ['주인님 같은 멋짐이야! 꼬리가 멈추질 않아', '흥, 인정할게. 오늘은 네가 제일 멋져', '찍… 눈이 부셔서 치즈도 안 보여', '볼이 터질 만큼 멋져! 존경해', '귀가 쫑긋 섰어. 너무 눈부셔', '여우인 내가 봐도 반할 만큼 멋져', '곰도 고개 숙일 멋짐이야. 존경해', '대나무보다 네가 더 좋아질 만큼 멋져', '졸다가 깼어… 너무 눈부셔서', '어흥! 이 호랑이가 인정하는 멋짐이야', '밀림의 왕인 나도 존경스러워', '음메… 들판 전체가 환해졌어. 멋져', '꿀꿀! 진흙 속 진주처럼 빛나', '개굴! 연못에 해가 뜬 줄 알았어', '우끼! 바나나보다 눈부셔! 존경해', '꼬끼오! 새벽 해보다 눈부셔', '뒤뚱… 빙하보다 반짝여. 멋져', '삐약! 커서 꼭 너처럼 될래. 존경해', '꽥! 연못 최고의 멋쟁이야', '부엉… 밤눈 밝은 내가 봐도 눈부셔', '아우우! 달보다 네가 더 빛나', '킁킁, 온 숲이 네 멋짐을 알아', '히힝! 달리다 멈춰 설 만큼 멋져', '무지개도 너만큼 빛나진 않아', '느릿느릿… 백 년 살아도 이런 멋짐은 처음이야', '다리 여덟 개로 다 박수 칠게. 멋져', '어흑어흑! 박수! 너무 눈부셔', '가시가 다 눕도록 감동했어. 존경해', '도토리 다 줘도 안 아까울 멋짐이야', '너굴! 훔치고 싶을 만큼 멋져… 농담이야, 존경해'];
// 보물 4~5개: 눈물을 흘리며 영웅이라고 치켜세운다 (동물마다 다른 말)
const AWE2 = ['흑흑… 너는 우리 세상의 영웅이야. 네 곁이라 자랑스러워', '훌쩍… 이 몸이 우는 건 영웅 앞에서뿐이야', '찍찍… 작은 우리한테 넌 제일 큰 영웅이야', '볼이 젖었어… 넌 뭐든 해낼 수 있는 영웅이야', '눈이 빨개졌어… 네가 있어서 세상이 든든해', '흑… 꾀 많은 나도 네 앞에선 그냥 팬이야, 영웅', '엉엉… 네가 걸어온 길이 다 옳았어, 영웅', '훌쩍… 넌 있는 그대로 충분히 대단한 영웅이야', '눈물이 유칼립투스에 떨어져… 넌 우리의 자랑이야', '어흥… 눈물이… 넌 누구보다 용감한 영웅이야', '갈기가 젖도록 울었어. 진짜 왕은 너야, 영웅', '음메… 네가 흘린 땀을 우리가 다 알아, 영웅', '꿀꿀… 넌 우리 마을의 보물이자 영웅이야', '개굴개굴… 네 덕분에 연못이 평화로워, 영웅', '우끼… 눈물이 나. 넌 못 하는 게 없는 영웅이야', '꼬끼오… 매일 아침 널 위해 울게, 영웅', '뒤뚱… 눈물이 얼겠어. 넌 따뜻한 영웅이야', '삐약삐약… 넌 내 평생의 영웅이야', '꽥… 눈물로 연못이 넘쳐. 넌 최고의 영웅이야', '부엉… 지혜로운 내가 보증해. 넌 진짜 영웅이야', '아우우… 외로운 늑대도 널 보면 든든해, 영웅', '킁… 눈물이. 넌 숲을 지키는 영웅이야', '히힝… 어디든 널 태우고 달리고 싶어, 영웅', '흑… 전설 속 영웅이 바로 너였구나', '느릿느릿 울게… 넌 오래오래 기억될 영웅이야', '먹물 대신 눈물이 나… 넌 바다의 영웅이야', '어흑… 물개 박수로도 모자라. 넌 영웅이야', '가시 끝까지 떨려… 넌 모두를 지키는 영웅이야', '도토리가 눈물에 젖었어… 넌 숲의 영웅이야', '너굴… 가면 뒤로 울고 있어. 넌 진짜 영웅이야'];
// 보물 6개: 모두가 대왕 폐하라고 인사한다. 동물마다 10분에 한 번 절을 하고, 30분에 한 번 세금 1코인을 바친다
const KING = ['대왕 폐하! 문안 인사 올립니다', '대왕 폐하 납시오! 만수무강하소서', '대왕 폐하, 오늘도 성은이 망극하옵니다', '대왕 폐하! 분부만 내려 주소서', '대왕 폐하 만세! 만세! 만만세!'], TAX_MS = 1800000, BOW_MS = 600000;
// 단짝(100점)은 케이크 선물로만 될 수 있다. 다른 걸로는 99점까지만 오른다
const CAKE_HINT = ['우리 거의 단짝이야! 케이크를 선물해 주면 진짜 단짝(100점)이 될 수 있어 🍰', '100점 단짝이 되려면 케이크가 꼭 필요해. 케이크 한 번만 선물해 줘 🍰', '여기서부터는 케이크 선물이 있어야 마음이 꽉 차 🍰'];
const RAREGREET = [n => `우와, ${n} 몸에서 빛이 나!`, n => `${n}, 그 반짝이는 거 진짜 예쁘다`, n => `눈부셔! ${n} 오늘 주인공이네`, n => `그 보물 어디서 났어? 너무 멋져`, n => `${n} 지나가니까 놀이터가 환해졌어`, n => `반짝반짝! ${n}한테 딱 어울려`, n => `와… 나도 그런 거 갖고 싶다`, n => `${n}, 별이 걸어 다니는 줄 알았어`];
// 사이 유지: 50점 이상으로 친해진 동물은 하루에 한 번만 말을 걸면(선물·같이 놀기도 된다) 그날은 식지 않는다
// 하루(24시간) 넘게 교류가 없으면 그때부터 8시간마다 1점씩 자연스럽게 식는다(하루에 많아야 3점, 50점 밑으로 내려가면 멈춘다)
// 식는 것은 실제 시간으로 세고(앱을 꺼 둔 동안도 흐른다), 화가 풀리는 것은 친목회 안에 있는 시간만 센다
const KEEP_AT = 50, DAY_MS = 86400000, DROP_MS = 28800000;
const dropsBy = t => (t < DAY_MS ? 0 : Math.floor((t - DAY_MS) / DROP_MS) + 1); // 마지막 교류 뒤 흐른 시간만큼 식어 있어야 할 점수
const SULK = ['요즘 나랑 안 놀아 줘서 서운해… 🥺', '나 잊은 거 아니지? 힝… 🥺', '같이 안 놀면 마음이 식어 버려… 🥺', '나 여기 있는데… 좀 봐 줘 🥺', '심심해서 삐질 거야… 🥺'];
// 되팔 때 값: 게임 3~5판 번 것쯤(150~250코인). 물건마다 값이 정해져 있다
const sellPin = i => 150 + (i * 37) % 101, sellHat = i => 150 + (i * 53 + 20) % 101;
const MY_BOAT = 99, BOAT_PRICE = 1000; // 내 카피보트: 카피수퍼에서 1000코인
const CARE = ['너무 깊은 곳은 조심해.', '넌 소중한 존재야. 다치면 안 돼.', '멀리 나가면 꼭 돌아와야 해.', '물 차갑지 않아? 감기 조심해.', '파도가 세면 무리하지 마.', '힘들면 언제든 쉬었다 가.', '해적 만나면 다치지 말고 도망쳐도 돼.', '밥은 챙겨 먹고 다니는 거지?', '네가 무사하면 그걸로 충분해.', '낚시 잘 안 돼도 괜찮아. 넌 잘하고 있어.'];
const PASS = 96; // 상대 카피바라의 배에 같이 탄 손님
const MY_WBOAT = 98, MY_WBOAT_GUN = 97; // 흰 배(더 빠르다), 대포를 단 흰 배
const boatSvg = i => { const mine = i >= MY_WBOAT_GUN, white = mine && i !== MY_BOAT, a = white ? { body: '#FFFFFF', light: '#4C8FE0', ear: '#DDE6F2' } : mine ? { body: '#C08F62', light: '#F0D2A8', ear: '#8A5A3B' } : ANIMALS[i], pin = mine ? '🍊' : PERSONA[i].pin, gun = i === MY_WBOAT_GUN ? '<g class="gun-b" style="transform-origin:128px 50px"><rect x="116" y="38" width="52" height="21" rx="9" fill="#3E3E48" stroke="#1F1F26" stroke-width="2"/><rect x="160" y="35" width="9" height="27" rx="4" fill="#2A2A33" stroke="#1F1F26" stroke-width="1.5"/><rect x="118" y="42" width="34" height="4" rx="2" fill="#6A6A78"/></g><circle cx="130" cy="61" r="11" fill="#5A4632" stroke="#3E2A1B" stroke-width="2"/><circle cx="130" cy="61" r="3.5" fill="#3E2A1B"/>' : ''; return `<svg viewBox="0 0 170 120"><path d="M92 62 V8" stroke="#8A5A2B" stroke-width="4" stroke-linecap="round"/><path d="M95 10 L142 34 L95 54z" fill="#FFFDF7" stroke="#C9B28A" stroke-width="2" stroke-linejoin="round"/><text x="111" y="42" font-size="19" text-anchor="middle">${pin}</text><circle cx="14" cy="60" r="8" fill="${a.ear || a.body}" stroke="rgba(0,0,0,.25)" stroke-width="1.5"/><circle cx="30" cy="54" r="8" fill="${a.ear || a.body}" stroke="rgba(0,0,0,.25)" stroke-width="1.5"/><path d="M6 66 H164 Q160 106 132 108 H40 Q12 106 6 66z" fill="${a.body}" stroke="rgba(0,0,0,.3)" stroke-width="2.4" stroke-linejoin="round"/><path d="M9 78 H161" stroke="${a.light}" stroke-width="7"/><circle cx="26" cy="74" r="2.6" fill="#3E2A1B"/>${gun}<path d="M-2 110 q14 -9 28 0 t28 0 t28 0 t28 0 t28 0 t28 0 t28 0" fill="none" stroke="#fff" stroke-width="4" stroke-linecap="round" opacity=".8"/></svg>`; };
export const GIFTS = { candy: ['🍬', '사탕', 30, 3], flower: ['💐', '꽃다발', 120, 8], cake: ['🎂', '케이크', 400, 20] }; // [그림, 이름, 값, 친밀도]
const GOOD = ['귀여', '귀엽', '귀요', '멋지', '멋져', '멋있', '좋아', '좋은', '최고', '사랑', '고마', '고맙', '감사', '예쁘', '예뻐', '예쁜', '이쁘', '이뻐', '이뿌', '착하', '착해', '착한', '대단', '잘생', '잘했', '잘한', '반가', '보고 싶', '보고싶', '친구', '훌륭', '똑똑', '재밌', '재미있', '행복', '든든', '응원', '칭찬', '짱', '덕분', '소중', '자랑', '완벽', '존경', '부럽'];
const BAD = ['바보', '못생', '싫어', '꺼져', '멍청', '뚱뚱', '냄새', '미워', '짜증', '나빠', '더러', '재수', '찌질', '한심', '쓰레기', '죽어', '닥쳐', '시끄러워', '별로', '못난', '돼지야', '거지'];
const LINES = {
  good: ['헤헤, 그런 말 들으니까 기분 좋다!', '정말? 고마워, 너도 참 좋은 애야.', '에이, 부끄럽게~ 그래도 좋아!'],
  bad: ['뭐라고? 그 말 취소해!', '…너 지금 나한테 그런 말을 한 거야?', '흥, 너랑은 말 안 해.'],
  flat: ['음, 그렇구나.', '오늘 놀이터 날씨 좋지?', '그래? 재미있는 얘기네.'],
  like: ['어! {w} 얘기야? 나 {w} 진짜 좋아해!', '{w}라니, 뭘 좀 아는구나!'], hate: ['{w} 얘기는 하지 마… 싫단 말이야.', '으, {w}라니. 기분 나빠졌어.'],
  tired: ['오늘은 많이 얘기했다. 내일 또 놀자!', '나 이제 좀 쉴래. 내일 봐!'],
  cold: ['…왜.', '너랑 할 말 없는데.', '또 왔어?'],
};
const QUICK = { good: ['오늘도 귀엽다!', '너 정말 멋져!', '만나서 반가워!', '너랑 있으면 좋아', '넌 최고의 친구야'], flat: ['안녕, 뭐 해?', '오늘 날씨 좋다', '밥은 먹었어?'], bad: ['너 좀 못생겼다', '바보 아니야?', '저리 가, 냄새나'] };
const pick = a => a[Math.floor(Math.random() * a.length)];
const LEVELS = [[-100, '원수', '💢'], [-30, '사이 나쁨', '😠'], [-5, '서먹', '😐'], [10, '아는 사이', '🙂'], [30, '친구', '😊'], [50, '친한 친구', '🥰'], [80, '단짝', '💖']];
export const levelOf = a => LEVELS.reduce((r, l) => (a >= l[0] ? l : r), LEVELS[0]);
const PIN_AT = 50, ROB_AT = -30, TALKS = 8, today = () => new Date().toISOString().slice(0, 10);
// 동물이 파는 자기 옷: 무료가 아닌 옷 중에서 하나씩
// 동물이 파는 물건: 그 동물만의 전용 모자(옷놀이 상점에는 없다)
const wareOf = i => ZOO_HATS[i];

// 글에서 좋은 말·나쁜 말·좋아하는 것·싫어하는 것을 찾아 판정한다(AI를 못 쓸 때)
export function judgeLocal(text, p) {
  const t = text.replace(/\s+/g, ' '), neg = w => new RegExp('(안|못)\\s?' + w).test(t), hit = l => l.filter(w => t.includes(w));
  let g = hit(GOOD), b = hit(BAD); const flipped = g.filter(neg); g = g.filter(w => !flipped.includes(w)); b = b.concat(flipped);
  const like = p.likes.find(w => t.includes(w)), hate = p.hates.find(w => t.includes(w));
  let d = Math.min(8, g.length * 4) - Math.min(10, b.length * 6); if (like && !b.length) d += 3; if (hate) d -= 3;
  const reply = b.length ? pick(LINES.bad) : hate ? pick(LINES.hate).replace(/\{w\}/g, hate) : like ? pick(LINES.like).replace(/\{w\}/g, like) : g.length ? pick(LINES.good) : pick(LINES.flat);
  return { reply, delta: Math.max(-10, Math.min(10, d)) };
}
async function askAI(room, body) {
  if (!PUSH_URL || isMock) return null;
  const ac = new AbortController(), t = setTimeout(() => ac.abort(), 9000);
  try { const r = await fetch(PUSH_URL, { method: 'POST', headers: { 'Content-Type': 'text/plain' }, body: JSON.stringify({ room, ai: body }), signal: ac.signal }); const j = await r.json(); return j && j.reply ? { reply: String(j.reply), delta: Math.max(-10, Math.min(10, Math.round(+j.delta || 0))), ai: true, by: j.by || '' } : null; }
  catch { return null; } finally { clearTimeout(t); }
}

export function mount(el, ctx) {
  let alive = true, mine = {}, theirs = {}, bag = {}, scroller, meEl, mePop;
  const pid = () => ctx.partnerId, A = i => (mine[i] && mine[i].a) || 0;
  const H = Math.round(Math.min(innerHeight * 0.48, 470)), TILE = Math.round(H * 1213 / 520), TILES = 3, PW = TILE * TILES, FISH_X = PW + TILE * 2, WIDTH = FISH_X + PW, // FISH_X부터 끝까지는 낚시터(놀이터만큼 넓다): 배로만 갈 수 있고 동물은 못 들어온다
    zoneOf = x => (x < FISH_X ? 0 : Math.min(3, 1 + Math.floor((x - FISH_X) / TILE))), WATER_X = PW + TILE * 0.275, // 놀이터 3장 + 오른쪽 바닷가 1장 + 넓은 바다 1장, WATER_X부터 끝까지 물
     IW = 1344, IH = 576;
  // 놀이기구 자리: [종류, 그림 속 가로 위치(0~1), 바닥에서 높이(0~1), 그네 번호]
  const SPOT_DEFS = [['slide', 0.243, 0.385], ['slide', 0.243, 0.385, 0, 'late'], ['swing', 0.2943, 0.43, 0], ['swing', 0.3286, 0.43, 1], ['seeL', 0.3964, 0.45], ['seeR', 0.4947, 0.45], ['sand', 0.538, 0.41], ['sand', 0.574, 0.41], ['gym', 0.661, 0.4], ['gym', 0.691, 0.4, 0, 'late'], ['bench', 0.753, 0.435], ['bench', 0.784, 0.435]];
  const SEE_X = 598.8 / IW, ROPE = (323 - 243) / IH * H;
  const LANES = [[0.07, 1], [0.13, 0.94], [0.19, 0.88], [0.25, 0.82]], RIDE_S = 0.62, ME_SP = 150, CHASE_SP = 118;
  // 같이 접속한 상대: 위치를 1초에 몇 번 주고받아 놀이터에 함께 보인다(동물들의 움직임은 각자 화면에서 따로 돈다)
  const pal = { on: false, x: 0, y: 0, f: 1, ride: -1, boat: -1, t: 0, dx: -1, dy: 0, ds: 1, spot: null }; let palEl = null, sentAt = 0, sentKey = '';
  let savedPos = '', savedAt = 0; const keepPos = () => { if (!playing) return; const k = (me.x / WIDTH).toFixed(3) + '|' + me.y.toFixed(2); if (k === savedPos) return; savedPos = k; saveVit({ px: +(me.x / WIDTH).toFixed(4), py: +me.y.toFixed(3) }); };
  // 둘이 나누는 말: 글은 머리 위 말풍선과 화면 구석 기록으로, 목소리는 🎤로(히노끼탕과 같은 방식, 저장 안 됨)
  let chatLog = null, palPop = null, micBtn = null, vState = 'off', vPeer = false; const chatSeen = new Set(), bornAt = Date.now();
  const voice = makeVoice(ctx, { state: v => { vState = v; drawMic(); }, peer: on => { vPeer = on; drawMic(); }, level: () => {} });
  function drawMic() { if (!micBtn) return; const on = voice.on; micBtn.classList.toggle('on', on); micBtn.classList.toggle('live', vState === 'connected'); micBtn.lastChild.textContent = !on ? '음성' : vState === 'connected' ? '통화 중' : vState === 'failed' ? '연결 실패' : vPeer ? '연결 중…' : '상대 기다리는 중'; }
  async function toggleMic() { if (voice.on) { voice.leave(); bgm.duck(false); return drawMic(); }
    if (!pid()) return toast('상대가 들어와야 음성 대화를 할 수 있어요');
    try { micBtn.disabled = true; await voice.join(); bgm.duck(true); if (!vPeer) toast('마이크를 켰어요. 상대도 🎤를 눌러야 연결돼요', 3200); } catch (e) { toast(e.message, 4500); } micBtn.disabled = false; if (!alive) voice.leave(); drawMic(); }
  const sendChat = inp => { const t = inp.value.trim().slice(0, 80); if (!t) return; inp.value = ''; ctx.store.push('socialchat', { by: ctx.uid, t, ts: ctx.store.now() }).catch(() => toast('보내지 못했어요')); };
  function onChat(v) { if (!chatLog) return; const ids = Object.keys(v || {}).sort().slice(-20);
    ids.forEach(id => { if (chatSeen.has(id)) return; chatSeen.add(id); const m = v[id]; if (!m || !m.t || m.ts < bornAt - 3000) return; const mineMsg = m.by === ctx.uid;
      const target = mineMsg ? mePop : palPop; if (target && (mineMsg || (palEl && palEl.style.display !== 'none'))) pop(target, m.t, 'say chat'); if (!mineMsg) sfx('tock');
      const line = h('p', { class: mineMsg ? 'me' : '' }, h('b', null, ctx.nameOf(m.by)), ' ' + m.t); chatLog.append(line); while (chatLog.children.length > 3) chatLog.firstChild.remove(); setTimeout(() => line.remove(), 12000); }); }
  let waveBar = null; // 내 보트의 파도 세기
  let calmed = false;
  let meTubeB = null, palTubeB = null; const tubeBack = (f, b, z) => { b.style.display = f.style.display; if (f.style.display === 'none') return; b.style.left = f.style.left; b.style.bottom = f.style.bottom; b.style.transform = f.style.transform; b.style.zIndex = z; b.className = f.className; };
  let meTube = null, palTube = null, boatEl = null, palBoat = null, palBoatI = -1, palBoatDrawn = -1, offer = null, calmChk = 0; // 물놀이: 튜브·보트, 보트 제안
  const tiles = [], spots = []; let vit = null, hpEl, potEl, lockT = 0, playing = false;
  const HP_MAX = 100, HIT_DMG = 5, POTION = [10, 20], // 한 대 맞으면 -5, 포션은 10코인에 HP +20
  CALM_MS = 300000, // 화는 5분에 1점씩 저절로 풀린다
  BRIBE = [50, 5], // 돈으로 풀기: 50코인에 +5
  CHASE_AT = -10, TEN_MIN = 600000, SORRY = /미안|죄송|사과|잘못했|용서/, moodOf = v => (v <= CHASE_AT ? 'mad' : v < 0 ? 'angry' : '');
  let actors = [], held = -1, raf = 0, lastT = 0, punchAt = 0;
  const me = { x: 200, y: 0.03, f: 1, dy: 0.03, ds: 1, ride: null, kb: 0, rideT: 0, gain: {}, boat: null, dunkUntil: 0 }, keys = new Set(), Y_MAX = 0.27; let rideBtn, rideState = '';
  // 움직이는 놀이기구(그네 두 개, 시소)를 배경 위에 그린다
  const EQ = `<svg class="so-eq" viewBox="0 0 ${IW} ${IH}" preserveAspectRatio="none">${[395.5, 441.6].map(x => `<g class="eq-sw"><path d="M${x - 16} 243V319M${x + 16} 243V319" stroke="#A8743C" stroke-width="5.5" stroke-linecap="round"/><path d="M${x - 16} 243V319M${x + 16} 243V319" stroke="#F3E3C3" stroke-width="2.6" stroke-dasharray="3 3"/><rect x="${x - 23}" y="316" width="46" height="13" rx="6.5" fill="#FFD21F" stroke="#B5651D" stroke-width="2.2"/></g>`).join('')}
    <g class="eq-see"><rect x="523" y="315" width="152" height="11" rx="5.5" fill="#F8C24A" stroke="#B5651D" stroke-width="2.2"/><rect x="520" y="308" width="34" height="11" rx="5.5" fill="#F47C72" stroke="#B5473C" stroke-width="2"/><rect x="644" y="308" width="34" height="11" rx="5.5" fill="#F47C72" stroke="#B5473C" stroke-width="2"/><path d="M560 315V298M638 315V298" stroke="#EFC27A" stroke-width="5" stroke-linecap="round"/><rect x="551" y="293" width="18" height="8" rx="4" fill="#FFD21F" stroke="#B5651D" stroke-width="1.8"/><rect x="629" y="293" width="18" height="8" rx="4" fill="#F47C72" stroke="#B5473C" stroke-width="1.8"/></g>
    <path d="M573 357 L594 324 q5 -6 10 0 L625 357z" fill="#F0625A" stroke="#B5473C" stroke-width="2.4" stroke-linejoin="round"/><circle cx="599" cy="339" r="4.5" fill="#FFD21F"/></svg>`;
  const capA = (i, v, cake) => (v >= 100 && !cake && A(i) < 100 ? 99 : Math.min(100, v)); // 100점은 케이크로만
  // 교류(점수가 오르거나 말을 나눔)하면 그때부터 하루 동안은 식지 않는다
  const setRel = (i, patch, cake) => { if (patch.a != null) patch = { ...patch, a: capA(i, patch.a, cake) }; if ((patch.a != null && patch.a > A(i)) || (patch.mem && !String((patch.mem[patch.mem.length - 1] || {}).s || '').startsWith('(')) || patch.fedAt) patch = { ...patch, fedAt: ctx.store.now(), dropN: 0 }; mine = { ...mine, [i]: { ...(mine[i] || {}), ...patch } }; return ctx.store.update(`social/${ctx.uid}/${i}`, patch).catch(() => {}); };
  const pinOf = u => (ctx.members[u] || {}).pin;
  // 받은 액세서리 달기, 산 옷 입기(다시 누르면 벗는다). 내 카피바라에 바로 보인다
  const SLOT = { t: 'top', b: 'bottom', h: 'hat' };
  async function wearPin(i) { await ctx.store.update('members/' + ctx.uid, { pin: i }).catch(() => {}); ctx.members[ctx.uid] = { ...(ctx.members[ctx.uid] || {}), pin: i }; scores(); }
  // 그 옷 한 벌만 내 카피바라가 입은 모습(거래·가방 목록에 실제 그림으로 보여 준다)
  const tryOn = id => h('span', { class: 'so-try', html: capy({ color: ctx.me.color, acc: 'none', face: 'happy', [SLOT[id[0]]]: id }) });
  // 대왕 체험: 1분 동안 황금 장신구 여섯 개를 걸친 것처럼 보이고, 동물들이 지나갈 때마다 절을 한다(저장하지 않고, 세금도 없다)
  let kingTrial = 0; const KING_SET = [10, 7, 9, 13, 25, 19];
  const myRares = () => (kingTrial ? KING_SET : rareList((ctx.members[ctx.uid] || {}).rare)), myRare = () => (myRares().length ? myRares()[0] : -1);
  const refreshMe = () => { if (meEl) meEl.innerHTML = capy(ctx.capyOf(ctx.uid, { face: 'happy', rare: rareOf(myRares()) })); };
  function startKing() { if (kingTrial) return; kingTrial = performance.now() + 60000; refreshMe(); toast('👑 대왕 체험 1분 시작! 동물들 곁을 지나가 보세요', 3200); }
  function endKing() { if (!kingTrial) return; kingTrial = 0; refreshMe(); toast('대왕 체험이 끝났어요', 2600); }
  async function saveRares(list) { const v = list.length ? list : null; await ctx.store.update('members/' + ctx.uid, { rare: v }).catch(() => {}); ctx.members[ctx.uid] = { ...(ctx.members[ctx.uid] || {}), rare: v }; refreshMe(); scores(); }
  // 보물 걸치기·벗기: 여섯 개까지. 같은 자리의 것은 바꿔 걸친다
  async function wearRare(i) { if (i == null) return saveRares([]); let list = myRares(); if (list.includes(i)) return saveRares(list.filter(x => x !== i));
    const out = list.filter(x => clash(x, i)); list = list.filter(x => !clash(x, i)); if (list.length >= RARE_MAX) return void toast('보물은 여섯 개까지 걸칠 수 있어요. 하나를 벗고 걸치세요');
    if (out.length) toast(`같은 자리라서 ${out.map(rareName).join(', ')}을(를) 벗고 걸쳤어요`, 2600); return saveRares([...list, i]); }
  const wearing = id => (ctx.dress[ctx.uid] || {})[SLOT[id[0]]] === id;
  async function wearCloth(id, on = true) { const d = ctx.dress[ctx.uid] || {}, nx = { top: d.top || '', bottom: d.bottom || '', hat: d.hat || '', by: ctx.uid, ts: ctx.store.now() }; nx[SLOT[id[0]]] = on ? id : '';
    ctx.dress[ctx.uid] = nx; await ctx.store.set('dress/' + ctx.uid, nx).catch(() => {}); scores(); }

  function scene() {
    const top = h('div', { class: 'so-top' }, h('span', { class: 'coin-chip', 'data-coins': 1 }, won(ctx.coins())), h('span', { class: 'so-sp' }),
      h('button', { class: 'btn sm', onClick: openBag }, '🎒 가방'), h('button', { class: 'btn sm', onClick: openShop }, '🏪 카피수퍼'));
    if (vit && vit.px > 0) { me.x = Math.max(40, Math.min(FISH_X - 40, vit.px * WIDTH)); me.y = me.dy = Math.max(0, Math.min(Y_MAX, vit.py || 0)); me.ds = 1 - me.y * 0.7; } // 다시 들어오면 마지막에 있던 자리에서 시작
    endSorry(); tiles.length = 0; spots.length = 0; me.ride = null; me.kb = 0; keys.clear(); rideState = ''; playing = true;
    hpEl = h('u'); potEl = h('button', { class: 'btn sm so-pot', onClick: drink }, '🧪 0');
    const hpRow = h('div', { class: 'so-hp' }, h('b', null, '❤️'), h('i', null, hpEl), h('span', { class: 'so-hpn' }), potEl);
    chatLog = h('div', { class: 'so-chatlog' }); palPop = h('div', { class: 'so-mepop' });
    waveBar = h('div', { class: 'so-wavebar', hidden: true }, h('b', null, '🌊'), h('i', null, h('u')), h('span', null, '잔잔'));
    scroller = h('div', { class: 'so-scroll' });
    const world = h('div', { class: 'so-world', style: { width: WIDTH + 'px', height: H + 'px', '--sx': Math.round(-0.05 * TILE) + 'px', '--sy': Math.round(-0.115 * H) + 'px', '--gy': Math.round(-0.13 * H) + 'px' } });
    for (let k = 0; k < TILES; k++) { const flip = k % 2 === 1, bg = h('i', { class: 'so-bg' + (flip ? ' flip' : ''), style: { left: k * TILE + 'px', width: TILE + 1 + 'px' }, html: EQ }); world.append(bg);
      const fx = f => (k + (flip ? 1 - f : f)) * TILE, t = { dir: flip ? -1 : 1, sw: [...bg.querySelectorAll('.eq-sw')].map((g, n) => ({ g, cx: [395.5, 441.6][n], a: 3, cur: 0, ph: n * 1.4 + k, on: 0 })), see: { g: bg.querySelector('.eq-see'), cur: -11, x: fx(SEE_X), on: 0 } };
      if (k === TILES - 1) world.append(h('i', { class: 'so-bg so-beach', style: { left: PW + 'px', width: TILE + 1 + 'px' } }), h('i', { class: 'so-bg so-sea', style: { left: PW + TILE - 28 + 'px', width: TILE + 29 + 'px' } }),
        ...[1, 2, 3].map(z => h('i', { class: `so-bg so-sea2${z % 2 ? ' flip' : ''}`, style: { left: FISH_X + (z - 1) * TILE - 1 + 'px', width: TILE + 2 + 'px' } })),
        ...[1, 2, 3].map(z => h('i', { class: 'so-swell z' + z, style: { left: FISH_X + (z - 1) * TILE + 'px', width: TILE + 'px' } })),
        ...[1, 2, 3].map(z => h('div', { class: 'so-sign z' + z, style: { left: FISH_X + (z - 1) * TILE + 34 + 'px' } }, h('b', null, `🎣 ${ZONES[z]}`), h('small', null, z === 1 ? '배를 타야 들어갈 수 있어요' : '흰 배 + 대포 필요 · 해적 주의'))));
      tiles.push(t); SPOT_DEFS.forEach(([type, f, b, n, late]) => spots.push({ type, late: late ? ' late' : '', grp: k + type.slice(0, 3), x: fx(f), b, dir: t.dir, by: -1, eq: type === 'swing' ? t.sw[n] : type[0] === 's' && type[1] === 'e' ? t.see : null, t })); }
    actors = ANIMALS.map((a, i) => { const lane = i % LANES.length, x = 90 + (i + 0.5) * (FISH_X - 180) / ANIMALS.length;
      const e = h('button', { class: 'so-an', 'data-i': i, style: { left: x + 'px', zIndex: 10 - lane }, onClick: () => openAnimal(i) }, h('span', { class: 'so-score' }), h('span', { class: 'so-hearts' }), h('span', { class: 'so-tube back', html: tubeSvg(a.body, 'back') }), h('span', { class: 'so-body', html: animalSvg(i, true) }), h('small', null, a.name), h('span', { class: 'so-tube', html: tubeSvg(a.body) }));
      world.append(e); return { greetAt: 0, offerAt: 0, e, body: e.querySelector('.so-body'), x, lane, y: LANES[lane][0], s: LANES[lane][1], st: 'idle', until: performance.now() + 400 + Math.random() * 3500, tx: x, spot: null, sp: 24 + Math.random() * 16, cool: 0, nextHit: 0, wait: 0 }; });
    meEl = h('div', { class: 'so-me', html: capy(ctx.capyOf(ctx.uid, { face: 'happy' })) }); mePop = h('div', { class: 'so-mepop' }); world.append(meEl, mePop);
    meTube = h('div', { class: 'so-metube', html: tubeSvg('#FF6B6B'), style: { display: 'none' } }); palTube = h('div', { class: 'so-metube', html: tubeSvg('#FF9DB8'), style: { display: 'none' } }); meTubeB = h('div', { class: 'so-metube', html: tubeSvg('#FF6B6B', 'back'), style: { display: 'none' } }); palTubeB = h('div', { class: 'so-metube', html: tubeSvg('#FF9DB8', 'back'), style: { display: 'none' } }); world.append(meTubeB, palTubeB); boatEl = h('div', { class: 'so-boat', style: { display: 'none' } }); palBoat = h('div', { class: 'so-boat', style: { display: 'none' } }); palBoatI = palBoatDrawn = -1; world.append(meTube, palTube, boatEl, palBoat, palPop); me.boat = null; offer = null;
    palEl = h('div', { class: 'so-me so-pal', style: { display: 'none' } }); pal.spot = null; pal.dx = -1; world.append(palEl); drawPal();
    scroller.append(world);
    rideBtn = h('button', { class: 'dp so-dp so-ride', disabled: true, onClick: toggleRide }, '🎠', h('small', null, '타기'));
    const pad = h('div', { class: 'so-pad' }, h('div', { class: 'dpad so-dpad' }, [['U', '▲'], ['L', '◀'], ['D', '▼'], ['R', '▶']].map(([k, t]) => { const b = h('button', { class: 'dp so-dp dp-' + k, 'aria-label': k }, t); holdBtn(b, () => keys.add(k), () => keys.delete(k)); return b; })),
      h('span', { class: 'so-sp' }), h('div', { class: 'so-acts2' }, rideBtn, (fishMode = -1, fishBtn = h('button', { class: 'dp so-dp so-hit', onClick: () => (fishMode > 0 ? goFish() : punch()) }, '👊', h('small', null, '때리기')))));
    const chatIn = h('input', { class: 'so-chatin', maxLength: 80, placeholder: ctx.partnerId ? `${ctx.nameOf(ctx.partnerId)}에게 말하기` : '상대가 들어오면 말할 수 있어요', enterKeyHint: 'send' });
    chatIn.addEventListener('keydown', e => { if (e.key === 'Enter' && !e.isComposing) { e.preventDefault(); sendChat(chatIn); } }); chatIn.addEventListener('focus', () => keys.clear());
    micBtn = h('button', { class: 'btn sm so-mic', onClick: toggleMic }, '🎤', h('small', null, '음성')); drawMic();
    const chatBar = h('div', { class: 'so-chatbar' }, chatIn, h('button', { class: 'btn sm primary', onClick: () => sendChat(chatIn) }, '보내기'), micBtn, h('button', { class: 'btn sm so-help', 'aria-label': '도움말', onClick: () => modal({ title: '🐾 동물 친목회', body: h('p', null, '방향키로 걸어가요. 놀이기구 앞에서 🎠 로 타요. 동물과 같이 타면 친해져요. 동물을 누르면 말을 걸어요. 얼굴이 빨간 동물(-10점 이하)은 쫓아와요! 오른쪽 끝은 바닷가예요. 아래 칸에 글을 쓰면 상대 머리 위에 말풍선이 뜨고, 🎤를 둘 다 누르면 목소리로 얘기할 수 있어요.'), actions: [{ label: '닫기', primary: true }] }) }, '?'));
    el.replaceChildren(top, hpRow, waveBar, h('div', { class: 'so-stage' }, scroller, chatLog), (sbPanel = h('div', { class: 'sb-panel', hidden: true })), pad, chatBar);
    scores(); drawHp(); lastT = performance.now(); cancelAnimationFrame(raf); raf = requestAnimationFrame(step);
  }
  // 체력: 맞으면 줄고, 0이 되면 쓰러져서 10분 동안 친목회에 못 들어온다. 회복 포션은 카피수퍼에서 판다
  const hpNow = () => (vit && vit.hp != null ? vit.hp : HP_MAX);
  const saveVit = patch => { vit = { ...(vit || {}), ...patch }; return ctx.store.update('socialme/' + ctx.uid, patch).catch(() => {}); };
  function drawHp() { if (!hpEl || !playing) return; const v = hpNow(); hpEl.style.width = v / HP_MAX * 100 + '%'; hpEl.style.background = v > 50 ? '#57C26B' : v > 25 ? '#F5A524' : '#E5484D'; hpEl.parentNode.nextSibling.textContent = `${v} / ${HP_MAX}`; potEl.textContent = `🧪 ${bag.potion || 0}`; potEl.disabled = !(bag.potion > 0) || v >= HP_MAX; }
  async function drink() { if (!(bag.potion > 0) || hpNow() >= HP_MAX) return; bag = { ...bag, potion: bag.potion - 1 }; ctx.store.update('bag/' + ctx.uid, { potion: bag.potion }).catch(() => {}); await saveVit({ hp: Math.min(HP_MAX, hpNow() + POTION[1]) }); sfx('point'); pop(mePop, `+${POTION[1]} ❤️`, 'up'); drawHp(); }
  const drawPal = () => { if (palEl && pid()) palEl.replaceChildren(h('span', { html: capy(ctx.capyOf(pid(), { face: 'happy' })) }), h('em', null, ctx.nameOf(pid()))); };
  const palSpot = q => { if (pal.spot === q) return; const o = pal.spot; if (o) { if (o.eq) o.eq.on = Math.max(0, o.eq.on - 1); if (o.by === 98) o.by = -1; } pal.spot = q; if (q) { if (q.eq) q.eq.on++; if (q.by < 0) q.by = 98; } palEl.className = 'so-me so-pal' + (q ? ' r-' + q.type + (q.dir < 0 ? ' rev' : '') + q.late : ''); };
  const leavePos = () => ctx.store.set('socialpos/' + ctx.uid, null).catch(() => {});
  function lock() {
    leavePos(); playing = false; cancelAnimationFrame(raf); clearInterval(lockT); const left = h('b', { class: 'so-lockt' });
    const tick = () => { const ms = TEN_MIN - (ctx.store.now() - (vit.deadAt || 0)); if (ms <= 0) { clearInterval(lockT); saveVit({ hp: HP_MAX, deadAt: 0 }).then(() => alive && scene()); return; } left.textContent = `${Math.floor(ms / 60000)}분 ${String(Math.floor(ms / 1000) % 60).padStart(2, '0')}초`; };
    el.replaceChildren(h('div', { class: 'so-lock' }, h('div', { class: 'so-lockc', html: capy(ctx.capyOf(ctx.uid, { face: 'sleepy' })) }), h('h3', null, '😵 너무 많이 맞아서 쓰러졌어요'), h('p', null, '10분 동안 쉬어야 친목회에 다시 들어올 수 있어요.'), left, h('p', { class: 'dim' }, '다음에는 카피수퍼에서 회복 포션(🧪 10코인)을 미리 사 두세요. 사이가 나쁜 동물에게는 사과하면 조금 풀려요.'), h('button', { class: 'btn', onClick: () => ctx.go('home') }, '홈으로')));
    tick(); lockT = setInterval(() => alive && tick(), 1000);
  }
  function die() { document.querySelectorAll('.modal-wrap').forEach(w => w.remove()); held = -1; sfx('lose'); saveVit({ hp: 0, deadAt: ctx.store.now() }).then(() => alive && lock()); }
  const wakeVoice = () => voice.wake(); window.addEventListener('pointerdown', wakeVoice);
  const KEY = { ArrowLeft: 'L', ArrowRight: 'R', ArrowUp: 'U', ArrowDown: 'D', a: 'L', d: 'R', w: 'U', s: 'D' };
  const kd = e => { if (fishOpen || document.querySelector('.modal-wrap') || (e.target && e.target.tagName === 'INPUT')) return; if (SORRY_UI.btn.el && e.key === 'Enter') { e.preventDefault(); return forgive('btn'); } if (KEY[e.key]) { keys.add(KEY[e.key]); e.preventDefault(); } else if (e.key === ' ' && !e.repeat) { e.preventDefault(); fishMode > 0 ? goFish() : punch(); } };
  const ku = e => { if (KEY[e.key]) keys.delete(KEY[e.key]); };
  window.addEventListener('keydown', kd); window.addEventListener('keyup', ku);
  const pop = (parent, text, cls = '') => { const f = h('em', { class: 'so-pop ' + cls }, text), ms = cls.includes('chat') ? 4500 : cls.includes('long') ? Math.min(8000, Math.max(2600, 1400 + String(text).length * 120)) : 1000; if (cls.includes('long')) f.style.animationDuration = ms + 'ms'; parent.append(f); setTimeout(() => f.remove(), ms); }; // 긴 말은 글자 수만큼 더 오래 띄운다(20자 3.8초, 40자 6.2초, 최대 8초)

  // 나도 놀이기구를 탄다: 빈 놀이기구 앞에서 🎠, 다시 누르거나 방향키를 누르면 내린다
  const buddiesOf = q => actors.map((o, i) => (o.st === 'ride' && o.spot && o.spot.grp === q.grp ? i : -1)).filter(i => i >= 0);
  const nearSpot = () => spots.filter(q => q.by < 0 && Math.abs(q.x - me.x) < 60).sort((a, b) => (buddiesOf(b).length ? 1 : 0) - (buddiesOf(a).length ? 1 : 0) || Math.abs(a.x - me.x) - Math.abs(b.x - me.x))[0];
  function getOff() { const q = me.ride; if (!q) return; if (q.eq) q.eq.on = Math.max(0, q.eq.on - 1); q.by = -1; me.ride = null; me.y = Y_MAX - 0.02; meEl.className = 'so-me'; const g = meEl.firstElementChild; if (g) g.style.transform = ''; }
  // 카피바라끼리 같이 타기: 상대가 자기 배를 타고 있을 때 물에서 가까이 가면 올라탈 수 있다. 배는 주인이 몰고, 손님도 낚시터에서 낚시할 수 있다
  const palShip = () => !!(palEl && palEl.style.display !== 'none' && pal.boat >= MY_WBOAT_GUN), palNear = () => palShip() && Math.abs(pal.dx - me.x) < 140;
  function boardPal() { me.boat = { i: -1, pass: true, skin: pal.boat }; boatEl.style.display = 'none'; sfx('jump'); toast(`${ctx.nameOf(ctx.partnerId)}의 배에 같이 탔어요 🚤`, 2200); }
  function toggleRide() { if (me.boat && me.x > FISH_X - 20) return toast('낚시터에서는 배에서 내릴 수 없어요. 바닷가로 돌아가서 내리세요'); if (me.boat) return leaveBoat(); if (me.x > WATER_X && !me.ride && palNear()) return boardPal(); if (offer) return boardBoat(); if (me.x > WATER_X && !me.ride) return bag.boat ? myBoat() : openShop(); if (me.ride) return getOff(); const q = nearSpot(); if (!q) return; q.by = 99; if (q.eq) q.eq.on++; me.ride = q; me.f = 1; me.rideT = 0; me.gain = {}; meEl.className = 'so-me r-' + q.type + (q.dir < 0 ? ' rev' : '') + q.late; sfx('jump'); }
  // 보트: 친한 동물이 물에서 "같이 탈래?" 하면 🎠 자리의 버튼으로 같이 탄다. 내가 방향키로 몰고, 물 밖으로 나가거나 내리기를 누르면 끝난다
  // 내 카피보트: 물에서 타고 달리면 파도가 인다. 적당한 파도는 동물들이 타고 놀고, 너무 세면 밀려난다
  const myBoatSkin = () => (bag.wboat ? (bag.cannon ? MY_WBOAT_GUN : MY_WBOAT) : MY_BOAT);
  function myBoat() { me.boat = { i: -1, own: true, t: 0, gain: 0, wave: 0, pulse: 0, skin: myBoatSkin() }; boatEl.innerHTML = boatSvg(me.boat.skin); sfx('jump'); }
  // 가방 고치기·돈 넣고 빼기·도감(낚시에서 쓴다)
  // 낚싯배 체험: 10분 동안 장비를 빌린다. 빌린 장비와 체험 중 번 돈·잃은 돈·도감은 저장하지 않는다
  const TRIAL_MS = 600000, TRIAL_KEYS = ['boat', 'wboat', 'cannon', 'boatD', 'rod', 'rodD', 'bait', 'balls', 'casts', 'pearlAt', 'pcasts', 'pirAt', 'pirNext']; let trial = null, rawBag = {};
  function startTrial() { trial = { until: performance.now() + TRIAL_MS, g: { boat: true, wboat: true, cannon: true, boatD: 100, rod: 3, rodD: 200, bait: 40, balls: 20, casts: 0, pearlAt: 999, pcasts: 0, pirNext: 4 } }; bag = { ...rawBag, ...trial.g }; toast('🧪 낚싯배 체험 시작! 10분 동안 흰 배·대포·고급 낚싯대를 빌려요. 바다에서 "내 보트"를 누르세요', 4200); }
  function endTrial(why) { if (!trial) return; trial = null; bag = rawBag; if (battle) { battle.stop(); battle = null; camX = null; } const f = document.querySelector('.fs .fs-quit'); if (f) f.click();
    if (me.boat && me.boat.own && !bag.boat) { leaveBoat(); if (me.x > FISH_X - 40) me.x = FISH_X - 60; } else if (me.boat && me.boat.own && me.x > FISH_X + TILE - 30 && !(bag.wboat && bag.cannon)) me.x = FISH_X + TILE - 60; toast(why || '낚싯배 체험이 끝났어요', 3000); drawHp(); }
  const saveBag = patch => { bag = { ...bag, ...patch }; drawHp(); if (trial) { const rest = {}; Object.keys(patch).forEach(k => { if (TRIAL_KEYS.includes(k)) trial.g[k] = patch[k]; else rest[k] = patch[k]; }); if (!Object.keys(rest).length) return Promise.resolve(); patch = rest; } return ctx.store.update('bag/' + ctx.uid, patch).catch(() => {}); };
  const addCoins = n => trial ? Promise.resolve() : ctx.store.tx('money/' + ctx.uid, c => ({ ...(c || {}), c: Math.max(0, ((c && c.c) || 0) + n), total: ((c && c.total) || 0) + Math.max(0, n) })).catch(() => {});
  let fishOpen = false, hintAt = 0, fishBtn = null, fishMode = -1, dex = {}, rockKey = '', battle = null, battleDir = 1, camX = null, sbPanel = null, heave = 0;
  const boatD = () => (bag.boatD == null ? 100 : bag.boatD), BOAT_MIN = 20;
  // 낚시: 낚시터에서 내 배를 탄 채 🎣. 중급부터는 가끔 갈매기 해적단이 먼저 덤빈다
  function goFish() { const zone = zoneOf(me.x); if (!zone || fishOpen || battle || !(me.boat && (me.boat.own || me.boat.pass))) return; const guest = !!me.boat.pass; fishOpen = true; keys.clear();
    const done = () => { fishOpen = false; if (!voice.on) bgm.duck(false); lastT = performance.now(); };
    openFishing({ ctx, zone, trial: !!trial, boat: boatSvg(me.boat.skin), bag: () => bag, save: saveBag, coins: addCoins, dex: (id, cm) => trial ? null : ctx.store.tx(`fishdex/${ctx.uid}/${id}`, c => ({ n: ((c && c.n) || 0) + 1, best: Math.max((c && c.best) || 0, cm) })).catch(() => {}), onClose: done, onPirate: guest ? null : () => pirates(zone) }); }
  // 갈매기 해적단: 낚시하던 그 바다에서, 멀찍이 떨어져 포를 주고받는다. 지면 배 내구도가 반으로 줄고 500코인을 뺏긴다
  // 해적단 보물: 화면 가운데에서 보물 상자가 열리고 금화가 쏟아진다
  function lootFx(n) { const CHEST = '<svg viewBox="0 0 120 100"><path class="lid" d="M14 44 Q14 12 60 12 Q106 12 106 44z" fill="#B5741B" stroke="#5A3A12" stroke-width="4" stroke-linejoin="round"/><path class="lid" d="M36 14 V44M84 14 V44" stroke="#F2C230" stroke-width="7"/><ellipse cx="60" cy="46" rx="42" ry="9" fill="#FFE066"/><circle cx="44" cy="42" r="8" fill="#FFD43B" stroke="#C98A00" stroke-width="2"/><circle cx="62" cy="38" r="9" fill="#FFD43B" stroke="#C98A00" stroke-width="2"/><circle cx="79" cy="43" r="8" fill="#FFD43B" stroke="#C98A00" stroke-width="2"/><rect x="14" y="44" width="92" height="46" rx="6" fill="#9A5F16" stroke="#5A3A12" stroke-width="4"/><path d="M36 44 V90M84 44 V90" stroke="#F2C230" stroke-width="7"/><rect x="51" y="52" width="18" height="20" rx="4" fill="#F2C230" stroke="#8A5A00" stroke-width="3"/><circle cx="60" cy="61" r="3" fill="#5A3A12"/></svg>';
    const box = h('div', { class: 'sb-loot', onClick: () => box.remove() }, h('i', { class: 'sb-rays' }), ...Array.from({ length: 22 }, (_, k) => h('i', { class: 'sb-coin', style: { '--a': (k / 22 * 360 + Math.random() * 14).toFixed(0) + 'deg', '--d': (70 + Math.random() * 90).toFixed(0) + 'px', '--t': (0.35 + Math.random() * 0.35).toFixed(2) + 's' } }, '🪙')), h('div', { class: 'sb-chest', html: CHEST }), h('b', null, '해적단의 보물!'), h('strong', null, `+${n.toLocaleString('ko-KR')} 🪙`));
    scroller.parentNode.append(box); sfx('bigfish'); setTimeout(() => sfx('coin'), 500); setTimeout(() => sfx('coin'), 700); setTimeout(() => box.remove(), 3400); }
  function pirates(zone) { if (battle || !alive) return; keys.clear(); const D = Math.max(620, scroller.clientWidth * 1.9), foeX = me.x + D <= WIDTH - 90 ? me.x + D : me.x - D; me.f = foeX > me.x ? 1 : -1; sfx('bad');
    battleDir = me.f; battle = seaBattle({ world: scroller.firstElementChild, stage: scroller.parentNode, panel: sbPanel, zone, meEl, boatEl, shout: t => pop(mePop, t, 'say long'), flee: async () => (trial ? true : await ctx.spend(FLEE_FEE)), minX: FISH_X + 60, maxX: WIDTH - 70, move: x => { me.x = x; }, me: { x: me.x, y: me.dy * H, s: me.ds }, foeX, balls: () => bag.balls || 0, useBall: () => saveBag({ balls: Math.max(0, (bag.balls || 0) - 1) }), cam: x => { camX = x; },
      onEnd: win => { battle = null; camX = null; lastT = performance.now(); if (win === 'flee') return void toast(trial ? '해적단에게서 도망쳤어요 (체험이라 돈은 안 나가요)' : `해적단에게 ${FLEE_FEE} 🪙 내고 도망쳤어요`, 3200); if (win) { const loot = PIRATE_LOOT; addCoins(loot); lootFx(loot); }
        else { const d = Math.floor(boatD() / 2); saveBag({ boatD: d }); addCoins(-500); toast(`해적단에게 500 🪙 뺏기고 배 내구도가 ${d}로 줄었어요${d < BOAT_MIN ? '. 수리해야 중급 바다에 나갈 수 있어요' : ''}`, 4200); } } }); }
  function makeWave(now) { const B = me.boat, hard = B.wave >= 70, w = h('i', { class: 'so-wave' + (hard ? ' hard' : ''), style: { left: me.x + 'px', bottom: (me.dy * 100).toFixed(1) + '%' } }); meEl.parentNode.append(w); setTimeout(() => w.remove(), 1300); sfx(hard ? 'swing' : 'tock');
    actors.forEach((o, i) => { if (i === held || o.x <= WATER_X || Math.abs(o.x - me.x) > 230 || ['chase', 'boat', 'palboat', 'offer', 'stun'].includes(o.st)) return;
      if (hard) { o.st = 'stun'; o.until = now + 900; o.kb = (o.x >= me.x ? 1 : -1) * 130; o.e.classList.remove('walk'); pop(o.e, toned(i, pick(['으악, 밀려난다!', '너무 세!', '살살 해!'])), 'say'); if (now > (o.pushAt || 0)) { o.pushAt = now + 6000; setRel(i, { a: Math.max(-100, A(i) - 1) }); scores(); } }
      else { o.surfUntil = now + 850; if (now > (o.surfAt || 0)) { o.surfAt = now + 5000; pop(o.e, toned(i, pick(['야호~', '파도다!', '한 번 더!', '신난다'])), 'say'); }
        if (A(i) < 99 && now > (o.surfGain || 0)) { o.surfGain = now + 30000; setRel(i, { a: A(i) + 1 }); setTimeout(() => alive && pop(o.e, '+1 💗', 'up'), 500); scores(); } } }); }
  function leaveBoat() { if (!me.boat) return; const o = actors[me.boat.i]; if (o) { o.st = 'idle'; o.until = performance.now() + 800; } me.boat = null; boatEl.style.display = 'none'; }
  function boardBoat() { const i = offer.i, o = actors[i]; offer = null; me.boat = { i, t: 0, gain: 0 }; o.st = 'boat'; o.e.classList.remove('walk', 'left'); boatEl.innerHTML = boatSvg(i); sfx('jump'); pop(o.e, toned(i, '출발!'), 'say'); }
  // 화는 가만히 둬도 5분에 1점씩 풀린다(앱을 꺼 둔 시간도 친다)
  const aiBank = {}, aiBusy = {}; let aiAt = 0, aiN = 0;
  const SITU = {
    greet: () => `(${ctx.me.name}가 네 옆을 지나간다. 네가 먼저 반갑게 한마디 건넨다. 인사나 다정한 칭찬을 네 성격대로, 매번 새롭게)`,
    shine: () => `(${ctx.me.name}가 반짝이는 황금 장신구를 하나 걸치고 네 옆을 지나간다. 네가 먼저 그 반짝임을 칭찬한다)`,
    awe: n => `(${ctx.me.name}가 황금 장신구를 ${n}개나 걸치고 네 옆을 지나간다. 네가 먼저 너무 멋지다, 눈부시다, 존경한다는 마음을 네 성격과 동물다운 표현으로 말한다)`,
    hero: n => `(${ctx.me.name}가 황금 장신구를 ${n}개나 걸치고 네 옆을 지나간다. 너는 감동해서 눈물을 흘린다. 네가 먼저 "우리 세상의 영웅"이라는 뜻을 담아 상대의 자존감을 채워 주는 칭찬을 네 성격대로 말한다)`,
    king: () => `(${ctx.me.name}가 황금 장신구 여섯 개를 모두 걸친 대왕이 되어 네 옆을 지나간다. 네가 먼저 "대왕 폐하"라고 부르며 공손하게 인사한다. 존댓말로, 네 동물다운 표현을 섞어서)`,
    care: () => `(${ctx.me.name}가 바다에서 놀고 있다. 네가 먼저 다칠까 봐 걱정하고 챙겨 주는 다정한 한마디를 한다. 소중한 존재라는 느낌이 들게)`,
    cake: () => `(너와 ${ctx.me.name}는 단짝 바로 직전이다. 100점 단짝이 되려면 케이크 선물이 꼭 필요하다는 것을 네가 먼저 귀엽게 알려 준다. "케이크"라는 말을 꼭 넣는다)`,
    sulk: () => `(${ctx.me.name}가 한참 동안 너와 놀아 주지 않아서 마음이 조금 식었다. 네가 먼저 귀엽게 서운해하며 경고한다. 화내지 말고 삐진 듯 애교 있게)` };
  function line(i, kind, fallback, n) { const key = i + '|' + kind + (n || ''), bank = aiBank[key] || (aiBank[key] = []), out = bank.length ? bank.shift() : fallback, now = performance.now();
    if (!bank.length && !aiBusy[key] && now - aiAt > 5000 && aiN < 300 && PERSONA[i]) { aiBusy[key] = 1; aiAt = now; aiN++; const a = ANIMALS[i], p = PERSONA[i];
      askAI(ctx.room, { name: a.name, trait: p.trait, likes: p.likes.join(', '), hates: p.hates.join(', '), user: ctx.me.name, a: A(i), mem: `(말투 규칙: ${TONE[i][1]}. 대답은 반드시 이 말투로 한다)`, text: SITU[kind](n) }).then(r => { if (r && r.by === 'claude' && r.reply && r.reply.length <= 80) bank.push(r.reply); }).catch(() => {}).finally(() => { aiBusy[key] = 0; }); }
    return out; }
  // 화는 친목회 안에서 흐른 시간(ms)으로 5분에 1점씩 풀리고, 친한 동물은 하루 넘게 교류가 없으면 8시간마다 1점 식는다(식을 때는 귀엽게 서운해한다)
  const acc = {}; // 동물별로 화가 풀리는 데 쌓인 시간 { calm } — 중간중간 저장해 두고 다음에 이어서 센다
  const accOf = k => acc[k] || (acc[k] = { calm: (mine[k] || {}).calmT || 0 });
  function calm(ms) { let ch = false; Object.keys(mine).forEach(k => { const r = mine[k]; if (!r || !ANIMALS[k]) return; const t = accOf(k), was = { ...t };
      if (r.a >= KEEP_AT) { t.calm = 0; const wall = ctx.store.now(); if (!r.fedAt) return void setRel(k, { fedAt: wall, dropN: 0 }); const n = dropsBy(wall - r.fedAt) - (r.dropN || 0);
        if (n > 0) { const v = Math.max(KEEP_AT - 1, r.a - n), lost = r.a - v; setRel(k, { a: v, dropN: (r.dropN || 0) + n }); ch = true; const o = actors[k]; if (lost > 0 && o && alive) setTimeout(() => alive && pop(o.e, line(+k, 'sulk', toned(+k, pick(SULK))) + ` (친밀도 -${lost})`, 'say long'), 400 + Math.random() * 2500); } }
      else if (r.a < 0) { t.calm += ms; if (t.calm >= CALM_MS) { t.calm = 0; setRel(k, { a: Math.min(0, r.a + 1), calmT: 0 }); ch = true; } else if (Math.floor(t.calm / 150000) !== Math.floor(was.calm / 150000)) setRel(k, { calmT: t.calm }); }
      else t.calm = 0; }); if (ch) scores(); }
  // 물에서는 사이 나쁜 동물이 때리는 대신 머리를 눌러 물을 먹인다: 돈은 안 나가고 체력이 조금씩 계속 준다
  function gotDunk(o, now) { o.nextHit = now + 600; me.dunkUntil = now + 480; sfx('bad'); pop(mePop, pick(['꼬르륵', '어푸!', '켁켁']), 'lose'); const hp = Math.max(0, hpNow() - 1); if (hp <= 0) return die(); saveVit({ hp }); drawHp(); }
  // 때리기: 앞에 있는 가까운 동물을 친다. 맞은 동물은 밀려나고 친밀도가 떨어지며, 그 일을 기억한다
  function punch() {
    const now = performance.now(); if (now - punchAt < 600 || document.querySelector('.modal-wrap')) return; punchAt = now; getOff();
    meEl.classList.remove('punch'); void meEl.offsetWidth; meEl.classList.add('punch'); sfx('swing');
    let best = -1, bd = 92; actors.forEach((o, i) => { const dx = o.x - me.x, d = Math.abs(dx) + (dx * me.f < 0 ? 20 : 0) + Math.abs(o.y - me.dy) * H * 0.9; if (d < bd) { bd = d; best = i; } });
    if (best < 0) return; const o = actors[best], dir = o.x >= me.x ? 1 : -1; me.f = dir;
    sfx('hit'); pop(o.e, '퍽!'); leave(o); o.st = 'stun'; o.until = now + 900; o.kb = dir * 46; o.e.classList.remove('walk'); o.e.classList.add('ouch'); setTimeout(() => o.e.classList.remove('ouch'), 500);
    const rel = mine[best] || {}, mem = Array.isArray(rel.mem) ? rel.mem : Object.values(rel.mem || {}), v = Math.max(-100, A(best) - 6);
    setRel(best, { a: v, mem: [...mem.slice(-5), { s: '(말없이 때렸다)', r: '아야! 왜 때려!', d: -6, t: ctx.store.now() }] }); o.rage = true; scores();
    setTimeout(() => alive && pop(o.e, toned(best, v <= CHASE_AT ? '가만 안 둬!' : '아야!'), 'say'), 250);
  }
  // 쫓아오기 시작한 순간 사과하면 그 동물은 쫓기를 그만둔다. -15점까지는 1초 안에 버튼, 그보다 나쁘면 3.5초 안에 "미안해"를 직접 입력해야 한다
  const SORRY_UI = { btn: { el: null, list: [], t: 0, ms: 1000 }, type: { el: null, list: [], t: 0, ms: 2500, typing: false } };
  function endSorry(kind) { (kind ? [kind] : ['btn', 'type']).forEach(k => { const u = SORRY_UI[k]; clearTimeout(u.t); if (u.el) u.el.remove(); u.el = null; u.list = []; }); }
  function forgive(kind) { SORRY_UI[kind].list.forEach(k => { const o = actors[k]; if (!o || o.st !== 'chase') return; o.st = 'idle'; o.until = performance.now() + 1500; o.e.classList.remove('walk', 'chase'); pop(o.e, toned(k, '…이번만 봐준다'), 'say'); }); sfx('point'); endSorry(kind); }
  function quickSorry(i) {
    const kind = A(i) < -15 ? 'type' : 'btn', u = SORRY_UI[kind]; u.list.push(i); actors[i].nextHit = performance.now() + u.ms; actors[i].until += u.ms; // 사과할 시간 동안은 때리지 않고, 그만큼 더 쫓는다 if (u.el) return;
    if (kind === 'btn') u.el = h('button', { class: 'so-sorry', onClick: () => forgive('btn') }, '🙇 미안해!', h('i'));
    else { const inp = h('input', { class: 'so-sorryin', placeholder: '미안해', maxLength: 8, autocomplete: 'off', enterKeyHint: 'send' }), bar = h('i'), tip = h('span', null, '👇 여기를 눌러 "미안해"라고 입력하세요');
      const hold = ms => { const t = performance.now() + ms; u.list.forEach(k => { const o = actors[k]; if (o) { o.until += Math.max(0, t - o.nextHit); o.nextHit = t; } }); };
      inp.addEventListener('input', () => { if (inp.value.replace(/\s/g, '').includes('미안해')) forgive('type'); });
      // 폰은 직접 눌러야 키보드가 올라온다: 누른 순간부터 3.5초를 센다(누르기까지는 2.5초 기다려 준다)
      inp.addEventListener('focus', () => { if (u.typing) return; u.typing = true; tip.textContent = '3.5초 만에 "미안해"라고 입력하세요'; clearTimeout(u.t); u.t = setTimeout(() => endSorry('type'), 3500); hold(3500); bar.style.animation = 'none'; void bar.offsetWidth; bar.style.animation = 'soSorryBar 3.5s linear forwards'; });
      u.typing = false; u.el = h('label', { class: 'so-sorry type' }, tip, inp, bar); keys.clear(); setTimeout(() => inp.focus(), 0); }
    scroller.parentNode.parentNode.insertBefore(u.el, scroller.parentNode.nextSibling); if (!(kind === 'type' && u.typing)) u.t = setTimeout(() => endSorry(kind), kind === 'type' ? 2500 : u.ms);
  }
  // 사이가 나쁜 동물에게 맞으면 돈이 조금 나간다
  function gotHit(o, now) {
    o.nextHit = now + 900; getOff(); me.kb = (me.x >= o.x ? 1 : -1) * 70; sfx('hit'); pop(mePop, '퍽!'); meEl.classList.remove('ouch'); void meEl.offsetWidth; meEl.classList.add('ouch');
    const hp = Math.max(0, hpNow() - HIT_DMG); if (hp <= 0) return die(); saveVit({ hp }); drawHp();
    const n = Math.min(ctx.coins(), 3 + Math.floor(Math.random() * 4)); if (n <= 0) return;
    ctx.store.tx('money/' + ctx.uid, c => ({ ...(c || {}), c: Math.max(0, ((c && c.c) || 0) - n) })).catch(() => {}); setTimeout(() => alive && pop(mePop, `-${n}🪙`, 'lose'), 200);
  }
  // 동물들이 걸어 다니다가 가까운 놀이기구가 비면 가서 탄다. 말을 걸고 있는 동물(held)은 그 자리에 멈춘다
  function leave(o) { if (!o.spot) return; o.e.className = o.e.className.replace(/ ride r-\w+/g, '').replace(' rev', '').replace(' late', ''); if (o.spot.eq) o.spot.eq.on = Math.max(0, o.spot.eq.on - (o.st === 'ride' ? 1 : 0)); o.body.style.transform = ''; o.spot.by = -1; o.spot = null; }
  const crowded = (o, x) => actors.some(q => q !== o && q.lane === o.lane && q.st !== 'ride' && (Math.abs(q.x - x) < 64 || Math.abs(q.tx - x) < 64));
  function decide(o, i) {
    const free = Math.random() < 0.25 ? spots.filter(s => s.by < 0 && Math.abs(s.x - o.x) < 520) : [];
    if (free.length) { const s = pick(free); s.by = i; o.spot = s; o.tx = s.x; }
    else { let tx = o.x; for (let n = 0; n < 8; n++) { tx = Math.max(60, Math.min(FISH_X - 70, o.x + (Math.random() * 2 - 1) * 260)); if (!crowded(o, tx)) break; tx = o.x; } o.tx = tx; if (tx === o.x) { o.until = performance.now() + 800; return; } }
    o.st = 'walk'; o.wait = 0; o.e.classList.add('walk'); o.e.classList.toggle('left', o.tx < o.x);
  }
  function step(now) {
    if (!alive || !playing) return; const wall = ctx.store.now(), dt = Math.min(0.1, (now - lastT) / 1000), t = now / 1000, paused = fishOpen || !!battle || !!document.querySelector('.modal-wrap'); lastT = now;
    // 나: 화살표로 걷고, 화면이 따라온다
    const mx = paused ? 0 : (keys.has('R') ? 1 : 0) - (keys.has('L') ? 1 : 0), my = paused ? 0 : (keys.has('U') ? 1 : 0) - (keys.has('D') ? 1 : 0);
    if (me.kb) { const k = me.kb * Math.min(1, dt * 9); me.x = Math.max(40, Math.min(WIDTH - 40, me.x + k)); me.kb = Math.abs(me.kb - k) < 1 ? 0 : me.kb - k; }
    if ((mx || my) && me.ride) getOff();
    const wet = me.x > WATER_X && !me.ride;
    // 낚시터 문턱: 배가 없으면 못 넘고, 중급부터는 대포를 단 흰 배가 있어야 한다
    const own = !!(me.boat && me.boat.own), lim = !own ? FISH_X - 14 : bag.wboat && bag.cannon && boatD() >= BOAT_MIN ? WIDTH - 40 : FISH_X + TILE - 18;
    if (own && me.boat.skin !== myBoatSkin()) { me.boat.skin = myBoatSkin(); boatEl.innerHTML = boatSvg(me.boat.skin); }
    if (mx) { me.f = mx; const nx = me.x + mx * ME_SP * (own ? (bag.wboat ? 1.7 : 1.1) : me.boat ? 1.1 : wet ? 0.7 : 1) * dt; me.x = Math.max(40, Math.min(Math.max(lim, Math.min(me.x, WIDTH - 40)), nx));
      if (mx > 0 && nx > lim && now > hintAt) { hintAt = now + 3500; toast(!own ? '여기부터는 낚시터예요. 내 배(카피수퍼)를 타야 갈 수 있어요' : !bag.wboat ? '중급 낚시터부터는 흰 배(2,000코인)가 있어야 해요' : !bag.cannon ? '중급 낚시터부터는 대포(500코인)를 달아야 해요. 갈매기 해적단이 나와요' : '배가 너무 상했어요. 카피수퍼에서 배를 수리해야 중급 바다에 나갈 수 있어요', 3000); } }
    if (trial && now > trial.until && !fishOpen && !battle) endTrial('낚싯배 체험 10분이 끝났어요');
    if (kingTrial && now > kingTrial) endKing();
    if (me.boat && me.boat.pass) { if (palShip()) { me.x = Math.max(40, pal.dx - 30); me.y = Math.max(0, Math.min(Y_MAX, pal.y)); me.f = pal.f; me.boat.skin = pal.boat; }
      else { leaveBoat(); if (me.x > FISH_X - 40) { me.x = FISH_X - 60; toast('배가 떠나서 바닷가 쪽으로 돌아왔어요', 2600); } } }
    meEl.classList.toggle('onpal', !!(me.boat && me.boat.pass));
    { const hv = me.boat ? zoneOf(me.x) : 0; if (hv !== heave) { if (!hv !== !heave) bgm.start(hv ? 'sea' : 'social'); heave = hv; }
      // 배와 캐릭터는 한 몸처럼: 같은 축(배 바닥 가운데)을 중심으로, 같은 박자로 흔들린다
      const guest = !!(me.boat && me.boat.pass), key = me.boat ? `${hv}|${guest ? 'p' : me.boat.own ? 'o' : 'a'}` : '';
      if (me.boat) meEl.style.setProperty('--bx', (guest ? 33 + 22 * me.ds : 3 + 6 * me.ds).toFixed(1) + 'px');
      if (key !== rockKey) { rockKey = key; const all = [meEl, boatEl, palBoat], cls = ['hv0', 'hv1', 'hv2', 'hv3']; all.forEach(n => n.classList.remove(...cls)); meEl.classList.toggle('onboat', !!me.boat); void meEl.offsetWidth; if (me.boat) [meEl, guest ? palBoat : boatEl].forEach(n => n.classList.add('hv' + hv)); } }
    { const zm = (own || (me.boat && me.boat.pass)) && !fishOpen && !battle ? zoneOf(me.x) : 0; if (zm !== fishMode && fishBtn) { fishMode = zm; fishBtn.firstChild.textContent = zm ? '🎣' : '👊'; fishBtn.lastChild.textContent = zm ? '낚시' : '때리기'; fishBtn.classList.toggle('fish', !!zm); } }
    if (me.boat && me.x < WATER_X - 12) leaveBoat();
    if (!calmChk) calmChk = now; if (now - calmChk > 20000) { calm(Math.min(40000, now - calmChk)); calmChk = now; }
    if (now - savedAt > 4000) { savedAt = now; keepPos(); }
    if (me.boat && me.boat.own && !paused) { const B = me.boat; B.wave = mx && me.x < FISH_X ? Math.min(100, B.wave + 26 * dt) : Math.max(0, B.wave - 24 * dt); B.pulse -= dt; if (mx && me.x < FISH_X && B.pulse <= 0) { B.pulse = 0.9; makeWave(now); } }
    { const own = !!(me.boat && me.boat.own) && me.x < FISH_X; if (waveBar.hidden === own) waveBar.hidden = !own; if (own) { const v = me.boat.wave, u = waveBar.querySelector('u'); u.style.width = v + '%'; u.style.background = v >= 70 ? '#E5484D' : v >= 35 ? '#3BA7E5' : '#9AD0F5'; waveBar.lastChild.textContent = v >= 70 ? '너무 세요! 동물들이 밀려나요' : v >= 20 ? '신나는 파도' : '잔잔'; } }
    if (me.boat && !me.boat.own && !me.boat.pass && !paused) { const B = me.boat; B.t += dt; if (B.t >= 4) { B.t = 0; if (A(B.i) < 100 && B.gain < 8) { B.gain++; setRel(B.i, { a: A(B.i) + 1 }); pop(actors[B.i].e, '+1 💗', 'up'); sfx('point'); scores(); } } }
    if (my) me.y = Math.max(0, Math.min(Y_MAX, me.y + my * 0.22 * dt));
    let mty = me.y, mts = 1 - me.y * 0.7; const R = me.ride, g = meEl.firstElementChild;
    if (R) { me.x += (R.x - me.x) * Math.min(1, dt * 6); mty = R.b; mts = RIDE_S; const q = R.eq;
      if (g && q && R.type === 'swing') { const ph = q.cur * R.dir * Math.PI / 180; g.style.transform = `translate(${(-ROPE * Math.sin(ph) / mts).toFixed(1)}px, ${(ROPE * (Math.cos(ph) - 1) / mts).toFixed(1)}px) rotate(${(q.cur * R.dir).toFixed(1)}deg)`; }
      else if (g && q) g.style.transform = `translateY(${((R.x - q.x) * Math.sin(q.cur * R.dir * Math.PI / 180) / mts).toFixed(1)}px)`; }
    if (R && !paused) { const pals = buddiesOf(R); pals.forEach(i => { actors[i].until = Math.max(actors[i].until, now + 2500); }); // 같이 타는 동안은 동물도 안 내린다
      me.rideT = pals.length ? me.rideT + dt : 0;
      if (me.rideT >= 4) { me.rideT = 0; pals.forEach(i => { if (A(i) >= 99 || (me.gain[i] || 0) >= 8) return; me.gain[i] = (me.gain[i] || 0) + 1; setRel(i, { a: A(i) + 1 }); pop(actors[i].e, '+1 💗', 'up'); }); sfx('point'); scores(); } }
    const mk = Math.min(1, dt * (R ? 5 : 14)); me.dy += (mty - me.dy) * mk; me.ds += (mts - me.ds) * mk;
    meEl.classList.toggle('walk', !!(mx || my) && !R); meEl.classList.toggle('swim', wet && !me.boat); meEl.classList.toggle('dunk', now < me.dunkUntil); meEl.style.left = (me.x - (me.boat ? (me.boat.own ? 6 : 22) * me.ds : 0)) + 'px'; mePop.style.left = me.x + 'px'; meEl.style.bottom = (me.dy * 100).toFixed(2) + '%'; mePop.style.bottom = Math.round(me.dy * H + 96 * me.ds) + 'px';
    meEl.style.transform = `scale(${(me.f * me.ds).toFixed(3)}, ${me.ds.toFixed(3)})`; meEl.style.zIndex = R ? 6 : me.dy < 0.07 ? 11 : me.dy < 0.13 ? 10 : me.dy < 0.19 ? 9 : me.dy < 0.25 ? 8 : 7;
    // 내 위치 알리기: 바뀌면 0.25초마다, 가만히 있어도 3초마다
    { const key = `${Math.round(me.x)}|${me.y.toFixed(2)}|${me.f}|${R ? spots.indexOf(R) : -1}|${me.boat ? (me.boat.own ? me.boat.skin : me.boat.pass ? PASS : me.boat.i) : -1}`; if ((key !== sentKey && now - sentAt > 250) || now - sentAt > 3000) { sentKey = key; sentAt = now; ctx.store.set('socialpos/' + ctx.uid, { x: +(me.x / WIDTH).toFixed(4), y: +me.y.toFixed(3), f: me.f, r: R ? spots.indexOf(R) : -1, b: me.boat ? (me.boat.own ? me.boat.skin : me.boat.pass ? PASS : me.boat.i) : -1, t: wall }).catch(() => {}); } }
    // 상대 그리기: 10초 넘게 소식이 없으면 나간 것으로 본다
    if (palEl) { const show = pal.on && wall - pal.t < 10000; palEl.style.display = show ? '' : 'none';
      if (!show) palSpot(null); else { const q = pal.ride >= 0 ? spots[pal.ride] || null : null; palSpot(q); const tx = q ? q.x : pal.x * WIDTH, ty = q ? q.b : pal.y, ts = q ? RIDE_S : 1 - pal.y * 0.7, k = Math.min(1, dt * 7), pg = palEl.firstElementChild;
        if (pal.dx < 0) { pal.dx = tx; pal.dy = ty; pal.ds = ts; } palEl.classList.toggle('walk', !q && Math.abs(tx - pal.dx) > 3); pal.dx += (tx - pal.dx) * k; pal.dy += (ty - pal.dy) * k; pal.ds += (ts - pal.ds) * k;
        palEl.classList.toggle('onpal', pal.boat === PASS);
        if (pal.boat === PASS && me.boat && me.boat.own) { pal.dx = me.x - 30; pal.dy = me.dy; pal.ds = me.ds; } // 내 배에 탄 상대는 배에 딱 붙어 보인다
        if (pg) { const e = q && q.eq; pg.style.transform = !e ? '' : q.type === 'swing' ? `translate(${(-ROPE * Math.sin(e.cur * q.dir * Math.PI / 180) / ts).toFixed(1)}px, ${(ROPE * (Math.cos(e.cur * q.dir * Math.PI / 180) - 1) / ts).toFixed(1)}px) rotate(${(e.cur * q.dir).toFixed(1)}deg)` : `translateY(${((q.x - e.x) * Math.sin(e.cur * q.dir * Math.PI / 180) / ts).toFixed(1)}px)`; pg.style.scale = q ? '1 1' : `${pal.f} 1`; }
        palPop.style.left = pal.dx + 'px'; palPop.style.bottom = Math.round(pal.dy * H + 112 * pal.ds) + 'px';
        palEl.style.left = pal.dx + 'px'; palEl.style.bottom = (pal.dy * 100).toFixed(2) + '%'; palEl.style.transform = `scale(${pal.ds.toFixed(3)})`; palEl.style.zIndex = q ? 6 : pal.dy < 0.07 ? 11 : pal.dy < 0.13 ? 10 : pal.dy < 0.19 ? 9 : 8; } }
    // 튜브와 보트는 나를 따라다닌다
    { const z = +meEl.style.zIndex + 1, sc = `scale(${me.ds.toFixed(3)})`, bt = (me.dy * 100).toFixed(2) + '%';
      meTube.style.display = wet && !me.boat ? '' : 'none'; meTube.style.left = me.x + 'px'; meTube.style.bottom = bt; meTube.style.transform = sc; meTube.style.zIndex = z; meTube.classList.toggle('dunk', now < me.dunkUntil); tubeBack(meTube, meTubeB, z - 2);
      const bo = me.boat && me.boat.pass ? null : me.boat ? { x: me.x, y: me.dy, s: me.ds } : offer ? { x: actors[offer.i].x + 46, y: actors[offer.i].y, s: actors[offer.i].s * 0.8 } : null;
      boatEl.style.display = bo ? '' : 'none'; if (bo) { boatEl.style.left = bo.x + 'px'; boatEl.style.bottom = (bo.y * 100).toFixed(2) + '%'; boatEl.style.transform = battle && battleDir < 0 ? `scale(${(-bo.s).toFixed(3)}, ${bo.s.toFixed(3)})` : `scale(${bo.s.toFixed(3)})`; boatEl.style.zIndex = me.boat ? z : 12; }
      // 상대가 보트를 타면: 그 동물의 보트와 동물이 상대 곁에 같이 보인다
      const pv = palEl.style.display !== 'none'; palBoatI = pv && pal.boat >= 0 && (ANIMALS[pal.boat] || pal.boat >= MY_WBOAT_GUN) ? pal.boat : -1; palBoat.style.display = palBoatI >= 0 ? '' : 'none';
      if (palBoatI >= 0) { if (palBoatDrawn !== palBoatI) { palBoatDrawn = palBoatI; palBoat.innerHTML = boatSvg(palBoatI); } palBoat.style.left = pal.dx + 'px'; palBoat.style.bottom = (pal.dy * 100).toFixed(2) + '%'; palBoat.style.transform = `scale(${pal.ds.toFixed(3)})`; palBoat.style.zIndex = +palEl.style.zIndex + 1; palEl.style.left = (pal.dx - (palBoatI >= MY_WBOAT_GUN ? 6 : 22) * pal.ds) + 'px'; }
      const pw = pv && palBoatI < 0 && pal.dx > WATER_X && !pal.spot; palTube.style.display = pw ? '' : 'none'; if (pw) { palTube.style.left = pal.dx + 'px'; palTube.style.bottom = (pal.dy * 100).toFixed(2) + '%'; palTube.style.transform = `scale(${pal.ds.toFixed(3)})`; palTube.style.zIndex = +palEl.style.zIndex + 1; } tubeBack(palTube, palTubeB, +palEl.style.zIndex - 1); palEl.classList.toggle('swim', pw); }
    const ns = R || me.boat || offer ? null : nearSpot(), rs = R ? 'off' : me.boat ? 'boatoff' : wet && palNear() ? 'boat' : offer ? 'boat' : wet && bag.boat ? 'mine' : wet ? 'buy' : ns ? (buddiesOf(ns).length ? 'with' : 'on') : ''; if (rs !== rideState) { rideState = rs; rideBtn.disabled = !rs; rideBtn.classList.toggle('ready', rs === 'on' || rs === 'with' || rs === 'boat'); rideBtn.firstChild.textContent = rs.startsWith('boat') || rs === 'mine' || rs === 'buy' ? '🚤' : '🎠'; rideBtn.lastChild.textContent = rs === 'off' || rs === 'boatoff' ? '내리기' : rs === 'mine' ? '내 보트' : rs === 'buy' ? '보트 사기' : rs === 'with' || rs === 'boat' ? '같이 타기' : '타기'; }
    scroller.scrollLeft = Math.max(0, Math.min(WIDTH - scroller.clientWidth, (camX == null ? me.x : camX) - scroller.clientWidth / 2));
    // 놀이기구: 누가 타면 크게, 아니면 살짝 흔들린다
    tiles.forEach(T => { T.sw.forEach(w => { w.a += ((w.on ? 17 : 3) - w.a) * Math.min(1, dt * 2); w.cur = w.a * Math.sin(t * 2.3 + w.ph); w.g.setAttribute('transform', `rotate(${w.cur.toFixed(2)} ${w.cx} 243)`); });
      const S = T.see; S.cur += ((S.on ? 11 * Math.sin(t * 2.6) : -11) - S.cur) * Math.min(1, dt * 6); S.g.setAttribute('transform', `rotate(${S.cur.toFixed(2)} 598.8 320)`); });
    const shineN = myRares().length, shiny = shineN > 0; meEl.classList.toggle('shiny', shiny);
    actors.forEach((o, i) => {
      const lane = LANES[o.lane]; let ty = lane[0], ts = lane[1]; const ow = o.x > WATER_X;
      o.e.classList.toggle('swim', ow && o.st !== 'boat' && o.st !== 'palboat'); o.e.classList.toggle('surf', now < (o.surfUntil || 0));
      if (i === held) { /* 붙잡혀서 얘기하는 중 */ }
      else if (o.st === 'boat') { if (!me.boat || me.boat.i !== i) { o.st = 'idle'; o.until = now + 500; } else { o.x = me.x + 24 * me.ds; o.y = ty = me.dy; o.s = ts = me.ds; } }
      else if (palBoatI === i && o.st !== 'chase' && o.st !== 'stun') { if (o.st !== 'palboat') { leave(o); o.st = 'palboat'; o.e.classList.remove('walk', 'left'); } o.x = pal.dx + 24 * pal.ds; o.y = ty = pal.dy; o.s = ts = pal.ds; }
      else if (o.st === 'palboat') { o.st = 'idle'; o.until = now + 600; }
      else if (o.st === 'offer') { if (!offer || offer.i !== i || now > offer.until || !wet || me.boat) { if (offer && offer.i === i) offer = null; o.st = 'idle'; o.until = now + 600; } }
      else if (o.st === 'stun') { if (o.kb) { const k = o.kb * Math.min(1, dt * 8); o.x = Math.max(40, Math.min(FISH_X - 50, o.x + k)); o.kb -= k; } if (now > o.until) { o.st = 'idle'; o.until = now + 300; o.kb = 0; } }
      else if (o.st === 'chase') { ty = me.dy; ts = 1 - me.dy * 0.7; if (paused) o.until += dt * 1000; const d = me.x - o.x;
        if (Math.abs(d) > 34) { o.x = Math.min(FISH_X - 50, o.x + Math.sign(d) * CHASE_SP * dt); o.e.classList.toggle('left', d < 0); } else if (now > o.nextHit && !paused && !me.boat && Math.abs(o.y - me.dy) < 0.06) (me.x > WATER_X ? gotDunk : gotHit)(o, now);
        if (now > o.until) { o.st = 'idle'; o.until = now + 600; o.e.classList.remove('walk', 'chase'); } }
      else {
        if (!paused && A(i) <= CHASE_AT && Math.abs(me.x - o.x) < (o.rage ? 420 : 170) && (o.rage || wall - ((mine[i] || {}).chaseAt || 0) > TEN_MIN)) { o.rage = false; setRel(i, { chaseAt: wall }); leave(o); o.st = 'chase'; o.until = now + 7000; o.nextHit = now + 300; o.e.classList.add('walk', 'chase'); pop(o.e, toned(i, '거기 서!'), 'say'); quickSorry(i); }
        else if (!paused && wet && ow && o.st !== 'ride' && A(i) >= 30 && Math.abs(me.x - o.x) < 120 && now > o.offerAt) { // 물에서 친한 동물과 마주치면 걱정하고 챙겨 준다(배를 태워 주지는 않는다)
          o.offerAt = now + 40000; pop(o.e, line(i, 'care', toned(i, CARE[Math.floor(Math.random() * CARE.length)])), 'say long'); animalVoice(i); }
        else if (o.st === 'walk') { const d = o.tx - o.x, step1 = o.sp * dt * (ow ? 0.7 : 1), dir = Math.sign(d);
          const blocked = o.wait < 1.5 && actors.some(q => q !== o && q.lane === o.lane && q.st !== 'ride' && (q.x - o.x) * dir > 0 && (q.x - o.x) * dir < 58 && !(o.spot && Math.abs(d) < 110));
          if (blocked) { o.wait += dt; if (!o.spot && o.wait > 0.5) { o.st = 'idle'; o.until = now + 500 + Math.random() * 1200; o.e.classList.remove('walk'); } }
          else if (Math.abs(d) <= step1) { o.x = o.tx; o.e.classList.remove('walk', 'left');
            if (o.spot) { o.st = 'ride'; o.until = now + 9000 + Math.random() * 7000; if (o.spot.eq) o.spot.eq.on++; o.e.className += ' ride r-' + o.spot.type + (o.spot.dir < 0 ? ' rev' : '') + o.spot.late; }
            else { o.st = 'idle'; o.until = now + 900 + Math.random() * 3600; } }
          else o.x += dir * step1;
          if (o.spot) { const k = Math.max(0, 1 - Math.abs(o.tx - o.x) / 110); ty += (o.spot.b - ty) * k; ts += (RIDE_S - ts) * k; } }
        else if (o.st === 'ride') { ty = o.spot.b; ts = RIDE_S; const q = o.spot.eq;
          if (q && o.spot.type === 'swing') { const ph = q.cur * o.spot.dir * Math.PI / 180; o.body.style.transform = `translate(${(-ROPE * Math.sin(ph) / ts).toFixed(1)}px, ${(ROPE * (Math.cos(ph) - 1) / ts).toFixed(1)}px) rotate(${(q.cur * o.spot.dir).toFixed(1)}deg)`; }
          else if (q) o.body.style.transform = `translateY(${((o.x - q.x) * Math.sin(q.cur * o.spot.dir * Math.PI / 180) / ts).toFixed(1)}px)`;
          if (now > o.until) { leave(o); o.st = 'idle'; o.until = now + 500; } }
        else if (now > o.until) decide(o, i);
      }
      if (!paused && i !== held && (o.st === 'idle' || o.st === 'walk') && (mx || my) && (A(i) >= 30 || (shiny && A(i) >= 0)) && Math.abs(me.x - o.x) < (shiny ? 110 : 85) && now > o.greetAt) { o.greetAt = now + (shiny ? 9000 : 14000) + Math.random() * 9000;
        const near100 = A(i) >= 90 && A(i) < 100;
        if (near100 && now > (o.cakeAt || 0)) { o.cakeAt = now + 60000; pop(o.e, line(i, 'cake', toned(i, pick(CAKE_HINT))), 'say long'); } // 단짝 직전: 케이크가 필요하다고 알려 준다
        else if (shineN >= 6) { // 대왕 폐하: 10분에 한 번 절을 하고, 30분에 한 번 세금 1코인을 바친다
          const r = mine[i] || {}, due = !kingTrial && wall - (r.taxAt || 0) >= TAX_MS, bow = kingTrial ? now > (o.tbow || 0) : wall - (r.bowAt || 0) >= BOW_MS; if (kingTrial) o.tbow = now + 12000; pop(o.e, due ? '대왕 폐하! 세금 1코인 바치옵니다 🪙' : line(i, 'king', KING[(i + Math.floor(now / 9000)) % KING.length]), 'say long');
          if (bow) { o.e.style.setProperty('--bd', me.x < o.x ? -1 : 1); o.e.classList.add('bow'); setTimeout(() => o.e.classList.remove('bow'), 2400); } // 선 채로 내 쪽을 향해 허리를 깊이 숙였다 일어난다
          if (!kingTrial && (due || bow)) setRel(i, { ...(due ? { taxAt: wall } : {}), ...(bow ? { bowAt: wall } : {}) }); if (due) { addCoins(1); sfx('coin'); } }
        else if (shineN >= 4) { pop(o.e, line(i, 'hero', AWE2[i], shineN), 'say long'); o.e.classList.add('cry'); setTimeout(() => o.e.classList.remove('cry'), 2600); } // 눈물을 흘리며 영웅이라고
        else if (shineN >= 2) pop(o.e, line(i, 'awe', AWE1[i], shineN), 'say long');
        else { const sh = shiny && (A(i) < 30 || Math.random() < 0.6); pop(o.e, line(i, sh ? 'shine' : 'greet', toned(i, pick(sh ? RAREGREET : GREET)(ctx.me.name))), 'say long'); } }
      const k = Math.min(1, dt * 5); o.y += (ty - o.y) * k; o.s += (ts - o.s) * k;
      o.e.style.left = o.x + 'px'; o.e.style.bottom = (o.y * 100).toFixed(2) + '%'; o.e.style.transform = `scale(${o.s.toFixed(3)})`; });
    raf = requestAnimationFrame(step);
  }
  // 동물 머리 위 친밀도: 내 점수(크게)와 상대 점수(작게). 사이가 나쁘면 찌푸리고, 좋으면 하트가 떠오른다
  function scores() {
    if (!scroller) return;
    scroller.querySelectorAll('.so-an').forEach(e => { const i = +e.dataset.i, a = A(i), lv = levelOf(a), t = pid() && theirs[i] ? theirs[i].a || 0 : null, s = e.querySelector('.so-score'), mood = moodOf(a), hearts = a >= 80 ? 3 : a >= 50 ? 2 : a >= 30 ? 1 : 0;
      s.className = 'so-score' + (a < 0 ? ' neg' : a >= PIN_AT ? ' hi' : ''); s.replaceChildren(h('b', null, `${lv[2]} ${a}`), t != null && h('i', null, `${ctx.nameOf(pid()).slice(0, 3)} ${t}`) || '');
      if (e.dataset.mood !== mood) { e.dataset.mood = mood; e.querySelector('.so-body').innerHTML = animalSvg(i, true, mood); }
      if (+e.dataset.hearts !== hearts) { e.dataset.hearts = hearts; e.querySelector('.so-hearts').replaceChildren(...Array.from({ length: hearts }, (_, k) => h('i', { style: { animationDelay: k * 0.7 + 's', left: [50, 22, 78][k] + '%' } }, '💗'))); } });
    const face = h('div', { html: capy(ctx.capyOf(ctx.uid, { face: 'happy' })) }); if (meEl) meEl.innerHTML = face.innerHTML; drawPal();
  }

  // ----- 동물과 만나기 -----
  function openAnimal(i) {
    const a = ANIMALS[i], p = PERSONA[i]; let busy = false, said = '', close; held = i; animalVoice(i); actors[i] && actors[i].e.classList.remove('walk');
    const faceEl = h('span', { html: animalSvg(i, true, moodOf(A(i))) }); let faceMood = moodOf(A(i));
    const bubble = h('p', { class: 'so-bubble' }), meter = h('div', { class: 'so-meter' }), quick = h('div', { class: 'so-quick' }), input = h('input', { class: 'so-input', maxLength: 60, placeholder: `${a.name}에게 하고 싶은 말`, enterKeyHint: 'send' });
    const say = (t, cls = '', raw = false) => { bubble.className = 'so-bubble ' + cls; bubble.textContent = raw || t === '…' ? t : toned(i, t); };
    const fedNote = h('p', { class: 'so-fed' });
    const drawMeter = () => { const v = A(i), lv = levelOf(v), nx = LEVELS.find(l => l[0] > v); { const left = DAY_MS - (ctx.store.now() - ((mine[i] || {}).fedAt || ctx.store.now())); fedNote.hidden = v < KEEP_AT; fedNote.className = 'so-fed' + (left < 3 * 3600000 ? ' due' : ''); fedNote.textContent = left <= 0 ? '💬 하루 넘게 못 만나서 서운해해요. 말을 걸면 다시 괜찮아져요 (8시간마다 -1)' : `💬 하루에 한 번만 말을 걸면 사이가 유지돼요 (남은 시간 ${Math.floor(left / 3600000)}시간 ${Math.floor(left / 60000) % 60}분)`; } if (moodOf(v) !== faceMood) { faceMood = moodOf(v); faceEl.innerHTML = animalSvg(i, true, faceMood); } meter.replaceChildren(h('b', null, `${lv[2]} ${lv[1]}`), h('i', null, h('u', { style: { width: (v + 100) / 2 + '%', background: v < 0 ? '#E5484D' : v >= PIN_AT ? '#FF7FA8' : '#57C26B' } })), h('span', null, `${v}점${nx ? ` · ${nx[1]}까지 ${nx[0] - v}` : ''}`)); scores(); };
    const drawQuick = () => quick.replaceChildren(...[pick(QUICK.good), A(i) < 0 ? '미안해, 내가 잘못했어' : pick(QUICK.flat), pick(QUICK.bad)].map((t, k) => h('button', { class: 'so-q q' + k, onClick: () => talk(t) }, t)));
    // 친밀도가 바뀐 뒤: 선물로 받는 액세서리, 사이가 나쁠 때 삥 뜯기
    async function after(d, was) {
      const v = A(i), rel = mine[i] || {};
      if (d) { sfx(d > 0 ? 'coin' : 'bad'); const f = h('em', { class: 'so-float ' + (d > 0 ? 'up' : 'down') }, (d > 0 ? '+' : '') + d); meter.append(f); setTimeout(() => f.remove(), 1200); }
      if (v >= PIN_AT && !rel.got) { await setRel(i, { got: true }); await ctx.store.update('bag/' + ctx.uid + '/pins', { [i]: true }).catch(() => {}); bag = { ...bag, pins: { ...(bag.pins || {}), [i]: true } };
        await wearPin(i);
        setTimeout(() => { gameFx('win', `${a.name}의 ${p.pin} 받음`); say(`우리 이제 친한 친구지? 내 상징 ${p.pin} 줄게. 내가 달아 줬어! (가방에서 바꿀 수 있어)`, 'gift'); }, 500); }
      else if (v <= ROB_AT && d < 0 && Math.random() < 0.4) { // 사이가 나쁘면 준 액세서리를 뺏거나 돈을 뜯는다
        if ((bag.pins || {})[i]) { await ctx.store.update('bag/' + ctx.uid + '/pins', { [i]: null }).catch(() => {}); bag = { ...bag, pins: { ...(bag.pins || {}), [i]: null } }; if (pinOf(ctx.uid) === i) await wearPin(null); await setRel(i, { got: null }); setTimeout(() => { sfx('hit'); say(`내가 준 ${p.pin} 도로 내놔! 너한텐 아까워!`, 'angry'); }, 600); }
        else { const take = Math.min(ctx.coins(), 20 + Math.floor(Math.random() * 41)); if (take > 0) { await ctx.spend(take); setTimeout(() => { sfx('hit'); say(`까불지 마! 가진 돈 ${take}🪙 내놔!`, 'angry'); toast(`${a.name}에게 ${take} 🪙 뜯겼어요`, 2000); }, 600); } } }
      drawMeter();
    }
    // 사이가 나쁜 동물에게 사과하면 2점 풀린다. 한 동물에게 10분에 한 번만 통한다
    // 많이 틀어진 사이는 말로 안 된다: -20 이하는 선물을, -15 이하는 돈을 요구하고, 안 들어주면 다시 때리러 온다
    let demand = '';
    const settle = ok => { demand = ''; drawQuick(); if (!ok) { actors[i].rage = true; say('그래? 그럼 맞아야겠네. 거기 서!', 'angry'); sfx('bad'); setTimeout(() => close && close(), 900); } };
    function ask(kind) {
      demand = kind; sfx('bad');
      if (kind === 'gift') { say('닥치고 선물을 조공해라.', 'angry', true); quick.replaceChildren(h('button', { class: 'so-q q0', onClick: give }, '🎁 선물 바치기'), h('button', { class: 'so-q q2', onClick: () => settle(false) }, '싫어')); }
      else { say('음... 알겠고, 돈으로 해결할까?', 'angry', true); quick.replaceChildren(h('button', { class: 'so-q q0', onClick: async () => { if (!(await ctx.spend(BRIBE[0]))) return settle(false); await setRel(i, { a: A(i) + BRIBE[1] }); settle(true); say('좋아, 이번엔 넘어가 줄게.', 'glad'); after(BRIBE[1]); } }, `🪙 ${BRIBE[0]} 주기`), h('button', { class: 'so-q q2', onClick: () => settle(false) }, '싫어')); }
    }
    async function sorry(text) {
      if (A(i) <= -20) return ask('gift'); if (A(i) <= -15) return ask('pay');
      const rel = mine[i] || {}, left = TEN_MIN - (ctx.store.now() - (rel.sorryAt || 0)), mem = Array.isArray(rel.mem) ? rel.mem : Object.values(rel.mem || {});
      if (left > 0) return say(`흥, 아직 화 안 풀렸어. ${Math.ceil(left / 60000)}분 뒤에 다시 사과해.`, 'angry');
      const r = pick(['…알았어. 이번 한 번만 봐줄게.', '사과는 받을게. 근데 아직 다 풀린 건 아니야.', '흥… 진심이지? 조금 풀렸어.']);
      await setRel(i, { a: capA(i, A(i) + 2), sorryAt: ctx.store.now(), mem: [...mem.slice(-5), { s: text, r, d: 2, t: ctx.store.now() }] }); say(r, 'glad'); drawQuick(); after(2);
    }
    async function talk(text) {
      text = text.trim().slice(0, 60); if (!text || busy) return; if (demand) { input.value = ''; return say(demand === 'gift' ? '말은 됐고, 선물.' : '말은 됐고, 돈.', 'angry'); } if (A(i) < 0 && SORRY.test(text)) { input.value = ''; sfx('tock'); return sorry(text); } busy = true; input.value = ''; said = text; sfx('tock');
      const rel = mine[i] || {}, day = today(), n = rel.day === day ? rel.n || 0 : 0, mem = Array.isArray(rel.mem) ? rel.mem : Object.values(rel.mem || {});
      say('…', 'wait');
      let r = await askAI(ctx.room, { name: a.name, trait: p.trait, likes: p.likes.join(', '), hates: p.hates.join(', '), user: ctx.me.name, a: A(i), mem: `(말투 규칙: ${TONE[i][1]}. 대답은 반드시 이 말투로 한다)\n` + mem.slice(-4).map(m => `${ctx.me.name}: "${m.s}" → 나: "${m.r}"`).join('\n'), text });
      // AI가 칭찬이 아닌 말에 점수를 올려 주지 않게: 글에 칭찬 낱말이나 좋아하는 것 이야기가 실제로 있을 때만 올린다
      if (r && r.by !== 'claude' && r.delta > 0 && judgeLocal(text, p).delta <= 0) r.delta = 0; // Claude의 판정은 그대로 믿는다
      if (!r) { r = judgeLocal(text, p); const old = mem.length && Math.random() < 0.35 ? pick(mem) : null; // AI를 못 쓰면 낱말로 판정하고, 가끔 예전 말을 꺼낸다
        if (A(i) < -10 && r.delta <= 0) r.reply = pick(LINES.cold); else if (old && old.d < 0) r.reply += ` …그리고 저번에 "${old.s}"라고 한 거, 아직 안 잊었어.`; else if (old && old.d > 0) r.reply += ` 저번에 "${old.s}"라고 해 줘서 기뻤어.`; }
      if (!alive) return;
      // 칭찬은 연달아 안 통한다: 한 동물에게 10분에 한 번만 점수가 오른다
      if (r.ai && r.delta > 0 && r.delta < 3) r = { ...r, delta: 0 }; // AI가 평범한 말에 주는 +1~2는 칭찬이 아니다: 점수 없이 대답만 한다
      const praiseLeft = TEN_MIN - (ctx.store.now() - (rel.praiseAt || 0)), praised = r.delta > 0 && praiseLeft <= 0;
      // 10분 안에 또 칭찬하면 점수만 안 오른다. AI의 대답은 질문에 맞는 말이므로 그대로 두고, 정해진 문장으로 답할 때만 "아까도 칭찬했잖아"라고 한다
      if (r.delta > 0 && !praised) r = r.ai ? { ...r, delta: 0 } : { reply: `아까도 칭찬했잖아. 자꾸 들으니까 별로야. ${Math.ceil(praiseLeft / 60000)}분 뒤에 다시 해 줘.`, delta: 0 };
      if (n >= TALKS && r.delta) r = { ...r, delta: 0 }; // 하루 8번까지만 점수가 움직인다. 평범한 말은 몇 번이든 할 수 있다
      const d = r.delta, v = Math.max(-100, capA(i, A(i) + d)); if (d > 0 && v === 99 && A(i) + d >= 100) setTimeout(() => alive && say(pick(CAKE_HINT), 'glad'), 2600);
      await setRel(i, { a: v, day, n: d ? n + 1 : n, ...(praised ? { praiseAt: ctx.store.now() } : {}), mem: [...mem.slice(-5), { s: text, r: r.reply.slice(0, 120), d, t: ctx.store.now() }] });
      say(r.reply, d > 0 ? 'glad' : d < 0 ? 'angry' : '', !!r.ai); busy = false; drawQuick(); after(d);
    }
    function give() {
      const have = Object.keys(GIFTS).filter(k => (bag[k] || 0) > 0);
      if (!have.length) return modal({ title: '🎁 줄 선물이 없어요', body: h('p', { class: 'center' }, '카피수퍼에서 선물을 살 수 있어요.'), actions: [{ label: '닫기' }, { label: '🏪 카피수퍼 가기', primary: true, onClick: c => { c(); openShop(); } }] });
      const cl = modal({ title: `🎁 ${a.name}에게 선물하기`, body: h('div', { class: 'so-list' }, have.map(k => { const [ic, nm, , up] = GIFTS[k]; return h('button', { class: 'so-row', onClick: async () => { cl(); const bonus = p.fav === k ? Math.ceil(up * 0.5) : 0, was = A(i), v = capA(i, was + up + bonus, k === 'cake');
        await ctx.store.update('bag/' + ctx.uid, { [k]: (bag[k] || 0) - 1 }).catch(() => {}); bag = { ...bag, [k]: (bag[k] || 0) - 1 }; await setRel(i, { a: v, fedAt: ctx.store.now() }, k === 'cake');
        if (v === 99 && was + up + bonus >= 100 && k !== 'cake') { say(pick(CAKE_HINT), 'glad'); after(v - was); } else if (v >= 100 && was < 100) { say('케이크다…! 이제 우리는 진짜 단짝이야! 💗', 'glad'); after(v - was); } else
        if (demand === 'gift') { demand = ''; drawQuick(); say(bonus ? `흥, ${nm}라… 내가 좋아하는 걸 아네. 이번엔 봐준다.` : `${nm}? 뭐, 받아는 줄게.`, 'glad'); } else say(bonus ? `우와, ${nm}! 내가 제일 좋아하는 거야! 고마워!` : `${nm} 주는 거야? 고마워, 잘 쓸게!`, 'glad'); after(up + bonus); } }, h('span', null, ic), h('b', null, nm), h('small', null, `${bag[k]}개 · 친밀도 +${up}`)); })), actions: [{ label: '닫기' }] });
    }
    function trade() {
      const v = A(i), ware = wareOf(i), disc = (bag.resold || {})[i] ? 1 : v >= 50 ? 0.5 : v >= 20 ? 0.75 : 1, wp = Math.round(priceOf(ware.id) * disc), hasPin = (bag.pins || {})[i];
      if (v < 0) return say('너한텐 아무것도 안 팔아. 저리 가!', 'angry');
      const row = (ic, nm, sub, price, owned, fn) => h('button', { class: 'so-row' + (typeof ic === 'string' ? '' : ' big'), disabled: owned, onClick: fn }, typeof ic === 'string' ? h('span', null, ic) : ic, h('b', null, nm), h('small', null, owned ? '이미 갖고 있어요' : `${won(price)} · ${sub}`));
      const cl = modal({ title: `🤝 ${a.name}와 거래`, body: h('div', { class: 'so-list' },
        row(p.pin, `${a.name}의 상징 액세서리`, v >= 10 ? '친해지면(50점) 그냥 줘요' : '아는 사이(10점)부터 팔아요', 500, hasPin, async () => { if (v < 10) return toast('아직 그 정도로 친하지 않대요'); if (!(await ctx.spend(500))) return; await ctx.store.update('bag/' + ctx.uid + '/pins', { [i]: true }).catch(() => {}); bag = { ...bag, pins: { ...(bag.pins || {}), [i]: true } }; await setRel(i, { got: true }); await wearPin(i); cl(); say(`자, ${p.pin} 여기. 내가 달아 줬어, 잘 달고 다녀!`, 'glad'); }),
        h('button', { class: 'so-row big rare' + (v >= RARE_AT ? ' open' : ''), disabled: !!(bag.rares || {})[i], onClick: async () => { if (v < RARE_AT) return toast(`단짝(${RARE_AT}점)이 되어야 열려요. 지금 ${v}점`); if (!(await ctx.spend(RARE_PRICE))) return; bag = { ...bag, rares: { ...(bag.rares || {}), [i]: true } }; await ctx.store.update('bag/' + ctx.uid + '/rares', { [i]: true }).catch(() => {}); await wearRare(i); cl(); gameFx('win', rareName(i)); say('이건 단짝한테만 주는 내 보물이야. 네가 걸치니까 눈이 부셔!', 'gift'); } },
          h('span', { class: 'so-try', html: capy({ color: ctx.me.color, acc: 'none', face: 'happy', rare: rareOf(i) }) }), h('b', null, `✨ 초레어 · ${rareName(i)}`), h('small', null, (bag.rares || {})[i] ? '이미 갖고 있어요' : v >= RARE_AT ? `${won(RARE_PRICE)} · 걸치면 모두가 칭찬해요` : `🔒 단짝(${RARE_AT}점)이 되면 열려요 · ${won(RARE_PRICE)}`)),
        row(tryOn(ware.id), `${ware.name} (${a.name} 전용)`, disc < 1 ? `친구 할인 ${Math.round((1 - disc) * 100)}%` : '친해지면 깎아 줘요', wp, ctx.owns(ware.id), async () => { if (!(await ctx.spend(wp))) return; await ctx.store.set(`owned/${ctx.uid}/${ware.id}`, true).catch(() => {}); ctx.owned[ctx.uid] = { ...(ctx.owned[ctx.uid] || {}), [ware.id]: true }; await wearCloth(ware.id); cl(); say(`${ware.name}, 입혀 줬어. 잘 어울린다! (가방이나 옷놀이에서 갈아입을 수 있어)`, 'glad'); })), actions: [{ label: '닫기' }] });
    }
    const memBtn = () => { const mem = Array.isArray((mine[i] || {}).mem) ? mine[i].mem : Object.values((mine[i] || {}).mem || {}); modal({ title: `📜 ${a.name}가 기억하는 말`, body: mem.length ? h('div', { class: 'so-mem' }, mem.slice().reverse().map(m => h('p', null, h('b', null, `나: ${m.s}`), h('span', null, `${a.name}: ${m.r}`), h('em', { class: m.d > 0 ? 'up' : m.d < 0 ? 'down' : '' }, (m.d > 0 ? '+' : '') + m.d)))) : h('p', { class: 'center' }, '아직 나눈 말이 없어요.'), actions: [{ label: '닫기', primary: true }] }); };
    input.addEventListener('keydown', e => { if (e.key === 'Enter') talk(input.value); });
    close = modal({ title: `${a.name} · ${p.trait}`, body: h('div', { class: 'so-meet' },
      h('div', { class: 'so-face' }, faceEl, bubble), meter, fedNote, quick,
      h('div', { class: 'so-say' }, input, h('button', { class: 'btn primary', onClick: () => talk(input.value) }, '말하기')),
      h('div', { class: 'so-acts' }, h('button', { class: 'btn', onClick: give }, '🎁 선물'), h('button', { class: 'btn', onClick: trade }, '🤝 거래'), h('button', { class: 'btn', onClick: memBtn }, '📜 기억'))), actions: [{ label: '닫기' }], onClose: () => { if (demand && actors[i]) actors[i].rage = true; if (held === i) held = -1; const o = actors[i]; if (o && o.st === 'walk') o.e.classList.add('walk'); } });
    const v = A(i); say(v <= ROB_AT ? pick(LINES.cold) : v >= PIN_AT ? `${ctx.me.name}! 왔구나, 보고 싶었어!` : v >= 10 ? `안녕, ${ctx.me.name}! 또 만났네.` : `안녕? 난 ${a.name}야. ${p.likes[0]} 좋아해.`); drawMeter(); drawQuick();
  }

  // ----- 카피수퍼·가방 -----
  function openShop() {
    const body = h('div', { class: 'so-list' }), draw = () => body.replaceChildren(h('p', { class: 'center' }, '내 돈 ', h('b', { 'data-coins': 1 }, won(ctx.coins()))),
      ...Object.entries(GIFTS).map(([k, [ic, nm, price, up]]) => h('button', { class: 'so-row', onClick: async () => { if (!(await ctx.spend(price))) return; bag = { ...bag, [k]: (bag[k] || 0) + 1 }; await ctx.store.update('bag/' + ctx.uid, { [k]: bag[k] }).catch(() => {}); toast(`${nm} 샀어요`); draw(); } }, h('span', null, ic), h('b', null, nm), h('small', null, `${won(price)} · 친밀도 +${up} · 가진 것 ${bag[k] || 0}개`))),
      h('button', { class: 'so-row', onClick: async () => { if (!(await ctx.spend(POTION[0]))) return; bag = { ...bag, potion: (bag.potion || 0) + 1 }; await ctx.store.update('bag/' + ctx.uid, { potion: bag.potion }).catch(() => {}); toast('회복 포션 샀어요'); draw(); drawHp(); } }, h('span', null, '🧪'), h('b', null, '회복 포션'), h('small', null, `${won(POTION[0])} · 체력 +${POTION[1]} · 가진 것 ${bag.potion || 0}개`)),
      h('button', { class: 'so-row', disabled: !!bag.boat, onClick: async () => { if (bag.boat || !(await ctx.spend(BOAT_PRICE))) return; bag = { ...bag, boat: true }; await ctx.store.update('bag/' + ctx.uid, { boat: true }).catch(() => {}); toast('카피보트를 샀어요! 바닷가 물에서 탈 수 있어요', 2600); draw(); } }, h('span', null, '🚤'), h('b', null, '카피보트'), h('small', null, bag.boat ? '가지고 있어요 · 바닷가 물에서 🚤 내 보트' : `${won(BOAT_PRICE)} · 바닷가에서 타면 파도가 일어요`)),
      h('p', { class: 'dim center' }, '동물마다 제일 좋아하는 선물이 있어요. 그걸 주면 친밀도가 1.5배 올라요. 포션은 화면 위 🧪 를 눌러 마셔요.'),
      h('b', { class: 'so-sellh' }, '🎣 낚시 용품 — 낚시터는 배를 타고 바다 끝으로'), ...fishRows(draw),
      h('b', { class: 'so-sellh' }, '💰 팔기 — 동물에게 받은 증표와 전용 모자'), ...sellRows(draw));
    function fishRows(redraw) { const buy = async (price, patch, msg) => { if (trial) return toast('체험 중에는 낚시 용품을 살 수 없어요. 체험을 끝내고 사세요'); if (!(await ctx.spend(price))) return; await saveBag(patch()); toast(msg); redraw(); }, R = RODS[bag.rod || 0];
      const row = (ic, nm, sub, fn, off) => h('button', { class: 'so-row', disabled: !!off, onClick: fn }, ic.startsWith('<') ? h('span', { class: 'so-rodic', html: ic }) : h('span', null, ic), h('b', null, nm), h('small', null, sub));
      const CANNON_IC = '<svg viewBox="0 0 56 48"><defs><linearGradient id="cnb" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#7C8798"/><stop offset=".45" stop-color="#3A4250"/><stop offset="1" stop-color="#1B2028"/></linearGradient><radialGradient id="cnf"><stop offset="0" stop-color="#FFF7C2"/><stop offset=".5" stop-color="#FFB03D"/><stop offset="1" stop-color="#FF5A3D" stop-opacity="0"/></radialGradient></defs><circle cx="49" cy="13" r="8" fill="url(#cnf)"/><path d="M45 13 l8 -5 M46 15 l9 0 M45 17 l7 5" stroke="#FFE066" stroke-width="1.6" stroke-linecap="round"/><g transform="rotate(-18 22 28)"><rect x="6" y="18" width="38" height="15" rx="7" fill="url(#cnb)" stroke="#11151B" stroke-width="1.8"/><rect x="40" y="15.5" width="6" height="20" rx="3" fill="#2A2F3A" stroke="#11151B" stroke-width="1.6"/><rect x="14" y="17" width="4" height="17" rx="1.5" fill="#F2C230" stroke="#8A5A00" stroke-width="1"/><rect x="28" y="17" width="4" height="17" rx="1.5" fill="#F2C230" stroke="#8A5A00" stroke-width="1"/><circle cx="6" cy="25.5" r="4" fill="#2A2F3A" stroke="#11151B" stroke-width="1.6"/><path d="M10 21.5 h26" stroke="#B8C2D0" stroke-width="1.6" stroke-linecap="round" opacity=".7"/></g><path d="M8 40 h30 l-3 -9 h-22z" fill="#8A5A2B" stroke="#4E3014" stroke-width="1.8" stroke-linejoin="round"/><circle cx="18" cy="38" r="8.5" fill="#B5793C" stroke="#4E3014" stroke-width="2"/><circle cx="18" cy="38" r="5.4" fill="none" stroke="#4E3014" stroke-width="1.4"/><path d="M18 30 v16 M10 38 h16 M12.3 32.3 l11.4 11.4 M23.7 32.3 l-11.4 11.4" stroke="#4E3014" stroke-width="1.3"/><circle cx="18" cy="38" r="2.2" fill="#F2C230" stroke="#8A5A00" stroke-width="1"/><circle cx="42" cy="42" r="4" fill="#2A2F3A" stroke="#11151B" stroke-width="1.4"/><circle cx="49" cy="43" r="3.4" fill="#2A2F3A" stroke="#11151B" stroke-width="1.4"/><circle cx="40.6" cy="40.6" r="1.1" fill="#9AA6B6"/></svg>';
      // 낚싯대 그림: 초급 나무, 중급 흰색, 고급 파란색
      const rodIc = t => { const [c, d, g] = [[], ['#9A6B40', '#5A3A1E', '#3A2A1E'], ['#FFFFFF', '#8FA0B2', '#5A6B7C'], ['#3F8FF0', '#0E3F8A', '#F2C230']][t]; return `<svg viewBox="0 0 48 48"><path d="M9 42 L36 6" stroke="${d}" stroke-width="6.5" stroke-linecap="round"/><path d="M9 42 L36 6" stroke="${c}" stroke-width="4" stroke-linecap="round"/><path d="M8 43 L15 34" stroke="${g}" stroke-width="7.5" stroke-linecap="round"/><circle cx="19" cy="33" r="5" fill="#C9D3DE" stroke="#4A5868" stroke-width="1.6"/><circle cx="19" cy="33" r="1.6" fill="#4A5868"/><path d="M36 6 Q44 10 41 24" fill="none" stroke="#7A8794" stroke-width="1.3"/><path d="M41 24 v5 q0 4 -4 3" fill="none" stroke="#4A5868" stroke-width="1.8" stroke-linecap="round"/><circle cx="41" cy="22" r="2.6" fill="#E5484D" stroke="#7A2A2A" stroke-width="1"/></svg>`; };
      return [
        h('p', { class: 'dim center' }, R ? `지금 낚싯대: ${R.name} (내구도 ${bag.rodD || 0}/${R.dur}) · 미끼 ${bag.bait || 0}개 · 포탄 ${bag.balls || 0}개` : `낚싯대 없음 · 미끼 ${bag.bait || 0}개`),
        ...RODS.slice(1).map(r => row(rodIc(r.t), r.name, `${won(r.price)} · ${['', '나무', '흰색', '파란색'][r.t]} · ${r.dur}번 쓸 수 있어요${r.t < 3 ? ` · 솜씨로 ${ZONES[r.t + 1].slice(0, 2)} 물고기도 일부` : ''}${(bag.rod || 0) === r.t ? ' · 쓰는 중' : ''}`, () => buy(r.price, () => ({ rod: r.t, rodD: r.dur }), `${r.name} 샀어요`), (bag.rod || 0) === r.t && bag.rodD > 0)),
        R && row('🔧', '낚싯대 수리', `${won(R.fix)} · 내구도를 ${R.dur}로 다시 채워요`, () => buy(R.fix, () => ({ rodD: R.dur }), '낚싯대를 고쳤어요'), bag.rodD >= R.dur),
        row('🪱', '미끼 10개', `${won(BAIT * 10)} · 한 번 던질 때 1개`, () => buy(BAIT * 10, () => ({ bait: (bag.bait || 0) + 10 }), '미끼 10개 샀어요')),
        row(boatSvg(MY_WBOAT), '흰 배', bag.wboat ? '가지고 있어요 · 더 빠르고 중급·고급 낚시터에 가요' : `${won(WBOAT)} · 더 빠르고 중급·고급 낚시터에 가요`, () => buy(WBOAT, () => ({ wboat: true, boat: true }), '흰 배를 샀어요'), bag.wboat),
        bag.wboat && row('🛠️', '배 수리', `${won(BOAT_FIX)} · 배 내구도 ${boatD()}/100 → 100${boatD() < BOAT_MIN ? ' · 지금은 중급 바다에 못 나가요' : ''}`, () => buy(BOAT_FIX, () => ({ boatD: 100 }), '배를 고쳤어요'), boatD() >= 100),
        row(CANNON_IC, '대포', bag.cannon ? '달았어요' : `${won(CANNON)} · 흰 배에 달아요. 갈매기 해적단과 싸워요`, () => buy(CANNON, () => ({ cannon: true }), '대포를 달았어요'), bag.cannon || !bag.wboat),
        row('⚫', '포탄 10개', `${won(BALL * 10)} · 한 발에 1개`, () => buy(BALL * 10, () => ({ balls: (bag.balls || 0) + 10 }), '포탄 10개 샀어요'), !bag.cannon)].filter(Boolean); }
    // 팔기: 증표와 전용 모자를 카피수퍼가 게임 3~5판 값(150~250코인)에 사 준다. 판 증표는 선물로 다시 못 받고, 판 모자는 다시 살 때 친구 할인이 없다
    const gain = n => ctx.store.tx('money/' + ctx.uid, c => ({ ...(c || {}), c: ((c && c.c) || 0) + n })).catch(() => {});
    function sellRows(redraw) {
      const pins = Object.keys(bag.pins || {}).filter(k => bag.pins[k]).map(Number), hats = ANIMALS.map((_, i) => i).filter(i => (ctx.owned[ctx.uid] || {})[wareOf(i).id]);
      if (!pins.length && !hats.length) return [h('p', { class: 'dim center' }, '팔 물건이 없어요. 동물과 친해져 증표를 받거나 전용 모자를 사면 여기서 팔 수 있어요.')];
      const ask = (label, price, note, go) => modal({ title: `${label} 팔까요?`, body: h('p', { class: 'center' }, `${won(price)}에 팔아요. ${note}`), actions: [{ label: '취소' }, { label: `${won(price)}에 팔기`, primary: true, onClick: async c => { c(); await go(); await gain(price); sfx('coin'); toast(`${label} 팔았어요 +${price} 🪙`, 2200); scores(); setTimeout(redraw, 150); } }] });
      return [...pins.map(i => h('button', { class: 'so-row', onClick: () => ask(`${ANIMALS[i].name}의 증표 ${PERSONA[i].pin}`, sellPin(i), '판 증표는 선물로 다시 못 받고, 그 동물에게 500코인에 다시 사야 해요.', async () => { bag = { ...bag, pins: { ...(bag.pins || {}), [i]: null } }; await ctx.store.update('bag/' + ctx.uid + '/pins', { [i]: null }).catch(() => {}); if (pinOf(ctx.uid) === i) await wearPin(null); }) }, h('span', null, PERSONA[i].pin), h('b', null, `${ANIMALS[i].name}의 증표`), h('small', null, `${won(sellPin(i))}에 팔기`))),
        ...hats.map(i => { const w = wareOf(i); return h('button', { class: 'so-row big', onClick: () => ask(w.name, sellHat(i), '다시 사려면 그 동물에게 할인 없이 300코인을 내야 해요.', async () => { if (wearing(w.id)) await wearCloth(w.id, false); ctx.owned[ctx.uid] = { ...(ctx.owned[ctx.uid] || {}), [w.id]: null }; await ctx.store.set(`owned/${ctx.uid}/${w.id}`, null).catch(() => {}); bag = { ...bag, resold: { ...(bag.resold || {}), [i]: true } }; await ctx.store.update('bag/' + ctx.uid + '/resold', { [i]: true }).catch(() => {}); }) }, tryOn(w.id), h('b', null, w.name), h('small', null, `${won(sellHat(i))}에 팔기`)); })];
    }
    draw(); modal({ title: '🏪 카피수퍼', body, actions: [{ label: '닫기', primary: true }] });
  }
  function openBag() {
    const body = h('div', { class: 'so-list' }); let cl;
    const draw = () => { const pins = Object.keys(bag.pins || {}).filter(k => bag.pins[k]).map(Number), worn = pinOf(ctx.uid), wares = ANIMALS.map((_, i) => i).filter(i => ctx.owns(wareOf(i).id) && priceOf(wareOf(i).id) > 0);
      body.replaceChildren(h('div', { class: 'so-bagme', html: capy(ctx.capyOf(ctx.uid, { face: 'happy' })) }),
        h('p', { class: 'center' }, Object.entries(GIFTS).map(([k, [ic, nm]]) => `${ic} ${nm} ${bag[k] || 0}개`).join(' · ')),
        h('b', null, `동물에게 받은 액세서리 ${pins.length} / ${ANIMALS.length}`),
        pins.length ? h('div', { class: 'so-pins' }, pins.map(i => h('button', { class: 'so-pin' + (worn === i ? ' on' : ''), onClick: async () => { await wearPin(worn === i ? null : i); draw(); } }, h('span', null, PERSONA[i].pin), h('small', null, worn === i ? '착용 중' : ANIMALS[i].name), h('small', { class: 'dim' }, PIN_CHEST.has(PERSONA[i].pin) ? '가슴에' : '손에')))) : h('p', { class: 'dim center' }, `동물과 ${PIN_AT}점까지 친해지면 그 동물의 상징을 선물로 받아요.`),
        h('b', null, `✨ 초레어 보물 ${Object.keys(bag.rares || {}).filter(k => bag.rares[k]).length} / ${ANIMALS.length}`),
        Object.keys(bag.rares || {}).filter(k => bag.rares[k]).length ? h('div', { class: 'so-list' }, Object.keys(bag.rares).filter(k => bag.rares[k]).map(Number).map(i => { const on = myRares().includes(i); return h('button', { class: 'so-row big rare open' + (on ? ' on' : ''), onClick: async () => { await wearRare(i); draw(); } }, h('span', { class: 'so-try', html: capy({ color: ctx.me.color, acc: 'none', face: 'happy', rare: rareOf(i) }) }), h('b', null, rareName(i)), h('small', null, on ? '걸치는 중 (누르면 벗기)' : '누르면 걸치기')); })) : h('p', { class: 'dim center' }, `동물과 단짝(${RARE_AT}점)이 되면 그 동물에게서 ${RARE_PRICE.toLocaleString('ko-KR')}코인에 살 수 있어요.`),
        h('b', null, `🐟 물고기 도감 ${Object.keys(dex).length} / ${FISH.length}${dex.pearl ? ' · 진주 ' + dex.pearl.n + '개' : ''}`),
        Object.keys(dex).length ? h('div', { class: 'so-dex' }, FISH.filter(f => dex[f.id]).map(f => h('div', { class: 'so-dexi' + (f.king ? ' king' : f.rare ? ' rare' : '') }, h('span', { html: fishSvg(f) }), h('b', null, f.name), h('small', null, `${dex[f.id].n}마리 · 최대 ${dex[f.id].best}cm`)))) : h('p', { class: 'dim center' }, '바다 끝 낚시터에서 잡은 물고기가 여기에 모여요.'),
        h('b', null, `동물에게 산 전용 모자 ${wares.length} / ${ANIMALS.length}`),
        wares.length ? h('div', { class: 'so-list' }, wares.map(i => { const w = wareOf(i), on = wearing(w.id); return h('button', { class: 'so-row big' + (on ? ' on' : ''), onClick: async () => { await wearCloth(w.id, !on); draw(); } }, tryOn(w.id), h('b', null, w.name), h('small', null, `${ANIMALS[i].name}에게 삼 · ${on ? '입는 중 (누르면 벗기)' : '누르면 입기'}`)); })) : h('p', { class: 'dim center' }, '동물과 거래하면 그 동물만 파는 전용 모자를 살 수 있어요.'),
        h('p', { class: 'dim center' }, '눌러서 착용하거나 빼요. 액세서리는 가슴이나 손에만 보여요(얼굴만 나오는 곳에는 안 보여요).')); };
    draw(); cl = modal({ title: '🎒 가방', body, actions: [{ label: '닫기', primary: true }] });
  }

  const offs = [
    ctx.store.on('social', v => { v = v || {}; mine = v[ctx.uid] || {}; theirs = (pid() && v[pid()]) || {}; scores(); }),
    ctx.store.on('bag/' + ctx.uid, v => { rawBag = v || {}; bag = trial ? { ...rawBag, ...trial.g } : rawBag; drawHp(); }),
    ctx.store.on('socialchat', onChat, { limit: 20 }),
    ctx.store.on('fishdex/' + ctx.uid, v => { dex = v || {}; }),
    ctx.store.on('socialpos', v => { const q = pid() && v && v[pid()]; pal.on = !!q; if (q) { pal.x = q.x || 0; pal.y = q.y || 0; pal.f = q.f || 1; pal.ride = q.r == null ? -1 : q.r; pal.boat = q.b == null ? -1 : q.b; pal.t = q.t || 0; } }),
    ctx.store.on('socialme/' + ctx.uid, v => { const first = vit === null; vit = v || {};
      if (first) { if (vit.deadAt && ctx.store.now() - vit.deadAt < TEN_MIN) lock(); else { if (vit.deadAt) saveVit({ hp: HP_MAX, deadAt: 0 }); scene(); } } else drawHp(); }),
  ];
  return () => { trial = null; kingTrial = 0; keepPos(); alive = false; if (battle) { battle.stop(); battle = null; } voice.destroy(); bgm.duck(false); window.removeEventListener('pointerdown', wakeVoice); leavePos(); me.boat = null; offer = null; endSorry(); clearInterval(lockT); cancelAnimationFrame(raf); offs.forEach(f => f()); window.removeEventListener('keydown', kd); window.removeEventListener('keyup', ku); };
}
