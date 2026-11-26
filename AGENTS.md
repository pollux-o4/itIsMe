# AGENTS

공통 규칙은 `~/.codex/init-rules`의 RULE ID로 참조한다. 아래는 관심사별 탐색 키다.

- 화면·이야기 설계: `docs/design/SPEC.md`
- 구조(C4): `docs/architecture/`
- 계약: `docs/specs/` · 결정: `docs/decisions/` · 운영 절차: `docs/operations/` — 고정 ID로 검색
- 브랜치·반영: FLOW-001. 커밋은 `dev`에만, `main`은 스쿼시 머지로만 바꾼다.

## 개인정보

- 개인정보가 든 원본은 `docs/personal-data/`(Git 제외)에만 둔다. `public/`·`src/`·공개 문서(README 등)에 원본·경로·내용을 옮기지 않는다. `check-public-privacy.mjs`가 공개 자산을 검사한다.
- `published: false`는 렌더링 제외일 뿐 Git 비공개가 아니다.
- README는 방문자용이다. 작업 보고·현재 브랜치·미검증 상태는 커밋 메시지나 `QUALITY.md`에 적는다.
