# C3 · Component

## Astro 정적 생성 내부

```mermaid
flowchart TB
  json["콘텐츠 정본<br/>portfolio.json / site.json"] --> data["스키마·데이터 로더<br/>portfolio-schema / portfolio / content"]
  markdown["선택적 Markdown 컬렉션"] --> collection["content.config / publicProjects"]
  data --> shell["StoryLayout<br/>메타데이터·목차·외곽 구조"]
  data --> sections["홈 섹션<br/>Introduction / ProjectCase / Archive / Background"]
  sections --> portrait["PortraitIdentity"]
  sections --> preview["ProjectPreview"]
  sections --> visuals["종류별 시각화<br/>ValidationFlow / EngineTimeline / ServiceFlow"]
  sections --> emphasis["Emphasis / emphasisParts<br/>안전한 핵심 구절 렌더링"]
  shell --> html["동일한 정적 HTML<br/>화면·인쇄"]
  sections --> html
  collection --> auxiliary["보조 페이지 / Layout"]
  auxiliary --> html
  styles["스타일 진입점<br/>global.css / story.css<br/>순서가 고정된 CSS 모듈"] --> html
```

`index.astro`는 섹션 순서만 조합한다. 사례의 공통 구조·근거는 `ProjectCase`, 종류별 그림은 시각화 레지스트리가 담당한다. 프로젝트 제목·목차·짧은 역할·미리보기 설정·추가 링크는 콘텐츠 정본에서 읽는다. 서로 다른 길이의 편집용 라벨은 별도 필드로 명시한다.

## 브라우저 UI 내부

```mermaid
flowchart TB
  lifecycle["story.ts<br/>Astro 페이지 수명·AbortController"] --> nav["navigation<br/>현재 장·앵커 포커스·해시 펼침"]
  lifecycle --> portrait["portrait<br/>사진 대화상자·hover 해제"]
  lifecycle --> preview["preview<br/>포인터·키보드·모션 감소·기본 선택"]
  lifecycle --> print["printing<br/>이미지 준비·전체 펼침·인쇄·복원"]
  print -->|PreviewSelection 인터페이스| preview
  nav --> dom["서버에서 렌더링한 DOM"]
  portrait --> dom
  preview --> dom
  print --> dom
```

`printing`은 미리보기 내부 DOM을 검색하지 않고 `selected / select / reset`만 사용한다. 각 초기화는 동일한 `AbortSignal`을 받아 페이지 교체 시 이벤트·예약 프레임·열린 대화상자를 정리한다. 인쇄는 기존 펼침·선택 상태를 저장했다가 복원한다. 미리보기 기본 ID는 `data-preview-default`에서 읽는다.

CSS 파일을 나누면서 기존 규칙 순서를 유지했다. 인쇄와 모바일 규칙이 앞선 기본 규칙을 보완하는 순서도 공개 인터페이스의 일부다. 순서 변경은 화면·인쇄 회귀 확인이 필요하다.

다음: [C4 코드 경로](04-code.md).
