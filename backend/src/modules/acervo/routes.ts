import type { FastifyInstance } from "fastify";
import { requireAuth, requireRole } from "../../shared/auth-guard.js";
import { acervoService } from "./service.js";
import { createMaterialSchema, listMateriaisQuerySchema, updateMaterialSchema } from "./types.js";

const MANAGE_ROLES = ["SOCIO", "FUNCIONARIO"] as const;

export async function acervoRoutes(app: FastifyInstance) {
  app.addHook("preHandler", requireAuth);
  app.addHook("preHandler", requireRole(...MANAGE_ROLES));

  app.get("/", async (request) => {
    const query = listMateriaisQuerySchema.parse(request.query);
    return acervoService.list(query);
  });

  app.get("/areas", async () => {
    return acervoService.listAreas();
  });

  app.post("/", async (request, reply) => {
    const input = createMaterialSchema.parse(request.body);
    const material = await acervoService.create(input, request.user.sub);
    reply.status(201);
    return material;
  });

  app.get("/:id", async (request) => {
    const { id } = request.params as { id: string };
    return acervoService.getById(id);
  });

  app.patch("/:id", async (request) => {
    const { id } = request.params as { id: string };
    const input = updateMaterialSchema.parse(request.body);
    return acervoService.update(id, input);
  });

  app.delete("/:id", async (request, reply) => {
    const { id } = request.params as { id: string };
    await acervoService.delete(id);
    reply.status(204);
  });
}
