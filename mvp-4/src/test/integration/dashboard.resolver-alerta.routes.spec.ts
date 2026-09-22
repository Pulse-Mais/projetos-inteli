import request from 'supertest';
import pool from '../../database/connection';
import app from '../../app';

jest.mock('../../database/connection', () => ({
  __esModule: true,
  default: { query: jest.fn() },
}));

describe('PATCH /gestao/alertas/:id/resolver - integracao', () => {
  const queryMock = pool.query as jest.Mock;

  beforeEach(() => queryMock.mockReset());

  it('deve resolver alerta existente', async () => {
    queryMock.mockResolvedValueOnce({ rowCount: 1 });

    const response = await request(app)
      .patch('/gestao/alertas/12/resolver')
      .send({ data_resolucao: '2026-06-11' });

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ message: 'Alerta resolvido com sucesso.' });
    expect(queryMock).toHaveBeenCalledWith(
      expect.stringContaining('UPDATE alerta'),
      ['2026-06-11', 12],
    );
  });

  it('deve retornar 404 quando alerta nao existir', async () => {
    queryMock.mockResolvedValueOnce({ rowCount: 0 });

    const response = await request(app)
      .patch('/gestao/alertas/99/resolver')
      .send({ data_resolucao: '2026-06-11' });

    expect(response.status).toBe(404);
    expect(response.body).toEqual({ error: 'Alerta nao encontrado.' });
  });

  it('deve retornar 400 para id invalido', async () => {
    const response = await request(app)
      .patch('/gestao/alertas/abc/resolver')
      .send({ data_resolucao: '2026-06-11' });

    expect(response.status).toBe(400);
    expect(response.body).toEqual({ error: 'id_alerta invalido.' });
    expect(queryMock).not.toHaveBeenCalled();
  });

  it('deve retornar 400 para data invalida', async () => {
    const response = await request(app)
      .patch('/gestao/alertas/12/resolver')
      .send({ data_resolucao: 'data-invalida' });

    expect(response.status).toBe(400);
    expect(response.body).toEqual({ error: 'data_resolucao invalida.' });
    expect(queryMock).not.toHaveBeenCalled();
  });
});
