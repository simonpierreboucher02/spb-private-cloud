/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ["bcryptjs"],
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          { key: "X-XSS-Protection", value: "1; mode=block" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
        ],
      },
      {
        source: "/pdf.worker.min.mjs",
        headers: [
          { key: "Content-Type", value: "application/javascript" },
        ],
      },
    ];
  },
  webpack: (config) => {
    // Avoid bundling pdfjs-dist worker
    config.resolve.alias.canvas = false;
    return config;
  },
};

export default nextConfig;
