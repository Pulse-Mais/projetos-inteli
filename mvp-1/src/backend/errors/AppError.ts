export class AppError extends Error {
  public readonly status: number;

  constructor(msg: string, status = 500) {
    super(msg);
    this.name = this.constructor.name;
    this.status = status;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class NotFoundError extends AppError {
  constructor(msg = 'Recurso não encontrado') {
    super(msg, 404);
  }
}

export class BadRequestError extends AppError {
  constructor(msg = 'Requisição inválida') {
    super(msg, 400);
  }
}

export class UnauthorizedError extends AppError {
  constructor(msg = 'Não autorizado') {
    super(msg, 401);
  }
}

export class ConflictError extends AppError {
  constructor(msg = 'Conflito de recurso') {
    super(msg, 409);
  }
}
