// Aqui, mockamos o service de matriculas para testar somente o comportamento do controller.
jest.mock('../services/matriculaService', () => ({
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
const matriculaService = require('../services/matriculaService');
const matriculaController = require('../controllers/matriculaController');
const matriculaRoutes = require('../routes/matriculaRoutes');
const { pool } = require('../database/db');
const { NotFoundError, BadRequestError } = require('../errors/AppError');
const { createMockReq, createMockRes } = require('./testHelper');
const {
    createEndpointTestApp,
    createAuthToken,
    mockAuthenticatedUser
} = require('./endpointTestHelper');

// Aqui, definimos o segredo usado para gerar e validar os tokens dos testes HTTP.
process.env.JWT_SECRET = 'segredo-matricula-controller';

// Aqui, criamos uma aplicacao que monta as rotas reais de matriculas.
const endpointApp = createEndpointTestApp('/api/matriculas', matriculaRoutes);

// Aqui, definimos uma matricula base para reutilizarmos nos diferentes cenarios de teste.
const mockMatricula = {
    id: 1,
    jovem_id: 1,
    programa_id: 1,
    status: 'Ativo',
    data_matricula: '2024-02-01',
    data_conclusao: null,
    observacoes: null
};

// Aqui, executamos o controller e aguardamos a conclusao das operacoes assincronas.
const executarController = async (controller, req, res, next) => {
    controller(req, res, next);
    await new Promise(setImmediate);
};

// Aqui, agrupamos todos os testes de unidade do controller de matriculas.
// Rastreabilidade (Art 11): RF001,RF004,RF008,RF009 + RF003 (autorização) | RN08 | HTTP 200/201/400/401/403/404/409
describe('MatriculaController [RF001,RF004,RF008,RF009,RF003 | RN08]', () => {
    let res;
    let next;

    beforeEach(() => {
        res = createMockRes();
        next = jest.fn();
    });

    describe('criar', () => {
        it('envia o corpo da requisicao ao service e retorna 201', async () => {
            const req = createMockReq({ body: { ...mockMatricula } });
            matriculaService.criar.mockResolvedValue(mockMatricula);

            await executarController(matriculaController.criar, req, res, next);

            expect(matriculaService.criar).toHaveBeenCalledWith(req.body);
            expect(res.status).toHaveBeenCalledWith(201);
            expect(res.json).toHaveBeenCalledWith(mockMatricula);
        });

        it('encaminha erros do service para o middleware de erros', async () => {
            const erro = new NotFoundError('Jovem');
            const req = createMockReq({ body: { ...mockMatricula } });
            matriculaService.criar.mockRejectedValue(erro);

            await executarController(matriculaController.criar, req, res, next);

            expect(next).toHaveBeenCalledWith(erro);
        });
    });

    describe('listar', () => {
        it('repassa os filtros da query ao service', async () => {
            const req = createMockReq({ query: { jovem_id: '1', status: 'Ativo' } });
            matriculaService.listarTodos.mockResolvedValue([mockMatricula]);

            await executarController(matriculaController.listar, req, res, next);

            expect(matriculaService.listarTodos).toHaveBeenCalledWith(
                expect.objectContaining({ jovem_id: '1', status: 'Ativo' })
            );
            expect(res.json).toHaveBeenCalledWith([mockMatricula]);
        });
    });

    describe('buscarPorId', () => {
        it('converte o ID e retorna a matricula encontrada', async () => {
            const req = createMockReq({ params: { id: '1' } });
            matriculaService.buscarPorId.mockResolvedValue(mockMatricula);

            await executarController(matriculaController.buscarPorId, req, res, next);

            expect(matriculaService.buscarPorId).toHaveBeenCalledWith(1);
            expect(res.json).toHaveBeenCalledWith(mockMatricula);
        });

        it('encaminha BadRequestError quando o ID e invalido', async () => {
            const req = createMockReq({ params: { id: 'abc' } });

            await executarController(matriculaController.buscarPorId, req, res, next);

            expect(next).toHaveBeenCalledWith(expect.any(BadRequestError));
        });
    });

    describe('atualizar', () => {
        it('converte o ID e retorna a matricula atualizada', async () => {
            const atualizada = { ...mockMatricula, status: 'Concluido' };
            const req = createMockReq({ params: { id: '1' }, body: { status: 'Concluido' } });
            matriculaService.atualizar.mockResolvedValue(atualizada);

            await executarController(matriculaController.atualizar, req, res, next);

            expect(matriculaService.atualizar).toHaveBeenCalledWith(1, { status: 'Concluido' });
            expect(res.json).toHaveBeenCalledWith(atualizada);
        });
    });

    describe('excluir', () => {
        it('converte o ID, exclui a matricula e retorna status 204', async () => {
            const req = createMockReq({ params: { id: '1' } });
            matriculaService.excluir.mockResolvedValue();

            await executarController(matriculaController.excluir, req, res, next);

            expect(matriculaService.excluir).toHaveBeenCalledWith(1);
            expect(res.status).toHaveBeenCalledWith(204);
        });
    });
});

// Aqui, agrupamos os testes de integracao HTTP dos endpoints de matriculas.
describe('Endpoints de matriculas', () => {
    let token;

    beforeEach(() => {
        mockAuthenticatedUser(pool);
        token = createAuthToken('Coordenacao');
    });

    // ---- Cenario de autenticacao (401) ----
    it('retorna 401 ao listar matriculas sem autenticacao', async () => {
        await request(endpointApp)
            .get('/api/matriculas')
            .expect(401);
    });

    // ---- Cenario de autorizacao (403): Mentor nao pode matricular ----
    it('retorna 403 ao criar matricula com perfil sem permissao de escrita', async () => {
        const tokenMentor = createAuthToken('Mentor');

        await request(endpointApp)
            .post('/api/matriculas')
            .set('Authorization', `Bearer ${tokenMentor}`)
            .send(mockMatricula)
            .expect(403);
    });

    // ---- Cenario de sucesso (201) ----
    it('retorna 201 ao matricular um jovem em programa ativo', async () => {
        matriculaService.criar.mockResolvedValue(mockMatricula);

        await request(endpointApp)
            .post('/api/matriculas')
            .set('Authorization', `Bearer ${token}`)
            .send(mockMatricula)
            .expect(201, mockMatricula);
    });

    // ---- Cenario de validacao (400): programa inativo ----
    it('retorna 400 quando o service lanca BadRequestError (programa inativo)', async () => {
        matriculaService.criar.mockRejectedValue(new BadRequestError('Programa inativo'));

        await request(endpointApp)
            .post('/api/matriculas')
            .set('Authorization', `Bearer ${token}`)
            .send({ ...mockMatricula, programa_id: 5 })
            .expect(400);
    });

    // ---- Cenario de regra de negocio (404): jovem_id inexistente ----
    it('retorna 404 quando o jovem informado nao existe', async () => {
        matriculaService.criar.mockRejectedValue(new NotFoundError('Jovem'));

        await request(endpointApp)
            .post('/api/matriculas')
            .set('Authorization', `Bearer ${token}`)
            .send({ ...mockMatricula, jovem_id: 999 })
            .expect(404);
    });

    // ---- Cenario de recurso nao encontrado (404) na busca ----
    it('retorna 404 ao buscar matricula inexistente', async () => {
        matriculaService.buscarPorId.mockRejectedValue(new NotFoundError('Matricula'));

        await request(endpointApp)
            .get('/api/matriculas/999')
            .set('Authorization', `Bearer ${token}`)
            .expect(404);
    });

    it('retorna 200 ao listar matriculas autenticado', async () => {
        matriculaService.listarTodos.mockResolvedValue([mockMatricula]);

        await request(endpointApp)
            .get('/api/matriculas')
            .set('Authorization', `Bearer ${token}`)
            .expect(200, [mockMatricula]);
    });
});
