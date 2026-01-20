import { ImageResponse } from "next/og";

export const runtime = "edge";

export const alt = "ZenFlow - Professional Tools for Creators";
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = "image/png";

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#0a0a0a",
          backgroundImage:
            "radial-gradient(circle at 25px 25px, #1a1a1a 2%, transparent 0%), radial-gradient(circle at 75px 75px, #1a1a1a 2%, transparent 0%)",
          backgroundSize: "100px 100px",
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <h1
            style={{
              fontSize: 72,
              fontWeight: 700,
              color: "#ffffff",
              marginBottom: 16,
              letterSpacing: "-0.02em",
            }}
          >
            ZenFlow
          </h1>
          <p
            style={{
              fontSize: 32,
              color: "#a1a1aa",
              marginTop: 0,
            }}
          >
            Professional Tools for Creators
          </p>
          <div
            style={{
              display: "flex",
              gap: 24,
              marginTop: 48,
            }}
          >
            {["Timer", "Prompter", "VOG"].map((tool) => (
              <div
                key={tool}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  backgroundColor: "#18181b",
                  borderRadius: 12,
                  padding: "16px 32px",
                  border: "1px solid #27272a",
                }}
              >
                <span style={{ color: "#ffffff", fontSize: 24 }}>{tool}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}
