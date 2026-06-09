# SorteioFácil — Backend

API REST do SorteioFácil. Express + Prisma + PostgreSQL + JWT.

## Setup

```bash
cp .env.example .env
# Edite DATABASE_URL, JWT_SECRET, HMAC_SECRET
npm install
npx prisma migrate dev
npm run seed   # cria admin inicial (use ADMIN_* do .env)
npm run dev
```

API sobe em `http://localhost:4000`.

## Endpoints principais

### Auth (`/api/auth`)
- `POST /login` — { cpf, senha } → access + refresh + user
- `POST /check-first-access` — { cpf } → hint da senha temp
- `POST /register` — auto-cadastro participante
- `POST /change-password` — troca obrigatória no primeiro acesso
- `GET /me` — usuário logado

### Cupons (`/api/coupons`)
- `POST /` — colaborador gera cupom (com QR Code data-URL)
- `POST /validate` — participante valida antes de escolher números
- `GET /mine?filter=hoje|7dias|todos` — histórico do colaborador

### Entries (`/api/entries`)
- `POST /confirm` — confirma escolha de números (atômico)
- `GET /taken/:raffleId` — públicos
- `GET /mine/:raffleId` — meus números

### Sorteios (`/api/raffles`)
- `POST /` (admin) — cria sorteio
- `GET /` — lista (colaborador vê só sua loja, admin vê tudo)
- `GET /public/:slug` — tela ao vivo (público)
- `POST /:id/end-redemption` — encerra resgates
- `POST /:id/draw` — sortear (randomInt seguro)
- `POST /:id/cancel`

### Usuários (`/api/users`)
- `POST /quick-register` — colaborador cadastra cliente
- `POST /colaboradores` (admin)
- `GET /colaboradores` (admin)
- `PATCH /:id/active` (admin)
- `GET /by-cpf/:cpf`

## Stack de segurança implementada

| Item                       | Onde                                          |
|----------------------------|-----------------------------------------------|
| CSPRNG p/ cupons           | `lib/crypto.ts` → `randomBytes` (Base32)      |
| HMAC-SHA256 no QR          | `lib/crypto.ts` → `signCoupon`/`verifyCouponSig` |
| Transação atômica resgate  | `services/entry.service.ts` → `$transaction`  |
| Lock otimista no cupom     | `updateMany WHERE status=pendente`            |
| UNIQUE(raffleId, numero)   | `prisma/schema.prisma`                        |
| Rate limit login           | `middlewares/rateLimit.ts`                    |
| Bloqueio CPF p/ 5 falhas   | `services/auth.service.ts`                    |
| bcrypt cost=12             | `lib/password.ts`                             |
| JWT HS256 c/ jose          | `lib/jwt.ts`                                  |
| CPF validado c/ DV         | `utils/cpf.ts`                                |
| Helmet + CORS estrito      | `app.ts`                                      |

## Deploy Hostinger

1. Aponte o app Node.js para `backend/`
2. Variáveis de ambiente conforme `.env.example`
3. Build: `npm run build` · Start: `npm start`
4. Em produção: rode `npx prisma migrate deploy` antes do start

> O `postinstall` já roda `prisma generate` automaticamente.
