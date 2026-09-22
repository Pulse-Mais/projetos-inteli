// Aqui, mockamos o service de mentorias para testar somente o comportamento do controller.
jest.mock('../services/mentoriaService', () => ({
    criar: jest.fn(),
    listarTodos: jest.fn(),
    buscarPorId: jest.fn(),
    atualizar: jest.fn(),
    excluir: jest.fn()
}));

// Aqui, mockamos a conexao com o banco para evitar dependencias externas durante os testes.
jest.mock('../database/db', () => ({
    pool: {
        query: jest.fn()
    }
}));

// Aqui, importamos as dependencias utilizadas nos cenarios de teste do controller.
const request = require('supertest');
const mentoriaService = require('../services/mentoriaService');
const mentoriaController = require('../controllers/mentoriaController');
const mentoriaRoutes = require('../routes/mentoriaRoutes');
const { pool } = require('../database/db');
const { BadRequestError } = require('../errors/AppError');
const { createMockReq, createMockRes } = require('./testHelper');
const {
    createEndpointTestApp,
    createAuthToken,
    mockAuthenticatedUser
} = require('./endpointTestHelper');

// Aqui, definimos o segredo usado para gerar e validar os tokens dos testes HTTP.
process.env.JWT_SECRET = 'segredo-mentoria-controller';

// Aqui, criamos uma aplicacao que monta as rotas reais de mentorias.
const endpointApp = createEndpointTestApp('/api/mentorias', mentoriaRoutes);

// Aqui, definimos uma mentoria base para reutilizarmos nos diferentes cenarios de teste.
const mockMentoria = {
    id: 1,
    jovem_id: 1,
    mentor_id: 2,
    nome_mentoria: 'Mentoria de Front-end',
    status_mentoria: 'Agendada',
    mentor: 'Carlos',
    data_mentoria: '2026-06-20',
    tempo_mentoria: '02:00',
    carga_horaria_mentoria: 2,
    observacao_mentoria: null
};

// Aqui, executamos o controller e aguardamos a conclusao das operacoes assincronas.
const executarController = async (controller, req, res, next) => {
    controller(req, res, next);
    await new Promise(setImmediate);
};

