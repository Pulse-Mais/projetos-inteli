jest.mock('../repositories/dashboardRepository');

import request from 'supertest';
import { app } from '../app';
import * as svc from '../services/dashboardService';

const repo = require('../repositories/dashboardRepository') as jest.Mocked<
  typeof import('../repositories/dashboardRepository')
>;

beforeEach(() => jest.clearAllMocks());

// ── Service unit tests ────────────────────────────────────────────────────────

describe('dashboardService.getDashboard', () => {
  const porPrograma: import('../repositories/dashboardRepository').AlunoPorPrograma[] = [
    { id_programa: 1, nome_programa: 'Programa A', total_alunos: 5 },
  ];

  it('calcula taxa de empregabilidade corretamente', async () => {
    repo.countAlunosAtivos.mockResolvedValue(10);
    repo.countAlunosComHistorico.mockResolvedValue(4);
    repo.alunosPorPrograma.mockResolvedValue(porPrograma);

    const resultado = await svc.getDashboard();

    expect(resultado.total_alunos_ativos).toBe(10);
    expect(resultado.taxa_empregabilidade).toBe(40);
    expect(resultado.alunos_por_programa).toEqual(porPrograma);
  });

  it('retorna taxa 0 quando total de alunos ativos é 0', async () => {
    repo.countAlunosAtivos.mockResolvedValue(0);
    repo.countAlunosComHistorico.mockResolvedValue(0);
    repo.alunosPorPrograma.mockResolvedValue([]);

    const resultado = await svc.getDashboard();

    expect(resultado.total_alunos_ativos).toBe(0);
    expect(resultado.taxa_empregabilidade).toBe(0);
  });

  it('arredonda taxa com 2 casas decimais', async () => {
    repo.countAlunosAtivos.mockResolvedValue(3);
    repo.countAlunosComHistorico.mockResolvedValue(1);
    repo.alunosPorPrograma.mockResolvedValue([]);

    const resultado = await svc.getDashboard();

    expect(resultado.taxa_empregabilidade).toBe(33.33);
  });
});

// ── Controller HTTP tests ─────────────────────────────────────────────────────

describe('GET /dashboard', () => {
  it('200 — retorna dados do dashboard', async () => {
    repo.countAlunosAtivos.mockResolvedValue(20);
    repo.countAlunosComHistorico.mockResolvedValue(10);
    repo.alunosPorPrograma.mockResolvedValue([]);

    const res = await request(app).get('/dashboard');
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({
      total_alunos_ativos: 20,
      taxa_empregabilidade: 50,
      alunos_por_programa: [],
    });
  });
});
