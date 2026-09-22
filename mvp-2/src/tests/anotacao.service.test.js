// src/tests/anotacao.service.test.js

// Aqui, mockamos explicitamente o repository para testar apenas as regras do service.
jest.mock('../repositories/anotacaoRepository', () => ({
    criar: jest.fn(),
    buscarPorId: jest.fn(),
    listarTodos: jest.fn(),
    atualizar: jest.fn(),
    excluir: jest.fn()
}));
jest.mock('../repositories/jovemRepository');
jest.mock('../repositories/usuarioRepository');

// Aqui, importamos o repository mockado, o service real e os erros esperados.
const anotacaoRepository = require('../repositories/anotacaoRepository');
const jovemRepository = require('../repositories/jovemRepository');
const usuarioRepository = require('../repositories/usuarioRepository');
const anotacaoService = require('../services/anotacaoService');
const { BadRequestError, NotFoundError } = require('../errors/AppError');

// Aqui, definimos uma anotacao base valida para reaproveitar nos cenarios de teste.
const mockAnotacao = {
    id: 1,
    jovem_id: 1,
    autor_id: 1,
    categoria: 'Mentoria',
    tipo_alerta: 'Geral',
    texto: 'Jovem demonstrou evolucao significativa.',
    criado_em: '2026-05-20T10:00:00.000Z',
};

