# 선관위 민감 공개자료 및 PDF 수집 가능성 검토

확인일: 2026-05-25

검토 대상:

- 재산
- 병역
- 납세
- 체납
- 전과
- 후보자 사진
- 선거공보 PDF
- 후보자 공약 PDF

## 결론

OpenAPI만으로는 재산, 병역, 납세, 체납, 전과의 상세 원문을 충분히 수집할 수 없다. 다만 선거통계시스템(`info.nec.go.kr`)의 후보자 상세 페이지와 내부 JSON 엔드포인트에서 요약값과 스캔 문서 메타데이터를 확인할 수 있다.

후보자 사진, 후보자공약 PDF, 5대공약 PDF는 CDN 경로가 확인되며 직접 수집 가능하다. 선거공보 PDF는 후보자공약 JSON에 파일 경로가 이미 내려오지만, 2026-05-25 확인 시점에는 CDN 직접 접근이 404로 응답했다. 정책공약마당 페이지에는 선거공보 파일 공개 예정일이 2026-05-26으로 표시되어 있다.

## 항목별 판단

| 항목 | 수집 가능성 | 확인된 출처 | 구현 판단 |
| --- | --- | --- | --- |
| 재산 | 가능 | `info.nec.go.kr` 후보자 상세 HTML, 스캔자료 JSON `gubun=2` | 요약값은 HTML 파싱, 상세 원문은 스캔자료 메타데이터 저장 후 뷰어 링크 생성 |
| 병역 | 가능 | `info.nec.go.kr` 후보자 상세 HTML, 스캔자료 JSON `gubun=4` | 요약값은 HTML 파싱, 상세 원문은 스캔자료 메타데이터 저장 |
| 납세 | 가능 | `info.nec.go.kr` 후보자 상세 HTML, 스캔자료 JSON `gubun=3` | 납부액은 HTML 파싱, 상세 원문은 스캔자료 메타데이터 저장 |
| 체납 | 가능 | `info.nec.go.kr` 후보자 상세 HTML | 최근 5년간 체납액, 현체납액이 후보자 상세에 표시됨 |
| 전과 | 가능 | `info.nec.go.kr` 후보자 상세 HTML, 스캔자료 JSON `gubun=5` | 건수는 HTML 파싱, 상세 원문은 스캔자료 메타데이터 저장 |
| 후보자 사진 | 가능 | `info.nec.go.kr` HTML, `cdn.nec.go.kr/photo_...` | 원본/썸네일 CDN URL 저장 및 필요 시 다운로드 가능 |
| 선거공보 PDF | 부분 가능 | `policy.nec.go.kr` 후보자공약 JSON, `cdn.nec.go.kr/policy_pdf/.../PBINFO/...` | 파일 경로는 수집 가능. 2026-05-25 기준 CDN은 404. 공개일 이후 재검증 필요 |
| 후보자 공약 PDF | 가능 | `policy.nec.go.kr` 후보자공약 JSON, `cdn.nec.go.kr/policy_pdf/...` | 5대공약 PDF는 2026-05-25 기준 직접 다운로드 200 확인 |

## 후보자 상세 공개자료

후보자 상세 페이지:

```text
https://info.nec.go.kr/electioninfo/candidate_detail_info.xhtml?electionId=0020260603&huboId={huboId}
```

예시 확인 후보:

- 선거: 제9회 전국동시지방선거
- 선거일: 2026-06-03
- 후보: 서울특별시장선거 정원오
- `huboId`: `100157144`

후보자 상세 HTML에서 확인된 요약 항목:

- 재산신고액(천원)
- 병역신고사항(본인)
- 납부액(천원)
- 최근 5년간 체납액(천원)
- 현체납액(천원)
- 전과기록유무(건수)
- 입후보 횟수

예시 값:

| 항목 | 값 |
| --- | --- |
| 재산신고액(천원) | `1,823,897` |
| 병역신고사항(본인) | `군복무를 마친사람` |
| 납부액(천원) | `84,423` |
| 최근 5년간 체납액(천원) | `0` |
| 현체납액(천원) | `0` |
| 전과기록유무(건수) | `2건` |

상세 원문 스캔자료 JSON:

```text
GET https://info.nec.go.kr/electioninfo/candidate_detail_scanSearchJson.json
```

Query:

- `electionId`: `0020260603`
- `huboId`: 후보자 ID
- `statementId`: `CPRI03_candidate_scanSearch`
- `gubun`: 자료 구분

자료 구분:

| gubun | 의미 |
| --- | --- |
| `1` | 학력 |
| `2` | 재산 |
| `3` | 납세 |
| `4` | 병역 |
| `5` | 전과 |
| `8` | 공직선거경력 |

응답 필드 예시:

- `HUBOID`
- `HBJNAME`
- `JDNAME`
- `SG_NAME`
- `SGGNAME`
- `HBJGIHO`
- `SAJINPATH`
- `FILEPATH`
- `FILE_GUBUN`
- `DISP_SEQ`

예시 `FILEPATH`:

```text
20260603/open/Gsg1100/Hb100157144/jaesan/20260513192617764_1.tif
20260603/open/Gsg1100/Hb100157144/segum/20260513192618152_6.tif
20260603/open/Gsg1100/Hb100157144/byeonguk/20260513192617971_4.tif
20260603/open/Gsg1100/Hb100157144/junkwa/20260305093819586_1.tif
```

상세자료 PDF 뷰어 흐름:

