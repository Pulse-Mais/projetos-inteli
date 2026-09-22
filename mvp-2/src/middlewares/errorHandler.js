// src/middlewares/errorHandler.js

const {
    AppError,
    NotFoundError,
    ConflictError,
    BadRequestError,
} = require('../errors/AppError');

// Traduz erros do driver pg (node-postgres) para AppError com status HTTP semantico.
// Sem isso, qualquer violacao de constraint do banco vira 500 generico.
// Mensagens sao genericas de proposito: nao vazam detalhes do schema ao cliente.
const traduzirErroPostgres = (err, req) => {
    switch (err.code) {
        // foreign_key_violation: numa exclusao = recurso em uso (RESTRICT);
        // numa insercao/atualizacao = referencia a recurso inexistente.
        case '23503':
            return req.method === 'DELETE'
                ? new ConflictError('Recurso possui dependências e não pode ser removido')
                : new NotFoundError('Recurso referenciado');
        // unique_violation: registro duplicado.
        case '23505':
            return new ConflictError('Registro já existe');
        // invalid_text_representation: tipo invalido (ex.: id nao numerico).
        case '22P02':
            return new BadRequestError('Formato de dado inválido');
        default:
            return null;
    }
};

const errorHandler = (err, req, res, next) => {
    // Erros operacionais ja chegam como AppError; os do pg sao traduzidos aqui.
    const erro = err instanceof AppError ? err : (traduzirErroPostgres(err, req) || err);

    const status = erro instanceof AppError ? erro.status : 500;

    // Stack completa só para erros de servidor (5xx). Para 4xx (404, 401, validação)
    // basta um log resumido — evita poluir o terminal com stack de rota inexistente.
    if (status >= 500) {
        console.error({
            status,
            message: err.message,
            stack: err.stack,
            method: req.method,
            path: req.path,
        });
    } else {
        console.warn({
            status,
            message: err.message,
            method: req.method,
            path: req.path,
        });
    }

    // Resposta enxuta para o cliente - sem stack, sem detalhes do banco
    const publicMessage = status === 500
    ? 'Erro interno do servidor'
    : erro.message;

    res.status(status).json({ error: publicMessage });
};

module.exports = { errorHandler };
