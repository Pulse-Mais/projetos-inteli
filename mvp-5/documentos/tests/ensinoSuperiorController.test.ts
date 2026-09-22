/**
 * tests/ensinoSuperiorController.test.ts
 * Testes de integração do controller de Ensino Superior via Supertest.
 *
 * Estratégia de isolamento: ensinoSuperiorService é completamente mockado.
 * Apenas o contrato HTTP (status e shape do body) é verificado.
 *
 * Rota base: /api/jovens/:id/ensino-superior  (mergeParams: true)
 */

import request from 'supertest';
import { createApp } from '../../src/app';
import * as ensinoSuperiorService from '../../src/services/ensinoSuperiorService';
import { ValidationError } from '../../src/errors/AppError';
import type { EnsinoSuperior } from '../../src/models/ensinoSuperior';

// ── Mock do service ───────────────────────────────────────────────────────────
jest.mock('../../src/services/ensinoSuperiorService');
const serviceMock = jest.mocked(ensinoSuperiorService);

// ── App Supertest (sem porta TCP) ─────────────────────────────────────────────
const app = createApp();

// ── Fixture ───────────────────────────────────────────────────────────────────
function makeEnsinoSuperior(overrides: Partial<EnsinoSuperior> = {}): EnsinoSuperior {
  return {
    id: 1,
    id_jovem: 10,
    ingressou: 1,
    situacao: 'Cursando',
    instituicao: 'USP',
    data_registro: new Date('2025-01-01'),
    ...overrides,
  };
}

beforeEach(() => {
  jest.clearAllMocks();
});

// ══════════════════════════════════════════════════════════════════════════════
// GET /api/jovens/:id/ensino-superior
// ══════════════════════════════════════════════════════════════════════════════
describe('GET /api/jovens/:id/ensino-superior', () => {
  test('200 — retorna histórico de ensino superior', async () => {
    // Arrange
    const historico = [makeEnsinoSuperior()];
    serviceMock.obterHistorico.mockResolvedValue(historico);

    // Act
    const res = await request(app).get('/api/jovens/10/ensino-superior');

    // Assert
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body).toHaveLength(1);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// POST /api/jovens/:id/ensino-superior
// ══════════════════════════════════════════════════════════════════════════════
describe('POST /api/jovens/:id/ensino-superior', () => {
  test('201 — cria registro de ensino superior e retorna Location header', async () => {
    // Arrange
    const novoRegistro = makeEnsinoSuperior();
    serviceMock.criarRegistro.mockResolvedValue(novoRegistro);
    const payload = { situacao: 'Cursando', instituicao: 'USP' };

    // Act
    const res = await request(app).post('/api/jovens/10/ensino-superior').send(payload);

    // Assert
    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({ ingressou: 1 });
    expect(res.headers['location']).toContain('/api/jovens/10/ensino-superior');
  });

  // CT: ValidationError do service (status inválido) → 422
  test('422 — ValidationError quando situacao é inválida', async () => {
    // Arrange
    serviceMock.criarRegistro.mockRejectedValue(
      new ValidationError('situacao inválida: use Concluido, Cursando, Não possui')
    );

    // Act
    const res = await request(app)
      .post('/api/jovens/10/ensino-superior')
      .send({ situacao: 'Bolsista' });

    // Assert
    expect(res.status).toBe(422);
    expect(res.body).toHaveProperty('error');
  });
});
