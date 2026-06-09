# Rodar o SorteioFácil com Docker

Sobe tudo (PostgreSQL + API + Frontend) com **um comando**. Nenhuma configuração manual de `.env` é necessária — os valores de desenvolvimento já vêm no `docker-compose.yml`.

## Pré-requisito

Docker Desktop instalado e **rodando**.

## Subir

Na raiz do projeto (`rifa/`):

```bash
docker compose up --build
```

A primeira vez demora alguns minutos (baixa imagens, instala dependências, aplica migrations e roda os seeds). Quando aparecer algo como `✓ Ready` no log do `sf-frontend`, está no ar.

## Acessar

| O quê        | URL                     |
|--------------|-------------------------|
| App (visual) | http://localhost:3000   |
| API          | http://localhost:4000   |
| Postgres     | localhost:5433          |

## Login admin (criado pelo seed)

- **Usuário/CPF:** `admin` (ou `00000000000`)
- **Senha:** `trocar123`

No primeiro login ele vai pedir para trocar a senha.

> O seed de demonstração (`seed:demo`) também cria sorteios de exemplo, então os painéis e a área do participante já aparecem com conteúdo.

## Comandos úteis

```bash
docker compose up --build -d     # sobe em segundo plano
docker compose logs -f frontend  # ver logs do front
docker compose down              # parar
docker compose down -v           # parar e apagar o banco (zera os dados)
```

## Observações

- O frontend roda em **modo dev** (`next dev`) para você ver o visual rapidamente; ele baixa a fonte Sora na primeira execução, então precisa de internet nesse momento.
- O Next encaminha `/api/*` para o backend pela rede interna do compose (`http://backend:4000`) — por isso o app funciona mesmo sem mexer em `NEXT_PUBLIC_API_URL`.
- Para produção (Hostinger), continue usando o fluxo de build/start descrito no `README.md`.
