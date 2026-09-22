import request from 'supertest';
import pool from '../../database/connection';
import app from '../../app';

jest.mock('../../database/connection', () => ({
  __esModule: true,
  default: {
    query: jest.fn(),
  },
}));

describe('Jornada RF12 - E2E', () => {
  const queryMock = pool.query as jest.Mock;

  beforeEach(() => {
    queryMock.mockReset();
  });

  it('GET /aluno/:ra/alertas deve responder o fluxo critico do banner de frequencia', async () => {
    queryMock
      .mockResolvedValueOnce({ rows: [{ ra: 101, nome: 'Carlos Sales' }] })
      .mockResolvedValueOnce({ rows: [{ total_aulas: 20, presencas: 18 }] })
      .mockResolvedValueOnce({ rows: [] });

    const response = await request(app).get('/aluno/101/alertas');

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      ra: 101,
      nome: 'Carlos Sales',
      frequencia_percentual: 90,
      limite_frequencia_percentual: 95,
      exibir_banner: true,
      mensagem: 'Sua frequencia esta abaixo do limite esperado. Procure a equipe pedagogica para regularizar sua situacao.',
      alertas: [],
    });
  });
});
