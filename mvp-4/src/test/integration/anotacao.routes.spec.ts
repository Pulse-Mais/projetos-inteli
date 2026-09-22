import request from 'supertest';
import pool from '../../database/connection';
import app from '../../app';

jest.mock('../../database/connection', () => ({
  __esModule: true,
  default: { query: jest.fn() },
}));

describe('AnotacaoRoutes - integracao', () => {
  const queryMock = pool.query as jest.Mock;
  const anotacao = {
    id_anotacoes: 1,
    id_aluno: 101,
    nome_autor: 'Gabriela Ferreira - Psicologa',
    data: '2026-06-11',
    conteudo: 'Aluno apresentou evolucao.',
  };

  beforeEach(() => queryMock.mockReset());

  it('GET /alunos/:ra/anotacoes deve listar anotacoes', async () => {
    queryMock
      .mockResolvedValueOnce({ rows: [{ '?column?': 1 }] })
      .mockResolvedValueOnce({ rows: [anotacao] });

    const response = await request(app).get('/alunos/101/anotacoes');

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ anotacoes: [anotacao], total: 1 });
    expect(queryMock).toHaveBeenNthCalledWith(1, 'SELECT 1 FROM aluno WHERE ra = $1', [101]);
    expect(queryMock).toHaveBeenNthCalledWith(2, expect.stringContaining('FROM anotacoes'), [101]);
  });

  it('GET /alunos/:ra/anotacoes deve retornar 404 para aluno inexistente', async () => {
    queryMock.mockResolvedValueOnce({ rows: [] });

    const response = await request(app).get('/alunos/999/anotacoes');

    expect(response.status).toBe(404);
    expect(response.body).toEqual({ error: 'Aluno nao encontrado.' });
  });

  it('POST /alunos/:ra/anotacoes deve criar anotacao', async () => {
    queryMock
      .mockResolvedValueOnce({ rows: [{ '?column?': 1 }] })
      .mockResolvedValueOnce({ rows: [anotacao] });

    const response = await request(app)
      .post('/alunos/101/anotacoes')
      .send({
        nome_autor: anotacao.nome_autor,
        data: anotacao.data,
        conteudo: anotacao.conteudo,
      });

    expect(response.status).toBe(201);
    expect(response.body).toEqual(anotacao);
    expect(queryMock).toHaveBeenLastCalledWith(
      expect.stringContaining('INSERT INTO anotacoes'),
      [101, anotacao.nome_autor, anotacao.data, anotacao.conteudo],
    );
  });

  it('POST /alunos/:ra/anotacoes deve validar campos obrigatorios', async () => {
    const response = await request(app)
      .post('/alunos/101/anotacoes')
      .send({ nome_autor: 'Gabriela Ferreira - Psicologa' });

    expect(response.status).toBe(400);
    expect(response.body).toEqual({ error: 'conteudo invalido.' });
    expect(queryMock).not.toHaveBeenCalled();
  });

  it('PATCH /anotacoes/:id deve atualizar anotacao', async () => {
    const atualizada = { ...anotacao, conteudo: 'Conteudo atualizado.' };
    queryMock.mockResolvedValueOnce({ rows: [atualizada] });

    const response = await request(app)
      .patch('/anotacoes/1')
      .send({ conteudo: atualizada.conteudo });

    expect(response.status).toBe(200);
    expect(response.body).toEqual(atualizada);
    expect(queryMock).toHaveBeenCalledWith(
      expect.stringContaining('UPDATE anotacoes'),
      [null, null, atualizada.conteudo, 1],
    );
  });

  it('PATCH /anotacoes/:id deve retornar 404 quando anotacao nao existir', async () => {
    queryMock.mockResolvedValueOnce({ rows: [] });

    const response = await request(app)
      .patch('/anotacoes/99')
      .send({ conteudo: 'Novo conteudo.' });

    expect(response.status).toBe(404);
    expect(response.body).toEqual({ error: 'Anotacao nao encontrada.' });
  });

  it('DELETE /anotacoes/:id deve remover anotacao', async () => {
    queryMock.mockResolvedValueOnce({ rowCount: 1 });

    const response = await request(app).delete('/anotacoes/1');

    expect(response.status).toBe(204);
    expect(queryMock).toHaveBeenCalledWith(
      'DELETE FROM anotacoes WHERE id_anotacoes = $1',
      [1],
    );
  });

  it('DELETE /anotacoes/:id deve retornar 404 quando anotacao nao existir', async () => {
    queryMock.mockResolvedValueOnce({ rowCount: 0 });

    const response = await request(app).delete('/anotacoes/99');

    expect(response.status).toBe(404);
    expect(response.body).toEqual({ error: 'Anotacao nao encontrada.' });
  });
});
