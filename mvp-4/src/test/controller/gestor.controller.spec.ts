import { Request, Response } from 'express';
import { GestorController } from '../../controllers/gestor.controller';
import { GestorService } from '../../services/gestor.service';

describe('GestorController', () => {
  const makeService = () =>
    ({
      buscarPorRm: jest.fn(),
      listarAlunos: jest.fn(),
      buscarAlunoPorRa: jest.fn(),
      enviarComunicado: jest.fn(),
      importarHistoricoCsv: jest.fn(),
      filtrarAlunos: jest.fn(),
    } as unknown as jest.Mocked<GestorService>);

  const makeRes = () => {
    const res = {} as Response;
    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnValue(res);
    return res;
  };

  const makeReq = (
    params: object = {},
    body: object = {},
    headers: Record<string, string> = {},
    file?: object,
    query: object = {},
  ) => {
    const normalizedHeaders = Object.fromEntries(
      Object.entries(headers).map(([key, value]) => [key.toLowerCase(), value]),
    );

    return {
      params,
      body,
      query,
      headers: normalizedHeaders,
      file,
      get: jest.fn((name: string) => normalizedHeaders[name.toLowerCase()]),
      header: jest.fn((name: string) => normalizedHeaders[name.toLowerCase()]),
    } as unknown as Request;
  };

  it('deve retornar 200 com os dados do gestor', async () => {
    const service = makeService();
    const gestor = {
      rm: 1010,
      nome: 'Eduardo Freitas',
      cargo: 'Gestor',
      setor: 'Administrativo',
      email: 'eduardo.freitaspulsemais@gmail.com'
    };
    service.buscarPorRm.mockResolvedValueOnce(gestor);

    const controller = new GestorController(service);
    const res = makeRes();

    await controller.buscarPorRm(makeReq({ rm: '1010' }), res);

    expect(service.buscarPorRm).toHaveBeenCalledWith(1010);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(gestor);
  });

  it('deve retornar 404 quando gestor não for encontrado', async () => {
    const service = makeService();
    service.buscarPorRm.mockResolvedValueOnce(null);

    const controller = new GestorController(service);
    const res = makeRes();

    await controller.buscarPorRm(makeReq({ rm: '99' }), res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ error: 'Gestor não encontrado.' });
  });

  it('deve retornar 500 quando ocorrer erro inesperado', async () => {
    const service = makeService();
    service.buscarPorRm.mockRejectedValueOnce(new Error('Erro no banco'));

    const controller = new GestorController(service);
    const res = makeRes();

    await controller.buscarPorRm(makeReq({ rm: '1010' }), res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: 'Erro interno ao buscar gestor.' });
  });

  it('deve retornar 400 quando RM for invalido', async () => {
    const service = makeService();
    const controller = new GestorController(service);
    const res = makeRes();

    await controller.buscarPorRm(makeReq({ rm: 'abc' }), res);

    expect(service.buscarPorRm).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: 'RM invalido.' });
  });

  it('deve retornar 200 com a lista de alunos do gestor', async () => {
    const service = makeService();
    const alunos = [
      {
        ra: 1,
        nome: 'Carlos Sales',
        status: 'Capacitado',
        nivel_formacao: 'Ensino Médio',
        idTurma: 1,
        frequencia: true,
        empregabilidade: {
          empresa: 'Tech Corp',
          cargo: 'Desenvolvedor',
          faixa_salarial: 'R$: 3000,00',
        },
      },
      {
        ra: 2,
        nome: 'Ana Lima',
        status: 'Em andamento',
        nivel_formacao: 'Ensino Médio',
        idTurma: 1,
        frequencia: false,
        empregabilidade: null,
      },
    ];
    service.listarAlunos.mockResolvedValueOnce(alunos);

    const controller = new GestorController(service);
    const res = makeRes();

    await controller.listarAlunos(makeReq({ rm: '1010' }), res);

    expect(service.listarAlunos).toHaveBeenCalledWith(1010);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(alunos);
  });

  it('deve retornar 404 quando nenhum aluno for encontrado para o gestor', async () => {
    const service = makeService();
    service.listarAlunos.mockResolvedValueOnce([]);

    const controller = new GestorController(service);
    const res = makeRes();

    await controller.listarAlunos(makeReq({ rm: '1010' }), res);

    expect(service.listarAlunos).toHaveBeenCalledWith(1010);
    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ error: 'Nenhum aluno encontrado.' });
  });

  it('deve retornar 500 quando ocorrer erro ao buscar alunos do gestor', async () => {
    const service = makeService();
    service.listarAlunos.mockRejectedValueOnce(new Error('Erro no banco'));

    const controller = new GestorController(service);
    const res = makeRes();

    await controller.listarAlunos(makeReq({ rm: '1010' }), res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: 'Erro interno ao buscar dados dos alunos.' });
  });

  it('deve retornar 400 quando RM for invalido ao listar alunos', async () => {
    const service = makeService();
    const controller = new GestorController(service);
    const res = makeRes();

    await controller.listarAlunos(makeReq({ rm: 'abc' }), res);

    expect(service.listarAlunos).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: 'RM invalido.' });
  });

  it('deve retornar 200 com os dados de um aluno especifico do gestor', async () => {
    const service = makeService();
    const aluno = {
      ra: 1,
      nome: 'Carlos Sales',
      foto: 'assets/fotoPerfilCarlosSales.png',
      idTurma: 1,
      status: 'Capacitado',
      genero: 'Masculino',
      email_primario: 'Carlos.sales@gmail.com',
      email_secundario: 'sales.carlos@gmail.com',
      tel_primario: '9494-9494',
      tel_secundario: '9272-4002',
      cep: '00893-000',
      endereco: 'Rua Eusebio Mattoso, 1',
      renda_familiar: 'R$: 1610,00',
      empregabilidade: {
        empresa: 'Tech Corp',
        cargo: 'Desenvolvedor',
        faixa_salarial: 'R$: 3000,00',
        nivel_formacao: 'Ensino Superior',
      },
    };
    service.buscarAlunoPorRa.mockResolvedValueOnce(aluno);

    const controller = new GestorController(service);
    const res = makeRes();

    await controller.buscarAlunoPorRa(makeReq({ rm: '1010', ra: '1' }), res);

    expect(service.buscarAlunoPorRa).toHaveBeenCalledWith(1010, 1);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(aluno);
  });

  it('deve retornar 404 quando aluno especifico nao for encontrado', async () => {
    const service = makeService();
    service.buscarAlunoPorRa.mockResolvedValueOnce(null);

    const controller = new GestorController(service);
    const res = makeRes();

    await controller.buscarAlunoPorRa(makeReq({ rm: '1010', ra: '99' }), res);

    expect(service.buscarAlunoPorRa).toHaveBeenCalledWith(1010, 99);
    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ error: 'Nenhum aluno encontrado.' });
  });

  it('deve retornar 500 quando ocorrer erro ao buscar aluno especifico', async () => {
    const service = makeService();
    service.buscarAlunoPorRa.mockRejectedValueOnce(new Error('Erro no banco'));

    const controller = new GestorController(service);
    const res = makeRes();

    await controller.buscarAlunoPorRa(makeReq({ rm: '1010', ra: '1' }), res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: 'Erro interno ao buscar dados dos alunos.' });
  });

  it('deve retornar 400 quando RM for invalido ao buscar aluno especifico', async () => {
    const service = makeService();
    const controller = new GestorController(service);
    const res = makeRes();

    await controller.buscarAlunoPorRa(makeReq({ rm: 'abc', ra: '1' }), res);

    expect(service.buscarAlunoPorRa).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: 'RM invalido.' });
  });

  it('deve retornar 400 quando RA for invalido ao buscar aluno especifico', async () => {
    const service = makeService();
    const controller = new GestorController(service);
    const res = makeRes();

    await controller.buscarAlunoPorRa(makeReq({ rm: '1010', ra: 'abc' }), res);

    expect(service.buscarAlunoPorRa).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: 'RA invalido.' });
  });

  describe('POST /gestor/comunicados', () => {
    const comunicado = {
      titulo: 'Hackathon Pulse Mais 2026',
      conteudo: 'Confirme sua presenca ate 20/06.',
      destinatarios: 'ativos',
    };

    const headersGestor = {
      'content-type': 'application/json',
      'x-perfil': 'gestor',
    };

    it('deve retornar 201 quando comunicado for enviado e registrado com sucesso', async () => {
      const service = makeService();
      (service as any).enviarComunicado.mockResolvedValueOnce(undefined);

      const controller = new GestorController(service);
      const res = makeRes();

      await (controller as any).enviarComunicado(
        makeReq({}, comunicado, headersGestor),
        res,
      );

      expect((service as any).enviarComunicado).toHaveBeenCalledWith({
        ...comunicado,
        tipo: 'Informativo',
        enviado_por: undefined,
      });
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Comunicado enviado e registrado com sucesso.',
      });
    });

    it('deve retornar 400 quando campos obrigatorios estiverem ausentes', async () => {
      const service = makeService();
      const controller = new GestorController(service);
      const res = makeRes();

      await (controller as any).enviarComunicado(
        makeReq({}, { titulo: 'Hackathon Pulse Mais 2026' }, headersGestor),
        res,
      );

      expect((service as any).enviarComunicado).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Campos obrigatórios ausentes: titulo, conteudo, destinatarios.',
      });
    });

    it('deve retornar 400 quando destinatarios tiver valor nao permitido', async () => {
      const service = makeService();
      const controller = new GestorController(service);
      const res = makeRes();

      await (controller as any).enviarComunicado(
        makeReq({}, { ...comunicado, destinatarios: 'mentores' }, headersGestor),
        res,
      );

      expect((service as any).enviarComunicado).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Destinatarios invalido. Valores permitidos: ativos, ex-alunos, todos.',
      });
    });

    it('deve retornar 400 quando titulo ultrapassar 100 caracteres', async () => {
      const service = makeService();
      const controller = new GestorController(service);
      const res = makeRes();

      await (controller as any).enviarComunicado(
        makeReq({}, { ...comunicado, titulo: 'a'.repeat(101) }, headersGestor),
        res,
      );

      expect((service as any).enviarComunicado).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Titulo deve ter no maximo 100 caracteres.',
      });
    });

    it('deve retornar 403 quando perfil nao tiver permissao para enviar comunicados', async () => {
      const service = makeService();
      const controller = new GestorController(service);
      const res = makeRes();

      await (controller as any).enviarComunicado(
        makeReq({}, comunicado, { ...headersGestor, 'x-perfil': 'aluno' }),
        res,
      );

      expect((service as any).enviarComunicado).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Perfil sem permissão para enviar comunicados.',
      });
    });

    it('deve retornar 500 quando ocorrer erro inesperado ao enviar ou registrar comunicado', async () => {
      const service = makeService();
      (service as any).enviarComunicado.mockRejectedValueOnce(new Error('Erro no banco'));

      const controller = new GestorController(service);
      const res = makeRes();

      await (controller as any).enviarComunicado(
        makeReq({}, comunicado, headersGestor),
        res,
      );

      expect((service as any).enviarComunicado).toHaveBeenCalledWith({
        ...comunicado,
        tipo: 'Informativo',
        enviado_por: undefined,
      });
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Erro interno ao enviar ou registrar comunicado.',
      });
    });
  });

  describe('POST /gestor/importacao', () => {
    const resultadoImportacao = {
      importados: 45,
      conflitos: [
        {
          ra: 101,
          motivo: 'CPF ja cadastrado',
        },
      ],
      ignorados: 1,
    };

    const arquivoCsv = {
      originalname: 'historico_alunos.csv',
      mimetype: 'text/csv',
      buffer: Buffer.from('ra,nome,cpf\n101,Carlos Sales,12345678900'),
    };

    const headersGestor = {
      'content-type': 'multipart/form-data',
      cookie: 'session_id=token-teste',
      'x-perfil': 'gestor',
    };

    it('deve retornar 200 quando importar CSV com sucesso e sinalizar conflitos', async () => {
      const service = makeService();
      (service as any).importarHistoricoCsv.mockResolvedValueOnce(resultadoImportacao);

      const controller = new GestorController(service);
      const res = makeRes();

      await (controller as any).importarHistoricoCsv(
        makeReq({}, {}, headersGestor, arquivoCsv),
        res,
      );

      expect((service as any).importarHistoricoCsv).toHaveBeenCalledWith(arquivoCsv);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(resultadoImportacao);
    });

    it('deve retornar 400 quando arquivo estiver ausente', async () => {
      const service = makeService();
      const controller = new GestorController(service);
      const res = makeRes();

      await (controller as any).importarHistoricoCsv(
        makeReq({}, {}, headersGestor),
        res,
      );

      expect((service as any).importarHistoricoCsv).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Arquivo ausente ou formato invalido.',
      });
    });

    it('deve retornar 400 quando arquivo nao for CSV', async () => {
      const service = makeService();
      const controller = new GestorController(service);
      const res = makeRes();
      const arquivoTxt = {
        ...arquivoCsv,
        originalname: 'historico_alunos.txt',
        mimetype: 'text/plain',
      };

      await (controller as any).importarHistoricoCsv(
        makeReq({}, {}, headersGestor, arquivoTxt),
        res,
      );

      expect((service as any).importarHistoricoCsv).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Arquivo ausente ou formato invalido.',
      });
    });

    it('deve retornar 403 quando perfil nao tiver permissao para importar', async () => {
      const service = makeService();
      const controller = new GestorController(service);
      const res = makeRes();

      await (controller as any).importarHistoricoCsv(
        makeReq({}, {}, { ...headersGestor, 'x-perfil': 'aluno' }, arquivoCsv),
        res,
      );

      expect((service as any).importarHistoricoCsv).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Perfil sem permissao para realizar importacoes.',
      });
    });

    it('deve retornar 422 quando estrutura do CSV nao corresponder ao modelo esperado', async () => {
      const service = makeService();
      (service as any).importarHistoricoCsv.mockRejectedValueOnce(
        Object.assign(new Error('Estrutura do CSV nao corresponde ao modelo esperado.'), {
          statusCode: 422,
        }),
      );

      const controller = new GestorController(service);
      const res = makeRes();

      await (controller as any).importarHistoricoCsv(
        makeReq({}, {}, headersGestor, arquivoCsv),
        res,
      );

      expect((service as any).importarHistoricoCsv).toHaveBeenCalledWith(arquivoCsv);
      expect(res.status).toHaveBeenCalledWith(422);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Estrutura do CSV nao corresponde ao modelo esperado.',
      });
    });

    it('deve retornar 500 quando ocorrer erro inesperado ao processar importacao', async () => {
      const service = makeService();
      (service as any).importarHistoricoCsv.mockRejectedValueOnce(new Error('Erro no banco'));

      const controller = new GestorController(service);
      const res = makeRes();

      await (controller as any).importarHistoricoCsv(
        makeReq({}, {}, headersGestor, arquivoCsv),
        res,
      );

      expect((service as any).importarHistoricoCsv).toHaveBeenCalledWith(arquivoCsv);
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Erro interno ao processar o arquivo de importacao.',
      });
    });
  });

  // GET /gestor/:rm/alunos/filtros

  describe('GET /gestor/:rm/alunos/filtros', () => {
    const filtros = {
      idade_min: '18',
      idade_max: '25',
      empregabilidade: 'Empregado',
      id_turma: '1',
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
        idTurma: 1,
        frequencia: true,
        empregabilidade: {
          empresa: 'Tech Corp',
          cargo: 'Desenvolvedor',
          faixa_salarial: 'R$: 3000,00',
        },
      },
    ];

    it('deve retornar 200 com os alunos filtrados', async () => {
      const service = makeService();
      (service as any).filtrarAlunos.mockResolvedValueOnce(alunosFiltrados);

      const controller = new GestorController(service);
      const res = makeRes();

      await (controller as any).filtrarAlunos(
        makeReq({ rm: '1010' }, {}, {}, undefined, filtros),
        res,
      );

      expect((service as any).filtrarAlunos).toHaveBeenCalledWith(1010, expect.any(Object));
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(alunosFiltrados);
    });

    it('deve retornar 404 quando nenhum aluno corresponder aos filtros', async () => {
      const service = makeService();
      (service as any).filtrarAlunos.mockResolvedValueOnce([]);

      const controller = new GestorController(service);
      const res = makeRes();

      await (controller as any).filtrarAlunos(
        makeReq({ rm: '1010' }, {}, {}, undefined, filtros),
        res,
      );

      expect((service as any).filtrarAlunos).toHaveBeenCalledWith(1010, expect.any(Object));
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ error: 'Nenhum aluno encontrado.' });
    });

    it('deve retornar 400 quando RM for invalido', async () => {
      const service = makeService();
      const controller = new GestorController(service);
      const res = makeRes();

      await (controller as any).filtrarAlunos(
        makeReq({ rm: 'abc' }, {}, {}, undefined, filtros),
        res,
      );

      expect((service as any).filtrarAlunos).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: 'RM invalido.' });
    });

    it('deve retornar 400 quando filtro numerico for invalido', async () => {
      const service = makeService();
      const controller = new GestorController(service);
      const res = makeRes();

      await (controller as any).filtrarAlunos(
        makeReq({ rm: '1010' }, {}, {}, undefined, { idade_min: 'abc' }),
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
      const controller = new GestorController(service);
      const res = makeRes();

      await (controller as any).filtrarAlunos(
        makeReq({ rm: '1010' }, {}, {}, undefined, { curso: 'Backend' }),
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
      const controller = new GestorController(service);
      const res = makeRes();

      await (controller as any).filtrarAlunos(
        makeReq(
          { rm: '1010' },
          {},
          {},
          undefined,
          { idade_min: '30', idade_max: '20' },
        ),
        res,
      );

      expect((service as any).filtrarAlunos).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Filtros invalidos.',
        campos: ['idade_min', 'idade_max'],
      });
    });

    it('deve retornar 500 quando ocorrer erro inesperado ao filtrar alunos', async () => {
      const service = makeService();
      (service as any).filtrarAlunos.mockRejectedValueOnce(new Error('Erro no banco'));

      const controller = new GestorController(service);
      const res = makeRes();

      await (controller as any).filtrarAlunos(
        makeReq({ rm: '1010' }, {}, {}, undefined, filtros),
        res,
      );

      expect((service as any).filtrarAlunos).toHaveBeenCalledWith(1010, expect.any(Object));
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: 'Erro interno ao filtrar alunos.' });
    });
  });
});
