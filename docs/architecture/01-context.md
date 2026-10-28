# C1 · Context

범위: 주연석 포트폴리오 웹사이트. 독자는 짧은 소개에서 역할·작업·근거를 확인하고 전체 인쇄본을 저장한다.

```mermaid
flowchart LR
  reader["채용 담당자·방문자<br/>사람 / 콘텐츠를 읽는 AI"]
  editor["포트폴리오 소유자"]
  portfolio["포트폴리오 웹사이트<br/>소개·프로젝트·이력·인쇄"]
  github["GitHub<br/>소스 저장소·공개 프로필"]
  cms["Pages CMS<br/>선택적 콘텐츠 편집"]
  evidence["Google Drive·YouTube<br/>발표자료·시연"]
  mail["방문자의 이메일 앱"]
  reader -->|읽기·바로가기·인쇄| portfolio
  editor -->|소스·콘텐츠 수정| github
  editor -->|선택적 편집| cms
  cms -->|인증된 저장소에 커밋| github
  github -->|빌드·정적 배포| portfolio
  portfolio -->|사용자가 선택한 외부 링크| evidence
  portfolio -->|코드·프로필 링크| github
  portfolio -->|mailto 링크| mail
```

외부 발표자료는 링크로 연다. 사이트 자체에 로그인·API 서버·데이터베이스·메일 발송 서버는 없다. 원본 개인정보 자료는 Git·공개 빌드에서 제외한다. CMS 인증·저장은 소유자의 계정 연결이 필요하다.

다음: [C2 컨테이너](02-containers.md).
