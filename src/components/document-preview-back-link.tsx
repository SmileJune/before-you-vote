"use client";

import { ArrowLeft } from "lucide-react";
import type { MouseEvent } from "react";

export const documentPreviewLeaveEventName = "document-preview:leave";

export function DocumentPreviewBackLink({ returnTo }: { returnTo: string | null }) {
  const href = returnTo ?? "/";

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
      return;
    }

    if (returnTo) {
      event.preventDefault();
      window.location.replace(returnTo);
    }
  }

  return (
    <a
      aria-label="돌아가기"
      className="rounded-md border border-line p-2"
      href={href}
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
