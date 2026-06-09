# SorteioFácil

Plataforma web mobile-first para gestão de rifas/promoções em lojas físicas.

**Cliente:** Oristanley Posse · **Dev:** Pem Tech · **Versão:** 1.0

## Estrutura

```
rifa/
├── frontend/   → Next.js 14 (App Router) - UI apenas
└── backend/    → Node.js + Express + Prisma + PostgreSQL - API
```

Dois processos independentes, deployados separados na Hostinger Node.js.

## Stack

| Camada      | Tecnologia                          |
|-------------|-------------------------------------|
| Frontend    | Next.js 14 · Tailwind CSS · TS      |
| Backend     | Express · Prisma · TS · Zod         |
| Banco       | PostgreSQL (Neon.tech recomendado)  |
| Auth        | JWT (jose) + bcrypt                 |
| QR Code     | qrcode (npm)                        |
| Crypto      | node:crypto (randomBytes, HMAC)     |

## Setup local

```bash
# Backend
cd backend
cp .env.example .env   # preencha DATABASE_URL, JWT_SECRET, HMAC_SECRET
npm install
npx prisma migrate dev
npm run seed           # cria admin inicial
npm run dev            # http://localhost:4000

# Frontend (outro terminal)
cd frontend
cp .env.local.example .env.local   # NEXT_PUBLIC_API_URL=http://localhost:4000
npm install
npm run dev            # http://localhost:3000
```

## Deploy Hostinger

Cada pasta é um app Node.js separado:

1. Conecte o repo GitHub na Hostinger
2. Crie 2 apps Node.js: um apontando para `backend/`, outro para `frontend/`
3. Configure variáveis de ambiente em ambos
4. Build: `npm run build` · Start: `npm start`

## Documentação

Documento de Requisitos v1.0 — ver `SorteioFacil-Requisitos-v1.docx` na origem.
