import type { Metadata, Viewport } from "next";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://before-you-vote.vercel.app"),
  title: "BeforeYouVote - 투표전5분",
  description: "투표 전 내 지역 후보자와 공식 자료를 빠르게 확인합니다.",
  icons: {
    icon: [
      { url: "/app-icon.svg", type: "image/svg+xml" },
      { url: "/app-icon-512.png", sizes: "512x512", type: "image/png" }
    ],
    apple: [{ url: "/app-icon-512.png", sizes: "512x512", type: "image/png" }]
  },
  openGraph: {
    title: "BeforeYouVote - 투표전5분",
    description: "투표 전 내 지역 후보자와 공식 자료를 빠르게 확인합니다.",
    url: "https://before-you-vote.vercel.app",
    siteName: "투표전5분",
    locale: "ko_KR",
    type: "website",
    images: [
      {
        url: "/opengraph-image",
        width: 1200,
        height: 630,
        alt: "투표전5분 공유 이미지"
      }
    ]
  },
  twitter: {
    card: "summary_large_image",
    title: "BeforeYouVote - 투표전5분",
    description: "투표 전 내 지역 후보자와 공식 자료를 빠르게 확인합니다.",
    images: ["/twitter-image"]
  }
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body>
        {children}
        <Analytics />
      </body>
    </html>
  );
}
