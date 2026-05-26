import type { Candidate, Dataset } from "./types";

const fetchedAt = "2026-05-25T09:10:00+09:00";

const seoulMayorSource = {
  label: "중앙선거관리위원회 선거통계시스템",
  url: "https://info.nec.go.kr/electioninfo/candidate_detail_info.xhtml?electionId=0020260603",
  fetchedAt
};

const policySource = {
  label: "중앙선거관리위원회 정책공약마당",
  url: "https://policy.nec.go.kr/plc/commiment/initUCACommiment.do?menuId=CNDDT25",
  fetchedAt
};

export const sampleDataset: Dataset = {
  regions: [
    {
      id: "seoul-mapo-seogyo",
      slug: "seoul-mapo-seogyo",
      displayName: "서울특별시 마포구 서교동",
      sido: "서울특별시",
      sigungu: "마포구",
      eupmyeondong: "서교동",
      notice: "실제 투표 지역은 주민등록상 주소 기준입니다."
    }
  ],
  elections: [
    {
      id: "seoul-mayor",
      regionIds: ["seoul-mapo-seogyo"],
      title: "서울특별시장",
      category: "시·도지사",
      districtName: "서울특별시",
      ballotName: "시·도지사선거",
      sortOrder: 10
    },
    {
      id: "seoul-education-superintendent",
      regionIds: ["seoul-mapo-seogyo"],
      title: "서울특별시교육감",
      category: "교육감",
      districtName: "서울특별시",
      ballotName: "교육감선거",
      sortOrder: 20
    },
    {
      id: "mapo-mayor",
      regionIds: ["seoul-mapo-seogyo"],
      title: "마포구청장",
      category: "구·시·군의 장",
      districtName: "마포구",
      ballotName: "구·시·군의 장선거",
      sortOrder: 30
    }
  ],
  candidates: [
    candidate({
      id: "100157144",
      name: "정원오",
      partyName: "더불어민주당",
      ballotNumber: 1,
      job: "정당인",
      education: "한양대학교 도시대학원 도시개발경영전공 박사 수료",
      career: "전 성동구청장",
      assetsDisplay: "18.2억",
      assetsKrw: 1823897000,
      military: "군필",
      taxPaidDisplay: "8,442만원",
      taxPaidKrw: 84423000,
      currentArrearsDisplay: "0원",
      currentArrearsKrw: 0,
      criminalRecordCount: 2,
      photoUrl: "https://cdn.nec.go.kr/photo_20260603/Gsg1100/Hb100157144/gicho/thumbnail.100157144.JPG",
      pamphletStatus: "pending",
      pledgeStatus: "available",
      pledgeUrl: "https://cdn.nec.go.kr/policy_pdf/20260603/PDF/P5_PRMS_PUB/1100/001_100157144_20260516_1.pdf"
    }),
    candidate({
      id: "100162984",
      name: "오세훈",
      partyName: "국민의힘",
      ballotNumber: 2,
      job: "서울특별시장",
      education: "고려대학교 대학원 법학과 졸업(법학박사)",
      career: "현 서울특별시장",
      assetsDisplay: "자료 확인 필요",
      assetsKrw: 0,
      military: "공식자료 확인",
      taxPaidDisplay: "공식자료 확인",
      taxPaidKrw: 0,
      currentArrearsDisplay: "공식자료 확인",
      currentArrearsKrw: 0,
      criminalRecordCount: null,
      photoUrl: "https://cdn.nec.go.kr/photo_20260603/Gsg1100/Hb100162984/gicho/thumbnail.100162984.JPG",
      pamphletStatus: "pending",
      pledgeStatus: "available",
      pledgeUrl: "https://cdn.nec.go.kr/policy_pdf/20260603/PDF/P5_PRMS_PUB/1100/001_100162984_20260516_1.pdf"
    }),
    candidate({
      id: "100158541",
      name: "김정철",
      partyName: "개혁신당",
      ballotNumber: 4,
      job: "변호사",
      education: "고려대학교 대학원 졸업(법학박사)",
      career: "변호사",
      assetsDisplay: "공식자료 확인",
      assetsKrw: 0,
      military: "공식자료 확인",
      taxPaidDisplay: "공식자료 확인",
      taxPaidKrw: 0,
      currentArrearsDisplay: "공식자료 확인",
      currentArrearsKrw: 0,
      criminalRecordCount: null,
      photoUrl: "https://cdn.nec.go.kr/photo_20260603/Gsg1100/Hb100158541/gicho/thumbnail.100158541.JPG",
      pamphletStatus: "pending",
      pledgeStatus: "available",
      pledgeUrl: "https://cdn.nec.go.kr/policy_pdf/20260603/PDF/P5_PRMS_PUB/1100/001_100158541_20260516_1.pdf"
    }),
    candidate({
      id: "100162632",
      name: "유지혜",
      partyName: "여성의당",
      ballotNumber: 5,
      job: "정당인",
      education: "원광디지털대학교 한국문화학부 한국복식과학학과 졸업",
      career: "정당인",
      assetsDisplay: "공식자료 확인",
      assetsKrw: 0,
      military: "비대상/공식자료 확인",
      taxPaidDisplay: "공식자료 확인",
      taxPaidKrw: 0,
      currentArrearsDisplay: "공식자료 확인",
      currentArrearsKrw: 0,
      criminalRecordCount: null,
      photoUrl: "https://cdn.nec.go.kr/photo_20260603/Gsg1100/Hb100162632/gicho/thumbnail.100162632.JPG",
      pamphletStatus: "pending",
      pledgeStatus: "available",
      pledgeUrl: "https://cdn.nec.go.kr/policy_pdf/20260603/PDF/P5_PRMS_PUB/1100/001_100162632_20260516_1.pdf"
    }),
    candidate({
      id: "100162642",
      name: "이강산",
      partyName: "자유통일당",
      ballotNumber: 6,
      job: "정당인",
      education: "서울대학교 경영전문대학원 경영학과 졸업(석사)",
      career: "정당인",
      assetsDisplay: "공식자료 확인",
      assetsKrw: 0,
      military: "공식자료 확인",
      taxPaidDisplay: "공식자료 확인",
      taxPaidKrw: 0,
      currentArrearsDisplay: "공식자료 확인",
      currentArrearsKrw: 0,
      criminalRecordCount: null,
      photoUrl: "https://cdn.nec.go.kr/photo_20260603/Gsg1100/Hb100162642/gicho/thumbnail.100162642.JPG",
      pamphletStatus: "pending",
      pledgeStatus: "available",
      pledgeUrl: "https://cdn.nec.go.kr/policy_pdf/20260603/PDF/P5_PRMS_PUB/1100/001_100162642_20260516_1.pdf"
    }),
    candidate({
      id: "100162720",
      name: "권영국",
      partyName: "정의당",
      ballotNumber: 7,
      job: "정당인",
      education: "서울대학교 공과대학 금속공과 졸업",
      career: "정당인",
      assetsDisplay: "공식자료 확인",
      assetsKrw: 0,
      military: "공식자료 확인",
      taxPaidDisplay: "공식자료 확인",
      taxPaidKrw: 0,
      currentArrearsDisplay: "공식자료 확인",
      currentArrearsKrw: 0,
      criminalRecordCount: null,
      photoUrl: "https://cdn.nec.go.kr/photo_20260603/Gsg1100/Hb100162720/gicho/thumbnail.100162720.JPG",
      pamphletStatus: "pending",
      pledgeStatus: "available",
      pledgeUrl: "https://cdn.nec.go.kr/policy_pdf/20260603/PDF/P5_PRMS_PUB/1100/001_100162720_20260516_1.pdf"
    }),
    candidate({
      electionId: "seoul-education-superintendent",
      id: "edu-001",
      name: "강신만",
      partyName: "무소속",
      ballotNumber: 1,
      job: "교육자",
      education: "서울교육대학교 졸업",
      career: "전 초등학교 교장",
      assetsDisplay: "공식자료 확인",
      assetsKrw: 0,
      military: "공식자료 확인",
      taxPaidDisplay: "공식자료 확인",
      taxPaidKrw: 0,
      currentArrearsDisplay: "공식자료 확인",
      currentArrearsKrw: 0,
      criminalRecordCount: null,
      photoUrl: "https://cdn.nec.go.kr/photo_20260603/Gsg1100/Hb100157144/gicho/thumbnail.100157144.JPG",
      pamphletStatus: "pending",
      pledgeStatus: "missing",
      pledgeUrl: "#"
    }),
    candidate({
      electionId: "seoul-education-superintendent",
      id: "edu-002",
      name: "조희연",
      partyName: "무소속",
      ballotNumber: 2,
      job: "교육감",
      education: "연세대학교 대학원 졸업",
      career: "전 서울특별시교육감",
      assetsDisplay: "공식자료 확인",
      assetsKrw: 0,
      military: "공식자료 확인",
      taxPaidDisplay: "공식자료 확인",
      taxPaidKrw: 0,
      currentArrearsDisplay: "공식자료 확인",
      currentArrearsKrw: 0,
      criminalRecordCount: null,
      photoUrl: "https://cdn.nec.go.kr/photo_20260603/Gsg1100/Hb100162984/gicho/thumbnail.100162984.JPG",
      pamphletStatus: "pending",
      pledgeStatus: "missing",
      pledgeUrl: "#"
    }),
    candidate({
      electionId: "mapo-mayor",
      id: "mapo-001",
      name: "유동균",
      partyName: "더불어민주당",
      ballotNumber: 1,
      job: "정당인",
      education: "공식자료 확인",
      career: "전 마포구청장",
      assetsDisplay: "공식자료 확인",
      assetsKrw: 0,
      military: "공식자료 확인",
      taxPaidDisplay: "공식자료 확인",
      taxPaidKrw: 0,
      currentArrearsDisplay: "공식자료 확인",
      currentArrearsKrw: 0,
      criminalRecordCount: null,
      photoUrl: "https://cdn.nec.go.kr/photo_20260603/Gsg1100/Hb100158541/gicho/thumbnail.100158541.JPG",
      pamphletStatus: "pending",
      pledgeStatus: "missing",
      pledgeUrl: "#"
    }),
    candidate({
      electionId: "mapo-mayor",
      id: "mapo-002",
      name: "박강수",
      partyName: "국민의힘",
      ballotNumber: 2,
      job: "마포구청장",
      education: "공식자료 확인",
      career: "현 마포구청장",
      assetsDisplay: "공식자료 확인",
      assetsKrw: 0,
      military: "공식자료 확인",
      taxPaidDisplay: "공식자료 확인",
      taxPaidKrw: 0,
      currentArrearsDisplay: "공식자료 확인",
      currentArrearsKrw: 0,
      criminalRecordCount: null,
      photoUrl: "https://cdn.nec.go.kr/photo_20260603/Gsg1100/Hb100162632/gicho/thumbnail.100162632.JPG",
      pamphletStatus: "pending",
      pledgeStatus: "missing",
      pledgeUrl: "#"
    })
  ]
};

