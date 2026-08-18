import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Local Supabase uses 127.0.0.1 during development. Keep this disabled in
    // production, where seller photos will use the deployed Supabase host.
    dangerouslyAllowLocalIP: process.env.NODE_ENV !== "production",
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      // Approved seller photos are stored in the local Supabase bucket during
      // development. Buyer cards receive short-lived signed URLs for them.
      {
        protocol: "http",
        hostname: "127.0.0.1",
        port: "54321",
        pathname: "/storage/v1/object/sign/seller-listing-media/**",
      },
      {
        protocol: "http",
        hostname: "localhost",
        port: "54321",
        pathname: "/storage/v1/object/sign/seller-listing-media/**",
      },
    ],
  },
};

export default nextConfig;
