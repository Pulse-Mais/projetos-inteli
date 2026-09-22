/**
 * tests/jovemController.test.ts
 * Testes de contrato HTTP do controller de Jovem via Supertest.
 *
 * Estratégia de isolamento: jovemService é completamente mockado.
 * Verifica apenas o contrato HTTP (status, headers e shape do body).
 * Nenhuma query chega ao banco.
 */

import request from 'supertest';
import { createApp } from '../../src/app';
import * as jovemService from '../../src/services/jovemService';
import { NotFoundError, ConflictError, ValidationError } from '../../src/errors/AppError';
import type { Jovem, JovemPerfilCompleto } from '../../src/models/jovem';

// ── Mock do service ───────────────────────────────────────────────────────────
jest.mock('../../src/services/jovemService');
const serviceMock = jest.mocked(jovemService);

// ── App Supertest (sem porta TCP) ─────────────────────────────────────────────
const app = createApp();

// ── Fixtures ──────────────────────────────────────────────────────────────────
function makeJovem(overrides: Partial<Jovem> = {}): Jovem {
  return {
    id: 1,
    nome: 'Ana Lima',
    email: 'ana@example.com',
    telefone: '11999990000',
    cpf: '123.456.789-00',
    data_nascimento: null,
    endereco: null,
    genero: null,
    renda_inicial: null,
    categoria_atual: 'Conectado',
    status_global: 'Ativo',
    criado_em: new Date('2024-01-01'),
    atualizado_em: null,
    ...overrides,
  };
}

function makePerfilCompleto(jovem: Jovem): JovemPerfilCompleto {
  return {
    jovem,
    categorias: [],
    empregabilidades: [],
    ensinoSuperior: [],
    registros: [],
    programaAtual: null,
    taxaFrequencia: 100,
    taxaMentorias: 0,
    pontos_fortes: [],
    pontos_atencao: [],
    jornada: [],
  };
}

beforeEach(() => {
  jest.clearAllMocks();
});

