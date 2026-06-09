import { PrismaClient, type CouponStatus, type RaffleStatus } from "@prisma/client";
import bcrypt from "bcryptjs";
import { createHmac, randomBytes } from "node:crypto";
import "dotenv/config";

const prisma = new PrismaClient();

const DEMO_RAFFLES = [
  { nome: "Rifa iPhone 15 128GB", slug: "demo-iphone-15", premio: "iPhone 15 128GB", valor: 529900, status: "ativo" as RaffleStatus },
  { nome: "Rifa Smart TV 55 4K", slug: "demo-smarttv-55", premio: "Smart TV 55 4K", valor: 279900, status: "ativo" as RaffleStatus },
  { nome: "Rifa Playstation 5", slug: "demo-ps5", premio: "Playstation 5 Slim", valor: 369900, status: "ativo" as RaffleStatus },
  { nome: "Rifa Notebook Gamer", slug: "demo-notebook-gamer", premio: "Notebook Gamer RTX 4060", valor: 689900, status: "ativo" as RaffleStatus },
  { nome: "Rifa Vale-Compras 3 Mil", slug: "demo-vale-3k", premio: "Vale-compras de R$ 3.000", valor: 300000, status: "aguardando_sorteio" as RaffleStatus },
  { nome: "Rifa Moto Elétrica", slug: "demo-moto-eletrica", premio: "Moto Elétrica Urbana", valor: 999900, status: "aguardando_sorteio" as RaffleStatus },
  { nome: "Rifa Bicicleta Elétrica", slug: "demo-bike-eletrica", premio: "Bicicleta Elétrica Aro 29", valor: 749900, status: "aguardando_sorteio" as RaffleStatus },
  { nome: "Rifa AirPods Pro 2", slug: "demo-airpods-pro2", premio: "AirPods Pro 2", valor: 189900, status: "sorteado" as RaffleStatus },
  { nome: "Rifa Geladeira Frost Free", slug: "demo-geladeira", premio: "Geladeira Frost Free 400L", valor: 459900, status: "sorteado" as RaffleStatus },
  { nome: "Rifa Cafeteira Premium", slug: "demo-cafeteira", premio: "Cafeteira Espresso Premium", valor: 249900, status: "cancelado" as RaffleStatus },
];

const DEMO_STORES = [
  { nome: "Loja Centro", endereco: "Av. Paulista, 1500 - Bela Vista - São Paulo/SP" },
  { nome: "Loja Norte", endereco: "Rua Voluntários da Pátria, 2100 - Santana - São Paulo/SP" },
  { nome: "Loja Leste", endereco: "Av. Celso Garcia, 3100 - Tatuapé - São Paulo/SP" },
];

const PARTICIPANT_NAMES = [
  "Lucas Oliveira",
  "Mariana Souza",
  "Felipe Santos",
  "Camila Rocha",
  "Renato Lima",
  "Patrícia Almeida",
  "Gabriel Costa",
  "Juliana Martins",
  "Thiago Ferreira",
  "Bruna Ribeiro",
];

const HMAC_SECRET = process.env.HMAC_SECRET || "demo-hmac-secret-change-me";

function generateValidCpf(seed: number): string {
  const base = String(100000000 + seed * 7919).slice(0, 9);
  const digits = base.split("").map(Number);
  const d1 =
    ((digits.reduce((acc, n, i) => acc + n * (10 - i), 0) * 10) % 11) % 10;
  const d2 =
    (([...digits, d1].reduce((acc, n, i) => acc + n * (11 - i), 0) * 10) % 11) % 10;
  return `${base}${d1}${d2}`;
}

function daysFromNow(days: number): Date {
  return new Date(Date.now() + days * 24 * 60 * 60 * 1000);
}

function pickCouponStatus(raffleStatus: RaffleStatus, idx: number): CouponStatus {
  if (raffleStatus === "cancelado") return idx % 2 === 0 ? "pendente" : "expirado";
  if (raffleStatus === "sorteado") return "resgatado";
  if (raffleStatus === "aguardando_sorteio") return idx % 4 === 0 ? "pendente" : "resgatado";
  return idx % 5 === 0 ? "pendente" : "resgatado";
}

