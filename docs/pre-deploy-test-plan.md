# 배포 전 테스트 계획

이 문서는 배포 전 회귀를 막기 위해 우선 테스트해야 할 기능과 추천 테스트 구성을 정리한다. 현재 목표는 `lint`, 단위 테스트, 빌드, 핵심 E2E를 한 번에 돌려 “한 기능을 고치다 다른 사용자 흐름이 깨지는” 상황을 줄이는 것이다.

## 현재 테스트 현황

현재 스크립트:

```bash
npm run lint
npm run test
npm run build
npm run test:e2e
npm run predeploy:check
```

이번에 추가된 테스트:

- `src/domain/document-links.test.ts`: NEC 문서 URL allowlist, 미리보기 URL의 `returnTo`, 프록시 URL 생성 검증
- `src/app/api/document-download/route.test.ts`: 잘못된 URL 거부, inline/attachment header, cache header, upstream 실패 처리 검증
- `tests/e2e/document-preview-return.spec.ts`: 공보 확인 후 브라우저 뒤로가기와 앱 상단 뒤로가기 모두 URL/선택/스크롤 복원 검증
- `tests/e2e/comparison-scroll-hint.spec.ts`: 모바일 후보 비교표의 `밀기` 힌트 표시와 오른쪽 끝 스크롤 후 숨김 검증

이미 커버되는 영역:

- 선거/후보 도메인 로직: 지역별 선거 조회, 후보 정렬, 비교 행 구성, 공보/공약 링크 포함 여부
- 선거구 매핑: 읍면동 선택에 따른 시도의원/시군구의원 선거 필터링
- 위치 매핑: 좌표 기반 지원 지역 판별
- 역지오코딩: Naver/Kakao 응답 파싱, provider fallback, API route 일부
- 정당 색상: 주요 정당/무소속 색상

남은 공백:

- 배포에서 문제가 된 `static`/`dynamic` 렌더링 결과를 확인하는 테스트가 없음
- 지역/읍면동 선택 UI와 URL/history 동기화 E2E가 없음
- 위치 기반 지역 찾기 UI 흐름 E2E가 없음
- PDF 뷰어의 로딩/실패/lazy render 상태 테스트가 없음
- 시각 회귀나 접근성 smoke 테스트가 없음

## 우선순위

### P0: 배포 전 반드시 막아야 하는 회귀

1. **문서 확인 후 뒤로가기 복원**
   - 후보 상세에서 `공보` 또는 `5대공약` 클릭
   - `/document-preview`로 이동
   - 브라우저 뒤로가기 시 기존 URL, 선택 지역, 선택 선거, 스크롤 위치 복원
   - 앱 상단 뒤로가기 버튼 클릭 시에도 동일하게 복원
   - `document.referrer`가 비어도 `returnTo` 기반으로 복원

2. **홈 초기 선택 복원**
   - `?region=&area=&election=` URL로 직접 진입하면 서버 렌더 단계부터 해당 지역/선거가 반영됨
   - URL 파라미터가 없으면 cookie/localStorage 기반 선택이 정상 복원됨
   - 잘못된 region/area/election 값은 안전하게 기본값으로 fallback

3. **후보 비교표 모바일 가로 스크롤 힌트**
   - 가로 overflow가 있으면 오른쪽 `밀기` 힌트와 좁은 그라데이션이 보임
   - 오른쪽 끝까지 스크롤하면 힌트가 사라짐
   - 선거를 바꾸면 비교표 가로 스크롤이 0으로 초기화됨
   - 힌트가 주요 텍스트를 과도하게 가리지 않음

4. **문서 URL 보안과 다운로드 프록시**
   - `cdn.nec.go.kr/policy_pdf/*.pdf`만 허용
   - 외부 도메인, http, pdf가 아닌 파일은 거부
   - 다운로드/미리보기 header가 기대대로 설정됨
   - NEC fetch 실패 시 적절한 status를 반환

5. **배포 빌드 형태**
   - `npm run build` 결과에서 홈 `/`가 oversized ISR fallback을 만들지 않음
   - Vercel 배포 전 `lint`, `test`, `build`, 핵심 E2E가 모두 통과해야 함

### P1: 자주 깨질 수 있는 핵심 기능

1. **지역 선택과 읍면동 필터**
   - 시/도 선택, 구 선택, 읍면동 선택 후 선거 목록이 기대대로 바뀜
   - 선택 변경 시 URL과 storage/cookie가 함께 갱신됨
   - 뒤로가기/앞으로가기 시 선택 상태가 URL에 맞게 동기화됨

2. **위치 기반 지역 찾기**
   - geolocation 성공 시 reverse-geocode API 호출
   - 지원 지역이면 해당 지역과 읍면동 선택 반영
   - 권한 거부, 미지원 지역, API 미설정 상태에서 적절한 안내 표시

3. **문서 미리보기 뷰어**
   - PDF 로딩 중/성공/실패 상태 표시
   - 페이지 lazy render가 스크롤에 따라 동작
   - 화면을 떠날 때 PDF load/render task cancel
   - 원본 열기와 PDF 다운로드 링크가 올바름

4. **후보 상세 카드**
   - 후보 사진 유무, 정당 badge, 상세 정보, 문서 링크 상태가 정상 표시
   - pending/missing 문서는 비활성 상태로 표시

### P2: 품질과 운영 안정성

1. **반응형/시각 회귀**
   - 390px, 430px, desktop 폭에서 텍스트 겹침 없음
   - 후보 비교표, 후보 상세 카드, 문서 미리보기 header가 정상 배치

2. **접근성 smoke**
   - 주요 버튼/링크 accessible name 보유
   - 키보드 focus가 문서 링크와 비교표 스크롤 영역에 접근 가능

