import { describe, expect, it } from "vitest";
import { getDocumentPreviewPath, getDocumentProxyPath, parseAllowedDocumentUrl } from "./document-links";

const allowedPdfUrl = "https://cdn.nec.go.kr/policy_pdf/20260603/PDF/PBINFO/4100/003_100163471_20260523_1.pdf";

describe("document links", () => {
  it("allows only NEC policy PDF URLs", () => {
    expect(parseAllowedDocumentUrl(allowedPdfUrl)?.toString()).toBe(allowedPdfUrl);
    expect(parseAllowedDocumentUrl("http://cdn.nec.go.kr/policy_pdf/file.pdf")).toBeNull();
    expect(parseAllowedDocumentUrl("https://example.com/policy_pdf/file.pdf")).toBeNull();
    expect(parseAllowedDocumentUrl("https://cdn.nec.go.kr/other/file.pdf")).toBeNull();
    expect(parseAllowedDocumentUrl("https://cdn.nec.go.kr/policy_pdf/file.txt")).toBeNull();
    expect(parseAllowedDocumentUrl("not-a-url")).toBeNull();
  });

  it("builds a preview path with an encoded return destination", () => {
    const path = getDocumentPreviewPath(
      allowedPdfUrl,
      "공보",
      "/?region=gyeonggi-hwaseong-dongtan&area=gyeonggi-hwaseong-dongtan-%EB%8F%99%ED%83%845%EB%8F%99"
    );
    const url = new URL(path, "http://localhost");

    expect(url.pathname).toBe("/document-preview");
    expect(url.searchParams.get("url")).toBe(allowedPdfUrl);
    expect(url.searchParams.get("title")).toBe("공보");
    expect(url.searchParams.get("returnTo")).toBe(
      "/?region=gyeonggi-hwaseong-dongtan&area=gyeonggi-hwaseong-dongtan-%EB%8F%99%ED%83%845%EB%8F%99"
    );
  });

  it("builds inline and download proxy paths", () => {
    expect(getDocumentProxyPath(allowedPdfUrl)).toBe(
      `/api/document-download?url=${encodeURIComponent(allowedPdfUrl)}`
    );
    expect(getDocumentProxyPath(allowedPdfUrl, { download: true })).toBe(
      `/api/document-download?url=${encodeURIComponent(allowedPdfUrl)}&download=1`
    );
  });
});
