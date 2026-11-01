import crypto from "node:crypto";
import { prisma } from "../../shared/prisma.js";

export function hashToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}

export const authRepository = {
  findUserByEmail(email: string) {
    return prisma.user.findUnique({ where: { email } });
  },

  findUserById(id: string) {
    return prisma.user.findUnique({ where: { id } });
  },

  listAssignable() {
    return prisma.user.findMany({
      where: { role: { in: ["SOCIO", "FUNCIONARIO"] } },
      select: { id: true, name: true, role: true },
      orderBy: { name: "asc" },
    });
  },

  updatePasswordHash(id: string, passwordHash: string) {
    return prisma.user.update({ where: { id }, data: { passwordHash } });
  },

  createRefreshToken(userId: string, tokenHash: string, expiresAt: Date) {
    return prisma.refreshToken.create({ data: { userId, tokenHash, expiresAt } });
  },

  findRefreshTokenByHash(tokenHash: string) {
    return prisma.refreshToken.findUnique({ where: { tokenHash } });
  },

  revokeRefreshToken(id: string) {
    return prisma.refreshToken.update({ where: { id }, data: { revokedAt: new Date() } });
  },
};
