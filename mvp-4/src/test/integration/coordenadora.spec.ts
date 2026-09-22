import request from 'supertest';
import pool from '../../database/connection';
import app from '../../app';
import { AlunoCoordenadora, Coordenadora, Relatorio } from '../../database/models/coordenadora.model';

jest.mock('../../database/connection', () => ({
  __esModule: true,
  default: {
    query: jest.fn(),
  },
}));

describe('CoordenadoraRoutes', () => {
  const queryMock = pool.query as jest.Mock;

  const coordenadora: Coordenadora = {
    rm: 1011,
    nome: 'Denise Soares',
    cargo: 'Coordenadora Pedagogica',
    setor: 'Gestao de pessoas',
    email: 'denise.soarespulsemais@gmail.com',
  };

  const alunos: AlunoCoordenadora[] = [
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

  const relatorios: Relatorio[] = [
    {
      id_relatorio: 1,
      info_simplificada: 'Aluno demonstrou evoluÃ§Ã£o significativa.',
      observacoes: 'Participou ativamente das atividades em grupo.',
      data: '2026-05-25',
      id_aluno: 101,
      id_psicologo: 2,
    },
  ];

  beforeEach(() => {
    queryMock.mockReset();
  });

  it('GET /coordenadora/:rm deve retornar coordenadora encontrada', async () => {
    queryMock.mockResolvedValueOnce({ rows: [coordenadora] });

    const response = await request(app).get('/coordenadora/1011');

    expect(response.status).toBe(200);
    expect(response.body).toEqual(coordenadora);
    expect(queryMock).toHaveBeenCalledWith(
      expect.stringContaining('FROM coordenador'),
      [1011],
    );
  });

  it('GET /coordenadora/:rm deve retornar 404 quando coordenadora nao existir', async () => {
    queryMock.mockResolvedValueOnce({ rows: [] });

    const response = await request(app).get('/coordenadora/9999');

    expect(response.status).toBe(404);
    expect(response.body).toEqual({ error: 'Coordenadora não encontrado.' });
  });

  it('GET /coordenadora/:rm deve retornar 500 quando ocorrer erro inesperado', async () => {
    queryMock.mockRejectedValueOnce(new Error('Erro no banco'));

    const response = await request(app).get('/coordenadora/1011');

    expect(response.status).toBe(500);
    expect(response.body).toEqual({ error: 'Erro interno ao buscar Coodenadora.' });
  });

  it('GET /coordenadora/:rm/alunos deve retornar alunos vinculados a coordenadora', async () => {
    queryMock.mockResolvedValueOnce({ rows: alunos });

    const response = await request(app).get('/coordenadora/1011/alunos');

    expect(response.status).toBe(200);
    expect(response.body).toEqual(alunos);
    expect(queryMock).toHaveBeenCalledWith(
      expect.stringContaining('WHERE coordenador.rm = $1'),
      [1011],
    );
  });

  it('GET /coordenadora/:rm/alunos deve retornar 404 quando nenhum aluno for encontrado', async () => {
    queryMock.mockResolvedValueOnce({ rows: [] });

    const response = await request(app).get('/coordenadora/1011/alunos');

    expect(response.status).toBe(404);
    expect(response.body).toEqual({ error: 'Nenhum aluno encontrado.' });
  });

  it('GET /coordenadora/:rm/alunos deve retornar 500 quando ocorrer erro inesperado', async () => {
    queryMock.mockRejectedValueOnce(new Error('Erro no banco'));

    const response = await request(app).get('/coordenadora/1011/alunos');

    expect(response.status).toBe(500);
    expect(response.body).toEqual({ error: 'Erro interno ao buscar alunos.' });
  });

  describe('GET /coordenadora/:rm/alunos/filtros', () => {
    it('deve retornar alunos filtrados da coordenadora', async () => {
      queryMock.mockResolvedValueOnce({ rows: [alunos[0]] });

      const response = await request(app)
        .get('/coordenadora/1011/alunos/filtros')
        .query({
          status: 'Capacitado',
          id_turma: '1',
        });

      expect(response.status).toBe(200);
      expect(response.body).toEqual([alunos[0]]);
      expect(queryMock).toHaveBeenCalledWith(
        expect.stringContaining('WHERE coordenador.rm = $1'),
        expect.arrayContaining([1011, 'Capacitado', 1]),
      );
    });

    it('deve retornar 404 quando nenhum aluno corresponder aos filtros', async () => {
      queryMock.mockResolvedValueOnce({ rows: [] });

      const response = await request(app)
        .get('/coordenadora/1011/alunos/filtros')
        .query({ status: 'Inexistente' });

      expect(response.status).toBe(404);
      expect(response.body).toEqual({ error: 'Nenhum aluno encontrado.' });
    });

    it('deve retornar 400 quando RM for invalido', async () => {
      const response = await request(app)
        .get('/coordenadora/abc/alunos/filtros')
        .query({ status: 'Capacitado' });

      expect(response.status).toBe(400);
      expect(response.body).toEqual({ error: 'RM invalido.' });
      expect(queryMock).not.toHaveBeenCalled();
    });

    it('deve retornar 400 quando filtro numerico for invalido', async () => {
      const response = await request(app)
        .get('/coordenadora/1011/alunos/filtros')
        .query({ id_turma: 'abc' });

      expect(response.status).toBe(400);
      expect(response.body).toEqual({
        error: 'Filtros invalidos.',
        campos: ['id_turma'],
      });
      expect(queryMock).not.toHaveBeenCalled();
    });

    it('deve retornar 400 quando filtro nao for permitido', async () => {
      const response = await request(app)
        .get('/coordenadora/1011/alunos/filtros')
        .query({ curso: 'Backend' });

      expect(response.status).toBe(400);
      expect(response.body).toEqual({
        error: 'Filtros invalidos.',
        campos: ['curso'],
      });
      expect(queryMock).not.toHaveBeenCalled();
    });

    it('deve retornar 500 quando ocorrer erro inesperado ao filtrar alunos', async () => {
      queryMock.mockRejectedValueOnce(new Error('Erro no banco'));

      const response = await request(app)
        .get('/coordenadora/1011/alunos/filtros')
        .query({ status: 'Capacitado' });

      expect(response.status).toBe(500);
      expect(response.body).toEqual({ error: 'Erro interno ao filtrar alunos.' });
    });
  });

  it('POST /coordenadora/:rm/eventos deve registrar evento com sucesso', async () => {
    const body = {
      tema: 'Workshop de Empregabilidade',
      sede: 'Sede Central',
      data: '2026-06-10',
      categoria: 'Alto Planejado',
      descricao: 'Comunicado sobre empregabilidade.',
    };
    queryMock.mockResolvedValueOnce({ rowCount: 1 });

    const response = await request(app)
      .post('/coordenadora/1011/eventos')
      .send(body);

    expect(response.status).toBe(201);
    expect(response.body).toEqual({ message: 'Evento registrado com sucesso.' });
    expect(queryMock).toHaveBeenCalledWith(
      expect.stringContaining('INSERT INTO comunicado'),
      [
        'Workshop de Empregabilidade',
        'Sede Central',
        '2026-06-10',
        'Alto Planejado',
        'Comunicado sobre empregabilidade.',
        1011,
      ],
    );
  });

  it('POST /coordenadora/:rm/eventos deve retornar 400 quando campos obrigatorios estiverem ausentes', async () => {
    const response = await request(app)
      .post('/coordenadora/1011/eventos')
      .send({
        tema: 'Workshop de Empregabilidade',
        sede: 'Sede Central',
        data: '2026-06-10',
      });

    expect(response.status).toBe(400);
    expect(response.body).toEqual({ error: 'Campos obrigatórios ausentes.' });
    expect(queryMock).not.toHaveBeenCalled();
  });

  it('POST /coordenadora/:rm/eventos deve retornar 500 quando ocorrer erro inesperado', async () => {
    const body = {
      tema: 'Workshop de Empregabilidade',
      sede: 'Sede Central',
      data: '2026-06-10',
      categoria: 'Alto Planejado',
    };
    queryMock.mockRejectedValueOnce(new Error('Erro no banco'));

    const response = await request(app)
      .post('/coordenadora/1011/eventos')
      .send(body);

    expect(response.status).toBe(500);
    expect(response.body).toEqual({ error: 'Erro interno ao registrar evento.' });
  });

  it('POST /coordenadora/:rm/alunos/:ra/frequencias deve registrar frequencia com sucesso', async () => {
    const body = {
      id_aula: 10,
      data: '2026-05-25',
      frequencia: true,
    };
    queryMock.mockResolvedValueOnce({ rowCount: 1 });

    const response = await request(app)
      .post('/coordenadora/1011/alunos/1/frequencias')
      .send(body);

    expect(response.status).toBe(201);
    expect(response.body).toEqual({ message: 'Frequência registrada com sucesso.' });
    expect(queryMock).toHaveBeenCalledWith(
      expect.stringContaining('INSERT INTO frequenta'),
      [
        1,
        10,
        '2026-05-25',
        true,
      ],
    );
  });

  it('POST /coordenadora/:rm/alunos/:ra/frequencias deve retornar 400 quando campos obrigatorios estiverem ausentes', async () => {
    const response = await request(app)
      .post('/coordenadora/1011/alunos/1/frequencias')
      .send({
        data: '2026-05-25',
        frequencia: true,
      });

    expect(response.status).toBe(400);
    expect(response.body).toEqual({ error: 'Campos obrigatórios ausentes.' });
    expect(queryMock).not.toHaveBeenCalled();
  });

  it('POST /coordenadora/:rm/alunos/:ra/frequencias deve retornar 500 quando ocorrer erro inesperado', async () => {
    const body = {
      id_aula: 10,
      data: '2026-05-25',
      frequencia: true,
    };
    queryMock.mockRejectedValueOnce(new Error('Erro no banco'));

    const response = await request(app)
      .post('/coordenadora/1011/alunos/1/frequencias')
      .send(body);

    expect(response.status).toBe(500);
    expect(response.body).toEqual({ error: 'Erro interno ao registrar frequência.' });
  });
  it('POST /coordenadora/:rm/alunos/:ra/observacoes deve registrar observacao com sucesso', async () => {
    const body = {
      info_simplificada: 'Aluno demonstrou evolução significativa.',
      observacoes: 'Participou ativamente das atividades em grupo.',
      data: '2026-05-25',
    };
    queryMock.mockResolvedValueOnce({ rowCount: 1 });

    const response = await request(app)
      .post('/coordenadora/1011/alunos/1/observacoes')
      .send(body);

    expect(response.status).toBe(201);
    expect(response.body).toEqual({ message: 'Observação registrada com sucesso.' });
    expect(queryMock).toHaveBeenCalledWith(
      expect.stringContaining('INSERT INTO relatorio'),
      [
        1,
        'Aluno demonstrou evolução significativa.',
        'Participou ativamente das atividades em grupo.',
        '2026-05-25',
        1011,
      ],
    );
  });

  it('POST /coordenadora/:rm/alunos/:ra/observacoes deve retornar 400 quando campos obrigatorios estiverem ausentes', async () => {
    const response = await request(app)
      .post('/coordenadora/1011/alunos/1/observacoes')
      .send({
        observacoes: 'Participou ativamente das atividades em grupo.',
        data: '2026-05-25',
      });

    expect(response.status).toBe(400);
    expect(response.body).toEqual({ error: 'Campos obrigatórios ausentes.' });
    expect(queryMock).not.toHaveBeenCalled();
  });

  it('POST /coordenadora/:rm/alunos/:ra/observacoes deve retornar 500 quando ocorrer erro inesperado', async () => {
    const body = {
      info_simplificada: 'Aluno demonstrou evolução significativa.',
      observacoes: 'Participou ativamente das atividades em grupo.',
      data: '2026-05-25',
    };
    queryMock.mockRejectedValueOnce(new Error('Erro no banco'));

    const response = await request(app)
      .post('/coordenadora/1011/alunos/1/observacoes')
      .send(body);

    expect(response.status).toBe(500);
    expect(response.body).toEqual({ error: 'Erro interno ao registrar observação.' });
  });

  it('PATCH /coordenadora/:rm/alunos/:ra/frequencias/:id_aula deve atualizar frequencia com sucesso', async () => {
    const body = {
      frequencia: false,
    };
    queryMock.mockResolvedValueOnce({ rowCount: 1 });

    const response = await request(app)
      .patch('/coordenadora/1011/alunos/1/frequencias/10')
      .send(body);

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ message: 'Frequência atualizada com sucesso.' });
    expect(queryMock).toHaveBeenCalledWith(
      expect.stringContaining('UPDATE frequenta'),
      [
        false,
        1,
        10,
        1011,
      ],
    );
  });

  it('PATCH /coordenadora/:rm/alunos/:ra/frequencias/:id_aula deve retornar 404 quando frequencia nao existir', async () => {
    const body = {
      frequencia: false,
    };
    queryMock.mockResolvedValueOnce({ rowCount: 0 });

    const response = await request(app)
      .patch('/coordenadora/1011/alunos/1/frequencias/10')
      .send(body);

    expect(response.status).toBe(404);
    expect(response.body).toEqual({ error: 'Frequência não encontrada.' });
  });

  it('PATCH /coordenadora/:rm/alunos/:ra/frequencias/:id_aula deve retornar 500 quando ocorrer erro inesperado', async () => {
    const body = {
      frequencia: false,
    };
    queryMock.mockRejectedValueOnce(new Error('Erro no banco'));

    const response = await request(app)
      .patch('/coordenadora/1011/alunos/1/frequencias/10')
      .send(body);

    expect(response.status).toBe(500);
    expect(response.body).toEqual({ error: 'Erro interno ao atualizar frequência.' });
  });

  it('GET /coordenadora/:rm/alunos/:ra/relatorios deve retornar relatorios do aluno', async () => {
    queryMock.mockResolvedValueOnce({ rows: relatorios });

    const response = await request(app).get('/coordenadora/1011/alunos/101/relatorios');

    expect(response.status).toBe(200);
    expect(response.body).toEqual(relatorios);
    expect(queryMock).toHaveBeenCalledWith(
      expect.stringContaining('FROM relatorio'),
      [1011, 101],
    );
  });

  it('GET /coordenadora/:rm/alunos/:ra/relatorios deve retornar 404 quando nenhum relatorio existir', async () => {
    queryMock.mockResolvedValueOnce({ rows: [] });

    const response = await request(app).get('/coordenadora/1011/alunos/101/relatorios');

    expect(response.status).toBe(404);
    expect(response.body).toEqual({ error: 'Nenhum relatório encontrado.' });
  });

  it('GET /coordenadora/:rm/alunos/:ra/relatorios deve retornar 400 quando parametros forem invalidos', async () => {
    const response = await request(app).get('/coordenadora/abc/alunos/101/relatorios');

    expect(response.status).toBe(400);
    expect(response.body).toEqual({ error: 'Parâmetros inválidos.' });
    expect(queryMock).not.toHaveBeenCalled();
  });

  it('GET /coordenadora/:rm/alunos/:ra/relatorios deve retornar 500 quando ocorrer erro inesperado', async () => {
    queryMock.mockRejectedValueOnce(new Error('Erro no banco'));

    const response = await request(app).get('/coordenadora/1011/alunos/101/relatorios');

    expect(response.status).toBe(500);
    expect(response.body).toEqual({ error: 'Erro interno ao listar relatórios.' });
  });
});
