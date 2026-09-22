// Src/app.js

const express = require('express');
const path = require('path');
const apiRoutes = require('./routes');
const { errorHandler } = require('./middlewares/errorHandler');
const { logAuditoria } = require('./middlewares/logAuditoria');
const { responseTime } = require('./middlewares/responseTime');


const app = express();

// Middlewares globais
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Raiz: redireciona para a tela de login (não há index.html estático na raiz).
app.get('/', (_req, res) => res.redirect('/pages/login.html'));

app.use(express.static(path.join(__dirname, 'public')));
app.use('/assets', express.static(path.join(__dirname, '../assets')));
app.use(responseTime);
app.use(logAuditoria);


// Rotas da API
app.use('/api', apiRoutes);

// Fallback 404 para rotas não encontradas  
app.use((_req, _res, next) => {
    const { NotFoundError } = require('./errors/AppError');
    next(new NotFoundError('rota'));
});

// Middleware de erros 
app.use(errorHandler);

module.exports = { app };