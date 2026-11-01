import type { FastifyRequest } from "fastify";
import { ForbiddenError, UnauthorizedError } from "./errors.js";
import type { Role } from "@prisma/client";

export async function requireAuth(request: FastifyRequest) {
  try {
    await request.jwtVerify();
  } catch {
    throw new UnauthorizedError();
  }
}

export function requireRole(...roles: Role[]) {
  return async function (request: FastifyRequest) {
    if (!roles.includes(request.user.role)) {
      throw new ForbiddenError();
    }
  };
}
