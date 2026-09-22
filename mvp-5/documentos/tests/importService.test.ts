/**
 * tests/importService.test.ts
 * Testes unitários de importService.
 *
 * Estratégia de isolamento:
 *   - parseCsv (helper)          → jest.mock — retorna linhas configuradas por teste
 *   - jovemService               → jest.mock — criar/atualizar/mudarCategoria
 *   - jovemRepository            → jest.mock — buscarPorCpf/buscarPorEmail/buscarPorId
 *
 * O service NÃO acessa o banco diretamente: orquestra jovemService + jovemRepo.
 * Contrato verificado: ResultadoImport = { importados, atualizados, erros[] }
 * onde cada erro é { linha: number, mensagem: string }.
 */

import * as importService from '../../src/services/importService';
import * as jovemService from '../../src/services/jovemService';
import * as jovemRepo from '../../src/repositories/jovemRepository';
import { parseCsv } from '../../src/helpers/parseCsv';
import { ValidationError, ConflictError } from '../../src/errors/AppError';
import type { Jovem } from '../../src/models/jovem';

// ── Mocks de módulo ────────────────────────────────────────────────────────────
jest.mock('../../src/helpers/parseCsv');
jest.mock('../../src/services/jovemService');
jest.mock('../../src/repositories/jovemRepository');

// ── Referências tipadas aos mocks ─────────────────────────────────────────────
const parseCsvMock = jest.mocked(parseCsv);
const jovemServiceMock = jest.mocked(jovemService);
const jovemRepoMock = jest.mocked(jovemRepo);

// ── Helpers ────────────────────────────────────────────────────────────────────
function makeLinha(overrides: Record<string, string> = {}) {
  return {
    nome: 'Ana Lima',
    email: 'ana@example.com',
    telefone: '11999990000',
    cpf: '123.456.789-00',
    data_nascimento: '2000-01-01',
    endereco: 'Rua A 1',
    renda_inicial: '1500',
    ...overrides,
  };
}

function makeJovem(overrides: Partial<Jovem> = {}): Jovem {
  return {
    id: 1,
    nome: 'Ana Lima',
    email: 'ana@example.com',
    telefone: '11999990000',
    cpf: null,
    data_nascimento: null,
    endereco: null,
    genero: null,
    renda_inicial: 1500,
    categoria_atual: 'Conectado',
    status_global: 'Ativo',
    criado_em: new Date('2025-01-01'),
    atualizado_em: null,
    ...overrides,
  };
}

beforeEach(() => {
  jest.clearAllMocks();
  // Por padrão, criar resolve com sucesso
  jovemServiceMock.criar.mockResolvedValue(makeJovem());
});

