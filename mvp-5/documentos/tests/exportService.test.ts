/**
 * tests/exportService.test.ts
 * Testes unitários de exportService.
 *
 * Estratégia de isolamento:
 *   - pool     → jest.mock — simula SELECT sem tocar o banco real
 *   - gerarCsv → jest.mock — verifica que é chamado com os rows corretos
 *
 * Nota: exportService chama pool.query diretamente (sem repository intermediário),
 * incoerência arquitetural registrada no RELATORIO_BUGS_INCOERENCIAS.md.
 */

import * as exportService from '../../src/services/exportService';
import { pool } from '../../src/db/pool';
import { gerarCsv } from '../../src/helpers/gerarCsv';

// ── Mocks de módulo ────────────────────────────────────────────────────────────
jest.mock('../../src/db/pool');
jest.mock('../../src/helpers/gerarCsv');

// ── Referências tipadas aos mocks ─────────────────────────────────────────────
const poolMock = jest.mocked(pool);
const gerarCsvMock = jest.mocked(gerarCsv);

// ── Helper de row de exportação ────────────────────────────────────────────────
function makeRow(overrides: Record<string, unknown> = {}) {
  return {
    id: 1,
    nome: 'Ana Lima',
    email: 'ana@example.com',
    telefone: null,
    cpf: '123.456.789-00',
    data_nascimento: null,
    endereco: null,
    renda_inicial: 1500,
    categoria_atual: 'Conectado',
    status_global: 'Ativo',
    criado_em: new Date('2025-01-01'),
    emprego_situacao: 'Empregado',
    emprego_empresa: 'ACME',
    emprego_vinculo: 'Efetivado',
    emprego_renda_atual: 2500,
    ...overrides,
  };
}

beforeEach(() => {
  jest.clearAllMocks();
  // Por padrão, pool.query retorna um row; gerarCsv retorna CSV fixo
  (poolMock.query as jest.Mock).mockResolvedValue({ rows: [makeRow()] });
  gerarCsvMock.mockReturnValue('id,nome\n1,Ana Lima\n');
});

