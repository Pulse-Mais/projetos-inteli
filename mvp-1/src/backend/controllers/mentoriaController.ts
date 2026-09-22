import { Request, Response } from 'express';
import { asyncHandler } from '../helpers/asyncHandler';
import * as svc from '../services/mentoriaService';

/**
 * GET /mentorias?id_aluno=<id> — lista mentorias, com filtro opcional por aluno.
 * Sem `id_aluno` retorna todas as mentorias; com ele, retorna apenas as do aluno.
 * Retorna 200 com array de Mentoria.
 */
export const listar = asyncHandler(async (req: Request, res: Response) => {
  const idAluno = req.query.id_aluno ? Number(req.query.id_aluno) : undefined;
  if (idAluno) {
    const mentorias = await svc.listarMentoriasDoAluno(idAluno);
    res.json(mentorias);
  } else {
    const mentorias = await svc.listarMentorias();
    res.json(mentorias);
  }
});

/**
 * GET /mentorias/:id — retorna uma mentoria pelo ID.
 * Retorna 200 com Mentoria; 404 se não encontrada.
 */
export const buscar = asyncHandler(async (req: Request, res: Response) => {
  const mentoria = await svc.buscarMentoria(Number(req.params.id));
  res.json(mentoria);
});

/**
 * POST /mentorias — cria uma mentoria e os registros auxiliares (realiza, participa_mentoria).
 * RN11: exige mentor ativo, aluno ativo e vínculo em `acompanha` entre os dois.
 * Retorna 201 com Mentoria; 400 se mentor ou aluno inativos ou sem vínculo; 404 se não encontrados.
 */
export const criar = asyncHandler(async (req: Request, res: Response) => {
  const mentoria = await svc.criarMentoria(req.body);
  res.status(201).json(mentoria);
});

/**
 * PUT /mentorias/:id — atualiza dados de uma mentoria existente.
 * Retorna 200 com Mentoria atualizada; 404 se não encontrada.
 */
export const atualizar = asyncHandler(async (req: Request, res: Response) => {
  const mentoria = await svc.atualizarMentoria(Number(req.params.id), req.body);
  res.json(mentoria);
});

/**
 * DELETE /mentorias/:id — exclui fisicamente a mentoria.
 * Mentoria não usa inativação lógica.
 * Retorna 204 sem corpo; 404 se não encontrada.
 */
export const deletar = asyncHandler(async (req: Request, res: Response) => {
  await svc.deletarMentoria(Number(req.params.id));
  res.status(204).send();
});
