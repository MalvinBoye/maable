import type { NextConfig } from 'next'

const isProd = process.env.NODE_ENV === 'production'

// Production CSP is strict. Dev keeps unsafe-eval for Next.js hot reload.
const scriptSrc = isProd
  ? "script-src 'self' https://js-cdn.music.apple.com"
  : "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://js-cdn.music.apple.com"

const nextConfig: NextConfig = {
  transpilePackages: ['@maable/core'],
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.supabase.co',
        pathname: '/storage/v1/object/public/**',
      },
      {
        protocol: 'https',
        hostname: 'i.scdn.co',  // Spotify album art CDN
      },
      {
        protocol: 'https',
        hostname: '*.mzstatic.com',  // Apple Music artwork CDN
      },
    ],
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Frame-Options',           value: 'DENY' },
          { key: 'X-Content-Type-Options',    value: 'nosniff' },
          { key: 'Referrer-Policy',           value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy',        value: 'camera=(), microphone=(), geolocation=()' },
          // HSTS — tell browsers to always use HTTPS (1 year)
          ...(isProd ? [{ key: 'Strict-Transport-Security', value: 'max-age=31536000; includeSubDomains' }] : []),
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              scriptSrc,
              "style-src 'self' 'unsafe-inline'",
              "img-src 'self' data: blob: https://*.supabase.co https://i.scdn.co https://*.mzstatic.com",
              "font-src 'self'",
              // Supabase realtime + REST, Spotify, Apple Music CDN
              "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://accounts.spotify.com https://api.spotify.com https://js-cdn.music.apple.com https://api.music.apple.com",
              "frame-ancestors 'none'",
              "media-src 'self' blob:",
            ].join('; '),
          },
        ],
      },
    ]
  },
}

export default nextConfig
