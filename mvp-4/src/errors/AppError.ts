/**
 * Erro de aplicação com status HTTP e mensagem segura para o usuário.
 * Use esta classe para lançar erros controlados nos controllers e services.
 */
export class AppError extends Error {
  public readonly statusCode: number;
  public readonly isOperational: boolean;

  constructor(message: string, statusCode: number = 400) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    Object.setPrototypeOf(this, AppError.prototype);
  }

  static badRequest(message: string): AppError {
    return new AppError(message, 400);
  }

  static notFound(message: string): AppError {
    return new AppError(message, 404);
  }

  static internal(message: string = 'Erro interno do servidor.'): AppError {
    return new AppError(message, 500);
  }

  static serviceUnavailable(message: string): AppError {
    return new AppError(message, 503);
  }
}
