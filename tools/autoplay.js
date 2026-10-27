#!/usr/bin/env node
// 사용법: node tools/autoplay.js packs/_test/ramen-sample.json [다른 팩 …]
// 화면 없이 core.js로 모든 사건을 끝까지 풀어 본다. 정답 경로 + 대체 증거 + 오답 감점 + 오답 선택지를 확인한다.
// 하나라도 판결까지 못 가면 종료 코드 1.
const fs = require("fs");
const Core = require("../js/core.js");

function play(pack, c) {
  const log = [];
  const fail = msg => { throw new Error(`${c.id} 단계 ${S.i}: ${msg}`); };
  const S = Core.fresh(c);
  let checkedWrong = false;
  for (let guard = 0; guard < 500; guard++) {
    const st = Core.enter(c, S);
    const k = Core.kind(st);
    if (k === "end") fail("판결 없이 단계가 끝났습니다");
    if (k === "unknown") fail("알 수 없는 단계");
    if (k === "verdict") { log.push(`판결 도달 (남은 신뢰도 ${S.trust}/${Core.maxTrust(c)})`); return log; }

    if (k === "say" || k === "gain") { Core.next(c, S); continue; }

    if (k === "cross") {
      // 대체 증거: 감점 없이 alt 대사가 나와야 한다
      if (st.alt) {
        S.line = st.alt.line;
        if (!S.have.includes(st.alt.ev)) fail(`대체 증거 '${st.alt.ev}'를 아직 갖고 있지 않습니다`);
        const before = S.trust;
        const r = Core.present(c, S, st.alt.ev);
        if (r.result !== "alt" || S.trust !== before) fail("대체 증거가 alt로 처리되지 않았습니다");
      }
      // 사건마다 첫 증언에서 한 번: 오답 → 감점, hard면 첫 실수에 힌트 없음
      if (!checkedWrong) {
        const wrongEv = S.have.find(e => e !== st.answer.ev && !(st.alt && e === st.alt.ev));
        if (wrongEv) {
          S.line = st.answer.line;
          const before = S.trust;
          const r = Core.present(c, S, wrongEv);
          if (r.result !== "wrong" || S.trust !== before - 1) fail("오답이 감점되지 않았습니다");
          const expectHint = !c.hard || before < Core.maxTrust(c);
          if (expectHint !== (r.hint !== null)) fail(`힌트 표시가 규칙과 다릅니다 (hard=${!!c.hard})`);
          log.push(`오답 감점 확인 (힌트 ${r.hint ? "있음" : "없음"})`);
          Core.retry(c, S);
        }
        checkedWrong = true;
      }
      // 정답
      S.line = st.answer.line;
      if (!S.have.includes(st.answer.ev)) fail(`정답 증거 '${st.answer.ev}'를 아직 갖고 있지 않습니다`);
      const r = Core.present(c, S, st.answer.ev);
      if (r.result !== "win") fail("정답 증거가 이기지 못했습니다");
      log.push(`증언 '${st.title}' 돌파`);
      Core.next(c, S);
      continue;
    }

    if (k === "combine") {
      const r = Core.combine(c, S, st.combine.slice());
      if (!r.ok || !S.have.includes(st.result)) fail("조합에 실패했습니다");
      log.push(`조합 → ${c.evidence[st.result].name}`);
      Core.next(c, S);
      continue;
    }

    if (k === "choice") {
      const wrongIdx = st.options.findIndex(o => !o.ok);
      if (wrongIdx >= 0) {
        const before = S.trust;
        const w = Core.choose(c, S, wrongIdx);
        if (w.ok || S.trust !== before - 1 || !w.fb) fail("오답 선택지가 감점·피드백되지 않았습니다");
        Core.retry(c, S);
      }
      const okIdx = st.options.findIndex(o => o.ok);
      const r = Core.choose(c, S, okIdx);
      if (!r.ok) fail("정답 선택지가 통과하지 못했습니다");
      Core.next(c, S);
      continue;
    }
  }
  fail("단계가 너무 많습니다 (무한 반복?)");
}

const files = process.argv.slice(2);
if (files.length === 0) { console.error("사용법: node tools/autoplay.js <팩.json> [...]"); process.exit(2); }
let failed = false;
for (const f of files) {
  const pack = JSON.parse(fs.readFileSync(f, "utf8"));
  console.log(`▶ ${pack.title} (${f})`);
  for (const c of pack.cases) {
    if (c.soon) { console.log(`  - ${c.id}: 예고 카드 (건너뜀)`); continue; }
    try {
      const log = play(pack, c);
      console.log(`  ✓ ${c.id} ${c.title}: ${log[log.length - 1]}`);
      log.slice(0, -1).forEach(l => console.log(`      · ${l}`));
    } catch (e) {
      console.log(`  ✗ ${e.message}`);
      failed = true;
    }
  }
}
process.exit(failed ? 1 : 0);
