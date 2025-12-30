import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  output: 'standalone',
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
              "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://*.google.com https://*.googleapis.com https://*.gstatic.com https://*.googletagmanager.com https://*.google-analytics.com https://*.googlesyndication.com https://*.doubleclick.net https://*.adtrafficquality.google https://adtrafficquality.google https://ep1.adtrafficquality.google https://ep2.adtrafficquality.google https://pagead2.googlesyndication.com https://static.cloudflareinsights.com https://*.cloudflareinsights.com https://*.cloudflare.com",
              "script-src-elem 'self' 'unsafe-inline' https://*.google.com https://*.googleapis.com https://*.gstatic.com https://*.googletagmanager.com https://*.google-analytics.com https://*.googlesyndication.com https://*.doubleclick.net https://*.adtrafficquality.google https://adtrafficquality.google https://ep1.adtrafficquality.google https://ep2.adtrafficquality.google https://pagead2.googlesyndication.com https://static.cloudflareinsights.com https://*.cloudflareinsights.com https://*.cloudflare.com",
              "style-src 'self' 'unsafe-inline' https://*.googleapis.com https://*.google.com",
              "font-src 'self' https://*.gstatic.com https://*.googleapis.com data:",
              "img-src 'self' data: blob: https: http:",
              "connect-src 'self' http://localhost:* https://*.google.com https://*.googleapis.com https://*.googletagmanager.com https://*.google-analytics.com https://*.googlesyndication.com https://*.doubleclick.net https://*.adtrafficquality.google https://adtrafficquality.google https://ep1.adtrafficquality.google https://ep2.adtrafficquality.google https://pagead2.googlesyndication.com https://jobsworld.in https://www.jobsworld.in https://*.jobsworld.in wss://jobsworld.in wss://www.jobsworld.in wss://*.jobsworld.in https://static.cloudflareinsights.com https://*.cloudflareinsights.com https://*.cloudflare.com",
              "frame-src 'self' https://*.google.com https://*.googletagmanager.com https://*.googlesyndication.com https://*.doubleclick.net https://*.cloudflare.com",
              "object-src 'none'",
              "base-uri 'self'",
            ].join('; '),
          },
        ],
      },
    ]
  },
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: `${process.env.NEXT_PUBLIC_API_URL}/:path*`,
      },
    ]
  },
}

export default nextConfig
