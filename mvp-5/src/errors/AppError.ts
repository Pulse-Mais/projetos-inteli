export class AppError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = this.constructor.name;
  }
}

export class NotFoundError extends AppError {
  constructor(recurso = 'recurso') {
    super(404, `${recurso} não encontrado`);
  }
}

export class ConflictError extends AppError {
  constructor(message: string) {
    super(409, message);
  }
}

export class ValidationError extends AppError {
  constructor(message: string) {
    super(422, message);
  }
}

export class BadRequestError extends AppError {
  constructor(message = 'requisição inválida') {
    super(400, message);
  }
}

export class ForbiddenError extends AppError {
  constructor(message = 'acesso negado') {
    super(403, message);
  }
}