async function ensureAdmin() {
  const adminEmail = (process.env.ADMIN_EMAIL ?? "admin@sorteiofacil.com").toLowerCase();
  const adminCpf = (process.env.ADMIN_CPF ?? "00000000000").replace(/\D/g, "");
  const adminSenha = process.env.ADMIN_PASSWORD ?? "trocar123";
  const adminNome = process.env.ADMIN_NOME ?? "Administrador";
  const adminUsuario = (process.env.ADMIN_USUARIO ?? "admin").toLowerCase();

  const byCpf = await prisma.user.findUnique({ where: { cpf: adminCpf } });
  if (byCpf) return byCpf;

  const senhaHash = await bcrypt.hash(adminSenha, 12);
  return prisma.user.create({
    data: {
      nome: adminNome,
      cpf: adminCpf,
      usuario: adminUsuario,
      celular: "11999990000",
      dataNasc: new Date("1990-01-01"),
      email: adminEmail,
      senhaHash,
      role: "admin",
      primeiroAcesso: false,
      ativo: true,
    },
  });
}

async function ensureStore(nome: string, endereco: string) {
  const existing = await prisma.loja.findFirst({ where: { nome } });
  if (existing) return existing;
  return prisma.loja.create({ data: { nome, endereco, ativo: true } });
}

async function generateCouponCode(raffleSlug: string, idx: number): Promise<string> {
  for (let i = 0; i < 10; i++) {
    const suffix = randomBytes(3).toString("hex").toUpperCase();
    const code = `DM-${raffleSlug.slice(5, 10).toUpperCase()}-${idx}-${suffix}`.slice(0, 20);
    const dup = await prisma.coupon.findUnique({ where: { codigo: code } });
    if (!dup) return code;
  }
  throw new Error("Falha ao gerar código único de cupom demo");
}

function signCoupon(codigo: string, raffleId: string): string {
  return createHmac("sha256", HMAC_SECRET).update(`${codigo}:${raffleId}`).digest("hex");
}