1. `FILEPATH`의 `.tif`를 `.PDF`로 변환한다.
2. `/unielec_pdf_file/` prefix를 붙인다.
3. `https://info.nec.go.kr/electioninfo/show_pdf_viewer.xhtml`에 POST한다.
4. 응답에서 `docviewer.nec.go.kr/SynapDocViewServer/view/{token}` 뷰어 URL을 얻는다.

주의:

- `/unielec_pdf_file/...PDF` 원본 URL은 단순 직접 접근 시 에러 페이지로 리다이렉트되었다.
- 따라서 MVP에서는 원본 PDF 파일 다운로드보다 `FILEPATH`, 변환 PDF 경로, 뷰어 URL, 수집 시각을 저장하는 방식이 현실적이다.

## 후보자 사진

후보자 상세 HTML 및 스캔자료 JSON의 `SAJINPATH`에서 사진 경로를 확인할 수 있다.

예시:

```text
https://cdn.nec.go.kr/photo_20260603/Gsg1100/Hb100157144/gicho/thumbnail.100157144.JPG
```

2026-05-25 HEAD 확인 결과:

- HTTP 200
- `content-type: image/jpeg`
- `access-control-allow-origin: *`

구현 판단:

- 후보자별 원본 URL과 썸네일 URL을 저장한다.
- 서비스 화면에서는 CDN URL을 직접 사용할 수 있다.
- 장기 보존이나 변경 이력 관리를 위해 별도 저장소에 캐싱할지는 정책적으로 결정한다.

## 후보자공약 및 선거공보 PDF

후보자공약 페이지:

```text
https://policy.nec.go.kr/plc/commiment/initUCACommiment.do?menuId=CNDDT25
```

후보자공약 목록 JSON:

```text
POST https://policy.nec.go.kr/plc/commiment/initUCACommimentList.do
```

예시 요청:

- `sgId`: `20260603`
- `subSgId`: `320260603`
- `hRegionId`: `1100`
- `hGuId`: 빈 값
- `hSggId`: 빈 값
- `sgTypecode`: `3`
- `pageIndex`: `1`
- `elecEndYn`: `N`

예시 응답 필드:

- `sgId`
- `subSgName`
- `sggname`
- `jdid`
- `jdname`
- `huboid`
- `hbjname`
- `hbjgiho`
- `hbjjikup`
- `hbjhakruk`
- `filename`: 후보자 썸네일 사진 경로
- `fileinfo`: 선거공보, 선거공약서, 5대공약 PDF 메타데이터
- `fileDispYn`

예시 `fileinfo`:

```text
선거공보||20260603/PDF/PBINFO/1100/003_100157144_20260520_1.pdf||||1||HEIGHT||Y||00||00,
선거공약서||||||0||HEIGHT||Y||||00,
5대공약||20260603/PDF/P5_PRMS_PUB/1100/001_100157144_20260516_1.pdf||11551||1||HEIGHT||Y||00||01
```

CDN PDF URL 생성 규칙:

```text
https://cdn.nec.go.kr/policy_pdf/{fileinfo의 PDF 경로}
```

예시:

```text
https://cdn.nec.go.kr/policy_pdf/20260603/PDF/P5_PRMS_PUB/1100/001_100157144_20260516_1.pdf
```

2026-05-25 확인 결과:

| 파일 | URL 유형 | HTTP 결과 | 판단 |
| --- | --- | --- | --- |
| 후보자 5대공약 PDF | `P5_PRMS_PUB` | 200 | 직접 수집 가능 |
| 선거공보 PDF | `PBINFO` | 404 | 경로는 내려오지만 아직 공개 전으로 판단 |

정책공약마당 후보자공약 페이지에는 선거공보 파일이 2026-05-26부터 공개 예정이라고 표시되어 있다. 따라서 선거공보는 2026-05-26 이후 같은 CDN 경로로 재검증해야 한다.

## 구현 권장안

1. OpenAPI 후보자 목록에서 `huboid`, 후보자명, 정당, 선거구 기본값을 수집한다.
2. `info.nec.go.kr` 후보자 상세 HTML을 보강 수집하여 재산, 병역, 납세, 체납, 전과 요약값을 저장한다.
3. `candidate_detail_scanSearchJson.json`으로 재산, 병역, 납세, 전과 상세 원문 메타데이터를 저장한다.
4. 상세 원문 PDF는 원본 파일 직접 저장을 1차 목표로 두지 말고, 공식 뷰어 링크 또는 파일 메타데이터 중심으로 저장한다.
5. `policy.nec.go.kr` 후보자공약 JSON에서 후보자 사진, 선거공보 PDF, 5대공약 PDF 경로를 저장한다.
6. `cdn.nec.go.kr` HEAD 요청으로 실제 공개 여부를 검증한 뒤 다운로드 가능 상태만 `available`로 표시한다.
7. 모든 수집 데이터에 `source_url`, `source_endpoint`, `fetched_at`, `raw_payload`를 저장한다.

## 주의사항

후보자 정보공개자료는 선거권 행사를 위한 공개자료다. 서비스에서는 다음 원칙을 지켜야 한다.

- 공식 출처와 수집 시각을 항상 표시한다.
- 후보자별 동일한 항목과 동일한 UI 구조를 사용한다.
- 전과, 재산, 체납 등 민감 항목은 점수화하거나 강조 순위를 만들지 않는다.
- 원문 자료 또는 공식 뷰어 링크를 함께 제공한다.
- 공개 기간과 접근 가능성이 바뀔 수 있으므로 원본 응답과 상태 코드를 기록한다.
