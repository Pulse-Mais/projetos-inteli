/**
 * Branches de serviço não cobertos pelos arquivos cenarios-4xx pré-existentes:
 * caminhos de sucesso e validações específicas de atividadeService,
 * avaliacaoService, mentoriaService e mentorService.
 */

jest.mock('../repositories/atividadeRepository');
jest.mock('../repositories/programaRepository');
jest.mock('../repositories/avaliacaoRepository');
jest.mock('../repositories/mentoriaRepository');
jest.mock('../repositories/mentorRepository');
jest.mock('../repositories/alunoRepository');
jest.mock('../repositories/acompanhaRepository');

import * as atividadeSvc from '../services/atividadeService';
import * as avaliacaoSvc from '../services/avaliacaoService';
import * as mentoriaSvc from '../services/mentoriaService';
import * as mentorSvc from '../services/mentorService';
import { NotFoundError, BadRequestError } from '../errors/AppError';

const atividadeRepo = require('../repositories/atividadeRepository') as jest.Mocked<typeof import('../repositories/atividadeRepository')>;
const programaRepo  = require('../repositories/programaRepository')  as jest.Mocked<typeof import('../repositories/programaRepository')>;
const avaliacaoRepo = require('../repositories/avaliacaoRepository') as jest.Mocked<typeof import('../repositories/avaliacaoRepository')>;
const mentoriaRepo  = require('../repositories/mentoriaRepository')  as jest.Mocked<typeof import('../repositories/mentoriaRepository')>;
const mentorRepo    = require('../repositories/mentorRepository')    as jest.Mocked<typeof import('../repositories/mentorRepository')>;
const alunoRepo     = require('../repositories/alunoRepository')     as jest.Mocked<typeof import('../repositories/alunoRepository')>;
const acompanhaRepo = require('../repositories/acompanhaRepository') as jest.Mocked<typeof import('../repositories/acompanhaRepository')>;

const atividade = { id_atividade: 1, nome: 'A', descricao: null, data_entrega: '2026-01-01', id_programa: 1 };
const avaliacao = { id_avaliacao: 1, nota: 4, data_avaliacao: '2026-01-01', id_indicador: 1, id_aluno: 1 };
const mentoria  = { id_mentoria: 1, formato: 'online', tema: 'T', duracao: 60, data: '2026-01-01T09:00:00Z' };
const mentor    = { id_usuario: 1, tipo_vinculo: 'interno', disponibilidade: 'disponivel', ativo: true, id_coordenador: 2 } as any;
const aluno     = { id_usuario: 2, ativo: true } as any;

beforeEach(() => jest.clearAllMocks());

// ── atividadeService ──────────────────────────────────────────────────────────

describe('atividadeService — caminhos de sucesso e RN03', () => {
  it('listarAtividades e buscarAtividade encontrado', async () => {
    atividadeRepo.findAll.mockResolvedValue([atividade]);
    await expect(atividadeSvc.listarAtividades()).resolves.toEqual([atividade]);

    atividadeRepo.findById.mockResolvedValue(atividade);
    await expect(atividadeSvc.buscarAtividade(1)).resolves.toEqual(atividade);
  });

  it('atualizarAtividade — RN03: programa inválido', async () => {
    atividadeRepo.findById.mockResolvedValue(atividade);
    programaRepo.findById.mockResolvedValue(null);
    await expect(atividadeSvc.atualizarAtividade(1, { id_programa: 999 })).rejects.toThrow(BadRequestError);
  });

  it('atualizarAtividade — sucesso sem mudança de programa e null-update', async () => {
    const updated = { ...atividade, nome: 'B' };
    atividadeRepo.findById.mockResolvedValue(atividade);
    atividadeRepo.update.mockResolvedValue(updated);
    await expect(atividadeSvc.atualizarAtividade(1, { nome: 'B' })).resolves.toEqual(updated);
    expect(programaRepo.findById).not.toHaveBeenCalled();

    atividadeRepo.update.mockResolvedValue(null);
    await expect(atividadeSvc.atualizarAtividade(1, { nome: 'B' })).rejects.toThrow(NotFoundError);
  });
});

// ── avaliacaoService ──────────────────────────────────────────────────────────

