// src/tests/competencia.service.test.js

jest.mock('../repositories/competenciaRepository', () => ({
    criar: jest.fn(),
    buscarPorId: jest.fn(),
    listarTodos: jest.fn(),
    atualizar: jest.fn(),
    excluir: jest.fn()
}));

const competenciaRepository = require('../repositories/competenciaRepository');
const competenciaService = require('../services/competenciaService');
const { BadRequestError, NotFoundError } = require('../errors/AppError');

const mockCompetencia = {
    id: 1,
    jovem_id: 10,
    nome: 'Lógica de Programação',
    tipo: 'Competencia',
    nivel: 'Basico',
    descricao: 'Fundamentos de algoritmos.',
    ativo: true,
    criado_em: '2026-06-01T10:00:00.000Z'
};

// Rastreabilidade (Art 11): RF025 | RN30 (sem CT enumerado no WAD §3.9 — COD-03)
describe('CompetenciaService [RF025 | RN30]', () => {
    beforeEach(() => jest.clearAllMocks());

    // ------------------------------------------------------------------ criar
    describe('criar', () => {

        it('retorna a competencia criada quando os dados sao validos', async () => {
            competenciaRepository.criar.mockResolvedValue(mockCompetencia);

            const resultado = await competenciaService.criar({ ...mockCompetencia });

            expect(resultado).toEqual(mockCompetencia);
            expect(competenciaRepository.criar).toHaveBeenCalledTimes(1);
        });

        it('cria competencia sem nivel quando campo e omitido', async () => {
            competenciaRepository.criar.mockResolvedValue({ ...mockCompetencia, nivel: null });

            const resultado = await competenciaService.criar({
                jovem_id: 10, nome: 'Comunicação', tipo: 'Competencia'
            });

            expect(competenciaRepository.criar).toHaveBeenCalledTimes(1);
            expect(resultado).toBeDefined();
        });

        it('lanca BadRequestError quando jovem_id esta ausente', async () => {
            await expect(
                competenciaService.criar({ nome: 'X', tipo: 'Curso' })
            ).rejects.toThrow(BadRequestError);
            expect(competenciaRepository.criar).not.toHaveBeenCalled();
        });

        it('lanca BadRequestError quando nome esta ausente', async () => {
            await expect(
                competenciaService.criar({ jovem_id: 10, tipo: 'Curso' })
            ).rejects.toThrow(BadRequestError);
            expect(competenciaRepository.criar).not.toHaveBeenCalled();
        });

        it('lanca BadRequestError quando tipo esta ausente', async () => {
            await expect(
                competenciaService.criar({ jovem_id: 10, nome: 'X' })
            ).rejects.toThrow(BadRequestError);
            expect(competenciaRepository.criar).not.toHaveBeenCalled();
        });

        it('lanca BadRequestError quando tipo e invalido', async () => {
            await expect(
                competenciaService.criar({ jovem_id: 10, nome: 'X', tipo: 'Habilidade' })
            ).rejects.toThrow(BadRequestError);
            expect(competenciaRepository.criar).not.toHaveBeenCalled();
        });

        it('lanca BadRequestError quando nivel e invalido', async () => {
            await expect(
                competenciaService.criar({ jovem_id: 10, nome: 'X', tipo: 'Curso', nivel: 'Expert' })
            ).rejects.toThrow(BadRequestError);
            expect(competenciaRepository.criar).not.toHaveBeenCalled();
        });

        it('aceita todos os tipos validos', async () => {
            const tiposValidos = ['Competencia', 'Curso', 'Evento', 'Certificacao'];
            for (const tipo of tiposValidos) {
                competenciaRepository.criar.mockResolvedValue({ ...mockCompetencia, tipo });
                const resultado = await competenciaService.criar({ jovem_id: 10, nome: 'X', tipo });
                expect(resultado.tipo).toBe(tipo);
            }
        });

        it('aceita todos os niveis validos', async () => {
            const niveisValidos = ['Basico', 'Intermediario', 'Avancado'];
            for (const nivel of niveisValidos) {
                competenciaRepository.criar.mockResolvedValue({ ...mockCompetencia, nivel });
                const resultado = await competenciaService.criar({ jovem_id: 10, nome: 'X', tipo: 'Curso', nivel });
                expect(resultado.nivel).toBe(nivel);
            }
        });
    });

    // --------------------------------------------------------------- buscarPorId
    describe('buscarPorId', () => {

        it('retorna a competencia quando encontrada', async () => {
            competenciaRepository.buscarPorId.mockResolvedValue(mockCompetencia);

            const resultado = await competenciaService.buscarPorId(1);

            expect(resultado).toEqual(mockCompetencia);
            expect(competenciaRepository.buscarPorId).toHaveBeenCalledWith(1);
        });

        it('lanca NotFoundError quando competencia nao existe', async () => {
            competenciaRepository.buscarPorId.mockResolvedValue(null);

            await expect(competenciaService.buscarPorId(999)).rejects.toThrow(NotFoundError);
        });
    });

    // ---------------------------------------------------------------- listarTodos
    describe('listarTodos', () => {

        it('retorna lista de competencias sem filtros', async () => {
            competenciaRepository.listarTodos.mockResolvedValue([mockCompetencia]);

            const resultado = await competenciaService.listarTodos();

            expect(resultado).toEqual([mockCompetencia]);
            expect(competenciaRepository.listarTodos).toHaveBeenCalledWith({});
        });

        it('filtra por tipo valido', async () => {
            competenciaRepository.listarTodos.mockResolvedValue([mockCompetencia]);

            await competenciaService.listarTodos({ tipo: 'Curso' });

            expect(competenciaRepository.listarTodos).toHaveBeenCalledWith(
                expect.objectContaining({ tipo: 'Curso' })
            );
        });

        it('lanca BadRequestError quando tipo de filtro e invalido', async () => {
            await expect(
                competenciaService.listarTodos({ tipo: 'Habilidade' })
            ).rejects.toThrow(BadRequestError);
        });

        it('lanca BadRequestError quando nivel de filtro e invalido', async () => {
            await expect(
                competenciaService.listarTodos({ nivel: 'Expert' })
            ).rejects.toThrow(BadRequestError);
        });

        it('converte filtro jovem_id string para numero', async () => {
            competenciaRepository.listarTodos.mockResolvedValue([mockCompetencia]);

            await competenciaService.listarTodos({ jovem_id: '10' });

            expect(competenciaRepository.listarTodos).toHaveBeenCalledWith(
                expect.objectContaining({ jovem_id: 10 })
            );
        });
    });

    // ------------------------------------------------------------------ atualizar
    describe('atualizar', () => {

        it('retorna a competencia atualizada quando encontrada', async () => {
            const atualizado = { ...mockCompetencia, nome: 'Novo Nome' };
            competenciaRepository.buscarPorId.mockResolvedValue(mockCompetencia);
            competenciaRepository.atualizar.mockResolvedValue(atualizado);

            const resultado = await competenciaService.atualizar(1, { nome: 'Novo Nome' });

            expect(resultado).toEqual(atualizado);
            expect(competenciaRepository.atualizar).toHaveBeenCalledWith(1, { nome: 'Novo Nome' });
        });

        it('lanca NotFoundError quando competencia nao existe', async () => {
            competenciaRepository.buscarPorId.mockResolvedValue(null);

            await expect(
                competenciaService.atualizar(999, { nome: 'X' })
            ).rejects.toThrow(NotFoundError);
            expect(competenciaRepository.atualizar).not.toHaveBeenCalled();
        });

        it('lanca BadRequestError ao atualizar com tipo invalido', async () => {
            competenciaRepository.buscarPorId.mockResolvedValue(mockCompetencia);

            await expect(
                competenciaService.atualizar(1, { tipo: 'Habilidade' })
            ).rejects.toThrow(BadRequestError);
            expect(competenciaRepository.atualizar).not.toHaveBeenCalled();
        });

        it('lanca BadRequestError ao atualizar com nivel invalido', async () => {
            competenciaRepository.buscarPorId.mockResolvedValue(mockCompetencia);

            await expect(
                competenciaService.atualizar(1, { nivel: 'Expert' })
            ).rejects.toThrow(BadRequestError);
            expect(competenciaRepository.atualizar).not.toHaveBeenCalled();
        });
    });

    // ------------------------------------------------------------------ excluir
    describe('excluir', () => {

        it('exclui a competencia quando encontrada', async () => {
            competenciaRepository.buscarPorId.mockResolvedValue(mockCompetencia);
            competenciaRepository.excluir.mockResolvedValue({ id: 1 });

            await competenciaService.excluir(1);

            expect(competenciaRepository.excluir).toHaveBeenCalledWith(1);
        });

        it('lanca NotFoundError quando competencia nao existe', async () => {
            competenciaRepository.buscarPorId.mockResolvedValue(null);

            await expect(competenciaService.excluir(999)).rejects.toThrow(NotFoundError);
            expect(competenciaRepository.excluir).not.toHaveBeenCalled();
        });
    });
});
