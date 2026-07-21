/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'cdn.sanity.io',
        pathname: '/images/**',
      },
    ],
  },
  // Fix cross-origin development requests
  allowedDevOrigins: ['192.168.11.20'],
  
  // External packages that should not be bundled with server components
  // AI SDK packages must be external to prevent webpack chunk resolution failures
  // when dynamically imported in the extraction pipeline (aeo-extractor, strategic-insight-agent)
  serverExternalPackages: ['pdf-parse', 'mammoth', 'ai', '@ai-sdk/provider-utils', '@ai-sdk/gateway', '@ai-sdk/openai-compatible', '@ai-sdk/provider'],
  
  // Webpack configuration for server-only packages
  webpack: (config, { isServer, webpack }) => {
    if (!isServer) {
      // Ignore pdf-parse and mammoth on client-side
      config.plugins.push(
        new webpack.IgnorePlugin({
          resourceRegExp: /^(pdf-parse|mammoth)$/,
        })
      )
    }
    // Suppress 'webworker-threads' warning from natural package (optional dep)
    config.plugins.push(
      new webpack.IgnorePlugin({
        resourceRegExp: /^webworker-threads$/,
      })
    )
    return config
  },
  
  // Experimental features
  experimental: {
    // Prevent aggressive router cache revalidation on tab switch
    staleTimes: {
      dynamic: 30, // Keep dynamic pages cached for 30 seconds
      static: 180, // Keep static pages cached for 3 minutes
    },
  },
  
  // Public environment variables for OAuth
  env: {
    NEXT_PUBLIC_GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
  },
  
  // Custom server configuration for development
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
        ],
      },
    ];
  },
}

export default nextConfig
