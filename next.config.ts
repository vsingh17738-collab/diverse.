import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["better-sqlite3"],
  allowedDevOrigins: ["*.e2b.app", "*.arena.ai", "localhost", "127.0.0.1"],
  experimental: {
    serverActions: {
      allowedOrigins: ["*.e2b.app", "localhost:3000", "127.0.0.1:3000"],
    },
  },
};

export default nextConfig;
