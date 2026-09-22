import request from 'supertest';
import pool from '../../database/connection';
import { AlunoDetalhadoGestor, AlunoGestor } from '../../database/models/gestor.model';
import app from '../../app';

jest.mock('../../database/connection', () => ({
  __esModule: true,
  default: {
    query: jest.fn(),
  },
}));

describe('GestorRoutes', () => {
  const queryMock = pool.query as jest.Mock;

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

  it('GET /gestor/:rm/alunos deve retornar alunos do gestor', async () => {
    queryMock.mockResolvedValueOnce({ rows: alunos });

    const response = await request(app).get('/gestor/1010/alunos');

    expect(response.status).toBe(200);
    expect(response.body).toEqual(alunos);
    expect(queryMock).toHaveBeenCalledWith(
      expect.stringContaining('WHERE g.rm = $1'),
      [1010],
    );
  });

  it('GET /gestor/:rm/alunos deve retornar 404 quando nenhum aluno for encontrado', async () => {
    queryMock.mockResolvedValueOnce({ rows: [] });

    const response = await request(app).get('/gestor/1010/alunos');

    expect(response.status).toBe(404);
    expect(response.body).toEqual({ error: 'Nenhum aluno encontrado.' });
  });

  it('GET /gestor/:rm/alunos deve retornar 400 quando RM for invalido', async () => {
    const response = await request(app).get('/gestor/abc/alunos');

    expect(response.status).toBe(400);
    expect(response.body).toEqual({ error: 'RM invalido.' });
    expect(queryMock).not.toHaveBeenCalled();
  });

  it('GET /gestor/:rm/alunos deve retornar 500 quando ocorrer erro inesperado', async () => {
    queryMock.mockRejectedValueOnce(new Error('Erro no banco'));

    const response = await request(app).get('/gestor/1010/alunos');

    expect(response.status).toBe(500);
    expect(response.body).toEqual({ error: 'Erro interno ao buscar dados dos alunos.' });
  });

  describe('GET /gestor/:rm/alunos/filtros', () => {
    it('deve retornar alunos filtrados do gestor', async () => {
      queryMock.mockResolvedValueOnce({ rows: [alunos[0]] });

      const response = await request(app)
        .get('/gestor/1010/alunos/filtros')
        .query({
          idade_min: '18',
          idade_max: '25',
          empregabilidade: 'Desenvolvedor',
          id_turma: '1',
          eventos_min: '2',
          eventos_max: '10',
          genero: 'Masculino',
        });

      expect(response.status).toBe(200);
      expect(response.body).toEqual([alunos[0]]);
      expect(queryMock).toHaveBeenCalledWith(
        expect.stringContaining('ORDER BY a.ra'),
        [
          1010,
          18,
          25,
          '%Desenvolvedor%',
          1,
          '%Masculino%',
          2,
          10,
        ],
      );
    });

    it('deve retornar 404 quando nenhum aluno corresponder aos filtros', async () => {
      queryMock.mockResolvedValueOnce({ rows: [] });

      const response = await request(app)
        .get('/gestor/1010/alunos/filtros')
        .query({ id_turma: '99' });

      expect(response.status).toBe(404);
      expect(response.body).toEqual({ error: 'Nenhum aluno encontrado.' });
    });

    it('deve retornar 400 quando RM for invalido', async () => {
      const response = await request(app)
        .get('/gestor/abc/alunos/filtros')
        .query({ idade_min: '18' });

      expect(response.status).toBe(400);
      expect(response.body).toEqual({ error: 'RM invalido.' });
      expect(queryMock).not.toHaveBeenCalled();
    });

    it('deve retornar 400 quando filtro numerico for invalido', async () => {
      const response = await request(app)
        .get('/gestor/1010/alunos/filtros')
        .query({ idade_min: 'abc' });

      expect(response.status).toBe(400);
      expect(response.body).toEqual({
        error: 'Filtros invalidos.',
        campos: ['idade_min'],
      });
      expect(queryMock).not.toHaveBeenCalled();
    });

    it('deve retornar 400 quando filtro nao for permitido', async () => {
      const response = await request(app)
        .get('/gestor/1010/alunos/filtros')
        .query({ curso: 'Backend' });

      expect(response.status).toBe(400);
      expect(response.body).toEqual({
        error: 'Filtros invalidos.',
        campos: ['curso'],
      });
      expect(queryMock).not.toHaveBeenCalled();
    });

    it('deve retornar 400 quando filtro minimo for maior que o maximo', async () => {
      const response = await request(app)
        .get('/gestor/1010/alunos/filtros')
        .query({ eventos_min: '10', eventos_max: '2' });

      expect(response.status).toBe(400);
      expect(response.body).toEqual({
        error: 'Filtros invalidos.',
        campos: ['eventos_min', 'eventos_max'],
      });
      expect(queryMock).not.toHaveBeenCalled();
    });

    it('deve retornar 500 quando ocorrer erro inesperado ao filtrar alunos', async () => {
      queryMock.mockRejectedValueOnce(new Error('Erro no banco'));

      const response = await request(app)
        .get('/gestor/1010/alunos/filtros')
        .query({ genero: 'Masculino' });

      expect(response.status).toBe(500);
      expect(response.body).toEqual({ error: 'Erro interno ao filtrar alunos.' });
    });
  });

  it('GET /gestor/:rm/alunos/:ra deve retornar aluno especifico do gestor', async () => {
    queryMock.mockResolvedValueOnce({ rows: [alunoDetalhado] });

    const response = await request(app).get('/gestor/1010/alunos/1');

    expect(response.status).toBe(200);
    expect(response.body).toEqual(alunoDetalhado);
    expect(queryMock).toHaveBeenCalledWith(
      expect.stringContaining('WHERE a.ra = $2'),
      [1010, 1],
    );
  });

  it('GET /gestor/:rm/alunos/:ra deve retornar 404 quando aluno nao for encontrado', async () => {
    queryMock.mockResolvedValueOnce({ rows: [] });

    const response = await request(app).get('/gestor/1010/alunos/99');

    expect(response.status).toBe(404);
    expect(response.body).toEqual({ error: 'Nenhum aluno encontrado.' });
  });

  it('GET /gestor/:rm/alunos/:ra deve retornar 400 quando RM for invalido', async () => {
    const response = await request(app).get('/gestor/abc/alunos/1');

    expect(response.status).toBe(400);
    expect(response.body).toEqual({ error: 'RM invalido.' });
    expect(queryMock).not.toHaveBeenCalled();
  });

  it('GET /gestor/:rm/alunos/:ra deve retornar 400 quando RA for invalido', async () => {
    const response = await request(app).get('/gestor/1010/alunos/abc');

    expect(response.status).toBe(400);
    expect(response.body).toEqual({ error: 'RA invalido.' });
    expect(queryMock).not.toHaveBeenCalled();
  });

  it('GET /gestor/:rm/alunos/:ra deve retornar 500 quando ocorrer erro inesperado', async () => {
    queryMock.mockRejectedValueOnce(new Error('Erro no banco'));

    const response = await request(app).get('/gestor/1010/alunos/1');

    expect(response.status).toBe(500);
    expect(response.body).toEqual({ error: 'Erro interno ao buscar dados dos alunos.' });
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

    it('POST /gestor/comunicados deve retornar 201 quando comunicado for enviado e registrado', async () => {
      queryMock
        .mockResolvedValueOnce({ rows: alunosComEmail })
        .mockResolvedValueOnce({ rowCount: 1 });

      const response = await request(app)
        .post('/gestor/comunicados')
        .set('Content-Type', 'application/json')
        .set('x-perfil', 'gestor')
        .send(comunicado);

      expect(response.status).toBe(201);
      expect(response.body).toEqual({
        message: 'Comunicado enviado e registrado com sucesso.',
      });
      expect(queryMock).toHaveBeenCalled();
    });

    it('POST /gestor/comunicados deve retornar 400 quando campos obrigatorios estiverem ausentes', async () => {
      const response = await request(app)
        .post('/gestor/comunicados')
        .set('Content-Type', 'application/json')
        .set('x-perfil', 'gestor')
        .send({
          titulo: 'Hackathon Pulse Mais 2026',
          conteudo: 'Confirme sua presenca ate 20/06.',
        });

      expect(response.status).toBe(400);
      expect(response.body).toEqual({
        error: 'Campos obrigatórios ausentes: titulo, conteudo, destinatarios.',
      });
      expect(queryMock).not.toHaveBeenCalled();
    });

    it('POST /gestor/comunicados deve retornar 400 quando destinatarios tiver valor nao permitido', async () => {
      const response = await request(app)
        .post('/gestor/comunicados')
        .set('Content-Type', 'application/json')
        .set('x-perfil', 'gestor')
        .send({
          ...comunicado,
          destinatarios: 'mentores',
        });

      expect(response.status).toBe(400);
      expect(response.body).toEqual({
        error: 'Destinatarios invalido. Valores permitidos: ativos, ex-alunos, todos.',
      });
      expect(queryMock).not.toHaveBeenCalled();
    });

    it('POST /gestor/comunicados deve retornar 400 quando titulo ultrapassar 100 caracteres', async () => {
      const response = await request(app)
        .post('/gestor/comunicados')
        .set('Content-Type', 'application/json')
        .set('x-perfil', 'gestor')
        .send({
          ...comunicado,
          titulo: 'a'.repeat(101),
        });

      expect(response.status).toBe(400);
      expect(response.body).toEqual({
        error: 'Titulo deve ter no maximo 100 caracteres.',
      });
      expect(queryMock).not.toHaveBeenCalled();
    });

    it('POST /gestor/comunicados deve retornar 403 quando perfil nao tiver permissao', async () => {
      const response = await request(app)
        .post('/gestor/comunicados')
        .set('Content-Type', 'application/json')
        .set('x-perfil', 'aluno')
        .send(comunicado);

      expect(response.status).toBe(403);
      expect(response.body).toEqual({
        error: 'Perfil sem permissão para enviar comunicados.',
      });
      expect(queryMock).not.toHaveBeenCalled();
    });

    it('POST /gestor/comunicados deve retornar 500 quando ocorrer erro inesperado', async () => {
      queryMock.mockRejectedValueOnce(new Error('Erro no banco'));

      const response = await request(app)
        .post('/gestor/comunicados')
        .set('Content-Type', 'application/json')
        .set('x-perfil', 'gestor')
        .send(comunicado);

      expect(response.status).toBe(500);
      expect(response.body).toEqual({
        error: 'Erro interno ao enviar ou registrar comunicado.',
      });
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

    const csvValido = [
      cabecalhoCsv,
      '101,Carlos Sales,12345678900,carlos.sales@gmail.com,11999999999,Masculino,2000-01-01,2024-02-01,Aluno,true',
      '102,Ana Lima,98765432100,ana.lima@gmail.com,11988888888,Feminino,2001-02-02,2024-02-01,Aluno,true',
    ].join('\n');

    const anexarCsv = (perfil: string, conteudo: string = csvValido, filename = 'historico_alunos.csv') =>
      request(app)
        .post('/gestor/importacao')
        .set('x-perfil', perfil)
        .set('Cookie', ['session_id=token-teste'])
        .attach('file', Buffer.from(conteudo), {
          filename,
          contentType: filename.endsWith('.csv') ? 'text/csv' : 'text/plain',
        });

    it('POST /gestor/importacao deve retornar 200 com resumo da importacao e conflitos', async () => {
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

      const response = await anexarCsv('gestor');

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        importados: 1,
        conflitos: [
          {
            ra: 101,
            motivo: 'CPF ja cadastrado',
          },
        ],
        ignorados: 0,
      });
      expect(queryMock).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO aluno'),
        expect.arrayContaining([
          'Ana Lima',
          '98765432100',
          'ana.lima@gmail.com',
        ]),
      );
    });

    it('POST /gestor/importacao deve retornar 400 quando arquivo estiver ausente', async () => {
      const response = await request(app)
        .post('/gestor/importacao')
        .set('x-perfil', 'gestor')
        .set('Cookie', ['session_id=token-teste']);

      expect(response.status).toBe(400);
      expect(response.body).toEqual({
        error: 'Arquivo ausente ou formato invalido.',
      });
      expect(queryMock).not.toHaveBeenCalled();
    });

    it('POST /gestor/importacao deve retornar 400 quando arquivo nao for CSV', async () => {
      const response = await anexarCsv('gestor', 'conteudo qualquer', 'historico_alunos.txt');

      expect(response.status).toBe(400);
      expect(response.body).toEqual({
        error: 'Arquivo ausente ou formato invalido.',
      });
      expect(queryMock).not.toHaveBeenCalled();
    });

    it('POST /gestor/importacao deve retornar 403 quando perfil nao tiver permissao', async () => {
      const response = await anexarCsv('aluno');

      expect(response.status).toBe(403);
      expect(response.body).toEqual({
        error: 'Perfil sem permissao para realizar importacoes.',
      });
      expect(queryMock).not.toHaveBeenCalled();
    });

    it('POST /gestor/importacao deve retornar 422 quando estrutura do CSV for invalida', async () => {
      const response = await anexarCsv(
        'gestor',
        'nome,email\nCarlos Sales,carlos.sales@gmail.com',
      );

      expect(response.status).toBe(422);
      expect(response.body).toEqual({
        error: 'Estrutura do CSV nao corresponde ao modelo esperado.',
      });
      expect(queryMock).not.toHaveBeenCalled();
    });

    it('POST /gestor/importacao deve preencher dados faltantes com placeholders e gerar RA automatico', async () => {
      queryMock
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({ rowCount: 1 });

      const response = await anexarCsv(
        'gestor',
        [
          cabecalhoCsv,
          ',Aluno Sem Dados,,,,Masculino,2001-02-02,2024-02-01,Aluno,true',
        ].join('\n'),
      );

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        importados: 1,
        conflitos: [],
        ignorados: 0,
      });
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
    });

    it('POST /gestor/importacao deve retornar 500 quando ocorrer erro inesperado', async () => {
      queryMock.mockRejectedValueOnce(new Error('Erro no banco'));

      const response = await anexarCsv('gestor');

      expect(response.status).toBe(500);
      expect(response.body).toEqual({
        error: 'Erro interno ao processar o arquivo de importacao.',
      });
    });
  });
});
