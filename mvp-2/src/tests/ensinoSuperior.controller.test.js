// Aqui, mockamos o service de ensino superior para testar somente o comportamento do controller.
jest.mock('../services/ensinoSuperiorService', () => ({
    criar: jest.fn(),
    listarTodos: jest.fn(),
    buscarPorId: jest.fn(),
    atualizar: jest.fn(),
    excluir: jest.fn()
}));

// Aqui, mockamos a conexao com o banco para evitar dependencias externas durante os testes.
jest.mock('../database/db', () => ({
    pool: {
        query: jest.fn()
    }
}));

// Aqui, importamos as dependencias utilizadas nos cenarios de teste do controller.
const request = require('supertest');
const ensinoSuperiorService = require('../services/ensinoSuperiorService');
const ensinoSuperiorController = require('../controllers/ensinoSuperiorController');
const ensinoSuperiorRoutes = require('../routes/ensinoSuperiorRoutes');
const { pool } = require('../database/db');
const { BadRequestError } = require('../errors/AppError');
const { createMockReq, createMockRes } = require('./testHelper');
const {
    createEndpointTestApp,
    createAuthToken,
    mockAuthenticatedUser
} = require('./endpointTestHelper');

// Aqui, definimos o segredo usado para gerar e validar os tokens dos testes HTTP.
process.env.JWT_SECRET = 'segredo-ensino-superior-controller';

// Aqui, criamos uma aplicacao que monta as rotas reais de ensino superior.
const endpointApp = createEndpointTestApp('/api/ensino-superior', ensinoSuperiorRoutes);

// Aqui, definimos um registro de ensino superior para reutilizarmos nos cenarios de teste.
const mockEnsinoSuperior = {
    id: 1,
    jovem_id: 1,
    instituicao: 'USP',
    cursos: 'Ciencia da Computacao',
    modalidade_bolsa: 'ProUni',
    status: 'Cursando',
    data_inicio: '2024-02-01',
    data_conclusao: null
};

// Aqui, executamos o controller e aguardamos a conclusao das operacoes assincronas.
const executarController = async (controller, req, res, next) => {
    controller(req, res, next);
    await new Promise(setImmediate);
};

