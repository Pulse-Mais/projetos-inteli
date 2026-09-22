jest.mock('../db/supabaseClient', () => ({ supabase: {} }));
jest.mock('../repositories/alunoRepository');
jest.mock('../repositories/usuarioRepository');

import request from 'supertest';
import { app } from '../app';

const alunoRepo = require('../repositories/alunoRepository') as jest.Mocked<
  typeof import('../repositories/alunoRepository')
>;
const usuarioRepo = require('../repositories/usuarioRepository') as jest.Mocked<
  typeof import('../repositories/usuarioRepository')
>;

const aluno = { id_usuario: 1, ativo: true };

beforeEach(() => jest.clearAllMocks());

describe('GET /alunos', () => {
  it('retorna somente alunos ativos por padrão', async () => {
    alunoRepo.findAllComUsuario.mockResolvedValue([aluno as any]);
    const res = await request(app).get('/alunos');
    expect(res.status).toBe(200);
    expect(res.body.every((a: any) => a.ativo === true)).toBe(true);
  });

  it('retorna somente inativos quando ativo=false', async () => {
    alunoRepo.findAllComUsuario.mockResolvedValue([{ ...aluno, ativo: false } as any]);
    const res = await request(app).get('/alunos?ativo=false');
    expect(res.status).toBe(200);
    expect(res.body.every((a: any) => a.ativo === false)).toBe(true);
  });

  it('filtra por nome parcial', async () => {
    alunoRepo.findAllComUsuario.mockResolvedValue([aluno as any]);
    const res = await request(app).get('/alunos?nome=Teste');
    expect(res.status).toBe(200);
    expect(res.body.length).toBeGreaterThan(0);
  });
});

describe('PATCH /alunos/:id/tornar-ex-aluno', () => {
  it('inativa o aluno (soft delete) e retorna 204', async () => {
    alunoRepo.inactivate.mockResolvedValue(true);
    const res = await request(app).patch('/alunos/1/tornar-ex-aluno');
    expect(res.status).toBe(204);
  });

  it('retorna 404 para id inexistente', async () => {
    alunoRepo.inactivate.mockResolvedValue(false);
    const res = await request(app).patch('/alunos/999999/tornar-ex-aluno');
    expect(res.status).toBe(404);
  });
});

describe('DELETE /alunos/:id', () => {
  it('exclui o aluno permanentemente (hard delete) e retorna 204', async () => {
    alunoRepo.hardDelete.mockResolvedValue(true);
    usuarioRepo.remove.mockResolvedValue(true);
    const res = await request(app).delete('/alunos/1');
    expect(res.status).toBe(204);
    expect(usuarioRepo.remove).toHaveBeenCalledWith(1);
  });

  it('retorna 404 para id inexistente', async () => {
    alunoRepo.hardDelete.mockResolvedValue(false);
    const res = await request(app).delete('/alunos/999999');
    expect(res.status).toBe(404);
  });
});

describe('POST /alunos', () => {
  it('retorna 409 para CPF duplicado', async () => {
    usuarioRepo.findByCpf.mockResolvedValue({ id_usuario: 99 } as any);
    const res = await request(app)
      .post('/usuarios')
      .send({ nome: 'Teste', email: 'outro@email.com', senha: '123', cpf: '12345678901' });
    expect(res.status).toBe(409);
  });
});
