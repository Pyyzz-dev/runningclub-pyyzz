import bundleAnalyzer from "@next/bundle-analyzer";
import { createRequire } from "module";

const require = createRequire(import.meta.url);

const withPWA = require("next-pwa")({
  dest: "public",
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === "development",
  scope: "/",
  sw: "sw.js",
});

/** @type {import('next').NextConfig} */
const isDev = process.env.NODE_ENV === "development";
const isProd = process.env.NODE_ENV === "production";

const withBundleAnalyzer = bundleAnalyzer({
  enabled: process.env.ANALYZE === "true",
});

const nextConfig = {
  distDir: ".next",
  staticPageGenerationTimeout: 120,
  reactStrictMode: true,
  compress: true,
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "tlmzqwnvgcxhekljtrvg.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
      {
        protocol: "https",
        hostname: "**.supabase.co",
      },
    ],
    formats: ["image/avif", "image/webp"],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
    imageSizes: [16, 32, 48, 64, 96, 128, 256],
  },
  compiler: {
    removeConsole: isProd ? { exclude: ["error", "warn"] } : false,
  },
  experimental: {
    optimizeCss: false,
    webpackBuildWorker: false,
  },
  async headers() {
    return [
      {
        source: "/_next/static/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: isDev
              ? "no-store, no-cache, must-revalidate"
              : "public, max-age=31536000, immutable",
          },
        ],
      },
      {
        source: "/_next/data/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: isDev
              ? "no-store, must-revalidate"
              : "public, max-age=0, must-revalidate",
          },
        ],
      },
    ];
  },
  webpack: (config, { dev, isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
      };
    }
    if (dev) {
      config.cache = false;
      config.infrastructureLogging = { level: "error" };
    }
    return config;
  },
};

export default withBundleAnalyzer(withPWA(nextConfig));
