import { NotFoundError, ValidationError } from '../../src/errors/AppError';
import * as eventoRepo from '../../src/repositories/eventoRepository';
import * as eventoService from '../../src/services/eventoService';

jest.mock('../../src/repositories/eventoRepository');

const eventoRepoMock = jest.mocked(eventoRepo);

const evento = {
  id: 1,
  nome: 'Feira de Carreiras',
  data: new Date('2026-06-25T19:00:00Z'),
  descricao: null,
};

const eventoResumo = {
  ...evento,
  descricao: 'Evento online',
  total_inscritos: 100,
  taxa_presenca: 78,
};

beforeEach(() => {
  jest.clearAllMocks();
});

describe('eventoService', () => {
  describe('listar', () => {
    test('CT-EVENTO-S01 — lista eventos com busca e metricas agregadas (RN08 · RF004)', async () => {
      eventoRepoMock.listar.mockResolvedValue([eventoResumo]);

      const resultado = await eventoService.listar({ busca: 'Carreiras' });

      expect(eventoRepoMock.listar).toHaveBeenCalledWith({
        busca: 'Carreiras',
      });
      expect(resultado[0].total_inscritos).toBe(100);
    });

    test('CT-EVENTO-S02 — lista eventos filtrados por uma data valida (RN08 · RF004)', async () => {
      const filtros = { data: '2026-06-25' };
      eventoRepoMock.listar.mockResolvedValue([eventoResumo]);

      await expect(eventoService.listar(filtros)).resolves.toEqual([
        eventoResumo,
      ]);
      expect(eventoRepoMock.listar).toHaveBeenCalledWith(filtros);
    });

    test('CT-EVENTO-S03 — rejeita filtro com data invalida (RN08 · RF004)', async () => {
      await expect(
        eventoService.listar({ data: 'data-invalida' })
      ).rejects.toBeInstanceOf(ValidationError);
      expect(eventoRepoMock.listar).not.toHaveBeenCalled();
    });
  });

  describe('buscarPorId', () => {
    test('CT-EVENTO-S04 — retorna o evento encontrado (RN08 · RF004)', async () => {
      eventoRepoMock.buscarPorId.mockResolvedValue(eventoResumo);

      await expect(eventoService.buscarPorId(1)).resolves.toEqual(eventoResumo);
      expect(eventoRepoMock.buscarPorId).toHaveBeenCalledWith(1);
    });

    test.each([0, -1, 1.5])('rejeita id invalido: %s', async (id) => {
      await expect(eventoService.buscarPorId(id)).rejects.toBeInstanceOf(
        ValidationError
      );
      expect(eventoRepoMock.buscarPorId).not.toHaveBeenCalled();
    });

    test('CT-EVENTO-S05 — retorna 404 logico ao buscar evento inexistente (RN08 · RF004)', async () => {
      eventoRepoMock.buscarPorId.mockResolvedValue(null);

      await expect(eventoService.buscarPorId(999)).rejects.toBeInstanceOf(
        NotFoundError
      );
    });
  });

  describe('criar', () => {
    test('CT-EVENTO-S06 — cria evento valido (RN08 · RF004)', async () => {
      eventoRepoMock.criar.mockResolvedValue(evento);

      const resultado = await eventoService.criar({
        nome: 'Feira de Carreiras',
        data: '2026-06-25T19:00:00Z',
      });

      expect(eventoRepoMock.criar).toHaveBeenCalled();
      expect(resultado.id).toBe(1);
    });

    test('CT-EVENTO-S07 — rejeita evento sem nome (RN08 · RF004)', async () => {
      await expect(
        eventoService.criar({
          nome: '   ',
          data: '2026-06-25T19:00:00Z',
        })
      ).rejects.toBeInstanceOf(ValidationError);
      expect(eventoRepoMock.criar).not.toHaveBeenCalled();
    });

    test('CT-EVENTO-S08 — rejeita data invalida (RN08 · RF004)', async () => {
      await expect(
        eventoService.criar({ nome: 'Evento', data: 'data-invalida' })
      ).rejects.toBeInstanceOf(ValidationError);
      expect(eventoRepoMock.criar).not.toHaveBeenCalled();
    });
  });

  describe('atualizar', () => {
    beforeEach(() => {
      eventoRepoMock.buscarPorId.mockResolvedValue(eventoResumo);
    });

    test('CT-EVENTO-S09 — atualiza um evento existente (RN08 · RF004)', async () => {
      const eventoAtualizado = { ...evento, nome: 'Feira de Tecnologia' };
      eventoRepoMock.atualizar.mockResolvedValue(eventoAtualizado);

      const resultado = await eventoService.atualizar(1, {
        nome: 'Feira de Tecnologia',
        data: '2026-06-26T19:00:00Z',
      });

      expect(eventoRepoMock.buscarPorId).toHaveBeenCalledWith(1);
      expect(eventoRepoMock.atualizar).toHaveBeenCalledWith(1, {
        nome: 'Feira de Tecnologia',
        data: '2026-06-26T19:00:00Z',
      });
      expect(resultado).toEqual(eventoAtualizado);
    });

    test('CT-EVENTO-S10 — rejeita atualizacao de evento inexistente (RN08 · RF004)', async () => {
      eventoRepoMock.buscarPorId.mockResolvedValue(null);

      await expect(
        eventoService.atualizar(999, { nome: 'Feira de Tecnologia' })
      ).rejects.toBeInstanceOf(NotFoundError);
      expect(eventoRepoMock.atualizar).not.toHaveBeenCalled();
    });

    test('CT-EVENTO-S11 — rejeita atualizacao com nome vazio (RN08 · RF004)', async () => {
      await expect(
        eventoService.atualizar(1, { nome: '   ' })
      ).rejects.toBeInstanceOf(ValidationError);
      expect(eventoRepoMock.atualizar).not.toHaveBeenCalled();
    });

    test('CT-EVENTO-S12 — rejeita atualizacao com data invalida (RN08 · RF004)', async () => {
      await expect(
        eventoService.atualizar(1, { data: 'data-invalida' })
      ).rejects.toBeInstanceOf(ValidationError);
      expect(eventoRepoMock.atualizar).not.toHaveBeenCalled();
    });

    test('CT-EVENTO-S13 — retorna 404 logico se o evento desaparecer durante a atualizacao (RN08 · RF004)', async () => {
      eventoRepoMock.atualizar.mockResolvedValue(null);

      await expect(
        eventoService.atualizar(1, { descricao: 'Nova descricao' })
      ).rejects.toBeInstanceOf(NotFoundError);
    });
  });

  describe('remover', () => {
    test('CT-EVENTO-S14 — remove um evento existente (RN08 · RF004)', async () => {
      eventoRepoMock.remover.mockResolvedValue(true);

      await expect(eventoService.remover(1)).resolves.toBeUndefined();
      expect(eventoRepoMock.remover).toHaveBeenCalledWith(1);
    });

    test('CT-EVENTO-S15 — rejeita id invalido (RN08 · RF004)', async () => {
      await expect(eventoService.remover(0)).rejects.toBeInstanceOf(
        ValidationError
      );
      expect(eventoRepoMock.remover).not.toHaveBeenCalled();
    });

    test('CT-EVENTO-S16 — retorna 404 logico ao remover evento inexistente (RN08 · RF004)', async () => {
      eventoRepoMock.remover.mockResolvedValue(false);

      await expect(eventoService.remover(999)).rejects.toBeInstanceOf(
        NotFoundError
      );
    });
  });
});