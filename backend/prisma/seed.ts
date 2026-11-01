import crypto from "node:crypto";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

// E-mails placeholder — ajuste para os reais depois (ainda não há endpoint
// de edição de cadastro; troque direto no banco ou aguarde o módulo de admin).
const SOCIOS = [
  { name: "Paulo Gomes", email: "paulo.gomes@seika.com.br" },
  { name: "Milton Araújo", email: "milton.araujo@seika.com.br" },
  { name: "Paulo Rodrigues", email: "paulo.rodrigues@seika.com.br" },
];

async function main() {
  for (const socio of SOCIOS) {
    const existing = await prisma.user.findUnique({ where: { email: socio.email } });
    if (existing) {
      console.log(`Já existe: ${socio.email}`);
      continue;
    }
    const tempPassword = crypto.randomBytes(9).toString("base64url");
    const passwordHash = await bcrypt.hash(tempPassword, 12);
    await prisma.user.create({
      data: { name: socio.name, email: socio.email, passwordHash, role: "SOCIO" },
    });
    console.log(
      `Criado ${socio.email} — senha temporária: ${tempPassword} (troque via PATCH /api/v1/auth/password depois do primeiro login)`,
    );
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
