#!/usr/bin/env node
// 사용법: node tools/validate.js packs/_test/ramen-sample.json [다른 팩 …]
// 오류가 하나라도 있으면 종료 코드 1 (CI에서 실패)
const fs = require("fs");
const { validatePack } = require("../js/validate.js");

const files = process.argv.slice(2);
if (files.length === 0) { console.error("사용법: node tools/validate.js <팩.json> [...]"); process.exit(2); }

let failed = false;
for (const f of files) {
  let pack;
  try { pack = JSON.parse(fs.readFileSync(f, "utf8")); }
  catch (e) { console.log(`✗ ${f}: JSON을 읽지 못했습니다 (${e.message})`); failed = true; continue; }
  const { errors, warnings } = validatePack(pack);
  console.log(`${errors.length ? "✗" : "✓"} ${f}: 사건 ${pack.cases ? pack.cases.length : 0}개, 오류 ${errors.length}, 경고 ${warnings.length}`);
  errors.forEach(e => console.log(`   오류  ${e.path}: ${e.msg}`));
  warnings.forEach(w => console.log(`   경고  ${w.path}: ${w.msg}`));
  if (errors.length) failed = true;
}
process.exit(failed ? 1 : 0);
