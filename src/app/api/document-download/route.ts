import { NextResponse } from "next/server";
import { parseAllowedDocumentUrl } from "@/domain/document-links";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const source = searchParams.get("url");
  const sourceUrl = parseAllowedDocumentUrl(source);
  const disposition = searchParams.get("download") === "1" ? "attachment" : "inline";

  if (!sourceUrl) {
    return NextResponse.json({ status: "invalid_request" }, { status: 400 });
  }

  const response = await fetch(sourceUrl, {
    headers: {
      Accept: "application/pdf,*/*"
    }
  });

  if (!response.ok || !response.body) {
    return NextResponse.json({ status: "failed" }, { status: 502 });
  }

  const filename = getDocumentFilename(sourceUrl);
  const headers = new Headers({
    "Cache-Control": "public, max-age=86400",
    "Content-Disposition": `${disposition}; filename=\"${filename}\"; filename*=UTF-8''${encodeRFC5987ValueChars(filename)}`,
    "Content-Type": "application/pdf",
    "X-Content-Type-Options": "nosniff"
  });
  const contentLength = response.headers.get("content-length");

  if (contentLength) {
    headers.set("Content-Length", contentLength);
  }

  return new Response(response.body, {
    status: 200,
    headers
  });
}

function getDocumentFilename(url: URL) {
  return decodeURIComponent(url.pathname.split("/").pop() ?? "document.pdf").replace(/[^\w.()-]/g, "_");
}

function encodeRFC5987ValueChars(value: string) {
  return encodeURIComponent(value).replace(/['()*]/g, (character) => `%${character.charCodeAt(0).toString(16).toUpperCase()}`);
}
