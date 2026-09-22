import request from 'supertest';
import { createApp } from '../../src/app';
import * as frequenciaService from '../../src/services/frequenciaService';
import { NotFoundError, ValidationError } from '../../src/errors/AppError';

jest.mock('../../src/services/frequenciaService');

const app = createApp();

describe('Endpoints de frequência e eventos', () => {
  let consoleErrorSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.clearAllMocks();
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => undefined);
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  describe('POST /api/frequencia', () => {
    it('CT-FREQ-I01 - retorna 201 ao registrar frequência válida em aula', async () => {
      // Arrange
      (frequenciaService.registrar as jest.Mock).mockResolvedValue({
        id: 1,
        id_jovem: 1,
        id_aula: 10,
        aula: 'Aula de Backend',
        data: '2026-06-01',
        presente: true,
      });

      // Act
      const res = await request(app)
        .post('/api/frequencia')
        .send({
          tipo: 'aula',
          id_jovem: 1,
          id_aula: 10,
          aula: 'Aula de Backend',
          data: '2026-06-01',
          presente: true,
        });

      // Assert
      expect(res.status).toBe(201);
      expect(res.body).toMatchObject({
        id_jovem: 1,
        id_aula: 10,
        aula: 'Aula de Backend',
        presente: true,
      });
    });

    it('CT-FREQ-I02 - retorna 201 ao registrar falta em aula com presente false', async () => {
      // Arrange
      (frequenciaService.registrar as jest.Mock).mockResolvedValue({
        id: 2,
        id_jovem: 1,
        id_aula: 10,
        aula: 'Aula de Backend',
        data: '2026-06-01',
        presente: false,
      });

      // Act
      const res = await request(app)
        .post('/api/frequencia')
        .send({
          tipo: 'aula',
          id_jovem: 1,
          id_aula: 10,
          aula: 'Aula de Backend',
          data: '2026-06-01',
          presente: false,
        });

      // Assert
      expect(res.status).toBe(201);
      expect(res.body.presente).toBe(false);
    });

    it('CT-FREQ-I03 - retorna 422 quando payload de aula está incompleto', async () => {
      // Arrange
      (frequenciaService.registrar as jest.Mock).mockRejectedValue(
        new ValidationError('aula é obrigatória para tipo aula')
      );

      // Act
      const res = await request(app)
        .post('/api/frequencia')
        .send({
          tipo: 'aula',
          id_jovem: 1,
          id_aula: 10,
          data: '2026-06-01',
          presente: true,
        });

      // Assert
      expect(res.status).toBe(422);
      expect(res.body).toHaveProperty('error');
    });

    it('CT-FREQ-I04 - retorna 404 quando jovem ou aula não existe', async () => {
      // Arrange
      (frequenciaService.registrar as jest.Mock).mockRejectedValue(
        new NotFoundError('jovem ou aula')
      );

      // Act
      const res = await request(app)
        .post('/api/frequencia')
        .send({
          tipo: 'aula',
          id_jovem: 999,
          id_aula: 999,
          aula: 'Aula inexistente',
          data: '2026-06-01',
          presente: true,
        });

      // Assert
      expect(res.status).toBe(404);
      expect(res.body.error).toContain('não encontrado');
    });

    it('CT-EVT-I01 - retorna 201 ao registrar participação válida em evento', async () => {
      // Arrange
      (frequenciaService.registrar as jest.Mock).mockResolvedValue({
        id: 1,
        id_jovem: 1,
        id_evento: 20,
        evento: 'Feira de Carreiras',
        data: '2026-06-02',
        presente: true,
      });

      // Act
      const res = await request(app)
        .post('/api/frequencia')
        .send({
          tipo: 'evento',
          id_jovem: 1,
          id_evento: 20,
          evento: 'Feira de Carreiras',
          data: '2026-06-02',
          presente: true,
        });

      // Assert
      expect(res.status).toBe(201);
      expect(res.body).toMatchObject({
        id_jovem: 1,
        id_evento: 20,
        evento: 'Feira de Carreiras',
        presente: true,
      });
    });

    it('CT-EVT-I02 - retorna 201 ao registrar ausência em evento com presente false', async () => {
      // Arrange
      (frequenciaService.registrar as jest.Mock).mockResolvedValue({
        id: 2,
        id_jovem: 1,
        id_evento: 20,
        evento: 'Feira de Carreiras',
        data: '2026-06-02',
        presente: false,
      });

      // Act
      const res = await request(app)
        .post('/api/frequencia')
        .send({
          tipo: 'evento',
          id_jovem: 1,
          id_evento: 20,
          evento: 'Feira de Carreiras',
          data: '2026-06-02',
          presente: false,
        });

      // Assert
      expect(res.status).toBe(201);
      expect(res.body.presente).toBe(false);
    });

    it('CT-EVT-I03 - retorna 422 quando payload de evento está incompleto', async () => {
      // Arrange
      (frequenciaService.registrar as jest.Mock).mockRejectedValue(
        new ValidationError('evento é obrigatório para tipo evento')
      );

      // Act
      const res = await request(app)
        .post('/api/frequencia')
        .send({
          tipo: 'evento',
          id_jovem: 1,
          id_evento: 20,
          data: '2026-06-02',
          presente: true,
        });

      // Assert
      expect(res.status).toBe(422);
      expect(res.body).toHaveProperty('error');
    });

    it('CT-EVT-I04 - retorna 404 quando jovem ou evento não existe', async () => {
      // Arrange
      (frequenciaService.registrar as jest.Mock).mockRejectedValue(
        new NotFoundError('jovem ou evento')
      );

      // Act
      const res = await request(app)
        .post('/api/frequencia')
        .send({
          tipo: 'evento',
          id_jovem: 999,
          id_evento: 999,
          evento: 'Evento inexistente',
          data: '2026-06-02',
          presente: true,
        });

      // Assert
      expect(res.status).toBe(404);
      expect(res.body.error).toContain('não encontrado');
    });
  });

  describe('GET /api/frequencia/jovens/:id/frequencias-aula', () => {
    it('CT-FREQ-I05 - retorna 200 com frequências de aula do jovem', async () => {
      // Arrange
      (frequenciaService.buscarFrequenciasAulaPorJovem as jest.Mock).mockResolvedValue([
        {
          id: 1,
          id_jovem: 1,
          id_aula: 10,
          aula: 'Aula de Backend',
          data: '2026-06-01',
          presente: true,
        },
      ]);

      // Act
      const res = await request(app).get('/api/frequencia/jovens/1/frequencias-aula');

      // Assert
      expect(res.status).toBe(200);
      expect(res.body).toHaveLength(1);
      expect(res.body[0]).toMatchObject({
        id_jovem: 1,
        id_aula: 10,
      });
    });
  });

  describe('GET /api/frequencia/jovens/:id/participacoes-evento', () => {
    it('CT-EVT-I05 - retorna 200 com participações em eventos do jovem', async () => {
      // Arrange
      (frequenciaService.buscarParticipacaoEventosPorJovem as jest.Mock).mockResolvedValue([
        {
          id: 1,
          id_jovem: 1,
          id_evento: 20,
          evento: 'Feira de Carreiras',
          data: '2026-06-02',
          presente: true,
        },
      ]);

      // Act
      const res = await request(app).get('/api/frequencia/jovens/1/participacoes-evento');

      // Assert
      expect(res.status).toBe(200);
      expect(res.body).toHaveLength(1);
      expect(res.body[0]).toMatchObject({
        id_jovem: 1,
        id_evento: 20,
      });
    });
  });

  describe('GET /api/frequencia/jovens/:id/taxa-presenca-aula', () => {
    it('CT-FREQ-I06 - retorna 200 com taxa de presença em aulas', async () => {
      // Arrange
      (frequenciaService.calcularTaxaPresencaAula as jest.Mock).mockResolvedValue(75);

      // Act
      const res = await request(app).get('/api/frequencia/jovens/1/taxa-presenca-aula');

      // Assert
      expect(res.status).toBe(200);
      expect(res.body).toEqual({ taxa: 75 });
    });
  });

  describe('GET /api/frequencia/jovens/:id/taxa-participacao-evento', () => {
    it('CT-EVT-I06 - retorna 200 com taxa de participação em eventos', async () => {
      // Arrange
      (frequenciaService.calcularTaxaParticipacaoEvento as jest.Mock).mockResolvedValue(50);

      // Act
      const res = await request(app).get('/api/frequencia/jovens/1/taxa-participacao-evento');

      // Assert
      expect(res.status).toBe(200);
      expect(res.body).toEqual({ taxa: 50 });
    });
  });

  describe('DELETE /api/frequencia/frequencias-aula/:id', () => {
    it('CT-FREQ-I07 - retorna 204 ao remover frequência de aula existente', async () => {
      // Arrange
      (frequenciaService.removerFrequenciaAula as jest.Mock).mockResolvedValue(undefined);

      // Act
      const res = await request(app).delete('/api/frequencia/frequencias-aula/1');

      // Assert
      expect(res.status).toBe(204);
      expect(res.body).toEqual({});
    });

    it('CT-FREQ-I08 - retorna 404 ao remover frequência de aula inexistente', async () => {
      // Arrange
      (frequenciaService.removerFrequenciaAula as jest.Mock).mockRejectedValue(
        new NotFoundError('frequência de aula')
      );

      // Act
      const res = await request(app).delete('/api/frequencia/frequencias-aula/999');

      // Assert
      expect(res.status).toBe(404);
      expect(res.body.error).toContain('não encontrado');
    });
  });

  describe('DELETE /api/frequencia/participacoes-evento/:id', () => {
    it('CT-EVT-I07 - retorna 204 ao remover participação em evento existente', async () => {
      // Arrange
      (frequenciaService.removerParticipacaoEvento as jest.Mock).mockResolvedValue(undefined);

      // Act
      const res = await request(app).delete('/api/frequencia/participacoes-evento/1');

      // Assert
      expect(res.status).toBe(204);
      expect(res.body).toEqual({});
    });

    it('CT-EVT-I08 - retorna 404 ao remover participação em evento inexistente', async () => {
      // Arrange
      (frequenciaService.removerParticipacaoEvento as jest.Mock).mockRejectedValue(
        new NotFoundError('participação em evento')
      );

      // Act
      const res = await request(app).delete('/api/frequencia/participacoes-evento/999');

      // Assert
      expect(res.status).toBe(404);
      expect(res.body.error).toContain('não encontrado');
    });
  });
});