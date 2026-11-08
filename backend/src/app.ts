import Fastify from "fastify";
import cors from "@fastify/cors";
import cookie from "@fastify/cookie";
import jwt from "@fastify/jwt";
import { ZodError } from "zod";
import { env } from "./config/env.js";
import { AppError } from "./shared/errors.js";
import { authRoutes } from "./modules/auth/routes.js";
import { clientesRoutes } from "./modules/clientes/routes.js";
import {
  obrigacaoTemplatesRoutes,
  obrigacoesRoutes,
  processosRoutes,
  responsaveisDepartamentoRoutes,
} from "./modules/processos/routes.js";
import { financeiroRoutes } from "./modules/financeiro/routes.js";
import { acervoRoutes } from "./modules/acervo/routes.js";

export function buildApp() {
  const app = Fastify({
    logger: {
      level: env.NODE_ENV === "production" ? "info" : "debug",
    },
  });

  app.register(cors, { origin: env.CORS_ORIGIN, credentials: true });
  app.register(cookie);
  app.register(jwt, { secret: env.JWT_SECRET, sign: { expiresIn: "15m" } });

  app.get("/api/v1/health", async () => ({ status: "ok" }));

  app.register(authRoutes, { prefix: "/api/v1/auth" });
  app.register(clientesRoutes, { prefix: "/api/v1/empresas" });
  app.register(processosRoutes, { prefix: "/api/v1/processos" });
  app.register(obrigacoesRoutes, { prefix: "/api/v1/obrigacoes" });
  app.register(obrigacaoTemplatesRoutes, { prefix: "/api/v1/obrigacoes/templates" });
  app.register(responsaveisDepartamentoRoutes, { prefix: "/api/v1/obrigacoes/responsaveis-departamento" });
  app.register(financeiroRoutes, { prefix: "/api/v1/financeiro" });
  app.register(acervoRoutes, { prefix: "/api/v1/acervo" });

  app.setErrorHandler((error, _request, reply) => {
    if (error instanceof AppError) {
      return reply.status(error.statusCode).send({ error: error.code, message: error.message });
    }
    if (error instanceof ZodError) {
      return reply.status(400).send({ error: "VALIDATION_ERROR", issues: error.issues });
    }
    app.log.error(error);
    return reply.status(500).send({ error: "INTERNAL_ERROR", message: "Erro interno" });
  });

  return app;
}
