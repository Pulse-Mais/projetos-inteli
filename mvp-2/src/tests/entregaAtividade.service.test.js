// src/tests/entregaAtividade.test.js

jest.mock('../repositories/entregaAtividadeRepository');
jest.mock('../repositories/jovemRepository');
jest.mock('../repositories/atividadesRepository');

const entregaAtividadeRepository = require('../repositories/entregaAtividadeRepository');
const jovemRepository            = require('../repositories/jovemRepository');
const atividadesRepository       = require('../repositories/atividadesRepository');
const entregaAtividadeService     = require('../services/entregaAtividadeService');
const { BadRequestError, NotFoundError } = require('../errors/AppError');

const mockEntrega = {
    id:            1,
    atividades_id: 1,
    jovem_id:      2,
    status:        'Entregue',
    nota:          9.5,
    data_entrega:  '2024-03-18',
    observacao:    null,
    criado_em:     '2024-03-18T10:00:00.000Z',
    atualizado_em: '2024-03-18T10:00:00.000Z',
};

// Rastreabilidade (Art 11): RF004,RF009 | RN08 | CT-EA-01..29
describe('EntregaAtividadeService [RF004,RF009 | RN08 | CT-EA-01..29]', () => {
    beforeEach(() => jest.clearAllMocks());

    // ------------------------------------------------------------------ criar
    describe('criar', () => {

        it('retorna a entrega criada quando os dados são válidos', async () => {
            jovemRepository.buscarPorId.mockResolvedValue({ id: 2 });
            atividadesRepository.buscarPorId.mockResolvedValue({ id: 1 });
            entregaAtividadeRepository.criar.mockResolvedValue(mockEntrega);

            const resultado = await entregaAtividadeService.criar({ ...mockEntrega });

            expect(resultado).toEqual(mockEntrega);
            expect(entregaAtividadeRepository.criar).toHaveBeenCalledTimes(1);
        });

        it('lança BadRequestError quando campos obrigatórios estão ausentes', async () => {
            await expect(
                entregaAtividadeService.criar({ status: 'Pendente' })
            ).rejects.toThrow(BadRequestError);
        });

        it('lança BadRequestError quando apenas jovem_id está ausente', async () => {
            await expect(
                entregaAtividadeService.criar({ atividades_id: 1 })
            ).rejects.toThrow(BadRequestError);
        });

        it('lança BadRequestError quando status é inválido', async () => {
            await expect(
                entregaAtividadeService.criar({ atividades_id: 1, jovem_id: 2, status: 'Invalido' })
            ).rejects.toThrow(BadRequestError);
        });

        it('lança BadRequestError quando nota está fora do intervalo 0-10', async () => {
            await expect(
                entregaAtividadeService.criar({ atividades_id: 1, jovem_id: 2, nota: 11 })
            ).rejects.toThrow(BadRequestError);
        });

        it('lança NotFoundError quando jovem_id não existe', async () => {
            jovemRepository.buscarPorId.mockResolvedValue(null);

            await expect(
                entregaAtividadeService.criar({ ...mockEntrega })
            ).rejects.toThrow(NotFoundError);
            expect(entregaAtividadeRepository.criar).not.toHaveBeenCalled();
        });

        it('lança NotFoundError quando atividades_id não existe', async () => {
            jovemRepository.buscarPorId.mockResolvedValue({ id: 2 });
            atividadesRepository.buscarPorId.mockResolvedValue(null);

            await expect(
                entregaAtividadeService.criar({ ...mockEntrega })
            ).rejects.toThrow(NotFoundError);
            expect(entregaAtividadeRepository.criar).not.toHaveBeenCalled();
        });
    });

    // --------------------------------------------------------------- buscarPorId
    describe('buscarPorId', () => {

        it('retorna a entrega quando o ID existe', async () => {
            entregaAtividadeRepository.buscarPorId.mockResolvedValue(mockEntrega);

            const resultado = await entregaAtividadeService.buscarPorId(1);
            expect(resultado).toEqual(mockEntrega);
        });

        it('lança NotFoundError quando o ID não existe', async () => {
            entregaAtividadeRepository.buscarPorId.mockResolvedValue(null);

            await expect(entregaAtividadeService.buscarPorId(999)).rejects.toThrow(NotFoundError);
        });
    });

    // ----------------------------------------------------------------- atualizar
    describe('atualizar', () => {

        it('retorna a entrega atualizada quando os dados são válidos', async () => {
            const atualizada = { ...mockEntrega, status: 'Atrasada' };
            entregaAtividadeRepository.buscarPorId.mockResolvedValue(mockEntrega);
            entregaAtividadeRepository.atualizar.mockResolvedValue(atualizada);

            const resultado = await entregaAtividadeService.atualizar(1, { status: 'Atrasada' });
            expect(resultado.status).toBe('Atrasada');
        });

        it('lança NotFoundError ao tentar atualizar ID inexistente', async () => {
            entregaAtividadeRepository.buscarPorId.mockResolvedValue(null);

            await expect(
                entregaAtividadeService.atualizar(999, { status: 'Entregue' })
            ).rejects.toThrow(NotFoundError);
        });

        it('lança BadRequestError quando status inválido é enviado na atualização', async () => {
            entregaAtividadeRepository.buscarPorId.mockResolvedValue(mockEntrega);

            await expect(
                entregaAtividadeService.atualizar(1, { status: 'Invalido' })
            ).rejects.toThrow(BadRequestError);
        });
    });

    // ---------------------------------------------------------------- excluir
    describe('excluir', () => {

        it('exclui a entrega quando o ID existe', async () => {
            entregaAtividadeRepository.buscarPorId.mockResolvedValue(mockEntrega);
            entregaAtividadeRepository.excluir.mockResolvedValue({ id: 1 });

            await expect(entregaAtividadeService.excluir(1)).resolves.not.toThrow();
        });

        it('lança NotFoundError ao tentar excluir ID inexistente', async () => {
            entregaAtividadeRepository.buscarPorId.mockResolvedValue(null);

            await expect(entregaAtividadeService.excluir(999)).rejects.toThrow(NotFoundError);
        });
    });
});
