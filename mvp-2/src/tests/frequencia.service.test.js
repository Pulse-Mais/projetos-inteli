// src/tests/frequencia.service.test.js

jest.mock('../repositories/frequenciaRepository');
jest.mock('../repositories/jovemRepository');
jest.mock('../repositories/usuarioRepository');

const frequenciaRepository = require('../repositories/frequenciaRepository');
const jovemRepository      = require('../repositories/jovemRepository');
const usuarioRepository    = require('../repositories/usuarioRepository');
const frequenciaService    = require('../services/frequenciaService');
const { BadRequestError, ConflictError, NotFoundError } = require('../errors/AppError');

const mockFrequencia = {
    id:             1,
    jovem_id:       1,
    data_aula:      '2026-05-20',
    tipo_presenca:  'Presencial',
    responsavel_id: 1,
    programa_id:    2,
    observacao:     null,
    criado_em:      '2026-05-20T10:00:00.000Z',
};

// Rastreabilidade (Art 11): RF005 (+RF012 import) | RN08,RN12,RN13,RN14,RN18,RN19 | CT-FR-01..20
describe('FrequenciaService [RF005 | RN08,RN12,RN13,RN14,RN18,RN19 | CT-FR-01..20]', () => {
    beforeEach(() => jest.clearAllMocks());

    // ------------------------------------------------------------------ criar
    describe('criar', () => {

        it('retorna a frequência criada quando os dados são válidos', async () => {
            jovemRepository.buscarPorId.mockResolvedValue({ id: 1 });
            usuarioRepository.buscarPorId.mockResolvedValue({ id: 1 });
            frequenciaRepository.buscarDuplicata.mockResolvedValue(null);
            frequenciaRepository.criar.mockResolvedValue(mockFrequencia);

            const resultado = await frequenciaService.criar({ ...mockFrequencia });

            expect(resultado).toEqual(mockFrequencia);
            expect(frequenciaRepository.criar).toHaveBeenCalledTimes(1);
        });

        it('lança BadRequestError quando campos obrigatórios estão ausentes', async () => {
            await expect(
                frequenciaService.criar({ jovem_id: 1 })
            ).rejects.toThrow(BadRequestError);
        });

        it('lança BadRequestError quando apenas responsavel_id está ausente', async () => {
            await expect(
                frequenciaService.criar({ jovem_id: 1, data_aula: '2026-05-20', tipo_presenca: 'Presencial' })
            ).rejects.toThrow(BadRequestError);
        });

        it('lança BadRequestError quando tipo_presenca é inválido', async () => {
            await expect(
                frequenciaService.criar({ ...mockFrequencia, tipo_presenca: 'Invalido' })
            ).rejects.toThrow(BadRequestError);
        });

        it('aceita todos os tipos de presença válidos', async () => {
            const tiposValidos = ['Presencial', 'Gravacao', 'Ausente'];

            for (const tipo_presenca of tiposValidos) {
                jovemRepository.buscarPorId.mockResolvedValue({ id: 1 });
                usuarioRepository.buscarPorId.mockResolvedValue({ id: 1 });
                frequenciaRepository.buscarDuplicata.mockResolvedValue(null);
                frequenciaRepository.criar.mockResolvedValue({ ...mockFrequencia, tipo_presenca });

                const resultado = await frequenciaService.criar({ ...mockFrequencia, tipo_presenca });
                expect(resultado.tipo_presenca).toBe(tipo_presenca);
            }
        });

        it('lança ConflictError quando já existe frequência para o jovem na mesma data', async () => {
            jovemRepository.buscarPorId.mockResolvedValue({ id: 1 });
            usuarioRepository.buscarPorId.mockResolvedValue({ id: 1 });
            frequenciaRepository.buscarDuplicata.mockResolvedValue({ id: 99 });

            await expect(
                frequenciaService.criar({ ...mockFrequencia })
            ).rejects.toThrow(ConflictError);
        });

        it('lança NotFoundError quando jovem_id não existe', async () => {
            jovemRepository.buscarPorId.mockResolvedValue(null);

            await expect(
                frequenciaService.criar({ ...mockFrequencia })
            ).rejects.toThrow(NotFoundError);
            expect(frequenciaRepository.criar).not.toHaveBeenCalled();
        });

        it('lança NotFoundError quando responsavel_id não existe', async () => {
            jovemRepository.buscarPorId.mockResolvedValue({ id: 1 });
            usuarioRepository.buscarPorId.mockResolvedValue(null);

            await expect(
                frequenciaService.criar({ ...mockFrequencia })
            ).rejects.toThrow(NotFoundError);
            expect(frequenciaRepository.criar).not.toHaveBeenCalled();
        });
    });

    // -------------------------------------------------------------- listarTodos
    describe('listarTodos', () => {

        it('retorna lista sem filtros', async () => {
            frequenciaRepository.listarTodos.mockResolvedValue([mockFrequencia]);

            const resultado = await frequenciaService.listarTodos();
            expect(resultado).toHaveLength(1);
        });

        it('retorna lista vazia quando nenhum registro corresponde ao filtro', async () => {
            frequenciaRepository.listarTodos.mockResolvedValue([]);

            const resultado = await frequenciaService.listarTodos({ jovem_id: 999 });
            expect(resultado).toHaveLength(0);
        });

        it('lança BadRequestError quando tipo_presenca do filtro é inválido', async () => {
            await expect(
                frequenciaService.listarTodos({ tipo_presenca: 'Invalido' })
            ).rejects.toThrow(BadRequestError);
        });

        it('converte jovem_id string para número antes de passar ao repositório', async () => {
            frequenciaRepository.listarTodos.mockResolvedValue([]);

            await frequenciaService.listarTodos({ jovem_id: '1' });
            expect(frequenciaRepository.listarTodos).toHaveBeenCalledWith(
                expect.objectContaining({ jovem_id: 1 })
            );
        });

        it('converte programa_id string para número antes de passar ao repositório', async () => {
            frequenciaRepository.listarTodos.mockResolvedValue([]);

            await frequenciaService.listarTodos({ programa_id: '2' });
            expect(frequenciaRepository.listarTodos).toHaveBeenCalledWith(
                expect.objectContaining({ programa_id: 2 })
            );
        });

        it('converte jovem_id e programa_id simultaneamente quando ambos chegam como string', async () => {
            frequenciaRepository.listarTodos.mockResolvedValue([]);

            await frequenciaService.listarTodos({ jovem_id: '3', programa_id: '4' });
            expect(frequenciaRepository.listarTodos).toHaveBeenCalledWith(
                expect.objectContaining({ jovem_id: 3, programa_id: 4 })
            );
        });
    });

    // --------------------------------------------------------------- buscarPorId
    describe('buscarPorId', () => {

        it('retorna a frequência quando o ID existe', async () => {
            frequenciaRepository.buscarPorId.mockResolvedValue(mockFrequencia);

            const resultado = await frequenciaService.buscarPorId(1);
            expect(resultado).toEqual(mockFrequencia);
        });

        it('lança NotFoundError quando o ID não existe', async () => {
            frequenciaRepository.buscarPorId.mockResolvedValue(null);

            await expect(frequenciaService.buscarPorId(999)).rejects.toThrow(NotFoundError);
        });
    });

    // ---------------------------------------------------------------- atualizar
    describe('atualizar', () => {

        it('retorna frequência atualizada quando dados são válidos', async () => {
            frequenciaRepository.buscarPorId.mockResolvedValue(mockFrequencia);
            frequenciaRepository.atualizar.mockResolvedValue({ ...mockFrequencia, tipo_presenca: 'Gravacao' });

            const resultado = await frequenciaService.atualizar(1, { tipo_presenca: 'Gravacao' });
            expect(resultado.tipo_presenca).toBe('Gravacao');
        });

        it('lança NotFoundError quando o ID não existe', async () => {
            frequenciaRepository.buscarPorId.mockResolvedValue(null);

            await expect(
                frequenciaService.atualizar(999, { tipo_presenca: 'Presencial' })
            ).rejects.toThrow(NotFoundError);
        });

        it('lança BadRequestError quando tipo_presenca enviado é inválido', async () => {
            frequenciaRepository.buscarPorId.mockResolvedValue(mockFrequencia);

            await expect(
                frequenciaService.atualizar(1, { tipo_presenca: 'Invalido' })
            ).rejects.toThrow(BadRequestError);
        });

        it('não valida tipo_presenca quando ele não é enviado na atualização', async () => {
            frequenciaRepository.buscarPorId.mockResolvedValue(mockFrequencia);
            frequenciaRepository.atualizar.mockResolvedValue({ ...mockFrequencia, observacao: 'Ok' });

            // tipo_presenca ausente — não deve lançar erro
            const resultado = await frequenciaService.atualizar(1, { observacao: 'Ok' });
            expect(resultado.observacao).toBe('Ok');
        });

        it('lança ConflictError ao mudar data_aula para uma já registrada do mesmo jovem', async () => {
            frequenciaRepository.buscarPorId.mockResolvedValue(mockFrequencia);
            frequenciaRepository.buscarDuplicata.mockResolvedValue({ id: 99 });

            await expect(
                frequenciaService.atualizar(1, { data_aula: '2026-05-21' })
            ).rejects.toThrow(ConflictError);
        });

        it('atualiza data_aula sem conflito quando não há duplicata', async () => {
            frequenciaRepository.buscarPorId.mockResolvedValue(mockFrequencia);
            frequenciaRepository.buscarDuplicata.mockResolvedValue(null);
            frequenciaRepository.atualizar.mockResolvedValue({ ...mockFrequencia, data_aula: '2026-05-21' });

            const resultado = await frequenciaService.atualizar(1, { data_aula: '2026-05-21' });
            expect(resultado.data_aula).toBe('2026-05-21');
        });

        it('não verifica duplicata quando data_aula não é enviada na atualização', async () => {
            frequenciaRepository.buscarPorId.mockResolvedValue(mockFrequencia);
            frequenciaRepository.atualizar.mockResolvedValue({ ...mockFrequencia, tipo_presenca: 'Ausente' });

            await frequenciaService.atualizar(1, { tipo_presenca: 'Ausente' });

            expect(frequenciaRepository.buscarDuplicata).not.toHaveBeenCalled();
        });
    });

    // ---------------------------------------------------------------- excluir
    describe('excluir', () => {

        it('exclui a frequência quando o ID existe', async () => {
            frequenciaRepository.buscarPorId.mockResolvedValue(mockFrequencia);
            frequenciaRepository.excluir.mockResolvedValue({ id: 1 });

            await expect(frequenciaService.excluir(1)).resolves.not.toThrow();
        });

        it('lança NotFoundError ao tentar excluir ID inexistente', async () => {
            frequenciaRepository.buscarPorId.mockResolvedValue(null);

            await expect(frequenciaService.excluir(999)).rejects.toThrow(NotFoundError);
        });
    });
});
