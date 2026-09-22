// Aqui, mockamos o service de programas para testar somente o comportamento do controller.
jest.mock('../services/programaService', () => ({
    criar: jest.fn(),
    listarTodos: jest.fn(),
    buscarPorId: jest.fn(),
    atualizar: jest.fn(),
    arquivar: jest.fn()
}));

// Aqui, mockamos a conexao com o banco para evitar dependencias externas durante os testes.
jest.mock('../database/db', () => ({
    pool: {
        query: jest.fn()
    }
}));

// Aqui, importamos as dependencias utilizadas nos cenarios de teste do controller.
const request = require('supertest');
const programaService = require('../services/programaService');
const programaController = require('../controllers/programaController');
const programaRoutes = require('../routes/programaRoutes');
const { pool } = require('../database/db');
const { NotFoundError, BadRequestError } = require('../errors/AppError');
const { createMockReq, createMockRes } = require('./testHelper');
const {
    createEndpointTestApp,
    createAuthToken,
    mockAuthenticatedUser
} = require('./endpointTestHelper');

// Aqui, definimos o segredo usado para gerar e validar os tokens dos testes HTTP.
process.env.JWT_SECRET = 'segredo-programa-controller';

// Aqui, criamos uma aplicacao que monta as rotas reais de programas.
const endpointApp = createEndpointTestApp('/api/programas', programaRoutes);

// Aqui, definimos um programa base para reutilizarmos nos diferentes cenarios de teste.
const mockPrograma = {
    id: 1,
    nome: 'Formacao Tech 2026',
    ano: 2026,
    tipo: 'Curso',
    carga_horaria: 140,
    coorte: '2026.1',
    data_inicio: '2026-02-01',
    data_fim: '2026-06-30',
    descricao: 'Curso intensivo de desenvolvimento web.',
    ativo: true
};

// Aqui, executamos o controller e aguardamos a conclusao das operacoes assincronas.
const executarController = async (controller, req, res, next) => {
    controller(req, res, next);
    await new Promise(setImmediate);
};

// Aqui, agrupamos todos os testes de unidade do controller de programas.
// Rastreabilidade (Art 11): RF004 + RF003 (autorização) | RN08 | HTTP 200/201/400/401/403/404
describe('ProgramaController [RF004,RF003 | RN08]', () => {
    let res;
    let next;

    beforeEach(() => {
        res = createMockRes();
        next = jest.fn();
    });

    describe('criar', () => {
        it('envia o corpo da requisicao ao service e retorna 201', async () => {
            const req = createMockReq({ body: { ...mockPrograma } });
            programaService.criar.mockResolvedValue(mockPrograma);

            await executarController(programaController.criar, req, res, next);

            expect(programaService.criar).toHaveBeenCalledWith(req.body);
            expect(res.status).toHaveBeenCalledWith(201);
            expect(res.json).toHaveBeenCalledWith(mockPrograma);
        });

        it('encaminha erros do service para o middleware de erros', async () => {
            const erro = new BadRequestError('Carga horaria negativa');
            const req = createMockReq({ body: { ...mockPrograma } });
            programaService.criar.mockRejectedValue(erro);

            await executarController(programaController.criar, req, res, next);

            expect(next).toHaveBeenCalledWith(erro);
        });
    });

    describe('listar', () => {
        it('repassa os filtros da query ao service', async () => {
            const req = createMockReq({ query: { ano: '2026', tipo: 'Curso' } });
            programaService.listarTodos.mockResolvedValue([mockPrograma]);

            await executarController(programaController.listar, req, res, next);

            expect(programaService.listarTodos).toHaveBeenCalledWith(
                expect.objectContaining({ ano: '2026', tipo: 'Curso' })
            );
            expect(res.json).toHaveBeenCalledWith([mockPrograma]);
        });
    });

    describe('buscarPorId', () => {
        it('converte o ID e retorna o programa encontrado', async () => {
            const req = createMockReq({ params: { id: '1' } });
            programaService.buscarPorId.mockResolvedValue(mockPrograma);

            await executarController(programaController.buscarPorId, req, res, next);

            expect(programaService.buscarPorId).toHaveBeenCalledWith(1);
            expect(res.json).toHaveBeenCalledWith(mockPrograma);
        });

        it('encaminha BadRequestError quando o ID e invalido', async () => {
            const req = createMockReq({ params: { id: 'abc' } });

            await executarController(programaController.buscarPorId, req, res, next);

            expect(next).toHaveBeenCalledWith(expect.any(BadRequestError));
        });
    });

    describe('atualizar', () => {
        it('converte o ID e retorna o programa atualizado', async () => {
            const atualizado = { ...mockPrograma, nome: 'Formacao Tech Avancada' };
            const req = createMockReq({ params: { id: '1' }, body: { nome: 'Formacao Tech Avancada' } });
            programaService.atualizar.mockResolvedValue(atualizado);

            await executarController(programaController.atualizar, req, res, next);

            expect(programaService.atualizar).toHaveBeenCalledWith(1, { nome: 'Formacao Tech Avancada' });
            expect(res.json).toHaveBeenCalledWith(atualizado);
        });
    });

    describe('arquivar', () => {
        it('converte o ID e persiste o arquivamento', async () => {
            const req = createMockReq({ params: { id: '1' } });
            programaService.arquivar.mockResolvedValue({ ...mockPrograma, ativo: false });

            await executarController(programaController.arquivar, req, res, next);

            expect(programaService.arquivar).toHaveBeenCalledWith(1);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ ativo: false }));
        });
    });
});

