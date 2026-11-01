import { Prisma, PrismaClient } from "@prisma/client";

export const prisma = new PrismaClient();

// Aceito por funções de repositório que podem rodar dentro de uma transação
// (prisma.$transaction) ou direto no client singleton — mesma assinatura.
export type Db = PrismaClient | Prisma.TransactionClient;
