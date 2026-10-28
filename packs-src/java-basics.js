// Java 기초 법정 — 1단계 사건팩 원고
// 빌드: node tools/build-packs.js → packs/java-basics.json
// 실행 결과 증거(run)는 tools/verify-run.js가 JDK로 실제로 돌려서 출력이 맞는지 확인한다.

/** 일반 증거 */
const ev = (ic, k, name, desc, code) => ({ ic, k, name, desc, code });

/** 실행 결과 증거: 카드에는 코드와 실제 출력을 함께 보여 주고, run에 검증 정보를 남긴다 */
function runEv(name, desc, snippet, expected) {
  const shown = snippet.trim() + "\n\n// 실행 결과\n" + expected.split("\n").map(l => "// " + l).join("\n");
  return { ic: "▶️", k: "실행 결과", name, desc, code: shown, run: { lang: "java", snippet: snippet.trim(), expected } };
}

const spec = (name, desc, code) => ev("📘", "명세 요약", name, desc, code);

module.exports = {
  format: "code-court/v1",
  id: "java-basics",
  title: "Java 기초 법정",
  language: "Java",
  blurb: "정수 나눗셈, 오버플로, == 와 equals, Integer 캐시, 문자열 불변. 쉬운 함정부터 반례로 반박해요.",
  lead: "증인은 언제나 자신만만하게 말합니다. 코드가 정말 그렇게 동작하는지, 실제 실행 결과와 명세로 반박하세요. 증거 속 실행 결과는 모두 JDK 21로 실제로 돌려서 확인한 값이에요.",
  commonCharacters: {
    judge: ["⚖️", "재판장"],
    me: ["🧑‍💻", "나 (변호인)"],
    wit: ["🤓", "단정해 (코드 리뷰어)"],
    witSweat: ["😰", "단정해 (코드 리뷰어)"]
  },
  cases: [
    /* ---------------- 1화 ---------------- */
    {
      id: "j1", ep: "1화 · 정수 나눗셈", title: "평균 2.0 사건",
      blurb: "5점을 2과목으로 나눴는데 평균이 2.0이라고 나온다.",
      characters: { student: ["🧑‍🎓", "점수궁금 (학생)"] },
      evidence: {
        code: ev("📄", "코드", "평균 계산 코드", "성적 앱에서 평균을 구하는 부분.", `int sum = 5;      // 국어 3점 + 수학 2점
int count = 2;    // 과목 수
double avg = sum / count;`),
        run_avg: runEv("평균 실행 결과", "위 코드를 그대로 실행해 본 결과.", `int sum = 5;
int count = 2;
double avg = sum / count;
System.out.println(avg);`, "2.0"),
        spec_div: spec("정수 나눗셈 규칙", "Java 언어 명세(JLS)의 나눗셈·대입 규칙을 쉽게 요약한 것.", `1. 정수 / 정수 는 정수 나눗셈이다. 소수점 아래는 버린다 (5 / 2 → 2)
2. 오른쪽 식을 다 계산한 다음에, 그 값을 왼쪽 변수의 타입으로 바꿔서 담는다
   → double avg = 5 / 2;  는  2를 먼저 만들고, 그다음 2.0으로 바꾼다`),
        run_late: runEv("늦게 바꾼 결과", "double로 바꾸는 위치만 다르게 해 본 결과.", `int sum = 5, count = 2;
System.out.println(sum / count * 1.0);
System.out.println((double) (sum / count));
float f = sum / count;
System.out.println(f);`, "2.0\n2.0\n2.0"),
        run_fix: runEv("먼저 바꾼 결과", "나누기 전에 한쪽을 double로 바꾼 결과.", `int sum = 5, count = 2;
System.out.println((double) sum / count);`, "2.5")
      },
      script: [
        { say: "judge", t: "‘평균 2.0 사건’의 재판을 시작합니다." },
        { say: "student", t: "국어 3점, 수학 2점이에요. 평균은 <b>2.5</b>여야 하잖아요? 그런데 성적 앱에는 <b>2.0</b>이라고 떠요!" },
        { say: "me", t: "5 나누기 2는 2.5인데 2.0…. 코드에서 무슨 일이 있었는지 보죠." },
        { say: "wit", t: "코드 리뷰어 단정해입니다. 평균은 <code>double</code>에 담았어요. 소수점이 사라질 리 없습니다." },
        { gain: ["code", "run_avg", "spec_div", "run_late", "run_fix"], t: "법정 기록에 증거 5개가 들어왔다. ‘법정 기록’ 버튼으로 언제든 볼 수 있다." },
        { cross: "j1a", title: "증언 ① double에 담았으니 2.5", who: "wit",
          lines: [
            { t: "평균은 sum을 count로 나눠서 구합니다.",
              press: [["wit", "5를 2로 나누면 2.5죠. 초등학생도 알아요."], ["me", "(수학으로는 그렇다. 그런데 자바에서는?)"]] },
            { t: "2.0이 보이는 건 화면 쪽에서 반올림을 잘못해서예요.",
              press: [["wit", "백엔드는 잘못이 없어요."], ["me", "(화면 탓을 하기 전에, 코드를 직접 돌려 본 기록이 있다.)"]] },
            { t: "코드는 확실해요. 결과를 double avg에 담으니까, 계산도 실수로 해서 2.5가 나옵니다.",
              press: [["wit", "double이 소수점 담는 타입이잖아요."], ["me", "(담는 그릇이 double인 건 맞다. 그런데 ‘계산’도 double로 할까?)"]] }
          ],
          answer: { line: 2, ev: "run_avg" },
          alt: { line: 2, ev: "spec_div", say: [["me", "명세에 따르면 정수끼리 나누면 정수 나눗셈이에요."], ["wit", "명세는 명세고요! double에 담으면 결과가 달라진다니까요?"], ["me", "(말보다 실제로 돌린 결과를 보여 주자.)"]] },
          hint: "코드를 그대로 실행해 본 결과가 법정 기록에 있다.",
          win: [
            ["me", "실행 결과를 보세요. 화면이 아니라 코드에서 이미 <b>2.0</b>이에요."],
            ["me", "<code>sum / count</code>는 정수끼리라서 먼저 <b>2</b>가 돼요. 그다음에 double 변수에 담기면서 2.0으로 바뀌는 거죠. double에 담는 건 계산이 다 끝난 <b>뒤</b>예요."],
            ["witSweat", "으윽…! 그, 그럼 뒤에 <code>* 1.0</code>만 붙이면 되겠네요!"],
            ["judge", "변호인, 고치는 방법을 고르세요."]
          ] },
        { choice: "judge", t: "어떻게 고쳐야 평균이 2.5가 나올까요?",
          options: [
            { t: "double avg = sum / count * 1.0;", fb: "곱하기보다 sum / count가 먼저 계산돼서 이미 2가 된다. 실행 결과도 2.0이다." },
            { t: "double avg = (double) (sum / count);", fb: "괄호 안의 정수 나눗셈이 먼저라, 2를 2.0으로 바꿀 뿐이다." },
            { t: "double avg = (double) sum / count;", ok: true },
            { t: "float avg = sum / count;", fb: "float도 마찬가지로 계산이 끝난 뒤에 담긴다. 결과는 2.0이다." }
          ],
          win: [
            ["judge", "나누기 전에 한쪽을 double로 바꾼다는 거군요."],
            ["me", "네. <code>(double) sum</code>이 먼저 5.0이 되고, 5.0 / 2는 실수 나눗셈이라 <b>2.5</b>예요. 실행 결과로도 확인했어요."]
          ] },
        { verdict: true }
      ],
      verdict: {
        say: "본 법정은 평균 2.0의 원인이 <b>정수 나눗셈</b>이었다고 판단합니다. 화면은 무죄!",
        quote: "자바에서 정수끼리 나누면 결과도 정수이고, 소수점은 버려진다. double 변수에 담는 건 오른쪽 계산이 다 끝난 뒤라 이미 늦다. 나누기 전에 한쪽을 (double)로 바꿔야 한다.",
        clues: [
          "<code>5 / 2</code>는 2 (정수 나눗셈, 소수점 버림)",
          "<code>double avg = 5 / 2;</code>는 2를 만든 뒤 2.0으로 바꿀 뿐",
          "<code>* 1.0</code>을 뒤에 붙이거나 괄호 전체를 바꾸면 이미 늦다",
          "정답: <code>(double) sum / count</code> → 2.5"
        ]
      }
    },

    /* ---------------- 2화 ---------------- */
    {
      id: "j2", ep: "2화 · 오버플로", title: "사라진 5억 포인트 사건",
      blurb: "포인트를 더했을 뿐인데 합계가 마이너스가 됐다.",
      characters: { owner: ["💰", "포인트왕 (사장님)"] },
      evidence: {
        code: ev("📄", "코드", "포인트 합계 코드", "포인트 적립 이벤트의 합계를 구하는 부분.", `int total = 2_000_000_000;   // 지금까지 쌓인 포인트 20억
total += 500_000_000;        // 이번 이벤트 5억 추가`),
        run_over: runEv("합계 실행 결과", "위 코드를 그대로 실행해 본 결과.", `int total = 2_000_000_000;
total += 500_000_000;
System.out.println(total);`, "-1794967296"),
        run_max: runEv("int의 끝", "int가 담을 수 있는 가장 큰 수와, 거기에 1을 더한 결과.", `System.out.println(Integer.MAX_VALUE);
System.out.println(Integer.MAX_VALUE + 1);`, "2147483647\n-2147483648"),
        spec_int: spec("int의 범위", "Java 언어 명세의 정수 타입 규칙 요약.", `int 범위: -2,147,483,648 ~ 2,147,483,647 (약 ±21억)
범위를 넘으면 에러 없이 반대쪽 끝에서 이어진다 (오버플로)
→ 한 바퀴의 크기는 2의 32제곱 = 4,294,967,296`),
        run_trap: runEv("long에 담은 결과", "결과를 long 변수에 담아 본 결과.", `long total = 2_000_000_000 + 500_000_000;
System.out.println(total);`, "-1794967296"),
        run_fix: runEv("L을 붙인 결과", "숫자 하나에 L을 붙여 long으로 계산한 결과.", `long total = 2_000_000_000L + 500_000_000;
System.out.println(total);`, "2500000000"),
        run_exact: runEv("Math.addExact 결과", "넘치면 예외를 던지는 덧셈 메서드를 써 본 결과.", `try {
    Math.addExact(2_000_000_000, 500_000_000);
} catch (ArithmeticException e) {
    System.out.println(e.getMessage());
}`, "integer overflow"),
        wrap: ev("📌", "추리", "돌아간 숫자의 정체", "조합 결과: 25억은 int의 끝(약 21억)을 넘었다. 넘친 만큼 반대쪽 끝에서 이어지니, 한 바퀴(4,294,967,296)를 뺀 값이 된다.\n-1794967296은 아무 숫자가 아니라 정확히 계산되는 값이다.", `2,500,000,000 - 4,294,967,296 = -1,794,967,296`)
      },
      script: [
        { say: "judge", t: "‘사라진 5억 포인트 사건’의 재판을 시작합니다." },
        { say: "owner", t: "20억 포인트에 이벤트로 5억을 더 쌓았어요. 그런데 합계가 <b>마이너스 17억</b>이래요! 포인트가 오히려 줄었다고요!" },
        { say: "wit", t: "int는 넉넉한 타입이에요. 숫자가 커지면 그냥 큰 숫자가 될 뿐입니다." },
        { gain: ["code", "run_over", "run_max", "spec_int", "run_trap", "run_fix", "run_exact"], t: "법정 기록에 증거 7개가 들어왔다." },
        { cross: "j2a", title: "증언 ① int는 넉넉하다", who: "wit",
          lines: [
            { t: "포인트 합계는 int total에 차곡차곡 더해요.",
              press: [["wit", "+= 로 더하면 끝이죠."], ["me", "(더하는 방법은 맞다. 문제는 int에 담을 수 있는 크기다.)"]] },
            { t: "int는 넉넉하니까 25억 포인트도 그대로 담깁니다.",
              press: [["wit", "int가 얼마나 큰데요."], ["me", "(정확히 얼마나 클까? 끝을 확인한 기록이 있다.)"]] },
            { t: "마이너스가 보이는 건 DB가 이상해서예요.",
              press: [["wit", "자바는 잘못이 없어요."], ["me", "(DB 탓을 하기 전에 int의 끝부터 보자.)"]] }
          ],
          answer: { line: 1, ev: "run_max" },
          alt: { line: 2, ev: "run_over", say: [["me", "DB까지 갈 필요도 없어요. 코드를 그대로 돌려도 -1794967296이 나와요."], ["wit", "그, 그건 뭔가 다른 이유겠죠. int는 넉넉하다니까요!"], ["me", "(‘넉넉하다’는 말을 깨자. int의 끝을 보여 주면 된다.)"]] },
          hint: "int가 담을 수 있는 가장 큰 수를 확인한 기록이 있다.",
          win: [
            ["me", "int의 최대값은 <b>2,147,483,647</b>, 약 21억이에요. 25억은 처음부터 담을 수 없어요."],
            ["me", "넘치면 에러도 없이 반대쪽 끝으로 돌아가요. <code>MAX_VALUE + 1</code>이 -2147483648인 것처럼요. 이걸 <b>오버플로</b>라고 해요."],
            ["witSweat", "크윽…! 그, 그런데 왜 하필 -1794967296이죠? 숫자가 엉망이잖아요!"],
            ["judge", "변호인, 그 숫자를 설명해 보세요."]
          ] },
        { combine: ["run_over", "spec_int"], result: "wrap",
          t: "-1794967296은 아무렇게나 나온 숫자일까?\n합계 실행 결과와 int의 범위 규칙을 조합해 보자.",
          wrong: "그 둘로는 숫자의 정체가 안 나온다. 실제로 나온 합계와, 넘쳤을 때의 규칙을 나란히 놓아 보자.",
          got: "합계 <b>-1794967296</b>과 한 바퀴의 크기 <b>4,294,967,296</b>…!\n새 증거 <b>📌 돌아간 숫자의 정체</b>를 얻었다." },
        { cross: "j2b", title: "증언 ② long에 담으면 끝", who: "witSweat",
          lines: [
            { t: "결과를 long에 담으면 끝이죠. long total = 2_000_000_000 + 500_000_000; 이렇게 쓰면 25억이 그대로 들어갑니다.",
              press: [["wit", "담는 그릇이 long이잖아요."], ["me", "(담는 그릇… 1화의 double과 똑같은 말이다.)"]] },
            { t: "long은 922경까지 담으니, 넘칠 일은 영원히 없어요.",
              press: [["wit", "Long.MAX_VALUE는 9,223,372,036,854,775,807이에요."], ["me", "(long도 끝은 있다. 그리고 ‘넘치면 알려 주는’ 방법도 있었지.)"]] },
            { t: "그러니 int를 long으로 바꾸는 것만으로 해결 끝입니다.",
              press: [["wit", "타입 하나만 바꾸면 되잖아요."], ["me", "(어디를 long으로 바꾸느냐가 문제다.)"]] }
          ],
          answer: { line: 0, ev: "run_trap" },
          alt: { line: 1, ev: "run_exact", say: [["me", "<code>Math.addExact</code>를 쓰면 넘칠 때 조용히 돌아가는 대신 ‘integer overflow’ 예외가 나요."], ["witSweat", "예외 얘기는 됐고요! long에 담으면 끝이라니까요!"], ["me", "(‘long에 담으면 된다’는 말부터 깨자.)"]] },
          hint: "결과를 long에 담아서 실제로 돌려 본 기록이 있다. 1화를 떠올려 보자.",
          win: [
            ["me", "실행해 보면 long에 담아도 <b>-1794967296</b>이에요. 오른쪽 <code>2_000_000_000 + 500_000_000</code>은 int끼리 덧셈이라, 넘친 다음에 long에 담기거든요."],
            ["me", "1화와 같은 원리예요. 중요한 건 담는 그릇이 아니라 <b>계산하는 타입</b>이에요. 숫자 하나에 <code>L</code>을 붙여 <code>2_000_000_000L</code>로 쓰면 long 계산이 돼서 2500000000이 나와요."],
            ["witSweat", "으아악─!!"]
          ] },
        { choice: "judge", t: "포인트 합계는 어떻게 다뤄야 합니까?",
          options: [
            { t: "Integer 타입으로 바꾼다", fb: "Integer는 int를 감싼 객체일 뿐, 담을 수 있는 범위는 int와 같다." },
            { t: "합계가 음수가 되면 0으로 바꿔 준다", fb: "넘친 사실을 숨길 뿐이다. 포인트 25억이 0이 된다." },
            { t: "합계는 long으로 두고, 더하는 계산도 long으로 한다", ok: true },
            { t: "double로 바꾼다", fb: "정수 금액을 실수로 다루면, 큰 수에서 반올림 오차가 생길 수 있다. 정수는 long으로 다룬다." }
          ],
          win: [
            ["judge", "그릇만이 아니라 계산까지 long으로."],
            ["me", "네. 그리고 넘치는 걸 아예 놓치고 싶지 않다면 <code>Math.addExact</code>처럼 넘칠 때 예외를 던지는 메서드를 쓰면 돼요."]
          ] },
        { verdict: true }
      ],
      verdict: {
        say: "본 법정은 사라진 포인트의 원인이 <b>int 오버플로</b>였다고 판단합니다. DB는 무죄!",
        quote: "int는 약 21억까지만 담는다. 넘치면 에러 없이 반대쪽 끝으로 돌아가서 엉뚱한 음수가 된다. 결과를 long에 담아도 오른쪽 계산이 int끼리면 이미 넘친 뒤라, 계산 자체를 long으로(L 붙이기) 해야 한다.",
        clues: [
          "int 최대값 2,147,483,647 (약 21억)",
          "넘치면 예외 없이 돌아간다: 25억 − 4,294,967,296 = −1,794,967,296",
          "<code>long t = a + b;</code>는 a + b가 int면 넘친 뒤에 담긴다",
          "정답: <code>2_000_000_000L + 500_000_000</code> / 넘침을 잡으려면 <code>Math.addExact</code>"
        ]
      }
    },

    /* ---------------- 3화 ---------------- */
    {
      id: "j3", ep: "3화 · == 와 equals", title: "같은 이름, 다른 사람 사건",
      blurb: "아이디를 정확히 입력했는데 ‘없는 사용자’라고 나온다.",
      characters: { admin: ["🧑‍💼", "관리자김 (사용자)"] },
      evidence: {
        code: ev("📄", "코드", "로그인 비교 코드", "입력한 아이디와 저장된 아이디를 비교하는 부분.", `String saved = "admin";            // 저장된 아이디
String input = readLine().trim();   // 사용자가 입력한 아이디
if (input == saved) {
    // 로그인 성공
}`),
        run_lit: runEv("테스트 실행 결과", "단정해가 로그인 비교를 테스트한 코드.", `String a = "admin";
String b = "admin";
System.out.println(a == b);`, "true"),
        run_input: runEv("실제 입력 실행 결과", "입력처럼 실행 중에 만들어진 문자열로 비교해 본 결과.", `String saved = "admin";
String input = "xadmin".substring(1);   // 실행 중에 만들어진 "admin"
System.out.println(input);
System.out.println(saved == input);
System.out.println(saved.equals(input));`, "admin\nfalse\ntrue"),
        spec_eq: spec("== 와 equals", "Java 명세와 String 문서의 규칙 요약.", `==        : 두 변수가 '같은 객체'를 가리키는지 비교한다 (주소 비교)
equals()  : String에서는 글자 내용이 같은지 비교한다
문자열 리터럴("admin"처럼 코드에 직접 쓴 문자열)은 내용이 같으면
하나의 객체를 함께 쓴다 (문자열 풀)`),
        run_hash: runEv("해시 코드 실행 결과", "서로 다른 문자열의 hashCode를 비교해 본 결과.", `System.out.println("Aa".hashCode());
System.out.println("BB".hashCode());
System.out.println("Aa".equals("BB"));`, "2112\n2112\nfalse"),
        same: ev("📌", "추리", "같은 글자, 다른 객체", "조합 결과: 테스트의 \"admin\" 두 개는 코드에 직접 쓴 리터럴이라 문자열 풀의 같은 객체를 가리켰다. 그래서 ==가 true였다.\n실제 입력은 실행 중에 새로 만들어진 문자열이라, 글자가 같아도 다른 객체다. ==는 글자가 아니라 ‘같은 객체인지’를 본다.", `리터럴 "admin" == 리터럴 "admin"   → 같은 객체 → true
리터럴 "admin" == 입력으로 만든 "admin" → 다른 객체 → false`)
      },
      script: [
        { say: "judge", t: "‘같은 이름, 다른 사람 사건’의 재판을 시작합니다." },
        { say: "admin", t: "아이디 <b>admin</b>을 정확히 입력했어요. 오타도 공백도 없어요. 그런데 ‘없는 사용자’래요!" },
        { say: "wit", t: "로그인 비교는 <code>==</code>로 했어요. 제가 직접 테스트했는데 true가 나왔다고요." },
        { gain: ["code", "run_lit", "run_input", "spec_eq", "run_hash"], t: "법정 기록에 증거 5개가 들어왔다." },
        { cross: "j3a", title: "증언 ① == 는 글자를 비교한다", who: "wit",
          lines: [
            { t: "로그인은 입력한 아이디와 저장된 아이디를 ==로 비교합니다.",
              press: [["wit", "숫자도 ==, 문자열도 ==. 간단하죠."], ["me", "(숫자와 문자열이 같은 방식으로 비교될까?)"]] },
            { t: "제가 테스트했을 때 \"admin\" == \"admin\"은 true였어요.",
              press: [["wit", "실행 결과로 증명했어요."], ["me", "(테스트에서 true였던 건 맞다. 그런데 그 테스트는 실제 입력과 같은 조건이었을까?)"]] },
            { t: "그러니 ==는 글자를 비교하는 거고, 같은 글자인 실제 입력도 당연히 true가 나옵니다.",
              press: [["wit", "a, d, m, i, n. 똑같잖아요."], ["me", "(글자는 같다. 그런데 ==가 보는 게 글자일까?)"]] }
          ],
          answer: { line: 2, ev: "run_input" },
          alt: { line: 2, ev: "spec_eq", say: [["me", "명세에 따르면 ==는 같은 객체인지를 비교해요."], ["wit", "명세보다 실행 결과죠! 제 테스트는 true였다고요."], ["me", "(그럼 실제 입력과 같은 조건으로 돌린 결과를 보여 주자.)"]] },
          hint: "실제 입력처럼 실행 중에 만들어진 문자열로 비교해 본 기록이 있다.",
          win: [
            ["me", "실제 입력처럼 실행 중에 만든 문자열로 비교하면, 글자가 똑같이 admin인데도 <code>==</code>는 <b>false</b>예요. <code>equals</code>는 true고요."],
            ["witSweat", "네…? 그, 그럼 제 테스트에선 왜 true였던 거죠?!"],
            ["judge", "변호인, 테스트가 왜 통과했는지 밝혀 보세요."]
          ] },
        { combine: ["run_lit", "spec_eq"], result: "same",
          t: "같은 ==인데 테스트에선 true, 실제 입력에선 false.\n테스트 코드와 ==의 규칙을 조합해 보자.",
          wrong: "그 둘로는 이유가 안 나온다. 테스트에서 비교한 문자열이 어떤 문자열이었는지와, ==가 무엇을 비교하는지를 나란히 놓아 보자.",
          got: "테스트의 두 \"admin\"은 <b>리터럴</b>, 리터럴은 <b>같은 객체를 함께 쓴다</b>…!\n새 증거 <b>📌 같은 글자, 다른 객체</b>를 얻었다." },
        { cross: "j3b", title: "증언 ② hashCode가 더 빠르고 정확하다", who: "witSweat",
          lines: [
            { t: "좋아요, ==는 안 되는군요. 그런데 equals는 글자를 하나하나 비교해서 느려요.",
              press: [["wit", "아이디가 길면 오래 걸리잖아요."], ["me", "(아이디 몇 글자 비교는 충분히 빠르다. 정확한 게 먼저다.)"]] },
            { t: "hashCode가 같으면 같은 문자열이니까, hashCode로 비교하는 게 낫습니다.",
              press: [["wit", "숫자 하나만 비교하면 되잖아요."], ["me", "(hashCode가 같으면 정말 같은 문자열일까? 서로 다른 문자열로 확인한 기록이 있다.)"]] },
            { t: "어차피 아이디는 짧으니 겹칠 일도 없고요.",
              press: [["wit", "두 글자짜리 아이디끼리 겹칠 리가요."], ["me", "(두 글자짜리끼리 겹치는 예가 바로 있었다.)"]] }
          ],
          answer: { line: 1, ev: "run_hash" },
          hint: "서로 다른 문자열의 hashCode를 비교해 본 기록이 있다.",
          win: [
            ["me", "\"Aa\"와 \"BB\"를 보세요. 글자가 다른데 hashCode는 둘 다 <b>2112</b>예요."],
            ["me", "hashCode는 빠르게 걸러 내는 용도라 서로 다른 문자열끼리 같을 수 있어요. 같은 문자열인지는 결국 <code>equals</code>로 확인해야 해요."],
            ["witSweat", "으아악─!!"]
          ] },
        { choice: "judge", t: "로그인 아이디는 어떻게 비교해야 합니까?",
          options: [
            { t: "saved.hashCode() == input.hashCode()", fb: "다른 문자열도 hashCode가 같을 수 있다. \"Aa\"와 \"BB\"는 둘 다 2112다." },
            { t: "saved.toString() == input", fb: "toString()은 같은 객체를 그대로 돌려줄 뿐이라, 여전히 객체를 비교한다." },
            { t: "saved.equals(input)", ok: true },
            { t: "saved.compareTo(input) > 0", fb: "compareTo는 크기 순서를 비교한다. 같으면 0이 나오므로 > 0은 오히려 같을 때 false다." }
          ],
          win: [
            ["judge", "문자열은 equals로."],
            ["me", "네. 그리고 <code>\"admin\".equals(input)</code>처럼 리터럴을 앞에 두면, input이 null이어도 예외가 나지 않아요."]
          ] },
        { verdict: true }
      ],
      verdict: {
        say: "본 법정은 로그인 실패의 원인이 <b>문자열을 ==로 비교한 것</b>이라고 판단합니다. 관리자김은 진짜 관리자가 맞습니다!",
        quote: "==는 두 변수가 같은 객체인지를 비교하고, equals는 내용을 비교한다. 코드에 직접 쓴 문자열 리터럴은 같은 객체를 함께 써서 테스트에서는 ==가 통과하지만, 입력처럼 실행 중에 만든 문자열은 다른 객체라 실패한다. 문자열은 equals로 비교해야 한다.",
        clues: [
          "<code>==</code> = 같은 객체인지 / <code>equals</code> = 내용이 같은지",
          "리터럴끼리는 같은 객체라 테스트에서만 통과한다",
          "hashCode가 같아도 다른 문자열일 수 있다 (\"Aa\", \"BB\" → 2112)",
          "정답: <code>saved.equals(input)</code>, null이 걱정되면 <code>\"admin\".equals(input)</code>"
        ]
      }
    },

    /* ---------------- 4화 ---------------- */
    {
      id: "j4", ep: "4화 · Integer 캐시", title: "127까지만 같은 숫자 사건",
      blurb: "주문 100개는 맞는데, 128개부터 ‘수량 불일치’가 뜬다.",
      characters: { shop: ["📦", "택배왕 (쇼핑몰 사장님)"] },
      evidence: {
        code: ev("📄", "코드", "수량 비교 코드", "주문 수량과 배송 수량을 비교하는 부분.", `List<Integer> ordered = ...;   // 주문 수량
List<Integer> shipped = ...;   // 배송 수량
if (ordered.get(i) == shipped.get(i)) {
    // 수량 일치
}`),
        run_100: runEv("100으로 테스트한 결과", "단정해가 수량 100으로 테스트한 코드.", `Integer a = 100, b = 100;
System.out.println(a == b);`, "true"),
        run_128: runEv("128로 실행한 결과", "같은 코드를 수량 128로 실행한 결과.", `Integer x = 128, y = 128;
System.out.println(x == y);
System.out.println(x.equals(y));`, "false\ntrue"),
        run_mix: runEv("Integer와 int 비교", "한쪽은 Integer, 한쪽은 int로 비교한 결과.", `Integer x = 128;
int n = 128;
System.out.println(x == n);`, "true"),
        spec_cache: spec("Integer 캐시", "Java 명세의 박싱(boxing) 규칙 요약.", `int를 Integer로 바꿀 때(자동 박싱) Integer.valueOf를 쓴다.
-128 ~ 127 사이의 값은 미리 만들어 둔 같은 객체를 돌려준다 (캐시)
그 밖의 값은 매번 새 객체가 만들어질 수 있다.
Integer와 int를 ==로 비교하면 Integer가 int로 풀려서(언박싱) 숫자로 비교한다.`),
        cache: ev("📌", "추리", "캐시 범위", "조합 결과: 100은 캐시 범위(-128~127) 안이라 두 Integer가 같은 객체를 가리켰다. 그래서 ==가 true였다.\n128은 범위 밖이라 서로 다른 객체가 되고, ==는 객체를 비교하니 false가 된다. 테스트 값이 우연히 캐시 안에 있었던 것이다.", `Integer 100 == Integer 100 → 캐시의 같은 객체 → true
Integer 128 == Integer 128 → 서로 다른 객체 → false`)
      },
      script: [
        { say: "judge", t: "‘127까지만 같은 숫자 사건’의 재판을 시작합니다." },
        { say: "shop", t: "주문 100개, 배송 100개는 ‘일치’예요. 그런데 주문 128개, 배송 128개는 <b>‘수량 불일치’</b>래요. 128이랑 128이 다르다고요?" },
        { say: "wit", t: "수량은 <code>Integer</code>끼리 <code>==</code>로 비교해요. 100으로 테스트해서 true가 나온 걸 확인했어요." },
        { gain: ["code", "run_100", "run_128", "run_mix", "spec_cache"], t: "법정 기록에 증거 5개가 들어왔다." },
        { cross: "j4a", title: "증언 ① 100으로 테스트했으니 문제없다", who: "wit",
          lines: [
            { t: "주문 수량과 배송 수량은 <code>List<Integer></code>에 담아서 비교해요.",
              press: [["wit", "리스트에는 int를 못 담으니 Integer로 담았죠."], ["me", "(맞다. List에는 객체만 담을 수 있다. 그럼 비교도 객체끼리다.)"]] },
            { t: "128개 넘게 주문하는 손님은 원래 거의 없어요.",
              press: [["wit", "대부분 한두 개 사거든요."], ["me", "(장사가 잘되면 있다. 실제로 원고가 겪었고.)"]] },
            { t: "어쨌든 수량 100으로 테스트했더니 ==가 true였으니, 비교는 문제없습니다.",
              press: [["wit", "테스트 통과! 확인 끝!"], ["me", "(100으로는 통과했다. 그럼 128로는?)"]] }
          ],
          answer: { line: 2, ev: "run_128" },
          alt: { line: 2, ev: "spec_cache", say: [["me", "명세를 보면 Integer는 -128~127만 같은 객체를 쓴대요."], ["wit", "명세는 어렵고요, 제 테스트는 true였다니까요!"], ["me", "(같은 코드를 128로 돌린 결과를 보여 주자.)"]] },
          hint: "같은 코드를 수량 128로 돌려 본 기록이 있다.",
          win: [
            ["me", "같은 코드를 128로 돌리면 <code>==</code>는 <b>false</b>, <code>equals</code>는 true예요. 128과 128이 ‘다르다’고 나오는 거죠."],
            ["witSweat", "100은 되고 128은 안 된다고요? 그런 게 어딨어요!"],
            ["judge", "변호인, 그 경계를 설명해 보세요."]
          ] },
        { combine: ["run_100", "spec_cache"], result: "cache",
          t: "100은 같고 128은 다르다. 그 경계는 어디서 왔을까?\n100으로 한 테스트와 박싱 규칙을 조합해 보자.",
          wrong: "그 둘로는 경계가 안 나온다. 통과했던 테스트 값과, Integer 객체를 만드는 규칙을 나란히 놓아 보자.",
          got: "100은 <b>-128~127 캐시</b> 안, 128은 밖…!\n새 증거 <b>📌 캐시 범위</b>를 얻었다." },
        { cross: "j4b", title: "증언 ② int와 비교해도 똑같이 틀린다", who: "witSweat",
          lines: [
            { t: "Integer와 int를 ==로 섞어 비교해도 128에서 똑같이 틀립니다. 한쪽이 Integer니까요.",
              press: [["wit", "한쪽이라도 Integer면 같은 문제겠죠."], ["me", "(한쪽이 int라면 이야기가 다를 수도 있다. 직접 돌려 본 기록이 있다.)"]] },
            { t: "그러니 수량은 전부 int로 바꾸는 수밖에 없습니다.",
              press: [["wit", "Integer는 이제 안 써요."], ["me", "(List에는 int를 못 담는다. 비교하는 방법만 바꾸면 된다.)"]] },
            { t: "Integer는 앞으로 이 프로젝트에서 금지예요.",
              press: [["wit", "위험한 건 안 쓰는 게 최고죠."], ["me", "(쓰지 않는 게 아니라, 비교하는 방법을 아는 게 답이다.)"]] }
          ],
          answer: { line: 0, ev: "run_mix" },
          alt: { line: 0, ev: "cache", say: [["me", "캐시 문제는 Integer ‘객체끼리’ 비교할 때 생겨요."], ["witSweat", "Integer가 한쪽에라도 있으면 같은 문제라니까요!"], ["me", "(Integer와 int를 직접 비교해 본 결과를 보여 주자.)"]] },
          hint: "한쪽은 Integer, 한쪽은 int로 비교해 본 기록이 있다.",
          win: [
            ["me", "Integer 128과 int 128을 <code>==</code>로 비교하면 <b>true</b>예요. Integer가 int로 풀려서(언박싱) 숫자끼리 비교하거든요."],
            ["me", "그러니 문제는 Integer라는 타입이 아니라 <b>객체끼리 ==로 비교하는 것</b>이에요. 객체끼리는 equals로 비교하면 돼요."],
            ["witSweat", "으아악─!!"]
          ] },
        { choice: "judge", t: "Integer 두 개는 어떻게 비교해야 합니까?",
          options: [
            { t: "Integer.valueOf(a) == Integer.valueOf(b)", fb: "valueOf도 Integer 객체를 돌려준다. 128 이상에서는 여전히 다른 객체라 false다." },
            { t: "수량을 127 이하로 제한한다", fb: "버그를 피하려고 장사를 막는 셈이다. 128개 주문도 정상이어야 한다." },
            { t: "a.equals(b) — null일 수 있으면 Objects.equals(a, b)", ok: true },
            { t: "a.toString() == b.toString()", fb: "새로 만든 문자열 객체끼리 ==로 비교하니 false다. 3화를 떠올려 보자." }
          ],
          win: [
            ["judge", "객체는 equals로. 3화와 같은 원칙이군요."],
            ["me", "네. 테스트 값이 우연히 캐시 안(-128~127)에 있으면 버그가 숨어요. 경계 밖의 값(128)으로도 테스트해야 해요."]
          ] },
        { verdict: true }
      ],
      verdict: {
        say: "본 법정은 수량 불일치의 원인이 <b>Integer 객체를 ==로 비교한 것</b>이라고 판단합니다. 128개 주문은 정상입니다!",
        quote: "Integer는 -128~127 사이의 값만 같은 객체를 재사용하기 때문에, 그 범위 안의 값으로 테스트하면 ==가 우연히 통과한다. 범위 밖에서는 다른 객체가 되어 ==가 false가 된다. Integer끼리는 equals(또는 Objects.equals)로 비교하고, 경계 밖의 값으로도 테스트해야 한다.",
        clues: [
          "Integer 캐시 범위: -128 ~ 127 (같은 객체를 재사용)",
          "<code>Integer 128 == Integer 128</code> → false, <code>equals</code> → true",
          "<code>Integer == int</code>는 언박싱돼서 숫자 비교 → true",
          "정답: <code>a.equals(b)</code> / <code>Objects.equals(a, b)</code>, 경계 밖 값으로도 테스트"
        ]
      }
    },

    /* ---------------- 보스 ---------------- */
    {
      id: "jboss", ep: "보스 · 1~4화 총정리", title: "정산 대참사 대법정",
      blurb: "VIP 쿠폰은 아무에게도 안 먹히고, 적중률은 0%, 지급 총액은 마이너스. 하룻밤의 이벤트 정산.",
      boss: true, hard: true, trust: 3,
      characters: { pm: ["📣", "마케팅팀장 (원고)"] },
      evidence: {
        code: ev("📄", "코드", "이벤트 정산 코드", "어젯밤 배포된 이벤트 정산 코드의 일부.", `String code = input.trim();
code.toUpperCase();                 // 쿠폰 코드를 대문자로
boolean vip = (code == "VIP");      // VIP 쿠폰인지

int hits = 3, tries = 4;
double rate = hits / tries;         // 퀴즈 적중률

int members = 30_000;
int total = members * 100_000;      // 지급 포인트 총액`),
        run_upper: runEv("대문자 변환 실행 결과", "쿠폰 코드 부분을 소문자 입력으로 돌려 본 결과.", `String code = "vip";
code.toUpperCase();
System.out.println(code);`, "vip"),
        run_upper2: runEv("결과를 받아 본 결과", "toUpperCase()의 결과를 다른 변수에 받아 본 결과.", `String code = "vip";
String up = code.toUpperCase();
System.out.println(code);
System.out.println(up);`, "vip\nVIP"),
        spec_str: spec("String은 불변", "String 클래스 문서의 규칙 요약.", `String 객체는 한 번 만들어지면 내용이 바뀌지 않는다 (불변).
toUpperCase(), trim(), replace() 같은 메서드는 원본을 바꾸지 않고,
바뀐 내용의 '새 String'을 만들어 돌려준다.
→ 돌려받은 값을 변수에 담지 않으면 결과는 사라진다.`),
        run_vip: runEv("VIP 비교 실행 결과", "결과를 받아서 VIP와 비교해 본 결과.", `String code = "vip".toUpperCase();
System.out.println(code);
System.out.println(code == "VIP");
System.out.println(code.equals("VIP"));`, "VIP\nfalse\ntrue"),
        run_rate: runEv("적중률 실행 결과", "퀴즈 적중률 부분을 돌려 본 결과.", `int hits = 3, tries = 4;
double rate = hits / tries;
System.out.println(rate);`, "0.0"),
        run_total: runEv("지급 총액 실행 결과", "지급 포인트 총액 부분을 돌려 본 결과.", `int members = 30_000;
int total = members * 100_000;
System.out.println(total);`, "-1294967296"),
        run_fixed: runEv("고친 코드 실행 결과", "판결에서 고른 방식으로 고쳐서 돌려 본 결과.", `String code = "vip".trim();
code = code.toUpperCase();
boolean vip = code.equals("VIP");
int hits = 3, tries = 4;
double rate = (double) hits / tries;
int members = 30_000;
long total = (long) members * 100_000;
System.out.println(vip);
System.out.println(rate);
System.out.println(total);`, "true\n0.75\n3000000000"),
        newstr: ev("📌", "추리", "새로 만든 문자열", "조합 결과: toUpperCase()는 원본 \"vip\"를 고치지 않는다. String은 불변이라, 대문자로 바꾼 ‘새 문자열’을 만들어 돌려줄 뿐이다.\n그러니 code = code.toUpperCase()로 받은 \"VIP\"는 실행 중에 새로 만든 객체이고, 코드에 직접 쓴 리터럴 \"VIP\"와는 다른 객체다. 3화와 같은 이유로 ==는 false다.", `"vip".toUpperCase()  → 새 String "VIP" (원본 "vip"는 그대로)
새 "VIP" == 리터럴 "VIP" → 다른 객체 → false`)
      },
      script: [
        { say: "judge", t: "정숙! <b>정산 대참사 대법정</b>을 개정합니다. 신뢰도는 <b>3</b>, 첫 실수에는 힌트가 없습니다." },
        { say: "pm", t: "어젯밤 이벤트 정산이 엉망이 됐어요. VIP 쿠폰은 <b>아무에게도</b> 안 먹히고, 퀴즈 적중률은 전원 <b>0%</b>, 지급 포인트 총액은 <b>마이너스</b>예요!" },
        { say: "wit", t: "코드는 제가 리뷰했어요. 이번엔 대문자 변환까지 꼼꼼히 넣었다고요. 문제는 없습니다." },
        { gain: ["code", "run_upper", "run_upper2", "spec_str", "run_vip", "run_rate", "run_total"], t: "법정 기록에 증거 7개가 들어왔다. 1~4화를 떠올리며 골라야 한다." },
        { cross: "jb1", title: "증언 ① 대문자로 바꿨다", who: "wit",
          lines: [
            { t: "쿠폰 코드는 trim()으로 앞뒤 공백부터 지웁니다.",
              press: [["wit", "code = input.trim(); 결과도 code에 받았죠."], ["me", "(trim은 결과를 받았다. 다음 줄은?)"]] },
            { t: "그다음 code.toUpperCase()를 불렀으니, code는 대문자 VIP가 됐습니다.",
              press: [["wit", "메서드를 불렀으니 바뀌었겠죠."], ["me", "(불렀다. 그런데 그 결과를 어디에 받았지?)"]] },
            { t: "그러니 vip로 입력해도 VIP 쿠폰이 적용됩니다.",
              press: [["wit", "대소문자 상관없게 만든 거예요."], ["me", "(의도는 좋다. 실제로 그렇게 동작하는지가 문제다.)"]] }
          ],
          answer: { line: 1, ev: "run_upper" },
          alt: { line: 1, ev: "spec_str", say: [["me", "String은 불변이에요. toUpperCase()는 원본을 바꾸지 않아요."], ["wit", "그래도 불렀으면 뭔가 바뀌었겠죠!"], ["me", "(실제로 돌려 본 결과를 보여 주자.)"]] },
          hint: "소문자 입력으로 실제로 돌려 본 기록이 있다.",
          win: [
            ["me", "소문자 vip로 돌려 보면 toUpperCase()를 부른 뒤에도 code는 <b>vip</b> 그대로예요."],
            ["me", "String은 <b>불변</b>이라 원본은 바뀌지 않아요. 대문자 결과는 새로 만들어져서 돌아오는데, 받지 않았으니 그대로 버려진 거예요."],
            ["witSweat", "아, 결과를 안 받았군요! <code>code = code.toUpperCase();</code>로 고쳤어요. 이제 <code>code == \"VIP\"</code>는 true죠!"],
            ["judge", "변호인, 그 고친 코드를 검토하세요."]
          ] },
        { combine: ["run_upper2", "spec_str"], result: "newstr",
          t: "toUpperCase()가 돌려주는 \"VIP\"는 어떤 문자열일까?\n결과를 받아 본 실행 결과와 String의 규칙을 조합해 보자.",
          wrong: "그 둘로는 정체가 안 나온다.",
          got: "toUpperCase()는 원본을 그대로 두고 <b>새 문자열</b>을 만든다…!\n새 증거 <b>📌 새로 만든 문자열</b>을 얻었다." },
        { cross: "jb2", title: "증언 ② 이제 ==도 true", who: "witSweat",
          lines: [
            { t: "toUpperCase()는 원래 문자열을 대문자로 고쳐서 돌려주니까, 리터럴 \"VIP\"와 같은 객체예요.",
              press: [["wit", "같은 VIP잖아요."], ["me", "(‘고쳐서 돌려준다’? 방금 조합한 추리와 다르다.)"]] },
            { t: "그래서 code == \"VIP\"도 true입니다.",
              press: [["wit", "같은 객체니까요."], ["me", "(앞 증언이 맞다면 그렇겠지. 앞 증언부터 확인하자.)"]] },
            { t: "이제 VIP 쿠폰은 제대로 적용됩니다.",
              press: [["wit", "완벽하죠."], ["me", "(결론은 앞 증언에 기대고 있다.)"]] }
          ],
          answer: { line: 0, ev: "newstr" },
          alt: { line: 1, ev: "run_vip", say: [["me", "돌려 보면 <code>code == \"VIP\"</code>는 false예요."], ["witSweat", "실행 환경이 이상했겠죠! 같은 객체라니까요!"], ["me", "(왜 다른 객체인지를 설명하는 추리를 들이밀자.)"]] },
          hint: "toUpperCase()가 돌려주는 문자열은 어떻게 만들어지지? 3화를 떠올려 보자.",
          win: [
            ["me", "toUpperCase()는 원본을 고치지 않아요. 대문자로 바꾼 <b>새 문자열</b>을 실행 중에 만들어서 돌려줘요."],
            ["me", "실행 중에 만든 \"VIP\"와 코드에 쓴 리터럴 \"VIP\"는 <b>다른 객체</b>예요. 3화처럼 ==는 false고, <code>code.equals(\"VIP\")</code>로 비교해야 해요."],
            ["witSweat", "크윽…! 쿠폰은 그렇다 쳐도, 적중률은 double rate에 담았으니 0.75가 맞아요!"],
            ["judge", "증인, 적중률에 대해 증언하세요."]
          ] },
        { cross: "jb3", title: "증언 ③ 적중률은 0.75", who: "witSweat",
          lines: [
            { t: "적중률은 맞힌 수를 시도 수로 나눠서 구합니다.",
              press: [["wit", "4번 중에 3번 맞혔으니까요."], ["me", "(3 / 4. 정수끼리의 나눗셈이다.)"]] },
            { t: "0%로 보이는 건 화면이 반올림해서예요.",
              press: [["wit", "백엔드는 잘못 없어요."], ["me", "(1화에서도 화면 탓을 했었지.)"]] },
            { t: "코드는 결과를 double rate에 담았으니 0.75가 나옵니다.",
              press: [["wit", "double이니까 소수점이 살죠."], ["me", "(이 말, 1화에서 들었다.)"]] }
          ],
          answer: { line: 2, ev: "run_rate" },
          hint: "적중률 부분을 실제로 돌려 본 기록이 있다. 1화를 떠올려 보자.",
          win: [
            ["me", "돌려 보면 <b>0.0</b>이에요. <code>3 / 4</code>는 정수 나눗셈이라 0이 되고, 그다음에 double로 바뀌어요. 1화의 평균 2.0과 똑같아요."],
            ["witSweat", "으윽…! 그, 그래도 지급 총액은 3만 명 × 10만 포인트, 30억이에요. 계산이 틀릴 리 없어요!"],
            ["judge", "…증인, 마지막으로 지급 총액에 대해 증언하세요."]
          ] },
        { cross: "jb4", title: "증언 ④ 30억은 그냥 30억", who: "witSweat",
          lines: [
            { t: "회원 3만 명 × 10만 포인트 = 30억. int total에 문제없이 담깁니다.",
              press: [["wit", "int면 충분하죠."], ["me", "(int의 끝이 얼마였더라. 2화를 떠올리자.)"]] },
            { t: "곱셈 한 번이라 계산이 틀릴 수가 없어요.",
              press: [["wit", "곱셈은 컴퓨터가 제일 잘하잖아요."], ["me", "(곱셈은 맞게 한다. 결과를 ‘어떤 타입으로’ 하느냐가 문제다.)"]] },
            { t: "마이너스가 보이는 건 회계팀이 잘못 본 거예요.",
              press: [["wit", "숫자는 거짓말을 안 하니까요."], ["me", "(숫자는 거짓말을 안 한다. 실제로 찍힌 숫자를 보여 주면 된다.)"]] }
          ],
          answer: { line: 0, ev: "run_total" },
          hint: "지급 총액 부분을 실제로 돌려 본 기록이 있다. 2화를 떠올려 보자.",
          win: [
            ["me", "돌려 보면 <b>-1294967296</b>이에요. int의 끝은 약 21억이라 30억은 넘쳐요. 30억에서 한 바퀴(4,294,967,296)를 뺀 값이죠."],
            ["me", "고칠 때도 2화를 기억해야 해요. <code>long total = members * 100_000;</code>은 곱셈이 int로 끝난 뒤라 여전히 넘쳐요. <code>(long) members * 100_000</code>처럼 계산부터 long으로 해야 해요."],
            ["witSweat", "으아아아악─!!!"],
            ["wit", "…전부 인정합니다. 결과를 안 받았고, 문자열을 ==로 비교했고, 정수끼리 나눴고, int로 곱했어요."],
            ["judge", "증인의 자백을 기록합니다. 변호인, 이제 고친 코드를 고르세요."]
          ] },
        { choice: "judge", t: "다음 중 올바르게 고친 코드는 어느 것입니까?",
          options: [
            { code: true, t: `code.toUpperCase();
vip = code.equals("VIP");
rate = (double) hits / tries;
long total = (long) members * 100_000;`, fb: "toUpperCase()의 결과를 받지 않았다. code는 여전히 소문자다." },
            { code: true, t: `code = code.toUpperCase();
vip = (code == "VIP");
rate = (double) hits / tries;
long total = (long) members * 100_000;`, fb: "새로 만든 문자열을 ==로 비교했다. 3화처럼 false다." },
            { code: true, ok: true, t: `code = code.toUpperCase();
vip = code.equals("VIP");
rate = (double) hits / tries;
long total = (long) members * 100_000;` },
            { code: true, t: `code = code.toUpperCase();
vip = code.equals("VIP");
rate = (double) hits / tries;
long total = members * 100_000;`, fb: "곱셈이 int로 끝난 뒤에 long에 담긴다. 2화처럼 이미 넘친 뒤다." }
          ],
          win: [
            ["judge", "결과는 받고, 문자열은 equals로, 나누기와 곱하기는 계산 전에 타입을 바꾼다."],
            ["me", "네. 고친 코드를 실제로 돌려서 확인해 둘게요."]
          ] },
        { gain: ["run_fixed"], t: "고친 코드를 실제로 돌려 본 결과가 법정 기록에 들어왔다. VIP는 true, 적중률 0.75, 총액 3000000000." },
        { choice: "judge", t: "마지막 질문입니다. 네 가지 버그에 공통된 교훈은 무엇입니까?",
          options: [
            { t: "변수 타입만 크게(double, long) 잡아 두면 대부분 해결된다", fb: "1화, 2화, 보스의 적중률과 총액 모두 ‘그릇’을 크게 잡았는데도 틀렸다." },
            { t: "테스트에서 한 번 통과하면 믿어도 된다", fb: "3화의 리터럴, 4화의 캐시 범위처럼 우연히 통과하는 테스트가 있다." },
            { t: "결과를 담는 곳이 아니라, 계산과 비교가 일어나는 그 순간의 타입과 대상을 확인하고, 실제로 돌려서 확인한다", ok: true },
            { t: "문자열과 숫자는 되도록 쓰지 않는다", fb: "쓰지 않는 게 아니라, 어떻게 동작하는지 알고 쓰는 게 핵심이다." }
          ],
          win: [
            ["judge", "…좋습니다."],
            ["me", "정수 나눗셈, 오버플로, 객체 비교, 불변 문자열. 전부 ‘그 순간 무슨 타입으로, 무엇을 비교하는가’였어요. 그리고 증인의 말 대신 실행 결과를 믿었고요."]
          ] },
        { verdict: true }
      ],
      verdict: {
        say: "본 법정은 이벤트 정산 대참사의 원인이 <b>네 가지 기초 함정</b>이 겹친 것이라고 판단합니다. 고친 코드로 재정산을 선고합니다. 이상, 폐정!",
        quote: "String은 불변이라 toUpperCase() 같은 메서드의 결과는 받아야 하고, 그렇게 새로 만든 문자열은 리터럴과 다른 객체라 equals로 비교해야 한다. 정수끼리 나누면 소수점이 버려지고, int끼리 곱하면 넘칠 수 있으니 계산 전에 타입을 바꿔야 한다. 담는 그릇이 아니라 계산과 비교가 일어나는 순간을 봐야 한다.",
        clues: [
          "String은 불변 → <code>code = code.toUpperCase();</code>처럼 결과를 받는다",
          "새로 만든 문자열 ≠ 리터럴 객체 → <code>equals</code> (3화)",
          "<code>3 / 4</code> → 0, <code>(double) hits / tries</code> → 0.75 (1화)",
          "<code>30_000 * 100_000</code> → −1294967296, <code>(long) members * 100_000</code> (2화)",
          "Integer는 -128~127만 같은 객체 → 객체끼리는 equals (4화)",
          "말보다 실행 결과를 믿는다"
        ]
      }
    }
  ]
};
