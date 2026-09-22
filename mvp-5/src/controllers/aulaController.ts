import type { Request, Response } from 'express';
import * as aulaService from '../services/aulaService';
import { parseId } from '../helpers/parseId';

export async function listar(req: Request, res: Response): Promise<void> {
  const aulas = await aulaService.listar({
    id_programa:
      req.query.id_programa === undefined
        ? undefined
        : Number(req.query.id_programa),
    busca: typeof req.query.busca === 'string' ? req.query.busca : undefined,
    data: typeof req.query.data === 'string' ? req.query.data : undefined,
  });
  res.status(200).json(aulas);
}

export async function buscar(req: Request, res: Response): Promise<void> {
  const aula = await aulaService.buscarPorId(parseId(req.params.id));
  res.status(200).json(aula);
}

export async function criar(req: Request, res: Response): Promise<void> {
  const aula = await aulaService.criar(req.body);
  res.status(201).location(`/api/aulas/${aula.id}`).json(aula);
}

export async function atualizar(req: Request, res: Response): Promise<void> {
  const aula = await aulaService.atualizar(parseId(req.params.id), req.body);
  res.status(200).json(aula);
}

export async function remover(req: Request, res: Response): Promise<void> {
  await aulaService.remover(parseId(req.params.id));
  res.status(204).send();
}
