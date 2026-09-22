import { Request, Response } from "express";
import { asyncHandler } from "../helpers/asyncHandler";
import * as svc from "../services/participaEventoService";

/**
 * GET /participa-evento — lista todas as participações em eventos.
 * Retorna 200 com array de ParticipaEventoRow.
 */
export const listar = asyncHandler(async (_req: Request, res: Response) => {
  const participacoes = await svc.listarParticipacoes();
  res.json(participacoes);
});

/**
 * GET /participa-evento/evento/:id_evento — lista participantes de um evento.
 * Retorna 200 com array de ParticipaEventoRow.
 */
export const listarPorEvento = asyncHandler(
  async (req: Request, res: Response) => {
    const id_evento = Number(req.params.id_evento);
    const participacoes = await svc.listarPorEvento(id_evento);
    res.json(participacoes);
  },
);

/**
 * GET /participa-evento/aluno/:id_aluno — lista eventos de um aluno.
 * Retorna 200 com array de ParticipaEventoRow.
 */
export const listarPorAluno = asyncHandler(
  async (req: Request, res: Response) => {
    const id_aluno = Number(req.params.id_aluno);
    const participacoes = await svc.listarPorAluno(id_aluno);
    res.json(participacoes);
  },
);

/**
 * GET /participa-evento/:id_evento/:id_aluno — retorna uma participação pela chave composta.
 * Retorna 200 com ParticipaEventoRow; 404 se não encontrada.
 */
export const buscar = asyncHandler(async (req: Request, res: Response) => {
  const id_evento = Number(req.params.id_evento);
  const id_aluno = Number(req.params.id_aluno);
  const participacao = await svc.buscarParticipacao(id_evento, id_aluno);
  res.json(participacao);
});

/**
 * POST /participa-evento — registra a participação de um aluno em um evento.
 * Validação: impede duplicata (aluno já registrado no evento).
 * Retorna 201 com ParticipaEventoRow; 409 se já registrado.
 */
export const criar = asyncHandler(async (req: Request, res: Response) => {
  const participacao = await svc.registrarParticipacao(req.body);
  res.status(201).json(participacao);
});

/**
 * PUT /participa-evento/:id_evento/:id_aluno — atualiza o campo `presenca` (RF002).
 * Recebe { presenca: boolean } no body.
 * Retorna 200 com ParticipaEventoRow atualizada; 404 se não encontrada.
 */
export const atualizar = asyncHandler(async (req: Request, res: Response) => {
  const id_evento = Number(req.params.id_evento);
  const id_aluno = Number(req.params.id_aluno);
  const { presenca } = req.body;
  const participacao = await svc.atualizarPresenca(id_evento, id_aluno, presenca);
  res.json(participacao);
});

/**
 * DELETE /participa-evento/:id_evento/:id_aluno — remove a participação de um aluno em um evento.
 * Retorna 204 sem corpo; 404 se não encontrada.
 */
export const deletar = asyncHandler(async (req: Request, res: Response) => {
  const id_evento = Number(req.params.id_evento);
  const id_aluno = Number(req.params.id_aluno);
  await svc.removerParticipacao(id_evento, id_aluno);
  res.status(204).send();
});
