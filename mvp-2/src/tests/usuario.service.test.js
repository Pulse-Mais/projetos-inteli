// src/tests/usuario.service.test.js

jest.mock('../repositories/usuarioRepository');
jest.mock('bcrypt', () => ({
    hash: jest.fn()
}));

const bcrypt = require('bcrypt');
const usuarioRepository = require('../repositories/usuarioRepository');
const usuarioService = require('../services/usuarioService');
const { BadRequestError, NotFoundError, ConflictError } = require('../errors/AppError');

const mockUsuario = {
    id: 1,
    nome: 'Denise Ferreira',
    email: 'denise@pulsemais.org.br',
    senha_hash: '$2b$10$hashFicticio',
    perfil: 'Coordenacao',
    ativo: true,
    criado_em: '2026-05-25T10:00:00.000Z',
    atualizado_em: '2026-05-25T10:00:00.000Z'
};

// Rastreabilidade (Art 11): RF002,RF003,RF013 (usuário/auth/portal) | RN05,RN06,RN07,RN08 | CT-US-01..21
describe('UsuarioService [RF002,RF003,RF013 | RN05,RN06,RN07,RN08 | CT-US-01..21]', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        bcrypt.hash.mockResolvedValue('$2b$10$novoHashFicticio');
    });

    // ------------------------------------------------------------------ criar
    describe('criar', () => {

        it('[CT-US-01][RN07] retorna o usuário criado sem senha_hash quando os dados são válidos', async () => {
            usuarioRepository.buscarPorEmail.mockResolvedValue(null);
            usuarioRepository.criar.mockResolvedValue({
                ...mockUsuario,
                senha_hash: '$2b$10$novoHashFicticio'
            });

            const resultado = await usuarioService.criar({
                nome: 'Denise Ferreira',
                email: 'denise@pulsemais.org.br',
                senha: 'senha123',
                perfil: 'Coordenacao'
            });

            expect(resultado.senha_hash).toBeUndefined();
            expect(resultado.email).toBe('denise@pulsemais.org.br');
            expect(bcrypt.hash).toHaveBeenCalledWith('senha123', 10);
            expect(usuarioRepository.criar).toHaveBeenCalledWith(
                expect.objectContaining({ senha_hash: '$2b$10$novoHashFicticio' })
            );
        });

        it('lança BadRequestError quando campos obrigatórios estão ausentes', async () => {
            await expect(
                usuarioService.criar({ email: 'teste@pulsemais.org.br' })
            ).rejects.toThrow(BadRequestError);
        });

        it('lança BadRequestError quando e-mail é inválido', async () => {
            await expect(
                usuarioService.criar({
                    nome: 'Teste',
                    email: 'email-invalido',
                    senha: 'senha123',
                    perfil: 'Coordenacao'
                })
            ).rejects.toThrow(BadRequestError);
        });

        it('[CT-US-05][RN08] lança BadRequestError quando perfil é inválido', async () => {
            await expect(
                usuarioService.criar({
                    nome: 'Teste',
                    email: 'teste@pulsemais.org.br',
                    senha: 'senha123',
                    perfil: 'Invalido'
                })
            ).rejects.toThrow(BadRequestError);
        });

        it('[CT-US-02][RN07] lança BadRequestError quando senha tem menos de 8 caracteres', async () => {
            await expect(
                usuarioService.criar({
                    nome: 'Teste',
                    email: 'teste@pulsemais.org.br',
                    senha: '1234567',
                    perfil: 'Coordenacao'
                })
            ).rejects.toThrow(BadRequestError);
        });

        it('[CT-US-03][RN02] lança ConflictError quando e-mail já está cadastrado', async () => {
            usuarioRepository.buscarPorEmail.mockResolvedValue(mockUsuario);

            await expect(
                usuarioService.criar({
                    nome: 'Denise Ferreira',
                    email: 'denise@pulsemais.org.br',
                    senha: 'senha123',
                    perfil: 'Coordenacao'
                })
            ).rejects.toThrow(ConflictError);
        });

        /**
         * COMPORTAMENTO DOCUMENTADO: o service não normaliza o e-mail antes de
         * consultar o repositório. Logo, "Teste@email.com" e "teste@email.com"
         * são tratados como e-mails distintos — a busca por e-mail exato retorna
         * null e o cadastro prossegue sem lançar ConflictError.
         */
        it('não detecta duplicidade quando o e-mail difere apenas em caixa (service não normaliza)', async () => {
            usuarioRepository.buscarPorEmail.mockResolvedValue(null);
            usuarioRepository.criar.mockResolvedValue({
                ...mockUsuario,
                email: 'Teste@email.com',
                senha_hash: '$2b$10$novoHashFicticio'
            });

            const resultado = await usuarioService.criar({
                nome: 'Teste',
                email: 'Teste@email.com',
                senha: 'senha123',
                perfil: 'Coordenacao'
            });

            expect(usuarioRepository.buscarPorEmail).toHaveBeenCalledWith('Teste@email.com');
            expect(usuarioRepository.criar).toHaveBeenCalledTimes(1);
            expect(resultado.senha_hash).toBeUndefined();
        });

        it('[CT-US-06][RN08] aceita todos os perfis válidos do sistema', async () => {
            const perfisValidos = ['GestaoGeral', 'Coordenacao', 'Assistente', 'Psicologa', 'Aluno', 'Mentor'];

            for (const perfil of perfisValidos) {
                usuarioRepository.buscarPorEmail.mockResolvedValue(null);
                usuarioRepository.criar.mockResolvedValue({ ...mockUsuario, perfil, senha_hash: '$2b$10$hash' });

                const resultado = await usuarioService.criar({
                    nome: 'Teste',
                    email: `teste_${perfil}@pulsemais.org.br`,
                    senha: 'senha123',
                    perfil
                });

                expect(resultado.perfil).toBe(perfil);
            }
        });
    });

    // --------------------------------------------------------------- buscarPorId
    describe('buscarPorId', () => {

        it('retorna o usuário sem senha_hash quando o ID existe', async () => {
            usuarioRepository.buscarPorId.mockResolvedValue(mockUsuario);

            const resultado = await usuarioService.buscarPorId(1);

            expect(resultado.id).toBe(1);
            expect(resultado.senha_hash).toBeUndefined();
        });

        it('lança NotFoundError quando o ID não existe', async () => {
            usuarioRepository.buscarPorId.mockResolvedValue(null);

            await expect(usuarioService.buscarPorId(999)).rejects.toThrow(NotFoundError);
        });
    });

    // ------------------------------------------------------------- buscarPorEmail
    describe('buscarPorEmail', () => {

        it('retorna o usuário sem senha_hash quando o e-mail existe', async () => {
            usuarioRepository.buscarPorEmail.mockResolvedValue(mockUsuario);

            const resultado = await usuarioService.buscarPorEmail('denise@pulsemais.org.br');

            expect(resultado.email).toBe('denise@pulsemais.org.br');
            expect(resultado.senha_hash).toBeUndefined();
        });

        it('lança NotFoundError quando o e-mail não existe', async () => {
            usuarioRepository.buscarPorEmail.mockResolvedValue(null);

            await expect(
                usuarioService.buscarPorEmail('naoexiste@pulsemais.org.br')
            ).rejects.toThrow(NotFoundError);
        });
    });

    // -------------------------------------------------------------- listarTodos
    describe('listarTodos', () => {

        it('retorna lista de usuários sem senha_hash', async () => {
            usuarioRepository.listarTodos.mockResolvedValue([mockUsuario]);

            const resultado = await usuarioService.listarTodos();

            expect(resultado).toHaveLength(1);
            expect(resultado[0].senha_hash).toBeUndefined();
        });

        it('lança BadRequestError quando perfil do filtro é inválido', async () => {
            await expect(
                usuarioService.listarTodos({ perfil: 'Invalido' })
            ).rejects.toThrow(BadRequestError);
        });

        it('[CT-US-07][RN08] converte ativo string "true" para boolean true antes de passar ao repositório', async () => {
            usuarioRepository.listarTodos.mockResolvedValue([mockUsuario]);

            await usuarioService.listarTodos({ ativo: 'true' });

            expect(usuarioRepository.listarTodos).toHaveBeenCalledWith(
                expect.objectContaining({ ativo: true })
            );
        });

        it('[CT-US-07][RN08] converte ativo string "false" para boolean false antes de passar ao repositório', async () => {
            usuarioRepository.listarTodos.mockResolvedValue([]);

            await usuarioService.listarTodos({ ativo: 'false' });

            expect(usuarioRepository.listarTodos).toHaveBeenCalledWith(
                expect.objectContaining({ ativo: false })
            );
        });

        it('repassa ativo boolean true ao repositório sem conversão', async () => {
            usuarioRepository.listarTodos.mockResolvedValue([mockUsuario]);

            await usuarioService.listarTodos({ ativo: true });

            expect(usuarioRepository.listarTodos).toHaveBeenCalledWith(
                expect.objectContaining({ ativo: true })
            );
        });

        it('repassa ativo boolean false ao repositório sem conversão', async () => {
            usuarioRepository.listarTodos.mockResolvedValue([]);

            await usuarioService.listarTodos({ ativo: false });

            expect(usuarioRepository.listarTodos).toHaveBeenCalledWith(
                expect.objectContaining({ ativo: false })
            );
        });

        it('ignora ativo undefined e não repassa o filtro ao repositório', async () => {
            usuarioRepository.listarTodos.mockResolvedValue([mockUsuario]);

            await usuarioService.listarTodos({ ativo: undefined });

            const filtrosPassados = usuarioRepository.listarTodos.mock.calls[0][0];
            expect(filtrosPassados.ativo).toBeUndefined();
        });

        it('retorna lista vazia quando nenhum usuário corresponde ao filtro', async () => {
            usuarioRepository.listarTodos.mockResolvedValue([]);

            const resultado = await usuarioService.listarTodos({ perfil: 'Mentor' });

            expect(resultado).toHaveLength(0);
        });
    });

    // ---------------------------------------------------------------- atualizar
    describe('atualizar', () => {

        it('retorna usuário atualizado sem senha_hash quando dados são válidos', async () => {
            usuarioRepository.buscarPorId.mockResolvedValue(mockUsuario);
            usuarioRepository.atualizar.mockResolvedValue({
                ...mockUsuario,
                nome: 'Denise Atualizada'
            });

            const resultado = await usuarioService.atualizar(1, { nome: 'Denise Atualizada' });

            expect(resultado.nome).toBe('Denise Atualizada');
            expect(resultado.senha_hash).toBeUndefined();
        });

        it('lança NotFoundError quando o ID não existe', async () => {
            usuarioRepository.buscarPorId.mockResolvedValue(null);

            await expect(
                usuarioService.atualizar(999, { nome: 'Novo nome' })
            ).rejects.toThrow(NotFoundError);
        });

        it('lança BadRequestError quando e-mail enviado é inválido', async () => {
            usuarioRepository.buscarPorId.mockResolvedValue(mockUsuario);

            await expect(
                usuarioService.atualizar(1, { email: 'email-invalido' })
            ).rejects.toThrow(BadRequestError);
        });

        it('lança BadRequestError quando perfil enviado é inválido', async () => {
            usuarioRepository.buscarPorId.mockResolvedValue(mockUsuario);

            await expect(
                usuarioService.atualizar(1, { perfil: 'Invalido' })
            ).rejects.toThrow(BadRequestError);
        });

        it('[CT-US-04][RN02] lança ConflictError quando e-mail pertence a outro usuário', async () => {
            usuarioRepository.buscarPorId.mockResolvedValue(mockUsuario);
            usuarioRepository.buscarPorEmail.mockResolvedValue({
                ...mockUsuario,
                id: 2,
                email: 'outro@pulsemais.org.br'
            });

            await expect(
                usuarioService.atualizar(1, { email: 'outro@pulsemais.org.br' })
            ).rejects.toThrow(ConflictError);
        });

        it('não lança ConflictError quando e-mail pertence ao próprio usuário', async () => {
            usuarioRepository.buscarPorId.mockResolvedValue(mockUsuario);
            // repositório retorna o próprio usuário (mesmo id)
            usuarioRepository.buscarPorEmail.mockResolvedValue(mockUsuario);
            usuarioRepository.atualizar.mockResolvedValue(mockUsuario);

            await expect(
                usuarioService.atualizar(1, { email: 'denise@pulsemais.org.br' })
            ).resolves.not.toThrow();
        });

        it('gera senha_hash quando senha é atualizada', async () => {
            usuarioRepository.buscarPorId.mockResolvedValue(mockUsuario);
            usuarioRepository.atualizar.mockResolvedValue({
                ...mockUsuario,
                senha_hash: '$2b$10$novoHashFicticio'
            });

            const resultado = await usuarioService.atualizar(1, { senha: 'novaSenha123' });

            expect(resultado.senha_hash).toBeUndefined();
            expect(bcrypt.hash).toHaveBeenCalledWith('novaSenha123', 10);
            expect(usuarioRepository.atualizar).toHaveBeenCalledWith(
                1,
                expect.objectContaining({ senha_hash: '$2b$10$novoHashFicticio' })
            );
        });

        it('lança BadRequestError quando senha de atualização tem menos de 8 caracteres', async () => {
            usuarioRepository.buscarPorId.mockResolvedValue(mockUsuario);

            await expect(
                usuarioService.atualizar(1, { senha: '1234567' })
            ).rejects.toThrow(BadRequestError);
        });
    });

    // ---------------------------------------------------------------- desativar
    describe('desativar', () => {

        it('desativa usuário quando o ID existe', async () => {
            usuarioRepository.buscarPorId.mockResolvedValue(mockUsuario);
            usuarioRepository.desativar.mockResolvedValue({ ...mockUsuario, ativo: false });

            const resultado = await usuarioService.desativar(1);

            expect(resultado.ativo).toBe(false);
            expect(resultado.senha_hash).toBeUndefined();
        });

        it('lança NotFoundError quando o ID não existe', async () => {
            usuarioRepository.buscarPorId.mockResolvedValue(null);

            await expect(usuarioService.desativar(999)).rejects.toThrow(NotFoundError);
        });
    });

    // ----------------------------------------------------------------- reativar
    describe('reativar', () => {

        it('reativa usuário quando o ID existe', async () => {
            usuarioRepository.buscarPorId.mockResolvedValue({ ...mockUsuario, ativo: false });
            usuarioRepository.reativar.mockResolvedValue(mockUsuario);

            const resultado = await usuarioService.reativar(1);

            expect(resultado.ativo).toBe(true);
            expect(resultado.senha_hash).toBeUndefined();
        });

        it('lança NotFoundError quando o ID não existe', async () => {
            usuarioRepository.buscarPorId.mockResolvedValue(null);

            await expect(usuarioService.reativar(999)).rejects.toThrow(NotFoundError);
        });
    });

    // ------------------------------------------------------------------ excluir
    describe('excluir', () => {

        it('exclui usuário quando o ID existe', async () => {
            usuarioRepository.buscarPorId.mockResolvedValue(mockUsuario);
            usuarioRepository.excluir.mockResolvedValue({ id: 1 });

            await expect(usuarioService.excluir(1)).resolves.not.toThrow();
        });

        it('lança NotFoundError ao tentar excluir ID inexistente', async () => {
            usuarioRepository.buscarPorId.mockResolvedValue(null);

            await expect(usuarioService.excluir(999)).rejects.toThrow(NotFoundError);
        });
    });
});
