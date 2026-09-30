import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // source maps for the Lighthouse "valid source maps" audit and for debugging the 3D chunk in production
  productionBrowserSourceMaps: true,
};

export default nextConfig;
