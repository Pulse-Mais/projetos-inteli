// src/tests/saudeMental.test.js

// Aqui, mockamos explicitamente o repository para evitar o carregamento da conexao com o banco.
jest.mock('../repositories/saudeMentalRepository', () => ({
    criar: jest.fn(),
    buscarPorId: jest.fn(),
    listarTodos: jest.fn(),
    atualizar: jest.fn(),
    excluir: jest.fn()
}));
jest.mock('../repositories/jovemRepository');
jest.mock('../repositories/usuarioRepository');

const saudeMentalRepository = require('../repositories/saudeMentalRepository');
const jovemRepository = require('../repositories/jovemRepository');
const usuarioRepository = require('../repositories/usuarioRepository');
const saudeMentalService = require('../services/saudeMentalService');
const { BadRequestError, NotFoundError } = require('../errors/AppError');

const mockAtendimento = {
    id: 1,
    jovem_id: 5,
    profissional_id: 4,
    data_atendimento: '2024-04-10',
    resumo: 'Elena relatou episódios de ansiedade relacionados à pressão financeira.',
    encaminhamento: 'Encaminhada para acompanhamento quinzenal.',
    criado_em: '2026-05-25T10:00:00.000Z'
};

// Rastreabilidade (Art 11): RF007 | RN08,RN09,RN15 | CT-SA-01..20
describe('SaudeMentalService [RF007 | RN08,RN09,RN15 | CT-SA-01..20]', () => {
    beforeEach(() => jest.clearAllMocks());

    // ------------------------------------------------------------------ criar
    describe('criar', () => {

        it('retorna o atendimento criado quando os dados são válidos', async () => {
            jovemRepository.buscarPorId.mockResolvedValue({ id: 5 });
            usuarioRepository.buscarPorId.mockResolvedValue({ id: 4 });
            saudeMentalRepository.criar.mockResolvedValue(mockAtendimento);

            const resultado = await saudeMentalService.criar({ ...mockAtendimento });

            expect(resultado).toEqual(mockAtendimento);
            expect(saudeMentalRepository.criar).toHaveBeenCalledTimes(1);
        });

        it('lança BadRequestError quando campos obrigatórios estão ausentes', async () => {
            await expect(
                saudeMentalService.criar({ jovem_id: 5 })
            ).rejects.toThrow(BadRequestError);
        });

        it('lança BadRequestError quando resumo é vazio', async () => {
            await expect(
                saudeMentalService.criar({
                    ...mockAtendimento,
                    resumo: '   '
                })
            ).rejects.toThrow(BadRequestError);
        });

        it('cria atendimento sem encaminhamento', async () => {
            jovemRepository.buscarPorId.mockResolvedValue({ id: 5 });
            usuarioRepository.buscarPorId.mockResolvedValue({ id: 4 });
            const semEncaminhamento = { ...mockAtendimento, encaminhamento: null };
            saudeMentalRepository.criar.mockResolvedValue(semEncaminhamento);

            const resultado = await saudeMentalService.criar({
                ...mockAtendimento,
                encaminhamento: undefined
            });

            expect(resultado.encaminhamento).toBeNull();
        });

        it('lança NotFoundError quando jovem_id não existe', async () => {
            jovemRepository.buscarPorId.mockResolvedValue(null);

            await expect(
                saudeMentalService.criar({ ...mockAtendimento })
            ).rejects.toThrow(NotFoundError);
            expect(saudeMentalRepository.criar).not.toHaveBeenCalled();
        });

        it('lança NotFoundError quando profissional_id não existe', async () => {
            jovemRepository.buscarPorId.mockResolvedValue({ id: 5 });
            usuarioRepository.buscarPorId.mockResolvedValue(null);

            await expect(
                saudeMentalService.criar({ ...mockAtendimento })
            ).rejects.toThrow(NotFoundError);
            expect(saudeMentalRepository.criar).not.toHaveBeenCalled();
        });
    });

    // --------------------------------------------------------------- buscarPorId
    describe('buscarPorId', () => {

        it('retorna o atendimento quando o ID existe', async () => {
            saudeMentalRepository.buscarPorId.mockResolvedValue(mockAtendimento);

            const resultado = await saudeMentalService.buscarPorId(1);

            expect(resultado).toEqual(mockAtendimento);
        });

        it('lança NotFoundError quando o ID não existe', async () => {
            saudeMentalRepository.buscarPorId.mockResolvedValue(null);

            await expect(saudeMentalService.buscarPorId(999)).rejects.toThrow(NotFoundError);
        });
    });

    // -------------------------------------------------------------- listarTodos
    describe('listarTodos', () => {

        it('retorna lista sem filtros', async () => {
            saudeMentalRepository.listarTodos.mockResolvedValue([mockAtendimento]);

            const resultado = await saudeMentalService.listarTodos();

            expect(resultado).toHaveLength(1);
            expect(resultado).toEqual([mockAtendimento]);
        });

        it('converte jovem_id string para número antes de passar ao repositório', async () => {
            saudeMentalRepository.listarTodos.mockResolvedValue([]);

            await saudeMentalService.listarTodos({ jovem_id: '5' });

            expect(saudeMentalRepository.listarTodos).toHaveBeenCalledWith(
                expect.objectContaining({ jovem_id: 5 })
            );
        });

        it('converte profissional_id string para número antes de passar ao repositório', async () => {
            saudeMentalRepository.listarTodos.mockResolvedValue([]);

            await saudeMentalService.listarTodos({ profissional_id: '4' });

            expect(saudeMentalRepository.listarTodos).toHaveBeenCalledWith(
                expect.objectContaining({ profissional_id: 4 })
            );
        });

        it('mantém filtro de data_atendimento ao listar', async () => {
            saudeMentalRepository.listarTodos.mockResolvedValue([]);

            await saudeMentalService.listarTodos({ data_atendimento: '2024-04-10' });

            expect(saudeMentalRepository.listarTodos).toHaveBeenCalledWith(
                expect.objectContaining({ data_atendimento: '2024-04-10' })
            );
        });
    });

    // ---------------------------------------------------------------- atualizar
    describe('atualizar', () => {

        it('retorna atendimento atualizado quando dados são válidos', async () => {
            saudeMentalRepository.buscarPorId.mockResolvedValue(mockAtendimento);
            saudeMentalRepository.atualizar.mockResolvedValue({
                ...mockAtendimento,
                encaminhamento: 'Acompanhamento semanal.'
            });

            const resultado = await saudeMentalService.atualizar(1, {
                encaminhamento: 'Acompanhamento semanal.'
            });

            expect(resultado.encaminhamento).toBe('Acompanhamento semanal.');
        });

        it('lança NotFoundError quando o ID não existe', async () => {
            saudeMentalRepository.buscarPorId.mockResolvedValue(null);

            await expect(
                saudeMentalService.atualizar(999, { resumo: 'Novo resumo.' })
            ).rejects.toThrow(NotFoundError);
        });

        it('lança BadRequestError quando resumo enviado é vazio', async () => {
            saudeMentalRepository.buscarPorId.mockResolvedValue(mockAtendimento);

            await expect(
                saudeMentalService.atualizar(1, { resumo: '   ' })
            ).rejects.toThrow(BadRequestError);
        });

        it('atualiza data_atendimento quando dados são válidos', async () => {
            saudeMentalRepository.buscarPorId.mockResolvedValue(mockAtendimento);
            saudeMentalRepository.atualizar.mockResolvedValue({
                ...mockAtendimento,
                data_atendimento: '2024-04-24'
            });

            const resultado = await saudeMentalService.atualizar(1, {
                data_atendimento: '2024-04-24'
            });

            expect(resultado.data_atendimento).toBe('2024-04-24');
        });
    });

    // ------------------------------------------------------------------ excluir
    describe('excluir', () => {

        it('exclui atendimento quando o ID existe', async () => {
            saudeMentalRepository.buscarPorId.mockResolvedValue(mockAtendimento);
            saudeMentalRepository.excluir.mockResolvedValue({ id: 1 });

            await expect(saudeMentalService.excluir(1)).resolves.not.toThrow();
        });

        it('lança NotFoundError ao tentar excluir ID inexistente', async () => {
            saudeMentalRepository.buscarPorId.mockResolvedValue(null);

            await expect(saudeMentalService.excluir(999)).rejects.toThrow(NotFoundError);
        });
    });
});
