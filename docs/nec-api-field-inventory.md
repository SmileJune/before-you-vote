# 선관위 OpenAPI 필드 인벤토리

확인일: 2026-05-25

범위:

- 공공데이터포털 및 중앙선관위 국가선거정보 개방포털에서 제공하는 중앙선거관리위원회 OpenAPI 전체 20개
- `DATA_OPEN_API_KEY`로 호출 가능한 공공데이터 OpenAPI
- 선거 관련 서비스 구현에 사용할 수 있는 요청/응답 필드

참고:

- 공통 응답 메타 필드: `resultCode`, `resultMsg`, `numOfRows`, `pageNo`, `totalCount`
- JSON 응답은 `resultType=json` 사용
- 일부 API는 문서상 `serviceKey`, 일부는 `ServiceKey`로 표기된다. 실제 호출 코드는 둘 다 대응 가능하게 만드는 것이 안전하다.

## 전체 API 목록

공공데이터포털 공지와 선관위 개방포털 기준 전체 OpenAPI는 20개다.

1. 중앙선거관리위원회_코드 정보
2. 중앙선거관리위원회_후보자 정보
3. 중앙선거관리위원회_투표소 정보
4. 중앙선거관리위원회_투·개표 정보
5. 중앙선거관리위원회_당선인 정보
6. 중앙선거관리위원회_개표소 정보
7. 중앙선거관리위원회_사전투표 정보
8. 중앙선거관리위원회_선거공약 정보
9. 중앙선거관리위원회_정당정책 정보
10. 중앙선거관리위원회_무투표선거구 정보
11. 중앙선거관리위원회_선거인수 정보
12. 중앙선거관리위원회_재보궐선거 실시사유 확정상황
13. 중앙선거관리위원회_후보자 사퇴/사망/등록무효 현황
14. 중앙선거관리위원회_선거운동기구 설치내역 정보
15. 중앙선거관리위원회_역대 대통령선거 실시상황
16. 중앙선거관리위원회_역대 국회의원선거 실시상황
17. 중앙선거관리위원회_역대 지방선거 실시상황
18. 중앙선거관리위원회_역대 재보궐선거 실시상황
19. 중앙선거관리위원회_역대 재보궐선거 실시사유
20. 중앙선거관리위원회_후보자 통합검색

## 1. 코드 정보

문서:

- https://www.data.go.kr/data/15000897/openapi.do

서비스:

```text
http://apis.data.go.kr/9760000/CommonCodeService
```

### 선거코드

Endpoint:

```text
GET /getCommonSgCodeList
```

Request:

- `ServiceKey`
- `pageNo`
- `numOfRows`
- `resultType`

Response item:

- `num`: 순번
- `sgId`: 선거ID
- `sgName`: 선거명
- `sgTypecode`: 선거종류코드
- `sgVotedate`: 선거일

### 구시군코드

Endpoint:

```text
GET /getCommonGusigunCodeList
```

Request:

- `ServiceKey`
- `pageNo`
- `numOfRows`
- `resultType`
- `sgId`
- `sdName`

Response item:

- `num`
- `sgId`
- `sdName`
- `wiwName`: 구시군명
- `wOrder`: 구시군 순서

### 선거구코드

Endpoint:

```text
GET /getCommonSggCodeList
```

Request:

- `ServiceKey`
- `pageNo`
- `numOfRows`
- `resultType`
- `sgId`
- `sgTypecode`
- `sdName`
- `wiwName`

Response item:

- `num`
- `sgId`
- `sgTypecode`
- `sdName`
- `wiwName`
- `sggName`: 선거구명
- `sggJungsu`: 선거구 정수
- `sOrder`: 선거구 순서

### 정당코드

Endpoint:

```text
GET /getCommonPartyCodeList
```

Request:

- `ServiceKey`
- `pageNo`
- `numOfRows`
- `resultType`
- `sgId`

Response item:

- `num`
- `sgId`
- `jdName`: 정당명
- `pOrder`: 정당 순서

### 직업코드

Endpoint:

```text
GET /getCommonJobCodeList
```

Request:

- `ServiceKey`
- `pageNo`
- `numOfRows`
- `resultType`
- `sgId`