async function main() {
  const admin = await ensureAdmin();
  const sharedPasswordHash = await bcrypt.hash("demo123", 10);

  const stores = [];
  for (const store of DEMO_STORES) {
    stores.push(await ensureStore(store.nome, store.endereco));
  }

  const colaboradores = [];
  for (let i = 0; i < stores.length; i++) {
    const cpf = generateValidCpf(500 + i);
    const user = await prisma.user.upsert({
      where: { cpf },
      update: {
        nome: `Colaborador ${stores[i].nome}`,
        usuario: `colab${i + 1}`,
        celular: `11988888${String(100 + i)}`,
        dataNasc: new Date(`199${i + 1}-0${i + 1}-1${i + 1}`),
        email: `colab${i + 1}@demo.local`,
        senhaHash: sharedPasswordHash,
        role: "colaborador",
        lojaId: stores[i].id,
        criadoPorId: admin.id,
        primeiroAcesso: false,
        ativo: true,
      },
      create: {
        nome: `Colaborador ${stores[i].nome}`,
        cpf,
        usuario: `colab${i + 1}`,
        celular: `11988888${String(100 + i)}`,
        dataNasc: new Date(`199${i + 1}-0${i + 1}-1${i + 1}`),
        email: `colab${i + 1}@demo.local`,
        senhaHash: sharedPasswordHash,
        role: "colaborador",
        lojaId: stores[i].id,
        criadoPorId: admin.id,
        primeiroAcesso: false,
        ativo: true,
      },
    });
    colaboradores.push(user);
  }

  const participantes = [];
  for (let i = 0; i < 10; i++) {
    const cpf = generateValidCpf(100 + i);
    const nome = PARTICIPANT_NAMES[i];
    const nascimento = new Date(1988 + (i % 10), (i % 11), 5 + i);
    const participante = await prisma.user.upsert({
      where: { cpf },
      update: {
        nome,
        usuario: `cliente${i + 1}`,
        celular: `1197777${String(1000 + i)}`,
        dataNasc: nascimento,
        email: `cliente${i + 1}@demo.local`,
        senhaHash: sharedPasswordHash,
        role: "participante",
        primeiroAcesso: false,
        ativo: true,
      },
      create: {
        nome,
        cpf,
        usuario: `cliente${i + 1}`,
        celular: `1197777${String(1000 + i)}`,
        dataNasc: nascimento,
        email: `cliente${i + 1}@demo.local`,
        senhaHash: sharedPasswordHash,
        role: "participante",
        primeiroAcesso: false,
        ativo: true,
      },
    });
    participantes.push(participante);
  }

  const oldRaffles = await prisma.raffle.findMany({
    where: { slug: { in: DEMO_RAFFLES.map((r) => r.slug) } },
    select: { id: true },
  });
  const oldIds = oldRaffles.map((r) => r.id);
  if (oldIds.length > 0) {
    await prisma.entry.deleteMany({ where: { raffleId: { in: oldIds } } });
    await prisma.coupon.deleteMany({ where: { raffleId: { in: oldIds } } });
    await prisma.raffleLoja.deleteMany({ where: { raffleId: { in: oldIds } } });
    await prisma.raffle.deleteMany({ where: { id: { in: oldIds } } });
  }

  for (let r = 0; r < DEMO_RAFFLES.length; r++) {
    const demo = DEMO_RAFFLES[r];
    const status = demo.status;
    const totalNumeros = 250 + r * 25;
    const dataHoraSorteio =
      status === "ativo" ? daysFromNow(10 + r) : daysFromNow(-(5 + r));
    const prazoResgate =
      status === "ativo" ? daysFromNow(4 + r) : daysFromNow(-(8 + r));

    const raffle = await prisma.raffle.create({
      data: {
        nome: demo.nome,
        slug: demo.slug,
        premio: demo.premio,
        premioValorCentavos: demo.valor,
        totalNumeros,
        dataHoraSorteio,
        prazoResgate,
        status,
        animacao: r % 2 === 0 ? "tambor" : "caca_niquel",
        imagemUrl: `https://picsum.photos/seed/${demo.slug}/800/600`,
        criadoPorId: admin.id,
      },
    });

    await prisma.raffleLoja.createMany({
      data: stores.map((s) => ({ raffleId: raffle.id, lojaId: s.id })),
      skipDuplicates: true,
    });

    const usedNumbers = new Set<number>();
    const raffleEntries: Array<{ numero: number; participanteId: string }> = [];

    for (let c = 0; c < 8; c++) {
      const participante = participantes[(r + c) % participantes.length];
      const colaborador = colaboradores[c % colaboradores.length];
      const qtdNumeros = 2 + ((r + c) % 4);
      const couponStatus = pickCouponStatus(status, c);
      const codigo = await generateCouponCode(demo.slug, c + 1);
      const hmacSig = signCoupon(codigo, raffle.id);
      const createdAt = daysFromNow(-(12 - r) + c);

      const coupon = await prisma.coupon.create({
        data: {
          codigo,
          hmacSig,
          raffleId: raffle.id,
          participanteId: participante.id,
          colaboradorId: colaborador.id,
          qtdNumeros,
          status: couponStatus,
          criadoEm: createdAt,
          resgatadoEm: couponStatus === "resgatado" ? daysFromNow(-(9 - r) + c) : null,
          ipGeracao: `192.168.0.${10 + c}`,
        },
      });

      if (couponStatus !== "resgatado") continue;

      const chosen: number[] = [];
      let attempts = 0;
      while (chosen.length < qtdNumeros && attempts < 5000) {
        const num = 1 + Math.floor(Math.random() * totalNumeros);
        if (!usedNumbers.has(num)) {
          usedNumbers.add(num);
          chosen.push(num);
        }
        attempts++;
      }

      for (const numero of chosen) {
        await prisma.entry.create({
          data: {
            raffleId: raffle.id,
            participanteId: participante.id,
            couponId: coupon.id,
            numero,
            criadoEm: daysFromNow(-(7 - r)),
          },
        });
        raffleEntries.push({ numero, participanteId: participante.id });
      }
    }

    if (status === "sorteado" && raffleEntries.length > 0) {
      const winner = raffleEntries[Math.floor(raffleEntries.length / 2)];
      await prisma.raffle.update({
        where: { id: raffle.id },
        data: {
          ganhadorId: winner.participanteId,
          numeroVencedor: winner.numero,
          sorteadoEm: daysFromNow(-2),
          sorteadoPorIp: "203.0.113.10",
        },
      });
    }
  }

  const [participantsCount, rafflesCount, couponsCount, entriesCount] = await Promise.all([
    prisma.user.count({ where: { role: "participante" } }),
    prisma.raffle.count(),
    prisma.coupon.count(),
    prisma.entry.count(),
  ]);

  console.log("[seed:demo] concluído com sucesso");
  console.log(`[seed:demo] participantes: ${participantsCount}`);
  console.log(`[seed:demo] sorteios: ${rafflesCount}`);
  console.log(`[seed:demo] cupons: ${couponsCount}`);
  console.log(`[seed:demo] números resgatados (entries): ${entriesCount}`);
  console.log("[seed:demo] senha padrão para usuários demo: demo123");
}

main()
  .catch((err) => {
    console.error("[seed:demo] erro:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
