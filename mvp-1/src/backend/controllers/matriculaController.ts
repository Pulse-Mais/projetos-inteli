import { Request, Response } from "express";
import { asyncHandler } from "../helpers/asyncHandler";
import * as svc from "../services/matriculaService";

/**
 * GET /matriculas — lista todas as matrículas, ordenadas por data de ingresso decrescente.
 * Retorna 200 com array de MatriculaRow.
 */
export const listar = asyncHandler(async (_req: Request, res: Response) => {
  const matriculas = await svc.listarMatriculas();
  res.json(matriculas);
});

/**
 * GET /matriculas/aluno/:id_aluno — lista matrículas de um aluno específico.
 * Retorna 200 com array de MatriculaRow.
 */
export const listarPorAluno = asyncHandler(
  async (req: Request, res: Response) => {
    const id_aluno = Number(req.params.id_aluno);
    const matriculas = await svc.listarPorAluno(id_aluno);
    res.json(matriculas);
  },
);

/**
 * GET /matriculas/programa/:id_programa — lista matrículas de um programa específico.
 * Retorna 200 com array de MatriculaRow.
 */
export const listarPorPrograma = asyncHandler(
  async (req: Request, res: Response) => {
    const id_programa = Number(req.params.id_programa);
    const matriculas = await svc.listarPorPrograma(id_programa);
    res.json(matriculas);
  },
);

/**
 * GET /matriculas/:id_programa/:id_aluno — retorna uma matrícula pela chave composta.
 * Retorna 200 com MatriculaRow; 404 se não encontrada.
 */
export const buscar = asyncHandler(async (req: Request, res: Response) => {
  const id_programa = Number(req.params.id_programa);
  const id_aluno = Number(req.params.id_aluno);
  const matricula = await svc.buscarMatricula(id_programa, id_aluno);
  res.json(matricula);
});

/**
 * POST /matriculas — cria uma matrícula de aluno em programa.
 * Validação: impede matrícula duplicada no mesmo programa.
 * Retorna 201 com MatriculaRow; 409 se já matriculado.
 */
export const criar = asyncHandler(async (req: Request, res: Response) => {
  const matricula = await svc.criarMatricula(req.body);
  res.status(201).json(matricula);
});

/**
 * PUT /matriculas/:id_programa/:id_aluno — atualiza status_conclusao ou data_ingresso.
 * Retorna 200 com MatriculaRow atualizada; 404 se não encontrada.
 */
export const atualizar = asyncHandler(async (req: Request, res: Response) => {
  const id_programa = Number(req.params.id_programa);
  const id_aluno = Number(req.params.id_aluno);
  const matricula = await svc.atualizarMatricula(id_programa, id_aluno, req.body);
  res.json(matricula);
});

/**
 * DELETE /matriculas/:id_programa/:id_aluno — remove fisicamente uma matrícula.
 * Retorna 204 sem corpo; 404 se não encontrada.
 */
export const deletar = asyncHandler(async (req: Request, res: Response) => {
  const id_programa = Number(req.params.id_programa);
  const id_aluno = Number(req.params.id_aluno);
  await svc.deletarMatricula(id_programa, id_aluno);
  res.status(204).send();
});
