import * as registroService from '../../src/services/registroService';
import * as registroRepo from '../../src/repositories/registroAcompanhamentoRepository';
import * as usuarioRepo from '../../src/repositories/usuarioRepository';
import { validarPerfil } from '../../src/helpers/validarPerfil';
import * as auditoriaService from '../../src/services/auditoriaService';
import { NotFoundError, BadRequestError, ForbiddenError } from '../../src/errors/AppError';
import type { RegistroAcompanhamento } from '../../src/models/registroAcompanhamento';
import type { Usuario } from '../../src/models/usuario';

// Mocks de módulo
jest.mock('../../src/repositories/registroAcompanhamentoRepository');
jest.mock('../../src/repositories/usuarioRepository');
jest.mock('../../src/helpers/validarPerfil');
jest.mock('../../src/services/auditoriaService');

// Referências tipadas aos mocks
const registroRepoMock = jest.mocked(registroRepo);
const usuarioRepoMock = jest.mocked(usuarioRepo);
const validarPerfilMock = jest.mocked(validarPerfil);

// Helpers de fixture
function makeUsuario(overrides: Partial<Usuario> = {}): Usuario {
  return {
    id: 2,
    id_jovem: null,
    nome: 'Beatriz Coordenadora',
    email: 'beatriz@example.com',
    perfil: 'Coordenacao',
    criado_em: new Date('2024-01-01'),
    ...overrides,
  };
}

function makeRegistro(overrides: Partial<RegistroAcompanhamento> = {}): RegistroAcompanhamento {
  return {
    id: 5,
    id_jovem: 10,
    id_autor: 2,
    tipo_registro: 'Atendimento_Equipe',
    visibilidade: 'Publico_Equipe',
    conteudo: 'Acompanhamento realizado com sucesso.',
    data_registro: new Date('2025-01-05'),
    ...overrides,
  };
}

beforeEach(() => {
  jest.clearAllMocks();
  validarPerfilMock.mockResolvedValue(undefined);
});

// Listar
describe('listar', () => {
  // CT01
  test('CT01 — Psicólogo: chama listarPorJovem com apenasPublico=false (RN17 · RF010)', async () => {
    // Arrange
    const psicologo = makeUsuario({ perfil: 'Psicologo' });
    usuarioRepoMock.buscarPorId.mockResolvedValue(psicologo);
    registroRepoMock.listarPorJovem.mockResolvedValue([makeRegistro()]);

    // Act
    await registroService.listar(10, 2);

    // Assert
    expect(registroRepoMock.listarPorJovem).toHaveBeenCalledWith(10, false);
  });

  // CT02
  test('CT02 — Coordenacao: chama listarPorJovem com apenasPublico=true (RN17 · RF010)', async () => {
    // Arrange
    const coordenadora = makeUsuario({ perfil: 'Coordenacao' });
    usuarioRepoMock.buscarPorId.mockResolvedValue(coordenadora);
    registroRepoMock.listarPorJovem.mockResolvedValue([]);

    // Act
    await registroService.listar(10, 2);

    // Assert
    expect(registroRepoMock.listarPorJovem).toHaveBeenCalledWith(10, true);
  });

  // CT03
  test('CT03 — ForbiddenError quando perfil não tem acesso à operação (RN17 · RF010)', async () => {
    // Arrange
    validarPerfilMock.mockRejectedValue(new ForbiddenError('perfil não autorizado'));

    // Act
    const promise = registroService.listar(10, 99);

    // Assert
    await expect(promise).rejects.toBeInstanceOf(ForbiddenError);
    expect(usuarioRepoMock.buscarPorId).not.toHaveBeenCalled();
  });

  // CT04
  test('CT04 — NotFoundError quando usuario retornado pelo repo é null (RN19 · RF010)', async () => {
    // Arrange
    usuarioRepoMock.buscarPorId.mockResolvedValue(null);

    // Act
    const promise = registroService.listar(10, 999);

    // Assert
    await expect(promise).rejects.toBeInstanceOf(NotFoundError);
    expect(registroRepoMock.listarPorJovem).not.toHaveBeenCalled();
  });
});

