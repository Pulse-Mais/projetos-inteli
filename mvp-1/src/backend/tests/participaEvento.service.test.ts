jest.mock('../repositories/participaEventoRepository');

import request from 'supertest';
import { app } from '../app';
import * as svc from '../services/participaEventoService';
import { NotFoundError, ConflictError } from '../errors/AppError';

const repo = require('../repositories/participaEventoRepository') as jest.Mocked<
  typeof import('../repositories/participaEventoRepository')
>;

const sample: import('../repositories/participaEventoRepository').ParticipaEventoRow = {
  id_evento: 10,
  id_aluno: 5,
  presenca: false,
};

beforeEach(() => jest.clearAllMocks());

// ── Service unit tests ────────────────────────────────────────────────────────

describe('participaEventoService.listarParticipacoes', () => {
  it('retorna lista do repositório', async () => {
    repo.findAll.mockResolvedValue([sample]);
    await expect(svc.listarParticipacoes()).resolves.toEqual([sample]);
    expect(repo.findAll).toHaveBeenCalledTimes(1);
  });
});

describe('participaEventoService.listarPorEvento', () => {
  it('delega ao repositório com id do evento', async () => {
    repo.findByEvento.mockResolvedValue([sample]);
    await expect(svc.listarPorEvento(10)).resolves.toEqual([sample]);
    expect(repo.findByEvento).toHaveBeenCalledWith(10);
  });
});

describe('participaEventoService.listarPorAluno', () => {
  it('delega ao repositório com id do aluno', async () => {
    repo.findByAluno.mockResolvedValue([sample]);
    await expect(svc.listarPorAluno(5)).resolves.toEqual([sample]);
    expect(repo.findByAluno).toHaveBeenCalledWith(5);
  });
});

describe('participaEventoService.buscarParticipacao', () => {
  it('retorna participação quando existe', async () => {
    repo.findOne.mockResolvedValue(sample);
    await expect(svc.buscarParticipacao(10, 5)).resolves.toEqual(sample);
  });

  it('lança NotFoundError quando não existe', async () => {
    repo.findOne.mockResolvedValue(null);
    await expect(svc.buscarParticipacao(10, 999)).rejects.toThrow(NotFoundError);
  });
});

describe('participaEventoService.registrarParticipacao', () => {
  it('lança ConflictError quando participação já existe', async () => {
    repo.findOne.mockResolvedValue(sample);
    await expect(svc.registrarParticipacao(sample)).rejects.toThrow(ConflictError);
    expect(repo.create).not.toHaveBeenCalled();
  });

  it('registra participação quando não há conflito', async () => {
    repo.findOne.mockResolvedValue(null);
    repo.create.mockResolvedValue(sample);
    await expect(svc.registrarParticipacao(sample)).resolves.toEqual(sample);
    expect(repo.create).toHaveBeenCalledTimes(1);
  });
});

describe('participaEventoService.atualizarPresenca', () => {
  it('lança NotFoundError quando participação não existe', async () => {
    repo.findOne.mockResolvedValue(null);
    await expect(svc.atualizarPresenca(10, 999, true)).rejects.toThrow(NotFoundError);
  });

  it('lança NotFoundError quando update retorna null', async () => {
    repo.findOne.mockResolvedValue(sample);
    repo.update.mockResolvedValue(null);
    await expect(svc.atualizarPresenca(10, 5, true)).rejects.toThrow(NotFoundError);
  });

  it('atualiza e retorna participação', async () => {
    const updated = { ...sample, presenca: true };
    repo.findOne.mockResolvedValue(sample);
    repo.update.mockResolvedValue(updated);
    await expect(svc.atualizarPresenca(10, 5, true)).resolves.toEqual(updated);
  });
});

describe('participaEventoService.removerParticipacao', () => {
  it('lança NotFoundError quando participação não existe', async () => {
    repo.remove.mockResolvedValue(false);
    await expect(svc.removerParticipacao(10, 999)).rejects.toThrow(NotFoundError);
  });

  it('resolve quando remoção é bem-sucedida', async () => {
    repo.remove.mockResolvedValue(true);
    await expect(svc.removerParticipacao(10, 5)).resolves.toBeUndefined();
  });
});

// ── Controller HTTP tests ─────────────────────────────────────────────────────

describe('GET /participacoes-evento', () => {
  it('200 — lista participações', async () => {
    repo.findAll.mockResolvedValue([sample]);
    const res = await request(app).get('/participacoes-evento');
    expect(res.status).toBe(200);
    expect(res.body).toEqual([sample]);
  });
});

describe('GET /participacoes-evento/evento/:id_evento', () => {
  it('200 — participações por evento', async () => {
    repo.findByEvento.mockResolvedValue([sample]);
    const res = await request(app).get('/participacoes-evento/evento/10');
    expect(res.status).toBe(200);
    expect(res.body).toEqual([sample]);
  });
});

describe('GET /participacoes-evento/aluno/:id_aluno', () => {
  it('200 — participações por aluno', async () => {
    repo.findByAluno.mockResolvedValue([sample]);
    const res = await request(app).get('/participacoes-evento/aluno/5');
    expect(res.status).toBe(200);
    expect(res.body).toEqual([sample]);
  });
});

describe('GET /participacoes-evento/:id_evento/:id_aluno', () => {
  it('200 — participação encontrada', async () => {
    repo.findOne.mockResolvedValue(sample);
    const res = await request(app).get('/participacoes-evento/10/5');
    expect(res.status).toBe(200);
    expect(res.body).toEqual(sample);
  });

  it('404 — participação não encontrada', async () => {
    repo.findOne.mockResolvedValue(null);
    const res = await request(app).get('/participacoes-evento/10/999');
    expect(res.status).toBe(404);
  });
});

describe('POST /participacoes-evento', () => {
  it('201 — registra participação com sucesso', async () => {
    repo.findOne.mockResolvedValue(null);
    repo.create.mockResolvedValue(sample);
    const res = await request(app).post('/participacoes-evento').send(sample);
    expect(res.status).toBe(201);
    expect(res.body).toEqual(sample);
  });

  it('409 — conflito quando já está registrado', async () => {
    repo.findOne.mockResolvedValue(sample);
    const res = await request(app).post('/participacoes-evento').send(sample);
    expect(res.status).toBe(409);
  });
});

describe('PUT /participacoes-evento/:id_evento/:id_aluno', () => {
  it('200 — atualiza presença', async () => {
    const updated = { ...sample, presenca: true };
    repo.findOne.mockResolvedValue(sample);
    repo.update.mockResolvedValue(updated);
    const res = await request(app)
      .put('/participacoes-evento/10/5')
      .send({ presenca: true });
    expect(res.status).toBe(200);
    expect(res.body).toEqual(updated);
  });

  it('404 — participação não existe', async () => {
    repo.findOne.mockResolvedValue(null);
    const res = await request(app)
      .put('/participacoes-evento/10/999')
      .send({ presenca: true });
    expect(res.status).toBe(404);
  });
});

describe('DELETE /participacoes-evento/:id_evento/:id_aluno', () => {
  it('204 — remove participação com sucesso', async () => {
    repo.remove.mockResolvedValue(true);
    const res = await request(app).delete('/participacoes-evento/10/5');
    expect(res.status).toBe(204);
  });

  it('404 — participação não existe', async () => {
    repo.remove.mockResolvedValue(false);
    const res = await request(app).delete('/participacoes-evento/10/999');
    expect(res.status).toBe(404);
  });
});
