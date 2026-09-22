// Aqui, mockamos o service de eventos para testar somente o comportamento do controller.
jest.mock('../services/eventoService', () => ({
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
const eventoService = require('../services/eventoService');
const eventoController = require('../controllers/eventoController');
const eventoRoutes = require('../routes/eventoRoutes');
const { pool } = require('../database/db');
const { BadRequestError } = require('../errors/AppError');
const { createMockReq, createMockRes } = require('./testHelper');
const {
    createEndpointTestApp,
    createAuthToken,
    mockAuthenticatedUser
} = require('./endpointTestHelper');

// Aqui, definimos o segredo usado para gerar e validar os tokens dos testes HTTP.
process.env.JWT_SECRET = 'segredo-evento-controller';

// Aqui, criamos uma aplicacao que monta as rotas reais de eventos.
const endpointApp = createEndpointTestApp('/api/eventos', eventoRoutes);

// Aqui, definimos um evento base para reutilizarmos nos diferentes cenarios de teste.
const mockEvento = {
    id: 1,
    nome: 'Workshop SQL e Banco de Dados',
    data_inicio: '2026-06-15T09:00:00.000Z',
    data_fim: '2026-06-15T12:00:00.000Z',
    tipo: 'Workshop',
    descricao: 'Workshop pratico sobre SQL e modelagem relacional.',
    local: 'Lab Pulse Mais',
    vagas: 40
};

// Aqui, executamos o controller e aguardamos a conclusao das operacoes assincronas.
const executarController = async (controller, req, res, next) => {
    controller(req, res, next);
    await new Promise(setImmediate);
};

// Aqui, agrupamos todos os testes relacionados ao controller de eventos.
// Rastreabilidade (Art 11): RF015 + RF003 (autorização) | RN08 | HTTP 200/201/400/401/403/404
describe('EventoController [RF015,RF003 | RN08]', () => {
    let res;
    let next;

    // Aqui, criamos novos mocks de resposta e de proximo middleware antes de cada teste.
    beforeEach(() => {
        res = createMockRes();
        next = jest.fn();
    });

    // Aqui, agrupamos os testes do metodo responsavel pela criacao de eventos.
    describe('criar', () => {
        // Aqui, verificamos se o controller envia o corpo da requisicao ao service.
        it('envia o corpo da requisicao ao service', async () => {
            const req = createMockReq({ body: { ...mockEvento } });
            eventoService.criar.mockResolvedValue(mockEvento);

            await executarController(eventoController.criar, req, res, next);

            expect(eventoService.criar).toHaveBeenCalledWith(req.body);
        });

        // Aqui, verificamos se o controller retorna o status e o evento criado.
        it('retorna status 201 e o evento criado', async () => {
            const req = createMockReq({ body: { ...mockEvento } });
            eventoService.criar.mockResolvedValue(mockEvento);

            await executarController(eventoController.criar, req, res, next);

            expect(res.status).toHaveBeenCalledWith(201);
            expect(res.json).toHaveBeenCalledWith(mockEvento);
            expect(next).not.toHaveBeenCalled();
        });

        // Aqui, verificamos se o controller encaminha erros de criacao ao middleware de erros.
        it('encaminha erros do service para o middleware de erros', async () => {
            const erro = new Error('Falha ao criar evento');
            const req = createMockReq({ body: { ...mockEvento } });
            eventoService.criar.mockRejectedValue(erro);

            await executarController(eventoController.criar, req, res, next);

            expect(next).toHaveBeenCalledWith(erro);
            expect(res.json).not.toHaveBeenCalled();
        });
    });

    // Aqui, agrupamos os testes do metodo responsavel pela listagem de eventos.
    describe('listar', () => {
        // Aqui, verificamos se o controller envia todos os filtros recebidos ao service.
        it('envia todos os filtros da query ao service', async () => {
            const query = {
                nome: 'Workshop',
                tipo: 'Workshop',
                local: 'Lab',
                data_inicio: '2026-06-01',
                data_fim: '2026-06-30'
            };
            const req = createMockReq({ query });
            eventoService.listarTodos.mockResolvedValue([mockEvento]);

            await executarController(eventoController.listar, req, res, next);

            expect(eventoService.listarTodos).toHaveBeenCalledWith(query);
        });

        // Aqui, verificamos se o controller envia filtros indefinidos quando nao recebe uma query.
        it('envia filtros indefinidos quando a query esta vazia', async () => {
            const req = createMockReq();
            eventoService.listarTodos.mockResolvedValue([]);

            await executarController(eventoController.listar, req, res, next);

            expect(eventoService.listarTodos).toHaveBeenCalledWith({
                nome: undefined,
                tipo: undefined,
                local: undefined,
                data_inicio: undefined,
                data_fim: undefined
            });
        });

        // Aqui, verificamos se o controller retorna a lista de eventos encontrada.
        it('retorna os eventos encontrados', async () => {
            const req = createMockReq();
            const eventos = [mockEvento];
            eventoService.listarTodos.mockResolvedValue(eventos);

            await executarController(eventoController.listar, req, res, next);

            expect(res.json).toHaveBeenCalledWith(eventos);
            expect(next).not.toHaveBeenCalled();
        });

        // Aqui, verificamos se o controller encaminha erros de listagem ao middleware de erros.
        it('encaminha erros do service para o middleware de erros', async () => {
            const erro = new Error('Falha ao listar eventos');
            const req = createMockReq();
            eventoService.listarTodos.mockRejectedValue(erro);

            await executarController(eventoController.listar, req, res, next);

            expect(next).toHaveBeenCalledWith(erro);
            expect(res.json).not.toHaveBeenCalled();
        });
    });

    // Aqui, agrupamos os testes do metodo responsavel pela busca de um evento por ID.
    describe('buscarPorId', () => {
        // Aqui, verificamos se o controller converte o ID e consulta o service.
        it('converte o ID para numero e consulta o service', async () => {
            const req = createMockReq({ params: { id: '1' } });
            eventoService.buscarPorId.mockResolvedValue(mockEvento);

            await executarController(eventoController.buscarPorId, req, res, next);

            expect(eventoService.buscarPorId).toHaveBeenCalledWith(1);
        });

        // Aqui, verificamos se o controller retorna o evento encontrado.
        it('retorna o evento encontrado', async () => {
            const req = createMockReq({ params: { id: '1' } });
            eventoService.buscarPorId.mockResolvedValue(mockEvento);

            await executarController(eventoController.buscarPorId, req, res, next);

            expect(res.json).toHaveBeenCalledWith(mockEvento);
            expect(next).not.toHaveBeenCalled();
        });

        // Aqui, verificamos se o controller rejeita um ID invalido antes de consultar o service.
        it('encaminha BadRequestError quando o ID e invalido', async () => {
            const req = createMockReq({ params: { id: 'abc' } });

            await executarController(eventoController.buscarPorId, req, res, next);

            expect(next).toHaveBeenCalledWith(expect.any(BadRequestError));
            expect(eventoService.buscarPorId).not.toHaveBeenCalled();
        });

        // Aqui, verificamos se o controller encaminha erros de busca ao middleware de erros.
        it('encaminha erros do service para o middleware de erros', async () => {
            const erro = new Error('Evento nao encontrado');
            const req = createMockReq({ params: { id: '1' } });
            eventoService.buscarPorId.mockRejectedValue(erro);

            await executarController(eventoController.buscarPorId, req, res, next);

            expect(next).toHaveBeenCalledWith(erro);
            expect(res.json).not.toHaveBeenCalled();
        });
    });

    // Aqui, agrupamos os testes do metodo responsavel pela atualizacao de eventos.
    describe('atualizar', () => {
        // Aqui, verificamos se o controller converte o ID e envia os novos dados ao service.
        it('converte o ID e envia os dados ao service', async () => {
            const body = { nome: 'Workshop atualizado' };
            const req = createMockReq({ params: { id: '1' }, body });
            eventoService.atualizar.mockResolvedValue({ ...mockEvento, ...body });

            await executarController(eventoController.atualizar, req, res, next);

            expect(eventoService.atualizar).toHaveBeenCalledWith(1, body);
        });

        // Aqui, verificamos se o controller retorna o evento atualizado.
        it('retorna o evento atualizado', async () => {
            const eventoAtualizado = { ...mockEvento, nome: 'Workshop atualizado' };
            const req = createMockReq({
                params: { id: '1' },
                body: { nome: eventoAtualizado.nome }
            });
            eventoService.atualizar.mockResolvedValue(eventoAtualizado);

            await executarController(eventoController.atualizar, req, res, next);

            expect(res.json).toHaveBeenCalledWith(eventoAtualizado);
            expect(next).not.toHaveBeenCalled();
        });

        // Aqui, verificamos se o controller rejeita um ID invalido antes de atualizar o evento.
        it('encaminha BadRequestError quando o ID e invalido', async () => {
            const req = createMockReq({ params: { id: '0' }, body: {} });

            await executarController(eventoController.atualizar, req, res, next);

            expect(next).toHaveBeenCalledWith(expect.any(BadRequestError));
            expect(eventoService.atualizar).not.toHaveBeenCalled();
        });

        // Aqui, verificamos se o controller encaminha erros de atualizacao ao middleware de erros.
        it('encaminha erros do service para o middleware de erros', async () => {
            const erro = new Error('Falha ao atualizar evento');
            const req = createMockReq({ params: { id: '1' }, body: {} });
            eventoService.atualizar.mockRejectedValue(erro);

            await executarController(eventoController.atualizar, req, res, next);

            expect(next).toHaveBeenCalledWith(erro);
            expect(res.json).not.toHaveBeenCalled();
        });
    });

    // Aqui, agrupamos os testes do metodo responsavel pela exclusao de eventos.
    describe('excluir', () => {
        // Aqui, verificamos se o controller converte o ID e solicita a exclusao ao service.
        it('converte o ID e solicita a exclusao ao service', async () => {
            const req = createMockReq({ params: { id: '1' } });
            eventoService.excluir.mockResolvedValue();

            await executarController(eventoController.excluir, req, res, next);

            expect(eventoService.excluir).toHaveBeenCalledWith(1);
        });

        // Aqui, verificamos se o controller retorna o status 204 sem conteudo.
        it('retorna status 204 sem conteudo', async () => {
            const req = createMockReq({ params: { id: '1' } });
            eventoService.excluir.mockResolvedValue();

            await executarController(eventoController.excluir, req, res, next);

            expect(res.status).toHaveBeenCalledWith(204);
            expect(res.send).toHaveBeenCalledWith();
            expect(next).not.toHaveBeenCalled();
        });

        // Aqui, verificamos se o controller rejeita um ID invalido antes de excluir o evento.
        it('encaminha BadRequestError quando o ID e invalido', async () => {
            const req = createMockReq({ params: { id: '-1' } });

            await executarController(eventoController.excluir, req, res, next);

            expect(next).toHaveBeenCalledWith(expect.any(BadRequestError));
            expect(eventoService.excluir).not.toHaveBeenCalled();
            expect(res.status).not.toHaveBeenCalled();
        });
    });
});

// Aqui, agrupamos os testes de integracao HTTP dos endpoints de eventos.
describe('Endpoints de eventos', () => {
    let token;

    // Aqui, autenticamos um usuario autorizado antes de cada teste de endpoint.
    beforeEach(() => {
        mockAuthenticatedUser(pool);
        token = createAuthToken();
        jest.spyOn(console, 'error').mockImplementation(() => {});
    });

    // Aqui, verificamos se a rota rejeita requisicoes sem token.
    it('retorna 401 ao listar eventos sem autenticacao', async () => {
        await request(endpointApp)
            .get('/api/eventos')
            .expect(401);
    });

    // Aqui, verificamos se a rota impede a criacao por um perfil sem permissao.
    it('retorna 403 ao criar evento com perfil nao autorizado', async () => {
        const tokenAluno = createAuthToken('Jovem');

        await request(endpointApp)
            .post('/api/eventos')
            .set('Authorization', `Bearer ${tokenAluno}`)
            .send(mockEvento)
            .expect(403);

        expect(eventoService.criar).not.toHaveBeenCalled();
    });

    // Aqui, verificamos o fluxo HTTP completo de criacao de evento.
    it('retorna 201 ao criar um evento autenticado', async () => {
        eventoService.criar.mockResolvedValue(mockEvento);

        const resposta = await request(endpointApp)
            .post('/api/eventos')
            .set('Authorization', `Bearer ${token}`)
            .send(mockEvento)
            .expect(201);

        expect(resposta.body).toEqual(mockEvento);
    });

    // Aqui, verificamos o fluxo HTTP completo de listagem de eventos.
    it('retorna 200 ao listar eventos autenticado', async () => {
        eventoService.listarTodos.mockResolvedValue([mockEvento]);

        const resposta = await request(endpointApp)
            .get('/api/eventos?tipo=Workshop')
            .set('Authorization', `Bearer ${token}`)
            .expect(200);

        expect(resposta.body).toEqual([mockEvento]);
    });

    // Aqui, verificamos se o errorHandler transforma um ID invalido em resposta HTTP 400.
    it('retorna 400 ao buscar evento com ID invalido', async () => {
        await request(endpointApp)
            .get('/api/eventos/invalido')
            .set('Authorization', `Bearer ${token}`)
            .expect(400);
    });

    // Aqui, verificamos o fluxo HTTP completo de atualizacao de evento.
    it('retorna 200 ao atualizar um evento autenticado', async () => {
        const atualizado = { ...mockEvento, nome: 'Evento atualizado' };
        eventoService.atualizar.mockResolvedValue(atualizado);

        const resposta = await request(endpointApp)
            .put('/api/eventos/1')
            .set('Authorization', `Bearer ${token}`)
            .send({ nome: atualizado.nome })
            .expect(200);

        expect(resposta.body).toEqual(atualizado);
    });

    // Aqui, verificamos o fluxo HTTP completo de exclusao de evento.
    it('retorna 204 ao excluir um evento autenticado', async () => {
        eventoService.excluir.mockResolvedValue();

        await request(endpointApp)
            .delete('/api/eventos/1')
            .set('Authorization', `Bearer ${token}`)
            .expect(204);
    });
});
