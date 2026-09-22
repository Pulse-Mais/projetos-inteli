/**
 * Cenarios de regra de negocio violada (HTTP 409 / ConflictError) e
 * equivalentes (HTTP 207 / importacao parcial).
 *
 * Cobertura: testa que cada service da camada de regras de negocio
 * sinaliza apropriadamente os conflitos de unicidade (CPF / e-mail) ou
 * de coexistencia (CPF ja vinculado a outro usuario).
 *
 * Atua na camada de SERVICE com mocks dos repositorios para garantir:
 *   - Independencia de banco/rede (determinismo)
 *   - Foco no caminho de conflito (cada repo retornando registro existente)
 *   - Contribuicao para a cobertura >= 80% da camada Service
 *
 * Veja src/tests/README.md para a convencao de testes.
 */

jest.mock('../repositories/usuarioRepository');
jest.mock('../repositories/alunoRepository');

import * as usuarioSvc from '../services/usuarioService';
import * as alunoSvc from '../services/alunoService';
import * as importacaoSvc from '../services/importacaoService';

import * as usuarioRepo from '../repositories/usuarioRepository';
import * as alunoRepo from '../repositories/alunoRepository';

import { ConflictError } from '../errors/AppError';

// Helper tipado para evitar repeticao de cast em cada mockResolvedValue.
const mocked = <T extends (...args: any[]) => any>(fn: T) =>
  fn as jest.MockedFunction<T>;

// Spy do bcrypt para que atualizarPortalAluno nao tente hashear de verdade
// (nos caminhos que chegam ate a senha — embora os testes aqui ja parem antes).
const bcrypt = require('bcryptjs');
jest.spyOn(bcrypt, 'hash').mockResolvedValue('hash_fake' as never);

const USUARIO_EXISTENTE = {
  id_usuario: 7,
  nome: 'Outro Usuario',
  email: 'outro@x.com',
  senha: 'hash',
  cpf: '11122233344',
};

const ALUNO_ATIVO = {
  id_usuario: 1,
  ativo: true,
};

