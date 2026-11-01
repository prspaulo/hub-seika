import type { Prisma } from "@prisma/client";
import { prisma, type Db } from "../../shared/prisma.js";

export const cobrancasRepository = {
  findMany(where: Prisma.CobrancaWhereInput) {
    return prisma.cobranca.findMany({ where, orderBy: { vencimento: "asc" } });
  },

  findById(id: string) {
    return prisma.cobranca.findUnique({ where: { id } });
  },

  findByChaveMensal(chave: string) {
    return prisma.cobranca.findUnique({ where: { chaveMensal: chave } });
  },

  create(data: Prisma.CobrancaCreateInput, db: Db = prisma) {
    return db.cobranca.create({ data });
  },

  update(id: string, data: Prisma.CobrancaUpdateInput) {
    return prisma.cobranca.update({ where: { id }, data });
  },
};

export const mensalidadesRepository = {
  findByEmpresa(empresaId: string) {
    return prisma.mensalidade.findUnique({ where: { empresaId } });
  },

  listAtivas() {
    return prisma.mensalidade.findMany({ where: { ativo: true } });
  },

  upsert(empresaId: string, data: Omit<Prisma.MensalidadeCreateInput, "empresaId">) {
    return prisma.mensalidade.upsert({
      where: { empresaId },
      create: { ...data, empresaId },
      update: data,
    });
  },
};

export const despesasRepository = {
  list() {
    return prisma.despesa.findMany({ orderBy: { competencia: "desc" } });
  },

  create(data: Prisma.DespesaCreateInput) {
    return prisma.despesa.create({ data });
  },

  totalPagas() {
    return prisma.despesa.aggregate({
      where: { status: "PAGO" },
      _sum: { valorCentavos: true },
    });
  },
};

export const auditLogRepository = {
  append(data: Prisma.AuditLogFinanceiroCreateInput, db: Db = prisma) {
    return db.auditLogFinanceiro.create({ data });
  },

  list(entidadeId?: string) {
    return prisma.auditLogFinanceiro.findMany({
      where: entidadeId ? { entidadeId } : undefined,
      orderBy: { createdAt: "desc" },
      take: 200,
    });
  },
};
