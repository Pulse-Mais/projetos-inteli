/**
 * tests/ensinoSuperiorService.test.ts
 * Testes unitários de ensinoSuperiorService.
 *
 * Estratégia de isolamento: ensinoSuperiorRepository e jovemRepository mockados.
 * Nenhum teste toca o banco real.
 *
 * Modelo: status ∈ { Concluido, Cursando, Não possui }; ingressou derivado
 * (Não possui ⇒ ingressou=false). RN14 — registro só é permitido se o jovem
 * já estiver classificado como "Transformado".
 */

import * as ensinoSuperiorService from '../../src/services/ensinoSuperiorService';
import * as repo from '../../src/repositories/ensinoSuperiorRepository';
import * as jovemRepo from '../../src/repositories/jovemRepository';
import { ValidationError, NotFoundError } from '../../src/errors/AppError';
import type { EnsinoSuperior } from '../../src/models/ensinoSuperior';
import type { Jovem } from '../../src/models/jovem';

// ── Mocks de módulo ────────────────────────────────────────────────────────────
jest.mock('../../src/repositories/ensinoSuperiorRepository');
jest.mock('../../src/repositories/jovemRepository');

// ── Helpers de fixture ─────────────────────────────────────────────────────────
function makeEnsinoSuperior(overrides: Partial<EnsinoSuperior> = {}): EnsinoSuperior {
  return {
    id: 1,
    id_jovem: 10,
    ingressou: 1,
    situacao: 'Cursando',
    instituicao: 'USP',
    data_registro: new Date('2025-01-01'),
    ...overrides,
  };
}

function makeJovem(overrides: Partial<Jovem> = {}): Jovem {
  return {
    id: 10,
    nome: 'Jovem Transformado',
    email: 'jt@example.com',
    telefone: null,
    cpf: null,
    data_nascimento: null,
    endereco: null,
    genero: null,
    renda_inicial: null,
    categoria_atual: 'Transformado',
    status_global: 'Ativo',
    criado_em: new Date('2024-01-01'),
    atualizado_em: null,
    ...overrides,
  };
}

// ── Referências tipadas aos mocks ─────────────────────────────────────────────
const repoMock = jest.mocked(repo);
const jovemRepoMock = jest.mocked(jovemRepo);

beforeEach(() => {
  jest.clearAllMocks();
  // Por padrão, o jovem é 'Transformado' (atende à RN14).
  jovemRepoMock.buscarPorId.mockResolvedValue(makeJovem());
});

