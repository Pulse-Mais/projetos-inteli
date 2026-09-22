/**
 * tests/mentoriaService.test.ts
 * Testes unitários de mentoriaService.
 *
 * Estratégia de isolamento: sessaoMentoriaRepository e validarPerfil são
 * substituídos por mocks via jest.mock. Nenhum teste toca o banco real.
 */

import * as mentoriaService from '../../src/services/mentoriaService';
import * as sessaoRepo from '../../src/repositories/sessaoMentoriaRepository';
import * as validarPerfilHelper from '../../src/helpers/validarPerfil';
import { NotFoundError, ForbiddenError } from '../../src/errors/AppError';
import type { SessaoMentoria } from '../../src/models/sessaoMentoria';

// ── Mocks de módulo ────────────────────────────────────────────────────────────
jest.mock('../../src/repositories/sessaoMentoriaRepository');
jest.mock('../../src/helpers/validarPerfil');

// ── Referências tipadas aos mocks ─────────────────────────────────────────────
const sessaoMock = jest.mocked(sessaoRepo);
const validarPerfilMock = jest.mocked(validarPerfilHelper);

// ── Fixture ───────────────────────────────────────────────────────────────────
function makeSessao(overrides: Partial<SessaoMentoria> = {}): SessaoMentoria {
  return {
    id: 1,
    id_jovem: 5,
    id_mentor: 2,
    data: new Date('2025-04-10'),
    presente: true,
    ...overrides,
  };
}

beforeEach(() => {
  jest.clearAllMocks();
});

// ══════════════════════════════════════════════════════════════════════════════
// listarPorMentor
// ══════════════════════════════════════════════════════════════════════════════
describe('listarPorMentor', () => {
  test('sucesso: retorna sessões do mentor', async () => {
    // Arrange
    const sessoes = [makeSessao(), makeSessao({ id: 2, data: new Date('2025-05-01') })];
    sessaoMock.buscarPorMentor.mockResolvedValue(sessoes);

    // Act
    const resultado = await mentoriaService.listarPorMentor(2);

    // Assert
    expect(resultado).toEqual(sessoes);
    expect(sessaoMock.buscarPorMentor).toHaveBeenCalledWith(2);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// criarSessao
// ══════════════════════════════════════════════════════════════════════════════
describe('criarSessao', () => {
  const dadosSessao = {
    id_jovem: 5,
    id_mentor: 2,
    data: new Date('2025-04-10'),
    presente: true,
  };

  // CT-PM13 — sucesso (perfil Mentor)                                    RN25, RF019
  test('CT-PM13 — sucesso: Mentor válido cria sessão; sessaoRepo.criar chamado com os dados corretos (RN25 · RF019)', async () => {
    // Arrange
    validarPerfilMock.validarPerfil.mockResolvedValue(undefined);
    const sessaoCriada = makeSessao();
    sessaoMock.criar.mockResolvedValue(sessaoCriada);

    // Act
    const resultado = await mentoriaService.criarSessao(dadosSessao, 2);

    // Assert
    expect(resultado).toEqual(sessaoCriada);
    expect(validarPerfilMock.validarPerfil).toHaveBeenCalledWith(2, ['Mentor']);
    expect(sessaoMock.criar).toHaveBeenCalledWith(dadosSessao);
  });

  // CT-PM12 — falha (Forbidden) perfil não-Mentor                       RN25, RF019
  test('CT-PM12 — falha: perfil não-Mentor lança ForbiddenError; sessaoRepo.criar não é chamado (RN25 · RF019)', async () => {
    // Arrange
    validarPerfilMock.validarPerfil.mockRejectedValue(
      new ForbiddenError('perfil Coordenacao não autorizado para esta operação')
    );

    // Act / Assert
    await expect(
      mentoriaService.criarSessao(dadosSessao, 99)
    ).rejects.toBeInstanceOf(ForbiddenError);
    expect(sessaoMock.criar).not.toHaveBeenCalled();
  });

  // falha (NotFound) usuário inexistente
  test('falha: usuário inexistente lança NotFoundError propagado por validarPerfil', async () => {
    // Arrange
    validarPerfilMock.validarPerfil.mockRejectedValue(new NotFoundError('usuário'));

    // Act / Assert
    await expect(
      mentoriaService.criarSessao(dadosSessao, 999)
    ).rejects.toBeInstanceOf(NotFoundError);
    expect(sessaoMock.criar).not.toHaveBeenCalled();
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// atualizarSessao
// ══════════════════════════════════════════════════════════════════════════════
describe('atualizarSessao', () => {
  const dadosAtualizacao = { presente: false };

  // sucesso                                                               RN25, RF019
  test('sucesso: Mentor válido atualiza sessão existente (RN25 · RF019)', async () => {
    // Arrange
    validarPerfilMock.validarPerfil.mockResolvedValue(undefined);
    sessaoMock.buscarPorId.mockResolvedValue(makeSessao());
    const atualizada = makeSessao({ presente: false });
    sessaoMock.atualizar.mockResolvedValue(atualizada);

    // Act
    const resultado = await mentoriaService.atualizarSessao(1, dadosAtualizacao, 2);

    // Assert
    expect(resultado).toEqual(atualizada);
    expect(validarPerfilMock.validarPerfil).toHaveBeenCalledWith(2, ['Mentor']);
    expect(sessaoMock.buscarPorId).toHaveBeenCalledWith(1);
    expect(sessaoMock.atualizar).toHaveBeenCalledWith(1, dadosAtualizacao);
  });

  // CT-PM15 — falha (Forbidden) perfil não-Mentor                       RN25, RF019
  test('CT-PM15 — falha: perfil não-Mentor lança ForbiddenError antes de consultar o repo (RN25 · RF019)', async () => {
    // Arrange
    validarPerfilMock.validarPerfil.mockRejectedValue(
      new ForbiddenError('perfil não autorizado')
    );

    // Act / Assert
    await expect(
      mentoriaService.atualizarSessao(1, dadosAtualizacao, 99)
    ).rejects.toBeInstanceOf(ForbiddenError);
    expect(sessaoMock.buscarPorId).not.toHaveBeenCalled();
    expect(sessaoMock.atualizar).not.toHaveBeenCalled();
  });

  // CT-PM14 — falha (NotFound) sessão inexistente                       RN25, RF019
  test('CT-PM14 — falha: sessão inexistente lança NotFoundError; sessaoRepo.atualizar não é chamado (RN25 · RF019)', async () => {
    // Arrange
    validarPerfilMock.validarPerfil.mockResolvedValue(undefined);
    sessaoMock.buscarPorId.mockResolvedValue(null);

    // Act / Assert
    await expect(
      mentoriaService.atualizarSessao(999, dadosAtualizacao, 2)
    ).rejects.toBeInstanceOf(NotFoundError);
    expect(sessaoMock.atualizar).not.toHaveBeenCalled();
  });

  // falha (NotFound) atualizar retorna null
  test('falha: sessaoRepo.atualizar retornando null lança NotFoundError', async () => {
    // Arrange
    validarPerfilMock.validarPerfil.mockResolvedValue(undefined);
    sessaoMock.buscarPorId.mockResolvedValue(makeSessao());
    sessaoMock.atualizar.mockResolvedValue(null);

    // Act / Assert
    await expect(
      mentoriaService.atualizarSessao(1, dadosAtualizacao, 2)
    ).rejects.toBeInstanceOf(NotFoundError);
  });
});
