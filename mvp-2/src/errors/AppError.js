// src/errors/AppError.js

class AppError extends Error {
    constructor(message, status = 500) {
        super(message);
        this.name = this.constructor.name;
        this.status = status;
    }
}

class NotFoundError extends AppError {
    constructor(resource = 'Recurso') {
        super(`${resource} não encontrado`, 404);
    }
}

class ConflictError extends AppError {
    constructor(message = 'Conflito de dados') {
        super(message, 409);
    }
}

class ValidationError extends AppError {
    constructor(message = 'Dados inválidos') {
        super(message, 422);
    }
}

class BadRequestError extends AppError {
    constructor(message = 'Requisição inválida') {
        super(message, 400);
    }
}

class UnauthorizedError extends AppError {
    constructor(message = 'Não autorizado') {
        super(message, 401);
    }
}

class ForbiddenError extends AppError {
    constructor(message = 'Acesso negado') {
        super(message, 403);
    }
}

module.exports = {
    AppError,
    NotFoundError,
    ConflictError,
    ValidationError,
    BadRequestError,
    UnauthorizedError,
    ForbiddenError,
};