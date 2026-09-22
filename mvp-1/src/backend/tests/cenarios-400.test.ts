/**
 * Cenarios de falha de validacao (HTTP 400 / BadRequestError).
 *
 * Cobertura: testa que cada service da camada de regras de negocio
 * lanca BadRequestError nos cenarios de input invalido descritos pelas
 * regras de negocio (RN03, RN04, RN08, RN09, RN10, RN12).
 *
 * Atua na camada de SERVICE com mocks dos repositorios para garantir:
 *   - Independencia de banco/rede (determinismo)
 *   - Foco no caminho de validacao (nao testa I/O)
 *   - Contribuicao para a cobertura >= 80% da camada Service
 *
 * Veja src/tests/README.md para a convencao de testes.
 */

// jest.mock e hoisted ao topo do arquivo antes dos imports.
jest.mock('../repositories/programaRepository');
jest.mock('../repositories/avaliacaoRepository');
jest.mock('../repositories/atividadeRepository');
jest.mock('../repositories/indicadorRepository');
jest.mock('../repositories/mentoriaRepository');
jest.mock('../repositories/mentorRepository');
jest.mock('../repositories/alunoRepository');
jest.mock('../repositories/entregaRepository');
jest.mock('../repositories/acompanhaRepository');
jest.mock('../repositories/usuarioRepository');

import * as programaSvc from '../services/programaService';
import * as avaliacaoSvc from '../services/avaliacaoService';
import * as atividadeSvc from '../services/atividadeService';
import * as indicadorSvc from '../services/indicadorService';
import * as mentoriaSvc from '../services/mentoriaService';
import * as acompanhaSvc from '../services/acompanhaService';
import * as entregaSvc from '../services/entregaService';
import * as importacaoSvc from '../services/importacaoService';
import * as alunoSvc from '../services/alunoService';
import * as usuarioSvc from '../services/usuarioService';

import * as programaRepo from '../repositories/programaRepository';
import * as avaliacaoRepo from '../repositories/avaliacaoRepository';
import * as mentorRepo from '../repositories/mentorRepository';
import * as alunoRepo from '../repositories/alunoRepository';
import * as indicadorRepo from '../repositories/indicadorRepository';
import * as usuarioRepo from '../repositories/usuarioRepository';

import { BadRequestError } from '../errors/AppError';

// Helper tipado para evitar repeticao de cast em cada mockResolvedValue.
const mocked = <T extends (...args: any[]) => any>(fn: T) =>
  fn as jest.MockedFunction<T>;

