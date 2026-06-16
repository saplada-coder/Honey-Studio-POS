import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // โค้ดหน้าเว็บเขียนสไตล์ JavaScript จึงไม่บังคับ type ตอน build
  typescript: { ignoreBuildErrors: true },
  eslint: { ignoreDuringBuilds: true },
};

export default nextConfig;
