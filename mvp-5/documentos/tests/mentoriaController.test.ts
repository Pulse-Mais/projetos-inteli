/**
 * tests/mentoriaController.test.ts
 * Testes de integração dos controllers de Mentoria via Supertest.
 *
 * Estratégia de isolamento: mentoriaService é completamente mockado.
 * Apenas o contrato HTTP (status e shape do body) é verificado.
 */

import request from 'supertest';
import { Application } from 'express';
import { createApp } from '../../src/app';
import * as mentoriaService from '../../src/services/mentoriaService';
import { NotFoundError, ForbiddenError } from '../../src/errors/AppError';
import type { SessaoMentoria } from '../../src/models/sessaoMentoria';

// ── Mock do service ───────────────────────────────────────────────────────────
jest.mock('../../src/services/mentoriaService');
const serviceMock = jest.mocked(mentoriaService);

// ── App Supertest (sem porta TCP) ─────────────────────────────────────────────
let app: Application;

beforeAll(() => {
  app = createApp();
});

beforeEach(() => {
  jest.clearAllMocks();
});

// ── Fixture ───────────────────────────────────────────────────────────────────
function makeSessao(overrides: Partial<SessaoMentoria> = {}): SessaoMentoria {
  return {
    id: 1,
    id_jovem: 5,
    id_mentor: 2,
    data: new Date('2025-04-10'),
    presente: true,
    ...overrides,
  };
}

// ══════════════════════════════════════════════════════════════════════════════
// GET /api/mentor/:id/mentorias
// ══════════════════════════════════════════════════════════════════════════════
describe('GET /api/mentor/:id/mentorias', () => {
  // CI-PM17 — sucesso 200                                                RN24, RF019
  test('CI-PM17 — 200: retorna sessões do mentor', async () => {
    // Arrange
    serviceMock.listarPorMentor.mockResolvedValue([
      makeSessao(),
      makeSessao({ id: 2, data: new Date('2025-05-01') }),
    ]);

    // Act
    const res = await request(app).get('/api/mentor/2/mentorias');

    // Assert
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body).toHaveLength(2);
    expect(serviceMock.listarPorMentor).toHaveBeenCalledWith(2);
  });

  test('200: retorna array vazio quando mentor não tem sessões', async () => {
    // Arrange
    serviceMock.listarPorMentor.mockResolvedValue([]);

    // Act
    const res = await request(app).get('/api/mentor/99/mentorias');

    // Assert
    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// POST /api/mentorias
// ══════════════════════════════════════════════════════════════════════════════
describe('POST /api/mentorias', () => {
  // CI-PM20 — sucesso 201
  test('CI-PM20 — 201: cria sessão e repassa DTO normalizado ao service', async () => {
    // Arrange
    serviceMock.criarSessao.mockResolvedValue(makeSessao());

    // Act
    const res = await request(app)
      .post('/api/mentorias')
      .send({ id_jovem: 5, id_mentor: 2, data: '2025-06-28', presente: false, id_usuario: 2 });

    // Assert
    expect(res.status).toBe(201);
    expect(serviceMock.criarSessao).toHaveBeenCalledTimes(1);
    const [dto, idUsuario] = serviceMock.criarSessao.mock.calls[0];
    expect(dto).toMatchObject({ id_jovem: 5, id_mentor: 2, presente: false });
    expect(idUsuario).toBe(2);
  });

  // CI-PM21 — 422 quando id_jovem/id_mentor inválidos
  test('CI-PM21 — 422: id_jovem ausente é rejeitado pelo parseId antes do service', async () => {
    // Act
    const res = await request(app)
      .post('/api/mentorias')
      .send({ id_mentor: 2, data: '2025-06-28', id_usuario: 2 });

    // Assert
    expect(res.status).toBe(422);
    expect(serviceMock.criarSessao).not.toHaveBeenCalled();
  });

  // CI-PM22 — 403 quando perfil não-Mentor (propagado do service)
  test('CI-PM22 — 403: ForbiddenError do service é propagado', async () => {
    // Arrange
    serviceMock.criarSessao.mockRejectedValue(
      new ForbiddenError('perfil não autorizado para esta operação')
    );

    // Act
    const res = await request(app)
      .post('/api/mentorias')
      .send({ id_jovem: 5, id_mentor: 2, data: '2025-06-28', id_usuario: 7 });

    // Assert
    expect(res.status).toBe(403);
    expect(res.body).toHaveProperty('error');
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// PUT /api/mentorias/:id/info
// ══════════════════════════════════════════════════════════════════════════════
describe('PUT /api/mentorias/:id/info', () => {
  // CI-PM18 — sucesso 200                                                RN25, RF019
  test('CI-PM18 — 200: Mentor atualiza sessão existente', async () => {
    // Arrange
    const sessaoAtualizada = makeSessao({ presente: false });
    serviceMock.atualizarSessao.mockResolvedValue(sessaoAtualizada);

    // Act
    const res = await request(app)
      .put('/api/mentorias/1/info')
      .send({ presente: false });

    // Assert
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('presente', false);
  });

  // 403 — perfil não autorizado                                          RN25, RF019
  test('403: perfil não-Mentor retorna ForbiddenError', async () => {
    // Arrange
    serviceMock.atualizarSessao.mockRejectedValue(
      new ForbiddenError('perfil não autorizado para esta operação')
    );

    // Act
    const res = await request(app)
      .put('/api/mentorias/1/info')
      .send({ presente: false });

    // Assert
    expect(res.status).toBe(403);
    expect(res.body).toHaveProperty('error');
  });

  // CI-PM19 — 404 sessão inexistente                                    RN25, RF019
  test('CI-PM19 — 404: sessão inexistente retorna erro', async () => {
    // Arrange
    serviceMock.atualizarSessao.mockRejectedValue(new NotFoundError('sessão de mentoria'));

    // Act
    const res = await request(app)
      .put('/api/mentorias/99/info')
      .send({ presente: true });

    // Assert
    expect(res.status).toBe(404);
    expect(res.body).toHaveProperty('error');
  });
});