// Criar
describe('criar', () => {
  // CT05
  test('CT05 — sucesso: Atendimento_Equipe recebe visibilidade Publico_Equipe (RN19 · RF010)', async () => {
    // Arrange
    const registro = makeRegistro({ tipo_registro: 'Atendimento_Equipe', visibilidade: 'Publico_Equipe' });
    registroRepoMock.criar.mockResolvedValue(registro);

    const input = {
      id_autor: 2,
      tipo_registro: 'Atendimento_Equipe' as const,
      conteudo: 'Reunião realizada.',
    };

    // Act
    const resultado = await registroService.criar(10, 2, input);

    // Assert
    expect(resultado.visibilidade).toBe('Publico_Equipe');
    expect(registroRepoMock.criar).toHaveBeenCalledWith(
      10,
      expect.objectContaining({ visibilidade: 'Publico_Equipe' })
    );
  });

  // CT06
  test('CT06 — Acompanhamento_Psicologico: visibilidade forçada para Restrito_Psicologia (RN19 · RF010)', async () => {
    // Arrange
    const registro = makeRegistro({
      tipo_registro: 'Acompanhamento_Psicologico',
      visibilidade: 'Restrito_Psicologia',
    });
    registroRepoMock.criar.mockResolvedValue(registro);

    const input = {
      id_autor: 2,
      tipo_registro: 'Acompanhamento_Psicologico' as const,
      conteudo: 'Sessão de acompanhamento psicológico.',
      visibilidade: 'Publico_Equipe' as const,  // deveria ser sobrescrito
    };

    // Act
    const resultado = await registroService.criar(10, 2, input);

    // Assert
    expect(registroRepoMock.criar).toHaveBeenCalledWith(
      10,
      expect.objectContaining({ visibilidade: 'Restrito_Psicologia' })
    );
    expect(resultado.tipo_registro).toBe('Acompanhamento_Psicologico');
  });

  // CT07
  test('CT07 — BadRequestError quando conteúdo do registro está vazio (RN19 · RF010)', async () => {
    // Arrange
    const input = { id_autor: 2, tipo_registro: 'Mentoria' as const, conteudo: '   ' };

    // Act
    const promise = registroService.criar(10, 2, input);

    // Assert
    await expect(promise).rejects.toBeInstanceOf(BadRequestError);
    expect(registroRepoMock.criar).not.toHaveBeenCalled();
  });

  // CT08
  test('CT08 — auditoriaService.registrar é chamado após criação bem-sucedida (RN19b · RF010)', async () => {
    // Arrange
    const registro = makeRegistro();
    registroRepoMock.criar.mockResolvedValue(registro);

    const input = {
      id_autor: 2,
      tipo_registro: 'Atendimento_Equipe' as const,
      conteudo: 'Conteúdo válido.',
    };

    // Act
    await registroService.criar(10, 2, input);

    // Assert
    expect(auditoriaService.registrar).toHaveBeenCalledWith(
      expect.objectContaining({
        id_usuario: 2,
        id_jovem_afetado: 10,
        tabela_afetada: 'registro_acompanhamento',
      })
    );
  });
});

