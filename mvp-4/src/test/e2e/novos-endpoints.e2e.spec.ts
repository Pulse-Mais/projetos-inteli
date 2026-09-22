import request from 'supertest';
import pool from '../../database/connection';
import app from '../../app';

jest.mock('../../database/connection', () => ({
  __esModule: true,
  default: { query: jest.fn() },
}));

describe('Anotacoes e resolucao de alerta - E2E', () => {
  const queryMock = pool.query as jest.Mock;
  let anotacoes: Array<{
    id_anotacoes: number;
    id_aluno: number;
    nome_autor: string;
    data: string;
    conteudo: string;
  }>;

  beforeEach(() => {
    anotacoes = [];
    queryMock.mockReset();
    queryMock.mockImplementation((sql: string, params: unknown[]) => {
      if (sql === 'SELECT 1 FROM aluno WHERE ra = $1') {
        return Promise.resolve({ rows: params[0] === 101 ? [{ existe: 1 }] : [] });
      }

      if (sql.includes('INSERT INTO anotacoes')) {
        const criada = {
          id_anotacoes: 1,
          id_aluno: params[0] as number,
          nome_autor: params[1] as string,
          data: (params[2] as string | null) ?? '2026-06-11',
          conteudo: params[3] as string,
        };
        anotacoes.push(criada);
        return Promise.resolve({ rows: [criada] });
      }

      if (sql.includes('FROM anotacoes') && sql.includes('WHERE id_aluno')) {
        return Promise.resolve({ rows: [...anotacoes] });
      }

      if (sql.includes('UPDATE anotacoes')) {
        if (anotacoes.length === 0) return Promise.resolve({ rows: [] });
        anotacoes[0] = {
          ...anotacoes[0],
          nome_autor: (params[0] as string | null) ?? anotacoes[0].nome_autor,
          data: (params[1] as string | null) ?? anotacoes[0].data,
          conteudo: (params[2] as string | null) ?? anotacoes[0].conteudo,
        };
        return Promise.resolve({ rows: [anotacoes[0]] });
      }

      if (sql.startsWith('DELETE FROM anotacoes')) {
        const removida = anotacoes.length > 0;
        anotacoes = [];
        return Promise.resolve({ rowCount: removida ? 1 : 0 });
      }

      if (sql.includes('UPDATE alerta')) {
        return Promise.resolve({ rowCount: params[1] === 12 ? 1 : 0 });
      }

      return Promise.resolve({ rows: [], rowCount: 0 });
    });
  });

  it('deve percorrer os cinco novos endpoints', async () => {
    const criada = await request(app)
      .post('/alunos/101/anotacoes')
      .send({
        nome_autor: 'Gabriela Ferreira - Psicologa',
        data: '2026-06-11',
        conteudo: 'Aluno apresentou evolucao.',
      });

    expect(criada.status).toBe(201);
    expect(criada.body.id_anotacoes).toBe(1);

    const listagem = await request(app).get('/alunos/101/anotacoes');
    expect(listagem.status).toBe(200);
    expect(listagem.body.total).toBe(1);

    const atualizada = await request(app)
      .patch('/anotacoes/1')
      .send({ conteudo: 'Aluno manteve a evolucao.' });
    expect(atualizada.status).toBe(200);
    expect(atualizada.body.conteudo).toBe('Aluno manteve a evolucao.');

    const removida = await request(app).delete('/anotacoes/1');
    expect(removida.status).toBe(204);

    const alerta = await request(app)
      .patch('/gestao/alertas/12/resolver')
      .send({ data_resolucao: '2026-06-11' });
    expect(alerta.status).toBe(200);
    expect(alerta.body).toEqual({ message: 'Alerta resolvido com sucesso.' });
  });
});
