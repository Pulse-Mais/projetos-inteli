jest.mock('../db/supabaseClient', () => ({ supabase: {} }));
jest.mock('../repositories/alunoRepository');
jest.mock('../services/usuarioService');
jest.mock('bcryptjs', () => ({ hash: jest.fn() }));
jest.mock('../middlewares/authMiddleware', () => ({
  autenticar: (req: any, _res: any, next: any) => {
    req.usuario = { id_usuario: Number(req.params.id) };
    next();
  },
}));

import request from 'supertest';
import { app } from '../app';
import * as alunoSvc from '../services/alunoService';
import * as repo from '../repositories/alunoRepository';
import * as usuarioSvc from '../services/usuarioService';
import bcrypt from 'bcryptjs';
import { BadRequestError, ConflictError, NotFoundError } from '../errors/AppError';

const mockedRepo = repo as jest.Mocked<typeof repo>;
const mockedUsuarioSvc = usuarioSvc as jest.Mocked<typeof usuarioSvc>;

const usuarioCompleto = {
  id_usuario: 1,
  nome: 'Novo Nome',
  email: 'novo@email.com',
  senha: 'hash_secreto',
  cpf: '111.222.333-44',
};

const alunoAtivo = { id_usuario: 1, ativo: true };
const usuarioAtualizado = {
  id_usuario: 1,
  nome: 'Novo Nome',
  email: 'novo@email.com',
  cpf: '111.222.333-44',
  senha: 'hash_nova',
};

// controller: isola service via spy, verifica status e body HTTP
describe('PUT /alunos/:id/portal — controller', () => {
  const BASE = '/alunos';
  let portalSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.clearAllMocks();
    portalSpy = jest
      .spyOn(alunoSvc, 'atualizarPortalAluno')
      .mockResolvedValue(usuarioCompleto);
  });

  afterEach(() => {
    portalSpy.mockRestore();
  });

  // sucesso

  it('200 — atualiza dados pessoais com sucesso', async () => {
    const res = await request(app)
      .put(`${BASE}/1/portal`)
      .send({ nome: 'Novo Nome', email: 'novo@email.com' });

    expect(res.status).toBe(200);
    expect(portalSpy).toHaveBeenCalledWith(1, {
      nome: 'Novo Nome',
      email: 'novo@email.com',
      senha: undefined,
      cpf: undefined,
      telefone: undefined,
      empresa_atual: undefined,
      cargo_atual: undefined,
      area_interesse: undefined,
      disponibilidade_mentoria: undefined,
    });
  });

  it('200 — senha nunca aparece na resposta', async () => {
    const res = await request(app).put(`${BASE}/1/portal`).send({ nome: 'Novo Nome' });

    expect(res.status).toBe(200);
    expect(res.body).not.toHaveProperty('senha');
    expect(res.body).toMatchObject({
      id_usuario: 1,
      nome: 'Novo Nome',
      email: 'novo@email.com',
      cpf: '111.222.333-44',
    });
  });

  it('200 — atualização parcial (apenas nome)', async () => {
    portalSpy.mockResolvedValue({ ...usuarioCompleto, nome: 'Só Nome' });

    const res = await request(app).put(`${BASE}/1/portal`).send({ nome: 'Só Nome' });

    expect(res.status).toBe(200);
    expect(portalSpy).toHaveBeenCalledWith(1, {
      nome: 'Só Nome',
      email: undefined,
      senha: undefined,
      cpf: undefined,
      telefone: undefined,
      empresa_atual: undefined,
      cargo_atual: undefined,
      area_interesse: undefined,
      disponibilidade_mentoria: undefined,
    });
  });

  // conflito 409

  it('409 — CPF já em uso por outro usuário', async () => {
    portalSpy.mockRejectedValue(new ConflictError('CPF já cadastrado no sistema'));

    const res = await request(app).put(`${BASE}/2/portal`).send({ cpf: '000.000.000-00' });

    expect(res.status).toBe(409);
    expect(res.body).toEqual({ error: 'CPF já cadastrado no sistema' });
  });

  it('409 — e-mail já em uso por outro usuário', async () => {
    portalSpy.mockRejectedValue(new ConflictError('E-mail já cadastrado no sistema'));

    const res = await request(app)
      .put(`${BASE}/3/portal`)
      .send({ email: 'existente@email.com' });

    expect(res.status).toBe(409);
    expect(res.body).toEqual({ error: 'E-mail já cadastrado no sistema' });
  });

  // não encontrado 404

  it('404 — aluno não encontrado', async () => {
    portalSpy.mockRejectedValue(
      new NotFoundError('Aluno com id 99 não encontrado ou inativo'),
    );

    const res = await request(app).put(`${BASE}/99/portal`).send({ nome: 'Qualquer Nome' });

    expect(res.status).toBe(404);
    expect(res.body).toEqual({ error: 'Aluno com id 99 não encontrado ou inativo' });
  });

  it('404 — aluno inativo', async () => {
    portalSpy.mockRejectedValue(
      new NotFoundError('Aluno com id 5 não encontrado ou inativo'),
    );

    const res = await request(app).put(`${BASE}/5/portal`).send({ nome: 'Nome Qualquer' });

    expect(res.status).toBe(404);
    expect(res.body).toEqual({ error: 'Aluno com id 5 não encontrado ou inativo' });
  });

  // bad request 400

  it('400 — ID não numérico na URL', async () => {
    const res = await request(app).put(`${BASE}/abc/portal`).send({ nome: 'Nome' });

    expect(res.status).toBe(400);
    expect(res.body).toEqual({ error: 'ID inválido' });
    expect(portalSpy).not.toHaveBeenCalled();
  });

  it('400 — body sem nenhum campo para atualizar', async () => {
    portalSpy.mockRejectedValue(
      new BadRequestError('Nenhum campo para atualizar foi informado'),
    );

    const res = await request(app).put(`${BASE}/1/portal`).send({});

    expect(res.status).toBe(400);
    expect(res.body).toEqual({ error: 'Nenhum campo para atualizar foi informado' });
  });
});

