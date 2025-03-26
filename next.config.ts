import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // reactStrictMode: true,
  // images: {
  //   domains: ["wakes-media.s3.amazonaws.com"],
  // },
  eslint: {
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
