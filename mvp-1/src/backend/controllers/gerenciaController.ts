import { Request, Response } from "express";
import { asyncHandler } from "../helpers/asyncHandler";
import * as svc from "../services/gerenciaService";

/**
 * GET /gerencias — lista todos os vínculos de gerência (coordenador → programa).
 * Retorna 200 com array de GerenciaRow.
 */
export const listar = asyncHandler(async (_req: Request, res: Response) => {
  const gerencias = await svc.listarGerencias();
  res.json(gerencias);
});

/**
 * GET /gerencias/programa/:id_programa — lista coordenadores que gerenciam um programa.
 * Retorna 200 com array de GerenciaRow.
 */
export const listarPorPrograma = asyncHandler(
  async (req: Request, res: Response) => {
    const id_programa = Number(req.params.id_programa);
    const gerencias = await svc.listarPorPrograma(id_programa);
    res.json(gerencias);
  },
);

/**
 * GET /gerencias/coordenador/:id_coordenador — lista programas gerenciados por um coordenador.
 * Retorna 200 com array de GerenciaRow.
 */
export const listarPorCoordenador = asyncHandler(
  async (req: Request, res: Response) => {
    const id_coordenador = Number(req.params.id_coordenador);
    const gerencias = await svc.listarPorCoordenador(id_coordenador);
    res.json(gerencias);
  },
);

/**
 * POST /gerencias — cria um vínculo de gerência entre coordenador e programa.
 * Validação: impede duplicata (mesmo coordenador + mesmo programa).
 * Retorna 201 com GerenciaRow; 409 se vínculo já existir.
 */
export const criar = asyncHandler(async (req: Request, res: Response) => {
  const gerencia = await svc.criarGerencia(req.body);
  res.status(201).json(gerencia);
});

/**
 * DELETE /gerencias/:id_coordenador/:id_programa — remove o vínculo de gerência pela chave composta.
 * Retorna 204 sem corpo; 404 se não encontrado.
 */
export const deletar = asyncHandler(async (req: Request, res: Response) => {
  const id_coordenador = Number(req.params.id_coordenador);
  const id_programa = Number(req.params.id_programa);
  await svc.deletarGerencia(id_coordenador, id_programa);
  res.status(204).send();
});
