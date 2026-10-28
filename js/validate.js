/* 코드 법정 사건팩 검증기 (code-court/v1)
 *
 * JSON 문법이 맞는지가 아니라 "이 사건을 끝까지 풀 수 있는가"를 본다.
 * 브라우저(편집기)와 Node(tools/validate.js, CI)에서 같이 쓴다.
 * 결과: { errors: [{ path, msg }], warnings: [{ path, msg }] }
 */
(function (root) {
  "use strict";

  const FORMAT = "code-court/v1";
  const STEP_KINDS = ["say", "gain", "cross", "combine", "choice", "verdict"];
  const ALLOWED_TAGS = /<\/?(b|code)>/g;

  function kindOf(st) {
    if (!st || typeof st !== "object") return "unknown";
    return STEP_KINDS.find(k => k in st) || "unknown";
  }

  function validatePack(pack) {
    const errors = [], warnings = [];
    const err = (path, msg) => errors.push({ path, msg });
    const warn = (path, msg) => warnings.push({ path, msg });
    const isStr = v => typeof v === "string" && v.length > 0;

    if (!pack || typeof pack !== "object") { err("", "팩이 객체가 아닙니다"); return { errors, warnings }; }
    if (pack.format !== FORMAT) err("format", `format은 "${FORMAT}"이어야 합니다`);
    if (!isStr(pack.id)) err("id", "팩 id가 없습니다");
    if (!isStr(pack.title)) err("title", "팩 제목이 없습니다");
    const common = pack.commonCharacters || {};
    ["judge", "me"].forEach(k => { if (!common[k]) err(`commonCharacters.${k}`, `엔진이 쓰는 인물 '${k}'가 없습니다`); });
    if (!Array.isArray(pack.cases) || pack.cases.length === 0) { err("cases", "사건이 없습니다"); return { errors, warnings }; }

    const ids = new Set();
    const answerLines = [];   // 증언 정답 줄 위치 (전부 같으면 찍기 쉬워진다)
    pack.cases.forEach((c, ci) => {
      const P = `cases[${ci}]`;
      if (!isStr(c.id)) err(`${P}.id`, "사건 id가 없습니다");
      else if (ids.has(c.id)) err(`${P}.id`, `사건 id '${c.id}'가 겹칩니다`);
      ids.add(c.id);
      if (c.soon) return;   // 예고 카드는 내용이 없어도 된다
      ["ep", "title", "blurb"].forEach(k => { if (!isStr(c[k])) err(`${P}.${k}`, `${k}가 없습니다`); });
      if (c.trust !== undefined && !(Number.isInteger(c.trust) && c.trust > 0)) err(`${P}.trust`, "trust는 1 이상의 정수여야 합니다");

      const chars = Object.assign({}, common, c.characters || {});
      const evidence = c.evidence || {};
      const script = c.script;

      Object.entries(evidence).forEach(([id, e]) => {
        ["ic", "k", "name", "desc", "code"].forEach(k => { if (typeof e[k] !== "string") err(`${P}.evidence.${id}.${k}`, `증거의 ${k}가 문자열이 아닙니다`); });
        if (e.source) {
          const doc = pack.sources && pack.sources[e.source.doc];
          if (typeof doc !== "string") err(`${P}.evidence.${id}.source`, `원문 '${e.source.doc}'이 팩에 없습니다`);
          else if (!isStr(e.source.quote) || !doc.includes(e.source.quote)) err(`${P}.evidence.${id}.source.quote`, "인용문이 원문에 글자 그대로 없습니다");
        }
      });

      const checkSpeaker = (path, key) => { if (!chars[key]) err(path, `등장인물 '${key}'가 없습니다`); };
      const checkText = (path, t) => {
        if (!isStr(t)) { err(path, "대사가 없습니다"); return; }
        // <code> 안의 List<Integer> 같은 제네릭은 태그가 아니다 (화면에서는 글자 그대로 보인다)
        const rest = t.replace(/<code>[\s\S]*?<\/code>/g, "").replace(ALLOWED_TAGS, "");
        if (/<\/?[a-zA-Z]/.test(rest)) warn(path, "허용하지 않은 태그가 있습니다 (<b>, <code>만 가능)");
      };
      const checkLines = (path, lines) => {
        if (!Array.isArray(lines) || lines.length === 0) { err(path, "대사 목록이 비어 있습니다"); return; }
        lines.forEach((ln, k) => {
          if (!Array.isArray(ln) || ln.length !== 2) { err(`${path}[${k}]`, "대사는 [인물, 대사] 모양이어야 합니다"); return; }
          checkSpeaker(`${path}[${k}][0]`, ln[0]); checkText(`${path}[${k}][1]`, ln[1]);
        });
      };
      const needEv = (path, id, have) => {
        if (!evidence[id]) err(path, `증거 '${id}'가 evidence에 없습니다`);
        else if (!have.has(id)) err(path, `증거 '${id}'를 이 단계 전에 얻지 못합니다`);
      };

      if (!Array.isArray(script) || script.length === 0) { err(`${P}.script`, "단계가 없습니다"); return; }
      const have = new Set();
      script.forEach((st, si) => {
        const S = `${P}.script[${si}]`;
        const k = kindOf(st);
        if (k === "unknown") { err(S, "알 수 없는 단계입니다"); return; }
        if (k === "say") { checkSpeaker(`${S}.say`, st.say); checkText(`${S}.t`, st.t); }
        if (k === "gain") {
          if (!Array.isArray(st.gain) || st.gain.length === 0) err(`${S}.gain`, "받을 증거가 없습니다");
          else st.gain.forEach((id, j) => { if (!evidence[id]) err(`${S}.gain[${j}]`, `증거 '${id}'가 evidence에 없습니다`); else have.add(id); });
          checkText(`${S}.t`, st.t);
        }
        if (k === "cross") {
          checkSpeaker(`${S}.who`, st.who);
          if (!isStr(st.title)) err(`${S}.title`, "증언 제목이 없습니다");
          const n = Array.isArray(st.lines) ? st.lines.length : 0;
          if (n === 0) err(`${S}.lines`, "증언 줄이 없습니다");
          (st.lines || []).forEach((ln, j) => { checkText(`${S}.lines[${j}].t`, ln.t); checkLines(`${S}.lines[${j}].press`, ln.press); });
          const a = st.answer || {};
          if (!(Number.isInteger(a.line) && a.line >= 0 && a.line < n)) err(`${S}.answer.line`, "정답 줄이 범위 밖입니다");
          else answerLines.push(a.line);
          needEv(`${S}.answer.ev`, a.ev, have);
          if (st.alt) {
            if (!(Number.isInteger(st.alt.line) && st.alt.line >= 0 && st.alt.line < n)) err(`${S}.alt.line`, "대체 증거 줄이 범위 밖입니다");
            needEv(`${S}.alt.ev`, st.alt.ev, have);
            if (st.alt.line === a.line && st.alt.ev === a.ev) err(`${S}.alt`, "대체 증거가 정답과 같습니다");
            checkLines(`${S}.alt.say`, st.alt.say);
          }
          if (!isStr(st.hint)) err(`${S}.hint`, "힌트가 없습니다");
          checkLines(`${S}.win`, st.win);
        }
        if (k === "combine") {
          if (!Array.isArray(st.combine) || st.combine.length !== 2 || st.combine[0] === st.combine[1]) err(`${S}.combine`, "서로 다른 증거 두 개가 필요합니다");
          else st.combine.forEach((id, j) => needEv(`${S}.combine[${j}]`, id, have));
          if (!evidence[st.result]) err(`${S}.result`, `결과 증거 '${st.result}'가 evidence에 없습니다`);
          else have.add(st.result);
          ["t", "wrong", "got"].forEach(f => checkText(`${S}.${f}`, st[f]));
        }
        if (k === "choice") {
          checkSpeaker(`${S}.choice`, st.choice); checkText(`${S}.t`, st.t);
          const opts = st.options || [];
          if (opts.length < 2) err(`${S}.options`, "선택지가 두 개 이상 필요합니다");
          const okCount = opts.filter(o => o.ok).length;
          if (okCount !== 1) err(`${S}.options`, `정답 선택지가 ${okCount}개입니다 (정확히 1개)`);
          opts.forEach((o, j) => {
            if (!isStr(o.t)) err(`${S}.options[${j}].t`, "선택지 문장이 없습니다");
            if (!o.ok && !isStr(o.fb)) err(`${S}.options[${j}].fb`, "오답 피드백이 없습니다");
          });
          checkLines(`${S}.win`, st.win);
        }
        if (k === "verdict" && si !== script.length - 1) err(S, "판결은 마지막 단계여야 합니다");
      });

      if (kindOf(script[script.length - 1]) !== "verdict") err(`${P}.script`, "마지막 단계가 판결이 아닙니다");
      const v = c.verdict || {};
      checkText(`${P}.verdict.say`, v.say);
      if (!isStr(v.quote)) err(`${P}.verdict.quote`, "판결 정리 문장이 없습니다");
      if (!Array.isArray(v.clues) || v.clues.length === 0) err(`${P}.verdict.clues`, "단서 목록이 없습니다");

      Object.keys(evidence).forEach(id => {
        const used = JSON.stringify(script).includes(`"${id}"`);
        if (!used) warn(`${P}.evidence.${id}`, "어디에서도 쓰지 않는 증거입니다");
      });
    });

    // 선택지는 화면이 섞어 주지만, 증언 순서는 원고 그대로다. 정답 줄이 한 자리에 몰리면 경고한다
    if (answerLines.length >= 3) {
      const counts = {};
      answerLines.forEach(l => { counts[l] = (counts[l] || 0) + 1; });
      const [line, most] = Object.entries(counts).sort((x, y) => y[1] - x[1])[0];
      if (most / answerLines.length > 0.6) warn("cases", `증언 정답 줄이 ${answerLines.length}개 중 ${most}개가 ${Number(line) + 1}번째입니다 (위치를 섞어 주세요)`);
    }

    return { errors, warnings };
  }

  const Validate = { FORMAT, validatePack, kindOf };
  if (typeof module !== "undefined" && module.exports) module.exports = Validate;
  else root.CourtValidate = Validate;
})(typeof self !== "undefined" ? self : this);
