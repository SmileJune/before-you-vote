# 선관위 OpenAPI 검증 기록

검증일: 2026-05-18

`.env`의 `DATA_OPEN_API_KEY`로 중앙선거관리위원회 공공데이터 OpenAPI를 실제 호출해 응답 가능 범위와 MVP 적용 가능성을 확인했다.

## 2026-05-25 재검증 결과

선거공보물이 도착한 시점에 2026년 제9회 전국동시지방선거 후보자 API를 다시 호출했다. 2026-05-18에는 후보자 데이터가 내려오지 않았지만, 2026-05-25 현재 후보자와 공약 데이터가 정상 조회된다.

### 후보자 데이터

공통 요청:

```text
GET http://apis.data.go.kr/9760000/PofelcddInfoInqireService/getPofelcddRegistSttusInfoInqire
sgId=20260603
resultType=json
```

서울특별시 기준 확인 결과:

| 선거종류 | sgTypecode | 샘플 조건 | resultCode | totalCount |
|---|---:|---|---|---:|
| 시·도지사선거 | 3 | sdName=서울특별시 | INFO-00 | 6 |
| 구·시·군의 장선거 | 4 | sdName=서울특별시, sggName=종로구 | INFO-00 | 2 |
| 시·도의회의원선거 | 5 | sdName=서울특별시 | INFO-00 | 240 |
| 구·시·군의회의원선거 | 6 | sdName=서울특별시, sggName=종로구가선거구 | INFO-00 | 3 |
| 광역의원비례대표선거 | 8 | sdName=서울특별시 | INFO-00 | 54 |
| 기초의원비례대표선거 | 9 | sdName=서울특별시, sggName=종로구 | INFO-00 | 2 |
| 교육감선거 | 11 | sdName=서울특별시 | INFO-00 | 8 |

시도지사선거 서울특별시 샘플:

| giho | jdName | name | huboid | job | status |
|---:|---|---|---:|---|---|
| 1 | 더불어민주당 | 정원오 | 100157144 | 정당인 | 등록 |
| 2 | 국민의힘 | 오세훈 | 100162984 | 서울특별시장 | 등록 |
| 4 | 개혁신당 | 김정철 | 100158541 | 변호사 | 등록 |
| 5 | 여성의당 | 유지혜 | 100162632 | 정당인 | 등록 |
| 6 | 자유통일당 | 이강산 | 100162642 | 정당인 | 등록 |

구·시·군의 장선거 서울특별시 종로구 샘플:

| giho | jdName | name | huboid | job | status |
|---:|---|---|---:|---|---|
| 1 | 더불어민주당 | 유찬종 | 100154016 | 정당인 | 등록 |
| 2 | 국민의힘 | 정문헌 | 100163635 | 종로구청장 | 등록 |

교육감선거 서울특별시 샘플:

| name | huboid | job | status |
|---|---:|---|---|
| 김영배 | 100153800 | 예원예술대학교 부총장 | 등록 |
| 한만중 | 100155563 | 전국교육자치혁신연대 상임대표 | 등록 |
| 조전혁 | 100163258 | 서울시 미래교육연구원 원장 | 등록 |
| 이학인 | 100162651 | 신한대학교 부교수 | 등록 |
| 윤호상 | 100153774 | 한양대학교 교육대학원 겸임교수 | 등록 |

### 공약 데이터

공통 요청:

```text
GET http://apis.data.go.kr/9760000/ElecPrmsInfoInqireService/getCnddtElecPrmsInfoInqire
sgId=20260603
resultType=json
```

서울시장 오세훈 후보 공약 확인:

```text
sgTypecode=3
cnddtId=100162984
```

결과:

- `resultCode=INFO-00`
- `totalCount=1`
- `prmsCnt=5`

확인된 공약 제목:

| 순번 | 분야 | 제목 |
|---:|---|---|
| 1 | 주택1 | 멈췄던 공급에 속도를! 압도적 주택공급 |
| 2 | 주택2 | 무너진 주거이동 안전망을 복원하겠습니다 |
| 3 | 교통 | 이동의 답답함을 풀어내는 서울 교통 대전환 |
| 4 | 복지 | 더 따뜻한 서울, 약자와의 동행 시즌 2 |
| 5 | 산업일자리 | 매년 100만 기회, 내일이 더 기대되는 서울 |

### 재검증 결론

- 2026년 후보자 기본정보는 OpenAPI로 조회 가능하다.
- 2026년 공약 정보도 후보자ID 기준으로 조회 가능하다.
- 지역 선택, 선거종류 선택, 후보자 목록, 후보자 상세, 후보자 비교, 공약 원문 제공까지는 OpenAPI 기반 MVP 구현이 가능하다.
- 여전히 재산, 병역, 납세, 전과는 후보자 기본정보 API에 포함되지 않는다.