// Aqui, agrupamos todos os testes relacionados ao controller de mentorias.
// Rastreabilidade (Art 11): RF004,RF006 + RF003 (autorização) | RN08 | HTTP 200/201/400/401/403/404
describe('MentoriaController [RF004,RF006,RF003 | RN08]', () => {
    let res;
    let next;

    // Aqui, criamos novos mocks de resposta e de proximo middleware antes de cada teste.
    beforeEach(() => {
        res = createMockRes();
        next = jest.fn();
    });

    // Aqui, agrupamos os testes do metodo responsavel pela criacao de mentorias.
    describe('criar', () => {
        // Aqui, verificamos se o controller envia o corpo da requisicao ao service.
        it('envia o corpo da requisicao ao service', async () => {
            const req = createMockReq({ body: { ...mockMentoria } });
            mentoriaService.criar.mockResolvedValue(mockMentoria);

            await executarController(mentoriaController.criar, req, res, next);

            expect(mentoriaService.criar).toHaveBeenCalledWith(req.body);
        });

        // Aqui, verificamos se o controller retorna o status 201 e a mentoria criada.
        it('retorna status 201 e a mentoria criada', async () => {
            const req = createMockReq({ body: { ...mockMentoria } });
            mentoriaService.criar.mockResolvedValue(mockMentoria);

            await executarController(mentoriaController.criar, req, res, next);

            expect(res.status).toHaveBeenCalledWith(201);
            expect(res.json).toHaveBeenCalledWith(mockMentoria);
            expect(next).not.toHaveBeenCalled();
        });

        // Aqui, verificamos se o controller encaminha erros de criacao ao middleware de erros.
        it('encaminha erros do service para o middleware de erros', async () => {
            const erro = new Error('Falha ao criar mentoria');
            const req = createMockReq({ body: { ...mockMentoria } });
            mentoriaService.criar.mockRejectedValue(erro);

            await executarController(mentoriaController.criar, req, res, next);

            expect(next).toHaveBeenCalledWith(erro);
            expect(res.json).not.toHaveBeenCalled();
        });
    });

    // Aqui, agrupamos os testes do metodo responsavel pela listagem de mentorias.
    describe('listar', () => {
        // Aqui, verificamos se o controller envia todos os filtros recebidos ao service.
        it('envia os filtros da query ao service', async () => {
            const query = {
                mentor_id: '2',
                status_mentoria: 'Agendada',
                data_mentoria: '2026-06-20',
                jovem_id: '1'
            };
            const req = createMockReq({ query });
            mentoriaService.listarTodos.mockResolvedValue([mockMentoria]);

            await executarController(mentoriaController.listar, req, res, next);

            expect(mentoriaService.listarTodos).toHaveBeenCalledWith(query);
        });

        // Aqui, verificamos se o controller envia filtros indefinidos quando a query esta vazia.
        it('envia filtros indefinidos quando a query esta vazia', async () => {
            const req = createMockReq();
            mentoriaService.listarTodos.mockResolvedValue([]);

            await executarController(mentoriaController.listar, req, res, next);

            expect(mentoriaService.listarTodos).toHaveBeenCalledWith({
                mentor_id: undefined,
                status_mentoria: undefined,
                data_mentoria: undefined,
                jovem_id: undefined
            });
        });

        // Aqui, verificamos se o controller retorna as mentorias encontradas.
        it('retorna as mentorias encontradas', async () => {
            const req = createMockReq();
            mentoriaService.listarTodos.mockResolvedValue([mockMentoria]);

            await executarController(mentoriaController.listar, req, res, next);

            expect(res.json).toHaveBeenCalledWith([mockMentoria]);
            expect(next).not.toHaveBeenCalled();
        });
    });

    // Aqui, agrupamos os testes do metodo responsavel pela busca de uma mentoria por ID.
    describe('buscarPorId', () => {
        // Aqui, verificamos se o controller converte o ID e consulta o service.
        it('converte o ID para numero e consulta o service', async () => {
            const req = createMockReq({ params: { id: '1' } });
            mentoriaService.buscarPorId.mockResolvedValue(mockMentoria);

            await executarController(mentoriaController.buscarPorId, req, res, next);

            expect(mentoriaService.buscarPorId).toHaveBeenCalledWith(1);
        });

        // Aqui, verificamos se o controller retorna a mentoria encontrada.
        it('retorna a mentoria encontrada', async () => {
            const req = createMockReq({ params: { id: '1' } });
            mentoriaService.buscarPorId.mockResolvedValue(mockMentoria);

            await executarController(mentoriaController.buscarPorId, req, res, next);

            expect(res.json).toHaveBeenCalledWith(mockMentoria);
            expect(next).not.toHaveBeenCalled();
        });

        // Aqui, verificamos se o controller rejeita um ID invalido antes de consultar o service.
        it('encaminha BadRequestError quando o ID e invalido', async () => {
            const req = createMockReq({ params: { id: 'abc' } });

            await executarController(mentoriaController.buscarPorId, req, res, next);

            expect(next).toHaveBeenCalledWith(expect.any(BadRequestError));
            expect(mentoriaService.buscarPorId).not.toHaveBeenCalled();
        });
    });

    // Aqui, agrupamos os testes do metodo responsavel pela atualizacao de mentorias.
    describe('atualizar', () => {
        // Aqui, verificamos se o controller converte o ID e envia os novos dados ao service.
        it('converte o ID e envia os dados ao service', async () => {
            const body = { status_mentoria: 'Realizada' };
            const req = createMockReq({ params: { id: '1' }, body });
            mentoriaService.atualizar.mockResolvedValue({ ...mockMentoria, ...body });

            await executarController(mentoriaController.atualizar, req, res, next);

            expect(mentoriaService.atualizar).toHaveBeenCalledWith(1, body);
        });

        // Aqui, verificamos se o controller retorna a mentoria atualizada.
        it('retorna a mentoria atualizada', async () => {
            const mentoriaAtualizada = { ...mockMentoria, status_mentoria: 'Realizada' };
            const req = createMockReq({
                params: { id: '1' },
                body: { status_mentoria: 'Realizada' }
            });
            mentoriaService.atualizar.mockResolvedValue(mentoriaAtualizada);

            await executarController(mentoriaController.atualizar, req, res, next);

            expect(res.json).toHaveBeenCalledWith(mentoriaAtualizada);
            expect(next).not.toHaveBeenCalled();
        });

        // Aqui, verificamos se o controller rejeita um ID invalido antes de atualizar a mentoria.
        it('encaminha BadRequestError quando o ID e invalido', async () => {
            const req = createMockReq({ params: { id: '0' }, body: {} });

            await executarController(mentoriaController.atualizar, req, res, next);

            expect(next).toHaveBeenCalledWith(expect.any(BadRequestError));
            expect(mentoriaService.atualizar).not.toHaveBeenCalled();
        });

        // Aqui, verificamos se o controller encaminha erros de atualizacao ao middleware de erros.
        it('encaminha erros do service para o middleware de erros', async () => {
            const erro = new Error('Falha ao atualizar mentoria');
            const req = createMockReq({ params: { id: '1' }, body: {} });
            mentoriaService.atualizar.mockRejectedValue(erro);

            await executarController(mentoriaController.atualizar, req, res, next);

            expect(next).toHaveBeenCalledWith(erro);
            expect(res.json).not.toHaveBeenCalled();
        });
    });

    // Aqui, agrupamos os testes do metodo responsavel pela exclusao de mentorias.
    describe('excluir', () => {
        // Aqui, verificamos se o controller converte o ID e solicita a exclusao ao service.
        it('converte o ID e solicita a exclusao ao service', async () => {
            const req = createMockReq({ params: { id: '1' } });
            mentoriaService.excluir.mockResolvedValue();

            await executarController(mentoriaController.excluir, req, res, next);

            expect(mentoriaService.excluir).toHaveBeenCalledWith(1);
        });

        // Aqui, verificamos se o controller retorna o status 204 sem conteudo.
        it('retorna status 204 sem conteudo', async () => {
            const req = createMockReq({ params: { id: '1' } });
            mentoriaService.excluir.mockResolvedValue();

            await executarController(mentoriaController.excluir, req, res, next);

            expect(res.status).toHaveBeenCalledWith(204);
            expect(res.send).toHaveBeenCalledWith();
            expect(next).not.toHaveBeenCalled();
        });

        // Aqui, verificamos se o controller rejeita um ID invalido antes de excluir a mentoria.
        it('encaminha BadRequestError quando o ID e invalido', async () => {
            const req = createMockReq({ params: { id: '-1' } });

            await executarController(mentoriaController.excluir, req, res, next);

            expect(next).toHaveBeenCalledWith(expect.any(BadRequestError));
            expect(mentoriaService.excluir).not.toHaveBeenCalled();
            expect(res.status).not.toHaveBeenCalled();
        });
    });
});

