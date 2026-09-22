// src/tests/participacaoEvento.service.test.js

// Aqui, mockamos o repository principal para isolar as regras do service.
jest.mock('../repositories/participacaoEventoRepository', () => ({
    criar: jest.fn(),
    buscarPorId: jest.fn(),
    buscarPorJovemEEvento: jest.fn(),
    listarTodos: jest.fn(),
    listarPorJovem: jest.fn(),
    listarPorEvento: jest.fn(),
    atualizar: jest.fn(),
    excluir: jest.fn()
}));

// Aqui, mockamos os repositories auxiliares usados para validar existencia.
jest.mock('../repositories/jovemRepository', () => ({
    buscarPorId: jest.fn()
}));

jest.mock('../repositories/eventoRepository', () => ({
    buscarPorId: jest.fn()
}));

// Aqui, importamos os repositories mockados, o service real e os erros esperados.
const participacaoEventoRepository = require('../repositories/participacaoEventoRepository');
const jovemRepository = require('../repositories/jovemRepository');
const eventoRepository = require('../repositories/eventoRepository');
const participacaoEventoService = require('../services/participacaoEventoService');
const { BadRequestError, ConflictError, NotFoundError } = require('../errors/AppError');

// Aqui, definimos fixtures simples para simular jovem, evento e participacao.
const mockJovem = {
    id: 1,
    nome: 'Jovem Teste Participacao Evento',
    email: 'jovem.participacao@teste.com'
};

const mockEvento = {
    id: 2,
    nome: 'Workshop SQL e Banco de Dados',
    data_inicio: '2026-06-15T09:00:00.000Z',
    tipo: 'Workshop'
};

const mockParticipacao = {
    id: 3,
    jovem_id: 1,
    evento_id: 2,
    presente: true,
    criado_em: '2026-06-15T10:00:00.000Z'
};

// Aqui, simulamos o retorno das listagens com JOIN do repository.
const mockParticipacaoComDetalhes = {
    ...mockParticipacao,
    jovem_nome: mockJovem.nome,
    jovem_email: mockJovem.email,
    evento_nome: mockEvento.nome,
    evento_data_inicio: mockEvento.data_inicio,
    evento_tipo: mockEvento.tipo,
    evento_local: 'Lab Pulse Mais'
};

