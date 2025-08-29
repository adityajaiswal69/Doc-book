import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  serverExternalPackages: ['@opentelemetry/api'],
  transpilePackages: ['@supabase/ssr', '@supabase/supabase-js'],
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
    // Resolve Supabase module issues
    config.resolve = config.resolve || {};
    config.resolve.alias = config.resolve.alias || {};
    
    // Ensure proper module resolution for Supabase packages
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
        crypto: false,
      };
    }

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