describe('Cenarios 400 — falha de validacao / regra de negocio violada', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // --------------------------------------------------------------------------
  // PROGRAMAS
  // --------------------------------------------------------------------------
  describe('POST /programas (programaService.criarPrograma)', () => {
    it('rejeita quando data fim e anterior a data de inicio', async () => {
      await expect(
        programaSvc.criarPrograma({
          titulo: 'Programa X',
          inicio: '2026-12-31',
          fim: '2026-01-01',
        } as any),
      ).rejects.toThrow(BadRequestError);
    });
  });

  describe('PUT /programas/:id (programaService.atualizarPrograma)', () => {
    it('rejeita quando o periodo mesclado ficaria invertido', async () => {
      mocked(programaRepo.findById).mockResolvedValue({
        id_programa: 1,
        titulo: 'Existente',
        inicio: '2026-01-01',
        fim: '2026-12-31',
      });
      await expect(
        programaSvc.atualizarPrograma(1, {
          inicio: '2026-12-31',
          fim: '2026-01-01',
        } as any),
      ).rejects.toThrow(BadRequestError);
    });
  });

  // --------------------------------------------------------------------------
  // AVALIACOES (RN10)
  // --------------------------------------------------------------------------
  describe('POST /avaliacoes (avaliacaoService.criarAvaliacao) — RN10', () => {
    it.each([0, 6, -1, 100])(
      'rejeita criacao com nota = %i (fora do intervalo 1-5)',
      async (nota) => {
        await expect(
          avaliacaoSvc.criarAvaliacao({
            nota,
            data_avaliacao: '2026-01-01',
            id_indicador: 1,
            id_aluno: 1,
          } as any),
        ).rejects.toThrow(BadRequestError);
      },
    );
  });

  describe('PUT /avaliacoes/:id (avaliacaoService.atualizarAvaliacao) — RN10', () => {
    it('rejeita atualizacao com nota fora do intervalo 1-5', async () => {
      mocked(avaliacaoRepo.findById).mockResolvedValue({
        id_avaliacao: 1,
        nota: 4,
        data_avaliacao: '2026-01-01',
        id_indicador: 1,
        id_aluno: 1,
      } as any);
      await expect(
        avaliacaoSvc.atualizarAvaliacao(1, { nota: 0 } as any),
      ).rejects.toThrow(BadRequestError);
    });
  });

  // --------------------------------------------------------------------------
  // ATIVIDADES (RN03)
  // --------------------------------------------------------------------------
  describe('POST /atividades (atividadeService.criarAtividade) — RN03', () => {
    it('rejeita quando o programa informado nao existe', async () => {
      mocked(programaRepo.findById).mockResolvedValue(null);
      await expect(
        atividadeSvc.criarAtividade({
          titulo: 'Atividade A',
          status: 'aberta',
          id_programa: 999,
        } as any),
      ).rejects.toThrow(BadRequestError);
    });
  });

  // --------------------------------------------------------------------------
  // INDICADORES (RN03)
  // --------------------------------------------------------------------------
  describe('POST /indicadores (indicadorService.criarIndicador) — RN03', () => {
    it('rejeita quando o programa informado nao existe', async () => {
      mocked(programaRepo.findById).mockResolvedValue(null);
      await expect(
        indicadorSvc.criarIndicador({
          nome: 'Indicador X',
          id_programa: 999,
        } as any),
      ).rejects.toThrow(BadRequestError);
    });
  });

  describe('PUT /indicadores/:id (indicadorService.atualizarIndicador) — RN03', () => {
    it('rejeita quando se altera id_programa para um programa inexistente', async () => {
      mocked(indicadorRepo.findById).mockResolvedValue({
        id_indicador: 1,
        nome: 'X',
        id_programa: 1,
      } as any);
      mocked(programaRepo.findById).mockResolvedValue(null);
      await expect(
        indicadorSvc.atualizarIndicador(1, { id_programa: 999 } as any),
      ).rejects.toThrow(BadRequestError);
    });
  });

  // --------------------------------------------------------------------------
  // MENTORIAS (RN12)
  // --------------------------------------------------------------------------
  describe('POST /mentorias (mentoriaService.criarMentoria) — RN12', () => {
    const dadosBase = {
      formato: 'online',
      tema: 'Carreira',
      duracao: 60,
      data: '2026-06-01T10:00:00Z',
      id_mentor: 1,
      id_aluno: 1,
    } as any;

    it('rejeita quando o mentor existe mas esta inativo', async () => {
      mocked(mentorRepo.findByIdIncludeInactive).mockResolvedValue({
        id_usuario: 1,
        ativo: false,
      } as any);
      await expect(mentoriaSvc.criarMentoria(dadosBase)).rejects.toThrow(
        BadRequestError,
      );
    });

    it('rejeita quando o mentor esta ativo mas o aluno esta inativo', async () => {
      mocked(mentorRepo.findByIdIncludeInactive).mockResolvedValue({
        id_usuario: 1,
        ativo: true,
      } as any);
      mocked(alunoRepo.findByIdIncludeInactive).mockResolvedValue({
        id_usuario: 1,
        ativo: false,
      } as any);
      await expect(mentoriaSvc.criarMentoria(dadosBase)).rejects.toThrow(
        BadRequestError,
      );
    });
  });

  // --------------------------------------------------------------------------
  // ACOMPANHA
  // --------------------------------------------------------------------------
  describe('POST /acompanha (acompanhaService.criarAcompanha)', () => {
    const dadosBase = { id_mentor: 1, id_aluno: 1, id_programa: 1 } as any;

    it('rejeita quando o mentor esta inativo', async () => {
      mocked(mentorRepo.findByIdIncludeInactive).mockResolvedValue({
        id_usuario: 1,
        ativo: false,
      } as any);
      await expect(acompanhaSvc.criarAcompanha(dadosBase)).rejects.toThrow(
        BadRequestError,
      );
    });

    it('rejeita quando o aluno esta inativo', async () => {
      mocked(mentorRepo.findByIdIncludeInactive).mockResolvedValue({
        id_usuario: 1,
        ativo: true,
      } as any);
      mocked(alunoRepo.findById).mockResolvedValue({
        id_usuario: 1,
        ativo: false,
      } as any);
      await expect(acompanhaSvc.criarAcompanha(dadosBase)).rejects.toThrow(
        BadRequestError,
      );
    });
  });

  // --------------------------------------------------------------------------
  // ENTREGAS (RN04)
  // --------------------------------------------------------------------------
  describe('POST /alunos/:id/entregas (entregaService.registrarEntrega) — RN04', () => {
    it('rejeita quando data_entrega e futura', async () => {
      mocked(alunoRepo.findById).mockResolvedValue({
        id_usuario: 1,
        ativo: true,
      } as any);
      const futuroLongo = '2099-12-31';
      await expect(
        entregaSvc.registrarEntrega({
          id_aluno: 1,
          id_atividade: 1,
          data_entrega: futuroLongo,
        } as any),
      ).rejects.toThrow(BadRequestError);
    });
  });

  // --------------------------------------------------------------------------
  // IMPORTACAO (RN08)
  // --------------------------------------------------------------------------
  describe('POST /importacao/alunos (importacaoService.importarAlunos) — RN08', () => {
    it('rejeita arquivo com mimetype e extensao desconhecidos', async () => {
      const buffer = Buffer.from('conteudo qualquer');
      await expect(
        importacaoSvc.importarAlunos(buffer, 'application/json', 'arquivo.json'),
      ).rejects.toThrow(BadRequestError);
    });
  });

  // --------------------------------------------------------------------------
  // ALUNO PORTAL (RN09)
  // --------------------------------------------------------------------------
  describe('PUT /alunos/:id/portal (alunoService.atualizarPortalAluno) — RN09', () => {
    it('rejeita quando nenhum campo e enviado', async () => {
      await expect(alunoSvc.atualizarPortalAluno(1, {})).rejects.toThrow(
        BadRequestError,
      );
    });

    it.each([
      ['nome', { nome: '' }],
      ['email', { email: '' }],
      ['cpf', { cpf: '' }],
      ['senha', { senha: '' }],
    ])('rejeita quando %s e enviado como string vazia', async (_label, payload) => {
      await expect(
        alunoSvc.atualizarPortalAluno(1, payload as any),
      ).rejects.toThrow(BadRequestError);
    });
  });

  // --------------------------------------------------------------------------
  // USUARIO — atualizacao com CPF/email ja em uso (mensagem BadRequest)
  // --------------------------------------------------------------------------
  describe('PUT /usuarios/:id (usuarioService.atualizarUsuario)', () => {
    it('rejeita quando CPF ja esta cadastrado em outro usuario', async () => {
      mocked(usuarioRepo.findByCpf).mockResolvedValue({
        id_usuario: 2,
        nome: 'outro',
        email: 'outro@x',
        senha: 'h',
        cpf: '11122233344',
      } as any);
      await expect(
        usuarioSvc.atualizarUsuario(1, { cpf: '11122233344' } as any),
      ).rejects.toThrow(BadRequestError);
    });

    it('rejeita quando email ja esta cadastrado em outro usuario', async () => {
      mocked(usuarioRepo.findByEmail).mockResolvedValue({
        id_usuario: 2,
        nome: 'outro',
        email: 'duplicado@x',
        senha: 'h',
        cpf: '99988877766',
      } as any);
      await expect(
        usuarioSvc.atualizarUsuario(1, { email: 'duplicado@x' } as any),
      ).rejects.toThrow(BadRequestError);
    });
  });
});
