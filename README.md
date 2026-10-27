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
js/validate.js            사건팩 검증 규칙 (브라우저 편집기와 CI가 같이 쓴다)
packs/index.json          코스 목록
packs/_test/              엔진 회귀 테스트용 팩 (#dev에서만 보임)
tools/validate.js         node tools/validate.js <팩>
tools/autoplay.js         node tools/autoplay.js <팩>  — 화면 없이 사건을 끝까지 풀어 본다
docs/case-format.md       사건팩 형식 (code-court/v1)
```

## 실행

```bash
npm run check          # 문법 검사 + 팩 검증 + 자동 플레이
python -m http.server 5173   # 그다음 http://127.0.0.1:5173 (개발용 팩은 #dev)
```

`fetch`로 팩을 불러오기 때문에 `file://`로 열면 동작하지 않습니다. 로컬 서버로 여세요.
