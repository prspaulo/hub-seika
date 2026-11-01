import type { FastifyInstance } from "fastify";
import { requireAuth, requireRole } from "../../shared/auth-guard.js";
import { empresasService } from "./service.js";
import {
  createEmpresaSchema,
  createLicencaSchema,
  listEmpresasQuerySchema,
  updateEmpresaSchema,
  updateLicencaSchema,
} from "./types.js";

// Gestão de clientes é restrita a sócios e funcionários — autoatendimento de
// cliente (role CLIENTE) fica para quando houver vínculo empresa<->usuário.
const MANAGE_ROLES = ["SOCIO", "FUNCIONARIO"] as const;

export async function clientesRoutes(app: FastifyInstance) {
  app.addHook("preHandler", requireAuth);
  app.addHook("preHandler", requireRole(...MANAGE_ROLES));

  app.get("/", async (request) => {
    const query = listEmpresasQuerySchema.parse(request.query);
    return empresasService.list(query);
  });

  app.get("/licencas", async () => {
    return empresasService.listAllLicencas();
  });

  app.post("/", async (request, reply) => {
    const input = createEmpresaSchema.parse(request.body);
    const empresa = await empresasService.create(input);
    reply.status(201);
    return empresa;
  });

  app.get("/:id", async (request) => {
    const { id } = request.params as { id: string };
    return empresasService.getById(id);
  });

  app.patch("/:id", async (request) => {
    const { id } = request.params as { id: string };
    const input = updateEmpresaSchema.parse(request.body);
    return empresasService.update(id, input);
  });

  app.delete("/:id", async (request, reply) => {
    const { id } = request.params as { id: string };
    await empresasService.softDelete(id);
    reply.status(204);
  });

  app.post("/:id/licencas", async (request, reply) => {
    const { id } = request.params as { id: string };
    const input = createLicencaSchema.parse(request.body);
    const licenca = await empresasService.addLicenca(id, input);
    reply.status(201);
    return licenca;
  });

  app.patch("/:id/licencas/:licencaId", async (request) => {
    const { id, licencaId } = request.params as { id: string; licencaId: string };
    const input = updateLicencaSchema.parse(request.body);
    return empresasService.updateLicenca(id, licencaId, input);
  });

  app.delete("/:id/licencas/:licencaId", async (request, reply) => {
    const { id, licencaId } = request.params as { id: string; licencaId: string };
    await empresasService.deleteLicenca(id, licencaId);
    reply.status(204);
  });
}
