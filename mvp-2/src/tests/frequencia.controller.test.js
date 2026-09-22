// Aqui, mockamos o service de frequencias para testar somente o comportamento do controller.
jest.mock('../services/frequenciaService', () => ({
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
const frequenciaService = require('../services/frequenciaService');
const frequenciaController = require('../controllers/frequenciaController');
const frequenciaRoutes = require('../routes/frequenciaRoutes');
const { pool } = require('../database/db');
const { NotFoundError, BadRequestError } = require('../errors/AppError');
const { createMockReq, createMockRes } = require('./testHelper');
const {
    createEndpointTestApp,
    createAuthToken,
    mockAuthenticatedUser
} = require('./endpointTestHelper');

// Aqui, definimos o segredo usado para gerar e validar os tokens dos testes HTTP.
process.env.JWT_SECRET = 'segredo-frequencia-controller';

// Aqui, criamos uma aplicacao que monta as rotas reais de frequencias.
const endpointApp = createEndpointTestApp('/api/frequencias', frequenciaRoutes);

// Aqui, definimos uma frequencia base para reutilizarmos nos diferentes cenarios de teste.
const mockFrequencia = {
    id: 1,
    jovem_id: 1,
    data_aula: '2026-05-20',
    tipo_presenca: 'Presencial',
    responsavel_id: 1,
    programa_id: 2,
    observacao: null,
    criado_em: '2026-05-20T10:00:00.000Z'
};

// Aqui, executamos o controller e aguardamos a conclusao das operacoes assincronas.
const executarController = async (controller, req, res, next) => {
    controller(req, res, next);
    await new Promise(setImmediate);
};

// Aqui, agrupamos todos os testes de unidade do controller de frequencias.
// Rastreabilidade (Art 11): RF005 + RF003 (autorização) | RN08,RN12,RN13,RN14 | HTTP 200/201/400/401/403/404/409
describe('FrequenciaController [RF005,RF003 | RN08,RN12,RN13,RN14]', () => {
    let res;
    let next;

    beforeEach(() => {
        res = createMockRes();
        next = jest.fn();
    });

    describe('criar', () => {
        it('injeta o responsavel_id do usuario logado antes de chamar o service', async () => {
            const req = createMockReq({
                body: { jovem_id: 1, data_aula: '2026-05-20', tipo_presenca: 'Presencial', programa_id: 2 },
                usuario: { id: 1, perfil: 'Coordenacao', jovem_id: null }
            });
            frequenciaService.criar.mockResolvedValue(mockFrequencia);

            await executarController(frequenciaController.criar, req, res, next);

            expect(frequenciaService.criar).toHaveBeenCalledWith(
                expect.objectContaining({ jovem_id: 1, responsavel_id: 1 })
            );
            expect(res.status).toHaveBeenCalledWith(201);
            expect(res.json).toHaveBeenCalledWith(mockFrequencia);
        });

        it('encaminha erros do service para o middleware de erros', async () => {
            const erro = new BadRequestError('data_aula ausente');
            const req = createMockReq({ body: {} });
            frequenciaService.criar.mockRejectedValue(erro);

            await executarController(frequenciaController.criar, req, res, next);

            expect(next).toHaveBeenCalledWith(erro);
        });
    });

    describe('listar', () => {
        it('repassa os filtros da query ao service', async () => {
            const req = createMockReq({ query: { jovem_id: '1', tipo_presenca: 'Presencial' } });
            frequenciaService.listarTodos.mockResolvedValue([mockFrequencia]);

            await executarController(frequenciaController.listar, req, res, next);

            expect(frequenciaService.listarTodos).toHaveBeenCalledWith(
                expect.objectContaining({ jovem_id: '1', tipo_presenca: 'Presencial' })
            );
            expect(res.json).toHaveBeenCalledWith([mockFrequencia]);
        });
    });

    describe('buscarPorId', () => {
        it('converte o ID e retorna a frequencia encontrada', async () => {
            const req = createMockReq({ params: { id: '1' } });
            frequenciaService.buscarPorId.mockResolvedValue(mockFrequencia);

            await executarController(frequenciaController.buscarPorId, req, res, next);

            expect(frequenciaService.buscarPorId).toHaveBeenCalledWith(1);
            expect(res.json).toHaveBeenCalledWith(mockFrequencia);
        });

        it('encaminha BadRequestError quando o ID e invalido', async () => {
            const req = createMockReq({ params: { id: 'abc' } });

            await executarController(frequenciaController.buscarPorId, req, res, next);

            expect(next).toHaveBeenCalledWith(expect.any(BadRequestError));
        });
    });

    describe('atualizar', () => {
        it('converte o ID e retorna a frequencia atualizada', async () => {
            const atualizada = { ...mockFrequencia, tipo_presenca: 'Falta' };
            const req = createMockReq({ params: { id: '1' }, body: { tipo_presenca: 'Falta' } });
            frequenciaService.atualizar.mockResolvedValue(atualizada);

            await executarController(frequenciaController.atualizar, req, res, next);

            expect(frequenciaService.atualizar).toHaveBeenCalledWith(1, { tipo_presenca: 'Falta' });
            expect(res.json).toHaveBeenCalledWith(atualizada);
        });
    });

    describe('excluir', () => {
        it('converte o ID, exclui a frequencia e retorna status 204', async () => {
            const req = createMockReq({ params: { id: '1' } });
            frequenciaService.excluir.mockResolvedValue();

            await executarController(frequenciaController.excluir, req, res, next);

            expect(frequenciaService.excluir).toHaveBeenCalledWith(1);
            expect(res.status).toHaveBeenCalledWith(204);
        });
    });
});

// Aqui, agrupamos os testes de integracao HTTP dos endpoints de frequencias.
describe('Endpoints de frequencias', () => {
    let token;

    beforeEach(() => {
        mockAuthenticatedUser(pool);
        token = createAuthToken('Coordenacao');
    });

    // ---- Cenario de autenticacao (401) ----
    it('retorna 401 ao listar frequencias sem autenticacao', async () => {
        await request(endpointApp)
            .get('/api/frequencias')
            .expect(401);
    });

    // ---- Cenario de autorizacao (403): Mentor nao pode registrar frequencia ----
    it('retorna 403 ao criar frequencia com perfil sem permissao de escrita', async () => {
        const tokenMentor = createAuthToken('Mentor');

        await request(endpointApp)
            .post('/api/frequencias')
            .set('Authorization', `Bearer ${tokenMentor}`)
            .send({ jovem_id: 1, data_aula: '2026-05-20', tipo_presenca: 'Presencial' })
            .expect(403);
    });

    // ---- Cenario de sucesso (201) ----
    it('retorna 201 ao criar uma frequencia autenticada', async () => {
        frequenciaService.criar.mockResolvedValue(mockFrequencia);

        await request(endpointApp)
            .post('/api/frequencias')
            .set('Authorization', `Bearer ${token}`)
            .send({ jovem_id: 1, data_aula: '2026-05-20', tipo_presenca: 'Presencial', programa_id: 2 })
            .expect(201, mockFrequencia);
    });

    // ---- Cenario de validacao (400) ----
    it('retorna 400 quando o service lanca BadRequestError (data_aula ausente)', async () => {
        frequenciaService.criar.mockRejectedValue(new BadRequestError('data_aula ausente'));

        await request(endpointApp)
            .post('/api/frequencias')
            .set('Authorization', `Bearer ${token}`)
            .send({ jovem_id: 1, tipo_presenca: 'Presencial' })
            .expect(400);
    });

    // ---- Cenario de regra de negocio (404): jovem_id inexistente ----
    it('retorna 404 quando o jovem informado nao existe', async () => {
        frequenciaService.criar.mockRejectedValue(new NotFoundError('Jovem'));

        await request(endpointApp)
            .post('/api/frequencias')
            .set('Authorization', `Bearer ${token}`)
            .send({ jovem_id: 999, data_aula: '2026-05-20', tipo_presenca: 'Presencial' })
            .expect(404);
    });

    // ---- Cenario de recurso nao encontrado (404) na busca ----
    it('retorna 404 ao buscar frequencia inexistente', async () => {
        frequenciaService.buscarPorId.mockRejectedValue(new NotFoundError('Frequencia'));

        await request(endpointApp)
            .get('/api/frequencias/999')
            .set('Authorization', `Bearer ${token}`)
            .expect(404);
    });

    it('retorna 200 ao listar frequencias autenticado', async () => {
        frequenciaService.listarTodos.mockResolvedValue([mockFrequencia]);

        await request(endpointApp)
            .get('/api/frequencias')
            .set('Authorization', `Bearer ${token}`)
            .expect(200, [mockFrequencia]);
    });

    it('retorna 204 ao excluir uma frequencia por perfil autorizado', async () => {
        frequenciaService.excluir.mockResolvedValue();

        await request(endpointApp)
            .delete('/api/frequencias/1')
            .set('Authorization', `Bearer ${token}`)
            .expect(204);
    });

    it('retorna 403 ao excluir frequencia com perfil sem permissao de exclusao', async () => {
        const tokenAssistente = createAuthToken('Assistente');

        await request(endpointApp)
            .delete('/api/frequencias/1')
            .set('Authorization', `Bearer ${tokenAssistente}`)
            .expect(403);
    });
});
