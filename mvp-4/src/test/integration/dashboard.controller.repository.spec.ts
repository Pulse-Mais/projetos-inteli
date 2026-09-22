import { Request, Response } from 'express';
import pool from '../../database/connection';
import { DashboardController } from '../../controllers/dashboard.controller';
import { DashboardRepository } from '../../repositories/dashboard.repository';
import { DashboardService } from '../../services/dashboard.service';

jest.mock('../../database/connection', () => ({
  __esModule: true,
  default: {
    query: jest.fn(),
  },
}));

describe('Dashboard RF10 - integracao Controller + Repository', () => {
  const queryMock = pool.query as jest.Mock;

  const makeRes = () => {
    const res = {} as Response;
    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnValue(res);
    return res;
  };

  const makeController = () => {
    const repository = new DashboardRepository();
    const service = new DashboardService(repository);
    return new DashboardController(service);
  };

  beforeEach(() => {
    queryMock.mockReset();
  });

  it('GET /dashboard/frequencia deve retornar alunos com alerta de evasao', async () => {
    queryMock
      .mockResolvedValueOnce({ rows: [{ total: 1 }] })
      .mockResolvedValueOnce({
        rows: [
          {
            ra: 102,
            nome: 'Ana Lima',
            id_turma: 1,
            nome_turma: 'Turma 1 - 2026',
            total_aulas: 20,
            presencas: 15,
            percentual_presenca: 75,
            alerta_evasao: true,
          },
        ],
      });

    const req = {
      query: { id_turma: '1', apenas_alertas: 'true' },
    } as unknown as Request;
    const res = makeRes();

    await makeController().obterFrequenciasDashboard(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      alunos: [
        {
          ra: 102,
          nome: 'Ana Lima',
          id_turma: 1,
          nome_turma: 'Turma 1 - 2026',
          total_aulas: 20,
          presencas: 15,
          percentual_presenca: 75,
          alerta_evasao: true,
        },
      ],
    });
    expect(queryMock).toHaveBeenNthCalledWith(
      1,
      expect.stringContaining('FROM turma WHERE id_turma = $1'),
      [1],
    );
    expect(queryMock).toHaveBeenNthCalledWith(
      2,
      expect.stringContaining('frequencia_calculada'),
      [1, true],
    );
  });

  it('GET /dashboard/empregabilidade deve retornar indicadores de empregabilidade', async () => {
    queryMock.mockImplementation((sql: string) => {
      if (sql.includes('COUNT(*)::int AS total FROM turma')) {
        return Promise.resolve({ rows: [{ total: 1 }] });
      }

      if (sql.includes('COUNT(DISTINCT e.id_aluno)::int AS total')) {
        return Promise.resolve({ rows: [{ total: 75 }] });
      }

      if (sql.includes('taxa_retencao_3_meses')) {
        return Promise.resolve({
          rows: [
            {
              taxa_retencao_3_meses: 68,
              taxa_retencao_6_meses: 61,
              taxa_retencao_12_meses: 55,
            },
          ],
        });
      }

      if (sql.includes('media_presenca_percentual')) {
        return Promise.resolve({
          rows: [
            {
              id_turma: 1,
              nome_turma: 'Turma 1 - 2026',
              media_presenca_percentual: 91.5,
              alunos_em_risco: 2,
            },
          ],
        });
      }

      return Promise.resolve({ rows: [{ total: 0 }] });
    });

    const req = { query: { id_turma: '1' } } as unknown as Request;
    const res = makeRes();

    await makeController().obterEmpregabilidadeDashboard(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      total_empregados_ativos: 75,
      taxa_retencao_3_meses: 68,
      taxa_retencao_6_meses: 61,
      taxa_retencao_12_meses: 55,
    });
    expect(queryMock).toHaveBeenCalledTimes(9);
  });
});