// Aqui, agrupamos todos os testes relacionados ao controller de ensino superior.
// Rastreabilidade (Art 11): RF011 + RF003 (autorização) | RN08,RN15 | HTTP 200/201/400/401/403/404
describe('EnsinoSuperiorController [RF011,RF003 | RN08,RN15]', () => {
    let res;
    let next;

    // Aqui, criamos novos mocks de resposta e de proximo middleware antes de cada teste.
    beforeEach(() => {
        res = createMockRes();
        next = jest.fn();
    });

    // Aqui, agrupamos os testes do metodo responsavel pela criacao de registros.
    describe('criar', () => {
        // Aqui, verificamos se o controller envia o corpo da requisicao ao service.
        it('envia o corpo da requisicao ao service', async () => {
            const req = createMockReq({ body: { ...mockEnsinoSuperior } });
            ensinoSuperiorService.criar.mockResolvedValue(mockEnsinoSuperior);

            await executarController(ensinoSuperiorController.criar, req, res, next);

            expect(ensinoSuperiorService.criar).toHaveBeenCalledWith(req.body);
        });

        // Aqui, verificamos se o controller retorna o status 201 e o registro criado.
        it('retorna status 201 e o registro criado', async () => {
            const req = createMockReq({ body: { ...mockEnsinoSuperior } });
            ensinoSuperiorService.criar.mockResolvedValue(mockEnsinoSuperior);

            await executarController(ensinoSuperiorController.criar, req, res, next);

            expect(res.status).toHaveBeenCalledWith(201);
            expect(res.json).toHaveBeenCalledWith(mockEnsinoSuperior);
            expect(next).not.toHaveBeenCalled();
        });

        // Aqui, verificamos se o controller encaminha erros de criacao ao middleware de erros.
        it('encaminha erros do service para o middleware de erros', async () => {
            const erro = new Error('Falha ao criar registro de ensino superior');
            const req = createMockReq({ body: { ...mockEnsinoSuperior } });
            ensinoSuperiorService.criar.mockRejectedValue(erro);

            await executarController(ensinoSuperiorController.criar, req, res, next);

            expect(next).toHaveBeenCalledWith(erro);
            expect(res.json).not.toHaveBeenCalled();
        });
    });

    // Aqui, agrupamos os testes do metodo responsavel pela listagem de registros.
    describe('listar', () => {
        // Aqui, verificamos se o controller envia os filtros recebidos ao service.
        it('envia os filtros da query ao service', async () => {
            const query = { jovem_id: '1', status: 'Cursando' };
            const req = createMockReq({ query });
            ensinoSuperiorService.listarTodos.mockResolvedValue([mockEnsinoSuperior]);

            await executarController(ensinoSuperiorController.listar, req, res, next);

            expect(ensinoSuperiorService.listarTodos).toHaveBeenCalledWith(query);
        });

        // Aqui, verificamos se o controller retorna os registros encontrados.
        it('retorna os registros encontrados', async () => {
            const req = createMockReq();
            ensinoSuperiorService.listarTodos.mockResolvedValue([mockEnsinoSuperior]);

            await executarController(ensinoSuperiorController.listar, req, res, next);

            expect(res.json).toHaveBeenCalledWith([mockEnsinoSuperior]);
            expect(next).not.toHaveBeenCalled();
        });

        // Aqui, verificamos se o controller encaminha erros de listagem ao middleware de erros.
        it('encaminha erros do service para o middleware de erros', async () => {
            const erro = new Error('Falha ao listar registros de ensino superior');
            const req = createMockReq();
            ensinoSuperiorService.listarTodos.mockRejectedValue(erro);

            await executarController(ensinoSuperiorController.listar, req, res, next);

            expect(next).toHaveBeenCalledWith(erro);
            expect(res.json).not.toHaveBeenCalled();
        });
    });

    // Aqui, agrupamos os testes do metodo responsavel pela busca de um registro por ID.
    describe('buscarPorId', () => {
        // Aqui, verificamos se o controller converte o ID e retorna o registro encontrado.
        it('converte o ID e retorna o registro encontrado', async () => {
            const req = createMockReq({ params: { id: '1' } });
            ensinoSuperiorService.buscarPorId.mockResolvedValue(mockEnsinoSuperior);

            await executarController(ensinoSuperiorController.buscarPorId, req, res, next);

            expect(ensinoSuperiorService.buscarPorId).toHaveBeenCalledWith(1);
            expect(res.json).toHaveBeenCalledWith(mockEnsinoSuperior);
            expect(next).not.toHaveBeenCalled();
        });

        // Aqui, verificamos se o controller rejeita um ID invalido antes de consultar o service.
        it('encaminha BadRequestError quando o ID e invalido', async () => {
            const req = createMockReq({ params: { id: 'abc' } });

            await executarController(ensinoSuperiorController.buscarPorId, req, res, next);

            expect(next).toHaveBeenCalledWith(expect.any(BadRequestError));
            expect(ensinoSuperiorService.buscarPorId).not.toHaveBeenCalled();
        });
    });

    // Aqui, agrupamos os testes do metodo responsavel pela atualizacao de registros.
    describe('atualizar', () => {
        // Aqui, verificamos se o controller converte o ID e retorna o registro atualizado.
        it('converte o ID e retorna o registro atualizado', async () => {
            const body = { status: 'Concluido' };
            const registroAtualizado = { ...mockEnsinoSuperior, ...body };
            const req = createMockReq({ params: { id: '1' }, body });
            ensinoSuperiorService.atualizar.mockResolvedValue(registroAtualizado);

            await executarController(ensinoSuperiorController.atualizar, req, res, next);

            expect(ensinoSuperiorService.atualizar).toHaveBeenCalledWith(1, body);
            expect(res.json).toHaveBeenCalledWith(registroAtualizado);
        });

        // Aqui, verificamos se o controller rejeita um ID invalido antes da atualizacao.
        it('encaminha BadRequestError quando o ID e invalido', async () => {
            const req = createMockReq({ params: { id: '0' }, body: {} });

            await executarController(ensinoSuperiorController.atualizar, req, res, next);

            expect(next).toHaveBeenCalledWith(expect.any(BadRequestError));
            expect(ensinoSuperiorService.atualizar).not.toHaveBeenCalled();
        });

        // Aqui, verificamos se o controller encaminha erros de atualizacao ao middleware de erros.
        it('encaminha erros do service para o middleware de erros', async () => {
            const erro = new Error('Falha ao atualizar registro de ensino superior');
            const req = createMockReq({ params: { id: '1' }, body: {} });
            ensinoSuperiorService.atualizar.mockRejectedValue(erro);

            await executarController(ensinoSuperiorController.atualizar, req, res, next);

            expect(next).toHaveBeenCalledWith(erro);
            expect(res.json).not.toHaveBeenCalled();
        });
    });

    // Aqui, agrupamos os testes do metodo responsavel pela exclusao de registros.
    describe('excluir', () => {
        // Aqui, verificamos se o controller exclui o registro e retorna o status 204.
        it('converte o ID, exclui o registro e retorna status 204', async () => {
            const req = createMockReq({ params: { id: '1' } });
            ensinoSuperiorService.excluir.mockResolvedValue();

            await executarController(ensinoSuperiorController.excluir, req, res, next);

            expect(ensinoSuperiorService.excluir).toHaveBeenCalledWith(1);
            expect(res.status).toHaveBeenCalledWith(204);
            expect(res.send).toHaveBeenCalledWith();
            expect(next).not.toHaveBeenCalled();
        });

        // Aqui, verificamos se o controller rejeita um ID invalido antes da exclusao.
        it('encaminha BadRequestError quando o ID e invalido', async () => {
            const req = createMockReq({ params: { id: '-1' } });

            await executarController(ensinoSuperiorController.excluir, req, res, next);

            expect(next).toHaveBeenCalledWith(expect.any(BadRequestError));
            expect(ensinoSuperiorService.excluir).not.toHaveBeenCalled();
            expect(res.status).not.toHaveBeenCalled();
        });

        // Aqui, verificamos se o controller encaminha erros de exclusao ao middleware de erros.
        it('encaminha erros do service para o middleware de erros', async () => {
            const erro = new Error('Falha ao excluir registro de ensino superior');
            const req = createMockReq({ params: { id: '1' } });
            ensinoSuperiorService.excluir.mockRejectedValue(erro);

            await executarController(ensinoSuperiorController.excluir, req, res, next);

            expect(next).toHaveBeenCalledWith(erro);
            expect(res.status).not.toHaveBeenCalled();
        });
    });
});

