jest.mock('../repositories/matriculaRepository');

import request from 'supertest';
import { app } from '../app';
import * as svc from '../services/matriculaService';
import { NotFoundError, ConflictError } from '../errors/AppError';

const repo = require('../repositories/matriculaRepository') as jest.Mocked<
  typeof import('../repositories/matriculaRepository')
>;

const sample: import('../repositories/matriculaRepository').MatriculaRow = {
  id_programa: 1,
  id_aluno: 2,
  status_conclusao: 0,
  data_ingresso: '2026-01-15',
};

beforeEach(() => jest.clearAllMocks());

// ── Service unit tests ────────────────────────────────────────────────────────

describe('matriculaService.listarMatriculas', () => {
  it('retorna lista do repositório', async () => {
    repo.findAll.mockResolvedValue([sample]);
    await expect(svc.listarMatriculas()).resolves.toEqual([sample]);
    expect(repo.findAll).toHaveBeenCalledTimes(1);
  });
});

describe('matriculaService.listarPorAluno', () => {
  it('delega ao repositório com o id correto', async () => {
    repo.findByAluno.mockResolvedValue([sample]);
    await expect(svc.listarPorAluno(2)).resolves.toEqual([sample]);
    expect(repo.findByAluno).toHaveBeenCalledWith(2);
  });
});

describe('matriculaService.listarPorPrograma', () => {
  it('delega ao repositório com o id correto', async () => {
    repo.findByPrograma.mockResolvedValue([sample]);
    await expect(svc.listarPorPrograma(1)).resolves.toEqual([sample]);
    expect(repo.findByPrograma).toHaveBeenCalledWith(1);
  });
});

describe('matriculaService.buscarMatricula', () => {
  it('retorna matrícula quando existe', async () => {
    repo.findOne.mockResolvedValue(sample);
    await expect(svc.buscarMatricula(1, 2)).resolves.toEqual(sample);
  });

  it('lança NotFoundError quando não existe', async () => {
    repo.findOne.mockResolvedValue(null);
    await expect(svc.buscarMatricula(1, 999)).rejects.toThrow(NotFoundError);
  });
});

describe('matriculaService.criarMatricula', () => {
  it('lança ConflictError quando matrícula já existe', async () => {
    repo.findOne.mockResolvedValue(sample);
    await expect(svc.criarMatricula(sample)).rejects.toThrow(ConflictError);
    expect(repo.create).not.toHaveBeenCalled();
  });

  it('cria matrícula quando não há conflito', async () => {
    repo.findOne.mockResolvedValue(null);
    repo.create.mockResolvedValue(sample);
    await expect(svc.criarMatricula(sample)).resolves.toEqual(sample);
    expect(repo.create).toHaveBeenCalledTimes(1);
  });
});

describe('matriculaService.atualizarMatricula', () => {
  it('lança NotFoundError quando matrícula não existe', async () => {
    repo.findOne.mockResolvedValue(null);
    await expect(svc.atualizarMatricula(1, 999, {})).rejects.toThrow(NotFoundError);
  });

  it('lança NotFoundError quando update retorna null', async () => {
    repo.findOne.mockResolvedValue(sample);
    repo.update.mockResolvedValue(null);
    await expect(svc.atualizarMatricula(1, 2, {})).rejects.toThrow(NotFoundError);
  });

  it('retorna matrícula atualizada', async () => {
    const updated = { ...sample, status_conclusao: 1 };
    repo.findOne.mockResolvedValue(sample);
    repo.update.mockResolvedValue(updated);
    await expect(svc.atualizarMatricula(1, 2, { status_conclusao: 1 })).resolves.toEqual(updated);
  });
});

describe('matriculaService.deletarMatricula', () => {
  it('lança NotFoundError quando matrícula não existe', async () => {
    repo.remove.mockResolvedValue(false);
    await expect(svc.deletarMatricula(1, 999)).rejects.toThrow(NotFoundError);
  });

  it('resolve quando remoção é bem-sucedida', async () => {
    repo.remove.mockResolvedValue(true);
    await expect(svc.deletarMatricula(1, 2)).resolves.toBeUndefined();
  });
});

// ── Controller HTTP tests ─────────────────────────────────────────────────────

describe('GET /matriculas', () => {
  it('200 — retorna lista de matrículas', async () => {
    repo.findAll.mockResolvedValue([sample]);
    const res = await request(app).get('/matriculas');
    expect(res.status).toBe(200);
    expect(res.body).toEqual([sample]);
  });
});

describe('GET /matriculas/aluno/:id_aluno', () => {
  it('200 — matrículas por aluno', async () => {
    repo.findByAluno.mockResolvedValue([sample]);
    const res = await request(app).get('/matriculas/aluno/2');
    expect(res.status).toBe(200);
    expect(res.body).toEqual([sample]);
  });
});

describe('GET /matriculas/programa/:id_programa', () => {
  it('200 — matrículas por programa', async () => {
    repo.findByPrograma.mockResolvedValue([sample]);
    const res = await request(app).get('/matriculas/programa/1');
    expect(res.status).toBe(200);
    expect(res.body).toEqual([sample]);
  });
});

describe('GET /matriculas/:id_programa/:id_aluno', () => {
  it('200 — matrícula encontrada', async () => {
    repo.findOne.mockResolvedValue(sample);
    const res = await request(app).get('/matriculas/1/2');
    expect(res.status).toBe(200);
    expect(res.body).toEqual(sample);
  });

  it('404 — matrícula não encontrada', async () => {
    repo.findOne.mockResolvedValue(null);
    const res = await request(app).get('/matriculas/1/999');
    expect(res.status).toBe(404);
  });
});

describe('POST /matriculas', () => {
  it('201 — cria matrícula com sucesso', async () => {
    repo.findOne.mockResolvedValue(null);
    repo.create.mockResolvedValue(sample);
    const res = await request(app).post('/matriculas').send(sample);
    expect(res.status).toBe(201);
    expect(res.body).toEqual(sample);
  });

  it('409 — conflito quando matrícula já existe', async () => {
    repo.findOne.mockResolvedValue(sample);
    const res = await request(app).post('/matriculas').send(sample);
    expect(res.status).toBe(409);
  });
});

describe('PUT /matriculas/:id_programa/:id_aluno', () => {
  it('200 — atualiza matrícula', async () => {
    const updated = { ...sample, status_conclusao: 1 };
    repo.findOne.mockResolvedValue(sample);
    repo.update.mockResolvedValue(updated);
    const res = await request(app).put('/matriculas/1/2').send({ status_conclusao: 1 });
    expect(res.status).toBe(200);
    expect(res.body).toEqual(updated);
  });

  it('404 — matrícula não existe', async () => {
    repo.findOne.mockResolvedValue(null);
    const res = await request(app).put('/matriculas/1/999').send({ status_conclusao: 1 });
    expect(res.status).toBe(404);
  });
});

describe('DELETE /matriculas/:id_programa/:id_aluno', () => {
  it('204 — remove matrícula com sucesso', async () => {
    repo.remove.mockResolvedValue(true);
    const res = await request(app).delete('/matriculas/1/2');
    expect(res.status).toBe(204);
  });

  it('404 — matrícula não existe', async () => {
    repo.remove.mockResolvedValue(false);
    const res = await request(app).delete('/matriculas/1/999');
    expect(res.status).toBe(404);
  });
});