Response item:

- `num`
- `sgId`
- `jobId`: 직업ID
- `jobName`: 직업명
- `jOrder`: 직업 순서

### 학력코드

Endpoint:

```text
GET /getCommonEduBckgrdCodeList
```

Request:

- `ServiceKey`
- `pageNo`
- `numOfRows`
- `resultType`
- `sgId`

Response item:

- `num`
- `sgId`
- `eduId`: 학력ID
- `eduName`: 학력명
- `eOrder`: 학력 순서

## 2. 후보자 정보

문서:

- https://www.data.go.kr/data/15000908/openapi.do

서비스:

```text
http://apis.data.go.kr/9760000/PofelcddInfoInqireService
```

### 예비후보자

Endpoint:

```text
GET /getPoelpcddRegistSttusInfoInqire
```

Request:

- `ServiceKey`
- `pageNo`
- `numOfRows`
- `resultType`
- `sgId`
- `sgTypecode`
- `sggName`
- `sdName`

Response item:

- `num`
- `sgId`
- `sgTypecode`
- `huboid`: 후보자ID
- `sggName`
- `sdName`
- `wiwName`
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
- `regdate`: 등록일
- `status`: 등록상태

### 후보자

Endpoint:

```text
GET /getPofelcddRegistSttusInfoInqire
```

Request:

- `ServiceKey`
- `pageNo`
- `numOfRows`
- `resultType`
- `sgId`
- `sgTypecode`
- `sggName`
- `sdName`
- `jdName`

Response item:

- `num`
- `sgId`
- `sgTypecode`
- `huboid`
- `sggName`
- `sdName`
- `wiwName`
- `giho`: 기호
- `gihoSangse`: 기호상세
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

## 3. 투표소 정보

문서:

- https://www.data.go.kr/data/15000836/openapi.do

서비스:

```text
http://apis.data.go.kr/9760000/PolplcInfoInqireService2
```

### 사전투표소

Endpoint:

```text
GET /getPrePolplcOtlnmapTrnsportInfoInqire
```

Request:

- `ServiceKey`
- `pageNo`
- `numOfRows`
- `resultType`
- `sgId`
- `sdName`
- `wiwName`

Response item:

- `num`
- `sgId`
- `evPsName`: 사전투표소명
- `sdName`
- `wiwName`
- `emdName`
- `evOrder`
- `placeName`
- `addr`
- `floor`

### 선거일투표소

Endpoint:

```text
GET /getPolplcOtlnmapTrnsportInfoInqire
```

Request:

- `ServiceKey`
- `pageNo`
- `numOfRows`
- `resultType`
- `sgId`
- `sdName`
- `wiwName`

Response item:

- `num`
- `sgId`
- `psName`: 선거일투표소명
- `sdName`
- `wiwName`
- `emdName`
- `placeName`
- `addr`
- `floor`

## 4. 투·개표 정보

문서:

- https://www.data.go.kr/data/15000900/openapi.do

서비스:

```text
http://apis.data.go.kr/9760000/VoteXmntckInfoInqireService2
```

### 투표 결과

Endpoint:

```text
GET /getVoteSttusInfoInqire
```

Request:

- `ServiceKey`
- `pageNo`
- `numOfRows`
- `resultType`
- `sgId`
- `sgTypecode`
- `sdName`
- `wiwName`

Response item:

- `num`
- `sgId`
- `sgTypecode`
- `sdName`
- `wiwName`
- `totSunsu`: 총 선거인수
- `psSunsu`: 선거일투표 선거인수
- `psEtcSunsu`: 거소·사전·선상·재외 선거인수
- `totTusu`: 총 투표자수
- `psTusu`: 선거일 투표자수
- `psEtcTusu`: 거소·사전·선상·재외 투표자수
- `Turnout` 또는 `turnout`: 투표율
- `vrOrder`: 순서

### 개표 결과

Endpoint:

```text
GET /getXmntckSttusInfoInqire
```

Request:

- `ServiceKey`
- `pageNo`
- `numOfRows`
- `resultType`
- `sgId`
- `sgTypecode`
- `sggName`
- `sdName`
- `wiwName`

