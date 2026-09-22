/**
 * tests/jovemService.test.ts
 * Testes unitários de jovemService — alinhados às RNs do WAD (sprint 4).
 *
 * Estratégia: repositórios, pool e auditoriaService substituídos por mocks.
 * Nenhum teste toca o banco real.
 *
 * RN03: CPF opcional; telefone obrigatório; CPF validado por dígitos verificadores quando presente.
 * RN04b: jovem deve ter 14–29 anos no cadastro.
 * RN01: e-mail e CPF não podem ser duplicados.
 * RN05: renda_inicial imutável após criação.
 * RN06: categoria inicial é sempre Conectado.
 * RN07: mudança de categoria registra categoria_anterior e id_usuario.
 */

import * as jovemService from '../../src/services/jovemService';
import * as jovemRepo from '../../src/repositories/jovemRepository';
import * as categoriaRepo from '../../src/repositories/categoriaRepository';
import * as frequenciaAulaRepo from '../../src/repositories/frequenciaAulaRepository';
import * as registroRepo from '../../src/repositories/registroAcompanhamentoRepository';
import * as sessaoMentoriaRepo from '../../src/repositories/sessaoMentoriaRepository';
import * as empregabilidadeRepo from '../../src/repositories/empregabilidadeRepository';
import * as ensinoSuperiorRepo from '../../src/repositories/ensinoSuperiorRepository';
import * as auditoriaService from '../../src/services/auditoriaService';
import { pool } from '../../src/db/pool';
import { NotFoundError, ConflictError, ValidationError } from '../../src/errors/AppError';
import type { Jovem } from '../../src/models/jovem';
import type { Categoria } from '../../src/models/categoria';

// ── Mocks de módulo ────────────────────────────────────────────────────────────
jest.mock('../../src/repositories/jovemRepository');
jest.mock('../../src/repositories/categoriaRepository');
jest.mock('../../src/repositories/frequenciaAulaRepository');
jest.mock('../../src/repositories/registroAcompanhamentoRepository');
jest.mock('../../src/repositories/sessaoMentoriaRepository');
jest.mock('../../src/repositories/empregabilidadeRepository');
jest.mock('../../src/repositories/ensinoSuperiorRepository');
jest.mock('../../src/services/auditoriaService');
jest.mock('../../src/db/pool');

// ── Helpers de fixture ────────────────────────────────────────────────────────
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
    renda_inicial: 1200,
    categoria_atual: 'Conectado',
    status_global: 'Ativo',
    criado_em: new Date('2024-01-01'),
    atualizado_em: null,
    ...overrides,
  };
}

function makeCategoria(overrides: Partial<Categoria> = {}): Categoria {
  return {
    id: 10,
    id_jovem: 1,
    id_usuario: null,
    categoria_adquirida: 'Conectado',
    categoria_anterior: null,
    data_inclusao: new Date('2024-01-01'),
    ...overrides,
  };
}

// CPF matematicamente válido para uso nos testes (111.444.777-35).
const CPF_VALIDO = '111.444.777-35';
// CPF com dígito verificador incorreto.
const CPF_INVALIDO = '111.444.777-99';

// ── Referências tipadas aos mocks ─────────────────────────────────────────────
const jovemRepoMock = jest.mocked(jovemRepo);
const categoriaRepoMock = jest.mocked(categoriaRepo);
const frequenciaAulaRepoMock = jest.mocked(frequenciaAulaRepo);
const registroRepoMock = jest.mocked(registroRepo);
const sessaoMentoriaRepoMock = jest.mocked(sessaoMentoriaRepo);
const empregabilidadeRepoMock = jest.mocked(empregabilidadeRepo);
const ensinoSuperiorRepoMock = jest.mocked(ensinoSuperiorRepo);

// Mock do pool.connect() — retorna client falso com BEGIN/COMMIT/ROLLBACK
const mockClient = {
  query: jest.fn().mockResolvedValue({ rows: [], rowCount: 0 }),
  release: jest.fn(),
};
const poolMock = jest.mocked(pool);

beforeEach(() => {
  jest.clearAllMocks();
  (poolMock.connect as jest.Mock).mockResolvedValue(mockClient);
  mockClient.query.mockResolvedValue({ rows: [], rowCount: 0 });
  mockClient.release.mockReturnValue(undefined);
  // Por padrão, e-mail e CPF não estão duplicados
  jovemRepoMock.buscarPorEmail.mockResolvedValue(null);
  jovemRepoMock.buscarPorCpf.mockResolvedValue(null);
});

