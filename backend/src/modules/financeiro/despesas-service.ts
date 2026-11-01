import { toCentavos } from "../../shared/money.js";
import { despesasRepository } from "./repository.js";
import { auditLog } from "./audit.js";
import type { CreateDespesaInput } from "./types.js";

export const despesasService = {
  list() {
    return despesasRepository.list();
  },

  async criar(input: CreateDespesaInput, actorId: string) {
    const despesa = await despesasRepository.create({
      descricao: input.descricao,
      categoria: input.categoria,
      valorCentavos: toCentavos(input.valor),
      competencia: input.competencia,
      status: input.status,
      createdBy: actorId,
    });
    await auditLog.append("Despesa", despesa.id, "CRIOU_DESPESA", actorId, { descricao: input.descricao });
    return despesa;
  },

  async totalPagasCentavos() {
    const result = await despesasRepository.totalPagas();
    return result._sum.valorCentavos ?? 0;
  },
};
