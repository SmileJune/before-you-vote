import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { GET } from "./route";

const allowedPdfUrl = "https://cdn.nec.go.kr/policy_pdf/20260603/PDF/PBINFO/4100/document.pdf";

describe("document download API route", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("rejects non-NEC policy PDF URLs without fetching", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    const response = await GET(new Request("http://localhost/api/document-download?url=https://example.com/file.pdf"));

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ status: "invalid_request" });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("proxies an allowed PDF as an inline response", async () => {
    const fetchMock = vi.fn(async () =>
      new Response("pdf-bytes", {
        headers: {
          "content-length": "9",
          "content-type": "application/pdf"
        }
      })
    );
    vi.stubGlobal("fetch", fetchMock);

    const response = await GET(new Request(`http://localhost/api/document-download?url=${encodeURIComponent(allowedPdfUrl)}`));

    expect(response.status).toBe(200);
    expect(await response.text()).toBe("pdf-bytes");
    expect(response.headers.get("Content-Type")).toBe("application/pdf");
    expect(response.headers.get("Content-Length")).toBe("9");
    expect(response.headers.get("Cache-Control")).toBe("public, max-age=86400, s-maxage=604800, stale-while-revalidate=86400");
    expect(response.headers.get("X-Content-Type-Options")).toBe("nosniff");
    expect(response.headers.get("Content-Disposition")).toContain("inline");
    expect(response.headers.get("Content-Disposition")).toContain("document.pdf");
    expect(fetchMock).toHaveBeenCalledWith(new URL(allowedPdfUrl), {
      headers: {
        Accept: "application/pdf,*/*"
      }
    });
  });

  it("switches content disposition for downloads", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response("pdf-bytes")));

    const response = await GET(
      new Request(`http://localhost/api/document-download?download=1&url=${encodeURIComponent(allowedPdfUrl)}`)
    );

    expect(response.status).toBe(200);
    expect(response.headers.get("Content-Disposition")).toContain("attachment");
  });

  it("returns a gateway error when the upstream document request fails", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response(null, { status: 404 })));

    const response = await GET(new Request(`http://localhost/api/document-download?url=${encodeURIComponent(allowedPdfUrl)}`));

    expect(response.status).toBe(502);
    expect(await response.json()).toEqual({ status: "failed" });
  });
});
