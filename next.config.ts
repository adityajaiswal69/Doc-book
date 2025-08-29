import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  experimental: {
    serverComponentsExternalPackages: ['@opentelemetry/api'],
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.supabase.co',
        port: '',
        pathname: '/storage/v1/object/public/**',
      },
      // Allow any Supabase subdomain for flexibility
      {
        protocol: 'https',
        hostname: 'pegqeovfiyulglbgouqf.supabase.co',
        port: '',
        pathname: '/**',
      },
    ],
  },
  webpack: (config, { isServer }) => {
    // Only ignore warnings, don't interfere with module resolution
    config.ignoreWarnings = [
      { module: /node_modules\/@opentelemetry/ },
      { module: /node_modules\/@supabase/ },
      /Critical dependency: the request of a dependency is an expression/,
      /A Node\.js API is used/,
    ];

    return config;
  },
};

export default nextConfig;
