import express from 'express';
import request from 'supertest';
import * as eventoService from '../../src/services/eventoService';
import eventoRoutes from '../../src/routes/eventoRoutes';
import { errorHandler } from '../../src/middlewares/errorHandler';
import { ValidationError } from '../../src/errors/AppError';

jest.mock('../../src/services/eventoService');

const serviceMock = jest.mocked(eventoService);
const app = express();
app.use(express.json());
app.use('/api/eventos', eventoRoutes);
app.use(errorHandler);

beforeEach(() => {
  jest.clearAllMocks();
  jest.spyOn(console, 'error').mockImplementation(() => undefined);
});

afterEach(() => {
  jest.restoreAllMocks();
});

describe('endpoints de evento', () => {
  test('GET /api/eventos aplica busca e retorna metricas', async () => {
    serviceMock.listar.mockResolvedValue([
      {
        id: 1,
        nome: 'Feira de Carreiras',
        data: new Date('2026-06-25T19:00:00Z'),
        descricao: null,
        total_inscritos: 100,
        taxa_presenca: 78,
      },
    ]);

    const resposta = await request(app).get('/api/eventos?busca=Carreiras');

    expect(resposta.status).toBe(200);
    expect(resposta.body[0]).toMatchObject({
      total_inscritos: 100,
      taxa_presenca: 78,
    });
  });

  test('POST /api/eventos retorna 201', async () => {
    serviceMock.criar.mockResolvedValue({
      id: 1,
      nome: 'Feira de Carreiras',
      data: new Date('2026-06-25T19:00:00Z'),
      descricao: null,
    });

    const resposta = await request(app).post('/api/eventos').send({
      nome: 'Feira de Carreiras',
      data: '2026-06-25T19:00:00Z',
    });

    expect(resposta.status).toBe(201);
    expect(resposta.headers.location).toBe('/api/eventos/1');
  });

  test('POST /api/eventos retorna 422 para payload invalido', async () => {
    serviceMock.criar.mockRejectedValue(
      new ValidationError('nome e obrigatorio')
    );
    const resposta = await request(app).post('/api/eventos').send({});
    expect(resposta.status).toBe(422);
  });
});
