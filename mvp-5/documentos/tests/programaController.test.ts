/**
 * tests/programaController.test.ts
 * Testes de integração dos controllers de Programa e Inscrição via Supertest.
 *
 * Estratégia de isolamento: programaService é completamente mockado.
 * Apenas o contrato HTTP (status e shape do body) é verificado.
 */

import request from 'supertest';
import { Application } from 'express';
import { createApp } from '../../src/app';
import * as programaService from '../../src/services/programaService';
import { NotFoundError, ConflictError, BadRequestError } from '../../src/errors/AppError';
import type { Programa } from '../../src/models/programa';
import type { Inscricao } from '../../src/models/inscricao';

// ── Mock do service ───────────────────────────────────────────────────────────
jest.mock('../../src/services/programaService');
const serviceMock = jest.mocked(programaService);

// ── App Supertest (sem porta TCP) ─────────────────────────────────────────────
let app: Application;

beforeAll(() => {
  app = createApp();
});

beforeEach(() => {
  jest.clearAllMocks();
});

// ── Fixtures ──────────────────────────────────────────────────────────────────
function makePrograma(overrides: Partial<Programa> = {}): Programa {
  return {
    id: 1,
    nome: 'Programa Capacitação 2025',
    descricao: 'Descrição',
    data_inicio: new Date('2025-01-01'),
    data_fim: new Date('2025-12-31'),
    ...overrides,
  };
}

function makeInscricao(overrides: Partial<Inscricao> = {}): Inscricao {
  return {
    id: 10,
    id_jovem: 5,
    id_programa: 1,
    status_conclusao: 'Em andamento',
    data_matricula: new Date('2025-02-01'),
    data_status: null,
    ...overrides,
  };
}

