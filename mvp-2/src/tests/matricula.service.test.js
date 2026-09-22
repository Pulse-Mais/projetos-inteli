// src/tests/matricula.service.test.js

jest.mock('../repositories/matriculaRepository');
jest.mock('../repositories/jovemRepository');
jest.mock('../repositories/programaRepository');

const matriculaRepository = require('../repositories/matriculaRepository');
const jovemRepository     = require('../repositories/jovemRepository');
const programaRepository  = require('../repositories/programaRepository');
const matriculaService    = require('../services/matriculaService');
const { BadRequestError, NotFoundError } = require('../errors/AppError');

const mockMatricula = {
    id:             1,
    jovem_id:       1,
    programa_id:    1,
    status:         'Ativo',
    data_matricula: '2024-02-01',
    data_conclusao: null,
    observacoes:    null,
    criado_em:      '2024-02-01T10:00:00.000Z',
    atualizado_em:  '2024-02-01T10:00:00.000Z',
};

// Rastreabilidade (Art 11): RF001,RF004,RF008,RF009 | RN08 | CT-MT-01..25
describe('MatriculaService [RF001,RF004,RF008,RF009 | RN08 | CT-MT-01..25]', () => {
    beforeEach(() => jest.clearAllMocks());

    // ------------------------------------------------------------------ criar
    describe('criar', () => {

        it('retorna a matrícula criada quando os dados são válidos', async () => {
            jovemRepository.buscarPorId.mockResolvedValue({ id: 1 });
            programaRepository.buscarPorId.mockResolvedValue({ id: 1 });
            matriculaRepository.criar.mockResolvedValue(mockMatricula);

            const resultado = await matriculaService.criar({ ...mockMatricula });

            expect(resultado).toEqual(mockMatricula);
            expect(matriculaRepository.criar).toHaveBeenCalledTimes(1);
        });

        it('lança BadRequestError quando jovem_id e programa_id estão ausentes', async () => {
            await expect(
                matriculaService.criar({ status: 'Ativo' })
            ).rejects.toThrow(BadRequestError);
        });

        it('lança BadRequestError quando apenas jovem_id está ausente', async () => {
            await expect(
                matriculaService.criar({ programa_id: 1 })
            ).rejects.toThrow(BadRequestError);
        });

        it('lança BadRequestError quando apenas programa_id está ausente', async () => {
            await expect(
                matriculaService.criar({ jovem_id: 1 })
            ).rejects.toThrow(BadRequestError);
        });

        it('lança BadRequestError quando status é inválido', async () => {
            await expect(
                matriculaService.criar({ jovem_id: 1, programa_id: 1, status: 'Invalido' })
            ).rejects.toThrow(BadRequestError);
        });

        it('aceita todos os status válidos', async () => {
            const statusValidos = ['Ativo', 'Concluido', 'Evadido', 'Trancado'];

            for (const status of statusValidos) {
                jovemRepository.buscarPorId.mockResolvedValue({ id: 1 });
                programaRepository.buscarPorId.mockResolvedValue({ id: 1 });
                matriculaRepository.criar.mockResolvedValue({ ...mockMatricula, status });

                const resultado = await matriculaService.criar({ jovem_id: 1, programa_id: 1, status });
                expect(resultado.status).toBe(status);
            }
        });

        it('cria matrícula sem status (campo opcional)', async () => {
            jovemRepository.buscarPorId.mockResolvedValue({ id: 1 });
            programaRepository.buscarPorId.mockResolvedValue({ id: 1 });
            matriculaRepository.criar.mockResolvedValue(mockMatricula);

            const resultado = await matriculaService.criar({ jovem_id: 1, programa_id: 1 });
            expect(resultado).toEqual(mockMatricula);
        });

        it('lança NotFoundError quando jovem_id não existe', async () => {
            jovemRepository.buscarPorId.mockResolvedValue(null);

            await expect(
                matriculaService.criar({ jovem_id: 999, programa_id: 1 })
            ).rejects.toThrow(NotFoundError);
            expect(matriculaRepository.criar).not.toHaveBeenCalled();
        });

        it('lança NotFoundError quando programa_id não existe', async () => {
            jovemRepository.buscarPorId.mockResolvedValue({ id: 1 });
            programaRepository.buscarPorId.mockResolvedValue(null);

            await expect(
                matriculaService.criar({ jovem_id: 1, programa_id: 999 })
            ).rejects.toThrow(NotFoundError);
            expect(matriculaRepository.criar).not.toHaveBeenCalled();
        });
    });

    // --------------------------------------------------------------- buscarPorId
    describe('buscarPorId', () => {

        it('retorna a matrícula quando o ID existe', async () => {
            matriculaRepository.buscarPorId.mockResolvedValue(mockMatricula);

            const resultado = await matriculaService.buscarPorId(1);
            expect(resultado).toEqual(mockMatricula);
        });

        it('lança NotFoundError quando o ID não existe', async () => {
            matriculaRepository.buscarPorId.mockResolvedValue(null);

            await expect(matriculaService.buscarPorId(999)).rejects.toThrow(NotFoundError);
        });
    });

    // --------------------------------------------------------------- listarTodos
    describe('listarTodos', () => {

        it('repassa os filtros ao repositório e retorna o resultado', async () => {
            matriculaRepository.listarTodos.mockResolvedValue([mockMatricula]);

            const resultado = await matriculaService.listarTodos({});

            expect(resultado).toEqual([mockMatricula]);
            expect(matriculaRepository.listarTodos).toHaveBeenCalledTimes(1);
        });

        it('retorna lista vazia quando nenhuma matrícula corresponde ao filtro', async () => {
            matriculaRepository.listarTodos.mockResolvedValue([]);

            const resultado = await matriculaService.listarTodos({ jovem_id: 999 });
            expect(resultado).toHaveLength(0);
        });

        it('converte jovem_id de string para número antes de repassar ao repositório', async () => {
            matriculaRepository.listarTodos.mockResolvedValue([mockMatricula]);

            await matriculaService.listarTodos({ jovem_id: '1' });

            expect(matriculaRepository.listarTodos).toHaveBeenCalledWith(
                expect.objectContaining({ jovem_id: 1 })
            );
        });

        it('converte programa_id de string para número antes de repassar ao repositório', async () => {
            matriculaRepository.listarTodos.mockResolvedValue([mockMatricula]);

            await matriculaService.listarTodos({ programa_id: '2' });

            expect(matriculaRepository.listarTodos).toHaveBeenCalledWith(
                expect.objectContaining({ programa_id: 2 })
            );
        });

        it('converte jovem_id e programa_id simultaneamente quando ambos chegam como string', async () => {
            matriculaRepository.listarTodos.mockResolvedValue([mockMatricula]);

            await matriculaService.listarTodos({ jovem_id: '3', programa_id: '5' });

            expect(matriculaRepository.listarTodos).toHaveBeenCalledWith(
                expect.objectContaining({ jovem_id: 3, programa_id: 5 })
            );
        });

        it('não altera jovem_id quando já é número', async () => {
            matriculaRepository.listarTodos.mockResolvedValue([mockMatricula]);

            await matriculaService.listarTodos({ jovem_id: 1 });

            expect(matriculaRepository.listarTodos).toHaveBeenCalledWith(
                expect.objectContaining({ jovem_id: 1 })
            );
        });

        it('não altera programa_id quando já é número', async () => {
            matriculaRepository.listarTodos.mockResolvedValue([mockMatricula]);

            await matriculaService.listarTodos({ programa_id: 2 });

            expect(matriculaRepository.listarTodos).toHaveBeenCalledWith(
                expect.objectContaining({ programa_id: 2 })
            );
        });
    });

    // ----------------------------------------------------------------- atualizar
    describe('atualizar', () => {

        it('retorna a matrícula atualizada quando os dados são válidos', async () => {
            const atualizada = { ...mockMatricula, status: 'Concluido' };
            matriculaRepository.buscarPorId.mockResolvedValue(mockMatricula);
            matriculaRepository.atualizar.mockResolvedValue(atualizada);

            const resultado = await matriculaService.atualizar(1, { status: 'Concluido' });
            expect(resultado.status).toBe('Concluido');
        });

        it('lança NotFoundError ao tentar atualizar ID inexistente', async () => {
            matriculaRepository.buscarPorId.mockResolvedValue(null);

            await expect(
                matriculaService.atualizar(999, { status: 'Concluido' })
            ).rejects.toThrow(NotFoundError);
        });

        it('lança BadRequestError quando status inválido é enviado na atualização', async () => {
            matriculaRepository.buscarPorId.mockResolvedValue(mockMatricula);

            await expect(
                matriculaService.atualizar(1, { status: 'Invalido' })
            ).rejects.toThrow(BadRequestError);
        });

        it('atualiza sem enviar status (campo opcional na atualização)', async () => {
            const atualizada = { ...mockMatricula, observacoes: 'Novo comentário' };
            matriculaRepository.buscarPorId.mockResolvedValue(mockMatricula);
            matriculaRepository.atualizar.mockResolvedValue(atualizada);

            const resultado = await matriculaService.atualizar(1, { observacoes: 'Novo comentário' });
            expect(resultado.observacoes).toBe('Novo comentário');
        });

        it('aceita todos os status válidos na atualização', async () => {
            const statusValidos = ['Ativo', 'Concluido', 'Evadido', 'Trancado'];

            for (const status of statusValidos) {
                matriculaRepository.buscarPorId.mockResolvedValue(mockMatricula);
                matriculaRepository.atualizar.mockResolvedValue({ ...mockMatricula, status });

                const resultado = await matriculaService.atualizar(1, { status });
                expect(resultado.status).toBe(status);
            }
        });
    });

    // ---------------------------------------------------------------- excluir
    describe('excluir', () => {

        it('exclui a matrícula quando o ID existe', async () => {
            matriculaRepository.buscarPorId.mockResolvedValue(mockMatricula);
            matriculaRepository.excluir.mockResolvedValue({ id: 1 });

            await expect(matriculaService.excluir(1)).resolves.not.toThrow();
        });

        it('lança NotFoundError ao tentar excluir ID inexistente', async () => {
            matriculaRepository.buscarPorId.mockResolvedValue(null);

            await expect(matriculaService.excluir(999)).rejects.toThrow(NotFoundError);
        });
    });
});
