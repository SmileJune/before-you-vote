# 개발 로그 - 2026-05-26

## 요약

BeforeYouVote 첫 번째 MVP 슬라이스를 구현했다. 현재 범위는 모바일 최적화된 Next.js 웹 화면이며, 실제 선관위 API/DB 연동 전 단계의 샘플 데이터 기반 프로토타입이다.

핵심 목표:

- 투표 전 빠르게 볼 수 있는 후보 확인 UI 구성
- 지역별 선거 목록 표시
- 선거 종류 선택 시 후보 목록 변경
- 후보별 핵심 정보, 공식자료, 공약/PDF 상태 표시
- 빠른 비교 테이블 제공
- 위치 기반 지역 찾기 진입 UI 제공
- TDD 기반 도메인 로직 검증

## 기술 구성

- Next.js 16.2.6
- React 19
- TypeScript
- Tailwind CSS
- Vitest
- ESLint 9 flat config
- Node.js 22.22.0 권장

Node 버전은 `.nvmrc`에 고정했다.

```text
22.22.0
```

## 주요 구현 파일

| 파일 | 내용 |
| --- | --- |
| `src/domain/types.ts` | 지역, 선거, 후보, 문서, 출처 타입 정의 |
| `src/domain/election.ts` | 지역 조회, 선거 목록 조회, 후보 정렬, 요약 정보, 비교 테이블 생성 |
| `src/domain/election.test.ts` | 도메인 로직 테스트 |
| `src/domain/sample-data.ts` | 샘플 지역/선거/후보 데이터 |
| `src/components/election-dashboard.tsx` | 모바일 후보 확인 메인 UI |
| `src/components/location-assist.tsx` | 위치 확인 버튼 및 상태 메시지 |
| `src/app/page.tsx` | 메인 페이지 엔트리 |
| `src/app/layout.tsx` | 메타데이터 및 viewport 설정 |
| `src/app/globals.css` | Tailwind 및 전역 스타일 |
| `src/app/icon.svg` | 파비콘 |
| `next.config.mjs` | Next 이미지 도메인 및 Turbopack root 설정 |
| `eslint.config.mjs` | ESLint 9 flat config |
| `vitest.config.ts` | Vitest 설정 |

## 구현한 사용자 흐름

### 1. 내 지역 후보 확인 화면

현재 화면은 모바일 폭 기준으로 구성했다.

표시 항목:

- 서비스명: 투표전5분
- 서비스 원칙: 공식 자료 기반, 추천/점수화 없음
- 위치 기반 지역 찾기 버튼
- 현재 선택 지역
- 확인할 선거 목록
- 선택한 선거의 후보 목록
- 후보별 핵심 요약
- 공보/5대공약/공개자료 링크 상태
- 빠른 비교 테이블

현재 선택 지역은 실제 위치 기반 결과가 아니라 데모 데이터다.

```text
서울특별시 마포구 서교동
```

오해를 줄이기 위해 UI에 `현재 선택 지역 · 데모 데이터` 문구를 추가했다.

### 2. 선거 종류 선택

초기에는 `서울특별시장` 후보만 고정 표시되는 문제가 있었다.

확인 결과:

```text
서울특별시교육감 클릭 -> 서울특별시장 후보 유지
마포구청장 클릭 -> 서울특별시장 후보 유지
```

수정:

- 선거 목록 링크를 버튼으로 변경
- `ElectionDashboard`를 client component로 분리
- `selectedElectionId` 상태를 추가
- 선택한 선거에 따라 후보 목록과 빠른 비교가 함께 바뀌도록 구현

수정 후 동작:

| 선택 선거 | 표시 후보 |
| --- | --- |
| 서울특별시장 | 정원오, 오세훈, 김정철, 유지혜, 이강산, 권영국 |
| 서울특별시교육감 | 강신만, 조희연 |
| 마포구청장 | 유동균, 박강수 |

현재 교육감/구청장 후보 데이터는 실제 수집 데이터가 아니라 UI 동작 검증용 샘플이다.

### 3. 빠른 비교

선택한 선거의 후보 중 앞 2명을 기준으로 비교 테이블을 구성한다.

비교 항목:

- 정당
- 직업
- 학력
- 재산
- 병역
- 납세
- 체납
- 전과
- 공보
- 5대공약

화면에는 모바일 가독성을 위해 앞 8개 항목을 표시한다.

