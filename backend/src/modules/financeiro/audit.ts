import type { Db } from "../../shared/prisma.js";
import { auditLogRepository } from "./repository.js";

export const auditLog = {
  append(entidade: string, entidadeId: string, acao: string, ator: string, detalhes?: object, db?: Db) {
    return auditLogRepository.append(
      {
        entidade,
        entidadeId,
        acao,
        ator,
        detalhes: detalhes ?? undefined,
      },
      db,
    );
  },

  list(entidadeId?: string) {
    return auditLogRepository.list(entidadeId);
  },
};
