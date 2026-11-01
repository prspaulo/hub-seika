import { prisma } from "../../shared/prisma.js";
import { NotFoundError } from "../../shared/errors.js";
import { toCentavos } from "../../shared/money.js";
import { empresasService } from "../clientes/service.js";
import { authService } from "../auth/service.js";
import { cobrancasService } from "../financeiro/cobrancas-service.js";
import { processosRepository } from "./repository.js";
import type {
  CreateProcessoInput,
  ListProcessosQuery,
  UpdateProcessoInput,
} from "./types.js";

function calcValorFinalCentavos(
  valorInicialCentavos: number,
  descontoTipo: "REAIS" | "PERCENTUAL",
  descontoCentavos: number | null,
  descontoPercentual: number | null,
): number {
  if (descontoTipo === "PERCENTUAL") {
    const abatimento = Math.round((valorInicialCentavos * (descontoPercentual ?? 0)) / 100);
    return valorInicialCentavos - abatimento;
  }
  return valorInicialCentavos - (descontoCentavos ?? 0);
}

export const processosService = {
  list(query: ListProcessosQuery) {
    return processosRepository.list(query);
  },

  async getById(id: string) {
    const processo = await processosRepository.findById(id);
    if (!processo) throw new NotFoundError("Processo");
    return processo;
  },

  async create(input: CreateProcessoInput) {
    await empresasService.getById(input.empresaId);
    await authService.ensureUserExists(input.owner);

    const valorInicialCentavos = toCentavos(input.valorInicial);
    const descontoCentavos = input.descontoTipo === "REAIS" ? toCentavos(input.desconto) : null;
    const descontoPercentual = input.descontoTipo === "PERCENTUAL" ? input.desconto : null;
    const valorFinalCentavos = calcValorFinalCentavos(
      valorInicialCentavos,
      input.descontoTipo,
      descontoCentavos,
      descontoPercentual,
    );

    // Processo + cobrança vinculada são gravados na mesma transação: como
    // hoje vivem no mesmo banco físico (schemas diferentes), isso garante
    // atomicidade de verdade em vez de deixar os dois writes soltos.
    return prisma.$transaction(async (tx) => {
      const processo = await processosRepository.create(
        {
          empresaId: input.empresaId,
          owner: input.owner,
          setor: input.setor,
          nome: input.nome,
          status: input.status,
          valorInicialCentavos,
          descontoTipo: input.descontoTipo,
          descontoCentavos,
          descontoPercentual,
          valorFinalCentavos,
          prazo: input.prazo,
          vencimentoCobranca: input.vencimentoCobranca,
          descricao: input.descricao,
          coraSolicitado: input.coraSolicitado,
          createdBy: input.owner,
          concluidoEm: input.status === "CONCLUIDO" ? new Date() : null,
        },
        tx,
      );

      await cobrancasService.criarDeProcesso(
        {
          empresaId: processo.empresaId,
          processoId: processo.id,
          descricao: processo.nome,
          valorCentavos: processo.valorFinalCentavos,
          vencimento: processo.vencimentoCobranca,
          coraSolicitado: processo.coraSolicitado,
        },
        input.owner,
        tx,
      );

      return processo;
    });
  },

  async update(id: string, input: UpdateProcessoInput) {
    const processo = await this.getById(id);
    if (input.owner) await authService.ensureUserExists(input.owner);

    const concluidoEm =
      input.status === undefined
        ? undefined
        : input.status === "CONCLUIDO"
          ? (processo.concluidoEm ?? new Date())
          : null;

    return processosRepository.update(id, {
      ...input,
      ...(concluidoEm !== undefined ? { concluidoEm } : {}),
    });
  },
};
