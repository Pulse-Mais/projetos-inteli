// Aqui, mockamos o service de anotacoes para testar somente o comportamento do controller.
jest.mock('../services/anotacaoService', () => ({
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
const anotacaoService = require('../services/anotacaoService');
const anotacaoController = require('../controllers/anotacaoController');
const anotacaoRoutes = require('../routes/anotacaoRoutes');
const { pool } = require('../database/db');
const { BadRequestError } = require('../errors/AppError');
const { createMockReq, createMockRes } = require('./testHelper');
const {
    createEndpointTestApp,
    createAuthToken,
    mockAuthenticatedUser
} = require('./endpointTestHelper');

// Aqui, definimos o segredo usado para gerar e validar os tokens dos testes HTTP.
process.env.JWT_SECRET = 'segredo-anotacao-controller';

// Aqui, criamos uma aplicacao que monta as rotas reais de anotacoes.
const endpointApp = createEndpointTestApp('/api/anotacoes', anotacaoRoutes);

// Aqui, definimos uma anotacao base para reutilizarmos nos diferentes cenarios de teste.
const mockAnotacao = {
    id: 1,
    jovem_id: 1,
    autor_id: 7,
    categoria: 'Mentoria',
    tipo_alerta: 'Geral',
    texto: 'Jovem demonstrou evolucao significativa.',
    criado_em: '2026-06-09T10:00:00.000Z'
};

// Aqui, definimos um usuario autenticado para simular os dados adicionados pelo middleware.
const mockUsuario = {
    id: 7,
    perfil: 'Coordenacao'
};

// Aqui, executamos o controller e aguardamos a conclusao das operacoes assincronas.
const executarController = async (controller, req, res, next) => {
    controller(req, res, next);
    await new Promise(setImmediate);
};

// Aqui, agrupamos todos os testes relacionados ao controller de anotacoes.
// Rastreabilidade (Art 11): RF006 + RF003 (autorização) | RN08,RN13,RN14 | HTTP 200/201/400/401/403/404
describe('AnotacaoController [RF006,RF003 | RN08,RN13,RN14]', () => {
    let res;
    let next;

    // Aqui, criamos novos mocks de resposta e de proximo middleware antes de cada teste.
    beforeEach(() => {
        res = createMockRes();
        next = jest.fn();
    });

    // Aqui, agrupamos os testes do metodo responsavel pela criacao de anotacoes.
    describe('criar', () => {
        // Aqui, verificamos se o controller usa o usuario autenticado como autor da anotacao.
        it('envia os dados ao service com o autor autenticado', async () => {
            const body = {
                jovem_id: 1,
                autor_id: 99,
                categoria: 'Mentoria',
                tipo_alerta: 'Geral',
                texto: mockAnotacao.texto
            };
            const req = createMockReq({ body, usuario: mockUsuario });
            anotacaoService.criar.mockResolvedValue(mockAnotacao);

            await executarController(anotacaoController.criar, req, res, next);

            expect(anotacaoService.criar).toHaveBeenCalledWith({
                ...body,
                autor_id: mockUsuario.id
            });
        });

        // Aqui, verificamos se o controller retorna o status 201 e a anotacao criada.
        it('retorna status 201 e a anotacao criada', async () => {
            const req = createMockReq({ body: { ...mockAnotacao }, usuario: mockUsuario });
            anotacaoService.criar.mockResolvedValue(mockAnotacao);

            await executarController(anotacaoController.criar, req, res, next);

            expect(res.status).toHaveBeenCalledWith(201);
            expect(res.json).toHaveBeenCalledWith(mockAnotacao);
            expect(next).not.toHaveBeenCalled();
        });

        // Aqui, verificamos se o controller encaminha erros de criacao ao middleware de erros.
        it('encaminha erros do service para o middleware de erros', async () => {
            const erro = new Error('Falha ao criar anotacao');
            const req = createMockReq({ body: { ...mockAnotacao }, usuario: mockUsuario });
            anotacaoService.criar.mockRejectedValue(erro);

            await executarController(anotacaoController.criar, req, res, next);

            expect(next).toHaveBeenCalledWith(erro);
            expect(res.json).not.toHaveBeenCalled();
        });
    });

    // Aqui, agrupamos os testes do metodo responsavel pela listagem de anotacoes.
    describe('listar', () => {
        // Aqui, verificamos se o controller envia os filtros e o perfil autenticado ao service.
        it('envia os filtros e o perfil do usuario ao service', async () => {
            const query = { jovem_id: '1', categoria: 'Mentoria', tipo_alerta: 'Geral' };
            const req = createMockReq({ query, usuario: mockUsuario });
            anotacaoService.listarTodos.mockResolvedValue([mockAnotacao]);

            await executarController(anotacaoController.listar, req, res, next);

            expect(anotacaoService.listarTodos).toHaveBeenCalledWith({
                ...query,
                perfil: mockUsuario.perfil
            });
        });

        // Aqui, verificamos se o controller retorna as anotacoes encontradas.
        it('retorna as anotacoes encontradas', async () => {
            const req = createMockReq({ usuario: mockUsuario });
            anotacaoService.listarTodos.mockResolvedValue([mockAnotacao]);

            await executarController(anotacaoController.listar, req, res, next);

            expect(res.json).toHaveBeenCalledWith([mockAnotacao]);
            expect(next).not.toHaveBeenCalled();
        });

        // Aqui, verificamos se o controller encaminha erros de listagem ao middleware de erros.
        it('encaminha erros do service para o middleware de erros', async () => {
            const erro = new Error('Falha ao listar anotacoes');
            const req = createMockReq({ usuario: mockUsuario });
            anotacaoService.listarTodos.mockRejectedValue(erro);

            await executarController(anotacaoController.listar, req, res, next);

            expect(next).toHaveBeenCalledWith(erro);
            expect(res.json).not.toHaveBeenCalled();
        });
    });

    // Aqui, agrupamos os testes do metodo responsavel pela busca de uma anotacao por ID.
    describe('buscarPorId', () => {
        // Aqui, verificamos se o controller converte o ID e retorna a anotacao encontrada.
        it('converte o ID e retorna a anotacao encontrada', async () => {
            const req = createMockReq({ params: { id: '1' } });
            anotacaoService.buscarPorId.mockResolvedValue(mockAnotacao);

            await executarController(anotacaoController.buscarPorId, req, res, next);

            expect(anotacaoService.buscarPorId).toHaveBeenCalledWith(1);
            expect(res.json).toHaveBeenCalledWith(mockAnotacao);
            expect(next).not.toHaveBeenCalled();
        });

        // Aqui, verificamos se o controller rejeita um ID invalido antes de consultar o service.
        it('encaminha BadRequestError quando o ID e invalido', async () => {
            const req = createMockReq({ params: { id: 'abc' } });

            await executarController(anotacaoController.buscarPorId, req, res, next);

            expect(next).toHaveBeenCalledWith(expect.any(BadRequestError));
            expect(anotacaoService.buscarPorId).not.toHaveBeenCalled();
        });
    });

    // Aqui, agrupamos os testes do metodo responsavel pela atualizacao de anotacoes.
    describe('atualizar', () => {
        // Aqui, verificamos se o controller converte o ID e retorna a anotacao atualizada.
        it('converte o ID e retorna a anotacao atualizada', async () => {
            const body = { texto: 'Anotacao atualizada.' };
            const anotacaoAtualizada = { ...mockAnotacao, ...body };
            const req = createMockReq({ params: { id: '1' }, body });
            anotacaoService.atualizar.mockResolvedValue(anotacaoAtualizada);

            await executarController(anotacaoController.atualizar, req, res, next);

            expect(anotacaoService.atualizar).toHaveBeenCalledWith(1, body);
            expect(res.json).toHaveBeenCalledWith(anotacaoAtualizada);
        });

        // Aqui, verificamos se o controller rejeita um ID invalido antes da atualizacao.
        it('encaminha BadRequestError quando o ID e invalido', async () => {
            const req = createMockReq({ params: { id: '0' }, body: {} });

            await executarController(anotacaoController.atualizar, req, res, next);

            expect(next).toHaveBeenCalledWith(expect.any(BadRequestError));
            expect(anotacaoService.atualizar).not.toHaveBeenCalled();
        });

        // Aqui, verificamos se o controller encaminha erros de atualizacao ao middleware de erros.
        it('encaminha erros do service para o middleware de erros', async () => {
            const erro = new Error('Falha ao atualizar anotacao');
            const req = createMockReq({ params: { id: '1' }, body: {} });
            anotacaoService.atualizar.mockRejectedValue(erro);

            await executarController(anotacaoController.atualizar, req, res, next);

            expect(next).toHaveBeenCalledWith(erro);
            expect(res.json).not.toHaveBeenCalled();
        });
    });

    // Aqui, agrupamos os testes do metodo responsavel pela exclusao de anotacoes.
    describe('excluir', () => {
        // Aqui, verificamos se o controller exclui a anotacao e retorna o status 204.
        it('converte o ID, exclui a anotacao e retorna status 204', async () => {
            const req = createMockReq({ params: { id: '1' } });
            anotacaoService.excluir.mockResolvedValue();

            await executarController(anotacaoController.excluir, req, res, next);

            expect(anotacaoService.excluir).toHaveBeenCalledWith(1);
            expect(res.status).toHaveBeenCalledWith(204);
            expect(res.send).toHaveBeenCalledWith();
            expect(next).not.toHaveBeenCalled();
        });

        // Aqui, verificamos se o controller rejeita um ID invalido antes da exclusao.
        it('encaminha BadRequestError quando o ID e invalido', async () => {
            const req = createMockReq({ params: { id: '-1' } });

            await executarController(anotacaoController.excluir, req, res, next);

            expect(next).toHaveBeenCalledWith(expect.any(BadRequestError));
            expect(anotacaoService.excluir).not.toHaveBeenCalled();
            expect(res.status).not.toHaveBeenCalled();
        });

        // Aqui, verificamos se o controller encaminha erros de exclusao ao middleware de erros.
        it('encaminha erros do service para o middleware de erros', async () => {
            const erro = new Error('Falha ao excluir anotacao');
            const req = createMockReq({ params: { id: '1' } });
            anotacaoService.excluir.mockRejectedValue(erro);

            await executarController(anotacaoController.excluir, req, res, next);

            expect(next).toHaveBeenCalledWith(erro);
            expect(res.status).not.toHaveBeenCalled();
        });
    });
});

// Aqui, agrupamos os testes de integracao HTTP dos endpoints de anotacoes.
describe('Endpoints de anotacoes', () => {
    let token;

    // Aqui, autenticamos um usuario autorizado antes de cada teste de endpoint.
    beforeEach(() => {
        mockAuthenticatedUser(pool);
        token = createAuthToken(mockUsuario.perfil, { id: mockUsuario.id });
    });

    // Aqui, verificamos se a rota rejeita requisicoes sem token.
    it('retorna 401 ao listar anotacoes sem autenticacao', async () => {
        await request(endpointApp)
            .get('/api/anotacoes')
            .expect(401);
    });

    // Aqui, verificamos o fluxo HTTP completo de criacao de anotacao.
    it('retorna 201 ao criar uma anotacao autenticada', async () => {
        anotacaoService.criar.mockResolvedValue(mockAnotacao);

        await request(endpointApp)
            .post('/api/anotacoes')
            .set('Authorization', `Bearer ${token}`)
            .send(mockAnotacao)
            .expect(201, mockAnotacao);

        expect(anotacaoService.criar).toHaveBeenCalledWith({
            ...mockAnotacao,
            autor_id: mockUsuario.id
        });
    });

    // Aqui, verificamos o fluxo HTTP completo de listagem de anotacoes.
    it('retorna 200 ao listar anotacoes', async () => {
        anotacaoService.listarTodos.mockResolvedValue([mockAnotacao]);

        await request(endpointApp)
            .get('/api/anotacoes?categoria=Mentoria')
            .set('Authorization', `Bearer ${token}`)
            .expect(200, [mockAnotacao]);
    });

    // Aqui, verificamos o fluxo HTTP completo de busca de anotacao por ID.
    it('retorna 200 ao buscar uma anotacao por ID', async () => {
        anotacaoService.buscarPorId.mockResolvedValue(mockAnotacao);

        await request(endpointApp)
            .get('/api/anotacoes/1')
            .set('Authorization', `Bearer ${token}`)
            .expect(200, mockAnotacao);
    });

    // Aqui, verificamos o fluxo HTTP completo de atualizacao de anotacao.
    it('retorna 200 ao atualizar uma anotacao', async () => {
        const atualizada = { ...mockAnotacao, texto: 'Anotacao atualizada.' };
        anotacaoService.atualizar.mockResolvedValue(atualizada);

        await request(endpointApp)
            .put('/api/anotacoes/1')
            .set('Authorization', `Bearer ${token}`)
            .send({ texto: atualizada.texto })
            .expect(200, atualizada);
    });

    // Aqui, verificamos o fluxo HTTP completo de exclusao de anotacao.
    it('retorna 204 ao excluir uma anotacao', async () => {
        anotacaoService.excluir.mockResolvedValue();

        await request(endpointApp)
            .delete('/api/anotacoes/1')
            .set('Authorization', `Bearer ${token}`)
            .expect(204);
    });
});
