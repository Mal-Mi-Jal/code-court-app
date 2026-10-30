/* 코드 법정 서비스 워커 — 네트워크 우선, 끊기면 캐시
 *
 * 인터넷이 되면 항상 서버에서 최신 파일을 받고(사건을 고치면 바로 반영), 받은 파일을 캐시에 넣어 둔다.
 * 인터넷이 끊기면 캐시에 있는 파일로 연다. 한 번 열어 본 코스는 오프라인에서도 플레이할 수 있다.
 * 파일 목록이 바뀌면 VERSION을 올린다 (옛 캐시는 activate에서 지운다).
 */
const VERSION = "court-v10";
const SHELL = [
  "./",
  "index.html",
  "manifest.webmanifest",
  "css/app.css?v=4",
  "js/core.js?v=4",
  "js/ads.js?v=4",
  "js/ui.js?v=4",
  "packs/index.json",
  "packs/java-basics.json",
  "packs/java-collections.json",
  "packs/java-objects.json",
  "packs/java-streams.json",
  "packs/java-numbers.json",
  "packs/java-concurrency.json",
  "icons/icon-192.png",
  "icons/icon-512.png",
  "icons/favicon-32.png"
];
// 글꼴은 다른 도메인이지만 오프라인에서도 같은 모양이 나오게 캐시해 둔다
const FONT_HOSTS = ["fonts.googleapis.com", "fonts.gstatic.com"];

self.addEventListener("install", event => {
  event.waitUntil(caches.open(VERSION).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== VERSION).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", event => {
  const req = event.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  const sameOrigin = url.origin === self.location.origin;
  if (!sameOrigin && !FONT_HOSTS.includes(url.hostname)) return;

  event.respondWith((async () => {
    const cache = await caches.open(VERSION);
    try {
      // no-cache: 브라우저 HTTP 캐시에 옛 파일이 있어도 서버에 다시 확인한다
      const res = await fetch(req, sameOrigin ? { cache: "no-cache" } : undefined);
      if (res && (res.ok || res.type === "opaque")) cache.put(req, res.clone());
      return res;
    } catch (e) {
      // 오프라인: 같은 주소 → 쿼리(?v=) 무시한 주소 → 페이지 이동이면 첫 화면 순서로 찾는다
      const hit = (await cache.match(req))
        || (await cache.match(req, { ignoreSearch: true }))
        || (req.mode === "navigate" ? await cache.match("./") : undefined);
      if (hit) return hit;
      throw e;
    }
  })());
});