// ══════════════════════════════════════════════════════════════════════════════
// obterHistorico
// ══════════════════════════════════════════════════════════════════════════════
describe('obterHistorico', () => {
  // CT01 — retorna histórico do jovem                                  RN14, RF007
  test('CT01 — retorna histórico de ensino superior do jovem (RN14 · RF007)', async () => {
    // Arrange
    const historico = [makeEnsinoSuperior(), makeEnsinoSuperior({ id: 2, situacao: 'Não possui', ingressou: 0, instituicao: null })];
    repoMock.buscarPorJovem.mockResolvedValue(historico);

    // Act
    const resultado = await ensinoSuperiorService.obterHistorico(10);

    // Assert
    expect(resultado).toEqual(historico);
    expect(repoMock.buscarPorJovem).toHaveBeenCalledWith(10);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// criarRegistro
// ══════════════════════════════════════════════════════════════════════════════
describe('criarRegistro', () => {
  // CT02 — status "Cursando" deriva ingressou=true                     RN14, RF007
  test('CT02 — sucesso: status Cursando registra ingressou=true e instituicao (RN14 · RF007)', async () => {
    // Arrange
    repoMock.inserir.mockResolvedValue(makeEnsinoSuperior());

    // Act
    await ensinoSuperiorService.criarRegistro(10, { situacao: 'Cursando', instituicao: 'USP' });

    // Assert
    expect(repoMock.inserir).toHaveBeenCalledWith(
      expect.objectContaining({ id_jovem: 10, ingressou: true, situacao: 'Cursando', instituicao: 'USP' })
    );
  });

  // CT03 — status "Não possui" deriva ingressou=false e zera instituicao  RN14, RF007
  test('CT03 — sucesso: status Não possui registra ingressou=false e instituicao null (RN14 · RF007)', async () => {
    // Arrange
    repoMock.inserir.mockResolvedValue(makeEnsinoSuperior({ situacao: 'Não possui', ingressou: 0, instituicao: null }));

    // Act
    await ensinoSuperiorService.criarRegistro(10, { situacao: 'Não possui' });

    // Assert
    expect(repoMock.inserir).toHaveBeenCalledWith(
      expect.objectContaining({ ingressou: false, situacao: 'Não possui', instituicao: null })
    );
  });

  // CT04 — status inválido é rejeitado                                 RN14, RF007
  test('CT04 — ValidationError quando situacao é inválida (RN14 · RF007)', async () => {
    // Act
    const promise = ensinoSuperiorService.criarRegistro(10, { situacao: 'Bolsista' as any });

    // Assert
    await expect(promise).rejects.toBeInstanceOf(ValidationError);
    expect(repoMock.inserir).not.toHaveBeenCalled();
  });

  // CT05 — "Não possui" com instituicao é rejeitado                   RN14, RF007
  test('CT05 — ValidationError quando situacao Não possui traz instituicao (RN14 · RF007)', async () => {
    // Act
    const promise = ensinoSuperiorService.criarRegistro(10, { situacao: 'Não possui', instituicao: 'USP' });

    // Assert
    await expect(promise).rejects.toBeInstanceOf(ValidationError);
    expect(repoMock.inserir).not.toHaveBeenCalled();
  });

  // CT09 — RN14: bloqueia quando o jovem NÃO é 'Transformado'          RN14, RF007
  test('CT09 — ValidationError quando o jovem não está classificado como Transformado (RN14 · RF007)', async () => {
    // Arrange
    jovemRepoMock.buscarPorId.mockResolvedValue(makeJovem({ categoria_atual: 'Capacitado' }));

    // Act
    const promise = ensinoSuperiorService.criarRegistro(10, { situacao: 'Cursando', instituicao: 'USP' });

    // Assert
    await expect(promise).rejects.toBeInstanceOf(ValidationError);
    expect(repoMock.inserir).not.toHaveBeenCalled();
  });

  // CT10 — RN14: jovem inexistente lança NotFoundError                 RN14, RF007
  test('CT10 — NotFoundError quando o jovem não existe (RN14 · RF007)', async () => {
    // Arrange
    jovemRepoMock.buscarPorId.mockResolvedValue(null);

    // Act
    const promise = ensinoSuperiorService.criarRegistro(999, { situacao: 'Cursando', instituicao: 'USP' });

    // Assert
    await expect(promise).rejects.toBeInstanceOf(NotFoundError);
    expect(repoMock.inserir).not.toHaveBeenCalled();
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// validar (função exportada diretamente)
// ══════════════════════════════════════════════════════════════════════════════
describe('validar', () => {
  // CT06 — não lança para status válido com instituicao                RN14, RF007
  test('CT06 — não lança erro quando situacao é válida (RN14 · RF007)', () => {
    expect(() => ensinoSuperiorService.validar({ situacao: 'Concluido', instituicao: 'UNICAMP' })).not.toThrow();
  });

  // CT07 — não lança para "Não possui" sem instituicao                 RN14, RF007
  test('CT07 — não lança erro quando situacao Não possui sem instituicao (RN14 · RF007)', () => {
    expect(() => ensinoSuperiorService.validar({ situacao: 'Não possui' })).not.toThrow();
  });

  // CT08 — status fora do enum lança ValidationError                   RN14, RF007
  test('CT08 — ValidationError quando situacao está fora do enum (RN14 · RF007)', () => {
    expect(() => ensinoSuperiorService.validar({ situacao: 'Pagante' as any })).toThrow(ValidationError);
  });
});
