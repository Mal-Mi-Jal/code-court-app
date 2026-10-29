# 코드 법정 (가칭)

코드가 정말 그렇게 동작하는지, **증언 속 모순을 반례·실행 결과·명세로 반박**하며 배우는 재판형 학습 앱입니다.

- 기본 코스: 언어별(Java 먼저) 단계형 사건 세트. 실행 결과는 제작할 때 실제로 돌려서 검증합니다
- 커스텀 재판 (예정): 공부 자료를 올리면 AI가 그 자료를 근거로 재판을 만들어 줍니다
- 웹앱(PWA) 먼저, 같은 코드로 안드로이드 앱

## 구조

```
index.html, css/app.css   화면 뼈대와 스타일
js/core.js                엔진 순수 로직 (판정·신뢰도·조합·선택지). 브라우저와 Node가 같이 쓴다
js/ui.js                  화면. 판정은 core.js에 맡긴다
js/ads.js                 광고 연결부 (보상형: 끝까지 본 경우만 보상). 앱에선 AdMob, 웹엔 없음, #dev는 가짜 광고
js/validate.js            사건팩 검증 규칙 (브라우저 편집기와 CI가 같이 쓴다)
packs-src/*.js            사건 원고 (사람이 쓰는 곳). npm run build → packs/<id>.json
packs/index.json          코스 목록 (chapter = 배우는 순서, topic = 배지에 보일 주제)
packs-src/_helpers.js     원고 공용 도우미 (ev / runEv / spec). _로 시작하는 원고는 팩으로 빌드하지 않는다
packs/java-basics.json    Java 1챕터 기초 법정 (사건 4개 + 보스)
packs/java-collections.json  Java 2챕터 컬렉션 법정 (사건 4개 + 보스)
packs/java-objects.json      Java 3챕터 객체·예외 법정 (사건 4개 + 보스)
packs/java-streams.json      Java 4챕터 스트림 법정 (사건 4개 + 보스)
packs/java-numbers.json      Java 5챕터 숫자·날짜 법정 (사건 4개 + 보스)
packs/java-concurrency.json  Java 6챕터 동시성 법정 (사건 4개 + 보스. 증거는 매번 같은 출력이 나오게 짬)
packs/_test/              엔진 회귀 테스트용 팩 (#dev에서만 보임)
tools/build-packs.js      원고 → JSON (--check: 빌드 결과가 커밋된 파일과 같은지)
tools/validate.js         node tools/validate.js <팩>
tools/autoplay.js         node tools/autoplay.js <팩>  — 화면 없이 사건을 끝까지 풀어 본다
tools/verify-run.js       증거 속 Java 코드를 JDK로 실제 실행해 출력이 사건과 같은지 확인
docs/case-format.md       사건팩 형식 (code-court/v1)
```

## 실행

```bash
npm run build          # 원고(packs-src) → 팩 JSON
npm run check          # 문법 + 빌드 최신 여부 + 팩 검증 + 자동 플레이 + 실행 검증 (JDK 21 필요)
python -m http.server 5173   # 그다음 http://127.0.0.1:5173 (개발용 팩은 #dev)
```

`fetch`로 팩을 불러오기 때문에 `file://`로 열면 동작하지 않습니다. 로컬 서버로 여세요.

## 웹앱(PWA)

- `manifest.webmanifest` + `icons/`: 휴대폰에서 "홈 화면에 추가"하면 앱처럼 열린다 (아이콘은 도형으로 직접 그림)
- `sw.js`: 네트워크 우선. 온라인이면 항상 최신 파일을 받아 캐시에 넣고, 오프라인이면 캐시로 연다 (한 번 연 코스는 오프라인 플레이 가능)
- 파일을 바꾸면: `index.html`의 `?v=` 숫자와 `sw.js`의 `SHELL` 목록을 같이 올리고, 목록이 바뀌면 `VERSION`도 올린다
- 선택지는 화면에 그릴 때마다 순서를 섞는다. 증언 정답 줄이 한 자리에 몰리면 검증기가 경고한다
- 법정 기록의 증거는 사건마다 정해진 순서로 섞는다 (받은 순서대로면 정답 자리가 보인다)
- 정답 선택지가 오답보다 20% 넘게 길거나, 팩의 절반 넘게 정답이 가장 길면 검증기가 경고한다

## 챕터와 난이도

챕터는 배우는 순서(주제)이고, 난이도는 챕터 안에서 1화 → 보스로 올라간다. 뒤 챕터일수록 힌트를 줄인다.

| 챕터 | 조합 안내 | 추궁 대사 |
|---|---|---|
| 1 | 조합할 증거 두 개를 알려 준다 | "…해 본 기록이 있다"로 증거를 가리킨다 |
| 2 | 증거 하나만 알려 준다 | 의심만 하고 증거는 가리키지 않는다 |
| 3~ | 밝힐 목표만 말한다 | 짧은 의심 한마디 |

신뢰도가 바닥나면 "다시 하기"(이 장면 처음부터) 또는 앱에서 "광고 보고 이어하기"(그 자리에서 신뢰도 1칸).
