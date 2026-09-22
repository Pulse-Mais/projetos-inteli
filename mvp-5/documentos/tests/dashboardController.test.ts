/**
 * tests/dashboardController.test.ts
 * Testes de integração do controller de Dashboard via Supertest.
 *
 * Estratégia de isolamento: dashboardService é completamente mockado.
 * Apenas o contrato HTTP (status e shape do body) é verificado.
 *
 * Rota: GET /api/dashboard?id_usuario=<id>
 */

import request from 'supertest';
import { createApp } from '../../src/app';
import * as dashboardService from '../../src/services/dashboardService';
import { ForbiddenError } from '../../src/errors/AppError';
import type { DashboardIndicadores } from '../../src/services/dashboardService';

// ── Mock do service ───────────────────────────────────────────────────────────
jest.mock('../../src/services/dashboardService');
const serviceMock = jest.mocked(dashboardService);

// ── App Supertest (sem porta TCP) ─────────────────────────────────────────────
const app = createApp();

// ── Fixture de indicadores ────────────────────────────────────────────────────
function makeIndicadores(overrides: Partial<DashboardIndicadores> = {}): DashboardIndicadores {
  return {
    totalAtivos: 50,
    totalEmpregados: 20,
    totalGraduacao: 5,
    percentualEvasao: 10,
    totalTransformados: 15,
    incrementoRendaMedio: 600,
    totalComputadoresDoados: 8,
    mapaPresenca: [{ id_jovem: 1, taxa_presenca: 90 }],
    calendarioEventos: [{ evento: 'Palestra', data: new Date('2025-03-01'), total_participantes: 30 }],
    ...overrides,
  };
}

beforeEach(() => {
  jest.clearAllMocks();
});

// ══════════════════════════════════════════════════════════════════════════════
// GET /api/dashboard
// ══════════════════════════════════════════════════════════════════════════════
describe('GET /api/dashboard', () => {
  test('200 — retorna todos os indicadores quando id_usuario é válido', async () => {
    // Arrange
    serviceMock.obterIndicadores.mockResolvedValue(makeIndicadores());

    // Act
    const res = await request(app).get('/api/dashboard?id_usuario=1');

    // Assert
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({
      totalAtivos: 50,
      totalEmpregados: 20,
      percentualEvasao: 10,
    });
    expect(Array.isArray(res.body.mapaPresenca)).toBe(true);
    expect(Array.isArray(res.body.calendarioEventos)).toBe(true);
    expect(serviceMock.obterIndicadores).toHaveBeenCalledWith(1);
  });

  test('422 — ValidationError quando id_usuario está ausente', async () => {
    // Arrange — service não deve ser chamado

    // Act
    const res = await request(app).get('/api/dashboard');

    // Assert
    expect(res.status).toBe(422);
    expect(res.body).toHaveProperty('error');
    expect(serviceMock.obterIndicadores).not.toHaveBeenCalled();
  });

  test('422 — ValidationError quando id_usuario é zero', async () => {
    // Arrange — service não deve ser chamado

    // Act
    const res = await request(app).get('/api/dashboard?id_usuario=0');

    // Assert
    expect(res.status).toBe(422);
    expect(serviceMock.obterIndicadores).not.toHaveBeenCalled();
  });

  test('422 — ValidationError quando id_usuario não é numérico', async () => {
    // Arrange — service não deve ser chamado

    // Act
    const res = await request(app).get('/api/dashboard?id_usuario=abc');

    // Assert
    expect(res.status).toBe(422);
    expect(serviceMock.obterIndicadores).not.toHaveBeenCalled();
  });

  test('403 — ForbiddenError quando usuário não tem perfil Gestao', async () => {
    // Arrange
    serviceMock.obterIndicadores.mockRejectedValue(new ForbiddenError('perfil Coordenacao não autorizado'));

    // Act
    const res = await request(app).get('/api/dashboard?id_usuario=99');

    // Assert
    expect(res.status).toBe(403);
    expect(res.body).toHaveProperty('error');
  });
});
