import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  output: "standalone",
  reactCompiler: true,
  serverExternalPackages: ["sharp", "@imgly/background-removal-node"],
};

export default nextConfig;
