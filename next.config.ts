import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ['pdfkit'],
  outputFileTracingIncludes: {
    '/api/products/qr-labels': ['./public/fonts/*.ttf', './node_modules/pdfkit/js/data/*.afm'],
    '/api/products/*/qr-label': ['./public/fonts/*.ttf', './node_modules/pdfkit/js/data/*.afm'],
  },
  // โค้ดหน้าเว็บเขียนสไตล์ JavaScript จึงไม่บังคับ type ตอน build
  typescript: { ignoreBuildErrors: true },
  eslint: { ignoreDuringBuilds: true },
};

export default nextConfig;
