/* 코드 법정 연출 — 효과음(브라우저가 직접 합성)과 등장인물 실루엣(SVG)
 *
 * 녹음 파일이나 그림 파일을 쓰지 않는다 (저작권 걱정 없음, 오프라인에서도 그대로).
 * - 소리: Web Audio로 짧은 파형을 그 자리에서 만든다. 첫 터치 뒤에만 소리가 난다 (브라우저 규칙).
 * - 그림: 등장인물 키(judge/me/wit…)로 역할을 정하고, 이름으로 모자·안경·넥타이 색을 고른다.
 */
(function () {
  "use strict";

  /* ---------- 소리 ---------- */
  const SOUND_KEY = "court:sound";
  let on = true;
  try { const v = localStorage.getItem(SOUND_KEY); if (v !== null) on = v === "1"; } catch (e) {}
  let ctx = null, master = null;

  // 소리 장치는 하나만 만든다. 효과음(master)과 음악(Music의 bus)은 따로 켜고 끈다
  function context() {
    if (!ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      ctx = new AC();
      master = ctx.createGain(); master.gain.value = 0.5; master.connect(ctx.destination);
    }
    if (ctx.state === "suspended" && !document.hidden) ctx.resume();
    return ctx;
  }
  function audio() { return on ? context() : null; }
  // 다른 탭으로 가면 소리를 멈추고, 돌아오면 다시 낸다
  document.addEventListener("visibilitychange", () => {
    if (!ctx) return;
    if (document.hidden) ctx.suspend(); else ctx.resume();
  });

  // 음 하나: 파형, 시작·끝 주파수, 길이, 크기, 몇 초 뒤
  function tone(type, f1, f2, dur, vol, at, attack) {
    const a = audio(); if (!a) return;
    const t = a.currentTime + (at || 0);
    const o = a.createOscillator(), g = a.createGain();
    o.type = type; o.frequency.setValueAtTime(f1, t);
    if (f2 && f2 !== f1) o.frequency.exponentialRampToValueAtTime(f2, t + dur);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol, t + (attack || 0.008));
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g); g.connect(master); o.start(t); o.stop(t + dur + 0.02);
  }

  // 잡음 한 번 (나무 두드리는 소리·바람 소리용)
  function noise(dur, vol, freq, at) {
    const a = audio(); if (!a) return;
    const t = a.currentTime + (at || 0);
    const len = Math.max(1, Math.floor(a.sampleRate * dur));
    const buf = a.createBuffer(1, len, a.sampleRate), d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len);
    const src = a.createBufferSource(); src.buffer = buf;
    const f = a.createBiquadFilter(); f.type = "bandpass"; f.frequency.value = freq; f.Q.value = 1.2;
    const g = a.createGain(); g.gain.value = vol;
    src.connect(f); f.connect(g); g.connect(master); src.start(t);
  }

  const Sound = {
    get on() { return on; },
    toggle() {
      on = !on;
      try { localStorage.setItem(SOUND_KEY, on ? "1" : "0"); } catch (e) {}
      if (on) Sound.click();
      return on;
    },
    unlock() { audio(); },
    // 대사 한 글자: 말하는 사람마다 음높이가 다르다
    blip(pitch) { tone("square", pitch, pitch * 0.94, 0.045, 0.035); },
    click() { tone("triangle", 660, 520, 0.05, 0.06); },
    // 의사봉: 나무 두드리는 소리 + 낮은 울림
    gavel(times) {
      for (let k = 0; k < (times || 1); k++) {
        noise(0.09, 0.9, 1400, k * 0.22);
        tone("sine", 140, 70, 0.18, 0.35, k * 0.22);
      }
    },
    // 시작: 부드럽게 퍼지는 종소리 화음 (천천히 커졌다가 길게 사라짐)
    start() {
      [[392, 0], [523.25, 0.14], [659.25, 0.28], [783.99, 0.42]].forEach(([f, at]) => {
        tone("sine", f, f, 1.6, 0.07, at, 0.06);
        tone("sine", f * 2, f * 2, 0.9, 0.012, at, 0.06);   // 살짝 반짝이는 배음
      });
    },
    // 이의 있음!: 쿵 + 위로 올라가는 화음
    objection() {
      noise(0.25, 0.7, 500);
      tone("sawtooth", 90, 45, 0.35, 0.25);
      [392, 494, 587].forEach((f, k) => tone("square", f, f, 0.32, 0.06, 0.05 + k * 0.035));
    },
    // 잠깐! / 알았다!: 짧고 가벼운 화음
    hold() { [523, 659, 784].forEach((f, k) => tone("triangle", f, f, 0.22, 0.08, k * 0.06)); },
    // 틀렸을 때: 아래로 떨어지는 소리
    wrong() { tone("sawtooth", 220, 70, 0.5, 0.12); noise(0.2, 0.4, 300, 0.05); },
    // 증거를 받음 / 사건 해결
    gain() { tone("triangle", 880, 1320, 0.12, 0.07); tone("triangle", 1320, 1320, 0.15, 0.05, 0.09); },
    solve() { [523, 659, 784, 1047].forEach((f, k) => tone("triangle", f, f, 0.45, 0.08, k * 0.11)); },
    whoosh() { noise(0.3, 0.5, 900); }
  };

  /* ---------- 배경 음악: 느와르 재즈를 그 자리에서 연주 ----------
   * 녹음 파일 없이 악기 소리를 합성한다. 박자마다 0.25초 앞까지 미리 예약해서 끊기지 않게 한다.
   * - court: 대화. 느린 스윙, 워킹 베이스(D단조 4마디 반복), 브러시 드럼, 피아노 화음, 가끔 비브라폰 한 소절
   * - cross: 증언·추궁. 조금 빠르고 곧은 8분음표, 같은 음을 되풀이하는 베이스, 째깍거리는 하이햇, 어긋난 피아노
   * - rest : 판결·게임 오버. 음악을 멈춘다
   */
  const MUSIC_KEY = "court:music";
  const midi = n => 440 * Math.pow(2, (n - 69) / 12);
  const Music = (() => {
    let enabled = true;
    try { const v = localStorage.getItem(MUSIC_KEY); if (v !== null) enabled = v === "1"; } catch (e) {}
    let unlocked = false, want = "court", mood = null;
    let bus = null, timer = null, nextTime = 0, beat = 0, noiseBuf = null;

    function setup() {
      const a = context(); if (!a) return null;
      if (!bus) {
        const lp = a.createBiquadFilter(); lp.type = "lowpass"; lp.frequency.value = 3200;
        bus = a.createGain(); bus.gain.value = 0;
        bus.connect(lp); lp.connect(a.destination);
        const len = a.sampleRate;
        noiseBuf = a.createBuffer(1, len, a.sampleRate);
        const d = noiseBuf.getChannelData(0);
        for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
      }
      return a;
    }

    // 악기들 (t = 소리 낼 시각)
    function env(g, t, vol, attack, dur) {
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(vol, t + attack);
      g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    }
    function bass(t, n, dur, vol) {
      const a = ctx, o = a.createOscillator(), o2 = a.createOscillator(), g = a.createGain(), f = a.createBiquadFilter();
      o.type = "triangle"; o2.type = "sine"; o.frequency.value = o2.frequency.value = midi(n);
      f.type = "lowpass"; f.frequency.value = 520;
      env(g, t, vol, 0.012, dur);
      o.connect(f); o2.connect(f); f.connect(g); g.connect(bus);
      o.start(t); o2.start(t); o.stop(t + dur + 0.05); o2.stop(t + dur + 0.05);
    }
    function keys(t, notes, dur, vol) {
      notes.forEach(n => {
        const a = ctx, o = a.createOscillator(), o2 = a.createOscillator(), g = a.createGain(), f = a.createBiquadFilter();
        o.type = "triangle"; o2.type = "sine";
        o.frequency.value = midi(n); o2.frequency.value = midi(n) * 2.003;
        f.type = "lowpass"; f.frequency.value = 1800;
        const g2 = a.createGain(); g2.gain.value = 0.25;
        env(g, t, vol, 0.006, dur);
        o.connect(f); o2.connect(g2); g2.connect(f); f.connect(g); g.connect(bus);
        o.start(t); o2.start(t); o.stop(t + dur + 0.05); o2.stop(t + dur + 0.05);
      });
    }
    function vibe(t, n, dur, vol) {
      const a = ctx, o = a.createOscillator(), g = a.createGain(), lfo = a.createOscillator(), lg = a.createGain(), trem = a.createGain();
      o.type = "sine"; o.frequency.value = midi(n);
      lfo.frequency.value = 5.2; lg.gain.value = 0.3; trem.gain.value = 0.7;   // 비브라폰처럼 일렁이게 (0.4~1.0)
      env(g, t, vol, 0.01, dur);
      lfo.connect(lg); lg.connect(trem.gain);
      o.connect(g); g.connect(trem); trem.connect(bus);
      o.start(t); lfo.start(t); o.stop(t + dur + 0.05); lfo.stop(t + dur + 0.05);
    }
    function brush(t, vol, len, freq) {
      const a = ctx, s = a.createBufferSource(), f = a.createBiquadFilter(), g = a.createGain();
      s.buffer = noiseBuf; f.type = "bandpass"; f.frequency.value = freq || 6000; f.Q.value = 0.8;
      env(g, t, vol, len > 0.1 ? 0.04 : 0.003, len);
      s.connect(f); f.connect(g); g.connect(bus);
      s.start(t, Math.random() * 0.5); s.stop(t + len + 0.05);
    }
    function kick(t, vol) {
      const a = ctx, o = a.createOscillator(), g = a.createGain();
      o.type = "sine"; o.frequency.setValueAtTime(95, t); o.frequency.exponentialRampToValueAtTime(42, t + 0.16);
      env(g, t, vol, 0.004, 0.22);
      o.connect(g); g.connect(bus); o.start(t); o.stop(t + 0.3);
    }

    // 대화: Dm9 → Gm9 → B♭maj7 → A7(♭9), 마디마다 워킹 베이스 4음 (마지막 음은 다음 마디로 반음 다가간다)
    const COURT = {
      bpm: 78,
      chords: [[65, 69, 72, 76], [58, 62, 65, 69], [62, 65, 69, 72], [55, 61, 64, 70]],
      walk: [[38, 41, 45, 44], [43, 46, 50, 47], [46, 50, 53, 46], [45, 49, 52, 39]],
      // 8마디마다 한 번, 5번째 마디(Gm)에 비브라폰 한 소절 [박, 음, 길이(박)]
      lick: [[0, 74, 0.9], [1, 72, 0.6], [1.67, 69, 1.2], [3, 67, 1.6]]
    };
    function playCourt(t, i) {
      const b = 60 / COURT.bpm, bar = Math.floor(i / 4) % 4, n = i % 4, swing = b * 2 / 3;
      bass(t, COURT.walk[bar][n], b * 0.92, 0.2);
      brush(t, n % 2 ? 0.05 : 0.035, 0.05);
      brush(t + swing, 0.022, 0.04);
      if (n === 1 || n === 3) brush(t, 0.018, b * 0.7, 3500);           // 쓸어 넘기는 브러시
      if (n === 0) kick(t, 0.22); else if (n === 2) kick(t, 0.1);
      if (n === 0) keys(t, COURT.chords[bar], b * 1.7, 0.028);
      if (n === 1) keys(t + swing, COURT.chords[bar], 0.28, 0.02);
      if (Math.floor(i / 4) % 8 === 4 && n === 0) {
        COURT.lick.forEach(([at, note, len]) => vibe(t + at * b, note, len * b, 0.05));
      }
    }

    // 추궁: 곧은 8분음표, D를 되풀이하는 베이스, 2마디마다 바뀌는 어긋난 화음
    const CROSS = {
      bpm: 104,
      ost: [38, 38, 50, 38, 41, 38, 44, 45],
      stabs: [[62, 65, 70], [61, 64, 70]]
    };
    function playCross(t, i) {
      const b = 60 / CROSS.bpm, h = b / 2, n = i % 4, bar = Math.floor(i / 4);
      [0, 1].forEach(k => {
        const step = (i * 2 + k) % 8;
        bass(t + k * h, CROSS.ost[step], h * 0.6, k ? 0.13 : 0.19);
        brush(t + k * h, k ? 0.018 : 0.03, 0.03, 8000);                  // 째깍 하이햇
      });
      if (n === 0 || n === 2) kick(t, n ? 0.12 : 0.2);
      if (n === 1 || n === 3) keys(t + h, CROSS.stabs[Math.floor(bar / 2) % 2], 0.18, 0.024);
      if (bar % 4 === 3 && n === 3) brush(t, 0.03, b * 0.9, 2500);        // 4마디 끝에 숨 들이쉬는 소리
    }

    function tick() {
      if (!ctx || !mood || mood === "rest") return;
      const b = 60 / (mood === "cross" ? CROSS.bpm : COURT.bpm);
      while (nextTime < ctx.currentTime + 0.25) {
        (mood === "cross" ? playCross : playCourt)(nextTime, beat);
        nextTime += b; beat++;
      }
    }

    function fadeTo(v, sec) {
      if (!bus) return;
      const t = ctx.currentTime;
      bus.gain.cancelScheduledValues(t);
      bus.gain.setValueAtTime(bus.gain.value, t);
      bus.gain.linearRampToValueAtTime(v, t + sec);
    }
    const LEVEL = 0.55;

    function apply() {
      if (!unlocked) return;
      const target = enabled ? want : "rest";
      if (target === mood) return;
      if (!setup()) return;
      const prev = mood;
      mood = target;
      if (target === "rest") { fadeTo(0, 0.8); return; }
      // 다른 분위기로 바꿀 때는 잠깐 줄였다가 새 곡을 처음부터
      const gap = prev && prev !== "rest" ? 0.35 : 0;
      if (gap) fadeTo(0, gap);
      beat = 0; nextTime = ctx.currentTime + gap + 0.05;
      setTimeout(() => fadeTo(LEVEL, 1.2), gap * 1000);
      if (!timer) timer = setInterval(tick, 50);
    }

    return {
      get on() { return enabled; },
      start() { unlocked = true; apply(); },
      mood(m) { want = m; apply(); },
      toggle() {
        enabled = !enabled;
        try { localStorage.setItem(MUSIC_KEY, enabled ? "1" : "0"); } catch (e) {}
        apply();
        return enabled;
      },
      // 이의 있음! 같은 순간에 음악을 잠깐 낮춘다
      duck(sec) {
        if (!bus || !enabled || mood === "rest") return;
        const t = ctx.currentTime;
        bus.gain.cancelScheduledValues(t);
        bus.gain.setValueAtTime(bus.gain.value, t);
        bus.gain.linearRampToValueAtTime(LEVEL * 0.2, t + 0.05);
        bus.gain.linearRampToValueAtTime(LEVEL, t + (sec || 1));
      }
    };
  })();

  /* ---------- 등장인물 실루엣 ---------- */
  function hash(s) { let h = 2166136261; for (const ch of String(s)) h = Math.imul(h ^ ch.charCodeAt(0), 16777619); return h >>> 0; }
  const TIES = ["#c63a2e", "#3f6fa8", "#5f8a4c", "#8a5fa8", "#c98a2e"];

  // key: 등장인물 키, name: 표시 이름, emoji: 데이터에 있던 얼굴(이름표에 작게 남긴다)
  function portrait(key, name, emoji) {
    const sweat = /Sweat$/.test(key);
    const base = key.replace(/Sweat$/, "");
    const role = base === "judge" ? "judge" : base === "me" ? "me" : "witness";
    const h = hash(name || base);
    const tie = role === "me" ? "#e2a94b" : TIES[h % TIES.length];
    const hat = role === "witness" && (h >> 3) % 3 === 0;
    const glasses = role === "judge" || /🤓/.test(emoji || "") || (role === "witness" && (h >> 5) % 3 === 0);
    const id = "g" + (h % 100000) + role;

    const parts = [];
    parts.push(`<defs>
      <linearGradient id="${id}" x1="0" x2="1"><stop offset="0" stop-color="#090807"/><stop offset=".62" stop-color="#16130f"/><stop offset="1" stop-color="#3a2f22"/></linearGradient>
    </defs>`);
    // 어깨 (판사는 법복, 나머지는 정장·코트)
    parts.push(`<path class="rim" d="M14 230 C20 176 58 152 100 152 C142 152 180 176 186 230 Z" fill="url(#${id})"/>`);
    if (role === "judge") {
      parts.push(`<path d="M86 152 L100 196 L114 152 Z" fill="#e9dfc8" opacity=".9"/>`);
      parts.push(`<rect x="94" y="160" width="5" height="26" fill="#0c0b0a"/><rect x="101" y="160" width="5" height="26" fill="#0c0b0a"/>`);
    } else {
      // 셔츠 V + 넥타이
      parts.push(`<path d="M84 152 L100 190 L116 152 Z" fill="#d9cfbb" opacity=".85"/>`);
      parts.push(`<path d="M96 158 L104 158 L106 186 L100 196 L94 186 Z" fill="${tie}"/>`);
      // 코트 깃
      parts.push(`<path d="M84 152 L72 166 L96 200 Z M116 152 L128 166 L104 200 Z" fill="#1d1914" class="rim-soft"/>`);
    }
    // 목·얼굴
    parts.push(`<rect x="89" y="118" width="22" height="38" rx="6" fill="#0f0d0b"/>`);
    parts.push(`<ellipse class="rim" cx="100" cy="94" rx="33" ry="39" fill="url(#${id})"/>`);
    // 머리카락 / 모자
    if (role === "judge") {
      parts.push(`<path d="M68 92 C66 70 76 62 84 66 M132 92 C134 70 124 62 116 66" stroke="#cfc6b3" stroke-width="6" fill="none" stroke-linecap="round" opacity=".8"/>`);
    } else if (hat) {
      parts.push(`<ellipse cx="100" cy="64" rx="58" ry="9" fill="#0b0a09" class="rim-soft"/>`);
      parts.push(`<path d="M72 64 C72 34 128 34 128 64 Z" fill="#0b0a09" class="rim-soft"/>`);
      parts.push(`<rect x="72" y="56" width="56" height="6" fill="${tie}" opacity=".7"/>`);
    } else {
      parts.push(`<path d="M67 90 C64 54 92 46 104 50 C124 52 138 66 133 92 C126 74 108 66 96 70 C84 72 74 78 67 90 Z" fill="#0b0a09"/>`);
    }
    // 눈 (실루엣 속에서 빛나는 두 점)
    if (sweat) {
      parts.push(`<path d="M82 98 q5 -5 10 0 M108 98 q5 -5 10 0" stroke="#f1e9d6" stroke-width="2.4" fill="none" stroke-linecap="round"/>`);
      parts.push(`<path d="M90 118 q5 -4 10 0 q5 4 10 0" stroke="#f1e9d6" stroke-width="2" fill="none" opacity=".7"/>`);
      parts.push(`<path class="drop" d="M138 70 q6 10 0 14 q-6 -4 0 -14 Z" fill="#9fd3ff"/>`);
      parts.push(`<path class="drop d2" d="M146 92 q5 8 0 11 q-5 -3 0 -11 Z" fill="#9fd3ff"/>`);
    } else {
      parts.push(`<ellipse class="eye" cx="87" cy="97" rx="4.2" ry="2.2" fill="#f1e9d6"/><ellipse class="eye" cx="113" cy="97" rx="4.2" ry="2.2" fill="#f1e9d6"/>`);
    }
    if (glasses) parts.push(`<g stroke="#e2a94b" stroke-width="2" fill="none" opacity=".75"><circle cx="87" cy="97" r="9"/><circle cx="113" cy="97" r="9"/><path d="M96 97 h8"/></g>`);
    if (role === "judge") parts.push(`<g transform="translate(150 178) rotate(-28)"><rect x="-4" y="0" width="8" height="40" rx="3" fill="#5a3d22"/><rect x="-14" y="-12" width="28" height="14" rx="4" fill="#6b4828" class="rim-soft"/></g>`);

    return `<svg class="figure ${role}${sweat ? " sweat" : ""}" viewBox="0 0 200 230" role="img" aria-label="${(name || "").replace(/"/g, "")}">${parts.join("")}</svg>`;
  }

  // 말하는 사람별 대사 음높이
  function voice(key) {
    const base = key.replace(/Sweat$/, "");
    if (base === "judge") return 150;
    if (base === "me") return 330;
    return 210 + (hash(base) % 6) * 22;
  }

  window.CourtFx = { Sound, Music, portrait, voice };
})();
