/**
 * tests/exportController.test.ts
 * Testes de integração do controller de Exportação via Supertest.
 *
 * Estratégia de isolamento: exportService é completamente mockado.
 * Apenas o contrato HTTP (status, headers e body text) é verificado.
 *
 * Rota: GET /api/export
 * Response esperada: Content-Type: text/csv, Content-Disposition: attachment; filename=relatorio.csv
 */

import request from 'supertest';
import { createApp } from '../../src/app';
import * as exportService from '../../src/services/exportService';

// ── Mock do service ───────────────────────────────────────────────────────────
jest.mock('../../src/services/exportService');
const serviceMock = jest.mocked(exportService);

// ── App Supertest (sem porta TCP) ─────────────────────────────────────────────
const app = createApp();

// ── Fixture CSV stub ──────────────────────────────────────────────────────────
const CSV_STUB = 'id,nome,categoria_atual\n1,Ana Lima,Conectado\n';

beforeEach(() => {
  jest.clearAllMocks();
  serviceMock.exportarJovens.mockResolvedValue(CSV_STUB);
});

// ══════════════════════════════════════════════════════════════════════════════
// GET /api/export
// ══════════════════════════════════════════════════════════════════════════════
describe('GET /api/export', () => {
  // CI01 – sucesso: 200, Content-Type text/csv, Content-Disposition correto
  test('CI01 — 200: retorna CSV com Content-Type text/csv e Content-Disposition correto', async () => {
    // Arrange — defaults do beforeEach

    // Act
    const res = await request(app).get('/api/export');

    // Assert
    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toMatch(/text\/csv/);
    expect(res.headers['content-disposition']).toBe('attachment; filename=relatorio.csv');
    expect(res.text).toBe(CSV_STUB);
  });

  // CI02 – sem filtros: service chamado com objeto de filtros vazio/undefined
  test('CI02 — sem query params: service recebe objeto sem filtros', async () => {
    // Arrange — defaults do beforeEach

    // Act
    await request(app).get('/api/export');

    // Assert
    expect(serviceMock.exportarJovens).toHaveBeenCalledWith({
      categoria_atual: undefined,
      status_global: undefined,
    });
  });

  // CI03 – categoria_atual como query param é repassada ao service
  test('CI03 — ?categoria_atual=Conectado: filtro repassado ao service', async () => {
    // Arrange — defaults do beforeEach

    // Act
    await request(app).get('/api/export?categoria_atual=Conectado');

    // Assert
    expect(serviceMock.exportarJovens).toHaveBeenCalledWith(
      expect.objectContaining({ categoria_atual: 'Conectado' })
    );
  });

  // CI04 – ambos filtros repassados ao service
  test('CI04 — ?categoria_atual=Conectado&status_global=Ativo: ambos repassados ao service', async () => {
    // Arrange — defaults do beforeEach

    // Act
    await request(app).get('/api/export?categoria_atual=Conectado&status_global=Ativo');

    // Assert
    expect(serviceMock.exportarJovens).toHaveBeenCalledWith({
      categoria_atual: 'Conectado',
      status_global: 'Ativo',
    });
  });

  // CI05 – CSV vazio (sem jovens): retorna 200 com body vazio
  test('CI05 — service retorna string vazia: 200 com body vazio (sem jovens correspondentes)', async () => {
    // Arrange
    serviceMock.exportarJovens.mockResolvedValue('');

    // Act
    const res = await request(app).get('/api/export?status_global=Formado');

    // Assert
    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toMatch(/text\/csv/);
    expect(res.text).toBe('');
  });

  // CI06 – header Content-Disposition filename exato
  test('CI06 — Content-Disposition tem filename exato "relatorio.csv"', async () => {
    // Arrange — defaults do beforeEach

    // Act
    const res = await request(app).get('/api/export');

    // Assert — sem aspas extras, sem path, exatamente como definido no controller
    expect(res.headers['content-disposition']).toBe('attachment; filename=relatorio.csv');
  });
});
