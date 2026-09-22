jest.mock('../db/supabaseClient', () => ({ supabase: {} }));
jest.mock('../repositories/eventoRepository');
jest.mock('../repositories/alunoRepository');
jest.mock('../services/emailService');

import request from 'supertest';
import { app } from '../app';

const repo = require('../repositories/eventoRepository') as jest.Mocked<
  typeof import('../repositories/eventoRepository')
>;

const sample = {
  id_evento: 1,
  nome: 'Evento Teste',
  data: '2025-06-15T14:00:00.000Z',
  local: 'Auditório Principal',
};

beforeEach(() => jest.clearAllMocks());

describe('GET /eventos', () => {
  it('retorna lista de eventos com status 200', async () => {
    repo.findAll.mockResolvedValue([sample]);
    const res = await request(app).get('/eventos');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });
});

describe('GET /eventos/:id', () => {
  it('retorna o evento criado com status 200', async () => {
    repo.findById.mockResolvedValue(sample);
    const res = await request(app).get('/eventos/1');
    expect(res.status).toBe(200);
    expect(res.body.id_evento).toBe(1);
    expect(res.body.nome).toBe(sample.nome);
    expect(res.body.local).toBe(sample.local);
  });

  it('retorna 404 para id inexistente', async () => {
    repo.findById.mockResolvedValue(null);
    const res = await request(app).get('/eventos/999999');
    expect(res.status).toBe(404);
  });
});

describe('POST /eventos', () => {
  it('retorna 201 e cria evento com dados validos', async () => {
    const alunoRepo = require('../repositories/alunoRepository') as jest.Mocked<
      typeof import('../repositories/alunoRepository')
    >;
    alunoRepo.findAllComUsuario.mockResolvedValue([]);
    repo.create.mockResolvedValue(sample);
    const res = await request(app).post('/eventos').send({
      nome: 'Evento Extra',
      data: '2025-07-20T10:00:00.000Z',
      local: 'Sala de Reuniões',
    });
    expect(res.status).toBe(201);
    expect(res.body.id_evento).toBeDefined();
  });
});

describe('PUT /eventos/:id', () => {
  it('atualiza o nome do evento e retorna 200', async () => {
    const updated = { ...sample, nome: 'Evento Atualizado' };
    repo.update.mockResolvedValue(updated);
    const res = await request(app)
      .put('/eventos/1')
      .send({ nome: 'Evento Atualizado' });
    expect(res.status).toBe(200);
    expect(res.body.nome).toBe('Evento Atualizado');
  });

  it('retorna 404 para id inexistente', async () => {
    repo.update.mockResolvedValue(null);
    const res = await request(app)
      .put('/eventos/999999')
      .send({ nome: 'Qualquer' });
    expect(res.status).toBe(404);
  });
});

describe('DELETE /eventos/:id', () => {
  it('deleta o evento e retorna 204', async () => {
    repo.remove.mockResolvedValue(true);
    const res = await request(app).delete('/eventos/1');
    expect(res.status).toBe(204);
  });

  it('retorna 404 para id inexistente', async () => {
    repo.remove.mockResolvedValue(false);
    const res = await request(app).delete('/eventos/999999');
    expect(res.status).toBe(404);
  });
});
