import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Serve modern, smaller formats when the browser supports them.
    formats: ["image/avif", "image/webp"],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      {
        protocol: "https",
        hostname: "akxoomoksevipmshvsjb.supabase.co",
      },
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
      },
    ],
  },
  // Tree-shake big libraries so the client bundle is smaller and loads faster.
  experimental: {
    optimizePackageImports: ["lucide-react", "framer-motion"],
  },
};

export default nextConfig;
