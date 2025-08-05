import nextPwa from "next-pwa";

const isDev = process.env.NODE_ENV === "development";

const withPWA = nextPwa({
  dest: "public",
  register: true,
  skipWaiting: true,
  disable: isDev, // ✅ ESSA LINHA desativa o PWA no dev (resolve os loops)
});

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
  },
};

export default withPWA(nextConfig);
