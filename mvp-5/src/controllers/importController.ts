import { Request, Response } from 'express';
import * as importService from '../services/importService';
import { ValidationError } from '../errors/AppError';

export async function importarJovens(req: Request, res: Response): Promise<void> {
  if (!req.file) {
    throw new ValidationError('Arquivo CSV não enviado.');
  }

  const idUsuario = Number(req.query.id_usuario ?? req.body?.id_usuario);
  if (!Number.isInteger(idUsuario) || idUsuario <= 0) {
    throw new ValidationError('id_usuario é obrigatório (query param: ?id_usuario=X).');
  }

  const conteudo = req.file.buffer.toString('utf-8');
  const resultado = await importService.importarJovens(conteudo, idUsuario);
  res.status(200).json(resultado);
}
