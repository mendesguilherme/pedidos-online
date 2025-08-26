// next.config.mjs
import nextPwa from 'next-pwa'
import defaultCache from 'next-pwa/cache.js'

const isDev = process.env.NODE_ENV !== 'production'

const runtimeCaching = [
  { urlPattern: /^\/api\/.*$/, handler: 'NetworkOnly' },
  ...defaultCache,
]

const withPWA = nextPwa({
  dest: 'public',
  register: true,
  skipWaiting: true,
  runtimeCaching,
  disable: isDev, // não registra SW em dev
  // ⬇️ esta opção deve ficar na raiz (não dentro de workboxOptions)
  navigateFallbackDenylist: [/^\/admin($|\/)/, /^\/painel($|\/)/],
})

/** @type {import('next').NextConfig} */
const baseConfig = {
  eslint: { ignoreDuringBuilds: true },
  typescript: { ignoreBuildErrors: true },
  images: {
    unoptimized: true,
    remotePatterns: [
      { protocol: 'https', hostname: 'supa.nexii.com.br' },
      { protocol: 'https', hostname: '**.supabase.co' },
    ],
  },
  async headers() {
    return [
      {
        source: '/painel/:path*',
        headers: [{ key: 'X-Robots-Tag', value: 'noindex, nofollow, noarchive' }],
      },
    ]
  },
}

export default withPWA(baseConfig)
