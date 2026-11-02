import type { FastifyInstance } from "fastify";
import type { Empresa } from "@prisma/client";
import { requireAuth, requireRole } from "../../shared/auth-guard.js";
import { fromCentavos } from "../../shared/money.js";
import { empresasService } from "./service.js";
import {
  createEmpresaSchema,
  createFilialSchema,
  createLicencaSchema,
  createSocioAdministradorSchema,
  listEmpresasQuerySchema,
  updateEmpresaSchema,
  updateFilialSchema,
  updateLicencaSchema,
  updateSocioAdministradorSchema,
} from "./types.js";

// Gestão de clientes é restrita a sócios e funcionários — autoatendimento de
// cliente (role CLIENTE) fica para quando houver vínculo empresa<->usuário.
const MANAGE_ROLES = ["SOCIO", "FUNCIONARIO"] as const;

// Convenção do resto do monolito: centavos só existe dentro do backend.
// Tipado pelos campos escalares (sem include) pra servir tanto list() quanto
// getById() (que inclui licenças/sócios/filiais) sem checagem de excesso.
function serializeEmpresa(empresa: Empresa) {
  const { capitalSocialCentavos, ...rest } = empresa;
  return {
    ...rest,
    capitalSocial: capitalSocialCentavos === null ? null : fromCentavos(capitalSocialCentavos),
  };
}

export async function clientesRoutes(app: FastifyInstance) {
  app.addHook("preHandler", requireAuth);
  app.addHook("preHandler", requireRole(...MANAGE_ROLES));

  app.get("/", async (request) => {
    const query = listEmpresasQuerySchema.parse(request.query);
    const result = await empresasService.list(query);
    return { ...result, items: result.items.map(serializeEmpresa) };
  });

  app.get("/licencas", async () => {
    return empresasService.listAllLicencas();
  });

  app.post("/", async (request, reply) => {
    const input = createEmpresaSchema.parse(request.body);
    const empresa = await empresasService.create(input);
    reply.status(201);
    return serializeEmpresa(empresa);
  });

  app.get("/:id", async (request) => {
    const { id } = request.params as { id: string };
    return serializeEmpresa(await empresasService.getById(id));
  });

  app.patch("/:id", async (request) => {
    const { id } = request.params as { id: string };
    const input = updateEmpresaSchema.parse(request.body);
    return serializeEmpresa(await empresasService.update(id, input));
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

  app.post("/:id/socios-administradores", async (request, reply) => {
    const { id } = request.params as { id: string };
    const input = createSocioAdministradorSchema.parse(request.body);
    const socio = await empresasService.addSocioAdministrador(id, input);
    reply.status(201);
    return socio;
  });

  app.patch("/:id/socios-administradores/:socioId", async (request) => {
    const { id, socioId } = request.params as { id: string; socioId: string };
    const input = updateSocioAdministradorSchema.parse(request.body);
    return empresasService.updateSocioAdministrador(id, socioId, input);
  });

  app.delete("/:id/socios-administradores/:socioId", async (request, reply) => {
    const { id, socioId } = request.params as { id: string; socioId: string };
    await empresasService.deleteSocioAdministrador(id, socioId);
    reply.status(204);
  });

  app.post("/:id/filiais", async (request, reply) => {
    const { id } = request.params as { id: string };
    const input = createFilialSchema.parse(request.body);
    const filial = await empresasService.addFilial(id, input);
    reply.status(201);
    return filial;
  });

  app.patch("/:id/filiais/:filialId", async (request) => {
    const { id, filialId } = request.params as { id: string; filialId: string };
    const input = updateFilialSchema.parse(request.body);
    return empresasService.updateFilial(id, filialId, input);
  });

  app.delete("/:id/filiais/:filialId", async (request, reply) => {
    const { id, filialId } = request.params as { id: string; filialId: string };
    await empresasService.deleteFilial(id, filialId);
    reply.status(204);
  });
}
