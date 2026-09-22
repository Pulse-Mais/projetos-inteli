// src/tests/notificacao.test.js

// Aqui, mockamos explicitamente o repository para evitar o carregamento da conexao com o banco.
jest.mock('../repositories/notificacaoRepository', () => ({
    criar: jest.fn(),
    buscarPorId: jest.fn(),
    listarTodos: jest.fn(),
    marcarComoLida: jest.fn(),
    atualizar: jest.fn(),
    excluir: jest.fn()
}));

const notificacaoRepository = require('../repositories/notificacaoRepository');
const notificacaoService     = require('../services/notificacaoService');
const { BadRequestError, NotFoundError } = require('../errors/AppError');

const mockNotificacao = {
    id:         1,
    usuario_id: 2,
    tipo:       'Alerta',
    titulo:     'Frequência crítica: Henrique Lima',
    descricao:  'Henrique está com 62,5% de frequência.',
    lida:       false,
    link:       '/jovens/8',
    criado_em:  '2026-05-24T10:00:00.000Z',
};

// Rastreabilidade (Art 11): RF003,RF004 | RN08 | CT-NO-01..26
// (catálogo WAD §3.9 rotula CT-NO como RF010 por engano — RTM canônica é RF003/RF004)
describe('NotificacaoService [RF003,RF004 | RN08 | CT-NO-01..26]', () => {
    beforeEach(() => jest.clearAllMocks());

    // ------------------------------------------------------------------ criar
    describe('criar', () => {

        it('retorna a notificação criada quando os dados são válidos', async () => {
            notificacaoRepository.criar.mockResolvedValue(mockNotificacao);

            const resultado = await notificacaoService.criar({ ...mockNotificacao });

            expect(resultado).toEqual(mockNotificacao);
            expect(notificacaoRepository.criar).toHaveBeenCalledTimes(1);
        });

        it('lança BadRequestError quando campos obrigatórios estão ausentes', async () => {
            await expect(
                notificacaoService.criar({ descricao: 'Sem tipo e titulo' })
            ).rejects.toThrow(BadRequestError);
        });

        it('lança BadRequestError quando apenas titulo está ausente', async () => {
            await expect(
                notificacaoService.criar({ tipo: 'Alerta' })
            ).rejects.toThrow(BadRequestError);
        });

        it('[CT-NO-01] lança BadRequestError quando tipo é inválido', async () => {
            await expect(
                notificacaoService.criar({ tipo: 'Invalido', titulo: 'Teste' })
            ).rejects.toThrow(BadRequestError);
        });
    });

    // --------------------------------------------------------------- buscarPorId
    describe('buscarPorId', () => {

        it('retorna a notificação quando o ID existe', async () => {
            notificacaoRepository.buscarPorId.mockResolvedValue(mockNotificacao);

            const resultado = await notificacaoService.buscarPorId(1);
            expect(resultado).toEqual(mockNotificacao);
        });

        it('lança NotFoundError quando o ID não existe', async () => {
            notificacaoRepository.buscarPorId.mockResolvedValue(null);

            await expect(notificacaoService.buscarPorId(999)).rejects.toThrow(NotFoundError);
        });
    });

    // --------------------------------------------------------------- listarTodos
    describe('listarTodos', () => {

        it('[CT-NO-02] converte usuario_id para número quando presente nos filtros', async () => {
            notificacaoRepository.listarTodos.mockResolvedValue([mockNotificacao]);

            const resultado = await notificacaoService.listarTodos({ usuario_id: '2' });
            
            expect(resultado).toEqual([mockNotificacao]);
            expect(notificacaoRepository.listarTodos).toHaveBeenCalledWith({ usuario_id: 2 });
        });

        it('[CT-NO-03] converte lida para boolean true quando o valor for "true"', async () => {
            notificacaoRepository.listarTodos.mockResolvedValue([mockNotificacao]);

            await notificacaoService.listarTodos({ lida: 'true' });
            
            expect(notificacaoRepository.listarTodos).toHaveBeenCalledWith({ lida: true });
        });

        it('converte lida para boolean false quando o valor for "false"', async () => {
            notificacaoRepository.listarTodos.mockResolvedValue([mockNotificacao]);

            await notificacaoService.listarTodos({ lida: 'false' });
            
            expect(notificacaoRepository.listarTodos).toHaveBeenCalledWith({ lida: false });
        });

        it('chama o repositório sem alterar os filtros se usuario_id e lida não estiverem presentes', async () => {
            notificacaoRepository.listarTodos.mockResolvedValue([mockNotificacao]);

            await notificacaoService.listarTodos({ tipo: 'Alerta' });
            
            expect(notificacaoRepository.listarTodos).toHaveBeenCalledWith({ tipo: 'Alerta' });
        });
    });

    // --------------------------------------------------------- marcarComoLida
    describe('marcarComoLida', () => {

        it('retorna a notificação com lida=true', async () => {
            const lida = { ...mockNotificacao, lida: true };
            notificacaoRepository.buscarPorId.mockResolvedValue(mockNotificacao);
            notificacaoRepository.marcarComoLida.mockResolvedValue(lida);

            const resultado = await notificacaoService.marcarComoLida(1);
            expect(resultado.lida).toBe(true);
        });

        it('lança NotFoundError quando o ID não existe', async () => {
            notificacaoRepository.buscarPorId.mockResolvedValue(null);

            await expect(notificacaoService.marcarComoLida(999)).rejects.toThrow(NotFoundError);
        });
    });

    // ----------------------------------------------------------------- atualizar
    describe('atualizar', () => {

        it('retorna a notificação atualizada quando os dados são válidos', async () => {
            const atualizada = { ...mockNotificacao, titulo: 'Título atualizado' };
            notificacaoRepository.buscarPorId.mockResolvedValue(mockNotificacao);
            notificacaoRepository.atualizar.mockResolvedValue(atualizada);

            const resultado = await notificacaoService.atualizar(1, { titulo: 'Título atualizado' });
            expect(resultado.titulo).toBe('Título atualizado');
        });

        it('lança NotFoundError ao tentar atualizar ID inexistente', async () => {
            notificacaoRepository.buscarPorId.mockResolvedValue(null);

            await expect(
                notificacaoService.atualizar(999, { titulo: 'Novo titulo' })
            ).rejects.toThrow(NotFoundError);
        });

        it('lança BadRequestError quando tipo inválido é enviado na atualização', async () => {
            notificacaoRepository.buscarPorId.mockResolvedValue(mockNotificacao);

            await expect(
                notificacaoService.atualizar(1, { tipo: 'Invalido' })
            ).rejects.toThrow(BadRequestError);
        });
    });

    // ---------------------------------------------------------------- excluir
    describe('excluir', () => {

        it('exclui a notificação quando o ID existe', async () => {
            notificacaoRepository.buscarPorId.mockResolvedValue(mockNotificacao);
            notificacaoRepository.excluir.mockResolvedValue({ id: 1 });

            await expect(notificacaoService.excluir(1)).resolves.not.toThrow();
        });

        it('lança NotFoundError ao tentar excluir ID inexistente', async () => {
            notificacaoRepository.buscarPorId.mockResolvedValue(null);

            await expect(notificacaoService.excluir(999)).rejects.toThrow(NotFoundError);
        });
    });
});
