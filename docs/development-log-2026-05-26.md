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

## 다음 작업 후보

우선순위가 높은 순서:

1. 실제 수집 데이터 모델 확정
2. 선관위 후보자 OpenAPI 수집 스크립트 또는 백엔드 Collector 구현
3. `policy.nec.go.kr` 후보자공약 JSON 수집
4. `info.nec.go.kr` 상세 공개자료 수집
5. PostgreSQL 스키마 작성
6. 동탄 기준 지역/선거구 매핑 검증
7. 위치 좌표 -> 주소 -> 선거구 매핑 구현
8. 미니PC 배포 구성 작성

## 커밋 전 참고

현재 작업은 첫 MVP UI/도메인 슬라이스다. 커밋 메시지는 다음 정도가 적절하다.

```text
Build mobile candidate lookup MVP
```

또는 한국어로:

```text
모바일 후보 확인 MVP 구현
```