// Aqui, agrupamos os testes de integracao HTTP dos endpoints de programas.
describe('Endpoints de programas', () => {
    let token;

    beforeEach(() => {
        mockAuthenticatedUser(pool);
        token = createAuthToken('Coordenacao');
    });

    // ---- Cenario de autenticacao (401) ----
    it('retorna 401 ao criar programa sem autenticacao', async () => {
        await request(endpointApp)
            .post('/api/programas')
            .send(mockPrograma)
            .expect(401);
    });

    // ---- Cenario de autorizacao (403): Mentor nao pode criar programa ----
    it('retorna 403 ao criar programa com perfil sem permissao de escrita', async () => {
        const tokenMentor = createAuthToken('Mentor');

        await request(endpointApp)
            .post('/api/programas')
            .set('Authorization', `Bearer ${tokenMentor}`)
            .send(mockPrograma)
            .expect(403);
    });

    // ---- Cenario de sucesso (201) ----
    it('retorna 201 ao criar um programa com datas e carga horaria validas', async () => {
        programaService.criar.mockResolvedValue(mockPrograma);

        await request(endpointApp)
            .post('/api/programas')
            .set('Authorization', `Bearer ${token}`)
            .send(mockPrograma)
            .expect(201, mockPrograma);
    });

    // ---- Cenario de validacao (400): carga horaria negativa ----
    it('retorna 400 quando o service lanca BadRequestError (carga horaria negativa)', async () => {
        programaService.criar.mockRejectedValue(new BadRequestError('Carga horaria negativa'));

        await request(endpointApp)
            .post('/api/programas')
            .set('Authorization', `Bearer ${token}`)
            .send({ ...mockPrograma, carga_horaria: -10 })
            .expect(400);
    });

    // ---- Cenario de recurso nao encontrado (404) ----
    it('retorna 404 ao buscar programa inexistente', async () => {
        programaService.buscarPorId.mockRejectedValue(new NotFoundError('Programa'));

        await request(endpointApp)
            .get('/api/programas/999')
            .set('Authorization', `Bearer ${token}`)
            .expect(404);
    });

    it('retorna 200 ao listar programas autenticado', async () => {
        programaService.listarTodos.mockResolvedValue([mockPrograma]);

        await request(endpointApp)
            .get('/api/programas')
            .set('Authorization', `Bearer ${token}`)
            .expect(200, [mockPrograma]);
    });

    it('retorna 200 ao arquivar um programa por perfil autorizado', async () => {
        const tokenGestao = createAuthToken('GestaoGeral');
        programaService.arquivar.mockResolvedValue({ ...mockPrograma, ativo: false });

        await request(endpointApp)
            .patch('/api/programas/1/arquivar')
            .set('Authorization', `Bearer ${tokenGestao}`)
            .expect(200, { ...mockPrograma, ativo: false });
    });

    it('retorna 403 ao arquivar um programa por perfil sem permissao de arquivamento', async () => {
        const tokenAssistente = createAuthToken('Assistente');

        await request(endpointApp)
            .patch('/api/programas/1/arquivar')
            .set('Authorization', `Bearer ${tokenAssistente}`)
            .expect(403);
    });
});
