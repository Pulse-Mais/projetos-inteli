// src/tests/oportunidade.controller.test.js

jest.mock('../services/oportunidadeService', () => ({
    criar: jest.fn(),
    listarTodos: jest.fn(),
    buscarPorId: jest.fn(),
    atualizar: jest.fn(),
    excluir: jest.fn()
}));

jest.mock('../database/db', () => ({
    pool: { query: jest.fn() }
}));

const request = require('supertest');
const oportunidadeService = require('../services/oportunidadeService');
const oportunidadeRoutes = require('../routes/oportunidadeRoutes');
const { pool } = require('../database/db');
const { createMockReq, createMockRes } = require('./testHelper');
const {
    createEndpointTestApp,
    createAuthToken,
    mockAuthenticatedUser
} = require('./endpointTestHelper');

process.env.JWT_SECRET = 'segredo-oportunidade-controller';

const endpointApp = createEndpointTestApp('/api/oportunidades', oportunidadeRoutes);

const mockOportunidade = {
    id: 1,
    tipo: 'Curso',
    titulo: 'Python para Iniciantes',
    instituicao: 'Pulse Mais',
    descricao: 'Curso introdutório de programação.',
    modalidade: 'Online',
    ativo: true,
    criado_em: '2026-06-01T10:00:00.000Z'
};

const executarController = async (controller, req, res, next) => {
    controller(req, res, next);
    await new Promise(setImmediate);
};

// ============================================================ testes unitarios
// Rastreabilidade (Art 11): RF004,RF013 + RF003 (autorização) | RN08 | HTTP 200/201/400/401/403/404
describe('OportunidadeController — unidade [RF004,RF013,RF003 | RN08]', () => {
    const oportunidadeController = require('../controllers/oportunidadeController');
    let res, next;

    beforeEach(() => {
        res = createMockRes();
        next = jest.fn();
        jest.clearAllMocks();
    });

    describe('criar', () => {
        it('envia o corpo da requisicao ao service', async () => {
            const req = createMockReq({ body: { ...mockOportunidade } });
            oportunidadeService.criar.mockResolvedValue(mockOportunidade);

            await executarController(oportunidadeController.criar, req, res, next);

            expect(oportunidadeService.criar).toHaveBeenCalledWith(req.body);
        });

        it('retorna status 201 e a oportunidade criada', async () => {
            const req = createMockReq({ body: { ...mockOportunidade } });
            oportunidadeService.criar.mockResolvedValue(mockOportunidade);

            await executarController(oportunidadeController.criar, req, res, next);

            expect(res.status).toHaveBeenCalledWith(201);
            expect(res.json).toHaveBeenCalledWith(mockOportunidade);
            expect(next).not.toHaveBeenCalled();
        });

        it('encaminha erros do service para o middleware de erros', async () => {
            const erro = new Error('Falha ao criar oportunidade');
            const req = createMockReq({ body: { ...mockOportunidade } });
            oportunidadeService.criar.mockRejectedValue(erro);

            await executarController(oportunidadeController.criar, req, res, next);

            expect(next).toHaveBeenCalledWith(erro);
            expect(res.json).not.toHaveBeenCalled();
        });
    });

    describe('listar', () => {
        it('repassa filtros da query ao service', async () => {
            const req = createMockReq({ query: { tipo: 'Curso', modalidade: 'Online', ativo: 'true' } });
            oportunidadeService.listarTodos.mockResolvedValue([mockOportunidade]);

            await executarController(oportunidadeController.listar, req, res, next);

            expect(oportunidadeService.listarTodos).toHaveBeenCalledWith({
                tipo: 'Curso',
                modalidade: 'Online',
                ativo: 'true'
            });
        });

        it('retorna status 200 e a lista de oportunidades', async () => {
            const req = createMockReq({ query: {} });
            oportunidadeService.listarTodos.mockResolvedValue([mockOportunidade]);

            await executarController(oportunidadeController.listar, req, res, next);

            expect(res.json).toHaveBeenCalledWith([mockOportunidade]);
        });
    });

    describe('buscarPorId', () => {
        it('retorna status 200 e a oportunidade quando encontrada', async () => {
            const req = createMockReq({ params: { id: '1' } });
            oportunidadeService.buscarPorId.mockResolvedValue(mockOportunidade);

            await executarController(oportunidadeController.buscarPorId, req, res, next);

            expect(oportunidadeService.buscarPorId).toHaveBeenCalledWith(1);
            expect(res.json).toHaveBeenCalledWith(mockOportunidade);
        });

        it('encaminha erro para next quando ID e invalido', async () => {
            const req = createMockReq({ params: { id: 'abc' } });

            await executarController(oportunidadeController.buscarPorId, req, res, next);

            expect(next).toHaveBeenCalled();
            expect(oportunidadeService.buscarPorId).not.toHaveBeenCalled();
        });
    });

    describe('atualizar', () => {
        it('retorna status 200 e a oportunidade atualizada', async () => {
            const atualizado = { ...mockOportunidade, titulo: 'Titulo Novo' };
            const req = createMockReq({ params: { id: '1' }, body: { titulo: 'Titulo Novo' } });
            oportunidadeService.atualizar.mockResolvedValue(atualizado);

            await executarController(oportunidadeController.atualizar, req, res, next);

            expect(oportunidadeService.atualizar).toHaveBeenCalledWith(1, { titulo: 'Titulo Novo' });
            expect(res.json).toHaveBeenCalledWith(atualizado);
        });
    });

    describe('excluir', () => {
        it('retorna status 204 ao excluir oportunidade', async () => {
            const req = createMockReq({ params: { id: '1' } });
            oportunidadeService.excluir.mockResolvedValue();

            await executarController(oportunidadeController.excluir, req, res, next);

            expect(oportunidadeService.excluir).toHaveBeenCalledWith(1);
            expect(res.status).toHaveBeenCalledWith(204);
            expect(res.send).toHaveBeenCalled();
        });
    });
});

