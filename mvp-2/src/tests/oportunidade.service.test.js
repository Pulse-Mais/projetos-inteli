// src/tests/oportunidade.service.test.js

jest.mock('../repositories/oportunidadeRepository', () => ({
    criar: jest.fn(),
    buscarPorId: jest.fn(),
    listarTodos: jest.fn(),
    atualizar: jest.fn(),
    excluir: jest.fn()
}));

const oportunidadeRepository = require('../repositories/oportunidadeRepository');
const oportunidadeService = require('../services/oportunidadeService');
const { BadRequestError, NotFoundError } = require('../errors/AppError');

const mockOportunidade = {
    id: 1,
    tipo: 'Curso',
    titulo: 'Python para Iniciantes',
    instituicao: 'Pulse Mais',
    descricao: 'Curso introdutório de programação em Python.',
    local: 'Online',
    data_inicio: '2026-07-01',
    data_fim: '2026-07-31',
    duracao: '40h',
    vagas: 30,
    valor: null,
    modalidade: 'Online',
    link: 'https://pulsemais.org/curso-python',
    ativo: true,
    criado_em: '2026-06-01T10:00:00.000Z'
};

// Rastreabilidade (Art 11): RF004,RF013 | RN08 (24 unitários — sem CT enumerado no WAD §3.9)
describe('OportunidadeService [RF004,RF013 | RN08]', () => {
    beforeEach(() => jest.clearAllMocks());

    // ------------------------------------------------------------------ criar
    describe('criar', () => {

        it('retorna a oportunidade criada quando os dados sao validos', async () => {
            oportunidadeRepository.criar.mockResolvedValue(mockOportunidade);

            const resultado = await oportunidadeService.criar({ ...mockOportunidade });

            expect(resultado).toEqual(mockOportunidade);
            expect(oportunidadeRepository.criar).toHaveBeenCalledTimes(1);
        });

        it('lanca BadRequestError quando tipo esta ausente', async () => {
            await expect(
                oportunidadeService.criar({ titulo: 'Curso X' })
            ).rejects.toThrow(BadRequestError);
            expect(oportunidadeRepository.criar).not.toHaveBeenCalled();
        });

        it('lanca BadRequestError quando titulo esta ausente', async () => {
            await expect(
                oportunidadeService.criar({ tipo: 'Curso' })
            ).rejects.toThrow(BadRequestError);
            expect(oportunidadeRepository.criar).not.toHaveBeenCalled();
        });

        it('lanca BadRequestError quando ambos os campos obrigatorios estao ausentes', async () => {
            await expect(
                oportunidadeService.criar({ instituicao: 'Pulse Mais' })
            ).rejects.toThrow(BadRequestError);
        });

        it('lanca BadRequestError quando tipo e invalido', async () => {
            await expect(
                oportunidadeService.criar({ tipo: 'Estagio', titulo: 'Oportunidade X' })
            ).rejects.toThrow(BadRequestError);
            expect(oportunidadeRepository.criar).not.toHaveBeenCalled();
        });

        it('lanca BadRequestError quando modalidade e invalida', async () => {
            await expect(
                oportunidadeService.criar({ tipo: 'Curso', titulo: 'Curso X', modalidade: 'Remoto' })
            ).rejects.toThrow(BadRequestError);
            expect(oportunidadeRepository.criar).not.toHaveBeenCalled();
        });

        it('aceita todos os tipos validos', async () => {
            const tiposValidos = ['Curso', 'Evento', 'Bolsa'];
            for (const tipo of tiposValidos) {
                oportunidadeRepository.criar.mockResolvedValue({ ...mockOportunidade, tipo });
                const resultado = await oportunidadeService.criar({ tipo, titulo: 'Titulo Teste' });
                expect(resultado.tipo).toBe(tipo);
            }
        });

        it('aceita todas as modalidades validas', async () => {
            const modalidadesValidas = ['Online', 'Presencial', 'Hibrido'];
            for (const modalidade of modalidadesValidas) {
                oportunidadeRepository.criar.mockResolvedValue({ ...mockOportunidade, modalidade });
                const resultado = await oportunidadeService.criar({ tipo: 'Curso', titulo: 'Titulo', modalidade });
                expect(resultado.modalidade).toBe(modalidade);
            }
        });

        it('cria oportunidade sem modalidade quando campo e omitido', async () => {
            oportunidadeRepository.criar.mockResolvedValue({ ...mockOportunidade, modalidade: null });
            const resultado = await oportunidadeService.criar({ tipo: 'Bolsa', titulo: 'Bolsa FAPESP' });
            expect(oportunidadeRepository.criar).toHaveBeenCalledTimes(1);
            expect(resultado).toBeDefined();
        });
    });

    // --------------------------------------------------------------- buscarPorId
    describe('buscarPorId', () => {

        it('retorna a oportunidade quando encontrada', async () => {
            oportunidadeRepository.buscarPorId.mockResolvedValue(mockOportunidade);

            const resultado = await oportunidadeService.buscarPorId(1);

            expect(resultado).toEqual(mockOportunidade);
            expect(oportunidadeRepository.buscarPorId).toHaveBeenCalledWith(1);
        });

        it('lanca NotFoundError quando oportunidade nao existe', async () => {
            oportunidadeRepository.buscarPorId.mockResolvedValue(null);

            await expect(oportunidadeService.buscarPorId(999)).rejects.toThrow(NotFoundError);
        });
    });

    // ---------------------------------------------------------------- listarTodos
    describe('listarTodos', () => {

        it('retorna lista de oportunidades sem filtros', async () => {
            oportunidadeRepository.listarTodos.mockResolvedValue([mockOportunidade]);

            const resultado = await oportunidadeService.listarTodos();

            expect(resultado).toEqual([mockOportunidade]);
            expect(oportunidadeRepository.listarTodos).toHaveBeenCalledWith({});
        });

        it('filtra por tipo valido', async () => {
            oportunidadeRepository.listarTodos.mockResolvedValue([mockOportunidade]);

            await oportunidadeService.listarTodos({ tipo: 'Curso' });

            expect(oportunidadeRepository.listarTodos).toHaveBeenCalledWith(
                expect.objectContaining({ tipo: 'Curso' })
            );
        });

        it('lanca BadRequestError quando tipo de filtro e invalido', async () => {
            await expect(
                oportunidadeService.listarTodos({ tipo: 'Emprego' })
            ).rejects.toThrow(BadRequestError);
        });

        it('lanca BadRequestError quando modalidade de filtro e invalida', async () => {
            await expect(
                oportunidadeService.listarTodos({ modalidade: 'Remoto' })
            ).rejects.toThrow(BadRequestError);
        });

        it('converte filtro ativo string "true" para booleano true', async () => {
            oportunidadeRepository.listarTodos.mockResolvedValue([mockOportunidade]);

            await oportunidadeService.listarTodos({ ativo: 'true' });

            expect(oportunidadeRepository.listarTodos).toHaveBeenCalledWith(
                expect.objectContaining({ ativo: true })
            );
        });

        it('converte filtro ativo string "false" para booleano false', async () => {
            oportunidadeRepository.listarTodos.mockResolvedValue([]);

            await oportunidadeService.listarTodos({ ativo: 'false' });

            expect(oportunidadeRepository.listarTodos).toHaveBeenCalledWith(
                expect.objectContaining({ ativo: false })
            );
        });

        it('filtra com tipo e modalidade combinados', async () => {
            oportunidadeRepository.listarTodos.mockResolvedValue([mockOportunidade]);

            await oportunidadeService.listarTodos({ tipo: 'Curso', modalidade: 'Online' });

            expect(oportunidadeRepository.listarTodos).toHaveBeenCalledWith(
                expect.objectContaining({ tipo: 'Curso', modalidade: 'Online' })
            );
        });
    });

    // ------------------------------------------------------------------ atualizar
    describe('atualizar', () => {

        it('retorna a oportunidade atualizada quando encontrada', async () => {
            const atualizado = { ...mockOportunidade, titulo: 'Novo Titulo' };
            oportunidadeRepository.buscarPorId.mockResolvedValue(mockOportunidade);
            oportunidadeRepository.atualizar.mockResolvedValue(atualizado);

            const resultado = await oportunidadeService.atualizar(1, { titulo: 'Novo Titulo' });

            expect(resultado).toEqual(atualizado);
            expect(oportunidadeRepository.atualizar).toHaveBeenCalledWith(1, { titulo: 'Novo Titulo' });
        });

        it('lanca NotFoundError quando oportunidade nao existe', async () => {
            oportunidadeRepository.buscarPorId.mockResolvedValue(null);

            await expect(
                oportunidadeService.atualizar(999, { titulo: 'X' })
            ).rejects.toThrow(NotFoundError);
            expect(oportunidadeRepository.atualizar).not.toHaveBeenCalled();
        });

        it('lanca BadRequestError ao atualizar com tipo invalido', async () => {
            oportunidadeRepository.buscarPorId.mockResolvedValue(mockOportunidade);

            await expect(
                oportunidadeService.atualizar(1, { tipo: 'Estagio' })
            ).rejects.toThrow(BadRequestError);
            expect(oportunidadeRepository.atualizar).not.toHaveBeenCalled();
        });

        it('lanca BadRequestError ao atualizar com modalidade invalida', async () => {
            oportunidadeRepository.buscarPorId.mockResolvedValue(mockOportunidade);

            await expect(
                oportunidadeService.atualizar(1, { modalidade: 'Remoto' })
            ).rejects.toThrow(BadRequestError);
            expect(oportunidadeRepository.atualizar).not.toHaveBeenCalled();
        });
    });

    // ------------------------------------------------------------------ excluir
    describe('excluir', () => {

        it('exclui a oportunidade quando encontrada', async () => {
            oportunidadeRepository.buscarPorId.mockResolvedValue(mockOportunidade);
            oportunidadeRepository.excluir.mockResolvedValue({ id: 1 });

            await oportunidadeService.excluir(1);

            expect(oportunidadeRepository.excluir).toHaveBeenCalledWith(1);
        });

        it('lanca NotFoundError quando oportunidade nao existe', async () => {
            oportunidadeRepository.buscarPorId.mockResolvedValue(null);

            await expect(oportunidadeService.excluir(999)).rejects.toThrow(NotFoundError);
            expect(oportunidadeRepository.excluir).not.toHaveBeenCalled();
        });
    });
});
