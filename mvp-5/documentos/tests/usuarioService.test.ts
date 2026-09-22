/**
 * tests/usuarioService.test.ts
 * Testes unitários de usuarioService.
 *
 * Estratégia de isolamento: usuarioRepository é substituído por mock.
 * Nenhum teste toca o banco real.
 */

import * as usuarioService from '../../src/services/usuarioService';
import * as repo from '../../src/repositories/usuarioRepository';
import { NotFoundError, BadRequestError, ConflictError } from '../../src/errors/AppError';
import type { Usuario } from '../../src/models/usuario';

// ── Mocks de módulo ────────────────────────────────────────────────────────────
jest.mock('../../src/repositories/usuarioRepository');

// ── Helper de fixture ─────────────────────────────────────────────────────────
function makeUsuario(overrides: Partial<Usuario> = {}): Usuario {
  return {
    id: 1,
    id_jovem: null,
    nome: 'Carlos Gestor',
    email: 'carlos@example.com',
    perfil: 'Gestao',
    criado_em: new Date('2024-03-01'),
    ...overrides,
  };
}

// ── Referência tipada ao mock ─────────────────────────────────────────────────
const repoMock = jest.mocked(repo);

beforeEach(() => {
  jest.clearAllMocks();
});

// ══════════════════════════════════════════════════════════════════════════════
// criar
// ══════════════════════════════════════════════════════════════════════════════
describe('criar', () => {
  // CT01 – sucesso                                                     RN18, RF018
  test('CT01 — sucesso: retorna usuario criado (RN18 · RF018)', async () => {
    // Arrange
    const input = { nome: 'Carlos Gestor', email: 'carlos@example.com', perfil: 'Gestao' as const };
    const usuarioCriado = makeUsuario();
    repoMock.criar.mockResolvedValue(usuarioCriado);

    // Act
    const resultado = await usuarioService.criar(input);

    // Assert
    expect(resultado).toEqual(usuarioCriado);
    expect(repoMock.criar).toHaveBeenCalledWith(input);
  });

  // CT02 – BadRequestError nome muito curto                           RN18, RF018
  test('CT02 — BadRequestError quando nome tem menos de 2 caracteres (RN18 · RF018)', async () => {
    // Arrange
    const input = { nome: 'A', email: 'a@example.com', perfil: 'Gestao' as const };

    // Act
    const promise = usuarioService.criar(input);

    // Assert
    await expect(promise).rejects.toBeInstanceOf(BadRequestError);
    expect(repoMock.criar).not.toHaveBeenCalled();
  });

  // CT03 – BadRequestError nome vazio                                  RN18, RF018
  test('CT03 — BadRequestError quando nome está vazio (RN18 · RF018)', async () => {
    // Arrange
    const input = { nome: '', email: 'a@example.com', perfil: 'Gestao' as const };

    // Act
    const promise = usuarioService.criar(input);

    // Assert
    await expect(promise).rejects.toBeInstanceOf(BadRequestError);
    expect(repoMock.criar).not.toHaveBeenCalled();
  });

  // CT04 – BadRequestError email inválido                              RN18, RF018
  test('CT04 — BadRequestError quando email não tem formato válido (RN18 · RF018)', async () => {
    // Arrange
    const input = { nome: 'Carlos', email: 'emailsemarroba', perfil: 'Gestao' as const };

    // Act
    const promise = usuarioService.criar(input);

    // Assert
    await expect(promise).rejects.toBeInstanceOf(BadRequestError);
    expect(repoMock.criar).not.toHaveBeenCalled();
  });

  // CT05 – BadRequestError perfil inválido                            RN18, RF018
  test('CT05 — BadRequestError quando perfil não é um dos valores permitidos (RN18 · RF018)', async () => {
    // Arrange
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const input = { nome: 'Carlos', email: 'c@example.com', perfil: 'Admin' as any };

    // Act
    const promise = usuarioService.criar(input);

    // Assert
    await expect(promise).rejects.toBeInstanceOf(BadRequestError);
    expect(repoMock.criar).not.toHaveBeenCalled();
  });

  // CT06 – BadRequestError Aluno sem id_jovem                         RN18, RF018
  test('CT06 — BadRequestError quando perfil Aluno não informa id_jovem (RN18 · RF018)', async () => {
    // Arrange
    const input = { nome: 'Maria Aluna', email: 'maria@example.com', perfil: 'Aluno' as const };

    // Act
    const promise = usuarioService.criar(input);

    // Assert
    await expect(promise).rejects.toBeInstanceOf(BadRequestError);
    expect(repoMock.criar).not.toHaveBeenCalled();
  });

  // CT07 – sucesso Aluno com id_jovem                                 RN18, RF018
  test('CT07 — sucesso quando perfil Aluno tem id_jovem informado (RN18 · RF018)', async () => {
    // Arrange
    const input = {
      nome: 'Maria Aluna',
      email: 'maria@example.com',
      perfil: 'Aluno' as const,
      id_jovem: 5,
    };
    const usuarioCriado = makeUsuario({ perfil: 'Aluno', id_jovem: 5 });
    repoMock.criar.mockResolvedValue(usuarioCriado);

    // Act
    const resultado = await usuarioService.criar(input);

    // Assert
    expect(resultado.perfil).toBe('Aluno');
    expect(resultado.id_jovem).toBe(5);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// buscarPorId
// ══════════════════════════════════════════════════════════════════════════════
describe('buscarPorId', () => {
  // CT08 – sucesso                                                     RN18, RF018
  test('CT08 — sucesso: retorna usuario quando encontrado (RN18 · RF018)', async () => {
    // Arrange
    const usuario = makeUsuario();
    repoMock.buscarPorId.mockResolvedValue(usuario);

    // Act
    const resultado = await usuarioService.buscarPorId(1);

    // Assert
    expect(resultado).toEqual(usuario);
    expect(repoMock.buscarPorId).toHaveBeenCalledWith(1);
  });

  // CT09 – NotFoundError                                               RN18, RF018
  test('CT09 — NotFoundError quando usuario não existe (RN18 · RF018)', async () => {
    // Arrange
    repoMock.buscarPorId.mockResolvedValue(null);

    // Act
    const promise = usuarioService.buscarPorId(999);

    // Assert
    await expect(promise).rejects.toBeInstanceOf(NotFoundError);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// listarTodos
// ══════════════════════════════════════════════════════════════════════════════
describe('listarTodos', () => {
  // CT10 – retorna array                                               RN18, RF018
  test('CT10 — retorna lista de todos os usuarios (RN18 · RF018)', async () => {
    // Arrange
    const lista = [makeUsuario(), makeUsuario({ id: 2, nome: 'Ana' })];
    repoMock.listarTodos.mockResolvedValue(lista);

    // Act
    const resultado = await usuarioService.listarTodos();

    // Assert
    expect(resultado).toHaveLength(2);
    expect(repoMock.listarTodos).toHaveBeenCalled();
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// atualizar
// ══════════════════════════════════════════════════════════════════════════════
describe('atualizar', () => {
  // CT11 – sucesso                                                     RN18, RF018
  test('CT11 — sucesso: retorna usuario atualizado (RN18 · RF018)', async () => {
    // Arrange
    const atualizado = makeUsuario({ nome: 'Carlos Editado' });
    repoMock.atualizar.mockResolvedValue(atualizado);

    // Act
    const resultado = await usuarioService.atualizar(1, { nome: 'Carlos Editado' });

    // Assert
    expect(resultado).toEqual(atualizado);
    expect(repoMock.atualizar).toHaveBeenCalledWith(1, { nome: 'Carlos Editado' });
  });

  // CT12 – BadRequestError email inválido                              RN18, RF018
  test('CT12 — BadRequestError quando email de atualização é inválido (RN18 · RF018)', async () => {
    // Arrange
    // A validação ocorre no service antes de chamar o repo; nada a preparar.

    // Act
    const promise = usuarioService.atualizar(1, { email: 'invalido' });

    // Assert
    await expect(promise).rejects.toBeInstanceOf(BadRequestError);
    expect(repoMock.atualizar).not.toHaveBeenCalled();
  });

  // CT13 – BadRequestError perfil inválido                            RN18, RF018
  test('CT13 — BadRequestError quando perfil de atualização é inválido (RN18 · RF018)', async () => {
    // Arrange
    // A validação ocorre no service antes de chamar o repo; nada a preparar.

    // Act
    const promise = usuarioService.atualizar(1, { perfil: 'Desconhecido' as any });

    // Assert
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await expect(promise).rejects.toBeInstanceOf(BadRequestError);
    expect(repoMock.atualizar).not.toHaveBeenCalled();
  });

  // CT14 – NotFoundError quando repo retorna null                     RN18, RF018
  test('CT14 — NotFoundError quando repo.atualizar retorna null (RN18 · RF018)', async () => {
    // Arrange
    repoMock.atualizar.mockResolvedValue(null);

    // Act
    const promise = usuarioService.atualizar(999, { nome: 'X' });

    // Assert
    await expect(promise).rejects.toBeInstanceOf(NotFoundError);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// remover
// ══════════════════════════════════════════════════════════════════════════════
describe('remover', () => {
  // CT15 – sucesso                                                     RN18, RF018
  test('CT15 — sucesso: chama repo.remover com id correto (RN18 · RF018)', async () => {
    // Arrange
    repoMock.remover.mockResolvedValue(true);

    // Act
    await usuarioService.remover(1);

    // Assert
    expect(repoMock.remover).toHaveBeenCalledWith(1);
  });

  // CT16 – NotFoundError quando repo retorna false                    RN18, RF018
  test('CT16 — NotFoundError quando repo.remover retorna false (RN18 · RF018)', async () => {
    // Arrange
    repoMock.remover.mockResolvedValue(false);

    // Act
    const promise = usuarioService.remover(999);

    // Assert
    await expect(promise).rejects.toBeInstanceOf(NotFoundError);
  });
});