3. **데이터 무결성**
   - 생성 데이터셋의 후보가 모두 유효한 electionId를 가짐
   - 문서 URL은 허용 가능한 URL 형식만 포함
   - 선거별 후보 정렬이 deterministic

## 추천 테스트 구성

### 1. Vitest 단위/route 테스트

기존 `vitest`를 유지하고, 테스트 가능한 순수 함수를 늘린다.

추가 후보:

- `src/domain/document-links.test.ts`
  - `parseAllowedDocumentUrl`
  - `getDocumentPreviewPath(url, title, returnTo)`
  - `returnTo`가 query string으로 안전하게 encoding되는지

- `src/app/api/document-download/route.test.ts`
  - 허용 URL만 proxy
  - 잘못된 URL은 `400`
  - `download=1`이면 attachment header
  - cache header 유지

- `src/domain/dashboard-selection.test.ts`
  - 현재 `ElectionDashboard` 안에 있는 URL/cookie/storage parsing, selection normalization을 별도 모듈로 빼면 테스트 가능
  - 잘못된 지역/선거 fallback
  - 읍면동 필수 지역 처리

- `src/domain/document-return.test.ts`
  - 현재 `ElectionDashboard` 안에 있는 return scroll snapshot parsing을 별도 모듈로 빼면 테스트 가능
  - path 불일치, 만료, malformed JSON 처리

### 2. Component 테스트

현 상태에는 `jsdom`, Testing Library가 없다. 화면 단위 검증을 하려면 다음 dev dependency가 필요하다.

```bash
npm install -D jsdom @testing-library/react @testing-library/jest-dom @testing-library/user-event
```

추천 대상:

- `DocumentPreviewBackLink`
  - same-origin referrer면 `history.back()` 호출
  - referrer가 없고 `returnTo`가 있으면 `location.replace(returnTo)` 호출
  - 클릭 전 `document-preview:leave` event dispatch

- `ElectionDashboard`
  - URL initialSelection이 있으면 해당 지역/선거 표시
  - 문서 링크 href에 `returnTo` 포함
  - 문서 링크 pointer/click 시 sessionStorage에 현재 scroll snapshot 저장

### 3. Playwright E2E

이번 문제는 실제 browser history와 scroll restoration이 핵심이라 E2E가 가장 효과적이다. 추천 dependency:

```bash
npm install -D @playwright/test
```

추천 스크립트:

```json
{
  "test:e2e": "playwright test",
  "predeploy:check": "npm run lint && npm run test && npm run build && npm run test:e2e"
}
```

추천 E2E:

- `tests/e2e/document-preview-return.spec.ts`
  - 특정 지역/선거 URL로 진입
  - 후보 상세의 3번째 공보 링크가 보일 때까지 스크롤
  - 클릭 전 `window.scrollY` 저장
  - 공보 클릭
  - 브라우저 뒤로가기
  - URL과 `window.scrollY`가 저장값 근처로 복원되는지 확인
  - 다시 공보 클릭 후 앱 상단 뒤로가기 버튼으로도 같은 검증

- `tests/e2e/comparison-scroll-hint.spec.ts`
  - 후보 비교표가 overflow인 선거로 진입
  - `밀기` 힌트가 보이는지 확인
  - 비교표를 오른쪽 끝으로 스크롤
  - 힌트가 사라지는지 확인

- `tests/e2e/selection-persistence.spec.ts`
  - 지역/읍면동/선거 선택
  - URL query 갱신 확인
  - reload 후 선택 유지 확인
  - 다른 선거 선택 후 browser back/forward 동작 확인

- `tests/e2e/mobile-layout-smoke.spec.ts`
  - 모바일 viewport에서 홈, 후보 비교, 후보 상세, 문서 미리보기 header 확인
  - 주요 텍스트가 viewport 밖으로 과도하게 밀리지 않는지 smoke check

## 배포 전 권장 명령

현재 바로 실행 가능한 최소 게이트:

```bash
npm run lint
npm run test
npm run build
```

E2E 도입 후 권장 게이트:

```bash
npm run predeploy:check
```

로컬에서 production 모드까지 확인할 때:

```bash
npm run build
./node_modules/.bin/next start -H 127.0.0.1
npm run test:e2e
```

## 구현 순서 제안

1. P0에 필요한 순수 함수를 먼저 분리한다.
   - dashboard selection parsing/normalization
   - document return path/scroll snapshot parsing
   - document link 생성

2. Vitest로 빠른 단위 테스트를 추가한다.
   - 외부 브라우저 없이 빠르게 깨지는 로직을 잡는다.

3. Playwright E2E를 추가한다.
   - 이번처럼 browser history, scroll, sessionStorage, 실제 layout이 얽힌 흐름을 잡는다.

4. `predeploy:check` 스크립트를 추가한다.
   - 배포 전 명령 하나로 `lint + unit + build + e2e`를 돌린다.

5. CI 또는 수동 배포 절차에 `predeploy:check`를 붙인다.
   - 커밋/푸시/배포는 사용자가 명시적으로 지시할 때만 진행한다.

## 이번 버그의 완료 기준

이번 문서 확인/뒤로가기 회귀는 아래 조건을 만족하면 닫을 수 있다.

- 브라우저 뒤로가기 후 기존 URL이 유지된다.
- 브라우저 뒤로가기 후 기존 지역/읍면동/선거가 유지된다.
- 브라우저 뒤로가기 후 `window.scrollY`가 클릭 전 값과 거의 같다.
- 앱 상단 뒤로가기 버튼도 같은 기준을 만족한다.
- `document.referrer`가 비어도 `returnTo` 기반으로 돌아간다.
- `npm run lint`, `npm run test`, `npm run build`, 관련 E2E가 모두 통과한다.
