// Aqui, mockamos o service de usuarios para testar somente o comportamento do controller.
jest.mock('../services/usuarioService', () => ({
    criar: jest.fn(),
    listarTodos: jest.fn(),
    buscarPorId: jest.fn(),
    atualizar: jest.fn(),
    desativar: jest.fn(),
    reativar: jest.fn(),
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
const usuarioService = require('../services/usuarioService');
const usuarioController = require('../controllers/usuarioController');
const usuarioRoutes = require('../routes/usuarioRoutes');
const { pool } = require('../database/db');
const { NotFoundError, BadRequestError, ConflictError } = require('../errors/AppError');
const { createMockReq, createMockRes } = require('./testHelper');
const {
    createEndpointTestApp,
    createAuthToken,
    mockAuthenticatedUser
} = require('./endpointTestHelper');

// Aqui, definimos o segredo usado para gerar e validar os tokens dos testes HTTP.
process.env.JWT_SECRET = 'segredo-usuario-controller';

// Aqui, criamos uma aplicacao que monta as rotas reais de usuarios.
const endpointApp = createEndpointTestApp('/api/usuarios', usuarioRoutes);

// Aqui, definimos um usuario base para reutilizarmos nos diferentes cenarios de teste.
const mockUsuario = {
    id: 1,
    nome: 'Denise Ferreira',
    email: 'denise@pulsemais.org.br',
    perfil: 'Coordenacao',
    ativo: true,
    criado_em: '2026-05-25T10:00:00.000Z',
    atualizado_em: '2026-05-25T10:00:00.000Z'
    // senha_hash removida intencionalmente (o service ja a omite)
};

// Aqui, executamos o controller e aguardamos a conclusao das operacoes assincronas.
const executarController = async (controller, req, res, next) => {
    controller(req, res, next);
    await new Promise(setImmediate);
};

// Aqui, agrupamos todos os testes de unidade do controller de usuarios.
// Rastreabilidade (Art 11): RF002,RF003 (autorização) | RN08 | HTTP 200/201/204/400/401/403/404/409
describe('UsuarioController [RF002,RF003 | RN08]', () => {
    let res;
    let next;

    // Aqui, criamos novos mocks de resposta e de proximo middleware antes de cada teste.
    beforeEach(() => {
        res = createMockRes();
        next = jest.fn();
    });

    // Aqui, agrupamos os testes do metodo responsavel pela criacao de usuarios.
    describe('criar', () => {
        it('envia o corpo da requisicao ao service', async () => {
            const req = createMockReq({ body: { ...mockUsuario, senha: 'senha123' } });
            usuarioService.criar.mockResolvedValue(mockUsuario);

            await executarController(usuarioController.criar, req, res, next);

            expect(usuarioService.criar).toHaveBeenCalledWith(req.body);
        });

        it('retorna status 201 e o usuario criado sem senha_hash', async () => {
            const req = createMockReq({ body: { ...mockUsuario, senha: 'senha123' } });
            usuarioService.criar.mockResolvedValue(mockUsuario);

            await executarController(usuarioController.criar, req, res, next);

            expect(res.status).toHaveBeenCalledWith(201);
            expect(res.json).toHaveBeenCalledWith(mockUsuario);
            expect(res.json.mock.calls[0][0].senha_hash).toBeUndefined();
            expect(next).not.toHaveBeenCalled();
        });

        it('encaminha erros do service para o middleware de erros', async () => {
            const erro = new ConflictError('E-mail ja cadastrado');
            const req = createMockReq({ body: { ...mockUsuario } });
            usuarioService.criar.mockRejectedValue(erro);

            await executarController(usuarioController.criar, req, res, next);

            expect(next).toHaveBeenCalledWith(erro);
            expect(res.json).not.toHaveBeenCalled();
        });
    });

    // Aqui, agrupamos os testes do metodo responsavel pela listagem de usuarios.
    describe('listar', () => {
        it('repassa os filtros da query ao service', async () => {
            const req = createMockReq({ query: { perfil: 'Coordenacao', ativo: 'true' } });
            usuarioService.listarTodos.mockResolvedValue([mockUsuario]);

            await executarController(usuarioController.listar, req, res, next);

            expect(usuarioService.listarTodos).toHaveBeenCalledWith(
                expect.objectContaining({ perfil: 'Coordenacao', ativo: 'true' })
            );
        });

        it('retorna os usuarios encontrados', async () => {
            const req = createMockReq();
            usuarioService.listarTodos.mockResolvedValue([mockUsuario]);

            await executarController(usuarioController.listar, req, res, next);

            expect(res.json).toHaveBeenCalledWith([mockUsuario]);
        });
    });

    // Aqui, agrupamos os testes do metodo responsavel por buscar usuario por ID.
    describe('buscarPorId', () => {
        it('converte o ID e retorna o usuario encontrado', async () => {
            const req = createMockReq({ params: { id: '1' } });
            usuarioService.buscarPorId.mockResolvedValue(mockUsuario);

            await executarController(usuarioController.buscarPorId, req, res, next);

            expect(usuarioService.buscarPorId).toHaveBeenCalledWith(1);
            expect(res.json).toHaveBeenCalledWith(mockUsuario);
        });

        it('encaminha BadRequestError quando o ID e invalido', async () => {
            const req = createMockReq({ params: { id: 'abc' } });

            await executarController(usuarioController.buscarPorId, req, res, next);

            expect(next).toHaveBeenCalledWith(expect.any(BadRequestError));
            expect(usuarioService.buscarPorId).not.toHaveBeenCalled();
        });
    });

    // Aqui, agrupamos os testes do metodo responsavel por atualizar usuarios.
    describe('atualizar', () => {
        it('converte o ID e retorna o usuario atualizado', async () => {
            const atualizado = { ...mockUsuario, nome: 'Denise Nova' };
            const req = createMockReq({ params: { id: '1' }, body: { nome: 'Denise Nova' } });
            usuarioService.atualizar.mockResolvedValue(atualizado);

            await executarController(usuarioController.atualizar, req, res, next);

            expect(usuarioService.atualizar).toHaveBeenCalledWith(1, { nome: 'Denise Nova' });
            expect(res.json).toHaveBeenCalledWith(atualizado);
        });

        it('encaminha BadRequestError quando o ID e invalido', async () => {
            const req = createMockReq({ params: { id: 'abc' }, body: {} });

            await executarController(usuarioController.atualizar, req, res, next);

            expect(next).toHaveBeenCalledWith(expect.any(BadRequestError));
        });
    });

    // Aqui, agrupamos os testes dos metodos de desativacao e reativacao.
    describe('desativar / reativar', () => {
        it('desativa o usuario e retorna ativo: false', async () => {
            const req = createMockReq({ params: { id: '1' } });
            usuarioService.desativar.mockResolvedValue({ ...mockUsuario, ativo: false });

            await executarController(usuarioController.desativar, req, res, next);

            expect(usuarioService.desativar).toHaveBeenCalledWith(1);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ ativo: false }));
        });

        it('reativa o usuario e retorna ativo: true', async () => {
            const req = createMockReq({ params: { id: '1' } });
            usuarioService.reativar.mockResolvedValue({ ...mockUsuario, ativo: true });

            await executarController(usuarioController.reativar, req, res, next);

            expect(usuarioService.reativar).toHaveBeenCalledWith(1);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ ativo: true }));
        });
    });

    // Aqui, agrupamos os testes do metodo responsavel por excluir usuarios.
    describe('excluir', () => {
        it('converte o ID, exclui o usuario e retorna status 204', async () => {
            const req = createMockReq({ params: { id: '1' } });
            usuarioService.excluir.mockResolvedValue();

            await executarController(usuarioController.excluir, req, res, next);

            expect(usuarioService.excluir).toHaveBeenCalledWith(1);
            expect(res.status).toHaveBeenCalledWith(204);
        });

        it('encaminha NotFoundError quando o service rejeita', async () => {
            const erro = new NotFoundError('Usuario');
            const req = createMockReq({ params: { id: '999' } });
            usuarioService.excluir.mockRejectedValue(erro);

            await executarController(usuarioController.excluir, req, res, next);

            expect(next).toHaveBeenCalledWith(erro);
        });
    });
});

