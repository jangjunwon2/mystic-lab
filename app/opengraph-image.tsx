import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "Mystic Lab — Professional Magic Shop";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OGImage() {
  return new ImageResponse(
    (
      <div
        style={{
          background: "linear-gradient(135deg, #0D0D1A 0%, #1A1A2E 50%, #0D0D1A 100%)",
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "serif",
        }}
      >
        <div
          style={{
            position: "absolute",
            width: 600,
            height: 600,
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(124,58,237,0.15) 0%, transparent 70%)",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
          }}
        />
        <div
          style={{
            fontSize: 20,
            color: "#A855F7",
            letterSpacing: "0.3em",
            textTransform: "uppercase",
            marginBottom: 24,
            display: "flex",
          }}
        >
          ✦ MYSTIC LAB ✦
        </div>
        <div
          style={{
            fontSize: 64,
            fontWeight: 900,
            color: "#F0E6FF",
            textAlign: "center",
            lineHeight: 1.1,
            maxWidth: 900,
            display: "flex",
          }}
        >
          Professional Magic Shop
        </div>
        <div
          style={{
            fontSize: 24,
            color: "#9CA3AF",
            marginTop: 24,
            textAlign: "center",
            maxWidth: 700,
            display: "flex",
          }}
        >
          Premium props & electronic devices for magicians worldwide
        </div>
        <div
          style={{
            position: "absolute",
            bottom: 40,
            fontSize: 16,
            color: "#4B5563",
            display: "flex",
          }}
        >
          mystic-lab.vercel.app
        </div>
      </div>
    ),
    { ...size }
  );
}
