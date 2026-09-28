import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Оптимизированная сборка для Docker
  output: "standalone",
};

export default nextConfig;
