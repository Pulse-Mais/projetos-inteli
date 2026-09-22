import { Request, Response } from 'express';
import { PsicologoController } from '../../controllers/psicologo.controller';
import { PsicologoService } from '../../services/psicologo.service';

describe('PsicologoController', () => {

    // GET/psicologa/:rm

    const makeService = () =>
    ({
        buscarRmPsi: jest.fn(),
        buscarAlunosPorRm: jest.fn(),
        registrarProntuario: jest.fn(),
        buscarProntuarios: jest.fn(),
        atualizarProntuario: jest.fn(),
        atualizarStatusAtendimento: jest.fn(),
    } as unknown as jest.Mocked<PsicologoService>);

    const makeRes = () => {
        const res = {} as Response;
        res.status = jest.fn().mockReturnValue(res)
        res.json = jest.fn().mockReturnValue(res)
        return res
    }

    const makeReq = (params: object, body: object = {}, query: object = {}) =>
        ({ params, body, query } as unknown as Request)

    it('Deve retornar 200 com os dados da psicologa', async () => {
        const service = makeService()
        const psicologo = { rm: 1, nome: 'Mariana Rodrigues', cargo: 'Psicóloga', email: 'mariana.rodriguespulsemais@gmail.com' }
        service.buscarRmPsi.mockResolvedValueOnce(psicologo)

        const controller = new PsicologoController(service)
        const res = makeRes()

        await controller.buscarRmPsi(makeReq({ rm: '1' }), res)

        expect(service.buscarRmPsi).toHaveBeenCalledWith(1)
        expect(res.status).toHaveBeenCalledWith(200)
        expect(res.json).toHaveBeenCalledWith(psicologo)
    })
    // erro
    it('Deve retornar 404 quando psicólogo não for encontrado', async () => {
        const service = makeService();
        service.buscarRmPsi.mockResolvedValueOnce(null);

        const controller = new PsicologoController(service);
        const res = makeRes();

        await controller.buscarRmPsi(makeReq({ rm: '100' }), res);

        expect(res.status).toHaveBeenCalledWith(404);
        expect(res.json).toHaveBeenCalledWith({ error: 'Psicóloga não encontrada.' });
    });

    // erro servidor
    it('deve retornar 500 quando ocorrer erro inesperado', async () => {
        const service = makeService();
        service.buscarRmPsi.mockRejectedValueOnce(new Error('Erro no banco'));

        const controller = new PsicologoController(service);
        const res = makeRes();

        await controller.buscarRmPsi(makeReq({ rm: '1' }), res);

        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith({ error: 'Erro interno ao buscar psicólogo.' });
    })

    it('deve retornar 400 quando RM for invalido', async () => {
        const service = makeService();
        const controller = new PsicologoController(service);
        const res = makeRes();

        await controller.buscarRmPsi(makeReq({ rm: 'abc' }), res);

        expect(service.buscarRmPsi).not.toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({ error: 'RM invalido.' });
    })

    // GET /psicologa/:rm/alunos

    it('deve retornar 200 com os alunos atendidos pela psicologa', async () => {
        const service = makeService();
        const alunos = [
            {
                ra: 1,
                nome: 'Carlos Sales',
                status: 'Capacitado',
                id_turma: 1,
            },
            {
                ra: 2,
                nome: 'Ana Lima',
                status: 'Em andamento',
                id_turma: 1,
            },
        ];
        service.buscarAlunosPorRm.mockResolvedValueOnce(alunos);

        const controller = new PsicologoController(service);
        const res = makeRes();

        await controller.buscarAlunos(makeReq({ rm: '1' }), res);

        expect(service.buscarAlunosPorRm).toHaveBeenCalledWith(1, {
            busca: undefined,
            id_turma: undefined,
            status: 'ALL',
        });
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith(alunos);
    });

    it('deve retornar 200 com lista vazia quando nenhum aluno for encontrado', async () => {
        const service = makeService();
        service.buscarAlunosPorRm.mockResolvedValueOnce([]);

        const controller = new PsicologoController(service);
        const res = makeRes();

        await controller.buscarAlunos(makeReq({ rm: '99' }), res);

        expect(service.buscarAlunosPorRm).toHaveBeenCalledWith(99, {
            busca: undefined,
            id_turma: undefined,
            status: 'ALL',
        });
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith([]);
    });

    it('deve retornar 500 quando ocorrer erro inesperado ao buscar alunos da psicologa', async () => {
        const service = makeService();
        service.buscarAlunosPorRm.mockRejectedValueOnce(new Error('Erro no banco'));

        const controller = new PsicologoController(service);
        const res = makeRes();

        await controller.buscarAlunos(makeReq({ rm: '1' }), res);

        expect(service.buscarAlunosPorRm).toHaveBeenCalledWith(1, {
            busca: undefined,
            id_turma: undefined,
            status: 'ALL',
        });
        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith({ error: 'Erro interno ao buscar alunos.' });
    });

    it('deve repassar filtros de busca e status ao listar alunos atendidos', async () => {
        const service = makeService();
        service.buscarAlunosPorRm.mockResolvedValueOnce([
            {
                ra: 2,
                nome: 'Ana Lima',
                status: true,
                id_turma: 1,
            },
        ]);

        const controller = new PsicologoController(service);
        const res = makeRes();

        await controller.buscarAlunos(
            makeReq({ rm: '1' }, {}, { busca: 'Ana', id_turma: '2', status: 'INACTIVE' }),
            res,
        );

        expect(service.buscarAlunosPorRm).toHaveBeenCalledWith(1, {
            busca: 'Ana',
            id_turma: 2,
            status: 'INACTIVE',
        });
        expect(res.status).toHaveBeenCalledWith(200);
    });

    // POST /psicologa/:rm/alunos/:ra/relatorios

    it('deve retornar 201 quando registrar prontuario com sucesso', async () => {
        const service = makeService();

        const body = {
            info_simplificada: 'Aluno apresenta sinais de ansiedade.',
            observacoes: 'Recomendado acompanhamento semanal.',
            data: '2026-05-25',
        };
        service.registrarProntuario.mockResolvedValueOnce(undefined);

        const controller = new PsicologoController(service);
        const res = makeRes();

        await controller.registrarProntuario(makeReq({ rm: '1', ra: '1' }, body), res);

        expect(service.registrarProntuario).toHaveBeenCalledWith(1, 1, body);
        expect(res.status).toHaveBeenCalledWith(201);
        expect(res.json).toHaveBeenCalledWith({
            message: 'Prontuário registrado com sucesso.',
        });
    });

    it('deve retornar 400 quando campos obrigatorios estiverem ausentes', async () => {
        const service = makeService();

        const body = {
            observacoes: 'Recomendado acompanhamento semanal.',
        }

        const controller = new PsicologoController(service);
        const res = makeRes();

        await controller.registrarProntuario(
            makeReq({ rm: '1', ra: '1' }, body),
            res,
        );

        expect(service.registrarProntuario).not.toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({ error: 'Campos obrigatórios ausentes.' });
    });

    it('deve retornar 500 quando ocorrer erro inesperado ao registrar prontuario', async () => {
        const service = makeService();

        const body = {
            info_simplificada: 'Aluno apresenta sinais de ansiedade.',
            observacoes: 'Recomendado acompanhamento semanal.',
            data: '2026-05-25',
        };

        service.registrarProntuario.mockRejectedValueOnce(new Error('Erro no banco'));

        const controller = new PsicologoController(service);
        const res = makeRes();

        await controller.registrarProntuario(
            makeReq({ rm: '1', ra: '1' }, body),
            res,
        );

        expect(service.registrarProntuario).toHaveBeenCalledWith(1, 1, body);
        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith({
            error: 'Erro interno ao registrar prontuário.',
        });
    });
    
    // GET /psicologa/:rm/alunos/:ra/relatorios

    it('deve retornar 200 com os prontuarios do aluno', async () => {
        const service = makeService();
        const prontuarios = [
            {
                id_relatorio: 1,
                info_simplificada: 'Aluno apresenta sinais de ansiedade.',
                observacoes: 'Recomendado acompanhamento semanal.',
                data: '2026-05-25',
            },
            {
                id_relatorio: 2,
                info_simplificada: 'Melhora observada após duas semanas.',
                observacoes: 'Continuar acompanhamento.',
                data: '2026-06-01',
            },
        ];
        service.buscarProntuarios.mockResolvedValueOnce(prontuarios);

        const controller = new PsicologoController(service);
        const res = makeRes();

        await controller.buscarProntuarios(makeReq({ rm: '1', ra: '1' }), res);

        expect(service.buscarProntuarios).toHaveBeenCalledWith(1, 1);
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith(prontuarios);
    });

    it('deve retornar 404 quando nenhum prontuario for encontrado', async () => {
        const service = makeService();
        service.buscarProntuarios.mockResolvedValueOnce([]);

        const controller = new PsicologoController(service);
        const res = makeRes();

        await controller.buscarProntuarios(makeReq({ rm: '1', ra: '99' }), res);

        expect(service.buscarProntuarios).toHaveBeenCalledWith(1, 99);
        expect(res.status).toHaveBeenCalledWith(404);
        expect(res.json).toHaveBeenCalledWith({ error: 'Nenhum prontuário encontrado.' });
    });

    it('deve retornar 500 quando ocorrer erro inesperado ao buscar prontuarios', async () => {
        const service = makeService();
        service.buscarProntuarios.mockRejectedValueOnce(new Error('Erro no banco'));

        const controller = new PsicologoController(service);
        const res = makeRes();

        await controller.buscarProntuarios(makeReq({ rm: '1', ra: '1' }), res);

        expect(service.buscarProntuarios).toHaveBeenCalledWith(1, 1);
        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith({
            error: 'Erro interno ao buscar prontuários.',
        });
    });

    // PATCH /psicologa/:rm/alunos/:ra/relatorios/:id_relatorio

    it('deve retornar 200 quando atualizar prontuario com sucesso', async () => {
        const service = makeService();
        const body = {
            info_simplificada: 'Aluno apresenta melhora significativa.',
            observacoes: 'Reduzir frequência de sessões.',
        };
        (service as any).atualizarProntuario.mockResolvedValueOnce(true);

        const controller = new PsicologoController(service);
        const res = makeRes();

        await (controller as any).atualizarProntuario(
            makeReq({ rm: '1', ra: '1', id_relatorio: '1' }, body),
            res,
        );

        expect((service as any).atualizarProntuario).toHaveBeenCalledWith(1, 1, 1, body);
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith({
            message: 'Prontuário atualizado com sucesso.',
        });
    });

    it('deve retornar 404 quando prontuario nao for encontrado para atualizar', async () => {
        const service = makeService();
        const body = {
            info_simplificada: 'Aluno apresenta melhora significativa.',
        };
        (service as any).atualizarProntuario.mockResolvedValueOnce(false);

        const controller = new PsicologoController(service);
        const res = makeRes();

        await (controller as any).atualizarProntuario(
            makeReq({ rm: '1', ra: '1', id_relatorio: '99' }, body),
            res,
        );

        expect((service as any).atualizarProntuario).toHaveBeenCalledWith(1, 1, 99, body);
        expect(res.status).toHaveBeenCalledWith(404);
        expect(res.json).toHaveBeenCalledWith({
            error: 'Prontuário não encontrado.',
        });
    });

    it('deve retornar 500 quando ocorrer erro inesperado ao atualizar prontuario', async () => {
        const service = makeService();
        const body = {
            observacoes: 'Reduzir frequência de sessões.',
        };
        (service as any).atualizarProntuario.mockRejectedValueOnce(new Error('Erro no banco'));

        const controller = new PsicologoController(service);
        const res = makeRes();

        await (controller as any).atualizarProntuario(
            makeReq({ rm: '1', ra: '1', id_relatorio: '1' }, body),
            res,
        );

        expect((service as any).atualizarProntuario).toHaveBeenCalledWith(1, 1, 1, body);
        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith({
            error: 'Erro interno ao atualizar prontuário.',
        });
    });

    // PATCH /psicologa/:rm/alunos/:ra/status

    it('deve retornar 200 quando atualizar status do atendimento com sucesso', async () => {
        const service = makeService();
        const aluno = {
            ra: 1,
            nome: 'Ana Lima',
            status: false,
            id_turma: 1,
        };
        (service as any).atualizarStatusAtendimento.mockResolvedValueOnce(aluno);

        const controller = new PsicologoController(service);
        const res = makeRes();

        await controller.atualizarStatusAtendimento(
            makeReq({ rm: '1', ra: '1' }, { status: 'INACTIVE' }),
            res,
        );

        expect((service as any).atualizarStatusAtendimento).toHaveBeenCalledWith(1, 1, false);
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith(aluno);
    });

    it('deve retornar 400 quando status do atendimento for invalido', async () => {
        const service = makeService();
        const controller = new PsicologoController(service);
        const res = makeRes();

        await controller.atualizarStatusAtendimento(
            makeReq({ rm: '1', ra: '1' }, { status: 'encerrado' }),
            res,
        );

        expect((service as any).atualizarStatusAtendimento).not.toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({ error: 'Status invalido. Use ACTIVE ou INACTIVE.' });
    });

    it('deve retornar 404 quando atendimento nao for encontrado para atualizar status', async () => {
        const service = makeService();
        (service as any).atualizarStatusAtendimento.mockResolvedValueOnce(null);

        const controller = new PsicologoController(service);
        const res = makeRes();

        await controller.atualizarStatusAtendimento(
            makeReq({ rm: '1', ra: '99' }, { status: 'ACTIVE' }),
            res,
        );

        expect((service as any).atualizarStatusAtendimento).toHaveBeenCalledWith(1, 99, true);
        expect(res.status).toHaveBeenCalledWith(404);
        expect(res.json).toHaveBeenCalledWith({ error: 'Atendimento nao encontrado para esta psicologa.' });
    });
});