// Rastreabilidade (Art 11): RF015 | RN08 + unicidade jovem×evento | CT-PE-01..17
describe('ParticipacaoEventoService [RF015 | RN08 | CT-PE-01..17]', () => {
    // Aqui, limpamos chamadas e estados dos mocks antes de cada teste.
    beforeEach(() => jest.clearAllMocks());

    // ------------------------------------------------------------------ criar
    describe('criar', () => {

        it('retorna a participacao criada quando jovem e evento existem', async () => {
            // Aqui, configuramos o fluxo feliz: jovem existe, evento existe e nao ha duplicidade.
            jovemRepository.buscarPorId.mockResolvedValue(mockJovem);
            eventoRepository.buscarPorId.mockResolvedValue(mockEvento);
            participacaoEventoRepository.buscarPorJovemEEvento.mockResolvedValue(null);
            participacaoEventoRepository.criar.mockResolvedValue(mockParticipacao);

            const resultado = await participacaoEventoService.criar({
                jovem_id: 1,
                evento_id: 2,
                presente: true
            });

            expect(resultado).toEqual(mockParticipacao);
            expect(participacaoEventoRepository.criar).toHaveBeenCalledWith(
                expect.objectContaining({ jovem_id: 1, evento_id: 2, presente: true })
            );
        });

        it('lanca BadRequestError quando campos obrigatorios estao ausentes', async () => {
            await expect(
                participacaoEventoService.criar({ presente: true })
            ).rejects.toThrow(BadRequestError);
        });

        it('lanca BadRequestError quando apenas jovem_id esta ausente', async () => {
            await expect(
                participacaoEventoService.criar({ evento_id: 2 })
            ).rejects.toThrow(BadRequestError);
        });

        it('lanca BadRequestError quando apenas evento_id esta ausente', async () => {
            await expect(
                participacaoEventoService.criar({ jovem_id: 1 })
            ).rejects.toThrow(BadRequestError);
        });

        it('lanca BadRequestError quando jovem_id e invalido', async () => {
            await expect(
                participacaoEventoService.criar({ jovem_id: 'abc', evento_id: 2 })
            ).rejects.toThrow(BadRequestError);
        });

        it('lanca BadRequestError quando evento_id e invalido', async () => {
            await expect(
                participacaoEventoService.criar({ jovem_id: 1, evento_id: 0 })
            ).rejects.toThrow(BadRequestError);
        });

        it('[CT-PE-05] converte IDs string numericos para numero antes de passar ao repositorio', async () => {
            jovemRepository.buscarPorId.mockResolvedValue(mockJovem);
            eventoRepository.buscarPorId.mockResolvedValue(mockEvento);
            participacaoEventoRepository.buscarPorJovemEEvento.mockResolvedValue(null);
            participacaoEventoRepository.criar.mockResolvedValue(mockParticipacao);

            await participacaoEventoService.criar({
                jovem_id: '1',
                evento_id: '2'
            });

            expect(jovemRepository.buscarPorId).toHaveBeenCalledWith(1);
            expect(eventoRepository.buscarPorId).toHaveBeenCalledWith(2);
            expect(participacaoEventoRepository.criar).toHaveBeenCalledWith(
                expect.objectContaining({ jovem_id: 1, evento_id: 2 })
            );
        });

        it('[CT-PE-04] normaliza presente string "true" para boolean true', async () => {
            jovemRepository.buscarPorId.mockResolvedValue(mockJovem);
            eventoRepository.buscarPorId.mockResolvedValue(mockEvento);
            participacaoEventoRepository.buscarPorJovemEEvento.mockResolvedValue(null);
            participacaoEventoRepository.criar.mockResolvedValue(mockParticipacao);

            await participacaoEventoService.criar({
                jovem_id: 1,
                evento_id: 2,
                presente: 'true'
            });

            expect(participacaoEventoRepository.criar).toHaveBeenCalledWith(
                expect.objectContaining({ presente: true })
            );
        });

        it('normaliza presente string "false" para boolean false', async () => {
            jovemRepository.buscarPorId.mockResolvedValue(mockJovem);
            eventoRepository.buscarPorId.mockResolvedValue(mockEvento);
            participacaoEventoRepository.buscarPorJovemEEvento.mockResolvedValue(null);
            participacaoEventoRepository.criar.mockResolvedValue({ ...mockParticipacao, presente: false });

            await participacaoEventoService.criar({
                jovem_id: 1,
                evento_id: 2,
                presente: 'false'
            });

            expect(participacaoEventoRepository.criar).toHaveBeenCalledWith(
                expect.objectContaining({ presente: false })
            );
        });

        it('lanca BadRequestError quando presente nao e booleano', async () => {
            await expect(
                participacaoEventoService.criar({
                    jovem_id: 1,
                    evento_id: 2,
                    presente: 'sim'
                })
            ).rejects.toThrow(BadRequestError);
        });

        it('[CT-PE-02] lanca NotFoundError quando o jovem nao existe', async () => {
            jovemRepository.buscarPorId.mockResolvedValue(null);

            await expect(
                participacaoEventoService.criar({ jovem_id: 999, evento_id: 2 })
            ).rejects.toThrow(NotFoundError);
        });

        it('[CT-PE-03] lanca NotFoundError quando o evento nao existe', async () => {
            jovemRepository.buscarPorId.mockResolvedValue(mockJovem);
            eventoRepository.buscarPorId.mockResolvedValue(null);

            await expect(
                participacaoEventoService.criar({ jovem_id: 1, evento_id: 999 })
            ).rejects.toThrow(NotFoundError);
        });

        it('[CT-PE-01] lanca ConflictError quando ja existe participacao para o jovem no evento', async () => {
            jovemRepository.buscarPorId.mockResolvedValue(mockJovem);
            eventoRepository.buscarPorId.mockResolvedValue(mockEvento);
            participacaoEventoRepository.buscarPorJovemEEvento.mockResolvedValue(mockParticipacao);

            await expect(
                participacaoEventoService.criar({ jovem_id: 1, evento_id: 2 })
            ).rejects.toThrow(ConflictError);
        });
    });

    // --------------------------------------------------------------- buscarPorId
    describe('buscarPorId', () => {

        it('retorna a participacao quando o ID existe', async () => {
            participacaoEventoRepository.buscarPorId.mockResolvedValue(mockParticipacao);

            const resultado = await participacaoEventoService.buscarPorId(3);

            expect(resultado).toEqual(mockParticipacao);
            expect(participacaoEventoRepository.buscarPorId).toHaveBeenCalledWith(3);
        });

        it('lanca BadRequestError quando o ID e invalido', async () => {
            await expect(
                participacaoEventoService.buscarPorId('abc')
            ).rejects.toThrow(BadRequestError);
        });

        it('lanca NotFoundError quando o ID nao existe', async () => {
            participacaoEventoRepository.buscarPorId.mockResolvedValue(null);

            await expect(participacaoEventoService.buscarPorId(999)).rejects.toThrow(NotFoundError);
        });
    });

    // -------------------------------------------------------------- listarTodos
    describe('listarTodos', () => {

        it('retorna lista sem filtros', async () => {
            participacaoEventoRepository.listarTodos.mockResolvedValue([mockParticipacao]);

            const resultado = await participacaoEventoService.listarTodos();

            expect(resultado).toHaveLength(1);
            expect(resultado[0]).toEqual(mockParticipacao);
        });

        it('retorna lista vazia quando nenhum registro corresponde ao filtro', async () => {
            participacaoEventoRepository.listarTodos.mockResolvedValue([]);

            const resultado = await participacaoEventoService.listarTodos({ jovem_id: 999 });

            expect(resultado).toHaveLength(0);
        });

        it('converte jovem_id e evento_id string para numero antes de passar ao repositorio', async () => {
            participacaoEventoRepository.listarTodos.mockResolvedValue([mockParticipacao]);

            await participacaoEventoService.listarTodos({
                jovem_id: '1',
                evento_id: '2'
            });

            expect(participacaoEventoRepository.listarTodos).toHaveBeenCalledWith(
                expect.objectContaining({ jovem_id: 1, evento_id: 2 })
            );
        });

        it('converte presente string "false" para boolean false antes de passar ao repositorio', async () => {
            participacaoEventoRepository.listarTodos.mockResolvedValue([]);

            await participacaoEventoService.listarTodos({ presente: 'false' });

            expect(participacaoEventoRepository.listarTodos).toHaveBeenCalledWith(
                expect.objectContaining({ presente: false })
            );
        });

        it('repassa presente boolean true ao repositorio sem conversao indevida', async () => {
            participacaoEventoRepository.listarTodos.mockResolvedValue([mockParticipacao]);

            await participacaoEventoService.listarTodos({ presente: true });

            expect(participacaoEventoRepository.listarTodos).toHaveBeenCalledWith(
                expect.objectContaining({ presente: true })
            );
        });

        it('lanca BadRequestError quando jovem_id do filtro e invalido', async () => {
            await expect(
                participacaoEventoService.listarTodos({ jovem_id: 'abc' })
            ).rejects.toThrow(BadRequestError);
        });

        it('lanca BadRequestError quando evento_id do filtro e invalido', async () => {
            await expect(
                participacaoEventoService.listarTodos({ evento_id: -1 })
            ).rejects.toThrow(BadRequestError);
        });

        it('lanca BadRequestError quando presente do filtro nao e booleano', async () => {
            await expect(
                participacaoEventoService.listarTodos({ presente: 'sim' })
            ).rejects.toThrow(BadRequestError);
        });
    });

    // ------------------------------------------------------------- listarPorJovem
    describe('listarPorJovem', () => {

        it('lista historico de eventos de um jovem existente', async () => {
            jovemRepository.buscarPorId.mockResolvedValue(mockJovem);
            participacaoEventoRepository.listarPorJovem.mockResolvedValue([mockParticipacaoComDetalhes]);

            const resultado = await participacaoEventoService.listarPorJovem(1);

            expect(resultado).toHaveLength(1);
            expect(resultado[0].jovem_id).toBe(1);
            expect(resultado[0].evento_nome).toBe(mockEvento.nome);
            expect(participacaoEventoRepository.listarPorJovem).toHaveBeenCalledWith(1);
        });

        it('converte jovem_id string para numero antes de listar', async () => {
            jovemRepository.buscarPorId.mockResolvedValue(mockJovem);
            participacaoEventoRepository.listarPorJovem.mockResolvedValue([]);

            await participacaoEventoService.listarPorJovem('1');

            expect(jovemRepository.buscarPorId).toHaveBeenCalledWith(1);
            expect(participacaoEventoRepository.listarPorJovem).toHaveBeenCalledWith(1);
        });

        it('lanca BadRequestError quando jovem_id e invalido', async () => {
            await expect(
                participacaoEventoService.listarPorJovem('abc')
            ).rejects.toThrow(BadRequestError);
        });

        it('[CT-PE-06] lanca NotFoundError quando o jovem nao existe', async () => {
            jovemRepository.buscarPorId.mockResolvedValue(null);

            await expect(participacaoEventoService.listarPorJovem(999)).rejects.toThrow(NotFoundError);
        });
    });

    // ------------------------------------------------------------ listarPorEvento
    describe('listarPorEvento', () => {

        it('lista participantes de um evento existente', async () => {
            eventoRepository.buscarPorId.mockResolvedValue(mockEvento);
            participacaoEventoRepository.listarPorEvento.mockResolvedValue([mockParticipacaoComDetalhes]);

            const resultado = await participacaoEventoService.listarPorEvento(2);

            expect(resultado).toHaveLength(1);
            expect(resultado[0].evento_id).toBe(2);
            expect(resultado[0].jovem_nome).toBe(mockJovem.nome);
            expect(participacaoEventoRepository.listarPorEvento).toHaveBeenCalledWith(2);
        });

        it('converte evento_id string para numero antes de listar', async () => {
            eventoRepository.buscarPorId.mockResolvedValue(mockEvento);
            participacaoEventoRepository.listarPorEvento.mockResolvedValue([]);

            await participacaoEventoService.listarPorEvento('2');

            expect(eventoRepository.buscarPorId).toHaveBeenCalledWith(2);
            expect(participacaoEventoRepository.listarPorEvento).toHaveBeenCalledWith(2);
        });

        it('lanca BadRequestError quando evento_id e invalido', async () => {
            await expect(
                participacaoEventoService.listarPorEvento('abc')
            ).rejects.toThrow(BadRequestError);
        });

        it('lanca NotFoundError quando o evento nao existe', async () => {
            eventoRepository.buscarPorId.mockResolvedValue(null);

            await expect(participacaoEventoService.listarPorEvento(999)).rejects.toThrow(NotFoundError);
        });
    });

    // ---------------------------------------------------------------- atualizar
    describe('atualizar', () => {

        it('atualiza o status de presenca da participacao', async () => {
            participacaoEventoRepository.buscarPorId.mockResolvedValue(mockParticipacao);
            participacaoEventoRepository.atualizar.mockResolvedValue({
                ...mockParticipacao,
                presente: false
            });

            const resultado = await participacaoEventoService.atualizar(3, {
                presente: 'false'
            });

            expect(resultado.id).toBe(3);
            expect(resultado.presente).toBe(false);
            expect(participacaoEventoRepository.atualizar).toHaveBeenCalledWith(
                3,
                expect.objectContaining({ presente: false })
            );
        });

        it('lanca BadRequestError quando o ID e invalido', async () => {
            await expect(
                participacaoEventoService.atualizar('abc', { presente: true })
            ).rejects.toThrow(BadRequestError);
        });

        it('lanca NotFoundError quando a participacao nao existe', async () => {
            participacaoEventoRepository.buscarPorId.mockResolvedValue(null);

            await expect(
                participacaoEventoService.atualizar(999, { presente: true })
            ).rejects.toThrow(NotFoundError);
        });

        it('lanca BadRequestError quando presente nao e booleano', async () => {
            participacaoEventoRepository.buscarPorId.mockResolvedValue(mockParticipacao);

            await expect(
                participacaoEventoService.atualizar(3, { presente: 'sim' })
            ).rejects.toThrow(BadRequestError);
        });

        it('lanca BadRequestError quando atualizacao nao possui campos validos', async () => {
            participacaoEventoRepository.buscarPorId.mockResolvedValue(mockParticipacao);
            participacaoEventoRepository.atualizar.mockResolvedValue(null);

            await expect(
                participacaoEventoService.atualizar(3, { observacao: 'Sem presenca' })
            ).rejects.toThrow(BadRequestError);
        });
    });

    // ---------------------------------------------------------------- excluir
    describe('excluir', () => {

        it('exclui participacao existente', async () => {
            participacaoEventoRepository.buscarPorId.mockResolvedValue(mockParticipacao);
            participacaoEventoRepository.excluir.mockResolvedValue({ id: 3 });

            await expect(participacaoEventoService.excluir(3)).resolves.not.toThrow();
            expect(participacaoEventoRepository.excluir).toHaveBeenCalledWith(3);
        });

        it('lanca BadRequestError quando o ID e invalido', async () => {
            await expect(participacaoEventoService.excluir('abc')).rejects.toThrow(BadRequestError);
        });

        it('lanca NotFoundError ao tentar excluir ID inexistente', async () => {
            participacaoEventoRepository.buscarPorId.mockResolvedValue(null);

            await expect(participacaoEventoService.excluir(999)).rejects.toThrow(NotFoundError);
        });
    });
});