### 4. 위치 기반 지역 찾기

현재 구현은 브라우저 Geolocation API 호출까지만 포함한다.

동작:

- 위치 권한 허용 및 좌표 확인 성공 시 성공 메시지 표시
- 위치 권한 거부/미지원/timeout 시 실패 메시지 표시

현재 한계:

- 좌표를 주소로 변환하지 않는다.
- 주소를 선거구로 매핑하지 않는다.
- 실제 위치가 동탄이어도 화면 지역은 데모 값인 마포구 서교동으로 유지된다.

이를 명확히 하기 위해 성공 메시지를 수정했다.

```text
위치 좌표만 확인했습니다. 아직 주소와 선거구 자동 매핑은 연결되지 않았습니다.
```

추후 필요한 구현:

```text
브라우저 좌표
-> 역지오코딩
-> 행정동/법정동 추정
-> 선거구 매핑
-> 해당 선거별 후보 조회
```

## 테스트

도메인 로직은 Vitest로 검증한다.

현재 테스트 수:

```text
5 tests
```

검증 항목:

- 지역 slug로 지역 조회
- 지역에 해당하는 선거 목록 조회
- 후보 기호순 정렬
- 교육감/구청장 선거 후보 분리 조회
- 후보 요약 정보의 중립성
- 비교 테이블과 출처/수집시각 보존

실행 결과:

```text
npm test
```

결과:

```text
Test Files  1 passed
Tests       5 passed
```

## 빌드 및 품질 검증

커밋 전 확인한 명령:

```bash
npm test
npm run lint
npm run build
npm audit --omit=dev
```

결과:

| 명령 | 결과 |
| --- | --- |
| `npm test` | 통과 |
| `npm run lint` | 통과 |
| `npm run build` | 통과 |
| `npm audit --omit=dev` | production dependency 기준 0 vulnerabilities |

## 브라우저 확인

확인 URL:

```text
http://localhost:3000
```

모바일 viewport 기준으로 Playwright에서 확인했다.

확인 내용:

- 메인 화면 렌더링
- 위치 버튼 권한 허용/거부 상태 메시지
- 서울특별시장 선택 시 후보 목록 표시
- 서울특별시교육감 선택 시 후보 목록 변경
- 마포구청장 선택 시 후보 목록 변경
- 빠른 비교 테이블 후보 변경
- 콘솔에 치명적 오류 없음

## 의존성 및 보안 처리

초기 Next.js 14 구성에서 `npm audit --omit=dev` 결과 Next 관련 취약점이 남았다. 미니PC에 직접 배포할 예정이므로 production dependency audit 기준을 맞추기 위해 Next.js 16.2.6, React 19로 올렸다.

추가 조치:

- Node.js 엔진 기준 추가
- `.nvmrc` 추가
- `postcss` override를 8.5.10으로 고정
- `npm audit --omit=dev` 결과 0 vulnerabilities 확인

## 현재 한계

아직 실제 서비스로 쓰기에는 다음 기능이 없다.

- 선관위 OpenAPI 연동
- `info.nec.go.kr` 후보 상세/스캔자료 수집
- `policy.nec.go.kr` 후보공약/선거공보 PDF 수집
- PostgreSQL 저장
- 지역/선거구 매핑
- 실제 동탄 지역 후보 데이터
- 주소 검색
- 현재 위치 좌표의 역지오코딩
- 배포용 systemd/nginx 설정

## 2026-05-26 추가 작업: 샘플 데이터 제거 및 실데이터 생성

샘플 후보 데이터를 제거하고, 선관위 공식 출처 기반 생성 데이터셋으로 전환했다.

추가 파일:

| 파일 | 내용 |
| --- | --- |
| `scripts/collect-real-data.mjs` | 선관위 OpenAPI와 후보자 상세 페이지를 호출해 정적 데이터셋 생성 |
| `src/domain/generated-election-data.ts` | 공식 출처 기반 생성 데이터셋 |
| `src/domain/geolocation.ts` | 좌표 범위 기반 지원 지역 매핑 |
| `src/domain/geolocation.test.ts` | 동탄/서교동 좌표 매핑 테스트 |

수집 명령:

```bash
npm run collect:data
```

현재 수집 범위:

- 서울특별시 마포구 서교동 기준
  - 서울특별시장
  - 서울특별시교육감
  - 마포구청장
