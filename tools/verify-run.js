#!/usr/bin/env node
// 사용법: node tools/verify-run.js packs/java-basics.json [다른 팩 …]
//
// 증거에 붙은 run: { lang, snippet, expected } 를 실제로 돌린다. java = JDK 단일 파일 실행(java Main.java), python = python main.py
// 확인하는 것
//   1) 실제 출력 == expected  (사건 속 "실행 결과"가 지어낸 게 아니다)
//   2) 플레이어가 보는 증거 카드(code)에 expected의 각 줄이 그대로 적혀 있다
// snippet은 main 메서드의 본문이다. 클래스가 필요하면 snippet 안에 static 메서드나 record를 둘 수 없으니, classes에 따로 적는다.
// 하나라도 다르면 종료 코드 1.
const fs = require("fs");
const os = require("os");
const path = require("path");
const { spawnSync } = require("child_process");

function runJava(snippet, classes) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "court-verify-"));
  // 사건 코드는 짧게 보여 주려고 import를 생략하므로, 자주 쓰는 패키지는 여기서 넣어 준다
  const src = `import java.util.*;\nimport java.util.function.*;\nimport java.util.stream.*;\nimport java.math.*;\nimport java.time.*;\nimport java.time.format.*;\nimport java.time.temporal.*;\nimport java.util.concurrent.*;\nimport java.util.concurrent.atomic.*;\n\npublic class Main {\n${classes || ""}\n  public static void main(String[] args) throws Exception {\n${snippet}\n  }\n}\n`;
  const file = path.join(dir, "Main.java");
  fs.writeFileSync(file, src, "utf8");
  const r = spawnSync("java", ["-Dstdout.encoding=UTF-8", "-Dfile.encoding=UTF-8", file], { encoding: "utf8", timeout: 30000 });
  fs.rmSync(dir, { recursive: true, force: true });
  return { stdout: (r.stdout || "").replace(/\r/g, "").trimEnd(), stderr: (r.stderr || "").trim(), status: r.status };
}

// Python: snippet이 파일 전체다. 버전마다 예외 메시지가 달라서 CI는 3.14로 고정한다
function runPython(snippet) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "court-verify-"));
  const file = path.join(dir, "main.py");
  fs.writeFileSync(file, snippet + "\n", "utf8");
  const r = spawnSync("python", ["-X", "utf8", file], { encoding: "utf8", timeout: 30000 });
  fs.rmSync(dir, { recursive: true, force: true });
  return { stdout: (r.stdout || "").replace(/\r/g, "").trimEnd(), stderr: (r.stderr || "").trim(), status: r.status };
}

const files = process.argv.slice(2);
if (files.length === 0) { console.error("사용법: node tools/verify-run.js <팩.json> [...]"); process.exit(2); }

let failed = false, count = 0;
for (const f of files) {
  const pack = JSON.parse(fs.readFileSync(f, "utf8"));
  console.log(`▶ ${pack.title} (${f})`);
  for (const c of pack.cases) {
    for (const [id, e] of Object.entries(c.evidence || {})) {
      if (!e.run) continue;
      count++;
      const where = `${c.id}.${id}`;
      if (e.run.lang !== "java" && e.run.lang !== "python") { console.log(`  ✗ ${where}: 지원하지 않는 언어 '${e.run.lang}'`); failed = true; continue; }
      const r = e.run.lang === "python" ? runPython(e.run.snippet) : runJava(e.run.snippet, e.run.classes);
      const expected = String(e.run.expected).replace(/\r/g, "").trimEnd();
      if (r.status !== 0 && !e.run.expectFail) {
        console.log(`  ✗ ${where}: 실행 실패 (종료 코드 ${r.status})\n${r.stderr.split("\n").slice(0, 6).map(l => "      " + l).join("\n")}`);
        failed = true; continue;
      }
      if (r.stdout !== expected) {
        console.log(`  ✗ ${where}: 출력이 다릅니다\n      기대: ${JSON.stringify(expected)}\n      실제: ${JSON.stringify(r.stdout)}`);
        failed = true; continue;
      }
      const missing = expected.split("\n").filter(line => line && !e.code.includes(line));
      if (missing.length) {
        console.log(`  ✗ ${where}: 증거 카드에 실제 출력이 적혀 있지 않습니다 → ${JSON.stringify(missing)}`);
        failed = true; continue;
      }
      console.log(`  ✓ ${where}: ${JSON.stringify(expected)}`);
    }
  }
}
console.log(`실행 검증 ${count}건, ${failed ? "실패 있음" : "모두 일치"}`);
process.exit(failed ? 1 : 0);