// ══════════════════════════════════════════════════════════════════════════════
// GET /api/programas
// ══════════════════════════════════════════════════════════════════════════════
describe('GET /api/programas', () => {
  // CI-PM01 — sucesso                                                    RN08, RF004
  test('CI-PM01 — 200: retorna lista de programas', async () => {
    // Arrange
    serviceMock.listar.mockResolvedValue([makePrograma(), makePrograma({ id: 2 })]);

    // Act
    const res = await request(app).get('/api/programas');

    // Assert
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body).toHaveLength(2);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// POST /api/programas
// ══════════════════════════════════════════════════════════════════════════════
describe('POST /api/programas', () => {
  // CI-PM02 — sucesso 201                                                RN08, RF004
  test('CI-PM02 — 201: cria programa e retorna o objeto criado com header Location', async () => {
    // Arrange
    const programa = makePrograma();
    serviceMock.criar.mockResolvedValue(programa);

    // Act
    const res = await request(app)
      .post('/api/programas')
      .send({ nome: 'Programa Capacitação 2025', data_inicio: '2025-01-01' });

    // Assert
    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('id', 1);
    expect(res.headers['location']).toMatch(/\/api\/programas\/1/);
  });

  // CI-PM03 — 400 validação                                             RN08, RF004
  test('CI-PM03 — 400: campo obrigatório ausente retorna erro', async () => {
    // Arrange
    serviceMock.criar.mockRejectedValue(new BadRequestError('nome é obrigatório'));

    // Act
    const res = await request(app)
      .post('/api/programas')
      .send({ descricao: 'sem nome' });

    // Assert
    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('error');
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// GET /api/programas/:id
// ══════════════════════════════════════════════════════════════════════════════
describe('GET /api/programas/:id', () => {
  // CI-PM04 — sucesso 200                                                RN08, RF004
  test('CI-PM04 — 200: retorna programa pelo id', async () => {
    // Arrange
    serviceMock.buscarPorId.mockResolvedValue(makePrograma());

    // Act
    const res = await request(app).get('/api/programas/1');

    // Assert
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('id', 1);
  });

  // CI-PM05 — 404 não encontrado                                        RN08, RF004
  test('CI-PM05 — 404: programa inexistente retorna erro', async () => {
    // Arrange
    serviceMock.buscarPorId.mockRejectedValue(new NotFoundError('programa'));

    // Act
    const res = await request(app).get('/api/programas/99');

    // Assert
    expect(res.status).toBe(404);
    expect(res.body).toHaveProperty('error');
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// PUT /api/programas/:id
// ══════════════════════════════════════════════════════════════════════════════
describe('PUT /api/programas/:id', () => {
  // CI-PM06 — sucesso 200                                                RN08, RF004
  test('CI-PM06 — 200: atualiza programa e retorna o objeto atualizado', async () => {
    // Arrange
    serviceMock.atualizar.mockResolvedValue(makePrograma({ nome: 'Novo Nome' }));

    // Act
    const res = await request(app)
      .put('/api/programas/1')
      .send({ nome: 'Novo Nome' });

    // Assert
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('nome', 'Novo Nome');
  });

  // CI-PM07 — 404 não encontrado                                        RN08, RF004
  test('CI-PM07 — 404: programa inexistente retorna erro', async () => {
    // Arrange
    serviceMock.atualizar.mockRejectedValue(new NotFoundError('programa'));

    // Act
    const res = await request(app)
      .put('/api/programas/99')
      .send({ nome: 'X' });

    // Assert
    expect(res.status).toBe(404);
    expect(res.body).toHaveProperty('error');
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// GET /api/programas/:id/alunos
// ══════════════════════════════════════════════════════════════════════════════
describe('GET /api/programas/:id/alunos', () => {
  // CI-PM08 — sucesso 200
  test('CI-PM08 — 200: retorna alunos inscritos no programa', async () => {
    // Arrange
    serviceMock.listStudents.mockResolvedValue([
      { id_jovem: 1, nome: 'Ana', status_conclusao: 'Em andamento' },
    ]);

    // Act
    const res = await request(app).get('/api/programas/1/alunos');

    // Assert
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  // CI-PM09 — 404 não encontrado
  test('CI-PM09 — 404: programa inexistente retorna erro', async () => {
    // Arrange
    serviceMock.listStudents.mockRejectedValue(new NotFoundError('programa'));

    // Act
    const res = await request(app).get('/api/programas/99/alunos');

    // Assert
    expect(res.status).toBe(404);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// GET /api/programas/:id/eventos
// ══════════════════════════════════════════════════════════════════════════════
describe('GET /api/programas/:id/eventos', () => {
  // CI-PM10 — sucesso 200
  test('CI-PM10 — 200: retorna aulas do programa', async () => {
    // Arrange
    serviceMock.listEvents.mockResolvedValue([
      { id: 1, nome: 'Aula 1', data: new Date('2025-03-10') },
    ]);

    // Act
    const res = await request(app).get('/api/programas/1/eventos');

    // Assert
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  // CI-PM11 — 404 não encontrado
  test('CI-PM11 — 404: programa inexistente retorna erro', async () => {
    // Arrange
    serviceMock.listEvents.mockRejectedValue(new NotFoundError('programa'));

    // Act
    const res = await request(app).get('/api/programas/99/eventos');

    // Assert
    expect(res.status).toBe(404);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// GET /api/jovens/:jovemId/inscricoes/:id/inscricao
// ══════════════════════════════════════════════════════════════════════════════
describe('GET /api/jovens/:jovemId/inscricoes/:id/inscricao', () => {
  // CI-PM12 — sucesso 200                                                RF004, RN08
  test('CI-PM12 — 200: retorna inscrições do jovem', async () => {
    // Arrange
    serviceMock.listarInscricoes.mockResolvedValue([makeInscricao()]);

    // Act
    const res = await request(app).get('/api/jovens/5/inscricoes/5/inscricao');

    // Assert
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// POST /api/jovens/:jovemId/inscricoes/:id/inscricao
// ══════════════════════════════════════════════════════════════════════════════
describe('POST /api/jovens/:jovemId/inscricoes/:id/inscricao', () => {
  // CI-PM13 — sucesso 201                                                RF004, RN08
  test('CI-PM13 — 201: inscreve jovem e retorna inscrição com header Location', async () => {
    // Arrange
    const inscricao = makeInscricao();
    serviceMock.inserirInscricao.mockResolvedValue(inscricao);

    // Act
    const res = await request(app)
      .post('/api/jovens/5/inscricoes/5/inscricao')
      .send({ id_programa: 1 });

    // Assert
    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('id', 10);
    expect(res.headers['location']).toMatch(/\/api\/jovens\/5\/inscricao\/10/);
  });

  // CI-PM14 — 400 validação                                             RF004, RN08
  test('CI-PM14 — 400: id_programa ausente retorna erro de validação', async () => {
    // Arrange
    serviceMock.inserirInscricao.mockRejectedValue(new BadRequestError('id_programa é obrigatório'));

    // Act
    const res = await request(app)
      .post('/api/jovens/5/inscricoes/5/inscricao')
      .send({});

    // Assert
    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('error');
  });

  // CI-PM15 — 409 conflito                                              RF004, RN08
  test('CI-PM15 — 409: jovem já inscrito retorna conflito', async () => {
    // Arrange
    serviceMock.inserirInscricao.mockRejectedValue(
      new ConflictError('jovem já inscrito neste programa')
    );

    // Act
    const res = await request(app)
      .post('/api/jovens/5/inscricoes/5/inscricao')
      .send({ id_programa: 1 });

    // Assert
    expect(res.status).toBe(409);
    expect(res.body).toHaveProperty('error');
  });

  // CI-PM16 — 404 programa inexistente                                  RF004, RN08
  test('CI-PM16 — 404: programa inexistente retorna erro', async () => {
    // Arrange
    serviceMock.inserirInscricao.mockRejectedValue(new NotFoundError('programa'));

    // Act
    const res = await request(app)
      .post('/api/jovens/5/inscricoes/5/inscricao')
      .send({ id_programa: 99 });

    // Assert
    expect(res.status).toBe(404);
    expect(res.body).toHaveProperty('error');
  });
});
