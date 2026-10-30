// Python 2챕터 — 컬렉션 법정 원고
// 빌드: node tools/build-packs.js → packs/python-collections.json
// 실행 결과 증거(run)는 tools/verify-run.js가 Python으로 실제로 돌려서 확인한다.
// 힌트: 챕터 2라 조합 안내는 증거 하나만 알려 주고, 추궁 대사는 의심만 하고 증거를 가리키지 않는다.
const { ev, pyEv, spec, COMMON } = require("./_helpers");

module.exports = {
  format: "code-court/v1",
  id: "python-collections",
  title: "Python 컬렉션 법정",
  language: "Python",
  blurb: "리스트 곱하기와 복사, 반복 중 삭제, 딕셔너리의 get, None을 돌려주는 sort와 일회용 제너레이터. 예외 없이 조용히 틀리는 코드를 반박해요.",
  lead: "Python 2챕터는 리스트와 딕셔너리예요. Java라면 예외가 났을 자리에서 Python은 조용히 넘어가기도 합니다. ‘에러가 안 났다’를 믿지 마세요. 1챕터보다 힌트가 조금 줄어요. 실행 결과는 모두 Python 3.14로 실제로 돌린 값이에요.",
  commonCharacters: COMMON,
  cases: [
    /* ---------------- 1화 ---------------- */
    {
      id: "c1", ep: "1화 · 리스트 복사", title: "같이 칠해지는 좌석표 사건",
      blurb: "1열 2번을 예약했더니 2열 2번까지 예약됐다고 나온다.",
      characters: { hall: ["🎭", "공연장 (원고)"] },
      evidence: {
        code: ev("📄", "코드", "좌석표 코드", "좌석표를 만들고, 예약된 자리를 1로 칠하는 부분.", `seats = [[0] * 3] * 2     # 2줄 3칸 좌석표
seats[0][1] = 1           # 1열 2번 예약

backup = seats.copy()     # 예약 전 백업`),
        run_test: pyEv("단정해의 테스트", "한 줄짜리 좌석으로 2번 자리를 예약해 본 결과.", `row = [0] * 3
row[1] = 1
print(row)`, "[0, 1, 0]"),
        run_grid: pyEv("실제 좌석표", "실제 코드 그대로 1열 2번을 예약해 본 결과.", `seats = [[0] * 3] * 2
seats[0][1] = 1
print(seats)`, "[[0, 1, 0], [0, 1, 0]]"),
        spec_mul: spec("리스트 곱하기와 복사", "Python 시퀀스 문서의 규칙 요약.", `[x] * n 은 x를 n번 ‘복사’하지 않는다. 같은 객체의 참조를 n개 담는다.
x가 숫자처럼 바꿀 수 없는 값이면 티가 안 나지만, x가 리스트면 모든 칸이 같은 리스트다.
list.copy(), a[:], list(a)는 바깥 리스트만 새로 만든다 (얕은 복사).
안쪽까지 새로 만들려면 copy.deepcopy.`),
        run_same: pyEv("줄이 같은 객체인지 확인", "좌석표의 1열과 2열이 같은 객체인지(is) 본 결과.", `seats = [[0] * 3] * 2
print(seats[0] is seats[1])`, "True"),
        run_copy: pyEv("copy로 백업한 뒤", "제대로 만든 좌석표를 copy()로 백업하고, 원본을 예약해 백업을 찍어 본 결과.", `seats = [[0, 0], [0, 0]]
backup = seats.copy()
seats[0][1] = 1
print(backup)`, "[[0, 1], [0, 0]]"),
        run_fix: pyEv("고친 결과", "줄마다 새 리스트를 만들고, 백업은 deepcopy로 만든 결과.", `import copy
seats = [[0] * 3 for _ in range(2)]
backup = copy.deepcopy(seats)
seats[0][1] = 1
print(seats)
print(backup)`, "[[0, 1, 0], [0, 0, 0]]\n[[0, 0, 0], [0, 0, 0]]"),
        oneRow: ev("📌", "추리", "두 줄처럼 보이는 한 줄", "조합 결과: [[0] * 3] * 2는 줄을 두 개 만든 게 아니라, 한 줄을 가리키는 참조를 두 개 담았다. seats[0]과 seats[1]이 같은 객체라서 한쪽을 칠하면 다른 쪽도 칠해진다.\n[0] * 3이 멀쩡했던 건 안의 0이 바꿀 수 없는 값이라서다. 칸에 새 값을 넣어도 다른 칸은 영향을 받지 않는다.", `[0] * 3      → 숫자 칸: 한 칸을 바꿔도 다른 칸은 그대로
[[0]*3] * 2  → 같은 리스트 2개: 한 줄을 바꾸면 둘 다 바뀜`)
      },
      script: [
        { say: "judge", t: "‘같이 칠해지는 좌석표 사건’의 재판을 시작합니다." },
        { say: "hall", t: "1열 2번을 예약하면 <b>2열 2번까지</b> 예약됨으로 바뀌어요. 팔지도 않은 자리가 매진이에요!" },
        { say: "wit", t: "좌석표는 [0] * 3을 두 번 곱한 한 줄 코드예요. 한 줄로 테스트했을 땐 잘 됐고요." },
        { gain: ["code", "run_test", "run_grid", "spec_mul", "run_same", "run_copy"], t: "법정 기록에 증거 6개가 들어왔다." },
        { cross: "c1a", title: "증언 ① 두 줄이 따로 생긴다", who: "wit",
          lines: [
            { t: "[0] * 3으로 한 줄 테스트를 했더니 [0, 1, 0]으로 딱 2번만 칠해졌어요.",
              press: [["wit", "곱하기가 깔끔하죠."], ["me", "(한 줄이라면 그렇다.)"]] },
            { t: "[[0] * 3] * 2는 그 줄을 복사해서 서로 다른 두 줄을 만들어요. 그래서 1열을 칠해도 2열은 그대로예요.",
              press: [["wit", "곱하기니까 복사죠."], ["me", "(정말 서로 다른 두 줄일까?)"]] },
            { t: "2열이 칠해진 건 다른 손님이 예약해서예요.",
              press: [["wit", "인기 공연이잖아요."], ["me", "(같은 번호만 예약됐다.)"]] }
          ],
          answer: { line: 1, ev: "run_grid" },
          alt: { line: 1, ev: "spec_mul", say: [["me", "리스트 곱하기는 복사가 아니라 같은 객체를 여러 번 담아요."], ["wit", "제 테스트에선 잘 됐다니까요!"], ["me", "(실제 코드 그대로 돌린 결과를 보여 주자.)"]] },
          hint: "실제 코드 그대로 예약해 본 결과가 있다.",
          win: [
            ["me", "1열 2번만 칠했는데 <b>[[0, 1, 0], [0, 1, 0]]</b>이에요. 두 줄이 같이 칠해졌어요."],
            ["witSweat", "네?! [0] * 3은 2번만 칠해졌는데요? 왜 두 줄은 같이 바뀌어요?!"],
            ["judge", "변호인, 두 줄이 같이 바뀐 이유를 밝혀 보세요."]
          ] },
        { combine: ["run_same", "spec_mul"], result: "oneRow",
          t: "한 칸만 칠했는데 두 줄이 바뀌었다.\n두 줄이 같은 객체인지 확인한 결과와 맞물리는 증거를 찾아 조합해 보자.",
          wrong: "그 둘로는 이유가 안 나온다. 곱하기가 실제로 무엇을 담는지 적힌 증거를 찾아보자.",
          got: "두 줄이 아니라 <b>같은 줄을 두 번</b> 담았다…!\n새 증거 <b>📌 두 줄처럼 보이는 한 줄</b>을 얻었다." },
        { cross: "c1b", title: "증언 ② copy면 안전하다", who: "witSweat",
          lines: [
            { t: "copy()로 만든 백업은 완전히 따로 노는 복사본이에요. 원본을 칠해도 백업은 그대로죠.",
              press: [["wit", "copy라고 써 있잖아요."], ["me", "(무엇까지 복사할까?)"]] },
            { t: "좌석표 만드는 곳만 고치면 돼요.",
              press: [["wit", "한 줄이면 되죠."], ["me", "(그것만일까.)"]] },
            { t: "백업은 공연 전에 한 번만 만들어요.",
              press: [["wit", "되돌릴 일이 생기면 쓰려고요."], ["me", "(그때 백업이 멀쩡할까.)"]] }
          ],
          answer: { line: 0, ev: "run_copy" },
          alt: { line: 0, ev: "spec_mul", say: [["me", "copy()는 바깥 리스트만 새로 만들어요."], ["witSweat", "copy는 copy죠!"], ["me", "(백업을 찍어 본 결과를 보여 주자.)"]] },
          hint: "copy로 백업한 뒤 원본을 칠해 본 결과가 있다.",
          win: [
            ["me", "좌석표를 제대로 만들어도, copy()로 백업한 뒤 원본을 칠하면 백업이 <b>[[0, 1], [0, 0]]</b>으로 같이 바뀌어요."],
            ["me", "copy()는 <b>얕은 복사</b>예요. 바깥 리스트만 새것이고 안의 줄은 같은 객체예요. Java의 new ArrayList와 같죠."],
            ["witSweat", "으아악─!!"]
          ] },
        { choice: "judge", t: "좌석표와 백업은 어떻게 만들어야 합니까?",
          options: [
            { t: "[[0] * 3] * 2를 그대로 두고 칠할 때 줄 번호를 더 조심한다", fb: "두 줄이 같은 객체라서 어느 줄을 칠해도 함께 바뀐다." },
            { t: "seats[:]로 슬라이스해서 백업한다", fb: "슬라이스도 copy()와 같은 얕은 복사다." },
            { t: "[[0] * 3 for _ in range(2)]로 만들고 백업은 deepcopy", ok: true },
            { t: "좌석표를 튜플로 바꿔서 칠하지 못하게 막아 둔다", fb: "칠하지 못하면 예약을 못 받는다." }
          ],
          win: [
            ["judge", "줄마다 새로, 백업은 안쪽까지."],
            ["me", "네. 고쳐 돌리면 1열만 칠해지고 백업은 그대로예요."]
          ] },
        { gain: ["run_fix"], t: "고친 코드를 실제로 돌려 본 결과가 법정 기록에 들어왔다." },
        { verdict: true }
      ],
      verdict: {
        say: "본 법정은 좌석이 같이 칠해진 원인이 <b>같은 리스트를 두 번 담은 곱하기</b>라고 판단합니다. 없는 손님은 예약하지 않았습니다!",
        quote: "리스트 곱하기는 같은 객체의 참조를 여러 개 담는다. 안의 값이 숫자면 티가 안 나지만, 리스트면 모든 칸이 같은 리스트라서 함께 바뀐다. list.copy()와 슬라이스도 안쪽은 공유하는 얕은 복사다. 줄마다 새로 만들려면 리스트 컴프리헨션을, 안쪽까지 복사하려면 copy.deepcopy를 쓴다.",
        clues: [
          "<code>[[0] * 3] * 2</code>는 같은 줄을 두 번 담는다",
          "<code>seats[0] is seats[1]</code> → True",
          "<code>copy()</code>, <code>a[:]</code>는 얕은 복사",
          "정답: <code>[[0] * 3 for _ in range(2)]</code>, <code>copy.deepcopy</code>"
        ]
      }
    },

    /* ---------------- 2화 ---------------- */
    {
      id: "c2", ep: "2화 · 반복 중 삭제", title: "남아 있는 품절 상품 사건",
      blurb: "품절 상품을 지웠는데 하나가 남아 있다. 에러는 한 줄도 없었다.",
      characters: { shop: ["🛒", "장바구니 사장님 (원고)"] },
      evidence: {
        code: ev("📄", "코드", "품절 삭제 코드", "장바구니에서 품절 상품을 지우는 부분.", `for item in cart:
    if item == sold_out:
        cart.remove(item)`),
        run_test: pyEv("단정해의 테스트", "라볶이가 하나만 있는 장바구니로 돌려 본 결과.", `cart = ["김밥", "라볶이", "튀김"]
for item in cart:
    if item == "라볶이":
        cart.remove(item)
print(cart)`, "['김밥', '튀김']"),
        run_two: pyEv("연속으로 담긴 장바구니", "라볶이가 두 개 연속으로 담긴 장바구니로 돌려 본 결과.", `cart = ["김밥", "라볶이", "라볶이", "튀김"]
for item in cart:
    if item == "라볶이":
        cart.remove(item)
print(cart)`, "['김밥', '라볶이', '튀김']"),
        spec_iter: spec("반복 중 수정", "Python 튜토리얼과 시퀀스 문서의 규칙 요약.", `리스트의 for문은 안쪽 번호를 하나씩 늘려 가며 돈다.
도는 중에 지우면 뒤 원소가 한 칸씩 당겨지고, 번호는 그대로 늘어나서 당겨진 원소를 건너뛴다. 예외는 나지 않는다.
딕셔너리는 다르다: 도는 중에 크기가 바뀌면 다음 단계에서 RuntimeError가 난다.
새 리스트를 만들거나, 복사본을 돌면서 원본을 바꾼다.`),
        run_seen: pyEv("for가 실제로 본 상품", "돌면서 본 상품을 따로 적어 본 결과.", `cart = ["김밥", "라면", "튀김"]
seen = []
for item in cart:
    seen.append(item)
    if item == "김밥":
        cart.remove(item)
print(seen)`, "['김밥', '튀김']"),
        run_dict: pyEv("딕셔너리로 돌린 결과", "재고 딕셔너리를 돌면서 품절 키를 지워 본 결과.", `stock = {"김밥": 0, "라면": 3}
try:
    for name in stock:
        if stock[name] == 0:
            del stock[name]
except Exception as e:
    print(type(e).__name__)`, "RuntimeError"),
        run_fix: pyEv("고친 결과", "컴프리헨션으로 새 리스트와 새 딕셔너리를 만든 결과.", `cart = ["김밥", "라볶이", "라볶이", "튀김"]
print([item for item in cart if item != "라볶이"])
stock = {"김밥": 0, "라면": 3}
print({k: v for k, v in stock.items() if v != 0})`, "['김밥', '튀김']\n{'라면': 3}"),
        skip: ev("📌", "추리", "당겨져서 건너뛴 원소", "조합 결과: for문은 번호를 하나씩 늘려 간다. 지우면 뒤 원소가 앞으로 당겨지는데 번호는 그대로 다음으로 가서, 당겨진 원소는 검사를 받지 못한다.\nJava의 for-each는 이때 ConcurrentModificationException으로 알려 주지만, Python 리스트는 아무 말 없이 건너뛴다. 하나만 지운 테스트에는 건너뛸 짝이 없었다.", `[김밥, 라볶이, 라볶이, 튀김]  번호 1에서 지움
[김밥, 라볶이, 튀김]         번호 2로 이동 → 남은 라볶이를 건너뜀`)
      },
      script: [
        { say: "judge", t: "‘남아 있는 품절 상품 사건’의 재판을 시작합니다." },
        { say: "shop", t: "품절된 라볶이를 지웠는데 <b>한 개가 그대로 결제됐어요</b>. 로그에 에러는 하나도 없고요!" },
        { say: "wit", t: "Java에선 반복 중에 지우면 예외가 났죠. Python은 예외가 안 나요. 그러니까 안전한 거예요." },
        { gain: ["code", "run_test", "run_two", "spec_iter", "run_seen", "run_dict"], t: "법정 기록에 증거 6개가 들어왔다." },
        { cross: "c2a", title: "증언 ① 예외가 없으니 안전하다", who: "wit",
          lines: [
            { t: "품절 상품은 for로 돌면서 cart.remove로 지워요.",
              press: [["wit", "제일 쉬운 방법이죠."], ["me", "(돌면서 그 리스트를 바로 고친다.)"]] },
            { t: "라볶이 하나로 테스트했더니 깔끔하게 지워졌어요.",
              press: [["wit", "['김밥', '튀김']이요."], ["me", "(하나라면 그렇다.)"]] },
            { t: "Python은 예외가 안 났으니, 품절 상품이 몇 개든 전부 지워져요.",
              press: [["wit", "에러가 없으면 잘 된 거죠."], ["me", "(에러가 없다는 게 다 지웠다는 뜻일까?)"]] }
          ],
          answer: { line: 2, ev: "run_two" },
          alt: { line: 2, ev: "spec_iter", say: [["me", "리스트는 도는 중에 지우면 뒤 원소를 건너뛰어요."], ["wit", "예외가 없었다니까요!"], ["me", "(연속으로 담긴 경우를 돌린 결과를 보여 주자.)"]] },
          hint: "같은 상품이 연속으로 담긴 장바구니로 돌려 본 결과가 있다.",
          win: [
            ["me", "라볶이가 연속으로 두 개면 <b>['김밥', '라볶이', '튀김']</b>이에요. 하나가 남았고, 예외는 없었어요."],
            ["witSweat", "네?! 예외도 없이 안 지워졌다고요? 왜요?!"],
            ["judge", "변호인, 하나가 남은 이유를 밝혀 보세요."]
          ] },
        { combine: ["run_seen", "spec_iter"], result: "skip",
          t: "예외 없이 하나가 남았다.\nfor가 실제로 본 상품 기록과 맞물리는 증거를 찾아 조합해 보자.",
          wrong: "그 둘로는 이유가 안 나온다. for문이 어떻게 도는지 적힌 증거를 찾아보자.",
          got: "지우면 <b>당겨지고</b>, 번호는 <b>건너뛴다</b>…!\n새 증거 <b>📌 당겨져서 건너뛴 원소</b>를 얻었다." },
        { cross: "c2b", title: "증언 ② 딕셔너리도 똑같다", who: "witSweat",
          lines: [
            { t: "좋아요, 리스트는 조심할게요.",
              press: [["wit", "조용히 건너뛰다니요."], ["me", "(그래서 더 위험하다.)"]] },
            { t: "재고는 딕셔너리니까 for로 돌면서 del로 지워요. 최악이어도 리스트처럼 하나 건너뛸 뿐이에요.",
              press: [["wit", "같은 for문이니까요."], ["me", "(딕셔너리도 조용할까?)"]] },
            { t: "다음 야간 배치에 그대로 넣을게요.",
              press: [["wit", "밤에 도는 거라 아무도 안 봐요."], ["me", "(그 전에 확인할 게 있다.)"]] }
          ],
          answer: { line: 1, ev: "run_dict" },
          alt: { line: 1, ev: "spec_iter", say: [["me", "딕셔너리는 도는 중에 크기가 바뀌면 예외가 나요."], ["witSweat", "리스트는 조용했잖아요!"], ["me", "(돌린 결과를 보여 주자.)"]] },
          hint: "딕셔너리를 돌면서 지워 본 결과가 있다.",
          win: [
            ["me", "딕셔너리는 <b>RuntimeError</b>로 멈춰요. 같은 for문인데 리스트는 조용히 건너뛰고, 딕셔너리는 멈춰요."],
            ["witSweat", "으아악─!!"]
          ] },
        { choice: "judge", t: "품절 상품은 어떻게 지워야 합니까?",
          options: [
            { t: "for 안에 try-except를 넣어 예외를 무시한다", fb: "리스트는 예외 없이 건너뛴다. 무시할 예외조차 없다." },
            { t: "컴프리헨션으로 남길 것만 담은 새 리스트를 만든다", ok: true },
            { t: "for문을 두 번 돌려 남은 상품까지 지운다", fb: "세 개가 연속이면 또 남는다. 횟수로 때울 일이 아니다." },
            { t: "remove 대신 번호로 del cart[i]를 쓴다", fb: "지울 때마다 당겨지는 건 같다. 건너뛰거나 번호가 넘어간다." }
          ],
          win: [
            ["judge", "지우지 말고, 남길 것을 새로."],
            ["me", "네. 고쳐 돌리면 <b>['김밥', '튀김']</b>, 딕셔너리는 <b>{'라면': 3}</b>이에요."]
          ] },
        { gain: ["run_fix"], t: "컴프리헨션으로 고친 코드를 실제로 돌려 본 결과가 법정 기록에 들어왔다." },
        { verdict: true }
      ],
      verdict: {
        say: "본 법정은 라볶이가 남은 원인이 <b>돌면서 지운 리스트</b>라고 판단합니다. 에러가 없었던 건 안전해서가 아니었습니다!",
        quote: "Python 리스트를 for로 돌면서 지우면 뒤 원소가 당겨져 하나를 건너뛰고, 예외는 나지 않는다. Java처럼 알려 주지 않아서 더 조용하다. 딕셔너리는 도는 중에 크기가 바뀌면 RuntimeError가 난다. 컴프리헨션으로 새 리스트나 새 딕셔너리를 만든다.",
        clues: [
          "리스트: 돌면서 지우면 예외 없이 건너뛴다",
          "하나만 지운 테스트는 통과한다",
          "딕셔너리: 도는 중 크기 변경 → RuntimeError",
          "정답: 컴프리헨션으로 새로 만든다"
        ]
      }
    },

    /* ---------------- 3화 ---------------- */
    {
      id: "c3", ep: "3화 · 딕셔너리", title: "사라진 장바구니 사건",
      blurb: "장바구니에 담았다고 떴는데, 다시 열면 비어 있다.",
      characters: { mall: ["🛍️", "쇼핑몰 (원고)"] },
      evidence: {
        code: ev("📄", "코드", "장바구니 코드", "회원별 장바구니에 담고, 메뉴별 주문 수를 세는 부분.", `carts = {}
carts.get(user, []).append(item)    # 회원 장바구니에 담기

counts = {}
counts[menu] += 1                   # 메뉴별 주문 수`),
        run_test: pyEv("단정해의 테스트", "장바구니가 이미 있는 회원으로 담아 본 결과.", `carts = {"민지": ["김밥"]}
carts.get("민지", []).append("라면")
print(carts)`, "{'민지': ['김밥', '라면']}"),
        run_new: pyEv("처음 담는 회원", "장바구니가 없는 새 회원으로 담아 본 결과.", `carts = {}
carts.get("철수", []).append("라면")
print(carts)`, "{}"),
        spec_get: spec("dict.get과 d[k]", "dict 문서의 규칙 요약.", `d.get(k, 기본값): 키가 없으면 기본값을 돌려줄 뿐, 딕셔너리에 넣지 않는다.
d[k]: 키가 없으면 KeyError.
d[k] += 1 은 d[k]를 먼저 읽으므로, 키가 없으면 KeyError.
처음 쓰는 키를 자동으로 만들려면 setdefault, collections.defaultdict, 세기는 collections.Counter.`),
        run_count: pyEv("첫 주문 세기", "빈 딕셔너리에서 주문 수를 하나 올려 본 결과.", `counts = {}
try:
    counts["김밥"] += 1
except Exception as e:
    print(type(e).__name__)`, "KeyError"),
        run_fix: pyEv("고친 결과", "defaultdict와 Counter로 담고 세어 본 결과.", `from collections import defaultdict, Counter
carts = defaultdict(list)
carts["철수"].append("라면")
print(dict(carts))
print(Counter(["김밥", "라면", "김밥"]))`, "{'철수': ['라면']}\nCounter({'김밥': 2, '라면': 1})"),
        temp: ev("📌", "추리", "어디에도 없는 임시 리스트", "조합 결과: get의 기본값 []는 그 자리에서 만들어진 임시 리스트다. 딕셔너리에 들어가지 않는다. 라면은 그 임시 리스트에 담겼다가, 줄이 끝나면서 함께 사라졌다.\n이미 장바구니가 있는 회원은 get이 진짜 리스트를 돌려줘서 통과했다. Java의 getOrDefault와 같은 함정이다.", `있는 회원: get → 진짜 리스트 → 담김
새 회원:   get → 임시 [] → 담긴 뒤 버려짐`)
      },
      script: [
        { say: "judge", t: "‘사라진 장바구니 사건’의 재판을 시작합니다." },
        { say: "mall", t: "신규 회원 첫 주문이 전부 <b>빈 장바구니</b>로 결제돼요. 메뉴별 집계는 첫 주문에서 <b>멈추고요</b>!" },
        { say: "wit", t: "get에 기본값을 줬으니 없는 회원도 안전해요. 기존 회원으로 테스트도 했어요." },
        { gain: ["code", "run_test", "run_new", "spec_get", "run_count"], t: "법정 기록에 증거 5개가 들어왔다." },
        { cross: "c3a", title: "증언 ① 기본값에 담으면 저장된다", who: "wit",
          lines: [
            { t: "회원의 장바구니는 carts에 이름을 키로 넣어요.",
              press: [["wit", "민지의 장바구니, 철수의 장바구니."], ["me", "(그건 맞다.)"]] },
            { t: "기존 회원 민지로 테스트했더니 라면이 잘 담겼어요.",
              press: [["wit", "['김밥', '라면']이요."], ["me", "(민지는 장바구니가 있었다.)"]] },
            { t: "새 회원은 get이 [] 를 주니까, 거기에 담으면 그 회원 장바구니로 저장돼요.",
              press: [["wit", "기본값을 줬잖아요."], ["me", "(그 []는 어디에 있을까?)"]] }
          ],
          answer: { line: 2, ev: "run_new" },
          alt: { line: 2, ev: "spec_get", say: [["me", "get의 기본값은 돌려주기만 하고 딕셔너리에 넣지 않아요."], ["wit", "민지는 잘 담겼다니까요!"], ["me", "(새 회원으로 돌린 결과를 보여 주자.)"]] },
          hint: "장바구니가 없는 새 회원으로 담아 본 결과가 있다.",
          win: [
            ["me", "새 회원 철수로 담으면 carts는 <b>{}</b>예요. 라면은 어디에도 없어요."],
            ["witSweat", "네?! append까지 했는데 어디로 갔어요?!"],
            ["judge", "변호인, 라면이 어디로 갔는지 밝혀 보세요."]
          ] },
        { combine: ["run_new", "spec_get"], result: "temp",
          t: "append를 했는데 라면이 사라졌다.\n새 회원으로 담아 본 결과와 맞물리는 증거를 찾아 조합해 보자.",
          wrong: "그 둘로는 이유가 안 나온다. get이 기본값으로 무엇을 하는지 적힌 증거를 찾아보자.",
          got: "기본값 []는 <b>임시 리스트</b>, 담자마자 버려졌다…!\n새 증거 <b>📌 어디에도 없는 임시 리스트</b>를 얻었다." },
        { cross: "c3b", title: "증언 ② 숫자는 0부터 시작한다", who: "witSweat",
          lines: [
            { t: "장바구니는 고칠게요.",
              press: [["wit", "리스트가 문제였네요."], ["me", "(리스트만일까.)"]] },
            { t: "메뉴별 주문 수는 counts[menu] += 1이에요. 처음엔 0이니까 1이 돼요.",
              press: [["wit", "아직 안 팔렸으니 0이죠."], ["me", "(딕셔너리도 그렇게 생각할까?)"]] },
            { t: "집계가 멈춘 건 점심시간에 주문이 몰려서예요.",
              press: [["wit", "첫 주문이 점심이었어요."], ["me", "(첫 주문에서 멈췄다.)"]] }
          ],
          answer: { line: 1, ev: "run_count" },
          alt: { line: 1, ev: "spec_get", say: [["me", "d[k] += 1은 d[k]를 먼저 읽어요."], ["witSweat", "없으면 0이겠죠!"], ["me", "(첫 주문을 돌린 결과를 보여 주자.)"]] },
          hint: "빈 딕셔너리에서 주문 수를 올려 본 결과가 있다.",
          win: [
            ["me", "첫 주문에서 <b>KeyError</b>예요. 없는 키를 읽으니까요. 0이라는 건 사람의 기대였어요."],
            ["witSweat", "으아악─!!"]
          ] },
        { choice: "judge", t: "어떻게 고쳐야 합니까?",
          options: [
            { t: "defaultdict(list)로 담고, 세는 건 Counter로 한다", ok: true },
            { t: "get 뒤에 빈 리스트인지 if로 검사하고 경고를 찍는다", fb: "경고만 찍힐 뿐 담기지 않는다." },
            { t: "counts[menu] += 1을 try-except로 감싸 KeyError를 넘긴다", fb: "첫 주문마다 세지 않고 넘어가서 숫자가 모자란다." },
            { t: "메뉴와 회원을 전부 미리 0과 []로 채워 놓는다", fb: "새 메뉴와 새 회원이 나오면 또 터진다." }
          ],
          win: [
            ["judge", "없을 때 무엇을 할지 자료구조가 알게."],
            ["me", "네. 고쳐 돌리면 <b>{'철수': ['라면']}</b>이고 Counter는 김밥 2, 라면 1이에요."]
          ] },
        { gain: ["run_fix"], t: "defaultdict와 Counter로 고친 코드를 실제로 돌려 본 결과가 법정 기록에 들어왔다." },
        { verdict: true }
      ],
      verdict: {
        say: "본 법정은 장바구니가 빈 원인이 <b>저장되지 않는 get의 기본값</b>이고, 집계가 멈춘 원인이 <b>없는 키를 읽은 +=</b>라고 판단합니다. 점심시간은 무죄!",
        quote: "dict.get(k, 기본값)은 기본값을 돌려줄 뿐 딕셔너리에 넣지 않으므로, 거기에 append해도 사라진다. d[k] += 1은 먼저 읽으므로 없는 키에서 KeyError가 난다. 이미 있는 키로만 테스트하면 드러나지 않는다. 담기는 defaultdict나 setdefault로, 세기는 Counter로 한다.",
        clues: [
          "<code>get</code>의 기본값은 저장되지 않는다",
          "있는 회원 테스트는 통과한다",
          "<code>counts[k] += 1</code> → 없는 키면 KeyError",
          "정답: <code>defaultdict(list)</code>, <code>Counter</code>"
        ]
      }
    },

    /* ---------------- 4화 ---------------- */
    {
      id: "c4", ep: "4화 · None과 일회용", title: "두 번째엔 비어 있던 목록 사건",
      blurb: "랭킹은 None으로 뜨고, 평균을 내자 0으로 나눴다는 오류가 났다.",
      characters: { teacher: ["🏫", "담임 선생님 (원고)"] },
      evidence: {
        code: ev("📄", "코드", "시험 통계 코드", "랭킹과 평균을 구하는 부분.", `ranking = scores.sort(reverse=True)     # 랭킹

valid = (s for s in scores if s >= 0)   # 결시(-1) 빼기
total = sum(valid)
count = sum(1 for _ in valid)
average = total / count`),
        run_test: pyEv("단정해의 테스트", "리스트로 합계와 개수를 각각 구해 본 결과.", `scores = [70, 95, 80]
print(sum(scores), len(scores))`, "245 3"),
        run_sort: pyEv("랭킹 실행 결과", "sort의 결과를 ranking에 담아 찍어 본 결과.", `scores = [70, 95, 80]
ranking = scores.sort(reverse=True)
print(ranking)
print(scores)`, "None\n[95, 80, 70]"),
        spec_none: spec("제자리 수정과 이터레이터", "list 문서와 용어집의 규칙 요약.", `list.sort(), append(), reverse()처럼 리스트를 제자리에서 바꾸는 메서드는 None을 돌려준다.
sorted(x)는 새 리스트를 돌려주고 원본은 그대로다.
(x for …) 제너레이터, map, filter, zip은 이터레이터다. 한 번 끝까지 꺼내면 비어 있다.
여러 번 쓰려면 list로 담는다.`),
        run_gen: pyEv("제너레이터 두 번 쓰기", "제너레이터로 합계와 개수를 차례로 구해 본 결과.", `scores = [70, 95, 80]
valid = (s for s in scores if s >= 0)
print(sum(valid))
print(sum(1 for _ in valid))`, "245\n0"),
        run_fix: pyEv("고친 결과", "sorted로 랭킹을 받고, 리스트 컴프리헨션으로 평균을 구한 결과.", `scores = [70, 95, 80, -1]
valid = [s for s in scores if s >= 0]
print(sorted(valid, reverse=True))
print(sum(valid) / len(valid))`, "[95, 80, 70]\n81.66666666666667"),
        oneshot: ev("📌", "추리", "한 번 꺼내면 빈 제너레이터", "조합 결과: 괄호로 만든 제너레이터는 값을 담아 두지 않고, 하나씩 꺼내 주는 흐름이다. sum이 끝까지 꺼낸 뒤에는 비어 있다.\n그래서 개수는 0이 됐고 평균에서 0으로 나눴다. Java의 일회용 스트림과 같은 함정인데, Python은 다시 써도 예외 없이 그냥 비어 있다.", `sum(valid)      → 245 (끝까지 꺼냄)
sum(1 for …)    → 0   (이미 비어 있음, 예외 없음)`)
      },
      script: [
        { say: "judge", t: "‘두 번째엔 비어 있던 목록 사건’의 재판을 시작합니다." },
        { say: "teacher", t: "랭킹 화면엔 <b>None</b>이 찍히고, 평균을 내자 <b>0으로 나눴다는 오류</b>가 났어요. 학생은 분명 세 명인데요!" },
        { say: "wit", t: "코드는 다 한 줄씩이에요. 정렬해서 담고, 제너레이터로 메모리도 아꼈죠." },
        { gain: ["code", "run_test", "run_sort", "spec_none", "run_gen"], t: "법정 기록에 증거 5개가 들어왔다." },
        { cross: "c4a", title: "증언 ① sort가 결과를 돌려준다", who: "wit",
          lines: [
            { t: "scores.sort()는 정렬된 리스트를 돌려주니까, ranking에 담으면 랭킹이 돼요.",
              press: [["wit", "Java 스트림의 sorted처럼요."], ["me", "(정말 돌려줄까?)"]] },
            { t: "합계와 개수는 제가 테스트해서 245, 3이 나왔어요.",
              press: [["wit", "리스트로 해 봤어요."], ["me", "(리스트였다.)"]] },
            { t: "None이 찍히는 건 화면이 고장 나서예요.",
              press: [["wit", "프런트 쪽 문제겠죠."], ["me", "(프런트 탓은 나중에.)"]] }
          ],
          answer: { line: 0, ev: "run_sort" },
          alt: { line: 0, ev: "spec_none", say: [["me", "sort는 제자리에서 바꾸고 None을 돌려줘요."], ["wit", "정렬했으면 결과가 있어야죠!"], ["me", "(ranking을 찍어 본 결과를 보여 주자.)"]] },
          hint: "sort의 결과를 담아 찍어 본 결과가 있다.",
          win: [
            ["me", "ranking은 <b>None</b>이에요. sort는 scores 자체를 정렬하고 아무것도 돌려주지 않아요."],
            ["witSweat", "크윽…! 그건 고칠게요. 그래도 평균은 제너레이터로 깔끔하게 구했어요!"],
            ["judge", "변호인, 0으로 나눈 이유를 밝혀 보세요."]
          ] },
        { combine: ["run_gen", "spec_none"], result: "oneshot",
          t: "학생은 셋인데 개수가 0이었다.\n제너레이터를 두 번 쓴 결과와 맞물리는 증거를 찾아 조합해 보자.",
          wrong: "그 둘로는 이유가 안 나온다. 제너레이터가 어떤 것인지 적힌 증거를 찾아보자.",
          got: "제너레이터는 <b>한 번 꺼내면 비어 있다</b>…!\n새 증거 <b>📌 한 번 꺼내면 빈 제너레이터</b>를 얻었다." },
        { cross: "c4b", title: "증언 ② 같은 목록을 두 번 쓴다", who: "witSweat",
          lines: [
            { t: "결시생 -1을 빼려고 제너레이터를 썼어요.",
              press: [["wit", "괄호만 쓰면 되니까요."], ["me", "(대괄호가 아니라 괄호다.)"]] },
            { t: "valid는 목록이니까 합계도 내고 개수도 세면서 몇 번이든 쓸 수 있어요.",
              press: [["wit", "변수에 담아 뒀잖아요."], ["me", "(정말 목록일까?)"]] },
            { t: "0으로 나눈 건 결시생이 많아서예요.",
              press: [["wit", "다 결시했나 봐요."], ["me", "(세 명 다 시험을 봤다.)"]] }
          ],
          answer: { line: 1, ev: "oneshot" },
          alt: { line: 1, ev: "run_gen", say: [["me", "합계는 245인데 개수가 0이에요."], ["witSweat", "그건 뭔가 다른 이유겠죠!"], ["me", "(왜 비었는지 추리를 들이밀자.)"]] },
          hint: "제너레이터가 어떤 것인지 조합한 추리를 떠올려 보자.",
          win: [
            ["me", "valid는 목록이 아니라 <b>제너레이터</b>예요. sum이 끝까지 꺼낸 뒤엔 비어 있어서, 개수가 0이 됐어요."],
            ["me", "Java 스트림은 다시 쓰면 예외가 났지만, Python은 말없이 비어 있어요."],
            ["witSweat", "으아악─!!"]
          ] },
        { choice: "judge", t: "어떻게 고쳐야 합니까?",
          options: [
            { t: "ranking = scores.sort()를 두 줄로 나눠 다시 담는다", fb: "몇 줄로 나눠도 sort는 None을 돌려준다." },
            { t: "제너레이터를 두 번 만들 필요 없이 sum을 두 번 부른다", fb: "두 번째 sum은 0이다." },
            { t: "sorted로 새 리스트를 받고, valid는 대괄호 리스트로 만든다", ok: true },
            { t: "평균 앞에 if count == 0이면 0점으로 처리하는 줄을 넣는다", fb: "오류만 가려서 평균이 0점으로 나온다." }
          ],
          win: [
            ["judge", "돌려받을 건 sorted로, 다시 쓸 건 리스트로."],
            ["me", "네. 고쳐 돌리면 랭킹 <b>[95, 80, 70]</b>, 평균 <b>81.66…</b>이에요."]
          ] },
        { gain: ["run_fix"], t: "고친 코드를 실제로 돌려 본 결과가 법정 기록에 들어왔다." },
        { verdict: true }
      ],
      verdict: {
        say: "본 법정은 None의 원인이 <b>제자리에서 바꾸는 sort</b>이고, 0으로 나눈 원인이 <b>이미 꺼낸 제너레이터</b>라고 판단합니다. 결시생은 없었습니다!",
        quote: "list.sort(), append처럼 제자리에서 바꾸는 메서드는 None을 돌려주므로, 결과가 필요하면 sorted를 쓴다. 제너레이터와 map, filter, zip은 한 번 꺼내면 비어 있고, 다시 써도 예외 없이 빈 결과가 나온다. 여러 번 쓸 값은 리스트로 담는다.",
        clues: [
          "<code>scores.sort()</code> → None, <code>sorted(scores)</code> → 새 리스트",
          "제너레이터는 한 번 꺼내면 비어 있다 (예외 없음)",
          "리스트로 한 테스트는 통과한다",
          "정답: <code>sorted</code>, 대괄호 리스트 컴프리헨션"
        ]
      }
    },

    /* ---------------- 보스 ---------------- */
    {
      id: "cboss", ep: "보스 · 2챕터 총정리", title: "재고 정리 대법정",
      blurb: "품절은 남았고, 신규 지점 재고는 사라졌고, 백업은 같이 망가졌다.",
      boss: true, hard: true, trust: 3,
      characters: { owner: ["🏪", "분식왕 (원고)"] },
      evidence: {
        code: ev("📄", "코드", "재고 정리 코드", "밤마다 도는 재고 정리 코드의 일부.", `# ① 정리 전 백업
backup = shelves.copy()

# ② 품절 빼기
for item in menu:
    if item in sold_out:
        menu.remove(item)

# ③ 지점별 입고 기록
stock.get(branch, []).append(item)`),
        run_backup: pyEv("① 백업 실행 결과", "백업을 만든 뒤 원본 선반을 바꾸고 백업을 찍어 본 결과.", `shelves = [["김밥"], ["라면"]]
backup = shelves.copy()
shelves[0].append("튀김")
print(backup)`, "[['김밥', '튀김'], ['라면']]"),
        run_menu: pyEv("② 품절 빼기 실행 결과", "품절이 김밥, 라면일 때 메뉴로 돌려 본 결과.", `menu = ["김밥", "라면", "튀김"]
sold_out = ["김밥", "라면"]
for item in menu:
    if item in sold_out:
        menu.remove(item)
print(menu)`, "['라면', '튀김']"),
        run_stock: pyEv("③ 입고 기록 실행 결과", "새 지점으로 입고를 기록해 본 결과.", `stock = {}
stock.get("홍대점", []).append("김밥")
print(stock)`, "{}"),
        spec_two: spec("2챕터에서 본 규칙", "1~4화 판결 요약.", `copy()와 슬라이스는 얕은 복사, 안쪽까지는 deepcopy (1화)
리스트를 돌면서 지우면 예외 없이 건너뛴다. 컴프리헨션으로 새로 (2화)
get의 기본값은 저장되지 않는다. defaultdict, Counter (3화)
sort는 None, 제너레이터는 한 번만 (4화)`),
        run_fixed: pyEv("고친 코드 실행 결과", "판결에서 고른 방식으로 고쳐서 돌려 본 결과.", `import copy
from collections import defaultdict
shelves = [["김밥"], ["라면"]]
backup = copy.deepcopy(shelves)
shelves[0].append("튀김")
print(backup)
menu = ["김밥", "라면", "튀김"]
sold_out = ["김밥", "라면"]
print([item for item in menu if item not in sold_out])
stock = defaultdict(list)
stock["홍대점"].append("김밥")
print(dict(stock))`, "[['김밥'], ['라면']]\n['튀김']\n{'홍대점': ['김밥']}"),
        quiet: ev("📌", "추리", "에러 없는 세 가지 실패", "조합 결과: 백업은 같이 바뀌었고, 라면은 남았고, 입고 기록은 사라졌다. 그런데 어느 것도 예외를 내지 않았다.\nPython은 이 세 경우를 ‘정상’으로 본다. 코드가 시킨 대로 했을 뿐이다. 그래서 로그가 깨끗해도 결과 값을 직접 확인해야 한다.", `얕은 복사 → 예외 없음
돌면서 삭제 → 예외 없음
get 기본값에 append → 예외 없음`)
      },
      script: [
        { say: "judge", t: "정숙! <b>재고 정리 대법정</b>을 개정합니다. 신뢰도는 <b>3</b>, 첫 실수에는 힌트가 없습니다." },
        { say: "owner", t: "어젯밤 재고 정리 뒤로 <b>백업이 망가졌고</b>, 품절된 라면이 <b>메뉴에 남았고</b>, 홍대점 입고 기록은 <b>사라졌어요</b>. 로그는 깨끗하고요!" },
        { say: "wit", t: "재고 코드는 제가 리뷰했어요. 로그에 에러가 하나도 없잖아요. 코드는 멀쩡해요." },
        { gain: ["code", "run_backup", "run_menu", "run_stock", "spec_two"], t: "법정 기록에 증거 5개가 들어왔다. 2챕터 1~3화를 떠올리며 골라야 한다." },
        { cross: "cb1", title: "증언 ① 백업은 따로 있다", who: "wit",
          lines: [
            { t: "정리 전에 선반 목록을 백업해요.",
              press: [["wit", "되돌릴 수 있게요."], ["me", "(백업은 좋다.)"]] },
            { t: "오늘 입고가 많아서 선반을 많이 고쳤어요.",
              press: [["wit", "튀김이 새로 들어왔죠."], ["me", "(선반 안을 고쳤다.)"]] },
            { t: "copy()로 만든 백업이라, 선반 안을 고쳐도 백업은 정리 전 그대로예요.",
              press: [["wit", "복사본이니까요."], ["me", "(1화에서 무슨 일이 있었더라.)"]] }
          ],
          answer: { line: 2, ev: "run_backup" },
          hint: "①을 돌려 본 결과가 있다. 1화를 떠올려 보자.",
          win: [
            ["me", "백업이 <b>[['김밥', '튀김'], ['라면']]</b>으로 같이 바뀌었어요. copy()는 얕은 복사니까요. 1화 그대로예요."],
            ["witSweat", "크윽…! 백업은 그렇다 쳐도, 품절 빼기는 문제없어요. 예외가 안 났잖아요!"],
            ["judge", "증인, 품절 빼기에 대해 증언하세요."]
          ] },
        { cross: "cb2", title: "증언 ② 품절은 다 빠진다", who: "witSweat",
          lines: [
            { t: "메뉴를 돌면서 품절이면 remove로 지워요. 예외가 없었으니 품절은 전부 빠졌어요.",
              press: [["wit", "로그가 깨끗하잖아요."], ["me", "(2화에서 본 그 코드다.)"]] },
            { t: "오늘 품절은 김밥과 라면이에요.",
              press: [["wit", "둘 다 인기 메뉴죠."], ["me", "(나란히 붙어 있는 두 메뉴다.)"]] },
            { t: "라면이 남은 건 직원이 다시 올려서예요.",
              press: [["wit", "손이 빠른 직원이 있어요."], ["me", "(정말 그럴까.)"]] }
          ],
          answer: { line: 0, ev: "run_menu" },
          hint: "②를 돌려 본 결과가 있다. 2화를 떠올려 보자.",
          win: [
            ["me", "돌려 보면 <b>['라면', '튀김']</b>이에요. 김밥을 지우자 라면이 당겨져서 검사를 건너뛰었어요. 2화 그대로예요."],
            ["witSweat", "크윽…! 그, 그래도 입고 기록은 기본값까지 줬으니 안전해요!"],
            ["judge", "…증인, 입고 기록에 대해 증언하세요."]
          ] },
        { cross: "cb3", title: "증언 ③ 기본값이 있어 안전하다", who: "witSweat",
          lines: [
            { t: "입고는 지점 이름을 키로 기록해요.",
              press: [["wit", "지점마다 목록이 있죠."], ["me", "(그건 맞다.)"]] },
            { t: "새로 연 홍대점도 get의 기본값 [] 에 담으니까 기록이 남아요.",
              press: [["wit", "기본값을 줬잖아요."], ["me", "(3화에서 본 그 get이다.)"]] },
            { t: "기록이 없는 건 홍대점이 보고를 안 해서예요.",
              press: [["wit", "신규 지점이 다 그렇죠."], ["me", "(지점 탓은 마지막에.)"]] }
          ],
          answer: { line: 1, ev: "run_stock" },
          hint: "③을 돌려 본 결과가 있다. 3화를 떠올려 보자.",
          win: [
            ["me", "돌려 보면 stock은 <b>{}</b>예요. 기본값은 저장되지 않아요. 3화 그대로예요."],
            ["witSweat", "으아아아악─!!!"],
            ["wit", "…전부 인정합니다. 예외가 없다고 맞는 줄 알았어요."],
            ["judge", "증인의 자백을 기록합니다. 변호인, 고친 코드를 고르세요."]
          ] },
        { choice: "judge", t: "다음 중 올바르게 고친 코드는 어느 것입니까?",
          options: [
            { code: true, t: `backup = shelves.copy()
menu = [m for m in menu if m not in sold_out]
stock = defaultdict(list)
stock[branch].append(item)`, fb: "백업이 그대로다. 얕은 복사라 선반 안이 공유된다." },
            { code: true, t: `backup = copy.deepcopy(shelves)
for m in menu.copy():
    if m in sold_out: menu.remove(m)
stock.get(branch, []).append(item)`, fb: "입고 기록이 그대로다. 기본값은 저장되지 않는다." },
            { code: true, t: `backup = copy.deepcopy(shelves)
for m in menu:
    if m in sold_out: menu.remove(m)
stock = defaultdict(list)
stock[branch].append(item)`, fb: "품절 빼기가 그대로다. 돌면서 지워서 건너뛴다." },
            { code: true, ok: true, t: `backup = copy.deepcopy(shelves)
menu = [m for m in menu if m not in sold_out]
stock = defaultdict(list)
stock[branch].append(item)` }
          ],
          win: [
            ["judge", "안쪽까지 복사하고, 남길 것만 새로, 없는 키는 자동으로."],
            ["me", "네. 고친 코드를 실제로 돌려서 확인해 둘게요."]
          ] },
        { gain: ["run_fixed"], t: "고친 코드를 실제로 돌려 본 결과가 법정 기록에 들어왔다. 백업은 그대로, 메뉴는 [튀김], 홍대점 입고 기록도 남았다." },
        { combine: ["run_menu", "run_stock"], result: "quiet",
          t: "판결 전에 하나만 정리하자. 왜 로그는 깨끗했을까?\n예외 없이 틀린 실행 결과와 맞물리는 증거를 찾아 조합해 보자.",
          wrong: "그 둘로는 정리가 안 된다.",
          got: "<b>에러 없이</b> 틀렸다, Python에겐 정상이었다…!\n새 증거 <b>📌 에러 없는 세 가지 실패</b>를 얻었다." },
        { choice: "judge", t: "마지막 질문입니다. 이번 재판에서 얻을 교훈은 무엇입니까?",
          options: [
            { t: "로그에 에러가 없으면 코드는 맞다고 봐도 된다", fb: "세 버그 모두 로그가 깨끗했다." },
            { t: "컬렉션을 쓰지 말고 전부 문자열로 저장한다", fb: "자료구조가 문제가 아니라 규칙을 모른 게 문제였다." },
            { t: "예외를 믿지 말고 결과 값을 경계 데이터로 직접 확인한다", ok: true },
            { t: "except Exception으로 전체를 감싸 더 안전하게 만든다", fb: "애초에 예외가 없었다." }
          ],
          win: [
            ["judge", "…좋습니다."],
            ["me", "Python은 조용히 틀릴 수 있어요. 연속된 값, 없는 키, 안쪽 수정 같은 경계를 넣어 결과 값을 찍어 봐야 해요."]
          ] },
        { verdict: true }
      ],
      verdict: {
        say: "본 법정은 재고 사고가 <b>예외 없이 틀리는 코드 세 가지</b>가 겹친 것이라고 판단합니다. 고친 코드로 재고를 다시 정리하도록 선고합니다. 이상, 폐정!",
        quote: "copy()는 얕은 복사라 안쪽을 고치면 백업도 바뀐다. 리스트를 돌면서 지우면 예외 없이 건너뛴다. get의 기본값은 저장되지 않는다. 세 경우 모두 예외가 나지 않으므로, 깨끗한 로그를 믿지 말고 deepcopy, 컴프리헨션, defaultdict로 고친 뒤 경계 데이터로 결과 값을 확인한다.",
        clues: [
          "백업은 <code>copy.deepcopy</code> (1화)",
          "지울 땐 컴프리헨션으로 새로 (2화)",
          "없는 키는 <code>defaultdict</code> (3화)",
          "<code>sort</code>는 None, 제너레이터는 일회용 (4화)",
          "깨끗한 로그는 맞다는 증거가 아니다"
        ]
      }
    }
  ]
};
