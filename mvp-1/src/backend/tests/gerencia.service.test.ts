jest.mock('../repositories/gerenciaRepository');

import request from 'supertest';
import { app } from '../app';
import * as svc from '../services/gerenciaService';
import { NotFoundError, ConflictError } from '../errors/AppError';

const repo = require('../repositories/gerenciaRepository') as jest.Mocked<
  typeof import('../repositories/gerenciaRepository')
>;

const sample: import('../repositories/gerenciaRepository').GerenciaRow = {
  id_coordenador: 3,
  id_programa: 7,
};

beforeEach(() => jest.clearAllMocks());

// ── Service unit tests ────────────────────────────────────────────────────────

describe('gerenciaService.listarGerencias', () => {
  it('retorna lista do repositório', async () => {
    repo.findAll.mockResolvedValue([sample]);
    await expect(svc.listarGerencias()).resolves.toEqual([sample]);
    expect(repo.findAll).toHaveBeenCalledTimes(1);
  });
});

describe('gerenciaService.listarPorPrograma', () => {
  it('delega ao repositório com id do programa', async () => {
    repo.findByPrograma.mockResolvedValue([sample]);
    await expect(svc.listarPorPrograma(7)).resolves.toEqual([sample]);
    expect(repo.findByPrograma).toHaveBeenCalledWith(7);
  });
});

describe('gerenciaService.listarPorCoordenador', () => {
  it('delega ao repositório com id do coordenador', async () => {
    repo.findByCoordenador.mockResolvedValue([sample]);
    await expect(svc.listarPorCoordenador(3)).resolves.toEqual([sample]);
    expect(repo.findByCoordenador).toHaveBeenCalledWith(3);
  });
});

describe('gerenciaService.criarGerencia', () => {
  it('lança ConflictError quando vínculo já existe', async () => {
    repo.findOne.mockResolvedValue(sample);
    await expect(svc.criarGerencia(sample)).rejects.toThrow(ConflictError);
    expect(repo.create).not.toHaveBeenCalled();
  });

  it('cria gerência quando não há conflito', async () => {
    repo.findOne.mockResolvedValue(null);
    repo.create.mockResolvedValue(sample);
    await expect(svc.criarGerencia(sample)).resolves.toEqual(sample);
    expect(repo.create).toHaveBeenCalledTimes(1);
  });
});

describe('gerenciaService.deletarGerencia', () => {
  it('lança NotFoundError quando vínculo não existe', async () => {
    repo.remove.mockResolvedValue(false);
    await expect(svc.deletarGerencia(3, 999)).rejects.toThrow(NotFoundError);
  });

  it('resolve quando remoção é bem-sucedida', async () => {
    repo.remove.mockResolvedValue(true);
    await expect(svc.deletarGerencia(3, 7)).resolves.toBeUndefined();
  });
});

// ── Controller HTTP tests ─────────────────────────────────────────────────────

describe('GET /gerencias', () => {
  it('200 — lista gerências', async () => {
    repo.findAll.mockResolvedValue([sample]);
    const res = await request(app).get('/gerencias');
    expect(res.status).toBe(200);
    expect(res.body).toEqual([sample]);
  });
});

describe('GET /gerencias/programa/:id_programa', () => {
  it('200 — gerências por programa', async () => {
    repo.findByPrograma.mockResolvedValue([sample]);
    const res = await request(app).get('/gerencias/programa/7');
    expect(res.status).toBe(200);
    expect(res.body).toEqual([sample]);
  });
});

describe('GET /gerencias/coordenador/:id_coordenador', () => {
  it('200 — gerências por coordenador', async () => {
    repo.findByCoordenador.mockResolvedValue([sample]);
    const res = await request(app).get('/gerencias/coordenador/3');
    expect(res.status).toBe(200);
    expect(res.body).toEqual([sample]);
  });
});

describe('POST /gerencias', () => {
  it('201 — cria gerência com sucesso', async () => {
    repo.findOne.mockResolvedValue(null);
    repo.create.mockResolvedValue(sample);
    const res = await request(app).post('/gerencias').send(sample);
    expect(res.status).toBe(201);
    expect(res.body).toEqual(sample);
  });

  it('409 — conflito quando vínculo já existe', async () => {
    repo.findOne.mockResolvedValue(sample);
    const res = await request(app).post('/gerencias').send(sample);
    expect(res.status).toBe(409);
  });
});

describe('DELETE /gerencias/:id_coordenador/:id_programa', () => {
  it('204 — remove gerência com sucesso', async () => {
    repo.remove.mockResolvedValue(true);
    const res = await request(app).delete('/gerencias/3/7');
    expect(res.status).toBe(204);
  });

  it('404 — vínculo não existe', async () => {
    repo.remove.mockResolvedValue(false);
    const res = await request(app).delete('/gerencias/3/999');
    expect(res.status).toBe(404);
  });
});
