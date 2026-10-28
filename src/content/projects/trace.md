---
title: Trace
slug: trace
summary: 데이터가 어느 단계에서 바뀌었는지 추적하는 개발 도구.
category: Systems / Tools
tags: [CLI, Observability, Node.js]
image: /images/trace.svg
imageAlt: source, transform, output 단계와 예시 로그를 보여주는 터미널 다이어그램
year: "2026"
role: Systems thinking · Developer experience
problem: 여러 변환 단계를 거친 데이터가 어디에서 달라졌는지 확인하기 어렵습니다.
approach: 입력과 변환, 출력을 하나의 흐름으로 연결하고 단계별 맥락을 읽을 수 있는 CLI를 구상했습니다.
outcome: 도구의 출력 형태를 검토하는 예시입니다. 실행 시간이나 처리량은 아직 측정하지 않았습니다.
published: false
sample: true
order: 3
gallery: []
---
## 더 많은 로그보다, 연결된 맥락

로그 한 줄의 양을 늘리는 대신, 어느 입력에서 어떤 변환이 일어났는지를 따라갈 수 있도록 구성합니다.

### 작동 모델

`source → transform → output`

각 단계는 구조화된 이벤트를 내보내고, 표현 계층은 이를 시간순 또는 입력 기준으로 보여줍니다. 민감한 원본 값은 기본 출력에서 제외하는 방향을 전제로 합니다.

### 검증 계획

정상 흐름, 변환 실패, 빈 입력에 대한 작은 fixture로 출력의 유용성을 검토해야 합니다. 여기 표시된 터미널은 실행 중인 CLI가 아닌 정적 도식입니다.
