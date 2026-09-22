// Importações e configurações iniciais de dependências
import type { Request, Response } from 'express';
import * as service from '../services/registroService';
import type { CriarRegistroInput, AtualizarRegistroInput } from '../models/registroAcompanhamento';
import { ValidationError } from '../errors/AppError';
import { parseId } from '../helpers/parseId';

// Função que atua como o endpoint GET para buscar o prontuário do jovem
export async function listar(req: Request, res: Response): Promise<void> {
  const idJovem = parseId(req.params.id, 'id_jovem');
  const idUsuario = Number(req.query.id_usuario);
  if (!Number.isInteger(idUsuario) || idUsuario <= 0) {
    throw new ValidationError('id_usuario é obrigatório como query param');
  }

  const registros = await service.listar(idJovem, idUsuario);
  res.status(200).json(registros);
}

// Função que atua como o endpoint POST para a inserção de um novo registro no prontuário
export async function criar(req: Request, res: Response): Promise<void> {
  const idJovem = parseId(req.params.id, 'id_jovem');
  const idUsuario = Number((req.body as { id_autor?: number }).id_autor ?? req.query.id_usuario);
  if (!Number.isInteger(idUsuario) || idUsuario <= 0) {
    throw new ValidationError('id_autor é obrigatório no body ou id_usuario no query param');
  }

  const registro = await service.criar(idJovem, idUsuario, req.body as CriarRegistroInput);
  res
    .status(201)
    .location(`/api/jovens/${idJovem}/prontuario/${registro.id}`)
    .json(registro);
}

// Função que atua como o endpoint PUT para a atualização de um registro
export async function atualizar(req: Request, res: Response): Promise<void> {
  const idRegistro = parseId(req.params.registroId, 'registroId');
  const idUsuario = Number((req.body as { id_usuario?: number }).id_usuario ?? req.query.id_usuario);
  if (!Number.isInteger(idUsuario) || idUsuario <= 0) {
    throw new ValidationError('id_usuario é obrigatório');
  }

  const atualizado = await service.atualizar(idRegistro, idUsuario, req.body as AtualizarRegistroInput);
  res.status(200).json(atualizado);
}