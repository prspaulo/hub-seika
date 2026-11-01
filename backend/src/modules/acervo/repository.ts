import type { Prisma } from "@prisma/client";
import { prisma } from "../../shared/prisma.js";
import type { ListMateriaisQuery } from "./types.js";

export const acervoRepository = {
  list({ search, area }: ListMateriaisQuery) {
    const where: Prisma.MaterialAcervoWhereInput = {
      ...(area ? { area } : {}),
      ...(search
        ? {
            OR: [
              { titulo: { contains: search, mode: "insensitive" } },
              { categoria: { contains: search, mode: "insensitive" } },
            ],
          }
        : {}),
    };
    return prisma.materialAcervo.findMany({ where, orderBy: { createdAt: "desc" } });
  },

  listAreas() {
    return prisma.materialAcervo.findMany({ distinct: ["area"], select: { area: true } });
  },

  findById(id: string) {
    return prisma.materialAcervo.findUnique({ where: { id } });
  },

  create(data: Prisma.MaterialAcervoCreateInput) {
    return prisma.materialAcervo.create({ data });
  },

  update(id: string, data: Prisma.MaterialAcervoUpdateInput) {
    return prisma.materialAcervo.update({ where: { id }, data });
  },

  delete(id: string) {
    return prisma.materialAcervo.delete({ where: { id } });
  },
};
