# 주연석 — Portfolio

**AI 모델과 웹 서비스를 개발하는 주연석의 포트폴리오.**

**사이트:** https://pollux-o4.github.io/itIsMe/

채용하는 사람이 묻는 세 질문(끝까지 만들 수 있는가·스스로 판단하는가·함께 일할 수 있는가)을 목차로 삼고, 질문마다 대표 사례 하나로 답하는 연속형 웹 포트폴리오입니다. 사례는 주장 → 시각화 → 문제·판단·실행·검증·남은 과제 → 내 몫/팀 몫 → 펼쳐 보는 근거 순서로 읽고, 그 밖의 작업·연표·이력이 뒤따릅니다.

- 넓은 화면은 왼쪽 고정 목차, 좁은 화면은 상단 가로 목차입니다.
- 근거는 같은 페이지에서 펼치며, 브라우저 인쇄는 접힌 내용까지 A4로 출력합니다.
- 키보드 이동과 OS 모션 감소 설정을 지원합니다.

## 실행

Node 24 / pnpm 12.15.0.

```bash
pnpm install --frozen-lockfile
```

```bash
pnpm dev
```

로컬 주소: http://localhost:4321/itIsMe/

## 콘텐츠 수정

| 내용 | 파일 |
|---|---|
| 소개·연락처, 대표 작업·추가 작업·경력·학력·자격 | `src/data/portfolio.json` |
| 검색 메타데이터·한 줄 소개·GitHub | `src/data/site.json` |
| 근거 이미지(WebP) | `public/images/portfolio/` |

- 본문의 핵심 구절은 `**강조할 구절**`로 표시합니다. 이름·제목·메타데이터에는 쓰지 않습니다.
- 대표 작업의 시각화 교체 지점은 `src/components/story/ProjectCase.astro`입니다.
- `.pages.yml`로 Pages CMS에서 편집할 수 있습니다. 저장은 선택한 브랜치에 커밋을 만듭니다.
- 빌드가 데이터 스키마, 근거 이미지, 내부 앵커와 링크를 검사합니다.

팀 결과와 개인 역할을 구분해 적습니다. 실험 수치는 원본 보고값이며 재실험한 값이 아닙니다.

## 검증과 배포

| 명령 | 내용 |
|---|---|
| `pnpm verify` | 글씨 크기·강조 표식·타입·빌드·내부 참조·공개 자산 검사 |
| `pnpm check:e2e` | Playwright E2E (최초 `pnpm exec playwright install --with-deps chromium firefox webkit`) |
| `pnpm check:lighthouse` | `pnpm preview --port 4322` 실행 후 모바일·데스크톱 각 3회 중앙값 |
| `pnpm hooks:install` | 커밋 시 스테이징된 스타일의 글씨 크기 검사 |

`main` 푸시가 GitHub Pages 배포를 시작합니다. 브랜치 흐름은 FLOW-001, 검수 기록은 `QUALITY.md`, 화면 설계는 `docs/design/SPEC.md`, 구조는 `docs/architecture/`에 있습니다.

폰트 라이선스는 `public/fonts/`에 있습니다.
