/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  // Exporta o site como estático (HTML/CSS/JS em out/). Esses arquivos são
  // servidos pelo próprio backend Express, no mesmo domínio — então as chamadas
  // a /api/* ficam same-origin (sem CORS, sem proxy).
  output: "export",
  images: { unoptimized: true },
  experimental: {
    typedRoutes: false,
  },
};

module.exports = nextConfig;
