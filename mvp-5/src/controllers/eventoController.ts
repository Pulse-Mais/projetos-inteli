import type { Request, Response } from 'express';
import * as eventoService from '../services/eventoService';
import { parseId } from '../helpers/parseId';

export async function listar(req: Request, res: Response): Promise<void> {
  const eventos = await eventoService.listar({
    busca: typeof req.query.busca === 'string' ? req.query.busca : undefined,
    data: typeof req.query.data === 'string' ? req.query.data : undefined,
  });
  res.status(200).json(eventos);
}

export async function buscar(req: Request, res: Response): Promise<void> {
  const evento = await eventoService.buscarPorId(parseId(req.params.id));
  res.status(200).json(evento);
}

export async function criar(req: Request, res: Response): Promise<void> {
  const evento = await eventoService.criar(req.body);
  res.status(201).location(`/api/eventos/${evento.id}`).json(evento);
}

export async function atualizar(req: Request, res: Response): Promise<void> {
  const evento = await eventoService.atualizar(parseId(req.params.id), req.body);
  res.status(200).json(evento);
}

export async function remover(req: Request, res: Response): Promise<void> {
  await eventoService.remover(parseId(req.params.id));
  res.status(204).send();
}