// service (RF005/RN09): usa implementação real, mocka repo e usuarioService
describe('alunoService.atualizarPortalAluno — service (RF005)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (bcrypt.hash as jest.Mock).mockResolvedValue('hash_nova');
    // Portal do Ex-Aluno: o service usa findByIdIncludeInactive (atende ativos e ex-alunos)
    mockedRepo.findByIdIncludeInactive.mockResolvedValue(alunoAtivo);
    mockedRepo.updateDadosPortal.mockResolvedValue(alunoAtivo);
    mockedUsuarioSvc.buscarPorCpf.mockResolvedValue(null);
    mockedUsuarioSvc.buscarPorEmail.mockResolvedValue(null);
    mockedUsuarioSvc.buscarUsuario.mockResolvedValue(usuarioAtualizado);
    mockedUsuarioSvc.atualizarDadosPessoais.mockResolvedValue(usuarioAtualizado);
  });

  // sucesso─

  it('200 — atualiza nome com sucesso', async () => {
    const resultado = await alunoSvc.atualizarPortalAluno(1, { nome: 'Novo Nome' });
    expect(resultado).toEqual(usuarioAtualizado);
    expect(mockedUsuarioSvc.atualizarDadosPessoais).toHaveBeenCalledWith(
      1,
      expect.objectContaining({ nome: 'Novo Nome' }),
    );
  });

  it('200 — senha é hasheada com bcrypt antes de persistir', async () => {
    await alunoSvc.atualizarPortalAluno(1, { senha: 'nova_senha_123' });
    expect(bcrypt.hash).toHaveBeenCalledWith('nova_senha_123', 10);
    expect(mockedUsuarioSvc.atualizarDadosPessoais).toHaveBeenCalledWith(
      1,
      expect.objectContaining({ senha: 'hash_nova' }),
    );
  });

  it('200 — manter mesmo CPF não dispara conflito (comparação pelo id)', async () => {
    mockedUsuarioSvc.buscarPorCpf.mockResolvedValue({
      id_usuario: 1,
      nome: 'Nome',
      email: 'e@x.com',
      cpf: '111.222.333-44',
      senha: 'hash',
    });
    await expect(alunoSvc.atualizarPortalAluno(1, { cpf: '111.222.333-44' })).resolves.toEqual(
      usuarioAtualizado,
    );
  });

  it('200 — manter mesmo email não dispara conflito (comparação pelo id)', async () => {
    mockedUsuarioSvc.buscarPorEmail.mockResolvedValue({
      id_usuario: 1,
      nome: 'Nome',
      email: 'novo@email.com',
      cpf: '111.222.333-44',
      senha: 'hash',
    });
    await expect(alunoSvc.atualizarPortalAluno(1, { email: 'novo@email.com' })).resolves.toEqual(
      usuarioAtualizado,
    );
  });

  it('200 — apenas os campos enviados chegam ao atualizarDadosPessoais', async () => {
    await alunoSvc.atualizarPortalAluno(1, { nome: 'Só Nome' });
    const [, payload] = mockedUsuarioSvc.atualizarDadosPessoais.mock.calls[0];
    expect(payload).toHaveProperty('nome', 'Só Nome');
    expect(payload).not.toHaveProperty('email');
    expect(payload).not.toHaveProperty('cpf');
    expect(payload).not.toHaveProperty('senha');
  });

  it('200 — atualiza apenas a senha sem tocar outros campos', async () => {
    await alunoSvc.atualizarPortalAluno(1, { senha: 'nova123' });
    const [, payload] = mockedUsuarioSvc.atualizarDadosPessoais.mock.calls[0];
    expect(payload).toHaveProperty('senha', 'hash_nova');
    expect(payload).not.toHaveProperty('nome');
    expect(payload).not.toHaveProperty('email');
    expect(payload).not.toHaveProperty('cpf');
  });

  // bad request 400─

  it('400 — body sem nenhum campo lança BadRequestError', async () => {
    await expect(alunoSvc.atualizarPortalAluno(1, {})).rejects.toThrow(BadRequestError);
    expect(mockedRepo.findByIdIncludeInactive).not.toHaveBeenCalled();
  });

  it('400 — nome vazio lança BadRequestError', async () => {
    await expect(alunoSvc.atualizarPortalAluno(1, { nome: '' })).rejects.toThrow(BadRequestError);
  });

  it('400 — email vazio lança BadRequestError', async () => {
    await expect(alunoSvc.atualizarPortalAluno(1, { email: '' })).rejects.toThrow(BadRequestError);
  });

  it('400 — cpf vazio lança BadRequestError', async () => {
    await expect(alunoSvc.atualizarPortalAluno(1, { cpf: '' })).rejects.toThrow(BadRequestError);
  });

  it('400 — senha vazia lança BadRequestError', async () => {
    await expect(alunoSvc.atualizarPortalAluno(1, { senha: '' })).rejects.toThrow(BadRequestError);
  });

  // não encontrado 404─

  it('404 — aluno inexistente lança NotFoundError', async () => {
    mockedRepo.findByIdIncludeInactive.mockResolvedValue(null);
    await expect(alunoSvc.atualizarPortalAluno(99, { nome: 'Nome' })).rejects.toThrow(
      NotFoundError,
    );
    expect(mockedUsuarioSvc.atualizarDadosPessoais).not.toHaveBeenCalled();
  });

  // RF005 / Fluxo Principal 3: o Portal atende ex-alunos (ativo = false).
  it('200 — ex-aluno (ativo=false) consegue atualizar o próprio perfil', async () => {
    mockedRepo.findByIdIncludeInactive.mockResolvedValue({
      id_usuario: 5,
      ativo: false,
    });
    await expect(alunoSvc.atualizarPortalAluno(5, { nome: 'Nome' })).resolves.toEqual(
      usuarioAtualizado,
    );
    expect(mockedUsuarioSvc.atualizarDadosPessoais).toHaveBeenCalledWith(
      5,
      expect.objectContaining({ nome: 'Nome' }),
    );
  });

  // conflito 409─

  it('409 — CPF pertence a outro usuário lança ConflictError', async () => {
    mockedUsuarioSvc.buscarPorCpf.mockResolvedValue({
      id_usuario: 99,
      nome: 'Outro',
      email: 'outro@x.com',
      cpf: '000.000.000-00',
      senha: 'hash',
    });
    await expect(alunoSvc.atualizarPortalAluno(1, { cpf: '000.000.000-00' })).rejects.toThrow(
      ConflictError,
    );
    expect(mockedUsuarioSvc.atualizarDadosPessoais).not.toHaveBeenCalled();
  });

  it('409 — email pertence a outro usuário lança ConflictError', async () => {
    mockedUsuarioSvc.buscarPorEmail.mockResolvedValue({
      id_usuario: 99,
      nome: 'Outro',
      email: 'outro@x.com',
      cpf: '000.000.000-00',
      senha: 'hash',
    });
    await expect(alunoSvc.atualizarPortalAluno(1, { email: 'outro@x.com' })).rejects.toThrow(
      ConflictError,
    );
    expect(mockedUsuarioSvc.atualizarDadosPessoais).not.toHaveBeenCalled();
  });

  // erro interno

  it('propaga exceção do repositório sem engolir', async () => {
    mockedRepo.findByIdIncludeInactive.mockRejectedValue(new Error('DB connection failed'));
    await expect(alunoSvc.atualizarPortalAluno(1, { nome: 'Nome' })).rejects.toThrow(
      'DB connection failed',
    );
  });
});
