/**
 * tests/empregabilidadeController.test.ts
 * Testes de integração do controller de Empregabilidade via Supertest.
 *
 * Estratégia de isolamento: empregabilidadeService é completamente mockado.
 * Apenas o contrato HTTP (status e shape do body) é verificado.
 *
 * Rota base: /api/jovens/:id/empregabilidade  (mergeParams: true)
 */

import request from 'supertest';
import { createApp } from '../../src/app';
import * as empregabilidadeService from '../../src/services/empregabilidadeService';
import { ValidationError } from '../../src/errors/AppError';
import type { Empregabilidade } from '../../src/models/empregabilidade';

// ── Mock do service ───────────────────────────────────────────────────────────
jest.mock('../../src/services/empregabilidadeService');
const serviceMock = jest.mocked(empregabilidadeService);

// ── App Supertest (sem porta TCP) ─────────────────────────────────────────────
const app = createApp();

// ── Fixture ───────────────────────────────────────────────────────────────────
function makeEmpregabilidade(overrides: Partial<Empregabilidade> = {}): Empregabilidade {
  return {
    id: 1,
    id_jovem: 10,
    situacao: 'Empregado',
    vinculo: 'Efetivado',
    empresa: 'ACME Ltda',
    area_atuacao: 'TI',
    renda_atual: 2500,
    data_registro: new Date('2025-01-01'),
    encerrado: 0,
    data_final: null,
    ...overrides,
  };
}

beforeEach(() => {
  jest.clearAllMocks();
});

// ══════════════════════════════════════════════════════════════════════════════
// GET /api/jovens/:id/empregabilidade
// ══════════════════════════════════════════════════════════════════════════════
describe('GET /api/jovens/:id/empregabilidade', () => {
  test('200 — retorna histórico de empregabilidade', async () => {
    // Arrange
    const historico = [makeEmpregabilidade(), makeEmpregabilidade({ id: 2, encerrado: 1 })];
    serviceMock.obterHistorico.mockResolvedValue(historico);

    // Act
    const res = await request(app).get('/api/jovens/10/empregabilidade');

    // Assert
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body).toHaveLength(2);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// POST /api/jovens/:id/empregabilidade
// ══════════════════════════════════════════════════════════════════════════════
describe('POST /api/jovens/:id/empregabilidade', () => {
  test('201 — cria registro de empregabilidade e retorna Location header', async () => {
    // Arrange
    const novoRegistro = makeEmpregabilidade();
    serviceMock.criarRegistro.mockResolvedValue(novoRegistro);
    const payload = { situacao: 'Empregado', vinculo: 'Efetivado', empresa: 'ACME', renda_atual: 2500 };

    // Act
    const res = await request(app).post('/api/jovens/10/empregabilidade').send(payload);

    // Assert
    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({ id: 1, situacao: 'Empregado' });
    expect(res.headers['location']).toContain('/api/jovens/10/empregabilidade');
  });

  // Nota: o controller não faz validação própria — qualquer erro vem do service.
  // Um ValidationError do service resultaria em 422, mas o controller apenas
  // delega. Testamos o comportamento de erro genérico para confirmar o 500:
  test('500 — erro inesperado do service resulta em 500', async () => {
    // Arrange
    serviceMock.criarRegistro.mockRejectedValue(new Error('erro inesperado'));

    // Act
    const res = await request(app).post('/api/jovens/10/empregabilidade').send({ situacao: 'Procurando' });

    // Assert
    expect(res.status).toBe(500);
    expect(res.body).toHaveProperty('error');
  });
});
