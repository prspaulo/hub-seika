import type { FastifyInstance, FastifyReply } from "fastify";
import { env } from "../../config/env.js";
import { UnauthorizedError } from "../../shared/errors.js";
import { requireAuth } from "../../shared/auth-guard.js";
import { authService } from "./service.js";
import { changePasswordSchema, loginSchema } from "./types.js";

const REFRESH_COOKIE = "seika_refresh_token";
const REFRESH_COOKIE_PATH = "/api/v1/auth";

function setRefreshCookie(reply: FastifyReply, token: string, expiresAt: Date) {
  reply.setCookie(REFRESH_COOKIE, token, {
    httpOnly: true,
    secure: env.NODE_ENV === "production",
    sameSite: "lax",
    path: REFRESH_COOKIE_PATH,
    expires: expiresAt,
  });
}

export async function authRoutes(app: FastifyInstance) {
  app.post("/login", async (request, reply) => {
    const { email, password } = loginSchema.parse(request.body);
    const user = await authService.verifyCredentials(email, password);
    const accessToken = app.jwt.sign({ sub: user.id, role: user.role });
    const { token: refreshToken, expiresAt } = await authService.issueRefreshToken(user.id);
    setRefreshCookie(reply, refreshToken, expiresAt);
    return {
      accessToken,
      user: { id: user.id, name: user.name, email: user.email, role: user.role },
    };
  });

  app.post("/refresh", async (request, reply) => {
    const token = request.cookies[REFRESH_COOKIE];
    if (!token) throw new UnauthorizedError("Sessão não encontrada");
    const result = await authService.rotateRefreshToken(token);
    const accessToken = app.jwt.sign({ sub: result.userId, role: result.role });
    setRefreshCookie(reply, result.token, result.expiresAt);
    return { accessToken };
  });

  app.post("/logout", async (request, reply) => {
    const token = request.cookies[REFRESH_COOKIE];
    if (token) await authService.revokeRefreshTokenByValue(token);
    reply.clearCookie(REFRESH_COOKIE, { path: REFRESH_COOKIE_PATH });
    return { ok: true };
  });

  app.get("/me", { preHandler: requireAuth }, async (request) => {
    return authService.getSafeUser(request.user.sub);
  });

  app.patch("/password", { preHandler: requireAuth }, async (request) => {
    const { currentPassword, newPassword } = changePasswordSchema.parse(request.body);
    await authService.changePassword(request.user.sub, currentPassword, newPassword);
    return { ok: true };
  });

  // Lista sócios/funcionários pra popular dropdowns de "Responsável" em
  // outros módulos (Processos, Obrigações).
  app.get("/users", { preHandler: requireAuth }, async () => {
    return authService.listAssignableUsers();
  });
}
