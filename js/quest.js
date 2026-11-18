// 메인 퀘스트 「누가 왕관을 훔쳤나」 — 30마리 용의자 추리극
// 사자의 왕관이 사라진다. 부엉이 탐정의 조수가 되어 단서(진흙 발자국 · 검은 깃털 · 달콤한 냄새)를 쫓고, 마지막에 범인을 직접 지목한다.
// 대반전: 범인은 사자 자신(공범 까마귀). 아무도 대장으로 봐 주지 않아 외로웠던 것. 모두가 꽃 왕관을 씌워 주며 화해한다.
import { h, toast, modal, ymd } from './ui.js';
import { sfx } from './sound.js';

// 단계: who 부탁하는 동물 · to 완료하러 가는 동물(없으면 who) · type talk | fish | crop | gift | cook | accuse
// need: fish {z} · crop {id, n} · gift {k: 'any'|'flower'…} · cook {rec} · accuse {opts:[[이름, 정답?, 틀렸을 때 부엉이 말]]}
const T = (who, to, type, need, say, done, more = {}) => ({ who, to: to == null ? who : to, type, need, say, done, ...more });
export const STORY = [
  { t: '프롤로그 · 사라진 왕관', steps: [
    T(10, 19, 'talk', null, ['큰일이다! 짐의 황금 왕관이 사라졌도다!', '어젯밤 굴 앞에 고이 두고 잤는데, 아침에 보니 감쪽같이 없어졌도다.', '섬에서 제일 똑똑한 부엉이에게 가서 수사를 맡기거라!'],
      ['왕관 도난 사건이라… 흥미롭군.', '현장에서 단서 세 가지를 찾았다네. 진흙 발자국, 검은 깃털, 그리고 달콤한 냄새.', '오늘부터 자네가 내 조수일세. 발자국부터 쫓아가 보세.'], { clue: '단서 셋: 진흙 발자국 · 검은 깃털 · 달콤한 냄새' })] },
  { t: '1장 · 진흙 발자국', steps: [
    T(19, 12, 'talk', null, ['진흙을 좋아하는 동물이라면… 돼지가 먼저 떠오르는군.', '돼지에게 가서 그날 밤 어디 있었는지 물어보게.'],
      ['뭐? 내가 범인이라고?', '그날 밤엔 오이 팩을 하고 있었어. 피부 관리 중이었다고.', '못 믿겠으면 오이 2개 가져와 봐. 지금 당장 증명해 줄게.']),
    T(12, null, 'crop', { id: 'cucumber', n: 2 }, ['오이 2개 가져오면 증명해 줄게. 농장에서 기를 수 있어.'],
      ['(촤악) 봐, 이렇게 얼굴에 붙이고 밤새 꼼짝 않고 누워 있었다고.', '…이건 비밀인데, 나 몰래 다이어트 중이야. 미식가 체면이 있지. 아무한테도 말하지 마!', '참, 그날 밤 멧돼지가 진흙탕을 첨벙첨벙 지나가는 소리는 들었어.']),
    T(21, null, 'cook', { rec: 'mattang' }, ['발자국? 그래, 그거 내 거다.', '근데 왕관 때문이 아니라 농장 고구마 때문이었어. 배고파서… 미안.', '카피백반에서 고구마 맛탕 하나만 해 주면 본 걸 다 털어놓을게.'],
      ['(우걱우걱) 맛있다! 좋아, 다 말할게.', '고구마 밭에 가다가 사자 굴 앞에서 오리가 서성이는 걸 봤어. 난 거기까지야.']),
    T(18, 19, 'talk', null, ['어머, 나 봤다고? 응, 그날 밤 연못 가다가 사자 굴 앞을 지났지!', '굴 앞에 커다란 그림자가 있었어. 날개가 있었던 것 같기도 하고…', '부엉이 탐정한테 꼭 전해 줘! 아참, 이건 비밀인데 요즘 펭귄이랑 물개가…'],
      ['날개 달린 그림자라… 두 번째 단서, 검은 깃털과 이어지는군.', '발자국은 멧돼지의 고구마 서리였네. 범인은 따로 있어.', '다음은 검은 깃털일세.'], { end: 1, clue: '발자국 = 멧돼지의 고구마 서리 · 굴 앞에 날개 달린 그림자' })] },
  { t: '2장 · 검은 깃털', steps: [
    T(19, 16, 'talk', null, ['검은 깃털이라… 검은 옷을 입은 펭귄 군이 그날 밤 무얼 했는지 들어 보게.'],
      ['수사에 협조하겠습니다.', '그 시간에는 얼음 썰매 연습을 하고 있었습니다. 증인은 물개입니다.', '다만… 물개는 생선 없이는 입을 열지 않습니다.']),
    T(26, null, 'fish', { z: 1 }, ['펭귄 알리바이? 증언해 줄 수 있지.', '근데 공짜로? 박수 대신 생선 한 마리!'],
      ['(꿀꺽) 좋아! 펭귄은 밤새 나랑 썰매 탔어. 내가 박수도 쳐 줬다고.', '근데 썰매 타다가 봤는데, 판다가 한밤중에 몰래 어디 가더라?']),
    T(7, null, 'cook', { rec: 'gaji' }, ['판다를 의심한다고? 검은 털 때문에?', '…들켰다. 밤마다 몰래 야식 먹으러 나갔어. 대나무 말고 가지볶음이 너무 먹고 싶었거든.', '가지 대파볶음 하나 해 주면 본 걸 말해 줄게.'],
      ['(냠냠) 이 맛이야.', '야식 먹으러 가다가 봤어. 까마귀가 반짝이는 걸 물고 바닷가 쪽으로 날아가더라.']),
    T(7, 19, 'talk', null, ['부엉이한테 가서 말해 줘. 난 다시 잘래…'],
      ['까마귀가 반짝이는 걸 물고 바닷가로… 그 깃털은 까마귀 것이 맞네.', '하지만 이상하군. 까마귀 혼자서 무거운 왕관을 들 수 있을까?', '공범이 있어. 세 번째 단서, 달콤한 냄새를 쫓아가세.'], { end: 1, clue: '검은 깃털 = 까마귀 · 왕관이 무거워서 공범이 있다' })] },
  { t: '3장 · 달콤한 냄새', steps: [
    T(19, 6, 'talk', null, ['달콤한 냄새는 꿀 냄새 같았지. 꿀이라면 곰일세.'],
      ['꿀 냄새? 허허, 내 꿀단지는 그대로인데.', '겨울잠 준비하느라 배가 고파서 머리가 안 돌아가. 생선 한 마리 주면 기억날지도.']),
    T(6, null, 'fish', { z: 1 }, ['생선 한 마리면 기억이 날 것 같은데…'],
      ['(덥석) 고맙다. 이제 기억난다.', '그 냄새는 꿀이 아니라 조청이야. 카피수퍼에서 파는 거.', '다람쥐가 카피수퍼 장부 정리를 돕는다던데, 누가 샀는지 물어봐.']),
    T(28, null, 'crop', { id: 'potato', n: 2 }, ['장부? 보여 줄 수 있지.', '대신 겨울 저축용 감자 2개! 공짜는 없어.'],
      ['(장부 넘기는 소리) 최근 조청을 산 동물은… 딱 하나.', '…사자? 피해자가 왜 조청을 샀지?', '아, 그리고 내 도토리 창고에서 반짝이는 게 나왔는데, 왕관 보석인지 봐 줄래?']),
    T(28, 29, 'talk', null, ['이 반짝이 말이야, 너구리가 보물 감정을 잘하잖아. 가져가 볼래?'],
      ['어디 보자… 이건 왕관 보석이 아니라 내가 잃어버린 병뚜껑 보물이잖아!', '다람쥐가 주워 갔었구나. 도둑질은 아니니 봐줄게.', '근데 사자가 조청을 샀다고? 수상한데… 부엉이한테 알려야겠어.']),
    T(29, 19, 'talk', null, ['부엉이 탐정한테 같이 가자. 이건 중요한 단서야.'],
      ['피해자가 조청을 샀다… 흠, 흠.', '아직 결론 내긴 이르네. 사자와 사이가 나쁜 동물부터 살펴보세.'], { end: 1, clue: '달콤한 냄새 = 조청 · 조청을 산 건 피해자 사자' })] },
  { t: '4장 · 가짜 자백', steps: [
    T(19, 9, 'talk', null, ['사자와 앙숙인 호랑이부터 만나 보게.'],
      ['나를 의심해?', '그 왕관 따위 필요 없어. 내 줄무늬가 곧 왕관이다!', '정 의심되면 매운탕으로 내 기분부터 풀어 줘. 그럼 증거를 보여 주지.']),
    T(9, null, 'cook', { rec: 'maeun' }, ['매운탕이다. 화끈하게!'],
      ['(후루룩) 크으, 이 맛이야.', '증거는 이거다. 그날 밤 난 부엉이 선생의 별 관찰 수업을 들었지. 출석부에 내 이름이 있다.', '그런데 여우 녀석이 자기가 범인이라고 떠들고 다니더군.']),
    T(5, 1, 'talk', null, ['맞아, 내가 훔쳤지롱~ 왕관은 하늘나라에 있지롱!', '…증거? 고양이한테 물어봐. 걔가 날 봤을걸?'],
      ['여우가 범인이라고? 말도 안 된다.', '그날 밤 여우는 내 옆에서 수수께끼 내다가 먼저 잠들었다. 코까지 골았다.', '관심받고 싶어서 거짓말한 거다. 대신 혼내 줄 테니 생선 하나만.']),
    T(1, null, 'fish', { z: 1 }, ['생선 하나 주면 여우를 혼내 주겠다.'],
      ['(냠) 좋다. 여우는 내가 따끔하게 혼내 줬다.', '그런데 그날 밤 강아지가 이상한 소리를 들었다고 했다. 가 봐라.']),
    T(0, 19, 'talk', null, ['킁킁, 맞아! 그날 밤 사자 굴에서 "흐흑" 하고 우는 소리가 났어.', '왕관을 잃어버리기 전에 울었다니 이상하지? 부엉이 탐정한테 전해 줘!'],
      ['도둑맞기 전에 울고 있었다… 이제 그림이 보이기 시작하는군.', '마지막 조각은 밤의 목격자들에게 있을 걸세.'], { end: 1, clue: '호랑이·여우는 알리바이 확인 · 사자는 왕관이 사라지기 전에 울고 있었다' })] },
  { t: '5장 · 밤의 목격자', steps: [
    T(19, 27, 'talk', null, ['밤마다 보물찾기를 하는 고슴도치에게 물어보게.'],
      ['보물찾기 하다가 바닷가 동굴에서 이걸 주웠어. 금빛 보석 조각.', '근데 그 동굴, 무서워서 더는 못 들어갔어. 늑대라면 뭔가 알 거야.']),
    T(20, null, 'gift', { k: 'any' }, ['…그 동굴에 대해 아는 게 있긴 해.', '하지만 의리 때문에 말 못 해. 정말 친구로서 묻는 거라면… 선물 하나로 마음을 보여 줘.'],
      ['…좋아. 그날 밤 사자가 까마귀랑 같이 그 동굴로 들어가는 걸 봤어.', '사자가 큰소리쳐도 사실 외로움 타는 녀석이야. 너무 몰아붙이지 마.']),
    T(24, 25, 'talk', null, ['동굴 말인가… 요즘 문어가 그 안을 청소한다더구먼.', '문어에게 가 보게. 천천히, 아주 천천히.'],
      ['동굴 청소하다가 이게 나왔어! 반짝반짝한 왕관!', '근데 까마귀 둥지 안에 고이 놓여 있더라. 훔친 게 아니라 맡겨 둔 것처럼.', '맛있는 걸로 축하하자. 단호박 생선찜 하나 부탁해.']),
    T(25, null, 'cook', { rec: 'hobak' }, ['단호박 생선찜이면 축하로 딱이지.'],
      ['(음미) 재료 맛이 살아 있네.', '왕관은 부엉이한테 맡길게. 범인을 밝히는 건 너희 몫이야.']),
    T(25, 19, 'talk', null, ['왕관 들고 부엉이한테 가 봐.'],
      ['왕관을 찾았네! 하지만 범인을 밝혀야 사건이 끝나지.', '그런데 섬이 소문으로 떠들썩하군. 모두를 모으기 전에 소동부터 가라앉혀 주게.'], { end: 1, clue: '사자가 까마귀와 동굴로 · 왕관은 까마귀 둥지에 고이 놓여 있었다' })] },
  { t: '6장 · 소문 재판', steps: [
    T(14, 4, 'talk', null, ['우끼끼! 호랑이가 범인이래! 아니 여우래! 아니 펭귄이래!', '토끼한테 가서 진짜인지 물어봐!'],
      ['원숭이가 또 소문을 퍼뜨렸구나!', '그 바람에 말이랑 유니콘이 서로 범인이라고 싸우고 있어.', '둘을 화해시켜 줘. 말은 당근을 좋아해.']),
    T(22, null, 'crop', { id: 'carrot', n: 2 }, ['유니콘이 날 범인으로 몰았어! 억울해서 달리기도 안 돼.', '당근 2개 먹으면 기분이 좀 풀릴 것 같아.'],
      ['(아삭) 좋아, 유니콘한테 먼저 사과할게.', '사실 나도 걔 뿔이 부러웠거든.']),
    T(23, null, 'gift', { k: 'any' }, ['말이 사과한다고?', '그럼 화해의 반짝이는 선물을 하나 전해 줘.'],
      ['고마워! 우리 다시 친구야.', '…그런데 닭 아줌마가 무섭다고 병아리를 데리고 피난 간대!']),
    T(15, 17, 'cook', { rec: 'jjin' }, ['무서워서 못 살겠어! 우리 병아리가 밥도 안 먹어.', '감자옥수수찜이면 먹을 텐데… 병아리한테 갖다줘.'],
      ['(오물오물) 마시써!', '엄마, 이제 안 무서워. 범인 잡히면 다 괜찮을 거래.']),
    T(8, 11, 'talk', null, ['시끄러워서 잠을 못 자…', '소한테 따뜻한 우유 좀 달라고 해 줘…'],
      ['코알라가 잠을 못 잔다고? 여기 따뜻한 우유야.', '생쥐랑 햄스터도 무서워서 쳇바퀴 속에 숨었대. 개구리가 노래로 달래 주고 있어.']),
    T(13, 19, 'talk', null, ['다들 무서워해서 노래를 불러 줬어~ 생쥐랑 햄스터도 이제 괜찮대.', '♪ 범인을 잡아라 ♬ 부엉이 탐정에게 가 봐!'],
      ['좋아, 섬이 조용해졌군. 모두를 광장에 불러 모았네.', '이제 자네가 범인을 지목할 차례일세.'], { end: 1, clue: '소문은 원숭이가 퍼뜨린 것 · 모두 광장에 모였다' })] },
  { t: '7장 · 범인은 바로…', steps: [
    T(19, null, 'accuse', { opts: [['호랑이', 0, '호랑이는 그날 밤 내 수업 출석부에 이름이 있었네. 다시 생각해 보게.'], ['여우', 0, '여우는 고양이 옆에서 코를 골며 자고 있었지. 거짓 자백이었네.'], ['까마귀 혼자', 0, '까마귀 혼자서는 왕관을 들 수 없다고 했지. 공범을 떠올려 보게.'], ['사자', 1]] },
      ['단서를 정리하지. 진흙 발자국은 멧돼지, 검은 깃털은 까마귀.', '조청을 산 것도, 왕관이 사라지기 전에 운 것도 사자.', '그리고 사자와 까마귀가 함께 동굴로 갔지. 자, 범인은 누구인가?'],
      ['…그렇다네. 범인은 바로 사자일세. 까마귀는 망을 봐 준 공범이고.', '사자에게 가 보게. 이유를 들어야지.']),
    T(10, null, 'talk', null, ['…들켰구나. 짐이… 짐이 범인이다.'],
      ['다들 바빠서 아무도 짐을 대장으로 봐 주지 않았도다.', '왕관이 사라지면 모두 짐을 걱정하며 찾아 줄 줄 알았지. 까마귀에게 조청을 주고 숨겨 달라 했도다.', '다들… 미안하다.']),
    T(19, 10, 'gift', { k: 'flower' }, ['섬 동물들이 사자에게 줄 꽃 왕관을 만들고 있네.', '마지막 꽃은 자네 몫이야. 꽃다발을 사자에게 전해 주게.'],
      ['(꽃 왕관을 쓰고) 이… 이건…', '모두: "왕관 없어도 넌 우리 친구야!"', '짐은… 아니, 나는 정말 행복하도다. 모두 고맙다!'], { end: 1, final: 1, clue: '범인은 사자(공범 까마귀) · 모두 다 같이 화해' })] },
];

