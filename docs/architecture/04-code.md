# C4 · Code

클래스 다이어그램 대신 실제 구현으로 연결한다.

| 책임 | 코드 |
|---|---|
| 콘텐츠 정본·편집 | [portfolio.json](../../src/data/portfolio.json), [site.json](../../src/data/site.json), [CMS 필드](../../.pages.yml) |
| 콘텐츠 계약·파생 타입 | [portfolio-schema.ts](../../src/lib/portfolio-schema.ts) |
| 데이터 로드·경로·컬렉션 | [portfolio.ts](../../src/lib/portfolio.ts), [content.ts](../../src/lib/content.ts), [content.config.ts](../../src/content.config.ts) |
| 홈 조합·외곽 | [index.astro](../../src/pages/index.astro), [StoryLayout](../../src/layouts/StoryLayout.astro) |
| 소개·질문 목록 | [Introduction](../../src/components/story/Introduction.astro) |
| 화면 명세(위치와 이유) | [SPEC](../design/SPEC.md) |
| 사례·추가 작업·연표·이력 | [ProjectCase](../../src/components/story/ProjectCase.astro), [Archive](../../src/components/story/Archive.astro), [Timeline](../../src/components/story/Timeline.astro), [Background](../../src/components/story/Background.astro) |
| 사례 증거 | [Exhibit](../../src/components/Exhibit.astro) (표시가 있는 그림), [ValidationFlow](../../src/components/ValidationFlow.astro) (분할 방식 데모) |
| 이미지·글꼴 전달 | `PortfolioImage.astro`(반응형 크기·지연 로딩·인쇄 원본), `fonts.ts`(첫 화면 글자 범위의 빌드 시 우선 로딩) |
| 강조 표식 | [Emphasis](../../src/components/Emphasis.astro), [emphasis.ts](../../src/lib/emphasis.ts) |
| 브라우저 수명 | [story.ts](../../src/scripts/story.ts) |
| 기능별 동작 | [navigation](../../src/scripts/story/navigation.ts), [reveal](../../src/scripts/story/reveal.ts), [split-demo](../../src/scripts/story/split-demo.ts), [preview-slot](../../src/scripts/story/preview-slot.ts), [contact](../../src/scripts/story/contact.ts), [printing](../../src/scripts/story/printing.ts) |
| 스타일 진입·순서 | [global.css](../../src/styles/global.css), [story.css](../../src/styles/story.css) |
| 화면·인쇄 스타일 | [토큰](../../src/styles/story/tokens.css), [기본](../../src/styles/story/base.css), [머리글](../../src/styles/story/masthead.css), [첫 화면](../../src/styles/story/hero.css), [사례](../../src/styles/story/case.css), [시각화](../../src/styles/story/visuals.css), [목록·연표·이력](../../src/styles/story/sections.css), [연락처](../../src/styles/story/contact.css), [인쇄](../../src/styles/story/print.css) |
| 보조 페이지 | [Layout](../../src/layouts/Layout.astro), [notes](../../src/pages/notes/index.astro), [작업 상세](../../src/pages/work/[slug].astro), [404](../../src/pages/404.astro) |
| 회귀 검사 | [스키마 계약](../../scripts/check-portfolio.mjs), [동작](../../scripts/check-interactions.mjs), [콘텐츠](../../scripts/check-story.mjs), [공개 개인정보](../../scripts/check-public-privacy.mjs), [지도 링크](../../scripts/check-architecture.mjs) |

`pnpm verify`로 타입·빌드·로컬 참조·콘텐츠·동작·글자 크기·공개 개인정보·문서 링크를 확인한다. 브라우저에서 화면, 키보드 탐색, 펼침, 분할 전환·예측 슬라이더와 인쇄 상태 복원을 함께 확인한다.
