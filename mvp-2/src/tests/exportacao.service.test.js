// src/tests/exportacao.service.test.js

jest.mock('../database/db', () => ({
    pool: { query: jest.fn() }
}));
jest.mock('../repositories/eventoRepository', () => ({
    listarTodos: jest.fn()
}));

const { pool } = require('../database/db');
const eventoRepository = require('../repositories/eventoRepository');
const exportacaoService = require('../services/exportacaoService');

const mockJovemRow = {
    id: 1,
    nome: 'Ana Souza',
    cpf: '12345678901',
    data_nascimento: '2005-03-10',
    email: 'ana@exemplo.com',
    telefone: '11999990000',
    status_jornada: 'Conectado',
    status_empregabilidade: 'Empregado',
    bairro: 'Centro',
    cidade: 'São Paulo',
    estado: 'SP',
    criado_em: '2026-06-01T10:00:00.000Z',
    programa: 'Programa Tech',
    turma: '1'
};

const mockEvento = {
    id: 1,
    nome: 'Workshop de Carreira',
    descricao: 'Orientação profissional.',
    local: 'Auditório',
    data_inicio: '2026-07-01T13:00:00.000Z',
    data_fim: '2026-07-01T17:00:00.000Z'
};

// Rastreabilidade (Art 11): RF029 (exportacao CSV de jovens + iCal de eventos — COD-03)
describe('ExportacaoService [RF029]', () => {
    beforeEach(() => jest.clearAllMocks());

    // ------------------------------------------------------------- exportarJovens
    describe('exportarJovens', () => {

        it('retorna CSV com cabecalho e dados do jovem', async () => {
            pool.query.mockResolvedValue({ rows: [mockJovemRow] });

            const csv = await exportacaoService.exportarJovens();

            expect(typeof csv).toBe('string');
            expect(csv).toContain('Nome');
            expect(csv).toContain('Ana Souza');
            expect(csv).toContain('ana@exemplo.com');
            expect(pool.query).toHaveBeenCalledTimes(1);
        });

        it('formata data de nascimento e cadastro em pt-BR', async () => {
            pool.query.mockResolvedValue({ rows: [mockJovemRow] });

            const csv = await exportacaoService.exportarJovens();

            // toLocaleDateString pt-BR usa formato dd/mm/aaaa
            expect(csv).toMatch(/\d{2}\/\d{2}\/\d{4}/);
        });

        it('gera apenas o cabecalho quando nao ha jovens', async () => {
            pool.query.mockResolvedValue({ rows: [] });

            const csv = await exportacaoService.exportarJovens();

            expect(csv).toContain('Nome');
            expect(csv).not.toContain('Ana Souza');
        });

        it('preenche campos nulos com string vazia', async () => {
            const rowSemOpcionais = {
                ...mockJovemRow,
                telefone: null,
                status_empregabilidade: null,
                bairro: null,
                cidade: null,
                estado: null,
                programa: null,
                turma: null
            };
            pool.query.mockResolvedValue({ rows: [rowSemOpcionais] });

            const csv = await exportacaoService.exportarJovens();

            expect(csv).toContain('Ana Souza');
            expect(csv).not.toContain('null');
        });
    });

    // --------------------------------------------------------- exportarEventosIcal
    describe('exportarEventosIcal', () => {

        it('retorna calendario iCal com o evento', async () => {
            eventoRepository.listarTodos.mockResolvedValue([mockEvento]);

            const ics = await exportacaoService.exportarEventosIcal();

            expect(typeof ics).toBe('string');
            expect(ics).toContain('BEGIN:VCALENDAR');
            expect(ics).toContain('BEGIN:VEVENT');
            expect(ics).toContain('Workshop de Carreira');
            expect(eventoRepository.listarTodos).toHaveBeenCalledTimes(1);
        });

        it('usa data_inicio como fim quando data_fim e ausente', async () => {
            eventoRepository.listarTodos.mockResolvedValue([
                { ...mockEvento, data_fim: null }
            ]);

            const ics = await exportacaoService.exportarEventosIcal();

            expect(ics).toContain('BEGIN:VEVENT');
            expect(ics).toContain('Workshop de Carreira');
        });

        it('retorna calendario vazio quando nao ha eventos', async () => {
            eventoRepository.listarTodos.mockResolvedValue([]);

            const ics = await exportacaoService.exportarEventosIcal();

            expect(ics).toContain('BEGIN:VCALENDAR');
            expect(ics).not.toContain('BEGIN:VEVENT');
        });
    });
});
