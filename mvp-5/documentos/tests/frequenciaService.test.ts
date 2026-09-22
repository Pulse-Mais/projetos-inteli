import * as frequenciaService from '../../src/services/frequenciaService';
import * as frequenciaAulaRepo from '../../src/repositories/frequenciaAulaRepository';
import * as participacaoEventoRepo from '../../src/repositories/participacaoEventoRepository';
import { NotFoundError, ValidationError } from '../../src/errors/AppError';

jest.mock('../../src/repositories/frequenciaAulaRepository');
jest.mock('../../src/repositories/participacaoEventoRepository');

describe('frequenciaService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('registrar - frequência em aula', () => {
    it('CT-FREQ-S01 - registra frequência válida em aula com presente "true" (RN09 · RF005)', async () => {
      // Arrange
      const payload = {
        tipo: 'aula' as const,
        id_jovem: 1,
        id_aula: 10,
        aula: 'Aula de Backend',
        data: new Date('2026-06-01'),
        presente: true,
      };

      const registroCriado = {
        id: 1,
        id_jovem: 1,
        id_aula: 10,
        aula: 'Aula de Backend',
        data: new Date('2026-06-01'),
        presente: true,
      };

      (frequenciaAulaRepo.inserir as jest.Mock).mockResolvedValue(registroCriado);

      // Act
      const resultado = await frequenciaService.registrar(payload);

      // Assert
      expect(frequenciaAulaRepo.inserir).toHaveBeenCalledWith({
        id_jovem: 1,
        id_aula: 10,
        aula: 'Aula de Backend',
        data: payload.data,
        presente: true,
      });
      expect(resultado).toMatchObject(registroCriado);
    });

    it('CT-FREQ-S02 - registra frequência válida em aula com presente false (RN09 · RF005)', async () => {
      // Arrange
      const payload = {
        tipo: 'aula' as const,
        id_jovem: 1,
        id_aula: 10,
        aula: 'Aula de Backend',
        data: new Date('2026-06-01'),
        presente: false,
      };

      const registroCriado = {
        id: 2,
        id_jovem: 1,
        id_aula: 10,
        aula: 'Aula de Backend',
        data: new Date('2026-06-01'),
        presente: false,
      };

      (frequenciaAulaRepo.inserir as jest.Mock).mockResolvedValue(registroCriado);

      // Act
      const resultado = await frequenciaService.registrar(payload);

      // Assert
      expect(frequenciaAulaRepo.inserir).toHaveBeenCalledWith({
        id_jovem: 1,
        id_aula: 10,
        aula: 'Aula de Backend',
        data: payload.data,
        presente: false,
      });
      expect(resultado).toMatchObject(registroCriado);
    });

    it('CT-FREQ-S03 - rejeita aula sem id_jovem (RN09 · RF005)', async () => {
      // Arrange
      const payload = {
        tipo: 'aula',
        id_aula: 10,
        aula: 'Aula de Backend',
        data: new Date('2026-06-01'),
        presente: true,
      };

      // Act + Assert
      await expect(frequenciaService.registrar(payload as any)).rejects.toThrow(ValidationError);
      expect(frequenciaAulaRepo.inserir).not.toHaveBeenCalled();
    });

    it('CT-FREQ-S04 - rejeita aula sem id_aula (RN09 · RF005)', async () => {
      // Arrange
      const payload = {
        tipo: 'aula',
        id_jovem: 1,
        aula: 'Aula de Backend',
        data: new Date('2026-06-01'),
        presente: true,
      };

      // Act + Assert
      await expect(frequenciaService.registrar(payload as any)).rejects.toThrow(ValidationError);
      expect(frequenciaAulaRepo.inserir).not.toHaveBeenCalled();
    });

    it('CT-FREQ-S05 - rejeita aula sem nome da aula (RN09 · RF005)', async () => {
      // Arrange
      const payload = {
        tipo: 'aula',
        id_jovem: 1,
        id_aula: 10,
        data: new Date('2026-06-01'),
        presente: true,
      };

      // Act + Assert
      await expect(frequenciaService.registrar(payload as any)).rejects.toThrow(ValidationError);
      expect(frequenciaAulaRepo.inserir).not.toHaveBeenCalled();
    });

    it('CT-FREQ-S06 - rejeita aula sem data (RN09 · RF005)', async () => {
      // Arrange
      const payload = {
        tipo: 'aula',
        id_jovem: 1,
        id_aula: 10,
        aula: 'Aula de Backend',
        presente: true,
      };

      // Act + Assert
      await expect(frequenciaService.registrar(payload as any)).rejects.toThrow(ValidationError);
      expect(frequenciaAulaRepo.inserir).not.toHaveBeenCalled();
    });
  });

  describe('registrar - participação em evento', () => {
    it('CT-EVT-S01 - registra participação válida em evento com presente true (RN08 · RF004)', async () => {
      // Arrange
      const payload = {
        tipo: 'evento' as const,
        id_jovem: 1,
        id_evento: 20,
        evento: 'Feira de Carreiras',
        data: new Date('2026-06-02'),
        presente: true,
      };

      const registroCriado = {
        id: 1,
        id_jovem: 1,
        id_evento: 20,
        evento: 'Feira de Carreiras',
        data: new Date('2026-06-02'),
        presente: true,
      };

      (participacaoEventoRepo.inserir as jest.Mock).mockResolvedValue(registroCriado);

      // Act
      const resultado = await frequenciaService.registrar(payload);

      // Assert
      expect(participacaoEventoRepo.inserir).toHaveBeenCalledWith({
        id_jovem: 1,
        id_evento: 20,
        evento: 'Feira de Carreiras',
        data: payload.data,
        presente: true,
      });
      expect(resultado).toMatchObject(registroCriado);
    });

    it('CT-EVT-S02 - registra participação válida em evento com presente false (RN08 · RF004)', async () => {
      // Arrange
      const payload = {
        tipo: 'evento' as const,
        id_jovem: 1,
        id_evento: 20,
        evento: 'Feira de Carreiras',
        data: new Date('2026-06-02'),
        presente: false,
      };

      const registroCriado = {
        id: 2,
        id_jovem: 1,
        id_evento: 20,
        evento: 'Feira de Carreiras',
        data: new Date('2026-06-02'),
        presente: false,
      };

      (participacaoEventoRepo.inserir as jest.Mock).mockResolvedValue(registroCriado);

      // Act
      const resultado = await frequenciaService.registrar(payload);

      // Assert
      expect(participacaoEventoRepo.inserir).toHaveBeenCalledWith({
        id_jovem: 1,
        id_evento: 20,
        evento: 'Feira de Carreiras',
        data: payload.data,
        presente: false,
      });
      expect(resultado).toMatchObject(registroCriado);
    });

    it('CT-EVT-S03 - rejeita evento sem id_evento (RN08 · RF004)', async () => {
      // Arrange
      const payload = {
        tipo: 'evento',
        id_jovem: 1,
        evento: 'Feira de Carreiras',
        data: new Date('2026-06-02'),
        presente: true,
      };

      // Act + Assert
      await expect(frequenciaService.registrar(payload as any)).rejects.toThrow(ValidationError);
      expect(participacaoEventoRepo.inserir).not.toHaveBeenCalled();
    });

    it('CT-EVT-S04 - rejeita evento sem nome do evento (RN08 · RF004)', async () => {
      // Arrange
      const payload = {
        tipo: 'evento',
        id_jovem: 1,
        id_evento: 20,
        data: new Date('2026-06-02'),
        presente: true,
      };

      // Act + Assert
      await expect(frequenciaService.registrar(payload as any)).rejects.toThrow(ValidationError);
      expect(participacaoEventoRepo.inserir).not.toHaveBeenCalled();
    });

    it('CT-EVT-S05 - rejeita evento sem data (RN08 · RF004)', async () => {
      // Arrange
      const payload = {
        tipo: 'evento',
        id_jovem: 1,
        id_evento: 20,
        evento: 'Feira de Carreiras',
        presente: true,
      };

      // Act + Assert
      await expect(frequenciaService.registrar(payload as any)).rejects.toThrow(ValidationError);
      expect(participacaoEventoRepo.inserir).not.toHaveBeenCalled();
    });
  });

  describe('registrar - validações gerais', () => {
    it('CT-GER-S01 - rejeita tipo diferente de aula ou evento (RN08 · RN09 · RF004 · RF005)', async () => {
      // Arrange
      const payload = {
        tipo: 'mentoria',
        id_jovem: 1,
        presente: true,
      };

      // Act + Assert
      await expect(frequenciaService.registrar(payload as any)).rejects.toThrow(ValidationError);
      expect(frequenciaAulaRepo.inserir).not.toHaveBeenCalled();
      expect(participacaoEventoRepo.inserir).not.toHaveBeenCalled();
    });

    it('CT-GER-S02 - rejeita payload sem presente booleano (RN08 · RN09 · RF004 · RF005)', async () => {
      // Arrange
      const payload = {
        tipo: 'aula',
        id_jovem: 1,
        id_aula: 10,
        aula: 'Aula de Backend',
        data: new Date('2026-06-01'),
      };

      // Act + Assert
      await expect(frequenciaService.registrar(payload as any)).rejects.toThrow(ValidationError);
      expect(frequenciaAulaRepo.inserir).not.toHaveBeenCalled();
    });
  });

  describe('consultas e remoções', () => {
    it('CT-FREQ-S07 - retorna frequências de aula por jovem (RN09 · RF005)', async () => {
      // Arrange
      const registros = [
        {
          id: 1,
          id_jovem: 1,
          id_aula: 10,
          aula: 'Aula de Backend',
          data: new Date('2026-06-01'),
          presente: true,
        },
      ];

      (frequenciaAulaRepo.buscarPorJovem as jest.Mock).mockResolvedValue(registros);

      // Act
      const resultado = await frequenciaService.buscarFrequenciasAulaPorJovem(1);

      // Assert
      expect(frequenciaAulaRepo.buscarPorJovem).toHaveBeenCalledWith(1);
      expect(resultado).toEqual(registros);
    });

    it('CT-EVT-S06 - retorna participações em evento por jovem (RN08 · RF004)', async () => {
      // Arrange
      const registros = [
        {
          id: 1,
          id_jovem: 1,
          id_evento: 20,
          evento: 'Feira de Carreiras',
          data: new Date('2026-06-02'),
          presente: true,
        },
      ];

      (participacaoEventoRepo.buscarPorJovem as jest.Mock).mockResolvedValue(registros);

      // Act
      const resultado = await frequenciaService.buscarParticipacaoEventosPorJovem(1);

      // Assert
      expect(participacaoEventoRepo.buscarPorJovem).toHaveBeenCalledWith(1);
      expect(resultado).toEqual(registros);
    });

    it('CT-FREQ-S08 - calcula taxa de presença em aulas (RN09 · RF005)', async () => {
      // Arrange
      (frequenciaAulaRepo.calcularTaxaPresenca as jest.Mock).mockResolvedValue(75);

      // Act
      const resultado = await frequenciaService.calcularTaxaPresencaAula(1);

      // Assert
      expect(frequenciaAulaRepo.calcularTaxaPresenca).toHaveBeenCalledWith(1);
      expect(resultado).toBe(75);
    });

    it('CT-EVT-S07 - calcula taxa de participação em eventos (RN08 · RF004)', async () => {
      // Arrange
      (participacaoEventoRepo.calcularTaxaParticipacao as jest.Mock).mockResolvedValue(50);

      // Act
      const resultado = await frequenciaService.calcularTaxaParticipacaoEvento(1);

      // Assert
      expect(participacaoEventoRepo.calcularTaxaParticipacao).toHaveBeenCalledWith(1);
      expect(resultado).toBe(50);
    });

    it('CT-FREQ-S09 - remove frequência de aula existente (RN09 · RF005)', async () => {
      // Arrange
      (frequenciaAulaRepo.remover as jest.Mock).mockResolvedValue(true);

      // Act
      await frequenciaService.removerFrequenciaAula(1);

      // Assert
      expect(frequenciaAulaRepo.remover).toHaveBeenCalledWith(1);
    });

    it('CT-FREQ-S10 - lança NotFoundError ao remover frequência de aula inexistente (RN09 · RF005)', async () => {
      // Arrange
      (frequenciaAulaRepo.remover as jest.Mock).mockResolvedValue(false);

      // Act + Assert
      await expect(frequenciaService.removerFrequenciaAula(999)).rejects.toThrow(NotFoundError);
    });

    it('CT-EVT-S08 - remove participação em evento existente (RN08 · RF004)', async () => {
      // Arrange
      (participacaoEventoRepo.remover as jest.Mock).mockResolvedValue(true);

      // Act
      await frequenciaService.removerParticipacaoEvento(1);

      // Assert
      expect(participacaoEventoRepo.remover).toHaveBeenCalledWith(1);
    });

    it('CT-EVT-S09 - lança NotFoundError ao remover participação em evento inexistente (RN08 · RF004)', async () => {
      // Arrange
      (participacaoEventoRepo.remover as jest.Mock).mockResolvedValue(false);

      // Act + Assert
      await expect(frequenciaService.removerParticipacaoEvento(999)).rejects.toThrow(NotFoundError);
    });
  });
});