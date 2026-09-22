import { Request, Response } from 'express';
import { CoordenadoraController } from '../../controllers/coordenadora.controller';
import { CoordenadoraService } from '../../services/coordenadora.service';

describe('CoordenadoraController', () => {
  const makeService = () =>
  ({
    buscarPorRm: jest.fn(),
    listarAlunos: jest.fn(),
    registrarFrequencia: jest.fn(),
    atualizarFrequencia: jest.fn(),
    registrarObservacao: jest.fn(),
    registrarEvento: jest.fn(),
    listarRelatorios: jest.fn(),
    filtrarAlunos: jest.fn(),
  } as unknown as jest.Mocked<CoordenadoraService>);

  const makeRes = () => {
    const res = {} as Response;
    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnValue(res);
    return res;
  };

  const makeReq = (params: object, body: object = {}, query: object = {}) =>
    ({ params, body, query } as unknown as Request);

  // GET /coordenadora/:rm

  it('deve retornar 200 com os dados da coordenadora', async () => {
    const service = makeService();
    const coordenadora = {
      rm: 1011,
      nome: 'Denise Soares',
      cargo: 'Coordenadora Pedagógica',
      setor: 'Gestão de pessoas',
      email: 'denise.soarespulsemais@gmail.com',
    };
    service.buscarPorRm.mockResolvedValueOnce(coordenadora);

    const controller = new CoordenadoraController(service);
    const res = makeRes();

    await controller.buscarPorRm(makeReq({ rm: '1011' }), res);

    expect(service.buscarPorRm).toHaveBeenCalledWith(1011);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(coordenadora);
  });

  it('deve retornar 404 quando coordenadora nao for encontrada', async () => {
    const service = makeService();
    service.buscarPorRm.mockResolvedValueOnce(null);

    const controller = new CoordenadoraController(service);
    const res = makeRes();

    await controller.buscarPorRm(makeReq({ rm: '9999' }), res);

    expect(service.buscarPorRm).toHaveBeenCalledWith(9999);
    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({
      error: 'Coordenadora não encontrado.',
    });
  });

  it('deve retornar 500 quando ocorrer erro inesperado', async () => {
    const service = makeService();
    service.buscarPorRm.mockRejectedValueOnce(new Error('Erro no banco'));

    const controller = new CoordenadoraController(service);
    const res = makeRes();

    await controller.buscarPorRm(makeReq({ rm: '1011' }), res);

    expect(service.buscarPorRm).toHaveBeenCalledWith(1011);
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      error: 'Erro interno ao buscar Coodenadora.',
    });
  });

  // GET /coordenadora/:rm/alunos

  it('deve retornar 200 com os alunos vinculados a turma da coordenadora', async () => {
    const service = makeService();
    const alunos = [
      {
        ra: 1,
        nome: 'Carlos Sales',
        status: 'Capacitado',
        nivel_formacao: 'Ensino Medio',
        id_turma: 1,
        frequencia: true,
      },
      {
        ra: 2,
        nome: 'Ana Lima',
        status: 'Em andamento',
        nivel_formacao: 'Ensino Medio',
        id_turma: 1,
        frequencia: false,
      },
    ];
    service.listarAlunos.mockResolvedValueOnce(alunos);

    const controller = new CoordenadoraController(service);
    const res = makeRes();

    await controller.listarAlunos(makeReq({ rm: '1011' }), res);

    expect(service.listarAlunos).toHaveBeenCalledWith(1011);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(alunos);
  });

  it('deve retornar 404 quando nenhum aluno for encontrado para a coordenadora', async () => {
    const service = makeService();
    service.listarAlunos.mockResolvedValueOnce([]);

    const controller = new CoordenadoraController(service);
    const res = makeRes();

    await controller.listarAlunos(makeReq({ rm: '1011' }), res);

    expect(service.listarAlunos).toHaveBeenCalledWith(1011);
    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ error: 'Nenhum aluno encontrado.' });
  });

  it('deve retornar 500 quando ocorrer erro inesperado ao buscar alunos da coordenadora', async () => {
    const service = makeService();
    service.listarAlunos.mockRejectedValueOnce(new Error('Erro no banco'));

    const controller = new CoordenadoraController(service);
    const res = makeRes();

    await controller.listarAlunos(makeReq({ rm: '1011' }), res);

    expect(service.listarAlunos).toHaveBeenCalledWith(1011);
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: 'Erro interno ao buscar alunos.' });
  });

  // POST /coordenadora/:rm/eventos

  it('deve retornar 201 quando registrar evento com sucesso', async () => {
    const service = makeService();
    const body = {
      tema: 'Workshop de Empregabilidade',
      sede: 'Sede Central',
      data: '2026-06-10',
      categoria: 'Alto Planejado',
    };
    (service as any).registrarEvento.mockResolvedValueOnce(undefined);

    const controller = new CoordenadoraController(service);
    const res = makeRes();

    await (controller as any).registrarEvento(
      makeReq({ rm: '1011' }, body),
      res,
    );

    expect((service as any).registrarEvento).toHaveBeenCalledWith(1011, body);
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith({
      message: 'Evento registrado com sucesso.',
    });
  });

  it('deve retornar 400 quando campos obrigatorios do evento estiverem ausentes', async () => {
    const service = makeService();
    const body = {
      tema: 'Workshop de Empregabilidade',
      sede: 'Sede Central',
      data: '2026-06-10',
    };

    const controller = new CoordenadoraController(service);
    const res = makeRes();

    await (controller as any).registrarEvento(
      makeReq({ rm: '1011' }, body),
      res,
    );

    expect((service as any).registrarEvento).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      error: 'Campos obrigatórios ausentes.',
    });
  });

  it('deve retornar 500 quando ocorrer erro inesperado ao registrar evento', async () => {
    const service = makeService();
    const body = {
      tema: 'Workshop de Empregabilidade',
      sede: 'Sede Central',
      data: '2026-06-10',
      categoria: 'Alto Planejado',
    };
    (service as any).registrarEvento.mockRejectedValueOnce(new Error('Erro no banco'));

    const controller = new CoordenadoraController(service);
    const res = makeRes();

    await (controller as any).registrarEvento(
      makeReq({ rm: '1011' }, body),
      res,
    );

    expect((service as any).registrarEvento).toHaveBeenCalledWith(1011, body);
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      error: 'Erro interno ao registrar evento.',
    });
  });

  // POST /coordenadora/:rm/alunos/:ra/frequencias

  it('deve retornar 201 quando registrar frequencia com sucesso', async () => {
    const service = makeService();
    const body = {
      id_aula: 10,
      data: '2026-05-25',
      frequencia: true,
    };
    (service as any).registrarFrequencia.mockResolvedValueOnce(undefined);

    const controller = new CoordenadoraController(service);
    const res = makeRes();

    await (controller as any).registrarFrequencia(
      makeReq({ rm: '1011', ra: '1' }, body),
      res,
    );

    expect((service as any).registrarFrequencia).toHaveBeenCalledWith(1011, 1, body);
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith({
      message: 'Frequência registrada com sucesso.',
    });
  });

  it('deve retornar 400 quando campos obrigatorios da frequencia estiverem ausentes', async () => {
    const service = makeService();
    const body = {
      data: '2026-05-25',
      frequencia: true,
    };

    const controller = new CoordenadoraController(service);
    const res = makeRes();

    await (controller as any).registrarFrequencia(
      makeReq({ rm: '1011', ra: '1' }, body),
      res,
    );

    expect((service as any).registrarFrequencia).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      error: 'Campos obrigatórios ausentes.',
    });
  });

  it('deve retornar 500 quando ocorrer erro inesperado ao registrar frequencia', async () => {
    const service = makeService();
    const body = {
      id_aula: 10,
      data: '2026-05-25',
      frequencia: true,
    };
    (service as any).registrarFrequencia.mockRejectedValueOnce(new Error('Erro no banco'));

    const controller = new CoordenadoraController(service);
    const res = makeRes();

    await (controller as any).registrarFrequencia(
      makeReq({ rm: '1011', ra: '1' }, body),
      res,
    );

    expect((service as any).registrarFrequencia).toHaveBeenCalledWith(1011, 1, body);
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      error: 'Erro interno ao registrar frequência.',
    });
  });

  // PATCH /coordenadora/:rm/alunos/:ra/frequencias/:id_aula

  it('deve retornar 200 quando atualizar frequencia com sucesso', async () => {
    const service = makeService();
    const body = {
      frequencia: false,
    };
    (service as any).atualizarFrequencia.mockResolvedValueOnce(true);

    const controller = new CoordenadoraController(service);
    const res = makeRes();

    await (controller as any).atualizarFrequencia(
      makeReq({ rm: '1011', ra: '1', id_aula: '10' }, body),
      res,
    );

    expect((service as any).atualizarFrequencia).toHaveBeenCalledWith(1011, 1, 10, body);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      message: 'Frequência atualizada com sucesso.',
    });
  });

  it('deve retornar 404 quando frequencia nao for encontrada para atualizar', async () => {
    const service = makeService();
    const body = {
      frequencia: false,
    };
    (service as any).atualizarFrequencia.mockResolvedValueOnce(false);

    const controller = new CoordenadoraController(service);
    const res = makeRes();

    await (controller as any).atualizarFrequencia(
      makeReq({ rm: '1011', ra: '1', id_aula: '10' }, body),
      res,
    );

    expect((service as any).atualizarFrequencia).toHaveBeenCalledWith(1011, 1, 10, body);
    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({
      error: 'Frequência não encontrada.',
    });
  });

  it('deve retornar 500 quando ocorrer erro inesperado ao atualizar frequencia', async () => {
    const service = makeService();
    const body = {
      frequencia: false,
    };
    (service as any).atualizarFrequencia.mockRejectedValueOnce(new Error('Erro no banco'));

    const controller = new CoordenadoraController(service);
    const res = makeRes();

    await (controller as any).atualizarFrequencia(
      makeReq({ rm: '1011', ra: '1', id_aula: '10' }, body),
      res,
    );

    expect((service as any).atualizarFrequencia).toHaveBeenCalledWith(1011, 1, 10, body);
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      error: 'Erro interno ao atualizar frequência.',
    });
  });

  // POST /coordenadora/:rm/alunos/:ra/observacoes

  it('deve retornar 201 quando registrar observacao com sucesso', async () => {
    const service = makeService();
    const body = {
      info_simplificada: 'Aluno demonstrou evolução significativa.',
      observacoes: 'Participou ativamente das atividades em grupo.',
      data: '2026-05-25',
    };

    (service as any).registrarObservacao.mockResolvedValueOnce(undefined);

    const controller = new CoordenadoraController(service);
    const res = makeRes();

    await (controller as any).registrarObservacao(
      makeReq({ rm: '1011', ra: '1' }, body),
      res,
    );

    expect((service as any).registrarObservacao).toHaveBeenCalledWith(
      1011,
      1,
      body,
    );

    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith({
      message: 'Observação registrada com sucesso.',
    });
  });

  it('deve retornar 400 quando campos obrigatorios da observacao estiverem ausentes', async () => {
    const service = makeService();

    const body = {
      observacoes: 'Participou ativamente das atividades em grupo.',
    };

    const controller = new CoordenadoraController(service);
    const res = makeRes();

    await (controller as any).registrarObservacao(
      makeReq({ rm: '1011', ra: '1' }, body),
      res,
    );

    expect((service as any).registrarObservacao).not.toHaveBeenCalled();

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      error: 'Campos obrigatórios ausentes.',
    });
  });

  it('deve retornar 500 quando ocorrer erro inesperado ao registrar observacao', async () => {
    const service = makeService();

    const body = {
      info_simplificada: 'Aluno demonstrou evolução significativa.',
      observacoes: 'Participou ativamente das atividades em grupo.',
      data: '2026-05-25',
    };

    (service as any).registrarObservacao.mockRejectedValueOnce(
      new Error('Erro no banco'),
    );

    const controller = new CoordenadoraController(service);
    const res = makeRes();

    await (controller as any).registrarObservacao(
      makeReq({ rm: '1011', ra: '1' }, body),
      res,
    );

    expect((service as any).registrarObservacao).toHaveBeenCalledWith(
      1011,
      1,
      body,
    );

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      error: 'Erro interno ao registrar observação.',
    });
  });

  // GET /coordenadora/:rm/alunos/filtros - RF015

  describe('GET /coordenadora/:rm/alunos/filtros', () => {
    const filtros = {
      idade_min: '18',
      idade_max: '25',
      empregabilidade: 'Empregado',
      id_turma: '1',
      localizacao: 'Paraisopolis',
      eventos_min: '2',
      eventos_max: '10',
      genero: 'M',
    };

    const alunosFiltrados = [
      {
        ra: 1,
        nome: 'Carlos Sales',
        status: 'Capacitado',
        nivel_formacao: 'Ensino Medio',
        id_turma: 1,
        frequencia: true,
      },
    ];

    it('deve retornar 200 com os alunos filtrados', async () => {
      const service = makeService();
      (service as any).filtrarAlunos.mockResolvedValueOnce(alunosFiltrados);

      const controller = new CoordenadoraController(service);
      const res = makeRes();

      await (controller as any).filtrarAlunos(
        makeReq({ rm: '1011' }, {}, filtros),
        res,
      );

      expect((service as any).filtrarAlunos).toHaveBeenCalledWith(1011, expect.any(Object));
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(alunosFiltrados);
    });

    it('deve retornar 404 quando nenhum aluno corresponder aos filtros', async () => {
      const service = makeService();
      (service as any).filtrarAlunos.mockResolvedValueOnce([]);

      const controller = new CoordenadoraController(service);
      const res = makeRes();

      await (controller as any).filtrarAlunos(
        makeReq({ rm: '1011' }, {}, filtros),
        res,
      );

      expect((service as any).filtrarAlunos).toHaveBeenCalledWith(1011, expect.any(Object));
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ error: 'Nenhum aluno encontrado.' });
    });

    it('deve retornar 400 quando RM for invalido', async () => {
      const service = makeService();
      const controller = new CoordenadoraController(service);
      const res = makeRes();

      await (controller as any).filtrarAlunos(
        makeReq({ rm: 'abc' }, {}, filtros),
        res,
      );

      expect((service as any).filtrarAlunos).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: 'RM invalido.' });
    });

    it('deve retornar 400 quando filtro numerico for invalido', async () => {
      const service = makeService();
      const controller = new CoordenadoraController(service);
      const res = makeRes();

      await (controller as any).filtrarAlunos(
        makeReq({ rm: '1011' }, {}, { idade_min: 'abc' }),
        res,
      );

      expect((service as any).filtrarAlunos).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Filtros invalidos.',
        campos: ['idade_min'],
      });
    });

    it('deve retornar 400 quando filtro nao for permitido', async () => {
      const service = makeService();
      const controller = new CoordenadoraController(service);
      const res = makeRes();

      await (controller as any).filtrarAlunos(
        makeReq({ rm: '1011' }, {}, { curso: 'Backend' }),
        res,
      );

      expect((service as any).filtrarAlunos).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Filtros invalidos.',
        campos: ['curso'],
      });
    });

    it('deve retornar 400 quando filtro minimo for maior que o maximo', async () => {
      const service = makeService();
      const controller = new CoordenadoraController(service);
      const res = makeRes();

      await (controller as any).filtrarAlunos(
        makeReq(
          { rm: '1011' },
          {},
          { eventos_min: '10', eventos_max: '2' },
        ),
        res,
      );

      expect((service as any).filtrarAlunos).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Filtros invalidos.',
        campos: ['eventos_min', 'eventos_max'],
      });
    });

    it('deve retornar 500 quando ocorrer erro inesperado ao filtrar alunos', async () => {
      const service = makeService();
      (service as any).filtrarAlunos.mockRejectedValueOnce(new Error('Erro no banco'));

      const controller = new CoordenadoraController(service);
      const res = makeRes();

      await (controller as any).filtrarAlunos(
        makeReq({ rm: '1011' }, {}, filtros),
        res,
      );

      expect((service as any).filtrarAlunos).toHaveBeenCalledWith(1011, expect.any(Object));
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: 'Erro interno ao filtrar alunos.' });
    });
  });
});
