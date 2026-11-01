export class AppError extends Error {
  constructor(
    message: string,
    public statusCode: number = 400,
    public code: string = "APP_ERROR",
  ) {
    super(message);
    this.name = "AppError";
  }
}

export class NotFoundError extends AppError {
  constructor(entity: string) {
    super(`${entity} não encontrado`, 404, "NOT_FOUND");
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = "Não autenticado") {
    super(message, 401, "UNAUTHORIZED");
  }
}

export class ForbiddenError extends AppError {
  constructor(message = "Sem permissão para esta ação") {
    super(message, 403, "FORBIDDEN");
  }
}
