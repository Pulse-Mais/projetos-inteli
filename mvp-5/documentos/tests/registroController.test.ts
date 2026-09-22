import request from 'supertest';
import { createApp } from '../../src/app';
import * as registroService from '../../src/services/registroService';
import { NotFoundError, ForbiddenError } from '../../src/errors/AppError';
import type { RegistroAcompanhamento } from '../../src/models/registroAcompanhamento';

// Mock do service
jest.mock('../../src/services/registroService');
const serviceMock = jest.mocked(registroService);

// App Supertest
const app = createApp();

// Fixture
function makeRegistro(overrides: Partial<RegistroAcompanhamento> = {}): RegistroAcompanhamento {
  return {
    id: 5,
    id_jovem: 10,
    id_autor: 2,
    tipo_registro: 'Atendimento_Equipe',
    visibilidade: 'Publico_Equipe',
    conteudo: 'Registro de acompanhamento.',
    data_registro: new Date('2025-01-05'),
    ...overrides,
  };
}

beforeEach(() => {
  jest.clearAllMocks();
});

// GET /api/jovens/:id/prontuario
describe('GET /api/jovens/:id/prontuario', () => {
  test('200 — retorna lista de registros quando id_usuario é válido', async () => {
    // Arrange
    serviceMock.listar.mockResolvedValue([makeRegistro()]);

    // Act
    const res = await request(app).get('/api/jovens/10/prontuario?id_usuario=2');

    // Assert
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body).toHaveLength(1);
    expect(serviceMock.listar).toHaveBeenCalledWith(10, 2);
  });

  test('422 — ValidationError quando id_usuario não é informado', async () => {
    // Arrange — nenhum setup adicional; mocks limpos pelo beforeEach

    // Act
    const res = await request(app).get('/api/jovens/10/prontuario');

    // Assert
    expect(res.status).toBe(422);
    expect(res.body).toHaveProperty('error');
    expect(serviceMock.listar).not.toHaveBeenCalled();
  });

  test('422 — ValidationError quando id_usuario é zero', async () => {
    // Arrange — nenhum setup adicional; mocks limpos pelo beforeEach

    // Act
    const res = await request(app).get('/api/jovens/10/prontuario?id_usuario=0');

    // Assert
    expect(res.status).toBe(422);
    expect(serviceMock.listar).not.toHaveBeenCalled();
  });

  test('403 — ForbiddenError quando usuario não tem perfil autorizado', async () => {
    // Arrange
    serviceMock.listar.mockRejectedValue(new ForbiddenError('perfil não autorizado'));

    // Act
    const res = await request(app).get('/api/jovens/10/prontuario?id_usuario=99');

    // Assert
    expect(res.status).toBe(403);
    expect(res.body).toHaveProperty('error');
  });
});

// POST /api/jovens/:id/prontuario
describe('POST /api/jovens/:id/prontuario', () => {
  test('201 — cria registro quando id_autor está no body', async () => {
    // Arrange
    const novoRegistro = makeRegistro();
    serviceMock.criar.mockResolvedValue(novoRegistro);
    const payload = {
      id_autor: 2,
      tipo_registro: 'Atendimento_Equipe',
      conteudo: 'Sessão realizada.',
    };

    // Act
    const res = await request(app).post('/api/jovens/10/prontuario').send(payload);

    // Assert
    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({ id: 5, id_jovem: 10 });
    expect(res.headers['location']).toContain('/api/jovens/10/prontuario/5');
  });

  test('201 — cria registro quando id_usuario está no query param', async () => {
    // Arrange
    const novoRegistro = makeRegistro();
    serviceMock.criar.mockResolvedValue(novoRegistro);
    const payload = { tipo_registro: 'Mentoria', conteudo: 'Sessão realizada.' };

    // Act
    const res = await request(app)
      .post('/api/jovens/10/prontuario?id_usuario=2')
      .send(payload);

    // Assert
    expect(res.status).toBe(201);
  });

  test('422 — ValidationError quando nem id_autor nem id_usuario são informados', async () => {
    // Arrange — nenhum setup adicional; mocks limpos pelo beforeEach
    const payload = { tipo_registro: 'Mentoria', conteudo: 'Sessão.' };

    // Act
    const res = await request(app).post('/api/jovens/10/prontuario').send(payload);

    // Assert
    expect(res.status).toBe(422);
    expect(res.body).toHaveProperty('error');
    expect(serviceMock.criar).not.toHaveBeenCalled();
  });

  test('403 — ForbiddenError quando usuario não tem perfil de escrita', async () => {
    // Arrange
    serviceMock.criar.mockRejectedValue(new ForbiddenError('perfil não autorizado'));
    const payload = { id_autor: 99, tipo_registro: 'Mentoria', conteudo: 'Sessão.' };

    // Act
    const res = await request(app).post('/api/jovens/10/prontuario').send(payload);

    // Assert
    expect(res.status).toBe(403);
    expect(res.body).toHaveProperty('error');
  });
});

// PUT /api/jovens/:id/prontuario/:registroId
describe('PUT /api/jovens/:id/prontuario/:registroId', () => {
  test('200 — atualiza registro quando id_usuario está no body', async () => {
    // Arrange
    const atualizado = makeRegistro({ conteudo: 'Conteúdo revisado.' });
    serviceMock.atualizar.mockResolvedValue(atualizado);
    const payload = { id_usuario: 2, conteudo: 'Conteúdo revisado.' };

    // Act
    const res = await request(app).put('/api/jovens/10/prontuario/5').send(payload);

    // Assert
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ conteudo: 'Conteúdo revisado.' });
    expect(serviceMock.atualizar).toHaveBeenCalledWith(5, 2, expect.objectContaining({ conteudo: 'Conteúdo revisado.' }));
  });

  test('200 — atualiza registro quando id_usuario está no query param', async () => {
    // Arrange
    serviceMock.atualizar.mockResolvedValue(makeRegistro({ conteudo: 'Revisado.' }));

    // Act
    const res = await request(app)
      .put('/api/jovens/10/prontuario/5?id_usuario=2')
      .send({ conteudo: 'Revisado.' });

    // Assert
    expect(res.status).toBe(200);
  });

  test('422 — ValidationError quando id_usuario não é informado', async () => {
    // Arrange — nenhum setup adicional; mocks limpos pelo beforeEach

    // Act
    const res = await request(app)
      .put('/api/jovens/10/prontuario/5')
      .send({ conteudo: 'Revisado.' });

    // Assert
    expect(res.status).toBe(422);
    expect(res.body).toHaveProperty('error');
    expect(serviceMock.atualizar).not.toHaveBeenCalled();
  });

  test('404 — NotFoundError quando registro não existe', async () => {
    // Arrange
    serviceMock.atualizar.mockRejectedValue(new NotFoundError('registro de acompanhamento'));
    const payload = { id_usuario: 2, conteudo: 'x' };

    // Act
    const res = await request(app).put('/api/jovens/10/prontuario/999').send(payload);

    // Assert
    expect(res.status).toBe(404);
    expect(res.body).toHaveProperty('error');
  });
});