// Aqui, agrupamos os testes de integracao HTTP dos endpoints de usuarios.
describe('Endpoints de usuarios', () => {
    let token;

    // Aqui, autenticamos um usuario administrativo antes de cada teste de endpoint.
    beforeEach(() => {
        mockAuthenticatedUser(pool);
        token = createAuthToken('GestaoGeral');
    });

    // ---- Cenario de autenticacao (401) ----
    it('retorna 401 ao listar usuarios sem autenticacao', async () => {
        await request(endpointApp)
            .get('/api/usuarios')
            .expect(401);
    });

    // ---- Cenario de autorizacao (403) ----
    it('retorna 403 quando o perfil nao tem permissao administrativa', async () => {
        const tokenAssistente = createAuthToken('Assistente');

        await request(endpointApp)
            .post('/api/usuarios')
            .set('Authorization', `Bearer ${tokenAssistente}`)
            .send({})
            .expect(403);
    });

    // ---- Cenario de sucesso (201) ----
    it('retorna 201 ao criar um usuario autenticado', async () => {
        usuarioService.criar.mockResolvedValue(mockUsuario);

        const res = await request(endpointApp)
            .post('/api/usuarios')
            .set('Authorization', `Bearer ${token}`)
            .send({
                nome: 'Denise Ferreira',
                email: 'denise@pulsemais.org.br',
                senha: 'senha123',
                perfil: 'Coordenacao'
            })
            .expect(201);

        expect(res.body.id).toBe(1);
        expect(res.body.senha_hash).toBeUndefined();
    });

    // ---- Cenario de validacao (400) ----
    it('retorna 400 quando o service lanca BadRequestError (campos ausentes)', async () => {
        usuarioService.criar.mockRejectedValue(new BadRequestError('Campos obrigatorios ausentes'));

        await request(endpointApp)
            .post('/api/usuarios')
            .set('Authorization', `Bearer ${token}`)
            .send({ email: 'incompleto@pulsemais.org.br' })
            .expect(400);
    });

    // ---- Cenario de regra de negocio (409) ----
    it('retorna 409 quando o e-mail ja esta cadastrado', async () => {
        usuarioService.criar.mockRejectedValue(new ConflictError('E-mail ja cadastrado'));

        await request(endpointApp)
            .post('/api/usuarios')
            .set('Authorization', `Bearer ${token}`)
            .send({
                nome: 'Denise Ferreira',
                email: 'denise@pulsemais.org.br',
                senha: 'senha123',
                perfil: 'Coordenacao'
            })
            .expect(409);
    });

    // ---- Cenario de recurso nao encontrado (404) ----
    it('retorna 404 ao buscar um usuario inexistente', async () => {
        usuarioService.buscarPorId.mockRejectedValue(new NotFoundError('Usuario'));

        await request(endpointApp)
            .get('/api/usuarios/999')
            .set('Authorization', `Bearer ${token}`)
            .expect(404);
    });

    it('retorna 200 ao listar usuarios autenticado', async () => {
        usuarioService.listarTodos.mockResolvedValue([mockUsuario]);

        const res = await request(endpointApp)
            .get('/api/usuarios')
            .set('Authorization', `Bearer ${token}`)
            .expect(200);

        expect(res.body).toHaveLength(1);
        expect(res.body[0].senha_hash).toBeUndefined();
    });

    it('retorna 200 ao desativar um usuario', async () => {
        usuarioService.desativar.mockResolvedValue({ ...mockUsuario, ativo: false });

        await request(endpointApp)
            .patch('/api/usuarios/1/desativar')
            .set('Authorization', `Bearer ${token}`)
            .expect(200, { ...mockUsuario, ativo: false });
    });

    it('retorna 200 ao reativar um usuario', async () => {
        usuarioService.reativar.mockResolvedValue(mockUsuario);

        await request(endpointApp)
            .patch('/api/usuarios/1/reativar')
            .set('Authorization', `Bearer ${token}`)
            .expect(200, mockUsuario);
    });

    it('retorna 204 ao excluir um usuario', async () => {
        usuarioService.excluir.mockResolvedValue();

        await request(endpointApp)
            .delete('/api/usuarios/1')
            .set('Authorization', `Bearer ${token}`)
            .expect(204);
    });
});
