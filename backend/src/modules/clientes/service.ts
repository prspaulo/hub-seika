import { Prisma } from "@prisma/client";
import { AppError, NotFoundError } from "../../shared/errors.js";
import { prisma, type Db } from "../../shared/prisma.js";
import { toCentavos } from "../../shared/money.js";
import { empresasRepository } from "./repository.js";
import type {
  CreateEmpresaInput,
  CreateFilialInput,
  CreateLicencaInput,
  CreateSocioAdministradorInput,
  ListEmpresasQuery,
  UpdateEmpresaInput,
  UpdateFilialInput,
  UpdateLicencaInput,
  UpdateSocioAdministradorInput,
} from "./types.js";

function isUniqueConstraintError(error: unknown): boolean {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002";
}

function serializeEmpresaInput<T extends { capitalSocial?: number }>(input: T) {
  const { capitalSocial, ...rest } = input;
  return {
    ...rest,
    ...(capitalSocial !== undefined ? { capitalSocialCentavos: toCentavos(capitalSocial) } : {}),
  };
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

  async create(input: CreateEmpresaInput, db: Db = prisma) {
    try {
      return await empresasRepository.create(serializeEmpresaInput(input), db);
    } catch (error) {
      if (isUniqueConstraintError(error)) {
        throw new AppError("CNPJ já cadastrado", 409, "CNPJ_DUPLICADO");
      }
      throw error;
    }
  },

  async update(id: string, input: UpdateEmpresaInput) {
    await this.getById(id);
    return empresasRepository.update(id, serializeEmpresaInput(input));
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

  async addSocioAdministrador(empresaId: string, input: CreateSocioAdministradorInput) {
    await this.getById(empresaId);
    return empresasRepository.createSocioAdministrador(empresaId, input);
  },

  async updateSocioAdministrador(empresaId: string, socioId: string, input: UpdateSocioAdministradorInput) {
    const socio = await empresasRepository.findSocioAdministradorById(socioId);
    if (!socio || socio.empresaId !== empresaId) throw new NotFoundError("Sócio administrador");
    return empresasRepository.updateSocioAdministrador(socioId, input);
  },

  async deleteSocioAdministrador(empresaId: string, socioId: string) {
    const socio = await empresasRepository.findSocioAdministradorById(socioId);
    if (!socio || socio.empresaId !== empresaId) throw new NotFoundError("Sócio administrador");
    await empresasRepository.deleteSocioAdministrador(socioId);
  },

  async addFilial(empresaId: string, input: CreateFilialInput) {
    await this.getById(empresaId);
    return empresasRepository.createFilial(empresaId, input);
  },

  async updateFilial(empresaId: string, filialId: string, input: UpdateFilialInput) {
    const filial = await empresasRepository.findFilialById(filialId);
    if (!filial || filial.empresaId !== empresaId) throw new NotFoundError("Filial");
    return empresasRepository.updateFilial(filialId, input);
  },

  async deleteFilial(empresaId: string, filialId: string) {
    const filial = await empresasRepository.findFilialById(filialId);
    if (!filial || filial.empresaId !== empresaId) throw new NotFoundError("Filial");
    await empresasRepository.deleteFilial(filialId);
  },
};