function candidate(input: {
  electionId?: string;
  id: string;
  name: string;
  partyName: string;
  ballotNumber: number;
  job: string;
  education: string;
  career: string;
  assetsDisplay: string;
  assetsKrw: number;
  military: string;
  taxPaidDisplay: string;
  taxPaidKrw: number;
  currentArrearsDisplay: string;
  currentArrearsKrw: number;
  criminalRecordCount: number | null;
  photoUrl: string;
  pamphletStatus: "available" | "pending" | "missing";
  pledgeStatus: "available" | "pending" | "missing";
  pledgeUrl: string;
}): Candidate {
  return {
    id: input.id,
    electionId: input.electionId ?? "seoul-mayor",
    name: input.name,
    partyName: input.partyName,
    ballotNumber: input.ballotNumber,
    job: input.job,
    education: input.education,
    career: input.career,
    assets: { amountKrw: input.assetsKrw, display: input.assetsDisplay },
    military: input.military,
    taxPaid: { amountKrw: input.taxPaidKrw, display: input.taxPaidDisplay },
    taxArrearsLastFiveYears: { amountKrw: input.currentArrearsKrw, display: input.currentArrearsDisplay },
    taxArrearsCurrent: { amountKrw: input.currentArrearsKrw, display: input.currentArrearsDisplay },
    criminalRecordCount: input.criminalRecordCount,
    photoUrl: input.photoUrl,
    pamphletPdf: {
      label: "선거공보",
      url: `https://cdn.nec.go.kr/policy_pdf/20260603/PDF/PBINFO/1100/003_${input.id}_20260520_1.pdf`,
      status: input.pamphletStatus
    },
    pledgePdf: {
      label: "5대공약",
      url: input.pledgeUrl,
      status: input.pledgeStatus
    },
    disclosureViewerUrl: `https://info.nec.go.kr/electioninfo/candidate_detail_info.xhtml?electionId=0020260603&huboId=${input.id}`,
    source: input.pledgeStatus === "available" ? policySource : seoulMayorSource
  };
}
