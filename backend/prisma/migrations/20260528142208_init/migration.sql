-- CreateEnum
CREATE TYPE "Role" AS ENUM ('admin', 'colaborador', 'participante');

-- CreateEnum
CREATE TYPE "RaffleStatus" AS ENUM ('ativo', 'aguardando_sorteio', 'sorteado', 'cancelado');

-- CreateEnum
CREATE TYPE "Animacao" AS ENUM ('tambor', 'caca_niquel');

-- CreateEnum
CREATE TYPE "CouponStatus" AS ENUM ('pendente', 'resgatado', 'expirado');

-- CreateTable
CREATE TABLE "lojas" (
    "id" UUID NOT NULL,
    "nome" VARCHAR(120) NOT NULL,
    "endereco" VARCHAR(200),
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "criadoEm" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "lojas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL,
    "nome" VARCHAR(120) NOT NULL,
    "cpf" VARCHAR(11) NOT NULL,
    "celular" VARCHAR(15) NOT NULL,
    "dataNasc" DATE NOT NULL,
    "email" VARCHAR(180),
    "senhaHash" VARCHAR(255) NOT NULL,
    "role" "Role" NOT NULL,
    "primeiroAcesso" BOOLEAN NOT NULL DEFAULT true,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "lojaId" UUID,
    "criadoPorId" UUID,
    "criadoEm" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "raffles" (
    "id" UUID NOT NULL,
    "nome" VARCHAR(60) NOT NULL,
    "slug" VARCHAR(80) NOT NULL,
    "premio" VARCHAR(120) NOT NULL,
    "premioValorCentavos" INTEGER,
    "totalNumeros" INTEGER NOT NULL,
    "dataHoraSorteio" TIMESTAMPTZ NOT NULL,
    "prazoResgate" TIMESTAMPTZ NOT NULL,
    "status" "RaffleStatus" NOT NULL DEFAULT 'ativo',
    "animacao" "Animacao" NOT NULL,
    "imagemUrl" TEXT,
    "ganhadorId" UUID,
    "numeroVencedor" INTEGER,
    "sorteadoEm" TIMESTAMPTZ,
    "sorteadoPorIp" VARCHAR(45),
    "criadoPorId" UUID NOT NULL,
    "criadoEm" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "raffles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "raffle_lojas" (
    "raffleId" UUID NOT NULL,
    "lojaId" UUID NOT NULL,

    CONSTRAINT "raffle_lojas_pkey" PRIMARY KEY ("raffleId","lojaId")
);

-- CreateTable
CREATE TABLE "coupons" (
    "id" UUID NOT NULL,
    "codigo" VARCHAR(20) NOT NULL,
    "hmacSig" VARCHAR(128) NOT NULL,
    "raffleId" UUID NOT NULL,
    "participanteId" UUID NOT NULL,
    "colaboradorId" UUID NOT NULL,
    "qtdNumeros" INTEGER NOT NULL,
    "status" "CouponStatus" NOT NULL DEFAULT 'pendente',
    "criadoEm" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resgatadoEm" TIMESTAMPTZ,
    "ipGeracao" VARCHAR(45) NOT NULL,

    CONSTRAINT "coupons_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "entries" (
    "id" UUID NOT NULL,
    "raffleId" UUID NOT NULL,
    "participanteId" UUID NOT NULL,
    "couponId" UUID NOT NULL,
    "numero" INTEGER NOT NULL,
    "criadoEm" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "entries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "login_attempts" (
    "id" UUID NOT NULL,
    "userId" UUID,
    "cpf" VARCHAR(11) NOT NULL,
    "ip" VARCHAR(45) NOT NULL,
    "sucesso" BOOLEAN NOT NULL,
    "criadoEm" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "login_attempts_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_cpf_key" ON "users"("cpf");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_cpf_idx" ON "users"("cpf");

-- CreateIndex
CREATE INDEX "users_role_idx" ON "users"("role");

-- CreateIndex
CREATE UNIQUE INDEX "raffles_slug_key" ON "raffles"("slug");

-- CreateIndex
CREATE INDEX "raffles_status_idx" ON "raffles"("status");

-- CreateIndex
CREATE INDEX "raffles_slug_idx" ON "raffles"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "coupons_codigo_key" ON "coupons"("codigo");

-- CreateIndex
CREATE INDEX "coupons_codigo_idx" ON "coupons"("codigo");

-- CreateIndex
CREATE INDEX "coupons_participanteId_idx" ON "coupons"("participanteId");

-- CreateIndex
CREATE INDEX "coupons_colaboradorId_idx" ON "coupons"("colaboradorId");

-- CreateIndex
CREATE INDEX "coupons_status_idx" ON "coupons"("status");

-- CreateIndex
CREATE INDEX "entries_participanteId_idx" ON "entries"("participanteId");

-- CreateIndex
CREATE INDEX "entries_couponId_idx" ON "entries"("couponId");

-- CreateIndex
CREATE UNIQUE INDEX "entries_raffleId_numero_key" ON "entries"("raffleId", "numero");

-- CreateIndex
CREATE INDEX "login_attempts_cpf_criadoEm_idx" ON "login_attempts"("cpf", "criadoEm");

-- CreateIndex
CREATE INDEX "login_attempts_ip_criadoEm_idx" ON "login_attempts"("ip", "criadoEm");

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_lojaId_fkey" FOREIGN KEY ("lojaId") REFERENCES "lojas"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_criadoPorId_fkey" FOREIGN KEY ("criadoPorId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "raffles" ADD CONSTRAINT "raffles_ganhadorId_fkey" FOREIGN KEY ("ganhadorId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "raffles" ADD CONSTRAINT "raffles_criadoPorId_fkey" FOREIGN KEY ("criadoPorId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "raffle_lojas" ADD CONSTRAINT "raffle_lojas_raffleId_fkey" FOREIGN KEY ("raffleId") REFERENCES "raffles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "raffle_lojas" ADD CONSTRAINT "raffle_lojas_lojaId_fkey" FOREIGN KEY ("lojaId") REFERENCES "lojas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "coupons" ADD CONSTRAINT "coupons_raffleId_fkey" FOREIGN KEY ("raffleId") REFERENCES "raffles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "coupons" ADD CONSTRAINT "coupons_participanteId_fkey" FOREIGN KEY ("participanteId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "coupons" ADD CONSTRAINT "coupons_colaboradorId_fkey" FOREIGN KEY ("colaboradorId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "entries" ADD CONSTRAINT "entries_raffleId_fkey" FOREIGN KEY ("raffleId") REFERENCES "raffles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "entries" ADD CONSTRAINT "entries_participanteId_fkey" FOREIGN KEY ("participanteId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "entries" ADD CONSTRAINT "entries_couponId_fkey" FOREIGN KEY ("couponId") REFERENCES "coupons"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "login_attempts" ADD CONSTRAINT "login_attempts_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
