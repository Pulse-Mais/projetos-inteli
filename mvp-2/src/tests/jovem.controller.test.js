// Aqui, mockamos o service de jovens para testar somente o comportamento do controller.
jest.mock('../services/jovemService', () => ({
    criar: jest.fn(),
    listarTodos: jest.fn(),
    buscarPorId: jest.fn(),
    atualizar: jest.fn(),
    arquivar: jest.fn(),
    buscarFicha: jest.fn()
}));

// Aqui, mockamos a conexao com o banco para evitar dependencias externas durante os testes.
jest.mock('../database/db', () => ({
    pool: {
        query: jest.fn()
    }
}));

// Aqui, importamos as dependencias utilizadas nos cenarios de teste do controller.
const request = require('supertest');
const jovemService = require('../services/jovemService');
const jovemController = require('../controllers/jovemController');
const jovemRoutes = require('../routes/jovemRoutes');
const { pool } = require('../database/db');
const { NotFoundError, BadRequestError, ConflictError, ForbiddenError } = require('../errors/AppError');
const { createMockReq, createMockRes } = require('./testHelper');
const {
    createEndpointTestApp,
    createAuthToken,
    mockAuthenticatedUser
} = require('./endpointTestHelper');

// Aqui, definimos o segredo usado para gerar e validar os tokens dos testes HTTP.
process.env.JWT_SECRET = 'segredo-jovem-controller';

// Aqui, criamos uma aplicacao que monta as rotas reais de jovens.
const endpointApp = createEndpointTestApp('/api/jovens', jovemRoutes);

// Aqui, definimos um jovem base para reutilizarmos nos diferentes cenarios de teste.
const mockJovem = {
    id: 1,
    nome: 'Maria Silva',
    cpf: '52998224725',
    email: 'maria@email.com',
    data_nascimento: '2000-01-01',
    status_jornada: 'Conectado',
    bairro: 'Cidade Tiradentes',
    cidade: 'Sao Paulo',
    estado: 'SP',
    tipo_moradia: 'Alugada',
    multiplicador: false,
    status_empregabilidade: 'Em_formacao',
    ativo: true
};

// Aqui, executamos o controller e aguardamos a conclusao das operacoes assincronas.
const executarController = async (controller, req, res, next) => {
    controller(req, res, next);
    await new Promise(setImmediate);
};

// Aqui, agrupamos todos os testes de unidade do controller de jovens.
// Rastreabilidade (Art 11): RF001 + RF003 (autorização) | RN08,RN10 | HTTP 200/201/400/401/403/404
describe('JovemController [RF001,RF003 | RN08,RN10]', () => {
    let res;
    let next;

    beforeEach(() => {
        res = createMockRes();
        next = jest.fn();
    });

    describe('criar', () => {
        it('envia o corpo da requisicao ao service e retorna 201', async () => {
            const req = createMockReq({ body: { ...mockJovem } });
            jovemService.criar.mockResolvedValue(mockJovem);

            await executarController(jovemController.criar, req, res, next);

            expect(jovemService.criar).toHaveBeenCalledWith(req.body);
            expect(res.status).toHaveBeenCalledWith(201);
            expect(res.json).toHaveBeenCalledWith(mockJovem);
        });

        it('encaminha erros do service para o middleware de erros', async () => {
            const erro = new ConflictError('CPF ja cadastrado');
            const req = createMockReq({ body: { ...mockJovem } });
            jovemService.criar.mockRejectedValue(erro);

            await executarController(jovemController.criar, req, res, next);

            expect(next).toHaveBeenCalledWith(erro);
            expect(res.json).not.toHaveBeenCalled();
        });
    });

    describe('listar', () => {
        it('repassa os filtros da query ao service', async () => {
            const req = createMockReq({ query: { status_jornada: 'Conectado', nome: 'Maria' } });
            jovemService.listarTodos.mockResolvedValue([mockJovem]);

            await executarController(jovemController.listar, req, res, next);

            expect(jovemService.listarTodos).toHaveBeenCalledWith(
                expect.objectContaining({ status_jornada: 'Conectado', nome: 'Maria' })
            );
            expect(res.json).toHaveBeenCalledWith([mockJovem]);
        });
    });

    describe('buscarPorId', () => {
        it('converte o ID e retorna o jovem encontrado', async () => {
            const req = createMockReq({ params: { id: '1' } });
            jovemService.buscarPorId.mockResolvedValue(mockJovem);

            await executarController(jovemController.buscarPorId, req, res, next);

            expect(jovemService.buscarPorId).toHaveBeenCalledWith(1, req.usuario);
            expect(res.json).toHaveBeenCalledWith(mockJovem);
        });

        it('encaminha BadRequestError quando o ID e invalido', async () => {
            const req = createMockReq({ params: { id: 'abc' } });

            await executarController(jovemController.buscarPorId, req, res, next);

            expect(next).toHaveBeenCalledWith(expect.any(BadRequestError));
            expect(jovemService.buscarPorId).not.toHaveBeenCalled();
        });

        it('encaminha ForbiddenError quando o service rejeita por ownership', async () => {
            const req = createMockReq({ params: { id: '99' }, usuario: { id: 20, perfil: 'Aluno', jovem_id: 1 } });
            jovemService.buscarPorId.mockRejectedValue(new ForbiddenError('Acesso negado'));

            await executarController(jovemController.buscarPorId, req, res, next);

            expect(next).toHaveBeenCalledWith(expect.any(ForbiddenError));
            expect(res.json).not.toHaveBeenCalled();
        });
    });

    describe('atualizar', () => {
        it('converte o ID e retorna o jovem atualizado', async () => {
            const atualizado = { ...mockJovem, nome: 'Maria Souza' };
            const req = createMockReq({ params: { id: '1' }, body: { nome: 'Maria Souza' } });
            jovemService.atualizar.mockResolvedValue(atualizado);

            await executarController(jovemController.atualizar, req, res, next);

            expect(jovemService.atualizar).toHaveBeenCalledWith(1, { nome: 'Maria Souza' });
            expect(res.json).toHaveBeenCalledWith(atualizado);
        });
    });

    describe('arquivar', () => {
        it('converte o ID e persiste o arquivamento', async () => {
            const req = createMockReq({ params: { id: '1' } });
            jovemService.arquivar.mockResolvedValue({ ...mockJovem, ativo: false });

            await executarController(jovemController.arquivar, req, res, next);

            expect(jovemService.arquivar).toHaveBeenCalledWith(1);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ ativo: false }));
        });
    });
});

