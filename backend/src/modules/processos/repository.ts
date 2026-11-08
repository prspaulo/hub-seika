import type { Prisma, Setor } from "@prisma/client";
import { prisma, type Db } from "../../shared/prisma.js";
import type { ListObrigacaoTemplatesQuery, ListObrigacoesQuery, ListProcessosQuery } from "./types.js";

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
  async list({ empresaId, owner, status, competencia, departamento, search, page, pageSize }: ListObrigacoesQuery) {
    const where: Prisma.ObrigacaoWhereInput = {
      ...(empresaId ? { empresaId } : {}),
      ...(owner ? { owner } : {}),
      ...(status ? { status } : {}),
      ...(competencia ? { competencia } : {}),
      ...(departamento ? { departamento } : {}),
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

  findByChaveGeracao(chaveGeracao: string) {
    return prisma.obrigacao.findUnique({ where: { chaveGeracao } });
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

export const obrigacaoTemplatesRepository = {
  list({ ativo, regime, atividade, search }: ListObrigacaoTemplatesQuery) {
    const where: Prisma.ObrigacaoTemplateWhereInput = {
      ...(ativo !== undefined ? { ativo } : {}),
      ...(regime ? { regimesAplicaveis: { has: regime } } : {}),
      ...(atividade ? { atividadesAplicaveis: { has: atividade } } : {}),
      ...(search
        ? {
            OR: [
              { nome: { contains: search, mode: "insensitive" } },
              { codigo: { contains: search, mode: "insensitive" } },
            ],
          }
        : {}),
    };
    return prisma.obrigacaoTemplate.findMany({ where, orderBy: [{ grupo: "asc" }, { nome: "asc" }] });
  },

  findById(id: string) {
    return prisma.obrigacaoTemplate.findUnique({ where: { id } });
  },

  create(data: Prisma.ObrigacaoTemplateCreateInput) {
    return prisma.obrigacaoTemplate.create({ data });
  },

  update(id: string, data: Prisma.ObrigacaoTemplateUpdateInput) {
    return prisma.obrigacaoTemplate.update({ where: { id }, data });
  },

  delete(id: string) {
    return prisma.obrigacaoTemplate.delete({ where: { id } });
  },
};

export const responsaveisDepartamentoRepository = {
  list() {
    return prisma.responsavelDepartamento.findMany({ orderBy: { departamento: "asc" } });
  },

  upsert(departamento: Setor, ownerId: string, actorId: string) {
    return prisma.responsavelDepartamento.upsert({
      where: { departamento },
      create: { departamento, ownerId, updatedBy: actorId },
      update: { ownerId, updatedBy: actorId },
    });
  },

  delete(departamento: Setor) {
    return prisma.responsavelDepartamento.delete({ where: { departamento } });
  },
};
