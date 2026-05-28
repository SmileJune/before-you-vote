import { describe, expect, it } from "vitest";
import { GET } from "./route";

describe("election detail API route", () => {
  it("rejects unknown election IDs", async () => {
    const response = await GET(new Request("http://localhost/api/election-detail?electionId=unknown"));

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ status: "invalid_request" });
  });

  it("returns only the requested election detail with cache headers", async () => {
    const response = await GET(
      new Request("http://localhost/api/election-detail?electionId=seoul-mapo-seogyo-3-%EC%84%9C%EC%9A%B8%ED%8A%B9%EB%B3%84%EC%8B%9C")
    );
    const detail = await response.json();

    expect(response.status).toBe(200);
    expect(response.headers.get("Cache-Control")).toContain("s-maxage=86400");
    expect(detail.id).toBe("seoul-mapo-seogyo-3-서울특별시");
    expect(detail.candidates.length).toBeGreaterThan(0);
    expect(detail.candidates.every((candidate: { electionId: string }) => candidate.electionId === detail.id)).toBe(true);
  });
});
