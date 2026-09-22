// src/tests/dashboard.service.test.js

jest.mock('../repositories/dashboardRepository');
jest.mock('../helpers/indicadorRisco');

const dashboardRepository = require('../repositories/dashboardRepository');
const dashboardService    = require('../services/dashboardService');
const { calcularRiscoEvasao } = require('../helpers/indicadorRisco');

const mockKPIsRaw = {
    jovens_ativos:       10,
    jovens_empregados:   5,
    jovens_com_bolsa:    3,
    evasaoRaw:           { evadidos: 2, total: 20 },
    jovens_conectados:   8,
    computadores_doados: 0,
};

function setupMocks(overrides = {}) {
    const dados = { ...mockKPIsRaw, ...overrides };
    dashboardRepository.contarJovensAtivos.mockResolvedValue(dados.jovens_ativos);
    dashboardRepository.contarJovensEmpregados.mockResolvedValue(dados.jovens_empregados);
    dashboardRepository.contarJovensComBolsa.mockResolvedValue(dados.jovens_com_bolsa);
    dashboardRepository.calcularIndiceEvasao.mockResolvedValue(dados.evasaoRaw);
    dashboardRepository.contarJovensConectados.mockResolvedValue(dados.jovens_conectados);
    dashboardRepository.contarComputadoresDoados.mockResolvedValue(dados.computadores_doados);
}

