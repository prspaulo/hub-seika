import { NotFoundError } from "../../shared/errors.js";
import { empresasService } from "../clientes/service.js";
import { authService } from "../auth/service.js";
import { obrigacoesRepository } from "./repository.js";
import type { CreateObrigacaoInput, ListObrigacoesQuery, UpdateObrigacaoInput } from "./types.js";

export const obrigacoesService = {
  list(query: ListObrigacoesQuery) {
    return obrigacoesRepository.list(query);
  },

  async getById(id: string) {
    const obrigacao = await obrigacoesRepository.findById(id);
    if (!obrigacao) throw new NotFoundError("Obrigação");
    return obrigacao;
  },

  async create(input: CreateObrigacaoInput, actorId: string) {
    if (input.empresaId) await empresasService.getById(input.empresaId);
    await authService.ensureUserExists(input.owner);

    return obrigacoesRepository.create({
      empresaId: input.empresaId,
      owner: input.owner,
      titulo: input.titulo,
      prazo: input.prazo,
      status: input.status,
      notas: input.notas,
      createdBy: actorId,
      updatedBy: actorId,
    });
  },

  async update(id: string, input: UpdateObrigacaoInput, actorId: string) {
    await this.getById(id);
    if (input.empresaId) await empresasService.getById(input.empresaId);
    if (input.owner) await authService.ensureUserExists(input.owner);

    return obrigacoesRepository.update(id, { ...input, updatedBy: actorId });
  },

  async delete(id: string) {
    await this.getById(id);
    await obrigacoesRepository.delete(id);
  },
};
