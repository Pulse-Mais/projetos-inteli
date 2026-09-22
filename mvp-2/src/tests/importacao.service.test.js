// src/tests/importacao.service.test.js

jest.mock('../database/db', () => ({
    pool: { query: jest.fn(), connect: jest.fn() }
}));

const { pool } = require('../database/db');
const importacaoService = require('../services/importacaoService');
const { BadRequestError } = require('../errors/AppError');

// Helper: monta buffer CSV a partir de um cabecalho + linhas
function csvBuffer(linhas) {
    return Buffer.from(linhas.join('\n'), 'utf-8');
}

const CABECALHO = 'jovem_id,data_aula,tipo_presenca,programa_id,observacao';

// Rastreabilidade (Art 11): RF012 (importacao CSV de frequencia — COD-03)
describe('ImportacaoService [RF012]', () => {
    beforeEach(() => jest.clearAllMocks());

    // ------------------------------------------------------------------ previewCsv
    describe('previewCsv', () => {

        it('lanca BadRequestError quando buffer e vazio', async () => {
            await expect(importacaoService.previewCsv(Buffer.alloc(0)))
                .rejects.toThrow(BadRequestError);
        });

        it('lanca BadRequestError quando buffer e nulo', async () => {
            await expect(importacaoService.previewCsv(null))
                .rejects.toThrow(BadRequestError);
        });

        it('lanca BadRequestError quando CSV nao contem dados (so cabecalho)', async () => {
            await expect(importacaoService.previewCsv(csvBuffer([CABECALHO])))
                .rejects.toThrow(BadRequestError);
        });

        it('classifica linha valida em "validos"', async () => {
            const buffer = csvBuffer([
                CABECALHO,
                '10,2026-06-01,Presencial,3,Sem observacao'
            ]);

            const resultado = await importacaoService.previewCsv(buffer);

            expect(resultado.total).toBe(1);
            expect(resultado.validos).toHaveLength(1);
            expect(resultado.invalidos).toHaveLength(0);
            expect(resultado.validos[0]).toMatchObject({
                linha: 2,
                jovem_id: 10,
                data_aula: '2026-06-01',
                tipo_presenca: 'Presencial',
                programa_id: 3,
                observacao: 'Sem observacao'
            });
        });

        it('classifica linha com campo obrigatorio ausente em "invalidos"', async () => {
            const buffer = csvBuffer([
                CABECALHO,
                ',2026-06-01,Presencial,,'
            ]);

            const resultado = await importacaoService.previewCsv(buffer);

            expect(resultado.invalidos).toHaveLength(1);
            expect(resultado.invalidos[0].erros.some(e => e.includes('jovem_id'))).toBe(true);
        });

        it('classifica linha com tipo_presenca invalido em "invalidos"', async () => {
            const buffer = csvBuffer([
                CABECALHO,
                '10,2026-06-01,Faltou,,'
            ]);

            const resultado = await importacaoService.previewCsv(buffer);

            expect(resultado.invalidos).toHaveLength(1);
            expect(resultado.invalidos[0].erros.some(e => e.includes('tipo_presenca'))).toBe(true);
        });

        it('classifica linha com jovem_id nao numerico em "invalidos"', async () => {
            const buffer = csvBuffer([
                CABECALHO,
                'abc,2026-06-01,Presencial,,'
            ]);

            const resultado = await importacaoService.previewCsv(buffer);

            expect(resultado.invalidos).toHaveLength(1);
            expect(resultado.invalidos[0].erros.some(e => e.includes('numérico'))).toBe(true);
        });

        it('separa validos e invalidos no mesmo arquivo', async () => {
            const buffer = csvBuffer([
                CABECALHO,
                '10,2026-06-01,Presencial,,',
                ',2026-06-02,Gravacao,,',
                '20,2026-06-03,Ausente,,'
            ]);

            const resultado = await importacaoService.previewCsv(buffer);

            expect(resultado.total).toBe(3);
            expect(resultado.validos).toHaveLength(2);
            expect(resultado.invalidos).toHaveLength(1);
        });

        it('aceita todos os tipos de presenca validos', async () => {
            const buffer = csvBuffer([
                CABECALHO,
                '10,2026-06-01,Presencial,,',
                '11,2026-06-01,Gravacao,,',
                '12,2026-06-01,Ausente,,'
            ]);

            const resultado = await importacaoService.previewCsv(buffer);

            expect(resultado.validos).toHaveLength(3);
        });
    });

    // ----------------------------------------------------------- confirmarImportacao
    describe('confirmarImportacao', () => {

        it('lanca BadRequestError quando registros nao e array', async () => {
            await expect(importacaoService.confirmarImportacao(null, 1))
                .rejects.toThrow(BadRequestError);
        });

        it('lanca BadRequestError quando lista de registros e vazia', async () => {
            await expect(importacaoService.confirmarImportacao([], 1))
                .rejects.toThrow(BadRequestError);
        });

        it('insere registros em transacao e retorna total importado', async () => {
            const client = {
                query: jest.fn().mockResolvedValue({}),
                release: jest.fn()
            };
            pool.connect.mockResolvedValue(client);

            const registros = [
                { jovem_id: 10, data_aula: '2026-06-01', tipo_presenca: 'Presencial', programa_id: 3, observacao: null },
                { jovem_id: 20, data_aula: '2026-06-02', tipo_presenca: 'Ausente', programa_id: null, observacao: 'x' }
            ];

            const resultado = await importacaoService.confirmarImportacao(registros, 99);

            expect(resultado).toEqual({ importados: 2 });
            expect(client.query).toHaveBeenCalledWith('BEGIN');
            expect(client.query).toHaveBeenCalledWith('COMMIT');
            // 1 BEGIN + 2 INSERT + 1 COMMIT
            expect(client.query).toHaveBeenCalledTimes(4);
            expect(client.release).toHaveBeenCalledTimes(1);
        });

        it('faz ROLLBACK e propaga erro quando o INSERT falha', async () => {
            const erroDb = new Error('falha no insert');
            const client = {
                query: jest.fn()
                    .mockResolvedValueOnce({})          // BEGIN
                    .mockRejectedValueOnce(erroDb),     // INSERT
                release: jest.fn()
            };
            pool.connect.mockResolvedValue(client);

            const registros = [
                { jovem_id: 10, data_aula: '2026-06-01', tipo_presenca: 'Presencial' }
            ];

            await expect(importacaoService.confirmarImportacao(registros, 99))
                .rejects.toThrow('falha no insert');

            expect(client.query).toHaveBeenCalledWith('ROLLBACK');
            expect(client.release).toHaveBeenCalledTimes(1);
        });
    });
});
