import type { NextConfig } from "next";

const BACKEND_URL = process.env.BACKEND_URL || "http://127.0.0.1:8000";

const nextConfig: NextConfig = {
  typescript: {
    tsconfigPath: "./tsconfig.build.json",
  },
  async rewrites() {
    return [
      // Relative proxy for uploaded user assets (avatars, etc.)
      {
        source: "/uploads/:path*",
        destination: `${BACKEND_URL}/uploads/:path*`,
      },
      // Legacy /api/backend/* proxy (kept for backwards compatibility)
      {
        source: "/api/backend/:path*",
        destination: `${BACKEND_URL}/api/:path*`,
      },
      // Direct proxy rules — /api/resume/*, /api/interview/*, etc.
      // These forward to FastAPI while /api/auth/* stays with NextAuth
      {
        source: "/api/resume/:path*",
        destination: `${BACKEND_URL}/api/resume/:path*`,
      },
      {
        source: "/api/interview/:path*",
        destination: `${BACKEND_URL}/api/interview/:path*`,
      },
      {
        source: "/api/user/:path*",
        destination: `${BACKEND_URL}/api/user/:path*`,
      },
      {
        source: "/api/voice/:path*",
        destination: `${BACKEND_URL}/api/voice/:path*`,
      },
      {
        source: "/api/report/:path*",
        destination: `${BACKEND_URL}/api/report/:path*`,
      },
      {
        source: "/api/questions/:path*",
        destination: `${BACKEND_URL}/api/questions/:path*`,
      },
    ];
  },
};

export default nextConfig;
