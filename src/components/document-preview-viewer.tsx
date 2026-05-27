"use client";

import { AlertCircle, Download, Loader2 } from "lucide-react";
import { useEffect, useLayoutEffect, useRef, useState } from "react";

type PDFDocumentProxy = import("pdfjs-dist").PDFDocumentProxy;

type PdfLoadState =
  | { status: "loading" }
  | { status: "ready"; pdf: PDFDocumentProxy; pageCount: number }
  | { status: "error"; message: string };

type DocumentPreviewViewerProps = {
  documentUrl: string;
  downloadUrl: string;
  sourceUrl: string;
};

export function DocumentPreviewViewer({ documentUrl, downloadUrl, sourceUrl }: DocumentPreviewViewerProps) {
  const [state, setState] = useState<PdfLoadState>({ status: "loading" });

  useEffect(() => {
    let cancelled = false;
    let loadingTask: { destroy: () => Promise<void>; promise: Promise<PDFDocumentProxy> } | null = null;

    async function loadPdf() {
      try {
        const pdfjs = await import("pdfjs-dist");

        pdfjs.GlobalWorkerOptions.workerSrc = new URL("pdfjs-dist/build/pdf.worker.min.mjs", import.meta.url).toString();
        loadingTask = pdfjs.getDocument({ url: documentUrl });

        const pdf = await loadingTask.promise;

        if (cancelled) {
          await pdf.destroy();
          return;
        }

        setState({ status: "ready", pdf, pageCount: pdf.numPages });
      } catch {
        if (!cancelled) {
          setState({ status: "error", message: "문서를 불러오지 못했습니다." });
        }
      }
    }

    void loadPdf();

    return () => {
      cancelled = true;
      void loadingTask?.destroy();
    };
  }, [documentUrl]);

  if (state.status === "loading") {
    return (
      <div className="flex min-h-[70vh] items-center justify-center px-4 text-muted">
        <Loader2 className="mr-2 animate-spin" size={18} />
        문서 준비 중
      </div>
    );
  }

  if (state.status === "error") {
    return (
      <div className="mx-auto flex min-h-[70vh] max-w-md flex-col items-center justify-center gap-4 px-4 text-center">
        <AlertCircle className="text-red-600" size={28} />
        <p className="text-sm font-semibold">{state.message}</p>
        <div className="flex w-full gap-2 text-sm font-semibold">
          <a className="flex-1 rounded-md bg-civic px-3 py-2 text-white" href={downloadUrl}>
            다운로드
          </a>
          <a className="flex-1 rounded-md border border-line px-3 py-2" href={sourceUrl} rel="noreferrer" target="_blank">
            원본 열기
          </a>
        </div>
      </div>
    );
  }

  return (
    <section className="mx-auto max-w-5xl px-3 py-4">
      <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <p className="rounded-md border border-line bg-white px-3 py-2 text-xs leading-5 text-muted">
          문서가 깨져 보이면 원본 열기나 PDF 다운로드로 확인하세요.
        </p>
        <a className="inline-flex items-center gap-1 rounded-md border border-line bg-white px-3 py-2 text-xs font-semibold" href={downloadUrl}>
          <Download size={14} />
          PDF
        </a>
      </div>
      <div className="space-y-4">
        {Array.from({ length: state.pageCount }, (_, index) => (
          <PdfPageCanvas key={index + 1} pageNumber={index + 1} pdf={state.pdf} />
        ))}
      </div>
    </section>
  );
}

function PdfPageCanvas({ pdf, pageNumber }: { pdf: PDFDocumentProxy; pageNumber: number }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [containerWidth, setContainerWidth] = useState(0);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");

  useLayoutEffect(() => {
    const container = containerRef.current;

    if (!container) {
      return;
    }

    const updateWidth = () => setContainerWidth(Math.floor(container.clientWidth));
    const resizeObserver = new ResizeObserver(updateWidth);

    updateWidth();
    resizeObserver.observe(container);

    return () => resizeObserver.disconnect();
  }, []);

  useEffect(() => {
    if (containerWidth <= 0) {
      return;
    }

    let cancelled = false;
    let renderTask: { cancel: () => void; promise: Promise<unknown> } | null = null;

    async function renderPage() {
      try {
        const canvas = canvasRef.current;

        if (!canvas) {
          return;
        }

        setStatus("loading");

        const page = await pdf.getPage(pageNumber);
        const baseViewport = page.getViewport({ scale: 1 });
        const cssWidth = Math.min(containerWidth, 920);
        const viewport = page.getViewport({ scale: cssWidth / baseViewport.width });
        const outputScale = Math.min(window.devicePixelRatio || 1, 2);
        const context = canvas.getContext("2d");

        if (!context) {
          throw new Error("Canvas context is not available.");
        }

        canvas.width = Math.floor(viewport.width * outputScale);
        canvas.height = Math.floor(viewport.height * outputScale);
        canvas.style.width = `${Math.floor(viewport.width)}px`;
        canvas.style.height = `${Math.floor(viewport.height)}px`;
        context.setTransform(outputScale, 0, 0, outputScale, 0, 0);
        context.clearRect(0, 0, viewport.width, viewport.height);

        renderTask = page.render({ canvasContext: context, viewport });
        await renderTask.promise;

        if (!cancelled) {
          setStatus("ready");
        }
      } catch {
        if (!cancelled) {
          setStatus("error");
        }
      }
    }

    void renderPage();

    return () => {
      cancelled = true;
      renderTask?.cancel();
    };
  }, [containerWidth, pageNumber, pdf]);

  return (
    <div ref={containerRef} className="relative flex min-h-32 justify-center rounded-md bg-white shadow-sm ring-1 ring-line">
      {status === "loading" ? (
        <div className="absolute inset-0 flex items-center justify-center text-xs font-semibold text-muted">
          <Loader2 className="mr-2 animate-spin" size={14} />
          {pageNumber}
        </div>
      ) : null}
      {status === "error" ? (
        <div className="flex min-h-32 items-center justify-center p-4 text-xs font-semibold text-red-600">
          {pageNumber}쪽을 표시하지 못했습니다.
        </div>
      ) : (
        <canvas ref={canvasRef} aria-label={`${pageNumber}쪽`} className="max-w-full" />
      )}
    </div>
  );
}
