/**
 * tests/programaService.test.ts
 * Testes unitários de programaService.
 *
 * Estratégia de isolamento: programaRepository e inscricaoRepository são
 * substituídos por mocks via jest.mock. Nenhum teste toca o banco real.
 */

import * as programaService from '../../src/services/programaService';
import * as programaRepo from '../../src/repositories/programaRepository';
import * as inscricaoRepo from '../../src/repositories/inscricaoRepository';
import { NotFoundError, ConflictError, BadRequestError } from '../../src/errors/AppError';
import type { Programa } from '../../src/models/programa';
import type { Inscricao } from '../../src/models/inscricao';

// ── Mocks de módulo ────────────────────────────────────────────────────────────
jest.mock('../../src/repositories/programaRepository');
jest.mock('../../src/repositories/inscricaoRepository');

// ── Referências tipadas aos mocks ─────────────────────────────────────────────
const programaMock = jest.mocked(programaRepo);
const inscricaoMock = jest.mocked(inscricaoRepo);

// ── Fixtures ──────────────────────────────────────────────────────────────────
function makePrograma(overrides: Partial<Programa> = {}): Programa {
  return {
    id: 1,
    nome: 'Programa Capacitação 2025',
    descricao: 'Descrição do programa',
    data_inicio: new Date('2025-01-01'),
    data_fim: new Date('2025-12-31'),
    ...overrides,
  };
}

function makeInscricao(overrides: Partial<Inscricao> = {}): Inscricao {
  return {
    id: 10,
    id_jovem: 5,
    id_programa: 1,
    status_conclusao: 'Em andamento',
    data_matricula: new Date('2025-02-01'),
    data_status: null,
    ...overrides,
  };
}

beforeEach(() => {
  jest.clearAllMocks();
});

