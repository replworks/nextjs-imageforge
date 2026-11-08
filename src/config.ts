import type { NextConfig } from "next";

export function withImageForge(nextConfig: NextConfig): NextConfig {
  return { ...nextConfig };
}
