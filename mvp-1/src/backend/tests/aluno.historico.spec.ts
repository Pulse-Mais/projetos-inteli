jest.mock('../db/supabaseClient', () => ({ supabase: {} }));
jest.mock('../repositories/alunoRepository');
jest.mock('../repositories/historicoProfissionalRepository');

import request from 'supertest';
import { app } from '../app';
import * as alunoRepo from '../repositories/alunoRepository';
import * as historicoRepo from '../repositories/historicoProfissionalRepository';

const mockedAlunoRepo = alunoRepo as jest.Mocked<typeof alunoRepo>;
const mockedHistoricoRepo = historicoRepo as jest.Mocked<typeof historicoRepo>;

const alunoAtivo = { id_usuario: 1, ativo: true };
const alunoInativo = { id_usuario: 2, ativo: false };

const historicoPadrao = {
  id_historico: 10,
  cargo: 'Desenvolvedor',
  empresa: 'Tech Co',
  data_inicio: '2023-01-01',
  data_fim: null,
  renda: null,
  id_aluno: 1,
};

// GET /alunos/:id/historico
describe('GET /alunos/:id/historico', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedAlunoRepo.findById.mockResolvedValue(alunoAtivo);
    mockedHistoricoRepo.findAllByAluno.mockResolvedValue([historicoPadrao]);
  });

  // sucesso
  it('200 — retorna lista de histórico para aluno ativo', async () => {
    const res = await request(app).get('/alunos/1/historico');
    expect(res.status).toBe(200);
    expect(res.body).toEqual([historicoPadrao]);
    expect(mockedHistoricoRepo.findAllByAluno).toHaveBeenCalledWith(1);
  });

  it('200 — retorna lista vazia quando aluno não tem histórico', async () => {
    mockedHistoricoRepo.findAllByAluno.mockResolvedValue([]);
    const res = await request(app).get('/alunos/1/historico');
    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });

  // não encontrado 404
  it('404 — aluno não encontrado', async () => {
    mockedAlunoRepo.findById.mockResolvedValue(null);
    const res = await request(app).get('/alunos/99/historico');
    expect(res.status).toBe(404);
    expect(mockedHistoricoRepo.findAllByAluno).not.toHaveBeenCalled();
  });

  it('404 — aluno inativo', async () => {
    mockedAlunoRepo.findById.mockResolvedValue(alunoInativo);
    const res = await request(app).get('/alunos/2/historico');
    expect(res.status).toBe(404);
    expect(mockedHistoricoRepo.findAllByAluno).not.toHaveBeenCalled();
  });
});

// POST /alunos/:id/historico
describe('POST /alunos/:id/historico', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedAlunoRepo.findById.mockResolvedValue(alunoAtivo);
    mockedHistoricoRepo.create.mockResolvedValue(historicoPadrao);
  });

  // sucesso
  it('201 — cria registro de histórico com sucesso', async () => {
    const res = await request(app)
      .post('/alunos/1/historico')
      .send({ cargo: 'Desenvolvedor', empresa: 'Tech Co', data_inicio: '2023-01-01' });

    expect(res.status).toBe(201);
    expect(res.body).toEqual(historicoPadrao);
    expect(mockedHistoricoRepo.create).toHaveBeenCalledWith(
      expect.objectContaining({ cargo: 'Desenvolvedor', id_aluno: 1 }),
    );
  });

  it('201 — cria registro com data_fim informada', async () => {
    const comDataFim = { ...historicoPadrao, data_fim: '2024-06-01' };
    mockedHistoricoRepo.create.mockResolvedValue(comDataFim);

    const res = await request(app)
      .post('/alunos/1/historico')
      .send({ cargo: 'Dev', empresa: 'X', data_inicio: '2023-01-01', data_fim: '2024-06-01' });

    expect(res.status).toBe(201);
    expect(res.body.data_fim).toBe('2024-06-01');
  });

  // não encontrado 404
  it('404 — aluno não encontrado', async () => {
    mockedAlunoRepo.findById.mockResolvedValue(null);
    const res = await request(app)
      .post('/alunos/99/historico')
      .send({ cargo: 'Dev', empresa: 'X', data_inicio: '2023-01-01' });

    expect(res.status).toBe(404);
    expect(mockedHistoricoRepo.create).not.toHaveBeenCalled();
  });

  it('404 — aluno inativo', async () => {
    mockedAlunoRepo.findById.mockResolvedValue(alunoInativo);
    const res = await request(app)
      .post('/alunos/2/historico')
      .send({ cargo: 'Dev', empresa: 'X', data_inicio: '2023-01-01' });

    expect(res.status).toBe(404);
    expect(mockedHistoricoRepo.create).not.toHaveBeenCalled();
  });
});

