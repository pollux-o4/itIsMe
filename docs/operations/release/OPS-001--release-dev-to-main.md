# OPS-001 · dev를 main에 반영

계약: FLOW-001.

## 선행 조건

```bash
git switch dev && git status --short   # 출력 없음
pnpm verify && pnpm exec playwright test
git merge-base --is-ancestor main dev  # 실패하면 먼저: git merge --no-ff main
```

## 실행

```bash
git switch main && git pull --ff-only
git merge --squash dev
git commit                              # 제목: 반영 요약 · 본문: 관심사 목록
git switch dev && git merge --no-ff main -m "chore: sync main into dev"
git push origin main dev
```

## 성공 확인

```bash
git diff --quiet main dev && git merge-base --is-ancestor main dev && echo ok
gh run list --branch main --limit 1     # 배포 성공
```

## 실패 대응

FLOW-001의 실패 복구를 따른다.
