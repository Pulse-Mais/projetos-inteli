// Aqui, mockamos o service de participacoes em eventos para testar somente o controller.
jest.mock('../services/participacaoEventoService', () => ({
    criar: jest.fn(),
    listarTodos: jest.fn(),
    buscarPorId: jest.fn(),
    listarPorJovem: jest.fn(),
    listarPorEvento: jest.fn(),
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
const participacaoEventoService = require('../services/participacaoEventoService');
const participacaoEventoController = require('../controllers/participacaoEventoController');
const participacaoEventoRoutes = require('../routes/participacaoEventoRoutes');
const { pool } = require('../database/db');
const { BadRequestError } = require('../errors/AppError');
const { createMockReq, createMockRes } = require('./testHelper');
const {
    createEndpointTestApp,
    createAuthToken,
    mockAuthenticatedUser
} = require('./endpointTestHelper');

// Aqui, definimos o segredo usado para gerar e validar os tokens dos testes HTTP.
process.env.JWT_SECRET = 'segredo-participacao-evento-controller';

// Aqui, criamos uma aplicacao que monta as rotas reais de participacoes em eventos.
const endpointApp = createEndpointTestApp('/api/participacoes-eventos', participacaoEventoRoutes);

// Aqui, definimos uma participacao base para reutilizarmos nos diferentes cenarios de teste.
const mockParticipacao = {
    id: 3,
    jovem_id: 1,
    evento_id: 2,
    presente: true,
    criado_em: '2026-06-15T10:00:00.000Z'
};

// Aqui, executamos o controller e aguardamos a conclusao das operacoes assincronas.
const executarController = async (controller, req, res, next) => {
    controller(req, res, next);
    await new Promise(setImmediate);
};

// Aqui, agrupamos todos os testes relacionados ao controller de participacoes em eventos.
// Rastreabilidade (Art 11): RF015 + RF003 (autorização) | RN08 | HTTP 200/201/400/401/403/404/409
describe('ParticipacaoEventoController [RF015,RF003 | RN08]', () => {
    let res;
    let next;

    // Aqui, criamos novos mocks de resposta e de proximo middleware antes de cada teste.
    beforeEach(() => {
        res = createMockRes();
        next = jest.fn();
    });

    // Aqui, agrupamos os testes do metodo responsavel pela criacao de participacoes.
    describe('criar', () => {
        // Aqui, verificamos se o controller envia o corpo da requisicao ao service.
        it('envia o corpo da requisicao ao service', async () => {
            const req = createMockReq({ body: { jovem_id: 1, evento_id: 2, presente: true } });
            participacaoEventoService.criar.mockResolvedValue(mockParticipacao);

            await executarController(participacaoEventoController.criar, req, res, next);

            expect(participacaoEventoService.criar).toHaveBeenCalledWith(req.body);
        });

        // Aqui, verificamos se o controller retorna o status 201 e a participacao criada.
        it('retorna status 201 e a participacao criada', async () => {
            const req = createMockReq({ body: { jovem_id: 1, evento_id: 2, presente: true } });
            participacaoEventoService.criar.mockResolvedValue(mockParticipacao);

            await executarController(participacaoEventoController.criar, req, res, next);

            expect(res.status).toHaveBeenCalledWith(201);
            expect(res.json).toHaveBeenCalledWith(mockParticipacao);
            expect(next).not.toHaveBeenCalled();
        });

        // Aqui, verificamos se o controller encaminha erros de criacao ao middleware de erros.
        it('encaminha erros do service para o middleware de erros', async () => {
            const erro = new Error('Falha ao criar participacao');
            const req = createMockReq({ body: { jovem_id: 1, evento_id: 2 } });
            participacaoEventoService.criar.mockRejectedValue(erro);

            await executarController(participacaoEventoController.criar, req, res, next);

            expect(next).toHaveBeenCalledWith(erro);
            expect(res.json).not.toHaveBeenCalled();
        });
    });

    // Aqui, agrupamos os testes do metodo responsavel pela listagem de participacoes.
    describe('listar', () => {
        // Aqui, verificamos se o controller envia os filtros recebidos ao service.
        it('envia os filtros da query ao service', async () => {
            const query = { jovem_id: '1', evento_id: '2', presente: 'true' };
            const req = createMockReq({ query });
            participacaoEventoService.listarTodos.mockResolvedValue([mockParticipacao]);

            await executarController(participacaoEventoController.listar, req, res, next);

            expect(participacaoEventoService.listarTodos).toHaveBeenCalledWith(query);
        });

        // Aqui, verificamos se o controller retorna as participacoes encontradas.
        it('retorna as participacoes encontradas', async () => {
            const req = createMockReq();
            participacaoEventoService.listarTodos.mockResolvedValue([mockParticipacao]);

            await executarController(participacaoEventoController.listar, req, res, next);

            expect(res.json).toHaveBeenCalledWith([mockParticipacao]);
            expect(next).not.toHaveBeenCalled();
        });

        // Aqui, verificamos se o controller encaminha erros de listagem ao middleware de erros.
        it('encaminha erros do service para o middleware de erros', async () => {
            const erro = new Error('Falha ao listar participacoes');
            const req = createMockReq();
            participacaoEventoService.listarTodos.mockRejectedValue(erro);

            await executarController(participacaoEventoController.listar, req, res, next);

            expect(next).toHaveBeenCalledWith(erro);
            expect(res.json).not.toHaveBeenCalled();
        });
    });

    // Aqui, agrupamos os testes do metodo responsavel pela busca de uma participacao por ID.
    describe('buscarPorId', () => {
        // Aqui, verificamos se o controller converte o ID e retorna a participacao encontrada.
        it('converte o ID e retorna a participacao encontrada', async () => {
            const req = createMockReq({ params: { id: '3' } });
            participacaoEventoService.buscarPorId.mockResolvedValue(mockParticipacao);

            await executarController(participacaoEventoController.buscarPorId, req, res, next);

            expect(participacaoEventoService.buscarPorId).toHaveBeenCalledWith(3);
            expect(res.json).toHaveBeenCalledWith(mockParticipacao);
            expect(next).not.toHaveBeenCalled();
        });

        // Aqui, verificamos se o controller rejeita um ID invalido antes de consultar o service.
        it('encaminha BadRequestError quando o ID e invalido', async () => {
            const req = createMockReq({ params: { id: 'abc' } });

            await executarController(participacaoEventoController.buscarPorId, req, res, next);

            expect(next).toHaveBeenCalledWith(expect.any(BadRequestError));
            expect(participacaoEventoService.buscarPorId).not.toHaveBeenCalled();
        });
    });

    // Aqui, agrupamos os testes do metodo responsavel pela listagem por jovem.
    describe('listarPorJovem', () => {
        // Aqui, verificamos se o controller converte o ID do jovem e retorna seu historico.
        it('converte o ID do jovem e retorna suas participacoes', async () => {
            const req = createMockReq({ params: { jovem_id: '1' } });
            participacaoEventoService.listarPorJovem.mockResolvedValue([mockParticipacao]);

            await executarController(participacaoEventoController.listarPorJovem, req, res, next);

            expect(participacaoEventoService.listarPorJovem).toHaveBeenCalledWith(1);
            expect(res.json).toHaveBeenCalledWith([mockParticipacao]);
        });

        // Aqui, verificamos se o controller rejeita um ID de jovem invalido.
        it('encaminha BadRequestError quando o ID do jovem e invalido', async () => {
            const req = createMockReq({ params: { jovem_id: '0' } });

            await executarController(participacaoEventoController.listarPorJovem, req, res, next);

            expect(next).toHaveBeenCalledWith(expect.any(BadRequestError));
            expect(participacaoEventoService.listarPorJovem).not.toHaveBeenCalled();
        });
    });

    // Aqui, agrupamos os testes do metodo responsavel pela listagem por evento.
    describe('listarPorEvento', () => {
        // Aqui, verificamos se o controller converte o ID do evento e retorna seus participantes.
        it('converte o ID do evento e retorna seus participantes', async () => {
            const req = createMockReq({ params: { evento_id: '2' } });
            participacaoEventoService.listarPorEvento.mockResolvedValue([mockParticipacao]);

            await executarController(participacaoEventoController.listarPorEvento, req, res, next);

            expect(participacaoEventoService.listarPorEvento).toHaveBeenCalledWith(2);
            expect(res.json).toHaveBeenCalledWith([mockParticipacao]);
        });

        // Aqui, verificamos se o controller rejeita um ID de evento invalido.
        it('encaminha BadRequestError quando o ID do evento e invalido', async () => {
            const req = createMockReq({ params: { evento_id: '-2' } });

            await executarController(participacaoEventoController.listarPorEvento, req, res, next);

            expect(next).toHaveBeenCalledWith(expect.any(BadRequestError));
            expect(participacaoEventoService.listarPorEvento).not.toHaveBeenCalled();
        });
    });

    // Aqui, agrupamos os testes do metodo responsavel pela atualizacao de participacoes.
    describe('atualizar', () => {
        // Aqui, verificamos se o controller converte o ID e retorna a participacao atualizada.
        it('converte o ID e retorna a participacao atualizada', async () => {
            const body = { presente: false };
            const participacaoAtualizada = { ...mockParticipacao, ...body };
            const req = createMockReq({ params: { id: '3' }, body });
            participacaoEventoService.atualizar.mockResolvedValue(participacaoAtualizada);

            await executarController(participacaoEventoController.atualizar, req, res, next);

            expect(participacaoEventoService.atualizar).toHaveBeenCalledWith(3, body);
            expect(res.json).toHaveBeenCalledWith(participacaoAtualizada);
        });

        // Aqui, verificamos se o controller rejeita um ID invalido antes da atualizacao.
        it('encaminha BadRequestError quando o ID e invalido', async () => {
            const req = createMockReq({ params: { id: '0' }, body: { presente: false } });

            await executarController(participacaoEventoController.atualizar, req, res, next);

            expect(next).toHaveBeenCalledWith(expect.any(BadRequestError));
            expect(participacaoEventoService.atualizar).not.toHaveBeenCalled();
        });
    });

    // Aqui, agrupamos os testes do metodo responsavel pela exclusao de participacoes.
    describe('excluir', () => {
        // Aqui, verificamos se o controller solicita a exclusao e retorna o status 204.
        it('converte o ID, exclui a participacao e retorna status 204', async () => {
            const req = createMockReq({ params: { id: '3' } });
            participacaoEventoService.excluir.mockResolvedValue();

            await executarController(participacaoEventoController.excluir, req, res, next);

            expect(participacaoEventoService.excluir).toHaveBeenCalledWith(3);
            expect(res.status).toHaveBeenCalledWith(204);
            expect(res.send).toHaveBeenCalledWith();
            expect(next).not.toHaveBeenCalled();
        });

        // Aqui, verificamos se o controller rejeita um ID invalido antes da exclusao.
        it('encaminha BadRequestError quando o ID e invalido', async () => {
            const req = createMockReq({ params: { id: 'invalido' } });

            await executarController(participacaoEventoController.excluir, req, res, next);

            expect(next).toHaveBeenCalledWith(expect.any(BadRequestError));
            expect(participacaoEventoService.excluir).not.toHaveBeenCalled();
            expect(res.status).not.toHaveBeenCalled();
        });
    });
});

// Aqui, agrupamos os testes de integracao HTTP dos endpoints de participacoes em eventos.
describe('Endpoints de participacoes em eventos', () => {
    let token;

    // Aqui, autenticamos um usuario autorizado antes de cada teste de endpoint.
    beforeEach(() => {
        mockAuthenticatedUser(pool);
        token = createAuthToken();
    });

    // Aqui, verificamos se a rota rejeita requisicoes sem token.
    it('retorna 401 ao listar participacoes sem autenticacao', async () => {
        await request(endpointApp)
            .get('/api/participacoes-eventos')
            .expect(401);
    });

    // Aqui, verificamos o fluxo HTTP completo de criacao de participacao.
    it('retorna 201 ao criar uma participacao autenticada', async () => {
        participacaoEventoService.criar.mockResolvedValue(mockParticipacao);

        const resposta = await request(endpointApp)
            .post('/api/participacoes-eventos')
            .set('Authorization', `Bearer ${token}`)
            .send({ jovem_id: 1, evento_id: 2, presente: true })
            .expect(201);

        expect(resposta.body).toEqual(mockParticipacao);
    });

    // Aqui, verificamos o fluxo HTTP completo de listagem de participacoes.
    it('retorna 200 ao listar participacoes', async () => {
        participacaoEventoService.listarTodos.mockResolvedValue([mockParticipacao]);

        const resposta = await request(endpointApp)
            .get('/api/participacoes-eventos?presente=true')
            .set('Authorization', `Bearer ${token}`)
            .expect(200);

        expect(resposta.body).toEqual([mockParticipacao]);
    });

    // Aqui, verificamos o fluxo HTTP completo de busca por ID.
    it('retorna 200 ao buscar uma participacao por ID', async () => {
        participacaoEventoService.buscarPorId.mockResolvedValue(mockParticipacao);

        await request(endpointApp)
            .get('/api/participacoes-eventos/3')
            .set('Authorization', `Bearer ${token}`)
            .expect(200, mockParticipacao);
    });

    // Aqui, verificamos o fluxo HTTP completo de listagem por jovem.
    it('retorna 200 ao listar participacoes por jovem', async () => {
        participacaoEventoService.listarPorJovem.mockResolvedValue([mockParticipacao]);

        await request(endpointApp)
            .get('/api/participacoes-eventos/jovem/1')
            .set('Authorization', `Bearer ${token}`)
            .expect(200, [mockParticipacao]);
    });

    // Aqui, verificamos o fluxo HTTP completo de listagem por evento.
    it('retorna 200 ao listar participantes por evento', async () => {
        participacaoEventoService.listarPorEvento.mockResolvedValue([mockParticipacao]);

        await request(endpointApp)
            .get('/api/participacoes-eventos/evento/2')
            .set('Authorization', `Bearer ${token}`)
            .expect(200, [mockParticipacao]);
    });

    // Aqui, verificamos o fluxo HTTP completo de atualizacao de participacao.
    it('retorna 200 ao atualizar uma participacao', async () => {
        const atualizada = { ...mockParticipacao, presente: false };
        participacaoEventoService.atualizar.mockResolvedValue(atualizada);

        await request(endpointApp)
            .put('/api/participacoes-eventos/3')
            .set('Authorization', `Bearer ${token}`)
            .send({ presente: false })
            .expect(200, atualizada);
    });

    // Aqui, verificamos o fluxo HTTP completo de exclusao de participacao.
    it('retorna 204 ao excluir uma participacao', async () => {
        participacaoEventoService.excluir.mockResolvedValue();

        await request(endpointApp)
            .delete('/api/participacoes-eventos/3')
            .set('Authorization', `Bearer ${token}`)
            .expect(204);
    });
});