// Atualizar
describe('atualizar', () => {
  // CT09
  test('CT09 — sucesso: retorna registro atualizado (RN19b · RF010)', async () => {
    // Arrange
    const registroAtual = makeRegistro();
    const registroAtualizado = makeRegistro({ conteudo: 'Conteúdo revisado.' });
    registroRepoMock.buscarPorId.mockResolvedValue(registroAtual);
    registroRepoMock.atualizar.mockResolvedValue(registroAtualizado);

    // Act
    const resultado = await registroService.atualizar(5, 2, { conteudo: 'Conteúdo revisado.' });

    // Assert
    expect(resultado.conteudo).toBe('Conteúdo revisado.');
    expect(registroRepoMock.atualizar).toHaveBeenCalledWith(5, expect.objectContaining({ conteudo: 'Conteúdo revisado.' }));
  });

  // CT10
  test('CT10 — mudança para Acompanhamento_Psicologico força Restrito_Psicologia (RN19 · RF010)', async () => {
    // Arrange
    const registroAtual = makeRegistro({ tipo_registro: 'Atendimento_Equipe' });
    const registroAtualizado = makeRegistro({
      tipo_registro: 'Acompanhamento_Psicologico',
      visibilidade: 'Restrito_Psicologia',
    });
    registroRepoMock.buscarPorId.mockResolvedValue(registroAtual);
    registroRepoMock.atualizar.mockResolvedValue(registroAtualizado);

    // Act
    await registroService.atualizar(5, 2, { tipo_registro: 'Acompanhamento_Psicologico' });

    // Assert
    expect(registroRepoMock.atualizar).toHaveBeenCalledWith(
      5,
      expect.objectContaining({ visibilidade: 'Restrito_Psicologia' })
    );
  });

  // CT11
  test('CT11 — NotFoundError quando registro de acompanhamento não é encontrado (RN19 · RF010)', async () => {
    // Arrange
    registroRepoMock.buscarPorId.mockResolvedValue(null);

    // Act
    const promise = registroService.atualizar(999, 2, { conteudo: 'x' });

    // Assert
    await expect(promise).rejects.toBeInstanceOf(NotFoundError);
    expect(registroRepoMock.atualizar).not.toHaveBeenCalled();
  });

  // CT12
  test('CT12 — NotFoundError quando repo.atualizar retorna null (RN19 · RF010)', async () => {
    // Arrange
    registroRepoMock.buscarPorId.mockResolvedValue(makeRegistro());
    registroRepoMock.atualizar.mockResolvedValue(null);

    // Act
    const promise = registroService.atualizar(5, 2, { conteudo: 'x' });

    // Assert
    await expect(promise).rejects.toBeInstanceOf(NotFoundError);
  });
});

// Verificar acesso
describe('verificarAcesso', () => {
  // CT13
  test('CT13 — ForbiddenError quando registro é Restrito e usuario não é Psicólogo (RN17 · RF010)', async () => {
    // Arrange
    const registroRestrito = makeRegistro({ visibilidade: 'Restrito_Psicologia' });
    const coordenadora = makeUsuario({ perfil: 'Coordenacao' });
    registroRepoMock.buscarPorId.mockResolvedValue(registroRestrito);
    usuarioRepoMock.buscarPorId.mockResolvedValue(coordenadora);

    // Act
    const promise = registroService.verificarAcesso(5, 2);

    // Assert
    await expect(promise).rejects.toBeInstanceOf(ForbiddenError);
  });

  // CT14
  test('CT14 — sucesso quando Psicólogo acessa registro Restrito_Psicologia (RN17 · RF010)', async () => {
    // Arrange
    const registroRestrito = makeRegistro({ visibilidade: 'Restrito_Psicologia' });
    const psicologo = makeUsuario({ perfil: 'Psicologo' });
    registroRepoMock.buscarPorId.mockResolvedValue(registroRestrito);
    usuarioRepoMock.buscarPorId.mockResolvedValue(psicologo);

    // Act
    const resultado = await registroService.verificarAcesso(5, 2);

    // Assert
    expect(resultado).toEqual(registroRestrito);
  });

  // CT15
  test('CT15 — NotFoundError quando registro não é encontrado (RN19 · RF010)', async () => {
    // Arrange
    registroRepoMock.buscarPorId.mockResolvedValue(null);

    // Act
    const promise = registroService.verificarAcesso(999, 2);

    // Assert
    await expect(promise).rejects.toBeInstanceOf(NotFoundError);
  });
});
