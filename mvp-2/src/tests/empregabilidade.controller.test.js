// Aqui, mockamos o service de empregabilidade para testar somente o comportamento do controller.
jest.mock('../services/empregabilidadeService', () => ({
    criar: jest.fn(),
    listarTodos: jest.fn(),
    buscarPorId: jest.fn(),
    atualizar: jest.fn(),
    arquivar: jest.fn()
}));

// Aqui, mockamos a conexao com o banco para evitar dependencias externas durante os testes.
jest.mock('../database/db', () => ({
    pool: {
        query: jest.fn()
    }
}));

// Aqui, importamos as dependencias utilizadas nos cenarios de teste do controller.
const request = require('supertest');
const empregabilidadeService = require('../services/empregabilidadeService');
const empregabilidadeController = require('../controllers/empregabilidadeController');
const empregabilidadeRoutes = require('../routes/empregabilidadeRoutes');
const { pool } = require('../database/db');
const { BadRequestError } = require('../errors/AppError');
const { createMockReq, createMockRes } = require('./testHelper');
const {
    createEndpointTestApp,
    createAuthToken,
    mockAuthenticatedUser
} = require('./endpointTestHelper');

// Aqui, definimos o segredo usado para gerar e validar os tokens dos testes HTTP.
process.env.JWT_SECRET = 'segredo-empregabilidade-controller';

// Aqui, criamos uma aplicacao que monta as rotas reais de empregabilidade.
const endpointApp = createEndpointTestApp('/api/empregabilidade', empregabilidadeRoutes);

// Aqui, definimos um registro de empregabilidade para reutilizarmos nos cenarios de teste.
const mockEmpregabilidade = {
    id: 1,
    jovem_id: 1,
    empresa: 'Tech Corp',
    cargo: 'Desenvolvedor Junior',
    data_admissao: '2026-01-15',
    data_saida: null,
    faixa_salarial: '1_a_2_SM',
    tipo_vinculo: 'CLT',
    modalidade: 'Hibrido',
    carga_horaria_semanal: '30h/sem',
    area_tech: true,
    ativo: true
};

// Aqui, executamos o controller e aguardamos a conclusao das operacoes assincronas.
const executarController = async (controller, req, res, next) => {
    controller(req, res, next);
    await new Promise(setImmediate);
};

