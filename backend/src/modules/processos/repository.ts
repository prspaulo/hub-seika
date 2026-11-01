import type { Prisma } from "@prisma/client";
import { prisma, type Db } from "../../shared/prisma.js";
import type { ListObrigacoesQuery, ListProcessosQuery } from "./types.js";

export const processosRepository = {
  async list({ empresaId, owner, status, setor, page, pageSize }: ListProcessosQuery) {
    const where: Prisma.ProcessoWhereInput = {
      ...(empresaId ? { empresaId } : {}),
      ...(owner ? { owner } : {}),
      ...(status ? { status } : {}),
      ...(setor ? { setor } : {}),
    };

    const [items, total] = await Promise.all([
      prisma.processo.findMany({
        where,
        orderBy: { prazo: "asc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.processo.count({ where }),
    ]);

    return { items, total, page, pageSize };
  },

  findById(id: string) {
    return prisma.processo.findUnique({ where: { id } });
  },

  create(data: Prisma.ProcessoCreateInput, db: Db = prisma) {
    return db.processo.create({ data });
  },

  update(id: string, data: Prisma.ProcessoUpdateInput) {
    return prisma.processo.update({ where: { id }, data });
  },
};

export const obrigacoesRepository = {
  async list({ empresaId, owner, status, search, page, pageSize }: ListObrigacoesQuery) {
    const where: Prisma.ObrigacaoWhereInput = {
      ...(empresaId ? { empresaId } : {}),
      ...(owner ? { owner } : {}),
      ...(status ? { status } : {}),
      ...(search ? { titulo: { contains: search, mode: "insensitive" } } : {}),
    };

    const [items, total] = await Promise.all([
      prisma.obrigacao.findMany({
        where,
        orderBy: { prazo: "asc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.obrigacao.count({ where }),
    ]);

    return { items, total, page, pageSize };
  },

  findById(id: string) {
    return prisma.obrigacao.findUnique({ where: { id } });
  },

  create(data: Prisma.ObrigacaoCreateInput) {
    return prisma.obrigacao.create({ data });
  },

  update(id: string, data: Prisma.ObrigacaoUpdateInput) {
    return prisma.obrigacao.update({ where: { id }, data });
  },

  delete(id: string) {
    return prisma.obrigacao.delete({ where: { id } });
  },
};