// ══════════════════════════════════════════════════════════════════════════════
// importarJovens
// ══════════════════════════════════════════════════════════════════════════════
describe('importarJovens', () => {
  // CT01 – sucesso: 1 linha válida → importados=1, erros=[]          RN11, RF016
  test('CT01 — sucesso: 1 linha válida resulta em importados=1 e erros=[] (RN11 · RF016)', async () => {
    // Arrange
    parseCsvMock.mockReturnValue([makeLinha()]);

    // Act
    const resultado = await importService.importarJovens('conteudo', 1);

    // Assert
    expect(resultado.importados).toBe(1);
    expect(resultado.atualizados).toBe(0);
    expect(resultado.erros).toHaveLength(0);
    expect(jovemServiceMock.criar).toHaveBeenCalledTimes(1);
  });

  // CT02 – ValidationError quando parseCsv retorna []                RN11, RF016
  test('CT02 — ValidationError quando CSV está vazio ou só com header (RN11 · RF016)', async () => {
    // Arrange
    parseCsvMock.mockReturnValue([]);

    // Act
    const promise = importService.importarJovens('', 1);

    // Assert
    await expect(promise).rejects.toBeInstanceOf(ValidationError);
    expect(jovemServiceMock.criar).not.toHaveBeenCalled();
  });

  // CT03 – linha sem cpf ainda é importada (cpf é opcional)          RN03, RN11, RF016
  test('CT03 — linha sem cpf é importada normalmente (cpf opcional) (RN03 · RN11 · RF016)', async () => {
    // Arrange
    parseCsvMock.mockReturnValue([makeLinha({ cpf: '' })]);

    // Act
    const resultado = await importService.importarJovens('csv', 1);

    // Assert
    expect(resultado.importados).toBe(1);
    expect(resultado.erros).toHaveLength(0);
    expect(jovemServiceMock.criar).toHaveBeenCalledTimes(1);
  });

  // CT04 – linha sem nome é pulada com erro acumulado                RN11, RF016
  test('CT04 — linha sem nome é pulada; erro acumulado sem abortar processamento (RN11 · RF016)', async () => {
    // Arrange
    parseCsvMock.mockReturnValue([makeLinha({ nome: '' })]);

    // Act
    const resultado = await importService.importarJovens('csv', 1);

    // Assert
    expect(resultado.importados).toBe(0);
    expect(resultado.erros).toHaveLength(1);
    expect(resultado.erros[0].mensagem).toContain('nome');
    expect(jovemServiceMock.criar).not.toHaveBeenCalled();
  });

  // CT05 – linha sem email é pulada com erro acumulado               RN11, RF016
  test('CT05 — linha sem email é pulada; erro acumulado sem abortar processamento (RN11 · RF016)', async () => {
    // Arrange
    parseCsvMock.mockReturnValue([makeLinha({ email: '' })]);

    // Act
    const resultado = await importService.importarJovens('csv', 1);

    // Assert
    expect(resultado.importados).toBe(0);
    expect(resultado.erros).toHaveLength(1);
    expect(resultado.erros[0].mensagem).toContain('email');
  });

  // CT06 – erro de criação não-conflito é capturado e acumulado      RN11, RF016
  test('CT06 — erro de jovemService.criar é capturado; linha conta como erro sem abortar (RN11 · RF016)', async () => {
    // Arrange
    parseCsvMock.mockReturnValue([makeLinha()]);
    jovemServiceMock.criar.mockRejectedValue(new ValidationError('CPF inválido'));

    // Act
    const resultado = await importService.importarJovens('csv', 1);

    // Assert
    expect(resultado.importados).toBe(0);
    expect(resultado.erros).toHaveLength(1);
    expect(resultado.erros[0].mensagem).toContain('CPF inválido');
  });

  // CT07 – ConflictError aciona caminho de atualização               RN01, RN11, RF016
  test('CT07 — e-mail/CPF duplicado (ConflictError) atualiza registro existente (RN01 · RN11 · RF016)', async () => {
    // Arrange
    parseCsvMock.mockReturnValue([makeLinha()]);
    jovemServiceMock.criar.mockRejectedValue(new ConflictError('email já cadastrado'));
    jovemRepoMock.buscarPorCpf.mockResolvedValue(makeJovem({ id: 5 }));
    jovemServiceMock.atualizar.mockResolvedValue(makeJovem({ id: 5 }));

    // Act
    const resultado = await importService.importarJovens('csv', 1);

    // Assert
    expect(resultado.importados).toBe(0);
    expect(resultado.atualizados).toBe(1);
    expect(jovemServiceMock.atualizar).toHaveBeenCalledTimes(1);
  });

  // CT08 – número da linha no erro corresponde à posição + 2 (header = linha 1) RN11, RF016
  test('CT08 — erro inclui número correto da linha (i+2) (RN11 · RF016)', async () => {
    // Arrange — linha 0 (índice) => linha 2 no CSV (linha 1 = header)
    parseCsvMock.mockReturnValue([makeLinha({ nome: '' })]);

    // Act
    const resultado = await importService.importarJovens('csv', 1);

    // Assert
    expect(resultado.erros[0].linha).toBe(2);
  });
});
