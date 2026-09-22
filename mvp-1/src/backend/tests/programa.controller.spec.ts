jest.mock('../db/supabaseClient', () => ({ supabase: {} }));
jest.mock('../repositories/programaRepository');

import request from 'supertest';
import { app } from '../app';

const repo = require('../repositories/programaRepository') as jest.Mocked<
  typeof import('../repositories/programaRepository')
>;

const sample = {
  id_programa: 1,
  titulo: 'Programa Teste',
  inicio: '2025-01-01',
  fim: '2025-12-31',
};

beforeEach(() => jest.clearAllMocks());

describe('GET /programas', () => {
  it('retorna lista de programas com status 200', async () => {
    repo.findAll.mockResolvedValue([sample]);
    const res = await request(app).get('/programas');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });
});

describe('GET /programas/:id', () => {
  it('retorna o programa criado com status 200', async () => {
    repo.findById.mockResolvedValue(sample);
    const res = await request(app).get('/programas/1');
    expect(res.status).toBe(200);
    expect(res.body.id_programa).toBe(1);
    expect(res.body.titulo).toBe(sample.titulo);
  });

  it('retorna 404 para id inexistente', async () => {
    repo.findById.mockResolvedValue(null);
    const res = await request(app).get('/programas/999999');
    expect(res.status).toBe(404);
  });
});

describe('POST /programas', () => {
  it('retorna 201 e cria programa com dados validos', async () => {
    repo.create.mockResolvedValue(sample);
    const res = await request(app).post('/programas').send({
      titulo: 'Programa Extra',
      inicio: '2025-03-01',
      fim: '2025-09-30',
    });
    expect(res.status).toBe(201);
    expect(res.body.id_programa).toBeDefined();
  });
});

describe('PUT /programas/:id', () => {
  it('atualiza o titulo do programa e retorna 200', async () => {
    const updated = { ...sample, titulo: 'Programa Atualizado' };
    repo.findById.mockResolvedValue(sample);
    repo.update.mockResolvedValue(updated);
    const res = await request(app)
      .put('/programas/1')
      .send({ titulo: 'Programa Atualizado' });
    expect(res.status).toBe(200);
    expect(res.body.titulo).toBe('Programa Atualizado');
  });

  it('retorna 404 para id inexistente', async () => {
    repo.findById.mockResolvedValue(null);
    const res = await request(app)
      .put('/programas/999999')
      .send({ titulo: 'Qualquer' });
    expect(res.status).toBe(404);
  });
});

describe('DELETE /programas/:id', () => {
  it('deleta o programa e retorna 204', async () => {
    repo.remove.mockResolvedValue(true);
    const res = await request(app).delete('/programas/1');
    expect(res.status).toBe(204);
  });

  it('retorna 404 para id inexistente', async () => {
    repo.remove.mockResolvedValue(false);
    const res = await request(app).delete('/programas/999999');
    expect(res.status).toBe(404);
  });
});