// ══════════════════════════════════════════════════════════════════════════════
// listar
// ══════════════════════════════════════════════════════════════════════════════
describe('listar', () => {
  // CT-PM — sucesso                                                      RN08, RF004
  test('CT-PM — sucesso: retorna array de programas (RN08 · RF004)', async () => {
    // Arrange
    const lista = [makePrograma(), makePrograma({ id: 2, nome: 'Programa B' })];
    programaMock.listarTodos.mockResolvedValue(lista);

    // Act
    const resultado = await programaService.listar();

    // Assert
    expect(resultado).toEqual(lista);
    expect(programaMock.listarTodos).toHaveBeenCalledTimes(1);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// buscarPorId
// ══════════════════════════════════════════════════════════════════════════════
describe('buscarPorId', () => {
  // CT-PM04 — sucesso                                                    RN08, RF004
  test('CT-PM04 — sucesso: retorna programa quando encontrado (RN08 · RF004)', async () => {
    // Arrange
    const programa = makePrograma();
    programaMock.buscarPorId.mockResolvedValue(programa);

    // Act
    const resultado = await programaService.buscarPorId(1);

    // Assert
    expect(resultado).toEqual(programa);
    expect(programaMock.buscarPorId).toHaveBeenCalledWith(1);
  });

  // CT-PM05 — falha (NotFound)                                          RN08, RF004
  test('CT-PM05 — falha: lança NotFoundError quando programa não existe (RN08 · RF004)', async () => {
    // Arrange
    programaMock.buscarPorId.mockResolvedValue(null);

    // Act / Assert
    await expect(programaService.buscarPorId(99)).rejects.toBeInstanceOf(NotFoundError);
    expect(programaMock.buscarPorId).toHaveBeenCalledWith(99);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// criar
// ══════════════════════════════════════════════════════════════════════════════
describe('criar', () => {
  // CT-PM01 — sucesso                                                    RN08, RF004
  test('CT-PM01 — sucesso: cria programa com nome e data_inicio válidos (RN08 · RF004)', async () => {
    // Arrange
    const input = { nome: 'Programa X', descricao: null, data_inicio: new Date('2025-03-01'), data_fim: null };
    const criado = makePrograma({ nome: 'Programa X' });
    programaMock.criar.mockResolvedValue(criado);

    // Act
    const resultado = await programaService.criar(input);

    // Assert
    expect(resultado).toEqual(criado);
    expect(programaMock.criar).toHaveBeenCalledWith(input);
  });

  // CT-PM02 — falha (BadRequest) nome vazio                             RN08, RF004
  test('CT-PM02 — falha: nome vazio lança BadRequestError antes de acessar o repo (RN08 · RF004)', async () => {
    // Arrange
    const input = { nome: '   ', descricao: null, data_inicio: new Date(), data_fim: null };

    // Act / Assert
    await expect(programaService.criar(input)).rejects.toBeInstanceOf(BadRequestError);
    expect(programaMock.criar).not.toHaveBeenCalled();
  });

  // CT-PM02b — falha (BadRequest) nome ausente                          RN08, RF004
  test('CT-PM02b — falha: nome ausente lança BadRequestError (RN08 · RF004)', async () => {
    // Arrange
    const input = { nome: undefined as any, descricao: null, data_inicio: new Date(), data_fim: null };

    // Act / Assert
    await expect(programaService.criar(input)).rejects.toBeInstanceOf(BadRequestError);
    expect(programaMock.criar).not.toHaveBeenCalled();
  });

  // CT-PM03 — falha (BadRequest) data_inicio ausente                    RN08, RF004
  test('CT-PM03 — falha: data_inicio ausente lança BadRequestError antes de acessar o repo (RN08 · RF004)', async () => {
    // Arrange
    const input = { nome: 'Programa Válido', descricao: null, data_inicio: undefined as any, data_fim: null };

    // Act / Assert
    await expect(programaService.criar(input)).rejects.toBeInstanceOf(BadRequestError);
    expect(programaMock.criar).not.toHaveBeenCalled();
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// atualizar
// ══════════════════════════════════════════════════════════════════════════════
describe('atualizar', () => {
  // CT-PM06 — sucesso                                                    RN08, RF004
  test('CT-PM06 — sucesso: retorna programa atualizado (RN08 · RF004)', async () => {
    // Arrange
    const programa = makePrograma();
    const atualizado = makePrograma({ nome: 'Novo Nome' });
    programaMock.buscarPorId.mockResolvedValue(programa);
    programaMock.atualizar.mockResolvedValue(atualizado);

    // Act
    const resultado = await programaService.atualizar(1, { nome: 'Novo Nome' });

    // Assert
    expect(resultado).toEqual(atualizado);
    expect(programaMock.buscarPorId).toHaveBeenCalledWith(1);
    expect(programaMock.atualizar).toHaveBeenCalledWith(1, { nome: 'Novo Nome' });
  });

  // CT-PM07 — falha (NotFound) programa inexistente                     RN08, RF004
  test('CT-PM07 — falha: lança NotFoundError quando programa não existe (RN08 · RF004)', async () => {
    // Arrange
    programaMock.buscarPorId.mockResolvedValue(null);

    // Act / Assert
    await expect(programaService.atualizar(99, { nome: 'X' })).rejects.toBeInstanceOf(NotFoundError);
    expect(programaMock.atualizar).not.toHaveBeenCalled();
  });

  // falha (NotFound) atualizar retorna null
  test('falha: NotFoundError quando repo.atualizar retorna null', async () => {
    // Arrange
    programaMock.buscarPorId.mockResolvedValue(makePrograma());
    programaMock.atualizar.mockResolvedValue(null);

    // Act / Assert
    await expect(programaService.atualizar(1, { nome: 'X' })).rejects.toBeInstanceOf(NotFoundError);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// listStudents
// ══════════════════════════════════════════════════════════════════════════════
describe('listStudents', () => {
  test('sucesso: retorna alunos inscritos no programa', async () => {
    // Arrange
    programaMock.buscarPorId.mockResolvedValue(makePrograma());
    const alunos = [{ id_jovem: 1, nome: 'Ana', status_conclusao: 'Em andamento' }];
    programaMock.listarJovensInscritos.mockResolvedValue(alunos);

    // Act
    const resultado = await programaService.listStudents(1);

    // Assert
    expect(resultado).toEqual(alunos);
    expect(programaMock.listarJovensInscritos).toHaveBeenCalledWith(1);
  });

  test('falha: NotFoundError quando programa não existe', async () => {
    // Arrange
    programaMock.buscarPorId.mockResolvedValue(null);

    // Act / Assert
    await expect(programaService.listStudents(99)).rejects.toBeInstanceOf(NotFoundError);
    expect(programaMock.listarJovensInscritos).not.toHaveBeenCalled();
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// listEvents
// ══════════════════════════════════════════════════════════════════════════════
describe('listEvents', () => {
  test('sucesso: retorna aulas do programa', async () => {
    // Arrange
    programaMock.buscarPorId.mockResolvedValue(makePrograma());
    const aulas = [{ id: 1, nome: 'Aula 1', data: new Date('2025-03-10') }];
    programaMock.listarAulas.mockResolvedValue(aulas);

    // Act
    const resultado = await programaService.listEvents(1);

    // Assert
    expect(resultado).toEqual(aulas);
    expect(programaMock.listarAulas).toHaveBeenCalledWith(1);
  });

  test('falha: NotFoundError quando programa não existe', async () => {
    // Arrange
    programaMock.buscarPorId.mockResolvedValue(null);

    // Act / Assert
    await expect(programaService.listEvents(99)).rejects.toBeInstanceOf(NotFoundError);
    expect(programaMock.listarAulas).not.toHaveBeenCalled();
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// inserirInscricao
// ══════════════════════════════════════════════════════════════════════════════
describe('inserirInscricao', () => {
  // CT-PM08 — sucesso                                                    RF004, RN08
  test('CT-PM08 — sucesso: inscreve jovem com status "Em andamento" (RF004 · RN08)', async () => {
    // Arrange
    programaMock.buscarPorId.mockResolvedValue(makePrograma());
    inscricaoMock.buscarPorJovemEPrograma.mockResolvedValue(null);
    const inscricaoCriada = makeInscricao();
    inscricaoMock.criar.mockResolvedValue(inscricaoCriada);

    // Act
    const resultado = await programaService.inserirInscricao(5, { id_programa: 1 });

    // Assert
    expect(resultado).toEqual(inscricaoCriada);
    expect(inscricaoMock.criar).toHaveBeenCalledWith(
      expect.objectContaining({
        id_jovem: 5,
        id_programa: 1,
        status_conclusao: 'Em andamento',
      })
    );
  });

  // CT-PM09 — falha (BadRequest) id_programa ausente                    RF004, RN08
  test('CT-PM09 — falha: id_programa ausente lança BadRequestError antes de qualquer consulta (RF004 · RN08)', async () => {
    // Act / Assert
    await expect(
      programaService.inserirInscricao(5, { id_programa: 0 })
    ).rejects.toBeInstanceOf(BadRequestError);
    expect(programaMock.buscarPorId).not.toHaveBeenCalled();
    expect(inscricaoMock.criar).not.toHaveBeenCalled();
  });

  // CT-PM11 — falha (NotFound) programa inexistente                     RF004, RN08
  test('CT-PM11 — falha: programa inexistente lança NotFoundError antes de verificar duplicata (RF004 · RN08)', async () => {
    // Arrange
    programaMock.buscarPorId.mockResolvedValue(null);

    // Act / Assert
    await expect(
      programaService.inserirInscricao(5, { id_programa: 99 })
    ).rejects.toBeInstanceOf(NotFoundError);
    expect(inscricaoMock.buscarPorJovemEPrograma).not.toHaveBeenCalled();
    expect(inscricaoMock.criar).not.toHaveBeenCalled();
  });

  // CT-PM10 — falha (Conflict) jovem já inscrito                        RF004, RN08
  test('CT-PM10 — falha: jovem já inscrito lança ConflictError; inscricao.criar não é chamado (RF004 · RN08)', async () => {
    // Arrange
    programaMock.buscarPorId.mockResolvedValue(makePrograma());
    inscricaoMock.buscarPorJovemEPrograma.mockResolvedValue(makeInscricao());

    // Act / Assert
    await expect(
      programaService.inserirInscricao(5, { id_programa: 1 })
    ).rejects.toBeInstanceOf(ConflictError);
    expect(inscricaoMock.criar).not.toHaveBeenCalled();
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// listarInscricoes
// ══════════════════════════════════════════════════════════════════════════════
describe('listarInscricoes', () => {
  test('sucesso: retorna inscrições do jovem', async () => {
    // Arrange
    const inscricoes = [makeInscricao(), makeInscricao({ id: 11, id_programa: 2 })];
    inscricaoMock.buscarPorJovem.mockResolvedValue(inscricoes);

    // Act
    const resultado = await programaService.listarInscricoes(5);

    // Assert
    expect(resultado).toEqual(inscricoes);
    expect(inscricaoMock.buscarPorJovem).toHaveBeenCalledWith(5);
  });
});
