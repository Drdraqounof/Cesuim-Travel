import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["cesium", "@cesium/engine", "@cesium/widgets", "@cesium/wasm-splats", "resium"],
};

export default nextConfig;