// Aqui, agrupamos os testes de integracao HTTP dos endpoints de ensino superior.
describe('Endpoints de ensino superior', () => {
    let token;

    // Aqui, autenticamos um usuario autorizado antes de cada teste de endpoint.
    beforeEach(() => {
        mockAuthenticatedUser(pool);
        token = createAuthToken();
    });

    // Aqui, verificamos se a rota rejeita requisicoes sem token.
    it('retorna 401 ao listar registros sem autenticacao', async () => {
        await request(endpointApp)
            .get('/api/ensino-superior')
            .expect(401);
    });

    // Aqui, verificamos o fluxo HTTP completo de criacao de registro.
    it('retorna 201 ao criar um registro autenticado', async () => {
        ensinoSuperiorService.criar.mockResolvedValue(mockEnsinoSuperior);

        await request(endpointApp)
            .post('/api/ensino-superior')
            .set('Authorization', `Bearer ${token}`)
            .send(mockEnsinoSuperior)
            .expect(201, mockEnsinoSuperior);
    });

    // Aqui, verificamos o fluxo HTTP completo de listagem de registros.
    it('retorna 200 ao listar registros', async () => {
        ensinoSuperiorService.listarTodos.mockResolvedValue([mockEnsinoSuperior]);

        await request(endpointApp)
            .get('/api/ensino-superior?status=Cursando')
            .set('Authorization', `Bearer ${token}`)
            .expect(200, [mockEnsinoSuperior]);
    });

    // Aqui, verificamos o fluxo HTTP completo de busca de registro por ID.
    it('retorna 200 ao buscar um registro por ID', async () => {
        ensinoSuperiorService.buscarPorId.mockResolvedValue(mockEnsinoSuperior);

        await request(endpointApp)
            .get('/api/ensino-superior/1')
            .set('Authorization', `Bearer ${token}`)
            .expect(200, mockEnsinoSuperior);
    });

    // Aqui, verificamos o fluxo HTTP completo de atualizacao de registro.
    it('retorna 200 ao atualizar um registro', async () => {
        const atualizado = { ...mockEnsinoSuperior, status: 'Concluido' };
        ensinoSuperiorService.atualizar.mockResolvedValue(atualizado);

        await request(endpointApp)
            .put('/api/ensino-superior/1')
            .set('Authorization', `Bearer ${token}`)
            .send({ status: atualizado.status })
            .expect(200, atualizado);
    });

    // Aqui, verificamos o fluxo HTTP completo de exclusao de registro.
    it('retorna 204 ao excluir um registro', async () => {
        ensinoSuperiorService.excluir.mockResolvedValue();

        await request(endpointApp)
            .delete('/api/ensino-superior/1')
            .set('Authorization', `Bearer ${token}`)
            .expect(204);
    });
});
