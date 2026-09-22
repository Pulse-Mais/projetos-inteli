// src/tests/ensinoSuperior.service.test.js

// Aqui, mockamos explicitamente o repository para testar apenas as regras do service.
jest.mock('../repositories/ensinoSuperiorRepository', () => ({
    criar: jest.fn(),
    buscarPorId: jest.fn(),
    listarTodos: jest.fn(),
    atualizar: jest.fn(),
    excluir: jest.fn()
}));
jest.mock('../repositories/jovemRepository');

// Aqui, importamos o repository mockado, o service real e os erros esperados.
const ensinoSuperiorRepository = require('../repositories/ensinoSuperiorRepository');
const jovemRepository = require('../repositories/jovemRepository');
const ensinoSuperiorService = require('../services/ensinoSuperiorService');
const { BadRequestError, NotFoundError } = require('../errors/AppError');

// Aqui, definimos um registro base valido para reaproveitar nos cenarios de teste.
const mockEnsinoSuperior = {
    id: 1,
    jovem_id: 1,
    instituicao: 'USP',
    cursos: 'Ciencia da Computacao',
    modalidade_bolsa: 'ProUni',
    status: 'Cursando',
    data_inicio: '2024-02-01',
    data_conclusao: null,
    criado_em: '2024-02-01T10:00:00.000Z',
    atualizado_em: '2024-02-01T10:00:00.000Z',
};

