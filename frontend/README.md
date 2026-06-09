# SorteioFácil — Frontend

Next.js 14 (App Router) + Tailwind CSS + TypeScript.

## Setup

```bash
cp .env.local.example .env.local
# Aponte NEXT_PUBLIC_API_URL para o backend
npm install
npm run dev
```

App sobe em `http://localhost:3000`. As chamadas a `/api/*` são reescritas para a URL da API (next.config.js → rewrites).

## Estrutura

```
frontend/
├── app/
│   ├── (auth)/login              → CPF + senha
│   ├── (auth)/cadastro           → auto-cadastro participante
│   ├── (auth)/primeiro-acesso    → revela senha temporária
│   ├── (auth)/trocar-senha       → obrigatória no 1º acesso
│   ├── colaborador/              → dashboard + histórico de cupons
│   ├── colaborador/gerar         → gera cupom + QR Code
│   ├── admin/                    → lista sorteios
│   ├── admin/sorteios/novo       → cria sorteio
│   ├── minha-area/               → participante: meus números
│   ├── resgatar/                 → valida cupom + escolhe números
│   ├── sorteio/[slug]/ao-vivo    → tela pública (sem login)
│   ├── layout.tsx
│   ├── page.tsx                  → home
│   └── globals.css               → design system completo
├── components/
│   ├── ui/ (Button, Input, Card, Badge, Alert)
│   ├── grid/NumbersGrid.tsx      → grade responsiva mobile-first
│   ├── AuthGuard.tsx
│   ├── TopBar.tsx
│   └── Logo.tsx                  → "Sortei[o]Fácil" com 'o' amarelo
└── lib/
    ├── api.ts                    → cliente HTTP tipado
    ├── auth.ts                   → storage de tokens
    └── cpf.ts                    → máscara + validação CPF
```

## Design System

Implementado em `app/globals.css`:

- CSS variables (`--c-bg`, `--c-yellow`, etc) — paleta da doc
- Classes utilitárias: `.btn`, `.btn-primary`, `.btn-ghost`, `.card`, `.input`, `.badge-*`
- `.numbers-grid` responsivo: 5 cols (mobile) → 8 (tablet) → 10 (desktop)
- Estados do número: `num-free`, `num-taken`, `num-selected`, `num-mine`
- Tipografia: `.h1`, `.h2`, `.label`, `.code-cupom` (mono + tracking)
- Tailwind configurado lendo as mesmas variáveis (cores em `tailwind.config.ts`)

## Mobile-first

Toda página foi pensada em 390px primeiro. Grids, paddings e tap targets dimensionados para toque.

## Deploy Hostinger

App Node.js separado:
- Diretório: `frontend/`
- Build: `npm run build` · Start: `npm start`
- Env: `NEXT_PUBLIC_API_URL=https://api.seudominio.com`

> Em produção desabilite o `rewrites` apontando para localhost — defina `NEXT_PUBLIC_API_URL` no painel da Hostinger.
