import type { NextConfig } from "next";
import path from "path";

const nextConfig: any = {
  /* config options here */
  turbopack: {
    // Force Turbopack to treat the project folder as the root to avoid HMR ignoring updates
    root: path.resolve('.')
  },
  experimental: {
    // Optional additional configurations if needed
  },
  transpilePackages: [],
  webpack: (config: any) => {
    return config;
  }
};

export default nextConfig;
