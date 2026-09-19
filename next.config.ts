import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // The dev overlay parks a "Rendering" badge over the screen while a server action runs, which
  // reads as part of the product when you are looking at the design. Dev-only chrome either way.
  devIndicators: false,
};

export default nextConfig;
