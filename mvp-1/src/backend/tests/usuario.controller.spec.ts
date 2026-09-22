jest.mock('../db/supabaseClient', () => ({ supabase: {} }));
jest.mock('../repositories/usuarioRepository');

import request from 'supertest';
import { app } from '../app';

const repo = require('../repositories/usuarioRepository') as jest.Mocked<
  typeof import('../repositories/usuarioRepository')
>;

const sample = {
  id_usuario: 1,
  nome: 'Usuario Teste',
  email: 'usuario.teste@email.com',
  cpf: '12345678901',
  senha: 'senha_teste_123',
};

beforeEach(() => jest.clearAllMocks());

describe('GET /usuarios', () => {
  it('retorna lista de usuarios com status 200', async () => {
    repo.findAll.mockResolvedValue([sample]);
    const res = await request(app).get('/usuarios');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });
});

describe('GET /usuarios/:id', () => {
  it('retorna o usuario criado com status 200', async () => {
    repo.findById.mockResolvedValue(sample);
    const res = await request(app).get('/usuarios/1');
    expect(res.status).toBe(200);
    expect(res.body.id_usuario).toBe(1);
    expect(res.body.nome).toBe(sample.nome);
    expect(res.body.email).toBe(sample.email);
  });

  it('retorna 404 para id inexistente', async () => {
    repo.findById.mockResolvedValue(null);
    const res = await request(app).get('/usuarios/999999');
    expect(res.status).toBe(404);
  });
});

describe('POST /usuarios', () => {
  it('retorna 201 e cria usuario com dados validos', async () => {
    repo.findByCpf.mockResolvedValue(null);
    repo.findByEmail.mockResolvedValue(null);
    const novo = { ...sample, id_usuario: 2, email: 'novo@email.com', cpf: '99988877766' };
    repo.create.mockResolvedValue(novo);
    const res = await request(app).post('/usuarios').send({
      nome: 'Novo Usuario',
      email: 'novo@email.com',
      senha: 'senha_nova',
      cpf: '99988877766',
    });
    expect(res.status).toBe(201);
    expect(res.body.id_usuario).toBeDefined();
  });

  it('retorna 409 para CPF duplicado', async () => {
    repo.findByCpf.mockResolvedValue(sample);
    const res = await request(app).post('/usuarios').send({
      ...sample,
      email: 'outro@email.com',
    });
    expect(res.status).toBe(409);
  });

  it('retorna 409 para e-mail duplicado', async () => {
    repo.findByCpf.mockResolvedValue(null);
    repo.findByEmail.mockResolvedValue(sample);
    const res = await request(app).post('/usuarios').send({
      ...sample,
      cpf: '00011122233',
    });
    expect(res.status).toBe(409);
  });
});

describe('PUT /usuarios/:id', () => {
  it('atualiza o nome do usuario e retorna 200', async () => {
    repo.findByCpf.mockResolvedValue(null);
    repo.findByEmail.mockResolvedValue(null);
    const updated = { ...sample, nome: 'Nome Atualizado' };
    repo.update.mockResolvedValue(updated);
    repo.findById.mockResolvedValue(updated);
    const res = await request(app)
      .put('/usuarios/1')
      .send({ nome: 'Nome Atualizado' });
    expect(res.status).toBe(200);
    expect(res.body.nome).toBe('Nome Atualizado');
  });

  it('retorna 404 para id inexistente', async () => {
    repo.update.mockResolvedValue(null);
    const res = await request(app)
      .put('/usuarios/999999')
      .send({ nome: 'Qualquer' });
    expect(res.status).toBe(404);
  });
});

describe('DELETE /usuarios/:id', () => {
  it('deleta o usuario e retorna 204', async () => {
    repo.remove.mockResolvedValue(true);
    const res = await request(app).delete('/usuarios/1');
    expect(res.status).toBe(204);
  });

  it('retorna 404 para id inexistente', async () => {
    repo.remove.mockResolvedValue(false);
    const res = await request(app).delete('/usuarios/999999');
    expect(res.status).toBe(404);
  });
});
