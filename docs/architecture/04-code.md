# C4 · Code

클래스 다이어그램 대신 실제 구현으로 연결한다.

| 책임 | 코드 |
|---|---|
| 콘텐츠 정본·편집 | [portfolio.json](../../src/data/portfolio.json), [site.json](../../src/data/site.json), [CMS 필드](../../.pages.yml) |
| 콘텐츠 계약·파생 타입 | [portfolio-schema.ts](../../src/lib/portfolio-schema.ts) |
| 데이터 로드·경로·컬렉션 | [portfolio.ts](../../src/lib/portfolio.ts), [content.ts](../../src/lib/content.ts), [content.config.ts](../../src/content.config.ts) |
| 홈 조합·외곽 | [index.astro](../../src/pages/index.astro), [StoryLayout](../../src/layouts/StoryLayout.astro) |
| 소개·사진 | [Introduction](../../src/components/story/Introduction.astro), [PortraitIdentity](../../src/components/story/PortraitIdentity.astro) |
| 사례·추가 작업·이력 | [ProjectCase](../../src/components/story/ProjectCase.astro), [Archive](../../src/components/story/Archive.astro), [Background](../../src/components/story/Background.astro) |
| 미리보기·시각화 | [ProjectPreview](../../src/components/ProjectPreview.astro), [ValidationFlow](../../src/components/ValidationFlow.astro), [EngineTimeline](../../src/components/EngineTimeline.astro), [ServiceFlow](../../src/components/ServiceFlow.astro) |
| 강조 표식 | [Emphasis](../../src/components/Emphasis.astro), [emphasis.ts](../../src/lib/emphasis.ts) |
| 브라우저 수명 | [story.ts](../../src/scripts/story.ts) |
| 기능별 동작 | [navigation](../../src/scripts/story/navigation.ts), [portrait](../../src/scripts/story/portrait.ts), [preview](../../src/scripts/story/preview.ts), [printing](../../src/scripts/story/printing.ts), [선택 계약](../../src/scripts/story/preview-selection.ts) |
| 스타일 진입·순서 | [global.css](../../src/styles/global.css), [story.css](../../src/styles/story.css) |
| 화면·인쇄 스타일 | [화면 기본](../../src/styles/story/foundation.css), [사례](../../src/styles/story/cases.css), [반응형](../../src/styles/story/responsive.css), [인쇄](../../src/styles/story/print.css), [인쇄 배치](../../src/styles/story/print-layout.css) |
| 보조 페이지 | [Layout](../../src/layouts/Layout.astro), [notes](../../src/pages/notes/index.astro), [작업 상세](../../src/pages/work/[slug].astro), [404](../../src/pages/404.astro) |
| 회귀 검사 | [스키마 계약](../../scripts/check-portfolio.mjs), [동작](../../scripts/check-preview-interaction.mjs), [콘텐츠](../../scripts/check-story.mjs), [공개 개인정보](../../scripts/check-public-privacy.mjs), [지도 링크](../../scripts/check-architecture.mjs) |

`pnpm verify`로 타입·빌드·로컬 참조·콘텐츠·동작·글자 크기·공개 개인정보·문서 링크를 확인한다. 브라우저에서 화면, 키보드 탐색, 펼침, 사진 닫기와 인쇄 상태 복원을 함께 확인한다.
