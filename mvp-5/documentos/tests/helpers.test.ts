/**
 * tests/helpers.test.ts
 * Testes diretos dos helpers parseCsv e gerarCsv.
 *
 * Estratégia: funções puras sem I/O — nenhum mock necessário.
 * CSVs construídos como strings inline; nenhum arquivo lido do disco.
 */

import { parseCsv } from '../../src/helpers/parseCsv';
import { gerarCsv } from '../../src/helpers/gerarCsv';

// ══════════════════════════════════════════════════════════════════════════════
// parseCsv
// ══════════════════════════════════════════════════════════════════════════════
describe('parseCsv', () => {
  // CT01 – CSV válido retorna array de objetos tipados
  test('CT01 — CSV válido retorna array com os objetos corretos', () => {
    // Arrange
    const csv = 'nome,cpf,email\nAna Lima,123.456.789-00,ana@example.com\nBob Silva,987.654.321-00,bob@example.com\n';

    // Act
    const resultado = parseCsv<{ nome: string; cpf: string; email: string }>(csv);

    // Assert
    expect(resultado).toHaveLength(2);
    expect(resultado[0]).toMatchObject({ nome: 'Ana Lima', cpf: '123.456.789-00', email: 'ana@example.com' });
    expect(resultado[1]).toMatchObject({ nome: 'Bob Silva' });
  });

  // CT02 – CSV com só header (sem linhas de dados) retorna []
  test('CT02 — CSV com somente header retorna array vazio', () => {
    // Arrange
    const csv = 'nome,cpf,email\n';

    // Act
    const resultado = parseCsv(csv);

    // Assert
    expect(resultado).toEqual([]);
  });

  // CT03 – trim aplicado: espaços ao redor dos valores são removidos
  test('CT03 — valores com espaços externos são trimeados', () => {
    // Arrange
    const csv = 'nome,cpf\n  Ana Lima  ,  123.456.789-00  \n';

    // Act
    const resultado = parseCsv<{ nome: string; cpf: string }>(csv);

    // Assert
    expect(resultado[0].nome).toBe('Ana Lima');
    expect(resultado[0].cpf).toBe('123.456.789-00');
  });

  // CT04 – linhas em branco entre registros são ignoradas (skip_empty_lines)
  test('CT04 — linhas em branco são ignoradas pelo parser', () => {
    // Arrange
    const csv = 'nome,cpf\nAna,111\n\nBob,222\n';

    // Act
    const resultado = parseCsv(csv);

    // Assert
    expect(resultado).toHaveLength(2);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// gerarCsv
// ══════════════════════════════════════════════════════════════════════════════
describe('gerarCsv', () => {
  // CT05 – array com dados gera CSV com header e linhas corretas
  test('CT05 — dados presentes geram CSV com header e conteúdo', () => {
    // Arrange
    const dados = [
      { nome: 'Ana Lima', cpf: '123.456.789-00' },
      { nome: 'Bob Silva', cpf: '987.654.321-00' },
    ] as unknown as Record<string, unknown>[];

    // Act
    const csv = gerarCsv(dados);

    // Assert
    expect(csv).toContain('nome');
    expect(csv).toContain('cpf');
    expect(csv).toContain('Ana Lima');
    expect(csv).toContain('123.456.789-00');
    expect(csv).toContain('Bob Silva');
  });

  // CT06 – array vazio retorna string vazia
  test('CT06 — array vazio retorna string vazia sem header', () => {
    // Arrange
    const dados: Record<string, unknown>[] = [];

    // Act
    const csv = gerarCsv(dados);

    // Assert
    expect(csv).toBe('');
  });

  // CT07 – resultado é string válida com newlines (formato CSV padrão)
  test('CT07 — resultado é uma string com separadores de linha', () => {
    // Arrange
    const dados = [{ id: 1, nome: 'Ana' }] as unknown as Record<string, unknown>[];

    // Act
    const csv = gerarCsv(dados);

    // Assert
    expect(typeof csv).toBe('string');
    expect(csv.length).toBeGreaterThan(0);
    // csv-stringify termina com newline
    expect(csv).toMatch(/\n$/);
  });
});
