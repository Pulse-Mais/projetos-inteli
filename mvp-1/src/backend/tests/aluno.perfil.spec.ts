jest.mock('../db/supabaseClient', () => ({ supabase: {} }));
jest.mock('../repositories/alunoRepository');
jest.mock('../repositories/usuarioRepository');

import request from 'supertest';
import { app } from '../app';

const alunoRepo = require('../repositories/alunoRepository') as jest.Mocked<
  typeof import('../repositories/alunoRepository')
>;

const perfilMock = {
  usuario: { nome: 'Aluno Perfil Teste', email: 'perfil@email.com' },
  programas: [],
  eventos: [],
  avaliacoes: [],
  mentorias: [],
  historico_profissional: [],
};

beforeEach(() => jest.clearAllMocks());

describe('GET /alunos/:id/perfil', () => {
  it('retorna perfil consolidado do aluno com status 200', async () => {
    alunoRepo.findPerfilById.mockResolvedValue(perfilMock as any);
    const res = await request(app).get('/alunos/1/perfil');
    expect(res.status).toBe(200);

    expect(res.body).toHaveProperty('usuario');
    expect(res.body).toHaveProperty('programas');
    expect(res.body).toHaveProperty('eventos');
    expect(res.body).toHaveProperty('avaliacoes');
    expect(res.body).toHaveProperty('mentorias');
    expect(res.body).toHaveProperty('historico_profissional');

    expect(res.body.usuario.nome).toBe('Aluno Perfil Teste');
    expect(res.body.usuario.email).toBe('perfil@email.com');

    expect(Array.isArray(res.body.programas)).toBe(true);
    expect(Array.isArray(res.body.eventos)).toBe(true);
    expect(Array.isArray(res.body.avaliacoes)).toBe(true);
    expect(Array.isArray(res.body.mentorias)).toBe(true);
    expect(Array.isArray(res.body.historico_profissional)).toBe(true);
  });

  it('retorna 404 para aluno inexistente', async () => {
    alunoRepo.findPerfilById.mockResolvedValue(null);
    const res = await request(app).get('/alunos/999999/perfil');
    expect(res.status).toBe(404);
  });

  it('retorna 404 para aluno inativo', async () => {
    alunoRepo.findPerfilById.mockResolvedValue(null);
    const res = await request(app).get('/alunos/2/perfil');
    expect(res.status).toBe(404);
  });
});
