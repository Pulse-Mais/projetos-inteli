jest.mock('../db/supabaseClient', () => ({ supabase: {} }));
jest.mock('../repositories/mentoriaRepository');
jest.mock('../repositories/mentorRepository');
jest.mock('../repositories/alunoRepository');
jest.mock('../repositories/acompanhaRepository');
jest.mock('../repositories/programaRepository');

import request from 'supertest';
import { app } from '../app';

const mentorRepo = require('../repositories/mentorRepository') as jest.Mocked<
  typeof import('../repositories/mentorRepository')
>;
const alunoRepo = require('../repositories/alunoRepository') as jest.Mocked<
  typeof import('../repositories/alunoRepository')
>;
const acompanhaRepo = require('../repositories/acompanhaRepository') as jest.Mocked<
  typeof import('../repositories/acompanhaRepository')
>;
const mentoriaRepo = require('../repositories/mentoriaRepository') as jest.Mocked<
  typeof import('../repositories/mentoriaRepository')
>;
const programaRepo = require('../repositories/programaRepository') as jest.Mocked<
  typeof import('../repositories/programaRepository')
>;

const mentoria = { id_mentoria: 1, formato: 'online', tema: 'Carreira', duracao: 60, data: '2026-01-01T09:00:00Z' };
const mentorAtivo = { id_usuario: 10, ativo: true, tipo_vinculo: 'interno', disponibilidade: 'disponivel', id_coordenador: 20 };
const mentorInativo = { ...mentorAtivo, ativo: false };
const alunoAtivo = { id_usuario: 30, ativo: true };
const alunoInativo = { ...alunoAtivo, ativo: false };

beforeEach(() => jest.clearAllMocks());

describe('MentoriaController', () => {
  it('POST /mentorias com mentor inativo retorna 400', async () => {
    mentorRepo.findByIdIncludeInactive.mockResolvedValue(mentorInativo as any);
    alunoRepo.findByIdIncludeInactive.mockResolvedValue(alunoAtivo as any);
    const payload = {
      formato: 'online',
      tema: 'Carreira',
      duracao: 60,
      data: new Date().toISOString(),
      id_mentor: 10,
      id_aluno: 30,
    };
    const response = await request(app).post('/mentorias').send(payload);
    expect(response.status).toBe(400);
  });

  it('POST /mentorias com aluno inativo retorna 400', async () => {
    mentorRepo.findByIdIncludeInactive.mockResolvedValue(mentorAtivo as any);
    alunoRepo.findByIdIncludeInactive.mockResolvedValue(alunoInativo as any);
    const payload = {
      formato: 'presencial',
      tema: 'Networking',
      duracao: 45,
      data: new Date().toISOString(),
      id_mentor: 10,
      id_aluno: 30,
    };
    const response = await request(app).post('/mentorias').send(payload);
    expect(response.status).toBe(400);
  });

  it('POST /mentorias com dados validos retorna 201 e cria vinculos', async () => {
    mentorRepo.findByIdIncludeInactive.mockResolvedValue(mentorAtivo as any);
    alunoRepo.findByIdIncludeInactive.mockResolvedValue(alunoAtivo as any);
    acompanhaRepo.existsVinculo.mockResolvedValue(true);
    mentoriaRepo.create.mockResolvedValue(mentoria as any);
    mentoriaRepo.createRealiza.mockResolvedValue(undefined as any);
    mentoriaRepo.createParticipaMentoria.mockResolvedValue(undefined as any);

    const payload = {
      formato: 'online',
      tema: 'Plano de estudos',
      duracao: 60,
      data: new Date().toISOString(),
      id_mentor: 10,
      id_aluno: 30,
    };
    const response = await request(app).post('/mentorias').send(payload);
    expect(response.status).toBe(201);
    expect(response.body.id_mentoria).toBeDefined();
  });
});

describe('AcompanhaController', () => {
  it('POST /acompanha com dados validos retorna 201', async () => {
    mentorRepo.findByIdIncludeInactive.mockResolvedValue(mentorAtivo as any);
    alunoRepo.findById.mockResolvedValue(alunoAtivo as any);
    programaRepo.findById.mockResolvedValue({ id_programa: 1, titulo: 'P', inicio: '2024-01-01', fim: '2024-12-31' } as any);
    acompanhaRepo.findExact.mockResolvedValue(null);
    acompanhaRepo.create.mockResolvedValue({ id_mentor: 10, id_aluno: 30, id_programa: 1 } as any);

    const payload = { id_mentor: 10, id_aluno: 30, id_programa: 1 };
    const response = await request(app).post('/acompanha').send(payload);
    expect(response.status).toBe(201);
  });

  it('POST /acompanha com mentor inexistente retorna 404', async () => {
    mentorRepo.findByIdIncludeInactive.mockResolvedValue(null);
    const payload = { id_mentor: -1, id_aluno: 30, id_programa: 1 };
    const response = await request(app).post('/acompanha').send(payload);
    expect(response.status).toBe(404);
  });
});
