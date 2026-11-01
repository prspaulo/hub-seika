import type { FastifyInstance } from "fastify";
import { requireAuth, requireRole } from "../../shared/auth-guard.js";
import { fromCentavos } from "../../shared/money.js";
import { processosService } from "./service.js";
import { obrigacoesService } from "./obrigacoes-service.js";
import {
  createObrigacaoSchema,
  createProcessoSchema,
  listObrigacoesQuerySchema,
  listProcessosQuerySchema,
  updateObrigacaoSchema,
  updateProcessoSchema,
} from "./types.js";

const MANAGE_ROLES = ["SOCIO", "FUNCIONARIO"] as const;

type ProcessoRecord = Awaited<ReturnType<typeof processosService.getById>>;

function serializeProcesso(processo: ProcessoRecord) {
  return {
    ...processo,
    valorInicial: fromCentavos(processo.valorInicialCentavos),
    desconto:
      processo.descontoTipo === "PERCENTUAL"
        ? processo.descontoPercentual
        : fromCentavos(processo.descontoCentavos ?? 0),
    valorFinal: fromCentavos(processo.valorFinalCentavos),
  };
}

export async function processosRoutes(app: FastifyInstance) {
  app.addHook("preHandler", requireAuth);
  app.addHook("preHandler", requireRole(...MANAGE_ROLES));

  app.get("/", async (request) => {
    const query = listProcessosQuerySchema.parse(request.query);
    const result = await processosService.list(query);
    return { ...result, items: result.items.map(serializeProcesso) };
  });

  app.post("/", async (request, reply) => {
    const input = createProcessoSchema.parse(request.body);
    const processo = await processosService.create(input);
    reply.status(201);
    return serializeProcesso(processo);
  });

  app.get("/:id", async (request) => {
    const { id } = request.params as { id: string };
    return serializeProcesso(await processosService.getById(id));
  });

  app.patch("/:id", async (request) => {
    const { id } = request.params as { id: string };
    const input = updateProcessoSchema.parse(request.body);
    return serializeProcesso(await processosService.update(id, input));
  });
}

export async function obrigacoesRoutes(app: FastifyInstance) {
  app.addHook("preHandler", requireAuth);
  app.addHook("preHandler", requireRole(...MANAGE_ROLES));

  app.get("/", async (request) => {
    const query = listObrigacoesQuerySchema.parse(request.query);
    return obrigacoesService.list(query);
  });

  app.post("/", async (request, reply) => {
    const input = createObrigacaoSchema.parse(request.body);
    const obrigacao = await obrigacoesService.create(input, request.user.sub);
    reply.status(201);
    return obrigacao;
  });

  app.get("/:id", async (request) => {
    const { id } = request.params as { id: string };
    return obrigacoesService.getById(id);
  });

  app.patch("/:id", async (request) => {
    const { id } = request.params as { id: string };
    const input = updateObrigacaoSchema.parse(request.body);
    return obrigacoesService.update(id, input, request.user.sub);
  });

  app.delete("/:id", async (request, reply) => {
    const { id } = request.params as { id: string };
    await obrigacoesService.delete(id);
    reply.status(204);
  });
}
