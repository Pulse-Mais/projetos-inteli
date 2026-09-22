jest.mock('../db/supabaseClient', () => ({ supabase: {} }));
jest.mock('../repositories/mentorRepository');
jest.mock('../repositories/usuarioRepository');
jest.mock('../repositories/acompanhaRepository');

import request from 'supertest';
import { app } from '../app';

const mentorRepo = require('../repositories/mentorRepository') as jest.Mocked<
  typeof import('../repositories/mentorRepository')
>;
const acompanhaRepo = require('../repositories/acompanhaRepository') as jest.Mocked<
  typeof import('../repositories/acompanhaRepository')
>;

const mentor = {
  id_usuario: 1,
  tipo_vinculo: 'interno',
  disponibilidade: 'disponivel',
  id_coordenador: 2,
  especialidade: 'Design',
  ativo: true,
};

beforeEach(() => jest.clearAllMocks());

describe('MentorController', () => {
  it('POST /mentores com especialidade retorna 201 e especialidade', async () => {
    mentorRepo.create.mockResolvedValue(mentor as any);
    const response = await request(app).post('/mentores').send({
      id_usuario: 1,
      tipo_vinculo: 'interno',
      disponibilidade: 'disponivel',
      id_coordenador: 2,
      especialidade: 'Design',
    });
    expect(response.status).toBe(201);
    expect(response.body.especialidade).toBe('Design');
    expect(response.body.ativo).toBe(true);
  });

  it('GET /mentores nao retorna mentores inativos', async () => {
    mentorRepo.findAll.mockResolvedValue([mentor as any]);
    const response = await request(app).get('/mentores');
    expect(response.status).toBe(200);
    const ids = (response.body as any[]).map((m) => m.id_usuario);
    expect(ids).toContain(mentor.id_usuario);
  });

  it('DELETE /mentores/:id retorna 204 e seta ativo = false', async () => {
    mentorRepo.findByIdIncludeInactive.mockResolvedValue(mentor as any);
    mentorRepo.inactivate.mockResolvedValue(true);
    const response = await request(app).delete('/mentores/1');
    expect(response.status).toBe(204);
  });

  it('DELETE /mentores/:id inexistente retorna 404', async () => {
    mentorRepo.findByIdIncludeInactive.mockResolvedValue(null);
    const response = await request(app).delete('/mentores/-1');
    expect(response.status).toBe(404);
  });

  it('GET /mentores/:id/mentorandos com id valido retorna 200 e lista alunos', async () => {
    mentorRepo.findById.mockResolvedValue(mentor as any);
    const mentorandos = [
      { id_usuario: 5, nome: 'Aluno Teste', email: 'aluno@test.local', id_programa: 1 },
    ];
    acompanhaRepo.findMentorandosByMentorId.mockResolvedValue(mentorandos as any);
    const response = await request(app).get('/mentores/1/mentorandos');
    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBe(true);
    expect(response.body.length).toBe(1);
    expect(response.body[0].id_usuario).toBe(5);
  });

  it('GET /mentores/:id/mentorandos com id inexistente retorna 404', async () => {
    mentorRepo.findById.mockResolvedValue(null);
    const response = await request(app).get('/mentores/-1/mentorandos');
    expect(response.status).toBe(404);
  });

  it('GET /mentores/:id/mentorandos com mentor sem mentorandos retorna 200 e []', async () => {
    mentorRepo.findById.mockResolvedValue(mentor as any);
    acompanhaRepo.findMentorandosByMentorId.mockResolvedValue([]);
    const response = await request(app).get('/mentores/1/mentorandos');
    expect(response.status).toBe(200);
    expect(response.body).toEqual([]);
  });
});
