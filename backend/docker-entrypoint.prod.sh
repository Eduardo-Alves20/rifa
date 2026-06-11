#!/usr/bin/env bash
set -e

echo "[entrypoint] Gerando Prisma Client..."
npx prisma generate >/dev/null 2>&1 || true

echo "[entrypoint] Aplicando migrations..."
npx prisma migrate deploy

echo "[entrypoint] Criando admin inicial (se não existir)..."
npm run seed || echo "[entrypoint] seed admin pulado (provavelmente já existe)"

echo "[entrypoint] Subindo a API..."
exec "$@"
