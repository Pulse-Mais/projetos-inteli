// Mocks declarados antes dos imports (jest hoisting)
jest.mock('../db/supabaseClient', () => ({ supabase: {} }));
jest.mock('../repositories/atividadeRepository');
jest.mock('../repositories/programaRepository');
jest.mock('../repositories/entregaRepository');
jest.mock('../repositories/alunoRepository');

import request from 'supertest';
import { app } from '../app';
import * as atividadeSvc from '../services/atividadeService';
import * as entregaSvc from '../services/entregaService';
import { BadRequestError, NotFoundError } from '../errors/AppError';

// ── Atividade ─────────────────────────────────────────────────────────────────

describe('POST /atividades — controller', () => {
  let criarSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    criarSpy?.mockRestore();
  });

  it('400 — id_programa inválido (programa não existe — RN03)', async () => {
    criarSpy = jest
      .spyOn(atividadeSvc, 'criarAtividade')
      .mockRejectedValue(new BadRequestError('Programa com id 999 não encontrado (RN03)'));

    const res = await request(app).post('/atividades').send({
      nome: 'Atividade Teste',
      descricao: 'Descrição',
      data_entrega: '2026-06-01',
      id_programa: 999,
    });

    expect(res.status).toBe(400);
    expect(res.body).toEqual({ error: 'Programa com id 999 não encontrado (RN03)' });
    expect(criarSpy).toHaveBeenCalledTimes(1);
  });

  it('201 — cria atividade com dados válidos', async () => {
    const atividadeCriada = {
      id_atividade: 1,
      nome: 'Atividade Teste',
      descricao: 'Descrição',
      data_entrega: '2026-06-01',
      id_programa: 1,
    };

    criarSpy = jest
      .spyOn(atividadeSvc, 'criarAtividade')
      .mockResolvedValue(atividadeCriada);

    const res = await request(app).post('/atividades').send({
      nome: 'Atividade Teste',
      descricao: 'Descrição',
      data_entrega: '2026-06-01',
      id_programa: 1,
    });

    expect(res.status).toBe(201);
    expect(res.body).toEqual(atividadeCriada);
  });
});

// ── Entregas ──────────────────────────────────────────────────────────────────

describe('GET /alunos/:id/entregas — controller', () => {
  let listarSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    listarSpy?.mockRestore();
  });

  it('200 — retorna lista de entregas do aluno', async () => {
    const entregas = [
      { id_aluno: 1, id_atividade: 1, data_entrega: '2026-05-01' },
      { id_aluno: 1, id_atividade: 2, data_entrega: '2026-05-10' },
    ];

    listarSpy = jest
      .spyOn(entregaSvc, 'listarEntregas')
      .mockResolvedValue(entregas);

    const res = await request(app).get('/alunos/1/entregas');

    expect(res.status).toBe(200);
    expect(res.body).toEqual(entregas);
    expect(listarSpy).toHaveBeenCalledWith(1);
  });

  it('404 — aluno inexistente retorna 404', async () => {
    listarSpy = jest
      .spyOn(entregaSvc, 'listarEntregas')
      .mockRejectedValue(new NotFoundError('Aluno com id 999 não encontrado'));

    const res = await request(app).get('/alunos/999/entregas');

    expect(res.status).toBe(404);
    expect(res.body).toEqual({ error: 'Aluno com id 999 não encontrado' });
  });
});

