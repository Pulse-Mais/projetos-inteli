// src/tests/auth.controller.test.js

// Mockamos o service de autenticacao para isolar o comportamento do controller/endpoints.
jest.mock('../services/authService', () => ({
    login: jest.fn(),
    cadastrarAluno: jest.fn(),
    verificarToken: jest.fn(),
    logoutAll: jest.fn(),
    desativarConta: jest.fn()
}));

// Mockamos o pool para evitar banco real (usado por authenticate, logout-all e DELETE /me).
jest.mock('../database/db', () => ({
    pool: {
        query: jest.fn()
    }
}));

const request = require('supertest');
const authService = require('../services/authService');
const authRoutes = require('../routes/authRoutes');
const { pool } = require('../database/db');
const { BadRequestError, UnauthorizedError } = require('../errors/AppError');
const {
    createEndpointTestApp,
    createAuthToken,
    mockAuthenticatedUser
} = require('./endpointTestHelper');

// Segredo usado para gerar/validar tokens nos testes HTTP.
process.env.JWT_SECRET = 'segredo-auth-controller';

// Montamos as rotas reais de autenticacao sob /api/auth.
const endpointApp = createEndpointTestApp('/api/auth', authRoutes);

const mockLoginResult = {
    token: 'token.jwt.gerado',
    usuario: {
        id: 1,
        nome: 'Denise Ferreira',
        email: 'denise@pulsemais.org.br',
        perfil: 'Coordenacao',
        cargo: 'Coordenadora',
        foto_url: null,
        jovem_id: null
    }
};

// Rastreabilidade (Art 11): RF002 | RN05,RN06,RN07 | HTTP 200/201/400/401
describe('AuthController — Endpoints de autenticacao [RF002 | RN05,RN06,RN07]', () => {
    beforeEach(() => jest.clearAllMocks());

    // ------------------------------------------------------------ POST /login
    describe('POST /api/auth/login', () => {

        it('retorna 200, token e usuario sem senha_hash quando credenciais sao validas', async () => {
            authService.login.mockResolvedValue(mockLoginResult);

            const res = await request(endpointApp)
                .post('/api/auth/login')
                .send({ email: 'denise@pulsemais.org.br', senha: 'senha123' })
                .expect(200);

            expect(res.body.token).toBe('token.jwt.gerado');
            expect(res.body.usuario.email).toBe('denise@pulsemais.org.br');
            expect(res.body.usuario.senha_hash).toBeUndefined();
            expect(authService.login).toHaveBeenCalledWith('denise@pulsemais.org.br', 'senha123');
        });

        it('retorna 400 quando o service lanca BadRequestError (campos ausentes)', async () => {
            authService.login.mockRejectedValue(new BadRequestError('E-mail e senha são obrigatórios'));

            await request(endpointApp)
                .post('/api/auth/login')
                .send({ email: 'denise@pulsemais.org.br' })
                .expect(400);
        });

        it('retorna 401 quando o service lanca UnauthorizedError (credenciais invalidas)', async () => {
            authService.login.mockRejectedValue(new UnauthorizedError('Credenciais inválidas'));

            await request(endpointApp)
                .post('/api/auth/login')
                .send({ email: 'denise@pulsemais.org.br', senha: 'errada' })
                .expect(401);
        });

        it('retorna 401 quando o usuario esta inativo', async () => {
            authService.login.mockRejectedValue(new UnauthorizedError('Usuário inativo'));

            await request(endpointApp)
                .post('/api/auth/login')
                .send({ email: 'inativo@pulsemais.org.br', senha: 'senha123' })
                .expect(401);
        });
    });

    // --------------------------------------------------------- POST /cadastro
    describe('POST /api/auth/cadastro', () => {

        it('retorna 201 e mensagem de sucesso quando dados sao validos', async () => {
            authService.cadastrarAluno.mockResolvedValue({
                mensagem: 'Cadastro realizado com sucesso! Aguarde a aprovação da equipe Pulse Mais.'
            });

            const res = await request(endpointApp)
                .post('/api/auth/cadastro')
                .send({
                    nome: 'Beatriz Aluno',
                    email: 'beatriz@aluno.org.br',
                    cpf: '123.456.789-09',
                    senha: 'senha123',
                    consentimento_lgpd: true
                })
                .expect(201);

            expect(res.body.mensagem).toContain('Cadastro realizado');
            expect(authService.cadastrarAluno).toHaveBeenCalledTimes(1);
        });

        it('retorna 400 quando o service lanca BadRequestError (consentimento ausente)', async () => {
            authService.cadastrarAluno.mockRejectedValue(
                new BadRequestError('É necessário aceitar os termos de uso e privacidade')
            );

            await request(endpointApp)
                .post('/api/auth/cadastro')
                .send({ nome: 'X', email: 'x@y.com', cpf: '111', senha: 'a' })
                .expect(400);
        });

        it('retorna 400 quando e-mail ja esta cadastrado', async () => {
            authService.cadastrarAluno.mockRejectedValue(new BadRequestError('E-mail já cadastrado'));

            await request(endpointApp)
                .post('/api/auth/cadastro')
                .send({
                    nome: 'Beatriz', email: 'existe@y.com', cpf: '222',
                    senha: 'a', consentimento_lgpd: true
                })
                .expect(400);
        });
    });

    // ------------------------------------------------------ POST /logout-all
    describe('POST /api/auth/logout-all', () => {

        it('retorna 401 sem token de autenticacao', async () => {
            await request(endpointApp)
                .post('/api/auth/logout-all')
                .expect(401);
        });

        it('retorna 200 e invalida tokens quando autenticado', async () => {
            mockAuthenticatedUser(pool);
            authService.logoutAll.mockResolvedValue({ mensagem: 'Todos os tokens foram invalidados' });
            const token = createAuthToken('Coordenacao');

            const res = await request(endpointApp)
                .post('/api/auth/logout-all')
                .set('Authorization', `Bearer ${token}`)
                .expect(200);

            expect(res.body.mensagem).toBeDefined();
            // Controller delega ao service com o id do usuário autenticado (req.usuario.id).
            expect(authService.logoutAll).toHaveBeenCalledWith(1);
        });
    });

    // ----------------------------------------------------------- DELETE /me
    describe('DELETE /api/auth/me', () => {

        it('retorna 401 sem token de autenticacao', async () => {
            await request(endpointApp)
                .delete('/api/auth/me')
                .expect(401);
        });

        it('retorna 200 e desativa a conta quando autenticado', async () => {
            mockAuthenticatedUser(pool);
            authService.desativarConta.mockResolvedValue({ mensagem: 'Conta desativada com sucesso' });
            const token = createAuthToken('Aluno', { jovem_id: 42 });

            const res = await request(endpointApp)
                .delete('/api/auth/me')
                .set('Authorization', `Bearer ${token}`)
                .expect(200);

            expect(res.body.mensagem).toBeDefined();
            // Controller delega ao service com o id do usuário autenticado (req.usuario.id).
            expect(authService.desativarConta).toHaveBeenCalledWith(1);
        });
    });
});