// PUT /alunos/:id/historico/:id_hist
describe('PUT /alunos/:id/historico/:id_hist', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedAlunoRepo.findById.mockResolvedValue(alunoAtivo);
  });

  // sucesso
  it('200 — atualiza registro existente', async () => {
    mockedHistoricoRepo.update.mockResolvedValue({ ...historicoPadrao, cargo: 'Sênior' });
    const res = await request(app)
      .put('/alunos/1/historico/10')
      .send({ cargo: 'Sênior' });

    expect(res.status).toBe(200);
    expect(res.body.cargo).toBe('Sênior');
  });

  it('200 — passa id_usuario do aluno ao update (garante ownership)', async () => {
    mockedHistoricoRepo.update.mockResolvedValue({ ...historicoPadrao, cargo: 'Dev' });
    await request(app).put('/alunos/1/historico/10').send({ cargo: 'Dev' });
    expect(mockedHistoricoRepo.update).toHaveBeenCalledWith(10, 1, expect.any(Object));
  });

  // não encontrado 404
  it('404 — id_historico não encontrado no banco', async () => {
    mockedHistoricoRepo.update.mockResolvedValue(null);
    const res = await request(app)
      .put('/alunos/1/historico/999')
      .send({ cargo: 'Dev' });

    expect(res.status).toBe(404);
  });

  it('404 — id_historico pertence a outro aluno (ownership breach)', async () => {
    // update retorna null porque WHERE id_historico=999 AND id_usuario=1 não encontra nada
    mockedHistoricoRepo.update.mockResolvedValue(null);
    const res = await request(app)
      .put('/alunos/1/historico/999')
      .send({ cargo: 'Dev' });

    expect(res.status).toBe(404);
  });

  it('404 — aluno não encontrado', async () => {
    mockedAlunoRepo.findById.mockResolvedValue(null);
    const res = await request(app)
      .put('/alunos/99/historico/10')
      .send({ cargo: 'Dev' });

    expect(res.status).toBe(404);
    expect(mockedHistoricoRepo.update).not.toHaveBeenCalled();
  });
});

// DELETE /alunos/:id/historico/:id_hist
describe('DELETE /alunos/:id/historico/:id_hist', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedAlunoRepo.findById.mockResolvedValue(alunoAtivo);
  });

  // sucesso
  it('204 — remove registro existente', async () => {
    mockedHistoricoRepo.remove.mockResolvedValue(true);
    const res = await request(app).delete('/alunos/1/historico/10');
    expect(res.status).toBe(204);
  });

  it('204 — passa id_usuario do aluno ao remove (garante ownership)', async () => {
    mockedHistoricoRepo.remove.mockResolvedValue(true);
    await request(app).delete('/alunos/1/historico/10');
    expect(mockedHistoricoRepo.remove).toHaveBeenCalledWith(10, 1);
  });

  // não encontrado 404
  it('404 — id_historico não encontrado no banco', async () => {
    mockedHistoricoRepo.remove.mockResolvedValue(false);
    const res = await request(app).delete('/alunos/1/historico/999');
    expect(res.status).toBe(404);
  });

  it('404 — id_historico pertence a outro aluno (ownership breach)', async () => {
    // remove retorna false porque WHERE id_historico=999 AND id_usuario=1 não encontra nada
    mockedHistoricoRepo.remove.mockResolvedValue(false);
    const res = await request(app).delete('/alunos/1/historico/999');
    expect(res.status).toBe(404);
  });

  it('404 — aluno não encontrado', async () => {
    mockedAlunoRepo.findById.mockResolvedValue(null);
    const res = await request(app).delete('/alunos/99/historico/10');
    expect(res.status).toBe(404);
    expect(mockedHistoricoRepo.remove).not.toHaveBeenCalled();
  });
});