## 검증 대상

- 중앙선거관리위원회_코드 정보
- 중앙선거관리위원회_후보자 정보
- 중앙선거관리위원회_선거공약 정보

## 호출 옵션

공공데이터포털 문서에는 XML/JSON을 모두 지원한다고 되어 있다. 실제 호출 시 `_type=json`이 아니라 `resultType=json`을 사용해야 JSON 응답을 받을 수 있었다.

```text
resultType=json
```

## 코드 정보 API

서비스 URL:

```text
http://apis.data.go.kr/9760000/CommonCodeService
```

### 선거코드

엔드포인트:

```text
GET /getCommonSgCodeList
```

2026년 제9회 전국동시지방선거 선거코드는 정상 조회된다.

확인된 `sgId`:

```text
20260603
```

확인된 선거종류:

| sgTypecode | sgName |
|---:|---|
| 3 | 시·도지사선거 |
| 4 | 구·시·군의 장선거 |
| 5 | 시·도의회의원선거 |
| 6 | 구·시·군의회의원선거 |
| 8 | 광역의원비례대표선거 |
| 9 | 기초의원비례대표선거 |
| 11 | 교육감선거 |

### 구시군코드

엔드포인트:

```text
GET /getCommonGusigunCodeList
```

2026년 서울특별시 기준 구시군 코드가 정상 조회된다.

샘플 필드:

- `sgId`
- `sdName`
- `wiwName`
- `wOrder`

샘플 데이터:

| sdName | wiwName |
|---|---|
| 서울특별시 | 종로구 |
| 서울특별시 | 중구 |
| 서울특별시 | 용산구 |
| 서울특별시 | 성동구 |
| 서울특별시 | 광진구 |

### 선거구코드

엔드포인트:

```text
GET /getCommonSggCodeList
```

2026년 시도지사선거 기준 선거구 코드가 정상 조회된다.

샘플 필드:

- `sgId`
- `sgTypecode`
- `sggName`
- `sdName`
- `wiwName`
- `sggJungsu`
- `sOrder`

주의:

- 일부 응답에서 `sggName`이 예상과 다르게 표시되는 값이 있었다. 예: `sdName=광주광역시`, `sggName=전남광주통합특별시`
- 실제 서비스 적용 전 시도별 선거구명 정합성 검증이 필요하다.

### 정당코드

엔드포인트:

```text
GET /getCommonPartyCodeList
```

2026년 기준 정당 목록이 정상 조회된다.

샘플 필드:

- `sgId`
- `jdName`
- `pOrder`

샘플 데이터:

- 더불어민주당
- 국민의힘
- 조국혁신당
- 개혁신당
- 진보당

### 직업코드

엔드포인트:

```text
GET /getCommonJobCodeList
```

2026년 기준 직업 코드가 정상 조회된다.

샘플 필드:

- `sgId`
- `jobId`
- `jobName`
- `jOrder`

샘플 데이터:

- 국회의원
- 지방의원
- 단체장·교육감
- 교육의원
- 정치인

### 학력코드

엔드포인트:

```text
GET /getCommonEduBckgrdCodeList
```

2026년 기준 학력 코드가 정상 조회된다.

샘플 필드:

- `sgId`
- `eduId`
- `eduName`
- `eOrder`

샘플 데이터:

- 미기재
- 무학(독학)
- 초퇴
- 초졸
- 중재

## 후보자 정보 API

서비스 URL:

```text
http://apis.data.go.kr/9760000/PofelcddInfoInqireService
```

예비후보자 엔드포인트:

```text
GET /getPoelpcddRegistSttusInfoInqire
```

후보자 엔드포인트:

```text
GET /getPofelcddRegistSttusInfoInqire
```

문서상 제공 필드:

- `sgId`
- `sgTypecode`
- `huboid`
- `sggName`
- `sdName`
- `wiwName`
- `giho`
- `gihoSangse`
- `jdName`
- `name`
- `hanjaName`
- `gender`
- `birthday`
- `age`
- `addr`
- `jobId`
- `job`
- `eduId`
- `edu`
- `career1`
- `career2`
- `status`
- `num`

실제 호출 결과:

- 예비후보자 엔드포인트로 후보자 데이터를 조회하면 `INFO-03`이 반환된다.
- 후보자 엔드포인트 `getPofelcddRegistSttusInfoInqire`로 조회하면 종료된 선거 후보자 데이터가 정상 조회된다.
- `sgId=20220601`, `sgTypecode=3`, `sdName=서울특별시`: `INFO-00`, `totalCount=5`
- `sgId=20240410`, `sgTypecode=2`, `sdName=서울특별시`: `INFO-00`, `totalCount=125`

