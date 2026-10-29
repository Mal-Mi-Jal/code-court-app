/* 코드 법정 엔진 — 순수 로직 (화면 없음)
 *
 * 브라우저(ui.js)와 Node(tools/autoplay.js)가 같은 규칙을 쓰도록 판정은 전부 여기에 둔다.
 * 진행 상태 S는 JSON으로 저장할 수 있는 평범한 객체다:
 *   { i: 지금 단계 번호, trust: 남은 신뢰도, have: [가진 증거 id], fresh: [새로 받은 증거 id], line: 증언의 몇 번째 줄 }
 * 함수들은 S를 직접 바꾸고, 화면이 보여 줄 결과만 돌려준다.
 */
(function (root) {
  "use strict";

  const DEFAULT_TRUST = 5;

  /** 사건의 최대 신뢰도 (보스전은 사건마다 따로 둔다) */
  function maxTrust(c) { return (c && c.trust) || DEFAULT_TRUST; }

  /** 처음 상태 */
  function fresh(c) { return { i: 0, trust: maxTrust(c), have: [], fresh: [], line: 0 }; }

  /** 저장해 둔 상태를 불러올 때 빠진 값을 채우고, 이미 끝난 사건이면 처음부터 */
  function restore(c, saved) {
    const S = Object.assign(fresh(c), saved || {});
    if (S.i >= c.script.length) return fresh(c);
    return S;
  }

  function step(c, S) { return c.script[S.i] || null; }

  /** 단계 종류: 객체에 어떤 키가 있느냐로 정한다 */
  function kind(st) {
    if (!st) return "end";
    if ("say" in st) return "say";
    if ("gain" in st) return "gain";
    if ("cross" in st) return "cross";
    if ("combine" in st) return "combine";
    if ("choice" in st) return "choice";
    if ("verdict" in st) return "verdict";
    return "unknown";
  }

  /** 단계에 들어갈 때 할 일 (증거 받기) */
  function enter(c, S) {
    const st = step(c, S);
    if (st && kind(st) === "gain") {
      st.gain.forEach(e => { if (!S.have.includes(e)) { S.have.push(e); S.fresh.push(e); } });
    }
    return st;
  }

  function next(c, S) { S.i++; S.line = 0; }

  /** 증언 줄 이동 (◀ ▶). ▶는 마지막 줄에서 첫 줄로 돌아간다 */
  function moveLine(c, S, delta) {
    const n = step(c, S).lines.length;
    S.line = Math.max(0, delta < 0 ? S.line - 1 : (S.line + 1) % n);
  }

  function lose(S) { S.trust--; return S.trust <= 0; }

  /**
   * 증거 제시.
   * - 정답 줄 + 정답 증거 → win (이긴 뒤 대사)
   * - 대체 증거(alt) → alt (힌트성 대사, 감점 없음)
   * - 그 외 → wrong (신뢰도 −1). hard 사건은 첫 실수에 힌트를 숨긴다
   */
  function present(c, S, evId) {
    const st = step(c, S);
    const a = st.answer;
    if (S.line === a.line && evId === a.ev) return { result: "win", lines: st.win };
    if (st.alt && S.line === st.alt.line && evId === st.alt.ev) return { result: "alt", lines: st.alt.say };
    const showHint = !c.hard || S.trust < maxTrust(c);
    const ev = c.evidence[evId];
    const gameOver = lose(S);
    return { result: "wrong", evName: ev ? ev.name : evId, hint: showHint ? st.hint : null, gameOver };
  }

  /** 증거 두 개 조합 */
  function combine(c, S, picked) {
    const st = step(c, S);
    const ok = picked.length === 2 && st.combine.every(x => picked.includes(x));
    if (ok) {
      if (!S.have.includes(st.result)) { S.have.push(st.result); S.fresh = [st.result]; }
      return { ok: true, got: st.got, result: st.result };
    }
    const gameOver = lose(S);
    return { ok: false, msg: st.wrong, gameOver };
  }

  /** 선택지 고르기 */
  function choose(c, S, idx) {
    const st = step(c, S);
    const o = st.options[idx];
    if (o.ok) return { ok: true, lines: st.win };
    const gameOver = lose(S);
    return { ok: false, fb: o.fb, gameOver };
  }

  /** 신뢰도가 바닥났을 때 이번 장면을 다시 */
  function retry(c, S) { S.trust = maxTrust(c); S.line = 0; }
  /** 광고 보상으로 이어하기: 그 자리 그대로, 신뢰도만 n칸 채운다 */
  function revive(c, S, n = 1) { S.trust = Math.min(maxTrust(c), Math.max(S.trust, 0) + n); }

  /** 팩 공통 등장인물 + 사건 등장인물 */
  function characters(pack, c) { return Object.assign({}, pack.commonCharacters || {}, c.characters || {}); }

  const Core = { DEFAULT_TRUST, maxTrust, fresh, restore, step, kind, enter, next, moveLine, present, combine, choose, retry, revive, characters };

  if (typeof module !== "undefined" && module.exports) module.exports = Core;
  else root.CourtCore = Core;
})(typeof self !== "undefined" ? self : this);