describe('POST /alunos/:id/entregas — controller (RN04)', () => {
  let registrarSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    registrarSpy?.mockRestore();
  });

  it('400 — data_entrega futura retorna 400 (RN04)', async () => {
    registrarSpy = jest
      .spyOn(entregaSvc, 'registrarEntrega')
      .mockRejectedValue(new BadRequestError('A data de entrega não pode ser futura (RN04)'));

    const res = await request(app).post('/alunos/1/entregas').send({
      id_atividade: 1,
      data_entrega: '2099-12-31',
    });

    expect(res.status).toBe(400);
    expect(res.body).toEqual({ error: 'A data de entrega não pode ser futura (RN04)' });
    expect(registrarSpy).toHaveBeenCalledTimes(1);
  });

  it('201 — registra entrega com dados válidos', async () => {
    const entregaCriada = {
      id_aluno: 1,
      id_atividade: 1,
      data_entrega: '2026-05-20',
    };

    registrarSpy = jest
      .spyOn(entregaSvc, 'registrarEntrega')
      .mockResolvedValue(entregaCriada);

    const res = await request(app).post('/alunos/1/entregas').send({
      id_atividade: 1,
      data_entrega: '2026-05-20',
    });

    expect(res.status).toBe(201);
    expect(res.body).toEqual(entregaCriada);
    expect(registrarSpy).toHaveBeenCalledWith(
      expect.objectContaining({ id_aluno: 1, id_atividade: 1 })
    );
  });
});

// ── entregaService — testes unitários da RN04 ────────────────────────────────

describe('entregaService.registrarEntrega — RN04', () => {
  let alunoRepoMock: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    alunoRepoMock = require('../repositories/alunoRepository').findById as jest.Mock;
    alunoRepoMock.mockResolvedValue({ id_usuario: 1, ativo: true });
  });

  it('lança BadRequestError para data_entrega futura', async () => {
    await expect(
      entregaSvc.registrarEntrega({
        id_aluno: 1,
        id_atividade: 1,
        data_entrega: '2099-12-31',
      })
    ).rejects.toThrow(BadRequestError);
  });

  it('lança NotFoundError para aluno inexistente', async () => {
    alunoRepoMock.mockResolvedValue(null);

    await expect(
      entregaSvc.registrarEntrega({
        id_aluno: 999,
        id_atividade: 1,
        data_entrega: '2026-05-01',
      })
    ).rejects.toThrow(NotFoundError);
  });

  it('persiste entrega quando dados são válidos', async () => {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const entregaRepo = require('../repositories/entregaRepository');
    const createMock = entregaRepo.create as jest.Mock;
    const entregaEsperada = {
      id_aluno: 1,
      id_atividade: 1,
      data_entrega: '2026-05-01',
    };
    createMock.mockResolvedValue(entregaEsperada);

    const resultado = await entregaSvc.registrarEntrega({
      id_aluno: 1,
      id_atividade: 1,
      data_entrega: '2026-05-01',
    });

    expect(resultado).toEqual(entregaEsperada);
    expect(createMock).toHaveBeenCalledTimes(1);
  });
});

// ── atividadeService — testes unitários da RN03 ──────────────────────────────

describe('atividadeService.criarAtividade — RN03', () => {
  let programaRepoMock: jest.Mock;
  let atividadeRepoMock: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    programaRepoMock = require('../repositories/programaRepository').findById as jest.Mock;
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    atividadeRepoMock = require('../repositories/atividadeRepository').create as jest.Mock;
  });

  it('lança BadRequestError quando programa não existe (RN03)', async () => {
    programaRepoMock.mockResolvedValue(null);

    await expect(
      atividadeSvc.criarAtividade({
        nome: 'Atividade X',
        data_entrega: '2026-06-01',
        id_programa: 999,
      })
    ).rejects.toThrow(BadRequestError);

    expect(atividadeRepoMock).not.toHaveBeenCalled();
  });

  it('persiste atividade quando programa existe', async () => {
    programaRepoMock.mockResolvedValue({ id_programa: 1, titulo: 'Programa A' });
    const atividadeCriada = {
      id_atividade: 1,
      nome: 'Atividade X',
      descricao: null,
      data_entrega: '2026-06-01',
      id_programa: 1,
    };
    atividadeRepoMock.mockResolvedValue(atividadeCriada);

    const resultado = await atividadeSvc.criarAtividade({
      nome: 'Atividade X',
      data_entrega: '2026-06-01',
      id_programa: 1,
    });

    expect(resultado).toEqual(atividadeCriada);
    expect(atividadeRepoMock).toHaveBeenCalledTimes(1);
  });
});
