// src/tests/disciplina.service.test.js

jest.mock('../repositories/disciplinaRepository', () => ({
    criar: jest.fn(),
    buscarPorId: jest.fn(),
    listarTodos: jest.fn(),
    atualizar: jest.fn(),
    excluir: jest.fn()
}));

const disciplinaRepository = require('../repositories/disciplinaRepository');
const disciplinaService = require('../services/disciplinaService');
const { BadRequestError, NotFoundError } = require('../errors/AppError');

const mockDisciplina = {
    id: 1,
    ensino_superior_id: 5,
    nome: 'Cálculo I',
    status: 'Em_andamento',
    nota: 7.5,
    carga_horaria: 60,
    semestre: '2026.1',
    ativo: true,
    criado_em: '2026-06-01T10:00:00.000Z'
};

// Rastreabilidade (Art 11): RF024 | RN08 (sem CT enumerado no WAD §3.9 — COD-03)
describe('DisciplinaService [RF024 | RN08]', () => {
    beforeEach(() => jest.clearAllMocks());

    // ------------------------------------------------------------------ criar
    describe('criar', () => {

        it('retorna a disciplina criada quando os dados sao validos', async () => {
            disciplinaRepository.criar.mockResolvedValue(mockDisciplina);

            const resultado = await disciplinaService.criar({ ...mockDisciplina });

            expect(resultado).toEqual(mockDisciplina);
            expect(disciplinaRepository.criar).toHaveBeenCalledTimes(1);
        });

        it('lanca BadRequestError quando ensino_superior_id esta ausente', async () => {
            await expect(
                disciplinaService.criar({ nome: 'Cálculo I', status: 'Em_andamento' })
            ).rejects.toThrow(BadRequestError);
            expect(disciplinaRepository.criar).not.toHaveBeenCalled();
        });

        it('lanca BadRequestError quando nome esta ausente', async () => {
            await expect(
                disciplinaService.criar({ ensino_superior_id: 5, status: 'Em_andamento' })
            ).rejects.toThrow(BadRequestError);
            expect(disciplinaRepository.criar).not.toHaveBeenCalled();
        });

        it('lanca BadRequestError quando status esta ausente', async () => {
            await expect(
                disciplinaService.criar({ ensino_superior_id: 5, nome: 'Cálculo I' })
            ).rejects.toThrow(BadRequestError);
            expect(disciplinaRepository.criar).not.toHaveBeenCalled();
        });

        it('lanca BadRequestError quando status e invalido', async () => {
            await expect(
                disciplinaService.criar({ ensino_superior_id: 5, nome: 'Cálculo I', status: 'Cursando' })
            ).rejects.toThrow(BadRequestError);
            expect(disciplinaRepository.criar).not.toHaveBeenCalled();
        });

        it('aceita todos os status validos', async () => {
            const statusValidos = ['Aprovado', 'Reprovado', 'Em_andamento', 'Trancado'];
            for (const status of statusValidos) {
                disciplinaRepository.criar.mockResolvedValue({ ...mockDisciplina, status });
                const resultado = await disciplinaService.criar({ ensino_superior_id: 5, nome: 'X', status });
                expect(resultado.status).toBe(status);
            }
        });
    });

    // --------------------------------------------------------------- buscarPorId
    describe('buscarPorId', () => {

        it('retorna a disciplina quando encontrada', async () => {
            disciplinaRepository.buscarPorId.mockResolvedValue(mockDisciplina);

            const resultado = await disciplinaService.buscarPorId(1);

            expect(resultado).toEqual(mockDisciplina);
            expect(disciplinaRepository.buscarPorId).toHaveBeenCalledWith(1);
        });

        it('lanca NotFoundError quando disciplina nao existe', async () => {
            disciplinaRepository.buscarPorId.mockResolvedValue(null);

            await expect(disciplinaService.buscarPorId(999)).rejects.toThrow(NotFoundError);
        });
    });

    // ---------------------------------------------------------------- listarTodos
    describe('listarTodos', () => {

        it('retorna lista de disciplinas sem filtros', async () => {
            disciplinaRepository.listarTodos.mockResolvedValue([mockDisciplina]);

            const resultado = await disciplinaService.listarTodos();

            expect(resultado).toEqual([mockDisciplina]);
            expect(disciplinaRepository.listarTodos).toHaveBeenCalledWith({});
        });

        it('filtra por status valido', async () => {
            disciplinaRepository.listarTodos.mockResolvedValue([mockDisciplina]);

            await disciplinaService.listarTodos({ status: 'Aprovado' });

            expect(disciplinaRepository.listarTodos).toHaveBeenCalledWith(
                expect.objectContaining({ status: 'Aprovado' })
            );
        });

        it('lanca BadRequestError quando status de filtro e invalido', async () => {
            await expect(
                disciplinaService.listarTodos({ status: 'Cursando' })
            ).rejects.toThrow(BadRequestError);
        });

        it('converte filtros ensino_superior_id e jovem_id string para numero', async () => {
            disciplinaRepository.listarTodos.mockResolvedValue([mockDisciplina]);

            await disciplinaService.listarTodos({ ensino_superior_id: '5', jovem_id: '10' });

            expect(disciplinaRepository.listarTodos).toHaveBeenCalledWith(
                expect.objectContaining({ ensino_superior_id: 5, jovem_id: 10 })
            );
        });
    });

    // ------------------------------------------------------------------ atualizar
    describe('atualizar', () => {

        it('retorna a disciplina atualizada quando encontrada', async () => {
            const atualizado = { ...mockDisciplina, nota: 9.0 };
            disciplinaRepository.buscarPorId.mockResolvedValue(mockDisciplina);
            disciplinaRepository.atualizar.mockResolvedValue(atualizado);

            const resultado = await disciplinaService.atualizar(1, { nota: 9.0 });

            expect(resultado).toEqual(atualizado);
            expect(disciplinaRepository.atualizar).toHaveBeenCalledWith(1, { nota: 9.0 });
        });

        it('lanca NotFoundError quando disciplina nao existe', async () => {
            disciplinaRepository.buscarPorId.mockResolvedValue(null);

            await expect(
                disciplinaService.atualizar(999, { nota: 9.0 })
            ).rejects.toThrow(NotFoundError);
            expect(disciplinaRepository.atualizar).not.toHaveBeenCalled();
        });

        it('lanca BadRequestError ao atualizar com status invalido', async () => {
            disciplinaRepository.buscarPorId.mockResolvedValue(mockDisciplina);

            await expect(
                disciplinaService.atualizar(1, { status: 'Cursando' })
            ).rejects.toThrow(BadRequestError);
            expect(disciplinaRepository.atualizar).not.toHaveBeenCalled();
        });
    });

    // ------------------------------------------------------------------ excluir
    describe('excluir', () => {

        it('exclui a disciplina quando encontrada', async () => {
            disciplinaRepository.buscarPorId.mockResolvedValue(mockDisciplina);
            disciplinaRepository.excluir.mockResolvedValue({ id: 1 });

            await disciplinaService.excluir(1);

            expect(disciplinaRepository.excluir).toHaveBeenCalledWith(1);
        });

        it('lanca NotFoundError quando disciplina nao existe', async () => {
            disciplinaRepository.buscarPorId.mockResolvedValue(null);

            await expect(disciplinaService.excluir(999)).rejects.toThrow(NotFoundError);
            expect(disciplinaRepository.excluir).not.toHaveBeenCalled();
        });
    });
});
