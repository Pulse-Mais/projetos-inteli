// src/tests/atividades.test.js

jest.mock('../repositories/atividadesRepository');

const atividadesRepository = require('../repositories/atividadesRepository');
const atividadeService     = require('../services/atividadeService');
const { BadRequestError, NotFoundError } = require('../errors/AppError');

const mockAtividade = {
    id:          1,
    programa_id: 1,
    titulo:      'Projeto Final de Módulo',
    descricao:   'Desenvolver um sistema completo',
    data_limite: '2026-06-30',
    criado_em:   '2026-05-23T10:00:00.000Z',
};

// Rastreabilidade (Art 11): RF004,RF009 | RN08 | CT-AT-01..11
describe('AtividadeService [RF004,RF009 | RN08 | CT-AT-01..11]', () => {
    beforeEach(() => jest.clearAllMocks());

    // ------------------------------------------------------------------ criar
    describe('criar', () => {

        it('retorna a atividade criada quando os dados são válidos', async () => {
            atividadesRepository.criar.mockResolvedValue(mockAtividade);

            const resultado = await atividadeService.criar({ ...mockAtividade });

            expect(resultado).toEqual(mockAtividade);
            expect(atividadesRepository.criar).toHaveBeenCalledTimes(1);
        });

        it('lança BadRequestError quando campos obrigatórios estão ausentes', async () => {
            await expect(
                atividadeService.criar({ descricao: 'Sem titulo e programa' })
            ).rejects.toThrow(BadRequestError);
        });

        it('lança BadRequestError quando apenas titulo está ausente', async () => {
            await expect(
                atividadeService.criar({ programa_id: 1 })
            ).rejects.toThrow(BadRequestError);
        });
    });

    // -------------------------------------------------------------- listarTodos
    describe('listarTodos', () => {

        it('retorna lista sem filtros', async () => {
            atividadesRepository.listarTodos.mockResolvedValue([mockAtividade]);

            const resultado = await atividadeService.listarTodos();
            expect(resultado).toHaveLength(1);
        });

        it('converte programa_id string para número antes de passar ao repositório', async () => {
            atividadesRepository.listarTodos.mockResolvedValue([]);

            await atividadeService.listarTodos({ programa_id: '1' });
            expect(atividadesRepository.listarTodos).toHaveBeenCalledWith(
                expect.objectContaining({ programa_id: 1 })
            );
        });
    });

    // --------------------------------------------------------------- buscarPorId
    describe('buscarPorId', () => {

        it('retorna a atividade quando o ID existe', async () => {
            atividadesRepository.buscarPorId.mockResolvedValue(mockAtividade);

            const resultado = await atividadeService.buscarPorId(1);
            expect(resultado).toEqual(mockAtividade);
        });

        it('lança NotFoundError quando o ID não existe', async () => {
            atividadesRepository.buscarPorId.mockResolvedValue(null);

            await expect(atividadeService.buscarPorId(999)).rejects.toThrow(NotFoundError);
        });
    });

    // ----------------------------------------------------------------- atualizar
    describe('atualizar', () => {

        it('retorna a atividade atualizada quando os dados são válidos', async () => {
            const atualizada = { ...mockAtividade, titulo: 'Projeto Atualizado' };
            atividadesRepository.buscarPorId.mockResolvedValue(mockAtividade);
            atividadesRepository.atualizar.mockResolvedValue(atualizada);

            const resultado = await atividadeService.atualizar(1, { titulo: 'Projeto Atualizado' });
            expect(resultado.titulo).toBe('Projeto Atualizado');
        });

        it('lança NotFoundError ao tentar atualizar ID inexistente', async () => {
            atividadesRepository.buscarPorId.mockResolvedValue(null);

            await expect(
                atividadeService.atualizar(999, { titulo: 'Novo titulo' })
            ).rejects.toThrow(NotFoundError);
        });
    });

    // ---------------------------------------------------------------- excluir
    describe('excluir', () => {

        it('exclui a atividade quando o ID existe', async () => {
            atividadesRepository.buscarPorId.mockResolvedValue(mockAtividade);
            atividadesRepository.excluir.mockResolvedValue({ id: 1 });

            await expect(atividadeService.excluir(1)).resolves.not.toThrow();
        });

        it('lança NotFoundError ao tentar excluir ID inexistente', async () => {
            atividadesRepository.buscarPorId.mockResolvedValue(null);

            await expect(atividadeService.excluir(999)).rejects.toThrow(NotFoundError);
        });
    });
});
