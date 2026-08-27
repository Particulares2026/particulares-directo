import { ImageResponse } from "next/og";

export const alt = "Particulares Directo: vivienda y empleo con contacto directo";
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #fff7fb 0%, #ffffff 52%, #f0fdfa 100%)",
          color: "#1c1917",
          padding: "64px",
        }}
      >
        <div
          style={{
            width: "100%",
            height: "100%",
            display: "flex",
            alignItems: "center",
            gap: "58px",
            border: "3px solid #fbcfe8",
            borderRadius: "44px",
            background: "rgba(255,255,255,0.94)",
            padding: "58px",
            boxShadow: "0 28px 70px rgba(131, 24, 67, 0.14)",
          }}
        >
          <div
            style={{
              width: "210px",
              height: "210px",
              flexShrink: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              borderRadius: "42px",
              background: "#ec1178",
              color: "#ffffff",
              fontSize: "94px",
              fontWeight: 900,
              letterSpacing: "-10px",
              paddingRight: "10px",
            }}
          >
            PD
          </div>

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              flex: 1,
            }}
          >
            <div
              style={{
                display: "flex",
                color: "#ec1178",
                fontSize: "30px",
                fontWeight: 800,
                letterSpacing: "2px",
                textTransform: "uppercase",
              }}
            >
              Particulares Directo
            </div>
            <div
              style={{
                display: "flex",
                marginTop: "18px",
                maxWidth: "720px",
                fontSize: "55px",
                fontWeight: 800,
                lineHeight: 1.08,
                letterSpacing: "-2px",
              }}
            >
              Vivienda y empleo con contacto directo
            </div>
            <div
              style={{
                display: "flex",
                marginTop: "26px",
                alignSelf: "flex-start",
                borderRadius: "999px",
                background: "#fce7f3",
                color: "#9d174d",
                padding: "13px 24px",
                fontSize: "25px",
                fontWeight: 700,
              }}
            >
              Publica y encuentra anuncios gratis
            </div>
          </div>
        </div>
      </div>
    ),
    size,
  );
}
