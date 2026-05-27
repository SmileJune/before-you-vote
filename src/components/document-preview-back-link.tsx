"use client";

import { ArrowLeft } from "lucide-react";
import type { MouseEvent } from "react";

export const documentPreviewLeaveEventName = "document-preview:leave";

export function DocumentPreviewBackLink() {
  function signalLeave() {
    window.dispatchEvent(new Event(documentPreviewLeaveEventName));
  }

  function handlePointerDown() {
    signalLeave();
  }

  function handleClick(event: MouseEvent<HTMLAnchorElement>) {
    signalLeave();

    if (isSameOriginReferrer()) {
      event.preventDefault();
      window.history.back();
    }
  }

  return (
    // eslint-disable-next-line @next/next/no-html-link-for-pages
    <a
      aria-label="돌아가기"
      className="rounded-md border border-line p-2"
      href="/"
      onClick={handleClick}
      onPointerDown={handlePointerDown}
    >
      <ArrowLeft size={18} />
    </a>
  );
}

function isSameOriginReferrer() {
  if (!document.referrer) {
    return false;
  }

  try {
    return new URL(document.referrer).origin === window.location.origin;
  } catch {
    return false;
  }
}
