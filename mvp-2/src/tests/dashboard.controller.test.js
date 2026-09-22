// Aqui, mockamos o service de dashboard para testar somente o comportamento do controller.
jest.mock('../services/dashboardService', () => ({
    obterKPIs: jest.fn(),
    obterJovensEmRisco: jest.fn(),
    obterDashboardMentor: jest.fn(),
    obterDashboardAluno: jest.fn()
}));

// Aqui, mockamos a conexao com o banco para evitar dependencias externas durante os testes.
jest.mock('../database/db', () => ({
    pool: {
        query: jest.fn()
    }
}));

// Aqui, importamos as dependencias utilizadas nos cenarios de teste do controller.
const request = require('supertest');
const dashboardService = require('../services/dashboardService');
const dashboardController = require('../controllers/dashboardController');
const dashboardRoutes = require('../routes/dashboardRoutes');
const { pool } = require('../database/db');
const { BadRequestError, AppError } = require('../errors/AppError');
const { createMockReq, createMockRes } = require('./testHelper');
const {
    createEndpointTestApp,
    createAuthToken,
    mockAuthenticatedUser
} = require('./endpointTestHelper');

// Aqui, definimos o segredo usado para gerar e validar os tokens dos testes HTTP.
process.env.JWT_SECRET = 'segredo-dashboard-controller';

// Aqui, criamos uma aplicacao que monta as rotas reais do dashboard.
const endpointApp = createEndpointTestApp('/api/dashboard', dashboardRoutes);

// Aqui, definimos respostas base reutilizadas nos diferentes cenarios de teste.
const mockKPIs = { total_jovens: 120, em_risco: 8, taxa_empregabilidade: 0.64 };
const mockJovensRisco = [{ id: 1, nome: 'Maria Silva', indice_risco: 0.82 }];

// Aqui, executamos o controller e aguardamos a conclusao das operacoes assincronas.
const executarController = async (controller, req, res, next) => {
    controller(req, res, next);
    await new Promise(setImmediate);
};

// Aqui, agrupamos todos os testes de unidade do controller de dashboard.
// Rastreabilidade (Art 11): RF009 + RF003 (autorização) | RN08,RN16,RN17 | HTTP 200/401/403
describe('DashboardController [RF009,RF003 | RN08,RN16,RN17]', () => {
    let res;
    let next;

    beforeEach(() => {
        res = createMockRes();
        next = jest.fn();
    });

    describe('obterKPIs', () => {
        it('retorna os KPIs consolidados', async () => {
            const req = createMockReq();
            dashboardService.obterKPIs.mockResolvedValue(mockKPIs);

            await executarController(dashboardController.obterKPIs, req, res, next);

            expect(res.json).toHaveBeenCalledWith(mockKPIs);
        });
    });

    describe('jovemEmRisco', () => {
        it('retorna a lista de jovens em risco', async () => {
            const req = createMockReq();
            dashboardService.obterJovensEmRisco.mockResolvedValue(mockJovensRisco);

            await executarController(dashboardController.jovemEmRisco, req, res, next);

            expect(res.json).toHaveBeenCalledWith(mockJovensRisco);
        });
    });

    describe('mentorDashboard', () => {
        it('repassa o id do usuario autenticado ao service', async () => {
            const req = createMockReq({ usuario: { id: 7, perfil: 'Mentor', jovem_id: null } });
            dashboardService.obterDashboardMentor.mockResolvedValue({ mentorias: [] });

            await executarController(dashboardController.mentorDashboard, req, res, next);

            expect(dashboardService.obterDashboardMentor).toHaveBeenCalledWith(7);
        });
    });

    describe('alunoDashboard', () => {
        it('retorna o dashboard quando o aluno acessa o proprio id', async () => {
            const req = createMockReq({
                params: { jovem_id: '5' },
                usuario: { id: 10, perfil: 'Aluno', jovem_id: 5 }
            });
            dashboardService.obterDashboardAluno.mockResolvedValue({ frequencia: [] });

            await executarController(dashboardController.alunoDashboard, req, res, next);

            expect(dashboardService.obterDashboardAluno).toHaveBeenCalledWith(5);
            expect(next).not.toHaveBeenCalled();
        });

        it('encaminha AppError 403 quando o aluno acessa id de outro aluno', async () => {
            const req = createMockReq({
                params: { jovem_id: '99' },
                usuario: { id: 10, perfil: 'Aluno', jovem_id: 5 }
            });

            await executarController(dashboardController.alunoDashboard, req, res, next);

            expect(next).toHaveBeenCalledWith(expect.any(AppError));
            expect(dashboardService.obterDashboardAluno).not.toHaveBeenCalled();
        });

        it('encaminha BadRequestError quando o jovem_id e invalido', async () => {
            const req = createMockReq({
                params: { jovem_id: 'abc' },
                usuario: { id: 1, perfil: 'GestaoGeral', jovem_id: null }
            });

            await executarController(dashboardController.alunoDashboard, req, res, next);

            expect(next).toHaveBeenCalledWith(expect.any(BadRequestError));
        });
    });
});