// Aqui, agrupamos os testes de integracao HTTP dos endpoints de mentorias.
describe('Endpoints de mentorias', () => {
    let token;

    // Aqui, autenticamos um usuario autorizado antes de cada teste de endpoint.
    beforeEach(() => {
        mockAuthenticatedUser(pool);
        token = createAuthToken();
    });

    // Aqui, verificamos se a rota rejeita requisicoes sem token.
    it('retorna 401 ao listar mentorias sem autenticacao', async () => {
        await request(endpointApp)
            .get('/api/mentorias')
            .expect(401);
    });

    // Aqui, verificamos o fluxo HTTP completo de criacao de mentoria.
    it('retorna 201 ao criar uma mentoria autenticada', async () => {
        mentoriaService.criar.mockResolvedValue(mockMentoria);

        await request(endpointApp)
            .post('/api/mentorias')
            .set('Authorization', `Bearer ${token}`)
            .send(mockMentoria)
            .expect(201, mockMentoria);
    });

    // Aqui, verificamos o fluxo HTTP completo de listagem de mentorias.
    it('retorna 200 ao listar mentorias', async () => {
        mentoriaService.listarTodos.mockResolvedValue([mockMentoria]);

        await request(endpointApp)
            .get('/api/mentorias?status_mentoria=Agendada')
            .set('Authorization', `Bearer ${token}`)
            .expect(200, [mockMentoria]);
    });

    // Aqui, verificamos o fluxo HTTP completo de busca de mentoria por ID.
    it('retorna 200 ao buscar uma mentoria por ID', async () => {
        mentoriaService.buscarPorId.mockResolvedValue(mockMentoria);

        await request(endpointApp)
            .get('/api/mentorias/1')
            .set('Authorization', `Bearer ${token}`)
            .expect(200, mockMentoria);
    });

    // Aqui, verificamos o fluxo HTTP completo de atualizacao de mentoria.
    it('retorna 200 ao atualizar uma mentoria', async () => {
        const atualizada = { ...mockMentoria, status_mentoria: 'Realizada' };
        mentoriaService.atualizar.mockResolvedValue(atualizada);

        await request(endpointApp)
            .put('/api/mentorias/1')
            .set('Authorization', `Bearer ${token}`)
            .send({ status_mentoria: 'Realizada' })
            .expect(200, atualizada);
    });

    // Aqui, verificamos o fluxo HTTP completo de exclusao de mentoria.
    it('retorna 204 ao excluir uma mentoria', async () => {
        mentoriaService.excluir.mockResolvedValue();

        await request(endpointApp)
            .delete('/api/mentorias/1')
            .set('Authorization', `Bearer ${token}`)
            .expect(204);
    });

    // ---- Cenarios de ownership (403): Aluno nao pode criar nem excluir ----
    it('retorna 403 ao criar mentoria com perfil Aluno', async () => {
        const tokenAluno = createAuthToken('Aluno');
        mockAuthenticatedUser(pool);

        await request(endpointApp)
            .post('/api/mentorias')
            .set('Authorization', `Bearer ${tokenAluno}`)
            .send(mockMentoria)
            .expect(403);

        expect(mentoriaService.criar).not.toHaveBeenCalled();
    });

    it('retorna 403 ao excluir mentoria com perfil Aluno', async () => {
        const tokenAluno = createAuthToken('Aluno');
        mockAuthenticatedUser(pool);

        await request(endpointApp)
            .delete('/api/mentorias/1')
            .set('Authorization', `Bearer ${tokenAluno}`)
            .expect(403);

        expect(mentoriaService.excluir).not.toHaveBeenCalled();
    });

    // ---- Cenario de ownership (201): Mentor e perfil autorizado para criar ----
    it('retorna 201 ao criar mentoria com perfil Mentor', async () => {
        const tokenMentor = createAuthToken('Mentor');
        mockAuthenticatedUser(pool);
        mentoriaService.criar.mockResolvedValue(mockMentoria);

        await request(endpointApp)
            .post('/api/mentorias')
            .set('Authorization', `Bearer ${tokenMentor}`)
            .send(mockMentoria)
            .expect(201, mockMentoria);
    });

    // ---- Filtros combinados: todos os quatro parametros simultaneamente ----
    it('retorna 200 ao listar mentorias com filtros combinados', async () => {
        mentoriaService.listarTodos.mockResolvedValue([mockMentoria]);

        await request(endpointApp)
            .get('/api/mentorias?mentor_id=2&jovem_id=1&status_mentoria=Agendada&data_mentoria=2026-06-20')
            .set('Authorization', `Bearer ${token}`)
            .expect(200, [mockMentoria]);

        expect(mentoriaService.listarTodos).toHaveBeenCalledWith(
            expect.objectContaining({
                mentor_id: '2',
                jovem_id: '1',
                status_mentoria: 'Agendada',
                data_mentoria: '2026-06-20'
            })
        );
    });
});
