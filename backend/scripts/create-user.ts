import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

// Mesmo custo de hash usado em authService.changePassword — manter igual pra
// não ter senhas com força de hash inconsistente entre usuários.
const PASSWORD_HASH_ROUNDS = 12;
const ROLES = ["SOCIO", "FUNCIONARIO", "CLIENTE"] as const;

async function main() {
  const [name, email, password, roleArg] = process.argv.slice(2);
  const role = (roleArg ?? "SOCIO") as (typeof ROLES)[number];

  if (!name || !email || !password) {
    console.error("Uso: npm run create-user -- \"Nome Completo\" email@dominio.com.br SenhaForte [SOCIO|FUNCIONARIO|CLIENTE]");
    process.exit(1);
  }
  if (!ROLES.includes(role)) {
    console.error(`Role inválida: ${role}. Use uma de: ${ROLES.join(", ")}`);
    process.exit(1);
  }
  if (password.length < 8) {
    console.error("A senha deve ter pelo menos 8 caracteres.");
    process.exit(1);
  }

  const passwordHash = await bcrypt.hash(password, PASSWORD_HASH_ROUNDS);

  const user = await prisma.user.upsert({
    where: { email },
    create: { name, email, passwordHash, role },
    update: { name, passwordHash, role },
  });

  console.log(`OK: ${user.email} (${user.role}) — id ${user.id}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
