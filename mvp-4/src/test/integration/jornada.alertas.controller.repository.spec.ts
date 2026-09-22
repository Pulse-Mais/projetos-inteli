import request from 'supertest';
import pool from '../../database/connection';
import app from '../../app';

jest.mock('../../database/connection', () => ({
  __esModule: true,
  default: {
    query: jest.fn(),
  },
}));

describe('Jornada RF12 - integracao Controller + Repository', () => {
  const queryMock = pool.query as jest.Mock;

  beforeEach(() => {
    queryMock.mockReset();
  });

  it('GET /aluno/:ra/alertas deve retornar alertas de frequencia do aluno', async () => {
    queryMock
      .mockResolvedValueOnce({ rows: [{ ra: 101, nome: 'Carlos Sales' }] })
      .mockResolvedValueOnce({ rows: [{ total_aulas: 20, presencas: 17 }] })
      .mockResolvedValueOnce({
        rows: [
          {
            id_alerta: 12,
            tipo: 'frequencia',
            status: 'ativo',
            descricao: 'Frequencia abaixo do limite exigido.',
            data_alerta: '2026-05-20',
          },
        ],
      });

    const response = await request(app).get('/aluno/101/alertas');

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      ra: 101,
      nome: 'Carlos Sales',
      frequencia_percentual: 85,
      limite_frequencia_percentual: 95,
      exibir_banner: true,
      mensagem: 'Sua frequencia esta abaixo do limite esperado. Procure a equipe pedagogica para regularizar sua situacao.',
      alertas: [
        {
          id_alerta: 12,
          tipo: 'frequencia',
          status: 'ativo',
          descricao: 'Frequencia abaixo do limite exigido.',
          data_alerta: '2026-05-20',
        },
      ],
    });
    expect(queryMock).toHaveBeenNthCalledWith(
      1,
      'SELECT ra, nome FROM aluno WHERE ra = $1',
      [101],
    );
    expect(queryMock).toHaveBeenNthCalledWith(
      2,
      expect.stringContaining('FROM frequenta'),
      [101],
    );
    expect(queryMock).toHaveBeenNthCalledWith(
      3,
      expect.stringContaining('FROM alerta'),
      [101],
    );
  });

  it('GET /aluno/:ra/alertas deve retornar 404 quando aluno nao existir', async () => {
    queryMock.mockResolvedValueOnce({ rows: [] });

    const response = await request(app).get('/aluno/999/alertas');

    expect(response.status).toBe(404);
    expect(response.body).toEqual({ error: 'Aluno nao encontrado.' });
    expect(queryMock).toHaveBeenCalledTimes(1);
  });
});
