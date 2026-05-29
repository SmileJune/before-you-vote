# 개발 트러블슈팅 기록 - 2026-05-29

## 목적

최근 작업 중 실제로 겪은 문제, 원인, 해결 방법, 재발 방지책을 정리한다. 같은 문제가 다시 생겼을 때 빠르게 판단하고, 배포 전 확인해야 할 테스트 기준으로 삼기 위한 문서다.

## 운영 원칙

- 커밋, 푸시, 배포는 명시적인 지시가 있을 때만 진행한다.
- 배포 전에는 `npm run predeploy:check`를 먼저 실행한다.
- `next-env.d.ts`, `test-results/`, `playwright-report/` 같은 생성물은 의도 없이 커밋하지 않는다.
- UI 수정은 모바일 폭에서 실제 상호작용까지 확인한다.

## 문제 1. 후보 비교표의 가로 스크롤을 사용자가 알아차리기 어려움

증상:

- 모바일 후보 비교표에서 오른쪽에 더 많은 열이 있어도 사용자가 가로 스크롤 가능 여부를 알기 어렵다.
- iOS Safari/Chrome 계열은 스크롤바가 항상 보이지 않아 표가 끝난 것처럼 보일 수 있다.

원인:

- 표는 `overflow-x-auto`로 구현되어 있었지만, 오른쪽에 추가 내용이 있다는 시각적 affordance가 약했다.
- 첫 후보 열은 sticky였지만, 오른쪽 끝이 일반 border처럼 보여 “더 있음” 신호가 부족했다.

해결:

- 비교표가 실제로 overflow 상태일 때만 오른쪽 그라데이션과 `밀기` 힌트를 표시했다.
- 오른쪽 끝까지 스크롤하면 힌트가 사라지도록 했다.
- 선거 변경 시 비교표 가로 스크롤을 `0`으로 초기화했다.

주의:

- 힌트 영역이 넓으면 본문 텍스트를 가린다.
- 처음 적용한 `더 보기` + 넓은 그라데이션은 실제 화면에서 과했다.
- 최종적으로 문구를 `밀기`로 줄이고 그라데이션 폭도 줄였다.

관련 파일:

- `src/components/election-dashboard.tsx`
- `tests/e2e/comparison-scroll-hint.spec.ts`

재발 방지:

- 비교표 overflow 여부와 힌트 표시/숨김을 E2E로 검증한다.
- 모바일 viewport에서 텍스트가 힌트에 과도하게 가리지 않는지 수동 확인한다.

## 문제 2. 공보 확인 후 뒤로가기 시 스크롤 위치가 복원되지 않음

증상:

- 후보 상세에서 `공보`를 열고 뒤로가면 원래 후보 카드 위치가 아니라 홈 상단 근처로 돌아간다.
- 일부 경우 URL query도 빠져 기본 지역으로 돌아가는 것처럼 보인다.

원인:

- 문서 미리보기 뒤로가기 버튼이 `document.referrer`에 의존했다.
- SPA 내부 이동에서는 `document.referrer`가 비어 있을 수 있어, 이 경우 `history.back()` 대신 `/`로 이동했다.
- 홈 페이지의 초기 선택 복원이 서버 렌더 단계가 아니라 클라이언트 effect 후에 적용되면, 브라우저가 scroll restoration을 시도하는 시점의 DOM이 원래 상태와 달라질 수 있다.

해결:

- 홈 페이지에서 `force-dynamic`은 유지하되, `searchParams`와 cookie를 서버에서 읽어 `initialSelection`을 다시 넘긴다.
- 문서 미리보기 링크에 현재 위치를 `returnTo`로 포함한다.
- 문서 링크 클릭 시 현재 `pathname + search + hash`와 `scrollY`를 `sessionStorage`에 저장한다.
- 홈으로 돌아오면 저장된 path가 현재 path와 일치할 때 scroll 위치를 복원한다.
- 앱 상단 뒤로가기 버튼은 referrer가 없을 때 `returnTo`로 `location.replace`한다.

관련 파일:

- `src/app/page.tsx`
- `src/app/document-preview/page.tsx`
- `src/components/document-preview-back-link.tsx`
- `src/components/election-dashboard.tsx`
- `src/domain/document-links.ts`
- `tests/e2e/document-preview-return.spec.ts`

재발 방지:

- 브라우저 뒤로가기와 앱 상단 뒤로가기 버튼을 각각 E2E로 검증한다.
- 검증 기준은 URL, 선택 지역/선거, `window.scrollY`가 모두 유지되는 것이다.

## 문제 3. Vercel 배포 실패: oversized ISR fallback

증상:

- `main` push 후 Vercel production 배포가 실패했다.
- Vercel 로그에 다음 유형의 오류가 표시됐다.

```text
Oversized Incremental Static Regeneration (ISR) page: index.rsc.fallback
Pre-rendered responses that are larger than 19.07 MB result in a failure
FALLBACK_BODY_TOO_LARGE
```

원인:

- 홈 페이지를 `force-static`으로 만들면서 전체 선거 데이터셋이 정적 RSC fallback에 포함됐다.
- 현재 데이터셋 크기가 커서 Vercel의 prerendered response 크기 한도를 초과했다.

해결:

- 홈 페이지를 `force-dynamic`으로 유지한다.
- 단, 사용자 선택 복원은 서버에서 `searchParams`/cookie를 읽어 `initialSelection`으로 넘긴다.
- 이렇게 하면 oversized static fallback을 피하면서도 뒤로가기 scroll restoration에 필요한 초기 DOM 상태를 맞출 수 있다.

관련 파일:

- `src/app/page.tsx`

재발 방지:

- `npm run build` 결과에서 홈 `/`가 `ƒ /`로 표시되는지 확인한다.
- 배포 전 `npm run predeploy:check`를 실행한다.
- 홈을 다시 static으로 바꾸는 경우 RSC payload 크기와 Vercel 한도를 먼저 확인한다.

## 문제 4. `next-env.d.ts`가 dev 실행 후 변경됨

증상:

- `next dev` 실행 후 `next-env.d.ts`가 다음처럼 바뀌었다.

```diff
- import "./.next/types/routes.d.ts";
+ import "./.next/dev/types/routes.d.ts";
```

원인:

- Next.js dev/build 모드에 따라 generated route type 경로가 달라질 수 있다.
- 로컬 dev 서버 실행 과정에서 생성 파일이 변경 상태로 잡혔다.

해결:

- 배포 전 `npm run build`를 다시 실행해 production build 기준 상태로 되돌렸다.
- 커밋 대상에서 generated noise를 제외했다.

재발 방지:

- 커밋 전 `git status -sb`와 `git diff -- next-env.d.ts`를 확인한다.
- 의도하지 않은 `next-env.d.ts` 변경은 커밋하지 않는다.

## 문제 5. Vitest가 Playwright E2E 파일까지 수집함

증상:

- `npm run test` 실행 시 `tests/e2e/*.spec.ts` 파일을 Vitest가 수집해 실패했다.
- 오류 메시지는 Playwright의 `test()`가 잘못된 runner에서 호출됐다는 형태였다.

원인:

- Vitest 기본 include 범위가 넓어 `tests/e2e` 아래 Playwright spec까지 발견했다.

해결:

- `vitest.config.ts`에서 include 범위를 `src/**/*.test.ts`, `src/**/*.test.tsx`로 제한했다.
- Playwright는 `playwright.config.ts`에서 `tests/e2e`만 실행하도록 분리했다.

관련 파일:

- `vitest.config.ts`
- `playwright.config.ts`

재발 방지:

- unit/integration 테스트는 `src/**/*.test.ts`에 둔다.
- E2E 테스트는 `tests/e2e/**/*.spec.ts`에 둔다.

## 문제 6. Playwright 실행 환경 문제

증상:

- `@playwright/test` 설치 후 브라우저 바이너리가 없어 E2E가 실패했다.
- Chromium 설치 시 sandbox가 `/Users/.../Library/Caches/ms-playwright` 쓰기를 막았다.
- Codex sandbox 안에서 Playwright webServer가 포트 listen을 하거나 Chromium을 실행할 때 macOS 권한 오류가 발생했다.

원인:

- Playwright 브라우저는 사용자 캐시 디렉터리에 설치된다.
- 브라우저 실행은 macOS process/Mach service 권한이 필요하다.
- Codex sandbox 안에서는 이 동작이 제한될 수 있다.

해결:

- `./node_modules/.bin/playwright install chromium`을 승인 실행해 Chromium을 설치했다.
- Codex 검증 시에는 이미 떠 있는 서버를 사용하도록 `PLAYWRIGHT_SKIP_WEB_SERVER=1`과 `PLAYWRIGHT_BASE_URL`을 지원하게 했다.
- 최종적으로 sandbox 밖 승인 실행으로 `npm run predeploy:check`가 통과함을 확인했다.

관련 파일:

- `playwright.config.ts`
- `package.json`

재발 방지:

- 일반 로컬 환경에서는 다음 명령을 사용한다.

```bash
npm run predeploy:check
```

- Codex sandbox에서 이미 서버를 띄운 상태로 E2E만 확인할 때는 다음 형태를 사용할 수 있다.

```bash
PLAYWRIGHT_SKIP_WEB_SERVER=1 PLAYWRIGHT_BASE_URL=http://127.0.0.1:3000 npm run test:e2e
```

## 배포 전 체크리스트

최소 확인:

```bash
npm run lint
npm run test
npm run build
```

권장 확인:

```bash
npm run predeploy:check
```

확인해야 할 결과:

- `npm run test`: Vitest 전체 통과
- `npm run build`: 홈 라우트가 `ƒ /`로 표시됨
- `npm run test:e2e`: 문서 뒤로가기 2개, 비교표 힌트 1개 E2E 통과

## 관련 문서

- `docs/pre-deploy-test-plan.md`
- `docs/known-issues.md`
