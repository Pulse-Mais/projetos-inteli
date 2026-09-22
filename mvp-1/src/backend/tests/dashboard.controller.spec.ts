// TESTE UNITÁRIO com mock de dashboardService — mas não mocka supabaseClient.
// Ao importar `app`, o módulo supabaseClient é carregado e lança erro se
// SUPABASE_URL / SUPABASE_KEY não estiverem no .env.
// Correção: adicionar `jest.mock('../db/supabaseClient', () => ({ supabase: {} }))`
// como primeira linha (antes de qualquer import), igual ao padrão de aluno.portal.spec.ts.
import request from 'supertest';
import { app } from '../app';
import * as dashboardService from '../services/dashboardService';

jest.mock('../services/dashboardService');

const mockData = {
  total_alunos_ativos: 42,
  taxa_empregabilidade: 71.43,
  alunos_por_programa: [
    { id_programa: 1, nome_programa: 'Programa Alpha', total_alunos: 20 },
    { id_programa: 2, nome_programa: 'Programa Beta', total_alunos: 15 },
  ],
};

describe('GET /dashboard', () => {
  beforeEach(() => {
    (dashboardService.getDashboard as jest.Mock).mockResolvedValue(mockData);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('retorna status 200', async () => {
    const res = await request(app).get('/dashboard');
    expect(res.status).toBe(200);
  });

  it('objeto de resposta contém as chaves: total_alunos_ativos, taxa_empregabilidade, alunos_por_programa', async () => {
    const res = await request(app).get('/dashboard');
    expect(res.body).toHaveProperty('total_alunos_ativos');
    expect(res.body).toHaveProperty('taxa_empregabilidade');
    expect(res.body).toHaveProperty('alunos_por_programa');
  });

  it('taxa_empregabilidade está entre 0 e 100', async () => {
    const res = await request(app).get('/dashboard');
    expect(res.body.taxa_empregabilidade).toBeGreaterThanOrEqual(0);
    expect(res.body.taxa_empregabilidade).toBeLessThanOrEqual(100);
  });

  it('alunos_por_programa é um array', async () => {
    const res = await request(app).get('/dashboard');
    expect(Array.isArray(res.body.alunos_por_programa)).toBe(true);
  });
});
