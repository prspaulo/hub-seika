import { Prisma, type Setor } from "@prisma/client";
import { authService } from "../auth/service.js";
import { responsaveisDepartamentoRepository } from "./repository.js";
import type { SetResponsavelDepartamentoInput } from "./types.js";

function isNotFoundError(error: unknown): boolean {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025";
}

export const responsaveisDepartamentoService = {
  list() {
    return responsaveisDepartamentoRepository.list();
  },

  async set(departamento: Setor, input: SetResponsavelDepartamentoInput, actorId: string) {
    await authService.ensureUserExists(input.ownerId);
    return responsaveisDepartamentoRepository.upsert(departamento, input.ownerId, actorId);
  },

  async remove(departamento: Setor) {
    try {
      await responsaveisDepartamentoRepository.delete(departamento);
    } catch (error) {
      if (!isNotFoundError(error)) throw error;
    }
  },
};
