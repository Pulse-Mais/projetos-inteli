import type { Request, Response } from 'express';
import * as service from '../services/empregabilidadeService';
import { parseId } from '../helpers/parseId';

export async function listar(req: Request, res: Response): Promise<void> {
  const id_jovem = parseId(req.params.id, 'id_jovem');
  const historico = await service.obterHistorico(id_jovem);
  res.status(200).json(historico);
}

export async function criar(req: Request, res: Response): Promise<void> {
  const id_jovem = parseId(req.params.id, 'id_jovem');
  const novo = await service.criarRegistro(id_jovem, req.body);
  res.status(201).location(`/api/jovens/${id_jovem}/empregabilidade`).json(novo);
}
