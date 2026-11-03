import { Prisma } from "@prisma/client";
import { AppError, NotFoundError } from "../../shared/errors.js";
import { obrigacaoTemplatesRepository } from "./repository.js";
import type {
  CreateObrigacaoTemplateInput,
  ListObrigacaoTemplatesQuery,
  UpdateObrigacaoTemplateInput,
} from "./types.js";

function isUniqueConstraintError(error: unknown): boolean {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002";
}

export const obrigacaoTemplatesService = {
  list(query: ListObrigacaoTemplatesQuery) {
    return obrigacaoTemplatesRepository.list(query);
  },

  async getById(id: string) {
    const template = await obrigacaoTemplatesRepository.findById(id);
    if (!template) throw new NotFoundError("Template de obrigação");
    return template;
  },

  async create(input: CreateObrigacaoTemplateInput) {
    try {
      return await obrigacaoTemplatesRepository.create(input);
    } catch (error) {
      if (isUniqueConstraintError(error)) {
        throw new AppError("Código já cadastrado", 409, "CODIGO_DUPLICADO");
      }
      throw error;
    }
  },

  async update(id: string, input: UpdateObrigacaoTemplateInput) {
    await this.getById(id);
    return obrigacaoTemplatesRepository.update(id, input);
  },

  async delete(id: string) {
    await this.getById(id);
    await obrigacaoTemplatesRepository.delete(id);
  },
};