// Aqui, agrupamos os testes de integracao HTTP dos endpoints de jovens.
describe('Endpoints de jovens', () => {
    let token;

    beforeEach(() => {
        mockAuthenticatedUser(pool);
        token = createAuthToken('Coordenacao');
    });

    // ---- Cenario de autenticacao (401) ----
    it('retorna 401 ao listar jovens sem autenticacao', async () => {
        await request(endpointApp)
            .get('/api/jovens')
            .expect(401);
    });

    // ---- Cenario de autorizacao (403): Mentor nao pode criar ----
    it('retorna 403 ao criar jovem com perfil sem permissao de escrita', async () => {
        const tokenMentor = createAuthToken('Mentor');

        await request(endpointApp)
            .post('/api/jovens')
            .set('Authorization', `Bearer ${tokenMentor}`)
            .send(mockJovem)
            .expect(403);
    });

    // ---- Cenario de sucesso (201) ----
    it('retorna 201 ao criar um jovem autenticado', async () => {
        jovemService.criar.mockResolvedValue(mockJovem);

        const res = await request(endpointApp)
            .post('/api/jovens')
            .set('Authorization', `Bearer ${token}`)
            .send(mockJovem)
            .expect(201);

        expect(res.body.id).toBe(1);
    });

    // ---- Cenario de validacao (400) ----
    it('retorna 400 quando o service lanca BadRequestError', async () => {
        jovemService.criar.mockRejectedValue(new BadRequestError('Campos obrigatorios ausentes'));

        await request(endpointApp)
            .post('/api/jovens')
            .set('Authorization', `Bearer ${token}`)
            .send({ email: 'incompleto@email.com' })
            .expect(400);
    });

    // ---- Cenario de regra de negocio (409): CPF duplicado ----
    it('retorna 409 quando o CPF ja esta cadastrado', async () => {
        jovemService.criar.mockRejectedValue(new ConflictError('CPF ja cadastrado'));

        await request(endpointApp)
            .post('/api/jovens')
            .set('Authorization', `Bearer ${token}`)
            .send(mockJovem)
            .expect(409);
    });

    // ---- Cenario de recurso nao encontrado (404) ----
    it('retorna 404 ao buscar jovem inexistente', async () => {
        jovemService.buscarPorId.mockRejectedValue(new NotFoundError('Jovem'));

        await request(endpointApp)
            .get('/api/jovens/999')
            .set('Authorization', `Bearer ${token}`)
            .expect(404);
    });

    // ---- Cenario de ownership (403): Aluno nao pode acessar outro jovem ----
    it('retorna 403 quando aluno tenta acessar dados de outro jovem', async () => {
        jovemService.buscarPorId.mockRejectedValue(new ForbiddenError('Acesso negado'));
        const tokenAluno = createAuthToken('Aluno', { jovem_id: 1 });

        await request(endpointApp)
            .get('/api/jovens/99')
            .set('Authorization', `Bearer ${tokenAluno}`)
            .expect(403);
    });

    it('retorna 200 ao listar jovens autenticado', async () => {
        jovemService.listarTodos.mockResolvedValue([mockJovem]);

        await request(endpointApp)
            .get('/api/jovens')
            .set('Authorization', `Bearer ${token}`)
            .expect(200, [mockJovem]);
    });

    it('retorna 200 ao arquivar um jovem por perfil autorizado', async () => {
        const tokenGestao = createAuthToken('GestaoGeral');
        jovemService.arquivar.mockResolvedValue({ ...mockJovem, ativo: false });

        await request(endpointApp)
            .patch('/api/jovens/1/arquivar')
            .set('Authorization', `Bearer ${tokenGestao}`)
            .expect(200, { ...mockJovem, ativo: false });
    });

    it('retorna 403 ao arquivar um jovem por perfil sem permissao de arquivamento', async () => {
        const tokenAssistente = createAuthToken('Assistente');

        await request(endpointApp)
            .patch('/api/jovens/1/arquivar')
            .set('Authorization', `Bearer ${tokenAssistente}`)
            .expect(403);
    });
});
