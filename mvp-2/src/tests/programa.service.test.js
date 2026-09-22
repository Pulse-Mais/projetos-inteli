// src/tests/programa.service.test.js

jest.mock('../repositories/programaRepository');

const programaRepository = require('../repositories/programaRepository');
const programaService = require('../services/programaService');
const { BadRequestError, NotFoundError } = require('../errors/AppError');

const mockPrograma = {
    id: 1,
    nome: 'Formação Tech 2026',
    ano: 2026,
    tipo: 'Curso',
    carga_horaria: 140,
    coorte: '2026.1',
    data_inicio: '2026-02-01',
    data_fim: '2026-06-30',
    descricao: 'Curso intensivo de desenvolvimento web.',
    ativo: true,
    criado_em: '2026-05-26T10:00:00.000Z',
    atualizado_em: '2026-05-26T10:00:00.000Z'
};

// Rastreabilidade (Art 11): RF004 (+RF008,RF009) | RN08 + integridade temporal | CT-PG-01..20
describe('ProgramaService [RF004,RF008,RF009 | RN08 | CT-PG-01..20]', () => {
    beforeEach(() => jest.clearAllMocks());

    // ------------------------------------------------------------------ criar
    describe('criar', () => {

        it('retorna o programa criado quando os dados são válidos', async () => {
            programaRepository.criar.mockResolvedValue(mockPrograma);

            const resultado = await programaService.criar({ ...mockPrograma });

            expect(resultado).toEqual(mockPrograma);
            expect(programaRepository.criar).toHaveBeenCalledTimes(1);
        });

        it('lança BadRequestError quando campos obrigatórios estão ausentes', async () => {
            await expect(
                programaService.criar({ descricao: 'Sem nome, ano e tipo' })
            ).rejects.toThrow(BadRequestError);
        });

        it('[CT-PG-04] lança BadRequestError quando nome está vazio (whitespace)', async () => {
            await expect(
                programaService.criar({ nome: '   ', ano: 2026, tipo: 'Curso' })
            ).rejects.toThrow(BadRequestError);
        });

        it('lança BadRequestError quando nome é string vazia', async () => {
            await expect(
                programaService.criar({ nome: '', ano: 2026, tipo: 'Curso' })
            ).rejects.toThrow(BadRequestError);
        });

        it('lança BadRequestError quando tipo é inválido', async () => {
            await expect(
                programaService.criar({ nome: 'Programa Teste', ano: 2026, tipo: 'Invalido' })
            ).rejects.toThrow(BadRequestError);
        });

        it('lança BadRequestError quando ano é não-numérico', async () => {
            await expect(
                programaService.criar({ nome: 'Programa Teste', ano: 'abc', tipo: 'Curso' })
            ).rejects.toThrow(BadRequestError);
        });

        it('[CT-PG-03] lança BadRequestError quando ano é inferior a 2000', async () => {
            await expect(
                programaService.criar({ nome: 'Programa Teste', ano: 1999, tipo: 'Curso' })
            ).rejects.toThrow(BadRequestError);
        });

        it('[CT-PG-02] lança BadRequestError quando carga horária é negativa', async () => {
            await expect(
                programaService.criar({
                    nome: 'Programa Teste',
                    ano: 2026,
                    tipo: 'Curso',
                    carga_horaria: -1
                })
            ).rejects.toThrow(BadRequestError);
        });

        it('aceita carga_horaria zero (programa sem carga definida)', async () => {
            programaRepository.criar.mockResolvedValue({ ...mockPrograma, carga_horaria: 0 });

            const resultado = await programaService.criar({
                nome: 'Programa Teste',
                ano: 2026,
                tipo: 'Curso',
                carga_horaria: 0
            });
            expect(resultado.carga_horaria).toBe(0);
        });

        it('[CT-PG-01] lança BadRequestError quando data_fim é anterior à data_inicio', async () => {
            await expect(
                programaService.criar({
                    nome: 'Programa Teste',
                    ano: 2026,
                    tipo: 'Curso',
                    data_inicio: '2026-07-01',
                    data_fim: '2026-06-30'
                })
            ).rejects.toThrow(BadRequestError);
        });

        it('aceita data_fim igual à data_inicio', async () => {
            programaRepository.criar.mockResolvedValue({
                ...mockPrograma,
                data_inicio: '2026-07-01',
                data_fim: '2026-07-01'
            });

            const resultado = await programaService.criar({
                nome: 'Programa Teste',
                ano: 2026,
                tipo: 'Curso',
                data_inicio: '2026-07-01',
                data_fim: '2026-07-01'
            });
            expect(resultado).toBeDefined();
        });

        it('aceita todos os tipos válidos', async () => {
            const tiposValidos = ['Curso', 'Mentoria', 'Projeto', 'Evento_Recorrente'];

            for (const tipo of tiposValidos) {
                programaRepository.criar.mockResolvedValue({ ...mockPrograma, tipo });

                const resultado = await programaService.criar({ nome: 'Teste', ano: 2026, tipo });
                expect(resultado.tipo).toBe(tipo);
            }
        });
    });

    // -------------------------------------------------------------- listarTodos
    describe('listarTodos', () => {

        it('retorna lista sem filtros', async () => {
            programaRepository.listarTodos.mockResolvedValue([mockPrograma]);

            const resultado = await programaService.listarTodos();

            expect(resultado).toHaveLength(1);
            expect(resultado[0]).toEqual(mockPrograma);
        });

        it('retorna lista vazia quando nenhum programa corresponde ao filtro', async () => {
            programaRepository.listarTodos.mockResolvedValue([]);

            const resultado = await programaService.listarTodos({ tipo: 'Mentoria' });
            expect(resultado).toHaveLength(0);
        });

        it('[CT-PG-05] converte ano string para número antes de passar ao repositório', async () => {
            programaRepository.listarTodos.mockResolvedValue([]);

            await programaService.listarTodos({ ano: '2026' });

            expect(programaRepository.listarTodos).toHaveBeenCalledWith(
                expect.objectContaining({ ano: 2026 })
            );
        });

        it('converte ativo string "true" para boolean true antes de passar ao repositório', async () => {
            programaRepository.listarTodos.mockResolvedValue([mockPrograma]);

            await programaService.listarTodos({ ativo: 'true' });

            expect(programaRepository.listarTodos).toHaveBeenCalledWith(
                expect.objectContaining({ ativo: true })
            );
        });

        it('converte ativo string "false" para boolean false antes de passar ao repositório', async () => {
            programaRepository.listarTodos.mockResolvedValue([]);

            await programaService.listarTodos({ ativo: 'false' });

            expect(programaRepository.listarTodos).toHaveBeenCalledWith(
                expect.objectContaining({ ativo: false })
            );
        });

        it('repassa ativo boolean true ao repositório sem conversão', async () => {
            programaRepository.listarTodos.mockResolvedValue([mockPrograma]);

            await programaService.listarTodos({ ativo: true });

            expect(programaRepository.listarTodos).toHaveBeenCalledWith(
                expect.objectContaining({ ativo: true })
            );
        });

        it('lança BadRequestError quando tipo do filtro é inválido', async () => {
            await expect(
                programaService.listarTodos({ tipo: 'Invalido' })
            ).rejects.toThrow(BadRequestError);
        });

        it('lança BadRequestError quando ano do filtro é inválido', async () => {
            await expect(
                programaService.listarTodos({ ano: 'naoNumero' })
            ).rejects.toThrow(BadRequestError);
        });
    });

    // --------------------------------------------------------------- buscarPorId
    describe('buscarPorId', () => {

        it('retorna o programa quando o ID existe', async () => {
            programaRepository.buscarPorId.mockResolvedValue(mockPrograma);

            const resultado = await programaService.buscarPorId(1);

            expect(resultado).toEqual(mockPrograma);
        });

        it('lança NotFoundError quando o ID não existe', async () => {
            programaRepository.buscarPorId.mockResolvedValue(null);

            await expect(programaService.buscarPorId(999)).rejects.toThrow(NotFoundError);
        });
    });

    // ---------------------------------------------------------------- atualizar
    describe('atualizar', () => {

        it('retorna o programa atualizado quando os dados são válidos', async () => {
            const atualizado = { ...mockPrograma, nome: 'Formação Tech Atualizada' };
            programaRepository.buscarPorId.mockResolvedValue(mockPrograma);
            programaRepository.atualizar.mockResolvedValue(atualizado);

            const resultado = await programaService.atualizar(1, { nome: 'Formação Tech Atualizada' });

            expect(resultado.nome).toBe('Formação Tech Atualizada');
        });

        it('lança NotFoundError ao tentar atualizar ID inexistente', async () => {
            programaRepository.buscarPorId.mockResolvedValue(null);

            await expect(
                programaService.atualizar(999, { nome: 'Novo nome' })
            ).rejects.toThrow(NotFoundError);
        });

        it('lança BadRequestError quando atualização não possui campos válidos (repositório retorna null)', async () => {
            programaRepository.buscarPorId.mockResolvedValue(mockPrograma);
            programaRepository.atualizar.mockResolvedValue(null);

            await expect(
                programaService.atualizar(1, { campo_inexistente: 'valor' })
            ).rejects.toThrow(BadRequestError);
        });

        it('lança BadRequestError quando tipo inválido é enviado na atualização', async () => {
            programaRepository.buscarPorId.mockResolvedValue(mockPrograma);

            await expect(
                programaService.atualizar(1, { tipo: 'Invalido' })
            ).rejects.toThrow(BadRequestError);
        });

        it('lança BadRequestError quando nome vazio é enviado na atualização', async () => {
            programaRepository.buscarPorId.mockResolvedValue(mockPrograma);

            await expect(
                programaService.atualizar(1, { nome: '   ' })
            ).rejects.toThrow(BadRequestError);
        });

        it('lança BadRequestError quando carga_horaria negativa é enviada na atualização', async () => {
            programaRepository.buscarPorId.mockResolvedValue(mockPrograma);

            await expect(
                programaService.atualizar(1, { carga_horaria: -10 })
            ).rejects.toThrow(BadRequestError);
        });

        it('lança BadRequestError quando data_fim anterior à data_inicio é enviada na atualização', async () => {
            programaRepository.buscarPorId.mockResolvedValue(mockPrograma);

            await expect(
                programaService.atualizar(1, { data_inicio: '2026-12-01', data_fim: '2026-01-01' })
            ).rejects.toThrow(BadRequestError);
        });
    });

    // ---------------------------------------------------------------- arquivar
    describe('arquivar', () => {

        it('arquiva o programa quando o ID existe', async () => {
            programaRepository.buscarPorId.mockResolvedValue(mockPrograma);
            programaRepository.arquivar.mockResolvedValue({ ...mockPrograma, ativo: false });

            const resultado = await programaService.arquivar(1);

            expect(resultado.ativo).toBe(false);
        });

        it('lança NotFoundError ao tentar arquivar ID inexistente', async () => {
            programaRepository.buscarPorId.mockResolvedValue(null);

            await expect(programaService.arquivar(999)).rejects.toThrow(NotFoundError);
        });
    });
});
