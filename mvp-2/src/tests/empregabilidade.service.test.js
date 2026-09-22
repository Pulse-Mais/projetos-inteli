// src/tests/empregabilidade.service.test.js

// Aqui, mockamos explicitamente o repository para testar apenas as regras do service.
jest.mock('../repositories/empregabilidadeRepository', () => ({
    criar: jest.fn(),
    buscarPorId: jest.fn(),
    listarTodos: jest.fn(),
    atualizar: jest.fn(),
    arquivar: jest.fn()
}));

// Aqui, importamos o repository mockado, o service real e os erros esperados.
const empregabilidadeRepository = require('../repositories/empregabilidadeRepository');
const empregabilidadeService = require('../services/empregabilidadeService');
const { BadRequestError, NotFoundError } = require('../errors/AppError');

// Aqui, definimos um registro base valido para reaproveitar nos cenarios de teste.
const mockEmpregabilidade = {
    id: 1,
    jovem_id: 1,
    empresa: 'Tech Corp',
    cargo: 'Desenvolvedor Junior',
    data_admissao: '2025-01-15',
    data_saida: null,
    faixa_salarial: '1_a_2_SM',
    tipo_vinculo: 'CLT',
    modalidade: 'Hibrido',
    carga_horaria_semanal: '30h/sem',
    area_tech: true,
    ativo: true,
    criado_em: '2025-01-15T10:00:00.000Z',
    atualizado_em: '2025-01-15T10:00:00.000Z',
};

