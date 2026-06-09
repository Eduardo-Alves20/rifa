#!/usr/bin/env bash
set -e

echo "[entrypoint] Gerando Prisma Client..."
npx prisma generate >/dev/null 2>&1 || true

echo "[entrypoint] Aplicando migrations..."
npx prisma migrate deploy

echo "[entrypoint] Rodando seed (admin inicial)..."
npm run seed || echo "[entrypoint] seed admin pulado (provavelmente já existe)"

echo "[entrypoint] Rodando seed demo (dados de exemplo)..."
npm run seed:demo || echo "[entrypoint] seed demo pulado"

echo "[entrypoint] Subindo a API..."
exec "$@"
