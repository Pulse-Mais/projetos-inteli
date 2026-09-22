// src/tests/evento.service.test.js

// Aqui, mockamos explicitamente o repository para testar apenas as regras do service.
jest.mock('../repositories/eventoRepository', () => ({
    criar: jest.fn(),
    buscarPorId: jest.fn(),
    listarTodos: jest.fn(),
    atualizar: jest.fn(),
    excluir: jest.fn()
}));

// Aqui, importamos o repository mockado, o service real e os erros esperados.
const eventoRepository = require('../repositories/eventoRepository');
const eventoService = require('../services/eventoService');
const { BadRequestError, NotFoundError } = require('../errors/AppError');

// Aqui, definimos um evento base valido para reaproveitar nos cenarios de teste.
const mockEvento = {
    id: 1,
    nome: 'Workshop SQL e Banco de Dados',
    data_inicio: '2026-06-15T09:00:00.000Z',
    data_fim: '2026-06-15T12:00:00.000Z',
    tipo: 'Workshop',
    descricao: 'Workshop pratico sobre SQL e modelagem relacional.',
    local: 'Lab Pulse Mais',
    vagas: 40,
    criado_em: '2026-05-26T10:00:00.000Z',
    atualizado_em: '2026-05-26T10:00:00.000Z'
};

