import pool from '../../database/connection';
import { AlunoDetalhadoGestor, AlunoGestor, Gestor } from '../../database/models/gestor.model';
import { GestorRepository } from '../../repositories/gestor.repository';

jest.mock('../../database/connection', () => ({
  __esModule: true,
  default: {
    query: jest.fn(),
  },
}));

describe('GestorRepository', () => {
  const queryMock = pool.query as jest.Mock;

  const gestor: Gestor = {
    rm: 1010,
    nome: 'Eduardo Freitas',
    email: 'eduardo.freitaspulsemais@gmail.com',
  };

  const alunos: AlunoGestor[] = [
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
    {
      ra: 2,
      nome: 'Ana Lima',
      status: 'Em andamento',
      nivel_formacao: 'Ensino Medio',
      idTurma: 1,
      frequencia: false,
      empregabilidade: null,
    },
  ];

  const alunoDetalhado: AlunoDetalhadoGestor = {
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

  beforeEach(() => {
    queryMock.mockReset();
  });

  it('deve buscar gestor por RM usando query parametrizada', async () => {
    queryMock.mockResolvedValueOnce({ rows: [gestor] });
    const repository = new GestorRepository();

    const resultado = await repository.buscarPorRm(1010);

    expect(queryMock).toHaveBeenCalledWith(
      'SELECT rm, nome, email FROM gestor WHERE rm = $1',
      [1010],
    );
    expect(resultado).toEqual(gestor);
  });

  it('deve retornar null quando nenhum gestor for encontrado', async () => {
    queryMock.mockResolvedValueOnce({ rows: [] });
    const repository = new GestorRepository();

    const resultado = await repository.buscarPorRm(9999);

    expect(queryMock).toHaveBeenCalledWith(
      'SELECT rm, nome, email FROM gestor WHERE rm = $1',
      [9999],
    );
    expect(resultado).toBeNull();
  });

  it('deve listar alunos do gestor usando RM como parametro', async () => {
    queryMock.mockResolvedValueOnce({ rows: alunos });
    const repository = new GestorRepository();

    const resultado = await repository.listarAlunos(1010);

    expect(queryMock).toHaveBeenCalledWith(
      expect.stringContaining('WHERE g.rm = $1'),
      [1010],
    );
    expect(resultado).toEqual(alunos);
  });

  it('deve retornar lista vazia quando nenhum aluno for encontrado', async () => {
    queryMock.mockResolvedValueOnce({ rows: [] });
    const repository = new GestorRepository();

    const resultado = await repository.listarAlunos(1010);

    expect(queryMock).toHaveBeenCalledWith(
      expect.stringContaining('WHERE g.rm = $1'),
      [1010],
    );
    expect(resultado).toEqual([]);
  });

  it('deve buscar aluno especifico do gestor usando RM e RA como parametros', async () => {
    queryMock.mockResolvedValueOnce({ rows: [alunoDetalhado] });
    const repository = new GestorRepository();

    const resultado = await repository.buscarAlunoPorRa(1010, 1);

    expect(queryMock).toHaveBeenCalledWith(
      expect.stringContaining('WHERE a.ra = $2'),
      [1010, 1],
    );
    expect(queryMock).toHaveBeenCalledWith(
      expect.stringContaining('WHERE g.rm = $1'),
      [1010, 1],
    );
    expect(resultado).toEqual(alunoDetalhado);
  });

  it('deve retornar null quando aluno especifico nao for encontrado', async () => {
    queryMock.mockResolvedValueOnce({ rows: [] });
    const repository = new GestorRepository();

    const resultado = await repository.buscarAlunoPorRa(1010, 99);

    expect(queryMock).toHaveBeenCalledWith(
      expect.stringContaining('WHERE a.ra = $2'),
      [1010, 99],
    );
    expect(resultado).toBeNull();
  });

  describe('POST /gestor/comunicados', () => {
    const comunicado = {
      titulo: 'Hackathon Pulse Mais 2026',
      conteudo: 'Confirme sua presenca ate 20/06.',
      destinatarios: 'ativos',
    };

    const alunosComEmail = [
      {
        ra: 1,
        nome: 'Carlos Sales',
        email_primario: 'carlos.sales@gmail.com',
      },
      {
        ra: 2,
        nome: 'Ana Lima',
        email_primario: 'ana.lima@gmail.com',
      },
    ];

    it('deve buscar alunos ativos com email cadastrado e registrar comunicado no historico', async () => {
      queryMock
        .mockResolvedValueOnce({ rows: alunosComEmail })
        .mockResolvedValueOnce({ rowCount: 1 });
      const repository = new GestorRepository();

      await (repository as any).enviarComunicado(comunicado);

      expect(queryMock).toHaveBeenCalledTimes(2);

      const sqlBuscaDestinatarios = queryMock.mock.calls[0][0] as string;
      expect(sqlBuscaDestinatarios).toEqual(expect.stringContaining('FROM aluno'));
      expect(sqlBuscaDestinatarios).toEqual(expect.stringContaining('email_primario'));
      expect(sqlBuscaDestinatarios).toEqual(expect.stringContaining('status'));

      expect(queryMock).toHaveBeenNthCalledWith(
        2,
        expect.stringMatching(/INSERT INTO comunicad/i),
        expect.arrayContaining([
          'Hackathon Pulse Mais 2026',
          'Confirme sua presenca ate 20/06.',
          'ativos',
        ]),
      );
    });

    it('deve filtrar ex-alunos quando destinatarios for ex-alunos', async () => {
      queryMock
        .mockResolvedValueOnce({ rows: alunosComEmail })
        .mockResolvedValueOnce({ rowCount: 1 });
      const repository = new GestorRepository();

      await (repository as any).enviarComunicado({
        ...comunicado,
        destinatarios: 'ex-alunos',
      });

      const sqlBuscaDestinatarios = queryMock.mock.calls[0][0] as string;
      expect(sqlBuscaDestinatarios).toEqual(expect.stringContaining('FROM aluno'));
      expect(sqlBuscaDestinatarios).toEqual(expect.stringContaining('email_primario'));
      expect(sqlBuscaDestinatarios).toEqual(expect.stringContaining('ex_aluno'));
      expect(queryMock).toHaveBeenNthCalledWith(
        2,
        expect.stringMatching(/INSERT INTO comunicad/i),
        expect.arrayContaining([
          'Hackathon Pulse Mais 2026',
          'Confirme sua presenca ate 20/06.',
          'ex-alunos',
        ]),
      );
    });

    it('deve buscar todos os alunos com email quando destinatarios for todos', async () => {
      queryMock
        .mockResolvedValueOnce({ rows: alunosComEmail })
        .mockResolvedValueOnce({ rowCount: 1 });
      const repository = new GestorRepository();

      await (repository as any).enviarComunicado({
        ...comunicado,
        destinatarios: 'todos',
      });

      const sqlBuscaDestinatarios = queryMock.mock.calls[0][0] as string;
      expect(sqlBuscaDestinatarios).toEqual(expect.stringContaining('FROM aluno'));
      expect(sqlBuscaDestinatarios).toEqual(expect.stringContaining('email_primario'));
      expect(queryMock).toHaveBeenNthCalledWith(
        2,
        expect.stringMatching(/INSERT INTO comunicad/i),
        expect.arrayContaining([
          'Hackathon Pulse Mais 2026',
          'Confirme sua presenca ate 20/06.',
          'todos',
        ]),
      );
    });

    it('deve propagar erro quando falhar ao buscar destinatarios ou registrar comunicado', async () => {
      queryMock.mockRejectedValueOnce(new Error('Erro no banco'));
      const repository = new GestorRepository();

      await expect((repository as any).enviarComunicado(comunicado)).rejects.toThrow(
        'Erro no banco',
      );
    });
  });

  describe('POST /gestor/importacao', () => {
    const cabecalhoCsv = [
      'ra',
      'nome',
      'cpf',
      'email_primario',
      'tel_primario',
      'genero',
      'data_nasc',
      'data_ingresso',
      'categoria',
      'status',
    ].join(',');

    const arquivoCsv = {
      originalname: 'historico_alunos.csv',
      mimetype: 'text/csv',
      buffer: Buffer.from([
        cabecalhoCsv,
        '101,Carlos Sales,12345678900,carlos.sales@gmail.com,11999999999,Masculino,2000-01-01,2024-02-01,Aluno,true',
        '102,Ana Lima,98765432100,ana.lima@gmail.com,11988888888,Feminino,2001-02-02,2024-02-01,Aluno,true',
      ].join('\n')),
    };

    it('deve importar registros sem conflito e sinalizar conflitos sem sobrescrever existentes', async () => {
      queryMock
        .mockResolvedValueOnce({
          rows: [
            {
              ra: 999,
              cpf: '12345678900',
              email_primario: 'existente@gmail.com',
            },
          ],
        })
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({ rowCount: 1 });
      const repository = new GestorRepository();

      const resultado = await (repository as any).importarHistoricoCsv(arquivoCsv);

      expect(queryMock).toHaveBeenNthCalledWith(
        1,
        expect.stringContaining('FROM aluno'),
        [101, '12345678900', 'carlos.sales@gmail.com'],
      );
      expect(queryMock).toHaveBeenNthCalledWith(
        2,
        expect.stringContaining('FROM aluno'),
        [102, '98765432100', 'ana.lima@gmail.com'],
      );
      expect(queryMock).toHaveBeenNthCalledWith(
        3,
        expect.stringContaining('INSERT INTO aluno'),
        expect.arrayContaining([
          'Ana Lima',
          '98765432100',
          'ana.lima@gmail.com',
        ]),
      );
      expect(resultado).toEqual({
        importados: 1,
        conflitos: [
          {
            ra: 101,
            motivo: 'CPF ja cadastrado',
          },
        ],
        ignorados: 0,
      });
    });

    it('deve contar registros ignorados quando linha estiver incompleta', async () => {
      const arquivoComLinhaIncompleta = {
        ...arquivoCsv,
        buffer: Buffer.from([
          cabecalhoCsv,
          '102,Ana Lima,98765432100,ana.lima@gmail.com,11988888888,Feminino,2001-02-02,2024-02-01,Aluno,true',
          '103,Registro Incompleto',
        ].join('\n')),
      };
      queryMock
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({ rowCount: 1 });
      const repository = new GestorRepository();

      const resultado = await (repository as any).importarHistoricoCsv(
        arquivoComLinhaIncompleta,
      );

      expect(queryMock).toHaveBeenCalledTimes(2);
      expect(resultado).toEqual({
        importados: 1,
        conflitos: [],
        ignorados: 1,
      });
    });

    it('deve preencher campos obrigatorios faltantes com marcadores e deixar o RA automatico', async () => {
      const arquivoComCamposFaltantes = {
        ...arquivoCsv,
        buffer: Buffer.from([
          cabecalhoCsv,
          ',Aluno Sem Dados,,, ,Masculino,2001-02-02,2024-02-01,Aluno,true',
        ].join('\n')),
      };
      queryMock
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({ rowCount: 1 });
      const repository = new GestorRepository();

      const resultado = await (repository as any).importarHistoricoCsv(arquivoComCamposFaltantes);

      expect(queryMock).toHaveBeenNthCalledWith(
        1,
        expect.stringContaining('FROM aluno'),
        [null, '##1', 'naocoletado1'],
      );
      expect(queryMock).toHaveBeenNthCalledWith(
        2,
        expect.stringContaining('INSERT INTO aluno'),
        [
          'Aluno Sem Dados',
          '##1',
          'naocoletado1',
          '##',
          'Masculino',
          '2001-02-02',
          '2024-02-01',
          'Aluno',
          true,
        ],
      );
      expect(resultado).toEqual({
        importados: 1,
        conflitos: [],
        ignorados: 0,
      });
    });

    it('deve converter datas nao coletadas para um valor padrao valido no banco', async () => {
      const arquivoSemDatas = {
        ...arquivoCsv,
        buffer: Buffer.from([
          cabecalhoCsv,
          ',Aluno Sem Datas,#1,naocoletado1,#,NÃ£o coletado,NÃ£o coletado,,NÃ£o coletado,',
        ].join('\n')),
      };
      queryMock
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({ rowCount: 1 });
      const repository = new GestorRepository();

      const resultado = await (repository as any).importarHistoricoCsv(arquivoSemDatas);

      expect(queryMock).toHaveBeenNthCalledWith(
        2,
        expect.stringContaining('INSERT INTO aluno'),
        [
          'Aluno Sem Datas',
          '#1',
          'naocoletado1',
          '#',
          'NÃ£o coletado',
          '1900-01-01',
          '1900-01-01',
          'NÃ£o coletado',
          false,
        ],
      );
      expect(resultado).toEqual({
        importados: 1,
        conflitos: [],
        ignorados: 0,
      });
    });

    it('deve converter datas em formato invalido para um valor padrao valido no banco', async () => {
      const arquivoComDatasInvalidas = {
        ...arquivoCsv,
        buffer: Buffer.from([
          cabecalhoCsv,
          ',Aluno Datas Invalidas,#2,naocoletado2,#,Masculino,09/2024,#REF!,Aluno,',
        ].join('\n')),
      };
      queryMock
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({ rowCount: 1 });
      const repository = new GestorRepository();

      const resultado = await (repository as any).importarHistoricoCsv(arquivoComDatasInvalidas);

      expect(queryMock).toHaveBeenNthCalledWith(
        2,
        expect.stringContaining('INSERT INTO aluno'),
        [
          'Aluno Datas Invalidas',
          '#2',
          'naocoletado2',
          '#',
          'Masculino',
          '1900-01-01',
          '1900-01-01',
          'Aluno',
          false,
        ],
      );
      expect(resultado).toEqual({
        importados: 1,
        conflitos: [],
        ignorados: 0,
      });
    });

    it('deve lancar erro 422 quando estrutura do CSV nao corresponder ao modelo esperado', async () => {
      const arquivoInvalido = {
        ...arquivoCsv,
        buffer: Buffer.from('nome,email\nCarlos Sales,carlos.sales@gmail.com'),
      };
      const repository = new GestorRepository();

      await expect((repository as any).importarHistoricoCsv(arquivoInvalido)).rejects.toMatchObject({
        statusCode: 422,
        message: 'Estrutura do CSV nao corresponde ao modelo esperado.',
      });
      expect(queryMock).not.toHaveBeenCalled();
    });
  });
  // GET /gestor/:rm/alunos/filtros

  describe('GET /gestor/:rm/alunos/filtros', () => {
    const filtros = {
      idade_min: 18,
      idade_max: 25,
      empregabilidade: 'Empregado',
      id_turma: 1,
      localizacao: 'Paraisopolis',
      eventos_min: 2,
      eventos_max: 10,
      genero: 'M',
    };

    const alunosFiltrados: AlunoGestor[] = [
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

    it('deve filtrar alunos do gestor usando rm e filtros como parametros', async () => {
      queryMock.mockResolvedValueOnce({ rows: alunosFiltrados });
      const repository = new GestorRepository();

      const resultado = await (repository as any).filtrarAlunos(1010, filtros);

      expect(queryMock).toHaveBeenCalledWith(
        expect.stringContaining('WHERE g.rm = $1'),
        expect.arrayContaining([1010]),
      );
      expect(resultado).toEqual(alunosFiltrados);
    });

    it('deve retornar lista vazia quando nenhum aluno corresponder aos filtros', async () => {
      queryMock.mockResolvedValueOnce({ rows: [] });
      const repository = new GestorRepository();

      const resultado = await (repository as any).filtrarAlunos(1010, filtros);

      expect(queryMock).toHaveBeenCalledWith(
        expect.stringContaining('WHERE g.rm = $1'),
        expect.arrayContaining([1010]),
      );
      expect(resultado).toEqual([]);
    });

    it('deve propagar erro quando falhar ao filtrar alunos', async () => {
      queryMock.mockRejectedValueOnce(new Error('Erro no banco'));
      const repository = new GestorRepository();

      await expect(
        (repository as any).filtrarAlunos(1010, filtros),
      ).rejects.toThrow('Erro no banco');
    });
  });
});