// Aqui, agrupamos todos os testes relacionados ao controller de empregabilidade.
// Rastreabilidade (Art 11): RF010 + RF003 (autorização) | RN08,RN15 | HTTP 200/201/400/401/403/404
describe('EmpregabilidadeController [RF010,RF003 | RN08,RN15]', () => {
    let res;
    let next;

    // Aqui, criamos novos mocks de resposta e de proximo middleware antes de cada teste.
    beforeEach(() => {
        res = createMockRes();
        next = jest.fn();
    });

    // Aqui, agrupamos os testes do metodo responsavel pela criacao de registros.
    describe('criar', () => {
        // Aqui, verificamos se o controller envia o corpo da requisicao ao service.
        it('envia o corpo da requisicao ao service', async () => {
            const req = createMockReq({ body: { ...mockEmpregabilidade } });
            empregabilidadeService.criar.mockResolvedValue(mockEmpregabilidade);

            await executarController(empregabilidadeController.criar, req, res, next);

            expect(empregabilidadeService.criar).toHaveBeenCalledWith(req.body);
        });

        // Aqui, verificamos se o controller retorna o status 201 e o registro criado.
        it('retorna status 201 e o registro criado', async () => {
            const req = createMockReq({ body: { ...mockEmpregabilidade } });
            empregabilidadeService.criar.mockResolvedValue(mockEmpregabilidade);

            await executarController(empregabilidadeController.criar, req, res, next);

            expect(res.status).toHaveBeenCalledWith(201);
            expect(res.json).toHaveBeenCalledWith(mockEmpregabilidade);
            expect(next).not.toHaveBeenCalled();
        });

        // Aqui, verificamos se o controller encaminha erros de criacao ao middleware de erros.
        it('encaminha erros do service para o middleware de erros', async () => {
            const erro = new Error('Falha ao criar registro de empregabilidade');
            const req = createMockReq({ body: { ...mockEmpregabilidade } });
            empregabilidadeService.criar.mockRejectedValue(erro);

            await executarController(empregabilidadeController.criar, req, res, next);

            expect(next).toHaveBeenCalledWith(erro);
            expect(res.json).not.toHaveBeenCalled();
        });
    });

    // Aqui, agrupamos os testes do metodo responsavel pela listagem de registros.
    describe('listar', () => {
        // Aqui, verificamos se o controller envia os filtros recebidos ao service.
        it('envia os filtros da query ao service', async () => {
            const query = { jovem_id: '1', ativo: 'true', tipo_vinculo: 'CLT' };
            const req = createMockReq({ query });
            empregabilidadeService.listarTodos.mockResolvedValue([mockEmpregabilidade]);

            await executarController(empregabilidadeController.listar, req, res, next);

            expect(empregabilidadeService.listarTodos).toHaveBeenCalledWith(query);
        });

        // Aqui, verificamos se o controller retorna os registros encontrados.
        it('retorna os registros encontrados', async () => {
            const req = createMockReq();
            empregabilidadeService.listarTodos.mockResolvedValue([mockEmpregabilidade]);

            await executarController(empregabilidadeController.listar, req, res, next);

            expect(res.json).toHaveBeenCalledWith([mockEmpregabilidade]);
            expect(next).not.toHaveBeenCalled();
        });

        // Aqui, verificamos se o controller encaminha erros de listagem ao middleware de erros.
        it('encaminha erros do service para o middleware de erros', async () => {
            const erro = new Error('Falha ao listar registros de empregabilidade');
            const req = createMockReq();
            empregabilidadeService.listarTodos.mockRejectedValue(erro);

            await executarController(empregabilidadeController.listar, req, res, next);

            expect(next).toHaveBeenCalledWith(erro);
            expect(res.json).not.toHaveBeenCalled();
        });
    });

    // Aqui, agrupamos os testes do metodo responsavel pela busca de um registro por ID.
    describe('buscarPorId', () => {
        // Aqui, verificamos se o controller converte o ID e retorna o registro encontrado.
        it('converte o ID e retorna o registro encontrado', async () => {
            const req = createMockReq({ params: { id: '1' } });
            empregabilidadeService.buscarPorId.mockResolvedValue(mockEmpregabilidade);

            await executarController(empregabilidadeController.buscarPorId, req, res, next);

            expect(empregabilidadeService.buscarPorId).toHaveBeenCalledWith(1);
            expect(res.json).toHaveBeenCalledWith(mockEmpregabilidade);
            expect(next).not.toHaveBeenCalled();
        });

        // Aqui, verificamos se o controller rejeita um ID invalido antes de consultar o service.
        it('encaminha BadRequestError quando o ID e invalido', async () => {
            const req = createMockReq({ params: { id: 'abc' } });

            await executarController(empregabilidadeController.buscarPorId, req, res, next);

            expect(next).toHaveBeenCalledWith(expect.any(BadRequestError));
            expect(empregabilidadeService.buscarPorId).not.toHaveBeenCalled();
        });
    });

    // Aqui, agrupamos os testes do metodo responsavel pela atualizacao de registros.
    describe('atualizar', () => {
        // Aqui, verificamos se o controller converte o ID e retorna o registro atualizado.
        it('converte o ID e retorna o registro atualizado', async () => {
            const body = { cargo: 'Desenvolvedor Pleno' };
            const registroAtualizado = { ...mockEmpregabilidade, ...body };
            const req = createMockReq({ params: { id: '1' }, body });
            empregabilidadeService.atualizar.mockResolvedValue(registroAtualizado);

            await executarController(empregabilidadeController.atualizar, req, res, next);

            expect(empregabilidadeService.atualizar).toHaveBeenCalledWith(1, body);
            expect(res.json).toHaveBeenCalledWith(registroAtualizado);
        });

        // Aqui, verificamos se o controller rejeita um ID invalido antes da atualizacao.
        it('encaminha BadRequestError quando o ID e invalido', async () => {
            const req = createMockReq({ params: { id: '0' }, body: {} });

            await executarController(empregabilidadeController.atualizar, req, res, next);

            expect(next).toHaveBeenCalledWith(expect.any(BadRequestError));
            expect(empregabilidadeService.atualizar).not.toHaveBeenCalled();
        });

        // Aqui, verificamos se o controller encaminha erros de atualizacao ao middleware de erros.
        it('encaminha erros do service para o middleware de erros', async () => {
            const erro = new Error('Falha ao atualizar registro de empregabilidade');
            const req = createMockReq({ params: { id: '1' }, body: {} });
            empregabilidadeService.atualizar.mockRejectedValue(erro);

            await executarController(empregabilidadeController.atualizar, req, res, next);

            expect(next).toHaveBeenCalledWith(erro);
            expect(res.json).not.toHaveBeenCalled();
        });
    });

    // Aqui, agrupamos os testes do metodo responsavel pelo arquivamento de registros.
    describe('arquivar', () => {
        // Aqui, verificamos se o controller converte o ID e retorna o registro arquivado.
        it('converte o ID e retorna o registro arquivado', async () => {
            const registroArquivado = { ...mockEmpregabilidade, ativo: false };
            const req = createMockReq({ params: { id: '1' } });
            empregabilidadeService.arquivar.mockResolvedValue(registroArquivado);

            await executarController(empregabilidadeController.arquivar, req, res, next);

            expect(empregabilidadeService.arquivar).toHaveBeenCalledWith(1);
            expect(res.json).toHaveBeenCalledWith(registroArquivado);
            expect(next).not.toHaveBeenCalled();
        });

        // Aqui, verificamos se o controller rejeita um ID invalido antes do arquivamento.
        it('encaminha BadRequestError quando o ID e invalido', async () => {
            const req = createMockReq({ params: { id: '-1' } });

            await executarController(empregabilidadeController.arquivar, req, res, next);

            expect(next).toHaveBeenCalledWith(expect.any(BadRequestError));
            expect(empregabilidadeService.arquivar).not.toHaveBeenCalled();
        });

        // Aqui, verificamos se o controller encaminha erros de arquivamento ao middleware de erros.
        it('encaminha erros do service para o middleware de erros', async () => {
            const erro = new Error('Falha ao arquivar registro de empregabilidade');
            const req = createMockReq({ params: { id: '1' } });
            empregabilidadeService.arquivar.mockRejectedValue(erro);

            await executarController(empregabilidadeController.arquivar, req, res, next);

            expect(next).toHaveBeenCalledWith(erro);
            expect(res.json).not.toHaveBeenCalled();
        });
    });
});

