/**
 * tests/usuarioController.test.ts
 * Testes de integração do controller de Usuário via Supertest.
 *
 * Estratégia de isolamento: usuarioService é completamente mockado.
 * Apenas o contrato HTTP (status e shape do body) é verificado.
 */

import request from 'supertest';
import { Application } from 'express';
import { createApp } from '../../src/app';
import * as usuarioService from '../../src/services/usuarioService';
import { NotFoundError, BadRequestError, ConflictError } from '../../src/errors/AppError';
import type { Usuario } from '../../src/models/usuario';

// ── Mock do service ───────────────────────────────────────────────────────────
jest.mock('../../src/services/usuarioService');
const serviceMock = jest.mocked(usuarioService);

// ── App Supertest (sem porta TCP) ─────────────────────────────────────────────
// CORRIGIDO: app criado em beforeAll para garantir isolamento entre suítes
// e evitar estado compartilhado em escopo de módulo.
let app: Application;

beforeAll(() => {
  app = createApp();
});

// ── Fixture ───────────────────────────────────────────────────────────────────
function makeUsuario(overrides: Partial<Usuario> = {}): Usuario {
  return {
    id: 1,
    id_jovem: null,
    nome: 'Carlos Gestor',
    email: 'carlos@example.com',
    perfil: 'Gestao',
    criado_em: new Date('2024-03-01'),
    ...overrides,
  };
}

beforeEach(() => {
  jest.clearAllMocks();
});

// ══════════════════════════════════════════════════════════════════════════════
// GET /api/usuarios
// ══════════════════════════════════════════════════════════════════════════════
describe('GET /api/usuarios', () => {
  test('200 — retorna lista de usuários', async () => {
    // Arrange
    serviceMock.listarTodos.mockResolvedValue([
      makeUsuario(),
      makeUsuario({ id: 2, nome: 'Ana' }),
    ]);

    // Act
    const res = await request(app).get('/api/usuarios');

    // Assert
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body).toHaveLength(2);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// GET /api/usuarios/:id
// ══════════════════════════════════════════════════════════════════════════════
describe('GET /api/usuarios/:id', () => {
  test('200 — retorna usuario encontrado', async () => {
    // Arrange
    serviceMock.buscarPorId.mockResolvedValue(makeUsuario());

    // Act
    const res = await request(app).get('/api/usuarios/1');

    // Assert
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ id: 1, nome: 'Carlos Gestor' });
  });

  test('404 — usuario não encontrado', async () => {
    // Arrange
    serviceMock.buscarPorId.mockRejectedValue(new NotFoundError('usuário'));

    // Act
    const res = await request(app).get('/api/usuarios/999');

    // Assert
    expect(res.status).toBe(404);
    expect(res.body).toHaveProperty('error');
  });

  // Após a padronização (helper parseId), o controller valida o formato do :id
  // de forma consistente com jovemController: id não-numérico → 422 (em vez de
  // delegar NaN ao service). O service não chega a ser chamado.
  test('422 — id não-numérico é rejeitado pelo parseId antes do service', async () => {
    // Act
    const res = await request(app).get('/api/usuarios/abc');

    // Assert
    expect(res.status).toBe(422);
    expect(serviceMock.buscarPorId).not.toHaveBeenCalled();
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// POST /api/usuarios
// ══════════════════════════════════════════════════════════════════════════════
describe('POST /api/usuarios', () => {
  test('201 — cria usuario e retorna Location header', async () => {
    // Arrange
    serviceMock.criar.mockResolvedValue(makeUsuario());
    const payload = { nome: 'Carlos Gestor', email: 'carlos@example.com', perfil: 'Gestao' };

    // Act
    const res = await request(app).post('/api/usuarios').send(payload);

    // Assert
    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({ id: 1 });
    expect(res.headers['location']).toContain('/api/usuarios/1');
  });

  test('400 — BadRequestError do service (ex: nome inválido)', async () => {
    // Arrange
    serviceMock.criar.mockRejectedValue(new BadRequestError('nome inválido'));

    // Act
    const res = await request(app)
      .post('/api/usuarios')
      .send({ nome: 'X', email: 'x@x.com', perfil: 'Gestao' });

    // Assert
    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('error');
  });

  test('409 — ConflictError quando email já está cadastrado', async () => {
    // Arrange
    serviceMock.criar.mockRejectedValue(
      new ConflictError('email ou vínculo de jovem já cadastrado')
    );

    // Act
    const res = await request(app)
      .post('/api/usuarios')
      .send({ nome: 'Carlos', email: 'carlos@example.com', perfil: 'Gestao' });

    // Assert
    expect(res.status).toBe(409);
    expect(res.body).toHaveProperty('error');
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// PUT /api/usuarios/:id
// ══════════════════════════════════════════════════════════════════════════════
describe('PUT /api/usuarios/:id', () => {
  test('200 — atualiza e retorna usuario', async () => {
    // Arrange
    serviceMock.atualizar.mockResolvedValue(makeUsuario({ nome: 'Carlos Editado' }));

    // Act
    const res = await request(app).put('/api/usuarios/1').send({ nome: 'Carlos Editado' });

    // Assert
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ nome: 'Carlos Editado' });
  });

  test('400 — BadRequestError quando email de atualização é inválido', async () => {
    // Arrange
    serviceMock.atualizar.mockRejectedValue(new BadRequestError('email inválido'));

    // Act
    const res = await request(app).put('/api/usuarios/1').send({ email: 'invalido' });

    // Assert
    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('error');
  });

  test('404 — usuario não encontrado', async () => {
    // Arrange
    serviceMock.atualizar.mockRejectedValue(new NotFoundError('usuário'));

    // Act
    const res = await request(app).put('/api/usuarios/999').send({ nome: 'X' });

    // Assert
    expect(res.status).toBe(404);
    expect(res.body).toHaveProperty('error');
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// DELETE /api/usuarios/:id
// ══════════════════════════════════════════════════════════════════════════════
describe('DELETE /api/usuarios/:id', () => {
  test('204 — remove usuario e retorna body vazio', async () => {
    // Arrange
    // CORRIGIDO: remover retorna Promise<void>; mockResolvedValue recebe
    // undefined explicitamente para compatibilidade com strict TypeScript.
    serviceMock.remover.mockResolvedValue(undefined as void);

    // Act
    const res = await request(app).delete('/api/usuarios/1');

    // Assert
    expect(res.status).toBe(204);
    expect(res.body).toEqual({});
  });

  test('404 — usuario não encontrado', async () => {
    // Arrange
    serviceMock.remover.mockRejectedValue(new NotFoundError('usuário'));

    // Act
    const res = await request(app).delete('/api/usuarios/999');

    // Assert
    expect(res.status).toBe(404);
    expect(res.body).toHaveProperty('error');
  });
});
