import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  output: 'standalone',
  transpilePackages: ['@react-pdf/renderer'],
  experimental: {
    esmExternals: 'loose',
  },
  webpack: (config, { isServer }) => {
    // Handle pdfjs-dist canvas dependency
    if (!isServer) {
      config.resolve.alias.canvas = false
    }
    return config
  },
  images: {
    // Allow images from any domain for scraped job company logos
    remotePatterns: [
      {
        protocol: 'http',
        hostname: '**',
      },
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://*.google.com https://*.googleapis.com https://*.gstatic.com https://*.googletagmanager.com https://*.google-analytics.com https://*.googlesyndication.com https://*.doubleclick.net https://*.adtrafficquality.google https://adtrafficquality.google https://ep1.adtrafficquality.google https://ep2.adtrafficquality.google https://pagead2.googlesyndication.com https://static.cloudflareinsights.com https://*.cloudflareinsights.com https://*.cloudflare.com https://cdnjs.cloudflare.com https://*.posthog.com https://us.i.posthog.com https://us-assets.i.posthog.com",
              "script-src-elem 'self' 'unsafe-inline' https://*.google.com https://*.googleapis.com https://*.gstatic.com https://*.googletagmanager.com https://*.google-analytics.com https://*.googlesyndication.com https://*.doubleclick.net https://*.adtrafficquality.google https://adtrafficquality.google https://ep1.adtrafficquality.google https://ep2.adtrafficquality.google https://pagead2.googlesyndication.com https://static.cloudflareinsights.com https://*.cloudflareinsights.com https://*.cloudflare.com https://cdnjs.cloudflare.com https://*.posthog.com https://us.i.posthog.com https://us-assets.i.posthog.com",
              "style-src 'self' 'unsafe-inline' https://*.googleapis.com https://*.google.com",
              "font-src 'self' https://*.gstatic.com https://*.googleapis.com data:",
              "img-src 'self' data: blob: https: http:",
              "connect-src 'self' data: blob: http://localhost:* https://*.google.com https://*.googleapis.com https://*.googletagmanager.com https://*.google-analytics.com https://*.googlesyndication.com https://*.doubleclick.net https://*.adtrafficquality.google https://adtrafficquality.google https://ep1.adtrafficquality.google https://ep2.adtrafficquality.google https://pagead2.googlesyndication.com https://jobsworld.in https://www.jobsworld.in https://*.jobsworld.in wss://jobsworld.in wss://www.jobsworld.in wss://*.jobsworld.in https://static.cloudflareinsights.com https://*.cloudflareinsights.com https://*.cloudflare.com https://cdnjs.cloudflare.com https://*.posthog.com https://us.i.posthog.com https://us-assets.i.posthog.com",
              "frame-src 'self' blob: https://*.google.com https://*.googletagmanager.com https://*.googlesyndication.com https://*.doubleclick.net https://*.adtrafficquality.google https://adtrafficquality.google https://ep1.adtrafficquality.google https://ep2.adtrafficquality.google https://*.cloudflare.com https://*.linkedin.com",
              "object-src 'none'",
              "base-uri 'self'",
            ].join('; '),
          },
        ],
      },
    ]
  },
  async rewrites() {
    // Get the base URL for storage (remove /api/v1 from API URL)
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api/v1'
    const storageUrl = apiUrl.replace('/api/v1', '')

    return [
      {
        source: '/api/:path*',
        destination: `${apiUrl}/:path*`,
      },
      // Proxy storage requests (avatars, resumes, etc.) to the backend/MinIO
      {
        source: '/storage/:path*',
        destination: `${storageUrl}/storage/:path*`,
      },
    ]
  },
}

export default nextConfig
