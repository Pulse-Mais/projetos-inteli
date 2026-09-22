import { Request, Response } from "express";
import { asyncHandler } from "../helpers/asyncHandler";
import * as svc from "../services/mentorService";

/**
 * GET /mentores — lista todos os mentores ativos.
 * Mentores inativos são filtrados no repositório (RN13).
 * Retorna 200 com array de MentorRow.
 */
export const listar = asyncHandler(async (_req: Request, res: Response) => {
  const mentores = await svc.listarMentores();
  res.json(mentores);
});

/**
 * GET /mentores/:id — retorna um mentor ativo pelo ID.
 * Retorna 200 com MentorRow; 404 se não encontrado ou inativo.
 */
export const buscar = asyncHandler(async (req: Request, res: Response) => {
  const mentor = await svc.buscarMentor(Number(req.params.id));
  res.json(mentor);
});

/**
 * GET /mentores/:id/mentorandos — lista os alunos vinculados ao mentor.
 * Retorna 200 com array de MentorandoResumo; 404 se mentor não encontrado.
 */
export const listarMentorandos = asyncHandler(
  async (req: Request, res: Response) => {
    const mentorandos = await svc.listarMentorandos(Number(req.params.id));
    res.json(mentorandos);
  },
);

/**
 * GET /mentores/:id/mentorias?mes=YYYY-MM — lista mentorias realizadas pelo mentor.
 * O parâmetro `mes` é opcional; sem ele retorna todas as mentorias do mentor.
 * Retorna 200 com array; retorna [] se mentor não encontrado (sem lançar 404).
 */
export const listarMentorias = asyncHandler(
  async (req: Request, res: Response) => {
    const id = Number(req.params.id);
    const mes = req.query.mes as string | undefined;
    const mentorias = await svc.listarMentoriasByMentor(id, mes);
    res.json(mentorias);
  },
);

/**
 * POST /mentores — cria um novo mentor.
 * Retorna 201 com MentorRow criado.
 */
export const criar = asyncHandler(async (req: Request, res: Response) => {
  const mentor = await svc.criarMentor(req.body);
  res.status(201).json(mentor);
});

/**
 * PUT /mentores/:id — atualiza dados de um mentor.
 * Retorna 200 com MentorRow atualizado; 404 se não encontrado.
 */
export const atualizar = asyncHandler(async (req: Request, res: Response) => {
  const mentor = await svc.atualizarMentor(Number(req.params.id), req.body);
  res.json(mentor);
});

/**
 * DELETE /mentores/:id — inativa logicamente o mentor (RN13).
 * Não realiza exclusão física; seta ativo=false.
 * Retorna 204 sem corpo; 404 se não encontrado.
 */
export const inativar = asyncHandler(async (req: Request, res: Response) => {
  await svc.inativarMentor(Number(req.params.id));
  res.status(204).send();
});
