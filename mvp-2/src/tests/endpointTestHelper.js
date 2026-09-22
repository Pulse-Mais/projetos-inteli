const express = require('express');
const jwt = require('jsonwebtoken');
const { errorHandler } = require('../middlewares/errorHandler');

// Aqui, criamos uma aplicacao Express enxuta com a rota real e o middleware global de erros.
const createEndpointTestApp = (basePath, router) => {
    const app = express();

    app.use(express.json());
    app.use(basePath, router);
    app.use(errorHandler);

    return app;
};

// Aqui, criamos um token valido para exercitarmos os middlewares reais de autenticacao e autorizacao.
const createAuthToken = (perfil = 'GestaoGeral', overrides = {}) => {
    const payload = {
        id: 1,
        perfil,
        nome: 'Usuario de Teste',
        token_version: 0,
        ...overrides
    };

    return jwt.sign(payload, process.env.JWT_SECRET);
};

// Aqui, configuramos o banco mockado para reconhecer o usuario do token como ativo.
const mockAuthenticatedUser = (pool) => {
    pool.query.mockResolvedValue({
        rows: [{ token_version: 0, ativo: true }]
    });
};

module.exports = {
    createEndpointTestApp,
    createAuthToken,
    mockAuthenticatedUser
};