// Rastreabilidade (Art 11): RF006 | RN08,RN13,RN14 | CT-AN-01..24
describe('AnotacaoService [RF006 | RN08,RN13,RN14 | CT-AN-01..24]', () => {
    // Aqui, limpamos chamadas e estados dos mocks antes de cada teste.
    beforeEach(() => jest.clearAllMocks());

    // ------------------------------------------------------------------ criar
    describe('criar', () => {

        it('retorna a anotacao criada quando os dados sao validos', async () => {
            jovemRepository.buscarPorId.mockResolvedValue({ id: 1 });
            usuarioRepository.buscarPorId.mockResolvedValue({ id: 1 });
            anotacaoRepository.criar.mockResolvedValue(mockAnotacao);

            const resultado = await anotacaoService.criar({ ...mockAnotacao });

            expect(resultado).toEqual(mockAnotacao);
            expect(anotacaoRepository.criar).toHaveBeenCalledTimes(1);
        });

        it('lanca BadRequestError quando campos obrigatorios estao ausentes', async () => {
            await expect(
                anotacaoService.criar({ jovem_id: 1 })
            ).rejects.toThrow(BadRequestError);
        });

        it('lanca BadRequestError quando apenas jovem_id esta ausente', async () => {
            await expect(
                anotacaoService.criar({
                    ...mockAnotacao,
                    jovem_id: undefined
                })
            ).rejects.toThrow(BadRequestError);
        });

        it('lanca BadRequestError quando apenas autor_id esta ausente', async () => {
            await expect(
                anotacaoService.criar({
                    ...mockAnotacao,
                    autor_id: undefined
                })
            ).rejects.toThrow(BadRequestError);
        });

        it('lanca BadRequestError quando apenas categoria esta ausente', async () => {
            await expect(
                anotacaoService.criar({
                    ...mockAnotacao,
                    categoria: ''
                })
            ).rejects.toThrow(BadRequestError);
        });

        it('lanca BadRequestError quando apenas texto esta ausente', async () => {
            await expect(
                anotacaoService.criar({
                    ...mockAnotacao,
                    texto: ''
                })
            ).rejects.toThrow(BadRequestError);
        });

        it('lanca BadRequestError quando categoria e invalida', async () => {
            await expect(
                anotacaoService.criar({ ...mockAnotacao, categoria: 'Invalida' })
            ).rejects.toThrow(BadRequestError);
        });

        it('lanca BadRequestError quando texto e vazio', async () => {
            await expect(
                anotacaoService.criar({ ...mockAnotacao, texto: '   ' })
            ).rejects.toThrow(BadRequestError);
        });

        it('lanca BadRequestError quando tipo_alerta e invalido', async () => {
            await expect(
                anotacaoService.criar({ ...mockAnotacao, tipo_alerta: 'Urgente' })
            ).rejects.toThrow(BadRequestError);
        });

        it('aceita todas as categorias validas', async () => {
            const categoriasValidas = ['Mentoria', 'Atendimento', 'Evolucao_Geral', 'Academico', 'Outro'];

            for (const categoria of categoriasValidas) {
                jovemRepository.buscarPorId.mockResolvedValue({ id: 1 });
                usuarioRepository.buscarPorId.mockResolvedValue({ id: 1 });
                anotacaoRepository.criar.mockResolvedValue({ ...mockAnotacao, categoria });

                const resultado = await anotacaoService.criar({ ...mockAnotacao, categoria });
                expect(resultado.categoria).toBe(categoria);
            }
        });

        it('aceita todos os tipos de alerta validos', async () => {
            const tiposValidos = ['Alerta', 'Conquista', 'Geral'];

            for (const tipo_alerta of tiposValidos) {
                jovemRepository.buscarPorId.mockResolvedValue({ id: 1 });
                usuarioRepository.buscarPorId.mockResolvedValue({ id: 1 });
                anotacaoRepository.criar.mockResolvedValue({ ...mockAnotacao, tipo_alerta });

                const resultado = await anotacaoService.criar({ ...mockAnotacao, tipo_alerta });
                expect(resultado.tipo_alerta).toBe(tipo_alerta);
            }
        });

        it('cria anotacao sem tipo_alerta quando o campo nao e enviado', async () => {
            jovemRepository.buscarPorId.mockResolvedValue({ id: 1 });
            usuarioRepository.buscarPorId.mockResolvedValue({ id: 1 });
            const anotacaoSemTipo = { ...mockAnotacao, tipo_alerta: undefined };
            anotacaoRepository.criar.mockResolvedValue(anotacaoSemTipo);

            const resultado = await anotacaoService.criar(anotacaoSemTipo);
            expect(resultado.tipo_alerta).toBeUndefined();
        });

        it('lanca NotFoundError quando jovem_id nao existe', async () => {
            jovemRepository.buscarPorId.mockResolvedValue(null);

            await expect(
                anotacaoService.criar({ ...mockAnotacao })
            ).rejects.toThrow(NotFoundError);
            expect(anotacaoRepository.criar).not.toHaveBeenCalled();
        });

        it('lanca NotFoundError quando autor_id nao existe', async () => {
            jovemRepository.buscarPorId.mockResolvedValue({ id: 1 });
            usuarioRepository.buscarPorId.mockResolvedValue(null);

            await expect(
                anotacaoService.criar({ ...mockAnotacao })
            ).rejects.toThrow(NotFoundError);
            expect(anotacaoRepository.criar).not.toHaveBeenCalled();
        });
    });

    // -------------------------------------------------------------- listarTodos
    describe('listarTodos', () => {

        it('retorna lista sem filtros', async () => {
            anotacaoRepository.listarTodos.mockResolvedValue([mockAnotacao]);

            const resultado = await anotacaoService.listarTodos();

            expect(resultado).toHaveLength(1);
            expect(resultado[0]).toEqual(mockAnotacao);
        });

        it('retorna lista vazia quando nenhuma anotacao corresponde ao filtro', async () => {
            anotacaoRepository.listarTodos.mockResolvedValue([]);

            const resultado = await anotacaoService.listarTodos({ jovem_id: 999 });

            expect(resultado).toHaveLength(0);
        });

        it('lanca BadRequestError quando categoria do filtro e invalida', async () => {
            await expect(
                anotacaoService.listarTodos({ categoria: 'Invalida' })
            ).rejects.toThrow(BadRequestError);
        });

        it('lanca BadRequestError quando tipo_alerta do filtro e invalido', async () => {
            await expect(
                anotacaoService.listarTodos({ tipo_alerta: 'Urgente' })
            ).rejects.toThrow(BadRequestError);
        });

        it('converte jovem_id string para numero antes de passar ao repositorio', async () => {
            anotacaoRepository.listarTodos.mockResolvedValue([]);

            await anotacaoService.listarTodos({ jovem_id: '1' });

            expect(anotacaoRepository.listarTodos).toHaveBeenCalledWith(
                expect.objectContaining({ jovem_id: 1 })
            );
        });

        it('nao altera jovem_id quando ja e numero', async () => {
            anotacaoRepository.listarTodos.mockResolvedValue([mockAnotacao]);

            await anotacaoService.listarTodos({ jovem_id: 1 });

            expect(anotacaoRepository.listarTodos).toHaveBeenCalledWith(
                expect.objectContaining({ jovem_id: 1 })
            );
        });

        it('filtra por categoria valida', async () => {
            anotacaoRepository.listarTodos.mockResolvedValue([mockAnotacao]);

            const resultado = await anotacaoService.listarTodos({ categoria: 'Mentoria' });

            expect(resultado).toEqual([mockAnotacao]);
            expect(anotacaoRepository.listarTodos).toHaveBeenCalledWith(
                expect.objectContaining({ categoria: 'Mentoria' })
            );
        });

        it('filtra por tipo_alerta valido', async () => {
            anotacaoRepository.listarTodos.mockResolvedValue([mockAnotacao]);

            const resultado = await anotacaoService.listarTodos({ tipo_alerta: 'Geral' });

            expect(resultado).toEqual([mockAnotacao]);
            expect(anotacaoRepository.listarTodos).toHaveBeenCalledWith(
                expect.objectContaining({ tipo_alerta: 'Geral' })
            );
        });
    });

    // --------------------------------------------------------------- buscarPorId
    describe('buscarPorId', () => {

        it('retorna a anotacao quando o ID existe', async () => {
            anotacaoRepository.buscarPorId.mockResolvedValue(mockAnotacao);

            const resultado = await anotacaoService.buscarPorId(1);

            expect(resultado).toEqual(mockAnotacao);
            expect(anotacaoRepository.buscarPorId).toHaveBeenCalledWith(1);
        });

        it('lanca NotFoundError quando o ID nao existe', async () => {
            anotacaoRepository.buscarPorId.mockResolvedValue(null);

            await expect(anotacaoService.buscarPorId(999)).rejects.toThrow(NotFoundError);
        });
    });

    // ---------------------------------------------------------------- atualizar
    describe('atualizar', () => {

        it('retorna anotacao atualizada quando dados sao validos', async () => {
            anotacaoRepository.buscarPorId.mockResolvedValue(mockAnotacao);
            anotacaoRepository.atualizar.mockResolvedValue({ ...mockAnotacao, texto: 'Texto atualizado.' });

            const resultado = await anotacaoService.atualizar(1, { texto: 'Texto atualizado.' });

            expect(resultado.texto).toBe('Texto atualizado.');
        });

        it('lanca NotFoundError quando o ID nao existe', async () => {
            anotacaoRepository.buscarPorId.mockResolvedValue(null);

            await expect(
                anotacaoService.atualizar(999, { texto: 'Qualquer' })
            ).rejects.toThrow(NotFoundError);
        });

        it('lanca BadRequestError quando categoria enviada no PUT e invalida', async () => {
            anotacaoRepository.buscarPorId.mockResolvedValue(mockAnotacao);

            await expect(
                anotacaoService.atualizar(1, { categoria: 'Invalida' })
            ).rejects.toThrow(BadRequestError);
        });

        it('lanca BadRequestError quando tipo_alerta enviado no PUT e invalido', async () => {
            anotacaoRepository.buscarPorId.mockResolvedValue(mockAnotacao);

            await expect(
                anotacaoService.atualizar(1, { tipo_alerta: 'Urgente' })
            ).rejects.toThrow(BadRequestError);
        });

        it('lanca BadRequestError quando texto enviado no PUT e vazio', async () => {
            anotacaoRepository.buscarPorId.mockResolvedValue(mockAnotacao);

            await expect(
                anotacaoService.atualizar(1, { texto: '   ' })
            ).rejects.toThrow(BadRequestError);
        });

        it('aceita todas as categorias validas na atualizacao', async () => {
            const categoriasValidas = ['Mentoria', 'Atendimento', 'Evolucao_Geral', 'Academico', 'Outro'];

            for (const categoria of categoriasValidas) {
                anotacaoRepository.buscarPorId.mockResolvedValue(mockAnotacao);
                anotacaoRepository.atualizar.mockResolvedValue({ ...mockAnotacao, categoria });

                const resultado = await anotacaoService.atualizar(1, { categoria });

                expect(resultado.categoria).toBe(categoria);
            }
        });

        it('atualiza tipo_alerta para Conquista corretamente', async () => {
            anotacaoRepository.buscarPorId.mockResolvedValue(mockAnotacao);
            anotacaoRepository.atualizar.mockResolvedValue({ ...mockAnotacao, tipo_alerta: 'Conquista' });

            const resultado = await anotacaoService.atualizar(1, { tipo_alerta: 'Conquista' });

            expect(resultado.tipo_alerta).toBe('Conquista');
        });

        it('retorna null quando repository nao encontra campos validos para atualizar', async () => {
            anotacaoRepository.buscarPorId.mockResolvedValue(mockAnotacao);
            anotacaoRepository.atualizar.mockResolvedValue(null);

            const resultado = await anotacaoService.atualizar(1, { campo_inexistente: 'valor' });

            expect(resultado).toBeNull();
        });
    });

    // ---------------------------------------------------------------- excluir
    describe('excluir', () => {

        it('exclui a anotacao quando o ID existe', async () => {
            anotacaoRepository.buscarPorId.mockResolvedValue(mockAnotacao);
            anotacaoRepository.excluir.mockResolvedValue({ id: 1 });

            await expect(anotacaoService.excluir(1)).resolves.not.toThrow();
            expect(anotacaoRepository.excluir).toHaveBeenCalledWith(1);
        });

        it('lanca NotFoundError ao tentar excluir ID inexistente', async () => {
            anotacaoRepository.buscarPorId.mockResolvedValue(null);

            await expect(anotacaoService.excluir(999)).rejects.toThrow(NotFoundError);
        });
    });
});
