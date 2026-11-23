import type { NextConfig } from "next";

const config: NextConfig = {
  experimental: { serverActions: { bodySizeLimit: "12mb" } },
  devIndicators: false,
};

export default config;
