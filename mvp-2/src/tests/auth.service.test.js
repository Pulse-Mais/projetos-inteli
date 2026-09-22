// src/tests/auth.service.test.js

jest.mock('../repositories/usuarioRepository');
jest.mock('../repositories/jovemRepository');
jest.mock('bcrypt');
jest.mock('jsonwebtoken');
jest.mock('../database/db', () => ({
    pool: {
        connect: jest.fn(),
        query: jest.fn(),
    }
}));

const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const usuarioRepository = require('../repositories/usuarioRepository');
const jovemRepository = require('../repositories/jovemRepository');
const { pool } = require('../database/db');
const authService = require('../services/authService');
const { BadRequestError, UnauthorizedError } = require('../errors/AppError');

process.env.JWT_SECRET = 'segredo_de_teste_para_jwt';
process.env.JWT_EXPIRES_IN = '24h';

const mockUsuario = {
    id: 1,
    nome: 'Denise Ferreira',
    email: 'denise@pulsemais.org.br',
    senha_hash: '$2b$12$hashFicticio',
    perfil: 'Coordenacao',
    cargo: 'Coordenadora',
    foto_url: null,
    jovem_id: null,
    ativo: true,
    token_version: 0,
};

// Rastreabilidade (Art 11): RF002 | RN05,RN06,RN07 | CT-AUT-01..24
describe('AuthService [RF002 | RN05,RN06,RN07 | CT-AUT-01..24]', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    // ------------------------------------------------------------------ login
    describe('login', () => {

        it('retorna token e dados do usuario quando credenciais sao validas', async () => {
            usuarioRepository.buscarPorEmail.mockResolvedValue(mockUsuario);
            bcrypt.compare.mockResolvedValue(true);
            jwt.sign.mockReturnValue('token.jwt.gerado');

            const resultado = await authService.login('denise@pulsemais.org.br', 'senha123');

            expect(resultado.token).toBe('token.jwt.gerado');
            expect(resultado.usuario.email).toBe('denise@pulsemais.org.br');
            expect(resultado.usuario.senha_hash).toBeUndefined();
            expect(jwt.sign).toHaveBeenCalledWith(
                expect.objectContaining({ id: 1, perfil: 'Coordenacao' }),
                'segredo_de_teste_para_jwt',
                expect.any(Object)
            );
        });

        it('lanca BadRequestError quando email esta ausente', async () => {
            await expect(authService.login('', 'senha123')).rejects.toThrow(BadRequestError);
            expect(usuarioRepository.buscarPorEmail).not.toHaveBeenCalled();
        });

        it('lanca BadRequestError quando senha esta ausente', async () => {
            await expect(authService.login('denise@pulsemais.org.br', '')).rejects.toThrow(BadRequestError);
            expect(usuarioRepository.buscarPorEmail).not.toHaveBeenCalled();
        });

        it('lanca BadRequestError quando ambos os campos estao ausentes', async () => {
            await expect(authService.login(undefined, undefined)).rejects.toThrow(BadRequestError);
        });

        it('lanca UnauthorizedError quando usuario nao existe', async () => {
            usuarioRepository.buscarPorEmail.mockResolvedValue(null);
            await expect(
                authService.login('naoexiste@pulsemais.org.br', 'senha123')
            ).rejects.toThrow(UnauthorizedError);
            expect(bcrypt.compare).not.toHaveBeenCalled();
        });

        it('lanca UnauthorizedError quando senha e incorreta', async () => {
            usuarioRepository.buscarPorEmail.mockResolvedValue(mockUsuario);
            bcrypt.compare.mockResolvedValue(false);
            await expect(
                authService.login('denise@pulsemais.org.br', 'senhaErrada')
            ).rejects.toThrow(UnauthorizedError);
        });

        it('lanca UnauthorizedError quando usuario esta inativo', async () => {
            usuarioRepository.buscarPorEmail.mockResolvedValue({ ...mockUsuario, ativo: false });
            bcrypt.compare.mockResolvedValue(true);
            await expect(
                authService.login('denise@pulsemais.org.br', 'senha123')
            ).rejects.toThrow(UnauthorizedError);
        });

        it('inclui jovem_id null no payload do token quando usuario nao e aluno', async () => {
            usuarioRepository.buscarPorEmail.mockResolvedValue(mockUsuario);
            bcrypt.compare.mockResolvedValue(true);
            jwt.sign.mockReturnValue('token.jwt.gerado');

            await authService.login('denise@pulsemais.org.br', 'senha123');

            expect(jwt.sign).toHaveBeenCalledWith(
                expect.objectContaining({ jovem_id: null }),
                expect.any(String),
                expect.any(Object)
            );
        });

        it('inclui jovem_id no payload do token quando usuario e aluno', async () => {
            const alunoMock = { ...mockUsuario, perfil: 'Aluno', jovem_id: 42 };
            usuarioRepository.buscarPorEmail.mockResolvedValue(alunoMock);
            bcrypt.compare.mockResolvedValue(true);
            jwt.sign.mockReturnValue('token.aluno');

            const resultado = await authService.login('aluno@pulsemais.org.br', 'senha123');

            expect(resultado.usuario.jovem_id).toBe(42);
            expect(jwt.sign).toHaveBeenCalledWith(
                expect.objectContaining({ jovem_id: 42 }),
                expect.any(String),
                expect.any(Object)
            );
        });

        it('retorna campos opcionais (cargo, foto_url) na resposta', async () => {
            const comFoto = { ...mockUsuario, cargo: 'Coordenadora', foto_url: 'https://cdn.example.com/foto.jpg' };
            usuarioRepository.buscarPorEmail.mockResolvedValue(comFoto);
            bcrypt.compare.mockResolvedValue(true);
            jwt.sign.mockReturnValue('token.jwt');

            const resultado = await authService.login('denise@pulsemais.org.br', 'senha123');

            expect(resultado.usuario.cargo).toBe('Coordenadora');
            expect(resultado.usuario.foto_url).toBe('https://cdn.example.com/foto.jpg');
        });
    });

    // -------------------------------------------------------------- cadastrarAluno
    describe('cadastrarAluno', () => {

        const dadosValidos = {
            nome: 'Beatriz Aluno',
            email: 'beatriz@aluno.org.br',
            cpf: '123.456.789-09',
            senha: 'senha123',
            consentimento_lgpd: true,
        };

        let mockClient;

        beforeEach(() => {
            mockClient = {
                query: jest.fn(),
                release: jest.fn(),
            };
            pool.connect.mockResolvedValue(mockClient);
            mockClient.query
                .mockResolvedValueOnce(undefined)                              // BEGIN
                .mockResolvedValueOnce({ rows: [{ id: 99 }] })                // INSERT jovens
                .mockResolvedValueOnce(undefined)                              // INSERT usuarios
                .mockResolvedValueOnce(undefined);                             // COMMIT
            bcrypt.hash.mockResolvedValue('$2b$12$hashFicticio');
            usuarioRepository.buscarPorEmail.mockResolvedValue(null);
            jovemRepository.buscarPorCpf.mockResolvedValue(null);
        });

        it('retorna mensagem de sucesso quando dados sao validos', async () => {
            const resultado = await authService.cadastrarAluno(dadosValidos);
            expect(resultado.mensagem).toBeDefined();
            expect(mockClient.query).toHaveBeenCalledWith('COMMIT');
        });

        it('lanca BadRequestError quando nome esta ausente', async () => {
            await expect(
                authService.cadastrarAluno({ ...dadosValidos, nome: '' })
            ).rejects.toThrow(BadRequestError);
        });

        it('lanca BadRequestError quando email esta ausente', async () => {
            await expect(
                authService.cadastrarAluno({ ...dadosValidos, email: '' })
            ).rejects.toThrow(BadRequestError);
        });

        it('lanca BadRequestError quando cpf esta ausente', async () => {
            await expect(
                authService.cadastrarAluno({ ...dadosValidos, cpf: '' })
            ).rejects.toThrow(BadRequestError);
        });

        it('lanca BadRequestError quando senha esta ausente', async () => {
            await expect(
                authService.cadastrarAluno({ ...dadosValidos, senha: '' })
            ).rejects.toThrow(BadRequestError);
        });

        it('lanca BadRequestError quando consentimento_lgpd e false', async () => {
            await expect(
                authService.cadastrarAluno({ ...dadosValidos, consentimento_lgpd: false })
            ).rejects.toThrow(BadRequestError);
        });

        it('lanca BadRequestError quando consentimento_lgpd esta ausente', async () => {
            await expect(
                authService.cadastrarAluno({ ...dadosValidos, consentimento_lgpd: undefined })
            ).rejects.toThrow(BadRequestError);
        });

        it('lanca BadRequestError quando email ja esta cadastrado', async () => {
            usuarioRepository.buscarPorEmail.mockResolvedValue(mockUsuario);
            await expect(
                authService.cadastrarAluno(dadosValidos)
            ).rejects.toThrow(BadRequestError);
            expect(pool.connect).not.toHaveBeenCalled();
        });

        it('lanca BadRequestError quando cpf ja esta cadastrado', async () => {
            jovemRepository.buscarPorCpf.mockResolvedValue({ id: 5, cpf: dadosValidos.cpf });
            await expect(
                authService.cadastrarAluno(dadosValidos)
            ).rejects.toThrow(BadRequestError);
            expect(pool.connect).not.toHaveBeenCalled();
        });

        it('aplica hash bcrypt na senha antes de persistir', async () => {
            await authService.cadastrarAluno(dadosValidos);
            expect(bcrypt.hash).toHaveBeenCalledWith('senha123', 12);
        });

        it('executa rollback e libera client em caso de erro no banco', async () => {
            mockClient.query.mockReset();
            mockClient.query
                .mockResolvedValueOnce(undefined)               // BEGIN
                .mockRejectedValueOnce(new Error('DB error'));  // INSERT jovens falha

            await expect(authService.cadastrarAluno(dadosValidos)).rejects.toThrow('DB error');
            expect(mockClient.query).toHaveBeenCalledWith('ROLLBACK');
            expect(mockClient.release).toHaveBeenCalled();
        });
    });

    // -------------------------------------------------------------- logoutAll
    describe('logoutAll', () => {

        it('incrementa token_version e retorna mensagem de confirmacao', async () => {
            usuarioRepository.incrementarTokenVersion.mockResolvedValue(undefined);

            const resultado = await authService.logoutAll(1);

            expect(usuarioRepository.incrementarTokenVersion).toHaveBeenCalledWith(1);
            expect(resultado).toEqual({ mensagem: 'Todos os tokens foram invalidados' });
        });

        it('propaga erro do repositorio quando incrementarTokenVersion falha', async () => {
            usuarioRepository.incrementarTokenVersion.mockRejectedValue(new Error('DB error'));

            await expect(authService.logoutAll(1)).rejects.toThrow('DB error');
        });
    });

    // -------------------------------------------------------------- desativarConta
    describe('desativarConta', () => {

        it('desativa conta e retorna mensagem de confirmacao', async () => {
            usuarioRepository.desativar.mockResolvedValue(undefined);

            const resultado = await authService.desativarConta(1);

            expect(usuarioRepository.desativar).toHaveBeenCalledWith(1);
            expect(resultado).toEqual({ mensagem: 'Conta desativada com sucesso' });
        });

        it('propaga erro do repositorio quando desativar falha', async () => {
            usuarioRepository.desativar.mockRejectedValue(new Error('DB error'));

            await expect(authService.desativarConta(1)).rejects.toThrow('DB error');
        });
    });

    // -------------------------------------------------------------- verificarToken
    describe('verificarToken', () => {

        it('retorna payload decodificado quando token e valido', () => {
            const payload = { id: 1, perfil: 'GestaoGeral' };
            jwt.verify.mockReturnValue(payload);

            const resultado = authService.verificarToken('token.valido');

            expect(resultado).toEqual(payload);
            expect(jwt.verify).toHaveBeenCalledWith('token.valido', 'segredo_de_teste_para_jwt');
        });

        it('lanca UnauthorizedError quando token e invalido', () => {
            jwt.verify.mockImplementation(() => { throw new Error('jwt malformed'); });

            expect(() => authService.verificarToken('token.invalido')).toThrow(UnauthorizedError);
        });

        it('lanca UnauthorizedError quando token esta expirado', () => {
            const expiredErr = new Error('jwt expired');
            expiredErr.name = 'TokenExpiredError';
            jwt.verify.mockImplementation(() => { throw expiredErr; });

            expect(() => authService.verificarToken('token.expirado')).toThrow(UnauthorizedError);
        });
    });
});
