import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typescript: {
    // Disables TypeScript type checking during build (you may want to set this to false after fixing errors)
    ignoreBuildErrors: true,
  },

  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "cdn1.iconfinder.com",
      },
      {
        protocol: "https",
        hostname: "cdn-icons-png.flaticon.com",
      },
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      {
        protocol: "https",
        hostname: "pbs.twimg.com",
      },
      {
        protocol: "https",
        hostname: "img.freepik.com",
      },
      {
        protocol: "https",
        hostname: "unsplash.com"
      },
      {
        protocol: "https",
        hostname: "media.licdn.com"
      },
      {
        protocol: "https",
        hostname: "**.bbc.co.uk"
      },
      {
        protocol: "https",
        hostname: "**.techcrunch.com"
      },
      {
        protocol: "https",
        hostname: "**.wired.com"
      },
      {
        protocol: "https",
        hostname: "**.theverge.com"
      },
      {
        protocol: "https",
        hostname: "**.cnn.com"
      },
      {
        protocol: "https",
        hostname: "**.reuters.com"
      },
      {
        protocol: "https",
        hostname: "**.arstechnica.net"
      },
      {
        protocol: "https",
        hostname: "static.toiimg.com"
      },
      {
        protocol: "https",
        hostname: "**.zdnet.com"
      },
      {
        protocol: "https",
        hostname: "**.engadget.com"
      },
    ],
  },
  async headers() {
    return [
      {
        source: '/site.webmanifest',
        headers: [
          {
            key: 'Content-Type',
            value: 'application/manifest+json',
          },
        ],
      },
    ];
  },

  reactStrictMode: true,
};

export default nextConfig;
