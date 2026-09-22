import { Request, Response } from "express";
import { asyncHandler } from "../helpers/asyncHandler";
import * as svc from "../services/acompanhaService";

/**
 * POST /acompanha — cria o vínculo de acompanhamento entre mentor, aluno e programa.
 * Validação: mentor deve estar ativo, aluno deve estar ativo, programa deve existir,
 * e o vínculo exato (mentor + aluno + programa) não pode ser duplicado.
 * Retorna 201 com Acompanha; 400 se mentor ou aluno inativos; 404 se não encontrados; 409 se duplicado.
 */
export const criar = asyncHandler(async (req: Request, res: Response) => {
  const vinculo = await svc.criarAcompanha(req.body);
  res.status(201).json(vinculo);
});

/**
 * DELETE /acompanha/:id_mentor/:id_aluno/:id_programa — remove o vínculo pela chave composta.
 * Retorna 204 sem corpo; 404 se não encontrado.
 */
export const remover = asyncHandler(async (req: Request, res: Response) => {
  const idMentor = Number(req.params.id_mentor);
  const idAluno = Number(req.params.id_aluno);
  const idPrograma = Number(req.params.id_programa);
  await svc.removerAcompanha(idMentor, idAluno, idPrograma);
  res.status(204).send();
});

/**
 * GET /acompanha/aluno/:id_aluno — lista todos os vínculos de acompanhamento de um aluno.
 * Retorna 200 com array de Acompanha (contendo id_mentor e id_programa por linha).
 */
export const listarPorAluno = asyncHandler(
  async (req: Request, res: Response) => {
    const idAluno = Number(req.params.id_aluno);
    const vinculos = await svc.listarPorAluno(idAluno);
    res.json(vinculos);
  },
);
