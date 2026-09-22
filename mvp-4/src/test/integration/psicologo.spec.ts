import request from 'supertest';
import pool from '../../database/connection';
import app from '../../app';
import { Psicologo } from '../../database/models/psicologo.model';
import { criarToken, nomeCookieSessao } from '../../auth/token';

jest.mock('../../database/connection', () => ({
  __esModule: true,
  default: {
    query: jest.fn(),
  },
}));

describe('PsicologoRoutes', () => {
  const queryMock = pool.query as jest.Mock;

  const psicologo: Psicologo = {
    rm: 1,
    nome: 'Mariana Rodrigues',
    cargo: 'Psicologa',
    email: 'mariana.rodriguespulsemais@gmail.com',
  };

  beforeEach(() => {
    queryMock.mockReset();
  });

  it('GET /psicologa/:rm deve retornar psicologa encontrada', async () => {
    queryMock.mockResolvedValueOnce({ rows: [psicologo] });

    const response = await request(app).get('/psicologa/1');

    expect(response.status).toBe(200);
    expect(response.body).toEqual(psicologo);
    expect(queryMock).toHaveBeenCalledWith(
      expect.stringContaining('FROM psicologo WHERE rm = $1'),
      [1],
    );
  });

  it('GET /psicologa/:rm deve retornar 404 quando psicologa nao existir', async () => {
    queryMock.mockResolvedValueOnce({ rows: [] });

    const response = await request(app).get('/psicologa/99');

    expect(response.status).toBe(404);
    expect(response.body).toEqual({ error: 'Psicóloga não encontrada.' });
  });

  it('GET /psicologa/:rm deve retornar 400 quando RM for invalido', async () => {
    const response = await request(app).get('/psicologa/abc');

    expect(response.status).toBe(400);
    expect(response.body).toEqual({ error: 'RM invalido.' });
    expect(queryMock).not.toHaveBeenCalled();
  });

  it('deve proteger e disponibilizar as telas principais apenas para psicologa autenticada', async () => {
    const anonimo = await request(app).get('/psicologa/atendimentos.html');
    expect(anonimo.status).toBe(302);
    expect(anonimo.headers.location).toBe('/login.html');

    const token = criarToken({
      id: psicologo.rm,
      nome: psicologo.nome,
      email: psicologo.email ?? '',
      perfil: 'psicologa',
    });
    const cookie = `${nomeCookieSessao}=${token}`;
    const [atendimentos, prontuario] = await Promise.all([
      request(app).get('/psicologa/atendimentos.html').set('Cookie', cookie),
      request(app).get('/psicologa/prontuario.html').set('Cookie', cookie),
    ]);

    expect(atendimentos.status).toBe(200);
    expect(atendimentos.text).toContain('lista-atendimentos');
    expect(prontuario.status).toBe(200);
    expect(prontuario.text).toContain('lista-relatorios');
  });

  it('deve permitir que psicologa autenticada liste turmas para preencher o filtro', async () => {
    const token = criarToken({
      id: psicologo.rm,
      nome: psicologo.nome,
      email: psicologo.email ?? '',
      perfil: 'psicologa',
    });
    const cookie = `${nomeCookieSessao}=${token}`;
    const turmas = [
      {
        id_turma: 1,
        nome_turma: 'Turma 1 - 2026',
        data_inicio: '2026-01-01',
        data_fim: '2026-12-31',
        capacidade: 30,
        descricao: null,
        status: 'ativa',
        id_coordenador: 1011,
        total_alunos: 12,
      },
    ];

    queryMock
      .mockResolvedValueOnce({ rows: turmas })
      .mockResolvedValueOnce({ rows: [{ total: 1 }] });

    const response = await request(app)
      .get('/gestao/turmas')
      .set('Cookie', cookie);

    expect(response.status).toBe(200);
    expect(response.body.data).toEqual(turmas);
    expect(queryMock).toHaveBeenCalledWith(
      expect.stringContaining('FROM turma t'),
      [20, 0],
    );
  });

  it('deve validar fluxo integrado da psicologa de listagem a atualizacao de status', async () => {
    const alunos = [
      {
        ra: 1,
        nome: 'Ana Lima',
        status: true,
        id_turma: 1,
      },
    ];
    const prontuarios = [
      {
        id_relatorio: 1,
        info_simplificada: 'Acompanhamento inicial.',
        observacoes: 'Aluno relatou ansiedade na rotina.',
        data: '2026-05-25',
      },
    ];
    const novoProntuario = {
      info_simplificada: 'Retorno semanal.',
      observacoes: 'Mantido acompanhamento.',
      data: '2026-06-11',
    };
    const alunoAtualizado = {
      ...alunos[0],
      status: false,
    };

    queryMock
      .mockResolvedValueOnce({ rows: alunos })
      .mockResolvedValueOnce({ rows: prontuarios })
      .mockResolvedValueOnce({ rowCount: 1 })
      .mockResolvedValueOnce({ rowCount: 1 })
      .mockResolvedValueOnce({ rows: [alunoAtualizado] });

    const listagem = await request(app)
      .get('/psicologa/1/alunos')
      .query({ busca: 'Ana', id_turma: 1, status: 'ACTIVE' });

    expect(listagem.status).toBe(200);
    expect(listagem.body).toEqual(alunos);

    const detalhes = await request(app).get('/psicologa/1/alunos/1/relatorios');

    expect(detalhes.status).toBe(200);
    expect(detalhes.body).toEqual(prontuarios);

    const criacao = await request(app)
      .post('/psicologa/1/alunos/1/relatorios')
      .send(novoProntuario);

    expect(criacao.status).toBe(201);
    expect(criacao.body).toEqual({ message: 'Prontuário registrado com sucesso.' });

    const atualizacao = await request(app)
      .patch('/psicologa/1/alunos/1/relatorios/1')
      .send({
        info_simplificada: 'Acompanhamento atualizado.',
        observacoes: 'Aluno apresentou melhora.',
      });

    expect(atualizacao.status).toBe(200);
    expect(atualizacao.body).toEqual({ message: 'Prontuário atualizado com sucesso.' });

    const status = await request(app)
      .patch('/psicologa/1/alunos/1/status')
      .send({ status: 'INACTIVE' });

    expect(status.status).toBe(200);
    expect(status.body).toEqual(alunoAtualizado);
    expect(queryMock).toHaveBeenNthCalledWith(
      1,
      expect.stringContaining('aluno.nome ILIKE $1'),
      ['%Ana%', 1],
    );
    expect(queryMock).toHaveBeenNthCalledWith(
      5,
      expect.stringContaining('UPDATE aluno'),
      [1, 'false'],
    );
  });

  it('POST /psicologa/:rm/alunos/:ra/relatorios deve registrar prontuario com sucesso', async () => {
    const body = {
      info_simplificada: 'Aluno apresenta sinais de ansiedade.',
      observacoes: 'Recomendado acompanhamento semanal.',
      data: '2026-05-25',
    };
    queryMock.mockResolvedValueOnce({ rowCount: 1 });

    const response = await request(app)
      .post('/psicologa/1/alunos/1/relatorios')
      .send(body);

    expect(response.status).toBe(201);
    expect(response.body).toEqual({ message: 'Prontuário registrado com sucesso.' });
    expect(queryMock).toHaveBeenCalledWith(
      expect.stringContaining('INSERT INTO relatorio'),
      [
        'Aluno apresenta sinais de ansiedade.',
        'Recomendado acompanhamento semanal.',
        '2026-05-25',
        1,
        1,
      ],
    );
  });

  it('POST /psicologo/alunos/:id/prontuario deve seguir endpoint documentado', async () => {
    const body = {
      info_simplificada: 'Atendimento inicial.',
      observacoes: 'Aluno demonstrou melhora na ansiedade.',
      data: '2026-05-25',
    };
    queryMock.mockResolvedValueOnce({ rowCount: 1 });

    const response = await request(app)
      .post('/psicologo/alunos/1/prontuario')
      .query({ rm: 1 })
      .send(body);

    expect(response.status).toBe(201);
    expect(queryMock).toHaveBeenCalledWith(
      expect.stringContaining('INSERT INTO relatorio'),
      [
        'Atendimento inicial.',
        'Aluno demonstrou melhora na ansiedade.',
        '2026-05-25',
        1,
        1,
      ],
    );
  });

  it('POST /psicologo/alunos/:id/prontuario deve validar id do aluno', async () => {
    const response = await request(app)
      .post('/psicologo/alunos/abc/prontuario')
      .query({ rm: 1 })
      .send({
        info_simplificada: 'Atendimento inicial.',
        data: '2026-05-25',
      });

    expect(response.status).toBe(400);
    expect(response.body).toEqual({ error: 'Parametros invalidos.' });
    expect(queryMock).not.toHaveBeenCalled();
  });

  it('POST /psicologa/:rm/alunos/:ra/relatorios deve retornar 400 quando campos obrigatorios estiverem ausentes', async () => {
    const response = await request(app)
      .post('/psicologa/1/alunos/1/relatorios')
      .send({ observacoes: 'Recomendado acompanhamento semanal.' });

    expect(response.status).toBe(400);
    expect(response.body).toEqual({ error: 'Campos obrigatórios ausentes.' });
    expect(queryMock).not.toHaveBeenCalled();
  });

  it('POST /psicologa/:rm/alunos/:ra/relatorios deve retornar 500 quando ocorrer erro inesperado', async () => {
    const body = {
      info_simplificada: 'Aluno apresenta sinais de ansiedade.',
      observacoes: 'Recomendado acompanhamento semanal.',
      data: '2026-05-25',
    };
    queryMock.mockRejectedValueOnce(new Error('Erro no banco'));

    const response = await request(app)
      .post('/psicologa/1/alunos/1/relatorios')
      .send(body);

    expect(response.status).toBe(500);
    expect(response.body).toEqual({ error: 'Erro interno ao registrar prontuário.' });
  });
  it('GET /psicologa/:rm/alunos/:ra/relatorios deve retornar prontuarios do aluno', async () => {
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
    queryMock.mockResolvedValueOnce({ rows: prontuarios });

    const response = await request(app).get('/psicologa/1/alunos/1/relatorios');

    expect(response.status).toBe(200);
    expect(response.body).toEqual(prontuarios);
    expect(queryMock).toHaveBeenCalledWith(
      expect.stringContaining('FROM relatorio'),
      [1, 1],
    );
  });

  it('GET /psicologo/alunos/:id/prontuario deve seguir endpoint documentado', async () => {
    const prontuarios = [
      {
        id_relatorio: 1,
        info_simplificada: 'Estavel',
        observacoes: 'Aluno demonstrou melhora na ansiedade.',
        data: '2026-05-25',
      },
    ];
    queryMock.mockResolvedValueOnce({ rows: prontuarios });

    const response = await request(app)
      .get('/psicologo/alunos/1/prontuario')
      .query({ rm: 1 });

    expect(response.status).toBe(200);
    expect(response.body).toEqual(prontuarios);
    expect(queryMock).toHaveBeenCalledWith(
      expect.stringContaining('FROM relatorio'),
      [1, 1],
    );
  });

  it('GET /psicologa/:rm/alunos/:ra/relatorios deve retornar 404 quando nenhum prontuario existir', async () => {
    queryMock.mockResolvedValueOnce({ rows: [] });

    const response = await request(app).get('/psicologa/1/alunos/99/relatorios');

    expect(response.status).toBe(404);
    expect(response.body).toEqual({ error: 'Nenhum prontuário encontrado.' });
  });

  it('GET /psicologa/:rm/alunos/:ra/relatorios deve retornar 500 quando ocorrer erro inesperado', async () => {
    queryMock.mockRejectedValueOnce(new Error('Erro no banco'));

    const response = await request(app).get('/psicologa/1/alunos/1/relatorios');

    expect(response.status).toBe(500);
    expect(response.body).toEqual({ error: 'Erro interno ao buscar prontuários.' });
  });
  it('PATCH /psicologa/:rm/alunos/:ra/relatorios/:id_relatorio deve atualizar prontuario com sucesso', async () => {
    const body = {
      info_simplificada: 'Aluno apresenta melhora significativa.',
      observacoes: 'Reduzir frequencia de sessoes.',
    };
    queryMock.mockResolvedValueOnce({ rowCount: 1 });

    const response = await request(app)
      .patch('/psicologa/1/alunos/1/relatorios/1')
      .send(body);

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ message: 'Prontuário atualizado com sucesso.' });
    expect(queryMock).toHaveBeenCalledWith(
      expect.stringContaining('UPDATE relatorio SET info_simplificada = $1, observacoes = $2'),
      [
        'Aluno apresenta melhora significativa.',
        'Reduzir frequencia de sessoes.',
        1,
        1,
        1,
      ],
    );
  });

  it('PATCH /psicologa/:rm/alunos/:ra/relatorios/:id_relatorio deve retornar 404 quando prontuario nao existir', async () => {
    const body = {
      info_simplificada: 'Aluno apresenta melhora significativa.',
    };
    queryMock.mockResolvedValueOnce({ rowCount: 0 });

    const response = await request(app)
      .patch('/psicologa/1/alunos/1/relatorios/99')
      .send(body);

    expect(response.status).toBe(404);
    expect(response.body).toEqual({ error: 'Prontuário não encontrado.' });
  });

  it('PATCH /psicologa/:rm/alunos/:ra/relatorios/:id_relatorio deve retornar 500 quando ocorrer erro inesperado', async () => {
    const body = {
      observacoes: 'Reduzir frequencia de sessoes.',
    };
    queryMock.mockRejectedValueOnce(new Error('Erro no banco'));

    const response = await request(app)
      .patch('/psicologa/1/alunos/1/relatorios/1')
      .send(body);

    expect(response.status).toBe(500);
    expect(response.body).toEqual({ error: 'Erro interno ao atualizar prontuário.' });
  });

  it('PATCH /psicologa/:rm/alunos/:ra/relatorios/:id_relatorio deve ignorar campos fora do contrato', async () => {
    const response = await request(app)
      .patch('/psicologa/1/alunos/1/relatorios/1')
      .send({ data: '2026-06-12' });

    expect(response.status).toBe(404);
    expect(response.body).toEqual({ error: 'Prontuário não encontrado.' });
    expect(queryMock).not.toHaveBeenCalled();
  });
});