// Rastreabilidade (Art 11): RF009 | RN08,RN16,RN17 | CT-DS-01..04
describe('DashboardService [RF009 | RN08,RN16,RN17 | CT-DS-01..04]', () => {
    beforeEach(() => jest.clearAllMocks());

    // ---------------------------------------------------------------- obterKPIs
    describe('obterKPIs', () => {

        it('retorna payload com todos os seis KPIs', async () => {
            setupMocks();
            const resultado = await dashboardService.obterKPIs();

            expect(resultado).toHaveProperty('jovens_ativos');
            expect(resultado).toHaveProperty('jovens_empregados');
            expect(resultado).toHaveProperty('jovens_com_bolsa');
            expect(resultado).toHaveProperty('evasao');
            expect(resultado).toHaveProperty('jovens_conectados');
            expect(resultado).toHaveProperty('computadores_doados');
        });

        it('calcula taxa de evasão corretamente (2 evadidos de 20 = 10%)', async () => {
            setupMocks();
            const resultado = await dashboardService.obterKPIs();

            expect(resultado.evasao).toEqual({ evadidos: 2, total: 20, taxa: 10 });
        });

        it('retorna taxa 0 quando total de matrículas é zero (proteção divisão por zero)', async () => {
            setupMocks({ evasaoRaw: { evadidos: 0, total: 0 } });
            const resultado = await dashboardService.obterKPIs();

            expect(resultado.evasao.taxa).toBe(0);
        });

        it('retorna taxa 0 quando evadidos é 0 mesmo com total positivo', async () => {
            setupMocks({ evasaoRaw: { evadidos: 0, total: 10 } });
            const resultado = await dashboardService.obterKPIs();

            expect(resultado.evasao.taxa).toBe(0);
        });

        it('formata taxa com até duas casas decimais (1/3 = 33.33)', async () => {
            setupMocks({ evasaoRaw: { evadidos: 1, total: 3 } });
            const resultado = await dashboardService.obterKPIs();

            expect(resultado.evasao.taxa).toBe(33.33);
        });

        it('retorna 100% de evasão quando todos evadidos', async () => {
            setupMocks({ evasaoRaw: { evadidos: 5, total: 5 } });
            const resultado = await dashboardService.obterKPIs();

            expect(resultado.evasao.taxa).toBe(100);
        });

        it('chama todos os seis métodos do repositório exatamente uma vez', async () => {
            setupMocks();
            await dashboardService.obterKPIs();

            expect(dashboardRepository.contarJovensAtivos).toHaveBeenCalledTimes(1);
            expect(dashboardRepository.contarJovensEmpregados).toHaveBeenCalledTimes(1);
            expect(dashboardRepository.contarJovensComBolsa).toHaveBeenCalledTimes(1);
            expect(dashboardRepository.calcularIndiceEvasao).toHaveBeenCalledTimes(1);
            expect(dashboardRepository.contarJovensConectados).toHaveBeenCalledTimes(1);
            expect(dashboardRepository.contarComputadoresDoados).toHaveBeenCalledTimes(1);
        });

        it('retorna os valores corretos de cada KPI', async () => {
            setupMocks();
            const resultado = await dashboardService.obterKPIs();

            expect(resultado.jovens_ativos).toBe(10);
            expect(resultado.jovens_empregados).toBe(5);
            expect(resultado.jovens_com_bolsa).toBe(3);
            expect(resultado.jovens_conectados).toBe(8);
            expect(resultado.computadores_doados).toBe(0);
        });

        it('reflete corretamente KPIs zerados', async () => {
            setupMocks({
                jovens_ativos: 0,
                jovens_empregados: 0,
                jovens_com_bolsa: 0,
                jovens_conectados: 0,
                computadores_doados: 0,
                evasaoRaw: { evadidos: 0, total: 0 }
            });
            const resultado = await dashboardService.obterKPIs();

            expect(resultado.jovens_ativos).toBe(0);
            expect(resultado.evasao.taxa).toBe(0);
        });
    });

    // ------------------------------------------------------- obterJovensEmRisco
    describe('obterJovensEmRisco', () => {

        const mockJovensRaw = [
            { id: 1, nome: 'Ana',   frequencia_ultimos_30_dias: 40, dias_sem_interacao: 10, atividades_em_atraso: 3 },
            { id: 2, nome: 'Bruno', frequencia_ultimos_30_dias: 90, dias_sem_interacao: 2,  atividades_em_atraso: 0 },
        ];

        it('retorna apenas jovens com em_risco: true', async () => {
            dashboardRepository.buscarJovensEmRisco.mockResolvedValue(mockJovensRaw);
            calcularRiscoEvasao
                .mockReturnValueOnce({ em_risco: true,  fatores: ['sem_interacao'], nivel: 'alto' })
                .mockReturnValueOnce({ em_risco: false, fatores: [],                nivel: 'nenhum' });

            const resultado = await dashboardService.obterJovensEmRisco();

            expect(resultado).toHaveLength(1);
            expect(resultado[0].id).toBe(1);
        });

        it('retorna lista vazia quando nenhum jovem está em risco', async () => {
            dashboardRepository.buscarJovensEmRisco.mockResolvedValue(mockJovensRaw);
            calcularRiscoEvasao.mockReturnValue({ em_risco: false, fatores: [], nivel: 'nenhum' });

            const resultado = await dashboardService.obterJovensEmRisco();

            expect(resultado).toHaveLength(0);
        });

        it('retorna todos os jovens quando todos estão em risco', async () => {
            dashboardRepository.buscarJovensEmRisco.mockResolvedValue(mockJovensRaw);
            calcularRiscoEvasao.mockReturnValue({ em_risco: true, fatores: ['sem_interacao'], nivel: 'alto' });

            const resultado = await dashboardService.obterJovensEmRisco();

            expect(resultado).toHaveLength(2);
        });

        it('formata frequencia_ultimos_30_dias com uma casa decimal', async () => {
            dashboardRepository.buscarJovensEmRisco.mockResolvedValue([
                { id: 1, nome: 'Ana', frequencia_ultimos_30_dias: 66.666, dias_sem_interacao: 5, atividades_em_atraso: 2 },
            ]);
            calcularRiscoEvasao.mockReturnValue({ em_risco: true, fatores: ['atividades_atrasadas'], nivel: 'medio' });

            const resultado = await dashboardService.obterJovensEmRisco();

            expect(resultado[0].frequencia_ultimos_30_dias).toBe(66.7);
        });

        it('trata frequencia_ultimos_30_dias null como 0', async () => {
            dashboardRepository.buscarJovensEmRisco.mockResolvedValue([
                { id: 1, nome: 'Ana', frequencia_ultimos_30_dias: null, dias_sem_interacao: 999, atividades_em_atraso: 0 },
            ]);
            calcularRiscoEvasao.mockReturnValue({ em_risco: true, fatores: ['sem_interacao'], nivel: 'medio' });

            const resultado = await dashboardService.obterJovensEmRisco();

            expect(resultado[0].frequencia_ultimos_30_dias).toBe(0);
        });

        it('inclui o(s) programa(s) do jovem na resposta', async () => {
            dashboardRepository.buscarJovensEmRisco.mockResolvedValue([
                { id: 1, nome: 'Ana', programa: 'Programa A, Programa B', frequencia_ultimos_30_dias: 40, dias_sem_interacao: 10, atividades_em_atraso: 3 },
            ]);
            calcularRiscoEvasao.mockReturnValue({ em_risco: true, fatores: ['sem_interacao'], nivel: 'alto' });

            const resultado = await dashboardService.obterJovensEmRisco();

            expect(resultado[0].programa).toBe('Programa A, Programa B');
        });

        it('expõe programa como null quando o jovem não tem programa', async () => {
            dashboardRepository.buscarJovensEmRisco.mockResolvedValue([
                { id: 1, nome: 'Ana', programa: null, frequencia_ultimos_30_dias: 40, dias_sem_interacao: 10, atividades_em_atraso: 3 },
            ]);
            calcularRiscoEvasao.mockReturnValue({ em_risco: true, fatores: ['sem_interacao'], nivel: 'alto' });

            const resultado = await dashboardService.obterJovensEmRisco();

            expect(resultado[0].programa).toBeNull();
        });

        it('inclui os campos risco, dias_sem_interacao e atividades_em_atraso no retorno', async () => {
            dashboardRepository.buscarJovensEmRisco.mockResolvedValue([
                { id: 1, nome: 'Ana', frequencia_ultimos_30_dias: 50, dias_sem_interacao: 8, atividades_em_atraso: 1 },
            ]);
            calcularRiscoEvasao.mockReturnValue({ em_risco: true, fatores: ['atividades_atrasadas'], nivel: 'medio' });

            const resultado = await dashboardService.obterJovensEmRisco();

            expect(resultado[0]).toHaveProperty('risco');
            expect(resultado[0]).toHaveProperty('dias_sem_interacao');
            expect(resultado[0]).toHaveProperty('atividades_em_atraso');
            expect(resultado[0].risco.em_risco).toBe(true);
        });

        it('chama calcularRiscoEvasao com os dados corretos de cada jovem', async () => {
            dashboardRepository.buscarJovensEmRisco.mockResolvedValue([
                { id: 1, nome: 'Ana', frequencia_ultimos_30_dias: 40, dias_sem_interacao: 10, atividades_em_atraso: 3 },
            ]);
            calcularRiscoEvasao.mockReturnValue({ em_risco: true, fatores: [], nivel: 'alto' });

            await dashboardService.obterJovensEmRisco();

            expect(calcularRiscoEvasao).toHaveBeenCalledWith({
                frequencia_ultimos_30_dias: 40,
                dias_sem_interacao: 10,
                atividades_em_atraso: 3,
                queda_frequencia_pp: 0
            });
        });

        it('retorna lista vazia quando repositório não retorna jovens', async () => {
            dashboardRepository.buscarJovensEmRisco.mockResolvedValue([]);

            const resultado = await dashboardService.obterJovensEmRisco();

            expect(resultado).toHaveLength(0);
            expect(calcularRiscoEvasao).not.toHaveBeenCalled();
        });
    });
});
