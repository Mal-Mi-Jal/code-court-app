#!/usr/bin/env node
// packs-src/*.js (사람이 쓰는 원고) → packs/<id>.json (앱이 읽는 파일)
// 원고를 JS로 쓰는 이유: 코드 속 따옴표·줄바꿈을 템플릿 문자열로 그대로 쓸 수 있어서 이스케이프 실수가 줄어든다.
// 사용법: node tools/build-packs.js        (전부 빌드)
//        node tools/build-packs.js --check (빌드 결과가 커밋된 JSON과 다르면 실패 — CI용)
const fs = require("fs");
const path = require("path");

const root = path.join(__dirname, "..");
const srcDir = path.join(root, "packs-src");
const check = process.argv.includes("--check");
let stale = false;

for (const name of fs.readdirSync(srcDir).filter(n => n.endsWith(".js")).sort()) {
  const pack = require(path.join(srcDir, name));
  const out = path.join(root, "packs", `${pack.id}.json`);
  const json = JSON.stringify(pack, null, 2) + "\n";
  if (check) {
    const cur = fs.existsSync(out) ? fs.readFileSync(out, "utf8") : "";
    if (cur !== json) { console.log(`✗ ${path.relative(root, out)}가 원고(${name})와 다릅니다. npm run build를 실행하세요`); stale = true; }
    else console.log(`✓ ${path.relative(root, out)} 최신`);
  } else {
    fs.writeFileSync(out, json, "utf8");
    console.log(`빌드 ${name} → ${path.relative(root, out)} (사건 ${pack.cases.length}개)`);
  }
}
process.exit(stale ? 1 : 0);
