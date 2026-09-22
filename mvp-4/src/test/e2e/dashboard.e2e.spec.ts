import request from 'supertest';
import pool from '../../database/connection';
import app from '../../app';

jest.mock('../../database/connection', () => ({
  __esModule: true,
  default: {
    query: jest.fn(),
  },
}));

describe('Dashboard RF10 - E2E', () => {
  const queryMock = pool.query as jest.Mock;

  beforeEach(() => {
    queryMock.mockReset();
  });

  it('deve responder os fluxos criticos dos endpoints do RF10', async () => {
    queryMock.mockImplementation((sql: string) => {
      if (sql.includes('COUNT(*)::int AS total FROM turma')) {
        return Promise.resolve({ rows: [{ total: 1 }] });
      }

      if (sql.includes('COUNT(*)::int AS total') && sql.includes('ex_aluno = false')) {
        return Promise.resolve({ rows: [{ total: 87 }] });
      }

      if (sql.includes('COUNT(*)::int AS total') && sql.includes('ex_aluno = true')) {
        return Promise.resolve({ rows: [{ total: 180 }] });
      }

      if (sql.includes('COUNT(DISTINCT e.id_aluno)::int AS total')) {
        return Promise.resolve({ rows: [{ total: 75 }] });
      }

      if (sql.includes('COUNT(DISTINCT al.id_alerta)::int AS total')) {
        return Promise.resolve({ rows: [{ total: 3 }] });
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

      if (sql.includes('data_conclusao IS NOT NULL')) {
        return Promise.resolve({ rows: [{ total: 42 }] });
      }

      if (sql.includes('percentual_presenca::float AS percentual_presenca')) {
        return Promise.resolve({
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
      }

      return Promise.resolve({ rows: [{ total: 0 }] });
    });

    const dashboard = await request(app).get('/dashboard?id_turma=1');
    const frequencia = await request(app).get('/dashboard/frequencia?id_turma=1&apenas_alertas=true');
    const empregabilidade = await request(app).get('/dashboard/empregabilidade?id_turma=1');

    expect(dashboard.status).toBe(200);
    expect(dashboard.body.indicadores_gerais.total_alunos_ativos).toBe(87);
    expect(dashboard.body.frequencia_por_turma).toHaveLength(1);

    expect(frequencia.status).toBe(200);
    expect(frequencia.body.alunos).toEqual([
      expect.objectContaining({
        ra: 102,
        percentual_presenca: 75,
        alerta_evasao: true,
      }),
    ]);

    expect(empregabilidade.status).toBe(200);
    expect(empregabilidade.body).toEqual({
      total_empregados_ativos: 75,
      taxa_retencao_3_meses: 68,
      taxa_retencao_6_meses: 61,
      taxa_retencao_12_meses: 55,
    });
  });
});