- 경기도 화성시 동탄동 기준
  - 경기도지사
  - 경기도교육감
  - 화성시장

수집 결과:

```text
Collected 26 candidates into src/domain/generated-election-data.ts
```

수집 데이터:

- 후보자 기본정보: 후보자 OpenAPI
- 재산, 병역, 납세, 체납, 전과, 사진: 선거통계시스템 후보자 상세 페이지
- 출처 URL과 수집 시각: 후보자별 저장

위치 기반 지역 찾기는 외부 지도 API 없이 bounding box 방식으로 먼저 구현했다.

```text
동탄 좌표 -> 경기도 화성시 동탄동
서교동 좌표 -> 서울특별시 마포구 서교동
지원 범위 밖 좌표 -> 수동 선택 안내
```

브라우저 확인:

- 기본 진입: 서울특별시장 후보 6명 표시
- 동탄 좌표 mock: 경기도 화성시 동탄동으로 변경
- 동탄 매핑 후 경기도지사 후보 5명 표시

## 2026-05-26 추가 작업: 전국 후보자 기본정보 수집

전국 후보자 기본정보 수집 스크립트를 추가했다.

추가 파일:

| 파일 | 내용 |
| --- | --- |
| `scripts/collect-nationwide-candidates.mjs` | 전국 후보자 기본정보 수집 |
| `data/nec/nationwide-candidates-20260603.json` | 전국 후보자 기본정보 원천 데이터 |
| `data/nec/nationwide-summary-20260603.json` | 시도/선거종류별 수집 요약 |

수집 명령:

```bash
npm run collect:nationwide
```

수집 범위:

- 17개 시도
- 국회의원선거
- 시·도지사선거
- 구·시·군의 장선거
- 시·도의회의원선거
- 구·시·군의회의원선거
- 광역의원비례대표선거
- 기초의원비례대표선거
- 교육감선거

수집 결과:

```text
Collected 7829 nationwide candidates.
Wrote data/nec/nationwide-candidates-20260603.json
Wrote data/nec/nationwide-summary-20260603.json
```

구현 중 확인한 사항:

- 일부 시도/선거종류 조합은 후보가 없어 `INFO-03`을 반환한다. 이는 빈 결과로 처리했다.
- OpenAPI가 `numOfRows=1000` 요청을 받아도 실제로는 100개 단위로 제한하는 케이스가 있어, 응답의 실제 `numOfRows`를 기준으로 페이지네이션하도록 수정했다.
- 전국 파일은 후보자 OpenAPI 기본정보 기준이다. 재산, 병역, 납세, 체납, 전과 상세 공개자료는 후보자 상세 페이지 호출량이 크므로 별도 수집 단계로 분리해야 한다.

## 2026-05-26 추가 작업: 전국 앱 데이터셋과 지역 직접 선택

전국 후보자 기본정보 원천 파일을 앱에서 바로 사용할 수 있는 지역/선거/후보 데이터셋으로 변환했다. 기존 화면은 직접 선택 지역이 서울 마포구와 경기 동탄 2개뿐이었으나, 현재는 후보자 OpenAPI의 `sdName`, `wiwName`, `sggName` 기준으로 생성한 312개 지역을 선택할 수 있다.

추가 및 변경 파일:

| 파일 | 내용 |
| --- | --- |
| `scripts/build-app-dataset-from-nationwide.mjs` | 전국 후보자 원천 데이터를 앱 데이터셋으로 변환 |
| `data/nec/app-election-dataset-20260603.json` | 앱에서 사용하는 지역/선거/후보 정규화 JSON |
| `src/domain/generated-election-data.ts` | JSON 데이터셋을 읽는 얇은 로더 |
| `src/components/election-dashboard.tsx` | 지역 직접 선택을 312개 지역 select로 변경 |

생성 명령:

```bash
npm run build:app-data
```

생성 결과:

```text
Generated 312 regions, 3209 elections, 17904 candidate entries.
```

브라우저 확인:

- 지역 직접 선택 옵션 수: 312개
- 기본 서울특별시 마포구 선택 시 표시 선거: 17개
- 경기도 화성시동탄구 선택 시 표시 선거: 11개

경기도 화성시동탄구 표시 선거:

