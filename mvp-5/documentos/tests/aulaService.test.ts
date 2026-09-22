import { NotFoundError, ValidationError } from '../../src/errors/AppError';
import * as aulaRepo from '../../src/repositories/aulaRepository';
import * as programaRepo from '../../src/repositories/programaRepository';
import * as aulaService from '../../src/services/aulaService';

jest.mock('../../src/repositories/aulaRepository');
jest.mock('../../src/repositories/programaRepository');

const aulaRepoMock = jest.mocked(aulaRepo);
const programaRepoMock = jest.mocked(programaRepo);

const programa = {
  id: 1,
  nome: 'Trilha Web',
  descricao: null,
  data_inicio: new Date('2026-01-01'),
  data_fim: null,
};

const aula = {
  id: 10,
  id_programa: 1,
  nome: 'TypeScript',
  data: new Date('2026-06-20T19:00:00Z'),
};

beforeEach(() => {
  jest.clearAllMocks();
});

describe('aulaService', () => {
  describe('listar', () => {
    test('CT-AULA-S01 — lista aulas sem filtros (RN09 · RF005)', async () => {
      aulaRepoMock.listar.mockResolvedValue([aula]);

      const resultado = await aulaService.listar({});

      expect(aulaRepoMock.listar).toHaveBeenCalledWith({});
      expect(resultado).toEqual([aula]);
    });

    test('CT-AULA-S02 — lista aulas filtradas por programa e data validos (RN09 · RF005)', async () => {
      const filtros = { id_programa: 1, data: '2026-06-20' };
      aulaRepoMock.listar.mockResolvedValue([aula]);

      await expect(aulaService.listar(filtros)).resolves.toEqual([aula]);
      expect(aulaRepoMock.listar).toHaveBeenCalledWith(filtros);
    });

    test.each([0, -1, 1.5])(
      'rejeita filtro com id de programa invalido: %s',
      async (idPrograma) => {
        await expect(
          aulaService.listar({ id_programa: idPrograma })
        ).rejects.toBeInstanceOf(ValidationError);
        expect(aulaRepoMock.listar).not.toHaveBeenCalled();
      }
    );

    test('CT-AULA-S03 — rejeita filtro com data invalida (RN09 · RF005)', async () => {
      await expect(
        aulaService.listar({ data: 'data-invalida' })
      ).rejects.toBeInstanceOf(ValidationError);
      expect(aulaRepoMock.listar).not.toHaveBeenCalled();
    });
  });

  describe('buscarPorId', () => {
    test('CT-AULA-S04 — retorna a aula encontrada (RN09 · RF005)', async () => {
      aulaRepoMock.buscarPorId.mockResolvedValue(aula);

      await expect(aulaService.buscarPorId(10)).resolves.toEqual(aula);
      expect(aulaRepoMock.buscarPorId).toHaveBeenCalledWith(10);
    });

    test('CT-AULA-S05 — rejeita id invalido (RN09 · RF005)', async () => {
      await expect(aulaService.buscarPorId(0)).rejects.toBeInstanceOf(
        ValidationError
      );
      expect(aulaRepoMock.buscarPorId).not.toHaveBeenCalled();
    });

    test('CT-AULA-S06 — retorna 404 logico ao buscar aula inexistente (RN09 · RF005)', async () => {
      aulaRepoMock.buscarPorId.mockResolvedValue(null);

      await expect(aulaService.buscarPorId(999)).rejects.toBeInstanceOf(
        NotFoundError
      );
    });
  });

  describe('criar', () => {
    test('CT-AULA-S07 — cria aula valida vinculada a um programa existente (RN09 · RF005)', async () => {
      programaRepoMock.buscarPorId.mockResolvedValue(programa);
      aulaRepoMock.criar.mockResolvedValue(aula);

      const resultado = await aulaService.criar({
        id_programa: 1,
        nome: 'TypeScript',
        data: '2026-06-20T19:00:00Z',
      });

      expect(programaRepoMock.buscarPorId).toHaveBeenCalledWith(1);
      expect(aulaRepoMock.criar).toHaveBeenCalled();
      expect(resultado.id).toBe(10);
    });

    test('CT-AULA-S08 — rejeita aula sem nome (RN09 · RF005)', async () => {
      await expect(
        aulaService.criar({
          id_programa: 1,
          nome: '   ',
          data: '2026-06-20T19:00:00Z',
        })
      ).rejects.toBeInstanceOf(ValidationError);
      expect(aulaRepoMock.criar).not.toHaveBeenCalled();
    });

    test.each(['', 'data-invalida'])(
      'rejeita aula com data invalida: %s',
      async (data) => {
        await expect(
          aulaService.criar({
            id_programa: 1,
            nome: 'TypeScript',
            data,
          })
        ).rejects.toBeInstanceOf(ValidationError);
        expect(programaRepoMock.buscarPorId).not.toHaveBeenCalled();
        expect(aulaRepoMock.criar).not.toHaveBeenCalled();
      }
    );

    test('CT-AULA-S09 — rejeita aula com id de programa invalido (RN09 · RF005)', async () => {
      await expect(
        aulaService.criar({
          id_programa: 0,
          nome: 'TypeScript',
          data: '2026-06-20T19:00:00Z',
        })
      ).rejects.toBeInstanceOf(ValidationError);
      expect(programaRepoMock.buscarPorId).not.toHaveBeenCalled();
    });

    test('CT-AULA-S10 — rejeita aula associada a programa inexistente (RN09 · RF005)', async () => {
      programaRepoMock.buscarPorId.mockResolvedValue(null);

      await expect(
        aulaService.criar({
          id_programa: 999,
          nome: 'TypeScript',
          data: '2026-06-20T19:00:00Z',
        })
      ).rejects.toBeInstanceOf(NotFoundError);
    });
  });

  describe('atualizar', () => {
    beforeEach(() => {
      aulaRepoMock.buscarPorId.mockResolvedValue(aula);
    });

    test('CT-AULA-S11 — atualiza uma aula existente (RN09 · RF005)', async () => {
      const aulaAtualizada = { ...aula, nome: 'Node.js' };
      aulaRepoMock.atualizar.mockResolvedValue(aulaAtualizada);

      const resultado = await aulaService.atualizar(10, {
        nome: 'Node.js',
        data: '2026-06-21T19:00:00Z',
      });

      expect(aulaRepoMock.buscarPorId).toHaveBeenCalledWith(10);
      expect(aulaRepoMock.atualizar).toHaveBeenCalledWith(10, {
        nome: 'Node.js',
        data: '2026-06-21T19:00:00Z',
      });
      expect(resultado).toEqual(aulaAtualizada);
    });

    test('CT-AULA-S12 — atualiza o programa da aula quando ele existe (RN09 · RF005)', async () => {
      const aulaAtualizada = { ...aula, id_programa: 2 };
      programaRepoMock.buscarPorId.mockResolvedValue({
        ...programa,
        id: 2,
      });
      aulaRepoMock.atualizar.mockResolvedValue(aulaAtualizada);

      await expect(
        aulaService.atualizar(10, { id_programa: 2 })
      ).resolves.toEqual(aulaAtualizada);
      expect(programaRepoMock.buscarPorId).toHaveBeenCalledWith(2);
    });

    test('CT-AULA-S13 — rejeita atualizacao de aula inexistente (RN09 · RF005)', async () => {
      aulaRepoMock.buscarPorId.mockResolvedValue(null);

      await expect(
        aulaService.atualizar(999, { nome: 'Node.js' })
      ).rejects.toBeInstanceOf(NotFoundError);
      expect(aulaRepoMock.atualizar).not.toHaveBeenCalled();
    });

    test('CT-AULA-S14 — rejeita atualizacao com nome vazio (RN09 · RF005)', async () => {
      await expect(
        aulaService.atualizar(10, { nome: '   ' })
      ).rejects.toBeInstanceOf(ValidationError);
      expect(aulaRepoMock.atualizar).not.toHaveBeenCalled();
    });

    test('CT-AULA-S15 — rejeita atualizacao com data invalida (RN09 · RF005)', async () => {
      await expect(
        aulaService.atualizar(10, { data: 'data-invalida' })
      ).rejects.toBeInstanceOf(ValidationError);
      expect(aulaRepoMock.atualizar).not.toHaveBeenCalled();
    });

    test('CT-AULA-S16 — rejeita atualizacao com programa inexistente (RN09 · RF005)', async () => {
      programaRepoMock.buscarPorId.mockResolvedValue(null);

      await expect(
        aulaService.atualizar(10, { id_programa: 999 })
      ).rejects.toBeInstanceOf(NotFoundError);
      expect(aulaRepoMock.atualizar).not.toHaveBeenCalled();
    });

    test('CT-AULA-S17 — retorna 404 logico se a aula desaparecer durante a atualizacao (RN09 · RF005)', async () => {
      aulaRepoMock.atualizar.mockResolvedValue(null);

      await expect(
        aulaService.atualizar(10, { nome: 'Node.js' })
      ).rejects.toBeInstanceOf(NotFoundError);
    });
  });

  describe('remover', () => {
    test('CT-AULA-S18 — remove uma aula existente (RN09 · RF005)', async () => {
      aulaRepoMock.remover.mockResolvedValue(true);

      await expect(aulaService.remover(10)).resolves.toBeUndefined();
      expect(aulaRepoMock.remover).toHaveBeenCalledWith(10);
    });

    test('CT-AULA-S19 — rejeita id invalido (RN09 · RF005)', async () => {
      await expect(aulaService.remover(1.5)).rejects.toBeInstanceOf(
        ValidationError
      );
      expect(aulaRepoMock.remover).not.toHaveBeenCalled();
    });

    test('CT-AULA-S20 — retorna 404 logico ao remover aula inexistente (RN09 · RF005)', async () => {
      aulaRepoMock.remover.mockResolvedValue(false);

      await expect(aulaService.remover(999)).rejects.toBeInstanceOf(
        NotFoundError
      );
    });
  });
});