// Rastreabilidade (Art 11): RF010 | RN08,RN15 | CT-EM-01..22
// (catálogo WAD §3.9 rotula CT-EM como RF007 por engano — RTM canônica é RF010)
describe('EmpregabilidadeService [RF010 | RN08,RN15 | CT-EM-01..22]', () => {
    // Aqui, limpamos chamadas e estados dos mocks antes de cada teste.
    beforeEach(() => jest.clearAllMocks());

    // ------------------------------------------------------------------ criar
    describe('criar', () => {

        it('retorna o registro criado quando os dados sao validos', async () => {
            empregabilidadeRepository.criar.mockResolvedValue(mockEmpregabilidade);

            const resultado = await empregabilidadeService.criar({ ...mockEmpregabilidade });

            expect(resultado).toEqual(mockEmpregabilidade);
            expect(empregabilidadeRepository.criar).toHaveBeenCalledTimes(1);
        });

        it('lanca BadRequestError quando campos obrigatorios estao ausentes', async () => {
            await expect(
                empregabilidadeService.criar({ cargo: 'Dev' })
            ).rejects.toThrow(BadRequestError);
        });

        it('lanca BadRequestError quando apenas jovem_id esta ausente', async () => {
            await expect(
                empregabilidadeService.criar({
                    ...mockEmpregabilidade,
                    jovem_id: undefined
                })
            ).rejects.toThrow(BadRequestError);
        });

        it('lanca BadRequestError quando apenas empresa esta ausente', async () => {
            await expect(
                empregabilidadeService.criar({
                    ...mockEmpregabilidade,
                    empresa: ''
                })
            ).rejects.toThrow(BadRequestError);
        });

        it('lanca BadRequestError quando faixa_salarial e invalida', async () => {
            await expect(
                empregabilidadeService.criar({ ...mockEmpregabilidade, faixa_salarial: 'Invalida' })
            ).rejects.toThrow(BadRequestError);
        });

        it('[CT-EM-01] lanca BadRequestError quando tipo_vinculo e invalido', async () => {
            await expect(
                empregabilidadeService.criar({ ...mockEmpregabilidade, tipo_vinculo: 'Invalido' })
            ).rejects.toThrow(BadRequestError);
        });

        it('lanca BadRequestError quando modalidade e invalida', async () => {
            await expect(
                empregabilidadeService.criar({ ...mockEmpregabilidade, modalidade: 'Invalida' })
            ).rejects.toThrow(BadRequestError);
        });

        it('aceita todas as faixas salariais validas', async () => {
            // Aqui, garantimos que as faixas aceitas pelo service continuam documentadas no teste.
            const faixasValidas = [
                'Ate_1_SM',
                '1_a_2_SM',
                '2_a_3_SM',
                '3_a_5_SM',
                'Acima_5_SM',
                'Nao_informado'
            ];

            for (const faixa_salarial of faixasValidas) {
                empregabilidadeRepository.criar.mockResolvedValue({ ...mockEmpregabilidade, faixa_salarial });

                const resultado = await empregabilidadeService.criar({
                    ...mockEmpregabilidade,
                    faixa_salarial
                });

                expect(resultado.faixa_salarial).toBe(faixa_salarial);
            }
        });

        it('[CT-EM-02] aceita todos os tipos de vinculo validos', async () => {
            const tiposValidos = [
                'CLT',
                'Estagio',
                'PJ',
                'Freelancer',
                'Informal',
                'Jovem_Aprendiz',
                'Outro'
            ];

            for (const tipo_vinculo of tiposValidos) {
                empregabilidadeRepository.criar.mockResolvedValue({ ...mockEmpregabilidade, tipo_vinculo });

                const resultado = await empregabilidadeService.criar({
                    ...mockEmpregabilidade,
                    tipo_vinculo
                });

                expect(resultado.tipo_vinculo).toBe(tipo_vinculo);
            }
        });

        it('aceita todas as modalidades validas', async () => {
            const modalidadesValidas = ['Presencial', 'Remoto', 'Hibrido'];

            for (const modalidade of modalidadesValidas) {
                empregabilidadeRepository.criar.mockResolvedValue({ ...mockEmpregabilidade, modalidade });

                const resultado = await empregabilidadeService.criar({
                    ...mockEmpregabilidade,
                    modalidade
                });

                expect(resultado.modalidade).toBe(modalidade);
            }
        });

        it('cria registro com campos opcionais preenchidos', async () => {
            empregabilidadeRepository.criar.mockResolvedValue(mockEmpregabilidade);

            const resultado = await empregabilidadeService.criar({ ...mockEmpregabilidade });

            expect(resultado.modalidade).toBe('Hibrido');
            expect(resultado.carga_horaria_semanal).toBe('30h/sem');
            expect(resultado.area_tech).toBe(true);
        });

        it('[CT-EM-03] aceita enums nulos porque sao campos opcionais', async () => {
            const registroSemEnums = {
                ...mockEmpregabilidade,
                faixa_salarial: null,
                tipo_vinculo: null,
                modalidade: null
            };
            empregabilidadeRepository.criar.mockResolvedValue(registroSemEnums);

            const resultado = await empregabilidadeService.criar(registroSemEnums);

            expect(resultado.faixa_salarial).toBeNull();
            expect(resultado.tipo_vinculo).toBeNull();
            expect(resultado.modalidade).toBeNull();
        });
    });

    // -------------------------------------------------------------- listarTodos
    describe('listarTodos', () => {

        it('retorna lista sem filtros', async () => {
            empregabilidadeRepository.listarTodos.mockResolvedValue([mockEmpregabilidade]);

            const resultado = await empregabilidadeService.listarTodos();

            expect(resultado).toHaveLength(1);
            expect(resultado[0]).toEqual(mockEmpregabilidade);
        });

        it('retorna lista vazia quando nenhum registro corresponde ao filtro', async () => {
            empregabilidadeRepository.listarTodos.mockResolvedValue([]);

            const resultado = await empregabilidadeService.listarTodos({ jovem_id: 999 });

            expect(resultado).toHaveLength(0);
        });

        it('lanca BadRequestError quando tipo_vinculo do filtro e invalido', async () => {
            await expect(
                empregabilidadeService.listarTodos({ tipo_vinculo: 'Invalido' })
            ).rejects.toThrow(BadRequestError);
        });

        it('[CT-EM-04] converte jovem_id string para numero antes de passar ao repositorio', async () => {
            empregabilidadeRepository.listarTodos.mockResolvedValue([]);

            await empregabilidadeService.listarTodos({ jovem_id: '1' });

            expect(empregabilidadeRepository.listarTodos).toHaveBeenCalledWith(
                expect.objectContaining({ jovem_id: 1 })
            );
        });

        it('nao altera jovem_id quando ja e numero', async () => {
            empregabilidadeRepository.listarTodos.mockResolvedValue([mockEmpregabilidade]);

            await empregabilidadeService.listarTodos({ jovem_id: 1 });

            expect(empregabilidadeRepository.listarTodos).toHaveBeenCalledWith(
                expect.objectContaining({ jovem_id: 1 })
            );
        });

        it('converte ativo string "true" para boolean true antes de passar ao repositorio', async () => {
            empregabilidadeRepository.listarTodos.mockResolvedValue([]);

            await empregabilidadeService.listarTodos({ ativo: 'true' });

            expect(empregabilidadeRepository.listarTodos).toHaveBeenCalledWith(
                expect.objectContaining({ ativo: true })
            );
        });

        it('converte ativo string "false" para boolean false antes de passar ao repositorio', async () => {
            empregabilidadeRepository.listarTodos.mockResolvedValue([]);

            await empregabilidadeService.listarTodos({ ativo: 'false' });

            expect(empregabilidadeRepository.listarTodos).toHaveBeenCalledWith(
                expect.objectContaining({ ativo: false })
            );
        });

        it('repassa ativo boolean true ao repositorio sem conversao indevida', async () => {
            empregabilidadeRepository.listarTodos.mockResolvedValue([mockEmpregabilidade]);

            await empregabilidadeService.listarTodos({ ativo: true });

            expect(empregabilidadeRepository.listarTodos).toHaveBeenCalledWith(
                expect.objectContaining({ ativo: true })
            );
        });

        it('filtra por tipo_vinculo valido', async () => {
            empregabilidadeRepository.listarTodos.mockResolvedValue([mockEmpregabilidade]);

            const resultado = await empregabilidadeService.listarTodos({ tipo_vinculo: 'CLT' });

            expect(resultado).toEqual([mockEmpregabilidade]);
            expect(empregabilidadeRepository.listarTodos).toHaveBeenCalledWith(
                expect.objectContaining({ tipo_vinculo: 'CLT' })
            );
        });
    });

    // --------------------------------------------------------------- buscarPorId
    describe('buscarPorId', () => {

        it('retorna o registro quando o ID existe', async () => {
            empregabilidadeRepository.buscarPorId.mockResolvedValue(mockEmpregabilidade);

            const resultado = await empregabilidadeService.buscarPorId(1);

            expect(resultado).toEqual(mockEmpregabilidade);
            expect(empregabilidadeRepository.buscarPorId).toHaveBeenCalledWith(1);
        });

        it('lanca NotFoundError quando o ID nao existe', async () => {
            empregabilidadeRepository.buscarPorId.mockResolvedValue(null);

            await expect(empregabilidadeService.buscarPorId(999)).rejects.toThrow(NotFoundError);
        });
    });

    // ---------------------------------------------------------------- atualizar
    describe('atualizar', () => {

        it('retorna o registro atualizado quando os dados sao validos', async () => {
            const atualizado = { ...mockEmpregabilidade, cargo: 'Desenvolvedor Pleno' };
            empregabilidadeRepository.buscarPorId.mockResolvedValue(mockEmpregabilidade);
            empregabilidadeRepository.atualizar.mockResolvedValue(atualizado);

            const resultado = await empregabilidadeService.atualizar(1, { cargo: 'Desenvolvedor Pleno' });

            expect(resultado.cargo).toBe('Desenvolvedor Pleno');
        });

        it('lanca NotFoundError ao tentar atualizar ID inexistente', async () => {
            empregabilidadeRepository.buscarPorId.mockResolvedValue(null);

            await expect(
                empregabilidadeService.atualizar(999, { cargo: 'Dev' })
            ).rejects.toThrow(NotFoundError);
        });

        it('lanca BadRequestError quando faixa_salarial enviada e invalida', async () => {
            empregabilidadeRepository.buscarPorId.mockResolvedValue(mockEmpregabilidade);

            await expect(
                empregabilidadeService.atualizar(1, { faixa_salarial: 'Invalida' })
            ).rejects.toThrow(BadRequestError);
        });

        it('lanca BadRequestError quando tipo_vinculo enviado e invalido', async () => {
            empregabilidadeRepository.buscarPorId.mockResolvedValue(mockEmpregabilidade);

            await expect(
                empregabilidadeService.atualizar(1, { tipo_vinculo: 'Invalido' })
            ).rejects.toThrow(BadRequestError);
        });

        it('lanca BadRequestError quando modalidade enviada e invalida', async () => {
            empregabilidadeRepository.buscarPorId.mockResolvedValue(mockEmpregabilidade);

            await expect(
                empregabilidadeService.atualizar(1, { modalidade: 'Invalida' })
            ).rejects.toThrow(BadRequestError);
        });

        it('aceita enums nulos na atualizacao', async () => {
            empregabilidadeRepository.buscarPorId.mockResolvedValue(mockEmpregabilidade);
            empregabilidadeRepository.atualizar.mockResolvedValue({
                ...mockEmpregabilidade,
                faixa_salarial: null,
                tipo_vinculo: null,
                modalidade: null
            });

            const resultado = await empregabilidadeService.atualizar(1, {
                faixa_salarial: null,
                tipo_vinculo: null,
                modalidade: null
            });

            expect(resultado.faixa_salarial).toBeNull();
            expect(resultado.tipo_vinculo).toBeNull();
            expect(resultado.modalidade).toBeNull();
        });

        it('atualiza modalidade e carga_horaria_semanal corretamente', async () => {
            empregabilidadeRepository.buscarPorId.mockResolvedValue(mockEmpregabilidade);
            empregabilidadeRepository.atualizar.mockResolvedValue({
                ...mockEmpregabilidade,
                modalidade: 'Remoto',
                carga_horaria_semanal: '40h/sem'
            });

            const resultado = await empregabilidadeService.atualizar(1, {
                modalidade: 'Remoto',
                carga_horaria_semanal: '40h/sem'
            });

            expect(resultado.modalidade).toBe('Remoto');
            expect(resultado.carga_horaria_semanal).toBe('40h/sem');
        });

        it('atualiza area_tech para false corretamente', async () => {
            empregabilidadeRepository.buscarPorId.mockResolvedValue(mockEmpregabilidade);
            empregabilidadeRepository.atualizar.mockResolvedValue({
                ...mockEmpregabilidade,
                area_tech: false
            });

            const resultado = await empregabilidadeService.atualizar(1, { area_tech: false });

            expect(resultado.area_tech).toBe(false);
        });

        it('retorna null quando repository nao encontra campos validos para atualizar', async () => {
            empregabilidadeRepository.buscarPorId.mockResolvedValue(mockEmpregabilidade);
            empregabilidadeRepository.atualizar.mockResolvedValue(null);

            const resultado = await empregabilidadeService.atualizar(1, { campo_inexistente: 'valor' });

            expect(resultado).toBeNull();
        });
    });

    // ---------------------------------------------------------------- arquivar
    describe('arquivar', () => {

        it('persiste ativo false e retorna o registro atualizado', async () => {
            empregabilidadeRepository.buscarPorId.mockResolvedValue(mockEmpregabilidade);
            empregabilidadeRepository.arquivar.mockResolvedValue({ ...mockEmpregabilidade, ativo: false });

            const resultado = await empregabilidadeService.arquivar(1);

            expect(resultado.ativo).toBe(false);
            expect(empregabilidadeRepository.arquivar).toHaveBeenCalledWith(1);
        });

        it('lanca NotFoundError ao tentar arquivar ID inexistente', async () => {
            empregabilidadeRepository.buscarPorId.mockResolvedValue(null);

            await expect(empregabilidadeService.arquivar(999)).rejects.toThrow(NotFoundError);
        });
    });
});
