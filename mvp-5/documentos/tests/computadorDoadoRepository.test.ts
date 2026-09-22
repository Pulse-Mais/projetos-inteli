/**
 * tests/computadorDoadoRepository.test.ts
 * Testes unitários de computadorDoadoRepository.
 *
 * Estratégia de isolamento: pool é substituído por mock.
 * computadorDoado não possui service dedicado — o repositório é
 * consumido diretamente pelo dashboardService (totalNaoDevolvidos).
 * Nenhum teste toca o banco real.
 */

import * as computadorDoadoRepo from '../../src/repositories/computadorDoadoRepository';
import { pool } from '../../src/db/pool';
import type { ComputadorDoado } from '../../src/models/computadorDoado';

// ── Mock de módulo ─────────────────────────────────────────────────────────────
jest.mock('../../src/db/pool');

// ── Helper de fixture ─────────────────────────────────────────────────────────
function makeComputador(overrides: Partial<ComputadorDoado> = {}): ComputadorDoado {
  return {
    id: 1,
    id_jovem: 10,
    data_doacao: '2025-01-15',
    data_devolucao: null,
    modelo: 'Dell Latitude 5420',
    ...overrides,
  };
}

// ── Referência tipada ao mock ─────────────────────────────────────────────────
const poolMock = jest.mocked(pool);

beforeEach(() => {
  jest.clearAllMocks();
});

// ══════════════════════════════════════════════════════════════════════════════
// listarPorJovem
// ══════════════════════════════════════════════════════════════════════════════
describe('listarPorJovem', () => {
  // CT01 – retorna array de computadores doados ao jovem              RN15b, RF008
  test('CT01 — retorna array dos computadores doados ao jovem', async () => {
    // Arrange
    const computadores = [makeComputador(), makeComputador({ id: 2, modelo: 'Lenovo ThinkPad' })];
    (poolMock.query as jest.Mock).mockResolvedValue({ rows: computadores });

    // Act
    const resultado = await computadorDoadoRepo.listarPorJovem(10);

    // Assert
    expect(resultado).toEqual(computadores);
    expect(poolMock.query).toHaveBeenCalledWith(
      expect.stringContaining('WHERE id_jovem = $1'),
      [10]
    );
  });

  // CT02 – retorna array vazio quando jovem não tem computadores
  test('CT02 — retorna array vazio quando jovem não tem computadores doados', async () => {
    // Arrange
    (poolMock.query as jest.Mock).mockResolvedValue({ rows: [] });

    // Act
    const resultado = await computadorDoadoRepo.listarPorJovem(999);

    // Assert
    expect(resultado).toEqual([]);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// criar
// ══════════════════════════════════════════════════════════════════════════════
describe('criar', () => {
  // CT03 – INSERT RETURNING * e retorna o objeto persistido           RN15b, RF008
  test('CT03 — executa INSERT RETURNING * e retorna o computador criado', async () => {
    // Arrange
    const computador = makeComputador();
    (poolMock.query as jest.Mock).mockResolvedValue({ rows: [computador] });

    const dto = {
      id_jovem: 10,
      data_doacao: '2025-01-15',
      data_devolucao: null,
      modelo: 'Dell Latitude 5420',
    };

    // Act
    const resultado = await computadorDoadoRepo.criar(dto);

    // Assert
    expect(resultado).toEqual(computador);
    expect(poolMock.query).toHaveBeenCalledWith(
      expect.stringContaining('RETURNING'),
      [dto.id_jovem, dto.data_doacao, null, dto.modelo]
    );
  });

  // CT04 – data_devolucao undefined é passada como null para o banco
  test('CT04 — data_devolucao undefined é normalizada para null na query', async () => {
    // Arrange
    const computador = makeComputador({ data_devolucao: null });
    (poolMock.query as jest.Mock).mockResolvedValue({ rows: [computador] });

    // Act
    await computadorDoadoRepo.criar({
      id_jovem: 10,
      data_doacao: '2025-01-15',
      data_devolucao: undefined,
      modelo: 'Dell',
    });

    // Assert — 3º parâmetro (data_devolucao) deve ser null (via ?? null)
    const params = (poolMock.query as jest.Mock).mock.calls[0][1] as unknown[];
    expect(params[2]).toBeNull();
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// totalNaoDevolvidos
// ══════════════════════════════════════════════════════════════════════════════
describe('totalNaoDevolvidos', () => {
  // CT05 – COUNT retorna o número correto de não devolvidos           RN15b, RF008
  test('CT05 — retorna o total numérico de computadores não devolvidos', async () => {
    // Arrange
    (poolMock.query as jest.Mock).mockResolvedValue({ rows: [{ total: '7' }] });

    // Act
    const total = await computadorDoadoRepo.totalNaoDevolvidos();

    // Assert
    expect(total).toBe(7);
    expect(typeof total).toBe('number');
  });

  // CT06 – SQL filtra por data_devolucao IS NULL
  test('CT06 — query usa COUNT WHERE data_devolucao IS NULL', async () => {
    // Arrange
    (poolMock.query as jest.Mock).mockResolvedValue({ rows: [{ total: '0' }] });

    // Act
    await computadorDoadoRepo.totalNaoDevolvidos();

    // Assert
    const [sql] = (poolMock.query as jest.Mock).mock.calls[0];
    expect(sql).toContain('data_devolucao IS NULL');
  });

  // CT07 – total '0' (string) é convertido para number 0
  test('CT07 — total = "0" (string do pg) é convertido corretamente para 0 (number)', async () => {
    // Arrange
    (poolMock.query as jest.Mock).mockResolvedValue({ rows: [{ total: '0' }] });

    // Act
    const total = await computadorDoadoRepo.totalNaoDevolvidos();

    // Assert
    expect(total).toBe(0);
  });
});
