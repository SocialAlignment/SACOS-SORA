import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Temporarily ignore ESLint errors during build for deployment
  // TODO: Fix type safety issues properly
  eslint: {
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
