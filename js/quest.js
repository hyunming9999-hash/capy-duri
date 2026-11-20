// 메인 퀘스트 「누가 왕관을 훔쳤나」 — 30마리 용의자 추리극
// 사자의 왕관이 사라진다. 부엉이 탐정의 조수가 되어 단서(진흙 발자국 · 검은 깃털 · 달콤한 냄새)를 쫓고, 마지막에 범인을 직접 지목한다.
// 대반전: 범인은 사자 자신(공범 까마귀). 아무도 대장으로 봐 주지 않아 외로웠던 것. 모두가 꽃 왕관을 씌워 주며 화해한다.
import { h, toast, modal, ymd } from './ui.js';
import { sfx } from './sound.js';

// 단계: who 부탁하는 동물 · to 완료하러 가는 동물(없으면 who) · type talk | fish | crop | gift | cook | accuse
// need: fish {z} · crop {id, n} · gift {k: 'any'|'flower'…} · cook {rec} · accuse {opts:[[이름, 정답?, 틀렸을 때 부엉이 말]]}
const T = (who, to, type, need, say, done, more = {}) => ({ who, to: to == null ? who : to, type, need, say, done, ...more });
// 대사 표기: "{표정}말" = 그 장면의 동물, "@{표정}말" = 나(카피바라), "#번호{표정}말" = 다른 동물
// 동물 표정: happy love sad cry wow smug think shy angry · 카피바라 표정: smile happy wow sad love wink sleepy
export const STORY = [
  { t: '프롤로그 · 사라진 왕관', steps: [
    T(10, 19, 'talk', null, ['{cry}큰일이다! 짐의 황금 왕관이 사라졌도다…! 흐어엉!', '@{wow}왕관이요?! 어젯밤까지는 있었던 거죠?', '{sad}그렇다. 굴 앞에 고이 두고 잤는데, 아침에 보니 감쪽같이 없어졌도다.', '{angry}누가 감히! 섬에서 제일 똑똑한 부엉이에게 가서 수사를 맡기거라!'],
      ['{think}왕관 도난 사건이라… 흥미롭군.', '@{smile}부엉이 선생님, 혹시 짚이는 데가 있으세요?', '{smug}현장에서 단서 세 가지를 찾았다네. 진흙 발자국, 검은 깃털, 그리고 달콤한 냄새.', '{happy}오늘부터 자네가 내 조수일세. 발자국부터 쫓아가 보세.', '@{happy}좋아요, 탐정 조수 출동!'], { clue: '단서 셋: 진흙 발자국 · 검은 깃털 · 달콤한 냄새' })] },
  { t: '1장 · 진흙 발자국', steps: [
    T(19, 12, 'talk', null, ['{think}진흙을 좋아하는 동물이라면… 돼지가 먼저 떠오르는군.', '{smug}돼지에게 가서 그날 밤 어디 있었는지 물어보게.'],
      ['@{smile}돼지야, 그날 밤 어디 있었어?', '{wow}뭐? 내가 범인이라고?', '{angry}그날 밤엔 오이 팩을 하고 있었어. 피부 관리 중이었다고!', '{smug}못 믿겠으면 오이 2개 가져와 봐. 지금 당장 증명해 줄게.']),
    T(12, null, 'crop', { id: 'cucumber', n: 2 }, ['{smug}오이 2개 가져오면 증명해 줄게. 농장에서 기를 수 있어.'],
      ['{happy+cuke}(촤악) 봐, 이렇게 얼굴에 붙이고 밤새 꼼짝 않고 누워 있었다고.', '{shy+cuke}…이건 비밀인데, 나 몰래 다이어트 중이야. 미식가 체면이 있지. 아무한테도 말하지 마!', '@{wink}비밀은 지킬게!', '{think+cuke}참, 그날 밤 멧돼지가 진흙탕을 첨벙첨벙 지나가는 소리는 들었어.']),
    T(21, null, 'cook', { rec: 'mattang' }, ['@{smile}멧돼지야, 사자 굴 앞 발자국 말인데…', '{shy+mud}그래, 그거 내 거다.', '{sad+mud+h:🍠}근데 왕관 때문이 아니라 농장 고구마 때문이었어. 배고파서… 미안.', '{happy+mud}카피백반에서 고구마 맛탕 하나만 해 주면 본 걸 다 털어놓을게.'],
      ['{love+mud+h:🍠}(우걱우걱) 맛있다! 좋아, 다 말할게.', '{think+mud}고구마 밭에 가다가 사자 굴 앞에서 오리가 서성이는 걸 봤어. 난 거기까지야.']),
    T(18, 19, 'talk', null, ['{wow}어머, 나 봤다고? 응, 그날 밤 연못 가다가 사자 굴 앞을 지났지!', '{think}굴 앞에 커다란 그림자가 있었어. 날개가 있었던 것 같기도 하고…', '{happy}부엉이 탐정한테 꼭 전해 줘! 아참, 이건 비밀인데 요즘 펭귄이랑 물개가…', '@{sad}(또 수다 시작이다…)'],
      ['{think}날개 달린 그림자라… 두 번째 단서, 검은 깃털과 이어지는군.', '@{smile}발자국은 멧돼지의 고구마 서리였어요.', '{smug}그래, 범인은 따로 있네. 다음은 검은 깃털일세.'], { end: 1, clue: '발자국 = 멧돼지의 고구마 서리 · 굴 앞에 날개 달린 그림자' })] },
  { t: '2장 · 검은 깃털', steps: [
    T(19, 16, 'talk', null, ['{think}검은 깃털이라… 검은 옷을 입은 펭귄 군이 그날 밤 무얼 했는지 들어 보게.'],
      ['{wow}수사에 협조하겠습니다.', '{smug+h:🛷}그 시간에는 얼음 썰매 연습을 하고 있었습니다. 증인은 물개입니다.', '{sad}다만… 물개는 생선 없이는 입을 열지 않습니다.']),
    T(26, null, 'fish', { z: 1 }, ['{happy}펭귄 알리바이? 증언해 줄 수 있지.', '{smug}근데 공짜로? 박수 대신 생선 한 마리!'],
      ['{love+h:🐟}(꿀꺽) 좋아! 펭귄은 밤새 나랑 썰매 탔어. 내가 박수도 쳐 줬다고.', '{think}근데 썰매 타다가 봤는데, 판다가 한밤중에 몰래 어디 가더라?']),
    T(7, null, 'cook', { rec: 'gaji' }, ['{wow}판다를 의심한다고? 검은 털 때문에?', '@{smile}그냥 확인하는 거야. 그날 밤 어디 갔었어?', '{shy+h:🍆}…들켰다. 밤마다 몰래 야식 먹으러 나갔어. 대나무 말고 가지볶음이 너무 먹고 싶었거든.', '{happy}가지 대파볶음 하나 해 주면 본 걸 말해 줄게.'],
      ['{love+h:🍆}(냠냠) 이 맛이야.', '{think}야식 먹으러 가다가 봤어. 까마귀가 반짝이는 걸 물고 바닷가 쪽으로 날아가더라.', '@{wow}까마귀가?!']),
    T(7, 19, 'talk', null, ['{sad+zz+tired}부엉이한테 가서 말해 줘. 난 다시 잘래…'],
      ['{think}까마귀가 반짝이는 걸 물고 바닷가로… 그 깃털은 까마귀 것이 맞네.', '@{wow}그럼 까마귀가 범인이에요?', '{smug}하지만 이상하군. 까마귀 혼자서 무거운 왕관을 들 수 있을까?', '{think}공범이 있어. 세 번째 단서, 달콤한 냄새를 쫓아가세.'], { end: 1, clue: '검은 깃털 = 까마귀 · 왕관이 무거워서 공범이 있다' })] },
  { t: '3장 · 달콤한 냄새', steps: [
    T(19, 6, 'talk', null, ['{think}달콤한 냄새는 꿀 냄새 같았지. 꿀이라면 곰일세.'],
      ['{wow+h:🍯}꿀 냄새? 허허, 내 꿀단지는 그대로인데.', '{sad}겨울잠 준비하느라 배가 고파서 머리가 안 돌아가. 생선 한 마리 주면 기억날지도.']),
    T(6, null, 'fish', { z: 1 }, ['{sad}생선 한 마리면 기억이 날 것 같은데…'],
      ['{happy+h:🐟}(덥석) 고맙다. 이제 기억난다.', '{think}그 냄새는 꿀이 아니라 조청이야. 카피수퍼에서 파는 거.', '{smile}다람쥐가 카피수퍼 장부 정리를 돕는다던데, 누가 샀는지 물어봐.']),
    T(28, null, 'crop', { id: 'potato', n: 2 }, ['@{smile}다람쥐야, 카피수퍼 장부 좀 볼 수 있을까?', '{smug+h:📒}장부? 보여 줄 수 있지.', '{happy}대신 겨울 저축용 감자 2개! 공짜는 없어.'],
      ['{think+h:📒}(장부 넘기는 소리) 최근 조청을 산 동물은… 딱 하나.', '{wow+h:📒}…사자? 피해자가 왜 조청을 샀지?', '@{wow}사자가요?!', '{shy+h:🪙+spark}아, 그리고 내 도토리 창고에서 반짝이는 게 나왔는데, 왕관 보석인지 봐 줄래?']),
    T(28, 29, 'talk', null, ['{smile+h:🪙+spark}이 반짝이 말이야, 너구리가 보물 감정을 잘하잖아. 가져가 볼래?'],
      ['{think+lens}어디 보자…', '{wow+h:🪙+spark}이건 왕관 보석이 아니라 내가 잃어버린 병뚜껑 보물이잖아!', '{smug}다람쥐가 주워 갔었구나. 도둑질은 아니니 봐줄게.', '{think}근데 사자가 조청을 샀다고? 왜이리 생뚱맞은 행동을 하지? 수상한데… 부엉이한테 알려야겠어.']),
    T(29, 19, 'talk', null, ['{smile}부엉이 탐정한테 같이 가자. 이건 중요한 단서야.'],
      ['{wow}피해자가 조청을 샀다… 흠, 흠. 확실히 태어나서 조청을 좋아한 사자는 처음보긴해.', '@{think}뭔가 이상하죠?', '{think}하지만 이런걸로 아직 결론 내긴 이르네. 사자와 사이가 나쁜 동물부터 살펴보세.'], { end: 1, clue: '달콤한 냄새 = 조청 · 조청을 산 건 피해자 사자' })] },
  { t: '4장 · 가짜 자백', steps: [
    T(19, 9, 'talk', null, ['{think}사자와 앙숙인 호랑이부터 만나 보게.'],
      ['{angry}나를 의심해?', '{smug}그 왕관 따위 필요 없어. 내 줄무늬가 곧 왕관이다!', '@{sad}그래도 확인은 해야 해서…', '{think}확인? 확~이인? 공짜가있나? 정 의심되면 매운탕으로 내 기분부터 풀어 줘. 그럼 증거를 보여 주지.']),
    T(9, null, 'cook', { rec: 'maeun' }, ['{smug}매운탕이다. 화끈하게!'],
      ['{happy+sweat+h:🍲}(후루룩) 크으, 이 맛이야.', '{smug+h:📋}증거는 이거다. 그날 밤 난 부엉이 선생의 별 관찰 수업을 들었지. 출석부에 내 이름이 있다. 그것이 알리바이야.', '{angry}그런데 여우 녀석이 자기가 범인이라고 떠들고 다니더군. 솔직히 워낙 관종이라서 믿지는 않았지만.']),
    T(5, 1, 'talk', null, ['{smug}맞아, 내가 훔쳤지롱~ 왕관은 하늘나라에 있지롱! 어때? 내가 막 얄밉지? 호호', '@{wow}정말?!', '{happy}…증거? 고양이한테 물어봐. 걔가 날 봤을걸? 호호'],
      ['{wow}여우가 범인이라고? 말도 안 된다. 걔 진짜 관종이야. 나랑 같은 유치원 출신인데 어휴...', '{smug}토끼 선생님 점심 당근을 훔쳐서 달아난적이 있었어. 결국 선생님이 엄청 혼냈는데', '{sad}보육원 출신이라서 사랑이 많이 부족한 애였던거야!', '{angry}그러니까, 관심받고 싶어서 거짓말한 거야. 어휴..대신 혼내 줄 테니 생선 하나만.']),
    T(1, null, 'fish', { z: 1 }, ['{smug}생선 하나 주면 여우를 혼내 주겠다.'],
      ['{happy+h:🐟}(냠) 좋다. 여우는 내가 따끔하게 혼내 줬다.', '{think}그런데 그날 밤 강아지가 이상한 소리를 들었다고 했다. 가 봐라. 걔 아버지가 경비원 출신이라서', '{smug}그 피가 어디가겠어?']),
    T(0, 19, 'talk', null, ['{wow+sniff}킁킁, 맞아! 그날 밤 사자 굴에서 "흐흑" 하고 우는 소리가 났어.', '@{think}왕관을 잃어버리기 전에?', '{sad}응. 이상하지? 나는 그런 소리에 민감해! 부엉이 탐정한테 전해 줘!'],
      ['{think}도둑맞기 전에 울고 있었다…? 이제 그림이 보이기 시작하는군...흠..', '{smug}마지막 조각은 밤의 목격자들에게 있을 걸세.'], { end: 1, clue: '호랑이·여우는 알리바이 확인 · 사자는 왕관이 사라지기 전에 울고 있었다' })] },
  { t: '5장 · 밤의 목격자', steps: [
    T(19, 27, 'talk', null, ['{think}밤마다 지혼자 보물찾기를 하는 고슴도치에게 물어보게.'],
      ['{shy+h:💎+spark}내 취미가 보물찾기인데, 보물찾기 하다가 바닷가 동굴에서 이걸 주웠어. 금빛 보석 조각.', '@{wow}왕관 보석이다! 이거 맞는거 같은데?', '{sad+sweat}근데 그 동굴, 무서워서 더는 못 들어갔어. 나는 보물찾기를 좋아하지만', '{shy+sweat}무서우면 바로 오줌이 나오거든..아마 그나마 걔랑 친한 늑대라면 뭔가 알 거야.']),
    T(20, null, 'gift', { k: 'any' }, ['{think}…그 동굴에 대해 아는 게 있긴 해.', '{sad}하지만 의리 때문에 말 못 해. 정말 친구로서 묻는 거라면…', '@{wink}뇌물로 케이크를 준다고 하면?', '{love}아~~~~~~우~~~~~ 충쎵!!!!!'],
      ['{shy+h:🎁}…좋아. 사실 그날 밤 사자가 까마귀랑 같이 그 동굴로 들어가는 걸 봤어..', '@{wow}사자가… 까마귀랑? 까마귀는 진짜 나쁜애야!', '{sad}알아..근데 사자가 큰소리쳐도 사실 외로움 타는 녀석이야. 너무 몰아붙이지 마.', '{think}근데, 증거를 찾기도 전에 요즘 동굴 근처에서 갈매기 해적단이 너무 설쳐', '{angry}해적단 부터 참교육해야 증거수집 하러 진입할 수 있을거야. 거북이 한테 가봐!']),
    T(24, null, 'pirate', null, ['{think}바닷가 동굴에 가려면 중급 바다를 건너야 하는데… 요즘 갈매기 해적단이 길을 막고 있구먼.', '@{wow}해적단이요?!', '{smile}노답이야 진짜..일단 내 흰 배와 대포를 빌려주겠네. 해적단을 물리치고 오게. 나는 겁이 먹으면 오줌을..', '@{sad}(다들 오줌을 왜이리 찌끄리는거야..)', '{think}단, 기회는 하루에 두 번뿐일세. 두 번 다 지면 내일 다시 오게나.'],
      ['{wow}해적단을 물리쳤구먼! 장하네. 혹시 전설의 황금용사가 될수있지 않을까? 예상이 되는군......아!!!', '{smile}배와 대포는 돌려받겠네. 이제 동굴에 들어갈 수 있겠어.'], { loan: 1 }),
    T(24, 25, 'talk', null, ['{think}동굴 … 사실 동굴 내부는 문어가 아주 잘 알고있어. 손이 많아서 남들은 10분걸릴거 8분만에 끝난다고 하더군.', '{smile}문어에게 가 보게!'],
      ['{wow+h:👑+spark}동굴 청소하다가 이게 나왔어! 반짝반짝한 왕관! 이거 때문에 요즘 꽤 시끄럽던데..', '@{happy}찾았다!!', '{think+h:👑}근데 까마귀 둥지 안에 고이 놓여 있더라. 훔친 게 아니라 맡겨 둔 것처럼.', '{happy}아 그건 그렇고 일단, 나 좋은 정보를 줬으니. 단호박 생선찜 하나 부탁해.']),
    T(25, null, 'cook', { rec: 'hobak' }, ['{happy}단호박 생선찜이면 사례로 딱이지.'],
      ['{love+h:🍲}(음미) 재료 맛이 살아 있네.', '{smile+h:👑}그럼, 이 왕관은 증거물로써 부엉이한테 맡길게. 범인을 밝히는 건 너의 몫이야.']),
    T(25, 19, 'talk', null, ['{smile}왕관 들고 부엉이한테 가 봐.'],
      ['{wow+h:👑}왕관을 찾았네! 대박! 하지만 범인을 밝혀야 사건이 끝나지.', '{sad}그런데 섬이 소문으로 떠들썩해졌어. 다들 입이 싸서 큰일이야. 모두를 모으기 전에 소동부터 가라앉혀 주게.'], { end: 1, clue: '사자가 까마귀와 동굴로 · 왕관은 까마귀 둥지에 고이 놓여 있었다' })] },
  { t: '6장 · 소문 재판', steps: [
    T(14, 4, 'talk', null, ['{happy+h:📣}우끼끼! 호랑이가 범인이래! 아니 여우래! 아니 펭귄이래!', '@{sad}원숭이야, 그런 말 함부로 하면…', '{smug+h:📣}토끼한테 가서 진짜인지 물어봐!'],
      ['{angry}원숭이가 또 소문을 퍼뜨렸구나!', '{sad}그 바람에 말이랑 유니콘이 서로 범인이라고 싸우고 있어. 그 둘은 계속 서로 자신들이 잘생겼다고 싸우거든.', '{smile}둘을 화해시켜 줘. 말은 당근을 좋아해.']),
    T(22, null, 'crop', { id: 'carrot', n: 2 }, ['{angry}유니콘이 날 범인으로 몰았어! 억울해서 달리기도 안 돼. 나는 평생을 봉사하며 살았어. 엉엉', '{sad}당근 2개 먹으면 기분이 좀 풀릴 것 같아.'],
      ['{happy+h:🥕}(아삭) 좋아, 머리가 맑아졌어! 유니콘한테 먼저 사과할게.', '{shy}사실 나도 걔 뿔이 부러웠거든.']),
    T(23, null, 'gift', { k: 'any' }, ['{wow}말이 사과한다고? 머쓱한데...', '{shy}그럼 화해의 반짝이는 선물을 하나 전해 줘.'],
      ['{love+h:🎁+spark}고마워! 우리 다시 친구야. 절교는 취소할게!', '{wow}…그런데 닭 아줌마가 이 소란이 무섭다고 병아리를 데리고 피난 간대!']),
    T(15, 17, 'cook', { rec: 'jjin' }, ['{cry+sweat}무서워서 못 살겠어! 우리 병아리가 밥도 안 먹어. 아구 저 딱한것. 저 겁먹은 눈을 봐!', '{sad}감자옥수수찜이면 먹을 텐데… 병아리한테 갖다줘.'],
      ['{love+h:🌽}(오물오물) 마시써!', '{happy}엄마, 이제 안 무서워. 범인 잡히면 다 괜찮을 거야.', '{smile}저기 코알라 형 좀 달래줘요. 난 괜찮아!']),
    T(8, 11, 'talk', null, ['{sad+tired}시끄러워서 잠을 못 자…나는 잠이 필요해', '{sad+tired+zz}소한테 따뜻한 우유 좀 달라고 해 줘…부탁해'],
      ['{wow}코알라가 잠을 못 잔다고?', '{sad+h:🥛}마음아파 못보겠군...따뜻한 우유야. 아무것도 묻지마..', '{think}생쥐랑 햄스터도 무서워서 쳇바퀴 속에 숨었대. 개구리가 노래로 달래 주고 있어. 너가 고생이 많아! 우유 필요해?', '@{sad}아..아니..']),
    T(13, 19, 'talk', null, ['{happy+note+h:🎤}다들 무서워해서 노래를 불러 줬어~ 생쥐랑 햄스터도 이제 괜찮대. 나는 나중에 MCT 데뷔조로 갈거야!', '@{smile}응...', '{happy+note+h:🎤}♪ 범인을 잡아라 ♬ 부엉이 탐정에게 가 봐!'],
      ['{smile}좋아, 섬이 조용해졌군. 고마워! 모두를 광장에 불러 모았네.', '{smug}이제 자네가 범인을 지목할 차례일세.', '@{think}(지금까지 단서를 잘 떠올려 보자…)'], { end: 1, clue: '소문은 원숭이가 퍼뜨린 것 · 모두 광장에 모였다' })] },
  { t: '7장 · 범인은 바로…', steps: [
    T(19, null, 'accuse', { opts: [['호랑이', 0, '{smug}호랑이는 그날 밤 내 수업 출석부에 이름이 있었네. 다시 생각해 보게.'], ['여우', 0, '#5{cry}나는 사실 관심이 필요했어 엉엉...'], ['까마귀 혼자', 0, '{think}까마귀 혼자서는 왕관을 들 수 없다고 했지. 공범을 떠올려 보게.'], ['사자', 1]] },
      ['{think}단서를 정리하지. 진흙 발자국은 멧돼지, 검은 깃털은 까마귀.', '{smug}평소에는 사지도 않은 조청을 산건 사자! 왕관이 사라지기 전에 운 것도 사자.', '{think}그리고 사자와 까마귀가 함께 동굴로 갔지. 자, 범인은 누구인가?'],
      ['@{sad}범인은… 사자예요.', '{smug}…그렇다네. 범인은 바로 사자일세. 까마귀는 망을 봐 준 공범이고. 이런 개관종을 봤나!', '{sad}어휴 사자에게 가 보게. 이유를 들어야지.']),
    T(10, null, 'talk', null, ['{cry}…들켰구나. 짐이… 짐이 범인이다. 끄흑'],
      ['{sad}다들 ..아무도 짐을 대장으로 봐 주지 않았도다. 다들 인사도 안하고 요즘 너만 나타나면 발광을 하니 말야.', '{cry}그래서 왕관이 사라지면 모두 짐을 걱정하며 찾아 줄 줄 알았지. 까마귀에게 조청을 뇌물로 주고 숨겨 달라 했도다.', '@{sad}저기요....', '{cry}다들… 미안하다.']),
    T(19, 10, 'gift', { k: 'flower' }, ['{smile}섬 동물들이 그동안 사자에게 미안했는지 줄 꽃 왕관을 만들고 있네.', '{happy}마지막 꽃은 자네 몫이야. 꽃다발을 사자에게 전해 주게.'],
      ['{wow+flower}(꽃 왕관을 쓰고) 이… 이건…', '@{happy}모두가 말했어. "왕관 없어도 넌 우리 친구야!"', '{cry+flower}짐은… 아니, 나는…', '{love+flower+spark}나는 정말 행복하도다. 모두 고맙다! 까흑'], { end: 1, final: 1, clue: '범인은 사자(공범 까마귀) · 모두 다 같이 화해' })] },
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
const REWARD = { talk: [50, 3], fish: [90, 5], crop: [90, 5], gift: [70, 6], cook: [130, 6], accuse: [150, 5], pirate: [200, 6] }, END_BONUS = 150, FINAL = [5000, 5];
export const PIRATE_TRIES = 2;
export const DAY_MAX = 11; // (예전 하루 제한 값 · 지금은 쓰지 않는다)
const GIFT_N = { candy: '사탕', flower: '꽃다발', cake: '케이크' };

// d = { ctx, names[i], svg(i), A(i), affinity(i,d), toned(i,t), coins(n), bag(), saveBag(patch), fish(), useFish(key), barn(), useCrops(map), cropName(id), onChange() }
// 대사에 맞춰 동물 그림에 소품을 얹는다: "{표정+소품+h:🐟}" (h: = 손에 든 것). 모든 동물은 같은 틀(120×158, 눈 y41, 손 91,99)이라 한 자리에 얹으면 된다
// 오이팩: 얇게 썬 오이를 양 볼과 이마에 한 장씩 붙인다
const cukeSvg = (pts, k) => pts.map(([x, y]) => `<g transform="translate(${x} ${y}) scale(${k})"><circle r="10" fill="#E3F7C8" stroke="#4E8A2E" stroke-width="3"/><circle r="6" fill="none" stroke="#9CCB6E" stroke-width="1.4"/>${[[-2, -2], [2, -1], [0, 2.4], [-2.6, 1.6], [2.6, 2]].map(([a, b]) => `<ellipse cx="${a}" cy="${b}" rx=".9" ry="1.4" fill="#7FB55A"/>`).join('')}</g>`).join('');
const CUKE_FL = cukeSvg([[30, 64], [81, 64], [55.4, 31]], 0.62); // 보송 그림체 돼지: 양 볼 + 이마
const PROP = {
  cuke: cukeSvg([[24, 60], [96, 60], [60, 20]], 0.9),
  mud: '<path d="M18 60 q6 -6 12 0 q4 6 -3 8 q-8 2 -9 -8z M86 24 q7 -4 11 2 q2 6 -6 6 q-7 -1 -5 -8z M38 126 q8 -8 16 0 q2 6 -8 6 q-10 0 -8 -6z M70 128 q8 -6 14 0 q0 6 -8 5 q-8 -1 -6 -5z" fill="#7A5230" opacity=".85"/><circle cx="34" cy="70" r="2" fill="#7A5230"/><circle cx="92" cy="34" r="1.8" fill="#7A5230"/>',
  flower: [[20, 18, '#FF8FB1'], [33, 10, '#FFD45E'], [47, 6, '#FFFFFF'], [60, 5, '#FF8FB1'], [73, 6, '#B79CFF'], [87, 10, '#FFD45E'], [100, 18, '#FFFFFF']].map(([x, y, c]) => `<g transform="translate(${x} ${y})">${[0, 72, 144, 216, 288].map(r => `<ellipse cx="0" cy="-5" rx="3.6" ry="5" fill="${c}" stroke="#E07A9A" stroke-width=".8" transform="rotate(${r})"/>`).join('')}<circle r="2.6" fill="#FFB020"/></g>`).join('') + '<path d="M14 22 Q60 -2 106 22" fill="none" stroke="#5FA846" stroke-width="2.4"/>',
  det: '<path d="M20 22 Q22 -6 60 -8 Q98 -6 100 22 Q60 12 20 22z" fill="#9B6A3E" stroke="#5A3A20" stroke-width="2"/><path d="M30 18 Q60 8 90 18 M38 2 v16 M60 -6 v16 M82 2 v16" stroke="#7A4E2C" stroke-width="1.6" fill="none" opacity=".7"/><path d="M14 24 Q60 10 106 24 Q102 30 90 28 Q60 20 30 28 Q18 30 14 24z" fill="#7A4E2C" stroke="#5A3A20" stroke-width="1.6"/><circle cx="60" cy="-9" r="3" fill="#5A3A20"/>',
  lens: '<g transform="rotate(-28 24 104)"><rect x="21.5" y="104" width="5" height="22" rx="2.4" fill="#7A4E2C" stroke="#4A2E18" stroke-width="1.2"/><circle cx="24" cy="94" r="11" fill="#CFEFFF" fill-opacity=".55" stroke="#C99A2E" stroke-width="3.4"/><path d="M18 90 q3 -4 8 -4" stroke="#fff" stroke-width="2" fill="none" stroke-linecap="round"/></g>',
  sweat: '<path d="M104 14 q-6 9 0 12 q6 -3 0 -12z M112 30 q-4 6 0 8 q4 -2 0 -8z" fill="#7CC8F5" stroke="#fff" stroke-width="1"/>',
  zz: '<text x="98" y="2" font-size="20" font-weight="900" fill="#7A8BBF">z</text><text x="108" y="-10" font-size="14" font-weight="900" fill="#7A8BBF">z</text>',
  note: '<text x="96" y="6" font-size="22">🎵</text><text x="2" y="14" font-size="18">🎶</text>',
  sniff: '<path d="M44 60 q-6 -2 -10 2 M42 66 q-7 1 -9 6 M76 60 q6 -2 10 2 M78 66 q7 1 9 6" stroke="#8a7a66" stroke-width="1.8" fill="none" stroke-linecap="round"/>',
  tired: '<path d="M16 50 q8 5 16 0 M88 50 q8 5 16 0" stroke="#9A7FB8" stroke-width="2.6" fill="none" stroke-linecap="round" opacity=".8"/>',
  spark: '<text x="-2" y="0" font-size="16">✨</text><text x="100" y="40" font-size="14">✨</text>',
};
export function propSvg(svg, props) { if (!props || !props.length) return svg; const fur = (svg.match(/<rect x="31" y="76" width="58" height="50" rx="24" fill="([^"]+)"/) || [])[1] || '#ccc';
  const hold = props.find(p => p.startsWith('h:')), list = props.filter(p => !p.startsWith('h:'));
  const fl = svg.includes('<image'); // 보송 그림체: 머리가 더 아래·작게 있어서 꽃 왕관을 머리 위에 맞춰 얹는다
  let add = list.map(p => (p === 'flower' && fl ? `<g transform="translate(8.5 10.5) scale(.77)">${PROP[p]}</g>` : p === 'cuke' && fl ? CUKE_FL : PROP[p] || '')).join('');
  if (list.includes('det') && !hold) add += PROP.lens + `<ellipse cx="27" cy="108" rx="7.5" ry="6.5" fill="${fur}"/>`; // 탐정은 다른 손에 돋보기
  if (hold) add += `<text x="101" y="126" font-size="34" text-anchor="middle">${hold.slice(2)}</text><ellipse cx="91" cy="110" rx="7.5" ry="6.5" fill="${fur}"/>`;
  return svg.replace(/<\/svg>$/, add + '</svg>').replace('<svg ', '<svg style="overflow:visible" '); }

export function createQuest(d) {
  const { ctx } = d, ref = 'quest/' + ctx.uid; let q = {}, ready = false;
  // 상대는 몇 단계까지 했는지(퀘스트 현황 창에 한 줄)
  const palLine = total => { const el = h('p', { class: 'qs-pal' }), pid = ctx.partnerId; if (!pid || !ctx.store.get) return null; el.textContent = `${ctx.nameOf(pid)}: 확인하는 중…`;
    ctx.store.get('quest/' + pid).then(v => { const n = Math.min(total, (v && v.s) || 0), st = FLAT[n], ch = st ? STORY[st.ci].t : '끝까지 완료!'; el.textContent = `👫 ${ctx.nameOf(pid)}: ${n} / ${total}단계 · ${n >= total ? '모두 끝냈어요 🏆' : ch}`; }).catch(() => { el.textContent = ''; }); return el; };
  const off = ctx.store.on(ref, v => { q = v || {}; ready = true; d.onChange && d.onChange(); });
  const cur = () => FLAT[q.s || 0] || null, save = patch => { q = { ...q, ...patch }; d.onChange && d.onChange(); return ctx.store.update(ref, patch).catch(() => {}); };
  const say = (i, t) => d.toned(i, t), doneToday = () => (q.day === ymd() ? q.dn || 0 : 0), capped = () => false; // 하루 제한 없음: 시간과 상관없이 계속 진행할 수 있다
  // 지금 단계의 목표를 채웠는지
  function have(step) { const n = step.need;
    if (step.type === 'fish') return d.fish().some(([, , f]) => f && (f.z || 1) >= n.z);
    if (step.type === 'crop') return Object.entries(d.barn() || {}).filter(([k]) => k.split('|')[0] === n.id).reduce((t, [, c]) => t + (c || 0), 0) >= n.n;
    if (step.type === 'gift') { const b = d.bag(); return n.k === 'any' ? Object.keys(GIFT_N).some(k => b[k] > 0) : b[n.k] > 0; }
    if (step.type === 'cook' || step.type === 'pirate') return !!q.ok;
    return true; }
  // 동물 머리 위 표시: ! 받을 퀘스트 · ? 완료할 수 있음 · … 진행 중
  function markOf(i) { if (!ready) return ''; const s = cur(); if (!s) return ''; if (!q.on) return s.who === i && !capped() ? '!' : '';
    if (s.to !== i) return ''; return s.type === 'talk' || s.type === 'accuse' || have(s) ? '?' : '…'; }
  const goalText = s => { const n = s.need, nm = d.names[s.to];
    return s.type === 'talk' ? `🗣️ ${nm}에게 가서 탐문하기` : s.type === 'fish' ? `🎣 ${n.z >= 2 ? '중급' : '초급'} 바다 물고기 1마리를 ${nm}에게` : s.type === 'crop' ? `🌾 ${d.cropName(n.id)} ${n.n}개를 ${nm}에게`
      : s.type === 'gift' ? `🎀 ${n.k === 'any' ? '선물(사탕·꽃다발·케이크) 하나' : GIFT_N[n.k]}를 ${nm}에게` : s.type === 'cook' ? `🍳 카피백반에서 ${d.recName(n.rec)} 만들어 ${nm}에게` : s.type === 'pirate' ? `⚔️ 빌린 흰 배로 중급 바다에 나가 갈매기 해적단 물리치기 (하루 ${PIRATE_TRIES}번)` : '⚖️ 범인 지목하기'; };
  const rewardOf = s => (s.final ? FINAL : REWARD[s.type]);
  // 해적 퀘스트: 하루 두 번 기회. 진행 중이고 기회가 남았을 때만 흰 배·대포를 빌려준다
  const triesLeft = () => PIRATE_TRIES - (q.pday === ymd() ? q.pt || 0 : 0);
  const pirateOn = () => { const s = cur(); return !!(s && s.type === 'pirate' && q.on && !q.ok && triesLeft() > 0); };
  async function pirateResult(win) { const s = cur(); if (!s || s.type !== 'pirate' || !q.on || q.ok) return; if (win) { await save({ ok: 1 }); sfx('bigfish'); toast(`⚔️ 해적단을 물리쳤어요! ${d.names[s.to]}에게 돌아가 퀘스트를 완료하세요 (배·대포는 돌려줘요)`, 4200); }
    else { const n = (q.pday === ymd() ? q.pt || 0 : 0) + 1; await save({ pday: ymd(), pt: n }); toast(n >= PIRATE_TRIES ? `오늘 기회를 다 썼어요. 배와 대포는 돌려주고 내일 다시 도전해요` : `해적단에게 졌어요… 남은 기회 ${PIRATE_TRIES - n}번`, 4200); } }
  const win = (i, title, lines, extra, actions) => modal({ title, body: [h('div', { class: 'qw' }, h('div', { class: 'qw-pf' }, h('span', { html: d.svg(i) }), h('b', null, d.names[i])),
    h('div', { class: 'qw-tx' }, ...lines.map(t => h('p', null, t.startsWith('(') || t.startsWith('모두') ? t : say(i, t))), ...(extra || [])))], actions });
  // 게임 화면 위 대화: 말하는 쪽이 크게 서고(동물 오른쪽 · 나 왼쪽), 반대편에 넓은 말풍선. 누를 때마다 다음 줄
  const parse = (t, def) => { let who = def, m = /^@/.test(t) ? 'me' : null; if (m) { who = 'me'; t = t.slice(1); } else { const k = /^#(\d+)/.exec(t); if (k) { who = +k[1]; t = t.slice(k[0].length); } }
    const md = /^\{([^}]*)\}/.exec(t), parts = md ? md[1].split('+') : ['']; return { who, mood: parts[0], props: parts.slice(1), text: md ? t.slice(md[0].length) : t }; };
  let sceneBg = ''; // 장면 배경: 'cave' 동굴 · 'plaza' 광장 · '' 없음(게임 화면 그대로)
  function vn(lines, def, chapter, extra, buttons) { const host = d.host && d.host(); if (!host) { const L = lines.map(t => parse(t, def)).filter(l => l.who !== 'me').map(l => l.text); return new Promise(res => win(def, chapter, L.length ? L : [''], extra, (buttons || [{ label: '확인', primary: true }]).map(b => ({ ...b, onClick: c => { c(); res(b.value); } })))); }
    document.querySelectorAll('.modal-wrap .modal-x').forEach(x => x.click()); host.querySelectorAll('.vn').forEach(e => e.remove());
    return new Promise(res => { let k = 0, done = false; const el = h('div', { class: 'vn' }); host.append(el); d.pause && d.pause(true); const bgNow = sceneBg;
      const end = v => { if (done) return; done = true; el.remove(); d.pause && d.pause(false); res(v); };
      function show() { const l = parse(lines[k], def), me = l.who === 'me', last = k === lines.length - 1;
        const face = me ? d.meSvg(l.mood || 'smile') : propSvg(d.svgFull(l.who, l.mood), l.who === 19 ? ['det', ...l.props] : l.props), name = me ? d.meName : d.names[l.who], text = me ? l.text : say(l.who, l.text);
        el.className = 'vn ' + (me ? 'l' : 'r') + (bgNow ? ' bg' : ''); el.style.backgroundImage = bgNow ? `url(img/quest/bg-${bgNow === 'plaza' ? 'plaza-worry' : bgNow}.webp)` : '';
        const box = h('div', { class: 'vn-box' }, h('b', { class: 'vn-nm' }, name), h('button', { class: 'vn-x', 'aria-label': '닫기', onClick: e => { e.stopPropagation(); end(null); } }, '✕'), h('p', { class: 'vn-tx' }, text),
          ...(last ? (extra || []).filter(Boolean) : []), last && buttons && buttons.length ? h('div', { class: 'vn-bt' }, ...buttons.map(b => h('button', { class: 'btn' + (b.primary ? ' primary' : ''), onClick: e => { e.stopPropagation(); end(b.value); } }, b.label))) : h('span', { class: 'vn-nx' }, last ? '▼ 눌러서 닫기' : '▼ 눌러서 다음'));
        el.replaceChildren(h('i', { class: 'vn-ch' }, chapter), h('div', { class: 'vn-pf', html: face }), box); sfx('tock'); }
      el.addEventListener('click', () => { if (k < lines.length - 1) { k++; show(); } else if (!(buttons && buttons.length)) end(true); });
      show(); }); }
  const goalRow = (s, prog) => h('div', { class: 'qw-goal' }, h('b', null, '목표'), h('span', null, goalText(s)), prog && h('em', null, prog));
  const rwRow = s => { const [c, a] = rewardOf(s); return h('div', { class: 'qw-rw' }, h('b', null, '보상'), h('span', null, `🪙 ${c}코인`), h('span', null, s.final ? `💗 모든 동물 +${a}` : `💗 친밀도 +${a}`), s.end && !s.final && h('span', null, `📁 장 보너스 ${END_BONUS}`)); };

  // 동물 창의 🔍 퀘스트 버튼
  async function open(i) { const s = cur(), ch = s && STORY[s.ci];
    if (!s) return vn(['{happy}고마워. 너 덕분에 섬이 다시 하나가 됐어.'], i, '👑 사건 해결!', [h('p', { class: 'vn-sub' }, '메인 이야기 「누가 왕관을 훔쳤나」를 모두 마쳤어요.')]);
    const title = `🔍 ${ch.t}`;
    if (!q.on && capped()) return vn(['{smile}오늘은 수사를 많이 했네. 푹 쉬고 내일 이어서 하자!'], i, '🌙 오늘은 수사 끝!', [h('p', { class: 'vn-sub' }, `메인 퀘스트는 하루에 ${DAY_MAX}단계까지 할 수 있어요. 내일 ${d.names[s.who]}에게서 이어져요.`)]);
    if (!q.on && s.who === i) { if (s.type === 'accuse') return accuse(i, s, title);
      const same = s.type === 'talk' && s.to === s.who, v = await vn(s.say, i, title, [goalRow(s), rwRow(s)], [{ label: '나중에', value: 0 }, { label: same ? '듣기' : '수락', primary: true, value: 1 }]);
      if (!v) return; if (same) { await save({ on: 1 }); return finish(i, s, title); } return accept(s); }
    if (q.on && s.to === i) { if (s.type === 'talk') return finish(i, s, title);
      if (have(s)) { const v = await vn([s.type === 'cook' ? '{wow}와, 정말 만들어 왔구나!' : '{happy}오, 가져왔구나!'], i, title + ' · 완료 가능', [goalRow(s, '✔'), rwRow(s)], [{ label: '나중에', value: 0 }, { label: '🫴 건네고 완료하기', primary: true, value: 1 }]); if (v) finish(i, s, title); return; }
      return vn(s.say.slice(-1), i, title, [goalRow(s, '진행 중'), hint(s)]); }
    // 이 동물 차례가 아닐 때: 지금 할 일을 알려 준다
    const who = q.on ? s.to : s.who;
    return vn([`{think}지금은 부탁할 게 없어. ${d.names[who]}에게 가 봐!`], i, '🔍 수사 중', [h('div', { class: 'qw-goal' }, h('b', null, '지금'), h('span', null, `${ch.t} · ${q.on ? goalText(s) : `${d.names[s.who]}에게 이야기 듣기`}`))]); }
  const hint = s => s.type === 'pirate' ? h('p', { class: 'dim' }, triesLeft() > 0 ? `친목회 바다에서 가방의 "내 보트"(빌린 흰 배)를 타고 중급 바다로 나가면 해적단이 나타나요. 오늘 남은 기회 ${triesLeft()}번.` : '오늘 기회를 다 썼어요. 배와 대포는 돌려줬어요. 내일 다시 도전해요.') : s.type === 'cook' ? h('p', { class: 'dim' }, '카피백반 첫 화면의 "🔍 퀘스트 요리"에서 만들 수 있어요. 임대료는 안 내도 돼요.') : s.type === 'crop' ? h('p', { class: 'dim' }, '작물은 카피 농장에서 길러요.') : s.type === 'fish' ? h('p', { class: 'dim' }, '물고기는 바다 낚시로 잡아요.') : s.type === 'gift' ? h('p', { class: 'dim' }, '선물은 카피수퍼에서 사요.') : null;
  const clueBox = () => { const L = (q.clues || []); return L.length ? h('div', { class: 'qw-clue' }, h('b', null, '🔎 수사 수첩'), ...L.map(t => h('small', null, '· ' + t))) : null; };
  function accept(s) { save({ on: 1, ok: 0 }); sfx('point'); toast(s.type === 'pirate' ? `⛵ 흰 배와 대포(포탄 20발)를 빌렸어요! 퀘스트 동안만 쓸 수 있어요` : `🔍 수사 시작 · ${goalText(s)}`, 3200); }
  async function finish(i, s, title) {
    if (s.type !== 'talk' && s.type !== 'accuse' && !have(s)) return toast('아직 목표를 다 채우지 못했어요');
    if (s.type === 'fish') { const L = d.fish().filter(([, , f]) => f && (f.z || 1) >= s.need.z).sort((a, b) => (a[1].p || 0) - (b[1].p || 0)); d.useFish(L[0][0]); }
    if (s.type === 'crop') { let left = s.need.n; const use = {}; Object.entries(d.barn() || {}).filter(([k, c]) => k.split('|')[0] === s.need.id && c > 0).sort(([a], [b]) => 'FCBAS'.indexOf(a.split('|')[1]) - 'FCBAS'.indexOf(b.split('|')[1])).forEach(([k, c]) => { const t = Math.min(c, left); if (t > 0) { use[k] = t; left -= t; } }); await d.useCrops(use); }
    if (s.type === 'gift') { const b = d.bag(), k = s.need.k === 'any' ? ['candy', 'flower', 'cake'].find(x => b[x] > 0) : s.need.k; await d.saveBag({ [k]: b[k] - 1 }); }
    const [c, a] = rewardOf(s), bonus = s.end && !s.final ? END_BONUS : 0; d.coins(c + bonus);
    if (s.final) { d.names.forEach((_, k) => { if (k !== 10) d.affinity(k, a); }); d.affinity(10, Math.max(0, 100 - d.A(10))); await d.saveBag({ scooter: 1 }); } else { d.affinity(i, a); if (s.who !== i) d.affinity(s.who, 2); }
    const clues = s.clue ? [...(q.clues || []), s.clue] : q.clues || [];
    await save({ s: (q.s || 0) + 1, on: 0, ok: 0, clues, day: ymd(), dn: doneToday() + 1 }); sfx(s.end ? 'bigfish' : 'coin');
    const next = FLAT[(q.s || 0)], nextT = next && capped() ? `오늘 ${DAY_MAX}단계를 모두 했어요. 내일 ${d.names[next.who]}에게서 이어져요!` : next ? (next.ci !== s.ci ? `다음: ${STORY[next.ci].t} — ${d.names[next.who]}에게 가 보세요` : `다음: ${d.names[next.who]}에게 가 보세요`) : '메인 이야기 끝! 👑';
    await vn(s.done, i, title + (s.end ? ' · 장 완료!' : ' · 완료'), [s.clue && h('p', { class: 'qw-new' }, `🔎 수첩에 적었어요: ${s.clue}`)], [{ label: '🏅 보상 받기', primary: true, value: 1 }]);
    // 보상 알림 창: (보상 내용)을 받았습니다
    const items = s.final ? [['🛴', '황금 퀵보드 (전설의 황금사자 스쿠터)', '가방에서 타기 · 육지와 농장에서 빠르게 달려요'], ['🪙', `${(c + bonus).toLocaleString('ko-KR')}코인`, ''], ['🦁', '사자 친밀도 100', '단짝이 됐어요!'], ['💗', `다른 동물 친밀도 +${a}`, '']]
      : [['🪙', `${(c + bonus).toLocaleString('ko-KR')}코인`, bonus ? `(장 보너스 ${bonus} 포함)` : ''], ['💗', `${d.names[i]} 친밀도 +${a}`, ''], ...(s.who !== i ? [['💗', `${d.names[s.who]} 친밀도 +2`, '']] : [])];
    if (s.final) return finale(items, nextT);
    sfx('coin'); modal({ title: s.final ? '🏆 전설의 보상!' : s.end ? '📁 장 완료! 수사 보상' : '🏅 수사 보상', body: [s.final && h('img', { class: 'rw-sc', src: 'img/scooter-b.webp', alt: '황금사자 스쿠터' }), h('div', { class: 'rw-pop' }, ...items.map(([ic, t, sub]) => h('div', { class: 'rw-it' }, h('span', null, ic), h('b', null, t), sub && h('small', null, sub)))),
      h('p', { class: 'center rw-msg' }, `${items.map(x => x[1]).join(', ')}을(를) 받았습니다.`), h('p', { class: 'center dim' }, nextT)], actions: [{ label: '확인', primary: true }] }); }
  // 메인 이야기 끝: 폭죽·꽃가루와 함께 마을 주민들의 감사 인사 + 최종 보상
  function finale(items, nextT) { sfx('bigfish'); const fx = h('div', { class: 'qf-fx' }), E = ['🎉', '✨', '🌸', '⭐', '🎊', '💛', '🌼'];
    for (let k = 0; k < 46; k++) fx.append(h('i', { style: { left: Math.random() * 100 + '%', animationDelay: (Math.random() * 2.6).toFixed(2) + 's', animationDuration: (2.6 + Math.random() * 2.2).toFixed(2) + 's', fontSize: 16 + Math.random() * 18 + 'px' } }, E[k % E.length]));
    for (let k = 0; k < 7; k++) fx.append(h('b', { style: { left: 8 + Math.random() * 84 + '%', top: 6 + Math.random() * 46 + '%', animationDelay: (k * 0.45).toFixed(2) + 's', color: ['#FF4D6D', '#FFD23F', '#4DD0FF', '#8CE06B', '#C79BFF'][k % 5] } }));
    document.body.append(fx); const t1 = setInterval(() => sfx('coin'), 900), end = () => { clearInterval(t1); fx.remove(); }; setTimeout(() => clearInterval(t1), 3700);
    modal({ title: '🎉 사건 해결! 전설의 보상', onClose: end, body: [h('div', { class: 'qf-top' }, h('img', { class: 'rw-sc', src: 'img/scooter-b.webp', alt: '황금 퀵보드' })),
      h('p', { class: 'center qf-msg' }, '마을 주민들이 소란을 잠재워 줘서 고맙대요!', h('br'), h('b', null, '황금 퀵보드를 선물로 드려요!')),
      h('div', { class: 'rw-pop' }, ...items.map(([ic, t, sub], k) => h('div', { class: 'rw-it', style: { animationDelay: 0.5 + k * 0.22 + 's' } }, h('span', null, ic), h('div', null, h('b', null, t), sub && h('small', null, sub))))),
      h('p', { class: 'center qf-how' }, '🎒 황금 스쿠터는 가방에서 꺼내 탈 수 있어요!'), h('p', { class: 'center dim' }, nextT)], actions: [{ label: '고마워요!', primary: true }] }); }
  async function accuse(i, s, title) {
    const c = await vn(s.say, i, title, [clueBox()], s.need.opts.map(([nm], k) => ({ label: `☝️ ${nm}`, value: k + 1 }))); if (!c) return;
    const [, ok, why] = s.need.opts[c - 1]; if (ok) { await save({ on: 1 }); return finish(i, s, title); }
    sfx('bad'); const again = await vn([why], i, title, [], [{ label: '다시 고르기', primary: true, value: 1 }]); if (again) accuse(i, s, title); }
  // 카피백반과 이어지는 부분
  const cooks = () => { const s = cur(); return s && q.on && s.type === 'cook' && !q.ok ? [{ q: q.s || 0, i: s.to, rec: s.need.rec }] : []; };
  const cooked = k => { if ((q.s || 0) === k) return save({ ok: 1 }); };
  // 지금 이야기에 맞는 일상 대화 하나
  const stage = () => { const c = cur(); return c ? c.ci : STORY.length; };
  const chatter = () => { const [a, b] = CHAT_AT[Math.min(stage(), CHAT_AT.length - 1)]; return CHATTER.slice(a, b); };
  const gossip = () => GOSSIP[Math.min(stage(), GOSSIP.length - 1)];
  const fresh = () => ready && !(q.s || 0) && !q.on;
  // 퀘스트 현황(친목회 위쪽 버튼): 전체 진행, 장 목록, 지금 해야 할 일, 수사 수첩
  function status() { const s = cur(), n = q.s || 0, total = FLAT.length, pct = Math.round(n / total * 100);
    const chap = STORY.map((c, ci) => { const first = FLAT.findIndex(f => f.ci === ci), cnt = c.steps.length, doneN = Math.max(0, Math.min(cnt, n - first)), st = doneN >= cnt ? 'done' : s && s.ci === ci ? 'now' : 'lock';
      return h('div', { class: 'qs-ch ' + st }, h('b', null, st === 'done' ? '✔' : st === 'now' ? '🔍' : '🔒'), h('span', null, c.t), h('small', null, `${doneN}/${cnt}`)); });
    const todo = !s ? h('p', { class: 'qs-todo done' }, '👑 사건 해결! 메인 이야기를 모두 마쳤어요.')
      : h('div', { class: 'qs-todo' }, h('small', null, `${STORY[s.ci].t} · ${s.si + 1}번째 단계`),
        q.on ? [h('b', null, goalText(s)), h('em', { class: have(s) || s.type === 'talk' || s.type === 'accuse' ? 'ok' : '' }, s.type === 'talk' || s.type === 'accuse' ? `${d.names[s.to]}에게 가면 돼요 (머리 위 ? 표시)` : have(s) ? `✔ 준비 완료! ${d.names[s.to]}에게 가져가세요 (머리 위 ? 표시)` : `진행 중 · 다 모으면 ${d.names[s.to]}에게 가져가요`), s.type === 'pirate' && hint(s)]
          : capped() ? h('b', null, `🌙 오늘 ${DAY_MAX}단계를 모두 했어요. 내일 ${d.names[s.who]}에게서 이어져요.`) : h('b', null, `❗ ${d.names[s.who]}에게 가서 이야기를 들어요 (머리 위 ! 표시)`),
        (() => { const [c, a] = rewardOf(s); return h('small', { class: 'qs-rw' }, `🏅 보상: 🪙 ${c}코인 · 💗 ${s.final ? `모든 동물 +${a}` : `친밀도 +${a}`}`); })());
    modal({ title: '🔍 퀘스트 현황', body: [h('div', { class: 'qs' }, h('p', { class: 'qs-name' }, '메인 이야기 「누가 왕관을 훔쳤나」'),
      h('div', { class: 'qs-bar' }, h('i', null, h('u', { style: { width: pct + '%' } })), h('small', null, `${n} / ${total}단계 · ${pct}%`)), h('small', { class: 'dim center' }, `오늘 ${doneToday()}단계 진행 · 하루 제한 없이 계속할 수 있어요`), palLine(total),
      h('b', { class: 'qs-h' }, '📌 지금 할 일'), todo, clueBox(), h('b', { class: 'qs-h' }, '📁 사건 파일'), h('div', { class: 'qs-chs' }, ...chap))], actions: [{ label: '닫기', primary: true }] }); }
  // 위쪽 '퀘스트' 버튼에 보여 줄 진행도. mark: ! 새 이야기를 들을 차례 · ? 가져갈 준비 완료 · … 진행 중 · ✔ 모두 끝
  const progress = () => { const n = q.s || 0, total = FLAT.length, s = cur(); return { n, total, pct: Math.round(n / total * 100), mark: !ready ? '' : !s ? '✔' : markOf(q.on ? s.to : s.who) }; };
  // 시험판(?questtest): 처음부터 끝까지 눌러만 가며 본다. 조건(낚시·작물·요리·선물·해적)은 바로 통과하고 아무것도 저장하지 않는다
  const NEED_T = { cucumber: '오이', potato: '감자', carrot: '당근', mattang: '고구마 맛탕', gaji: '가지 대파볶음', maeun: '매운탕', hobak: '단호박 생선찜', jjin: '감자옥수수찜' };
  const needText = s => s.type === 'fish' ? '물고기 1마리' : s.type === 'crop' ? `${NEED_T[s.need.id] || s.need.id} ${s.need.n}개` : s.type === 'cook' ? `${NEED_T[s.need.rec] || s.need.rec} 요리` : s.type === 'gift' ? (s.need.k === 'flower' ? '꽃다발 선물' : '아무 선물 1개') : s.type === 'pirate' ? '갈매기 해적단 물리치기' : '';
  const bgOf = (n, part) => (n === 23 || (n === 22 && part === 'done') || (n === 24 && part === 'say') ? 'cave' : n === FLAT.length - 1 && part === 'done' ? 'plaza-happy' : n >= 31 || (n === 30 && part === 'done') ? 'plaza' : ''); // 광장: 처음엔 걱정하는 모습, 사건이 풀리면 다 같이 웃는 모습
  async function demo(from) { const total = FLAT.length; toast('🧪 퀘스트 시험판 · 화면을 누르면 다음으로 넘어가요 (저장 안 됨)', 3200);
    try { for (let n = Math.max(0, from || 0); n < total; n++) { const s = FLAT[n], title = `${STORY[s.ci].t} · ${n + 1}/${total}단계`; sceneBg = bgOf(n, 'say');
        if (s.type === 'accuse') { for (;;) { const c = await vn(s.say, s.who, title, [], s.need.opts.map(([nm], k) => ({ label: `☝️ ${nm}`, value: k + 1 }))); if (!c) return; const [, good, why] = s.need.opts[c - 1]; if (good) break; if (!(await vn([why], s.who, title, [], [{ label: '다시 고르기', primary: true, value: 1 }]))) return; } }
        else { const nt = needText(s); if (!(await vn(s.say, s.who, title, nt ? [h('p', { class: 'vn-sub' }, `조건: ${nt} · 시험판에서는 바로 통과`)] : []))) return; }
        sceneBg = bgOf(n, 'done'); if (!(await vn(s.done, s.to, title + ' ✔', s.clue ? [h('p', { class: 'vn-sub' }, `📝 단서: ${s.clue}`)] : []))) return; }
      { const L = FLAT[total - 1], [c, a2] = rewardOf(L); finale([['🛴', '황금 퀵보드 (전설의 황금사자 스쿠터)', '가방에서 타기 · 육지와 농장에서 빠르게 달려요'], ['🪙', `${c.toLocaleString('ko-KR')}코인`, ''], ['🦁', '사자 친밀도 100', '단짝이 됐어요!'], ['💗', `다른 동물 친밀도 +${a2}`, '']], '🧪 시험판이라 실제로 지급되지는 않아요'); } } finally { sceneBg = ''; } }
  return { demo, open, status, progress, markOf, cooks, cooked, chatter, gossip, fresh, pirateOn, pirateResult, dispose: () => off && off() };
}
