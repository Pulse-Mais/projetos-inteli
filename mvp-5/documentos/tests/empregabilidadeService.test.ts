/**
 * tests/empregabilidadeService.test.ts
 * Testes unitários de empregabilidadeService.
 *
 * Estratégia de isolamento: empregabilidadeRepository e pool são mockados.
 * Nenhum teste toca o banco real.
 */

import * as empregabilidadeService from '../../src/services/empregabilidadeService';
import * as repo from '../../src/repositories/empregabilidadeRepository';
import { pool } from '../../src/db/pool';
import type { Empregabilidade } from '../../src/models/empregabilidade';

// ── Mocks de módulo ────────────────────────────────────────────────────────────
jest.mock('../../src/repositories/empregabilidadeRepository');
jest.mock('../../src/db/pool');

// ── Helper de fixture ─────────────────────────────────────────────────────────
function makeEmpregabilidade(overrides: Partial<Empregabilidade> = {}): Empregabilidade {
  return {
    id: 1,
    id_jovem: 10,
    situacao: 'Empregado',
    vinculo: 'Efetivado',
    empresa: 'ACME Ltda',
    area_atuacao: 'TI',
    renda_atual: 2500,
    data_registro: new Date('2025-01-01'),
    encerrado: 0,
    data_final: null,
    ...overrides,
  };
}

// ── Referências tipadas aos mocks ─────────────────────────────────────────────
const repoMock = jest.mocked(repo);
const poolMock = jest.mocked(pool);

// Mock do client de transação (mesmo padrão de jovemService.test.ts)
const mockClient = {
  query: jest.fn().mockResolvedValue({ rows: [], rowCount: 0 }),
  release: jest.fn(),
};

beforeEach(() => {
  jest.clearAllMocks();
  (poolMock.connect as jest.Mock).mockResolvedValue(mockClient);
  mockClient.query.mockResolvedValue({ rows: [], rowCount: 0 });
  mockClient.release.mockReturnValue(undefined);
});

// ══════════════════════════════════════════════════════════════════════════════
// obterHistorico
// ══════════════════════════════════════════════════════════════════════════════
describe('obterHistorico', () => {
  // CT01 – retorna array do repo                                       RN12, RF006
  test('CT01 — retorna histórico de empregabilidade do jovem (RN12 · RF006)', async () => {
    // Arrange
    const historico = [makeEmpregabilidade(), makeEmpregabilidade({ id: 2, encerrado: 1 })];
    repoMock.buscarPorJovem.mockResolvedValue(historico);

    // Act
    const resultado = await empregabilidadeService.obterHistorico(10);

    // Assert
    expect(resultado).toEqual(historico);
    expect(repoMock.buscarPorJovem).toHaveBeenCalledWith(10);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// criarRegistro
// ══════════════════════════════════════════════════════════════════════════════
describe('criarRegistro', () => {
  // CT02 – sucesso: encerra ativos, insere novo, COMMIT               RN12, RF006
  test('CT02 — sucesso: encerra vínculos ativos e insere novo registro (RN12 · RF006)', async () => {
    // Arrange
    const novoRegistro = makeEmpregabilidade();
    repoMock.encerrarAtivos.mockResolvedValue(undefined);
    repoMock.inserir.mockResolvedValue(novoRegistro);

    const dados = {
      situacao: 'Empregado' as const,
      vinculo: 'Efetivado' as const,
      empresa: 'ACME Ltda',
      area_atuacao: 'TI',
      renda_atual: 2500,
    };

    // Act
    const resultado = await empregabilidadeService.criarRegistro(10, dados);

    // Assert
    expect(resultado).toEqual(novoRegistro);
    expect(repoMock.encerrarAtivos).toHaveBeenCalledWith(mockClient, 10);
    expect(repoMock.inserir).toHaveBeenCalledWith(
      mockClient,
      expect.objectContaining({ id_jovem: 10, situacao: 'Empregado' })
    );
    expect(mockClient.query).toHaveBeenCalledWith('COMMIT');
    expect(mockClient.release).toHaveBeenCalled();
  });

  // CT03 – ROLLBACK ao falhar em inserir                              RN12, RF006
  test('CT03 — ROLLBACK executado quando inserir lança erro (RN12 · RF006)', async () => {
    // Arrange
    repoMock.encerrarAtivos.mockResolvedValue(undefined);
    repoMock.inserir.mockRejectedValue(new Error('DB constraint'));

    // Act
    const promise = empregabilidadeService.criarRegistro(10, { situacao: 'Procurando' });

    // Assert
    await expect(promise).rejects.toThrow('DB constraint');
    expect(mockClient.query).toHaveBeenCalledWith('ROLLBACK');
    expect(mockClient.release).toHaveBeenCalled();
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// estaAtivo
// ══════════════════════════════════════════════════════════════════════════════
describe('estaAtivo', () => {
  // CT04 – true quando encerrado=false                                RN12, RF006
  test('CT04 — retorna true quando vínculo não está encerrado (RN12 · RF006)', () => {
    // Arrange
    const registro = makeEmpregabilidade({ encerrado: 0 });

    // Act
    const ativo = empregabilidadeService.estaAtivo(registro);

    // Assert
    expect(ativo).toBe(true);
  });

  // CT05 – false quando encerrado=true                                RN12, RF006
  test('CT05 — retorna false quando vínculo está encerrado (RN12 · RF006)', () => {
    // Arrange
    const registro = makeEmpregabilidade({ encerrado: 1 });

    // Act
    const ativo = empregabilidadeService.estaAtivo(registro);

    // Assert
    expect(ativo).toBe(false);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// obterDuracao
// ══════════════════════════════════════════════════════════════════════════════
describe('obterDuracao', () => {
  // CT06 – número de dias determinístico (Date mockado)               RN12, RF006
  test('CT06 — retorna duração em dias corretos com data de referência fixa (RN12 · RF006)', () => {
    // Arrange — congela o relógio em 2025-01-11 (10 dias após data_registro)
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2025-01-11T00:00:00.000Z'));
    const registro = makeEmpregabilidade({
      data_registro: new Date('2025-01-01T00:00:00.000Z'),
    });

    // Act
    const duracao = empregabilidadeService.obterDuracao(registro);

    // Assert
    expect(duracao).toBe(10);

    // Cleanup — restaura o relógio real
    jest.useRealTimers();
  });
});
