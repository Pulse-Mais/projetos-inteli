jest.mock('../repositories/anotacaoPrivadaRepository');

import request from 'supertest';
import { app } from '../app';
import * as svc from '../services/anotacaoPrivadaService';
import { NotFoundError } from '../errors/AppError';

const repo = require('../repositories/anotacaoPrivadaRepository') as jest.Mocked<
  typeof import('../repositories/anotacaoPrivadaRepository')
>;

const sample: import('../repositories/anotacaoPrivadaRepository').AnotacaoPrivadaRow = {
  id_mentor: 4,
  id_aluno: 6,
  data_registro: '2026-05-01T10:00:00.000Z',
  conteudo_texto: 'Aluno demonstrou boa evolução.',
};

beforeEach(() => jest.clearAllMocks());

// ── Service unit tests ────────────────────────────────────────────────────────

describe('anotacaoPrivadaService.listarPorAluno', () => {
  it('retorna anotações do aluno', async () => {
    repo.findByAluno.mockResolvedValue([sample]);
    await expect(svc.listarPorAluno(6)).resolves.toEqual([sample]);
    expect(repo.findByAluno).toHaveBeenCalledWith(6);
  });
});

describe('anotacaoPrivadaService.listarPorAlunoEMentor', () => {
  it('retorna anotações do aluno pelo mentor', async () => {
    repo.findByAlunoAndMentor.mockResolvedValue([sample]);
    await expect(svc.listarPorAlunoEMentor(6, 4)).resolves.toEqual([sample]);
    expect(repo.findByAlunoAndMentor).toHaveBeenCalledWith(6, 4);
  });
});

describe('anotacaoPrivadaService.listarPorMentor', () => {
  it('retorna todas as anotações do mentor', async () => {
    repo.findByMentor.mockResolvedValue([sample]);
    await expect(svc.listarPorMentor(4)).resolves.toEqual([sample]);
    expect(repo.findByMentor).toHaveBeenCalledWith(4);
  });
});

describe('anotacaoPrivadaService.criarAnotacao', () => {
  it('cria e retorna a anotação', async () => {
    repo.create.mockResolvedValue(sample);
    const payload = {
      id_mentor: 4,
      id_aluno: 6,
      conteudo_texto: 'Aluno demonstrou boa evolução.',
    };
    await expect(svc.criarAnotacao(payload)).resolves.toEqual(sample);
    expect(repo.create).toHaveBeenCalledWith(payload);
  });
});

describe('anotacaoPrivadaService.deletarAnotacao', () => {
  it('lança NotFoundError quando anotação não existe', async () => {
    repo.remove.mockResolvedValue(false);
    await expect(svc.deletarAnotacao(4, 6, '2026-05-01T10:00:00.000Z')).rejects.toThrow(
      NotFoundError,
    );
  });

  it('resolve quando remoção é bem-sucedida', async () => {
    repo.remove.mockResolvedValue(true);
    await expect(
      svc.deletarAnotacao(4, 6, '2026-05-01T10:00:00.000Z'),
    ).resolves.toBeUndefined();
  });
});

// ── Controller HTTP tests ─────────────────────────────────────────────────────

describe('GET /anotacoes/aluno/:id_aluno', () => {
  it('200 — lista anotações do aluno', async () => {
    repo.findByAluno.mockResolvedValue([sample]);
    const res = await request(app).get('/anotacoes/aluno/6');
    expect(res.status).toBe(200);
    expect(res.body).toEqual([sample]);
  });
});

describe('GET /anotacoes/aluno/:id_aluno/mentor/:id_mentor', () => {
  it('200 — anotações do aluno pelo mentor', async () => {
    repo.findByAlunoAndMentor.mockResolvedValue([sample]);
    const res = await request(app).get('/anotacoes/aluno/6/mentor/4');
    expect(res.status).toBe(200);
    expect(res.body).toEqual([sample]);
  });
});

describe('GET /anotacoes/mentor/:id_mentor', () => {
  it('200 — anotações do mentor', async () => {
    repo.findByMentor.mockResolvedValue([sample]);
    const res = await request(app).get('/anotacoes/mentor/4');
    expect(res.status).toBe(200);
    expect(res.body).toEqual([sample]);
  });
});

describe('POST /anotacoes', () => {
  it('201 — cria anotação com sucesso', async () => {
    repo.create.mockResolvedValue(sample);
    const payload = {
      id_mentor: 4,
      id_aluno: 6,
      conteudo_texto: 'Aluno demonstrou boa evolução.',
    };
    const res = await request(app).post('/anotacoes').send(payload);
    expect(res.status).toBe(201);
    expect(res.body).toEqual(sample);
  });
});

describe('DELETE /anotacoes/mentor/:id_mentor/aluno/:id_aluno', () => {
  it('204 — remove anotação com sucesso', async () => {
    repo.remove.mockResolvedValue(true);
    const res = await request(app)
      .delete('/anotacoes/mentor/4/aluno/6')
      .query({ data: '2026-05-01T10:00:00.000Z' });
    expect(res.status).toBe(204);
  });

  it('404 — anotação não existe', async () => {
    repo.remove.mockResolvedValue(false);
    const res = await request(app)
      .delete('/anotacoes/mentor/4/aluno/6')
      .query({ data: '2026-01-01T00:00:00.000Z' });
    expect(res.status).toBe(404);
  });
});