describe('avaliacaoService — caminhos de sucesso', () => {
  it('buscarAvaliacao encontrado e atualizarAvaliacao com nota válida', async () => {
    avaliacaoRepo.findById.mockResolvedValue(avaliacao);
    await expect(avaliacaoSvc.buscarAvaliacao(1)).resolves.toEqual(avaliacao);

    const updated = { ...avaliacao, nota: 5 };
    avaliacaoRepo.update.mockResolvedValue(updated);
    await expect(avaliacaoSvc.atualizarAvaliacao(1, { nota: 5 })).resolves.toEqual(updated);
  });

  it('atualizarAvaliacao — null-update lança NotFoundError', async () => {
    avaliacaoRepo.findById.mockResolvedValue(avaliacao);
    avaliacaoRepo.update.mockResolvedValue(null);
    await expect(avaliacaoSvc.atualizarAvaliacao(1, {})).rejects.toThrow(NotFoundError);
  });
});

// ── mentoriaService ───────────────────────────────────────────────────────────

describe('mentoriaService — caminhos de sucesso e rollback', () => {
  it('listarMentorias e buscarMentoria encontrado', async () => {
    mentoriaRepo.findAll.mockResolvedValue([mentoria]);
    await expect(mentoriaSvc.listarMentorias()).resolves.toEqual([mentoria]);

    mentoriaRepo.findById.mockResolvedValue(mentoria);
    await expect(mentoriaSvc.buscarMentoria(1)).resolves.toEqual(mentoria);
  });

  it('criarMentoria — rollback quando createRealiza falha', async () => {
    mentorRepo.findByIdIncludeInactive.mockResolvedValue(mentor);
    alunoRepo.findByIdIncludeInactive.mockResolvedValue(aluno);
    acompanhaRepo.existsVinculo.mockResolvedValue(true);
    mentoriaRepo.create.mockResolvedValue(mentoria);
    mentoriaRepo.createRealiza.mockRejectedValue(new Error('FK'));
    mentoriaRepo.remove.mockResolvedValue(true);

    await expect(mentoriaSvc.criarMentoria({ formato: 'online', tema: 'T', duracao: 60, data: '2026-01-01T09:00:00Z', id_mentor: 1, id_aluno: 2 })).rejects.toThrow('FK');
    expect(mentoriaRepo.remove).toHaveBeenCalledWith(mentoria.id_mentoria);
  });

  it('criarMentoria — rejeita quando nao existe vinculo acompanha', async () => {
    mentorRepo.findByIdIncludeInactive.mockResolvedValue(mentor);
    alunoRepo.findByIdIncludeInactive.mockResolvedValue(aluno);
    acompanhaRepo.existsVinculo.mockResolvedValue(false);

    await expect(mentoriaSvc.criarMentoria({ formato: 'online', tema: 'T', duracao: 60, data: '2026-01-01T09:00:00Z', id_mentor: 1, id_aluno: 2 })).rejects.toThrow(BadRequestError);
  });
});

// ── mentorService ─────────────────────────────────────────────────────────────

describe('mentorService — caminhos de sucesso', () => {
  it('buscarMentor encontrado', async () => {
    mentorRepo.findById.mockResolvedValue(mentor);
    await expect(mentorSvc.buscarMentor(1)).resolves.toEqual(mentor);
  });

  it('atualizarMentor — sucesso e null-update', async () => {
    const updated = { ...mentor, disponibilidade: 'indisponivel' };
    mentorRepo.findById.mockResolvedValue(mentor);
    mentorRepo.update.mockResolvedValue(updated);
    await expect(mentorSvc.atualizarMentor(1, { disponibilidade: 'indisponivel' })).resolves.toEqual(updated);

    mentorRepo.update.mockResolvedValue(null);
    await expect(mentorSvc.atualizarMentor(1, {})).rejects.toThrow(NotFoundError);
  });

  it('inativarMentor — inactivate false e sucesso', async () => {
    mentorRepo.findByIdIncludeInactive.mockResolvedValue(mentor);
    mentorRepo.inactivate.mockResolvedValue(false);
    await expect(mentorSvc.inativarMentor(1)).rejects.toThrow(NotFoundError);

    mentorRepo.inactivate.mockResolvedValue(true);
    await expect(mentorSvc.inativarMentor(1)).resolves.toBeUndefined();
  });

  it('listarMentorandos — sucesso', async () => {
    const mentorandos = [{ id_usuario: 5 } as any];
    mentorRepo.findById.mockResolvedValue(mentor);
    acompanhaRepo.findMentorandosByMentorId.mockResolvedValue(mentorandos);
    await expect(mentorSvc.listarMentorandos(1)).resolves.toEqual(mentorandos);
  });
});
