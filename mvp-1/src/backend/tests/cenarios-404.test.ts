/**
 * Cenarios de recurso nao encontrado (HTTP 404 / NotFoundError).
 *
 * Cobertura: testa que cada service da camada de regras de negocio
 * lanca NotFoundError quando o recurso solicitado nao existe.
 * Engloba todos os endpoints principais (CRUDs) e relacionamentos
 * que validam a existencia de recursos referenciados.
 *
 * Atua na camada de SERVICE com mocks dos repositorios para garantir:
 *   - Independencia de banco/rede (determinismo)
 *   - Foco no caminho do "nao encontrado" (cada repo retornando null)
 *   - Contribuicao para a cobertura >= 80% da camada Service
 *
 * Veja src/tests/README.md para a convencao de testes.
 */

jest.mock('../repositories/usuarioRepository');
jest.mock('../repositories/alunoRepository');
jest.mock('../repositories/mentorRepository');
jest.mock('../repositories/mentoriaRepository');
jest.mock('../repositories/programaRepository');
jest.mock('../repositories/avaliacaoRepository');
jest.mock('../repositories/atividadeRepository');
jest.mock('../repositories/indicadorRepository');
jest.mock('../repositories/entregaRepository');
jest.mock('../repositories/acompanhaRepository');

import * as usuarioSvc from '../services/usuarioService';
import * as alunoSvc from '../services/alunoService';
import * as mentorSvc from '../services/mentorService';
import * as mentoriaSvc from '../services/mentoriaService';
import * as programaSvc from '../services/programaService';
import * as avaliacaoSvc from '../services/avaliacaoService';
import * as atividadeSvc from '../services/atividadeService';
import * as indicadorSvc from '../services/indicadorService';
import * as entregaSvc from '../services/entregaService';
import * as acompanhaSvc from '../services/acompanhaService';

import * as usuarioRepo from '../repositories/usuarioRepository';
import * as alunoRepo from '../repositories/alunoRepository';
import * as mentorRepo from '../repositories/mentorRepository';
import * as mentoriaRepo from '../repositories/mentoriaRepository';
import * as programaRepo from '../repositories/programaRepository';
import * as avaliacaoRepo from '../repositories/avaliacaoRepository';
import * as atividadeRepo from '../repositories/atividadeRepository';
import * as indicadorRepo from '../repositories/indicadorRepository';
import * as entregaRepo from '../repositories/entregaRepository';

import { NotFoundError } from '../errors/AppError';

// Helper tipado para evitar repeticao de cast em cada mockResolvedValue.
const mocked = <T extends (...args: any[]) => any>(fn: T) =>
  fn as jest.MockedFunction<T>;

const ID_INEXISTENTE = 999_999;

