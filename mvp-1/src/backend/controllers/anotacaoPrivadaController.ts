import { Request, Response } from "express";
import { asyncHandler } from "../helpers/asyncHandler";
import * as svc from "../services/anotacaoPrivadaService";

/**
 * GET /anotacoes/aluno/:id_aluno — lista todas as anotações de um aluno (visão do coordenador).
 * RN13: coordenador vê anotações de todos os mentores sobre o aluno.
 * Retorna 200 com array de AnotacaoPrivadaRow ordenado por data desc.
 */
export const listarPorAluno = asyncHandler(
  async (req: Request, res: Response) => {
    const id_aluno = Number(req.params.id_aluno);
    const anotacoes = await svc.listarPorAluno(id_aluno);
    res.json(anotacoes);
  },
);

/**
 * GET /anotacoes/aluno/:id_aluno/mentor/:id_mentor — lista anotações de um mentor sobre um aluno.
 * RN13: mentor vê apenas suas próprias anotações; não acessa as de outros mentores.
 * Retorna 200 com array de AnotacaoPrivadaRow.
 */
export const listarPorAlunoEMentor = asyncHandler(
  async (req: Request, res: Response) => {
    const id_aluno = Number(req.params.id_aluno);
    const id_mentor = Number(req.params.id_mentor);
    const anotacoes = await svc.listarPorAlunoEMentor(id_aluno, id_mentor);
    res.json(anotacoes);
  },
);

/**
 * GET /anotacoes/mentor/:id_mentor — lista todas as anotações feitas por um mentor.
 * RF013: área somente leitura do mentor (visualiza anotações sobre todos os mentorandos).
 * Retorna 200 com array de AnotacaoPrivadaRow.
 */
export const listarPorMentor = asyncHandler(
  async (req: Request, res: Response) => {
    const id_mentor = Number(req.params.id_mentor);
    const anotacoes = await svc.listarPorMentor(id_mentor);
    res.json(anotacoes);
  },
);

/**
 * POST /anotacoes — registra uma observação qualitativa do mentor sobre um mentorando (RF012).
 * Body: { id_mentor, id_aluno, conteudo_texto }.
 * Retorna 201 com AnotacaoPrivadaRow criada.
 */
export const criar = asyncHandler(async (req: Request, res: Response) => {
  const anotacao = await svc.criarAnotacao(req.body);
  res.status(201).json(anotacao);
});

/**
 * DELETE /anotacoes/mentor/:id_mentor/aluno/:id_aluno?data=<ISO> — remove anotação pela chave composta.
 * RN13: somente o mentor autor ou o coordenador pode remover.
 * Query param `data` obrigatório (timestamp ISO da anotação).
 * Retorna 204 sem corpo; 404 se não encontrada.
 */
export const deletar = asyncHandler(async (req: Request, res: Response) => {
  const id_mentor = Number(req.params.id_mentor);
  const id_aluno = Number(req.params.id_aluno);
  const data_registro = req.query.data as string;
  await svc.deletarAnotacao(id_mentor, id_aluno, data_registro);
  res.status(204).send();
});
