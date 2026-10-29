// Java 2단계 — 컬렉션 법정 원고
// 빌드: node tools/build-packs.js → packs/java-collections.json
// 실행 결과 증거(run)는 tools/verify-run.js가 JDK로 실제로 돌려서 확인한다 (import java.util.* 자동 포함).
const { ev, runEv, spec, COMMON } = require("./_helpers");

// 1화에서 쓰는 Point 클래스들 (카드에 그대로 보인다)
const POINT = `static class Point {
    int x, y;
    Point(int x, int y) { this.x = x; this.y = y; }
}`;
const POINT_EQ = `static class Point {
    int x, y;
    Point(int x, int y) { this.x = x; this.y = y; }
    @Override public boolean equals(Object o) {
        return o instanceof Point p && p.x == x && p.y == y;
    }
}`;

module.exports = {
  format: "code-court/v1",
  id: "java-collections",
  title: "Java 컬렉션 법정",
  language: "Java",
  blurb: "2단계. HashMap 키, 반복 중 삭제, Arrays.asList, HashMap의 순서. 테스트에서만 통과하는 함정들을 반박해요.",
  lead: "2단계는 컬렉션이에요. 이번 증인은 ‘테스트해 봤는데 됐어요’를 자주 말합니다. 그 테스트가 왜 우연히 통과했는지까지 밝혀 보세요. 실행 결과는 모두 JDK 21로 실제로 돌린 값이에요.",
  commonCharacters: COMMON,
  cases: [
    /* ---------------- 1화 ---------------- */
    {
      id: "c1", ep: "1화 · HashMap 키", title: "같은 좌표, 없는 가게 사건",
      blurb: "가게를 좌표로 저장했는데, 같은 좌표로 찾으면 ‘가게 없음’이 뜬다.",
      characters: { dev: ["🗺️", "지도앱 (개발자)"] },
      evidence: {
        code: ev("📄", "코드", "가게 저장·검색 코드", "지도 앱에서 좌표로 가게를 찾는 부분.", `${POINT}

Map<Point, String> shops = new HashMap<>();
shops.put(new Point(3, 5), "분식집");

// 사용자가 지도에서 (3, 5)를 누르면
String shop = shops.get(new Point(3, 5));`),
        run_same: runEv("단정해의 테스트", "저장할 때 쓴 Point 객체를 그대로 다시 넣어 찾아 본 결과.", `Map<Point, String> shops = new HashMap<>();
Point p = new Point(3, 5);
shops.put(p, "분식집");
System.out.println(shops.get(p));`, "분식집", POINT),
        run_get: runEv("실제 검색 결과", "실제 앱처럼 새 Point(3, 5)를 만들어 찾아 본 결과.", `Map<Point, String> shops = new HashMap<>();
shops.put(new Point(3, 5), "분식집");
System.out.println(shops.get(new Point(3, 5)));`, "null", POINT),
        spec_hash: spec("HashMap이 키를 찾는 법", "HashMap과 Object 문서의 규칙 요약.", `1. 키의 hashCode()로 어느 칸(버킷)에 있는지 먼저 찾는다
2. 그 칸 안에서 equals()로 같은 키인지 확인한다
Object가 물려주는 기본 equals는 '같은 객체인지', 기본 hashCode도 객체마다 다르다.
규약: equals가 같다고 하는 두 객체는 hashCode도 같아야 한다.`),
        run_eq: runEv("equals만 재정의한 결과", "x, y가 같으면 같다고 equals만 재정의한 Point로 찾아 본 결과.", `Map<Point, String> shops = new HashMap<>();
shops.put(new Point(3, 5), "분식집");
System.out.println(shops.get(new Point(3, 5)));`, "null", POINT_EQ),
        run_fix: runEv("record로 만든 결과", "Point를 record로 바꿔서 찾아 본 결과. record는 equals와 hashCode를 필드 기준으로 함께 만들어 준다.", `Map<Point, String> shops = new HashMap<>();
shops.put(new Point(3, 5), "분식집");
System.out.println(shops.get(new Point(3, 5)));`, "분식집", `record Point(int x, int y) {}`),
        run_record: runEv("record가 만들어 주는 것", "record Point(int x, int y) {} 한 줄만 쓰고, 안을 비워 둔 채 써 본 결과. 컴파일러가 private final 필드, 생성자, x()·y() 접근자, 모든 필드 기준의 equals·hashCode·toString을 자동으로 만든다. setter는 없다 (값을 바꿀 수 없다).", `// 생성자: 자동
Point a = new Point(3, 5);
Point b = new Point(3, 5);
// 접근자: getX()가 아니라 x()
System.out.println(a.x() + ", " + a.y());
// toString: 자동
System.out.println(a);
// equals, hashCode: x, y 기준
System.out.println(a.equals(b));
System.out.println(a.hashCode() == b.hashCode());`, "3, 5\nPoint[x=3, y=5]\ntrue\ntrue", `record Point(int x, int y) {}`),
        twostep: ev("📌", "추리", "두 단계 검색", "조합 결과: HashMap은 equals부터 보지 않는다. 먼저 hashCode로 칸을 고르고, 그 칸 안에서만 equals로 비교한다.\nequals만 재정의하면 새 Point(3, 5)의 hashCode는 여전히 객체마다 달라서, 엉뚱한 칸을 찾아가고 equals는 불려 보지도 못한다.", `new Point(3, 5).hashCode()  → 저장한 Point와 다른 값 → 다른 칸
→ equals를 재정의해도 비교할 기회가 없다 → null`)
      },
      script: [
        { say: "judge", t: "‘같은 좌표, 없는 가게 사건’의 재판을 시작합니다." },
        { say: "dev", t: "지도에서 (3, 5)에 분식집을 저장했어요. 그런데 똑같이 (3, 5)를 누르면 <b>‘가게 없음’</b>이래요!" },
        { say: "wit", t: "좌표를 키로 HashMap에 넣었어요. 제가 테스트했을 땐 잘 찾았다고요." },
        { gain: ["code", "run_same", "run_get", "spec_hash", "run_eq"], t: "법정 기록에 증거 5개가 들어왔다." },
        { cross: "c1a", title: "증언 ① 같은 좌표면 찾는다", who: "wit",
          lines: [
            { t: "가게는 좌표 Point를 키로 HashMap에 저장해요.",
              press: [["wit", "좌표가 키, 가게 이름이 값이죠."], ["me", "(맞다. 키가 Point라는 게 중요하다.)"]] },
            { t: "제가 테스트할 때는 저장한 좌표로 찾으니 분식집이 잘 나왔어요.",
              press: [["wit", "shops.get(p) 하니까 바로 나오던데요."], ["me", "(그 p는 저장할 때 쓴 바로 그 객체였다. 실제 앱도 그럴까?)"]] },
            { t: "그러니 같은 좌표 (3, 5)로 찾으면 언제나 가게가 나옵니다.",
              press: [["wit", "3은 3이고 5는 5니까요."], ["me", "(실제 앱은 누를 때마다 Point를 새로 만든다. 그렇게 돌려 본 기록이 있다.)"]] }
          ],
          answer: { line: 2, ev: "run_get" },
          alt: { line: 2, ev: "spec_hash", say: [["me", "HashMap은 hashCode와 equals로 키를 찾아요. Point는 둘 다 재정의하지 않았고요."], ["wit", "어려운 규칙은 됐고요, 제 테스트는 잘 찾았다니까요!"], ["me", "(실제 앱처럼 새 Point로 찾은 결과를 보여 주자.)"]] },
          hint: "실제 앱처럼 Point를 새로 만들어 찾아 본 기록이 있다.",
          win: [
            ["me", "실제 앱처럼 <code>new Point(3, 5)</code>를 새로 만들어 찾으면 <b>null</b>이에요. 좌표는 같아도 저장한 것과 <b>다른 객체</b>니까요."],
            ["me", "증인의 테스트는 저장할 때 쓴 객체를 그대로 다시 넣었기 때문에 통과한 거예요."],
            ["witSweat", "으윽…! 그, 그럼 equals만 재정의하면 되겠네요. x, y가 같으면 같다고!"],
            ["judge", "변호인, HashMap이 키를 어떻게 찾는지 밝혀 보세요."]
          ] },
        { combine: ["spec_hash", "run_eq"], result: "twostep",
          t: "equals를 재정의했는데도 null이 나왔다.\nHashMap이 키를 찾는 규칙과 그 실행 결과를 조합해 보자.",
          wrong: "그 둘로는 이유가 안 나온다. HashMap이 키를 찾는 순서와, equals만 고쳤을 때의 결과를 나란히 놓아 보자.",
          got: "HashMap은 <b>hashCode로 칸부터</b> 고르고, 그 칸 안에서만 equals…!\n새 증거 <b>📌 두 단계 검색</b>을 얻었다." },
        { cross: "c1b", title: "증언 ② equals만 있으면 된다", who: "witSweat",
          lines: [
            { t: "equals 하나만 재정의하면, HashMap도 같은 좌표를 찾아 줍니다.",
              press: [["wit", "같다고 판단하는 게 equals잖아요."], ["me", "(같다고 판단하는 건 맞다. 그런데 HashMap이 equals까지 가기는 할까?)"]] },
            { t: "hashCode는 성능용이라, 안 건드려도 결과는 똑같아요.",
              press: [["wit", "빨리 찾으려고 쓰는 거잖아요."], ["me", "(빨리 찾는 용도라는 건 맞다. 그래서 칸을 고르는 데 쓴다.)"]] },
            { t: "이제 지도 문제는 끝났습니다.",
              press: [["wit", "배포만 하면 돼요."], ["me", "(배포 전에 확인할 게 있다.)"]] }
          ],
          answer: { line: 0, ev: "twostep" },
          alt: { line: 0, ev: "run_eq", say: [["me", "equals만 재정의한 Point로 돌려 봐도 <b>null</b>이에요."], ["witSweat", "그, 그건 뭔가 다른 이유겠죠! equals가 같다고 하는데 왜 못 찾아요!"], ["me", "(왜 못 찾는지를 설명하는 추리를 들이밀자.)"]] },
          hint: "HashMap은 equals보다 먼저 무엇을 보지? 조합한 추리를 떠올려 보자.",
          win: [
            ["me", "HashMap은 먼저 <b>hashCode로 칸</b>을 고르고, 그 칸 안에서만 equals로 비교해요. hashCode가 객체마다 다르면 엉뚱한 칸을 찾아가서, equals는 불려 보지도 못해요."],
            ["me", "그래서 규약이 있어요. <b>equals가 같으면 hashCode도 같아야</b> 해요. 둘은 같은 기준(x, y)으로 함께 재정의해야 합니다."],
            ["witSweat", "으아악─!!"]
          ] },
        { choice: "judge", t: "Point를 HashMap 키로 쓰려면 어떻게 해야 합니까?",
          options: [
            { t: "hashCode만 x, y 기준으로 재정의한다", fb: "같은 칸은 찾아가지만, 기본 equals는 같은 객체인지를 비교해서 여전히 null이다." },
            { t: "HashMap 대신 TreeMap을 쓴다", fb: "TreeMap은 키를 정렬해야 해서, 비교 방법이 없는 Point를 넣으면 ClassCastException이 난다." },
            { t: "equals와 hashCode를 같은 기준(x, y)으로 함께 재정의한다. 또는 Point를 record로 만든다", ok: true },
            { t: "get 대신 containsKey로 먼저 확인한다", fb: "containsKey도 똑같이 hashCode와 equals로 찾는다. 결과는 false다." }
          ],
          win: [
            ["judge", "equals와 hashCode는 한 쌍이군요."],
            ["me", "네. 손으로 쓰기 번거로우면 <code>record Point(int x, int y)</code>로 만들면 둘 다 필드 기준으로 만들어져요. 실제로 돌려 보면 분식집이 나와요."]
          ] },
        { gain: ["run_fix", "run_record"], t: "record로 고친 코드를 실제로 돌려 본 결과와, record가 안에 무엇을 만들어 주는지 확인한 결과가 법정 기록에 들어왔다." },
        { verdict: true }
      ],
      verdict: {
        say: "본 법정은 ‘가게 없음’의 원인이 <b>equals와 hashCode를 재정의하지 않은 키</b>라고 판단합니다. 분식집은 그 자리에 있었습니다!",
        quote: "HashMap은 hashCode로 칸을 고른 다음 그 칸 안에서 equals로 키를 비교한다. 직접 만든 클래스를 키로 쓰면서 둘을 재정의하지 않으면 같은 값이라도 다른 객체라 못 찾고, equals만 재정의하면 엉뚱한 칸을 찾아가 역시 못 찾는다. equals와 hashCode를 같은 기준으로 함께 재정의하거나 record를 쓴다.",
        clues: [
          "HashMap: hashCode로 칸 → 그 칸에서 equals",
          "저장한 객체를 그대로 다시 넣는 테스트는 우연히 통과한다",
          "equals만 재정의해도, hashCode만 재정의해도 null",
          "정답: 둘을 같은 기준으로 함께 / <code>record Point(int x, int y)</code>",
          "record는 필드·생성자·<code>x()</code> 접근자·equals·hashCode·toString을 자동으로 만든다 (setter 없음)"
        ]
      }
    },

    /* ---------------- 2화 ---------------- */
    {
      id: "c2", ep: "2화 · 반복 중 삭제", title: "품절 상품 삭제 사건",
      blurb: "품절 상품을 지우는 코드가 테스트에선 멀쩡했는데, 실제 주문에서 앱이 멈췄다.",
      characters: { boss: ["🛒", "장바구니 (쇼핑몰 사장님)"] },
      evidence: {
        code: ev("📄", "코드", "품절 삭제 코드", "장바구니에서 품절 상품을 지우는 부분.", `for (String item : cart) {
    if (soldOut.contains(item)) {
        cart.remove(item);
    }
}`),
        run_mid: runEv("단정해의 테스트", "가운데 상품 ‘라볶이’가 품절인 경우로 돌려 본 결과.", `List<String> cart = new ArrayList<>(List.of("김밥", "라볶이", "튀김"));
for (String item : cart) {
    if (item.equals("라볶이")) cart.remove(item);
}
System.out.println(cart);`, "[김밥, 튀김]"),
        run_first: runEv("첫 상품이 품절일 때", "첫 상품 ‘김밥’이 품절인 경우로 돌려 본 결과.", `List<String> cart = new ArrayList<>(List.of("김밥", "라볶이", "튀김"));
try {
    for (String item : cart) {
        if (item.equals("김밥")) cart.remove(item);
    }
} catch (Exception e) {
    System.out.println(e.getClass().getSimpleName());
}`, "ConcurrentModificationException"),
        spec_iter: spec("for-each와 Iterator", "Iterable·ArrayList 문서의 규칙 요약.", `for-each는 내부적으로 Iterator를 쓴다: hasNext()로 남았는지 묻고, next()로 꺼낸다.
반복 도중 Iterator가 아닌 방법(list.remove)으로 리스트를 바꾸면,
다음 next()에서 ConcurrentModificationException을 던진다 (빠른 실패).
hasNext()가 false로 끝나 버리면 next()가 불리지 않아 검사할 기회도 없다.`),
        run_index: runEv("인덱스 for문으로 지운 결과", "‘라볶이’가 두 개 연속 품절일 때 인덱스 for문으로 지운 결과.", `List<String> cart = new ArrayList<>(List.of("김밥", "라볶이", "라볶이", "튀김"));
for (int i = 0; i < cart.size(); i++) {
    if (cart.get(i).equals("라볶이")) cart.remove(i);
}
System.out.println(cart);`, "[김밥, 라볶이, 튀김]"),
        run_fix: runEv("removeIf로 지운 결과", "반복 대신 removeIf로 한 번에 지운 결과.", `List<String> cart = new ArrayList<>(List.of("김밥", "라볶이", "라볶이", "튀김"));
cart.removeIf(item -> item.equals("라볶이") || item.equals("김밥"));
System.out.println(cart);`, "[튀김]"),
        luck: ev("📌", "추리", "검사할 기회가 없었던 반복", "조합 결과: 가운데 상품을 지우면 리스트가 2개로 줄고, Iterator는 ‘이미 2개를 봤다’고 판단해 hasNext()가 false가 된다.\n그래서 next()가 불리지 않아 예외를 던질 기회가 없었다. 대신 마지막 ‘튀김’은 검사조차 하지 않고 반복이 끝났다. 튀김도 품절이었다면 지워지지 않았다.", `가운데 삭제 → 크기 3 → 2, 본 개수 2 → hasNext() false → 반복 종료
→ 예외는 없지만 마지막 상품은 확인하지 않음`)
      },
      script: [
        { say: "judge", t: "‘품절 상품 삭제 사건’의 재판을 시작합니다." },
        { say: "boss", t: "품절 상품을 장바구니에서 빼는 기능이 있어요. 그런데 김밥이 품절된 날, 주문 화면이 <b>통째로 멈췄어요</b>!" },
        { say: "wit", t: "그 코드는 테스트했어요. 라볶이를 품절시켜 봤더니 깔끔하게 지워졌다고요." },
        { gain: ["code", "run_mid", "run_first", "spec_iter", "run_index"], t: "법정 기록에 증거 5개가 들어왔다." },
        { cross: "c2a", title: "증언 ① 테스트를 통과했다", who: "wit",
          lines: [
            { t: "품절 상품은 for-each로 돌면서 cart.remove로 지워요.",
              press: [["wit", "제일 간단한 방법이죠."], ["me", "(반복하면서 그 리스트를 바로 고친다. 괜찮을까?)"]] },
            { t: "어떤 상품이 품절돼도, 이 코드로 깔끔하게 지워집니다.",
              press: [["wit", "품절 목록에 있으면 지우니까요."], ["me", "(‘어떤 상품이든’? 테스트는 가운데 상품 하나뿐이었다.)"]] },
            { t: "가운데 상품 라볶이로 테스트했더니 예외 없이 잘 지워졌거든요.",
              press: [["wit", "결과도 [김밥, 튀김]으로 딱 맞았어요."], ["me", "(그 결과는 맞다. 그럼 첫 상품이 품절이면?)"]] }
          ],
          answer: { line: 1, ev: "run_first" },
          alt: { line: 1, ev: "spec_iter", say: [["me", "for-each 도중에 list.remove로 리스트를 바꾸면 예외가 날 수 있다고 문서에 있어요."], ["wit", "제 테스트에선 안 났다니까요!"], ["me", "(테스트와 다른 경우를 실제로 돌려 본 결과를 보여 주자.)"]] },
          hint: "가운데가 아닌 상품이 품절일 때 돌려 본 기록이 있다.",
          win: [
            ["me", "첫 상품 김밥이 품절이면 <b>ConcurrentModificationException</b>이 나요. 원고의 주문 화면이 멈춘 이유예요."],
            ["witSweat", "네? 가운데는 되고 첫 번째는 안 된다고요? 그게 말이 돼요?!"],
            ["judge", "변호인, 가운데 상품은 왜 통과했는지 밝혀 보세요."]
          ] },
        { combine: ["run_mid", "spec_iter"], result: "luck",
          t: "가운데 상품은 왜 예외 없이 지워졌을까?\n테스트 결과와 for-each의 동작 규칙을 조합해 보자.",
          wrong: "그 둘로는 이유가 안 나온다. 통과했던 테스트와, 반복 중에 예외가 나는 조건을 나란히 놓아 보자.",
          got: "가운데를 지우자 <b>hasNext()가 false</b>, 검사할 기회가 없었다…!\n새 증거 <b>📌 검사할 기회가 없었던 반복</b>을 얻었다." },
        { cross: "c2b", title: "증언 ② 인덱스 for문이면 안전하다", who: "witSweat",
          lines: [
            { t: "좋아요, for-each가 문제라는 건 인정할게요.",
              press: [["wit", "Iterator가 예민하네요."], ["me", "(예민한 게 아니라, 잘못된 변경을 바로 알려 주는 거다.)"]] },
            { t: "인덱스 for문으로 바꾸면 Iterator를 안 쓰니까, 품절 상품을 하나도 빠짐없이 지울 수 있어요.",
              press: [["wit", "cart.remove(i). 예외도 안 나요."], ["me", "(예외는 안 난다. 그런데 ‘빠짐없이’일까? 연속으로 품절된 경우를 돌려 본 기록이 있다.)"]] },
            { t: "앞으로 리스트 삭제는 전부 인덱스 for문으로 통일합시다.",
              press: [["wit", "규칙으로 정하죠."], ["me", "(규칙으로 정하기 전에 확인할 게 있다.)"]] }
          ],
          answer: { line: 1, ev: "run_index" },
          alt: { line: 0, ev: "luck", say: [["me", "가운데 상품 테스트도 사실 운이었어요. 마지막 튀김은 검사도 안 하고 반복이 끝났거든요."], ["witSweat", "그러니까 for-each를 버리고 인덱스 for문으로 가자는 거죠!"], ["me", "(인덱스 for문이 정말 빠짐없이 지우는지 보여 주자.)"]] },
          hint: "같은 상품이 연속으로 품절일 때 인덱스 for문으로 지워 본 기록이 있다.",
          win: [
            ["me", "라볶이 두 개가 연속으로 품절이면, 인덱스 for문은 <b>하나를 남겨요</b>. 결과가 [김밥, 라볶이, 튀김]이에요."],
            ["me", "i번째를 지우면 뒤 상품이 한 칸씩 당겨지는데, 다음 반복에서 i가 하나 늘어나서 당겨진 상품을 <b>건너뛰거든요</b>. 예외가 없어서 더 위험해요."],
            ["witSweat", "으아악─!!"]
          ] },
        { choice: "judge", t: "품절 상품은 어떻게 지워야 합니까?",
          options: [
            { t: "for-each는 그대로 두고, 예외가 나면 try-catch로 무시한다", fb: "예외를 무시하면 지우다 만 장바구니가 남는다." },
            { t: "for-each 안에서 하나를 지우면 바로 break로 빠져나온다", fb: "예외는 피하지만 품절 상품이 여러 개면 하나만 지워진다." },
            { t: "cart.removeIf(item -> soldOut.contains(item)) 처럼 한 번에 지운다 (또는 Iterator의 remove 사용)", ok: true },
            { t: "인덱스 for문으로 cart.remove(i)를 쓴다", fb: "지울 때마다 뒤 상품이 당겨져서, 연속으로 품절된 상품을 건너뛴다." }
          ],
          win: [
            ["judge", "반복과 삭제를 따로 하지 말고, 한 번에."],
            ["me", "네. <code>removeIf</code>는 조건에 맞는 걸 안전하게 한 번에 지워요. 직접 반복해야 하면 <code>Iterator</code>의 <code>remove()</code>를 쓰면 돼요."]
          ] },
        { gain: ["run_fix"], t: "removeIf로 고친 코드를 실제로 돌려 본 결과가 법정 기록에 들어왔다." },
        { verdict: true }
      ],
      verdict: {
        say: "본 법정은 주문 화면이 멈춘 원인이 <b>for-each 도중 리스트를 직접 지운 것</b>이라고 판단합니다. 가운데 상품 테스트는 운이었습니다!",
        quote: "for-each는 Iterator로 돈다. 반복 중에 list.remove로 리스트를 바꾸면 다음 next()에서 ConcurrentModificationException이 난다. 가운데 상품을 지울 때 통과한 건 반복이 그 자리에서 끝나 검사할 기회가 없었기 때문이고, 그 대신 마지막 상품을 건너뛰었다. 인덱스 for문도 당겨진 원소를 건너뛴다. removeIf나 Iterator.remove를 쓴다.",
        clues: [
          "for-each 중 <code>list.remove</code> → ConcurrentModificationException",
          "가운데 삭제는 hasNext()가 false가 되어 우연히 통과 (마지막 상품은 검사 안 함)",
          "인덱스 for문 삭제는 연속된 원소를 건너뛴다",
          "정답: <code>removeIf</code> 또는 <code>Iterator.remove()</code>"
        ]
      }
    },

    /* ---------------- 3화 ---------------- */
    {
      id: "c3", ep: "3화 · Arrays.asList", title: "이름만 ArrayList 사건",
      blurb: "메뉴판에 신메뉴를 추가하자 앱이 죽었다. 분명 ArrayList였는데.",
      characters: { cook: ["🍳", "분식왕 (사장님)"] },
      evidence: {
        code: ev("📄", "코드", "메뉴판 코드", "메뉴 목록을 만들고 신메뉴를 추가하는 부분.", `String[] base = {"김밥", "라면"};
List<String> menu = Arrays.asList(base);
menu.add("튀김");   // 신메뉴 추가`),
        run_add: runEv("신메뉴 추가 실행 결과", "Arrays.asList로 만든 메뉴에 add를 해 본 결과.", `List<String> menu = Arrays.asList("김밥", "라면");
try {
    menu.add("튀김");
} catch (Exception e) {
    System.out.println(e.getClass().getSimpleName());
}`, "UnsupportedOperationException"),
        run_class: runEv("클래스 이름 확인", "Arrays.asList가 돌려준 리스트와 보통 ArrayList의 실제 클래스 이름.", `System.out.println(Arrays.asList("김밥").getClass().getName());
System.out.println(new ArrayList<String>().getClass().getName());`, "java.util.Arrays$ArrayList\njava.util.ArrayList"),
        spec_aslist: spec("Arrays.asList", "Arrays 문서의 규칙 요약.", `Arrays.asList(배열)은 그 배열을 감싼 '고정 크기' 리스트를 돌려준다.
- 크기를 바꾸는 add, remove는 할 수 없다 (UnsupportedOperationException)
- 값을 바꾸는 set은 된다
- 리스트와 원래 배열은 연결돼 있어서, 한쪽을 바꾸면 다른 쪽도 바뀐다`),
        run_view: runEv("배열을 바꿔 본 결과", "Arrays.asList로 만든 뒤 원래 배열과 리스트를 각각 바꿔 본 결과.", `String[] base = {"김밥", "라면"};
List<String> menu = Arrays.asList(base);
base[0] = "쫄면";
System.out.println(menu);
menu.set(1, "우동");
System.out.println(base[1]);`, "[쫄면, 라면]\n우동"),
        run_fix: runEv("새 ArrayList로 감싼 결과", "Arrays.asList 결과를 new ArrayList로 복사한 뒤 추가해 본 결과.", `String[] base = {"김밥", "라면"};
List<String> menu = new ArrayList<>(Arrays.asList(base));
menu.add("튀김");
base[0] = "쫄면";
System.out.println(menu);`, "[김밥, 라면, 튀김]"),
        wrapper: ev("📌", "추리", "배열을 감싼 리스트", "조합 결과: Arrays.asList가 돌려주는 건 java.util.ArrayList가 아니라, Arrays 안에 따로 있는 같은 이름의 클래스(Arrays$ArrayList)다.\n이건 배열을 감싼 고정 크기 리스트라서 크기를 바꾸는 add는 안 되고, 원래 배열과 계속 연결돼 있다.", `java.util.Arrays$ArrayList  ≠  java.util.ArrayList
배열을 감싼 고정 크기 리스트 → add 불가, 배열과 연결`)
      },
      script: [
        { say: "judge", t: "‘이름만 ArrayList 사건’의 재판을 시작합니다." },
        { say: "cook", t: "메뉴판에 신메뉴 튀김을 추가했더니 앱이 <b>그대로 죽었어요</b>. 김밥이랑 라면만 있을 땐 멀쩡했는데!" },
        { say: "wit", t: "메뉴는 <code>Arrays.asList</code>로 만들었어요. 이름에도 ArrayList가 들어가잖아요. 추가가 안 될 리가 없죠." },
        { gain: ["code", "run_add", "run_class", "spec_aslist", "run_view"], t: "법정 기록에 증거 5개가 들어왔다." },
        { cross: "c3a", title: "증언 ① 이름이 ArrayList다", who: "wit",
          lines: [
            { t: "Arrays.asList가 돌려주는 건 ArrayList라서, add로 얼마든지 늘릴 수 있어요.",
              press: [["wit", "ArrayList는 늘어나는 배열이잖아요."], ["me", "(java.util.ArrayList라면 그렇다. 정말 그 ArrayList일까?)"]] },
            { t: "메뉴는 처음에 김밥, 라면 두 개로 시작해요.",
              press: [["wit", "기본 메뉴죠."], ["me", "(여기까진 문제없다.)"]] },
            { t: "앱이 죽은 건 서버 메모리가 부족해서예요.",
              press: [["wit", "요즘 손님이 많아서요."], ["me", "(메모리 탓을 하기 전에, add를 직접 해 본 기록이 있다.)"]] }
          ],
          answer: { line: 0, ev: "run_add" },
          alt: { line: 0, ev: "run_class", say: [["me", "클래스 이름을 찍어 보면 <code>java.util.Arrays$ArrayList</code>예요. 우리가 아는 ArrayList가 아니에요."], ["wit", "이름에 ArrayList가 들어가잖아요! 그럼 ArrayList죠!"], ["me", "(add를 실제로 해 본 결과를 보여 주자.)"]] },
          hint: "Arrays.asList로 만든 리스트에 실제로 add를 해 본 기록이 있다.",
          win: [
            ["me", "Arrays.asList로 만든 메뉴에 add를 하면 <b>UnsupportedOperationException</b>이 나요. 앱이 죽은 이유예요."],
            ["witSweat", "크윽…! 그, 그럼 add만 안 쓰면 되죠. 원래 배열이랑은 상관없는 리스트니까 다른 건 안전해요!"],
            ["judge", "변호인, 그 리스트의 정체를 밝혀 보세요."]
          ] },
        { combine: ["run_class", "spec_aslist"], result: "wrapper",
          t: "Arrays.asList가 돌려준 리스트는 대체 무엇일까?\n실제 클래스 이름과 Arrays 문서의 규칙을 조합해 보자.",
          wrong: "그 둘로는 정체가 안 나온다. 실제 클래스 이름과, Arrays.asList가 무엇을 돌려준다고 적혀 있는지를 나란히 놓아 보자.",
          got: "Arrays 안의 <b>다른 ArrayList</b>, 배열을 감싼 <b>고정 크기</b> 리스트…!\n새 증거 <b>📌 배열을 감싼 리스트</b>를 얻었다." },
        { cross: "c3b", title: "증언 ② 배열과는 상관없다", who: "witSweat",
          lines: [
            { t: "좋아요, 크기는 못 바꾼다고 칩시다.",
              press: [["wit", "고정 크기라니 좀 답답하네요."], ["me", "(고정 크기인 이유가 있다. 배열을 감싸고 있으니까.)"]] },
            { t: "그래도 메뉴판 화면에 쓰기엔 충분하잖아요.",
              press: [["wit", "보여 주기만 하면 되니까요."], ["me", "(보여 주기만 한다면 그렇다. 그런데 원래 배열을 다른 곳에서 바꾸면?)"]] },
            { t: "Arrays.asList는 원래 배열을 복사한 새 리스트라서, 배열을 바꿔도 메뉴판은 그대로예요.",
              press: [["wit", "복사본이니까요."], ["me", "(복사본일까? 배열을 바꿔 본 기록이 있다.)"]] }
          ],
          answer: { line: 2, ev: "run_view" },
          alt: { line: 2, ev: "wrapper", say: [["me", "Arrays.asList는 배열을 <b>감싼</b> 리스트예요. 복사본이 아니에요."], ["witSweat", "감쌌든 뭐든, 복사한 거나 마찬가지라니까요!"], ["me", "(배열을 바꿨을 때 메뉴판이 어떻게 되는지 보여 주자.)"]] },
          hint: "원래 배열과 리스트를 바꿔 본 기록이 있다.",
          win: [
            ["me", "배열의 첫 칸을 쫄면으로 바꾸니 메뉴판도 <b>[쫄면, 라면]</b>이 됐어요. 반대로 메뉴판을 바꾸면 배열도 바뀌고요."],
            ["me", "복사본이 아니라 배열을 <b>감싼</b> 리스트라서, 둘은 계속 연결돼 있어요. 다른 코드가 배열을 고치면 메뉴판이 몰래 바뀌는 거죠."],
            ["witSweat", "으아악─!!"]
          ] },
        { choice: "judge", t: "메뉴판은 어떻게 만들어야 합니까?",
          options: [
            { t: "Arrays.asList 그대로 쓰고, 신메뉴는 배열을 새로 만들어 다시 asList 한다", fb: "추가할 때마다 배열을 다시 만드는 셈이고, 배열과 연결되는 문제도 그대로다." },
            { t: "List.of(\"김밥\", \"라면\")으로 바꾼다", fb: "List.of는 아예 바꿀 수 없는 리스트라서 add도 set도 UnsupportedOperationException이 난다." },
            { t: "new ArrayList<>(Arrays.asList(base))처럼 새 ArrayList로 복사해서 쓴다", ok: true },
            { t: "add 전에 try-catch로 감싸서 실패하면 넘어간다", fb: "신메뉴가 조용히 빠질 뿐이다." }
          ],
          win: [
            ["judge", "늘릴 리스트는 진짜 ArrayList로 복사해서."],
            ["me", "네. 복사한 리스트는 배열과 연결도 끊기고 add도 돼요. 실제로 돌려 보면 배열을 바꿔도 메뉴판은 [김밥, 라면, 튀김]이에요."]
          ] },
        { gain: ["run_fix"], t: "새 ArrayList로 고친 코드를 실제로 돌려 본 결과가 법정 기록에 들어왔다." },
        { verdict: true }
      ],
      verdict: {
        say: "본 법정은 앱이 죽은 원인이 <b>Arrays.asList의 고정 크기 리스트에 add를 한 것</b>이라고 판단합니다. 서버 메모리는 무죄!",
        quote: "Arrays.asList는 java.util.ArrayList가 아니라, 배열을 감싼 고정 크기 리스트(Arrays$ArrayList)를 돌려준다. 그래서 add와 remove는 UnsupportedOperationException이 나고, 원래 배열과 연결돼 있어 한쪽을 바꾸면 다른 쪽도 바뀐다. 늘려야 하는 리스트는 new ArrayList<>(Arrays.asList(...))로 복사해서 쓴다.",
        clues: [
          "<code>Arrays.asList</code> → <code>java.util.Arrays$ArrayList</code> (이름만 같다)",
          "고정 크기: add/remove 불가, set은 가능",
          "원래 배열과 연결: 배열을 바꾸면 리스트도 바뀐다",
          "<code>List.of</code>는 set까지 막힌 불변 리스트",
          "정답: <code>new ArrayList<>(Arrays.asList(base))</code>"
        ]
      }
    },

    /* ---------------- 4화 ---------------- */
    {
      id: "c4", ep: "4화 · Map의 순서", title: "가입 순서가 뒤죽박죽 사건",
      blurb: "가입한 순서대로 보여 주기로 했는데, 회원 목록 순서가 엉망이다.",
      characters: { club: ["🏸", "동호회장 (원고)"] },
      evidence: {
        code: ev("📄", "코드", "회원 목록 코드", "가입한 순서대로 회원을 저장하고 보여 주는 부분.", `Map<String, Integer> members = new HashMap<>();
members.put("민지", 1);   // 1번째 가입
members.put("철수", 2);
members.put("영희", 3);
members.put("도윤", 4);
members.put("하준", 5);
System.out.println(members.keySet());`),
        run_abc: runEv("단정해의 테스트", "a, b, c 순서로 넣고 출력해 본 결과.", `Map<String, Integer> m = new HashMap<>();
m.put("a", 1);
m.put("b", 2);
m.put("c", 3);
System.out.println(m.keySet());`, "[a, b, c]"),
        run_real: runEv("실제 회원 목록", "실제 회원 이름을 가입 순서대로 넣고 출력해 본 결과.", `Map<String, Integer> m = new HashMap<>();
for (String name : List.of("민지", "철수", "영희", "도윤", "하준")) m.put(name, 1);
System.out.println(m.keySet());`, "[철수, 하준, 민지, 영희, 도윤]"),
        spec_order: spec("Map과 순서", "HashMap·LinkedHashMap·TreeMap 문서의 규칙 요약.", `HashMap       : 순서를 보장하지 않는다. 키의 해시 값이 정한 칸 순서로 나온다
LinkedHashMap : 넣은 순서(가입 순서)를 기억한다
TreeMap       : 키를 정렬한 순서(가나다, abc)로 나온다`),
        run_cab: runEv("순서를 바꿔 넣은 테스트", "a, b, c를 c, a, b 순서로 넣고 출력해 본 결과.", `Map<String, Integer> m = new HashMap<>();
m.put("c", 1);
m.put("a", 2);
m.put("b", 3);
System.out.println(m.keySet());`, "[a, b, c]"),
        run_tree: runEv("TreeMap 결과", "실제 회원 이름을 TreeMap에 가입 순서대로 넣은 결과.", `Map<String, Integer> m = new TreeMap<>();
for (String name : List.of("민지", "철수", "영희", "도윤", "하준")) m.put(name, 1);
System.out.println(m.keySet());`, "[도윤, 민지, 영희, 철수, 하준]"),
        run_fix: runEv("LinkedHashMap 결과", "실제 회원 이름을 LinkedHashMap에 가입 순서대로 넣은 결과.", `Map<String, Integer> m = new LinkedHashMap<>();
for (String name : List.of("민지", "철수", "영희", "도윤", "하준")) m.put(name, 1);
System.out.println(m.keySet());`, "[민지, 철수, 영희, 도윤, 하준]"),
        luck: ev("📌", "추리", "우연히 맞은 순서", "조합 결과: a, b, c를 c, a, b 순서로 넣어도 HashMap은 [a, b, c]로 내놓았다. 넣은 순서를 기억한 게 아니라, 해시 값(97, 98, 99)이 정한 칸 순서가 마침 알파벳 순서와 같았을 뿐이다.\n그래서 a, b, c 테스트는 ‘순서를 지킨다’는 증거가 될 수 없다.", `"a", "b", "c"의 해시 값 = 97, 98, 99 → 칸 순서 = 알파벳 순서
→ 넣은 순서와 상관없이 [a, b, c]`)
      },
      script: [
        { say: "judge", t: "‘가입 순서가 뒤죽박죽 사건’의 재판을 시작합니다." },
        { say: "club", t: "회원 목록을 <b>가입한 순서대로</b> 보여 주기로 했어요. 그런데 첫 회원 민지가 세 번째에 있고, 철수가 맨 위에 있어요!" },
        { say: "wit", t: "HashMap은 넣은 순서대로 나와요. a, b, c로 테스트해서 확인했다니까요." },
        { gain: ["code", "run_abc", "run_real", "spec_order", "run_cab", "run_tree"], t: "법정 기록에 증거 6개가 들어왔다." },
        { cross: "c4a", title: "증언 ① HashMap은 넣은 순서를 기억한다", who: "wit",
          lines: [
            { t: "회원은 이름을 키로 HashMap에 가입 순서대로 넣어요.",
              press: [["wit", "민지, 철수, 영희, 도윤, 하준 순서로요."], ["me", "(넣는 순서는 맞다. 나오는 순서는?)"]] },
            { t: "a, b, c 순서로 넣었더니 [a, b, c]로 나왔어요.",
              press: [["wit", "실행 결과로 봤어요."], ["me", "(결과는 맞다. 그게 ‘넣은 순서’ 때문일까?)"]] },
            { t: "그러니 HashMap은 넣은 순서를 기억합니다. 회원 목록도 가입 순서대로 나오죠.",
              press: [["wit", "a, b, c가 증명했잖아요."], ["me", "(실제 회원 이름으로 돌려 본 기록이 있다.)"]] }
          ],
          answer: { line: 2, ev: "run_real" },
          alt: { line: 2, ev: "spec_order", say: [["me", "문서에는 HashMap이 순서를 보장하지 않는다고 적혀 있어요."], ["wit", "제 테스트에선 순서대로 나왔다고요!"], ["me", "(실제 회원 이름으로 돌린 결과를 보여 주자.)"]] },
          hint: "실제 회원 이름으로 돌려 본 기록이 있다.",
          win: [
            ["me", "실제 회원 이름을 가입 순서대로 넣으면 <b>[철수, 하준, 민지, 영희, 도윤]</b>이 나와요. 가입 순서와 전혀 달라요."],
            ["witSweat", "그, 그럼 a, b, c는 왜 순서대로 나왔죠?!"],
            ["judge", "변호인, a, b, c 테스트가 통과한 이유를 밝혀 보세요."]
          ] },
        { combine: ["run_abc", "run_cab"], result: "luck",
          t: "a, b, c는 왜 순서대로 나왔을까?\n순서대로 넣은 테스트와, 순서를 바꿔 넣은 테스트를 조합해 보자.",
          wrong: "그 둘로는 이유가 안 나온다. a, b, c를 서로 다른 순서로 넣어 본 두 결과를 나란히 놓아 보자.",
          got: "c, a, b로 넣어도 <b>[a, b, c]</b>…! 넣은 순서가 아니라 <b>해시 값 순서</b>였다.\n새 증거 <b>📌 우연히 맞은 순서</b>를 얻었다." },
        { cross: "c4b", title: "증언 ② TreeMap이면 가입 순서", who: "witSweat",
          lines: [
            { t: "그럼 TreeMap을 쓰면 가입 순서대로 나오겠네요. 순서 있는 Map이니까요.",
              press: [["wit", "Tree는 정리된 느낌이잖아요."], ["me", "(TreeMap의 순서는 무엇의 순서일까? 실제로 넣어 본 기록이 있다.)"]] },
            { t: "a, b, c 테스트가 운이었다는 건 인정할게요.",
              press: [["wit", "해시 값이 마침 그랬다니."], ["me", "(테스트 값이 너무 단순하면 이런 일이 생긴다.)"]] },
            { t: "어쨌든 순서는 Map 종류만 바꾸면 해결되는 문제예요.",
              press: [["wit", "어떤 Map이든 골라 쓰면 되죠."], ["me", "(어떤 Map을 고르느냐가 바로 문제다.)"]] }
          ],
          answer: { line: 0, ev: "run_tree" },
          alt: { line: 0, ev: "spec_order", say: [["me", "TreeMap은 키를 정렬한 순서로 내놓아요."], ["witSweat", "정렬이든 뭐든 순서가 있잖아요! 가입 순서도 나오겠죠!"], ["me", "(실제 회원 이름을 넣어 본 결과를 보여 주자.)"]] },
          hint: "TreeMap에 실제 회원 이름을 넣어 본 기록이 있다.",
          win: [
            ["me", "TreeMap에 넣으면 <b>[도윤, 민지, 영희, 철수, 하준]</b>, 가나다순이에요. 가입 순서가 아니라 <b>키를 정렬한 순서</b>예요."],
            ["me", "넣은 순서를 기억하는 건 <b>LinkedHashMap</b>이에요."],
            ["witSweat", "으아악─!!"]
          ] },
        { choice: "judge", t: "회원 목록을 가입 순서대로 보여 주려면 무엇을 써야 합니까?",
          options: [
            { t: "HashMap 그대로, 테스트는 a, b, c로 계속 한다", fb: "a, b, c가 순서대로 나오는 건 해시 값 때문이다. 실제 이름에서는 섞인다." },
            { t: "TreeMap으로 바꾼다", fb: "TreeMap은 가나다순으로 정렬한다. 가입 순서가 아니다." },
            { t: "LinkedHashMap으로 바꾼다", ok: true },
            { t: "HashMap의 keySet을 출력 전에 정렬한다", fb: "정렬하면 가나다순이 될 뿐, 가입 순서는 이미 사라진 뒤다." }
          ],
          win: [
            ["judge", "넣은 순서를 기억하는 Map."],
            ["me", "네. 실제로 돌려 보면 <b>[민지, 철수, 영희, 도윤, 하준]</b>, 가입 순서 그대로예요. 그리고 테스트 값은 a, b, c처럼 너무 단순하면 우연히 통과할 수 있어요."]
          ] },
        { gain: ["run_fix"], t: "LinkedHashMap으로 고친 코드를 실제로 돌려 본 결과가 법정 기록에 들어왔다." },
        { verdict: true }
      ],
      verdict: {
        say: "본 법정은 순서가 뒤섞인 원인이 <b>순서를 보장하지 않는 HashMap</b>이라고 판단합니다. 민지는 1번 회원이 맞습니다!",
        quote: "HashMap은 키의 해시 값이 정한 칸 순서로 내놓기 때문에 넣은 순서를 보장하지 않는다. a, b, c 같은 단순한 키는 해시 값 순서가 알파벳 순서와 같아서 테스트가 우연히 통과한다. TreeMap은 키를 정렬한 순서다. 넣은 순서가 필요하면 LinkedHashMap을 쓴다.",
        clues: [
          "HashMap: 순서 보장 없음 (해시 값이 정한 칸 순서)",
          "a, b, c는 c, a, b로 넣어도 [a, b, c] → 테스트가 우연히 통과",
          "TreeMap: 키 정렬 순서 (가나다)",
          "정답: <code>LinkedHashMap</code> = 넣은 순서"
        ]
      }
    },

    /* ---------------- 보스 ---------------- */
    {
      id: "cboss", ep: "보스 · 2단계 총정리", title: "재고 대혼란 대법정",
      blurb: "주문 집계는 터지고, 품절 처리는 멈추고, 재고표는 이상하다. 개업 첫날의 재고 시스템.",
      boss: true, hard: true, trust: 3,
      characters: { owner: ["🏪", "분식왕 (원고)"] },
      evidence: {
        code: ev("📄", "코드", "재고 시스템 코드", "개업 첫날 배포한 재고 시스템의 일부.", `// ① 메뉴별 주문 수 세기
Map<String, Integer> count = new HashMap<>();
for (String menu : orders) {
    count.put(menu, count.get(menu) + 1);
}

// ② 품절 목록에 오늘 품절 추가
List<String> soldOut = Arrays.asList("김밥");
soldOut.add("튀김");

// ③ 메뉴판에서 품절 메뉴 빼기
for (String m : menuBoard) {
    if (soldOut.contains(m)) menuBoard.remove(m);
}`),
        run_npe: runEv("주문 집계 실행 결과", "① 주문 수 세기를 첫 주문으로 돌려 본 결과.", `Map<String, Integer> count = new HashMap<>();
try {
    count.put("김밥", count.get("김밥") + 1);
} catch (Exception e) {
    System.out.println(e.getClass().getSimpleName());
}
System.out.println(count.get("라면"));`, "NullPointerException\nnull"),
        spec_get: spec("Map.get과 언박싱", "Map·Integer 규칙 요약.", `map.get(키)는 키가 없으면 null을 돌려준다.
null인 Integer를 + 1 같은 계산에 쓰려고 int로 풀면(언박싱) NullPointerException이 난다.
없을 때 기본값을 쓰려면 getOrDefault(키, 0), 한 번에 더하려면 merge(키, 1, Integer::sum)`),
        run_merge: runEv("merge로 센 결과", "주문 목록을 merge로 세어 본 결과.", `Map<String, Integer> count = new LinkedHashMap<>();
for (String menu : List.of("김밥", "라면", "김밥", "튀김", "김밥")) {
    count.merge(menu, 1, Integer::sum);
}
System.out.println(count);`, "{김밥=3, 라면=1, 튀김=1}"),
        run_soldout: runEv("품절 추가 실행 결과", "② 품절 목록에 튀김을 추가해 본 결과.", `List<String> soldOut = Arrays.asList("김밥");
try {
    soldOut.add("튀김");
} catch (Exception e) {
    System.out.println(e.getClass().getSimpleName());
}`, "UnsupportedOperationException"),
        run_board: runEv("메뉴판 정리 실행 결과", "③ 품절 메뉴 빼기를 품절 목록 [김밥, 튀김]으로 돌려 본 결과.", `List<String> menuBoard = new ArrayList<>(List.of("김밥", "라면", "튀김", "어묵"));
List<String> soldOut = List.of("김밥", "튀김");
try {
    for (String m : menuBoard) {
        if (soldOut.contains(m)) menuBoard.remove(m);
    }
} catch (Exception e) {
    System.out.println(e.getClass().getSimpleName());
}`, "ConcurrentModificationException"),
        run_fixed: runEv("고친 코드 실행 결과", "판결에서 고른 방식으로 고쳐서 돌려 본 결과.", `Map<String, Integer> count = new LinkedHashMap<>();
for (String menu : List.of("김밥", "라면", "김밥")) count.merge(menu, 1, Integer::sum);
List<String> soldOut = new ArrayList<>(Arrays.asList("김밥"));
soldOut.add("튀김");
List<String> menuBoard = new ArrayList<>(List.of("김밥", "라면", "튀김", "어묵"));
menuBoard.removeIf(soldOut::contains);
System.out.println(count);
System.out.println(menuBoard);`, "{김밥=2, 라면=1}\n[라면, 어묵]"),
        nullkey: ev("📌", "추리", "없는 키는 null", "조합 결과: 처음 들어온 메뉴는 아직 Map에 없으니 count.get(menu)는 0이 아니라 null이다.\nnull에 + 1을 하려고 int로 푸는 순간 NullPointerException. ‘처음엔 0’이라는 건 Map이 아니라 사람의 기대였다.", `count.get("김밥")  → null (0이 아님)
null + 1          → 언박싱 → NullPointerException`)
      },
      script: [
        { say: "judge", t: "정숙! <b>재고 대혼란 대법정</b>을 개정합니다. 신뢰도는 <b>3</b>, 첫 실수에는 힌트가 없습니다." },
        { say: "owner", t: "개업 첫날이었어요. 첫 주문부터 집계가 <b>멈췄고</b>, 품절 등록은 <b>에러</b>가 났고, 메뉴판 정리는 <b>앱을 멈춰 세웠어요</b>!" },
        { say: "wit", t: "재고 시스템은 제가 리뷰했어요. 이번엔 1단계 법정에서 배운 대로 꼼꼼히 봤다고요." },
        { gain: ["code", "run_npe", "spec_get", "run_soldout", "run_board"], t: "법정 기록에 증거 5개가 들어왔다. 2단계 1~4화를 떠올리며 골라야 한다." },
        { cross: "cb1", title: "증언 ① 처음엔 0이니까", who: "wit",
          lines: [
            { t: "주문이 들어오면 메뉴 이름을 키로 주문 수를 하나씩 올려요.",
              press: [["wit", "count.put(menu, count.get(menu) + 1). 간단하죠."], ["me", "(간단하다. 그런데 처음 들어온 메뉴는?)"]] },
            { t: "처음 들어온 메뉴는 주문 수가 0이니까, 0 + 1로 1이 됩니다.",
              press: [["wit", "아직 하나도 안 팔렸으니 0이죠."], ["me", "(사람 생각으로는 0이다. Map은 뭐라고 대답할까?)"]] },
            { t: "그러니 첫 주문부터 집계가 정확하게 됩니다.",
              press: [["wit", "더하기 하나 틀릴 리가요."], ["me", "(결론은 앞 증언에 기대고 있다.)"]] }
          ],
          answer: { line: 1, ev: "run_npe" },
          alt: { line: 1, ev: "spec_get", say: [["me", "Map은 없는 키를 물으면 0이 아니라 null을 줘요."], ["wit", "null이든 0이든 처음이란 뜻은 같잖아요!"], ["me", "(같지 않다는 걸 실행 결과로 보여 주자.)"]] },
          hint: "첫 주문으로 집계를 실제로 돌려 본 기록이 있다.",
          win: [
            ["me", "첫 주문을 넣으면 <b>NullPointerException</b>이에요. 없는 키를 물으면 Map은 0이 아니라 <b>null</b>을 주거든요. 실행 결과에도 <code>count.get(\"라면\")</code>이 null로 찍혀 있어요."],
            ["me", "null에 + 1을 하려고 int로 푸는 순간 터져요. 1단계 4화에서 본 언박싱이에요. <code>merge(menu, 1, Integer::sum)</code>이나 <code>getOrDefault(menu, 0) + 1</code>로 세야 해요."],
            ["witSweat", "으윽…! 집계는 그렇다 쳐도, 품절 목록은 ArrayList예요. 추가는 문제없다고요!"],
            ["judge", "증인, 품절 목록에 대해 증언하세요."]
          ] },
        { cross: "cb2", title: "증언 ② 품절 목록은 ArrayList", who: "witSweat",
          lines: [
            { t: "품절 목록은 처음에 김밥 하나로 시작해요.",
              press: [["wit", "Arrays.asList(\"김밥\")이요."], ["me", "(Arrays.asList… 3화에서 본 그 메서드다.)"]] },
            { t: "오늘 튀김이 품절되면 soldOut.add로 추가하면 됩니다.",
              press: [["wit", "리스트니까 add죠."], ["me", "(그 리스트가 add를 허락할까?)"]] },
            { t: "Arrays.asList는 ArrayList를 돌려주니까 얼마든지 늘어나요.",
              press: [["wit", "이름이 ArrayList잖아요."], ["me", "(이름만 같다는 걸 3화에서 확인했다.)"]] }
          ],
          answer: { line: 2, ev: "run_soldout" },
          hint: "품절 목록에 실제로 추가해 본 기록이 있다. 3화를 떠올려 보자.",
          win: [
            ["me", "추가하면 <b>UnsupportedOperationException</b>이에요. Arrays.asList는 배열을 감싼 고정 크기 리스트라 늘어나지 않아요. 3화 그대로예요."],
            ["me", "<code>new ArrayList<>(Arrays.asList(\"김밥\"))</code>로 복사해서 써야 해요."],
            ["witSweat", "크윽…! 그, 그래도 메뉴판 정리는 1단계에서 배운 대로 꼼꼼히 했어요. for-each로 하나씩 확인해서 지우니까 안전하죠!"],
            ["judge", "…증인, 메뉴판 정리에 대해 증언하세요."]
          ] },
        { cross: "cb3", title: "증언 ③ 하나씩 확인해서 지운다", who: "witSweat",
          lines: [
            { t: "메뉴판을 for-each로 돌면서 품절 메뉴면 바로 지워요. 하나씩 확인하니까 안전합니다.",
              press: [["wit", "빠뜨리는 메뉴가 없게요."], ["me", "(하나씩 확인하는 건 좋다. 확인하면서 ‘지우는’ 게 문제다. 2화를 떠올리자.)"]] },
            { t: "어제 튀김 하나만 품절시켜 테스트했을 땐 잘 됐어요.",
              press: [["wit", "튀김은 메뉴판 끝에서 두 번째예요."], ["me", "(끝에서 두 번째… 2화의 가운데 상품과 같은 자리다. 이번엔 첫 번째 김밥도 품절이다.)"]] },
            { t: "그러니 오늘 품절이 몇 개든 문제없어요.",
              press: [["wit", "테스트를 통과했으니까요."], ["me", "(2화에서 테스트가 왜 통과했는지 봤다.)"]] }
          ],
          answer: { line: 0, ev: "run_board" },
          hint: "오늘의 품절 목록으로 메뉴판 정리를 돌려 본 기록이 있다. 2화를 떠올려 보자.",
          win: [
            ["me", "오늘 품절 목록 [김밥, 튀김]으로 돌리면 <b>ConcurrentModificationException</b>이에요. for-each 도중에 리스트를 지웠으니까요."],
            ["me", "어제 테스트가 통과한 건 2화처럼 운이에요. <code>menuBoard.removeIf(soldOut::contains)</code>로 한 번에 지워야 해요."],
            ["witSweat", "으아아아악─!!!"],
            ["wit", "…전부 인정합니다. 없는 키를 0으로 믿었고, 고정 크기 리스트에 add를 했고, 반복 중에 지웠어요."],
            ["judge", "증인의 자백을 기록합니다. 변호인, 고친 코드를 고르세요."]
          ] },
        { choice: "judge", t: "다음 중 올바르게 고친 코드는 어느 것입니까?",
          options: [
            { code: true, t: `count.put(menu, count.get(menu) + 1);
soldOut = new ArrayList<>(Arrays.asList("김밥"));
soldOut.add("튀김");
menuBoard.removeIf(soldOut::contains);`, fb: "주문 집계가 그대로다. 첫 주문에서 NullPointerException이 난다." },
            { code: true, t: `count.merge(menu, 1, Integer::sum);
soldOut = Arrays.asList("김밥");
soldOut.add("튀김");
menuBoard.removeIf(soldOut::contains);`, fb: "Arrays.asList 그대로라 add에서 UnsupportedOperationException이 난다." },
            { code: true, ok: true, t: `count.merge(menu, 1, Integer::sum);
soldOut = new ArrayList<>(Arrays.asList("김밥"));
soldOut.add("튀김");
menuBoard.removeIf(soldOut::contains);` },
            { code: true, t: `count.merge(menu, 1, Integer::sum);
soldOut = new ArrayList<>(Arrays.asList("김밥"));
soldOut.add("튀김");
for (String m : menuBoard) if (soldOut.contains(m)) menuBoard.remove(m);`, fb: "for-each 도중에 지우는 그대로다. ConcurrentModificationException이 난다." }
          ],
          win: [
            ["judge", "세는 건 merge로, 늘릴 리스트는 복사해서, 지우는 건 removeIf로."],
            ["me", "네. 고친 코드를 실제로 돌려서 확인해 둘게요."]
          ] },
        { gain: ["run_fixed", "run_merge"], t: "고친 코드를 실제로 돌려 본 결과가 법정 기록에 들어왔다. 집계 {김밥=2, 라면=1}, 메뉴판 [라면, 어묵]." },
        { combine: ["run_npe", "spec_get"], result: "nullkey",
          t: "판결 전에 하나만 정리하자. ‘처음엔 0’은 왜 틀렸을까?\n첫 주문 실행 결과와 Map.get의 규칙을 조합해 보자.",
          wrong: "그 둘로는 정리가 안 된다.",
          got: "없는 키를 물으면 <b>null</b>, null + 1은 <b>언박싱 NPE</b>…!\n새 증거 <b>📌 없는 키는 null</b>을 얻었다." },
        { choice: "judge", t: "마지막 질문입니다. 이번 재판의 네 가지 버그에 공통된 교훈은 무엇입니까?",
          options: [
            { t: "컬렉션은 위험하니 배열만 쓴다", fb: "배열도 크기가 고정이고 순서·검색을 직접 다뤄야 한다. 컬렉션이 어떻게 동작하는지 알고 쓰는 게 답이다." },
            { t: "테스트에서 한 번 통과하면 믿어도 된다", fb: "1화의 같은 객체, 2화의 가운데 상품, 4화의 a, b, c처럼 우연히 통과한 테스트가 계속 나왔다." },
            { t: "컬렉션이 ‘없을 때, 바뀔 때, 순서’를 어떻게 다루는지 알고, 우연히 통과하지 않는 값(첫 원소, 연속, 실제 데이터)으로 테스트한다", ok: true },
            { t: "예외가 나면 try-catch로 모두 감싼다", fb: "예외를 숨기면 집계·품절·메뉴판이 조용히 틀린 채로 남는다." }
          ],
          win: [
            ["judge", "…좋습니다."],
            ["me", "없는 키는 null, 고정 크기 리스트, 반복 중 삭제, 순서 없는 HashMap. 그리고 그 함정들을 숨긴 건 매번 ‘너무 쉬운 테스트’였어요."]
          ] },
        { verdict: true }
      ],
      verdict: {
        say: "본 법정은 개업 첫날의 재고 대혼란이 <b>컬렉션 함정 세 가지</b>가 겹친 것이라고 판단합니다. 고친 코드로 둘째 날 영업을 선고합니다. 이상, 폐정!",
        quote: "Map.get은 없는 키에 null을 돌려주므로 get(k) + 1은 언박싱 NPE가 난다. 세기는 merge(k, 1, Integer::sum)나 getOrDefault로 한다. Arrays.asList는 고정 크기라 늘릴 리스트는 new ArrayList로 복사하고, 반복 중 삭제는 removeIf로 한다. 단순한 테스트 값은 이런 함정을 우연히 통과시키니 첫 원소, 연속된 값, 실제 데이터로 테스트한다.",
        clues: [
          "<code>map.get(없는 키)</code> → null, <code>null + 1</code> → NPE / <code>merge</code>, <code>getOrDefault</code>",
          "<code>Arrays.asList</code>는 고정 크기 → <code>new ArrayList<>(...)</code> (3화)",
          "for-each 중 삭제 → CME / <code>removeIf</code> (2화)",
          "키 클래스는 equals·hashCode를 함께 (1화), 순서가 필요하면 LinkedHashMap (4화)",
          "우연히 통과하지 않는 값으로 테스트한다"
        ]
      }
    }
  ]
};
