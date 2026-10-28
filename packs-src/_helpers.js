// 사건 원고 공용 도우미 (이름이 _로 시작하는 파일은 팩으로 빌드하지 않는다)

/** 일반 증거 */
const ev = (ic, k, name, desc, code) => ({ ic, k, name, desc, code });

/**
 * 실행 결과 증거: 카드에는 코드와 실제 출력을 함께 보여 주고, run에 검증 정보를 남긴다.
 * classes: main 바깥에 둘 클래스 선언 (Main 안의 static 멤버로 들어간다). 카드에도 함께 보여 준다.
 */
function runEv(name, desc, snippet, expected, classes) {
  const shownClasses = classes ? classes.trim() + "\n\n" : "";
  const shown = shownClasses + snippet.trim() + "\n\n// 실행 결과\n" + expected.split("\n").map(l => "// " + l).join("\n");
  const run = { lang: "java", snippet: snippet.trim(), expected };
  if (classes) run.classes = classes.trim();
  return { ic: "▶️", k: "실행 결과", name, desc, code: shown, run };
}

const spec = (name, desc, code) => ev("📘", "명세 요약", name, desc, code);

const COMMON = {
  judge: ["⚖️", "재판장"],
  me: ["🧑‍💻", "나 (변호인)"],
  wit: ["🤓", "단정해 (코드 리뷰어)"],
  witSweat: ["😰", "단정해 (코드 리뷰어)"]
};

module.exports = { ev, runEv, spec, COMMON };
