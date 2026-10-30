// Python 3챕터 — 함수·객체 법정 원고
// 빌드: node tools/build-packs.js → packs/python-functions.json
// 실행 결과 증거(run)는 tools/verify-run.js가 Python으로 실제로 돌려서 확인한다.
// 예외 메시지는 Python 버전마다 달라서, 예외는 이름만 찍는다.
// 힌트: 챕터 3이라 조합 안내는 목표만, 추궁 대사는 짧은 의심만 남긴다.
const { ev, pyEv, spec, COMMON } = require("./_helpers");

module.exports = {
  format: "code-court/v1",
  id: "python-functions",
  title: "Python 함수·객체 법정",
  language: "Python",
  blurb: "가변 기본 인자, 늦게 묶이는 클로저, 클래스 변수, __eq__와 dataclass. 언제 만들어지고 누구 것인지 헷갈리는 코드를 반박해요.",
  lead: "Python 3챕터는 함수와 객체예요. 이번 함정은 ‘그 값이 언제 만들어지고, 누구의 것인가’에서 나옵니다. 조합할 증거는 이제 직접 찾아야 해요. 실행 결과는 모두 Python 3.14로 실제로 돌린 값이에요.",
  commonCharacters: COMMON,
  cases: [
    /* ---------------- 1화 ---------------- */
    {
      id: "c1", ep: "1화 · 기본 인자", title: "남의 장바구니가 담긴 사건",
      blurb: "처음 온 손님의 장바구니에 앞 손님의 김밥이 들어 있다.",
      characters: { mall: ["🛍️", "쇼핑몰 (원고)"] },
      evidence: {
        code: ev("📄", "코드", "장바구니 코드", "상품을 담는 함수. 장바구니를 안 주면 새 장바구니로 시작하려던 코드.", `def add(item, cart=[]):
    cart.append(item)
    return cart`),
        run_test: pyEv("단정해의 테스트", "장바구니를 직접 넘겨 담아 본 결과.", `def add(item, cart=[]):
    cart.append(item)
    return cart

print(add("김밥", ["라면"]))`, "['라면', '김밥']"),
        run_two: pyEv("손님 두 명", "장바구니 없이 두 번 불러 본 결과.", `def add(item, cart=[]):
    cart.append(item)
    return cart

print(add("김밥"))
print(add("라면"))`, "['김밥']\n['김밥', '라면']"),
        spec_def: spec("기본 인자가 만들어지는 때", "Python 언어 레퍼런스(함수 정의)의 요약.", `기본 인자 값은 호출할 때가 아니라 def 문이 실행될 때 딱 한 번 만들어진다.
그 객체는 함수에 붙어 있고(함수.__defaults__), 호출마다 같은 객체를 쓴다.
리스트나 딕셔너리처럼 바꿀 수 있는 값을 기본값으로 두면 호출 사이에 변경이 남는다.
관용구: 기본값을 None으로 두고 함수 안에서 새로 만든다.`),
        run_defaults: pyEv("함수에 붙은 기본값", "두 번 부른 뒤 함수의 __defaults__를 찍어 본 결과.", `def add(item, cart=[]):
    cart.append(item)
    return cart

add("김밥")
add("라면")
print(add.__defaults__)`, "(['김밥', '라면'],)"),
        run_dc: pyEv("dataclass의 기본값", "dataclass에 items: list = []를 적어 본 결과.", `from dataclasses import dataclass

try:
    @dataclass
    class Cart:
        items: list = []
except Exception as e:
    print(type(e).__name__)`, "ValueError"),
        run_fix: pyEv("고친 결과", "None을 기본값으로 두고 함수 안에서 새로 만든 결과.", `def add(item, cart=None):
    if cart is None:
        cart = []
    cart.append(item)
    return cart

print(add("김밥"))
print(add("라면"))`, "['김밥']\n['라면']"),
        once: ev("📌", "추리", "def 때 한 번 만들어진 리스트", "조합 결과: cart=[]의 []는 호출할 때마다 생기지 않는다. def가 실행될 때 한 번 만들어져 함수에 붙어 있고, 호출마다 그 리스트를 함께 쓴다.\n장바구니를 직접 넘긴 단정해의 테스트는 기본값을 한 번도 쓰지 않아서 통과했다.", `def add(item, cart=[]) → [] 한 번 생성, 함수에 붙음
add("김밥") → 그 리스트에 담김
add("라면") → 같은 리스트에 또 담김`)
      },
      script: [
        { say: "judge", t: "‘남의 장바구니가 담긴 사건’의 재판을 시작합니다." },
        { say: "mall", t: "처음 온 손님 장바구니에 <b>앞 손님이 담은 김밥</b>이 들어 있어요. 손님이 늘수록 장바구니가 길어져요!" },
        { say: "wit", t: "장바구니를 안 주면 기본값 []로 시작해요. 빈 리스트로 시작하는데 뭐가 문제죠?" },
        { gain: ["code", "run_test", "run_two", "spec_def", "run_defaults", "run_dc"], t: "법정 기록에 증거 6개가 들어왔다." },
        { cross: "c1a", title: "증언 ① 부를 때마다 새로 시작한다", who: "wit",
          lines: [
            { t: "cart=[]라고 썼으니, 부를 때마다 새 빈 리스트로 시작해요. 손님끼리 섞일 수가 없어요.",
              press: [["wit", "기본값이 빈 리스트잖아요."], ["me", "(언제 만들어질까?)"]] },
            { t: "제 테스트에서 ['라면', '김밥']으로 잘 담겼어요.",
              press: [["wit", "순서까지 맞았어요."], ["me", "(그 테스트는 무엇을 넘겼지?)"]] },
            { t: "장바구니가 섞인 건 브라우저 쿠키 문제예요.",
              press: [["wit", "쿠키가 늘 말썽이죠."], ["me", "(쿠키 탓은 나중에.)"]] }
          ],
          answer: { line: 0, ev: "run_two" },
          alt: { line: 0, ev: "spec_def", say: [["me", "기본값은 def 때 한 번만 만들어져요."], ["wit", "빈 리스트로 시작한다니까요!"], ["me", "(두 번 불러 본 결과를 보여 주자.)"]] },
          hint: "장바구니 없이 두 번 불러 본 결과가 있다.",
          win: [
            ["me", "장바구니 없이 두 번 부르면 두 번째가 <b>['김밥', '라면']</b>이에요. 앞 손님 김밥이 남아 있어요."],
            ["witSweat", "네?! 기본값이 []인데 어떻게 김밥이 있어요?!"],
            ["judge", "변호인, 김밥이 남은 이유를 밝혀 보세요."]
          ] },
        { combine: ["run_defaults", "spec_def"], result: "once",
          t: "빈 리스트로 시작한다던 장바구니에 김밥이 남았다. 왜일까?\n이유를 밝혀 줄 증거 두 개를 골라 조합해 보자.",
          wrong: "그 둘로는 이유가 안 나온다. 기본값이 어디에 붙어 있는지부터 생각해 보자.",
          got: "[]는 <b>def 때 한 번</b>, 호출마다 <b>같은 리스트</b>…!\n새 증거 <b>📌 def 때 한 번 만들어진 리스트</b>를 얻었다." },
        { cross: "c1b", title: "증언 ② 클래스로 하면 괜찮다", who: "witSweat",
          lines: [
            { t: "함수 기본값이 문제라면 클래스로 옮기면 되죠.",
              press: [["wit", "객체지향이잖아요."], ["me", "(옮기는 건 좋다.)"]] },
            { t: "손님마다 객체를 따로 만들 거예요.",
              press: [["wit", "Cart()를 부르면 되니까요."], ["me", "(그건 맞다.)"]] },
            { t: "@dataclass에 items: list = []로 적으면 손님마다 빈 리스트가 생겨요.",
              press: [["wit", "자바의 필드 초기화처럼요."], ["me", "(정말 그렇게 될까?)"]] }
          ],
          answer: { line: 2, ev: "run_dc" },
          alt: { line: 2, ev: "once", say: [["me", "클래스 본문의 기본값도 한 번만 만들어져요."], ["witSweat", "dataclass는 알아서 해 주겠죠!"], ["me", "(실제로 적어 본 결과를 보여 주자.)"]] },
          hint: "dataclass에 그대로 적어 본 결과가 있다.",
          win: [
            ["me", "그렇게 적으면 클래스를 만드는 순간 <b>ValueError</b>예요. dataclass는 이 함정을 알고 막아 줘요. 대신 <code>field(default_factory=list)</code>를 쓰라고 해요."],
            ["witSweat", "으아악─!!"]
          ] },
        { choice: "judge", t: "장바구니 함수는 어떻게 고쳐야 합니까?",
          options: [
            { t: "함수 끝에서 cart.clear()로 비우고 돌려준다", fb: "돌려준 장바구니까지 함께 비워진다. 같은 리스트니까." },
            { t: "기본값을 None으로 두고 함수 안에서 새로 만든다", ok: true },
            { t: "기본값을 cart=list()로 바꿔 호출을 분명히 한다", fb: "list()도 def 때 한 번만 실행된다. 똑같다." },
            { t: "기본값을 튜플 ()로 두고 append는 그대로 쓴다", fb: "튜플에는 append가 없다. AttributeError가 난다." }
          ],
          win: [
            ["judge", "기본값은 바꿀 수 없는 값으로."],
            ["me", "네. 고쳐 돌리면 <b>['김밥']</b>, <b>['라면']</b>으로 손님마다 따로예요."]
          ] },
        { gain: ["run_fix"], t: "고친 코드를 실제로 돌려 본 결과가 법정 기록에 들어왔다." },
        { verdict: true }
      ],
      verdict: {
        say: "본 법정은 장바구니가 섞인 원인이 <b>def 때 한 번 만들어진 기본 인자</b>라고 판단합니다. 쿠키는 무죄!",
        quote: "기본 인자는 호출할 때가 아니라 def가 실행될 때 한 번 만들어져 함수에 붙는다. 리스트 같은 바꿀 수 있는 값을 기본값으로 두면 호출 사이에 변경이 남는다. 기본값을 None으로 두고 함수 안에서 새로 만든다. dataclass는 field(default_factory=list)를 쓴다.",
        clues: [
          "기본 인자는 def 때 한 번 만들어진다",
          "<code>add.__defaults__</code>에 쌓인 값이 보인다",
          "직접 넘긴 테스트는 기본값을 안 써서 통과한다",
          "정답: <code>cart=None</code> + 함수 안에서 <code>[]</code>"
        ]
      }
    },

    /* ---------------- 2화 ---------------- */
    {
      id: "c2", ep: "2화 · 클로저", title: "모두 같은 번호를 부른 사건",
      blurb: "대기 호출 버튼 세 개가 전부 2번 손님만 부른다.",
      characters: { clinic: ["🏥", "병원 접수처 (원고)"] },
      evidence: {
        code: ev("📄", "코드", "호출 버튼 코드", "대기 번호마다 호출 함수를 만들고, 호출 횟수를 세는 부분.", `buttons = [lambda: f"{n}번 호출" for n in range(3)]

count = 0
def press():
    count += 1`),
        run_test: pyEv("단정해의 테스트", "버튼을 만들면서 바로 불러 본 결과.", `result = []
for n in range(3):
    button = lambda: f"{n}번 호출"
    result.append(button())
print(result)`, "['0번 호출', '1번 호출', '2번 호출']"),
        run_late: pyEv("다 만든 뒤 누른 결과", "버튼을 다 만든 뒤에 하나씩 불러 본 결과.", `buttons = [lambda: f"{n}번 호출" for n in range(3)]
print([b() for b in buttons])`, "['2번 호출', '2번 호출', '2번 호출']"),
        spec_scope: spec("클로저와 이름", "Python 언어 레퍼런스(이름과 바인딩)의 요약.", `클로저는 값이 아니라 바깥 변수(이름)를 기억한다. 값은 불릴 때 찾는다 (늦은 바인딩).
기본 인자는 def 때 계산되므로, lambda n=n: 처럼 쓰면 그때의 값을 붙들 수 있다.
함수 안에서 어떤 이름에 대입하면, 그 이름은 함수 전체에서 지역 변수가 된다.
바깥 변수를 바꾸려면 global이나 nonlocal을 쓴다.`),
        run_count: pyEv("press 실행 결과", "호출 횟수 함수를 불러 본 결과.", `count = 0
def press():
    count += 1

try:
    press()
except Exception as e:
    print(type(e).__name__)`, "UnboundLocalError"),
        run_fix: pyEv("고친 결과", "기본 인자로 값을 붙들고, 횟수는 nonlocal로 센 결과.", `buttons = [lambda n=n: f"{n}번 호출" for n in range(3)]
print([b() for b in buttons])

def make_counter():
    count = 0
    def press():
        nonlocal count
        count += 1
        return count
    return press

press = make_counter()
press()
print(press())`, "['0번 호출', '1번 호출', '2번 호출']\n2"),
        late: ev("📌", "추리", "값이 아니라 이름을 기억한다", "조합 결과: lambda는 만들 때의 n 값이 아니라 ‘n이라는 이름’을 기억한다. 불릴 때 n을 찾아보면 반복이 끝난 뒤의 2가 들어 있다.\n단정해의 테스트는 반복 도중에 바로 불렀기 때문에 그때의 n이 나왔다. 누르는 시점이 다르면 결과가 다르다.", `만들 때 → n이라는 이름을 기억
불릴 때 → n을 찾음 → 반복이 끝나서 2`)
      },
      script: [
        { say: "judge", t: "‘모두 같은 번호를 부른 사건’의 재판을 시작합니다." },
        { say: "clinic", t: "대기 호출 버튼이 세 개인데, 어느 걸 눌러도 <b>2번 손님</b>만 불러요. 0번, 1번 손님은 계속 기다렸어요!" },
        { say: "wit", t: "lambda로 번호마다 함수를 만들었어요. 만들 때 번호를 기억하니까 세 버튼은 다 달라요. 테스트도 했고요." },
        { gain: ["code", "run_test", "run_late", "spec_scope", "run_count"], t: "법정 기록에 증거 5개가 들어왔다." },
        { cross: "c2a", title: "증언 ① 만들 때 번호를 기억한다", who: "wit",
          lines: [
            { t: "대기 번호 0, 1, 2로 버튼 세 개를 만들어요.",
              press: [["wit", "한 줄로 깔끔하죠."], ["me", "(만드는 건 맞다.)"]] },
            { t: "lambda는 만들어질 때의 n 값을 기억하니까, 나중에 눌러도 자기 번호를 불러요.",
              press: [["wit", "Java 람다도 값을 잡잖아요."], ["me", "(정말 값을 잡을까?)"]] },
            { t: "제 테스트에선 0번, 1번, 2번이 차례로 나왔어요.",
              press: [["wit", "다 달랐어요."], ["me", "(언제 불렀더라.)"]] }
          ],
          answer: { line: 1, ev: "run_late" },
          alt: { line: 1, ev: "spec_scope", say: [["me", "클로저는 값이 아니라 이름을 기억해요."], ["wit", "테스트에선 달랐다니까요!"], ["me", "(다 만든 뒤 눌러 본 결과를 보여 주자.)"]] },
          hint: "버튼을 다 만든 뒤에 눌러 본 결과가 있다.",
          win: [
            ["me", "다 만든 뒤에 누르면 세 버튼 모두 <b>2번 호출</b>이에요. 접수처에서 일어난 그대로예요."],
            ["witSweat", "네?! 제 테스트에선 0, 1, 2였는데요?!"],
            ["judge", "변호인, 테스트와 실제가 다른 이유를 밝혀 보세요."]
          ] },
        { combine: ["run_test", "spec_scope"], result: "late",
          t: "테스트에선 0, 1, 2. 실제로는 2, 2, 2. 무엇이 달랐을까?\n이유를 밝혀 줄 증거 두 개를 골라 조합해 보자.",
          wrong: "그 둘로는 이유가 안 나온다. 테스트가 함수를 언제 불렀는지부터 보자.",
          got: "lambda는 <b>이름</b>을 기억하고, 값은 <b>불릴 때</b> 찾는다…!\n새 증거 <b>📌 값이 아니라 이름을 기억한다</b>를 얻었다." },
        { cross: "c2b", title: "증언 ② 바깥 변수를 올린다", who: "witSweat",
          lines: [
            { t: "함수는 바깥 변수를 볼 수 있으니까, press 안의 count += 1은 바깥 count를 올려요.",
              press: [["wit", "방금 이름을 기억한다면서요."], ["me", "(읽는 것과 대입은 같을까?)"]] },
            { t: "호출 횟수는 하루 통계에 써요.",
              press: [["wit", "몇 번 불렀는지 봐야죠."], ["me", "(그건 맞다.)"]] },
            { t: "통계가 안 나오는 건 집계 서버가 쉬는 날이라서예요.",
              press: [["wit", "주말이었거든요."], ["me", "(서버 탓은 나중에.)"]] }
          ],
          answer: { line: 0, ev: "run_count" },
          alt: { line: 0, ev: "spec_scope", say: [["me", "함수 안에서 대입하면 그 이름은 지역 변수가 돼요."], ["witSweat", "읽을 수 있는데 왜 못 올려요?!"], ["me", "(불러 본 결과를 보여 주자.)"]] },
          hint: "press를 불러 본 결과가 있다.",
          win: [
            ["me", "press를 부르면 <b>UnboundLocalError</b>예요. count += 1은 대입이라, count가 함수 전체에서 지역 변수가 됐어요. 그런데 읽을 값이 없죠."],
            ["witSweat", "으아악─!!"]
          ] },
        { choice: "judge", t: "어떻게 고쳐야 합니까?",
          options: [
            { t: "lambda n=n:으로 값을 붙들고, 횟수는 nonlocal로 올린다", ok: true },
            { t: "range(3)을 range(2)로 바꾸고 번호를 하나씩 더해 맞춘다", fb: "모두 1번을 부르게 될 뿐이다." },
            { t: "버튼을 튜플에 담아 값이 바뀌지 않게 막아 둔다", fb: "담는 그릇을 바꿔도 lambda가 찾는 이름은 같다." },
            { t: "press 안에서 count = 0으로 먼저 초기화하고 나서 더한다", fb: "부를 때마다 0으로 돌아가서 횟수를 셀 수 없다." }
          ],
          win: [
            ["judge", "값이 필요하면 만들 때 붙들어라."],
            ["me", "네. 고쳐 돌리면 <b>0번, 1번, 2번 호출</b>이고, 횟수는 2까지 잘 올라가요."]
          ] },
        { gain: ["run_fix"], t: "고친 코드를 실제로 돌려 본 결과가 법정 기록에 들어왔다." },
        { verdict: true }
      ],
      verdict: {
        say: "본 법정은 2번만 불린 원인이 <b>이름을 기억하는 클로저</b>이고, 횟수가 멈춘 원인이 <b>대입으로 생긴 지역 변수</b>라고 판단합니다. 0번, 1번 손님은 지금 들어오세요!",
        quote: "클로저는 값이 아니라 바깥 변수의 이름을 기억하고, 값은 불릴 때 찾는다. 그래서 반복문에서 만든 lambda는 모두 마지막 값을 본다. 만들 때의 값이 필요하면 lambda n=n:으로 붙든다. 함수 안에서 대입한 이름은 지역 변수가 되므로, 바깥 변수를 바꾸려면 nonlocal이나 global을 쓴다.",
        clues: [
          "클로저는 이름을 기억한다 (늦은 바인딩)",
          "반복 도중 바로 부르는 테스트는 통과한다",
          "함수 안 대입 → 지역 변수 → UnboundLocalError",
          "정답: <code>lambda n=n:</code>, <code>nonlocal</code>"
        ]
      }
    },

    /* ---------------- 3화 ---------------- */
    {
      id: "c3", ep: "3화 · 클래스 변수", title: "모두의 장바구니 사건",
      blurb: "민지가 담은 상품이 철수 장바구니에도 보인다. 그런데 쿠폰 수는 또 따로 논다.",
      characters: { mall: ["🛒", "마트 앱 (원고)"] },
      evidence: {
        code: ev("📄", "코드", "장바구니 클래스", "Java 클래스를 옮긴 코드. 필드를 클래스 맨 위에 적었다.", `class Cart:
    items = []       # 담은 상품
    coupons = 0      # 쿠폰 수

    def add(self, item):
        self.items.append(item)`),
        run_test: pyEv("단정해의 테스트", "장바구니 하나로 담아 본 결과.", `class Cart:
    items = []
    def add(self, item):
        self.items.append(item)

a = Cart()
a.add("김밥")
print(a.items)`, "['김밥']"),
        spec_class: spec("클래스 변수와 인스턴스 변수", "Python 튜토리얼(클래스)의 요약.", `클래스 본문에 쓴 변수는 클래스에 하나만 있고, 모든 인스턴스가 함께 본다.
self.x를 읽을 때는 인스턴스를 먼저 보고, 없으면 클래스를 본다.
self.x = 값 처럼 대입하면 그 인스턴스에 새 변수가 생겨 클래스 변수를 가린다.
self.items.append(…)는 대입이 아니라 찾은 객체를 고치는 것이다.
인스턴스마다 필요한 값은 __init__에서 self에 만든다.`),
        run_shared: pyEv("두 장바구니", "민지와 철수의 장바구니를 만들고 민지만 담아 본 결과.", `class Cart:
    items = []
    def add(self, item):
        self.items.append(item)

minji = Cart()
chulsoo = Cart()
minji.add("김밥")
print(chulsoo.items)`, "['김밥']"),
        run_assign: pyEv("쿠폰 대입", "민지의 쿠폰에 5를 대입하고 철수와 클래스, 각자의 __dict__를 찍어 본 결과.", `class Cart:
    coupons = 0

minji = Cart()
chulsoo = Cart()
minji.coupons = 5
print(chulsoo.coupons, Cart.coupons)
print(minji.__dict__, chulsoo.__dict__)`, "0 0\n{'coupons': 5} {}"),
        run_fix: pyEv("__init__으로 고친 결과", "__init__에서 self에 만들고 같은 코드를 돌린 결과.", `class Cart:
    def __init__(self):
        self.items = []
        self.coupons = 0
    def add(self, item):
        self.items.append(item)

minji = Cart()
chulsoo = Cart()
minji.add("김밥")
print(minji.items, chulsoo.items)`, "['김밥'] []"),
        shared: ev("📌", "추리", "클래스에 하나뿐인 리스트", "조합 결과: 클래스 본문의 items는 Java의 인스턴스 필드가 아니라 static 필드에 가깝다. 모든 Cart가 하나의 리스트를 본다.\nself.items.append는 대입이 아니라서 인스턴스에 새 변수를 만들지 않고, 클래스의 리스트를 바로 고친다. 장바구니 하나로 한 테스트에서는 함께 쓰는 상대가 없었다.", `class Cart: items = []  → Cart.items 하나
minji.add / chulsoo.add → 같은 리스트`)
      },
      script: [
        { say: "judge", t: "‘모두의 장바구니 사건’의 재판을 시작합니다." },
        { say: "mall", t: "민지 님이 담은 김밥이 <b>철수 님 장바구니</b>에도 보여요. 이상한 건 쿠폰은 또 멀쩡히 따로 논다는 거예요!" },
        { say: "wit", t: "필드를 Java처럼 클래스 맨 위에 적었어요. 객체를 따로 만들었으니 장바구니도 따로죠." },
        { gain: ["code", "run_test", "spec_class", "run_shared", "run_assign"], t: "법정 기록에 증거 5개가 들어왔다." },
        { cross: "c3a", title: "증언 ① 객체마다 따로 있다", who: "wit",
          lines: [
            { t: "장바구니는 손님마다 Cart()로 새로 만들어요.",
              press: [["wit", "객체가 다르잖아요."], ["me", "(객체는 다르다.)"]] },
            { t: "장바구니 하나로 테스트했더니 김밥이 잘 담겼어요.",
              press: [["wit", "['김밥']이요."], ["me", "(하나였다.)"]] },
            { t: "items를 클래스에 적었으니, Java 필드처럼 객체마다 자기 리스트를 가져요.",
              press: [["wit", "필드는 원래 그렇잖아요."], ["me", "(정말 객체마다일까?)"]] }
          ],
          answer: { line: 2, ev: "run_shared" },
          alt: { line: 2, ev: "spec_class", say: [["me", "클래스 본문의 변수는 클래스에 하나만 있어요."], ["wit", "Java에선 객체마다였다니까요!"], ["me", "(두 장바구니로 돌린 결과를 보여 주자.)"]] },
          hint: "두 손님의 장바구니로 돌려 본 결과가 있다.",
          win: [
            ["me", "민지만 담았는데 철수의 items가 <b>['김밥']</b>이에요. 두 장바구니가 같은 리스트를 보고 있어요."],
            ["witSweat", "네?! 객체가 다른데요? 그럼 쿠폰은 왜 따로 놀아요?!"],
            ["judge", "변호인, 이 리스트가 누구 것인지 밝혀 보세요."]
          ] },
        { combine: ["run_shared", "spec_class"], result: "shared",
          t: "객체는 둘인데 리스트는 하나였다. 어떻게 된 걸까?\n이유를 밝혀 줄 증거 두 개를 골라 조합해 보자.",
          wrong: "그 둘로는 이유가 안 나온다. 민지만 담은 결과에서 출발해 보자.",
          got: "items는 <b>클래스에 하나뿐</b>, append는 <b>그 리스트를 고친다</b>…!\n새 증거 <b>📌 클래스에 하나뿐인 리스트</b>를 얻었다." },
        { cross: "c3b", title: "증언 ② 쿠폰도 같이 바뀐다", who: "witSweat",
          lines: [
            { t: "리스트가 공유된다면 쿠폰도 공유되겠네요.",
              press: [["wit", "같은 클래스 변수니까요."], ["me", "(같은 클래스 변수는 맞다.)"]] },
            { t: "그러니 민지의 coupons에 5를 넣으면 철수도, 클래스도 5가 돼요.",
              press: [["wit", "한 변수니까 다 바뀌겠죠."], ["me", "(대입과 append는 같을까?)"]] },
            { t: "결국 전부 고쳐야겠네요.",
              press: [["wit", "큰일이에요."], ["me", "(왜 다른지 알고 고치자.)"]] }
          ],
          answer: { line: 1, ev: "run_assign" },
          alt: { line: 1, ev: "shared", say: [["me", "append는 객체를 고치는 거고, 대입은 달라요."], ["witSweat", "같은 변수인데 뭐가 달라요!"], ["me", "(대입해 본 결과를 보여 주자.)"]] },
          hint: "쿠폰에 대입해 본 결과가 있다.",
          win: [
            ["me", "민지에게 5를 대입해도 철수는 0, 클래스도 0이에요. 민지의 <code>__dict__</code>에만 <b>{'coupons': 5}</b>가 생겼어요."],
            ["me", "대입은 인스턴스에 새 변수를 만들어 클래스 변수를 가려요. 그래서 쿠폰은 따로 노는 것처럼 보였어요. 원고가 이상하다고 한 이유예요."],
            ["witSweat", "으아악─!!"]
          ] },
        { choice: "judge", t: "장바구니 클래스는 어떻게 고쳐야 합니까?",
          options: [
            { t: "items를 클래스 맨 위에 둔 채 Cart.items로 부른다", fb: "이름만 분명해질 뿐 여전히 하나의 리스트다." },
            { t: "add 안에서 self.items = self.items + [item]로 바꾼다", fb: "손님마다 갈라지긴 하지만 첫 담기 전까지는 공유 값을 읽는 우연에 기댄다. 의도를 __init__에 쓰는 게 맞다." },
            { t: "__init__에서 self.items = []로 객체마다 만든다", ok: true },
            { t: "items를 튜플로 바꿔 append를 못 하게 막아 둔다", fb: "담기 기능이 사라진다." }
          ],
          win: [
            ["judge", "객체의 것은 __init__에서."],
            ["me", "네. 고쳐 돌리면 민지는 <b>['김밥']</b>, 철수는 <b>[]</b>예요."]
          ] },
        { gain: ["run_fix"], t: "__init__으로 고친 코드를 실제로 돌려 본 결과가 법정 기록에 들어왔다." },
        { verdict: true }
      ],
      verdict: {
        say: "본 법정은 장바구니가 공유된 원인이 <b>클래스 본문에 적은 리스트</b>라고 판단합니다. 쿠폰이 멀쩡해 보인 건 대입이 가렸기 때문입니다!",
        quote: "클래스 본문의 변수는 클래스에 하나만 있어서 모든 인스턴스가 함께 본다. Java의 인스턴스 필드가 아니라 static에 가깝다. self.items.append는 그 객체를 고치므로 공유되고, self.x = 값은 인스턴스에 새 변수를 만들어 가린다. 객체마다 필요한 값은 __init__에서 self에 만든다.",
        clues: [
          "클래스 본문의 변수는 클래스에 하나 (static에 가까움)",
          "<code>append</code>는 공유 객체를 고친다",
          "대입은 인스턴스에 새 변수를 만들어 가린다",
          "정답: <code>__init__</code>에서 <code>self.items = []</code>"
        ]
      }
    },

    /* ---------------- 4화 ---------------- */
    {
      id: "c4", ep: "4화 · __eq__와 dataclass", title: "딕셔너리에 못 들어간 좌표 사건",
      blurb: "같은 좌표인데 다르다고 하고, 고쳤더니 지도가 통째로 멈췄다.",
      characters: { map: ["🗺️", "지도앱 (원고)"] },
      evidence: {
        code: ev("📄", "코드", "좌표 코드", "좌표 클래스와, 좌표를 키로 가게를 찾는 부분.", `class Point:
    def __init__(self, x, y):
        self.x = x
        self.y = y

shops = {Point(3, 5): "분식집"}
shops[Point(3, 5)]    # 사용자가 (3, 5)를 누름`),
        run_test: pyEv("단정해의 테스트", "저장할 때 쓴 Point 객체를 그대로 다시 넣어 찾아 본 결과.", `class Point:
    def __init__(self, x, y):
        self.x = x
        self.y = y

p = Point(3, 5)
shops = {p: "분식집"}
print(shops[p])`, "분식집"),
        run_eq: pyEv("같은 좌표 비교", "좌표가 같은 Point 둘을 ==로 비교해 본 결과.", `class Point:
    def __init__(self, x, y):
        self.x = x
        self.y = y

print(Point(3, 5) == Point(3, 5))`, "False"),
        spec_hash: spec("__eq__와 __hash__", "Python 데이터 모델 문서의 요약.", `__eq__를 정의하지 않으면 == 는 같은 객체인지를 본다.
__eq__만 정의하면 Python이 __hash__를 None으로 만든다. 그 클래스는 딕셔너리 키나 set에 넣을 수 없다 (TypeError).
같다고 하는 두 객체의 해시가 달라지는 일을 미리 막는 것이다.
@dataclass(frozen=True)는 __eq__와 __hash__를 필드 기준으로 만들고, 값을 못 바꾸게 한다.`),
        run_key: pyEv("__eq__를 넣은 뒤", "__eq__만 정의하고 딕셔너리 키로 써 본 결과.", `class Point:
    def __init__(self, x, y):
        self.x = x
        self.y = y
    def __eq__(self, other):
        return self.x == other.x and self.y == other.y

print(Point(3, 5) == Point(3, 5))
print(Point.__hash__)
try:
    shops = {Point(3, 5): "분식집"}
except Exception as e:
    print(type(e).__name__)`, "True\nNone\nTypeError"),
        run_fix: pyEv("frozen dataclass로 고친 결과", "@dataclass(frozen=True)로 만들어 찾아 본 결과.", `from dataclasses import dataclass

@dataclass(frozen=True)
class Point:
    x: int
    y: int

shops = {Point(3, 5): "분식집"}
print(shops[Point(3, 5)])
print(Point(3, 5))`, "분식집\nPoint(x=3, y=5)"),
        loud: ev("📌", "추리", "일부러 막아 둔 해시", "조합 결과: __eq__를 정의하면 ‘같다’의 뜻이 바뀌었는데, 기본 해시는 여전히 객체마다 다르다. 그대로 두면 같은 좌표가 다른 칸으로 간다.\nJava는 이 경우 조용히 null을 주지만, Python은 __hash__를 None으로 만들어 처음부터 키로 못 쓰게 막는다. 시끄럽지만 더 안전한 실패다.", `__eq__ 정의 → __hash__ = None
→ 딕셔너리 키로 쓰면 바로 TypeError`)
      },
      script: [
        { say: "judge", t: "‘딕셔너리에 못 들어간 좌표 사건’의 재판을 시작합니다." },
        { say: "map", t: "지도에서 (3, 5)를 누르면 <b>가게가 없대요</b>. 고쳤다길래 켰더니 이번엔 지도가 <b>시작하자마자 멈춰요</b>!" },
        { say: "wit", t: "Java 사건에서 배웠어요. equals만 있으면 된다는 건 함정이고… 음, 일단 Python은 알아서 값으로 비교하지 않나요?" },
        { gain: ["code", "run_test", "run_eq", "spec_hash", "run_key"], t: "법정 기록에 증거 5개가 들어왔다." },
        { cross: "c4a", title: "증언 ① 값이 같으면 같다", who: "wit",
          lines: [
            { t: "좌표는 Point 클래스로 만들어요.",
              press: [["wit", "x, y 두 칸이요."], ["me", "(그건 맞다.)"]] },
            { t: "Python은 속성이 같으면 == 가 True예요. 그러니 Point(3, 5)끼리는 같은 좌표죠.",
              press: [["wit", "그래서 Python이 편한 거잖아요."], ["me", "(알아서 비교해 줄까?)"]] },
            { t: "제 테스트에서 분식집이 잘 찾아졌어요.",
              press: [["wit", "shops[p]로요."], ["me", "(그 p는 어떤 객체였지?)"]] }
          ],
          answer: { line: 1, ev: "run_eq" },
          alt: { line: 1, ev: "spec_hash", say: [["me", "__eq__를 정의하지 않으면 같은 객체인지만 봐요."], ["wit", "값이 같은데요!"], ["me", "(비교한 결과를 보여 주자.)"]] },
          hint: "좌표가 같은 Point 둘을 비교해 본 결과가 있다.",
          win: [
            ["me", "Point(3, 5) == Point(3, 5)는 <b>False</b>예요. __eq__가 없으면 같은 객체인지를 봐요. 테스트는 저장한 객체를 그대로 다시 넣어서 통과했고요."],
            ["witSweat", "크윽…! 그럼 __eq__만 넣으면 되죠!"],
            ["judge", "변호인, __eq__를 넣은 뒤 지도가 멈춘 이유를 밝혀 보세요."]
          ] },
        { combine: ["run_key", "spec_hash"], result: "loud",
          t: "__eq__를 넣었더니 지도가 멈췄다. 왜일까?\n이유를 밝혀 줄 증거 두 개를 골라 조합해 보자.",
          wrong: "그 둘로는 이유가 안 나온다. __eq__를 넣은 뒤의 실행 결과에서 출발해 보자.",
          got: "__eq__를 정의하면 <b>__hash__가 None</b>, Python이 일부러 막았다…!\n새 증거 <b>📌 일부러 막아 둔 해시</b>를 얻었다." },
        { cross: "c4b", title: "증언 ② __eq__면 키로도 된다", who: "witSweat",
          lines: [
            { t: "__eq__를 넣으니 Point끼리 비교는 True가 됐어요.",
              press: [["wit", "x, y로 비교해요."], ["me", "(그건 맞다.)"]] },
            { t: "시작하자마자 멈춘 건 지도 서버가 느려서예요.",
              press: [["wit", "지도 데이터가 많잖아요."], ["me", "(서버 탓은 나중에.)"]] },
            { t: "__eq__가 있으니 이제 Point를 딕셔너리 키로도 그대로 쓸 수 있어요.",
              press: [["wit", "같은지 알 수 있으니까요."], ["me", "(딕셔너리는 __eq__만 볼까?)"]] }
          ],
          answer: { line: 2, ev: "loud" },
          alt: { line: 2, ev: "run_key", say: [["me", "딕셔너리 키로 쓰면 TypeError가 나요."], ["witSweat", "같은지 아는데 왜 못 써요?!"], ["me", "(왜 막았는지 추리를 들이밀자.)"]] },
          hint: "__eq__를 정의하면 무슨 일이 생기는지 조합한 추리를 떠올려 보자.",
          win: [
            ["me", "__eq__를 정의하면 Python이 <b>__hash__를 None</b>으로 만들어요. 딕셔너리 키로 쓰는 순간 TypeError가 나고요. 앱이 시작하자마자 멈춘 이유예요."],
            ["me", "Java라면 조용히 null이었겠지만, Python은 처음부터 막아 줘요. 해시까지 함께 있어야 키가 돼요."],
            ["witSweat", "으아악─!!"]
          ] },
        { choice: "judge", t: "Point를 딕셔너리 키로 쓰려면 어떻게 해야 합니까?",
          options: [
            { t: "__eq__를 지우고 원래대로 객체 비교로 되돌린다", fb: "멈추지는 않지만 같은 좌표를 또 못 찾는다." },
            { t: "__hash__를 항상 1을 돌려주게 만든다", fb: "돌아가긴 하지만 모든 키가 한 칸에 몰려 느려진다." },
            { t: "@dataclass(frozen=True)로 만든다", ok: true },
            { t: "try-except로 TypeError를 잡고 가게 없음으로 처리한다", fb: "지도에 가게가 하나도 안 나온다." }
          ],
          win: [
            ["judge", "값으로 같고, 바뀌지 않는 객체."],
            ["me", "네. frozen dataclass는 __eq__와 __hash__를 함께 만들고 값도 못 바꿔요. 고쳐 돌리면 <b>분식집</b>이 찾아져요."]
          ] },
        { gain: ["run_fix"], t: "frozen dataclass로 고친 코드를 실제로 돌려 본 결과가 법정 기록에 들어왔다." },
        { verdict: true }
      ],
      verdict: {
        say: "본 법정은 가게를 못 찾은 원인이 <b>__eq__ 없는 Point</b>이고, 지도가 멈춘 원인이 <b>__hash__가 없어진 Point</b>라고 판단합니다. 지도 서버는 무죄!",
        quote: "__eq__를 정의하지 않으면 == 는 같은 객체인지를 본다. __eq__만 정의하면 Python이 __hash__를 None으로 만들어 딕셔너리 키나 set에 넣을 때 TypeError가 난다. Java의 조용한 null보다 시끄럽지만 안전한 실패다. 값 객체는 @dataclass(frozen=True)로 만든다.",
        clues: [
          "<code>__eq__</code>가 없으면 같은 객체 비교",
          "<code>__eq__</code>만 정의 → <code>__hash__ = None</code> → TypeError",
          "저장한 객체를 그대로 다시 넣는 테스트는 통과한다",
          "정답: <code>@dataclass(frozen=True)</code>"
        ]
      }
    },

    /* ---------------- 보스 ---------------- */
    {
      id: "cboss", ep: "보스 · 3챕터 총정리", title: "회원 시스템 대법정",
      blurb: "신규 회원 쿠폰이 섞이고, 알림은 마지막 회원에게만 가고, 가게 목록은 공유됐다.",
      boss: true, hard: true, trust: 3,
      characters: { lead: ["🧑‍💼", "서비스 기획자 (원고)"] },
      evidence: {
        code: ev("📄", "코드", "회원 시스템 코드", "회원 기능을 Java에서 옮겨 온 코드의 일부.", `# ① 가입 쿠폰
def join(name, coupons=[]):
    coupons.append("가입 축하")
    return coupons

# ② 회원별 알림 함수 만들기
notices = [lambda: f"{name}님 안녕하세요" for name in members]

# ③ 회원 클래스
class Member:
    favorites = []
    def like(self, shop):
        self.favorites.append(shop)`),
        run_join: pyEv("① 가입 쿠폰 실행 결과", "회원 둘을 차례로 가입시켜 본 결과.", `def join(name, coupons=[]):
    coupons.append("가입 축하")
    return coupons

join("민지")
print(join("철수"))`, "['가입 축하', '가입 축하']"),
        run_notice: pyEv("② 알림 실행 결과", "알림 함수를 다 만든 뒤 불러 본 결과.", `members = ["민지", "철수", "영희"]
notices = [lambda: f"{name}님 안녕하세요" for name in members]
print([n() for n in notices])`, "['영희님 안녕하세요', '영희님 안녕하세요', '영희님 안녕하세요']"),
        run_fav: pyEv("③ 즐겨찾기 실행 결과", "민지만 즐겨찾기를 누르고 철수를 찍어 본 결과.", `class Member:
    favorites = []
    def like(self, shop):
        self.favorites.append(shop)

minji = Member()
chulsoo = Member()
minji.like("분식집")
print(chulsoo.favorites)`, "['분식집']"),
        spec_three: spec("3챕터에서 본 규칙", "1~4화 판결 요약.", `기본 인자는 def 때 한 번 만들어진다. None으로 두고 안에서 새로 (1화)
클로저는 이름을 기억한다. 만들 때의 값은 lambda n=n: 으로 (2화)
클래스 본문의 변수는 하나뿐이다. 객체마다는 __init__에서 (3화)
__eq__만 정의하면 키로 못 쓴다. frozen dataclass (4화)`),
        run_fixed: pyEv("고친 코드 실행 결과", "판결에서 고른 방식으로 고쳐서 돌려 본 결과.", `def join(name, coupons=None):
    if coupons is None:
        coupons = []
    coupons.append("가입 축하")
    return coupons

join("민지")
print(join("철수"))
members = ["민지", "철수"]
notices = [lambda name=name: f"{name}님 안녕하세요" for name in members]
print([n() for n in notices])

class Member:
    def __init__(self):
        self.favorites = []
    def like(self, shop):
        self.favorites.append(shop)

minji = Member()
chulsoo = Member()
minji.like("분식집")
print(chulsoo.favorites)`, "['가입 축하']\n['민지님 안녕하세요', '철수님 안녕하세요']\n[]"),
        whenwho: ev("📌", "추리", "언제 만들어졌고 누구 것인가", "조합 결과: ①의 쿠폰 리스트는 def 때 한 번 만들어져 모두가 함께 썼고, ③의 즐겨찾기는 클래스에 하나뿐이라 모두가 함께 썼다.\n둘 다 ‘회원마다 하나씩’이라고 믿었지만 실제로는 한 객체를 공유했다. 값이 언제 만들어지고 누구의 것인지를 따져야 한다.", `① 기본 인자 → def 때 하나 → 모두가 공유
③ 클래스 변수 → 클래스에 하나 → 모두가 공유`)
      },
      script: [
        { say: "judge", t: "정숙! <b>회원 시스템 대법정</b>을 개정합니다. 신뢰도는 <b>3</b>, 첫 실수에는 힌트가 없습니다." },
        { say: "lead", t: "신규 회원에게 <b>쿠폰이 쌓여서</b> 나가고, 인사 알림은 <b>모두 영희 님 이름</b>이고, 즐겨찾기는 <b>남의 것까지</b> 보여요!" },
        { say: "wit", t: "회원 기능은 제가 리뷰했어요. 함수와 클래스로 깔끔하게 나눴고, 회원 한 명으로 테스트도 끝냈어요." },
        { gain: ["code", "run_join", "run_notice", "run_fav", "spec_three"], t: "법정 기록에 증거 5개가 들어왔다. 3챕터 1~3화를 떠올리며 골라야 한다." },
        { cross: "cb1", title: "증언 ① 쿠폰은 회원마다 새로", who: "wit",
          lines: [
            { t: "가입하면 쿠폰 목록을 빈 리스트로 시작해서 축하 쿠폰을 하나 줘요. 그러니 회원마다 쿠폰은 딱 하나예요.",
              press: [["wit", "coupons=[]니까요."], ["me", "(1화에서 무슨 일이 있었더라.)"]] },
            { t: "회원 한 명으로 테스트했을 땐 하나였어요.",
              press: [["wit", "['가입 축하']요."], ["me", "(한 명이었다.)"]] },
            { t: "쿠폰이 쌓인 건 마케팅팀이 또 보내서예요.",
              press: [["wit", "자주 보내잖아요."], ["me", "(마케팅 탓은 마지막에.)"]] }
          ],
          answer: { line: 0, ev: "run_join" },
          hint: "회원 둘을 가입시켜 본 결과가 있다. 1화를 떠올려 보자.",
          win: [
            ["me", "두 번째 회원의 쿠폰이 <b>['가입 축하', '가입 축하']</b>예요. 기본값 리스트는 def 때 하나뿐이니까요. 1화 그대로예요."],
            ["witSweat", "크윽…! 쿠폰은 그렇다 쳐도, 알림은 회원마다 함수를 따로 만들었어요!"],
            ["judge", "증인, 알림에 대해 증언하세요."]
          ] },
        { cross: "cb2", title: "증언 ② 회원마다 자기 이름", who: "witSweat",
          lines: [
            { t: "회원 목록을 돌면서 알림 함수를 하나씩 만들어요.",
              press: [["wit", "리스트 컴프리헨션이에요."], ["me", "(만드는 건 맞다.)"]] },
            { t: "알림은 밤 9시에 한꺼번에 보내요.",
              press: [["wit", "만들어 두고 나중에 부르죠."], ["me", "(나중에 부른다.)"]] },
            { t: "함수마다 만들 때의 name을 기억하니까, 민지 님은 민지 님 이름으로 받아요.",
              press: [["wit", "자기 이름인데 틀릴 리가요."], ["me", "(2화에서 본 그 lambda다.)"]] }
          ],
          answer: { line: 2, ev: "run_notice" },
          hint: "알림 함수를 다 만든 뒤 불러 본 결과가 있다. 2화를 떠올려 보자.",
          win: [
            ["me", "다 만든 뒤 부르면 전부 <b>영희님 안녕하세요</b>예요. 클로저는 이름을 기억하니까요. 2화 그대로예요."],
            ["witSweat", "크윽…! 그, 그래도 즐겨찾기는 객체마다 따로예요. Member()를 따로 만드니까요!"],
            ["judge", "…증인, 즐겨찾기에 대해 증언하세요."]
          ] },
        { cross: "cb3", title: "증언 ③ 객체가 다르면 다르다", who: "witSweat",
          lines: [
            { t: "회원은 사람마다 Member()로 만들어요.",
              press: [["wit", "객체지향의 기본이죠."], ["me", "(객체는 다르다.)"]] },
            { t: "favorites를 클래스에 적었으니 회원마다 자기 즐겨찾기를 가져요.",
              press: [["wit", "Java 필드처럼요."], ["me", "(3화에서 본 그 코드다.)"]] },
            { t: "남의 즐겨찾기가 보이는 건 화면 캐시 때문이에요.",
              press: [["wit", "프런트가 늘 문제죠."], ["me", "(캐시 탓은 마지막에.)"]] }
          ],
          answer: { line: 1, ev: "run_fav" },
          hint: "민지만 즐겨찾기를 누른 결과가 있다. 3화를 떠올려 보자.",
          win: [
            ["me", "민지만 눌렀는데 철수의 즐겨찾기가 <b>['분식집']</b>이에요. 클래스 변수는 하나뿐이니까요. 3화 그대로예요."],
            ["witSweat", "으아아아악─!!!"],
            ["wit", "…전부 인정합니다. 회원 한 명으로만 테스트했어요."],
            ["judge", "증인의 자백을 기록합니다. 변호인, 고친 코드를 고르세요."]
          ] },
        { choice: "judge", t: "다음 중 올바르게 고친 코드는 어느 것입니까?",
          options: [
            { code: true, t: `def join(name, coupons=[]): ...
notices = [lambda name=name: f"{name}님" for name in members]
class Member:
    def __init__(self): self.favorites = []`, fb: "가입 쿠폰이 그대로다. 기본값 리스트가 공유된다." },
            { code: true, ok: true, t: `def join(name, coupons=None): ...
notices = [lambda name=name: f"{name}님" for name in members]
class Member:
    def __init__(self): self.favorites = []` },
            { code: true, t: `def join(name, coupons=None): ...
notices = [lambda: f"{name}님" for name in members]
class Member:
    def __init__(self): self.favorites = []`, fb: "알림이 그대로다. 마지막 회원 이름만 나온다." },
            { code: true, t: `def join(name, coupons=None): ...
notices = [lambda name=name: f"{name}님" for name in members]
class Member:
    favorites = []`, fb: "즐겨찾기가 그대로다. 클래스에 하나뿐이다." }
          ],
          win: [
            ["judge", "기본값은 None, 값은 붙들고, 객체의 것은 __init__에서."],
            ["me", "네. 고친 코드를 실제로 돌려서 확인해 둘게요."]
          ] },
        { gain: ["run_fixed"], t: "고친 코드를 실제로 돌려 본 결과가 법정 기록에 들어왔다. 쿠폰은 하나씩, 알림은 자기 이름, 즐겨찾기는 따로." },
        { combine: ["run_join", "run_fav"], result: "whenwho",
          t: "판결 전에 하나만 정리하자. 회원마다 하나라고 믿었던 값들은 왜 섞였을까?\n공유된 실행 결과 두 개를 골라 조합해 보자.",
          wrong: "그 둘로는 정리가 안 된다.",
          got: "<b>언제</b> 만들어졌고 <b>누구 것</b>인가…!\n새 증거 <b>📌 언제 만들어졌고 누구 것인가</b>를 얻었다." },
        { choice: "judge", t: "마지막 질문입니다. 이번 재판에서 얻을 교훈은 무엇입니까?",
          options: [
            { t: "함수와 클래스를 쓰지 말고 코드를 한 파일에 쭉 쓴다", fb: "구조를 버린다고 공유 문제가 사라지지 않는다." },
            { t: "회원 한 명으로 같은 테스트를 더 꼼꼼하게 여러 번 반복한다", fb: "공유 버그는 둘 이상일 때 드러난다." },
            { t: "언제 만들어진 누구 값인지 따지고 둘 이상으로 확인한다", ok: true },
            { t: "값을 전역 변수에 모아 두고 함수마다 global로 함께 쓴다", fb: "공유를 더 늘리는 방법이다." }
          ],
          win: [
            ["judge", "…좋습니다."],
            ["me", "def 때인지 호출 때인지, 클래스 것인지 객체 것인지. 그리고 공유 버그는 회원 둘 이상으로 돌려야 보여요."]
          ] },
        { verdict: true }
      ],
      verdict: {
        say: "본 법정은 회원 시스템 사고가 <b>언제 만들어지고 누구 것인지 헷갈린 코드 세 가지</b>가 겹친 것이라고 판단합니다. 고친 코드로 재배포를 선고합니다. 이상, 폐정!",
        quote: "기본 인자는 def 때 한 번 만들어져 호출 사이에 공유되므로 None으로 두고 안에서 만든다. 클로저는 이름을 기억하므로 만들 때의 값은 lambda name=name:으로 붙든다. 클래스 본문의 변수는 하나뿐이므로 객체의 값은 __init__에서 만든다. 공유 버그는 하나로는 안 보이니 둘 이상으로 테스트한다.",
        clues: [
          "기본 인자 → <code>None</code> + 안에서 생성 (1화)",
          "클로저 → <code>lambda name=name:</code> (2화)",
          "클래스 변수 → <code>__init__</code> (3화)",
          "값 객체 → <code>@dataclass(frozen=True)</code> (4화)",
          "언제 만들어지고 누구 것인지 따진다"
        ]
      }
    }
  ]
};
