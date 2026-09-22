// src/tests/errorHandler.test.js
// Testa a traducao de erros do driver pg para status HTTP semantico (COD-01).
// Rastreabilidade (Art 11): RF003 (camada de erros) | RNF-SEG | HTTP 400/404/409/500

const { errorHandler } = require('../middlewares/errorHandler');
const {
    AppError,
    NotFoundError,
    ConflictError,
    BadRequestError,
} = require('../errors/AppError');

// Aqui, criamos um req minimo (apenas method/path sao lidos pelo middleware).
const criarReq = (method = 'POST') => ({ method, path: '/api/recurso' });

// Aqui, criamos um res com espioes encadeados para inspecionar status/json.
const criarRes = () => {
    const res = {};
    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnValue(res);
    return res;
};

// Aqui, simulamos um erro vindo do driver pg, que carrega o campo `code`.
const erroPg = (code) => Object.assign(new Error('erro do banco'), { code });

describe('errorHandler [RF003 | tratamento de erros do pg | HTTP 400/404/409/500]', () => {
    let consoleErroOriginal;

    beforeAll(() => {
        // Silencia o log de erro para nao poluir a saida dos testes.
        consoleErroOriginal = console.error;
        console.error = jest.fn();
    });

    afterAll(() => {
        console.error = consoleErroOriginal;
    });

    it('preserva o status de um AppError sem traduzir', () => {
        const res = criarRes();
        errorHandler(new NotFoundError('Jovem'), criarReq('GET'), res);

        expect(res.status).toHaveBeenCalledWith(404);
        expect(res.json).toHaveBeenCalledWith({ error: 'Jovem não encontrado' });
    });

    it('traduz 23503 (FK) em POST para 404', () => {
        const res = criarRes();
        errorHandler(erroPg('23503'), criarReq('POST'), res);

        expect(res.status).toHaveBeenCalledWith(404);
    });

    it('traduz 23503 (FK) em DELETE para 409 (recurso em uso)', () => {
        const res = criarRes();
        errorHandler(erroPg('23503'), criarReq('DELETE'), res);

        expect(res.status).toHaveBeenCalledWith(409);
    });

    it('traduz 23505 (unique) para 409', () => {
        const res = criarRes();
        errorHandler(erroPg('23505'), criarReq('POST'), res);

        expect(res.status).toHaveBeenCalledWith(409);
    });

    it('traduz 22P02 (tipo invalido) para 400', () => {
        const res = criarRes();
        errorHandler(erroPg('22P02'), criarReq('GET'), res);

        expect(res.status).toHaveBeenCalledWith(400);
    });

    it('mantem 500 generico para erro desconhecido sem vazar detalhes', () => {
        const res = criarRes();
        errorHandler(erroPg('99999'), criarReq('POST'), res);

        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith({ error: 'Erro interno do servidor' });
    });
});