// Rastreabilidade (Art 11): RF015 | RN08 | CT-EV-01..18
describe('EventoService [RF015 | RN08 | CT-EV-01..18]', () => {
    // Aqui, limpamos chamadas e estados dos mocks antes de cada teste.
    beforeEach(() => jest.clearAllMocks());

    // ------------------------------------------------------------------ criar
    describe('criar', () => {

        it('retorna o evento criado quando os dados sao validos', async () => {
            eventoRepository.criar.mockResolvedValue(mockEvento);

            const resultado = await eventoService.criar({ ...mockEvento });

            expect(resultado).toEqual(mockEvento);
            expect(eventoRepository.criar).toHaveBeenCalledTimes(1);
        });

        it('lanca BadRequestError quando campos obrigatorios estao ausentes', async () => {
            await expect(
                eventoService.criar({ descricao: 'Sem nome, data_inicio e tipo' })
            ).rejects.toThrow(BadRequestError);
        });

        it('lanca BadRequestError quando apenas nome esta ausente', async () => {
            await expect(
                eventoService.criar({ data_inicio: mockEvento.data_inicio, tipo: 'Workshop' })
            ).rejects.toThrow(BadRequestError);
        });

        it('lanca BadRequestError quando apenas data_inicio esta ausente', async () => {
            await expect(
                eventoService.criar({ nome: 'Evento Teste', tipo: 'Workshop' })
            ).rejects.toThrow(BadRequestError);
        });

        it('lanca BadRequestError quando apenas tipo esta ausente', async () => {
            await expect(
                eventoService.criar({ nome: 'Evento Teste', data_inicio: mockEvento.data_inicio })
            ).rejects.toThrow(BadRequestError);
        });

        it('lanca BadRequestError quando nome esta vazio', async () => {
            await expect(
                eventoService.criar({
                    nome: '   ',
                    data_inicio: mockEvento.data_inicio,
                    tipo: 'Workshop'
                })
            ).rejects.toThrow(BadRequestError);
        });

        it('lanca BadRequestError quando tipo e invalido', async () => {
            await expect(
                eventoService.criar({
                    nome: 'Evento Teste',
                    data_inicio: mockEvento.data_inicio,
                    tipo: 'Invalido'
                })
            ).rejects.toThrow(BadRequestError);
        });

        it('aceita todos os tipos validos', async () => {
            // Aqui, garantimos que a lista de tipos aceita pelo service continua documentada no teste.
            const tiposValidos = [
                'Eventos_Tech',
                'Pulse_Mais',
                'Encontro_Rede',
                'Workshop',
                'Palestra',
                'Outro'
            ];

            for (const tipo of tiposValidos) {
                eventoRepository.criar.mockResolvedValue({ ...mockEvento, tipo });

                const resultado = await eventoService.criar({
                    nome: 'Evento Teste',
                    data_inicio: mockEvento.data_inicio,
                    tipo
                });

                expect(resultado.tipo).toBe(tipo);
            }
        });

        it('lanca BadRequestError quando data_inicio e invalida', async () => {
            await expect(
                eventoService.criar({
                    nome: 'Evento Teste',
                    data_inicio: 'data-invalida',
                    tipo: 'Workshop'
                })
            ).rejects.toThrow(BadRequestError);
        });

        it('lanca BadRequestError quando data_fim e invalida', async () => {
            await expect(
                eventoService.criar({
                    nome: 'Evento Teste',
                    data_inicio: mockEvento.data_inicio,
                    data_fim: 'data-invalida',
                    tipo: 'Workshop'
                })
            ).rejects.toThrow(BadRequestError);
        });

        it('lanca BadRequestError quando data_fim e anterior a data_inicio', async () => {
            await expect(
                eventoService.criar({
                    nome: 'Evento Teste',
                    data_inicio: '2026-06-15T12:00:00.000Z',
                    data_fim: '2026-06-15T09:00:00.000Z',
                    tipo: 'Workshop'
                })
            ).rejects.toThrow(BadRequestError);
        });

        it('aceita data_fim igual a data_inicio', async () => {
            eventoRepository.criar.mockResolvedValue({
                ...mockEvento,
                data_inicio: '2026-06-15T09:00:00.000Z',
                data_fim: '2026-06-15T09:00:00.000Z'
            });

            const resultado = await eventoService.criar({
                nome: 'Evento Teste',
                data_inicio: '2026-06-15T09:00:00.000Z',
                data_fim: '2026-06-15T09:00:00.000Z',
                tipo: 'Workshop'
            });

            expect(resultado).toBeDefined();
        });

        it('lanca BadRequestError quando vagas e negativa', async () => {
            await expect(
                eventoService.criar({
                    nome: 'Evento Teste',
                    data_inicio: mockEvento.data_inicio,
                    tipo: 'Workshop',
                    vagas: -1
                })
            ).rejects.toThrow(BadRequestError);
        });

        it('lanca BadRequestError quando vagas nao e inteiro', async () => {
            await expect(
                eventoService.criar({
                    nome: 'Evento Teste',
                    data_inicio: mockEvento.data_inicio,
                    tipo: 'Workshop',
                    vagas: 10.5
                })
            ).rejects.toThrow(BadRequestError);
        });

        it('converte vagas string numerica para numero antes de passar ao repositorio', async () => {
            eventoRepository.criar.mockResolvedValue({ ...mockEvento, vagas: 25 });

            await eventoService.criar({
                nome: 'Evento Teste',
                data_inicio: mockEvento.data_inicio,
                tipo: 'Workshop',
                vagas: '25'
            });

            expect(eventoRepository.criar).toHaveBeenCalledWith(
                expect.objectContaining({ vagas: 25 })
            );
        });
    });

    // -------------------------------------------------------------- listarTodos
    describe('listarTodos', () => {

        it('retorna lista sem filtros', async () => {
            eventoRepository.listarTodos.mockResolvedValue([mockEvento]);

            const resultado = await eventoService.listarTodos();

            expect(resultado).toHaveLength(1);
            expect(resultado[0]).toEqual(mockEvento);
        });

        it('retorna lista vazia quando nenhum evento corresponde ao filtro', async () => {
            eventoRepository.listarTodos.mockResolvedValue([]);

            const resultado = await eventoService.listarTodos({ tipo: 'Palestra' });

            expect(resultado).toHaveLength(0);
        });

        it('permite filtro por tipo valido', async () => {
            eventoRepository.listarTodos.mockResolvedValue([mockEvento]);

            await eventoService.listarTodos({ tipo: 'Workshop' });

            expect(eventoRepository.listarTodos).toHaveBeenCalledWith(
                expect.objectContaining({ tipo: 'Workshop' })
            );
        });

        it('repassa filtros textuais ao repositorio', async () => {
            eventoRepository.listarTodos.mockResolvedValue([mockEvento]);

            await eventoService.listarTodos({ nome: 'SQL', local: 'Lab' });

            expect(eventoRepository.listarTodos).toHaveBeenCalledWith(
                expect.objectContaining({ nome: 'SQL', local: 'Lab' })
            );
        });

        it('lanca BadRequestError quando tipo do filtro e invalido', async () => {
            await expect(
                eventoService.listarTodos({ tipo: 'Invalido' })
            ).rejects.toThrow(BadRequestError);
        });

        it('lanca BadRequestError quando data_inicio do filtro e invalida', async () => {
            await expect(
                eventoService.listarTodos({ data_inicio: 'data-invalida' })
            ).rejects.toThrow(BadRequestError);
        });

        it('lanca BadRequestError quando data_fim do filtro e invalida', async () => {
            await expect(
                eventoService.listarTodos({ data_fim: 'data-invalida' })
            ).rejects.toThrow(BadRequestError);
        });

        it('lanca BadRequestError quando periodo do filtro e invalido', async () => {
            await expect(
                eventoService.listarTodos({
                    data_inicio: '2026-06-15T12:00:00.000Z',
                    data_fim: '2026-06-15T09:00:00.000Z'
                })
            ).rejects.toThrow(BadRequestError);
        });
    });

    // --------------------------------------------------------------- buscarPorId
    describe('buscarPorId', () => {

        it('retorna o evento quando o ID existe', async () => {
            eventoRepository.buscarPorId.mockResolvedValue(mockEvento);

            const resultado = await eventoService.buscarPorId(1);

            expect(resultado).toEqual(mockEvento);
        });

        it('lanca NotFoundError quando o ID nao existe', async () => {
            eventoRepository.buscarPorId.mockResolvedValue(null);

            await expect(eventoService.buscarPorId(999)).rejects.toThrow(NotFoundError);
        });
    });

    // ---------------------------------------------------------------- atualizar
    describe('atualizar', () => {

        it('retorna o evento atualizado quando os dados sao validos', async () => {
            const atualizado = { ...mockEvento, nome: 'Workshop Atualizado' };
            eventoRepository.buscarPorId.mockResolvedValue(mockEvento);
            eventoRepository.atualizar.mockResolvedValue(atualizado);

            const resultado = await eventoService.atualizar(1, {
                nome: 'Workshop Atualizado'
            });

            expect(resultado.nome).toBe('Workshop Atualizado');
        });

        it('lanca NotFoundError ao tentar atualizar ID inexistente', async () => {
            eventoRepository.buscarPorId.mockResolvedValue(null);

            await expect(
                eventoService.atualizar(999, { nome: 'Novo nome' })
            ).rejects.toThrow(NotFoundError);
        });

        it('lanca BadRequestError quando atualizacao nao possui campos validos', async () => {
            eventoRepository.buscarPorId.mockResolvedValue(mockEvento);
            eventoRepository.atualizar.mockResolvedValue(null);

            await expect(
                eventoService.atualizar(1, { campo_inexistente: 'valor' })
            ).rejects.toThrow(BadRequestError);
        });

        it('lanca BadRequestError quando tipo invalido e enviado na atualizacao', async () => {
            eventoRepository.buscarPorId.mockResolvedValue(mockEvento);

            await expect(
                eventoService.atualizar(1, { tipo: 'Invalido' })
            ).rejects.toThrow(BadRequestError);
        });

        it('lanca BadRequestError quando nome vazio e enviado na atualizacao', async () => {
            eventoRepository.buscarPorId.mockResolvedValue(mockEvento);

            await expect(
                eventoService.atualizar(1, { nome: '   ' })
            ).rejects.toThrow(BadRequestError);
        });

        it('lanca BadRequestError quando data_inicio invalida e enviada na atualizacao', async () => {
            eventoRepository.buscarPorId.mockResolvedValue(mockEvento);

            await expect(
                eventoService.atualizar(1, { data_inicio: 'data-invalida' })
            ).rejects.toThrow(BadRequestError);
        });

        it('lanca BadRequestError quando data_fim anterior a data_inicio e enviada na atualizacao', async () => {
            eventoRepository.buscarPorId.mockResolvedValue(mockEvento);

            await expect(
                eventoService.atualizar(1, {
                    data_inicio: '2026-06-15T12:00:00.000Z',
                    data_fim: '2026-06-15T09:00:00.000Z'
                })
            ).rejects.toThrow(BadRequestError);
        });

        it('converte vagas string numerica antes de atualizar', async () => {
            eventoRepository.buscarPorId.mockResolvedValue(mockEvento);
            eventoRepository.atualizar.mockResolvedValue({ ...mockEvento, vagas: 15 });

            await eventoService.atualizar(1, { vagas: '15' });

            expect(eventoRepository.atualizar).toHaveBeenCalledWith(
                1,
                expect.objectContaining({ vagas: 15 })
            );
        });
    });

    // ---------------------------------------------------------------- excluir
    describe('excluir', () => {

        it('exclui o evento quando o ID existe', async () => {
            eventoRepository.buscarPorId.mockResolvedValue(mockEvento);
            eventoRepository.excluir.mockResolvedValue({ id: 1 });

            await expect(eventoService.excluir(1)).resolves.not.toThrow();
            expect(eventoRepository.excluir).toHaveBeenCalledWith(1);
        });

        it('lanca NotFoundError ao tentar excluir ID inexistente', async () => {
            eventoRepository.buscarPorId.mockResolvedValue(null);

            await expect(eventoService.excluir(999)).rejects.toThrow(NotFoundError);
        });
    });
});