- 경기도지사
- 경기도교육감
- 화성시장
- 화성시제3선거구 시·도의원
- 화성시제4선거구 시·도의원
- 화성시제5선거구 시·도의원
- 화성시다선거구 구·시·군의원
- 화성시라선거구 구·시·군의원
- 화성시마선거구 구·시·군의원
- 경기도 광역의원 비례대표
- 화성시 기초의원 비례대표

빌드 이슈와 조치:

- 처음에는 `src/domain/generated-election-data.ts`에 48만 줄 규모의 객체 리터럴을 생성해 Next production build가 데이터 파싱 단계에서 오래 멈췄다.
- 데이터 본문을 JSON 파일로 분리하고 TypeScript 파일은 `readFileSync` 기반 로더로 축소했다.
- 수정 후 `next build` 컴파일은 약 1.3초에 완료됐다.

현재 한계:

- 지역 목록은 선관위 후보자 OpenAPI에 포함된 행정/선거구명 조합으로 만든 것이다.
- 읍면동 주소를 개별 시도의원/구시군의원 선거구 하나로 정확히 좁히는 매핑은 아직 없다.
- 따라서 특정 시군구/분구 선택 시 해당 하위 지방의원 선거구가 여러 개 함께 표시될 수 있다.

## 2026-05-26 추가 작업: 읍면동-선거구 매핑 수집

선거구명을 사용자가 직접 선택하게 하는 방식은 실제 사용성에 맞지 않으므로 제거했다. 사용자는 시군구/구 단위 지역을 선택한 뒤 읍면동만 선택하고, 앱이 해당 읍면동의 시도의원/구시군의원 선거구를 자동으로 적용한다.

추가 및 변경 파일:

| 파일 | 내용 |
| --- | --- |
| `scripts/collect-district-mappings.mjs` | 시도 선관위 홈페이지에서 구시군위원회 선거관리현황을 수집 |
| `data/nec/district-mappings-20260603.json` | 읍면동별 지방의원 선거구 매핑 데이터 |
| `src/domain/generated-district-mappings.ts` | 매핑 JSON 로더 |
| `src/domain/district-mapping.ts` | 읍면동 선택 기반 선거 목록 필터링 |
| `src/domain/district-mapping.test.ts` | 마포구/동탄구/이천시 매핑 검증 |

수집 명령:

```bash
npm run collect:districts
```

수집 결과:

```text
Collected district mappings for 243 regions.
Failures: 0
```

수집 방식:

- 각 시도 선관위 메인 페이지에서 구시군위원회 소개 링크를 찾는다.
- 구시군위원회 목록에서 개별 위원회 페이지를 찾는다.
- 개별 위원회 메뉴의 `선거관리현황` 페이지를 찾는다.
- 해당 페이지의 `도의원/시의원/구시군의원 선거구` 표에서 선거구명과 읍면동 목록을 파싱한다.
- 앱 후보 데이터의 선거구명과 매칭되는 항목만 `district-mappings-20260603.json`에 저장한다.

브라우저 확인:

- 경기도 이천시 선택 직후: 공통 선거 5개 표시
- `중리동` 선택 후: `이천시제1선거구`, `이천시나선거구`가 자동 적용되어 7개 표시

검증 명령:

```bash
npm test
npm run lint
npm run build
npm audit --omit=dev
```

결과:

- `npm test`: 14 tests 통과
- `npm run lint`: 통과
- `npm run build`: 통과
- `npm audit --omit=dev`: production dependency 기준 0 vulnerabilities

## 2026-05-26 추가 작업: 전국 후보자 상세 공개정보 수집

전국 후보자 기본정보만으로는 재산, 병역, 납세, 체납, 전과, 사진 값이 대부분 `자료 없음`으로 남았다. 후보자별 선거통계시스템 상세 페이지를 호출해 상세 공개정보를 수집하고, 앱 데이터셋 생성 단계에서 병합하도록 수정했다.

추가 및 변경 파일:

| 파일 | 내용 |
| --- | --- |
| `scripts/collect-nationwide-candidate-details.mjs` | 전국 후보자 상세 공개정보 수집 |
| `data/nec/nationwide-candidate-details-20260603.json` | 후보자별 재산/병역/납세/체납/전과/사진 상세값 |
| `scripts/build-app-dataset-from-nationwide.mjs` | 상세 공개정보를 앱 후보 데이터에 병합 |

수집 명령:

```bash
npm run collect:details
npm run build:app-data
```

수집 결과:

