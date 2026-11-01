import { Prisma } from "@prisma/client";
import { AppError, NotFoundError } from "../../shared/errors.js";
import { empresasRepository } from "./repository.js";
import type {
  CreateEmpresaInput,
  CreateLicencaInput,
  ListEmpresasQuery,
  UpdateEmpresaInput,
  UpdateLicencaInput,
} from "./types.js";

function isUniqueConstraintError(error: unknown): boolean {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002";
}

export const empresasService = {
  list(query: ListEmpresasQuery) {
    return empresasRepository.list(query);
  },

  async getById(id: string) {
    const empresa = await empresasRepository.findById(id);
    if (!empresa) throw new NotFoundError("Empresa");
    return empresa;
  },

  async create(input: CreateEmpresaInput) {
    try {
      return await empresasRepository.create({
        razaoSocial: input.razaoSocial,
        nomeFantasia: input.nomeFantasia,
        cnpj: input.cnpj,
        email: input.email,
        telefone: input.telefone,
      });
    } catch (error) {
      if (isUniqueConstraintError(error)) {
        throw new AppError("CNPJ já cadastrado", 409, "CNPJ_DUPLICADO");
      }
      throw error;
    }
  },

  async update(id: string, input: UpdateEmpresaInput) {
    await this.getById(id);
    return empresasRepository.update(id, input);
  },

  async softDelete(id: string) {
    await this.getById(id);
    return empresasRepository.setStatus(id, "INATIVA");
  },

  async addLicenca(empresaId: string, input: CreateLicencaInput) {
    await this.getById(empresaId);
    return empresasRepository.createLicenca(empresaId, input);
  },

  async updateLicenca(empresaId: string, licencaId: string, input: UpdateLicencaInput) {
    const licenca = await empresasRepository.findLicencaById(licencaId);
    if (!licenca || licenca.empresaId !== empresaId) throw new NotFoundError("Licença");
    return empresasRepository.updateLicenca(licencaId, input);
  },

  async deleteLicenca(empresaId: string, licencaId: string) {
    const licenca = await empresasRepository.findLicencaById(licencaId);
    if (!licenca || licenca.empresaId !== empresaId) throw new NotFoundError("Licença");
    await empresasRepository.deleteLicenca(licencaId);
  },

  listAllLicencas() {
    return empresasRepository.listAllLicencasComEmpresa();
  },
};