// ══════════════════════════════════════════════════════════════════════════════
// GET /api/jovens  (CI01–CI04)
// ══════════════════════════════════════════════════════════════════════════════
describe('GET /api/jovens', () => {
  test('CI01 — 200: retorna lista de jovens (RN21 · RF012)', async () => {
    // Arrange
    const lista = [makeJovem(), makeJovem({ id: 2, nome: 'Carlos' })];
    serviceMock.listar.mockResolvedValue(lista);

    // Act
    const res = await request(app).get('/api/jovens');

    // Assert
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body).toHaveLength(2);
  });

  test('CI02 — 422: query param categoria com valor inválido (RN21 · RF012)', async () => {
    // Arrange — nenhum setup adicional; mocks limpos pelo beforeEach

    // Act
    const res = await request(app).get('/api/jovens?categoria=Invalido');

    // Assert
    expect(res.status).toBe(422);
    expect(res.body).toHaveProperty('error');
    expect(serviceMock.listar).not.toHaveBeenCalled();
  });

  test('CI03 — 422: query param status_global com valor inválido (RN21 · RF012)', async () => {
    // Arrange — nenhum setup adicional; mocks limpos pelo beforeEach

    // Act
    const res = await request(app).get('/api/jovens?status_global=Desconhecido');

    // Assert
    expect(res.status).toBe(422);
    expect(res.body).toHaveProperty('error');
    expect(serviceMock.listar).not.toHaveBeenCalled();
  });

  test('CI04 — 200: filtros válidos são repassados ao service (RN21 · RF012)', async () => {
    // Arrange
    serviceMock.listar.mockResolvedValue([]);

    // Act
    const res = await request(app).get('/api/jovens?categoria=Conectado&status_global=Ativo');

    // Assert
    expect(res.status).toBe(200);
    expect(serviceMock.listar).toHaveBeenCalledWith(
      expect.objectContaining({ categoria: 'Conectado', status_global: 'Ativo' })
    );
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// GET /api/jovens/:id  (CI05–CI07)
// ══════════════════════════════════════════════════════════════════════════════
describe('GET /api/jovens/:id', () => {
  test('CI05 — 200: retorna jovem encontrado (RN16 · RF009)', async () => {
    // Arrange
    serviceMock.buscarPorId.mockResolvedValue(makeJovem());

    // Act
    const res = await request(app).get('/api/jovens/1');

    // Assert
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ id: 1, nome: 'Ana Lima' });
  });

  test('CI06 — 422: id não-numérico (RN16 · RF009)', async () => {
    // Arrange — nenhum setup adicional; mocks limpos pelo beforeEach

    // Act
    const res = await request(app).get('/api/jovens/abc');

    // Assert
    expect(res.status).toBe(422);
    expect(serviceMock.buscarPorId).not.toHaveBeenCalled();
  });

  test('CI07 — 404: jovem não encontrado (RN16 · RF009)', async () => {
    // Arrange
    serviceMock.buscarPorId.mockRejectedValue(new NotFoundError('jovem'));

    // Act
    const res = await request(app).get('/api/jovens/999');

    // Assert
    expect(res.status).toBe(404);
    expect(res.body).toHaveProperty('error');
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// GET /api/jovens/:id/perfil-completo  (CI08–CI10)
// ══════════════════════════════════════════════════════════════════════════════
describe('GET /api/jovens/:id/perfil-completo', () => {
  test('CI08 — 200: retorna perfil completo (RN16 · RF009)', async () => {
    // Arrange
    serviceMock.obterPerfilCompleto.mockResolvedValue(makePerfilCompleto(makeJovem()));

    // Act
    const res = await request(app).get('/api/jovens/1/perfil-completo');

    // Assert
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('jovem');
    expect(res.body).toHaveProperty('categorias');
    expect(res.body).toHaveProperty('taxaFrequencia');
  });

  test('CI09 — 404: jovem não encontrado (RN16 · RF009)', async () => {
    // Arrange
    serviceMock.obterPerfilCompleto.mockRejectedValue(new NotFoundError('jovem'));

    // Act
    const res = await request(app).get('/api/jovens/999/perfil-completo');

    // Assert
    expect(res.status).toBe(404);
  });

  test('CI10 — 422: id inválido (RN16 · RF009)', async () => {
    // Arrange — nenhum setup adicional; mocks limpos pelo beforeEach

    // Act
    const res = await request(app).get('/api/jovens/abc/perfil-completo');

    // Assert
    expect(res.status).toBe(422);
    expect(serviceMock.obterPerfilCompleto).not.toHaveBeenCalled();
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// POST /api/jovens  (CI11–CI13)
// ══════════════════════════════════════════════════════════════════════════════
describe('POST /api/jovens', () => {
  test('CI11 — 201: cria jovem e retorna Location header (RN03 · RF001)', async () => {
    // Arrange
    serviceMock.criar.mockResolvedValue(makeJovem());

    // Act
    const res = await request(app)
      .post('/api/jovens')
      .send({ nome: 'Ana Lima', email: 'ana@example.com', telefone: '11999990000', id_usuario: 1 });

    // Assert
    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({ id: 1, nome: 'Ana Lima' });
    expect(res.headers['location']).toContain('/api/jovens/1');
  });

  test('CI12 — 422: ValidationError do service (RN03 · RF001)', async () => {
    // Arrange
    serviceMock.criar.mockRejectedValue(new ValidationError('nome é obrigatório'));

    // Act
    const res = await request(app).post('/api/jovens').send({ nome: '', email: 'x@x.com' });

    // Assert
    expect(res.status).toBe(422);
    expect(res.body).toHaveProperty('error');
  });

  test('CI13 — 409: ConflictError quando CPF já cadastrado (RN01 · RF001)', async () => {
    // Arrange
    serviceMock.criar.mockRejectedValue(new ConflictError('cpf já cadastrado'));

    // Act
    const res = await request(app)
      .post('/api/jovens')
      .send({ nome: 'Ana', email: 'ana@example.com', cpf: '123.456.789-00', id_usuario: 1 });

    // Assert
    expect(res.status).toBe(409);
    expect(res.body).toHaveProperty('error');
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// PUT /api/jovens/:id  (CI14–CI16)
// ══════════════════════════════════════════════════════════════════════════════
describe('PATCH /api/jovens/:id', () => {
  test('CI14 — 200: atualiza e retorna jovem (RN16 · RF002)', async () => {
    // Arrange
    serviceMock.atualizar.mockResolvedValue(makeJovem({ nome: 'Ana Editado' }));

    // Act
    const res = await request(app).patch('/api/jovens/1').send({ nome: 'Ana Editado', id_usuario: 1 });

    // Assert
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ nome: 'Ana Editado' });
  });

  test('CI15 — 422: id inválido (RN16 · RF002)', async () => {
    // Arrange — nenhum setup adicional; mocks limpos pelo beforeEach

    // Act
    const res = await request(app).patch('/api/jovens/abc').send({ nome: 'X' });

    // Assert
    expect(res.status).toBe(422);
    expect(serviceMock.atualizar).not.toHaveBeenCalled();
  });

  test('CI16 — 404: jovem não encontrado (RN16 · RF002)', async () => {
    // Arrange
    serviceMock.atualizar.mockRejectedValue(new NotFoundError('jovem'));

    // Act
    const res = await request(app).patch('/api/jovens/999').send({ nome: 'X', id_usuario: 1 });

    // Assert
    expect(res.status).toBe(404);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// DELETE /api/jovens/:id  (CI17–CI19)
// ══════════════════════════════════════════════════════════════════════════════
describe('DELETE /api/jovens/:id', () => {
  test('CI17 — 204: soft delete e body vazio (RN16 · RF002)', async () => {
    // Arrange
    serviceMock.remover.mockResolvedValue(undefined);

    // Act
    const res = await request(app).delete('/api/jovens/1').query({ id_usuario: 1 });

    // Assert
    expect(res.status).toBe(204);
    expect(res.body).toEqual({});
  });

  test('CI18 — 422: id inválido (RN16 · RF002)', async () => {
    // Arrange — nenhum setup adicional; mocks limpos pelo beforeEach

    // Act
    const res = await request(app).delete('/api/jovens/abc');

    // Assert
    expect(res.status).toBe(422);
    expect(serviceMock.remover).not.toHaveBeenCalled();
  });

  test('CI19 — 404: jovem não encontrado (RN16 · RF002)', async () => {
    // Arrange
    serviceMock.remover.mockRejectedValue(new NotFoundError('jovem'));

    // Act
    const res = await request(app).delete('/api/jovens/999').query({ id_usuario: 1 });

    // Assert
    expect(res.status).toBe(404);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// GET /api/jovens/:id/categoria  (CI20–CI22)
// ══════════════════════════════════════════════════════════════════════════════
describe('GET /api/jovens/:id/categoria', () => {
  test('CI20 — 200: retorna histórico de categorias (RN07 · RF003)', async () => {
    // Arrange
    const historico = [
      { id: 1, id_jovem: 1, id_usuario: null, categoria_adquirida: 'Conectado', categoria_anterior: null, data_inclusao: '2024-01-01' },
      { id: 2, id_jovem: 1, id_usuario: 0, categoria_adquirida: 'Capacitado', categoria_anterior: 'Conectado', data_inclusao: '2024-06-01' },
    ];
    serviceMock.listarCategorias.mockResolvedValue(historico as any);

    // Act
    const res = await request(app).get('/api/jovens/1/categoria');

    // Assert
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body).toHaveLength(2);
    expect(serviceMock.listarCategorias).toHaveBeenCalledWith(1);
  });

  test('CI21 — 422: id inválido (RN07 · RF003)', async () => {
    // Arrange — nenhum setup adicional; mocks limpos pelo beforeEach

    // Act
    const res = await request(app).get('/api/jovens/abc/categoria');

    // Assert
    expect(res.status).toBe(422);
    expect(serviceMock.listarCategorias).not.toHaveBeenCalled();
  });

  test('CI22 — 404: jovem não encontrado (RN07 · RF003)', async () => {
    // Arrange
    serviceMock.listarCategorias.mockRejectedValue(new NotFoundError('jovem'));

    // Act
    const res = await request(app).get('/api/jovens/999/categoria');

    // Assert
    expect(res.status).toBe(404);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// POST /api/jovens/:id/categoria  (CI23–CI27)
// ══════════════════════════════════════════════════════════════════════════════
describe('POST /api/jovens/:id/categoria', () => {
  test('CI23 — 201: muda categoria com sucesso (RN07 · RF003)', async () => {
    // Arrange
    const registro = { id: 2, id_jovem: 1, id_usuario: 0, categoria_adquirida: 'Capacitado', categoria_anterior: 'Conectado', data_inclusao: '2024-06-01' };
    serviceMock.mudarCategoria.mockResolvedValue(registro as any);

    // Act
    const res = await request(app)
      .post('/api/jovens/1/categoria')
      .send({ categoria_adquirida: 'Capacitado', id_usuario: 1 });

    // Assert
    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({ categoria_adquirida: 'Capacitado' });
    expect(serviceMock.mudarCategoria).toHaveBeenCalledWith(1, 'Capacitado', 1);
  });

  test('CI24 — 422: categoria_adquirida com valor fora do enum (RN07 · RF003)', async () => {
    // Arrange — nenhum setup adicional; mocks limpos pelo beforeEach

    // Act
    const res = await request(app)
      .post('/api/jovens/1/categoria')
      .send({ categoria_adquirida: 'Invalida' });

    // Assert
    expect(res.status).toBe(422);
    expect(serviceMock.mudarCategoria).not.toHaveBeenCalled();
  });

  test('CI25 — 422: categoria_adquirida ausente no body (RN07 · RF003)', async () => {
    // Arrange — nenhum setup adicional; mocks limpos pelo beforeEach

    // Act
    const res = await request(app).post('/api/jovens/1/categoria').send({});

    // Assert
    expect(res.status).toBe(422);
    expect(serviceMock.mudarCategoria).not.toHaveBeenCalled();
  });

  test('CI26 — 422: id inválido (RN07 · RF003)', async () => {
    // Arrange — nenhum setup adicional; mocks limpos pelo beforeEach

    // Act
    const res = await request(app)
      .post('/api/jovens/abc/categoria')
      .send({ categoria_adquirida: 'Capacitado' });

    // Assert
    expect(res.status).toBe(422);
    expect(serviceMock.mudarCategoria).not.toHaveBeenCalled();
  });

  test('CI27 — 404: jovem não encontrado (RN07 · RF003)', async () => {
    // Arrange
    serviceMock.mudarCategoria.mockRejectedValue(new NotFoundError('jovem'));

    // Act
    const res = await request(app)
      .post('/api/jovens/999/categoria')
      .send({ categoria_adquirida: 'Capacitado', id_usuario: 1 });

    // Assert
    expect(res.status).toBe(404);
  });
});
