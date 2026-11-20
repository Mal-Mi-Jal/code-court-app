// 문법 하이라이팅 검사: 모든 팩의 코드 증거·코드 선택지에 색을 입힌 뒤,
// 태그를 빼고 escape를 되돌리면 원래 코드와 글자 하나까지 같은지 확인한다.
// (색 입히다가 코드가 빠지거나 바뀌면 사건 내용이 틀어지므로)
const fs = require("fs");
const path = require("path");
const { highlight, highlightRun } = require("../js/highlight.js");

const unesc = s => s.replace(/<[^>]+>/g, "").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&amp;/g, "&");
let total = 0, colored = 0, bad = 0;

for (const file of process.argv.slice(2)) {
  const pack = JSON.parse(fs.readFileSync(file, "utf8"));
  const lang = pack.language;
  const check = (where, code, run) => {
    total++;
    const html = run ? highlightRun(code, lang) : highlight(code, lang);
    if (run && !html.includes('class="hl-out"')) { bad++; console.log(`✗ ${path.basename(file)} ${where}: 실행 결과 출력 부분을 못 찾음`); }
    if (html.includes("hl-")) colored++;
    if (unesc(html) !== code) { bad++; console.log(`✗ ${path.basename(file)} ${where}: 색을 빼면 원래 코드와 다름`); }
    if (/<(?!\/?span\b)/.test(html)) { bad++; console.log(`✗ ${path.basename(file)} ${where}: span 말고 다른 태그가 생김`); }
  };
  for (const c of pack.cases || []) {
    for (const [id, e] of Object.entries(c.evidence || {})) if (e.code) check(`${c.id}/${id}`, e.code, e.k === "실행 결과");
    for (const st of c.script || []) for (const o of st.options || []) if (o.code) check(`${c.id}/선택지`, o.t);
  }
}
console.log(`하이라이팅: ${total}개 중 색이 들어간 것 ${colored}개, 어긋남 ${bad}개`);
// 일부러 틀린 예: 원래 코드를 바꾸는 하이라이터면 잡혀야 한다
if (unesc(highlight('String s = "a<b>";', "Java")) !== 'String s = "a<b>";') { console.log("✗ 기본 예제 실패"); bad++; }
process.exit(bad ? 1 : 0);