// ══════════════════════════════════════════════════════════════════════════════
// criar
// ══════════════════════════════════════════════════════════════════════════════
describe('criar', () => {
  // CT01 — CPF opcional: sucesso sem CPF                                RN03, RN06, RF001
  test('CT01 — sucesso sem CPF: CPF é opcional conforme RN03 (RN03 · RN06 · RF001)', async () => {
    // Arrange
    const dados = { nome: 'Ana Lima', email: 'ana@example.com', telefone: '11999990000' };
    const jovemCriado = makeJovem();
    jovemRepoMock.inserir.mockResolvedValue(jovemCriado);
    categoriaRepoMock.inserir.mockResolvedValue(makeCategoria());

    // Act
    const resultado = await jovemService.criar(dados, 1);

    // Assert
    expect(resultado).toEqual(jovemCriado);
    // Sem CPF: buscarPorCpf NÃO deve ser chamado
    expect(jovemRepoMock.buscarPorCpf).not.toHaveBeenCalled();
    expect(categoriaRepoMock.inserir).toHaveBeenCalledWith(
      expect.objectContaining({ categoria_adquirida: 'Conectado' }),
      mockClient
    );
    expect(mockClient.query).toHaveBeenCalledWith('COMMIT');
  });

  // CT02 — CPF válido: aceito e duplicata verificada                    RN03, RN01, RF001
  test('CT02 — sucesso com CPF válido: dígitos verificadores aceitos e unicidade verificada (RN03 · RN01 · RF001)', async () => {
    // Arrange
    const dados = { nome: 'Ana Lima', email: 'ana@example.com', telefone: '11999990000', cpf: CPF_VALIDO };
    jovemRepoMock.inserir.mockResolvedValue(makeJovem({ cpf: CPF_VALIDO }));
    categoriaRepoMock.inserir.mockResolvedValue(makeCategoria());

    // Act
    await jovemService.criar(dados, 1);

    // Assert — buscarPorCpf deve ser chamado quando CPF é informado
    expect(jovemRepoMock.buscarPorCpf).toHaveBeenCalledWith(CPF_VALIDO);
  });

  // CT03 — nome obrigatório                                             RN03, RF001
  test('CT03 — ValidationError quando nome é vazio (RN03 · RF001)', async () => {
    // Arrange
    const dados = { nome: '   ', email: 'ana@example.com', telefone: '11999990000' };

    // Act
    const promise = jovemService.criar(dados, 1);

    // Assert
    await expect(promise).rejects.toBeInstanceOf(ValidationError);
    expect(jovemRepoMock.inserir).not.toHaveBeenCalled();
  });

  // CT04 — email obrigatório                                            RN03, RF001
  test('CT04 — ValidationError quando email é vazio (RN03 · RF001)', async () => {
    // Arrange
    const dados = { nome: 'Ana Lima', email: '', telefone: '11999990000' };

    // Act
    const promise = jovemService.criar(dados, 1);

    // Assert
    await expect(promise).rejects.toBeInstanceOf(ValidationError);
    expect(jovemRepoMock.inserir).not.toHaveBeenCalled();
  });

  // CT05 — telefone obrigatório                                         RN03, RF001
  test('CT05 — ValidationError quando telefone é vazio (RN03 · RF001)', async () => {
    // Arrange
    const dados = { nome: 'Ana Lima', email: 'ana@example.com', telefone: '' };

    // Act
    const promise = jovemService.criar(dados, 1);

    // Assert
    await expect(promise).rejects.toBeInstanceOf(ValidationError);
    expect(jovemRepoMock.inserir).not.toHaveBeenCalled();
  });

  // CT06 — CPF com dígito verificador inválido                          RN03, RF001
  test('CT06 — ValidationError quando CPF informado tem dígito verificador inválido (RN03 · RF001)', async () => {
    // Arrange
    const dados = { nome: 'Ana Lima', email: 'ana@example.com', telefone: '11999990000', cpf: CPF_INVALIDO };

    // Act
    const promise = jovemService.criar(dados, 1);

    // Assert
    await expect(promise).rejects.toBeInstanceOf(ValidationError);
    // CPF inválido é rejeitado antes de consultar o banco
    expect(jovemRepoMock.buscarPorCpf).not.toHaveBeenCalled();
    expect(jovemRepoMock.inserir).not.toHaveBeenCalled();
  });

  // CT07 — faixa etária 14–29 anos                                      RN04b, RF001
  test('CT07 — ValidationError quando jovem tem idade fora de 14–29 anos (RN04b · RF001)', async () => {
    // Arrange — nascido em 1980 → ~45 anos em 2025, sempre acima de 29
    const dados = {
      nome: 'Ana Lima',
      email: 'ana@example.com',
      telefone: '11999990000',
      data_nascimento: '15/06/1980',
    };

    // Act
    const promise = jovemService.criar(dados, 1);

    // Assert
    await expect(promise).rejects.toBeInstanceOf(ValidationError);
    expect(jovemRepoMock.inserir).not.toHaveBeenCalled();
  });

  // CT08 — e-mail duplicado                                             RN01, RF001
  test('CT08 — ConflictError quando e-mail já está cadastrado (RN01 · RF001)', async () => {
    // Arrange
    const dados = { nome: 'Ana Lima', email: 'ana@example.com', telefone: '11999990000' };
    jovemRepoMock.buscarPorEmail.mockResolvedValue(makeJovem());

    // Act
    const promise = jovemService.criar(dados, 1);

    // Assert
    await expect(promise).rejects.toBeInstanceOf(ConflictError);
    expect(jovemRepoMock.inserir).not.toHaveBeenCalled();
  });

  // CT09 — CPF duplicado                                                RN01, RF001
  test('CT09 — ConflictError quando CPF já está cadastrado (RN01 · RF001)', async () => {
    // Arrange
    const dados = { nome: 'Ana Lima', email: 'ana@example.com', telefone: '11999990000', cpf: CPF_VALIDO };
    jovemRepoMock.buscarPorCpf.mockResolvedValue(makeJovem({ cpf: CPF_VALIDO }));

    // Act
    const promise = jovemService.criar(dados, 1);

    // Assert
    await expect(promise).rejects.toBeInstanceOf(ConflictError);
    expect(jovemRepoMock.inserir).not.toHaveBeenCalled();
  });

  // CT10 — ROLLBACK quando inserção de categoria falha                  RNF-CONF
  test('CT10 — ROLLBACK chamado quando inserção da categoria falha (RNF-CONF)', async () => {
    // Arrange
    const dados = { nome: 'Ana Lima', email: 'ana@example.com', telefone: '11999990000' };
    jovemRepoMock.inserir.mockResolvedValue(makeJovem());
    categoriaRepoMock.inserir.mockRejectedValue(new Error('DB error'));

    // Act
    const promise = jovemService.criar(dados, 1);

    // Assert
    await expect(promise).rejects.toThrow('DB error');
    expect(mockClient.query).toHaveBeenCalledWith('ROLLBACK');
    expect(mockClient.release).toHaveBeenCalled();
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// buscarPorId
// ══════════════════════════════════════════════════════════════════════════════
describe('buscarPorId', () => {
  // CT11 — sucesso                                                       RN16, RF009
  test('CT11 — sucesso: retorna jovem quando encontrado (RN16 · RF009)', async () => {
    // Arrange
    const jovem = makeJovem();
    jovemRepoMock.buscarPorId.mockResolvedValue(jovem);

    // Act
    const resultado = await jovemService.buscarPorId(1);

    // Assert
    expect(resultado).toEqual(jovem);
    expect(jovemRepoMock.buscarPorId).toHaveBeenCalledWith(1);
  });

  // CT12 — NotFoundError                                                 RN16, RF009
  test('CT12 — NotFoundError quando jovem não existe (RN16 · RF009)', async () => {
    // Arrange
    jovemRepoMock.buscarPorId.mockResolvedValue(null);

    // Act
    const promise = jovemService.buscarPorId(999);

    // Assert
    await expect(promise).rejects.toBeInstanceOf(NotFoundError);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// listar
// ══════════════════════════════════════════════════════════════════════════════
describe('listar', () => {
  // CT13 — filtros AND                                                   RN21, RF012
  test('CT13 — repassa filtros ao repo; filtros aplicados como AND lógico (RN21 · RF012)', async () => {
    // Arrange
    const lista = [makeJovem(), makeJovem({ id: 2 })];
    jovemRepoMock.buscarComFiltros.mockResolvedValue(lista);
    const filtros = { categoria: 'Conectado' as const };

    // Act
    const resultado = await jovemService.listar(filtros);

    // Assert
    expect(resultado).toEqual(lista);
    expect(jovemRepoMock.buscarComFiltros).toHaveBeenCalledWith(filtros);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// atualizar
// ══════════════════════════════════════════════════════════════════════════════
describe('atualizar', () => {
  // CT14 — sucesso                                                       RN16, RF002
  test('CT14 — sucesso: retorna jovem atualizado (RN16 · RF002)', async () => {
    // Arrange
    const anterior = makeJovem();
    const atualizado = makeJovem({ nome: 'Ana Editado' });
    jovemRepoMock.buscarPorId.mockResolvedValue(anterior);
    jovemRepoMock.atualizar.mockResolvedValue(atualizado);

    // Act
    const resultado = await jovemService.atualizar(1, { nome: 'Ana Editado' }, 1);

    // Assert
    expect(resultado).toEqual(atualizado);
    expect(jovemRepoMock.atualizar).toHaveBeenCalledWith(1, { nome: 'Ana Editado' });
  });

  // CT15 — renda_inicial não aceita no payload (RN05) ─ tipagem garante isso
  // Nota: JovemAtualizacao não possui renda_inicial; o campo foi removido do
  // modelo e do SET do repository. O TypeScript impede envio em tempo de compilação.

  // CT16 — NotFoundError                                                 RN16, RF002
  test('CT16 — NotFoundError quando jovem não existe (RN16 · RF002)', async () => {
    // Arrange
    jovemRepoMock.buscarPorId.mockResolvedValue(null);

    // Act
    const promise = jovemService.atualizar(999, { nome: 'X' }, 1);

    // Assert
    await expect(promise).rejects.toBeInstanceOf(NotFoundError);
    expect(jovemRepoMock.atualizar).not.toHaveBeenCalled();
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// remover
// ══════════════════════════════════════════════════════════════════════════════
describe('remover', () => {
  // CT17 — sucesso + auditoria                                           RN16, RF002
  test('CT17 — sucesso: soft delete e auditoria registrada (RN16 · RF002)', async () => {
    // Arrange
    jovemRepoMock.buscarPorId.mockResolvedValue(makeJovem());
    jovemRepoMock.remover.mockResolvedValue(true);

    // Act
    await jovemService.remover(1, 1);

    // Assert
    expect(jovemRepoMock.remover).toHaveBeenCalledWith(1);
    expect(auditoriaService.registrar).toHaveBeenCalled();
  });

  // CT18 — NotFoundError na busca prévia                                 RN16, RF002
  test('CT18 — NotFoundError quando jovem não existe (busca prévia) (RN16 · RF002)', async () => {
    // Arrange
    jovemRepoMock.buscarPorId.mockResolvedValue(null);

    // Act
    const promise = jovemService.remover(999, 1);

    // Assert
    await expect(promise).rejects.toBeInstanceOf(NotFoundError);
    expect(jovemRepoMock.remover).not.toHaveBeenCalled();
  });

  // CT19 — NotFoundError quando repo.remover retorna false               RN16, RF002
  test('CT19 — NotFoundError quando repo.remover retorna false (RN16 · RF002)', async () => {
    // Arrange
    jovemRepoMock.buscarPorId.mockResolvedValue(makeJovem());
    jovemRepoMock.remover.mockResolvedValue(false);

    // Act
    const promise = jovemService.remover(1, 1);

    // Assert
    await expect(promise).rejects.toBeInstanceOf(NotFoundError);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// obterPerfilCompleto
// ══════════════════════════════════════════════════════════════════════════════
describe('obterPerfilCompleto', () => {
  // CT20 — sucesso                                                       RN16, RF009
  test('CT20 — sucesso: agrega categorias e taxa de frequência do próprio jovem (RN16 · RF009)', async () => {
    // Arrange
    const jovem = makeJovem();
    const categorias = [makeCategoria()];
    jovemRepoMock.buscarPorId.mockResolvedValue(jovem);
    categoriaRepoMock.listarPorJovem.mockResolvedValue(categorias);
    frequenciaAulaRepoMock.calcularTaxaPresenca.mockResolvedValue(87.5);
    registroRepoMock.listarPorJovem.mockResolvedValue([]);
    sessaoMentoriaRepoMock.buscarPorJovem.mockResolvedValue([]);
    empregabilidadeRepoMock.buscarPorJovem.mockResolvedValue([]);
    ensinoSuperiorRepoMock.buscarPorJovem.mockResolvedValue([]);

    // Act
    const perfil = await jovemService.obterPerfilCompleto(1);

    // Assert
    expect(perfil.jovem).toEqual(jovem);
    expect(perfil.categorias).toEqual(categorias);
    expect(perfil.taxaFrequencia).toBe(87.5);
    expect(perfil.programaAtual).toBeNull();
    expect(Array.isArray(perfil.empregabilidades)).toBe(true);
    expect(Array.isArray(perfil.ensinoSuperior)).toBe(true);
    expect(Array.isArray(perfil.registros)).toBe(true);
  });

  // CT21 — NotFoundError                                                 RN16, RF009
  test('CT21 — NotFoundError quando jovem não existe (RN16 · RF009)', async () => {
    // Arrange
    jovemRepoMock.buscarPorId.mockResolvedValue(null);

    // Act
    const promise = jovemService.obterPerfilCompleto(999);

    // Assert
    await expect(promise).rejects.toBeInstanceOf(NotFoundError);
    expect(categoriaRepoMock.listarPorJovem).not.toHaveBeenCalled();
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// mudarCategoria
// ══════════════════════════════════════════════════════════════════════════════
describe('mudarCategoria', () => {
  // CT22 — registra categoria_anterior e id_usuario (RN07)               RN07, RF003
  test('CT22 — sucesso: insere registro com categoria_anterior e id_usuario (RN07 · RF003)', async () => {
    // Arrange
    const jovem = makeJovem({ categoria_atual: 'Conectado' });
    const novoRegistro = makeCategoria({
      id: 2,
      categoria_adquirida: 'Capacitado',
      categoria_anterior: 'Conectado',
      id_usuario: 1,
    });
    jovemRepoMock.buscarPorId.mockResolvedValue(jovem);
    categoriaRepoMock.inserir.mockResolvedValue(novoRegistro);
    jovemRepoMock.atualizar.mockResolvedValue(makeJovem({ categoria_atual: 'Capacitado' }));

    // Act
    const resultado = await jovemService.mudarCategoria(1, 'Capacitado', 1);

    // Assert
    expect(resultado).toEqual(novoRegistro);
    expect(categoriaRepoMock.inserir).toHaveBeenCalledWith({
      id_jovem: 1,
      categoria_adquirida: 'Capacitado',
      categoria_anterior: 'Conectado',   // ← categoria que estava antes
      id_usuario: 1,
    });
    expect(jovemRepoMock.atualizar).toHaveBeenCalledWith(1, { categoria_atual: 'Capacitado' });
  });

  // CT23 — NotFoundError                                                 RN07, RF003
  test('CT23 — NotFoundError quando jovem não existe (RN07 · RF003)', async () => {
    // Arrange
    jovemRepoMock.buscarPorId.mockResolvedValue(null);

    // Act
    const promise = jovemService.mudarCategoria(999, 'Capacitado', 1);

    // Assert
    await expect(promise).rejects.toBeInstanceOf(NotFoundError);
    expect(categoriaRepoMock.inserir).not.toHaveBeenCalled();
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// listarCategorias
// ══════════════════════════════════════════════════════════════════════════════
describe('listarCategorias', () => {
  // CT24 — sucesso                                                       RN07, RF003
  test('CT24 — sucesso: retorna histórico de categorias em ordem cronológica (RN07 · RF003)', async () => {
    // Arrange
    const jovem = makeJovem();
    const historico = [
      makeCategoria({ id: 1, categoria_adquirida: 'Conectado', categoria_anterior: null }),
      makeCategoria({ id: 2, categoria_adquirida: 'Capacitado', categoria_anterior: 'Conectado', id_usuario: 0 }),
    ];
    jovemRepoMock.buscarPorId.mockResolvedValue(jovem);
    categoriaRepoMock.listarPorJovem.mockResolvedValue(historico);

    // Act
    const resultado = await jovemService.listarCategorias(1);

    // Assert
    expect(resultado).toEqual(historico);
    expect(categoriaRepoMock.listarPorJovem).toHaveBeenCalledWith(1);
  });

  // CT25 — NotFoundError                                                 RN07, RF003
  test('CT25 — NotFoundError quando jovem não existe (RN07 · RF003)', async () => {
    // Arrange
    jovemRepoMock.buscarPorId.mockResolvedValue(null);

    // Act
    const promise = jovemService.listarCategorias(999);

    // Assert
    await expect(promise).rejects.toBeInstanceOf(NotFoundError);
    expect(categoriaRepoMock.listarPorJovem).not.toHaveBeenCalled();
  });
});
