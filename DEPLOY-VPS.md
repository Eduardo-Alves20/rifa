# Deploy na VPS (Docker)

Sobe **tudo** (PostgreSQL + API + Frontend + Caddy com SSL automático) em containers.
Arquitetura: só o **Caddy** fica exposto (80/443); ele encaminha para o frontend, que
encaminha `/api/*` para o backend pela rede interna. O Postgres é interno (sem porta pública).

## Pré-requisitos na VPS
- Docker + plugin Compose instalados
- Portas **80** e **443** liberadas no firewall
- DNS do `pitstopclub.com.br` apontando para o **IP da VPS** (registros A/AAAA) — necessário para o SSL

## Passos

```bash
# 1. Clonar o repositório (branch vps) e entrar
git clone -b vps https://github.com/Eduardo-Alves20/rifa.git
cd rifa

# 2. Criar o .env.prod a partir do exemplo e preencher os segredos
cp .env.prod.example .env.prod
nano .env.prod        # preencha POSTGRES_PASSWORD, JWT_SECRET, HMAC_SECRET, ADMIN_PASSWORD

# 3. Subir tudo
docker compose -f docker-compose.prod.yml --env-file .env.prod up -d --build

# 4. Acompanhar os logs até estabilizar
docker compose -f docker-compose.prod.yml logs -f
```

No primeiro boot o backend aplica as migrations e cria o admin automaticamente.

## Testar
- Antes do DNS apontar: `curl -I http://localhost` na VPS (Caddy responde).
- Depois do DNS apontar: abra `https://pitstopclub.com.br` (o Caddy emite o certificado sozinho no primeiro acesso; pode levar ~30s).

## Comandos úteis

```bash
C="docker compose -f docker-compose.prod.yml"
$C ps                      # status dos containers
$C logs -f backend         # logs da API
$C up -d --build           # rebuild após git pull
$C down                    # parar
$C exec db psql -U sorteio sorteiofacil   # acessar o banco
```

## Atualizar (deploy de nova versão)

```bash
git pull
docker compose -f docker-compose.prod.yml --env-file .env.prod up -d --build
```

## Backup do banco

```bash
docker compose -f docker-compose.prod.yml exec db \
  pg_dump -U sorteio sorteiofacil > backup_$(date +%F).sql
```