2022 서울시장선거 샘플 후보자:

| giho | jdName | name | huboid | job | status |
|---:|---|---|---:|---|---|
| 1 | 더불어민주당 | 송영길 | 100147796 | 변호사 | 등록 |
| 2 | 국민의힘 | 오세훈 | 100149260 | 서울특별시장 | 등록 |
| 3 | 정의당 | 권수정 | 100138891 | 서울시의원 | 등록 |

2024 국회의원선거 서울특별시 샘플 후보자:

| sggName | giho | jdName | name | huboid | job | status |
|---|---:|---|---|---:|---|---|
| 종로구 | 1 | 더불어민주당 | 곽상언 | 100151444 | 변호사 | 등록 |
| 종로구 | 10 | 민중민주당 | 차은정 | 100153178 | 정당인 | 등록 |
| 종로구 | 2 | 국민의힘 | 최재형 | 100152901 | 제21대 국회의원 | 등록 |

해석:

- API 키 인증 자체는 통과한다.
- 종료된 선거의 후보자 기본정보는 OpenAPI로 조회 가능하다.
- 예비후보자와 후보자 엔드포인트 이름이 매우 비슷하므로 수집 코드에서 혼동하지 않도록 주의해야 한다.
- 후보자 기본정보에는 기호(`giho`)가 포함된다.
- 주소(`addr`)는 종료된 선거 샘플에서 빈 값으로 내려왔다.
- 재산, 병역, 납세, 전과는 후보자 기본정보 API 응답에는 포함되지 않는다.

## 선거공약 정보 API

서비스 URL:

```text
http://apis.data.go.kr/9760000/ElecPrmsInfoInqireService
```

엔드포인트:

```text
GET /getCnddtElecPrmsInfoInqire
```

문서상 요청 필수값:

- `sgId`
- `sgTypecode`
- `cnddtId`

문서상 제공 대상:

- 대통령선거
- 시·도지사선거
- 구·시·군의 장선거
- 교육감선거

문서상 제공 필드:

- `sgId`
- `sgTypecode`
- `cnddtId`
- `sggName`
- `sidoName`
- `wiwName`
- `partyName`
- `krName`
- `cnName`
- `prmsCnt`
- `prmsOrd1` ~ `prmsOrd10`
- `prmsRealmName1` ~ `prmsRealmName10`
- `prmsTitle1` ~ `prmsTitle10`
- `prmsCont1` ~ `prmsCont10`

실제 호출 결과:

- 후보자 API에서 확보한 `huboid`를 `cnddtId`로 사용하면 종료된 선거 공약 데이터가 정상 조회된다.
- `sgId=20220601`, `sgTypecode=3`, `cnddtId=100149260`: `INFO-00`, `totalCount=1`
- 샘플 후보자: 2022 서울시장선거 오세훈 후보
- 샘플 공약 수: `prmsCnt=5`

해석:

- 공약 API는 후보자ID 의존성이 강하다.
- 후보자 목록 수집 경로가 먼저 안정화되어야 공약 수집을 자동화할 수 있다.
- 공약은 `prmsTitle1` ~ `prmsTitle10`, `prmmCont1` ~ `prmmCont10`처럼 번호가 붙은 컬럼 형태로 내려온다.
- 정규화 시 후보자 공약 1개당 row 1개로 풀어 저장하는 것이 좋다.

## MVP 판단

현재 OpenAPI 검증 기준으로는 다음 순서가 현실적이다.

1. 코드 정보 API를 먼저 수집한다.
2. 지역, 구시군, 선거구, 선거종류 선택 UI/API는 OpenAPI 기반으로 구현 가능하다.
3. 후보자 목록과 후보자 기본 상세정보는 OpenAPI 기반으로 구현 가능하다.
4. 공약은 후보자ID 확보 후 연동 가능하다.
5. 재산, 병역, 납세, 전과는 OpenAPI 문서상 확인되지 않으므로 선거통계시스템 공개자료를 별도 검증한다.

## 결론

- `DATA_OPEN_API_KEY`는 코드 정보 API에서 정상 동작한다.
- 2026 지방선거의 선거코드, 주요 기초코드, 후보자 기본정보, 공약 정보는 조회 가능하다.
- 종료된 선거의 후보자 기본정보와 공약 정보는 OpenAPI로 조회 가능하다.
- MVP의 첫 구현은 코드/지역/선거구 데이터 모델링과 후보자 기본정보 수집까지 OpenAPI 기반으로 진행할 수 있다.
- 재산, 병역, 납세, 전과는 별도 공개자료 수집 경로 검증이 필요하다.
