import type { Cobranca, FormaPagamento, StatusCobranca, TipoCobranca } from "@prisma/client";
import type { Db } from "../../shared/prisma.js";
import { AppError, NotFoundError } from "../../shared/errors.js";
import { toCentavos } from "../../shared/money.js";
import { chaveMensal, competenciaAtual, vencimentoDaCompetencia } from "../../shared/competencia.js";
import { empresasService } from "../clientes/service.js";
import { cobrancasRepository, mensalidadesRepository } from "./repository.js";
import { auditLog } from "./audit.js";
import type {
  CreateCobrancaInput,
  EstornoInput,
  ListCobrancasQuery,
  RegistrarPagamentoInput,
} from "./types.js";

export type CobrancaView = {
  id: string;
  virtual: boolean;
  empresaId: string;
  processoId: string | null;
  descricao: string;
  valorCentavos: number;
  vencimento: Date;
  tipo: TipoCobranca;
  chaveMensal: string | null;
  status: StatusCobranca;
  statusComputado: "PENDENTE" | "PAGO" | "ATRASADO";
  valorPagoCentavos: number | null;
  pagoEm: Date | null;
  formaPagamento: FormaPagamento | null;
  coraStatus: string | null;
  createdAt: Date;
};

function computarStatus(status: StatusCobranca, vencimento: Date): "PENDENTE" | "PAGO" | "ATRASADO" {
  if (status === "PAGO") return "PAGO";
  return vencimento < new Date() ? "ATRASADO" : "PENDENTE";
}

function toView(c: Cobranca): CobrancaView {
  return {
    id: c.id,
    virtual: false,
    empresaId: c.empresaId,
    processoId: c.processoId,
    descricao: c.descricao,
    valorCentavos: c.valorCentavos,
    vencimento: c.vencimento,
    tipo: c.tipo,
    chaveMensal: c.chaveMensal,
    status: c.status,
    statusComputado: computarStatus(c.status, c.vencimento),
    valorPagoCentavos: c.valorPagoCentavos,
    pagoEm: c.pagoEm,
    formaPagamento: c.formaPagamento,
    coraStatus: c.coraStatus,
    createdAt: c.createdAt,
  };
}

// Réplica de `bills()` do sistema antigo: a mensalidade do mês corrente só
// vira uma cobrança real quando alguém a toca (pagamento/estorno). Até lá
// ela só existe "virtualmente" aqui, pra aparecer nas listagens/resumos.
async function gerarMensalidadesVirtuais(): Promise<CobrancaView[]> {
  const competencia = competenciaAtual();
  const ativas = await mensalidadesRepository.listAtivas();
  const virtuais: CobrancaView[] = [];

  for (const mensalidade of ativas) {
    const chave = chaveMensal(mensalidade.empresaId, competencia);
    const existente = await cobrancasRepository.findByChaveMensal(chave);
    if (existente) continue;

    virtuais.push({
      id: `virtual:${chave}`,
      virtual: true,
      empresaId: mensalidade.empresaId,
      processoId: null,
      descricao: `Honorário mensal • ${competencia}`,
      valorCentavos: mensalidade.valorCentavos,
      vencimento: vencimentoDaCompetencia(competencia, mensalidade.diaVencimento),
      tipo: "MENSAL",
      chaveMensal: chave,
      status: "PENDENTE",
      statusComputado: computarStatus("PENDENTE", vencimentoDaCompetencia(competencia, mensalidade.diaVencimento)),
      valorPagoCentavos: null,
      pagoEm: null,
      formaPagamento: null,
      coraStatus: null,
      createdAt: new Date(),
    });
  }

  return virtuais;
}

async function materializar(id: string, actorId: string): Promise<Cobranca> {
  if (!id.startsWith("virtual:")) {
    const cobranca = await cobrancasRepository.findById(id);
    if (!cobranca) throw new NotFoundError("Cobrança");
    return cobranca;
  }

  const chave = id.slice("virtual:".length);
  const existente = await cobrancasRepository.findByChaveMensal(chave);
  if (existente) return existente;

  const [, empresaId, competencia] = chave.split(":");
  const mensalidade = await mensalidadesRepository.findByEmpresa(empresaId);
  if (!mensalidade || !mensalidade.ativo) throw new NotFoundError("Cobrança");

  const cobranca = await cobrancasRepository.create({
    empresaId,
    descricao: `Honorário mensal • ${competencia}`,
    valorCentavos: mensalidade.valorCentavos,
    vencimento: vencimentoDaCompetencia(competencia, mensalidade.diaVencimento),
    tipo: "MENSAL",
    chaveMensal: chave,
    status: "PENDENTE",
    createdBy: actorId,
  });
  await auditLog.append("Cobranca", cobranca.id, "GEROU_MENSALIDADE", actorId, { competencia });
  return cobranca;
}

