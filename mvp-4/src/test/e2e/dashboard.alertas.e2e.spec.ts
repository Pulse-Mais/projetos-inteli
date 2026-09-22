import request from 'supertest';
import pool from '../../database/connection';
import app from '../../app';

jest.mock('../../database/connection', () => ({
  __esModule: true,
  default: {
    query: jest.fn(),
  },
}));

describe('Dashboard RF11 - E2E', () => {
  const queryMock = pool.query as jest.Mock;

  beforeEach(() => {
    queryMock.mockReset();
  });

  it('GET /gestao/alertas deve responder o fluxo critico de consulta de alertas ativos', async () => {
    queryMock
      .mockResolvedValueOnce({ rows: [{ total: 1 }] })
      .mockResolvedValueOnce({
        rows: [
          {
            id_alerta: 12,
            ra: 102,
            nome_aluno: 'Ana Lima',
            id_turma: 1,
            nome_turma: 'Turma 1 - 2026',
            motivo: 'frequencia',
            descricao: 'Frequencia abaixo do limite exigido.',
            total_faltas_modulo: 0,
            atividades_consecutivas_nao_entregues: 0,
            status: 'ativo',
            data_alerta: '2026-05-20',
          },
        ],
      });

    const response = await request(app)
      .get('/gestao/alertas?id_turma=1&status=ativo&motivo=frequencia');

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      alertas: [
        expect.objectContaining({
          id_alerta: 12,
          ra: 102,
          motivo: 'frequencia',
          status: 'ativo',
        }),
      ],
    });
  });
});
