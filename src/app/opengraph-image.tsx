import { ImageResponse } from "next/og";

export const alt = "투표전5분 공유 이미지";
export const size = {
  width: 1200,
  height: 630
};
export const contentType = "image/png";

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          alignItems: "center",
          background: "#f7f8fb",
          color: "#1f2933",
          display: "flex",
          height: "100%",
          justifyContent: "center",
          width: "100%"
        }}
      >
        <div
          style={{
            background: "#ffffff",
            border: "2px solid #d9e1ec",
            borderRadius: 28,
            display: "flex",
            flexDirection: "column",
            height: 470,
            justifyContent: "space-between",
            padding: "58px 64px",
            width: 960
          }}
        >
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div
              style={{
                color: "#245c8a",
                fontSize: 34,
                fontWeight: 800,
                letterSpacing: 0
              }}
            >
              투표전5분
            </div>
            <div
              style={{
                fontSize: 82,
                fontWeight: 900,
                letterSpacing: 0,
                lineHeight: 1.12,
                marginTop: 22
              }}
            >
              내 투표지 후보 확인
            </div>
            <div
              style={{
                color: "#526173",
                fontSize: 32,
                fontWeight: 600,
                lineHeight: 1.4,
                marginTop: 30
              }}
            >
              공식 자료 기준으로 후보자와 공약을 같은 항목으로 비교합니다.
            </div>
          </div>
          <div
            style={{
              alignItems: "center",
              borderTop: "2px solid #d9e1ec",
              color: "#526173",
              display: "flex",
              fontSize: 26,
              fontWeight: 700,
              justifyContent: "space-between",
              paddingTop: 28
            }}
          >
            <span>후보 추천이나 점수화는 하지 않습니다.</span>
            <span>before-you-vote.vercel.app</span>
          </div>
        </div>
      </div>
    ),
    size
  );
}
