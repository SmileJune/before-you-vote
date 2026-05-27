import type { Metadata } from "next";
import Link from "next/link";
import { ExternalLink } from "lucide-react";
import { DocumentPreviewBackLink } from "@/components/document-preview-back-link";
import { DocumentPreviewViewer } from "@/components/document-preview-viewer";
import { getDocumentProxyPath, parseAllowedDocumentUrl } from "@/domain/document-links";

export const metadata: Metadata = {
  title: "문서 미리보기 - 투표전5분",
  robots: {
    index: false,
    follow: false
  }
};

type DocumentPreviewPageProps = {
  searchParams: Promise<{
    title?: string;
    url?: string;
  }>;
};

export default async function DocumentPreviewPage({ searchParams }: DocumentPreviewPageProps) {
  const params = await searchParams;
  const sourceUrl = parseAllowedDocumentUrl(params.url);
  const title = normalizeTitle(params.title);

  if (!sourceUrl) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-paper px-4">
        <div className="w-full max-w-md rounded-md border border-line bg-white p-5 text-center">
          <p className="text-sm font-semibold">문서 주소를 확인할 수 없습니다.</p>
          <Link className="mt-4 inline-flex rounded-md bg-civic px-4 py-2 text-sm font-semibold text-white" href="/">
            돌아가기
          </Link>
        </div>
      </main>
    );
  }

  const documentUrl = getDocumentProxyPath(sourceUrl.toString());
  const downloadUrl = getDocumentProxyPath(sourceUrl.toString(), { download: true });

  return (
    <main className="min-h-screen bg-paper text-ink">
      <header className="sticky top-0 z-20 border-b border-line bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center gap-2 px-3 py-3">
          <DocumentPreviewBackLink />
          <h1 className="min-w-0 flex-1 truncate text-sm font-bold">{title}</h1>
          <a
            aria-label="원본 열기"
            className="rounded-md border border-line p-2"
            href={sourceUrl.toString()}
            rel="noreferrer"
            target="_blank"
          >
            <ExternalLink size={18} />
          </a>
        </div>
      </header>
      <DocumentPreviewViewer documentUrl={documentUrl} downloadUrl={downloadUrl} sourceUrl={sourceUrl.toString()} />
    </main>
  );
}

function normalizeTitle(value: string | undefined) {
  const title = value?.trim();

  if (!title) {
    return "공식 문서";
  }

  return title.slice(0, 80);
}
