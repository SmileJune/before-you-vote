import { describe, expect, it } from "vitest";
import { mapDbRowsToDataset } from "./db-dataset";

describe("db dataset mapper", () => {
  it("maps normalized PostgreSQL rows into the app dataset contract", () => {
    const dataset = mapDbRowsToDataset({
      regions: [
        {
          id: "seoul-mapo-seogyo",
          slug: "seoul-mapo-seogyo",
          display_name: "서울특별시 마포구",
          sido: "서울특별시",
          sigungu: "마포구",
          eupmyeondong: "",
          notice: "공식 자료 기준"
        }
      ],
      elections: [
        {
          id: "seoul-mayor",
          title: "서울특별시장",
          category: "시·도지사",
          district_name: "서울특별시",
          ballot_name: "시·도지사선거",
          sort_order: 10,
          region_ids: ["seoul-mapo-seogyo"]
        }
      ],
      candidates: [
        {
          id: "seoul-mayor-100157144",
          election_id: "seoul-mayor",
          name: "정원오",
          party_name: "더불어민주당",
          ballot_number: 1,
          sort_order: null,
          job: "정당인",
          education: "한양대학교 도시대학원 박사 수료",
          career: "성동구청장",
          assets_amount_krw: "1000",
          assets_display: "1천원",
          military: "군필",
          tax_paid_amount_krw: "2000",
          tax_paid_display: "2천원",
          tax_arrears_last_five_years_amount_krw: null,
          tax_arrears_last_five_years_display: null,
          tax_arrears_current_amount_krw: "0",
          tax_arrears_current_display: "0원",
          criminal_record_count: 0,
          photo_url: "https://example.com/photo.jpg",
          pamphlet_label: "선거공보",
          pamphlet_url: "https://cdn.nec.go.kr/policy_pdf/example.pdf",
          pamphlet_status: "available",
          pledge_label: "5대공약",
          pledge_url: "https://cdn.nec.go.kr/policy_pdf/pledge.pdf",
          pledge_status: "available",
          disclosure_viewer_url: "https://info.nec.go.kr/electioninfo/candidate_detail_info.xhtml",
          source_label: "중앙선거관리위원회",
          source_url: "https://www.nec.go.kr",
          source_fetched_at: new Date("2026-05-26T00:00:00.000Z"),
          pledge_items: [
            {
              title: "30분 통근도시",
              category: "교통",
              content: "철도망과 버스 노선을 개선합니다.",
              sourceUrl: "https://policy.nec.go.kr/plc/commiment/UELPromisePopup.do",
              fetchedAt: "2026-05-26T00:00:00.000Z"
            }
          ]
        }
      ]
    });

    expect(dataset.regions[0].displayName).toBe("서울특별시 마포구");
    expect(dataset.elections[0].regionIds).toEqual(["seoul-mapo-seogyo"]);
    expect(dataset.candidates[0]).toMatchObject({
      id: "seoul-mayor-100157144",
      electionId: "seoul-mayor",
      name: "정원오",
      assets: { amountKrw: 1000, display: "1천원" },
      pamphletPdf: {
        label: "선거공보",
        status: "available"
      },
      pledgePdf: {
        label: "5대공약",
        status: "available"
      },
      pledgeItems: [
        {
          title: "30분 통근도시",
          category: "교통"
        }
      ],
      source: {
        fetchedAt: "2026-05-26T00:00:00.000Z"
      }
    });
  });
});