// Rastreabilidade (Art 11): RF011 | RN08,RN15 | CT-EN-01..14
describe('EnsinoSuperiorService [RF011 | RN08,RN15 | CT-EN-01..14]', () => {
    // Aqui, limpamos chamadas e estados dos mocks antes de cada teste.
    beforeEach(() => jest.clearAllMocks());

    // ------------------------------------------------------------------ criar
    describe('criar', () => {

        it('retorna o registro criado quando os dados sao validos', async () => {
            jovemRepository.buscarPorId.mockResolvedValue({ id: 1 });
            ensinoSuperiorRepository.criar.mockResolvedValue(mockEnsinoSuperior);

            const resultado = await ensinoSuperiorService.criar({ ...mockEnsinoSuperior });

            expect(resultado).toEqual(mockEnsinoSuperior);
            expect(ensinoSuperiorRepository.criar).toHaveBeenCalledTimes(1);
        });

        it('lanca BadRequestError quando campos obrigatorios estao ausentes', async () => {
            await expect(
                ensinoSuperiorService.criar({ jovem_id: 1 })
            ).rejects.toThrow(BadRequestError);
        });

        it('lanca BadRequestError quando apenas jovem_id esta ausente', async () => {
            await expect(
                ensinoSuperiorService.criar({
                    ...mockEnsinoSuperior,
                    jovem_id: undefined
                })
            ).rejects.toThrow(BadRequestError);
        });

        it('lanca BadRequestError quando apenas instituicao esta ausente', async () => {
            await expect(
                ensinoSuperiorService.criar({
                    ...mockEnsinoSuperior,
                    instituicao: ''
                })
            ).rejects.toThrow(BadRequestError);
        });

        it('lanca BadRequestError quando apenas cursos esta ausente', async () => {
            await expect(
                ensinoSuperiorService.criar({
                    ...mockEnsinoSuperior,
                    cursos: ''
                })
            ).rejects.toThrow(BadRequestError);
        });

        it('lanca BadRequestError quando apenas status esta ausente', async () => {
            await expect(
                ensinoSuperiorService.criar({
                    ...mockEnsinoSuperior,
                    status: ''
                })
            ).rejects.toThrow(BadRequestError);
        });

        it('lanca BadRequestError quando status e invalido', async () => {
            await expect(
                ensinoSuperiorService.criar({ ...mockEnsinoSuperior, status: 'Invalido' })
            ).rejects.toThrow(BadRequestError);
        });

        it('lanca BadRequestError quando modalidade_bolsa e invalida', async () => {
            await expect(
                ensinoSuperiorService.criar({ ...mockEnsinoSuperior, modalidade_bolsa: 'Invalida' })
            ).rejects.toThrow(BadRequestError);
        });

        it('aceita todos os status validos', async () => {
            const statusValidos = ['Cursando', 'Trancado', 'Concluido', 'Desistente'];

            for (const status of statusValidos) {
                jovemRepository.buscarPorId.mockResolvedValue({ id: 1 });
                ensinoSuperiorRepository.criar.mockResolvedValue({ ...mockEnsinoSuperior, status });

                const resultado = await ensinoSuperiorService.criar({ ...mockEnsinoSuperior, status });
                expect(resultado.status).toBe(status);
            }
        });

        it('aceita todas as modalidades de bolsa validas', async () => {
            const modalidadesValidas = ['Integral', 'Parcial', 'ProUni', 'FIES', 'Institucional', 'Sem_bolsa', 'Outra'];

            for (const modalidade_bolsa of modalidadesValidas) {
                jovemRepository.buscarPorId.mockResolvedValue({ id: 1 });
                ensinoSuperiorRepository.criar.mockResolvedValue({ ...mockEnsinoSuperior, modalidade_bolsa });

                const resultado = await ensinoSuperiorService.criar({ ...mockEnsinoSuperior, modalidade_bolsa });
                expect(resultado.modalidade_bolsa).toBe(modalidade_bolsa);
            }
        });

        it('aceita modalidade_bolsa nula porque e campo opcional', async () => {
            jovemRepository.buscarPorId.mockResolvedValue({ id: 1 });
            const registroSemBolsa = { ...mockEnsinoSuperior, modalidade_bolsa: null };
            ensinoSuperiorRepository.criar.mockResolvedValue(registroSemBolsa);

            const resultado = await ensinoSuperiorService.criar(registroSemBolsa);
            expect(resultado.modalidade_bolsa).toBeNull();
        });

        it('lanca NotFoundError quando jovem_id nao existe', async () => {
            jovemRepository.buscarPorId.mockResolvedValue(null);

            await expect(
                ensinoSuperiorService.criar({ ...mockEnsinoSuperior })
            ).rejects.toThrow(NotFoundError);
            expect(ensinoSuperiorRepository.criar).not.toHaveBeenCalled();
        });
    });

    // -------------------------------------------------------------- listarTodos
    describe('listarTodos', () => {

        it('retorna lista sem filtros', async () => {
            ensinoSuperiorRepository.listarTodos.mockResolvedValue([mockEnsinoSuperior]);

            const resultado = await ensinoSuperiorService.listarTodos();

            expect(resultado).toHaveLength(1);
            expect(resultado[0]).toEqual(mockEnsinoSuperior);
        });

        it('retorna lista vazia quando nenhum registro corresponde ao filtro', async () => {
            ensinoSuperiorRepository.listarTodos.mockResolvedValue([]);

            const resultado = await ensinoSuperiorService.listarTodos({ jovem_id: 999 });

            expect(resultado).toHaveLength(0);
        });

        it('lanca BadRequestError quando status do filtro e invalido', async () => {
            await expect(
                ensinoSuperiorService.listarTodos({ status: 'Invalido' })
            ).rejects.toThrow(BadRequestError);
        });

        it('converte jovem_id string para numero antes de passar ao repositorio', async () => {
            ensinoSuperiorRepository.listarTodos.mockResolvedValue([]);

            await ensinoSuperiorService.listarTodos({ jovem_id: '1' });

            expect(ensinoSuperiorRepository.listarTodos).toHaveBeenCalledWith(
                expect.objectContaining({ jovem_id: 1 })
            );
        });

        it('nao altera jovem_id quando ja e numero', async () => {
            ensinoSuperiorRepository.listarTodos.mockResolvedValue([mockEnsinoSuperior]);

            await ensinoSuperiorService.listarTodos({ jovem_id: 1 });

            expect(ensinoSuperiorRepository.listarTodos).toHaveBeenCalledWith(
                expect.objectContaining({ jovem_id: 1 })
            );
        });

        it('filtra por status valido', async () => {
            ensinoSuperiorRepository.listarTodos.mockResolvedValue([mockEnsinoSuperior]);

            const resultado = await ensinoSuperiorService.listarTodos({ status: 'Cursando' });

            expect(resultado).toEqual([mockEnsinoSuperior]);
            expect(ensinoSuperiorRepository.listarTodos).toHaveBeenCalledWith(
                expect.objectContaining({ status: 'Cursando' })
            );
        });
    });

    // --------------------------------------------------------------- buscarPorId
    describe('buscarPorId', () => {

        it('retorna o registro quando o ID existe', async () => {
            ensinoSuperiorRepository.buscarPorId.mockResolvedValue(mockEnsinoSuperior);

            const resultado = await ensinoSuperiorService.buscarPorId(1);

            expect(resultado).toEqual(mockEnsinoSuperior);
            expect(ensinoSuperiorRepository.buscarPorId).toHaveBeenCalledWith(1);
        });

        it('lanca NotFoundError quando o ID nao existe', async () => {
            ensinoSuperiorRepository.buscarPorId.mockResolvedValue(null);

            await expect(ensinoSuperiorService.buscarPorId(999)).rejects.toThrow(NotFoundError);
        });
    });

    // ---------------------------------------------------------------- atualizar
    describe('atualizar', () => {

        it('retorna o registro atualizado quando os dados sao validos', async () => {
            const atualizado = { ...mockEnsinoSuperior, status: 'Concluido' };
            ensinoSuperiorRepository.buscarPorId.mockResolvedValue(mockEnsinoSuperior);
            ensinoSuperiorRepository.atualizar.mockResolvedValue(atualizado);

            const resultado = await ensinoSuperiorService.atualizar(1, { status: 'Concluido' });

            expect(resultado.status).toBe('Concluido');
        });

        it('lanca NotFoundError ao tentar atualizar ID inexistente', async () => {
            ensinoSuperiorRepository.buscarPorId.mockResolvedValue(null);

            await expect(
                ensinoSuperiorService.atualizar(999, { status: 'Concluido' })
            ).rejects.toThrow(NotFoundError);
        });

        it('lanca BadRequestError quando status enviado e invalido', async () => {
            ensinoSuperiorRepository.buscarPorId.mockResolvedValue(mockEnsinoSuperior);

            await expect(
                ensinoSuperiorService.atualizar(1, { status: 'Invalido' })
            ).rejects.toThrow(BadRequestError);
        });

        it('lanca BadRequestError quando modalidade_bolsa enviada e invalida', async () => {
            ensinoSuperiorRepository.buscarPorId.mockResolvedValue(mockEnsinoSuperior);

            await expect(
                ensinoSuperiorService.atualizar(1, { modalidade_bolsa: 'Invalida' })
            ).rejects.toThrow(BadRequestError);
        });

        it('aceita todos os status validos na atualizacao', async () => {
            const statusValidos = ['Cursando', 'Trancado', 'Concluido', 'Desistente'];

            for (const status of statusValidos) {
                ensinoSuperiorRepository.buscarPorId.mockResolvedValue(mockEnsinoSuperior);
                ensinoSuperiorRepository.atualizar.mockResolvedValue({ ...mockEnsinoSuperior, status });

                const resultado = await ensinoSuperiorService.atualizar(1, { status });

                expect(resultado.status).toBe(status);
            }
        });

        it('atualiza instituicao e cursos corretamente', async () => {
            ensinoSuperiorRepository.buscarPorId.mockResolvedValue(mockEnsinoSuperior);
            ensinoSuperiorRepository.atualizar.mockResolvedValue({
                ...mockEnsinoSuperior,
                instituicao: 'Unicamp',
                cursos: 'Sistemas de Informacao'
            });

            const resultado = await ensinoSuperiorService.atualizar(1, {
                instituicao: 'Unicamp',
                cursos: 'Sistemas de Informacao'
            });

            expect(resultado.instituicao).toBe('Unicamp');
            expect(resultado.cursos).toBe('Sistemas de Informacao');
        });

        it('atualiza data_conclusao quando dados sao validos', async () => {
            ensinoSuperiorRepository.buscarPorId.mockResolvedValue(mockEnsinoSuperior);
            ensinoSuperiorRepository.atualizar.mockResolvedValue({
                ...mockEnsinoSuperior,
                data_conclusao: '2027-12-15'
            });

            const resultado = await ensinoSuperiorService.atualizar(1, {
                data_conclusao: '2027-12-15'
            });

            expect(resultado.data_conclusao).toBe('2027-12-15');
        });

        it('aceita modalidade_bolsa nula na atualizacao', async () => {
            ensinoSuperiorRepository.buscarPorId.mockResolvedValue(mockEnsinoSuperior);
            ensinoSuperiorRepository.atualizar.mockResolvedValue({
                ...mockEnsinoSuperior,
                modalidade_bolsa: null
            });

            const resultado = await ensinoSuperiorService.atualizar(1, {
                modalidade_bolsa: null
            });

            expect(resultado.modalidade_bolsa).toBeNull();
        });

        it('retorna null quando repository nao encontra campos validos para atualizar', async () => {
            ensinoSuperiorRepository.buscarPorId.mockResolvedValue(mockEnsinoSuperior);
            ensinoSuperiorRepository.atualizar.mockResolvedValue(null);

            const resultado = await ensinoSuperiorService.atualizar(1, { campo_inexistente: 'valor' });

            expect(resultado).toBeNull();
        });
    });

    // ---------------------------------------------------------------- excluir
    describe('excluir', () => {

        it('exclui o registro quando o ID existe', async () => {
            ensinoSuperiorRepository.buscarPorId.mockResolvedValue(mockEnsinoSuperior);
            ensinoSuperiorRepository.excluir.mockResolvedValue({ id: 1 });

            await expect(ensinoSuperiorService.excluir(1)).resolves.not.toThrow();
            expect(ensinoSuperiorRepository.excluir).toHaveBeenCalledWith(1);
        });

        it('lanca NotFoundError ao tentar excluir ID inexistente', async () => {
            ensinoSuperiorRepository.buscarPorId.mockResolvedValue(null);

            await expect(ensinoSuperiorService.excluir(999)).rejects.toThrow(NotFoundError);
        });
    });
});