Response item:

- `num`
- `sgId`
- `sgTypecode`
- `sggName`
- `sdName`
- `wiwName`
- `sunsu`: 선거인수
- `tusu`: 투표수
- `yutusu`: 유효투표수
- `mutusu`: 무효투표수
- `gigwonsu`: 기권수
- `jd01` ~ `jd50`: 정당명
- `hbj01` ~ `hbj50`: 후보자명
- `dugsu01` ~ `dugsu50`: 득표수
- `crOrder`: 순서

정규화 권장:

- `jdNN`, `hbjNN`, `dugsuNN`은 후보자별 득표 row로 풀어 저장한다.

## 5. 당선인 정보

문서:

- https://www.data.go.kr/data/15000864/openapi.do

Endpoint:

```text
GET http://apis.data.go.kr/9760000/WinnerInfoInqireService2/getWinnerInfoInqire
```

Request:

- `ServiceKey`
- `pageNo`
- `numOfRows`
- `resultType`
- `sgId`
- `sgTypecode`
- `sdName`
- `sggName`

Response item:

- `num`
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
- `dugsu`: 득표수
- `dugyul`: 득표율

## 6. 개표소 정보

문서:

- https://www.data.go.kr/data/15040584/openapi.do

Endpoint:

```text
GET http://apis.data.go.kr/9760000/CountingSttnInfoInqireService/getCountingSttnInfoInqire
```

Request:

- `ServiceKey`
- `pageNo`
- `numOfRows`
- `resultType`
- `sgId`
- `sdName`
- `wiwName`

Response item:

- `num`
- `sgId`
- `countingSttnName`: 개표소명
- `sdName`
- `wiwName`
- `countingSttnSeq`: 개표소순번
- `placeName`
- `placeAddr`
- `placeFloor`

## 7. 사전투표 정보

문서:

- https://www.data.go.kr/data/15040586/openapi.do

Endpoint:

```text
GET http://apis.data.go.kr/9760000/ErVotingSttusInfoInqireService/getErVotingSttusInfoInqire
```

Request:

- `ServiceKey`
- `pageNo`
- `numOfRows`
- `resultType`
- `sgId`
- `erVotingDiv`: 사전투표구분, `0=전체`, `1=1일차`, `2=2일차`
- `sdName`
- `wiwName`

Response item:

- `num`
- `sgId`
- `erVotingDiv`
- `sdName`
- `wiwName`
- `votersCnt`: 선거인수
- `erVotingCnt`: 사전투표자수
- `erTurnout`: 사전투표율
- `sortOrd`: 순서

## 8. 선거공약 정보

문서:

- https://www.data.go.kr/data/15040587/openapi.do

Endpoint:

```text
GET http://apis.data.go.kr/9760000/ElecPrmsInfoInqireService/getCnddtElecPrmsInfoInqire
```

Request:

- `ServiceKey`
- `pageNo`
- `numOfRows`
- `resultType`
- `sgId`
- `sgTypecode`
- `cnddtId`: 후보자ID

Response item:

- `num`
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
- `prmsCont1` 또는 실제 응답의 `prmmCont1` ~ `prmsCont10`/`prmmCont10`

주의:

- 실제 2026 응답에서는 문서의 `prmsContN` 대신 `prmmContN`으로 내려오는 케이스를 확인했다.
- 정규화 시 공약 1개당 row 1개로 풀어 저장한다.

## 9. 정당정책 정보

문서:

- https://www.data.go.kr/data/15040588/openapi.do

Endpoint:

```text
GET http://apis.data.go.kr/9760000/PartyPlcInfoInqireService/getPartyPlcInfoInqire
```

Request:

- `ServiceKey`
- `pageNo`
- `numOfRows`
- `resultType`
- `sgId`
- `partyName`

Response item:

- `num`
- `sgId`
- `partyName`
- `prmsCnt`
- `prmsOrd1` ~ `prmsOrd10`
- `prmsRealmName1` ~ `prmsRealmName10`
- `prmsTitle1` ~ `prmsTitle10`
- `prmsCont1` ~ `prmsCont10`

## 10. 무투표선거구 정보

문서:

- https://www.data.go.kr/data/15094964/openapi.do

서비스:

```text
http://apis.data.go.kr/9760000/WtvtelpcInfoInqireService
```

### 무투표선거구 후보자

Endpoint:

```text
GET /getWtvtelpccndaInfoInqire
```

### 무투표선거구 당선인

Endpoint:

```text
GET /getWtvtelpcWnldtInfoInqire
```

Request:

- `serviceKey`
- `pageNo`
- `numOfRows`
- `resultType`
- `sgId`
- `sgTypecode`
- `sdName`

Response item:

- `num`
- `sgId`
- `sgTypecode`
- `sdName`
- `sggName`
- `jdName`
- `name`
- `hanjaName`
- `gender`
- `birthday`
- `age`
- `jobId`
- `job`
- `eduId`
- `edu`
- `career1`
- `career2`

## 11. 선거인수 정보

문서:

- https://www.data.go.kr/data/15094967/openapi.do

서비스:

```text
http://apis.data.go.kr/9760000/ElcntInfoInqireService
```

상세기능:

- `GET /getCtpvElcntInfoInqire`: 시도별 선거인수
- `GET /getWiwElcntInfoInqire`: 구시군별 선거인수
- `GET /getElpcElcntInfoInqire`: 선거구별 선거인수
- `GET /getEmdElcntInfoInqire`: 읍면동별 선거인수
- `GET /getTpgElcntInfoInqire`: 투표구별 선거인수

Request 공통:

- `serviceKey`
- `pageNo`
- `numOfRows`
- `resultType`
- `sgId`
- `sgTypecode`
- `sdName`
- `wiwName`

Response item 전체 후보 필드:

- `num`
- `sgId`
- `sdName`
- `wiwName`
- `sggName`
- `emdName`
- `tpgName`
- `wiwCount`: 구시군수
- `emdCount`: 읍면동수
- `tpgCount`: 투표구수
- `ppltCnt`: 인구수
- `ntabPpltCnt`: 재외국민 인구수
- `frgnrPpltCnt`: 외국인 인구수
- `cfmtnElcnt`: 확정선거인수 계
- `cfmtnRacnt`: 확정선거인수 재외국민
- `cfmtnFrgnrCnt`: 확정선거인수 외국인
- `cfmtnManElcnt`: 남성 확정선거인수
- `cfmtnManRacnt`: 남성 재외국민
- `cfmtnManFrgnrCnt`: 남성 외국인
- `cfmtnFmlElcnt`: 여성 확정선거인수
- `cfmtnFmlRacnt`: 여성 재외국민
- `cfmtnFmlFrgnrCnt`: 여성 외국인
- `cfmtnRdvtDccnt`: 거소투표신고인수
- `cfmtnNtabRdvtDccnt`: 재외국민 거소투표신고인수
- `cfmtnRdvtManDccnt`: 남성 거소투표신고인수
- `cfmtnNtabRdvtManDccnt`: 남성 재외국민 거소투표신고인수
- `cfmtnRdvtFmlDccnt`: 여성 거소투표신고인수
- `cfmtnNtabRdvtFmlDccnt`: 여성 재외국민 거소투표신고인수

## 12. 재보궐선거 실시사유 확정상황

문서:

- https://www.data.go.kr/data/15111381/openapi.do

Endpoint:

```text
GET http://apis.data.go.kr/9760000/RpbeExctRsnInqireService/getRpbeExctRsnCfmtnInfoInqire
```

Request:

- `serviceKey`
- `pageNo`
- `numOfRows`
- `resultType`
- `sgExctDate`: 선거실시일

Response item:

- `sgTypecode`
- `sgName`
- `sgGubunName`
- `sdName`
- `wiwName`
- `sggName`
- `jdName`
- `name`
- `rsnCn`: 사유내용
- `rsnOcrnDate` 또는 `rsnOcrnYmd`: 사유발생일
- `rsnCfmtnDate` 또는 `rsnCfmtnYmd`: 사유확정일

## 13. 후보자 사퇴/사망/등록무효 현황

문서:

- https://www.data.go.kr/data/15111382/openapi.do

서비스:

```text
http://apis.data.go.kr/9760000/CndaRegInvdInqireService
```

상세기능:

- `GET /getRsreCndaRsgtDthInvdInqire`: 예비후보자 사퇴/사망/등록무효 현황
- `GET /getCndaRsgtDthInvdInqire`: 후보자 사퇴/사망/등록무효 현황

Request:

- `serviceKey`
- `pageNo`
- `numOfRows`
- `resultType`
- `sgId`
- `sgTypecode`
- `sdName`
- `sggName`

예비후보자 Response item:

- `sgId`
- `sgTypecode`
- `sdName`
- `sggName`
- `jdName`
- `name`
- `hanjaName`
- `birthday`
- `age`
- `regStatusName`
- `rsgtDthRgivdYmd`
- `rsgtDthRgivdRsn`

후보자 Response item:

- `sgId`
- `sgTypecode`
- `sdName`
- `sggName`
- `giho`
- `gihoSangse`
- `jdName`
- `name`
- `hanjaName`
- `birthday`
- `age`
- `regStatusName`
- `rsgtDthRgivdYmd`
- `rsgtDthRgivdRsn`

## 14. 선거운동기구 설치내역 정보

문서:

- https://www.data.go.kr/data/15111383/openapi.do

서비스:

```text
http://apis.data.go.kr/9760000/ElctWrkInstlInqireService
```

상세기능:

- `GET /getRsreCndaElctWrktInstlInqire`: 예비후보자 선거운동기구
- `GET /getCndaElctWrktInstlInqire`: 후보자 선거운동기구
- `GET /getPlprElctOffcInstlInqire`: 정당선거사무소

Request:

- `serviceKey`
- `pageNo`
- `numOfRows`
- `resultType`
- `sgId`
- `sgTypecode`
- `sdName`
- `wiwName`
- `jdName`
- `name`
- `sggName`

Response item:

- `sgId`
- `sgTypecode`
- `sdName`
- `wiwName`
- `jdName`
- `name`
- `sggName`
- `elwkorName`: 선거운동기구명
- `instlRgnName`: 설치지역명
- `telNo`: 전화번호
- `instlDclrDate`: 설치신고일

## 15. 역대 대통령선거 실시상황

문서:

- https://www.data.go.kr/data/15125429/openapi.do

Endpoint:

```text
GET http://apis.data.go.kr/9760000/ScgnPresElctExctSttnService/getScgnPresElctExctSttnInqire
```

Request:

- `serviceKey`
- `pageNo`
- `numOfRows`
- `resultType`

Response item:

- `elctNm`: 선거명
- `elctNotmNm`: 선거회차명
- `elctYmd`: 선거일
- `elctDywk`: 선거요일
- `pbancYmd`: 공고일
- `pbancDywk`: 공고요일
- `sccnNm`: 당선인명
- `elcnMthdNm`: 선출방법명

## 16. 역대 국회의원선거 실시상황

문서:

- https://www.data.go.kr/data/15125430/openapi.do

Endpoint:

```text
GET http://apis.data.go.kr/9760000/ScgnConElctExctSttnService/getScgnConElctExctSttnInqire
```

Request:

- `serviceKey`
- `pageNo`
- `numOfRows`
- `resultType`

Response item:

- `elctNm`
- `elctNotmNm`
- `elctYmd`
- `elctDywk`
- `pbancYmd`
- `pbancDywk`
- `elctPrdDys`: 선거기간일수
- `trofBgngYmd`: 후보자등록 시작일
- `trofEndYmd`: 후보자등록 종료일

## 17. 역대 지방선거 실시상황

문서:

- https://www.data.go.kr/data/15125433/openapi.do

Endpoint:

```text
GET http://apis.data.go.kr/9760000/ScgnLocElctExctSttnService/getScgnLocElctExctSttnInqire
```

Request:

- `serviceKey`
- `pageNo`
- `numOfRows`
- `resultType`

Response item:

- `elctNm`
- `elctNotmNm`
- `elctYmd`
- `elctDywk`
- `voteRt`: 투표율

## 18. 역대 재보궐선거 실시상황

문서:

- https://www.data.go.kr/data/15140020/openapi.do