// 일상 대화: 이야기 진행(장)에 맞춰 동물들이 수군거린다. [동물, 말] 하나거나, [[A, 말], [B, 대답]] 짝
export const CHATTER = [
  [[10, '짐의 왕관… 어디 있느냐…']], [[18, '들었어? 사자 왕관이 없어졌대!'], [1, '흥, 관심 없다… 근데 누가 가져갔대?']], [[9, '왕관 따위, 사자 녀석 꼴좋다.'], [0, '에이, 그래도 불쌍하잖아!']],
  [[19, '흠… 발자국이 진흙투성이였지.']], [[14, '내가 훔쳤다~ 는 농담!'], [4, '그런 농담하다 진짜 범인 된다?']], [[5, '왕관이라… 탐나긴 하네.']],
  // 1장 진흙 발자국
  [[12, '요즘 피부 좋아진 것 같지 않아?'], [25, '…갑자기?']], [[21, '고구마 얘기는 꺼내지 마…']], [[18, '멧돼지 발자국이 사자 굴 앞에 있었대!'], [11, '에이, 멧돼지는 고구마밖에 모르는걸.']], [[10, '탐정은 일 잘하고 있느냐!']],
  // 2장 검은 깃털
  [[16, '썰매 연습은 하루도 거르지 않습니다.'], [26, '내 박수 덕분이지!']], [[7, '야식… 아니, 아무것도 아니야.']], [[17, '까마귀 무서워…'], [15, '엄마 옆에 꼭 붙어 있으렴.']], [[19, '까마귀 혼자 들기엔 무거운데…']],
  // 3장 달콤한 냄새
  [[6, '조청 냄새가 아직도 코에 남아 있어.'], [3, '조청? 나도 먹고 싶다!']], [[28, '장부는 거짓말을 안 하지.']], [[29, '내 병뚜껑 보물 찾았다!'], [28, '…미안, 주운 줄 알았어.']], [[10, '조, 조청? 짐이 왜 그런 걸…']],
  // 4장 가짜 자백
  [[5, '내가 범인이지롱~'], [1, '코 골던 범인이냐.']], [[9, '별 관찰 수업, 의외로 재밌더라.']], [[0, '그날 밤 우는 소리 진짜 들었어!'], [20, '…그 얘기는 그만해.']], [[10, '짐은… 울지 않았도다.']],
  // 5장 밤의 목격자
  [[27, '동굴 안은 너무 깜깜했어.']], [[20, '의리를 지키는 게 맞는 걸까.'], [24, '진실이 친구를 지키기도 하는 법이구먼.']], [[25, '까마귀 둥지가 생각보다 깔끔하더라.']], [[13, '왕관을 찾았대~'], [2, '그, 그럼 범인은…?']],
  // 6장 소문 재판
  [[14, '범인은 펭귄이래! 아니 유니콘이래!'], [4, '원숭이 너 좀 조용히 해!']], [[22, '유니콘, 아까는 미안했어.'], [23, '나도… 뿔 자랑해서 미안.']], [[8, '제발… 조용히… 자고 싶어…']], [[11, '다들 우유 한 잔씩 하고 진정해.'], [3, '꿀꺽… 좀 낫다!']],
  // 7장 범인 지목
  [[19, '모두 광장에 모였군.']], [[10, '…'], [9, '왜 그렇게 조용해, 사자?']], [[1, '범인은 이 안에 있다…!']], [[17, '누가 범인이야? 삐약 무서워…'], [15, '부엉이 선생님이 금방 밝혀 줄 거야.']],
  // 엔딩 뒤 · 화해
  [[10, '꽃 왕관, 하나도 안 무겁도다.'], [9, '…잘 어울리네, 대장.']], [[5, '다음엔 진짜 장난만 칠게!'], [1, '그것도 하지 마.']], [[21, '고구마는 이제 농장에서 사 먹어.']], [[12, '다이어트 끝! 맛집 투어 간다!'], [25, '내 요리부터 먹어 봐.']],
  [[19, '다음 사건은 언제 터지려나.']], [[20, '토끼야, 같이 달 구경 갈래?'], [4, '…좋아!']]];
