import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  outputFileTracingRoot: __dirname,
  // Default is 1MB — a phone camera photo (AI photo import) routinely
  // exceeds that on its own before any client-side compression is applied.
  // The client compresses before upload too (see ai-photo-import-form.tsx),
  // so this is a safety net, not the primary size control.
  experimental: {
    serverActions: {
      bodySizeLimit: "10mb",
    },
  },
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "books.google.com" },
      { protocol: "https", hostname: "books.googleusercontent.com" },
      { protocol: "https", hostname: "ptqykneuyqrcqdigomzt.supabase.co" },
      { protocol: "https", hostname: "covers.openlibrary.org" },
    ],
  },
};

export default nextConfig;