```text
Collected 7829/7829 candidate details.
Failures: 0
```

상세값 병합 결과:

| 항목 | 후보 상세 원본 기준 | 앱 후보 엔트리 기준 |
| --- | ---: | ---: |
| 재산 | 7,805 / 7,829 | 17,867 / 17,904 |
| 병역 | 7,805 / 7,829 | 17,867 / 17,904 |
| 납세 | 7,805 / 7,829 | 17,867 / 17,904 |
| 현 체납 | 7,805 / 7,829 | 17,867 / 17,904 |
| 전과 | 7,805 / 7,829 | 17,867 / 17,904 |
| 사진 | 7,805 / 7,829 | 17,867 / 17,904 |

남은 24명은 상세 페이지 자체에 해당 공개정보 표가 없어 `자료 없음`으로 유지한다.

## 2026-05-26 추가 작업: 공보/공약 PDF 수집

정책공약마당(`policy.nec.go.kr`)의 후보자공약 화면에서 실제 후보자별 문서 메타데이터가 내려오는 것을 확인했다. `initUCACommimentList.do` 응답의 `huboid`와 `fileinfo`를 기준으로 기존 후보자 데이터와 직접 매칭하고, PDF 원문은 `https://cdn.nec.go.kr/policy_pdf/...` 공개 CDN URL로 연결했다.

추가 및 변경 파일:

| 파일 | 내용 |
| --- | --- |
| `scripts/collect-candidate-documents.mjs` | 전국 후보자 선거공보/5대공약 PDF 메타데이터 수집 |
| `data/nec/candidate-documents-20260603.json` | 후보자별 공보/공약 문서 링크와 원본 `fileinfo` |
| `scripts/build-app-dataset-from-nationwide.mjs` | 앱 후보 데이터의 `pamphletPdf`, `pledgePdf`에 문서 링크 병합 |
| `src/domain/election.test.ts` | 공식 공보/공약 PDF 링크 병합 테스트 |

수집 명령:

```bash
npm run collect:documents
npm run build:app-data
```

수집 결과:

```text
Collected policy documents for 6271 candidates.
Matched 6271/7829.
Pamphlets: 5473, pledges: 617, failures: 0.
```

앱 데이터셋 병합 결과:

| 항목 | 개수 |
| --- | ---: |
| 앱 후보 표시 항목 | 17,904 |
| 선거공보 PDF 링크 | 7,547 |
| 5대공약 PDF 링크 | 2,691 |

주의사항:

- `fileinfo`에는 `선거공약서`, `5대공약`, `선거공보`가 함께 들어오며, 빈 `선거공약서`가 먼저 오는 경우가 있어 실제 PDF 경로가 있는 항목을 우선 선택하도록 처리했다.
- 후보자 7,829명 중 정책공약마당에서 문서 메타데이터가 확인된 후보자는 6,271명이다.
- 모든 후보가 5대공약 PDF를 제출한 것은 아니며, 일부는 원문 PDF 대신 별도 텍스트자료 식별자만 내려온다.

## 2026-05-26 추가 작업: 5대공약 텍스트 원문 수집 및 표시

정책공약마당의 `showPromise(ocrCnvrSeqNo)` 팝업이 `UELPromisePopup.do`와 `UELPromisePopupView.do`를 통해 5대공약 텍스트 원문을 제공하는 것을 확인했다. `fileinfo`의 5대공약 텍스트자료 식별자를 기준으로 후보별 공약 제목과 원문을 수집하고, 키워드 기반 분야 분류를 추가했다.

추가 및 변경 파일:

| 파일 | 내용 |
| --- | --- |
| `scripts/collect-candidate-pledges.mjs` | 5대공약 텍스트 원문 수집 및 분야 분류 |
| `data/nec/candidate-pledges-20260603.json` | 후보자별 공약 제목/분야/원문 |
| `scripts/build-app-dataset-from-nationwide.mjs` | 앱 후보 데이터에 `pledgeItems` 병합 |
| `src/domain/types.ts` | 후보 공약 항목 타입 추가 |
| `src/components/election-dashboard.tsx` | 후보 카드에 주요 공약 3개 표시 |
| `db/schema.sql` | `candidate_pledges` 테이블 추가 |
| `scripts/import-app-dataset-to-postgres.mjs` | 공약 원문 DB 적재 |

수집 명령:

