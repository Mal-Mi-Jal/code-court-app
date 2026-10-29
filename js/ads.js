/* 코드 법정 광고 연결부 — 화면(ui.js)은 이 파일의 CourtAds만 부른다
 *
 * 보상형 광고: 끝까지 봤을 때만 true를 돌려준다. 보상(신뢰도 회복 등)은 true일 때만 준다.
 * - 안드로이드 앱(4단계): Capacitor의 AdMob 플러그인이 있으면 그것을 쓴다 (테스트 광고 id로 먼저 확인)
 * - 웹: 지금은 광고가 없다 → available()이 false라 '광고 보고 이어하기' 버튼이 안 보인다
 * - #dev: 3초짜리 가짜 광고로 흐름만 확인한다
 */
(function () {
  "use strict";
  const DEV = location.hash === "#dev";

  function admob() {
    const cap = window.Capacitor;
    return cap && cap.isNativePlatform && cap.isNativePlatform() && cap.Plugins && cap.Plugins.AdMob;
  }

  // 개발용 가짜 광고: 3초를 다 보면 true, 중간에 닫으면 false
  function fakeRewarded() {
    return new Promise(resolve => {
      const bg = document.createElement("div");
      bg.className = "fake-ad";
      bg.innerHTML = `<div><strong>광고 (개발용 가짜)</strong><p>끝까지 보면 보상을 받아요.</p><p class="count">3</p><button class="btn">닫기</button></div>`;
      document.body.appendChild(bg);
      let left = 3, done = false;
      const finish = ok => { if (done) return; done = true; clearInterval(t); bg.remove(); resolve(ok); };
      const t = setInterval(() => {
        left--;
        bg.querySelector(".count").textContent = left > 0 ? left : "보상 지급!";
        if (left <= 0) setTimeout(() => finish(true), 500);
      }, 1000);
      bg.querySelector("button").addEventListener("click", () => finish(false));
    });
  }

  async function nativeRewarded(plugin) {
    // TODO(4단계): AdMob.prepareRewardVideoAd({ adId }) → showRewardVideoAd() 결과의 보상 콜백으로 판정
    try {
      await plugin.prepareRewardVideoAd({ adId: window.COURT_REWARDED_AD_ID });
      const r = await plugin.showRewardVideoAd();
      return !!(r && r.amount !== undefined);
    } catch (e) { return false; }
  }

  window.CourtAds = {
    available() { return !!admob() || DEV; },
    showRewarded() { const p = admob(); return p ? nativeRewarded(p) : DEV ? fakeRewarded() : Promise.resolve(false); }
  };
})();
