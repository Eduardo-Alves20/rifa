import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import "dotenv/config";

const prisma = new PrismaClient();

async function main() {
  const email = process.env.ADMIN_EMAIL ?? "admin@sorteiofacil.com";
  const password = process.env.ADMIN_PASSWORD ?? "trocar123";
  const nome = process.env.ADMIN_NOME ?? "Administrador";
  const cpf = (process.env.ADMIN_CPF ?? "00000000000").replace(/\D/g, "");
  const usuario = (process.env.ADMIN_USUARIO ?? "admin").trim().toLowerCase();

  const existing = await prisma.user.findUnique({ where: { cpf } });
  if (existing) {
    console.log(`[seed] admin já existe (cpf=${cpf}) — nada a fazer.`);
    return;
  }

  const senhaHash = await bcrypt.hash(password, 12);

  const admin = await prisma.user.create({
    data: {
      nome,
      cpf,
      usuario,
      celular: "00000000000",
      dataNasc: new Date("1990-01-01"),
      email,
      senhaHash,
      role: "admin",
      primeiroAcesso: false,
      ativo: true,
    },
  });

  console.log(`[seed] admin criado: ${admin.email} (cpf ${admin.cpf})`);
  console.log(`[seed] senha: ${password} — TROQUE APÓS PRIMEIRO LOGIN`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