describe('Cenarios 409 — regra de negocio violada / conflito', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // --------------------------------------------------------------------------
  // POST /usuarios — duplicidade de CPF / email (RN01)
  // --------------------------------------------------------------------------
  describe('POST /usuarios (usuarioService.criarUsuario) — RN01', () => {
    it('lanca ConflictError quando o CPF ja esta cadastrado', async () => {
      mocked(usuarioRepo.findByCpf).mockResolvedValue(USUARIO_EXISTENTE as any);
      mocked(usuarioRepo.findByEmail).mockResolvedValue(null);

      await expect(
        usuarioSvc.criarUsuario({
          nome: 'Novo',
          email: 'novo@x.com',
          senha: 'senha123',
          cpf: '11122233344',
        }),
      ).rejects.toThrow(ConflictError);
    });

    it('lanca ConflictError quando o e-mail ja esta cadastrado', async () => {
      mocked(usuarioRepo.findByCpf).mockResolvedValue(null);
      mocked(usuarioRepo.findByEmail).mockResolvedValue(USUARIO_EXISTENTE as any);

      await expect(
        usuarioSvc.criarUsuario({
          nome: 'Novo',
          email: 'outro@x.com',
          senha: 'senha123',
          cpf: '99988877766',
        }),
      ).rejects.toThrow(ConflictError);
    });

    it('verifica CPF antes de e-mail (curto-circuito)', async () => {
      mocked(usuarioRepo.findByCpf).mockResolvedValue(USUARIO_EXISTENTE as any);
      mocked(usuarioRepo.findByEmail).mockResolvedValue(USUARIO_EXISTENTE as any);

      await expect(
        usuarioSvc.criarUsuario({
          nome: 'Novo',
          email: 'outro@x.com',
          senha: 'senha123',
          cpf: '11122233344',
        }),
      ).rejects.toThrow(ConflictError);

      // confirma que o checking de email nao chegou a ser feito
      expect(mocked(usuarioRepo.findByCpf)).toHaveBeenCalled();
      expect(mocked(usuarioRepo.findByEmail)).not.toHaveBeenCalled();
    });
  });

  // --------------------------------------------------------------------------
  // PUT /alunos/:id/portal — CPF / email ja em uso por outro usuario (RN09)
  // --------------------------------------------------------------------------
  describe('PUT /alunos/:id/portal (alunoService.atualizarPortalAluno) — RN09', () => {
    it('lanca ConflictError quando CPF informado pertence a outro usuario', async () => {
      mocked(alunoRepo.findByIdIncludeInactive).mockResolvedValue(ALUNO_ATIVO as any);
      mocked(usuarioRepo.findByCpf).mockResolvedValue(USUARIO_EXISTENTE as any);

      await expect(
        alunoSvc.atualizarPortalAluno(1, { cpf: '11122233344' }),
      ).rejects.toThrow(ConflictError);
    });

    it('lanca ConflictError quando e-mail informado pertence a outro usuario', async () => {
      mocked(alunoRepo.findByIdIncludeInactive).mockResolvedValue(ALUNO_ATIVO as any);
      mocked(usuarioRepo.findByEmail).mockResolvedValue(USUARIO_EXISTENTE as any);

      await expect(
        alunoSvc.atualizarPortalAluno(1, { email: 'outro@x.com' }),
      ).rejects.toThrow(ConflictError);
    });

    it('NAO lanca ConflictError quando o CPF informado pertence ao proprio aluno', async () => {
      // mesmo id_usuario do aluno -> nao e conflito
      mocked(alunoRepo.findByIdIncludeInactive).mockResolvedValue(ALUNO_ATIVO as any);
      mocked(usuarioRepo.findByCpf).mockResolvedValue({
        ...USUARIO_EXISTENTE,
        id_usuario: 1, // <- mesmo id do aluno
      } as any);
      mocked(usuarioRepo.update).mockResolvedValue({
        ...USUARIO_EXISTENTE,
        id_usuario: 1,
        cpf: '11122233344',
      } as any);

      await expect(
        alunoSvc.atualizarPortalAluno(1, { cpf: '11122233344' }),
      ).resolves.toBeDefined();
    });

    it('NAO lanca ConflictError quando o e-mail informado pertence ao proprio aluno', async () => {
      mocked(alunoRepo.findByIdIncludeInactive).mockResolvedValue(ALUNO_ATIVO as any);
      mocked(usuarioRepo.findByEmail).mockResolvedValue({
        ...USUARIO_EXISTENTE,
        id_usuario: 1,
      } as any);
      mocked(usuarioRepo.update).mockResolvedValue({
        ...USUARIO_EXISTENTE,
        id_usuario: 1,
        email: 'meu@x.com',
      } as any);

      await expect(
        alunoSvc.atualizarPortalAluno(1, { email: 'meu@x.com' }),
      ).resolves.toBeDefined();
    });
  });

  // --------------------------------------------------------------------------
  // POST /importacao/alunos — equivalente 207 (parcial com conflitos)
  // --------------------------------------------------------------------------
  describe('POST /importacao/alunos (importacaoService.importarAlunos)', () => {
    it('captura conflitos de CPF/e-mail sem propagar erro (resposta 207)', async () => {
      // O primeiro registro conflita (CPF existente); o segundo importa com sucesso.
      mocked(usuarioRepo.findByCpf)
        .mockResolvedValueOnce(USUARIO_EXISTENTE as any) // linha 1: conflito
        .mockResolvedValueOnce(null);                    // linha 2: ok
      mocked(usuarioRepo.findByEmail).mockResolvedValue(null);
      mocked(usuarioRepo.create).mockResolvedValue({
        id_usuario: 10,
        nome: 'B',
        email: 'b@x.com',
        senha: 'h',
        cpf: '22233344455',
      } as any);
      mocked(alunoRepo.create).mockResolvedValue({
        id_usuario: 10,
        ativo: true,
      } as any);

      const csv = Buffer.from(
        'nome,email,senha,cpf\n' +
          'A,a@x.com,123,11122233344\n' + // <- CPF duplicado
          'B,b@x.com,123,22233344455\n',  // <- ok
      );

      const resultado = await importacaoSvc.importarAlunos(
        csv,
        'text/csv',
        'alunos.csv',
      );

      expect(resultado.importados).toBe(1);
      expect(resultado.conflitos).toHaveLength(1);
      expect(resultado.conflitos[0]).toMatchObject({
        linha: 2,
        cpf: '11122233344',
      });
      expect(resultado.conflitos[0].motivo).toContain('CPF');
    });
  });
});