export const cobrancasService = {
  async list(query: ListCobrancasQuery) {
    const [reais, virtuais] = await Promise.all([
      cobrancasRepository.findMany({
        ...(query.empresaId ? { empresaId: query.empresaId } : {}),
        ...(query.tipo ? { tipo: query.tipo } : {}),
      }),
      gerarMensalidadesVirtuais(),
    ]);

    let items = [...reais.map(toView), ...virtuais].sort(
      (a, b) => a.vencimento.getTime() - b.vencimento.getTime(),
    );

    if (query.empresaId) items = items.filter((i) => i.empresaId === query.empresaId);
    if (query.tipo) items = items.filter((i) => i.tipo === query.tipo);
    if (query.status) items = items.filter((i) => i.statusComputado === query.status);

    const total = items.length;
    const start = (query.page - 1) * query.pageSize;
    return { items: items.slice(start, start + query.pageSize), total, page: query.page, pageSize: query.pageSize };
  },

  async criar(input: CreateCobrancaInput, actorId: string) {
    await empresasService.getById(input.empresaId);

    const chave = input.tipo === "MENSAL" && input.competencia
      ? chaveMensal(input.empresaId, input.competencia)
      : undefined;

    if (chave) {
      const existente = await cobrancasRepository.findByChaveMensal(chave);
      if (existente) throw new AppError("Mensalidade já registrada para esta competência", 409, "MENSALIDADE_DUPLICADA");
    }

    const cobranca = await cobrancasRepository.create({
      empresaId: input.empresaId,
      descricao: input.descricao,
      valorCentavos: toCentavos(input.valor),
      vencimento: input.vencimento,
      tipo: input.tipo,
      chaveMensal: chave,
      createdBy: actorId,
    });
    await auditLog.append("Cobranca", cobranca.id, "CRIOU_COBRANCA", actorId, { descricao: input.descricao });
    return toView(cobranca);
  },

  // Chamado pelo módulo Processos ao cadastrar um serviço com cobrança vinculada.
  async criarDeProcesso(input: {
    empresaId: string;
    processoId: string;
    descricao: string;
    valorCentavos: number;
    vencimento: Date;
    coraSolicitado: boolean;
  }, actorId: string, db?: Db) {
    const cobranca = await cobrancasRepository.create(
      {
        empresaId: input.empresaId,
        processoId: input.processoId,
        descricao: input.descricao,
        valorCentavos: input.valorCentavos,
        vencimento: input.vencimento,
        tipo: "ESPORADICO",
        coraSolicitado: input.coraSolicitado,
        coraStatus: input.coraSolicitado ? "Pendente de integração" : "Não solicitado",
        createdBy: actorId,
      },
      db,
    );
    await auditLog.append(
      "Cobranca",
      cobranca.id,
      "CRIOU_COBRANCA_DE_PROCESSO",
      actorId,
      { processoId: input.processoId },
      db,
    );
    return cobranca;
  },

  async registrarPagamento(id: string, input: RegistrarPagamentoInput, actorId: string) {
    const cobranca = await materializar(id, actorId);
    if (cobranca.status === "PAGO") {
      throw new AppError("Cobrança já está paga — registre um estorno antes de alterar.", 409, "JA_PAGA");
    }
    const valorPagoCentavos = toCentavos(input.valor);
    if (valorPagoCentavos !== cobranca.valorCentavos) {
      throw new AppError(
        "Para pagamento parcial, divida a cobrança em lançamentos antes de quitar.",
        400,
        "PAGAMENTO_PARCIAL_NAO_SUPORTADO",
      );
    }

    const atualizado = await cobrancasRepository.update(cobranca.id, {
      status: "PAGO",
      valorPagoCentavos,
      pagoEm: input.pagoEm,
      formaPagamento: input.formaPagamento,
      observacao: input.observacao,
      recebidoPor: actorId,
    });
    await auditLog.append("Cobranca", cobranca.id, "REGISTROU_PAGAMENTO", actorId, {
      valor: input.valor,
      formaPagamento: input.formaPagamento,
    });
    return toView(atualizado);
  },

  async estornar(id: string, input: EstornoInput, actorId: string) {
    const cobranca = await cobrancasRepository.findById(id);
    if (!cobranca) throw new NotFoundError("Cobrança");
    if (cobranca.status !== "PAGO") {
      throw new AppError("Cobrança não está paga — não há o que estornar.", 400, "NAO_PAGA");
    }

    const atualizado = await cobrancasRepository.update(id, {
      status: "PENDENTE",
      estornoMotivo: input.motivo,
      estornoPor: actorId,
      estornoEm: new Date(),
      estornoPagoEmAnterior: cobranca.pagoEm,
      valorPagoCentavos: null,
      pagoEm: null,
      formaPagamento: null,
    });
    await auditLog.append("Cobranca", id, "ESTORNOU_PAGAMENTO", actorId, { motivo: input.motivo });
    return toView(atualizado);
  },

  async resumo() {
    const { items } = await this.list({ page: 1, pageSize: 100000 });
    const recebido = items
      .filter((i) => i.statusComputado === "PAGO")
      .reduce((sum, i) => sum + (i.valorPagoCentavos ?? i.valorCentavos), 0);
    const aReceber = items
      .filter((i) => i.statusComputado !== "PAGO")
      .reduce((sum, i) => sum + i.valorCentavos, 0);
    const atrasado = items
      .filter((i) => i.statusComputado === "ATRASADO")
      .reduce((sum, i) => sum + i.valorCentavos, 0);
    return { recebidoCentavos: recebido, aReceberCentavos: aReceber, atrasadoCentavos: atrasado };
  },

  async saldoAberto(empresaId: string) {
    const reais = await cobrancasRepository.findMany({ empresaId, status: "PENDENTE" });
    return reais.reduce((sum, c) => sum + c.valorCentavos, 0);
  },

  // "Saídas de clientes": como o módulo Clientes ainda não guarda data de
  // saída, usamos status=INATIVA como proxy (empresa desativada na Fase 2).
  async saidasClientes() {
    const { items: empresas } = await empresasService.list({ status: "INATIVA", page: 1, pageSize: 1000 });
    return Promise.all(
      empresas.map(async (empresa) => ({
        empresaId: empresa.id,
        razaoSocial: empresa.razaoSocial,
        status: empresa.status,
        saldoAbertoCentavos: await this.saldoAberto(empresa.id),
      })),
    );
  },
};
