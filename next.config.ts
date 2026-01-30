import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Serve from /dragonfire subfolder when proxied through dragons.bot
  basePath: '/dragonfire',
  // Ensure assets also load from /dragonfire
  assetPrefix: '/dragonfire',
};

export default nextConfig;