Endpoint:

```text
GET http://apis.data.go.kr/9760000/ScgnRpbeElctExctSttnService/getScgnRpbeElctExctSttnInqire
```

Request:

- `serviceKey`
- `elctYear`
- `pageNo`
- `numOfRows`
- `resultType`

Response item:

- `elctYmd`
- `elctDywk`
- `elctNm`
- `elctKndCd`

## 19. 역대 재보궐선거 실시사유

문서:

- https://www.data.go.kr/data/15140038/openapi.do

Endpoint:

```text
GET http://apis.data.go.kr/9760000/ScgnRpbeExctRsnService/getScgnRpbeElctExctRsnInqire
```

Request:

- `serviceKey`
- `elctYear`
- `pageNo`
- `numOfRows`
- `resultType`

Response item:

- `elctYmd`
- `elctKndCd`
- `elctNm`
- `seNm`
- `ctpvNm`
- `cmtNm`
- `elpcNm`
- `plprNm`
- `trprNm`
- `rsnOcrnYmd`
- `rsnCfmtnYmd`

## 20. 후보자 통합검색

문서:

- https://www.data.go.kr/data/15140045/openapi.do

Endpoint:

```text
GET http://apis.data.go.kr/9760000/CndaSrchService/getCndaSrchInqire
```

Request:

- `serviceKey`
- `pageNo`
- `numOfRows`
- `resultType`
- `name`

Response item:

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
- `jobId`
- `job`
- `eduId`
- `edu`
- `career1`
- `career2`
- `elctNm`: 선거명
- `elcoYn`: 당선 여부

## MVP에서 바로 쓸 수 있는 정보

### 지역/선거구 선택

- `sgId`, `sgName`, `sgTypecode`, `sgVotedate`
- `sdName`, `wiwName`, `sggName`
- `sggJungsu`, `wOrder`, `sOrder`
- 선거인수/인구수 계층별 정보

### 후보자 목록/상세

- `huboid`
- `giho`, `gihoSangse`
- `jdName`
- `name`, `hanjaName`
- `gender`
- `birthday`, `age`
- `addr`
- `jobId`, `job`
- `eduId`, `edu`
- `career1`, `career2`
- `status`
- `regdate` 예비후보자 한정

### 후보자 상태 변경

- `regStatusName`
- `rsgtDthRgivdYmd`
- `rsgtDthRgivdRsn`

### 공약/정책

- 후보자 공약: 후보자ID 기준, 최대 10개 컬럼형 제공
- 정당정책: 정당명 기준, 최대 10개 컬럼형 제공

### 투표소/선거운영

- 사전투표소, 선거일투표소
- 개표소
- 선거운동기구 설치내역

### 선거 결과

- 투표 결과
- 개표 결과
- 당선인
- 무투표선거구 후보자/당선인
- 사전투표 결과

## OpenAPI에서 확인되지 않은 후보자 상세 정보

다음 항목은 후보자 기본정보 API, 후보자 통합검색 API, 공약 API에서 확인되지 않았다.

- 재산
- 병역
- 납세
- 체납
- 전과
- 후보자 사진
- 상세 공보 PDF 원문

이 항목들은 선거통계시스템 또는 후보자 정보공개 자료의 별도 화면/파일 경로를 추가 검증해야 한다.

## 구현 우선순위 제안

1. `CommonCodeService`로 선거, 구시군, 선거구, 정당, 직업, 학력 코드 수집
2. `PofelcddInfoInqireService/getPofelcddRegistSttusInfoInqire`로 후보자 기본정보 수집
3. `ElecPrmsInfoInqireService/getCnddtElecPrmsInfoInqire`로 후보자 공약 수집
4. `PartyPlcInfoInqireService/getPartyPlcInfoInqire`로 정당정책 수집
5. `CndaRegInvdInqireService`로 사퇴/사망/등록무효 상태 보강
6. `PolplcInfoInqireService2`로 투표소 정보 보강
7. 결과 발표 이후 `VoteXmntckInfoInqireService2`, `WinnerInfoInqireService2` 수집
8. 재산, 병역, 납세, 전과는 별도 수집 경로 검증

