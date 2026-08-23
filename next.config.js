const SUPABASE_ORIGIN = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://mxixwpcqxwhbyzqikalr.supabase.co";

const CSP = [
  "default-src 'self'",
  "base-uri 'self'",
  "object-src 'none'",
  "form-action 'self'",
  "frame-ancestors 'self'",
  "frame-src https://challenges.cloudflare.com",
  `img-src 'self' data: blob: ${SUPABASE_ORIGIN} https://unpkg.com https://*.tile.openstreetmap.org`,
  "font-src 'self'",
  "style-src 'self' 'unsafe-inline'",
  "script-src 'self' 'unsafe-inline' https://challenges.cloudflare.com",
  `connect-src 'self' ${SUPABASE_ORIGIN} https://nominatim.openstreetmap.org`,
].join("; ");

const PRIVATE_NO_INDEX_ROUTES = [
  "/api/:path*",
  "/auth/:path*",
  "/editar/:path*",
  "/favoritos/:path*",
  "/login/:path*",
  "/mi-perfil/:path*",
  "/mis-anuncios/:path*",
  "/moderacion/:path*",
  "/olvide-password/:path*",
  "/publicar/:path*",
  "/registro/:path*",
  "/restablecer-password/:path*",
];

/** @type {import('next').NextConfig} */
const nextConfig = {
  poweredByHeader: false,
  async headers() {
    return [
      ...PRIVATE_NO_INDEX_ROUTES.map((source) => ({
        source,
        headers: [{ key: "X-Robots-Tag", value: "noindex, nofollow, noarchive" }],
      })),
      {
        source: "/:path*",
        headers: [
          { key: "Content-Security-Policy", value: CSP },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
          { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" },
          { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
          { key: "Cross-Origin-Resource-Policy", value: "same-site" },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
