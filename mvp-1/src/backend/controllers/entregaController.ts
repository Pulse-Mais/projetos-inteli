import { Request, Response } from 'express';
import { asyncHandler } from '../helpers/asyncHandler';
import * as svc from '../services/entregaService';

/**
 * GET /alunos/:id/entregas — lista todas as entregas de um aluno.
 * Validação: valida que o aluno existe antes de consultar.
 * Retorna 200 com array de Entrega; 404 se aluno não encontrado.
 */
export const listar = asyncHandler(async (req: Request, res: Response) => {
  const id_aluno = Number(req.params.id);
  const entregas = await svc.listarEntregas(id_aluno);
  res.json(entregas);
});

/**
 * POST /alunos/:id/entregas — registra a entrega de uma atividade pelo aluno.
 * Validação: aluno deve existir; RN04: `data_entrega` não pode ser futura.
 * Retorna 201 com Entrega criada; 400 se data inválida; 404 se aluno não encontrado.
 */
export const registrar = asyncHandler(async (req: Request, res: Response) => {
  const id_aluno = Number(req.params.id);
  const entrega = await svc.registrarEntrega({ ...req.body, id_aluno });
  res.status(201).json(entrega);
});

/**
 * PUT /alunos/:id/entregas/:id_atividade — atualiza uma entrega existente.
 * RN04: se `data_entrega` for enviada, não pode ser futura.
 * Retorna 200 com Entrega atualizada; 400 se data inválida; 404 se aluno ou entrega não encontrados.
 */
export const atualizar = asyncHandler(async (req: Request, res: Response) => {
  const id_aluno = Number(req.params.id);
  const id_atividade = Number(req.params.id_atividade);
  const entrega = await svc.atualizarEntrega(id_aluno, id_atividade, req.body);
  res.json(entrega);
});

/**
 * DELETE /alunos/:id/entregas/:id_atividade — remove uma entrega pela chave composta.
 * Retorna 204 sem corpo; 404 se aluno ou entrega não encontrados.
 */
export const remover = asyncHandler(async (req: Request, res: Response) => {
  const id_aluno = Number(req.params.id);
  const id_atividade = Number(req.params.id_atividade);
  await svc.removerEntrega(id_aluno, id_atividade);
  res.status(204).send();
});
