import type { FastifyInstance } from "fastify";
import { requireAuth, requireRole } from "../../shared/auth-guard.js";
import { fromCentavos } from "../../shared/money.js";
import { cobrancasService, type CobrancaView } from "./cobrancas-service.js";
import { despesasService } from "./despesas-service.js";
import { mensalidadesService } from "./mensalidades-service.js";
import { auditLog } from "./audit.js";
import {
  createCobrancaSchema,
  createDespesaSchema,
  estornoSchema,
  listCobrancasQuerySchema,
  mensalidadeSchema,
  registrarPagamentoSchema,
} from "./types.js";

const MANAGE_ROLES = ["SOCIO", "FUNCIONARIO"] as const;

function serializeCobranca(c: CobrancaView) {
  return {
    ...c,
    valor: fromCentavos(c.valorCentavos),
    valorPago: c.valorPagoCentavos === null ? null : fromCentavos(c.valorPagoCentavos),
  };
}

export async function financeiroRoutes(app: FastifyInstance) {
  app.addHook("preHandler", requireAuth);
  app.addHook("preHandler", requireRole(...MANAGE_ROLES));

  app.get("/cobrancas", async (request) => {
    const query = listCobrancasQuerySchema.parse(request.query);
    const result = await cobrancasService.list(query);
    return { ...result, items: result.items.map(serializeCobranca) };
  });

  app.post("/cobrancas", async (request, reply) => {
    const input = createCobrancaSchema.parse(request.body);
    const cobranca = await cobrancasService.criar(input, request.user.sub);
    reply.status(201);
    return serializeCobranca(cobranca);
  });

  app.post("/cobrancas/:id/pagamento", async (request) => {
    const { id } = request.params as { id: string };
    const input = registrarPagamentoSchema.parse(request.body);
    const cobranca = await cobrancasService.registrarPagamento(id, input, request.user.sub);
    return serializeCobranca(cobranca);
  });

  app.post("/cobrancas/:id/estorno", async (request) => {
    const { id } = request.params as { id: string };
    const input = estornoSchema.parse(request.body);
    const cobranca = await cobrancasService.estornar(id, input, request.user.sub);
    return serializeCobranca(cobranca);
  });

  app.get("/resumo", async () => {
    const resumo = await cobrancasService.resumo();
    const despesasPagasCentavos = await despesasService.totalPagasCentavos();
    return {
      recebido: fromCentavos(resumo.recebidoCentavos),
      aReceber: fromCentavos(resumo.aReceberCentavos),
      atrasado: fromCentavos(resumo.atrasadoCentavos),
      despesasPagas: fromCentavos(despesasPagasCentavos),
    };
  });

  app.get("/saidas-clientes", async () => {
    const saidas = await cobrancasService.saidasClientes();
    return saidas.map((s) => ({ ...s, saldoAberto: fromCentavos(s.saldoAbertoCentavos) }));
  });

  app.get("/despesas", async () => {
    const despesas = await despesasService.list();
    return despesas.map((d) => ({ ...d, valor: fromCentavos(d.valorCentavos) }));
  });

  app.post("/despesas", async (request, reply) => {
    const input = createDespesaSchema.parse(request.body);
    const despesa = await despesasService.criar(input, request.user.sub);
    reply.status(201);
    return { ...despesa, valor: fromCentavos(despesa.valorCentavos) };
  });

  app.get("/mensalidades/:empresaId", async (request) => {
    const { empresaId } = request.params as { empresaId: string };
    const mensalidade = await mensalidadesService.getByEmpresa(empresaId);
    if (!mensalidade) return null;
    return { ...mensalidade, valor: fromCentavos(mensalidade.valorCentavos) };
  });

  app.put("/mensalidades/:empresaId", async (request) => {
    const { empresaId } = request.params as { empresaId: string };
    const input = mensalidadeSchema.parse(request.body);
    const mensalidade = await mensalidadesService.upsert(empresaId, input);
    return { ...mensalidade, valor: fromCentavos(mensalidade.valorCentavos) };
  });

  app.get("/auditoria", async (request) => {
    const { entidadeId } = request.query as { entidadeId?: string };
    return auditLog.list(entidadeId);
  });
}
