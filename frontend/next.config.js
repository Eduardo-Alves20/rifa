/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  experimental: {
    typedRoutes: false,
  },
  async rewrites() {
    return [
      // O frontend chama /api/* (mesmo host) e o Next encaminha para o backend.
      // Em produção (Docker), NEXT_PUBLIC_API_URL = http://backend:4000 (rede interna).
      {
        source: "/api/:path*",
        destination: `${process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000"}/api/:path*`,
      },
    ];
  },
};

module.exports = nextConfig;
