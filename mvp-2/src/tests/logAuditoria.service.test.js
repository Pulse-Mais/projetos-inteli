// src/tests/logAuditoria.test.js

jest.mock('../repositories/logAuditoriaRepository');

const logAuditoriaRepository = require('../repositories/logAuditoriaRepository');
const logAuditoriaService    = require('../services/logAuditoriaService');
const { BadRequestError, NotFoundError } = require('../errors/AppError');

const mockLog = {
    id:               1,
    usuario_id:       1,
    entidade:         'jovens',
    entidade_id:      42,
    operacao:         'UPDATE',
    dados_anteriores: { nome: 'João Antigo' },
    dados_novos:      { nome: 'João Novo' },
    ip_origem:        '192.168.0.1',
    rota:             '/api/jovens/42',
    metodos_http:     'PUT',
    criado_em:        '2026-05-22T10:00:00.000Z',
};

// Rastreabilidade (Art 11): RF014 (+RF003) | RN11,RN15 | CT-LA-01..11
describe('LogAuditoriaService [RF014,RF003 | RN11,RN15 | CT-LA-01..11]', () => {
    beforeEach(() => jest.clearAllMocks());

    // --------------------------------------------------------------- buscarPorId
    describe('buscarPorId', () => {

        it('retorna o log quando o ID existe', async () => {
            logAuditoriaRepository.buscarPorId.mockResolvedValue(mockLog);

            const resultado = await logAuditoriaService.buscarPorId(1);
            expect(resultado).toEqual(mockLog);
        });

        it('[CT-LA-03][RN15] lança NotFoundError quando o ID não existe', async () => {
            logAuditoriaRepository.buscarPorId.mockResolvedValue(null);

            await expect(logAuditoriaService.buscarPorId(999)).rejects.toThrow(NotFoundError);
        });
    });

    // ---------------------------------------------------------------- listarTodos
    describe('listarTodos', () => {

        it('retorna todos os logs sem filtros', async () => {
            logAuditoriaRepository.listarTodos.mockResolvedValue([mockLog]);

            const resultado = await logAuditoriaService.listarTodos({});
            expect(resultado).toHaveLength(1);
            expect(logAuditoriaRepository.listarTodos).toHaveBeenCalledTimes(1);
        });

        it('converte usuario_id de string para número', async () => {
            logAuditoriaRepository.listarTodos.mockResolvedValue([mockLog]);

            await logAuditoriaService.listarTodos({ usuario_id: '1' });
            expect(logAuditoriaRepository.listarTodos).toHaveBeenCalledWith(
                expect.objectContaining({ usuario_id: 1 })
            );
        });

        it('[CT-LA-01][RN11] lança BadRequestError quando operacao é inválida', async () => {
            await expect(
                logAuditoriaService.listarTodos({ operacao: 'INVALIDA' })
            ).rejects.toThrow(BadRequestError);
        });

        it('passa filtros de data para o repositório', async () => {
            logAuditoriaRepository.listarTodos.mockResolvedValue([]);

            await logAuditoriaService.listarTodos({
                data_inicio: '2026-01-01',
                data_fim:    '2026-12-31'
            });

            expect(logAuditoriaRepository.listarTodos).toHaveBeenCalledWith(
                expect.objectContaining({
                    data_inicio: '2026-01-01',
                    data_fim:    '2026-12-31'
                })
            );
        });

        it('[CT-LA-02][RN11,RN15] passa filtros de entidade e metodo_http para o repositório', async () => {
            logAuditoriaRepository.listarTodos.mockResolvedValue([]);

            await logAuditoriaService.listarTodos({
                entidade: 'jovens',
                metodo_http: 'GET',
                metodos_http: 'POST'
            });

            expect(logAuditoriaRepository.listarTodos).toHaveBeenCalledWith(
                expect.objectContaining({
                    entidade: 'jovens',
                    metodo_http: 'GET',
                    metodos_http: 'POST'
                })
            );
        });
    });
});
