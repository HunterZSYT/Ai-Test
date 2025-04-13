import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    domains: [
      'example.com',
      'images.unsplash.com',
      'picsum.photos'
    ],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
};

export default nextConfig;
