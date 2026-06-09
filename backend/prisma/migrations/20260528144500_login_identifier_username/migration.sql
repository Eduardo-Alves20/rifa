-- Adiciona suporte a login por usuário
ALTER TABLE "users"
ADD COLUMN IF NOT EXISTS "usuario" VARCHAR(40);

-- Expande a chave de bloqueio de tentativas para suportar e-mail/usuário
ALTER TABLE "login_attempts"
ALTER COLUMN "cpf" TYPE VARCHAR(180);

-- Backfill básico para usuários antigos
UPDATE "users"
SET "usuario" = "cpf"
WHERE "usuario" IS NULL;

-- Conveniência para admin inicial local
UPDATE "users"
SET "usuario" = 'admin'
WHERE "cpf" = '00000000000';

-- Constraint de unicidade para username
CREATE UNIQUE INDEX IF NOT EXISTS "users_usuario_key" ON "users"("usuario");