// 아무 동물이나 하는 소문(장마다)
const GOSSIP = [['사자 왕관 없어진 거 들었어?', '부엉이 탐정이 조수를 구했대.', '범인이 이 섬에 있다니 무서워.'], ['진흙 발자국 주인이 멧돼지였대.', '돼지가 요즘 오이를 엄청 찾더라.', '그래서 범인은 누구야?'],
  ['검은 깃털이 까마귀 거래!', '판다가 밤마다 어디 간다던데?', '까마귀 혼자서 왕관을 들 수 있을까?'], ['달콤한 냄새가 조청이었대.', '조청을 산 게… 사자라고?', '다람쥐 장부는 정확하지.'],
  ['여우가 자기가 범인이래. 진짜일까?', '호랑이는 알리바이가 있대.', '사자 굴에서 우는 소리가 났다던데…'], ['바닷가 동굴에서 왕관을 찾았대!', '늑대가 뭔가 알고 있는 눈치야.', '왕관이 까마귀 둥지에 고이 있었대.'],
  ['원숭이 말은 믿지 마!', '말이랑 유니콘이 화해했대.', '곧 범인 발표래!'], ['드디어 범인을 밝힌대!', '광장으로 가 보자!', '누가 범인일까… 두근두근.'], ['사자한테 꽃 왕관 잘 어울리더라.', '이제 다들 사이좋게 지내자!', '부엉이 탐정 최고야!']];