// ══════════════════════════════════════════════════════════════════════════════
// exportarJovens
// ══════════════════════════════════════════════════════════════════════════════
describe('exportarJovens', () => {
  // CT01 – sem filtros: WHERE vazio, valores=[]                       RN21, RF017
  test('CT01 — sem filtros: pool.query chamado sem filtros aplicados e com valores=[] (RN21 · RF017)', async () => {
    // Arrange — defaults do beforeEach

    // Act
    await exportService.exportarJovens({});

    // Assert — nenhum filtro de coluna aplicado; o WHERE remanescente é o do
    // LATERAL join interno (não é cláusula de filtro). valores deve ser [].
    const [sql, valores] = (poolMock.query as jest.Mock).mock.calls[0];
    expect(sql).not.toContain('j.categoria_atual =');
    expect(sql).not.toContain('j.status_global =');
    expect(valores).toEqual([]);
  });

  // CT02 – categoria_atual informado → WHERE com $1                   RN21, RF017
  test('CT02 — categoria_atual filtra com j.categoria_atual = $1 (RN21 · RF017)', async () => {
    // Arrange
    (poolMock.query as jest.Mock).mockResolvedValue({ rows: [] });
    gerarCsvMock.mockReturnValue('');

    // Act
    await exportService.exportarJovens({ categoria_atual: 'Conectado' });

    // Assert
    const [sql, valores] = (poolMock.query as jest.Mock).mock.calls[0];
    expect(sql).toContain('j.categoria_atual = $1');
    expect(valores).toEqual(['Conectado']);
  });

  // CT03 – status_global informado → WHERE com $1                     RN21, RF017
  test('CT03 — status_global filtra com j.status_global = $1 (RN21 · RF017)', async () => {
    // Arrange
    (poolMock.query as jest.Mock).mockResolvedValue({ rows: [] });
    gerarCsvMock.mockReturnValue('');

    // Act
    await exportService.exportarJovens({ status_global: 'Ativo' });

    // Assert
    const [sql, valores] = (poolMock.query as jest.Mock).mock.calls[0];
    expect(sql).toContain('j.status_global = $1');
    expect(valores).toEqual(['Ativo']);
  });

  // CT04 – ambos filtros: AND com $1 e $2 na ordem correta            RN21, RF017
  test('CT04 — ambos filtros: WHERE com AND; valores=[categoria, status] na ordem correta (RN21 · RF017)', async () => {
    // Arrange
    (poolMock.query as jest.Mock).mockResolvedValue({ rows: [] });
    gerarCsvMock.mockReturnValue('');

    // Act
    await exportService.exportarJovens({ categoria_atual: 'Conectado', status_global: 'Ativo' });

    // Assert
    const [sql, valores] = (poolMock.query as jest.Mock).mock.calls[0];
    expect(sql).toContain('j.categoria_atual = $1');
    expect(sql).toContain('j.status_global = $2');
    expect(sql).toContain('AND');
    expect(valores).toEqual(['Conectado', 'Ativo']);
  });

  // CT05 – sem linhas retornadas: gerarCsv chamado com [] → retorna '' RN21, RF017
  test('CT05 — sem jovens encontrados: gerarCsv é chamado com [] e retorna string vazia (RN21 · RF017)', async () => {
    // Arrange
    (poolMock.query as jest.Mock).mockResolvedValue({ rows: [] });
    gerarCsvMock.mockReturnValue('');

    // Act
    const resultado = await exportService.exportarJovens({});

    // Assert
    expect(gerarCsvMock).toHaveBeenCalledWith([]);
    expect(resultado).toBe('');
  });

  // CT06 – com linhas: retorna o CSV produzido por gerarCsv           RN21, RF017
  test('CT06 — com jovens encontrados: retorna o CSV gerado por gerarCsv (RN21 · RF017)', async () => {
    // Arrange
    const rows = [makeRow()];
    (poolMock.query as jest.Mock).mockResolvedValue({ rows });
    gerarCsvMock.mockReturnValue('id,nome\n1,Ana Lima\n');

    // Act
    const resultado = await exportService.exportarJovens({});

    // Assert
    expect(gerarCsvMock).toHaveBeenCalledWith(rows);
    expect(resultado).toBe('id,nome\n1,Ana Lima\n');
  });

  // CT07 – SQL inclui LEFT JOIN empregabilidade com encerrado = 0     RN21, RF017
  test('CT07 — SQL inclui LEFT JOIN empregabilidade filtrado por encerrado = 0 (RN21 · RF017)', async () => {
    // Arrange — defaults do beforeEach

    // Act
    await exportService.exportarJovens({});

    // Assert
    const [sql] = (poolMock.query as jest.Mock).mock.calls[0];
    expect(sql).toContain('LEFT JOIN empregabilidade');
    expect(sql).toContain('encerrado = 0');
  });

  // CT08 – filtro por id_programa gera EXISTS na inscricao_programa     RN21, RF017
  test('CT08 — id_programa filtra com EXISTS em inscricao_programa (RN21 · RF017)', async () => {
    // Arrange
    (poolMock.query as jest.Mock).mockResolvedValue({ rows: [] });
    gerarCsvMock.mockReturnValue('');

    // Act
    await exportService.exportarJovens({ id_programa: 7 });

    // Assert
    const [sql, valores] = (poolMock.query as jest.Mock).mock.calls[0];
    expect(sql).toContain('EXISTS');
    expect(sql).toContain('ip2.id_programa = $1');
    expect(valores).toEqual([7]);
  });

  // CT09 – filtro por ano_matricula usa EXTRACT(YEAR ...) na inscrição  RN21, RF017
  test('CT09 — ano_matricula filtra por EXTRACT(YEAR FROM data_matricula) (RN21 · RF017)', async () => {
    // Arrange
    (poolMock.query as jest.Mock).mockResolvedValue({ rows: [] });
    gerarCsvMock.mockReturnValue('');

    // Act
    await exportService.exportarJovens({ ano_matricula: 2025 });

    // Assert
    const [sql, valores] = (poolMock.query as jest.Mock).mock.calls[0];
    expect(sql).toContain('EXTRACT(YEAR FROM ip3.data_matricula) = $1');
    expect(valores).toEqual([2025]);
  });

  // CT10 – todos os filtros combinados respeitam a ordem dos parâmetros RN21, RF017
  test('CT10 — todos os filtros combinados na ordem $1..$4 (RN21 · RF017)', async () => {
    // Arrange
    (poolMock.query as jest.Mock).mockResolvedValue({ rows: [] });
    gerarCsvMock.mockReturnValue('');

    // Act
    await exportService.exportarJovens({
      categoria_atual: 'Transformado',
      status_global: 'Ativo',
      id_programa: 7,
      ano_matricula: 2025,
    });

    // Assert
    const [, valores] = (poolMock.query as jest.Mock).mock.calls[0];
    expect(valores).toEqual(['Transformado', 'Ativo', 7, 2025]);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// gerarTemplate
// ══════════════════════════════════════════════════════════════════════════════
describe('gerarTemplate', () => {
  // CT11 – gera CSV-modelo com 1 linha de exemplo via gerarCsv          RN23, RF016
  test('CT11 — gera o CSV-modelo de importação com uma linha de exemplo (RN23 · RF016)', () => {
    // Arrange
    gerarCsvMock.mockReturnValue('nome,email\nHenrique Vieira,henrique@example.com\n');

    // Act
    const csv = exportService.gerarTemplate();

    // Assert — gerarCsv recebe um array com 1 objeto contendo os cabeçalhos esperados
    expect(gerarCsvMock).toHaveBeenCalledTimes(1);
    const [linhas] = gerarCsvMock.mock.calls[0];
    expect(Array.isArray(linhas)).toBe(true);
    expect(linhas).toHaveLength(1);
    expect(linhas[0]).toEqual(
      expect.objectContaining({ nome: expect.any(String), email: expect.any(String), categoria_atual: 'Conectado' })
    );
    expect(csv).toContain('nome,email');
  });
});
