import { describe, expect, it } from "vitest";
import { getPartyColor } from "./party-colors";

describe("party colors", () => {
  it("uses known party brand colors for major parties", () => {
    expect(getPartyColor("더불어민주당")).toMatchObject({ text: "#004EA2" });
    expect(getPartyColor("국민의힘")).toMatchObject({ text: "#E61E2B" });
    expect(getPartyColor("정의당")).toMatchObject({ border: "rgba(255, 204, 0, 0.55)" });
  });

  it("uses neutral colors for independent and unknown parties", () => {
    expect(getPartyColor("무소속")).toEqual(getPartyColor("확인되지않은정당"));
  });
});