describe('Cenarios 404 — recurso nao encontrado', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // --------------------------------------------------------------------------
  // USUARIOS
  // --------------------------------------------------------------------------
  describe('/usuarios (usuarioService)', () => {
    it('GET /usuarios/:id lanca NotFoundError quando id nao existe', async () => {
      mocked(usuarioRepo.findById).mockResolvedValue(null);
      await expect(usuarioSvc.buscarUsuario(ID_INEXISTENTE)).rejects.toThrow(
        NotFoundError,
      );
    });

    it('PUT /usuarios/:id lanca NotFoundError quando id nao existe', async () => {
      mocked(usuarioRepo.findByCpf).mockResolvedValue(null);
      mocked(usuarioRepo.findByEmail).mockResolvedValue(null);
      mocked(usuarioRepo.update).mockResolvedValue(null);
      await expect(
        usuarioSvc.atualizarUsuario(ID_INEXISTENTE, { nome: 'X' } as any),
      ).rejects.toThrow(NotFoundError);
    });

    it('DELETE /usuarios/:id lanca NotFoundError quando id nao existe', async () => {
      mocked(usuarioRepo.remove).mockResolvedValue(false);
      await expect(usuarioSvc.deletarUsuario(ID_INEXISTENTE)).rejects.toThrow(
        NotFoundError,
      );
    });

    it('atualizarDadosPessoais lanca NotFoundError quando id nao existe', async () => {
      mocked(usuarioRepo.update).mockResolvedValue(null);
      await expect(
        usuarioSvc.atualizarDadosPessoais(ID_INEXISTENTE, { nome: 'Y' } as any),
      ).rejects.toThrow(NotFoundError);
    });
  });

  // --------------------------------------------------------------------------
  // ALUNOS
  // --------------------------------------------------------------------------
  describe('/alunos (alunoService)', () => {
    it('GET /alunos/:id lanca NotFoundError quando id nao existe', async () => {
      mocked(alunoRepo.findById).mockResolvedValue(null);
      await expect(alunoSvc.buscarAluno(ID_INEXISTENTE)).rejects.toThrow(
        NotFoundError,
      );
    });

    it('PUT /alunos/:id lanca NotFoundError quando id nao existe', async () => {
      mocked(alunoRepo.update).mockResolvedValue(null);
      await expect(
        alunoSvc.atualizarAluno(ID_INEXISTENTE, { ativo: true } as any),
      ).rejects.toThrow(NotFoundError);
    });

    it('PATCH /alunos/:id/tornar-ex-aluno lanca NotFoundError quando id nao existe', async () => {
      mocked(alunoRepo.inactivate).mockResolvedValue(false);
      await expect(alunoSvc.tornarExAluno(ID_INEXISTENTE)).rejects.toThrow(
        NotFoundError,
      );
    });

    it('DELETE /alunos/:id lanca NotFoundError quando id nao existe', async () => {
      mocked(alunoRepo.hardDelete).mockResolvedValue(false);
      await expect(alunoSvc.excluirAlunoPermanentemente(ID_INEXISTENTE)).rejects.toThrow(
        NotFoundError,
      );
    });

    it('GET /alunos/:id/perfil lanca NotFoundError quando aluno nao existe', async () => {
      mocked(alunoRepo.findPerfilById).mockResolvedValue(null);
      await expect(
        alunoSvc.buscarPerfilAluno(ID_INEXISTENTE),
      ).rejects.toThrow(NotFoundError);
    });

    it('PUT /alunos/:id/portal lanca NotFoundError quando aluno nao existe ou esta inativo', async () => {
      mocked(alunoRepo.findById).mockResolvedValue(null);
      await expect(
        alunoSvc.atualizarPortalAluno(ID_INEXISTENTE, { nome: 'Y' } as any),
      ).rejects.toThrow(NotFoundError);
    });
  });

  // --------------------------------------------------------------------------
  // MENTORES
  // --------------------------------------------------------------------------
  describe('/mentores (mentorService)', () => {
    it('GET /mentores/:id lanca NotFoundError quando id nao existe', async () => {
      mocked(mentorRepo.findById).mockResolvedValue(null);
      await expect(mentorSvc.buscarMentor(ID_INEXISTENTE)).rejects.toThrow(
        NotFoundError,
      );
    });

    it('PUT /mentores/:id lanca NotFoundError quando id nao existe', async () => {
      mocked(mentorRepo.findById).mockResolvedValue(null);
      await expect(
        mentorSvc.atualizarMentor(ID_INEXISTENTE, {} as any),
      ).rejects.toThrow(NotFoundError);
    });

    it('DELETE /mentores/:id (inativar) lanca NotFoundError quando id nao existe', async () => {
      mocked(mentorRepo.findByIdIncludeInactive).mockResolvedValue(null);
      await expect(mentorSvc.inativarMentor(ID_INEXISTENTE)).rejects.toThrow(
        NotFoundError,
      );
    });

    it('GET /mentores/:id/mentorandos lanca NotFoundError quando mentor nao existe', async () => {
      mocked(mentorRepo.findById).mockResolvedValue(null);
      await expect(
        mentorSvc.listarMentorandos(ID_INEXISTENTE),
      ).rejects.toThrow(NotFoundError);
    });
  });

  // --------------------------------------------------------------------------
  // MENTORIAS
  // --------------------------------------------------------------------------
  describe('/mentorias (mentoriaService)', () => {
    it('GET /mentorias/:id lanca NotFoundError quando id nao existe', async () => {
      mocked(mentoriaRepo.findById).mockResolvedValue(null);
      await expect(
        mentoriaSvc.buscarMentoria(ID_INEXISTENTE),
      ).rejects.toThrow(NotFoundError);
    });

    it('PUT /mentorias/:id lanca NotFoundError quando id nao existe', async () => {
      mocked(mentoriaRepo.update).mockResolvedValue(null);
      await expect(
        mentoriaSvc.atualizarMentoria(ID_INEXISTENTE, {} as any),
      ).rejects.toThrow(NotFoundError);
    });

    it('DELETE /mentorias/:id lanca NotFoundError quando id nao existe', async () => {
      mocked(mentoriaRepo.remove).mockResolvedValue(false);
      await expect(
        mentoriaSvc.deletarMentoria(ID_INEXISTENTE),
      ).rejects.toThrow(NotFoundError);
    });

    it('POST /mentorias lanca NotFoundError quando mentor nao existe', async () => {
      mocked(mentorRepo.findByIdIncludeInactive).mockResolvedValue(null);
      await expect(
        mentoriaSvc.criarMentoria({
          formato: 'online',
          tema: 't',
          duracao: 60,
          data: '2026-06-01T10:00:00Z',
          id_mentor: ID_INEXISTENTE,
          id_aluno: 1,
        } as any),
      ).rejects.toThrow(NotFoundError);
    });

    it('POST /mentorias lanca NotFoundError quando aluno nao existe', async () => {
      mocked(mentorRepo.findByIdIncludeInactive).mockResolvedValue({
        id_usuario: 1,
        ativo: true,
      } as any);
      mocked(alunoRepo.findByIdIncludeInactive).mockResolvedValue(null);
      await expect(
        mentoriaSvc.criarMentoria({
          formato: 'online',
          tema: 't',
          duracao: 60,
          data: '2026-06-01T10:00:00Z',
          id_mentor: 1,
          id_aluno: ID_INEXISTENTE,
        } as any),
      ).rejects.toThrow(NotFoundError);
    });
  });

  // --------------------------------------------------------------------------
  // PROGRAMAS
  // --------------------------------------------------------------------------
  describe('/programas (programaService)', () => {
    it('GET /programas/:id lanca NotFoundError quando id nao existe', async () => {
      mocked(programaRepo.findById).mockResolvedValue(null);
      await expect(
        programaSvc.buscarPrograma(ID_INEXISTENTE),
      ).rejects.toThrow(NotFoundError);
    });

    it('PUT /programas/:id lanca NotFoundError quando id nao existe', async () => {
      mocked(programaRepo.findById).mockResolvedValue(null);
      await expect(
        programaSvc.atualizarPrograma(ID_INEXISTENTE, {} as any),
      ).rejects.toThrow(NotFoundError);
    });

    it('DELETE /programas/:id lanca NotFoundError quando id nao existe', async () => {
      mocked(programaRepo.remove).mockResolvedValue(false);
      await expect(
        programaSvc.deletarPrograma(ID_INEXISTENTE),
      ).rejects.toThrow(NotFoundError);
    });
  });

  // --------------------------------------------------------------------------
  // AVALIACOES
  // --------------------------------------------------------------------------
  describe('/avaliacoes (avaliacaoService)', () => {
    it('GET /avaliacoes/:id lanca NotFoundError quando id nao existe', async () => {
      mocked(avaliacaoRepo.findById).mockResolvedValue(null);
      await expect(
        avaliacaoSvc.buscarAvaliacao(ID_INEXISTENTE),
      ).rejects.toThrow(NotFoundError);
    });

    it('PUT /avaliacoes/:id lanca NotFoundError quando id nao existe', async () => {
      mocked(avaliacaoRepo.findById).mockResolvedValue(null);
      await expect(
        avaliacaoSvc.atualizarAvaliacao(ID_INEXISTENTE, { nota: 4 } as any),
      ).rejects.toThrow(NotFoundError);
    });

    it('DELETE /avaliacoes/:id lanca NotFoundError quando id nao existe', async () => {
      mocked(avaliacaoRepo.remove).mockResolvedValue(false);
      await expect(
        avaliacaoSvc.deletarAvaliacao(ID_INEXISTENTE),
      ).rejects.toThrow(NotFoundError);
    });
  });

  // --------------------------------------------------------------------------
  // ATIVIDADES
  // --------------------------------------------------------------------------
  describe('/atividades (atividadeService)', () => {
    it('GET /atividades/:id lanca NotFoundError quando id nao existe', async () => {
      mocked(atividadeRepo.findById).mockResolvedValue(null);
      await expect(
        atividadeSvc.buscarAtividade(ID_INEXISTENTE),
      ).rejects.toThrow(NotFoundError);
    });

    it('PUT /atividades/:id lanca NotFoundError quando id nao existe', async () => {
      mocked(atividadeRepo.findById).mockResolvedValue(null);
      await expect(
        atividadeSvc.atualizarAtividade(ID_INEXISTENTE, {} as any),
      ).rejects.toThrow(NotFoundError);
    });

    it('DELETE /atividades/:id lanca NotFoundError quando id nao existe', async () => {
      mocked(atividadeRepo.remove).mockResolvedValue(false);
      await expect(
        atividadeSvc.deletarAtividade(ID_INEXISTENTE),
      ).rejects.toThrow(NotFoundError);
    });
  });

  // --------------------------------------------------------------------------
  // INDICADORES
  // --------------------------------------------------------------------------
  describe('/indicadores (indicadorService)', () => {
    it('GET /indicadores/:id lanca NotFoundError quando id nao existe', async () => {
      mocked(indicadorRepo.findById).mockResolvedValue(null);
      await expect(
        indicadorSvc.buscarIndicador(ID_INEXISTENTE),
      ).rejects.toThrow(NotFoundError);
    });

    it('PUT /indicadores/:id lanca NotFoundError quando id nao existe', async () => {
      mocked(indicadorRepo.findById).mockResolvedValue(null);
      await expect(
        indicadorSvc.atualizarIndicador(ID_INEXISTENTE, {} as any),
      ).rejects.toThrow(NotFoundError);
    });

    it('DELETE /indicadores/:id lanca NotFoundError quando id nao existe', async () => {
      mocked(indicadorRepo.remove).mockResolvedValue(false);
      await expect(
        indicadorSvc.deletarIndicador(ID_INEXISTENTE),
      ).rejects.toThrow(NotFoundError);
    });
  });

  // --------------------------------------------------------------------------
  // ENTREGAS
  // --------------------------------------------------------------------------
  describe('/alunos/:id/entregas (entregaService)', () => {
    it('GET /alunos/:id/entregas lanca NotFoundError quando aluno nao existe', async () => {
      mocked(alunoRepo.findById).mockResolvedValue(null);
      await expect(
        entregaSvc.listarEntregas(ID_INEXISTENTE),
      ).rejects.toThrow(NotFoundError);
    });

    it('POST /alunos/:id/entregas lanca NotFoundError quando aluno nao existe', async () => {
      mocked(alunoRepo.findById).mockResolvedValue(null);
      await expect(
        entregaSvc.registrarEntrega({
          id_aluno: ID_INEXISTENTE,
          id_atividade: 1,
          data_entrega: '2026-01-01',
        } as any),
      ).rejects.toThrow(NotFoundError);
    });

    it('PUT entrega lanca NotFoundError quando o vinculo aluno+atividade nao existe', async () => {
      mocked(alunoRepo.findById).mockResolvedValue({
        id_usuario: 1,
        ativo: true,
      } as any);
      mocked(entregaRepo.update).mockResolvedValue(null);
      await expect(
        entregaSvc.atualizarEntrega(1, ID_INEXISTENTE, {} as any),
      ).rejects.toThrow(NotFoundError);
    });

    it('DELETE entrega lanca NotFoundError quando o vinculo aluno+atividade nao existe', async () => {
      mocked(alunoRepo.findById).mockResolvedValue({
        id_usuario: 1,
        ativo: true,
      } as any);
      mocked(entregaRepo.remove).mockResolvedValue(false);
      await expect(
        entregaSvc.removerEntrega(1, ID_INEXISTENTE),
      ).rejects.toThrow(NotFoundError);
    });
  });

  // --------------------------------------------------------------------------
  // ACOMPANHA
  // --------------------------------------------------------------------------
  describe('POST /acompanha (acompanhaService.criarAcompanha)', () => {
    it('lanca NotFoundError quando mentor nao existe', async () => {
      mocked(mentorRepo.findByIdIncludeInactive).mockResolvedValue(null);
      await expect(
        acompanhaSvc.criarAcompanha({
          id_mentor: ID_INEXISTENTE,
          id_aluno: 1,
          id_programa: 1,
        } as any),
      ).rejects.toThrow(NotFoundError);
    });

    it('lanca NotFoundError quando aluno nao existe', async () => {
      mocked(mentorRepo.findByIdIncludeInactive).mockResolvedValue({
        id_usuario: 1,
        ativo: true,
      } as any);
      mocked(alunoRepo.findById).mockResolvedValue(null);
      await expect(
        acompanhaSvc.criarAcompanha({
          id_mentor: 1,
          id_aluno: ID_INEXISTENTE,
          id_programa: 1,
        } as any),
      ).rejects.toThrow(NotFoundError);
    });

    it('lanca NotFoundError quando programa nao existe', async () => {
      mocked(mentorRepo.findByIdIncludeInactive).mockResolvedValue({
        id_usuario: 1,
        ativo: true,
      } as any);
      mocked(alunoRepo.findById).mockResolvedValue({
        id_usuario: 1,
        ativo: true,
      } as any);
      mocked(programaRepo.findById).mockResolvedValue(null);
      await expect(
        acompanhaSvc.criarAcompanha({
          id_mentor: 1,
          id_aluno: 1,
          id_programa: ID_INEXISTENTE,
        } as any),
      ).rejects.toThrow(NotFoundError);
    });
  });
});
