# 사건팩 형식 (code-court/v1)

사건팩은 JSON 파일 하나다. 엔진(`js/core.js`)과 화면(`js/ui.js`)은 이 형식만 알면 어떤 주제든 재판으로 만든다.
검사는 `node tools/validate.js <팩 파일>`로 한다 (`js/validate.js`가 규칙을 가진다).

## 팩

```json
{
  "format": "code-court/v1",
  "id": "java-basics",
  "title": "Java 기초 법정",
  "language": "java",
  "commonCharacters": { "judge": ["⚖️", "재판장"], "me": ["🧑‍💻", "나 (변호인)"] },
  "cases": [ /* 사건들 */ ]
}
```

- `commonCharacters`: 모든 사건에 나오는 인물. `judge`(재판장)와 `me`(변호인)는 엔진이 직접 쓰므로 반드시 있어야 한다
- `test: true`인 팩은 개발용이다. 화면에서는 주소 끝에 `#dev`를 붙였을 때만 보인다

## 사건

| 키 | 뜻 |
|---|---|
| `id` | 팩 안에서 겹치지 않는 id |
| `ep`, `title`, `blurb` | 목록에 보이는 회차·제목·한 줄 소개 |
| `boss`, `hard`, `trust` | 보스 표시(빨간 화면), 첫 실수에 힌트 숨김, 최대 신뢰도(기본 5) |
| `characters` | 이 사건에만 나오는 인물 `{ 키: [이모지, 이름] }`. 키가 `Sweat`로 끝나면 말할 때 화면이 흔들린다 |
| `evidence` | 증거 `{ id: { ic, k, name, desc, code } }`. `code`는 그대로(글자 그대로) 보여 준다 |
| `script` | 단계 배열 (아래) |
| `verdict` | 판결 `{ say, quote, clues: [] }` |

### 증거에 붙일 수 있는 것 (선택)
- `source: { doc, quote }`: 근거 인용. 팩의 `sources[doc]`에 `quote`가 **글자 그대로** 있어야 한다 (AI 초안 증거는 필수가 될 예정)
- `run: { lang, snippet, expected }`: 실제로 실행해서 검증할 코드와 기대 출력 (`tools/verify-run.js`가 쓴다. lang은 java 또는 python)

## 단계 (`script`)

단계 종류는 어떤 키가 있느냐로 정해진다.

| 종류 | 모양 | 하는 일 |
|---|---|---|
| say | `{ "say": "인물키", "t": "대사" }` | 대사 한 줄 |
| gain | `{ "gain": ["증거id", …], "t": "안내" }` | 증거를 법정 기록에 넣는다 |
| cross | `{ "cross": "id", "title", "who", "lines": [{ "t", "press": [[인물, 대사], …] }], "answer": { "line", "ev" }, "alt"?: { "line", "ev", "say": [[인물, 대사]] }, "hint", "win": [[인물, 대사]] }` | 증언. 정답 줄에 정답 증거를 내면 이긴다 (`line`은 0부터) |
| combine | `{ "combine": ["증거a", "증거b"], "result": "새 증거id", "t", "wrong", "got" }` | 두 증거를 합쳐 새 증거를 얻는다 |
| choice | `{ "choice": "인물키", "t", "options": [{ "t", "ok"?: true, "fb"? }], "win": [[인물, 대사]] }` | 선택지. 정답(`ok`)은 하나 |
| verdict | `{ "verdict": true }` | 판결 화면 (사건의 마지막 단계) |

### 대사에 쓸 수 있는 꾸밈
`<b>강조</b>`와 `<code>코드</code>`만 쓸 수 있다. 다른 태그는 화면에서 글자 그대로 보인다 (사용자나 AI가 만든 사건에서 스크립트가 실행되지 않게 하기 위해서다).

## 검증기가 확인하는 것
- 팩 형식, 사건 id 중복, 필수 키
- 대사의 인물 키가 등장인물에 있는지
- 증거 id가 `evidence`에 있는지 (gain, answer, alt, combine, result)
- 증거를 쓰기 **전에** 얻는지 (gain이나 combine 결과로)
- 증언: 줄이 있는지, `answer.line`·`alt.line`이 범위 안인지, alt가 정답과 같지 않은지, 줄마다 추궁 대사가 있는지
- 선택지: 정답이 정확히 하나인지, 오답마다 피드백(`fb`)이 있는지
- 마지막 단계가 판결인지, 판결에 `say`·`quote`·`clues`가 있는지
- 허용하지 않은 태그 (경고)
- 근거 인용이 원문에 글자 그대로 있는지
