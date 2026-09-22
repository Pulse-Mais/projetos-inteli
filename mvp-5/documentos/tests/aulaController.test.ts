import express from 'express';
import request from 'supertest';
import * as aulaService from '../../src/services/aulaService';
import aulaRoutes from '../../src/routes/aulaRoutes';
import { errorHandler } from '../../src/middlewares/errorHandler';
import { NotFoundError } from '../../src/errors/AppError';

jest.mock('../../src/services/aulaService');

const serviceMock = jest.mocked(aulaService);
const app = express();
app.use(express.json());
app.use('/api/aulas', aulaRoutes);
app.use(errorHandler);

beforeEach(() => {
  jest.clearAllMocks();
  jest.spyOn(console, 'error').mockImplementation(() => undefined);
});

afterEach(() => {
  jest.restoreAllMocks();
});

describe('endpoints de aula', () => {
  test('GET /api/aulas retorna 200', async () => {
    serviceMock.listar.mockResolvedValue([]);
    const resposta = await request(app).get('/api/aulas?id_programa=1');

    expect(resposta.status).toBe(200);
    expect(serviceMock.listar).toHaveBeenCalledWith(
      expect.objectContaining({ id_programa: 1 })
    );
  });

  test('POST /api/aulas retorna 201', async () => {
    serviceMock.criar.mockResolvedValue({
      id: 10,
      id_programa: 1,
      nome: 'TypeScript',
      data: new Date('2026-06-20T19:00:00Z'),
    });

    const resposta = await request(app).post('/api/aulas').send({
      id_programa: 1,
      nome: 'TypeScript',
      data: '2026-06-20T19:00:00Z',
    });

    expect(resposta.status).toBe(201);
    expect(resposta.headers.location).toBe('/api/aulas/10');
  });

  test('DELETE /api/aulas/:id retorna 404 quando nao existe', async () => {
    serviceMock.remover.mockRejectedValue(new NotFoundError('aula'));
    const resposta = await request(app).delete('/api/aulas/999');
    expect(resposta.status).toBe(404);
  });
});
