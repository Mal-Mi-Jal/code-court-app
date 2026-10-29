/* 코드 법정 화면 — 판정은 core.js(CourtCore)에 맡기고, 여기서는 보여 주기만 한다 */
(function () {
  "use strict";
  const Core = window.CourtCore;
  const $ = id => document.getElementById(id);
  const DEV = location.hash === "#dev";   // #dev면 개발용(test) 팩도 보인다

  let packs = [];        // packs/index.json 목록
  let pack = null;       // 지금 연 팩
  let C = null;          // 지금 사건
  let S = null;          // 지금 사건의 진행 상태
  let P = {};            // 지금 사건의 등장인물
  let screen = "home";

  /* ---------- 저장 (기기 안에만) ---------- */
  function store(key, val) { try { localStorage.setItem(key, JSON.stringify(val)); } catch (e) {} }
  function fetchKey(key) { try { return JSON.parse(localStorage.getItem(key)); } catch (e) { return null; } }
  const progKey = (p, c) => `court:${p.id}:${c.id}`;
  const solvedKey = p => `court:${p.id}:solved`;
  function save() { if (pack && C) store(progKey(pack, C), S); }

  /* ---------- 글자 다루기 ---------- */
  function esc(s) { return String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;"); }
  // 대사 꾸밈은 <b>와 <code>만 살린다. 나머지 태그는 글자 그대로 보인다
  function rich(s) { return esc(s).replace(/&lt;(\/?)(b|code)&gt;/g, "<$1$2>"); }
  // 피셔-예이츠 섞기 (새 배열을 돌려준다)
  function shuffled(arr) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
    return a;
  }

  /* ---------- 홈: 코스(팩) 목록 ---------- */
  function showHome() {
    screen = "home"; pack = null; C = null;
    document.body.classList.remove("boss-mode");
    showMenuChrome("코드 법정", "코드 법정", false);
    $("lead").textContent = "증언에서 모순을 찾아 증거를 제시하세요. 코드가 정말 그렇게 동작하는지, 반례와 실행 결과로 반박하는 재판이에요.";
    const box = $("cases"); box.innerHTML = "";
    // 챕터는 배우는 순서다. 번호순으로 놓고, 번호와 주제를 배지로 크게 보여 준다
    packs.filter(p => DEV || !p.test)
      .sort((a, b) => (a.chapter || 99) - (b.chapter || 99))
      .forEach(p => {
        const solved = Object.keys(fetchKey(`court:${p.id}:solved`) || {}).length;
        box.appendChild(card({
          ep: p.test ? "개발용 팩" : (p.language || "코스"), title: p.title, blurb: p.blurb || "",
          chapter: p.chapter ? [p.chapter, p.topic] : null,
          state: p.soon ? ["", "준비 중"] : solved ? ["going", `${solved}개 해결`] : ["", "열기"], soon: p.soon,
          on: () => openPack(p)
        }));
      });
    if (!box.children.length) box.innerHTML = `<p class="note">아직 열린 코스가 없어요.</p>`;
  }

  async function openPack(entry) {
    try {
      // no-cache: 캐시가 있어도 서버에 바뀌었는지 먼저 물어본다 (안 바뀌었으면 304로 빠르게 끝남)
      const res = await fetch(entry.file, { cache: "no-cache" });
      if (!res.ok) throw new Error(res.status);
      pack = await res.json();
      showPack();
    } catch (e) {
      $("cases").innerHTML = `<p class="note">코스를 불러오지 못했어요. 잠시 뒤 다시 시도해 주세요.</p>`;
    }
  }

  /* ---------- 팩: 사건 목록 ---------- */
  function showPack() {
    screen = "pack"; C = null;
    document.body.classList.remove("boss-mode");
    showMenuChrome(pack.title, pack.title, true);
    $("lead").textContent = pack.lead || "증언에서 모순을 찾아 증거를 제시하세요.";
    const solved = fetchKey(solvedKey(pack)) || {};
    const box = $("cases"); box.innerHTML = "";
    pack.cases.forEach(c => {
      const prog = !c.soon && fetchKey(progKey(pack, c));
      const state = c.soon ? ["", "준비 중"] : solved[c.id] ? ["done", "해결"] : prog && prog.i > 0 ? ["going", "진행 중"] : ["", "새 사건"];
      box.appendChild(card({ ep: c.ep, title: c.title, blurb: c.blurb, state, soon: c.soon, boss: c.boss, on: () => openCase(c) }));
    });
  }

  function card({ ep, title, blurb, state, soon, boss, chapter, on }) {
    const b = document.createElement("button");
    b.className = "case" + (soon ? " soon" : "") + (boss ? " boss" : "");
    b.disabled = !!soon;
    const chap = chapter ? `<span class="chap">${esc(chapter[0])}챕터${chapter[1] ? `<small>${esc(chapter[1])}</small>` : ""}</span>` : `<span class="ep">${esc(ep)}</span>`;
    b.innerHTML = `<div class="row">${chap}<span class="state ${state[0]}">${esc(state[1])}</span></div><h2>${esc(title)}</h2><p>${esc(blurb)}</p>`;
    if (!soon) b.addEventListener("click", on);
    return b;
  }

  function showMenuChrome(ep, title, back) {
    $("menu").hidden = false; $("stage").hidden = true;
    $("hearts").hidden = true; $("trustLabel").hidden = true; $("homeBtn").hidden = true;
    $("backBtn").hidden = !back;
    $("ep").textContent = ep; $("caseTitle").textContent = title;
  }

  /* ---------- 사건 ---------- */
  function openCase(c) {
    C = c; P = Core.characters(pack, c);
    S = Core.restore(c, fetchKey(progKey(pack, c)));
    screen = "case";
    document.body.classList.toggle("boss-mode", !!c.boss);
    $("menu").hidden = true; $("stage").hidden = false;
    $("hearts").hidden = false; $("trustLabel").hidden = false; $("homeBtn").hidden = false;
    $("ep").textContent = c.ep; $("caseTitle").textContent = c.title;
    render();
  }

  function hearts() {
    $("hearts").innerHTML = Array.from({ length: Core.maxTrust(C) }, (_, k) => `<i class="${k < S.trust ? "" : "lost"}"></i>`).join("");
  }
  function setSpeaker(key) {
    const [face, name] = P[key] || ["❔", key];
    $("portrait").innerHTML = `${esc(face)}<small>${esc(name)}</small>`;
    const w = $("who");
    w.textContent = name;
    w.className = "who" + (key === "me" ? " me" : key === "judge" ? " judge" : "");
  }
  function setText(t, testimony) {
    $("text").innerHTML = rich(t);
    $("box").classList.toggle("testimony", !!testimony);
  }
  function setTag(t) { $("tagline").innerHTML = t ? `<span class="tag">${esc(t)}</span>` : ""; }

  let primaryAction = null;
  function actions(list) {
    const a = $("actions"); a.innerHTML = ""; primaryAction = null;
    list.forEach(b => {
      if (b === "|") { const s = document.createElement("span"); s.className = "spacer"; a.appendChild(s); return; }
      const el = document.createElement("button");
      el.className = "btn " + (b.cls || ""); el.textContent = b.label; el.disabled = !!b.disabled;
      el.addEventListener("click", b.on); a.appendChild(el);
      if (b.cls === "primary" && !b.disabled) primaryAction = b.on;
    });
  }
  function shout(text, hold) {
    const s = $("shout"); $("shoutText").textContent = text; s.classList.toggle("hold", !!hold);
    s.hidden = false; const span = $("shoutText"); span.style.animation = "none"; void span.offsetWidth; span.style.animation = "";
    setTimeout(() => { s.hidden = true; }, 900);
  }
  function shake() { const p = $("portrait"); p.classList.remove("shake"); void p.offsetWidth; p.classList.add("shake"); }

  function playLines(lines, done) {
    let k = 0;
    const step = () => {
      if (k >= lines.length) { done(); return; }
      const [who, t] = lines[k++];
      setSpeaker(who); setText(t); setTag("");
      if (who.endsWith("Sweat")) shake();
      actions(["|", { label: "다음 ▶", cls: "primary", on: step }]);
    };
    step();
  }

  function next() { Core.next(C, S); save(); render(); }
  function recordBtn(glow) { return { label: glow ? "법정 기록 ●" : "법정 기록", on: () => openSheet("view") }; }

  function render() {
    hearts();
    $("choiceArea").innerHTML = "";
    if (S.trust <= 0) return gameOver();
    const st = Core.enter(C, S);
    const k = Core.kind(st);
    if (k === "gain") save();

    if (k === "say") {
      setSpeaker(st.say); setText(st.t); setTag("");
      actions([recordBtn(), "|", { label: "다음 ▶", cls: "primary", on: next }]);
    } else if (k === "gain") {
      setSpeaker("me"); setText(st.t); setTag("");
      actions([recordBtn(true), "|", { label: "다음 ▶", cls: "primary", on: next }]);
    } else if (k === "cross") {
      renderCross(st);
    } else if (k === "combine") {
      setSpeaker("me"); setText(st.t); setTag("");
      actions(["|", { label: "법정 기록 열고 조합하기", cls: "primary", on: () => openSheet("combine") }]);
    } else if (k === "choice") {
      setSpeaker(st.choice); setText(st.t); setTag("");
      actions([recordBtn()]);
      const area = $("choiceArea"); area.className = "choices";
      // 정답 위치로 찍지 못하게 그릴 때마다 순서를 섞는다. 판정은 원래 번호(idx)로 한다
      shuffled(st.options.map((o, idx) => ({ o, idx }))).forEach(({ o, idx }) => {
        const b = document.createElement("button"); b.className = "choice" + (o.code ? " code" : ""); b.textContent = o.t;
        b.addEventListener("click", () => {
          const r = Core.choose(C, S, idx);
          if (r.ok) { area.innerHTML = ""; shout("이의 있음!"); setTimeout(() => playLines(r.lines, next), 650); }
          else penalty(r.fb, r.gameOver);
        });
        area.appendChild(b);
      });
    } else if (k === "verdict") {
      renderVerdict();
    }
  }

  function renderCross(st) {
    const ln = st.lines[S.line];
    setSpeaker(st.who);
    setTag(`${st.title} · ${S.line + 1}/${st.lines.length}`);
    setText(ln.t, true);
    actions([
      { label: "◀", disabled: S.line === 0, on: () => { Core.moveLine(C, S, -1); save(); renderCross(st); } },
      { label: "추궁하기", on: () => playLines(ln.press, () => renderCross(st)) },
      { label: "증거 제시", cls: "present", on: () => openSheet("present") },
      { label: "▶", on: () => { Core.moveLine(C, S, +1); save(); renderCross(st); } },
    ]);
  }

  function penalty(msg, gameOverNow) {
    save(); hearts(); shake();
    setSpeaker("judge"); setTag("");
    setText((msg ? msg + "\n" : "") + (S.trust > 0 ? `<b>재판장 신뢰도 −1</b> (남은 신뢰도 ${S.trust})` : ""));
    $("choiceArea").innerHTML = "";
    if (gameOverNow || S.trust <= 0) { actions(["|", { label: "다음 ▶", cls: "primary", on: gameOver }]); return; }
    actions(["|", { label: "다시 생각하기", cls: "primary", on: render }]);
  }

  function present(evId) {
    closeSheet();
    const st = Core.step(C, S);
    const r = Core.present(C, S, evId);
    if (r.result === "win") { shout("이의 있음!"); setTimeout(() => playLines(r.lines, next), 650); }
    else if (r.result === "alt") { shout("잠깐!", true); setTimeout(() => playLines(r.lines, () => renderCross(st)), 650); }
    else penalty(`변호인, 그 증거(${r.evName})가 지금 증언과 어떻게 모순된다는 거죠?` + (r.hint ? `\n💡 ${r.hint}` : ""), r.gameOver);
  }

  /* ---------- 법정 기록 시트 ---------- */
  let sheetMode = "view", picked = [];
  function openSheet(mode) {
    sheetMode = mode; picked = [];
    $("sheetBg").hidden = false; $("sheet").hidden = false;
    $("sheetTitle").textContent = mode === "present" ? "제시할 증거 고르기" : mode === "combine" ? "증거 조합" : "법정 기록";
    $("sheetHint").textContent = mode === "present" ? "지금 보고 있는 증언과 모순되는 증거를 골라 ‘이걸 제시!’를 누르세요."
      : mode === "combine" ? "증거 두 개를 고른 뒤 ‘조합하기’를 누르세요. 카드를 누르면 내용을 볼 수 있어요."
      : "카드를 누르면 내용을 볼 수 있어요. 노란 테두리는 새로 받은 증거예요.";
    drawSheet(null);
    setTimeout(() => { const f = $("evList").querySelector("button"); if (f) f.focus(); }, 0);
  }
  function closeSheet() { $("sheetBg").hidden = true; $("sheet").hidden = true; if (S) { S.fresh = []; save(); } }
  function drawSheet(focusId) {
    const list = $("evList"); list.innerHTML = "";
    // 받은 순서 그대로면 정답 증거가 늘 비슷한 자리에 온다. 사건마다 정해진 순서로 섞는다 (열 때마다 바뀌지는 않게)
    const rank = id => { let h = 2166136261; for (const ch of C.id + ":" + id) h = Math.imul(h ^ ch.charCodeAt(0), 16777619); return h >>> 0; };
    S.have.slice().sort((a, b) => rank(a) - rank(b)).forEach(id => {
      const e = C.evidence[id];
      const b = document.createElement("button");
      b.className = "ev" + (picked.includes(id) ? " sel" : "") + (S.fresh.includes(id) ? " new" : "");
      b.innerHTML = `<span class="ic">${esc(e.ic)}</span><span class="k">${esc(e.k)}</span><strong>${esc(e.name)}</strong>`;
      b.addEventListener("click", () => {
        if (sheetMode === "combine") picked = picked.includes(id) ? picked.filter(x => x !== id) : picked.concat(id).slice(-2);
        else picked = [id];
        drawSheet(id);
      });
      list.appendChild(b);
    });
    const d = $("evDetail");
    if (focusId) {
      const e = C.evidence[focusId];
      d.hidden = false;
      d.innerHTML = `<h3>${esc(e.ic)} ${esc(e.name)}</h3><p>${esc(e.desc)}</p><pre><code></code></pre>`;
      d.querySelector("code").textContent = e.code;
    } else d.hidden = true;

    const acts = $("sheetActions"); acts.innerHTML = "";
    const mk = (label, cls, on, dis) => { const b = document.createElement("button"); b.className = "btn " + cls; b.textContent = label; b.disabled = !!dis; b.addEventListener("click", on); acts.appendChild(b); };
    mk("닫기", "", closeSheet);
    if (sheetMode === "present") mk("이걸 제시!", "present", () => present(picked[0]), picked.length !== 1);
    if (sheetMode === "combine") mk(`조합하기 (${picked.length}/2)`, "primary", doCombine, picked.length !== 2);
  }
  function doCombine() {
    const chosen = picked.slice();
    closeSheet();
    const r = Core.combine(C, S, chosen);
    save();
    if (r.ok) {
      shout("알았다!", true);
      setTimeout(() => {
        setSpeaker("me"); setText(r.got); setTag("");
        actions([recordBtn(true), "|", { label: "다음 ▶", cls: "primary", on: next }]);
      }, 650);
    } else penalty(r.msg, r.gameOver);
  }

  /* ---------- 결말 ---------- */
  function gameOver() {
    setSpeaker("judge"); setTag("");
    const ads = window.CourtAds && window.CourtAds.available();
    setText("변호인의 주장은 근거가 부족하군요. 오늘은 여기까지 하겠습니다.\n<b>신뢰도가 바닥났어요.</b> "
      + (ads ? "광고를 보면 신뢰도 1칸으로 지금 자리에서 이어 갈 수 있어요." : "이번 장면을 처음부터 다시 해 볼까요?"));
    const retry = { label: "다시 하기", cls: ads ? "" : "primary", on: () => { Core.retry(C, S); save(); render(); } };
    const revive = { label: "광고 보고 이어하기", cls: "primary", on: async () => {
      actions([]);
      const ok = await window.CourtAds.showRewarded();   // 끝까지 봤을 때만 보상
      if (ok) { Core.revive(C, S, 1); save(); render(); }
      else gameOver();
    } };
    actions(ads ? [retry, "|", revive] : ["|", retry]);
  }
  function renderVerdict() {
    const v = C.verdict;
    const solved = fetchKey(solvedKey(pack)) || {};
    solved[C.id] = true; store(solvedKey(pack), solved);
    setSpeaker("judge"); setTag("");
    setText(v.say);
    const area = $("choiceArea"); area.className = "";
    area.innerHTML = `<div class="verdict">
      <h3>사건 해결 · 핵심 정리</h3>
      <blockquote>“${rich(v.quote)}”</blockquote>
      <strong>이번 사건에서 모은 단서</strong>
      <ul>${v.clues.map(c => `<li>${rich(c)}</li>`).join("")}</ul>
      <span>남은 신뢰도: ${S.trust} / ${Core.maxTrust(C)}</span>
    </div>`;
    actions([recordBtn(), "|",
      { label: "이 사건 다시", on: () => { S = Core.fresh(C); save(); render(); } },
      { label: "사건 목록으로", cls: "primary", on: showPack }]);
  }

  /* ---------- 연결 ---------- */
  $("homeBtn").addEventListener("click", () => { closeSheet(); showPack(); });
  $("backBtn").addEventListener("click", showHome);
  $("sheetBg").addEventListener("click", closeSheet);
  document.addEventListener("keydown", e => {
    if (e.key === "Escape" && !$("sheet").hidden) { closeSheet(); return; }
    if (e.key === "Enter" && screen === "case" && $("sheet").hidden && primaryAction && document.activeElement?.tagName !== "BUTTON") primaryAction();
  });

  // 오프라인에서도 열리게 서비스 워커 등록 (지원하지 않는 브라우저에서는 그냥 넘어간다)
  if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => { navigator.serviceWorker.register("sw.js").catch(() => {}); });
  }

  async function start() {
    try {
      const res = await fetch("packs/index.json", { cache: "no-cache" });
      packs = (await res.json()).packs || [];
    } catch (e) { packs = []; }
    showHome();
  }
  start();
})();
