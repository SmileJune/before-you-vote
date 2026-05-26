/** @type {import('next').NextConfig} */
const nextConfig = {
  turbopack: {
    root: process.cwd()
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "cdn.nec.go.kr"
      },
      {
        protocol: "http",
        hostname: "cdn.nec.go.kr"
      }
    ]
  }
};

export default nextConfig;
