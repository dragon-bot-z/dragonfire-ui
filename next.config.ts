import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Serve from /fire subfolder when proxied through dragons.bot
  basePath: '/fire',
  assetPrefix: '/fire',
};

export default nextConfig;
