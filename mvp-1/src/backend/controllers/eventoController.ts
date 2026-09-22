import { Request, Response } from 'express';
import { asyncHandler } from '../helpers/asyncHandler';
import * as svc from '../services/eventoService';

/**
 * GET /eventos — lista todos os eventos.
 * Retorna 200 com array de Evento.
 */
export const listar = asyncHandler(async (_req: Request, res: Response) => {
  const eventos = await svc.listarEventos();
  res.json(eventos);
});

/**
 * GET /eventos/:id — retorna um evento pelo ID.
 * Retorna 200 com Evento; 404 se não encontrado.
 */
export const buscar = asyncHandler(async (req: Request, res: Response) => {
  const evento = await svc.buscarEvento(Number(req.params.id));
  res.json(evento);
});

/**
 * POST /eventos — cria um novo evento e notifica todos os alunos ativos por e-mail (RF007).
 * Falhas no envio de e-mail são logadas mas não interrompem a criação.
 * Retorna 201 com Evento criado.
 */
export const criar = asyncHandler(async (req: Request, res: Response) => {
  const evento = await svc.criarEvento(req.body);
  res.status(201).json(evento);
});

/**
 * PUT /eventos/:id — atualiza dados de um evento existente.
 * Retorna 200 com Evento atualizado; 404 se não encontrado.
 */
export const atualizar = asyncHandler(async (req: Request, res: Response) => {
  const evento = await svc.atualizarEvento(Number(req.params.id), req.body);
  res.json(evento);
});

/**
 * DELETE /eventos/:id — remove fisicamente um evento.
 * Retorna 204 sem corpo; 404 se não encontrado.
 */
export const deletar = asyncHandler(async (req: Request, res: Response) => {
  await svc.deletarEvento(Number(req.params.id));
  res.status(204).send();
});