```bash
npm run collect:pledges
npm run build:app-data
DATABASE_URL=postgresql://before_you_vote:before_you_vote@127.0.0.1:5433/before_you_vote npm run db:import
```

수집 결과:

```text
Collected pledge text for 617/617 candidates.
Items: 3085, failures: 0.
```

앱/DB 반영 결과:

| 항목 | 개수 |
| --- | ---: |
| 5대공약 텍스트 원문 보유 후보 | 617 |
| 5대공약 원문 항목 | 3,085 |
| 앱 후보 표시 항목 중 공약 표시 후보 | 2,691 |
| 앱 후보 표시 항목 중 공약 항목 | 13,455 |
| DB `candidate_pledges` rows | 13,455 |

주의사항:

- 모든 후보가 5대공약 텍스트자료를 제출한 것은 아니다.
- 분야 분류는 원문 키워드 기반의 참고용이다. 원문 제목과 내용을 함께 저장해 분류 결과만 단독으로 판단 근거가 되지 않도록 했다.
- 후보 카드에는 모바일 가독성을 위해 주요 공약 3개만 먼저 표시하고, PDF/공개자료 링크는 계속 제공한다.

## 2026-05-26 추가 작업: PostgreSQL 적재 경로 추가

정적 JSON만 읽던 구조에서 운영 DB로 넘어갈 수 있도록 PostgreSQL 스키마, import 스크립트, 서버 데이터 로더를 추가했다. 현재 앱은 `DATABASE_URL`이 있으면 PostgreSQL을 먼저 조회하고, 없거나 조회 실패 시 기존 JSON 데이터셋으로 fallback한다.

추가 및 변경 파일:

| 파일 | 내용 |
| --- | --- |
| `db/schema.sql` | 지역, 선거, 후보, 상세정보, 공보/공약 문서, 공약 원문, 수집 실행 이력 테이블 |
| `scripts/import-app-dataset-to-postgres.mjs` | `data/nec/app-election-dataset-20260603.json`을 PostgreSQL에 적재 |
| `src/server/election-data.ts` | `DATABASE_URL` 기반 DB 조회 및 JSON fallback |
| `src/domain/db-dataset.ts` | PostgreSQL row를 앱 `Dataset` 타입으로 변환 |
| `src/domain/db-dataset.test.ts` | DB row -> 앱 데이터셋 변환 테스트 |
| `docker-compose.yml` | 로컬 PostgreSQL 컨테이너 |
| `.env.example` | `DATA_OPEN_API_KEY`, `DATABASE_URL` 예시 |

실행 흐름:

```bash
docker compose up -d postgres
DATABASE_URL=postgresql://before_you_vote:before_you_vote@localhost:5433/before_you_vote npm run db:import
npm run dev
```

설계 판단:

- 후보 기본정보와 상세정보는 분리했다. 상세정보 재수집 시 후보 목록 전체를 다시 쓰지 않아도 된다.
- 선거와 지역은 `election_regions`로 N:M 연결한다. 시도지사/교육감처럼 여러 지역 선택 화면에 같은 선거가 노출되는 구조를 유지하기 위해서다.
- 문서는 `candidate_documents`에 `pamphlet`, `pledge` 타입으로 분리했다. 공보 공개일 이후 문서만 재수집해 갱신할 수 있다.
- Spring Boot API는 아직 붙이지 않았다. 현재는 Next.js 서버 컴포넌트에서 DB를 직접 읽고, 데이터 모델이 안정된 뒤 백엔드 API로 분리하는 편이 비용이 낮다.

## 다음 작업 후보

우선순위가 높은 순서:

1. 실제 PostgreSQL 컨테이너에 import 실행 후 DB 조회 모드 화면 검증
2. 미니PC 배포용 Dockerfile 및 compose 구성 확장
3. 위치 좌표 -> 주소 -> 행정동 -> 선거구 매핑 정확도 검증
4. 공약 텍스트자료 식별자 기반 원문 조회 가능성 추가 확인
5. 데이터 갱신 명령을 한 번에 실행하는 수집 파이프라인 구성

## 커밋 전 참고

현재 작업은 첫 MVP UI/도메인 슬라이스다. 커밋 메시지는 다음 정도가 적절하다.

```text
Build mobile candidate lookup MVP
```

또는 한국어로:

```text
모바일 후보 확인 MVP 구현
```
