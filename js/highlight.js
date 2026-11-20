/* 코드 법정 문법 하이라이팅 — 아주 작은 토큰 나누기 (Java·Python)
 *
 * 외부 라이브러리 없이 오프라인(PWA)에서도 돌도록 직접 만든다. 완벽한 파서가 아니라
 * 주석·문자열·숫자·키워드·타입 정도만 색을 입힌다. 결과는 escape된 HTML이라 innerHTML에 넣어도 안전하다.
 * tools/check-highlight.js가 "색을 빼면 원래 코드와 글자 하나까지 같은지"를 모든 증거로 확인한다.
 */
(function (root) {
  "use strict";

  function esc(s) { return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;"); }

  const JAVA_KW = "abstract assert boolean break byte case catch char class const continue default do double else enum extends final finally float for goto if implements import instanceof int interface long native new package private protected public record return short static strictfp super switch synchronized this throw throws transient try var void volatile while yield true false null".split(" ");
  const PY_KW = "False None True and as assert async await break class continue def del elif else except finally for from global if import in is lambda nonlocal not or pass raise return try while with yield".split(" ");
  const PY_BUILTIN = "print len range list dict set tuple str int float bool sorted sum min max abs round type isinstance enumerate zip map filter open iter next object super".split(" ");

  // 순서가 중요하다: 주석과 문자열을 먼저 잡아야 그 안의 키워드에 색이 안 들어간다
  const RULES = {
    java: [
      ["com", /\/\/[^\n]*|\/\*[\s\S]*?\*\//y],
      ["str", /"""[\s\S]*?"""|"(?:\\.|[^"\\\n])*"|'(?:\\.|[^'\\\n])*'/y],
      ["ann", /@[A-Za-z_]\w*/y],
      ["num", /\b(?:0[xX][0-9a-fA-F_]+|\d[\d_]*(?:\.\d[\d_]*)?(?:[eE][+-]?\d+)?[LlFfDd]?)\b/y],
      ["word", /[A-Za-z_$][\w$]*/y]
    ],
    python: [
      ["com", /#[^\n]*/y],
      ["str", /[rRbBfFuU]{0,2}(?:"""[\s\S]*?"""|'''[\s\S]*?'''|"(?:\\.|[^"\\\n])*"|'(?:\\.|[^'\\\n])*')/y],
      ["ann", /@[A-Za-z_][\w.]*/y],
      ["num", /\b(?:0[xX][0-9a-fA-F_]+|\d[\d_]*(?:\.\d[\d_]*)?(?:[eE][+-]?\d+)?j?)\b/y],
      ["word", /[A-Za-z_]\w*/y]
    ]
  };

  function classify(lang, w) {
    if (lang === "java") {
      if (JAVA_KW.includes(w)) return "kw";
      if (/^[A-Z]/.test(w)) return "type";
      return null;
    }
    if (PY_KW.includes(w)) return "kw";
    if (PY_BUILTIN.includes(w)) return "fn";
    if (/^[A-Z]/.test(w)) return "type";
    return null;
  }

  // 실행 결과 카드는 "코드 + 빈 줄 + // 실행 결과(Python은 #) + 출력 줄들" 모양이다.
  // 출력이 증거의 핵심이라, 주석처럼 흐리게 두지 않고 따로 진하게 보여 준다
  const OUTPUT_MARK = /\n(?:\/\/|#) 실행 결과\n/;

  /** 실행 결과 카드용: 코드 부분은 색을 입히고, 출력 부분은 hl-out으로 묶는다 */
  function highlightRun(code, language) {
    const src = String(code ?? "");
    const m = OUTPUT_MARK.exec(src);
    if (!m) return highlight(src, language);
    const head = src.slice(0, m.index + 1);          // 코드 + 줄바꿈
    const tail = src.slice(m.index + 1);             // "// 실행 결과\n// 2.0"
    return highlight(head, language) + `<span class="hl-out">${esc(tail)}</span>`;
  }

  /** 코드 → 색이 들어간 HTML. 모르는 언어면 escape만 한다 */
  function highlight(code, language) {
    const lang = String(language || "").toLowerCase();
    const rules = RULES[lang];
    const src = String(code ?? "");
    if (!rules) return esc(src);
    let out = "", plain = "", i = 0;
    const flush = () => { if (plain) { out += esc(plain); plain = ""; } };
    const wrap = (cls, text) => { flush(); out += `<span class="hl-${cls}">${esc(text)}</span>`; };
    while (i < src.length) {
      let hit = null;
      for (const [name, re] of rules) {
        re.lastIndex = i;
        const m = re.exec(src);
        if (m && m.index === i && m[0].length) { hit = [name, m[0]]; break; }
      }
      if (!hit) { plain += src[i++]; continue; }
      const [name, text] = hit;
      if (name === "word") {
        const cls = classify(lang, text);
        if (cls) wrap(cls, text); else plain += text;
      } else wrap(name, text);
      i += text.length;
    }
    flush();
    return out;
  }

  const Highlight = { highlight, highlightRun, esc };
  if (typeof module !== "undefined" && module.exports) module.exports = Highlight;
  else root.CourtHighlight = Highlight;
})(typeof self !== "undefined" ? self : this);
