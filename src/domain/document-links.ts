const allowedDocumentHost = "cdn.nec.go.kr";
const allowedDocumentPathPrefix = "/policy_pdf/";

export function parseAllowedDocumentUrl(value: string | null | undefined) {
  if (!value) {
    return null;
  }

  try {
    const url = new URL(value);

    if (url.protocol !== "https:" || url.hostname !== allowedDocumentHost) {
      return null;
    }

    if (!url.pathname.startsWith(allowedDocumentPathPrefix) || !url.pathname.endsWith(".pdf")) {
      return null;
    }

    return url;
  } catch {
    return null;
  }
}

export function getDocumentProxyPath(url: string, options: { download?: boolean } = {}) {
  const params = new URLSearchParams({ url });

  if (options.download) {
    params.set("download", "1");
  }

  return `/api/document-download?${params.toString()}`;
}

export function getDocumentPreviewPath(url: string, title: string, returnTo?: string) {
  const params = new URLSearchParams({ url, title });

  if (returnTo) {
    params.set("returnTo", returnTo);
  }

  return `/document-preview?${params.toString()}`;
}
