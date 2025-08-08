import nextPwa from "next-pwa"
import defaultCache from "next-pwa/cache.js"

const isDev = process.env.NODE_ENV === "development"

const runtimeCaching = [
  { urlPattern: /^\/api\/.*$/, handler: "NetworkOnly" },
  ...defaultCache,
]

const pwa = nextPwa({
  dest: "public",
  register: true,     // registra só em prod (ver export abaixo)
  skipWaiting: true,
  runtimeCaching,
})

/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: { ignoreDuringBuilds: true },
  typescript: { ignoreBuildErrors: true },
  images: { unoptimized: true },
}

// 👉 Em dev, exporta sem PWA; em prod, com PWA
export default isDev ? nextConfig : pwa(nextConfig)