// Aqui, agrupamos os testes de integracao HTTP dos endpoints do dashboard.
describe('Endpoints de dashboard', () => {
    let token;

    beforeEach(() => {
        mockAuthenticatedUser(pool);
        token = createAuthToken('Coordenacao');
    });

    // ---- Cenario de autenticacao (401) ----
    it('retorna 401 ao acessar os KPIs sem autenticacao', async () => {
        await request(endpointApp)
            .get('/api/dashboard')
            .expect(401);
    });

    // ---- Cenario de autorizacao (403): Mentor nao acessa KPIs gerais ----
    it('retorna 403 ao acessar KPIs com perfil sem permissao de leitura', async () => {
        const tokenMentor = createAuthToken('Mentor');

        await request(endpointApp)
            .get('/api/dashboard')
            .set('Authorization', `Bearer ${tokenMentor}`)
            .expect(403);
    });

    // ---- Cenario de autorizacao (403): Aluno nao acessa KPIs gerais ----
    it('retorna 403 ao acessar KPIs com perfil Aluno', async () => {
        const tokenAluno = createAuthToken('Aluno');
        mockAuthenticatedUser(pool);

        await request(endpointApp)
            .get('/api/dashboard')
            .set('Authorization', `Bearer ${tokenAluno}`)
            .expect(403);
    });

    // ---- Cenario de autorizacao (403): Aluno nao acessa jovens em risco ----
    it('retorna 403 ao acessar jovens em risco com perfil Aluno', async () => {
        const tokenAluno = createAuthToken('Aluno');
        mockAuthenticatedUser(pool);

        await request(endpointApp)
            .get('/api/dashboard/jovens-em-risco')
            .set('Authorization', `Bearer ${tokenAluno}`)
            .expect(403);
    });

    // ---- Cenario de autorizacao (403): Aluno nao acessa dashboard de mentor ----
    it('retorna 403 ao acessar dashboard/mentor com perfil Aluno', async () => {
        const tokenAluno = createAuthToken('Aluno');
        mockAuthenticatedUser(pool);

        await request(endpointApp)
            .get('/api/dashboard/mentor')
            .set('Authorization', `Bearer ${tokenAluno}`)
            .expect(403);
    });

    // ---- Cenario de sucesso (200) ----
    it('retorna 200 com os KPIs consolidados', async () => {
        dashboardService.obterKPIs.mockResolvedValue(mockKPIs);

        await request(endpointApp)
            .get('/api/dashboard')
            .set('Authorization', `Bearer ${token}`)
            .expect(200, mockKPIs);
    });

    it('retorna 200 ao listar jovens em risco', async () => {
        dashboardService.obterJovensEmRisco.mockResolvedValue(mockJovensRisco);

        await request(endpointApp)
            .get('/api/dashboard/jovens-em-risco')
            .set('Authorization', `Bearer ${token}`)
            .expect(200, mockJovensRisco);
    });

    it('retorna 200 no dashboard do mentor', async () => {
        const tokenMentor = createAuthToken('Mentor', { id: 7 });
        dashboardService.obterDashboardMentor.mockResolvedValue({ mentorias: [] });

        await request(endpointApp)
            .get('/api/dashboard/mentor')
            .set('Authorization', `Bearer ${tokenMentor}`)
            .expect(200, { mentorias: [] });
    });

    // ---- Cenario de regra de negocio (403): aluno acessando id de outro aluno ----
    it('retorna 403 quando o aluno consulta o dashboard de outro aluno', async () => {
        const tokenAluno = createAuthToken('Aluno', { id: 10, jovem_id: 5 });

        await request(endpointApp)
            .get('/api/dashboard/aluno/99')
            .set('Authorization', `Bearer ${tokenAluno}`)
            .expect(403);
    });

    it('retorna 200 quando o aluno consulta o proprio dashboard', async () => {
        const tokenAluno = createAuthToken('Aluno', { id: 10, jovem_id: 5 });
        dashboardService.obterDashboardAluno.mockResolvedValue({ frequencia: [] });

        await request(endpointApp)
            .get('/api/dashboard/aluno/5')
            .set('Authorization', `Bearer ${tokenAluno}`)
            .expect(200, { frequencia: [] });
    });
});