// 장마다 쓰는 대화 범위(CHATTER 안의 시작 · 끝)
const CHAT_AT = [[0, 6], [6, 10], [10, 14], [14, 18], [18, 22], [22, 26], [26, 30], [30, 34], [34, 40]];
export const FLAT = STORY.flatMap((c, ci) => c.steps.map((s, si) => ({ ...s, ci, si })));
const REWARD = { talk: [50, 3], fish: [90, 5], crop: [90, 5], gift: [70, 6], cook: [130, 6], accuse: [150, 5] }, END_BONUS = 150, FINAL = [1000, 5];
export const DAY_MAX = 11; // 하루에 최대 11단계까지
const GIFT_N = { candy: '사탕', flower: '꽃다발', cake: '케이크' };

// d = { ctx, names[i], svg(i), A(i), affinity(i,d), toned(i,t), coins(n), bag(), saveBag(patch), fish(), useFish(key), barn(), useCrops(map), cropName(id), onChange() }
export function createQuest(d) {
  const { ctx } = d, ref = 'quest/' + ctx.uid; let q = {}, ready = false;
  const off = ctx.store.on(ref, v => { q = v || {}; ready = true; d.onChange && d.onChange(); });
  const cur = () => FLAT[q.s || 0] || null, save = patch => { q = { ...q, ...patch }; d.onChange && d.onChange(); return ctx.store.update(ref, patch).catch(() => {}); };
  const say = (i, t) => d.toned(i, t), doneToday = () => (q.day === ymd() ? q.dn || 0 : 0), capped = () => doneToday() >= DAY_MAX;
  // 지금 단계의 목표를 채웠는지
  function have(step) { const n = step.need;
    if (step.type === 'fish') return d.fish().some(([, , f]) => f && (f.z || 1) >= n.z);
    if (step.type === 'crop') return Object.entries(d.barn() || {}).filter(([k]) => k.split('|')[0] === n.id).reduce((t, [, c]) => t + (c || 0), 0) >= n.n;
    if (step.type === 'gift') { const b = d.bag(); return n.k === 'any' ? Object.keys(GIFT_N).some(k => b[k] > 0) : b[n.k] > 0; }
    if (step.type === 'cook') return !!q.ok;
    return true; }
  // 동물 머리 위 표시: ! 받을 퀘스트 · ? 완료할 수 있음 · … 진행 중
  function markOf(i) { if (!ready) return ''; const s = cur(); if (!s) return ''; if (!q.on) return s.who === i && !capped() ? '!' : '';
    if (s.to !== i) return ''; return s.type === 'talk' || s.type === 'accuse' || have(s) ? '?' : '…'; }
  const goalText = s => { const n = s.need, nm = d.names[s.to];
    return s.type === 'talk' ? `💬 ${nm}에게 가서 이야기하기` : s.type === 'fish' ? `🐟 ${n.z >= 2 ? '중급' : '초급'} 바다 물고기 1마리를 ${nm}에게` : s.type === 'crop' ? `🥕 ${d.cropName(n.id)} ${n.n}개를 ${nm}에게`
      : s.type === 'gift' ? `🎁 ${n.k === 'any' ? '선물(사탕·꽃다발·케이크) 하나' : GIFT_N[n.k]}를 ${nm}에게` : s.type === 'cook' ? `🍚 카피백반에서 ${d.recName(n.rec)} 만들어 ${nm}에게` : '🔎 범인 지목하기'; };
  const rewardOf = s => (s.final ? FINAL : REWARD[s.type]);
  const win = (i, title, lines, extra, actions) => modal({ title, body: [h('div', { class: 'qw' }, h('div', { class: 'qw-pf' }, h('span', { html: d.svg(i) }), h('b', null, d.names[i])),
    h('div', { class: 'qw-tx' }, ...lines.map(t => h('p', null, t.startsWith('(') || t.startsWith('모두') ? t : say(i, t))), ...(extra || [])))], actions });
  const goalRow = (s, prog) => h('div', { class: 'qw-goal' }, h('b', null, '목표'), h('span', null, goalText(s)), prog && h('em', null, prog));
  const rwRow = s => { const [c, a] = rewardOf(s); return h('div', { class: 'qw-rw' }, h('b', null, '보상'), h('span', null, `🪙 ${c}코인`), h('span', null, s.final ? `💗 모든 동물 +${a}` : `💗 친밀도 +${a}`), s.end && !s.final && h('span', null, `📜 장 보너스 ${END_BONUS}`)); };

  // 동물 창의 📜 퀘스트 버튼
  function open(i) { const s = cur(), ch = s && STORY[s.ci];
    if (!s) return win(i, '📜 사건 해결!', ['고마워. 너 덕분에 섬이 다시 하나가 됐어.'], [h('p', { class: 'dim' }, '메인 이야기 「누가 왕관을 훔쳤나」를 모두 마쳤어요.')], [{ label: '닫기', primary: true }]);
    const title = `📜 ${ch.t}`;
    if (!q.on && capped()) return win(i, '📜 오늘은 여기까지!', ['오늘은 수사를 많이 했네. 푹 쉬고 내일 이어서 하자!'], [h('p', { class: 'dim' }, `메인 퀘스트는 하루에 ${DAY_MAX}단계까지 할 수 있어요. 내일 ${d.names[s.who]}에게서 이어져요.`), clueBox()], [{ label: '닫기', primary: true }]);
    if (!q.on && s.who === i) return s.type === 'accuse' ? accuse(i, s, title) : win(i, title, s.say, [goalRow(s), rwRow(s)], [{ label: '나중에' }, { label: s.type === 'talk' && s.to === s.who ? '듣기' : '수락', primary: true, onClick: async c => { c(); if (s.type === 'talk' && s.to === s.who) { await save({ on: 1 }); finish(i, s, title); } else accept(s); } }]);
    if (q.on && s.to === i) { if (s.type === 'talk') return finish(i, s, title);
      if (have(s)) return win(i, title + ' · 완료 가능', [s.type === 'cook' ? '와, 정말 만들어 왔구나!' : '오, 가져왔구나!'], [goalRow(s, '✔'), rwRow(s)], [{ label: '나중에' }, { label: '🎁 건네고 완료하기', primary: true, onClick: c => { c(); finish(i, s, title); } }]);
      return win(i, title, s.say.slice(-1), [goalRow(s, '진행 중'), rwRow(s), hint(s)], [{ label: '닫기', primary: true }]); }
    // 이 동물 차례가 아닐 때: 지금 할 일을 알려 준다
    const who = q.on ? s.to : s.who;
    return win(i, '📜 퀘스트', [`지금은 부탁할 게 없어. ${d.names[who]}에게 가 봐!`], [h('div', { class: 'qw-goal' }, h('b', null, '지금'), h('span', null, `${ch.t} · ${q.on ? goalText(s) : `${d.names[s.who]}에게 이야기 듣기`}`)), clueBox()], [{ label: '닫기', primary: true }]); }
  const hint = s => s.type === 'cook' ? h('p', { class: 'dim' }, '카피백반 첫 화면의 "📜 퀘스트 요리"에서 만들 수 있어요. 임대료는 안 내도 돼요.') : s.type === 'crop' ? h('p', { class: 'dim' }, '작물은 카피 농장에서 길러요.') : s.type === 'fish' ? h('p', { class: 'dim' }, '물고기는 바다 낚시로 잡아요.') : s.type === 'gift' ? h('p', { class: 'dim' }, '선물은 카피수퍼에서 사요.') : null;
  const clueBox = () => { const L = (q.clues || []); return L.length ? h('div', { class: 'qw-clue' }, h('b', null, '🔎 수사 수첩'), ...L.map(t => h('small', null, '· ' + t))) : null; };
  function accept(s) { save({ on: 1, ok: 0 }); sfx('point'); toast(`📜 퀘스트 수락 · ${goalText(s)}`, 2600); }
  async function finish(i, s, title) {
    if (s.type !== 'talk' && s.type !== 'accuse' && !have(s)) return toast('아직 목표를 다 채우지 못했어요');
    if (s.type === 'fish') { const L = d.fish().filter(([, , f]) => f && (f.z || 1) >= s.need.z).sort((a, b) => (a[1].p || 0) - (b[1].p || 0)); d.useFish(L[0][0]); }
    if (s.type === 'crop') { let left = s.need.n; const use = {}; Object.entries(d.barn() || {}).filter(([k, c]) => k.split('|')[0] === s.need.id && c > 0).sort(([a], [b]) => 'FCBAS'.indexOf(a.split('|')[1]) - 'FCBAS'.indexOf(b.split('|')[1])).forEach(([k, c]) => { const t = Math.min(c, left); if (t > 0) { use[k] = t; left -= t; } }); await d.useCrops(use); }
    if (s.type === 'gift') { const b = d.bag(), k = s.need.k === 'any' ? ['candy', 'flower', 'cake'].find(x => b[x] > 0) : s.need.k; await d.saveBag({ [k]: b[k] - 1 }); }
    const [c, a] = rewardOf(s), bonus = s.end && !s.final ? END_BONUS : 0; d.coins(c + bonus);
    if (s.final) d.names.forEach((_, k) => d.affinity(k, a)); else { d.affinity(i, a); if (s.who !== i) d.affinity(s.who, 2); }
    const clues = s.clue ? [...(q.clues || []), s.clue] : q.clues || [];
    await save({ s: (q.s || 0) + 1, on: 0, ok: 0, clues, day: ymd(), dn: doneToday() + 1 }); sfx(s.end ? 'bigfish' : 'coin');
    const next = FLAT[(q.s || 0)], nextT = next && capped() ? `오늘 ${DAY_MAX}단계를 모두 했어요. 내일 ${d.names[next.who]}에게서 이어져요!` : next ? (next.ci !== s.ci ? `다음: ${STORY[next.ci].t} — ${d.names[next.who]}에게 가 보세요` : `다음: ${d.names[next.who]}에게 가 보세요`) : '메인 이야기 끝! 🎉';
    win(i, title + (s.end ? ' · 장 완료!' : ' · 완료'), s.done, [h('div', { class: 'qw-rw' }, h('b', null, '받음'), h('span', null, `🪙 +${c + bonus}`), h('span', null, s.final ? `💗 모든 동물 +${a}` : `💗 +${a}`)), s.clue && h('p', { class: 'qw-new' }, `🔎 수첩에 적었어요: ${s.clue}`), h('p', { class: 'dim' }, nextT)], [{ label: '확인', primary: true }]); }
  function accuse(i, s, title) {
    const pickOne = c => { const [nm, ok, why] = s.need.opts[c]; if (ok) { save({ on: 1 }); finish(i, s, title); } else { sfx('bad'); win(i, title, [why], [clueBox()], [{ label: '다시 고르기', primary: true, onClick: cl => { cl(); accuse(i, s, title); } }]); } };
    win(i, title, s.say, [clueBox(), h('div', { class: 'qw-opts' }, ...s.need.opts.map(([nm], c) => h('button', { class: 'btn', onClick: e => { e.currentTarget.closest('.modal-wrap').querySelector('.modal-x').click(); pickOne(c); } }, `👉 ${nm}`)))], []); }
  // 카피백반과 이어지는 부분
  const cooks = () => { const s = cur(); return s && q.on && s.type === 'cook' && !q.ok ? [{ q: q.s || 0, i: s.to, rec: s.need.rec }] : []; };
  const cooked = k => { if ((q.s || 0) === k) return save({ ok: 1 }); };
  // 지금 이야기에 맞는 일상 대화 하나
  const stage = () => { const c = cur(); return c ? c.ci : STORY.length; };
  const chatter = () => { const [a, b] = CHAT_AT[Math.min(stage(), CHAT_AT.length - 1)]; return CHATTER.slice(a, b); };
  const gossip = () => GOSSIP[Math.min(stage(), GOSSIP.length - 1)];
  const fresh = () => ready && !(q.s || 0) && !q.on;
  return { open, markOf, cooks, cooked, chatter, gossip, fresh, dispose: () => off && off() };
}
