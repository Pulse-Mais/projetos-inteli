/**
 * tests/importController.test.ts
 * Testes de integração do controller de Importação via Supertest.
 *
 * Estratégia de isolamento: importService é completamente mockado.
 * O arquivo CSV é enviado como Buffer via .attach() do Supertest —
 * o middleware multer popula req.file normalmente.
 * Apenas o contrato HTTP (status e shape do body) é verificado.
 *
 * Rota: POST /api/import?id_usuario=X
 * Middleware: multer.single('arquivo') — campo obrigatório: 'arquivo'
 * O controller exige id_usuario (query ou body) e repassa (conteudo, idUsuario)
 * ao service. O service devolve { importados, atualizados, erros }.
 */

import request from 'supertest';
import { createApp } from '../../src/app';
import * as importService from '../../src/services/importService';
import { ValidationError } from '../../src/errors/AppError';

// ── Mock do service ───────────────────────────────────────────────────────────
jest.mock('../../src/services/importService');
const serviceMock = jest.mocked(importService);

// ── App Supertest (sem porta TCP) ─────────────────────────────────────────────
const app = createApp();

// ── Fixture: buffer CSV mínimo válido (conteúdo não importa — service é mockado)
const CSV_BUFFER_VALIDO = Buffer.from(
  'nome,email,telefone,cpf,data_nascimento,endereco,renda_inicial\n' +
  'Ana Lima,ana@example.com,11999990000,123.456.789-00,2000-01-01,Rua A 1,1500\n'
);

beforeEach(() => {
  jest.clearAllMocks();
});

// ══════════════════════════════════════════════════════════════════════════════
// POST /api/import
// ══════════════════════════════════════════════════════════════════════════════
describe('POST /api/import', () => {
  // CI01 – sucesso: CSV válido + id_usuario → 200 com { importados, atualizados, erros }
  test('CI01 — 200: CSV válido retorna { importados, atualizados, erros }', async () => {
    // Arrange
    serviceMock.importarJovens.mockResolvedValue({ importados: 1, atualizados: 0, erros: [] });

    // Act
    const res = await request(app)
      .post('/api/import?id_usuario=1')
      .attach('arquivo', CSV_BUFFER_VALIDO, 'jovens.csv');

    // Assert
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ importados: 1, atualizados: 0, erros: [] });
    expect(serviceMock.importarJovens).toHaveBeenCalledTimes(1);
  });

  // CI02 – sem arquivo: 422 do controller (antes de chamar o service)
  test('CI02 — 422: requisição sem arquivo lança ValidationError no controller', async () => {
    // Act — sem .attach()
    const res = await request(app).post('/api/import?id_usuario=1');

    // Assert
    expect(res.status).toBe(422);
    expect(res.body).toHaveProperty('error');
    expect(res.body.error).toContain('CSV');
    // Service não deve ser chamado — o controller rejeita antes
    expect(serviceMock.importarJovens).not.toHaveBeenCalled();
  });

  // CI03 – sem id_usuario: 422 do controller (antes de chamar o service)
  test('CI03 — 422: requisição sem id_usuario lança ValidationError no controller', async () => {
    // Act — com arquivo, mas sem id_usuario
    const res = await request(app)
      .post('/api/import')
      .attach('arquivo', CSV_BUFFER_VALIDO, 'jovens.csv');

    // Assert
    expect(res.status).toBe(422);
    expect(res.body.error).toContain('id_usuario');
    expect(serviceMock.importarJovens).not.toHaveBeenCalled();
  });

  // CI04 – CSV vazio: service lança ValidationError → 422
  test('CI04 — 422: service lança ValidationError (CSV vazio) → 422', async () => {
    // Arrange
    serviceMock.importarJovens.mockRejectedValue(
      new ValidationError('Arquivo CSV vazio ou sem linhas válidas.')
    );

    // Act
    const res = await request(app)
      .post('/api/import?id_usuario=1')
      .attach('arquivo', Buffer.from('nome,cpf\n'), 'vazio.csv');

    // Assert
    expect(res.status).toBe(422);
    expect(res.body).toHaveProperty('error');
  });

  // CI05 – importação parcial: 200 com erros estruturados acumulados
  test('CI05 — 200: importação parcial retorna 200 com lista de erros estruturada', async () => {
    // Arrange
    serviceMock.importarJovens.mockResolvedValue({
      importados: 2,
      atualizados: 0,
      erros: [{ linha: 3, mensagem: '(x@x.com) CPF inválido' }],
    });

    // Act
    const res = await request(app)
      .post('/api/import?id_usuario=1')
      .attach('arquivo', CSV_BUFFER_VALIDO, 'mix.csv');

    // Assert
    expect(res.status).toBe(200);
    expect(res.body.importados).toBe(2);
    expect(Array.isArray(res.body.erros)).toBe(true);
    expect(res.body.erros).toHaveLength(1);
  });

  // CI06 – o buffer é convertido para UTF-8 e repassado ao service com idUsuario
  test('CI06 — o buffer do arquivo é convertido para UTF-8 e repassado com idUsuario', async () => {
    // Arrange
    serviceMock.importarJovens.mockResolvedValue({ importados: 0, atualizados: 0, erros: [] });
    const csvContent = 'nome,cpf\nAna,123\n';
    const buffer = Buffer.from(csvContent, 'utf-8');

    // Act
    await request(app)
      .post('/api/import?id_usuario=7')
      .attach('arquivo', buffer, 'test.csv');

    // Assert
    expect(serviceMock.importarJovens).toHaveBeenCalledWith(csvContent, 7);
  });
});
