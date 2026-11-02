import type { Prisma } from "@prisma/client";
import { prisma, type Db } from "../../shared/prisma.js";
import type { ListEmpresasQuery } from "./types.js";

export const empresasRepository = {
  async list({ search, status, page, pageSize }: ListEmpresasQuery) {
    const where: Prisma.EmpresaWhereInput = {
      ...(status ? { status } : {}),
      ...(search
        ? {
            OR: [
              { razaoSocial: { contains: search, mode: "insensitive" } },
              { nomeFantasia: { contains: search, mode: "insensitive" } },
              { cnpj: { contains: search.replace(/\D/g, "") } },
            ],
          }
        : {}),
    };

    const [items, total] = await Promise.all([
      prisma.empresa.findMany({
        where,
        orderBy: { razaoSocial: "asc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.empresa.count({ where }),
    ]);

    return { items, total, page, pageSize };
  },

  findById(id: string) {
    return prisma.empresa.findUnique({
      where: { id },
      include: { licencas: true, sociosAdministradores: true, filiais: true },
    });
  },

  findByCnpj(cnpj: string) {
    return prisma.empresa.findUnique({ where: { cnpj } });
  },

  // Usado pela visão de Legalização, que precisa das licenças de todas as
  // empresas de uma vez (não paginado — volume baixo, uso interno).
  listAllLicencasComEmpresa() {
    return prisma.licenca.findMany({
      include: { empresa: { select: { id: true, razaoSocial: true, status: true } } },
      orderBy: { validade: "asc" },
    });
  },

  create(data: Prisma.EmpresaCreateInput, db: Db = prisma) {
    return db.empresa.create({ data });
  },

  update(id: string, data: Prisma.EmpresaUpdateInput) {
    return prisma.empresa.update({ where: { id }, data });
  },

  setStatus(id: string, status: "ATIVA" | "INATIVA" | "SUSPENSA") {
    return prisma.empresa.update({ where: { id }, data: { status } });
  },

  createLicenca(empresaId: string, data: Prisma.LicencaCreateWithoutEmpresaInput) {
    return prisma.licenca.create({ data: { ...data, empresaId } });
  },

  findLicencaById(id: string) {
    return prisma.licenca.findUnique({ where: { id } });
  },

  updateLicenca(id: string, data: Prisma.LicencaUpdateInput) {
    return prisma.licenca.update({ where: { id }, data });
  },

  deleteLicenca(id: string) {
    return prisma.licenca.delete({ where: { id } });
  },

  createSocioAdministrador(empresaId: string, data: Prisma.SocioAdministradorCreateWithoutEmpresaInput) {
    return prisma.socioAdministrador.create({ data: { ...data, empresaId } });
  },

  findSocioAdministradorById(id: string) {
    return prisma.socioAdministrador.findUnique({ where: { id } });
  },

  updateSocioAdministrador(id: string, data: Prisma.SocioAdministradorUpdateInput) {
    return prisma.socioAdministrador.update({ where: { id }, data });
  },

  deleteSocioAdministrador(id: string) {
    return prisma.socioAdministrador.delete({ where: { id } });
  },

  createFilial(empresaId: string, data: Prisma.FilialCreateWithoutEmpresaInput) {
    return prisma.filial.create({ data: { ...data, empresaId } });
  },

  findFilialById(id: string) {
    return prisma.filial.findUnique({ where: { id } });
  },

  updateFilial(id: string, data: Prisma.FilialUpdateInput) {
    return prisma.filial.update({ where: { id }, data });
  },

  deleteFilial(id: string) {
    return prisma.filial.delete({ where: { id } });
  },
};
