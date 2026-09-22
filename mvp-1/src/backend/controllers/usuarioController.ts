import { Request, Response } from 'express';
import { asyncHandler } from '../helpers/asyncHandler';
import { BadRequestError, NotFoundError } from '../errors/AppError';
import * as svc from '../services/usuarioService';

/**
 * GET /usuarios — lista todos os usuários.
 * Retorna 200 com array de Usuario (sem senha).
 */
export const listar = asyncHandler(async (_req: Request, res: Response) => {
  const usuarios = await svc.listarUsuarios();
  res.json(usuarios);
});

/**
 * GET /usuarios/:id — retorna um usuário pelo ID, incluindo dados de coordenador se aplicável.
 * Retorna 200 com Usuario; 404 se não encontrado.
 */
export const buscar = asyncHandler(async (req: Request, res: Response) => {
  const usuario = await svc.buscarUsuario(Number(req.params.id));
  res.json(usuario);
});

/**
 * POST /usuarios — cria um novo usuário.
 * RN01: CPF e e-mail devem ser únicos.
 * Retorna 201 com Usuario; 409 se CPF ou e-mail duplicados.
 */
export const criar = asyncHandler(async (req: Request, res: Response) => {
  const usuario = await svc.criarUsuario(req.body);
  res.status(201).json(usuario);
});

/**
 * PUT /usuarios/:id — atualiza dados de um usuário e, opcionalmente, campos de coordenador.
 * Campos de coordenador (area, telefone, cargo, data_admissao, cidade/estado_nascimento)
 * são gravados em tabela separada.
 * Retorna 200 com Usuario atualizado; 400 se CPF/e-mail duplicados; 404 se não encontrado.
 */
export const atualizar = asyncHandler(async (req: Request, res: Response) => {
  const usuario = await svc.atualizarUsuario(Number(req.params.id), req.body);
  res.json(usuario);
});

/**
 * DELETE /usuarios/:id — remove fisicamente um usuário.
 * Retorna 204 sem corpo; 404 se não encontrado.
 */
export const deletar = asyncHandler(async (req: Request, res: Response) => {
  await svc.deletarUsuario(Number(req.params.id));
  res.status(204).send();
});

/**
 * GET /usuarios/login?email=<e-mail> — autentica coordenador por e-mail.
 * Requer INNER JOIN com tabela `coordenador`; rejeita alunos e mentores.
 * Retorna 200 com Usuario; 400 se e-mail ausente; 404 se não encontrado ou sem perfil de coordenador.
 */
export const loginPorEmail = asyncHandler(async (req: Request, res: Response) => {
  const email = (req.query.email as string || '').trim();
  if (!email) throw new BadRequestError('E-mail é obrigatório');
  const usuario = await svc.loginCoordenador(email);
  if (!usuario) throw new NotFoundError('E-mail não encontrado ou sem acesso de coordenador');
  res.json(usuario);
});