// Aqui, agrupamos os testes de integracao HTTP dos endpoints de empregabilidade.
describe('Endpoints de empregabilidade', () => {
    let token;

    // Aqui, autenticamos um usuario autorizado antes de cada teste de endpoint.
    beforeEach(() => {
        mockAuthenticatedUser(pool);
        token = createAuthToken();
    });

    // Aqui, verificamos se a rota rejeita requisicoes sem token.
    it('retorna 401 ao listar registros sem autenticacao', async () => {
        await request(endpointApp)
            .get('/api/empregabilidade')
            .expect(401);
    });

    // Aqui, verificamos o fluxo HTTP completo de criacao de registro.
    it('retorna 201 ao criar um registro autenticado', async () => {
        empregabilidadeService.criar.mockResolvedValue(mockEmpregabilidade);

        await request(endpointApp)
            .post('/api/empregabilidade')
            .set('Authorization', `Bearer ${token}`)
            .send(mockEmpregabilidade)
            .expect(201, mockEmpregabilidade);
    });

    // Aqui, verificamos o fluxo HTTP completo de listagem de registros.
    it('retorna 200 ao listar registros', async () => {
        empregabilidadeService.listarTodos.mockResolvedValue([mockEmpregabilidade]);

        await request(endpointApp)
            .get('/api/empregabilidade?ativo=true')
            .set('Authorization', `Bearer ${token}`)
            .expect(200, [mockEmpregabilidade]);
    });

    // Aqui, verificamos o fluxo HTTP completo de busca de registro por ID.
    it('retorna 200 ao buscar um registro por ID', async () => {
        empregabilidadeService.buscarPorId.mockResolvedValue(mockEmpregabilidade);

        await request(endpointApp)
            .get('/api/empregabilidade/1')
            .set('Authorization', `Bearer ${token}`)
            .expect(200, mockEmpregabilidade);
    });

    // Aqui, verificamos o fluxo HTTP completo de atualizacao de registro.
    it('retorna 200 ao atualizar um registro', async () => {
        const atualizado = { ...mockEmpregabilidade, cargo: 'Desenvolvedor Pleno' };
        empregabilidadeService.atualizar.mockResolvedValue(atualizado);

        await request(endpointApp)
            .put('/api/empregabilidade/1')
            .set('Authorization', `Bearer ${token}`)
            .send({ cargo: atualizado.cargo })
            .expect(200, atualizado);
    });

    // Aqui, verificamos o fluxo HTTP completo de arquivamento de registro.
    it('retorna 200 ao arquivar um registro', async () => {
        const arquivado = { ...mockEmpregabilidade, ativo: false };
        empregabilidadeService.arquivar.mockResolvedValue(arquivado);

        await request(endpointApp)
            .patch('/api/empregabilidade/1/arquivar')
            .set('Authorization', `Bearer ${token}`)
            .expect(200, arquivado);
    });
});
