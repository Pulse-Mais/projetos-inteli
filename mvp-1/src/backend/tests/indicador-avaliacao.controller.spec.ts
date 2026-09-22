import request from 'supertest';
import type { Application } from 'express';

process.env.SUPABASE_URL = process.env.SUPABASE_URL ?? 'http://localhost:54321';
process.env.SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY ?? 'test-anon-key';
process.env.SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY ?? 'test-service-role-key';

jest.mock('../repositories/indicadorRepository');
jest.mock('../repositories/avaliacaoRepository');
jest.mock('../repositories/programaRepository');

const { app } = require('../app') as { app: Application };
const indicadorRepo = require('../repositories/indicadorRepository') as typeof import('../repositories/indicadorRepository');
const avaliacaoRepo = require('../repositories/avaliacaoRepository') as typeof import('../repositories/avaliacaoRepository');
const programaRepo = require('../repositories/programaRepository') as typeof import('../repositories/programaRepository');

const mockedIndicadorRepo = indicadorRepo as jest.Mocked<typeof indicadorRepo>;
const mockedAvaliacaoRepo = avaliacaoRepo as jest.Mocked<typeof avaliacaoRepo>;
const mockedProgramaRepo = programaRepo as jest.Mocked<typeof programaRepo>;

describe('Indicadores e Avaliações — RF002', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('GET /indicadores retorna 200 com lista', async () => {
    const indicadores = [
      {
        id_indicador: 1,
        nome: 'Participação',
        descricao: 'Participação nas atividades',
        id_programa: 1,
      },
    ];

    mockedIndicadorRepo.findAll.mockResolvedValue(indicadores);

    const res = await request(app).get('/indicadores');

    expect(res.status).toBe(200);
    expect(res.body).toEqual(indicadores);
    expect(mockedIndicadorRepo.findAll).toHaveBeenCalledTimes(1);
  });

  it('POST /indicadores com id_programa inválido retorna 400 — RN03', async () => {
    mockedProgramaRepo.findById.mockResolvedValue(null);

    const res = await request(app)
      .post('/indicadores')
      .send({
        nome: 'Engajamento',
        descricao: 'Engajamento no programa',
        id_programa: 999,
      });

    expect(res.status).toBe(400);
    expect(res.body).toEqual({ error: 'Programa informado não existe' });
    expect(mockedIndicadorRepo.create).not.toHaveBeenCalled();
  });

  it('POST /avaliacoes com nota = 0 retorna 400 — RN10', async () => {
    const res = await request(app)
      .post('/avaliacoes')
      .send({
        nota: 0,
        data_avaliacao: '2026-05-26',
        id_indicador: 1,
        id_aluno: 1,
      });

    expect(res.status).toBe(400);
    expect(res.body).toEqual({ error: 'A nota deve estar entre 1 e 5' });
    expect(mockedAvaliacaoRepo.create).not.toHaveBeenCalled();
  });

  it('POST /avaliacoes com nota = 6 retorna 400 — RN10', async () => {
    const res = await request(app)
      .post('/avaliacoes')
      .send({
        nota: 6,
        data_avaliacao: '2026-05-26',
        id_indicador: 1,
        id_aluno: 1,
      });

    expect(res.status).toBe(400);
    expect(res.body).toEqual({ error: 'A nota deve estar entre 1 e 5' });
    expect(mockedAvaliacaoRepo.create).not.toHaveBeenCalled();
  });

  it('POST /avaliacoes com dados válidos retorna 201', async () => {
    const avaliacao = {
      id_avaliacao: 1,
      nota: 4,
      data_avaliacao: '2026-05-26',
      id_indicador: 1,
      id_aluno: 1,
    };

    mockedAvaliacaoRepo.create.mockResolvedValue(avaliacao);

    const res = await request(app)
      .post('/avaliacoes')
      .send({
        nota: 4,
        data_avaliacao: '2026-05-26',
        id_indicador: 1,
        id_aluno: 1,
      });

    expect(res.status).toBe(201);
    expect(res.body).toEqual(avaliacao);
    expect(mockedAvaliacaoRepo.create).toHaveBeenCalledWith({
      nota: 4,
      data_avaliacao: '2026-05-26',
      id_indicador: 1,
      id_aluno: 1,
    });
  });

  it('GET /avaliacoes/:id inexistente retorna 404', async () => {
    mockedAvaliacaoRepo.findById.mockResolvedValue(null);

    const res = await request(app).get('/avaliacoes/999');

    expect(res.status).toBe(404);
    expect(res.body).toEqual({ error: 'Avaliação com id 999 não encontrada' });
  });
});