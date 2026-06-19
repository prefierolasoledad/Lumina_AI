import type { NextConfig } from "next";
import path from "path";

const nextConfig: any = {
  /* config options here */
  // Emit a self-contained server bundle (.next/standalone) so the Docker
  // runtime image only needs the traced files, not the full node_modules tree.
  output: "standalone",
  turbopack: {
    // Force Turbopack to treat THIS folder (the frontend app) as the root.
    // Use __dirname (the config's own directory) instead of '.' so module
    // resolution can't break depending on where `next dev` is launched from.
    root: __dirname
  },
  experimental: {
    // Optional additional configurations if needed
  },
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'}/:path*`,
      },
    ];
  },
  transpilePackages: [],
  webpack: (config: any) => {
    return config;
  }
};

export default nextConfig;
