const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? ""

/** @type {import("next").NextConfig} */
const nextConfig = {
  output: "export",
  trailingSlash: true,
  reactStrictMode: true,
  devIndicators: false,
  basePath,
  env: {
    NEXT_PUBLIC_BASE_PATH: basePath,
  },
  images: {
    unoptimized: true,
    remotePatterns: [
      {
        protocol: "https",
        hostname: "i.discogs.com",
      },
    ],
  },
}

export default nextConfig
