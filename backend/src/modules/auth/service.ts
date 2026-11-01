import crypto from "node:crypto";
import bcrypt from "bcryptjs";
import { authRepository, hashToken } from "./repository.js";
import { NotFoundError, UnauthorizedError } from "../../shared/errors.js";

const REFRESH_TOKEN_TTL_DAYS = 30;
const PASSWORD_HASH_ROUNDS = 12;

function newRefreshToken() {
  return crypto.randomBytes(48).toString("base64url");
}

async function issueRefreshToken(userId: string) {
  const token = newRefreshToken();
  const expiresAt = new Date(Date.now() + REFRESH_TOKEN_TTL_DAYS * 24 * 60 * 60 * 1000);
  await authRepository.createRefreshToken(userId, hashToken(token), expiresAt);
  return { token, expiresAt };
}

export const authService = {
  async verifyCredentials(email: string, password: string) {
    const user = await authRepository.findUserByEmail(email);
    if (!user) throw new UnauthorizedError("Credenciais inválidas");
    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) throw new UnauthorizedError("Credenciais inválidas");
    return user;
  },

  issueRefreshToken,

  async rotateRefreshToken(token: string) {
    const record = await authRepository.findRefreshTokenByHash(hashToken(token));
    if (!record || record.revokedAt || record.expiresAt < new Date()) {
      throw new UnauthorizedError("Sessão expirada, faça login novamente");
    }
    await authRepository.revokeRefreshToken(record.id);
    const user = await authRepository.findUserById(record.userId);
    if (!user) throw new UnauthorizedError();
    const next = await issueRefreshToken(user.id);
    return { userId: user.id, role: user.role, token: next.token, expiresAt: next.expiresAt };
  },

  async revokeRefreshTokenByValue(token: string) {
    const record = await authRepository.findRefreshTokenByHash(hashToken(token));
    if (record && !record.revokedAt) {
      await authRepository.revokeRefreshToken(record.id);
    }
  },

  async changePassword(userId: string, currentPassword: string, newPassword: string) {
    const user = await authRepository.findUserById(userId);
    if (!user) throw new UnauthorizedError();
    const valid = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!valid) throw new UnauthorizedError("Senha atual incorreta");
    const passwordHash = await bcrypt.hash(newPassword, PASSWORD_HASH_ROUNDS);
    await authRepository.updatePasswordHash(userId, passwordHash);
  },

  async getSafeUser(userId: string) {
    const user = await authRepository.findUserById(userId);
    if (!user) throw new UnauthorizedError();
    return { id: user.id, name: user.name, email: user.email, role: user.role };
  },

  // Usado por outros módulos (ex: Processos/Obrigações) para validar um
  // "responsável" sem acessar a tabela de usuários diretamente.
  async ensureUserExists(userId: string) {
    const user = await authRepository.findUserById(userId);
    if (!user) throw new NotFoundError("Usuário responsável");
  },

  listAssignableUsers() {
    return authRepository.listAssignable();
  },
};
