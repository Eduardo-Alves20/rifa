/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  experimental: {
    typedRoutes: false,
  },
  async rewrites() {
    return [
      // Permite chamar a API via /api/* no mesmo host em dev (CORS-free)
      // Em produção, configure NEXT_PUBLIC_API_URL diretamente.
      {
        source: "/api/:path*",
        destination: `${process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000"}/api/:path*`,
      },
    ];
  },
};

module.exports = nextConfig;