// ============================================================ testes de endpoint
describe('OportunidadeController — endpoints HTTP', () => {
    let token;

    beforeEach(() => {
        mockAuthenticatedUser(pool);
        token = createAuthToken('GestaoGeral');
        jest.spyOn(console, 'error').mockImplementation(() => {});
        jest.clearAllMocks();
        mockAuthenticatedUser(pool);
    });

    // ---- ownership: autenticação ----
    it('retorna 401 ao acessar oportunidades sem autenticacao', async () => {
        await request(endpointApp)
            .get('/api/oportunidades')
            .expect(401);
    });

    // ---- ownership: autorização por perfil ----
    it('retorna 403 ao tentar criar oportunidade com perfil Mentor', async () => {
        const tokenMentor = createAuthToken('Mentor');
        mockAuthenticatedUser(pool);

        await request(endpointApp)
            .post('/api/oportunidades')
            .set('Authorization', `Bearer ${tokenMentor}`)
            .send(mockOportunidade)
            .expect(403);

        expect(oportunidadeService.criar).not.toHaveBeenCalled();
    });

    it('retorna 403 ao tentar criar oportunidade com perfil Aluno', async () => {
        const tokenAluno = createAuthToken('Aluno');
        mockAuthenticatedUser(pool);

        await request(endpointApp)
            .post('/api/oportunidades')
            .set('Authorization', `Bearer ${tokenAluno}`)
            .send(mockOportunidade)
            .expect(403);
    });

    it('retorna 403 ao tentar excluir oportunidade com perfil Assistente', async () => {
        const tokenAssistente = createAuthToken('Assistente');
        mockAuthenticatedUser(pool);

        await request(endpointApp)
            .delete('/api/oportunidades/1')
            .set('Authorization', `Bearer ${tokenAssistente}`)
            .expect(403);
    });

    // ---- fluxos de sucesso (200/201/204) ----
    it('retorna 201 ao criar oportunidade com perfil GestaoGeral', async () => {
        oportunidadeService.criar.mockResolvedValue(mockOportunidade);

        const resposta = await request(endpointApp)
            .post('/api/oportunidades')
            .set('Authorization', `Bearer ${token}`)
            .send(mockOportunidade)
            .expect(201);

        expect(resposta.body).toEqual(mockOportunidade);
    });

    it('retorna 201 ao criar oportunidade com perfil Coordenacao', async () => {
        const tokenCoord = createAuthToken('Coordenacao');
        mockAuthenticatedUser(pool);
        oportunidadeService.criar.mockResolvedValue(mockOportunidade);

        await request(endpointApp)
            .post('/api/oportunidades')
            .set('Authorization', `Bearer ${tokenCoord}`)
            .send(mockOportunidade)
            .expect(201);
    });

    it('retorna 200 ao listar oportunidades autenticado', async () => {
        oportunidadeService.listarTodos.mockResolvedValue([mockOportunidade]);

        const resposta = await request(endpointApp)
            .get('/api/oportunidades')
            .set('Authorization', `Bearer ${token}`)
            .expect(200);

        expect(resposta.body).toEqual([mockOportunidade]);
    });

    it('retorna 200 ao listar com filtros tipo e modalidade combinados', async () => {
        oportunidadeService.listarTodos.mockResolvedValue([mockOportunidade]);

        await request(endpointApp)
            .get('/api/oportunidades?tipo=Curso&modalidade=Online&ativo=true')
            .set('Authorization', `Bearer ${token}`)
            .expect(200);

        expect(oportunidadeService.listarTodos).toHaveBeenCalledWith(
            expect.objectContaining({ tipo: 'Curso', modalidade: 'Online', ativo: 'true' })
        );
    });

    it('retorna 200 ao buscar oportunidade por ID', async () => {
        oportunidadeService.buscarPorId.mockResolvedValue(mockOportunidade);

        const resposta = await request(endpointApp)
            .get('/api/oportunidades/1')
            .set('Authorization', `Bearer ${token}`)
            .expect(200);

        expect(resposta.body).toEqual(mockOportunidade);
    });

    it('retorna 400 ao buscar oportunidade com ID invalido', async () => {
        await request(endpointApp)
            .get('/api/oportunidades/invalido')
            .set('Authorization', `Bearer ${token}`)
            .expect(400);
    });

    it('retorna 200 ao atualizar oportunidade com perfil GestaoGeral', async () => {
        const atualizado = { ...mockOportunidade, titulo: 'Titulo Atualizado' };
        oportunidadeService.atualizar.mockResolvedValue(atualizado);

        const resposta = await request(endpointApp)
            .put('/api/oportunidades/1')
            .set('Authorization', `Bearer ${token}`)
            .send({ titulo: 'Titulo Atualizado' })
            .expect(200);

        expect(resposta.body).toEqual(atualizado);
    });

    it('retorna 204 ao excluir oportunidade com perfil GestaoGeral', async () => {
        oportunidadeService.excluir.mockResolvedValue();

        await request(endpointApp)
            .delete('/api/oportunidades/1')
            .set('Authorization', `Bearer ${token}`)
            .expect(204);
    });
});
