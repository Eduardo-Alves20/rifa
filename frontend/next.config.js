/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  // Exporta o site como estático (HTML/CSS/JS em out/). Esses arquivos são
  // servidos pelo próprio backend Express, no mesmo domínio — então as chamadas
  // a /api/* ficam same-origin (sem CORS, sem proxy).
  output: "export",
  // Gera cada rota como pasta/index.html — evita conflito no Express entre uma
  // página (ex.: admin.html) e a pasta de subrotas (admin/).
  trailingSlash: true,
  images: { unoptimized: true },
  experimental: {
    typedRoutes: false,
  },
};

module.exports = nextConfig;
