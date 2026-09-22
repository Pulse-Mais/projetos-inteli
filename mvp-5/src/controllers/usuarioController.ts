import type { Request, Response } from 'express';
import * as service from '../services/usuarioService';
import { parseId } from '../helpers/parseId';

export async function listar(_req: Request, res: Response): Promise<void> {
  const usuarios = await service.listarTodos();
  res.status(200).json(usuarios);
}

export async function buscar(req: Request, res: Response): Promise<void> {
  const id = parseId(req.params.id);
  const usuario = await service.buscarPorId(id);
  res.status(200).json(usuario);
}

export async function criar(req: Request, res: Response): Promise<void> {
  const usuario = await service.criar(req.body);
  res
    .status(201)
    .location(`/api/usuarios/${usuario.id}`)
    .json(usuario);
}

export async function atualizar(req: Request, res: Response): Promise<void> {
  const id = parseId(req.params.id);
  const usuario = await service.atualizar(id, req.body);
  res.status(200).json(usuario);
}

export async function remover(req: Request, res: Response): Promise<void> {
  const id = parseId(req.params.id);
  await service.remover(id);
  res.status(204).send();
}